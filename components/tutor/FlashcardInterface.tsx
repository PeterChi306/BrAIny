'use client'

import { useState } from 'react'
import { RotateCcw, ArrowRight, CheckCircle } from 'lucide-react'

interface FlashcardInterfaceProps {
  content: string
  onComplete?: () => void
}

export function FlashcardInterface({ content, onComplete }: FlashcardInterfaceProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [studied, setStudied] = useState(false)

  // Parse the flashcard content to extract front and back
  const parseFlashcardContent = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    
    // Look for "Front:" and "Back:" markers
    const frontIndex = lines.findIndex(line => line.toLowerCase().includes('front:'))
    const backIndex = lines.findIndex(line => line.toLowerCase().includes('back:'))
    
    if (frontIndex !== -1 && backIndex !== -1) {
      const front = lines.slice(frontIndex + 1, backIndex).join(' ').trim()
      const back = lines.slice(backIndex + 1).join(' ').trim()
      return { front: front || 'Front of card', back: back || 'Back of card' }
    }
    
    // Fallback: split by common separators
    const separatorIndex = lines.findIndex(line => 
      line.includes('---') || 
      line.includes('|||') || 
      line.includes('Answer:')
    )
    
    if (separatorIndex !== -1) {
      const front = lines.slice(0, separatorIndex).join(' ').trim()
      const back = lines.slice(separatorIndex + 1).join(' ').trim()
      return { front: front || 'Front of card', back: back || 'Back of card' }
    }
    
    // Default: first line as front, rest as back
    const front = lines[0] || 'Front of card'
    const back = lines.slice(1).join(' ').trim() || 'Back of card'
    return { front, back }
  }

  const { front, back } = parseFlashcardContent(content)

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleMarkStudied = () => {
    setStudied(true)
    setTimeout(() => {
      onComplete?.()
    }, 1000)
  }

  const handleReset = () => {
    setIsFlipped(false)
    setStudied(false)
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
          <span className="text-white text-sm font-bold">F</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Flashcard</h3>
      </div>

      <div 
        className="relative h-64 cursor-pointer"
        onClick={handleFlip}
      >
        <div className={`absolute inset-0 transition-all duration-500 transform-gpu preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}>
          {/* Front of card */}
          <div className="absolute inset-0 backface-hidden">
            <div className="h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center text-white">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">Front</p>
                <p className="text-xl">{front}</p>
              </div>
              <p className="text-sm opacity-75 mt-4">Click to flip</p>
            </div>
          </div>

          {/* Back of card */}
          <div className="absolute inset-0 backface-hidden rotate-y-180">
            <div className="h-full bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center text-white">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">Back</p>
                <p className="text-xl">{back}</p>
              </div>
              <p className="text-sm opacity-75 mt-4">Click to flip back</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>

        {isFlipped && (
          <button
            onClick={handleMarkStudied}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              studied 
                ? 'bg-green-500 text-white' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {studied ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Studied!</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Mark as Studied</span>
              </>
            )}
          </button>
        )}
      </div>

      <style jsx>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  )
}
