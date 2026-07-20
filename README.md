# CineAI — AI-Powered Movie Recommendations

## Tech Stack
- **Framework**: Next.js 16.2 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui + Framer Motion + GSAP
- **API**: tRPC v11 + TanStack Query
- **Auth**: Better Auth (email + Google OAuth)
- **Database**: Supabase Postgres + Drizzle ORM + pgvector
- **Cache**: Redis (ioredis)
- **AI**: Google Gemini (`gemini-2.0-flash` + `gemini-embedding-001`)
- **Movies**: TMDB API
- **Monitoring**: Sentry
- **Deployment**: Vercel (app) + Supabase (DB) + Redis

## Getting Started
1. Clone the repo
2. Create a Supabase project and enable the `vector` extension (SQL editor: `create extension if not exists vector;`)
3. Copy `.env.example` → `.env.local` and fill in values (use the Supabase **Transaction pooler** `DATABASE_URL`)
4. `npm install`
5. Push schema: `npm run db:push` (uses session port `5432` + `public` schema only — avoids a known Supabase drizzle-kit crash)
6. Create HNSW indexes (Supabase SQL editor): run [`drizzle/0001_hnsw_indexes.sql`](drizzle/0001_hnsw_indexes.sql)
7. Optional: seed movie embeddings — `npm run db:seed-embeddings`
8. `npm run dev`

## Database scripts
- `npm run db:generate` — generate Drizzle migrations
- `npm run db:push` — push schema to Supabase
- `npm run db:migrate` — run migrations
- `npm run db:studio` — open Drizzle Studio
- `npm run db:seed-embeddings` — embed popular/trending TMDB movies

## Environment Variables
See `.env.example` for all required variables.

## API Keys Required
- Supabase: https://supabase.com (project + DB password)
- TMDB API: https://www.themoviedb.org/settings/api
- Gemini API: https://aistudio.google.com/app/apikey
- Google OAuth: https://console.cloud.google.com
- Sentry DSN: https://sentry.io

## Recommendations
Personalized recs use **pgvector** cosine similarity over movie + user taste embeddings, then Gemini for natural-language reasons. Redis caches results for 30 minutes.

## Deployment
- Frontend: Vercel (auto-deploy from main branch)
- Database: Supabase Postgres (pgvector enabled)
- Cache: Redis (e.g. Upstash or self-hosted)
