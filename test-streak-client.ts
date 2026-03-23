/**
 * Simple streak test using the client-side functions
 */

import { createSupabaseClient } from './lib/supabase/client'
import { updateStudyStreak } from './lib/streak'
import { getStudyStreak } from './lib/progress'

async function testStreakClient() {
  console.log('🔍 Testing Streak with Client Functions...')
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await createSupabaseClient().auth.getSession()
    
    if (sessionError || !session) {
      console.error('❌ No session found:', sessionError)
      return
    }
    
    console.log('✅ Session found for user:', session.user.id)
    
    // 1. Get current streak
    console.log('\n📊 Current Streak:')
    const currentStreak = await getStudyStreak(session.user.id)
    console.log('Current streak data:', currentStreak)
    
    // 2. Update streak
    console.log('\n🔄 Updating streak...')
    await updateStudyStreak(session.user.id, 'chat')
    
    // 3. Check streak again after update
    console.log('\n📊 Streak After Update:')
    await new Promise(resolve => setTimeout(resolve, 2000)) // Wait for trigger
    const updatedStreak = await getStudyStreak(session.user.id)
    console.log('Updated streak data:', updatedStreak)
    
    // 4. Check profile directly
    console.log('\n👤 Profile Data:')
    const { data: profile, error: profileError } = await createSupabaseClient()
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Profile error:', profileError)
    } else {
      console.log('✅ Profile:', profile)
    }
    
    // 5. Check daily usage
    console.log('\n📅 Daily Usage:')
    const today = new Date().toISOString().split('T')[0]
    const { data: usage, error: usageError } = await createSupabaseClient()
      .from('daily_usage')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('date', today)
      .maybeSingle()
    
    if (usageError) {
      console.error('❌ Usage error:', usageError)
    } else {
      console.log('✅ Daily usage:', usage)
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  ;(window as any).testStreak = testStreakClient
  console.log('💡 Run testStreak() in browser console to test streak functionality')
}

export { testStreakClient }
