import { NextRequest, NextResponse } from 'next/server'

// Vision API for image recognition and text extraction
export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    console.log('🔍 Processing image with vision API...')

    // Extract base64 data if it includes the data URL prefix
    const base64Data = image.includes('base64,') 
      ? image.split('base64,')[1] 
      : image

    // Detect MIME type from data URL or default to jpeg
    let mimeType = 'image/jpeg'
    if (image.includes('data:')) {
      const mimeTypeMatch = image.match(/data:([^;]+)/)
      if (mimeTypeMatch && mimeTypeMatch[1]) {
        mimeType = mimeTypeMatch[1]
      }
    }

    console.log('📷 Image Info:', {
      mimeType,
      dataSize: base64Data.length,
      hasData: base64Data.length > 0
    })

    // Validate image data
    if (!base64Data || base64Data.length === 0) {
      return NextResponse.json(
        { error: 'Invalid image data' },
        { status: 400 }
      )
    }

    // Check if image is too large (max 10MB for Gemini)
    const imageSizeBytes = Math.ceil(base64Data.length * 0.75) // Approximate base64 to bytes
    if (imageSizeBytes > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image too large. Please upload an image smaller than 10MB.' },
        { status: 400 }
      )
    }

    // For now, we'll use a simple approach with Gemini Vision API
    // In production, you might want to use Google Cloud Vision API or similar
    const apiKey = process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY not found')
      return NextResponse.json(
        { error: 'Vision service not configured' },
        { status: 500 }
      )
    }

    // Prepare the request for Gemini Vision API
    const visionPrompt = `Please analyze this image and extract any text content. If there's no text, describe what you see in the image. Focus on:
1. Any readable text in the image
2. The main subject or content of the image
3. Any relevant details that would help understand what the user is showing

Respond in a clear, structured format.`

    const requestBody = {
      contents: [{
        parts: [
          {
            text: visionPrompt
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      }
    }

    console.log('📡 Calling Gemini Vision API...')

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    console.log('📨 Vision API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Gemini Vision API error:', response.status, errorText)
      return NextResponse.json(
        { error: `Vision API error: ${response.status}` },
        { status: 500 }
      )
    }

    const data = await response.json()
    console.log('✅ Successfully got response from Gemini Vision')

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('❌ Invalid vision response format:', data)
      return NextResponse.json(
        { error: 'Invalid response from vision API' },
        { status: 500 }
      )
    }

    const extractedContent = data.candidates[0].content.parts[0].text
    console.log('📝 Extracted content length:', extractedContent.length)

    return NextResponse.json({
      success: true,
      text: extractedContent,
      type: 'extracted'
    })

  } catch (error) {
    console.error('❌ Vision API error:', error)
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    )
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
