# Frameo

AI-powered movie recommendations — decide what to watch next with taste matching, social reviews, and charts.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Tech stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **UI**: Tailwind CSS + Framer Motion + GSAP
- **API**: tRPC + TanStack Query
- **Auth**: Better Auth (email + Google OAuth)
- **Database**: Supabase Postgres + Drizzle ORM + pgvector
- **Cache**: Redis (ioredis)
- **AI**: Google Gemini
- **Movies**: TMDB (+ OMDB for external ratings)
- **Email**: Resend
- **Media**: Cloudinary
- **Monitoring**: Sentry (optional)
- **Deploy**: Vercel + Supabase + Redis

## Getting started

1. Clone the repo
2. Create a [Supabase](https://supabase.com) project and enable pgvector (`create extension if not exists vector;`)
3. Copy `.env.example` → `.env.local` and fill in values (use the Supabase **Transaction pooler** for `DATABASE_URL`)
4. `npm install`
5. Push schema: `npm run db:push`
6. Create HNSW indexes: run [`drizzle/0001_hnsw_indexes.sql`](drizzle/0001_hnsw_indexes.sql) in the Supabase SQL editor
7. Optional: `npm run db:seed-embeddings`
8. `npm run dev` → [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development |
| `npm run build` / `start` | Production build |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Push schema to Supabase |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed-embeddings` | Embed popular/trending TMDB movies |

## Environment variables

All keys are listed in [`.env.example`](.env.example). You will need accounts for:

- [Supabase](https://supabase.com) — Postgres + pgvector
- [TMDB API](https://www.themoviedb.org/settings/api)
- [OMDB](https://www.omdbapi.com/apikey.aspx) — optional external ratings
- [Google AI Studio](https://aistudio.google.com/app/apikey) — Gemini
- [Google Cloud Console](https://console.cloud.google.com) — OAuth
- [Resend](https://resend.com) — transactional email
- [Cloudinary](https://cloudinary.com) — avatars
- Redis (local, Upstash, or similar)
- [Sentry](https://sentry.io) — optional

Generate `BETTER_AUTH_SECRET` with a long random string (32+ characters).

## Recommendations

Personalized picks use **pgvector** cosine similarity over movie + user taste embeddings, then Gemini for natural-language reasons. Redis caches results for 30 minutes.

## Security

See [SECURITY.md](SECURITY.md) for how to report vulnerabilities. Never commit `.env.local` or real API keys.

## License

MIT — see [LICENSE](LICENSE).

Movie data courtesy of [TMDB](https://www.themoviedb.org/). This product uses the TMDB API but is not endorsed or certified by TMDB.
