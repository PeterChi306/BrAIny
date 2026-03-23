'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, Plus, X, Loader2, CheckCircle, AlertCircle, BookOpen, Target } from 'lucide-react'
import { BottomNavigation } from '@/components/BottomNavigation'
import { Profile } from '@/types/database'

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

export default function QuizCreationPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [topic, setTopic] = useState('')
  const [subject, setSubject] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [numQuestions, setNumQuestions] = useState(5)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [userAnswers, setUserAnswers] = useState<number[]>([])
  const [score, setScore] = useState(0)

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (!profileData?.grade_level) {
        router.push('/onboarding')
        return
      }

      setProfile(profileData)
    }

    loadProfile()
  }, [router, supabase])

  const generateQuiz = async () => {
    if (!topic.trim()) {
      alert('Please enter a topic for the quiz')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          subject: subject || null,
          difficulty,
          numQuestions,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to generate quiz')
      }

      if (result.quiz) {
        setQuestions(result.quiz.questions || [])
        setCurrentQuestion(0)
        setUserAnswers([])
        setShowResults(false)
        setScore(0)
      }
    } catch (error: any) {
      console.error('Error generating quiz:', error)
      alert(error.message || 'Failed to generate quiz. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleAnswer = (answerIndex: number) => {
    const newUserAnswers = [...userAnswers]
    newUserAnswers[currentQuestion] = answerIndex
    setUserAnswers(newUserAnswers)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Calculate score
      let correctCount = 0
      newUserAnswers.forEach((answer, index) => {
        if (answer === questions[index].correctAnswer) {
          correctCount++
        }
      })
      setScore(correctCount)
      setShowResults(true)
    }
  }

  const resetQuiz = () => {
    setCurrentQuestion(0)
    setUserAnswers([])
    setShowResults(false)
    setScore(0)
  }

  const saveQuiz = async () => {
    if (questions.length === 0) return

    setLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return

      // Save quiz to database
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          user_id: session.user.id,
          title: `${topic} Quiz`,
          topic: topic,
          subject: subject || null,
          difficulty,
          questions: questions,
        })
        .select()
        .single()

      if (quizError) throw quizError

      // Save quiz results
      const { error: resultError } = await supabase
        .from('quiz_results')
        .insert({
          user_id: session.user.id,
          quiz_id: quizData.id,
          score: score,
          total_questions: questions.length,
          answers: userAnswers,
        })

      if (resultError) throw resultError

      alert('Quiz saved successfully!')
      router.push('/quiz')
    } catch (error: any) {
      console.error('Error saving quiz:', error)
      alert('Failed to save quiz. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/home')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-primary dark:text-inverse">Create Quiz</h1>
              <p className="text-sm text-secondary dark:text-inverse-secondary">Generate a custom quiz</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6">
          <Card className="p-6 bg-card dark:bg-card-dark shadow-card">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary dark:text-inverse mb-2">
                  Topic *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Photosynthesis, World War II, Algebra"
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-primary dark:text-inverse placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary dark:text-inverse mb-2">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-primary dark:text-inverse"
                >
                  <option value="">Select a subject</option>
                  <option value="math">Mathematics</option>
                  <option value="science">Science</option>
                  <option value="history">History</option>
                  <option value="english">English</option>
                  <option value="geography">Geography</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary dark:text-inverse mb-2">
                  Difficulty
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['easy', 'medium', 'hard'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                        difficulty === level
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary dark:text-inverse mb-2">
                  Number of Questions
                </label>
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-primary dark:text-inverse"
                >
                  <option value={3}>3 questions</option>
                  <option value={5}>5 questions</option>
                  <option value={10}>10 questions</option>
                  <option value={15}>15 questions</option>
                </select>
              </div>

              <Button
                onClick={generateQuiz}
                disabled={generating || !topic.trim()}
                className="w-full py-3"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Quiz...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Generate Quiz
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        <BottomNavigation />
      </div>
    )
  }

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100)

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-primary dark:text-inverse">Quiz Results</h1>
              <p className="text-sm text-secondary dark:text-inverse-secondary">{topic}</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6">
          <Card className="p-6 bg-card dark:bg-card-dark shadow-card">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {percentage}%
                </span>
              </div>
              <h2 className="text-2xl font-bold text-primary dark:text-inverse mb-2">
                {score} out of {questions.length} correct
              </h2>
              <p className="text-secondary dark:text-inverse-secondary">
                {percentage >= 80 ? 'Excellent work!' : percentage >= 60 ? 'Good job!' : 'Keep practicing!'}
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {questions.map((question, index) => {
                const isCorrect = userAnswers[index] === question.correctAnswer
                return (
                  <div
                    key={question.id}
                    className={`p-4 rounded-lg border ${
                      isCorrect
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-primary dark:text-inverse mb-2">
                          {index + 1}. {question.question}
                        </p>
                        <p className="text-sm text-secondary dark:text-inverse-secondary">
                          Your answer: {question.options[userAnswers[index]]}
                        </p>
                        {!isCorrect && (
                          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                            Correct: {question.options[question.correctAnswer]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={resetQuiz}
                variant="outline"
                className="flex-1"
              >
                Retake Quiz
              </Button>
              <Button
                onClick={saveQuiz}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Save Quiz'
                )}
              </Button>
            </div>
          </Card>
        </div>

        <BottomNavigation />
      </div>
    )
  }

  const question = questions[currentQuestion]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-lg font-bold text-primary dark:text-inverse">Quiz</h1>
              <span className="text-sm text-secondary dark:text-inverse-secondary">
                {currentQuestion + 1} / {questions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card className="p-6 bg-card dark:bg-card-dark shadow-card">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-primary dark:text-inverse mb-4">
              {question.question}
            </h2>
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className="w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-primary dark:text-inverse"
                >
                  <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  )
}
