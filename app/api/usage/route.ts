import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getTodayUsage } from '@/lib/daily-usage'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const usage = await getTodayUsage(supabase, user.id)
    
    return NextResponse.json({
      ai_messages_count: usage?.ai_messages_count ?? 0,
      scans_count: usage?.scans_count ?? 0,
      date: usage?.date ?? new Date().toISOString().split('T')[0]
    })
  } catch (error) {
    console.error('Error fetching usage:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
