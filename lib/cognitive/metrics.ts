import { createSupabaseClient } from '@/lib/supabase/client'
import type { ThinkingFingerprint, CognitiveMetric, CognitiveTrend } from '@/types/cognitive'

export class CognitiveMetricsTracker {
  private static instance: CognitiveMetricsTracker
  private supabase = createSupabaseClient()

  static getInstance(): CognitiveMetricsTracker {
    if (!CognitiveMetricsTracker.instance) {
      CognitiveMetricsTracker.instance = new CognitiveMetricsTracker()
    }
    return CognitiveMetricsTracker.instance
  }

  async calculateUserMetrics(userId: string, timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<CognitiveMetric[]> {
    const { data: interactions } = await this.supabase
      .from('user_interactions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', this.getTimeframeDate(timeframe))
      .order('created_at', { ascending: true })

    if (!interactions || interactions.length === 0) {
      return this.getDefaultMetrics()
    }

    const metrics: CognitiveMetric[] = []

    // 1. Hint Dependency Reduction
    const hintDependencyMetric = this.calculateHintDependencyTrend(interactions)
    metrics.push(hintDependencyMetric)

    // 2. Reasoning Depth Increase
    const reasoningDepthMetric = this.calculateReasoningDepthTrend(interactions)
    metrics.push(reasoningDepthMetric)

    // 3. Confidence-Accuracy Alignment
    const confidenceAccuracyMetric = this.calculateConfidenceAccuracyTrend(interactions)
    metrics.push(confidenceAccuracyMetric)

    // 4. Persistence Improvement
    const persistenceMetric = this.calculatePersistenceTrend(interactions)
    metrics.push(persistenceMetric)

    // 5. Metacognitive Awareness
    const metacognitionMetric = this.calculateMetacognitionTrend(interactions)
    metrics.push(metacognitionMetric)

    // 6. Skill Transfer
    const transferMetric = this.calculateSkillTransferTrend(interactions)
    metrics.push(transferMetric)

    // 7. Articulation Quality
    const articulationMetric = this.calculateArticulationTrend(interactions)
    metrics.push(articulationMetric)

    return metrics
  }

  private calculateHintDependencyTrend(interactions: any[]): CognitiveMetric {
    const dailyData = this.groupByDay(interactions)
    const trend: CognitiveTrend[] = []

    Object.entries(dailyData).forEach(([date, dayInteractions]) => {
      const totalHints = dayInteractions.reduce((sum, interaction) => 
        sum + (interaction.hints_used || 0), 0)
      const totalProblems = dayInteractions.length
      const hintDependency = totalProblems > 0 ? (totalHints / totalProblems) : 0

      trend.push({
        date,
        value: Math.round((1 - hintDependency) * 100), // Invert: lower dependency = higher score
        context: { totalHints, totalProblems }
      })
    })

    const currentValue = trend[trend.length - 1]?.value || 0
    const previousValue = trend[Math.max(0, trend.length - 7)]?.value || 0
    const change = currentValue - previousValue

    return {
      id: 'hint_dependency_reduction',
      name: 'Hint Dependency Reduction',
      description: 'Decreased reliance on hints and immediate answers',
      currentValue,
      targetValue: 80, // Target: 80% reduction from baseline
      unit: '%',
      trend: trend.slice(-30), // Last 30 days
      change: {
        value: change,
        period: 'week',
        direction: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable'
      },
      assessment: this.assessPerformance(currentValue, 80),
      insights: this.generateHintDependencyInsights(trend, interactions)
    }
  }

  private calculateReasoningDepthTrend(interactions: any[]): CognitiveMetric {
    const dailyData = this.groupByDay(interactions)
    const trend: CognitiveTrend[] = []

    Object.entries(dailyData).forEach(([date, dayInteractions]) => {
      const avgDepth = dayInteractions.reduce((sum, interaction) => 
        sum + (interaction.reasoning_depth || 0), 0) / dayInteractions.length

      trend.push({
        date,
        value: Math.round((avgDepth / 5) * 100), // Convert to percentage of max depth
        context: { avgDepth: avgDepth.toFixed(2) }
      })
    })

    const currentValue = trend[trend.length - 1]?.value || 0
    const previousValue = trend[Math.max(0, trend.length - 7)]?.value || 0
    const change = currentValue - previousValue

    return {
      id: 'reasoning_depth_increase',
      name: 'Reasoning Depth',
      description: 'Quality and depth of thinking processes',
      currentValue,
      targetValue: 75, // Target: 75% of maximum depth
      unit: '%',
      trend: trend.slice(-30),
      change: {
        value: change,
        period: 'week',
        direction: change > 3 ? 'improving' : change < -3 ? 'declining' : 'stable'
      },
      assessment: this.assessPerformance(currentValue, 75),
      insights: this.generateReasoningDepthInsights(trend, interactions)
    }
  }

  private calculateConfidenceAccuracyTrend(interactions: any[]): CognitiveMetric {
    const dailyData = this.groupByDay(interactions)
    const trend: CognitiveTrend[] = []

    Object.entries(dailyData).forEach(([date, dayInteractions]) => {
      const mismatches = dayInteractions.filter(interaction => {
        const confidence = interaction.confidence || 50
        const accuracy = (interaction.correctness || 0) * 100
        return Math.abs(confidence - accuracy) > 20 // Significant mismatch
      }).length

      const alignmentScore = dayInteractions.length > 0 ? 
        ((dayInteractions.length - mismatches) / dayInteractions.length) * 100 : 100

      trend.push({
        date,
        value: Math.round(alignmentScore),
        context: { mismatches, total: dayInteractions.length }
      })
    })

    const currentValue = trend[trend.length - 1]?.value || 0
    const previousValue = trend[Math.max(0, trend.length - 7)]?.value || 0
    const change = currentValue - previousValue

    return {
      id: 'confidence_accuracy_alignment',
      name: 'Confidence-Accuracy Alignment',
      description: 'How well confidence matches actual performance',
      currentValue,
      targetValue: 85, // Target: 85% alignment
      unit: '%',
      trend: trend.slice(-30),
      change: {
        value: change,
        period: 'week',
        direction: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable'
      },
      assessment: this.assessPerformance(currentValue, 85),
      insights: this.generateConfidenceAccuracyInsights(trend, interactions)
    }
  }

  private calculatePersistenceTrend(interactions: any[]): CognitiveMetric {
    const dailyData = this.groupByDay(interactions)
    const trend: CognitiveTrend[] = []

    Object.entries(dailyData).forEach(([date, dayInteractions]) => {
      const persistentAttempts = dayInteractions.filter(interaction => 
        interaction.time_to_response && interaction.time_to_response > 120 // > 2 minutes
      ).length

      const persistenceScore = dayInteractions.length > 0 ? 
        (persistentAttempts / dayInteractions.length) * 100 : 0

      trend.push({
        date,
        value: Math.round(persistenceScore),
        context: { persistentAttempts, total: dayInteractions.length }
      })
    })

    const currentValue = trend[trend.length - 1]?.value || 0
    const previousValue = trend[Math.max(0, trend.length - 7)]?.value || 0
    const change = currentValue - previousValue

    return {
      id: 'persistence_improvement',
      name: 'Cognitive Persistence',
      description: 'Willingness to struggle with difficult problems',
      currentValue,
      targetValue: 70, // Target: 70% of attempts show persistence
      unit: '%',
      trend: trend.slice(-30),
      change: {
        value: change,
        period: 'week',
        direction: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable'
      },
      assessment: this.assessPerformance(currentValue, 70),
      insights: this.generatePersistenceInsights(trend, interactions)
    }
  }

  private calculateMetacognitionTrend(interactions: any[]): CognitiveMetric {
    // This would come from reflection mode responses
    const reflectionInteractions = interactions.filter(interaction => 
      interaction.mode === 'reflect'
    )

    const trend: CognitiveTrend[] = []
    const dailyData = this.groupByDay(reflectionInteractions)

    Object.entries(dailyData).forEach(([date, dayInteractions]) => {
      const avgReflectionDepth = dayInteractions.reduce((sum, interaction) => 
        sum + (interaction.reasoning_depth || 0), 0) / dayInteractions.length

      trend.push({
        date,
        value: Math.round((avgReflectionDepth / 5) * 100),
        context: { reflections: dayInteractions.length }
      })
    })

    const currentValue = trend[trend.length - 1]?.value || 0
    const previousValue = trend[Math.max(0, trend.length - 7)]?.value || 0
    const change = currentValue - previousValue

    return {
      id: 'metacognitive_awareness',
      name: 'Metacognitive Awareness',
      description: 'Understanding of own thinking processes',
      currentValue,
      targetValue: 80, // Target: 80% of maximum metacognitive depth
      unit: '%',
      trend: trend.slice(-30),
      change: {
        value: change,
        period: 'week',
        direction: change > 3 ? 'improving' : change < -3 ? 'declining' : 'stable'
      },
      assessment: this.assessPerformance(currentValue, 80),
      insights: this.generateMetacognitionInsights(trend, interactions)
    }
  }

  private calculateSkillTransferTrend(interactions: any[]): CognitiveMetric {
    // Analyze patterns across different domains
    const domainPerformance: { [domain: string]: number[] } = {}
    
    interactions.forEach(interaction => {
      const domain = interaction.domain || 'general'
      if (!domainPerformance[domain]) {
        domainPerformance[domain] = []
      }
      domainPerformance[domain].push(interaction.reasoning_depth || 0)
    })

    const domains = Object.keys(domainPerformance)
    const transferScores: CognitiveTrend[] = []

    // Calculate cross-domain consistency
    const dailyData = this.groupByDay(interactions)
    Object.entries(dailyData).forEach(([date, dayInteractions]) => {
      const dayDomains = new Set(dayInteractions.map(i => i.domain || 'general'))
      const avgDepth = dayInteractions.reduce((sum, i) => sum + (i.reasoning_depth || 0), 0) / dayInteractions.length
      
      // Transfer score: consistency across domains
      const transferScore = dayDomains.size > 1 ? avgDepth * (dayDomains.size / domains.length) * 20 : avgDepth * 20
      
      transferScores.push({
        date,
        value: Math.round(transferScore),
        context: { domains: Array.from(dayDomains), avgDepth: avgDepth.toFixed(2) }
      })
    })

    const currentValue = transferScores[transferScores.length - 1]?.value || 0
    const previousValue = transferScores[Math.max(0, transferScores.length - 7)]?.value || 0
    const change = currentValue - previousValue

    return {
      id: 'skill_transfer',
      name: 'Skill Transfer',
      description: 'Ability to apply thinking across different domains',
      currentValue,
      targetValue: 65, // Target: 65% transfer effectiveness
      unit: '%',
      trend: transferScores.slice(-30),
      change: {
        value: change,
        period: 'week',
        direction: change > 3 ? 'improving' : change < -3 ? 'declining' : 'stable'
      },
      assessment: this.assessPerformance(currentValue, 65),
      insights: this.generateTransferInsights(transferScores, interactions)
    }
  }

  private calculateArticulationTrend(interactions: any[]): CognitiveMetric {
    const trend: CognitiveTrend[] = []
    const dailyData = this.groupByDay(interactions)

    Object.entries(dailyData).forEach(([date, dayInteractions]) => {
      const avgResponseLength = dayInteractions.reduce((sum, interaction) => 
        sum + (interaction.response?.length || 0), 0) / dayInteractions.length
      
      // Quality score based on length and reasoning depth
      const articulationScore = Math.min(100, (avgResponseLength / 200) * 50 + 
        (dayInteractions.reduce((sum, i) => sum + (i.reasoning_depth || 0), 0) / dayInteractions.length) * 10)

      trend.push({
        date,
        value: Math.round(articulationScore),
        context: { avgLength: Math.round(avgResponseLength) }
      })
    })

    const currentValue = trend[trend.length - 1]?.value || 0
    const previousValue = trend[Math.max(0, trend.length - 7)]?.value || 0
    const change = currentValue - previousValue

    return {
      id: 'articulation_quality',
      name: 'Articulation Quality',
      description: 'Ability to express thinking clearly and thoroughly',
      currentValue,
      targetValue: 75, // Target: 75% articulation quality
      unit: '%',
      trend: trend.slice(-30),
      change: {
        value: change,
        period: 'week',
        direction: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable'
      },
      assessment: this.assessPerformance(currentValue, 75),
      insights: this.generateArticulationInsights(trend, interactions)
    }
  }

  private assessPerformance(currentValue: number, targetValue: number): 'excellent' | 'good' | 'developing' | 'needs_attention' {
    const percentage = (currentValue / targetValue) * 100
    if (percentage >= 90) return 'excellent'
    if (percentage >= 75) return 'good'
    if (percentage >= 60) return 'developing'
    return 'needs_attention'
  }

  private generateHintDependencyInsights(trend: CognitiveTrend[], interactions: any[]): string[] {
    const insights: string[] = []
    const recentTrend = trend.slice(-7)
    const avgRecent = recentTrend.reduce((sum, t) => sum + t.value, 0) / recentTrend.length

    if (avgRecent < 40) {
      insights.push("You're still relying heavily on hints. Try spending at least 2 more minutes on problems before seeking help.")
    } else if (avgRecent > 70) {
      insights.push("Excellent progress! You're developing independence in problem-solving.")
    }

    // Check domain-specific patterns
    const domainHints = this.groupByDomain(interactions)
    Object.entries(domainHints).forEach(([domain, domainInteractions]) => {
      const hintRate = domainInteractions.reduce((sum, i) => sum + (i.hints_used || 0), 0) / domainInteractions.length
      if (hintRate > 1.5) {
        insights.push(`Consider spending more time on ${domain} problems before seeking hints.`)
      }
    })

    return insights
  }

  private generateReasoningDepthInsights(trend: CognitiveTrend[], interactions: any[]): string[] {
    const insights: string[] = []
    const recentTrend = trend.slice(-7)
    const avgRecent = recentTrend.reduce((sum, t) => sum + t.value, 0) / recentTrend.length

    if (avgRecent < 40) {
      insights.push("Your reasoning could be deeper. Try explaining 'why' before answering 'what'.")
    } else if (avgRecent > 70) {
      insights.push("Strong reasoning skills! You're thinking critically about problems.")
    }

    return insights
  }

  private generateConfidenceAccuracyInsights(trend: CognitiveTrend[], interactions: any[]): string[] {
    const insights: string[] = []
    const recentTrend = trend.slice(-7)
    const avgRecent = recentTrend.reduce((sum, t) => sum + t.value, 0) / recentTrend.length

    if (avgRecent < 60) {
      insights.push("Your confidence often doesn't match your actual understanding. Rate your confidence more carefully.")
    } else if (avgRecent > 85) {
      insights.push("Great self-awareness! You have an accurate sense of your own knowledge.")
    }

    return insights
  }

  private generatePersistenceInsights(trend: CognitiveTrend[], interactions: any[]): string[] {
    const insights: string[] = []
    const recentTrend = trend.slice(-7)
    const avgRecent = recentTrend.reduce((sum, t) => sum + t.value, 0) / recentTrend.length

    if (avgRecent < 40) {
      insights.push("You give up quickly on difficult problems. Try persisting for at least 5 minutes before seeking help.")
    } else if (avgRecent > 70) {
      insights.push("Excellent persistence! You're developing the grit needed for challenging problems.")
    }

    return insights
  }

  private generateMetacognitionInsights(trend: CognitiveTrend[], interactions: any[]): string[] {
    const insights: string[] = []
    const reflectionCount = interactions.filter(i => i.mode === 'reflect').length

    if (reflectionCount < 3) {
      insights.push("Spend more time in Reflect Mode to develop metacognitive awareness.")
    } else {
      insights.push("Good use of reflection! Continue examining your thinking patterns.")
    }

    return insights
  }

  private generateTransferInsights(trend: CognitiveTrend[], interactions: any[]): string[] {
    const insights: string[] = []
    const domains = new Set(interactions.map(i => i.domain || 'general'))

    if (domains.size < 3) {
      insights.push("Try working in different domains to improve skill transfer.")
    } else {
      insights.push("Good cross-domain practice! Look for patterns across subjects.")
    }

    return insights
  }

  private generateArticulationInsights(trend: CognitiveTrend[], interactions: any[]): string[] {
    const insights: string[] = []
    const recentTrend = trend.slice(-7)
    const avgRecent = recentTrend.reduce((sum, t) => sum + t.value, 0) / recentTrend.length

    if (avgRecent < 50) {
      insights.push("Your explanations could be more detailed. Try writing at least 100 characters for each response.")
    } else if (avgRecent > 75) {
      insights.push("Excellent articulation! You express your thinking clearly and thoroughly.")
    }

    return insights
  }

  private groupByDay(interactions: any[]): { [date: string]: any[] } {
    const grouped: { [date: string]: any[] } = {}
    
    interactions.forEach(interaction => {
      const date = new Date(interaction.created_at).toISOString().split('T')[0]
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(interaction)
    })

    return grouped
  }

  private groupByDomain(interactions: any[]): { [domain: string]: any[] } {
    const grouped: { [domain: string]: any[] } = {}
    
    interactions.forEach(interaction => {
      const domain = interaction.domain || 'general'
      if (!grouped[domain]) {
        grouped[domain] = []
      }
      grouped[domain].push(interaction)
    })

    return grouped
  }

  private getTimeframeDate(timeframe: 'week' | 'month' | 'quarter' | 'year'): string {
    const now = new Date()
    switch (timeframe) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      case 'quarter':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  }

  private getDefaultMetrics(): CognitiveMetric[] {
    return [
      {
        id: 'hint_dependency_reduction',
        name: 'Hint Dependency Reduction',
        description: 'Decreased reliance on hints and immediate answers',
        currentValue: 0,
        targetValue: 80,
        unit: '%',
        trend: [],
        change: { value: 0, period: 'week', direction: 'stable' },
        assessment: 'needs_attention',
        insights: ['Start practicing to see your cognitive metrics improve!']
      },
      {
        id: 'reasoning_depth_increase',
        name: 'Reasoning Depth',
        description: 'Quality and depth of thinking processes',
        currentValue: 0,
        targetValue: 75,
        unit: '%',
        trend: [],
        change: { value: 0, period: 'week', direction: 'stable' },
        assessment: 'needs_attention',
        insights: ['Begin your cognitive training journey to develop deeper thinking.']
      }
    ]
  }

  async generateCognitiveReport(userId: string): Promise<{
    summary: string
    strengths: string[]
    areasForImprovement: string[]
    recommendations: string[]
    overallScore: number
  }> {
    const metrics = await this.calculateUserMetrics(userId)
    
    const overallScore = Math.round(
      metrics.reduce((sum, metric) => sum + (metric.currentValue / metric.targetValue) * 100, 0) / metrics.length
    )

    const strengths = metrics
      .filter(m => m.assessment === 'excellent' || m.assessment === 'good')
      .map(m => m.name)

    const areasForImprovement = metrics
      .filter(m => m.assessment === 'needs_attention' || m.assessment === 'developing')
      .map(m => m.name)

    const recommendations = metrics.flatMap(m => m.insights).slice(0, 5)

    const summary = this.generateSummary(overallScore, strengths.length, areasForImprovement.length)

    return {
      summary,
      strengths,
      areasForImprovement,
      recommendations,
      overallScore
    }
  }

  private generateSummary(score: number, strengthCount: number, improvementCount: number): string {
    if (score >= 85) {
      return "Outstanding cognitive development! You're demonstrating advanced thinking skills and strong metacognitive awareness."
    } else if (score >= 70) {
      return "Strong progress! You're developing effective thinking habits and showing good cognitive growth."
    } else if (score >= 55) {
      return "Steady improvement! Focus on consistency and deeper engagement with problems."
    } else {
      return "Beginning your cognitive journey! Embrace productive struggle and persist through challenges."
    }
  }
}
