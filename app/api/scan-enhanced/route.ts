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
    const { image, enhance = true } = body

    if (!image) {
      return NextResponse.json(
        { error: 'Missing image' },
        { status: 400 }
      )
    }

    let processedImage = image

    // Enhanced image processing for documents
    if (enhance) {
      processedImage = await enhanceDocumentImage(image)
    }

    // Initialize Tesseract worker with optimized settings for documents
    const worker = await createWorker('eng', 1, {
      logger: m => console.log(m),
    })

    // Configure for better document recognition
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,!?;:()[]{}\'"-@#$%^&*+=<>/\\|`~ \n\t',
      tessedit_pageseg_mode: 6 as any, // Assume uniform text block
      preserve_interword_spaces: '1',
    })

    // Set timeout for processing (45 seconds max for enhanced processing)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Processing timeout - image may be too large or complex')), 45000)
    })

    // Perform OCR with timeout
    const ocrPromise = worker.recognize(processedImage).then(({ data: { text, confidence } }) => {
      worker.terminate()
      return {
        text: text.trim(),
        confidence: confidence,
        enhancedImage: processedImage
      }
    })

    const result = await Promise.race([ocrPromise, timeoutPromise]) as {
      text: string
      confidence: number
      enhancedImage: string
    }

    if (!result.text || result.text.length === 0) {
      return NextResponse.json(
        { error: 'No text could be extracted from the image. Please try a clearer image.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      text: result.text,
      confidence: result.confidence,
      enhancedImage: result.enhancedImage,
      originalImage: image
    })

  } catch (error: any) {
    console.error('Enhanced scan error:', error)
    
    if (error.message.includes('timeout')) {
      return NextResponse.json(
        { error: 'Processing timeout. Please try with a smaller or clearer image.' },
        { status: 408 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to process image' },
      { status: 500 }
    )
  }
}

async function enhanceDocumentImage(imageDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        canvas.width = img.width
        canvas.height = img.height

        // Draw original image
        ctx.drawImage(img, 0, 0)

        // Get image data for processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Apply document enhancement algorithms
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]

          // Convert to grayscale
          const gray = 0.299 * r + 0.587 * g + 0.114 * b

          // Apply adaptive thresholding for better text detection
          const threshold = 128
          const enhanced = gray > threshold ? 255 : Math.max(0, gray - 20)

          // Set enhanced grayscale values
          data[i] = enhanced
          data[i + 1] = enhanced
          data[i + 2] = enhanced
          // Alpha channel remains unchanged
        }

        // Apply Gaussian blur for noise reduction
        ctx.putImageData(imageData, 0, 0)
        ctx.filter = 'blur(0.5px)'
        ctx.drawImage(canvas, 0, 0)
        
        // Reset filter and apply sharpening
        ctx.filter = 'contrast(1.2) brightness(1.1)'
        ctx.drawImage(canvas, 0, 0)

        // Convert back to data URL
        const enhancedDataUrl = canvas.toDataURL('image/jpeg', 0.95)
        resolve(enhancedDataUrl)
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageDataUrl
  })
}
