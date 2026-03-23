'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getUserStats, getLevelColor, type UserStats, type Achievement } from '@/lib/gamification'
import {
  Trophy,
  Star,
  Flame,
  Clock,
  Target,
  Award,
  TrendingUp,
  BookOpen,
  Zap,
  Crown,
  Diamond,
  Medal,
  Gamepad2
} from 'lucide-react'
import { BottomNavigation } from '@/components/BottomNavigation'

export default function GamificationPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()

  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const userStats = await getUserStats(session.user.id)
      setStats(userStats)
      setLoading(false)
    } catch (error: any) {
      console.error('Error loading stats:', error)
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'study': return <BookOpen className="w-5 h-5" />
      case 'streak': return <Flame className="w-5 h-5" />
      case 'mastery': return <Target className="w-5 h-5" />
      case 'social': return <Star className="w-5 h-5" />
      case 'special': return <Zap className="w-5 h-5" />
      default: return <Trophy className="w-5 h-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'study': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
      case 'streak': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
      case 'mastery': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
      case 'social': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
      case 'special': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const filteredAchievements = stats?.achievements.filter(achievement =>
    selectedCategory === 'all' || achievement.category === selectedCategory
  ) || []

  const unlockedCount = stats?.achievements.filter(a => a.unlocked).length || 0
  const totalCount = stats?.achievements.length || 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading achievements...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Card className="max-w-md text-center">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Stats Not Available</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Unable to load your gamification stats
          </p>
          <Button onClick={() => router.push('/home')} className="w-full">
            Go Home
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/home')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Trophy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Achievements</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* Level Progress */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${getLevelColor(stats.currentLevel.color)} flex items-center justify-center text-white font-bold text-lg`}>
                {stats.currentLevel.icon}
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">{stats.currentLevel.title}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Level {stats.currentLevel.level}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalXP}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total XP</div>
            </div>
          </div>

          {stats.nextLevel && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Progress to Level {stats.nextLevel.level}</span>
                <span className="font-medium text-gray-900 dark:text-white">{Math.round(stats.levelProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`${getLevelColor(stats.currentLevel.color)} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${stats.levelProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-500 dark:text-gray-400">{stats.totalXP} XP</span>
                <span className="text-gray-500 dark:text-gray-400">{stats.nextLevel.minXP} XP</span>
              </div>
            </div>
          )}
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Streak</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.studyStreak}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">days</div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Study Time</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{Math.round(stats.totalStudyTime / 60)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">hours</div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Achievements</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{unlockedCount}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">of {totalCount}</div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Weekly Rank</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">#{stats.weeklyRank}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">this week</div>
          </Card>
        </div>

        {/* Achievement Categories */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Categories</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'study', 'streak', 'mastery', 'social', 'special'].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}
              >
                {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Achievements Grid */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            {selectedCategory === 'all' ? 'All Achievements' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Achievements`}
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {filteredAchievements.map((achievement) => (
              <Card
                key={achievement.id}
                className={`p-4 transition-all ${achievement.unlocked
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800'
                    : 'opacity-60'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${achievement.unlocked
                      ? getCategoryColor(achievement.category)
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                    }`}>
                    {achievement.unlocked ? getCategoryIcon(achievement.category) : '🔒'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {achievement.title}
                      </h3>
                      {achievement.unlocked && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">
                          <Star className="w-3 h-3" />
                          {achievement.xp} XP
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {achievement.description}
                    </p>
                    {achievement.unlocked && achievement.unlockedAt && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Leaderboard Preview */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 dark:text-white">Weekly Leaderboard</h2>
            <Button variant="ghost" size="sm" className="text-xs">
              View All
            </Button>
          </div>
          <div className="space-y-2">
            {[
              { rank: 1, name: 'You', xp: stats.totalXP, icon: '👤' },
              { rank: 2, name: 'Alex Chen', xp: 2450, icon: '🥈' },
              { rank: 3, name: 'Sarah Kim', xp: 2380, icon: '🥉' },
              { rank: 4, name: 'Mike Johnson', xp: 2200, icon: '🏅' },
              { rank: 5, name: 'Emma Davis', xp: 2150, icon: '🎖️' },
            ].map((user) => (
              <div key={user.rank} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold">
                    {user.icon}
                  </div>
                  <span className={`text-sm font-medium ${user.name === 'You' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                    }`}>
                    {user.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{user.xp}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">XP</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  )
}
