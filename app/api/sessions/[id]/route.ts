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
      .from('adaptive_sessions')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching session:', error)
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error in session GET by ID:', error)
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
    const { state, current_step, performance, answer_data } = body

    // Update session state
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (state !== undefined) updateData.state = state
    if (current_step !== undefined) updateData.current_step = current_step
    if (performance !== undefined) updateData.performance = performance

    // Handle answer submission
    if (answer_data) {
      const { question_id, user_answer, time_taken_seconds } = answer_data
      
      // Get current session to update content
      const { data: currentSession } = await supabase
        .from('adaptive_sessions')
        .select('content')
        .eq('id', params.id)
        .single()

      if (currentSession) {
        const content = currentSession.content
        const question = content.questions.find((q: any) => q.id === question_id)
        
        if (question) {
          question.user_answer = user_answer
          question.is_correct = user_answer === question.correct_answer
          question.time_taken_seconds = time_taken_seconds
          question.answered_at = new Date().toISOString()
          
          updateData.content = content
        }
      }
    }

    // Mark session as completed if reaching final state
    if (state === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { data: session, error } = await supabase
      .from('adaptive_sessions')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating session:', error)
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
    }

    // Update learner model based on performance
    if (performance && session.goal_id) {
      await updateLearnerModel(supabase, user.id, session.goal_id, performance)
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error in session PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function updateLearnerModel(
  supabase: any,
  userId: string,
  goalId: string,
  performance: any
) {
  try {
    // Get the goal to determine subject
    const { data: goal } = await supabase
      .from('learning_goals')
      .select('subject')
      .eq('id', goalId)
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

    // Update concept mastery based on performance
    if (performance.concepts_mastered) {
      performance.concepts_mastered.forEach((concept: string) => {
        conceptMastery[concept] = Math.min(100, (conceptMastery[concept] || 0) + 10)
        if (!strengthAreas.includes(concept)) {
          strengthAreas.push(concept)
        }
        const weakIndex = weaknessAreas.indexOf(concept)
        if (weakIndex > -1) {
          weaknessAreas.splice(weakIndex, 1)
        }
      })
    }

    if (performance.concepts_struggling) {
      performance.concepts_struggling.forEach((concept: string) => {
        conceptMastery[concept] = Math.max(0, (conceptMastery[concept] || 50) - 5)
        if (!weaknessAreas.includes(concept)) {
          weaknessAreas.push(concept)
        }
        const strengthIndex = strengthAreas.indexOf(concept)
        if (strengthIndex > -1) {
          strengthAreas.splice(strengthIndex, 1)
        }
      })
    }

    // Adjust learning speed based on performance
    let learningSpeed = learnerModel?.learning_speed || 'moderate'
    if (performance.accuracy > 85 && performance.speed > 80) {
      learningSpeed = 'fast'
    } else if (performance.accuracy < 60 || performance.speed < 40) {
      learningSpeed = 'slow'
    }

    // Update retention rate
    const retentionRate = learnerModel?.retention_rate || 80
    const newRetentionRate = Math.min(100, Math.max(0, 
      retentionRate * 0.9 + performance.accuracy * 0.1
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
    console.error('Error updating learner model:', error)
  }
}
