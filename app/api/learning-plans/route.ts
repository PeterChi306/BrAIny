import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { LearningGoal, StudyPlan } from '@/types/learning-plans'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const subject = searchParams.get('subject')

    let query = supabase
      .from('learning_goals')
      .select(`
        *,
        study_plans(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }
    if (subject) {
      query = query.eq('subject', subject)
    }

    const { data: goals, error } = await query

    if (error) {
      console.error('Error fetching learning goals:', error)
      return NextResponse.json({ error: 'Failed to fetch learning goals' }, { status: 500 })
    }

    return NextResponse.json({ goals })
  } catch (error) {
    console.error('Error in learning plans GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, goal_type, target_date, subject, topics, target_level } = body

    if (!title || !goal_type || !subject) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create the learning goal
    const { data: goal, error: goalError } = await supabase
      .from('learning_goals')
      .insert({
        user_id: user.id,
        title,
        description,
        goal_type,
        target_date: target_date || null,
        subject,
        topics: topics || [],
        target_level: target_level || 100,
        confidence_score: 50 // Start with neutral confidence
      })
      .select()
      .single()

    if (goalError) {
      console.error('Error creating learning goal:', goalError)
      return NextResponse.json({ error: 'Failed to create learning goal' }, { status: 500 })
    }

    // Generate study plan based on goal
    const studyPlan = await generateStudyPlan(supabase, goal as LearningGoal)
    
    return NextResponse.json({ goal, studyPlan }, { status: 201 })
  } catch (error) {
    console.error('Error in learning plans POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateStudyPlan(supabase: any, goal: LearningGoal): Promise<StudyPlan> {
  const daysUntilTarget = goal.target_date 
    ? Math.ceil((new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 30 // Default 30 days

  const totalDays = Math.max(daysUntilTarget, 7) // Minimum 7 days
  const title = `${goal.title} - Study Plan`

  // Create study plan
  const { data: studyPlan, error: planError } = await supabase
    .from('study_plans')
    .insert({
      goal_id: goal.id,
      user_id: goal.user_id,
      title,
      total_days: totalDays,
      current_day: 1,
      completion_percentage: 0
    })
    .select()
    .single()

  if (planError) {
    console.error('Error creating study plan:', planError)
    throw planError
  }

  // Generate daily plans
  await generateDailyPlans(supabase, studyPlan as StudyPlan, goal)

  return studyPlan as StudyPlan
}

async function generateDailyPlans(supabase: any, studyPlan: StudyPlan, goal: LearningGoal) {
  const dailyPlans = []
  
  for (let day = 1; day <= studyPlan.total_days; day++) {
    const date = new Date()
    date.setDate(date.getDate() + day - 1)
    
    const sessions = generateDaySessions(day, studyPlan.total_days, goal)
    
    dailyPlans.push({
      study_plan_id: studyPlan.id,
      day_number: day,
      date: date.toISOString().split('T')[0],
      sessions,
      is_completed: false,
      completion_percentage: 0
    })
  }

  const { error } = await supabase
    .from('daily_plans')
    .insert(dailyPlans)

  if (error) {
    console.error('Error creating daily plans:', error)
    throw error
  }
}

function generateDaySessions(day: number, totalDays: number, goal: LearningGoal) {
  const sessions = []
  const progress = day / totalDays
  
  // Early days: Focus on review and explanation
  if (progress < 0.3) {
    sessions.push({
      id: `session-${day}-1`,
      type: 'review',
      title: 'Concept Review',
      description: `Review key concepts in ${goal.subject}`,
      duration_minutes: 20,
      topics: goal.topics.slice(0, 2),
      difficulty: 'easy',
      is_completed: false
    })
    
    sessions.push({
      id: `session-${day}-2`,
      type: 'explain',
      title: 'Deep Dive',
      description: `Detailed explanation of core topics`,
      duration_minutes: 25,
      topics: goal.topics.slice(0, 2),
      difficulty: 'medium',
      is_completed: false
    })
  }
  // Middle days: Practice and recall
  else if (progress < 0.7) {
    sessions.push({
      id: `session-${day}-1`,
      type: 'recall',
      title: 'Active Recall',
      description: `Test your knowledge of ${goal.subject} concepts`,
      duration_minutes: 15,
      topics: goal.topics,
      difficulty: 'medium',
      is_completed: false
    })
    
    sessions.push({
      id: `session-${day}-2`,
      type: 'practice',
      title: 'Practice Problems',
      description: `Apply your knowledge to solve problems`,
      duration_minutes: 30,
      topics: goal.topics,
      difficulty: 'medium',
      is_completed: false
    })
  }
  // Late days: Quiz and reinforcement
  else {
    sessions.push({
      id: `session-${day}-1`,
      type: 'quiz',
      title: 'Knowledge Check',
      description: `Quiz yourself on ${goal.subject} topics`,
      duration_minutes: 20,
      topics: goal.topics,
      difficulty: 'hard',
      is_completed: false
    })
    
    sessions.push({
      id: `session-${day}-2`,
      type: 'review',
      title: 'Weak Area Review',
      description: `Focus on areas that need improvement`,
      duration_minutes: 25,
      topics: goal.topics,
      difficulty: 'medium',
      is_completed: false
    })
  }
  
  return sessions
}
