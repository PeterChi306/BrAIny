import { SpacedRepetitionCard } from '@/types/learning-plans'

export class SpacedRepetitionEngine {
  private static readonly INITIAL_EASINESS = 2.5
  private static readonly MIN_EASINESS = 1.3
  private static readonly MAX_EASINESS = 4.0
  private static readonly INITIAL_INTERVAL = 1

  /**
   * Calculate the next review interval based on performance
   * Uses the SM-2 algorithm (SuperMemo 2)
   */
  static calculateNextReview(
    card: SpacedRepetitionCard,
    quality: number // 0-5 scale: 0=total blackout, 5=perfect response
  ): {
    easinessFactor: number
    intervalDays: number
    repetitionCount: number
    masteryLevel: number
  } {
    let easinessFactor = card.easiness_factor || this.INITIAL_EASINESS
    let intervalDays = card.interval_days || this.INITIAL_INTERVAL
    let repetitionCount = card.repetition_count || 0

    // Update easiness factor
    easinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    easinessFactor = Math.max(this.MIN_EASINESS, Math.min(this.MAX_EASINESS, easinessFactor))

    // Calculate new interval and repetition count
    if (quality < 3) {
      // Reset to first interval if quality is poor
      intervalDays = this.INITIAL_INTERVAL
      repetitionCount = 0
    } else {
      repetitionCount += 1
      
      if (repetitionCount === 1) {
        intervalDays = this.INITIAL_INTERVAL
      } else if (repetitionCount === 2) {
        intervalDays = 6
      } else {
        intervalDays = Math.round(intervalDays * easinessFactor)
      }
    }

    // Calculate mastery level (0-100)
    const masteryLevel = this.calculateMasteryLevel(repetitionCount, easinessFactor, quality)

    return {
      easinessFactor,
      intervalDays,
      repetitionCount,
      masteryLevel
    }
  }

  /**
   * Calculate mastery level based on repetition history
   */
  private static calculateMasteryLevel(
    repetitionCount: number,
    easinessFactor: number,
    lastQuality: number
  ): number {
    // Base mastery from repetition count
    let mastery = Math.min(100, repetitionCount * 10)
    
    // Adjust based on easiness factor (higher easiness = better mastery)
    mastery += (easinessFactor - this.INITIAL_EASINESS) * 10
    
    // Adjust based on last performance
    mastery += (lastQuality - 3) * 5
    
    return Math.max(0, Math.min(100, mastery))
  }

  /**
   * Get cards due for review today
   */
  static getDueCards(cards: SpacedRepetitionCard[]): SpacedRepetitionCard[] {
    const today = new Date().toISOString().split('T')[0]
    return cards.filter(card => 
      card.next_review_date <= today || card.mastery_level < 80
    )
  }

  /**
   * Get cards for new learning (priority: low mastery first)
   */
  static getNewCards(cards: SpacedRepetitionCard[], limit: number = 10): SpacedRepetitionCard[] {
    return cards
      .filter(card => card.repetition_count === 0)
      .sort((a, b) => a.mastery_level - b.mastery_level)
      .slice(0, limit)
  }

  /**
   * Get cards for review (priority: due date, then mastery level)
   */
  static getReviewCards(cards: SpacedRepetitionCard[], limit: number = 20): SpacedRepetitionCard[] {
    const today = new Date().toISOString().split('T')[0]
    
    return cards
      .filter(card => card.next_review_date <= today && card.repetition_count > 0)
      .sort((a, b) => {
        // First sort by due date (overdue cards first)
        const aOverdue = new Date(a.next_review_date).getTime() - new Date(today).getTime()
        const bOverdue = new Date(b.next_review_date).getTime() - new Date(today).getTime()
        
        if (aOverdue !== bOverdue) {
          return aOverdue - bOverdue
        }
        
        // Then by mastery level (lower mastery first)
        return a.mastery_level - b.mastery_level
      })
      .slice(0, limit)
  }

  /**
   * Generate a study session with optimal card selection
   */
  static generateStudySession(
    cards: SpacedRepetitionCard[],
    sessionLength: number = 15 // minutes
  ): {
    newCards: SpacedRepetitionCard[]
    reviewCards: SpacedRepetitionCard[]
    totalCards: number
    estimatedTime: number
  } {
    // Estimate 30 seconds per new card, 15 seconds per review card
    const newCardTime = 0.5 // minutes
    const reviewCardTime = 0.25 // minutes
    
    // Get available cards
    const availableNewCards = this.getNewCards(cards, 50)
    const availableReviewCards = this.getReviewCards(cards, 50)
    
    // Calculate optimal distribution (70% review, 30% new)
    const reviewTime = sessionLength * 0.7
    const newTime = sessionLength * 0.3
    
    const maxNewCards = Math.floor(newTime / newCardTime)
    const maxReviewCards = Math.floor(reviewTime / reviewCardTime)
    
    const newCards = availableNewCards.slice(0, maxNewCards)
    const reviewCards = availableReviewCards.slice(0, maxReviewCards)
    
    return {
      newCards,
      reviewCards,
      totalCards: newCards.length + reviewCards.length,
      estimatedTime: (newCards.length * newCardTime) + (reviewCards.length * reviewCardTime)
    }
  }

