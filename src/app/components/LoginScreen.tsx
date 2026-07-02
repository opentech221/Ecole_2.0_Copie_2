import { useState }               from "react";
import { useNavigate, Navigate }  from "react-router";
import { GraduationCap, Eye, EyeOff, LogIn } from "lucide-react";
import { supabase }               from "../../lib/supabase";
import { useAuthContext }         from "../contexts/AuthContext";

function toFrench(msg: string): string {
  if (msg.includes("Invalid login credentials"))
    return "Email ou mot de passe incorrect.";
  if (msg.includes("Email not confirmed"))
    return "Veuillez confirmer votre email avant de vous connecter.";
  if (msg.includes("Too many requests"))
    return "Trop de tentatives. Réessayez dans quelques minutes.";
  return "Une erreur est survenue. Veuillez réessayer.";
}

const INPUT: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: "10px",
  border: "1.5px solid #e2e8f0", fontSize: "14px", outline: "none",
  backgroundColor: "#f8fafc", boxSizing: "border-box",
};

export function LoginScreen() {
  const navigate                  = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const [email,    setEmail]      = useState("");
  const [password, setPassword]   = useState("");
  const [showPw,   setShowPw]     = useState(false);
  const [loading,  setLoading]    = useState(false);
  const [error,    setError]      = useState<string | null>(null);

  if (!authLoading && user) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) throw signInErr;

      // Immediately check ecole_nom to decide where to land.
      // Reading directly from Supabase avoids waiting for the context to re-render.
      let hasSchool = false;
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("ecole_nom")
          .eq("id", data.user.id)
          .single();
        hasSchool = !!profile?.ecole_nom?.trim();
      }

      navigate(hasSchool ? "/" : "/profil", { replace: true });
    } catch (err) {
      setError(toFrench(err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #0d1f3c 0%, #1a365d 60%, #2d4a7a 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: "420px", backgroundColor: "#fff",
        borderRadius: "20px", padding: "40px 32px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
      }}>

        {/* Branding */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px",
                        marginBottom: "10px", padding: "10px 20px", borderRadius: "14px",
                        backgroundColor: "#f0f7ff", border: "1px solid #bfdbfe" }}>
            <GraduationCap style={{ width: 24, height: 24, color: "#3182ce" }} />
            <span style={{ fontSize: "18px", fontWeight: 900, color: "#1a365d",
                           letterSpacing: "0.1em", textTransform: "uppercase" }}>
              École 2.0
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Connectez-vous à votre espace enseignant
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700,
                            color: "#374151", marginBottom: "6px" }}>
              Adresse email
            </label>
            <input
              type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              style={INPUT}
              onFocus={e  => (e.target.style.borderColor = "#3182ce")}
              onBlur={e   => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700,
                            color: "#374151", marginBottom: "6px" }}>
              Mot de passe
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"} required autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ ...INPUT, paddingRight: "44px" }}
                onFocus={e  => (e.target.style.borderColor = "#3182ce")}
                onBlur={e   => (e.target.style.borderColor = "#e2e8f0")}
              />
              <button
                type="button"
                aria-label={showPw ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                onClick={() => setShowPw(p => !p)}
                style={{ position: "absolute", right: "12px", top: "50%",
                         transform: "translateY(-50%)", background: "none",
                         border: "none", cursor: "pointer", color: "#94a3b8",
                         display: "flex", alignItems: "center", padding: 0 }}
              >
                {showPw
                  ? <EyeOff style={{ width: 16, height: 16 }} />
                  : <Eye    style={{ width: 16, height: 16 }} />}
              </button>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca",
                          borderRadius: "8px", padding: "10px 14px", marginBottom: "16px" }}>
              <p style={{ fontSize: "13px", color: "#dc2626", margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit" disabled={loading}
            style={{
              width: "100%", padding: "13px", borderRadius: "12px",
              backgroundColor: loading ? "#94a3b8" : "#1a365d",
              color: "#fff", fontWeight: 700, fontSize: "14px",
              border: "none", cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              boxShadow: "0 4px 16px rgba(26,54,93,0.28)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <LogIn style={{ width: 16, height: 16 }} />
            {loading ? "Connexion en cours…" : "Se connecter"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "13px", color: "#64748b",
                    marginTop: "24px", marginBottom: 0 }}>
          Pas encore de compte ?{" "}
          <button
            onClick={() => navigate("/signup")}
            style={{ color: "#3182ce", fontWeight: 700, background: "none",
                     border: "none", cursor: "pointer", fontSize: "13px", padding: 0 }}
          >
            Créer un compte
          </button>
        </p>
      </div>
    </div>
  );
}
