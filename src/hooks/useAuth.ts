/**
 * useAuth — Supabase session + profile hook.
 *
 * Provides the current authenticated user alongside their profile
 * row (role, class_id, full_name) pulled from public.profiles.
 *
 * Usage:
 *   const { user, profile, loading } = useAuth();
 *   if (profile?.role === 'director') { ... }
 */

import { useState, useEffect } from "react";
import type { Session, User }  from "@supabase/supabase-js";
import { supabase }            from "../lib/supabase";

export type UserRole = "teacher" | "director";

export interface UserProfile {
  id:        string;
  role:      UserRole;
  fullName:  string;
  schoolId?: string;
  classId?:  string;  // active class for teachers
}

interface AuthState {
  session:  Session | null;
  user:     User    | null;
  profile:  UserProfile | null;
  loading:  boolean;
  error:    string  | null;
}

export function useAuth(): AuthState {
  const [session,  setSession]  = useState<Session | null>(null);
  const [profile,  setProfile]  = useState<UserProfile | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  // ── Fetch profile from public.profiles ────────────────────────────────────
  async function fetchProfile(userId: string) {
    const { data, error: err } = await supabase
      .from("profiles")
      .select("id, role, full_name, school_id, class_id")
      .eq("id", userId)
      .single();

    if (err || !data) {
      setError(err?.message ?? "Profil introuvable");
      return;
    }
    setProfile({
      id:       data.id,
      role:     (data.role ?? "teacher") as UserRole,
      fullName: data.full_name ?? "Inconnu",
      schoolId: data.school_id ?? undefined,
      classId:  data.class_id  ?? undefined,
    });
  }

  useEffect(() => {
    // 1. Restore the existing session (if any)
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        fetchProfile(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // 2. Subscribe to future auth state changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        if (s?.user) {
          fetchProfile(s.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    session,
    user:    session?.user ?? null,
    profile,
    loading,
    error,
  };
}

// ── Convenience sign-in / sign-out helpers ────────────────────────────────────

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}
