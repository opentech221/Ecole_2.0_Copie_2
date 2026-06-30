import { useState }               from "react";
import { useNavigate, Navigate }  from "react-router";
import { GraduationCap, Eye, EyeOff, UserPlus, CheckCircle } from "lucide-react";
import { supabase }               from "../../lib/supabase";
import { useAuthContext }         from "../contexts/AuthContext";
import type { UserRole }          from "../../hooks/useAuth";

function toFrench(msg: string): string {
  if (msg.includes("User already registered") || msg.includes("already been registered"))
    return "Cet email est déjà utilisé. Veuillez vous connecter.";
  if (msg.includes("Password should be at least"))
    return "Le mot de passe doit contenir au moins 6 caractères.";
  if (msg.includes("Unable to validate email"))
    return "Adresse email invalide.";
  return "Une erreur est survenue. Veuillez réessayer.";
}

const INPUT: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: "10px",
  border: "1.5px solid #e2e8f0", fontSize: "14px", outline: "none",
  backgroundColor: "#f8fafc", boxSizing: "border-box",
};

export function SignupScreen() {
  const navigate                       = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const [fullName,  setFullName]       = useState("");
  const [email,     setEmail]          = useState("");
  const [password,  setPassword]       = useState("");
  const [confirm,   setConfirm]        = useState("");
  const [role,      setRole]           = useState<UserRole>("teacher");
  const [showPw,    setShowPw]         = useState(false);
  const [loading,   setLoading]        = useState(false);
  const [error,     setError]          = useState<string | null>(null);
  const [emailSent, setEmailSent]      = useState(false);

  if (!authLoading && user) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role, full_name: fullName } },
      });
      if (err) throw err;

      if (data.session) {
        navigate("/profil", { replace: true });
      } else {
        setEmailSent(true);
      }
    } catch (err) {
      setError(toFrench(err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  }

  if (emailSent) {
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
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)", textAlign: "center",
        }}>
          <CheckCircle style={{ width: 52, height: 52, color: "#10b981", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#1a365d", margin: "0 0 10px" }}>
            Vérifiez votre email
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6, marginBottom: "24px" }}>
            Un lien de confirmation a été envoyé à <strong>{email}</strong>.
            Cliquez sur le lien pour activer votre compte.
          </p>
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "12px 28px", borderRadius: "12px", backgroundColor: "#1a365d",
              color: "#fff", fontWeight: 700, fontSize: "14px",
              border: "none", cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #0d1f3c 0%, #1a365d 60%, #2d4a7a 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: "440px", backgroundColor: "#fff",
        borderRadius: "20px", padding: "40px 32px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
      }}>

        {/* Branding */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
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
            Créez votre espace enseignant gratuitement
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Full name */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700,
                            color: "#374151", marginBottom: "6px" }}>
              Nom complet
            </label>
            <input
              type="text" required
              value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="M. Abdou DIALLO"
              style={INPUT}
              onFocus={e => (e.target.style.borderColor = "#3182ce")}
              onBlur={e  => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>

          {/* Role selector */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700,
                            color: "#374151", marginBottom: "8px" }}>
              Mon rôle
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["teacher", "director"] as UserRole[]).map(r => {
                const active = role === r;
                return (
                  <button
                    key={r} type="button" onClick={() => setRole(r)}
                    style={{
                      flex: 1, padding: "10px 8px", borderRadius: "10px",
                      backgroundColor: active ? "#1a365d" : "#f8fafc",
                      border: `2px solid ${active ? "#1a365d" : "#e2e8f0"}`,
                      color: active ? "#fff" : "#64748b",
                      fontWeight: 700, fontSize: "13px", cursor: "pointer",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {r === "teacher" ? "Enseignant" : "Directeur"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700,
                            color: "#374151", marginBottom: "6px" }}>
              Adresse email
            </label>
            <input
              type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              style={INPUT}
              onFocus={e => (e.target.style.borderColor = "#3182ce")}
              onBlur={e  => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700,
                            color: "#374151", marginBottom: "6px" }}>
              Mot de passe
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"} required autoComplete="new-password"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                style={{ ...INPUT, paddingRight: "44px" }}
                onFocus={e => (e.target.style.borderColor = "#3182ce")}
                onBlur={e  => (e.target.style.borderColor = "#e2e8f0")}
              />
              <button
                type="button" onClick={() => setShowPw(p => !p)}
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

          {/* Confirm password */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700,
                            color: "#374151", marginBottom: "6px" }}>
              Confirmer le mot de passe
            </label>
            <input
              type={showPw ? "text" : "password"} required autoComplete="new-password"
              value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Répétez le mot de passe"
              style={{
                ...INPUT,
                borderColor: confirm && confirm !== password ? "#fca5a5" : "#e2e8f0",
              }}
              onFocus={e => (e.target.style.borderColor = "#3182ce")}
              onBlur={e  => (e.target.style.borderColor =
                confirm && confirm !== password ? "#fca5a5" : "#e2e8f0")}
            />
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
            <UserPlus style={{ width: 16, height: 16 }} />
            {loading ? "Création du compte…" : "Créer mon compte"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "13px", color: "#64748b",
                    marginTop: "24px", marginBottom: 0 }}>
          Déjà un compte ?{" "}
          <button
            onClick={() => navigate("/login")}
            style={{ color: "#3182ce", fontWeight: 700, background: "none",
                     border: "none", cursor: "pointer", fontSize: "13px", padding: 0 }}
          >
            Se connecter
          </button>
        </p>
      </div>
    </div>
  );
}
