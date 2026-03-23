'use client'

import React, { useState } from 'react'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'
import { ActionButton, ActionButtonComponent } from './AIResponseBase'
import { BookOpen, Sparkles, HelpCircle, TrendingUp, Target, Brain, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ProAIResponseProps {
  content: string
  buttons: ActionButton[]
  onAction: (action: string, data: any, messageContent: string) => Promise<void>
  userWeaknesses?: string[]
  nextSteps?: string[]
  confidence?: number
}

export function ProAIResponse({ 
  content, 
  buttons, 
  onAction, 
  userWeaknesses = [],
  nextSteps = [],
  confidence = 0.9 
}: ProAIResponseProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  return (
    <div className="bg-white dark:bg-gray-900 border-2 border-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl relative overflow-hidden">
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/30 to-pink-50/30 dark:from-blue-950/40 dark:via-purple-950/40 dark:to-pink-950/40 pointer-events-none" />
      
      {/* Animated border effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 blur-sm pointer-events-none" />
      
      <div className="relative p-6">
        {/* Premium header with confidence */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                Personal Study Companion
              </span>
              <div className="flex items-center gap-1 mt-1">
                <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {Math.round(confidence * 100)}% confident
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="space-y-6">
          <MarkdownRenderer 
            content={content}
            className="text-sm leading-relaxed text-gray-800 dark:text-gray-200"
          />
          
          {/* Why this matters section */}
          <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200/50 dark:border-blue-800/50">
            <button
              onClick={() => setExpandedSection(expandedSection === 'why' ? null : 'why')}
              className="flex items-center gap-2 w-full text-left"
            >
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Why this matters
              </span>
              <span className="text-xs text-blue-500">
                {expandedSection === 'why' ? '▼' : '▶'}
              </span>
            </button>
            {expandedSection === 'why' && (
              <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                Understanding this concept helps you build a strong foundation for advanced topics and improves problem-solving skills.
              </div>
            )}
          </div>

          {/* Common mistakes section */}
          {userWeaknesses.length > 0 && (
            <div className="bg-orange-50/50 dark:bg-orange-950/20 rounded-lg p-4 border border-orange-200/50 dark:border-orange-800/50">
              <button
                onClick={() => setExpandedSection(expandedSection === 'mistakes' ? null : 'mistakes')}
                className="flex items-center gap-2 w-full text-left"
              >
                <HelpCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  Common mistakes to avoid
                </span>
                <span className="text-xs text-orange-500">
                  {expandedSection === 'mistakes' ? '▼' : '▶'}
                </span>
              </button>
              {expandedSection === 'mistakes' && (
                <div className="mt-3 space-y-2">
                  {userWeaknesses.map((weakness, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-orange-500 mt-0.5">•</span>
                      <span>{weakness}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Next steps section */}
          {nextSteps.length > 0 && (
            <div className="bg-green-50/50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200/50 dark:border-green-800/50">
              <button
                onClick={() => setExpandedSection(expandedSection === 'next' ? null : 'next')}
                className="flex items-center gap-2 w-full text-left"
              >
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  Next recommended steps
                </span>
                <span className="text-xs text-green-500">
                  {expandedSection === 'next' ? '▼' : '▶'}
                </span>
              </button>
              {expandedSection === 'next' && (
                <div className="mt-3 space-y-2">
                  {nextSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Premium interactive actions */}
          {buttons.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  Personalized actions
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {buttons.map((button, idx) => (
                  <ActionButtonComponent
                    key={idx}
                    button={button}
                    messageContent={content}
                    onAction={onAction}
                  />
                ))}
                
                {/* Pro-specific inline actions */}
                <Button
                  onClick={() => onAction('flashcards', {}, content)}
                  variant="primary"
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                >
                  <BookOpen className="w-3 h-3 mr-1" />
                  Turn into flashcards
                </Button>
                
                <Button
                  onClick={() => onAction('practice', {}, content)}
                  variant="outline"
                  size="sm"
                  className="border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                >
                  <Target className="w-3 h-3 mr-1" />
                  Add to study plan
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
