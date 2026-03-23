# brAIny v2.1 - AI-Powered Multi-Modal Learning Platform

<div align="center">

![brAIny Logo](https://img.shields.io/badge/brAIny-v2.1-blue?style=for-the-badge&logo=education)
![Next.js](https://img.shields.io/badge/Next.js-14.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.3-38B2AC?style=for-the-badge&logo=tailwind-css)

**The world's most advanced AI study platform - combining ChatGPT's intelligence, Notion's versatility, and Duolingo's engagement**

[📖 Modes Guide](./MODES_GUIDE.md) • [🔧 Implementation](./IMPLEMENTATION_SUMMARY.md) • [🧪 Testing](./TESTING_GUIDE.md) • [💬 Prompt Examples](./PROMPT_EXAMPLES.md)

</div>

## 🎯 Overview

brAIny v2.1 is a revolutionary AI study platform that transforms how students learn. With five specialized learning modes, advanced OCR capabilities, and intelligent content generation, it provides a personalized learning experience that adapts to individual needs.

### ✨ Key Features

- 🧠 **5 Specialized Learning Modes**: Each with unique interfaces and AI prompts
- 📎 **ChatGPT-Style File Upload**: Support for PDF, DOCX, PPTX, TXT, PNG, JPG
- 📷 **Advanced OCR Scanner**: Convert images to editable text with AI integration
- 🎮 **Interactive Quizzes**: Structured JSON responses with instant feedback
- 🎴 **Smart Flashcards**: Spaced repetition with mastery tracking
- 📊 **Content Analysis**: AI-powered review and study planning
- 🎨 **Premium UI**: Glass morphism design with smooth animations
- 📱 **Fully Responsive**: Optimized for mobile, tablet, and desktop

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/brainy-v2.1.git
cd brainy-v2.1

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Configure your environment
# Add your Supabase and Gemini API keys
```

### Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Optional: Custom domains
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### Running the App

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

Visit [http://localhost:3000](http://localhost:3000) to start using brAIny.

## 🎯 Learning Modes

### 1. Explain Mode - AI Tutor 🧠
**Path**: `/modes/explain`

Conversational AI tutoring with personalized explanations and file upload support.

**Features**:
- Natural language conversations
- File upload and analysis
- Quick action buttons (simpler, examples, deeper)
- Context-aware responses

### 2. Quiz Mode - Interactive Testing 🎮
**Path**: `/modes/quiz`

Generate and take adaptive quizzes with structured JSON responses.

**Features**:
- Interactive multiple-choice questions
- Real-time feedback and scoring
- Progress tracking
- Detailed explanations

### 3. Flashcards Mode - Smart Repetition 🎴
**Path**: `/modes/flashcards`

AI-generated flashcards with spaced repetition and mastery tracking.

**Features**:
- 3D card flip animations
- Mastery rating system
- Progress analytics
- Session summaries

### 4. Scanner Mode - Document Digitization 📷
**Path**: `/modes/scan`

Advanced OCR scanning with editable PDF generation.

**Features**:
- Camera and file upload
- Text extraction with Tesseract.js
- Editable PDF generation
- Direct mode integration

### 5. Review Mode - Content Analysis 📊
**Path**: `/modes/review`

Comprehensive content analysis with personalized study planning.

**Features**:
- AI-powered summarization
- Strength/weakness analysis
- Personalized study plans
- Concept mapping

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Glass Morphism Design
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API
- **OCR**: Tesseract.js
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (recommended)

### Project Structure

```
brAIny-v2.1/
├── app/                    # Next.js app directory
│   ├── modes/             # Mode-specific pages
│   │   ├── explain/       # AI tutor mode
│   │   ├── quiz/          # Interactive quiz mode
│   │   ├── flashcards/    # Smart flashcards
│   │   ├── scan/          # OCR scanner
│   │   └── review/        # Content analysis
│   ├── api/modes/         # Mode-specific APIs
│   └── (other pages)
├── components/
│   ├── renderers/         # Response renderers
│   ├── ui/               # Reusable UI components
│   └── (other components)
├── lib/                  # Utility functions
├── types/                # TypeScript definitions
└── public/               # Static assets
```

## 📎 File Upload System

### Supported Formats
- **Documents**: PDF, DOCX, PPTX, TXT
- **Images**: PNG, JPG, JPEG
- **Max Size**: 10MB per file
- **Max Files**: 5 per upload

### Features
- Drag & drop interface
- File preview with metadata
- Progress indicators
- Error handling
- Content extraction for AI processing

## 🤖 AI Integration

### Google Gemini API
- **Model**: gemini-1.5-flash
- **Capabilities**: Text generation, analysis, content creation
- **Rate Limits**: Handled gracefully
- **Error Recovery**: Fallback responses included

### Mode-Specific Prompts
Each mode uses specialized prompts optimized for its learning purpose:

- **Explain**: Conversational tutoring prompts
- **Quiz**: Structured JSON quiz generation
- **Flashcards**: Q&A pair creation
- **Review**: Content analysis prompts

See [PROMPT_EXAMPLES.md](./PROMPT_EXAMPLES.md) for detailed prompt examples.

## 🎨 Design System

### UI Principles
- **Glass Morphism**: Modern frosted glass effects
- **Micro-interactions**: Smooth transitions and animations
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG 2.1 AA compliance

### Color Scheme
- **Explain Mode**: Blue accents (#3B82F6)
- **Quiz Mode**: Green accents (#10B981)
- **Flashcards Mode**: Purple accents (#8B5CF6)
- **Scanner Mode**: Orange accents (#F97316)
- **Review Mode**: Indigo accents (#6366F1)

## 📱 Responsive Design

### Breakpoints
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

### Features
- Touch-optimized interactions
- Adaptive layouts
- Readable typography
- Efficient navigation

## 🔒 Security

### Implementation
- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Role-based access control
- **Input Validation**: Server-side validation
- **File Security**: Type and size validation
- **XSS Prevention**: Input sanitization
- **CSRF Protection**: Token-based protection

## 📊 Performance

### Optimizations
- **Code Splitting**: Lazy loading of components
- **Image Optimization**: Next.js Image component
- **Caching**: API response caching
- **Bundle Analysis**: Optimized dependencies
- **Loading States**: Skeleton screens and indicators

### Metrics
- **Page Load**: < 3 seconds
- **API Response**: < 2 seconds
- **File Upload**: Progress indicators
- **Memory Usage**: Optimized rendering

## 🧪 Testing

### Test Coverage
- **Unit Tests**: Component logic
- **Integration Tests**: Mode interactions
- **E2E Tests**: User workflows
- **Performance Tests**: Load and stress testing
- **Accessibility Tests**: Screen reader and keyboard

### Running Tests
```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run accessibility tests
npm run test:a11y

# Run performance tests
npm run test:perf
```

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing procedures.

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod
```

### Environment Setup
1. Connect your repository
2. Configure environment variables
3. Set up custom domain (optional)
4. Deploy and monitor

## 📈 Monitoring

### Analytics
- **User Behavior**: Mode usage and engagement
- **Performance**: Page load times and API responses
- **Errors**: Error tracking and alerting
- **Conversion**: Feature adoption rates

### Logging
- **Application Logs**: Structured logging
- **Error Logs**: Detailed error tracking
- **Performance Logs**: Response times and bottlenecks
- **User Logs**: Authentication and activity

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Make your changes
4. Add tests for new features
5. Submit pull request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with Next.js rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks
- **Conventional Commits**: Standardized commit messages

## 📝 Documentation

### Available Guides
- [📖 Modes Guide](./MODES_GUIDE.md) - Detailed mode explanations
- [🔧 Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Technical architecture
- [🧪 Testing Guide](./TESTING_GUIDE.md) - Comprehensive testing procedures
- [💬 Prompt Examples](./PROMPT_EXAMPLES.md) - AI prompt examples

### API Documentation
- **Mode APIs**: `/api/modes/*` endpoints
- **Authentication**: Supabase Auth integration
- **File Upload**: Upload and processing endpoints
- **Database**: Schema and relationships

## 🎯 Roadmap

### v2.2 Features
- [ ] Voice input support
- [ ] Real-time collaboration
- [ ] Advanced analytics dashboard
- [ ] Gamification elements
- [ ] Offline mode support

### v3.0 Vision
- [ ] Multi-language support
- [ ] AI model selection
- [ ] Advanced customization
- [ ] Enterprise features
- [ ] Mobile apps

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team**: Excellent framework and documentation
- **Supabase**: Amazing backend-as-a-service platform
- **Google**: Gemini AI API for powerful language processing
- **Tesseract.js**: Open-source OCR engine
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icon library

## 📞 Support

### Getting Help
- **Documentation**: Check available guides first
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact support@brainy.ai for enterprise inquiries

### Community
- **Discord**: Join our developer community
- **Twitter**: Follow @brAInyAI for updates
- **Blog**: Read our educational content
- **YouTube**: Watch tutorials and feature demos

---

<div align="center">

**🚀 Transform your learning experience with brAIny v2.1**

Made with ❤️ by the brAIny team

[⭐ Star this repo](https://github.com/your-username/brainy-v2.1) • [🐛 Report issues](https://github.com/your-username/brainy-v2.1/issues) • [📧 Contact us](mailto:support@brainy.ai)

</div>
- 🔐 **Secure Authentication** - Email/password and Google OAuth via Supabase
- 📱 **Mobile-First Design** - Beautiful, minimal UI with subtle glow effects

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage)
- **AI**: Google Gemini API
- **OCR**: Tesseract.js

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account and project
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd brAInyv2
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `GEMINI_API_KEY` - Your Google Gemini API key

4. Set up the database:
   - Run the SQL migrations in `supabase/migrations.sql` in your Supabase SQL editor
   - This will create all necessary tables, policies, and triggers

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
brAInyv2/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── chat/              # AI chat interface
│   ├── home/              # Home dashboard
│   ├── onboarding/        # Onboarding flow
│   ├── profile/           # User profile
│   ├── scan/              # OCR scan feature
│   └── subscription/      # Subscription management
├── components/            # React components
│   └── ui/               # UI components (Button, Card, Input)
├── lib/                   # Utility libraries
│   ├── gemini.ts         # Gemini API integration
│   ├── subscription.ts   # Subscription logic
│   └── supabase/         # Supabase clients
├── types/                 # TypeScript type definitions
└── supabase/             # Database migrations
```

## Key Features

### AI Tutor System
- **Explain Mode**: Step-by-step explanations with guided questions
- **Practice Mode**: Practice problems with hints before solutions
- **Quiz Mode**: Interactive quizzes with immediate feedback
- **Review Mode**: Spaced repetition and knowledge gap identification

### Onboarding
Collects and stores:
- Grade level
- Subjects of interest
- Study goals
- Learning style preferences

### Subscription Tiers
- **Free**: 10 AI messages/day, 5 scans/day
- **Pro**: 50 AI messages/day, 20 scans/day, advanced features
- **Master**: Unlimited usage, deep personalization

### OCR Scanning
- Upload or capture images
- Extract text with Tesseract.js
- AI actions: Explain, Summarize, Quiz, Flashcards

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `GEMINI_API_KEY` - Google Gemini API key

## Database Schema

The application uses the following main tables:
- `profiles` - User preferences and onboarding data
- `subscriptions` - User subscription tiers
- `chats` - AI conversation sessions
- `messages` - Individual messages in chats
- `scans` - OCR scan history
- `daily_usage` - Daily usage tracking for limits

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Design System

The app uses a minimal, calm design with:
- Soft blue/purple color palette
- Rounded components
- Subtle glow effects on primary actions
- Mobile-first responsive layout

## License

This project is private and proprietary.

## Support

For issues or questions, please contact the development team.
