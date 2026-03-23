'use client'

import { useState, useEffect } from 'react'

interface TypingAnimationProps {
  texts: string[]
  className?: string
  speed?: number
  deleteSpeed?: number
  pauseDuration?: number
}

export function TypingAnimation({ 
  texts, 
  className = '', 
  speed = 100, 
  deleteSpeed = 50, 
  pauseDuration = 2000 
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
        setIsDeleting(true)
        return
      }

      if (isDeleting) {
        if (currentText.length === 0) {
          setIsDeleting(false)
          setCurrentTextIndex((prev) => (prev + 1) % texts.length)
        } else {
          setCurrentText(fullText.substring(0, currentText.length - 1))
        }
      } else {
        if (currentText.length === fullText.length) {
          setIsPaused(true)
          return
        } else {
          setCurrentText(fullText.substring(0, currentText.length + 1))
        }
      }
    }, isPaused ? pauseDuration : isDeleting ? deleteSpeed : speed)

    return () => clearTimeout(timeout)
  }, [currentText, currentTextIndex, isDeleting, isPaused, texts, speed, deleteSpeed, pauseDuration])

  return (
    <span className={className}>
      {currentText}
      <span className="animate-pulse">|</span>
    </span>
  )
}
