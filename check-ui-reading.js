// Check what the UI is actually reading
async function checkUIReading() {
  console.log('🔍 Checking what the UI is reading...')
  
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.error('❌ No user session found')
      return
    }
    
    console.log('✅ User ID:', session.user.id)
    
    // 1. Check database directly
    console.log('\n📊 Direct database check:')
    const { data: directProfile } = await supabase
      .from('profiles')
      .select('study_streak')
      .eq('id', session.user.id)
      .single()
    
    console.log('Database value:', directProfile?.study_streak)
    
    // 2. Check getStudyStreak function
    console.log('\n🧪 Testing getStudyStreak function:')
    try {
      const { getStudyStreak } = await import('./lib/progress.js')
      const streakData = await getStudyStreak(session.user.id)
      console.log('getStudyStreak result:', streakData)
    } catch (error) {
      console.error('getStudyStreak error:', error)
    }
    
    // 3. Force refresh the page data
    console.log('\n🔄 Forcing page refresh...')
    window.location.reload()
    
  } catch (error) {
    console.error('❌ Check failed:', error)
  }
}

console.log('💡 Run checkUIReading() to see what UI is reading')
window.checkUIReading = checkUIReading
