-- ============================================================
-- Migration 003 : Security hardening (profiles, storage, CORS assumptions)
-- École 2.0 — Run via `supabase db push`
-- ============================================================

-- ── 1. Profiles: prevent self role escalation ───────────────────────────────
-- Rebuild policy with explicit authenticated check and rely on trigger + grants
-- to block role mutation for non-service actors.
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Service role keeps the ability to assign roles in dedicated admin flows.
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Changing profile role is not allowed in self-service profile updates.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_change ON public.profiles;
CREATE TRIGGER trg_prevent_profile_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_change();

-- Extra guardrail at SQL privileges layer.
REVOKE UPDATE (role) ON public.profiles FROM authenticated;
GRANT UPDATE (
  full_name,
  school_id,
  class_id,
  ecole_nom,
  ief,
  telephone,
  adresse,
  classe_active,
  signature_url,
  logo_url
) ON public.profiles TO authenticated;

-- ── 2. Storage: scope documents access by class and ownership ───────────────
DROP POLICY IF EXISTS "storage_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "storage_authenticated_read" ON storage.objects;
DROP POLICY IF EXISTS "storage_owner_delete" ON storage.objects;

-- Directors: full documents bucket access.
CREATE POLICY "storage_documents_director_all"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'director'
    )
  )
  WITH CHECK (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'director'
    )
  );

-- Teachers: can upload/read only documents under their own class folder.
-- Folder convention: {class_id}/{type}/{filename}
CREATE POLICY "storage_documents_teacher_class_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'teacher'
        AND p.class_id = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "storage_documents_teacher_class_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'teacher'
        AND p.class_id = (storage.foldername(name))[1]
    )
  );

-- Teachers can delete only their own files in their class folder.
CREATE POLICY "storage_documents_teacher_class_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND owner = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'teacher'
        AND p.class_id = (storage.foldername(name))[1]
    )
  );
