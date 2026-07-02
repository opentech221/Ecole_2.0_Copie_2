-- ============================================================
-- Migration 004 : Enable RLS on school_terms
-- École 2.0 — Run via `supabase db push` / local db reset
-- ============================================================

ALTER TABLE public.school_terms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "school_terms_director_all" ON public.school_terms;
DROP POLICY IF EXISTS "school_terms_teacher_own_class" ON public.school_terms;

-- Directors can manage all school terms.
CREATE POLICY "school_terms_director_all"
  ON public.school_terms FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'director'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'director'
    )
  );

-- Teachers can only manage terms for their own class.
CREATE POLICY "school_terms_teacher_own_class"
  ON public.school_terms FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'teacher'
        AND class_id = school_terms.class_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'teacher'
        AND class_id = school_terms.class_id
    )
  );
