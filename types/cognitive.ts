// Core Cognitive Profile Types for Brainy Cognitive Training Platform

export interface ThinkingFingerprint {
  id: string
  user_id: string
  created_at: string
  updated_at: string
  
  // Core Cognitive Dimensions
  conceptMastery: ConceptMastery[]
  misconceptionPatterns: MisconceptionPattern[]
  confidenceAccuracyMismatch: ConfidenceAccuracyMismatch[]
  reasoningDepth: ReasoningDepthMetrics
  hintDependency: HintDependencyMetrics
  responseLatency: ResponseLatencyMetrics
  cognitiveEntryPoints: CognitiveEntryPoints
  
  // Meta-cognitive tracking
  thinkingGrowthTrajectory: ThinkingGrowthTrajectory
  cognitiveWeaknesses: CognitiveWeakness[]
  cognitiveStrengths: CognitiveStrength[]
  
  // Behavioral patterns
  avoidanceBehaviors: AvoidanceBehavior[]
  persistencePatterns: PersistencePattern[]
  metacognitiveAwareness: MetacognitiveAwareness
}

export interface ConceptMastery {
  domain: string
  concept: string
  masteryLevel: number // 0-100
  lastAssessed: string
  assessmentCount: number
  improvementTrajectory: number // negative = declining, positive = improving
  transferAbility: number // ability to apply to new contexts
}

export interface MisconceptionPattern {
  id: string
  patternType: 'overgeneralization' | 'false analogy' | 'procedural error' | 'conceptual gap' | 'misapplied rule'
  domains: string[]
  frequency: number // how often this occurs
  persistence: number // how resistant to correction
  lastOccurrence: string
  correctionAttempts: number
  effectivenessOfCorrections: number
}

export interface ConfidenceAccuracyMismatch {
  domain: string
  averageConfidence: number // 0-100
  averageAccuracy: number // 0-100
  mismatchScore: number // absolute difference
  pattern: 'overconfident' | 'underconfident' | 'well_calibrated'
  lastMeasured: string
}

export interface ReasoningDepthMetrics {
  averageDepth: number // 1-5 scale
  depthDistribution: Record<number, number> // count of each depth level
  preferredDepth: number // user's comfort zone
  depthProgression: number // improvement over time
  contextualDepth: Record<string, number> // depth by subject
}

export interface HintDependencyMetrics {
  hintRequestFrequency: number // hints per problem
  hintEffectiveness: number // improvement after hint
  timeToHint: number // avg time before requesting hint
  hintTypePreference: Record<string, number> // types of hints preferred
  independenceGrowth: number // reduction in dependency over time
}

export interface ResponseLatencyMetrics {
  averageResponseTime: number // in seconds
  responseTimeVariability: number // standard deviation
  thinkingTimeBeforeAnswer: number // time spent thinking
  quickAnswerFrequency: number // responses under 5 seconds
  deliberativeResponseFrequency: number // responses over 30 seconds
}

export interface CognitiveEntryPoints {
  preferredEntryPoints: {
    examples: number // preference 0-100
    visuals: number
    abstraction: number
    analogy: number
    procedural: number
    conceptual: number
  }
  entryPointEffectiveness: Record<string, number> // learning success by entry type
  adaptiveEntryPoints: Record<string, number> // what works best for each domain
}

export interface ThinkingGrowthTrajectory {
  overallGrowthRate: number
  domainGrowthRates: Record<string, number>
  criticalThinkingGrowth: number
  problemSolvingGrowth: number
  metacognitiveGrowth: number
  persistenceGrowth: number
}

export interface CognitiveWeakness {
  type: 'jumping_to_conclusions' | 'superficial_reasoning' | 'hint_seeking' | 'avoidance' | 'overconfidence'
  severity: number // 0-100
  domains: string[]
  lastManifestation: string
  improvementRate: number
}

export interface CognitiveStrength {
  type: 'persistence' | 'deep_reasoning' | 'pattern_recognition' | 'metacognition' | 'transfer_thinking'
  strength: number // 0-100
  domains: string[]
  lastDemonstrated: string
}

export interface AvoidanceBehavior {
  trigger: string // what triggers the avoidance
  behavior: 'abandon_problem' | 'request_hint' | 'switch_topic' | 'give_ambiguous_answer'
  frequency: number
  domains: string[]
  reductionRate: number
}

export interface PersistencePattern {
  averageTimeOnProblem: number
  problemAbandonmentRate: number
  helpSeekingThreshold: number // time before seeking help
  resilienceAfterFailure: number
  growthMindsetIndicators: number
}

export interface MetacognitiveAwareness {
  selfAssessmentAccuracy: number
  errorDetectionRate: number
  strategySelectionEffectiveness: number
  reflectionFrequency: number
  articulationClarity: number
}

export interface ThinkingGate {
  type: 'reasoning' | 'explanation' | 'confidence' | 'persistence' | 'assumption'
  passed: boolean
  requirement: string
  userResponse: string
  feedback: string
}

export interface CognitiveTrend {
  date: string
  value: number
  context: Record<string, any>
}

export interface CognitiveMetric {
  id: string
  name: string
  description: string
  currentValue: number
  targetValue: number
  unit: string
  trend: CognitiveTrend[]
  change: {
    value: number
    period: string
    direction: 'improving' | 'declining' | 'stable'
  }
  assessment: 'excellent' | 'good' | 'developing' | 'needs_attention'
  insights: string[]
}

export interface BehaviorPrinciple {
  id: string
  principle: string
  description: string
  enforcement: string
  antiPatterns: string[]
}

export interface BehaviorContractViolation {
  type: 'immediate_answer' | 'convenience_over_thinking' | 'hint_dependency' | 'confidence_mismatch' | 'surface_level_response'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  correction: string
  cognitiveImpact: string
}

// AI Constraint Types
export interface AIConstraint {
  id: string
  type: 'answer_refusal' | 'socratic_questioning' | 'hint_delay' | 'explanation_requirement' | 'confidence_challenge'
  trigger: string // when to apply
  parameters: Record<string, any>
  isActive: boolean
}

export interface CognitivePromptContext {
  userId: string
  thinkingFingerprint: ThinkingFingerprint
  currentMode: 'learn' | 'practice' | 'reflect' | 'review'
  domain: string
  currentProblem: string
  userHistory: UserInteractionHistory
  activeConstraints: AIConstraint[]
}

export interface UserInteractionHistory {
  recentResponses: UserResponse[]
  currentSessionStart: string
  problemsAttempted: number
  hintsRequested: number
  averageResponseTime: number
  confidenceLevels: number[]
}

export interface UserResponse {
  problemId: string
  response: string
  confidence: number
  timeToResponse: number
  hintsUsed: number
  correctness: number
  reasoningDepth: number
  timestamp: string
}

// Cognitive Metrics for Optimization
export interface CognitiveMetrics {
  // Primary metrics (what we optimize for)
  hintDependencyReduction: number
  reasoningDepthIncrease: number
  skillTransferRate: number
  articulationQuality: number
  longTermGrowth: number
  
  // Secondary metrics (what we track)
  engagementTime: number
  problemSolvingSpeed: number
  accuracyRate: number
  sessionFrequency: number
  
  // Anti-metrics (what we actively avoid optimizing)
  answerSpeed: number
  convenienceScore: number
  satisfactionRating: number
  userRetention: number
}
