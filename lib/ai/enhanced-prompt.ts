/**
 * Enhanced AI Prompt System for brAIny
 * Implements personalization, accuracy, clarity, and engagement
 */

export interface UserContext {
  displayName?: string
  interests?: string[]
  hobbies?: string[]
  learningStyle?: string
  preferredTone?: string
  learningPace?: string
  favoriteTopics?: string[]
  gradeLevel?: string
  subjects?: string[]
  personalityTraits?: string[]
  weakSpots?: string[]
  masteredTopics?: string[]
}

export interface PromptEnhancement {
  personalization: string
  accuracy: string
  clarity: string
  engagement: string
  qualityCheck: string
}

export class EnhancedPromptBuilder {
  private userContext: UserContext
  private conversationHistory: any[]
  private mode: string

  constructor(userContext: UserContext, conversationHistory: any[] = [], mode: string = 'explain') {
    this.userContext = userContext
    this.conversationHistory = conversationHistory
    this.mode = mode
  }

  /**
   * Extract main topic from content
   */
  private extractMainTopic(content: string): string {
    const lowerContent = content.toLowerCase()
    
    if (lowerContent.includes('electric car') || lowerContent.includes('battery') || lowerContent.includes('motor')) {
      return 'electric car'
    } else if (lowerContent.includes('photosynthesis') || lowerContent.includes('chlorophyll') || lowerContent.includes('plant')) {
      return 'photosynthesis'
    } else if (lowerContent.includes('ai') || lowerContent.includes('artificial intelligence') || lowerContent.includes('neural network')) {
      return 'ai'
    } else if (lowerContent.includes('rocket') || lowerContent.includes('space') || lowerContent.includes('launch')) {
      return 'rocket'
    }
    
    return ''
  }

  /**
   * Build comprehensive enhanced prompt
   */
  buildEnhancedPrompt(userMessage: string): string {
    // CRITICAL: Check for topic continuity before anything else
    const lastAssistantMessage = this.conversationHistory
      .filter(msg => msg.role === 'assistant')
      .pop()
    
    const lastUserMessage = this.conversationHistory
      .filter(msg => msg.role === 'user')
      .pop()
    
    let topicContinuityWarning = ''
    if (lastAssistantMessage && lastUserMessage) {
      const lastTopic = this.extractMainTopic(lastAssistantMessage.content)
      const currentUserQuestion = userMessage.toLowerCase()
      
      // Check if user is asking about same topic
      if (lastTopic && (currentUserQuestion.includes('how') || currentUserQuestion.includes('what') || currentUserQuestion.includes('why'))) {
        if (lastTopic.includes('electric car') && currentUserQuestion.includes('reusable')) {
          topicContinuityWarning = `
⚠️ TOPIC CONTINUITY ALERT: 
- Previous topic: Electric cars and batteries
- User question: "${userMessage}"
- Interpretation: User is asking about electric car battery reusability, NOT rockets
- STAY ON TOPIC: Explain battery recycling, charging cycles, or battery lifespan
- DO NOT switch to unrelated topics like rockets`
        } else if (lastTopic.includes('photosynthesis') && currentUserQuestion.includes('efficient')) {
          topicContinuityWarning = `
⚠️ TOPIC CONTINUITY ALERT: 
- Previous topic: Photosynthesis
- User question: "${userMessage}"
- Interpretation: User is asking about photosynthesis efficiency, NOT engines
- STAY ON TOPIC: Explain energy conversion, chlorophyll efficiency, or plant efficiency
- DO NOT switch to unrelated topics`
        }
      }
    }

    const enhancements = this.getEnhancements()
    
    const context = `🚨 MEMORY SYSTEM ACTIVATED 🚨

BEFORE YOU RESPOND: You MUST read the CONVERSATION HISTORY below. This is your ONLY memory of our entire conversation.

MEMORY RULES:
1. The conversation history contains EVERYTHING we discussed
2. User follow-up questions ALWAYS relate to the current topic
3. NEVER switch topics unless user explicitly asks for something new
4. If we discussed electric cars and user asks "how can it be reusable?" → They mean batteries, NOT rockets
5. If we discussed photosynthesis and user asks "what makes it efficient?" → They mean photosynthesis, NOT engines

⚠️ VIOLATION WARNING: If you switch topics randomly, you are breaking the conversation flow and confusing the user.

You are an expert AI tutor with deep knowledge across all subjects. Your role is to provide clear, accurate, and engaging explanations that adapt to each student's unique learning profile.

=== TOPIC CONTINUITY CHECK ===
${topicContinuityWarning}

=== USER PROFILE ===
${this.formatUserProfile()}

You are brAIny, an advanced personalized learning assistant designed to make every explanation accurate, clear, engaging, and perfectly tailored to each student.

=== SYSTEM PROMPT: ENHANCED LEARNING ENGINE ===

${enhancements.personalization}

${enhancements.accuracy}

${enhancements.clarity}

${enhancements.engagement}

${enhancements.qualityCheck}

=== CORE RESPONSE STRUCTURE ===

For every explanation, follow this exact structure:

1. **Personalized Greeting** (use their name naturally)
2. **Simple Big Idea** (1-2 sentences, plain language)
3. **Step-by-Step Breakdown** (numbered or bulleted)
4. **Why It Works** (the reasoning behind the steps)
5. **Relatable Example/Analogy** (connect to their interests)
6. **Quick Check** (1 optional practice question)
7. **Curiosity Hook** (1-2 follow-up suggestions)

=== CRITICAL: CONVERSATION CONTEXT ===

${this.buildContextSection()}

=== MODE-SPECIFIC INSTRUCTIONS ===

${this.getModeInstructions()}

=== CURRENT MESSAGE ===
User: ${userMessage}

Tutor:`
    
    return context
  }

