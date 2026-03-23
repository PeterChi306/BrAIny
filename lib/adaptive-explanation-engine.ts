/**
 * 🧠 Adaptive Explanation Engine
 * 
 * This is NOT a chatbot.
 * This adapts explanations based on:
 * • User's weak spots
 * • Learning style
 * • Mastery level
 * • Confidence patterns
 * • Response time patterns
 */

import { learningIntelligence, LearningProfile, WeakSpot, DiagnosticResult } from './learning-intelligence'

export interface AdaptiveExplanation {
  hook: string
  coreExplanation: string
  academicAnchor: string
  microSections: string[]
  recap: string[]
  engagementQuestion: {
    type: 'depth' | 'reflection' | 'application'
    question: string
  }
  adaptations: {
    complexity: number
    analogyType: string
    confidenceBoost: boolean
    visualAids: boolean
  }
}

export interface ExplanationContext {
  userId: string
  subject: string
  topic: string
  subtopic: string
  userQuestion: string
  previousInteractions: number
  currentConfidence: number
}

export class AdaptiveExplanationEngine {
  /**
   * 🎯 Generate adaptive explanation based on learning profile
   */
  async generateExplanation(context: ExplanationContext): Promise<AdaptiveExplanation> {
    const profile = learningIntelligence.getProfile(context.userId)
    const diagnosis = learningIntelligence.diagnose(context.userId)
    const weakSpot = this.findWeakSpot(profile, context)
    
    // Determine adaptation strategy
    const adaptations = this.determineAdaptations(profile, weakSpot, context)
    
    // Generate explanation components
    const hook = this.generatePersonalizedHook(profile, context, adaptations)
    const coreExplanation = this.generateCoreExplanation(context, adaptations)
    const academicAnchor = this.generateAcademicAnchor(context, adaptations)
    const microSections = this.generateMicroSections(context, adaptations)
    const recap = this.generateRecap(context, adaptations)
    const engagementQuestion = this.generateEngagementQuestion(profile, context, adaptations)
    
    return {
      hook,
      coreExplanation,
      academicAnchor,
      microSections,
      recap,
      engagementQuestion,
      adaptations
    }
  }

  /**
   * 🔍 Find relevant weak spot for this context
   */
  private findWeakSpot(profile: LearningProfile, context: ExplanationContext): WeakSpot | null {
    return profile.weakSpots.find(ws => 
      ws.subject === context.subject &&
      ws.topic === context.topic &&
      ws.subtopic === context.subtopic
    ) || null
  }

  /**
   * ⚙️ Determine adaptation strategy
   */
  private determineAdaptations(
    profile: LearningProfile, 
    weakSpot: WeakSpot | null, 
    context: ExplanationContext
  ) {
    const adaptations = {
      complexity: 50, // Default medium complexity
      analogyType: 'general',
      confidenceBoost: false,
      visualAids: false
    }

    // Adapt based on weak spot
    if (weakSpot) {
      if (weakSpot.masteryLevel < 30) {
        adaptations.complexity = 20 // Very simple
        adaptations.confidenceBoost = true
        adaptations.visualAids = true
      } else if (weakSpot.masteryLevel < 60) {
        adaptations.complexity = 35 // Simple
        adaptations.visualAids = true
      } else {
        adaptations.complexity = 70 // More complex
      }

      // Adapt based on confidence patterns
      if (weakSpot.avgResponseConfidence < 0.4) {
        adaptations.confidenceBoost = true
        adaptations.complexity = Math.min(adaptations.complexity, 30)
      }

      // Adapt based on response time
      if (weakSpot.avgTimeToUnderstand > 70) {
        adaptations.visualAids = true
        adaptations.complexity = Math.min(adaptations.complexity, 40)
      }
    }

    // Adapt based on learning style
    if (profile.learningStyle === 'visual') {
      adaptations.visualAids = true
      adaptations.analogyType = 'visual'
    } else if (profile.learningStyle === 'kinesthetic') {
      adaptations.analogyType = 'hands-on'
    } else if (profile.learningStyle === 'auditory') {
      adaptations.analogyType = 'story-based'
    }

    // Adapt based on interests
    if (profile.interests.includes('gaming')) {
      adaptations.analogyType = 'gaming'
    } else if (profile.interests.includes('sports')) {
      adaptations.analogyType = 'sports'
    } else if (profile.interests.includes('tech')) {
      adaptations.analogyType = 'technology'
    }

    return adaptations
  }

  /**
   * 🎣 Generate personalized hook
   */
  private generatePersonalizedHook(
    profile: LearningProfile, 
    context: ExplanationContext, 
    adaptations: any
  ): string {
    const userName = profile.userId.split('-')[0] || 'You'
    
    if (adaptations.confidenceBoost) {
      return `${userName}, I know this might seem tricky, but you've got this! Let's break it down together.`
    }

    // Interest-based hooks
    if (adaptations.analogyType === 'gaming') {
      return `${userName}, imagine this is like leveling up in a game - each concept is a new skill to unlock!`
    } else if (adaptations.analogyType === 'sports') {
      return `${userName}, think of this like learning a new sports move - it takes practice but becomes natural!`
    } else if (adaptations.analogyType === 'technology') {
      return `${userName}, this is like understanding how your favorite app works - once you see the pattern, it makes perfect sense!`
    }

    return `${userName}, let's explore how ${context.topic} works in a way that'll click for you.`
  }

