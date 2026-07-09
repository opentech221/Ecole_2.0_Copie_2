create table if not exists public.tenant_user_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'suspended', 'pending_invite', 'deleted')),
  country_code text not null default 'SN',
  acquisition_channel text not null default 'direct',
  suspended_reason text,
  suspended_at timestamptz,
  reactivated_at timestamptz,
  last_seen_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, user_id)
);

create table if not exists public.kpi_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null check (event_name in (
    'signup_started',
    'signup_completed',
    'trial_started',
    'subscription_activated',
    'payment_success',
    'payment_failed',
    'subscription_canceled',
    'churned'
  )),
  amount_cents integer,
  occurred_at timestamptz not null default now(),
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_tenant_user_accounts_tenant_status
  on public.tenant_user_accounts(tenant_id, status, created_at desc)
  where deleted_at is null;

create index if not exists idx_tenant_user_accounts_country_channel
  on public.tenant_user_accounts(tenant_id, country_code, acquisition_channel)
  where deleted_at is null;

create index if not exists idx_kpi_events_tenant_event_occurred
  on public.kpi_events(tenant_id, event_name, occurred_at desc);

create index if not exists idx_kpi_events_tenant_user
  on public.kpi_events(tenant_id, user_id, occurred_at desc);

drop trigger if exists trg_tenant_user_accounts_updated_at on public.tenant_user_accounts;
create trigger trg_tenant_user_accounts_updated_at
before update on public.tenant_user_accounts
for each row execute function public.set_row_updated_at();

alter table public.tenant_user_accounts enable row level security;
alter table public.kpi_events enable row level security;

drop policy if exists tenant_user_accounts_select_member on public.tenant_user_accounts;
create policy tenant_user_accounts_select_member on public.tenant_user_accounts
for select to authenticated
using (
  public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance', 'support'])
);

drop policy if exists tenant_user_accounts_manage_admin on public.tenant_user_accounts;
create policy tenant_user_accounts_manage_admin on public.tenant_user_accounts
for all to authenticated
using (
  public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance'])
)
with check (
  public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance'])
);

drop policy if exists kpi_events_select_member on public.kpi_events;
create policy kpi_events_select_member on public.kpi_events
for select to authenticated
using (
  public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance', 'support'])
);

drop policy if exists kpi_events_insert_admin on public.kpi_events;
create policy kpi_events_insert_admin on public.kpi_events
for insert to authenticated
with check (
  public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance'])
);

insert into public.tenant_user_accounts (
  tenant_id,
  user_id,
  status,
  country_code,
  acquisition_channel,
  metadata
)
select distinct
  ur.tenant_id,
  ur.user_id,
  'active',
  coalesce(t.country_code, 'SN'),
  'direct',
  jsonb_build_object('bootstrapped', true)
from public.user_roles ur
join public.tenants t on t.id = ur.tenant_id
left join public.tenant_user_accounts tua
  on tua.tenant_id = ur.tenant_id and tua.user_id = ur.user_id
where tua.id is null;

insert into public.kpi_events (tenant_id, user_id, event_name, occurred_at, properties)
select
  s.tenant_id,
  s.student_id,
  'subscription_activated',
  coalesce(s.started_at, s.created_at, now()),
  jsonb_build_object('source', 'subscriptions_bootstrap', 'status', s.status)
from public.subscriptions s
where s.status in ('active', 'trialing', 'past_due')
on conflict do nothing;

insert into public.kpi_events (tenant_id, user_id, event_name, amount_cents, occurred_at, properties)
select
  p.tenant_id,
  p.student_id,
  case when p.status = 'paid' then 'payment_success' else 'payment_failed' end,
  p.amount_cents,
  p.created_at,
  jsonb_build_object('payment_id', p.id, 'provider', p.provider)
from public.payments p
where p.status in ('paid', 'failed');

create or replace view public.admin_funnel_daily as
select
  tenant_id,
  date_trunc('day', occurred_at)::date as day,
  count(*) filter (where event_name = 'signup_started') as signup_started,
  count(*) filter (where event_name = 'signup_completed') as signup_completed,
  count(*) filter (where event_name = 'trial_started') as trial_started,
  count(*) filter (where event_name = 'subscription_activated') as subscription_activated,
  count(*) filter (where event_name = 'payment_success') as payment_success
from public.kpi_events
group by tenant_id, date_trunc('day', occurred_at)::date;

create or replace view public.admin_cohorts_monthly as
with first_conversion as (
  select
    tenant_id,
    user_id,
    min(occurred_at) filter (where event_name in ('signup_completed', 'subscription_activated')) as first_conversion_at
  from public.kpi_events
  where user_id is not null
  group by tenant_id, user_id
),
monthly_activity as (
  select
    tenant_id,
    user_id,
    date_trunc('month', occurred_at)::date as activity_month
  from public.kpi_events
  where user_id is not null
  group by tenant_id, user_id, date_trunc('month', occurred_at)::date
)
select
  fc.tenant_id,
  date_trunc('month', fc.first_conversion_at)::date as cohort_month,
  ma.activity_month,
  count(*) as active_users
from first_conversion fc
join monthly_activity ma
  on ma.tenant_id = fc.tenant_id
 and ma.user_id = fc.user_id
where fc.first_conversion_at is not null
group by fc.tenant_id, date_trunc('month', fc.first_conversion_at)::date, ma.activity_month;
