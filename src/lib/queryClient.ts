import { QueryClient } from "@tanstack/react-query";

/**
 * Singleton QueryClient — shared across the entire app via QueryClientProvider.
 *
 * Cache strategy for École 2.0:
 *  - staleTime 5 min  → classroom data doesn't change every second
 *  - gcTime    10 min → keep inactive queries in memory for fast back-navigation
 *  - retry 1          → one automatic retry on transient network failures
 *  - refetchOnWindowFocus false → no surprise refreshes while typing grades
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            1000 * 60 * 5,
      gcTime:               1000 * 60 * 10,
      retry:                1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ─── Centralised query-key factory ────────────────────────────────────────────
// Keeping keys in one place means a single rename touches every invalidation call.
export const QK = {
  students:         (classId: string)                    => ["students", classId]          as const,
  grades:           (classId: string, trimestre: number) => ["grades",   classId, trimestre] as const,
  documents:        (classId: string, type?: string)     => ["documents", classId, type]    as const,
  disciplineConfig: (classId: string, trimestre: number) => ["disciplineConfig", classId, trimestre] as const,
};