  /**
   * 📚 Generate core explanation
   */
  private generateCoreExplanation(context: ExplanationContext, adaptations: any): string {
    let explanation = `The main idea behind ${context.topic} is `
    
    if (adaptations.complexity < 30) {
      explanation += `actually pretty simple when you break it down. `
    } else if (adaptations.complexity < 60) {
      explanation += `a fundamental concept that builds on what you already know. `
    } else {
      explanation += `an advanced concept that connects multiple ideas together. `
    }

    // Add complexity-specific details
    if (context.subject === 'Math' && context.topic === 'Algebra') {
      if (adaptations.complexity < 30) {
        explanation += `Think of variables as mystery boxes that hold numbers - we just need to figure out what's inside!`
      } else {
        explanation += `Variables represent unknown quantities that we can solve for using systematic methods.`
      }
    }

    return explanation
  }

  /**
   * 🎓 Generate academic anchor
   */
  private generateAcademicAnchor(context: ExplanationContext, adaptations: any): string {
    if (context.subject === 'Math' && context.topic.includes('equations')) {
      return `This follows the **Balance Principle**, which states that whatever you do to one side of an equation, you must do to the other to maintain equality.`
    }
    
    if (context.subject === 'Science' && context.topic.includes('energy')) {
      return `This is explained by the **Conservation of Energy**, which states that energy cannot be created or destroyed, only transformed from one form to another.`
    }
    
    return `This concept is fundamental to understanding ${context.subject} and builds on core principles you'll use throughout your learning journey.`
  }

  /**
   * 🔍 Generate micro-sections for completeness
   */
  private generateMicroSections(context: ExplanationContext, adaptations: any): string[] {
    const sections: string[] = []

    // Add micro-sections based on context
    if (context.subject === 'Math' && context.topic === 'Algebra') {
      sections.push(`### How Variables Work
Variables are like placeholders for numbers we don't know yet. They help us write rules and solve problems systematically.`)
      
      sections.push(`### Why We Need Equations
Equations help us find missing information by showing relationships between different quantities. They're like puzzles where we discover the missing piece.`)
    }

    if (context.subject === 'Science' && context.topic.includes('forces')) {
      sections.push(`### How Forces Create Motion
When forces are unbalanced, they cause objects to accelerate. The bigger the force, the faster the change in motion.`)
    }

    return sections
  }

  /**
   * 📝 Generate recap
   */
  private generateRecap(context: ExplanationContext, adaptations: any): string[] {
    const recap = [
      `**Main Concept**: ${context.topic} is about understanding how different parts work together`,
      `**Key Mechanism**: We use systematic approaches to solve problems step by step`,
      `**Important Point**: Practice helps you recognize patterns and solve problems faster`
    ]

    if (adaptations.confidenceBoost) {
      recap.push(`**You've Got This**: Each problem you solve makes you stronger at this!`)
    }

    return recap.slice(0, 3)
  }

  /**
   * 🎯 Generate engagement question
   */
  private generateEngagementQuestion(
    profile: LearningProfile, 
    context: ExplanationContext, 
    adaptations: any
  ) {
    const weakSpot = this.findWeakSpot(profile, context)
    
    // If user is struggling, use reflection questions
    if (weakSpot && weakSpot.masteryLevel < 50) {
      return {
        type: 'reflection' as const,
        question: `In your own words, what part of ${context.topic} makes the most sense to you so far?`
      }
    }

    // If user is doing well, use application questions
    if (weakSpot && weakSpot.masteryLevel > 70) {
      return {
        type: 'application' as const,
        question: `How might you use ${context.topic} to solve a real problem you've encountered?`
      }
    }

    // Default to depth expansion
    return {
      type: 'depth' as const,
      question: `Would you like to explore how ${context.topic} connects to other concepts you're learning?`
    }
  }

  /**
   * 📊 Track explanation effectiveness
   */
  trackExplanationEffectiveness(
    userId: string,
    context: ExplanationContext,
    explanation: AdaptiveExplanation,
    userFeedback: {
      understood: boolean
      confidence: number
      timeSpent: number
      askedQuestions: boolean
    }
  ): void {
    learningIntelligence.trackInteraction(userId, context.subject, context.topic, context.subtopic, {
      type: userFeedback.understood ? 'correct' : 'incorrect',
      confidence: userFeedback.confidence,
      responseTime: userFeedback.timeSpent,
      needsHelp: userFeedback.askedQuestions
    })
  }
}

export const adaptiveExplanationEngine = new AdaptiveExplanationEngine()
