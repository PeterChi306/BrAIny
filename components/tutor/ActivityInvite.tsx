'use client'

import React from 'react'
import { Target, Brain, ArrowRight, Sparkles } from 'lucide-react'
import { LiquidGlassCard, LiquidGlassButton } from '../ui/liquid-glass'
import { cn } from '@/lib/utils'

interface ActivityInviteProps {
  type: 'quiz' | 'flashcards'
  topic: string
  onStart: () => void
  className?: string
}

export function ActivityInvite({ type, topic, onStart, className }: ActivityInviteProps) {
  const isQuiz = type === 'quiz'
  
  return (
    <LiquidGlassCard 
      variant="neon" 
      padding="md" 
      className={cn(
        "group border-2 transition-all duration-500",
        isQuiz 
          ? "border-blue-500/20 hover:border-blue-500/40 shadow-blue-500/10" 
          : "border-purple-500/20 hover:border-purple-500/40 shadow-purple-500/10",
        className
      )}
    >
      {/* Background Glow */}
      <div className={cn(
        "absolute -inset-2 opacity-0 group-hover:opacity-20 transition-opacity blur-2xl pointer-events-none",
        isQuiz ? "bg-blue-500" : "bg-purple-500"
      )} />

      <div className="relative flex flex-col sm:flex-row items-center gap-6">
        {/* Left: Icon Cluster */}
        <div className="relative">
          <div className={cn(
            "w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:rotate-6 transition-transform duration-500",
            isQuiz 
              ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/40" 
              : "bg-gradient-to-br from-purple-500 to-pink-600 shadow-purple-500/40"
          )}>
            {isQuiz ? <Target className="w-8 h-8 text-white" /> : <Brain className="w-8 h-8 text-white" />}
          </div>
          <div className="absolute -top-1 -right-1">
            <div className="relative">
              <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Middle: Content */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
             <span className={cn(
               "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
               isQuiz 
                ? "text-blue-400 border-blue-400/30 bg-blue-500/10" 
                : "text-purple-400 border-purple-400/30 bg-purple-500/10"
             )}>
               Neural {isQuiz ? 'Diagnostic' : 'Reinforcement'}
             </span>
          </div>
          <h4 className="text-xl font-black text-white tracking-tight leading-tight">
            {isQuiz ? 'Knowledge Challenge' : 'Flashcard Mastery'}
          </h4>
          <p className="text-sm text-white/50 font-medium mt-1 line-clamp-1">
            {isQuiz ? 'Test your understanding of ' : 'Power up your memory of '}{topic}
          </p>
        </div>

        {/* Right: Action */}
        <div className="w-full sm:w-auto">
          <LiquidGlassButton 
            variant="primary" 
            size="lg" 
            onClick={onStart}
            className={cn(
               "w-full sm:w-auto group/btn",
               isQuiz ? "!from-blue-600 !to-indigo-600" : "!from-purple-600 !to-pink-600"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="font-black uppercase tracking-widest text-xs">Start Activity</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </div>
          </LiquidGlassButton>
        </div>
      </div>
    </LiquidGlassCard>
  )
}
