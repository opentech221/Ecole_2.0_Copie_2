import { createContext, useContext, type ReactNode } from "react";
import { useAuth }                                   from "../../hooks/useAuth";
import type { UserProfile }                          from "../../hooks/useAuth";
import type { Session, User }                        from "@supabase/supabase-js";

interface AuthContextValue {
  session:        Session     | null;
  user:           User        | null;
  profile:        UserProfile | null;
  loading:        boolean;
  error:          string      | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
