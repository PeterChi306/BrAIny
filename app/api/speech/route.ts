import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { SpeechSettings } from '@/types/learning-plans'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: settings, error } = await supabase
      .from('speech_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found error
      console.error('Error fetching speech settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Return default settings if none exist
    const defaultSettings: SpeechSettings = {
      id: '',
      user_id: user.id,
      enabled: false,
      voice_type: 'neutral',
      speech_rate: 1.0,
      volume: 1.0,
      auto_speak_explanations: true,
      auto_speak_feedback: true,
      pause_during_input: true,
      daily_limit_minutes: 30,
      used_minutes_today: 0
    }

    return NextResponse.json({ settings: settings || defaultSettings })
  } catch (error) {
    console.error('Error in speech GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      enabled, 
      voice_type, 
      speech_rate, 
      volume, 
      auto_speak_explanations, 
      auto_speak_feedback, 
      pause_during_input,
      daily_limit_minutes 
    } = body

    // Check user's subscription tier for limits
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .single()

    const tier = subscription?.tier || 'free'
    
    // Apply tier-based limits
    let maxDailyMinutes = 30 // Free tier default
    if (tier === 'pro') {
      maxDailyMinutes = 120
    } else if (tier === 'master') {
      maxDailyMinutes = 999 // Unlimited
    }

    const actualDailyLimit = Math.min(daily_limit_minutes || maxDailyMinutes, maxDailyMinutes)

    const { data: settings, error } = await supabase
      .from('speech_settings')
      .upsert({
        user_id: user.id,
        enabled: enabled || false,
        voice_type: voice_type || 'neutral',
        speech_rate: speech_rate || 1.0,
        volume: volume || 1.0,
        auto_speak_explanations: auto_speak_explanations !== false,
        auto_speak_feedback: auto_speak_feedback !== false,
        pause_during_input: pause_during_input !== false,
        daily_limit_minutes: actualDailyLimit
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating speech settings:', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error in speech PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { text, options = {} } = body

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Get user's speech settings
    const { data: settings } = await supabase
      .from('speech_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!settings || !settings.enabled) {
      return NextResponse.json({ error: 'Speech is disabled' }, { status: 400 })
    }

    // Check daily usage limit
    if (settings.used_minutes_today >= settings.daily_limit_minutes) {
      return NextResponse.json({ 
        error: 'Daily speech limit reached',
        remaining: 0,
        limit: settings.daily_limit_minutes
      }, { status: 429 })
    }

    // Estimate speaking time
    const wordsPerMinute = 150 * settings.speech_rate
    const words = text.split(/\s+/).length
    const estimatedMinutes = Math.ceil(words / wordsPerMinute)

    if (settings.used_minutes_today + estimatedMinutes > settings.daily_limit_minutes) {
      return NextResponse.json({ 
        error: 'Insufficient minutes remaining',
        remaining: settings.daily_limit_minutes - settings.used_minutes_today,
        required: estimatedMinutes
      }, { status: 429 })
    }

    // Update usage
    const newUsage = settings.used_minutes_today + estimatedMinutes
    await supabase
      .from('speech_settings')
      .update({ used_minutes_today: newUsage })
      .eq('user_id', user.id)

    return NextResponse.json({ 
      success: true,
      estimatedMinutes,
      remainingMinutes: settings.daily_limit_minutes - newUsage,
      settings
    })
  } catch (error) {
    console.error('Error in speech POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
