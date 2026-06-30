/**
 * ProfileGuardLoader
 *
 * Two rendering modes controlled by props:
 *
 *   loading  → Elegant spinner while auth/profile resolves.
 *   blocked  → Warning card: profile incomplete.
 *              Shows "Compléter mon profil" (primary) and the discreet
 *              "Passer cette étape" escape hatch (secondary).
 */

import { GraduationCap, AlertTriangle, ArrowRight, FlaskConical } from "lucide-react";
import { useNavigate } from "react-router";

interface Props {
  /** Show the spinner (auth still loading). */
  loading?: boolean;
  /** Show the incomplete-profile warning card. */
  blocked?: boolean;
  /** Called when the user clicks "Passer cette étape". */
  onSkip?: () => void;
}

export function ProfileGuardLoader({ loading, blocked, onSkip }: Props) {
  const navigate = useNavigate();

  // ── Spinner ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        minHeight: "60vh", gap: "16px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <div style={{ position: "relative", width: 56, height: 56 }}>
          <svg
            width="56" height="56" viewBox="0 0 56 56"
            style={{ position: "absolute", inset: 0, animation: "pgSpin 1.1s linear infinite" }}
          >
            <circle cx="28" cy="28" r="24" fill="none" stroke="#e2e8f0" strokeWidth="3" />
            <circle
              cx="28" cy="28" r="24" fill="none" stroke="#3182ce" strokeWidth="3"
              strokeDasharray="40 110" strokeLinecap="round"
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <GraduationCap style={{ width: 24, height: 24, color: "#1a365d" }} />
          </div>
        </div>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#64748b", margin: 0 }}>
          Vérification du profil…
        </p>
        <style>{`@keyframes pgSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Incomplete profile warning card ────────────────────────────────────────
  if (blocked) {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        minHeight: "60vh", padding: "24px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <div style={{
          width: "100%", maxWidth: "420px",
          backgroundColor: "#fff", borderRadius: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 8px 32px rgba(26,54,93,0.10)",
          overflow: "hidden",
        }}>
          {/* Header strip */}
          <div style={{
            backgroundColor: "#fffbeb",
            borderBottom: "1px solid #fde68a",
            padding: "16px 20px",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <AlertTriangle style={{ width: 20, height: 20, color: "#d97706", flexShrink: 0 }} />
            <p style={{ fontSize: "14px", fontWeight: 800, color: "#92400e", margin: 0 }}>
              Profil incomplet
            </p>
          </div>

          {/* Body */}
          <div style={{ padding: "20px" }}>
            <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.65, margin: "0 0 20px" }}>
              Le <strong>nom de l'école</strong> et votre <strong>nom complet</strong> sont
              nécessaires pour générer des documents officiels avec un en-tête correct.
            </p>

            {/* Primary CTA */}
            <button
              onClick={() => navigate("/profil")}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: "12px",
                backgroundColor: "#1a365d", color: "#fff",
                fontWeight: 700, fontSize: "14px",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                boxShadow: "0 3px 12px rgba(26,54,93,0.25)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                marginBottom: "10px",
              }}
            >
              Compléter mon profil
              <ArrowRight style={{ width: 15, height: 15 }} />
            </button>

            {/* Divider */}
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              margin: "14px 0",
            }}>
              <div style={{ flex: 1, height: 1, backgroundColor: "#f1f5f9" }} />
              <span style={{ fontSize: "11px", color: "#cbd5e1", fontWeight: 600 }}>ou</span>
              <div style={{ flex: 1, height: 1, backgroundColor: "#f1f5f9" }} />
            </div>

            {/* Skip CTA — discreet, clearly labelled as test mode */}
            <button
              onClick={onSkip}
              style={{
                width: "100%", padding: "10px 16px", borderRadius: "10px",
                backgroundColor: "transparent",
                color: "#94a3b8", fontWeight: 600, fontSize: "12px",
                border: "1.5px dashed #e2e8f0", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <FlaskConical style={{ width: 13, height: 13 }} />
              Passer cette étape (mode test)
            </button>
            <p style={{
              fontSize: "11px", color: "#cbd5e1", textAlign: "center",
              margin: "8px 0 0", lineHeight: 1.5,
            }}>
              Les documents générés en mode test n'auront pas de nom d'école.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
