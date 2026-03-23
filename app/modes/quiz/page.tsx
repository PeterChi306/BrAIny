'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FileUpload } from '@/components/ui/FileUpload'
import { QuizRenderer } from '@/components/renderers/QuizRenderer'
import { ArrowLeft, Sparkles, Loader2, Brain } from 'lucide-react'
import type { QuizResponse, UploadedFile } from '@/types/modes'

export default function QuizModePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseClient()

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [input, setInput] = useState(searchParams.get('text') || '')
  const [quiz, setQuiz] = useState<QuizResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [topic, setTopic] = useState(searchParams.get('topic') || '')

  useEffect(() => {
    // Check for custom interface mode
    const isCustom = searchParams.get('custom') === 'true'
    
    if (isCustom) {
      // Load quiz data from sessionStorage
      const storedQuiz = sessionStorage.getItem('currentQuiz')
      if (storedQuiz) {
        const { quiz: quizData, topic: quizTopic, subject: quizSubject } = JSON.parse(storedQuiz)
        setQuiz(quizData)
        setTopic(quizTopic || '')
        // Clear sessionStorage after loading
        sessionStorage.removeItem('currentQuiz')
      }
    } else if (searchParams.get('text') && !quiz) {
      // Auto-generate quiz if text is provided in URL
      handleGenerateQuiz()
    }
  }, [searchParams])

  const handleGenerateQuiz = async () => {
    if (!input.trim() && uploadedFiles.length === 0) {
      alert('Please enter a topic or upload files to generate a quiz.')
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

      const response = await fetch('/api/modes/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic || 'General Knowledge',
          context,
          difficulty: 'medium',
          numQuestions: 5,
          files: uploadedFiles.map(f => ({
            name: f.name,
            type: f.type,
            content: f.content
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate quiz')
      }

      const result = await response.json()
      setQuiz(result.quiz)
    } catch (error: any) {
      console.error('Quiz generation error:', error)
      alert(error.message || 'Failed to generate quiz. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuizComplete = (score: number, total: number) => {
    // Save quiz results to database
    const saveResults = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        await supabase.from('quizzes').insert({
          user_id: session.user.id,
          topic: topic || 'General Knowledge',
          score,
          total_questions: total,
          status: 'completed',
          created_at: new Date().toISOString()
        })
      } catch (error) {
        console.error('Error saving quiz results:', error)
      }
    }

    saveResults()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-green-100/20 dark:from-black dark:via-gray-950 dark:to-green-950/20 pb-28">
      {/* Header */}
      <div className="glass-strong border-b border-white/20 dark:border-white/10 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/home')}
              className="p-2.5 rounded-2xl hover:bg-green-50/50 dark:hover:bg-green-950/30 transition-all active:scale-95 border border-transparent hover:border-green-200/50 dark:hover:border-green-500/30"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Interactive Quiz Mode
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-bold mt-0.5">
                Generate and take adaptive quizzes
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {!quiz ? (
          <div className="space-y-6">
            {/* Input Section */}
            <Card className="p-6" glow>
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">Create Your Quiz</h2>
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
                    placeholder="e.g., American History, Biology, Algebra"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Context (optional)
                  </label>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Add specific topics, concepts, or questions you want to focus on..."
                    className="w-full h-32 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 resize-none"
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
              onClick={handleGenerateQuiz}
              disabled={loading || (!topic.trim() && uploadedFiles.length === 0)}
              glow
              className="w-full py-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Interactive Quiz
                </>
              )}
            </Button>

            {/* Quick Start Templates */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Start Templates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { topic: 'World War II', context: 'Causes, major events, and consequences' },
                  { topic: 'Cell Biology', context: 'Cell structure, organelles, and processes' },
                  { topic: 'Shakespeare', context: 'Major plays, themes, and literary devices' },
                  { topic: 'Climate Change', context: 'Causes, effects, and solutions' }
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
          </div>
        ) : (
          <QuizRenderer
            quiz={quiz}
            onComplete={handleQuizComplete}
          />
        )}
      </div>
    </div>
  )
}