  /**
   * Calculate optimal study schedule
   */
  static calculateStudySchedule(cards: SpacedRepetitionCard[]): {
    today: number
    tomorrow: number
    thisWeek: number
    nextWeek: number
    recommendations: string[]
  } {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const thisWeekEnd = new Date(today)
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 7)
    
    const nextWeekEnd = new Date(today)
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 14)
    
    const todayStr = today.toISOString().split('T')[0]
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    
    const dueToday = cards.filter(card => card.next_review_date <= todayStr).length
    const dueTomorrow = cards.filter(card => 
      card.next_review_date === tomorrowStr || 
      (card.next_review_date <= todayStr && card.mastery_level < 70)
    ).length
    const dueThisWeek = cards.filter(card => 
      new Date(card.next_review_date) <= thisWeekEnd
    ).length
    const dueNextWeek = cards.filter(card => 
      new Date(card.next_review_date) <= nextWeekEnd
    ).length
    
    const recommendations: string[] = []
    
    if (dueToday > 20) {
      recommendations.push('You have many cards due today. Consider breaking this into multiple sessions.')
    } else if (dueToday < 5) {
      recommendations.push('Few cards due today. Consider learning some new cards.')
    }
    
    if (dueTomorrow > 15) {
      recommendations.push('Tomorrow will be busy. Consider studying some cards today to reduce tomorrow\'s load.')
    }
    
    const lowMasteryCards = cards.filter(card => card.mastery_level < 50).length
    if (lowMasteryCards > 10) {
      recommendations.push('Focus on cards with low mastery to strengthen your foundation.')
    }
    
    return {
      today: dueToday,
      tomorrow: dueTomorrow,
      thisWeek: dueThisWeek,
      nextWeek: dueNextWeek,
      recommendations
    }
  }

  /**
   * Analyze learning patterns and provide insights
   */
  static analyzeLearningPatterns(cards: SpacedRepetitionCard[]): {
    averageEasinessFactor: number
    averageMasteryLevel: number
    strugglingCards: SpacedRepetitionCard[]
    masteredCards: SpacedRepetitionCard[]
    insights: string[]
  } {
    if (cards.length === 0) {
      return {
        averageEasinessFactor: 0,
        averageMasteryLevel: 0,
        strugglingCards: [],
        masteredCards: [],
        insights: ['No cards available for analysis.']
      }
    }
    
    const avgEasiness = cards.reduce((sum, card) => sum + card.easiness_factor, 0) / cards.length
    const avgMastery = cards.reduce((sum, card) => sum + card.mastery_level, 0) / cards.length
    
    const strugglingCards = cards.filter(card => 
      card.easiness_factor < 2.0 || card.mastery_level < 30
    )
    
    const masteredCards = cards.filter(card => card.mastery_level >= 90)
    
    const insights: string[] = []
    
    if (avgEasiness < 2.0) {
      insights.push('Your average easiness factor is low. Consider spending more time on difficult concepts.')
    } else if (avgEasiness > 3.0) {
      insights.push('Your average easiness factor is high. You might benefit from more challenging material.')
    }
    
    if (avgMastery < 50) {
      insights.push('Your average mastery level is below 50%. Focus on reviewing difficult cards.')
    } else if (avgMastery > 80) {
      insights.push('Great job! Your average mastery level is above 80%. Keep up the good work!')
    }
    
    if (strugglingCards.length > cards.length * 0.3) {
      insights.push('Many cards are struggling. Consider reviewing the fundamentals.')
    }
    
    if (masteredCards.length > cards.length * 0.5) {
      insights.push('Excellent progress! More than half your cards are mastered.')
    }
    
    return {
      averageEasinessFactor: avgEasiness,
      averageMasteryLevel: avgMastery,
      strugglingCards,
      masteredCards,
      insights
    }
  }

  /**
   * Quality rating helper for user responses
   */
  static getQualityFromResponse(
    responseTime: number, // in seconds
    wasCorrect: boolean,
    hesitated: boolean,
    neededHint: boolean
  ): number {
    let quality = 3 // Default quality
    
    if (wasCorrect && !hesitated && !neededHint) {
      // Perfect response
      if (responseTime < 5) {
        quality = 5
      } else if (responseTime < 10) {
        quality = 4
      } else {
        quality = 3
      }
    } else if (wasCorrect && (hesitated || neededHint)) {
      // Correct but with difficulty
      quality = 3
    } else if (!wasCorrect && !neededHint) {
      // Incorrect but tried
      quality = 2
    } else if (!wasCorrect && neededHint) {
      // Incorrect and needed help
      quality = 1
    } else {
      // Total blackout
      quality = 0
    }
    
    return quality
  }

  /**
   * Create a new spaced repetition card
   */
  static createCard(
    userId: string,
    goalId: string,
    frontText: string,
    backText: string,
    conceptTags: string[] = []
  ): Omit<SpacedRepetitionCard, 'id' | 'created_at' | 'updated_at'> {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return {
      user_id: userId,
      goal_id: goalId,
      front_text: frontText,
      back_text: backText,
      concept_tags: conceptTags,
      easiness_factor: this.INITIAL_EASINESS,
      repetition_count: 0,
      interval_days: this.INITIAL_INTERVAL,
      next_review_date: tomorrow.toISOString().split('T')[0],
      last_reviewed_at: undefined,
      performance_history: [],
      mastery_level: 0
    }
  }
}
