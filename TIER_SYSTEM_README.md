# brAIny Tier-Based Feature System

## Overview

This document describes the complete implementation of brAIny's tier-based feature system. The system ensures that all users receive the same high-quality AI responses, while advanced features are gated by subscription tier.

## Core Principle

**AI Quality Never Changes**: The AI tutor maintains the same quality across all tiers. The difference is in access to advanced tools and features, not in the quality of AI responses.

## Tier Structure

### Starter Tier
- Core AI tutor with full brAIny Signature Response Framework
- Basic quizzes and explanations
- Limited document scanning (3 per day)
- Access to fundamental learning features
- Study streaks tracking
- Progress monitoring

### Scholar Tier ($4.99/month)
- Everything in Starter
- Unlimited document scanning
- Study guide generation
- Text extraction from images
- Enhanced practice quizzes
- AI memory and weakness tracking
- Advanced learning analytics
- Smart streaks and goals
- Complete learning history

### Master Tier ($14.99/month)
- Everything in Scholar
- Visual explanations with diagrams
- Adaptive difficulty quizzes
- Personalized study plans
- Weak spot analysis
- Priority AI response speed
- Export & advanced analytics
- Unlimited everything
- Early access to new features

## Architecture

### 1. Feature Gate System (`lib/feature-gates.ts`)

The feature gate system controls access to features based on user tier:

```typescript
import { FeatureGate, FeatureName } from './lib/feature-gates'

// Check if user can access a feature
const canAccess = FeatureGate.canAccess('plus', 'study_guide') // false
const canAccess = FeatureGate.canAccess('pro', 'study_guide')    // true

// Get upgrade message
const message = FeatureGate.getUpgradeMessage('study_guide', 'free')
// "Study Guides are available with brAIny Plus. Upgrade to unlock advanced study tools!"
```

### 2. Feature Modules

#### Core AI Features (`lib/features/core-ai.ts`)
Available to ALL tiers with same quality:
- `answer_question()` - AI tutor chat
- `explain_topic()` - Topic explanations
- `generate_basic_quiz()` - Basic quizzes
- `limited_scan()` - Document scanning (limited)

#### Plus Tools (`lib/features/plus-tools.ts`)
Available to Plus and Pro tiers:
- `generate_study_guide()` - Study guide generation
- `extract_text_from_scan()` - OCR text extraction
- `generate_practice_quiz()` - Enhanced quizzes
- `unlimited_scan()` - Unlimited scanning

#### Pro Tools (`lib/features/pro-tools.ts`)
Available to Pro tier only:
- `analyze_user_weak_spots()` - Weakness analysis
- `generate_adaptive_quiz()` - Adaptive quizzes
- `generate_study_plan()` - Personalized plans
- `generate_learning_analytics()` - Learning analytics

### 3. Feature Middleware (`lib/feature-middleware.ts`)

Backend protection for API endpoints:

```typescript
import { withFeatureGate } from './lib/feature-middleware'

// Protect API endpoint
export const POST = withFeatureGate(
  'study_guide', // Feature to check
  async (request, { userTier, userId }) => {
    // User has access - proceed with feature
    const guide = await generate_study_guide(await request.json())
    return Response.json(guide)
  }
)
```

### 4. UI Components (`components/FeatureLock.tsx`)

Frontend lock states and upgrade modals:

```typescript
import { FeatureLock } from '../components/FeatureLock'

<FeatureLock feature="study_guide" userTier={userTier}>
  <button onClick={generateStudyGuide}>
    Generate Study Guide
  </button>
</FeatureLock>
```

## Data Tracking for Pro Features

### Learning Data Tracker (`lib/learning-data-tracker.ts`)

Tracks user learning data to power Pro features:

```typescript
import { useLearningDataTracker } from '../lib/learning-data-tracker'

const { trackQuizScore, trackIncorrectAnswer, getWeakSpots } = useLearningDataTracker(userId)

// Track quiz completion
await trackQuizScore('quiz-123', 'Algebra', 'Math', 85, 10, 'medium')

// Get weak spots for analysis
const weakSpots = await getWeakSpots('month')
```

### Data Types Tracked

1. **scanned_topics** - Topics from document scans
2. **quiz_scores** - Quiz performance data
3. **incorrect_answers** - Wrong answers for analysis
4. **topics_studied** - Study session data
5. **study_sessions** - Complete session records

## Implementation Guide

### 1. Setting up User Tiers

Update your user database to include subscription tier:

```sql
ALTER TABLE profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'active';
```

### 2. Protecting API Endpoints

Wrap feature-specific endpoints with feature gates:

```typescript
// app/api/plus/study-guide/route.ts
import { withFeatureGate } from '@/lib/feature-middleware'

export const POST = withFeatureGate('study_guide', async (request, context) => {
  // Implementation
})
```

### 3. Adding Feature Locks to UI

Use FeatureLock components for gated features:

```typescript
<FeatureLock feature="adaptive_quiz" userTier={userTier}>
  <AdaptiveQuizComponent />
</FeatureLock>
```

### 4. Tracking Learning Data

Implement data tracking in your features:

```typescript
// In quiz completion handler
const { trackQuizScore, trackIncorrectAnswer } = useLearningDataTracker(userId)

await trackQuizScore(quizId, topic, subject, score, totalQuestions, difficulty)

// For incorrect answers
await trackIncorrectAnswer(questionId, topic, subject, concept, userAnswer, correctAnswer, difficulty)
```

