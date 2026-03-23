/**
 * Test script for Enhanced AI System
 * Demonstrates the improved personalization, accuracy, clarity, and engagement
 */

// Mock the enhanced prompt system (for testing without imports)
function createEnhancedPrompt(message, userContext, conversationHistory = [], mode = 'explain') {
  console.log('🤖 Building Enhanced Prompt...\n')
  
  // Simulate the enhanced prompt structure
  let prompt = `You are brAIny, an advanced personalized learning assistant.

=== PERSONALIZATION ENGINE ===
Address the user naturally and adapt to their unique profile:
- Name: ${userContext.displayName || 'Student'}
- Interests: ${userContext.interests?.join(', ') || 'General'}
- Learning Style: ${userContext.learningStyle || 'Adaptive'}
- Preferred Tone: ${userContext.preferredTone || 'Friendly'}

=== ACCURACY & VERIFICATION ===
Ensure every explanation is factually correct:
- Verify all factual statements before including them
- Clarify context when needed
- Define technical terms in parentheses

=== CLARITY & READABILITY ===
Make every explanation easy to understand:
- Use clear headings and subheadings
- Break complex ideas into numbered steps
- Keep sentences short and direct

=== ENGAGEMENT & ANALOGIES ===
Make learning engaging and memorable:
- Create relatable comparisons using user's interests
- Write as if talking to a curious friend
- Add curiosity hooks to encourage exploration

=== MODE: ${mode.toUpperCase()} ===
${getModeInstructions(mode)}

=== CONVERSATION HISTORY ===
${conversationHistory.length > 0 ? conversationHistory.map((msg, i) => `[${i+1}] ${msg.role}: ${msg.content}`).join('\n') : 'New conversation'}

=== CURRENT MESSAGE ===
User: ${message}
Tutor:`

  return prompt
}

function getModeInstructions(mode) {
  const instructions = {
    'explain': 'Start with simplest explanation, use full enhanced structure, provide follow-up suggestions',
    'practice': 'Focus on practical application, provide clear exercises with step-by-step instructions',
    'quiz': 'Generate 3-5 questions based on context, include explanations for answers',
    'flashcard': 'Create simple, memorable flashcards with memory tips'
  }
  return instructions[mode] || instructions['explain']
}

// Mock quality checker
function analyzeQuality(response, userContext, originalMessage) {
  console.log('📊 Analyzing Response Quality...\n')
  
  const metrics = {
    personalization: {
      usesName: userContext.displayName && response.includes(userContext.displayName),
      referencesInterests: userContext.interests?.some(interest => response.toLowerCase().includes(interest.toLowerCase())),
      adaptsToLearningStyle: response.includes(getStyleIndicator(userContext.learningStyle)),
      score: 0
    },
    accuracy: {
      hasContextClarification: /in general|specifically|typically|usually/.test(response),
      definesTechnicalTerms: /\([^)]*\)/.test(response),
      avoidsOvergeneralization: /can be|may|often|sometimes/.test(response),
      score: 0
    },
    clarity: {
      hasStructure: /^#+\s|^\*\s|^\d+\.\s/m.test(response),
      usesSimpleLanguage: response.split('.').reduce((acc, s) => acc + s.split(' ').length, 0) / response.split('.').length <= 20,
      hasVisualHierarchy: /\*\*.*?\*\*|\n\n/.test(response),
      score: 0
    },
    engagement: {
      hasAnalogies: /like|as.*as|similar to|think of it as/i.test(response),
      conversationalTone: /you|your|let's|we/.test(response),
      curiosityHooks: /want to.*\?|would you like/i.test(response),
      score: 0
    }
  }

  // Calculate scores
  Object.keys(metrics).forEach(category => {
    const categoryMetrics = metrics[category]
    const checks = Object.keys(categoryMetrics).filter(key => key !== 'score')
    categoryMetrics.score = checks.filter(key => categoryMetrics[key]).length / checks.length
  })

  const overallScore = Object.values(metrics).reduce((acc, cat) => acc + cat.score, 0) / Object.keys(metrics).length

  return {
    ...metrics,
    overall: {
      score: overallScore,
      meetsStandards: overallScore >= 0.7,
      improvements: generateImprovements(metrics, userContext)
    }
  }
}

function getStyleIndicator(style) {
  const indicators = {
    'visual': 'imagine',
    'step-by-step': 'first',
    'hands-on': 'try',
    'auditory': 'listen'
  }
  return indicators[style] || 'understand'
}

function generateImprovements(metrics, userContext) {
  const improvements = []
  
  if (!metrics.personalization.usesName && userContext.displayName) {
    improvements.push(`Use the user's name (${userContext.displayName}) naturally`)
  }
  
  if (!metrics.personalization.referencesInterests && userContext.interests?.length > 0) {
    improvements.push(`Include examples related to: ${userContext.interests.join(', ')}`)
  }
  
  if (!metrics.clarity.hasStructure) {
    improvements.push('Add structure with headings or bullet points')
  }
  
  if (!metrics.engagement.hasAnalogies) {
    improvements.push('Include relatable analogies')
  }
  
  return improvements
}

