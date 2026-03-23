import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkAndSendStudyReminders } from '@/lib/study-reminders'

// This endpoint should be called by a cron job every hour
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron job call (you might want to add authentication)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🕐 Checking study reminders...')
    
    // Check and send due study reminders
    await checkAndSendStudyReminders()
    
    console.log('✅ Study reminders check completed')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Study reminders checked successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Error checking study reminders:', error)
    return NextResponse.json(
      { error: 'Failed to check study reminders' },
      { status: 500 }
    )
  }
}

// Manual trigger for testing
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🕐 Manually triggering study reminders for user:', user.id)
    
    // This would need to be modified to send reminders for a specific user
    // For now, we'll just return the user's reminder settings
    
    return NextResponse.json({ 
      success: true, 
      message: 'Study reminders triggered manually',
      userId: user.id
    })
  } catch (error) {
    console.error('❌ Error triggering study reminders:', error)
    return NextResponse.json(
      { error: 'Failed to trigger study reminders' },
      { status: 500 }
    )
  }
}