## Feature List by Tier

### Starter Tier Features
- ✅ ai_chat - AI tutor conversations
- ✅ basic_quiz - Generate basic quizzes
- ✅ limited_scan - 3 document scans per day

### Scholar Tier Features
- ✅ unlimited_scan - Unlimited document scanning
- ✅ study_guide - Generate study guides
- ✅ text_extraction - Extract text from images
- ✅ improved_quiz - Enhanced practice quizzes

### Master Tier Features
- ✅ weak_spot_analysis - Analyze learning weaknesses
- ✅ adaptive_quiz - Adaptive difficulty quizzes
- ✅ study_plan - Personalized study plans
- ✅ analytics - Learning analytics dashboard

## Database Schema

### Learning Data Tables

```sql
-- Learning data tracking
CREATE TABLE learning_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  data_type TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User weak spots
CREATE TABLE user_weak_spots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  topic TEXT NOT NULL,
  subject TEXT NOT NULL,
  weakness_score INTEGER NOT NULL,
  incorrect_count INTEGER NOT NULL,
  total_attempts INTEGER NOT NULL,
  last_incorrect TIMESTAMP WITH TIME ZONE,
  concepts TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning patterns
CREATE TABLE learning_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  best_study_times TEXT[],
  optimal_session_length INTEGER,
  most_effective_methods TEXT[],
  difficulty_progression JSONB,
  subject_preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Testing the System

### 1. Feature Access Testing

```typescript
// Test feature access by tier
const testCases = [
  { tier: 'free', feature: 'ai_chat', expected: true },
  { tier: 'free', feature: 'study_guide', expected: false },
  { tier: 'plus', feature: 'study_guide', expected: true },
  { tier: 'plus', feature: 'adaptive_quiz', expected: false },
  { tier: 'pro', feature: 'adaptive_quiz', expected: true }
]

testCases.forEach(({ tier, feature, expected }) => {
  const result = FeatureGate.canAccess(tier, feature)
  console.assert(result === expected, `Failed: ${tier} + ${feature}`)
})
```

### 2. UI Lock Testing

```typescript
// Test that locked features show upgrade modal
const { getByText } = render(
  <FeatureLock feature="study_guide" userTier="free">
    <button>Generate Study Guide</button>
  </FeatureLock>
)

fireEvent.click(getByText('Generate Study Guide'))
expect(getByText('Upgrade Required')).toBeInTheDocument()
```

## Migration Guide

### From Current System

1. **Update Tier Types**: Change from `free | pro | master` to `free | plus | pro`
2. **Add Feature Gates**: Wrap existing features with appropriate gates
3. **Implement Data Tracking**: Add learning data collection for Pro features
4. **Update UI Components**: Add FeatureLock wrappers to gated features
5. **Create API Middleware**: Protect backend endpoints with feature checks

### Example Migration

```typescript
// Before - direct feature access
const handleGenerateGuide = async () => {
  const guide = await generateStudyGuide(text)
  setStudyGuide(guide)
}

// After - with feature gate
const handleGenerateGuide = async () => {
  if (!canAccess('study_guide')) {
    setShowUpgradeModal(true)
    return
  }
  
  const guide = await generate_study_guide({ text })
  setStudyGuide(guide)
}
```

## Best Practices

### 1. Always Check on Both Client and Server
- Client-side checks for immediate UI feedback
- Server-side checks for security and enforcement

### 2. Provide Clear Upgrade Paths
- Show users exactly what they need to upgrade
- Explain the value of higher tiers

### 3. Track All Learning Data
- Even free users' data helps improve the system
- Data becomes more valuable with higher tiers

### 4. Maintain AI Quality
- Never reduce AI response quality for free users
- All tiers get the same high-quality explanations

### 5. Graceful Degradation
- Show helpful messages when features are blocked
- Don't break the user experience

## Support and Troubleshooting

### Common Issues

1. **Feature Not Working**: Check if feature gate is properly implemented
2. **Upgrade Modal Not Showing**: Verify FeatureLock component usage
3. **Data Not Tracking**: Ensure learning data tracker is properly initialized
4. **API Errors**: Check feature middleware implementation

### Debug Commands

```typescript
// Check available features for a tier
console.log('Free features:', FeatureGate.getAvailableFeatures('free'))
console.log('Plus features:', FeatureGate.getAvailableFeatures('plus'))
console.log('Pro features:', FeatureGate.getAvailableFeatures('pro'))

// Check upgrade path
console.log('Upgrade path from free:', FeatureGate.getUpgradePath('free', 'pro'))
```

## Future Enhancements

### Planned Features

1. **Annual Subscriptions**: Discounted yearly plans
2. **Family Plans**: Multiple users under one subscription
3. **Educational Plans**: Special pricing for schools
4. **Custom Tiers**: Enterprise-specific features

### Scalability Considerations

1. **Feature Flags**: Easy enable/disable of features
2. **A/B Testing**: Test new features with specific tiers
3. **Analytics**: Track feature usage by tier
4. **Performance**: Optimize feature gate checks

This tier system provides a clean, scalable way to offer different levels of service while maintaining the high-quality AI experience that makes brAIny special.
