-- ============================================================
-- Migration 008 : Backend admin sécurisé (RLS + audit + invitations)
-- École 2.0 — Supabase
-- ============================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1) Helper: role check
-- ---------------------------------------------------------------------
create or replace function public.is_director(p_uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_uid and p.role = 'director'
  );
$$;

-- ---------------------------------------------------------------------
-- 2) Profiles: director can read all profiles for administration screens
-- ---------------------------------------------------------------------
drop policy if exists "profiles_select_director_all" on public.profiles;
create policy "profiles_select_director_all"
  on public.profiles
  for select
  to authenticated
  using (public.is_director(auth.uid()));

-- ---------------------------------------------------------------------
-- 3) Persistent admin audit logs
-- ---------------------------------------------------------------------
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  target_user_id uuid references auth.users(id) on delete set null,
  target_type text not null default 'user',
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_logs enable row level security;

-- Directors can read logs, and insert logs linked to themselves.
drop policy if exists "admin_audit_logs_select_director" on public.admin_audit_logs;
create policy "admin_audit_logs_select_director"
  on public.admin_audit_logs
  for select
  to authenticated
  using (public.is_director(auth.uid()));

drop policy if exists "admin_audit_logs_insert_director" on public.admin_audit_logs;
create policy "admin_audit_logs_insert_director"
  on public.admin_audit_logs
  for insert
  to authenticated
  with check (
    public.is_director(auth.uid())
    and actor_user_id = auth.uid()
  );

-- No update/delete from client JWT.
drop policy if exists "admin_audit_logs_update_none" on public.admin_audit_logs;
create policy "admin_audit_logs_update_none"
  on public.admin_audit_logs
  for update
  to authenticated
  using (false)
  with check (false);

drop policy if exists "admin_audit_logs_delete_none" on public.admin_audit_logs;
create policy "admin_audit_logs_delete_none"
  on public.admin_audit_logs
  for delete
  to authenticated
  using (false);

-- ---------------------------------------------------------------------
-- 4) Admin invitations table
-- ---------------------------------------------------------------------
create table if not exists public.admin_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in ('teacher', 'director')),
  full_name text,
  school_id text,
  class_id text,
  invited_by uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  note text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_invitations_email on public.admin_invitations (lower(email));
create index if not exists idx_admin_invitations_status on public.admin_invitations (status);
create index if not exists idx_admin_audit_logs_created_at on public.admin_audit_logs (created_at desc);

alter table public.admin_invitations enable row level security;

drop policy if exists "admin_invitations_director_all" on public.admin_invitations;
create policy "admin_invitations_director_all"
  on public.admin_invitations
  for all
  to authenticated
  using (public.is_director(auth.uid()))
  with check (public.is_director(auth.uid()));

-- ---------------------------------------------------------------------
-- 5) Harden grants (avoid direct role updates from authenticated users)
-- ---------------------------------------------------------------------
revoke update(role) on public.profiles from authenticated;

-- ---------------------------------------------------------------------
-- 6) Server-side admin functions (security definer)
-- ---------------------------------------------------------------------

