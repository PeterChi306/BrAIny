'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { TutorCard } from '@/components/tutor/TutorCard'
import { TutorHeader } from '@/components/tutor/TutorHeader'
import { TutorInput } from '@/components/tutor/TutorInput'
import { SmartActions } from '@/components/tutor/SmartActions'
import { MessageActions } from '@/components/tutor/MessageActions'
import { QuizModal } from '@/components/tutor/QuizModal'
import { FlashcardModal } from '@/components/tutor/FlashcardModal'
import { BottomNavigation } from '@/components/BottomNavigation'
import { ChatHistory } from '@/components/tutor/ChatHistory'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'
import { TierBadge, GlowingName, PrestigeBorder, PremiumBackground } from '@/components/ui/PremiumUI'
import { UsageLimits } from '@/components/ui/UsageLimits'
import { LiquidGlassButton, LiquidGlassCard, LiquidGlassToggle } from '@/components/ui/liquid-glass'
import { StreakCounter, ConceptCounter, XPCounter, AnimatedProgressRing } from '@/components/ui/count-up'
import { useUserTier } from '@/contexts/UserTierContext'
import { LoadingScreen } from '@/components/LoadingScreen'
import { getSubscriptionLimits } from '@/lib/subscription'
import { updateStreak } from '@/lib/streak-v2'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import {
  Home as HomeIcon,
  BookOpen,
  Brain,
  User,
  Users,
  Calendar,
  TrendingUp,
  Flame,
  Target,
  Zap,
  ArrowRight,
  Sparkles,
  Clock,
  Trophy,
  Send,
  Upload,
  Crown,
  FileText,
  Volume2,
  Fingerprint
} from 'lucide-react'
import { SpeechTutor } from '@/lib/speech'
import { topicExtractor } from '@/lib/topic-extraction'
import { learningIntelligence } from '@/lib/learning-intelligence'
import { adaptiveExplanationEngine } from '@/lib/adaptive-explanation-engine'
import { documentScanner } from '@/lib/documentScanner'
import { ActivityInvite } from '@/components/tutor/ActivityInvite'
import { LearningIntelligenceDashboard } from '@/components/learning/LearningIntelligenceDashboard'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  imageData?: string
  headline?: string
  created_at: string
  chat_id: string
  isQuizRequest?: boolean
  isFlashcardRequest?: boolean
  mode?: string
}

interface Profile {
  id: string
  display_name: string
  email: string
  interests?: string[]
  age?: number
  learning_style?: string
}

interface UserMetrics {
  streak: number
  weeklyProgress: number
  weakSpots: string[]
  masteredTopics: string[]
  studyTime: number
  improvementRate: number
}

