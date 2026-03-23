'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Flashcard } from '@/types/database'
import { 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ArrowLeft,
  Brain,
  Target,
  TrendingUp,
  Volume2,
  VolumeX,
  Star,
  Clock,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnhancedFlashcardProps {
  flashcard: Flashcard
  currentIndex: number
  totalCards: number
  onNext: () => void
  onPrevious: () => void
  onDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => void
  showProgress?: boolean
  className?: string
}

export function EnhancedFlashcard({
  flashcard,
  currentIndex,
  totalCards,
  onNext,
  onPrevious,
  onDifficulty,
  showProgress = true,
  className
}: EnhancedFlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
      } else {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 0.9
        utterance.pitch = 1
        utterance.onend = () => setIsSpeaking(false)
        window.speechSynthesis.speak(utterance)
        setIsSpeaking(true)
      }
    }
  }

  const getProgressColor = () => {
    const mastery = flashcard.mastery_level || 0
    if (mastery >= 4) return 'bg-green-500'
    if (mastery >= 2) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getMasteryIcon = () => {
    const mastery = flashcard.mastery_level || 0
    if (mastery >= 4) return <CheckCircle2 className="w-4 h-4 text-green-500" />
    if (mastery >= 2) return <Target className="w-4 h-4 text-yellow-500" />
    return <Brain className="w-4 h-4 text-red-500" />
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress Header */}
      {showProgress && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-400">
                Card {currentIndex + 1} of {totalCards}
              </span>
              {getMasteryIcon()}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {flashcard.review_count || 0} reviews
              </span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={cn('h-2 rounded-full transition-all duration-500', getProgressColor())}
              style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Flashcard */}
      <div className="relative">
        <Card className="relative h-80 cursor-pointer transform transition-all duration-500 hover:scale-[1.02]" onClick={handleFlip}>
          <div className="absolute inset-0 p-6 flex items-center justify-center">
            <div className="text-center space-y-4">
              {/* Card Content */}
              <div className="text-2xl font-bold text-gray-900 dark:text-white leading-relaxed">
                {!isFlipped ? flashcard.front_text : flashcard.back_text}
              </div>
              
              {/* Card Type Indicator */}
              <div className="flex items-center justify-center gap-2">
                <div className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium',
                  isFlipped 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                )}>
                  {isFlipped ? 'Answer' : 'Question'}
                </div>
              </div>

              {/* Hint */}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isFlipped ? 'Tap to see question' : 'Tap to reveal answer'}
              </p>
            </div>
          </div>

          {/* Flip Animation Indicator */}
          <div className="absolute top-4 right-4">
            <RotateCcw className={cn(
              'w-5 h-5 text-gray-400 transition-transform duration-500',
              isFlipped && 'rotate-180'
            )} />
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            onClick={onPrevious}
            disabled={currentIndex === 0}
            variant="outline"
            size="sm"
            className="p-3"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={() => speakText(isFlipped ? flashcard.back_text : flashcard.front_text)}
              variant="outline"
              size="sm"
              className="p-3"
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            
            <Button
              onClick={handleFlip}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Flip
            </Button>
          </div>

          <Button
            onClick={onNext}
            disabled={currentIndex === totalCards - 1}
            variant="outline"
            size="sm"
            className="p-3"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Difficulty Buttons - Only show when answer is revealed */}
        {isFlipped && (
          <div className="space-y-3">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 font-medium">
              How well did you know this?
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={() => onDifficulty('hard')}
                className="py-3 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 transition-all duration-300"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Hard
              </Button>
              <Button
                onClick={() => onDifficulty('medium')}
                className="py-3 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 dark:text-yellow-400 transition-all duration-300"
              >
                <Target className="w-4 h-4 mr-2" />
                Medium
              </Button>
              <Button
                onClick={() => onDifficulty('easy')}
                className="py-3 bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400 transition-all duration-300"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Easy
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
