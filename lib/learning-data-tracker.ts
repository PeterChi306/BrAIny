/**
 * Learning Data Tracker for Pro Features
 * Tracks user learning data to power weak spot detection and adaptive quizzes
 */

export interface LearningData {
  scanned_topics: Array<{
    topic: string
    subject: string
    timestamp: string
    confidence: number
  }>
  quiz_scores: Array<{
    quizId: string
    topic: string
    subject: string
    score: number
    totalQuestions: number
    timestamp: string
    difficulty: string
  }>
  incorrect_answers: Array<{
    questionId: string
    topic: string
    subject: string
    concept: string
    userAnswer: string
    correctAnswer: string
    timestamp: string
    difficulty: string
  }>
  topics_studied: Array<{
    topic: string
    subject: string
    studyMethod: 'chat' | 'quiz' | 'flashcards' | 'practice' | 'scan'
    duration: number // minutes
    timestamp: string
    masteryLevel: number // 0-100
  }>
  study_sessions: Array<{
    sessionId: string
    startTime: string
    endTime: string
    duration: number // minutes
    topics: string[]
    subjects: string[]
    activities: string[]
    performanceScore?: number
  }>
}

export interface WeakSpotData {
  topic: string
  subject: string
  weaknessScore: number // 0-100, higher = weaker
  incorrectCount: number
  totalAttempts: number
  lastIncorrect: string
  concepts: string[]
}

export interface LearningPattern {
  bestStudyTimes: string[]
  optimalSessionLength: number
  mostEffectiveMethods: string[]
  difficultyProgression: Record<string, number>
  subjectPreferences: Record<string, number>
}

/**
 * Learning Data Tracker Class
 */
export class LearningDataTracker {
  private static instance: LearningDataTracker
  private data: LearningData = {
    scanned_topics: [],
    quiz_scores: [],
    incorrect_answers: [],
    topics_studied: [],
    study_sessions: []
  }

  static getInstance(): LearningDataTracker {
    if (!this.instance) {
      this.instance = new LearningDataTracker()
    }
    return this.instance
  }

  /**
   * Track scanned document topic
   */
  async trackScannedTopic(userId: string, topic: string, subject: string, confidence: number): Promise<void> {
    const scanData = {
      topic,
      subject,
      timestamp: new Date().toISOString(),
      confidence
    }

    this.data.scanned_topics.push(scanData)
    await this.saveToDatabase(userId, 'scanned_topics', scanData)
  }

  /**
   * Track quiz completion
   */
  async trackQuizScore(
    userId: string,
    quizId: string,
    topic: string,
    subject: string,
    score: number,
    totalQuestions: number,
    difficulty: string
  ): Promise<void> {
    const quizData = {
      quizId,
      topic,
      subject,
      score,
      totalQuestions,
      timestamp: new Date().toISOString(),
      difficulty
    }

    this.data.quiz_scores.push(quizData)
    await this.saveToDatabase(userId, 'quiz_scores', quizData)
  }

  /**
   * Track incorrect answer
   */
  async trackIncorrectAnswer(
    userId: string,
    questionId: string,
    topic: string,
    subject: string,
    concept: string,
    userAnswer: string,
    correctAnswer: string,
    difficulty: string
  ): Promise<void> {
    const incorrectData = {
      questionId,
      topic,
      subject,
      concept,
      userAnswer,
      correctAnswer,
      timestamp: new Date().toISOString(),
      difficulty
    }

    this.data.incorrect_answers.push(incorrectData)
    await this.saveToDatabase(userId, 'incorrect_answers', incorrectData)
  }

  /**
   * Track topic study session
   */
  async trackTopicStudy(
    userId: string,
    topic: string,
    subject: string,
    studyMethod: 'chat' | 'quiz' | 'flashcards' | 'practice' | 'scan',
    duration: number,
    masteryLevel: number
  ): Promise<void> {
    const studyData = {
      topic,
      subject,
      studyMethod,
      duration,
      timestamp: new Date().toISOString(),
      masteryLevel
    }

    this.data.topics_studied.push(studyData)
    await this.saveToDatabase(userId, 'topics_studied', studyData)
  }

  /**
   * Track complete study session
   */
  async trackStudySession(
    userId: string,
    sessionId: string,
    startTime: string,
    endTime: string,
    topics: string[],
    subjects: string[],
    activities: string[],
    performanceScore?: number
  ): Promise<void> {
    const sessionData = {
      sessionId,
      startTime,
      endTime,
      duration: Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000), // minutes
      topics,
      subjects,
      activities,
      performanceScore
    }

