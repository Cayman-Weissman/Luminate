# Luminate: AI-Driven Educational Platform

Luminate is an innovative educational platform that leverages artificial intelligence to deliver personalized learning experiences. The platform helps users access adaptive content, track their progress, and engage with a community of learners.

## Key Features

- **Personalized Learning Dashboard**: Track your progress, continue courses, and follow guided learning roadmaps
- **AI-Generated Educational Content**: Generate summaries, quizzes, and learning paths tailored to your needs using cutting-edge AI
- **Trending Topics**: Stay updated with the most popular learning topics and their growth trends
- **Community Interaction**: Share knowledge and engage with fellow learners in discussion boards
- **Comprehensive Course Library**: Access a variety of courses across multiple disciplines

## Technology Stack

- **Frontend**: React.js with Tailwind CSS, Shadcn UI components
- **Backend**: Express.js with RESTful API endpoints
- **Database**: PostgreSQL with Drizzle ORM for data persistence
- **Authentication**: JWT-based authentication for secure access
- **AI Integration**: HuggingFace models for content generation and analysis

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations: `npm run db:push`
5. Start the development server: `npm run dev`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in a user
- `GET /api/auth/me` - Get current user information

### User Data
- `GET /api/user/stats` - Get user statistics
- `GET /api/user/courses/active` - Get user's active courses
- `GET /api/user/roadmap` - Get user's learning roadmap

### AI Features
- `POST /api/ai/summarize` - Generate content summaries
- `POST /api/ai/learning-path` - Generate personalized learning paths
- `POST /api/ai/verify-answer` - Verify a user's answer to a question
- `POST /api/ai/quiz` - Generate quizzes on specific topics
- `POST /api/ai/course-content` - Generate course content
- `POST /api/ai/analyze-progress` - Analyze user learning progress

## Project Structure

```
├── client/                  # Frontend React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions and types
│   │   ├── pages/           # Page components
│   │   └── App.tsx          # Main application component
├── server/                  # Backend Express application
│   ├── services/            # Service modules (auth, AI, etc.)
│   ├── routes.ts            # API route definitions
│   ├── storage.ts           # Database interface
│   └── index.ts             # Server entry point
├── shared/                  # Shared code between client and server
│   └── schema.ts            # Database schema definitions
└── migrations/              # Database migration files
```