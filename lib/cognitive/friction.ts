import type { 
  CognitivePromptContext, 
  ThinkingFingerprint, 
  UserResponse 
} from '@/types/cognitive'

export interface FrictionLevel {
  level: number // 1-5 scale
  thinkingRequired: number
  hintDelay: number // seconds
  explanationDepth: number // 1-5
  socraticQuestions: number
  confidenceThreshold: number // min confidence to challenge
}

export interface ThinkingGate {
  id: string
  type: 'reasoning_gate' | 'explanation_gate' | 'confidence_gate' | 'persistence_gate'
  requirement: string
  checkFunction: (response: string, context: CognitivePromptContext) => boolean
  failureMessage: string
  guidancePrompt: string
}

export class AnswerRefusalSystem {
  private static instance: AnswerRefusalSystem
  private thinkingGates: ThinkingGate[]

  constructor() {
    this.thinkingGates = this.initializeThinkingGates()
  }

  static getInstance(): AnswerRefusalSystem {
    if (!AnswerRefusalSystem.instance) {
      AnswerRefusalSystem.instance = new AnswerRefusalSystem()
    }
    return AnswerRefusalSystem.instance
  }

  // Calculate appropriate friction level based on cognitive profile
  calculateFrictionLevel(fingerprint: ThinkingFingerprint): FrictionLevel {
    const baseLevel = 2 // minimum friction
    
    // Increase friction based on cognitive weaknesses
    let frictionIncrease = 0
    
    // High hint dependency -> more friction
    if (fingerprint.hintDependency.hintRequestFrequency > 0.4) {
      frictionIncrease += 2
    }
    
    // Low reasoning depth -> more friction
    if (fingerprint.reasoningDepth.averageDepth < 2.5) {
      frictionIncrease += 1
    }
    
    // Overconfidence -> more friction
    const avgMismatch = this.calculateAverageConfidenceMismatch(fingerprint)
    if (avgMismatch > 30) {
      frictionIncrease += 1
    }
    
    // Quick answer patterns -> more friction
    if (fingerprint.responseLatency.quickAnswerFrequency > 0.3) {
      frictionIncrease += 1
    }
    
    const finalLevel = Math.min(5, baseLevel + frictionIncrease)
    
    return {
      level: finalLevel,
      thinkingRequired: finalLevel,
      hintDelay: finalLevel * 15, // 15-75 seconds
      explanationDepth: finalLevel,
      socraticQuestions: Math.max(2, finalLevel - 1),
      confidenceThreshold: 70 - (finalLevel * 10) // Lower threshold for higher friction
    }
  }

  // Check if user response passes thinking gates
  async checkThinkingGates(
    userResponse: string, 
    context: CognitivePromptContext
  ): Promise<{ passed: boolean; failedGates: ThinkingGate[]; guidance: string }> {
    const failedGates: ThinkingGate[] = []
    let guidance = ''

    for (const gate of this.thinkingGates) {
      if (!gate.checkFunction(userResponse, context)) {
        failedGates.push(gate)
        guidance += gate.failureMessage + '\n' + gate.guidancePrompt + '\n\n'
      }
    }

    return {
      passed: failedGates.length === 0,
      failedGates,
      guidance: guidance.trim()
    }
  }

  // Generate refusal response based on failed gates
  generateRefusalResponse(
    failedGates: ThinkingGate[], 
    frictionLevel: FrictionLevel
  ): string {
    let response = "I can't provide that yet. You need to think more first.\n\n"

    // Add specific gate failures
    for (const gate of failedGates) {
      response += `${gate.failureMessage}\n`
    }

    // Add friction-specific requirements
    response += `\n**Thinking Requirements:**\n`
    response += `- Minimum reasoning depth: ${frictionLevel.thinkingRequired}/5\n`
    response += `- Explain your thinking step-by-step\n`
    response += `- Answer at least ${frictionLevel.socraticQuestions} probing questions\n`
    
    if (frictionLevel.confidenceThreshold > 0) {
      response += `- State your confidence level and why\n`
    }

    response += `\n**Remember:** Brainy makes thinking unavoidable. Show me your thought process, and I'll guide you from there.`

    return response
  }

