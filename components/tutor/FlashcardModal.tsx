'use client'

import { useState, useEffect } from 'react'
import { RotateCcw, ArrowRight, ArrowLeft, Check, Brain } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

interface Flashcard {
  front: string
  back: string
}

interface FlashcardModalProps {
  isOpen: boolean
  onClose: () => void
  content: string
  onComplete?: () => void
}

export function FlashcardModal({ isOpen, onClose, content, onComplete }: FlashcardModalProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set())
  const [startTime] = useState(Date.now())

  // Parse flashcard content
  const parseFlashcardContent = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    const cards: Flashcard[] = []
    
    let currentCard: Partial<Flashcard> = {}
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Match front pattern: Front: [content]
      if (trimmedLine.toLowerCase().startsWith('front:')) {
        // Save previous card if exists
        if (currentCard.front && currentCard.back) {
          cards.push(currentCard as Flashcard)
        }
        
        // Start new card
        currentCard = {
          front: trimmedLine.replace(/^front:\s*/i, '').trim(),
          back: ''
        }
        continue
      }
      
      // Match back pattern: Back: [content]
      if (trimmedLine.toLowerCase().startsWith('back:')) {
        currentCard.back = trimmedLine.replace(/^back:\s*/i, '').trim()
        continue
      }
      
      // If we have a front but no back yet, add to back
      if (currentCard.front && !currentCard.back) {
        currentCard.back = trimmedLine
      }
    }
    
    // Add the last card
    if (currentCard.front && currentCard.back) {
      cards.push(currentCard as Flashcard)
    }
    
    // If no structured format found, try to split content into cards
    if (cards.length === 0) {
      const sections = text.split(/\n\n+/).filter(section => section.trim())
      sections.forEach(section => {
        const lines = section.split('\n').filter(line => line.trim())
        if (lines.length >= 2) {
          cards.push({
            front: lines[0].trim(),
            back: lines.slice(1).join(' ').trim()
          })
        }
      })
    }
    
    return cards
  }

  useEffect(() => {
    if (content) {
      const parsedCards = parseFlashcardContent(content)
      setFlashcards(parsedCards)
    }
  }, [content])

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
    }
  }

  const handleMarkMastered = () => {
    const newMastered = new Set(masteredCards)
    if (newMastered.has(currentIndex)) {
      newMastered.delete(currentIndex)
    } else {
      newMastered.add(currentIndex)
    }
    setMasteredCards(newMastered)
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setMasteredCards(new Set())
  }

  const getTimeSpent = () => {
    const seconds = Math.floor((Date.now() - startTime) / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (flashcards.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Flashcards" size="md">
        <div className="p-6 text-center">
          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No flashcards found in the content</p>
        </div>
      </Modal>
    )
  }

  const currentCard = flashcards[currentIndex]
  const isMastered = masteredCards.has(currentIndex)
  const progress = ((currentIndex + 1) / flashcards.length) * 100

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Flashcards" size="md">
      <div className="p-6 pb-10">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Card {currentIndex + 1} of {flashcards.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Flashcard */}
        <div className="mb-6">
          <div 
            className="relative h-64 cursor-pointer"
            onClick={handleFlip}
          >
            <div className={`absolute inset-0 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br transition-all duration-500 transform-gpu preserve-3d ${
              isFlipped ? 'rotate-y-180' : ''
            }`}>
              {/* Front */}
              <div className="absolute inset-0 rounded-xl p-6 flex flex-col justify-center items-center text-center bg-white dark:bg-gray-800 backface-hidden">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-gray-900 dark:text-white font-medium text-lg">
                  {currentCard.front}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">
                  Click to flip
                </p>
              </div>
              
              {/* Back */}
              <div className="absolute inset-0 rounded-xl p-6 flex flex-col justify-center items-center text-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rotate-y-180 backface-hidden">
                <p className="text-gray-900 dark:text-white font-medium text-lg">
                  {currentCard.back}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">
                  Click to flip back
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Mark as mastered */}
          <button
            onClick={handleMarkMastered}
            className={`w-full px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
              isMastered
                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <Check className="w-5 h-5" />
            {isMastered ? 'Mastered' : 'Mark as Mastered'}
          </button>

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Complete/Restart */}
          {currentIndex === flashcards.length - 1 && (
            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Restart
              </button>
              <button
                onClick={() => {
                  onComplete?.()
                  onClose()
                }}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
              >
                Complete
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-around text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {masteredCards.size}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Mastered</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {flashcards.length - masteredCards.size}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {getTimeSpent()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
