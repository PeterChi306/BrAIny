import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { SpacedRepetitionEngine } from '@/lib/spaced-repetition'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const goal_id = searchParams.get('goal_id')
    const type = searchParams.get('type') // 'due', 'new', 'review', 'session'
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('spaced_repetition_cards')
      .select('*')
      .eq('user_id', user.id)
      .order('next_review_date', { ascending: true })

    if (goal_id) {
      query = query.eq('goal_id', goal_id)
    }

    const { data: cards, error } = await query

    if (error) {
      console.error('Error fetching spaced repetition cards:', error)
      return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 })
    }

    let result = cards

    switch (type) {
      case 'due':
        result = SpacedRepetitionEngine.getDueCards(cards)
        break
      case 'new':
        result = SpacedRepetitionEngine.getNewCards(cards, limit)
        break
      case 'review':
        result = SpacedRepetitionEngine.getReviewCards(cards, limit)
        break
      case 'session':
        const sessionLength = parseInt(searchParams.get('session_length') || '15')
        const session = SpacedRepetitionEngine.generateStudySession(cards, sessionLength)
        return NextResponse.json({ session })
      case 'schedule':
        const schedule = SpacedRepetitionEngine.calculateStudySchedule(cards)
        return NextResponse.json({ schedule })
      case 'analysis':
        const analysis = SpacedRepetitionEngine.analyzeLearningPatterns(cards)
        return NextResponse.json({ analysis })
    }

    return NextResponse.json({ cards: result })
  } catch (error) {
    console.error('Error in spaced-repetition GET:', error)
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
    const { goal_id, front_text, back_text, concept_tags = [] } = body

    if (!goal_id || !front_text || !back_text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check user's subscription tier for limits
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .single()

    const tier = subscription?.tier || 'free'
    
    // Apply tier-based limits
    const maxCardsPerGoal = tier === 'free' ? 50 : tier === 'pro' ? 200 : 999
    
    // Check current card count for this goal
    const { data: existingCards } = await supabase
      .from('spaced_repetition_cards')
      .select('id')
      .eq('user_id', user.id)
      .eq('goal_id', goal_id)

    if (existingCards && existingCards.length >= maxCardsPerGoal) {
      return NextResponse.json({ 
        error: 'Card limit reached for this goal',
        limit: maxCardsPerGoal,
        current: existingCards.length
      }, { status: 429 })
    }

    // Create new card
    const newCard = SpacedRepetitionEngine.createCard(
      user.id,
      goal_id,
      front_text,
      back_text,
      concept_tags
    )

    const { data: card, error } = await supabase
      .from('spaced_repetition_cards')
      .insert(newCard)
      .select()
      .single()

    if (error) {
      console.error('Error creating spaced repetition card:', error)
      return NextResponse.json({ error: 'Failed to create card' }, { status: 500 })
    }

    return NextResponse.json({ card }, { status: 201 })
  } catch (error) {
    console.error('Error in spaced-repetition POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { card_id, quality, response_time_seconds, was_correct, hesitated, needed_hint } = body

    if (!card_id || quality === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get current card
    const { data: card, error: fetchError } = await supabase
      .from('spaced_repetition_cards')
      .select('*')
      .eq('id', card_id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    // Calculate quality if not provided
    const calculatedQuality = quality !== undefined ? quality : 
      SpacedRepetitionEngine.getQualityFromResponse(
        response_time_seconds || 10,
        was_correct || false,
        hesitated || false,
        needed_hint || false
      )

    // Calculate next review parameters
    const nextReview = SpacedRepetitionEngine.calculateNextReview(card, calculatedQuality)

    // Update performance history
    const performanceHistory = [...(card.performance_history || []), calculatedQuality].slice(-10) // Keep last 10

    // Calculate next review date
    const nextReviewDate = new Date()
    nextReviewDate.setDate(nextReviewDate.getDate() + nextReview.intervalDays)

    // Update card
    const { data: updatedCard, error: updateError } = await supabase
      .from('spaced_repetition_cards')
      .update({
        easiness_factor: nextReview.easinessFactor,
        repetition_count: nextReview.repetitionCount,
        interval_days: nextReview.intervalDays,
        next_review_date: nextReviewDate.toISOString().split('T')[0],
        last_reviewed_at: new Date().toISOString(),
        performance_history: performanceHistory,
        mastery_level: nextReview.masteryLevel
      })
      .eq('id', card_id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating spaced repetition card:', updateError)
      return NextResponse.json({ error: 'Failed to update card' }, { status: 500 })
    }

    // Update learner model based on performance
    await updateLearnerModelFromCard(supabase, user.id, card, calculatedQuality)

    return NextResponse.json({ 
      card: updatedCard,
      quality: calculatedQuality,
      nextReview: {
        intervalDays: nextReview.intervalDays,
        nextReviewDate: nextReviewDate.toISOString().split('T')[0],
        masteryLevel: nextReview.masteryLevel
      }
    })
  } catch (error) {
    console.error('Error in spaced-repetition PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function updateLearnerModelFromCard(
  supabase: any,
  userId: string,
  card: any,
  quality: number
) {
  try {
    // Get the goal to determine subject
    const { data: goal } = await supabase
      .from('learning_goals')
      .select('subject')
      .eq('id', card.goal_id)
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

    // Update concept mastery based on card performance
    card.concept_tags?.forEach((concept: string) => {
      const currentMastery = conceptMastery[concept] || 50
      
      if (quality >= 3) {
        // Good performance - increase mastery
        conceptMastery[concept] = Math.min(100, currentMastery + 2)
        
        // Add to strength areas if mastery is high
        if (conceptMastery[concept] >= 80 && !strengthAreas.includes(concept)) {
          strengthAreas.push(concept)
        }
        
        // Remove from weakness areas if present
        const weakIndex = weaknessAreas.indexOf(concept)
        if (weakIndex > -1) {
          weaknessAreas.splice(weakIndex, 1)
        }
      } else {
        // Poor performance - decrease mastery
        conceptMastery[concept] = Math.max(0, currentMastery - 3)
        
        // Add to weakness areas if performance is poor
        if (quality <= 2 && !weaknessAreas.includes(concept)) {
          weaknessAreas.push(concept)
        }
        
        // Remove from strength areas if mastery dropped
        const strengthIndex = strengthAreas.indexOf(concept)
        if (strengthIndex > -1 && conceptMastery[concept] < 70) {
          strengthAreas.splice(strengthIndex, 1)
        }
      }
    })

    // Update retention rate based on overall performance
    const retentionRate = learnerModel?.retention_rate || 80
    const newRetentionRate = Math.min(100, Math.max(0, 
      retentionRate * 0.95 + (quality / 5) * 100 * 0.05
    ))

    const updateData = {
      concept_mastery: conceptMastery,
      strength_areas: strengthAreas,
      weakness_areas: weaknessAreas,
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
          learning_speed: 'moderate',
          engagement_patterns: {}
        })
    }
  } catch (error) {
    console.error('Error updating learner model from card:', error)
  }
}
