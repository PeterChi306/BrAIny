import { createSupabaseClient } from './supabase/client'
import { useState, useEffect } from 'react'

export interface ChatMessage {
  id: string
  user_id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface ChatSession {
  id: string
  user_id: string
  title: string
  subject?: string
  topic?: string
  mode?: string
  message_count: number
  last_message_at: string
  created_at: string
  updated_at: string
}

export interface ConversationInsight {
  topic: string
  subject: string
  lastStudied: string
  messageCount: number
  progress: number
  difficulty: 'easy' | 'medium' | 'hard'
  timeSpent: number
  keyPoints: string[]
  mistakes: string[]
  breakthroughs: string[]
}

class ConversationDataService {
  private supabase = createSupabaseClient()

  // Get recent chat sessions for a user
  async getRecentSessions(userId: string, limit: number = 10) {
    try {
      const { data, error } = await this.supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting recent sessions:', error)
      return []
    }
  }

  // Get current/continue learning session
  async getCurrentLearningSession(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .not('mode', 'in', '("quiz", "review")')
        .order('last_message_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }
      
      return data
    } catch (error) {
      console.error('Error getting current session:', error)
      return null
    }
  }

  // Get conversation insights for a topic
  async getConversationInsights(userId: string, topic?: string) {
    try {
      let query = this.supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)

      if (topic) {
        query = query.eq('topic', topic)
      }

      const { data, error } = await query
        .order('last_message_at', { ascending: false })
        .limit(20)

      if (error) throw error

      const insights: ConversationInsight[] = []
      
      for (const session of data || []) {
        // Get messages for this session to analyze
        const messages = await this.getSessionMessages(session.id)
        
        const insight = await this.analyzeSession(session, messages)
        insights.push(insight)
      }

      return insights
    } catch (error) {
      console.error('Error getting conversation insights:', error)
      return []
    }
  }

  // Get messages for a session
  async getSessionMessages(sessionId: string) {
    try {
      const { data, error } = await this.supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting session messages:', error)
      return []
    }
  }

  // Analyze a session to extract insights
  private async analyzeSession(session: ChatSession, messages: ChatMessage[]): Promise<ConversationInsight> {
    const userMessages = messages.filter(m => m.role === 'user')
    const assistantMessages = messages.filter(m => m.role === 'assistant')
    
    // Extract key topics and concepts
    const keyPoints = this.extractKeyPoints(assistantMessages)
    const mistakes = this.extractMistakes(userMessages, assistantMessages)
    const breakthroughs = this.extractBreakthroughs(userMessages, assistantMessages)
    
    // Calculate difficulty based on conversation patterns
    const difficulty = this.calculateDifficulty(userMessages, assistantMessages)
    
    // Estimate time spent based on message count and response times
    const timeSpent = this.estimateTimeSpent(messages)
    
    // Calculate progress based on conversation completion
    const progress = this.calculateProgress(session, messages)

    return {
      topic: session.topic || 'General',
      subject: session.subject || 'General',
      lastStudied: session.last_message_at,
      messageCount: session.message_count,
      progress,
      difficulty,
      timeSpent,
      keyPoints,
      mistakes,
      breakthroughs
    }
  }

  // Extract key learning points from AI responses
  private extractKeyPoints(assistantMessages: ChatMessage[]): string[] {
    const keyPoints: string[] = []
    
    for (const message of assistantMessages) {
      // Look for numbered lists, bullet points, and key phrases
      const content = message.content.toLowerCase()
      
      // Find patterns like "Key point:", "Remember:", "Important:"
      const keyPatterns = [
        /(?:key point|remember|important|note|tip)[:\s]*([^.!?]+)/gi,
        /(?:•|\*|\-)\s+([^.!?]+)/gi,
        /\d+\.\s+([^.!?]+)/gi
      ]
      
      for (const pattern of keyPatterns) {
        const matches = content.match(pattern)
        if (matches) {
          keyPoints.push(...matches.map(m => m.trim()))
        }
      }
    }
    
    // Remove duplicates and limit to top 5
    return Array.from(new Set(keyPoints)).slice(0, 5)
  }

