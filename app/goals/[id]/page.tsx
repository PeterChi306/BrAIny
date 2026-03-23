'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, Target, Calendar, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react'
import { BottomNavigation } from '@/components/BottomNavigation'

interface Goal {
  id: string
  title: string
  description: string
  target_date: string
  progress: number
  status: 'active' | 'completed' | 'paused'
  created_at: string
  updated_at: string
}

export default function GoalDetailPage() {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [goal, setGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Extract id from URL
    const urlId = window.location.pathname.split('/').pop()
    if (urlId) {
      setId(urlId)
    }
  }, [])

  useEffect(() => {
    if (!id) return

    const fetchGoal = async () => {
      try {
        const supabase = createSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: goalData, error } = await supabase
          .from('goals')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single()

        if (error) throw error
        if (!goalData) {
          setError('Goal not found')
          return
        }

        setGoal(goalData)
      } catch (error: any) {
        console.error('Error fetching goal:', error)
        setError('Failed to load goal')
      } finally {
        setLoading(false)
      }
    }

    fetchGoal()
  }, [id, router])

  const updateProgress = async (newProgress: number) => {
    if (!goal) return

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('goals')
        .update({ 
          progress: newProgress,
          status: newProgress >= 100 ? 'completed' : 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', goal.id)

      if (error) throw error

      setGoal(prev => prev ? { ...prev, progress: newProgress, status: newProgress >= 100 ? 'completed' : 'active' } : null)
    } catch (error: any) {
      console.error('Error updating progress:', error)
      alert('Failed to update progress')
    }
  }

  const deleteGoal = async () => {
    if (!goal || !confirm('Are you sure you want to delete this goal?')) return

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goal.id)

      if (error) throw error

      router.push('/goals')
    } catch (error: any) {
      console.error('Error deleting goal:', error)
      alert('Failed to delete goal')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading goal...</p>
        </div>
      </div>
    )
  }

  if (error || !goal) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Card className="max-w-md">
          <div className="text-center p-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Goal Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'This goal could not be found.'}</p>
            <Button onClick={() => router.push('/goals')} className="w-full">
              Back to Goals
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const progressPercentage = Math.min(goal.progress, 100)
  const isCompleted = goal.status === 'completed'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-900 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/goals')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Goal Details</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isCompleted ? 'Completed' : 'In Progress'}
              </p>
            </div>
          </div>
          <button
            onClick={deleteGoal}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors text-red-600"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Goal Overview */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${isCompleted ? 'bg-green-100 dark:bg-green-900/20' : 'bg-blue-100 dark:bg-blue-900/20'}`}>
                <Target className={`w-6 h-6 ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{goal.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Created {new Date(goal.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            {isCompleted && (
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            )}
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-6">{goal.description}</p>

          {/* Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-white">Progress</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  isCompleted ? 'bg-green-500' : 'bg-blue-600'
                }`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Target Date */}
          <div className="flex items-center gap-3 mt-6">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Target Date</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(goal.target_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Progress Update */}
        {!isCompleted && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Update Progress</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                {[25, 50, 75, 100].map((value) => (
                  <Button
                    key={value}
                    onClick={() => updateProgress(value)}
                    variant={progressPercentage >= value ? 'primary' : 'outline'}
                    className="flex-1"
                  >
                    {value}%
                  </Button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Progress
                </label>
                <div className="flex gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progressPercentage}
                    onChange={(e) => updateProgress(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                    {progressPercentage}%
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{progressPercentage}%</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Complete</p>
          </Card>
          <Card className="p-4 text-center">
            <Target className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.max(0, 100 - progressPercentage)}%
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Remaining</p>
          </Card>
          <Card className="p-4 text-center">
            <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.ceil((new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Days Left</p>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
