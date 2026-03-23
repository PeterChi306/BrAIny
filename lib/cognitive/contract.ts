import { CognitiveAIOrchestrator } from './orchestrator'
import { AnswerRefusalSystem } from './friction'
import type { CognitivePromptContext, AIConstraint, ThinkingFingerprint } from '@/types/cognitive'

export interface BehaviorContractViolation {
  type: 'immediate_answer' | 'convenience_over_thinking' | 'hint_dependency' | 'confidence_mismatch' | 'surface_level_response'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  correction: string
  cognitiveImpact: string
}

export interface BehaviorContract {
  id: string
  userId: string
  principles: BehaviorPrinciple[]
  violations: BehaviorContractViolation[]
  adherenceScore: number
  lastUpdated: Date
}

export interface BehaviorPrinciple {
  id: string
  principle: string
  description: string
  enforcement: string
  antiPatterns: string[]
}

export class AIBehaviorContract {
  private static instance: AIBehaviorContract
  private orchestrator = CognitiveAIOrchestrator.getInstance()
  private refusalSystem = AnswerRefusalSystem.getInstance()

  static getInstance(): AIBehaviorContract {
    if (!AIBehaviorContract.instance) {
      AIBehaviorContract.instance = new AIBehaviorContract()
    }
    return AIBehaviorContract.instance
  }

  private readonly CORE_PRINCIPLES: BehaviorPrinciple[] = [
    {
      id: 'thinking_first',
      principle: 'Make Thinking Unavoidable',
      description: 'Never provide answers without prior user reasoning and struggle',
      enforcement: 'Require minimum response length, thinking gates, and confidence articulation before any guidance',
      antiPatterns: [
        'Direct answers without user explanation',
        'Immediate solutions to problems',
        'Skipping reasoning requirements',
        'Providing shortcuts'
      ]
    },
    {
      id: 'productive_friction',
      principle: 'Introduce Productive Friction',
      description: 'Make cognitive work slightly harder than necessary to build mental strength',
      enforcement: 'Delay gratification, require alternative approaches, add thinking timers',
      antiPatterns: [
        'Instant gratification',
        'Easy way out',
        'Convenience over learning',
        'Removing necessary struggle'
      ]
    },
    {
      id: 'cognitive_mirror',
      principle: 'Be Cognitive Mirror, Not Tool',
      description: 'Reflect thinking back to user rather than solving problems for them',
      enforcement: 'Ask "how did you think about this?" before offering any guidance',
      antiPatterns: [
        'Problem-solving for user',
        'Answer dispensing',
        'Tool-like behavior',
        'Solution provision'
      ]
    },
    {
      id: 'judgment_training',
      principle: 'Train Judgment, Not Memorization',
      description: 'Focus on developing decision-making and critical thinking skills',
      enforcement: 'Ask about assumptions, alternatives, and decision criteria',
      antiPatterns: [
        'Fact recall focus',
        'Memorization emphasis',
        'Right/wrong binary thinking',
        'Pattern recognition without understanding'
      ]
    },
    {
      id: 'resist_laziness',
      principle: 'Resist User Laziness by Design',
      description: 'Systematically push back against requests for easy answers',
      enforcement: 'Challenge assumptions, require more effort, suggest deeper approaches',
      antiPatterns: [
        'Accommodating convenience requests',
        'Path of least resistance',
        'User comfort over cognitive growth',
        'Easy satisfaction'
      ]
    }
  ]

  async enforceBehaviorContract(
    userMessage: string,
    aiResponse: string,
    context: CognitivePromptContext
  ): Promise<{
    approvedResponse: string
    violations: BehaviorContractViolation[]
    contractAdherence: number
    cognitiveCorrection: string
  }> {
    const violations = this.detectViolations(userMessage, aiResponse, context)
    
    if (violations.length === 0) {
      return {
        approvedResponse: aiResponse,
        violations: [],
        contractAdherence: 100,
        cognitiveCorrection: ''
      }
    }

    // Apply corrections based on violations
    const correctedResponse = await this.applyCorrections(aiResponse, violations, context)
    const cognitiveCorrection = this.generateCognitiveCorrection(violations)
    const adherenceScore = this.calculateAdherenceScore(violations)

    return {
      approvedResponse: correctedResponse,
      violations,
      contractAdherence: adherenceScore,
      cognitiveCorrection
    }
  }

