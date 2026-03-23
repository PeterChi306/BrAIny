/**
 * Response Quality Checker for brAIny
 * Ensures AI responses meet personalization, accuracy, clarity, and engagement standards
 */

export interface QualityMetrics {
  personalization: {
    usesName: boolean
    referencesInterests: boolean
    adaptsToLearningStyle: boolean
    appropriateTone: boolean
    score: number
  }
  accuracy: {
    hasContextClarification: boolean
    definesTechnicalTerms: boolean
    avoidsOvergeneralization: boolean
    factuallySound: boolean
    score: number
  }
  clarity: {
    hasStructure: boolean
    usesSimpleLanguage: boolean
    hasVisualHierarchy: boolean
    logicalFlow: boolean
    score: number
  }
  engagement: {
    hasAnalogies: boolean
    relatableExamples: boolean
    conversationalTone: boolean
    curiosityHooks: boolean
    score: number
  }
  overall: {
    score: number
    meetsStandards: boolean
    improvements: string[]
  }
}

export class ResponseQualityChecker {
  private userContext: any
  private originalMessage: string

  constructor(userContext: any, originalMessage: string) {
    this.userContext = userContext
    this.originalMessage = originalMessage
  }

  /**
   * Analyze AI response quality across all dimensions
   */
  analyzeQuality(response: string): QualityMetrics {
    const personalization = this.checkPersonalization(response)
    const accuracy = this.checkAccuracy(response)
    const clarity = this.checkClarity(response)
    const engagement = this.checkEngagement(response)

    const overallScore = (personalization.score + accuracy.score + clarity.score + engagement.score) / 4
    const meetsStandards = overallScore >= 0.7 // 70% threshold

    const improvements = this.generateImprovements(personalization, accuracy, clarity, engagement)

    return {
      personalization,
      accuracy,
      clarity,
      engagement,
      overall: {
        score: overallScore,
        meetsStandards,
        improvements
      }
    }
  }

  private checkPersonalization(response: string) {
    let score = 0
    const checks = {
      usesName: false,
      referencesInterests: false,
      adaptsToLearningStyle: false,
      appropriateTone: false
    }

    // Check if uses user's name
    if (this.userContext.displayName && response.includes(this.userContext.displayName)) {
      checks.usesName = true
      score += 0.25
    }

    // Check if references user's interests
    if (this.userContext.interests && this.userContext.interests.length > 0) {
      const hasInterestReference = this.userContext.interests.some((interest: string) => 
        response.toLowerCase().includes(interest.toLowerCase())
      )
      if (hasInterestReference) {
        checks.referencesInterests = true
        score += 0.25
      }
    }

    // Check if adapts to learning style
    if (this.userContext.learningStyle) {
      const styleIndicators = {
        'visual': ['picture', 'imagine', 'see', 'look like', 'visual'],
        'step-by-step': ['step', 'first', 'then', 'next', 'finally'],
        'hands-on': ['try', 'practice', 'do', 'actually', 'real-world'],
        'auditory': ['listen', 'sound like', 'hear', 'tell you']
      }
      
      const indicators = styleIndicators[this.userContext.learningStyle as keyof typeof styleIndicators] || []
      const hasStyleAdaptation = indicators.some(indicator => 
        response.toLowerCase().includes(indicator)
      )
      if (hasStyleAdaptation) {
        checks.adaptsToLearningStyle = true
        score += 0.25
      }
    }

    // Check appropriate tone
    if (this.userContext.preferredTone) {
      const toneIndicators = {
        'friendly': ['hey', 'great', 'awesome', 'let\'s', 'we'],
        'formal': ['therefore', 'thus', 'consequently', 'furthermore'],
        'casual': ['basically', 'pretty much', 'kind of', 'you know'],
        'encouraging': ['excellent', 'fantastic', 'you\'re doing', 'keep going']
      }
      
      const indicators = toneIndicators[this.userContext.preferredTone as keyof typeof toneIndicators] || []
      const hasToneMatch = indicators.some(indicator => 
        response.toLowerCase().includes(indicator)
      )
      if (hasToneMatch) {
        checks.appropriateTone = true
        score += 0.25
      }
    }

    return { ...checks, score }
  }

  private checkAccuracy(response: string) {
    let score = 0
    const checks = {
      hasContextClarification: false,
      definesTechnicalTerms: false,
      avoidsOvergeneralization: false,
      factuallySound: true // We'll assume this unless we detect issues
    }

    // Check for context clarification
    const contextPhrases = ['in general', 'specifically', 'typically', 'usually', 'in most cases']
    if (contextPhrases.some(phrase => response.toLowerCase().includes(phrase))) {
      checks.hasContextClarification = true
      score += 0.25
    }

    // Check for technical term definitions
    const definitionPatterns = [
      /\([^)]*\)/g, // Text in parentheses
      /means|is defined as|refers to|basically/i
    ]
    if (definitionPatterns.some(pattern => pattern.test(response))) {
      checks.definesTechnicalTerms = true
      score += 0.25
    }

