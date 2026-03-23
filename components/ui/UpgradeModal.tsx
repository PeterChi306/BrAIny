'use client'

import { useUserTier } from '@/contexts/UserTierContext'
import { useRouter } from 'next/navigation'
import { Crown, Sparkles, Shield, Zap, ArrowRight, X, Check, Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  featureName?: string
  featureDescription?: string
  requiredTier?: 'scholar' | 'master' | 'legend'
}

const tierConfig = {
  scholar: {
    name: 'Scholar',
    price: '$9.99/mo',
    color: 'from-blue-500 to-indigo-600',
    glow: 'shadow-blue-500/30',
    icon: Sparkles,
    perks: [
      '65 AI messages per day',
      'Text extraction from images',
      'Advanced study guides',
      'Improved quiz generation',
    ],
  },
  master: {
    name: 'Master',
    price: '$14.99/mo',
    color: 'from-purple-500 to-pink-600',
    glow: 'shadow-purple-500/40',
    icon: Shield,
    perks: [
      'Unlimited AI messages',
      'Smart PDF Export',
      'Adaptive quizzes',
      'Personalized study plans',
    ],
  },
  legend: {
    name: 'Legend',
    price: '$23.99/mo',
    color: 'from-orange-500 to-red-600',
    glow: 'shadow-orange-500/40',
    icon: Crown,
    perks: [
      'All Master features',
      'Weak Spot Analysis',
      'Priority AI processing',
      'Professional PDF Export',
    ],
  },
}

export function UpgradeModal({
  isOpen,
  onClose,
  featureName,
  featureDescription,
  requiredTier = 'scholar',
}: UpgradeModalProps) {
  const router = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setVisible(true), 10)
    } else {
      setVisible(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const config = tierConfig[requiredTier]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 transition-all duration-300',
        visible ? 'opacity-100' : 'opacity-0'
      )}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500',
          visible ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'
        )}
      >
        {/* Gradient Header */}
        <div className={cn('relative p-6 pb-8 bg-gradient-to-br overflow-hidden', config.color)}>
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute -left-4 -bottom-4 w-20 h-20 rounded-full bg-white/10" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="relative z-10 flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Upgrade to</p>
              <h2 className="text-2xl font-black text-white">{config.name}</h2>
            </div>
          </div>

          {featureName && (
            <div className="relative z-10 bg-white/15 rounded-2xl px-4 py-3 mt-1">
              <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-0.5">
                🔒 Feature Required
              </p>
              <p className="text-white font-bold text-sm">{featureName}</p>
              {featureDescription && (
                <p className="text-white/70 text-xs mt-0.5">{featureDescription}</p>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 pt-5">
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
            What you'll unlock
          </p>
          <ul className="space-y-3 mb-6">
            {config.perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3">
                <div className={cn('w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br', config.color)}>
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{perk}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => {
              onClose()
              router.push('/subscription')
            }}
            className={cn(
              'w-full py-3.5 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-300 active:scale-95 bg-gradient-to-r',
              config.color
            )}
          >
            <Rocket className="w-4 h-4" />
            Upgrade for {config.price}
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="w-full mt-3 py-2 text-gray-400 dark:text-gray-600 text-sm font-medium hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
          >
            Maybe later
          </button>

          <p className="text-center text-[10px] text-gray-400 dark:text-gray-600 mt-3">
            ✨ Cancel anytime • 💳 Secure • 🎓 No commitment
          </p>
        </div>
      </div>
    </div>
  )
}
