'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { BottomNavigation } from '@/components/BottomNavigation'
import { useUserProfile } from '@/hooks/useUserProfile'
import { 
  Users, 
  Trophy, 
  TrendingUp, 
  Clock, 
  Star, 
  Award,
  Target,
  Zap,
  Heart,
  MessageCircle
} from 'lucide-react'

interface RealUser {
  id: string
  display_name: string
  avatar_url?: string
  study_streak: number
  total_study_time: number
  last_active: string
}

interface RealAchievement {
  id: string
  user_id: string
  achievement_type: string
  achievement_name: string
  earned_at: string
  metadata?: any
  profiles: {
    display_name: string
  }
}

export default function SocialPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [activeUsers, setActiveUsers] = useState<RealUser[]>([])
  const [recentAchievements, setRecentAchievements] = useState<RealAchievement[]>([])
  const [userStats, setUserStats] = useState<any>(null)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const { displayName } = useUserProfile()

  useEffect(() => {
    const loadRealData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/auth/login')
          return
        }

        // Load all users from profiles table
        try {
          console.log('🔍 Loading all users from profiles...')
          
          const { data: profilesData, error } = await supabase
            .from('profiles')
            .select('id, display_name, updated_at, created_at')
            .order('updated_at', { ascending: false })
            .limit(50) // Load up to 50 users

          console.log('📊 Profiles query result:', { data: profilesData, error })
          
          if (!error && profilesData && profilesData.length > 0) {
            const users: RealUser[] = profilesData.map((profile: any) => ({
              id: profile.id,
              display_name: profile.display_name || `User ${profile.id.substring(0, 8)}`,
              avatar_url: profile.avatar_url || undefined,
              study_streak: 0, // Will calculate later if needed
              total_study_time: 0,
              last_active: profile.updated_at || new Date().toISOString()
            }))
            setActiveUsers(users)
            console.log('✅ Loaded users:', users.length)
            setDebugInfo(`Loaded ${users.length} users from profiles`)
          } else {
            console.error('❌ Error loading profiles:', error)
            setDebugInfo(`Error loading profiles: ${error?.message || 'Unknown error'}`)
          }
        } catch (error) {
          console.error('❌ Error loading users:', error)
          setDebugInfo(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }

        // Load recent achievements (if table exists)
        try {
          const { data: achievementsData, error: achievementsError } = await supabase
            .from('achievements')
            .select('*')
            .order('earned_at', { ascending: false })
            .limit(10)

          if (!achievementsError && achievementsData) {
            setRecentAchievements(achievementsData)
            console.log('✅ Loaded achievements:', achievementsData.length)
          }
        } catch (error) {
          console.warn('Achievements table might not exist:', error)
        }

      } catch (error) {
        console.error('Error loading data:', error)
        setDebugInfo(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }

    loadRealData()
  }, [router, supabase])

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const past = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  const formatStudyTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    } else {
      return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
    }
  }

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'streak': return <Zap className="w-5 h-5" />
      case 'study_time': return <Clock className="w-5 h-5" />
      case 'quiz': return <Target className="w-5 h-5" />
      case 'social': return <Heart className="w-5 h-5" />
      default: return <Award className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading social...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 pb-32">
      <div className="px-6 py-8 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Social Learning</h1>
          <p className="text-gray-600 dark:text-gray-300">Connect with fellow learners</p>
        </div>

        {/* Debug Info */}
        {debugInfo && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">{debugInfo}</p>
          </div>
        )}

        {/* Active Users */}
        <div className="glass-hologram rounded-3xl p-8 shadow-glow-blue border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center glow-pulse-enhanced">
                <Users className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-glow">Active Learners</h3>
            </div>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center glow-breathing sparkle">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
          </div>

          {activeUsers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeUsers.map((user) => (
                <div key={user.id} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:border-white/40 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {user.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{user.display_name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatTimeAgo(user.last_active)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-orange-600">
                      <Zap className="w-4 h-4" />
                      <span>{user.study_streak}</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-600">
                      <Clock className="w-4 h-4" />
                      <span>{formatStudyTime(user.total_study_time)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No active users found</p>
            </div>
          )}
        </div>

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <div className="glass-hologram rounded-3xl p-8 shadow-glow-green border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center glow-pulse-enhanced">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-glow">Recent Achievements</h3>
              </div>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center glow-breathing sparkle">
                <Star className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="space-y-3">
              {recentAchievements.map((achievement) => (
                <div key={achievement.id} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:border-white/40 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white">
                      {getAchievementIcon(achievement.achievement_type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{achievement.achievement_name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {achievement.profiles?.display_name || 'Unknown'} • {formatTimeAgo(achievement.earned_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}
