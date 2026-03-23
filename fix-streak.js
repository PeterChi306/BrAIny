// Quick fix - manually set streak to 1
async function fixStreak() {
  console.log('🔧 Fixing streak...')
  
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.error('❌ No user session found')
      return
    }
    
    console.log('✅ User session found:', session.user.id)
    
    // Manually set streak to 1
    const { error } = await supabase
      .from('profiles')
      .update({ study_streak: 1 })
      .eq('id', session.user.id)
    
    if (error) {
      console.error('❌ Error setting streak:', error)
    } else {
      console.log('✅ Streak set to 1! Refresh the page to see it.')
      
      // Verify it was set
      setTimeout(async () => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('study_streak')
          .eq('id', session.user.id)
          .single()
        
        console.log('📊 Verified streak:', profile?.study_streak)
      }, 500)
    }
  } catch (error) {
    console.error('❌ Fix failed:', error)
  }
}

console.log('💡 Run fixStreak() to manually set streak to 1')
window.fixStreak = fixStreak
