/**
 * 🧠 Learning Feedback System
 * 
 * Tracks user responses to measure understanding and improve learning intelligence
 */

import { learningIntelligence } from './learning-intelligence'

export interface LearningFeedback {
  messageId: string
  userId: string
  subject: string
  topic: string
  subtopic: string
  feedback: {
    understood: boolean
    confidence: number
    timeSpent: number
    askedQuestions: boolean
    requestedSimpler: boolean
    requestedExample: boolean
    completedQuiz: boolean
    quizScore?: number
  }
  timestamp: Date
}

export class LearningFeedbackSystem {
  private feedbackHistory: Map<string, LearningFeedback[]> = new Map()

  /**
   * 📊 Track learning feedback from user interaction
   */
  trackFeedback(feedback: Omit<LearningFeedback, 'timestamp'>): void {
    const feedbackWithTimestamp: LearningFeedback = {
      ...feedback,
      timestamp: new Date()
    }

    // Store in history
    if (!this.feedbackHistory.has(feedback.userId)) {
      this.feedbackHistory.set(feedback.userId, [])
    }
    this.feedbackHistory.get(feedback.userId)!.push(feedbackWithTimestamp)

    // Update learning intelligence
    this.updateLearningIntelligence(feedback)
  }

  /**
   * 🧠 Update learning intelligence based on feedback
   */
  private updateLearningIntelligence(feedback: Omit<LearningFeedback, 'timestamp'>): void {
    const interactionType = feedback.feedback.understood ? 'correct' : 'incorrect'
    const needsHelp = feedback.feedback.askedQuestions || feedback.feedback.requestedSimpler

    learningIntelligence.trackInteraction(
      feedback.userId,
      feedback.subject,
      feedback.topic,
      feedback.subtopic,
      {
        type: interactionType,
        confidence: feedback.feedback.confidence,
        responseTime: feedback.feedback.timeSpent,
        needsHelp: needsHelp
      }
    )
  }

  /**
   * 📈 Get learning progress metrics
   */
  getProgressMetrics(userId: string): {
    overallImprovement: number
    subjectProgress: Record<string, number>
    recentTrend: 'improving' | 'declining' | 'stable'
    totalInteractions: number
    understandingRate: number
  } {
    const feedback = this.feedbackHistory.get(userId) || []
    const recent = feedback.slice(-20)
    const older = feedback.slice(-40, -20)

    // Calculate overall improvement
    const recentAvg = recent.reduce((sum, f) => sum + f.feedback.confidence, 0) / (recent.length || 1)
    const olderAvg = older.reduce((sum, f) => sum + f.feedback.confidence, 0) / (older.length || 1)
    const overallImprovement = ((recentAvg - olderAvg) / olderAvg) * 100

    // Calculate subject progress
    const subjectProgress: Record<string, number> = {}
    feedback.forEach(f => {
      if (!subjectProgress[f.subject]) {
        subjectProgress[f.subject] = 0
      }
      subjectProgress[f.subject] += f.feedback.confidence
    })

    // Calculate averages for each subject
    const subjectCounts: Record<string, number> = {}
    feedback.forEach(f => {
      subjectCounts[f.subject] = (subjectCounts[f.subject] || 0) + 1
    })

    Object.keys(subjectProgress).forEach(subject => {
      subjectProgress[subject] = subjectProgress[subject] / subjectCounts[subject]
    })

    // Determine trend
    let trend: 'improving' | 'declining' | 'stable' = 'stable'
    if (recentAvg > olderAvg + 0.1) trend = 'improving'
    else if (recentAvg < olderAvg - 0.1) trend = 'declining'

    // Calculate understanding rate
    const understandingRate = feedback.filter(f => f.feedback.understood).length / (feedback.length || 1)

    return {
      overallImprovement,
      subjectProgress,
      recentTrend: trend,
      totalInteractions: feedback.length,
      understandingRate
    }
  }

  /**
   * 🎯 Get recommended focus areas
   */
  getRecommendedFocus(userId: string): string[] {
    const diagnosis = learningIntelligence.diagnose(userId)
    return diagnosis.recommendedFocus
  }

  /**
   * 📊 Get mastery visualization data
   */
  getMasteryVisualization(userId: string): {
    concepts: Array<{
      name: string
      mastery: number
      trend: string
      lastUpdated: Date
    }>
    overallProgress: number
  } {
    const masteryScores = learningIntelligence.getMasteryScores(userId)
    
    const concepts = masteryScores.map(score => ({
      name: score.concept,
      mastery: score.score,
      trend: score.trend,
      lastUpdated: score.lastUpdated
    }))

    const overallProgress = concepts.reduce((sum, c) => sum + c.mastery, 0) / (concepts.length || 1)

    return {
      concepts,
      overallProgress
    }
  }
}

export const learningFeedbackSystem = new LearningFeedbackSystem()
