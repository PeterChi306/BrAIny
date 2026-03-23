// Enhanced notification system for brAIny with local scheduling
// Supports daily study reminders and event-based reminders

export interface NotificationSettings {
  isStudyReminderEnabled: boolean
  studyReminderTime: string // Format: "19:00" for 7:00 PM
  eventReminderOffset: number // Days before event (1, 3, or custom)
}

export interface ScheduledNotification {
  id: string
  type: 'daily-study' | 'event-reminder'
  title: string
  body: string
  scheduledTime: Date
  repeats: boolean
  data?: any
}

export interface CalendarEvent {
  id: string
  title: string
  date: string // ISO string
  reminderOffset?: number // Days before to remind
  notificationId?: string
}

class LocalNotificationService {
  private scheduledNotifications: Map<string, NodeJS.Timeout> = new Map()
  private settings: NotificationSettings = {
    isStudyReminderEnabled: false,
    studyReminderTime: '19:00',
    eventReminderOffset: 1
  }

  constructor() {
    this.loadSettings()
    this.loadScheduledNotifications()
  }

  // Load settings from localStorage
  private loadSettings(): void {
    if (typeof window === 'undefined') return
    
    try {
      const saved = localStorage.getItem('brAIny_notificationSettings')
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.error('Error loading notification settings:', error)
    }
  }

