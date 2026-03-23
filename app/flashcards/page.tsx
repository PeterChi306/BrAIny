'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EnhancedFlashcard } from '@/components/flashcards/EnhancedFlashcard'
import { Flashcard } from '@/types/database'
import { updateStudyStreak } from '@/lib/streak'
import {
  ArrowLeft,
  Sparkles,
  Plus,
  Brain,
  Target,
  TrendingUp,
  Clock,
  BarChart3,
  BookOpen,
  History
} from 'lucide-react'
import { BottomNavigation } from '@/components/BottomNavigation'

export default function FlashcardsPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()

  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [recentFlashcards, setRecentFlashcards] = useState<any[]>([])

  useEffect(() => {
    loadFlashcards()
    loadRecentFlashcards()
  }, [])

  const loadFlashcards = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      // Load flashcards that need review (or all if none need review)
      const { data: cardsData, error } = await supabase
        .from('flashcards')
        .select('*')
        .order('next_review_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setFlashcards(cardsData || [])
      setLoading(false)
    } catch (error: any) {
      console.error('Error loading flashcards:', error)
      setLoading(false)
    }
  }

  const loadRecentFlashcards = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: recent } = await supabase
        .from('flashcard_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentFlashcards(recent || [])
    } catch (error) {
      console.error('Error loading recent flashcards:', error)
    }
  }

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleDifficulty = async (difficulty: 'easy' | 'medium' | 'hard') => {
    const currentCard = flashcards[currentIndex]
    if (!currentCard) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update study streak for flashcard review
      try {
        await updateStudyStreak(user.id, 'flashcards')
      } catch (streakError) {
        console.warn('Flashcards: Failed to update study streak', streakError)
      }

      // Calculate new mastery level and next review time
      let newMasteryLevel = currentCard.mastery_level || 0
      let nextReviewAt = new Date()

      if (difficulty === 'easy') {
        newMasteryLevel = Math.min(newMasteryLevel + 2, 5)
        nextReviewAt.setDate(nextReviewAt.getDate() + 7) // Review in 7 days
      } else if (difficulty === 'medium') {
        newMasteryLevel = Math.min(newMasteryLevel + 1, 5)
        nextReviewAt.setDate(nextReviewAt.getDate() + 3) // Review in 3 days
      } else {
        newMasteryLevel = Math.max(newMasteryLevel - 1, 0)
        nextReviewAt.setDate(nextReviewAt.getDate() + 1) // Review tomorrow
      }

      // Update the flashcard
      await supabase
        .from('flashcards')
        .update({
          mastery_level: newMasteryLevel,
          next_review_at: nextReviewAt.toISOString(),
          review_count: (currentCard.review_count || 0) + 1,
          last_reviewed_at: new Date().toISOString()
        })
        .eq('id', currentCard.id)

      // Move to next card
      handleNext()
    } catch (error) {
      console.error('Error updating flashcard:', error)
    }
  }

  const createNewFlashcards = () => {
    router.push('/tutor?mode=flashcards')
  }

  const getStats = () => {
    const mastered = flashcards.filter(f => (f.mastery_level || 0) >= 4).length
    const learning = flashcards.filter(f => (f.mastery_level || 0) >= 2 && (f.mastery_level || 0) < 4).length
    const newCards = flashcards.filter(f => (f.mastery_level || 0) < 2).length

    return { mastered, learning, newCards }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse">
            <div className="w-16 h-16 bg-blue-500 rounded-full blur-xl opacity-50"></div>
          </div>
          <div className="relative animate-spin">
            <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L14.09 8.26L20.18 8.27L15.54 11.97L17.64 18.23L12 14.47L6.36 18.23L8.46 11.97L3.82 8.27L9.91 8.26L12 2Z"
                fill="url(#gradient)"
                className="drop-shadow-lg"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    )
  }

  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 pb-24">
        <div className="px-4 py-6 max-w-lg mx-auto">
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No flashcards yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Create your first flashcard to start learning
            </p>
            <Button
              onClick={createNewFlashcards}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Flashcard
            </Button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  const stats = getStats()
  const currentCard = flashcards[currentIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 pb-24">
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => router.back()}
            className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Flashcards</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {currentCard?.subject || 'General'}
            </p>
          </div>

          <Button
            onClick={createNewFlashcards}
            className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-md"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Stats Overview */}
        <Card className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">{stats.newCards}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">New</p>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-600">{stats.learning}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Learning</p>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{stats.mastered}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Mastered</p>
            </div>
          </div>
        </Card>

        {/* Enhanced Flashcard */}
        <EnhancedFlashcard
          flashcard={currentCard}
          currentIndex={currentIndex}
          totalCards={flashcards.length}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onDifficulty={handleDifficulty}
          showProgress={true}
        />

        {/* Recent Sessions */}
        {recentFlashcards.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5" />
                Recent Sessions
              </h3>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>

            <div className="space-y-3">
              {recentFlashcards.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {session.subject || 'Mixed Topics'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {session.cards_reviewed} cards reviewed
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-blue-600">
                      {session.accuracy || 0}%
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}
