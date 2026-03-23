import { useState, useEffect, useCallback, useMemo } from 'react'

export interface TierLimits {
  // Learning Plans
  maxActiveGoals: number
  maxStudyPlans: number
  
  // Sessions
  maxDailySessions: number
  maxSessionLength: number // minutes
  
  // Timed Quizzes
  maxTimedQuizzesPerDay: number
  maxQuestionsPerQuiz: number
  realisticTimers: boolean
  adaptiveDifficulty: boolean
  
  // Speech Tutor
  speechEnabled: boolean
  maxSpeechMinutesPerDay: number
  
  // Spaced Repetition
  maxCardsPerGoal: number
  advancedSRS: boolean
  
  // Analytics
  detailedAnalytics: boolean
  progressReports: boolean
  exportData: boolean
  
  // File Upload
  maxFileSizeMB: number
  maxFilesPerUpload: number
  
  // AI Features
  maxAIMessagesPerDay: number
  contextWindow: number
  prioritySupport: boolean
  
  // General
  maxSubjects: number
  customThemes: boolean
  offlineMode: boolean
}

export const TIER_LIMITS: Record<string, TierLimits> = {
  starter: {
    // Learning Plans
    maxActiveGoals: 3,
    maxStudyPlans: 1,
    
    // Sessions
    maxDailySessions: 5,
    maxSessionLength: 30,
    
    // Timed Quizzes
    maxTimedQuizzesPerDay: 2,
    maxQuestionsPerQuiz: 5,
    realisticTimers: false, // 1.5x longer timers
    adaptiveDifficulty: false,
    
    // Speech Tutor
    speechEnabled: false,
    maxSpeechMinutesPerDay: 0,
    
    // Spaced Repetition
    maxCardsPerGoal: 50,
    advancedSRS: false,
    
    // Analytics
    detailedAnalytics: false,
    progressReports: false,
    exportData: false,
    
    // File Upload
    maxFileSizeMB: 5,
    maxFilesPerUpload: 3,
    
    // AI Features
    maxAIMessagesPerDay: 15,
    contextWindow: 4000,
    prioritySupport: false,
    
    // General
    maxSubjects: 3,
    customThemes: false,
    offlineMode: false
  },
  
  scholar: {
    // Learning Plans
    maxActiveGoals: 10,
    maxStudyPlans: 5,
    
    // Sessions
    maxDailySessions: 20,
    maxSessionLength: 60,
    
    // Timed Quizzes
    maxTimedQuizzesPerDay: 10,
    maxQuestionsPerQuiz: 15,
    realisticTimers: true,
    adaptiveDifficulty: true,
    
    // Speech Tutor
    speechEnabled: true,
    maxSpeechMinutesPerDay: 120,
    
    // Spaced Repetition
    maxCardsPerGoal: 200,
    advancedSRS: true,
    
    // Analytics
    detailedAnalytics: true,
    progressReports: true,
    exportData: false,
    
    // File Upload
    maxFileSizeMB: 10,
    maxFilesPerUpload: 5,
    
    // AI Features
    maxAIMessagesPerDay: 65,
    contextWindow: 16000,
    prioritySupport: false,
    
    // General
    maxSubjects: 10,
    customThemes: true,
    offlineMode: false
  },
  
  master: {
    // Learning Plans
    maxActiveGoals: 999, // Unlimited
    maxStudyPlans: 999, // Unlimited
    
    // Sessions
    maxDailySessions: 999, // Unlimited
    maxSessionLength: 120,
    
    // Timed Quizzes
    maxTimedQuizzesPerDay: 999, // Unlimited
    maxQuestionsPerQuiz: 25,
    realisticTimers: true,
    adaptiveDifficulty: true,
    
    // Speech Tutor
    speechEnabled: true,
    maxSpeechMinutesPerDay: 999, // Unlimited
    
    // Spaced Repetition
    maxCardsPerGoal: 999, // Unlimited
    advancedSRS: true,
    
    // Analytics
    detailedAnalytics: true,
    progressReports: true,
    exportData: true,
    
    // File Upload
    maxFileSizeMB: 25,
    maxFilesPerUpload: 10,
    
    // AI Features
    maxAIMessagesPerDay: 999, // Unlimited
    contextWindow: 32000,
    prioritySupport: true,
    
    // General
    maxSubjects: 999, // Unlimited
    customThemes: true,
    offlineMode: true
  },

  legend: {
    // Learning Plans
    maxActiveGoals: 999, // Unlimited
    maxStudyPlans: 999, // Unlimited
    
    // Sessions
    maxDailySessions: 999, // Unlimited
    maxSessionLength: 180, // Extended sessions
    
    // Timed Quizzes
    maxTimedQuizzesPerDay: 999, // Unlimited
    maxQuestionsPerQuiz: 50, // More questions per quiz
    realisticTimers: true,
    adaptiveDifficulty: true,
    
    // Speech Tutor
    speechEnabled: true,
    maxSpeechMinutesPerDay: 999, // Unlimited
    
    // Spaced Repetition
    maxCardsPerGoal: 999, // Unlimited
    advancedSRS: true,
    
    // Analytics
    detailedAnalytics: true,
    progressReports: true,
    exportData: true,
    
    // File Upload
    maxFileSizeMB: 50, // Larger files
    maxFilesPerUpload: 20, // More files
    
    // AI Features
    maxAIMessagesPerDay: 999, // Unlimited
    contextWindow: 64000, // Larger context
    prioritySupport: true,
    
    // General
    maxSubjects: 999, // Unlimited
    customThemes: true,
    offlineMode: true
  }
}

