'use client'

import { useUserTier } from '@/contexts/UserTierContext'
import { useRouter } from 'next/navigation'
import { Crown, Sparkles, Zap, ArrowRight, Shield, Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PremiumPromotionCardProps {
  className?: string
  compact?: boolean
}

export function PremiumPromotionCard({ className, compact = false }: PremiumPromotionCardProps) {
  const { userTier } = useUserTier()
  const router = useRouter()

  if (userTier === 'legend') return null

  const promotionalContent = {
    starter: {
      target: 'Scholar',
      benefit: 'Get 65 AI messages daily',
      icon: Sparkles,
      color: 'from-blue-500 to-indigo-600',
      glow: 'shadow-blue-500/20',
      bg: 'bg-blue-50/50 dark:bg-blue-900/10'
    },
    scholar: {
      target: 'Master',
      benefit: 'Unlock Unlimited AI & Smart PDF Export',
      icon: Shield,
      color: 'from-purple-500 to-pink-600',
      glow: 'shadow-purple-500/20',
      bg: 'bg-purple-50/50 dark:bg-purple-900/10'
    },
    master: {
      target: 'Legend',
      benefit: 'Access Weak Spot Analysis & Priority Speed',
      icon: Crown,
      color: 'from-orange-500 to-red-600',
      glow: 'shadow-orange-500/20',
      bg: 'bg-orange-50/50 dark:bg-orange-900/10'
    },
    legend: {
      target: '',
      benefit: '',
      icon: Rocket,
      color: '',
      glow: '',
      bg: ''
    }
  }

  const content = promotionalContent[userTier]
  const Icon = content.icon

  if (compact) {
    return (
      <button
        onClick={() => router.push('/subscription')}
        className={cn(
          "flex items-center gap-3 p-3 rounded-2xl border border-white/20 dark:border-white/10 overflow-hidden relative group transition-all duration-300",
          content.bg,
          className
        )}
      >
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br", content.color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Upgrade to {content.target}</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{content.benefit}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
      </button>
    )
  }

  return (
    <div className={cn(
      "relative overflow-hidden rounded-3xl p-6 border border-white/20 dark:border-white/10 group cursor-pointer",
      content.bg,
      className
    )}
    onClick={() => router.push('/subscription')}
    >
      {/* Animated Gradient Background */}
      <div className={cn(
        "absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br",
        content.color
      )} />
      
      {/* Decorative Circles */}
      <div className={cn(
        "absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-20 bg-gradient-to-br",
        content.color
      )} />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
            content.color,
            content.glow
          )}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-0.5 block">Recommended Power-up</span>
            <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
              Become a <span className={cn("text-transparent bg-clip-text bg-gradient-to-r", content.color)}>{content.target}</span>
            </h3>
          </div>
        </div>

        <p className="text-gray-600 dark:text-white/70 font-medium text-sm leading-relaxed">
          {content.benefit}. Unlock your full learning potential with advanced AI tools.
        </p>

        <div className="flex items-center justify-between mt-2">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-gray-400" />
              </div>
            ))}
            <div className="pl-4 flex items-center">
                <span className="text-[10px] font-bold text-gray-400">Join 2k+ students</span>
            </div>
          </div>
          
          <div className={cn(
            "px-4 py-2 rounded-xl text-white font-bold text-sm flex items-center gap-2 shadow-lg transition-all duration-300 group-hover:translate-x-1 bg-gradient-to-r",
            content.color
          )}>
            Upgrade Now
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  )
}
