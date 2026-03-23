'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { useLocalNotifications } from '@/lib/local-notifications'
import { Bell, Clock, Calendar, TestTube } from 'lucide-react'

export function NotificationTest() {
  const { status, requestPermission, scheduleEventReminder, getScheduledNotifications } = useLocalNotifications()
  const [testResults, setTestResults] = useState<string[]>([])

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testPermission = async () => {
    addTestResult('Testing permission request...')
    try {
      const granted = await requestPermission()
      addTestResult(`Permission ${granted ? 'GRANTED' : 'DENIED'}`)
    } catch (error) {
      addTestResult(`Error: ${error}`)
    }
  }

  const testDailyReminder = () => {
    addTestResult('Testing daily reminder scheduling...')
    // This would be tested by changing settings in the UI
    addTestResult('Daily reminder can be tested in Settings > Notifications')
  }

  const testEventReminder = async () => {
    addTestResult('Testing event reminder...')
    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(18, 0, 0, 0) // 6 PM tomorrow

      const notificationId = scheduleEventReminder({
        id: 'test-event-' + Date.now(),
        title: 'Test Event',
        date: tomorrow.toISOString(),
        reminderOffset: 1
      })
      
      addTestResult(`Event reminder scheduled with ID: ${notificationId}`)
    } catch (error) {
      addTestResult(`Error scheduling event: ${error}`)
    }
  }

  const checkScheduledNotifications = () => {
    const scheduled = getScheduledNotifications()
    addTestResult(`Currently scheduled: ${scheduled.length} notifications`)
    scheduled.forEach(id => addTestResult(`- ${id}`))
  }

  return (
    <Card className="p-6 glass-strong">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <TestTube className="w-5 h-5" />
        Notification System Tests
      </h3>

      <div className="space-y-4">
        {/* Status */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Current Status</h4>
          <div className="space-y-1 text-sm">
            <p>Supported: {status.supported ? '✅ Yes' : '❌ No'}</p>
            <p>Permission: {status.permission}</p>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={testPermission}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Bell className="w-4 h-4" />
            Test Permission Request
          </button>

          <button
            onClick={testDailyReminder}
            className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Clock className="w-4 h-4" />
            Test Daily Reminder
          </button>

          <button
            onClick={testEventReminder}
            className="flex items-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Test Event Reminder
          </button>

          <button
            onClick={checkScheduledNotifications}
            className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <TestTube className="w-4 h-4" />
            Check Scheduled
          </button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Test Results</h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {testResults.map((result, index) => (
                <p key={index} className="text-sm font-mono text-gray-700 dark:text-gray-300">
                  {result}
                </p>
              ))}
            </div>
            <button
              onClick={() => setTestResults([])}
              className="mt-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear Results
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}
