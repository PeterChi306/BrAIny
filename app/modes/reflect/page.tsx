'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { CognitiveProfileEngine } from '@/lib/cognitive/engine'
import { CognitiveAIOrchestrator } from '@/lib/cognitive/orchestrator'
import { AnswerRefusalSystem } from '@/lib/cognitive/friction'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, Send, Loader2, Eye, Brain, Search, Lightbulb, Target } from 'lucide-react'
import { BottomNavigation } from '@/components/BottomNavigation'
import type { CognitivePromptContext, ThinkingGate } from '@/types/cognitive'

interface ReflectionPrompt {
  id: string
  type: 'metacognitive' | 'assumption_analysis' | 'error_examination' | 'strategy_evaluation'
  prompt: string
  followUpQuestions: string[]
}

interface ReflectionResponse {
  id: string
  promptId: string
  response: string
  confidence: number
  depth: number
  timestamp: Date
}

export default function ReflectModePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseClient()
  const cognitiveEngine = CognitiveProfileEngine.getInstance()
  const aiOrchestrator = CognitiveAIOrchestrator.getInstance()
  const refusalSystem = AnswerRefusalSystem.getInstance()

  const [currentPrompt, setCurrentPrompt] = useState<ReflectionPrompt | null>(null)
  const [userResponse, setUserResponse] = useState('')
  const [responses, setResponses] = useState<ReflectionResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [cognitiveContext, setCognitiveContext] = useState<CognitivePromptContext | null>(null)
  const [userConfidence, setUserConfidence] = useState<number>(50)
  const [showInsights, setShowInsights] = useState(false)
  const [cognitiveInsights, setCognitiveInsights] = useState<string>('')

  useEffect(() => {
    initializeReflectionSession()
  }, [])

  const initializeReflectionSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth/login')
      return
    }

    const context = await cognitiveEngine.createCognitiveContext(
      session.user.id,
      'reflect',
      'metacognition',
      ''
    )
    setCognitiveContext(context)

    await generateReflectionPrompt(context)
  }

  const generateReflectionPrompt = async (context: CognitivePromptContext) => {
    setLoading(true)

    try {
      const promptTypes = [
        'metacognitive',
        'assumption_analysis',
        'error_examination',
        'strategy_evaluation'
      ]

      const selectedType = promptTypes[Math.floor(Math.random() * promptTypes.length)]

      const reflectionPrompt = `Generate a deep reflection prompt for cognitive training.

TYPE: ${selectedType}
USER PROFILE: Focus on their reasoning depth (${context.thinkingFingerprint.reasoningDepth.averageDepth}/5) and metacognitive awareness

Create a prompt that:
- Forces examination of thinking processes
- Challenges assumptions about learning
- Encourages identification of cognitive patterns
- Promotes metacognitive awareness
- Requires introspection beyond surface-level

Format as JSON:
{
  "type": "${selectedType}",
  "prompt": "The main reflection question",
  "followUpQuestions": ["question1", "question2", "question3"]
}

Make it challenging but accessible. Focus on "how you think" not "what you think".`

      const response = await aiOrchestrator.orchestrateResponse(reflectionPrompt, context)

      let promptData
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          promptData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in response')
        }
      } catch (parseError) {
        // Fallback prompt
        promptData = {
          type: selectedType,
          prompt: "Think about your most recent learning experience. What assumptions did you make about how you learn? How did those assumptions help or hinder your understanding?",
          followUpQuestions: [
            "What patterns do you notice in your thinking when you're stuck?",
            "How do you know when you truly understand something versus just memorizing it?",
            "What thinking strategies work best for you, and when do they fail?"
          ]
        }
      }

      const newPrompt: ReflectionPrompt = {
        id: Math.random().toString(36).substr(2, 9),
        type: promptData.type,
        prompt: promptData.prompt,
        followUpQuestions: promptData.followUpQuestions
      }

      setCurrentPrompt(newPrompt)
      setUserResponse('')
      setUserConfidence(50)

    } catch (error) {
      console.error('Error generating reflection prompt:', error)
      // Fallback prompt
      setCurrentPrompt({
        id: 'fallback',
        type: 'metacognitive',
        prompt: "Examine your thinking process. When you face a difficult problem, what's your internal monologue? How do you talk to yourself when you're struggling versus when you're succeeding?",
        followUpQuestions: [
          "What emotions influence your thinking most?",
          "How do you decide when to persist versus when to seek help?",
          "What thinking habits serve you well, and which ones hold you back?"
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReflection = async () => {
    if (!userResponse.trim() || !cognitiveContext || !currentPrompt) return

    // Apply thinking gates
    const gateCheck = await refusalSystem.checkThinkingGates(userResponse, cognitiveContext)

    if (!gateCheck.passed) {
      const frictionLevel = refusalSystem.calculateFrictionLevel(cognitiveContext.thinkingFingerprint)
      const refusalResponse = refusalSystem.generateRefusalResponse(gateCheck.failedGates, frictionLevel)

      alert(refusalResponse)
      return
    }

    const reflection: ReflectionResponse = {
      id: Math.random().toString(36).substr(2, 9),
      promptId: currentPrompt.id,
      response: userResponse,
      confidence: userConfidence,
      depth: gateCheck.passed ? 4 : 2,
      timestamp: new Date()
    }

    setResponses(prev => [...prev, reflection])

    // Update cognitive profile
    await cognitiveEngine.updateFromInteraction(
      cognitiveContext.userId,
      {
        problemId: currentPrompt.id,
        response: userResponse,
        confidence: userConfidence,
        timeToResponse: 60, // Reflection takes time
        hintsUsed: 0,
        correctness: 0.8, // Reflection is about insight, not correctness
        reasoningDepth: gateCheck.passed ? 4 : 2,
        timestamp: new Date().toISOString()
      },
      'metacognition'
    )

    // Generate cognitive insights
    await generateCognitiveInsights(reflection)

    // Generate new prompt after a delay
    setTimeout(() => {
      generateReflectionPrompt(cognitiveContext)
    }, 3000)
  }

  const generateCognitiveInsights = async (reflection: ReflectionResponse) => {
    if (!cognitiveContext) return

    setLoading(true)

    try {
      const insightsPrompt = `Analyze this reflection for cognitive patterns and provide metacognitive insights.

REFLECTION TYPE: ${currentPrompt?.type}
USER RESPONSE: ${reflection.response}
CONFIDENCE: ${reflection.confidence}%

Provide insights about:
1. Thinking patterns the user demonstrates
2. Metacognitive awareness level
3. Cognitive strengths and weaknesses revealed
4. Specific recommendations for thinking improvement
5. How their reflection connects to learning effectiveness

Format as a thoughtful, analytical response that helps the user understand their own thinking better.`

      const insights = await aiOrchestrator.orchestrateResponse(insightsPrompt, cognitiveContext)
      setCognitiveInsights(insights)
      setShowInsights(true)

    } catch (error) {
      console.error('Error generating insights:', error)
      setCognitiveInsights('Your reflection shows thoughtful self-examination. Continue exploring your thinking patterns to deepen your metacognitive awareness.')
      setShowInsights(true)
    } finally {
      setLoading(false)
    }
  }

  const getPromptIcon = (type: string) => {
    switch (type) {
      case 'metacognitive':
        return <Brain className="w-6 h-6" />
      case 'assumption_analysis':
        return <Search className="w-6 h-6" />
      case 'error_examination':
        return <Eye className="w-6 h-6" />
      case 'strategy_evaluation':
        return <Target className="w-6 h-6" />
      default:
        return <Lightbulb className="w-6 h-6" />
    }
  }

  const getPromptTitle = (type: string) => {
    switch (type) {
      case 'metacognitive':
        return 'Metacognitive Awareness'
      case 'assumption_analysis':
        return 'Assumption Analysis'
      case 'error_examination':
        return 'Error Pattern Examination'
      case 'strategy_evaluation':
        return 'Strategy Evaluation'
      default:
        return 'Cognitive Reflection'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-purple-950 dark:via-black dark:to-pink-950 pb-28">
      {/* Header */}
      <div className="glass-strong border-b border-white/20 dark:border-white/10 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/home')}
              className="p-2.5 rounded-2xl hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-all active:scale-95 border border-transparent hover:border-purple-200/50 dark:hover:border-purple-500/30"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                <Eye className="w-7 h-7 text-purple-600" />
                Reflect Mode
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-bold mt-0.5">
                Metacognitive awareness - examine your thinking patterns
              </p>
            </div>
            {cognitiveContext && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                  {responses.length} reflections
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading && !currentPrompt ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
              Preparing your reflection...
            </h3>
            <p className="text-gray-600 dark:text-gray-400 font-bold">
              Crafting a prompt to deepen your metacognitive awareness
            </p>
          </div>
        ) : currentPrompt ? (
          <div className="space-y-6">
            {/* Reflection Prompt Card */}
            <Card className="p-8 border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 text-white">
                  {getPromptIcon(currentPrompt.type)}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                    {getPromptTitle(currentPrompt.type)}
                  </h2>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Take your time to think deeply about this question
                  </div>
                </div>
              </div>

              <div className="text-lg font-medium text-gray-900 dark:text-white leading-relaxed mb-6">
                {currentPrompt.prompt}
              </div>

              {/* Follow-up Questions */}
              <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-2xl border border-purple-200 dark:border-purple-800">
                <div className="text-sm font-bold text-purple-700 dark:text-purple-300 mb-2">
                  Additional questions to consider:
                </div>
                <ul className="space-y-1">
                  {currentPrompt.followUpQuestions.map((question, index) => (
                    <li key={index} className="text-sm text-purple-600 dark:text-purple-400">
                      • {question}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* Cognitive Insights */}
            {showInsights && (
              <Card className="p-6 border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">
                    Cognitive Insights
                  </h3>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {cognitiveInsights}
                </div>
              </Card>
            )}

            {/* Response Section */}
            <Card className="p-6">
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">
                Your Reflection
              </h3>

              {/* Thinking Requirements */}
              {cognitiveContext && (
                <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-bold text-purple-700 dark:text-purple-300">Reflection Guidelines:</span>
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 space-y-1">
                    <div>• Be honest about your thinking patterns</div>
                    <div>• Examine your assumptions and beliefs</div>
                    <div>• Consider how you think, not just what you think</div>
                    <div>• Connect your reflection to learning experiences</div>
                  </div>
                </div>
              )}

              {/* Confidence Slider */}
              <div className="mb-4 p-3 bg-white/50 dark:bg-background/30 rounded-2xl border border-white/20 dark:border-white/10">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Confidence in this insight:
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={userConfidence}
                    onChange={(e) => setUserConfidence(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400 w-12 text-right">
                    {userConfidence}%
                  </span>
                </div>
              </div>

              {/* Text Input */}
              <textarea
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder="Reflect deeply on this question. Explore your thinking patterns, assumptions, and metacognitive awareness..."
                className="w-full px-4 py-3 rounded-2xl border-2 border-purple-200/50 dark:border-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 text-base glass shadow-premium transition-all resize-none"
                rows={8}
                disabled={loading}
                minLength={100}
              />

              {/* Action Button */}
              <Button
                onClick={handleSubmitReflection}
                disabled={loading || !userResponse.trim() || userResponse.length < 100}
                glow
                className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Submit Reflection'
                )}
              </Button>
            </Card>

            {/* Reflection History */}
            {responses.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">
                  Your Reflection Journey
                </h3>
                <div className="space-y-3">
                  {responses.map((response, index) => (
                    <div key={response.id} className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                          Reflection {index + 1}
                        </span>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Confidence: {response.confidence}%</span>
                          <span>Depth: {response.depth}/5</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                        {response.response}
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
