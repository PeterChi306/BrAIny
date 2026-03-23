'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { BottomNavigation } from '@/components/BottomNavigation'
import { learningIntelligence } from '@/lib/learning-intelligence'
import { learningFeedbackSystem } from '@/lib/learning-feedback'
import BrainTrainingRPG from '@/components/learning/BrainTrainingRPG'
import { Brain, TrendingUp, Target, AlertCircle, CheckCircle, Clock, Award, ArrowLeft } from 'lucide-react'
import { PremiumBackground } from '@/components/ui/PremiumUI'

export default function ProgressPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/auth/login')
          return
        }
        setUserId(session.user.id)
        setLoading(false)
      } catch (error) {
        console.error('Error loading user:', error)
        setLoading(false)
      }
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/auth/login')
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setUserId(session.user.id)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  if (loading) {
    return (
      <PremiumBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-white/80">Loading learning intelligence...</p>
          </div>
        </div>
      </PremiumBackground>
    )
  }

  return (
    <PremiumBackground>
      <div className="min-h-screen pb-24 relative overflow-hidden">
        {/* Cinematic Header */}
        <div className="relative h-48 w-full overflow-hidden flex items-end px-6 pb-6">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/40 to-slate-950 z-10"></div>
          {/* Animated Background Pulse */}
          <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[150%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent animate-pulse duration-[4000ms]"></div>
          
          <div className="relative z-20 flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-3xl hover:bg-white/10 transition-all active:scale-95 group"
              >
                <ArrowLeft className="w-6 h-6 text-white group-hover:-translate-x-1 transition-transform" />
              </button>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-2">
                  Mind <span className="text-blue-500">Evolution</span>
                </h1>
                <p className="text-xs text-slate-400 font-medium tracking-[0.2em] uppercase">Neural Diagnostics & Progress</p>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="w-10 h-10 rounded-full border-2 border-blue-500/50 flex items-center justify-center bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                <Brain className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-6">
          {userId && (
            <BrainTrainingRPG userId={userId} />
          )}
        </div>

        <BottomNavigation />
      </div>
    </PremiumBackground>
  )
}
