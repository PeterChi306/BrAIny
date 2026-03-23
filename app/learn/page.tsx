'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { BottomNavigation } from '@/components/BottomNavigation'
import { useUserProfile } from '@/hooks/useUserProfile'
import { 
  BookOpen,
  Brain,
  Target,
  Zap,
  ArrowRight,
  Clock,
  Trophy
} from 'lucide-react'

function DailyLearnTimeSection() {
  const supabase = createSupabaseClient()
  const [minutesStudied, setMinutesStudied] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setLoading(false)
          return
        }

        // Get today's actual app time from app_sessions
        let totalMinutes = 0
        try {
          const today = new Date().toISOString().split('T')[0]
          
          // Method 1: Get actual app time from app_sessions table
          const { data: appSessions } = await supabase
            .from('app_sessions')
            .select('duration_minutes, start_time, end_time')
            .eq('user_id', session.user.id)
            .eq('session_type', 'app_usage')
            .gte('created_at', today + 'T00:00:00')
            .lt('created_at', today + 'T23:59:59')

          if (appSessions && appSessions.length > 0) {
            // Sum up all app session durations
            totalMinutes = appSessions.reduce((acc, session) => {
              if (session.duration_minutes) {
                return acc + session.duration_minutes
              } else if (session.start_time && session.end_time) {
                // Calculate duration if not pre-calculated
                const start = new Date(session.start_time)
                const end = new Date(session.end_time)
                const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60))
                return acc + duration
              }
              return acc
            }, 0)
            
            console.log('App time from app_sessions:', {
              sessionCount: appSessions.length,
              totalMinutes,
              sessions: appSessions.map(s => ({ duration: s.duration_minutes }))
            })
          } else {
            // Method 2: Fallback to chat_sessions as estimate
            const { data: chatSessions } = await supabase
              .from('chat_sessions')
              .select('created_at, message_count')
              .eq('user_id', session.user.id)
              .gte('created_at', today + 'T00:00:00')
              .lt('created_at', today + 'T23:59:59')

            if (chatSessions && chatSessions.length > 0) {
              // Estimate app time based on chat sessions
              totalMinutes = chatSessions.reduce((acc, session) => {
                // Base time: 15 minutes per session (more realistic for app usage)
                // Additional time: 2 minutes per message
                const sessionTime = 15 + ((session.message_count || 1) * 2)
                return acc + sessionTime
              }, 0)
              
              console.log('App time from chat_sessions (fallback):', {
                sessionCount: chatSessions.length,
                totalMinutes,
                sessions: chatSessions.map(s => ({ messages: s.message_count }))
              })
            }
          }
          
          // Method 3: Minimum time if user was active today
          if (totalMinutes === 0) {
            const { data: recentActivity } = await supabase
              .from('chat_sessions')
              .select('created_at')
              .eq('user_id', session.user.id)
              .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
              .limit(1)

            if (recentActivity && recentActivity.length > 0) {
              // Give minimum 20 minutes if user was active today
              totalMinutes = 20
              console.log('App time from recent activity (fallback):', { totalMinutes })
            }
          }
          
          console.log('Final app time calculation:', {
            totalMinutes,
            method: appSessions ? 'app_sessions' : 'chat_sessions',
            hasActivity: totalMinutes > 0
          })
        } catch (error) {
          console.log('Error calculating study time:', error)
          totalMinutes = 0
        }

        setMinutesStudied(totalMinutes)
      } catch (error) {
        console.error('Error loading progress:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProgress()
  }, [supabase])

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Learn Time Today</h2>
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl text-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg">Loading...</h3>
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>
    )
  }

  const progressPercentage = Math.min(100, Math.round((minutesStudied / 60) * 100)) // 60 minutes = 100%

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Learn Time Today</h2>
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl text-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg">Keep Learning!</h3>
          <Clock className="w-6 h-6" />
        </div>
        <p className="text-sm opacity-90 mb-3">
          {minutesStudied === 0 
            ? "Start your learning adventure today!" 
            : minutesStudied < 15
            ? "Great start! Keep building momentum!"
            : minutesStudied < 30
            ? "You're building a solid learning habit!"
            : minutesStudied < 60
            ? "Excellent progress! You're almost at your daily goal!"
            : "Amazing! You've reached your daily learning goal! 🎓"}
        </p>
        <div className="bg-white/20 rounded-xl p-3">
          <div className="flex justify-between text-sm mb-2">
            <span>Time Learned</span>
            <span>{minutesStudied} min</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-2">
            <div className="bg-white h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <p className="text-xs mt-2 opacity-75">Goal: 60 minutes daily</p>
        </div>
      </div>
    </div>
  )
}

interface Subject {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  description: string
}

export default function LearnPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const { displayName } = useUserProfile()

  const subjects: Subject[] = [
    {
      id: 'stem',
      name: 'STEM',
      icon: <Brain className="w-6 h-6" />,
      color: 'bg-blue-500',
      description: 'Science, Tech, Engineering, Math'
    },
    {
      id: 'languages',
      name: 'Languages',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'bg-green-500',
      description: 'English, Spanish, French, more'
    },
    {
      id: 'arts',
      name: 'Arts & Humanities',
      icon: <Trophy className="w-6 h-6" />,
      color: 'bg-purple-500',
      description: 'History, Literature, Philosophy'
    },
    {
      id: 'life-skills',
      name: 'Life Skills',
      icon: <Target className="w-6 h-6" />,
      color: 'bg-orange-500',
      description: 'Finance, Health, Career'
    }
  ]

  const quickActions = [
    {
      title: 'AI Tutor Session',
      description: 'Personalized learning with AI',
      icon: <Brain className="w-8 h-8" />,
      action: () => router.push('/tutor'),
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Practice Quiz',
      description: 'Test your knowledge instantly',
      icon: <Target className="w-8 h-8" />,
      action: () => router.push('/tutor?mode=quiz'),
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'Flashcards',
      description: 'Review with smart flashcards',
      icon: <Zap className="w-8 h-8" />,
      action: () => router.push('/tutor?mode=flashcard'),
      color: 'bg-purple-600 hover:bg-purple-700'
    }
  ]

  useEffect(() => {
    // Simple loading timer
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading learning center...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 pb-24 safe-area-pb">
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Learning, {displayName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choose your learning path
          </p>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Start</h2>
          <div className="grid grid-cols-1 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`p-4 rounded-2xl text-white ${action.color} transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-4`}
              >
                <div className="bg-white/20 p-3 rounded-xl">
                  {action.icon}
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-lg">{action.title}</h3>
                  <p className="text-sm opacity-90">{action.description}</p>
                </div>
                <ArrowRight className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>

        {/* Subjects */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Learning Categories</h2>
          <div className="grid grid-cols-2 gap-3">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => router.push(`/tutor?message=${encodeURIComponent(`I'd like to learn about ${subject.name}. Can you help me get started?`)}&new=true`)}
                className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 border border-gray-100 dark:border-gray-700"
              >
                <div className={`${subject.color} w-12 h-12 rounded-xl flex items-center justify-center text-white mb-3`}>
                  {subject.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{subject.name}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">{subject.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Progress */}
        <DailyLearnTimeSection />
      </div>

      <BottomNavigation />
    </div>
  )
}
