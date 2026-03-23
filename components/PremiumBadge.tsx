'use client'

import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PremiumBadgeProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'subtle' | 'blur'
}

export function PremiumBadge({ className, size = 'md', variant = 'default' }: PremiumBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  if (variant === 'blur') {
    return (
      <div className={cn('relative', className)}>
        <div className="blur-sm opacity-50">{/* Content will be blurred */}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border-2 border-primary-300 shadow-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-semibold text-primary-700">Premium</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold',
        sizeClasses[size],
        variant === 'subtle' && 'bg-gray-100 text-gray-600 from-transparent to-transparent',
        className
      )}
    >
      <Sparkles className="w-3 h-3" />
      <span>Premium</span>
    </div>
  )
}

