import { createSupabaseClient } from './supabase/client'
import { useState, useEffect } from 'react'

export interface GhostYouEntry {
  id?: string
  user_id: string
  topic: string
  question: string
  user_answer: string
  user_reasoning: string
  correct_answer: string
  explanation: string
  strategy_used: string
  confidence_level: number
  time_spent: number
  created_at?: string
}

export interface GhostYouInsight {
  id?: string
  user_id: string
  topic: string
  insight_type: 'breakthrough' | 'mistake' | 'insight' | 'struggle'
  past_thinking: string
  current_understanding: string
  description: string
  created_at?: string
}

class GhostYouMode {
  private supabase = createSupabaseClient()

  // Store reasoning during learning sessions
  async storeReasoning(entry: Omit<GhostYouEntry, 'id' | 'created_at'>) {
    try {
      const { data, error } = await this.supabase
        .from('ghost_you_entries')
        .insert({
          ...entry,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error storing reasoning:', error)
      return null
    }
  }

  // Get past reasoning for a specific topic
  async getPastReasoning(userId: string, topic: string) {
    try {
      const { data, error } = await this.supabase
        .from('ghost_you_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('topic', topic)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting past reasoning:', error)
      return []
    }
  }

  // Store insights and growth moments
  async storeInsight(insight: Omit<GhostYouInsight, 'id' | 'created_at'>) {
    try {
      const { data, error } = await this.supabase
        .from('ghost_you_insights')
        .insert({
          ...insight,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error storing insight:', error)
      return null
    }
  }

  // Get growth timeline
  async getGrowthTimeline(userId: string, limit: number = 20) {
    try {
      const { data, error } = await this.supabase
        .from('ghost_you_insights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting growth timeline:', error)
      return []
    }
  }

  // Analyze patterns in user's thinking
  async analyzeThinkingPatterns(userId: string) {
    try {
      const { data: entries, error } = await this.supabase
        .from('ghost_you_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      if (!entries || entries.length === 0) {
        return {
          strategies: [],
          commonMistakes: [],
          strengths: [],
          improvementAreas: []
        }
      }

      // Analyze patterns
      const strategies = this.extractStrategies(entries)
      const commonMistakes = this.extractCommonMistakes(entries)
      const strengths = this.extractStrengths(entries)
      const improvementAreas = this.extractImprovementAreas(entries)

      return {
        strategies,
        commonMistakes,
        strengths,
        improvementAreas
      }
    } catch (error) {
      console.error('Error analyzing thinking patterns:', error)
      return {
        strategies: [],
        commonMistakes: [],
        strengths: [],
        improvementAreas: []
      }
    }
  }

  // Extract learning strategies from entries
  private extractStrategies(entries: GhostYouEntry[]) {
    const strategyCounts: Record<string, number> = {}
    
    entries.forEach(entry => {
      if (entry.strategy_used) {
        strategyCounts[entry.strategy_used] = (strategyCounts[entry.strategy_used] || 0) + 1
      }
    })

    return Object.entries(strategyCounts)
      .map(([strategy, count]) => ({ strategy, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  // Extract common mistakes
  private extractCommonMistakes(entries: GhostYouEntry[]) {
    const mistakes: Record<string, number> = {}
    
    entries.forEach(entry => {
      if (entry.user_answer !== entry.correct_answer) {
        const mistakeKey = `${entry.topic}: ${entry.user_answer}`
        mistakes[mistakeKey] = (mistakes[mistakeKey] || 0) + 1
      }
    })

    return Object.entries(mistakes)
      .map(([mistake, count]) => ({ mistake, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  // Extract strengths
  private extractStrengths(entries: GhostYouEntry[]) {
    const correctAnswers = entries.filter(entry => entry.user_answer === entry.correct_answer)
    const topicStrengths: Record<string, number> = {}
    
    correctAnswers.forEach(entry => {
      topicStrengths[entry.topic] = (topicStrengths[entry.topic] || 0) + 1
    })

    return Object.entries(topicStrengths)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  // Extract areas for improvement
  private extractImprovementAreas(entries: GhostYouEntry[]) {
    const incorrectAnswers = entries.filter(entry => entry.user_answer !== entry.correct_answer)
    const topicWeaknesses: Record<string, number> = {}
    
    incorrectAnswers.forEach(entry => {
      topicWeaknesses[entry.topic] = (topicWeaknesses[entry.topic] || 0) + 1
    })

    return Object.entries(topicWeaknesses)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  // Get comparison between past and current thinking
  async getThinkingComparison(userId: string, topic: string) {
    try {
      const entries = await this.getPastReasoning(userId, topic)
      
      if (entries.length < 2) {
        return null
      }

      const mostRecent = entries[0]
      const previous = entries[1]

      return {
        current: {
          reasoning: mostRecent.user_reasoning,
          answer: mostRecent.user_answer,
          confidence: mostRecent.confidence_level,
          strategy: mostRecent.strategy_used
        },
        past: {
          reasoning: previous.user_reasoning,
          answer: previous.user_answer,
          confidence: previous.confidence_level,
          strategy: previous.strategy_used
        },
        improvement: this.calculateImprovement(previous, mostRecent)
      }
    } catch (error) {
      console.error('Error getting thinking comparison:', error)
      return null
    }
  }

  // Calculate improvement between two entries
  private calculateImprovement(past: GhostYouEntry, current: GhostYouEntry) {
    const confidenceImprovement = current.confidence_level - past.confidence_level
    const correctnessImprovement = 
      (current.user_answer === current.correct_answer ? 1 : 0) - 
      (past.user_answer === past.correct_answer ? 1 : 0)
    
    return {
      confidence: confidenceImprovement,
      correctness: correctnessImprovement,
      overall: confidenceImprovement > 0 || correctnessImprovement > 0
    }
  }
}

export const ghostYouMode = new GhostYouMode()

// Utility functions for tracking during learning sessions
export const trackUserReasoning = async (
  userId: string,
  topic: string,
  question: string,
  userAnswer: string,
  userReasoning: string,
  correctAnswer: string,
  explanation: string,
  strategyUsed: string,
  confidenceLevel: number,
  timeSpent: number
) => {
  return await ghostYouMode.storeReasoning({
    user_id: userId,
    topic,
    question,
    user_answer: userAnswer,
    user_reasoning: userReasoning,
    correct_answer: correctAnswer,
    explanation,
    strategy_used: strategyUsed,
    confidence_level: confidenceLevel,
    time_spent: timeSpent
  })
}

export const trackInsight = async (
  userId: string,
  topic: string,
  insightType: 'breakthrough' | 'mistake' | 'insight' | 'struggle',
  pastThinking: string,
  currentUnderstanding: string,
  description: string
) => {
  return await ghostYouMode.storeInsight({
    user_id: userId,
    topic,
    insight_type: insightType,
    past_thinking: pastThinking,
    current_understanding: currentUnderstanding,
    description
  })
}

// React hook for Ghost-You Mode
export const useGhostYou = (userId: string) => {
  const [pastReasoning, setPastReasoning] = useState<GhostYouEntry[]>([])
  const [growthTimeline, setGrowthTimeline] = useState<GhostYouInsight[]>([])
  const [thinkingPatterns, setThinkingPatterns] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [reasoning, timeline, patterns] = await Promise.all([
          ghostYouMode.getPastReasoning(userId, ''),
          ghostYouMode.getGrowthTimeline(userId),
          ghostYouMode.analyzeThinkingPatterns(userId)
        ])

        setPastReasoning(reasoning)
        setGrowthTimeline(timeline)
        setThinkingPatterns(patterns)
      } catch (error) {
        console.error('Error loading Ghost-You data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      loadData()
    }
  }, [userId])

  return {
    pastReasoning,
    growthTimeline,
    thinkingPatterns,
    loading,
    storeReasoning: ghostYouMode.storeReasoning.bind(ghostYouMode),
    storeInsight: ghostYouMode.storeInsight.bind(ghostYouMode),
    getThinkingComparison: ghostYouMode.getThinkingComparison.bind(ghostYouMode)
  }
}