  // Apply productive friction to delay gratification
  async applyProductiveFriction(
    context: CognitivePromptContext,
    userRequestedHelp: boolean
  ): Promise<{ shouldDelay: boolean; delaySeconds: number; thinkingPrompt: string }> {
    const frictionLevel = this.calculateFrictionLevel(context.thinkingFingerprint)
    
    // Don't delay if user is demonstrating good thinking
    if (context.userHistory.problemsAttempted > 0 && 
        context.userHistory.hintsRequested < 0.2) {
      return { shouldDelay: false, delaySeconds: 0, thinkingPrompt: '' }
    }

    // Calculate delay based on friction level and user patterns
    let delaySeconds = 0
    let thinkingPrompt = ''

    if (userRequestedHelp) {
      delaySeconds = frictionLevel.hintDelay
      thinkingPrompt = this.generateThinkingPrompt(frictionLevel, context)
    }

    return { 
      shouldDelay: delaySeconds > 0, 
      delaySeconds, 
      thinkingPrompt 
    }
  }

  // Generate thinking prompts for friction periods
  private generateThinkingPrompt(
    frictionLevel: FrictionLevel, 
    context: CognitivePromptContext
  ): string {
    const prompts = [
      "Take ${delay} seconds to think about this differently. What approaches haven't you tried?",
      "Before I help, spend ${delay} seconds examining your assumptions. What are you taking for granted?",
      "Think for ${delay} seconds about why this is difficult for you. What's the real obstacle?",
      "Spend ${delay} seconds connecting this to something you already understand. How are they similar?",
      "For the next ${delay} seconds, focus on what you DO know, not what you don't know."
    ]

    const selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)]
    return selectedPrompt.replace('${delay}', frictionLevel.hintDelay.toString())
  }

  // Initialize thinking gates
  private initializeThinkingGates(): ThinkingGate[] {
    return [
      {
        id: 'reasoning_gate',
        type: 'reasoning_gate',
        requirement: 'User must demonstrate reasoning process',
        checkFunction: (response: string, context: CognitivePromptContext) => {
          return this.containsReasoning(response)
        },
        failureMessage: '❌ You haven\'t shown your reasoning process.',
        guidancePrompt: 'Explain your thinking step by step. How did you approach this problem? What did you consider?'
      },
      {
        id: 'explanation_gate',
        type: 'explanation_gate',
        requirement: 'User must provide detailed explanation',
        checkFunction: (response: string, context: CognitivePromptContext) => {
          return this.hasDetailedExplanation(response)
        },
        failureMessage: '❌ Your explanation is too brief or missing.',
        guidancePrompt: 'Provide a detailed explanation. Include "how" and "why" for each step of your thinking.'
      },
      {
        id: 'confidence_gate',
        type: 'confidence_gate',
        requirement: 'User must state confidence level',
        checkFunction: (response: string, context: CognitivePromptContext) => {
          return this.containsConfidenceStatement(response)
        },
        failureMessage: '❌ You haven\'t stated your confidence level.',
        guidancePrompt: 'How confident are you in your answer (1-10) and why? What makes you certain or uncertain?'
      },
      {
        id: 'persistence_gate',
        type: 'persistence_gate',
        requirement: 'User must show effort before seeking help',
        checkFunction: (response: string, context: CognitivePromptContext) => {
          return this.showsPersistence(response, context)
        },
        failureMessage: '❌ You\'re seeking help too quickly.',
        guidancePrompt: 'What have you tried so far? Show me your attempts before asking for help.'
      },
      {
        id: 'assumption_gate',
        type: 'reasoning_gate',
        requirement: 'User must identify their assumptions',
        checkFunction: (response: string, context: CognitivePromptContext) => {
          return this.identifiesAssumptions(response)
        },
        failureMessage: '❌ You haven\'t examined your assumptions.',
        guidancePrompt: 'What assumptions are you making? What are you taking for granted in this problem?'
      }
    ]
  }

  // Gate check functions
  private containsReasoning(response: string): boolean {
    const reasoningIndicators = [
      /i think/i,
      /i believe/i,
      /my approach/i,
      /first i/i,
      /then i/i,
      /because/i,
      /since/i,
      /therefore/i,
      /step \d+/i,
      /my reasoning/i
    ]
    return reasoningIndicators.some(pattern => pattern.test(response))
  }

  private hasDetailedExplanation(response: string): boolean {
    // Check for length and complexity
    if (response.length < 100) return false
    
    // Check for explanatory language
    const explanationIndicators = [
      /this works because/i,
      /the reason is/i,
      /how this works/i,
      /why this is/i,
      /the way i understand/i
    ]
    return explanationIndicators.some(pattern => pattern.test(response))
  }

  private containsConfidenceStatement(response: string): boolean {
    const confidenceIndicators = [
      /confident/i,
      /certain/i,
      /sure/i,
      /(\d+|one|two|three|four|five|six|seven|eight|nine|ten) out of \d+/i,
      /(\d+)\/\d+/i,
      /percent confident/i
    ]
    return confidenceIndicators.some(pattern => pattern.test(response))
  }

  private showsPersistence(response: string, context: CognitivePromptContext): boolean {
    // Check if user has attempted multiple approaches
    const persistenceIndicators = [
      /i tried/i,
      /i attempted/i,
      /my first attempt/i,
      /i also tried/i,
      /another approach/i
    ]
    return persistenceIndicators.some(pattern => pattern.test(response))
  }

  private identifiesAssumptions(response: string): boolean {
    const assumptionIndicators = [
      /i'm assuming/i,
      /my assumption/i,
      /assuming that/i,
      /i take for granted/i,
      /the assumption is/i
    ]
    return assumptionIndicators.some(pattern => pattern.test(response))
  }

  // Helper methods
  private calculateAverageConfidenceMismatch(fingerprint: ThinkingFingerprint): number {
    if (fingerprint.confidenceAccuracyMismatch.length === 0) return 0
    const total = fingerprint.confidenceAccuracyMismatch.reduce(
      (sum, m) => sum + m.mismatchScore, 0
    )
    return total / fingerprint.confidenceAccuracyMismatch.length
  }

  // Generate cognitive friction for UI
  generateUIFriction(
    frictionLevel: FrictionLevel, 
    context: CognitivePromptContext
  ): {
    disableQuickSubmit: boolean
    requireMinimumLength: number
    showThinkingTimer: boolean
    forceExplanationBox: boolean
    confidenceRequired: boolean
    thinkingPrompts: string[]
  } {
    return {
      disableQuickSubmit: frictionLevel.level >= 3,
      requireMinimumLength: 50 * frictionLevel.level,
      showThinkingTimer: frictionLevel.level >= 2,
      forceExplanationBox: frictionLevel.level >= 3,
      confidenceRequired: frictionLevel.level >= 2,
      thinkingPrompts: this.generateThinkingPrompts(frictionLevel, context)
    }
  }

  private generateThinkingPrompts(
    frictionLevel: FrictionLevel, 
    context: CognitivePromptContext
  ): string[] {
    const basePrompts = [
      "What's your initial approach?",
      "What do you already know about this?",
      "What makes this problem challenging?"
    ]

    const advancedPrompts = [
      "What assumptions are you making?",
      "How could you approach this differently?",
      "What's the real obstacle here?",
      "How does this connect to what you already understand?",
      "What would happen if you changed one variable?"
    ]

    return frictionLevel.level <= 2 ? basePrompts : [...basePrompts, ...advancedPrompts]
  }
}
