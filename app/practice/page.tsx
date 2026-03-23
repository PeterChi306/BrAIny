'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { BottomNavigation } from '@/components/BottomNavigation'
import { useUserProfile } from '@/hooks/useUserProfile'
import { LoadingScreen } from '@/components/LoadingScreen'
import { 
  Clock, 
  Target, 
  BookOpen,
  TrendingUp,
  ArrowRight,
  Play,
  Eye,
  Trash2,
  MessageCircle,
  Brain,
  Trophy,
  AlertCircle
} from 'lucide-react'

interface StudySession {
  id: string
  topic: string
  subject: string
  duration_minutes: number
  performance_score: number | null
  created_at: string
}

interface QuizResult {
  id: string
  topic: string
  subject: string
  score: number
  total_questions: number
  weak_areas: string[]
  created_at: string
}

interface FlashcardProgress {
  subject: string
  total_cards: number
  mastered_cards: number
  review_due: number
}

export default function PracticePage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([])
  const [recentQuizzes, setRecentQuizzes] = useState<QuizResult[]>([])
  const [flashcardProgress, setFlashcardProgress] = useState<FlashcardProgress[]>([])
  const [weakAreas, setWeakAreas] = useState<string[]>([])
  const [isUsingMockData, setIsUsingMockData] = useState(false)
  const { displayName } = useUserProfile()

  useEffect(() => {
    loadRealUserProgress()
  }, [])

  const loadRealUserProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('No authenticated user found')
        router.push('/auth/login')
        return
      }

      console.log('Loading data for user:', user.id)

      // Load recent chat sessions as study sessions (using 'chats' table like Home page)
      const { data: sessions, error: sessionsError } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5)

      console.log('Sessions error:', sessionsError)
      console.log('Sessions data:', sessions)

      // Load ALL quiz results (not just completed ones)
      const { data: quizzes, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      console.log('Quizzes error:', quizzesError)
      console.log('Quizzes data:', quizzes)

      // Load ALL flashcards (not just mastered ones)
      const { data: flashcards, error: flashcardsError } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .limit(20) // Get more to show real progress

      console.log('Flashcards error:', flashcardsError)
      console.log('Flashcards data:', flashcards)

      // Calculate flashcard progress by subject
      const flashcardBySubject: Record<string, { total: number; mastered: number; reviewDue: number }> = (flashcards ?? []).reduce((acc, card) => {
        if (!acc[card.subject]) {
          acc[card.subject] = { total: 0, mastered: 0, reviewDue: 0 }
        }
        acc[card.subject].total++
        if (card.mastery_level >= 3) acc[card.subject].mastered++
        if (new Date(card.next_review_at) <= new Date()) acc[card.subject].reviewDue++
        return acc
      }, {} as Record<string, { total: number; mastered: number; reviewDue: number }>)

      const flashcardProgressArray = Object.entries(flashcardBySubject).map(([subject, data]) => ({
        subject,
        total_cards: data.total,
        mastered_cards: data.mastered,
        review_due: data.reviewDue
      }))

      // Extract weak areas from quiz results
      const allWeakAreas = quizzes?.flatMap(quiz => quiz.weak_areas || [])
      const uniqueWeakAreas = Array.from(new Set(allWeakAreas))

      // Transform chat sessions to study sessions format (using 'chats' table structure)
      const studySessions = (sessions || []).map(session => ({
        id: session.id,
        topic: session.title || session.subject || `${session.mode || 'Tutor'} Session`,
        subject: session.subject || 'General',
        duration_minutes: Math.max(15, 20), // Default 20 minutes for chat sessions
        performance_score: null, // No performance score for chat sessions
        created_at: session.created_at || session.updated_at
      }))

      // Set real data only - NO MOCK DATA
      setIsUsingMockData(false)
      setRecentSessions(studySessions)
      setRecentQuizzes(quizzes || [])
      setFlashcardProgress(flashcardProgressArray || [])
      setWeakAreas(uniqueWeakAreas || [])
    } catch (error) {
      console.error('Error loading practice data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  }

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400'
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleContinueSession = async (sessionId: string) => {
    try {
      router.push(`/tutor?session=${sessionId}`)
    } catch (error) {
      console.error('Error continuing session:', error)
    }
  }

  const handleViewSession = async (sessionId: string) => {
    try {
      router.push(`/tutor?session=${sessionId}&view=true`)
    } catch (error) {
      console.error('Error viewing session:', error)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id)

      if (error) throw error

      // Refresh the sessions list
      await loadRealUserProgress()
    } catch (error) {
      console.error('Error deleting session:', error)
      alert('Failed to delete session')
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading your progress..." />
  }

  return (
    <div className="min-h-screen bg-blue-950 dark:bg-blue-950 pb-32 safe-area-pb overflow-y-auto">
      <div className="px-4 py-6 max-w-2xl mx-auto">
        {/* Premium Header */}
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mb-4 shadow-lg">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400 text-gray-900 dark:bg-clip-text dark:text-transparent mb-2">
            Practice & Progress
          </h1>
          <p className="text-gray-400 dark:text-gray-400 text-gray-600">
            Your learning journey, {displayName}
          </p>
          {isUsingMockData && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-amber-300 font-medium">Showing sample data</span>
            </div>
          )}
        </div>

        {/* Content with proper scrolling */}
        <div className="space-y-6 pb-8">
          {/* Recent Study Sessions */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white dark:text-white text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-blue-500/20 dark:bg-blue-500/20 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-400 dark:text-blue-400 text-blue-600" />
              </div>
              Recent Study Sessions
            </h2>
            {recentSessions.length > 0 ? (
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div key={session.id} className="bg-white/10 dark:bg-white/10 bg-white border border-white/10 dark:border-white/10 border-gray-200 p-4 rounded-2xl shadow-xl hover:bg-white/15 dark:hover:bg-white/15 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-blue-500/20 dark:bg-blue-500/20 bg-blue-100 rounded-lg">
                            <MessageCircle className="w-4 h-4 text-blue-400 dark:text-blue-400 text-blue-600" />
                          </div>
                          <p className="font-semibold text-white dark:text-white text-gray-900 truncate">{session.topic}</p>
                        </div>
                        <p className="text-sm text-gray-400 dark:text-gray-400 text-gray-600 mb-2">
                          {session.subject} • {formatDuration(session.duration_minutes)}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleContinueSession(session.id)}
                            className="group relative flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-medium rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
                            <Play className="w-3 h-3 relative z-10" />
                            <span className="relative z-10">Continue</span>
                          </button>
                          <button
                            onClick={() => handleViewSession(session.id)}
                            className="group relative flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-gray-300 text-xs font-medium rounded-lg hover:bg-white/20 transition-all border border-white/20"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="group relative flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/30 transition-all border border-red-500/20"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {session.performance_score !== null ? (
                          <>
                            <p className={`text-lg font-bold ${getScoreColor(session.performance_score)}`}>
                              {session.performance_score}%
                            </p>
                            <p className="text-xs text-gray-500">Score</p>
                          </>
                        ) : (
                          <>
                            <p className="text-lg font-bold text-gray-400">
                              —
                            </p>
                            <p className="text-xs text-gray-500">Chat Session</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          ) : (
            <div className="text-center py-8 bg-white/5 dark:bg-white/5 bg-gray-50 border border-white/10 dark:border-white/10 border-gray-200 rounded-2xl">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-500/20 dark:to-purple-500/20 from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-blue-400 dark:text-blue-400 text-blue-600" />
              </div>
              <p className="text-gray-400 dark:text-gray-400 text-gray-600 font-medium">No study sessions yet</p>
              <p className="text-sm text-gray-500">Start learning to see your progress here</p>
            </div>
          )}
        </div>

        {/* Recent Quiz Results */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Target className="w-5 h-5 text-green-400" />
            </div>
            Recent Quiz Results
          </h2>
          {recentQuizzes.length > 0 ? (
            <div className="space-y-3">
              {recentQuizzes.map((quiz) => (
                <div key={quiz.id} className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-xl hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{quiz.topic}</p>
                      <p className="text-sm text-gray-400">
                        {quiz.subject} • {quiz.score}/{quiz.total_questions} questions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getScoreColor(Math.round((quiz.score / quiz.total_questions) * 100))}`}>
                        {Math.round((quiz.score / quiz.total_questions) * 100)}%
                      </p>
                      <p className="text-xs text-gray-500">Score</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-gray-400 font-medium">No quiz results yet</p>
              <p className="text-sm text-gray-500">Take a quiz to see your results here</p>
            </div>
          )}
        </div>

        {/* Flashcard Progress */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            Flashcard Progress
          </h2>
          {flashcardProgress.length > 0 ? (
            <div className="space-y-3">
              {flashcardProgress.map((progress) => (
                <div key={progress.subject} className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-xl hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-white">{progress.subject}</p>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-yellow-400 font-medium">
                        {Math.round((progress.mastered_cards / progress.total_cards) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="font-medium text-white">
                        {progress.mastered_cards}/{progress.total_cards} mastered
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500 shadow-lg"
                        style={{ width: `${(progress.mastered_cards / progress.total_cards) * 100}%` }}
                      />
                    </div>
                    {progress.review_due > 0 && (
                      <p className="text-xs text-orange-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {progress.review_due} cards due for review
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-gray-400 font-medium">No flashcards yet</p>
              <p className="text-sm text-gray-500">Create flashcards to track your mastery</p>
            </div>
          )}
        </div>

        {/* Weak Areas */}
        {weakAreas.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-400" />
              </div>
              Areas to Improve
            </h2>
            <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 backdrop-blur-md p-4 rounded-2xl border border-orange-500/20">
              <div className="flex flex-wrap gap-2">
                {weakAreas.map((area, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-300 rounded-full text-sm border border-orange-500/30"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Premium Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/tutor')}
            className="group relative p-4 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex flex-col items-center gap-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <MessageCircle className="w-6 h-6 relative z-10" />
            <span className="font-medium relative z-10">Start Session</span>
          </button>
          <button
            onClick={() => router.push('/quiz')}
            className="group relative p-4 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex flex-col items-center gap-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Target className="w-6 h-6 relative z-10" />
            <span className="font-medium relative z-10">Take Quiz</span>
          </button>
        </div>
      </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
