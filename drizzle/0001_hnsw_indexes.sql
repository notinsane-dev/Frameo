-- Run after tables exist (drizzle-kit push / migrate).
create index if not exists movies_embedding_hnsw
  on movies
  using hnsw (embedding vector_cosine_ops);

create index if not exists user_embeddings_hnsw
  on user_embeddings
  using hnsw (embedding vector_cosine_ops);
