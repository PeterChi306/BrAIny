'use client'

import { useEffect } from 'react'
import { localNotificationService } from '@/lib/local-notifications'

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize the notification service when the app starts
    localNotificationService.initialize()
  }, [])

  return <>{children}</>
}
