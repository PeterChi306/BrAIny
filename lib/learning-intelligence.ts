/**
 * 🧠 Learning Intelligence System
 * 
 * This is NOT a chatbot wrapper.
 * This is a learning intelligence system that:
 * • Remembers
 * • Diagnoses  
 * • Adapts
 * • Measures improvement
 * • Motivates
 * • Proves progress
 */

export interface WeakSpot {
  subject: string
  topic: string
  subtopic: string
  mistakeFrequency: number
  clarificationRequests: number
  avgResponseConfidence: number
  avgTimeToUnderstand: number
  lastEncounter: Date
  masteryLevel: number
}

export interface LearningProfile {
  userId: string
  weakSpots: WeakSpot[]
  strengths: WeakSpot[]
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed'
  interests: string[]
  currentStreak: number
  longestStreak: number
  totalStudyTime: number
  conceptsMastered: string[]
  improvementRate: number
}

export interface MasteryScore {
  concept: string
  score: number
  trend: 'improving' | 'declining' | 'stable'
  lastUpdated: Date
  factors: {
    correctResponses: number
    followUpPerformance: number
    retentionScore: number
    confusionEvents: number
  }
}

export interface DiagnosticResult {
  currentWeaknesses: WeakSpot[]
  emergingPatterns: string[]
  recommendedFocus: string[]
  confidenceLevel: number
  learningVelocity: number
}

export class LearningIntelligence {
  private profiles: Map<string, LearningProfile> = new Map()
  private masteryScores: Map<string, MasteryScore[]> = new Map()

  /**
   * 🎯 Initialize or get user's learning profile
   */
  getProfile(userId: string): LearningProfile {
    if (!this.profiles.has(userId)) {
      this.profiles.set(userId, {
        userId,
        weakSpots: [],
        strengths: [],
        learningStyle: 'mixed',
        interests: [],
        currentStreak: 0,
        longestStreak: 0,
        totalStudyTime: 0,
        conceptsMastered: [],
        improvementRate: 0
      })
    }
    return this.profiles.get(userId)!
  }

  /**
   * 📊 Track learning interaction and update weak spots
   */
  trackInteraction(
    userId: string,
    subject: string,
    topic: string,
    subtopic: string,
    interaction: {
      type: 'correct' | 'incorrect' | 'clarification' | 'confused'
      confidence: number
      responseTime: number
      needsHelp: boolean
    }
  ): void {
    const profile = this.getProfile(userId)
    const key = `${subject}:${topic}:${subtopic}`
    
    let weakSpot = profile.weakSpots.find(ws => 
      ws.subject === subject && 
      ws.topic === topic && 
      ws.subtopic === subtopic
    )

    if (!weakSpot) {
      weakSpot = {
        subject,
        topic,
        subtopic,
        mistakeFrequency: 0,
        clarificationRequests: 0,
        avgResponseConfidence: 0,
        avgTimeToUnderstand: 0,
        lastEncounter: new Date(),
        masteryLevel: 50
      }
      profile.weakSpots.push(weakSpot)
    }

    // Update tracking data
    if (interaction.type === 'incorrect') {
      weakSpot.mistakeFrequency++
      weakSpot.masteryLevel = Math.max(0, weakSpot.masteryLevel - 10)
    } else if (interaction.type === 'correct') {
      weakSpot.masteryLevel = Math.min(100, weakSpot.masteryLevel + 5)
    }

    if (interaction.type === 'clarification' || interaction.needsHelp) {
      weakSpot.clarificationRequests++
      weakSpot.masteryLevel = Math.max(0, weakSpot.masteryLevel - 3)
    }

    // Update averages
    const totalInteractions = weakSpot.mistakeFrequency + weakSpot.clarificationRequests + 1
    weakSpot.avgResponseConfidence = 
      (weakSpot.avgResponseConfidence * (totalInteractions - 1) + interaction.confidence) / totalInteractions
    weakSpot.avgTimeToUnderstand = 
      (weakSpot.avgTimeToUnderstand * (totalInteractions - 1) + interaction.responseTime) / totalInteractions
    
    weakSpot.lastEncounter = new Date()

    // Update mastery score
    this.updateMasteryScore(userId, key, weakSpot)
  }

  /**
   * 📈 Update mastery score for a concept
   */
  private updateMasteryScore(userId: string, conceptKey: string, weakSpot: WeakSpot): void {
    if (!this.masteryScores.has(userId)) {
      this.masteryScores.set(userId, [])
    }

    const scores = this.masteryScores.get(userId)!
    let score = scores.find(s => s.concept === conceptKey)

    if (!score) {
      score = {
        concept: conceptKey,
        score: 50,
        trend: 'stable',
        lastUpdated: new Date(),
        factors: {
          correctResponses: 0,
          followUpPerformance: 0,
          retentionScore: 0,
          confusionEvents: 0
        }
      }
      scores.push(score)
    }

    // Calculate new mastery score
    const previousScore = score.score
    score.score = weakSpot.masteryLevel
    score.lastUpdated = new Date()
    
    // Update trend
    if (score.score > previousScore + 5) {
      score.trend = 'improving'
    } else if (score.score < previousScore - 5) {
      score.trend = 'declining'
    } else {
      score.trend = 'stable'
    }

    // Update factors
    score.factors.correctResponses = Math.max(0, 100 - weakSpot.mistakeFrequency * 10)
    score.factors.followUpPerformance = weakSpot.avgResponseConfidence
    score.factors.retentionScore = Math.max(0, 100 - weakSpot.clarificationRequests * 5)
    score.factors.confusionEvents = weakSpot.clarificationRequests
  }

