export type SubscriptionTier = 'starter' | 'scholar' | 'master' | 'legend'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired'
export type TutorMode = 'explain' | 'practice' | 'quiz' | 'review'
export type MessageRole = 'user' | 'assistant'

export interface Profile {
  id: string
  display_name: string | null
  grade_level: string | null
  subjects: string[]
  study_goals: string[]
  learning_style: string | null
  hobbies: string[]
  interests: string[]
  personality_traits: string[]
  preferred_tone: 'friendly' | 'formal' | 'encouraging' | 'direct'
  favorite_topics: string[]
  learning_pace: 'slow' | 'moderate' | 'fast'
  difficulty_preference: 'easy' | 'medium' | 'hard'
  communication_style: 'visual' | 'verbal' | 'mixed'
  motivation_level: 'low' | 'medium' | 'high'
  study_time_preference: 'morning' | 'afternoon' | 'evening' | 'night'
  preferred_session_length: 'short' | 'medium' | 'long'
  theme_preference: 'light' | 'dark' | 'system'
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  created_at: string
  updated_at: string
}

export interface Chat {
  id: string
  user_id: string
  mode: TutorMode
  subject: string | null
  title: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  chat_id: string
  role: MessageRole
  content: string
  created_at: string
}

export interface Scan {
  id: string
  user_id: string
  title: string | null
  image_url: string | null
  extracted_text: string | null
  subject: string | null
  ai_actions: string[]
  created_at: string
  updated_at: string
}

export interface DailyUsage {
  id: string
  user_id: string
  date: string
  ai_messages_count: number
  scans_count: number
  created_at: string
}

export interface OnboardingData {
  display_name: string
  grade_level: string
  subjects: string[]
  study_goals: string[]
  learning_style: string
  hobbies: string[]
  interests: string[]
  personality_traits: string[]
  preferred_tone: 'friendly' | 'formal' | 'encouraging' | 'direct'
  favorite_topics: string[]
  learning_pace: 'slow' | 'moderate' | 'fast'
  difficulty_preference: 'easy' | 'medium' | 'hard'
  communication_style: 'visual' | 'verbal' | 'mixed'
  motivation_level: 'low' | 'medium' | 'high'
  study_time_preference: 'morning' | 'afternoon' | 'evening' | 'night'
  preferred_session_length: 'short' | 'medium' | 'long'
}

export interface Quiz {
  id: string
  user_id: string
  topic: string
  subject: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  score: number
  total_questions: number
  status: 'in_progress' | 'completed'
  weak_areas: string[]
  created_at: string
  updated_at: string
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  question_text: string
  options: string[]
  correct_answer: number
  user_answer: number | null
  is_correct: boolean | null
  explanation: string | null
  question_number: number
  created_at: string
}

export interface Flashcard {
  id: string
  user_id: string
  front_text: string
  back_text: string
  subject: string | null
  topic: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  last_reviewed_at: string | null
  next_review_at: string | null
  review_count: number
  mastery_level: number
  created_at: string
  updated_at: string
}

export interface StudySession {
  id: string
  user_id: string
  session_type: 'chat' | 'quiz' | 'flashcards' | 'practice'
  topic: string | null
  subject: string | null
  duration_minutes: number
  performance_score: number | null
  notes: string | null
  created_at: string
}

export interface UserPerformance {
  id: string
  user_id: string
  subject: string
  topic: string | null
  quiz_scores: number[]
  average_score: number | null
  total_attempts: number
  weak_concepts: string[]
  strong_concepts: string[]
  last_studied_at: string | null
  created_at: string
  updated_at: string
}

export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  description?: string
  date: string // ISO datetime string
  reminder_offset?: number // Days before to remind (default: 1)
  notification_id?: string // ID of scheduled notification
  created_at: string
  updated_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  is_study_reminder_enabled: boolean
  study_reminder_time: string // Format: "19:00"
  event_reminder_offset: number // Days before event
  created_at: string
  updated_at: string
}