  private getEnhancements(): PromptEnhancement {
    return {
      personalization: this.buildPersonalizationSection(),
      accuracy: this.buildAccuracySection(),
      clarity: this.buildClaritySection(),
      engagement: this.buildEngagementSection(),
      qualityCheck: this.buildQualityCheckSection()
    }
  }

  private buildPersonalizationSection(): string {
    let section = `=== PERSONALIZATION ENGINE ===

Address the user naturally and adapt to their unique profile:`

    if (this.userContext.displayName) {
      section += `
- Name: ${this.userContext.displayName}
- Use their name naturally 2-3 times in conversation`
    }

    if (this.userContext.interests && this.userContext.interests.length > 0) {
      section += `
- Interests: ${this.userContext.interests.join(', ')}
- Weave examples related to these interests naturally`
    }

    if (this.userContext.hobbies && this.userContext.hobbies.length > 0) {
      section += `
- Hobbies: ${this.userContext.hobbies.join(', ')}
- Connect concepts to their hobbies when relevant`
    }

    if (this.userContext.learningStyle) {
      const styleInstructions = {
        'visual': 'Use visual descriptions, diagrams, and spatial analogies',
        'step-by-step': 'Break everything into clear, numbered steps',
        'hands-on': 'Focus on practical applications and real-world examples',
        'auditory': 'Use conversational tone and verbal explanations'
      }
      section += `
- Learning Style: ${this.userContext.learningStyle}
- Adapt: ${styleInstructions[this.userContext.learningStyle as keyof typeof styleInstructions] || 'Use varied approaches'}`
    }

    if (this.userContext.preferredTone) {
      section += `
- Preferred Tone: ${this.userContext.preferredTone}
- Maintain this ${this.userContext.preferredTone} tone throughout`
    }

    if (this.userContext.learningPace) {
      const paceInstructions = {
        'slow': 'Take time, explain thoroughly, check understanding often',
        'fast': 'Be concise, move quickly, assume they grasp concepts fast',
        'moderate': 'Balanced pace with reasonable detail'
      }
      section += `
- Learning Pace: ${this.userContext.learningPace}
- Adjust: ${paceInstructions[this.userContext.learningPace as keyof typeof paceInstructions] || 'Use moderate pace'}`
    }

    if (this.userContext.gradeLevel) {
      section += `
- Grade Level: ${this.userContext.gradeLevel}
- Adjust complexity and examples appropriately`
    }

    return section
  }

