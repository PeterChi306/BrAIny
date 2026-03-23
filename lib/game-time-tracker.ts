import { createSupabaseClient } from './supabase/client'

export class GameTimeTracker {
  private static instance: GameTimeTracker
  private supabase = createSupabaseClient()
  private sessionStartTime: number | null = null
  private currentSessionId: string | null = null
  private isTracking = false

  static getInstance(): GameTimeTracker {
    if (!GameTimeTracker.instance) {
      GameTimeTracker.instance = new GameTimeTracker()
    }
    return GameTimeTracker.instance
  }

  // Start tracking a game session
  async startGameSession(userId: string): Promise<void> {
    if (this.isTracking) return

    try {
      this.sessionStartTime = Date.now()
      this.isTracking = true

      // Create a new game session
      const { data, error } = await this.supabase
        .from('game_sessions')
        .insert({
          user_id: userId,
          start_time: new Date().toISOString(),
          duration_minutes: 0,
          is_active: true
        })
        .select()
        .single()

      if (!error && data) {
        this.currentSessionId = data.id
        console.log('Game session started:', data.id)
      }
    } catch (error) {
      console.error('Error starting game session:', error)
    }
  }

  // End current game session
  async endGameSession(): Promise<void> {
    if (!this.isTracking || !this.sessionStartTime || !this.currentSessionId) return

    try {
      const endTime = Date.now()
      const durationMinutes = Math.round((endTime - this.sessionStartTime) / (1000 * 60))

      // Update the session with end time and duration
      const { error } = await this.supabase
        .from('game_sessions')
        .update({
          end_time: new Date().toISOString(),
          duration_minutes: durationMinutes,
          is_active: false
        })
        .eq('id', this.currentSessionId)

      if (!error) {
        console.log(`Game session ended: ${durationMinutes} minutes`)
      }

      // Also update user_stats for today
      await this.updateDailyStats(durationMinutes)

    } catch (error) {
      console.error('Error ending game session:', error)
    } finally {
      this.sessionStartTime = null
      this.currentSessionId = null
      this.isTracking = false
    }
  }

  // Update daily user stats
  private async updateDailyStats(sessionMinutes: number): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Get current stats
      const { data: currentStats } = await this.supabase
        .from('user_stats')
        .select('daily_study_time')
        .eq('user_id', (await this.supabase.auth.getUser()).data.user?.id)
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
          .eq('user_id', (await this.supabase.auth.getUser()).data.user?.id)
          .eq('last_study_date', today)
      } else {
        await this.supabase
          .from('user_stats')
          .insert({
            user_id: (await this.supabase.auth.getUser()).data.user?.id,
            daily_study_time: newTotal,
            last_study_date: today,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      }

      console.log('Updated daily stats:', newTotal, 'minutes')
    } catch (error) {
      console.error('Error updating daily stats:', error)
    }
  }

  // Get current session duration
  getCurrentSessionDuration(): number {
    if (!this.sessionStartTime) return 0
    return Math.round((Date.now() - this.sessionStartTime) / (1000 * 60))
  }

  // Check if currently tracking
  isCurrentlyTracking(): boolean {
    return this.isTracking
  }
}

// Export singleton instance
export const gameTimeTracker = GameTimeTracker.getInstance()
