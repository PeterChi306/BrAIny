'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { getUserConceptMastery, getConceptMasteryStats, ConceptMastery } from '@/lib/concept-mastery'
import { BottomNavigation } from '@/components/BottomNavigation'
import { LoadingScreen } from '@/components/LoadingScreen'
import { ArrowLeft, Trophy, Brain, Target, TrendingUp, BookOpen } from 'lucide-react'

interface ConceptStats {
  totalConcepts: number
  masteredConcepts: number
  averageMastery: number
  conceptsByCategory: Record<string, number>
}

export default function ConceptsPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [concepts, setConcepts] = useState<ConceptMastery[]>([])
  const [stats, setStats] = useState<ConceptStats | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const loadConcepts = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/home')
          return
        }

        // Load real concept mastery data
        const [conceptsData, statsData] = await Promise.all([
          getUserConceptMastery(session.user.id),
          getConceptMasteryStats(session.user.id)
        ])
        
        setConcepts(conceptsData)
        setStats(statsData)
      } catch (error) {
        console.error('Error loading concepts:', error)
      } finally {
        setLoading(false)
      }
    }

    loadConcepts()
  }, [mounted, router, supabase])

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/30'
    if (mastery >= 60) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
    return 'text-red-600 bg-red-100 dark:bg-red-900/30'
  }

  const getMasteryIcon = (mastery: number) => {
    if (mastery >= 80) return Trophy
    if (mastery >= 60) return Target
    return Brain
  }

  if (!mounted) {
    return <LoadingScreen message="Loading concepts..." />
  }

  if (loading) {
    return <LoadingScreen message="Loading your learning concepts..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Learning Concepts</h1>
          <div className="w-9" />
        </div>

        {/* Stats Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <Trophy className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{concepts.length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Concepts</p>
            </div>
            <div>
              <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {concepts.filter(c => c.mastery_level >= 80).length}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Mastered</p>
            </div>
            <div>
              <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats?.averageMastery || 0}%
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Avg Mastery</p>
            </div>
          </div>
        </div>

        {/* Concepts List */}
        <div className="space-y-4 mb-20">
          {concepts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
              <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No concepts yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start learning to unlock your first concepts!
              </p>
              <button
                onClick={() => router.push('/tutor')}
                className="bg-green-600 text-white rounded-xl px-6 py-3 font-medium hover:bg-green-700 transition-colors"
              >
                Start Learning
              </button>
            </div>
          ) : (
            concepts.map((concept) => {
              const Icon = getMasteryIcon(concept.mastery_level)
              const masteryClass = getMasteryColor(concept.mastery_level)
              
              return (
                <div
                  key={concept.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {concept.concept_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Practiced {concept.practice_count} times • {concept.correct_answers}/{concept.total_attempts} correct
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${masteryClass}`}>
                      {concept.mastery_level}% mastered
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {concept.mastery_level >= 80 ? 'Mastered' : 
                           concept.mastery_level >= 60 ? 'Learning' : 'Started'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Last studied: {new Date(concept.last_practiced).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/tutor?topic=${encodeURIComponent(concept.concept_name)}`)}
                      className="text-green-600 hover:text-green-700 font-medium text-sm"
                    >
                      Practice
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
