/**
 * Production-Grade Gemini Model Management
 * 
 * Why models fail at API-key/project level:
 * 1. API keys are tied to Google Cloud projects with specific quotas/permissions
 * 2. Models require explicit enablement in Google Cloud Console (APIs & Services)
 * 3. Regional availability: Some models only work in specific regions
 * 4. API version compatibility: v1 vs v1beta have different model availability
 * 5. Billing/quota: Free tier may only access certain models
 * 6. Project-level restrictions: Enterprise policies can disable specific models
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

export type SubscriptionTier = 'free' | 'pro' | 'master'

export interface ModelConfig {
  name: string
  displayName: string
  tier: SubscriptionTier[]
  fallbackPriority: number // Lower = higher priority
  supportsChat: boolean
  supportsGenerateContent: boolean
  maxTokens?: number
  costPer1kTokens?: number // For quota tracking
}

export interface AvailableModel {
  name: string
  displayName: string
  supportedMethods: string[]
  inputTokenLimit?: number
  outputTokenLimit?: number
}

/**
 * Model configuration mapping subscription tiers to Gemini models
 * Master tier gets best models, free tier gets basic models
 */
export const MODEL_CONFIGS: ModelConfig[] = [
  {
    name: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    tier: ['master'],
    fallbackPriority: 1,
    supportsChat: true,
    supportsGenerateContent: true,
    maxTokens: 8192,
    costPer1kTokens: 0.00125,
  },
  {
    name: 'gemini-1.5-flash-8b',
    displayName: 'Gemini 1.5 Flash 8B',
    tier: ['pro', 'master'],
    fallbackPriority: 2,
    supportsChat: true,
    supportsGenerateContent: true,
    maxTokens: 8192,
    costPer1kTokens: 0.000075,
  },
  {
    name: 'gemini-pro',
    displayName: 'Gemini Pro',
    tier: ['free', 'pro', 'master'],
    fallbackPriority: 3,
    supportsChat: true,
    supportsGenerateContent: true,
    maxTokens: 30720,
    costPer1kTokens: 0.0005,
  },
  {
    name: 'text-bison-001',
    displayName: 'Text Bison',
    tier: ['free'],
    fallbackPriority: 4,
    supportsChat: false,
    supportsGenerateContent: true,
    maxTokens: 8192,
    costPer1kTokens: 0.0005,
  },
]

/**
 * Get models available for a subscription tier
 */
export const getModelsForTier = (tier: SubscriptionTier): ModelConfig[] => {
  return MODEL_CONFIGS
    .filter(config => config.tier.includes(tier))
    .sort((a, b) => a.fallbackPriority - b.fallbackPriority)
}

/**
 * Get the primary model for a tier (highest priority)
 */
export const getPrimaryModelForTier = (tier: SubscriptionTier): ModelConfig => {
  const models = getModelsForTier(tier)
  if (models.length === 0) {
    throw new Error(`No models configured for tier: ${tier}`)
  }
  return models[0]
}

/**
 * Programmatically list available models using REST API
 * This is more reliable than trying models one by one
 */
export async function listAvailableModels(apiKey: string): Promise<AvailableModel[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to list models: ${response.status} ${error}`)
    }

    const data = await response.json()
    
    return (data.models || []).map((model: any) => ({
      name: model.name.replace('models/', ''),
      displayName: model.displayName || model.name,
      supportedMethods: model.supportedGenerationMethods || [],
      inputTokenLimit: model.inputTokenLimit,
      outputTokenLimit: model.outputTokenLimit,
    }))
  } catch (error: any) {
    console.error('Error listing models:', error)
    throw new Error(`Failed to list available models: ${error.message}`)
  }
}

/**
 * Check if a specific model is available
 */
export async function isModelAvailable(
  apiKey: string,
  modelName: string
): Promise<boolean> {
  try {
    const models = await listAvailableModels(apiKey)
    return models.some(m => m.name === modelName || m.name === `models/${modelName}`)
  } catch (error) {
    console.error(`Error checking model ${modelName}:`, error)
    return false
  }
}

/**
 * Find the best available model for a tier
 * Tries models in priority order until one is available
 */
export async function findBestAvailableModel(
  apiKey: string,
  tier: SubscriptionTier
): Promise<ModelConfig | null> {
  const models = getModelsForTier(tier)
  const availableModels = await listAvailableModels(apiKey)
  const availableModelNames = new Set(
    availableModels.map(m => m.name.replace('models/', ''))
  )

  for (const model of models) {
    if (availableModelNames.has(model.name)) {
      return model
    }
  }

  return null
}

/**
 * Model manager with caching and fallback logic
 */
export class ModelManager {
  private apiKey: string
  private availableModelsCache: AvailableModel[] | null = null
  private cacheExpiry: number = 0
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required')
    }
    this.apiKey = apiKey
  }

  /**
   * Get available models (with caching)
   */
  async getAvailableModels(forceRefresh = false): Promise<AvailableModel[]> {
    const now = Date.now()
    
    if (!forceRefresh && this.availableModelsCache && now < this.cacheExpiry) {
      return this.availableModelsCache
    }

    try {
      this.availableModelsCache = await listAvailableModels(this.apiKey)
      this.cacheExpiry = now + this.CACHE_TTL
      return this.availableModelsCache
    } catch (error) {
      // If cache exists, return stale cache on error
      if (this.availableModelsCache) {
        console.warn('Using stale model cache due to error:', error)
        return this.availableModelsCache
      }
      throw error
    }
  }

  /**
   * Get model for subscription tier with automatic fallback
   */
  async getModelForTier(tier: SubscriptionTier): Promise<ModelConfig> {
    const availableModels = await this.getAvailableModels()
    const availableModelNames = new Set(
      availableModels.map(m => m.name.replace('models/', ''))
    )

    const tierModels = getModelsForTier(tier)

    // Try primary model first
    for (const model of tierModels) {
      if (availableModelNames.has(model.name)) {
        return model
      }
    }

    // Fallback: try any available model from lower tiers
    const allModels = MODEL_CONFIGS.sort((a, b) => a.fallbackPriority - b.fallbackPriority)
    for (const model of allModels) {
      if (availableModelNames.has(model.name)) {
        console.warn(
          `Tier ${tier} requested ${tierModels[0]?.name}, but using fallback: ${model.name}`
        )
        return model
      }
    }

    throw new Error(
      `No available models found. Available: ${Array.from(availableModelNames).join(', ')}`
    )
  }

  /**
   * Create a Gemini model instance for a subscription tier
   */
  async createModelForTier(tier: SubscriptionTier) {
    const modelConfig = await this.getModelForTier(tier)
    const genAI = new GoogleGenerativeAI(this.apiKey)
    return {
      model: genAI.getGenerativeModel({ model: modelConfig.name }),
      config: modelConfig,
    }
  }
}

