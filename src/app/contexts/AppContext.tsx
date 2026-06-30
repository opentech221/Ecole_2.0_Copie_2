import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useAuthContext }                                                  from "./AuthContext";

export type UserRole = "teacher" | "director";

export const ALL_CLASSES = ["CI", "CP", "CE1", "CE2", "CM1", "CM2"];

interface AppContextValue {
  role:           UserRole;
  setRole:        (r: UserRole) => void;
  activeClass:    string;
  setActiveClass: (c: string) => void;
  userName:       string;
  schoolName:     string;
  ief:            string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { profile }                       = useAuthContext();
  const [role,         setRole]           = useState<UserRole>("teacher");
  const [activeClass,  setActiveClass]    = useState("CE2");

  // Sync role and active class from the authenticated profile
  useEffect(() => {
    if (profile?.role)         setRole(profile.role);
    if (profile?.classeActive) setActiveClass(profile.classeActive);
  }, [profile]);

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
