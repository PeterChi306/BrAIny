import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: session, error } = await supabase
      .from('timed_quiz_sessions')
      .select(`
        *,
        timed_quiz_configs(*)
      `)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching quiz session:', error)
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error in timed-quiz GET by ID:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      questions, 
      current_question, 
      time_remaining_seconds, 
      is_paused, 
      is_completed, 
      score,
      completed_at 
    } = body

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (questions !== undefined) updateData.questions = questions
    if (current_question !== undefined) updateData.current_question = current_question
    if (time_remaining_seconds !== undefined) updateData.time_remaining_seconds = time_remaining_seconds
    if (is_paused !== undefined) updateData.is_paused = is_paused
    if (is_completed !== undefined) updateData.is_completed = is_completed
    if (score !== undefined) updateData.score = score
    if (completed_at !== undefined) updateData.completed_at = completed_at

    const { data: session, error } = await supabase
      .from('timed_quiz_sessions')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating quiz session:', error)
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
    }

    // Update learner model based on quiz performance
    if (is_completed && questions) {
      await updateLearnerModelFromQuiz(supabase, user.id, session.config_id, questions, score)
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error in timed-quiz PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function updateLearnerModelFromQuiz(
  supabase: any,
  userId: string,
  configId: string,
  questions: any[],
  score: number
) {
  try {
    // Get the config to find the goal
    const { data: config } = await supabase
      .from('timed_quiz_configs')
      .select('goal_id')
      .eq('id', configId)
      .single()

    if (!config) return

    // Get the goal to determine subject
    const { data: goal } = await supabase
      .from('learning_goals')
      .select('subject')
      .eq('id', config.goal_id)
      .single()

    if (!goal) return

    // Get or create learner model for this subject
    const { data: learnerModel } = await supabase
      .from('learner_models')
      .select('*')
      .eq('user_id', userId)
      .eq('subject', goal.subject)
      .maybeSingle()

    const conceptMastery = learnerModel?.concept_mastery || {}
    const strengthAreas = learnerModel?.strength_areas || []
    const weaknessAreas = learnerModel?.weakness_areas || []

    // Analyze quiz results
    questions.forEach((question: any) => {
      const concepts = question.concept_tags || []
      
      concepts.forEach((concept: string) => {
        const currentMastery = conceptMastery[concept] || 50
        
        if (question.is_correct) {
          // Increase mastery for correct answers
          conceptMastery[concept] = Math.min(100, currentMastery + 5)
          
          // Add to strength areas if not already there
          if (!strengthAreas.includes(concept)) {
            strengthAreas.push(concept)
          }
          
          // Remove from weakness areas if present
          const weakIndex = weaknessAreas.indexOf(concept)
          if (weakIndex > -1) {
            weaknessAreas.splice(weakIndex, 1)
          }
        } else {
          // Decrease mastery for incorrect answers
          conceptMastery[concept] = Math.max(0, currentMastery - 3)
          
          // Add to weakness areas if not already there
          if (!weaknessAreas.includes(concept)) {
            weaknessAreas.push(concept)
          }
          
          // Remove from strength areas if present
          const strengthIndex = strengthAreas.indexOf(concept)
          if (strengthIndex > -1) {
            strengthAreas.splice(strengthIndex, 1)
          }
        }
      })
    })

    // Adjust learning speed based on overall performance
    let learningSpeed = learnerModel?.learning_speed || 'moderate'
    if (score >= 85) {
      learningSpeed = 'fast'
    } else if (score < 60) {
      learningSpeed = 'slow'
    }

    // Update retention rate
    const retentionRate = learnerModel?.retention_rate || 80
    const newRetentionRate = Math.min(100, Math.max(0, 
      retentionRate * 0.8 + score * 0.2
    ))

    const updateData = {
      concept_mastery: conceptMastery,
      strength_areas: strengthAreas,
      weakness_areas: weaknessAreas,
      learning_speed: learningSpeed,
      retention_rate: newRetentionRate,
      last_updated: new Date().toISOString()
    }

    if (learnerModel) {
      await supabase
        .from('learner_models')
        .update(updateData)
        .eq('user_id', userId)
        .eq('subject', goal.subject)
    } else {
      await supabase
        .from('learner_models')
        .insert({
          user_id: userId,
          subject: goal.subject,
          ...updateData,
          preferred_difficulty: 'medium',
          engagement_patterns: {}
        })
    }
  } catch (error) {
    console.error('Error updating learner model from quiz:', error)
  }
}
