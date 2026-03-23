'use client'

import React, { useState } from 'react'
import { Lock, Star, ArrowRight, X } from 'lucide-react'
import { FeatureName, useFeatureGate } from '../lib/feature-gates'
import { SubscriptionTier } from '../types/database'

interface FeatureLockProps {
  feature: FeatureName
  userTier: SubscriptionTier
  children: React.ReactNode
  className?: string
  variant?: 'button' | 'card' | 'inline'
}

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  feature: FeatureName
  userTier: SubscriptionTier
  upgradeMessage: string
  upgradePath: SubscriptionTier[]
}

const tierColors: Record<SubscriptionTier, string> = {
  starter: 'from-gray-500 to-gray-600',
  scholar: 'from-blue-500 to-blue-600',
  master: 'from-purple-500 to-purple-600'
}

const tierPrices: Record<SubscriptionTier, string> = {
  starter: '$0',
  scholar: '$4.99/month',
  master: '$14.99/month'
}

export function UpgradeModal({ isOpen, onClose, feature, userTier, upgradeMessage, upgradePath }: UpgradeModalProps) {
  if (!isOpen) return null

  const handleUpgrade = (targetTier: SubscriptionTier) => {
    // This would navigate to pricing page or trigger upgrade flow
    window.location.href = `/pricing?upgrade=${targetTier}&feature=${feature}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${tierColors[userTier]} flex items-center justify-center mx-auto mb-4`}>
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Upgrade Required
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {upgradeMessage}
          </p>
        </div>

        <div className="space-y-3">
          {upgradePath.map((tier) => (
            <div
              key={tier}
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer"
              onClick={() => handleUpgrade(tier)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                    brAIny {tier}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {tier === 'scholar' && 'Unlimited scanning & study guides'}
                    {tier === 'master' && 'Advanced analytics & adaptive learning'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {tierPrices[tier]}
                  </p>
                  <ArrowRight className="w-4 h-4 text-gray-400 mt-1" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}

export function FeatureLock({ feature, userTier, children, className = '', variant = 'button' }: FeatureLockProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const { canAccess, getUpgradeMessage, availableFeatures, blockedFeatures } = useFeatureGate(userTier)

  const hasAccess = canAccess(feature)
  const upgradeMessage = getUpgradeMessage(feature)

  const handleClick = (e: React.MouseEvent) => {
    if (!hasAccess) {
      e.preventDefault()
      e.stopPropagation()
      setShowUpgradeModal(true)
    }
  }

  const renderLockedState = () => {
    switch (variant) {
      case 'button':
        return (
          <div className={`relative ${className}`}>
            <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-lg opacity-50 flex items-center justify-center z-10">
              <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            {children}
          </div>
        )

      case 'card':
        return (
          <div className={`relative ${className}`}>
            <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-xl opacity-60 flex items-center justify-center z-10">
              <div className="text-center">
                <Lock className="w-8 h-8 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Upgrade to unlock
                </p>
              </div>
            </div>
            {children}
          </div>
        )

      case 'inline':
        return (
          <div className={`flex items-center gap-2 ${className}`}>
            <Lock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {upgradeMessage}
            </span>
          </div>
        )

      default:
        return null
    }
  }

  if (hasAccess) {
    return <div onClick={handleClick} className={className}>{children}</div>
  }

  return (
    <>
      <div onClick={handleClick} className={className}>
        {renderLockedState()}
      </div>
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={feature}
        userTier={userTier}
        upgradeMessage={upgradeMessage}
        upgradePath={userTier === 'starter' ? ['scholar', 'master'] : ['master']}
      />
    </>
  )
}

/**
 * Feature-locked Button component
 */
export function LockedButton({
  feature,
  userTier,
  children,
  className = '',
  ...props
}: {
  feature: FeatureName
  userTier: SubscriptionTier
  children: React.ReactNode
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const { canAccess, getUpgradeMessage } = useFeatureGate(userTier)

  const hasAccess = canAccess(feature)
  const upgradeMessage = getUpgradeMessage(feature)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!hasAccess) {
      e.preventDefault()
      setShowUpgradeModal(true)
    } else if (props.onClick) {
      props.onClick(e)
    }
  }

  return (
    <>
      <button
        {...props}
        onClick={handleClick}
        className={`${className} ${!hasAccess ? 'relative' : ''}`}
        disabled={!hasAccess}
      >
        {!hasAccess && (
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-lg opacity-50 flex items-center justify-center z-10">
            <Lock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
        )}
        {children}
      </button>
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={feature}
        userTier={userTier}
        upgradeMessage={upgradeMessage}
        upgradePath={userTier === 'starter' ? ['scholar', 'master'] : ['master']}
      />
    </>
  )
}

/**
 * Feature Badge for UI elements
 */
export function FeatureBadge({ feature, userTier }: { feature: FeatureName; userTier: SubscriptionTier }) {
  const { canAccess } = useFeatureGate(userTier)
  const hasAccess = canAccess(feature)

  if (hasAccess) return null

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs text-gray-600 dark:text-gray-400">
      <Lock className="w-3 h-3" />
      <span>Plus</span>
    </div>
  )
}

/**
 * Premium Feature Indicator
 */
export function PremiumFeatureIndicator({ tier }: { tier: SubscriptionTier }) {
  if (tier === 'starter') return null

  return (
    <div className="inline-flex items-center gap-1">
      <Star className="w-4 h-4 text-yellow-500" />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
        {tier}
      </span>
    </div>
  )
}
