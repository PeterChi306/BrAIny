'use client'

import { useState, useRef, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  enabled?: boolean
  threshold?: number
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  enabled = true, 
  threshold = 80 
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef(0)
  const currentY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled) return

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY
        setIsPulling(true)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return

      currentY.current = e.touches[0].clientY
      const distance = Math.max(0, currentY.current - startY.current)
      
      if (distance < threshold * 2) {
        setPullDistance(distance)
        e.preventDefault()
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling) return

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true)
        setPullDistance(0)
        
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(20)
        }

        try {
          await onRefresh()
        } catch (error) {
          console.error('Refresh failed:', error)
        } finally {
          setIsRefreshing(false)
          setIsPulling(false)
        }
      } else {
        setPullDistance(0)
        setIsPulling(false)
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, isPulling, pullDistance, threshold, onRefresh, isRefreshing])

  const pullProgress = Math.min(pullDistance / threshold, 1)

  return (
    <div ref={containerRef} className="relative">
      {/* Pull to refresh indicator */}
      <div 
        className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
        style={{
          height: `${pullDistance}px`,
          opacity: pullProgress,
          transform: `translateY(-${Math.min(pullDistance, threshold)}px)`
        }}
      >
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
          <RefreshCw 
            className={`w-4 h-4 text-blue-600 dark:text-blue-400 transition-transform ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={{ transform: `rotate(${pullProgress * 360}deg)` }}
          />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {isRefreshing ? 'Refreshing...' : pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div 
        className="transition-transform duration-200"
        style={{ transform: `translateY(${Math.min(pullDistance, threshold)}px)` }}
      >
        {children}
      </div>
    </div>
  )
}
