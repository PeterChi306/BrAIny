// Quick streak test - paste this in browser console
async function testStreak() {
  console.log('🔍 Testing streak functionality...')
  
  try {
    // Import the functions (they should be available globally)
    const { getStudyStreak } = await import('./lib/progress.js')
    const { updateStudyStreak } = await import('./lib/streak.js')
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.error('❌ No user session found')
      return
    }
    
    console.log('✅ User session found:', session.user.id)
    
    // 1. Get current streak
    const currentStreak = await getStudyStreak(session.user.id)
    console.log('📊 Current streak:', currentStreak)
    
    // 2. Update streak
    console.log('🔄 Updating streak...')
    await updateStudyStreak(session.user.id, 'chat')
    
    // 3. Check streak after update
    setTimeout(async () => {
      const updatedStreak = await getStudyStreak(session.user.id)
      console.log('📊 Updated streak:', updatedStreak)
      
      if (updatedStreak.currentStreak > currentStreak.currentStreak) {
        console.log('✅ Streak is working! Increased from', currentStreak.currentStreak, 'to', updatedStreak.currentStreak)
      } else if (updatedStreak.currentStreak === currentStreak.currentStreak) {
        console.log('⚠️ Streak stayed the same - might already have activity today')
      } else {
        console.log('❌ Streak decreased unexpectedly')
      }
    }, 2000)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

console.log('💡 Run testStreak() to test streak functionality')
window.testStreak = testStreak
