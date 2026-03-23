import { createSupabaseClient } from './supabase/client'

export class AppTimeTracker {
  private static instance: AppTimeTracker
  private supabase = createSupabaseClient()
  private sessionStartTime: number | null = null
  private currentSessionId: string | null = null
  private isTracking = false
  private lastActivity: number = Date.now()
  private inactivityThreshold = 5 * 60 * 1000 // 5 minutes
  private totalInactiveTime = 0

  static getInstance(): AppTimeTracker {
    if (!AppTimeTracker.instance) {
      AppTimeTracker.instance = new AppTimeTracker()
    }
    return AppTimeTracker.instance
  }

  // Start tracking user's time in the app
  async startAppSession(userId: string): Promise<void> {
    if (this.isTracking) return

    try {
      this.sessionStartTime = Date.now()
      this.lastActivity = Date.now()
      this.isTracking = true
      this.totalInactiveTime = 0

      // Create a new app session
      const { data, error } = await this.supabase
        .from('app_sessions')
        .insert({
          user_id: userId,
          start_time: new Date().toISOString(),
          duration_minutes: 0,
          is_active: true,
          session_type: 'app_usage'
        })
        .select()
        .single()

      if (!error && data) {
        this.currentSessionId = data.id
        console.log('App session started:', data.id)
      }
    } catch (error) {
      console.error('Error starting app session:', error)
    }
  }

  // End current app session
  async endAppSession(): Promise<void> {
    if (!this.isTracking || !this.sessionStartTime || !this.currentSessionId) return

    try {
      const endTime = Date.now()
      const activeTime = endTime - this.sessionStartTime - this.totalInactiveTime
      const durationMinutes = Math.round(activeTime / (1000 * 60))

      // Update session with end time and duration
      const { error } = await this.supabase
        .from('app_sessions')
        .update({
          end_time: new Date().toISOString(),
          duration_minutes: durationMinutes,
          is_active: false
        })
        .eq('id', this.currentSessionId)

      if (!error) {
        console.log(`App session ended: ${durationMinutes} minutes (active time)`)
      }

      // Also update daily stats
      await this.updateDailyStats(durationMinutes)

    } catch (error) {
      console.error('Error ending app session:', error)
    } finally {
      this.sessionStartTime = null
      this.currentSessionId = null
      this.isTracking = false
    }
  }

  // Update activity (call this when user interacts with app)
  updateActivity(): void {
    if (!this.isTracking) return

    const now = Date.now()
    const timeSinceLastActivity = now - this.lastActivity

    // If user was inactive, add that time to inactive total
    if (timeSinceLastActivity > this.inactivityThreshold) {
      this.totalInactiveTime += timeSinceLastActivity
      console.log(`User inactive for ${Math.round(timeSinceLastActivity / 1000)}s`)
    }

    this.lastActivity = now
  }

  // Get current session duration (active time only)
  getCurrentActiveDuration(): number {
    if (!this.sessionStartTime) return 0
    const now = Date.now()
    const activeTime = now - this.sessionStartTime - this.totalInactiveTime
    return Math.max(0, Math.round(activeTime / (1000 * 60)))
  }

  // Check if currently tracking
  isCurrentlyTracking(): boolean {
    return this.isTracking
  }

  // Update daily user stats
  private async updateDailyStats(sessionMinutes: number): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) return

      // Get current stats
      const { data: currentStats } = await this.supabase
        .from('user_stats')
        .select('daily_study_time')
        .eq('user_id', user.id)
        .eq('last_study_date', today)
        .single()

      const newTotal = (currentStats?.daily_study_time || 0) + sessionMinutes

      // Update or insert stats
      if (currentStats) {
        await this.supabase
          .from('user_stats')
          .update({
            daily_study_time: newTotal,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('last_study_date', today)
      } else {
        await this.supabase
          .from('user_stats')
          .insert({
            user_id: user.id,
            daily_study_time: newTotal,
            last_study_date: today,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      }

      console.log('Updated daily app time stats:', newTotal, 'minutes')
    } catch (error) {
      console.error('Error updating daily stats:', error)
    }
  }
}

// Export singleton instance
export const appTimeTracker = AppTimeTracker.getInstance()
