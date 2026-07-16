-- ============================================================
-- Migration 020 : documents RLS accepts teacher active class
-- ============================================================
-- Why:
-- The app lets teachers work with an active class context (`profiles.classe_active`).
-- Existing policy only checked `profiles.class_id`, causing 403 on legitimate inserts.

alter table public.documents enable row level security;

drop policy if exists "documents_teacher_own_class" on public.documents;

create policy "documents_teacher_own_class"
  on public.documents for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'teacher'
        and (
          p.class_id = documents.class_id
          or p.classe_active = documents.class_id
        )
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'teacher'
        and (
          p.class_id = documents.class_id
          or p.classe_active = documents.class_id
        )
    )
  );