// Test the enhanced system
function runTest() {
  console.log('🚀 Testing Enhanced brAIny AI System\n')
  console.log('=' .repeat(60))

  // Sample user context
  const userContext = {
    displayName: 'Alex',
    interests: ['gaming', 'basketball', 'coding'],
    hobbies: ['video games', 'sports', 'programming'],
    learningStyle: 'visual',
    preferredTone: 'friendly',
    learningPace: 'moderate',
    gradeLevel: '10th grade',
    subjects: ['Math', 'Science', 'Computer Science'],
    weakSpots: ['algebra', 'chemistry equations'],
    masteredTopics: ['geometry', 'biology basics']
  }

  // Sample conversation
  const conversationHistory = [
    { role: 'user', content: 'What is photosynthesis?' },
    { role: 'tutor', content: 'Photosynthesis is how plants make their food using sunlight!' }
  ]

  // Test message
  const userMessage = 'Can you explain how photosynthesis works in more detail?'

  console.log('📝 User Context:')
  console.log(JSON.stringify(userContext, null, 2))
  console.log('\n📨 User Message:', userMessage)
  console.log('\n📜 Conversation History:', conversationHistory.length, 'messages')

  // Generate enhanced prompt
  const enhancedPrompt = createEnhancedPrompt(userMessage, userContext, conversationHistory, 'explain')
  
  console.log('\n🤖 Enhanced Prompt Generated:')
  console.log('-'.repeat(40))
  console.log(enhancedPrompt.substring(0, 500) + '...')
  console.log('-'.repeat(40))

  // Simulate AI response
  const simulatedResponse = `Hey Alex! 

**The Simple Big Idea**: Photosynthesis is like a solar-powered food factory for plants.

**Step-by-Step Breakdown**:
1. **Sunlight Capture** (Think of it like charging a solar panel)
2. **Carbon Dioxide Intake** (Plants "breathe in" CO2 through tiny pores)
3. **Water Absorption** (Roots drink water from the soil)
4. **Chemical Magic** (Inside chloroplasts, these ingredients transform)

**Why It Works**: The chlorophyll (green pigment) captures sunlight energy, which powers a chemical reaction that converts CO2 and water into glucose (sugar) and oxygen.

**Relatable Example**: Think of it like this - if you were a gamer, photosynthesis is the plant's way of "farming" experience points. Sunlight is the energy source, CO2 and water are the resources, and glucose is the "XP" the plant uses to level up and grow!

**Quick Check**: What do you think would happen if a plant was kept in a dark room?

Want to see a visual diagram of this process, or would you like to explore how this connects to the gaming concept of resource management?`

  console.log('\n💬 Simulated AI Response:')
  console.log('-'.repeat(40))
  console.log(simulatedResponse)
  console.log('-'.repeat(40))

  // Analyze quality
  const qualityMetrics = analyzeQuality(simulatedResponse, userContext, userMessage)

  console.log('\n📊 Quality Analysis Results:')
  console.log('Overall Score:', Math.round(qualityMetrics.overall.score * 100) + '%')
  console.log('Meets Standards:', qualityMetrics.overall.meetsStandards ? '✅ Yes' : '❌ No')
  
  console.log('\nDetailed Metrics:')
  console.log('🎯 Personalization:', Math.round(qualityMetrics.personalization.score * 100) + '%')
  console.log('  - Uses Name:', qualityMetrics.personalization.usesName ? '✅' : '❌')
  console.log('  - References Interests:', qualityMetrics.personalization.referencesInterests ? '✅' : '❌')
  console.log('  - Adapts to Learning Style:', qualityMetrics.personalization.adaptsToLearningStyle ? '✅' : '❌')
  
  console.log('\n🎯 Accuracy:', Math.round(qualityMetrics.accuracy.score * 100) + '%')
  console.log('  - Context Clarification:', qualityMetrics.accuracy.hasContextClarification ? '✅' : '❌')
  console.log('  - Defines Technical Terms:', qualityMetrics.accuracy.definesTechnicalTerms ? '✅' : '❌')
  console.log('  - Avoids Overgeneralization:', qualityMetrics.accuracy.avoidsOvergeneralization ? '✅' : '❌')
  
  console.log('\n🎯 Clarity:', Math.round(qualityMetrics.clarity.score * 100) + '%')
  console.log('  - Has Structure:', qualityMetrics.clarity.hasStructure ? '✅' : '❌')
  console.log('  - Uses Simple Language:', qualityMetrics.clarity.usesSimpleLanguage ? '✅' : '❌')
  console.log('  - Has Visual Hierarchy:', qualityMetrics.clarity.hasVisualHierarchy ? '✅' : '❌')
  
  console.log('\n🎯 Engagement:', Math.round(qualityMetrics.engagement.score * 100) + '%')
  console.log('  - Has Analogies:', qualityMetrics.engagement.hasAnalogies ? '✅' : '❌')
  console.log('  - Conversational Tone:', qualityMetrics.engagement.conversationalTone ? '✅' : '❌')
  console.log('  - Curiosity Hooks:', qualityMetrics.engagement.curiosityHooks ? '✅' : '❌')

  if (qualityMetrics.overall.improvements.length > 0) {
    console.log('\n💡 Suggested Improvements:')
    qualityMetrics.overall.improvements.forEach((improvement, i) => {
      console.log(`${i + 1}. ${improvement}`)
    })
  }

  console.log('\n' + '=' .repeat(60))
  console.log('🎉 Enhanced AI System Test Complete!')
  console.log('Key Improvements Demonstrated:')
  console.log('✅ Personalized with user name and interests')
  console.log('✅ Structured with clear headings and steps')
  console.log('✅ Engaging analogies (gaming comparison)')
  console.log('✅ Curiosity hooks for continued learning')
  console.log('✅ Technical terms explained simply')
}

// Run the test
runTest()
