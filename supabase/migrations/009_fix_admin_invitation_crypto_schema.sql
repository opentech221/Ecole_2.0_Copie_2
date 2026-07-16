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

  v_code := encode(extensions.gen_random_bytes(24), 'hex');
  v_hash := encode(extensions.digest(v_code, 'sha256'), 'hex');

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