'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Profile } from '@/types/database'
import { checkUsageLimit, getSubscriptionLimits } from '@/lib/subscription'
import {
  ArrowLeft,
  Send,
  Lightbulb,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react'

interface PracticeProblem {
  id: string
  problem: string
  hint: string | null
  solution: string | null
  steps: string[]
  userAnswer: string
  showHint: boolean
  showSolution: boolean
}

export default function PracticePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseClient()
  const topic = searchParams.get('topic') || ''
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [currentProblem, setCurrentProblem] = useState<PracticeProblem | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [input, setInput] = useState('')
  const [tokenUsage, setTokenUsage] = useState(0)

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

      // Load token usage
      const today = new Date().toISOString().split('T')[0]
      const { data: usageData } = await supabase
        .from('daily_usage')
        .select('ai_messages_count')
        .eq('user_id', session.user.id)
        .eq('date', today)
        .maybeSingle()

      if (usageData) {
        setTokenUsage(usageData.ai_messages_count)
      }

      // Generate initial problem if topic provided
      if (topic) {
        generateProblem(topic)
      }
    }

    loadData()
  }, [router, supabase, topic])

  const generateProblem = async (problemTopic: string) => {
    setGenerating(true)
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const limits = getSubscriptionLimits('free') // Practice uses minimal tokens
      if (tokenUsage >= limits.dailyAiMessages) {
        alert('Daily token limit reached. Upgrade for more practice problems.')
        return
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Give me a practice problem about ${problemTopic}. Format: PROBLEM: [problem], STEPS: [step1|step2|step3], SOLUTION: [solution]. Keep it appropriate for 9th grade.`,
          mode: 'practice',
          subject: null,
          conversationHistory: [],
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      // Parse problem
      const problemText = result.text
      const problemMatch = problemText.match(/PROBLEM:\s*([\s\S]+?)(?=STEPS:|SOLUTION:|$)/i)
      const stepsMatch = problemText.match(/STEPS:\s*([\s\S]+?)(?=SOLUTION:|$)/i)
      const solutionMatch = problemText.match(/SOLUTION:\s*([\s\S]+)$/i)

      const problem = problemMatch?.[1].trim() || problemText.substring(0, 200)
      const steps = stepsMatch?.[1].split('|').map((s: string) => s.trim()).filter(Boolean) || []
      const solution = solutionMatch?.[1].trim() || null

      setCurrentProblem({
        id: Date.now().toString(),
        problem,
        hint: null,
        solution,
        steps,
        userAnswer: '',
        showHint: false,
        showSolution: false,
      })

      // Update token usage
      const today = new Date().toISOString().split('T')[0]
      await supabase
        .from('daily_usage')
        .upsert(
          {
            user_id: session.user.id,
            date: today,
            ai_messages_count: tokenUsage + 1,
          },
          { onConflict: 'user_id,date' }
        )
      setTokenUsage(prev => prev + 1)
    } catch (error: any) {
      console.error('Error generating problem:', error)
      alert('Failed to generate practice problem')
    } finally {
      setGenerating(false)
      setLoading(false)
    }
  }

  const getHint = async () => {
    if (!currentProblem || currentProblem.showHint) return

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentProblem.problem,
          mode: 'practice',
          subject: null,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      setCurrentProblem(prev => prev ? {
        ...prev,
        hint: result.text,
        showHint: true,
      } : null)

      // Hint uses minimal tokens
      const today = new Date().toISOString().split('T')[0]
      await supabase
        .from('daily_usage')
        .upsert(
          {
            user_id: session.user.id,
            date: today,
            ai_messages_count: tokenUsage + 1,
          },
          { onConflict: 'user_id,date' }
        )
      setTokenUsage(prev => prev + 1)
    } catch (error: any) {
      console.error('Error getting hint:', error)
      alert('Failed to get hint')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    if (!currentProblem) return
    setCurrentProblem(prev => prev ? { ...prev, showSolution: true } : null)
  }

  const handleNewProblem = () => {
    if (topic) {
      generateProblem(topic)
    } else {
      setInput('')
      setCurrentProblem(null)
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
              <h1 className="text-xl font-bold text-gray-900">Practice Mode</h1>
              <p className="text-sm text-gray-600">
                Guided practice problems with hints
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {!currentProblem ? (
          <Card className="text-center" glow>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              What would you like to practice?
            </h2>
            <p className="text-gray-600 mb-6">
              Enter a topic and I'll give you a practice problem to work through.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !generating && generateProblem(input)}
                placeholder="e.g., quadratic equations, photosynthesis..."
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
              <Button
                onClick={() => generateProblem(input)}
                disabled={!input.trim() || generating}
                glow
              >
                {generating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Start'
                )}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card glow>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Practice Problem
              </h2>
              <p className="text-lg text-gray-700 whitespace-pre-wrap mb-6">
                {currentProblem.problem}
              </p>

              {currentProblem.steps.length > 0 && !currentProblem.showSolution && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Guided Steps:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    {currentProblem.steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {currentProblem.showHint && currentProblem.hint && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm font-semibold text-blue-900 mb-1">💡 Hint:</p>
                  <p className="text-blue-800">{currentProblem.hint}</p>
                </div>
              )}

              {currentProblem.showSolution && currentProblem.solution && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm font-semibold text-green-900 mb-1">✓ Solution:</p>
                  <p className="text-green-800 whitespace-pre-wrap">{currentProblem.solution}</p>
                </div>
              )}

              <div className="flex gap-2">
                {!currentProblem.showHint && !currentProblem.showSolution && (
                  <Button
                    variant="outline"
                    onClick={getHint}
                    disabled={loading}
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Get Hint
                  </Button>
                )}
                {!currentProblem.showSolution && (
                  <Button
                    onClick={handleSubmit}
                    glow
                  >
                    Show Solution
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleNewProblem}
                  className="ml-auto"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  New Problem
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

