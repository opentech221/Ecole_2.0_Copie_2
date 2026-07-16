create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (
    type in (
      'paiement_reussi',
      'paiement_echoue',
      'facture_generee',
      'abonnement_expire_bientot',
      'abonnement_suspendu',
      'nouvel_utilisateur',
      'rappel_impaye',
      'systeme'
    )
  ),
  title text not null,
  message text not null,
  data jsonb not null default '{}'::jsonb,
  priority text not null default 'normale' check (priority in ('faible', 'normale', 'haute', 'critique')),
  status text not null default 'non_lue' check (status in ('non_lue', 'lue', 'archivee')),
  channel text not null default 'in_app' check (channel in ('in_app', 'email')),
  action_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  archived_at timestamptz
);

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default false,
  muted_types text[] not null default '{}'::text[],
  daily_digest_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create table if not exists public.notification_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  channel text not null check (channel in ('in_app', 'email')),
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'read')),
  provider text,
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_tenant_user_status_created
  on public.notifications (tenant_id, user_id, status, created_at desc);

create index if not exists idx_notifications_type on public.notifications (type);
create index if not exists idx_notifications_user_created on public.notifications (user_id, created_at desc);
create index if not exists idx_notification_delivery_logs_notification
  on public.notification_delivery_logs (notification_id, created_at desc);

create or replace function public.notifications_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_notification_preferences_updated_at on public.notification_preferences;
create trigger trg_notification_preferences_updated_at
before update on public.notification_preferences
for each row execute function public.notifications_set_updated_at();

create or replace function public.has_notification_access(
  p_uid uuid,
  p_tenant_id uuid,
  p_write boolean default false
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select (
    public.has_tenant_role(
      p_uid,
      p_tenant_id,
      case
        when p_write then array['owner', 'super_admin', 'admin_finance']
        else array['owner', 'super_admin', 'admin_finance', 'support']
      end
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = p_uid
        and p.role = 'director'
    )
  );
$$;

create or replace function public.dispatch_notification(
  p_tenant_id uuid,
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_data jsonb default '{}'::jsonb,
  p_priority text default 'normale',
  p_action_url text default null,
  p_channel text default 'in_app',
  p_created_by uuid default auth.uid()
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_id uuid;
begin
  if p_type not in (
    'paiement_reussi',
    'paiement_echoue',
    'facture_generee',
    'abonnement_expire_bientot',
    'abonnement_suspendu',
    'nouvel_utilisateur',
    'rappel_impaye',
    'systeme'
  ) then
    raise exception 'invalid_notification_type';
  end if;

  if p_priority not in ('faible', 'normale', 'haute', 'critique') then
    raise exception 'invalid_notification_priority';
  end if;

  if p_channel not in ('in_app', 'email') then
    raise exception 'invalid_notification_channel';
  end if;

  insert into public.notifications (
    tenant_id,
    user_id,
    type,
    title,
    message,
    data,
    priority,
    status,
    channel,
    action_url,
    created_by
  )
  values (
    p_tenant_id,
    p_user_id,
    p_type,
    p_title,
    p_message,
    coalesce(p_data, '{}'::jsonb),
    p_priority,
    'non_lue',
    p_channel,
    nullif(trim(p_action_url), ''),
    p_created_by
  )
  returning id into v_id;

  insert into public.notification_delivery_logs (
    notification_id,
    tenant_id,
    channel,
    status,
    sent_at
  )
  values (
    v_id,
    p_tenant_id,
    p_channel,
    case when p_channel = 'in_app' then 'sent' else 'queued' end,
    case when p_channel = 'in_app' then now() else null end
  );

  return v_id;
end;
$$;

alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_delivery_logs enable row level security;

drop policy if exists notifications_select_scope on public.notifications;
create policy notifications_select_scope
on public.notifications
for select
to authenticated
using (
  (user_id = auth.uid() and public.has_notification_access(auth.uid(), tenant_id, false))
  or public.has_notification_access(auth.uid(), tenant_id, false)
);

drop policy if exists notifications_insert_admin on public.notifications;
create policy notifications_insert_admin
on public.notifications
for insert
to authenticated
with check (public.has_notification_access(auth.uid(), tenant_id, true));

drop policy if exists notifications_update_scope on public.notifications;
create policy notifications_update_scope
on public.notifications
for update
to authenticated
using (
  user_id = auth.uid()
  or public.has_notification_access(auth.uid(), tenant_id, true)
)
with check (
  user_id = auth.uid()
  or public.has_notification_access(auth.uid(), tenant_id, true)
);

drop policy if exists notification_preferences_select on public.notification_preferences;
create policy notification_preferences_select
on public.notification_preferences
for select
to authenticated
using (
  user_id = auth.uid()
  or public.has_notification_access(auth.uid(), tenant_id, false)
);

drop policy if exists notification_preferences_manage on public.notification_preferences;
create policy notification_preferences_manage
on public.notification_preferences
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

drop policy if exists notification_delivery_logs_select on public.notification_delivery_logs;
create policy notification_delivery_logs_select
on public.notification_delivery_logs
for select
to authenticated
using (public.has_notification_access(auth.uid(), tenant_id, false));

drop policy if exists notification_delivery_logs_insert on public.notification_delivery_logs;
create policy notification_delivery_logs_insert
on public.notification_delivery_logs
for insert
to authenticated
with check (public.has_notification_access(auth.uid(), tenant_id, true));
