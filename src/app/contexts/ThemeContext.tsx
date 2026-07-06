/**
 * ThemeContext — 2-theme system (light / dark).
 *
 * Applies a class to <html> so CSS variable overrides take effect instantly.
 * Persists to localStorage (fast) and Supabase profiles (cross-device).
 */

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import { supabase } from "../../lib/supabase";

export type Theme = "light" | "dark";

export const THEMES: { id: Theme; label: string; palette: string[] }[] = [
  { id: "light", label: "Clair",  palette: ["#ffffff", "#0f172a", "#2563eb"] },
  { id: "dark",  label: "Sombre", palette: ["#0b1220", "#f8fafc", "#60a5fa"] },
];

const HTML_CLASSES: Record<Theme, string[]> = {
  light: [],
  dark: ["dark"],
};

function normalizeTheme(value: string | null): Theme {
  return value === "dark" ? "dark" : "light";
}

const STORAGE_KEY = "ecole2-theme";

interface ThemeContextValue {
  theme:    Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => normalizeTheme(localStorage.getItem(STORAGE_KEY)));

  // Apply HTML class whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    HTML_CLASSES[theme].forEach(c => root.classList.add(c));
  }, [theme]);

  useEffect(() => {
    const storedTheme = normalizeTheme(localStorage.getItem(STORAGE_KEY));
    if (storedTheme !== localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, storedTheme);
    }
  }, []);

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

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
