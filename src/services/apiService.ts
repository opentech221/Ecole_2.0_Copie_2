/**
 * apiService — Unified CRUD engine for École 2.0
 *
 * Every database operation flows through `performAction`, which:
 *  1. Awaits the async operation
 *  2. Shows a success toast on completion
 *  3. Shows an error toast and re-throws on failure
 *
 * This single-responsibility wrapper means callers never need to handle
 * toast notifications themselves; the UX feedback is always consistent.
 */

import { toast } from "sonner";
import { supabase, TABLES, DOCUMENTS_BUCKET } from "../lib/supabase";

const E2E_AUTH_STORAGE_KEY = "ecole2-e2e-auth";
const E2E_DOCUMENTS_STORAGE_KEY = "ecole2-e2e-documents";
const E2E_GRADES_STORAGE_KEY = "ecole2-e2e-grades";

function isE2eAuthOverride() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(E2E_AUTH_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function readJson<T>(storageKey: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(storageKey: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    /* Ignore E2E storage failures. */
  }
}

// ─── Core wrapper ──────────────────────────────────────────────────────────────

export async function performAction<T>(
  actionFn:   () => Promise<T>,
  successMsg: string,
  errorPrefix = "Erreur",
): Promise<T> {
  try {
    const data = await actionFn();
    toast.success(successMsg);
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    toast.error(`${errorPrefix} : ${message}`);
    throw err;
  }
}

// ─── Silent variant (no toasts) — used for debounced auto-save ────────────────

export async function silentAction<T>(actionFn: () => Promise<T>): Promise<T> {
  return actionFn();
}

// ══════════════════════════════════════════════════════════════════════════════
// STUDENTS
// ══════════════════════════════════════════════════════════════════════════════

export type StudentRow = {
  id:              string;
  class_id:        string;
  matricule:       string;
  nom:             string;
  prenom:          string;
  genre:           "F" | "M";
  date_naissance:  string;
  lieu_naissance:  string;
  tuteur_nom:      string;
  tuteur_phone:    string;
  created_at?:     string;
};

export const studentsApi = {
  /** Fetch all students for a given class */
  async list(classId: string): Promise<StudentRow[]> {
    const { data, error } = await supabase
      .from(TABLES.students)
      .select("*")
      .eq("class_id", classId)
      .order("nom");
    if (error) throw error;
    return data ?? [];
  },

  /** Insert a new student (with toast) */
  create: (row: Omit<StudentRow, "id" | "created_at">) =>
    performAction(
      async () => {
        const { data, error } = await supabase.from(TABLES.students).insert(row).select().single();
        if (error) throw error;
        return data as StudentRow;
      },
      `Élève ${row.nom} ${row.prenom} ajouté.`,
    ),

  /** Update student fields (with toast) */
  update: (id: string, changes: Partial<StudentRow>) =>
    performAction(
      async () => {
        const { error } = await supabase.from(TABLES.students).update(changes).eq("id", id);
        if (error) throw error;
      },
      "Fiche élève mise à jour.",
    ),

  /**
   * Delete a student (with toast).
   * Cascade DELETE on student_grades and documents is configured in Supabase
   * FK constraints — no orphaned rows are left behind.
   */
  delete: (id: string, nom: string) =>
    performAction(
      async () => {
        const { error } = await supabase.from(TABLES.students).delete().eq("id", id);
        if (error) throw error;
      },
      `Élève ${nom} supprimé (notes et documents associés effacés).`,
    ),
};

// ══════════════════════════════════════════════════════════════════════════════
// GRADES  (student_grades)
// ══════════════════════════════════════════════════════════════════════════════

export type GradeRow = {
  id?:          string;
  student_id:   string;
  class_id:     string;
  discipline:   string;
  trimestre:    1 | 2 | 3;
  score:        number;
  max_score:    number;
  updated_at?:  string;
};

export const gradesApi = {
  /** Fetch all grades for a class + term */
  async list(classId: string, trimestre: 1 | 2 | 3): Promise<GradeRow[]> {
    if (isE2eAuthOverride()) {
      const store = readJson<Record<string, Record<string, Record<string, { t1: number; t2: number; t3: number }>>>>(E2E_GRADES_STORAGE_KEY, {});
      const classGrades = store[classId] ?? {};
      return Object.entries(classGrades).flatMap(([studentId, disciplines]) =>
        Object.entries(disciplines).map(([discipline, g]) => ({
          student_id: studentId,
          class_id: classId,
          discipline,
          trimestre,
          score: trimestre === 1 ? g.t1 : trimestre === 2 ? g.t2 : g.t3,
          max_score: 10,
        })),
      );
    }

    const { data, error } = await supabase
      .from(TABLES.grades)
      .select("*")
      .eq("class_id", classId)
      .eq("trimestre", trimestre);
    if (error) throw error;
    return data ?? [];
  },

  /**
   * Upsert a batch of grades (silent — called by debounced auto-save).
   * Uses onConflict so a re-save replaces the existing row.
   */
  async upsertBatch(rows: GradeRow[]): Promise<void> {
    if (isE2eAuthOverride()) {
      const store = readJson<Record<string, Record<string, Record<string, { t1: number; t2: number; t3: number }>>>>(E2E_GRADES_STORAGE_KEY, {});
      for (const row of rows) {
        const classGrades = store[row.class_id] ?? {};
        const studentGrades = classGrades[row.student_id] ?? {};
        const previous = studentGrades[row.discipline] ?? { t1: 0, t2: 0, t3: 0 };
        const key = `t${row.trimestre}` as "t1" | "t2" | "t3";
        studentGrades[row.discipline] = { ...previous, [key]: row.score };
        classGrades[row.student_id] = studentGrades;
        store[row.class_id] = classGrades;
      }
      writeJson(E2E_GRADES_STORAGE_KEY, store);
    }

    const { error } = await supabase
      .from(TABLES.grades)
      .upsert(rows, { onConflict: "student_id,discipline,trimestre" });
    if (error) throw error;
  },

  /** Delete all grades for a student (used internally by cascade) */
  async deleteByStudent(studentId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.grades)
      .delete()
      .eq("student_id", studentId);
    if (error) throw error;
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// DISCIPLINE CONFIG  (global grading policy)
// ══════════════════════════════════════════════════════════════════════════════

export type DisciplineConfigRow = {
  id?:          string;
  class_id:     string;
  trimestre:    1 | 2 | 3;
  discipline:   string;
  max_score:    number;
  is_included:  boolean;
  updated_at?:  string;
};

export const disciplineConfigApi = {
  async list(classId: string, trimestre: 1 | 2 | 3): Promise<DisciplineConfigRow[]> {
    const { data, error } = await supabase
      .from(TABLES.disciplineConfig)
      .select("*")
      .eq("class_id", classId)
      .eq("trimestre", trimestre);
    if (error) throw error;
    return data ?? [];
  },

  async upsert(row: DisciplineConfigRow): Promise<void> {
    const { error } = await supabase
      .from(TABLES.disciplineConfig)
      .upsert(row, { onConflict: "class_id,trimestre,discipline" });
    if (error) throw error;
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// DOCUMENTS  (metadata + Supabase Storage)
// ══════════════════════════════════════════════════════════════════════════════

export type DocumentRow = {
  id?:         string;
  student_id?: string;
  class_id:    string;
  type:        "fiche" | "bulletin" | "planning";
  title:       string;
  subtitle:    string;
  meta:        string;
  file_path?:  string;   // path inside the Storage bucket
  created_at?: string;
};

export const documentsApi = {
  /** Read — all documents for a class with optional type filter */
  async list(classId: string, type?: DocumentRow["type"]): Promise<DocumentRow[]> {
    if (isE2eAuthOverride()) {
      const stored = readJson<DocumentRow[]>(E2E_DOCUMENTS_STORAGE_KEY, []);
      return stored
        .filter(doc => doc.class_id === classId)
        .filter(doc => !type || doc.type === type)
        .sort((left, right) => (right.created_at ?? "").localeCompare(left.created_at ?? ""));
    }

    let query = supabase
      .from(TABLES.documents)
      .select("*")
      .eq("class_id", classId)
      .order("created_at", { ascending: false });
    if (type) query = query.eq("type", type);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  /** Create — insert metadata row (with toast) */
  create: (row: Omit<DocumentRow, "id" | "created_at">) =>
    isE2eAuthOverride()
      ? (async () => {
          const stored = readJson<DocumentRow[]>(E2E_DOCUMENTS_STORAGE_KEY, []);
          const nextRow: DocumentRow = {
            ...row,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
          };
          writeJson(E2E_DOCUMENTS_STORAGE_KEY, [nextRow, ...stored.filter(doc => doc.id !== nextRow.id)]);
          const { error } = await supabase.from(TABLES.documents).insert(row).select().single();
          if (error) {
            // Ignore backend write failures in E2E local-persistence mode.
          }
          return nextRow;
        })()
      : performAction(
          async () => {
            const { data, error } = await supabase.from(TABLES.documents).insert(row).select().single();
            if (error) throw error;
            return data as DocumentRow;
          },
          `Document « ${row.title} » créé.`,
        ),

  /**
   * Upload — stores a File in Supabase Storage and returns the public URL.
   * Path convention: `{classId}/{type}/{filename}`
   */
  async upload(classId: string, type: string, file: File): Promise<string> {
    const path = `${classId}/${type}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;

    // Return the bucket-internal path, NOT a public URL.
    // Callers store this as `file_path`; use getSignedUrl() to render/download.
    return path;
  },

  /** Read — get signed URL for a private file (1-hour expiry) */
  async getSignedUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(filePath, 3600);
    if (error) throw error;
    return data.signedUrl;
  },

  /**
   * Delete — removes BOTH the metadata row AND the Storage file.
   * Always delete in this order: metadata first, then file, so a partial
   * failure doesn't leave an orphaned file with no DB record.
   */
  delete: (doc: DocumentRow) =>
    isE2eAuthOverride()
      ? (async () => {
          const stored = readJson<DocumentRow[]>(E2E_DOCUMENTS_STORAGE_KEY, []);
          writeJson(E2E_DOCUMENTS_STORAGE_KEY, stored.filter(item => item.id !== doc.id));
          const { error: dbError } = await supabase.from(TABLES.documents).delete().eq("id", doc.id!);
          if (dbError) {
            // Ignore backend failures in E2E local-persistence mode.
          }
        })()
      : performAction(
          async () => {
            // 1. Delete metadata row
            const { error: dbError } = await supabase
              .from(TABLES.documents)
              .delete()
              .eq("id", doc.id!);
            if (dbError) throw dbError;

            // 2. Remove file from Storage (if one was uploaded)
            if (doc.file_path) {
              const { error: storageError } = await supabase.storage
                .from(DOCUMENTS_BUCKET)
                .remove([doc.file_path]);
              if (storageError) throw storageError;
            }
          },
          `Document « ${doc.title} » supprimé.`,
        ),

  /** Update metadata only (title, subtitle, etc.) */
  update: (id: string, changes: Partial<DocumentRow>) =>
    isE2eAuthOverride()
      ? (async () => {
          const stored = readJson<DocumentRow[]>(E2E_DOCUMENTS_STORAGE_KEY, []);
          const next = stored.map(doc => (doc.id === id ? { ...doc, ...changes } : doc));
          writeJson(E2E_DOCUMENTS_STORAGE_KEY, next);
          const { error } = await supabase.from(TABLES.documents).update(changes).eq("id", id);
          if (error) {
            // Ignore backend failures in E2E local-persistence mode.
          }
        })()
      : performAction(
          async () => {
            const { error } = await supabase.from(TABLES.documents).update(changes).eq("id", id);
            if (error) throw error;
          },
          "Document mis à jour.",
        ),
};
