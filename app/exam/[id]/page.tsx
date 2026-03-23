'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Quiz, QuizQuestion } from '@/types/database'
import { ArrowLeft, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import { LoadingScreen } from '@/components/LoadingScreen'

export default function ExamPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  const supabase = createSupabaseClient()

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(30 * 60) // 30 minutes in seconds
  const [isComplete, setIsComplete] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExam()
  }, [examId])

  useEffect(() => {
    if (timeRemaining > 0 && !isComplete) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleCompleteExam()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [timeRemaining, isComplete])

  const loadExam = async () => {
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
        // Set initial selected answer if user already answered
        const currentQ = questionsData[currentQuestionIndex]
        if (currentQ?.user_answer !== null) {
          setSelectedAnswer(currentQ.user_answer)
        }
      }

      setLoading(false)
    } catch (error: any) {
      console.error('Error loading exam:', error)
      setLoading(false)
    }
  }

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
  }

  const handleNextQuestion = async () => {
    if (selectedAnswer === null) return

    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return

    try {
      // Save answer
      const { error } = await supabase
        .from('quiz_questions')
        .update({
          user_answer: selectedAnswer,
          is_correct: selectedAnswer === currentQuestion.correct_answer,
        })
        .eq('id', currentQuestion.id)

      if (error) throw error

      // Update local state
      const updatedQuestions = [...questions]
      updatedQuestions[currentQuestionIndex] = {
        ...currentQuestion,
        user_answer: selectedAnswer,
        is_correct: selectedAnswer === currentQuestion.correct_answer,
      }
      setQuestions(updatedQuestions)

      // Move to next question or complete
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        const nextQ = updatedQuestions[currentQuestionIndex + 1]
        setSelectedAnswer(nextQ?.user_answer ?? null)
      } else {
        handleCompleteExam()
      }
    } catch (error: any) {
      console.error('Error saving answer:', error)
      alert('Failed to save answer')
    }
  }

  const handleCompleteExam = async () => {
    if (isComplete) return

    setIsComplete(true)
    const finalScore = questions.filter((q) => q.is_correct).length

    try {
      const { error } = await supabase
        .from('quizzes')
        .update({
          status: 'completed',
          score: finalScore,
        })
        .eq('id', examId)

      if (error) throw error

      // Calculate weak areas
      const incorrectQuestions = questions.filter((q) => !q.is_correct)
      const weakAreas = Array.from(new Set(incorrectQuestions.map((q) => quiz?.topic || 'General')))

      await supabase
        .from('quizzes')
        .update({ weak_areas: weakAreas })
        .eq('id', examId)

      router.push(`/exam/${examId}/results`)
    } catch (error: any) {
      console.error('Error completing exam:', error)
      alert('Failed to complete exam')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return <LoadingScreen message="Loading exam..." />
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <p className="text-gray-600 text-center">Exam not found</p>
          <Button onClick={() => router.push('/home')} className="mt-4 w-full">
            Go Home
          </Button>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Exam Complete!</h2>
          <p className="text-gray-600 mb-6">Calculating your results...</p>
          <Button onClick={() => router.push(`/exam/${examId}/results`)} className="w-full">
            View Results
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to leave? Your progress will be saved.')) {
                  router.push('/home')
                }
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200">
                <Clock className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-red-700">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{quiz.topic}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {currentQuestion.question_text}
          </h2>
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index
              const isCorrect = index === currentQuestion.correct_answer
              const showAnswer = currentQuestion.user_answer !== null

              return (
                <button
                  key={index}
                  onClick={() => !showAnswer && handleAnswerSelect(index)}
                  disabled={showAnswer}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    showAnswer && isCorrect
                      ? 'border-green-500 bg-green-50'
                      : showAnswer && isSelected && !isCorrect
                      ? 'border-red-500 bg-red-50'
                      : isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  } ${showAnswer ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold ${
                        showAnswer && isCorrect
                          ? 'bg-green-500 text-white'
                          : showAnswer && isSelected && !isCorrect
                          ? 'bg-red-500 text-white'
                          : isSelected
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1 text-gray-900">{option}</span>
                    {showAnswer && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                    {showAnswer && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => {
              if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(currentQuestionIndex - 1)
                const prevQ = questions[currentQuestionIndex - 1]
                setSelectedAnswer(prevQ?.user_answer ?? null)
              }
            }}
            disabled={currentQuestionIndex === 0}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button
            onClick={handleNextQuestion}
            disabled={selectedAnswer === null}
            className="flex-1"
            glow
          >
            {currentQuestionIndex === questions.length - 1 ? 'Finish Exam' : 'Next'}
            {currentQuestionIndex < questions.length - 1 && (
              <ArrowRight className="w-4 h-4 ml-2" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

