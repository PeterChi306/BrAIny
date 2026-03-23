'use client'

import React from 'react'
import { useUserTier } from '@/contexts/UserTierContext'
import { FreeAIResponse } from './FreeAIResponse'
import { PlusAIResponse } from './PlusAIResponse'
import { ProAIResponse } from './ProAIResponse'
import { ActionButton } from './AIResponseBase'

interface TieredAIResponseProps {
  content: string
  buttons: ActionButton[]
  onAction: (action: string, data: any, messageContent: string) => Promise<void>
  userWeaknesses?: string[]
  nextSteps?: string[]
  confidence?: number
}

export function TieredAIResponse({ 
  content, 
  buttons, 
  onAction, 
  userWeaknesses,
  nextSteps,
  confidence 
}: TieredAIResponseProps) {
  const { userTier, isLoading } = useUserTier()

  if (isLoading) {
    // Show loading state
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  switch (userTier) {
    case 'free':
      return (
        <FreeAIResponse 
          content={content}
          buttons={buttons}
          onAction={onAction}
        />
      )
    
    case 'pro':
      return (
        <ProAIResponse 
          content={content}
          buttons={buttons}
          onAction={onAction}
          userWeaknesses={userWeaknesses}
          nextSteps={nextSteps}
          confidence={confidence}
        />
      )
    
    case 'master':
      // Master tier gets same as Pro but with enhanced features
      return (
        <ProAIResponse 
          content={content}
          buttons={buttons}
          onAction={onAction}
          userWeaknesses={userWeaknesses}
          nextSteps={nextSteps}
          confidence={Math.min((confidence || 0.9) + 0.1, 1.0)} // Slightly higher confidence
        />
      )
    
    default:
      return (
        <FreeAIResponse 
          content={content}
          buttons={buttons}
          onAction={onAction}
        />
      )
  }
}
