'use client'

import { cn } from '@/lib/utils'
import { Sparkles, Brain } from 'lucide-react'
import { PremiumBackground, GlowingName } from '@/components/ui/PremiumUI'

interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
  className?: string
  minimal?: boolean
}

export function LoadingScreen({
  message = "Loading",
  fullScreen = true,
  className,
  minimal = false
}: LoadingScreenProps) {
  const isMinimal = minimal || !fullScreen;

  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 text-center",
      className
    )}>
      {isMinimal ? (
        <div className="space-y-4 relative z-10 w-full flex flex-col items-center">
          <p className="text-xl font-medium text-gray-800 dark:text-gray-200">
            {message}
          </p>
          <div className="flex justify-center gap-1.5 mt-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 w-full flex flex-col items-center">
          <div className="space-y-6 flex flex-col items-center">
            <div className="space-y-6">
              <p className="text-2xl font-semibold text-blue-600/90 dark:text-blue-400/90 tracking-wide">
                {message}
              </p>
              
              <div className="flex justify-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce shadow-lg shadow-blue-500/20" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce shadow-lg shadow-purple-500/20" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce shadow-lg shadow-pink-500/20" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (!fullScreen) return content

  return (
    <PremiumBackground className="fixed inset-0 z-[100] overflow-hidden">
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen animate-fade-in mx-auto w-full">
        {content}
      </div>
    </PremiumBackground>
  )
}