  // Extract mistakes from conversation
  private extractMistakes(userMessages: ChatMessage[], assistantMessages: ChatMessage[]): string[] {
    const mistakes: string[] = []
    
    for (let i = 0; i < userMessages.length; i++) {
      const userMsg = userMessages[i]
      const nextAssistantMsg = assistantMessages.find(m => 
        new Date(m.created_at) > new Date(userMsg.created_at)
      )
      
      if (nextAssistantMsg) {
        // Look for correction patterns in AI responses
        const correctionPatterns = [
          /(?:that's not quite right|actually|let me correct|not exactly|close but)[:\s]*([^.!?]+)/gi,
          /(?:the correct way|instead|you should)[:\s]*([^.!?]+)/gi
        ]
        
        for (const pattern of correctionPatterns) {
          const matches = nextAssistantMsg.content.match(pattern)
          if (matches) {
            mistakes.push(matches[1].trim())
          }
        }
      }
    }
    
    return Array.from(new Set(mistakes)).slice(0, 3)
  }

  // Extract breakthrough moments
  private extractBreakthroughs(userMessages: ChatMessage[], assistantMessages: ChatMessage[]): string[] {
    const breakthroughs: string[] = []
    
    for (let i = 0; i < userMessages.length; i++) {
      const userMsg = userMessages[i]
      const nextAssistantMsg = assistantMessages.find(m => 
        new Date(m.created_at) > new Date(userMsg.created_at)
      )
      
      if (nextAssistantMsg) {
        // Look for positive reinforcement patterns
        const breakthroughPatterns = [
          /(?:excellent|perfect|great job|you got it|that's exactly right|brilliant)[:\s]*([^.!?]+)/gi,
          /(?:you understand|now you see|click|breakthrough)[:\s]*([^.!?]+)/gi
        ]
        
        for (const pattern of breakthroughPatterns) {
          const matches = nextAssistantMsg.content.match(pattern)
          if (matches) {
            breakthroughs.push(matches[1].trim())
          }
        }
      }
    }
    
    return Array.from(new Set(breakthroughs)).slice(0, 3)
  }

  // Calculate difficulty based on conversation patterns
  private calculateDifficulty(userMessages: ChatMessage[], assistantMessages: ChatMessage[]): 'easy' | 'medium' | 'hard' {
    const userMessageCount = userMessages.length
    const assistantMessageCount = assistantMessages.length
    
    // Count confusion indicators
    const confusionIndicators = userMessages.reduce((count, msg) => {
      const content = msg.content.toLowerCase()
      const indicators = ['confused', 'dont understand', 'lost', 'help', 'what do you mean', 'unclear']
      const found = indicators.filter(indicator => content.includes(indicator))
      return count + found.length
    }, 0)
    
    // Count correction indicators
    const correctionIndicators = assistantMessages.reduce((count, msg) => {
      const content = msg.content.toLowerCase()
      const corrections = ['not quite', 'actually', 'let me correct', 'instead', 'the correct way']
      const found = corrections.filter(correction => content.includes(correction))
      return count + found.length
    }, 0)
    
    // Calculate difficulty score
    const totalMessages = userMessageCount + assistantMessageCount
    const confusionRate = confusionIndicators / totalMessages
    const correctionRate = correctionIndicators / totalMessages
    
    if (confusionRate > 0.3 || correctionRate > 0.2) {
      return 'hard'
    } else if (confusionRate > 0.1 || correctionRate > 0.1) {
      return 'medium'
    } else {
      return 'easy'
    }
  }

  // Estimate time spent based on message patterns
  private estimateTimeSpent(messages: ChatMessage[]): number {
    if (messages.length < 2) return 0
    
    let totalTime = 0
    
    for (let i = 1; i < messages.length; i++) {
      const prevMsg = messages[i - 1]
      const currentMsg = messages[i]
      
      // Time between messages (reading/thinking time)
      const timeDiff = new Date(currentMsg.created_at).getTime() - new Date(prevMsg.created_at).getTime()
      
      // Only count reasonable gaps (1 second to 10 minutes)
      if (timeDiff > 1000 && timeDiff < 600000) {
        totalTime += timeDiff
      }
    }
    
    return Math.round(totalTime / 1000 / 60) // Convert to minutes
  }

  // Calculate progress based on conversation completion
  private calculateProgress(session: ChatSession, messages: ChatMessage[]): number {
    // Look for completion indicators
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage) return 0
    
    const content = lastMessage.content.toLowerCase()
    const completionIndicators = [
      'understand', 'got it', 'makes sense', 'clear now', 'thank you',
      'that helps', 'i see', 'now i get', 'perfect'
    ]
    
    const hasCompletion = completionIndicators.some(indicator => content.includes(indicator))
    
    // Base progress on message count and completion
    const messageProgress = Math.min((messages.length / 10) * 100, 80) // Max 80% from messages
    const completionBonus = hasCompletion ? 20 : 0
    
    return Math.min(messageProgress + completionBonus, 100)
  }

  // Get topics user is struggling with
  async getStruggleTopics(userId: string) {
    try {
      const { data: struggleSessions, error: struggleError } = await this.supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false })
        .limit(50)

      if (struggleError || !struggleSessions) return []

      const topicDifficulties: Record<string, { count: number; hardness: number }> = {}
      
      for (const session of struggleSessions) {
        const messages = await this.getSessionMessages(session.id)
        const difficulty = this.calculateDifficulty(
          messages.filter(m => m.role === 'user'),
          messages.filter(m => m.role === 'assistant')
        )
        
        const hardnessScore = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1
        
        if (session.topic) {
          if (!topicDifficulties[session.topic]) {
            topicDifficulties[session.topic] = { count: 0, hardness: 0 }
          }
          topicDifficulties[session.topic].count += 1
          topicDifficulties[session.topic].hardness += hardnessScore
        }
      }
      
      return Object.entries(topicDifficulties)
        .map(([topic, data]) => ({
          topic,
          struggleScore: data.hardness / data.count,
          sessionCount: data.count
        }))
        .sort((a, b) => b.struggleScore - a.struggleScore)
        .slice(0, 5)
    } catch (error) {
      console.error('Error getting struggle topics:', error)
      return []
    }
  }

  // Get user's learning interests based on conversations
  async getLearningInterests(userId: string) {
    try {
      const { data: sessions, error } = await this.supabase
        .from('chat_sessions')
        .select('subject, topic, message_count')
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false })
        .limit(100)

      if (!sessions) return []

      const interests: Record<string, { count: number; engagement: number }> = {}
      
      for (const session of sessions) {
        const subjects = [session.subject, session.topic].filter(Boolean)
        
        for (const subject of subjects) {
          if (!interests[subject]) {
            interests[subject] = { count: 0, engagement: 0 }
          }
          interests[subject].count += 1
          interests[subject].engagement += session.message_count
        }
      }
      
      return Object.entries(interests)
        .map(([name, data]) => ({
          name,
          sessionCount: data.count,
          totalMessages: data.engagement,
          avgMessagesPerSession: data.engagement / data.count
        }))
        .sort((a, b) => b.totalMessages - a.totalMessages)
        .slice(0, 8)
    } catch (error) {
      console.error('Error getting learning interests:', error)
      return []
    }
  }
}

