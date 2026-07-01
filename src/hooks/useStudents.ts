/** @deprecated P2.2 — Not imported by any screen. Prefer useDocumentsQuery
 * (React Query) for documents, or studentsApi directly for students.
 * Safe to delete after confirming no external integrations depend on it.
 */
/**
 * useStudents — CRUD hook for the students table.
 *
 * Provides:
 *  - Automatic loading of students for the active class
 *  - Optimistic state updates (no full refetch on mutate)
 *  - Delete confirmation before any destructive operation
 */

import { useState, useEffect, useCallback } from "react";
import { studentsApi, type StudentRow } from "../services/apiService";
import { useAppContext } from "../app/contexts/AppContext";

export function useStudents() {
  const { activeClass } = useAppContext();
  const [students, setStudents]   = useState<StudentRow[]>([]);
  const [loading,  setLoading]    = useState(false);
  const [error,    setError]      = useState<string | null>(null);

  // ── Load ────────────────────────────────────────────────────────────────────
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await studentsApi.list(activeClass);
      setStudents(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [activeClass]);

  useEffect(() => { reload(); }, [reload]);

  // ── Create ──────────────────────────────────────────────────────────────────
  const createStudent = useCallback(
    async (row: Omit<StudentRow, "id" | "created_at">) => {
      const created = await studentsApi.create({ ...row, class_id: activeClass });
      setStudents(prev => [...prev, created]);
      return created;
    },
    [activeClass],
  );

  // ── Update (optimistic) ─────────────────────────────────────────────────────
  const updateStudent = useCallback(
    async (id: string, changes: Partial<StudentRow>) => {
      setStudents(prev =>
        prev.map(s => (s.id === id ? { ...s, ...changes } : s))
      );
      await studentsApi.update(id, changes);
    },
    [],
  );

  // ── Delete (with browser-level confirmation) ────────────────────────────────
  const deleteStudent = useCallback(
    async (id: string, nom: string) => {
      const confirmed = window.confirm(
        `Supprimer définitivement l'élève ${nom} ?\n` +
        "Ses notes et ses documents seront également effacés (suppression en cascade)."
      );
      if (!confirmed) return false;

      await studentsApi.delete(id, nom);
      setStudents(prev => prev.filter(s => s.id !== id));
      return true;
    },
    [],
  );

  return { students, loading, error, reload, createStudent, updateStudent, deleteStudent };
}
