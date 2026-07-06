import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate }       from "react-router";
import { useProfileGuard }   from "../../hooks/useProfileGuard";
import { ProfileGuardLoader } from "./ProfileGuardLoader";
import {
  ArrowLeft, Search, Printer, Download, FileText,
  BookOpen, Calendar, Filter, Eye, X, Trash2, Plus, Upload, Loader2, Pencil, Check,
} from "lucide-react";
import { toast } from "sonner";
import { useDocumentsQuery } from "../../hooks/useDocumentsQuery";
import { documentsApi, type DocumentRow } from "../../services/apiService";
import { PermissionGuard } from "../../components/PermissionGuard";
import { useAppContext }   from "../contexts/AppContext";

// ─── Document types ───────────────────────────────────────────────────────────

type DocType = "fiche" | "bulletin" | "planning";

interface Document {
  id: string;
  type: DocType;
  title: string;
  subtitle: string;
  meta: string;
  date: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
}

type DocTone = {
  badgeColor: string;
  badgeBg: string;
  accentBar: string;
  headerColor: string;
};

const DOC_TONES: Record<DocType, DocTone> = {
  fiche: {
    badgeColor: "var(--primary)",
    badgeBg: "color-mix(in srgb, var(--primary) 12%, var(--background))",
    accentBar: "var(--primary)",
    headerColor: "var(--primary)",
  },
  bulletin: {
    badgeColor: "var(--secondary)",
    badgeBg: "color-mix(in srgb, var(--secondary) 12%, var(--background))",
    accentBar: "var(--secondary)",
    headerColor: "var(--secondary)",
  },
  planning: {
    badgeColor: "var(--accent-foreground)",
    badgeBg: "color-mix(in srgb, var(--accent-foreground) 10%, var(--background))",
    accentBar: "var(--accent-foreground)",
    headerColor: "var(--accent-foreground)",
  },
};

