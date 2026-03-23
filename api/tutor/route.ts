import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createEnhancedPrompt, UserContext } from '@/lib/ai/enhanced-prompt'
import { createQualityChecker } from '@/lib/ai/response-quality'

// Study Guide Generation Function
async function generateStudyGuide(conversationHistory: any[], userContext: UserContext): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  // Extract key topics and concepts from conversation
  const conversationText = conversationHistory
    .filter(msg => msg.role === 'user' || msg.role === 'assistant')
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n\n')

  const studyGuidePrompt = `
You are creating a comprehensive study guide based on the following conversation. 
Create a well-structured, educational study guide that helps the student learn and review the material effectively.

CONVERSATION HISTORY:
${conversationText}

STUDENT CONTEXT:
- Name: ${userContext.displayName || 'Student'}
- Grade Level: ${userContext.gradeLevel || 'Not specified'}
- Learning Style: ${userContext.learningStyle || 'Not specified'}
- Weak Areas: ${userContext.weakSpots?.join(', ') || 'None identified'}

Create a study guide with the following structure:

# 📚 Study Guide: [Main Topic]

## 🎯 Learning Objectives
- Clear, measurable learning goals based on the conversation

## 📖 Key Concepts
- Main concepts discussed in the conversation
- Brief, clear explanations for each concept
- Include relevant academic terms and definitions

## 🔍 Important Details
- Critical information and facts
- Step-by-step processes when applicable
- Formulas, equations, or important data

## 💡 Examples & Applications
- Real-world examples from the conversation
- Practical applications of the concepts
- Analogies to help understanding

## 📝 Practice Points
- Key questions to test understanding
- Areas the student struggled with (based on conversation)
- Review questions for self-assessment

## 🧠 Memory Tips
- Mnemonic devices if applicable
- Study strategies for this type of content
- Connections to previously learned material

## ✅ Quick Review Checklist
- Essential points to remember
- Common mistakes to avoid
- Success criteria for mastery

Guidelines:
- Make it comprehensive but not overwhelming
- Use clear headings and bullet points
- Include the student's name for personalization
- Focus on what was actually discussed, not generic information
- Make it practical and actionable for studying
- Use emojis to make it engaging but professional
- Length should be substantial enough to be useful (500-800 words)

Generate the study guide now:
`

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: studyGuidePrompt
          }]
        }],
        generationConfig: {
          temperature: 0.6,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 3000,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API')
    }

    return data.candidates[0].content.parts[0].text

  } catch (error) {
    console.error('Study Guide generation error:', error)
    throw new Error(`Failed to generate study guide: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Simple Gemini API call with enhanced prompt system and quality checking
async function generateTutorResponse(message: string, context: any, conversationHistory?: any[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  
  console.log('🔍 generateTutorResponse called with:', {
    message: message.substring(0, 50) + '...',
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    conversationHistoryLength: conversationHistory?.length || 0,
    chatId: context.chatId || 'none'
  })
  
  if (!apiKey || apiKey.trim() === '') {
    console.error('❌ GEMINI_API_KEY is not set or is empty')
    throw new Error('GEMINI_API_KEY is not configured. Please set it in your environment variables.')
  }

  const { mode, profile, interests, weakSpots, masteredTopics, chatId } = context

  try {
    // Build user context for enhanced prompt system
    const userContext: UserContext = {
      displayName: profile?.display_name || undefined,
      interests: Array.isArray(profile?.interests) ? profile.interests : 
                 typeof profile?.interests === 'string' ? [profile.interests] : 
                 Array.isArray(interests) ? interests : [],
      hobbies: Array.isArray(profile?.hobbies) ? profile.hobbies : 
               typeof profile?.hobbies === 'string' ? [profile.hobbies] : [],
      learningStyle: profile?.learning_style || undefined,
      preferredTone: profile?.preferred_tone || undefined,
      learningPace: profile?.learning_pace || undefined,
      favoriteTopics: Array.isArray(profile?.favorite_topics) ? profile.favorite_topics : 
                      typeof profile?.favorite_topics === 'string' ? [profile.favorite_topics] : [],
      gradeLevel: profile?.grade_level || undefined,
      subjects: Array.isArray(profile?.subjects) ? profile.subjects : [],
      personalityTraits: Array.isArray(profile?.personality_traits) ? profile.personality_traits : [],
      weakSpots: Array.isArray(weakSpots) ? weakSpots : 
                 typeof weakSpots === 'string' ? [weakSpots] : [],
      masteredTopics: Array.isArray(masteredTopics) ? masteredTopics : 
                      typeof masteredTopics === 'string' ? [masteredTopics] : []
    }

    // Create enhanced prompt using the new system
    const prompt = createEnhancedPrompt(message, userContext, conversationHistory || [], mode)

    console.log('🤖 Sending enhanced prompt to AI with conversation history length:', conversationHistory?.length || 0)
    if (conversationHistory && conversationHistory.length > 0) {
      console.log('📜 Last 3 messages for context:')
      conversationHistory.slice(-3).forEach((msg, index) => {
        console.log(`  ${index + 1}. [${msg.role}] ${msg.content.substring(0, 80)}...`)
      })
    }
    if (conversationHistory && conversationHistory.length > 0) {
      console.log('📜 Last message from conversation history:')
      console.log('Role:', conversationHistory[conversationHistory.length - 1]?.role)
      console.log('Content:', conversationHistory[conversationHistory.length - 1]?.content?.substring(0, 200))
    }

    console.log('📡 Calling Gemini API...')
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    })

    console.log('📨 Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Gemini API error:', response.status, errorText)
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ Successfully got response from Gemini')

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('❌ Invalid response format:', data)
      throw new Error('Invalid response format from Gemini API')
    }

    const aiResponse = data.candidates[0].content.parts[0].text

    // Quality check the response
    const qualityChecker = createQualityChecker(userContext, message)
    const qualityMetrics = qualityChecker.analyzeQuality(aiResponse)
    
    console.log('📊 Response Quality Metrics:', {
      overall: Math.round(qualityMetrics.overall.score * 100) + '%',
      personalization: Math.round(qualityMetrics.personalization.score * 100) + '%',
      accuracy: Math.round(qualityMetrics.accuracy.score * 100) + '%',
      clarity: Math.round(qualityMetrics.clarity.score * 100) + '%',
      engagement: Math.round(qualityMetrics.engagement.score * 100) + '%',
      meetsStandards: qualityMetrics.overall.meetsStandards
    })

    if (!qualityMetrics.overall.meetsStandards) {
      console.warn('⚠️ Response quality below standards:', qualityMetrics.overall.improvements)
    }

    return aiResponse

  } catch (error) {
    console.error('Gemini API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Provide more helpful error messages
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
    const { message, chatId, mode, displayName, interests, weakSpots, masteredTopics, profile: profileFromBody, isStudyGuideRequest } = body

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
    const isQuizRequest = message.toLowerCase().includes('quiz') || message.toLowerCase().includes('test') || message.toLowerCase().includes('question')
    const isFlashcardRequest = message.toLowerCase().includes('flashcard') || message.toLowerCase().includes('card') || message.toLowerCase().includes('review')

    // Force mode based on message content
    let actualMode = mode
    if (isQuizRequest) actualMode = 'quiz'
    if (isFlashcardRequest) actualMode = 'flashcard'

    console.log('🎯 Request type detection:', { 
      originalMode: mode, 
      actualMode, 
      isQuizRequest, 
      isFlashcardRequest,
      message: message.substring(0, 50) 
    })

    // Load conversation history for context (CRITICAL for continuity)
    let conversationHistory: any[] = []
    if (chatId) {
      console.log(`📚 Attempting to load conversation history for chatId: ${chatId}`)
      try {
        const { data: messages, error } = await supabase
          .from('messages')
          .select('role, content, created_at')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true })
          .limit(20) // Limit to last 20 messages for context
        
        if (error) {
          console.error('❌ Database error loading conversation history:', error)
        } else if (messages && messages.length > 0) {
          // Include all messages except the current user message to provide full context
          conversationHistory = messages.filter(msg => 
            !(msg.role === 'user' && msg.content === message)
          )
          console.log(`✅ Loaded ${messages.length} messages, filtered to ${conversationHistory.length} for context`)
          console.log('📝 History preview:', conversationHistory.slice(0, 2).map(m => `${m.role}: ${m.content.substring(0, 50)}...`))
          console.log('📝 Full conversation history:', JSON.stringify(conversationHistory, null, 2))
          
          // For quiz mode, also log the last assistant message specifically
          if (actualMode === 'quiz') {
            const lastAssistantMsg = conversationHistory.filter(m => m.role === 'assistant').pop()
            if (lastAssistantMsg) {
              console.log('🎯 Last assistant message for quiz context:', lastAssistantMsg.content.substring(0, 200) + '...')
            }
          }
        } else {
          console.log('📭 No messages found for this chatId')
        }
      } catch (error) {
        console.error('❌ Failed to load conversation history:', error)
        // Continue without history rather than failing
      }
    } else {
      console.log('⚠️ No chatId provided - cannot load conversation history')
    }

    // Handle Study Guide Mode request
    if (isStudyGuideRequest) {
      console.log('📚 Study Guide Mode requested')
      
      if (conversationHistory.length === 0) {
        return NextResponse.json({ 
          error: 'No conversation history available to create study guide. Please have a conversation first.' 
        }, { status: 400 })
      }

      const userContext: UserContext = {
        displayName: profile?.display_name || 'Student',
        interests: Array.isArray(profile?.interests) ? profile.interests : 
                   typeof profile?.interests === 'string' ? [profile.interests] : 
                   Array.isArray(interests) ? interests : [],
        hobbies: Array.isArray(profile?.hobbies) ? profile.hobbies : 
                 typeof profile?.hobbies === 'string' ? [profile.hobbies] : [],
        learningStyle: profile?.learning_style || undefined,
        preferredTone: profile?.preferred_tone || undefined,
        learningPace: profile?.learning_pace || undefined,
        favoriteTopics: Array.isArray(profile?.favorite_topics) ? profile.favorite_topics : 
                        typeof profile?.favorite_topics === 'string' ? [profile.favorite_topics] : [],
        gradeLevel: profile?.grade_level || undefined,
        subjects: Array.isArray(profile?.subjects) ? profile.subjects : [],
        personalityTraits: Array.isArray(profile?.personality_traits) ? profile.personality_traits : [],
        weakSpots: Array.isArray(weakSpots) ? weakSpots : 
                   typeof weakSpots === 'string' ? [weakSpots] : [],
        masteredTopics: Array.isArray(masteredTopics) ? masteredTopics : 
                        typeof masteredTopics === 'string' ? [masteredTopics] : []
      }

      try {
        const studyGuide = await generateStudyGuide(conversationHistory, userContext)
        console.log('✅ Study Guide generated successfully')
        
        return NextResponse.json({ 
          response: studyGuide,
          mode: 'study-guide',
          isStudyGuideRequest: true
        })
      } catch (error) {
        console.error('❌ Study Guide generation failed:', error)
        return NextResponse.json(
          { error: `Failed to generate study guide: ${error instanceof Error ? error.message : 'Unknown error'}` },
          { status: 500 }
        )
      }
    }

    const response = await generateTutorResponse(message, {
      mode: actualMode,
      profile,
      interests: interests ?? profile.interests ?? [],
      weakSpots,
      masteredTopics,
      chatId: chatId
    }, conversationHistory)

    return NextResponse.json({ 
      response,
      mode: actualMode,
      isQuizRequest,
      isFlashcardRequest
    })

  } catch (error) {
    console.error('🔥 Error in tutor API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    )
  }
}
///Peter Chi