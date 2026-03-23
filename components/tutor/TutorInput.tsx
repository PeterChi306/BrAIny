'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Send, Upload, Mic, Sparkles, Loader2, FileText, Image, ArrowRight, Zap } from 'lucide-react'
import { getTokenUsage } from '@/lib/tokens'
import { useUserTier } from '@/contexts/UserTierContext'
import { createSupabaseClient } from '@/lib/supabase/client'

interface TutorInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  loading?: boolean
  placeholder?: string
  onFileUpload?: (files: File[]) => void
  onRemoveFile?: (index: number) => void
  queuedFiles?: File[]
  onVoiceInput?: () => void
  messageUsed?: number
  messageLimit?: number
  className?: string
}

export function TutorInput({
  value,
  onChange,
  onSend,
  loading = false,
  placeholder,
  onFileUpload,
  onRemoveFile,
  queuedFiles = [],
  onVoiceInput,
  messageUsed = 0,
  messageLimit = 15,
  className
}: TutorInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { userTier } = useUserTier()
  const supabase = createSupabaseClient()

  // Message reset and limit checks are handled by the parent TutorPage
  const hasUnlimited = messageLimit === Infinity || messageLimit > 1000000

  // Fixed placeholder as requested
  const currentPlaceholder = "Ask or learn something new"

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload?.(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileUpload?.(Array.from(files))
    }
    e.target.value = '' // reset so same file can be selected again
  }

  const handleVoiceToggle = () => {
    if (!isRecording) {
      setIsRecording(true)
      onVoiceInput?.()
      // Simulate recording for demo
      setTimeout(() => setIsRecording(false), 3000)
    } else {
      setIsRecording(false)
    }
  }

  return (
    <div className={cn(
      'relative z-30',
      className
    )}>
      <div className="px-6 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto">
          {/* Drag overlay */}
          {dragActive && (
            <div className="absolute inset-0 bg-primary-light border-2 border-dashed border-primary rounded-xl flex items-center justify-center z-10 glow-primary">
              <div className="text-center">
                <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-primary font-medium">Drop files here</p>
              </div>
            </div>
          )}

          {/* Input container */}
          <div className={cn(
            'relative bg-[#f4f4f4] dark:bg-[#303030] rounded-3xl overflow-hidden transition-shadow duration-300 border border-transparent focus-within:ring-2 focus-within:ring-black/5 focus-within:dark:ring-white/5',
          )}>
            <div className="relative flex items-end min-h-[56px] px-2 py-2">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                placeholder={placeholder || currentPlaceholder}
                disabled={loading}
                className="w-full pl-4 pr-24 py-3 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-0 min-h-[48px] max-h-48 border-0 text-base leading-relaxed caret-gray-900 dark:caret-white"
                rows={1}
              />

              {/* Action buttons */}
              <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
                {/* File upload */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  disabled={loading}
                >
                  <Upload className="w-5 h-5" />
                </button>

                {/* Send button */}
                <button
                  type="button"
                  onClick={onSend}
                  disabled={(!value.trim() && queuedFiles.length === 0) || loading}
                  className={cn(
                    'p-2 rounded-xl transition-all duration-200 flex items-center justify-center',
                    (value.trim() || queuedFiles.length > 0) && !loading
                      ? 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95'
                      : 'bg-black/5 dark:bg-white/5 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  )}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Minimal Status Area - Cleaner spacing below the input */}
          {!hasUnlimited && (
            <div className="mt-3 flex items-center justify-between px-2 opacity-60 hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-[11px] font-bold tracking-tight select-none",
                  messageUsed >= messageLimit ? "text-red-500" : "text-gray-500 dark:text-gray-400"
                )}>
                  {messageUsed} / {messageLimit} messages
                </span>
                
                {userTier === 'starter' && messageUsed >= 1 && (
                  <button 
                    onClick={() => router.push('/subscription')}
                    className="text-[11px] font-semibold text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-1 group"
                  >
                    • <span className="underline decoration-blue-500/30 underline-offset-4 group-hover:decoration-blue-500">Upgrade for unlimited</span>
                  </button>
                )}
              </div>
              
              <div className="h-[3px] w-20 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-700 ease-out",
                    messageUsed >= messageLimit ? "bg-red-500" : "bg-blue-500"
                  )}
                  style={{ width: `${Math.min(100, (messageUsed / messageLimit) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
    </div>
  )
}
