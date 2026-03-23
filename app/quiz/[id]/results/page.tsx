'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Quiz, QuizQuestion } from '@/types/database'
import { Trophy, TrendingUp, Home, RotateCcw, CheckCircle2, XCircle } from 'lucide-react'

export default function QuizResultsPage() {
  const router = useRouter()
  const params = useParams()
  const quizId = params.id as string
  const supabase = createSupabaseClient()

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResults()
  }, [quizId])

  const loadResults = async () => {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single()

      if (quizError) throw quizError
      setQuiz(quizData)

      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('question_number', { ascending: true })

      if (questionsError) throw questionsError
      setQuestions(questionsData || [])
      setLoading(false)
    } catch (error: any) {
      console.error('Error loading results:', error)
      router.push('/home')
    }
  }

  if (loading || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const score = quiz.score || 0
  const total = quiz.total_questions || questions.length
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0
  const isExcellent = percentage >= 90
  const isGood = percentage >= 70

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="text-center mb-8" glow={isExcellent}>
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
            isExcellent ? 'bg-green-100 text-green-600' : isGood ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
          }`}>
            <Trophy className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
          <div className="text-6xl font-bold text-primary-600 mb-2">
            {score}/{total}
          </div>
          <div className={`text-2xl font-semibold mb-4 ${
            isExcellent ? 'text-green-600' : isGood ? 'text-blue-600' : 'text-orange-600'
          }`}>
            {percentage}%
          </div>
          <p className="text-gray-600">
            {isExcellent && 'Excellent work! You really know this material!'}
            {isGood && !isExcellent && 'Great job! Keep practicing to improve.'}
            {!isGood && 'Good effort! Review the questions you missed to improve.'}
          </p>
        </Card>

        {/* Questions Review */}
        <Card className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Question Review</h2>
          <div className="space-y-4">
            {questions.map((question, idx) => {
              const isCorrect = question.is_correct
              return (
                <div
                  key={question.id}
                  className={`p-4 rounded-xl border-2 ${
                    isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      Question {idx + 1}: {question.question_text}
                    </h3>
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 ml-2" />
                    )}
                  </div>
                  <div className="space-y-2">
                    {question.options.map((option, optIdx) => {
                      const isSelected = question.user_answer === optIdx
                      const isCorrectOption = optIdx === question.correct_answer
                      return (
                        <div
                          key={optIdx}
                          className={`p-2 rounded ${
                            isCorrectOption
                              ? 'bg-green-100 border border-green-300'
                              : isSelected
                              ? 'bg-red-100 border border-red-300'
                              : 'bg-gray-50'
                          }`}
                        >
                          <span className="font-medium">
                            {String.fromCharCode(65 + optIdx)}. {option}
                            {isCorrectOption && ' ✓ Correct'}
                            {isSelected && !isCorrectOption && ' ✗ Your Answer'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {question.explanation && (
                    <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm text-gray-700">
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/home')}
            className="flex-1"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
          <Button
            onClick={() => router.push('/chat')}
            glow
            className="flex-1"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Study More
          </Button>
        </div>
      </div>
    </div>
  )
}

