-- Migration 003: Add theme preference to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light'
    CHECK (theme IN ('light', 'dark', 'emerald', 'ocean'));
