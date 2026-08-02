/**
 * useStudentsQuery — React Query hook for students CRUD.
 *
 * Provides:
 *  - Automatic cache + background refetch via React Query
 *  - Delete mutation with loading state (prevents double-click)
 *  - Cache invalidation on mutation so every component stays in sync
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { studentsApi, type StudentRow } from "../services/apiService";
import { QK } from "../lib/queryClient";
import { useAppContext } from "../app/contexts/AppContext";

const E2E_AUTH_STORAGE_KEY = "ecole2-e2e-auth";

function isE2eAuthOverride() {
  return typeof window !== "undefined" && window.localStorage.getItem(E2E_AUTH_STORAGE_KEY) === "1";
}

function createE2eStudents(classId: string): StudentRow[] {
  return [
    {
      id: "00000000-0000-4000-8000-000000000011",
      class_id: classId,
      matricule: "E2E-001",
      nom: "DIALLO",
      prenom: "Aminata",
      genre: "F",
      date_naissance: "2016-05-12",
      lieu_naissance: "Dakar",
      tuteur_nom: "Ibrahima Diallo",
      tuteur_phone: "+221770000001",
    },
    {
      id: "00000000-0000-4000-8000-000000000012",
      class_id: classId,
      matricule: "E2E-002",
      nom: "SOW",
      prenom: "Moussa",
      genre: "M",
      date_naissance: "2016-09-21",
      lieu_naissance: "Thiès",
      tuteur_nom: "Mariama Sow",
      tuteur_phone: "+221770000002",
    },
  ];
}

export function useStudentsQuery() {
  const { activeClass } = useAppContext();
  const queryClient     = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Read ──────────────────────────────────────────────────────────────────
  const query = useQuery({
    queryKey: QK.students(activeClass),
    queryFn:  () => (isE2eAuthOverride() ? createE2eStudents(activeClass) : studentsApi.list(activeClass)),
  });

  // ── Create ────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (row: Omit<StudentRow, "id" | "created_at">) =>
      studentsApi.create({ ...row, class_id: activeClass }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.students(activeClass) });
    },
  });

  // ── Update (optimistic) ───────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<StudentRow> }) =>
      studentsApi.update(id, changes),
    onMutate: async ({ id, changes }) => {
      await queryClient.cancelQueries({ queryKey: QK.students(activeClass) });
      const snapshot = queryClient.getQueryData<StudentRow[]>(QK.students(activeClass));
      queryClient.setQueryData<StudentRow[]>(QK.students(activeClass), old =>
        (old ?? []).map(s => (s.id === id ? { ...s, ...changes } : s))
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) {
        queryClient.setQueryData(QK.students(activeClass), ctx.snapshot);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QK.students(activeClass) });
    },
  });

  // ── Delete with mandatory confirmation + loading guard ────────────────────
  const deleteStudent = useCallback(
    async (id: string, nom: string) => {
      const confirmed = window.confirm(
        `Supprimer définitivement ${nom} ?\n` +
        "Ses notes et documents seront effacés (cascade Supabase).\n\n" +
        "Cette action est irréversible."
      );
      if (!confirmed) return;

      setDeletingId(id);
      try {
        await studentsApi.delete(id, nom);
        queryClient.invalidateQueries({ queryKey: QK.students(activeClass) });
        // Grades and documents are deleted server-side via FK cascade
        queryClient.invalidateQueries({ queryKey: QK.grades(activeClass, 1) });
        queryClient.invalidateQueries({ queryKey: QK.grades(activeClass, 2) });
        queryClient.invalidateQueries({ queryKey: QK.grades(activeClass, 3) });
        queryClient.invalidateQueries({ queryKey: QK.documents(activeClass) });
      } catch {
        /* toast already shown by studentsApi.delete */
      } finally {
        setDeletingId(null);
      }
    },
    [activeClass, queryClient],
  );

  return {
    students:      query.data ?? [],
    isLoading:     query.isLoading,
    error:         query.error,
    refetch:       query.refetch,
    createStudent: createMutation.mutateAsync,
    updateStudent: (id: string, changes: Partial<StudentRow>) =>
                   updateMutation.mutateAsync({ id, changes }),
    deleteStudent,
    deletingId,
  };
}
