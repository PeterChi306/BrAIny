'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { BottomNavigation } from '@/components/BottomNavigation'
import { useUserProfile } from '@/hooks/useUserProfile'
import {
  User,
  Calendar,
  Target,
  Clock,
  TrendingUp,
  Trophy,
  Zap,
  Star,
  Award,
  BookOpen,
  Brain
} from 'lucide-react'

interface UserAchievement {
  id: string
  achievement_name: string
  achievement_type: string
  earned_at: string
  metadata?: any
}

interface UserStats {
  study_streak: number
  total_study_time: number
  messages_sent: number
  quizzes_completed: number
  flashcards_created: number
  average_score: number
  subjects_mastered: string[]
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const { displayName, refreshProfile } = useUserProfile()

  useEffect(() => {
    loadRealUserData()
  }, [])

  const loadRealUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Load user stats from profiles and related data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Load real achievements
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false })
        .limit(10)

      // Load recent study sessions for activity
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Calculate additional stats
      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('score, total_questions')
        .eq('user_id', user.id)
        .eq('status', 'completed')

      const { data: flashcards } = await supabase
        .from('flashcards')
        .select('mastery_level')
        .eq('user_id', user.id)

      const averageScore = quizzes && quizzes.length > 0
        ? Math.round(quizzes.reduce((sum, q) => sum + (q.score / q.total_questions * 100), 0) / quizzes.length)
        : 0

      const masteredSubjects = flashcards
        ?.filter(card => card.mastery_level >= 3)
        ?.reduce((acc: string[], card) => {
          // This would need subject field, using placeholder for now
          return acc
        }, []) || []

      const stats: UserStats = {
        study_streak: profile?.study_streak || 0,
        total_study_time: profile?.total_study_time || 0,
        messages_sent: profile?.messages_sent || 0,
        quizzes_completed: quizzes?.length || 0,
        flashcards_created: flashcards?.length || 0,
        average_score: averageScore,
        subjects_mastered: masteredSubjects
      }

      setUserStats(stats)
      setAchievements(userAchievements || [])
      setRecentActivity(sessions || [])
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatStudyTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  }

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'streak': return <Zap className="w-6 h-6" />
      case 'study_time': return <Clock className="w-6 h-6" />
      case 'quiz': return <Target className="w-6 h-6" />
      case 'mastery': return <Trophy className="w-6 h-6" />
      default: return <Star className="w-6 h-6" />
    }
  }

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-600 bg-purple-100'
    if (streak >= 14) return 'text-blue-600 bg-blue-100'
    if (streak >= 7) return 'text-green-600 bg-green-100'
    return 'text-orange-600 bg-orange-100'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 pb-24">
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-4">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {displayName}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your learning journey
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-2xl ${getStreakColor(userStats?.study_streak || 0)}`}>
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-6 h-6" />
              <span className="text-2xl font-bold">{userStats?.study_streak || 0}</span>
            </div>
            <p className="text-sm font-medium">Day Streak</p>
          </div>

          <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-6 h-6 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">
                {formatStudyTime(userStats?.total_study_time || 0)}
              </span>
            </div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Study Time</p>
          </div>

          <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-6 h-6 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{userStats?.quizzes_completed || 0}</span>
            </div>
            <p className="text-sm font-medium text-green-600 dark:text-green-400">Quizzes Done</p>
          </div>

          <div className="p-4 bg-purple-100 dark:bg-purple-900/20 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-6 h-6 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">{userStats?.average_score || 0}%</span>
            </div>
            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Average Score</p>
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5" />
            Recent Achievements
          </h2>
          {achievements.length > 0 ? (
            <div className="space-y-3">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                    {getAchievementIcon(achievement.achievement_type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{achievement.achievement_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(achievement.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-2xl">
              <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No achievements yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Start learning to earn your first achievement!</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recent Activity
          </h2>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{activity.topic}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {activity.subject} • {formatStudyTime(activity.duration_minutes)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${activity.performance_score >= 80 ? 'text-green-600' :
                          activity.performance_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                        {activity.performance_score}%
                      </p>
                      <p className="text-xs text-gray-500">Score</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-2xl">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No recent activity</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Start a learning session to see your activity here</p>
            </div>
          )}
        </div>

        {/* Mastery Overview */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Learning Progress
          </h2>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-800">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Messages Sent</span>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{userStats?.messages_sent || 0}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Flashcards Created</span>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{userStats?.flashcards_created || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
