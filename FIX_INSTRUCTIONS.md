# Fix Instructions for 404 Errors and Upload Button

## 🔴 Issue: 404 Errors on API Calls

The 404 errors you're seeing are because the database tables don't exist in your Supabase project. The app is trying to access tables like:
- `user_performance`
- `study_sessions` 
- `flashcards`
- `quizzes`

### ✅ Solution: Run the Database Migration

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor** (in the left sidebar)
3. **Copy the complete migration** from `supabase/complete_migration.sql`
4. **Paste and run the SQL script**

This will create all required tables, set up Row Level Security (RLS), and create the necessary triggers.

### 📋 What the Migration Creates:
- `profiles` - User preferences and onboarding data
- `subscriptions` - User subscription tiers (free/pro/master)
- `chats` - AI conversation sessions
- `messages` - Individual chat messages
- `scans` - OCR scan history
- `daily_usage` - Usage tracking for limits
- `quizzes` - Quiz sessions and results
- `quiz_questions` - Individual quiz questions
- `flashcards` - User flashcards with spaced repetition
- `study_sessions` - Study history tracking
- `user_performance` - Performance analytics

## 🟢 Issue: Upload Button Compacted

The upload buttons have been compacted from two separate buttons ("Upload Image" and "Take Photo") into a single small "Upload" button.

### Changes Made:
- Removed the "Take Photo" button (camera feature coming soon)
- Made the upload button smaller with `size="sm"`
- Simplified text from "Upload Image" to just "Upload"
- Used smaller icon (`w-4 h-4` instead of `w-5 h-5`)

## 🔧 Environment Variables Check

Make sure your `.env.local` file contains:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### To verify your Supabase credentials:
1. Go to Supabase Dashboard → Project Settings → API
2. Copy the Project URL and anon/public key
3. Ensure they match your `.env.local` file

## 🚀 After Migration

Once you run the SQL migration:
1. Restart your development server (`npm run dev`)
2. The 404 errors should disappear
3. All features should work normally

## 🧪 Testing

After fixing these issues:
1. Sign up/login to the app
2. Try uploading an image in the scan page
3. Check that the progress tracking works
4. Verify quiz and flashcard features work

## 📞 If Issues Persist

If you still see 404 errors after running the migration:
1. Double-check that all tables were created in Supabase
2. Verify your Supabase URL and keys are correct
3. Check the browser console for specific error details
4. Ensure RLS policies are properly set up

The migration script includes all necessary RLS policies, so your data will be secure and users can only access their own information.
