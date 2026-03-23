import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { generateTutorResponse } from '@/lib/gemini'
import { updateStudyStreak } from '@/lib/streak'
import type { TutorMode } from '@/types/database'

// Handle non-POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}

export async function POST(request: NextRequest) {
  try {
    // Check Gemini API key early
    if (!process.env.GEMINI_API_KEY) {
      console.error('CHAT API ERROR: GEMINI_API_KEY is not set')
      return NextResponse.json(
        { error: 'GEMINI_API_KEY missing at runtime' },
        { status: 500 }
      )
    }

    // Authenticate user
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('CHAT API ERROR: Session error', sessionError)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('CHAT API ERROR: JSON parse error', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { message, mode, subject, conversationHistory } = body

    // Validate required fields
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid "message" field. Message must be a non-empty string.' },
        { status: 400 }
      )
    }

    if (!mode || typeof mode !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "mode" field. Mode must be a string.' },
        { status: 400 }
      )
    }

    // Validate mode is a valid TutorMode
    const validModes: TutorMode[] = ['explain', 'practice', 'quiz', 'review']
    if (!validModes.includes(mode as TutorMode)) {
      return NextResponse.json(
        { error: `Invalid mode. Must be one of: ${validModes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate conversationHistory if provided
    if (conversationHistory !== undefined && !Array.isArray(conversationHistory)) {
      return NextResponse.json(
        { error: 'conversationHistory must be an array' },
        { status: 400 }
      )
    }

    // Note: Model test removed - will use model from lib/gemini.ts
    // If model doesn't work, the error will be caught and returned below

    // Load user profile and subscription for personalization
    let profile = null
    let userTier = 'free'
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (profileError) {
        console.warn('CHAT API: Could not load profile', profileError.message)
      } else {
        profile = profileData
      }

      // Load user subscription tier
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!subscriptionError && subscriptionData) {
        userTier = subscriptionData.tier
      }
    } catch (err) {
      console.warn('CHAT API: Profile/subscription fetch exception', err)
    }

    // Generate AI response using the helper function with tier
    const response = await generateTutorResponse(message.trim(), {
      mode: mode as TutorMode,
      subject: subject || undefined,
      profile: profile || undefined,
      conversationHistory: conversationHistory || [],
      userTier: userTier as 'free' | 'pro' | 'master',
    })

    // 💾 SAVE MESSAGES TO DATABASE for XP tracking
    try {
      // Create or get chat session
      let sessionId = null
      if (conversationHistory && conversationHistory.length > 0) {
        // Try to find existing session (simplified - just create new for now)
        const { data: newSession } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: session.user.id,
            title: subject || 'Chat Session',
            subject: subject || 'General',
            mode: mode || 'tutor',
            message_count: 2,
            last_message_at: new Date().toISOString()
          })
          .select('id')
          .single()
        
        sessionId = newSession?.id
      }

      // Save user message
      await supabase
        .from('chat_messages')
        .insert({
          user_id: session.user.id,
          session_id: sessionId,
          role: 'user',
          content: message.trim(),
          created_at: new Date().toISOString()
        })

      // Save AI response
      await supabase
        .from('chat_messages')
        .insert({
          user_id: session.user.id,
          session_id: sessionId,
          role: 'assistant',
          content: response,
          created_at: new Date().toISOString()
        })

      console.log('💾 Messages saved to database for XP tracking')
    } catch (dbError) {
      console.warn('CHAT API: Failed to save messages to database', dbError)
      // Don't fail the request, just log the error
    }

    // Update study streak for chat action
    try {
      await updateStudyStreak(session.user.id, 'chat')
    } catch (streakError) {
      console.warn('CHAT API: Failed to update study streak', streakError)
    }

    return NextResponse.json({ text: response })
  } catch (error: any) {
    console.error('GEMINI ERROR:', error)
    
    // Always return the real error message, never mask it
    const errorMessage = error?.message || error?.toString() || 'Failed to generate response'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

