'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Quiz, QuizQuestion } from '@/types/database'
import { updateStudyStreak } from '@/lib/streak'
import { CheckCircle2, XCircle, ArrowLeft, ArrowRight, Trophy, TrendingUp } from 'lucide-react'

export default function QuizPage() {
  const router = useRouter()
  const params = useParams()
  const quizId = params.id as string
  const supabase = createSupabaseClient()

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadQuiz()
  }, [quizId])

  const loadQuiz = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      // Check quiz ownership explicitly
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .eq('user_id', session.user.id)
        .single()

      if (quizError || !quizData) {
        console.error('Quiz not found or access denied:', quizError)
        setLoading(false)
        return
      }

      setQuiz(quizData)

      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('question_number', { ascending: true })

      if (questionsError) {
        console.error('Error loading questions:', questionsError)
        setLoading(false)
        return
      }

      if (!questionsData || questionsData.length === 0) {
        console.error('No questions found for quiz')
        setLoading(false)
        return
      }

      setQuestions(questionsData)

      // Load current question's answer if already answered
      if (questionsData.length > 0) {
        const currentQ = questionsData[currentQuestionIndex]
        if (currentQ.user_answer !== null) {
          setSelectedAnswer(currentQ.user_answer)
          setShowExplanation(true)
        }
      }

      setLoading(false)
    } catch (error: any) {
      console.error('Error loading quiz:', error)
      setLoading(false)
    }
  }

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return
    setSelectedAnswer(answerIndex)
  }

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null || submitting) return

    const currentQuestion = questions[currentQuestionIndex]
    const isCorrect = selectedAnswer === currentQuestion.correct_answer

    setSubmitting(true)

    try {
      // Update question with user answer
      const { error } = await supabase
        .from('quiz_questions')
        .update({
          user_answer: selectedAnswer,
          is_correct: isCorrect,
        })
        .eq('id', currentQuestion.id)

      if (error) throw error

      // Update score if correct
      if (isCorrect) {
        setScore(prev => prev + 1)
      }

      setShowExplanation(true)
    } catch (error: any) {
      console.error('Error submitting answer:', error)
      alert('Failed to submit answer')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1
      setCurrentQuestionIndex(nextIndex)
      setSelectedAnswer(questions[nextIndex].user_answer)
      setShowExplanation(questions[nextIndex].user_answer !== null)
    } else {
      handleCompleteQuiz()
    }
  }

  const handleCompleteQuiz = async () => {
    try {
      const finalScore = questions.filter(q => q.is_correct).length

      const { error } = await supabase
        .from('quizzes')
        .update({
          status: 'completed',
          score: finalScore,
        })
        .eq('id', quizId)

      if (error) throw error

      // Update study streak for quiz completion
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await updateStudyStreak(session.user.id, 'quiz')
        }
      } catch (streakError) {
        console.warn('Quiz: Failed to update study streak', streakError)
      }

      // Update performance tracking
      if (quiz) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await supabase
            .from('user_performance')
            .upsert({
              user_id: session.user.id,
              subject: quiz.subject || 'General',
              topic: quiz.topic,
              quiz_scores: [finalScore],
              total_attempts: 1,
              average_score: finalScore / questions.length,
              last_studied_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,subject,topic',
            })
        }
      }

      router.push(`/quiz/${quizId}/results`)
    } catch (error: any) {
      console.error('Error completing quiz:', error)
      alert('Failed to complete quiz')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-100 border-t-primary-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-primary-600/20 animate-pulse"></div>
            </div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4">
        <Card className="max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Quiz Not Found</h2>
            <p className="text-gray-600">This quiz may have been deleted or you don't have access to it.</p>
          </div>
          <Button onClick={() => router.push('/home')} className="w-full" glow>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return Home
          </Button>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const isCorrect = selectedAnswer !== null && selectedAnswer === currentQuestion.correct_answer

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-blue-100/20 dark:from-black dark:via-gray-950 dark:to-blue-950/20 pb-28 relative overflow-hidden">
      {/* Animated Background Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
      </div>

      {/* Header - Premium */}
      <div className="glass-strong border-b border-white/20 dark:border-white/10 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => router.push('/home')}
              className="p-2.5 rounded-2xl hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all active:scale-95 border border-transparent hover:border-blue-200/50 dark:hover:border-blue-500/30"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="flex-1 ml-4">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{quiz.topic}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-bold mt-1">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
          </div>
          
          {/* Progress Bar - Masterclass */}
          <div className="mt-3">
            <div className="w-full bg-gray-200/50 dark:bg-gray-800/50 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 h-3 rounded-full transition-all duration-700 ease-out shadow-glow relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question - Premium */}
      <div className="max-w-3xl mx-auto px-6 py-10 relative z-10">
        <Card className="mb-8 border-2 border-blue-400/30 dark:border-blue-500/40" glow>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-10 leading-relaxed">
            {currentQuestion.question_text}
          </h2>

          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index
              const isCorrectOption = index === currentQuestion.correct_answer
              const showResult = showExplanation && (isSelected || isCorrectOption)

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showExplanation}
                  className={`w-full text-left p-6 rounded-3xl border-2 transition-all duration-400 ${
                    showResult
                      ? isCorrectOption
                        ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 shadow-glow'
                        : isSelected
                        ? 'border-red-400 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50'
                      : isSelected
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 shadow-glow scale-[1.02]'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 active:scale-[0.98]'
                  } ${showExplanation ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-gray-900 dark:text-white text-lg">
                      {String.fromCharCode(65 + index)}. {option}
                    </span>
                    {showResult && (
                      <>
                        {isCorrectOption && (
                          <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400 flex-shrink-0" />
                        )}
                        {isSelected && !isCorrectOption && (
                          <XCircle className="w-7 h-7 text-red-500 dark:text-red-400 flex-shrink-0" />
                        )}
                      </>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {showExplanation && currentQuestion.explanation && (
            <div className={`mt-8 p-6 rounded-3xl border-2 ${
              isCorrect 
                ? 'bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-300 dark:border-green-600 shadow-glow' 
                : 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-300 dark:border-blue-600'
            }`}>
              <p className="text-lg font-black text-gray-900 dark:text-white mb-3">
                {isCorrect ? '✓ Correct!' : 'Explanation:'}
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium">{currentQuestion.explanation}</p>
            </div>
          )}
        </Card>

        {/* Navigation - Refined */}
        <div className="flex gap-4">
          {currentQuestionIndex > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                const prevIndex = currentQuestionIndex - 1
                setCurrentQuestionIndex(prevIndex)
                setSelectedAnswer(questions[prevIndex].user_answer)
                setShowExplanation(questions[prevIndex].user_answer !== null)
              }}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          )}

          {!showExplanation ? (
            <Button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null || submitting}
              glow
              className="flex-1"
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </Button>
          ) : (
            <Button
              onClick={handleNextQuestion}
              glow
              className="flex-1"
            >
              {currentQuestionIndex < questions.length - 1 ? (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Complete Quiz
                  <Trophy className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

