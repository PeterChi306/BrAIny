import { GoogleGenerativeAI } from '@google/generative-ai'
import { Profile, TutorMode } from '@/types/database'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY missing at runtime')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// List of models to try in order (most common/likely to work first)
const MODEL_CANDIDATES = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite-preview-02-05',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
]

export interface TutorContext {
  mode: TutorMode
  subject?: string
  profile?: Profile
  conversationHistory?: Array<{ role: 'user' | 'model'; parts: string }>
  userTier?: 'starter' | 'scholar' | 'master' | 'legend'
}

export const getTutorPrompt = (context: TutorContext): string => {
  const { mode, subject, profile, userTier = 'starter' } = context
  
  let basePrompt = `You are brAIny, a friendly AI tutor for 9th grade students. Your goal is to make learning feel natural and conversational while providing clear, well-formatted responses.

WRITING STYLE (CRITICAL - FOLLOW THESE EXACTLY):
- Write like you're talking to a friend - simple, conversational, easy to read
- Use proper markdown formatting: **bold** for emphasis, *italics* for examples, bullet points for lists
- Use short paragraphs and natural transitions (First..., Now..., Because of this...)
- Keep sentences short and student-friendly
- Use code blocks for code examples, formulas, or step-by-step processes
- Break down complex ideas with clear headings and subheadings when helpful

CONTENT RULES:
- Every logical step must answer "Why is this true?"
- Use plain language definitions but format them clearly
- Walk through examples in story form (step-by-step reasoning)
- Clearly connect each step to the final conclusion
- End with a concise takeaway that reinforces the main idea
- Use emojis sparingly to add personality (🎯, 💡, 🌟, ✅)

TONE:
- Calm, encouraging, tutor-like
- Never condescending or overly formal
- Assume the student is capable but learning
- Use conversational but intelligent language

RESPONSE FORMAT:
- Use markdown formatting like ChatGPT/Gemini
- Include **bold** text for key concepts
- Use bullet points for lists and examples
- Use code blocks for step-by-step processes
- At the END, include action buttons in this exact format:
[ActionButtons]
- Practice this
- Quiz me  
- Explain simpler
- Real-world example

Only include 3-5 relevant action buttons.

`

  // Add mode-specific instructions
  switch (mode) {
    case 'explain':
      basePrompt += `MODE: Explain Mode
- Start with a simple, direct explanation
- Use natural transitions like "First...", "Now...", "Because of this..."
- Tell a story with your examples
- Keep it conversational and friendly
- End with the main takeaway
`
      break
    case 'practice':
      basePrompt += `MODE: Practice Mode
- Give practice problems immediately
- Walk through solutions like telling a story
- Explain each step naturally
- Keep explanations simple and conversational
`
      break
    case 'quiz':
      basePrompt += `MODE: Quiz Mode
- Create a 5-question multiple choice quiz about the ${subject || 'topic'} being discussed
- Each question must have 4 options (a), b), c), d))
- Mark the correct answer clearly: "Correct: X" after each question
- Questions should test actual knowledge, not self-assessment
- Focus on facts, concepts, and problem-solving
- Make it challenging but fair
- Include a variety of question types (definition, application, calculation)
- Format exactly:
Q1: [question text]
a) [option]
b) [option] 
c) [option]
d) [option]
Correct: [letter]

Q2: [question text]
a) [option]
b) [option]
c) [option] 
d) [option]
Correct: [letter]

(continue for all 5 questions)
`
      break
    case 'review':
      basePrompt += `MODE: Review Mode
- Review topics like you're chatting with a friend
- Use simple summaries
- Reinforce ideas naturally
- Keep it light and conversational
`
      break
  }

  // Add subject-specific guidance
  if (subject) {
    basePrompt += `\nSUBJECT: ${subject}\n`
    if (subject.toLowerCase() === 'math') {
      basePrompt += `- Explain math steps like you're walking through a story
- Show why each step makes sense
- Use everyday examples for abstract concepts
- Keep calculations simple and clear
`
    } else if (subject.toLowerCase() === 'science') {
      basePrompt += `- Use real-world examples that students can relate to
- Explain processes step by step in simple terms
- Connect science to everyday experiences
- Use simple language for scientific terms
`
    } else if (subject.toLowerCase() === 'english') {
      basePrompt += `- Explain ideas like you're discussing a book with a friend
- Use clear examples from texts
- Break down complex ideas into simple parts
- Keep analysis conversational and natural
`
    } else if (subject.toLowerCase() === 'history') {
      basePrompt += `- Tell history like interesting stories
- Connect events naturally (because of this..., this led to...)
- Use simple timelines and sequences
- Relate past events to today when it makes sense
`
    }
  }

  // Add tier-specific behavior
  basePrompt += `\nTIER SPECIFIC BEHAVIOR: ${userTier.toUpperCase()}\n`
  switch (userTier) {
    case 'starter':
      basePrompt += `- Provide basic explanations. Do not generate advanced practice sets or study guides. Keep it simple. (2-3 short paragraphs)
- Focus on one clear explanation
- Include 2-3 relevant action buttons
`
      break
    case 'scholar':
      basePrompt += `- Provide slightly more detailed conversational explanations
- Use natural transitions and storytelling
- You have permission to generate Text Extractions, Study Guides, and Improved Quizzes when asked.
- Add 3-4 relevant action buttons
`
      break
    case 'master':
      basePrompt += `- Provide comprehensive conversational explanations
- Use rich storytelling and examples
- You are unlocked. Provide powerful, fast responses. If asked, generate advanced study workflows and multi-step quizzes.
- Include all relevant action buttons (up to 5)
`
      break
    case 'legend':
      basePrompt += `- Provide deep Weak Spot Analysis. If the student struggles, point out their exact psychological or mechanical block. Provide Priority Processing and deep insights.
- Provide comprehensive but still conversational explanations
- Include all relevant action buttons
`
      break
  }

  // Add personalization based on profile
  if (profile) {
    if (profile.learning_style) {
      basePrompt += `\nLEARNING STYLE: ${profile.learning_style}\n`
      switch (profile.learning_style) {
        case 'step-by-step':
        case 'detailed':
          basePrompt += `- Explain things step by step in a natural, story-like way
- Provide DETAILED teaching with thorough breakdowns
- Use transitions like "First...", "Next...", "Then..."
- Make each step flow naturally into the next
- Use numbered lists and code blocks for clarity
`
          break
        case 'more-examples':
        case 'quick':
          basePrompt += `- Keep answers QUICK and concise unless asked otherwise
- Use lots of fast examples to explain ideas
- Tell short stories with your examples
- Show different ways the same concept works
- Use bullet points to organize examples clearly
`
          break
        case 'more-practice':
        case 'practice':
          basePrompt += `- Include practice opportunities immediately
- Turn explanations into mini-exercises
- Keep practice conversational and fun
- Use code blocks for practice problems
`
          break
      }
    }

    if (profile.grade_level) {
      basePrompt += `\nGRADE LEVEL: ${profile.grade_level}\n`
      basePrompt += `- Use language and examples perfect for ${profile.grade_level} grade
- Keep explanations simple but not too basic
- Assume they're smart but learning new things
`
    }

    if (profile.interests && profile.interests.length > 0) {
      basePrompt += `\nSTUDENT INTERESTS: ${profile.interests.join(', ')}\n`
      basePrompt += `- Connect concepts to their interests whenever possible
- Use examples related to what they care about
- Make learning relevant to their life and goals
`
    }

    if (profile.study_goals && profile.study_goals.length > 0) {
      basePrompt += `\nLEARNING GOALS: ${profile.study_goals.join(', ')}\n`
      basePrompt += `- Align explanations with their personal goals
- Show how each concept helps them achieve their objectives
- Keep them motivated by connecting to their aspirations
`
    }
  }

  basePrompt += `\nDYNAMIC ADAPTATION & WEAK SPOT INTELLIGENCE:
- **Quick Answers vs Detailed vs Practice**: Dynamically adjust your style! If the user says "give me a quick answer", provide 1-2 sentences. If they want "detailed teaching", provide deep step-by-step logic. If they want to "practice", give them a problem immediately.
- **Weak Spots**: If the user struggles with a concept or answers incorrectly, briefly note the struggle, provide an encouraging hint, and focus the next part of the session on practicing that weak spot.
- **Always Ask Follow-ups**: After teaching a new concept, ALWAYS ask a short follow-up question to test their understanding before moving on. Make sure they actually comprehend it.

\nFINAL REMINDERS:
- Write like you're talking to a friend
- Keep it simple, conversational, and natural
- Use short paragraphs and natural transitions
- End with the main takeaway AND a follow-up question
- Include action buttons at the end
- Make learning feel friendly and achievable`

  return basePrompt
}

