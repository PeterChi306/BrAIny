/**
 * Achievement and Streak Tracking System
 * This file contains functions to track user progress and award achievements
 */

import { createSupabaseClient } from '@/lib/supabase/client'
import { awardXP, checkAchievements } from './gamification'

// Track quiz completion and check achievements
export async function trackQuizCompletion(userId: string, quizId: string, score: number, totalQuestions: number) {
  const supabase = createSupabaseClient()
  
  try {
    // Award XP for quiz completion
    const xpEarned = Math.floor((score / totalQuestions) * 50) // Base XP up to 50
    await awardXP(userId, xpEarned, `Quiz completion: ${score}/${totalQuestions}`)
    
    // Create study session
    await supabase
      .from('study_sessions')
      .insert({
        user_id: userId,
        session_type: 'quiz',
        duration_minutes: 10, // Estimated quiz time
        performance_score: (score / totalQuestions) * 100,
        created_at: new Date().toISOString()
      })
    
    // Update daily usage
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('daily_usage')
      .upsert({
        user_id: userId,
        date: today,
        ai_messages_count: 0, // Quiz doesn't count as AI messages
        scans_count: 0
      }, {
        onConflict: 'user_id,date'
      })
    
    // Check for new achievements
    const newAchievements = await checkAchievements(userId)
    
    return {
      xpEarned,
      achievementsUnlocked: newAchievements.length
    }
  } catch (error) {
    console.error('Error tracking quiz completion:', error)
    throw error
  }
}

// Track flashcard review and check achievements
export async function trackFlashcardReview(userId: string, flashcardId: string) {
  const supabase = createSupabaseClient()
  
  try {
    // Award XP for flashcard review
    await awardXP(userId, 5, 'Flashcard review')
    
    // Update flashcard review count
    await supabase
      .from('flashcards')
      .update({ 
        review_count: supabase.rpc('increment', { count: 1 }),
        last_reviewed_at: new Date().toISOString()
      })
      .eq('id', flashcardId)
    
    // Create study session
    await supabase
      .from('study_sessions')
      .insert({
        user_id: userId,
        session_type: 'flashcards',
        duration_minutes: 2, // Estimated review time
        created_at: new Date().toISOString()
      })
    
    // Update daily usage
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('daily_usage')
      .upsert({
        user_id: userId,
        date: today,
        ai_messages_count: 0,
        scans_count: 0
      }, {
        onConflict: 'user_id,date'
      })
    
    // Check for new achievements
    const newAchievements = await checkAchievements(userId)
    
    return {
      xpEarned: 5,
      achievementsUnlocked: newAchievements.length
    }
  } catch (error) {
    console.error('Error tracking flashcard review:', error)
    throw error
  }
}

// Track chat session and update streak
export async function trackChatSession(userId: string, messageCount: number, durationMinutes: number) {
  const supabase = createSupabaseClient()
  
  try {
    // Award XP for chat session
    const xpEarned = Math.min(messageCount * 2, 20) // Up to 20 XP per session
    await awardXP(userId, xpEarned, `Chat session: ${messageCount} messages`)
    
    // Create study session
    await supabase
      .from('study_sessions')
      .insert({
        user_id: userId,
        session_type: 'chat',
        duration_minutes: durationMinutes,
        created_at: new Date().toISOString()
      })
    
    // Update daily usage (this will trigger streak update)
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('daily_usage')
      .upsert({
        user_id: userId,
        date: today,
        ai_messages_count: messageCount,
        scans_count: 0
      }, {
        onConflict: 'user_id,date'
      })
    
    // Check for new achievements
    const newAchievements = await checkAchievements(userId)
    
    return {
      xpEarned,
      achievementsUnlocked: newAchievements.length
    }
  } catch (error) {
    console.error('Error tracking chat session:', error)
    throw error
  }
}

// Get current user streak
export async function getUserStreak(userId: string): Promise<number> {
  const supabase = createSupabaseClient()
  
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('study_streak')
      .eq('id', userId)
      .single()
    
    return profile?.study_streak || 0
  } catch (error) {
    console.error('Error getting user streak:', error)
    return 0
  }
}

// Get mastery progress for subjects
export async function getSubjectMastery(userId: string, subject: string): Promise<number> {
  const supabase = createSupabaseClient()
  
  try {
    // Get quiz performance for this subject
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('score, total_questions')
      .eq('user_id', userId)
      .eq('subject', subject)
      .eq('status', 'completed')
    
    if (!quizzes || quizzes.length === 0) return 0
    
    // Calculate average score
    const totalScore = quizzes.reduce((sum, quiz) => sum + quiz.score, 0)
    const totalPossible = quizzes.reduce((sum, quiz) => sum + quiz.total_questions, 0)
    
    return Math.round((totalScore / totalPossible) * 100)
  } catch (error) {
    console.error('Error getting subject mastery:', error)
    return 0
  }
}

// Update leaderboard weekly
export async function updateWeeklyLeaderboard() {
  const supabase = createSupabaseClient()
  
  try {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of week
    const weekStartStr = weekStart.toISOString().split('T')[0]
    
    // Get all users with XP this week
    const { data: xpData } = await supabase
      .from('xp_transactions')
      .select('user_id, amount')
      .gte('created_at', weekStart.toISOString())
    
    if (!xpData) return
    
    // Aggregate XP by user
    const userXP: Record<string, number> = {}
    xpData.forEach(({ user_id, amount }) => {
      userXP[user_id] = (userXP[user_id] || 0) + amount
    })
    
    // Sort users by XP and assign ranks
    const sortedUsers = Object.entries(userXP)
      .sort(([, a], [, b]) => b - a)
      .map(([userId, xp], index) => ({
        user_id: userId,
        weekly_xp: xp,
        weekly_rank: index + 1,
        week_start_date: weekStartStr
      }))
    
    // Update leaderboard
    if (sortedUsers.length > 0) {
      await supabase
        .from('leaderboard')
        .upsert(sortedUsers, {
          onConflict: 'user_id,week_start_date'
        })
    }
  } catch (error) {
    console.error('Error updating weekly leaderboard:', error)
  }
}
