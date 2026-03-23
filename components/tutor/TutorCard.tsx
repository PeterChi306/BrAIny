'use client'

import { useState, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Brain, Star } from 'lucide-react'
import { QuizInterface } from './QuizInterface'
import { FlashcardInterface } from './FlashcardInterface'
import { StudyGuideDownloader } from './StudyGuideDownloader'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'
import { parseActionButtons } from '@/lib/ai-response-parser'

interface TutorCardProps {
  content: string
  headline?: string
  userName?: string
  userInterests?: string[]
  isTyping?: boolean
  onComplete?: () => void
  className?: string
  isQuizRequest?: boolean
  isFlashcardRequest?: boolean
  imageData?: string
}

export function TutorCard({
  content,
  headline,
  userName = 'Student',
  userInterests = [],
  isTyping = false,
  onComplete,
  className,
  isQuizRequest = false,
  isFlashcardRequest = false,
  imageData
}: TutorCardProps) {
  const [displayedContent, setDisplayedContent] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  const { text: contentWithoutButtons } = useMemo(() => parseActionButtons(content), [content])
  const words = contentWithoutButtons.trim().split(/\s+/).filter(Boolean)

  const isStudyGuide = content.includes('◈ STUDY GUIDE:')

  useEffect(() => {
    if (isTyping) {
      setDisplayedContent('')
      setIsComplete(false)
      let currentWordIndex = 0
      const interval = setInterval(() => {
        if (currentWordIndex < words.length) {
          setDisplayedContent(prev => prev + (prev ? ' ' : '') + words[currentWordIndex])
          currentWordIndex++
        } else {
          setIsComplete(true)
          clearInterval(interval)
          onComplete?.()
        }
      }, 80)
      return () => clearInterval(interval)
    } else {
      setDisplayedContent(contentWithoutButtons)
      setIsComplete(true)
    }
  }, [isTyping, contentWithoutButtons])

  return (
    <div className={cn(
      'relative font-sans',
      className
    )}>
      {/* Custom Interfaces for Quiz and Flashcard */}
      {isQuizRequest && (
        <div className="px-6 py-5">
          <QuizInterface content={content} onComplete={onComplete} />
        </div>
      )}

      {isFlashcardRequest && (
        <div className="px-6 py-5">
          <FlashcardInterface content={content} onComplete={onComplete} />
        </div>
      )}

      {/* Regular AI Response — strictly integrated look */}
      {!isQuizRequest && !isFlashcardRequest && (
        <>
          {/* Display image if present */}
          {imageData && (
            <div className="px-6 pt-5">
              <div className="bg-white/5 rounded-xl p-2 max-w-xs border border-white/10 mx-auto">
                <img
                  src={imageData}
                  alt="Scanned document"
                  className="w-full h-auto rounded-lg max-h-48 object-contain"
                />
              </div>
            </div>
          )}

          <div className="px-6 py-5">
            <MarkdownRenderer content={displayedContent || ' '} className="text-slate-900 dark:text-white font-sans text-lg leading-relaxed antialiased" />
          </div>

          {/* Study Guide Download Options */}
          {isStudyGuide && isComplete && (
            <div className="px-6 pb-6">
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Star className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-base tracking-tight">Study Guide Ready</p>
                      <p className="text-sm text-slate-500 dark:text-white/40">Download for offline review</p>
                    </div>
                  </div>
                  <StudyGuideDownloader
                    content={content}
                    topic={headline || "Study Guide"}
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

