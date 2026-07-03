import { useState }               from "react";
import { useNavigate, Navigate }  from "react-router";
import { GraduationCap, CheckCircle, MessageCircle, ShieldCheck } from "lucide-react";
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
  border: "1.5px solid #e2e8f0", fontSize: "14px", outline: "none",
  backgroundColor: "#f8fafc", boxSizing: "border-box",
};

export function SignupScreen() {
  const navigate                       = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const [fullName,  setFullName]       = useState("");
  const [phoneInput, setPhoneInput]    = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState<string | null>(null);
  const [otpCode, setOtpCode]          = useState("");
  const [role,      setRole]           = useState<UserRole>("teacher");
  const [sendingCode, setSendingCode]  = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [error,     setError]          = useState<string | null>(null);
  const [codeSent,  setCodeSent]       = useState(false);

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

  if (codeSent) {
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
            Vérification WhatsApp
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6, marginBottom: "18px" }}>
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
                width: "100%", padding: "12px 20px", borderRadius: "12px", backgroundColor: "#1a365d",
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
              borderRadius: "10px", backgroundColor: "#fff", color: "#334155", fontWeight: 700,
              fontSize: "13px", border: "1px solid #cbd5e1", cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Changer de numéro
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

        <form onSubmit={handleSendCode}>
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

          {/* WhatsApp phone */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700,
                            color: "#374151", marginBottom: "6px" }}>
              Numéro WhatsApp
            </label>
            <input
              type="tel" required autoComplete="tel"
              value={phoneInput} onChange={e => setPhoneInput(e.target.value)}
              placeholder="+221771234567"
              style={INPUT}
              onFocus={e => (e.target.style.borderColor = "#3182ce")}
              onBlur={e  => (e.target.style.borderColor = "#e2e8f0")}
            />
            <p style={{ fontSize: "12px", color: "#64748b", margin: "8px 0 0" }}>
              Nous enverrons le code d'inscription sur WhatsApp Business.
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
              backgroundColor: sendingCode ? "#94a3b8" : "#1a365d",
              color: "#fff", fontWeight: 700, fontSize: "14px",
              border: "none", cursor: sendingCode ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              boxShadow: "0 4px 16px rgba(26,54,93,0.28)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <MessageCircle style={{ width: 16, height: 16 }} />
            {sendingCode ? "Envoi du code…" : "Recevoir le code WhatsApp"}
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
