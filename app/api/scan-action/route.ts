import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY missing at runtime')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { text, action, subject = 'General', topic = 'Uploaded Document' } = body

    if (!text || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let prompt = ''
    switch (action) {
      case 'explain':
        prompt = `Explain the following content in a clear, educational way that helps a student understand it:\n\n${text}`
        break
      case 'summarize':
        prompt = `Summarize the following content in a concise way:\n\n${text}`
        break
      case 'quiz':
        prompt = `Create a quiz based on the following content. Include 5 multiple choice questions with 4 options each. Format as JSON:
        {
          "questions": [
            {
              "question": "...",
              "options": ["A", "B", "C", "D"],
              "correct_answer": "A",
              "explanation": "..."
            }
          ]
        }\n\nContent:\n${text}`
        break
      case 'flashcards':
        prompt = `Create flashcards from the following content. Format as JSON:
        {
          "flashcards": [
            {
              "front": "...",
              "back": "..."
            }
          ]
        }\n\nContent:\n${text}`
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Try models in order until one works
    const MODEL_CANDIDATES = [
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite-preview-02-05',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
    ]
    const modelsToTry = process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : MODEL_CANDIDATES
    
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent(prompt)
        const response = await result.response
        const resultText = response.text()
        
        console.log(`Successfully used model for scan-action: ${modelName}`)
        
        // Save to database if it's quiz or flashcards
        if (action === 'quiz') {
          try {
            const quizData = JSON.parse(resultText)
            const { questions } = quizData
            
            const { data: quiz, error } = await supabase
              .from('quizzes')
              .insert({
                user_id: session.user.id,
                topic,
                subject,
                questions,
                total_questions: questions.length,
                status: 'draft'
              })
              .select()
              .single()
            
            if (error) {
              console.error('Error saving quiz:', error)
            } else {
              console.log('Quiz saved:', quiz.id)
              return NextResponse.json({ 
                result: resultText,
                quizId: quiz.id,
                redirect: `/quiz/${quiz.id}`
              })
            }
          } catch (parseError) {
            console.error('Error parsing quiz JSON:', parseError)
            // Still return the text result
          }
        }
        
        if (action === 'flashcards') {
          try {
            const flashcardData = JSON.parse(resultText)
            const { flashcards } = flashcardData
            
            const flashcardsToInsert = flashcards.map((card: any) => ({
              user_id: session.user.id,
              front_text: card.front,
              back_text: card.back,
              subject,
              topic
            }))
            
            const { data: cards, error } = await supabase
              .from('flashcards')
              .insert(flashcardsToInsert)
              .select()
            
            if (error) {
              console.error('Error saving flashcards:', error)
            } else {
              console.log(`Saved ${cards.length} flashcards`)
              return NextResponse.json({ 
                result: resultText,
                flashcardCount: cards.length,
                redirect: '/flashcards'
              })
            }
          } catch (parseError) {
            console.error('Error parsing flashcards JSON:', parseError)
            // Still return the text result
          }
        }
        
        return NextResponse.json({ result: resultText })
      } catch (error: any) {
        console.warn(`Model ${modelName} failed for scan-action:`, error?.message || error)
        // Continue to next model
        continue
      }
    }
    
    // If all models failed
    return NextResponse.json(
      { error: `All models failed. Please set GEMINI_MODEL in .env.local to a model your API key supports. Tried: ${modelsToTry.join(', ')}` },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('GEMINI ERROR:', error)
    return NextResponse.json(
      { error: error?.message || error?.toString() || 'Failed to process action' },
      { status: 500 }
    )
  }
}

