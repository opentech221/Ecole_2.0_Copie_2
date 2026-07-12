import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface AdminSaasMetrics {
  activeUsers: number;
  teacherCount: number;
  directorCount: number;
  studentCount: number;
  documentCount: number;
  loading: boolean;
  error: string | null;
}

export function useAdminSaasMetrics() {
  const [data, setData] = useState<AdminSaasMetrics>({
    activeUsers: 0,
    teacherCount: 0,
    directorCount: 0,
    studentCount: 0,
    documentCount: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [profilesResult, studentsResult, documentsResult] = await Promise.all([
          supabase.from("profiles").select("id, role", { count: "exact", head: false }),
          supabase.from("students").select("id", { count: "exact", head: false }),
          supabase.from("documents").select("id", { count: "exact", head: false }),
        ]);

        if (!active) return;

        const profiles = profilesResult.data ?? [];
        const teacherCount = profiles.filter((row: { role?: string }) => row.role === "teacher").length;
        const directorCount = profiles.filter((row: { role?: string }) => row.role === "director").length;

        setData({
          activeUsers: profiles.length,
          teacherCount,
          directorCount,
          studentCount: studentsResult.count ?? 0,
          documentCount: documentsResult.count ?? 0,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (!active) return;
        setData((prev) => ({ ...prev, loading: false, error: error instanceof Error ? error.message : "Erreur de chargement" }));
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return data;
}
