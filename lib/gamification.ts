/**
 * Masterclass-level gamification system
 */

import { createSupabaseClient } from '@/lib/supabase/client'

export interface UserLevel {
  level: number
  title: string
  minXP: number
  maxXP: number
  color: string
  icon: string
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  xp: number
  unlocked: boolean
  unlockedAt?: string
  category: 'study' | 'streak' | 'mastery' | 'social' | 'special'
}

export interface UserStats {
  totalXP: number
  currentLevel: UserLevel
  nextLevel: UserLevel | null
  levelProgress: number
  achievements: Achievement[]
  weeklyRank: number
  studyStreak: number
  totalStudyTime: number
  subjectsMastered: string[]
}

export const LEVELS: UserLevel[] = [
  { level: 1, title: 'Novice Learner', minXP: 0, maxXP: 100, color: 'gray', icon: '🌱' },
  { level: 2, title: 'Curious Student', minXP: 100, maxXP: 250, color: 'green', icon: '📚' },
  { level: 3, title: 'Dedicated Scholar', minXP: 250, maxXP: 500, color: 'blue', icon: '🎓' },
  { level: 4, title: 'Knowledge Seeker', minXP: 500, maxXP: 1000, color: 'purple', icon: '🔍' },
  { level: 5, title: 'Master Student', minXP: 1000, maxXP: 2000, color: 'orange', icon: '⭐' },
  { level: 6, title: 'Expert Learner', minXP: 2000, maxXP: 3500, color: 'red', icon: '🏆' },
  { level: 7, title: 'Wisdom Keeper', minXP: 3500, maxXP: 6000, color: 'gold', icon: '👑' },
  { level: 8, title: 'Study Legend', minXP: 6000, maxXP: 10000, color: 'diamond', icon: '💎' },
  { level: 9, title: 'Knowledge Master', minXP: 10000, maxXP: 15000, color: 'platinum', icon: '🌟' },
  { level: 10, title: 'Academic Champion', minXP: 15000, maxXP: Infinity, color: 'rainbow', icon: '🏅' }
]

export const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  // Study achievements
  { id: 'first_quiz', title: 'Quiz Beginner', description: 'Complete your first quiz', icon: '📝', xp: 50, category: 'study' },
  { id: 'quiz_master', title: 'Quiz Master', description: 'Score 100% on 5 quizzes', icon: '🏆', xp: 200, category: 'study' },
  { id: 'flashcard_fluent', title: 'Flashcard Fluent', description: 'Review 100 flashcards', icon: '🃏', xp: 150, category: 'study' },
  { id: 'study_marathon', title: 'Study Marathon', description: 'Study for 2 hours straight', icon: '⏰', xp: 100, category: 'study' },
  { id: 'subject_expert', title: 'Subject Expert', description: 'Master 3 topics in one subject', icon: '🎯', xp: 300, category: 'study' },
  
  // Streak achievements
  { id: 'week_warrior', title: 'Week Warrior', description: '7-day study streak', icon: '🔥', xp: 100, category: 'streak' },
  { id: 'month_champion', title: 'Month Champion', description: '30-day study streak', icon: '💪', xp: 500, category: 'streak' },
  { id: 'streak_legend', title: 'Streak Legend', description: '100-day study streak', icon: '👑', xp: 1000, category: 'streak' },
  
  // Mastery achievements
  { id: 'perfect_score', title: 'Perfect Score', description: 'Get 100% on any quiz', icon: '💯', xp: 100, category: 'mastery' },
  { id: 'quick_learner', title: 'Quick Learner', description: 'Reach 80% mastery in 5 topics', icon: '⚡', xp: 250, category: 'mastery' },
  { id: 'knowledge_ninja', title: 'Knowledge Ninja', description: 'Complete 50 quizzes', icon: '🥷', xp: 400, category: 'mastery' },
  
  // Special achievements
  { id: 'early_bird', title: 'Early Bird', description: 'Study before 6 AM', icon: '🌅', xp: 50, category: 'special' },
  { id: 'night_owl', title: 'Night Owl', description: 'Study after 10 PM', icon: '🦉', xp: 50, category: 'special' },
  { id: 'helpful_friend', title: 'Helpful Friend', description: 'Share 5 study tips', icon: '🤝', xp: 150, category: 'social' },
]

export function getUserLevel(xp: number): { current: UserLevel; next: UserLevel | null; progress: number } {
  const current = LEVELS.find(level => xp >= level.minXP && xp < level.maxXP) || LEVELS[0]
  const nextIndex = LEVELS.findIndex(level => level.level === current.level) + 1
  const next = nextIndex < LEVELS.length ? LEVELS[nextIndex] : null
  
  const progress = next 
    ? ((xp - current.minXP) / (next.minXP - current.minXP)) * 100
    : 100
  
  return { current, next, progress }
}

