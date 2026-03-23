'use client'

import { useState, useEffect } from 'react'
import { learningIntelligence } from '@/lib/learning-intelligence'
import { learningFeedbackSystem } from '@/lib/learning-feedback'
import { Brain, TrendingUp, Target, AlertCircle, CheckCircle, Clock, Award } from 'lucide-react'

interface LearningIntelligenceDashboardProps {
  userId: string
  className?: string
}

export function LearningIntelligenceDashboard({ userId, className = '' }: LearningIntelligenceDashboardProps) {
  const [diagnosis, setDiagnosis] = useState<any>(null)
  const [masteryScores, setMasteryScores] = useState<any[]>([])
  const [progressMetrics, setProgressMetrics] = useState<any>(null)
  const [topWeaknesses, setTopWeaknesses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLearningData = async () => {
      try {
        const diagnosisData = learningIntelligence.diagnose(userId)
        const masteryData = learningIntelligence.getMasteryScores(userId)
        const progressData = learningFeedbackSystem.getProgressMetrics(userId)
        const weaknessesData = learningIntelligence.getTopWeaknesses(userId, 3)

        setDiagnosis(diagnosisData)
        setMasteryScores(masteryData.slice(-10))
        setProgressMetrics(progressData)
        setTopWeaknesses(weaknessesData)
      } catch (error) {
        console.error('Error loading learning data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLearningData()
  }, [userId])

  if (loading) {
    return (
      <div className={`p-6 bg-white/5 backdrop-blur-3xl rounded-2xl border border-white/10 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/3"></div>
          <div className="h-8 bg-white/10 rounded"></div>
          <div className="h-4 bg-white/10 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 🧠 Learning Intelligence Header */}
      <div className="p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-3xl rounded-2xl border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Learning Intelligence</h3>
        </div>
        <p className="text-white/70 text-sm">
          Personalized learning insights based on your interactions and progress
        </p>
      </div>

      {/* 📊 Progress Overview */}
      {progressMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/5 backdrop-blur-3xl rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-white/70">Overall Progress</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {progressMetrics.overallImprovement > 0 ? '+' : ''}{progressMetrics.overallImprovement.toFixed(1)}%
            </div>
            <div className={`text-xs mt-1 ${
              progressMetrics.recentTrend === 'improving' ? 'text-green-400' :
              progressMetrics.recentTrend === 'declining' ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {progressMetrics.recentTrend === 'improving' ? '↑ Improving' :
               progressMetrics.recentTrend === 'declining' ? '↓ Declining' : '→ Stable'}
            </div>
          </div>

          <div className="p-4 bg-white/5 backdrop-blur-3xl rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white/70">Understanding Rate</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {(progressMetrics.understandingRate * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-white/50 mt-1">
              Concepts grasped
            </div>
          </div>

          <div className="p-4 bg-white/5 backdrop-blur-3xl rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-white/70">Total Interactions</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {progressMetrics.totalInteractions}
            </div>
            <div className="text-xs text-white/50 mt-1">
              Learning sessions
            </div>
          </div>
        </div>
      )}

      {/* 🎯 Focus Areas */}
      {diagnosis && diagnosis.recommendedFocus.length > 0 && (
        <div className="p-6 bg-white/5 backdrop-blur-3xl rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-orange-400" />
            <h4 className="text-lg font-semibold text-white">Recommended Focus</h4>
          </div>
          <div className="space-y-2">
            {diagnosis.recommendedFocus.map((recommendation: string, index: number) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-orange-500/10 rounded-lg border border-orange-400/20">
                <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-white/80">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📉 Top Weaknesses */}
      {topWeaknesses.length > 0 && (
        <div className="p-6 bg-white/5 backdrop-blur-3xl rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <h4 className="text-lg font-semibold text-white">Areas to Strengthen</h4>
          </div>
          <div className="space-y-3">
            {topWeaknesses.map((weakness, index) => (
              <div key={index} className="p-4 bg-red-500/10 rounded-lg border border-red-400/20">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-white">{weakness.subtopic}</div>
                    <div className="text-xs text-white/60">{weakness.subject} → {weakness.topic}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-400">{weakness.masteryLevel.toFixed(0)}%</div>
                    <div className="text-xs text-white/60">Mastery</div>
                  </div>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${weakness.masteryLevel}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-white/60">
                  {weakness.mistakeFrequency} mistakes • {weakness.clarificationRequests} help requests
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🏆 Mastery Progress */}
      {masteryScores.length > 0 && (
        <div className="p-6 bg-white/5 backdrop-blur-3xl rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-green-400" />
            <h4 className="text-lg font-semibold text-white">Recent Mastery Progress</h4>
          </div>
          <div className="space-y-3">
            {masteryScores.slice(-5).reverse().map((score, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-400/20">
                <div className="flex-1">
                  <div className="font-medium text-white">{score.concept}</div>
                  <div className="text-xs text-white/60">
                    Last updated: {new Date(score.lastUpdated).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">{score.score.toFixed(0)}%</div>
                    <div className={`text-xs ${
                      score.trend === 'improving' ? 'text-green-400' :
                      score.trend === 'declining' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {score.trend === 'improving' ? '↑' :
                       score.trend === 'declining' ? '↓' : '→'} {score.trend}
                    </div>
                  </div>
                  <div className="w-16 bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${score.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔍 Learning Patterns */}
      {diagnosis && diagnosis.emergingPatterns.length > 0 && (
        <div className="p-6 bg-white/5 backdrop-blur-3xl rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-400" />
            <h4 className="text-lg font-semibold text-white">Learning Patterns</h4>
          </div>
          <div className="space-y-2">
            {diagnosis.emergingPatterns.map((pattern: string, index: number) => (
              <div key={index} className="p-3 bg-purple-500/10 rounded-lg border border-purple-400/20">
                <p className="text-sm text-white/80">{pattern}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
