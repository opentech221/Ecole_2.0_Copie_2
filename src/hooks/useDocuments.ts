/** @deprecated P2.2 — Not imported by any screen. Prefer useDocumentsQuery
 * (React Query) for documents, or studentsApi directly for students.
 * Safe to delete after confirming no external integrations depend on it.
 */
/**
 * useDocuments — CRUD hook for documents (metadata + Supabase Storage).
 *
 * Features:
 *  - Lists documents filtered by class and optional type
 *  - Upload: stores the file in Supabase Storage then inserts a metadata row
 *  - Delete: removes metadata + Storage file atomically (via apiService)
 *  - Falls back to provided mock data when the table is empty (offline demo)
 */

import { useState, useEffect, useCallback } from "react";
import { documentsApi, type DocumentRow } from "../services/apiService";
import { useAppContext } from "../app/contexts/AppContext";

export function useDocuments(mockFallback: DocumentRow[] = []) {
  const { activeClass } = useAppContext();
  const [documents, setDocuments] = useState<DocumentRow[]>(mockFallback);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // ── Load ────────────────────────────────────────────────────────────────────
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await documentsApi.list(activeClass);
      // If Supabase returns data use it; otherwise keep mock fallback
      if (rows.length > 0) setDocuments(rows);
    } catch {
      // Network / auth issue — silently keep mock data
    } finally {
      setLoading(false);
    }
  }, [activeClass]);

  useEffect(() => { reload(); }, [reload]);

  // ── Upload + Create ─────────────────────────────────────────────────────────
  const uploadDocument = useCallback(
    async (
      file: File,
      meta: Omit<DocumentRow, "id" | "created_at" | "file_path" | "class_id">,
    ) => {
      // upload() now returns the bucket-internal path (not a public URL)
      const bucketPath = await documentsApi.upload(activeClass, meta.type, file);
      const created    = await documentsApi.create({
        ...meta,
        class_id:  activeClass,
        file_path: bucketPath,
      });
      setDocuments(prev => [created, ...prev]);
      return created;
    },
    [activeClass],
  );

  // ── Delete (requires confirmation from caller) ──────────────────────────────
  const deleteDocument = useCallback(
    async (doc: DocumentRow, confirmed: boolean) => {
      if (!confirmed) return false;
      await documentsApi.delete(doc);
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      return true;
    },
    [],
  );

  // ── Update metadata ─────────────────────────────────────────────────────────
  const updateDocument = useCallback(
    async (id: string, changes: Partial<DocumentRow>) => {
      await documentsApi.update(id, changes);
      setDocuments(prev =>
        prev.map(d => (d.id === id ? { ...d, ...changes } : d))
      );
    },
    [],
  );

  return { documents, loading, error, reload, uploadDocument, deleteDocument, updateDocument };
}
