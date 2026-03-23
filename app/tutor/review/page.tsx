'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Profile, Quiz, Flashcard, UserPerformance } from '@/types/database'
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  TrendingDown,
  Trophy,
  RotateCcw,
} from 'lucide-react'

export default function ReviewPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [weakTopics, setWeakTopics] = useState<UserPerformance[]>([])
  const [recentQuizzes, setRecentQuizzes] = useState<Quiz[]>([])
  const [flashcardCount, setFlashcardCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
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

      // Load weak topics (performance < 70%)
      const { data: performanceData } = await supabase
        .from('user_performance')
        .select('*')
        .eq('user_id', session.user.id)
        .lt('average_score', 0.7)
        .order('average_score', { ascending: true })
        .limit(10)

      setWeakTopics(performanceData || [])

      // Load recent quizzes
      const { data: quizzesData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentQuizzes(quizzesData || [])

      // Count flashcards
      const { data: flashcardsData } = await supabase
        .from('flashcards')
        .select('id', { count: 'exact' })
        .eq('user_id', session.user.id)

      setFlashcardCount(flashcardsData?.length || 0)

      setLoading(false)
    }

    loadData()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/home')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Review Mode</h1>
              <p className="text-sm text-gray-600">
                Review your weak areas and past performance
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Weak Topics */}
        {weakTopics.length > 0 && (
          <Card className="mb-6" glow>
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-5 h-5 text-orange-600" />
              <h2 className="text-xl font-bold text-gray-900">Topics to Review</h2>
            </div>
            <p className="text-gray-600 mb-4">
              These are topics where you need more practice:
            </p>
            <div className="space-y-3">
              {weakTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="p-4 bg-orange-50 border border-orange-200 rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {topic.topic || topic.subject}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Average Score: {topic.average_score ? Math.round(topic.average_score * 100) : 0}%
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/tutor/quiz?topic=${encodeURIComponent(topic.topic || topic.subject)}`)}
                      glow
                    >
                      Practice
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent Quizzes */}
        {recentQuizzes.length > 0 && (
          <Card className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-bold text-gray-900">Recent Quizzes</h2>
            </div>
            <div className="space-y-3">
              {recentQuizzes.map((quiz) => {
                const percentage = quiz.total_questions > 0 
                  ? Math.round((quiz.score / quiz.total_questions) * 100)
                  : 0
                return (
                  <div
                    key={quiz.id}
                    className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/quiz/${quiz.id}/results`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{quiz.topic}</h3>
                        <p className="text-sm text-gray-600">
                          Score: {quiz.score}/{quiz.total_questions} ({percentage}%)
                        </p>
                      </div>
                      <RotateCcw className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Flashcards */}
        {flashcardCount > 0 && (
          <Card className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-accent-600" />
              <h2 className="text-xl font-bold text-gray-900">Flashcards</h2>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                You have {flashcardCount} flashcards to review
              </p>
              <Button
                onClick={() => router.push('/flashcards')}
                glow
              >
                Review Flashcards
              </Button>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {weakTopics.length === 0 && recentQuizzes.length === 0 && flashcardCount === 0 && (
          <Card className="text-center" glow>
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Review Items Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Complete some quizzes or create flashcards to see review suggestions here.
            </p>
            <Button onClick={() => router.push('/tutor/quiz')} glow>
              Take a Quiz
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}

