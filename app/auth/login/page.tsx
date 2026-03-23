'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Loader2, Check, ArrowLeft } from 'lucide-react'
import { LoadingScreen } from '@/components/LoadingScreen'
import Link from 'next/link'
import { PremiumBackground } from '@/components/ui/PremiumUI'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isAbove13, setIsAbove13] = useState(false)

  // Floating particles state for Antigravity effect
  const [particles, setParticles] = useState<{ id: number, x: number, y: number, size: number, duration: number, delay: number }[]>([])

  useEffect(() => {
    const newParticles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5
    }))
    setParticles(newParticles)
  }, [])

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        if (!acceptedTerms || !isAbove13) {
          setError('Please accept terms to continue.')
          setLoading(false)
          return
        }

        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              accepted_terms: true,
              accepted_at: new Date().toISOString(),
              age_13_plus: true
            }
          }
        })
        if (error) throw error

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('grade_level, display_name')
            .eq('id', data.user.id)
            .maybeSingle()

          if (!profile || !profile.grade_level || !profile.display_name) {
            router.push('/onboarding')
          } else {
            router.push('/home')
          }
        }
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('grade_level, display_name')
            .eq('id', data.user.id)
            .maybeSingle()

          if (!profile || !profile.grade_level || !profile.display_name) {
            router.push('/onboarding')
          } else {
            router.push('/home')
          }
        } else {
          router.push('/home')
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <PremiumBackground className="fixed inset-0 flex items-center justify-center p-6 selection:bg-blue-500/30 overflow-hidden">
      {loading && <LoadingScreen message={isSignUp ? "Creating Profile..." : "Logging In..."} />}
      
      {/* Antigravity Floating Particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-blue-400/10 backdrop-blur-md animate-pulse"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
            }}
          />
        ))}
      </div>

      {/* Main Container - Perfectly Centered Grid */}
      <div className="w-full max-w-[320px] relative z-10 flex flex-col items-center animate-fade-in text-center">
        
        {/* Logo */}
        <div className="w-16 h-16 mb-6 bg-white dark:bg-black rounded-2xl p-1 border border-white/10 shadow-2xl relative">
          <img src="/brAIny icon.png" alt="Logo" className="w-full h-full object-contain rounded-xl" />
        </div>

        {/* Title Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-black tracking-tighter text-white mb-2">
            {isSignUp ? 'Join brAIny' : 'Welcome back'}
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500/40">
            {isSignUp ? 'START YOUR JOURNEY' : 'NEURAL ACCESS'}
          </p>
        </div>

        {/* Google Auth - Primary Action */}
        <button
          type="button"
          className="w-full h-12 flex items-center justify-center gap-3 rounded-2xl bg-white text-black hover:bg-white/90 active:scale-[0.98] transition-all duration-300 shadow-xl mb-6 shadow-white/5"
          onClick={handleGoogleAuth}
          disabled={loading}
        >
          <div className="flex h-5 w-5 items-center justify-center">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
          <span className="text-black text-[10px] font-black uppercase tracking-widest leading-none">
            Google Login
          </span>
        </button>

        <div className="relative w-full py-1 flex items-center justify-center mb-6">
          <div className="h-[1px] w-full bg-white/5 absolute" />
          <span className="relative z-10 px-4 bg-transparent text-[8px] uppercase font-bold text-white/10 tracking-[0.5em]">
            OR
          </span>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="w-full space-y-4">
          <div className="space-y-3">
            <input
              type="email"
              placeholder="EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-12 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500/50 px-5 text-white text-[10px] font-black tracking-widest outline-none transition-all placeholder:text-white/10 focus:bg-white/10 text-center uppercase"
            />

            <input
              type="password"
              placeholder="PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full h-12 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500/50 px-5 text-white text-[10px] font-black tracking-widest outline-none transition-all placeholder:text-white/10 focus:bg-white/10 text-center uppercase"
            />
          </div>

          {isSignUp && (
            <div className="flex flex-col gap-2 py-1 items-center px-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={cn(
                  "w-4 h-4 rounded-md border flex items-center justify-center transition-all",
                  acceptedTerms ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/30" : "bg-white/5 border-white/10"
                )} onClick={() => setAcceptedTerms(!acceptedTerms)}>
                  {acceptedTerms && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className="text-[8px] text-white/20 font-black uppercase tracking-widest leading-none translate-y-[1px]">
                  Terms
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={cn(
                  "w-4 h-4 rounded-md border flex items-center justify-center transition-all",
                  isAbove13 ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/30" : "bg-white/5 border-white/10"
                )} onClick={() => setIsAbove13(!isAbove13)}>
                  {isAbove13 && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className="text-[8px] text-white/20 font-black uppercase tracking-widest leading-none translate-y-[1px]">
                  13+ years
                </span>
              </label>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[8px] font-black uppercase tracking-widest text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 shadow-lg shadow-blue-600/10 active:scale-[0.97] flex items-center justify-center mt-2"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              isSignUp ? 'Create Profile' : 'Access Dashboard'
            )}
          </button>
        </form>

        <div className="pt-8 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-white/20 hover:text-white text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>

        {/* Home Link */}
        <button 
          onClick={() => router.push('/')}
          className="mt-12 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.4em] text-white/10 hover:text-white/30 transition-colors"
        >
          <ArrowLeft className="w-2 h-2 text-white/40" /> Home
        </button>
      </div>
    </PremiumBackground>
  )
}
