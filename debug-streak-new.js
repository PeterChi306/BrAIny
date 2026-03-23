// Debug script to check what's happening with streak
async function debugStreak() {
  console.log('🔍 Debugging streak issue...')
  
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.error('❌ No user session found')
      return
    }
    
    console.log('✅ User session found:', session.user.id)
    
    // 1. Check if study_streak column exists
    console.log('\n📋 Checking profiles table structure...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Profile error:', profileError)
    } else {
      console.log('✅ Profile data:', profile)
      console.log('📊 Current study_streak:', profile.study_streak)
    }
    
    // 2. Check daily_usage
    console.log('\n📅 Checking daily_usage...')
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
    
    // 3. Manually set streak to 1 for testing
    console.log('\n🔧 Manually setting streak to 1...')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ study_streak: 1 })
      .eq('id', session.user.id)
    
    if (updateError) {
      console.error('❌ Manual update error:', updateError)
    } else {
      console.log('✅ Streak manually set to 1')
    }
    
    // 4. Check again
    setTimeout(async () => {
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('study_streak')
        .eq('id', session.user.id)
        .single()
      
      console.log('📊 Updated streak:', updatedProfile?.study_streak)
      
      // 5. Test getStudyStreak function
      console.log('\n🧪 Testing getStudyStreak function...')
      try {
        const { getStudyStreak } = await import('./lib/progress.js')
        const streakData = await getStudyStreak(session.user.id)
        console.log('✅ getStudyStreak result:', streakData)
      } catch (importError) {
        console.error('❌ Import error:', importError)
      }
    }, 1000)
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

console.log('💡 Run debugStreak() to debug streak issue')
window.debugStreak = debugStreak
