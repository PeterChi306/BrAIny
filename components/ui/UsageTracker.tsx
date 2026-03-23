'use client'

import { useUserTier } from '@/contexts/UserTierContext'
import { getSubscriptionLimits } from '@/lib/subscription'
import { cn } from '@/lib/utils'

interface UsageTrackerProps {
  className?: string
}

export function UsageTracker({ className }: UsageTrackerProps) {
  const { userTier } = useUserTier()
  const limits = getSubscriptionLimits(userTier)

  // This component is deprecated - use UsageLimits instead
  return null
}
