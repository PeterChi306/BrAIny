# brAIny v2.1 - Modes Guide

## Overview

brAIny v2.1 features five distinct learning modes, each with its own specialized interface, AI prompts, and response formats. This guide explains each mode and how to use them effectively.

## 🎯 Learning Modes

### 1. Explain Mode (`/modes/explain`)
**Purpose**: Personalized AI tutoring and explanations

**Features**:
- Conversational AI tutor interface
- File upload support (PDF, DOCX, PPTX, TXT, PNG, JPG)
- Quick action buttons for different explanation styles
- Context-aware conversations
- Real-time file processing

**Best For**:
- Getting detailed explanations of complex topics
- Asking follow-up questions
- Learning at your own pace
- Uploading study materials for discussion

**How to Use**:
1. Type your question or upload files
2. Use quick actions for simpler explanations or real-world examples
3. Ask follow-up questions to deepen understanding

---

### 2. Quiz Mode (`/modes/quiz`)
**Purpose**: Interactive knowledge testing with immediate feedback

**Features**:
- Structured JSON quiz generation
- Multiple-choice questions with instant feedback
- Progress tracking and scoring
- Detailed explanations for each answer
- Results analysis with performance insights

**Best For**:
- Testing knowledge after studying
- Identifying knowledge gaps
- Exam preparation
- Competitive learning

**How to Use**:
1. Enter a topic or upload study materials
2. Choose difficulty level (Easy/Medium/Hard)
3. Answer questions and get immediate feedback
4. Review your results and focus on weak areas

---

### 3. Flashcards Mode (`/modes/flashcards`)
**Purpose**: Spaced repetition learning with mastery tracking

**Features**:
- AI-generated flashcard pairs
- Swipeable card interface with 3D animations
- Mastery rating system (Easy/Medium/Hard)
- Progress tracking and session summaries
- Automatic spacing based on performance

**Best For**:
- Memorizing key facts and vocabulary
- Quick review sessions
- Building long-term retention
- Self-paced learning

**How to Use**:
1. Provide study content or upload files
2. Review generated flashcards
3. Rate each card by difficulty
4. Track your mastery percentage

---

### 4. Scanner Mode (`/modes/scan`)
**Purpose**: Document digitization and text extraction

**Features**:
- Advanced OCR text extraction
- Camera capture and file upload
- Editable PDF generation
- Direct integration with other modes
- Multi-format support

**Best For**:
- Digitizing handwritten notes
- Converting printed materials to text
- Creating study materials from physical documents
- Quick text extraction

**How to Use**:
1. Upload images or use camera capture
2. Wait for OCR processing
3. Review extracted text
4. Choose next action (explain, quiz, flashcards, review)

---

### 5. Review Mode (`/modes/review`)
**Purpose**: Comprehensive content analysis and study planning

**Features**:
- AI-powered content summarization
- Key point extraction
- Strength and weakness analysis
- Personalized study plans
- Concept mapping

**Best For**:
- Analyzing essays and assignments
- Creating study schedules
- Identifying improvement areas
- Comprehensive content review

**How to Use**:
1. Upload content or paste text
2. Receive detailed analysis
3. Review strengths and weaknesses
4. Follow personalized study plan

## 🔄 Mode Integration

### Seamless Transitions
- **Scanner → Any Mode**: Extracted text can be sent to any other mode
- **Review → Practice**: Weak areas identified in review mode can generate quizzes
- **Explain → Flashcards**: Key concepts from explanations can become flashcards
- **Quiz → Review**: Quiz results inform review analysis

### File Support
All modes support:
- **PDF**: Full text extraction and analysis
- **DOCX**: Document content processing
- **PPTX**: Slide content extraction
- **TXT**: Direct text input
- **PNG/JPG**: OCR text extraction

## 🎨 UI/UX Features

### Design Principles
- **Glass Morphism**: Modern frosted glass effects
- **Responsive Design**: Mobile-first approach
- **Micro-interactions**: Smooth transitions and animations
- **Accessibility**: ARIA labels and keyboard navigation

### Common Elements
- **Progress Indicators**: Visual progress tracking
- **Loading States**: Beautiful skeleton screens
- **Error Handling**: Graceful error messages and recovery
- **Quick Actions**: Contextual action buttons

## 📊 Performance Tracking

### Data Collection
- **Quiz Scores**: Track performance over time
- **Flashcard Mastery**: Monitor learning progress
- **Study Sessions**: Time spent and topics covered
- **Weakness Areas**: Identify topics needing improvement

### Analytics
- **Learning Patterns**: AI identifies optimal study times
- **Difficulty Adaptation**: Content adjusts to skill level
- **Progress Visualization**: Charts and graphs for motivation
- **Goal Setting**: Personalized learning objectives

## 🔧 Technical Architecture

### API Structure
```
/api/modes/
├── explain/route.ts     # Conversational AI responses
├── quiz/route.ts        # Structured quiz generation
├── flashcards/route.ts  # Flashcard pair creation
└── review/route.ts      # Content analysis
```

### Response Formats
Each mode returns optimized response formats:
- **Text**: Natural language conversations
- **Quiz**: Structured JSON with questions and metadata
- **Flashcards**: Card pairs with difficulty ratings
- **Review**: Analysis with study recommendations

### Component Architecture
```
/components/
├── renderers/          # Mode-specific UI components
├── ui/                # Reusable UI elements
└── modes/             # Mode-specific logic
```

## 🚀 Getting Started

### First Time Use
1. **Complete Onboarding**: Set up your learning profile
2. **Choose Your Goal**: Select what you want to learn
3. **Pick a Mode**: Start with the mode that fits your goal
4. **Upload Materials**: Add your study content
5. **Start Learning**: Engage with AI-powered features

### Pro Tips
- **Combine Modes**: Use multiple modes for comprehensive learning
- **Regular Practice**: Daily sessions improve retention
- **Track Progress**: Monitor your learning analytics
- **Upload Materials**: Leverage file upload for better context

## 🎯 Best Practices

### For Students
- Start with **Explain Mode** for new topics
- Use **Quiz Mode** to test understanding
- Practice with **Flashcard Mode** for memorization
- Scan materials with **Scanner Mode** for digitization
- Review progress with **Review Mode**

### For Teachers
- Create quizzes from lesson materials
- Generate flashcards for key concepts
- Scan student work for analysis
- Provide personalized study plans
- Track class progress

### For Self-Learners
- Set clear learning goals
- Use all modes for comprehensive study
- Track progress regularly
- Adjust difficulty based on performance
- Maintain consistent study schedule

## 🔮 Future Enhancements

### Planned Features
- **Collaborative Learning**: Study groups and sharing
- **Voice Input**: Speech-to-text for all modes
- **Offline Mode**: Download content for offline study
- **Advanced Analytics**: Deeper learning insights
- **Gamification**: Points, badges, and achievements

### Mode Expansions
- **Math Mode**: Specialized math problem solving
- **Language Mode**: Language learning features
- **Coding Mode**: Programming education
- **Science Lab**: Virtual science experiments

## 📞 Support

### Getting Help
- **In-App Guidance**: Contextual help and tutorials
- **Mode Tours**: Interactive walkthroughs
- **FAQ Section**: Common questions and answers
- **Contact Support**: Direct help when needed

### Troubleshooting
- **File Upload Issues**: Check file formats and sizes
- **OCR Problems**: Ensure clear, high-quality images
- **AI Responses**: Provide clear, specific prompts
- **Performance**: Check internet connection and device specs

---

This guide represents the complete functionality of brAIny v2.1. Each mode is designed to provide a unique, optimized learning experience while maintaining seamless integration with the overall platform.
