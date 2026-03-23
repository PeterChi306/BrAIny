'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Shield } from 'lucide-react'
import { BottomNavigation } from '@/components/BottomNavigation'

export default function PrivacyPage() {
  const router = useRouter()

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
              <h1 className="text-xl font-bold text-black dark:text-white">Privacy Policy</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last updated: January 2025</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Under Development</h2>
            </div>
            <p className="text-blue-700 dark:text-blue-300 mb-4">
              Our comprehensive privacy policy is being crafted to ensure complete transparency about how we handle your data.
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              We are committed to protecting your privacy and ensuring your personal information is handled securely.
            </p>
          </div>

          <h2>Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.</p>

          <h2>How We Use Your Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.</p>

          <h2>Information Sharing</h2>
          <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>

          <h2>Data Security</h2>
          <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

          <h2>Your Rights</h2>
          <p>You have the right to access, update, or delete your personal information. You may also opt out of certain communications from us.</p>

          <h2>Children's Privacy</h2>
          <p>Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13.</p>

          <h2>Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>

          <h2>Contact Us</h2>
          <p>If you have any questions about this privacy policy, please contact us at privacy@brainy.ai</p>
        </div>

        <div className="mt-8 flex justify-center">
          <Button onClick={() => router.push('/profile')} className="px-8">
            Back to Profile
          </Button>
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  )
}
