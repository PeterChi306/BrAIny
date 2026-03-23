'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'
import { EditableMessage } from '@/components/ui/EditableMessage'
import { Plus, Send, X, Loader2, MessageCircle, HelpCircle, Menu, ChevronLeft, ChevronRight, Edit3, Copy, ArrowLeft, Lightbulb, ZoomIn, RefreshCw, ThumbsUp, ThumbsDown, Image as ImageIcon, FileText, File } from 'lucide-react'
import { BottomNavigation } from '@/components/BottomNavigation'
import { Profile, TutorMode, Message as DatabaseMessage } from '@/types/database'
import { checkUsageLimit, getSubscriptionLimits } from '@/lib/subscription'
import { personalizationService } from '@/lib/personalization'
import type { UploadedFile } from '@/types/modes'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  files?: UploadedFile[]
}

// Define ActionButton interface inline to avoid import issues
interface ActionButton {
  id: string
  label: string
  action: 'practice' | 'quiz' | 'flashcards' | 'explain_simple' | 'real_world_example'
  data?: any
}

export default function ExplainModePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState(searchParams.get('text') || '')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  const [dailyUsage, setDailyUsage] = useState(0)
  const [chats, setChats] = useState<any[]>([])
  const [showSidebar, setShowSidebar] = useState(false)
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'master'>('free')

  const handleFilesChange = (files: UploadedFile[]) => {
    setUploadedFiles(files)
  }

  // Inline parseActionButtons function to avoid module loading issues
  const parseActionButtonsInline = (responseText: string): {
    text: string
    buttons: ActionButton[]
  } => {
    const actionButtonRegex = /\[ActionButtons\]\s*\n((?:-\s*.+\n?)+)/i
    const match = responseText.match(actionButtonRegex)

    if (!match) {
      return { text: responseText, buttons: [] }
    }

    const text = responseText.replace(actionButtonRegex, '').trim()

    const buttonLabels = match[1]
      .split('\n')
      .map(line => line.trim().replace(/^-\s*/, ''))
      .filter(label => label.length > 0)

    const buttons: ActionButton[] = buttonLabels.map((label, index) => {
      const normalizedLabel = label.toLowerCase().trim()

      if (normalizedLabel.includes('practice')) {
        return { id: `btn_${index}`, label, action: 'practice' }
      } else if (normalizedLabel.includes('quiz')) {
        return { id: `btn_${index}`, label, action: 'quiz' }
      } else if (normalizedLabel.includes('flashcard')) {
        return { id: `btn_${index}`, label, action: 'flashcards' }
      } else if (normalizedLabel.includes('explain') || normalizedLabel.includes('simpler')) {
        return { id: `btn_${index}`, label, action: 'explain_simple' }
      } else if (normalizedLabel.includes('real-world') || normalizedLabel.includes('example')) {
        return { id: `btn_${index}`, label, action: 'real_world_example' }
      } else {
        return { id: `btn_${index}`, label, action: 'practice' }
      }
    })

    return { text, buttons }
  }

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

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

      // Load today's usage
      const today = new Date().toISOString().split('T')[0]
      const { data: usageData } = await supabase
        .from('daily_usage')
        .select('ai_messages_count')
        .eq('user_id', session.user.id)
        .eq('date', today)
        .maybeSingle()

      if (usageData) {
        setDailyUsage(usageData.ai_messages_count)
      }

      // Load all tutor chats for this user
      const { data: chatsData } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('mode', 'explain')
        .order('updated_at', { ascending: false })

      if (chatsData) {
        setChats(chatsData)

        // Load the most recent chat or first chat
        const currentChat = chatsData[0]
        if (currentChat) {
          setChatId(currentChat.id)
          // Load messages
          const { data: messagesData } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', currentChat.id)
            .order('created_at', { ascending: true })

          if (messagesData) {
            setMessages(messagesData)
          }
        }
      }
    }

    loadData()
  }, [router, supabase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Auto-send initial message if text is provided in URL
    if (searchParams.get('text') && messages.length === 0) {
      handleSend()
    }
  }, [searchParams])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const limits = getSubscriptionLimits(subscriptionTier)
    if (!limits.hasUnlimitedUsage && dailyUsage >= limits.dailyAiMessages) {
      alert(
        `You've reached your daily limit of ${limits.dailyAiMessages} AI messages. Upgrade to continue.`
      )
      return
    }

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

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

      // Update chat title if it's the first message
      if (messages.length === 0) {
        const title = userMessage.substring(0, 50)
        await supabase
          .from('chats')
          .update({ title, updated_at: new Date().toISOString() })
          .eq('id', currentChatId)

        // Refresh chats list
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { data: chatsData } = await supabase
            .from('chats')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('mode', 'explain')
            .order('updated_at', { ascending: false })
          if (chatsData) setChats(chatsData)
        }
      }

      // Get AI response
      let messageContent = userMessage
      if (uploadedFiles.length > 0) {
        const fileContents = uploadedFiles
          .map(file => file.content)
          .filter(Boolean)
          .join('\n\n')
        messageContent = fileContents || userMessage
      }

      // Load personalization and generate personalized prompt
      try {
        await personalizationService.loadProfile()
        const personalizedPrompt = personalizationService.generatePersonalizedPrompt(messageContent)

        const response = await fetch('/api/modes/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageContent,
            conversationHistory: messages.map((m) => ({
              role: m.role,
              parts: m.content,
            })),
            files: uploadedFiles.map(f => ({
              name: f.name,
              type: f.type,
              content: f.content
            })),
            personalization: personalizedPrompt
          }),
        })

        const chatResult = await response.json()
        if (!response.ok) {
          throw new Error(chatResult?.error || 'Failed to get AI response')
        }

        const { response: aiResponse } = chatResult

        // Save AI message
        const { data: aiMsg, error: aiMsgError } = await supabase
          .from('messages')
          .insert({
            chat_id: currentChatId,
            role: 'assistant',
            content: aiResponse,
          })
          .select()
          .single()

        if (aiMsgError) throw aiMsgError
        setMessages((prev) => [...prev, aiMsg])

        // Update chat updated_at
        await supabase
          .from('chats')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', currentChatId)

        // Update usage
        const today = new Date().toISOString().split('T')[0]
        await supabase
          .from('daily_usage')
          .upsert(
            {
              user_id: session.user.id,
              date: today,
              ai_messages_count: dailyUsage + 1,
            },
            { onConflict: 'user_id,date' }
          )

        setDailyUsage((prev) => prev + 1)
        setUploadedFiles([]) // Clear uploaded files after sending
      } catch (personalizationError: any) {
        console.error('Personalization error:', personalizationError)
        // Fallback to non-personalized request
        const response = await fetch('/api/modes/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageContent,
            conversationHistory: messages.map((m) => ({
              role: m.role,
              parts: m.content,
            })),
            files: uploadedFiles.map(f => ({
              name: f.name,
              type: f.type,
              content: f.content
            }))
          }),
        })

        const chatResult = await response.json()
        if (!response.ok) {
          throw new Error(chatResult?.error || 'Failed to get AI response')
        }

        const { response: aiResponse } = chatResult

        // Save AI message
        const { data: aiMsg, error: aiMsgError } = await supabase
          .from('messages')
          .insert({
            chat_id: currentChatId,
            role: 'assistant',
            content: aiResponse,
          })
          .select()
          .single()

        if (aiMsgError) throw aiMsgError
        setMessages((prev) => [...prev, aiMsg])

        // Update chat updated_at
        await supabase
          .from('chats')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', currentChatId)

        // Update usage
        const today = new Date().toISOString().split('T')[0]
        await supabase
          .from('daily_usage')
          .upsert(
            {
              user_id: session.user.id,
              date: today,
              ai_messages_count: dailyUsage + 1,
            },
            { onConflict: 'user_id,date' }
          )

        setDailyUsage((prev) => prev + 1)
        setUploadedFiles([]) // Clear uploaded files after sending
      }
    } catch (error: any) {
      console.error('Chat error:', error)
      alert(error.message || 'Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ content: newContent })
        .eq('id', messageId)

      if (error) throw error

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, content: newContent } : m
        )
      )
    } catch (error: any) {
      console.error('Error editing message:', error)
      alert('Failed to edit message')
    }
  }

  const handleNewChat = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: newChat, error } = await supabase
        .from('chats')
        .insert({
          user_id: session.user.id,
          mode: 'explain',
          subject: null,
          title: 'New Tutor Session',
        })
        .select()
        .single()

      if (error) throw error

      setChatId(newChat.id)
      setMessages([])
      setChats((prev) => [newChat, ...prev])
      setShowSidebar(false)
    } catch (error: any) {
      console.error('Error creating new chat:', error)
      alert('Failed to create new chat')
    }
  }

  const handleSelectChat = async (selectedChatId: string) => {
    if (selectedChatId === chatId) {
      setShowSidebar(false)
      return
    }

    setChatId(selectedChatId)
    setMessages([])
    setLoading(true)

    try {
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', selectedChatId)
        .order('created_at', { ascending: true })

      if (messagesData) {
        setMessages(messagesData)
      }
      setShowSidebar(false)
    } catch (error: any) {
      console.error('Error loading chat:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteChat = async (chatIdToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this chat session?')) return

    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatIdToDelete)

      if (error) throw error

      setChats((prev) => prev.filter((c) => c.id !== chatIdToDelete))
      if (chatIdToDelete === chatId) {
        setChatId(null)
        setMessages([])
      }
    } catch (error: any) {
      console.error('Error deleting chat:', error)
      alert('Failed to delete chat')
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles: UploadedFile[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const content = await readFileContent(file)
      newFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        content,
        url: '' // Add empty url for now
      })
    }

    setUploadedFiles(prev => [...prev, ...newFiles])
  }

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      if (file.type.startsWith('image/')) {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      } else if (file.type.startsWith('text/') || file.type.includes('document')) {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsText(file)
      } else {
        resolve(`File: ${file.name} (${file.type})`)
      }
    })
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />
    if (type === 'application/pdf') return <FileText className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    // You could add a toast notification here
  }

  // ActionButton component
  function ActionButtonComponent({ button, messageContent, onAction }: {
    button: ActionButton
    messageContent: string
    onAction: (action: string, data: any, messageContent: string) => Promise<void>
  }) {
    return (
      <Button
        onClick={() => onAction(button.action, button.data, messageContent)}
        variant="outline"
        size="sm"
        className="text-xs h-8"
      >
        {button.label}
      </Button>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Header - Compact */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors md:hidden"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => router.push('/home')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden md:block"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-primary dark:text-inverse">AI Tutor</h1>
            <p className="text-xs text-secondary dark:text-inverse-secondary">
              Personalized learning support
            </p>
          </div>
          <Button
            onClick={handleNewChat}
            variant="ghost"
            size="sm"
            className="p-2 h-8"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Sidebar - Chat Sessions */}
      {showSidebar && (
        <>
          <div className="fixed inset-0 bg-background/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setShowSidebar(false)}></div>
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl z-50 md:relative md:z-auto md:shadow-none">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-primary dark:text-inverse">Tutor Sessions</h2>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
                <Button
                  onClick={handleNewChat}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Session
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <div className="space-y-2">
                  {chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => handleSelectChat(chat.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all group ${chat.id === chatId
                        ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-primary dark:text-inverse truncate">
                            {chat.title || 'New Session'}
                          </p>
                          <p className="text-xs text-secondary dark:text-inverse-secondary mt-1">
                            {new Date(chat.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </button>
                  ))}
                  {chats.length === 0 && (
                    <div className="text-center py-8 text-secondary dark:text-inverse-secondary">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm font-medium">No sessions yet</p>
                      <p className="text-xs mt-1">Start a new session to get started</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Messages - Clean ChatGPT-style */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 pb-32">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 px-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-2">
                Ask or learn something new
              </h3>
              <p className="text-secondary dark:text-inverse-secondary text-sm text-center">
                I'll explain concepts in a way that makes sense to you
              </p>
            </div>
          ) : (
            <div className="py-4">
              {messages.map((message, index) => {
                const { text, buttons } = (() => {
                  try {
                    return parseActionButtonsInline(message.content)
                  } catch (error) {
                    console.error('parseActionButtons error:', error)
                    return { text: message.content, buttons: [] }
                  }
                })()

                return (
                  <div
                    key={message.id}
                    className={`px-4 py-6 ${message.role === 'user' ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-950'
                      }`}
                    onMouseEnter={() => setHoveredMessage(message.id)}
                    onMouseLeave={() => setHoveredMessage(null)}
                  >
                    <div className="max-w-3xl mx-auto">
                      <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}>
                        <div
                          className={`bg-blue-600 text-white rounded-2xl px-4 py-3 shadow-lg ${message.role === 'assistant'
                            ? 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-primary dark:text-inverse shadow-card'
                            : ''
                            }`}
                        >
                          {/* Message actions */}
                          {hoveredMessage === message.id && (
                            <div className="absolute -top-8 right-0 flex gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1">
                              {message.role === 'user' && (
                                <button
                                  onClick={() => {
                                    // Implement edit functionality
                                  }}
                                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                                  title="Edit"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                onClick={() => copyMessage(text)}
                                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                                title="Copy"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          {message.role === 'user' ? (
                            <EditableMessage
                              content={text}
                              onSave={(newContent) => handleEditMessage(message.id, newContent)}
                              isOwnMessage={true}
                            />
                          ) : (
                            <MarkdownRenderer
                              content={text}
                              className="text-sm leading-relaxed"
                            />
                          )}

                          {/* AI Response Interaction Buttons */}
                          {message.role === 'assistant' && (
                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                              <div className="flex flex-wrap gap-2">
                                <button className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium">
                                  <Lightbulb className="w-4 h-4" />
                                  Explain Simpler
                                </button>
                                <button className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-sm font-medium">
                                  <ZoomIn className="w-4 h-4" />
                                  Add More Detail
                                </button>
                                <button className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-sm font-medium">
                                  <RefreshCw className="w-4 h-4" />
                                  Regenerate
                                </button>
                                <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
                                  <ThumbsUp className="w-4 h-4" />
                                </button>
                                <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
                                  <ThumbsDown className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}

                          {message.role === 'assistant' && buttons.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                              <div className="flex flex-wrap gap-2">
                                {buttons.map((button, idx) => (
                                  <ActionButtonComponent
                                    key={idx}
                                    button={button}
                                    messageContent={text}
                                    onAction={async () => {
                                      // Handle action button clicks
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              {loading && (
                <div className="px-4 py-6 bg-gray-50 dark:bg-gray-950">
                  <div className="max-w-3xl mx-auto">
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <span className="text-primary dark:text-inverse font-black text-lg">crafting your solution</span>
                            <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">gathering the best insights for you...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area - Bottom Above Navigation */}
      <div className="fixed bottom-[20px] left-0 right-0 p-3 z-40">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            >
              <Plus className="w-5 h-5" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything…"
              className="flex-1 px-6 py-4 border-2 border-blue-200 dark:border-blue-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-400/30 dark:focus:ring-blue-500/40 focus:border-blue-500 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800 shadow-lg shadow-blue-500/10 dark:shadow-blue-400/20 transition-all duration-300"
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* File Chips */}
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
                >
                  {getFileIcon(file.type)}
                  <span className="text-gray-900 dark:text-gray-100 truncate max-w-[150px]">
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Usage + Hint */}
          <div className="flex items-center justify-between mt-3 pt-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {dailyUsage} / {subscriptionTier === 'master' ? '∞' : subscriptionTier === 'pro' ? '100' : '20'} messages today
            </div>
            <button
              onClick={() => {
                // Implement hint functionality
              }}
              disabled={!messages.length || loading}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
            >
              <HelpCircle className="w-3 h-3 mr-1" />
              Hint
            </button>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
