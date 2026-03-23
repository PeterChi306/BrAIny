'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { TierBadge, GlowingName } from '@/components/ui/PremiumUI'
import { 
  Zap, 
  Flame, 
  Trophy, 
  TrendingUp, 
  Menu, 
  Brain, 
  Loader2, 
  Activity,
  ChevronRight
} from 'lucide-react'
import { useUserTier } from '@/contexts/UserTierContext'
import { useRouter } from 'next/navigation'

interface TutorHeaderProps {
  userName?: string
  mode?: 'explain' | 'practice' | 'quiz'
  isThinking?: boolean
  streak?: number
  progress?: number
  xp?: number
  responseDepth?: 'detailed' | 'concise'
  onDepthChange?: (depth: 'detailed' | 'concise') => void
  onMenuToggle?: () => void
  className?: string
}

export function TutorHeader({
  userName = 'Student',
  mode = 'explain',
  isThinking = false,
  streak = 0,
  progress = 0,
  xp = 0,
  responseDepth = 'detailed',
  onDepthChange,
  onMenuToggle,
  className
}: TutorHeaderProps) {
  const { userTier } = useUserTier()
  const router = useRouter()
  const getModeLabel = () => {
    switch (mode) {
      case 'explain': return 'Explain'
      case 'practice': return 'Practice'
      case 'quiz': return 'Quiz'
      default: return 'Tutor'
    }
  }

  const getModeColor = () => {
    switch (mode) {
      case 'explain': return 'text-blue-500'
      case 'practice': return 'text-green-500'
      case 'quiz': return 'text-purple-500'
      default: return 'text-blue-500'
    }
  }

  return (
    <div className={cn("sticky top-0 z-50 w-full transition-all duration-300", className)}>
      <div className="relative group/header overflow-hidden backdrop-blur-3xl bg-white/80 dark:bg-slate-900/80 border-b border-white/10 p-3 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4 relative z-10">
          
          {/* Left section - Identity & Mode */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onMenuToggle}
              className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-blue-500/10 transition-all duration-300 group"
            >
              <Menu className="w-5 h-5 text-slate-900 dark:text-white/60 group-hover:text-blue-500 group-hover:rotate-90 transition-all duration-300" />
            </button>
            
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-slate-900 dark:text-white font-black tracking-tighter text-xs sm:text-sm uppercase">
                  TUTOR
                </span>
                <TierBadge size="sm" showText={false} className="h-4" />
              </div>
              <div className="flex items-center gap-1 opacity-60">
                <span className={cn("text-[8px] uppercase tracking-[0.1em] font-bold", getModeColor())}>
                  {getModeLabel()}
                </span>
                <ChevronRight className="w-2 h-2" />
                <span className="text-[8px] uppercase tracking-[0.1em] font-bold">
                  Interface
                </span>
              </div>
            </div>
          </div>

          {/* Right section - Control Hub */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Depth Toggle Hub */}
            <div className="flex items-center bg-black/10 dark:bg-white/5 rounded-full p-1 border border-black/5 dark:border-white/10 backdrop-blur-xl">
               <button 
                 onClick={() => onDepthChange?.('detailed')}
                 className={cn(
                   "px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-widest transition-all duration-300",
                   responseDepth === 'detailed' 
                    ? "bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xl scale-105" 
                    : "text-slate-500 hover:text-slate-400"
                 )}
               >
                 Detailed
               </button>
               <button 
                 onClick={() => onDepthChange?.('concise')}
                 className={cn(
                   "px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-widest transition-all duration-300",
                   responseDepth === 'concise' 
                    ? "bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xl scale-105" 
                    : "text-slate-500 hover:text-slate-400"
                 )}
               >
                 Concise
               </button>
            </div>

            {/* Neural Signal */}
            {isThinking && (
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20">
                <Activity className="w-3 h-3 text-blue-500 animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
