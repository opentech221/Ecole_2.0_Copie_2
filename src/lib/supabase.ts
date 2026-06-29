import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

// ─── Browser-side Supabase client (singleton) ─────────────────────────────────
// Used by all CRUD hooks and the API service layer.
// RLS (Row Level Security) is enforced server-side using the anon key;
// each operation requires an authenticated session to mutate data.

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// ─── Typed table names ────────────────────────────────────────────────────────
// Keep the list here so renaming a table only requires one change.
export const TABLES = {
  students:         "students",
  grades:           "student_grades",
  disciplineConfig: "discipline_config",
  documents:        "documents",
  terms:            "school_terms",
} as const;

// ─── Supabase Storage bucket ──────────────────────────────────────────────────
export const DOCUMENTS_BUCKET = "documents";
