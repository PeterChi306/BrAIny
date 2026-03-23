import { GoogleGenerativeAI } from '@google/generative-ai'
import { AIBehaviorContract } from './contract'
import type { 
  CognitivePromptContext, 
  AIConstraint, 
  ThinkingFingerprint 
} from '@/types/cognitive'

export class CognitiveAIOrchestrator {
  private static instance: CognitiveAIOrchestrator
  private genAI: GoogleGenerativeAI
  private behaviorContract: AIBehaviorContract

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY missing at runtime')
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    this.behaviorContract = AIBehaviorContract.getInstance()
  }

  static getInstance(): CognitiveAIOrchestrator {
    if (!CognitiveAIOrchestrator.instance) {
      CognitiveAIOrchestrator.instance = new CognitiveAIOrchestrator()
    }
    return CognitiveAIOrchestrator.instance
  }

  // Main orchestration method - NEVER calls AI directly
  async orchestrateResponse(
    userMessage: string,
    context: CognitivePromptContext
  ): Promise<string> {
    // Apply constraints to modify the prompt before AI call
    const constrainedPrompt = await this.applyConstraints(userMessage, context)
    
    // Call AI with constraints
    let aiResponse = await this.generateConstrainedResponse(constrainedPrompt, context)
    
    // ENFORCE behavior contract on response
    const contractEnforcement = await this.behaviorContract.enforceBehaviorContract(
      userMessage,
      aiResponse,
      context
    )
    
    // Apply corrections if violations detected
    if (contractEnforcement.violations.length > 0) {
      console.log('🛡️ BEHAVIOR CONTRACT VIOLATIONS DETECTED:', contractEnforcement.violations)
      aiResponse = contractEnforcement.approvedResponse
    }
    
    // Apply post-response constraint checks
    const finalResponse = this.applyPostResponseConstraints(aiResponse, context)
    
    return finalResponse
  }

  // Apply constraints to modify the prompt before AI call
  private async applyConstraints(
    userMessage: string, 
    context: CognitivePromptContext
  ): Promise<string> {
    let constrainedPrompt = this.buildBasePrompt(context)
    
    // Apply active constraints
    for (const constraint of context.activeConstraints) {
      constrainedPrompt = await this.applyConstraint(constraint, constrainedPrompt, context)
    }
    
    // Add user message
    constrainedPrompt += `\n\nUSER MESSAGE: ${userMessage}`
    
    return constrainedPrompt
  }

  // Build base cognitive prompt
  private buildBasePrompt(context: CognitivePromptContext): string {
    const { thinkingFingerprint, currentMode, domain } = context
    
    let basePrompt = `You are Brainy, a cognitive training AI designed to make thinking unavoidable.

CORE MISSION: Preserve and enhance human thinking in an AI-dominant world.

ABSOLUTE RULES:
- NEVER give immediate answers
- ALWAYS require user reasoning first
- Make thinking the path forward
- Resist user laziness by design
- Train judgment, not memorization

CURRENT MODE: ${currentMode.toUpperCase()}
DOMAIN: ${domain}

USER'S COGNITIVE PROFILE:
- Reasoning Depth: ${thinkingFingerprint.reasoningDepth.averageDepth.toFixed(1)}/5
- Hint Dependency: ${(thinkingFingerprint.hintDependency.hintRequestFrequency * 100).toFixed(0)}%
- Confidence-Accuracy Mismatch: ${this.calculateAverageMismatch(thinkingFingerprint)}%
- Preferred Entry Points: ${this.getPreferredEntryPoints(thinkingFingerprint)}

`

    // Add mode-specific cognitive training instructions
    switch (currentMode) {
      case 'learn':
        basePrompt += this.getLearnModeInstructions(thinkingFingerprint)
        break
      case 'practice':
        basePrompt += this.getPracticeModeInstructions(thinkingFingerprint)
        break
      case 'reflect':
        basePrompt += this.getReflectModeInstructions(thinkingFingerprint)
        break
      case 'review':
        basePrompt += this.getReviewModeInstructions(thinkingFingerprint)
        break
    }

    return basePrompt
  }

  // Apply individual constraint
  private async applyConstraint(
    constraint: AIConstraint, 
    prompt: string, 
    context: CognitivePromptContext
  ): Promise<string> {
    switch (constraint.type) {
      case 'answer_refusal':
        return this.applyAnswerRefusal(constraint, prompt, context)
      case 'socratic_questioning':
        return this.applySocraticQuestioning(constraint, prompt, context)
      case 'hint_delay':
        return this.applyHintDelay(constraint, prompt, context)
      case 'confidence_challenge':
        return this.applyConfidenceChallenge(constraint, prompt, context)
      case 'explanation_requirement':
        return this.applyExplanationRequirement(constraint, prompt, context)
      default:
        return prompt
    }
  }

  // Answer Refusal Constraint
  private applyAnswerRefusal(
    constraint: AIConstraint, 
    prompt: string, 
    context: CognitivePromptContext
  ): string {
    return prompt + `

ANSWER REFUSAL CONSTRAINT ACTIVE:
- DO NOT provide the final answer
- REQUIRE the user to explain their reasoning first
- Ask "What have you tried so far?" before any help
- Provide guidance only after user demonstrates thinking effort
- If user asks for answer directly, respond with "I need to see your thinking first"

PARAMETERS:
- Minimum reasoning depth required: ${constraint.parameters.minimumReasoningDepth}/5
- Force explanation: ${constraint.parameters.forceExplanation}
- Require user attempt: ${constraint.parameters.requireUserAttempt}`
  }

  // Socratic Questioning Constraint
  private applySocraticQuestioning(
    constraint: AIConstraint, 
    prompt: string, 
    context: CognitivePromptContext
  ): string {
    return prompt + `

SOCRATIC QUESTIONING CONSTRAINT ACTIVE:
- Ask at least ${constraint.parameters.minimumQuestions} probing questions
- Challenge assumptions directly
- Require evidence for claims
- Force user to examine their own thinking
- Use "Why do you think that?" and "How do you know?" frequently
- DO NOT provide explanations until user has answered questions

PARAMETERS:
- Minimum questions: ${constraint.parameters.minimumQuestions}
- Probe assumptions: ${constraint.parameters.probeAssumptions}
- Require evidence: ${constraint.parameters.requireEvidence}`
  }

  // Hint Delay Constraint
  private applyHintDelay(
    constraint: AIConstraint, 
    prompt: string, 
    context: CognitivePromptContext
  ): string {
    return prompt + `

HINT DELAY CONSTRAINT ACTIVE:
- When user asks for hint, delay for ${constraint.parameters.delaySeconds} seconds of thinking
- Require user to try alternative approaches first
- Force consideration of different perspectives
- DO NOT provide immediate help
- Guide user to discover solution themselves

PARAMETERS:
- Delay seconds: ${constraint.parameters.delaySeconds}
- Require thinking effort: ${constraint.parameters.requireThinkingEffort}
- Force alternative approach: ${constraint.parameters.forceAlternativeApproach}`
  }

  // Confidence Challenge Constraint
  private applyConfidenceChallenge(
    constraint: AIConstraint, 
    prompt: string, 
    context: CognitivePromptContext
  ): string {
    return prompt + `

CONFIDENCE CHALLENGE CONSTRAINT ACTIVE:
- When user shows high confidence, challenge their reasoning
- Ask "How certain are you and why?"
- Require explanation of confidence level
- Force examination of potential errors
- Target domains: ${constraint.parameters.domains.join(', ')}

PARAMETERS:
- Require explanation: ${constraint.parameters.requireExplanation}
- Ask for reasoning: ${constraint.parameters.askForReasoning}`
  }

  // Explanation Requirement Constraint
  private applyExplanationRequirement(
    constraint: AIConstraint, 
    prompt: string, 
    context: CognitivePromptContext
  ): string {
    return prompt + `

EXPLANATION REQUIREMENT CONSTRAINT ACTIVE:
- NEVER accept answers without explanation
- Require "how" and "why" for every response
- Force articulation of reasoning process
- Ask "Explain your thinking step by step"
- Reject superficial or incomplete explanations`
  }

  // Generate constrained response
  private async generateConstrainedResponse(
    prompt: string, 
    context: CognitivePromptContext
  ): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error('AI generation error:', error)
      return this.getFallbackResponse(context)
    }
  }

  // Apply post-response constraints
  private async applyPostResponseConstraints(
    response: string, 
    context: CognitivePromptContext
  ): Promise<string> {
    // Check if response violates any constraints
    const violations = this.detectConstraintViolations(response, context)
    
    if (violations.length > 0) {
      // If violations found, modify response
      return this.fixConstraintViolations(response, violations, context)
    }
    
    return response
  }

  // Detect constraint violations
  private detectConstraintViolations(
    response: string, 
    context: CognitivePromptContext
  ): string[] {
    const violations: string[] = []
    
    // Check for direct answer violations
    if (context.activeConstraints.some(c => c.type === 'answer_refusal')) {
      if (this.containsDirectAnswer(response)) {
        violations.push('Direct answer provided when answer refusal is active')
      }
    }
    
    // Check for insufficient Socratic questioning
    if (context.activeConstraints.some(c => c.type === 'socratic_questioning')) {
      if (!this.containsSocraticQuestions(response)) {
        violations.push('Insufficient Socratic questioning')
      }
    }
    
    // Check for confidence challenges not applied
    if (context.activeConstraints.some(c => c.type === 'confidence_challenge')) {
      if (!this.containsConfidenceChallenge(response)) {
        violations.push('Confidence not challenged when required')
      }
    }
    
    return violations
  }

  // Fix constraint violations
  private fixConstraintViolations(
    response: string, 
    violations: string[], 
    context: CognitivePromptContext
  ): string {
    let fixedResponse = response
    
    for (const violation of violations) {
      switch (violation) {
        case 'Direct answer provided when answer refusal is active':
          fixedResponse = this.convertToSocraticGuidance(fixedResponse)
          break
        case 'Insufficient Socratic questioning':
          fixedResponse = this.addSocraticQuestions(fixedResponse)
          break
        case 'Confidence not challenged when required':
          fixedResponse = this.addConfidenceChallenge(fixedResponse)
          break
      }
    }
    
    return fixedResponse
  }

  // Mode-specific instruction builders
  private getLearnModeInstructions(fingerprint: ThinkingFingerprint): string {
    return `
LEARN MODE - GUIDED DISCOVERY:
- Start with questions, not answers
- Force user to explore concepts before explaining
- Use "What do you already know about this?" as opener
- Provide analogies only after user attempts explanation
- Celebrate thinking effort over correct answers
`
  }

  private getPracticeModeInstructions(fingerprint: ThinkingFingerprint): string {
    return `
PRACTICE MODE - ADAPTIVE CHALLENGE:
- Present problems without solution strategies
- Require user to develop approach first
- Adjust difficulty based on reasoning depth, not speed
- Force articulation of problem-solving strategy
- Make struggle productive, not frustrating
`
  }

  private getReflectModeInstructions(fingerprint: ThinkingFingerprint): string {
    return `
REFLECT MODE - METACOGNITION:
- Focus on "how did you think about this?"
- Force examination of thought processes
- Ask "What assumptions did you make?"
- Challenge user to identify their own misconceptions
- Make thinking itself the subject of study
`
  }

  private getReviewModeInstructions(fingerprint: ThinkingFingerprint): string {
    return `
REVIEW MODE - PATTERN RECOGNITION:
- Force user to identify their own mistake patterns
- Ask "What type of errors do you tend to make?"
- Guide self-discovery of weaknesses
- Make connections across different problems
- Focus on transfer of thinking skills
`
  }

  // Helper methods
  private calculateAverageMismatch(fingerprint: ThinkingFingerprint): number {
    if (fingerprint.confidenceAccuracyMismatch.length === 0) return 0
    const total = fingerprint.confidenceAccuracyMismatch.reduce(
      (sum, m) => sum + m.mismatchScore, 0
    )
    return total / fingerprint.confidenceAccuracyMismatch.length
  }

  private getPreferredEntryPoints(fingerprint: ThinkingFingerprint): string {
    const prefs = fingerprint.cognitiveEntryPoints.preferredEntryPoints
    const sorted = Object.entries(prefs).sort(([,a], [,b]) => b - a)
    return sorted.slice(0, 3).map(([entry]) => entry).join(', ')
  }

  private containsDirectAnswer(response: string): boolean {
    // Check if response contains direct answers without requiring user thinking
    const directAnswerPatterns = [
      /the answer is/i,
      /correct answer is/i,
      /solution is/i,
      /here's the answer/i
    ]
    return directAnswerPatterns.some(pattern => pattern.test(response))
  }

  private containsSocraticQuestions(response: string): boolean {
    const questionPatterns = [
      /why do you think/i,
      /how do you know/i,
      /what makes you/i,
      /can you explain/i
    ]
    return questionPatterns.some(pattern => pattern.test(response))
  }

  private containsConfidenceChallenge(response: string): boolean {
    const confidencePatterns = [
      /how certain are you/i,
      /how confident/i,
      /why are you sure/i
    ]
    return confidencePatterns.some(pattern => pattern.test(response))
  }

  private convertToSocraticGuidance(response: string): string {
    return `I need to see your thinking first. 

What have you tried so far? Explain your reasoning step by step before I provide any guidance.

${response.includes('answer') ? 'Direct answers don\'t help you learn. Show me your thinking process.' : ''}`
  }

  private addSocraticQuestions(response: string): string {
    return `${response}

Now, let me ask you some questions to deepen your thinking:

Why do you think that approach would work?
How did you arrive at that conclusion?
What assumptions are you making?`
  }

  private addConfidenceChallenge(response: string): string {
    return `${response}

Before we proceed, how certain are you about this reasoning? 
What evidence makes you confident, and where might you be wrong?`
  }

  private getFallbackResponse(context: CognitivePromptContext): string {
    return `I need you to think through this first. 

What's your initial approach to this problem? Explain your reasoning before I provide any guidance.

Remember: the goal is to develop your thinking, not just get answers.`
  }
}
