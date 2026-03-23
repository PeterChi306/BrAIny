'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { 
  Target, 
  Brain, 
  Puzzle, 
  Globe, 
  CreditCard, 
  Zap, 
  TrendingUp,
  BookOpen,
  Lightbulb,
  Award,
  RefreshCw,
  Eye,
  Repeat
} from 'lucide-react'

interface SmartAction {
  id: string
  icon: string | React.ReactNode
  title: string
  description?: string
  gradient: string
  onClick: () => void
}

interface SmartActionsProps {
  userName?: string
  userWeakSpots?: string[]
  currentTopic?: string
  onAction: (action: string) => void
  userTier?: string
  className?: string
}

export function SmartActions({ 
  userName = 'Student',
  userWeakSpots = [],
  currentTopic,
  onAction,
  userTier = 'starter',
  className 
}: SmartActionsProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null)

  const generateActions = () => {
    const actions: SmartAction[] = []

    // Only show contextual actions if there's actual content to work with
    if (currentTopic && currentTopic !== 'Here\'s what you need to know') {
      actions.push({
        id: 'practice',
        icon: <Target className="w-5 h-5" />,
        title: 'Try a problem',
        gradient: 'from-green-500 to-green-600',
        onClick: () => onAction('practice')
      })

      actions.push({
        id: 'see-example',
        icon: <Lightbulb className="w-5 h-5" />,
        title: 'See another example',
        gradient: 'from-blue-500 to-blue-600',
        onClick: () => onAction('example')
      })
    }

    // Only show quiz for educational content (not simple explanations)
    const educationalKeywords = ['explain', 'how', 'what', 'why', 'concept', 'formula', 'process', 'method', 'step']
    const isEducationalContent = educationalKeywords.some(keyword => 
      currentTopic?.toLowerCase().includes(keyword)
    )
    
    if (isEducationalContent) {
      actions.push({
        id: 'quiz',
        title: 'Quiz me on this',
        description: 'Test your understanding',
        icon: <Target className="w-5 h-5" />,
        gradient: 'from-blue-500 to-blue-600',
        onClick: () => onAction('quiz')
      })
    }

    // Simplify explanation - only for complex topics
    const complexKeywords = ['complex', 'difficult', 'advanced', 'complicated', 'detailed', 'technical']
    const isComplexContent = complexKeywords.some(keyword => 
      currentTopic?.toLowerCase().includes(keyword)
    )
    
    if (isComplexContent) {
      actions.push({
        id: 'simpler',
        title: 'Explain it even simpler',
        description: 'Break this down step-by-step',
        icon: <Puzzle className="w-5 h-5" />,
        gradient: 'from-green-500 to-green-600',
        onClick: () => onAction('simpler')
      })
    }

    // Flashcards - only for memorizable content
    const memorizableKeywords = ['definition', 'term', 'vocabulary', 'formula', 'fact', 'list', 'steps', 'process']
    const isMemorableContent = memorizableKeywords.some(keyword => 
      currentTopic?.toLowerCase().includes(keyword)
    )
    
    if (isMemorableContent) {
      actions.push({
        id: 'flashcards',
        title: 'Turn this into flashcards',
        description: 'Create review cards',
        icon: <CreditCard className="w-5 h-5" />,
        gradient: 'from-pink-500 to-pink-600',
        onClick: () => onAction('flashcards')
      })
    }

    // Study guide - only for non-starter tiers
    if (userTier !== 'starter') {
      actions.push({
        id: 'study-guide',
        title: 'Study guide',
        description: 'Create a study guide',
        icon: <BookOpen className="w-5 h-5" />,
        gradient: 'from-indigo-500 to-indigo-600',
        onClick: () => {
          onAction('study-guide')
        }
      })
    }

    // Work on weak topics - only if user has weak spots and not starter
    if (userTier !== 'starter' && userWeakSpots && userWeakSpots.length > 0) {
      actions.push({
        id: 'weak-spots',
        title: `Work on ${userWeakSpots[0]}`,
        description: 'Focus on areas that need improvement',
        icon: <Target className="w-5 h-5" />,
        gradient: 'from-red-500 to-orange-600',
        onClick: () => {
          if (typeof window !== 'undefined') {
            window.location.href = `/weak-spots?topic=${encodeURIComponent(userWeakSpots[0])}`
          }
        }
      })
    }

    // FINAL FILTER: Starter tier can only have Quiz, Practice, and Example
    if (userTier === 'starter') {
      return actions.filter(a => ['quiz', 'practice', 'example'].includes(a.id))
    }

    return actions
  }

  const actions = generateActions()

  return (
    <div className={cn('bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-lg', className)}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">Quick Actions</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action, index) => (
          <button
            key={action.id}
            onClick={() => {
              setSelectedAction(action.id)
              action.onClick()
              setTimeout(() => setSelectedAction(null), 200)
            }}
            className={cn(
              'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all duration-200',
              'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600',
              'hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500',
              'hover:shadow-md active:scale-95',
              selectedAction === action.id && 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600'
            )}
            style={{animationDelay: `${index * 50}ms`}}
          >
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center text-white',
              `bg-gradient-to-br ${action.gradient}`
            )}>
              {typeof action.icon === 'string' ? (
                <span className="text-sm font-bold">{action.icon}</span>
              ) : (
                action.icon
              )}
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
              {action.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

interface QuickActionProps {
  action: string
  onClick: () => void
  className?: string
}

export function QuickAction({ action, onClick, className }: QuickActionProps) {
  const getActionConfig = (action: string) => {
    switch (action) {
      case 'continue':
        return {
          icon: <TrendingUp className="w-4 h-4" />,
          label: 'Continue Learning',
          gradient: 'from-green-500 to-emerald-600'
        }
      case 'review':
        return {
          icon: <RefreshCw className="w-4 h-4" />,
          label: 'Quick Review',
          gradient: 'from-blue-500 to-cyan-600'
        }
      case 'master':
        return {
          icon: <Award className="w-4 h-4" />,
          label: 'Master This Topic',
          gradient: 'from-purple-500 to-pink-600'
        }
      default:
        return {
          icon: <Zap className="w-4 h-4" />,
          label: 'Quick Action',
          gradient: 'from-gray-500 to-gray-600'
        }
    }
  }

  const config = getActionConfig(action)

  return (
    <Button
      onClick={onClick}
      variant="outline"
      size="sm"
      glow
      className={cn(
        'bg-white/90 dark:bg-gray-800/90 border-white/40 text-white shadow-lg hover:shadow-xl hover:bg-white dark:hover:bg-gray-800 hover:border-white/60 transform hover:scale-105 transition-all duration-300',
        className
      )}
    >
      <span className="flex items-center gap-2">
        <span className="text-white">{config.icon}</span>
        <span>{config.label}</span>
      </span>
    </Button>
  )
}
