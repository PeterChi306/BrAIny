'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { AdaptiveSession } from '@/types/learning-plans'
import { ArrowLeft, Play, Pause, RotateCcw, CheckCircle, Circle, Brain, Target, Zap } from 'lucide-react'
import { LoadingScreen } from '@/components/LoadingScreen'

export default function SessionPage({ params }: { params: { id: string } }) {
  const [session, setSession] = useState<AdaptiveSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [userAnswer, setUserAnswer] = useState<string | number>('')
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [isPaused, setIsPaused] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchSession()
  }, [params.id])

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch session')
      
      const { session } = await response.json()
      setSession(session)
      setCurrentStep(session.current_step || 0)
      
      if (session.state !== 'completed') {
        setStartTime(Date.now())
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSession = async (updates: any) => {
    try {
      const response = await fetch(`/api/sessions/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) throw new Error('Failed to update session')
      
      const { session } = await response.json()
      setSession(session)
      return session
    } catch (error) {
      console.error('Error updating session:', error)
    }
  }

  const submitAnswer = async () => {
    if (!session || !userAnswer) return

    const timeTaken = Math.floor((Date.now() - startTime) / 1000)
    const currentQuestion = session.content.questions[currentStep]
    
    const answerData = {
      question_id: currentQuestion.id,
      user_answer: userAnswer,
      time_taken_seconds: timeTaken
    }

    const updatedSession = await updateSession({ answer_data: answerData })
    if (updatedSession) {
      setUserAnswer('')
      setStartTime(Date.now())
      
      // Move to next step
      if (currentStep < session.content.questions.length - 1) {
        setCurrentStep(currentStep + 1)
        await updateSession({ current_step: currentStep + 1 })
      } else {
        // Complete the session
        await completeSession()
      }
    }
  }

  const completeSession = async () => {
    if (!session) return

    const performance = calculatePerformance(session)
    await updateSession({ 
      state: 'completed', 
      performance,
      current_step: session.total_steps
    })
  }

  const calculatePerformance = (sessionData: AdaptiveSession) => {
    const questions = sessionData.content.questions || []
    const totalTime = Math.floor((Date.now() - startTime) / 1000)
    
    let correctCount = 0
    const conceptsMastered: string[] = []
    const conceptsStruggling: string[] = []

    questions.forEach((question: any) => {
      if (question.is_correct) {
        correctCount++
        conceptsMastered.push(...question.concept_tags)
      } else {
        conceptsStruggling.push(...question.concept_tags)
      }
    })

    const accuracy = questions.length > 0 ? (correctCount / questions.length) * 100 : 0
    const avgTimePerQuestion = questions.length > 0 ? totalTime / questions.length : 0
    const speed = Math.max(0, 100 - (avgTimePerQuestion / 60) * 10) // Rough speed calculation

    return {
      accuracy: Math.round(accuracy),
      speed: Math.round(speed),
      difficulty_adjusted: false,
      concepts_mastered: Array.from(new Set(conceptsMastered)),
      concepts_struggling: Array.from(new Set(conceptsStruggling)),
      time_spent_minutes: Math.floor(totalTime / 60),
      engagement_score: Math.round((accuracy + speed) / 2)
    }
  }

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'review':
        return <Brain className="w-6 h-6 text-blue-600" />
      case 'recall':
        return <Target className="w-6 h-6 text-green-600" />
      case 'practice':
        return <Zap className="w-6 h-6 text-yellow-600" />
      case 'quiz':
        return <CheckCircle className="w-6 h-6 text-purple-600" />
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      default:
        return <Circle className="w-6 h-6 text-gray-600" />
    }
  }

  const getStateTitle = (state: string) => {
    switch (state) {
      case 'review':
        return 'Review Phase'
      case 'recall':
        return 'Active Recall'
      case 'practice':
        return 'Practice Mode'
      case 'quiz':
        return 'Quiz Time'
      case 'summary':
        return 'Session Summary'
      case 'completed':
        return 'Session Complete'
      default:
        return 'Loading...'
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading session..." />
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Session not found</h2>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  if (session.state === 'completed') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Complete!</h1>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {session.performance?.accuracy || 0}%
                </div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {session.performance?.speed || 0}%
                </div>
                <div className="text-sm text-gray-600">Speed</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {session.performance?.time_spent_minutes || 0}
                </div>
                <div className="text-sm text-gray-600">Minutes</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {session.performance?.engagement_score || 0}%
                </div>
                <div className="text-sm text-gray-600">Engagement</div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/goals')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Goals
              </button>
              <button
                onClick={() => router.push(`/goals/${session.goal_id}`)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Goal Progress
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = session.content.questions[currentStep]
  const progress = ((currentStep + 1) / session.content.questions.length) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                {getStateIcon(session.state)}
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {getStateTitle(session.state)}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Question {currentStep + 1} of {session.content.questions.length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {currentQuestion && (
            <div className="space-y-6">
              {/* Question */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {currentQuestion.question}
                </h2>
                
                {/* Concept Tags */}
                {currentQuestion.concept_tags && currentQuestion.concept_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {currentQuestion.concept_tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Multiple Choice Options */}
                {currentQuestion.options && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option: string, index: number) => (
                      <label
                        key={index}
                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="radio"
                          name="answer"
                          value={index}
                          checked={userAnswer === index}
                          onChange={(e) => setUserAnswer(parseInt(e.target.value))}
                          className="mr-3"
                        />
                        <span className="text-gray-900">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Text Answer */}
                {!currentQuestion.options && (
                  <textarea
                    value={userAnswer as string}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Type your answer here..."
                  />
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  onClick={submitAnswer}
                  disabled={!userAnswer}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Submit Answer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Session Info */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {session.session_type}
              </div>
              <div className="text-sm text-gray-600">Session Type</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Math.floor((Date.now() - startTime) / 1000 / 60)}m
              </div>
              <div className="text-sm text-gray-600">Time Spent</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {currentQuestion?.difficulty || 'medium'}
              </div>
              <div className="text-sm text-gray-600">Difficulty</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
