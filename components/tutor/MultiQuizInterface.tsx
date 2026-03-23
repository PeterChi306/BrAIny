'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, RotateCcw, ArrowRight, X, Clock, Target } from 'lucide-react'

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: string
}

interface MultiQuizInterfaceProps {
  content: string
  onComplete?: () => void
  onExit?: () => void
}

export function MultiQuizInterface({ content, onComplete, onExit }: MultiQuizInterfaceProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)
  const [startTime] = useState(Date.now())

  // Parse the multi-question quiz content
  const parseMultiQuizContent = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    const quizQuestions: QuizQuestion[] = []
    
    let currentQuestion: Partial<QuizQuestion> = {}
    let questionNumber = 0
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Match question pattern: Q1: [question]
      const questionMatch = trimmedLine.match(/^Q(\d+):\s*(.+)$/)
      if (questionMatch) {
        // Save previous question if exists
        if (currentQuestion.question && currentQuestion.options && currentQuestion.correctAnswer) {
          quizQuestions.push(currentQuestion as QuizQuestion)
        }
        
        // Start new question
        currentQuestion = {
          question: questionMatch[2],
          options: [],
          correctAnswer: ''
        }
        questionNumber = parseInt(questionMatch[1])
        continue
      }
      
      // Match answer pattern: A1: [correct letter]
      const answerMatch = trimmedLine.match(/^A(\d+):\s*([a-d])$/i)
      if (answerMatch && parseInt(answerMatch[1]) === questionNumber) {
        currentQuestion.correctAnswer = answerMatch[2].toLowerCase()
        continue
      }
      
      // Match option pattern: a) [option]
      const optionMatch = trimmedLine.match(/^[a-d]\)\s*(.+)$/)
      if (optionMatch && currentQuestion.options) {
        currentQuestion.options.push(trimmedLine)
        continue
      }
    }
    
    // Add the last question
    if (currentQuestion.question && currentQuestion.options && currentQuestion.correctAnswer) {
      quizQuestions.push(currentQuestion as QuizQuestion)
    }
    
    return quizQuestions
  }

  useEffect(() => {
    const parsedQuestions = parseMultiQuizContent(content)
    setQuestions(parsedQuestions)
    setSelectedAnswers(new Array(parsedQuestions.length).fill(''))
  }, [content])

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestionIndex] = answer
    setSelectedAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Calculate score
      let correctCount = 0
      questions.forEach((question, index) => {
        const selectedAnswer = selectedAnswers[index]
        const optionLetter = selectedAnswer.replace(/^[a-d]\)\s*/, '').trim()
        const correctLetter = question.correctAnswer
        
        // Extract the letter from the selected option
        const selectedLetter = selectedAnswer.match(/^[a-d]\)/i)?.[1]?.toLowerCase()
        if (selectedLetter === correctLetter) {
          correctCount++
        }
      })
      setScore(correctCount)
      setShowResults(true)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleRestart = () => {
    setCurrentQuestionIndex(0)
    setSelectedAnswers(new Array(questions.length).fill(''))
    setShowResults(false)
    setScore(0)
  }

  const getTimeSpent = () => {
    const minutes = Math.floor((Date.now() - startTime) / 60000)
    const seconds = Math.floor(((Date.now() - startTime) % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100)
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 sm:p-6">
        {/* Header */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <Target className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-white">Quiz Complete!</h1>
              </div>
            </div>
            <button
              onClick={onExit}
              className="p-2 sm:p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Results Card */}
          <div className="bg-slate-800 rounded-2xl p-4 sm:p-6 lg:p-8 border border-slate-700 shadow-2xl">
            <div className="text-center mb-6 sm:mb-8">
              <div className={`text-4xl sm:text-6xl font-bold mb-4 ${
                percentage >= 80 ? 'text-green-400' : 
                percentage >= 60 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {percentage}%
              </div>
              <p className="text-lg sm:text-xl text-white mb-2">
                You got {score} out of {questions.length} questions correct
              </p>
              <p className="text-sm sm:text-base text-slate-400 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                Time spent: {getTimeSpent()}
              </p>
            </div>

            {/* Question Review */}
            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Question Review:</h3>
              {questions.map((question, index) => {
                const selectedAnswer = selectedAnswers[index]
                const selectedLetter = selectedAnswer.match(/^[a-d]\)/i)?.[1]?.toLowerCase()
                const isCorrect = selectedLetter === question.correctAnswer
                
                return (
                  <div key={index} className="bg-slate-700/50 rounded-lg p-3 sm:p-4 border border-slate-600">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                        isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {isCorrect ? '✓' : '✗'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium mb-2 text-sm sm:text-base break-words overflow-wrap-anywhere">
                          Q{index + 1}: {question.question}
                        </p>
                        <p className="text-slate-400 text-xs sm:text-sm break-words overflow-wrap-anywhere">
                          Your answer: {selectedAnswer || 'Not answered'}
                        </p>
                        {!isCorrect && (
                          <p className="text-green-400 text-xs sm:text-sm break-words overflow-wrap-anywhere">
                            Correct answer: {question.correctAnswer.toUpperCase()})
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={handleRestart}
                className="flex-1 p-3 sm:p-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                Try Again
              </button>
              <button
                onClick={onExit}
                className="flex-1 p-3 sm:p-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                Back to Tutor
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 sm:p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <Target className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-white">Quiz Challenge</h1>
              <p className="text-sm sm:text-base text-slate-400">Question {currentQuestionIndex + 1} of {questions.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-xs sm:text-sm text-slate-400 flex items-center gap-1 sm:gap-2 hidden sm:flex">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              {getTimeSpent()}
            </div>
            <button
              onClick={onExit}
              className="p-2 sm:p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-slate-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-slate-800 rounded-2xl p-4 sm:p-6 lg:p-8 border border-slate-700 shadow-2xl mb-4 sm:mb-6 overflow-hidden">
          <div className="mb-6 sm:mb-8">
            <div className="bg-slate-700/50 rounded-xl p-4 sm:p-6 border border-slate-600">
              <p className="text-white text-base sm:text-lg font-medium leading-relaxed break-words overflow-wrap-anywhere">
                {currentQuestion.question}
              </p>
            </div>
          </div>
          
          {/* Options */}
          <div className="space-y-2 sm:space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswers[currentQuestionIndex] === option
              const optionLetter = String.fromCharCode(65 + index)
              const optionText = option.replace(/^[a-d]\)\s*/, '').trim()
              
              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  className={`w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/20 text-blue-100 shadow-lg shadow-blue-500/25'
                      : 'border-slate-600 bg-slate-800/50 text-slate-200 hover:border-slate-500 hover:bg-slate-800'
                  } cursor-pointer hover:shadow-lg`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 ${
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {optionLetter}
                    </div>
                    <span className="flex-1 font-medium text-sm sm:text-base break-words overflow-wrap-anywhere min-w-0">{optionText}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="p-3 sm:p-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={!selectedAnswers[currentQuestionIndex]}
            className="flex-1 p-3 sm:p-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
