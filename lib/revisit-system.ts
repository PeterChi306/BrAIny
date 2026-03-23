import { createSupabaseClient } from './supabase/client'
import { useState, useEffect } from 'react'

export interface RevisitItem {
  id?: string
  user_id: string
  topic: string
  reason: string
  time_estimate: number
  urgency: 'high' | 'medium' | 'low'
  mistake_count: number
  hesitation_count: number
  last_seen?: string
  created_at?: string
  updated_at?: string
}

export interface RevisitTrigger {
  type: 'mistake' | 'hesitation' | 're-explain' | 'unresolved'
  topic: string
  details: string
  confidence?: number
  timeSpent?: number
}

class RevisitSystem {
  private supabase = createSupabaseClient()

  // Create or update a revisit item based on triggers
  async processRevisitTrigger(userId: string, trigger: RevisitTrigger) {
    try {
      // Check if revisit item already exists
      const { data: existing } = await this.supabase
        .from('revisit_items')
        .select('*')
        .eq('user_id', userId)
        .eq('topic', trigger.topic)
        .single()

      const timeEstimate = this.calculateTimeEstimate(trigger)
      const urgency = this.calculateUrgency(trigger, existing)

      if (existing) {
        // Update existing item
        const updateData: Partial<RevisitItem> = {
          urgency,
          updated_at: new Date().toISOString()
        }

        if (trigger.type === 'mistake') {
          updateData.mistake_count = existing.mistake_count + 1
          updateData.reason = `Mistake detected: ${trigger.details}`
        } else if (trigger.type === 'hesitation') {
          updateData.hesitation_count = existing.hesitation_count + 1
          updateData.reason = `Hesitation detected: ${trigger.details}`
        } else if (trigger.type === 're-explain') {
          updateData.reason = `Multiple "explain simpler" requests: ${trigger.details}`
        }

        const { data, error } = await this.supabase
          .from('revisit_items')
          .update(updateData)
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Create new item
        const newItem: Omit<RevisitItem, 'id' | 'created_at' | 'updated_at'> = {
          user_id: userId,
          topic: trigger.topic,
          reason: this.generateReason(trigger),
          time_estimate: timeEstimate,
          urgency,
          mistake_count: trigger.type === 'mistake' ? 1 : 0,
          hesitation_count: trigger.type === 'hesitation' ? 1 : 0
        }

        const { data, error } = await this.supabase
          .from('revisit_items')
          .insert(newItem)
          .select()
          .single()

        if (error) throw error
        return data
      }
    } catch (error) {
      console.error('Error processing revisit trigger:', error)
      return null
    }
  }

