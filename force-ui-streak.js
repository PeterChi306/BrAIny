// Force UI to show streak = 1
async function forceUIStreak() {
  console.log('💪 Forcing UI to show streak = 1...')
  
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.error('❌ No user session found')
      return
    }
    
    // 1. Set database to 1
    console.log('📊 Setting database to 1...')
    const { error } = await supabase
      .from('profiles')
      .update({ study_streak: 1 })
      .eq('id', session.user.id)
    
    if (error) {
      console.error('❌ Database update failed:', error)
    } else {
      console.log('✅ Database updated')
    }
    
    // 2. Force reload the page to refresh all data
    console.log('🔄 Reloading page...')
    setTimeout(() => {
      window.location.reload()
    }, 1000)
    
  } catch (error) {
    console.error('❌ Force failed:', error)
  }
}

console.log('💡 Run forceUIStreak() to force streak = 1')
window.forceUIStreak = forceUIStreak
