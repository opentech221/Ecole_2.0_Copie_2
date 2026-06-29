/**
 * useGradesMutation — Optimistic UI + Undo for grade changes.
 *
 * Flow for a single grade change:
 *  1. Caller invokes `handleGradeChange(studentId, discipline, t, newValue)`.
 *  2. The local gradesMap is updated INSTANTLY (optimistic UI).
 *  3. A Sonner toast appears: "Note mise à jour" with an "Annuler" action.
 *  4. A 1.5-second debounce timer is armed.
 *     ┌─ User clicks "Annuler" (within 5 s) ──────────────────────────────────┐
 *     │  • Cancel the pending debounce timer (save never fires).              │
 *     │  • Restore the previous value in the local gradesMap.                  │
 *     │  • If the debounce already fired: re-save the OLD value to Supabase.  │
 *     └───────────────────────────────────────────────────────────────────────┘
 *     ┌─ 1.5 s pass without Annuler ──────────────────────────────────────────┐
 *     │  • Save the new value to Supabase.                                     │
 *     │  • Invalidate React Query cache → all components re-render instantly.  │
 *     └───────────────────────────────────────────────────────────────────────┘
 *
 * Because the save and the Undo share the same timer reference, there is no
 * race condition: either the Undo cancels the timer, or the timer fires and
 * the 5-second Undo window has already closed.
 */

import { useRef, useCallback } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { gradesApi, type GradeRow } from "../services/apiService";
import { QK } from "../lib/queryClient";

type GradeSet = { t1: number; t2: number; t3: number };
type GradesMap = Record<string, Record<string, GradeSet>>;

interface UseGradesMutationOptions {
  gradesMap:      GradesMap;
  setGradesMap:   React.Dispatch<React.SetStateAction<GradesMap>>;
  activeClass:    string;
  trimestre:      1 | 2 | 3;
  gradeSchema:    Record<string, number>;
  onSaveStatus?:  (status: "idle" | "saving" | "saved" | "error") => void;
}

export function useGradesMutation({
  gradesMap,
  setGradesMap,
  activeClass,
  trimestre,
  gradeSchema,
  onSaveStatus,
}: UseGradesMutationOptions) {
  const queryClient = useQueryClient();
  const saveTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track whether the last debounce already fired so the Undo knows
  // whether it needs to issue a compensating DB write.
  const savedRef      = useRef(false);

  const handleGradeChange = useCallback(
    (studentId: string, discipline: string, t: 1 | 2 | 3, newValue: number) => {
      const tKey = `t${t}` as keyof GradeSet;

      // ── Snapshot old value for potential rollback ────────────────────────
      const oldValue: number =
        gradesMap[studentId]?.[discipline]?.[tKey] ?? 0;

      if (oldValue === newValue) return; // no-op

      // ── 1. Optimistic update — instant UI ───────────────────────────────
      setGradesMap(prev => {
        const sGrades  = prev[studentId] ?? {};
        const prevDisc = sGrades[discipline] ?? { t1: 0, t2: 0, t3: 0 };
        return {
          ...prev,
          [studentId]: {
            ...sGrades,
            [discipline]: { ...prevDisc, [tKey]: newValue },
          },
        };
      });

      // ── 2. Cancel any pending save from a previous change ────────────────
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      savedRef.current = false;
      onSaveStatus?.("idle");

      // ── 3. Undo action — restores state and optionally reverts DB ────────
      const handleUndo = () => {
        // Cancel pending save if the timer is still running
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
          saveTimerRef.current = null;
        }

        // Restore local state immediately
        setGradesMap(prev => {
          const sGrades  = prev[studentId] ?? {};
          const prevDisc = sGrades[discipline] ?? { t1: 0, t2: 0, t3: 0 };
          return {
            ...prev,
            [studentId]: {
              ...sGrades,
              [discipline]: { ...prevDisc, [tKey]: oldValue },
            },
          };
        });

        onSaveStatus?.("idle");

        // If the debounce already fired, we need a compensating DB write
        if (savedRef.current) {
          const rollbackRow: GradeRow = {
            student_id: studentId,
            class_id:   activeClass,
            discipline,
            trimestre:  t,
            score:      oldValue,
            max_score:  gradeSchema[discipline] ?? 10,
          };
          gradesApi.upsertBatch([rollbackRow])
            .then(() => {
              queryClient.invalidateQueries({ queryKey: QK.grades(activeClass, trimestre) });
            })
            .catch(() => {
              toast.error("Échec de l'annulation — veuillez vérifier la note.");
            });
        }
      };

      // ── 4. Toast with Undo action (5 s window) ───────────────────────────
      toast.success(`Note mise à jour : ${newValue.toFixed(2)} / ${gradeSchema[discipline] ?? 10}`, {
        duration: 5000,
        action: {
          label:   "Annuler",
          onClick: handleUndo,
        },
      });

      // ── 5. Debounced DB save (1.5 s) ─────────────────────────────────────
      onSaveStatus?.("saving");
      saveTimerRef.current = setTimeout(async () => {
        const row: GradeRow = {
          student_id: studentId,
          class_id:   activeClass,
          discipline,
          trimestre:  t,
          score:      newValue,
          max_score:  gradeSchema[discipline] ?? 10,
        };
        try {
          await gradesApi.upsertBatch([row]);
          savedRef.current = true;
          onSaveStatus?.("saved");
          // Invalidate so every component showing these grades refreshes
          queryClient.invalidateQueries({ queryKey: QK.grades(activeClass, trimestre) });
          setTimeout(() => onSaveStatus?.("idle"), 2500);
        } catch {
          onSaveStatus?.("error");
          toast.error("Erreur d'enregistrement — réessayez.");
          setTimeout(() => onSaveStatus?.("idle"), 4000);
        }
      }, 1500);
    },
    [gradesMap, activeClass, trimestre, gradeSchema, setGradesMap, onSaveStatus, queryClient],
  );

  return { handleGradeChange };
}
