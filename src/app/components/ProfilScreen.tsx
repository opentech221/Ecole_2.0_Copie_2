import { useState, useEffect, useRef } from "react";
import { useNavigate }                  from "react-router";
import {
  Camera, Building2, MapPin, Phone, Save,
  AlertTriangle, CheckCircle, ImageIcon, Upload, Lock, Eye, EyeOff,
} from "lucide-react";
import { toast }                        from "sonner";
import { supabase }                     from "../../lib/supabase";
import { useProfile }                   from "../../hooks/useProfile";
import type { UserRole }                from "../../hooks/useAuth";
import { useAuthContext }               from "../contexts/AuthContext";

const FF = "'Plus Jakarta Sans', sans-serif";

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2)
    .map(w => w[0]).join("").toUpperCase();
}

// ─── Shared card wrapper ──────────────────────────────────────────────────────

function Card({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div style={{
      backgroundColor: "var(--card)", borderRadius: "14px",
      border: "1px solid var(--border)", overflow: "hidden",
      marginBottom: "16px",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: "12px 18px", backgroundColor: "var(--muted)",
        borderBottom: "1px solid var(--border)",
      }}>
        <span style={{ color: "var(--muted-foreground)" }}>{icon}</span>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted-foreground)",
                       textTransform: "uppercase", letterSpacing: "0.08em",
                       fontFamily: FF, color: "var(--foreground)" }}>
          {title}
        </span>
      </div>
      <div style={{ padding: "18px" }}>{children}</div>
    </div>
  );
}

// ─── Field input ──────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, type = "text", required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700,
                      color: "var(--muted-foreground)", marginBottom: "5px", fontFamily: FF, color: "var(--foreground)" }}>
        {label}{required && <span style={{ color: "var(--destructive)", marginLeft: "2px" }}>*</span>}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "9px 12px", borderRadius: "8px",
          border: "1.5px solid var(--border)", fontSize: "13px", outline: "none",
          backgroundColor: "var(--muted)", boxSizing: "border-box", fontFamily: FF,
        }}
        onFocus={e => (e.target.style.borderColor = "var(--secondary)")}
        onBlur={e  => (e.target.style.borderColor = "var(--border)")}
      />
    </div>
  );
}

// ─── Image upload tile ────────────────────────────────────────────────────────

