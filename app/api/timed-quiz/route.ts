import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { TimedQuizSession, TimedQuizQuestion } from '@/types/learning-plans'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { goal_id, question_count = 10, time_per_question = 60, adaptive_difficulty = true } = body

    if (!goal_id) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 })
    }

    // Check user's subscription tier for limits
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .single()

    const tier = subscription?.tier || 'free'
    
    // Apply tier-based limits
    const maxQuestions = tier === 'free' ? 5 : tier === 'pro' ? 15 : 25
    const actualQuestionCount = Math.min(question_count, maxQuestions)
    const actualTimePerQuestion = tier === 'free' ? time_per_question * 1.5 : time_per_question

    // Generate adaptive questions
    const questions = await generateAdaptiveQuestions(supabase, goal_id, actualQuestionCount, adaptive_difficulty)

    // Create quiz config
    const { data: config, error: configError } = await supabase
      .from('timed_quiz_configs')
      .insert({
        goal_id,
        question_count: actualQuestionCount,
        time_per_question: actualTimePerQuestion,
        adaptive_difficulty,
        allow_hints: false,
        allow_backtrack: false,
        show_progress: true
      })
      .select()
      .single()

    if (configError) {
      console.error('Error creating quiz config:', configError)
      return NextResponse.json({ error: 'Failed to create quiz config' }, { status: 500 })
    }

    // Create quiz session
    const totalTime = actualQuestionCount * actualTimePerQuestion
    const { data: session, error: sessionError } = await supabase
      .from('timed_quiz_sessions')
      .insert({
        config_id: config.id,
        user_id: user.id,
        questions,
        current_question: 0,
        total_time_seconds: totalTime,
        time_remaining_seconds: totalTime,
        is_paused: false,
        is_completed: false,
        score: 0
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating quiz session:', sessionError)
      return NextResponse.json({ error: 'Failed to create quiz session' }, { status: 500 })
    }

    return NextResponse.json({ session, config }, { status: 201 })
  } catch (error) {
    console.error('Error in timed-quiz POST:', error)
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
      .from('timed_quiz_sessions')
      .select(`
        *,
        timed_quiz_configs(*)
      `)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })

    if (goal_id) {
      query = query.eq('timed_quiz_configs.goal_id', goal_id)
    }
    if (status) {
      query = query.eq('is_completed', status === 'completed')
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('Error fetching quiz sessions:', error)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error in timed-quiz GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateAdaptiveQuestions(
  supabase: any,
  goalId: string,
  count: number,
  adaptiveDifficulty: boolean
): Promise<TimedQuizQuestion[]> {
  try {
    // Get goal details
    const { data: goal } = await supabase
      .from('learning_goals')
      .select('subject, topics, current_level')
      .eq('id', goalId)
      .single()

    if (!goal) {
      throw new Error('Goal not found')
    }

    // Get user's learner model for personalization
    const { data: learnerModel } = await supabase
      .from('learner_models')
      .select('concept_mastery, weakness_areas, preferred_difficulty')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
      .eq('subject', goal.subject)
      .maybeSingle()

    const questions: TimedQuizQuestion[] = []
    const baseDifficulty = learnerModel?.preferred_difficulty || 'medium'
    const weakAreas = learnerModel?.weakness_areas || []

    for (let i = 0; i < count; i++) {
      let difficulty = baseDifficulty

      // Adaptive difficulty logic
      if (adaptiveDifficulty) {
        if (i < count / 3) {
          // Start with easier questions
          difficulty = 'easy'
        } else if (i < (2 * count) / 3) {
          // Medium difficulty in the middle
          difficulty = 'medium'
        } else {
          // Harder questions at the end
          difficulty = 'hard'
        }

        // Focus on weak areas more frequently
        if (weakAreas.length > 0 && Math.random() < 0.4) {
          const weakArea = weakAreas[Math.floor(Math.random() * weakAreas.length)]
          // Generate question for weak area
        }
      }

      const question = generateQuestion(goal.subject, goal.topics, difficulty, i)
      questions.push(question)
    }

    return questions
  } catch (error) {
    console.error('Error generating adaptive questions:', error)
    // Fallback to generic questions
    return generateGenericQuestions(count)
  }
}

function generateQuestion(
  subject: string,
  topics: string[],
  difficulty: 'easy' | 'medium' | 'hard',
  index: number
): TimedQuizQuestion {
  const timeLimit = difficulty === 'easy' ? 90 : difficulty === 'medium' ? 60 : 45
  
  return {
    id: `question-${index}`,
    question: `Sample ${difficulty} question about ${subject} focusing on ${topics[0] || 'core concepts'}`,
    options: [
      'Correct answer',
      'Plausible distractor 1',
      'Plausible distractor 2',
      'Plausible distractor 3'
    ],
    correct_answer: 0,
    explanation: `Explanation for the ${difficulty} ${subject} question...`,
    difficulty,
    time_limit_seconds: timeLimit,
    concept_tags: topics.slice(0, 2)
  }
}

function generateGenericQuestions(count: number): TimedQuizQuestion[] {
  const questions: TimedQuizQuestion[] = []
  
  for (let i = 0; i < count; i++) {
    questions.push({
      id: `generic-question-${i}`,
      question: `Generic question ${i + 1}`,
      options: [
        'Correct answer',
        'Wrong answer 1',
        'Wrong answer 2',
        'Wrong answer 3'
      ],
      correct_answer: 0,
      explanation: `Explanation for question ${i + 1}`,
      difficulty: 'medium',
      time_limit_seconds: 60,
      concept_tags: ['general']
    })
  }
  
  return questions
}
