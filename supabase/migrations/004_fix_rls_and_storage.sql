-- ============================================================
-- Migration 004 : Security hardening
-- P0.1 — Block role self-promotion on profiles
-- P0.4 — Harden storage policies (scope to class + owner)
-- ============================================================

-- ── P0.1 : Prevent authenticated users from elevating their role ──────────────
--
-- Strategy: a BEFORE UPDATE trigger that silently resets `role` to its
-- original value whenever the request comes from an authenticated user.
-- Service-role calls (auth.uid() IS NULL) are allowed to change role freely,
-- enabling admin operations from the server side.
--
-- Why a trigger instead of a RLS WITH CHECK?
-- RLS WITH CHECK for UPDATE sees the *new* row values; it cannot compare
-- against OLD.role without a self-referencing subquery, which has ambiguous
-- visibility under MVCC.  A BEFORE trigger has access to both OLD and NEW.

CREATE OR REPLACE FUNCTION public.prevent_role_elevation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- auth.uid() is non-NULL only for requests authenticated via JWT (client API).
  -- It returns NULL for service_role calls, allowing server-side role management.
  IF auth.uid() IS NOT NULL AND NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role := OLD.role;   -- silently discard the role change
  END IF;
  RETURN NEW;
END;
$$;

-- Drop if exists so migration is re-runnable
DROP TRIGGER IF EXISTS enforce_role_immutable ON public.profiles;

CREATE TRIGGER enforce_role_immutable
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_elevation();

-- Also tighten the RLS WITH CHECK to make the defence-in-depth explicit:
-- Even without the trigger, a client cannot change the role via a direct
-- update because the policy's WITH CHECK would also catch it.
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING  (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- role must be identical to the value already stored (defence-in-depth)
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );

-- ── P0.4 : Harden Supabase Storage policies for the documents bucket ──────────
--
-- Old policies allowed any authenticated user to upload/read/delete anywhere
-- inside the 'documents' bucket.  New policies scope access to the teacher's
-- own class folder (first path segment = class_id) or grant full access to
-- directors.
--
-- File path convention in the bucket: {class_id}/{type}/{timestamp}_{name}

DROP POLICY IF EXISTS "storage_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "storage_authenticated_read"   ON storage.objects;
DROP POLICY IF EXISTS "storage_owner_delete"         ON storage.objects;

-- INSERT: teachers upload only into their own class folder; directors unrestricted
CREATE POLICY "storage_upload_scoped"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'director'
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'teacher'
          AND class_id = (storage.foldername(name))[1]
      )
    )
  );

-- SELECT: same scoping as INSERT
CREATE POLICY "storage_read_scoped"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'director'
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'teacher'
          AND class_id = (storage.foldername(name))[1]
      )
    )
  );

-- DELETE: scoped to class folder AND file must be owned by the requesting user
CREATE POLICY "storage_delete_scoped"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'director'
      )
      OR (
        owner = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
            AND role = 'teacher'
            AND class_id = (storage.foldername(name))[1]
        )
      )
    )
  );
