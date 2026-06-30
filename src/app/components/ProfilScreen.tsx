import { useState, useEffect, useRef } from "react";
import { useNavigate }                  from "react-router";
import {
  User, Building2, Phone, MapPin, Upload, CheckCircle,
  AlertTriangle, Save, ArrowLeft, ImageIcon,
} from "lucide-react";
import { toast }                        from "sonner";
import { useProfile }                   from "../../hooks/useProfile";
import type { UserRole }                from "../../hooks/useAuth";

// ─── Field helpers ────────────────────────────────────────────────────────────

function Section({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div style={{
      backgroundColor: "#fff", borderRadius: "16px",
      border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: "16px",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "14px 20px", backgroundColor: "#f8fafc",
        borderBottom: "1px solid #e2e8f0",
      }}>
        <span style={{ color: "#3182ce" }}>{icon}</span>
        <span style={{ fontSize: "13px", fontWeight: 800, color: "#1a365d",
                       textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {title}
        </span>
      </div>
      <div style={{ padding: "20px" }}>{children}</div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text", required,
}: {
  label: string; value: string;
  onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 700,
                      color: "#374151", marginBottom: "6px" }}>
        {label}{required && <span style={{ color: "#ef4444", marginLeft: "3px" }}>*</span>}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "10px 14px", borderRadius: "10px",
          border: "1.5px solid #e2e8f0", fontSize: "14px", outline: "none",
          backgroundColor: "#f8fafc", boxSizing: "border-box",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
        onFocus={e => (e.target.style.borderColor = "#3182ce")}
        onBlur={e  => (e.target.style.borderColor = "#e2e8f0")}
      />
    </div>
  );
}

// ─── Image upload card ────────────────────────────────────────────────────────

