/**
 * Daily Usage Tracker — server-side utility
 * Works with the daily_usage table (user_id, date UNIQUE, ai_messages_count, scans_count)
 * The UNIQUE(user_id, date) constraint ensures per-day records auto-reset.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { getSubscriptionLimits } from './subscription'
import { SubscriptionTier } from '@/types/database'

export interface DailyUsageRecord {
  ai_messages_count: number
  scans_count: number
  date: string
}

/**
 * Get today's usage record for a user.
 * Returns null if no record exists yet (meaning 0 usage today).
 */
export async function getTodayUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<DailyUsageRecord | null> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD in UTC

  const { data, error } = await supabase
    .from('daily_usage')
    .select('ai_messages_count, scans_count, date')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle()

  if (error) {
    console.error('[daily-usage] Error fetching today usage:', error)
    return null
  }

  return data
}

/**
 * Check if the user can send an AI message given their tier.
 * Returns { allowed, used, limit, remaining }
 */
export async function checkAiMessageAllowed(
  supabase: SupabaseClient,
  userId: string,
  tier: SubscriptionTier
): Promise<{ allowed: boolean; used: number; limit: number; remaining: number }> {
  const limits = getSubscriptionLimits(tier)

  // Unlimited tiers — always allowed
  if (limits.hasUnlimitedUsage || limits.dailyAiMessages === Infinity) {
    return { allowed: true, used: 0, limit: Infinity, remaining: Infinity }
  }

  const usage = await getTodayUsage(supabase, userId)
  const used = usage?.ai_messages_count ?? 0
  const limit = limits.dailyAiMessages
  const remaining = Math.max(0, limit - used)

  return {
    allowed: used < limit,
    used,
    limit,
    remaining,
  }
}

/**
 * Increment ai_messages_count for today by 1.
 * Uses upsert so the record is created if it doesn't exist yet.
 * The UNIQUE(user_id, date) constraint handles the daily-reset automatically —
 * a new day = a new row = count starts at 0 again.
 */
export async function incrementAiMessageCount(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // Try to increment existing row first
  const { data: existing } = await supabase
    .from('daily_usage')
    .select('id, ai_messages_count')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle()

  if (existing) {
    // Update existing row
    const { error } = await supabase
      .from('daily_usage')
      .update({ ai_messages_count: existing.ai_messages_count + 1 })
      .eq('user_id', userId)
      .eq('date', today)

    if (error) console.error('[daily-usage] Error incrementing AI count:', error)
  } else {
    // Insert new row for today
    const { error } = await supabase
      .from('daily_usage')
      .insert({ user_id: userId, date: today, ai_messages_count: 1, scans_count: 0 })

    if (error) console.error('[daily-usage] Error inserting daily usage row:', error)
  }
}

/**
 * Increment scans_count for today by 1.
 */
export async function incrementScanCount(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const today = new Date().toISOString().split('T')[0]

  const { data: existing } = await supabase
    .from('daily_usage')
    .select('id, scans_count')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('daily_usage')
      .update({ scans_count: existing.scans_count + 1 })
      .eq('user_id', userId)
      .eq('date', today)

    if (error) console.error('[daily-usage] Error incrementing scan count:', error)
  } else {
    const { error } = await supabase
      .from('daily_usage')
      .insert({ user_id: userId, date: today, ai_messages_count: 0, scans_count: 1 })

    if (error) console.error('[daily-usage] Error inserting daily usage row:', error)
  }
}
