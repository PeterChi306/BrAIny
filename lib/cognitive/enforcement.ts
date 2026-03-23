import { CognitiveAIOrchestrator } from './orchestrator'
import { AIBehaviorContract } from './contract'
import { CognitiveProfileEngine } from './engine'
import type { CognitivePromptContext, BehaviorContractViolation } from '@/types/cognitive'

export class CognitiveEnforcementLayer {
  private static instance: CognitiveEnforcementLayer
  private orchestrator = CognitiveAIOrchestrator.getInstance()
  private behaviorContract = AIBehaviorContract.getInstance()
  private cognitiveEngine = CognitiveProfileEngine.getInstance()

  static getInstance(): CognitiveEnforcementLayer {
    if (!CognitiveEnforcementLayer.instance) {
      CognitiveEnforcementLayer.instance = new CognitiveEnforcementLayer()
    }
    return CognitiveEnforcementLayer.instance
  }

  /**
   * CRITICAL: This is the ONLY way any AI should be called in Brainy
   * Enforces all cognitive principles and behavior contracts
   */
  async enforceCognitiveInteraction(
    userMessage: string,
    context: CognitivePromptContext,
    mode: 'learn' | 'practice' | 'reflect' | 'review'
  ): Promise<{
    response: string
    violations: BehaviorContractViolation[]
    cognitiveCorrection: string
    thinkingRequirements: string[]
    frictionApplied: boolean
  }> {
    console.log(`🧠 COGNITIVE ENFORCEMENT: ${mode.toUpperCase()} mode interaction`)

    // STEP 1: Validate user has provided sufficient thinking
    const thinkingValidation = this.validateUserThinking(userMessage, context, mode)
    
    if (!thinkingValidation.sufficient) {
      console.log('🚫 THINKING INSUFFICIENT - Applying cognitive friction')
      return {
        response: thinkingValidation.requirementMessage,
        violations: [{
          type: 'immediate_answer',
          severity: 'critical',
          description: 'User attempted to get answer without sufficient thinking',
          correction: 'Require detailed thinking process before any guidance',
          cognitiveImpact: 'Prevents development of independent problem-solving'
        }],
        cognitiveCorrection: '⚠️ COGNITIVE CONTRACT: You must think first. This ensures you develop independent problem-solving skills.',
        thinkingRequirements: thinkingValidation.requirements,
        frictionApplied: true
      }
    }

    // STEP 2: Apply mode-specific cognitive constraints
    const constrainedContext = await this.applyModeConstraints(context, mode)

    // STEP 3: Get AI response through orchestrator (which includes behavior contract)
    let aiResponse = await this.orchestrator.orchestrateResponse(userMessage, constrainedContext)

    // STEP 4: Double-check behavior contract compliance
    const contractCheck = await this.behaviorContract.enforceBehaviorContract(
      userMessage,
      aiResponse,
      constrainedContext
    )

    // STEP 5: Apply final cognitive validation
    const finalValidation = this.validateCognitiveCompliance(aiResponse, mode)

    // STEP 6: Update cognitive profile with interaction
    await this.updateCognitiveProfile(userMessage, aiResponse, context, mode)

    return {
      response: contractCheck.approvedResponse,
      violations: contractCheck.violations,
      cognitiveCorrection: contractCheck.cognitiveCorrection,
      thinkingRequirements: this.getThinkingRequirements(mode),
      frictionApplied: contractCheck.violations.length > 0
    }
  }

  private validateUserThinking(
    userMessage: string,
    context: CognitivePromptContext,
    mode: string
  ): { sufficient: boolean; requirementMessage: string; requirements: string[] } {
    const requirements = this.getThinkingRequirements(mode)
    const thinkingIndicators = [
      'I think',
      'because',
      'my approach',
      'first I',
      'I tried',
      'I considered',
      'I believe',
      'I assume',
      'my reasoning',
      'step by step'
    ]

    const hasThinking = thinkingIndicators.some(indicator => 
      userMessage.toLowerCase().includes(indicator.toLowerCase())
    )

    const sufficientLength = userMessage.length > this.getMinThinkingLength(mode)

    if (!hasThinking || !sufficientLength) {
      return {
        sufficient: false,
        requirementMessage: this.generateThinkingRequirement(mode, requirements),
        requirements
      }
    }

    return { sufficient: true, requirementMessage: '', requirements }
  }

  private getThinkingRequirements(mode: string): string[] {
    switch (mode) {
      case 'learn':
        return [
          'Explain what you already understand about this concept',
          'Describe your approach to learning this',
          'What questions do you have about this?',
          'What have you tried so far?'
        ]
      case 'practice':
        return [
          'Show your step-by-step problem-solving approach',
          'Explain your reasoning for each step',
          'What strategies are you using?',
          'Where are you getting stuck?'
        ]
      case 'reflect':
        return [
          'Analyze your thinking process in detail',
          'What assumptions did you make?',
          'How confident are you in your reasoning?',
          'What patterns do you notice in your thinking?'
        ]
      case 'review':
        return [
          'Examine your cognitive patterns across domains',
          'What thinking habits serve you well?',
          'Where do you tend to seek easy answers?',
          'How do you approach different types of problems?'
        ]
      default:
        return ['Explain your thinking process in detail']
    }
  }