export interface TierFeatures {
  name: string
  description: string
  price: string
  priceId?: string
  highlighted: boolean
  features: string[]
  limitations: string[]
}

export const TIER_FEATURES: Record<string, TierFeatures> = {
  starter: {
    name: 'Free',
    description: 'Let users experience the AI but encourage upgrading.',
    price: '$0',
    highlighted: false,
    features: [
      'Core AI tutor',
      'Basic quizzes',
      'Limited scans',
      'Basic progress tracking'
    ],
    limitations: []
  },
  
  scholar: {
    name: 'Scholar',
    description: 'Perfect for daily homework help.',
    price: '$9.99',
    priceId: 'price_scholar_monthly',
    highlighted: false,
    features: [
      'Everything in Free',
      'Text extraction',
      'Study guide generator',
      'Improved quizzes',
      'More scans'
    ],
    limitations: []
  },
  
  master: {
    name: 'Master ⭐',
    description: 'Best tier for serious students.',
    price: '$14.99',
    priceId: 'price_master_monthly',
    highlighted: true,
    features: [
      'Everything in Scholar',
      'Smart Text Extraction',
      'Editable PDF Export',
      'Advanced study tools',
      'Faster AI responses',
    ],
    limitations: []
  },

  legend: {
    name: 'Legend',
    description: 'Premium tier for power learners.',
    price: '$23.99',
    priceId: 'price_legend_monthly',
    highlighted: false,
    features: [
      'Everything in Master',
      'Weak Spot Analysis',
      'Priority processing',
      'Professional PDF Export',
      'Future advanced AI tools'
    ],
    limitations: []
  }
}

export class TierManager {
  static getUserTier(tier: string = 'starter'): TierLimits {
    return TIER_LIMITS[tier] || TIER_LIMITS.starter
  }

  static canAccessFeature(
    tier: string,
    feature: keyof TierLimits,
    currentValue: number = 0
  ): { allowed: boolean; limit: number; remaining: number } {
    const limits = this.getUserTier(tier)
    const limit = limits[feature] as number
    
    return {
      allowed: currentValue < limit,
      limit,
      remaining: Math.max(0, limit - currentValue)
    }
  }

  static getTierUpgradePath(currentTier: string): string[] {
    const tiers = ['starter', 'scholar', 'master', 'legend']
    const currentIndex = tiers.indexOf(currentTier)
    return tiers.slice(currentIndex + 1)
  }

  static getRecommendedTier(
    goalsCount: number,
    studyTimeMinutes: number,
    needsSpeech: boolean,
    needsAdvancedAnalytics: boolean,
    needsWeakSpotAnalysis: boolean = false
  ): string {
    if (needsWeakSpotAnalysis || needsAdvancedAnalytics && studyTimeMinutes > 180) {
      return 'legend'
    }
    
    if (needsAdvancedAnalytics || studyTimeMinutes > 120 || needsSpeech) {
      return 'master'
    }
    
    if (goalsCount > 3 || studyTimeMinutes > 60 || needsSpeech) {
      return 'scholar'
    }
    
    return 'starter'
  }