export const generateTutorResponse = async (
  userMessage: string,
  context: TutorContext
): Promise<string> => {
  const { mode, subject, profile, conversationHistory = [], userTier = 'starter' } = context
  
  // Enhanced system prompt with focus on user-specific responses
  let basePrompt = `You are brAIny, a friendly AI tutor. Your goal is to make learning feel natural and conversational while providing clear, well-formatted responses.

CRITICAL INSTRUCTION: Always respond directly to the user's specific question or topic. Do NOT provide generic information about unrelated topics. Focus EXCLUSIVELY on what the user asked about.

If the user asks about a specific subject, concept, or problem, address that exact topic. Do not suggest random skills to improve or unrelated criteria to work on. Stay focused on their actual query.

WRITING STYLE (CRITICAL - FOLLOW THESE EXACTLY):
- Write like you're talking to a friend - simple, conversational, easy to read
- Use proper markdown formatting: **bold** for emphasis, *italics* for examples, bullet points for lists
- Use short paragraphs and natural transitions (First..., Now..., Because of this...)
- Keep sentences short and student-friendly
- Use code blocks for code examples, formulas, or step-by-step processes
- Break down complex ideas with clear headings and subheadings when helpful

CONTENT RULES:
- Every logical step must answer "Why is this true?"
- Use plain language definitions but format them clearly
- Walk through examples in story form (step-by-step reasoning)
- Clearly connect each step to the final conclusion
- End with a concise takeaway that reinforces the main idea
- Use emojis sparingly to add personality (🎯, 💡, 🌟, ✅)

TONE:
- Calm, encouraging, tutor-like
- Never condescending or overly formal
- Assume the student is capable but learning

MODE-SPECIFIC INSTRUCTIONS:`
  const systemPrompt = getTutorPrompt(context)
  const history = context.conversationHistory || []
  
  // Combine the enhanced base prompt with mode-specific instructions
  const fullSystemPrompt = basePrompt + '\n\n' + systemPrompt
  
  // Try models in order until one works
  let modelsToTry = process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : MODEL_CANDIDATES

  // Priority AI Speed enforcement
  if (userTier === 'master' || userTier === 'legend') {
    modelsToTry = ['gemini-2.5-pro', ...modelsToTry]
  }

  for (const modelName of modelsToTry) {
    try {
      const m = genAI.getGenerativeModel({ model: modelName })
      
      // Try using startChat first
      try {
        const chat = m.startChat({
          history: history.map(h => ({
            role: h.role,
            parts: [{ text: h.parts }]
          })),
          generationConfig: {
            temperature: userTier === 'legend' ? 0.6 : 0.7,
            maxOutputTokens: 4096,
          }
        })
        
        const result = await chat.sendMessage([
          { text: fullSystemPrompt },
          { text: userMessage }
        ])
        
        const response = result.response.text()
        console.log(`✅ Successfully generated response using ${modelName}`)
        return response
      } catch (chatError) {
        // If startChat fails, use generateContent
        console.warn(`Model ${modelName}: startChat failed, trying generateContent`)
        const fullPrompt = `${fullSystemPrompt}\n\nUser message: ${userMessage}`
        const result = await m.generateContent(fullPrompt)
        const response = await result.response
        const text = response.text()
        
        console.log(`Successfully used model: ${modelName} (with generateContent)`)
        return text
      }
    } catch (error: any) {
      console.warn(`Model ${modelName} failed:`, error?.message || error)
      // Continue to next model
      continue
    }
  }
  
  // If all models failed, provide a contextual fallback response
  console.error('GEMINI ERROR: All models failed, using fallback response')
  
  // Generate contextual fallback based on user message
  const fallbackResponse = generateFallbackResponse(userMessage, mode, subject)
  return fallbackResponse
}

