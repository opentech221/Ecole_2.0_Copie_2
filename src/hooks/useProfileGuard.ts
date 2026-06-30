/**
 * useProfileGuard
 *
 * Verifies that the authenticated user has filled the fields required for
 * document generation. Instead of auto-redirecting, it exposes a `blocked`
 * flag so the calling screen can render the ProfileGuardLoader.
 *
 * "Passer cette étape" — the user can call skip() to bypass the guard for
 * the current browser session (stored in sessionStorage). This is intentionally
 * a lightweight escape hatch for testing, NOT a production bypass.
 *
 * hasEcoleNom — hard requirement for official document output. Even in skip
 * mode, screens that generate documents must check this and block printing.
 *
 * Returns:
 *   loading      — auth state still resolving
 *   isComplete   — all required fields are filled
 *   skipped      — user explicitly bypassed the guard
 *   blocked      — !loading && !isComplete && !skipped  (show warning UI)
 *   hasEcoleNom  — ecole_nom is filled (required for document output)
 *   skip()       — mark guard as bypassed for this session
 *   profile      — current UserProfile
 */

import { useState }        from "react";
import { useAuthContext }  from "../app/contexts/AuthContext";

const SESSION_KEY = "ecole2-profile-guard-skipped";

export function useProfileGuard() {
  const { profile, loading } = useAuthContext();

  // Initialise from sessionStorage so skip persists across navigations
  // within the same tab, but resets on page reload / new tab.
  const [skipped, setSkipped] = useState<boolean>(
    () => sessionStorage.getItem(SESSION_KEY) === "1"
  );

  const isComplete =
    !loading &&
    !!profile &&
    !!profile.ecoleName?.trim() &&
    !!profile.fullName?.trim();

  // ecole_nom alone is the hard gate for official document output.
  const hasEcoleNom = !loading && !!profile?.ecoleName?.trim();

  // Show the warning UI only when not loading, incomplete, and not bypassed.
  const blocked = !loading && !isComplete && !skipped;

  function skip() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setSkipped(true);
  }

  return { loading, isComplete, skipped, blocked, hasEcoleNom, skip, profile };
}
