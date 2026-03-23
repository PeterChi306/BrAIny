'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ArrowLeft,
  Clock,
  Brain,
  Target,
  TrendingUp,
  Award,
  RotateCcw,
  Lightbulb
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
  difficulty: 'easy' | 'medium' | 'hard'
  subject?: string
}

interface QuizResult {
  questionId: string
  userAnswer: number
  isCorrect: boolean
  timeTaken: number
}

interface InteractiveQuizProps {
  questions: QuizQuestion[]
  onComplete: (results: QuizResult[]) => void
  showExplanations?: boolean
  timeLimit?: number
  className?: string
}

export function InteractiveQuiz({
  questions,
  onComplete,
  showExplanations = true,
  timeLimit,
  className
}: InteractiveQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [results, setResults] = useState<QuizResult[]>([])
  const [timeRemaining, setTimeRemaining] = useState(timeLimit ? timeLimit * 60 : null)
  const [startTime, setStartTime] = useState(Date.now())
  const [quizStarted, setQuizStarted] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  useEffect(() => {
    if (!quizStarted) {
      setQuizStarted(true)
      setStartTime(Date.now())
    }
  }, [])

  useEffect(() => {
    if (timeRemaining === null) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          if (results.length === questions.length) {
            onComplete(results)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining, results.length, questions.length, onComplete])

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return
    setSelectedAnswer(answerIndex)
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return

    const timeTaken = Math.floor((Date.now() - startTime) / 1000)
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer

    const result: QuizResult = {
      questionId: currentQuestion.id,
      userAnswer: selectedAnswer,
      isCorrect,
      timeTaken
    }

    const newResults = [...results, result]
    setResults(newResults)
    setShowResult(true)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setStartTime(Date.now())
    } else {
      onComplete(results)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'hard': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getScoreColor = () => {
    const correctCount = results.filter(r => r.isCorrect).length
    const percentage = (correctCount / results.length) * 100
    
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No questions available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Please add questions to start the quiz
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Quiz Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
            <div className={cn('px-2 py-1 rounded-full text-xs font-medium', getDifficultyColor(currentQuestion.difficulty))}>
              {currentQuestion.difficulty}
            </div>
            {currentQuestion.subject && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {currentQuestion.subject}
              </div>
            )}
          </div>
          
          {timeRemaining !== null && (
            <div className={cn(
              'flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
              timeRemaining < 60 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            )}>
              <Clock className="w-4 h-4" />
              {formatTime(timeRemaining)}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Score Display */}
        {results.length > 0 && (
          <div className="text-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Score: 
            </span>
            <span className={cn('text-sm font-bold ml-1', getScoreColor())}>
              {results.filter(r => r.isCorrect).length}/{results.length}
            </span>
          </div>
        )}
      </div>

      {/* Question Card */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Question */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {currentQuestion.question}
            </h3>
          </div>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index
              const isCorrect = index === currentQuestion.correctAnswer
              const showCorrect = showResult && isCorrect
              const showIncorrect = showResult && isSelected && !isCorrect

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showResult}
                  className={cn(
                    'w-full text-left p-4 rounded-xl border-2 transition-all duration-200',
                    'hover:border-blue-300 dark:hover:border-blue-600',
                    isSelected && !showResult && 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
                    showCorrect && 'border-green-500 bg-green-50 dark:bg-green-900/20',
                    showIncorrect && 'border-red-500 bg-red-50 dark:bg-red-900/20',
                    !isSelected && showResult && 'border-gray-200 dark:border-gray-700 opacity-60'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium',
                        isSelected && !showResult && 'border-blue-500 bg-blue-500 text-white',
                        showCorrect && 'border-green-500 bg-green-500 text-white',
                        showIncorrect && 'border-red-500 bg-red-500 text-white',
                        !isSelected && 'border-gray-300 dark:border-gray-600'
                      )}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="text-gray-900 dark:text-white">
                        {option}
                      </span>
                    </div>
                    
                    {showCorrect && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    {showIncorrect && <XCircle className="w-5 h-5 text-red-500" />}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Explanation */}
          {showResult && showExplanations && currentQuestion.explanation && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Explanation
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {currentQuestion.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {!showResult ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Submit Answer
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {currentQuestionIndex < questions.length - 1 ? (
                  <>
                    Next Question
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Complete Quiz
                    <Award className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
