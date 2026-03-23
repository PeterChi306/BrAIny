// Test login streak - paste this in browser console
async function testLoginStreak() {
  console.log('🎁 Testing login streak functionality...')
  
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.error('❌ No user session found')
      return
    }
    
    console.log('✅ User session found:', session.user.id)
    
    // Get current streak before login
    const { data: profileBefore } = await supabase
      .from('profiles')
      .select('study_streak')
      .eq('id', session.user.id)
      .single()
    
    console.log('📊 Streak before login:', profileBefore?.study_streak || 0)
    
    // Import and call the login streak function
    const { awardLoginStreak } = await import('./lib/login-streak.js')
    await awardLoginStreak(session.user.id)
    
    // Check streak after login
    setTimeout(async () => {
      const { data: profileAfter } = await supabase
        .from('profiles')
        .select('study_streak')
        .eq('id', session.user.id)
        .single()
      
      console.log('📊 Streak after login:', profileAfter?.study_streak || 0)
      
      if ((profileAfter?.study_streak || 0) >= 1) {
        console.log('✅ Login streak working! User has at least 1 streak')
      } else {
        console.log('❌ Login streak not awarded')
      }
    }, 1000)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

console.log('💡 Run testLoginStreak() to test login streak functionality')
window.testLoginStreak = testLoginStreak
