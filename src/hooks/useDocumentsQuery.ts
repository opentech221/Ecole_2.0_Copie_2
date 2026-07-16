/**
 * useDocumentsQuery — React Query hook for documents with cache invalidation.
 *
 * Delete mutation: loading guard (prevents double-click) + confirmation.
 * Upload mutation: creates Storage file + metadata row then invalidates cache.
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsApi, type DocumentRow } from "../services/apiService";
import { QK } from "../lib/queryClient";
import { useAppContext } from "../app/contexts/AppContext";

export function useDocumentsQuery(mockFallback: DocumentRow[] = []) {
  const { activeClass } = useAppContext();
  const queryClient     = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Read ──────────────────────────────────────────────────────────────────
  const query = useQuery({
    queryKey:    QK.documents(activeClass),
    queryFn:     () => documentsApi.list(activeClass),
    placeholderData: mockFallback,   // show mocks while real data loads
  });

  // ── Upload + Create ───────────────────────────────────────────────────────
  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      meta,
    }: {
      file: File;
      meta: Omit<DocumentRow, "id" | "created_at" | "file_path" | "class_id">;
    }) => {
      const bucketPath = await documentsApi.upload(activeClass, meta.type, file);
      return documentsApi.create({ ...meta, class_id: activeClass, file_path: bucketPath });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.documents(activeClass) });
    },
  });

  // ── Delete with confirmation + loading guard ──────────────────────────────
  const deleteDocument = useCallback(
    async (doc: DocumentRow) => {
      const confirmed = window.confirm(
        `Supprimer définitivement « ${doc.title} » ?\n` +
        "Le fichier sera retiré du stockage Supabase.\n\n" +
        "Cette action est irréversible."
      );
      if (!confirmed) return;

      setDeletingId(doc.id ?? null);
      try {
        await documentsApi.delete(doc);
        queryClient.invalidateQueries({ queryKey: QK.documents(activeClass) });
      } catch {
        /* toast already shown by documentsApi.delete */
      } finally {
        setDeletingId(null);
      }
    },
    [activeClass, queryClient],
  );

  // ── Update metadata ───────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<DocumentRow> }) =>
      documentsApi.update(id, changes),
    onMutate: async ({ id, changes }) => {
      await queryClient.cancelQueries({ queryKey: QK.documents(activeClass) });
      const snapshot = queryClient.getQueryData<DocumentRow[]>(QK.documents(activeClass));
      queryClient.setQueryData<DocumentRow[]>(QK.documents(activeClass), old =>
        (old ?? []).map(d => (d.id === id ? { ...d, ...changes } : d))
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) {
        queryClient.setQueryData(QK.documents(activeClass), ctx.snapshot);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QK.documents(activeClass) });
    },
  });

  return {
    documents:      query.data ?? mockFallback,
    isLoading:      query.isLoading,
    error:          query.error,
    refetch:        query.refetch,
    uploadDocument: uploadMutation.mutateAsync,
    deleteDocument,
    deletingId,
    updateDocument: (id: string, changes: Partial<DocumentRow>) =>
                    updateMutation.mutateAsync({ id, changes }),
  };
}
