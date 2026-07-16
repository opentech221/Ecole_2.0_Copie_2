with target_tenant as (
  select id
  from public.tenants
  where id = '11111111-1111-4111-8111-111111111111'
  limit 1
),
target_user as (
  select p.id as user_id
  from public.profiles p
  where p.role = 'director'
  order by p.created_at asc
  limit 1
)
insert into public.notifications (
  id,
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
  created_at,
  read_at,
  archived_at
)
select
  seed.id,
  t.id,
  u.user_id,
  seed.type,
  seed.title,
  seed.message,
  seed.data,
  seed.priority,
  seed.status,
  seed.channel,
  seed.action_url,
  now() - seed.created_interval,
  case when seed.status <> 'non_lue' then now() - interval '2 hours' else null end,
  case when seed.status = 'archivee' then now() - interval '1 hour' else null end
from target_tenant t
cross join target_user u
cross join (
  values
    (
      'b1111111-1111-4111-8111-111111111111'::uuid,
      'paiement_reussi',
      'Paiement validé pour la facture INV-2026-0001',
      'Le paiement mobile money de 35 280 XOF a été confirmé.',
      '{"invoice_number":"INV-2026-0001"}'::jsonb,
      'normale',
      'non_lue',
      'in_app',
      '/admin',
      interval '25 minutes'
    ),
    (
      'b2222222-2222-4222-8222-222222222222'::uuid,
      'paiement_echoue',
      'Échec de paiement carte',
      'Trois tentatives échouées détectées sur les 30 dernières minutes.',
      '{"provider":"stripe","attempts":3}'::jsonb,
      'critique',
      'non_lue',
      'in_app',
      '/admin',
      interval '18 minutes'
    ),
    (
      'b3333333-3333-4333-8333-333333333333'::uuid,
      'facture_generee',
      'Nouvelle facture générée',
      'La facture INV-2026-0009 est disponible pour envoi parent.',
      '{"invoice_number":"INV-2026-0009"}'::jsonb,
      'faible',
      'lue',
      'in_app',
      '/documents',
      interval '6 hours'
    ),
    (
      'b4444444-4444-4444-8444-444444444444'::uuid,
      'rappel_impaye',
      'Rappel impayé à traiter',
      '5 factures dépassent 15 jours de retard.',
      '{"overdue_count":5}'::jsonb,
      'haute',
      'archivee',
      'in_app',
      '/admin',
      interval '26 hours'
    )
) as seed(id, type, title, message, data, priority, status, channel, action_url, created_interval)
on conflict (id) do update
set
  title = excluded.title,
  message = excluded.message,
  data = excluded.data,
  priority = excluded.priority,
  status = excluded.status,
  action_url = excluded.action_url;
