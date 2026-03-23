import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { QuizResponse } from '@/types/modes'

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
    const { topic, context, difficulty = 'medium', numQuestions = 5, files = [] } = body

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

    const prompt = `Generate an interactive quiz about "${topic}" with ${numQuestions} ${difficulty} difficulty questions.

${fullContext ? `Based on this content: ${fullContext}` : ''}

IMPORTANT: You must respond with valid JSON only. No additional text or explanations.

The JSON should follow this exact structure:
{
  "quiz": {
    "questions": [
      {
        "id": "unique_id",
        "question": "Clear question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Detailed explanation of why this answer is correct",
        "difficulty": "easy|medium|hard"
      }
    ],
    "metadata": {
      "title": "Quiz Title",
      "difficulty": "easy|medium|hard",
      "estimatedTime": 5,
      "topic": "${topic}"
    }
  }
}

Requirements:
- Questions should be multiple choice with exactly 4 options
- Only one correct answer per question (correctAnswer should be 0-3)
- Explanations should be educational and helpful
- Questions should test understanding, not just memorization
- Include a mix of question types if appropriate (definition, application, analysis)
- Ensure all JSON is properly formatted and valid`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Clean and parse JSON response
    let quizData: QuizResponse
    try {
      // Remove any markdown code blocks
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim()
      quizData = JSON.parse(cleanText)
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.error('Raw Response:', text)
      
      // Fallback quiz if JSON parsing fails
      quizData = {
        questions: [
          {
            id: 'fallback_1',
            question: `What is the main topic of "${topic}"?`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0,
            explanation: 'This is a fallback question due to a processing error.',
            difficulty: difficulty as 'easy' | 'medium' | 'hard'
          }
        ],
        metadata: {
          title: `${topic} Quiz`,
          difficulty: difficulty as 'easy' | 'medium' | 'hard',
          estimatedTime: 5,
          topic
        }
      }
    }

    return NextResponse.json({ quiz: quizData })
  } catch (error: any) {
    console.error('Quiz API Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to generate quiz' },
      { status: 500 }
    )
  }
}
