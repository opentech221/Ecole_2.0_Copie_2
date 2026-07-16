-- ============================================================
-- Migration 014 : Versioned runtime kv_store
-- École 2.0 — align repo with live Supabase runtime storage
-- ============================================================

create table if not exists public.kv_store_48b2f2dd (
  key text primary key,
  value jsonb not null
);

alter table public.kv_store_48b2f2dd enable row level security;

create index if not exists kv_store_48b2f2dd_key_idx
  on public.kv_store_48b2f2dd (key text_pattern_ops);

grant delete, insert, select, update on public.kv_store_48b2f2dd to anon;
grant delete, insert, select, update on public.kv_store_48b2f2dd to authenticated;
grant delete, insert, select, update on public.kv_store_48b2f2dd to service_role;