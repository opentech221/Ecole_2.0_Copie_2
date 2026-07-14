-- Database integrity checklist for Ecole 2.0
-- Run with:
--   npx supabase db query --local  --file scripts/db-integrity-checklist.sql
--   npx supabase db query --linked --file scripts/db-integrity-checklist.sql

-- 1) Required tables
with required_tables(table_name) as (
  values
    ('students'),('student_grades'),('discipline_config'),('documents'),('school_terms'),
    ('profiles'),('tenants'),('roles'),('user_roles'),('plans'),('coupons'),('subscriptions'),
    ('invoices'),('invoice_items'),('payments'),('payment_attempts'),('refunds'),('audit_logs'),
    ('webhook_events'),('notifications'),('notification_preferences'),('notification_delivery_logs'),
    ('notification_push_subscriptions'),('tenant_user_accounts'),('kpi_events'),('admin_audit_logs'),
    ('admin_invitations'),('kv_store_48b2f2dd')
)
select
  'tables' as block,
  rt.table_name as item,
  case when c.oid is not null then 'OK' else 'MISSING' end as status
from required_tables rt
left join pg_class c
  on c.relname = rt.table_name
 and c.relkind = 'r'
 and c.relnamespace = 'public'::regnamespace
order by item;

-- 2) Required indexes
with required_indexes(name) as (
  values
    ('students_class_matricule_key'),('student_grades_unique_slot'),('discipline_config_unique_slot'),
    ('idx_students_tenant_id'),('idx_user_roles_lookup'),('idx_plans_tenant_active'),
    ('idx_subscriptions_tenant_status'),('idx_invoices_tenant_status_due'),('idx_payments_tenant_status_created'),
    ('idx_payments_invoice_id'),('idx_payments_provider_id'),('idx_payment_attempts_payment_id'),
    ('idx_refunds_payment_id'),('idx_audit_logs_tenant_created'),('idx_webhook_events_status_created'),
    ('idx_notifications_tenant_user_status_created'),('idx_notifications_type'),('idx_notifications_user_created'),
    ('idx_notification_delivery_logs_notification'),('idx_notification_push_subscriptions_tenant_user'),
    ('idx_tenant_user_accounts_tenant_status'),('idx_tenant_user_accounts_country_channel'),
    ('idx_kpi_events_tenant_event_occurred'),('idx_kpi_events_tenant_user'),
    ('idx_admin_invitations_email'),('idx_admin_invitations_status'),('idx_admin_audit_logs_created_at'),
    ('kv_store_48b2f2dd_key_idx')
)
select
  'indexes' as block,
  r.name as item,
  case when i.indexname is not null then 'OK' else 'MISSING' end as status
from required_indexes r
left join pg_indexes i
  on i.schemaname = 'public'
 and i.indexname = r.name
order by item;

