'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'

export interface ActionButton {
  id: string
  label: string
  action: 'practice' | 'quiz' | 'flashcards' | 'explain_simple' | 'real_world_example'
  data?: any
}

interface ActionButtonComponentProps {
  button: ActionButton
  messageContent: string
  onAction: (action: string, data: any, messageContent: string) => Promise<void>
}

export function ActionButtonComponent({ button, messageContent, onAction }: ActionButtonComponentProps) {
  return (
    <Button
      onClick={() => onAction(button.action, button.data, messageContent)}
      variant="outline"
      size="sm"
      className="text-xs h-8"
    >
      {button.label}
    </Button>
  )
}
