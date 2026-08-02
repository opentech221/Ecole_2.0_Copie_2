import React, { useState } from "react";
import { Loader2, Printer, X } from "lucide-react";
import { BATCH_PRINT_CSS, buildBatchPrintHtml } from "../utils/printBulletins";
import { computeWeightedAvg, totalAbsencesNJ, type GradeSet } from "../utils/grades";

export type SortKey = "alpha" | "merit-best" | "merit-worst";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "alpha", label: "A–Z Nom" },
  { key: "merit-best", label: "Meilleur en premier" },
  { key: "merit-worst", label: "Plus faible en premier" },
];

type AttendanceStatus = "P" | "ANJ" | "AJ" | "R";

interface Student {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  genre: "F" | "M";
  dateNaissance: string;
  lieuNaissance: string;
  tuteurNom: string;
  tuteurPhone: string;
}

interface DomainConfig {
  label: string;
  color: string;
  disciplines: string[];
}

interface Decision {
  label: string;
  color: string;
  bg: string;
}

interface BulletinBodyComponentProps {
  student: Student;
  grades: Record<string, GradeSet>;
  trimestre: 1 | 2 | 3;
  activeClass: string;
  moyT3: number;
  absNJ: number;
  decision: Decision;
  gradeSchema: Record<string, number>;
  rank?: number;
}

interface BatchPreviewModalProps {
  open: boolean;
  trimestre: 1 | 2 | 3;
  onClose: () => void;
  sortKey: SortKey;
  onSortChange: (k: SortKey) => void;
  students: Student[];
  gradesMap: Record<string, Record<string, GradeSet>>;
  gradeSchema: Record<string, number>;
  computedRanks: Record<string, number>;
  activeClass: string;
  domains: DomainConfig[];
  getStudentGrades: (id: string) => Record<string, GradeSet>;
  getAttendance: (studentId: string, count: number) => AttendanceStatus[];
  BulletinBody: React.ComponentType<BulletinBodyComponentProps>;
}

