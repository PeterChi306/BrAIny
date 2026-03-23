'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { 
  Brain, 
  Target, 
  Calendar, 
  TrendingUp, 
  BookOpen, 
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Zap
} from 'lucide-react'
import { BottomNavigation } from '@/components/BottomNavigation'
import { ThemeToggle } from '@/components/ThemeToggle'

interface SmartPlan {
  id: string
  title: string
  description: string
  subject: string
  difficulty: 'easy' | 'medium' | 'hard'
  estimated_time: number
  tasks: PlanTask[]
  progress: number
  created_at: string
}

interface PlanTask {
  id: string
  title: string
  type: 'study' | 'practice' | 'quiz' | 'review'
  completed: boolean
  time_estimate: number
}

export default function SmartPlansPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<SmartPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [generatingPlan, setGeneratingPlan] = useState(false)

  useEffect(() => {
    fetchProfile()
    fetchPlans()
  }, [])

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profile)
    }
  }

  const fetchPlans = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: plans } = await supabase
        .from('smart_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      setPlans(plans || [])
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSmartPlan = async () => {
    setGeneratingPlan(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Generate plan based on user profile and performance
      const response = await fetch('/api/smart-plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjects: profile?.subjects || [],
          grade_level: profile?.grade_level,
          learning_style: profile?.learning_style,
          interests: profile?.interests
        })
      })

      const data = await response.json()
      
      if (data.plan) {
        // Save the generated plan
        const { data: savedPlan } = await supabase
          .from('smart_plans')
          .insert({
            user_id: user.id,
            title: data.plan.title,
            description: data.plan.description,
            subject: data.plan.subject,
            difficulty: data.plan.difficulty,
            estimated_time: data.plan.estimated_time,
            tasks: data.plan.tasks,
            progress: 0,
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (savedPlan) {
          setPlans(prev => [savedPlan, ...prev])
        }
      }
    } catch (error) {
      console.error('Error generating plan:', error)
    } finally {
      setGeneratingPlan(false)
    }
  }

  const updateTaskProgress = async (planId: string, taskId: string, completed: boolean) => {
    try {
      // Update local state
      setPlans(prev => prev.map(plan => {
        if (plan.id === planId) {
          const updatedTasks = plan.tasks.map(task => 
            task.id === taskId ? { ...task, completed } : task
          )
          const completedTasks = updatedTasks.filter(t => t.completed).length
          const progress = (completedTasks / updatedTasks.length) * 100
          
          return { ...plan, tasks: updatedTasks, progress }
        }
        return plan
      }))

      // Update database
      const plan = plans.find(p => p.id === planId)
      if (plan) {
        const completedTasks = plan.tasks.map(task => 
          task.id === taskId ? { ...task, completed } : task
        )
        const progress = (completedTasks.filter(t => t.completed).length / completedTasks.length) * 100

        await supabase
          .from('smart_plans')
          .update({ 
            tasks: completedTasks,
            progress 
          })
          .eq('id', planId)
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'study': return <BookOpen className="w-4 h-4" />
      case 'practice': return <Target className="w-4 h-4" />
      case 'quiz': return <Award className="w-4 h-4" />
      case 'review': return <Clock className="w-4 h-4" />
      default: return <Lightbulb className="w-4 h-4" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-50 dark:bg-green-900/20'
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
      case 'hard': return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Loading your smart plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-900 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/home')} className="p-2 -ml-2">
              <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Smart Study Plans</h1>
              <p className="text-xs text-gray-500 dark:text-gray-500">AI-generated learning paths</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Generate Plan Button */}
      <div className="px-4 py-4">
        <button
          onClick={generateSmartPlan}
          disabled={generatingPlan || !profile}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generatingPlan ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating Plan...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Generate Smart Plan
            </>
          )}
        </button>
        {!profile && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Complete your profile first to generate personalized plans
          </p>
        )}
      </div>

      {/* Plans List */}
      <div className="px-4 space-y-4">
        {plans.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Smart Plans Yet
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Generate your first personalized study plan to get started
            </p>
          </div>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              {/* Plan Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{plan.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{plan.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(plan.difficulty)}`}>
                    {plan.difficulty}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {plan.subject}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {plan.estimated_time}min
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {Math.round(plan.progress)}%
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${plan.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Tasks */}
              <div className="p-4 space-y-2">
                {plan.tasks.map((task) => (
                  <div 
                    key={task.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      task.completed 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <button
                      onClick={() => updateTaskProgress(plan.id, task.id, !task.completed)}
                      className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        task.completed
                          ? 'bg-green-600 border-green-600'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-600'
                      }`}
                    >
                      {task.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </button>
                    
                    <div className="flex items-center gap-2 flex-1">
                      {getTaskIcon(task.type)}
                      <span className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                        {task.title}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {task.time_estimate}min
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}
