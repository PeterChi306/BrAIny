import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface TitleGenerationRequest {
  messages: ChatMessage[]
  userName?: string
  userInterests?: string[]
  learningStyle?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: TitleGenerationRequest = await request.json()
    const { messages, userName, userInterests = [], learningStyle = 'visual' } = body

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 })
    }

    // Get user profile for personalization (profiles table)
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, interests, learning_style, grade_level')
      .eq('id', user.id)
      .maybeSingle()

    const personalizedInfo = {
      userName: profile?.display_name || userName || 'Student',
      interests: profile?.interests || userInterests || [],
      learningStyle: profile?.learning_style || learningStyle,
      gradeLevel: profile?.grade_level
    }

    // Generate personalized title
    const title = await generatePersonalizedTitle(messages, personalizedInfo)

    return NextResponse.json({ title }, { status: 200 })
  } catch (error) {
    console.error('Error generating chat title:', error)
    return NextResponse.json({ error: 'Failed to generate title' }, { status: 500 })
  }
}

async function generatePersonalizedTitle(
  messages: ChatMessage[], 
  userInfo: {
    userName: string
    interests: string[]
    learningStyle: string
    gradeLevel?: string
  }
): Promise<string> {
  // Extract the main topic from conversation
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content)
  const firstUserMessage = userMessages[0] || ''
  const conversationText = userMessages.join(' ').toLowerCase()

  // Use AI to generate a ChatGPT-style title
  const aiGeneratedTitle = await generateAITitle(firstUserMessage, conversationText, userInfo)
  
  // Fallback to pattern matching if AI fails
  if (aiGeneratedTitle) {
    return aiGeneratedTitle
  }
  
  const conciseTitle = generateConciseTitle(firstUserMessage, conversationText)
  return conciseTitle
}

async function generateAITitle(
  firstMessage: string, 
  conversationText: string,
  userInfo: {
    userName: string
    interests: string[]
    learningStyle: string
    gradeLevel?: string
  }
): Promise<string | null> {
  try {
    // Call the AI API to generate a title
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tutor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Generate a short, descriptive title for this study session.

User's first message: "${firstMessage}"

Create a title that:
- Is 2-6 words maximum
- Sounds natural and specific
- Captures the main topic
- Examples: "Calculus Help", "Biology Study", "Essay Writing", "Physics Problems"

Only return the title, nothing else. No quotes or prefixes.`,
        mode: 'explain',
        profile: {
          display_name: userInfo.userName
        }
      })
    })

    if (response.ok) {
      const data = await response.json()
      if (data.response) {
        // Clean up the AI response to get just the title
        let title = data.response.trim()
        
        // Remove common prefixes and quotes
        title = title
          .replace(/^["']|["']$/g, '') // Remove surrounding quotes
          .replace(/^(Title:|Session:|Topic:|Chat:|Discussion:)\s*/i, '') // Remove prefixes
          .replace(/^\d+[\.\)]\s*/, '') // Remove numbered lists
          .trim()
        
        // Ensure it's not too long and is meaningful
        if (title.length >= 3 && title.length <= 50) {
          return title
        }
      }
    }
  } catch (error) {
    console.error('Error generating AI title:', error)
  }
  
  return null
}

function generateConciseTitle(firstMessage: string, conversationText: string): string {
  // Remove common question words and phrases
  const cleanedMessage = firstMessage
    .replace(/^(what|how|why|when|where|can|could|would|should|is|are|do|does|did|explain|help|tell me|i need|i want)\s+/i, '')
    .replace(/\?$/g, '')
    .replace(/\.$/g, '')
    .trim()

  // Common academic subjects and keywords for quick identification
  const subjectPatterns = {
    'Math': /\b(calculus|algebra|geometry|statistics|equation|formula|calculate|solve|problem|number|math|mathematics)\b/i,
    'Science': /\b(biology|chemistry|physics|experiment|molecule|cell|atom|energy|reaction|hypothesis|science)\b/i,
    'History': /\b(history|historical|ancient|war|civilization|empire|century|decade|timeline|event|period)\b/i,
    'Literature': /\b(book|novel|poem|story|author|character|theme|literature|write|read|text)\b/i,
    'Geography': /\b(geography|country|city|map|location|climate|region|continent|ocean|mountain|river)\b/i,
    'Computer Science': /\b(computer|programming|code|algorithm|software|app|website|data|technology|python|javascript|coding)\b/i,
    'Art': /\b(art|painting|drawing|design|creative|artist|style|color|technique|museum|sculpture)\b/i,
    'Music': /\b(music|song|instrument|melody|rhythm|composer|genre|note|beat|symphony|performance)\b/i,
    'Languages': /\b(language|translate|speak|learn|grammar|vocabulary|spanish|french|english|word|phrase)\b/i
  }

  // Check for subject-specific patterns
  for (const [subject, pattern] of Object.entries(subjectPatterns)) {
    if (pattern.test(conversationText)) {
      // Extract specific topic
      const specificTopic = extractSpecificTopic(firstMessage, subject)
      if (specificTopic && specificTopic.length <= 30) {
        return specificTopic
      }
      // Fallback to subject with context
      return `${subject}: ${cleanedMessage.substring(0, 20).trim()}${cleanedMessage.length > 20 ? '...' : ''}`
    }
  }

  // If no specific subject found, create a concise title from the first message
  if (cleanedMessage.length <= 40) {
    return cleanedMessage.charAt(0).toUpperCase() + cleanedMessage.slice(1)
  }
  
  // For longer messages, extract the key concept
  const words = cleanedMessage.split(' ')
  const keyWords = words.slice(0, 5).join(' ')
  return keyWords.charAt(0).toUpperCase() + keyWords.slice(1) + '...'
}


function extractSpecificTopic(firstMessage: string, subject: string): string | null {
  // Try to extract a more specific topic from the first message
  const message = firstMessage.toLowerCase()
  
  // Look for specific patterns
  const patterns = {
    'Math': [
      /(\w+ calculus)/i,
      /(\w+ algebra)/i,
      /(\w+ geometry)/i,
      /(\w+ equations?)/i,
      /(\w+ problems?)/i
    ],
    'Science': [
      /(\w+ biology)/i,
      /(\w+ chemistry)/i,
      /(\w+ physics)/i,
      /(\w+ cells?)/i,
      /(\w+ atoms?)/i
    ],
    'History': [
      /(\w+ history)/i,
      /(\w+ war)/i,
      /(\w+ empire)/i,
      /(\w+ civilization)/i
    ],
    'Computer Science': [
      /(\w+ programming)/i,
      /(\w+ coding)/i,
      /(\w+ development)/i,
      /(\w+ algorithms?)/i
    ]
  }

  const subjectPatterns = patterns[subject as keyof typeof patterns] || []
  
  for (const pattern of subjectPatterns) {
    const match = message.match(pattern)
    if (match) {
      return match[1].charAt(0).toUpperCase() + match[1].slice(1)
    }
  }

  return null
}