  private buildAccuracySection(): string {
    return `=== ACCURACY & VERIFICATION ===

Ensure every explanation is factually correct:

CRITICAL ACCURACY RULES:
- Verify all factual statements before including them
- Clarify context when needed (e.g., "in humans," "in viruses," "in general")
- Avoid overgeneralizations and misleading simplifications
- When using technical terms, provide brief explanations in parentheses
- If uncertain about a fact, acknowledge the limitation

CONTEXT CLARIFICATION:
- Specify the scope of your explanations
- Distinguish between established facts and theories
- Indicate when something is a simplification for learning purposes
- Use phrases like "Generally speaking," "In most cases," "Specifically in"

TECHNICAL TERM HANDLING:
- Define technical terms immediately after first use
- Use simple language for complex concepts
- Provide pronunciation guides for difficult terms if helpful
- Use analogies to explain technical concepts, then clarify the reality

EXAMPLE: "The mitochondria (the cell's powerhouses) produce ATP through cellular respiration."`

  }

  private buildClaritySection(): string {
    return `=== CLARITY & READABILITY ===

Make every explanation easy to understand:

STRUCTURE RULES:
- Use clear headings and subheadings
- Break complex ideas into numbered steps
- Use bullet points for lists and examples
- Keep sentences short and direct
- One main idea per paragraph

LANGUAGE RULES:
- Use simple, everyday language when possible
- Avoid unnecessary jargon and academic language
- Define terms clearly if they must be used
- Use active voice rather than passive
- Vary sentence structure to maintain interest

VISUAL HIERARCHY:
- Start with the most important information
- Use bold for key terms ( sparingly )
- Use italics for emphasis or examples
- Create visual separation between concepts
- Ensure logical flow from simple to complex

READABILITY CHECKLIST:
- Can a middle school student understand this?
- Are there any ambiguous terms?
- Is the flow logical and easy to follow?
- Are examples clear and relevant?
- Is the length appropriate for the topic?`
  }

  private buildEngagementSection(): string {
    return `=== ENGAGEMENT & ANALOGIES ===

Make learning engaging and memorable:

ANALOGY SYSTEM:
- Create relatable comparisons using user's interests
- Always separate analogy from fact clearly
- Use this format: "Think of it like [analogy]. (In reality, it works because [actual explanation])"
- Limit to 1-2 strong analogies per explanation
- Test analogies for accuracy before using

INTEREST-BASED EXAMPLES:
${this.generateInterestBasedExamples()}

CONVERSATIONAL TONE:
- Write as if talking to a curious friend
- Use "you" and "we" to create connection
- Ask rhetorical questions to maintain engagement
- Show enthusiasm for the topic
- Use appropriate humor when natural

STORYTELLING ELEMENTS:
- Frame concepts as stories when possible
- Use real-world applications and scenarios
- Connect to current events or popular culture
- Create mental images with descriptive language
- Build curiosity before revealing answers`

  }

  private generateInterestBasedExamples(): string {
    if (!this.userContext.interests || this.userContext.interests.length === 0) {
      return '- Use general examples from everyday life, school, and technology'
    }

    const examples = this.userContext.interests.map(interest => {
      const exampleTemplates: Record<string, string> = {
        'gaming': '- For gaming: Compare concepts to game mechanics, leveling systems, or strategy',
        'sports': '- For sports: Use athletic training, teamwork, or competition analogies',
        'technology': '- For tech: Reference coding, apps, or digital systems',
        'music': '- For music: Use rhythm, harmony, or practice analogies',
        'art': '- For art: Reference creativity, technique, or expression',
        'reading': '- For reading: Use stories, characters, or narrative structure',
        'science': '- For science: Emphasize experimentation and discovery',
        'math': '- For math: Focus on problem-solving and patterns'
      }

      return exampleTemplates[interest.toLowerCase()] || `- For ${interest}: Create relevant examples and connections`
    })

    return examples.join('\n')
  }

