'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { InteractiveQuiz } from '@/components/quiz/InteractiveQuiz'
import { QuizResults } from '@/components/quiz/QuizResults'
import { BottomNavigation } from '@/components/BottomNavigation'
import { cn } from '@/lib/utils'
import {
  Trophy,
  Target,
  Brain,
  Zap,
  Clock,
  ArrowRight,
  BarChart3,
  Sparkles,
  BookOpen,
  Play,
  History
} from 'lucide-react'
import { LoadingScreen } from '@/components/LoadingScreen'

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

export default function QuizPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { displayName } = { displayName: 'User' } // Placeholder since useUserProfile is not available
  const supabase = createSupabaseClient()

  const [quizState, setQuizState] = useState<'home' | 'loading' | 'quiz' | 'results'>('home')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [results, setResults] = useState<QuizResult[]>([])
  const [recentQuizzes, setRecentQuizzes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const content = searchParams.get('content')
  const topic = searchParams.get('topic')

  useEffect(() => {
    if (content || topic) {
      startQuiz()
    } else {
      loadRecentQuizzes()
    }
  }, [content, topic])

  const loadRecentQuizzes = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: quizzes } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentQuizzes(quizzes || [])
    } catch (error) {
      console.error('Error loading recent quizzes:', error)
    }
  }

  const startQuiz = async () => {
    if (!content && !topic) return

    setQuizState('loading')
    setLoading(true)

    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic || 'General Knowledge',
          content: content,
          difficulty: 'medium',
          numQuestions: 5
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate quiz')
      }

      const data = await response.json()
      const formattedQuestions: QuizQuestion[] = data.questions.map((q: any, index: number) => ({
        id: `q${index}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty || 'medium',
        subject: q.subject || 'General'
      }))

      setQuestions(formattedQuestions)
      setQuizState('quiz')
    } catch (error: any) {
      console.error('Error generating quiz:', error)
      alert(error.message || 'Failed to generate quiz. Please try again.')
      setQuizState('home')
    } finally {
      setLoading(false)
    }
  }

  const handleQuizComplete = async (quizResults: QuizResult[]) => {
    setResults(quizResults)
    setQuizState('results')

    // Save quiz results
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const correctCount = quizResults.filter(r => r.isCorrect).length
      const percentage = Math.round((correctCount / quizResults.length) * 100)

      await supabase.from('quiz_sessions').insert({
        user_id: session.user.id,
        topic: topic || 'Generated Quiz',
        questions_count: quizResults.length,
        correct_answers: correctCount,
        percentage,
        time_taken: quizResults.reduce((sum, r) => sum + r.timeTaken, 0),
        results: quizResults
      })
    } catch (error) {
      console.error('Error saving quiz results:', error)
    }
  }

  const handleRetake = () => {
    setResults([])
    setQuizState('quiz')
  }

  const handleContinue = () => {
    router.push('/tutor')
  }

  const createNewQuiz = () => {
    router.push('/tutor?mode=quiz')
  }

  if (quizState === 'loading' || loading) {
    return <LoadingScreen message="Generating your personalized quiz..." />
  }

  if (quizState === 'quiz') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 pb-24">
        <div className="px-4 py-6 max-w-4xl mx-auto">
          <InteractiveQuiz
            questions={questions}
            onComplete={handleQuizComplete}
            showExplanations={true}
            timeLimit={600} // 10 minutes
          />
        </div>
        <BottomNavigation />
      </div>
    )
  }

  if (quizState === 'results') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 pb-24">
        <div className="px-4 py-6 max-w-4xl mx-auto">
          <QuizResults
            results={results}
            questions={questions}
            onRetake={handleRetake}
            onContinue={handleContinue}
            showDetails={true}
          />
        </div>
        <BottomNavigation />
      </div>
    )
  }

  // Home State
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 pb-24">
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Quiz Arena
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Test your knowledge and track your progress
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={createNewQuiz}
            className="p-4 bg-blue-600 hover:bg-blue-700"
          >
            <Play className="w-6 h-6 mb-2" />
            <span className="font-medium">New Quiz</span>
          </Button>

          <Button
            onClick={() => router.push('/tutor?mode=quiz')}
            variant="outline"
            className="p-4"
          >
            <BookOpen className="w-6 h-6 mb-2" />
            <span className="font-medium">Study First</span>
          </Button>
        </div>

        {/* Features */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Why Choose Our Quizzes?
          </h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Adaptive Difficulty</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Questions adjust to your skill level
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-purple-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">AI-Generated</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Personalized questions based on your learning
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Instant Feedback</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Detailed explanations for every answer
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Quizzes */}
        {recentQuizzes.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5" />
                Recent Quizzes
              </h3>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>

            <div className="space-y-3">
              {recentQuizzes.map((quiz) => (
                <div key={quiz.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {quiz.topic}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {quiz.correct_answers}/{quiz.questions_count} correct
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      'text-lg font-bold',
                      quiz.percentage >= 80 ? 'text-green-600' :
                        quiz.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                    )}>
                      {quiz.percentage}%
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(quiz.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Stats Overview */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Your Progress
          </h3>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {recentQuizzes.reduce((sum, q) => sum + q.questions_count, 0)}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Questions</p>
            </div>

            <div>
              <div className="text-2xl font-bold text-green-600">
                {recentQuizzes.length > 0
                  ? Math.round(recentQuizzes.reduce((sum, q) => sum + q.percentage, 0) / recentQuizzes.length)
                  : 0}%
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Avg Score</p>
            </div>

            <div>
              <div className="text-2xl font-bold text-purple-600">
                {recentQuizzes.length}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Quizzes</p>
            </div>
          </div>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  )
}
