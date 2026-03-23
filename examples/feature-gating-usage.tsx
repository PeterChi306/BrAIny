'use client'

import React, { useState } from 'react'
import { FeatureLock, LockedButton } from '../components/FeatureLock'
import { useFeatureGate } from '../lib/feature-gates'
import { useLearningDataTracker } from '../lib/learning-data-tracker'
import { SubscriptionTier } from '../types/database'
import { FeatureName } from '../lib/feature-gates'

// Import feature functions
import { answer_question, generate_basic_quiz, limited_scan } from '../lib/features/core-ai'
import { generate_study_guide, extract_text_from_scan, generate_practice_quiz } from '../lib/features/plus-tools'
import { analyze_user_weak_spots, generate_adaptive_quiz, generate_study_plan, generate_learning_analytics } from '../lib/features/pro-tools'

/**
 * Example Component showing how to use the tier system
 */
export function TieredFeatureExample({ userTier, userId }: { userTier: SubscriptionTier; userId: string }) {
  const { canAccess, getUpgradeMessage } = useFeatureGate(userTier)
  const { trackQuizScore, trackIncorrectAnswer, getWeakSpots } = useLearningDataTracker(userId)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  // Example: Core AI Tutor (Available to all tiers)
  const handleAskQuestion = async (question: string) => {
    setLoading(true)
    try {
      const response = await answer_question({
        message: question,
        mode: 'explain'
      })
      setResult(response)
      
      // Track study session for all tiers
      // This data will be used for Pro features later
      console.log('Study session tracked for future analytics')
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Example: Basic Quiz (Available to all tiers)
  const handleGenerateBasicQuiz = async (topic: string) => {
    setLoading(true)
    try {
      const quiz = await generate_basic_quiz({
        topic,
        difficulty: 'medium',
        questionCount: 5
      })
      setResult(quiz)
      
      // Track quiz data for Pro analytics
      await trackQuizScore('quiz-123', topic, 'Math', 80, 5, 'medium')
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Example: Study Guide (Scholar tier only)
  const handleGenerateStudyGuide = async (text: string) => {
    if (!canAccess('study_guide')) {
      alert(getUpgradeMessage('study_guide'))
      return
    }

    setLoading(true)
    try {
      const guide = await generate_study_guide({
        text,
        format: 'detailed'
      })
      setResult(guide)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Example: Weak Spot Analysis (Master tier only)
  const handleAnalyzeWeakSpots = async () => {
    if (!canAccess('weak_spot_analysis')) {
      alert(getUpgradeMessage('weak_spot_analysis'))
      return
    }

    setLoading(true)
    try {
      const weakSpots = await getWeakSpots('month')
      setResult(weakSpots)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold mb-6">brAIny Tier System Demo</h1>
      
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <p className="text-sm">Current Tier: <span className="font-bold capitalize">{userTier}</span></p>
      </div>

      {/* Core Features - Available to everyone */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Core AI Tutor (All Tiers)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleAskQuestion("What is photosynthesis?")}
            className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            disabled={loading}
          >
            Ask Question
          </button>
          <button
            onClick={() => handleGenerateBasicQuiz("Algebra")}
            className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600"
            disabled={loading}
          >
            Generate Basic Quiz
          </button>
          <button
            onClick={() => limited_scan({ imageData: "image-data", title: "Math homework" })}
            className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            disabled={loading}
          >
            Scan Document (Limited)
          </button>
        </div>
      </section>

      {/* Scholar Tier Features */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Scholar Tier Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureLock feature="study_guide" userTier={userTier}>
            <button
              onClick={() => handleGenerateStudyGuide("Chapter text about biology...")}
              className="w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={loading}
            >
              Generate Study Guide
            </button>
          </FeatureLock>

          <FeatureLock feature="text_extraction" userTier={userTier}>
            <button
              onClick={() => extract_text_from_scan({ imageData: "base64-image" })}
              className="w-full p-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              disabled={loading}
            >
              Extract Text from Image
            </button>
          </FeatureLock>

          <FeatureLock feature="improved_quiz" userTier={userTier}>
            <button
              onClick={() => generate_practice_quiz({ topic: "Chemistry", difficulty: "medium" })}
              className="w-full p-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              disabled={loading}
            >
              Generate Practice Quiz
            </button>
          </FeatureLock>
        </div>
      </section>

      {/* Master Tier Features */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Master Tier Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeatureLock feature="weak_spot_analysis" userTier={userTier}>
            <button
              onClick={handleAnalyzeWeakSpots}
              className="w-full p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              disabled={loading}
            >
              Analyze Weak Spots
            </button>
          </FeatureLock>

          <FeatureLock feature="adaptive_quiz" userTier={userTier}>
            <button
              onClick={() => generate_adaptive_quiz({ userId, subject: "Math" })}
              className="w-full p-4 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
              disabled={loading}
            >
              Generate Adaptive Quiz
            </button>
          </FeatureLock>

          <FeatureLock feature="study_plan" userTier={userTier}>
            <button
              onClick={() => generate_study_plan({
                examDate: "2024-06-15",
                weakTopics: ["Algebra", "Geometry"],
                subjects: ["Math"],
                availableStudyTime: 60,
                studyPreferences: {
                  timeOfDay: "evening",
                  sessionLength: "medium",
                  preferredMethods: ["practice", "quiz"]
                }
              })}
              className="w-full p-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              disabled={loading}
            >
              Generate Study Plan
            </button>
          </FeatureLock>

          <FeatureLock feature="analytics" userTier={userTier}>
            <button
              onClick={() => generate_learning_analytics({ userId, timeRange: "month" })}
              className="w-full p-4 bg-red-600 text-white rounded-lg hover:bg-red-700"
              disabled={loading}
            >
              View Learning Analytics
            </button>
          </FeatureLock>
        </div>
      </section>

      {/* Results Display */}
      {result && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Result</h2>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </section>
      )}

      {loading && (
        <div className="text-center py-4">
          <p>Loading...</p>
        </div>
      )}
    </div>
  )
}

/**
 * Example of how to implement API routes with feature gates
 */
export const apiRouteExample = `
// Example API route with feature gate
import { withFeatureGate } from '../lib/feature-middleware'
import { generate_study_guide } from '../lib/features/plus-tools'

export const POST = withFeatureGate(
  'study_guide', // Feature name to check
  async (request, { userTier, userId }) => {
    // User has access to study_guide feature
    const { text, topic, format } = await request.json()
    
    try {
      const guide = await generate_study_guide({
        text,
        topic,
        format
      })
      
      return Response.json(guide)
    } catch (error) {
      return Response.json(
        { error: 'Failed to generate study guide' },
        { status: 500 }
      )
    }
  },
  {
    // Custom user tier lookup
    getUserTier: async (userId) => {
      const user = await getUserFromDatabase(userId)
      return user.subscription?.tier || 'free'
    }
  }
)
`

/**
 * Example of database schema for tracking learning data
 */
export const databaseSchemaExample = `
-- Learning Data Tables for Pro Features

CREATE TABLE learning_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL, -- 'scanned_topics', 'quiz_scores', etc.
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_weak_spots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  subject TEXT NOT NULL,
  weakness_score INTEGER NOT NULL, -- 0-100
  incorrect_count INTEGER NOT NULL,
  total_attempts INTEGER NOT NULL,
  last_incorrect TIMESTAMP WITH TIME ZONE,
  concepts TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE learning_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  best_study_times TEXT[], -- ["14:00", "15:00", "16:00"]
  optimal_session_length INTEGER, -- minutes
  most_effective_methods TEXT[], -- ["quiz", "practice"]
  difficulty_progression JSONB, -- {"easy": 85, "medium": 72, "hard": 58}
  subject_preferences JSONB, -- {"Math": 120, "Science": 90}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`