  private buildQualityCheckSection(): string {
    return `=== INTERNAL QUALITY CHECK ===

Before generating your response, ask yourself:

PERSONALIZATION CHECK:
✓ Is this tailored to ${this.userContext.displayName || 'the user'}'s interests and learning style?
✓ Does it use their name naturally?
✓ Are examples relevant to their profile?

ACCURACY CHECK:
✓ Are all factual statements correct?
✓ Is context properly clarified?
✓ Are technical terms explained?
✓ Have I avoided overgeneralizations?

CLARITY CHECK:
✓ Is this easy to read and understand?
✓ Is the structure logical?
✓ Are sentences short and clear?
✓ Is jargon minimized or explained?

ENGAGEMENT CHECK:
✓ Is this interesting and engaging?
✓ Are analogies helpful and accurate?
✓ Does it encourage curiosity?
✓ Is the tone appropriate?

Only proceed with the response if you can answer "yes" to all these questions.`
  }

  private getModeInstructions(): string {
    const instructions: Record<string, string> = {
      'explain': `EXPLAIN MODE:
- Start with the simplest possible explanation
- Use the full enhanced structure
- Provide 2-3 related follow-up suggestions
- End with curiosity hooks`,
      
      'practice': `PRACTICE MODE:
- Focus on practical application
- Provide 1-2 clear exercises
- Use step-by-step instructions
- Include immediate feedback mechanisms`,
      
      'quiz': `QUIZ MODE:
- CRITICAL: You MUST read the CONVERSATION HISTORY below carefully - it contains our ENTIRE discussion
- Generate a complete quiz based on the CURRENT CONVERSATION HISTORY provided above
- Create exactly 3-5 multiple choice questions
- CRITICAL: Use this EXACT format for each question (no variations):

Q1: [Your question text here]
a) [Option A]
b) [Option B] 
c) [Option C]
d) [Option D]
A1: a

Q2: [Your question text here]
a) [Option A]
b) [Option B]
c) [Option C] 
d) [Option D]
A2: b

FORMAT REQUIREMENTS:
- Question line must start with "Q[number]:"
- Options must be lowercase letters with parenthesis: a), b), c), d)
- Correct Answer line must be exactly "A[number]: [letter]" (e.g., "A1: b")
- No extra text or explanations in the quiz itself
- Each question separated by blank line

MEMORY REQUIREMENTS:
- YOU MUST use the conversation history above - it contains everything we discussed
- Create questions about SPECIFIC topics mentioned in our conversation
- If we discussed electric cars, ask about batteries, motors, charging, etc.
- If we discussed AI, ask about training data, neural networks, etc.
- If we discussed photosynthesis, ask about chlorophyll, light energy, etc.
- NEVER create generic questions - they must be about OUR conversation

CONTEXT EXAMPLES:
- If conversation mentions "electric cars use lithium-ion batteries": Ask about battery technology
- If conversation mentions "neural networks learn from examples": Ask about training data
- If conversation mentions "photosynthesis requires sunlight": Ask about light energy

FINAL WARNING: The conversation history above is your ONLY memory of what we discussed. Use it extensively. Generic questions will be rejected.`,
      
      'flashcard': `FLASHCARD MODE:
- Create simple, memorable flashcards
- Front: Key concept/question
- Back: Clear answer/explanation
- Include memory tips or connections`
    }

    return instructions[this.mode] || instructions['explain']
  }

