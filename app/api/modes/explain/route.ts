import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    console.log('Explain API: Starting request')
    
    if (!process.env.GEMINI_API_KEY) {
      console.log('Explain API: GEMINI_API_KEY missing')
      return NextResponse.json(
        { error: 'GEMINI_API_KEY missing' },
        { status: 500 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })
    console.log('Explain API: Checking session')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.log('Explain API: Session error or no session', sessionError?.message)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Explain API: Session valid, processing request')
    const body = await request.json()
    const { message, conversationHistory = [], files = [], personalization } = body

    // Prepare full context from files and message
    let fullContext = message
    if (files.length > 0) {
      const fileContents = files
        .map((file: any) => `File: ${file.name}\n${file.content}`)
        .join('\n\n')
      fullContext = `${fileContents}\n\nUser Question: ${message}`
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    console.log('Explain API: Model created, generating content')

    // Build conversation context
    const conversationContext = conversationHistory
      .slice(-5) // Keep last 5 messages for context
      .map((msg: any) => `${msg.role}: ${msg.content}`)
      .join('\n')

    // Use personalization if provided, otherwise use default prompt
    const prompt = personalization 
      ? `${personalization.systemPrompt}\n\nPrevious conversation:\n${conversationContext}\n\nCurrent question: ${fullContext}\n\n${personalization.responseInstructions}\n\n${personalization.examples.join('\n')}`
      : `You are an expert AI tutor specializing in personalized education. Your goal is to explain concepts in a way that's clear, engaging, and tailored to the student's needs.

Previous conversation:
${conversationContext}

Current question: ${fullContext}

Please provide a helpful explanation that:
1. Is clear and easy to understand
2. Provides relevant examples
3. Breaks down complex concepts
4. Encourages further learning
5. Adapts to the student's apparent level
6. If files are provided, reference the content directly
7. Keep responses concise but comprehensive
8. Respond naturally as a helpful tutor. Don't use JSON format - just provide a conversational response.`

    console.log('Explain API: Sending prompt to AI')
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    console.log('Explain API: AI response received')

    return NextResponse.json({ response: text })
  } catch (error: any) {
    console.error('Explain API Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to get explanation' },
      { status: 500 }
    )
  }
}