export function BatchPreviewModal({
  open,
  trimestre,
  onClose,
  sortKey,
  onSortChange,
  students,
  gradesMap,
  gradeSchema,
  computedRanks,
  activeClass,
  domains,
  getStudentGrades,
  getAttendance,
  BulletinBody,
}: BatchPreviewModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    if (isPrinting) return;
    setIsPrinting(true);

    const validStudents = students.filter(s => {
      const g = gradesMap[s.id];
      return g !== undefined && Object.keys(g).length > 0;
    });

    if (validStudents.length === 0) {
      setIsPrinting(false);
      return;
    }

    const html = buildBatchPrintHtml({
      students: validStudents,
      trimestre,
      classLabel: activeClass,
      gradesMap,
      gradeSchema,
      computedRanks,
      domains,
      getStudentGrades,
      getAttendance,
    });

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");

    if (win) {
      win.addEventListener("load", () => {
        setTimeout(() => {
          win.print();
          setTimeout(() => URL.revokeObjectURL(url), 30_000);
        }, 400);
      });
    } else {
      const a = Object.assign(document.createElement("a"), {
        href: url,
        download: `bulletins-CE2-T${trimestre}.html`,
      });
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 15_000);
    }

    setTimeout(() => setIsPrinting(false), 1500);
  };

  if (!open) return null;

  const trimLabel = trimestre === 1 ? "1er" : trimestre === 2 ? "2ème" : "3ème";

  const handleBlobFallback = () => {
    const root = document.getElementById("print-batch-root");
    if (!root) return;
    const sortLabel = SORT_OPTIONS.find(o => o.key === sortKey)?.label ?? sortKey;
    const html = [
      "<!DOCTYPE html><html lang='fr'><head><meta charset='utf-8'>",
      `<title>Bulletins CE2 · ${trimLabel} Trimestre · ${sortLabel}</title>`,
      `<style>${BATCH_PRINT_CSS}</style>`,
      "</head><body>",
      root.innerHTML,
      "</body></html>",
    ].join("\n");

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `bulletins-ce2-t${trimestre}-${sortKey}.html`,
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 15_000);
  };

  const primaryBtn = (bg: string, shadow: string): React.CSSProperties => ({
    minHeight: "40px",
    padding: "0 16px",
    fontSize: "12px",
    backgroundColor: isPrinting ? "#475569" : bg,
    color: "#fff",
    opacity: isPrinting ? 0.75 : 1,
    cursor: isPrinting ? "not-allowed" : "pointer",
    boxShadow: isPrinting ? "none" : shadow,
    transition: "all 200ms ease",
    border: "none",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  });

  return (
    <div
      className="fixed inset-0 z-[500] flex flex-col"
      style={{ backgroundColor: "#f4f6f9", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="bg-primary shrink-0" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.22)" }}>
        <div className="flex items-center gap-3 px-4" style={{ minHeight: "56px" }}>
          <button
            onClick={onClose}
            disabled={isPrinting}
            className="p-2 rounded-xl bg-white/10 active:scale-95 transition-all"
            aria-label="Retour"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white/55 text-[9px] font-bold uppercase tracking-widest leading-none">
              Aperçu · {students.length} bulletins · impression via #print-batch-root
            </p>
            <h2 className="text-white text-[14px] font-bold leading-tight truncate">
              Bulletins CE2 · {trimLabel} Trimestre
            </h2>
          </div>
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="inline-flex items-center gap-1.5 rounded-xl font-bold transition-all shrink-0"
            style={primaryBtn("#10b981", "0 4px 14px rgba(16,185,129,0.35)")}
          >
            {isPrinting ? (
              <>
                <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                Préparation…
              </>
            ) : (
              <>
                <Printer className="w-4 h-4 shrink-0" />
                Imprimer
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 px-4 pb-3">
          <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest shrink-0">
            Trier :
          </span>
          <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {SORT_OPTIONS.map(opt => {
              const active = sortKey === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => onSortChange(opt.key)}
                  disabled={isPrinting}
                  className="shrink-0 rounded-full font-semibold transition-all active:scale-95"
                  style={{
                    fontSize: "10px",
                    padding: "4px 12px",
                    minHeight: "28px",
                    backgroundColor: active ? "#fff" : "rgba(255,255,255,0.10)",
                    color: active ? "#1a365d" : "rgba(255,255,255,0.65)",
                    border: "none",
                    cursor: isPrinting ? "not-allowed" : "pointer",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: active ? 700 : 500,
                    boxShadow: active ? "0 1px 6px rgba(0,0,0,0.15)" : "none",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        id="print-batch-root"
        className="flex-1 overflow-auto px-3 py-4"
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        {students.map((s, idx) => {
          const g = gradesMap[s.id] ?? getStudentGrades(s.id);
          const m3 = computeWeightedAvg(g, trimestre, gradeSchema);
          const nj3 = totalAbsencesNJ(getAttendance(s.id, 20));
          const dec =
            m3 >= 5
              ? { label: "Admis(e) en classe supérieure (CM1)", color: "#059669", bg: "#dcfce7" }
              : m3 >= 4.5
                ? { label: "Autorisé(e) à passer le test de passage", color: "#d97706", bg: "#fef3c7" }
                : { label: "Redoublement proposé", color: "#dc2626", bg: "#fee2e2" };
          return (
            <div key={s.id} style={{ maxWidth: "794px", width: "100%", margin: "0 auto" }}>
              <div className="no-print flex items-center gap-2 mb-1.5 px-1">
                <span style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  {String(idx + 1).padStart(2, "0")}/{students.length}
                </span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#1a365d", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  {s.nom} {s.prenom}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: m3 >= 5 ? "#059669" : "#dc2626",
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                  }}
                >
                  · Moy. {m3.toFixed(2)}/10
                </span>
              </div>
              <div
                style={{
                  backgroundColor: "var(--card)",
                  borderRadius: "6px",
                  padding: "0 10px 10px",
                  boxShadow: "0 2px 14px rgba(0,0,0,0.10)",
                  border: "1px solid var(--border)",
                  width: "100%",
                  fontFamily: "Arial, Helvetica, sans-serif",
                }}
              >
                <BulletinBody
                  student={s}
                  grades={g}
                  trimestre={trimestre}
                  activeClass={activeClass}
                  moyT3={m3}
                  absNJ={nj3}
                  decision={dec}
                  gradeSchema={gradeSchema}
                  rank={computedRanks[s.id]}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="bg-card shrink-0 flex items-center justify-between gap-3 px-4 py-3"
        style={{ borderTop: "1px solid var(--border)", boxShadow: "0 -2px 10px rgba(0,0,0,0.07)" }}
      >
        <div className="min-w-0">
          <p className="text-[12px] font-semibold truncate" style={{ color: "#1a365d" }}>
            {students.length} bulletins · {SORT_OPTIONS.find(o => o.key === sortKey)?.label}
          </p>
          <button
            onClick={handleBlobFallback}
            disabled={isPrinting}
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#64748b",
              cursor: isPrinting ? "not-allowed" : "pointer",
              background: "none",
              border: "none",
              padding: 0,
              textDecoration: "underline",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Télécharger en HTML (mobile)
          </button>
        </div>
        <button
          onClick={handlePrint}
          disabled={isPrinting}
          className="inline-flex items-center gap-2 rounded-xl font-bold transition-all shrink-0"
          style={{ ...primaryBtn("#1a365d", "0 4px 14px rgba(26,54,93,0.30)"), minHeight: "44px", padding: "0 20px", fontSize: "13px" }}
        >
          {isPrinting ? (
            <>
              <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
              Préparation des bulletins…
            </>
          ) : (
            <>
              <Printer className="w-4 h-4 shrink-0" />
              Confirmer l'impression
            </>
          )}
        </button>
      </div>
    </div>
  );
}
