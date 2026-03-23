'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ThemeToggle } from '@/components/ThemeToggle'
import { OnboardingData } from '@/types/database'
import { Check } from 'lucide-react'

const GRADE_LEVELS = ['6th', '7th', '8th', '9th', '10th', '11th', '12th']
const SUBJECTS = ['Math', 'Science', 'English', 'History', 'Art', 'Music', 'Computer Science', 'Physical Education']
const STUDY_GOALS = ['Understand concepts', 'Practice problems', 'Exam prep', 'Improve grades', 'Learn for fun']
const LEARNING_STYLES = [
  { value: 'step-by-step', label: 'Step-by-step' },
  { value: 'more-examples', label: 'More examples' },
  { value: 'more-practice', label: 'More practice' },
  { value: 'visual', label: 'Visual learning' },
  { value: 'hands-on', label: 'Hands-on learning' },
]
const HOBBIES = ['Sports', 'Gaming', 'Reading', 'Music', 'Art', 'Coding', 'Science', 'Nature', 'Photography', 'Cooking', 'Dancing', 'Writing']
const INTERESTS = ['Technology', 'Space', 'Animals', 'Environment', 'History', 'Movies', 'Fashion', 'Cars', 'Travel', 'Food', 'Fitness', 'Medicine']
const PERSONALITY_TRAITS = ['Curious', 'Creative', 'Analytical', 'Organized', 'Adventurous', 'Quiet', 'Social', 'Competitive', 'Helpful', 'Funny']
const PREFERRED_TONES = [
  { value: 'friendly', label: 'Friendly & Casual' },
  { value: 'encouraging', label: 'Encouraging & Motivating' },
  { value: 'direct', label: 'Direct & To-the-point' },
  { value: 'formal', label: 'Formal & Professional' },
]
const FAVORITE_TOPICS = ['Artificial Intelligence', 'Climate Change', 'Space Exploration', 'Ancient History', 'Modern Art', 'Psychology', 'Biology', 'Physics', 'Literature', 'Philosophy', 'Economics', 'Music Theory']
const LEARNING_PACES = [
  { value: 'slow', label: 'Slow & Thorough' },
  { value: 'moderate', label: 'Moderate Pace' },
  { value: 'fast', label: 'Fast & Efficient' },
]
const DIFFICULTY_PREFERENCES = [
  { value: 'easy', label: 'Start Easy, Build Up' },
  { value: 'medium', label: 'Moderate Challenge' },
  { value: 'hard', label: 'Challenge Me' },
]
const COMMUNICATION_STYLES = [
  { value: 'visual', label: 'Visual (Diagrams, Charts)' },
  { value: 'verbal', label: 'Verbal (Detailed Explanations)' },
  { value: 'mixed', label: 'Mixed (Both Visual & Verbal)' },
]
const MOTIVATION_LEVELS = [
  { value: 'low', label: 'Need Extra Motivation' },
  { value: 'medium', label: 'Generally Motivated' },
  { value: 'high', label: 'Highly Motivated' },
]
const STUDY_TIME_PREFERENCES = [
  { value: 'morning', label: 'Morning (6AM - 12PM)' },
  { value: 'afternoon', label: 'Afternoon (12PM - 6PM)' },
  { value: 'evening', label: 'Evening (6PM - 10PM)' },
  { value: 'night', label: 'Night (10PM - 6AM)' },
]
const SESSION_LENGTHS = [
  { value: 'short', label: 'Short (15-30 min)' },
  { value: 'medium', label: 'Medium (30-60 min)' },
  { value: 'long', label: 'Long (60+ min)' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseClient()
  const [step, setStep] = useState(1)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    display_name: '',
    grade_level: '',
    subjects: [],
    study_goals: [],
    learning_style: '',
    hobbies: [],
    interests: [],
    personality_traits: [],
    preferred_tone: 'friendly',
    favorite_topics: [],
    learning_pace: 'moderate',
    difficulty_preference: 'medium',
    communication_style: 'mixed',
    motivation_level: 'medium',
    study_time_preference: 'evening',
    preferred_session_length: 'medium',
  })

  // Check if user is already authenticated and has completed onboarding
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          // Not authenticated, redirect to login
          router.push('/auth/login')
          return
        }

        // Check if this is an edit request
        const editMode = searchParams.get('edit')

        if (editMode === 'true') {
          setIsEditing(true)

          // Load existing profile data for editing
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profile) {
            setData({
              display_name: profile.display_name || '',
              grade_level: profile.grade_level || '',
              subjects: profile.subjects || [],
              study_goals: profile.study_goals || [],
              learning_style: profile.learning_style || '',
              hobbies: profile.hobbies || [],
              interests: profile.interests || [],
              personality_traits: profile.personality_traits || [],
              preferred_tone: profile.preferred_tone || 'friendly',
              favorite_topics: profile.favorite_topics || [],
              learning_pace: profile.learning_pace || 'moderate',
              difficulty_preference: profile.difficulty_preference || 'medium',
              communication_style: profile.communication_style || 'mixed',
              motivation_level: profile.motivation_level || 'medium',
              study_time_preference: profile.study_time_preference || 'evening',
              preferred_session_length: profile.preferred_session_length || 'medium',
            })
          }
        } else {
          // Check if user already has a profile with display_name (completed onboarding)
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', session.user.id)
            .single()

          if (profile?.display_name) {
            // User already completed onboarding, redirect to home
            console.log('✅ User already completed onboarding, redirecting to home')
            router.push('/home')
            return
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
      } finally {
        setInitialLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase, searchParams])

  const handleNext = async () => {
    if (step === 1 && !data.display_name?.trim()) {
      alert('Please enter your display name')
      return // Don't proceed if display name is empty
    }

    // Validate current step before proceeding
    if (!canProceed()) {
      alert('Please complete the current step before continuing')
      return
    }

    if (step < 8) {
      setStep(step + 1)
    } else {
      await handleSubmit()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async () => {
    // Only validate essential fields for onboarding completion
    if (!data.display_name?.trim()) {
      alert('Please enter your display name')
      return
    }

    if (!data.grade_level) {
      alert('Please select your grade level')
      return
    }

    if (!data.subjects || data.subjects.length === 0) {
      alert('Please select at least one subject')
      return
    }

    if (!data.study_goals || data.study_goals.length === 0) {
      alert('Please select at least one study goal')
      return
    }

    if (!data.learning_style) {
      alert('Please select your learning style')
      return
    }

    // Optional fields - don't block submission if empty
    const hobbies = data.hobbies || []
    const interests = data.interests || []
    const personalityTraits = data.personality_traits || []
    const preferredTone = data.preferred_tone || 'friendly'
    const favoriteTopics = data.favorite_topics || []
    const learningPace = data.learning_pace || 'moderate'
    const difficultyPreference = data.difficulty_preference || 'medium'
    const communicationStyle = data.communication_style || 'mixed'
    const motivationLevel = data.motivation_level || 'medium'
    const studyTimePreference = data.study_time_preference || 'evening'
    const preferredSessionLength = data.preferred_session_length || 'medium'

    setLoading(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth/login')
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: data.display_name.trim(),
          grade_level: data.grade_level,
          subjects: data.subjects,
          study_goals: data.study_goals,
          learning_style: data.learning_style,
          hobbies: hobbies,
          interests: interests,
          personality_traits: personalityTraits,
          preferred_tone: preferredTone,
          favorite_topics: favoriteTopics,
          learning_pace: learningPace,
          difficulty_preference: difficultyPreference,
          communication_style: communicationStyle,
          motivation_level: motivationLevel,
          study_time_preference: studyTimePreference,
          preferred_session_length: preferredSessionLength,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id)

      if (error) {
        console.error('Onboarding error:', error)
        alert('Failed to save preferences. Please try again.')
      } else {
        console.log('✅ Profile updated successfully')
        if (isEditing) {
          router.push('/you')
        } else {
          router.push('/home')
        }
      }
    } catch (error) {
      console.error('Onboarding error:', error)
      alert('Failed to save preferences. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter((i) => i !== item)
    }
    return [...array, item]
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!data.display_name?.trim()
      case 2:
        return !!data.grade_level
      case 3:
        return (data.subjects?.length || 0) > 0
      case 4:
        return (data.study_goals?.length || 0) > 0
      case 5:
        return !!data.learning_style
      case 6:
        return ((data.hobbies?.length || 0) + (data.interests?.length || 0)) > 0
      case 7:
        return (data.personality_traits?.length || 0) > 0 && !!data.preferred_tone
      case 8:
        return true // Always allow proceeding on final step
      default:
        return false
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with theme toggle */}
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Step {step} of 8
            </span>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {Math.round((step / 8) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300 shadow-glow"
              style={{ width: `${(step / 8) * 100}%` }}
            />
          </div>
        </div>

        <Card className="mb-6" glow={step === 1}>
          {/* Step 1: Display Name */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                What should we call you?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We'll use this when we talk—pick something you like.
              </p>
              <input
                type="text"
                value={data.display_name}
                onChange={(e) => setData({ ...data, display_name: e.target.value })}
                placeholder="Enter your display name"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-0 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"
                maxLength={30}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                This is how other users will see you. You can change this later in settings.
              </p>
            </div>
          )}

          {/* Step 2: Grade Level */}
          {step === 2 && data.display_name && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                What grade are you in?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                So we can match explanations to where you're at.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {GRADE_LEVELS.map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() =>
                      setData({ ...data, grade_level: grade })
                    }
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${data.grade_level === grade
                        ? 'border-primary-600 bg-primary-50 shadow-glow'
                        : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-600 hover:border-primary-300'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">{grade} Grade</span>
                      {data.grade_level === grade && (
                        <Check className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Subjects */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Which subjects interest you?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Pick any that you care about—no wrong answers.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {SUBJECTS.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() =>
                      setData({
                        ...data,
                        subjects: toggleArrayItem(
                          data.subjects || [],
                          subject
                        ),
                      })
                    }
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${data.subjects?.includes(subject)
                        ? 'border-primary-600 bg-primary-50 shadow-glow'
                        : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-600 hover:border-primary-300'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">{subject}</span>
                      {data.subjects?.includes(subject) && (
                        <Check className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Study Goals */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                What do you want to get out of this?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                One or more—whatever fits you.
              </p>
              <div className="space-y-3">
                {STUDY_GOALS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() =>
                      setData({
                        ...data,
                        study_goals: toggleArrayItem(
                          data.study_goals || [],
                          goal
                        ),
                      })
                    }
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${data.study_goals?.includes(goal)
                        ? 'border-primary-600 bg-primary-50 shadow-glow'
                        : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-600 hover:border-primary-300'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">{goal}</span>
                      {data.study_goals?.includes(goal) && (
                        <Check className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Learning Style */}
          {step === 5 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                How do you learn best?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                How do you like to take in new stuff?
              </p>
              <div className="space-y-3">
                {LEARNING_STYLES.map((style) => (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() =>
                      setData({ ...data, learning_style: style.value })
                    }
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${data.learning_style === style.value
                        ? 'border-primary-600 bg-primary-50 shadow-glow'
                        : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-600 hover:border-primary-300'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">{style.label}</span>
                      {data.learning_style === style.value && (
                        <Check className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Hobbies & Interests */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  What do you enjoy?
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Select your hobbies and interests. This helps brAIny personalize your learning path!
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-400 dark:text-white/30 uppercase tracking-widest mb-3">Hobbies</h3>
                  <div className="flex flex-wrap gap-2">
                    {HOBBIES.map((hobby) => (
                      <button
                        key={hobby}
                        type="button"
                        onClick={() => setData({ ...data, hobbies: toggleArrayItem(data.hobbies || [], hobby) })}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border-2 ${
                          data.hobbies?.includes(hobby)
                            ? 'bg-primary-500 border-primary-500 text-white shadow-glow-primary scale-105'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary-300'
                        }`}
                      >
                        {hobby}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-400 dark:text-white/30 uppercase tracking-widest mb-3">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => setData({ ...data, interests: toggleArrayItem(data.interests || [], interest) })}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border-2 ${
                          data.interests?.includes(interest)
                            ? 'bg-blue-500 border-blue-500 text-white shadow-glow-blue scale-105'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-300'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 dark:border-white/5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Add any other interests (separated by commas)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. quantum physics, baking, skateboarding"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value;
                        if (val.trim()) {
                          const newItems = val.split(',').map(s => s.trim()).filter(Boolean);
                          setData({ ...data, interests: Array.from(new Set([...(data.interests || []), ...newItems])) });
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <p className="text-[10px] text-gray-500 mt-2">Press Enter to add custom interests</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Personality Traits */}
          {step === 7 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                How would you describe yourself?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Select traits that describe you - helps me adapt to your personality!
              </p>
              <div className="grid grid-cols-2 gap-3">
                {PERSONALITY_TRAITS.map((trait) => (
                  <button
                    key={trait}
                    type="button"
                    onClick={() =>
                      setData({
                        ...data,
                        personality_traits: toggleArrayItem(data.personality_traits || [], trait)
                      })
                    }
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${data.personality_traits?.includes(trait)
                        ? 'border-primary-600 bg-primary-50 shadow-glow'
                        : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-600 hover:border-primary-300'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">{trait}</span>
                      {data.personality_traits?.includes(trait) && (
                        <Check className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 8: Preferred Tone */}
          {step === 8 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                How should I talk to you?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Choose your preferred communication style
              </p>
              <div className="space-y-3">
                {PREFERRED_TONES.map((tone) => (
                  <button
                    key={tone.value}
                    type="button"
                    onClick={() =>
                      setData({ ...data, preferred_tone: tone.value as any })
                    }
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${data.preferred_tone === tone.value
                        ? 'border-primary-600 bg-primary-50 shadow-glow'
                        : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-600 hover:border-primary-300'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">{tone.label}</span>
                      {data.preferred_tone === tone.value && (
                        <Check className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 8: Complete */}
          {step === 8 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                You're all set! 🎉
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your personalized learning experience is ready. I'll use all this information to provide you with the best possible tutoring experience.
              </p>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4">Your Personalization Summary:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Display Name:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{data.display_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Grade Level:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{data.grade_level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subjects:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{data.subjects?.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Learning Style:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{data.learning_style}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Preferred Tone:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{data.preferred_tone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Learning Pace:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{data.learning_pace}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1"
              disabled={loading}
            >
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            className="flex-1"
            glow={step === 8}
            disabled={!canProceed() || loading}
          >
            {loading
              ? 'Saving...'
              : step === 8
                ? 'Get Started'
                : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}

