import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { AdaptiveSession, SessionContent, SessionPerformance } from '@/types/learning-plans'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { goal_id, session_type, topics } = body

    if (!session_type) {
      return NextResponse.json({ error: 'Session type is required' }, { status: 400 })
    }

    // Generate adaptive session content
    const sessionContent = await generateSessionContent(supabase, user.id, session_type, topics, goal_id)
    
    // Create adaptive session
    const { data: session, error } = await supabase
      .from('adaptive_sessions')
      .insert({
        user_id: user.id,
        goal_id,
        session_type,
        state: 'review',
        current_step: 0,
        total_steps: sessionContent.concepts.length + sessionContent.questions.length + 1,
        content: sessionContent,
        performance: {
          accuracy: 0,
          speed: 0,
          difficulty_adjusted: false,
          concepts_mastered: [],
          concepts_struggling: [],
          time_spent_minutes: 0,
          engagement_score: 0
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating adaptive session:', error)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error('Error in sessions POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const goal_id = searchParams.get('goal_id')
    const status = searchParams.get('status')

    let query = supabase
      .from('adaptive_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })

    if (goal_id) {
      query = query.eq('goal_id', goal_id)
    }
    if (status) {
      query = query.eq('state', status)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('Error fetching sessions:', error)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error in sessions GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateSessionContent(
  supabase: any,
  userId: string,
  sessionType: string,
  topics: string[] = [],
  goalId?: string
): Promise<SessionContent> {
  // Get user's learner model for personalization
  const { data: learnerModel } = await supabase
    .from('learner_models')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  const difficulty = learnerModel?.preferred_difficulty || 'medium'
  const weakAreas = learnerModel?.weakness_areas || []

  // Generate content based on session type
  switch (sessionType) {
    case 'review':
      return generateReviewContent(topics, difficulty, weakAreas)
    case 'recall':
      return generateRecallContent(topics, difficulty, weakAreas)
    case 'practice':
      return generatePracticeContent(topics, difficulty, weakAreas)
    case 'quiz':
      return generateQuizContent(topics, difficulty, weakAreas)
    case 'explain':
      return generateExplainContent(topics, difficulty, weakAreas)
    default:
      return generateReviewContent(topics, difficulty, weakAreas)
  }
}

function generateReviewContent(topics: string[], difficulty: string, weakAreas: string[]): SessionContent {
  const concepts = topics.length > 0 ? topics : ['Key Concept 1', 'Key Concept 2', 'Key Concept 3']
  
  return {
    concepts,
    questions: concepts.map((concept, index) => ({
      id: `review-q-${index}`,
      question: `What is the main idea behind ${concept}?`,
      options: [
        'Option A: Correct definition',
        'Option B: Incorrect definition',
        'Option C: Partially correct',
        'Option D: Unrelated concept'
      ],
      correct_answer: 0,
      explanation: `The correct answer explains ${concept} clearly...`,
      difficulty: difficulty as any,
      concept_tags: [concept]
    })),
    explanations: concepts.map(concept => 
      `Detailed explanation of ${concept} with examples and applications.`
    ),
    practice_problems: [],
    summary_points: concepts.map(concept => 
      `Key takeaway about ${concept}`
    )
  }
}

function generateRecallContent(topics: string[], difficulty: string, weakAreas: string[]): SessionContent {
  const concepts = topics.length > 0 ? topics : ['Concept for Recall 1', 'Concept for Recall 2']
  
  return {
    concepts,
    questions: concepts.map((concept, index) => ({
      id: `recall-q-${index}`,
      question: `Explain ${concept} in your own words without looking at notes.`,
      correct_answer: 'A comprehensive explanation...',
      explanation: `A good explanation of ${concept} should include...`,
      difficulty: difficulty as any,
      concept_tags: [concept]
    })),
    explanations: [],
    practice_problems: [],
    summary_points: concepts.map(concept => 
      `Recall practice for ${concept}`
    )
  }
}

function generatePracticeContent(topics: string[], difficulty: string, weakAreas: string[]): SessionContent {
  const concepts = topics.length > 0 ? topics : ['Practice Topic 1', 'Practice Topic 2']
  
  return {
    concepts,
    questions: [],
    explanations: concepts.map(concept => 
      `Let's practice applying ${concept} to solve problems.`
    ),
    practice_problems: concepts.map((concept, index) => ({
      id: `practice-p-${index}`,
      problem: `Solve this problem related to ${concept}: [Problem statement]`,
      hints: [
        'Hint 1: Start by identifying the key information',
        'Hint 2: Think about the relevant formula',
        'Hint 3: Consider the steps needed'
      ],
      solution: `Step-by-step solution for the ${concept} problem...`,
      difficulty: difficulty as any,
      concept_tags: [concept]
    })),
    summary_points: concepts.map(concept => 
      `Practice completed for ${concept}`
    )
  }
}

function generateQuizContent(topics: string[], difficulty: string, weakAreas: string[]): SessionContent {
  const concepts = topics.length > 0 ? topics : ['Quiz Topic 1', 'Quiz Topic 2', 'Quiz Topic 3']
  
  return {
    concepts,
    questions: concepts.map((concept, index) => ({
      id: `quiz-q-${index}`,
      question: `Quiz question about ${concept}`,
      options: [
        'Correct answer',
        'Distractor 1',
        'Distractor 2',
        'Distractor 3'
      ],
      correct_answer: 0,
      explanation: `Explanation for the ${concept} quiz question...`,
      difficulty: difficulty as any,
      concept_tags: [concept]
    })),
    explanations: [],
    practice_problems: [],
    summary_points: concepts.map(concept => 
      `Quiz completed for ${concept}`
    )
  }
}

function generateExplainContent(topics: string[], difficulty: string, weakAreas: string[]): SessionContent {
  const concepts = topics.length > 0 ? topics : ['Explanation Topic 1', 'Explanation Topic 2']
  
  return {
    concepts,
    questions: concepts.map((concept, index) => ({
      id: `explain-q-${index}`,
      question: `What questions do you have about ${concept}?`,
      correct_answer: 'Your questions will guide the explanation...',
      explanation: `I'll explain ${concept} based on your specific questions...`,
      difficulty: difficulty as any,
      concept_tags: [concept]
    })),
    explanations: concepts.map(concept => 
      `Comprehensive explanation of ${concept} with examples, analogies, and real-world applications.`
    ),
    practice_problems: [],
    summary_points: concepts.map(concept => 
      `Key points about ${concept}`
    )
  }
}
