'use client'

import React, { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface CountUpProps {
  end: number
  start?: number
  duration?: number
  delay?: number
  className?: string
  prefix?: string
  suffix?: string
  decimals?: number
  separator?: string
}

export const CountUp: React.FC<CountUpProps> = ({
  end,
  start = 0,
  duration = 2000,
  delay = 0,
  className = '',
  prefix = '',
  suffix = '',
  decimals = 0,
  separator = ','
}) => {
  const [count, setCount] = useState(start)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const timer = setTimeout(() => {
      const increment = (end - start) / (duration / 16)
      let current = start

      const counter = setInterval(() => {
        current += increment
        if (current >= end) {
          setCount(end)
          clearInterval(counter)
        } else {
          setCount(current)
        }
      }, 16)

      return () => clearInterval(counter)
    }, delay)

    return () => clearTimeout(timer)
  }, [isVisible, start, end, duration, delay])

  const formatNumber = (num: number) => {
    const fixed = num.toFixed(decimals)
    const parts = fixed.split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    return parts.join('.')
  }

  return (
    <div ref={ref} className={cn('font-bold', className)}>
      {prefix}{formatNumber(count)}{suffix}
    </div>
  )
}

interface StreakCounterProps {
  streak: number
  className?: string
  showFlame?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const StreakCounter: React.FC<StreakCounterProps> = ({
  streak,
  className = '',
  showFlame = true,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl'
  }

  const flameSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showFlame && (
        <div className={cn(
          'relative',
          flameSizeClasses[size],
          streak > 0 && 'animate-pulse'
        )}>
          <div className={cn(
            'absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur-sm opacity-50',
            streak > 0 && 'animate-ping'
          )} />
          <div className="relative bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">🔥</span>
          </div>
        </div>
      )}
      <CountUp
        end={streak}
        className={cn(
          'bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent',
          sizeClasses[size]
        )}
        suffix=" day streak"
      />
    </div>
  )
}

interface ConceptCounterProps {
  concepts: number
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const ConceptCounter: React.FC<ConceptCounterProps> = ({
  concepts,
  className = '',
  showIcon = true,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl'
  }

  const iconSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showIcon && (
        <div className={cn(
          'relative',
          iconSizeClasses[size]
        )}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-sm opacity-50 animate-pulse" />
          <div className="relative bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">💡</span>
          </div>
        </div>
      )}
      <CountUp
        end={concepts}
        className={cn(
          'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent',
          sizeClasses[size]
        )}
        suffix=" concepts"
      />
    </div>
  )
}

interface XPCounterProps {
  xp: number
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const XPCounter: React.FC<XPCounterProps> = ({
  xp,
  className = '',
  showIcon = true,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl'
  }

  const iconSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showIcon && (
        <div className={cn(
          'relative',
          iconSizeClasses[size]
        )}>
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full blur-sm opacity-50 animate-pulse" />
          <div className="relative bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">⭐</span>
          </div>
        </div>
      )}
      <CountUp
        end={xp}
        className={cn(
          'bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent',
          sizeClasses[size]
        )}
        suffix=" XP"
      />
    </div>
  )
}

interface AnimatedProgressRingProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  className?: string
  showPercentage?: boolean
}

export const AnimatedProgressRing: React.FC<AnimatedProgressRingProps> = ({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  className = '',
  showPercentage = true
}) => {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const targetProgress = (value / max) * 100
    const duration = 2000
    const increment = targetProgress / (duration / 16)
    let current = 0

    const counter = setInterval(() => {
      current += increment
      if (current >= targetProgress) {
        setProgress(targetProgress)
        clearInterval(counter)
      } else {
        setProgress(current)
      }
    }, 16)

    return () => clearInterval(counter)
  }, [isVisible, value, max])

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div ref={ref} className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-blue-500 transition-all duration-300 ease-out"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))'
          }}
        />
      </svg>
      
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  )
}