function makeDocument(doc: Omit<Document, "badgeColor" | "badgeBg">): Document {
  const tone = DOC_TONES[doc.type];
  return { ...doc, badgeColor: tone.badgeColor, badgeBg: tone.badgeBg };
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_FICHES: Document[] = [
  makeDocument({ id:"f1", type:"fiche", title:"Activités Numériques — Décomposition du nombre 4",     subtitle:"Mathématiques · CE2",             meta:"OA1 · OS1.2 · 45 min", date:"20/06/2026", badge:"Fiche Pédagogique" }),
  makeDocument({ id:"f2", type:"fiche", title:"Grammaire — Accord du participe passé",                subtitle:"Langue et Communication · CE1",    meta:"OA2 · OS2.1 · 45 min", date:"19/06/2026", badge:"Fiche Pédagogique" }),
  makeDocument({ id:"f3", type:"fiche", title:"Histoire-Géographie — Le Fleuve Sénégal",             subtitle:"ESVS · CE2",                       meta:"OA1 · OS1.1 · 30 min", date:"18/06/2026", badge:"Fiche Pédagogique" }),
  makeDocument({ id:"f4", type:"fiche", title:"Lecture — La lettre « b » en cursive",                 subtitle:"Langue et Communication · CI",     meta:"OA1 · OS1.1 · 30 min", date:"17/06/2026", badge:"Fiche Pédagogique" }),
  makeDocument({ id:"f5", type:"fiche", title:"Activités Géométriques — Le carré et le rectangle",   subtitle:"Mathématiques · CE2",             meta:"OA1 · OS1.3 · 45 min", date:"15/06/2026", badge:"Fiche Pédagogique" }),
  makeDocument({ id:"f6", type:"fiche", title:"Résolution de Problèmes — Monnaie CFA",               subtitle:"Mathématiques · CE2",             meta:"OA2 · OS2.3 · 45 min", date:"12/06/2026", badge:"Fiche Pédagogique" }),
];

const MOCK_BULLETINS: Document[] = [
  makeDocument({ id:"b1",  type:"bulletin", title:"DIALLO Aminata",     subtitle:"CE2 · Trimestre 3", meta:"Moy. T3 : 7.50/10 · Admis(e) CM1", date:"30/06/2026", badge:"Bulletin" }),
  makeDocument({ id:"b2",  type:"bulletin", title:"SOW Moussa",         subtitle:"CE2 · Trimestre 3", meta:"Moy. T3 : 6.20/10 · Admis(e) CM1", date:"30/06/2026", badge:"Bulletin" }),
  makeDocument({ id:"b3",  type:"bulletin", title:"NDIAYE Fatou",       subtitle:"CE2 · Trimestre 3", meta:"Moy. T3 : 6.75/10 · Admis(e) CM1", date:"30/06/2026", badge:"Bulletin" }),
  makeDocument({ id:"b4",  type:"bulletin", title:"BA Ibrahima",        subtitle:"CE2 · Trimestre 3", meta:"Moy. T3 : 5.90/10 · Admis(e) CM1", date:"30/06/2026", badge:"Bulletin" }),
  makeDocument({ id:"b5",  type:"bulletin", title:"TRAORÉ Mariama",     subtitle:"CE2 · Trimestre 3", meta:"Moy. T3 : 7.10/10 · Admis(e) CM1", date:"30/06/2026", badge:"Bulletin" }),
  makeDocument({ id:"b6",  type:"bulletin", title:"DIOP Abdou",         subtitle:"CE2 · Trimestre 3", meta:"Moy. T3 : 4.30/10 · Redoublement", date:"30/06/2026", badge:"Bulletin" }),
  makeDocument({ id:"b7",  type:"bulletin", title:"FALL Aissatou",      subtitle:"CE2 · Trimestre 3", meta:"Moy. T3 : 6.50/10 · Admis(e) CM1", date:"30/06/2026", badge:"Bulletin" }),
  makeDocument({ id:"b8",  type:"bulletin", title:"KANE Cheikh",        subtitle:"CE2 · Trimestre 3", meta:"Moy. T3 : 5.10/10 · Admis(e) CM1", date:"30/06/2026", badge:"Bulletin" }),
  makeDocument({ id:"b9",  type:"bulletin", title:"MBAYE Rokhaya",      subtitle:"CE2 · Trimestre 3", meta:"Moy. T3 : 7.80/10 · Admis(e) CM1", date:"30/06/2026", badge:"Bulletin" }),
  makeDocument({ id:"b10", type:"bulletin", title:"SARR Omar",          subtitle:"CE2 · Trimestre 3", meta:"Moy. T3 : 4.75/10 · Test passage",  date:"30/06/2026", badge:"Bulletin" }),
  makeDocument({ id:"b11", type:"bulletin", title:"THIAM Ndèye",        subtitle:"CE2 · Trimestre 3", meta:"Moy. T3 : 6.00/10 · Admis(e) CM1", date:"30/06/2026", badge:"Bulletin" }),
  makeDocument({ id:"b12", type:"bulletin", title:"KONATÉ Mamadou",     subtitle:"CE2 · Trimestre 3", meta:"Moy. T3 : 5.50/10 · Admis(e) CM1", date:"30/06/2026", badge:"Bulletin" }),
];

const MOCK_PLANNING: Document[] = [
  makeDocument({ id:"p1", type:"planning", title:"Répartition Trimestrielle — Trimestre 1", subtitle:"CE2 · Octobre → Décembre 2025", meta:"Mathématiques · Langue · ESVS · EPSA", date:"01/10/2025", badge:"Planning" }),
  makeDocument({ id:"p2", type:"planning", title:"Répartition Trimestrielle — Trimestre 2", subtitle:"CE2 · Janvier → Mars 2026",    meta:"Mathématiques · Langue · ESVS · EPSA", date:"06/01/2026", badge:"Planning" }),
  makeDocument({ id:"p3", type:"planning", title:"Répartition Trimestrielle — Trimestre 3", subtitle:"CE2 · Avril → Juin 2026",      meta:"Mathématiques · Langue · ESVS · EPSA", date:"07/04/2026", badge:"Planning" }),
];

const ALL_DOCS: Document[] = [...MOCK_PLANNING, ...MOCK_FICHES, ...MOCK_BULLETINS];

type Filter = "all" | DocType;

const TYPE_ICON: Record<DocType, React.ReactNode> = {
  fiche:    <BookOpen className="w-3.5 h-3.5"/>,
  bulletin: <FileText className="w-3.5 h-3.5"/>,
  planning: <Calendar className="w-3.5 h-3.5"/>,
};

const TYPE_LABEL: Record<DocType, string> = {
  fiche:    "Fiches",
  bulletin: "Bulletins",
  planning: "Planning",
};

// ─── Mobile-safe print hook ────────────────────────────────────────────────────
// Injects print content into the DOM, adds a body class to isolate it via
// @media print CSS, then calls window.print() — works on iOS Safari &
// Android Chrome with no window.open() / popup-blocker concerns.

function usePrintDoc() {
  const [printDoc, setPrintDoc] = useState<Document | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!printDoc) return;
    document.body.classList.add("ecole-printing");
    // Give React one frame to render the print portal, then print
    timerRef.current = setTimeout(() => {
      window.print();
      timerRef.current = setTimeout(() => {
        document.body.classList.remove("ecole-printing");
        setPrintDoc(null);
      }, 1800);
    }, 120);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.body.classList.remove("ecole-printing");
    };
  }, [printDoc]);

  return { printDoc, triggerPrint: setPrintDoc };
}

// ─── Print portal — visible only in @media print ───────────────────────────────

