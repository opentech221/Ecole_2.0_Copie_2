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

type ProfileRow = {
  id: string;
  role: string | null;
  full_name: string | null;
  school_id: string | null;
  class_id: string | null;
  ecole_nom: string | null;
  ief: string | null;
  telephone: string | null;
  adresse: string | null;
  signature_url: string | null;
  logo_url: string | null;
  classe_active: string | null;
};

const E2E_AUTH_STORAGE_KEY = "ecole2-e2e-auth";

function readE2eAuthOverride() {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(E2E_AUTH_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function createE2eSession(): Session {
  const user = {
    id: "00000000-0000-4000-8000-000000000001",
    email: "e2e-admin@ecole.local",
    role: "authenticated",
    aud: "authenticated",
    app_metadata: {},
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
  } as unknown as User;

  return {
    access_token: "e2e-access-token",
    refresh_token: "e2e-refresh-token",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user,
  } as Session;
}

function createE2eProfile(): UserProfile {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    role: "director",
    fullName: "E2E Director",
    ecoleName: "Ecole 2.0 E2E",
    classeActive: "CM2",
  };
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

    const row = data as unknown as ProfileRow;

    setProfile({
      id:           row.id,
      role:         (row.role ?? "teacher") as UserRole,
      fullName:     row.full_name     ?? "",
      schoolId:     row.school_id     ?? undefined,
      classId:      row.class_id      ?? undefined,
      ecoleName:    row.ecole_nom     ?? undefined,
      ief:          row.ief           ?? undefined,
      telephone:    row.telephone     ?? undefined,
      adresse:      row.adresse       ?? undefined,
      signatureUrl: row.signature_url ?? undefined,
      logoUrl:      row.logo_url      ?? undefined,
      classeActive: row.classe_active ?? undefined,
    });
  }

  useEffect(() => {
    if (readE2eAuthOverride()) {
      const e2eSession = createE2eSession();
      setSession(e2eSession);
      setProfile(createE2eProfile());
      setLoading(false);
      return;
    }

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
