'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FileUpload } from '@/components/ui/FileUpload'
import { FlashcardRenderer } from '@/components/renderers/FlashcardRenderer'
import { ArrowLeft, Sparkles, Loader2, Brain } from 'lucide-react'
import type { FlashcardResponse, UploadedFile } from '@/types/modes'

export default function FlashcardsModePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseClient()

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [input, setInput] = useState(searchParams.get('text') || '')
  const [flashcards, setFlashcards] = useState<FlashcardResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [topic, setTopic] = useState(searchParams.get('topic') || '')

  useEffect(() => {
    // Check for custom interface mode
    const isCustom = searchParams.get('custom') === 'true'
    
    if (isCustom) {
      // Load flashcard data from sessionStorage
      const storedFlashcards = sessionStorage.getItem('currentFlashcards')
      if (storedFlashcards) {
        const { flashcards: flashcardData, topic: flashcardTopic, subject: flashcardSubject } = JSON.parse(storedFlashcards)
        setFlashcards(flashcardData)
        setTopic(flashcardTopic || '')
        // Clear sessionStorage after loading
        sessionStorage.removeItem('currentFlashcards')
      }
    } else if (searchParams.get('text') && !flashcards) {
      // Auto-generate flashcards if text is provided in URL
      handleGenerateFlashcards()
    }
  }, [searchParams])

  const handleGenerateFlashcards = async () => {
    if (!input.trim() && uploadedFiles.length === 0) {
      alert('Please enter a topic or upload files to generate flashcards.')
      return
    }

    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      // Prepare context from files and input
      let context = input
      if (uploadedFiles.length > 0) {
        const fileContents = uploadedFiles
          .map(file => file.content)
          .filter(Boolean)
          .join('\n\n')
        context = fileContents || input
      }

      const response = await fetch('/api/modes/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic || 'General Study',
          context,
          numCards: 10,
          difficulty: 'medium',
          files: uploadedFiles.map(f => ({
            name: f.name,
            type: f.type,
            content: f.content
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate flashcards')
      }

      const result = await response.json()
      setFlashcards(result.flashcards)
    } catch (error: any) {
      console.error('Flashcard generation error:', error)
      alert(error.message || 'Failed to generate flashcards. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFlashcardsComplete = (masteryData: { easy: number; medium: number; hard: number }) => {
    // Save flashcard session results
    const saveResults = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const totalCards = masteryData.easy + masteryData.medium + masteryData.hard
        const masteryPercentage = Math.round((masteryData.easy / totalCards) * 100)

        await supabase.from('flashcard_sessions').insert({
          user_id: session.user.id,
          topic: topic || 'General Study',
          total_cards: totalCards,
          easy_cards: masteryData.easy,
          medium_cards: masteryData.medium,
          hard_cards: masteryData.hard,
          mastery_percentage: masteryPercentage,
          created_at: new Date().toISOString()
        })
      } catch (error) {
        console.error('Error saving flashcard results:', error)
      }
    }

    saveResults()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-purple-100/20 dark:from-black dark:via-gray-950 dark:to-purple-950/20 pb-28">
      {/* Header */}
      <div className="glass-strong border-b border-white/20 dark:border-white/10 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/home')}
              className="p-2.5 rounded-2xl hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-all active:scale-95 border border-transparent hover:border-purple-200/50 dark:hover:border-purple-500/30"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Smart Flashcards
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-bold mt-0.5">
                AI-powered flashcard generation with spaced repetition
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {!flashcards ? (
          <div className="space-y-6">
            {/* Input Section */}
            <Card className="p-6" glow>
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Create Your Flashcards</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic or Subject
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Vocabulary, Historical Dates, Scientific Terms"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Study Content
                  </label>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste your notes, key concepts, vocabulary lists, or any content you want to turn into flashcards..."
                    className="w-full h-40 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
                  />
                </div>
              </div>
            </Card>

            {/* File Upload */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Upload Study Materials
              </h3>
              <FileUpload
                onFilesChange={setUploadedFiles}
                maxFiles={3}
              />
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateFlashcards}
              disabled={loading || (!topic.trim() && uploadedFiles.length === 0)}
              glow
              className="w-full py-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Flashcards...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Smart Flashcards
                </>
              )}
            </Button>

            {/* Quick Start Templates */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Popular Study Topics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { topic: 'SAT Vocabulary', context: 'Common SAT words and their definitions' },
                  { topic: 'US Presidents', context: 'Presidents, terms, and major accomplishments' },
                  { topic: 'Chemistry Elements', context: 'Periodic table, symbols, and properties' },
                  { topic: 'Literary Devices', context: 'Metaphors, similes, personification, etc.' }
                ].map((template, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => {
                      setTopic(template.topic)
                      setInput(template.context)
                    }}
                    className="text-left justify-start"
                  >
                    <div>
                      <div className="font-medium">{template.topic}</div>
                      <div className="text-xs text-gray-500">{template.context}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </Card>

            {/* Features */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">
                Why Smart Flashcards?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl mb-2">🧠</div>
                  <h4 className="font-semibold text-purple-900 mb-1">AI-Powered</h4>
                  <p className="text-sm text-purple-700">
                    Intelligently generates Q&A pairs from your content
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">📈</div>
                  <h4 className="font-semibold text-purple-900 mb-1">Spaced Repetition</h4>
                  <p className="text-sm text-purple-700">
                    Tracks mastery and schedules reviews optimally
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🎯</div>
                  <h4 className="font-semibold text-purple-900 mb-1">Adaptive Learning</h4>
                  <p className="text-sm text-purple-700">
                    Focuses on difficult concepts automatically
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <FlashcardRenderer
            flashcards={flashcards}
            onComplete={handleFlashcardsComplete}
          />
        )}
      </div>
    </div>
  )
}
