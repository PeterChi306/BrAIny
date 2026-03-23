import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL('/auth/login?error=auth_failed', requestUrl.origin))
    }

    // Check if user needs onboarding
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('grade_level, display_name')
        .eq('id', session.user.id)
        .maybeSingle()

      // If no profile or missing required fields, redirect to onboarding
      if (!profile || !profile.grade_level || !profile.display_name) {
        return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
      }
    }
  }

  return NextResponse.redirect(new URL('/home', requestUrl.origin))
}