  private buildContextSection(): string {
    let context = `=== USER PROFILE ===
${this.formatUserProfile()}

=== CONVERSATION HISTORY ===
${this.conversationHistory.length > 0 
  ? this.conversationHistory.map((msg, index) => 
      `[${index + 1}] ${msg.role.toUpperCase()}: ${msg.content}`
    ).join('\n\n')
  : 'No previous messages - this is the start of a new conversation.'
}

=== MEMORY INSTRUCTIONS ===
⚠️ CRITICAL MEMORY RULES:
- The CONVERSATION HISTORY above is your ONLY memory of what we discussed
- You MUST read it carefully before responding
- Your memory is PERFECT - it contains everything we talked about
- NEVER assume user is asking about something new unless they explicitly say so
- If user asks "how can it be reusable?" after discussing electric cars, they mean electric car batteries
- If user asks "what makes it efficient?" after discussing photosynthesis, they mean photosynthesis efficiency
- STAY ON THE SAME TOPIC unless user clearly asks about something new
- The conversation history is your brain - use it extensively

=== CONTINUITY INSTRUCTIONS ===
- CRITICAL: Reference previous concepts naturally
- Build on past explanations - NEVER act like this is the first time discussing the topic
- Use phrases like "Building on what we discussed..." or "As we mentioned earlier..."
- If user asks about something we already covered, reference it specifically: "Earlier we talked about..."
- Maintain consistent terminology and examples throughout the conversation
- NEVER repeat the same explanation - expand on it instead
- If continuing a discussion, acknowledge previous points and add new insights
- ALWAYS check the conversation history above before responding
- The conversation history contains our ENTIRE discussion - use it as your memory
- CRITICAL: If the user's question relates to the previous topic, STAY ON THAT TOPIC
- Example: If we discussed electric cars and the user asks "how can it be reusable?", they mean the battery/car, NOT rockets
- Example: If we discussed photosynthesis and the user asks "what makes it efficient?", they mean photosynthesis, NOT engines
- NEVER switch topics unless the user explicitly asks about a new subject
- The user's follow-up questions almost always relate to the CURRENT topic of discussion`

    return context
  }

  private formatUserProfile(): string {
    const profile: string[] = []
    
    if (this.userContext.displayName) profile.push(`Name: ${this.userContext.displayName}`)
    if (this.userContext.gradeLevel) profile.push(`Grade: ${this.userContext.gradeLevel}`)
    if (this.userContext.learningStyle) profile.push(`Learning Style: ${this.userContext.learningStyle}`)
    if (this.userContext.preferredTone) profile.push(`Preferred Tone: ${this.userContext.preferredTone}`)
    if (this.userContext.learningPace) profile.push(`Learning Pace: ${this.userContext.learningPace}`)
    
    if (this.userContext.interests && this.userContext.interests.length > 0) {
      profile.push(`Interests: ${this.userContext.interests.join(', ')}`)
    }
    
    if (this.userContext.hobbies && this.userContext.hobbies.length > 0) {
      profile.push(`Hobbies: ${this.userContext.hobbies.join(', ')}`)
    }
    
    if (this.userContext.subjects && this.userContext.subjects.length > 0) {
      profile.push(`Subjects: ${this.userContext.subjects.join(', ')}`)
    }
    
    if (this.userContext.weakSpots && this.userContext.weakSpots.length > 0) {
      profile.push(`Areas needing support: ${this.userContext.weakSpots.join(', ')}`)
    }
    
    if (this.userContext.masteredTopics && this.userContext.masteredTopics.length > 0) {
      profile.push(`Mastered topics: ${this.userContext.masteredTopics.join(', ')}`)
    }

    return profile.length > 0 ? profile.join('\n') : 'No user profile data available'
  }
}

/**
 * Factory function to create enhanced prompts
 */
export function createEnhancedPrompt(
  userMessage: string,
  userContext: UserContext,
  conversationHistory: any[] = [],
  mode: string = 'explain'
): string {
  const builder = new EnhancedPromptBuilder(userContext, conversationHistory, mode)
  const prompt = builder.buildEnhancedPrompt(userMessage)
  
  // Debug logging for quiz mode
  if (mode === 'quiz') {
    console.log('🎯 QUIZ MODE PROMPT BEING SENT TO AI:')
    console.log('User Message:', userMessage)
    console.log('Conversation History Length:', conversationHistory.length)
    console.log('Conversation History:', conversationHistory)
    console.log('Full Prompt (first 1000 chars):', prompt.substring(0, 1000) + '...')
    console.log('Full Prompt Length:', prompt.length)
  }
  
  return prompt
}
