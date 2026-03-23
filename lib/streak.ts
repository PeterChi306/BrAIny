/**
 * Streak management system
 * Handles updating study streaks when users complete learning actions
 */

import { createSupabaseClient } from '@/lib/supabase/client'

/**
 * Check if user has already had activity today (to prevent multiple streak updates)
 */
export async function hasActivityToday(userId: string): Promise<boolean> {
  const supabase = createSupabaseClient()
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

  try {
    const { data: usage } = await supabase
      .from('daily_usage')
      .select('ai_messages_count, scans_count')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    // User has activity today if they have any messages or scans
    return usage ? (usage.ai_messages_count > 0 || usage.scans_count > 0) : false
  } catch (error) {
    console.error('Error checking today activity:', error)
    return false
  }
}

/**
 * Get current streak and streak freeze info for a user
 */
export async function getCurrentStreak(userId: string): Promise<{ streak: number; lastActivityDate: string | null; streakFreeze: boolean }> {
  const supabase = createSupabaseClient()

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('study_streak, last_activity_date, streak_freeze_used')
      .eq('id', userId)
      .single()

    const streak = profile?.study_streak || 0
    const lastActivityDate = profile?.last_activity_date || null
    const streakFreeze = profile?.streak_freeze_used || false

    return { streak, lastActivityDate, streakFreeze }
  } catch (error) {
    console.error('Error getting current streak:', error)
    return { streak: 0, lastActivityDate: null, streakFreeze: false }
  }
}

/**
 * Check if streak is at risk (missed yesterday)
 */
export async function isStreakAtRisk(userId: string): Promise<boolean> {
  const supabase = createSupabaseClient()
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  try {
    const { data: yesterdayActivity } = await supabase
      .from('daily_usage')
      .select('ai_messages_count, scans_count')
      .eq('user_id', userId)
      .eq('date', yesterdayStr)
      .single()

    // Streak is at risk if no activity yesterday and current streak > 0
    const hasYesterdayActivity = yesterdayActivity ? (yesterdayActivity.ai_messages_count > 0 || yesterdayActivity.scans_count > 0) : false
    const { streak } = await getCurrentStreak(userId)

    return !hasYesterdayActivity && streak > 0
  } catch (error) {
    console.error('Error checking streak risk:', error)
    return false
  }
}

/**
 * Use streak freeze to protect streak
 */
export async function useStreakFreeze(userId: string): Promise<boolean> {
  const supabase = createSupabaseClient()

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_freeze_used')
      .eq('id', userId)
      .single()

    if (profile?.streak_freeze_used) {
      return false // Already used freeze
    }

    // Use streak freeze
    const { error } = await supabase
      .from('profiles')
      .update({ streak_freeze_used: true })
      .eq('id', userId)

    if (error) {
      console.error('Error using streak freeze:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error using streak freeze:', error)
    return false
  }
}

