import { SubscriptionTier } from '../types/database'

export type FeatureName = 
  // Core AI Tutor (All tiers)
  | 'ai_chat'
  | 'basic_quiz' 
  | 'limited_scan'
  
  // Scholar Tier Tools
  | 'unlimited_scan'
  | 'study_guide'
  | 'text_extraction'
  | 'improved_quiz'
  
  // Master Tier Tools
  | 'adaptive_quiz'
  | 'study_plan'
  | 'analytics'
  
  // Legend Tier Tools
  | 'weak_spot_analysis'

export interface FeatureDefinition {
  name: FeatureName
  displayName: string
  description: string
  requiredTier: SubscriptionTier
  category: 'core' | 'scholar' | 'master' | 'legend'
}

export const FEATURE_DEFINITIONS: Record<FeatureName, FeatureDefinition> = {
  // Core AI Tutor (All tiers)
  ai_chat: {
    name: 'ai_chat',
    displayName: 'AI Tutor Chat',
    description: 'Chat with AI tutor for explanations and help',
    requiredTier: 'starter',
    category: 'core'
  },
  basic_quiz: {
    name: 'basic_quiz',
    displayName: 'Basic Quizzes',
    description: 'Generate basic quizzes on any topic',
    requiredTier: 'starter',
    category: 'core'
  },
  limited_scan: {
    name: 'limited_scan',
    displayName: 'Document Scanning (Limited)',
    description: 'Scan up to 3 documents per day',
    requiredTier: 'starter',
    category: 'core'
  },

  // Scholar Tier Tools
  unlimited_scan: {
    name: 'unlimited_scan',
    displayName: 'Unlimited Document Scanning',
    description: 'Scan unlimited documents and homework',
    requiredTier: 'scholar',
    category: 'scholar'
  },
  study_guide: {
    name: 'study_guide',
    displayName: 'Study Guide Generation',
    description: 'Generate comprehensive study guides from any text',
    requiredTier: 'scholar',
    category: 'scholar'
  },
  text_extraction: {
    name: 'text_extraction',
    displayName: 'Text Extraction from Images',
    description: 'Extract and analyze text from scanned images',
    requiredTier: 'scholar',
    category: 'scholar'
  },
  improved_quiz: {
    name: 'improved_quiz',
    displayName: 'Enhanced Practice Quizzes',
    description: 'Generate targeted practice quizzes with explanations',
    requiredTier: 'scholar',
    category: 'scholar'
  },

  // Master Tier Tools
  adaptive_quiz: {
    name: 'adaptive_quiz',
    displayName: 'Adaptive Quizzes',
    description: 'Quizzes that adapt to your knowledge level',
    requiredTier: 'master',
    category: 'master'
  },
  study_plan: {
    name: 'study_plan',
    displayName: 'Personalized Study Plans',
    description: 'Generate study plans based on your goals and deadline',
    requiredTier: 'master',
    category: 'master'
  },
  analytics: {
    name: 'analytics',
    displayName: 'Learning Analytics',
    description: 'Detailed analytics and insights on your learning progress',
    requiredTier: 'master',
    category: 'master'
  },

  // Legend Tier Tools
  weak_spot_analysis: {
    name: 'weak_spot_analysis',
    displayName: 'Weak Spot Analysis',
    description: 'AI analysis of your learning weaknesses and patterns with personalized recommendations',
    requiredTier: 'legend',
    category: 'legend'
  }
}

export class FeatureGate {
  /**
   * Check if a user can access a specific feature
   */
  static canAccess(userTier: SubscriptionTier, feature: FeatureName): boolean {
    const featureDef = FEATURE_DEFINITIONS[feature]
    if (!featureDef) return false
    
    return this.getTierRank(userTier) >= this.getTierRank(featureDef.requiredTier)
  }

  /**
   * Get all features available to a user tier
   */
  static getAvailableFeatures(userTier: SubscriptionTier): FeatureName[] {
    return Object.values(FEATURE_DEFINITIONS)
      .filter(feature => this.canAccess(userTier, feature.name))
      .map(feature => feature.name)
  }

  /**
   * Get features blocked for a user tier
   */
  static getBlockedFeatures(userTier: SubscriptionTier): FeatureName[] {
    return Object.values(FEATURE_DEFINITIONS)
      .filter(feature => !this.canAccess(userTier, feature.name))
      .map(feature => feature.name)
  }

  /**
   * Get upgrade message for a feature
   */
  static getUpgradeMessage(feature: FeatureName, currentTier: SubscriptionTier): string {
    const featureDef = FEATURE_DEFINITIONS[feature]
    if (!featureDef) return 'Feature not found'

    if (this.canAccess(currentTier, feature)) {
      return 'You already have access to this feature'
    }

    const requiredTier = featureDef.requiredTier
    switch (requiredTier) {
      case 'scholar':
        return `${featureDef.displayName} is available with brAIny Scholar. Upgrade to unlock advanced study tools!`
      case 'master':
        return `${featureDef.displayName} is a Master tier feature. Upgrade to brAIny Master for personalized learning analytics!`
      case 'legend':
        return `${featureDef.displayName} is exclusive to brAIny Legend. Upgrade for the ultimate personalized learning experience!`
      default:
        return 'This feature is not available'
    }
  }

  /**
   * Get the tier needed for a feature
   */
  static getRequiredTier(feature: FeatureName): SubscriptionTier | null {
    return FEATURE_DEFINITIONS[feature]?.requiredTier || null
  }

  /**
   * Get features by category
   */
  static getFeaturesByCategory(category: 'core' | 'scholar' | 'master' | 'legend'): FeatureName[] {
    return Object.values(FEATURE_DEFINITIONS)
      .filter(feature => feature.category === category)
      .map(feature => feature.name)
  }

  /**
   * Helper: Get numeric rank for tier comparison
   */
  private static getTierRank(tier: SubscriptionTier): number {
    const tierRanks: Record<SubscriptionTier, number> = {
      starter: 0,
      scholar: 1,
      master: 2,
      legend: 3
    }
    return tierRanks[tier]
  }

  /**
   * Get upgrade path from current tier to required tier
   */
  static getUpgradePath(currentTier: SubscriptionTier, requiredTier: SubscriptionTier): SubscriptionTier[] {
    const tiers: SubscriptionTier[] = ['starter', 'scholar', 'master', 'legend']
    const currentIndex = tiers.indexOf(currentTier)
    const requiredIndex = tiers.indexOf(requiredTier)
    
    if (currentIndex >= requiredIndex) return []
    
    return tiers.slice(currentIndex + 1, requiredIndex + 1)
  }
}

/**
 * React hook for feature gating
 */
export function useFeatureGate(userTier: SubscriptionTier) {
  const canAccess = (feature: FeatureName): boolean => {
    return FeatureGate.canAccess(userTier, feature)
  }

  const getUpgradeMessage = (feature: FeatureName): string => {
    return FeatureGate.getUpgradeMessage(feature, userTier)
  }

  const availableFeatures = FeatureGate.getAvailableFeatures(userTier)
  const blockedFeatures = FeatureGate.getBlockedFeatures(userTier)

  return {
    canAccess,
    getUpgradeMessage,
    availableFeatures,
    blockedFeatures
  }
}
