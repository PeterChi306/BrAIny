'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { BottomNavigation } from '@/components/BottomNavigation'
import { TierBadge, GlowingName, PrestigeBorder, PremiumBackground } from '@/components/ui/PremiumUI'
import { CountUp } from '@/components/ui/count-up'
import { checkAndResetStreak } from '@/lib/login-streak'
import { updateStudyStreak, getCurrentStreak } from '@/lib/streak'
import { useConversationData } from '@/lib/conversation-data'
import { EncouragementText } from '@/components/TypingAnimation'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useUserTier } from '@/contexts/UserTierContext'
import { LoadingScreen } from '@/components/LoadingScreen'
import { useSwipeGestures } from '@/lib/swipe-gestures'
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
  Activity,
  Infinity as InfinityIcon,
  Fingerprint,
  AlertTriangle,
  X,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { getLearningDNA, LearningDNA } from '@/lib/adaptive-learning'
import { notificationService } from '@/lib/notifications'
import { smartReminders } from '@/lib/smart-reminders'


export default function HomePage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [inputText, setInputText] = useState('')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [queuedFiles, setQueuedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get user profile for display name
  const { displayName, refreshProfile } = useUserProfile()
  const { userTier, isLoading: tierLoading } = useUserTier()
  const [editingName, setEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState(displayName)
  const [savingName, setSavingName] = useState(false)

  // Add swipe gestures
  const swipeGestures = useSwipeGestures({
    onSwipeLeft: () => router.push('/planner'),
    onSwipeRight: () => router.push('/you'),
    threshold: 75
  })

  useEffect(() => {
    console.log('👤 Display name updated:', displayName)
    setEditNameValue(displayName)
  }, [displayName])

  const handleSaveName = async () => {
    if (!editNameValue.trim() || editNameValue === displayName) {
      console.log('❌ No changes made - cancelling')
      setEditingName(false)
      return
    }

    setSavingName(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        console.log('💾 Saving display name:', editNameValue.trim(), 'for user:', user.id)
        console.log('🔄 Current display name:', displayName)

        const { error, data } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            display_name: editNameValue.trim(),
            updated_at: new Date().toISOString()
          })
          .select()

        if (error) {
          console.error('❌ Database error:', error)
          throw error
        }

        console.log('✅ Display name saved successfully:', data)

        // Force refresh the profile
        await refreshProfile()

        // Wait a moment for the refresh to complete
        setTimeout(() => {
          console.log('🔄 After refresh - checking if name changed')
          setEditingName(false)
        }, 500)
      }
    } catch (error) {
      console.error('❌ Error updating display name:', error)
      alert('Failed to update name. Please try again.')
    } finally {
      setSavingName(false)
    }
  }

  const [realData, setRealData] = useState({
    streak: 0,
    conceptsUnlocked: 0,
    currentSession: null as any,
    weakSpots: [] as any[],
    strengths: [] as any[],
    isAnalyzing: false
  })
  const [performanceSummary, setPerformanceSummary] = useState({
    weakestSubject: 'Analyzing...',
    strongestSubject: 'Analyzing...',
    conceptCount: 0
  })
  const [learningDNA, setLearningDNA] = useState<LearningDNA | null>(null)
  const [studyReminder, setStudyReminder] = useState<{ id: string; title: string; message: string } | null>(null)
  const [learningVelocity, setLearningVelocity] = useState(0)

  const handleChatTransition = useCallback(async () => {
    if ((!inputText.trim() && queuedFiles.length === 0) || isTransitioning) return

    setIsTransitioning(true)

    try {
      // Navigate to tutor with the message and any files
      const messageText = inputText.trim() || (queuedFiles.length > 0 ? 'I need help with this document' : '')
      const tutorUrl = `/tutor?new=true&message=${encodeURIComponent(messageText)}`

      if (queuedFiles.length > 0) {
        // If there are files, we'll need to handle them after navigation
        // Store files in sessionStorage for the tutor page to pick up
        const fileData = await Promise.all(
          queuedFiles.map(async (file) => {
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.readAsDataURL(file)
            })
            return {
              name: file.name,
              type: file.type,
              size: file.size,
              data: base64
            }
          })
        )
        sessionStorage.setItem('queuedFiles', JSON.stringify(fileData))
      }

      router.push(tutorUrl)
    } catch (error) {
      console.error('Error preparing files:', error)
      alert('Failed to prepare files. Please try again.')
    } finally {
      setIsTransitioning(false)
    }
  }, [inputText, isTransitioning, queuedFiles, router])

  const handleFileUpload = async (files: File[]) => {
    try {
      // Check upload limits based on tier (same logic as tutor page)
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

      // Add files to queue
      setQueuedFiles(prev => [...prev, ...files])
      console.log('📁 Files queued:', files.map(f => f.name))

    } catch (error) {
      console.error('File upload failed:', error)
      alert('File upload failed. Please try again.')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(Array.from(files))
    }
    e.target.value = '' // reset so same file can be selected again
  }

  const handleSendToTutor = async () => {
    if (!inputText.trim() && queuedFiles.length === 0) return

    try {
      // Navigate to tutor with the message and any files
      const tutorUrl = `/tutor?new=true&message=${encodeURIComponent(inputText.trim())}`

      if (queuedFiles.length > 0) {
        // If there are files, we'll need to handle them after navigation
        // Store files in sessionStorage for the tutor page to pick up
        const fileData = await Promise.all(
          queuedFiles.map(async (file) => {
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.readAsDataURL(file)
            })
            return {
              name: file.name,
              type: file.type,
              size: file.size,
              data: base64
            }
          })
        )
        sessionStorage.setItem('queuedFiles', JSON.stringify(fileData))
      }

      router.push(tutorUrl)
    } catch (error) {
      console.error('Error preparing files:', error)
      alert('Failed to prepare files. Please try again.')
    }
  }

  useEffect(() => {
    const loadRealData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/auth/login')
          return
        }

        // Load Adaptive Learning DNA
        getLearningDNA(session.user.id, supabase)
          .then(dna => setLearningDNA(dna))
          .catch(err => console.warn('DNA Background fetch error:', err))

        await checkAndResetStreak(session.user.id)
        
        const streakData = await getCurrentStreak(session.user.id)
        const streak = streakData.streak

        const { count: chatCount } = await supabase
          .from('chats')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
        const conceptsUnlocked = chatCount || 0

        const { data: currentChat } = await supabase
          .from('chats')
          .select('id, subject, updated_at')
          .eq('user_id', session.user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        const { data: userChats } = await supabase
          .from('chats')
          .select('id, subject, title')
          .eq('user_id', session.user.id)
          .order('updated_at', { ascending: false })
        const chatList = userChats || []
        const chatIds = chatList.map(c => c.id)

        // --- 🧠 Neural Diagnostic Logic: Work on these ---
        let weakSpots: any[] = []
        try {
          const { data: analysisData } = await supabase
            .from('weak_spot_analysis')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (analysisData?.analysis_data?.weak_spots?.length > 0) {
            weakSpots = analysisData.analysis_data.weak_spots.map((ws: any) => ({
              topic: ws.concept || ws.topic,
              subject: ws.subject,
              accuracy: ws.accuracy || 65,
              chatId: ws.chat_id || chatList.find(c => c.subject === ws.subject || c.title?.includes(ws.concept))?.id,
              suggestions: ws.improvement_suggestions
            }))
            
            setPerformanceSummary({
              weakestSubject: weakSpots[0]?.subject || 'None identified',
              strongestSubject: 'High Performance',
              conceptCount: analysisData.analysis_data.weak_spots.length || weakSpots.length
            })
          } else {
            const { data: perfData } = await supabase
              .from('user_performance')
              .select('*')
              .eq('user_id', session.user.id)
              .order('average_score', { ascending: true })
            
            if (perfData && perfData.length > 0) {
              weakSpots = perfData
                .filter((p: any) => p.average_score < 0.7)
                .map((p: any) => ({
                  topic: p.topic || p.subject,
                  subject: p.subject,
                  accuracy: Math.round((p.average_score || 0) * 100),
                  chatId: chatList.find(c => c.subject === p.subject || c.title?.includes(p.topic))?.id
                }))

              const strengths = perfData.filter((p: any) => p.average_score >= 0.85)
              
              setPerformanceSummary({
                weakestSubject: weakSpots[0]?.subject || 'None identified',
                strongestSubject: strengths[0]?.subject || 'None identified',
                conceptCount: perfData.length
              })
            } else {
              setPerformanceSummary({ 
                weakestSubject: 'No Data Yet', 
                strongestSubject: 'No Data Yet', 
                conceptCount: conceptsUnlocked || chatList.length || 0 
              })
            }
          }

          // Fallback to recent chats if no weak spots found
          if (weakSpots.length === 0) {
            const { data: recentChats } = await supabase
              .from('chats')
              .select('id, title, subject')
              .eq('user_id', session.user.id)
              .order('updated_at', { ascending: false })
              .limit(5)

            if (recentChats && recentChats.length > 0) {
              weakSpots = recentChats.map(chat => ({
                topic: chat.title || chat.subject || 'Recent Topic',
                subject: chat.subject || 'Learning',
                chatId: chat.id,
                accuracy: null
              }))
            }
          }
        } catch (diagError) {
          console.warn('Diagnostic error:', diagError)
        }

        // --- Notifications & Reminders ---
        try {
          const { data: reminders } = await supabase
            .from('notifications')
            .select('id, title, message')
            .eq('user_id', session.user.id)
            .eq('reminder_type', 'deadline')
            .eq('is_sent', false)
            .lte('scheduled_for', new Date().toISOString())
            .limit(1)

          if (reminders?.[0]) {
            setStudyReminder(reminders[0])
            const hasPermission = await notificationService.requestPermission()
            if (hasPermission) {
              await notificationService.show({ id: reminders[0].id, title: reminders[0].title, body: reminders[0].message })
              await smartReminders.markAsSent(reminders[0].id)
              setStudyReminder(null)
            }
          }
        } catch (reminderError) { }

        // --- Velocity & Final State ---
        try {
          const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          const { count: recentMsgs } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .in('chat_id', chatIds)
            .eq('role', 'user')
            .gte('created_at', past24h)
          setLearningVelocity(Math.min(100, (recentMsgs || 0) * 5))
        } catch (vError) {}

        setRealData({
          streak,
          conceptsUnlocked,
          currentSession: currentChat ? { id: currentChat.id, topic: currentChat.subject || 'Current Topic', message_count: 0, last_message_at: currentChat.updated_at } : null,
          weakSpots: weakSpots.slice(0, 3),
          strengths: [],
          isAnalyzing: false
        })

        if (userTier === 'legend' && weakSpots.length === 0) {
          fetch('/api/weak-spots/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizzes: [], performance: [], subjects: [] }) }).catch(() => {})
        }
      } catch (error) {
        console.error('Error loading real data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRealData()
  }, [supabase])

  if (loading) {
    return <LoadingScreen message="Loading your dashboard..." />
  }

  const displayData = {
    streak: realData.streak,
    conceptsUnlocked: realData.conceptsUnlocked,
    currentSession: realData.currentSession,
    weakSpots: realData.weakSpots,
    isAnalyzing: realData.isAnalyzing,
    insights: [] // Not used in display
  }

  return (
    <PremiumBackground>
      <div 
        className="px-4 sm:px-6 py-6 sm:py-8 max-w-6xl mx-auto space-y-6 sm:space-y-8 relative z-10 min-h-screen pb-24 lg:pb-8 safe-area-pb"
        {...swipeGestures}
      >
        {/* Header with Premium Editable Name - Fixed Layout */}
        <div className="text-center py-4 sm:py-8">
          <div className="inline-flex items-center justify-center flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {editingName ? (
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <input
                    type="text"
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveName()
                      } else if (e.key === 'Escape') {
                        setEditingName(false)
                        setEditNameValue(displayName)
                      }
                    }}
                    className="text-2xl sm:text-4xl font-bold bg-transparent border-b-2 border-blue-600 text-blue-600 focus:outline-none text-center min-w-[140px] sm:min-w-[200px]"
                    autoFocus
                    maxLength={30}
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1 text-green-600 hover:bg-green-100 rounded"
                    title="Save"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false)
                      setEditNameValue(displayName)
                    }}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                    title="Cancel"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
                    {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, <span
                      className="cursor-pointer hover:underline text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400"
                      onClick={() => {
                        setEditingName(true)
                        setEditNameValue(displayName)
                      }}
                      title="Click to edit name"
                    ><GlowingName>{displayName || 'Scholar'}</GlowingName></span>!
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg font-medium " style={{ animationDelay: '0.1s' }}>
                    {displayData.streak > 3 
                      ? "Let’s fix what you don’t understand! 🛠️" 
                      : "Ready to unlock your full potential today? 🚀"}
                  </p>
                </>
              )
            }
          </div>
          <div className="flex flex-col items-center gap-2 justify-center mt-2">
            {!tierLoading && (
              <TierBadge size="md" onClick={() => router.push('/subscription')} className="cursor-pointer" />
            )}
            {userTier === 'starter' && (
              <button 
                onClick={() => router.push('/subscription')}
                className="text-[10px] font-black text-blue-500 uppercase tracking-widest animate-pulse hover:text-blue-400 transition-all bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.2)] active:scale-95 mt-1"
              >
                Become a Serious Learner
              </button>
            )}
          </div>
        </div>
      </div>

        {/* Study reminder banner (from Planner) */}
        {studyReminder && (
          <div className=" max-w-2xl mx-auto mb-4" style={{ animationDelay: '0.2s' }}>
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 dark:from-amber-600/20 dark:to-orange-600/20 rounded-2xl p-4 border border-amber-300/50 dark:border-amber-600/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{studyReminder.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{studyReminder.message}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const match = studyReminder.title.match(/Study reminder: (.+)/)
                  const topic = match ? match[1] : studyReminder.title
                  router.push(`/tutor?message=${encodeURIComponent(`I need to study for ${topic}. Can you help me prepare?`)}&new=true`)
                  setStudyReminder(null)
                }}
                className="px-4 py-2 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors flex-shrink-0"
              >
                Study now
              </button>
            </div>
          </div>
        )}

        {/* Premium Stats - Fixed Layout */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6  max-w-2xl mx-auto mb-4" style={{ animationDelay: '0.3s' }}>
          <div className="liquid-glass rounded-3xl p-6 text-center border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300 group cursor-pointer"
            onClick={() => router.push('/streak')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-3 group-hover:rotate-12 transition-transform duration-300 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
              <Flame className="w-5 h-5 text-gray-700 dark:text-white" />
            </div>
            <CountUp
              end={displayData.streak || 0}
              className="text-2xl font-bold text-gray-900 dark:text-white text-glow group-hover:text-orange-400 transition-colors"
            />
            <p className="text-xs text-gray-600 dark:text-white/50 font-normal">Learning streak</p>
          </div>

          <div className="liquid-glass rounded-3xl p-6 text-center border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300 group cursor-pointer relative overflow-hidden"
            onClick={() => router.push('/progress')}>
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-3 group-hover:rotate-12 transition-transform duration-300 shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                <Zap className="w-5 h-5 text-gray-700 dark:text-white" />
              </div>
              <div className="text-center">
                <CountUp
                  end={displayData.conceptsUnlocked || 0}
                  className="text-2xl font-bold text-gray-900 dark:text-white text-glow group-hover:text-blue-400 transition-colors"
                />
                <p className="text-xs text-gray-600 dark:text-white/50 font-normal">Concepts unlocked</p>
              </div>
            </div>
            {/* Velocity Pulse Background */}
            <div 
              className="absolute inset-x-0 bottom-0 bg-blue-500/10 transition-all duration-1000"
              style={{ height: `${learningVelocity}%`, opacity: 0.3 }}
            />
          </div>
        </div>

        {/* Jump back in - Continue Current Session */}
        {displayData.currentSession && displayData.currentSession.id && (
          <div className="max-w-2xl mx-auto mb-6 " style={{ animationDelay: '0.35s' }}>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2 text-center">Keep going</h3>
            <div className="glass-purple rounded-2xl p-4 shadow-xl shadow-purple-500/20 border border-purple-200/50 dark:border-purple-700/50  relative overflow-hidden">
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 pointer-events-none"></div>

              <button
                onClick={() => router.push(`/tutor?chatId=${displayData.currentSession.id}`)}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-5 rounded-xl font-bold text-base hover:from-purple-700 hover:to-purple-800 transition-all duration-300 flex items-center justify-center gap-3 group shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-purple-500/40 relative z-10"
              >
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <span className="block text-white font-bold text-lg drop-shadow-lg">Resume Session</span>
                  <p className="text-xs text-purple-200 font-normal mt-0.5 drop-shadow-sm">Pick up where you left off</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-purple-200 font-medium">
                    {new Date(displayData.currentSession.last_message_at).toLocaleDateString()}
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Get Started - For New Accounts */}
        {!displayData.currentSession && (
          <div className="max-w-2xl mx-auto mb-6 " style={{ animationDelay: '0.35s' }}>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2 text-center">Let's start</h3>
            <div className="glass-purple rounded-2xl p-4 shadow-xl shadow-purple-500/20 border border-purple-200/50 dark:border-purple-700/50  relative overflow-hidden">
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 pointer-events-none"></div>

              <button
                onClick={() => router.push('/tutor?new=true')}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-5 rounded-xl font-bold text-base hover:from-purple-700 hover:to-purple-800 transition-all duration-300 flex items-center justify-center gap-3 group shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-purple-500/40 relative z-10"
              >
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="text-left flex-1">
                  <span className="block">Start Learning</span>
                  <p className="text-xs text-purple-200 font-normal mt-0.5">Your AI tutor is ready</p>
                </div>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </button>
            </div>
          </div>
        )}


        {/* Premium Quick Actions - Fixed Layout */}
        <div className="space-y-6  max-w-4xl mx-auto" style={{ animationDelay: '0.4s' }}>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-6 text-glow">Quick start</h3>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <button
              onClick={() => router.push('/scan')}
              className="liquid-glass rounded-2xl p-4 sm:p-6 text-left hover:scale-[1.05] transition-all duration-500 group border border-white/10 hover:border-white/30"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-500 shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                <Upload className="w-6 h-6 text-gray-700 dark:text-white group-hover:rotate-12 transition-transform" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-400 transition-colors">Scan</h4>
              <p className="text-xs text-gray-600 dark:text-white/50">Snap & solve</p>
            </button>

            <button
              onClick={() => router.push('/planner')}
              className="liquid-glass rounded-2xl p-4 sm:p-6 text-left hover:scale-[1.05] transition-all duration-500 group border border-white/10 hover:border-white/30"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-500 shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                <Calendar className="w-6 h-6 text-gray-700 dark:text-white group-hover:rotate-12 transition-transform" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-400 transition-colors">Planner</h4>
              <p className="text-xs text-gray-600 dark:text-white/50">Study schedule</p>
            </button>

            <button
              onClick={() => router.push('/progress')}
              className="liquid-glass rounded-2xl p-4 sm:p-6 text-left hover:scale-[1.05] transition-all duration-500 group border border-white/10 hover:border-white/30"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <TrendingUp className="w-6 h-6 text-gray-700 dark:text-white group-hover:rotate-12 transition-transform" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-emerald-400 transition-colors">Progress</h4>
              <p className="text-xs text-gray-600 dark:text-white/50">Tracking growth</p>
            </button>

            <button
              onClick={() => router.push('/you')}
              className="liquid-glass rounded-2xl p-4 sm:p-6 text-left hover:scale-[1.05] transition-all duration-500 group border border-white/10 hover:border-white/30"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                <User className="w-6 h-6 text-gray-700 dark:text-white group-hover:rotate-12 transition-transform" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-orange-400 transition-colors">You</h4>
              <p className="text-xs text-gray-600 dark:text-white/50">Your profile</p>
            </button>
          </div>
        </div>

        {/* 🧠 Evolutionary Neural Diagnostics: Work on these */}
        {(displayData.weakSpots.length > 0 || performanceSummary.conceptCount > 0) && (
          <div className="max-w-4xl mx-auto space-y-4" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center justify-between px-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                  <Fingerprint className="w-5 h-5 text-orange-500" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Work on these</h3>
                  <div className="flex items-center gap-2 opacity-30 dark:opacity-30">
                    <span className="text-[9px] font-black uppercase tracking-[.25em] text-slate-900 dark:text-white">Neural Diagnostics</span>
                    <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-white"></span>
                    <span className="text-[9px] font-black uppercase tracking-[.25em] text-slate-900 dark:text-white">Real-Time</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md h-9 px-4 rounded-full border border-black/5 dark:border-white/10 flex items-center gap-2.5 shadow-xl transition-all hover:bg-white/10 group">
                <div className="relative">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 group-hover:scale-125 transition-transform" />
                  <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping opacity-75" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/50 leading-none pb-[1px]">
                  {performanceSummary.conceptCount} Topics Tracked
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {displayData.weakSpots.length > 0 ? (
                displayData.weakSpots.slice(0, 3).map((spot, index) => (
                  <button 
                    key={`weak-spot-${index}`} 
                    onClick={() => {
                      const message = spot.accuracy !== null 
                        ? `Hey Brainy, I noticed I'm struggling with "${spot.topic}" in ${spot.subject} (my accuracy is around ${spot.accuracy}%). Can you help me figure out exactly what I'm missing and fix my mental model?`
                        : `I've been studying "${spot.topic}"! I'm ready to take a quiz to verify my mastery and see where I stand.`
                      
                      if (spot.chatId) {
                        router.push(`/tutor?chatId=${spot.chatId}&message=${encodeURIComponent(message)}`)
                      } else {
                        router.push(`/tutor?new=true&message=${encodeURIComponent(message)}`)
                      }
                    }}
                    className="group relative w-full text-left overflow-hidden bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-black/5 dark:border-white/10 hover:border-orange-500/30 transition-all duration-500 hover:shadow-[0_0_30px_rgba(249,115,22,0.1)] active:scale-[0.98]"
                  >
                    {/* Animated Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    <div className="relative z-10 flex items-center justify-between gap-3">
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-[.3em] text-orange-500/80 leading-none">
                            {spot.subject}
                          </p>
                          <h4 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-orange-600 dark:group-hover:text-orange-100 transition-colors leading-tight">
                            {spot.topic}
                          </h4>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                            <ArrowRight className="w-2.5 h-2.5 text-orange-500 group-hover:translate-x-1 transition-transform" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-orange-500">Resume Session</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {spot.accuracy !== null ? (
                          <div className="flex flex-col items-end gap-1.5">
                             <div className="flex items-baseline gap-1">
                               <span className="text-2xl font-black text-white tracking-tighter">{spot.accuracy}%</span>
                               <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Score</span>
                             </div>
                             <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                               <div 
                                 className="h-full bg-gradient-to-r from-orange-400 to-red-600 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(249,115,22,0.3)]"
                                 style={{ width: `${spot.accuracy}%` }}
                               />
                             </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2.5 group-hover:bg-white/10 transition-colors">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center border border-orange-500/20">
                              <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
                            </div>
                            <div className="text-right">
                              <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest leading-none mb-0.5">Unverified</p>
                              <p className="text-xs font-bold text-white leading-none">New Topic</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center p-16 bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 border-dashed">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10">
                    <Brain className="w-8 h-8 text-white/20" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Your Neural Diagnostic is clean</h4>
                  <p className="text-sm text-white/40 max-w-xs mx-auto">Take a quiz or deep-dive into a subject to start mapping your knowledge gaps.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Achievement Progress - Enhanced Layout */}
        <div className="glass-hologram rounded-3xl p-8 shadow-glow-green  max-w-4xl mx-auto border border-white/20" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-glow">Your progress</h3>
            </div>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-6 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-white/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CountUp
                  end={displayData.weakSpots.length}
                  className="text-3xl font-bold text-gray-900 dark:text-white text-glow"
                />
                <Activity className="w-4 h-4 text-orange-500 animate-pulse" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Neural gaps</p>
            </div>
            <div className="text-center p-6 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-white/20">
              <CountUp
                end={displayData.conceptsUnlocked || 0}
                className="text-3xl font-bold text-gray-900 dark:text-white text-glow mb-2"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Concepts unlocked</p>
            </div>
          </div>
        </div>

        {/* Premium Input - Same style as tutor: single rounded bar, no inner box */}
        <div
          className={`fixed left-0 right-0 lg:left-20 px-4 sm:px-8 z-40 transition-all duration-500 ease-out bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:bottom-6 ${
            isTransitioning ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="relative max-w-2xl mx-auto">
            <div className="relative flex items-center gap-2 sm:gap-3 liquid-glass !bg-white/10 !backdrop-blur-3xl rounded-3xl px-4 sm:px-5 py-3 border border-white/20 shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 min-h-[64px]">
              {/* Upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors duration-200"
                aria-label="Upload file"
              >
                <Upload className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputText.trim()) {
                    e.preventDefault()
                    handleChatTransition()
                  }
                }}
                placeholder="Ask or learn something new"
                className="w-full bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base sm:text-lg outline-none border-0 focus:outline-none focus:ring-0 focus:border-0 caret-transparent"
                style={{
                  background: 'transparent',
                  boxShadow: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none',
                  WebkitBoxShadow: 'none',
                  MozBoxShadow: 'none',
                  caretColor: 'transparent',
                  WebkitTapHighlightColor: 'transparent',
                  WebkitUserSelect: 'text',
                  userSelect: 'text',
                  WebkitBorderRadius: '0px',
                  borderRadius: '0px',
                  border: 'none',
                  outline: 'none',
                  outlineStyle: 'none',
                  outlineWidth: '0px',
                  outlineColor: 'transparent',
                  borderWidth: '0px',
                  borderColor: 'transparent',
                  borderStyle: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => (inputText.trim() || queuedFiles.length > 0) && handleChatTransition()}
                disabled={(!inputText.trim() && queuedFiles.length === 0) || isTransitioning}
                className="flex-shrink-0 p-2.5 sm:p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-lg"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />

            {/* Beautiful File Queue Display */}
            {queuedFiles.length > 0 && (
              <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 ">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
                    <Upload className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {queuedFiles.length} file{queuedFiles.length > 1 ? 's' : ''} ready to send
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {queuedFiles.map((file, index) => (
                    <div
                      key={`home-file-${index}`}
                      className="group relative flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-700 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          {file.type.startsWith('image/') ? (
                            <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-400 to-blue-600" />
                          ) : (
                            <FileText className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div className="max-w-[120px]">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setQueuedFiles(prev => prev.filter((_, i) => i !== index))}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110"
                        aria-label="Remove file"
                      >
                        <span className="text-xs font-bold">×</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="mt-2 text-center ">
            {/* EncouragementText removed */}
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex justify-center gap-2 mt-2 " style={{ animationDelay: '0.2s' }}>
            <button
              onClick={() => {
                setInputText('Review yesterday')
                setTimeout(() => {
                  handleChatTransition()
                }, 100)
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-600/70 to-blue-700/70 hover:from-blue-700/70 hover:to-blue-800/70 text-white rounded-full text-sm transition-all duration-300 border border-blue-500/30 shadow-lg hover:shadow-xl hover:scale-105 hover:shadow-blue-500/25 backdrop-blur-sm"
            >
              Review yesterday
            </button>
            <button
              onClick={() => {
                setInputText('Learn a new concept')
                setTimeout(() => {
                  handleChatTransition()
                }, 100)
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-600/70 to-purple-700/70 hover:from-purple-700/70 hover:to-purple-800/70 text-white rounded-full text-sm transition-all duration-300 border border-purple-500/30 shadow-lg hover:shadow-xl hover:scale-105 hover:shadow-purple-500/25 backdrop-blur-sm"
            >
              Learn new
            </button>
            <button
              onClick={() => {
                setInputText('Take a quick quiz')
                setTimeout(() => {
                  handleChatTransition()
                }, 100)
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-green-600/70 to-green-700/70 hover:from-green-700/70 hover:to-green-800/70 text-white rounded-full text-sm transition-all duration-300 border border-green-500/30 shadow-lg hover:shadow-xl hover:scale-105 hover:shadow-green-500/25 backdrop-blur-sm"
            >
              Quick quiz
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-b from-transparent via-white/10 to-white/20 dark:from-transparent via-gray-900/10 to-gray-900/20 backdrop-blur-md -z-10"></div>
        </div>
      </div>

      <BottomNavigation />
    </PremiumBackground>
  )
}