function ImageTile({ label, hint, currentUrl, onUpload, uploading }: {
  label: string; hint: string; currentUrl?: string;
  onUpload: (f: File) => Promise<void>; uploading: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await onUpload(file);
      toast.success(`${label} mise à jour !`);
    } catch {
      toast.error("Échec de l'upload.");
    }
    e.target.value = "";
  }
  return (
    <div style={{
      border: "1.5px dashed var(--border)", borderRadius: "12px",
      padding: "14px", textAlign: "center", backgroundColor: "var(--muted)",
    }}>
      {currentUrl
        ? <img src={currentUrl} alt={label} style={{
            maxHeight: "70px", maxWidth: "100%", objectFit: "contain",
            borderRadius: "6px", margin: "0 auto 8px", display: "block",
          }} />
        : <ImageIcon style={{ width: 32, height: 32, color: "var(--border)",
                               margin: "0 auto 6px", display: "block" }} />}
      <p style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--foreground)",
                  margin: "0 0 2px", fontFamily: FF, color: "var(--foreground)" }}>{label}</p>
      <p style={{ fontSize: "10.5px", color: "var(--muted-foreground)", margin: "0 0 8px",
                  fontFamily: FF, color: "var(--foreground)" }}>{hint}</p>
      <button
        type="button" onClick={() => ref.current?.click()} disabled={uploading}
        style={{
          display: "inline-flex", alignItems: "center", gap: "5px",
          padding: "6px 14px", borderRadius: "7px",
          backgroundColor: uploading ? "#e2e8f0" : "#1a365d",
          color: uploading ? "#94a3b8" : "#fff",
          fontSize: "11px", fontWeight: 700, border: "none",
          cursor: uploading ? "not-allowed" : "pointer", fontFamily: FF,
        }}
      >
        <Upload style={{ width: 11, height: 11 }} />
        {uploading ? "Upload…" : currentUrl ? "Changer" : "Téléverser"}
      </button>
      <input ref={ref} type="file" accept="image/*"
             style={{ display: "none" }} onChange={handleChange} />
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function ProfilScreen() {
  const navigate  = useNavigate();
  const { user }  = useAuthContext();
  const { profile, saving, uploading, updateProfile, uploadFile, updateEmail } = useProfile();

  // Form state
  const [fullName,     setFullName]     = useState("");
  const [role,         setRole]         = useState<UserRole>("teacher");
  const [email,        setEmail]        = useState("");
  const [telephone,    setTelephone]    = useState("");
  const [ecoleName,    setEcoleName]    = useState("");
  const [ief,          setIef]          = useState("");
  const [adresse,      setAdresse]      = useState("");
  const [classeActive, setClasseActive] = useState("CE2");

  // Password change
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // Email update
  const [emailUpdating, setEmailUpdating] = useState(false);
  const [emailChanged,  setEmailChanged]  = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName     ?? "");
    setRole(profile.role             ?? "teacher");
    setTelephone(profile.telephone   ?? "");
    setEcoleName(profile.ecoleName   ?? "");
    setIef(profile.ief               ?? "");
    setAdresse(profile.adresse       ?? "");
    setClasseActive(profile.classeActive ?? "CE2");
  }, [profile]);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  const isComplete   = !!profile?.fullName?.trim() && !!profile?.ecoleName?.trim();
  const initials     = getInitials(fullName || "U");
  const displayEmail = user?.email ?? user?.phone ?? "";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateProfile({
        full_name: fullName, role, telephone,
        ecole_nom: ecoleName, ief, adresse, classe_active: classeActive,
      });
      toast.success("Profil enregistré !");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    }
  }

  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email || email === user?.email) {
      toast.info("Entrez une nouvelle adresse email.");
      return;
    }
    setEmailUpdating(true);
    try {
      await updateEmail(email);
      setEmailChanged(true);
      toast.success("Email mis à jour ! Vérification envoyée.");
      setTimeout(() => setEmailChanged(false), 5000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur mise à jour email");
    } finally {
      setEmailUpdating(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) { toast.error("Mots de passe différents."); return; }
    if (newPw.length < 6)    { toast.error("Minimum 6 caractères."); return; }

    setPwLoading(true);
    try {
      // If user has an email, verify current password first
      if (currentPw && user?.email) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPw,
        });
        if (signInErr) {
          toast.error("Mot de passe actuel incorrect.");
          setPwLoading(false);
          return;
        }
      }
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) {
        toast.error("Erreur : " + error.message);
      } else {
        toast.success("Mot de passe mis à jour !");
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
      }
    } finally {
      setPwLoading(false);
    }
  }

  const ALL_CLASSES = ["CI", "CP", "CE1", "CE2", "CM1", "CM2"];

  return (
    <div style={{ backgroundColor: "var(--muted)", minHeight: "100vh", fontFamily: FF, color: "var(--foreground)" }}>

      {/* ── Hero card ── */}
      <div style={{
        background:    "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #2d4a7a 100%)",
        padding:       "28px 20px 60px",
        position:      "relative",
      }}>
        <div style={{ textAlign: "center" }}>
          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "24px", fontWeight: 800, color: "var(--primary-foreground)",
            margin: "0 auto 12px",
            border: "3px solid rgba(255,255,255,0.25)",
            boxShadow: "0 6px 24px rgba(0,0,0,0.30)",
            position: "relative",
          }}>
            {profile?.logoUrl
              ? <img src={profile.logoUrl} alt="" style={{
                  width: "100%", height: "100%", borderRadius: "50%",
                  objectFit: "cover",
                }} />
              : initials}

            {/* Camera overlay */}
            <div style={{
              position: "absolute", bottom: -2, right: -2,
              width: 22, height: 22, borderRadius: "50%",
              backgroundColor: "var(--card)",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1.5px solid var(--border)",
            }}>
              <Camera style={{ width: 11, height: 11, color: "var(--muted-foreground)" }} />
            </div>
          </div>

          <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--primary-foreground)",
                       margin: "0 0 3px" }}>
            {fullName || "Mon Profil"}
          </h2>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", margin: 0 }}>
            {role === "director" ? "Directeur" : "Enseignant"} · {displayEmail}
          </p>

          {/* Completion badge */}
          {isComplete
            ? <div style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                marginTop: "10px", padding: "3px 12px", borderRadius: "999px",
                backgroundColor: "rgba(5,150,105,0.20)",
                border: "1px solid rgba(5,150,105,0.35)",
              }}>
                <CheckCircle style={{ width: 11, height: 11, color: "#6ee7b7" }} />
                <span style={{ fontSize: "10px", fontWeight: 700,
                               color: "#6ee7b7" }}>
                  Profil complet
                </span>
              </div>
            : <div style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                marginTop: "10px", padding: "3px 12px", borderRadius: "999px",
                backgroundColor: "rgba(251,191,36,0.18)",
                border: "1px solid rgba(251,191,36,0.30)",
              }}>
                <AlertTriangle style={{ width: 11, height: 11, color: "#fbbf24" }} />
                <span style={{ fontSize: "10px", fontWeight: 700,
                               color: "#fcd34d" }}>
                  Profil incomplet
                </span>
              </div>}
        </div>
      </div>

      {/* Content overlaps hero with negative margin */}
      <div style={{
        maxWidth: "680px", margin: "-32px auto 0",
        padding: "0 16px 40px", position: "relative", zIndex: 1,
      }}>
        <form onSubmit={handleSave}>

          {/* ── Informations personnelles ── */}
          <Card title="Informations personnelles"
                icon={<Camera style={{ width: 14, height: 14 }} />}>
            <Field label="Nom complet" required
                   value={fullName} onChange={setFullName}
                   placeholder="M. Abdou DIALLO" />

            {/* Email — utilisé pour la connexion Email + mot de passe */}
            <div style={{ marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700,
                              color: "var(--muted-foreground)", marginBottom: "5px", fontFamily: FF, color: "var(--foreground)" }}>
                Adresse email (connexion email)
              </label>
              <div style={{ display: "flex", gap: "6px", alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    style={{
                      width: "100%", padding: "9px 12px", borderRadius: "8px",
                      border: "1.5px solid var(--border)", fontSize: "13px", outline: "none",
                      backgroundColor: "var(--muted)", boxSizing: "border-box", fontFamily: FF,
                    }}
                    onFocus={e => (e.target.style.borderColor = "var(--secondary)")}
                    onBlur={e  => (e.target.style.borderColor = "var(--border)")}
                  />
                </div>
                <button
                  type="button" onClick={handleUpdateEmail} disabled={emailUpdating || email === user?.email}
                  style={{
                    padding: "9px 12px", borderRadius: "8px",
                    backgroundColor: emailUpdating || email === user?.email ? "#e2e8f0" : "#3182ce",
                    color: emailUpdating || email === user?.email ? "#94a3b8" : "#fff",
                    fontSize: "11.5px", fontWeight: 700, border: "none",
                    cursor: emailUpdating || email === user?.email ? "not-allowed" : "pointer",
                    fontFamily: FF, whiteSpace: "nowrap",
                  }}
                >
                  {emailUpdating ? "Mise à jour…" : emailChanged ? "✓ Mis à jour" : "Mettre à jour"}
                </button>
              </div>
              <p style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "4px",
                          fontFamily: FF, color: "var(--foreground)" }}>
                Utilisé pour vous connecter via Email + mot de passe. Vérification par email sera envoyée.
              </p>
            </div>

            {/* Téléphone WhatsApp — utilisé pour l'OTP WhatsApp */}
            <Field
              label="Numéro WhatsApp (connexion WhatsApp OTP)"
              value={telephone} onChange={setTelephone}
              placeholder="+221771234567" type="tel"
            />
            <p style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "-8px",
                        marginBottom: "12px", fontFamily: FF, color: "var(--foreground)" }}>
              Format international requis (+221…). Utilisé pour recevoir le code WhatsApp.
            </p>

            <div style={{ marginBottom: "6px" }}>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700,
                              color: "var(--muted-foreground)", marginBottom: "8px", fontFamily: FF, color: "var(--foreground)" }}>
                Rôle
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {(["teacher", "director"] as UserRole[]).map(r => {
                  const a = role === r;
                  return (
                    <button key={r} type="button" onClick={() => setRole(r)}
                      style={{
                        flex: 1, padding: "9px 8px", borderRadius: "8px",
                        backgroundColor: a ? "#1a365d" : "#f8fafc",
                        border: `2px solid ${a ? "#1a365d" : "#e2e8f0"}`,
                        color: a ? "#fff" : "#64748b",
                        fontWeight: 700, fontSize: "12.5px", cursor: "pointer",
                        fontFamily: FF,
                      }}
                    >
                      {r === "teacher" ? "Enseignant" : "Directeur"}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* ── Mon École ── */}
          <Card title="Mon École"
                icon={<Building2 style={{ width: 14, height: 14 }} />}>
            <Field label="Nom de l'école" required
                   value={ecoleName} onChange={setEcoleName}
                   placeholder="École Ilyaou Mamadou SEYDI" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Field label="IEF (Inspection)" required
                     value={ief} onChange={setIef}
                     placeholder="Kolda" />
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700,
                                color: "var(--muted-foreground)", marginBottom: "5px", fontFamily: FF, color: "var(--foreground)" }}>
                  Classe active
                </label>
                <select
                  value={classeActive} onChange={e => setClasseActive(e.target.value)}
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: "8px",
                    border: "1.5px solid var(--border)", fontSize: "13px", outline: "none",
                    backgroundColor: "var(--muted)", fontFamily: FF, color: "var(--primary)",
                  }}
                >
                  {ALL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700,
                              color: "var(--muted-foreground)", marginBottom: "5px", fontFamily: FF, color: "var(--foreground)" }}>
                <MapPin style={{ width: 11, height: 11, display: "inline",
                                  marginRight: "4px" }} />
                Adresse
              </label>
              <input
                type="text" value={adresse} onChange={e => setAdresse(e.target.value)}
                placeholder="Quartier, Commune, Région"
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: "8px",
                  border: "1.5px solid var(--border)", fontSize: "13px", outline: "none",
                  backgroundColor: "var(--muted)", fontFamily: FF, boxSizing: "border-box",
                }}
                onFocus={e => (e.target.style.borderColor = "var(--secondary)")}
                onBlur={e  => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
          </Card>

          {/* ── Médias ── */}
          <Card title="Médias de l'école"
                icon={<ImageIcon style={{ width: 14, height: 14 }} />}>
            <p style={{ fontSize: "12px", color: "var(--muted-foreground)", margin: "0 0 14px",
                        lineHeight: 1.6 }}>
              Ces images apparaissent dans l'en-tête de vos fiches de préparation et bulletins.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <ImageTile
                label="Logo de l'école" hint="JPG, PNG — max 2 Mo"
                currentUrl={profile?.logoUrl} uploading={uploading}
                onUpload={f => uploadFile(f, "logo")}
              />
              <ImageTile
                label="Signature" hint="Fond blanc recommandé"
                currentUrl={profile?.signatureUrl} uploading={uploading}
                onUpload={f => uploadFile(f, "signature")}
              />
            </div>
          </Card>

          {/* Save button */}
          <button
            type="submit" disabled={saving || uploading}
            style={{
              width: "100%", padding: "13px", borderRadius: "12px",
              backgroundColor: saving ? "#94a3b8" : "#1a365d",
              color: "var(--primary-foreground)", fontWeight: 800, fontSize: "14px",
              border: "none", cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              boxShadow: "0 4px 16px rgba(26,54,93,0.25)",
              fontFamily: FF, marginBottom: "16px",
            }}
          >
            <Save style={{ width: 16, height: 16 }} />
            {saving ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </form>

        {/* ── Mot de passe ── */}
        <Card title="Sécurité"
              icon={<Lock style={{ width: 14, height: 14 }} />}>
          <p style={{ fontSize: "12px", color: "var(--muted-foreground)", marginBottom: "14px", fontFamily: FF, lineHeight: 1.5 }}>
            Gérez votre mot de passe pour sécuriser votre compte et vous connecter via Email + mot de passe.
          </p>
          <form onSubmit={handlePasswordChange}>
            {/* Mot de passe actuel */}
            {user?.email && (
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700,
                                color: "var(--muted-foreground)", marginBottom: "5px", fontFamily: FF, color: "var(--foreground)" }}>
                  Mot de passe actuel <span style={{ color: "var(--destructive)" }}>*</span>
                </label>
                <input
                  type="password"
                  value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                  placeholder="Votre mot de passe actuel"
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: "8px",
                    border: "1.5px solid var(--border)", fontSize: "13px", outline: "none",
                    backgroundColor: "var(--muted)", fontFamily: FF, boxSizing: "border-box",
                  }}
                  onFocus={e => (e.target.style.borderColor = "var(--secondary)")}
                  onBlur={e  => (e.target.style.borderColor = "var(--border)")}
                />
                <p style={{ fontSize: "10.5px", color: "var(--muted-foreground)", marginTop: "4px",
                            fontFamily: FF, color: "var(--foreground)" }}>
                  Requis pour vérifier votre identité avant de changer le mot de passe.
                </p>
              </div>
            )}
            
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700,
                              color: "var(--muted-foreground)", marginBottom: "5px", fontFamily: FF, color: "var(--foreground)" }}>
                Nouveau mot de passe <span style={{ color: "var(--destructive)" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={newPw} onChange={e => setNewPw(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  style={{
                    width: "100%", padding: "9px 40px 9px 12px", borderRadius: "8px",
                    border: "1.5px solid var(--border)", fontSize: "13px", outline: "none",
                    backgroundColor: "var(--muted)", fontFamily: FF, boxSizing: "border-box",
                  }}
                  onFocus={e => (e.target.style.borderColor = "var(--secondary)")}
                  onBlur={e  => (e.target.style.borderColor = "var(--border)")}
                />
                <button
                  type="button"
                  aria-label={showPw ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  onClick={() => setShowPw(p => !p)}
                  style={{ position: "absolute", right: "10px", top: "50%",
                           transform: "translateY(-50%)", background: "none",
                           border: "none", cursor: "pointer", color: "var(--muted-foreground)",
                           display: "flex", padding: 0 }}>
                  {showPw
                    ? <EyeOff style={{ width: 15, height: 15 }} />
                    : <Eye    style={{ width: 15, height: 15 }} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700,
                              color: "var(--muted-foreground)", marginBottom: "5px", fontFamily: FF, color: "var(--foreground)" }}>
                Confirmer le mot de passe <span style={{ color: "var(--destructive)" }}>*</span>
              </label>
              <input
                type={showPw ? "text" : "password"}
                value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                placeholder="Répétez le mot de passe"
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: "8px",
                  border: `1.5px solid ${confirmPw && confirmPw !== newPw ? "#fca5a5" : "#e2e8f0"}`,
                  fontSize: "13px", outline: "none", backgroundColor: "var(--muted)",
                  fontFamily: FF, boxSizing: "border-box",
                }}
                onFocus={e => (e.target.style.borderColor = "var(--secondary)")}
                onBlur={e  => (e.target.style.borderColor =
                  confirmPw && confirmPw !== newPw ? "var(--destructive)" : "var(--border)")}
              />
              {confirmPw && confirmPw !== newPw && (
                <p style={{ fontSize: "10.5px", color: "var(--destructive)", marginTop: "4px", fontFamily: FF }}>
                  ❌ Les mots de passe ne correspondent pas.
                </p>
              )}
            </div>

            <button type="submit" disabled={pwLoading || !newPw || !currentPw}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "10px 18px", borderRadius: "8px",
                backgroundColor: pwLoading || !newPw || !currentPw ? "#e2e8f0" : "#1a365d",
                color: pwLoading || !newPw || !currentPw ? "#94a3b8" : "#fff",
                fontSize: "12.5px", fontWeight: 700, border: "none",
                cursor: pwLoading || !newPw || !currentPw ? "not-allowed" : "pointer",
                fontFamily: FF, width: "100%", justifyContent: "center",
              }}
            >
              <Lock style={{ width: 13, height: 13 }} />
              {pwLoading ? "Mise à jour…" : "Modifier le mot de passe"}
            </button>
          </form>
        </Card>

      </div>
    </div>
  );
}