export default function TutorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { userTier } = useUserTier()
  const limits = getSubscriptionLimits(userTier)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  const [dailyUsage, setDailyUsage] = useState(0)
  const [mode, setMode] = useState<'explain' | 'practice' | 'quiz'>('explain')
  const [responseDepth, setResponseDepth] = useState<'detailed' | 'concise'>('detailed')
  const [isThinking, setIsThinking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [showEngagement, setShowEngagement] = useState(true)
  const [showLearningDashboard, setShowLearningDashboard] = useState(false)
  const [userMetrics, setUserMetrics] = useState<UserMetrics>({
    streak: 0,
    weeklyProgress: 0,
    weakSpots: [],
    masteredTopics: [],
    studyTime: 0,
    improvementRate: 0
  })
  const [microFeedback, setMicroFeedback] = useState<string | null>(null)
  const [showChatHistory, setShowChatHistory] = useState(false)
  const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0) // New state for sidebar sync
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeTarget, setUpgradeTarget] = useState<'scholar' | 'master' | 'legend'>('scholar')
  const [upgradeFeatureName, setUpgradeFeatureName] = useState('')
  const [speechTutor, setSpeechTutor] = useState<any | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [queuedFiles, setQueuedFiles] = useState<File[]>([])
  const [currentQuiz, setCurrentQuiz] = useState<string | null>(null)
  const [currentFlashcard, setCurrentFlashcard] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const processingRef = useRef(false) // Add ref for more reliable prevention
  const processedMessagesRef = useRef(new Set<string>()) // Track processed message IDs
  const homeMessageProcessedRef = useRef(false) // Track if home message was processed

  const handleSendMessage = useCallback(async (messageContent: string, overrideMode?: string, overrideDepth?: string) => {
    // Create a unique key for this message content
    const messageKey = `manual_${messageContent}`

    // Check if this message has already been processed
    if (processedMessagesRef.current.has(messageKey)) {
      console.log('🚫 Manual message already processed, skipping:', messageContent)
      return
    }

    // Prevent multiple simultaneous calls using ref for immediate check
    if (processingRef.current || isProcessing || loading) {
      console.log('🚫 Already processing, skipping duplicate call', {
        processingRef: processingRef.current,
        isProcessing,
        loading
      })
      return
    }

    // Ensure we have a valid mode and depth (use overrides if provided)
    const activeMode = overrideMode || mode || 'explain'
    const activeDepth = overrideDepth || responseDepth || 'detailed'

    console.log('✅ Starting new message processing', { messageContent, activeMode, activeDepth })

    // Mark this message as being processed
    processedMessagesRef.current.add(messageKey)
    processingRef.current = true
    setIsProcessing(true)
    setLoading(true)
    setIsThinking(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 📈 TRACK XP WHEN SENDING MESSAGE
      if (user && messageContent.trim()) {
        try {
          // SIMPLE: Give XP for ANY message about ANY topic
          console.log(`📈 XP tracked for message: "${messageContent.substring(0, 50)}..."`)
          
          // Track interaction for progress page (simple General subject for all messages)
          import('@/lib/learning-intelligence').then(({ learningIntelligence }) => {
            learningIntelligence.trackInteraction(user.id, 'General', 'Learning', 'General', {
              type: 'correct',
              confidence: 0.8,
              responseTime: 30,
              needsHelp: false
            })
          })
          
        } catch (error) {
          console.log('Message XP tracking failed (but app still works):', error)
        }
      }

      if (!limits.hasUnlimitedUsage && dailyUsage >= limits.dailyAiMessages) {
        setIsThinking(false)
        setLoading(false)
        setIsProcessing(false)
        processingRef.current = false
        processedMessagesRef.current.delete(messageKey)
        
        // Use beautiful upgrade modal
        setUpgradeFeatureName('Unlimited AI Tutoring')
        setUpgradeTarget(userTier === 'starter' ? 'scholar' : 'master')
        setShowUpgradeModal(true)
        return
      }

      const userMessage = {
        id: Date.now().toString(),
        role: 'user' as const,
        content: messageContent,
        created_at: new Date().toISOString(),
        chat_id: chatId || 'temp'
      }

      // Create or get chat (temporary title; AI-generated title set after first response)
      let currentChatId = chatId
      const isFirstMessageInChat = !currentChatId
      if (!currentChatId) {
        const { data: chat, error: chatError } = await supabase
          .from('chats')
          .insert({
            user_id: user.id,
            title: 'New Chat',
            mode: mode,
            subject: null
          })
          .select()
          .single()

        if (chatError) throw chatError
        currentChatId = chat.id
        setChatId(currentChatId)
      }

      // Save user message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: currentChatId,
          role: 'user',
          content: userMessage.content
        })

      if (messageError) throw messageError

      // Title generation moved to the end of exchange for higher accuracy (ChatGPT-style)

      // Get learning intelligence data
      const learningProfile = learningIntelligence.getProfile(user.id)
      const diagnosis = learningIntelligence.diagnose(user.id)
      const masteryScores = learningIntelligence.getMasteryScores(user.id)
      const topWeaknesses = learningIntelligence.getTopWeaknesses(user.id, 3)

      // 🧠 STRATEGIC: Fetch historical context for Review/Yesterday requests
      // This solves the "random stuff" hallucination problem cost-effectively.
      let historicalContext = null
      if (messageContent.toLowerCase().includes('review') || messageContent.toLowerCase().includes('yesterday')) {
        const { data: recentChats } = await supabase
          .from('chats')
          .select('title, created_at')
          .eq('user_id', user.id)
          .neq('id', currentChatId || 'none')
          .order('created_at', { ascending: false })
          .limit(5)
        
        if (recentChats && recentChats.length > 0) {
          historicalContext = recentChats
            .filter(c => c.title !== 'New Chat')
            .map(c => `- Topic: ${c.title} (Date: ${new Date(c.created_at).toLocaleDateString()})`)
            .join('\n')
        }
      }
      
      // If we were sent here from Home/Scan with an image, attach it to the first request
      let firstImageData: string | undefined = undefined
      if (typeof window !== 'undefined' && (window as any).homePageImageData) {
        firstImageData = (window as any).homePageImageData
        // Clear queue and stored image immediately so UI matches ChatGPT (image only in message bubble)
        delete (window as any).homePageImageData
        setQueuedFiles([])
        if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('queuedFiles')
      }

      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          chatId: currentChatId,
          mode: activeMode,
          responseDepth: activeDepth,
          historicalContext, // 🧠 Grounding data for review
          conversationHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            imageData: msg.imageData // Include image data in conversation history
          })).slice(-10), // Include last 10 messages for context
          profile: profile ? {
            display_name: profile.display_name,
            interests: profile.interests,
            learning_style: profile.learning_style,
            grade_level: (profile as any).grade_level,
            hobbies: (profile as any).hobbies,
            preferred_tone: (profile as any).preferred_tone,
            learning_pace: (profile as any).learning_pace,
            favorite_topics: (profile as any).favorite_topics,
          } : null,
          displayName: profile?.display_name || 'Student',
          interests: profile?.interests || [],
          // 🧠 LEARNING INTELLIGENCE INTEGRATION
          learningProfile: {
            weakSpots: learningProfile.weakSpots,
            strengths: learningProfile.strengths,
            learningStyle: learningProfile.learningStyle,
            currentStreak: learningProfile.currentStreak,
            conceptsMastered: learningProfile.conceptsMastered,
            improvementRate: learningProfile.improvementRate
          },
          diagnosis: {
            currentWeaknesses: diagnosis.currentWeaknesses,
            emergingPatterns: diagnosis.emergingPatterns,
            recommendedFocus: diagnosis.recommendedFocus,
            confidenceLevel: diagnosis.confidenceLevel,
            learningVelocity: diagnosis.learningVelocity
          },
          masteryScores: masteryScores.slice(-10), // Last 10 mastery scores
          topWeaknesses: topWeaknesses,
          // Legacy compatibility
          weakSpots: userMetrics.weakSpots,
          masteredTopics: userMetrics.masteredTopics,
          imageData: firstImageData
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Handle rate limit from server
        if (response.status === 429 || errorData.limitReached) {
          setIsThinking(false)
          setLoading(false)
          setIsProcessing(false)
          processingRef.current = false
          processedMessagesRef.current.delete(messageKey)
          
          setDailyUsage(errorData.used || limits.dailyAiMessages)
          setUpgradeFeatureName('Daily AI Message Limit Reached')
          setUpgradeTarget(userTier === 'starter' ? 'scholar' : 'master')
          setShowUpgradeModal(true)
          return
        }

        const errorMessage = errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }

      const data = await response.json()

      // Check for error in response
      if (data.error && !data.limitReached) {
        throw new Error(data.error + (data.details ? `: ${data.details}` : ''))
      }

      // Handle limit reached correctly even if response is 200 (legacy compatibility)
      if (data.limitReached) {
        setIsThinking(false)
        setLoading(false)
        setIsProcessing(false)
        processingRef.current = false
        processedMessagesRef.current.delete(messageKey)
        
        setDailyUsage(data.used || limits.dailyAiMessages)
        setUpgradeFeatureName('Daily AI Message Limit Reached')
        setUpgradeTarget(userTier === 'starter' ? 'scholar' : 'master')
        setShowUpgradeModal(true)
        return
      }

      if (!data.response || typeof data.response !== 'string') {
        throw new Error('Invalid response format from AI service')
      }

      // Generate personalized headline
      const headline = generateHeadline(data.response, profile?.display_name)

      const assistantMessage = {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: data.response,
        headline: headline,
        created_at: new Date().toISOString(),
        chat_id: currentChatId!,
        isQuizRequest: data.isQuizRequest,
        isFlashcardRequest: data.isFlashcardRequest,
        mode: data.mode
      }

      setIsThinking(false)
      setMessages(prev => [...prev, assistantMessage])

      // Save assistant message
      await supabase
        .from('messages')
        .insert({
          chat_id: currentChatId,
          role: 'assistant',
          content: data.response
        })

      // 📈 SIMPLE XP & STREAK TRACKING (for progress page)
      if (user && data.response) {
        try {
          // Update study streak
          import('@/lib/streak-v2').then(({ updateStreak }) => {
            updateStreak(user.id, 'chat')
          })

          // Simple subject detection for progress tracking
          const responseText = data.response.toLowerCase()
          let subject = 'General'
          
          if (responseText.includes('math') || responseText.includes('algebra') || responseText.includes('equation')) {
            subject = 'Math'
          } else if (responseText.includes('science') || responseText.includes('biology') || responseText.includes('cell')) {
            subject = 'Science'
          } else if (responseText.includes('history') || responseText.includes('war') || responseText.includes('ancient')) {
            subject = 'History'
          } else if (responseText.includes('english') || responseText.includes('grammar') || responseText.includes('writing')) {
            subject = 'English'
          }

          // Track basic interaction for progress page
          import('@/lib/learning-intelligence').then(({ learningIntelligence }) => {
            learningIntelligence.trackInteraction(user.id, subject, subject, subject, {
              type: 'correct',
              confidence: 0.8,
              responseTime: 30,
              needsHelp: false
            })
          })

          console.log(`📈 Learning tracked: ${subject}`)
          
        } catch (error) {
          console.log('Learning tracking failed (but app still works):', error)
        }
      }

      // 🤖 EXACT MESSAGE CHAT RENAMING
      if (isFirstMessageInChat && currentChatId) {
        try {
          console.log(`📝 Naming chat session as: "${messageContent.substring(0, 80)}"`)
          await supabase
            .from('chats')
            .update({ 
              title: messageContent.substring(0, 100).trim(), 
              updated_at: new Date().toISOString() 
            })
            .eq('id', currentChatId)
            
          // Trigger sidebar refresh so the new name appears immediately
          setRefreshHistoryTrigger(prev => prev + 1)
        } catch (err) {
          console.warn('⚠️ Chat renaming failed:', err)
        }
      }

      // Update usage and metrics from server response
      if (data.used !== undefined) {
        setDailyUsage(data.used)
      } else {
        setDailyUsage(prev => prev + 1)
      }

      // Streak increases only after real learning (this message)
      try {
        await updateStreak(user.id, 'chat')
      } catch (streakErr) {
        console.warn('Streak update failed:', streakErr)
      }

      // Update user metrics (simulate improvement)
      setUserMetrics(prev => ({
        ...prev,
        weeklyProgress: Math.min(100, prev.weeklyProgress + 2),
        improvementRate: Math.min(100, prev.improvementRate + 1)
      }))

      // Show micro-feedback
      const feedbacks = [
        "Nice—you're building a real habit.",
        "One more step in the right direction.",
        "Keep going; it adds up.",
        "You're on a roll."
      ]
      if (Math.random() > 0.5) {
        setMicroFeedback(feedbacks[Math.floor(Math.random() * feedbacks.length)])
        setTimeout(() => setMicroFeedback(null), 4000)
      }

    } catch (error) {
      console.error('🔥 Error sending message:', error)
      console.error('🔥 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown error type'
      })
      setIsThinking(false)

      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
      const errorResponse = {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: `Something went wrong on our end. ${errorMessage.includes('GEMINI_API_KEY') ? 'The AI isn\'t set up yet.' : errorMessage.includes('Unauthorized') ? 'Please sign in again.' : 'Give it another try in a moment—we\'re here to help.'}`,
        created_at: new Date().toISOString(),
        chat_id: chatId || 'temp'
      }
      setMessages(prev => {
        // Remove the user message if sending failed
        const filtered = prev.filter(msg => msg.content !== messageContent)
        // Add error message
        return [...filtered, errorResponse]
      })
    } finally {
      console.log('🏁 Finished message processing, resetting states')
      setLoading(false)
      setIsProcessing(false)
      processingRef.current = false // Reset ref
    }
  }, [chatId, mode, profile, userMetrics, dailyUsage, isProcessing, loading, responseDepth, messages])

  const handleSend = async () => {
    if (!input.trim() && queuedFiles.length === 0) return
    if (loading || isProcessing || processingRef.current) return
    if (!limits.hasUnlimitedUsage && dailyUsage >= limits.dailyAiMessages) {
      setUpgradeFeatureName('Unlimited AI Tutoring')
      setUpgradeTarget(userTier === 'starter' ? 'scholar' : 'master')
      setShowUpgradeModal(true)
      return
    }

    // Create a single user message with both text and image context
    const messageId = Date.now().toString()
    const userMessage = {
      id: messageId,
      role: 'user' as const,
      content: input.trim() || (queuedFiles.length > 0 ? `I've uploaded an image` : ''),
      created_at: new Date().toISOString(),
      chat_id: chatId || 'temp'
    }

    // Add message to UI immediately
    setMessages(prev => [...prev, userMessage])
    setInput('')

    // Process files if any, then send combined message
    if (queuedFiles.length > 0) {
      await processQueuedFiles(userMessage.content, messageId)
    } else {
      // Send text-only message
      await handleSendMessage(userMessage.content, mode, responseDepth)
    }
  }

  // Load existing chat messages on component mount
  useEffect(() => {
    const loadChatMessages = async () => {
      if (!chatId || chatId === 'temp') return

      try {
        console.log(`📚 Loading conversation history for chatId: ${chatId}`)
        const { data: messages, error } = await supabase
          .from('messages')
          .select('role, content, created_at, chat_id')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true })
          .limit(50) // Increase limit to get more context

        if (error) {
          console.error('❌ Error loading chat messages:', error)
        } else if (messages && messages.length > 0) {
          console.log(`✅ Loaded ${messages.length} existing messages for chatId: ${chatId}`)
          console.log('📝 Message preview:', messages.slice(-3).map(m => `${m.role}: ${m.content.substring(0, 50)}...`))

          // Ensure messages have required properties - type cast database response
          const validMessages: Message[] = (messages as any[]).map((msg: any, index: number) => {
            const role = msg.role || 'user'
            const content = msg.content || ''
            
            // Derive attributes if columns are missing from DB or if they were null
            const isQuiz = role === 'assistant' && (content.includes('Question:') || content.includes('Correct answer:'))
            const isFlashcard = role === 'assistant' && (content.includes('Front:') || content.includes('Back:'))
            const derivedHeadline = isQuiz ? 'Quiz Mode' : (isFlashcard ? 'Flashcard Mode' : 'Knowledge Insight')

            return {
              id: msg.id || `${Date.now()}-${index}`,
              role: role,
              content: content,
              created_at: msg.created_at || new Date().toISOString(),
              chat_id: msg.chat_id || chatId,
              headline: msg.headline || derivedHeadline,
              isQuizRequest: msg.isQuizRequest ?? isQuiz,
              isFlashcardRequest: msg.isFlashcardRequest ?? isFlashcard,
              mode: msg.mode || (isQuiz ? 'quiz' : isFlashcard ? 'practice' : 'explain')
            }
          })

          setMessages(validMessages)
          console.log(`📊 Set ${validMessages.length} messages in state, last message:`, validMessages[validMessages.length - 1]?.content?.substring(0, 100) + '...')
        } else {
          console.log('📭 No messages found for this chatId')
        }
      } catch (error) {
        console.error('❌ Failed to load chat messages:', error)
      }
    }

    loadChatMessages()
  }, [chatId])

  // Handle message from home page query parameter
  useEffect(() => {
    const messageFromHome = searchParams.get('message')
    const isNewChat = searchParams.get('new') === 'true'

    console.log('🔍 useEffect triggered', { messageFromHome, isNewChat, loading, isProcessing, processingRef: processingRef.current })

    // Only process if we have a message and we're not already processing
    if (messageFromHome && !loading && !isProcessing && !processingRef.current) {
      // Check if home message was already processed to prevent duplicates
      if (homeMessageProcessedRef.current) {
        console.log('🚫 Home message already processed in this session, skipping:', messageFromHome)
        return
      }

      console.log('📤 Processing home page message:', messageFromHome)

      // Mark home message as processed immediately (do NOT reset — prevents infinite/double send)
      homeMessageProcessedRef.current = true

      // Don't clear existing chat data if we're continuing an existing chat
      if (isNewChat) {
        setMessages([])
        setChatId(null)
      }

      // Auto-send the message once
      let imageData: string | undefined
      if (typeof window !== 'undefined' && (window as any).homePageImageData) {
        imageData = (window as any).homePageImageData
      }

      const userMessage = {
        id: Date.now().toString(),
        role: 'user' as const,
        content: messageFromHome.trim(),
        created_at: new Date().toISOString(),
        chat_id: chatId || 'temp',
        ...(imageData ? { imageData } : {})
      }

      // Add user message immediately
      setMessages(prev => [...prev, userMessage])

      // Clear input immediately
      setInput('')
      // Clear any leftover queued files from Home/Scan now that we're sending this image
      setQueuedFiles([])

      // Send once after brief delay so profile can load for personalization
      setTimeout(() => {
        if (!processingRef.current && !isProcessing && !loading) {
          handleSendMessage(userMessage.content, mode, responseDepth)
        }
      }, 400)
    } else {
      console.log('🚫 useEffect skipped processing', { messageFromHome, isNewChat, loading, isProcessing, processingRef: processingRef.current, messagesLength: messages.length })
    }
  }, [searchParams, loading, messages.length, chatId]) // Remove processing states from dependencies

  // Handle scanned image and question from scan page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const scannedImage = localStorage.getItem('scannedImage')
      const scanQuestion = localStorage.getItem('scanQuestion')

      if (scannedImage && scanQuestion) {
        console.log('📸 Processing scanned image and question', { hasImage: !!scannedImage, question: scanQuestion })

        // Make scanned image available to the next AI request (same pipeline as Home image uploads)
        ;(window as any).homePageImageData = scannedImage

        // Clear the localStorage to prevent re-processing
        localStorage.removeItem('scannedImage')
        localStorage.removeItem('scanQuestion')
        localStorage.removeItem('scannedImageName')

        // Send the message after a short delay to ensure page is ready
        setTimeout(() => {
          if (!loading && !isProcessing && !processingRef.current) {
            // Add the image as a message first
            const imageMessage = {
              id: `image_${Date.now()}`,
              role: 'user' as const,
              content: scanQuestion,
              created_at: new Date().toISOString(),
              chat_id: chatId || 'temp',
              imageData: scannedImage
            }

            setMessages(prev => [...prev, imageMessage])

            // Then send the question to the AI
            handleSendMessage(scanQuestion, mode, responseDepth)
          }
        }, 500)
      }
    }
  }, [loading, isProcessing, handleSendMessage, chatId])

  // Check for queued files from home page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedFiles = sessionStorage.getItem('queuedFiles')
      if (storedFiles) {
        try {
          const fileData = JSON.parse(storedFiles)
          // Store the image data for processing
          const restoredFiles = fileData.map((file: any) => ({
            name: file.name,
            type: file.type,
            data: file.data // Keep the base64 data
          }))

          // Add to queued files with actual data
          restoredFiles.forEach((fileData: any) => {
            // Create a mock File object for display
            const mockFile = new File([''], fileData.name, { type: fileData.type })
            setQueuedFiles(prev => [...prev, mockFile])

            // Store the actual image data for processing
            if (fileData.data) {
              // Store in a global variable for processing
              ; (window as any).homePageImageData = fileData.data
            }
          })

          sessionStorage.removeItem('queuedFiles')
        } catch (error) {
          console.error('Error parsing queued files:', error)
        }
      }
    }
  }, [])

  const generateChatTitle = (message: string) => {
    const words = message.trim().split(' ').slice(0, 4)
    let title = words.join(' ')

    if (message.includes('?') || message.includes('what') || message.includes('how') || message.includes('why')) {
      title += '?'
    }

    if (title.length > 40) {
      title = title.substring(0, 37) + '...'
    }

    return title || 'New Chat'
  }

  const generateHeadline = (content: string, userName?: string) => {
    const lowerContent = content.toLowerCase()

    // Personalized headlines based on content
    if (lowerContent.includes('step') || lowerContent.includes('process')) {
      return `Let's break this down step-by-step${userName ? `, ${userName}` : ''}`
    }
    if (lowerContent.includes('example') || lowerContent.includes('imagine')) {
      return 'Here\'s a way to think about this'
    }
    if (lowerContent.includes('remember') || lowerContent.includes('key')) {
      return 'The key insight here is'
    }
    if (lowerContent.includes('why') || lowerContent.includes('because')) {
      return 'Here\'s why this works'
    }

    return 'Here\'s what you need to know'
  }

  const handleSmartAction = async (action: string) => {
    // Direct execution for actions that don't need AI response
    if (action === 'study-guide') {
      const studyGuideMessage = "Create a study guide"
      setInput(studyGuideMessage)
      setTimeout(() => {
        if (!processingRef.current && !isProcessing && !loading) {
          handleSend()
        }
      }, 500)
      return
    }

    if (action === 'voice') {
      // Trigger voice input directly
      handleVoiceInput()
      return
    }

    if (action === 'weak-spots') {
      // Navigate to weak spots directly
      if (typeof window !== 'undefined') {
        window.location.href = `/weak-spots?topic=${encodeURIComponent(userMetrics.weakSpots[0])}`
      }
      return
    }

    // For actions that need AI response, send the message directly
    const getActionMessage = (action: string): string => {
      switch (action) {
        case 'quiz': {
          // Get the last assistant message to create contextual quiz request
          const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop()
          if (lastAssistantMessage) {
            // Extract key topic from the last response
            const topic = lastAssistantMessage.content.substring(0, 100)
            return `Based on what you just explained about "${topic.substring(0, 50)}...", can you create a quiz with 3-5 questions to test my understanding of this specific topic?`
          }
          return "Can you quiz me on what we just discussed in this conversation?"
        }
        case 'practice':
          return "Let's practice what I just learned."
        case 'simpler':
          return "Can you explain this even more simply?"
        case 'example':
          return "Show me a real-world example of this."
        case 'flashcards':
          return "Turn this into flashcards for review."
        case 'review':
          return `Let's review ${userMetrics.weakSpots[0] || 'this topic'} to strengthen my understanding.`
        default:
          return ""
      }
    }

    const message = getActionMessage(action)
    if (message) {
      // Set the appropriate mode based on action
      if (action === 'quiz') setMode('quiz')
      else if (action === 'practice') setMode('practice')
      else setMode('explain')

      // Send immediately without setting input for better UX
      if (!processingRef.current && !isProcessing && !loading) {
        // Add user message immediately for better feedback
        const userMessage = {
          id: Date.now().toString(),
          role: 'user' as const,
          content: message,
          created_at: new Date().toISOString(),
          chat_id: chatId || 'temp'
        }
        setMessages(prev => [...prev, userMessage])

        // Send the message with explicit mode/depth to avoid staleness
        handleSendMessage(message, action === 'quiz' ? 'quiz' : action === 'practice' ? 'practice' : 'explain', responseDepth)
      }
    }
  }

  const handleFileUpload = async (files: File[]) => {
    // Queue files instead of processing immediately
    try {
      // Check upload limits based on tier
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('tier')
          .eq('user_id', user.id)
          .maybeSingle()

        const tier = subData?.tier || 'free'
        const uploadLimit = tier === 'free' ? 3 : tier === 'pro' ? 10 : 999999

        // Count today's uploads
        const today = new Date().toISOString().split('T')[0]
        const { data: usageData } = await supabase
          .from('daily_usage')
          .select('scans_count')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle()

        const uploadsToday = usageData?.scans_count || 0
        if (uploadsToday + queuedFiles.length + files.length > uploadLimit) {
          alert(`You've reached your daily upload limit of ${uploadLimit}. Upgrade to continue.`)
          return
        }
      }

      // Add files to queue instead of processing immediately
      setQueuedFiles(prev => [...prev, ...files])
      console.log('� Files queued:', files.map(f => f.name))

    } catch (error) {
      console.error('File upload failed:', error)
      alert('File upload failed. Please try again.')
    }
  }

  const processQueuedFiles = async (messageText: string = '', messageId: string = '') => {
    if (queuedFiles.length === 0) return

    const filesToProcess = [...queuedFiles]
    setQueuedFiles([])

    try {
      // Check upload limits based on tier
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('tier')
          .eq('user_id', user.id)
          .maybeSingle()

        const tier = subData?.tier || 'free'
        const uploadLimit = tier === 'free' ? 3 : tier === 'pro' ? 10 : 999999

        // Count today's uploads
        const today = new Date().toISOString().split('T')[0]
        const { data: usageData } = await supabase
          .from('daily_usage')
          .select('scans_count')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle()

        const uploadsToday = usageData?.scans_count || 0
        if (uploadsToday + filesToProcess.length > uploadLimit) {
          alert(`You've reached your daily upload limit of ${uploadLimit}. Upgrade to continue.`)
          setQueuedFiles(filesToProcess)
          return
        }
      }

      // Process all files
      for (const file of filesToProcess) {
        if (file.type.startsWith('image/')) {
          // Show scanning message
          const scanningMessage = {
            id: Date.now().toString(),
            role: 'assistant' as const,
            content: '🔍 Scanning document... This may take a moment.',
            created_at: new Date().toISOString(),
            chat_id: chatId || 'temp'
          }
          setMessages(prev => [...prev, scanningMessage])

          // Check if we have stored image data from home page
          const storedImageData = (window as any).homePageImageData
          let base64: string

          if (storedImageData) {
            // Use the stored image data from home page
            base64 = storedImageData
            // Clear the stored data after using it
            delete (window as any).homePageImageData
          } else {
            // Convert image to base64 normally
            const reader = new FileReader()
            base64 = await new Promise<string>((resolve) => {
              reader.onload = (e) => resolve(e.target?.result as string)
              reader.readAsDataURL(file)
            })
          }

          try {
            // Perform OCR scanning locally for better text precision
            console.log('🔍 Starting local OCR scan for:', file.name)
            setMessages(prev => prev.map(msg => 
              msg.id === scanningMessage.id ? { ...msg, content: '🧠 performing neural scan...' } : msg
            ))
            
            const scanResult = await documentScanner.scanDocument(file)
            const formattedScan = await documentScanner.formatScanResult(scanResult)
            
            // Remove scanning message first
            setMessages(prev => prev.filter(msg => msg.id !== scanningMessage.id))

            // Combine user's text with extracted text
            const enrichedContent = messageText 
              ? `${messageText}\n\n---\n${formattedScan}`
              : formattedScan

            // Update the existing message with image data and extracted text
            setMessages(prev => prev.map(msg =>
              msg.id === messageId
                ? {
                  ...msg,
                  content: enrichedContent,
                  imageData: base64
                }
                : msg
            ))

            // Get AI response with image data and extracted text
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              const response = await fetch('/api/tutor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  message: enrichedContent,
                  imageData: base64, // Send image data to AI
                  chatId: chatId || 'temp',
                  mode: mode || 'explain',
                  responseDepth: responseDepth || 'detailed', // Send depth preference to API
                  conversationHistory: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    imageData: msg.imageData
                  })).slice(-10),
                  profile: profile ? {
                    display_name: profile.display_name,
                    interests: profile.interests,
                    learning_style: profile.learning_style,
                    grade_level: (profile as any).grade_level,
                    hobbies: (profile as any).hobbies,
                    preferred_tone: (profile as any).preferred_tone,
                    learning_pace: (profile as any).learning_pace,
                    favorite_topics: (profile as any).favorite_topics,
                  } : null,
                  displayName: profile?.display_name || 'Student',
                  interests: profile?.interests || [],
                  weakSpots: userMetrics.weakSpots,
                  masteredTopics: userMetrics.masteredTopics,
                  // 🧠 LEARNING INTELLIGENCE INTEGRATION
                  learningProfile: {
                    weakSpots: learningIntelligence.getProfile(user.id).weakSpots,
                    strengths: learningIntelligence.getProfile(user.id).strengths,
                    learningStyle: learningIntelligence.getProfile(user.id).learningStyle,
                    currentStreak: learningIntelligence.getProfile(user.id).currentStreak,
                    conceptsMastered: learningIntelligence.getProfile(user.id).conceptsMastered,
                    improvementRate: learningIntelligence.getProfile(user.id).improvementRate
                  },
                  diagnosis: {
                    currentWeaknesses: learningIntelligence.diagnose(user.id).currentWeaknesses,
                    emergingPatterns: learningIntelligence.diagnose(user.id).emergingPatterns,
                    recommendedFocus: learningIntelligence.diagnose(user.id).recommendedFocus,
                    confidenceLevel: learningIntelligence.diagnose(user.id).confidenceLevel,
                    learningVelocity: learningIntelligence.diagnose(user.id).learningVelocity
                  },
                  masteryScores: learningIntelligence.getMasteryScores(user.id).slice(-10),
                  topWeaknesses: learningIntelligence.getTopWeaknesses(user.id, 3)
                })
              })

              if (response.ok) {
                const data = await response.json()
                const aiMessage = {
                  id: (Date.now() + 2).toString(),
                  role: 'assistant' as const,
                  content: data.response,
                  created_at: new Date().toISOString(),
                  chat_id: chatId || 'temp'
                }
                setMessages(prev => [...prev, aiMessage])
              } else {
                throw new Error('AI analysis failed')
              }
            }
          } catch (error) {
            console.error('Error processing file:', error)

            // Remove scanning message
            setMessages(prev => prev.filter(msg => msg.id !== scanningMessage.id))

            // Add error message
            const errorMessage = {
              id: (Date.now() + 1).toString(),
              role: 'assistant' as const,
              content: 'Sorry, I had trouble analyzing that image. Please try again or describe what you need help with.',
              created_at: new Date().toISOString(),
              chat_id: chatId || 'temp'
            }
            setMessages(prev => [...prev, errorMessage])
          }
        } else {
          // Handle non-image files
          const fileMessage = {
            id: Date.now().toString(),
            role: 'user' as const,
            content: `I've uploaded a file: ${file.name}`,
            created_at: new Date().toISOString(),
            chat_id: chatId || 'temp'
          }
          setMessages(prev => [...prev, fileMessage])

          await handleSendMessage(`I've uploaded a file: ${file.name}`, mode, responseDepth)
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Failed to upload files. Please try again.')
    }
  }

  const handleReviewReminder = (topic: string) => {
    setInput(`Let's review ${topic} to strengthen my understanding.`)
    setTimeout(() => {
      if (!processingRef.current && !isProcessing && !loading) {
        handleSend()
      }
    }, 500)
  }

  const handleVoiceInput = async () => {
    try {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'en-US'

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setInput(transcript)
          recognition.stop()
        }

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          alert('Speech recognition failed. Please try typing instead.')
          recognition.stop()
        }

        recognition.start()
      } else {
        alert('Speech recognition is not supported in your browser. Please type your message instead.')
      }
    } catch (error) {
      console.error('Voice input error:', error)
      alert('Voice input is not available. Please type your message instead.')
    }
  }

  const handleChatSelect = async (selectedChatId: string) => {
    if (selectedChatId === chatId) return

    setChatId(selectedChatId)
    setMessages([])
    setLoading(true)

    try {
      // Load messages for selected chat
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', selectedChatId)
        .order('created_at', { ascending: true })

      if (messagesData) {
        setMessages(messagesData)
      }
    } catch (error) {
      console.error('Error loading chat messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditMessage = async (messageId: string, newContent: string) => {
    // Update the message in local state
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, content: newContent } : msg
      )
    )

    // If it's a user message, resend it to get a new AI response
    const messageToEdit = messages.find(msg => msg.id === messageId)
    if (messageToEdit?.role === 'user') {
      // Remove the last assistant message if it exists
      const lastAssistantIndex = messages.findLastIndex(msg => msg.role === 'assistant')
      if (lastAssistantIndex !== -1) {
        setMessages(prev => prev.slice(0, lastAssistantIndex))
      }

      // Send the edited message
      await handleSendMessage(newContent, mode, responseDepth)
    } else {
      // For assistant messages, just update in database
      try {
        await supabase
          .from('messages')
          .update({ content: newContent })
          .eq('id', messageId)
      } catch (error) {
        console.error('Error updating message:', error)
      }
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setChatId(null)
    setShowChatHistory(false)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const messageFromHome = searchParams.get('message')
        const isNewChat = searchParams.get('new') === 'true'

        // Check login streak when user loads the tutor page
        if (session) {
          try {
            await updateStreak(session.user.id, 'chat')
          } catch (streakError) {
            console.warn('Failed to update login streak:', streakError)
          }
        }

        // Don't load previous chat data if this is a new chat from home
        if (isNewChat && messageFromHome) {
          // Still load profile but skip chat history
          if (!session) {
            setProfile({
              id: 'demo',
              display_name: 'Student',
              email: 'demo@example.com',
              interests: ['gaming', 'tech'],
              age: 16,
              learning_style: 'visual'
            })
            return
          }

          // Load profile only
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()

          setProfile(profileData || {
            id: 'demo',
            display_name: 'Student',
            email: 'demo@example.com',
            interests: ['gaming', 'tech'],
            age: 16,
            learning_style: 'visual'
          })
          return
        }

        if (!session) {
          setProfile({
            id: 'demo',
            display_name: 'Student',
            email: 'demo@example.com',
            interests: ['gaming', 'tech'],
            age: 16,
            learning_style: 'visual'
          })
          return
        }

        // Load profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        setProfile(profileData)

        // Load daily usage
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

        // Load real user metrics
        const { data: profileMetrics } = await supabase
          .from('profiles')
          .select('study_streak')
          .eq('id', session.user.id)
          .maybeSingle()

        // Get weak spots from user performance (handle missing table)
        const weakSpots: string[] = []
        const masteredTopics: string[] = []

        try {
          const { data: weakSpotsData, error } = await supabase
            .from('user_performance')
            .select('weak_concepts, strong_concepts')
            .eq('user_id', session.user.id)
            .order('updated_at', { ascending: false })
            .limit(5)

          if (!error && weakSpotsData) {
            weakSpotsData.forEach(perf => {
              if (perf.weak_concepts && Array.isArray(perf.weak_concepts)) {
                weakSpots.push(...perf.weak_concepts)
              }
              if (perf.strong_concepts && Array.isArray(perf.strong_concepts)) {
                masteredTopics.push(...perf.strong_concepts)
              }
            })
          }
        } catch (error) {
          console.warn('user_performance table not found, using empty arrays:', error)
        }

        // Calculate weekly progress from study sessions (handle missing table)
        let weeklyProgress = 0
        let studyTime = 0

        try {
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          const { data: sessionsData, error } = await supabase
            .from('study_sessions')
            .select('duration_minutes, performance_score')
            .eq('user_id', session.user.id)
            .gte('created_at', weekAgo.toISOString())

          if (!error && sessionsData && sessionsData.length > 0) {
            studyTime = sessionsData.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
            const avgScore = sessionsData.reduce((sum, s) => sum + (s.performance_score || 0), 0) / sessionsData.length
            weeklyProgress = Math.round(avgScore || 0)
          }
        } catch (error) {
          console.warn('study_sessions table not found, using defaults:', error)
        }

        setUserMetrics({
          streak: profileMetrics?.study_streak || 0,
          weeklyProgress,
          weakSpots: Array.from(new Set(weakSpots)).slice(0, 5),
          masteredTopics: Array.from(new Set(masteredTopics)).slice(0, 5),
          studyTime,
          improvementRate: weeklyProgress
        })

        // Load chat: use chatId from URL (Continue Learning) or most recent
        const continueChatId = searchParams.get('chatId')
        let chatToLoad: { id: string } | null = null

        if (continueChatId) {
          const { data: continueChat } = await supabase
            .from('chats')
            .select('id')
            .eq('id', continueChatId)
            .eq('user_id', session.user.id)
            .maybeSingle()
          if (continueChat) chatToLoad = continueChat
        }

        if (!chatToLoad) {
          const { data: chatsData } = await supabase
            .from('chats')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('mode', 'explain')
            .order('updated_at', { ascending: false })
            .limit(1)
          if (chatsData && chatsData.length > 0) chatToLoad = chatsData[0]
        }

        if (chatToLoad) {
          setChatId(chatToLoad.id)
          const { data: messagesData } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chatToLoad.id)
            .order('created_at', { ascending: true })
          if (messagesData) setMessages(messagesData)
        }
      } catch (error) {
        console.error('Error loading data:', error)
        // Set demo profile on error
        setProfile({
          id: 'demo',
          display_name: 'Student',
          email: 'demo@example.com',
          interests: ['gaming', 'tech'],
          age: 16,
          learning_style: 'visual'
        })
      }
    }

    loadData()
  }, [searchParams])

  // Initialize speech tutor with error handling
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const tutor = new SpeechTutor({
          enabled: true,
          voice_type: 'neutral',
          speech_rate: 1.0,
          volume: 1.0,
          auto_speak_explanations: false,
          auto_speak_feedback: false,
          pause_during_input: true,
          daily_limit_minutes: 60,
          used_minutes_today: 0
        })
        setSpeechTutor(tutor as any)
        console.log('✅ Speech tutor initialized')
      }
    } catch (error) {
      console.warn('⚠️ Speech tutor initialization failed:', error)
      // Continue without speech functionality
    }
  }, [])

  const handleSpeakResponse = async (text: string) => {
    if (!speechTutor) return

    try {
      setIsSpeaking(true)
      await speechTutor.speakNatural(text, {
        onEnd: () => setIsSpeaking(false),
        onError: () => {
          setIsSpeaking(false)
          alert('Failed to speak. Please try again.')
        }
      })
    } catch (error) {
      console.error('Speech error:', error)
      setIsSpeaking(false)
      alert('Speech synthesis failed. Please try again.')
    }
  }

  return (
    <PremiumBackground className="flex h-screen overflow-hidden selection:bg-black/10 dark:selection:bg-white/10 font-sans w-full">
      {/* Chat History Sidebar */}
      <ChatHistory
        currentChatId={chatId}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        isOpen={showChatHistory}
        onClose={() => setShowChatHistory(false)}
        refreshTrigger={refreshHistoryTrigger}
      />

      {/* Main Content */}
      <div className="flex-1 h-screen flex flex-col relative min-w-0">
        {/* Header */}
        <TutorHeader
          userName={profile?.display_name || 'Student'}
          mode={mode}
          isThinking={isThinking}
          streak={userMetrics.streak}
          progress={userMetrics.weeklyProgress}
          xp={userMetrics.improvementRate}
          responseDepth={responseDepth}
          onDepthChange={setResponseDepth}
          onMenuToggle={() => setShowChatHistory(!showChatHistory)}
        />


        {/* Main Content Area - scrollable */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-3xl mx-auto px-4 py-8">
            {/* Welcome State */}
            {messages.length === 0 ? (
              <div className="space-y-8 pb-80">
                {/* Welcome Card replaced counters */}

                {/* Welcome Card simplified */}
                <div className="p-12 text-center animate-slide-up">
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">
                    Welcome back, {profile?.display_name || 'Student'}!
                  </h2>
                  <p className="text-lg text-slate-500 dark:text-white/40 mb-12 max-w-2xl mx-auto font-medium">
                    Continue your learning journey with personalized AI tutoring.
                  </p>

                  {/* Weekly Progress - Hidden to save space as requested to avoid overlap */}
                  {/* Quick Start Actions */}
                  <div className="flex flex-col gap-3 w-full max-w-xl mx-auto">
                    {/* Primary Action - Compact Header Card */}
                    <button
                      onClick={() => {
                        setMode('explain')
                        setInput("Explain something new to me")
                        setTimeout(() => {
                          if (!processingRef.current && !isProcessing && !loading) {
                            handleSend()
                          }
                        }, 500)
                      }}
                      className="group p-6 rounded-[2rem] bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-blue-500/50 transition-all duration-500 text-center shadow-xl active:scale-[0.98] relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-sm">
                        <Sparkles className="w-6 h-6 text-blue-500" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">Learn Something New</h3>
                      <p className="text-[10px] text-slate-500 dark:text-white/40 font-black uppercase tracking-widest">Master any topic instantly</p>
                    </button>

                    {/* Secondary Actions - 2 Column Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setMode('practice')
                          setInput("Help me practice my current focus areas")
                          setTimeout(() => {
                            if (!processingRef.current && !isProcessing && !loading) {
                              handleSend()
                            }
                          }, 500)
                        }}
                        className="group p-4 rounded-[1.5rem] bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-green-500/50 transition-all duration-500 text-center shadow-lg active:scale-[0.98]"
                      >
                        <div className="w-9 h-9 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 tracking-tight">Practice</h3>
                        <p className="text-[9px] text-slate-500 dark:text-white/40 font-black uppercase tracking-widest">Mastery Fix</p>
                      </button>

                      <button
                        onClick={() => {
                          setMode('quiz')
                          setInput("Quiz me on my progress")
                          setTimeout(() => {
                            if (!processingRef.current && !isProcessing && !loading) {
                              handleSend()
                            }
                          }, 500)
                        }}
                        className="group p-4 rounded-[1.5rem] bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-purple-500/50 transition-all duration-500 text-center shadow-lg active:scale-[0.98]"
                      >
                        <div className="w-9 h-9 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                          <Trophy className="w-4 h-4 text-purple-500" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 tracking-tight">Verify</h3>
                        <p className="text-[9px] text-slate-500 dark:text-white/40 font-black uppercase tracking-widest">Check Context</p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pb-72">
                {/* 🧠 REVOLUTIONARY: Proactive Neural Alert */}
                {userMetrics.weakSpots.length > 0 && (
                  <div className="mb-10 animate-fade-in">
                    <div className="glass-hologram p-5 rounded-[2rem] border border-orange-500/30 bg-orange-500/5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-glow-orange group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/20 group-hover:rotate-12 transition-transform">
                          <Fingerprint className="w-6 h-6 text-orange-500" />
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] font-black uppercase tracking-[.3em] text-orange-500 mb-1">Neural Diagnostic Alert</p>
                          <p className="text-sm text-white/80 font-medium leading-relaxed">
                            Hey, I've noticed you're hitting some friction with <span className="text-orange-400 font-black italic">"{userMetrics.weakSpots[0]}"</span>. 
                            Want to find the root cause together and fix it right now?
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleSendMessage(`I'm hitting some friction with "${userMetrics.weakSpots[0]}". Can you help me find the root cause and help me fix my mental model?`)}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                      >
                        Let's Fix It
                      </button>
                    </div>
                  </div>
                )}

                {/* Messages with Tutor Cards */}
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={message.id}>
                      {message.role === 'user' ? (
                        <div className="flex justify-end mb-6">
                          <div className="max-w-[85%] group">
                            <div className="px-5 py-3.5 rounded-2xl bg-[#f4f4f4] dark:bg-[#2f2f2f] text-gray-900 dark:text-gray-100 font-medium text-[15px] leading-relaxed">
                              {/* ChatGPT-style: small image above message */}
                              {message.imageData && (
                                <div className="mb-3 max-w-xs overflow-hidden rounded-lg border border-white/10">
                                  <img src={message.imageData} alt="User upload" className="w-full h-auto" />
                                </div>
                              )}
                              <MarkdownRenderer content={message.content} className="text-lg leading-relaxed text-white prose-p:my-0 prose-headings:text-white" />
                            </div>
                            <MessageActions
                              content={message.content}
                              isUser={true}
                              onEdit={(newContent) => handleEditMessage(message.id, newContent)}
                              className="mt-2 justify-end"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="mb-6 group">
                          {(() => {
                            const looksLikeQuiz = message.isQuizRequest || 
                                              message.content.includes('Question 1:') || 
                                              message.content.includes('# Quiz') ||
                                              (message.content.includes('a)') && message.content.includes('b)') && message.content.includes('Correct answer:'))
                            
                            const looksLikeFlashcards = message.isFlashcardRequest || 
                                                     message.content.includes('Front:') || 
                                                     message.content.includes('Back:')
                            
                            if (looksLikeQuiz) {
                              return (
                                <div className="mb-6 w-full max-w-2xl">
                                  <ActivityInvite 
                                    type="quiz" 
                                    topic={message.content.split('\n')[0].replace(/[^a-zA-Z\s]/g, '').slice(0, 40) || 'Current Topic'}
                                    onStart={() => setCurrentQuiz(message.content)}
                                  />
                                </div>
                              )
                            }
                            
                            if (looksLikeFlashcards) {
                              return (
                                <div className="mb-6 w-full max-w-2xl">
                                  <ActivityInvite 
                                    type="flashcards" 
                                    topic={message.content.split('\n')[0].replace(/[^a-zA-Z\s]/g, '').slice(0, 40) || 'Current Topic'}
                                    onStart={() => setCurrentFlashcard(message.content)}
                                  />
                                </div>
                              )
                            }
                            
                            return null
                          })() || (
                            <>
                              <TutorCard
                                content={message.content}
                                headline={message.headline}
                                userName={profile?.display_name}
                                userInterests={profile?.interests}
                                isTyping={index === messages.length - 1 && isThinking}
                                isQuizRequest={message.isQuizRequest}
                                isFlashcardRequest={message.isFlashcardRequest}
                                imageData={message.imageData}
                                className="mb-4"
                              />
                              <div className="flex gap-2 items-center">
                                {/* Speak response button */}
                                {speechTutor && !isThinking && (
                                  <LiquidGlassButton
                                    onClick={() => handleSpeakResponse(message.content)}
                                    disabled={isSpeaking}
                                    variant="secondary"
                                    size="sm"
                                  >
                                    <Volume2 className="w-4 h-4" />
                                    {isSpeaking ? 'Speaking...' : 'Speak Response'}
                                  </LiquidGlassButton>
                                )}
                                {/* Message actions */}
                                <MessageActions
                                  content={message.content}
                                  isUser={false}
                                  onEdit={(newContent) => handleEditMessage(message.id, newContent)}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Show Smart Actions after last assistant message */}
                      {message.role === 'assistant' && index === messages.length - 1 && !isThinking && (
                        <SmartActions
                          userName={profile?.display_name}
                          userWeakSpots={userMetrics.weakSpots}
                          currentTopic={message.headline}
                          onAction={handleSmartAction}
                          userTier={userTier}
                          className="mb-6"
                        />
                      )}
                    </div>
                  ))}

                  {/* Premium Thinking Signal */}
                  {isThinking && (
                    <div className="flex items-center gap-3 mb-8 ml-2 animate-fade-in group">
                      <div className="flex gap-1.5 px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-3xl border border-white/5 shadow-2xl">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s] shadow-[0_0_10px_#3b82f6]" />
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s] shadow-[0_0_10px_#60a5fa]" />
                        <div className="w-2 h-2 rounded-full bg-blue-300 animate-bounce shadow-[0_0_10px_#93c5fd]" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/50 group-hover:text-blue-500 transition-colors duration-500">
                        Thinking
                      </span>
                    </div>
                  )}
                </div>

                {/* Micro-feedback */}
                {microFeedback && (
                  <div className="flex justify-center">
                    <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2 text-green-800 dark:text-green-200 text-sm">
                      {microFeedback}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* File Queue Display - above input, with safe area */}
        {queuedFiles.length > 0 && (
          <div
            className="fixed left-0 right-0 lg:left-80 px-4 sm:px-6 z-35"
            style={{
              bottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <div className="max-w-4xl mx-auto">
              <LiquidGlassCard variant="glass" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto">
                  {queuedFiles.map((file, index) => (
                    <div key={`${file.name}-${file.size || index}`} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg flex-shrink-0">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px] sm:max-w-none">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setQueuedFiles(prev => prev.filter((_, i) => i !== index))}
                        className="text-gray-500 hover:text-red-500 flex-shrink-0"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <LiquidGlassButton
                  onClick={() => processQueuedFiles('', Date.now().toString())}
                  variant="primary"
                  size="sm"
                >
                  Send {queuedFiles.length} file{queuedFiles.length > 1 ? 's' : ''}
                </LiquidGlassButton>
              </LiquidGlassCard>
            </div>
          </div>
        )}



        {/* Input Area - Centered at bottom */}
        <div className="w-full bg-gradient-to-t from-white via-white to-transparent dark:from-[#212121] dark:via-[#212121] dark:to-transparent pt-6 pb-4 px-4 sticky bottom-0">
          <div className="max-w-3xl mx-auto relative">
            <TutorInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              loading={loading}
              onFileUpload={handleFileUpload}
              onRemoveFile={(index) => setQueuedFiles(prev => prev.filter((_, i) => i !== index))}
              queuedFiles={queuedFiles}
              onVoiceInput={handleVoiceInput}
              messageUsed={dailyUsage}
              messageLimit={limits.dailyAiMessages}
            />
            <div className="text-center mt-2 pb-1">
              <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">brAIny can make mistakes. Check important info.</span>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>

      {/* Quiz Modal */}
      <QuizModal
        isOpen={!!currentQuiz}
        onClose={() => setCurrentQuiz(null)}
        content={currentQuiz || ''}
        onComplete={() => {
          setCurrentQuiz(null)
          // Optionally trigger some completion action
        }}
      />

      {/* Flashcard Modal */}
      <FlashcardModal
        isOpen={!!currentFlashcard}
        onClose={() => setCurrentFlashcard(null)}
        content={currentFlashcard || ''}
        onComplete={() => {
          setCurrentFlashcard(null)
          // Optionally trigger some completion action
        }}
      />

      {/* Rate limit – New Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName={upgradeFeatureName}
        requiredTier={upgradeTarget}
      />
    </PremiumBackground>
  )
}
