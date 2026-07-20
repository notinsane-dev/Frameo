-- Auth performance / integrity indexes (run in Supabase SQL editor if db:push fails)
create index if not exists session_user_id_idx on session (user_id);
create index if not exists account_user_id_idx on account (user_id);
create unique index if not exists account_provider_account_uidx on account (provider_id, account_id);
create index if not exists verification_identifier_idx on verification (identifier);
