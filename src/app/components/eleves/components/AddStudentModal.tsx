import React, { useState } from "react";
import { Loader2, Users, X } from "lucide-react";

export interface NewStudentForm {
  matricule: string;
  nom: string;
  prenom: string;
  genre: "F" | "M";
  dateNaissance: string;
  lieuNaissance: string;
  tuteurNom: string;
  tuteurPhone: string;
}

const EMPTY_FORM: NewStudentForm = {
  matricule: "",
  nom: "",
  prenom: "",
  genre: "M",
  dateNaissance: "",
  lieuNaissance: "",
  tuteurNom: "",
  tuteurPhone: "",
};

interface AddStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (form: NewStudentForm) => Promise<void>;
}

export function AddStudentModal({ open, onClose, onSave }: AddStudentModalProps) {
  const [form, setForm] = useState<NewStudentForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const field = (k: keyof NewStudentForm, v: string) =>
    setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim() || !form.prenom.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      setForm(EMPTY_FORM);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "10px",
    border: "1.5px solid var(--border)",
    fontSize: "13px",
    fontFamily: "'Plus Jakarta Sans',sans-serif",
    outline: "none",
    backgroundColor: "var(--card)",
    color: "var(--foreground)",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "10px",
    fontWeight: 700,
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    display: "block",
    marginBottom: "4px",
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[450]"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        onClick={onClose}
      />

      <div
        className="fixed bottom-0 left-0 right-0 z-[460] bg-card"
        style={{
          borderRadius: "20px 20px 0 0",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
          fontFamily: "'Plus Jakarta Sans',sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, backgroundColor: "var(--border)" }} />
        </div>

        <div
          className="flex items-center justify-between px-5 pb-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <p style={{ fontSize: "17px", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>
              Ajouter un élève
            </p>
            <p style={{ fontSize: "11px", color: "var(--muted-foreground)", margin: 0 }}>
              Les champs Nom et Prénom sont obligatoires.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "var(--muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
            }}
          >
            <X style={{ width: 16, height: 16, color: "var(--muted-foreground)" }} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            overflowY: "auto",
            flex: 1,
            padding: "16px 20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label htmlFor="eleves_nom" style={labelStyle}>
                Nom *
              </label>
              <input
                id="eleves_nom"
                name="nom"
                style={inputStyle}
                value={form.nom}
                onChange={e => field("nom", e.target.value.toUpperCase())}
                placeholder="DIALLO"
                required
              />
            </div>
            <div>
              <label htmlFor="eleves_prenom" style={labelStyle}>
                Prénom *
              </label>
              <input
                id="eleves_prenom"
                name="prenom"
                style={inputStyle}
                value={form.prenom}
                onChange={e => field("prenom", e.target.value)}
                placeholder="Aminata"
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", alignItems: "end" }}>
            <div>
              <label htmlFor="eleves_matricule" style={labelStyle}>
                Matricule
              </label>
              <input
                id="eleves_matricule"
                name="matricule"
                style={inputStyle}
                value={form.matricule}
                onChange={e => field("matricule", e.target.value)}
                placeholder="CE2-026"
              />
            </div>
            <div>
              <label style={labelStyle}>Genre</label>
              <div style={{ display: "flex", gap: "6px" }}>
                {(["M", "F"] as const).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => field("genre", g)}
                    style={{
                      padding: "7px 16px",
                      borderRadius: "10px",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer",
                      border: "1.5px solid",
                      backgroundColor: form.genre === g ? "#1a365d" : "var(--muted)",
                      color: form.genre === g ? "#fff" : "#475569",
                      borderColor: form.genre === g ? "#1a365d" : "var(--border)",
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label htmlFor="eleves_dateNaissance" style={labelStyle}>
                Date de naissance
              </label>
              <input
                id="eleves_dateNaissance"
                name="dateNaissance"
                style={inputStyle}
                type="date"
                value={form.dateNaissance}
                onChange={e => field("dateNaissance", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="eleves_lieuNaissance" style={labelStyle}>
                Lieu de naissance
              </label>
              <input
                id="eleves_lieuNaissance"
                name="lieuNaissance"
                style={inputStyle}
                value={form.lieuNaissance}
                onChange={e => field("lieuNaissance", e.target.value)}
                placeholder="Kolda"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label htmlFor="eleves_tuteurNom" style={labelStyle}>
                Tuteur / Parent
              </label>
              <input
                id="eleves_tuteurNom"
                name="tuteurNom"
                style={inputStyle}
                value={form.tuteurNom}
                onChange={e => field("tuteurNom", e.target.value)}
                placeholder="Nom du tuteur"
              />
            </div>
            <div>
              <label htmlFor="eleves_tuteurPhone" style={labelStyle}>
                Téléphone
              </label>
              <input
                id="eleves_tuteurPhone"
                name="tuteurPhone"
                style={inputStyle}
                type="tel"
                inputMode="tel"
                value={form.tuteurPhone}
                onChange={e => field("tuteurPhone", e.target.value)}
                placeholder="+221 77 000 0000"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !form.nom.trim() || !form.prenom.trim()}
            style={{
              minHeight: "48px",
              borderRadius: "14px",
              fontWeight: 800,
              fontSize: "14px",
              cursor: saving ? "not-allowed" : "pointer",
              backgroundColor: form.nom && form.prenom ? "#1a365d" : "#94a3b8",
              color: "#fff",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: form.nom && form.prenom ? "0 4px 14px rgba(26,54,93,0.28)" : "none",
            }}
          >
            {saving ? (
              <>
                <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                Enregistrement…
              </>
            ) : (
              <>
                <Users style={{ width: 16, height: 16 }} />
                Ajouter à la classe
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );
}
