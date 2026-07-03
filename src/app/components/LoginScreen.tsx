import { useState }               from "react";
import { useNavigate, Navigate }  from "react-router";
import { GraduationCap, MessageCircle, ShieldCheck } from "lucide-react";
import { supabase }               from "../../lib/supabase";
import { useAuthContext }         from "../contexts/AuthContext";

function toFrench(msg: string): string {
  if (msg.includes("Invalid phone number"))
    return "Le numéro WhatsApp est invalide. Utilisez le format international (ex: +221...).";
  if (msg.includes("Unsupported channel"))
    return "Le canal WhatsApp n'est pas activé côté Supabase/Twilio.";
  if (msg.includes("User not found"))
    return "Aucun compte trouvé avec ce numéro. Créez un compte d'abord.";
  if (msg.includes("Token has expired") || msg.includes("expired"))
    return "Le code a expiré. Demandez un nouveau code.";
  if (msg.includes("Invalid token") || msg.includes("invalid"))
    return "Code invalide. Vérifiez le code reçu sur WhatsApp.";
  if (msg.includes("Too many requests"))
    return "Trop de tentatives. Réessayez dans quelques minutes.";
  return "Une erreur est survenue. Veuillez réessayer.";
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

export function LoginScreen() {
  const navigate                  = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const [phoneInput, setPhoneInput] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && user) return <Navigate to="/" replace />;

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
      setError(toFrench(err instanceof Error ? err.message : ""));
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
      setVerifyingCode(false);
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

        {!codeSent ? (
        <form onSubmit={handleSendCode}>
          {/* WhatsApp phone */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700,
                            color: "#374151", marginBottom: "6px" }}>
              Numéro WhatsApp
            </label>
            <input
              type="tel" required autoComplete="tel"
              value={phoneInput} onChange={e => setPhoneInput(e.target.value)}
              placeholder="+221771234567"
              style={INPUT}
              onFocus={e  => (e.target.style.borderColor = "#3182ce")}
              onBlur={e   => (e.target.style.borderColor = "#e2e8f0")}
            />
            <p style={{ fontSize: "12px", color: "#64748b", margin: "8px 0 0" }}>
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
        ) : (
        <form onSubmit={handleVerifyCode}>
          <div style={{ marginBottom: "14px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "10px 12px" }}>
            <p style={{ fontSize: "12px", color: "#166534", margin: 0 }}>
              Code envoyé au {normalizedPhone}. Entrez les 6 chiffres reçus sur WhatsApp.
            </p>
          </div>

          <div style={{ marginBottom: "22px" }}>
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
              borderRadius: "10px", border: "1px solid #cbd5e1", backgroundColor: "#fff",
              color: "#334155", fontWeight: 600, fontSize: "13px", cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Changer de numéro
          </button>
        </form>
        )}

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
