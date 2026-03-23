'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'

export function useUserProfile() {
  const [profile, setProfile] = useState<any>(null)
  const [displayName, setDisplayName] = useState('Student')
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    try {
      console.log('🔄 Refreshing profile...')
      const { data: { user } } = await createSupabaseClient().auth.getUser()
      
      if (user) {
        console.log('👤 User found:', user.id)
        // Get fresh profile from database FIRST (highest priority)
        try {
          const { data: profileData, error } = await createSupabaseClient()
            .from('profiles')
            .select('display_name') // Removed 'email' since it doesn't exist
            .eq('id', user.id)
            .maybeSingle()

          console.log('📊 Profile data from DB:', { profileData, error })

          if (!error) {
            // Use database name as primary source
            if (profileData?.display_name) {
              console.log('✅ Using display_name from DB:', profileData.display_name)
              setDisplayName(profileData.display_name)
            } else {
              // Use email as fallback
              console.log('⚠️ No display_name in DB, using email fallback')
              setDisplayName(user.email?.split('@')[0] || 'Student')
            }
            
            setProfile(profileData)
          } else {
            console.error('❌ Error loading profile from DB:', error)
            // Error loading profile, use email fallback
            setDisplayName(user.email?.split('@')[0] || 'Student')
            setProfile(null)
          }
        } catch (dbError) {
          console.error('❌ Database error:', dbError)
          // Use email as fallback
          setDisplayName(user.email?.split('@')[0] || 'Student')
          setProfile(null)
        }
      } else {
        console.log('❌ No user logged in')
        // No user logged in - reset to default
        setDisplayName('Student')
        setProfile(null)
      }
    } catch (error) {
      console.error('❌ Profile load error:', error)
      setDisplayName('Student')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshProfile()
  }, [])

  return { profile, displayName, loading, refreshProfile }
}
