'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowRight, 
  Brain, 
  Activity, 
  Zap, 
  CheckCircle2, 
  Play, 
  Star,
  Sparkles,
  Menu,
  X
} from 'lucide-react'
import { PremiumBackground } from '@/components/ui/PremiumUI'
import { cn } from '@/lib/utils'

export default function LandingPage() {
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    {
      icon: <Brain className="w-6 h-6 text-blue-500" />,
      title: "AI Tutor 24/7",
      description: "Get instant, human-like explanations for any subject, any time. brAIny adapts to your learning style.",
      color: "blue"
    },
    {
      icon: <Activity className="w-6 h-6 text-purple-500" />,
      title: "Weak Spot Analysis",
      description: "Our neural engine identifies exactly where your understanding gaps are and helps you plug them.",
      color: "purple"
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      title: "Personalized Learning",
      description: "No two students are the same. Get a study path built specifically for your goals and pace.",
      color: "amber"
    }
  ]

  const steps = [
    {
      number: "01",
      title: "Upload or Chat",
      description: "Scan your notes, upload a PDF, or just start talking about a topic you're studying."
    },
    {
      number: "02",
      title: "AI Analysis",
      description: "brAIny's engine breaks down the content and tests your core intuition and understanding."
    },
    {
      number: "03",
      title: "Master the Topic",
      description: "Follow the adaptive friction system to build permanent memory and deep mastery."
    }
  ]

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0b0b0f] selection:bg-blue-500/30 selection:text-blue-200">
      {/* Navbar */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-6 py-4",
        isScrolled ? "bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5 py-3" : "bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white dark:bg-black p-0.5 border border-black/5 dark:border-white/10 shadow-sm group-hover:scale-105 transition-transform duration-300">
              <img src="/brAIny%20icon.png" alt="Logo" className="w-full h-full object-contain rounded-[7px]" />
            </div>
            <span className={cn("font-bold text-xl tracking-tighter transition-colors", isScrolled ? "text-gray-900 dark:text-white" : "text-gray-900 dark:text-white")}>
              brAIny
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">How it Works</Link>
            <Link href="/subscription" className="text-sm font-medium text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">Pricing</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => router.push('/auth/login')}
              className="px-5 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => router.push('/auth/login')}
              className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full text-sm font-bold hover:shadow-xl hover:shadow-blue-500/10 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Start Free
            </button>
          </div>

          {/* Mobile Toggle */}
          <button className="md:hidden p-2 text-gray-900 dark:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-[#0f0f14] border-b border-black/5 dark:border-white/5 p-6 animate-in slide-in-from-top duration-300">
            <div className="flex flex-col gap-6">
              <Link href="#features" onClick={() => setMobileMenuOpen(false)} className="font-bold text-lg">Features</Link>
              <Link href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="font-bold text-lg">How it Works</Link>
              <Link href="/subscription" onClick={() => setMobileMenuOpen(false)} className="font-bold text-lg">Pricing</Link>
              <hr className="border-black/5 dark:border-white/5" />
              <button onClick={() => router.push('/auth/login')} className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold">Start Learning Free</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-50 dark:opacity-20 z-0">
          <div className="absolute top-[-10%] left-[10%] w-[40%] h-[60%] bg-blue-500/20 blur-[120px] rounded-full animate-aurora-1" />
          <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[60%] bg-purple-500/20 blur-[120px] rounded-full animate-aurora-2" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8 animate-slide-up">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Next-Gen AI Learning</span>
            </div>

            <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-gray-900 dark:text-white leading-[0.95] mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Stop Guessing What to Study. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                Let AI Show You.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 font-medium mb-12 max-w-2xl leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
              brAIny is your AI study partner that analyzes how you learn, finds what you don’t understand, and helps you improve faster.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <button 
                onClick={() => router.push('/auth/login')}
                className="w-full sm:w-auto px-10 py-5 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-lg flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-blue-500/20"
              >
                Start Learning Free <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                className="w-full sm:w-auto px-10 py-5 bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-black/5 dark:border-white/10 text-gray-900 dark:text-white rounded-full font-bold text-lg flex items-center justify-center gap-3 hover:bg-white dark:hover:bg-white/10 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center scale-90">
                  <Play className="w-3 h-3 text-white fill-current ml-0.5" />
                </div>
                How it works
              </button>
            </div>

            {/* App Preview Mockup */}
            <div className="mt-20 md:mt-32 relative w-full aspect-[16/10] md:max-w-5xl mx-auto animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <div className="absolute inset-0 bg-gradient-to-t from-[#fafafa] dark:from-[#0b0b0f] via-transparent to-transparent z-10" />
              <div className="w-full h-full rounded-[2rem] md:rounded-[3rem] bg-white dark:bg-[#1a1a24] border border-black/10 dark:border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] dark:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] overflow-hidden p-2 md:p-4">
                <div className="w-full h-full rounded-[1.5rem] md:rounded-[2.5rem] bg-[#f5f5f7] dark:bg-[#0f0f14] border border-black/5 dark:border-white/5 overflow-hidden relative">
                   {/* Simplified App UI Mockup */}
                   <div className="absolute top-0 left-0 w-full h-12 md:h-16 border-b border-black/5 dark:border-white/5 flex items-center px-6">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                      </div>
                   </div>
                   <div className="absolute top-12 md:top-16 left-0 bottom-0 w-16 md:w-20 border-r border-black/5 dark:border-white/5 flex flex-col items-center py-6 gap-6">
                      {[1,2,3,4].map(i => <div key={i} className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5" />)}
                   </div>
                   <div className="absolute top-12 md:top-16 left-16 md:left-20 right-0 bottom-0 p-8 md:p-12 overflow-hidden">
                      <div className="flex flex-col gap-6 max-w-2xl">
                         <div className="w-32 h-8 rounded-full bg-blue-500/10 border border-blue-500/20" />
                         <div className="w-full h-4 relative overflow-hidden bg-black/5 dark:bg-white/5 rounded-full">
                            <div className="absolute top-0 left-0 h-full w-[65%] bg-blue-500 rounded-full" />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="h-32 rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5" />
                            <div className="h-32 rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5" />
                         </div>
                         <div className="w-full h-64 rounded-[2rem] bg-gradient-to-br from-blue-600 to-purple-600 opacity-20" />
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-6">Designed for Deep Learning</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">Unlike ChatGPT, we don't just give answers. We help you actually understand.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="group p-8 md:p-10 rounded-[2.5rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-2 transition-all duration-500"
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mb-8 bg-gray-50 dark:bg-white/5 transition-colors group-hover:bg-blue-500/10",
                  feature.color === 'purple' && "group-hover:bg-purple-500/10",
                  feature.color === 'amber' && "group-hover:bg-amber-500/10"
                )}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{feature.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 md:py-32 bg-black/5 dark:bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-gray-900 dark:text-white mb-12">How brAIny Works</h2>
              <div className="space-y-12">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex gap-8 group">
                    <div className="flex-shrink-0 w-16 h-16 rounded-[2rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center">
                      <span className="text-2xl font-black text-blue-500 group-hover:scale-110 transition-transform">{step.number}</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
                      <p className="text-lg text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative aspect-square">
               <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full animate-pulse" />
               <div className="relative w-full h-full rounded-[3rem] border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-3xl overflow-hidden flex items-center justify-center p-8">
                  <div className="w-full space-y-4">
                     {[1,2,3].map(i => (
                        <div key={i} className="p-6 rounded-2xl bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 shadow-sm animate-slide-up" style={{ animationDelay: `${i*0.2}s` }}>
                           <div className="flex items-center gap-4 mb-3">
                              <div className="w-10 h-10 rounded-full bg-blue-500 animate-pulse" />
                              <div className="h-4 w-32 bg-black/10 dark:bg-white/10 rounded-full" />
                           </div>
                           <div className="space-y-2">
                              <div className="h-3 w-full bg-black/5 dark:bg-white/5 rounded-full" />
                              <div className="h-3 w-[80%] bg-black/5 dark:bg-white/5 rounded-full" />
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
             <div className="flex justify-center gap-1 mb-4">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-amber-500 fill-current" />)}
             </div>
             <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">What our students say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[1,2,3].map(i => (
                <div key={i} className="p-8 rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10">
                   <p className="text-gray-600 dark:text-gray-400 font-medium italic mb-8">
                     "brAIny has completely changed how I study. I stopped cramming and actually started understanding the 'why' behind concepts. My grades have never been better."
                   </p>
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
                      <div>
                         <p className="font-bold text-gray-900 dark:text-white">Alex Johnson</p>
                         <p className="text-sm text-gray-500 font-medium">High School Senior</p>
                      </div>
                   </div>
                </div>
             ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-48 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600 dark:bg-blue-600/20 z-0" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700 opacity-90 z-1" />
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center text-white">
           <h2 className="text-4xl md:text-7xl font-black tracking-tight mb-8">Ready to Study Smarter?</h2>
           <p className="text-xl md:text-2xl font-medium opacity-80 mb-12 max-w-2xl mx-auto leading-relaxed">
             Join thousands of students who are reclaiming their time and mastering their subjects with brAIny.
           </p>
           <button 
             onClick={() => router.push('/auth/login')}
             className="px-12 py-6 bg-white text-blue-600 rounded-full font-bold text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/20"
           >
             Get Started Now
           </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white dark:bg-black p-0.5 border border-black/5 dark:border-white/10 shadow-sm">
                <img src="/brAIny%20icon.png" alt="Logo" className="w-full h-full object-contain rounded-[7px]" />
              </div>
              <span className="font-bold text-xl tracking-tighter text-gray-900 dark:text-white">brAIny</span>
            </div>
            
            <div className="flex gap-8 text-sm font-medium text-gray-500 dark:text-gray-400">
               <Link href="/support" className="hover:text-black dark:hover:text-white transition-colors">Support</Link>
               <Link href="/privacy" className="hover:text-black dark:hover:text-white transition-colors">Privacy</Link>
               <Link href="/terms" className="hover:text-black dark:hover:text-white transition-colors">Terms</Link>
            </div>

            <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">© 2024 brAIny AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