export async function updateStudyStreak(userId: string, action: 'chat' | 'quiz' | 'flashcards' | 'practice'): Promise<{ streak: number; isNewDay: boolean; streakProtected: boolean }> {
  console.log("🔥 STREAK UPDATE TRIGGERED: Action", action, "for user", userId)

  const supabase = createSupabaseClient()
  const now = new Date()
  const today = now.toISOString().split('T')[0] // YYYY-MM-DD format

  try {
    // 1. Update or create daily_usage for today
    const { data: existingUsage, error: fetchError } = await supabase
      .from('daily_usage')
      .select('ai_messages_count, scans_count')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching daily usage:', fetchError)
      return { streak: 0, isNewDay: false, streakProtected: false }
    }

    // Determine if this is the user's first real activity of the day
    // (Existing usage might be from a login "ping" with 0 counts)
    const alreadyHadActivityToday = existingUsage && (existingUsage.ai_messages_count > 0 || existingUsage.scans_count > 0)
    const isFirstActivityOfDay = !alreadyHadActivityToday

    // Update counts
    const counts = {
      ai_messages_count: (existingUsage?.ai_messages_count || 0) + (action === 'chat' ? 1 : 0),
      scans_count: (existingUsage?.scans_count || 0) + (action !== 'chat' ? 1 : 0)
    }

    const { error: upsertError } = await supabase
      .from('daily_usage')
      .upsert({
        user_id: userId,
        date: today,
        ...counts,
        updated_at: now.toISOString()
      }, { onConflict: 'user_id,date' })

    if (upsertError) {
      console.error('Error upserting daily usage:', upsertError)
    }

    // 2. Update streak logic ONLY if this is the first real activity of the day
    if (isFirstActivityOfDay) {
      console.log("📅 First real activity of the day - calculating streak")

      const { data: profile } = await supabase
        .from('profiles')
        .select('study_streak, last_activity_date, streak_freeze_used')
        .eq('id', userId)
        .single()

      const currentStreak = profile?.study_streak || 0
      const lastActivityDateStr = profile?.last_activity_date
      let newStreak = 1
      let streakProtected = false

      if (lastActivityDateStr) {
        const lastDate = new Date(lastActivityDateStr)
        // Reset hours to midnight for accurate day comparison
        const lastDateMidnight = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate())
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        const diffTime = todayMidnight.getTime() - lastDateMidnight.getTime()
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

        console.log(`📊 Date Analysis: Last=${lastActivityDateStr}, Today=${today}, Diff=${diffDays} days`)

        if (diffDays === 0) {
          // Already active today (should have been caught by isFirstActivityOfDay, but double check)
          newStreak = currentStreak
        } else if (diffDays === 1) {
          // Yesterday was active, perfect streak continuation
          newStreak = currentStreak + 1
          console.log("✅ Consecutive day! Streak increased.")
        } else if (diffDays === 2 && !profile?.streak_freeze_used) {
          // Missed exactly one day, try to use streak freeze
          const freezeSuccess = await useStreakFreeze(userId)
          if (freezeSuccess) {
            newStreak = currentStreak + 1
            streakProtected = true
            console.log("❄️ Streak freeze applied! Streak saved.")
          } else {
            newStreak = 1
            console.log("❌ Streak freeze failed or unavailable. Streak reset.")
          }
        } else {
          // Missed multiple days or freeze used
          newStreak = 1
          console.log("❌ Too many days missed. Streak reset.")
        }
      }

      // 3. Update profile with the definitive new streak
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          study_streak: newStreak,
          last_activity_date: today,
          // If we didn't use a freeze today, we might want to "renew" it or reset usage
          // but Duolingo makes you buy them. For now, let's just reset usage if they study.
          // Actually, let's keep the user's logic of resetting freeze usage for simplicity if that's what they had.
          streak_freeze_used: streakProtected ? true : (profile?.streak_freeze_used || false)
        })
        .eq('id', userId)

      if (profileUpdateError) {
        console.error('Error updating profile streak:', profileUpdateError)
      }

      // Update xp_transactions for streak increment
      if (newStreak > currentStreak) {
        await supabase.from('xp_transactions').insert({
          user_id: userId,
          amount: 10,
          reason: `Extended streak to ${newStreak} days!`
        })
      }

      return { streak: newStreak, isNewDay: true, streakProtected }
    }

    // If not first activity, just return current state
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('study_streak')
      .eq('id', userId)
      .single()

    return { streak: finalProfile?.study_streak || 0, isNewDay: false, streakProtected: false }

  } catch (error) {
    console.error('Error in updateStudyStreak:', error)
    return { streak: 0, isNewDay: false, streakProtected: false }
  }
}

export async function createStudySession(
  userId: string,
  sessionType: 'chat' | 'quiz' | 'flashcards' | 'practice',
  topic?: string,
  subject?: string,
  durationMinutes?: number
): Promise<void> {
  const supabase = createSupabaseClient()

  try {
    // Create study session record
    const { error: sessionError } = await supabase
      .from('study_sessions')
      .insert({
        user_id: userId,
        session_type: sessionType,
        topic: topic || null,
        subject: subject || null,
        duration_minutes: durationMinutes || 0,
        created_at: new Date().toISOString(),
      })

    if (sessionError) {
      console.error('Error creating study session:', sessionError)
    }

    // Update streak
    await updateStudyStreak(userId, sessionType)
  } catch (error) {
    console.error('Error creating study session:', error)
  }
}
