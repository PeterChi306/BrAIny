import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createWorker } from 'tesseract.js'

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
    const { image } = body

    if (!image) {
      return NextResponse.json(
        { error: 'Missing image' },
        { status: 400 }
      )
    }

    // Initialize Tesseract worker with timeout
    const worker = await createWorker('eng')
    
    // Set timeout for processing (30 seconds max)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Processing timeout - image may be too large or complex')), 30000)
    })
    
    // Perform OCR with timeout
    const ocrPromise = worker.recognize(image).then(({ data: { text } }) => {
      worker.terminate()
      return text.trim()
    })
    
    const text = await Promise.race([ocrPromise, timeoutPromise]) as string

    if (!text || text.length === 0) {
      return NextResponse.json(
        { error: 'No text could be extracted from the image. Please try a clearer image.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ text })
  } catch (error: any) {
    console.error('OCR error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process image' },
      { status: 500 }
    )
  }
}

