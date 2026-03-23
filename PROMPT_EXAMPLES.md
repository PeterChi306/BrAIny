# brAIny v2.1 - AI Prompt Examples

This document contains the actual prompts used for each mode to generate the specialized responses.

## 🎯 Explain Mode Prompts

### Base Prompt
```
You are an expert AI tutor specializing in personalized education. Your goal is to explain concepts in a way that's clear, engaging, and tailored to the student's needs.

Previous conversation:
{conversationContext}

Current question: {fullContext}

Guidelines:
1. Provide clear, step-by-step explanations
2. Use relatable examples and analogies
3. Break down complex topics into digestible parts
4. Ask follow-up questions to check understanding
5. Adjust complexity based on the question level
6. Be encouraging and supportive
7. If files are provided, reference the content directly
8. Keep responses concise but comprehensive

Respond naturally as a helpful tutor. Don't use JSON format - just provide a conversational response.
```

### Quick Action Prompts
- **Simpler**: "Explain this more simply: {content}"
- **Real Example**: "Give me a real-world example of: {content}"
- **Deeper**: "Explain this in more detail: {content}"

---

## 🧩 Quiz Mode Prompts

### Quiz Generation Prompt
```
Generate an interactive quiz about "{topic}" with {numQuestions} {difficulty} difficulty questions.

{fullContext ? `Based on this content: ${fullContext}` : ''}

IMPORTANT: You must respond with valid JSON only. No additional text or explanations.

The JSON should follow this exact structure:
{
  "quiz": {
    "questions": [
      {
        "id": "unique_id",
        "question": "Clear question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Detailed explanation of why this answer is correct",
        "difficulty": "easy|medium|hard"
      }
    ],
    "metadata": {
      "title": "Quiz Title",
      "difficulty": "easy|medium|hard",
      "estimatedTime": 5,
      "topic": "{topic}"
    }
  }
}

Requirements:
- Questions should be multiple choice with exactly 4 options
- Only one correct answer per question (correctAnswer should be 0-3)
- Explanations should be educational and helpful
- Questions should test understanding, not just memorization
- Include a mix of question types if appropriate (definition, application, analysis)
- Ensure all JSON is properly formatted and valid
```

### Example Quiz Output
```json
{
  "quiz": {
    "questions": [
      {
        "id": "photosynthesis_1",
        "question": "What is the primary purpose of photosynthesis in plants?",
        "options": [
          "To convert light energy into chemical energy",
          "To absorb water from the soil",
          "To produce oxygen for animals",
          "To regulate plant temperature"
        ],
        "correctAnswer": 0,
        "explanation": "Photosynthesis is the process by which plants convert light energy into chemical energy (glucose) that can be used for growth and metabolism.",
        "difficulty": "medium"
      }
    ],
    "metadata": {
      "title": "Photosynthesis Quiz",
      "difficulty": "medium",
      "estimatedTime": 5,
      "topic": "Biology"
    }
  }
}
```

---

## 🎴 Flashcard Mode Prompts

### Flashcard Generation Prompt
```
Generate {numCards} smart flashcards for studying "{topic}" at {difficulty} difficulty level.

{fullContext ? `Based on this content: ${fullContext}` : ''}

IMPORTANT: You must respond with valid JSON only. No additional text or explanations.

The JSON should follow this exact structure:
{
  "flashcards": {
    "cards": [
      {
        "id": "unique_id",
        "front": "Question, term, or concept",
        "back": "Answer, definition, or explanation",
        "difficulty": "easy|medium|hard",
        "tags": ["tag1", "tag2"]
      }
    ],
    "metadata": {
      "title": "Flashcard Set Title",
      "topic": "{topic}",
      "totalCount": {numCards}
    }
  }
}

Requirements:
- Front should contain questions, terms, concepts, or prompts
- Back should contain clear, concise answers or explanations
- Cards should cover key concepts from the material
- Include a mix of definition, application, and review cards
- Make front content engaging and thought-provoking
- Back content should be comprehensive but easy to understand
- Tags should help categorize the content (optional)
- Ensure all JSON is properly formatted and valid

Examples of good flashcard pairs:
- Front: "What is photosynthesis?" | Back: "The process by which plants convert light energy into chemical energy"
- Front: "Photosynthesis Equation" | Back: "6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂"
- Front: "Why is photosynthesis important?" | Back: "It produces oxygen and forms the base of most food chains"
```

### Example Flashcard Output
```json
{
  "flashcards": {
    "cards": [
      {
        "id": "photo_def_1",
        "front": "What is photosynthesis?",
        "back": "The process by which plants convert light energy into chemical energy (glucose) using carbon dioxide and water.",
        "difficulty": "medium",
        "tags": ["biology", "plants", "process"]
      },
      {
        "id": "photo_eq_1",
        "front": "Write the balanced equation for photosynthesis",
        "back": "6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂",
        "difficulty": "hard",
        "tags": ["biology", "equation", "chemistry"]
      }
    ],
    "metadata": {
      "title": "Photosynthesis Flashcards",
      "topic": "Biology",
      "totalCount": 2
    }
  }
}
```

---

## 📊 Review Mode Prompts

