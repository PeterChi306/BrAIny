/**
 * Simplified Streak Management System
 * Works like other streak systems (Duolingo, etc.)
 */

import { createSupabaseClient } from '@/lib/supabase/client'

interface StreakData {
  currentStreak: number
  lastActivityDate: string | null
  hasActivityToday: boolean
  streakProtected: boolean
}

/**
 * Get current streak information
 */
export async function getStreakData(userId: string): Promise<StreakData> {
  const supabase = createSupabaseClient()
  const today = new Date().toISOString().split('T')[0]

  try {
    // Get profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('study_streak, last_activity_date')
      .eq('id', userId)
      .single()

    // Check today's activity
    const { data: todayUsage } = await supabase
      .from('daily_usage')
      .select('ai_messages_count, scans_count')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()

    const hasActivityToday = todayUsage && 
      (todayUsage.ai_messages_count > 0 || todayUsage.scans_count > 0)

    return {
      currentStreak: profile?.study_streak || 0,
      lastActivityDate: profile?.last_activity_date || null,
      hasActivityToday,
      streakProtected: false
    }
  } catch (error) {
    console.error('Error getting streak data:', error)
    return {
      currentStreak: 0,
      lastActivityDate: null,
      hasActivityToday: false,
      streakProtected: false
    }
  }
}

/**
 * Update streak based on activity
 * Only increments ONCE per day
 */
export async function updateStreak(userId: string, activityType: 'chat' | 'scan' | 'quiz' | 'practice'): Promise<{
  newStreak: number
  streakIncreased: boolean
  isNewDay: boolean
}> {
  const supabase = createSupabaseClient()
  const today = new Date().toISOString().split('T')[0]
  const now = new Date()

  try {
    // Get current streak data
    const streakData = await getStreakData(userId)

    // If already had activity today, don't update streak
    if (streakData.hasActivityToday) {
      console.log('🔥 User already active today - not updating streak')
      return {
        newStreak: streakData.currentStreak,
        streakIncreased: false,
        isNewDay: false
      }
    }

    // Update daily usage for today
    const { data: existingUsage } = await supabase
      .from('daily_usage')
      .select('ai_messages_count, scans_count')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()

    const counts = {
      ai_messages_count: (existingUsage?.ai_messages_count || 0) + (activityType === 'chat' ? 1 : 0),
      scans_count: (existingUsage?.scans_count || 0) + (activityType !== 'chat' ? 1 : 0)
    }

    await supabase
      .from('daily_usage')
      .upsert({
        user_id: userId,
        date: today,
        ...counts,
        updated_at: now.toISOString()
      }, { onConflict: 'user_id,date' })

    // Calculate new streak
    let newStreak = 1
    let streakIncreased = false

    if (streakData.lastActivityDate) {
      const lastDate = new Date(streakData.lastActivityDate)
      const todayDate = new Date(today)
      
      // Reset to midnight for accurate day comparison
      lastDate.setHours(0, 0, 0, 0)
      todayDate.setHours(0, 0, 0, 0)
      
      const diffTime = todayDate.getTime() - lastDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      console.log(`📅 Streak calculation: Last=${streakData.lastActivityDate}, Today=${today}, Diff=${diffDays} days`)

      if (diffDays === 1) {
        // Yesterday was active - continue streak
        newStreak = streakData.currentStreak + 1
        streakIncreased = true
        console.log('✅ Streak continued!', newStreak)
      } else if (diffDays > 1) {
        // Missed days - reset streak
        newStreak = 1
        console.log('❌ Streak reset - missed days')
      } else {
        // Same day (shouldn't happen due to hasActivityToday check)
        newStreak = streakData.currentStreak
      }
    } else {
      // No previous activity - start new streak
      newStreak = 1
      console.log('🎯 First activity - starting streak')
    }

    // Update profile with new streak
    await supabase
      .from('profiles')
      .update({
        study_streak: newStreak,
        last_activity_date: today,
        updated_at: now.toISOString()
      })
      .eq('id', userId)

    // Award XP for streak milestones
    if (streakIncreased && newStreak > 1) {
      await supabase.from('xp_transactions').insert({
        user_id: userId,
        amount: 10,
        reason: `Streak extended to ${newStreak} days!`
      })
    }

    return {
      newStreak,
      streakIncreased,
      isNewDay: true
    }

  } catch (error) {
    console.error('Error updating streak:', error)
    return {
      newStreak: 0,
      streakIncreased: false,
      isNewDay: false
    }
  }
}

/**
 * Check if streak is at risk (no activity yesterday)
 */
export async function isStreakAtRisk(userId: string): Promise<boolean> {
  const supabase = createSupabaseClient()
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  try {
    const { data: yesterdayUsage } = await supabase
      .from('daily_usage')
      .select('ai_messages_count, scans_count')
      .eq('user_id', userId)
      .eq('date', yesterdayStr)
      .maybeSingle()

    const hasYesterdayActivity = yesterdayUsage && 
      (yesterdayUsage.ai_messages_count > 0 || yesterdayUsage.scans_count > 0)

    const { currentStreak } = await getStreakData(userId)

    return !hasYesterdayActivity && currentStreak > 0
  } catch (error) {
    console.error('Error checking streak risk:', error)
    return false
  }
}
