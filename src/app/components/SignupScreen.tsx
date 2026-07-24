import { useState }               from "react";
import { useNavigate, Navigate, Link }  from "react-router";
import { GraduationCap, CheckCircle, Mail, MessageCircle, ShieldCheck, UserPlus } from "lucide-react";
import { GoogleIcon, FacebookIcon } from "./AuthProviderIcons";
import { supabase }               from "../../lib/supabase";
import { useAuthContext }         from "../contexts/AuthContext";
import type { UserRole }          from "../../hooks/useAuth";

function toFrench(msg: string, code?: string): string {
  if (code === "otp_disabled")
    return "L'authentification par code OTP est désactivée dans Supabase (Auth > Phone).";
  if (code === "phone_provider_disabled")
    return "Le fournisseur téléphone/WhatsApp n'est pas configuré dans Supabase (Auth > Phone > Provider).";
  if (msg.includes("User already registered") || msg.includes("already been registered"))
    return "Ce numéro est déjà utilisé. Veuillez vous connecter.";
  if (msg.includes("Invalid phone number"))
    return "Numéro WhatsApp invalide. Utilisez le format +221...";
  if (msg.includes("otp_disabled"))
    return "L'authentification par code OTP est désactivée dans Supabase (Auth > Phone).";
  if (msg.includes("phone_provider_disabled"))
    return "Le fournisseur téléphone/WhatsApp n'est pas configuré dans Supabase (Auth > Phone > Provider).";
  if (msg.includes("Unsupported channel"))
    return "Le canal WhatsApp n'est pas activé côté Supabase/Twilio.";
  if (msg.includes("Password should be at least"))
    return "Le mot de passe doit contenir au moins 6 caractères.";
  if (msg.includes("Unable to validate email"))
    return "Adresse email invalide.";
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
    solid: "#15803d",
    shadow: "0 6px 18px rgba(22,163,74,0.28)",
  },
  email: {
    border: "#bfdbfe",
    bg: "#eff6ff",
    fg: "#1e3a8a",
    solid: "#1e3a8a",
    shadow: "0 6px 18px rgba(30,58,138,0.24)",
  },
};

