'use client'

import { useEffect, useState } from 'react'

interface TypingAnimationProps {
  texts: string[]
  className?: string
  speed?: number
  deleteSpeed?: number
  pauseDuration?: number
  loop?: boolean
}

export function TypingAnimation({ 
  texts, 
  className = '', 
      speed = 80, // Slower typing (was 150ms)
      deleteSpeed = 50, // Slower deletion (was 75ms)
      pauseDuration = 3000, // Longer pause (was 2000ms)
  loop = true 
}: TypingAnimationProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const fullText = texts[currentTextIndex]
    
    const timeout = setTimeout(() => {
      if (isPaused) {
        setIsPaused(false)
        if (currentTextIndex === texts.length - 1 && !loop) {
          return
        }
        setIsDeleting(true)
        return
      }

      if (isDeleting) {
        if (currentText === '') {
          setIsDeleting(false)
          setCurrentTextIndex((prev) => 
            prev === texts.length - 1 ? 0 : prev + 1
          )
        } else {
          setCurrentText(fullText.substring(0, currentText.length - 1))
        }
      } else {
        if (currentText === fullText) {
          setIsPaused(true)
        } else {
          setCurrentText(fullText.substring(0, currentText.length + 1))
        }
      }
    }, isDeleting ? deleteSpeed : speed)

    return () => clearTimeout(timeout)
  }, [currentText, isDeleting, isPaused, currentTextIndex, texts, speed, deleteSpeed, loop])

  return (
    <span className={className}>
      {currentText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

interface EncouragementTextProps {
  className?: string
}

export function EncouragementText({ className = '' }: EncouragementTextProps) {
  return (
    <span className={`text-sm font-medium text-gray-600 dark:text-gray-400 ${className}`}>
      You're doing amazing! 🌟
    </span>
  )
}
