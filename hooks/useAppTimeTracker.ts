'use client'

import { useEffect, useRef, useCallback } from 'react'
import { appTimeTracker } from '@/lib/app-time-tracker'
import { createSupabaseClient } from '@/lib/supabase/client'

export function useAppTimeTracker() {
  const supabase = createSupabaseClient()
  const isTracking = useRef(false)
  const activityTimeoutRef = useRef<NodeJS.Timeout>()

  // Start tracking when component mounts
  const startTracking = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session && !isTracking.current) {
        await appTimeTracker.startAppSession(session.user.id)
        isTracking.current = true
        console.log('Started tracking app time')
      }
    } catch (error) {
      console.error('Error starting app time tracking:', error)
    }
  }, [supabase])

  // Stop tracking when component unmounts or user logs out
  const stopTracking = useCallback(async () => {
    if (isTracking.current) {
      await appTimeTracker.endAppSession()
      isTracking.current = false
      console.log('Stopped tracking app time')
    }
  }, [])

  // Update activity on user interactions
  const updateActivity = useCallback(() => {
    appTimeTracker.updateActivity()
  }, [])

  // Handle user activity events
  const handleUserActivity = useCallback(() => {
    updateActivity()
    
    // Set up next activity check
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current)
    }
    
    activityTimeoutRef.current = setTimeout(() => {
      // Check for inactivity every 30 seconds
      updateActivity()
    }, 30000)
  }, [updateActivity])

  // Set up global activity listeners
  useEffect(() => {
    const activityEvents = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'
    ]

    const handleActivity = () => {
      handleUserActivity()
    }

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Start tracking on mount
    startTracking()

    // Cleanup on unmount
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current)
      }
      
      stopTracking()
    }
  }, [startTracking, stopTracking, handleUserActivity])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, update activity
        updateActivity()
      } else {
        // Page is visible again, update activity
        updateActivity()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [updateActivity])

  // Handle beforeunload (user closing tab)
  useEffect(() => {
    const handleBeforeUnload = () => {
      stopTracking()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [stopTracking])

  return {
    isTracking: isTracking.current,
    getCurrentDuration: appTimeTracker.getCurrentActiveDuration(),
    updateActivity
  }
}
