/**
 * Plus Tier Tools - Available to Plus and Pro users
 * Advanced study tools and enhanced features
 */

export interface StudyGuideRequest {
  text: string
  topic?: string
  subject?: string
  format?: 'outline' | 'summary' | 'detailed'
}

export interface StudyGuideResponse {
  title: string
  content: string
  keyPoints: string[]
  studyTips: string[]
  estimatedStudyTime: number // minutes
}

export interface TextExtractionRequest {
  imageData: string // base64 encoded image
  extractHandwritten?: boolean
  preserveFormatting?: boolean
}

export interface TextExtractionResponse {
  extractedText: string
  confidence: number
  isHandwritten: boolean
  formatting?: string
}

export interface PracticeQuizRequest {
  topic: string
  subject?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  questionCount?: number
  focusAreas?: string[]
}

export interface PracticeQuizResponse {
  questions: Array<{
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
    concept: string
    difficulty: string
  }>
  metadata: {
    topic: string
    subject: string
    difficulty: string
    estimatedTime: number
  }
}

/**
 * Generate Study Guide from text
 * Plus tier feature
 */
export async function generate_study_guide(request: StudyGuideRequest): Promise<StudyGuideResponse> {
  const response = await fetch('/api/plus/study-guide', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: request.text,
      topic: request.topic,
      subject: request.subject,
      format: request.format || 'detailed'
    })
  })

  if (!response.ok) {
    throw new Error('Failed to generate study guide')
  }

  return response.json()
}

/**
 * Extract text from scanned images using OCR
 * Plus tier feature
 */
export async function extract_text_from_scan(request: TextExtractionRequest): Promise<TextExtractionResponse> {
  const response = await fetch('/api/plus/text-extraction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageData: request.imageData,
      extractHandwritten: request.extractHandwritten || false,
      preserveFormatting: request.preserveFormatting || true
    })
  })

  if (!response.ok) {
    throw new Error('Failed to extract text from image')
  }

  return response.json()
}

/**
 * Generate Enhanced Practice Quiz
 * Plus tier feature - better than basic quiz
 */
export async function generate_practice_quiz(request: PracticeQuizRequest): Promise<PracticeQuizResponse> {
  const response = await fetch('/api/plus/practice-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: request.topic,
      subject: request.subject,
      difficulty: request.difficulty || 'medium',
      questionCount: Math.min(request.questionCount || 10, 15),
      focusAreas: request.focusAreas || [],
      type: 'enhanced'
    })
  })

  if (!response.ok) {
    throw new Error('Failed to generate practice quiz')
  }

  return response.json()
}

/**
 * Unlimited Document Scanning
 * Plus tier feature - no daily limits
 */
export async function unlimited_scan(imageData: string, title?: string): Promise<any> {
  const response = await fetch('/api/plus/unlimited-scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageData,
      title,
      tier: 'plus' // Indicates unlimited scanning
    })
  })

  if (!response.ok) {
    throw new Error('Failed to scan document')
  }

  return response.json()
}

/**
 * Enhanced Document Analysis
 * Plus tier feature - deeper analysis of scanned content
 */
export async function enhanced_document_analysis(scanId: string): Promise<any> {
  const response = await fetch(`/api/plus/document-analysis/${scanId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })

  if (!response.ok) {
    throw new Error('Failed to analyze document')
  }

  return response.json()
}
