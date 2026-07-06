import { useState }       from "react";
import { useNavigate }    from "react-router";
import {
  Settings, Bell, BellOff, Building2, Shield,
  Sun, Moon, ChevronRight,
} from "lucide-react";
import { toast }          from "sonner";
import { useTheme, THEMES, type Theme } from "../contexts/ThemeContext";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase }       from "../../lib/supabase";

const FF = "var(--font-sans)";

// ─── Reusable section card ─────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: "var(--card)",
      borderRadius: "14px",
      border: "1px solid var(--border)",
      overflow: "hidden",
      marginBottom: "16px",
    }}>
      <div style={{
        padding: "12px 18px",
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--muted)",
      }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted-foreground)",
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    margin: 0, fontFamily: FF }}>
          {title}
        </p>
      </div>
      <div style={{ padding: "16px 18px" }}>{children}</div>
    </div>
  );
}

// ─── Toggle row ────────────────────────────────────────────────────────────────

function ToggleRow({ label, hint, value, onChange }: {
  label: string; hint?: string;
  value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: "12px", paddingBottom: "12px", marginBottom: "12px",
      borderBottom: "1px solid var(--border)",
    }}>
      <div>
        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--foreground)",
                    margin: 0, fontFamily: FF }}>
          {label}
        </p>
        {hint && (
          <p style={{ fontSize: "11px", color: "var(--muted-foreground)", margin: "2px 0 0",
                      fontFamily: FF }}>
            {hint}
          </p>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 26, borderRadius: "999px",
          backgroundColor: value ? "#059669" : "#e2e8f0",
          border: "none", cursor: "pointer",
          position: "relative", flexShrink: 0,
          transition: "background-color 200ms",
        }}
        aria-checked={value}
        role="switch"
      >
        <div style={{
          position: "absolute",
          top: "3px",
          left: value ? "21px" : "3px",
          width: 20, height: 20, borderRadius: "50%",
          backgroundColor: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
          transition: "left 200ms",
        }} />
      </button>
    </div>
  );
}

// ─── Theme card ────────────────────────────────────────────────────────────────

const THEME_ICONS: Record<Theme, React.ReactNode> = {
  light:   <Sun   style={{ width: 16, height: 16 }} />,
  dark:    <Moon  style={{ width: 16, height: 16 }} />,
};

