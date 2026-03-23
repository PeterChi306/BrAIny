'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'
import { EditableMessage } from '@/components/ui/EditableMessage'
import { CompactUploadButton } from '@/components/ui/CompactUploadButton'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { StudyGuideDisplay } from '@/components/ui/StudyGuideDisplay'
import { 
  Send, 
  Plus, 
  Menu, 
  X, 
  Trash2, 
  MessageCircle, 
  Loader2,
  ArrowLeft,
  Lightbulb,
  BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  thinkingGates?: string[]
  frictionLevel?: number
}

interface ChatSession {
  id: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
  last_message: string
}

import type { UploadedFile } from '@/types/modes'

interface ActionButton {
  id: string
  label: string
  action: 'practice' | 'quiz' | 'flashcards' | 'explain_simple' | 'real_world_example'
  data?: any
}

export default function EnhancedChatPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // State
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<Omit<UploadedFile, 'url'>[]>([])
  const [showSidebar, setShowSidebar] = useState(false)
  const [dailyUsage, setDailyUsage] = useState(0)
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'master'>('free')
  const [chatTitle, setChatTitle] = useState<string>('AI Tutor')
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [titleGenerated, setTitleGenerated] = useState(false)
  const [userName, setUserName] = useState<string>('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingText, setTypingText] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [showWelcome, setShowWelcome] = useState(true)
  const [showStudyGuide, setShowStudyGuide] = useState(false)
  const [studyGuideContent, setStudyGuideContent] = useState('')

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize session
  useEffect(() => {
    initializeSession()
    loadChatSessions()
    initializeWelcomeMessage()
  }, [])

  const initializeSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth/login')
      return
    }

    // Get user profile for welcome message
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', session.user.id)
      .single()
    
    if (profile?.first_name) {
      setUserName(profile.first_name)
    }

    // Create session ID
    const newSessionId = Math.random().toString(36).substr(2, 9)
    setSessionId(newSessionId)

    // Load subscription and usage
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
  }

  const handleSend = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || loading) return

    // Check usage limits
    const limits = subscriptionTier === 'master' ? 
      { hasUnlimitedUsage: true, dailyAiMessages: Infinity } :
      subscriptionTier === 'pro' ? 
        { hasUnlimitedUsage: false, dailyAiMessages: 100 } :
        { hasUnlimitedUsage: false, dailyAiMessages: 20 }

    if (!limits.hasUnlimitedUsage && dailyUsage >= limits.dailyAiMessages) {
      alert(`You've reached your daily limit of ${limits.dailyAiMessages} AI messages. Upgrade to continue.`)
      return
    }

    // Prepare message content
    let messageContent = input.trim()
    if (uploadedFiles.length > 0) {
      const fileContents = uploadedFiles.map(f => `${f.name}: ${f.content}`).join('\n\n')
      messageContent = `${messageContent}\n\nAttached files:\n${fileContents}`
    }

    // Create user message
    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    }

    // Get current messages for API call BEFORE updating state
    const currentMessages = [...messages, userMessage]
    
    setMessages(currentMessages)
    setInput('')
    // Don't clear uploaded files yet - wait for successful response
    setLoading(true)

    try {
      // Call AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          mode: 'explain',
          subject: null,
          conversationHistory: currentMessages.slice(0, -1).map(m => ({
            role: m.role,
            parts: m.content
          }))
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to get response')

      // Create AI message
      const aiMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: result.text,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
      
      // Clear uploaded files only after successful response
      setUploadedFiles([])
      
      // Generate and save chat title after first AI response
      if (!titleGenerated && messages.length === 2) {
        await generateAndSaveChatTitle(currentMessages)
      } else if (sessionId) {
        // Save both user and AI messages to existing session
        await saveMessage(userMessage, sessionId)
        await saveMessage(aiMessage, sessionId)
        await updateChatSession(sessionId, aiMessage.content)
      }
      
      // Update usage - get session once to avoid multiple calls
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (currentSession) {
        setDailyUsage(prev => prev + 1)
        const today = new Date().toISOString().split('T')[0]
        await supabase
          .from('daily_usage')
          .upsert({
            user_id: currentSession.user.id,
            date: today,
            ai_messages_count: dailyUsage + 1
          }, { onConflict: 'user_id,date' })
      }

    } catch (error: any) {
      console.error('Chat error:', error)
      alert(error.message || 'Failed to send message. Please try again.')
      // Clear uploaded files on error too
      setUploadedFiles([])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const parseActionButtons = (responseText: string): {
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

  const handleActionButton = async (action: string, data: any, messageContent: string) => {
    const { text } = parseActionButtons(messageContent)
    
    switch (action) {
      case 'quiz':
        router.push(`/quiz`)
        break
      case 'flashcards':
        router.push('/flashcards')
        break
      case 'explain_simple':
        setInput(`Explain this more simply: ${text.substring(0, 200)}`)
        break
      case 'real_world_example':
        setInput(`Give me a real-world example of: ${text.substring(0, 200)}`)
        break
    }
  }

  const handleStudyGuide = async () => {
    if (messages.length === 0 || loading) return

    setLoading(true)

    try {
      // Get user profile for context
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, interests, learning_style, grade_level, hobbies, preferred_tone, learning_pace, favorite_topics')
        .eq('id', session.user.id)
        .single()

      // Call Study Guide API
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '', // Empty message for study guide mode
          mode: 'study-guide',
          chatId: sessionId,
          isStudyGuideRequest: true,
          displayName: profile?.display_name,
          interests: profile?.interests || [],
          profile: profile
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to generate study guide')

      // Show study guide modal instead of adding message
      setStudyGuideContent(result.response)
      setShowStudyGuide(true)
      
    } catch (error: any) {
      console.error('Study Guide error:', error)
      alert(error.message || 'Failed to generate study guide. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleHint = async () => {
    if (!messages.length || loading) return

    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === 'user')?.content

    if (!lastUserMessage) return

    setLoading(true)

    try {
      const response = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: lastUserMessage,
          mode: 'explain',
          subject: null,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to get hint')

      const hintMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: `💡 Hint: ${result.text}`,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, hintMessage])
    } catch (error: any) {
      console.error('Hint error:', error)
      alert(error.message || 'Failed to get hint. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadChatSessions = async () => {
    try {
      const response = await fetch('/api/chat-sessions')
      if (response.ok) {
        const { sessions } = await response.json()
        setChatSessions(sessions)
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error)
    }
  }

  const loadChatSession = async (sessionIdToLoad: string) => {
    try {
      // Load session messages
      const messagesResponse = await fetch(`/api/chat-messages?sessionId=${sessionIdToLoad}`)
      if (messagesResponse.ok) {
        const { messages } = await messagesResponse.json()
        
        // Convert messages to the expected format
        const formattedMessages: Message[] = messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at)
        }))
        
        setMessages(formattedMessages)
        setSessionId(sessionIdToLoad)
        setShowWelcome(false)
        
        // Find and set the session title
        const session = chatSessions.find(s => s.id === sessionIdToLoad)
        if (session) {
          setChatTitle(session.title)
          setTitleGenerated(true)
        }
      }
    } catch (error) {
      console.error('Error loading chat session:', error)
    }
  }

  const saveMessage = async (message: Message, sessionIdToUse: string) => {
    try {
      await fetch('/api/chat-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdToUse,
          role: message.role,
          content: message.content
        })
      })
    } catch (error) {
      console.error('Error saving message:', error)
    }
  }

  const generateAndSaveChatTitle = async (currentMessages: Message[]) => {
    try {
      // Generate title using AI
      const titleResponse = await fetch('/api/chat-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages
        })
      })

      if (titleResponse.ok) {
        const { title } = await titleResponse.json()
        setChatTitle(title)
        setTitleGenerated(true)

        // Create chat session with title
        const sessionResponse = await fetch('/api/chat-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title,
            firstMessage: currentMessages[0]?.content
          })
        })

        if (sessionResponse.ok) {
          const { session } = await sessionResponse.json()
          setSessionId(session.id)
          
          // Save all messages from current conversation to the new session
          for (const message of currentMessages) {
            await saveMessage(message, session.id)
          }
          
          await loadChatSessions() // Refresh sessions list
        }
      }
    } catch (error) {
      console.error('Error generating title:', error)
    }
  }

  const updateChatSession = async (sessionId: string, lastMessage: string) => {
    try {
      await fetch('/api/chat-sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          lastMessage,
          incrementMessages: true
        })
      })
    } catch (error) {
      console.error('Error updating chat session:', error)
    }
  }

  const startNewChat = () => {
    setMessages([])
    setSessionId(null)
    setChatTitle('AI Tutor')
    setTitleGenerated(false)
    setInput('')
    setUploadedFiles([])
    setShowWelcome(true)
    setTimeout(() => {
      animateWelcomeMessage()
    }, 100)
  }

  const initializeWelcomeMessage = () => {
    const messages = [
      "Ready to learn something amazing?",
      "Let's make learning fun and easy!",
      "What would you like to explore today?",
      "Your learning adventure starts here!"
    ]
    const randomMessage = messages[Math.floor(Math.random() * messages.length)]
    setWelcomeMessage(randomMessage)
    setTimeout(() => {
      animateWelcomeMessage()
    }, 500)
  }

  const animateWelcomeMessage = () => {
    setIsTyping(true)
    setTypingText('')
    let currentIndex = 0
    const targetText = welcomeMessage
    
    const typingInterval = setInterval(() => {
      if (currentIndex < targetText.length) {
        setTypingText(targetText.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        setIsTyping(false)
        clearInterval(typingInterval)
      }
    }, 50)
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Chat Sidebar */}
      <ChatSidebar
        sessions={chatSessions}
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        onSessionSelect={(sessionIdToLoad) => {
          loadChatSession(sessionIdToLoad)
        }}
        onNewChat={startNewChat}
        onDeleteSession={(deletedSessionId) => {
          setChatSessions(prev => prev.filter(s => s.id !== deletedSessionId))
          if (deletedSessionId === sessionId) {
            startNewChat()
          }
        }}
        currentSessionId={sessionId || undefined}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/home')}
                className="p-2 rounded-xl hover:bg-surface hover:glow-hover transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">{chatTitle}</h1>
                <p className="text-xs text-muted-foreground">ChatGPT-quality learning assistant</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="text-xs h-7 px-3 text-muted-foreground hover:text-foreground hover:bg-surface"
              >
                <Menu className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="p-2 h-8 hidden lg:flex"
                onClick={startNewChat}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

      {/* Messages Container */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {messages.length === 0 && showWelcome ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-8 shadow-2xl glow-primary animate-bounce-slow">
                  <MessageCircle className="w-12 h-12 text-white" />
                </div>
                
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-3 animate-slide-up">
                    {userName ? `Welcome back, ${userName}!` : 'Welcome to brAIny'}
                  </h2>
                  <div className="h-8 flex items-center justify-center">
                    <p className="text-lg text-muted-foreground animate-slide-up-delay">
                      {typingText}
                      {isTyping && <span className="animate-pulse">|</span>}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl animate-slide-up-delay-2">
                  {[
                    "Explain photosynthesis",
                    "What is machine learning?",
                    "Help with calculus homework",
                    "History of ancient Rome"
                  ].map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => {
                        setInput(prompt)
                        setShowWelcome(false)
                      }}
                      className="h-auto py-4 px-5 text-left justify-start hover:glow-hover transition-all duration-300 hover:scale-105 hover:shadow-lg text-base"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
          ) : (
              <div className="space-y-6">
                {messages.map((message) => {
                  const { text, buttons } = parseActionButtons(message.content)
                  const isUser = message.role === 'user'
                  
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "group relative",
                        isUser ? "flex justify-end" : "flex justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-3xl px-5 py-4 shadow-lg transition-all duration-300",
                          isUser
                            ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white glow-primary"
                            : "bg-surface border border-border text-foreground"
                        )}
                      >
                        {isUser ? (
                          <EditableMessage
                            content={text}
                            onSave={(newContent) => {
                              setMessages(prev =>
                                prev.map(m =>
                                  m.id === message.id ? { ...m, content: newContent } : m
                                )
                              )
                            }}
                            isOwnMessage={true}
                          />
                      ) : (
                          <div className="message-enter">
                            <MarkdownRenderer 
                              content={text}
                              className="text-sm"
                            />
                            
                            {buttons.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-border/30">
                                <div className="flex flex-wrap gap-2">
                                  {buttons.map((button) => (
                                    <Button
                                      key={button.id}
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleActionButton(button.action, button.data, message.content)}
                                      className="text-xs h-8 border-border/50 hover:glow-hover"
                                    >
                                      {button.label}
                                    </Button>
                                ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className={cn(
                          "text-xs mt-2",
                          isUser ? "text-blue-100" : "text-muted-foreground"
                        )}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  )
              })}
                
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-surface border border-border rounded-3xl px-5 py-4 shadow-lg">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        <span className="text-foreground">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

      {/* Input Area */}
        <div className="sticky bottom-0 border-t border-border/50 bg-background/90 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex gap-3 items-end">
              <CompactUploadButton 
                onFilesChange={setUploadedFiles}
                maxFiles={5}
              />
              
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value)
                    if (showWelcome && e.target.value.trim()) {
                      setShowWelcome(false)
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything! I'm here to help you learn..."
                  className="w-full px-6 py-5 pr-16 bg-surface border border-border rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-foreground placeholder:text-muted-foreground text-base shadow-sm hover:shadow-md focus:shadow-lg"
                  rows={2}
                  style={{ minHeight: '80px', maxHeight: '240px' }}
                />
                <Button
                  onClick={handleSend}
                  disabled={(!input.trim() && uploadedFiles.length === 0) || loading}
                  size="sm"
                  className="absolute right-4 bottom-4 h-10 w-10 p-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white hover:glow-hover transition-all duration-300 hover:scale-110 shadow-md"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <div className="text-xs text-muted-foreground">
                {dailyUsage} / {subscriptionTier === 'master' ? '∞' : subscriptionTier === 'pro' ? '100' : '20'} messages today
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleStudyGuide}
                  disabled={loading}
                  variant="primary"
                  size="sm"
                  className="text-xs h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <BookOpen className="w-3 h-3 mr-1" />
                  Study Guide
                </Button>
                <Button
                  onClick={() => alert('Test button works!')}
                  variant="primary"
                  size="sm"
                  className="text-xs h-7 px-3 bg-green-600 hover:bg-green-700 text-white"
                >
                  TEST
                </Button>
                <Button
                  onClick={handleHint}
                  disabled={!messages.length || loading}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 px-3 text-muted-foreground hover:text-foreground hover:bg-surface"
                >
                  <Lightbulb className="w-3 h-3 mr-1" />
                  Hint
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* End Main Chat Area */}
      
      {/* Study Guide Modal */}
      {showStudyGuide && (
        <StudyGuideDisplay
          content={studyGuideContent}
          title={`${chatTitle} - Study Guide`}
          onClose={() => setShowStudyGuide(false)}
        />
      )}
    </div>
  )
}
