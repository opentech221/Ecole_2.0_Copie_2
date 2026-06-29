-- ============================================================
-- Migration 001 : Profiles table + Role-Based RLS
-- École 2.0 — Supabase
-- ============================================================
-- Run this in the Supabase SQL Editor or via `supabase db push`
-- ============================================================

-- ── 1. PROFILES ──────────────────────────────────────────────
-- One row per authenticated user; linked to auth.users by id.
-- role : 'teacher' | 'director'
-- teacher_id mirrors the PK so FK references work cleanly.

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL DEFAULT 'teacher'
                          CHECK (role IN ('teacher', 'director')),
  full_name   TEXT,
  school_id   TEXT,       -- e.g. 'ecole-ilyaou-seydi'
  class_id    TEXT,       -- active class for teachers, e.g. 'CE2'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can update their own profile (except role — only service role)
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── 2. STUDENTS ──────────────────────────────────────────────
-- teacher_id = the auth.uid() of the teacher who owns this class roster.

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Directors see all students.
CREATE POLICY "students_director_all"
  ON public.students FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'director'
    )
  );

-- Teachers can only see/edit students in their own class.
CREATE POLICY "students_teacher_own_class"
  ON public.students FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'teacher'
        AND class_id = students.class_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'teacher'
        AND class_id = students.class_id
    )
  );

-- ── 3. STUDENT_GRADES ────────────────────────────────────────
-- Grades are owned by the teacher who entered them (teacher_id = auth.uid()).
-- A teacher cannot read or modify another teacher's grades.

ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;

-- Directors have full access to all grades.
CREATE POLICY "grades_director_all"
  ON public.student_grades FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'director'
    )
  );

-- Teachers can only access grades for students in their class.
-- The teacher_id column records who entered the grade.
CREATE POLICY "grades_teacher_own"
  ON public.student_grades FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.students s ON s.id = student_grades.student_id
      WHERE p.id = auth.uid()
        AND p.role = 'teacher'
        AND p.class_id = s.class_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.students s ON s.id = student_grades.student_id
      WHERE p.id = auth.uid()
        AND p.role = 'teacher'
        AND p.class_id = s.class_id
    )
  );

-- ── 4. DISCIPLINE_CONFIG ─────────────────────────────────────
-- Teachers configure their own class schema; directors see all.

ALTER TABLE public.discipline_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "discconf_director_all"
  ON public.discipline_config FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'director')
  );

CREATE POLICY "discconf_teacher_own_class"
  ON public.discipline_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher' AND class_id = discipline_config.class_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher' AND class_id = discipline_config.class_id
    )
  );

-- ── 5. DOCUMENTS ─────────────────────────────────────────────
-- Documents belong to a class. Directors can manage all; teachers only theirs.

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_director_all"
  ON public.documents FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'director')
  );

CREATE POLICY "documents_teacher_own_class"
  ON public.documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher' AND class_id = documents.class_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher' AND class_id = documents.class_id
    )
  );

-- ── 6. STORAGE BUCKET POLICY ─────────────────────────────────
-- Authenticated users can upload to their class folder.
-- Folder convention: {class_id}/{type}/{filename}

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage_authenticated_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "storage_authenticated_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "storage_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents' AND owner = auth.uid());

-- ── 7. AUTO-CREATE PROFILE ON SIGNUP ────────────────────────
-- Trigger: when a new user signs up, create a default 'teacher' profile.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'teacher'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
