/**
 * Initialize streak for users who don't have one
 */

import { createSupabaseClient } from '@/lib/supabase/client'

export async function initializeUserStreak(userId: string): Promise<void> {
  console.log("🔧 Initializing streak for user:", userId)
  
  const supabase = createSupabaseClient()
  
  try {
    // Check if user has a study_streak value
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('study_streak')
      .eq('id', userId)
      .single()
    
    if (profileError) {
      console.error('Error fetching profile for streak init:', profileError)
      return
    }
    
    // If study_streak is null or undefined, initialize it
    if (profile.study_streak === null || profile.study_streak === undefined) {
      console.log("📝 Initializing study_streak to 0")
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ study_streak: 0 })
        .eq('id', userId)
      
      if (updateError) {
        console.error('Error initializing streak:', updateError)
      } else {
        console.log('✅ Streak initialized to 0')
      }
    } else {
      console.log('✅ User already has streak:', profile.study_streak)
    }
  } catch (error) {
    console.error('Error in initializeUserStreak:', error)
  }
}
