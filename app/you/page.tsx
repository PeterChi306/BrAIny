'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { BottomNavigation } from '@/components/BottomNavigation'
import { LoadingScreen } from '@/components/LoadingScreen'
import {
  Brain,
  Eye,
  MessageCircle,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Settings,
  Calendar,
  Zap,
  Sparkles,
  ArrowRight,
  Edit3,
  Fingerprint,
  Activity,
  Infinity as InfinityIcon
} from 'lucide-react'
import { getLearningDNA, LearningDNA } from '@/lib/adaptive-learning'

interface LearningTrait {
  id: string
  trait: string
  description: string
  icon: React.ComponentType<any>
  confirmed: boolean
}

interface FocusArea {
  id: string
  topic: string
  reason: string
  timeToFix: string
  priority: 'high' | 'medium' | 'low'
}

interface GrowthEntry {
  id: string
  date: string
  topic: string
  type: 'breakthrough' | 'mistake' | 'insight' | 'struggle'
  description: string
  pastThinking?: string
  currentUnderstanding?: string
}

export default function YouPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [learningTraits, setLearningTraits] = useState<LearningTrait[]>([])
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([])
  const [growthTimeline, setGrowthTimeline] = useState<GrowthEntry[]>([])
  const [learningDNA, setLearningDNA] = useState<LearningDNA | null>(null)
  const [editingTraits, setEditingTraits] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const loadData = async () => {
      if (!mounted) return

      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/login')
          return
        }

        // Load profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        // Ensure arrays are properly initialized
        const safeProfile = {
          ...profileData,
          interests: Array.isArray(profileData?.interests) ? profileData.interests : [],
          subjects: Array.isArray(profileData?.subjects) ? profileData.subjects : [],
          study_goals: Array.isArray(profileData?.study_goals) ? profileData.study_goals : [],
          favorite_topics: Array.isArray(profileData?.favorite_topics) ? profileData.favorite_topics : [],
          hobbies: Array.isArray(profileData?.hobbies) ? profileData.hobbies : [],
          personality_traits: Array.isArray(profileData?.personality_traits) ? profileData.personality_traits : []
        }

        setProfile(safeProfile)

        // Learning traits from onboarding profile
        const traits: LearningTrait[] = []

        if (profileData?.learning_style) {
          traits.push({
            id: '1',
            trait: `${profileData.learning_style.charAt(0).toUpperCase() + profileData.learning_style.slice(1)} Learner`,
            description: `You prefer ${profileData.learning_style} learning methods`,
            icon: profileData.learning_style === 'visual' ? Eye : MessageCircle,
            confirmed: true
          })
        }

        if (profileData?.learning_pace) {
          traits.push({
            id: '2',
            trait: `${profileData.learning_pace.charAt(0).toUpperCase() + profileData.learning_pace.slice(1)} Pace`,
            description: `You learn at a ${profileData.learning_pace} pace`,
            icon: Clock,
            confirmed: true
          })
        }

        if (profileData?.communication_style) {
          traits.push({
            id: '3',
            trait: `${profileData.communication_style.charAt(0).toUpperCase() + profileData.communication_style.slice(1)} Communication`,
            description: `You prefer ${profileData.communication_style} communication`,
            icon: profileData.communication_style === 'visual' ? Eye : MessageCircle,
            confirmed: true
          })
        }

        if (profileData?.difficulty_preference) {
          traits.push({
            id: '4',
            trait: `${profileData.difficulty_preference.charAt(0).toUpperCase() + profileData.difficulty_preference.slice(1)} Challenges`,
            description: `You prefer ${profileData.difficulty_preference} difficulty levels`,
            icon: Target,
            confirmed: true
          })
        }

        setLearningTraits(traits)

        // Focus areas from user's study goals and interests
        const focusAreasData: FocusArea[] = []

        // Add study goals as focus areas
        if (profileData?.study_goals && Array.isArray(profileData.study_goals)) {
          profileData.study_goals.slice(0, 2).forEach((goal: string, index: number) => {
            focusAreasData.push({
              id: `goal-${index}`,
              topic: goal,
              reason: 'From your study goals',
              timeToFix: 'Ongoing',
              priority: index === 0 ? 'high' : 'medium' as const
            })
          })
        }

        // Add favorite topics as focus areas
        if (profileData?.favorite_topics && Array.isArray(profileData.favorite_topics)) {
          profileData.favorite_topics.slice(0, 2).forEach((topic: string, index: number) => {
            if (focusAreasData.length < 3) {
              focusAreasData.push({
                id: `topic-${index}`,
                topic: topic,
                reason: 'Your favorite subject',
                timeToFix: 'Practice regularly',
                priority: 'medium' as const
              })
            }
          })
        }

        // Add subjects if we still need more
        if (profileData?.subjects && Array.isArray(profileData.subjects) && focusAreasData.length < 3) {
          profileData.subjects.slice(0, 1).forEach((subject: string, index: number) => {
            focusAreasData.push({
              id: `subject-${index}`,
              topic: subject,
              reason: 'Your selected subject',
              timeToFix: 'Continuous learning',
              priority: 'low' as const
            })
          })
        }

        setFocusAreas(focusAreasData)

        // Load real growth timeline from study sessions and quiz results (handle missing tables)
        let sessionsData = null
        try {
          const { data, error } = await supabase
            .from('study_sessions')
            .select('topic, subject, performance_score, notes, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10)

          if (!error) {
            sessionsData = data
          }
        } catch (error) {
          console.warn('study_sessions table not found:', error)
        }

        let quizData = null
        try {
          const { data, error } = await supabase
            .from('quizzes')
            .select('id, topic, subject, score, total_questions, weak_areas, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10)

          if (!error) {
            quizData = data
          }
        } catch (error) {
          console.warn('quizzes table not found:', error)
        }

        const timeline: GrowthEntry[] = []

        // Add quiz breakthroughs (high scores)
        if (quizData) {
          quizData.forEach((quiz, index) => {
            if (quiz.score && quiz.total_questions) {
              const percentage = (quiz.score / quiz.total_questions) * 100
              if (percentage >= 80) {
                timeline.push({
                  id: `quiz-${quiz.id}`,
                  date: new Date(quiz.created_at).toLocaleDateString(),
                  topic: quiz.topic || 'Quiz',
                  type: 'breakthrough',
                  description: `Scored ${Math.round(percentage)}% on ${quiz.topic || 'quiz'}!`,
                  currentUnderstanding: `Mastered ${quiz.total_questions} questions`
                })
              } else if (percentage < 50 && quiz.weak_areas && quiz.weak_areas.length > 0) {
                timeline.push({
                  id: `quiz-${quiz.id}`,
                  date: new Date(quiz.created_at).toLocaleDateString(),
                  topic: quiz.topic || 'Quiz',
                  type: 'struggle',
                  description: `Identified weak areas: ${quiz.weak_areas.join(', ')}`,
                  currentUnderstanding: `Need to focus on: ${quiz.weak_areas[0]}`
                })
              }
            }
          })
        }

        // Add study session insights
        if (sessionsData) {
          sessionsData.forEach((session, index) => {
            if (session.notes) {
              timeline.push({
                id: `session-${(session as any).id || index}`,
                date: new Date(session.created_at).toLocaleDateString(),
                topic: session.topic || session.subject || 'Study Session',
                type: session.performance_score && session.performance_score > 80 ? 'breakthrough' : 'insight',
                description: session.notes.substring(0, 100),
                currentUnderstanding: session.performance_score ? `Performance: ${session.performance_score}%` : undefined
              })
            }
          })
        }

        // Sort by date (most recent first) and limit to 10
        timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        // If no timeline data, add some recent activity from chat messages
        if (timeline.length === 0) {
          try {
            const { data: messages } = await supabase
              .from('messages')
              .select('content, created_at')
              .eq('role', 'assistant')
              .eq('chat_id', user.id) // This might need adjustment based on your schema
              .order('created_at', { ascending: false })
              .limit(5)

            if (messages && messages.length > 0) {
              messages.forEach((message, index) => {
                const topic = message.content.split(' ').slice(0, 3).join(' ')
                timeline.push({
                  id: `message-${index}`,
                  date: new Date(message.created_at).toLocaleDateString(),
                  topic: topic,
                  type: 'insight' as const,
                  description: 'Learning session completed',
                  currentUnderstanding: 'Explored new concepts'
                })
              })
            }
          } catch (error) {
            console.warn('Could not load messages for timeline:', error)
          }
        }

        // If still no data, add a welcome entry
        if (timeline.length === 0) {
          timeline.push({
            id: 'welcome',
            date: new Date().toLocaleDateString(),
            topic: 'Welcome to brAIny',
            type: 'insight' as const,
            description: 'Started your learning journey',
            currentUnderstanding: 'Ready to learn and grow'
          })
        }

        setGrowthTimeline(timeline.slice(0, 10))

        // Load Adaptive Learning DNA - Background Fetch
        getLearningDNA(user.id, supabase)
          .then(dna => setLearningDNA(dna))
          .catch(err => console.warn('You page DNA fetch error:', err))

        setLoading(false)
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Failed to load your data. Please try again.')
        setLoading(false)
      }
    }

    loadData()
  }, [router, supabase, mounted])

  const toggleTraitConfirmation = (traitId: string) => {
    setLearningTraits(traits =>
      traits.map(trait =>
        trait.id === traitId
          ? { ...trait, confirmed: !trait.confirmed }
          : trait
      )
    )
  }

  if (loading || !mounted) {
    return <LoadingScreen message="Loading your learner passport..." />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Oops!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900/20 pb-28 safe-area-pb">
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 animate-fade-in">
            You
          </h1>
          <p className="text-gray-600 dark:text-gray-400 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Your learner passport
          </p>
        </div>

        {/* Profile Card */}
        <div className="glass rounded-3xl p-6 shadow-glass animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {profile?.display_name || 'Learning Star'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Grade {profile?.grade_level || 'Not set'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/onboarding?edit=true')}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Edit Profile"
              >
                <Edit3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {profile?.subjects?.length || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Subjects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {profile?.study_goals?.length || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Goals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {profile?.interests?.length || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Interests</div>
            </div>
          </div>
        </div>

        {/* Adaptive DNA Dashboard (Moved from Home) */}
        <div className="animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <div className="relative group">
            <div className="relative glass rounded-[2.5rem] p-6 shadow-glass overflow-hidden border border-blue-500/10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Fingerprint className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Learning DNA</h2>
                  <p className="text-xs text-gray-500 dark:text-white/40">Neural profile active</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-white/30">Cognitive Style</span>
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-sm text-gray-800 dark:text-white capitalize">{learningDNA?.cognitive_style || 'Analyzing...'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-white/30">Neural Flow</span>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-sm text-gray-800 dark:text-white capitalize">{learningDNA?.streak_momentum ? 'High' : 'Active'}</span>
                  </div>
                </div>
              </div>

              {learningDNA?.predicted_struggle_points && learningDNA.predicted_struggle_points.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                  <p className="text-xs text-gray-600 dark:text-white/50 mb-2 flex items-center gap-2">
                    <Activity className="w-3 h-3 text-red-400" />
                    Friction detected in <span className="text-gray-900 dark:text-white font-bold">{learningDNA.predicted_struggle_points[0]}</span>
                  </p>
                  <button 
                    onClick={() => router.push(`/tutor?new=true&message=${encodeURIComponent(`I noticed I'm struggling with ${learningDNA.predicted_struggle_points[0]}. Can you explain it differently?`)}`)}
                    className="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-1 group/btn"
                  >
                    Start Targeted Session <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* How You Learn */}
        <div className="glass-green rounded-3xl p-6 shadow-glow-green animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">How You Learn</h3>
            </div>
            <button
              onClick={() => setEditingTraits(!editingTraits)}
              className="p-2 rounded-xl hover:bg-white/20 transition-colors"
            >
              <Edit3 className="w-4 h-4 text-green-600" />
            </button>
          </div>

          <div className="space-y-3">
            {learningTraits.map((trait, index) => {
              const Icon = trait.icon
              return (
                <div key={trait.id} className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">{trait.trait}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{trait.description}</p>
                    </div>
                    {editingTraits && (
                      <button
                        onClick={() => toggleTraitConfirmation(trait.id)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${trait.confirmed
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                          }`}
                      >
                        {trait.confirmed && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Focus Areas */}
        <div className="glass-orange rounded-3xl p-6 shadow-glow-orange animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Focus Areas</h3>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Max 3 at a time</span>
          </div>

          <div className="space-y-3">
            {focusAreas.map((area, index) => (
              <div key={area.id} className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">{area.topic}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{area.reason}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${area.priority === 'high' ? 'bg-red-500' :
                      area.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{area.timeToFix}</span>
                  <button
                    onClick={() => router.push(`/tutor?mode=practice&subject=${encodeURIComponent(area.topic)}`)}
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors"
                  >
                    Practice
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Your Interests */}
        {profile?.interests && Array.isArray(profile.interests) && profile.interests.length > 0 && (
          <div className="glass-purple rounded-3xl p-6 shadow-glow-purple animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Interests</h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm transition-all duration-300 hover:scale-105"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Growth Timeline */}
        <div className="glass-blue rounded-3xl p-6 shadow-glow-blue animate-slide-up" style={{ animationDelay: '0.7s' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Growth Timeline</h3>
          </div>

          <div className="space-y-4">
            {growthTimeline.map((entry, index) => (
              <div key={entry.id} className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${entry.type === 'breakthrough' ? 'bg-green-100 dark:bg-green-900/30' :
                      entry.type === 'mistake' ? 'bg-red-100 dark:bg-red-900/30' :
                        entry.type === 'insight' ? 'bg-purple-100 dark:bg-purple-900/30' :
                          'bg-yellow-100 dark:bg-yellow-900/30'
                    }`}>
                    {entry.type === 'breakthrough' && <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />}
                    {entry.type === 'mistake' && <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />}
                    {entry.type === 'insight' && <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                    {entry.type === 'struggle' && <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{entry.topic}</h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{entry.date}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{entry.description}</p>

                    {entry.currentUnderstanding && (
                      <div className="space-y-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Current Understanding:</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{entry.currentUnderstanding}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>


        {/* Quick Actions */}
        <div className="space-y-3 animate-slide-up" style={{ animationDelay: '1.0s' }}>
          <button
            onClick={() => router.push('/tutor')}
            className="w-full glass-subtle rounded-2xl p-4 flex items-center justify-between hover:scale-[1.02] transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white">Start Learning</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Begin a new study session</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </button>


          <button
            onClick={() => router.push('/quiz')}
            className="w-full glass-subtle rounded-2xl p-4 flex items-center justify-between hover:scale-[1.02] transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white">Take Quiz</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Test your knowledge</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <BottomNavigation />
      </div>

      <BottomNavigation />
    </div>
  )
}
