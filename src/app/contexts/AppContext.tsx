import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "teacher" | "director";

export const ALL_CLASSES = ["CI", "CP", "CE1", "CE2", "CM1", "CM2"];

interface AppContextValue {
  role: UserRole;
  setRole: (r: UserRole) => void;
  activeClass: string;
  setActiveClass: (c: string) => void;
  userName: string;
  schoolName: string;
  ief: string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole]             = useState<UserRole>("teacher");
  const [activeClass, setActiveClass] = useState("CE2");

  return (
    <AppContext.Provider value={{
      role, setRole,
      activeClass, setActiveClass,
      userName:   "M. Ba",
      schoolName: "École Ilyaou Mamadou SEYDI",
      ief:        "Kolda",
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
