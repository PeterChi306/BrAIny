'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Profile } from '@/types/database'
import {
  ArrowLeft,
  Loader2,
  BookOpen,
} from 'lucide-react'

export default function QuizModePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseClient()
  const topic = searchParams.get('topic') || ''
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [topicInput, setTopicInput] = useState(topic)

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
    }

    loadData()
  }, [router, supabase])

  const handleGenerateQuiz = async () => {
    if (!topicInput.trim() || loading) return

    setLoading(true)
    try {
      // Generate quiz - this uses AI ONCE, then stores questions
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicInput.trim(),
          subject: null,
          difficulty: 'medium',
          numQuestions: 5,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate quiz')
      }

      if (result.quiz) {
        // Redirect to the quiz page - NO MORE AI USAGE
        router.push(`/quiz/${result.quiz.id}`)
      }
    } catch (error: any) {
      console.error('Error generating quiz:', error)
      alert(error.message || 'Failed to generate quiz. Please try again.')
      setLoading(false)
    }
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
              <h1 className="text-xl font-bold text-gray-900">Quiz Mode</h1>
              <p className="text-sm text-gray-600">
                Test your knowledge with interactive quizzes
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="text-center" glow>
          <BookOpen className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Generate a Quiz
          </h2>
          <p className="text-gray-600 mb-6">
            Enter a topic and I'll create a quiz for you. Once generated, you can take the quiz without using any tokens.
          </p>
          
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleGenerateQuiz()}
              placeholder="e.g., quadratic equations, World War II..."
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              disabled={loading}
            />
            <Button
              onClick={handleGenerateQuiz}
              disabled={!topicInput.trim() || loading}
              glow
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Generate Quiz'
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            Note: Quiz generation uses tokens once. Taking the quiz is free!
          </p>
        </Card>

        {/* Recent Quizzes */}
        <Card className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Your Recent Quizzes</h3>
          <p className="text-sm text-gray-600 text-center py-4">
            Completed quizzes will appear here
          </p>
        </Card>
      </div>
    </div>
  )
}