export async function awardXP(userId: string, amount: number, reason: string): Promise<void> {
  const supabase = createSupabaseClient()
  
  // Update user XP
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_xp')
    .eq('id', userId)
    .single()
  
  const newXP = (profile?.total_xp || 0) + amount
  
  await supabase
    .from('profiles')
    .update({ total_xp: newXP })
    .eq('id', userId)
  
  // Check for level up
  const { current, next } = getUserLevel(newXP)
  const oldLevel = getUserLevel(profile?.total_xp || 0).current
  
  if (current.level > oldLevel.level) {
    await createNotification(userId, 'level_up', `Level Up! You're now ${current.title}!`, current.icon)
  }
  
  // Create XP transaction record
  await supabase
    .from('xp_transactions')
    .insert({
      user_id: userId,
      amount,
      reason,
      created_at: new Date().toISOString()
    })
}

export async function checkAchievements(userId: string): Promise<Achievement[]> {
  const supabase = createSupabaseClient()
  
  // Get user stats
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
  
  const { data: flashcards } = await supabase
    .from('flashcards')
    .select('review_count')
    .eq('user_id', userId)
  
  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('duration_minutes, created_at')
    .eq('user_id', userId)
  
  // Get existing achievements
  const { data: existingAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId)
  
  const unlockedIds = existingAchievements?.map(a => a.achievement_id) || []
  
  // Check each achievement
  const newAchievements: Achievement[] = []
  
  for (const achievement of ACHIEVEMENTS) {
    if (unlockedIds.includes(achievement.id)) continue
    
    let unlocked = false
    
    switch (achievement.id) {
      case 'first_quiz':
        unlocked = (quizzes?.length || 0) >= 1
        break
      case 'quiz_master':
        const perfectQuizzes = quizzes?.filter(q => q.score === q.total_questions) || []
        unlocked = perfectQuizzes.length >= 5
        break
      case 'flashcard_fluent':
        const totalReviews = flashcards?.reduce((sum, card) => sum + card.review_count, 0) || 0
        unlocked = totalReviews >= 100
        break
      case 'study_marathon':
        // Check for 2+ hour sessions
        const longSessions = sessions?.filter(s => s.duration_minutes >= 120) || []
        unlocked = longSessions.length >= 1
        break
      case 'week_warrior':
        unlocked = (profile?.study_streak || 0) >= 7
        break
      case 'month_champion':
        unlocked = (profile?.study_streak || 0) >= 30
        break
      case 'perfect_score':
        const hasPerfect = quizzes?.some(q => q.score === q.total_questions) || false
        unlocked = hasPerfect
        break
      case 'quick_learner':
        // This would need mastery data - simplified for now
        unlocked = (quizzes?.length || 0) >= 10
        break
      case 'knowledge_ninja':
        unlocked = (quizzes?.length || 0) >= 50
        break
      case 'early_bird':
        const earlySessions = sessions?.filter(s => {
          const hour = new Date(s.created_at).getHours()
          return hour >= 5 && hour < 6
        }) || []
        unlocked = earlySessions.length >= 1
        break
      case 'night_owl':
        const nightSessions = sessions?.filter(s => {
          const hour = new Date(s.created_at).getHours()
          return hour >= 22 || hour < 2
        }) || []
        unlocked = nightSessions.length >= 1
        break
    }
    
    if (unlocked) {
      newAchievements.push({ ...achievement, unlocked: true, unlockedAt: new Date().toISOString() })
      
      // Save achievement
      await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString()
        })
      
      // Award XP
      await awardXP(userId, achievement.xp, `Achievement: ${achievement.title}`)
      
      // Create notification
      await createNotification(userId, 'achievement', `Achievement Unlocked: ${achievement.title}!`, achievement.icon)
    }
  }
  
  return newAchievements
}

export async function createNotification(userId: string, type: string, message: string, icon: string): Promise<void> {
  const supabase = createSupabaseClient()
  
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      message,
      icon,
      read: false,
      created_at: new Date().toISOString()
    })
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const supabase = createSupabaseClient()
  
  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  const totalXP = profile?.total_xp || 0
  const { current, next, progress } = getUserLevel(totalXP)
  
  // Get achievements
  const { data: userAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id, unlocked_at')
    .eq('user_id', userId)
  
  const achievements: Achievement[] = ACHIEVEMENTS.map(achievement => ({
    ...achievement,
    unlocked: userAchievements?.some(ua => ua.achievement_id === achievement.id) || false,
    unlockedAt: userAchievements?.find(ua => ua.achievement_id === achievement.id)?.unlocked_at
  }))
  
  // Get weekly rank (simplified)
  const weeklyRank = Math.floor(Math.random() * 100) + 1 // Placeholder
  
  return {
    totalXP,
    currentLevel: current,
    nextLevel: next,
    levelProgress: progress,
    achievements,
    weeklyRank,
    studyStreak: profile?.study_streak || 0,
    totalStudyTime: profile?.total_study_minutes || 0,
    subjectsMastered: [] // Would need to calculate from performance data
  }
}

export function getLevelColor(color: string): string {
  const colors: Record<string, string> = {
    gray: 'bg-gray-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    gold: 'bg-yellow-500',
    diamond: 'bg-cyan-500',
    platinum: 'bg-gray-300',
    rainbow: 'bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500'
  }
  return colors[color] || 'bg-gray-500'
}
