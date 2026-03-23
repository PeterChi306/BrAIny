'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { getCurrentStreak, isStreakAtRisk } from '@/lib/streak'
import { BottomNavigation } from '@/components/BottomNavigation'
import { LoadingScreen } from '@/components/LoadingScreen'
import { ArrowLeft, Flame, Calendar, Trophy, TrendingUp } from 'lucide-react'

export default function StreakPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [isAtRisk, setIsAtRisk] = useState(false)
  const [hasFreeze, setHasFreeze] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const loadStreak = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/home')
          return
        }

        const streakData = await getCurrentStreak(session.user.id)
        setStreak(streakData.streak)
        setHasFreeze(!streakData.streakFreeze)
        
        // Check if streak is at risk
        const atRisk = await isStreakAtRisk(session.user.id)
        setIsAtRisk(atRisk)
      } catch (error) {
        console.error('Error loading streak:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStreak()
  }, [mounted, router, supabase])

  if (!mounted) {
    return <LoadingScreen message="Loading streak..." />
  }

  if (loading) {
    return <LoadingScreen message="Loading your learning streak..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Learning Streak</h1>
          <div className="w-9" />
        </div>

        {/* Streak Display */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl mb-6 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Flame className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-2">{streak}</h2>
          <p className="text-gray-600 dark:text-gray-400">Day Streak</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
            <Calendar className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{streak * 7}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Days</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
            <Trophy className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.floor(streak / 7)}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Weeks</p>
          </div>
        </div>

        {/* Motivation */}
        <div className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center mb-3">
            <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-2" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Keep it going!</h3>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {streak === 0 
              ? "Start your learning journey today! Even one day can begin an amazing streak."
              : streak < 7 
                ? `Great job! You're on a ${streak}-day streak. Keep the momentum going!`
                : streak < 30
                ? `Incredible! ${streak} days of consistent learning. You're building a powerful habit!`
                : `Amazing! ${streak} days! You're a learning champion!`
            }
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => router.push('/tutor')}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl p-4 font-semibold hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
        >
          Continue Learning
        </button>
      </div>

      <BottomNavigation />
    </div>
  )
}
