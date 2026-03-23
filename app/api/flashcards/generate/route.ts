import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generateTutorResponse } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY missing' },
        { status: 500 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { topic, subject, content, numCards = 5 } = body

    if (!topic && !content) {
      return NextResponse.json(
        { error: 'Topic or content is required' },
        { status: 400 }
      )
    }

    // Load profile
    let profile = null
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()
      profile = profileData
    } catch (err) {
      console.warn('Could not load profile')
    }

    // Generate flashcards (THIS USES TOKENS - ONE TIME ONLY)
    // After generation, flashcards are stored and can be reviewed without tokens
    const prompt = content
      ? `Based on this content, create ${numCards} flashcards focusing on key definitions, formulas, and concepts:\n\n${content}\n\nFormat each card EXACTLY like this:\nCARD 1:\nFRONT: [question or term]\nBACK: [definition or explanation]\n\nRepeat for all ${numCards} cards.`
      : `Create ${numCards} flashcards about "${topic}"${subject ? ` in ${subject}` : ''} focusing on key definitions, formulas, and concepts.\n\nFormat each card EXACTLY like this:\nCARD 1:\nFRONT: [question or term]\nBACK: [definition or explanation]\n\nRepeat for all ${numCards} cards. Make them appropriate for 9th grade level.`

    // Check token usage before generating
    const { data: usageData } = await supabase
      .from('daily_usage')
      .select('ai_messages_count')
      .eq('user_id', session.user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .maybeSingle()

    const currentUsage = usageData?.ai_messages_count || 0
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', session.user.id)
      .maybeSingle()

    const tier = subData?.tier || 'free'
    const limits = {
      free: 20,
      pro: 100,
      master: Infinity,
    }
    const limit = limits[tier as keyof typeof limits] || 20

    if (tier !== 'master' && currentUsage >= limit) {
      return NextResponse.json(
        { error: `Daily token limit reached (${limit}). Upgrade or wait for reset.` },
        { status: 429 }
      )
    }

    const cardsText = await generateTutorResponse(prompt, {
      mode: 'review',
      subject: subject || undefined,
      profile: profile || undefined,
    })

    // Record token usage for flashcard generation
    await supabase
      .from('daily_usage')
      .upsert(
        {
          user_id: session.user.id,
          date: new Date().toISOString().split('T')[0],
          ai_messages_count: currentUsage + 1,
        },
        { onConflict: 'user_id,date' }
      )

    // Parse flashcards
    const flashcards = parseFlashcardText(cardsText, numCards)

    // Save to database
    const cardsToInsert = flashcards.map(card => ({
      user_id: session.user.id,
      front_text: card.front,
      back_text: card.back,
      subject: subject || null,
      topic: topic || null,
      difficulty: 'medium' as const,
      next_review_at: new Date().toISOString(),
    }))

    const { data: savedCards, error: insertError } = await supabase
      .from('flashcards')
      .insert(cardsToInsert)
      .select()

    if (insertError) throw insertError

    return NextResponse.json({ flashcards: savedCards })
  } catch (error: any) {
    console.error('Flashcard generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate flashcards' },
      { status: 500 }
    )
  }
}

function parseFlashcardText(text: string, expectedCount: number): Array<{
  front: string
  back: string
}> {
  const cards: Array<{ front: string; back: string }> = []

  const cardBlocks = text.split(/CARD \d+:/i).slice(1)

  for (const block of cardBlocks) {
    try {
      const frontMatch = block.match(/FRONT:\s*([\s\S]+?)(?=\nBACK:|\n\n|$)/i)
      const backMatch = block.match(/BACK:\s*([\s\S]+?)(?=\nCARD|\n\n|$)/i)

      if (frontMatch && backMatch) {
        cards.push({
          front: frontMatch[1].trim(),
          back: backMatch[1].trim(),
        })
      }
    } catch (err) {
      console.warn('Error parsing flashcard block:', err)
    }
  }

  return cards.slice(0, expectedCount)
}

