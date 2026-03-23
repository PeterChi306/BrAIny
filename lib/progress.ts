/**
 * Progress tracking and mastery calculation system
 */

import { createSupabaseClient } from '@/lib/supabase/client'

export interface MasteryData {
  overallMastery: number // 0-100
  topicMastery: Record<string, number> // topic -> mastery (0-100)
  weakTopics: string[]
  strongTopics: string[]
  examReadiness: number // 0-100
}

export interface StudyStreak {
  currentStreak: number
  longestStreak: number
  lastStudyDate: string | null
}

export interface TodayTasks {
  flashcardsToReview: number
  weakTopicsToPractice: string[]
  upcomingExams: Array<{
    name: string
    date: string
    daysUntil: number
  }>
}

/**
 * Calculate overall mastery percentage from all performance data
 */
export async function calculateMastery(userId: string): Promise<MasteryData> {
  try {
    const supabase = createSupabaseClient()

    // Get all performance data
    const { data: performance } = await supabase
      .from('user_performance')
      .select('*')
      .eq('user_id', userId)

    // Get quiz scores
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('score, total_questions, topic, subject, created_at')
      .eq('user_id', userId)
      .eq('status', 'completed')

    // Get flashcard mastery
    const { data: flashcards } = await supabase
      .from('flashcards')
      .select('mastery_level, topic, subject')
      .eq('user_id', userId)

    // Calculate topic mastery
    const topicMastery: Record<string, number> = {}
    const topicScores: Record<string, number[]> = {}
    const topicCounts: Record<string, number> = {}

    // From quizzes
    quizzes?.forEach((quiz) => {
      if (quiz.topic && quiz.total_questions > 0) {
        const score = (quiz.score / quiz.total_questions) * 100
        if (!topicScores[quiz.topic]) {
          topicScores[quiz.topic] = []
          topicCounts[quiz.topic] = 0
        }
        topicScores[quiz.topic].push(score)
        topicCounts[quiz.topic] += 1
      }
    })

    // From flashcards
    flashcards?.forEach((card) => {
      if (card.topic) {
        const mastery = (card.mastery_level / 5) * 100
        if (!topicScores[card.topic]) {
          topicScores[card.topic] = []
          topicCounts[card.topic] = 0
        }
        topicScores[card.topic].push(mastery)
        topicCounts[card.topic] += 1
      }
    })

    // Calculate average mastery per topic
    Object.keys(topicScores).forEach((topic) => {
      const scores = topicScores[topic]
      const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length
      topicMastery[topic] = Math.round(avg)
    })

    // Calculate overall mastery
    const allMasteryValues = Object.values(topicMastery)
    const overallMastery =
      allMasteryValues.length > 0
        ? Math.round(allMasteryValues.reduce((sum, m) => sum + m, 0) / allMasteryValues.length)
        : 0

    // Identify weak and strong topics
    const weakTopics = Object.entries(topicMastery)
      .filter(([_, mastery]) => mastery < 70)
      .map(([topic]) => topic)
      .slice(0, 5)

    const strongTopics = Object.entries(topicMastery)
      .filter(([_, mastery]) => mastery >= 80)
      .map(([topic]) => topic)
      .slice(0, 5)

    // Calculate exam readiness (weighted average with recent performance weighted more)
    const recentQuizzes = quizzes
      ?.filter((q) => {
        const quizDate = new Date(q.created_at || Date.now())
        const daysAgo = (Date.now() - quizDate.getTime()) / (1000 * 60 * 60 * 24)
        return daysAgo <= 7 // Last 7 days
      })
      .slice(0, 5) || []

    const recentScore =
      recentQuizzes.length > 0
        ? recentQuizzes.reduce((sum, q) => {
            const score = q.total_questions > 0 ? (q.score / q.total_questions) * 100 : 0
            return sum + score
          }, 0) / recentQuizzes.length
        : overallMastery

    const examReadiness = Math.round(recentScore * 0.7 + overallMastery * 0.3)

    return {
      overallMastery,
      topicMastery,
      weakTopics,
      strongTopics,
      examReadiness,
    }
  } catch (error) {
    console.error('Error calculating mastery:', error)
    return {
      overallMastery: 0,
      topicMastery: {},
      weakTopics: [],
      strongTopics: [],
      examReadiness: 0,
    }
  }
}

/**
 * Get study streak information
 */
export async function getStudyStreak(userId: string): Promise<StudyStreak> {
  try {
    const supabase = createSupabaseClient()

    // Get streak from profiles table (maintained by database trigger)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('study_streak')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching profile streak:', profileError)
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: null,
      }
    }

    // Handle null/undefined study_streak
    let currentStreak = 0
    if (profile.study_streak === null || profile.study_streak === undefined) {
      console.log('🔧 Initializing null streak for user:', userId)
      // Initialize to 0 if null
      const { error: initError } = await supabase
        .from('profiles')
        .update({ study_streak: 0 })
        .eq('id', userId)
      
      if (!initError) {
        console.log('✅ Streak initialized to 0')
      }
    } else {
      currentStreak = profile.study_streak
    }

    // Get last study date from study_sessions
    const { data: lastSession } = await supabase
      .from('study_sessions')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // For now, longest streak is the same as current (could be enhanced later)
    return {
      currentStreak,
      longestStreak: currentStreak, // TODO: Track longest streak separately
      lastStudyDate: lastSession?.created_at || null,
    }
  } catch (error) {
    console.error('Error getting study streak:', error)
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
    }
  }
}

/**
 * Get today's study tasks
 */
export async function getTodayTasks(userId: string): Promise<TodayTasks> {
  try {
    const supabase = createSupabaseClient()

    // Get flashcards due for review
    const today = new Date().toISOString().split('T')[0]
    const { data: flashcards } = await supabase
      .from('flashcards')
      .select('id')
      .eq('user_id', userId)
      .or(`next_review_at.is.null,next_review_at.lte.${today}`)
      .limit(50)

    // Get weak topics from mastery
    const mastery = await calculateMastery(userId)
    const weakTopicsToPractice = mastery.weakTopics.slice(0, 3)

    // TODO: Get upcoming exams from a future exams table
    // For now, return empty array
    const upcomingExams: TodayTasks['upcomingExams'] = []

    return {
      flashcardsToReview: flashcards?.length || 0,
      weakTopicsToPractice,
      upcomingExams,
    }
  } catch (error) {
    console.error('Error getting today tasks:', error)
    return {
      flashcardsToReview: 0,
      weakTopicsToPractice: [],
      upcomingExams: [],
    }
  }
}