### Content Analysis Prompt
```
You are an expert educational analyst. Analyze the following content about "{topic}" and provide a comprehensive review.

Content to analyze:
{fullContext}

IMPORTANT: You must respond with valid JSON only. No additional text or explanations.

The JSON should follow this exact structure:
{
  "review": {
    "summary": "A comprehensive 2-3 paragraph summary of the main content",
    "keyPoints": [
      "Key point 1 in clear, concise language",
      "Key point 2 with specific details",
      "Key point 3 highlighting important information"
    ],
    "concepts": [
      "Important concept 1",
      "Important concept 2",
      "Important concept 3"
    ],
    "strengths": [
      "Strength 1 in the content or understanding",
      "Strength 2 with specific examples",
      "Strength 3 highlighting what's done well"
    ],
    "weaknesses": [
      "Area for improvement 1",
      "Area for improvement 2",
      "Area for improvement 3"
    ],
    "studyPlan": [
      "Step 1: Specific action to take",
      "Step 2: Follow-up activity",
      "Step 3: Advanced practice suggestion",
      "Step 4: Review and mastery strategy"
    ]
  }
}

Requirements:
- Summary should be comprehensive but concise (2-3 paragraphs)
- Key points should be the most important takeaways
- Concepts should be technical terms or main ideas
- Strengths should identify what's well understood or well-explained
- Weaknesses should identify gaps or areas needing improvement
- Study plan should be actionable and progressive
- Ensure all JSON is properly formatted and valid
- Be constructive and encouraging in your analysis
```

### Example Review Output
```json
{
  "review": {
    "summary": "The content provides a comprehensive overview of photosynthesis, explaining both the light-dependent and light-independent reactions. It covers the chemical equation, the role of chlorophyll, and the importance of this process for life on Earth. The explanation progresses from basic concepts to more complex biochemical details, making it accessible to readers with varying levels of background knowledge.",
    "keyPoints": [
      "Photosynthesis converts light energy into chemical energy stored in glucose",
      "The process occurs in chloroplasts and involves two main stages",
      "Light-dependent reactions capture solar energy and produce ATP and NADPH",
      "Light-independent reactions (Calvin cycle) use ATP and NADPH to fix carbon"
    ],
    "concepts": [
      "Photosynthesis",
      "Chloroplasts",
      "Chlorophyll",
      "ATP",
      "NADPH",
      "Calvin Cycle",
      "Carbon Fixation"
    ],
    "strengths": [
      "Clear progression from basic to complex concepts",
      "Good use of the chemical equation for reference",
      "Comprehensive coverage of both reaction stages",
      "Practical examples showing real-world relevance"
    ],
    "weaknesses": [
      "Could benefit from more visual aids or diagrams",
      "Limited explanation of environmental factors affecting photosynthesis",
      "Could include more quantitative details about efficiency",
      "Missing comparison with other energy conversion processes"
    ],
    "studyPlan": [
      "Step 1: Create detailed flashcards for key terms and equations",
      "Step 2: Practice drawing and labeling the chloroplast structure",
      "Step 3: Work through problems calculating photosynthetic rates",
      "Step 4: Compare photosynthesis with cellular respiration to understand energy flow"
    ]
  }
}
```

---

## 📷 Scanner Mode Integration

### OCR Processing Flow
1. **Image Capture**: User uploads image or uses camera
2. **Text Extraction**: Tesseract.js processes the image
3. **Content Analysis**: Extracted text is prepared for AI processing
4. **Mode Selection**: User chooses next learning action
5. **Context Transfer**: Text is passed to selected mode

### AI Action Prompts
- **Explain**: Uses explain mode prompt with extracted text
- **Quiz**: Uses quiz mode prompt with document context
- **Flashcards**: Uses flashcard mode prompt with key concepts
- **Review**: Uses review mode prompt for comprehensive analysis

---

## 🎨 Prompt Engineering Best Practices

### Structure Guidelines
1. **Clear Instructions**: Specific, unambiguous requirements
2. **JSON Schema**: Exact structure definitions for structured outputs
3. **Examples**: Sample outputs to guide AI responses
4. **Constraints**: Clear limits and formatting requirements
5. **Error Handling**: Fallback responses for edge cases

### Content Guidelines
1. **Educational Focus**: Always prioritize learning outcomes
2. **Adaptability**: Adjust to different difficulty levels
3. **Engagement**: Make content interactive and interesting
4. **Accuracy**: Ensure factual correctness
5. **Completeness**: Provide comprehensive coverage

### Technical Guidelines
1. **Type Safety**: Use TypeScript interfaces for validation
2. **Error Recovery**: Handle malformed responses gracefully
3. **Performance**: Optimize for quick response times
4. **Scalability**: Design for easy extension and modification
5. **Testing**: Include test cases for all prompt variations

---

## 🔄 Prompt Optimization

### A/B Testing Strategies
- Test different prompt variations
- Measure response quality and accuracy
- Optimize for user engagement
- Iterate based on feedback

### Quality Metrics
- Response relevance and accuracy
- JSON parsing success rate
- User satisfaction scores
- Learning outcome effectiveness

### Continuous Improvement
- Monitor AI response patterns
- Update prompts based on user feedback
- Add new features and capabilities
- Maintain prompt versioning

---

This prompt system ensures that each mode delivers consistent, high-quality, educational content that's specifically tailored to its intended learning purpose.
