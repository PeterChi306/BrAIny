'use client'

import { useUserTier } from '@/contexts/UserTierContext'
import { cn } from '@/lib/utils'
import { Crown, Sparkles, Star, Shield, User } from 'lucide-react'

interface TierBadgeProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

export function TierBadge({ className, showText = true, size = 'md', onClick }: TierBadgeProps) {
  const { userTier } = useUserTier()

  const tierConfig = {
    starter: {
      name: 'Starter',
      colors: 'from-gray-500 to-gray-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-gray-100 dark:bg-gray-800 border border-gray-300',
      borderColor: 'border-gray-300',
      icon: User,
      gradient: 'bg-gray-100 dark:bg-gray-800',
      glow: 'shadow-gray-500/20',
    },
    scholar: {
      name: 'Scholar',
      colors: 'from-blue-500 to-purple-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-300',
      icon: Sparkles,
      gradient: 'bg-gradient-to-r from-blue-500 to-purple-600',
      glow: 'shadow-blue-500/30',
    },
    master: {
      name: 'Master',
      colors: 'from-purple-500 to-pink-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-300',
      icon: Shield,
      gradient: 'bg-gradient-to-r from-purple-600 to-pink-600',
      glow: 'shadow-purple-500/40',
    },
    legend: {
      name: 'Legend',
      colors: 'from-orange-500 to-red-600',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-300',
      icon: Crown,
      gradient: 'bg-gradient-to-r from-orange-600 to-red-600',
      glow: 'shadow-orange-500/40',
    },
  }

  const config = tierConfig[userTier]
  const Icon = config.icon

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  const getTierStyles = () => {
    switch (userTier) {
      case 'starter':
        return 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300';
      case 'scholar':
        return 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent shadow-blue-500/30 dark:shadow-blue-500/50';
      case 'master':
        return 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-purple-500/40 dark:shadow-purple-500/60';
      case 'legend':
        return 'bg-gradient-to-r from-orange-600 to-red-600 text-white border-transparent shadow-orange-500/40 dark:shadow-orange-500/60';
      default:
        return '';
    }
  };

  return (
    <div
      className={cn(
        "px-3 py-1 rounded-full text-xs font-bold tracking-tight shadow-xl flex items-center gap-1.5 transition-all duration-500",
        // Dark mode styles
        "dark:bg-slate-900/40 dark:backdrop-blur-xl dark:border dark:border-white/10 dark:text-white",
        // Light mode styles
        "bg-white/60 backdrop-blur-xl border border-blue-100 text-blue-700 shadow-blue-500/5",
        getTierStyles(),
        onClick && 'cursor-pointer hover:scale-105',
        className
      )}
      onClick={onClick}
    >
      <Icon className={cn(iconSizes[size], userTier !== 'starter' && 'text-white')} />
      {showText && <span>{config.name}</span>}
    </div>
  )
}

interface GlowingNameProps {
  children: React.ReactNode
  className?: string
}

export function GlowingName({ children, className }: GlowingNameProps) {
  const { userTier } = useUserTier()

  const glowEffects = {
    starter: 'text-blue-600 hover:text-blue-700 transition-all duration-300',
    scholar: 'text-blue-600 drop-shadow-lg hover:drop-shadow-xl transition-all duration-300 hover:text-blue-700',
    master: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 drop-shadow-lg hover:drop-shadow-xl transition-all duration-300',
    legend: 'text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 drop-shadow-lg hover:drop-shadow-xl transition-all duration-300',
  }

  return (
    <span className={cn(
      "font-bold tracking-tight drop-shadow-sm transition-all duration-500",
      // Dark mode gradient
      "dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-r dark:from-white dark:to-white/60",
      // Light mode colors
      "bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600",
      className
    )}>
      {children}
    </span>
  )
}

interface PrestigeBorderProps {
  children: React.ReactNode
  className?: string
}

export function PrestigeBorder({ children, className }: PrestigeBorderProps) {
  const { userTier } = useUserTier()

  const borderEffects = {
    starter: 'border border-gray-200 dark:border-gray-700',
    scholar: 'border-2 border-blue-200 dark:border-blue-800 shadow-lg shadow-blue-500/20',
    master: 'border-2 border-purple-200 dark:border-purple-800 shadow-xl shadow-purple-500/30 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10',
    legend: 'border-2 border-orange-200 dark:border-orange-800 shadow-2xl shadow-orange-500/40 bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-orange-900/10 dark:to-red-900/10',
  }

  return (
    <div className={cn('rounded-2xl transition-all duration-300', borderEffects[userTier], className)}>
      {children}
    </div>
  )
}

interface PremiumBackgroundProps {
  children: React.ReactNode
  className?: string
}

export function PremiumBackground({ children, className }: PremiumBackgroundProps) {
  const { userTier } = useUserTier()

  const backgrounds = {
    starter: 'bg-background',
    scholar: 'bg-background',
    master: 'bg-background',
    legend: 'bg-background',
  }

  return (
    <div className={cn('min-h-screen relative transition-all duration-700 w-full', backgrounds[userTier], className)}>
      {/* Background Layer - Strictly bounded to the parent */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-[inherit]">
        <div className="aurora-container h-full w-full" />
      </div>

      {/* Content Layer - Scrollable */}
      <div className="relative z-10 w-full min-h-screen">
        {children}
      </div>
    </div>
  )
}
