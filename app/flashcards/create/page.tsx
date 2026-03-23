'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, Plus, X, Loader2, RotateCcw, BookOpen, Target, Brain } from 'lucide-react'
import { BottomNavigation } from '@/components/BottomNavigation'
import { Profile } from '@/types/database'

interface Flashcard {
  id: string
  front: string
  back: string
  difficulty?: 'easy' | 'medium' | 'hard'
}

export default function FlashcardCreationPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [topic, setTopic] = useState('')
  const [subject, setSubject] = useState('')
  const [numCards, setNumCards] = useState(5)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentCard, setCurrentCard] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [studyMode, setStudyMode] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth/login')
        return
      }

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
    }

    loadProfile()
  }, [router, supabase])

  const generateFlashcards = async () => {
    if (!topic.trim()) {
      alert('Please enter a topic for the flashcards')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          subject: subject || null,
          content: topic,
          numCards,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to generate flashcards')
      }

      if (result.flashcards) {
        setFlashcards(result.flashcards)
        setCurrentCard(0)
        setIsFlipped(false)
        setStudyMode(false)
      }
    } catch (error: any) {
      console.error('Error generating flashcards:', error)
      alert(error.message || 'Failed to generate flashcards. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const nextCard = () => {
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(currentCard + 1)
      setIsFlipped(false)
    }
  }

  const prevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1)
      setIsFlipped(false)
    }
  }

  const shuffleCards = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5)
    setFlashcards(shuffled)
    setCurrentCard(0)
    setIsFlipped(false)
  }

  const saveFlashcards = async () => {
    if (flashcards.length === 0) return

    setLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return

      // Save flashcards to database
      const { data: flashcardSet, error: flashcardError } = await supabase
        .from('flashcard_sets')
        .insert({
          user_id: session.user.id,
          title: `${topic} Flashcards`,
          topic: topic,
          subject: subject || null,
          cards: flashcards,
        })
        .select()
        .single()

      if (flashcardError) throw flashcardError

      alert('Flashcards saved successfully!')
      router.push('/flashcards')
    } catch (error: any) {
      console.error('Error saving flashcards:', error)
      alert('Failed to save flashcards. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const addManualCard = () => {
    const newCard: Flashcard = {
      id: Math.random().toString(36).substr(2, 9),
      front: '',
      back: '',
      difficulty: 'medium'
    }
    setFlashcards([...flashcards, newCard])
  }

  const updateCard = (index: number, field: 'front' | 'back', value: string) => {
    const updatedCards = [...flashcards]
    updatedCards[index] = { ...updatedCards[index], [field]: value }
    setFlashcards(updatedCards)
  }

  const deleteCard = (index: number) => {
    const updatedCards = flashcards.filter((_, i) => i !== index)
    setFlashcards(updatedCards)
    if (currentCard >= updatedCards.length && currentCard > 0) {
      setCurrentCard(currentCard - 1)
    }
  }

  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/home')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-primary dark:text-inverse">Create Flashcards</h1>
              <p className="text-sm text-secondary dark:text-inverse-secondary">Generate custom flashcards</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6">
          <Card className="p-6 bg-card dark:bg-card-dark shadow-card">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary dark:text-inverse mb-2">
                  Topic *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Biology Terms, Historical Dates, Vocabulary"
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-primary dark:text-inverse placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary dark:text-inverse mb-2">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-primary dark:text-inverse"
                >
                  <option value="">Select a subject</option>
                  <option value="math">Mathematics</option>
                  <option value="science">Science</option>
                  <option value="history">History</option>
                  <option value="english">English</option>
                  <option value="geography">Geography</option>
                  <option value="languages">Foreign Languages</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary dark:text-inverse mb-2">
                  Number of Cards
                </label>
                <select
                  value={numCards}
                  onChange={(e) => setNumCards(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-primary dark:text-inverse"
                >
                  <option value={3}>3 cards</option>
                  <option value={5}>5 cards</option>
                  <option value={10}>10 cards</option>
                  <option value={15}>15 cards</option>
                  <option value={20}>20 cards</option>
                </select>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={generateFlashcards}
                  disabled={generating || !topic.trim()}
                  className="flex-1"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Generate AI Cards
                    </>
                  )}
                </Button>
                <Button
                  onClick={addManualCard}
                  variant="outline"
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Manually
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <BottomNavigation />
      </div>
    )
  }

  if (!studyMode) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/home')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-primary dark:text-inverse">Edit Flashcards</h1>
              <p className="text-sm text-secondary dark:text-inverse-secondary">{flashcards.length} cards</p>
            </div>
            <Button
              onClick={() => setStudyMode(true)}
              size="sm"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Study
            </Button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {flashcards.map((card, index) => (
            <Card key={card.id} className="p-4 bg-card dark:bg-card-dark shadow-card">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary dark:text-inverse">
                    Card {index + 1}
                  </span>
                  <button
                    onClick={() => deleteCard(index)}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-secondary dark:text-inverse-secondary mb-1">
                    Front (Question/Term)
                  </label>
                  <textarea
                    value={card.front}
                    onChange={(e) => updateCard(index, 'front', e.target.value)}
                    placeholder="Enter the question or term"
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-primary dark:text-inverse placeholder-gray-500 dark:placeholder-gray-400"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary dark:text-inverse-secondary mb-1">
                    Back (Answer/Definition)
                  </label>
                  <textarea
                    value={card.back}
                    onChange={(e) => updateCard(index, 'back', e.target.value)}
                    placeholder="Enter the answer or definition"
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-primary dark:text-inverse placeholder-gray-500 dark:placeholder-gray-400"
                    rows={2}
                  />
                </div>
              </div>
            </Card>
          ))}

          <div className="flex gap-3">
            <Button
              onClick={addManualCard}
              variant="outline"
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Card
            </Button>
            <Button
              onClick={saveFlashcards}
              disabled={loading || flashcards.some(card => !card.front.trim() || !card.back.trim())}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Save Flashcards'
              )}
            </Button>
          </div>
        </div>

        <BottomNavigation />
      </div>
    )
  }

  const card = flashcards[currentCard]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStudyMode(false)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-lg font-bold text-primary dark:text-inverse">Study Flashcards</h1>
              <span className="text-sm text-secondary dark:text-inverse-secondary">
                {currentCard + 1} / {flashcards.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentCard + 1) / flashcards.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex justify-center mb-6">
          <button
            onClick={shuffleCards}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-card hover:shadow-lg transition-all"
          >
            <RotateCcw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="relative h-64 mb-6">
          <div
            className="absolute inset-0 w-full h-full cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
            style={{
              transformStyle: 'preserve-3d',
              transition: 'transform 0.6s',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front of card */}
            <div
              className="absolute inset-0 w-full h-full bg-card dark:bg-card-dark shadow-card rounded-2xl flex items-center justify-center p-6 backface-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="text-center">
                <h3 className="text-lg font-semibold text-primary dark:text-inverse mb-2">
                  Front
                </h3>
                <p className="text-primary dark:text-inverse">
                  {card.front}
                </p>
              </div>
            </div>

            {/* Back of card */}
            <div
              className="absolute inset-0 w-full h-full bg-blue-600 text-white rounded-2xl flex items-center justify-center p-6"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                  Back
                </h3>
                <p className="text-white">
                  {card.back}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
          <p className="text-sm text-secondary dark:text-inverse-secondary mb-2">
            Click card to flip
          </p>
        </div>

        <div className="flex justify-between items-center">
          <Button
            onClick={prevCard}
            disabled={currentCard === 0}
            variant="outline"
          >
            Previous
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-secondary dark:text-inverse-secondary">
              Card {currentCard + 1} of {flashcards.length}
            </p>
          </div>

          <Button
            onClick={nextCard}
            disabled={currentCard === flashcards.length - 1}
          >
            Next
          </Button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
