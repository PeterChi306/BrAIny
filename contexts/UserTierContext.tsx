'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { SubscriptionTier } from '@/types/database'

interface UserTierContextType {
  userTier: SubscriptionTier
  isLoading: boolean
  refreshTier: () => Promise<void>
}

const UserTierContext = createContext<UserTierContextType | undefined>(undefined)

export function UserTierProvider({ children }: { children: ReactNode }) {
  const [userTier, setUserTier] = useState<SubscriptionTier>('starter')
  const [isLoading, setIsLoading] = useState(true)

  const loadUserTier = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setUserTier('starter')
        return
      }

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', session.user.id)
        .maybeSingle()

      setUserTier(subscription?.tier || 'starter')
    } catch (error) {
      console.error('Error loading user tier:', error)
      setUserTier('starter')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshTier = async () => {
    setIsLoading(true)
    await loadUserTier()
  }

  useEffect(() => {
    loadUserTier()
  }, [])

  return (
    <UserTierContext.Provider value={{ userTier, isLoading, refreshTier }}>
      {children}
    </UserTierContext.Provider>
  )
}

export function useUserTier() {
  const context = useContext(UserTierContext)
  if (context === undefined) {
    throw new Error('useUserTier must be used within a UserTierProvider')
  }
  return context
}
