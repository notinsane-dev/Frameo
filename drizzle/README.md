# Database setup (Supabase)

1. In the Supabase SQL editor, run [`0000_enable_pgvector.sql`](./0000_enable_pgvector.sql).
2. From the project root with `DATABASE_URL` set: `npm run db:push`
3. Run [`0001_hnsw_indexes.sql`](./0001_hnsw_indexes.sql) for vector search indexes.
4. Optional: `npm run db:seed-embeddings`