  static formatLimit(limit: number): string {
    if (limit >= 999) return 'Unlimited'
    return limit.toString()
  }

  static getTierColor(tier: string): string {
    switch (tier) {
      case 'starter':
        return 'gray'
      case 'scholar':
        return 'blue'
      case 'master':
        return 'purple'
      case 'legend':
        return 'orange'
      default:
        return 'gray'
    }
  }

  static getTierGradient(tier: string): string {
    switch (tier) {
      case 'starter':
        return 'from-gray-500 to-gray-600'
      case 'scholar':
        return 'from-blue-500 to-blue-600'
      case 'master':
        return 'from-purple-500 to-purple-600'
      case 'legend':
        return 'from-orange-500 to-orange-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }
}

// Usage tracking and limits enforcement
export class UsageTracker {
  private static async getDailyUsage(userId: string, tier: string): Promise<any> {
    // This would fetch from database in a real implementation
    return {
      aiMessages: 0,
      sessions: 0,
      quizzes: 0,
      speechMinutes: 0,
      studyTime: 0
    }
  }

  static async checkLimit(
    userId: string,
    tier: string,
    feature: keyof TierLimits,
    increment: number = 1
  ): Promise<{ allowed: boolean; remaining: number; message?: string }> {
    const limits = TierManager.getUserTier(tier)
    const usage = await this.getDailyUsage(userId, tier)
    const currentUsage = usage[feature as string] || 0
    const limit = limits[feature] as number

    if (currentUsage + increment > limit) {
      const featureNames: Record<string, string> = {
        maxAIMessagesPerDay: 'AI messages',
        maxDailySessions: 'study sessions',
        maxTimedQuizzesPerDay: 'timed quizzes',
        maxSpeechMinutesPerDay: 'speech minutes',
        maxActiveGoals: 'active goals',
        maxCardsPerGoal: 'flashcards per goal',
        maxStudyPlans: 'study plans'
      }

      return {
        allowed: false,
        remaining: Math.max(0, limit - currentUsage),
        message: `Daily limit reached for ${featureNames[feature] || feature}. Upgrade to Plus or Master for more.`
      }
    }

    return {
      allowed: true,
      remaining: limit - currentUsage - increment
    }
  }

  static async trackUsage(
    userId: string,
    tier: string,
    feature: keyof TierLimits,
    amount: number = 1
  ): Promise<void> {
    // This would update the database in a real implementation
    console.log(`Tracking usage: ${userId} ${tier} ${feature} +${amount}`)
  }
}

// React hook for tier management
export function useTierManagement(userTier: string = 'starter') {
  const [limits, setLimits] = useState(TierManager.getUserTier(userTier))
  const [usage, setUsage] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsage()
  }, [userTier])

  const fetchUsage = async () => {
    try {
      // This would fetch actual usage from API
      setUsage({})
    } catch (error) {
      console.error('Error fetching usage:', error)
    } finally {
      setLoading(false)
    }
  }

  const canAccess = useCallback((feature: keyof TierLimits, currentValue: number = 0) => {
    return TierManager.canAccessFeature(userTier, feature, currentValue)
  }, [userTier])

  const upgradePath = useMemo(() => {
    return TierManager.getTierUpgradePath(userTier)
  }, [userTier])

  const isAtLimit = useCallback((feature: keyof TierLimits) => {
    const limit = limits[feature] as number
    const current = usage[feature] || 0
    return current >= limit
  }, [limits, usage])

  const getUsagePercentage = useCallback((feature: keyof TierLimits) => {
    const limit = limits[feature] as number
    const current = usage[feature] || 0
    return limit >= 999 ? 0 : (current / limit) * 100
  }, [limits, usage])

  return {
    limits,
    usage,
    loading,
    canAccess,
    upgradePath,
    isAtLimit,
    getUsagePercentage,
    tierColor: TierManager.getTierColor(userTier),
    tierGradient: TierManager.getTierGradient(userTier)
  }
}
