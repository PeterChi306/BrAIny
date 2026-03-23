/**
 * Token system for tracking AI usage
 * Tokens reset daily and only apply to AI chat interactions
 */

import { createSupabaseClient } from '@/lib/supabase/client'

export interface TokenUsage {
  used: number
  limit: number
  resetAt: Date
  hasUnlimited: boolean
}

/**
 * Get current token usage for the day
 */
export async function getTokenUsage(userId: string, tier: string): Promise<TokenUsage> {
  const supabase = createSupabaseClient()
  const today = new Date().toISOString().split('T')[0]
  
  // Get limits based on tier
  const limits: Record<string, number> = {
    starter: 15,
    scholar: 65,
    master: Infinity,
    legend: Infinity,
  }

  const limit = limits[tier] || 15
  const hasUnlimited = tier === 'master' || tier === 'legend'

  // Get today's usage
  const { data: usageData } = await supabase
    .from('daily_usage')
    .select('ai_messages_count, date')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle()

  const used = usageData?.ai_messages_count || 0

  // Calculate reset time (next midnight UTC)
  const resetAt = new Date()
  resetAt.setUTCHours(24, 0, 0, 0)

  return {
    used,
    limit,
    resetAt,
    hasUnlimited,
  }
}

/**
 * Check if user can use tokens
 */
export async function canUseTokens(userId: string, tier: string, amount: number = 1): Promise<boolean> {
  const usage = await getTokenUsage(userId, tier)
  
  if (usage.hasUnlimited) return true
  return usage.used + amount <= usage.limit
}

/**
 * Record token usage
 */
export async function recordTokenUsage(userId: string, amount: number = 1): Promise<void> {
  const supabase = createSupabaseClient()
  const today = new Date().toISOString().split('T')[0]

  // Get current usage
  const { data: currentUsage } = await supabase
    .from('daily_usage')
    .select('ai_messages_count')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle()

  const currentCount = currentUsage?.ai_messages_count || 0

  // Update or insert
  await supabase
    .from('daily_usage')
    .upsert(
      {
        user_id: userId,
        date: today,
        ai_messages_count: currentCount + amount,
      },
      { onConflict: 'user_id,date' }
    )
}

/**
 * Reset tokens (called by daily cron job in production)
 */
export async function resetDailyTokens(): Promise<void> {
  // This would be called by a cron job
  // Tokens automatically reset daily based on the date field
  // No action needed - the date field ensures daily separation
}

