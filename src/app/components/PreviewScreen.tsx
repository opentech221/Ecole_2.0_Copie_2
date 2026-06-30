import React, { useState, useLayoutEffect, useRef } from "react";
import { useNavigate, useLocation }                  from "react-router";
import { useAppContext }                              from "../contexts/AppContext";
import { useProfileGuard }                           from "../../hooks/useProfileGuard";
import { ProfileGuardLoader }                        from "./ProfileGuardLoader";
import {
  ArrowLeft, Download, Printer, Share2, Check,
  Maximize2, Minimize2, WifiOff, FileDown, ChevronDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FicheState {
  cells:     Record<string, string>;
  oo:        string;
  ooVariant: number;
  matSel:    string[];
  pedSel:    string[];
  duree:     string;
}

const PHASES = [
  "Imprégnation / Mise en situation",
  "Phase Concrète",
  "Phase Semi-concrète",
  "Phase Abstraite / Fixation",
  "Évaluation formative",
] as const;

const SEQ_COLORS = [
  "#e11d48","#d97706","#0d9488","#7c3aed",
  "#2563eb","#059669","#ea580c","#a21caf",
];

const pad = (n: number) => String(n + 1).padStart(2, "0");
const A4_W = 794;
const A4_H = 1123;

// ─── MetaRow ──────────────────────────────────────────────────────────────────

function MetaRow({ label, value, highlight }: {
  label: string; value: string; highlight?: boolean;
}) {
  if (!value) return null;
  return (
    <div style={{ display:"flex", marginBottom:"4px", alignItems:"flex-start" }}>
      <span style={{ fontWeight:700, fontSize:"10pt", color:"#374151",
                     minWidth:"195px", flexShrink:0 }}>
        {label}&nbsp;:
      </span>
      <span style={{ fontSize:"10pt", lineHeight:1.5,
                     color:      highlight ? "#1e3a8a" : "#111827",
                     fontWeight: highlight ? 700       : 400 }}>
        {value}
      </span>
    </div>
  );
}

// ─── A4 Document — single fiche ───────────────────────────────────────────────
// Always receives a flat array of ONE contenu (tab mode) or ALL (merged mode).
// The `fiches` array is sliced accordingly by the caller.

function A4Document({
  ecole, dateHeure, niveau, palier, duree, domaine, sousDomaine,
  discipline, competence, oa, os, contenus, oo, merged,
  fiches, mergedFiche,
  ief = "Dakar-Plateau",
  enseignant = "M. Ba",
  ficheLabel,
  matSel = [],
  pedSel = [],
}: {
  ecole: string; dateHeure: string; niveau: string; palier: string; duree: string;
  domaine: string; sousDomaine: string; discipline: string; competence: string;
  oa: string; os: string; contenus: string[]; oo: string;
  merged: boolean; fiches: FicheState[]; mergedFiche: FicheState;
  ief?: string; enseignant?: string; ficheLabel?: string;
  matSel?: string[]; pedSel?: string[];
}) {
  function cell(ci: number, pi: number, col: "m" | "e") {
    if (merged) return mergedFiche.cells[`${ci}-${pi}-${col}`] ?? "";
    return fiches[ci]?.cells[`${pi}-${col}`] ?? "";
  }

  const datePart = dateHeure.includes("·")
    ? dateHeure.split("·")[0].trim()
    : dateHeure;

  return (
    <div
      className="a4-doc"
      style={{
        width:           `${A4_W}px`,
        minHeight:       `${A4_H}px`,
        backgroundColor: "#fff",
        padding:         "38px",          // 10mm at 96dpi
        boxSizing:       "border-box",
        fontFamily:      "Arial, Helvetica, sans-serif",
        color:           "#111827",
        display:         "block",
        overflow:        "visible",
      }}
    >
      {/* ── OFFICIAL HEADER ──────────────────────────────────────── */}

      {/* 1. Central institutional block */}
      <div style={{ textAlign:"center", marginBottom:"10px" }}>
        <p style={{ fontWeight:700, fontSize:"12pt", color:"#111827",
                    textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 3px" }}>
          RÉPUBLIQUE DU SÉNÉGAL
        </p>
        <p style={{ fontSize:"11pt", fontWeight:500, color:"#374151",
                    margin:0, letterSpacing:"0.01em" }}>
          Inspection de l'Éducation et de la Formation de&nbsp;: <em>{ief}</em>
        </p>
      </div>

      {/* 2. Bilateral administrative block */}
      <div style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"flex-start", marginBottom:"0" }}>
        <div>
          <p style={{ fontSize:"10.5pt", color:"#111827", margin:"0 0 3px", lineHeight:1.4 }}>
            École&nbsp;: <strong>{ecole}</strong>
          </p>
          <p style={{ fontSize:"10.5pt", color:"#111827", margin:0, lineHeight:1.4 }}>
            Classe&nbsp;: <strong>{niveau}</strong>
          </p>
        </div>
        <div style={{ textAlign:"right" }}>
          <p style={{ fontSize:"10.5pt", color:"#111827", margin:"0 0 3px", lineHeight:1.4 }}>
            Date&nbsp;: <strong>{datePart}</strong>
            {duree && <>&nbsp;&nbsp;|&nbsp;&nbsp;Durée&nbsp;: <strong>{duree}</strong></>}
          </p>
          <p style={{ fontSize:"10.5pt", color:"#374151", margin:0,
                      fontStyle:"italic", lineHeight:1.4 }}>
            Enseignant&nbsp;: {enseignant}
          </p>
        </div>
      </div>

      {/* 3. Full-width divider */}
      <div style={{ borderBottom:"2px solid #111827", marginTop:"10px", marginBottom:"16px" }}/>

      {/* ── DOCUMENT TITLE ──────────────────────────────────────── */}
      <div style={{ textAlign:"center", marginBottom:"16px" }}>
        <p style={{ fontSize:"13pt", fontWeight:700, color:"#1a365d",
                    letterSpacing:"0.06em", textTransform:"uppercase", margin:"0 0 3px" }}>
          FICHE DE PRÉPARATION
        </p>
        <p style={{ fontSize:"8.5pt", color:"#6b7280", margin:0 }}>
          Approche Par les Compétences (APC) — Programme Officiel DEMSG
        </p>
      </div>

      {/* ── PEDAGOGICAL METADATA ────────────────────────────────── */}
      <div style={{ backgroundColor:"#f9fafb", border:"1px solid #e5e7eb",
                    borderRadius:"5px", padding:"12px 14px", marginBottom:"14px" }}>
        <MetaRow label="Domaine"                   value={domaine}/>
        <MetaRow label="Sous-domaine · Discipline" value={[sousDomaine,discipline].filter(Boolean).join(" · ")}/>
        <MetaRow label="Compétence de Base (CB)"   value={competence} highlight/>
        <MetaRow label="Palier"                    value={palier}/>
        {oa && <MetaRow label="Objectif d'Apprentissage (OA)" value={oa}/>}
        <MetaRow label="Objectif Spécifique (OS)"  value={os} highlight/>
        {/* ── Resources — flat comma-separated lists ── */}
        {matSel.length > 0 && (
          <MetaRow label="Moyens Matériels" value={matSel.join(", ")}/>
        )}
        {pedSel.length > 0 && (
          <MetaRow label="Moyens Pédagogiques" value={pedSel.join(", ")}/>
        )}
        <div style={{ marginTop:"8px" }}>
          <span style={{ fontWeight:700, fontSize:"10pt", color:"#374151" }}>
            Contenu / Objet de la leçon&nbsp;:
          </span>
          <div style={{ marginTop:"5px", display:"flex", flexWrap:"wrap", gap:"5px" }}>
            {contenus.map((c,i) => (
              <span key={i} style={{
                display:"inline-flex", alignItems:"center", gap:"3px",
                fontSize:"9pt", fontWeight:600,
                padding:"2px 9px", borderRadius:"999px",
                backgroundColor: SEQ_COLORS[i%SEQ_COLORS.length]+"18",
                color:           SEQ_COLORS[i%SEQ_COLORS.length],
                border:         `1px solid ${SEQ_COLORS[i%SEQ_COLORS.length]}40`,
              }}>
                <span style={{ opacity:0.55, fontWeight:700 }}>{pad(i)}.</span>{c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── OBJECTIF OPÉRATIONNEL ───────────────────────────────── */}
      {oo && (
        <div style={{ border:"1.5px solid #374151", borderRadius:"5px",
                      marginBottom:"16px", overflow:"hidden",
                      pageBreakInside:"avoid", breakInside:"avoid" }}>
          <div style={{ backgroundColor:"#1a365d", padding:"7px 13px",
                        display:"flex", alignItems:"center", gap:"10px" }}>
            <span style={{ fontSize:"9.5pt", fontWeight:700, color:"#fff",
                           letterSpacing:"0.05em", textTransform:"uppercase" }}>
              Objectif Opérationnel (OO)
            </span>
            <span style={{ fontSize:"8pt", color:"rgba(255,255,255,0.6)" }}>
              · Critère terminal d'évaluation
            </span>
          </div>
          <div style={{ padding:"11px 13px", backgroundColor:"#f9fafb" }}>
            <p style={{ fontSize:"10.5pt", lineHeight:1.65, color:"#111827",
                        fontStyle:"italic", margin:0 }}>
              {oo}
            </p>
          </div>
        </div>
      )}

      {/* ── DÉROULEMENT TABLE ───────────────────────────────────── */}
      <p style={{ fontSize:"10pt", fontWeight:700, color:"#1a365d",
                  textTransform:"uppercase", letterSpacing:"0.06em",
                  margin:"0 0 8px" }}>
        Déroulement de la Séance
      </p>

      <table style={{ width:"100%", borderCollapse:"collapse",
                      fontSize:"9.5pt", lineHeight:1.55 }}>
        <thead>
          <tr>
            {(["Étapes de la leçon","Activités du Maître","Activités des Élèves"] as const)
              .map((col,i) => (
                <th key={col} style={{
                  backgroundColor: i===0?"#1a365d":i===1?"#1e4976":"#234f7e",
                  color:"#fff", fontWeight:700, fontSize:"8.5pt",
                  textTransform:"uppercase", letterSpacing:"0.04em",
                  padding:"6px 9px", textAlign:"left",
                  border:"1px solid #1a365d",
                  width: i===0?"22%":"39%",
                }}>
                  {col}
                </th>
              ))}
          </tr>
        </thead>
        <tbody>
          {contenus.map((contenu,ci) => (
            <React.Fragment key={`sg-${ci}`}>
              <tr style={{ pageBreakInside:"avoid", breakInside:"avoid" }}>
                <td colSpan={3} style={{
                  backgroundColor: SEQ_COLORS[ci%SEQ_COLORS.length],
                  color:"#fff", fontWeight:700, fontSize:"8.5pt",
                  textTransform:"uppercase", letterSpacing:"0.05em",
                  padding:"5px 9px",
                  border:`1px solid ${SEQ_COLORS[ci%SEQ_COLORS.length]}`,
                }}>
                  Séquence {pad(ci)} — {contenu}
                </td>
              </tr>
              {PHASES.map((phase,pi) => {
                const isEval = phase === "Évaluation formative";
                const m   = cell(ci, pi, "m");
                const e   = cell(ci, pi, "e");
                const bg  = pi%2===0 ? "#fff" : "#f9fafb";
                const evBg= "#f0fdf4";
                const rb  = isEval ? evBg : bg;
                return (
                  <tr key={`sg-${ci}-ph-${pi}`}
                      style={{ pageBreakInside:"avoid", breakInside:"avoid" }}>
                    <td style={{ verticalAlign:"top", padding:"7px 9px",
                                 fontWeight:600, fontSize:"9pt",
                                 color: isEval?"#065f46":"#374151",
                                 backgroundColor:rb, border:"1px solid #e5e7eb",
                                 borderLeft:`3px solid ${isEval?"#16a34a":SEQ_COLORS[ci%SEQ_COLORS.length]}` }}>
                      {phase}
                      {isEval && oo && (
                        <span style={{ display:"block", fontSize:"8pt", color:"#16a34a",
                                       marginTop:"2px", fontStyle:"italic", fontWeight:400 }}>
                          ↳ Lié à l'OO
                        </span>
                      )}
                    </td>
                    <td style={{ verticalAlign:"top", padding:"7px 9px", fontSize:"9pt",
                                 color:"#111827", lineHeight:1.55,
                                 backgroundColor:rb, border:"1px solid #e5e7eb" }}>
                      {m || <span style={{ color:"#9ca3af", fontStyle:"italic" }}>—</span>}
                    </td>
                    <td style={{ verticalAlign:"top", padding:"7px 9px", fontSize:"9pt",
                                 color:"#111827", lineHeight:1.55,
                                 backgroundColor:rb, border:"1px solid #e5e7eb" }}>
                      {e || <span style={{ color:"#9ca3af", fontStyle:"italic" }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* ── DOCUMENT FOOTER ─────────────────────────────────────── */}
      <div style={{ marginTop:"24px", borderTop:"1px solid #e5e7eb", paddingTop:"10px",
                    display:"flex", justifyContent:"space-between" }}>
        <p style={{ fontSize:"7.5pt", color:"#9ca3af", margin:0 }}>
          Généré avec École 2.0 · Programme officiel DEMSG Sénégal
        </p>
        <p style={{ fontSize:"7.5pt", color:"#9ca3af", margin:0 }}>
          {ficheLabel ?? "Page 1/1"}
        </p>
      </div>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function PreviewScreen() {
  const navigate               = useNavigate();
  const { state }              = useLocation() as { state: Record<string,unknown>|null };
  const { ief: profileIef, userName: profileName } = useAppContext();
  const { loading, blocked, skip, hasEcoleNom } = useProfileGuard();

  // ── Route state from LessonEditor ──────────────────────────────────────────
  const fiches      = (state?.fiches      as FicheState[]|undefined) ?? [];
  const mergedFiche = (state?.mergedFiche as FicheState  |undefined)
    ?? { cells:{}, oo:"", ooVariant:0, matSel:[], pedSel:[], duree:"45 min" };
  const merged      = (state?.merged      as boolean |undefined) ?? false;
  const contenus    = (state?.contenus    as string[]|undefined) ?? ["Contenu de la leçon"];
  const discipline  = (state?.discipline  as string  |undefined) ?? "Discipline";
  const niveau      = (state?.niveau      as string  |undefined) ?? "CE2";
  const domaine     = (state?.domaine     as string  |undefined) ?? "Domaine";
  const sousDomaine = (state?.sousDomaine as string  |undefined) ?? "";
  const palier      = (state?.palier      as string  |undefined) ?? "";
  const oa          = (state?.oa          as string  |undefined) ?? "";
  const os          = (state?.os          as string  |undefined) ?? "";
  const competence  = (state?.competence  as string  |undefined) ?? "";
  const ecole       = (state?.ecole       as string  |undefined) ?? "École Liberté 6";
  const dateHeure   = (state?.dateHeure   as string  |undefined) ?? "";
  // Resource data — bound per-fiche from LessonEditor
  const matSel      = (state?.matSel      as string[]|undefined) ?? [];
  const pedSel      = (state?.pedSel      as string[]|undefined) ?? [];

  // Multi-fiche tab mode: one tab per contenu
  const isMulti = !merged && contenus.length > 1;

  // ── UI state ───────────────────────────────────────────────────────────────
  const [activeFicheIdx, setActiveFicheIdx] = useState(0);
  const [printAll,       setPrintAll]       = useState(false);
  const [zoomMode,       setZoomMode]       = useState(false);
  const [downloaded,     setDownloaded]     = useState(false);
  const [batchDone,      setBatchDone]      = useState(false);
  const [shared,         setShared]         = useState(false);

  // ── Scale for screen preview ───────────────────────────────────────────────
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    function measure() {
      const w = canvasRef.current?.offsetWidth ?? window.innerWidth;
      const available = w - 32;
      setScale(available < A4_W ? Math.max(0.3, available / A4_W) : 1);
    }
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (ro && canvasRef.current) ro.observe(canvasRef.current);
    return () => ro?.disconnect();
  }, []);

  // ── Derived values for the ACTIVE fiche ───────────────────────────────────
  const activeOO    = merged
    ? mergedFiche.oo
    : (fiches[activeFicheIdx]?.oo ?? "");
  const activeDuree = merged
    ? mergedFiche.duree
    : (fiches[activeFicheIdx]?.duree ?? "45 min");

  // Props that vary per-fiche (tab mode only)
  function ficheProps(idx: number) {
    return {
      contenus:    merged ? contenus    : [contenus[idx]],
      fiches:      merged ? fiches      : [fiches[idx]],
      oo:          merged ? mergedFiche.oo : (fiches[idx]?.oo ?? ""),
      duree:       merged ? mergedFiche.duree : (fiches[idx]?.duree ?? "45 min"),
    };
  }

  // ── Print helpers ──────────────────────────────────────────────────────────
  function printActive() { window.print(); }

  function handleDownloadActive() {
    setPrintAll(false);
    setTimeout(() => { window.print(); setDownloaded(true); setTimeout(()=>setDownloaded(false),3000); }, 80);
  }

  function handlePrintAll() {
    setPrintAll(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => { setPrintAll(false); setBatchDone(true); setTimeout(()=>setBatchDone(false),3000); }, 500);
    }, 120);
  }

  function handleShare() {
    const activeContenu = merged ? contenus.join(", ") : contenus[activeFicheIdx];
    if (typeof window !== "undefined" && "share" in navigator) {
      (navigator as unknown as { share:(d:object)=>Promise<void> })
        .share({ title:`Fiche — ${discipline}`, text:`${activeContenu} · École 2.0` })
        .catch(()=>{});
    }
    setShared(true);
    setTimeout(()=>setShared(false), 2000);
  }

  const scaledH = zoomMode ? "auto" : `${A4_H * scale}px`;
  const chipColor = SEQ_COLORS[activeFicheIdx % SEQ_COLORS.length];

  // Common props shared by every A4Document call.
  // ief and enseignant fall back to the authenticated profile when not in route state.
  const commonProps = {
    ecole, dateHeure, niveau, palier, domaine,
    sousDomaine, discipline, competence, oa, os, merged, mergedFiche,
    matSel, pedSel,
    ief:        (state?.ief        as string | undefined) ?? profileIef,
    enseignant: (state?.enseignant as string | undefined) ?? profileName,
  };

  if (loading) return <ProfileGuardLoader loading />;
  if (blocked) return <ProfileGuardLoader blocked onSkip={skip} />;

  return (
    <>
      {/* ══ PRINT STYLESHEET ════════════════════════════════════════════════ */}
      <style>{`
        @page { size: A4 portrait; margin: 10mm; }

        @media print {
          .no-print { display: none !important; }
          body * { visibility: hidden !important; }
          #a4-print-root, #a4-print-root * { visibility: visible !important; }

          html, body {
            margin: 0 !important; padding: 0 !important;
            height: auto !important; overflow: visible !important;
            background: white !important;
          }

          #a4-print-root {
            position: static !important;
            width: 100% !important;
            height: auto !important;
            display: block !important;
            overflow: visible !important;
            padding: 0 !important; margin: 0 !important;
          }

          /* Each A4 doc in normal flow */
          .a4-doc {
            position: static !important;
            width: 100% !important;
            height: auto !important; min-height: 0 !important;
            max-height: none !important;
            padding: 0 !important; margin: 0 !important;
            box-shadow: none !important;
            transform: none !important;
            display: block !important;
            overflow: visible !important;
            page-break-after: auto; break-after: auto;
          }

          /* Each fiche EXCEPT the first starts on a brand-new page */
          .fiche-page-break {
            page-break-before: always !important;
            break-before: page !important;
          }

          /* Row-level breaks — prevent any single row from splitting */
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          thead { display: table-header-group; }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="min-h-screen flex flex-col"
           style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", backgroundColor:"#dde1e7" }}>

        {/* ══ STICKY HEADER ═══════════════════════════════════════════════════ */}
        <div className="no-print sticky top-0 z-30 bg-white"
             style={{ boxShadow:"0 1px 0 #e5e7eb, 0 2px 12px rgba(0,0,0,0.07)" }}>
          <div className="max-w-5xl mx-auto px-4 md:px-6">

            {/* Title row */}
            <div className="flex items-center gap-3 pt-3 pb-2 flex-wrap">
              <button onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1a365d] hover:text-[#3182ce] transition-colors shrink-0"
                style={{ minHeight:"44px" }}>
                <ArrowLeft className="w-4 h-4"/>
                <span className="hidden sm:inline">← Éditeur</span>
                <span className="sm:hidden">Retour</span>
              </button>

              <div className="flex-1 min-w-0">
                <h1 className="text-[15px] md:text-[17px] font-bold text-[#1a365d] truncate">
                  {isMulti ? `${contenus.length} fiches générées` : "Fiche Prête à l'usage"}
                </h1>
                <p className="text-[11px] text-gray-400 mt-0.5 hidden md:block">
                  {isMulti
                    ? `Mode fiches indépendantes · ${discipline}`
                    : `${contenus.length} séquence${contenus.length>1?"s":""} · ${discipline}`}
                </p>
              </div>

              {/* Offline badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 shrink-0"
                   style={{ backgroundColor:"#f0fdf4", border:"1px solid #86efac" }}>
                <WifiOff className="w-3 h-3" style={{ color:"#16a34a" }}/>
                <Check   className="w-3 h-3" style={{ color:"#16a34a" }}/>
                <span className="text-[10px] font-bold hidden sm:inline" style={{ color:"#15803d" }}>
                  Enregistré hors-ligne
                </span>
              </div>
            </div>

            {/* ── ACTION BUTTONS ─────────────────────────────────────────────
                SINGLE / MERGED mode  : Download | Print | Share
                MULTI-FICHE mode      : Download active | Print all | Share active  */}
            <div className="pb-3">

              {/* Mobile layout */}
              <div className="flex flex-col gap-2 md:hidden">
                {/* Row 1 — primary CTA */}
                <button onClick={handleDownloadActive}
                  disabled={!hasEcoleNom}
                  title={!hasEcoleNom ? "Renseignez le nom de l'école dans votre profil" : undefined}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl text-[14px] font-bold text-white transition-all active:scale-[0.98]"
                  style={{ minHeight:"48px",
                           backgroundColor: !hasEcoleNom ? "#cbd5e1" : downloaded?"#059669":"#1a365d",
                           boxShadow: !hasEcoleNom ? "none" : "0 3px 14px rgba(26,54,93,0.28)",
                           cursor: !hasEcoleNom ? "not-allowed" : "pointer",
                           transition:"background-color 200ms" }}>
                  {downloaded?<Check className="w-5 h-5 shrink-0"/>:<Download className="w-5 h-5 shrink-0"/>}
                  {!hasEcoleNom
                    ? "Nom d'école requis"
                    : downloaded
                      ? "Téléchargé !"
                      : isMulti ? "Télécharger la fiche active (PDF)" : "Télécharger PDF"}
                </button>

                {/* Row 2 — secondary buttons */}
                <div className="flex gap-2">
                  {isMulti ? (
                    <button onClick={handlePrintAll}
                      disabled={!hasEcoleNom}
                      title={!hasEcoleNom ? "Renseignez le nom de l'école dans votre profil" : undefined}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl text-[12px] font-semibold transition-all active:scale-95"
                      style={{ minHeight:"44px",
                               cursor: !hasEcoleNom ? "not-allowed" : "pointer",
                               color: !hasEcoleNom ? "#94a3b8" : batchDone?"#059669":"#1a365d",
                               backgroundColor: !hasEcoleNom ? "#f1f5f9" : batchDone?"#f0fdf4":"#eef4ff",
                               border:`1.5px solid ${!hasEcoleNom ? "#e2e8f0" : batchDone?"#86efac":"#bfdbfe"}` }}>
                      {batchDone?<Check className="w-4 h-4 shrink-0"/>:<FileDown className="w-4 h-4 shrink-0"/>}
                      {batchDone ? "Lot prêt !" : "Tout imprimer"}
                    </button>
                  ) : (
                    <button onClick={printActive}
                      disabled={!hasEcoleNom}
                      title={!hasEcoleNom ? "Renseignez le nom de l'école dans votre profil" : undefined}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl text-[13px] font-semibold transition-all active:scale-95"
                      style={{ minHeight:"44px",
                               cursor: !hasEcoleNom ? "not-allowed" : "pointer",
                               color: !hasEcoleNom ? "#94a3b8" : "#1a365d",
                               backgroundColor:"#f1f5f9", border:"1.5px solid #e2e8f0" }}>
                      <Printer className="w-4 h-4 shrink-0"/>Imprimer
                    </button>
                  )}
                  <button onClick={handleShare}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl text-[13px] font-semibold transition-all active:scale-95"
                    style={{ minHeight:"44px",
                             color: shared?"#059669":"#1a365d",
                             backgroundColor: shared?"#f0fdf4":"#f1f5f9",
                             border:`1.5px solid ${shared?"#86efac":"#e2e8f0"}` }}>
                    {shared?<Check className="w-4 h-4 shrink-0"/>:<Share2 className="w-4 h-4 shrink-0"/>}
                    {shared?"Partagé !":isMulti?"Partager la fiche":"Partager"}
                  </button>
                </div>
              </div>

              {/* Desktop layout */}
              <div className="hidden md:flex items-center gap-2 flex-wrap">
                {/* Download active */}
                <button onClick={handleDownloadActive}
                  disabled={!hasEcoleNom}
                  title={!hasEcoleNom ? "Renseignez le nom de l'école dans votre profil" : undefined}
                  className="inline-flex items-center gap-2 rounded-xl text-[13px] font-bold text-white shrink-0 transition-all active:scale-95"
                  style={{ minHeight:"44px", padding:"0 18px",
                           backgroundColor: !hasEcoleNom ? "#cbd5e1" : downloaded?"#059669":"#1a365d",
                           boxShadow: !hasEcoleNom ? "none" : "0 3px 12px rgba(26,54,93,0.25)",
                           cursor: !hasEcoleNom ? "not-allowed" : "pointer",
                           transition:"background-color 200ms" }}>
                  {downloaded?<Check className="w-4 h-4 shrink-0"/>:<Download className="w-4 h-4 shrink-0"/>}
                  {!hasEcoleNom ? "Nom d'école requis"
                    : downloaded ? "Téléchargé !"
                    : isMulti ? "Télécharger la fiche active (PDF)" : "Télécharger PDF"}
                </button>

                <div className="w-px h-6 bg-gray-200 shrink-0"/>

                {/* Print all / Print active */}
                {isMulti ? (
                  <button onClick={handlePrintAll}
                    disabled={!hasEcoleNom}
                    title={!hasEcoleNom ? "Renseignez le nom de l'école dans votre profil" : undefined}
                    className="inline-flex items-center gap-2 rounded-xl text-[13px] font-semibold shrink-0 transition-all active:scale-95"
                    style={{ minHeight:"44px", padding:"0 16px",
                             cursor: !hasEcoleNom ? "not-allowed" : "pointer",
                             color: !hasEcoleNom ? "#94a3b8" : batchDone?"#059669":"#1a365d",
                             backgroundColor: !hasEcoleNom ? "#f1f5f9" : batchDone?"#f0fdf4":"#eef4ff",
                             border:`1.5px solid ${!hasEcoleNom ? "#e2e8f0" : batchDone?"#86efac":"#bfdbfe"}` }}>
                    {batchDone?<Check className="w-4 h-4 shrink-0"/>:<FileDown className="w-4 h-4 shrink-0"/>}
                    {batchDone?"Lot prêt !":"Tout imprimer (lot)"}
                  </button>
                ) : (
                  <button onClick={printActive}
                    disabled={!hasEcoleNom}
                    title={!hasEcoleNom ? "Renseignez le nom de l'école dans votre profil" : undefined}
                    className="inline-flex items-center gap-2 rounded-xl text-[13px] font-semibold shrink-0 transition-all active:scale-95"
                    style={{ minHeight:"44px", padding:"0 16px",
                             cursor: !hasEcoleNom ? "not-allowed" : "pointer",
                             color: !hasEcoleNom ? "#94a3b8" : "#1a365d",
                             backgroundColor:"#f1f5f9", border:"1.5px solid #e2e8f0" }}>
                    <Printer className="w-4 h-4 shrink-0"/>Imprimer
                  </button>
                )}

                <div className="w-px h-6 bg-gray-200 shrink-0"/>

                {/* Share */}
                <button onClick={handleShare}
                  className="inline-flex items-center gap-2 rounded-xl text-[13px] font-semibold shrink-0 transition-all active:scale-95"
                  style={{ minHeight:"44px", padding:"0 16px",
                           color: shared?"#059669":"#1a365d",
                           backgroundColor: shared?"#f0fdf4":"#f1f5f9",
                           border:`1.5px solid ${shared?"#86efac":"#e2e8f0"}` }}>
                  {shared?<Check className="w-4 h-4 shrink-0"/>:<Share2 className="w-4 h-4 shrink-0"/>}
                  {shared?"Partagé !":isMulti?"Partager la fiche active":"Partager"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ══ ECOLE_NOM ENFORCEMENT BANNER (skip mode only) ══════════════════ */}
        {!hasEcoleNom && (
          <div className="no-print"
               style={{
                 backgroundColor: "#fff7ed",
                 borderBottom:    "1px solid #fed7aa",
                 padding:         "10px 20px",
                 display:         "flex",
                 alignItems:      "center",
                 justifyContent:  "space-between",
                 gap:             "12px",
                 flexWrap:        "wrap",
               }}>
            <p style={{ fontSize:"12px", color:"#9a3412", margin:0, lineHeight:1.5 }}>
              <strong>Mode test</strong> — le nom de l'école est manquant.
              L'impression et le téléchargement sont désactivés pour les documents officiels.
            </p>
            <button
              onClick={() => window.location.href = "/profil"}
              style={{
                padding:         "6px 14px", borderRadius:"8px",
                backgroundColor: "#ea580c", color:"#fff",
                fontSize:        "12px", fontWeight:700,
                border:          "none", cursor:"pointer",
                fontFamily:      "'Plus Jakarta Sans',sans-serif",
                whiteSpace:      "nowrap",
                flexShrink:      0,
              }}
            >
              Compléter le profil
            </button>
          </div>
        )}

        {/* ══ CANVAS AREA ═════════════════════════════════════════════════════ */}
        <div ref={canvasRef} className="no-print flex-1 flex flex-col items-center py-6 px-4"
             style={{ width:"100%" }}>

          {/* ── FICHE SELECTOR — only when not merged and >1 fiches ── */}
          {isMulti && (
            <div className="w-full max-w-[794px] mb-4">

              {/* Desktop: horizontal tab bar */}
              <div className="hidden md:flex rounded-xl overflow-hidden bg-white"
                   style={{ boxShadow:"0 2px 10px rgba(26,54,93,0.08)", border:"1.5px solid #e2e8f0" }}>
                {contenus.map((c,i) => {
                  const isActive = activeFicheIdx === i;
                  const color    = SEQ_COLORS[i % SEQ_COLORS.length];
                  return (
                    <button key={i} onClick={() => setActiveFicheIdx(i)}
                      className="flex-1 flex flex-col items-center justify-center py-3 px-4 transition-all"
                      style={{
                        minHeight:"52px",
                        borderBottom: `3px solid ${isActive ? color : "transparent"}`,
                        backgroundColor: isActive ? color+"12" : "transparent",
                        borderRight: i < contenus.length-1 ? "1px solid #f1f5f9" : "none",
                      }}>
                      <span className="text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: isActive ? color : "#94a3b8" }}>
                        Fiche {i+1}
                      </span>
                      <span className="text-[12px] font-semibold truncate max-w-full px-1 mt-0.5"
                            style={{ color: isActive ? color : "#64748b" }}>
                        <span style={{ opacity:0.55, fontWeight:700 }}>{pad(i)}.</span> {c}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile: compact dropdown */}
              <div className="md:hidden relative">
                <div className="flex items-center gap-2 rounded-xl bg-white px-4"
                     style={{ boxShadow:"0 2px 10px rgba(26,54,93,0.08)",
                              border:`1.5px solid ${chipColor}`,
                              minHeight:"48px" }}>
                  <div className="w-3 h-3 rounded-full shrink-0"
                       style={{ backgroundColor: chipColor }}/>
                  <select
                    value={activeFicheIdx}
                    onChange={e => setActiveFicheIdx(Number(e.target.value))}
                    className="flex-1 appearance-none outline-none text-[13px] font-semibold bg-transparent py-3"
                    style={{ color:"#1a365d", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    {contenus.map((c,i) => (
                      <option key={i} value={i}>
                        Fiche {i+1}/{contenus.length} : {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 shrink-0 pointer-events-none"
                               style={{ color: chipColor }}/>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 ml-1">
                  Sélectionner la fiche à prévisualiser
                </p>
              </div>
            </div>
          )}

          {/* ── Hint + zoom toggle ── */}
          <div className="flex items-center gap-2 mb-4 w-full max-w-[794px]">
            <p className="text-[11px] text-gray-500 flex-1">
              {isMulti
                ? `Fiche ${activeFicheIdx+1}/${contenus.length} · Aperçu à ${Math.round(scale*100)}%`
                : `Aperçu à ${Math.round(scale*100)}%${zoomMode?"":" · Plein écran pour zoomer"}`}
            </p>
            <button onClick={() => setZoomMode(o => !o)}
              className="md:hidden inline-flex items-center gap-1.5 rounded-lg text-[11px] font-bold px-3 transition-all active:scale-95"
              style={{ minHeight:"36px", color:"#1a365d",
                       backgroundColor:"#eef4ff", border:"1.5px solid #bfdbfe" }}>
              {zoomMode
                ? <><Minimize2 className="w-3.5 h-3.5"/>Réduire</>
                : <><Maximize2 className="w-3.5 h-3.5"/>Plein écran</>}
            </button>
          </div>

          {/* ── A4 scale wrapper (screen-only) ── */}
          <div style={{ width:"100%", maxWidth:`${A4_W}px`,
                        height: scaledH, overflow: zoomMode?"visible":"hidden" }}>
            <div style={{
              transformOrigin: "top left",
              transform:       zoomMode ? "none" : `scale(${scale})`,
              boxShadow:       "0 2px 4px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.13), 0 0 0 1px rgba(0,0,0,0.04)",
              borderRadius:    "1px",
              display:         "inline-block",
            }}>
              {/* Screen: show only the active fiche */}
              <A4Document
                {...commonProps}
                {...ficheProps(activeFicheIdx)}
                duree={activeDuree}
                oo={activeOO}
                ficheLabel={isMulti ? `Fiche ${activeFicheIdx+1} / ${contenus.length}` : "Page 1/1"}
              />
            </div>
          </div>

          <p className="no-print text-[10px] text-gray-400 mt-4 text-center">
            Format A4 · 210 × 297 mm · Impression optimisée · Programme officiel DEMSG
          </p>
        </div>

        {/* ══ PRINT ROOT — rendered off-screen, revealed only by @media print ═══ */}
        {/*    In printAll mode: ALL fiches with page-break-before between them.
               In normal mode:  only the active fiche.                             */}
        <div id="a4-print-root"
             style={{ position:"absolute", left:"-9999px", top:0,
                      width:`${A4_W}px`, pointerEvents:"none", userSelect:"none" }}>
          {printAll && isMulti ? (
            contenus.map((_, i) => (
              <div key={i} className={i > 0 ? "fiche-page-break" : ""}>
                <A4Document
                  {...commonProps}
                  {...ficheProps(i)}
                  duree={fiches[i]?.duree ?? "45 min"}
                  oo={fiches[i]?.oo ?? ""}
                  ficheLabel={`Fiche ${i+1} / ${contenus.length}`}
                />
              </div>
            ))
          ) : (
            <A4Document
              {...commonProps}
              {...ficheProps(activeFicheIdx)}
              duree={activeDuree}
              oo={activeOO}
              ficheLabel={isMulti ? `Fiche ${activeFicheIdx+1} / ${contenus.length}` : "Page 1/1"}
            />
          )}
        </div>

        {/* ══ DESKTOP ZOOM FAB ═══════════════════════════════════════════════ */}
        <button onClick={() => setZoomMode(o => !o)}
          className="no-print fixed bottom-5 right-4 hidden md:inline-flex items-center gap-2 rounded-2xl text-[12px] font-bold text-white transition-all active:scale-95"
          style={{ minHeight:"44px", padding:"0 18px", backgroundColor:"#1a365d",
                   boxShadow:"0 4px 16px rgba(26,54,93,0.35)" }}>
          {zoomMode
            ? <><Minimize2 className="w-4 h-4 shrink-0"/>Réduire</>
            : <><Maximize2 className="w-4 h-4 shrink-0"/>Plein écran</>}
        </button>
      </div>
    </>
  );
}
