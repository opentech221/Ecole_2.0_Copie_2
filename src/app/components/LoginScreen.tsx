import { useState }               from "react";
import { useNavigate, Navigate, Link }  from "react-router";
import { GraduationCap, LogIn, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import GoogleIcon from "@mui/icons-material/Google";
import FacebookIcon from "@mui/icons-material/Facebook";
import { supabase }               from "../../lib/supabase";
import { useAuthContext }         from "../contexts/AuthContext";

function toFrench(msg: string, code?: string): string {
  if (code === "otp_disabled")
    return "L'authentification par code OTP est désactivée dans Supabase (Auth > Phone).";
  if (code === "phone_provider_disabled")
    return "Le fournisseur téléphone/WhatsApp n'est pas configuré dans Supabase (Auth > Phone > Provider).";
  if (msg.includes("Invalid phone number"))
    return "Le numéro WhatsApp est invalide. Utilisez le format international (ex: +221...).";
  if (msg.includes("otp_disabled"))
    return "L'authentification par code OTP est désactivée dans Supabase (Auth > Phone).";
  if (msg.includes("phone_provider_disabled"))
    return "Le fournisseur téléphone/WhatsApp n'est pas configuré dans Supabase (Auth > Phone > Provider).";
  if (msg.includes("Unsupported channel"))
    return "Le canal WhatsApp n'est pas activé côté Supabase/Twilio.";
  if (msg.includes("User not found"))
    return "Aucun compte trouvé avec ce numéro. Créez un compte d'abord.";
  if (msg.includes("Invalid login credentials"))
    return "Email ou mot de passe incorrect.";
  if (msg.includes("Email not confirmed"))
    return "Veuillez confirmer votre email avant de vous connecter.";
  if (msg.includes("Token has expired") || msg.includes("expired"))
    return "Le code a expiré. Demandez un nouveau code.";
  if (msg.includes("Invalid token") || msg.includes("invalid"))
    return "Code invalide. Vérifiez le code reçu sur WhatsApp.";
  if (msg.includes("Too many requests"))
    return "Trop de tentatives. Réessayez dans quelques minutes.";
  return "Une erreur est survenue. Veuillez réessayer.";
}

function toFrenchFromError(err: unknown): string {
  if (typeof err !== "object" || err === null) {
    return toFrench("");
  }

  const maybeError = err as { message?: string; code?: string };
  const message = maybeError.message ?? "";
  const code = maybeError.code;
  return toFrench(message, code);
}

function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const startsWithPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/\D/g, "");

  let candidate = startsWithPlus ? `+${digitsOnly}` : digitsOnly;
  if (candidate.startsWith("00")) {
    candidate = `+${candidate.slice(2)}`;
  } else if (!candidate.startsWith("+")) {
    candidate = `+${candidate}`;
  }

  if (!/^\+[1-9]\d{7,14}$/.test(candidate)) return null;
  return candidate;
}

const INPUT: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: "10px",
  border: "1.5px solid var(--border)", fontSize: "14px", outline: "none",
  backgroundColor: "var(--muted)", boxSizing: "border-box",
};

const AUTH_THEME = {
  whatsapp: {
    border: "#86efac",
    bg: "#f0fdf4",
    fg: "#166534",
    solid: "#16a34a",
    solidHover: "#15803d",
    shadow: "0 6px 18px rgba(22,163,74,0.28)",
  },
  email: {
    border: "#bfdbfe",
    bg: "#eff6ff",
    fg: "#1e3a8a",
    solid: "#1e3a8a",
    solidHover: "#1e40af",
    shadow: "0 6px 18px rgba(30,58,138,0.24)",
  },
};

