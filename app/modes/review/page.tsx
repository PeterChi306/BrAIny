'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { CognitiveProfileEngine } from '@/lib/cognitive/engine'
import { CognitiveAIOrchestrator } from '@/lib/cognitive/orchestrator'
import { AnswerRefusalSystem } from '@/lib/cognitive/friction'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FileUpload } from '@/components/ui/FileUpload'
import { ArrowLeft, Send, Loader2, TrendingUp, Target, Brain, Eye, AlertTriangle, CheckCircle } from 'lucide-react'
import { BottomNavigation } from '@/components/BottomNavigation'
import type { UploadedFile } from '@/types/modes'
import type { CognitivePromptContext, ThinkingGate } from '@/types/cognitive'

interface CognitivePattern {
  id: string
  type: 'strength' | 'weakness' | 'misconception' | 'strategy'
  description: string
  frequency: number
  domains: string[]
  examples: string[]
}

interface ReviewInsight {
  id: string
  category: 'pattern_recognition' | 'weakness_analysis' | 'strength_development' | 'transfer_opportunities'
  title: string
  description: string
  actionItems: string[]
  cognitiveImpact: 'high' | 'medium' | 'low'
}

interface UserAnalysis {
  id: string
  response: string
  confidence: number
  timestamp: Date
  insights: ReviewInsight[]
}

