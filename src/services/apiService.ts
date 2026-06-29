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
    performAction(
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

    const { data } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(path);
    return data.publicUrl;
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
    performAction(
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
    performAction(
      async () => {
        const { error } = await supabase.from(TABLES.documents).update(changes).eq("id", id);
        if (error) throw error;
      },
      "Document mis à jour.",
    ),
};
