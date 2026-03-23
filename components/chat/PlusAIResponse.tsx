'use client'

import React from 'react'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'
import { ActionButton, ActionButtonComponent } from './AIResponseBase'
import { BookOpen, Sparkles, HelpCircle } from 'lucide-react'

interface PlusAIResponseProps {
  content: string
  buttons: ActionButton[]
  onAction: (action: string, data: any, messageContent: string) => Promise<void>
}

export function PlusAIResponse({ content, buttons, onAction }: PlusAIResponseProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border-2 border-blue-200 dark:border-blue-800 rounded-2xl shadow-lg relative overflow-hidden">
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 pointer-events-none" />
      
      <div className="relative p-5">
        {/* Enhanced header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Enhanced Tutor</span>
        </div>

        {/* Structured content */}
        <div className="space-y-4">
          <MarkdownRenderer 
            content={content}
            className="text-sm leading-relaxed text-gray-800 dark:text-gray-200"
          />
          
          {/* Interactive elements */}
          {buttons.length > 0 && (
            <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Try these:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {buttons.map((button, idx) => (
                  <ActionButtonComponent
                    key={idx}
                    button={button}
                    messageContent={content}
                    onAction={onAction}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
