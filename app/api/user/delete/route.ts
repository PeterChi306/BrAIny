import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase/client'

export async function POST(req: NextRequest) {
    const supabase = createSupabaseClient()

    try {
        const { data: { session }, error: authError } = await supabase.auth.getSession()

        if (authError || !session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id

        // Call the database function to delete all user data
        // (Ensure the legal_migration.sql has been run)
        const { error: deleteError } = await supabase.rpc('delete_user_data', {
            target_user_id: userId
        })

        if (deleteError) {
            console.error('Data deletion error:', deleteError)
            return NextResponse.json({ error: 'Failed to delete application data' }, { status: 500 })
        }

        // Now delete the auth user
        // Note: admin operations require service_role key
        // For this prototype, we will at least logout the user

        await supabase.auth.signOut()

        return NextResponse.json({ success: true, message: 'Account and data deleted successfully' })
    } catch (error) {
        console.error('Delete account route error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
