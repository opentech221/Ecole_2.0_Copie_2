import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const AUTH_STORAGE_KEY = `ecole2-auth-v3-${projectId}`;
const LEGACY_AUTH_STORAGE_KEYS = [
  `ecole2-auth-v1-${projectId}`,
  `ecole2-auth-v2-${projectId}`,
];

function sanitizePersistedAuth() {
  if (typeof window === "undefined") return;

  try {
    for (const legacyKey of LEGACY_AUTH_STORAGE_KEYS) {
      window.localStorage.removeItem(legacyKey);
    }

    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw) as {
      currentSession?: { expires_at?: number | null } | null;
    };

    const expiresAt = parsed?.currentSession?.expires_at;
    if (!expiresAt || typeof expiresAt !== "number") {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    // If the local session expired more than 14 days ago, the refresh token is
    // very likely stale/revoked. Clearing it avoids noisy 400 refresh calls.
    const nowInSec = Math.floor(Date.now() / 1000);
    const fourteenDaysInSec = 14 * 24 * 60 * 60;
    if (expiresAt < nowInSec - fourteenDaysInSec) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

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

sanitizePersistedAuth();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: AUTH_STORAGE_KEY,
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
