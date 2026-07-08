alter table public.notification_preferences
  add column if not exists push_enabled boolean not null default false;

create table if not exists public.notification_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  content_encoding text,
  user_agent text,
  device_label text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists idx_notification_push_subscriptions_tenant_user
  on public.notification_push_subscriptions (tenant_id, user_id, enabled, last_seen_at desc);

drop trigger if exists trg_notification_push_subscriptions_updated_at on public.notification_push_subscriptions;
create trigger trg_notification_push_subscriptions_updated_at
before update on public.notification_push_subscriptions
for each row execute function public.notifications_set_updated_at();

alter table public.notification_push_subscriptions enable row level security;

drop policy if exists notification_push_subscriptions_select on public.notification_push_subscriptions;
create policy notification_push_subscriptions_select
on public.notification_push_subscriptions
for select
to authenticated
using (
  user_id = auth.uid()
  or public.has_notification_access(auth.uid(), tenant_id, false)
);

drop policy if exists notification_push_subscriptions_manage on public.notification_push_subscriptions;
create policy notification_push_subscriptions_manage
on public.notification_push_subscriptions
for all
to authenticated
using (
  user_id = auth.uid()
  or public.has_notification_access(auth.uid(), tenant_id, true)
)
with check (
  user_id = auth.uid()
  or public.has_notification_access(auth.uid(), tenant_id, true)
);