function DocPrintPortal({ doc }: { doc: Document }) {
  const typeLabel: Record<DocType, string> = {
    fiche: "Fiche Pédagogique", bulletin: "Bulletin de Notes", planning: "Tableau de Planification",
  };
  return (
    <div id="ecole-print-portal"
         style={{ fontFamily: "Arial, Helvetica, sans-serif", color: "#111827", padding: "0 15mm" }}>
      {/* A4 header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                    borderBottom: "2px solid var(--primary)", paddingBottom: "6px", marginBottom: "10px" }}>
        <div>
          <p style={{ fontSize: "8pt", color: "var(--muted-foreground)", margin: 0, lineHeight: 1.4 }}>IA : Inspection Académique de Kolda</p>
          <p style={{ fontSize: "8pt", color: "var(--muted-foreground)", margin: 0, lineHeight: 1.4 }}>IEF : Inspection de l'Éducation et de la Formation de Kolda</p>
          <p style={{ fontSize: "10pt", fontWeight: 700, color: "var(--primary)", margin: 0 }}>École : Ilyaou Mamadou SEYDI</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "10pt", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", margin: 0, lineHeight: 1.4 }}>République du Sénégal</p>
          <p style={{ fontSize: "8pt", color: "var(--muted-foreground)", margin: 0 }}>Un Peuple – Un But – Une Foi</p>
          <p style={{ fontSize: "8pt", color: "var(--muted-foreground)", margin: 0 }}>Année Scolaire 2025–2026</p>
        </div>
      </div>
      <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "999px",
                     fontSize: "9pt", fontWeight: 700, backgroundColor: doc.badgeBg,
                     color: doc.badgeColor, border: `1px solid ${doc.badgeColor}30`,
                     marginBottom: "8px" }}>
        {typeLabel[doc.type]}
      </span>
      <p style={{ fontSize: "16pt", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase",
                  letterSpacing: "0.05em", margin: "0 0 4px" }}>{doc.title}</p>
      <p style={{ fontSize: "11pt", color: "var(--muted-foreground)", margin: "0 0 2px" }}>{doc.subtitle}</p>
      <p style={{ fontSize: "9pt", color: "var(--muted-foreground)", margin: "0 0 18px" }}>{doc.meta} · {doc.date}</p>
      <p style={{ fontSize: "9pt", color: "var(--muted-foreground)", marginTop: "20mm" }}>
        Généré avec École 2.0 · Programme Officiel DEMSG Sénégal
      </p>
      <div style={{ marginTop: "24mm", borderTop: "1px solid #e5e7eb", paddingTop: "6px",
                    display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: "8pt", color: "#9ca3af" }}>École 2.0 — plateforme de gestion scolaire</span>
        <span style={{ fontSize: "8pt", color: "#9ca3af" }}>{doc.date}</span>
      </div>
    </div>
  );
}

// ─── Preview modal — full-screen mobile-friendly overlay ──────────────────────

function PreviewModal({
  doc, onClose, onPrint,
}: { doc: Document; onClose: () => void; onPrint: () => void }) {
  const typeColor: Record<DocType, string> = {
    fiche: "var(--accent-foreground)", bulletin: "var(--secondary)", planning: "var(--primary)",
  };
  const color = typeColor[doc.type];

  return (
    <div
      className="fixed inset-0 z-[500] flex flex-col"
      style={{ backgroundColor: "var(--background)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Header bar */}
      <div className="bg-white flex-shrink-0 flex items-center gap-3 px-4 py-3"
           style={{ boxShadow: "0 1px 0 #e5e7eb, 0 2px 8px rgba(0,0,0,0.06)", zIndex: 10 }}>
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-xl transition-all active:scale-95"
          style={{ width: 36, height: 36, backgroundColor: "var(--muted)" }}
        >
          <X style={{ width: 18, height: 18, color: "var(--muted-foreground)" }} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate" style={{ fontSize: "13px", color: "var(--primary)" }}>
            {doc.title}
          </p>
          <p style={{ fontSize: "10px", color: "var(--muted-foreground)" }}>{doc.badge} · {doc.date}</p>
        </div>
        <button
          onClick={onPrint}
          className="flex items-center gap-1.5 rounded-xl font-bold transition-all active:scale-95"
          style={{ minHeight: 36, padding: "0 14px", fontSize: "12px",
                   backgroundColor: "var(--primary)", color: "#fff" }}
        >
          <Printer style={{ width: 14, height: 14 }} />
          Imprimer
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto p-4 lg:p-8">
        <div
          className="bg-white mx-auto"
          style={{
            maxWidth: "794px",
            padding: "28px 32px",
            boxShadow: "0 4px 32px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
            fontFamily: "Arial, Helvetica, sans-serif",
            borderRadius: "2px",
          }}
        >
          {/* Institution header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                        borderBottom: "2px solid var(--primary)", paddingBottom: "8px", marginBottom: "12px" }}>
            <div>
              <p style={{ fontSize: "8px", color: "var(--muted-foreground)", margin: 0, lineHeight: 1.4 }}>
                IA : Inspection Académique de Kolda
              </p>
              <p style={{ fontSize: "8px", color: "var(--muted-foreground)", margin: 0, lineHeight: 1.4 }}>
                IEF : Inspection de l'Éducation et de la Formation de Kolda
              </p>
              <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
                École : Ilyaou Mamadou SEYDI
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "10px", fontWeight: 800, color: "var(--primary)",
                          textTransform: "uppercase", margin: 0, lineHeight: 1.4 }}>
                République du Sénégal
              </p>
              <p style={{ fontSize: "8px", color: "var(--muted-foreground)", margin: 0 }}>Un Peuple – Un But – Une Foi</p>
              <p style={{ fontSize: "8px", color: "var(--muted-foreground)", margin: 0 }}>Année 2025–2026</p>
            </div>
          </div>

          {/* Document type badge */}
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            padding: "3px 12px", borderRadius: "999px", fontSize: "9px",
            fontWeight: 700, backgroundColor: doc.badgeBg, color: doc.badgeColor,
            border: `1px solid ${doc.badgeColor}30`, marginBottom: "10px",
          }}>
            {doc.badge}
          </span>

          {/* Title block */}
          <p style={{ fontSize: "15pt", fontWeight: 800, color: color,
                      textTransform: "uppercase", letterSpacing: "0.05em",
                      margin: "0 0 4px" }}>
            {doc.title}
          </p>
          <p style={{ fontSize: "11pt", color: "var(--muted-foreground)", margin: "0 0 2px" }}>
            {doc.subtitle}
          </p>
          <p style={{ fontSize: "9pt", color: "var(--muted-foreground)", margin: "0 0 20px" }}>
            {doc.meta} · {doc.date}
          </p>

          {/* Meta table */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px",
                          fontSize: "10pt" }}>
            <thead>
              <tr style={{ backgroundColor: color }}>
                {["Référence", "Détail"].map(h => (
                  <th key={h} style={{ padding: "6px 10px", textAlign: "left",
                                       color: "#fff", fontWeight: 700, fontSize: "9pt",
                                       letterSpacing: "0.04em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Niveau / Classe", doc.subtitle],
                ["Informations",    doc.meta],
                ["Date générée",    doc.date],
                ["Type",            doc.badge],
              ].map(([k, v], i) => (
                <tr key={k} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                  <td style={{ padding: "6px 10px", fontWeight: 600, color: "#374151",
                               borderBottom: "1px solid #e5e7eb", fontSize: "9pt" }}>{k}</td>
                  <td style={{ padding: "6px 10px", color: "#111827",
                               borderBottom: "1px solid #e5e7eb", fontSize: "9pt" }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "8px",
                        display: "flex", justifyContent: "space-between" }}>
            <p style={{ fontSize: "8pt", color: "#9ca3af", margin: 0 }}>
              Généré avec École 2.0 · Programme officiel DEMSG Sénégal
            </p>
            <p style={{ fontSize: "8pt", color: "#9ca3af", margin: 0 }}>
              Aperçu — {new Date().toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DocCard ──────────────────────────────────────────────────────────────────

function DocCard({
  doc, onPreview, onPrint, onDelete, isDeleting,
  onStartEdit, isEditing, editValue, onEditChange, onEditSave,
  ownerClassId,
}: {
  doc: Document;
  onPreview: () => void;
  onPrint: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  onStartEdit?: () => void;
  isEditing?: boolean;
  editValue?: string;
  onEditChange?: (v: string) => void;
  onEditSave?: () => void;
  ownerClassId: string;
}) {
  const tone = DOC_TONES[doc.type];
  return (
    <div className="bg-white rounded-2xl overflow-hidden transition-all hover:shadow-md"
         style={{ boxShadow: "0 1px 8px rgba(26,54,93,0.08)" }}>
      <div className="flex">
        {/* Accent bar */}
        <div className="w-[4px] shrink-0" style={{ backgroundColor: tone.accentBar }} />
        <div className="flex-1 min-w-0 p-3 lg:p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 rounded-full text-[9px] font-bold uppercase tracking-wide px-2 py-0.5"
                  style={{ backgroundColor: doc.badgeBg, color: doc.badgeColor }}>
              {TYPE_ICON[doc.type]}
              {doc.badge}
            </span>
            <span className="text-[10px] text-gray-400 shrink-0">{doc.date}</span>
          </div>

          {/* Title — switches to input when editing */}
          {isEditing ? (
            <div className="flex items-center gap-1.5 mb-0.5">
              <input
                autoFocus
                type="text"
                value={editValue}
                onChange={e => onEditChange?.(e.target.value)}
                onBlur={() => onEditSave?.()}
                onKeyDown={e => { if (e.key === "Enter") onEditSave?.(); if (e.key === "Escape") onEditSave?.(); }}
                className="flex-1"
                style={{
                  padding:"3px 8px", borderRadius:"6px", fontSize:"12.5px",
                  fontWeight:700, color:"var(--primary)", border:"1.5px solid var(--secondary)",
                  outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif",
                  minWidth:0,
                }}
              />
              <button onClick={() => onEditSave?.()} title="Valider"
                      style={{ border:"none", background:"none", cursor:"pointer",
                               color:"var(--secondary)", padding:"2px", flexShrink:0 }}>
                <Check style={{ width:14, height:14 }} />
              </button>
            </div>
          ) : (
            <p className="font-bold text-primary leading-snug mb-0.5"
               style={{ fontSize: "12.5px" }}>
              {doc.title}
            </p>
          )}
          <p className="text-[11px] text-[var(--foreground)] mb-0.5">{doc.subtitle}</p>
          <p className="text-[10px] text-[var(--muted-foreground)]">{doc.meta}</p>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {/*
              PermissionGuard: Modifier and Supprimer are only shown to
              the teacher who owns this class (or a director).
            */}
            <PermissionGuard ownerClassId={ownerClassId} silent>
              {/* Blue edit pencil — inline title edit */}
              {onStartEdit && !isEditing && (
                <button
                  onClick={onStartEdit}
                  title="Modifier le titre"
                  className="inline-flex items-center gap-1 rounded-lg text-[10px] font-semibold transition-all active:scale-95"
                  style={{ padding:"6px 10px", backgroundColor:"var(--accent)", color:"var(--secondary)" }}>
                  <Pencil className="w-3 h-3" />Modifier
                </button>
              )}
            </PermissionGuard>
            <button
              onClick={onPreview}
              className="inline-flex items-center gap-1 rounded-lg text-[10px] font-semibold transition-all active:scale-95 hover:bg-accent"
              style={{ padding: "6px 12px", backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}
            >
              <Eye className="w-3 h-3" />Aperçu
            </button>
            <button
              onClick={onPrint}
              className="inline-flex items-center gap-1 rounded-lg text-[10px] font-semibold transition-all active:scale-95 hover:bg-accent"
              style={{ padding: "6px 12px", backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}
            >
              <Printer className="w-3 h-3" />Imprimer
            </button>
            <button
              onClick={onPrint}
              className="inline-flex items-center gap-1 rounded-lg text-[10px] font-semibold transition-all active:scale-95"
              style={{ padding: "6px 12px", backgroundColor: "var(--primary)", color: "#fff",
                       boxShadow: "0 2px 6px color-mix(in srgb, var(--primary) 22%, transparent)" }}
            >
              <Download className="w-3 h-3" />PDF
            </button>
            {/* Delete button — gated by PermissionGuard */}
            {onDelete && (
              <PermissionGuard ownerClassId={ownerClassId} silent>
                <button
                  onClick={onDelete}
                  disabled={isDeleting}
                  title={isDeleting ? "Suppression en cours…" : "Supprimer définitivement"}
                  className="inline-flex items-center gap-1 rounded-lg text-[10px] font-semibold transition-all active:scale-95 ml-auto"
                  style={{
                    padding: "6px 10px",
                    backgroundColor: isDeleting ? "var(--muted)" : "color-mix(in srgb, var(--destructive) 10%, var(--background))",
                    color: isDeleting ? "var(--muted-foreground)" : "var(--destructive)",
                    cursor: isDeleting ? "not-allowed" : "pointer",
                  }}
                >
                  {isDeleting
                    ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    : <Trash2 className="w-3 h-3" />
                  }
                </button>
              </PermissionGuard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AddDocumentModal ─────────────────────────────────────────────────────────

const DOC_TYPE_OPTIONS: { key: DocType; label: string; color: string; bg: string }[] = [
  { key:"fiche",    label:"Fiche Pédagogique", color:"#1d4ed8", bg:"#dbeafe" },
  { key:"bulletin", label:"Bulletin de Notes", color:"#065f46", bg:"#d1fae5" },
  { key:"planning", label:"Planning",          color:"#1a365d", bg:"#e0e7ff" },
];

function AddDocumentModal({
  open, onClose, onSave,
}: {
  open:    boolean;
  onClose: () => void;
  onSave:  (meta: Pick<Document, "type"|"title"|"subtitle"|"meta">, file?: File) => Promise<void>;
}) {
  const [type,     setType]     = useState<DocType>("fiche");
  const [title,    setTitle]    = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [meta,     setMeta]     = useState("");
  const [file,     setFile]     = useState<File | null>(null);
  const [saving,   setSaving]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({ type, title, subtitle, meta }, file ?? undefined);
      setTitle(""); setSubtitle(""); setMeta(""); setFile(null);
      onClose();
    } finally { setSaving(false); }
  };

  if (!open) return null;

  const cfg = DOC_TYPE_OPTIONS.find(o => o.key === type)!;
  const inp: React.CSSProperties = {
    width:"100%", padding:"9px 12px", borderRadius:"10px",
    border:"1.5px solid #e2e8f0", fontSize:"13px",
    fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none",
    backgroundColor:"#fff", color:"#1a365d",
  };
  const lbl: React.CSSProperties = {
    fontSize:"10px", fontWeight:700, color:"#64748b",
    textTransform:"uppercase", letterSpacing:"0.06em",
    display:"block", marginBottom:"4px",
  };

  return (
    <>
      <div className="fixed inset-0 z-[450]"
           style={{ backgroundColor:"rgba(0,0,0,0.45)" }}
           onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[460] bg-white"
           style={{ borderRadius:"20px 20px 0 0", maxHeight:"90vh",
                    display:"flex", flexDirection:"column",
                    boxShadow:"0 -8px 40px rgba(0,0,0,0.18)",
                    fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px" }}>
          <div style={{ width:36, height:4, borderRadius:999, backgroundColor:"#e2e8f0" }} />
        </div>
        <div className="flex items-center justify-between px-5 pb-3"
             style={{ borderBottom:"1px solid #f1f5f9" }}>
          <div>
            <p style={{ fontSize:"17px", fontWeight:800, color:"#1a365d", margin:0 }}>
              Ajouter un document
            </p>
            <p style={{ fontSize:"11px", color:"#94a3b8", margin:0 }}>Le titre est obligatoire.</p>
          </div>
          <button onClick={onClose}
                  style={{ width:32, height:32, borderRadius:"50%", backgroundColor:"#f1f5f9",
                           display:"flex", alignItems:"center", justifyContent:"center",
                           border:"none", cursor:"pointer" }}>
            <X style={{ width:16, height:16, color:"#475569" }} />
          </button>
        </div>

        <form onSubmit={handleSubmit}
              style={{ overflowY:"auto", flex:1, padding:"16px 20px 24px",
                       display:"flex", flexDirection:"column", gap:"14px" }}>
          {/* Type selector */}
          <div>
            <label style={lbl}>Type de document</label>
            <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
              {DOC_TYPE_OPTIONS.map(o => (
                <button key={o.key} type="button" onClick={() => setType(o.key)}
                        style={{
                          padding:"6px 14px", borderRadius:"999px", fontWeight:700,
                          fontSize:"11px", cursor:"pointer", border:"1.5px solid",
                          backgroundColor: type===o.key ? o.color : "#f8fafc",
                          color:           type===o.key ? "#fff"   : "#475569",
                          borderColor:     type===o.key ? o.color  : "#e2e8f0",
                        }}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={lbl}>Titre *</label>
            <input style={inp} value={title}
                   onChange={e => setTitle(e.target.value)}
                   placeholder="ex : Activités Numériques — Séance 1" required />
          </div>

          {/* Subtitle */}
          <div>
            <label style={lbl}>Sous-titre</label>
            <input style={inp} value={subtitle}
                   onChange={e => setSubtitle(e.target.value)}
                   placeholder="ex : Mathématiques · CE2" />
          </div>

          {/* Meta */}
          <div>
            <label style={lbl}>Informations complémentaires</label>
            <input style={inp} value={meta}
                   onChange={e => setMeta(e.target.value)}
                   placeholder="ex : OA1 · OS1.2 · 45 min" />
          </div>

          {/* File upload */}
          <div>
            <label style={lbl}>Fichier PDF (optionnel)</label>
            <div style={{
                   padding:"12px", borderRadius:"10px", cursor:"pointer",
                   border:`1.5px dashed ${file ? cfg.color : "#e2e8f0"}`,
                   backgroundColor: file ? cfg.bg : "#f8fafc",
                   display:"flex", alignItems:"center", gap:"10px",
                 }}
                 onClick={() => fileRef.current?.click()}>
              <Upload style={{ width:16, height:16, color: file ? cfg.color : "#94a3b8", flexShrink:0 }}/>
              <p style={{ margin:0, fontSize:"12px",
                          color: file ? cfg.color : "#94a3b8", fontWeight:600 }}>
                {file ? file.name : "Cliquez pour choisir un fichier PDF"}
              </p>
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.html,.docx"
                   style={{ display:"none" }}
                   onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </div>

          {/* Submit */}
          <button type="submit" disabled={saving || !title.trim()}
                  style={{
                    minHeight:"48px", borderRadius:"14px", fontWeight:800,
                    fontSize:"14px", border:"none",
                    cursor: saving || !title ? "not-allowed" : "pointer",
                    backgroundColor: title.trim() ? cfg.color : "#94a3b8",
                    color:"#fff",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
                    boxShadow: title.trim() ? `0 4px 14px ${cfg.color}44` : "none",
                  }}>
            {saving
              ? <><Loader2 style={{ width:16, height:16 }} className="animate-spin"/>Enregistrement…</>
              : <><Plus style={{ width:16, height:16 }}/>Ajouter le document</>}
          </button>
        </form>
      </div>
    </>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function DocumentsScreen() {
  const navigate               = useNavigate();
  const { loading, blocked, skip } = useProfileGuard();
  const { activeClass }         = useAppContext();
  const [filter,     setFilter]     = useState<Filter>("all");
  const [search,     setSearch]     = useState("");
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [showAddDoc, setShowAddDoc] = useState(false);

  // ── Inline title editing ───────────────────────────────────────────────────
  const [editingDocId,    setEditingDocId]    = useState<string | null>(null);
  const [editingDocTitle, setEditingDocTitle] = useState("");

  const startDocEdit = useCallback((doc: Document) => {
    setEditingDocId(doc.id);
    setEditingDocTitle(doc.title);
  }, []);

  // ── Live Supabase data (React Query) with mock fallback ────────────────────
  // useDocumentsQuery: cache + background refresh + loading guard on delete
  // No mock fallback: Supabase is the single source of truth (P1.4).
  const { documents: liveDocuments, deleteDocument, deletingId, uploadDocument, updateDocument } = useDocumentsQuery([]);
  // Cast back so the rest of the component keeps its Document type
  const allDocs = liveDocuments as unknown as Document[];

  const saveDocEdit = useCallback(async (doc: Document) => {
    if (editingDocTitle.trim() && editingDocTitle !== doc.title && doc.id) {
      await updateDocument(doc.id, { title: editingDocTitle.trim() });
    }
    setEditingDocId(null);
  }, [editingDocTitle, updateDocument]);

  // ── Delete-with-Undo for documents (5-second window) ──────────────────────
  const [pendingDeleteDocIds, setPendingDeleteDocIds] = useState<Set<string>>(new Set());

  const handleDocDeleteWithUndo = useCallback((doc: Document) => {
    setPendingDeleteDocIds(prev => new Set(prev).add(doc.id));
    let undone = false;
    const timer = setTimeout(async () => {
      if (!undone) {
        await deleteDocument(doc as unknown as DocumentRow);
      }
    }, 5000);
    toast.success(`« ${doc.title} » supprimé.`, {
      duration: 5000,
      action: {
        label:   "ANNULER",
        onClick: () => {
          undone = true;
          clearTimeout(timer);
          setPendingDeleteDocIds(prev => { const n = new Set(prev); n.delete(doc.id); return n; });
          toast("Suppression annulée ✓", { duration: 2000 });
        },
      },
    });
  }, [deleteDocument]);
  const { printDoc, triggerPrint }  = usePrintDoc();

  const handlePrint = useCallback((doc: Document) => {
    triggerPrint(doc);
  }, [triggerPrint]);

  // ── Delete — confirmation + loading guard via useDocumentsQuery ────────────
  const handleDelete = useCallback(async (doc: Document) => {
    await deleteDocument(doc as unknown as DocumentRow);
  }, [deleteDocument]);

  // ── Add document handler ───────────────────────────────────────────────────
  const handleAddDoc = useCallback(async (
    meta: Pick<Document, "type"|"title"|"subtitle"|"meta">,
    file?: File,
  ) => {
    if (file) {
      await uploadDocument({ file, meta: meta as Omit<DocumentRow, "id"|"created_at"|"file_path"|"class_id"> });
    } else {
      await (documentsApi as any).create({ ...meta, class_id: activeClass });
    }
  }, [uploadDocument, activeClass]);

  const filtered = useMemo(() => {
    let docs = filter === "all" ? allDocs : allDocs.filter(d => d.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      docs = docs.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.subtitle.toLowerCase().includes(q) ||
        d.meta.toLowerCase().includes(q)
      );
    }
    return docs;
  }, [filter, search, allDocs]);

  const fiches    = allDocs.filter(d => d.type === "fiche");
  const bulletins = allDocs.filter(d => d.type === "bulletin");
  const planning  = allDocs.filter(d => d.type === "planning");

  const tabs: { key: Filter; label: string; count: number; icon: React.ReactNode }[] = [
    { key:"all",      label:"Tous",      count: allDocs.length,    icon:<Filter className="w-3.5 h-3.5"/> },
    { key:"fiche",    label:"Fiches",    count: fiches.length,     icon:<BookOpen className="w-3.5 h-3.5"/> },
    { key:"bulletin", label:"Bulletins", count: bulletins.length,  icon:<FileText className="w-3.5 h-3.5"/> },
    { key:"planning", label:"Planning",  count: planning.length,   icon:<Calendar className="w-3.5 h-3.5"/> },
  ];

  if (loading) return <ProfileGuardLoader loading />;
  if (blocked) return <ProfileGuardLoader blocked onSkip={skip} />;

  return (
    <>
      {/* ── Add Document Modal ── */}
      <AddDocumentModal
        open={showAddDoc}
        onClose={() => setShowAddDoc(false)}
        onSave={handleAddDoc as any}
      />

      {/* ── Print isolation CSS — hides everything except the portal in print ── */}
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        @media print {
          body.ecole-printing > *:not(#ecole-print-portal) { display: none !important; }
          #ecole-print-portal { display: block !important; padding-top: 15mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        #ecole-print-portal { display: none; }
        body.ecole-printing #ecole-print-portal { display: block; }
      `}</style>

      {/* ── Print portal — rendered in main DOM, isolated via class ── */}
      {printDoc && <DocPrintPortal doc={printDoc} />}

      {/* ── Full-screen preview modal ── */}
      {previewDoc && (
        <PreviewModal
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
          onPrint={() => { setPreviewDoc(null); handlePrint(previewDoc); }}
        />
      )}

      <div className="bg-background flex flex-col overflow-hidden"
           style={{ height: "calc(100vh - 36px)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>

        {/* ── STICKY HEADER ─────────────────────────────────────────────────── */}
        <div className="bg-white flex-shrink-0"
             style={{ boxShadow: "0 1px 0 #e5e7eb, 0 2px 8px rgba(0,0,0,0.06)", zIndex: 50 }}>
          <div className="max-w-5xl mx-auto px-4 lg:px-6">

            {/* Nav row */}
            <div className="flex items-center gap-3 pt-3 pb-2">
              <button onClick={() => navigate("/")}
                className="inline-flex items-center gap-1.5 font-semibold text-primary hover:text-secondary transition-colors shrink-0"
                style={{ fontSize: "13px", minHeight: "40px" }}>
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Accueil</span>
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-[#1a365d] truncate" style={{ fontSize: "15px" }}>
                  Documents générés — Archive
                </h1>
                <p className="text-gray-400 mt-0.5 hidden sm:block" style={{ fontSize: "10px" }}>
                  École Ilyaou Mamadou SEYDI · CE2 · 2025–2026
                </p>
              </div>
              {/* ── FAB "Ajouter un document" ── */}
              <button
                onClick={() => setShowAddDoc(true)}
                className="inline-flex items-center gap-1.5 rounded-xl font-bold transition-all active:scale-95 shrink-0"
                title="Ajouter un document"
                style={{ minHeight:"36px", padding:"0 12px", fontSize:"12px",
                         backgroundColor:"#3182ce", color:"#fff",
                         boxShadow:"0 2px 8px rgba(49,130,206,0.30)" }}>
                <Plus className="w-4 h-4 shrink-0"/>
                <span className="hidden sm:inline">Ajouter</span>
              </button>

              {/* Total count */}
              <div className="hidden sm:flex items-center gap-1 shrink-0 rounded-full px-3 py-1"
                   style={{ backgroundColor: "var(--muted)" }}>
                <FileText className="w-3.5 h-3.5 text-[#64748b]" />
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted-foreground)" }}>
                  {ALL_DOCS.length} docs
                </span>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-0.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setFilter(t.key)}
                  className="inline-flex items-center gap-1.5 shrink-0 font-semibold transition-all"
                  style={{
                    minHeight: "40px", padding: "0 12px", fontSize: "12px",
                    borderBottom: `2px solid ${filter === t.key ? "#1a365d" : "transparent"}`,
                    color: filter === t.key ? "#1a365d" : "#64748b",
                    backgroundColor: "transparent",
                  }}>
                  {t.icon}
                  <span className="hidden sm:inline">{t.label}</span>
                  <span
                    className="inline-flex items-center justify-center rounded-full font-bold min-w-[18px]"
                    style={{ fontSize: "9px", padding: "1px 5px",
                             backgroundColor: filter === t.key ? "#1a365d" : "#e5e7eb",
                             color: filter === t.key ? "#fff" : "#64748b" }}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── CONTENT ───────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-4 lg:px-6 py-4">

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label:"Fiches pédagogiques", value: MOCK_FICHES.length,    color:"#6d28d9", bg:"#ede9fe" },
                { label:"Bulletins de notes",  value: MOCK_BULLETINS.length, color:"#065f46", bg:"#d1fae5" },
                { label:"Tableaux de planning",value: MOCK_PLANNING.length,  color:"#1a365d", bg:"#dbeafe" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl p-3 text-center"
                     style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                  <p className="font-black" style={{ fontSize: "22px", color: s.color }}>{s.value}</p>
                  <p className="font-semibold leading-tight"
                     style={{ fontSize: "9px", color: "var(--muted-foreground)" }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Search — A06 fix: label sr-only + type="search" */}
            <div className="relative mb-4">
              <label
                htmlFor="docs-search"
                className="sr-only"
              >
                Rechercher un document
              </label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                      aria-hidden="true" />
              <input
                id="docs-search"
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un document…"
                className="w-full rounded-xl outline-none font-medium"
                style={{
                  minHeight: "42px", padding: "0 12px 0 38px",
                  fontSize: "13px", border: "1.5px solid var(--border)",
                  backgroundColor: "var(--card)", fontFamily: "'Plus Jakarta Sans',sans-serif",
                }}
              />
            </div>

            {/* "All" — grouped view */}
            {filter === "all" && !search.trim() ? (
              <div className="space-y-6">
                {[
                  { label:"Tableaux de planification", docs: MOCK_PLANNING, icon: <Calendar className="w-4 h-4 text-[#1a365d]" />, count: MOCK_PLANNING.length },
                  { label:"Fiches pédagogiques",       docs: MOCK_FICHES,   icon: <BookOpen className="w-4 h-4 text-[#6d28d9]" />, count: MOCK_FICHES.length },
                  { label:"Bulletins de notes",        docs: MOCK_BULLETINS,icon: <FileText className="w-4 h-4 text-[#065f46]" />, count: MOCK_BULLETINS.length, suffix:" / 25 total" },
                ].map(section => (
                  <section key={section.label}>
                    <div className="flex items-center gap-2 mb-2">
                      {section.icon}
                      <h2 className="font-bold text-[#1a365d]" style={{ fontSize: "13px" }}>
                        {section.label}
                      </h2>
                      <span className="ml-auto text-[10px] text-gray-400">
                        {section.count} document{section.count > 1 ? "s" : ""}{section.suffix ?? ""}
                      </span>
                    </div>
                    {/* Desktop: 2-column grid; Mobile: single column */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-3">
                      {section.docs.filter(d => !pendingDeleteDocIds.has(d.id)).map(d => (
                        <DocCard
                          key={d.id}
                          doc={d}
                          onPreview={() => setPreviewDoc(d)}
                          onPrint={() => handlePrint(d)}
                          onDelete={() => handleDocDeleteWithUndo(d)}
                          isDeleting={deletingId === d.id}
                          onStartEdit={() => startDocEdit(d)}
                          isEditing={editingDocId === d.id}
                          editValue={editingDocId === d.id ? editingDocTitle : d.title}
                          onEditChange={setEditingDocTitle}
                          onEditSave={() => saveDocEdit(d)}
                          ownerClassId={activeClass}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              /* Filtered / search result — flat list */
              <div>
                {filtered.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-gray-400 font-semibold" style={{ fontSize: "14px" }}>
                      Aucun document trouvé
                    </p>
                    <p className="text-gray-300 mt-1" style={{ fontSize: "12px" }}>
                      Essayez un autre terme de recherche
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
                        {filtered.length} document{filtered.length > 1 ? "s" : ""}
                        {filter !== "all" ? ` · ${TYPE_LABEL[filter as DocType]}` : " · Résultats"}
                      </p>
                      {search.trim() && (
                        <button
                          onClick={() => setSearch("")}
                          className="text-[10px] font-semibold text-[#3182ce] flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />Effacer
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-3">
                      {filtered.filter(d => !pendingDeleteDocIds.has(d.id)).map(d => (
                        <DocCard
                          key={d.id}
                          doc={d}
                          onPreview={() => setPreviewDoc(d)}
                          onPrint={() => handlePrint(d)}
                          onDelete={() => handleDocDeleteWithUndo(d)}
                          isDeleting={deletingId === d.id}
                          onStartEdit={() => startDocEdit(d)}
                          isEditing={editingDocId === d.id}
                          editValue={editingDocId === d.id ? editingDocTitle : d.title}
                          onEditChange={setEditingDocTitle}
                          onEditSave={() => saveDocEdit(d)}
                          ownerClassId={activeClass}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Bottom spacer */}
            <div className="h-8" />
          </div>
        </div>
      </div>
    </>
  );
}
