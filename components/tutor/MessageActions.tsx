'use client'

import { useState } from 'react'
import { Copy, Edit, RotateCcw, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface MessageActionsProps {
  content: string
  isUser?: boolean
  onEdit?: (newContent: string) => void
  className?: string
}

export function MessageActions({ 
  content, 
  isUser = false, 
  onEdit, 
  className 
}: MessageActionsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditedContent(content)
  }

  const handleSave = () => {
    if (onEdit && editedContent.trim() !== content.trim()) {
      onEdit(editedContent)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedContent(content)
    setIsEditing(false)
  }

  const handleResend = () => {
    if (onEdit && editedContent.trim()) {
      onEdit(editedContent)
    }
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className={`space-y-3 ${className}`}>
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          autoFocus
        />
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            size="sm"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4" />
            Save
          </Button>
          {isUser && (
            <Button
              onClick={handleResend}
              size="sm"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <RotateCcw className="w-4 h-4" />
              Resend
            </Button>
          )}
          <Button
            onClick={handleCancel}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${className}`}>
      <Button
        onClick={handleCopy}
        size="sm"
        variant="ghost"
        className="flex items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 h-7 min-w-0"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3" />
            <span className="text-xs">Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
          </>
        )}
      </Button>
      
      {isUser && (
        <Button
          onClick={handleEdit}
          size="sm"
          variant="ghost"
          className="flex items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 h-7 min-w-0"
        >
          <Edit className="w-3 h-3" />
        </Button>
      )}
    </div>
  )
}
