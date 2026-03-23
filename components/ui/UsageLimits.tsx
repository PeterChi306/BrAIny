'use client'

import { useState, useEffect } from 'react'
import { useUserTier } from '@/contexts/UserTierContext'
import { createSupabaseClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { getSubscriptionLimits } from '@/lib/subscription'
import { TierBadge } from './PremiumUI'
import { 
  Sparkles, 
  Crown, 
  Zap, 
  ArrowRight, 
  X, 
  Check,
  AlertCircle,
  TrendingUp,
  Star
} from 'lucide-react'

interface UsageLimitsProps {
  className?: string
  showPromotion?: boolean
  style?: React.CSSProperties
}

export function UsageLimits({ className, showPromotion = true, style }: UsageLimitsProps) {
  const { userTier } = useUserTier()
  const [dailyUsage, setDailyUsage] = useState(0)
  const [showLimitAlert, setShowLimitAlert] = useState(false)
  const [showPromoBanner, setShowPromoBanner] = useState(false)
  const supabase = createSupabaseClient()

  const limits = getSubscriptionLimits(userTier)

  useEffect(() => {
    const loadUsage = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const today = new Date().toISOString().split('T')[0]
        const { data: usageData } = await supabase
          .from('daily_usage')
          .select('ai_messages_count, scans_count')
          .eq('user_id', session.user.id)
          .eq('date', today)
          .maybeSingle()

        console.log('Usage data:', usageData) // Debug log

        if (usageData) {
          setDailyUsage(usageData.ai_messages_count || 0)
          
          // Show limit alert if approaching or at limit
          if (!limits.hasUnlimitedUsage && usageData.ai_messages_count >= limits.dailyAiMessages - 2) {
            setShowLimitAlert(true)
          }
        } else {
          // If no usage data found, set to 0
          setDailyUsage(0)
        }

        // Show promo banner for starter users
        if (userTier === 'starter' && showPromotion) {
          setShowPromoBanner(true)
        }
      } catch (error) {
        console.error('Error loading usage:', error)
        // Set to 0 on error to show the limit
        setDailyUsage(0)
      }
    }

    loadUsage()
  }, [userTier, showPromotion])

  const currentLimit = limits.dailyAiMessages
  const isNearLimit = !limits.hasUnlimitedUsage && dailyUsage >= currentLimit - 2
  const isAtLimit = !limits.hasUnlimitedUsage && dailyUsage >= currentLimit

  // Always show for testing - remove this later
  // if (limits.hasUnlimitedUsage) return null

  return (
    <>
      {/* Promo Banner for Starter Users */}
      {showPromoBanner && userTier === 'starter' && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Upgrade to Scholar</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  65 AI questions and smarter progress
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.location.href = '/subscription'}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center gap-2"
              >
                Upgrade Now
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowPromoBanner(false)}
                className="text-blue-600 hover:text-blue-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Usage Display - Simplified */}
      <div 
        className={cn(
          'inline-flex items-center justify-center px-3 py-1.5 rounded-full border text-xs font-medium bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300',
          className
        )}
        style={style}
      >
        <span>
          {dailyUsage}/{limits.hasUnlimitedUsage ? '∞' : currentLimit}
        </span>
      </div>

      {/* Limit Alert Modal */}
      {showLimitAlert && isAtLimit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Daily Limit Reached</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You've used all {currentLimit} messages for today. I will appreciate it if you upgrade to continue learning! 🚀
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Crown className="w-4 h-4 text-orange-500" />
                <span>Scholar: 65 messages/day</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Star className="w-4 h-4 text-purple-500" />
                <span>Master: Unlimited messages</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Crown className="w-4 h-4 text-orange-600" />
                <span>Legend: Unlimited + Weak Spot Analysis</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLimitAlert(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Maybe Later
              </button>
              <button
                onClick={() => window.location.href = '/subscription'}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Upgrade Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
