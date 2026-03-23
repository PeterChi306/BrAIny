/**
 * Debug script to test streak functionality
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testStreak() {
  console.log('🔍 Testing Streak Functionality...')
  
  // Test user ID - you might need to update this
  const testUserId = 'demo-user-id'
  
  try {
    // 1. Check current profile and streak
    console.log('\n📊 Current Profile:')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single()
    
    if (profileError) {
      console.error('❌ Profile error:', profileError)
    } else {
      console.log('✅ Profile found:', profile)
    }
    
    // 2. Check daily usage
    console.log('\n📅 Daily Usage:')
    const today = new Date().toISOString().split('T')[0]
    const { data: dailyUsage, error: usageError } = await supabase
      .from('daily_usage')
      .select('*')
      .eq('user_id', testUserId)
      .eq('date', today)
      .maybeSingle()
    
    if (usageError) {
      console.error('❌ Usage error:', usageError)
    } else {
      console.log('✅ Daily usage:', dailyUsage)
    }
    
    // 3. Check recent study sessions
    console.log('\n📚 Recent Study Sessions:')
    const { data: sessions, error: sessionError } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', testUserId)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError)
    } else {
      console.log('✅ Recent sessions:', sessions)
    }
    
    // 4. Test manual streak update
    console.log('\n🔄 Testing Manual Streak Update:')
    const { error: updateError } = await supabase
      .from('daily_usage')
      .upsert({
        user_id: testUserId,
        date: today,
        ai_messages_count: 1,
        scans_count: 0
      })
    
    if (updateError) {
      console.error('❌ Update error:', updateError)
    } else {
      console.log('✅ Daily usage updated')
    }
    
    // 5. Check profile again after update
    console.log('\n🔄 Profile After Update:')
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait for trigger
    
    const { data: updatedProfile, error: updatedProfileError } = await supabase
      .from('profiles')
      .select('study_streak')
      .eq('id', testUserId)
      .single()
    
    if (updatedProfileError) {
      console.error('❌ Updated profile error:', updatedProfileError)
    } else {
      console.log('✅ Updated streak:', updatedProfile)
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

// Run the test
testStreak().then(() => {
  console.log('\n🏁 Test completed')
  process.exit(0)
}).catch(error => {
  console.error('❌ Test failed:', error)
  process.exit(1)
})