export function SignupScreen() {
  const navigate                       = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const [signupMethod, setSignupMethod] = useState<"whatsapp" | "email">("whatsapp");
  const [fullName,  setFullName]       = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneInput, setPhoneInput]    = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState<string | null>(null);
  const [otpCode, setOtpCode]          = useState("");
  const [role,      setRole]           = useState<UserRole>("teacher");
  const [sendingCode, setSendingCode]  = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<null | "google" | "facebook">(null);
  const [error,     setError]          = useState<string | null>(null);
  const [codeSent,  setCodeSent]       = useState(false);
  const [emailSent, setEmailSent]      = useState(false);

  if (!authLoading && user) return <Navigate to="/" replace />;

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Veuillez renseigner votre nom complet.");
      return;
    }

    const phone = normalizePhone(phoneInput);
    if (!phone) {
      setError("Entrez un numéro WhatsApp valide au format international (ex: +221771234567).");
      return;
    }

    setSendingCode(true);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: "whatsapp",
          shouldCreateUser: true,
          data: { role, full_name: fullName.trim() },
        },
      });
      if (err) throw err;

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
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: otpCode.trim(),
        type: "sms",
      });
      if (verifyErr) throw verifyErr;

      navigate("/profil", { replace: true });
    } catch (err) {
      setError(toFrenchFromError(err));
    } finally {
      setVerifyingCode(false);
    }
  }

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Veuillez renseigner votre nom complet.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setEmailLoading(true);
    try {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            role,
            full_name: fullName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpErr) throw signUpErr;
      if (data.session) {
        navigate("/profil", { replace: true });
      } else {
        setEmailSent(true);
      }
    } catch (err) {
      setError(toFrenchFromError(err));
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleOAuthSignup(provider: "google" | "facebook") {
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

  if (codeSent) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(145deg, #0d1f3c 0%, #1a365d 60%, #2d4a7a 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px", fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <div style={{
          width: "100%", maxWidth: "420px", backgroundColor: "var(--card)",
          borderRadius: "20px", padding: "40px 32px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)", textAlign: "center",
        }}>
          <CheckCircle style={{ width: 52, height: 52, color: "#10b981", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--primary)", margin: "0 0 10px" }}>
            Vérification WhatsApp
          </h2>
          <p style={{ fontSize: "14px", color: "var(--muted-foreground)", lineHeight: 1.6, marginBottom: "18px" }}>
            Un code a été envoyé sur <strong>{normalizedPhone}</strong>.
            Saisissez-le pour finaliser votre inscription.
          </p>

          <form onSubmit={handleVerifyCode} style={{ textAlign: "left" }}>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700,
                              color: "#374151", marginBottom: "6px" }}>
                Code de vérification
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                style={INPUT}
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
                width: "100%", padding: "12px 20px", borderRadius: "12px", backgroundColor: "var(--primary)",
                color: "#fff", fontWeight: 700, fontSize: "14px",
                border: "none", cursor: verifyingCode ? "not-allowed" : "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}
            >
              <ShieldCheck style={{ width: 16, height: 16 }} />
              {verifyingCode ? "Vérification…" : "Valider mon code"}
            </button>
          </form>

          <button
            onClick={() => {
              setCodeSent(false);
              setOtpCode("");
              setError(null);
            }}
            style={{
              marginTop: "10px", width: "100%", padding: "11px 16px",
              borderRadius: "10px", backgroundColor: "var(--card)", color: "#334155", fontWeight: 700,
              fontSize: "13px", border: "1px solid #b6c2d4", cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Changer de numéro
          </button>
        </div>
      </div>
    );
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
          width: "100%", maxWidth: "420px", backgroundColor: "var(--card)",
          borderRadius: "20px", padding: "40px 32px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)", textAlign: "center",
        }}>
          <CheckCircle style={{ width: 52, height: 52, color: "#10b981", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--primary)", margin: "0 0 10px" }}>
            Vérifiez votre email
          </h2>
          <p style={{ fontSize: "14px", color: "var(--muted-foreground)", lineHeight: 1.6, marginBottom: "24px" }}>
            Un lien de confirmation a été envoyé à <strong>{email}</strong>.
            Ouvrez ce lien pour finaliser votre inscription.
          </p>
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "12px 28px", borderRadius: "12px", backgroundColor: "var(--primary)",
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
        width: "100%", maxWidth: "440px", backgroundColor: "var(--card)",
        borderRadius: "20px", padding: "40px 32px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
      }}>

        {/* Branding */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
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
            Créez votre espace enseignant gratuitement
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "18px" }}>
          <button
            type="button"
            onClick={() => {
              setSignupMethod("whatsapp");
              setError(null);
            }}
            style={{
              padding: "10px", borderRadius: "10px",
              border: signupMethod === "whatsapp" ? `2px solid ${AUTH_THEME.whatsapp.border}` : "1px solid #b6c2d4",
              backgroundColor: signupMethod === "whatsapp" ? AUTH_THEME.whatsapp.bg : "#fff",
              color: signupMethod === "whatsapp" ? AUTH_THEME.whatsapp.fg : "#1e293b", fontWeight: 700,
              cursor: "pointer", fontSize: "13px", fontFamily: "'Plus Jakarta Sans', sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            }}
          >
            <MessageCircle style={{ width: 14, height: 14 }} />
            Code WhatsApp
          </button>
          <button
            type="button"
            onClick={() => {
              setSignupMethod("email");
              setError(null);
            }}
            style={{
              padding: "10px", borderRadius: "10px",
              border: signupMethod === "email" ? `2px solid ${AUTH_THEME.email.border}` : "1px solid #b6c2d4",
              backgroundColor: signupMethod === "email" ? AUTH_THEME.email.bg : "#fff",
              color: signupMethod === "email" ? AUTH_THEME.email.fg : "#1e293b", fontWeight: 700,
              cursor: "pointer", fontSize: "13px", fontFamily: "'Plus Jakarta Sans', sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            }}
          >
            <Mail style={{ width: 14, height: 14 }} />
            Email + mot de passe
          </button>
        </div>

        <form onSubmit={signupMethod === "whatsapp" ? handleSendCode : handleEmailSignup}>
          {/* Full name */}
          <div style={{ marginBottom: "14px" }}>
            <label htmlFor="signup_fullname" style={{ display: "block", fontSize: "12px", fontWeight: 700,
                            color: "#374151", marginBottom: "6px" }}>
              Nom complet
            </label>
            <input
              id="signup_fullname"
              name="fullname"
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
                      color: active ? "#fff" : "#475569",
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

          {signupMethod === "whatsapp" ? (
            <div style={{ marginBottom: "14px" }}>
              <label htmlFor="signup_phone" style={{ display: "block", fontSize: "12px", fontWeight: 700,
                              color: "#374151", marginBottom: "6px" }}>
                Numéro WhatsApp
              </label>
              <input
                id="signup_phone"
                name="phone"
                type="tel" required autoComplete="tel"
                value={phoneInput} onChange={e => setPhoneInput(e.target.value)}
                placeholder="+221771234567"
                style={INPUT}
                onFocus={e => (e.target.style.borderColor = "#3182ce")}
                onBlur={e  => (e.target.style.borderColor = "#e2e8f0")}
              />
              <p style={{ fontSize: "12px", color: "var(--muted-foreground)", margin: "8px 0 0" }}>
                Nous enverrons le code d'inscription sur WhatsApp Business.
              </p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "14px" }}>
                <label htmlFor="signup_email" style={{ display: "block", fontSize: "12px", fontWeight: 700,
                                color: "#374151", marginBottom: "6px" }}>
                  Adresse email
                </label>
                <input
                  id="signup_email"
                  name="email"
                  type="email" required autoComplete="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  style={INPUT}
                  onFocus={e => (e.target.style.borderColor = "#3182ce")}
                  onBlur={e  => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label htmlFor="signup_password" style={{ display: "block", fontSize: "12px", fontWeight: 700,
                                color: "#374151", marginBottom: "6px" }}>
                  Mot de passe
                </label>
                <input
                  id="signup_password"
                  name="password"
                  type="password" required autoComplete="new-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  style={INPUT}
                  onFocus={e => (e.target.style.borderColor = "#3182ce")}
                  onBlur={e  => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label htmlFor="signup_confirm_password" style={{ display: "block", fontSize: "12px", fontWeight: 700,
                                color: "#374151", marginBottom: "6px" }}>
                  Confirmer le mot de passe
                </label>
                <input
                  id="signup_confirm_password"
                  name="confirm_password"
                  type="password" required autoComplete="new-password"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  style={{
                    ...INPUT,
                    borderColor: confirmPassword && confirmPassword !== password ? "#fca5a5" : "#e2e8f0",
                  }}
                  onFocus={e => (e.target.style.borderColor = "#3182ce")}
                  onBlur={e  => (e.target.style.borderColor =
                    confirmPassword && confirmPassword !== password ? "#fca5a5" : "#e2e8f0")}
                />
              </div>
            </>
          )}

          {/* Error banner */}
          {error && (
            <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca",
                          borderRadius: "8px", padding: "10px 14px", marginBottom: "16px" }}>
              <p style={{ fontSize: "13px", color: "#dc2626", margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit" disabled={signupMethod === "whatsapp" ? sendingCode : emailLoading}
            style={{
              width: "100%", padding: "13px", borderRadius: "12px",
              backgroundColor: (signupMethod === "whatsapp" ? sendingCode : emailLoading)
                ? "#7186a0"
                : (signupMethod === "whatsapp" ? AUTH_THEME.whatsapp.solid : AUTH_THEME.email.solid),
              color: "#fff", fontWeight: 700, fontSize: "14px",
              border: "none", cursor: (signupMethod === "whatsapp" ? sendingCode : emailLoading) ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              boxShadow: signupMethod === "whatsapp" ? AUTH_THEME.whatsapp.shadow : AUTH_THEME.email.shadow,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {signupMethod === "whatsapp" ? (
              <>
                <MessageCircle style={{ width: 16, height: 16 }} />
                {sendingCode ? "Envoi du code…" : "Recevoir le code WhatsApp"}
              </>
            ) : (
              <>
                <UserPlus style={{ width: 16, height: 16 }} />
                {emailLoading ? "Création du compte…" : "Créer mon compte"}
              </>
            )}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "18px 0" }}>
          <div style={{ height: "1px", flex: 1, backgroundColor: "#e2e8f0" }} />
          <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>ou</span>
          <div style={{ height: "1px", flex: 1, backgroundColor: "#e2e8f0" }} />
        </div>

        <div style={{ display: "grid", gap: "10px" }}>
          <button
            type="button"
            disabled={oauthLoading !== null}
            onClick={() => handleOAuthSignup("google")}
            style={{
              width: "100%", padding: "11px", borderRadius: "10px", border: "1px solid #b6c2d4",
              backgroundColor: "var(--card)", color: "var(--foreground)", fontWeight: 700, fontSize: "13px",
              cursor: oauthLoading !== null ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}
          >
            <GoogleIcon style={{ width: 18, height: 18 }} />
            {oauthLoading === "google" ? "Redirection…" : "S'inscrire avec Google"}
          </button>
          <button
            type="button"
            disabled={oauthLoading !== null}
            onClick={() => handleOAuthSignup("facebook")}
            style={{
              width: "100%", padding: "11px", borderRadius: "10px", border: "1px solid #1458be",
              backgroundColor: "#1664d9", color: "#fff", fontWeight: 700, fontSize: "13px",
              cursor: oauthLoading !== null ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}
          >
            <FacebookIcon style={{ width: 18, height: 18, color: "#fff" }} />
            {oauthLoading === "facebook" ? "Redirection…" : "S'inscrire avec Facebook"}
          </button>
        </div>

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
            Politique de confidentialité
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
            Suppression des données
          </Link>
        </div>

        <p style={{ textAlign: "center", fontSize: "13px", color: "var(--muted-foreground)",
                    marginTop: "24px", marginBottom: 0 }}>
          Déjà un compte ?{" "}
          <button
            onClick={() => navigate("/login")}
            style={{ color: "var(--secondary)", fontWeight: 700, background: "none",
                     border: "none", cursor: "pointer", fontSize: "13px", padding: 0 }}
          >
            Se connecter
          </button>
        </p>
      </div>
    </div>
  );
}
