'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useUserTier } from '@/contexts/UserTierContext'
import { useFeatureGate } from '@/lib/feature-gates'
import { 
  AlertTriangle, 
  Target, 
  TrendingUp, 
  Brain, 
  BookOpen, 
  Award,
  RefreshCw,
  CheckCircle2,
  BarChart3,
  Lightbulb,
  ArrowLeft,
  ArrowRight,
  Crown,
  Sparkles,
  Activity,
  Fingerprint,
  Lock as LockIcon
} from 'lucide-react'
import { BottomNavigation } from '@/components/BottomNavigation'
import { PremiumBackground } from '@/components/ui/PremiumUI'
import { Card } from '@/components/ui/Card'

interface WeakSpot {
  concept: string
  subject: string
  frequency: number
  recent_failures: number
  improvement_suggestions: string[]
  practice_resources: {
    type: 'quiz' | 'flashcards' | 'video' | 'practice'
    title: string
    action: string
  }[]
}

interface WeakSpotAnalysis {
  weak_spots: WeakSpot[]
  overall_performance: number
  improvement_plan: {
    priority_concepts: string[]
    study_strategy: string
    estimated_improvement_time: string
  }
}

export default function WeakSpotsPage() {
  const router = useRouter()
  const { userTier, isLoading: tierLoading } = useUserTier()
  const { canAccess } = useFeatureGate(userTier)
  const [analysis, setAnalysis] = useState<WeakSpotAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  const canAccessWeakSpots = canAccess('weak_spot_analysis')

  useEffect(() => {
    if (!tierLoading) {
      fetchProfile()
      fetchWeakSpotAnalysis()
    }
  }, [tierLoading, canAccessWeakSpots])

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profile)
    }
  }

  const fetchWeakSpotAnalysis = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: analysisData } = await supabase
        .from('weak_spot_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (analysisData) {
        setAnalysis(analysisData.analysis_data)
      } else if (canAccessWeakSpots) {
        // Auto-trigger analysis if empty for legend users
        analyzeWeakSpots()
      }
    } catch (error) {
      console.error('Error fetching analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeWeakSpots = async () => {
    setAnalyzing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's quiz and performance data
      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      const { data: performance } = await supabase
        .from('user_performance')
        .select('*')
        .eq('user_id', user.id)

      // Generate analysis using AI
      const response = await fetch('/api/weak-spots/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizzes,
          performance,
          subjects: profile?.subjects || [],
          grade_level: profile?.grade_level || 'College'
        })
      })

      const data = await response.json()
      
      if (data.analysis) {
        // Save analysis
        await supabase
          .from('weak_spot_analysis')
          .insert({
            user_id: user.id,
            analysis_data: data.analysis,
            created_at: new Date().toISOString()
          })

        setAnalysis(data.analysis)
      }
    } catch (error) {
      console.error('Error analyzing weak spots:', error)
    } finally {
      setAnalyzing(false)
      setLoading(false)
    }
  }

  const getSeverityStyle = (frequency: number, recent_failures: number) => {
    const score = frequency * 0.6 + recent_failures * 0.4
    if (score >= 8) return {
      border: 'border-red-500/30',
      bg: 'bg-red-500/5',
      text: 'text-red-500',
      label: 'Critical Gap'
    }
    if (score >= 5) return {
      border: 'border-orange-500/30',
      bg: 'bg-orange-500/5',
      text: 'text-orange-500',
      label: 'Focus Needed'
    }
    return {
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/5',
      text: 'text-blue-500',
      label: 'Active Friction'
    }
  }

  const handlePracticeAction = (action: string, type: string) => {
    switch (type) {
      case 'quiz':
        router.push(`/tutor?mode=quiz&topic=${encodeURIComponent(action)}`)
        break
      default:
        router.push(`/tutor?new=true&message=${encodeURIComponent(`I want to master ${action}. Help me fix my weak spots.`)}`)
    }
  }

  if (loading && !analyzing) {
    return (
      <PremiumBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Fingerprint className="w-16 h-16 text-orange-500 mx-auto mb-6 animate-pulse" />
            <p className="text-white/60 font-medium tracking-widest uppercase text-xs">Accessing Neural Patterns...</p>
          </div>
        </div>
      </PremiumBackground>
    )
  }

  return (
    <PremiumBackground>
      <div className="min-h-screen pb-32">
        {/* Cinematic Header */}
        <div className="relative h-64 w-full overflow-hidden flex items-end px-6 pb-12">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/60 to-slate-950 z-10"></div>
          {/* Animated Glow */}
          <div className="absolute top-[-20%] right-[-10%] w-[100%] h-[150%] bg-[radial-gradient(circle_at_center,_#f9731615,_transparent_70%)] animate-pulse"></div>
          
          <div className="relative z-20 flex items-center justify-between w-full">
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.push('/home')}
                className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-3xl hover:bg-white/10 transition-all active:scale-95 group"
              >
                <ArrowLeft className="w-6 h-6 text-white group-hover:-translate-x-1 transition-transform" />
              </button>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight uppercase italic flex items-center gap-3">
                  Neural <span className="text-orange-500">Diagnostics</span>
                </h1>
                <p className="text-xs text-slate-400 font-bold tracking-[0.3em] uppercase mt-1 flex items-center gap-2">
                  <Activity className="w-3 h-3 text-orange-500 animate-pulse" />
                  Real-time pattern Recognition
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 space-y-8">
          {/* Locked State for non-Legend users */}
          {!canAccessWeakSpots && (
            <div className="glass-hologram rounded-[2.5rem] p-10 border border-white/20 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <LockIcon className="w-32 h-32 text-white" />
              </div>
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-glow-orange">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-black text-white mb-4">Master Your Weak Spots</h2>
              <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                Unlock advanced neural diagnostics to identify precisely where your learning friction lies.
              </p>
              <button
                onClick={() => router.push('/subscription')}
                className="bg-white text-black px-10 py-4 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-orange-500 hover:text-white transition-all duration-500"
              >
                Upgrade to Legend
              </button>
            </div>
          )}

          {canAccessWeakSpots && (
            <>
              {analyzing ? (
                <div className="glass-hologram rounded-[2rem] p-12 text-center border border-orange-500/20">
                  <RefreshCw className="w-12 h-12 text-orange-500 mx-auto mb-6 animate-spin" />
                  <h3 className="text-xl font-bold text-white mb-2">Re-Analyzing Your Mind</h3>
                  <p className="text-slate-400">Scanning recent test results and cognitive friction patterns...</p>
                </div>
              ) : analysis ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-8 border-blue-500/20" glow>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-white/80 uppercase tracking-widest text-xs">Core Proficiency</h3>
                        <BarChart3 className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex items-end gap-3">
                        <span className="text-6xl font-black text-white">{Math.round(analysis.overall_performance)}%</span>
                        <div className="mb-2">
                          <TrendingUp className="w-5 h-5 text-emerald-500" />
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 mt-4 font-medium leading-relaxed">
                        {analysis.improvement_plan.study_strategy}
                      </p>
                    </Card>

                    <Card className="p-8 border-orange-500/20" glow>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-white/80 uppercase tracking-widest text-xs">Neural Gap Count</h3>
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                      </div>
                      <div className="text-6xl font-black text-white">{analysis.weak_spots.length}</div>
                      <div className="flex items-center gap-2 mt-4">
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                        <span className="text-sm text-slate-400 font-bold uppercase tracking-tighter">
                          Immediate attention required
                        </span>
                      </div>
                    </Card>
                  </div>

                  {/* Diagnostic List */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            <Fingerprint className="w-5 h-5 text-orange-500" />
                            Neural Diagnostics
                        </h3>
                        <button 
                            onClick={analyzeWeakSpots}
                            className="text-xs font-black text-white/40 hover:text-orange-500 transition-colors tracking-widest uppercase flex items-center gap-2"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Refresh Scan
                        </button>
                    </div>

                    {analysis.weak_spots.map((spot, index) => {
                      const style = getSeverityStyle(spot.frequency, spot.recent_failures)
                      return (
                        <div key={index} className={`glass-hologram rounded-[2rem] p-8 border ${style.border} group transition-all duration-500 hover:scale-[1.01]`}>
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                            <div className="space-y-2">
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${style.border} ${style.bg} ${style.text}`}>
                                {style.label}
                              </span>
                              <h4 className="text-2xl font-black text-white group-hover:text-glow transition-all">{spot.concept}</h4>
                              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{spot.subject}</p>
                            </div>
                            <div className="flex items-center gap-8 text-slate-400">
                                <div className="text-center">
                                    <div className="text-xl font-black text-white">{spot.frequency}</div>
                                    <div className="text-[10px] font-bold uppercase tracking-tighter opacity-50">Gaps</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-black text-white">{spot.recent_failures}</div>
                                    <div className="text-[10px] font-bold uppercase tracking-tighter opacity-50">Failures</div>
                                </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-4">
                              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Growth Strategy</p>
                              <div className="space-y-3">
                                {spot.improvement_suggestions.map((s, i) => (
                                  <div key={i} className="flex items-start gap-3 text-sm text-slate-300 font-medium">
                                    <Sparkles className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                    <span>{s}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-4">
                              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Neural Resources</p>
                              <div className="space-y-3">
                                {spot.practice_resources.map((r, i) => (
                                  <button
                                    key={i}
                                    onClick={() => handlePracticeAction(r.action, r.type)}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group/btn"
                                  >
                                    <div className="flex items-center gap-3">
                                      {r.type === 'quiz' ? <Award className="w-4 h-4 text-blue-500" /> : <BookOpen className="w-4 h-4 text-emerald-500" />}
                                      <span className="text-sm font-bold text-white/90">{r.title}</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-white/20 group-hover/btn:translate-x-1 transition-transform" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handlePracticeAction(spot.concept, 'tutor')}
                            className="w-full py-5 rounded-[1.5rem] bg-gradient-to-r from-orange-500 to-red-600 text-white font-black uppercase text-xs tracking-[0.2em] hover:shadow-glow-orange transition-all duration-300"
                          >
                            Initiate Core Recovery
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="glass-hologram rounded-[2rem] p-20 text-center border border-white/10">
                  <Brain className="w-20 h-20 text-slate-800 mx-auto mb-8" />
                  <h3 className="text-2xl font-black text-white mb-4">Neural Buffer Empty</h3>
                  <p className="text-slate-400 mb-10 max-w-sm mx-auto">
                    We haven't detected any significant patterns yet. Complete more tests to generate a deep diagnostic report.
                  </p>
                  <button
                    onClick={() => router.push('/tutor')}
                    className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-glow-orange"
                  >
                    Launch Tutor
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <BottomNavigation />
      </div>
    </PremiumBackground>
  )
}