export const conversationData = new ConversationDataService()

// React hook for conversation data
export const useConversationData = (userId: string) => {
  const [recentSessions, setRecentSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [insights, setInsights] = useState<ConversationInsight[]>([])
  const [struggleTopics, setStruggleTopics] = useState<any[]>([])
  const [interests, setInterests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sessions, current, conversationInsights, struggles, userInterests] = await Promise.all([
          conversationData.getRecentSessions(userId),
          conversationData.getCurrentLearningSession(userId),
          conversationData.getConversationInsights(userId),
          conversationData.getStruggleTopics(userId),
          conversationData.getLearningInterests(userId)
        ])

        setRecentSessions(sessions)
        setCurrentSession(current)
        setInsights(conversationInsights)
        setStruggleTopics(struggles)
        setInterests(userInterests)
      } catch (error) {
        console.error('Error loading conversation data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      loadData()
    }
  }, [userId])

  return {
    recentSessions,
    currentSession,
    insights,
    struggleTopics,
    interests,
    loading,
    refreshData: () => {
      if (userId) {
        // Call the data loading functions directly
        Promise.all([
          conversationData.getRecentSessions(userId).then(setRecentSessions),
          conversationData.getCurrentLearningSession(userId).then(setCurrentSession),
          conversationData.getConversationInsights(userId).then(setInsights),
          conversationData.getStruggleTopics(userId).then(setStruggleTopics),
          conversationData.getLearningInterests(userId).then(setInterests)
        ])
      }
    }
  }
}