  private getMinThinkingLength(mode: string): number {
    switch (mode) {
      case 'learn': return 100
      case 'practice': return 150
      case 'reflect': return 200
      case 'review': return 175
      default: return 100
    }
  }

  private generateThinkingRequirement(mode: string, requirements: string[]): string {
    const modeMessages: Record<string, string> = {
      learn: "🧠 LEARN MODE: Before I can guide your discovery, I need to understand your thinking first.",
      practice: "💪 PRACTICE MODE: Productive struggle is essential for growth. Show me your thinking process.",
      reflect: "🔍 REFLECT MODE: Deep metacognitive analysis required. Examine your thinking patterns thoroughly.",
      review: "📊 REVIEW MODE: Pattern recognition requires careful analysis of your cognitive approaches."
    }

    const message = modeMessages[mode] || "🧠 COGNITIVE MODE: Please explain your thinking process first."

    return `${message}\n\nPlease address these thinking requirements:\n${requirements.map((req, i) => `${i + 1}. ${req}`).join('\n')}\n\nTake your time - quality thinking matters more than speed.`
  }

  private async applyModeConstraints(
    context: CognitivePromptContext,
    mode: string
  ): Promise<CognitivePromptContext> {
    const constrainedContext = { ...context }

    switch (mode) {
      case 'learn':
        constrainedContext.activeConstraints.push({
          id: 'learn_discovery',
          type: 'answer_refusal',
          trigger: 'always',
          parameters: { requireExplanation: true, socraticQuestions: 2 },
          isActive: true
        })
        break

      case 'practice':
        constrainedContext.activeConstraints.push({
          id: 'practice_struggle',
          type: 'hint_delay',
          trigger: 'always',
          parameters: { delaySeconds: 30, requireThinkingEffort: true },
          isActive: true
        })
        break

      case 'reflect':
        constrainedContext.activeConstraints.push({
          id: 'reflect_metacognition',
          type: 'explanation_requirement',
          trigger: 'always',
          parameters: { requireStepByStep: true, challengeAssumptions: true },
          isActive: true
        })
        break

      case 'review':
        constrainedContext.activeConstraints.push({
          id: 'review_patterns',
          type: 'confidence_challenge',
          trigger: 'always',
          parameters: { askForReasoning: true, examinePatterns: true },
          isActive: true
        })
        break
    }

    return constrainedContext
  }

  private validateCognitiveCompliance(response: string, mode: string): boolean {
    // Check if response violates core principles
    const violations = []

    // No immediate answers
    if (response.includes('answer is') || response.includes('solution is')) {
      violations.push('immediate_answer')
    }

    // No convenience over thinking
    if (response.includes('quick way') || response.includes('easier method')) {
      violations.push('convenience_priority')
    }

    // Must encourage thinking
    if (!response.includes('?') && response.length < 200) {
      violations.push('insufficient_cognitive_depth')
    }

    return violations.length === 0
  }

  private async updateCognitiveProfile(
    userMessage: string,
    aiResponse: string,
    context: CognitivePromptContext,
    mode: string
  ): Promise<void> {
    await this.cognitiveEngine.updateFromInteraction(
      context.userId,
      {
        problemId: `${mode}-${Date.now()}`,
        response: userMessage,
        confidence: this.extractConfidence(userMessage),
        timeToResponse: this.calculateResponseTime(userMessage),
        hintsUsed: 0, // Would be tracked differently
        correctness: 0.8, // Would be assessed
        reasoningDepth: this.assessReasoningDepth(userMessage),
        timestamp: new Date().toISOString()
      },
      mode
    )
  }

  private extractConfidence(message: string): number {
    const confidenceMatch = message.match(/confidence[:\s]*(\d+)/i)
    return confidenceMatch ? parseInt(confidenceMatch[1]) : 50
  }

  private calculateResponseTime(message: string): number {
    // This would be calculated based on actual timing
    return message.length * 2 // Rough estimate
  }

  private assessReasoningDepth(message: string): number {
    const depthIndicators = [
      'because', 'therefore', 'however', 'although', 'considering',
      'analyze', 'evaluate', 'synthesize', 'compare', 'contrast'
    ]
    
    const indicatorCount = depthIndicators.filter(indicator => 
      message.toLowerCase().includes(indicator)
    ).length

    return Math.min(5, Math.max(1, indicatorCount + 1))
  }

  /**
   * Monitor all AI interactions for compliance
   */
  async auditCognitiveCompliance(userId: string, timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    complianceScore: number
    violations: BehaviorContractViolation[]
    recommendations: string[]
  }> {
    // This would audit historical interactions
    return {
      complianceScore: 85, // Mock data
      violations: [],
      recommendations: [
        'Continue requiring detailed explanations',
        'Maintain productive friction in practice mode',
        'Keep challenging user assumptions'
      ]
    }
  }
}
