create extension if not exists pgcrypto;

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'trialing', 'suspended', 'archived')),
  currency text not null default 'XOF',
  country_code text not null default 'SN',
  timezone text not null default 'Africa/Dakar',
  owner_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.roles (
  code text primary key,
  label text not null,
  scope text not null default 'tenant' check (scope in ('platform', 'tenant')),
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_code text not null references public.roles(code),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id, role_code)
);

alter table public.students
  add column if not exists tenant_id uuid references public.tenants(id) on delete set null,
  add column if not exists parent_email text,
  add column if not exists parent_phone text,
  add column if not exists deleted_at timestamptz;

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  billing_interval text not null check (billing_interval in ('monthly', 'annual')),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'XOF',
  trial_days integer not null default 0 check (trial_days >= 0),
  tax_rate_basis_points integer not null default 0 check (tax_rate_basis_points >= 0),
  student_limit integer,
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, code)
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  code text not null unique,
  label text not null,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value integer not null check (discount_value > 0),
  max_redemptions integer,
  times_redeemed integer not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  plan_id uuid references public.plans(id) on delete set null,
  coupon_id uuid references public.coupons(id) on delete set null,
  subscriber_name text not null,
  subscriber_email text,
  status text not null check (status in ('trialing', 'active', 'past_due', 'suspended', 'canceled', 'expired')),
  billing_cycle text not null check (billing_cycle in ('monthly', 'annual')),
  started_at timestamptz not null default now(),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  ended_at timestamptz,
  amount_cents integer not null default 0 check (amount_cents >= 0),
  currency text not null default 'XOF',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  invoice_number text not null unique,
  status text not null check (status in ('draft', 'open', 'paid', 'overdue', 'void', 'uncollectible')),
  issue_date date not null,
  due_date date not null,
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  tax_cents integer not null default 0 check (tax_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  paid_cents integer not null default 0 check (paid_cents >= 0),
  balance_cents integer not null default 0 check (balance_cents >= 0),
  currency text not null default 'XOF',
  pdf_path text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  label text not null,
  description text,
  quantity numeric(10,2) not null default 1,
  unit_amount_cents integer not null default 0 check (unit_amount_cents >= 0),
  tax_rate_basis_points integer not null default 0,
  total_cents integer not null default 0 check (total_cents >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  plan_id uuid references public.plans(id) on delete set null,
  parent_name text,
  parent_email text,
  class_id text,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'XOF',
  status text not null check (status in ('pending', 'paid', 'failed', 'refunded', 'partially_refunded', 'disputed')),
  payment_method text not null,
  provider text not null,
  provider_payment_id text,
  reconciliation_status text not null default 'matched' check (reconciliation_status in ('matched', 'unmatched', 'manual_review')),
  paid_at timestamptz,
  due_at timestamptz,
  failed_at timestamptz,
  disputed_at timestamptz,
  offline_marked_at timestamptz,
  last_attempt_at timestamptz,
  failure_reason text,
  internal_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (provider, provider_payment_id)
);

create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  provider text not null,
  attempt_number integer not null default 1,
  status text not null check (status in ('pending', 'succeeded', 'failed', 'canceled')),
  response_code text,
  response_message text,
  attempted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  reason text,
  status text not null check (status in ('pending', 'succeeded', 'failed')),
  provider_refund_id text,
  requested_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  severity text not null default 'info' check (severity in ('info', 'warn', 'critical')),
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  provider text not null,
  event_type text not null,
  provider_event_id text,
  payload jsonb not null,
  processing_status text not null default 'pending' check (processing_status in ('pending', 'processed', 'failed', 'ignored')),
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create index if not exists idx_students_tenant_id on public.students(tenant_id);
create index if not exists idx_user_roles_lookup on public.user_roles(tenant_id, user_id, role_code);
create index if not exists idx_plans_tenant_active on public.plans(tenant_id, active) where deleted_at is null;
create index if not exists idx_subscriptions_tenant_status on public.subscriptions(tenant_id, status, current_period_end desc);
create index if not exists idx_invoices_tenant_status_due on public.invoices(tenant_id, status, due_date desc);
create index if not exists idx_payments_tenant_status_created on public.payments(tenant_id, status, created_at desc);
create index if not exists idx_payments_invoice_id on public.payments(invoice_id);
create index if not exists idx_payments_provider_id on public.payments(provider_payment_id);
create index if not exists idx_payment_attempts_payment_id on public.payment_attempts(payment_id, attempted_at desc);
create index if not exists idx_refunds_payment_id on public.refunds(payment_id, created_at desc);
create index if not exists idx_audit_logs_tenant_created on public.audit_logs(tenant_id, created_at desc);
create index if not exists idx_webhook_events_status_created on public.webhook_events(processing_status, created_at desc);

drop trigger if exists trg_tenants_updated_at on public.tenants;
create trigger trg_tenants_updated_at before update on public.tenants
for each row execute function public.set_row_updated_at();

drop trigger if exists trg_plans_updated_at on public.plans;
create trigger trg_plans_updated_at before update on public.plans
for each row execute function public.set_row_updated_at();

drop trigger if exists trg_coupons_updated_at on public.coupons;
create trigger trg_coupons_updated_at before update on public.coupons
for each row execute function public.set_row_updated_at();

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at before update on public.subscriptions
for each row execute function public.set_row_updated_at();

drop trigger if exists trg_invoices_updated_at on public.invoices;
create trigger trg_invoices_updated_at before update on public.invoices
for each row execute function public.set_row_updated_at();

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at before update on public.payments
for each row execute function public.set_row_updated_at();

drop trigger if exists trg_refunds_updated_at on public.refunds;
create trigger trg_refunds_updated_at before update on public.refunds
for each row execute function public.set_row_updated_at();

create or replace function public.has_tenant_role(
  p_uid uuid,
  p_tenant_id uuid,
  p_roles text[] default null
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = p_uid
      and ur.tenant_id = p_tenant_id
      and (p_roles is null or ur.role_code = any (p_roles))
  );
$$;

alter table public.tenants enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.plans enable row level security;
alter table public.coupons enable row level security;
alter table public.subscriptions enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.refunds enable row level security;
alter table public.audit_logs enable row level security;
alter table public.webhook_events enable row level security;

drop policy if exists tenants_select_member on public.tenants;
create policy tenants_select_member on public.tenants
for select to authenticated
using (public.has_tenant_role(auth.uid(), id, array['owner', 'super_admin', 'admin_finance', 'support']));

drop policy if exists roles_select_authenticated on public.roles;
create policy roles_select_authenticated on public.roles
for select to authenticated
using (true);

drop policy if exists user_roles_select_member on public.user_roles;
create policy user_roles_select_member on public.user_roles
for select to authenticated
using (
  user_id = auth.uid()
  or public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance', 'support'])
);

drop policy if exists user_roles_manage_admin on public.user_roles;
create policy user_roles_manage_admin on public.user_roles
for all to authenticated
using (public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin']))
with check (public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin']));

drop policy if exists students_select_finance_member on public.students;
create policy students_select_finance_member on public.students
for select to authenticated
using (tenant_id is not null and public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance', 'support']));

drop policy if exists students_manage_finance_admin on public.students;
create policy students_manage_finance_admin on public.students
for all to authenticated
using (tenant_id is not null and public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance']))
with check (tenant_id is not null and public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance']));

drop policy if exists plans_select_member on public.plans;
create policy plans_select_member on public.plans
for select to authenticated
using (tenant_id is not null and public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance', 'support']));

drop policy if exists plans_manage_finance_admin on public.plans;
create policy plans_manage_finance_admin on public.plans
for all to authenticated
using (tenant_id is not null and public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance']))
with check (tenant_id is not null and public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance']));

drop policy if exists coupons_select_member on public.coupons;
create policy coupons_select_member on public.coupons
for select to authenticated
using (tenant_id is not null and public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance', 'support']));

drop policy if exists coupons_manage_finance_admin on public.coupons;
create policy coupons_manage_finance_admin on public.coupons
for all to authenticated
using (tenant_id is not null and public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance']))
with check (tenant_id is not null and public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance']));

drop policy if exists subscriptions_select_member on public.subscriptions;
create policy subscriptions_select_member on public.subscriptions
for select to authenticated
using (public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance', 'support']));

drop policy if exists subscriptions_manage_finance_admin on public.subscriptions;
create policy subscriptions_manage_finance_admin on public.subscriptions
for all to authenticated
using (public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance']))
with check (public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance']));

drop policy if exists invoices_select_member on public.invoices;
create policy invoices_select_member on public.invoices
for select to authenticated
using (public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance', 'support']));

drop policy if exists invoices_manage_finance_admin on public.invoices;
create policy invoices_manage_finance_admin on public.invoices
for all to authenticated
using (public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance']))
with check (public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance']));

drop policy if exists invoice_items_select_member on public.invoice_items;
create policy invoice_items_select_member on public.invoice_items
for select to authenticated
using (
  exists (
    select 1
    from public.invoices i
    where i.id = invoice_id
      and public.has_tenant_role(auth.uid(), i.tenant_id, array['owner', 'super_admin', 'admin_finance', 'support'])
  )
);

drop policy if exists invoice_items_manage_finance_admin on public.invoice_items;
create policy invoice_items_manage_finance_admin on public.invoice_items
for all to authenticated
using (
  exists (
    select 1
    from public.invoices i
    where i.id = invoice_id
      and public.has_tenant_role(auth.uid(), i.tenant_id, array['owner', 'super_admin', 'admin_finance'])
  )
)
with check (
  exists (
    select 1
    from public.invoices i
    where i.id = invoice_id
      and public.has_tenant_role(auth.uid(), i.tenant_id, array['owner', 'super_admin', 'admin_finance'])
  )
);

drop policy if exists payments_select_member on public.payments;
create policy payments_select_member on public.payments
for select to authenticated
using (public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance', 'support']));

drop policy if exists payments_manage_finance_admin on public.payments;
create policy payments_manage_finance_admin on public.payments
for all to authenticated
using (public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance']))
with check (public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance']));

drop policy if exists payment_attempts_select_member on public.payment_attempts;
create policy payment_attempts_select_member on public.payment_attempts
for select to authenticated
using (
  exists (
    select 1
    from public.payments p
    where p.id = payment_id
      and public.has_tenant_role(auth.uid(), p.tenant_id, array['owner', 'super_admin', 'admin_finance', 'support'])
  )
);

drop policy if exists payment_attempts_manage_finance_admin on public.payment_attempts;
create policy payment_attempts_manage_finance_admin on public.payment_attempts
for all to authenticated
using (
  exists (
    select 1
    from public.payments p
    where p.id = payment_id
      and public.has_tenant_role(auth.uid(), p.tenant_id, array['owner', 'super_admin', 'admin_finance'])
  )
)
with check (
  exists (
    select 1
    from public.payments p
    where p.id = payment_id
      and public.has_tenant_role(auth.uid(), p.tenant_id, array['owner', 'super_admin', 'admin_finance'])
  )
);

drop policy if exists refunds_select_member on public.refunds;
create policy refunds_select_member on public.refunds
for select to authenticated
using (public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance', 'support']));

drop policy if exists refunds_manage_finance_admin on public.refunds;
create policy refunds_manage_finance_admin on public.refunds
for all to authenticated
using (public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance']))
with check (public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance']));

drop policy if exists audit_logs_select_member on public.audit_logs;
create policy audit_logs_select_member on public.audit_logs
for select to authenticated
using (tenant_id is not null and public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance', 'support']));

drop policy if exists audit_logs_insert_admin on public.audit_logs;
create policy audit_logs_insert_admin on public.audit_logs
for insert to authenticated
with check (tenant_id is not null and public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance', 'support']));

drop policy if exists webhook_events_select_member on public.webhook_events;
create policy webhook_events_select_member on public.webhook_events
for select to authenticated
using (tenant_id is not null and public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance', 'support']));

drop policy if exists webhook_events_manage_finance_admin on public.webhook_events;
create policy webhook_events_manage_finance_admin on public.webhook_events
for all to authenticated
using (tenant_id is not null and public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance']))
with check (tenant_id is not null and public.has_tenant_role(auth.uid(), tenant_id, array['owner', 'super_admin', 'admin_finance']));

create or replace view public.admin_payment_daily as
select
  tenant_id,
  date_trunc('day', created_at)::date as day,
  count(*) as transactions_count,
  sum(case when status = 'paid' then amount_cents else 0 end) as paid_amount_cents,
  sum(case when status = 'failed' then amount_cents else 0 end) as failed_amount_cents,
  sum(case when status in ('pending', 'failed') then amount_cents else 0 end) as at_risk_amount_cents
from public.payments
where deleted_at is null
group by tenant_id, date_trunc('day', created_at)::date;

create or replace view public.admin_revenue_monthly as
select
  tenant_id,
  date_trunc('month', created_at)::date as month,
  sum(case when status = 'paid' then amount_cents else 0 end) as paid_amount_cents,
  sum(case when status in ('refunded', 'partially_refunded') then amount_cents else 0 end) as refunded_amount_cents,
  count(*) filter (where status = 'failed') as failed_transactions
from public.payments
where deleted_at is null
group by tenant_id, date_trunc('month', created_at)::date;

insert into public.roles (code, label, scope, description)
values
  ('super_admin', 'Super administrateur', 'tenant', 'Accès global aux opérations sensibles'),
  ('admin_finance', 'Admin finance', 'tenant', 'Pilotage financier et facturation'),
  ('support', 'Support', 'tenant', 'Lecture et assistance opérationnelle'),
  ('owner', 'Owner', 'tenant', 'Responsable établissement / compte principal')
on conflict (code) do update
set label = excluded.label,
    scope = excluded.scope,
    description = excluded.description;