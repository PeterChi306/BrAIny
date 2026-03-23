'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Profile, Message } from '@/types/database'
import { checkUsageLimit, getSubscriptionLimits } from '@/lib/subscription'
import { parseActionButtons, type ActionButton } from '@/lib/ai-response-parser'
import {
  ArrowLeft,
  Send,
  Loader2,
  MessageCircle,
  PlayCircle,
  BookOpen,
  Sparkles,
} from 'lucide-react'
import { LoadingScreen } from '@/components/LoadingScreen'

export default function ExplainPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'master'>('free')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  const [tokenUsage, setTokenUsage] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth/login')
        return
      }

      // Load profile
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

      // Load subscription
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (subData) {
        setSubscriptionTier(subData.tier)
      }

      // Load token usage for today
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

      // Load or create chat
      const { data: chatData } = await supabase
        .from('chats')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('mode', 'explain')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (chatData) {
        setChatId(chatData.id)
        // Load messages
        const { data: messagesData } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatData.id)
          .order('created_at', { ascending: true })

        if (messagesData) {
          setMessages(messagesData)
        }
      }
    }

    loadData()
  }, [router, supabase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const limits = getSubscriptionLimits(subscriptionTier)
    if (!limits.hasUnlimitedUsage && tokenUsage >= limits.dailyAiMessages) {
      alert(
        `You've reached your daily limit of ${limits.dailyAiMessages} AI messages. Upgrade to continue.`
      )
      return
    }

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Create chat if needed
      let currentChatId = chatId
      if (!currentChatId) {
        const { data: newChat, error: chatError } = await supabase
          .from('chats')
          .insert({
            user_id: session.user.id,
            mode: 'explain',
            subject: null,
          })
          .select()
          .single()

        if (chatError) throw chatError
        currentChatId = newChat.id
        setChatId(currentChatId)
      }

      // Save user message
      const { data: userMsg, error: msgError } = await supabase
        .from('messages')
        .insert({
          chat_id: currentChatId,
          role: 'user',
          content: userMessage,
        })
        .select()
        .single()

      if (msgError) throw msgError
      setMessages((prev) => [...prev, userMsg])

      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          mode: 'explain',
          subject: null,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            parts: m.content,
          })),
        }),
      })

      const chatResult = await response.json()
      if (!response.ok) {
        throw new Error(chatResult?.error || 'Failed to get AI response')
      }

      const { text } = chatResult

      // Save AI message
      const { data: aiMsg, error: aiMsgError } = await supabase
        .from('messages')
        .insert({
          chat_id: currentChatId,
          role: 'assistant',
          content: text,
        })
        .select()
        .single()

      if (aiMsgError) throw aiMsgError
      setMessages((prev) => [...prev, aiMsg])

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

      setTokenUsage((prev) => prev + 1)
    } catch (error: any) {
      console.error('Chat error:', error)
      alert(error.message || 'Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleActionButton = async (action: string, data: any, messageContent: string) => {
    const messageText = parseActionButtons(messageContent).text

    switch (action) {
      case 'quiz':
        try {
          setLoading(true)
          const response = await fetch('/api/quiz/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topic: messageText.substring(0, 100),
              subject: null,
              difficulty: 'medium',
              numQuestions: 5,
            }),
          })
          const result = await response.json()
          if (result.quiz) {
            router.push(`/quiz/${result.quiz.id}`)
          }
        } catch (err) {
          console.error('Error generating quiz:', err)
          alert('Failed to generate quiz. Please try again.')
        } finally {
          setLoading(false)
        }
        break
      case 'flashcards':
        try {
          setLoading(true)
          const response = await fetch('/api/flashcards/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topic: messageText.substring(0, 100),
              subject: null,
              content: messageText,
              numCards: 5,
            }),
          })
          const result = await response.json()
          if (result.flashcards) {
            router.push('/flashcards')
          }
        } catch (err) {
          console.error('Error generating flashcards:', err)
          alert('Failed to generate flashcards. Please try again.')
        } finally {
          setLoading(false)
        }
        break
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex flex-col">
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
              <h1 className="text-xl font-bold text-gray-900">Explain Mode</h1>
              <p className="text-sm text-gray-600">
                Get clear, step-by-step explanations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ask me anything!
            </h3>
            <p className="text-gray-600">
              I'll explain concepts clearly with examples and step-by-step breakdowns.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const { text, buttons } = parseActionButtons(message.content)
              const isAssistant = message.role === 'assistant'

              return (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                >
                  <Card
                    className={`max-w-[80%] ${message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white'
                      }`}
                  >
                    <p className="whitespace-pre-wrap">{text}</p>
                    {isAssistant && buttons.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                        {buttons.map((button, idx) => (
                          <ActionButtonComponent
                            key={idx}
                            button={button}
                            messageContent={message.content}
                            onAction={handleActionButton}
                          />
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              )
            })}
            {loading && (
              <div className="flex justify-start">
                <LoadingScreen
                  fullScreen={false}
                  message="Thinking..."
                  className="bg-white dark:bg-gray-800 py-4 px-6"
                />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Moved up for better visibility */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask me to explain something..."
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 text-base"
              disabled={loading}
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              glow
              className="px-4"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 text-center">
            {tokenUsage} /{' '}
            {getSubscriptionLimits(subscriptionTier).hasUnlimitedUsage
              ? '∞'
              : getSubscriptionLimits(subscriptionTier).dailyAiMessages}{' '}
            messages today
          </p>
        </div>
      </div>
    </div>
  )
}

// Action Button Component
function ActionButtonComponent({
  button,
  messageContent,
  onAction
}: {
  button: ActionButton
  messageContent: string
  onAction: (action: string, data: any, messageContent: string) => void
}) {
  const getIcon = () => {
    switch (button.action) {
      case 'practice':
        return <PlayCircle className="w-4 h-4" />
      case 'quiz':
        return <BookOpen className="w-4 h-4" />
      case 'flashcards':
        return <Sparkles className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onAction(button.action, button.data, messageContent)}
      className="text-sm hover:scale-105 transition-transform"
    >
      {getIcon()}
      <span className="ml-2">{button.label}</span>
    </Button>
  )
}

