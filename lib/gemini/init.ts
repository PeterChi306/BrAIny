/**
 * Initialize Gemini Service on Application Startup
 * Call this from your Next.js app initialization
 */

import { initializeGeminiService } from './service'

/**
 * Initialize on server startup
 * Add this to your Next.js app initialization or API route handler
 */
export async function initGemini() {
  try {
    await initializeGeminiService()
  } catch (error) {
    console.error('Failed to initialize Gemini service:', error)
    // Don't throw - allow app to start even if Gemini init fails
    // Individual requests will handle model selection
  }
}

// For Next.js, you can call this in a server component or API route
// Example: In app/layout.tsx (server component) or middleware
if (typeof window === 'undefined') {
  // Server-side only
  initGemini().catch(console.error)
}