create or replace function public.admin_log_action(
  p_action text,
  p_target_user_id uuid default null,
  p_target_type text default 'user',
  p_metadata jsonb default '{}'::jsonb,
  p_ip inet default null,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not public.is_director(v_actor) then
    raise exception 'forbidden';
  end if;

  insert into public.admin_audit_logs (
    actor_user_id,
    action,
    target_user_id,
    target_type,
    metadata,
    ip_address,
    user_agent
  ) values (
    v_actor,
    p_action,
    p_target_user_id,
    coalesce(nullif(p_target_type, ''), 'user'),
    coalesce(p_metadata, '{}'::jsonb),
    p_ip,
    p_user_agent
  );
end;
$$;

create or replace function public.admin_create_invitation(
  p_email text,
  p_role text default 'teacher',
  p_full_name text default null,
  p_school_id text default null,
  p_class_id text default null,
  p_expires_hours integer default 168,
  p_note text default null
)
returns table (
  id uuid,
  email text,
  role text,
  expires_at timestamptz,
  invite_code text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor uuid := auth.uid();
  v_code text;
  v_hash text;
  v_row public.admin_invitations%rowtype;
begin
  if v_actor is null or not public.is_director(v_actor) then
    raise exception 'forbidden';
  end if;

  if p_email is null or btrim(p_email) = '' then
    raise exception 'email_required';
  end if;

  if p_role not in ('teacher', 'director') then
    raise exception 'invalid_role';
  end if;

  v_code := encode(gen_random_bytes(24), 'hex');
  v_hash := encode(digest(v_code, 'sha256'), 'hex');

  insert into public.admin_invitations (
    email,
    role,
    full_name,
    school_id,
    class_id,
    invited_by,
    token_hash,
    note,
    status,
    expires_at
  )
  values (
    lower(trim(p_email)),
    p_role,
    nullif(trim(p_full_name), ''),
    nullif(trim(p_school_id), ''),
    nullif(trim(p_class_id), ''),
    v_actor,
    v_hash,
    nullif(trim(p_note), ''),
    'pending',
    now() + make_interval(hours => greatest(coalesce(p_expires_hours, 168), 1))
  )
  returning * into v_row;

  perform public.admin_log_action(
    'admin.invitation.created',
    null,
    'invitation',
    jsonb_build_object(
      'invitation_id', v_row.id,
      'email', v_row.email,
      'role', v_row.role,
      'expires_at', v_row.expires_at
    )
  );

  return query
  select v_row.id, v_row.email, v_row.role, v_row.expires_at, v_code;
end;
$$;

create or replace function public.admin_revoke_invitation(
  p_invitation_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor uuid := auth.uid();
  v_updated integer;
begin
  if v_actor is null or not public.is_director(v_actor) then
    raise exception 'forbidden';
  end if;

  update public.admin_invitations
     set status = 'revoked'
   where id = p_invitation_id
     and status = 'pending';

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    raise exception 'invitation_not_pending_or_not_found';
  end if;

  perform public.admin_log_action(
    'admin.invitation.revoked',
    null,
    'invitation',
    jsonb_build_object('invitation_id', p_invitation_id, 'reason', p_reason)
  );
end;
$$;

create or replace function public.admin_assign_user_role(
  p_user_id uuid,
  p_new_role text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor uuid := auth.uid();
  v_prev_role text;
begin
  if v_actor is null or not public.is_director(v_actor) then
    raise exception 'forbidden';
  end if;

  if p_new_role not in ('teacher', 'director') then
    raise exception 'invalid_role';
  end if;

  select role into v_prev_role
  from public.profiles
  where id = p_user_id;

  if v_prev_role is null then
    raise exception 'profile_not_found';
  end if;

  update public.profiles
     set role = p_new_role
   where id = p_user_id;

  perform public.admin_log_action(
    'admin.user.role_assigned',
    p_user_id,
    'user',
    jsonb_build_object(
      'previous_role', v_prev_role,
      'new_role', p_new_role,
      'reason', p_reason
    )
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 7) Give director access to requested account (if exists)
-- ---------------------------------------------------------------------
do $$
begin
  if exists (
    select 1
    from pg_trigger
    where tgname = 'trg_prevent_profile_role_change'
  ) then
    execute 'alter table public.profiles disable trigger trg_prevent_profile_role_change';
  end if;

  if exists (
    select 1
    from pg_trigger
    where tgname = 'enforce_role_immutable'
  ) then
    execute 'alter table public.profiles disable trigger enforce_role_immutable';
  end if;

  update public.profiles
     set role = 'director'
   where full_name in ('Cheikh T S Ba', 'Cheikh T S Bâ');

  if exists (
    select 1
    from pg_trigger
    where tgname = 'trg_prevent_profile_role_change'
  ) then
    execute 'alter table public.profiles enable trigger trg_prevent_profile_role_change';
  end if;

  if exists (
    select 1
    from pg_trigger
    where tgname = 'enforce_role_immutable'
  ) then
    execute 'alter table public.profiles enable trigger enforce_role_immutable';
  end if;
end;
$$;
