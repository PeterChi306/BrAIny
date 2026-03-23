import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generateHint } from '@/lib/gemini'
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
      console.error('HINT API ERROR: GEMINI_API_KEY is not set')
      return NextResponse.json(
        { error: 'AI service is not configured. GEMINI_API_KEY is missing.' },
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
      console.error('HINT API ERROR: Session error', sessionError)
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

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('HINT API ERROR: JSON parse error', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { question, mode, subject } = body

    // Validate required fields
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid "question" field. Question must be a non-empty string.' },
        { status: 400 }
      )
    }

    // Validate mode if provided
    if (mode !== undefined) {
      const validModes: TutorMode[] = ['explain', 'practice', 'quiz', 'review']
      if (typeof mode !== 'string' || !validModes.includes(mode as TutorMode)) {
        return NextResponse.json(
          { error: `Invalid mode. Must be one of: ${validModes.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Load user profile for personalization (non-blocking if it fails)
    let profile = null
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (profileError) {
        console.warn('HINT API: Could not load profile', profileError.message)
        // Continue without profile - not a critical error
      } else {
        profile = profileData
      }
    } catch (profileErr) {
      console.warn('HINT API: Profile fetch exception', profileErr)
      // Continue without profile
    }

    // Generate hint
    const hint = await generateHint(question.trim(), {
      mode: (mode as TutorMode) || 'explain',
      subject: subject || undefined,
      profile: profile || undefined,
    })

    return NextResponse.json({ text: hint })
  } catch (error: any) {
    console.error('HINT API ERROR:', error)
    
    // Return the actual error message for debugging
    const errorMessage = error?.message || error?.toString() || 'Failed to generate hint'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

