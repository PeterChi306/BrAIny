'use client'

import React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/Button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'System' }
  ]

  // Simple toggle for now - cycles through themes
  const handleToggle = () => {
    const currentIndex = themes.findIndex(t => t.value === theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex].value)
  }

  return (
    <Button
      onClick={handleToggle}
      variant="outline"
      size="sm"
      className="flex items-center justify-center p-3 rounded-xl transition-all duration-300 hover:scale-105 hover:glow-hover theme-toggle-button border-2 border-blue-500"
      title={`Current theme: ${theme}. Click to change.`}
    >
      {theme === 'dark' ? (
        <Moon className="w-5 h-5 text-blue-400" />
      ) : theme === 'light' ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Monitor className="w-5 h-5 text-gray-500" />
      )}
    </Button>
  )
}