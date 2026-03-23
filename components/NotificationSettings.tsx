'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { useLocalNotifications } from '@/lib/local-notifications'
import { Bell, Clock, Calendar, Check, X, AlertCircle } from 'lucide-react'

export function NotificationSettings() {
  const {
    status,
    settings,
    requestPermission,
    updateSettings,
    getScheduledNotifications
  } = useLocalNotifications()

  const [isLoading, setIsLoading] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [tempTime, setTempTime] = useState(settings.studyReminderTime)
  const [scheduledNotifications, setScheduledNotifications] = useState<string[]>([])

  useEffect(() => {
    setScheduledNotifications(getScheduledNotifications())
  }, [settings, status.permission]) // Use stable dependencies

  const handlePermissionRequest = async () => {
    setIsLoading(true)
    try {
      const granted = await requestPermission()
      if (granted) {
        // Enable daily reminder by default when permission is granted
        updateSettings({ isStudyReminderEnabled: true })
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStudyReminderToggle = (enabled: boolean) => {
    updateSettings({ isStudyReminderEnabled: enabled })
  }

  const handleTimeChange = () => {
    updateSettings({ studyReminderTime: tempTime })
    setShowTimePicker(false)
  }

  const handleReminderOffsetChange = (offset: number) => {
    updateSettings({ eventReminderOffset: offset })
  }

  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getOffsetLabel = (offset: number) => {
    switch (offset) {
      case 1: return '1 day before'
      case 3: return '3 days before'
      default: return `${offset} days before`
    }
  }

  if (!status.supported) {
    return (
      <Card className="p-4 glass-strong">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Notifications Not Supported</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Your browser doesn't support desktop notifications. Try using a modern browser like Chrome, Firefox, or Safari.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Permission Status */}
      {status.permission === 'default' && (
        <Card className="p-4 glass-strong border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">Enable Notifications</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Get study reminders and event notifications to stay on track with your learning goals.
              </p>
              <button
                onClick={handlePermissionRequest}
                disabled={isLoading}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                {isLoading ? 'Requesting...' : 'Enable Notifications'}
              </button>
            </div>
          </div>
        </Card>
      )}

      {status.permission === 'denied' && (
        <Card className="p-4 glass-strong border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <X className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Notifications Blocked</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                You've blocked notifications. To enable them, go to your browser settings and allow notifications for this site.
              </p>
            </div>
          </div>
        </Card>
      )}

      {status.permission === 'granted' && (
        <>
          {/* Daily Study Reminder */}
          <Card className="p-4 glass-strong">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Daily Study Reminder</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get a daily reminder to study
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleStudyReminderToggle(!settings.isStudyReminderEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.isStudyReminderEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.isStudyReminderEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.isStudyReminderEnabled && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Reminder Time</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Current: {formatTimeDisplay(settings.studyReminderTime)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTimePicker(!showTimePicker)}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Change
                  </button>
                </div>

                {showTimePicker && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <input
                        type="time"
                        value={tempTime}
                        onChange={(e) => setTempTime(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleTimeChange}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setShowTimePicker(false)
                          setTempTime(settings.studyReminderTime)
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Event Reminder Settings */}
          <Card className="p-4 glass-strong">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-purple-500" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Event Reminders</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified before calendar events
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Default Reminder Time</p>
              <div className="grid grid-cols-3 gap-2">
                {[1, 3, 7].map(offset => (
                  <button
                    key={offset}
                    onClick={() => handleReminderOffsetChange(offset)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      settings.eventReminderOffset === offset
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {getOffsetLabel(offset)}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Status Info */}
          {scheduledNotifications.length > 0 && (
            <Card className="p-4 glass-strong">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-green-500" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Active Notifications</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {scheduledNotifications.length} notification{scheduledNotifications.length !== 1 ? 's' : ''} scheduled
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
