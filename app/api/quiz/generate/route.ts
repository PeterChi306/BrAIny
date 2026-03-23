import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generateTutorResponse } from '@/lib/gemini'
import { EnhancedPromptBuilder } from '@/lib/ai/enhanced-prompt'
import type { TutorMode } from '@/types/database'

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
    const { topic, subject, difficulty = 'medium', numQuestions = 5 } = body

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    // Load profile for personalization
    let profile = null
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()
      profile = profileData
    } catch (err) {
      console.warn('Could not load profile for quiz generation')
    }

    // Generate quiz using Enhanced Prompt System for topic-relevant content
    const userContext = {
      displayName: profile?.display_name || 'Student',
      interests: profile?.interests || [],
      hobbies: profile?.hobbies || [],
      learningStyle: profile?.learning_style || 'visual',
      gradeLevel: profile?.grade_level || '9th grade',
      subjects: subject ? [subject] : [],
      weakSpots: profile?.weak_spots || [],
      masteredTopics: profile?.mastered_topics || []
    }

    // Create enhanced prompt builder for quiz mode
    const promptBuilder = new EnhancedPromptBuilder(userContext, [], 'quiz')
    
    // Build the enhanced quiz prompt
    const enhancedPrompt = promptBuilder.buildEnhancedPrompt(
      `Generate a ${difficulty} quiz with exactly ${numQuestions} multiple-choice questions about "${topic}"${subject ? ` in ${subject}` : ''}.`
    )

    console.log('🎯 Enhanced Quiz Generation:')
    console.log('Topic:', topic)
    console.log('Subject:', subject)
    console.log('Difficulty:', difficulty)
    console.log('Questions:', numQuestions)
    console.log('User Context:', userContext)

    const quizText = await generateTutorResponse(enhancedPrompt, {
      mode: 'quiz',
      subject: subject || undefined,
      profile: profile || undefined,
    })

    // Check token usage before generating (quiz generation uses tokens)
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

    // Record token usage for quiz generation
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

    // Parse the quiz text into structured questions
    const questions = parseQuizText(quizText, numQuestions)

    // Create quiz in database
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        user_id: session.user.id,
        topic,
        subject: subject || null,
        difficulty,
        total_questions: questions.length,
        status: 'in_progress',
      })
      .select()
      .single()

    if (quizError) throw quizError

    // Insert questions
    const questionsToInsert = questions.map((q, idx) => ({
      quiz_id: quiz.id,
      question_text: q.question,
      options: q.options,
      correct_answer: q.correctAnswer,
      question_number: idx + 1,
      explanation: q.explanation,
    }))

    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questionsToInsert)

    if (questionsError) throw questionsError

    return NextResponse.json({ quiz, questions })
  } catch (error: any) {
    console.error('Quiz generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate quiz' },
      { status: 500 }
    )
  }
}

function parseQuizText(text: string, expectedCount: number): Array<{
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}> {
  const questions: Array<{
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
  }> = []

  console.log('🔍 Parsing Quiz Text:', text.substring(0, 200) + '...')

  // Try enhanced format first: Q1:, Q2:, etc.
  const questionBlocks = text.split(/Q\d+:/i).slice(1)

  if (questionBlocks.length > 0) {
    console.log('✅ Using enhanced format parsing')
    
    for (const block of questionBlocks) {
      try {
        const lines = block.split('\n').filter(l => l.trim())
        
        const question = lines[0]?.trim() || ''
        const options: string[] = []
        let correctAnswer = 0
        let explanation = ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (/^[a-d]\)/.test(trimmed)) {
            options.push(trimmed.replace(/^[a-d]\)\s*/, ''))
          } else if (/^A\d+:/.test(trimmed)) {
            const letter = trimmed.match(/^A\d+:\s*([a-d])/i)?.[1]
            if (letter) {
              correctAnswer = letter.charCodeAt(0) - 97 // a=0, b=1, c=2, d=3
            }
          }
        }

        if (question && options.length === 4) {
          questions.push({ question, options, correctAnswer, explanation: '' })
          console.log(`✅ Parsed question: ${question.substring(0, 50)}...`)
        }
      } catch (err) {
        console.warn('Error parsing enhanced question block:', err)
      }
    }
  } else {
    // Fallback to original format
    console.log('⚠️ Using fallback format parsing')
    const fallbackBlocks = text.split(/QUESTION \d+:/i).slice(1)

    for (const block of fallbackBlocks) {
      try {
        const lines = block.split('\n').filter(l => l.trim())
        
        const question = lines[0]?.trim() || ''
        const options: string[] = []
        let correctAnswer = 0
        let explanation = ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (/^[A-D]\)/.test(trimmed)) {
            options.push(trimmed.replace(/^[A-D]\)\s*/, ''))
          } else if (trimmed.startsWith('CORRECT:')) {
            const letter = trimmed.match(/CORRECT:\s*([A-D])/i)?.[1]
            if (letter) {
              correctAnswer = letter.charCodeAt(0) - 65 // A=0, B=1, C=2, D=3
            }
          } else if (trimmed.startsWith('EXPLANATION:')) {
            explanation = trimmed.replace(/EXPLANATION:\s*/i, '')
          }
        }

        if (question && options.length === 4 && explanation) {
          questions.push({ question, options, correctAnswer, explanation })
        }
      } catch (err) {
        console.warn('Error parsing fallback question block:', err)
      }
    }
  }

  console.log(`🎯 Parsed ${questions.length} questions out of ${expectedCount} expected`)
  return questions.slice(0, expectedCount)
}

