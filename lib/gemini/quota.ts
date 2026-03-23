/**
 * Quota Protection and Rate Limiting
 * Prevents API key exhaustion and enforces subscription limits
 */

import type { SubscriptionTier } from './models'

export interface QuotaConfig {
  maxRequestsPerMinute: number
  maxRequestsPerHour: number
  maxTokensPerDay: number
  burstLimit: number // Allow short bursts above rate limit
}

export interface QuotaState {
  requestsThisMinute: number
  requestsThisHour: number
  tokensToday: number
  lastReset: {
    minute: number
    hour: number
    day: number
  }
}

/**
 * Quota limits per tier
 */
export const TIER_QUOTAS: Record<SubscriptionTier, QuotaConfig> = {
  free: {
    maxRequestsPerMinute: 2,
    maxRequestsPerHour: 60,
    maxTokensPerDay: 100000, // ~$0.05/day at gemini-pro rates
    burstLimit: 5,
  },
  pro: {
    maxRequestsPerMinute: 10,
    maxRequestsPerHour: 500,
    maxTokensPerDay: 2000000, // ~$1/day
    burstLimit: 20,
  },
  master: {
    maxRequestsPerMinute: 60,
    maxRequestsPerHour: 10000,
    maxTokensPerDay: 10000000, // ~$5/day
    burstLimit: 100,
  },
}

/**
 * In-memory quota tracker (use Redis in production)
 */
class QuotaTracker {
  private state: Map<string, QuotaState> = new Map()

  getState(key: string): QuotaState {
    const now = new Date()
    const state = this.state.get(key) || this.createInitialState(now)

    // Reset counters if needed
    if (now.getMinutes() !== state.lastReset.minute) {
      state.requestsThisMinute = 0
      state.lastReset.minute = now.getMinutes()
    }
    if (now.getHours() !== state.lastReset.hour) {
      state.requestsThisHour = 0
      state.lastReset.hour = now.getHours()
    }
    if (now.getDate() !== state.lastReset.day) {
      state.tokensToday = 0
      state.lastReset.day = now.getDate()
    }

    this.state.set(key, state)
    return state
  }

  private createInitialState(now: Date): QuotaState {
    return {
      requestsThisMinute: 0,
      requestsThisHour: 0,
      tokensToday: 0,
      lastReset: {
        minute: now.getMinutes(),
        hour: now.getHours(),
        day: now.getDate(),
      },
    }
  }

  incrementRequest(key: string): void {
    const state = this.getState(key)
    state.requestsThisMinute++
    state.requestsThisHour++
    this.state.set(key, state)
  }

  addTokens(key: string, tokens: number): void {
    const state = this.getState(key)
    state.tokensToday += tokens
    this.state.set(key, state)
  }
}

const quotaTracker = new QuotaTracker()

/**
 * Check if request is within quota limits
 */
export function checkQuota(
  apiKey: string,
  tier: SubscriptionTier,
  estimatedTokens: number = 0
): { allowed: boolean; reason?: string; retryAfter?: number } {
  const quota = TIER_QUOTAS[tier]
  const state = quotaTracker.getState(apiKey)

  // Check per-minute limit
  if (state.requestsThisMinute >= quota.maxRequestsPerMinute) {
    return {
      allowed: false,
      reason: 'Rate limit exceeded: too many requests per minute',
      retryAfter: 60 - (Date.now() % 60000), // Milliseconds until next minute
    }
  }

  // Check per-hour limit
  if (state.requestsThisHour >= quota.maxRequestsPerHour) {
    return {
      allowed: false,
      reason: 'Rate limit exceeded: too many requests per hour',
      retryAfter: 3600000 - (Date.now() % 3600000), // Milliseconds until next hour
    }
  }

  // Check daily token limit
  if (state.tokensToday + estimatedTokens > quota.maxTokensPerDay) {
    return {
      allowed: false,
      reason: 'Quota exceeded: daily token limit reached',
    }
  }

  return { allowed: true }
}

/**
 * Record API usage for quota tracking
 */
export function recordUsage(
  apiKey: string,
  tokensUsed: number
): void {
  quotaTracker.incrementRequest(apiKey)
  quotaTracker.addTokens(apiKey, tokensUsed)
}

/**
 * Estimate token count from text (rough approximation)
 */
export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for English
  return Math.ceil(text.length / 4)
}

