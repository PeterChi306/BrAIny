'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Crown, Zap, Shield, Star, Check, ArrowRight } from 'lucide-react'
import { BottomNavigation } from '@/components/BottomNavigation'

export default function PremiumPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'master'>('pro')
  const [isUpgrading, setIsUpgrading] = useState(false)

  const plans = {
    pro: {
      name: 'brAIny Plus',
      price: '$4.99',
      period: '/month',
      description: 'Unlimited AI and smarter progress',
      features: [
        'Unlimited AI questions',
        'AI memory (weakness tracking)',
        'Advanced explanations',
        'Smart streaks & goals',
        'Learning history',
        'More scans per day'
      ],
      icon: Zap,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600'
    },
    master: {
      name: 'brAIny Master',
      price: '$14.99',
      period: '/month',
      description: 'Everything in Plus, plus visuals and unlimited scan',
      features: [
        'Everything in Plus',
        'Visual explanations & diagrams',
        'Unlimited scan → editable PDFs',
        'Adaptive learning paths',
        'Priority AI response speed',
        'Export & advanced analytics'
      ],
      icon: Crown,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600'
    }
  }

  const handleUpgrade = async () => {
    setIsUpgrading(true)
    
    // In production, integrate with Stripe/RevenueCat
    setTimeout(() => {
      alert(`You've selected ${plans[selectedPlan].name}. In the full app, payment would complete here and your plan would activate.`)
      setIsUpgrading(false)
      router.push('/home')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 pb-24">
      <div className="px-4 py-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-6 shadow-lg">
            <Crown className="w-4 h-4" />
            PREMIUM UPGRADE
            <Crown className="w-4 h-4" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Unlock more learning
          </h1>
          <p className="text-xl text-secondary max-w-2xl mx-auto">
            Get unlimited AI questions, smarter progress tracking, and more scans. Choose the plan that fits you.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {Object.entries(plans).map(([key, plan]) => {
            const Icon = plan.icon
            const isSelected = selectedPlan === key
            
            return (
              <div
                key={key}
                onClick={() => setSelectedPlan(key as 'pro' | 'master')}
                className={`premium-card glassmorphism-card p-8 cursor-pointer transition-all duration-300 ${
                  isSelected ? 'ring-2 ring-primary glow-primary transform scale-105' : 'hover:transform hover:scale-102'
                }`}
              >
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-primary mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-primary">{plan.price}</span>
                    <span className="text-secondary">{plan.period}</span>
                  </div>
                  <p className="text-secondary mb-6">{plan.description}</p>
                  
                  <div className="space-y-3 text-left">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-success flex-shrink-0" />
                        <span className="text-secondary">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Upgrade Button */}
        <div className="text-center mb-12">
          <button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className={`bg-gradient-to-r ${plans[selectedPlan].gradient} text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto`}
          >
            {isUpgrading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Upgrade to {plans[selectedPlan].name}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          
          <p className="text-sm text-secondary mt-4">
            30-day money-back guarantee • Cancel anytime
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="premium-card glassmorphism-card p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">Lightning Fast</h3>
            <p className="text-secondary">Get instant responses to your questions</p>
          </div>
          
          <div className="premium-card glassmorphism-card p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">Secure & Private</h3>
            <p className="text-secondary">Your data is encrypted and protected</p>
          </div>
          
          <div className="premium-card glassmorphism-card p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">Expert Quality</h3>
            <p className="text-secondary">AI trained on educational best practices</p>
          </div>
        </div>

        {/* Testimonials */}
        <div className="premium-card glassmorphism-card p-8">
          <h2 className="text-2xl font-bold text-primary mb-6 text-center">What Students Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah K.",
                role: "High School Student",
                content: "The document scanning feature is a game-changer! I can upload my homework and get instant help.",
                rating: 5
              },
              {
                name: "Mike R.",
                role: "College Student",
                content: "Unlimited conversations mean I can study as much as I need. Worth every penny!",
                rating: 5
              },
              {
                name: "Emily L.",
                role: "Parent",
                content: "My daughter's grades improved significantly. The AI explains things better than her tutors.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="frosted-glass p-4 rounded-xl">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-500 fill-current" />
                  ))}
                </div>
                <p className="text-secondary mb-3">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-primary">{testimonial.name}</p>
                  <p className="text-sm text-secondary">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
