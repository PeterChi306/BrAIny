/**
 * Award streak when the user enters the app each day.
 * Opening the app counts as a day for the streak (like daily check-in).
 */

import { createSupabaseClient } from '@/lib/supabase/client'

/**
 * Checks and resets streak if the user missed too many days.
 * This should be called when the user enters the app to ensure the UI
 * reflects the correct streak status (e.g., if they missed yesterday).
 */
export async function checkAndResetStreak(userId: string): Promise<void> {
  const supabase = createSupabaseClient()
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('study_streak, last_activity_date, streak_freeze_used')
      .eq('id', userId)
      .single()

    if (!profile || !profile.last_activity_date) return

    const lastDate = new Date(profile.last_activity_date)
    const lastDateMidnight = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate())
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const diffTime = todayMidnight.getTime() - lastDateMidnight.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

    // If more than 1 day missed, and no freeze available/used, reset streak
    // (If diffDays is 1, they still have today to save it)
    if (diffDays > 1) {
      // Check if we can/should apply a freeze automatically on login? 
      // Duolingo usually shows the streak "broken" or "saved" on the first action or login.
      // For now, let's just reset if they missed the window.

      let newStreak = profile.study_streak
      let resetNeeded = false

      if (diffDays === 2) {
        // Missed exactly one day. If freeze not used, we *could* save it, 
        // but let's let updateStudyStreak handle the "saving" logic.
        // On login, if they missed yesterday, it's "at risk".
        console.log("⚠️ Streak at risk - missed yesterday")
      } else if (diffDays > 2) {
        // Definitely reset
        newStreak = 0
        resetNeeded = true
        console.log("💀 Streak reset due to inactivity")
      }

      if (resetNeeded) {
        await supabase
          .from('profiles')
          .update({ study_streak: newStreak })
          .eq('id', userId)
      }
    }

    // Ensure a daily_usage record exists for today (even if 0) so other queries don't fail
    await supabase
      .from('daily_usage')
      .upsert({
        user_id: userId,
        date: today,
        updated_at: now.toISOString()
      }, { onConflict: 'user_id,date' })

  } catch (error) {
    console.error('Error in checkAndResetStreak:', error)
  }
}
