import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// ─── Browser-side Supabase client (singleton) ─────────────────────────────────
// Used by all CRUD hooks and the API service layer.
// RLS (Row Level Security) is enforced server-side using the anon key;
// each operation requires an authenticated session to mutate data.
//
// P2.3 (résolu) : préfère les variables d'environnement ; retombe sur
// utils/supabase/info.tsx (fichier généré par Figma Make) uniquement si elles
// sont absentes, pour ne pas casser le développement local existant.
const supabaseUrl = envUrl ?? `https://${projectId}.supabase.co`;
const supabaseAnonKey = envAnonKey ?? publicAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