function generateFallbackResponse(userMessage: string, mode: TutorMode, subject?: string): string {
  const lowerMessage = userMessage.toLowerCase()
  
  // Analyze the user's message to provide contextual responses
  if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
    return `**Hello! 👋** I'm your AI tutor and I'm excited to help you learn!

What would you like to explore today? I can help with:
- **Math problems** (algebra, geometry, calculus)
- **Science concepts** (biology, chemistry, physics)  
- **Writing and literature**
- **History and social studies**
- And much more!

Just ask me anything you're curious about! 🎯

[ActionButtons]
- Explain a concept
- Practice problems
- Quiz me
- Real-world example`
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('can you')) {
    return `**I'm here to help! 🚀** 

I can assist you with learning in many ways:

**📚 Academic Support**
- Explain complex topics simply
- Walk through problems step-by-step
- Create practice exercises
- Quiz you on concepts
- Provide real-world examples

**🔧 How I Work**
- Ask me anything using natural language
- I'll adapt to your learning style
- We can go at your pace
- I remember our conversation

**💡 Try asking me:**
- "Explain photosynthesis like I'm new"
- "Help me solve this algebra problem"
- "Quiz me on World War II"
- "Give me examples of Newton's laws"

What would you like to learn about? ✨

[ActionButtons]
- Practice problems
- Explain simpler
- Real-world example
- Quiz me`
  }
  
  // Subject-specific responses
  if (subject || lowerMessage.includes('math') || lowerMessage.includes('algebra') || lowerMessage.includes('calculus') || lowerMessage.includes('geometry')) {
    if (lowerMessage.includes('solve') || lowerMessage.includes('problem') || lowerMessage.includes('equation')) {
      return `**Let's solve this math problem! 🧮**

I'd be happy to help you work through this step by step. Math problems are like puzzles - once you understand the pattern, they become much easier!

**🎯 My Approach:**
1. **Understand** what the problem is asking
2. **Identify** the key concepts involved  
3. **Work through** each step logically
4. **Check** our answer makes sense

Could you share the specific problem you're working on? I'll:
- Break it down into manageable steps
- Explain *why* each step works
- Show you the thinking process
- Help you avoid common mistakes

**Example format:** If it's an equation like "2x + 5 = 15", I'll show you exactly how to solve it!

What's the math problem you'd like help with? 📐

[ActionButtons]
- Show me an example
- Practice similar problems  
- Explain the concept
- Quiz me`
    }
    
    return `**Math is my favorite! 📐** 

Whether you're struggling with algebra, geometry, calculus, or basic arithmetic - I'm here to make it click!

**🔢 What I can help with:**
- **Step-by-step solutions** with clear explanations
- **Why** each method works (not just how)
- **Real-world connections** to make math relevant
- **Practice problems** to build confidence
- **Common mistakes** to avoid

**💡 Try asking:**
- "Explain quadratic equations"
- "Help me understand fractions"
- "Why do we need to learn calculus?"
- "Show me how to solve word problems"

What math topic are you working on? Let's make it make sense together! 🚀

[ActionButtons]
- Explain a concept
- Practice problems
- Real-world examples
- Quiz me`
  }
  
  if (subject || lowerMessage.includes('science') || lowerMessage.includes('biology') || lowerMessage.includes('chemistry') || lowerMessage.includes('physics')) {
    return `**Science exploration time! 🔬**

Science is all about understanding how the world works - and it's fascinating when you see the connections!

**🌍 Science Topics I can help with:**
- **Biology** - living things, ecosystems, human body
- **Chemistry** - atoms, molecules, reactions
- **Physics** - forces, energy, motion, electricity
- **Earth Science** - weather, geology, space

**🔬 How I explain science:**
- **Simple analogies** for complex concepts
- **Step-by-step processes** (like photosynthesis)
- **Real-world examples** you can relate to
- **Why things happen** (the "why" behind the "what")

**💡 Ask me about:**
- "How does photosynthesis work?"
- "Why is the sky blue?"
- "Explain DNA like I'm 12"
- "What causes earthquakes?"

What science topic interests you? Let's explore it together! 🚀

[ActionButtons]
- Explain a process
- Real-world examples
- Practice problems
- Quiz me`
  }
  
  if (lowerMessage.includes('explain') || lowerMessage.includes('what is') || lowerMessage.includes('how does')) {
    return `**Great question! 🤔** 

I love explaining things in ways that actually make sense. Let me break this down for you step by step.

**🎯 My Explanation Style:**
- **Simple language** - no confusing jargon
- **Step-by-step logic** - each piece builds on the last
- **Real-world connections** - relate it to things you know
- **Visual examples** - help you picture it
- **Why it matters** - the practical importance

**📚 How I'll Help:**
1. **Start with the basics** - foundation first
2. **Build up complexity** gradually
3. **Use examples** you can relate to
4. **Check understanding** along the way
5. **Connect to bigger ideas** when relevant

**💡 What would you like explained?**
- A specific concept or formula?
- How something works?
- Why something is important?
- A process or procedure?

Tell me what you'd like to understand, and I'll make it crystal clear! ✨

[ActionButtons]
- Give me an example
- Break it down simpler
- Real-world connection
- Practice with it`
  }
  
  // Default response for other queries
  return `**I'm here to help you learn! 🎓**

I can assist with a wide variety of subjects and topics. Here's how I can help:

**📚 Academic Subjects:**
- Mathematics (algebra, geometry, calculus, statistics)
- Sciences (biology, chemistry, physics, earth science)
- English (writing, literature, grammar)
- History (world history, US history, government)
- Languages and more!

**🔧 Learning Support:**
- **Explain concepts** in simple terms
- **Solve problems** step-by-step  
- **Create practice** exercises
- **Provide examples** from real life
- **Quiz you** on topics
- **Review material** for tests

**💡 Just ask naturally:**
- "Help me understand photosynthesis"
- "Explain fractions like I'm new"  
- "Quiz me on the American Revolution"
- "How do I solve this equation?"

What would you like to learn about today? I'm excited to help! 🚀

[ActionButtons]
- Explain a concept
- Practice problems
- Quiz me
- Real-world examples`
}

export const generateHint = async (
  question: string,
  context: TutorContext
): Promise<string> => {
  const prompt = `The student is working on this question/problem: "${question}"

Give them a helpful hint that guides their thinking without giving away the answer. The hint should:
- Point them in the right direction
- Help them think about the problem differently
- Not reveal the solution

Provide only the hint, nothing else.`

  // Try models in order until one works
  const modelsToTry = process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : MODEL_CANDIDATES
  
  for (const modelName of modelsToTry) {
    try {
      const m = genAI.getGenerativeModel({ model: modelName })
      const result = await m.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      console.log(`Successfully used model for hint: ${modelName}`)
      return text
    } catch (error: any) {
      console.warn(`Model ${modelName} failed for hint:`, error?.message || error)
      // Continue to next model
      continue
    }
  }
  
  // If all models failed, throw a helpful error
  const errorMsg = `All models failed for hint generation. Please set GEMINI_MODEL in .env.local to a model your API key supports. Tried: ${modelsToTry.join(', ')}`
  console.error('GEMINI ERROR:', errorMsg)
  throw new Error(errorMsg)
}