  private detectViolations(
    userMessage: string,
    aiResponse: string,
    context: CognitivePromptContext
  ): BehaviorContractViolation[] {
    const violations: BehaviorContractViolation[] = []

    // Check for immediate answers without reasoning
    if (this.providesImmediateAnswer(userMessage, aiResponse, context)) {
      violations.push({
        type: 'immediate_answer',
        severity: 'critical',
        description: 'Provided answer without requiring user reasoning first',
        correction: 'Require user to explain their thinking process before any guidance',
        cognitiveImpact: 'Prevents development of independent problem-solving skills'
      })
    }

    // Check for convenience over thinking
    if (this.prioritizesConvenience(aiResponse, context)) {
      violations.push({
        type: 'convenience_over_thinking',
        severity: 'high',
        description: 'Chose convenience over cognitive development',
        correction: 'Add productive friction and require deeper engagement',
        cognitiveImpact: 'Reinforces dependency on easy solutions'
      })
    }

    // Check for hint dependency
    if (this.enablesHintDependency(aiResponse, context)) {
      violations.push({
        type: 'hint_dependency',
        severity: 'medium',
        description: 'Provided hints too readily, creating dependency',
        correction: 'Delay hints and require more independent effort',
        cognitiveImpact: 'Weakens persistence and problem-solving confidence'
      })
    }

    // Check for confidence-accuracy mismatch handling
    if (this.ignoresConfidenceMismatch(userMessage, aiResponse, context)) {
      violations.push({
        type: 'confidence_mismatch',
        severity: 'medium',
        description: 'Failed to address user confidence-accuracy mismatch',
        correction: 'Challenge user confidence and ask for self-assessment',
        cognitiveImpact: 'Missed opportunity to improve metacognitive awareness'
      })
    }

    // Check for surface-level responses
    if (this.providesSurfaceLevelResponse(aiResponse, context)) {
      violations.push({
        type: 'surface_level_response',
        severity: 'low',
        description: 'Response lacks cognitive depth and challenge',
        correction: 'Add Socratic questioning and deeper exploration',
        cognitiveImpact: 'Limits development of critical thinking'
      })
    }

    return violations
  }

  private providesImmediateAnswer(
    userMessage: string,
    aiResponse: string,
    context: CognitivePromptContext
  ): boolean {
    // Check if user provided reasoning
    const userHasReasoning = userMessage.length > 100 && 
      (userMessage.includes('I think') || userMessage.includes('because') || 
       userMessage.includes('my approach') || userMessage.includes('first I'))

    // Check if AI provides direct answer
    const aiProvidesAnswer = aiResponse.includes('answer is') || 
      aiResponse.includes('solution is') ||
      aiResponse.includes('correct answer') ||
      !!aiResponse.match(/\b(correct|answer|solution)\s+(is|:)\s*/i)

    return !userHasReasoning && aiProvidesAnswer
  }

  private prioritizesConvenience(aiResponse: string, context: CognitivePromptContext): boolean {
    const convenienceIndicators = [
      'quick way',
      'easier method',
      'shortcut',
      'simple answer',
      'just do this',
      'all you need is'
    ]

    return convenienceIndicators.some(indicator => 
      aiResponse.toLowerCase().includes(indicator)
    )
  }

  private enablesHintDependency(aiResponse: string, context: CognitivePromptContext): boolean {
    const hintIndicators = [
      'here\'s a hint',
      'try this',
      'let me help',
      'first step is',
      'start with'
    ]

    // Check if user has high hint dependency
    const userHasHighHintDependency = 
      context.thinkingFingerprint.hintDependency.hintRequestFrequency > 0.7

    return userHasHighHintDependency && 
      hintIndicators.some(indicator => aiResponse.toLowerCase().includes(indicator))
  }

  private ignoresConfidenceMismatch(
    userMessage: string,
    aiResponse: string,
    context: CognitivePromptContext
  ): boolean {
    // Extract confidence from user message
    const confidenceMatch = userMessage.match(/confidence[:\s]*(\d+)/i)
    const userConfidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50

    // Check if AI addresses confidence
    const addressesConfidence = aiResponse.toLowerCase().includes('confidence') ||
      aiResponse.toLowerCase().includes('sure') ||
      aiResponse.toLowerCase().includes('certain')

    // Check for high confidence but potentially low understanding
    const highConfidenceLowUnderstanding = userConfidence > 80 && 
      userMessage.length < 150

    return highConfidenceLowUnderstanding && !addressesConfidence
  }

  private providesSurfaceLevelResponse(aiResponse: string, context: CognitivePromptContext): boolean {
    // Check response depth
    const responseLength = aiResponse.length
    const questionCount = (aiResponse.match(/\?/g) || []).length

    // Surface responses are short and don't ask questions
    return responseLength < 200 && questionCount === 0
  }

  private async applyCorrections(
    originalResponse: string,
    violations: BehaviorContractViolation[],
    context: CognitivePromptContext
  ): Promise<string> {
    let correctedResponse = originalResponse

    // Apply corrections based on violation types
    for (const violation of violations) {
      switch (violation.type) {
        case 'immediate_answer':
          correctedResponse = this.addThinkingRequirement(correctedResponse, context)
          break
        case 'convenience_over_thinking':
          correctedResponse = this.addProductiveFriction(correctedResponse, context)
          break
        case 'hint_dependency':
          correctedResponse = this.addHintDelay(correctedResponse, context)
          break
        case 'confidence_mismatch':
          correctedResponse = this.addConfidenceChallenge(correctedResponse, context)
          break
        case 'surface_level_response':
          correctedResponse = this.addSocraticQuestioning(correctedResponse, context)
          break
      }
    }

    return correctedResponse
  }

