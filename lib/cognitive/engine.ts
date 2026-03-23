import { createSupabaseClient } from '@/lib/supabase/client'
import type { 
  ThinkingFingerprint, 
  CognitivePromptContext, 
  UserResponse, 
  AIConstraint,
  CognitiveMetrics
} from '@/types/cognitive'

export class CognitiveProfileEngine {
  private static instance: CognitiveProfileEngine
  private supabase = createSupabaseClient()

  static getInstance(): CognitiveProfileEngine {
    if (!CognitiveProfileEngine.instance) {
      CognitiveProfileEngine.instance = new CognitiveProfileEngine()
    }
    return CognitiveProfileEngine.instance
  }

  // Get or create user's thinking fingerprint
  async getThinkingFingerprint(userId: string): Promise<ThinkingFingerprint> {
    const { data, error } = await this.supabase
      .from('thinking_fingerprints')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code === 'PGRST116') {
      // Create new fingerprint
      return await this.createThinkingFingerprint(userId)
    }

    if (error) throw error
    return data
  }

  // Create new thinking fingerprint for user
  private async createThinkingFingerprint(userId: string): Promise<ThinkingFingerprint> {
    const newFingerprint: Omit<ThinkingFingerprint, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      conceptMastery: [],
      misconceptionPatterns: [],
      confidenceAccuracyMismatch: [],
      reasoningDepth: {
        averageDepth: 2.0,
        depthDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        preferredDepth: 2,
        depthProgression: 0,
        contextualDepth: {}
      },
      hintDependency: {
        hintRequestFrequency: 0,
        hintEffectiveness: 0,
        timeToHint: 0,
        hintTypePreference: {},
        independenceGrowth: 0
      },
      responseLatency: {
        averageResponseTime: 0,
        responseTimeVariability: 0,
        thinkingTimeBeforeAnswer: 0,
        quickAnswerFrequency: 0,
        deliberativeResponseFrequency: 0
      },
      cognitiveEntryPoints: {
        preferredEntryPoints: {
          examples: 50,
          visuals: 50,
          abstraction: 50,
          analogy: 50,
          procedural: 50,
          conceptual: 50
        },
        entryPointEffectiveness: {},
        adaptiveEntryPoints: {}
      },
      thinkingGrowthTrajectory: {
        overallGrowthRate: 0,
        domainGrowthRates: {},
        criticalThinkingGrowth: 0,
        problemSolvingGrowth: 0,
        metacognitiveGrowth: 0,
        persistenceGrowth: 0
      },
      cognitiveWeaknesses: [],
      cognitiveStrengths: [],
      avoidanceBehaviors: [],
      persistencePatterns: [{
        averageTimeOnProblem: 0,
        problemAbandonmentRate: 0,
        helpSeekingThreshold: 0,
        resilienceAfterFailure: 0,
        growthMindsetIndicators: 0
      }],
      metacognitiveAwareness: {
        selfAssessmentAccuracy: 50,
        errorDetectionRate: 0,
        strategySelectionEffectiveness: 0,
        reflectionFrequency: 0,
        articulationClarity: 50
      }
    }

    const { data, error } = await this.supabase
      .from('thinking_fingerprints')
      .insert(newFingerprint)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Update thinking fingerprint based on user interaction
  async updateFromInteraction(
    userId: string, 
    response: UserResponse, 
    domain: string
  ): Promise<ThinkingFingerprint> {
    const fingerprint = await this.getThinkingFingerprint(userId)
    
    // Update reasoning depth
    this.updateReasoningDepth(fingerprint, response.reasoningDepth, domain)
    
    // Update response latency
    this.updateResponseLatency(fingerprint, response.timeToResponse)
    
    // Update hint dependency
    this.updateHintDependency(fingerprint, response.hintsUsed)
    
    // Update confidence-accuracy mismatch
    this.updateConfidenceAccuracy(fingerprint, response.confidence, response.correctness, domain)
    
    // Update concept mastery
    await this.updateConceptMastery(fingerprint, domain, response.correctness)
    
    // Detect and update misconception patterns
    await this.detectMisconceptionPatterns(fingerprint, response, domain)
    
    // Update metacognitive awareness
    this.updateMetacognitiveAwareness(fingerprint, response)
    
    // Save updated fingerprint
    const { data, error } = await this.supabase
      .from('thinking_fingerprints')
      .update({
        ...fingerprint,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Generate AI constraints based on cognitive profile
  async generateAIConstraints(fingerprint: ThinkingFingerprint): Promise<AIConstraint[]> {
    const constraints: AIConstraint[] = []

    // Answer refusal constraints for users with high hint dependency
    if (fingerprint.hintDependency.hintRequestFrequency > 0.3) {
      constraints.push({
        id: 'answer_refusal',
        type: 'answer_refusal',
        trigger: 'before_solution',
        parameters: {
          requireUserAttempt: true,
          minimumReasoningDepth: 3,
          forceExplanation: true
        },
        isActive: true
      })
    }

    // Confidence challenge for overconfident users
    const overconfidentDomains = fingerprint.confidenceAccuracyMismatch
      .filter(m => m.pattern === 'overconfident' && m.mismatchScore > 30)
    
    if (overconfidentDomains.length > 0) {
      constraints.push({
        id: 'confidence_challenge',
        type: 'confidence_challenge',
        trigger: 'high_confidence_response',
        parameters: {
          domains: overconfidentDomains.map(m => m.domain),
          requireExplanation: true,
          askForReasoning: true
        },
        isActive: true
      })
    }

    // Socratic questioning for superficial reasoning
    if (fingerprint.reasoningDepth.averageDepth < 2.5) {
      constraints.push({
        id: 'socratic_questioning',
        type: 'socratic_questioning',
        trigger: 'superficial_response',
        parameters: {
          minimumQuestions: 2,
          probeAssumptions: true,
          requireEvidence: true
        },
        isActive: true
      })
    }

    // Hint delay for users with high hint dependency
    if (fingerprint.hintDependency.hintRequestFrequency > 0.5) {
      constraints.push({
        id: 'hint_delay',
        type: 'hint_delay',
        trigger: 'hint_request',
        parameters: {
          delaySeconds: 30,
          requireThinkingEffort: true,
          forceAlternativeApproach: true
        },
        isActive: true
      })
    }

    return constraints
  }

  // Create cognitive context for AI prompt generation
  async createCognitiveContext(
    userId: string,
    mode: 'learn' | 'practice' | 'reflect' | 'review',
    domain: string,
    currentProblem: string
  ): Promise<CognitivePromptContext> {
    const fingerprint = await this.getThinkingFingerprint(userId)
    const constraints = await this.generateAIConstraints(fingerprint)
    
    // Get recent interaction history
    const userHistory = await this.getRecentInteractionHistory(userId)

    return {
      userId,
      thinkingFingerprint: fingerprint,
      currentMode: mode,
      domain,
      currentProblem,
      userHistory,
      activeConstraints: constraints
    }
  }

  // Calculate cognitive metrics for optimization tracking
  async calculateCognitiveMetrics(userId: string): Promise<CognitiveMetrics> {
    const fingerprint = await this.getThinkingFingerprint(userId)
    
    return {
      // Primary metrics (what we optimize for)
      hintDependencyReduction: Math.max(0, 100 - fingerprint.hintDependency.hintRequestFrequency * 100),
      reasoningDepthIncrease: fingerprint.reasoningDepth.averageDepth * 20,
      skillTransferRate: this.calculateTransferRate(fingerprint),
      articulationQuality: fingerprint.metacognitiveAwareness.articulationClarity,
      longTermGrowth: fingerprint.thinkingGrowthTrajectory.overallGrowthRate * 10,
      
      // Secondary metrics (what we track but don't optimize)
      engagementTime: 0, // Would be calculated from session data
      problemSolvingSpeed: fingerprint.responseLatency.averageResponseTime,
      accuracyRate: this.calculateOverallAccuracy(fingerprint),
      sessionFrequency: 0, // Would be calculated from session data
      
      // Anti-metrics (what we actively avoid optimizing)
      answerSpeed: 0, // We don't track this as it encourages quick answers
      convenienceScore: 0, // We actively avoid convenience
      satisfactionRating: 0, // We don't optimize for satisfaction
      userRetention: 0 // We don't optimize for retention at expense of learning
    }
  }

  // Private helper methods
  private updateReasoningDepth(fingerprint: ThinkingFingerprint, depth: number, domain: string) {
    fingerprint.reasoningDepth.averageDepth = 
      (fingerprint.reasoningDepth.averageDepth + depth) / 2
    fingerprint.reasoningDepth.depthDistribution[depth] = 
      (fingerprint.reasoningDepth.depthDistribution[depth] || 0) + 1
    fingerprint.reasoningDepth.contextualDepth[domain] = depth
  }

  private updateResponseLatency(fingerprint: ThinkingFingerprint, responseTime: number) {
    const current = fingerprint.responseLatency.averageResponseTime
    fingerprint.responseLatency.averageResponseTime = current > 0 ? (current + responseTime) / 2 : responseTime
    
    if (responseTime < 5) {
      fingerprint.responseLatency.quickAnswerFrequency++
    } else if (responseTime > 30) {
      fingerprint.responseLatency.deliberativeResponseFrequency++
    }
  }

  private updateHintDependency(fingerprint: ThinkingFingerprint, hintsUsed: number) {
    const current = fingerprint.hintDependency.hintRequestFrequency
    fingerprint.hintDependency.hintRequestFrequency = (current + hintsUsed) / 2
  }

  private updateConfidenceAccuracy(
    fingerprint: ThinkingFingerprint, 
    confidence: number, 
    accuracy: number, 
    domain: string
  ) {
    let domainMismatch = fingerprint.confidenceAccuracyMismatch.find(m => m.domain === domain)
    
    if (!domainMismatch) {
      domainMismatch = {
        domain,
        averageConfidence: confidence,
        averageAccuracy: accuracy,
        mismatchScore: Math.abs(confidence - accuracy),
        pattern: confidence > accuracy ? 'overconfident' : confidence < accuracy ? 'underconfident' : 'well_calibrated',
        lastMeasured: new Date().toISOString()
      }
      fingerprint.confidenceAccuracyMismatch.push(domainMismatch)
    } else {
      domainMismatch.averageConfidence = (domainMismatch.averageConfidence + confidence) / 2
      domainMismatch.averageAccuracy = (domainMismatch.averageAccuracy + accuracy) / 2
      domainMismatch.mismatchScore = Math.abs(domainMismatch.averageConfidence - domainMismatch.averageAccuracy)
      domainMismatch.lastMeasured = new Date().toISOString()
    }
  }

  private async updateConceptMastery(
    fingerprint: ThinkingFingerprint, 
    domain: string, 
    correctness: number
  ) {
    let mastery = fingerprint.conceptMastery.find(m => m.domain === domain)
    
    if (!mastery) {
      mastery = {
        domain,
        concept: domain, // For now, use domain as concept
        masteryLevel: correctness * 100,
        lastAssessed: new Date().toISOString(),
        assessmentCount: 1,
        improvementTrajectory: 0,
        transferAbility: 50
      }
      fingerprint.conceptMastery.push(mastery)
    } else {
      const oldLevel = mastery.masteryLevel
      mastery.masteryLevel = (oldLevel + correctness * 100) / 2
      mastery.improvementTrajectory = mastery.masteryLevel - oldLevel
      mastery.lastAssessed = new Date().toISOString()
      mastery.assessmentCount++
    }
  }

  private async detectMisconceptionPatterns(
    fingerprint: ThinkingFingerprint, 
    response: UserResponse, 
    domain: string
  ) {
    // This would analyze the response content for misconception patterns
    // For now, it's a placeholder for the misconception detection algorithm
    if (response.correctness < 0.5 && response.confidence > 0.7) {
      // Potential misconception: high confidence but low accuracy
      const existingPattern = fingerprint.misconceptionPatterns.find(
        p => p.patternType === 'overgeneralization' && p.domains.includes(domain)
      )
      
      if (existingPattern) {
        existingPattern.frequency++
        existingPattern.lastOccurrence = new Date().toISOString()
      } else {
        fingerprint.misconceptionPatterns.push({
          id: Math.random().toString(36).substr(2, 9),
          patternType: 'overgeneralization',
          domains: [domain],
          frequency: 1,
          persistence: 0.5,
          lastOccurrence: new Date().toISOString(),
          correctionAttempts: 0,
          effectivenessOfCorrections: 0
        })
      }
    }
  }

  private updateMetacognitiveAwareness(fingerprint: ThinkingFingerprint, response: UserResponse) {
    // Update self-assessment accuracy based on confidence vs actual correctness
    const accuracyGap = Math.abs(response.confidence - response.correctness)
    const currentAccuracy = fingerprint.metacognitiveAwareness.selfAssessmentAccuracy
    fingerprint.metacognitiveAwareness.selfAssessmentAccuracy = 
      (currentAccuracy + (100 - accuracyGap * 100)) / 2
  }

  private async getRecentInteractionHistory(userId: string) {
    // This would fetch recent user interactions from the database
    // For now, return placeholder data
    return {
      recentResponses: [],
      currentSessionStart: new Date().toISOString(),
      problemsAttempted: 0,
      hintsRequested: 0,
      averageResponseTime: 0,
      confidenceLevels: []
    }
  }

  private calculateTransferRate(fingerprint: ThinkingFingerprint): number {
    // Calculate how well concepts transfer across domains
    const masteryLevels = fingerprint.conceptMastery.map(m => m.masteryLevel)
    return masteryLevels.length > 0 ? masteryLevels.reduce((a, b) => a + b, 0) / masteryLevels.length : 50
  }

  private calculateOverallAccuracy(fingerprint: ThinkingFingerprint): number {
    return fingerprint.conceptMastery.length > 0 
      ? fingerprint.conceptMastery.reduce((sum, m) => sum + m.masteryLevel, 0) / fingerprint.conceptMastery.length
      : 50
  }
}
