export type GoalType = 'exam' | 'skill' | 'grade' | 'deadline'
export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled'
export type SessionType = 'review' | 'practice' | 'quiz' | 'explain' | 'recall'
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export interface LearningGoal {
  id: string
  user_id: string
  title: string
  description: string
  goal_type: GoalType
  target_date: string | null
  subject: string
  topics: string[]
  current_level: number // 0-100 scale
  target_level: number // 0-100 scale
  confidence_score: number // 0-100 probability of success
  status: GoalStatus
  created_at: string
  updated_at: string
}

export interface StudyPlan {
  id: string
  goal_id: string
  user_id: string
  title: string
  total_days: number
  current_day: number
  completion_percentage: number
  status: 'active' | 'completed' | 'paused'
  created_at: string
  updated_at: string
}

export interface DailyPlan {
  id: string
  study_plan_id: string
  day_number: number
  date: string
  sessions: PlannedSession[]
  is_completed: boolean
  completion_percentage: number
  created_at: string
}

export interface PlannedSession {
  id: string
  type: SessionType
  title: string
  description: string
  duration_minutes: number
  topics: string[]
  difficulty: DifficultyLevel
  is_completed: boolean
  actual_duration?: number
  performance_score?: number
  notes?: string
}

export interface ProgressTracker {
  id: string
  goal_id: string
  user_id: string
  date: string
  confidence_score: number
  completion_rate: number
  average_performance: number
  streak_days: number
  weak_areas: string[]
  strong_areas: string[]
  recommendations: string[]
  created_at: string
}

export interface AdaptiveSession {
  id: string
  user_id: string
  goal_id: string
  session_type: SessionType
  state: 'review' | 'recall' | 'practice' | 'quiz' | 'summary' | 'completed'
  current_step: number
  total_steps: number
  content: SessionContent
  performance: SessionPerformance
  started_at: string
  completed_at?: string
}

export interface SessionContent {
  concepts: string[]
  questions: AdaptiveQuestion[]
  explanations: string[]
  practice_problems: PracticeProblem[]
  summary_points: string[]
}

export interface AdaptiveQuestion {
  id: string
  question: string
  options?: string[]
  correct_answer: string | number
  explanation: string
  difficulty: DifficultyLevel
  time_limit_seconds?: number
  concept_tags: string[]
}

export interface PracticeProblem {
  id: string
  problem: string
  hints: string[]
  solution: string
  difficulty: DifficultyLevel
  concept_tags: string[]
}

export interface SessionPerformance {
  accuracy: number
  speed: number
  difficulty_adjusted: boolean
  concepts_mastered: string[]
  concepts_struggling: string[]
  time_spent_minutes: number
  engagement_score: number
}

export interface TimedQuizConfig {
  id: string
  goal_id: string
  question_count: number
  time_per_question: number
  adaptive_difficulty: boolean
  allow_hints: boolean
  allow_backtrack: boolean
  show_progress: boolean
}

export interface TimedQuizSession {
  id: string
  config_id: string
  user_id: string
  questions: TimedQuizQuestion[]
  current_question: number
  total_time_seconds: number
  time_remaining_seconds: number
  is_paused: boolean
  is_completed: boolean
  score: number
  started_at: string
  completed_at?: string
}

export interface TimedQuizQuestion {
  id: string
  question: string
  options: string[]
  correct_answer: number
  explanation: string
  difficulty: DifficultyLevel
  time_limit_seconds: number
  user_answer?: number
  is_correct?: boolean
  time_taken_seconds?: number
  answered_at?: string
  concept_tags?: string[]
}

export interface SpeechSettings {
  id: string
  user_id: string
  enabled: boolean
  voice_type: 'male' | 'female' | 'neutral'
  speech_rate: number
  volume: number
  auto_speak_explanations: boolean
  auto_speak_feedback: boolean
  pause_during_input: boolean
  daily_limit_minutes: number
  used_minutes_today: number
}

export interface SpacedRepetitionCard {
  id: string
  user_id: string
  goal_id: string
  front_text: string
  back_text: string
  concept_tags: string[]
  easiness_factor: number
  repetition_count: number
  interval_days: number
  next_review_date: string
  last_reviewed_at?: string
  performance_history: number[]
  mastery_level: number
}

export interface LearnerModel {
  id: string
  user_id: string
  subject: string
  concept_mastery: Record<string, number>
  strength_areas: string[]
  weakness_areas: string[]
  preferred_difficulty: DifficultyLevel
  learning_speed: 'slow' | 'moderate' | 'fast'
  retention_rate: number
  engagement_patterns: {
    best_time_of_day: string
    optimal_session_length: number
    preferred_session_types: SessionType[]
  }
  last_updated: string
}
