/**
 * Gemini API Configuration
 * Supports multiple API keys for different tiers or single key with model selection
 */

export interface GeminiConfig {
  // Option 1: Single API key (models selected by tier)
  primaryApiKey?: string
  
  // Option 2: Multiple API keys per tier (for quota isolation)
  tierApiKeys?: {
    free?: string
    pro?: string
    master?: string
  }
  
  // Fallback API key if tier-specific key fails
  fallbackApiKey?: string
  
  // Model selection strategy
  strategy: 'single-key' | 'multi-key'
}

/**
 * Get API key for a subscription tier
 * Supports both single-key and multi-key strategies
 */
export function getApiKeyForTier(
  config: GeminiConfig,
  tier: 'free' | 'pro' | 'master'
): string {
  if (config.strategy === 'multi-key' && config.tierApiKeys) {
    const tierKey = config.tierApiKeys[tier]
    if (tierKey) {
      return tierKey
    }
    // Fallback to primary or fallback key
    return config.fallbackApiKey || config.primaryApiKey || ''
  }
  
  // Single key strategy
  return config.primaryApiKey || config.fallbackApiKey || ''
}

/**
 * Load configuration from environment variables
 * 
 * Environment variables:
 * - GEMINI_API_KEY: Primary API key (single-key strategy)
 * - GEMINI_API_KEY_FREE: API key for free tier (multi-key strategy)
 * - GEMINI_API_KEY_PRO: API key for pro tier (multi-key strategy)
 * - GEMINI_API_KEY_MASTER: API key for master tier (multi-key strategy)
 * - GEMINI_STRATEGY: 'single-key' or 'multi-key' (default: 'single-key')
 */
export function loadGeminiConfig(): GeminiConfig {
  const strategy = (process.env.GEMINI_STRATEGY || 'single-key') as 'single-key' | 'multi-key'
  
  if (strategy === 'multi-key') {
    return {
      strategy: 'multi-key',
      tierApiKeys: {
        free: process.env.GEMINI_API_KEY_FREE,
        pro: process.env.GEMINI_API_KEY_PRO,
        master: process.env.GEMINI_API_KEY_MASTER,
      },
      fallbackApiKey: process.env.GEMINI_API_KEY, // Fallback to primary
      primaryApiKey: process.env.GEMINI_API_KEY,
    }
  }
  
  // Single key strategy (default)
  return {
    strategy: 'single-key',
    primaryApiKey: process.env.GEMINI_API_KEY,
    fallbackApiKey: process.env.GEMINI_API_KEY_FALLBACK,
  }
}

/**
 * Validate configuration
 */
export function validateGeminiConfig(config: GeminiConfig): void {
  if (config.strategy === 'single-key') {
    if (!config.primaryApiKey) {
      throw new Error('GEMINI_API_KEY is required for single-key strategy')
    }
  } else {
    const hasAnyTierKey = Object.values(config.tierApiKeys || {}).some(key => !!key)
    if (!hasAnyTierKey && !config.fallbackApiKey) {
      throw new Error(
        'At least one tier API key or fallback key is required for multi-key strategy'
      )
    }
  }
}

