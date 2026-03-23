import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLearningDNA, generateAdaptiveCore } from '@/lib/adaptive-learning'
import { checkAiMessageAllowed, incrementAiMessageCount } from '@/lib/daily-usage'

// Simple Gemini API call without complex imports
async function generateTutorResponse(message: string, context: any, imageData?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  
  console.log('🔍 generateTutorResponse called with:', {
    message: message.substring(0, 50) + '...',
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    hasImageData: !!imageData,
    hasConversationHistory: !!context.conversationHistory
  })
  
  if (!apiKey || apiKey.trim() === '') {
    console.error('❌ GEMINI_API_KEY is not set or is empty')
    throw new Error('GEMINI_API_KEY is not configured. Please set it in your environment variables.')
  }

  const { mode, profile, interests, weakSpots, masteredTopics, conversationHistory, userTier = 'starter', adaptiveDNA, responseDepth, historicalContext } = context

  try {
    // 0. Base Adaptive Prime - The Masterpiece Layer
    let adaptivePrime = ''
    if (adaptiveDNA) {
      adaptivePrime = generateAdaptiveCore(adaptiveDNA, profile?.display_name || 'Student')
    }

    // Build personalized prompt
    let prompt = ''
    
    // 🧠 TOPIC ANCHORING: Identify the main subject from history or current message
    const lastAssistantMessage = (conversationHistory || []).filter((m: any) => m.role === 'assistant').pop()
    const subjectMaterial = lastAssistantMessage?.content || message
    const mainTopic = message.toLowerCase().includes('quiz') || message.toLowerCase().includes('test') 
      ? (lastAssistantMessage?.content?.substring(0, 500) || message)
      : message

    if (mode === 'quiz') {
      prompt = `${adaptivePrime}
You are a revolutionary tutor in **QUIZ MODE**.
Your ONLY task is to generate 3-5 comprehensive multiple-choice questions BASED HEAVILY on the conversation history.

RULES:
1. Skip all explanations, greetings, or summaries.
2. SOURCE MATERIAL: You MUST extract the topics from the "[CONVERSATION HISTORY]" section. 
3. SUBJECT FOCUS: The current subject is likely related to: "${mainTopic.substring(0, 100)}".
4. PERSONALIZATION: You may use the student's interests (${Array.isArray(interests) ? interests.join(', ') : 'general interests'}) for the *flavor* or *context* of questions, but the *educational content* MUST come from the history.
5. FORMAT: Use EXACTLY this structure for each question:
   Question [number]: [Question text?]
   a) [Option 1]
   b) [Option 2]
   c) [Option 3]
   d) [Option 4]
   Correct answer: [Correct letter]
6. HEADER: Use the # [Quiz Topic] header at the top.
`
    } else if (responseDepth === 'concise') {
      prompt = `${adaptivePrime}
You are a revolutionary tutor in **CONCISE** mode.
Your goal is to be high-impact, clear, and brief.

RULES:
1. Provide **2-3 short, punchy paragraphs**.
2. Get straight to the heart of the answer. Use one powerful analogy if helpful.
3. Use plain English and keep it extremely readable.
4. IMPORTANT: Ensure you finish your sentences and thoughts. Do not cut off.
5. End with "◈ NEURAL RECAP" (one single sentence) and "◈ THINKING SPARKS" (2 short questions).
`
    } else {
      prompt = `${adaptivePrime}
You are **Brainy**, a revolutionary human-like tutor who knows the student deeply.
Your goal is to provide **SOCRATIC REMEDIATION** and **DEEP CONCEPTUAL CLARITY**.

RULES:
1. **EMPATHY & PRECISION**: If the student just finished a quiz and made mistakes (look for "I struggled with" or "got X/Y"), do NOT just give the right answer. Act like a human mentor. Say things like "I see where the confusion happened—you picked X, which is a common trap because..." 
2. **THE 'WHY' MATTERS**: Explain the underlying mental model. Use powerful, everyday analogies.
3. **PROACTIVE DETECTION**: If you see a pattern of struggle in the conversation history or the user's latest input, address it immediately.
4. **NO FLUFF**: Be efficient but extremely clear.
5. **NEURAL RECAP**: End with a single sentence summary.
6. **THINKING SPARKS**: 2 short, challenging questions to test their new mental model.

RESPONSE STRUCTURE:
# [Topic Diagnosis]
[Human-like, empathic, and high-density explanation...]

◈ NEURAL RECAP
[Summary]

◈ THINKING SPARKS
1. [Q1]
2. [Q2]
`
      // Add detailed-only personalization
      if (profile?.display_name) {
        prompt += `\n- Student: ${profile.display_name}`
      }
      
      // Add onboarding-based personalization
      if (profile) {
        if (profile.interests?.length > 0) prompt += `\n- Interest Matrix: ${Array.isArray(profile.interests) ? profile.interests.join(', ') : profile.interests}`
        if (profile.learning_style) prompt += `\n- Best explained via: ${profile.learning_style}`
        if (profile.grade_level) prompt += `\n- Intellectual Level: ${profile.grade_level}`
      }
    }

    // Add mode-specific rules (Always applied)
    const isStudyGuideRequest = message.toLowerCase().includes('study guide')
    if (isStudyGuideRequest) {
      if (userTier === 'starter') {
        prompt += `\nMODE: Study Guide (UNAVAILABLE)\n- INFORM the user that generating comprehensive Study Guides, Key Concept summaries, or structured Cheat Sheets is a Premium (Scholar/Master/Legend) feature.\n- DO NOT generate a guide, summary, or structured list of definitions.\n- Instead, act as a helpful tutor and encourage them to upgrade to unlock this feature, or ask specific questions about the topic instead.\n- Do NOT use the exact phrase "◈ STUDY GUIDE:" in your response.`
      } else {
        prompt += `\nMODE: Study Guide\n- Create a comprehensive, well-structured guide.\n- Start your response with the marker: "◈ STUDY GUIDE: [Topic Name]"`
      }
    }

    if (mode !== 'quiz') {
      switch (mode) {
        case 'explain':
          prompt += `\nMODE: Explain\n- multi-step depth.`
          break
        case 'practice':
          prompt += `\nMODE: Practice\n- detailed exercises.`
          break
      }
    }

    // 🧠 GROUNDING: Add historical context for review requests
    if (historicalContext) {
      prompt += `\n\n[HISTORICAL CONTEXT - RECENT STUDY TOPICS]\n${historicalContext}\n(USE THE ABOVE TOPICS if the user asks for a review of "yesterday" or "recently")`
    }

    prompt += `\n\n[CONVERSATION HISTORY - PRIMARY SOURCE FOR CONTEXT]`

    // Add conversation history if available
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((msg: any) => {
        if (msg.role === 'user') {
          prompt += `\nUser: ${msg.content}`
          if (msg.imageData) {
            prompt += ` [User uploaded an image]`
          }
        } else {
          prompt += `\nTutor: ${msg.content}`
        }
      })
    }

    prompt += `\n\n[FINAL INSTRUCTIONS]`
    if (mode === 'quiz') {
      prompt += `\n- GENERATE QUIZ NOW based on the history above.`
      prompt += `\n- DO NOT ADD ANY INTRODUCTION.`
      prompt += `\n- TOPIC MUST BE: ${mainTopic.substring(0, 100)}`
    } else {
      prompt += `\n- Respond to the user's latest message below.`
    }

    prompt += `\n\nCurrent User: ${message}\nTutor:`

    // List of models and endpoints to try for maximum reliability based on environment availability
    const modelConfigs = [
      { model: 'gemini-2.0-flash', apiVersion: 'v1beta' },
      { model: 'gemini-2.0-flash-lite-preview-02-05', apiVersion: 'v1beta' },
      { model: 'gemini-1.5-flash', apiVersion: 'v1' },
      { model: 'gemini-1.5-pro', apiVersion: 'v1' }
    ]
    
    let lastError: any = null

    for (const config of modelConfigs) {
      const { model: modelVersion, apiVersion } = config
      try {
        console.log(`📡 Attempting Gemini call [${apiVersion}] with model: ${modelVersion}...`)
        
        let parts: any[] = []
        if (imageData) {
          let imagePrompt = `Please analyze this image and respond to the user's question about it.`
          if (conversationHistory && conversationHistory.length > 0) {
            imagePrompt += ` Here's our recent conversation for context:`
            conversationHistory.forEach((msg: any) => {
              if (msg.role === 'user') {
                imagePrompt += `\nUser: ${msg.content}`
              } else {
                imagePrompt += `\nTutor: ${msg.content}`
              }
            })
          }
          imagePrompt += `\n\n${prompt}`
          
          parts.push({ text: imagePrompt })
          parts.push({
            inline_data: {
              mime_type: "image/jpeg",
              data: imageData.split(',')[1]
            }
          })
        } else {
          parts.push({ text: prompt })
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/${apiVersion}/models/${modelVersion}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: parts }],
            generationConfig: {
              temperature: 0.7, 
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4096, 
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
            ]
          })
        })

        if (response.status === 404) {
          console.warn(`⚠️ Model ${modelVersion} [${apiVersion}] not found (404), trying next...`)
          continue
        }

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`❌ Gemini API error (${modelVersion} - ${apiVersion}):`, response.status, errorText)
          lastError = new Error(`Gemini API error: ${response.status} - ${errorText}`)
          continue
        }

        const data = await response.json()
        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
          console.error(`❌ Invalid response format for ${modelVersion}:`, data)
          continue
        }

        console.log(`✅ Successfully got response using ${modelVersion} [${apiVersion}]`)
        return data.candidates[0].content.parts[0].text
      } catch (err) {
        console.error(`🔥 Try next config after error with ${modelVersion}:`, err)
        lastError = err
      }
    }

    throw lastError || new Error('All Gemini model configurations failed to respond.')
  } catch (error) {
    console.error('Gemini API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    if (errorMessage.includes('fetch')) {
      throw new Error('Network error connecting to AI service. Please check your internet connection.')
    }
    throw new Error(`Failed to generate response: ${errorMessage}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message, chatId, mode, responseDepth, displayName, interests, weakSpots, masteredTopics, profile: profileFromBody, imageData, conversationHistory } = body

    // Get exact user tier from DB
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .maybeSingle()
      
    const userTier = subData?.tier || 'starter'

    // ─── Daily AI Message Rate Limiting ───────────────────────────────────────
    const usageCheck = await checkAiMessageAllowed(supabase, user.id, userTier as any)
    if (!usageCheck.allowed) {
      const tierMessages: Record<string, string> = {
        starter: `You've used all ${usageCheck.limit} free AI messages for today. Upgrade to Scholar for 65 messages/day — or Legend for unlimited! 🚀`,
        scholar: `You've reached your ${usageCheck.limit} daily messages for Scholar. Upgrade to Master or Legend for unlimited AI! 🔓`,
      }
      return NextResponse.json({
        response: tierMessages[userTier] || `You've hit your daily limit of ${usageCheck.limit} messages. Upgrade to continue!`,
        mode: 'explain',
        isQuizRequest: false,
        isFlashcardRequest: false,
        limitReached: true,
        used: usageCheck.used,
        limit: usageCheck.limit,
        upgradeRequired: true,
      })
    }
    // ──────────────────────────────────────────────────────────────────────────

    // Use full profile from client when available; otherwise fetch from DB (fixes home->tutor personalization)
    let profile: any = profileFromBody && typeof profileFromBody === 'object' && (profileFromBody.display_name || profileFromBody.interests?.length)
      ? { ...profileFromBody, display_name: profileFromBody.display_name || displayName }
      : null

    if (!profile || !profile.display_name) {
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('display_name, interests, learning_style, grade_level, hobbies, preferred_tone, learning_pace, favorite_topics')
        .eq('id', user.id)
        .maybeSingle()
      profile = dbProfile ? {
        display_name: dbProfile.display_name || displayName || 'Student',
        interests: dbProfile.interests || [],
        learning_style: dbProfile.learning_style,
        grade_level: dbProfile.grade_level,
        hobbies: dbProfile.hobbies,
        preferred_tone: dbProfile.preferred_tone,
        learning_pace: dbProfile.learning_pace,
        favorite_topics: dbProfile.favorite_topics
      } : { display_name: displayName || 'Student' }
    }

    // Check if this is a quiz or flashcard request
    const isQuizRequest = message.toLowerCase().includes('quiz') || message.toLowerCase().includes('test me') || message.toLowerCase().includes('quiz me')
    const isFlashcardRequest = message.toLowerCase().includes('flashcard') || message.toLowerCase().includes('make card') || message.toLowerCase().includes('study review')

    // Force mode based on message content
    let actualMode = mode
    if (isQuizRequest) actualMode = 'quiz'
    if (isFlashcardRequest) actualMode = 'flashcard'

    // Enforce Starter tier limit: 1 quiz per day
    if (actualMode === 'quiz' && userTier === 'starter') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { count, error: countError } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
      
      if (countError) {
        console.error('Error checking quiz limit:', countError)
      } else if (count !== null && count >= 1) {
        return NextResponse.json({ 
          response: "You've reached your limit of 1 quiz per day on the Free tier. 🔵 Upgrade to Scholar or higher to unlock unlimited quizzes!",
          mode: 'explain',
          isQuizRequest: false,
          isFlashcardRequest: false,
          upgradeRequired: true
        })
      }
    }

    console.log('🎯 Request type detection:', { 
      originalMode: mode, 
      actualMode, 
      isQuizRequest, 
      isFlashcardRequest,
      message: message.substring(0, 50) 
    })

    // Load Adaptive DNA for the AI - Biggest Update Ever
    let adaptiveDNA = null
    try {
      adaptiveDNA = await getLearningDNA(user.id, supabase)
    } catch (dnaError) {
      console.warn('Failed to fetch Adaptive DNA for AI:', dnaError)
    }

    const response = await generateTutorResponse(message, {
      mode: actualMode,
      profile,
      interests: interests ?? profile.interests ?? [],
      weakSpots,
      masteredTopics,
      conversationHistory,
      userTier,
      adaptiveDNA,
      responseDepth
    }, imageData)

    // ─── Increment usage count after successful response ──────────────────────
    await incrementAiMessageCount(supabase, user.id)
    // ──────────────────────────────────────────────────────────────────────────

    // Return remaining count so client can show the meter
    const remainingAfter = usageCheck.limit === Infinity
      ? Infinity
      : Math.max(0, usageCheck.limit - usageCheck.used - 1)

    return NextResponse.json({ 
      response,
      mode: actualMode,
      isQuizRequest,
      isFlashcardRequest,
      used: usageCheck.used + 1,
      limit: usageCheck.limit,
      remaining: remainingAfter,
    })

  } catch (error) {
    console.error('🔥 Error in tutor API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    )
  }
}
