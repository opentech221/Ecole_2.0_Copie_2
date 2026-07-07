import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuthContext }  from "./AuthContext";
import { supabase }        from "../../lib/supabase";

export type UserRole = "teacher" | "director";

export const ALL_CLASSES = ["CI", "CP", "CE1", "CE2", "CM1", "CM2"];

interface AppContextValue {
  role:           UserRole;
  setRole:        (r: UserRole) => Promise<void>;
  activeClass:    string;
  setActiveClass: (c: string) => void;
  userName:       string;
  schoolName:     string;
  ief:            string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { profile }                       = useAuthContext();
  const { user } = useAuthContext();
  const [role,        setRoleState] = useState<UserRole>("teacher");
  const [activeClass, setActiveClassState] = useState("CE2");

  // Sync role and active class from the authenticated profile (read-only from backend)
  useEffect(() => {
    if (profile?.role)         setRoleState(profile.role);
    if (profile?.classeActive) setActiveClassState(profile.classeActive);
  }, [profile]);

  const setRole = useCallback(async (r: UserRole) => {
    setRoleState(r);
    if (!user?.id) return;
    const { error } = await supabase.from("profiles").update({ role: r }).eq("id", user.id);
    if (error) {
      // Keep UI consistent with backend if role updates are restricted server-side.
      setRoleState(profile?.role ?? "teacher");
      return;
    }
  }, [user?.id, profile?.role]);

  // Persist class changes to the profile so the selection survives across devices (P1.3)
  const setActiveClass = useCallback((c: string) => {
    setActiveClassState(c);
    if (user?.id) {
      supabase.from("profiles").update({ classe_active: c }).eq("id", user.id);
    }
  }, [user?.id]);

  return (
    <AppContext.Provider value={{
      role, setRole,
      activeClass, setActiveClass,
      userName:   profile?.fullName  || "Enseignant",
      schoolName: profile?.ecoleName || "Mon École",
      ief:        profile?.ief       || "Dakar-Plateau",
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
