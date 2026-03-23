import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Use only one client type to avoid multiple instances
export const createSupabaseClient = () => {
  return createClientComponentClient()
}

// Export a singleton instance
export const supabase = createSupabaseClient()

