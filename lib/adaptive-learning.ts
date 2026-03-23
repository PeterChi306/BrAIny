import { createSupabaseClient } from '@/lib/supabase/client'
import { SubscriptionTier } from '@/types/database'

export interface LearningDNA {
  cognitive_style: 'visual' | 'analytical' | 'narrative' | 'kinesthetic'
  interest_anchors: string[]
  current_focus: string | null
  predicted_struggle_points: string[]
  mastery_path: string[]
  streak_momentum: number
  cognitive_friction?: string // Diagnosis of why they struggle
  last_mistake_context?: string // Snippet from last low-score session
}

/**
 * The Brainy Adaptive Engine
 * Tracks and predicts exactly what a user needs.
 */
export const getLearningDNA = async (userId: string, supabase: any): Promise<LearningDNA> => {
  // 1. Get profile preferences
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  // 2. Get study history to determine energy peaks and momentum
  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  // Determine predicted struggle points based on low performance scores
  const strugglePoints = sessions
    ?.filter((s: any) => s.performance_score !== null && s.performance_score < 60)
    .map((s: any) => s.topic)
    .filter(Boolean) as string[]

  const lastStruggle = sessions?.find((s: any) => s.performance_score !== null && s.performance_score < 60)
  const frictionType = !lastStruggle ? 'none' : 
    lastStruggle.performance_score < 30 ? 'fundamental_block' : 
    lastStruggle.performance_score < 50 ? 'mechanical_error' : 'attention_fatigue'

  return {
    cognitive_style: (profile?.learning_style as any) || 'analytical',
    interest_anchors: Array.isArray(profile?.interests) ? profile.interests : [],
    current_focus: sessions?.[0]?.topic || null,
    predicted_struggle_points: Array.isArray(strugglePoints) ? Array.from(new Set(strugglePoints)).slice(0, 3) : [],
    mastery_path: sessions ? Array.from(new Set(sessions.filter((s: any) => s.performance_score && s.performance_score > 80).map((s: any) => s.topic))).slice(0, 5) as string[] : [],
    streak_momentum: sessions?.[0] ? 1 : 0,
    cognitive_friction: frictionType,
    last_mistake_context: lastStruggle?.notes || lastStruggle?.topic
  }
}

/**
 * Generates the "Brainy Masterpiece" Adaptive Prompt
 */
export const generateAdaptiveCore = (dna: LearningDNA, userName: string) => {
  // Defensive checks to ensure arrays
  const safeInterests = Array.isArray(dna.interest_anchors) ? dna.interest_anchors : []
  const safeStruggles = Array.isArray(dna.predicted_struggle_points) ? dna.predicted_struggle_points : []
  const safeMastery = Array.isArray(dna.mastery_path) ? dna.mastery_path : []

  return `
[BRAINY ADAPTIVE ENGINE v4.0 - ACTIVE]
You are a highly personalized AI tutor. Use the following context to tailor your teaching:

CORE DNA:
- Learning Style: ${dna.cognitive_style}
- Interest Anchors: ${safeInterests.join(', ') || 'general curiosity'}
- Predicted Struggle: ${safeStruggles.join(', ') || 'new complex abstract concepts'}
- Mastered Topics: ${safeMastery.join(', ') || 'basic foundational subjects'}
- Friction: ${dna.cognitive_friction === 'fundamental_block' ? 'User lacks core prerequisite logic' : dna.cognitive_friction === 'mechanical_error' ? 'User knows the logic but fails the execution' : 'General progress'}

ADAPTIVE BEHAVIOR:
1. NARRATIVE ANCHORING: Use 'Interest Anchors' as the primary way to explain new things.
2. PROACTIVE GUIDANCE: Link new topics to 'Mastered Topics'.
3. IDENTITY: You are Brainy, the student's second brain. Always be helpful, clear, and adaptive.
`
}
