'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, MessageCircle, Mail, Phone, Book, HelpCircle, Send } from 'lucide-react'
import { BottomNavigation } from '@/components/BottomNavigation'

export default function SupportPage() {
  const router = useRouter()
  const [issue, setIssue] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate submission - in production, this would send to your support system
    setTimeout(() => {
      alert('Thank you for contacting support! We\'ll get back to you within 24 hours.')
      setIssue('')
      setDescription('')
      setIsSubmitting(false)
    }, 1500)
  }

  const supportOptions = [
    {
      icon: <Book className="w-6 h-6" />,
      title: "Help Center",
      description: "Browse our comprehensive guides and tutorials",
      action: () => alert('Help Center coming soon!')
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Live Chat",
      description: "Chat with our support team in real-time",
      action: () => alert('Live chat available 9AM-5PM EST')
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Support",
      description: "Send us a detailed message",
      action: () => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Phone Support",
      description: "Call us for immediate assistance",
      action: () => alert('Phone: 1-800-BRAINY (Mon-Fri 9AM-5PM EST)')
    }
  ]

  return (
    <div className="min-h-screen bg-screen-background pb-20">
      {/* Header */}
      <div className="bg-card-background border-b border-border-color">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/profile')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-black dark:text-white">Customer Support</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">We're here to help</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Quick Help Options */}
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white mb-6">How can we help you?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supportOptions.map((option, index) => (
              <Card key={index} className="p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={option.action}>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-black dark:text-white mb-2">{option.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{option.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div id="contact-form" className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-black dark:text-white">Send us a message</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                What type of issue are you experiencing?
              </label>
              <select
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-black dark:text-white"
                required
              >
                <option value="">Select an issue type</option>
                <option value="technical">Technical Issue</option>
                <option value="billing">Billing Question</option>
                <option value="account">Account Problem</option>
                <option value="feature">Feature Request</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Describe your issue in detail
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-black dark:text-white resize-none"
                placeholder="Please provide as much detail as possible..."
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
              glow
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Send Message
                </div>
              )}
            </Button>
          </form>
        </div>

        {/* FAQ Section */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-black dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-black dark:text-white mb-2">How do I reset my password?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Click on "Forgot Password" on the login page and follow the instructions sent to your email.</p>
            </div>
            <div>
              <h3 className="font-semibold text-black dark:text-white mb-2">Can I change my subscription plan?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Yes! You can upgrade or downgrade your plan anytime from the Profile &gt; Subscription section.</p>
            </div>
            <div>
              <h3 className="font-semibold text-black dark:text-white mb-2">Is my data secure?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Absolutely! We use industry-standard encryption and security measures to protect your data.</p>
            </div>
          </div>
        </Card>

        <div className="flex justify-center">
          <Button onClick={() => router.push('/profile')} variant="outline" className="px-8">
            Back to Profile
          </Button>
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  )
}
