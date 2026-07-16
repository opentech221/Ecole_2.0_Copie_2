with demo_tenant as (
  insert into public.tenants (id, name, slug, status, currency, country_code, timezone, metadata)
  values (
    '11111111-1111-4111-8111-111111111111',
    'Lycée Horizon',
    'lycee-horizon',
    'active',
    'XOF',
    'SN',
    'Africa/Dakar',
    '{"segment":"growth","owner":"Direction générale"}'::jsonb
  )
  on conflict (id) do update set
    name = excluded.name,
    slug = excluded.slug,
    status = excluded.status,
    metadata = excluded.metadata
  returning id
)
update public.students
set tenant_id = '11111111-1111-4111-8111-111111111111',
    parent_email = coalesce(parent_email, lower(prenom || '.' || nom || '@parents.ecole20.sn')),
    parent_phone = coalesce(parent_phone, tuteur_phone)
where tenant_id is null;

insert into public.plans (id, tenant_id, code, name, description, billing_interval, amount_cents, trial_days, tax_rate_basis_points, student_limit, features, active, display_order)
values
  ('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111111', 'smart-monthly', 'Smart Mensuel', 'Pilotage paiements et facturation mensuelle', 'monthly', 49000, 14, 1800, 500, '["dashboard-executif","paiements","facturation","alertes"]'::jsonb, true, 1),
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'smart-annual', 'Smart Annuel', 'Réduction annuelle et support prioritaire', 'annual', 499000, 21, 1800, 1200, '["dashboard-executif","paiements","facturation","alertes","priority-support"]'::jsonb, true, 2)
on conflict (id) do update set
  name = excluded.name,
  amount_cents = excluded.amount_cents,
  description = excluded.description,
  features = excluded.features,
  active = excluded.active;

insert into public.coupons (id, tenant_id, code, label, discount_type, discount_value, max_redemptions, starts_at, expires_at, active)
values
  ('33333333-3333-4333-8333-333333333331', '11111111-1111-4111-8111-111111111111', 'RENTREE10', 'Campagne rentrée -10%', 'percent', 10, 200, now() - interval '30 days', now() + interval '60 days', true)
on conflict (id) do update set
  label = excluded.label,
  discount_value = excluded.discount_value,
  active = excluded.active;

insert into public.subscriptions (id, tenant_id, student_id, plan_id, coupon_id, subscriber_name, subscriber_email, status, billing_cycle, started_at, current_period_start, current_period_end, trial_ends_at, amount_cents, currency, metadata)
select
  '44444444-4444-4444-8444-444444444441',
  '11111111-1111-4111-8111-111111111111',
  s.id,
  '22222222-2222-4222-8222-222222222221',
  '33333333-3333-4333-8333-333333333331',
  coalesce(s.tuteur_nom, s.prenom || ' ' || s.nom),
  s.parent_email,
  'active',
  'monthly',
  now() - interval '90 days',
  date_trunc('month', now()),
  date_trunc('month', now()) + interval '1 month' - interval '1 day',
  now() - interval '76 days',
  49000,
  'XOF',
  '{"channel":"mobile_money"}'::jsonb
from public.students s
where s.tenant_id = '11111111-1111-4111-8111-111111111111'
order by s.created_at asc
limit 1
on conflict (id) do nothing;

insert into public.invoices (id, tenant_id, student_id, subscription_id, invoice_number, status, issue_date, due_date, subtotal_cents, tax_cents, discount_cents, total_cents, paid_cents, balance_cents, currency, notes)
select
  '55555555-5555-4555-8555-555555555551',
  '11111111-1111-4111-8111-111111111111',
  s.id,
  '44444444-4444-4444-8444-444444444441',
  'INV-2026-0001',
  'open',
  current_date - 7,
  current_date + 7,
  49000,
  8820,
  4900,
  52920,
  35280,
  17640,
  'XOF',
  'Facture frais de scolarité juillet'
from public.students s
where s.tenant_id = '11111111-1111-4111-8111-111111111111'
order by s.created_at asc
limit 1
on conflict (id) do update set
  status = excluded.status,
  total_cents = excluded.total_cents,
  balance_cents = excluded.balance_cents;

insert into public.invoice_items (invoice_id, label, description, quantity, unit_amount_cents, tax_rate_basis_points, total_cents)
values
  ('55555555-5555-4555-8555-555555555551', 'Frais de scolarité', 'Abonnement mensuel standard', 1, 49000, 1800, 57820),
  ('55555555-5555-4555-8555-555555555551', 'Remise rentrée', 'Coupon RENTREE10', 1, -4900, 0, -4900)
on conflict do nothing;

