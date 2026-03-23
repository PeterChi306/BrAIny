'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { 
  TrendingUp, 
  Zap, 
  Calendar, 
  Target, 
  Brain, 
  Award,
  Flame,
  Clock,
  CheckCircle
} from 'lucide-react'

interface EngagementMetrics {
  streak: number
  weeklyProgress: number
  weakSpots: string[]
  masteredTopics: string[]
  studyTime: number
  improvementRate: number
}

interface EngagementLayerProps {
  userName?: string
  metrics?: EngagementMetrics
  onReviewReminder?: (topic: string) => void
  className?: string
}

export function EngagementLayer({ 
  userName = 'Student',
  metrics = {
    streak: 3,
    weeklyProgress: 75,
    weakSpots: ['Fractions', 'Equations'],
    masteredTopics: ['Algebra Basics', 'Linear Functions'],
    studyTime: 120,
    improvementRate: 85
  },
  onReviewReminder,
  className 
}: EngagementLayerProps) {
  const [showReminder, setShowReminder] = useState(false)
  const [encouragement, setEncouragement] = useState('')

  const encouragements = [
    "You're on fire! 🔥",
    "Amazing progress! 🌟",
    "Keep it up! 💪",
    "You've got this! ✨",
    "Crushing it! 🎯",
    "Learning machine! 🧠",
    "Star performer! ⭐",
    "Unstoppable! 🚀"
  ]

  useEffect(() => {
    const random = encouragements[Math.floor(Math.random() * encouragements.length)]
    setEncouragement(random)
    
    // Show review reminder for weak spots
    if (metrics.weakSpots.length > 0 && Math.random() > 0.7) {
      setTimeout(() => setShowReminder(true), 5000)
    }
  }, [metrics.weakSpots])

  const getStreakColor = (streak: number) => {
    if (streak >= 7) return 'text-orange-400'
    if (streak >= 3) return 'text-yellow-400'
    return 'text-gray-400'
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'from-green-500 to-emerald-500'
    if (progress >= 60) return 'from-blue-500 to-cyan-500'
    return 'from-gray-500 to-gray-600'
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main engagement card */}
      <div className="premium-card glassmorphism-card p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-primary mb-1">
              Your Progress, {userName}
            </h3>
            <p className="text-sm text-secondary">
              {encouragement}
            </p>
          </div>
          
          {/* Streak indicator */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-warning-light border border-warning glow-warning">
            <Flame className={cn('w-4 h-4', getStreakColor(metrics.streak))} />
            <span className={cn('font-bold text-sm', getStreakColor(metrics.streak))}>
              {metrics.streak} day streak
            </span>
          </div>
        </div>
        
        {/* Progress metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Weekly progress */}
          <div className="frosted-glass rounded-xl p-4 border border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-success glow-success" />
              <span className="text-sm font-medium text-secondary">Weekly Progress</span>
            </div>
            <div className="text-2xl font-bold text-primary mb-2">
              {metrics.weeklyProgress}%
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div 
                className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', getProgressColor(metrics.weeklyProgress))}
                style={{ width: `${metrics.weeklyProgress}%` }}
              />
            </div>
          </div>
          
          {/* Study time */}
          <div className="frosted-glass rounded-xl p-4 border border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary glow-primary" />
              <span className="text-sm font-medium text-secondary">Study Time</span>
            </div>
            <div className="text-2xl font-bold text-primary mb-2">
              {metrics.studyTime}m
            </div>
            <p className="text-xs text-muted">This week</p>
          </div>
          
          {/* Improvement rate */}
          <div className="frosted-glass rounded-xl p-4 border border">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-warning glow-warning" />
              <span className="text-sm font-medium text-secondary">Improvement</span>
            </div>
            <div className="text-2xl font-bold text-primary mb-2">
              +{metrics.improvementRate}%
            </div>
            <p className="text-xs text-muted">Faster than last time</p>
          </div>
        </div>
        
        {/* Topics overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mastered topics */}
          <div className="frosted-glass rounded-xl p-4 border border">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-success glow-success" />
              <span className="text-sm font-medium text-secondary">Mastered</span>
              <span className="text-xs text-success ml-auto">
                {metrics.masteredTopics.length}
              </span>
            </div>
            <div className="space-y-1">
              {metrics.masteredTopics.slice(0, 3).map((topic, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-secondary">
                  <CheckCircle className="w-3 h-3 text-success glow-success" />
                  <span>{topic}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Weak spots */}
          <div className="frosted-glass rounded-xl p-4 border border">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-warning glow-warning" />
              <span className="text-sm font-medium text-secondary">Focus Areas</span>
              <span className="text-xs text-warning ml-auto">
                {metrics.weakSpots.length}
              </span>
            </div>
            <div className="space-y-1">
              {metrics.weakSpots.slice(0, 3).map((topic, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-secondary">
                  <Brain className="w-3 h-3 text-warning glow-warning" />
                  <span>{topic}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Review reminder */}
      {showReminder && metrics.weakSpots.length > 0 && (
        <div className="glassmorphism-depth border border-primary rounded-xl p-4 glow-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-primary">
                  Ready to review {metrics.weakSpots[0]}?
                </p>
                <p className="text-xs text-secondary">
                  A quick practice will help strengthen this area
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReminder(false)}
                className="px-3 py-1 text-sm text-secondary hover:text-primary transition-all duration-300"
              >
                Later
              </button>
              <button
                onClick={() => {
                  onReviewReminder?.(metrics.weakSpots[0])
                  setShowReminder(false)
                }}
                className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-all duration-300 glow-primary"
              >
                Review Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface MicroFeedbackProps {
  type: 'improvement' | 'streak' | 'mastery' | 'speed'
  message: string
  className?: string
}

export function MicroFeedback({ type, message, className }: MicroFeedbackProps) {
  const getIcon = () => {
    switch (type) {
      case 'improvement':
        return <TrendingUp className="w-4 h-4 text-green-400" />
      case 'streak':
        return <Flame className="w-4 h-4 text-orange-400" />
      case 'mastery':
        return <Award className="w-4 h-4 text-purple-400" />
      case 'speed':
        return <Zap className="w-4 h-4 text-yellow-400" />
      default:
        return <CheckCircle className="w-4 h-4 text-blue-400" />
    }
  }

  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-4 py-2 rounded-xl frosted-glass border border-success glow-success',
      className
    )}>
      {getIcon()}
      <span className="text-sm font-medium text-primary">{message}</span>
    </div>
  )
}

// Add CSS animations
const style = document.createElement('style')
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out forwards;
  }
`
document.head.appendChild(style)