    // Check for avoiding overgeneralization
    const nuancePhrases = ['can be', 'may', 'often', 'sometimes', 'tend to']
    if (nuancePhrases.some(phrase => response.toLowerCase().includes(phrase))) {
      checks.avoidsOvergeneralization = true
      score += 0.25
    }

    // Basic factual soundness (placeholder - would need fact-checking API)
    score += 0.25

    return { ...checks, score }
  }

  private checkClarity(response: string) {
    let score = 0
    const checks = {
      hasStructure: false,
      usesSimpleLanguage: false,
      hasVisualHierarchy: false,
      logicalFlow: false
    }

    // Check for structure (headings, lists, etc.)
    const structurePatterns = [/^#+\s/m, /^\*\s/m, /^\d+\.\s/m, /^-\s/m]
    if (structurePatterns.some(pattern => pattern.test(response))) {
      checks.hasStructure = true
      score += 0.25
    }

    // Check for simple language (shorter sentences, common words)
    const sentences = response.split(/[.!?]+/)
    const avgSentenceLength = sentences.reduce((acc, s) => acc + s.split(' ').length, 0) / sentences.length
    if (avgSentenceLength <= 20) {
      checks.usesSimpleLanguage = true
      score += 0.25
    }

    // Check for visual hierarchy (bold, italics, spacing)
    const hierarchyPatterns = [/\*\*.*?\*\*/, /\*.*?\*/, /\n\n/]
    if (hierarchyPatterns.some(pattern => pattern.test(response))) {
      checks.hasVisualHierarchy = true
      score += 0.25
    }

    // Check for logical flow indicators
    const flowIndicators = ['first', 'then', 'next', 'finally', 'because', 'therefore', 'so']
    if (flowIndicators.some(indicator => response.toLowerCase().includes(indicator))) {
      checks.logicalFlow = true
      score += 0.25
    }

    return { ...checks, score }
  }

  private checkEngagement(response: string) {
    let score = 0
    const checks = {
      hasAnalogies: false,
      relatableExamples: false,
      conversationalTone: false,
      curiosityHooks: false
    }

    // Check for analogies
    const analogyPatterns = [
      /like|as.*as|similar to|think of it as/i,
      /imagine|picture this|consider/i
    ]
    if (analogyPatterns.some(pattern => pattern.test(response))) {
      checks.hasAnalogies = true
      score += 0.25
    }

    // Check for relatable examples (using user interests or everyday situations)
    const exampleIndicators = ['for example', 'such as', 'like when', 'imagine if']
    if (exampleIndicators.some(indicator => response.toLowerCase().includes(indicator))) {
      checks.relatableExamples = true
      score += 0.25
    }

    // Check for conversational tone
    const conversationalIndicators = ['you', 'your', 'let\'s', 'we', 'questions?']
    if (conversationalIndicators.some(indicator => response.toLowerCase().includes(indicator))) {
      checks.conversationalTone = true
      score += 0.25
    }

    // Check for curiosity hooks
    const hookPatterns = [
      /want to.*\?/i,
      /would you like/i,
      /interested in/i,
      /curious about/i
    ]
    if (hookPatterns.some(pattern => pattern.test(response))) {
      checks.curiosityHooks = true
      score += 0.25
    }

    return { ...checks, score }
  }

  private generateImprovements(
    personalization: any,
    accuracy: any,
    clarity: any,
    engagement: any
  ): string[] {
    const improvements: string[] = []

    if (!personalization.usesName && this.userContext.displayName) {
      improvements.push(`Use the user's name (${this.userContext.displayName}) naturally in the response`)
    }

    if (!personalization.referencesInterests && this.userContext.interests?.length > 0) {
      improvements.push(`Include examples related to their interests: ${this.userContext.interests.join(', ')}`)
    }

    if (!accuracy.definesTechnicalTerms) {
      improvements.push('Define technical terms in parentheses when first used')
    }

    if (!clarity.hasStructure) {
      improvements.push('Add structure with headings, bullet points, or numbered lists')
    }

    if (!engagement.hasAnalogies) {
      improvements.push('Include relatable analogies to make concepts clearer')
    }

    if (!engagement.curiosityHooks) {
      improvements.push('Add 1-2 follow-up questions or suggestions to encourage exploration')
    }

    return improvements
  }

  /**
   * Generate feedback for the AI to improve future responses
   */
  generateFeedback(quality: QualityMetrics): string {
    if (quality.overall.meetsStandards) {
      return "✅ Excellent response! Meets all quality standards for personalization, accuracy, clarity, and engagement."
    }

    let feedback = "📝 Response Quality Analysis:\n\n"
    
    feedback += `Overall Score: ${Math.round(quality.overall.score * 100)}%\n\n`

    if (quality.overall.improvements.length > 0) {
      feedback += "Suggested Improvements:\n"
      quality.overall.improvements.forEach((improvement, index) => {
        feedback += `${index + 1}. ${improvement}\n`
      })
    }

    return feedback
  }
}

/**
 * Factory function to create quality checker
 */
export function createQualityChecker(userContext: any, originalMessage: string): ResponseQualityChecker {
  return new ResponseQualityChecker(userContext, originalMessage)
}
