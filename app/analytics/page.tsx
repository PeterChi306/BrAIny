'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { LearnerModel } from '@/types/learning-plans'
import { LoadingScreen } from '@/components/LoadingScreen'
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Clock, 
  Award, 
  BarChart3, 
  PieChart, 
  Activity,
  BookOpen,
  Zap,
  CheckCircle
} from 'lucide-react'

interface AnalyticsData {
  learnerModels: LearnerModel[]
  totalStudyTime: number
  sessionCount: number
  averageAccuracy: number
  streakDays: number
  masteredConcepts: string[]
  strugglingConcepts: string[]
  weeklyProgress: {
    week: string
    studyTime: number
    sessions: number
    accuracy: number
  }[]
  subjectBreakdown: {
    subject: string
    mastery: number
    studyTime: number
    sessions: number
  }[]
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month')
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedSubject, timeRange])

  const fetchAnalyticsData = async () => {
    try {
      // Fetch learner models
      const { data: learnerModels } = await supabase
        .from('learner_models')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')

      // Fetch study sessions
      const { data: sessions } = await supabase
        .from('adaptive_sessions')
        .select('created_at, performance, session_type')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')

      // Fetch timed quiz sessions
      const { data: quizSessions } = await supabase
        .from('timed_quiz_sessions')
        .select('created_at, score, is_completed')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
        .eq('is_completed', true)

      // Fetch spaced repetition cards
      const { data: cards } = await supabase
        .from('spaced_repetition_cards')
        .select('mastery_level, concept_tags')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')

      // Process data
      const analyticsData = processAnalyticsData(
        learnerModels || [],
        sessions || [],
        quizSessions || [],
        cards || []
      )

      setData(analyticsData)
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const processAnalyticsData = (
    learnerModels: LearnerModel[],
    sessions: any[],
    quizSessions: any[],
    cards: any[]
  ): AnalyticsData => {
    // Calculate total study time
    const totalStudyTime = sessions.reduce((sum, session) => {
      const performance = session.performance || {}
      return sum + (performance.time_spent_minutes || 0)
    }, 0)

    // Calculate session count
    const sessionCount = sessions.length + quizSessions.length

    // Calculate average accuracy
    const allScores = [
      ...sessions.map(s => s.performance?.accuracy || 0),
      ...quizSessions.map(q => q.score || 0)
    ]
    const averageAccuracy = allScores.length > 0 
      ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length 
      : 0

    // Extract mastered and struggling concepts
    const allConcepts = learnerModels.flatMap(model => Object.entries(model.concept_mastery))
    const masteredConcepts = allConcepts
      .filter(([_, mastery]) => mastery >= 80)
      .map(([concept]) => concept)
    const strugglingConcepts = allConcepts
      .filter(([_, mastery]) => mastery < 50)
      .map(([concept]) => concept)

    // Generate weekly progress
    const weeklyProgress = generateWeeklyProgress(sessions, quizSessions)

    // Generate subject breakdown
    const subjectBreakdown = generateSubjectBreakdown(learnerModels, sessions)

    return {
      learnerModels,
      totalStudyTime,
      sessionCount,
      averageAccuracy,
      streakDays: calculateStreakDays(sessions),
      masteredConcepts,
      strugglingConcepts,
      weeklyProgress,
      subjectBreakdown
    }
  }

  const generateWeeklyProgress = (sessions: any[], quizSessions: any[]) => {
    const weeks: { [key: string]: { studyTime: number; sessions: number; accuracy: number } } = {}
    
    // Process sessions
    sessions.forEach(session => {
      const week = getWeekKey(new Date(session.created_at))
      if (!weeks[week]) {
        weeks[week] = { studyTime: 0, sessions: 0, accuracy: 0 }
      }
      
      weeks[week].studyTime += session.performance?.time_spent_minutes || 0
      weeks[week].sessions += 1
      weeks[week].accuracy += session.performance?.accuracy || 0
    })

    // Process quiz sessions
    quizSessions.forEach(session => {
      const week = getWeekKey(new Date(session.created_at))
      if (!weeks[week]) {
        weeks[week] = { studyTime: 0, sessions: 0, accuracy: 0 }
      }
      
      weeks[week].sessions += 1
      weeks[week].accuracy += session.score || 0
    })

    // Calculate averages and convert to array
    return Object.entries(weeks)
      .map(([week, data]) => ({
        week,
        studyTime: data.studyTime,
        sessions: data.sessions,
        accuracy: data.sessions > 0 ? data.accuracy / data.sessions : 0
      }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-8) // Last 8 weeks
  }

  const generateSubjectBreakdown = (learnerModels: LearnerModel[], sessions: any[]) => {
    const breakdown: { [subject: string]: { mastery: number; studyTime: number; sessions: number } } = {}

    // Process learner models
    learnerModels.forEach(model => {
      if (!breakdown[model.subject]) {
        breakdown[model.subject] = { mastery: 0, studyTime: 0, sessions: 0 }
      }
      
      const masteryValues = Object.values(model.concept_mastery)
      breakdown[model.subject].mastery = masteryValues.length > 0
        ? masteryValues.reduce((sum, val) => sum + val, 0) / masteryValues.length
        : 0
    })

    // Process sessions
    sessions.forEach(session => {
      // This would need goal_id to subject mapping in a real implementation
      // For now, we'll use a placeholder
      const subject = 'General'
      if (!breakdown[subject]) {
        breakdown[subject] = { mastery: 0, studyTime: 0, sessions: 0 }
      }
      
      breakdown[subject].studyTime += session.performance?.time_spent_minutes || 0
      breakdown[subject].sessions += 1
    })

    return Object.entries(breakdown).map(([subject, data]) => ({
      subject,
      mastery: Math.round(data.mastery),
      studyTime: data.studyTime,
      sessions: data.sessions
    }))
  }

  const calculateStreakDays = (sessions: any[]): number => {
    if (sessions.length === 0) return 0

    const sessionDates = sessions
      .map(s => new Date(s.created_at).toDateString())
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    let streak = 0
    const today = new Date().toDateString()
    let currentDate = new Date(today)

    for (let i = 0; i < 365; i++) { // Check up to a year
      const dateStr = currentDate.toDateString()
      
      if (sessionDates.includes(dateStr)) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else if (i > 0) { // Allow first day to be missed (today)
        break
      }
    }

    return streak
  }

  const getWeekKey = (date: Date): string => {
    const year = date.getFullYear()
    const week = Math.floor((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
    return `${year}-W${week.toString().padStart(2, '0')}`
  }

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  if (loading) {
    return <LoadingScreen message="Loading analytics..." />
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No analytics data available</h2>
          <p className="text-gray-600">Start studying to see your progress!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Analytics</h1>
          <p className="text-gray-600">Track your progress and optimize your learning</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Subjects</option>
                {data.subjectBreakdown.map(subject => (
                  <option key={subject.subject} value={subject.subject}>
                    {subject.subject}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-blue-600" />
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatTime(data.totalStudyTime)}</div>
            <div className="text-sm text-gray-600">Study Time</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-green-600" />
              <span className="text-sm text-gray-500">Average</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{Math.round(data.averageAccuracy)}%</div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-purple-600" />
              <span className="text-sm text-gray-500">Current</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.streakDays}</div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <Award className="w-8 h-8 text-yellow-600" />
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.sessionCount}</div>
            <div className="text-sm text-gray-600">Sessions</div>
          </div>
        </div>

        {/* Subject Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Subject Performance
            </h2>
            <div className="space-y-4">
              {data.subjectBreakdown.map(subject => (
                <div key={subject.subject} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{subject.subject}</span>
                    <span className="text-gray-600">{subject.mastery}% mastery</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${subject.mastery}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{formatTime(subject.studyTime)}</span>
                    <span>{subject.sessions} sessions</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Concept Analysis
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Mastered Concepts
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.masteredConcepts.slice(0, 8).map((concept, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                    >
                      {concept}
                    </span>
                  ))}
                  {data.masteredConcepts.length > 8 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{data.masteredConcepts.length - 8} more
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  Needs Practice
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.strugglingConcepts.slice(0, 8).map((concept, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full"
                    >
                      {concept}
                    </span>
                  ))}
                  {data.strugglingConcepts.length > 8 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{data.strugglingConcepts.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Progress Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Weekly Progress
          </h2>
          <div className="space-y-4">
            {data.weeklyProgress.map((week, index) => (
              <div key={week.week} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Week {week.week.split('-W')[1]}</span>
                  <span className="text-gray-600">{formatTime(week.studyTime)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Study Time</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(100, (week.studyTime / 300) * 100)}%` // 5 hours = 100%
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Accuracy</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${week.accuracy}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
