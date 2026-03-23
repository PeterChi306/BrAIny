'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { BottomNavigation } from '@/components/BottomNavigation'
import { useUserProfile } from '@/hooks/useUserProfile'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Bell,
  BookOpen,
  Target
} from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  date: Date
  time: string
  type: 'quiz' | 'practice' | 'deadline'
  description?: string
}

export default function PlannerPage() {
  const supabase = createSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const { displayName } = useUserProfile()

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', session.user.id)
          .order('scheduled_for', { ascending: true })

        if (error) throw error

        const mappedEvents: CalendarEvent[] = (data || []).map((reminder: any) => ({
          id: reminder.id,
          title: reminder.title,
          date: new Date(reminder.scheduled_for),
          time: new Date(reminder.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: reminder.reminder_type as any,
          description: reminder.message
        }))

        setEvents(mappedEvents)
      } catch (error) {
        console.error('Error fetching calendar events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [supabase])

  const handleAddEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const date = formData.get('date') as string
    const time = formData.get('time') as string
    const type = formData.get('type') as string

    if (!title || !date || !time) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const scheduledFor = new Date(`${date}T${time}`).toISOString()

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: session.user.id,
          title,
          message: `Scheduled ${type}`,
          reminder_type: type,
          scheduled_for: scheduledFor,
          is_sent: false
        })
        .select()
        .single()

      if (error) throw error

      const newEvent: CalendarEvent = {
        id: data.id,
        title: data.title,
        date: new Date(data.scheduled_for),
        time: new Date(data.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: data.reminder_type as any
      }

      setEvents(prev => [...prev, newEvent].sort((a, b) => a.date.getTime() - b.date.getTime()))
      setShowAddModal(false)
    } catch (error) {
      console.error('Error adding event:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 via-blue-950/30 to-indigo-950/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading planner...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 via-blue-950/30 to-indigo-950/50 pb-32">
      {/* Premium Header */}
      <div className="relative bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/30 dark:border-gray-800/30 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 dark:from-amber-200 dark:via-orange-200 dark:to-red-200 bg-clip-text text-transparent mb-1">
                  Planner
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  Plan study sessions & track progress
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="group relative flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white rounded-xl font-medium shadow-md hover:from-amber-600 hover:via-orange-600 hover:to-red-700 transition-all flex-shrink-0 transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
              <Plus className="w-5 h-5 relative z-10" />
              <span className="relative z-10 hidden sm:inline">Add event</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Month navigator */}
        <div className="relative group mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl opacity-75 group-hover:opacity-100 blur transition duration-300"></div>
          <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 transform transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {[
                { key: 'sun', label: 'S' },
                { key: 'mon', label: 'M' },
                { key: 'tue', label: 'T' },
                { key: 'wed', label: 'W' },
                { key: 'thu', label: 'T' },
                { key: 'fri', label: 'F' },
                { key: 'sat', label: 'S' }
              ].map((day) => (
                <div key={day.key} className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 py-2">
                  {day.label}
                </div>
              ))}
              {(() => {
                const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
                const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
                const startDate = new Date(firstDay)
                startDate.setDate(startDate.getDate() - firstDay.getDay())

                const days = []
                for (let i = 0; i < 42; i++) {
                  const date = new Date(startDate)
                  date.setDate(startDate.getDate() + i)
                  days.push(date)
                }

                return days.map((date, i) => {
                  const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
                  const isToday = date.toDateString() === new Date().toDateString()
                  const hasEvent = events.some(event => event.date.toDateString() === date.toDateString())

                  return (
                    <div
                      key={i}
                      className={`
                        aspect-square flex items-center justify-center rounded-lg text-xs sm:text-sm cursor-pointer transition-all
                        ${isCurrentMonth ? 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800' : 'text-gray-400'}
                        ${isToday ? 'bg-amber-500 text-white hover:bg-amber-600' : ''}
                        ${hasEvent && !isToday ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
                      `}
                    >
                      {date.getDate()}
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl opacity-75 group-hover:opacity-100 blur transition duration-300"></div>
            <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 transform transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Upcoming Events</h3>
                <CalendarIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                {events.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No upcoming events</p>
                ) : (
                  events.slice(0, 5).map((event) => (
                    <div key={event.id} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border border-blue-200 dark:border-blue-700/50 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mt-2 flex-shrink-0 shadow-sm"></div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{event.title}</h4>
                          <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                            {event.date.toLocaleDateString()} at {event.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Study Reminders */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl opacity-75 group-hover:opacity-100 blur transition duration-300"></div>
            <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 transform transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Study Reminders</h3>
                <Bell className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200/50 dark:border-green-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Daily Review</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">7:00 PM - 30 minutes</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Math Practice</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Tomorrow - 4:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-2xl animate-scale-up">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add New Event</h2>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  name="title"
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="e.g. History Test"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input
                    name="date"
                    type="date"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                  <input
                    name="time"
                    type="time"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select
                  name="type"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="quiz">Quiz</option>
                  <option value="practice">Practice</option>
                  <option value="deadline">Deadline</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-lg hover:shadow-blue-500/25 transition-all"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  )
}
