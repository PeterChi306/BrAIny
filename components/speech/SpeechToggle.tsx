'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { SpeechSettings } from '@/types/learning-plans'
import { Volume2, VolumeX, Settings } from 'lucide-react'

interface SpeechToggleProps {
  onSpeak?: (text: string) => Promise<void>
  className?: string
}

export default function SpeechToggle({ onSpeak, className = '' }: SpeechToggleProps) {
  const [settings, setSettings] = useState<SpeechSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/speech')
      const { settings } = await response.json()
      setSettings(settings)
    } catch (error) {
      console.error('Error fetching speech settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (updates: Partial<SpeechSettings>) => {
    if (!settings) return

    try {
      const response = await fetch('/api/speech', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        const { settings: updatedSettings } = await response.json()
        setSettings(updatedSettings)
      }
    } catch (error) {
      console.error('Error updating speech settings:', error)
    }
  }

  const toggleSpeech = async () => {
    if (!settings) return

    const newEnabled = !settings.enabled
    await updateSettings({ enabled: newEnabled })
  }

  const getRemainingMinutes = () => {
    if (!settings) return 0
    return Math.max(0, settings.daily_limit_minutes - settings.used_minutes_today)
  }

  const getUsagePercentage = () => {
    if (!settings) return 0
    return Math.min(100, (settings.used_minutes_today / settings.daily_limit_minutes) * 100)
  }

  const getUsageColor = () => {
    const percentage = getUsagePercentage()
    if (percentage > 80) return 'text-red-600'
    if (percentage > 60) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded-lg p-2 ${className}`}>
        <div className="w-5 h-5 bg-gray-300 rounded"></div>
      </div>
    )
  }

  if (!settings) {
    return null
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main Toggle Button */}
      <button
        onClick={toggleSpeech}
        className={`p-2 rounded-lg transition-colors ${
          settings.enabled 
            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title={settings.enabled ? 'Disable Speech' : 'Enable Speech'}
      >
        {settings.enabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </button>

      {/* Usage Indicator */}
      {settings.enabled && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Speech Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Enable Speech Tutor</label>
                <button
                  onClick={() => updateSettings({ enabled: !settings.enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Voice Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Voice Type</label>
                <select
                  value={settings.voice_type}
                  onChange={(e) => updateSettings({ voice_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="neutral">Neutral</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              {/* Speech Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Speech Rate: {settings.speech_rate.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.speech_rate}
                  onChange={(e) => updateSettings({ speech_rate: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Volume */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volume: {Math.round(settings.volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={settings.volume}
                  onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Auto-Speak Options */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Auto-Speak</label>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Explanations</span>
                  <button
                    onClick={() => updateSettings({ auto_speak_explanations: !settings.auto_speak_explanations })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      settings.auto_speak_explanations ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        settings.auto_speak_explanations ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Feedback</span>
                  <button
                    onClick={() => updateSettings({ auto_speak_feedback: !settings.auto_speak_feedback })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      settings.auto_speak_feedback ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        settings.auto_speak_feedback ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pause During Input</span>
                  <button
                    onClick={() => updateSettings({ pause_during_input: !settings.pause_during_input })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      settings.pause_during_input ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        settings.pause_during_input ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Usage Stats */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Daily Usage</h3>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Used</span>
                    <span className={`font-medium ${getUsageColor()}`}>
                      {settings.used_minutes_today} / {settings.daily_limit_minutes} min
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        getUsagePercentage() > 80 ? 'bg-red-500' : 
                        getUsagePercentage() > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${getUsagePercentage()}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  Remaining: <span className={`font-medium ${getUsageColor()}`}>
                    {getRemainingMinutes()} minutes
                  </span>
                </div>
              </div>

              {/* Test Speech */}
              <div>
                <button
                  onClick={() => onSpeak?.('This is a test of the speech tutor. How does it sound?')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Test Speech
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Button */}
      <button
        onClick={() => setShowSettings(true)}
        className="absolute -top-1 -right-1 p-1 bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-shadow"
        title="Speech Settings"
      >
        <Settings className="w-3 h-3 text-gray-600" />
      </button>
    </div>
  )
}