  /**
   * 🔍 Diagnose current learning state
   */
  diagnose(userId: string): DiagnosticResult {
    const profile = this.getProfile(userId)
    const weakSpots = profile.weakSpots.filter(ws => ws.masteryLevel < 70)
    
    // Sort by severity (lowest mastery first)
    weakSpots.sort((a, b) => a.masteryLevel - b.masteryLevel)

    // Identify patterns
    const patterns = this.identifyPatterns(weakSpots)
    
    // Calculate confidence and velocity
    const avgConfidence = weakSpots.reduce((sum, ws) => sum + ws.avgResponseConfidence, 0) / (weakSpots.length || 1)
    const avgVelocity = weakSpots.reduce((sum, ws) => sum + (100 - ws.avgTimeToUnderstand), 0) / (weakSpots.length || 1)

    return {
      currentWeaknesses: weakSpots.slice(0, 5), // Top 5 weaknesses
      emergingPatterns: patterns,
      recommendedFocus: this.generateRecommendedFocus(weakSpots),
      confidenceLevel: avgConfidence,
      learningVelocity: avgVelocity
    }
  }

  /**
   * 🎯 Generate personalized learning recommendations
   */
  generateRecommendedFocus(weakSpots: WeakSpot[]): string[] {
    const recommendations: string[] = []
    
    // Group by subject
    const subjectGroups = weakSpots.reduce((groups, ws) => {
      if (!groups[ws.subject]) groups[ws.subject] = []
      groups[ws.subject].push(ws)
      return groups
    }, {} as Record<string, WeakSpot[]>)

    // Generate recommendations per subject
    Object.entries(subjectGroups).forEach(([subject, spots]) => {
      const avgMastery = spots.reduce((sum, ws) => sum + ws.masteryLevel, 0) / spots.length
      
      if (avgMastery < 40) {
        recommendations.push(`Focus on ${subject} fundamentals - multiple concepts need attention`)
      } else if (avgMastery < 60) {
        recommendations.push(`Strengthen ${subject} problem areas - ${spots[0]?.subtopic} needs practice`)
      } else {
        recommendations.push(`Refine ${subject} understanding - almost mastered!`)
      }
    })

    return recommendations.slice(0, 3)
  }

  /**
   * 🔍 Identify learning patterns
   */
  private identifyPatterns(weakSpots: WeakSpot[]): string[] {
    const patterns: string[] = []

    // Check for consistent low confidence
    const lowConfidence = weakSpots.filter(ws => ws.avgResponseConfidence < 0.5)
    if (lowConfidence.length > weakSpots.length / 2) {
      patterns.push("Low confidence across multiple topics - needs confidence building")
    }

    // Check for slow understanding
    const slowUnderstanding = weakSpots.filter(ws => ws.avgTimeToUnderstand > 80)
    if (slowUnderstanding.length > weakSpots.length / 2) {
      patterns.push("Takes longer to grasp concepts - needs more visual/experiential learning")
    }

    // Check for frequent clarification requests
    const highClarification = weakSpots.filter(ws => ws.clarificationRequests > 3)
    if (highClarification.length > 0) {
      patterns.push("Frequently asks for clarification - explanations need simplification")
    }

    return patterns
  }

  /**
   * 📊 Get mastery scores for a user
   */
  getMasteryScores(userId: string): MasteryScore[] {
    return this.masteryScores.get(userId) || []
  }

  /**
   * 🎯 Get top weaknesses to focus on
   */
  getTopWeaknesses(userId: string, limit: number = 3): WeakSpot[] {
    const profile = this.getProfile(userId)
    return profile.weakSpots
      .filter(ws => ws.masteryLevel < 70)
      .sort((a, b) => a.masteryLevel - b.masteryLevel)
      .slice(0, limit)
  }

  /**
   * 📈 Calculate improvement rate
   */
  calculateImprovementRate(userId: string): number {
    const scores = this.getMasteryScores(userId)
    if (scores.length < 2) return 0

    const recent = scores.slice(-10)
    const older = scores.slice(-20, -10)

    const recentAvg = recent.reduce((sum, s) => sum + s.score, 0) / recent.length
    const olderAvg = older.length > 0 ? older.reduce((sum, s) => sum + s.score, 0) / older.length : recentAvg

    return ((recentAvg - olderAvg) / olderAvg) * 100
  }
}

// Singleton instance
export const learningIntelligence = new LearningIntelligence()
