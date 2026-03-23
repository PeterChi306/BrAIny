'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { CognitiveProfileEngine } from '@/lib/cognitive/engine'
import { CognitiveAIOrchestrator } from '@/lib/cognitive/orchestrator'
import { AnswerRefusalSystem } from '@/lib/cognitive/friction'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, Send, Loader2, Target, Timer, Brain, Zap, TrendingUp } from 'lucide-react'
import { BottomNavigation } from '@/components/BottomNavigation'
import type { CognitivePromptContext, ThinkingGate } from '@/types/cognitive'

interface Problem {
  id: string
  domain: string
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  hint: string
  solution: string
}

interface Attempt {
  id: string
  problemId: string
  response: string
  confidence: number
  timeSpent: number
  hintsUsed: number
  timestamp: Date
}

export default function PracticeModePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseClient()
  const cognitiveEngine = CognitiveProfileEngine.getInstance()
  const aiOrchestrator = CognitiveAIOrchestrator.getInstance()
  const refusalSystem = AnswerRefusalSystem.getInstance()

  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null)
  const [userResponse, setUserResponse] = useState('')
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(false)
  const [cognitiveContext, setCognitiveContext] = useState<CognitivePromptContext | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date())
  const [problemStartTime, setProblemStartTime] = useState<Date>(new Date())
  const [showHint, setShowHint] = useState(false)
  const [hintRequested, setHintRequested] = useState(false)
  const [userConfidence, setUserConfidence] = useState<number>(50)
  const [timeSpent, setTimeSpent] = useState<number>(0)
  const [timerActive, setTimerActive] = useState<boolean>(false)

  useEffect(() => {
    initializePracticeSession()
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (timerActive) {
      timer = setInterval(() => {
        setTimeSpent(Math.floor((new Date().getTime() - problemStartTime.getTime()) / 1000))
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [timerActive, problemStartTime])

  const initializePracticeSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth/login')
      return
    }

    const context = await cognitiveEngine.createCognitiveContext(
      session.user.id,
      'practice',
      searchParams.get('domain') || 'math',
      ''
    )
    setCognitiveContext(context)
    setSessionStartTime(new Date())

    await generateNewProblem(context)
  }

  const generateNewProblem = async (context: CognitivePromptContext) => {
    setLoading(true)
    setProblemStartTime(new Date())
    setTimeSpent(0)
    setTimerActive(true)
    setShowHint(false)
    setHintRequested(false)
    setUserResponse('')
    setUserConfidence(50)

    try {
      const problemPrompt = `Generate a practice problem for ${context.domain} at medium difficulty level.

The problem should:
- Require step-by-step reasoning
- Have multiple solution paths
- Challenge common misconceptions
- Be solvable without calculator for basic math
- Include real-world context when possible

Format your response as JSON:
{
  "question": "The problem statement",
  "hint": "A subtle hint that guides thinking without giving away solution",
  "solution": "The complete solution approach"
}

Focus on problems that develop thinking skills, not just procedural knowledge.`

      const response = await aiOrchestrator.orchestrateResponse(problemPrompt, context)

      // Parse JSON response
      let problemData
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          problemData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in response')
        }
      } catch (parseError) {
        // Fallback problem if JSON parsing fails
        problemData = {
          question: "Explain step-by-step how you would approach solving: 2x + 5 = 13",
          hint: "Think about what operation you need to perform first to isolate x",
          solution: "Subtract 5 from both sides, then divide by 2 to get x = 4"
        }
      }

      const newProblem: Problem = {
        id: Math.random().toString(36).substr(2, 9),
        domain: context.domain,
        difficulty: 'medium',
        question: problemData.question,
        hint: problemData.hint,
        solution: problemData.solution
      }

      setCurrentProblem(newProblem)
    } catch (error) {
      console.error('Error generating problem:', error)
      // Fallback problem
      setCurrentProblem({
        id: 'fallback',
        domain: context.domain,
        difficulty: 'medium',
        question: "Explain your approach to solving this problem: A rectangle has perimeter 24 cm. If its length is twice its width, find the dimensions.",
        hint: "Start by setting up variables for length and width, then use the perimeter formula.",
        solution: "Let width = w, then length = 2w. Perimeter = 2(length + width) = 2(2w + w) = 6w = 24, so w = 4 cm and length = 8 cm."
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAttempt = async () => {
    if (!userResponse.trim() || !cognitiveContext || !currentProblem) return

    // Apply thinking gates
    const gateCheck = await refusalSystem.checkThinkingGates(userResponse, cognitiveContext)

    if (!gateCheck.passed) {
      const frictionLevel = refusalSystem.calculateFrictionLevel(cognitiveContext.thinkingFingerprint)
      const refusalResponse = refusalSystem.generateRefusalResponse(gateCheck.failedGates, frictionLevel)

      // Show refusal as a message
      alert(refusalResponse)
      return
    }

    const attempt: Attempt = {
      id: Math.random().toString(36).substr(2, 9),
      problemId: currentProblem.id,
      response: userResponse,
      confidence: userConfidence,
      timeSpent,
      hintsUsed: hintRequested ? 1 : 0,
      timestamp: new Date()
    }

    setAttempts(prev => [...prev, attempt])
    setTimerActive(false)

    // Update cognitive profile
    await cognitiveEngine.updateFromInteraction(
      cognitiveContext.userId,
      {
        problemId: currentProblem.id,
        response: userResponse,
        confidence: userConfidence,
        timeToResponse: timeSpent,
        hintsUsed: hintRequested ? 1 : 0,
        correctness: 0.5, // Would be assessed by AI
        reasoningDepth: gateCheck.passed ? 3 : 1,
        timestamp: new Date().toISOString()
      },
      currentProblem.domain
    )

    // Generate feedback
    await generateFeedback(attempt)
  }

  const generateFeedback = async (attempt: Attempt) => {
    if (!cognitiveContext || !currentProblem) return

    setLoading(true)

    try {
      const feedbackPrompt = `Analyze this student's attempt at a practice problem and provide cognitive training feedback.

PROBLEM: ${currentProblem.question}
STUDENT'S RESPONSE: ${attempt.response}
CONFIDENCE LEVEL: ${attempt.confidence}%
TIME SPENT: ${attempt.timeSpent} seconds
HINTS USED: ${attempt.hintsUsed}

Provide feedback that:
1. Validates thinking effort over correctness
2. Identifies reasoning patterns (good and bad)
3. Suggests specific cognitive improvements
4. Challenges assumptions if needed
5. Encourages deeper thinking about approach

Focus on "how they think" not just "what they answered".`

      const feedback = await aiOrchestrator.orchestrateResponse(feedbackPrompt, cognitiveContext)

      // Show feedback in a modal or alert for now
      alert(feedback)

      // Generate new problem after feedback
      setTimeout(() => {
        generateNewProblem(cognitiveContext)
      }, 2000)

    } catch (error) {
      console.error('Error generating feedback:', error)
      alert('Great effort! Let me analyze your thinking and get you the next problem.')
      generateNewProblem(cognitiveContext)
    } finally {
      setLoading(false)
    }
  }

  const handleHintRequest = async () => {
    if (!currentProblem || !cognitiveContext) return

    // Apply friction for hint request
    const friction = await refusalSystem.applyProductiveFriction(cognitiveContext, true)

    if (friction.shouldDelay) {
      alert(`Take ${friction.delaySeconds} seconds to think differently before I provide a hint.\n\n${friction.thinkingPrompt}`)

      // Wait for thinking time
      await new Promise(resolve => setTimeout(resolve, friction.delaySeconds * 1000))
    }

    setShowHint(true)
    setHintRequested(true)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-green-950 dark:via-black dark:to-emerald-950 pb-28">
      {/* Header */}
      <div className="glass-strong border-b border-white/20 dark:border-white/10 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/home')}
              className="p-2.5 rounded-2xl hover:bg-green-50/50 dark:hover:bg-green-950/30 transition-all active:scale-95 border border-transparent hover:border-green-200/50 dark:hover:border-green-500/30"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                <Target className="w-7 h-7 text-green-600" />
                Practice Mode
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-bold mt-0.5">
                Adaptive challenge - struggle productively, think deeply
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-black text-green-600 dark:text-green-400">
                  {formatTime(timeSpent)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Time Spent</div>
              </div>
              {cognitiveContext && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-bold text-green-700 dark:text-green-300">
                    {attempts.length} attempts
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading && !currentProblem ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
              crafting your solution
            </h3>
            <p className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
              gathering the best insights for you...
            </p>
            鼓          </div>
        ) : currentProblem ? (
          <div className="space-y-6">
            {/* Problem Card */}
            <Card className="p-8 border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                    Practice Problem
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-lg font-bold text-green-700 dark:text-green-300">
                      {currentProblem.domain}
                    </span>
                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg font-bold text-yellow-700 dark:text-yellow-300">
                      {currentProblem.difficulty}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-lg font-medium text-gray-900 dark:text-white leading-relaxed mb-6">
                {currentProblem.question}
              </div>

              {/* Hint Section */}
              {showHint && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-2xl mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300">Hint</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {currentProblem.hint}
                  </p>
                </div>
              )}
            </Card>

            {/* Response Section */}
            <Card className="p-6">
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">
                Your Solution Approach
              </h3>

              {/* Thinking Requirements */}
              {cognitiveContext && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-2xl border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-bold text-green-700 dark:text-green-300">Thinking Requirements:</span>
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 space-y-1">
                    <div>• Explain your step-by-step reasoning</div>
                    <div>• Show your problem-solving strategy</div>
                    <div>• Identify the approach you're taking</div>
                    <div>• State your confidence in your solution</div>
                  </div>
                </div>
              )}

              {/* Confidence Slider */}
              <div className="mb-4 p-3 bg-white/50 dark:bg-background/30 rounded-2xl border border-white/20 dark:border-white/10">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Confidence:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={userConfidence}
                    onChange={(e) => setUserConfidence(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-bold text-green-600 dark:text-green-400 w-12 text-right">
                    {userConfidence}%
                  </span>
                </div>
              </div>

              {/* Text Input */}
              <textarea
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder="Explain your solution approach step by step. Show your thinking process..."
                className="w-full px-4 py-3 rounded-2xl border-2 border-green-200/50 dark:border-green-500/30 focus:border-green-500 dark:focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:focus:ring-green-400/20 text-base glass shadow-premium transition-all resize-none"
                rows={6}
                disabled={loading}
                minLength={50}
              />

              {/* Action Buttons */}
              <div className="flex gap-4 mt-4">
                <Button
                  onClick={handleHintRequest}
                  variant="outline"
                  disabled={loading || hintRequested}
                  className="flex-1"
                >
                  {hintRequested ? 'Hint Used' : 'Request Hint'}
                </Button>
                <Button
                  onClick={handleSubmitAttempt}
                  disabled={loading || !userResponse.trim() || userResponse.length < 50}
                  glow
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Submit Approach'
                  )}
                </Button>
              </div>
            </Card>

            {/* Attempts History */}
            {attempts.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">
                  Your Thinking History
                </h3>
                <div className="space-y-3">
                  {attempts.map((attempt, index) => (
                    <div key={attempt.id} className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                          Attempt {index + 1}
                        </span>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Confidence: {attempt.confidence}%</span>
                          <span>Time: {formatTime(attempt.timeSpent)}</span>
                          {attempt.hintsUsed > 0 && <span>Hint used</span>}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                        {attempt.response}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        ) : null}
      </div>

      <BottomNavigation />
    </div>
  )
}
