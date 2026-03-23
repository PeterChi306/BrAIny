'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, RotateCcw, ArrowRight, Clock, Target, Brain, Lock, Sparkles } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useRouter } from 'next/navigation'
import { useUserTier } from '@/contexts/UserTierContext'

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: string
}

interface QuizModalProps {
  isOpen: boolean
  onClose: () => void
  content: string
  onComplete?: () => void
}

export function QuizModal({ isOpen, onClose, content, onComplete }: QuizModalProps) {
  const router = useRouter()
  const { userTier } = useUserTier()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isParsing, setIsParsing] = useState(true)
  const [quizTopic, setQuizTopic] = useState('Learning Assessment')
  const [quizSubject, setQuizSubject] = useState('General')

  // Parse the multi-question quiz content with improved regex patterns
  const parseMultiQuizContent = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    const quizQuestions: QuizQuestion[] = []
    
    let currentQuestion: Partial<QuizQuestion> = {}
    let questionNumber = 0
    
    console.log('📝 Parsing quiz content:', text.substring(0, 200) + '...')
    
    for (const line of lines) {
      const trimmedLine = line.trim()

      // Extract Topic/Subject if present
      const topicMatch = trimmedLine.match(/(?:Topic|Subject|Title):\s*(.+)/i)
      if (topicMatch) {
        setQuizTopic(topicMatch[1])
        setQuizSubject(topicMatch[1]) // Fallback to same for subject
        continue // Don't process this line as a question/option/answer
      }
      
      // Match question pattern: Q1: [question], 1. [question], Question 1: [question], or just Question: [question]
      const questionMatch = trimmedLine.match(/^(?:(?:Question|Q)\s*(?:\d+)?[:\.]?|(?:\d+)[:\.])\s*(.+)$/i)
      if (questionMatch) {
        // Save previous question if it has a question and a correct answer (options might be partially missing)
        if (currentQuestion.question && currentQuestion.correctAnswer) {
          quizQuestions.push(currentQuestion as QuizQuestion)
          console.log('✅ Saved question:', currentQuestion.question?.substring(0, 50) + '...')
        }
        
        // Start new question
        currentQuestion = {
          question: questionMatch[1],
          options: [],
          correctAnswer: ''
        }
        questionNumber++
        continue
      }
      
      // Match options pattern: a) [option] or A. [option] or (A) [option]
      const optionMatch = trimmedLine.match(/^[a-dA-D][\).]\s*(.+)$/)
      if (optionMatch && currentQuestion.options) {
        // Remove common debris like double letters
        const optionText = optionMatch[1].replace(/^[a-dA-D][\)]\s*/, '').trim()
        currentQuestion.options.push(optionText)
        continue
      }
      
      // Match correct answer pattern: Correct Answer: a OR A1: b (multiple formats)
      const correctAnswerMatch = trimmedLine.match(/^(?:Correct\s*Answer|Answer|Correct)[:\s]*([a-dA-D])/i) ||
                                 trimmedLine.match(/^A(\d+):\s*([a-dA-D])/i)
      
      if (correctAnswerMatch && currentQuestion.options) {
        const correctLetter = (correctAnswerMatch[2] || correctAnswerMatch[1]).trim().toLowerCase()
        const correctIndex = correctLetter.charCodeAt(0) - 97 // a=0, b=1, etc.
        
        if (currentQuestion.options[correctIndex]) {
          currentQuestion.correctAnswer = currentQuestion.options[correctIndex]
          console.log('✅ Set correct answer:', correctLetter, '->', currentQuestion.correctAnswer)
        } else if (correctLetter.length === 1 && 'abcd'.includes(correctLetter)) {
          // Store letter if we don't have enough options yet
          currentQuestion.correctAnswer = correctLetter
        }
      }
    }
    
    // Save last question
    if (currentQuestion.question && currentQuestion.correctAnswer) {
      // If we only have a letter for correct answer, find it in options
      if (currentQuestion.correctAnswer.length === 1 && 'abcd'.includes(currentQuestion.correctAnswer.toLowerCase())) {
        const idx = currentQuestion.correctAnswer.toLowerCase().charCodeAt(0) - 97
        if (currentQuestion.options && currentQuestion.options[idx]) {
          currentQuestion.correctAnswer = currentQuestion.options[idx]
        }
      }
      quizQuestions.push(currentQuestion as QuizQuestion)
    }
    
    console.log(`📊 Parsed ${quizQuestions.length} questions`)
    
    if (quizQuestions.length === 0) {
      console.log('⚠️ Parsing failed, no questions found')
    }
    
    return quizQuestions
  }

  useEffect(() => {
    if (content) {
      setIsParsing(true)
      console.log('🔍 Raw quiz content received:', content)
      
      // Add small delay to show loading state
      const timer = setTimeout(() => {
        const parsedQuestions = parseMultiQuizContent(content)
        console.log('📊 Final parsed questions:', parsedQuestions)
        setQuestions(parsedQuestions)
        setSelectedAnswers(new Array(parsedQuestions.length).fill(''))
        setIsParsing(false)
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [content, isOpen])

  // Reset timer whenever the quiz modal is opened or restarted
  useEffect(() => {
    if (isOpen && !isParsing && !showResults) {
      const now = Date.now()
      setStartTime(now)
      setCurrentTime(now)
    }
  }, [isOpen, isParsing, showResults])

  // Update timer every second only when quiz is active
  useEffect(() => {
    if (!isOpen || showResults || isParsing || !startTime) return

    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, showResults, isParsing, startTime])

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
      let finalScore = 0
      questions.forEach((question, index) => {
        if (selectedAnswers[index] === question.correctAnswer) {
          finalScore++
        }
      })
      setScore(finalScore)
      setShowResults(true)
      
      // PERSIST: Record the quiz score for Home page diagnostic
      savePerformance(finalScore, questions.length)
    }
  }

  const savePerformance = async (finalScore: number, totalQuestions: number) => {
    try {
      const { createSupabaseClient } = await import('@/lib/supabase/client')
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const accuracy = finalScore / totalQuestions
      
      // Upsert into user_performance for real data tracking
      const { error } = await supabase
        .from('user_performance')
        .upsert({
          user_id: session.user.id,
          topic: quizTopic,
          subject: quizSubject,
          average_score: accuracy,
          total_attempts: 1, // First recorded attempt via this interface
          last_studied_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id, topic, subject'
        })
      
      if (error) console.error('Error saving performance:', error)
      else console.log('✅ Quiz performance persisted successfully')
    } catch (err) {
      console.warn('Failed to persist results:', err)
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
    const now = Date.now()
    setStartTime(now)
    setCurrentTime(now)
  }

  const getTimeSpent = () => {
    if (!startTime) return "0:00"
    const seconds = Math.floor((currentTime - startTime) / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (showResults) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Quiz Results" size="md">
        <div className="p-6 pb-10">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mx-auto mb-4">
              <Target className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {score} out of {questions.length}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {Math.round((score / questions.length) * 100)}% correct
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {questions.map((question, index) => {
              const selectedAnswer = selectedAnswers[index]
              const isCorrect = selectedAnswer === question.correctAnswer
              
              return (
                <div key={index} className={`p-4 rounded-2xl border transition-all ${isCorrect ? 'border-green-500/10 bg-green-500/5' : 'border-red-500/10 bg-red-500/5'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="font-bold text-gray-900 dark:text-white">
                        Question {index + 1}
                      </span>
                    </div>
                    {!isCorrect && (
                      <button
                        onClick={() => {
                          const mistakePrompt = `I just took a quiz and got this question wrong:\n\nQ: ${question.question}\nMy Answer: ${selectedAnswer}\nCorrect Answer: ${question.correctAnswer}\n\nCan you explain exactly why I was wrong and help me fix my mental model for this specific concept?`
                          router.push(`/tutor?new=true&message=${encodeURIComponent(mistakePrompt)}`)
                          onClose()
                        }}
                        className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        Explain My Mistake
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 italic">
                    {selectedAnswer || 'No answer provided'}
                  </p>
                  {!isCorrect && (
                    <p className="text-sm font-medium text-green-600 dark:text-green-500 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Correct: {question.correctAnswer}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  onComplete?.()
                  onClose()
                }}
                className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
              >
                Done
              </button>
            </div>
            
            <button
              onClick={() => {
                const mistakes = questions
                  .map((q, i) => ({
                    question: q.question,
                    userAnswer: selectedAnswers[i],
                    correctAnswer: q.correctAnswer,
                    isCorrect: selectedAnswers[i] === q.correctAnswer
                  }))
                  .filter(m => !m.isCorrect)

                if (mistakes.length === 0) {
                  router.push('/tutor?new=true&message=' + encodeURIComponent("I aced my last quiz! What's the next challenge?"))
                } else {
                  // Send the specific mistakes as a structured prompt
                  const mistakePrompt = `I just finished a quiz and got ${score}/${questions.length}. I struggled with these specific parts:\n${mistakes.map(m => `- Q: ${m.question}\n  My Answer: ${m.userAnswer}\n  Correct: ${m.correctAnswer}`).join('\n')}\n\nCan you explain exactly WHY I got these wrong and help me fix my mental model? Be detailed like a human tutor.`
                  router.push(`/tutor?new=true&message=${encodeURIComponent(mistakePrompt)}`)
                }
                onClose()
              }}
              className="w-full px-4 py-4 rounded-xl font-black uppercase text-xs tracking-widest bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/20 flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              <Sparkles className="w-5 h-5 animate-pulse" />
              Neural Correction Session
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  // Show loading state while parsing
  if (isParsing) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Generating Quiz" size="md">
        <div className="p-6 pb-10 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Target className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Creating Your Quiz
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Analyzing our conversation to generate personalized questions...
          </p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quiz Challenge" size="lg">
      <div className="p-6 pb-10">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {getTimeSpent()}
            </span>
          </div>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="mb-6">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-900 dark:text-white font-medium">
              {currentQuestion?.question}
            </p>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {currentQuestion?.options.map((option, index) => {
            const isSelected = selectedAnswers[currentQuestionIndex] === option
            const optionLetter = String.fromCharCode(65 + index)
            const optionText = option.replace(/^[a-d]\)\s*/, '').trim()
            
            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {optionLetter}
                  </div>
                  <span className="flex-1">{optionText}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Navigation - Fixed at the bottom of the modal content area for better access */}
        <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-gray-800 sticky -bottom-10 -mx-6 px-6 bg-white dark:bg-gray-900 pb-10 z-10 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)]">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-colors"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={!selectedAnswers[currentQuestionIndex]}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors shadow-lg"
          >
            {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
