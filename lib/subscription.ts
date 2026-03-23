import { SubscriptionTier } from '@/types/database'

export interface SubscriptionLimits {
  dailyAiMessages: number
  dailyScans: number
  dailyQuizzes: number
  hasAdvancedFeatures: boolean
  hasUnlimitedUsage: boolean
  hasTextExtraction: boolean
  hasEditablePdf: boolean
}

export const getSubscriptionLimits = (tier: SubscriptionTier): SubscriptionLimits => {
  switch (tier) {
    case 'starter':
      return {
        dailyAiMessages: 15,
        dailyScans: 5,
        dailyQuizzes: 1,
        hasAdvancedFeatures: false,
        hasUnlimitedUsage: false,
        hasTextExtraction: false,
        hasEditablePdf: false,
      }
    case 'scholar':
      return {
        dailyAiMessages: 65,
        dailyScans: 20,
        dailyQuizzes: Infinity,
        hasAdvancedFeatures: true,
        hasUnlimitedUsage: false,
        hasTextExtraction: true,
        hasEditablePdf: false,
      }
    case 'master':
      return {
        dailyAiMessages: Infinity,
        dailyScans: Infinity,
        dailyQuizzes: Infinity,
        hasAdvancedFeatures: true,
        hasUnlimitedUsage: true,
        hasTextExtraction: true,
        hasEditablePdf: true,
      }
    case 'legend':
      return {
        dailyAiMessages: Infinity,
        dailyScans: Infinity,
        dailyQuizzes: Infinity,
        hasAdvancedFeatures: true,
        hasUnlimitedUsage: true,
        hasTextExtraction: true,
        hasEditablePdf: true,
      }
    default:
      return getSubscriptionLimits('starter')
  }
}

export const canUseFeature = (
  tier: SubscriptionTier,
  feature: 'ai' | 'scan' | 'advanced' | 'weak_spot_analysis' | 'quiz' | 'text_extraction' | 'editable_pdf'
): boolean => {
  const limits = getSubscriptionLimits(tier)
  
  switch (feature) {
    case 'ai':
      return limits.dailyAiMessages > 0
    case 'scan':
      return limits.dailyScans > 0
    case 'quiz':
      return limits.dailyQuizzes > 0
    case 'advanced':
      return limits.hasAdvancedFeatures
    case 'weak_spot_analysis':
      return tier === 'legend'
    case 'text_extraction':
      return limits.hasTextExtraction
    case 'editable_pdf':
      return limits.hasEditablePdf
    default:
      return false
  }
}

export const checkUsageLimit = (
  tier: SubscriptionTier,
  feature: 'ai' | 'scan' | 'quiz',
  currentUsage: number
): boolean => {
  const limits = getSubscriptionLimits(tier)
  
  if (limits.hasUnlimitedUsage) {
    return true
  }
  
  
  const limit = feature === 'ai' ? limits.dailyAiMessages : feature === 'quiz' ? limits.dailyQuizzes : limits.dailyScans
  return currentUsage < limit
}

