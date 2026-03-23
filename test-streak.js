/**
 * Test script to verify streak functionality
 * Run this with: node test-streak.js
 */

import { createSupabaseClient } from './lib/supabase/client.js'

async function testStreak() {
  console.log('🔥 Testing streak functionality...')
  
  const supabase = createSupabaseClient()
  
  try {
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      console.error('❌ No authenticated session found')
      return
    }
    
    const userId = session.user.id
    console.log(`✅ Found user: ${userId}`)
    
    // Check current streak from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('study_streak')
      .eq('id', userId)
      .single()
      
    if (profileError) {
      console.error('❌ Error fetching profile:', profileError)
      return
    }
    
    console.log(`📊 Current streak from profiles: ${profile?.study_streak || 0}`)
    
    // Check daily_usage for today
    const today = new Date().toISOString().split('T')[0]
    const { data: todayUsage, error: usageError } = await supabase
      .from('daily_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single()
      
    if (usageError && usageError.code !== 'PGRST116') {
      console.error('❌ Error fetching daily usage:', usageError)
    } else if (todayUsage) {
      console.log(`📅 Today's usage:`, todayUsage)
    } else {
      console.log(`📅 No usage record for today (${today})`)
    }
    
    // Test streak update function
    console.log('\n🧪 Testing streak update...')
    const { updateStudyStreak } = await import('./lib/streak.js')
    
    await updateStudyStreak(userId, 'chat')
    console.log('✅ Streak update function executed')
    
    // Check streak after update
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('study_streak')
      .eq('id', userId)
      .single()
      
    console.log(`📈 Updated streak: ${updatedProfile?.study_streak || 0}`)
    
    // Test the UI function
    const { getStudyStreak } = await import('./lib/progress.js')
    const streakData = await getStudyStreak(userId)
    
    console.log('🎯 UI streak data:', streakData)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testStreak()
