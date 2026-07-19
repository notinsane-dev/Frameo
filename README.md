# 🎬 CineAI — AI-Powered Movie Recommendations

## Tech Stack
- **Framework**: Next.js 16.2 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui + Framer Motion + GSAP
- **API**: tRPC v11 + TanStack Query
- **Auth**: Better Auth (Google OAuth)
- **Database**: MongoDB (Mongoose)
- **Cache**: Redis (ioredis)
- **AI**: Google Gemini API (gemini-2.0-flash)
- **Movies**: TMDB API
- **Monitoring**: Sentry
- **Deployment**: Vercel + CreeperCastle VPS

## Getting Started
1. Clone the repo
2. Copy .env.example → .env.local and fill in values
3. npm install
4. npm run dev

## Environment Variables
See .env.example for all required variables.

## API Keys Required
- TMDB API: https://www.themoviedb.org/settings/api
- Gemini API: https://aistudio.google.com/app/apikey
- Google OAuth: https://console.cloud.google.com
- Sentry DSN: https://sentry.io

## Deployment
- Frontend: Vercel (auto-deploy from main branch)
- MongoDB + Redis: CreeperCastle VPS via PM2
