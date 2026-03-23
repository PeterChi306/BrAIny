'use client'

// Notification service for calendar events and study reminders

import { useState, useEffect } from 'react'

export interface Notification {
  id: string
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  requireInteraction?: boolean
}

class NotificationService {
  private isSupported: boolean = false
  private permission: NotificationPermission = 'default'

  constructor() {
    this.checkSupport()
  }

  private checkSupport() {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      this.isSupported = false
      return
    }
    
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator
    if (this.isSupported) {
      this.permission = Notification.permission
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Notifications not supported')
      return false
    }

    if (this.permission === 'granted') {
      return true
    }

    if (this.permission === 'denied') {
      console.warn('Notifications denied')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      this.permission = permission
      return permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  async show(notification: Notification): Promise<void> {
    if (!this.isSupported || this.permission !== 'granted') {
      console.warn('Cannot show notification: not supported or permission denied')
      return
    }

    try {
      const notificationOptions: NotificationOptions = {
        body: notification.body,
        icon: notification.icon || '/favicon.ico',
        badge: notification.badge || '/favicon.ico',
        tag: notification.tag,
        data: notification.data,
        requireInteraction: notification.requireInteraction || false
      }

      const browserNotification = new Notification(notification.title, notificationOptions)

      // Auto-close after 5 seconds unless requireInteraction is true
      if (!notification.requireInteraction) {
        setTimeout(() => {
          browserNotification.close()
        }, 5000)
      }

      // Handle click events
      browserNotification.onclick = (event) => {
        event.preventDefault()
        browserNotification.close()
        
        // Handle navigation based on notification data
        if (notification.data?.url) {
          window.open(notification.data.url, '_blank')
        }
        
        // Focus on the window
        window.focus()
      }

    } catch (error) {
      console.error('Error showing notification:', error)
    }
  }

  async scheduleCalendarEvent(title: string, description: string, dateTime: Date, eventId: string): Promise<void> {
    const now = new Date()
    const timeUntilEvent = dateTime.getTime() - now.getTime()

    if (timeUntilEvent <= 0) {
      console.warn('Cannot schedule notification for past date')
      return
    }

    // Schedule notification 15 minutes before the event
    const reminderTime = timeUntilEvent - (15 * 60 * 1000)
    
    if (reminderTime > 0) {
      setTimeout(async () => {
        await this.show({
          id: `calendar-${eventId}`,
          title: `📅 Upcoming: ${title}`,
          body: `Starting in 15 minutes: ${description}`,
          icon: '/calendar-icon.png',
          tag: `calendar-${eventId}`,
          requireInteraction: true,
          data: {
            type: 'calendar',
            eventId: eventId,
            url: `/planner`
          }
        })
      }, reminderTime)
    }

    // Schedule notification at event time
    setTimeout(async () => {
      await this.show({
        id: `calendar-start-${eventId}`,
        title: `📅 ${title} - Starting Now!`,
        body: description,
        icon: '/calendar-icon.png',
        tag: `calendar-start-${eventId}`,
        requireInteraction: true,
        data: {
          type: 'calendar',
          eventId: eventId,
          url: `/planner`
        }
      })
    }, timeUntilEvent)
  }

  async scheduleStudyReminder(topic: string, studyTime: Date, reminderId: string): Promise<void> {
    const now = new Date()
    const timeUntilStudy = studyTime.getTime() - now.getTime()

    if (timeUntilStudy <= 0) {
      console.warn('Cannot schedule notification for past time')
      return
    }

    setTimeout(async () => {
      await this.show({
        id: `study-${reminderId}`,
        title: `📚 Study Reminder: ${topic}`,
        body: `Time to review ${topic}! Let's keep your learning streak going.`,
        icon: '/study-icon.png',
        tag: `study-${reminderId}`,
        requireInteraction: false,
        data: {
          type: 'study',
          topic: topic,
          reminderId: reminderId,
          url: `/tutor`
        }
      })
    }, timeUntilStudy)
  }

  async scheduleDailyStudyReminder(time: string, topics: string[]): Promise<void> {
    const [hours, minutes] = time.split(':').map(Number)
    const now = new Date()
    const reminderTime = new Date()
    reminderTime.setHours(hours, minutes, 0, 0)

    // If time has passed today, schedule for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1)
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime()

    setTimeout(async () => {
      const topicList = topics.slice(0, 3).join(', ')
      await this.show({
        id: `daily-study-${Date.now()}`,
        title: `📚 Daily Study Time!`,
        body: `Time to review: ${topicList}${topics.length > 3 ? ' and more...' : ''}`,
        icon: '/study-icon.png',
        tag: 'daily-study',
        requireInteraction: false,
        data: {
          type: 'daily-study',
          topics: topics,
          url: `/tutor`
        }
      })

      // Schedule for next day
      this.scheduleDailyStudyReminder(time, topics)
    }, timeUntilReminder)
  }

  async showStreakReminder(currentStreak: number, lastStudyDate: Date): Promise<void> {
    const now = new Date()
    const daysSinceLastStudy = Math.floor((now.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceLastStudy >= 2) {
      await this.show({
        id: `streak-reminder-${Date.now()}`,
        title: `🔥 Keep Your Streak Alive!`,
        body: `You have a ${currentStreak}-day streak! Study today to keep it going.`,
        icon: '/fire-icon.png',
        tag: 'streak-reminder',
        requireInteraction: false,
        data: {
          type: 'streak',
          streak: currentStreak,
          url: `/tutor`
        }
      })
    }
  }

  async showAchievementUnlocked(achievement: string, description: string): Promise<void> {
    await this.show({
      id: `achievement-${Date.now()}`,
      title: `🏆 Achievement Unlocked!`,
      body: `${achievement}: ${description}`,
      icon: '/trophy-icon.png',
      tag: 'achievement',
      requireInteraction: false,
      data: {
        type: 'achievement',
        achievement: achievement,
        url: `/gamification`
      }
    })
  }

  getPermissionStatus(): NotificationPermission {
    return this.permission
  }

  isNotificationSupported(): boolean {
    return this.isSupported
  }
}

// Singleton instance
export const notificationService = new NotificationService()

// React hook for using notifications
export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    setPermission(notificationService.getPermissionStatus())
    setIsSupported(notificationService.isNotificationSupported())
  }, [])

  const requestPermission = async () => {
    const granted = await notificationService.requestPermission()
    setPermission(notificationService.getPermissionStatus())
    return granted
  }

  const showNotification = async (notification: Notification) => {
    await notificationService.show(notification)
  }

  const scheduleCalendarEvent = async (title: string, description: string, dateTime: Date, eventId: string) => {
    await notificationService.scheduleCalendarEvent(title, description, dateTime, eventId)
  }

  const scheduleStudyReminder = async (topic: string, studyTime: Date, reminderId: string) => {
    await notificationService.scheduleStudyReminder(topic, studyTime, reminderId)
  }

  const scheduleDailyStudyReminder = async (time: string, topics: string[]) => {
    await notificationService.scheduleDailyStudyReminder(time, topics)
  }

  const showStreakReminder = async (currentStreak: number, lastStudyDate: Date) => {
    await notificationService.showStreakReminder(currentStreak, lastStudyDate)
  }

  const showAchievementUnlocked = async (achievement: string, description: string) => {
    await notificationService.showAchievementUnlocked(achievement, description)
  }

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    scheduleCalendarEvent,
    scheduleStudyReminder,
    scheduleDailyStudyReminder,
    showStreakReminder,
    showAchievementUnlocked
  }
}