export default function ReviewModePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseClient()
  const cognitiveEngine = CognitiveProfileEngine.getInstance()
  const aiOrchestrator = CognitiveAIOrchestrator.getInstance()
  const refusalSystem = AnswerRefusalSystem.getInstance()

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [input, setInput] = useState(searchParams.get('text') || '')
  const [loading, setLoading] = useState(false)
  const [cognitiveContext, setCognitiveContext] = useState<CognitivePromptContext | null>(null)
  const [cognitivePatterns, setCognitivePatterns] = useState<CognitivePattern[]>([])
  const [reviewInsights, setReviewInsights] = useState<ReviewInsight[]>([])
  const [userAnalysis, setUserAnalysis] = useState<UserAnalysis | null>(null)
  const [userResponse, setUserResponse] = useState('')
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [analysisStep, setAnalysisStep] = useState<'patterns' | 'self_analysis' | 'action_plan'>('patterns')

  useEffect(() => {
    initializeReviewSession()
  }, [])

  const initializeReviewSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth/login')
      return
    }

    const context = await cognitiveEngine.createCognitiveContext(
      session.user.id,
      'review',
      searchParams.get('domain') || 'general',
      ''
    )
    setCognitiveContext(context)
    
    // Auto-generate review if content is provided
    if (searchParams.get('text') || searchParams.get('topic')) {
      await generateCognitiveReview(context)
    }
  }

  const generateCognitiveReview = async (context: CognitivePromptContext) => {
    setLoading(true)

    try {
      // Prepare content from files or input
      let content = input
      if (uploadedFiles.length > 0) {
        const fileContents = uploadedFiles
          .map(file => file.content)
          .filter(Boolean)
          .join('\n\n')
        content = fileContents || input
      }

      const reviewPrompt = `Analyze this user's cognitive patterns and learning history to provide deep insights.

USER COGNITIVE PROFILE:
- Reasoning Depth: ${context.thinkingFingerprint.reasoningDepth.averageDepth}/5
- Hint Dependency: ${(context.thinkingFingerprint.hintDependency.hintRequestFrequency * 100).toFixed(0)}%
- Confidence-Accuracy Mismatch: ${calculateAverageMismatch(context.thinkingFingerprint)}%
- Recent Weaknesses: ${context.thinkingFingerprint.cognitiveWeaknesses.map(w => w.type).join(', ')}

CONTENT TO REVIEW: ${content}

Generate insights that:
1. Identify cognitive patterns across domains
2. Analyze recurring misconceptions or strengths
3. Reveal transfer opportunities between subjects
4. Highlight specific cognitive weaknesses to address
5. Suggest metacognitive strategies for improvement

Focus on thinking patterns, not content knowledge. Help the user understand HOW they think, not just WHAT they know.`

      const response = await aiOrchestrator.orchestrateResponse(reviewPrompt, context)
      
      // Parse the response to extract patterns and insights
      await parseCognitiveInsights(response, context)

    } catch (error) {
      console.error('Error generating cognitive review:', error)
      // Fallback insights
      setReviewInsights([
        {
          id: 'fallback1',
          category: 'pattern_recognition',
          title: 'Pattern Recognition',
          description: 'Your thinking shows consistent patterns across different problem types.',
          actionItems: ['Continue monitoring your approach to new problems', 'Note when patterns help vs hinder'],
          cognitiveImpact: 'medium'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const parseCognitiveInsights = async (response: string, context: CognitivePromptContext) => {
    // Generate cognitive patterns from the user's thinking fingerprint
    const patterns: CognitivePattern[] = []
    
    // Add weakness patterns
    context.thinkingFingerprint.cognitiveWeaknesses.forEach(weakness => {
      patterns.push({
        id: Math.random().toString(36).substr(2, 9),
        type: 'weakness',
        description: `Tendency to ${weakness.type.replace('_', ' ')}`,
        frequency: weakness.severity / 100,
        domains: weakness.domains,
        examples: [`This appears in ${weakness.domains.join(' and ')}`]
      })
    })

    // Add strength patterns
    context.thinkingFingerprint.cognitiveStrengths.forEach(strength => {
      patterns.push({
        id: Math.random().toString(36).substr(2, 9),
        type: 'strength',
        description: `Strong ${strength.type.replace('_', ' ')} ability`,
        frequency: strength.strength / 100,
        domains: strength.domains,
        examples: [`Demonstrated in ${strength.domains.join(' and ')}`]
      })
    })

    setCognitivePatterns(patterns)

    // Generate review insights
    const insights: ReviewInsight[] = [
      {
        id: 'insight1',
        category: 'weakness_analysis',
        title: 'Cognitive Weakness Analysis',
        description: 'Your thinking patterns reveal areas where cognitive friction could improve learning.',
        actionItems: [
          'Practice deliberate thinking before seeking answers',
          'Challenge your assumptions more frequently',
          'Develop metacognitive awareness of your thinking process'
        ],
        cognitiveImpact: 'high'
      },
      {
        id: 'insight2',
        category: 'strength_development',
        title: 'Leverage Your Strengths',
        description: 'You show strong patterns in certain cognitive approaches that can be applied more broadly.',
        actionItems: [
          'Apply successful thinking strategies to new domains',
          'Teach others using your strong approaches',
          'Reflect on what makes your effective thinking work'
        ],
        cognitiveImpact: 'medium'
      }
    ]

    setReviewInsights(insights)
  }

  const handleSelfAnalysis = async () => {
    if (!userResponse.trim() || !cognitiveContext) return

    // Apply thinking gates
    const gateCheck = await refusalSystem.checkThinkingGates(userResponse, cognitiveContext)
    
    if (!gateCheck.passed) {
      const frictionLevel = refusalSystem.calculateFrictionLevel(cognitiveContext.thinkingFingerprint)
      const refusalResponse = refusalSystem.generateRefusalResponse(gateCheck.failedGates, frictionLevel)
      
      alert(refusalResponse)
      return
    }

    const analysis: UserAnalysis = {
      id: Math.random().toString(36).substr(2, 9),
      response: userResponse,
      confidence: 75, // Would be from UI
      timestamp: new Date(),
      insights: reviewInsights
    }

    setUserAnalysis(analysis)
    setAnalysisStep('action_plan')

    // Update cognitive profile
    await cognitiveEngine.updateFromInteraction(
      cognitiveContext.userId,
      {
        problemId: 'self_analysis',
        response: userResponse,
        confidence: 75,
        timeToResponse: 120,
        hintsUsed: 0,
        correctness: 0.8,
        reasoningDepth: gateCheck.passed ? 4 : 2,
        timestamp: new Date().toISOString()
      },
      'metacognition'
    )
  }

  const calculateAverageMismatch = (fingerprint: any): number => {
    if (!fingerprint.confidenceAccuracyMismatch || fingerprint.confidenceAccuracyMismatch.length === 0) return 0
    const total = fingerprint.confidenceAccuracyMismatch.reduce((sum: number, m: any) => sum + m.mismatchScore, 0)
    return Math.round(total / fingerprint.confidenceAccuracyMismatch.length)
  }

  const getInsightIcon = (category: string) => {
    switch (category) {
      case 'weakness_analysis':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'strength_development':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'pattern_recognition':
        return <Eye className="w-5 h-5 text-blue-500" />
      case 'transfer_opportunities':
        return <TrendingUp className="w-5 h-5 text-purple-500" />
      default:
        return <Brain className="w-5 h-5 text-gray-500" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-950 dark:via-black dark:to-indigo-950 pb-28">
      {/* Header */}
      <div className="glass-strong border-b border-white/20 dark:border-white/10 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/home')}
              className="p-2.5 rounded-2xl hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all active:scale-95 border border-transparent hover:border-blue-200/50 dark:hover:border-blue-500/30"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="w-7 h-7 text-blue-600" />
                Review Mode
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-bold mt-0.5">
                Pattern recognition - identify your cognitive patterns and transfer opportunities
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* File Upload/Input Section */}
        {!showAnalysis && (
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">
              Analyze Your Thinking Patterns
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Upload your work or describe what you'd like to review. I'll identify patterns in your thinking across different domains.
              </p>
            </div>

            {uploadedFiles.length === 0 && (
              <FileUpload
                onFilesChange={setUploadedFiles}
                maxFiles={5}
              />
            )}

            <div className="mt-4">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe what you'd like to review, or paste your work for pattern analysis..."
                className="w-full px-4 py-3 rounded-2xl border-2 border-blue-200/50 dark:border-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-base glass shadow-premium transition-all resize-none"
                rows={4}
              />
            </div>

            <Button
              onClick={() => {
                setShowAnalysis(true)
                generateCognitiveReview(cognitiveContext!)
              }}
              disabled={loading || (!input.trim() && uploadedFiles.length === 0)}
              glow
              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Analyze My Patterns'
              )}
            </Button>
          </Card>
        )}

        {/* Analysis Results */}
        {showAnalysis && (
          <div className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {['patterns', 'self_analysis', 'action_plan'].map((step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    analysisStep === step 
                      ? 'bg-blue-600 text-white' 
                      : index < ['patterns', 'self_analysis', 'action_plan'].indexOf(analysisStep)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {index < ['patterns', 'self_analysis', 'action_plan'].indexOf(analysisStep) ? '✓' : index + 1}
                  </div>
                  {index < 2 && <div className="w-8 h-1 bg-gray-200 dark:bg-gray-700" />}
                </div>
              ))}
            </div>

            {/* Step 1: Pattern Recognition */}
            {analysisStep === 'patterns' && (
              <Card className="p-6">
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Eye className="w-6 h-6 text-blue-600" />
                  Your Cognitive Patterns
                </h3>
                
                <div className="space-y-4">
                  {cognitivePatterns.map((pattern) => (
                    <div key={pattern.id} className={`p-4 rounded-2xl border-2 ${
                      pattern.type === 'strength' 
                        ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                        : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          pattern.type === 'strength' ? 'bg-green-600' : 'bg-red-600'
                        }`}>
                          {pattern.type === 'strength' ? <CheckCircle className="w-4 h-4 text-white" /> : <AlertTriangle className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                            {pattern.description}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Appears in: {pattern.domains.join(', ')}
                          </p>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Frequency: {Math.round(pattern.frequency * 100)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => setAnalysisStep('self_analysis')}
                  className="w-full mt-6"
                >
                  Continue to Self-Analysis
                </Button>
              </Card>
            )}

            {/* Step 2: Self-Analysis */}
            {analysisStep === 'self_analysis' && (
              <Card className="p-6">
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Brain className="w-6 h-6 text-blue-600" />
                  Self-Analysis
                </h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Review the patterns above. What do you recognize about your own thinking? How do these patterns show up in your learning?
                  </p>
                </div>

                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800">
                  <div className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-2">
                    Reflection Questions:
                  </div>
                  <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                    <li>• Which patterns surprise you the most?</li>
                    <li>• When do these patterns help versus hinder your learning?</li>
                    <li>• What would you like to change about your thinking patterns?</li>
                    <li>• How can you leverage your strengths more effectively?</li>
                  </ul>
                </div>

                <textarea
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  placeholder="Analyze your own thinking patterns. Be honest about what you observe..."
                  className="w-full px-4 py-3 rounded-2xl border-2 border-blue-200/50 dark:border-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-base glass shadow-premium transition-all resize-none"
                  rows={6}
                  minLength={100}
                />

                <Button
                  onClick={handleSelfAnalysis}
                  disabled={!userResponse.trim() || userResponse.length < 100}
                  glow
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  Submit Self-Analysis
                </Button>
              </Card>
            )}

            {/* Step 3: Action Plan */}
            {analysisStep === 'action_plan' && (
              <Card className="p-6">
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Target className="w-6 h-6 text-blue-600" />
                  Your Cognitive Action Plan
                </h3>
                
                <div className="space-y-4">
                  {reviewInsights.map((insight) => (
                    <div key={insight.id} className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getInsightIcon(insight.category)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-bold text-gray-900 dark:text-white">
                              {insight.title}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getImpactColor(insight.cognitiveImpact)}`}>
                              {insight.cognitiveImpact} impact
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {insight.description}
                          </p>
                          <div className="space-y-1">
                            <div className="text-sm font-bold text-gray-700 dark:text-gray-300">Action Items:</div>
                            {insight.actionItems.map((item, index) => (
                              <div key={index} className="text-sm text-gray-600 dark:text-gray-400 pl-4">
                                • {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {userAnalysis && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800">
                    <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2">Your Self-Analysis:</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {userAnalysis.response}
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => router.push('/home')}
                  className="w-full mt-6"
                >
                  Return to Home
                </Button>
              </Card>
            )}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}
