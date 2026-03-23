'use client'

import React from 'react'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'
import { ActionButton, ActionButtonComponent } from './AIResponseBase'

interface FreeAIResponseProps {
  content: string
  buttons: ActionButton[]
  onAction: (action: string, data: any, messageContent: string) => Promise<void>
}

export function FreeAIResponse({ content, buttons, onAction }: FreeAIResponseProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
      <div className="p-4">
        {/* Basic message rendering */}
        <MarkdownRenderer 
          content={content}
          className="text-sm leading-relaxed text-gray-800 dark:text-gray-200"
        />
        
        {/* Basic action buttons */}
        {buttons.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-wrap gap-2">
              {buttons.slice(0, 2).map((button, idx) => (
                <ActionButtonComponent
                  key={idx}
                  button={button}
                  messageContent={content}
                  onAction={onAction}
                />
              ))}
              {buttons.length > 2 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 self-center">
                  +{buttons.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
