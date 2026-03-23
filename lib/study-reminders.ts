/**
 * Study reminder service
 * Handles scheduling and sending study reminders based on user preferences
 */

import { createSupabaseClient } from '@/lib/supabase/client'
import { notificationService } from '@/lib/notifications'

export interface StudyReminder {
  id: string
  user_id: string
  reminder_time: string // HH:MM format
  day_of_week: number // 0-6 (Sunday-Saturday)
  is_enabled: boolean
  last_sent: string | null
  created_at: string
  updated_at: string
}

export interface UserStudyPreferences {
  study_reminders_enabled: boolean
  study_time: string
  study_days: number[]
  reminder_preference: 'notification' | 'email' | 'both'
}

/**
 * Get user's study reminder preferences
 */
export async function getUserStudyPreferences(userId: string): Promise<UserStudyPreferences | null> {
  const supabase = createSupabaseClient()
  
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('study_reminders_enabled, study_time, study_days, reminder_preference')
      .eq('id', userId)
      .single()
    
    if (!profile) return null
    
    return {
      study_reminders_enabled: profile.study_reminders_enabled || false,
      study_time: profile.study_time || '19:00', // Default 7 PM
      study_days: profile.study_days || [1, 2, 3, 4, 5], // Mon-Fri
      reminder_preference: profile.reminder_preference || 'notification'
    }
  } catch (error) {
    console.error('Error getting study preferences:', error)
    return null
  }
}

/**
 * Schedule study reminders for a user
 */
export async function scheduleStudyReminders(userId: string): Promise<void> {
  const preferences = await getUserStudyPreferences(userId)
  if (!preferences || !preferences.study_reminders_enabled) {
    return
  }

  const supabase = createSupabaseClient()
  
  try {
    // Clear existing reminders for this user
    await supabase
      .from('study_reminders')
      .delete()
      .eq('user_id', userId)

    // Create new reminders for each day
    for (const dayOfWeek of preferences.study_days) {
      await supabase
        .from('study_reminders')
        .insert({
          user_id: userId,
          reminder_time: preferences.study_time,
          day_of_week: dayOfWeek,
          is_enabled: true
        })
    }

    console.log(`✅ Scheduled study reminders for user ${userId}`)
  } catch (error) {
    console.error('Error scheduling study reminders:', error)
  }
}

/**
 * Check and send due study reminders
 * This should be called periodically (e.g., every hour)
 */
export async function checkAndSendStudyReminders(): Promise<void> {
  const supabase = createSupabaseClient()
  const now = new Date()
  const currentDayOfWeek = now.getDay() // 0-6
  const currentTime = now.toTimeString().slice(0, 5) // HH:MM

  try {
    // Get reminders that are due now
    const { data: dueReminders } = await supabase
      .from('study_reminders')
      .select(`
        *,
        profiles!inner(
          display_name,
          study_reminders_enabled,
          reminder_preference
        )
      `)
      .eq('day_of_week', currentDayOfWeek)
      .eq('reminder_time', currentTime)
      .eq('is_enabled', true)
      .eq('profiles.study_reminders_enabled', true)

    if (!dueReminders || dueReminders.length === 0) {
      return
    }

    console.log(`📚 Sending ${dueReminders.length} study reminders`)

    // Send notifications for each due reminder
    for (const reminder of dueReminders) {
      try {
        const userProfile = reminder.profiles
        const userName = userProfile.display_name || 'Student'

        // Schedule browser notification
        await notificationService.scheduleStudyReminder(
          `Study Time! 📚 - Hi ${userName}!`,
          now,
          reminder.user_id
        )

        // Also save to database for backup
        await supabase
          .from('notifications')
          .insert({
            user_id: reminder.user_id,
            reminder_type: 'study_reminder',
            title: 'Study Time! 📚',
            message: `Hi ${userName}! It's time for your study session. Let's keep that learning streak going!`,
            scheduled_for: now.toISOString()
          })

        // Update last sent timestamp
        await supabase
          .from('study_reminders')
          .update({ last_sent: now.toISOString() })
          .eq('id', reminder.id)

        console.log(`✅ Sent study reminder to user ${reminder.user_id}`)
      } catch (error) {
        console.error(`Error sending reminder to user ${reminder.user_id}:`, error)
      }
    }
  } catch (error) {
    console.error('Error checking study reminders:', error)
  }
}

/**
 * Get upcoming study reminders for a user
 */
export async function getUpcomingStudyReminders(userId: string): Promise<StudyReminder[]> {
  const supabase = createSupabaseClient()
  
  try {
    const { data } = await supabase
      .from('study_reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('is_enabled', true)
      .order('day_of_week', { ascending: true })

    return data || []
  } catch (error) {
    console.error('Error getting upcoming reminders:', error)
    return []
  }
}

/**
 * Toggle study reminder on/off
 */
export async function toggleStudyReminder(userId: string, enabled: boolean): Promise<void> {
  const supabase = createSupabaseClient()
  
  try {
    await supabase
      .from('profiles')
      .update({ study_reminders_enabled: enabled })
      .eq('id', userId)

    if (enabled) {
      await scheduleStudyReminders(userId)
    } else {
      // Disable all reminders
      await supabase
        .from('study_reminders')
        .update({ is_enabled: false })
        .eq('user_id', userId)
    }

    console.log(`✅ ${enabled ? 'Enabled' : 'Disabled'} study reminders for user ${userId}`)
  } catch (error) {
    console.error('Error toggling study reminders:', error)
  }
}

/**
 * Update study preferences
 */
export async function updateStudyPreferences(
  userId: string,
  preferences: Partial<UserStudyPreferences>
): Promise<void> {
  const supabase = createSupabaseClient()
  
  try {
    await supabase
      .from('profiles')
      .update({
        study_reminders_enabled: preferences.study_reminders_enabled,
        study_time: preferences.study_time,
        study_days: preferences.study_days,
        reminder_preference: preferences.reminder_preference
      })
      .eq('id', userId)

    // Reschedule reminders if enabled
    if (preferences.study_reminders_enabled) {
      await scheduleStudyReminders(userId)
    }

    console.log(`✅ Updated study preferences for user ${userId}`)
  } catch (error) {
    console.error('Error updating study preferences:', error)
  }
}

/**
 * Get next study reminder time
 */
export function getNextStudyReminderTime(reminders: StudyReminder[]): Date | null {
  if (reminders.length === 0) return null

  const now = new Date()
  const currentDayOfWeek = now.getDay()
  const currentTime = now.toTimeString().slice(0, 5)

  // Find next reminder
  let nextReminder: StudyReminder | null = null
  let minDaysUntil = 7 // Max 7 days ahead

  for (const reminder of reminders) {
    let daysUntil = reminder.day_of_week - currentDayOfWeek
    
    // If the day is earlier in the week, add 7 to get next week
    if (daysUntil < 0) {
      daysUntil += 7
    } else if (daysUntil === 0 && reminder.reminder_time <= currentTime) {
      // If today but time has passed, schedule for next week
      daysUntil = 7
    }

    if (daysUntil < minDaysUntil) {
      minDaysUntil = daysUntil
      nextReminder = reminder
    }
  }

  if (!nextReminder) return null

  // Calculate the next reminder date
  const nextDate = new Date(now)
  nextDate.setDate(now.getDate() + minDaysUntil)
  
  const [hours, minutes] = nextReminder.reminder_time.split(':')
  nextDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

  return nextDate
}

/**
 * Format study reminder time
 */
export function formatStudyReminderTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const minute = parseInt(minutes)
  
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`
}

/**
 * Get day name from day number
 */
export function getDayName(dayNumber: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayNumber]
}
