/**
 * Example: Production-Grade API Route Using New Gemini Service
 * 
 * This shows how to use the new model management system in your API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generateTutorResponse, generateHint } from './service'
import type { TutorMode } from '@/types/database'
import type { SubscriptionTier } from './models'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get user's subscription tier (BACKEND-ONLY, frontend never controls this)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', session.user.id)
      .maybeSingle()

    const tier: SubscriptionTier = subscription?.tier || 'free'

    // 3. Parse and validate request
    const body = await request.json()
    const { message, mode, subject, conversationHistory } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid message' },
        { status: 400 }
      )
    }

    // 4. Load user profile (optional, for personalization)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()

    // 5. Generate response using tier-appropriate model
    // Model selection is AUTOMATIC based on tier - frontend never sees model name
    const response = await generateTutorResponse(
      message.trim(),
      {
        mode: (mode as TutorMode) || 'explain',
        subject: subject || undefined,
        profile: profile || undefined,
        conversationHistory: conversationHistory || [],
      },
      tier // Backend determines model from tier
    )

    return NextResponse.json({ text: response })
  } catch (error: any) {
    console.error('API ERROR:', error)
    
    // Return helpful error messages
    if (error.message?.includes('Quota exceeded')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }
    
    if (error.message?.includes('No API key')) {
      return NextResponse.json(
        { error: 'AI service is temporarily unavailable.' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: 500 }
    )
  }
}

/**
 * Example: Hint endpoint with tier-based model selection
 */
export async function POST_HINT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tier (backend-only)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', session.user.id)
      .maybeSingle()

    const tier: SubscriptionTier = subscription?.tier || 'free'

    const body = await request.json()
    const { question, mode, subject } = body

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Missing question' },
        { status: 400 }
      )
    }

    // Load profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()

    // Generate hint - model selected automatically
    const hint = await generateHint(
      question,
      {
        mode: (mode as TutorMode) || 'explain',
        subject: subject || undefined,
        profile: profile || undefined,
      },
      tier
    )

    return NextResponse.json({ text: hint })
  } catch (error: any) {
    console.error('HINT API ERROR:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate hint' },
      { status: 500 }
    )
  }
}

