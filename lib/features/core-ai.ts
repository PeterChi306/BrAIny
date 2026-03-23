/**
 * Core AI Tutor Features - Available to ALL tiers
 * These features maintain the same high quality across free, plus, and pro users
 */

export interface AIChatRequest {
  message: string
  context?: string
  mode?: 'explain' | 'practice' | 'quiz' | 'review'
}

export interface AIChatResponse {
  response: string
  followUpQuestions?: string[]
  concepts?: string[]
}

export interface BasicQuizRequest {
  topic: string
  difficulty?: 'easy' | 'medium' | 'hard'
  questionCount?: number
}

export interface BasicQuizResponse {
  questions: Array<{
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
  }>
  topic: string
  difficulty: string
}

export interface ScanRequest {
  imageData: string // base64 encoded image
  title?: string
}

export interface ScanResponse {
  id: string
  title: string
  extractedText?: string
  subject?: string
  aiActions: string[]
  success: boolean
}

/**
 * Core AI Tutor - Answer questions with full brAIny framework quality
 * SAME QUALITY for all tiers - no AI quality reduction
 */
export async function answer_question(request: AIChatRequest): Promise<AIChatResponse> {
  // This would call the same AI endpoint for ALL tiers
  // The brAIny Signature Response Framework applies equally
  
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: request.message,
      context: request.context,
      mode: request.mode || 'explain'
    })
  })

  if (!response.ok) {
    throw new Error('Failed to get AI response')
  }

  return response.json()
}

/**
 * Explain Topic - Full quality explanations for ALL tiers
 */
export async function explain_topic(topic: string, userContext?: any): Promise<AIChatResponse> {
  // Same AI quality for free, plus, and pro users
  const response = await fetch('/api/ai/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic,
      context: userContext,
      mode: 'explain'
    })
  })

  if (!response.ok) {
    throw new Error('Failed to generate explanation')
  }

  return response.json()
}

/**
 * Generate Basic Quiz - Available to all tiers with same quality
 */
export async function generate_basic_quiz(request: BasicQuizRequest): Promise<BasicQuizResponse> {
  const response = await fetch('/api/quiz/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: request.topic,
      difficulty: request.difficulty || 'medium',
      questionCount: Math.min(request.questionCount || 5, 5), // Free tier limited to 5
      type: 'basic'
    })
  })

  if (!response.ok) {
    throw new Error('Failed to generate quiz')
  }

  return response.json()
}

/**
 * Limited Document Scan - Available to free tier (3 per day)
 */
export async function limited_scan(request: ScanRequest): Promise<ScanResponse> {
  const response = await fetch('/api/scan/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageData: request.imageData,
      title: request.title,
      tier: 'free' // Indicates limited scan
    })
  })

  if (!response.ok) {
    throw new Error('Failed to scan document')
  }

  return response.json()
}

/**
 * Check daily scan limits for free tier
 */
export async function check_scan_limits(userId: string): Promise<{ allowed: boolean; remaining: number; message?: string }> {
  const response = await fetch('/api/scan/check-limit', {
    method: 'GET',
    headers: { 'User-ID': userId }
  })

  if (!response.ok) {
    throw new Error('Failed to check scan limits')
  }

  return response.json()
}