-- 3) Critical foreign keys and delete behavior
with fk as (
  select
    conname,
    conrelid::regclass::text as table_name,
    confrelid::regclass::text as ref_table,
    confdeltype
  from pg_constraint
  where contype = 'f'
    and connamespace = 'public'::regnamespace
),
required_fk(conname, expected_on_delete) as (
  values
    ('student_grades_student_id_fkey', 'CASCADE'),
    ('documents_student_id_fkey', 'CASCADE'),
    ('students_tenant_id_fkey', 'SET NULL'),
    ('subscriptions_tenant_id_fkey', 'CASCADE'),
    ('subscriptions_student_id_fkey', 'SET NULL'),
    ('subscriptions_plan_id_fkey', 'SET NULL'),
    ('subscriptions_coupon_id_fkey', 'SET NULL'),
    ('invoices_tenant_id_fkey', 'CASCADE'),
    ('invoices_student_id_fkey', 'SET NULL'),
    ('invoices_subscription_id_fkey', 'SET NULL'),
    ('payments_tenant_id_fkey', 'CASCADE'),
    ('payments_student_id_fkey', 'SET NULL'),
    ('payments_invoice_id_fkey', 'SET NULL'),
    ('payments_subscription_id_fkey', 'SET NULL'),
    ('payments_plan_id_fkey', 'SET NULL'),
    ('payment_attempts_payment_id_fkey', 'CASCADE'),
    ('refunds_payment_id_fkey', 'CASCADE'),
    ('refunds_tenant_id_fkey', 'CASCADE'),
    ('notification_preferences_tenant_id_fkey', 'CASCADE'),
    ('notification_preferences_user_id_fkey', 'CASCADE'),
    ('notification_delivery_logs_notification_id_fkey', 'CASCADE'),
    ('notification_push_subscriptions_tenant_id_fkey', 'CASCADE'),
    ('tenant_user_accounts_tenant_id_fkey', 'CASCADE'),
    ('tenant_user_accounts_user_id_fkey', 'CASCADE'),
    ('kpi_events_tenant_id_fkey', 'CASCADE')
),
actual as (
  select
    conname,
    table_name,
    ref_table,
    case confdeltype
      when 'c' then 'CASCADE'
      when 'n' then 'SET NULL'
      when 'r' then 'RESTRICT'
      when 'a' then 'NO ACTION'
      when 'd' then 'SET DEFAULT'
      else confdeltype::text
    end as on_delete
  from fk
)
select
  'foreign_keys' as block,
  rf.conname as item,
  case
    when a.conname is null then 'MISSING'
    when a.on_delete = rf.expected_on_delete then 'OK'
    else 'MISMATCH: expected ' || rf.expected_on_delete || ', got ' || a.on_delete
  end as status
from required_fk rf
left join actual a
  on a.conname = rf.conname
order by item;

-- 4) RLS enabled + policy count
with required_rls(table_name) as (
  values
    ('profiles'),('students'),('student_grades'),('discipline_config'),('documents'),('school_terms'),
    ('admin_audit_logs'),('admin_invitations'),('tenants'),('roles'),('user_roles'),('plans'),
    ('coupons'),('subscriptions'),('invoices'),('invoice_items'),('payments'),('payment_attempts'),
    ('refunds'),('audit_logs'),('webhook_events'),('notifications'),('notification_preferences'),
    ('notification_delivery_logs'),('notification_push_subscriptions'),('tenant_user_accounts'),
    ('kpi_events'),('kv_store_48b2f2dd')
)
select
  'rls' as block,
  r.table_name as item,
  case
    when c.relrowsecurity = false then 'DISABLED'
    when c.relrowsecurity = true and coalesce(p.cnt, 0) = 0 then 'ENABLED_BUT_NO_POLICY'
    else 'OK'
  end as status
from required_rls r
join pg_class c
  on c.relname = r.table_name
 and c.relnamespace = 'public'::regnamespace
left join (
  select tablename, count(*) as cnt
  from pg_policies
  where schemaname = 'public'
  group by tablename
) p
  on p.tablename = r.table_name
order by item;

-- 5) Required triggers
with required_triggers(table_name, trigger_name) as (
  values
    ('students','trg_students_updated_at'),
    ('student_grades','trg_student_grades_updated_at'),
    ('discipline_config','trg_discipline_config_updated_at'),
    ('documents','trg_documents_updated_at'),
    ('school_terms','trg_school_terms_updated_at'),
    ('tenants','trg_tenants_updated_at'),
    ('plans','trg_plans_updated_at'),
    ('coupons','trg_coupons_updated_at'),
    ('subscriptions','trg_subscriptions_updated_at'),
    ('invoices','trg_invoices_updated_at'),
    ('payments','trg_payments_updated_at'),
    ('refunds','trg_refunds_updated_at'),
    ('notification_preferences','trg_notification_preferences_updated_at'),
    ('notification_push_subscriptions','trg_notification_push_subscriptions_updated_at'),
    ('tenant_user_accounts','trg_tenant_user_accounts_updated_at')
)
select
  'triggers' as block,
  rt.table_name || '.' || rt.trigger_name as item,
  case when t.tgname is not null then 'OK' else 'MISSING' end as status
from required_triggers rt
left join pg_trigger t
  on t.tgname = rt.trigger_name
 and t.tgrelid = (format('public.%s', rt.table_name))::regclass
 and not t.tgisinternal
order by item;
