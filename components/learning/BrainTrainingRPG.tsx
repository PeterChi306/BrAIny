'use client'

import { useState, useEffect, useMemo } from 'react'
import { learningIntelligence } from '@/lib/learning-intelligence'
import { learningFeedbackSystem } from '@/lib/learning-feedback'
import { getCurrentStreak } from '@/lib/streak'
import { createSupabaseClient } from '@/lib/supabase/client'
import { 
  Brain, 
  Zap, 
  Target, 
  Shield, 
  Sword, 
  Flame, 
  TrendingUp, 
  Award, 
  Star, 
  Crown,
  Sparkles,
  Trophy,
  Medal,
  Gem,
  Lock,
  Unlock,
  Heart,
  Activity,
  Map,
  X,
  Rocket,
  Globe,
  Moon,
  Sun,
  Circle,
  Gift,
  Calendar,
  BookOpen,
  Satellite,
  CheckCircle
} from 'lucide-react'

interface BrainLevel {
  level: number
  title: string
  currentXP: number
  requiredXP: number
  progress: number
}

interface DailyQuest {
  id: string
  title: string
  description: string
  xpReward: number
  completed: boolean
  progress: number
  maxProgress: number
  rewardClaimed: boolean
  category?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  emotionalFeedback?: string
  stages?: QuestStage[]
  // 🚀 CRITICAL FIX: Store quest functions for progress updates
  checkCompletion?: (data: any) => boolean
  getProgress?: (data: any) => number
}

interface QuestStage {
  id: string
  title: string
  description: string
  xpReward: number
  completed: boolean
  progress: number
  maxProgress: number
}

interface QuestHistory {
  questId: string
  date: string
  completed: boolean
}

interface WeakSpotBoss {
  concept: string
  health: number
  maxHealth: number
  defeated: boolean
  requiredQuizzes: number
}

interface SkillNode {
  id: string
  name: string
  mastered: boolean
  locked: boolean
  inProgress: boolean
  progress: number
  quizCount: number
  children: string[]
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  unlocked: boolean
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockedAt?: Date
}

// --- Premium Planet Renderer ---
const PlanetRenderer = ({ theme, color, className }: { theme: string, color: string, className?: string }) => {
  // Advanced CSS planets for high premium feel
  switch (theme) {
    case 'earth':
      return (
        <div className={`relative rounded-full overflow-hidden ${className} ring-1 ring-white/20`} style={{ background: `radial-gradient(circle at 30% 30%, #3B82F6, #1E40AF)` }}>
          <div className="absolute top-1/4 left-1/4 w-1/3 h-1/4 bg-white/40 rounded-full blur-[4px] animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-1/2 h-1/5 bg-emerald-500/60 rounded-full blur-[3px]" />
          <div className="absolute top-1/2 left-1/2 w-1/4 h-1/4 bg-emerald-400/40 rounded-full blur-[2px]" />
        </div>
      )
    case 'moon':
      return (
        <div className={`relative rounded-full overflow-hidden ${className} ring-1 ring-white/5`} style={{ background: `radial-gradient(circle at 30% 30%, #94A3B8, #475569)` }}>
          <div className="absolute top-1/4 left-1/3 w-1/6 h-1/6 bg-black/20 rounded-full opacity-40 blur-[0.5px]" />
          <div className="absolute bottom-1/4 right-1/3 w-1/8 h-1/8 bg-black/20 rounded-full opacity-40 blur-[0.5px]" />
          <div className="absolute top-1/2 left-1/4 w-1/10 h-1/10 bg-black/15 rounded-full opacity-40" />
        </div>
      )
    case 'sun':
      return (
        <div className={`relative rounded-full overflow-hidden ${className} shadow-[0_0_20px_rgba(245,158,11,0.5)]`} style={{ background: `radial-gradient(circle at 30% 30%, #FCD34D, #F59E0B, #D97706)` }}>
          <div className="absolute inset-0 bg-white/20 blur-[10px] animate-pulse" />
          <div className="absolute inset-1 border border-white/10 rounded-full blur-[1px]" />
        </div>
      )
    case 'jupiter':
      return (
        <div className={`relative rounded-full overflow-hidden ${className} ring-1 ring-white/10`} style={{ background: `radial-gradient(circle at 30% 30%, #FB923C, #7C2D12)` }}>
          <div className="absolute inset-0 flex flex-col justify-between opacity-50 py-1">
            <div className="h-[8%] bg-orange-900/40" />
            <div className="h-[12%] bg-orange-100/15" />
            <div className="h-[8%] bg-orange-800/30" />
            <div className="h-[10%] bg-orange-200/5" />
          </div>
          <div className="absolute bottom-1/3 right-[20%] w-[30%] h-[18%] bg-orange-800 rounded-[60%] blur-[0.5px] opacity-90 shadow-inner" title="Great Red Spot" />
          <div className="absolute top-[15%] left-[15%] w-[30%] h-[30%] bg-white/10 rounded-full blur-[5px]" />
        </div>
      )
    case 'mars':
      return (
        <div className={`relative rounded-full overflow-hidden ${className} ring-1 ring-white/10`} style={{ background: `radial-gradient(circle at 30% 30%, #EF4444, #7F1D1D)` }}>
          <div className="absolute top-1/3 right-1/4 w-[20%] h-[20%] bg-black/25 rounded-full blur-[1.5px]" />
          <div className="absolute bottom-1/4 left-1/3 w-[15%] h-[15%] bg-black/20 rounded-full blur-[1px]" />
          <div className="absolute inset-0 bg-white/5 mix-blend-overlay" />
        </div>
      )
    case 'saturn':
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
           <div className="absolute w-[180%] h-[35%] border-[3px] border-amber-200/40 rounded-[100%] rotate-[20deg] z-0" />
           <div className="absolute w-[150%] h-[20%] border border-amber-300/20 rounded-[100%] rotate-[20deg] z-10" />
           <div className="w-full h-full rounded-full overflow-hidden relative z-20 ring-1 ring-white/10 shadow-2xl" style={{ background: `radial-gradient(circle at 30% 30%, #F59E0B, #451A03)` }}>
              <div className="absolute inset-x-0 top-[30%] h-[6%] bg-orange-900/30" />
              <div className="absolute inset-x-0 bottom-[40%] h-[10%] bg-white/10" />
           </div>
        </div>
      )
    default:
      return null
  }
}

interface BrainTrainingRPGProps {
  userId: string
}

// Creative space-themed planets with educational themes
const SPACE_PLANETS = [
  { level: 1, title: 'Earth Explorer', requiredXP: 0, theme: 'earth', color: '#10B981', icon: Globe, description: 'Begin your journey on home planet' },
  { level: 2, title: 'Lunar Pioneer', requiredXP: 100, theme: 'moon', color: '#6B7280', icon: Moon, description: 'Conquer the lunar surface' },
  { level: 3, title: 'Solar Voyager', requiredXP: 250, theme: 'sun', color: '#F59E0B', icon: Sun, description: 'Harness the power of the sun' },
  { level: 4, title: 'Martian Settler', requiredXP: 500, theme: 'mars', color: '#EF4444', icon: Circle, description: 'Establish the first colony' },
  { level: 5, title: 'Asteroid Miner', requiredXP: 1000, theme: 'asteroid', color: '#8B5CF6', icon: Star, description: 'Extract cosmic resources' },
  { level: 6, title: 'Jupiter Guardian', requiredXP: 2000, theme: 'jupiter', color: '#F97316', icon: Circle, description: 'Protect the gas giant' },
  { level: 7, title: 'Saturn Ring Master', requiredXP: 3500, theme: 'saturn', color: '#EAB308', icon: Circle, description: 'Master the ring system' },
  { level: 8, title: 'Cosmic Wanderer', requiredXP: 5000, theme: 'cosmos', color: '#8B5CF6', icon: Star, description: 'Explore the deep cosmos' },
  { level: 9, title: 'Nebula Navigator', requiredXP: 7500, theme: 'nebula', color: '#06B6D4', icon: Sparkles, description: 'Navigate stellar nurseries' },
  { level: 10, title: 'Galaxy Commander', requiredXP: 10000, theme: 'galaxy', color: '#6366F1', icon: Crown, description: 'Command entire galaxies' },
  { level: 11, title: 'Quasar Hunter', requiredXP: 15000, theme: 'quasar', color: '#A855F7', icon: Zap, description: 'Hunt cosmic energy sources' },
  { level: 12, title: 'Void Walker', requiredXP: 20000, theme: 'void', color: '#1F2937', icon: Circle, description: 'Master the empty void' },
  { level: 13, title: 'Dimension Traveler', requiredXP: 30000, theme: 'dimension', color: '#EC4899', icon: Rocket, description: 'Cross dimensional barriers' },
  { level: 14, title: 'Universe Creator', requiredXP: 50000, theme: 'universe', color: '#3B82F6', icon: Sparkles, description: 'Shape reality itself' },
  { level: 15, title: 'Cosmic Legend', requiredXP: 100000, theme: 'legendary', color: '#F59E0B', icon: Crown, description: 'Become one with the cosmos' }
]

