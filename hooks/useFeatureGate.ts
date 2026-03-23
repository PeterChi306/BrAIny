'use client'

import React, { useState } from 'react'
import { useUserTier } from '@/contexts/UserTierContext'
import { UpgradeModal } from '@/components/ui/UpgradeModal'

interface FeatureGateOptions {
  feature: string
  requiredTier: 'pro' | 'master'
  onUpgrade?: () => void
}

export function useFeatureGate() {
  const { userTier, isLoading } = useUserTier()
  const [upgradeModal, setUpgradeModal] = useState<{
    isOpen: boolean
    feature: string
    targetTier: 'pro' | 'master'
  }>({ isOpen: false, feature: '', targetTier: 'pro' })

  const canUseFeature = (requiredTier: 'pro' | 'master'): boolean => {
    if (isLoading) return false
    
    const tierHierarchy = { free: 0, pro: 1, master: 2 }
    const userLevel = tierHierarchy[userTier]
    const requiredLevel = tierHierarchy[requiredTier]
    
    return userLevel >= requiredLevel
  }

  const requireFeature = ({ feature, requiredTier, onUpgrade }: FeatureGateOptions) => {
    return (callback?: () => void) => {
      if (!canUseFeature(requiredTier)) {
        setUpgradeModal({
          isOpen: true,
          feature,
          targetTier: requiredTier
        })
        return
      }
      
      if (callback) callback()
      if (onUpgrade) onUpgrade()
    }
  }

  const FeatureGateComponent = () => {
    return React.createElement(UpgradeModal, {
      isOpen: upgradeModal.isOpen,
      onClose: () => setUpgradeModal(prev => ({ ...prev, isOpen: false })),
      feature: upgradeModal.feature,
      currentTier: userTier,
      targetTier: upgradeModal.targetTier
    })
  }

  return {
    canUseFeature,
    requireFeature,
    FeatureGateComponent,
    isLoading
  }
}
