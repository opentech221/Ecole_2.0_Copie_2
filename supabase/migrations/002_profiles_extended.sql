-- ============================================================
-- Migration 002 : Extended profile fields + school-assets bucket
-- École 2.0 — Run in Supabase SQL Editor or via `supabase db push`
-- ============================================================

-- ── 1. Extend profiles table ─────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ecole_nom     TEXT,
  ADD COLUMN IF NOT EXISTS ief           TEXT DEFAULT 'Dakar-Plateau',
  ADD COLUMN IF NOT EXISTS telephone     TEXT,
  ADD COLUMN IF NOT EXISTS adresse       TEXT,
  ADD COLUMN IF NOT EXISTS signature_url TEXT,
  ADD COLUMN IF NOT EXISTS logo_url      TEXT,
  ADD COLUMN IF NOT EXISTS classe_active TEXT DEFAULT 'CE2';

-- ── 2. Storage bucket for logos & signatures ─────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('school-assets', 'school-assets', true)
  ON CONFLICT DO NOTHING;

-- ── 3. RLS: each user manages files under their own uid folder
CREATE POLICY "school_assets_user_access"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'school-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'school-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