insert into public.payments (id, tenant_id, student_id, invoice_id, subscription_id, plan_id, parent_name, parent_email, class_id, amount_cents, currency, status, payment_method, provider, provider_payment_id, reconciliation_status, paid_at, due_at, last_attempt_at, failure_reason, internal_notes, metadata, created_at)
select
  payment_id,
  '11111111-1111-4111-8111-111111111111',
  s.id,
  '55555555-5555-4555-8555-555555555551',
  '44444444-4444-4444-8444-444444444441',
  '22222222-2222-4222-8222-222222222221',
  coalesce(s.tuteur_nom, s.prenom || ' ' || s.nom),
  s.parent_email,
  s.class_id,
  amount_cents,
  'XOF',
  status,
  payment_method,
  provider,
  provider_payment_id,
  reconciliation_status,
  paid_at,
  due_at,
  last_attempt_at,
  failure_reason,
  internal_notes,
  metadata,
  created_at
from public.students s
cross join (
  values
    ('66666666-6666-4666-8666-666666666661'::uuid, 35280, 'paid', 'mobile_money', 'wave', 'wave_2026_0001', 'matched', now() - interval '1 day', now() - interval '2 days', now() - interval '1 day', null, 'Paiement confirmé via Wave', '{"attempts":1}'::jsonb, now() - interval '2 days'),
    ('66666666-6666-4666-8666-666666666662'::uuid, 17640, 'pending', 'bank_transfer', 'manual', 'manual_2026_0002', 'manual_review', null, now() + interval '2 days', now() - interval '1 hour', null, 'Rapprochement en attente', '{"attempts":1}'::jsonb, now() - interval '4 hours'),
    ('66666666-6666-4666-8666-666666666663'::uuid, 49000, 'failed', 'card', 'stripe', 'pi_2026_fail_1', 'unmatched', null, now() - interval '1 day', now() - interval '20 minutes', 'Carte refusée', 'Pic d échecs carte sur le tenant', '{"attempts":3}'::jsonb, now() - interval '20 minutes')
) as p(payment_id, amount_cents, status, payment_method, provider, provider_payment_id, reconciliation_status, paid_at, due_at, last_attempt_at, failure_reason, internal_notes, metadata, created_at)
where s.tenant_id = '11111111-1111-4111-8111-111111111111'
order by s.created_at asc
limit 1
on conflict (id) do update set
  status = excluded.status,
  amount_cents = excluded.amount_cents,
  internal_notes = excluded.internal_notes,
  metadata = excluded.metadata;

insert into public.payment_attempts (id, payment_id, provider, attempt_number, status, response_code, response_message, attempted_at, metadata)
values
  ('77777777-7777-4777-8777-777777777771', '66666666-6666-4666-8666-666666666661', 'wave', 1, 'succeeded', '200', 'Paiement confirmé', now() - interval '1 day', '{}'::jsonb),
  ('77777777-7777-4777-8777-777777777772', '66666666-6666-4666-8666-666666666663', 'stripe', 1, 'failed', 'card_declined', 'Carte refusée', now() - interval '40 minutes', '{}'::jsonb),
  ('77777777-7777-4777-8777-777777777773', '66666666-6666-4666-8666-666666666663', 'stripe', 2, 'failed', 'insufficient_funds', 'Fonds insuffisants', now() - interval '20 minutes', '{}'::jsonb)
on conflict (id) do nothing;

insert into public.refunds (id, payment_id, tenant_id, amount_cents, reason, status, metadata)
values
  ('88888888-8888-4888-8888-888888888881', '66666666-6666-4666-8666-666666666661', '11111111-1111-4111-8111-111111111111', 5000, 'Avoir commercial', 'succeeded', '{"mode":"partial"}'::jsonb)
on conflict (id) do nothing;

insert into public.audit_logs (id, tenant_id, actor_role, action, entity_type, entity_id, severity, metadata, created_at)
values
  ('99999999-9999-4999-8999-999999999991', '11111111-1111-4111-8111-111111111111', 'admin_finance', 'payment.reminder.sent', 'payment', '66666666-6666-4666-8666-666666666662', 'info', '{"channel":"email"}'::jsonb, now() - interval '3 hours'),
  ('99999999-9999-4999-8999-999999999992', '11111111-1111-4111-8111-111111111111', 'owner', 'payment.failure.spike_detected', 'payment', '66666666-6666-4666-8666-666666666663', 'critical', '{"failed_attempts":3}'::jsonb, now() - interval '20 minutes')
on conflict (id) do nothing;

insert into public.webhook_events (id, tenant_id, provider, event_type, provider_event_id, payload, processing_status, processed_at)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '11111111-1111-4111-8111-111111111111', 'stripe', 'payment_intent.payment_failed', 'evt_2026_fail_1', '{"amount":49000}'::jsonb, 'processed', now() - interval '19 minutes')
on conflict (id) do nothing;