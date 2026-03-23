import { createSupabaseClient } from './supabase/client'
import { useState, useEffect } from 'react'

export interface Deadline {
  id?: string
  user_id: string
  title: string
  description?: string
  deadline_date: string
  subject?: string
  subject_id?: string
  importance: 'low' | 'medium' | 'high'
  is_completed: boolean
  is_archived?: boolean // Made optional since database doesn't have this column
  ai_instructions?: string
  reminder_sent?: boolean // Made optional since database doesn't have this column
  reminder_time?: string
  created_at?: string
  updated_at?: string
}

export interface CalendarDay {
  date: Date
  deadlines: Deadline[]
  isToday: boolean
  isPast: boolean
  hasDeadlines: boolean
}

class DeadlineCalendar {
  private supabase = createSupabaseClient()

  // Create a new deadline
  async createDeadline(userId: string, deadline: Omit<Deadline, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    try {
      // Prepare deadline data, handling optional fields gracefully
      const deadlineData: any = {
        user_id: userId,
        title: deadline.title,
        deadline_date: deadline.deadline_date,
        importance: deadline.importance || 'medium',
        is_completed: deadline.is_completed || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Only include optional fields that exist in database schema
      if (deadline.description) deadlineData.description = deadline.description
      if (deadline.subject) deadlineData.subject = deadline.subject
      if (deadline.subject_id) deadlineData.subject_id = deadline.subject_id
      if (deadline.ai_instructions) deadlineData.ai_instructions = deadline.ai_instructions
      if (deadline.reminder_time) deadlineData.reminder_time = deadline.reminder_time
      if (deadline.reminder_sent !== undefined) deadlineData.reminder_sent = deadline.reminder_sent

      const { data, error } = await this.supabase
        .from('user_deadlines')
        .insert(deadlineData)
        .select()
        .single()

      if (error) {
        // If error is about missing columns, try with minimal fields
        if (error.code === 'PGRST204') {
          console.warn('Some columns not available, creating deadline with minimal fields')
          const minimalData: any = {
            user_id: userId,
            title: deadline.title,
            deadline_date: deadline.deadline_date,
            importance: deadline.importance || 'medium',
            is_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          // Add only the most essential optional fields
          if (deadline.description) minimalData.description = deadline.description
          if (deadline.subject) minimalData.subject = deadline.subject
          
          const { data: fallbackResult, error: fallbackError } = await this.supabase
            .from('user_deadlines')
            .insert(minimalData)
            .select()
            .single()
            
          if (fallbackError) throw fallbackError
          return fallbackResult
        }
        throw error
      }
      return data
    } catch (error) {
      console.error('Error creating deadline:', error)
      return null
    }
  }

  // Get all deadlines for a user
  async getDeadlines(userId: string, includeCompleted: boolean = false) {
    try {
      let query = this.supabase
        .from('user_deadlines')
        .select('*')
        .eq('user_id', userId)
        .order('deadline_date', { ascending: true })

      if (!includeCompleted) {
        query = query.eq('is_completed', false)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting deadlines:', error)
      return []
    }
  }

  // Get deadlines for a specific month
  async getMonthDeadlines(userId: string, year: number, month: number) {
    try {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59, 999) // End of last day

      const { data, error } = await this.supabase
        .from('user_deadlines')
        .select('*')
        .eq('user_id', userId)
        .gte('deadline_date', startDate.toISOString())
        .lte('deadline_date', endDate.toISOString())
        .order('deadline_date', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting month deadlines:', error)
      return []
    }
  }

  // Update a deadline
  async updateDeadline(deadlineId: string, updates: Partial<Deadline>) {
    try {
      const { data, error } = await this.supabase
        .from('user_deadlines')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', deadlineId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating deadline:', error)
      return null
    }
  }

  // Mark deadline as completed
  async markCompleted(deadlineId: string) {
    return await this.updateDeadline(deadlineId, { is_completed: true })
  }

  // Delete a deadline
  async deleteDeadline(deadlineId: string) {
    try {
      const { error } = await this.supabase
        .from('user_deadlines')
        .delete()
        .eq('id', deadlineId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting deadline:', error)
      return false
    }
  }

  // Get calendar data for a month
  async getCalendarMonth(userId: string, year: number, month: number): Promise<CalendarDay[]> {
    try {
      const deadlines = await this.getMonthDeadlines(userId, year, month)
      const calendarDays: CalendarDay[] = []

      const firstDay = new Date(year, month - 1, 1)
      const lastDay = new Date(year, month, 0)
      const today = new Date()

      // Create calendar days for the entire month
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const currentDate = new Date(year, month - 1, day)
        const dayDeadlines = deadlines.filter(deadline => {
          const deadlineDate = new Date(deadline.deadline_date)
          return deadlineDate.toDateString() === currentDate.toDateString()
        })

        calendarDays.push({
          date: currentDate,
          deadlines: dayDeadlines,
          isToday: currentDate.toDateString() === today.toDateString(),
          isPast: currentDate < today && !this.isSameDay(currentDate, today),
          hasDeadlines: dayDeadlines.length > 0
        })
      }

      return calendarDays
    } catch (error) {
      console.error('Error getting calendar month:', error)
      return []
    }
  }

  // Get upcoming deadlines (next 7 days)
  async getUpcomingDeadlines(userId: string, days: number = 7) {
    try {
      const now = new Date()
      const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

      const { data, error } = await this.supabase
        .from('user_deadlines')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', false)
        .gte('deadline_date', now.toISOString())
        .lte('deadline_date', endDate.toISOString())
        .order('deadline_date', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting upcoming deadlines:', error)
      return []
    }
  }

  // Get overdue deadlines
  async getOverdueDeadlines(userId: string) {
    try {
      const now = new Date()

      const { data, error } = await this.supabase
        .from('user_deadlines')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', false)
        .lt('deadline_date', now.toISOString())
        .order('deadline_date', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting overdue deadlines:', error)
      return []
    }
  }

  // Get deadline statistics
  async getDeadlineStats(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('user_deadlines')
        .select('importance, is_completed, deadline_date')
        .eq('user_id', userId)

      if (error) throw error

      if (!data || data.length === 0) {
        return {
          total: 0,
          completed: 0,
          upcoming: 0,
          overdue: 0,
          byImportance: { low: 0, medium: 0, high: 0 }
        }
      }

      const now = new Date()
      const stats = data.reduce((acc: any, deadline) => {
        acc.total += 1
        
        if (deadline.is_completed) {
          acc.completed += 1
        } else if (new Date(deadline.deadline_date) < now) {
          acc.overdue += 1
        } else {
          acc.upcoming += 1
        }
        
        acc.byImportance[deadline.importance] += 1
        
        return acc
      }, { 
        total: 0, 
        completed: 0, 
        upcoming: 0, 
        overdue: 0, 
        byImportance: { low: 0, medium: 0, high: 0 } 
      })

      return stats
    } catch (error) {
      console.error('Error getting deadline stats:', error)
      return {
        total: 0,
        completed: 0,
        upcoming: 0,
        overdue: 0,
        byImportance: { low: 0, medium: 0, high: 0 }
      }
    }
  }

  // Get study recommendations based on deadlines
  async getStudyRecommendations(userId: string) {
    try {
      const upcoming = await this.getUpcomingDeadlines(userId, 14)
      const recommendations = []

      for (const deadline of upcoming) {
        const daysUntil = Math.ceil((new Date(deadline.deadline_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        
        if (daysUntil <= 7) {
          recommendations.push({
            type: 'deadline',
            title: deadline.title,
            subject: deadline.subject,
            urgency: daysUntil <= 3 ? 'high' : daysUntil <= 5 ? 'medium' : 'low',
            daysUntil,
            recommendation: this.generateStudyRecommendation(deadline, daysUntil)
          })
        }
      }

      return recommendations.sort((a, b) => a.daysUntil - b.daysUntil)
    } catch (error) {
      console.error('Error getting study recommendations:', error)
      return []
    }
  }

  // Generate study recommendation based on deadline
  private generateStudyRecommendation(deadline: Deadline, daysUntil: number): string {
    const subject = deadline.subject || 'this topic'
    
    if (daysUntil <= 1) {
      return `Final review day for ${subject}. Focus on key concepts and practice problems.`
    } else if (daysUntil <= 3) {
      return `Intensive study period for ${subject}. Dedicate 1-2 hours daily.`
    } else if (daysUntil <= 7) {
      return `Start preparing for ${subject}. Begin with foundational concepts.`
    } else {
      return `Plan your study schedule for ${subject}. Break down topics into manageable chunks.`
    }
  }

  // Check if two dates are the same day
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }

  // Get color for deadline importance
  getImportanceColor(importance: 'low' | 'medium' | 'high'): string {
    switch (importance) {
      case 'high':
        return 'red'
      case 'medium':
        return 'yellow'
      case 'low':
        return 'green'
      default:
        return 'gray'
    }
  }

  // Format deadline date
  formatDeadlineDate(dateString: string): string {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    
    if (this.isSameDay(date, today)) {
      return 'Today'
    } else if (this.isSameDay(date, tomorrow)) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  // Get days until deadline
  getDaysUntil(deadlineDate: string): number {
    const deadline = new Date(deadlineDate)
    const now = new Date()
    const diffTime = deadline.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Archive completed events
  async archiveEvent(deadlineId: string) {
    try {
      const { data, error } = await this.supabase
        .from('user_deadlines')
        .update({
          is_completed: true, // Mark as completed instead of archived since column doesn't exist
          updated_at: new Date().toISOString()
        })
        .eq('id', deadlineId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error archiving event:', error)
      return null
    }
  }

  // Send study reminder
  async sendStudyReminder(deadlineId: string) {
    try {
      const { data: deadline, error } = await this.supabase
        .from('user_deadlines')
        .select('*')
        .eq('id', deadlineId)
        .single()

      if (error || !deadline) throw error

      // Mark reminder as sent (only if column exists)
      try {
        await this.supabase
          .from('user_deadlines')
          .update({
            reminder_sent: true,
            reminder_time: new Date().toISOString()
          })
          .eq('id', deadlineId)
      } catch (updateError) {
        // If column doesn't exist, just continue without marking
        console.warn('reminder_sent column not available, continuing without marking')
      }

      // Here you would integrate with your notification service
      // For now, we'll just return the deadline info
      return {
        message: `Study reminder sent for: ${deadline.title}`,
        deadline
      }
    } catch (error) {
      console.error('Error sending study reminder:', error)
      return null
    }
  }

  // Get archived events
  async getArchivedEvents(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('user_deadlines')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', true) // Use completed instead of archived
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting archived events:', error)
      return []
    }
  }

  // Get events that need reminders
  async getEventsNeedingReminders(userId: string) {
    try {
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      
      const { data, error } = await this.supabase
        .from('user_deadlines')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', false)
        .lte('deadline_date', tomorrow.toISOString())
        .gte('deadline_date', now.toISOString())

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting events needing reminders:', error)
      return []
    }
  }
}

export const deadlineCalendar = new DeadlineCalendar()

// React hook for deadline calendar
export const useDeadlineCalendar = (userId: string) => {
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Deadline[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allDeadlines, upcoming, deadlineStats] = await Promise.all([
          deadlineCalendar.getDeadlines(userId),
          deadlineCalendar.getUpcomingDeadlines(userId),
          deadlineCalendar.getDeadlineStats(userId)
        ])

        setDeadlines(allDeadlines)
        setUpcomingDeadlines(upcoming)
        setStats(deadlineStats)
      } catch (error) {
        console.error('Error loading deadline data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      loadData()
    }
  }, [userId])

  return {
    deadlines,
    upcomingDeadlines,
    stats,
    loading,
    createDeadline: deadlineCalendar.createDeadline.bind(deadlineCalendar),
    updateDeadline: deadlineCalendar.updateDeadline.bind(deadlineCalendar),
    markCompleted: deadlineCalendar.markCompleted.bind(deadlineCalendar),
    deleteDeadline: deadlineCalendar.deleteDeadline.bind(deadlineCalendar),
    getCalendarMonth: deadlineCalendar.getCalendarMonth.bind(deadlineCalendar),
    getStudyRecommendations: deadlineCalendar.getStudyRecommendations.bind(deadlineCalendar),
    formatDeadlineDate: deadlineCalendar.formatDeadlineDate.bind(deadlineCalendar),
    getDaysUntil: deadlineCalendar.getDaysUntil.bind(deadlineCalendar)
  }
}
