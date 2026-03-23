// Database Verification Script
// Run this with: node verify-database.js

const { createClient } = require('@supabase/supabase-js')

// You'll need to set these environment variables or replace them directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const requiredTables = [
  'profiles',
  'subscriptions', 
  'chats',
  'messages',
  'scans',
  'daily_usage',
  'quizzes',
  'quiz_questions',
  'flashcards',
  'study_sessions',
  'user_performance'
]

async function verifyDatabase() {
  console.log('🔍 Verifying database tables...\n')
  
  let allTablesExist = true
  
  for (const tableName of requiredTables) {
    try {
      // Try to select from the table (will fail if table doesn't exist)
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error && error.code === 'PGRST116') {
        console.log(`❌ Table '${tableName}' does not exist`)
        allTablesExist = false
      } else if (error && error.code === 'PGRST301') {
        console.log(`❌ Table '${tableName}' exists but RLS policy denies access`)
        allTablesExist = false
      } else {
        console.log(`✅ Table '${tableName}' exists and is accessible`)
      }
    } catch (err) {
      console.log(`❌ Error checking table '${tableName}':`, err.message)
      allTablesExist = false
    }
  }
  
  console.log('\n' + '='.repeat(50))
  
  if (allTablesExist) {
    console.log('🎉 All required tables exist and are accessible!')
    console.log('If you still see 404 errors, the issue might be:')
    console.log('1. Environment variables not set correctly')
    console.log('2. Supabase project URL/keys incorrect')
    console.log('3. Network connectivity issues')
  } else {
    console.log('⚠️  Some tables are missing or inaccessible.')
    console.log('\n📋 To fix this:')
    console.log('1. Go to your Supabase Dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Run the complete migration from: supabase/complete_migration.sql')
    console.log('4. Restart your development server')
  }
}

verifyDatabase().catch(console.error)