    this.data.study_sessions.push(sessionData)
    await this.saveToDatabase(userId, 'study_sessions', sessionData)
  }

  /**
   * Get user's weak spots
   */
  async getWeakSpots(userId: string, timeRange?: 'week' | 'month' | 'quarter' | 'year'): Promise<WeakSpotData[]> {
    const data = await this.getUserData(userId, timeRange)
    const weakSpots: WeakSpotData[] = []

    // Group incorrect answers by topic and concept
    const topicGroups = this.groupByTopic(data.incorrect_answers)

    for (const [topicKey, answers] of Object.entries(topicGroups)) {
      const [topic, subject] = topicKey.split('|')
      const incorrectCount = answers.length
      const totalAttempts = this.getTotalAttempts(data.quiz_scores, topic, subject)
      const weaknessScore = totalAttempts > 0 ? (incorrectCount / totalAttempts) * 100 : 0
      const concepts = Array.from(new Set(answers.map(a => a.concept)))

      if (weaknessScore > 30) { // Only include topics with 30%+ failure rate
        weakSpots.push({
          topic,
          subject,
          weaknessScore,
          incorrectCount,
          totalAttempts,
          lastIncorrect: answers[answers.length - 1]?.timestamp || '',
          concepts
        })
      }
    }

    return weakSpots.sort((a, b) => b.weaknessScore - a.weaknessScore)
  }

  /**
   * Get learning patterns
   */
  async getLearningPatterns(userId: string): Promise<LearningPattern> {
    const data = await this.getUserData(userId)

    // Best study times (hour of day)
    const studyHours = data.study_sessions.map(session => 
      new Date(session.startTime).getHours()
    )
    const hourCounts = this.countOccurrences(studyHours)
    const bestHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`)

    // Optimal session length
    const sessionLengths = data.study_sessions.map(s => s.duration).filter(d => d > 0)
    const optimalLength = sessionLengths.length > 0 
      ? Math.round(sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length)
      : 30

    // Most effective methods
    const methodPerformance = this.calculateMethodEffectiveness(data)
    const mostEffectiveMethods = Object.entries(methodPerformance)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([method]) => method)

    // Difficulty progression
    const difficultyProgression = this.calculateDifficultyProgression(data)

    // Subject preferences
    const subjectTime = this.calculateSubjectTime(data)

    return {
      bestStudyTimes: bestHours,
      optimalSessionLength: optimalLength,
      mostEffectiveMethods,
      difficultyProgression,
      subjectPreferences: subjectTime
    }
  }

  /**
   * Get mastery level for topics
   */
  async getTopicMastery(userId: string): Promise<Record<string, number>> {
    const data = await this.getUserData(userId)
    const mastery: Record<string, number> = {}

    // Calculate mastery based on quiz performance and study consistency
    for (const topic of data.topics_studied) {
      const quizPerformance = this.getTopicQuizPerformance(data.quiz_scores, topic.topic)
      const studyConsistency = this.getStudyConsistency(data.topics_studied, topic.topic)
      
      // Weight quiz performance more heavily
      const masteryScore = (quizPerformance * 0.7) + (studyConsistency * 0.3)
      mastery[`${topic.subject}|${topic.topic}`] = Math.min(100, Math.max(0, masteryScore))
    }

    return mastery
  }

  /**
   * Private helper methods
   */
  private async saveToDatabase(userId: string, dataType: keyof LearningData, data: any): Promise<void> {
    // This would save to your database (Supabase, etc.)
    try {
      const response = await fetch('/api/pro/learning-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          dataType,
          data
        })
      })

      if (!response.ok) {
        console.error('Failed to save learning data:', await response.text())
      }
    } catch (error) {
      console.error('Error saving learning data:', error)
    }
  }

  private async getUserData(userId: string, timeRange?: 'week' | 'month' | 'quarter' | 'year'): Promise<LearningData> {
    // This would fetch from your database
    // For now, return cached data
    return this.data
  }

  private groupByTopic(answers: any[]): Record<string, any[]> {
    return answers.reduce((groups, answer) => {
      const key = `${answer.topic}|${answer.subject}`
      groups[key] = groups[key] || []
      groups[key].push(answer)
      return groups
    }, {})
  }

  private getTotalAttempts(quizzes: any[], topic: string, subject: string): number {
    return quizzes
      .filter(q => q.topic === topic && q.subject === subject)
      .reduce((total, q) => total + q.totalQuestions, 0)
  }

  private countOccurrences(arr: number[]): Record<number, number> {
    return arr.reduce((counts: Record<number, number>, item) => {
      counts[item] = (counts[item] || 0) + 1
      return counts
    }, {})
  }

  private calculateMethodEffectiveness(data: LearningData): Record<string, number> {
    const methods = ['chat', 'quiz', 'flashcards', 'practice', 'scan']
    const effectiveness: Record<string, number> = {}

    for (const method of methods) {
      const methodData = data.topics_studied.filter(t => t.studyMethod === method)
      const avgMastery = methodData.length > 0
        ? methodData.reduce((sum, t) => sum + t.masteryLevel, 0) / methodData.length
        : 0
      effectiveness[method] = avgMastery
    }

    return effectiveness
  }

  private calculateDifficultyProgression(data: LearningData): Record<string, number> {
    const difficulties = ['easy', 'medium', 'hard']
    const progression: Record<string, number> = {}

    for (const difficulty of difficulties) {
      const quizzes = data.quiz_scores.filter(q => q.difficulty === difficulty)
      const avgScore = quizzes.length > 0
        ? quizzes.reduce((sum, q) => sum + (q.score / q.totalQuestions) * 100, 0) / quizzes.length
        : 0
      progression[difficulty] = avgScore
    }

    return progression
  }

  private calculateSubjectTime(data: LearningData): Record<string, number> {
    const subjectTime: Record<string, number> = {}

    for (const session of data.study_sessions) {
      for (const subject of session.subjects) {
        subjectTime[subject] = (subjectTime[subject] || 0) + session.duration
      }
    }

    return subjectTime
  }

  private getTopicQuizPerformance(quizzes: any[], topic: string): number {
    const topicQuizzes = quizzes.filter(q => q.topic === topic)
    if (topicQuizzes.length === 0) return 50 // Default

    const avgScore = topicQuizzes.reduce((sum, q) => {
      return sum + ((q.score / q.totalQuestions) * 100)
    }, 0) / topicQuizzes.length

    return avgScore
  }

  private getStudyConsistency(topics: any[], topic: string): number {
    const topicStudies = topics.filter(t => t.topic === topic)
    if (topicStudies.length === 0) return 50 // Default

    // Calculate consistency based on frequency and recency
    const now = new Date().getTime()
    const recentStudies = topicStudies.filter(t => 
      (now - new Date(t.timestamp).getTime()) < (7 * 24 * 60 * 60 * 1000) // Last 7 days
    )

    const consistencyScore = Math.min(100, (recentStudies.length / 3) * 100) // 3+ studies per week is 100%
    return consistencyScore
  }
}

/**
 * React hook for learning data tracking
 */
export function useLearningDataTracker(userId: string) {
  const tracker = LearningDataTracker.getInstance()

  const trackScannedTopic = (topic: string, subject: string, confidence: number) => {
    return tracker.trackScannedTopic(userId, topic, subject, confidence)
  }

  const trackQuizScore = (
    quizId: string,
    topic: string,
    subject: string,
    score: number,
    totalQuestions: number,
    difficulty: string
  ) => {
    return tracker.trackQuizScore(userId, quizId, topic, subject, score, totalQuestions, difficulty)
  }

  const trackIncorrectAnswer = (
    questionId: string,
    topic: string,
    subject: string,
    concept: string,
    userAnswer: string,
    correctAnswer: string,
    difficulty: string
  ) => {
    return tracker.trackIncorrectAnswer(userId, questionId, topic, subject, concept, userAnswer, correctAnswer, difficulty)
  }

  const trackTopicStudy = (
    topic: string,
    subject: string,
    studyMethod: 'chat' | 'quiz' | 'flashcards' | 'practice' | 'scan',
    duration: number,
    masteryLevel: number
  ) => {
    return tracker.trackTopicStudy(userId, topic, subject, studyMethod, duration, masteryLevel)
  }

  const trackStudySession = (
    sessionId: string,
    startTime: string,
    endTime: string,
    topics: string[],
    subjects: string[],
    activities: string[],
    performanceScore?: number
  ) => {
    return tracker.trackStudySession(userId, sessionId, startTime, endTime, topics, subjects, activities, performanceScore)
  }

  const getWeakSpots = (timeRange?: 'week' | 'month' | 'quarter' | 'year') => {
    return tracker.getWeakSpots(userId, timeRange)
  }

  const getLearningPatterns = () => {
    return tracker.getLearningPatterns(userId)
  }

  const getTopicMastery = () => {
    return tracker.getTopicMastery(userId)
  }

  return {
    trackScannedTopic,
    trackQuizScore,
    trackIncorrectAnswer,
    trackTopicStudy,
    trackStudySession,
    getWeakSpots,
    getLearningPatterns,
    getTopicMastery
  }
}
