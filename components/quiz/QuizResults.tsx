'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  Target,
  TrendingUp,
  Clock,
  Brain,
  Award,
  RotateCcw,
  Download,
  Share2,
  BarChart3,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuizResult {
  questionId: string
  userAnswer: number
  isCorrect: boolean
  timeTaken: number
}

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
  difficulty: 'easy' | 'medium' | 'hard'
  subject?: string
}

interface QuizResultsProps {
  results: QuizResult[]
  questions: QuizQuestion[]
  onRetake?: () => void
  onContinue?: () => void
  showDetails?: boolean
  className?: string
}

export function QuizResults({
  results,
  questions,
  onRetake,
  onContinue,
  showDetails = true,
  className
}: QuizResultsProps) {
  const correctCount = results.filter(r => r.isCorrect).length
  const totalCount = results.length
  const percentage = Math.round((correctCount / totalCount) * 100)
  const totalTime = results.reduce((sum, r) => sum + r.timeTaken, 0)
  const averageTime = Math.round(totalTime / totalCount)

  const getScoreColor = () => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreEmoji = () => {
    if (percentage >= 90) return '🏆'
    if (percentage >= 80) return '🎉'
    if (percentage >= 70) return '👍'
    if (percentage >= 60) return '😊'
    return '📚'
  }

  const getPerformanceMessage = () => {
    if (percentage >= 90) return 'Outstanding! You mastered this topic!'
    if (percentage >= 80) return 'Excellent work! Keep it up!'
    if (percentage >= 70) return 'Good job! Room for improvement.'
    if (percentage >= 60) return 'Nice effort! Review the concepts.'
    return 'Keep practicing! You\'ll get better.'
  }

  const getDifficultyStats = () => {
    const stats = { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } }
    
    results.forEach((result, index) => {
      const question = questions[index]
      if (question) {
        stats[question.difficulty].total++
        if (result.isCorrect) {
          stats[question.difficulty].correct++
        }
      }
    })
    
    return stats
  }

  const difficultyStats = getDifficultyStats()

  const downloadResults = () => {
    const resultsText = `Quiz Results\n\nScore: ${correctCount}/${totalCount} (${percentage}%)\nTime: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s\n\nQuestion Breakdown:\n${results.map((result, index) => {
      const question = questions[index]
      return `Q${index + 1}: ${result.isCorrect ? '✓' : '✗'} (${question?.difficulty || 'unknown'})`
    }).join('\n')}`

    const blob = new Blob([resultsText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quiz-results-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Score Overview */}
      <Card className="p-6 text-center">
        <div className="space-y-4">
          <div className="text-6xl">{getScoreEmoji()}</div>
          
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {percentage}%
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {correctCount} out of {totalCount} correct
            </p>
          </div>

          <div className={cn('text-lg font-medium', getScoreColor())}>
            {getPerformanceMessage()}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs">Time</span>
              </div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-xs">Avg Time</span>
              </div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {averageTime}s
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-400 mb-1">
                <Brain className="w-4 h-4" />
                <span className="text-xs">Accuracy</span>
              </div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {percentage}%
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Difficulty Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Performance by Difficulty
        </h3>
        
        <div className="space-y-3">
          {Object.entries(difficultyStats).map(([difficulty, stats]) => {
            const percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
            const color = difficulty === 'easy' ? 'green' : difficulty === 'medium' ? 'yellow' : 'red'
            
            return (
              <div key={difficulty} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize font-medium text-gray-700 dark:text-gray-300">
                    {difficulty}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {stats.correct}/{stats.total} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`bg-${color}-500 h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Detailed Results */}
      {showDetails && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Question Review
          </h3>
          
          <div className="space-y-4">
            {results.map((result, index) => {
              const question = questions[index]
              if (!question) return null

              return (
                <div key={result.questionId} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Question {index + 1}
                        </span>
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          question.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        )}>
                          {question.difficulty}
                        </span>
                        {result.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      
                      <p className="text-gray-900 dark:text-white mb-2">
                        {question.question}
                      </p>
                      
                      <div className="space-y-1 text-sm">
                        <div className="text-gray-600 dark:text-gray-400">
                          Your answer: <span className={cn(
                            result.isCorrect ? 'text-green-600' : 'text-red-600'
                          )}>
                            {question.options[result.userAnswer]}
                          </span>
                        </div>
                        {!result.isCorrect && (
                          <div className="text-gray-600 dark:text-gray-400">
                            Correct answer: <span className="text-green-600">
                              {question.options[question.correctAnswer]}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {question.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {result.timeTaken}s
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={downloadResults}
          variant="outline"
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Results
        </Button>
        
        {onRetake && (
          <Button
            onClick={onRetake}
            variant="outline"
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Retake Quiz
          </Button>
        )}
        
        {onContinue && (
          <Button
            onClick={onContinue}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Continue Learning
          </Button>
        )}
      </div>
    </div>
  )
}
