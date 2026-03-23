/**
 * Test script to verify streak reset logic
 * This simulates different scenarios to ensure streak resets correctly
 */

import { createSupabaseClient } from './lib/supabase/client'

async function testStreakLogic() {
  const supabase = createSupabaseClient()
  
  // Test scenarios
  console.log('🧪 Testing Streak Reset Logic')
  console.log('================================')
  
  try {
    // Get a test user (you'll need to replace with actual user ID)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('❌ No user logged in')
      return
    }
    
    const userId = user.id
    console.log(`✅ Testing with user: ${userId}`)
    
    // Scenario 1: Check current streak
    const { data: profile } = await supabase
      .from('profiles')
      .select('study_streak')
      .eq('id', userId)
      .single()
    
    console.log(`📊 Current streak: ${profile?.study_streak || 0}`)
    
    // Scenario 2: Get recent activity dates
    const { data: recentActivity } = await supabase
      .from('daily_usage')
      .select('date, ai_messages_count, scans_count')
      .eq('user_id', userId)
      .or('ai_messages_count.gt.0,scans_count.gt.0')
      .order('date', { ascending: false })
      .limit(7)
    
    console.log('📅 Recent activity dates:')
    recentActivity?.forEach(activity => {
      console.log(`  ${activity.date}: ${activity.ai_messages_count} messages, ${activity.scans_count} scans`)
    })
    
    // Scenario 3: Calculate what the streak should be
    const today = new Date().toISOString().split('T')[0]
    let expectedStreak = 0
    
    if (recentActivity && recentActivity.length > 0) {
      const lastActivity = recentActivity[0]
      const lastActivityDate = new Date(lastActivity.date)
      const todayDate = new Date(today)
      const daysDiff = Math.floor((todayDate.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
      
      console.log(`📏 Days since last activity: ${daysDiff}`)
      
      if (daysDiff === 0) {
        // Activity today, calculate consecutive days
        expectedStreak = 1
        let checkDate = new Date(today)
        checkDate.setDate(checkDate.getDate() - 1)
        
        for (let i = 1; i < 30; i++) {
          const checkDateStr = checkDate.toISOString().split('T')[0]
          const dayActivity = recentActivity.find(a => a.date === checkDateStr)
          
          if (dayActivity && (dayActivity.ai_messages_count > 0 || dayActivity.scans_count > 0)) {
            expectedStreak++
            checkDate.setDate(checkDate.getDate() - 1)
          } else {
            break
          }
        }
      } else if (daysDiff === 1) {
        // Activity yesterday, should be current streak + 1
        expectedStreak = (profile?.study_streak || 0) + 1
      } else {
        // More than 1 day gap, should reset to 1
        expectedStreak = 1
      }
    }
    
    console.log(`🎯 Expected streak: ${expectedStreak}`)
    console.log(`📈 Actual streak: ${profile?.study_streak || 0}`)
    
    if (expectedStreak === (profile?.study_streak || 0)) {
      console.log('✅ Streak logic is working correctly!')
    } else {
      console.log('❌ Streak logic needs adjustment')
      console.log(`   Difference: ${expectedStreak - (profile?.study_streak || 0)}`)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testStreakLogic()