  private addThinkingRequirement(response: string, context: CognitivePromptContext): string {
    const thinkingPrompts = [
      "Before I provide any guidance, explain your thinking process first. What have you tried?",
      "I need to understand your approach first. Walk me through your reasoning step by step.",
      "Let me see your thinking first. What strategies have you considered and why did you choose your approach?"
    ]

    const prompt = thinkingPrompts[Math.floor(Math.random() * thinkingPrompts.length)]
    return `${prompt}\n\n${response}`
  }

  private addProductiveFriction(response: string, context: CognitivePromptContext): string {
    const frictionPrompts = [
      "That's one approach, but try exploring two alternative methods first. What other ways could you think about this?",
      "Before using that approach, spend 3 more minutes considering why this problem is challenging.",
      "Good start, but identify three assumptions you're making and test each one."
    ]

    const prompt = frictionPrompts[Math.floor(Math.random() * frictionPrompts.length)]
    return `${prompt}\n\n${response}`
  }

  private addHintDelay(response: string, context: CognitivePromptContext): string {
    return `I notice you've been seeking hints frequently. Try working on this for 5 more minutes without help. What specifically is making this difficult for you?\n\n${response}`
  }

  private addConfidenceChallenge(response: string, context: CognitivePromptContext): string {
    return `You seem very confident. On a scale of 1-10, how well do you actually understand the underlying concepts? What evidence do you have for your confidence level?\n\n${response}`
  }

  private addSocraticQuestioning(response: string, context: CognitivePromptContext): string {
    const socraticQuestions = [
      "What assumptions are you making in this approach?",
      "How would you explain this problem to someone who knows nothing about it?",
      "What's the relationship between what you know and what you're trying to find out?",
      "If you had to teach this concept, what would be most difficult to explain?"
    ]

    const question = socraticQuestions[Math.floor(Math.random() * socraticQuestions.length)]
    return `${question}\n\n${response}`
  }

  private generateCognitiveCorrection(violations: BehaviorContractViolation[]): string {
    if (violations.length === 0) return ''

    const criticalViolations = violations.filter(v => v.severity === 'critical')
    if (criticalViolations.length > 0) {
      return "⚠️ COGNITIVE CONTRACT VIOLATION: I must require your thinking first before providing any answers. This ensures you develop independent problem-solving skills."
    }

    const highViolations = violations.filter(v => v.severity === 'high')
    if (highViolations.length > 0) {
      return "🧠 COGNITIVE TRAINING: I'm adding productive friction to strengthen your thinking muscles. Embrace the struggle - it's how you grow."
    }

    return "💭 THINKING DEPTH: Let's explore this more deeply to develop your critical thinking skills."
  }

  private calculateAdherenceScore(violations: BehaviorContractViolation[]): number {
    const severityWeights = {
      critical: 25,
      high: 15,
      medium: 8,
      low: 3
    }

    const totalDeduction = violations.reduce((sum, violation) => 
      sum + severityWeights[violation.severity], 0
    )

    return Math.max(0, 100 - totalDeduction)
  }

  async generateContractReport(userId: string): Promise<{
    contract: BehaviorContract
    adherenceTrend: number[]
    principleAnalysis: {
      principle: string
      adherenceRate: number
      commonViolations: string[]
      recommendations: string[]
    }[]
  }> {
    // This would typically fetch from database
    const adherenceTrend = [85, 87, 82, 90, 88, 92, 89] // Mock data
    
    const principleAnalysis = this.CORE_PRINCIPLES.map(principle => ({
      principle: principle.principle,
      adherenceRate: Math.random() * 30 + 70, // Mock 70-100%
      commonViolations: principle.antiPatterns.slice(0, 2),
      recommendations: [
        `Focus on ${principle.principle.toLowerCase()} in all interactions`,
        `Review ${principle.antiPatterns[0].toLowerCase()} as anti-patterns to avoid`
      ]
    }))

    return {
      contract: {
        id: 'contract-1',
        userId,
        principles: this.CORE_PRINCIPLES,
        violations: [],
        adherenceScore: 89,
        lastUpdated: new Date()
      },
      adherenceTrend,
      principleAnalysis
    }
  }

  getCognitivePrinciples(): BehaviorPrinciple[] {
    return this.CORE_PRINCIPLES
  }

  async validateAIResponse(
    response: string,
    context: CognitivePromptContext
  ): Promise<{
    isValid: boolean
    violations: BehaviorContractViolation[]
    suggestedImprovements: string[]
  }> {
    const violations = this.detectViolations('', response, context)
    const suggestedImprovements = violations.map(v => v.correction)

    return {
      isValid: violations.length === 0,
      violations,
      suggestedImprovements
    }
  }
}
