# brAIny Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Set Up Supabase Database**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase/migrations.sql`
   - Run the migration
   - This creates all tables, policies, and triggers

4. **Configure Supabase Auth**
   - In Supabase Dashboard → Authentication → Providers
   - Enable Email provider
   - Enable Google OAuth (configure with your Google OAuth credentials)
   - Set redirect URL to: `http://localhost:3000/auth/callback` (for development)

5. **Get Google Gemini API Key**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Add it to your `.env.local` file

6. **Run the Development Server**
   ```bash
   npm run dev
   ```

7. **Open the App**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Setup Details

The migration script creates:
- `profiles` table - Stores user preferences from onboarding
- `subscriptions` table - Manages subscription tiers
- `chats` table - AI conversation sessions
- `messages` table - Individual messages in conversations
- `scans` table - OCR scan history
- `daily_usage` table - Tracks daily usage for limits

All tables have Row Level Security (RLS) enabled with policies that ensure users can only access their own data.

## Authentication Setup

### Email/Password
- Enabled by default in Supabase
- No additional configuration needed

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
6. Copy Client ID and Client Secret to Supabase Auth settings

## Testing the Application

1. **Sign Up**: Create a new account with email/password or Google
2. **Onboarding**: Complete the 4-step onboarding flow
3. **Home**: Explore the main dashboard
4. **AI Chat**: Try asking questions in different modes
5. **Scan**: Upload an image and extract text
6. **Subscription**: View and upgrade subscription plans
7. **Profile**: Check your preferences and settings

## Troubleshooting

### "GEMINI_API_KEY is not set"
- Make sure you've created `.env.local` (not `.env`)
- Restart the development server after adding environment variables

### "Unauthorized" errors
- Check that your Supabase URL and anon key are correct
- Verify RLS policies are set up correctly

### OCR not working
- Tesseract.js runs in the browser, so it may be slow for large images
- Consider using a server-side OCR service for production

### Google OAuth not working
- Verify redirect URI matches exactly in both Google Console and Supabase
- Check that Google OAuth is enabled in Supabase dashboard

## Production Deployment

1. Set environment variables in your hosting platform (Vercel, Netlify, etc.)
2. Update Supabase redirect URLs to your production domain
3. Update Google OAuth redirect URI to production URL
4. Run `npm run build` to test production build locally
5. Deploy to your hosting platform

## Next Steps

- Integrate a real payment provider (Stripe, etc.) for subscriptions
- Add more subjects and learning materials
- Implement camera capture for mobile devices
- Add dark mode support
- Enhance AI personalization based on usage patterns