  // Get all active revisit items for a user
  async getRevisitItems(userId: string, limit: number = 10) {
    try {
      const { data, error } = await this.supabase
        .from('revisit_items')
        .select('*')
        .eq('user_id', userId)
        .order('urgency', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting revisit items:', error)
      return []
    }
  }

  // Mark a revisit item as addressed
  async markAsAddressed(itemId: string) {
    try {
      const { data, error } = await this.supabase
        .from('revisit_items')
        .update({
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error marking revisit item as addressed:', error)
      return null
    }
  }

  // Delete a revisit item (when mastered)
  async deleteRevisitItem(itemId: string) {
    try {
      const { error } = await this.supabase
        .from('revisit_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting revisit item:', error)
      return false
    }
  }

  // Get revisit statistics
  async getRevisitStats(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('revisit_items')
        .select('urgency, mistake_count, hesitation_count')
        .eq('user_id', userId)

      if (error) throw error

      if (!data || data.length === 0) {
        return {
          total: 0,
          high: 0,
          medium: 0,
          low: 0,
          totalMistakes: 0,
          totalHesitations: 0
        }
      }

      const stats = data.reduce((acc: any, item) => {
        acc.total += 1
        acc[item.urgency] += 1
        acc.totalMistakes += item.mistake_count
        acc.totalHesitations += item.hesitation_count
        return acc
      }, { total: 0, high: 0, medium: 0, low: 0, totalMistakes: 0, totalHesitations: 0 })

      return stats
    } catch (error) {
      console.error('Error getting revisit stats:', error)
      return {
        total: 0,
        high: 0,
        medium: 0,
        low: 0,
        totalMistakes: 0,
        totalHesitations: 0
      }
    }
  }

  // Calculate time estimate based on trigger
  private calculateTimeEstimate(trigger: RevisitTrigger): number {
    switch (trigger.type) {
      case 'mistake':
        // Base time on confidence and time spent
        const baseTime = trigger.timeSpent ? Math.ceil(trigger.timeSpent / 60) : 5
        const confidencePenalty = trigger.confidence && trigger.confidence >= 7 ? 3 : 1
        return Math.min(baseTime + confidencePenalty, 10)
      
      case 'hesitation':
        return 4 // Hesitation usually needs quick review
      
      case 're-explain':
        return 6 // Multiple explanations need more time
      
      case 'unresolved':
        return 8 // Unresolved issues need significant time
      
      default:
        return 5
    }
  }

  // Calculate urgency based on trigger and existing data
  private calculateUrgency(trigger: RevisitTrigger, existing?: RevisitItem): 'high' | 'medium' | 'low' {
    // High urgency triggers
    if (trigger.type === 'mistake' && trigger.confidence && trigger.confidence >= 7) {
      return 'high' // High confidence but wrong = urgent
    }

    if (existing) {
      const totalIssues = existing.mistake_count + existing.hesitation_count
      
      if (totalIssues >= 3) return 'high'
      if (totalIssues >= 2) return 'medium'
    }

    // Medium urgency triggers
    if (trigger.type === 're-explain' || trigger.type === 'unresolved') {
      return 'medium'
    }

    return 'low'
  }

  // Generate human-readable reason
  private generateReason(trigger: RevisitTrigger): string {
    switch (trigger.type) {
      case 'mistake':
        return `Incorrect answer: ${trigger.details}`
      
      case 'hesitation':
        return `Hesitation detected: ${trigger.details}`
      
      case 're-explain':
        return `Requested simpler explanation: ${trigger.details}`
      
      case 'unresolved':
        return `Unresolved confusion: ${trigger.details}`
      
      default:
        return trigger.details
    }
  }

  // Smart revisit scheduling - when to show items
  async getRevisitSchedule(userId: string) {
    try {
      const items = await this.getRevisitItems(userId)
      
      return items.map(item => {
        const now = new Date()
        const lastSeen = item.last_seen ? new Date(item.last_seen) : null
        const updated = new Date(item.updated_at || item.created_at || now)
        
        // Calculate when to show this item again
        let nextReview: Date
        let hoursSinceLastSeen = 0
        
        if (!lastSeen) {
          // Never shown - show now
          nextReview = now
        } else {
          // Spaced repetition based on urgency and performance
          hoursSinceLastSeen = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60)
          
          switch (item.urgency) {
            case 'high':
              nextReview = new Date(lastSeen.getTime() + 2 * 60 * 60 * 1000) // 2 hours
              break
            case 'medium':
              nextReview = new Date(lastSeen.getTime() + 6 * 60 * 60 * 1000) // 6 hours
              break
            case 'low':
              nextReview = new Date(lastSeen.getTime() + 24 * 60 * 60 * 1000) // 24 hours
              break
            default:
              nextReview = new Date(lastSeen.getTime() + 12 * 60 * 60 * 1000) // 12 hours
          }
        }

        return {
          ...item,
          nextReview,
          isDue: nextReview <= now,
          priority: this.calculatePriority(item, hoursSinceLastSeen || 0)
        }
      }).sort((a, b) => b.priority - a.priority)
    } catch (error) {
      console.error('Error getting revisit schedule:', error)
      return []
    }
  }

  // Calculate priority for sorting
  private calculatePriority(item: RevisitItem, hoursSinceLastSeen: number): number {
    let priority = 0

    // Urgency weighting
    switch (item.urgency) {
      case 'high': priority += 100; break
      case 'medium': priority += 50; break
      case 'low': priority += 10; break
    }

    // Issue count weighting
    priority += item.mistake_count * 20
    priority += item.hesitation_count * 10

    // Time since last seen weighting
    priority += Math.min(hoursSinceLastSeen, 48) // Cap at 48 hours

    return priority
  }
}

export const revisitSystem = new RevisitSystem()

// Convenience functions for common triggers
export const trackMistake = async (
  userId: string,
  topic: string,
  question: string,
  userAnswer: string,
  correctAnswer: string,
  confidence: number,
  timeSpent: number
) => {
  return await revisitSystem.processRevisitTrigger(userId, {
    type: 'mistake',
    topic,
    details: `Question: ${question.substring(0, 100)}... Your answer: ${userAnswer}, Correct: ${correctAnswer}`,
    confidence,
    timeSpent
  })
}

export const trackHesitation = async (
  userId: string,
  topic: string,
  details: string,
  timeSpent: number
) => {
  return await revisitSystem.processRevisitTrigger(userId, {
    type: 'hesitation',
    topic,
    details,
    timeSpent
  })
}

export const trackReexplain = async (
  userId: string,
  topic: string,
  originalExplanation: string,
  requestCount: number
) => {
  return await revisitSystem.processRevisitTrigger(userId, {
    type: 're-explain',
    topic,
    details: `Requested simpler explanation ${requestCount} times. Original: ${originalExplanation.substring(0, 100)}...`
  })
}

export const trackUnresolved = async (
  userId: string,
  topic: string,
  unresolvedIssue: string
) => {
  return await revisitSystem.processRevisitTrigger(userId, {
    type: 'unresolved',
    topic,
    details: unresolvedIssue
  })
}

// React hook for revisit system
export const useRevisitSystem = (userId: string) => {
  const [revisitItems, setRevisitItems] = useState<RevisitItem[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [items, revisitStats] = await Promise.all([
          revisitSystem.getRevisitItems(userId),
          revisitSystem.getRevisitStats(userId)
        ])

        setRevisitItems(items)
        setStats(revisitStats)
      } catch (error) {
        console.error('Error loading revisit data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      loadData()
    }
  }, [userId])

  return {
    revisitItems,
    stats,
    loading,
    processTrigger: revisitSystem.processRevisitTrigger.bind(revisitSystem),
    markAsAddressed: revisitSystem.markAsAddressed.bind(revisitSystem),
    deleteItem: revisitSystem.deleteRevisitItem.bind(revisitSystem),
    trackMistake,
    trackHesitation,
    trackReexplain,
    trackUnresolved
  }
}
