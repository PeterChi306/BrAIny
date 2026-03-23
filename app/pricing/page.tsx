'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Check, 
  ArrowLeft, 
  Sparkles, 
  Zap, 
  Star, 
  Crown, 
  ShieldCheck,
  ZapIcon,
  CheckCircle2
} from 'lucide-react'
import { PremiumBackground, PrestigeBorder, GlowingName } from '@/components/ui/PremiumUI'
import { TIER_FEATURES } from '@/lib/tiers'
import { cn } from '@/lib/utils'

export default function PricingPage() {
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const tiers = [
    {
      id: 'starter',
      name: 'Free',
      price: '0',
      description: 'Experience the AI study partner basics.',
      features: TIER_FEATURES.starter.features,
      cta: 'Start Free',
      highlighted: false,
      color: 'gray'
    },
    {
      id: 'scholar',
      name: 'Scholar',
      price: '9.99',
      description: 'Perfect for daily homework and growing learners.',
      features: TIER_FEATURES.scholar.features,
      cta: 'Get Scholar',
      highlighted: false,
      color: 'blue'
    },
    {
      id: 'master',
      name: 'Master',
      price: '14.99',
      description: 'The complete toolkit for serious students.',
      features: TIER_FEATURES.master.features,
      cta: 'Get Master',
      highlighted: true,
      color: 'purple'
    },
    {
      id: 'legend',
      name: 'Legend',
      price: '23.99',
      description: 'Elite features and priority neural processing.',
      features: TIER_FEATURES.legend.features,
      cta: 'Get Legend',
      highlighted: false,
      color: 'amber'
    }
  ]

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0b0b0f] selection:bg-blue-500/30">
      {/* Simple Header */}
      <header className="px-6 py-8 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white dark:bg-black p-0.5 border border-black/5 dark:border-white/10 shadow-sm">
            <img src="/brAIny%20icon.png" alt="Logo" className="w-full h-full object-contain rounded-lg" />
          </div>
          <span className="font-bold text-xl tracking-tighter text-gray-900 dark:text-white">brAIny</span>
        </div>
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-gray-900 dark:text-white mb-6">Invest in Your Intelligence</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">Choose the plan that fits your learning journey. Upgrade or downgrade anytime.</p>
          
          {/* Billing Toggle - Cosmetic for now */}
          <div className="mt-10 inline-flex items-center p-1 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
             <button 
               onClick={() => setBillingCycle('monthly')}
               className={cn(
                 "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                 billingCycle === 'monthly' ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"
               )}
             >
               Monthly
             </button>
             <button 
               onClick={() => setBillingCycle('yearly')}
               className={cn(
                 "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                 billingCycle === 'yearly' ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"
               )}
             >
               Yearly <span className="text-[10px] bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">-20%</span>
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => (
            <div 
              key={tier.id}
              className={cn(
                "relative group flex flex-col p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border transition-all duration-500 hover:-translate-y-2",
                tier.highlighted 
                  ? "border-blue-500/50 shadow-2xl shadow-blue-500/10 scale-105 z-10" 
                  : "border-black/5 dark:border-white/10 hover:shadow-xl"
              )}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-widest">{tier.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-gray-900 dark:text-white">${tier.price}</span>
                  <span className="text-gray-400 text-sm font-medium">/mo</span>
                </div>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{tier.description}</p>
              </div>

              <div className="flex-1 space-y-4 mb-10">
                {tier.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-blue-500" />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-tight">{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => router.push('/auth/login')}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold transition-all duration-300 active:scale-95",
                  tier.highlighted
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/20"
                    : "bg-black dark:bg-white text-white dark:text-black hover:opacity-90"
                )}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Feature Comparison Link */}
        <div className="mt-20 text-center">
           <p className="text-gray-400 dark:text-gray-600 text-sm font-medium">
             Have a large team or school? <Link href="/contact" className="text-blue-500 hover:underline">Contact sales</Link> for custom pricing.
           </p>
        </div>
      </main>

      {/* FAQ Section */}
      <section className="py-24 bg-black/5 dark:bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6">
           <h2 className="text-3xl font-black text-center mb-16">Frequently Asked Questions</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time from your settings page." },
                { q: "What's the difference between Scholar and Master?", a: "Master includes Smart Text Extraction, PDF exports, and significantly more AI message capacity." },
                { q: "Do you offer student discounts?", a: "Our pricing is already optimized for students, but contact us if you have special circumstances." },
                { q: "Is my data secure?", a: "We use enterprise-grade encryption and never sell your learning data to third parties." }
              ].map((faq, i) => (
                <div key={i} className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10">
                   <h4 className="font-bold text-gray-900 dark:text-white mb-2">{faq.q}</h4>
                   <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{faq.a}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      <footer className="py-20 text-center border-t border-black/5 dark:border-white/5">
         <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">© 2024 brAIny AI. All rights reserved.</p>
      </footer>
    </div>
  )
}