export function LoginScreen() {
  const navigate                  = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const [authMethod, setAuthMethod] = useState<"whatsapp" | "email">("whatsapp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<null | "google" | "facebook">(null);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && user) return <Navigate to="/" replace />;

  async function routeAfterAuth(userId: string) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("ecole_nom")
      .eq("id", userId)
      .single();

    const hasSchool = !!profile?.ecole_nom?.trim();
    navigate(hasSchool ? "/" : "/profil", { replace: true });
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPasswordLoading(true);

    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInErr) throw signInErr;
      if (data.user) await routeAfterAuth(data.user.id);
    } catch (err) {
      setError(toFrenchFromError(err));
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleOAuthLogin(provider: "google" | "facebook") {
    setError(null);
    setOauthLoading(provider);
    try {
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (oauthErr) throw oauthErr;
    } catch (err) {
      setError(toFrenchFromError(err));
      setOauthLoading(null);
    }
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const phone = normalizePhone(phoneInput);
    if (!phone) {
      setError("Entrez un numéro WhatsApp valide au format international (ex: +221771234567).");
      return;
    }

    setSendingCode(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: "whatsapp",
          shouldCreateUser: false,
        },
      });
      if (signInErr) throw signInErr;

      setNormalizedPhone(phone);
      setCodeSent(true);
    } catch (err) {
      setError(toFrenchFromError(err));
    } finally {
      setSendingCode(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!normalizedPhone) {
      setError("Numéro WhatsApp introuvable. Redemandez un code.");
      return;
    }
    if (!/^\d{6}$/.test(otpCode.trim())) {
      setError("Le code doit contenir 6 chiffres.");
      return;
    }

    setVerifyingCode(true);
    try {
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: otpCode.trim(),
        type: "sms",
      });
      if (verifyErr) throw verifyErr;
      if (data.user) await routeAfterAuth(data.user.id);
    } catch (err) {
      setError(toFrenchFromError(err));
    } finally {
      setVerifyingCode(false);
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #0d1f3c 0%, #1a365d 60%, #2d4a7a 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: "420px", backgroundColor: "var(--card)",
        borderRadius: "20px", padding: "40px 32px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
      }}>

        {/* Branding */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px",
                        marginBottom: "10px", padding: "10px 20px", borderRadius: "14px",
                        backgroundColor: "var(--muted)", border: "1px solid var(--border)" }}>
            <GraduationCap style={{ width: 24, height: 24, color: "var(--secondary)" }} />
            <span style={{ fontSize: "18px", fontWeight: 900, color: "var(--foreground)",
                           letterSpacing: "0.1em", textTransform: "uppercase" }}>
              École 2.0
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--muted-foreground)", margin: 0 }}>
            Connectez-vous à votre espace enseignant
          </p>
        </div>

        {!codeSent && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "18px" }}>
            <button
              type="button"
              onClick={() => {
                setAuthMethod("whatsapp");
                setError(null);
              }}
              style={{
                padding: "10px", borderRadius: "10px",
                border: authMethod === "whatsapp" ? `2px solid ${AUTH_THEME.whatsapp.border}` : "1px solid #cbd5e1",
                backgroundColor: authMethod === "whatsapp" ? AUTH_THEME.whatsapp.bg : "#fff",
                color: authMethod === "whatsapp" ? AUTH_THEME.whatsapp.fg : "#1e293b", fontWeight: 700,
                cursor: "pointer", fontSize: "13px", fontFamily: "'Plus Jakarta Sans', sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              }}
            >
              <MessageCircle style={{ width: 14, height: 14 }} />
              WhatsApp OTP
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod("email");
                setError(null);
              }}
              style={{
                padding: "10px", borderRadius: "10px",
                border: authMethod === "email" ? `2px solid ${AUTH_THEME.email.border}` : "1px solid #cbd5e1",
                backgroundColor: authMethod === "email" ? AUTH_THEME.email.bg : "#fff",
                color: authMethod === "email" ? AUTH_THEME.email.fg : "#1e293b", fontWeight: 700,
                cursor: "pointer", fontSize: "13px", fontFamily: "'Plus Jakarta Sans', sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              }}
            >
              <Mail style={{ width: 14, height: 14 }} />
              Email + mot de passe
            </button>
          </div>
        )}

        {!codeSent && authMethod === "whatsapp" ? (
        <form onSubmit={handleSendCode}>
          {/* WhatsApp phone */}
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="login_phone" style={{ display: "block", fontSize: "12px", fontWeight: 700,
                            color: "#374151", marginBottom: "6px" }}>
              Numéro WhatsApp
            </label>
            <input
              id="login_phone"
              name="phone"
              type="tel" required autoComplete="tel"
              value={phoneInput} onChange={e => setPhoneInput(e.target.value)}
              placeholder="+221771234567"
              style={INPUT}
              onFocus={e  => (e.target.style.borderColor = "#3182ce")}
              onBlur={e   => (e.target.style.borderColor = "#e2e8f0")}
            />
            <p style={{ fontSize: "12px", color: "var(--muted-foreground)", margin: "8px 0 0" }}>
              Un code de connexion sera envoyé sur WhatsApp Business.
            </p>
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
            type="submit" disabled={sendingCode}
            style={{
              width: "100%", padding: "13px", borderRadius: "12px",
              backgroundColor: sendingCode ? "#94a3b8" : AUTH_THEME.whatsapp.solid,
              color: "#fff", fontWeight: 700, fontSize: "14px",
              border: "none", cursor: sendingCode ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              boxShadow: AUTH_THEME.whatsapp.shadow,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <MessageCircle style={{ width: 16, height: 16 }} />
            {sendingCode ? "Envoi du code…" : "Recevoir le code WhatsApp"}
          </button>
        </form>
        ) : !codeSent && authMethod === "email" ? (
        <form onSubmit={handleEmailLogin}>
          <div style={{ marginBottom: "14px" }}>
            <label htmlFor="login_email" style={{ display: "block", fontSize: "12px", fontWeight: 700,
                            color: "#374151", marginBottom: "6px" }}>
              Adresse email
            </label>
            <input
              id="login_email"
              name="email"
              type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              style={INPUT}
              onFocus={e  => (e.target.style.borderColor = "#3182ce")}
              onBlur={e   => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="login_password" style={{ display: "block", fontSize: "12px", fontWeight: 700,
                            color: "#374151", marginBottom: "6px" }}>
              Mot de passe
            </label>
            <input
              id="login_password"
              name="password"
              type="password" required autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={INPUT}
              onFocus={e  => (e.target.style.borderColor = "#3182ce")}
              onBlur={e   => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>

          {error && (
            <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca",
                          borderRadius: "8px", padding: "10px 14px", marginBottom: "16px" }}>
              <p style={{ fontSize: "13px", color: "#dc2626", margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={passwordLoading}
            style={{
              width: "100%", padding: "13px", borderRadius: "12px",
              backgroundColor: passwordLoading ? "#94a3b8" : AUTH_THEME.email.solid,
              color: "#fff", fontWeight: 700, fontSize: "14px",
              border: "none", cursor: passwordLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              boxShadow: AUTH_THEME.email.shadow,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <LogIn style={{ width: 16, height: 16 }} />
            {passwordLoading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
        ) : (
        <form onSubmit={handleVerifyCode}>
          <div style={{ marginBottom: "14px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "10px 12px" }}>
            <p style={{ fontSize: "12px", color: "#166534", margin: 0 }}>
              Code envoyé au {normalizedPhone}. Entrez les 6 chiffres reçus sur WhatsApp.
            </p>
          </div>

          <div style={{ marginBottom: "22px" }}>
            <label htmlFor="login_otp" style={{ display: "block", fontSize: "12px", fontWeight: 700,
                            color: "#374151", marginBottom: "6px" }}>
              Code de vérification
            </label>
            <input
              id="login_otp"
              name="otp_code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              style={INPUT}
              onFocus={e  => (e.target.style.borderColor = "#3182ce")}
              onBlur={e   => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>

          {error && (
            <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca",
                          borderRadius: "8px", padding: "10px 14px", marginBottom: "16px" }}>
              <p style={{ fontSize: "13px", color: "#dc2626", margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={verifyingCode}
            style={{
              width: "100%", padding: "13px", borderRadius: "12px",
              backgroundColor: verifyingCode ? "#94a3b8" : "#1a365d",
              color: "#fff", fontWeight: 700, fontSize: "14px",
              border: "none", cursor: verifyingCode ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              boxShadow: "0 4px 16px rgba(26,54,93,0.28)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <ShieldCheck style={{ width: 16, height: 16 }} />
            {verifyingCode ? "Vérification…" : "Valider le code"}
          </button>

          <button
            type="button"
            onClick={() => {
              setCodeSent(false);
              setOtpCode("");
              setError(null);
            }}
            style={{
              width: "100%", marginTop: "10px", padding: "10px",
              borderRadius: "10px", border: "1px solid #cbd5e1", backgroundColor: "var(--card)",
              color: "#334155", fontWeight: 600, fontSize: "13px", cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Changer de numéro
          </button>
        </form>
        )}

        {!codeSent && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "18px 0" }}>
              <div style={{ height: "1px", flex: 1, backgroundColor: "#e2e8f0" }} />
              <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>ou</span>
              <div style={{ height: "1px", flex: 1, backgroundColor: "#e2e8f0" }} />
            </div>

            <div style={{ display: "grid", gap: "10px" }}>
              <button
                type="button"
                disabled={oauthLoading !== null}
                onClick={() => handleOAuthLogin("google")}
                style={{
                  width: "100%", padding: "11px", borderRadius: "10px", border: "1px solid #d1d5db",
                  backgroundColor: "var(--card)", color: "#111827", fontWeight: 700, fontSize: "13px",
                  cursor: oauthLoading !== null ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}
              >
                <GoogleIcon sx={{ fontSize: 18 }} />
                {oauthLoading === "google" ? "Redirection…" : "Continuer avec Google"}
              </button>
              <button
                type="button"
                disabled={oauthLoading !== null}
                onClick={() => handleOAuthLogin("facebook")}
                style={{
                  width: "100%", padding: "11px", borderRadius: "10px", border: "1px solid #1d4ed8",
                  backgroundColor: "#1877F2", color: "#fff", fontWeight: 700, fontSize: "13px",
                  cursor: oauthLoading !== null ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}
              >
                <FacebookIcon sx={{ fontSize: 18, color: "#fff" }} />
                {oauthLoading === "facebook" ? "Redirection…" : "Continuer avec Facebook"}
              </button>
            </div>
          </>
        )}

        <div style={{ marginTop: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          <Link
            to="/privacy-policy"
            style={{
              padding: "6px 8px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--muted)",
              color: "var(--secondary)",
              textDecoration: "none",
              fontSize: "10.5px",
              fontWeight: 700,
              lineHeight: 1.1,
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            Politique de confidentialite
          </Link>
          <Link
            to="/data-deletion"
            style={{
              padding: "6px 8px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--muted)",
              color: "var(--foreground)",
              textDecoration: "none",
              fontSize: "10.5px",
              fontWeight: 700,
              lineHeight: 1.1,
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            Suppression des donnees
          </Link>
        </div>

        <p style={{ textAlign: "center", fontSize: "13px", color: "var(--muted-foreground)",
                    marginTop: "24px", marginBottom: 0 }}>
          Pas encore de compte ?{" "}
          <button
            onClick={() => navigate("/signup")}
            style={{ color: "var(--secondary)", fontWeight: 700, background: "none",
                     border: "none", cursor: "pointer", fontSize: "13px", padding: 0 }}
          >
            Créer un compte
          </button>
        </p>
      </div>
    </main>
  );
}
