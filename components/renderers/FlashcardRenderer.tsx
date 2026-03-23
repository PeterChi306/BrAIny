'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { RotateCcw, ArrowLeft, ArrowRight, CheckCircle2, Brain } from 'lucide-react'
import type { FlashcardResponse, FlashcardData } from '@/types/modes'

interface FlashcardRendererProps {
  flashcards: FlashcardResponse
  onComplete?: (masteryData: { easy: number; medium: number; hard: number }) => void
}

export function FlashcardRenderer({ flashcards, onComplete }: FlashcardRendererProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [mastery, setMastery] = useState<Map<string, 'easy' | 'medium' | 'hard'>>(new Map())
  const [showSummary, setShowSummary] = useState(false)

  const currentCard = flashcards?.cards?.[currentIndex]
  const progress = flashcards?.cards?.length ? ((currentIndex + 1) / flashcards.cards.length) * 100 : 0
  const studiedCount = mastery.size

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleMastery = (level: 'easy' | 'medium' | 'hard') => {
    if (!currentCard) return
    
    const newMastery = new Map(mastery)
    newMastery.set(currentCard.id, level)
    setMastery(newMastery)

    // Move to next card
    if (currentIndex < (flashcards?.cards?.length || 0) - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    } else {
      setShowSummary(true)
      const masteryData = calculateMasteryData(newMastery)
      onComplete?.(masteryData)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
      setShowSummary(false)
    }
  }

  const getMasteryColor = (level: 'easy' | 'medium' | 'hard') => {
    switch (level) {
      case 'easy': return 'bg-green-500 hover:bg-green-600'
      case 'medium': return 'bg-yellow-500 hover:bg-yellow-600'
      case 'hard': return 'bg-red-500 hover:bg-red-600'
    }
  }

  const calculateMasteryData = (masteryMap: Map<string, 'easy' | 'medium' | 'hard'>) => {
    const easy = Array.from(masteryMap.values()).filter(level => level === 'easy').length
    const medium = Array.from(masteryMap.values()).filter(level => level === 'medium').length
    const hard = Array.from(masteryMap.values()).filter(level => level === 'hard').length
    return { easy, medium, hard }
  }

  // Show summary view
  if (showSummary) {
    const masteryData = calculateMasteryData(mastery)
    const totalCards = flashcards?.cards?.length || 0
    const masteryPercentage = Math.round((masteryData.easy / totalCards) * 100)

    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="text-center p-8" glow>
          <div className="mb-6">
            <Brain className="w-16 h-16 mx-auto text-purple-500 mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Session Complete!</h2>
            <p className="text-gray-600 mb-6">Great job! Here's your mastery breakdown:</p>
            
            <div className="mb-8">
              <div className="text-5xl font-black text-gray-900 mb-2">
                {masteryPercentage}%
              </div>
              <p className="text-gray-600">mastery achieved</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="text-2xl mb-1">🤩</div>
                <div className="text-2xl font-bold text-green-700">{masteryData.easy}</div>
                <div className="text-sm text-green-600">Easy</div>
              </Card>
              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <div className="text-2xl mb-1">😊</div>
                <div className="text-2xl font-bold text-yellow-700">{masteryData.medium}</div>
                <div className="text-sm text-yellow-600">Medium</div>
              </Card>
              <Card className="p-4 bg-red-50 border-red-200">
                <div className="text-2xl mb-1">😐</div>
                <div className="text-2xl font-bold text-red-700">{masteryData.hard}</div>
                <div className="text-sm text-red-600">Hard</div>
              </Card>
            </div>

            <div className="space-y-3">
              <Button onClick={() => window.location.reload()} glow className="w-full">
                Study Again
              </Button>
              <Button variant="outline" className="w-full">
                Continue Learning
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Show flashcard view
  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <Card className="mb-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{flashcards?.metadata?.title || 'Flashcards'}</h2>
            <p className="text-gray-600">{flashcards?.metadata?.topic || 'Study Topic'}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              Card {currentIndex + 1} of {flashcards?.cards?.length || 0}
            </div>
            <div className="text-sm font-medium text-blue-600">
              {studiedCount} studied
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-600 to-purple-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      {/* Flashcard */}
      {flashcards?.cards && flashcards.cards.length > 0 && (
        <div className="mb-6">
          <div
            className="relative h-96 cursor-pointer"
            onClick={handleFlip}
            style={{ perspective: '1000px' }}
          >
            <div
              className={`absolute inset-0 w-full h-full transition-transform duration-700`}
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Front */}
              <Card
                className={`absolute inset-0 w-full h-full flex items-center justify-center p-8 ${
                  isFlipped ? 'opacity-0' : 'opacity-100'
                } transition-opacity duration-300`}
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-800 mb-4">
                    {currentCard?.front}
                  </div>
                  <div className="text-sm text-gray-600">
                    {currentCard?.tags?.join(', ') || 'No tags'}
                  </div>
                </div>
              </Card>

              {/* Back */}
              <Card
                className={`absolute inset-0 w-full h-full flex items-center justify-center p-8 ${
                  isFlipped ? 'opacity-100' : 'opacity-0'
                } transition-opacity duration-300`}
                style={{ 
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-800 mb-4">
                    {currentCard?.back}
                  </div>
                  <div className="text-sm text-gray-600">
                    {currentCard?.tags?.join(', ') || 'No tags'}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <Button
          variant="outline"
          onClick={handleFlip}
          className="flex-1"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          {isFlipped ? 'Show Question' : 'Show Answer'}
        </Button>

        <div className="flex-1" /> {/* Spacer for balance */}

        <Button
          variant="outline"
          onClick={() => {
            if (!currentCard) return
            handleMastery('easy')
          }}
          className="flex-1"
          disabled={!currentCard}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Easy
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            if (!currentCard) return
            handleMastery('medium')
          }}
          className="flex-1"
          disabled={!currentCard}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Medium
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            if (!currentCard) return
            handleMastery('hard')
          }}
          className="flex-1"
          disabled={!currentCard}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Hard
        </Button>
      </div>
    </div>
  )
}