function ThemeCard({ id, label, palette, active, onSelect }: {
  id: Theme; label: string; palette: string[]; active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      style={{
        display:         "flex",
        flexDirection:   "column",
        alignItems:      "center",
        gap:             "8px",
        padding:         "14px 10px",
        minHeight:       "88px",   /* A11: touch target stays ≥ 44 px in 2-col layout */
        borderRadius:    "12px",
        border:          `2px solid ${active ? palette[2] : "var(--border)"}`,
        backgroundColor: active ? "var(--accent)" : "var(--card)",
        cursor:          "pointer",
        transition:      "all 160ms",
        fontFamily:      FF,
      }}
    >
      {/* Color swatches */}
      <div style={{ display: "flex", gap: "4px" }}>
        {palette.map((c, i) => (
          <div key={i} style={{
            width: 18, height: 18, borderRadius: "50%",
            backgroundColor: c,
            border: "1.5px solid color-mix(in srgb, var(--foreground) 10%, transparent)",
          }} />
        ))}
      </div>

      {/* Icon + label */}
      <div style={{
        color: active ? "var(--foreground)" : "var(--muted-foreground)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
      }}>
        {THEME_ICONS[id]}
        <span style={{ fontSize: "11px", fontWeight: active ? 700 : 500 }}>
          {label}
        </span>
      </div>

      {active && (
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          backgroundColor: palette[2],
        }} />
      )}
    </button>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export function ParametresScreen() {
  const { theme, setTheme }      = useTheme();
  const { user }                 = useAuthContext();
  const navigate                 = useNavigate();

  // Notification toggles (local state only for demo)
  const [notifFiches,  setNotifFiches]  = useState(true);
  const [notifBulletin, setNotifBulletin] = useState(true);
  const [notifSystem,  setNotifSystem]  = useState(false);

  // Password change state
  const [newPw,    setNewPw]    = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirm) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPw.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwLoading(false);
    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      toast.success("Mot de passe mis à jour !");
      setNewPw(""); setConfirm("");
    }
  }

  const INPUT: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: "8px",
    border: "1.5px solid var(--border)", fontSize: "13px",
    outline: "none", backgroundColor: "var(--muted)",
    fontFamily: FF, boxSizing: "border-box",
    color: "var(--foreground)",
  };

  return (
    <div style={{ backgroundColor: "var(--background)", minHeight: "100vh", fontFamily: FF }}>

      {/* Page header */}
      <div style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)",
                    padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "10px",
            background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Settings style={{ width: 18, height: 18, color: "var(--primary-foreground)" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "16px", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>
              Paramètres
            </h1>
            <p style={{ fontSize: "11px", color: "var(--muted-foreground)", margin: 0 }}>
              Personnalisez votre expérience
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "20px 16px 40px" }}>

        {/* ── Affichage / Thèmes ── */}
        <Section title="Affichage">
          <p style={{ fontSize: "13px", color: "var(--muted-foreground)", margin: "0 0 14px",
                      lineHeight: 1.5 }}>
            Choisissez un thème de couleur. Votre préférence est sauvegardée sur tous vos appareils.
          </p>
          {/* R01/A11 fix: 2 columns on narrow screens, 4 on wider */}
          <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: "10px" }}>
            {THEMES.map(t => (
              <ThemeCard
                key={t.id}
                id={t.id}
                label={t.label}
                palette={t.palette}
                active={theme === t.id}
                onSelect={() => {
                  setTheme(t.id);
                  toast.success(`Thème "${t.label}" appliqué`);
                }}
              />
            ))}
          </div>
        </Section>

        {/* ── Notifications ── */}
        <Section title="Notifications">
          <ToggleRow
            label="Nouvelles fiches disponibles"
            hint="Alertes lors de l'ajout de contenu pédagogique"
            value={notifFiches}
            onChange={setNotifFiches}
          />
          <ToggleRow
            label="Rappels de bulletin"
            hint="Avant chaque fin de trimestre"
            value={notifBulletin}
            onChange={setNotifBulletin}
          />
          <div style={{ paddingBottom: 0, marginBottom: 0, borderBottom: "none" }}>
            <ToggleRow
              label="Notifications système"
              hint="Mises à jour et maintenance planifiée"
              value={notifSystem}
              onChange={setNotifSystem}
            />
          </div>
        </Section>

        {/* ── Données de l'école ── */}
        <Section title="Données de l'école">
          <p style={{ fontSize: "13px", color: "var(--muted-foreground)", margin: "0 0 14px" }}>
            Gérez les informations de votre établissement utilisées dans vos documents officiels.
          </p>
          <button
            onClick={() => navigate("/profil")}
            style={{
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "space-between",
              width:           "100%",
              padding:         "11px 14px",
              borderRadius:    "10px",
              backgroundColor: "var(--muted)",
              border:          "1.5px solid var(--border)",
              cursor:          "pointer",
              fontFamily:      FF,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Building2 style={{ width: 16, height: 16, color: "var(--muted-foreground)" }} />
              <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--foreground)" }}>
                Modifier les informations de l'école
              </span>
            </div>
            <ChevronRight style={{ width: 15, height: 15, color: "var(--muted-foreground)" }} />
          </button>
        </Section>

        {/* ── Sécurité ── */}
        <Section title="Sécurité du compte">
          <p style={{ fontSize: "13px", color: "var(--muted-foreground)", margin: "0 0 16px" }}>
            Email : <strong style={{ color: "var(--foreground)" }}>{user?.email ?? "—"}</strong>
          </p>
          <form onSubmit={handlePasswordChange}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--foreground)",
                        margin: "0 0 6px" }}>
              Nouveau mot de passe
            </p>
            <input
              type="password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="Minimum 6 caractères"
              style={{ ...INPUT, marginBottom: "10px" }}
              onFocus={e  => (e.target.style.borderColor = "var(--primary)")}
              onBlur={e   => (e.target.style.borderColor = "var(--border)")}
            />
            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--foreground)",
                        margin: "0 0 6px" }}>
              Confirmer le mot de passe
            </p>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Répétez le mot de passe"
              style={{
                ...INPUT, marginBottom: "14px",
                borderColor: confirm && confirm !== newPw ? "var(--destructive)" : "var(--border)",
              }}
              onFocus={e  => (e.target.style.borderColor = "var(--primary)")}
              onBlur={e   => (e.target.style.borderColor =
                confirm && confirm !== newPw ? "var(--destructive)" : "var(--border)")}
            />
            <button
              type="submit"
              disabled={pwLoading || !newPw}
              style={{
                display:         "flex",
                alignItems:      "center",
                gap:             "6px",
                padding:         "9px 18px",
                borderRadius:    "8px",
                backgroundColor: pwLoading || !newPw ? "var(--muted)" : "var(--primary)",
                color:           pwLoading || !newPw ? "var(--muted-foreground)" : "var(--primary-foreground)",
                fontSize:        "12.5px",
                fontWeight:      700,
                border:          "none",
                cursor:          pwLoading || !newPw ? "not-allowed" : "pointer",
                fontFamily:      FF,
              }}
            >
              <Shield style={{ width: 13, height: 13 }} />
              {pwLoading ? "Mise à jour…" : "Mettre à jour le mot de passe"}
            </button>
          </form>
        </Section>

      </div>
    </div>
  );
}
