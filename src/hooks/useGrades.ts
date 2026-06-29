/**
 * useGrades — Debounced auto-save hook for the student_grades table.
 *
 * Design decisions:
 *  - Local state is the single source of truth during editing.
 *  - Changes are batched and persisted 1.5 s after the last keystroke.
 *  - `saveStatus` drives the "Enregistrement…" / "Enregistré ✓" indicator.
 *  - On mount, grades are loaded from Supabase if the table has data;
 *    otherwise the seeded mock data remains active (offline-first fallback).
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { gradesApi, type GradeRow } from "../services/apiService";
import { useAppContext } from "../app/contexts/AppContext";

export type GradesMap = Record<string, Record<string, { t1: number; t2: number; t3: number }>>;

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useGrades(
  initialGrades: GradesMap,
  trimestre: 1 | 2 | 3,
  gradeSchema: Record<string, number>,
) {
  const { activeClass } = useAppContext();
  const [gradesMap, setGradesMap]   = useState<GradesMap>(initialGrades);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const hasEdited   = useRef(false);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load from Supabase on mount / class change ─────────────────────────────
  useEffect(() => {
    gradesApi.list(activeClass, trimestre).then(rows => {
      if (rows.length === 0) return; // use mock data if table is empty
      const hydrated: GradesMap = {};
      rows.forEach(r => {
        if (!hydrated[r.student_id]) hydrated[r.student_id] = {};
        const prev = hydrated[r.student_id][r.discipline] ?? { t1: 0, t2: 0, t3: 0 };
        const key  = `t${r.trimestre}` as "t1" | "t2" | "t3";
        hydrated[r.student_id][r.discipline] = { ...prev, [key]: r.score };
      });
      setGradesMap(hydrated);
    }).catch(() => {/* offline / table not created yet — silently use mock data */});
  }, [activeClass, trimestre]);

  // ── Debounced Supabase upsert ───────────────────────────────────────────────
  useEffect(() => {
    if (!hasEdited.current) return;
    setSaveStatus("saving");
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        const payload: GradeRow[] = Object.entries(gradesMap).flatMap(
          ([studentId, disciplines]) =>
            Object.entries(disciplines).map(([discipline, g]) => ({
              student_id:  studentId,
              class_id:    activeClass,
              discipline,
              trimestre,
              score:       trimestre === 1 ? g.t1 : trimestre === 2 ? g.t2 : g.t3,
              max_score:   gradeSchema[discipline] ?? 10,
            }))
        );
        await gradesApi.upsertBatch(payload);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2500);
      } catch (e) {
        setSaveStatus("error");
        toast.error("Erreur d'enregistrement des notes.");
        setTimeout(() => setSaveStatus("idle"), 4000);
      }
    }, 1500);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [gradesMap, activeClass, trimestre, gradeSchema]);

  // ── Grade change handler ────────────────────────────────────────────────────
  const handleGradeChange = useCallback(
    (studentId: string, discipline: string, t: 1 | 2 | 3, value: number) => {
      hasEdited.current = true;
      setGradesMap(prev => {
        const sGrades  = prev[studentId] ?? {};
        const prevDisc = sGrades[discipline] ?? { t1: 0, t2: 0, t3: 0 };
        const tKey     = `t${t}` as "t1" | "t2" | "t3";
        return {
          ...prev,
          [studentId]: {
            ...sGrades,
            [discipline]: { ...prevDisc, [tKey]: value },
          },
        };
      });
    },
    [],
  );

  return { gradesMap, setGradesMap, saveStatus, handleGradeChange };
}
