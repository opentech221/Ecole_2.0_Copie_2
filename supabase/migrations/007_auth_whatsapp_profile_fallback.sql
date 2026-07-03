-- ============================================================
-- Migration 007 : Auth phone/WhatsApp compatibility for profiles
-- École 2.0 — Supabase
-- ============================================================

-- Ensure profile auto-creation works when user signs up with phone only.
-- For WhatsApp/SMS OTP users, NEW.email may be null.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'teacher'),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.email,
      NEW.phone,
      'Nouvel utilisateur'
    )
  );
  RETURN NEW;
END;
$$;
