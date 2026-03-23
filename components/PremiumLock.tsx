'use client'

import { Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { PremiumBadge } from './PremiumBadge'

interface PremiumLockProps {
  feature: string
  description?: string
  onUpgrade?: () => void
  className?: string
}

export function PremiumLock({ feature, description, onUpgrade, className }: PremiumLockProps) {
  const router = useRouter()

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade()
    } else {
      router.push('/subscription')
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="blur-sm opacity-50 pointer-events-none">
        {/* Content will be blurred by parent */}
      </div>
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 border-2 border-primary-200 shadow-xl max-w-sm mx-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary-600" />
            </div>
            <PremiumBadge className="mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature}</h3>
            {description && (
              <p className="text-sm text-gray-600 mb-4">{description}</p>
            )}
            <Button onClick={handleUpgrade} className="w-full" glow>
              Unlock with Premium
            </Button>
            <p className="text-xs text-gray-500 mt-3">
              Upgrade to access unlimited features
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

