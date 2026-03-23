export type ModeType = 'explain' | 'quiz' | 'flashcards' | 'review' | 'scan'

export interface AIResponse {
  type: 'text' | 'quiz' | 'flashcard' | 'document'
  data: TextResponse | QuizResponse | FlashcardResponse | DocumentResponse
}

export interface TextResponse {
  content: string
  actions?: ActionButton[]
}

export interface QuizResponse {
  questions: QuizQuestionData[]
  metadata: {
    title: string
    difficulty: 'easy' | 'medium' | 'hard'
    estimatedTime: number
    topic: string
  }
}

export interface QuizQuestionData {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface FlashcardResponse {
  cards: FlashcardData[]
  metadata: {
    title: string
    topic: string
    totalCount: number
  }
}

export interface FlashcardData {
  id: string
  front: string
  back: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags?: string[]
}

export interface DocumentResponse {
  content: string
  metadata: {
    filename: string
    type: string
    size: number
    extractedText?: string
  }
  suggestedActions: string[]
}

export interface ActionButton {
  id: string
  label: string
  action: 'practice' | 'quiz' | 'flashcards' | 'explain_simple' | 'real_world_example'
  data?: any
}

export interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  url: string
  content?: string
}
