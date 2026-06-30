/**
 * useAuth — Supabase session + profile hook.
 *
 * Returns the current authenticated session, user, and their full profile
 * row from public.profiles (including extended school fields).
 */

import { useState, useEffect } from "react";
import type { Session, User }  from "@supabase/supabase-js";
import { supabase }            from "../lib/supabase";

export type UserRole = "teacher" | "director";

export interface UserProfile {
  id:           string;
  role:         UserRole;
  fullName:     string;
  schoolId?:    string;
  classId?:     string;
  // Extended school / personal info
  ecoleName?:   string;
  ief?:         string;
  telephone?:   string;
  adresse?:     string;
  signatureUrl?: string;
  logoUrl?:     string;
  classeActive?: string;
}

interface AuthState {
  session:        Session | null;
  user:           User    | null;
  profile:        UserProfile | null;
  loading:        boolean;
  error:          string  | null;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [session,  setSession]  = useState<Session | null>(null);
  const [profile,  setProfile]  = useState<UserProfile | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  async function fetchProfile(userId: string) {
    const { data, error: err } = await supabase
      .from("profiles")
      .select(
        "id, role, full_name, school_id, class_id, " +
        "ecole_nom, ief, telephone, adresse, " +
        "signature_url, logo_url, classe_active"
      )
      .eq("id", userId)
      .single();

    if (err || !data) {
      setError(err?.message ?? "Profil introuvable");
      return;
    }

    setProfile({
      id:           data.id,
      role:         (data.role ?? "teacher") as UserRole,
      fullName:     data.full_name     ?? "",
      schoolId:     data.school_id     ?? undefined,
      classId:      data.class_id      ?? undefined,
      ecoleName:    data.ecole_nom     ?? undefined,
      ief:          data.ief           ?? undefined,
      telephone:    data.telephone     ?? undefined,
      adresse:      data.adresse       ?? undefined,
      signatureUrl: data.signature_url ?? undefined,
      logoUrl:      data.logo_url      ?? undefined,
      classeActive: data.classe_active ?? undefined,
    });
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        fetchProfile(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

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
    refreshProfile: async () => {
      const uid = session?.user?.id;
      if (uid) await fetchProfile(uid);
    },
  };
}

// ── Convenience helpers ────────────────────────────────────────────────────────

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}
