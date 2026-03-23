'use client'

import { useState, useEffect } from 'react'
import { RotateCcw, X, ArrowRight, ArrowLeft, Check, Brain } from 'lucide-react'

interface Flashcard {
  front: string
  back: string
}

interface MultiFlashcardInterfaceProps {
  content: string
  onComplete?: () => void
  onExit?: () => void
}

export function MultiFlashcardInterface({ content, onComplete, onExit }: MultiFlashcardInterfaceProps) {
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
      
      // Clean up malformed table content
      const cleanLine = trimmedLine
        .replace(/^\|\s*:\s*\|$/, '') // Remove | : | lines
        .replace(/^\|.*\|$/, '') // Remove table rows
        .replace(/^\s*[-:]+\s*$/, '') // Remove separator lines
      
      // If we have a front but no back yet, add to back
      if (currentCard.front && !currentCard.back && cleanLine) {
        if (currentCard.back) {
          currentCard.back += ' ' + cleanLine
        } else {
          currentCard.back = cleanLine
        }
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
          // Clean each line
          const cleanLines = lines.map(line => 
            line.replace(/^\|\s*:\s*\|$/, '').replace(/^\|.*\|$/, '').trim()
          ).filter(line => line)
          
          if (cleanLines.length >= 2) {
            cards.push({
              front: cleanLines[0],
              back: cleanLines.slice(1).join(' ').trim()
            })
          }
        }
      })
    }
    
    return cards
  }

  useEffect(() => {
    const parsedCards = parseFlashcardContent(content)
    setFlashcards(parsedCards)
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
    newMastered.add(currentIndex)
    setMasteredCards(newMastered)
    
    // Auto-advance to next card
    setTimeout(() => {
      if (currentIndex < flashcards.length - 1) {
        handleNext()
      }
    }, 500)
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setMasteredCards(new Set())
  }

  const getTimeSpent = () => {
    const minutes = Math.floor((Date.now() - startTime) / 60000)
    const seconds = Math.floor(((Date.now() - startTime) % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading flashcards...</p>
        </div>
      </div>
    )
  }

  const currentCard = flashcards[currentIndex]
  const progress = ((currentIndex + 1) / flashcards.length) * 100
  const masteredCount = masteredCards.size

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 sm:p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-white">Flashcards</h1>
              <p className="text-sm sm:text-base text-slate-400">Card {currentIndex + 1} of {flashcards.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-xs sm:text-sm text-slate-400 flex items-center gap-1 sm:gap-2">
              <span className="text-green-400">✓ {masteredCount}</span>
              <span className="hidden sm:inline">mastered</span>
              <span className="sm:hidden">✓</span>
            </div>
            <div className="text-xs sm:text-sm text-slate-400 flex items-center gap-1 sm:gap-2 hidden sm:flex">
              <span>{getTimeSpent()}</span>
            </div>
            <button
              onClick={onExit}
              className="p-2 sm:p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-slate-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="mb-6 sm:mb-8">
          <div className="relative h-64 sm:h-80 lg:h-96">
            <div 
              className="absolute inset-0 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl cursor-pointer transition-all duration-500 preserve-3d"
              onClick={handleFlip}
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
              {/* Front of card */}
              <div 
                className="absolute inset-0 rounded-2xl p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center backface-hidden"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                    <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-white leading-relaxed">
                    {currentCard.front}
                  </p>
                </div>
              </div>
              
              {/* Back of card */}
              <div 
                className="absolute inset-0 rounded-2xl p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-700"
                style={{ 
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}
              >
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 sm:mb-6 mx-auto">
                    <Check className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
                  </div>
                  <p className="text-white text-base sm:text-xl font-medium leading-relaxed">
                    {currentCard.back}
                  </p>
                  <p className="text-slate-400 text-xs sm:text-sm mt-3 sm:mt-4">Click to flip back</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation and Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="p-3 sm:p-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">←</span>
          </button>
          
          {isFlipped && (
            <button
              onClick={handleMarkMastered}
              className={`p-3 sm:p-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 text-sm sm:text-base ${
                masteredCards.has(currentIndex)
                  ? 'bg-green-600 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <Check className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{masteredCards.has(currentIndex) ? 'Mastered' : 'Mark as Mastered'}</span>
              <span className="sm:hidden">{masteredCards.has(currentIndex) ? '✓' : '✓'}</span>
            </button>
          )}
          
          <button
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
            className="p-3 sm:p-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <span className="hidden sm:inline">Next</span>
            <span className="sm:hidden">→</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Completion Message */}
        {currentIndex === flashcards.length - 1 && masteredCards.size === flashcards.length && (
          <div className="mt-6 sm:mt-8 p-4 sm:p-6 rounded-xl bg-green-500/20 border border-green-500/50 text-center">
            <h3 className="text-lg sm:text-xl font-bold text-green-400 mb-2">Congratulations!</h3>
            <p className="text-green-300 text-sm sm:text-base">You've mastered all {flashcards.length} flashcards!</p>
            <button
              onClick={onExit}
              className="mt-3 sm:mt-4 p-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors text-sm sm:text-base"
            >
              Back to Tutor
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  )
}
