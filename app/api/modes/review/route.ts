import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface ReviewData {
  summary: string
  keyPoints: string[]
  concepts: string[]
  studyPlan: string[]
  weaknesses: string[]
  strengths: string[]
}

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
    const { topic, context, files = [] } = body

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

    const prompt = `You are an expert educational analyst. Analyze the following content about "${topic}" and provide a comprehensive review.

Content to analyze:
${fullContext}

IMPORTANT: You must respond with valid JSON only. No additional text or explanations.

The JSON should follow this exact structure:
{
  "review": {
    "summary": "A comprehensive 2-3 paragraph summary of the main content",
    "keyPoints": [
      "Key point 1 in clear, concise language",
      "Key point 2 with specific details",
      "Key point 3 highlighting important information"
    ],
    "concepts": [
      "Important concept 1",
      "Important concept 2",
      "Important concept 3"
    ],
    "strengths": [
      "Strength 1 in the content or understanding",
      "Strength 2 with specific examples",
      "Strength 3 highlighting what's done well"
    ],
    "weaknesses": [
      "Area for improvement 1",
      "Area for improvement 2",
      "Area for improvement 3"
    ],
    "studyPlan": [
      "Step 1: Specific action to take",
      "Step 2: Follow-up activity",
      "Step 3: Advanced practice suggestion",
      "Step 4: Review and mastery strategy"
    ]
  }
}

Requirements:
- Summary should be comprehensive but concise (2-3 paragraphs)
- Key points should be the most important takeaways
- Concepts should be technical terms or main ideas
- Strengths should identify what's well understood or well-explained
- Weaknesses should identify gaps or areas needing improvement
- Study plan should be actionable and progressive
- Ensure all JSON is properly formatted and valid
- Be constructive and encouraging in your analysis`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Clean and parse JSON response
    let reviewData: ReviewData
    try {
      // Remove any markdown code blocks
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim()
      reviewData = JSON.parse(cleanText)
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.error('Raw Response:', text)
      
      // Fallback review if JSON parsing fails
      reviewData = {
        summary: `This content about ${topic} provides basic information but needs more detailed analysis due to a processing error.`,
        keyPoints: ['Content received', 'Analysis incomplete', 'Please try again'],
        concepts: [topic],
        strengths: ['Content provided'],
        weaknesses: ['Processing error occurred'],
        studyPlan: ['Try reviewing the content again', 'Contact support if issue persists']
      }
    }

    return NextResponse.json({ review: reviewData })
  } catch (error: any) {
    console.error('Review API Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to generate review' },
      { status: 500 }
    )
  }
}
