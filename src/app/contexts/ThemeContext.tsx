/**
 * ThemeContext — 4-theme system (light / dark / emerald / ocean).
 *
 * Applies a class to <html> so CSS variable overrides take effect instantly.
 * Persists to localStorage (fast) and Supabase profiles (cross-device).
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "../../lib/supabase";

export type Theme = "light" | "dark" | "emerald" | "ocean";

export const THEMES: { id: Theme; label: string; palette: string[] }[] = [
  { id: "light",   label: "Clair",         palette: ["#ffffff", "#1a365d", "#3182ce"] },
  { id: "dark",    label: "Sombre",         palette: ["#1c1c1e", "#e2e8f0", "#60a5fa"] },
  { id: "emerald", label: "Vert Émeraude",  palette: ["#ffffff", "#059669", "#0d9488"] },
  { id: "ocean",   label: "Bleu Océan",     palette: ["#ffffff", "#0284c7", "#0369a1"] },
];

const HTML_CLASSES: Record<Theme, string[]> = {
  light:   [],
  dark:    ["dark"],
  emerald: ["theme-emerald"],
  ocean:   ["theme-ocean"],
};

const STORAGE_KEY = "ecole2-theme";

interface ThemeContextValue {
  theme:    Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "light"
  );

  // Apply HTML class whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "theme-emerald", "theme-ocean");
    HTML_CLASSES[theme].forEach(c => root.classList.add(c));
  }, [theme]);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    // Fire-and-forget cross-device persistence
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("profiles").update({ theme: t }).eq("id", user.id);
      }
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
