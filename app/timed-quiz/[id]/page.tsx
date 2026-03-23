'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { TimedQuizSession, TimedQuizQuestion } from '@/types/learning-plans'
import { ArrowLeft, Clock, Play, Pause, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react'

export default function TimedQuizPage({ params }: { params: { id: string } }) {
  const [session, setSession] = useState<TimedQuizSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState<TimedQuizQuestion | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseClient()

  // Timer effects
  useEffect(() => {
    if (!session || session.is_completed || isPaused) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [session, isPaused])

  useEffect(() => {
    if (!currentQuestion || isPaused || selectedAnswer !== null) return

    const timer = setInterval(() => {
      setQuestionTimeRemaining(prev => {
        if (prev <= 1) {
          handleQuestionTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentQuestion, isPaused, selectedAnswer])

  useEffect(() => {
    fetchSession()
  }, [params.id])

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/timed-quiz`)
      const { sessions } = await response.json()
      const currentSession = sessions.find((s: TimedQuizSession) => s.id === params.id)
      
      if (!currentSession) {
        throw new Error('Session not found')
      }

      setSession(currentSession)
      setTimeRemaining(currentSession.time_remaining_seconds)
      
      if (currentSession.current_question < currentSession.questions.length) {
        const question = currentSession.questions[currentSession.current_question]
        setCurrentQuestion(question)
        setQuestionTimeRemaining(question.time_limit_seconds)
      } else {
        setShowResults(true)
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSession = async (updates: any) => {
    try {
      const response = await fetch(`/api/timed-quiz/${params.id}`, {
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

  const handleTimeUp = async () => {
    if (!session) return
    
    await completeQuiz()
  }

  const handleQuestionTimeUp = async () => {
    if (!session || !currentQuestion) return
    
    // Auto-submit with no answer
    await submitAnswer(null)
  }

  const submitAnswer = async (answer: number | null) => {
    if (!session || !currentQuestion) return

    const updatedQuestions = [...session.questions]
    const questionIndex = session.current_question
    const question = updatedQuestions[questionIndex]
    
    question.user_answer = answer || undefined
    question.is_correct = answer === question.correct_answer
    question.time_taken_seconds = currentQuestion.time_limit_seconds - questionTimeRemaining
    question.answered_at = new Date().toISOString()

    const nextQuestionIndex = questionIndex + 1
    const isCompleted = nextQuestionIndex >= session.questions.length

    if (isCompleted) {
      await completeQuiz(updatedQuestions)
    } else {
      const nextQuestion = updatedQuestions[nextQuestionIndex]
      setCurrentQuestion(nextQuestion)
      setQuestionTimeRemaining(nextQuestion.time_limit_seconds)
      setSelectedAnswer(null)

      await updateSession({
        questions: updatedQuestions,
        current_question: nextQuestionIndex,
        time_remaining_seconds: timeRemaining - (currentQuestion.time_limit_seconds - questionTimeRemaining)
      })
    }
  }

  const completeQuiz = async (finalQuestions?: TimedQuizQuestion[]) => {
    const questions = finalQuestions || session?.questions || []
    const correctCount = questions.filter(q => q.is_correct).length
    const score = Math.round((correctCount / questions.length) * 100)

    await updateSession({
      questions,
      is_completed: true,
      score,
      completed_at: new Date().toISOString()
    })

    setShowResults(true)
  }

  const togglePause = async () => {
    const newPausedState = !isPaused
    setIsPaused(newPausedState)

    await updateSession({
      is_paused: newPausedState,
      time_remaining_seconds: timeRemaining
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimeColor = (seconds: number, total: number) => {
    const percentage = (seconds / total) * 100
    if (percentage > 50) return 'text-green-600'
    if (percentage > 25) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Quiz not found</h2>
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

  if (showResults) {
    const correctCount = session.questions.filter(q => q.is_correct).length
    const avgTimePerQuestion = session.questions.reduce((sum, q) => sum + (q.time_taken_seconds || 0), 0) / session.questions.length

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
              <p className="text-gray-600">Here's how you performed</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">{session.score}%</div>
                <div className="text-gray-600">Final Score</div>
                <div className="text-sm text-gray-500 mt-1">
                  {correctCount} of {session.questions.length} correct
                </div>
              </div>

              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatTime(Math.round(avgTimePerQuestion))}
                </div>
                <div className="text-gray-600">Avg Time per Question</div>
              </div>

              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {session.questions.length}
                </div>
                <div className="text-gray-600">Questions Answered</div>
              </div>
            </div>

            {/* Question Review */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Question Review</h2>
              <div className="space-y-4">
                {session.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className={`p-4 rounded-lg border ${
                      question.is_correct
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {question.is_correct ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-2">
                          Question {index + 1}
                        </div>
                        <div className="text-gray-700 mb-2">{question.question}</div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>Your answer:</strong> {question.user_answer !== undefined ? question.options[question.user_answer] : 'Not answered'}
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>Correct answer:</strong> {question.options[question.correct_answer]}
                        </div>

                        <div className="text-sm text-gray-600">
                          <strong>Time taken:</strong> {formatTime(question.time_taken_seconds || 0)}
                        </div>

                        {!question.is_correct && (
                          <div className="mt-3 p-3 bg-blue-50 rounded text-sm text-blue-800">
                            <strong>Explanation:</strong> {question.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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
                onClick={() => router.push(`/goals/${session.config_id}`)}
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
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Timed Quiz</h1>
                <p className="text-sm text-gray-600">
                  Question {session.current_question + 1} of {session.questions.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${getTimeColor(timeRemaining, session.total_time_seconds)}`}>
                <Clock className="w-5 h-5" />
                <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
              </div>
              
              <button
                onClick={togglePause}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${((session.current_question + 1) / session.questions.length) * 100}%` 
                }}
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
              {/* Question Timer */}
              <div className={`text-center p-4 rounded-lg ${
                questionTimeRemaining <= 10 ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                <div className={`text-2xl font-bold ${
                  questionTimeRemaining <= 10 ? 'text-red-600' : 'text-gray-700'
                }`}>
                  {formatTime(questionTimeRemaining)}
                </div>
                <div className="text-sm text-gray-600">Time remaining for this question</div>
              </div>

              {/* Question */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {currentQuestion.question}
                </h2>

                {/* Difficulty Badge */}
                <div className="mb-6">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentQuestion.difficulty === 'easy' 
                      ? 'bg-green-100 text-green-800'
                      : currentQuestion.difficulty === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
                  </span>
                </div>

                {/* Answer Options */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <label
                      key={index}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedAnswer === index
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={index}
                        checked={selectedAnswer === index}
                        onChange={(e) => setSelectedAnswer(parseInt(e.target.value))}
                        className="mr-3"
                        disabled={selectedAnswer !== null}
                      />
                      <span className="text-gray-900">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => submitAnswer(selectedAnswer)}
                  disabled={selectedAnswer === null}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Submit Answer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quiz Info */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((session.current_question / session.questions.length) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Progress</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {session.questions.filter(q => q.is_correct).length}
              </div>
              <div className="text-sm text-gray-600">Correct So Far</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {currentQuestion?.difficulty}
              </div>
              <div className="text-sm text-gray-600">Current Difficulty</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