function ImageUpload({
  label, hint, currentUrl, onUpload, uploading,
}: {
  label: string; hint: string;
  currentUrl?: string;
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await onUpload(file);
      toast.success(`${label} mise à jour !`);
    } catch {
      toast.error(`Échec de l'upload. Vérifiez le format (JPG, PNG).`);
    }
    e.target.value = "";
  }

  return (
    <div style={{
      border: "1.5px dashed #cbd5e1", borderRadius: "14px",
      padding: "16px", textAlign: "center", backgroundColor: "#f8fafc",
    }}>
      {currentUrl ? (
        <img
          src={currentUrl} alt={label}
          style={{ maxHeight: "80px", maxWidth: "100%", objectFit: "contain",
                   borderRadius: "8px", marginBottom: "10px", display: "block", margin: "0 auto 10px" }}
        />
      ) : (
        <ImageIcon style={{ width: 36, height: 36, color: "#cbd5e1",
                            margin: "0 auto 8px", display: "block" }} />
      )}
      <p style={{ fontSize: "12px", fontWeight: 700, color: "#374151",
                  margin: "0 0 2px" }}>
        {label}
      </p>
      <p style={{ fontSize: "11px", color: "#94a3b8", margin: "0 0 10px" }}>{hint}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 700,
          backgroundColor: uploading ? "#e2e8f0" : "#1a365d",
          color: uploading ? "#94a3b8" : "#fff",
          border: "none", cursor: uploading ? "not-allowed" : "pointer",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <Upload style={{ width: 13, height: 13 }} />
        {uploading ? "Upload…" : currentUrl ? "Changer" : "Téléverser"}
      </button>
      <input
        ref={inputRef} type="file" accept="image/*"
        style={{ display: "none" }} onChange={handleChange}
      />
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function ProfilScreen() {
  const navigate                                   = useNavigate();
  const { profile, saving, uploading, updateProfile, uploadFile } = useProfile();

  // ── Form state (initialised from profile) ────────────────────────────────
  const [fullName,     setFullName]     = useState("");
  const [role,         setRole]         = useState<UserRole>("teacher");
  const [telephone,    setTelephone]    = useState("");
  const [ecoleName,    setEcoleName]    = useState("");
  const [ief,          setIef]          = useState("");
  const [adresse,      setAdresse]      = useState("");
  const [classeActive, setClasseActive] = useState("CE2");

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

  const isProfileIncomplete =
    !profile?.fullName || !profile?.ecoleName || !profile?.ief;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateProfile({
        full_name:     fullName,
        role,
        telephone,
        ecole_nom:     ecoleName,
        ief,
        adresse,
        classe_active: classeActive,
      });
      toast.success("Profil enregistré avec succès !");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    }
  }

  const ALL_CLASSES = ["CI", "CP", "CE1", "CE2", "CM1", "CM2"];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: "100vh" }}>

      {/* ── Page header ── */}
      <div style={{
        backgroundColor: "#fff", borderBottom: "1px solid #e2e8f0",
        padding: "14px 20px", display: "flex", alignItems: "center", gap: "12px",
      }}>
        <button
          onClick={() => navigate("/")}
          style={{ display: "flex", alignItems: "center", gap: "6px",
                   background: "none", border: "none", cursor: "pointer",
                   color: "#1a365d", fontSize: "13px", fontWeight: 600,
                   fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Retour
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "16px", fontWeight: 800, color: "#1a365d", margin: 0 }}>
            Mon Profil
          </h1>
          <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>
            Informations personnelles et de l'école
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "20px 16px 40px" }}>

        {/* ── Incomplete profile warning ── */}
        {isProfileIncomplete && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: "12px",
            backgroundColor: "#fffbeb", border: "1px solid #fcd34d",
            borderRadius: "12px", padding: "14px 16px", marginBottom: "20px",
          }}>
            <AlertTriangle style={{ width: 18, height: 18, color: "#d97706", flexShrink: 0, marginTop: "1px" }} />
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#92400e", margin: "0 0 3px" }}>
                Profil incomplet
              </p>
              <p style={{ fontSize: "12px", color: "#92400e", margin: 0, lineHeight: 1.5 }}>
                Veuillez compléter votre nom, le nom de votre école et votre IEF.
                Ces informations apparaîtront automatiquement dans l'en-tête de vos documents.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave}>

          {/* ── Informations personnelles ── */}
          <Section title="Informations personnelles" icon={<User style={{ width: 16, height: 16 }} />}>
            <Field
              label="Nom complet" required
              value={fullName} onChange={setFullName}
              placeholder="M. Abdou DIALLO"
            />
            <Field
              label="Téléphone"
              value={telephone} onChange={setTelephone}
              placeholder="+221 77 000 00 00" type="tel"
            />

            <div style={{ marginBottom: "6px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700,
                              color: "#374151", marginBottom: "8px" }}>
                Rôle
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
          </Section>

          {/* ── Informations de l'école ── */}
          <Section title="Mon École" icon={<Building2 style={{ width: 16, height: 16 }} />}>
            <Field
              label="Nom de l'école" required
              value={ecoleName} onChange={setEcoleName}
              placeholder="École Ilyaou Mamadou SEYDI"
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Field
                label="IEF (Inspection)" required
                value={ief} onChange={setIef}
                placeholder="Kolda"
              />
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700,
                                color: "#374151", marginBottom: "6px" }}>
                  Classe active
                </label>
                <select
                  value={classeActive} onChange={e => setClasseActive(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: "10px",
                    border: "1.5px solid #e2e8f0", fontSize: "14px", outline: "none",
                    backgroundColor: "#f8fafc", boxSizing: "border-box",
                    fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a365d",
                  }}
                >
                  {ALL_CLASSES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <Field
              label="Adresse"
              value={adresse} onChange={setAdresse}
              placeholder="Quartier, Commune, Région"
            />
          </Section>

          {/* ── Médias ── */}
          <Section title="Médias de l'école" icon={<ImageIcon style={{ width: 16, height: 16 }} />}>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 16px", lineHeight: 1.6 }}>
              Ces images s'affichent automatiquement dans l'en-tête et le pied de page
              de vos fiches de préparation et bulletins.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <ImageUpload
                label="Logo de l'école"
                hint="JPG, PNG — max 2 Mo"
                currentUrl={profile?.logoUrl}
                uploading={uploading}
                onUpload={file => uploadFile(file, "logo")}
              />
              <ImageUpload
                label="Signature manuscrite"
                hint="JPG, PNG — fond blanc"
                currentUrl={profile?.signatureUrl}
                uploading={uploading}
                onUpload={file => uploadFile(file, "signature")}
              />
            </div>
          </Section>

          {/* ── Save button ── */}
          <button
            type="submit" disabled={saving || uploading}
            style={{
              width: "100%", padding: "14px", borderRadius: "14px",
              backgroundColor: saving ? "#94a3b8" : "#1a365d",
              color: "#fff", fontWeight: 800, fontSize: "15px",
              border: "none", cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              boxShadow: "0 4px 18px rgba(26,54,93,0.28)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {saving
              ? <><span style={{ width: 18, height: 18, borderRadius: "50%",
                                 border: "2px solid rgba(255,255,255,0.3)",
                                 borderTopColor: "#fff", display: "inline-block",
                                 animation: "spin 0.7s linear infinite" }} />
                  Enregistrement…</>
              : <><Save style={{ width: 18, height: 18 }} />
                  Enregistrer les modifications</>
            }
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        </form>

        {/* ── Profile complete indicator ── */}
        {!isProfileIncomplete && (
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            justifyContent: "center", marginTop: "16px",
          }}>
            <CheckCircle style={{ width: 14, height: 14, color: "#10b981" }} />
            <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 600 }}>
              Profil complet — vos documents seront correctement renseignés
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
