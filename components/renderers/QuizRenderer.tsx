'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CheckCircle2, XCircle, ArrowRight, Trophy, Clock } from 'lucide-react'
import type { QuizResponse, QuizQuestionData } from '@/types/modes'

interface QuizRendererProps {
  quiz: QuizResponse
  onComplete?: (score: number, total: number) => void
}

export function QuizRenderer({ quiz, onComplete }: QuizRendererProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, number>>(new Map())
  const [showResults, setShowResults] = useState(false)
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set())

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100
  const isAnswered = answeredQuestions.has(currentQuestionIndex)

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered) return

    const newAnswers = new Map(selectedAnswers)
    newAnswers.set(currentQuestionIndex, answerIndex)
    setSelectedAnswers(newAnswers)

    const newAnswered = new Set(answeredQuestions)
    newAnswered.add(currentQuestionIndex)
    setAnsweredQuestions(newAnswered)
  }

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setShowResults(true)
      const score = calculateScore()
      onComplete?.(score, quiz.questions.length)
    }
  }

  const calculateScore = () => {
    let score = 0
    quiz.questions.forEach((question, index) => {
      if (selectedAnswers.get(index) === question.correctAnswer) {
        score++
      }
    })
    return score
  }

  const getScoreMessage = (score: number) => {
    const percentage = (score / quiz.questions.length) * 100
    if (percentage >= 90) return { message: "Outstanding! 🎉", color: "text-green-600" }
    if (percentage >= 70) return { message: "Great job! 👏", color: "text-blue-600" }
    if (percentage >= 50) return { message: "Good effort! 💪", color: "text-yellow-600" }
    return { message: "Keep practicing! 📚", color: "text-orange-600" }
  }

  if (showResults) {
    const score = calculateScore()
    const scoreMessage = getScoreMessage(score)

    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="text-center p-8" glow>
          <div className="mb-6">
            <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
            <p className={`text-xl font-semibold ${scoreMessage.color}`}>
              {scoreMessage.message}
            </p>
          </div>
          
          <div className="mb-8">
            <div className="text-5xl font-black text-gray-900 mb-2">
              {score} / {quiz.questions.length}
            </div>
            <p className="text-gray-600">questions correct</p>
          </div>

          <div className="space-y-4 mb-8">
            {quiz.questions.map((question, index) => {
              const userAnswer = selectedAnswers.get(index)
              const isCorrect = userAnswer === question.correctAnswer
              
              return (
                <div
                  key={question.id}
                  className={`p-4 rounded-xl border-2 ${
                    isCorrect
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">
                      Question {index + 1}
                    </span>
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{question.question}</p>
                  {!isCorrect && (
                    <p className="text-sm text-green-700">
                      Correct: {question.options[question.correctAnswer]}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <Button onClick={() => window.location.reload()} glow className="w-full">
            Try Another Quiz
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <Card className="mb-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{quiz.metadata.title}</h2>
            <p className="text-gray-600">{quiz.metadata.topic}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              {quiz.metadata.estimatedTime} min
            </div>
            <div className="text-sm font-medium text-gray-900">
              {quiz.metadata.difficulty}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-600 to-blue-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </p>
      </Card>

      {/* Question */}
      <Card className="mb-6 p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          {currentQuestion.question}
        </h3>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswers.get(currentQuestionIndex) === index
            const isCorrect = index === currentQuestion.correctAnswer
            const showResult = isAnswered

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={isAnswered}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  showResult
                    ? isCorrect
                      ? 'bg-green-50 border-green-300'
                      : isSelected
                      ? 'bg-red-50 border-red-300'
                      : 'bg-gray-50 border-gray-200'
                    : isSelected
                    ? 'bg-blue-50 border-blue-300'
                    : 'hover:bg-gray-50 border-gray-200'
                } ${isAnswered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {String.fromCharCode(65 + index)}. {option}
                  </span>
                  {showResult && (
                    <>
                      {isCorrect && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                      {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600" />}
                    </>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {isAnswered && (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-2">Explanation:</p>
            <p className="text-sm text-blue-800">{currentQuestion.explanation}</p>
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>

        <Button
          onClick={handleNext}
          disabled={!isAnswered}
          glow
        >
          {currentQuestionIndex < quiz.questions.length - 1 ? (
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
      </div>
    </div>
  )
}
