// Comprehensive streak diagnostic
async function diagnoseStreak() {
  console.log('🏥 Running comprehensive streak diagnostic...')
  
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.error('❌ No user session found')
      return
    }
    
    console.log('✅ User ID:', session.user.id)
    
    // 1. Check if profiles table has study_streak column
    console.log('\n📋 Checking profiles table structure...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Profile error:', profileError)
      if (profileError.message.includes('column "study_streak" does not exist')) {
        console.log('🔨 The study_streak column does not exist! Need to run migration.')
      }
    } else {
      console.log('✅ Profile data:', profile)
      console.log('📊 study_streak value:', profile.study_streak)
    }
    
    // 2. Try to manually set study_streak
    console.log('\n🔧 Attempting to manually set study_streak...')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ study_streak: 1 })
      .eq('id', session.user.id)
    
    if (updateError) {
      console.error('❌ Manual update failed:', updateError)
      if (updateError.message.includes('column "study_streak" does not exist')) {
        console.log('🚨 CONFIRMED: study_streak column missing!')
        console.log('💡 Solution: Run the gamification migration SQL')
      }
    } else {
      console.log('✅ Manual update succeeded')
    }
    
    // 3. Check daily_usage table
    console.log('\n📅 Checking daily_usage table...')
    const today = new Date().toISOString().split('T')[0]
    const { data: usage, error: usageError } = await supabase
      .from('daily_usage')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('date', today)
      .maybeSingle()
    
    if (usageError) {
      console.error('❌ Usage error:', usageError)
    } else {
      console.log('✅ Today\'s usage:', usage)
    }
    
    // 4. Test login streak function directly
    console.log('\n🎁 Testing login streak function...')
    try {
      const { awardLoginStreak } = await import('./lib/login-streak.js')
      await awardLoginStreak(session.user.id)
      console.log('✅ Login streak function executed')
    } catch (importError) {
      console.error('❌ Login streak function error:', importError)
    }
    
    // 5. Final check
    setTimeout(async () => {
      console.log('\n🏁 Final verification...')
      const { data: finalProfile } = await supabase
        .from('profiles')
        .select('study_streak')
        .eq('id', session.user.id)
        .single()
      
      console.log('📊 Final streak value:', finalProfile?.study_streak)
      
      if ((finalProfile?.study_streak || 0) > 0) {
        console.log('🎉 SUCCESS: Streak is working!')
      } else {
        console.log('❌ FAILED: Streak still 0')
      }
    }, 2000)
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error)
  }
}

console.log('💡 Run diagnoseStreak() for full diagnostic')
window.diagnoseStreak = diagnoseStreak
