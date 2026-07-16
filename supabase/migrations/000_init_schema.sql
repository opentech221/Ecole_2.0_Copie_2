-- ============================================================
-- Migration 000 : Base schema bootstrap
-- École 2.0 — Run via `supabase db push` / local db reset
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── STUDENTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.students (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id        TEXT NOT NULL,
  matricule       TEXT NOT NULL,
  nom             TEXT NOT NULL,
  prenom          TEXT NOT NULL,
  genre           TEXT NOT NULL CHECK (genre IN ('F', 'M')),
  date_naissance  DATE,
  lieu_naissance  TEXT,
  tuteur_nom      TEXT,
  tuteur_phone    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS students_class_matricule_key
  ON public.students (class_id, matricule);

CREATE INDEX IF NOT EXISTS students_class_id_idx
  ON public.students (class_id);

-- ── STUDENT_GRADES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_grades (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id      TEXT NOT NULL,
  discipline    TEXT NOT NULL,
  trimestre     SMALLINT NOT NULL CHECK (trimestre IN (1, 2, 3)),
  score         NUMERIC(6,2) NOT NULL,
  max_score     NUMERIC(6,2) NOT NULL,
  teacher_id    UUID,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS student_grades_unique_slot
  ON public.student_grades (student_id, discipline, trimestre);

CREATE INDEX IF NOT EXISTS student_grades_class_term_idx
  ON public.student_grades (class_id, trimestre);

-- ── DISCIPLINE_CONFIG ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.discipline_config (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id      TEXT NOT NULL,
  trimestre     SMALLINT NOT NULL CHECK (trimestre IN (1, 2, 3)),
  discipline    TEXT NOT NULL,
  max_score     NUMERIC(6,2) NOT NULL,
  is_included   BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS discipline_config_unique_slot
  ON public.discipline_config (class_id, trimestre, discipline);

CREATE INDEX IF NOT EXISTS discipline_config_class_term_idx
  ON public.discipline_config (class_id, trimestre);

-- ── DOCUMENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID REFERENCES public.students(id) ON DELETE CASCADE,
  class_id      TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('fiche', 'bulletin', 'planning')),
  title         TEXT NOT NULL,
  subtitle      TEXT NOT NULL DEFAULT '',
  meta          TEXT NOT NULL DEFAULT '',
  file_path     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS documents_class_created_idx
  ON public.documents (class_id, created_at DESC);

CREATE INDEX IF NOT EXISTS documents_student_idx
  ON public.documents (student_id);

-- ── SCHOOL_TERMS (future-proof, already referenced in TABLES) ──────────────
CREATE TABLE IF NOT EXISTS public.school_terms (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id      TEXT NOT NULL,
  trimestre     SMALLINT NOT NULL CHECK (trimestre IN (1, 2, 3)),
  start_date    DATE,
  end_date      DATE,
  label         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (class_id, trimestre)
);

-- ── updated_at trigger helper ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_students_updated_at ON public.students;
CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_student_grades_updated_at ON public.student_grades;
CREATE TRIGGER trg_student_grades_updated_at
  BEFORE UPDATE ON public.student_grades
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_discipline_config_updated_at ON public.discipline_config;
CREATE TRIGGER trg_discipline_config_updated_at
  BEFORE UPDATE ON public.discipline_config
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_documents_updated_at ON public.documents;
CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_school_terms_updated_at ON public.school_terms;
CREATE TRIGGER trg_school_terms_updated_at
  BEFORE UPDATE ON public.school_terms
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
