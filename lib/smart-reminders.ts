import { createSupabaseClient } from './supabase/client'
import { revisitSystem } from './revisit-system'
import { useState, useEffect } from 'react'

export interface SmartReminder {
  id?: string
  user_id: string
  reminder_type: 'revisit' | 'practice' | 'deadline'
  title: string
  message: string
  scheduled_for?: string
  sent_at?: string
  is_sent: boolean
  created_at?: string
}

export interface ReminderSettings {
  enabled: boolean
  maxPerDay: number
  preferredTimes: string[] // HH:MM format
  quietHours: { start: string; end: string }
  types: {
    revisit: boolean
    practice: boolean
    deadline: boolean
  }
}

class SmartReminders {
  private supabase = createSupabaseClient()

  // Create a smart reminder
  async createReminder(userId: string, reminder: Omit<SmartReminder, 'id' | 'created_at' | 'is_sent'>) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .insert({
          ...reminder,
          is_sent: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating reminder:', error)
      return null
    }
  }

  // Get user's reminder settings
  async getReminderSettings(userId: string): Promise<ReminderSettings> {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('reminder_settings')
        .eq('id', userId)
        .single()

      return profile?.reminder_settings || {
        enabled: true,
        maxPerDay: 1,
        preferredTimes: ['09:00', '15:00', '19:00'],
        quietHours: { start: '22:00', end: '08:00' },
        types: {
          revisit: true,
          practice: true,
          deadline: true
        }
      }
    } catch (error) {
      console.error('Error getting reminder settings:', error)
      return {
        enabled: true,
        maxPerDay: 1,
        preferredTimes: ['09:00', '15:00', '19:00'],
        quietHours: { start: '22:00', end: '08:00' },
        types: {
          revisit: true,
          practice: true,
          deadline: true
        }
      }
    }
  }

  // Update reminder settings
  async updateReminderSettings(userId: string, settings: Partial<ReminderSettings>) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update({
          reminder_settings: settings
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating reminder settings:', error)
      return null
    }
  }

  // Generate smart reminders based on user activity
  async generateSmartReminders(userId: string) {
    try {
      const settings = await this.getReminderSettings(userId)
      
      if (!settings.enabled) {
        return []
      }

      // Check how many reminders already sent today
      const todayCount = await this.getTodayReminderCount(userId)
      if (todayCount >= settings.maxPerDay) {
        return []
      }

      const reminders: Omit<SmartReminder, 'id' | 'created_at' | 'is_sent'>[] = []

      // Generate revisit reminders
      if (settings.types.revisit) {
        const revisitReminders = await this.generateRevisitReminders(userId, settings)
        reminders.push(...revisitReminders)
      }

      // Generate practice reminders
      if (settings.types.practice) {
        const practiceReminders = await this.generatePracticeReminders(userId, settings)
        reminders.push(...practiceReminders)
      }

      // Generate deadline reminders
      if (settings.types.deadline) {
        const deadlineReminders = await this.generateDeadlineReminders(userId, settings)
        reminders.push(...deadlineReminders)
      }

      // Sort by priority and limit
      const sortedReminders = reminders
        .sort((a, b) => this.calculateReminderPriority(b) - this.calculateReminderPriority(a))
        .slice(0, settings.maxPerDay - todayCount)

      // Schedule the reminders
      const scheduledReminders = []
      for (const reminder of sortedReminders) {
        const scheduled = await this.scheduleReminder(userId, reminder, settings)
        if (scheduled) {
          scheduledReminders.push(scheduled)
        }
      }

      return scheduledReminders
    } catch (error) {
      console.error('Error generating smart reminders:', error)
      return []
    }
  }

  // Generate revisit reminders
  private async generateRevisitReminders(userId: string, settings: ReminderSettings) {
    const revisitItems = await revisitSystem.getRevisitItems(userId, 3)
    const reminders: Omit<SmartReminder, 'id' | 'created_at' | 'is_sent'>[] = []

    for (const item of revisitItems) {
      if (item.urgency === 'high') {
        reminders.push({
          user_id: userId,
          reminder_type: 'revisit',
          title: `Time to revisit ${item.topic}`,
          message: this.generateRevisitMessage(item),
        })
      }
    }

    return reminders
  }

  // Generate practice reminders
  private async generatePracticeReminders(userId: string, settings: ReminderSettings) {
    // Check if user hasn't practiced recently
    const reminders: Omit<SmartReminder, 'id' | 'created_at' | 'is_sent'>[] = []

    // This would typically check recent practice activity
    // For now, we'll create a simple practice reminder
    reminders.push({
      user_id: userId,
      reminder_type: 'practice',
      title: 'Quick practice session',
      message: 'You were close last time — want a fast retry? Just 3 minutes to strengthen your understanding.',
    })

    return reminders
  }

  // Generate deadline reminders
  private async generateDeadlineReminders(userId: string, settings: ReminderSettings) {
    try {
      const { data: deadlines } = await this.supabase
        .from('user_deadlines')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', false)
        .lte('deadline_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()) // Next 7 days
        .order('deadline_date', { ascending: true })

      const reminders: Omit<SmartReminder, 'id' | 'created_at' | 'is_sent'>[] = []

      for (const deadline of deadlines || []) {
        const daysUntil = Math.ceil((new Date(deadline.deadline_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        
        if (daysUntil <= 3) {
          reminders.push({
            user_id: userId,
            reminder_type: 'deadline',
            title: `Upcoming: ${deadline.title}`,
            message: `${deadline.title} is in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}. Time to prepare!`,
          })
        }
      }

      return reminders
    } catch (error) {
      console.error('Error generating deadline reminders:', error)
      return []
    }
  }

  // Schedule a reminder at the next preferred time
  private async scheduleReminder(
    userId: string, 
    reminder: Omit<SmartReminder, 'id' | 'created_at' | 'is_sent'>, 
    settings: ReminderSettings
  ) {
    try {
      const nextTime = this.getNextPreferredTime(settings.preferredTimes, settings.quietHours)
      
      const { data, error } = await this.supabase
        .from('notifications')
        .insert({
          ...reminder,
          scheduled_for: nextTime.toISOString(),
          is_sent: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error scheduling reminder:', error)
      return null
    }
  }

  // Get next preferred time that's not during quiet hours
  private getNextPreferredTime(preferredTimes: string[], quietHours: { start: string; end: string }): Date {
    const now = new Date()
    
    for (const timeStr of preferredTimes) {
      const [hours, minutes] = timeStr.split(':').map(Number)
      const scheduledTime = new Date(now)
      scheduledTime.setHours(hours, minutes, 0, 0)
      
      // If the time has passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1)
      }
      
      // Check if it's during quiet hours
      if (!this.isDuringQuietHours(scheduledTime, quietHours)) {
        return scheduledTime
      }
    }
    
    // If all preferred times are during quiet hours, schedule for tomorrow at first preferred time
    const [hours, minutes] = preferredTimes[0].split(':').map(Number)
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(hours, minutes, 0, 0)
    
    return tomorrow
  }

  // Check if a time is during quiet hours
  private isDuringQuietHours(time: Date, quietHours: { start: string; end: string }): boolean {
    const [startHour, startMin] = quietHours.start.split(':').map(Number)
    const [endHour, endMin] = quietHours.end.split(':').map(Number)
    
    const currentMinutes = time.getHours() * 60 + time.getMinutes()
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    
    if (startMinutes > endMinutes) {
      // Quiet hours span midnight (e.g., 22:00 to 08:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes
    } else {
      // Normal quiet hours (e.g., 01:00 to 06:00)
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes
    }
  }

  // Generate personalized revisit message
  private generateRevisitMessage(item: any): string {
    const timeEstimate = item.time_estimate || 5
    
    switch (item.urgency) {
      case 'high':
        return `Quick ${timeEstimate}-minute fix before this fades? You were really close last time.`
      case 'medium':
        return `${timeEstimate} minutes to strengthen ${item.topic}. Your understanding is almost there!`
      case 'low':
        return `Quick ${timeEstimate}-minute review of ${item.topic} to keep it fresh.`
      default:
        return `Time to revisit ${item.topic}? Just ${timeEstimate} minutes.`
    }
  }

  // Calculate reminder priority
  private calculateReminderPriority(reminder: Omit<SmartReminder, 'id' | 'created_at' | 'is_sent'>): number {
    switch (reminder.reminder_type) {
      case 'deadline':
        return 100 // Highest priority
      case 'revisit':
        return 80 // High priority
      case 'practice':
        return 60 // Medium priority
      default:
        return 40
    }
  }

  // Get today's reminder count
  private async getTodayReminderCount(userId: string): Promise<number> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { data, error } = await this.supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('is_sent', true)
        .gte('sent_at', today.toISOString())

      if (error) throw error
      return data?.length || 0
    } catch (error) {
      console.error('Error getting today reminder count:', error)
      return 0
    }
  }

  // Mark reminder as sent
  async markAsSent(reminderId: string) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .update({
          is_sent: true,
          sent_at: new Date().toISOString()
        })
        .eq('id', reminderId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error marking reminder as sent:', error)
      return null
    }
  }

  // Mute/unmute reminders (disabled as notifications table has no is_muted column)
  async muteReminders(userId: string, isMuted: boolean) {
    return true
  }

  // Get pending reminders
  async getPendingReminders(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_sent', false)
        .lte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting pending reminders:', error)
      return []
    }
  }
}

export const smartReminders = new SmartReminders()

// React hook for smart reminders
export const useSmartReminders = (userId: string) => {
  const [settings, setSettings] = useState<ReminderSettings | null>(null)
  const [pendingReminders, setPendingReminders] = useState<SmartReminder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [reminderSettings, pending] = await Promise.all([
          smartReminders.getReminderSettings(userId),
          smartReminders.getPendingReminders(userId)
        ])

        setSettings(reminderSettings)
        setPendingReminders(pending)
      } catch (error) {
        console.error('Error loading reminder data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      loadData()
    }
  }, [userId])

  return {
    settings,
    pendingReminders,
    loading,
    updateSettings: smartReminders.updateReminderSettings.bind(smartReminders),
    generateReminders: smartReminders.generateSmartReminders.bind(smartReminders),
    markAsSent: smartReminders.markAsSent.bind(smartReminders),
    muteReminders: smartReminders.muteReminders.bind(smartReminders)
  }
}
