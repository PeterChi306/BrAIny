import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for admin access
)

export async function POST() {
  try {
    console.log('🔧 Creating missing profiles for auth users...')
    
    // Get all auth users (requires service role key)
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return NextResponse.json({ error: 'Failed to fetch auth users' }, { status: 500 })
    }
    
    console.log(`📊 Found ${users?.length || 0} auth users`)
    
    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No auth users found' })
    }
    
    // Get existing profiles
    const { data: existingProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
    
    if (profileError) {
      console.error('❌ Error fetching existing profiles:', profileError)
      return NextResponse.json({ error: 'Failed to fetch existing profiles' }, { status: 500 })
    }
    
    const existingProfileIds = new Set(existingProfiles?.map(p => p.id) || [])
    console.log(`📊 Found ${existingProfileIds.size} existing profiles`)
    
    // Create profiles for users who don't have them
    const profilesToCreate = users.filter(user => !existingProfileIds.has(user.id))
    console.log(`🔧 Need to create ${profilesToCreate.length} profiles`)
    
    if (profilesToCreate.length === 0) {
      return NextResponse.json({ 
        message: 'All users already have profiles',
        totalUsers: users.length,
        existingProfiles: existingProfileIds.size
      })
    }
    
    // Create profiles in batches
    const profiles = profilesToCreate.map(user => ({
      id: user.id,
      display_name: user.email?.split('@')[0] || user.user_metadata?.full_name || `User ${user.id.substring(0, 8)}`,
      updated_at: new Date().toISOString(),
      created_at: user.created_at || new Date().toISOString()
    }))
    
    const { data: createdProfiles, error: insertError } = await supabase
      .from('profiles')
      .upsert(profiles)
      .select()
    
    if (insertError) {
      console.error('❌ Error creating profiles:', insertError)
      return NextResponse.json({ error: 'Failed to create profiles' }, { status: 500 })
    }
    
    console.log(`✅ Successfully created ${createdProfiles?.length || 0} profiles`)
    
    return NextResponse.json({
      message: 'Profiles created successfully',
      totalAuthUsers: users.length,
      existingProfiles: existingProfileIds.size,
      createdProfiles: createdProfiles?.length || 0,
      profiles: createdProfiles
    })
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
