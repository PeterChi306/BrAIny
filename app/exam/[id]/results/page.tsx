'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Quiz, QuizQuestion } from '@/types/database'
import { ArrowLeft, Target, TrendingUp, BookOpen, CheckCircle2, XCircle, Brain, Lock } from 'lucide-react'
import { LoadingScreen } from '@/components/LoadingScreen'
import { useUserTier } from '@/contexts/UserTierContext'

export default function ExamResultsPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  const supabase = createSupabaseClient()
  const { userTier } = useUserTier()

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResults()
  }, [examId])

  const loadResults = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const { data: quizData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', examId)
        .eq('user_id', session.user.id)
        .single()

      if (!quizData) {
        router.push('/home')
        return
      }

      setQuiz(quizData)

      const { data: questionsData } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', examId)
        .order('question_number', { ascending: true })

      if (questionsData) {
        setQuestions(questionsData)
      }

      setLoading(false)
    } catch (error: any) {
      console.error('Error loading results:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading results..." />
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <p className="text-gray-600 text-center">Results not found</p>
          <Button onClick={() => router.push('/home')} className="mt-4 w-full">
            Go Home
          </Button>
        </Card>
      </div>
    )
  }

  const score = quiz.score || 0
  const total = quiz.total_questions || questions.length
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0
  const correctQuestions = questions.filter((q) => q.is_correct)
  const incorrectQuestions = questions.filter((q) => !q.is_correct)

  const getScoreColor = () => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-primary-600'
    return 'text-orange-600'
  }

  const getScoreMessage = () => {
    if (percentage >= 90) return "Excellent work! You've mastered this topic."
    if (percentage >= 80) return 'Great job! You have a strong understanding.'
    if (percentage >= 60) return 'Good effort! Keep practicing to improve.'
    return "Don't worry! Review the material and try again."
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/home')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Exam Results</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Score Card */}
        <Card className="text-center py-8">
          <div className={`text-6xl font-bold mb-2 ${getScoreColor()}`}>
            {percentage}%
          </div>
          <p className="text-lg text-gray-600 mb-4">{getScoreMessage()}</p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span>{score} correct</span>
            <span>•</span>
            <span>{total - score} incorrect</span>
            <span>•</span>
            <span>{total} total</span>
          </div>
        </Card>

        {/* Weak Areas */}
        {quiz.weak_areas && quiz.weak_areas.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">Focus Areas</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Review these topics to improve your score:
            </p>
            <div className="space-y-2">
              {quiz.weak_areas.map((area, idx) => (
                <button
                  key={idx}
                  onClick={() => router.push(`/chat?mode=explain&topic=${encodeURIComponent(area)}`)}
                  className="w-full text-left p-3 rounded-lg hover:bg-orange-50 transition-colors border border-orange-200 bg-orange-50/50"
                >
                  <p className="font-medium text-gray-900">{area}</p>
                  <p className="text-xs text-gray-600 mt-1">Click to review</p>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Review Plan */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Personalized Review Plan</h2>
          </div>
          <div className="space-y-3">
            {incorrectQuestions.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Review {incorrectQuestions.length} question{incorrectQuestions.length !== 1 ? 's' : ''} you got wrong:
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Show incorrect questions for review
                    router.push(`/exam/${examId}/review`)
                  }}
                  className="w-full"
                >
                  Review Mistakes
                </Button>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Practice similar questions:
              </p>
              <Button
                onClick={() => router.push(`/chat?mode=quiz&topic=${encodeURIComponent(quiz.topic)}`)}
                className="w-full"
              >
                Take Another Quiz
              </Button>
            </div>
            {quiz.weak_areas && quiz.weak_areas.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Study weak topics:
                </p>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/chat?mode=practice&topic=${encodeURIComponent(quiz.weak_areas![0])}`)}
                  className="w-full"
                >
                  Practice Weak Topics
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Question Breakdown */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Question Breakdown</h2>
          <div className="space-y-4">
            {questions.map((question, idx) => (
              <div
                key={question.id}
                className={`p-4 rounded-xl border-2 ${
                  question.is_correct
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-3 mb-2">
                  {question.is_correct ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-2">
                      Question {idx + 1}: {question.question_text}
                    </p>
                    <div className="space-y-1">
                      {question.options.map((option, optIdx) => {
                        const isSelected = question.user_answer === optIdx
                        const isCorrect = optIdx === question.correct_answer
                        return (
                          <div
                            key={optIdx}
                            className={`text-sm p-2 rounded ${
                              isCorrect
                                ? 'bg-green-100 text-green-800 font-medium'
                                : isSelected
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-50 text-gray-600'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}) {option}
                            {isCorrect && ' ✓'}
                            {isSelected && !isCorrect && ' ✗'}
                          </div>
                        )
                      })}
                    </div>
                    {question.explanation && (
                      <p className="text-sm text-gray-600 mt-2 italic">
                        {question.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/home')}
              className="flex-1"
            >
              Back to Home
            </Button>
            <Button
              onClick={() => router.push(`/chat?mode=quiz&topic=${encodeURIComponent(quiz.topic)}`)}
              className="flex-1"
              glow
            >
              Practice More
            </Button>
          </div>
          
          <button
            onClick={() => {
              if (userTier === 'legend') {
                router.push('/weak-spots')
              } else {
                router.push('/subscription')
              }
            }}
            className={`w-full px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
              userTier === 'legend' 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg'
                : 'bg-gray-100 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Brain className="w-5 h-5" />
            Analyze Weak Spots
            {userTier !== 'legend' && <Lock className="w-4 h-4 ml-1" />}
          </button>
        </div>
      </div>
    </div>
  )
}

