'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Check, X, Edit2 } from 'lucide-react'

interface EditableMessageProps {
  content: string
  onSave: (newContent: string) => void
  isOwnMessage: boolean
  className?: string
}

export function EditableMessage({ content, onSave, isOwnMessage, className = '' }: EditableMessageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)

  const handleSave = () => {
    if (editedContent.trim() !== content) {
      onSave(editedContent.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedContent(content)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className={`space-y-2 ${className}`}>
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white"
          rows={3}
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <Button
            onClick={handleCancel}
            variant="ghost"
            size="sm"
            className="p-1 h-6"
          >
            <X className="w-3 h-3" />
          </Button>
          <Button
            onClick={handleSave}
            variant="ghost"
            size="sm"
            className="p-1 h-6 text-blue-600 hover:text-blue-700"
          >
            <Check className="w-3 h-3" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`group relative ${className}`}>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
      {isOwnMessage && (
        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-opacity"
        >
          <Edit2 className="w-3 h-3 text-gray-500" />
        </button>
      )}
    </div>
  )
}
