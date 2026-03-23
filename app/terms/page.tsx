'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, FileText } from 'lucide-react'
import { BottomNavigation } from '@/components/BottomNavigation'

export default function TermsPage() {
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
              <h1 className="text-xl font-bold text-black dark:text-white">Terms of Service</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last updated: January 2025</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">Under Construction</h2>
            </div>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              This page is currently being developed. Our legal team is working on comprehensive terms of service that will protect both our users and our platform.
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              In the meantime, please use our platform responsibly and in accordance with applicable laws and regulations.
            </p>
          </div>

          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using brAIny, you accept and agree to be bound by the terms and provision of this agreement.</p>

          <h2>2. Use License</h2>
          <p>Permission is granted to temporarily download one copy of the materials on brAIny for personal, non-commercial transitory viewing only.</p>

          <h2>3. Disclaimer</h2>
          <p>The materials on brAIny are provided on an 'as is' basis. brAIny makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties.</p>

          <h2>4. Limitations</h2>
          <p>In no event shall brAIny or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on brAIny.</p>

          <h2>5. Revisions and Errata</h2>
          <p>The materials appearing on brAIny could include technical, typographical, or photographic errors. brAIny does not promise that any of the materials on its website are accurate, complete, or current.</p>

          <h2>6. Governing Law</h2>
          <p>These terms and conditions are governed by and construed in accordance with the laws of your jurisdiction and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.</p>
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
