# Production-Grade Gemini Model Management

## Why Models Fail at API-Key/Project Level

### 1. **Google Cloud Project Configuration**
- API keys are tied to specific Google Cloud projects
- Models must be explicitly enabled in "APIs & Services" → "Enabled APIs"
- Project-level quotas and restrictions apply

### 2. **Regional Availability**
- Some models only work in specific regions
- API endpoints may be region-specific
- Check your project's default region

### 3. **API Version Compatibility**
- **v1 API**: Older, more stable, limited models (`gemini-pro`, `text-bison-001`)
- **v1beta API**: Newer models (`gemini-1.5-pro`, `gemini-1.5-flash`)
- Your SDK version determines which API version is used

### 4. **Billing & Quota**
- Free tier may only access certain models
- Paid projects have different model availability
- Quota limits vary by model

### 5. **Enterprise Policies**
- Organization policies can disable specific models
- Security restrictions may block certain models
- Compliance requirements affect model access

## How to Check Available Models

### Method 1: REST API (Recommended)
```typescript
import { listAvailableModels } from '@/lib/gemini/models'

const models = await listAvailableModels(process.env.GEMINI_API_KEY!)
console.log('Available models:', models)
```

### Method 2: SDK (if supported)
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(apiKey)
// Note: SDK may not expose listModels directly
```

### Method 3: Manual Check
```bash
curl "https://generativelanguage.googleapis.com/v1/models?key=YOUR_API_KEY"
```

## Architecture: Subscription-Based Model Selection

### Backend-Only Model Selection
- **Frontend never sees model names** - only sends tier information
- **Backend maps tier → model** - automatic selection based on subscription
- **Fallback logic** - if preferred model unavailable, use lower-tier model

### Model Mapping
```
free    → gemini-pro (basic, always available)
pro     → gemini-1.5-flash (faster, better quality)
master  → gemini-1.5-pro (best quality, advanced features)
```

## Configuration Options

### Option 1: Single API Key (Recommended for Start)
```env
GEMINI_API_KEY=your_api_key_here
GEMINI_STRATEGY=single-key
```

### Option 2: Multiple API Keys (Quota Isolation)
```env
GEMINI_STRATEGY=multi-key
GEMINI_API_KEY_FREE=free_tier_key
GEMINI_API_KEY_PRO=pro_tier_key
GEMINI_API_KEY_MASTER=master_tier_key
GEMINI_API_KEY=fallback_key  # Used if tier key fails
```

## Usage Example

```typescript
import { generateTutorResponse } from '@/lib/gemini/service'

// Backend automatically selects model based on tier
const response = await generateTutorResponse(
  "Explain photosynthesis",
  { mode: 'explain', subject: 'Science' },
  'pro' // Subscription tier - frontend never controls model
)
```

## Best Practices

### 1. Security
- ✅ Never expose API keys to frontend
- ✅ Use environment variables for all keys
- ✅ Rotate keys regularly
- ✅ Use separate keys per tier for isolation

### 2. Quota Protection
- ✅ Implement rate limiting per tier
- ✅ Track token usage
- ✅ Set daily/monthly limits
- ✅ Monitor quota exhaustion

### 3. Error Handling
- ✅ Automatic fallback to available models
- ✅ Clear error messages for debugging
- ✅ Logging for troubleshooting
- ✅ Graceful degradation

### 4. Future Model Upgrades
- ✅ Model configs in code (not hardcoded)
- ✅ Easy to add new models
- ✅ Version model configurations
- ✅ A/B test new models

## Production Deployment Checklist

- [ ] Verify all models are enabled in Google Cloud Console
- [ ] Set up quota alerts
- [ ] Configure rate limiting
- [ ] Test model fallback logic
- [ ] Set up monitoring/logging
- [ ] Document model availability per tier
- [ ] Create runbook for model failures

## Troubleshooting

### "Model not found" Error
1. Check model is enabled in Google Cloud Console
2. Verify API key has correct permissions
3. Check API version compatibility
4. Try listing available models programmatically

### Quota Exceeded
1. Check quota limits in Google Cloud Console
2. Review rate limiting configuration
3. Consider upgrading tier or adding keys
4. Implement request queuing

### Slow Responses
1. Check which model is being used
2. Consider upgrading to faster model (flash)
3. Review token limits
4. Check network latency

