'use client'

import { useEffect } from 'react'
import { useAppTimeTracker } from '@/hooks/useAppTimeTracker'

interface AppTimeTrackerProviderProps {
  children: React.ReactNode
}

export function AppTimeTrackerProvider({ children }: AppTimeTrackerProviderProps) {
  const { updateActivity } = useAppTimeTracker()

  // Track user activity throughout the app
  useEffect(() => {
    // Handle various user interactions
    const handleUserActivity = () => {
      updateActivity()
    }

    // Listen for common user interactions
    const events = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 
      'touchstart', 'click', 'focus'
    ]

    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true })
    })

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      updateActivity()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [updateActivity])

  return <>{children}</>
}
