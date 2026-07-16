-- MRR / ARR par tenant
select
  t.name,
  sum(case when s.status in ('trialing', 'active', 'past_due') and s.billing_cycle = 'monthly' then s.amount_cents else 0 end) as mrr_cents,
  sum(case when s.status in ('trialing', 'active', 'past_due') and s.billing_cycle = 'annual' then s.amount_cents / 12 else 0 end) as annualized_monthly_cents,
  (
    sum(case when s.status in ('trialing', 'active', 'past_due') and s.billing_cycle = 'monthly' then s.amount_cents else 0 end)
    + sum(case when s.status in ('trialing', 'active', 'past_due') and s.billing_cycle = 'annual' then s.amount_cents / 12 else 0 end)
  ) * 12 as arr_cents
from public.tenants t
left join public.subscriptions s on s.tenant_id = t.id and s.deleted_at is null
group by t.name
order by arr_cents desc;

-- Taux de recouvrement mensuel
select
  date_trunc('month', issue_date)::date as month,
  sum(total_cents) as invoiced_cents,
  sum(paid_cents) as collected_cents,
  round((sum(paid_cents)::numeric / nullif(sum(total_cents), 0)) * 100, 2) as recovery_rate_pct
from public.invoices
where deleted_at is null
group by date_trunc('month', issue_date)::date
order by month desc;

-- Impayés par établissement et classe
select
  t.name as tenant_name,
  p.class_id,
  sum(case when p.status in ('pending', 'failed', 'disputed') then p.amount_cents else 0 end) as outstanding_cents,
  count(*) filter (where p.status in ('pending', 'failed', 'disputed')) as risky_transactions
from public.payments p
join public.tenants t on t.id = p.tenant_id
where p.deleted_at is null
group by t.name, p.class_id
order by outstanding_cents desc;

-- Churn et abonnements expirants à 30 jours
select
  t.name,
  count(*) filter (where s.status in ('canceled', 'expired')) as churned_subscriptions,
  count(*) filter (where s.current_period_end between now() and now() + interval '30 days') as expiring_30d
from public.subscriptions s
join public.tenants t on t.id = s.tenant_id
where s.deleted_at is null
group by t.name
order by expiring_30d desc;

-- Répartition des paiements par moyen et statut
select
  payment_method,
  status,
  count(*) as transactions_count,
  sum(amount_cents) as amount_cents
from public.payments
where deleted_at is null
group by payment_method, status
order by amount_cents desc;