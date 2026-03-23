import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { FlashcardResponse } from '@/types/modes'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY missing' },
        { status: 500 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { topic, context, numCards = 10, difficulty = 'medium', files = [] } = body

    // Prepare full context from files and input
    let fullContext = context || ''
    if (files.length > 0) {
      const fileContents = files
        .map((file: any) => `File: ${file.name}\n${file.content}`)
        .join('\n\n')
      fullContext = fileContents || fullContext
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `Generate ${numCards} smart flashcards for studying "${topic}" at ${difficulty} difficulty level.

${fullContext ? `Based on this content: ${fullContext}` : ''}

IMPORTANT: You must respond with valid JSON only. No additional text or explanations.

The JSON should follow this exact structure:
{
  "flashcards": {
    "cards": [
      {
        "id": "unique_id",
        "front": "Question, term, or concept",
        "back": "Answer, definition, or explanation",
        "difficulty": "easy|medium|hard",
        "tags": ["tag1", "tag2"]
      }
    ],
    "metadata": {
      "title": "Flashcard Set Title",
      "topic": "${topic}",
      "totalCount": ${numCards}
    }
  }
}

Requirements:
- Front should contain questions, terms, concepts, or prompts
- Back should contain clear, concise answers or explanations
- Cards should cover key concepts from the material
- Include a mix of definition, application, and review cards
- Make front content engaging and thought-provoking
- Back content should be comprehensive but easy to understand
- Tags should help categorize the content (optional)
- Ensure all JSON is properly formatted and valid

Examples of good flashcard pairs:
- Front: "What is photosynthesis?" | Back: "The process by which plants convert light energy into chemical energy"
- Front: "Photosynthesis Equation" | Back: "6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂"
- Front: "Why is photosynthesis important?" | Back: "It produces oxygen and forms the base of most food chains"`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Clean and parse JSON response
    let flashcardData: FlashcardResponse
    try {
      // Remove any markdown code blocks
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim()
      flashcardData = JSON.parse(cleanText)
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.error('Raw Response:', text)
      
      // Fallback flashcards if JSON parsing fails
      flashcardData = {
        cards: [
          {
            id: 'fallback_1',
            front: `What is ${topic}?`,
            back: 'This is a fallback flashcard due to a processing error. Please try again.',
            difficulty: difficulty as 'easy' | 'medium' | 'hard',
            tags: ['fallback']
          }
        ],
        metadata: {
          title: `${topic} Flashcards`,
          topic,
          totalCount: 1
        }
      }
    }

    return NextResponse.json({ flashcards: flashcardData })
  } catch (error: any) {
    console.error('Flashcards API Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to generate flashcards' },
      { status: 500 }
    )
  }
}
