'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { CognitiveProfileEngine } from '@/lib/cognitive/engine'
import { CognitiveAIOrchestrator } from '@/lib/cognitive/orchestrator'
import { AnswerRefusalSystem } from '@/lib/cognitive/friction'
import { CognitiveEnforcementLayer } from '@/lib/cognitive/enforcement'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FileUpload } from '@/components/ui/FileUpload'
import { ArrowLeft, Send, Loader2, Brain, Lightbulb, Target, Zap } from 'lucide-react'
import { BottomNavigation } from '@/components/BottomNavigation'
import type { UploadedFile } from '@/types/modes'
import type { CognitivePromptContext, ThinkingGate } from '@/types/cognitive'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  files?: UploadedFile[]
  thinkingGates?: ThinkingGate[]
  frictionLevel?: number
  confidenceLevel?: number
}

export default function LearnModePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseClient()
  const cognitiveEngine = CognitiveProfileEngine.getInstance()
  const aiOrchestrator = CognitiveAIOrchestrator.getInstance()
  const refusalSystem = AnswerRefusalSystem.getInstance()
  const enforcementLayer = CognitiveEnforcementLayer.getInstance()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState(searchParams.get('text') || '')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [cognitiveContext, setCognitiveContext] = useState<CognitivePromptContext | null>(null)
  const [thinkingTimer, setThinkingTimer] = useState<number>(0)
  const [showThinkingPrompt, setShowThinkingPrompt] = useState(false)
  const [requiredThinkingTime, setRequiredThinkingTime] = useState<number>(0)
  const [userConfidence, setUserConfidence] = useState<number>(50)
  const [showConfidenceSlider, setShowConfidenceSlider] = useState(false)

  useEffect(() => {
    initializeCognitiveSession()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (showThinkingPrompt && thinkingTimer > 0) {
      timer = setTimeout(() => setThinkingTimer(thinkingTimer - 1), 1000)
    } else if (thinkingTimer === 0 && showThinkingPrompt) {
      setShowThinkingPrompt(false)
    }
    return () => clearTimeout(timer)
  }, [thinkingTimer, showThinkingPrompt])

  const initializeCognitiveSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth/login')
      return
    }

    const newSessionId = Math.random().toString(36).substr(2, 9)
    setSessionId(newSessionId)

    // Create cognitive context
    const context = await cognitiveEngine.createCognitiveContext(
      session.user.id,
      'learn',
      'general',
      ''
    )
    setCognitiveContext(context)

    // Set UI friction based on cognitive profile
    const frictionLevel = refusalSystem.calculateFrictionLevel(context.thinkingFingerprint)
    setRequiredThinkingTime(frictionLevel.hintDelay)
    setShowConfidenceSlider(frictionLevel.confidenceThreshold > 0)
  }

  const handleSend = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || loading || !cognitiveContext) return

    // Apply friction checks
    const frictionLevel = refusalSystem.calculateFrictionLevel(cognitiveContext.thinkingFingerprint)
    const gateCheck = await refusalSystem.checkThinkingGates(input, cognitiveContext)

    if (!gateCheck.passed) {
      // Show refusal response
      const refusalResponse = refusalSystem.generateRefusalResponse(gateCheck.failedGates, frictionLevel)

      const refusalMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: refusalResponse,
        timestamp: new Date(),
        thinkingGates: gateCheck.failedGates.map((g) => ({
          type: g.type.replace('_gate', '') as ThinkingGate['type'],
          passed: false,
          requirement: g.requirement,
          userResponse: input,
          feedback: g.failureMessage
        })),
        frictionLevel: frictionLevel.level
      }

      setMessages(prev => [...prev, refusalMessage])
      return
    }

    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined,
      confidenceLevel: userConfidence
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Apply productive friction if user is seeking help too quickly
      const userRequestedHelp = input.toLowerCase().includes('help') || input.toLowerCase().includes('hint')
      const friction = await refusalSystem.applyProductiveFriction(cognitiveContext, userRequestedHelp)

      if (friction.shouldDelay) {
        setThinkingTimer(friction.delaySeconds)
        setShowThinkingPrompt(true)

        // Show thinking prompt
        const thinkingMessage: Message = {
          id: Math.random().toString(36).substr(2, 9),
          role: 'assistant',
          content: `⏳ **Thinking Time Required**

${friction.thinkingPrompt}

Take ${friction.delaySeconds} seconds to think before I respond. This deliberate pause helps strengthen your reasoning.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, thinkingMessage])

        // Wait for thinking time
        await new Promise(resolve => setTimeout(resolve, friction.delaySeconds * 1000))
      }

      // Prepare message content with file information
      let messageContent = userMessage.content
      if (userMessage.files && userMessage.files.length > 0) {
        const fileContents = userMessage.files
          .map(file => file.content)
          .filter(Boolean)
          .join('\n\n')
        messageContent = fileContents || userMessage.content
      }

      // Generate AI response through cognitive enforcement layer
      const enforcementResult = await enforcementLayer.enforceCognitiveInteraction(
        messageContent,
        cognitiveContext,
        'learn'
      )

      const assistantMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: enforcementResult.response,
        timestamp: new Date(),
        frictionLevel: frictionLevel.level,
        thinkingGates: enforcementResult.violations.length > 0 ? [{
          type: 'reasoning',
          passed: false,
          requirement: enforcementResult.thinkingRequirements.join(', '),
          userResponse: userMessage.content,
          feedback: enforcementResult.cognitiveCorrection
        }] : undefined
      }

      setMessages(prev => [...prev, assistantMessage])
      setUploadedFiles([])

      // Update cognitive profile based on interaction
      await cognitiveEngine.updateFromInteraction(
        cognitiveContext.userId,
        {
          problemId: Math.random().toString(36).substr(2, 9),
          response: userMessage.content,
          confidence: userConfidence,
          timeToResponse: 30, // Would be calculated from UI timing
          hintsUsed: userRequestedHelp ? 1 : 0,
          correctness: 0.5, // Would be determined by assessment
          reasoningDepth: gateCheck.passed ? 3 : 1,
          timestamp: new Date().toISOString()
        },
        'general'
      )

    } catch (error: any) {
      console.error('Learn mode error:', error)
      alert(error.message || 'Failed to get response. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = (action: string) => {
    const prompts = {
      'explore': "I want to explore this concept step by step. What should I investigate first?",
      'challenge': "Challenge my thinking. What assumptions am I making?",
      'connect': "How does this connect to what I already know?",
      'apply': "How could I apply this in a real situation?"
    }

    if (prompts[action as keyof typeof prompts]) {
      setInput(prompts[action as keyof typeof prompts])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-background dark:to-purple-950 pb-28">
      {/* Header */}
      <div className="glass-strong border-b border-white/20 dark:border-white/10 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/home')}
              className="p-2.5 rounded-2xl hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all active:scale-95 border border-transparent hover:border-indigo-200/50 dark:hover:border-indigo-500/30"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                <Brain className="w-7 h-7 text-indigo-600" />
                Learn Mode
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-bold mt-0.5">
                Guided discovery - thinking first, answers later
              </p>
            </div>
            {cognitiveContext && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                  Friction L{refusalSystem.calculateFrictionLevel(cognitiveContext.thinkingFingerprint).level}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thinking Timer */}
      {showThinkingPrompt && (
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">Thinking Time</h3>
                <p className="text-white/90 text-sm">Take time to deepen your reasoning</p>
              </div>
              <div className="text-3xl font-black">
                {thinkingTimer}s
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto px-6 py-8">
        {messages.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-8 shadow-glow">
              <Brain className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3">
              Thinking comes first
            </h3>
            <p className="text-gray-600 dark:text-gray-400 font-bold text-lg mb-8">
              Explore concepts through guided discovery. I'll help you think, not just give answers.
            </p>

            {/* Cognitive Start Prompts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {[
                { icon: Target, text: "I want to explore a concept step by step", action: "explore" },
                { icon: Lightbulb, text: "Challenge my current understanding", action: "challenge" },
                { icon: Brain, text: "Connect this to what I already know", action: "connect" },
                { icon: Zap, text: "How can I apply this in real life?", action: "apply" }
              ].map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleQuickAction(prompt.action)}
                  className="text-left justify-start h-auto py-4 px-4 group hover:border-indigo-300 dark:hover:border-indigo-600"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/50">
                      <prompt.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="font-medium">{prompt.text}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-3xl px-6 py-5 ${message.role === 'user'
                  ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-glow'
                  : message.thinkingGates && message.thinkingGates.length > 0
                    ? 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-2 border-red-200 dark:border-red-800'
                    : 'glass-strong border border-white/20 dark:border-white/10'
                  }`}>
                  {/* Show confidence level for user messages */}
                  {message.role === 'user' && message.confidenceLevel !== undefined && (
                    <div className="mb-3 flex items-center gap-2 text-sm opacity-90">
                      <span>Confidence:</span>
                      <div className="flex-1 bg-white/20 rounded-full h-2">
                        <div
                          className="bg-white rounded-full h-2"
                          style={{ width: `${message.confidenceLevel}%` }}
                        />
                      </div>
                      <span>{message.confidenceLevel}%</span>
                    </div>
                  )}

                  {/* Show friction level for assistant messages */}
                  {message.role === 'assistant' && message.frictionLevel && (
                    <div className="mb-3 flex items-center gap-2 text-sm opacity-70">
                      <Target className="w-4 h-4" />
                      <span>Cognitive Friction Level {message.frictionLevel}</span>
                    </div>
                  )}

                  {/* Show uploaded files for user messages */}
                  {message.files && message.files.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {message.files.map((file) => (
                        <div key={file.id} className="flex items-center gap-2 text-sm opacity-90">
                          <span>📎</span>
                          <span>{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="whitespace-pre-wrap leading-relaxed font-medium">
                    {message.content}
                  </p>

                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="glass-strong border border-white/20 dark:border-white/10 rounded-3xl px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-gray-900 dark:text-white font-black text-lg">crafting your solution</span>
                      <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">gathering the best insights for you...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="glass-strong border-t border-white/20 dark:border-white/10 sticky bottom-20 z-40">
        <div className="max-w-4xl mx-auto px-6 py-5">
          {/* Cognitive Requirements */}
          {cognitiveContext && (
            <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">Thinking Requirements:</span>
              </div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 space-y-1">
                <div>• Explain your reasoning step-by-step</div>
                <div>• Identify your assumptions</div>
                <div>• State your confidence level</div>
                {showConfidenceSlider && <div>• Minimum 50 characters required</div>}
              </div>
            </div>
          )}

          {/* Confidence Slider */}
          {showConfidenceSlider && (
            <div className="mb-4 p-3 bg-white/50 dark:bg-surface/30 rounded-2xl border border-white/20 dark:border-white/10">
              drum              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Confidence:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={userConfidence}
                  onChange={(e) => setUserConfidence(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 w-12 text-right">
                  {userConfidence}%
                </span>
              </div>
            </div>
          )}

          {/* File Upload */}
          {uploadedFiles.length === 0 && (
            <FileUpload
              onFilesChange={setUploadedFiles}
              maxFiles={3}
            />
          )}

          {/* Text Input */}
          <div className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Explain your thinking step by step..."
              className="flex-1 px-6 py-4 rounded-2xl border-2 border-indigo-200/50 dark:border-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 text-base glass shadow-premium transition-all"
              disabled={loading}
              minLength={showConfidenceSlider ? 50 : undefined}
            />
            <Button
              onClick={handleSend}
              disabled={loading || (!input.trim() && uploadedFiles.length === 0)}
              glow
              className="px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
