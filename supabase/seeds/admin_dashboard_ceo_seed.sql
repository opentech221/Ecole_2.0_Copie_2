-- Seed minimal pour dashboard CEO (KPIs + funnel + cohortes)
with first_tenant as (
  select id, country_code
  from public.tenants
  where deleted_at is null
  order by created_at asc
  limit 1
),
tenant_users as (
  select ur.user_id, ur.tenant_id
  from public.user_roles ur
  join first_tenant ft on ft.id = ur.tenant_id
  limit 12
)
insert into public.tenant_user_accounts (tenant_id, user_id, status, country_code, acquisition_channel, last_seen_at, metadata)
select
  tu.tenant_id,
  tu.user_id,
  case when row_number() over (order by tu.user_id) <= 9 then 'active' else 'suspended' end,
  (select country_code from first_tenant),
  case
    when row_number() over (order by tu.user_id) % 3 = 0 then 'referral'
    when row_number() over (order by tu.user_id) % 3 = 1 then 'organic'
    else 'sales'
  end,
  now() - ((row_number() over (order by tu.user_id)) || ' days')::interval,
  jsonb_build_object('seed', true, 'segment', 'ceo-demo')
from tenant_users tu
on conflict (tenant_id, user_id) do update
set
  status = excluded.status,
  acquisition_channel = excluded.acquisition_channel,
  metadata = public.tenant_user_accounts.metadata || excluded.metadata;

insert into public.kpi_events (tenant_id, user_id, event_name, amount_cents, occurred_at, properties)
select
  tu.tenant_id,
  tu.user_id,
  ev.event_name,
  ev.amount_cents,
  now() - ev.offset_interval,
  jsonb_build_object('seed', true, 'channel', ev.channel)
from tenant_users tu
cross join lateral (
  values
    ('signup_started'::text, null::integer, interval '45 days', 'organic'::text),
    ('signup_completed'::text, null::integer, interval '44 days', 'organic'::text),
    ('trial_started'::text, null::integer, interval '42 days', 'organic'::text),
    ('subscription_activated'::text, null::integer, interval '39 days', 'organic'::text),
    ('payment_success'::text, 120000::integer, interval '28 days', 'organic'::text),
    ('payment_success'::text, 120000::integer, interval '5 days', 'organic'::text)
) as ev(event_name, amount_cents, offset_interval, channel)
on conflict do nothing;

insert into public.kpi_events (tenant_id, user_id, event_name, amount_cents, occurred_at, properties)
select
  tu.tenant_id,
  tu.user_id,
  'payment_failed',
  120000,
  now() - interval '3 days',
  jsonb_build_object('seed', true, 'channel', 'card')
from tenant_users tu
where random() < 0.25
on conflict do nothing;

insert into public.kpi_events (tenant_id, user_id, event_name, occurred_at, properties)
select
  tu.tenant_id,
  tu.user_id,
  'churned',
  now() - interval '2 days',
  jsonb_build_object('seed', true)
from tenant_users tu
where random() < 0.15
on conflict do nothing;
