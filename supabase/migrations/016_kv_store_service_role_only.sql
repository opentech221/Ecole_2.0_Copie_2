-- ============================================================
-- Migration 016 : Harden kv_store to service_role only
-- École 2.0
-- ============================================================

alter table public.kv_store_48b2f2dd enable row level security;

revoke all on table public.kv_store_48b2f2dd from public;
revoke all on table public.kv_store_48b2f2dd from anon;
revoke all on table public.kv_store_48b2f2dd from authenticated;

grant select, insert, update, delete on table public.kv_store_48b2f2dd to service_role;

drop policy if exists kv_store_service_role_all on public.kv_store_48b2f2dd;
create policy kv_store_service_role_all
  on public.kv_store_48b2f2dd
  for all
  to service_role
  using (true)
  with check (true);
