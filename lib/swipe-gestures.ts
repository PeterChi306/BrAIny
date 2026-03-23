'use client'

interface SwipeGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
  preventDefault?: boolean
}

export function useSwipeGestures(options: SwipeGestureOptions = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventDefault = true
  } = options

  let touchStartX = 0
  let touchStartY = 0
  let touchEndX = 0
  let touchEndY = 0

  const minSwipeDistance = threshold

  const onTouchStart = (e: React.TouchEvent) => {
    if (preventDefault) e.preventDefault()
    touchEndX = 0
    touchEndY = 0
    touchStartX = e.targetTouches[0].clientX
    touchStartY = e.targetTouches[0].clientY
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (preventDefault) e.preventDefault()
    touchEndX = e.targetTouches[0].clientX
    touchEndY = e.targetTouches[0].clientY
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (preventDefault) e.preventDefault()
    
    if (!touchEndX || !touchEndY) return

    const deltaX = touchStartX - touchEndX
    const deltaY = touchStartY - touchEndY

    const isLeftSwipe = deltaX > minSwipeDistance
    const isRightSwipe = deltaX < -minSwipeDistance
    const isUpSwipe = deltaY > minSwipeDistance
    const isDownSwipe = deltaY < -minSwipeDistance

    // Haptic feedback
    if ('vibrate' in navigator && (isLeftSwipe || isRightSwipe || isUpSwipe || isDownSwipe)) {
      navigator.vibrate(15)
    }

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft()
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight()
    }
    if (isUpSwipe && onSwipeUp) {
      onSwipeUp()
    }
    if (isDownSwipe && onSwipeDown) {
      onSwipeDown()
    }
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  }
}

// Haptic feedback utility
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if ('vibrate' in navigator) {
    switch (type) {
      case 'light':
        navigator.vibrate(10)
        break
      case 'medium':
        navigator.vibrate(25)
        break
      case 'heavy':
        navigator.vibrate([50, 30, 50])
        break
    }
  }
}
