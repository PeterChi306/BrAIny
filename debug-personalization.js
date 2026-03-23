// Debug personalization data - paste this in browser console
async function debugPersonalization() {
  console.log('🔍 Debugging personalization data...')
  
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.error('❌ No user session found')
      return
    }
    
    console.log('✅ User ID:', session.user.id)
    
    // Check full profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Profile error:', profileError)
    } else {
      console.log('✅ Full profile data:', profile)
      console.log('🎯 Interests:', profile.interests)
      console.log('📚 Learning style:', profile.learning_style)
      console.log('👤 Age:', profile.age)
      console.log('🎭 Display name:', profile.display_name)
    }
    
    // Test AI response with personalization
    console.log('\n🤖 Testing AI response...')
    const testResponse = await fetch('/api/tutor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Tell me about photosynthesis',
        mode: 'explain'
      })
    })
    
    if (testResponse.ok) {
      const responseData = await testResponse.json()
      console.log('✅ AI Response:', responseData.text)
      console.log('🔍 Does response mention user interests?', responseData.text.toLowerCase().includes('gaming') || responseData.text.toLowerCase().includes('tech'))
    } else {
      console.error('❌ AI Response error:', testResponse.status)
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

console.log('💡 Run debugPersonalization() to debug personalization')
window.debugPersonalization = debugPersonalization
