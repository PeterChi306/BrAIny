'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { CognitiveMetricsTracker } from '@/lib/cognitive/metrics'
import { AIBehaviorContract } from '@/lib/cognitive/contract'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, TrendingUp, Brain, Target, AlertTriangle, CheckCircle, Activity, BarChart3 } from 'lucide-react'
import { BottomNavigation } from '@/components/BottomNavigation'
import type { CognitiveMetric, BehaviorPrinciple } from '@/types/cognitive'

export default function MetricsModePage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const metricsTracker = CognitiveMetricsTracker.getInstance()
  const behaviorContract = AIBehaviorContract.getInstance()

  const [metrics, setMetrics] = useState<CognitiveMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [cognitiveReport, setCognitiveReport] = useState<any>(null)
  const [contractReport, setContractReport] = useState<any>(null)

  useEffect(() => {
    initializeMetrics()
  }, [timeframe])

  const initializeMetrics = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth/login')
      return
    }

    setLoading(true)

    try {
      // Load cognitive metrics
      const userMetrics = await metricsTracker.calculateUserMetrics(session.user.id, timeframe)
      setMetrics(userMetrics)

      // Generate cognitive report
      const report = await metricsTracker.generateCognitiveReport(session.user.id)
      setCognitiveReport(report)

      // Load behavior contract report
      const contractData = await behaviorContract.generateContractReport(session.user.id)
      setContractReport(contractData)

    } catch (error) {
      console.error('Error loading metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMetricIcon = (metricId: string) => {
    switch (metricId) {
      case 'hint_dependency_reduction':
        return <Target className="w-6 h-6" />
      case 'reasoning_depth_increase':
        return <Brain className="w-6 h-6" />
      case 'confidence_accuracy_alignment':
        return <Activity className="w-6 h-6" />
      case 'persistence_improvement':
        return <TrendingUp className="w-6 h-6" />
      case 'metacognitive_awareness':
        return <Brain className="w-6 h-6" />
      case 'skill_transfer':
        return <BarChart3 className="w-6 h-6" />
      case 'articulation_quality':
        return <CheckCircle className="w-6 h-6" />
      default:
        return <Activity className="w-6 h-6" />
    }
  }

  const getAssessmentColor = (assessment: string) => {
    switch (assessment) {
      case 'excellent':
        return 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/30'
      case 'good':
        return 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30'
      case 'developing':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30'
      case 'needs_attention':
        return 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900/30'
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-900/30'
    }
  }

  const getChangeIcon = (direction: string) => {
    switch (direction) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'declining':
        return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-black dark:to-purple-950 pb-28">
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
            Analyzing Your Cognitive Growth
          </h3>
          <p className="text-gray-600 dark:text-gray-400 font-bold">
            Calculating metrics that matter for your thinking development...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-black dark:to-purple-950 pb-28">
      {/* Header */}
      <div className="glass-strong border-b border-white/20 dark:border-white/10 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/home')}
              className="p-2.5 rounded-2xl hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all active:scale-95 border border-transparent hover:border-indigo-200/50 dark:hover:border-indigo-500/30"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                <BarChart3 className="w-7 h-7 text-indigo-600" />
                Cognitive Metrics
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-bold mt-0.5">
                Track your thinking growth - metrics that actually matter for cognitive development
              </p>
            </div>
            
            {/* Timeframe Selector */}
            <div className="flex gap-2">
              {(['week', 'month', 'quarter', 'year'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                    timeframe === tf
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {tf.charAt(0).toUpperCase() + tf.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Cognitive Summary */}
        {cognitiveReport && (
          <Card className="p-6 mb-8 border-2 border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                Cognitive Development Summary
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-black text-indigo-600 mb-2">
                  {cognitiveReport.overallScore}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-bold">
                  Overall Cognitive Score
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-black text-green-600 mb-2">
                  {cognitiveReport.strengths.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-bold">
                  Cognitive Strengths
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-black text-yellow-600 mb-2">
                  {cognitiveReport.areasForImprovement.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-bold">
                  Areas for Growth
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800">
              <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                {cognitiveReport.summary}
              </p>
            </div>
          </Card>
        )}

        {/* Cognitive Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {metrics.map((metric) => (
            <Card key={metric.id} className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                  {getMetricIcon(metric.id)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">
                    {metric.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {metric.description}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-bold ${getAssessmentColor(metric.assessment)}`}>
                  {metric.assessment.replace('_', ' ')}
                </div>
              </div>

              {/* Current Value and Target */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-2xl font-black text-gray-900 dark:text-white">
                    {metric.currentValue}{metric.unit}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Target: {metric.targetValue}{metric.unit}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getChangeIcon(metric.change.direction)}
                  <span className={`text-sm font-bold ${
                    metric.change.direction === 'improving' ? 'text-green-600' : 
                    metric.change.direction === 'declining' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {metric.change.value > 0 ? '+' : ''}{metric.change.value}{metric.unit}
                  </span>
                  <span className="text-xs text-gray-500">
                    /{metric.change.period}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (metric.currentValue / metric.targetValue) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Insights */}
              {metric.insights.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Key Insights:
                  </div>
                  {metric.insights.slice(0, 2).map((insight, index) => (
                    <div key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      {insight}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Behavior Contract Adherence */}
        {contractReport && (
          <Card className="p-6 border-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                AI Behavior Contract Adherence
              </h2>
              <div className="ml-auto">
                <div className="text-2xl font-black text-purple-600">
                  {contractReport.contract.adherenceScore}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Contract Compliance
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contractReport.principleAnalysis.map((principle: any, index: number) => (
                <div key={index} className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800">
                  <h4 className="font-bold text-purple-700 dark:text-purple-300 mb-2">
                    {principle.principle}
                  </h4>
                  <div className="text-sm text-purple-600 dark:text-purple-400 mb-2">
                    Adherence: {Math.round(principle.adherenceRate)}%
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {principle.recommendations[0]}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}