export default function BrainTrainingRPG({ userId }: BrainTrainingRPGProps) {
  const [brainLevel, setBrainLevel] = useState<BrainLevel>({
    level: 1,
    title: 'Earth Explorer',
    currentXP: 0,
    requiredXP: 100,
    progress: 0
  })
  
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([])
  const [weakSpotBosses, setWeakSpotBosses] = useState<WeakSpotBoss[]>([])
  const [momentumStreak, setMomentumStreak] = useState(0)
  const [realStreak, setRealStreak] = useState(0)
  const [skillTree, setSkillTree] = useState<SkillNode[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [weeklyEvolution, setWeeklyEvolution] = useState<any>(null)
  const [aiCoachMessage, setAiCoachMessage] = useState('')
  const [isLevelUp, setIsLevelUp] = useState(false)
  const [showXPGained, setShowXPGained] = useState(false)
  const [previousXP, setPreviousXP] = useState(0)
  const [previousLevel, setPreviousLevel] = useState(1)
  const [showLevelMap, setShowLevelMap] = useState(false)
  const [currentPlanetTheme, setCurrentPlanetTheme] = useState(SPACE_PLANETS[0])

  // Initialize Supabase client (shared instance)
  const supabase = createSupabaseClient()

  // Memoized current planet theme to prevent unnecessary recalculations
  const currentPlanet = useMemo(() => 
    SPACE_PLANETS.find(p => p.level === brainLevel.level) || SPACE_PLANETS[0],
    [brainLevel.level]
  )

  // Initialize last-seen level from localStorage so level-up animation
  // only shows once per level (not every time the page is opened)
  useEffect(() => {
    if (!userId || typeof window === 'undefined') return
    try {
      const key = `brain_level_seen_${userId}`
      const stored = window.localStorage.getItem(key)
      if (stored) {
        const parsed = parseInt(stored, 10)
        if (!Number.isNaN(parsed) && parsed > 0) {
          setPreviousLevel(parsed)
        }
      }
    } catch (error) {
      console.warn('Failed to read stored brain level:', error)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return

    const loadGameData = async () => {
      try {
        // Get REAL database streak (same as home page)
        const streakData = await getCurrentStreak(userId)
        setRealStreak(streakData.streak)

        // 📈 SIMPLE: Count user messages in all chats for XP
        // 1 user message = 10 XP (Duolingo-style)
        const { data: userChats, error: chatsError } = await supabase
          .from('chats')
          .select('id')
          .eq('user_id', userId)

        if (chatsError) {
          console.error('Error fetching user chats for XP:', chatsError)
          return
        }

        const chatIds = userChats?.map(chat => chat.id) || []

        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayISO = todayStart.toISOString()

        let messageCount = 0
        let interactionsToday = 0
        if (chatIds.length > 0) {
          // Total messages for lifetime XP
          const { count, error: messagesError } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .in('chat_id', chatIds)
            .eq('role', 'user')

          if (messagesError) {
            console.error('Error counting user messages for XP:', messagesError)
            return
          }
          messageCount = count || 0

          // Today's messages for daily quests
          const { count: countToday } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .in('chat_id', chatIds)
            .eq('role', 'user')
            .gte('created_at', todayISO)
          
          interactionsToday = countToday || 0
        }

        const totalXP = messageCount * 10  // 10 XP per user message

        // 🚀 CRITICAL FIX: Add quest XP rewards from localStorage
        let questXPRewards = 0
        if (typeof window !== 'undefined') {
          try {
            const xpKey = `quest_xp_rewards_${userId}`
            const storedRewards = JSON.parse(localStorage.getItem(xpKey) || '[]')
            questXPRewards = storedRewards.reduce((sum: number, reward: any) => sum + reward.xpReward, 0)
            console.log(`� Quest XP rewards loaded: ${questXPRewards} XP from ${storedRewards.length} completed quests`)
          } catch (error) {
            console.warn('Failed to load quest XP rewards:', error)
          }
        }

        const finalTotalXP = totalXP + questXPRewards

        console.log(`� Real XP calculation: ${messageCount} messages = ${totalXP} XP + ${questXPRewards} quest XP = ${finalTotalXP} total XP`)

        // 🎯 NEW: Count completed quizzes (total and today)
        let quizCount = 0
        let quizzesToday = 0
        try {
          const { count: quizzesCompleted } = await supabase
            .from('quizzes')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed')
          
          quizCount = quizzesCompleted || 0

          const { count: qt } = await supabase
            .from('quizzes')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('created_at', todayISO)
          
          quizzesToday = qt || 0
        } catch (e) {
          console.warn('Error counting quizzes for mastery:', e)
        }

        console.log(`🎯 Quiz mastery calculation: ${quizCount} quizzes completed`)

        // Load real mastery and weak-spot data from user_performance
        // average_score in DB is 0-1 (from quiz: finalScore/questions.length)
        let masteryScores: { concept: string; score: number }[] = []
        let weakConcepts: { topic: string; masteryLevel: number }[] = []

        try {
          const { data: performanceData, error: performanceError } = await supabase
            .from('user_performance')
            .select('subject, topic, average_score, weak_concepts, strong_concepts')
            .eq('user_id', userId)

          if (performanceError) {
            console.warn('Error loading user_performance for skill tree:', performanceError)
          } else if (performanceData) {
            performanceData.forEach((row: any) => {
              const topicName = row.topic || row.subject || 'General'
              const raw = row.average_score
              // Normalize: DB stores 0-1 from quizzes; convert to 0-100
              const mastery = raw == null ? 0 : (typeof raw === 'number' && raw <= 1 ? raw * 100 : Number(raw))

              if (topicName) {
                masteryScores.push({ concept: topicName, score: Math.round(mastery) })
              }

              // Weak spots: this topic is weak if mastery < 70
              if (mastery < 70) {
                weakConcepts.push({ topic: topicName, masteryLevel: Math.round(mastery) })
              }
              // Also add any weak_concepts from the row (with this row's mastery)
              if (Array.isArray(row.weak_concepts)) {
                row.weak_concepts.forEach((concept: string) => {
                  if (concept && !weakConcepts.some(w => w.topic === concept)) {
                    weakConcepts.push({ topic: concept, masteryLevel: Math.round(mastery) })
                  }
                })
              }
            })
          }
        } catch (perfError) {
          console.warn('Failed to load performance data for skill tree:', perfError)
        }

        // Calculate simple overall mastery and progress metrics
        const overallMastery =
          masteryScores.length > 0
            ? masteryScores.reduce((sum, m) => sum + m.score, 0) / masteryScores.length
            : 0

        const progressMetrics = {
          totalInteractions: messageCount,
          interactionsToday,
          quizzesToday,
          overallImprovement: 0, // Could be wired to historical data later
          recentTrend: overallMastery >= 70 ? 'improving' : 'stable',
          understandingRate: overallMastery / 100
        }

        const diagnosis = {
          currentWeaknesses: weakConcepts
        }

        // Weekly evolution: real data from last 7 days
        let weeklyStats = { xpThisWeek: 0, quizzesThisWeek: 0, skillsMastered: 0, bossesDefeated: 0 }
        try {
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          const weekAgoStr = weekAgo.toISOString()

          const { data: recentQuizzes } = await supabase
            .from('quizzes')
            .select('id, score, total_questions, topic')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('created_at', weekAgoStr)

          weeklyStats.quizzesThisWeek = recentQuizzes?.length || 0
          weeklyStats.skillsMastered = masteryScores.filter(m => m.score >= 80).length
          weeklyStats.bossesDefeated = weeklyStats.skillsMastered

          // XP this week = user messages in last 7 days * 10
          if (chatIds.length > 0) {
            const { count: messagesThisWeek } = await supabase
              .from('messages')
              .select('id', { count: 'exact', head: true })
              .in('chat_id', chatIds)
              .eq('role', 'user')
              .gte('created_at', weekAgoStr)
            weeklyStats.xpThisWeek = (messagesThisWeek || 0) * 10
          }
        } catch (e) {
          console.warn('Weekly stats error:', e)
        }

        // Calculate brain level from TOTAL XP (messages + quest rewards)
        const calculatedLevel = calculateBrainLevel(finalTotalXP)

        // 🎉 CHECK FOR LEVEL UP (only once per level per user)
        let lastSeenLevel = previousLevel
        let levelStorageKey: string | null = null
        if (typeof window !== 'undefined') {
          levelStorageKey = `brain_level_seen_${userId}`
          try {
            const stored = window.localStorage.getItem(levelStorageKey)
            if (stored) {
              const parsed = parseInt(stored, 10)
              if (!Number.isNaN(parsed) && parsed > 0) {
                lastSeenLevel = parsed
              }
            }
          } catch (storageError) {
            console.warn('Failed to read stored brain level in loadGameData:', storageError)
          }
        }

        if (calculatedLevel.level > lastSeenLevel) {
          setIsLevelUp(true)
          setPreviousLevel(calculatedLevel.level)

          if (levelStorageKey && typeof window !== 'undefined') {
            try {
              window.localStorage.setItem(levelStorageKey, String(calculatedLevel.level))
            } catch (storageError) {
              console.warn('Failed to store new brain level:', storageError)
            }
          }

          // Hide level up animation after 5 seconds
          setTimeout(() => {
            setIsLevelUp(false)
          }, 5000)
        }
        
        // 🎯 CHECK FOR XP GAIN!
        if (totalXP > previousXP && totalXP !== previousXP) {
          setShowXPGained(true)
          setPreviousXP(totalXP)
          
          // Hide XP gained animation after 3 seconds
          setTimeout(() => {
            setShowXPGained(false)
          }, 3000)
        }
        
        setBrainLevel(calculatedLevel)
        
        // Update planet theme based on level
        setCurrentPlanetTheme(currentPlanet)

        // 🚀 CRITICAL FIX: Check if we already have today's quests
        const today = new Date().toDateString()
        const dailyQuestsKey = `daily_quests_${userId}_${today}`
        
        let quests: DailyQuest[] = []
        let shouldGenerateNewQuests = true
        
        // Try to load today's quests from localStorage
        if (typeof window !== 'undefined') {
          try {
            const storedQuests = localStorage.getItem(dailyQuestsKey)
            if (storedQuests) {
              quests = JSON.parse(storedQuests)
              console.log(`📅 Loaded today's quests from storage: ${quests.length} quests`)
              shouldGenerateNewQuests = false
            }
          } catch (error) {
            console.warn('Failed to load daily quests from storage:', error)
          }
        }
        
        // Only generate new quests if we don't have today's quests
        if (shouldGenerateNewQuests) {
          console.log('🎯 Generating new quests for today')
          quests = generateDailyQuests(progressMetrics, diagnosis, streakData.streak, weeklyStats)
          
          // Save today's quests to localStorage
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(dailyQuestsKey, JSON.stringify(quests))
              console.log(`💾 Saved today's quests to storage: ${quests.length} quests`)
            } catch (error) {
              console.warn('Failed to save daily quests to storage:', error)
            }
          }
        }
        
        // 🚀 CRITICAL FIX: Update existing quest progress without regenerating
        if (quests.length > 0 && !shouldGenerateNewQuests) {
          console.log('🔄 Updating existing quest progress')
          quests = quests.map(quest => {
            // Update progress and completion status based on current metrics
            // Try to find original definitions to use their functions
            let checkFn = quest.checkCompletion
            let getProbFn = quest.getProgress
            
            if (!checkFn || !getProbFn) {
              const allQuests = Object.entries(QUEST_POOL).flatMap(([category, categoryQuests]) => 
                categoryQuests.map(q => ({ ...q, category }))
              )
              const originalQuest = allQuests.find(q => q.id === quest.id)
              if (originalQuest) {
                checkFn = originalQuest.checkCompletion
                getProbFn = originalQuest.getProgress
              }
            }
            
            const completed = checkFn ? 
              checkFn({ progressMetrics, diagnosis, realStreakCount: streakData.streak, weeklyStats }) : 
              quest.completed
            
            const progress = getProbFn ? 
              getProbFn({ progressMetrics, diagnosis, realStreakCount: streakData.streak, weeklyStats }) : 
              quest.progress
            
            return {
              ...quest,
              completed,
              progress,
              checkCompletion: checkFn,
              getProgress: getProbFn
            }
          })
          
          // Save updated progress to localStorage
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(dailyQuestsKey, JSON.stringify(quests))
            } catch (error) {
              console.warn('Failed to save updated quest progress:', error)
            }
          }
        }
        
        setDailyQuests(quests)

        // Create weak spot bosses from real weak concepts (based on quiz count)
        const bosses = createWeakSpotBosses(weakConcepts, quizCount)
        setWeakSpotBosses(bosses)

        // Calculate momentum streak from real progress metrics
        const momentum = calculateMomentumStreak(progressMetrics)
        setMomentumStreak(momentum)

        // Build skill tree from real mastery scores (based on quiz count)
        const skills = buildSkillTree(masteryScores, quizCount)
        setSkillTree(skills)

        // Generate achievements based on real mastery
        const achievementList = generateAchievements(progressMetrics, masteryScores)
        setAchievements(achievementList)

        // Calculate weekly evolution from real weekly stats and mastery
        const evolution = calculateWeeklyEvolution(progressMetrics, masteryScores, weeklyStats)
        setWeeklyEvolution(evolution)

        // Generate AI coach message from real diagnosis
        const coachMsg = generateCoachMessage(progressMetrics, diagnosis)
        setAiCoachMessage(coachMsg)

      } catch (error) {
        console.error('Error loading game data:', error)
      }
    }

    loadGameData()

    // 🔄 Set up real-time updates every 30 seconds (reduced frequency)
    const interval = setInterval(loadGameData, 30000)

    // 🔄 Realtime: messages table (we use messages + chats, not chat_messages)
    const subscription = supabase
      .channel('progress_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload: any) => {
          const chatId = payload?.new?.chat_id
          if (!chatId) return
          const { data: chat } = await supabase.from('chats').select('user_id').eq('id', chatId).maybeSingle()
          if (chat?.user_id === userId) {
            loadGameData()
          }
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      subscription.unsubscribe()
    }
  }, [userId, previousXP, previousLevel, currentPlanet])

  const calculateTotalXP = (masteryScores: any[], progressMetrics: any) => {
    let xp = 0
    
    // SIMPLE: 10 XP per message/chat session
    if (progressMetrics) {
      xp += (progressMetrics.totalInteractions || 0) * 10  // 10 XP per chat
    }
    
    return xp
  }

  const calculateBrainLevel = (totalXP: number): BrainLevel => {
    const levels = [
      { level: 1, title: 'Novice Learner', requiredXP: 0 },
      { level: 2, title: 'Apprentice Thinker', requiredXP: 100 },
      { level: 3, title: 'Rising Scholar', requiredXP: 250 },
      { level: 4, title: 'Knowledge Seeker', requiredXP: 500 },
      { level: 5, title: 'Mind Explorer', requiredXP: 1000 },
      { level: 6, title: 'Wisdom Hunter', requiredXP: 2000 },
      { level: 7, title: 'Scholar Warrior', requiredXP: 3500 },
      { level: 8, title: 'Master Mind', requiredXP: 5000 },
      { level: 9, title: 'Brain Legend', requiredXP: 7500 },
      { level: 10, title: 'Academic Champion', requiredXP: 10000 },
      { level: 11, title: 'Knowledge Sage', requiredXP: 15000 },
      { level: 12, title: 'Learning Master', requiredXP: 20000 },
      { level: 13, title: 'Brain Architect', requiredXP: 30000 },
      { level: 14, title: 'Wisdom Guardian', requiredXP: 50000 },
      { level: 15, title: 'Academic God', requiredXP: 100000 }
    ]

    let currentLevel = levels[0]
    for (let i = levels.length - 1; i >= 0; i--) {
      if (totalXP >= levels[i].requiredXP) {
        currentLevel = levels[i]
        break
      }
    }

    const nextLevel = levels.find(l => l.level === currentLevel.level + 1)
    const requiredXP = nextLevel ? nextLevel.requiredXP - currentLevel.requiredXP : 1000
    const currentXP = totalXP - currentLevel.requiredXP
    const progress = (currentXP / requiredXP) * 100

    return {
      level: currentLevel.level,
      title: currentPlanet.title,
      currentXP: currentXP || 0,
      requiredXP: requiredXP || 0,
      progress: progress || 0
    }
  }

  // 🚀 ENHANCED: Clear, engaging quest descriptions with difficulty progression
  const QUEST_POOL = {
    learning: [
      {
        id: 'first-steps',
        title: '🌟 First Steps',
        description: 'Send your first message today to begin your learning adventure! Every expert was once a beginner.',
        difficulty: 'easy' as const,
        xpReward: 25,
        emotionalFeedback: '🎉 Journey started! You\'re on your way to greatness!',
        checkCompletion: ({ progressMetrics }: any) => (progressMetrics?.interactionsToday || 0) >= 1,
        getProgress: ({ progressMetrics }: any) => Math.min(progressMetrics?.interactionsToday || 0, 1),
        maxProgress: 1
      },
      {
        id: 'knowledge-seeker',
        title: '🚀 Knowledge Seeker',
        description: 'Complete 3 learning sessions today. Consistency is the key to mastery!',
        difficulty: 'medium' as const,
        xpReward: 60,
        emotionalFeedback: '🔥 Learning momentum activated! Your brain is growing stronger!',
        checkCompletion: ({ progressMetrics }: any) => (progressMetrics?.interactionsToday || 0) >= 3,
        getProgress: ({ progressMetrics }: any) => Math.min(progressMetrics?.interactionsToday || 0, 3),
        maxProgress: 3
      },
      {
        id: 'learning-marathon',
        title: '💪 Learning Marathon',
        description: 'Complete 5 learning sessions today. Push your limits and unlock your full potential!',
        difficulty: 'hard' as const,
        xpReward: 120,
        emotionalFeedback: '⚡ Legendary effort! You\'re unstoppable today!',
        checkCompletion: ({ progressMetrics }: any) => (progressMetrics?.interactionsToday || 0) >= 5,
        getProgress: ({ progressMetrics }: any) => Math.min(progressMetrics?.interactionsToday || 0, 5),
        maxProgress: 5
      }
    ],
    exploration: [
      {
        id: 'curiosity-spark',
        title: '💭 Curiosity Spark',
        description: 'Ask 2 thoughtful questions. Curiosity is the engine of achievement!',
        difficulty: 'easy' as const,
        xpReward: 35,
        emotionalFeedback: '🧠 Your curiosity lights the way to discovery!',
        checkCompletion: ({ progressMetrics }: any) => (progressMetrics?.interactionsToday || 0) >= 2,
        getProgress: ({ progressMetrics }: any) => Math.min(progressMetrics?.interactionsToday || 0, 2),
        maxProgress: 2
      },
      {
        id: 'topic-explorer',
        title: '🗺️ Topic Explorer',
        description: 'Learn about 3 different subjects. Broad knowledge makes you a versatile thinker!',
        difficulty: 'medium' as const,
        xpReward: 75,
        emotionalFeedback: '🌍 Your knowledge horizon expands! New worlds await!',
        checkCompletion: ({ progressMetrics }: any) => (progressMetrics?.interactionsToday || 0) >= 4,
        getProgress: ({ progressMetrics }: any) => Math.min(progressMetrics?.interactionsToday || 0, 4),
        maxProgress: 4
      },
      {
        id: 'knowledge-pioneer',
        title: '🎯 Knowledge Pioneer',
        description: 'Explore 5 different topics today. Become the master of multiple domains!',
        difficulty: 'hard' as const,
        xpReward: 150,
        emotionalFeedback: '🏆 Pioneer status unlocked! You\'re a true polymath!',
        checkCompletion: ({ progressMetrics }: any) => (progressMetrics?.interactionsToday || 0) >= 6,
        getProgress: ({ progressMetrics }: any) => Math.min(progressMetrics?.interactionsToday || 0, 6),
        maxProgress: 6
      }
    ],
    quiz: [
      {
        id: 'quiz-trial',
        title: '🎯 Quiz Trial',
        description: 'Complete your first quiz today. Test your knowledge and see how much you\'ve learned!',
        difficulty: 'easy' as const,
        xpReward: 40,
        emotionalFeedback: '✅ First quiz conquered! You\'re on the path to mastery!',
        checkCompletion: ({ progressMetrics }: any) => (progressMetrics?.quizzesToday || 0) > 0,
        getProgress: ({ progressMetrics }: any) => Math.min(progressMetrics?.quizzesToday || 0, 1),
        maxProgress: 1
      },
      {
        id: 'quiz-champion',
        title: '🏅 Quiz Champion',
        description: 'Complete 2 quizzes today. Challenge yourself and reinforce your learning!',
        difficulty: 'medium' as const,
        xpReward: 90,
        emotionalFeedback: '🔥 Champion mindset! Your knowledge is rock-solid!',
        checkCompletion: ({ progressMetrics }: any) => (progressMetrics?.quizzesToday || 0) >= 2,
        getProgress: ({ progressMetrics }: any) => Math.min(progressMetrics?.quizzesToday || 0, 2),
        maxProgress: 2
      },
      {
        id: 'quiz-legend',
        title: '👑 Quiz Legend',
        description: 'Complete 3 quizzes with excellence today. Join the elite ranks of quiz masters!',
        difficulty: 'hard' as const,
        xpReward: 180,
        emotionalFeedback: '👑 Legendary status achieved! You\'re a quiz deity!',
        checkCompletion: ({ progressMetrics }: any) => (progressMetrics?.quizzesToday || 0) >= 3,
        getProgress: ({ progressMetrics }: any) => Math.min(progressMetrics?.quizzesToday || 0, 3),
        maxProgress: 3
      }
    ],
    streak: [
      {
        id: 'daily-commitment',
        title: '🔥 Daily Commitment',
        description: 'Show up today! Consistency beats perfection every single time.',
        difficulty: 'easy' as const,
        xpReward: 20,
        emotionalFeedback: '🔥 Commitment honored! You\'re building habits that last!',
        checkCompletion: ({ realStreakCount }: any) => realStreakCount > 0,
        getProgress: ({ realStreakCount }: any) => realStreakCount > 0 ? 1 : 0,
        maxProgress: 1
      },
      {
        id: 'momentum-builder',
        title: '⚡ Momentum Builder',
        description: 'Maintain a 3-day streak. Small daily wins lead to massive transformations!',
        difficulty: 'medium' as const,
        xpReward: 65,
        emotionalFeedback: '⚡ Momentum achieved! You\'re becoming unstoppable!',
        checkCompletion: ({ realStreakCount }: any) => realStreakCount >= 3,
        getProgress: ({ realStreakCount }: any) => Math.min(realStreakCount, 3),
        maxProgress: 3
      },
      {
        id: 'streak-master',
        title: '🌟 Streak Master',
        description: 'Maintain a 7-day streak. You\'re in the top 1% of consistent learners!',
        difficulty: 'hard' as const,
        xpReward: 200,
        emotionalFeedback: '🏆 Master status! Your discipline is legendary!',
        checkCompletion: ({ realStreakCount }: any) => realStreakCount >= 7,
        getProgress: ({ realStreakCount }: any) => Math.min(realStreakCount, 7),
        maxProgress: 7
      }
    ]
  }

  const PLANET_THEMED_QUESTS = {
    earth: [
      { baseId: 'complete-session', title: 'Earth Explorer: Learn from Home', description: 'Begin your journey with a learning session' },
      { baseId: 'ask-questions', title: 'Earth Curiosity: Ask Questions', description: 'Explore your home planet with questions' }
    ],
    moon: [
      { baseId: 'review-concepts', title: 'Lunar Reflection: Review Knowledge', description: 'Reflect on what you\'ve learned under moonlight' },
      { baseId: 'maintain-streak', title: 'Lunar Cycle: Keep Momentum', description: 'Stay consistent through lunar phases' }
    ],
    sun: [
      { baseId: 'deep-dive-session', title: 'Solar Power: Intense Learning', description: 'Harness solar energy for deep learning' },
      { baseId: 'quiz-master', title: 'Solar Flare: Quiz Challenge', description: 'Test your knowledge with solar intensity' }
    ],
    mars: [
      { baseId: 'conquer-weakness', title: 'Mars Conquest: Defeat Weakness', description: 'Colonize your weak spots like Mars' },
      { baseId: 'complete-quiz', title: 'Mars Mission: Knowledge Landing', description: 'Land your knowledge with a quiz' }
    ],
    asteroid: [
      { baseId: 'scan-documents', title: 'Asteroid Mining: Extract Knowledge', description: 'Mine valuable insights from documents' },
      { baseId: 'learn-new-topic', title: 'Asteroid Discovery: Find New Knowledge', description: 'Discover new topics in the asteroid belt' }
    ],
    jupiter: [
      { baseId: 'deep-dive-session', title: 'Jupiter\'s Gravity: Deep Learning', description: 'Use Jupiter\'s pull for deep knowledge' },
      { baseId: 'streak-warrior', title: 'Jupiter Guardian: Protect Streak', description: 'Guard your learning streak like Jupiter' }
    ],
    saturn: [
      { baseId: 'ask-questions', title: 'Saturn\'s Rings: Circle Knowledge', description: 'Circle around topics with questions' },
      { baseId: 'review-concepts', title: 'Ring Review: Polish Knowledge', description: 'Polish your knowledge like Saturn\'s rings' }
    ],
    cosmos: [
      { baseId: 'deep-questions', title: 'Cosmic Questions: Deep Thinking', description: 'Ask questions about the cosmos' },
      { baseId: 'learn-new-topic', title: 'Cosmic Discovery: Explore Unknown', description: 'Discover the unknown in cosmos' }
    ],
    nebula: [
      { baseId: 'quiz-master', title: 'Nebula Quiz: Stellar Challenge', description: 'Navigate stellar nurseries with quizzes' },
      { baseId: 'master-weakness', title: 'Nebula Transformation: Evolve', description: 'Transform weaknesses in stellar clouds' }
    ],
    galaxy: [
      { baseId: 'streak-warrior', title: 'Galaxy Command: Lead the Way', description: 'Command your learning journey' },
      { baseId: 'deep-dive-session', title: 'Galaxy Mastery: Comprehensive Learning', description: 'Master topics across the galaxy' }
    ],
    quasar: [
      { baseId: 'quiz-master', title: 'Quasar Energy: Power Quiz', description: 'Use quasar energy for quiz mastery' },
      { baseId: 'deep-questions', title: 'Quasar Mysteries: Question Everything', description: 'Question the mysteries of quasars' }
    ],
    void: [
      { baseId: 'master-weakness', title: 'Void Mastery: Face the Unknown', description: 'Master the void of your weaknesses' },
      { baseId: 'maintain-streak', title: 'Void Streak: Consistency in Darkness', description: 'Maintain consistency through the void' }
    ],
    dimension: [
      { baseId: 'learn-new-topic', title: 'Dimension Jump: New Perspectives', description: 'Jump to new dimensional knowledge' },
      { baseId: 'deep-dive-session', title: 'Dimension Deep Dive: Multi-layered Learning', description: 'Explore multi-layered dimensions' }
    ],
    universe: [
      { baseId: 'streak-warrior', title: 'Universe Guardian: Protect Knowledge', description: 'Guard all knowledge in the universe' },
      { baseId: 'quiz-master', title: 'Universe Quiz: Ultimate Challenge', description: 'Face the ultimate quiz challenge' }
    ],
    legendary: [
      { baseId: 'master-weakness', title: 'Legendary Status: Perfect Knowledge', description: 'Achieve legendary mastery' },
      { baseId: 'deep-dive-session', title: 'Legendary Quest: Epic Learning', description: 'Embark on an epic learning journey' }
    ]
  }

  const getQuestHistory = (): QuestHistory[] => {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(`quest_history_${userId}`)
    return stored ? JSON.parse(stored) : []
  }

  const saveQuestToHistory = (questId: string, completed: boolean) => {
    if (typeof window === 'undefined') return
    const history = getQuestHistory()
    const today = new Date().toISOString().split('T')[0]
    
    // Remove any existing entry for today
    const filtered = history.filter(h => h.date !== today || h.questId !== questId)
    
    // Add new entry
    filtered.push({ questId, date: today, completed })
    
    // Keep only last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recent = filtered.filter(h => new Date(h.date) > thirtyDaysAgo)
    
    localStorage.setItem(`quest_history_${userId}`, JSON.stringify(recent))
  }

  const isQuestRecentlyUsed = (questId: string): boolean => {
    const history = getQuestHistory()
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    
    return history.some(h => 
      h.questId === questId && 
      new Date(h.date) > threeDaysAgo
    )
  }

  const selectWeightedQuest = (availableQuests: any[], userBehavior: any) => {
    // Weight quests based on user behavior
    const weightedQuests = availableQuests.map(quest => {
      let weight = 1
      
      // Boost weight for quests matching user behavior
      if (userBehavior.frequentScanner && quest.id.includes('scan')) weight += 2
      if (userBehavior.frequentChatter && quest.id.includes('questions')) weight += 2
      if (userBehavior.dailyLearner && quest.id.includes('streak')) weight += 2
      if (userBehavior.quizTaker && quest.id.includes('quiz')) weight += 2
      
      // Reduce weight for recently used quests
      if (isQuestRecentlyUsed(quest.id)) weight *= 0.1
      
      return { ...quest, weight }
    })
    
    // Sort by weight and select
    weightedQuests.sort((a, b) => b.weight - a.weight)
    return weightedQuests[0]
  }

  const analyzeUserBehavior = (metrics: any, weeklyStats: any) => {
    return {
      frequentScanner: false, // Would need scan tracking
      frequentChatter: (metrics?.totalInteractions || 0) > 5,
      dailyLearner: (weeklyStats?.quizzesThisWeek || 0) > 0,
      quizTaker: (weeklyStats?.quizzesThisWeek || 0) > 2
    }
  }

  const generateMultiStageQuest = (baseQuest: any): DailyQuest => {
    const stages: QuestStage[] = [
      {
        id: `${baseQuest.id}-stage-1`,
        title: `Stage 1: ${baseQuest.title}`,
        description: baseQuest.description,
        xpReward: Math.floor(baseQuest.xpReward * 0.3),
        completed: false,
        progress: 0,
        maxProgress: baseQuest.maxProgress
      },
      {
        id: `${baseQuest.id}-stage-2`,
        title: `Stage 2: Deepen Understanding`,
        description: 'Take your learning to the next level',
        xpReward: Math.floor(baseQuest.xpReward * 0.4),
        completed: false,
        progress: 0,
        maxProgress: baseQuest.maxProgress
      },
      {
        id: `${baseQuest.id}-stage-3`,
        title: `Stage 3: Master the Concept`,
        description: 'Achieve true mastery',
        xpReward: Math.floor(baseQuest.xpReward * 0.3),
        completed: false,
        progress: 0,
        maxProgress: baseQuest.maxProgress
      }
    ]
    
    return {
      ...baseQuest,
      stages,
      emotionalFeedback: '🌟 Multi-stage quest initiated!'
    }
  }

  const generateDailyQuests = (progressMetrics: any, diagnosis: any, realStreakCount: number = 0, weeklyStats: any = {}): DailyQuest[] => {
    console.log('🎯 Generating quests with metrics:', { progressMetrics, diagnosis, realStreakCount, weeklyStats })
    
    const userBehavior = analyzeUserBehavior(progressMetrics, weeklyStats)
    const quests: DailyQuest[] = []
    
    // Simple approach: Get all available quests and filter
    const allQuests = Object.entries(QUEST_POOL).flatMap(([category, categoryQuests]) => 
      categoryQuests.map(quest => ({ ...quest, category }))
    )
    
    console.log('📋 All available quests:', allQuests.length)
    
    // Filter out recently used quests
    const availableQuests = allQuests.filter(quest => !isQuestRecentlyUsed(quest.id))
    
    console.log('📋 Available after filtering:', availableQuests.length)
    
    // If no quests available (all recently used), reset and use all
    const questsToUse = availableQuests.length > 0 ? availableQuests : allQuests
    
    // 🚀 ENHANCED: Select exactly 3 quests with different difficulties (Easy, Medium, Hard)
    const selectedQuests: any[] = []
    const usedCategories = new Set<string>()
    const usedDifficulties = new Set<string>()
    
    // First, try to get one quest from each difficulty (Easy, Medium, Hard)
    const shuffled = [...questsToUse].sort(() => Math.random() - 0.5)
    
    // Priority 1: Get one Easy quest
    for (const quest of shuffled) {
      if (quest.difficulty === 'easy' && !usedDifficulties.has('easy') && !usedCategories.has(quest.category)) {
        selectedQuests.push(quest)
        usedCategories.add(quest.category)
        usedDifficulties.add('easy')
        break
      }
    }
    
    // Priority 2: Get one Medium quest
    for (const quest of shuffled) {
      if (quest.difficulty === 'medium' && !usedDifficulties.has('medium') && !usedCategories.has(quest.category)) {
        selectedQuests.push(quest)
        usedCategories.add(quest.category)
        usedDifficulties.add('medium')
        break
      }
    }
    
    // Priority 3: Get one Hard quest
    for (const quest of shuffled) {
      if (quest.difficulty === 'hard' && !usedDifficulties.has('hard') && !usedCategories.has(quest.category)) {
        selectedQuests.push(quest)
        usedCategories.add(quest.category)
        usedDifficulties.add('hard')
        break
      }
    }
    
    // If we don't have all 3 difficulties, fill remaining slots with any available quests
    if (selectedQuests.length < 3) {
      for (const quest of shuffled) {
        if (selectedQuests.length >= 3) break
        if (!selectedQuests.some(q => q.id === quest.id)) {
          selectedQuests.push(quest)
          usedCategories.add(quest.category)
          usedDifficulties.add(quest.difficulty)
        }
      }
    }
    
    console.log(`🎯 Selected ${selectedQuests.length} quests with difficulties:`, selectedQuests.map(q => `${q.difficulty} (${q.category})`))
    
    console.log('📋 Selected quests:', selectedQuests.length)
    
    // Create final quests
    for (const selectedQuest of selectedQuests) {
      // Apply planet theme if available
      const planetQuests = PLANET_THEMED_QUESTS[currentPlanet.theme as keyof typeof PLANET_THEMED_QUESTS] || []
      const themedQuest = planetQuests.find(pq => pq.baseId === selectedQuest.id)
      
      try {
        const completed = selectedQuest.checkCompletion({ progressMetrics, diagnosis, realStreakCount, weeklyStats })
        const progress = selectedQuest.getProgress({ progressMetrics, diagnosis, realStreakCount, weeklyStats })
        
        const finalQuest: DailyQuest = {
          id: selectedQuest.id,
          title: themedQuest?.title || selectedQuest.title,
          description: themedQuest?.description || selectedQuest.description,
          xpReward: selectedQuest.xpReward,
          category: selectedQuest.category,
          difficulty: selectedQuest.difficulty,
          emotionalFeedback: selectedQuest.emotionalFeedback,
          completed,
          progress,
          maxProgress: selectedQuest.maxProgress,
          rewardClaimed: false,
          checkCompletion: selectedQuest.checkCompletion,
          getProgress: selectedQuest.getProgress
        }
        
        console.log(`✅ Created quest: ${finalQuest.title}`, { completed, progress })
        
        // Make some quests multi-stage for variety
        if (Math.random() < 0.3 && selectedQuest.difficulty === 'hard') {
          quests.push(generateMultiStageQuest(finalQuest))
        } else {
          quests.push(finalQuest)
        }
        
        saveQuestToHistory(selectedQuest.id, false)
      } catch (error) {
        console.error(`❌ Error creating quest ${selectedQuest.id}:`, error)
      }
    }
    
    // Fallback: If no quests, create basic ones with all difficulties
    if (quests.length === 0) {
      console.log('⚠️ No quests generated, creating fallback quests')
      quests.push(
        {
          id: 'fallback-first-steps',
          title: '🌟 First Steps',
          description: 'Send your first message today to begin your learning adventure!',
          xpReward: 25,
          category: 'learning',
          difficulty: 'easy' as const,
          emotionalFeedback: '🎉 Journey started! You\'re on your way to greatness!',
          completed: (progressMetrics?.interactionsToday ?? 0) > 0,
          progress: Math.min(progressMetrics?.interactionsToday || 0, 1),
          maxProgress: 1,
          rewardClaimed: false
        },
        {
          id: 'fallback-exploration',
          title: '💭 Curiosity Spark',
          description: 'Ask 2 thoughtful questions. Curiosity is the engine of achievement!',
          xpReward: 35,
          category: 'exploration',
          difficulty: 'medium' as const,
          emotionalFeedback: '🧠 Your curiosity lights the way to discovery!',
          completed: (progressMetrics?.interactionsToday ?? 0) >= 2,
          progress: Math.min(progressMetrics?.interactionsToday || 0, 2),
          maxProgress: 2,
          rewardClaimed: false
        },
        {
          id: 'fallback-challenge',
          title: '🎯 Quiz Trial',
          description: 'Complete your first quiz today. Test your knowledge and see how much you\'ve learned!',
          xpReward: 40,
          category: 'quiz',
          difficulty: 'hard' as const,
          emotionalFeedback: '✅ First quiz conquered! You\'re on the path to mastery!',
          completed: (progressMetrics?.quizzesToday ?? 0) > 0,
          progress: Math.min(progressMetrics?.quizzesToday || 0, 1),
          maxProgress: 1,
          rewardClaimed: false
        }
      )
    }
    
    console.log(`🎯 Final quests generated: ${quests.length}`)
    return quests
  }

  const createWeakSpotBosses = (weaknesses: any[], quizCount: number = 0): WeakSpotBoss[] => {
    return weaknesses.slice(0, 3).map((weakness, index) => ({
      concept: weakness.subtopic || weakness.topic,
      health: Math.min(100, (quizCount / Math.max(1, Math.floor((100 - weakness.masteryLevel) / 20))) * 100),
      maxHealth: 100,
      defeated: quizCount >= Math.max(1, Math.floor((100 - weakness.masteryLevel) / 20)),
      requiredQuizzes: Math.max(1, Math.floor((100 - weakness.masteryLevel) / 20))
    }))
  }

  const calculateMomentumStreak = (progressMetrics: any): number => {
    // Calculate based on recent activity and improvement
    let streak = 0
    
    if (progressMetrics?.recentTrend === 'improving') {
      streak += 3
    }
    
    if (progressMetrics?.totalInteractions > 10) {
      streak += 2
    }
    
    if (progressMetrics?.understandingRate > 0.7) {
      streak += 1
    }
    
    return Math.min(streak, 10) // Max streak of 10
  }

  const buildSkillTree = (masteryScores: { concept: string; score: number }[], quizCount: number = 0): SkillNode[] => {
    const getSkillStatus = (score: number, quizzes: number) => ({
      mastered: quizzes >= 5, // Mastered after 5 quizzes
      locked: quizzes === 0,
      inProgress: quizzes > 0 && quizzes < 5,
      progress: Math.min(100, (quizzes / 5) * 100), // Progress based on quiz count
      quizCount: quizzes
    })

    if (!masteryScores || masteryScores.length === 0) {
      return [
        {
          id: 'start-learning',
          name: 'Complete quizzes & practice to unlock skills',
          mastered: false,
          locked: true,
          inProgress: false,
          progress: 0,
          quizCount: 0,
          children: []
        }
      ]
    }

    return masteryScores.map((m, index) => {
      const topicQuizzes = Math.min(quizCount, Math.floor(m.score / 10)) // Distribute quiz count across topics
      const status = getSkillStatus(m.score, topicQuizzes)
      return {
        id: `skill-${m.concept.replace(/\s+/g, '-').toLowerCase()}-${index}`,
        name: m.concept,
        mastered: status.mastered,
        locked: status.locked,
        inProgress: status.inProgress,
        progress: status.progress,
        quizCount: status.quizCount,
        children: []
      }
    })
  }

  const generateAchievements = (progressMetrics: any, masteryScores: any[]): Achievement[] => {
    const achievements: Achievement[] = []
    
    // Weak Spot Eliminator
    if (progressMetrics?.overallImprovement > 20) {
      achievements.push({
        id: 'weak-spot-eliminator',
        title: 'Weak Spot Eliminator',
        description: 'Improved by over 20%',
        icon: <Target className="w-6 h-6" />,
        unlocked: true,
        rarity: 'rare'
      })
    }
    
    // Consistency Master
    if (progressMetrics?.totalInteractions > 50) {
      achievements.push({
        id: 'consistency-master',
        title: 'Consistency Master',
        description: 'Completed 50+ learning sessions',
        icon: <Trophy className="w-6 h-6" />,
        unlocked: true,
        rarity: 'epic'
      })
    }
    
    // Comeback King
    const avgMastery = masteryScores.reduce((sum, score) => sum + score.score, 0) / (masteryScores.length || 1)
    if (avgMastery > 75) {
      achievements.push({
        id: 'comeback-king',
        title: 'Comeback King',
        description: 'Reached 75%+ average mastery',
        icon: <Crown className="w-6 h-6" />,
        unlocked: true,
        rarity: 'legendary'
      })
    }
    
    return achievements
  }

  const calculateWeeklyEvolution = (
    progressMetrics: any,
    masteryScores: { concept: string; score: number }[],
    weeklyStats: { xpThisWeek: number; quizzesThisWeek: number; skillsMastered: number; bossesDefeated: number }
  ) => {
    const skillsMastered = weeklyStats?.skillsMastered ?? masteryScores.filter((s: any) => s.score >= 80).length
    const bossesDefeated = weeklyStats?.bossesDefeated ?? skillsMastered
    const overallMastery = masteryScores.length > 0
      ? masteryScores.reduce((sum: number, s: any) => sum + s.score, 0) / masteryScores.length
      : 0
    // Levels gained this week: rough estimate from XP (e.g. 100 XP ≈ 1 level at low levels)
    const levelsGained = weeklyStats?.xpThisWeek != null ? Math.floor(weeklyStats.xpThisWeek / 100) : 0

    return {
      levelsGained: Math.max(0, levelsGained),
      skillsMastered,
      bossesDefeated,
      strengthImprovement: Math.round(overallMastery)
    }
  }

  const generateCoachMessage = (progressMetrics: any, diagnosis: any): string => {
    if (diagnosis?.currentWeaknesses?.length > 2) {
      return "I can see these concepts keep pushing back. Let's defeat them together!"
    }
    
    if (progressMetrics?.recentTrend === 'improving') {
      return "You're learning faster than last week. Keep the momentum!"
    }
    
    if (progressMetrics?.totalInteractions < 5) {
      return "Your brain is ready to level up. Start your first quest!"
    }
    
    return "You're on an incredible learning journey. What's next?"
  }

  const completeQuest = (questId: string) => {
    setDailyQuests(prev => prev.map(quest => 
      quest.id === questId 
        ? { ...quest, completed: true, progress: quest.maxProgress }
        : quest
    ))
  }

  const claimQuestReward = (questId: string) => {
    const quest = dailyQuests.find(q => q.id === questId)
    if (quest && quest.completed && !quest.rewardClaimed) {
      setDailyQuests(prev => prev.map(q => 
        q.id === questId 
          ? { ...q, rewardClaimed: true }
          : q
      ))
      
      // Add XP reward to state
      setBrainLevel(prev => ({
        ...prev,
        currentXP: prev.currentXP + quest.xpReward
      }))
      
      // 🚀 CRITICAL FIX: Persist claimed status to today's daily quests
      const today = new Date().toDateString()
      const dailyQuestsKey = `daily_quests_${userId}_${today}`
      const updatedQuests = dailyQuests.map(q => 
        q.id === questId ? { ...q, rewardClaimed: true } : q
      )
      
      try {
        localStorage.setItem(dailyQuestsKey, JSON.stringify(updatedQuests))
        console.log(`💾 Persisted reward claimed status for quest: ${questId}`)
      } catch (error) {
        console.warn('Failed to persist quest reward status:', error)
      }
      
      // 🚀 CRITICAL FIX: Persist quest XP rewards to localStorage
      if (typeof window !== 'undefined') {
        try {
          const xpKey = `quest_xp_rewards_${userId}`
          const currentRewards = JSON.parse(localStorage.getItem(xpKey) || '[]')
          currentRewards.push({
            questId,
            xpReward: quest.xpReward,
            timestamp: new Date().toISOString()
          })
          localStorage.setItem(xpKey, JSON.stringify(currentRewards))
          console.log(`💾 Saved ${quest.xpReward} XP reward to cumulative storage`)
        } catch (error) {
          console.error('Failed to save quest XP reward cumulative:', error)
        }
      }
      
      // Show emotional feedback
      if (quest.emotionalFeedback) {
        // You could add a toast notification here
        console.log(quest.emotionalFeedback)
      }
      
      // Mark quest as completed in history
      saveQuestToHistory(questId, true)
    }
  }

  return (
    <div className="space-y-8 relative z-10 w-full mb-32 max-w-5xl mx-auto px-2">
      <style jsx global>{`
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(15px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(15px) rotate(-360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; filter: blur(8px); }
          50% { opacity: 1; filter: blur(12px); }
        }
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .planet-orbit { animation: orbit 10s linear infinite; }
        .floating { animation: float 4s ease-in-out infinite; }
        .energy-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .neural-grid {
          background-image: 
            linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px);
          background-size: 30px 30px;
        }
        .planet-glow {
          box-shadow: 0 0 60px 10px var(--glow-color);
        }
        .starfield { 
          position: fixed; 
          top: 0; left: 0; width: 100%; height: 100%; 
          z-index: 0; 
          pointer-events: none;
          background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
        }
        .star {
          position: absolute;
          background: white;
          border-radius: 50%;
          animation: star-twinkle var(--duration) ease-in-out infinite;
          opacity: var(--opacity);
        }
        .nebula {
          position: absolute;
          width: 50vw;
          height: 50vw;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.15;
          pointer-events: none;
        }
      `}</style>

      {/* 🌌 IMMERSIVE STARFIELD BACKGROUND */}
      <div className="starfield">
        {[...Array(50)].map((_, i) => (
          <div 
            key={i} 
            className="star" 
            style={{ 
              top: `${Math.random() * 100}%`, 
              left: `${Math.random() * 100}%`, 
              width: `${Math.random() * 3}px`, 
              height: `${Math.random() * 3}px`,
              // @ts-ignore
              '--duration': `${2 + Math.random() * 4}s`,
              '--opacity': 0.1 + Math.random() * 0.5
            }} 
          />
        ))}
        <div className="nebula top-0 left-0 bg-blue-600/20 translate-x-[-20%] translate-y-[-20%]"></div>
        <div className="nebula bottom-0 right-0 bg-purple-600/20 translate-x-[20%] translate-y-[20%]"></div>
      </div>

      {/* 🎉 LEVEL UP ANIMATION */}
      {isLevelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-8 py-6 rounded-2xl shadow-2xl border-2 border-amber-300 animate-bounce">
            <div className="text-center">
              <Crown className="w-16 h-16 mx-auto mb-4 text-amber-200" />
              <div className="text-3xl font-bold mb-2">LEVEL UP!</div>
              <div className="text-xl">You're now {brainLevel.title}!</div>
              <div className="text-sm mt-2 text-amber-100">Keep up the amazing work! 🎯</div>
            </div>
          </div>
        </div>
      )}

      {/* 📈 XP GAINED ANIMATION */}
      {showXPGained && (
        <div className="fixed top-20 right-4 z-40 animate-pulse">
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 rounded-full shadow-lg border-2 border-emerald-300">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <span className="font-bold">+10 XP!</span>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 Space Level System (The Command Center) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setShowLevelMap(true)}
        className="relative group cursor-pointer"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[2rem] border border-white/10 p-6 md:p-10 relative overflow-hidden transition-all duration-500 shadow-3xl neural-grid">
          {/* Background Decorative Elements */}
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] energy-glow"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-48 h-48 bg-purple-500/10 rounded-full blur-[80px]"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 mb-8 md:mb-10">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="relative flex-shrink-0">
                <div 
                  className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center border border-white/10 shadow-2xl transition-transform group-hover:scale-110 duration-500 planet-glow"
                  style={{ '--glow-color': `${currentPlanet.color}33` } as any}
                >
                  {['earth', 'moon', 'sun', 'mars', 'jupiter', 'saturn'].includes(currentPlanet.theme) ? (
                    <PlanetRenderer 
                      theme={currentPlanet.theme} 
                      color={currentPlanet.color} 
                      className="w-10 h-10 md:w-16 md:h-16 floating" 
                    />
                  ) : (
                    <currentPlanet.icon className="w-8 h-8 md:w-12 md:h-12 text-white floating" style={{ color: currentPlanet.color }} />
                  )}
                </div>
                <div 
                  className="absolute -top-1.5 -right-1.5 w-7 h-7 md:w-9 md:h-9 rounded-full bg-blue-600 flex items-center justify-center border-2 border-slate-950 shadow-xl z-20 text-white"
                  style={{ boxShadow: '0 0 15px rgba(37, 99, 235, 0.5)' }}
                >
                  <span className="text-xs md:text-sm font-black">{brainLevel.level}</span>
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[8px] md:text-[10px] font-black tracking-[0.2em] md:tracking-[0.3em] text-blue-400 uppercase truncate">Sector Discovered</span>
                  <Sparkles className="w-3 h-3 text-blue-400 animate-pulse flex-shrink-0" />
                </div>
                <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight truncate">{brainLevel.title}</h2>
                <div className="flex items-center gap-2 mt-1 md:mt-2">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
                  <p className="text-xs md:text-sm text-slate-400 font-medium truncate">{currentPlanet.description}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-row md:flex-row items-center justify-between md:justify-end gap-4 md:gap-6">
              <div className="text-left md:text-right">
                <div className="text-[8px] md:text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase mb-0.5 md:mb-1">Cosmic Energy</div>
                <div className="text-lg md:text-2xl font-black text-white flex items-center md:justify-end gap-1.5 md:gap-2">
                  <Zap className="w-4 h-4 md:w-5 md:h-5 text-amber-400 fill-amber-400" />
                  {brainLevel.currentXP.toLocaleString()} <span className="text-slate-600">/</span> {brainLevel.requiredXP.toLocaleString()}
                </div>
              </div>
              <div className="w-px h-10 bg-white/10 hidden md:block"></div>
              <div className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-3 py-1.5 md:px-4 md:py-2 flex items-center gap-1.5 md:gap-2 hover:bg-white/10 transition-colors">
                <Satellite className="w-4 h-4 md:w-5 md:h-5 text-blue-400 animate-spin-slow" />
                <span className="text-[10px] md:text-xs font-bold text-white uppercase tracking-wider">Galaxy Map</span>
              </div>
            </div>
          </div>
          
          <div className="relative pt-2 md:pt-4">
            <div className="w-full bg-slate-950/50 rounded-full h-4 md:h-5 p-1 border border-white/5 shadow-inner">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                style={{ 
                  width: `${brainLevel.progress}%`,
                  background: `linear-gradient(90deg, ${currentPlanet.color}22, ${currentPlanet.color})`
                }}
              >
              </div>
            </div>
            <div className="flex justify-between mt-2 md:mt-3 px-1">
              <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Planet {brainLevel.level}</span>
              <span className="text-[8px] md:text-[10px] font-black text-blue-500 uppercase tracking-widest animate-pulse">Next: Planet {brainLevel.level + 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🗺️ Galaxy Map Modal */}
      {showLevelMap && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowLevelMap(false)}>
          <div
            className="bg-slate-900/95 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Satellite className="w-6 h-6 text-amber-400" />
                Your Galaxy Map
              </h3>
              <button
                type="button"
                onClick={() => setShowLevelMap(false)}
                className="p-2 rounded-xl hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {SPACE_PLANETS.map((planet: any) => {
                const totalXP = (SPACE_PLANETS[brainLevel.level - 1]?.requiredXP ?? 0) + brainLevel.currentXP
                const isCurrent = planet.level === brainLevel.level
                const isUnlocked = totalXP >= planet.requiredXP
                const PlanetIcon = planet.icon
                return (
                  <div
                    key={planet.level}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-amber-500/20 border-amber-400/30 ring-2 ring-amber-400/20'
                        : isUnlocked
                        ? 'bg-slate-700/30 border-slate-600/30'
                        : 'bg-slate-800/30 border-slate-700/30 opacity-60'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isCurrent ? 'bg-gradient-to-r from-amber-500 to-amber-600' : isUnlocked ? 'bg-slate-700' : 'bg-slate-800'
                    }`}>
                      {isCurrent ? (
                        <Crown className="w-5 h-5 text-white" />
                      ) : isUnlocked ? (
                        ['earth', 'moon', 'sun', 'mars', 'jupiter', 'saturn'].includes(planet.theme) ? (
                          <PlanetRenderer theme={planet.theme} color={planet.color} className="w-6 h-6" />
                        ) : (
                          <PlanetIcon className="w-5 h-5 text-white/80" />
                        )
                      ) : (
                        <Lock className="w-5 h-5 text-slate/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white">{planet.title}</div>
                      <div className="text-xs text-slate-400">{planet.description}</div>
                      <div className="text-xs text-slate-500">{planet.requiredXP.toLocaleString()} XP required</div>
                    </div>
                    {isCurrent && <span className="text-xs font-medium text-amber-300 bg-amber-500/20 px-2 py-1 rounded-lg">You are here</span>}
                  </div>
                )
              })}
              {/* Extra padding to ensure bottom items aren't covered by Nav Bar */}
              <div className="h-24 md:h-10" />
            </div>
          </div>
        </div>
      )}

      {/* 🎯 Daily Bounties (Quest Board) */}
      <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[2rem] border border-white/5 p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-[100px]"></div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Target className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase italic text-nowrap">Daily <span className="text-emerald-500">Bounties</span></h3>
              <p className="text-[8px] md:text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">High value neural targets</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          {dailyQuests.map(quest => (
            <div 
              key={quest.id}
              className={`p-5 md:p-6 rounded-2xl md:rounded-3xl border transition-all duration-300 relative group ${
                quest.completed 
                  ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/10' 
                  : 'bg-slate-950/40 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6">
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
                  quest.completed ? 'bg-emerald-500 shadow-lg' : 'bg-slate-800'
                }`}>
                  {quest.completed ? <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-white" /> : <Lock className="w-6 h-6 md:w-8 md:h-8 text-slate-500" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-bold text-white text-lg truncate pr-2">{quest.title}</h4>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <div className="text-lg font-black text-emerald-400">+{quest.xpReward}</div>
                      <div className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest text-nowrap">Energy Gained</div>
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-slate-400 mb-3 md:mb-4 pr-1">{quest.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {quest.category && (
                      <span className="text-[8px] md:text-[9px] px-1.5 md:px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 uppercase font-black tracking-widest border border-white/5">
                        {quest.category}
                      </span>
                    )}
                    <span className={`text-[8px] md:text-[9px] px-1.5 md:px-2 py-0.5 rounded-lg uppercase font-black tracking-widest border ${
                      quest.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      quest.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {quest.difficulty} Target
                    </span>
                  </div>
                </div>
              </div>

              {quest.stages && (
                <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                  {quest.stages.map((stage, index) => (
                    <div key={stage.id} className="flex items-center gap-2.5 md:gap-3 p-2 rounded-lg md:rounded-xl bg-black/20 border border-white/5 overflow-hidden">
                      <div className={`w-5 h-5 md:w-6 md:h-6 rounded flex items-center justify-center text-[8px] md:text-[10px] font-black flex-shrink-0 ${
                        stage.completed ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {stage.completed ? '✓' : index + 1}
                      </div>
                      <span className="text-[9px] md:text-[10px] text-slate-300 font-bold truncate">{stage.title}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-4 md:mt-6 flex items-center gap-3 md:gap-4">
                <div className="flex-1 h-1.5 md:h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${(quest.progress / quest.maxProgress) * 100}%` }}
                  ></div>
                </div>
                <div className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-tighter w-10 md:w-12 text-right">
                  {Math.round((quest.progress / quest.maxProgress) * 100)}%
                </div>
              </div>
              
              {quest.completed && !quest.rewardClaimed && (
                <button
                  onClick={() => claimQuestReward(quest.id)}
                  className="mt-5 md:mt-6 w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base"
                >
                  <Gift className="w-4 h-4 md:w-5 md:h-5" />
                  Liquidate Reward
                </button>
              )}
              
              {quest.rewardClaimed && (
                <div className="mt-5 md:mt-6 h-10 md:h-12 flex items-center justify-center border border-emerald-500/20 bg-emerald-500/5 rounded-xl md:rounded-2xl overflow-hidden relative">
                  <span className="text-[9px] md:text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] flex items-center gap-2 relative z-10">
                    <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4" /> Bounty Collected
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ⚔️ Weak Spot Boss Battles (Combat Grid) */}
      {weakSpotBosses.length > 0 && (
        <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[2rem] border border-white/5 p-6 md:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-[100px]"></div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <Sword className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase italic text-nowrap">Neural <span className="text-red-500">Hostiles</span></h3>
                <p className="text-[8px] md:text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">Target Weak Concepts for elimination</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full flex-shrink-0">
              <Activity className="w-3 h-3 text-red-500 animate-pulse" />
              <span className="text-[8px] md:text-[10px] font-black text-red-500 uppercase tracking-wider text-nowrap">In Combat</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weakSpotBosses.map((boss, index) => (
              <div 
                key={index}
                className={`group relative overflow-hidden rounded-3xl border transition-all duration-500 ${
                  boss.defeated 
                    ? 'bg-slate-800/20 border-white/5 opacity-50 grayscale hover:grayscale-0' 
                    : 'bg-gradient-to-br from-slate-900 to-slate-950 border-red-500/20 hover:border-red-500/40 hover:shadow-2xl hover:shadow-red-500/10'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                        boss.defeated ? 'bg-slate-700' : 'bg-red-500/20 group-hover:scale-110'
                      }`}>
                        {boss.defeated ? <CheckCircle className="w-8 h-8 text-white" /> : <Shield className="w-8 h-8 text-red-500" />}
                      </div>
                      {!boss.defeated && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                          !
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">HP Status</div>
                      <div className={`text-2xl font-black ${boss.defeated ? 'text-slate-600' : 'text-red-500'}`}>
                        {Math.round(boss.health)}%
                      </div>
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-white mb-1 truncate">{boss.concept}</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
                    {boss.defeated ? 'Neural anomaly eliminated' : `Requires ${boss.requiredQuizzes} victory quizzes to purge concept weakness.`}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                          boss.defeated ? 'bg-slate-700' : 'bg-gradient-to-r from-red-600 to-orange-500'
                        }`}
                        style={{ width: `${boss.health}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-tighter">
                      <span>Neural Weakness</span>
                      <span>Target eliminated</span>
                    </div>
                  </div>

                  {!boss.defeated && (
                    <button className="w-full mt-6 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all active:scale-95">
                      Engage Concept
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔥 Neural Synchronization (Streak Display) */}
      <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[2rem] border border-white/5 p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full blur-[100px]"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
          <div className="flex items-center gap-4 md:gap-6">
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center transition-all duration-500 shadow-2xl relative flex-shrink-0 ${
              realStreak > 0 ? 'bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/20' : 'bg-slate-800 border border-white/5'
            }`}>
              {realStreak > 0 && <div className="absolute inset-[-4px] bg-orange-500/20 rounded-[2rem] blur-xl animate-pulse"></div>}
              <Flame className={`w-8 h-8 md:w-10 md:h-10 text-white relative z-10 ${realStreak > 0 ? 'animate-pulse' : 'opacity-20'}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[8px] md:text-[10px] font-black tracking-[0.2em] md:tracking-[0.3em] text-orange-500 uppercase text-nowrap">Synchronization</span>
                <div className="flex gap-1 flex-shrink-0">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-0.5 md:w-1 h-3 rounded-full ${i < realStreak ? 'bg-orange-500' : 'bg-slate-800'}`}></div>
                  ))}
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight truncate">Level <span className="text-orange-500">{realStreak}</span> Tempo</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium truncate">Daily neural connection frequency</p>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-row md:flex-col items-center justify-between md:justify-center min-w-full md:min-w-[120px]">
            <span className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest text-nowrap">Current Streak</span>
            <div className="text-2xl md:text-4xl font-black text-white">{realStreak}</div>
            <span className="text-[7px] md:text-[8px] font-black text-orange-400 uppercase tracking-widest text-nowrap">Days Active</span>
          </div>
        </div>
        
        <div className="mt-6 md:mt-8 p-3 md:p-4 rounded-xl bg-slate-950/40 border border-white/5">
          <p className="text-[10px] md:text-xs text-slate-400 text-center font-medium leading-relaxed italic">
            {realStreak === 0 && "Initiate learning sequence to begin neural synchronization."}
            {realStreak > 0 && realStreak <= 3 && "Synchronization established. Maintaining low-level neural tempo."}
            {realStreak > 3 && realStreak <= 7 && "High-intensity synchronization detected. Learning efficiency increased by 15%."}
            {realStreak > 7 && "🔥 MASTER SYNCHRONIZATION: Neural pathways are firing at maximum capacity!"}
          </p>
        </div>
      </div>

      {/* 🌳 Knowledge Tree (Neural Map) */}
      <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[2rem] border border-white/5 p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/5 rounded-full blur-[100px]"></div>
        
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-cyan-500" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase italic">Neural <span className="text-cyan-500">Mapping</span></h3>
              <p className="text-[8px] md:text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">Visualizing concept stabilization</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skillTree.map((node, index) => (
            <div 
              key={node.id} 
              className={`p-5 rounded-3xl border transition-all duration-300 relative group overflow-hidden ${
                node.mastered 
                  ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]' 
                  : node.inProgress 
                  ? 'bg-cyan-500/5 border-cyan-500/20' 
                  : 'bg-slate-950/40 border-white/5 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 flex-shrink-0 ${
                  node.mastered ? 'bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/20' : 
                  node.inProgress ? 'bg-gradient-to-r from-cyan-500 to-blue-600 group-hover:scale-110' : 
                  'bg-slate-800'
                }`}>
                  {node.mastered ? <Star className="w-7 h-7 text-white" /> : 
                   node.inProgress ? <Activity className="w-7 h-7 text-white animate-pulse" /> : 
                   <Lock className="w-7 h-7 text-slate-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <div className="font-bold text-white text-base truncate">{node.name}</div>
                    {node.mastered && (
                      <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">Stabilized</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3">
                    {node.quizCount} Validation Cycles
                  </div>
                  {!node.locked && (
                    <div className="relative pt-1">
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${
                            node.mastered ? 'bg-emerald-500' : 'bg-cyan-500'
                          }`}
                          style={{ width: `${node.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Background abstract connection line */}
              <div className="absolute top-1/2 right-0 w-24 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-45"></div>
            </div>
          ))}
        </div>
      </div>

      {/* 🤖 Mission Intelligence (AI Briefing) */}
      <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[2rem] border border-white/10 p-6 md:p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-[100px]"></div>
        
        <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Brain className="w-6 h-6 md:w-9 md:h-9 text-white" />
            </div>
            <div className="absolute inset-0 bg-indigo-500/20 rounded-xl md:rounded-2xl blur-lg animate-pulse"></div>
          </div>
          <div className="min-w-0">
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase italic truncate">Mission <span className="text-indigo-400">Intelligence</span></h3>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping flex-shrink-0"></div>
              <p className="text-[8px] md:text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase truncate">Tactical AI Analysis Active</p>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500/20 rounded-full"></div>
          <div className="pl-4 md:pl-6 py-2">
            <p className="text-sm md:text-xl text-slate-200 leading-relaxed font-medium italic">
              "{aiCoachMessage}"
            </p>
          </div>
        </div>
        
        {/* Decorative Radar Element */}
        <div className="absolute bottom-[-20px] right-[-20px] opacity-10 pointer-events-none">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border border-indigo-500 flex items-center justify-center animate-spin-slow">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-indigo-500/50"></div>
            <div className="absolute top-0 left-1/2 w-1 h-16 md:h-20 bg-gradient-to-b from-indigo-500 to-transparent origin-bottom"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
