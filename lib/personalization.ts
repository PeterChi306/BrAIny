/**
 * Personalization engine - tracks and uses user data for adaptive learning
 */

import { createSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

export interface StudyHistory {
  totalStudyTime: number
  sessionsThisWeek: number
  favoriteSubjects: string[]
  weakTopics: string[]
  strongTopics: string[]
  lastStudyDate: string | null
}

export interface PerformanceData {
  averageQuizScore: number
  totalQuizzes: number
  improvementTrend: 'up' | 'down' | 'stable'
  masteryLevels: Record<string, number>
}

export interface PersonalizationPrompts {
  systemPrompt: string
  responseInstructions: string
  examples: string[]
}

export class PersonalizationService {
  private profile: Profile | null = null

  async loadProfile(): Promise<Profile | null> {
    if (this.profile) return this.profile

    const supabase = createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    this.profile = profile
    return profile
  }

  generatePersonalizedPrompt(userQuery: string): PersonalizationPrompts {
    const profile = this.profile
    
    if (!profile) {
      return this.getDefaultPrompts(userQuery)
    }

    // Debug log to see what we're getting from database
    console.log('Profile data from DB:', {
      interests: profile.interests,
      hobbies: profile.hobbies,
      favorite_topics: profile.favorite_topics,
      subjects: profile.subjects,
      study_goals: profile.study_goals,
      personality_traits: profile.personality_traits
    })

    // Check if profile has required fields, otherwise use defaults
    if (!profile.interests || (!Array.isArray(profile.interests) && typeof profile.interests !== 'string')) {
      console.log('Using default prompts - invalid interests data')
      return this.getDefaultPrompts(userQuery)
    }

    const toneInstructions = this.getToneInstructions(profile.preferred_tone)
    const paceInstructions = this.getPaceInstructions(profile.learning_pace)
    const difficultyInstructions = this.getDifficultyInstructions(profile.difficulty_preference)
    const communicationInstructions = this.getCommunicationInstructions(profile.communication_style)
    const contextInstructions = this.getContextInstructions(profile)
    const motivationInstructions = this.getMotivationInstructions(profile.motivation_level)

    const systemPrompt = `You are a personalized AI tutor with deep knowledge of the user's learning preferences and personality. You have access to their complete profile and should use this information to provide highly personalized responses.

USER PROFILE:
- Grade Level: ${profile.grade_level}
- Subjects: ${Array.isArray(profile.subjects) ? profile.subjects.join(', ') : ''}
- Study Goals: ${Array.isArray(profile.study_goals) ? profile.study_goals.join(', ') : ''}
- Learning Style: ${profile.learning_style}
- Hobbies: ${Array.isArray(profile.hobbies) ? profile.hobbies.join(', ') : ''}
- Interests: ${Array.isArray(profile.interests) ? profile.interests.join(', ') : ''}
- Personality Traits: ${Array.isArray(profile.personality_traits) ? profile.personality_traits.join(', ') : ''}
- Preferred Tone: ${profile.preferred_tone}
- Favorite Topics: ${Array.isArray(profile.favorite_topics) ? profile.favorite_topics.join(', ') : ''}
- Learning Pace: ${profile.learning_pace}
- Difficulty Preference: ${profile.difficulty_preference}
- Communication Style: ${profile.communication_style}
- Motivation Level: ${profile.motivation_level}
- Study Time Preference: ${profile.study_time_preference}
- Preferred Session Length: ${profile.preferred_session_length}

PERSONALIZATION INSTRUCTIONS:
${toneInstructions}
${paceInstructions}
${difficultyInstructions}
${communicationInstructions}
${contextInstructions}
${motivationInstructions}

RESPONSE GUIDELINES:
1. Always adapt your response to the user's preferred tone and communication style
2. Adjust complexity based on their grade level and difficulty preference
3. Incorporate their interests and hobbies when relevant to make examples relatable
4. Consider their personality traits in your approach (encouraging for curious users, direct for analytical users, etc.)
5. Match their learning pace (thorough for slow, efficient for fast)
6. Provide motivation appropriate to their motivation level
7. Use their favorite topics as examples when possible
8. Keep responses appropriate for their preferred session length
9. NEVER say "I don't have feelings" or "I'm an AI" - respond as if you know them personally
10. Reference their specific interests, hobbies, and goals in your responses
11. Use their name if available and appropriate
12. Remember previous conversations and build on them`

    const responseInstructions = `Respond to: "${userQuery}" using the personalization above.`
    
    const examples = this.generatePersonalizedExamples(profile)

    return {
      systemPrompt,
      responseInstructions,
      examples
    }
  }

  private getToneInstructions(tone: string): string {
    const toneMap = {
      friendly: 'Use a warm, conversational, and encouraging tone. Be like a helpful study buddy.',
      formal: 'Use professional, respectful language. Be like a formal tutor or professor.',
      encouraging: 'Be highly motivational and positive. Celebrate small wins and build confidence.',
      direct: 'Be straightforward and to-the-point. Focus on efficiency and clarity.'
    }
    return toneMap[tone as keyof typeof toneMap] || toneMap.friendly
  }

  private getPaceInstructions(pace: string): string {
    const paceMap = {
      slow: 'Provide thorough, detailed explanations. Break down complex topics into small steps. Don\'t rush.',
      moderate: 'Balance detail with efficiency. Provide comprehensive but not overwhelming explanations.',
      fast: 'Be concise and efficient. Focus on key points and move quickly through material.'
    }
    return paceMap[pace as keyof typeof paceMap] || paceMap.moderate
  }

  private getDifficultyInstructions(difficulty: string): string {
    const difficultyMap = {
      easy: 'Start with simple concepts and gradually increase complexity. Provide lots of scaffolding.',
      medium: 'Provide moderate challenges. Balance new concepts with familiar ones.',
      hard: 'Provide challenging material. Push boundaries and include advanced concepts.'
    }
    return difficultyMap[difficulty as keyof typeof difficultyMap] || difficultyMap.medium
  }

  private getCommunicationInstructions(style: string): string {
    const styleMap = {
      visual: 'Include diagrams, charts, and visual examples. Use spatial descriptions.',
      verbal: 'Provide detailed verbal explanations. Use rich descriptions and analogies.',
      mixed: 'Balance visual descriptions with verbal explanations. Use both approaches.'
    }
    return styleMap[style as keyof typeof styleMap] || styleMap.mixed
  }

  private getContextInstructions(profile: Profile): string {
    // Handle both array and string cases for database compatibility
    const interests = Array.isArray(profile.interests) 
      ? profile.interests.join(', ') 
      : (typeof profile.interests === 'string' ? profile.interests : '')
    const hobbies = Array.isArray(profile.hobbies) 
      ? profile.hobbies.join(', ') 
      : (typeof profile.hobbies === 'string' ? profile.hobbies : '')
    const favoriteTopics = Array.isArray(profile.favorite_topics) 
      ? profile.favorite_topics.join(', ') 
      : (typeof profile.favorite_topics === 'string' ? profile.favorite_topics : '')
    
    return `Connect topics to user's interests: ${interests}. 
Use examples from their hobbies: ${hobbies}.
Reference their favorite topics: ${favoriteTopics} when relevant.
Consider their grade level (${profile.grade_level}) for appropriate complexity.`
  }

  private getMotivationInstructions(motivation: string): string {
    const motivationMap = {
      low: 'Provide extra encouragement. Break tasks into smaller steps. Celebrate progress frequently.',
      medium: 'Provide regular encouragement and acknowledge effort appropriately.',
      high: 'Challenge them appropriately. Acknowledge their drive and push them to excel.'
    }
    return motivationMap[motivation as keyof typeof motivationMap] || motivationMap.medium
  }

  private generatePersonalizedExamples(profile: Profile): string[] {
    const examples = []
    
    const interests = Array.isArray(profile.interests) ? profile.interests : []
    const hobbies = Array.isArray(profile.hobbies) ? profile.hobbies : []
    const favoriteTopics = Array.isArray(profile.favorite_topics) ? profile.favorite_topics : []
    
    if (interests.includes('Technology')) {
      examples.push('For example, if we\'re studying algorithms, I might relate this to how social media algorithms work')
    }
    
    if (hobbies.includes('Gaming')) {
      examples.push('I could use gaming analogies to explain complex concepts')
    }
    
    if (favoriteTopics.includes('Artificial Intelligence')) {
      examples.push('When discussing machine learning, I can connect it to real-world AI applications you use daily')
    }
    
    return examples
  }

  private getDefaultPrompts(userQuery: string): PersonalizationPrompts {
    return {
      systemPrompt: 'You are a helpful AI tutor. Provide clear, educational responses.',
      responseInstructions: `Respond to: "${userQuery}"`,
      examples: []
    }
  }
}

export const personalizationService = new PersonalizationService()

/**
 * Get study history for adaptive learning
 */
export async function getStudyHistory(userId: string): Promise<StudyHistory | null> {
  try {
    const supabase = createSupabaseClient()

    const { data: sessions } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Get performance data
    const { data: performance } = await supabase
      .from('user_performance')
      .select('*')
      .eq('user_id', userId)

    // Calculate metrics
    const totalStudyTime = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0
    
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const sessionsThisWeek = sessions?.filter(
      s => new Date(s.created_at) >= oneWeekAgo
    ).length || 0

    // Get favorite subjects (most studied)
    const subjectCounts: Record<string, number> = {}
    sessions?.forEach(s => {
      if (s.subject) {
        subjectCounts[s.subject] = (subjectCounts[s.subject] || 0) + 1
      }
    })
    const favoriteSubjects = Object.entries(subjectCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([subject]) => subject)

    // Get weak and strong topics from performance
    const weakTopics: string[] = []
    const strongTopics: string[] = []
    
    performance?.forEach(p => {
      if (p.topic && p.average_score !== null) {
        if (p.average_score < 0.6) {
          weakTopics.push(p.topic)
        } else if (p.average_score >= 0.8) {
          strongTopics.push(p.topic)
        }
      }
    })

    const lastStudyDate = sessions?.[0]?.created_at || null

    return {
      totalStudyTime,
      sessionsThisWeek,
      favoriteSubjects,
      weakTopics: Array.from(new Set(weakTopics)),
      strongTopics: Array.from(new Set(strongTopics)),
      lastStudyDate,
    }
  } catch (error) {
    console.error('Error getting study history:', error)
    return null
  }
}

/**
 * Get performance data for adaptive learning
 */
export async function getPerformanceData(userId: string): Promise<PerformanceData | null> {
  try {
    const supabase = createSupabaseClient()

    const { data: performance } = await supabase
      .from('user_performance')
      .select('*')
      .eq('user_id', userId)

    if (!performance || performance.length === 0) {
      return {
        averageQuizScore: 0,
        totalQuizzes: 0,
        improvementTrend: 'stable',
        masteryLevels: {},
      }
    }

    // Calculate average score
    const allScores = performance.flatMap(p => p.quiz_scores || [])
    const averageQuizScore = allScores.length > 0
      ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length
      : 0

    const totalQuizzes = performance.reduce((sum, p) => sum + (p.total_attempts || 0), 0)

    // Determine improvement trend (simplified)
    const improvementTrend: 'up' | 'down' | 'stable' = 'stable' // Could be enhanced with time-series analysis

    // Build mastery levels by topic
    const masteryLevels: Record<string, number> = {}
    performance.forEach(p => {
      if (p.topic && p.average_score !== null) {
        masteryLevels[p.topic] = p.average_score
      }
    })

    return {
      averageQuizScore,
      totalQuizzes,
      improvementTrend,
      masteryLevels,
    }
  } catch (error) {
    console.error('Error getting performance data:', error)
    return null
  }
}

/**
 * Record a study session
 */
export async function recordStudySession(data: {
  userId: string
  sessionType: 'chat' | 'quiz' | 'flashcards' | 'practice'
  topic?: string
  subject?: string
  durationMinutes?: number
  performanceScore?: number
  notes?: string
}) {
  try {
    const supabase = createSupabaseClient()

    const { error } = await supabase
      .from('study_sessions')
      .insert({
        user_id: data.userId,
        session_type: data.sessionType,
        topic: data.topic || null,
        subject: data.subject || null,
        duration_minutes: data.durationMinutes || 0,
        performance_score: data.performanceScore || null,
        notes: data.notes || null,
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error recording study session:', error)
    return false
  }
}

/**
 * Get recommended topics based on performance and history
 */
export async function getRecommendedTopics(userId: string): Promise<string[]> {
  try {
    const history = await getStudyHistory(userId)
    const performance = await getPerformanceData(userId)

    if (!history || !performance) return []

    // Prioritize weak topics that need more practice
    const weakTopics = history.weakTopics.filter(topic => {
      const mastery = performance.masteryLevels[topic] || 0
      return mastery < 0.7 // Not yet mastered
    })

    return weakTopics.slice(0, 5) // Return top 5 recommendations
  } catch (error) {
    console.error('Error getting recommended topics:', error)
    return []
  }
}
