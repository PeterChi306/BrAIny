/**
 * Pro Tier Tools - Available to Pro users only
 * Advanced analytics, adaptive learning, and personalized insights
 */

export interface WeakSpotAnalysisRequest {
  userId: string
  timeRange?: 'week' | 'month' | 'quarter' | 'year'
  subjects?: string[]
}

export interface WeakSpotAnalysisResponse {
  weakTopics: Array<{
    topic: string
    subject: string
    weaknessScore: number // 0-100, higher = weaker
    recommendedActions: string[]
    improvementPotential: number
  }>
  patterns: {
    commonMistakes: string[]
    difficultConcepts: string[]
    learningGaps: string[]
  }
  recommendations: Array<{
    type: 'study' | 'practice' | 'review'
    description: string
    priority: 'high' | 'medium' | 'low'
    estimatedTime: number
  }>
}

export interface AdaptiveQuizRequest {
  userId: string
  subject?: string
  initialDifficulty?: 'easy' | 'medium' | 'hard'
  maxQuestions?: number
  focusWeakAreas?: boolean
}

export interface AdaptiveQuizResponse {
  quiz: {
    id: string
    questions: Array<{
      id: string
      question: string
      options: string[]
      difficulty: 'easy' | 'medium' | 'hard'
      concept: string
      adaptiveWeight: number
    }>
    adaptiveStrategy: string
  }
  metadata: {
    targetDifficulty: string
    focusAreas: string[]
    estimatedTime: number
  }
}

export interface StudyPlanRequest {
  examDate: string
  weakTopics: string[]
  subjects: string[]
  availableStudyTime: number // minutes per day
  studyPreferences: {
    timeOfDay: 'morning' | 'afternoon' | 'evening'
    sessionLength: 'short' | 'medium' | 'long'
    preferredMethods: string[]
  }
}

export interface StudyPlanResponse {
  plan: {
    id: string
    title: string
    totalWeeks: number
    weeklyGoals: Array<{
      week: number
      goals: string[]
      topics: string[]
      estimatedHours: number
    }>
    dailySchedule: Array<{
      day: string
      sessions: Array<{
        time: string
        duration: number
        topic: string
        method: string
        materials: string[]
      }>
    }>
    milestones: Array<{
      date: string
      description: string
      completed: boolean
    }>
  }
  recommendations: {
    studyTips: string[]
    resources: string[]
    adjustments: string[]
  }
}

export interface LearningAnalyticsRequest {
  userId: string
  timeRange?: 'week' | 'month' | 'quarter' | 'year'
  metrics?: string[]
}

export interface LearningAnalyticsResponse {
  overview: {
    totalStudyTime: number
    sessionsCompleted: number
    averageSessionLength: number
    streakDays: number
    masteryProgress: number
  }
  subjectPerformance: Array<{
    subject: string
    averageScore: number
    timeSpent: number
    improvementRate: number
    weakAreas: string[]
    strongAreas: string[]
  }>
  learningPatterns: {
    bestStudyTimes: string[]
    optimalSessionLength: number
    mostEffectiveMethods: string[]
    difficultyProgression: string[]
  }
  predictions: {
    examReadiness: number
    weakTopicProbability: string[]
    recommendedFocus: string[]
    timeToMastery: string[]
  }
  trends: {
    performanceOverTime: Array<{ date: string; score: number }>
    studyTimeOverTime: Array<{ date: string; minutes: number }>
    topicMasteryOverTime: Array<{ date: string; mastered: number }>
  }
}

/**
 * Analyze User Weak Spots based on learning history
 * Pro tier feature
 */
export async function analyze_user_weak_spots(request: WeakSpotAnalysisRequest): Promise<WeakSpotAnalysisResponse> {
  const response = await fetch('/api/pro/weak-spot-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: request.userId,
      timeRange: request.timeRange || 'month',
      subjects: request.subjects || []
    })
  })

  if (!response.ok) {
    throw new Error('Failed to analyze weak spots')
  }

  return response.json()
}

/**
 * Generate Adaptive Quiz based on user performance
 * Pro tier feature
 */
export async function generate_adaptive_quiz(request: AdaptiveQuizRequest): Promise<AdaptiveQuizResponse> {
  const response = await fetch('/api/pro/adaptive-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: request.userId,
      subject: request.subject,
      initialDifficulty: request.initialDifficulty || 'medium',
      maxQuestions: Math.min(request.maxQuestions || 20, 25),
      focusWeakAreas: request.focusWeakAreas !== false
    })
  })

  if (!response.ok) {
    throw new Error('Failed to generate adaptive quiz')
  }

  return response.json()
}

/**
 * Generate Personalized Study Plan
 * Pro tier feature
 */
export async function generate_study_plan(request: StudyPlanRequest): Promise<StudyPlanResponse> {
  const response = await fetch('/api/pro/study-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      examDate: request.examDate,
      weakTopics: request.weakTopics,
      subjects: request.subjects,
      availableStudyTime: request.availableStudyTime,
      studyPreferences: request.studyPreferences
    })
  })

  if (!response.ok) {
    throw new Error('Failed to generate study plan')
  }

  return response.json()
}

/**
 * Generate Comprehensive Learning Analytics
 * Pro tier feature
 */
export async function generate_learning_analytics(request: LearningAnalyticsRequest): Promise<LearningAnalyticsResponse> {
  const response = await fetch('/api/pro/learning-analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: request.userId,
      timeRange: request.timeRange || 'month',
      metrics: request.metrics || ['performance', 'time', 'progress', 'patterns']
    })
  })

  if (!response.ok) {
    throw new Error('Failed to generate learning analytics')
  }

  return response.json()
}

/**
 * Get Personalized Learning Recommendations
 * Pro tier feature
 */
export async function get_personalized_recommendations(userId: string): Promise<any> {
  const response = await fetch(`/api/pro/recommendations/${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })

  if (!response.ok) {
    throw new Error('Failed to get personalized recommendations')
  }

  return response.json()
}

/**
 * Predict Learning Outcomes
 * Pro tier feature
 */
export async function predict_learning_outcomes(userId: string, examDate?: string): Promise<any> {
  const response = await fetch(`/api/pro/predictions/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      examDate
    })
  })

  if (!response.ok) {
    throw new Error('Failed to predict learning outcomes')
  }

  return response.json()
}