  // Save settings to localStorage
  private saveSettings(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem('brAIny_notificationSettings', JSON.stringify(this.settings))
    } catch (error) {
      console.error('Error saving notification settings:', error)
    }
  }

  // Load scheduled notifications from localStorage and reschedule
  private loadScheduledNotifications(): void {
    if (typeof window === 'undefined') return
    
    try {
      const saved = localStorage.getItem('brAIny_scheduledNotifications')
      if (saved) {
        const notifications: ScheduledNotification[] = JSON.parse(saved)
        notifications.forEach(notification => {
          this.scheduleNotification(notification)
        })
      }
    } catch (error) {
      console.error('Error loading scheduled notifications:', error)
    }
  }

  // Save scheduled notifications to localStorage
  private saveScheduledNotifications(): void {
    if (typeof window === 'undefined') return
    
    try {
      const notifications: ScheduledNotification[] = Array.from(this.scheduledNotifications.values()).map(timeout => {
        // This is a simplified approach - in production, you'd want to store the actual notification data
        return {
          id: timeout.toString(),
          type: 'daily-study' as const,
          title: '',
          body: '',
          scheduledTime: new Date(),
          repeats: false
        }
      })
      localStorage.setItem('brAIny_scheduledNotifications', JSON.stringify(notifications))
    } catch (error) {
      console.error('Error saving scheduled notifications:', error)
    }
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Notifications not supported in this environment')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      console.warn('Notification permission denied')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  // Check if notifications are supported and permitted
  getNotificationStatus(): { supported: boolean; permission: NotificationPermission } {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { supported: false, permission: 'default' }
    }

    return {
      supported: true,
      permission: Notification.permission
    }
  }

  // Show a notification immediately
  private showNotification(notification: ScheduledNotification): void {
    if (Notification.permission !== 'granted') {
      console.warn('Cannot show notification: permission not granted')
      return
    }

    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: false,
        data: notification.data
      })

      // Auto-close after 5 seconds
      setTimeout(() => {
        browserNotification.close()
      }, 5000)

      // Handle click events
      browserNotification.onclick = (event) => {
        event.preventDefault()
        browserNotification.close()
        
        // Handle navigation based on notification data
        if (notification.data?.url) {
          window.focus()
          window.location.href = notification.data.url
        }
      }

    } catch (error) {
      console.error('Error showing notification:', error)
    }
  }

  // Schedule a notification
  scheduleNotification(notification: ScheduledNotification): void {
    const now = new Date()
    const scheduledTime = new Date(notification.scheduledTime)

    // If scheduled time is in the past and it doesn't repeat, don't schedule
    if (scheduledTime <= now && !notification.repeats) {
      console.warn('Cannot schedule notification for past time:', notification.id)
      return
    }

    // Calculate time until notification
    let timeUntilNotification = scheduledTime.getTime() - now.getTime()
    
    // If it's a repeating daily notification and time has passed today, schedule for tomorrow
    if (notification.repeats && timeUntilNotification <= 0) {
      const tomorrow = new Date(scheduledTime)
      tomorrow.setDate(tomorrow.getDate() + 1)
      timeUntilNotification = tomorrow.getTime() - now.getTime()
    }

    // Clear existing notification with same ID
    this.cancelNotification(notification.id)

    // Schedule the notification
    const timeout = setTimeout(() => {
      this.showNotification(notification)

      // If it's a repeating notification, schedule the next one
      if (notification.repeats) {
        const nextNotification = {
          ...notification,
          scheduledTime: new Date(scheduledTime.getTime() + 24 * 60 * 60 * 1000) // Add 1 day
        }
        this.scheduleNotification(nextNotification)
      }
    }, timeUntilNotification)

    this.scheduledNotifications.set(notification.id, timeout)
    this.saveScheduledNotifications()
  }

  // Cancel a specific notification
  cancelNotification(id: string): void {
    const timeout = this.scheduledNotifications.get(id)
    if (timeout) {
      clearTimeout(timeout)
      this.scheduledNotifications.delete(id)
      this.saveScheduledNotifications()
    }
  }

  // Get current settings
  getSettings(): NotificationSettings {
    return { ...this.settings }
  }

  // Update settings
  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    this.saveSettings()

    // Reschedule daily study reminder if settings changed
    if (newSettings.isStudyReminderEnabled !== undefined || newSettings.studyReminderTime !== undefined) {
      this.scheduleDailyStudyReminder()
    }
  }

  // Schedule daily study reminder
  scheduleDailyStudyReminder(): void {
    // Cancel existing daily reminder
    this.cancelNotification('daily-study-reminder')

    if (!this.settings.isStudyReminderEnabled) {
      return
    }

    const [hours, minutes] = this.settings.studyReminderTime.split(':').map(Number)
    const scheduledTime = new Date()
    scheduledTime.setHours(hours, minutes, 0, 0)

    const notification: ScheduledNotification = {
      id: 'daily-study-reminder',
      type: 'daily-study',
      title: 'Time to Study 📚',
      body: "Let's do a quick brAIny session.",
      scheduledTime,
      repeats: true,
      data: {
        url: '/tutor'
      }
    }

    this.scheduleNotification(notification)
  }

  // Schedule event-based reminder
  scheduleEventReminder(event: CalendarEvent): string {
    // Cancel existing notification for this event
    if (event.notificationId) {
      this.cancelNotification(event.notificationId)
    }

    const eventDate = new Date(event.date)
    const now = new Date()
    
    // Calculate reminder date (event date - offset days)
    const reminderOffset = event.reminderOffset || this.settings.eventReminderOffset
    const reminderDate = new Date(eventDate)
    reminderDate.setDate(reminderDate.getDate() - reminderOffset)
    reminderDate.setHours(18, 0, 0, 0) // Default to 6:00 PM

    // Handle edge case: if reminder date is in the past
    if (reminderDate <= now) {
      // Schedule for 1 hour from now instead
      reminderDate.setTime(now.getTime() + 60 * 60 * 1000)
    }

    const notificationId = `event-${event.id}`
    const notification: ScheduledNotification = {
      id: notificationId,
      type: 'event-reminder',
      title: `Upcoming: ${event.title}`,
      body: `Your ${event.title.toLowerCase()} is ${reminderOffset === 1 ? 'tomorrow' : `in ${reminderOffset} days`}. Quick review?`,
      scheduledTime: reminderDate,
      repeats: false,
      data: {
        eventId: event.id,
        url: '/tutor'
      }
    }

    this.scheduleNotification(notification)
    
    // Return the notification ID to store with the event
    return notificationId
  }

  // Cancel event reminder
  cancelEventReminder(eventId: string): void {
    this.cancelNotification(`event-${eventId}`)
  }

  // Get all scheduled notifications (for debugging)
  getScheduledNotifications(): string[] {
    return Array.from(this.scheduledNotifications.keys())
  }

  // Initialize the service (call this on app startup)
  initialize(): void {
    this.scheduleDailyStudyReminder()
  }
}

// Singleton instance
export const localNotificationService = new LocalNotificationService()

// React hook for using the notification service
export const useLocalNotifications = () => {
  const [status, setStatus] = useState({ supported: false, permission: 'default' as NotificationPermission })
  const [settings, setSettings] = useState<NotificationSettings>(localNotificationService.getSettings())

  useEffect(() => {
    setStatus(localNotificationService.getNotificationStatus())
    setSettings(localNotificationService.getSettings())
  }, [])

  const requestPermission = async () => {
    const granted = await localNotificationService.requestPermission()
    setStatus(localNotificationService.getNotificationStatus())
    return granted
  }

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    localNotificationService.updateSettings(newSettings)
    setSettings(localNotificationService.getSettings())
  }

  const scheduleEventReminder = (event: CalendarEvent) => {
    return localNotificationService.scheduleEventReminder(event)
  }

  const cancelEventReminder = (eventId: string) => {
    localNotificationService.cancelEventReminder(eventId)
  }

  const getScheduledNotifications = () => {
    return localNotificationService.getScheduledNotifications()
  }

  return {
    status,
    settings,
    requestPermission,
    updateSettings,
    scheduleEventReminder,
    cancelEventReminder,
    getScheduledNotifications
  }
}

import { useState, useEffect } from 'react'
