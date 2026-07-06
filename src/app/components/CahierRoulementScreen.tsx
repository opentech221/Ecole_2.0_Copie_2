import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, ChevronDown, ChevronUp, Printer,
  Check, Clock, BookOpen, Users, TrendingUp, FileText,
} from "lucide-react";

// ─── Activity color map (matches PlanningScreen) ──────────────────────────────

const ACTIVITY_COLORS: Record<string, string> = {
  "Activités Numériques":    "var(--secondary)",
  "Activités Géométriques":  "var(--primary)",
  "Activités de Mesure":     "var(--accent-foreground)",
  "Résolution de Problèmes": "var(--secondary)",
  "Lecture":                 "var(--primary)",
  "Grammaire":               "var(--secondary)",
  "Conjugaison":             "var(--accent-foreground)",
  "Orthographe":             "var(--destructive)",
  "Expression orale":        "var(--secondary)",
  "Récitation":              "var(--accent-foreground)",
  "Histoire":                "var(--primary)",
  "IST (Initiation Scientifique et Technologique)": "var(--accent-foreground)",
  "Géographie":              "var(--secondary)",
  "Vivre dans son milieu":   "var(--secondary)",
  "Vivre ensemble":          "var(--primary)",
  "EPS":                     "var(--destructive)",
  "Arts plastiques":         "var(--accent-foreground)",
  "Éducation Musicale":      "var(--primary)",
};

function getColor(name: string): string {
  return ACTIVITY_COLORS[name] ?? "var(--secondary)";
}

function tint(color: string, amount: number, background = "transparent"): string {
  return `color-mix(in srgb, ${color} ${amount}%, ${background})`;
}

// ─── Timetable data ───────────────────────────────────────────────────────────

type DayKey = "Lundi" | "Mardi" | "Mercredi" | "Jeudi" | "Vendredi";

const DAYS: DayKey[] = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

interface SlotDef {
  time: string;
  activity: string;
  ficheNum: number;
  oaOs: string;
}

const TIMETABLE: Record<DayKey, SlotDef[]> = {
  Lundi: [
    { time: "8h00",  activity: "Activités Numériques",   ficheNum: 1, oaOs: "OA1 · OS1.1 — Lire et écrire les nombres de 0 à 100" },
    { time: "9h00",  activity: "Lecture",                 ficheNum: 1, oaOs: "OA1 · OS1.2 — Lire à voix haute avec la bonne intonation" },
    { time: "10h15", activity: "Histoire",                ficheNum: 1, oaOs: "OA1 · OS1.1 — Nommer des événements clés" },
    { time: "11h15", activity: "IST (Initiation Scientifique et Technologique)", ficheNum: 1, oaOs: "OA1 · OS1.1 — Formuler une hypothèse à partir d'une observation" },
    { time: "14h00", activity: "Expression orale",        ficheNum: 1, oaOs: "OA1 · OS1.1 — Se présenter oralement" },
  ],
  Mardi: [
    { time: "8h00",  activity: "Activités de Mesure",     ficheNum: 1, oaOs: "OA1 · OS1.1 — Utiliser la règle graduée" },
    { time: "9h00",  activity: "Grammaire",               ficheNum: 1, oaOs: "OA1 · OS1.1 — Reconnaître les noms communs et propres" },
    { time: "10h15", activity: "Lecture",                  ficheNum: 2, oaOs: "OA1 · OS1.3 — Répondre à des questions de compréhension" },
    { time: "11h15", activity: "Vivre dans son milieu",   ficheNum: 1, oaOs: "OA1 · OS1.1 — Identifier les sources de pollution" },
    { time: "14h00", activity: "Éducation Musicale",      ficheNum: 1, oaOs: "OA1 · OS1.1 — Chanter en groupe avec justesse" },
  ],
  Mercredi: [
    { time: "8h00",  activity: "Activités Numériques",   ficheNum: 2, oaOs: "OA1 · OS1.2 — Décomposer les nombres en centaines, dizaines, unités" },
    { time: "9h00",  activity: "Conjugaison",             ficheNum: 1, oaOs: "OA1 · OS1.1 — Identifier les déterminants articles" },
    { time: "10h15", activity: "Géographie",              ficheNum: 1, oaOs: "OA1 · OS1.1 — Nommer les fleuves principaux" },
    { time: "11h15", activity: "Expression orale",        ficheNum: 2, oaOs: "OA1 · OS1.2 — Décrire une scène" },
    { time: "14h00", activity: "Arts plastiques",         ficheNum: 1, oaOs: "OA1 · OS1.1 — Réaliser des productions variées" },
  ],
  Jeudi: [
    { time: "8h00",  activity: "Activités Géométriques", ficheNum: 1, oaOs: "OA1 · OS1.1 — Reconnaître et nommer le carré, le rectangle et le triangle" },
    { time: "9h00",  activity: "Orthographe",             ficheNum: 1, oaOs: "OA1 · OS1.1 — Reconnaître les noms communs" },
    { time: "10h15", activity: "Vivre ensemble",          ficheNum: 1, oaOs: "OA1 · OS1.1 — Identifier les valeurs civiques" },
    { time: "11h15", activity: "EPS",                     ficheNum: 1, oaOs: "OA1 · OS1.1 — Pratiquer des activités physiques" },
    { time: "14h00", activity: "Lecture",                  ficheNum: 3, oaOs: "OA1 · OS1.1 — Lire les syllabes et les mots avec exactitude" },
  ],
  Vendredi: [
    { time: "8h00",  activity: "Résolution de Problèmes", ficheNum: 1, oaOs: "OA1 · OS1.1 — Identifier les données utiles d'un problème" },
    { time: "9h00",  activity: "Grammaire",               ficheNum: 2, oaOs: "OA1 · OS1.2 — Identifier les déterminants articles" },
    { time: "10h15", activity: "Conjugaison",             ficheNum: 2, oaOs: "OA1 · OS1.2 — Conjuguer au présent" },
    { time: "11h15", activity: "Orthographe",             ficheNum: 2, oaOs: "OA1 · OS1.2 — Appliquer les règles d'accord" },
    { time: "14h00", activity: "IST (Initiation Scientifique et Technologique)", ficheNum: 2, oaOs: "OA1 · OS1.2 — Réaliser une expérience simple" },
  ],
};

// ─── Status types ─────────────────────────────────────────────────────────────

type ActivityStatus = "fait" | "en-cours" | "a-reporter" | null;

interface ActivityState {
  status: ActivityStatus;
  observation: string;
  obsOpen: boolean;
}

// ─── Student / evaluation types ───────────────────────────────────────────────

type EvalMark = "NM" | "A" | "M" | null;

interface Student {
  id: number;
  name: string;
}

const STUDENTS: Student[] = [
  { id:  1, name: "Aminata Diallo" },
  { id:  2, name: "Moussa Sow" },
  { id:  3, name: "Fatou Ndiaye" },
  { id:  4, name: "Ibrahima Ba" },
  { id:  5, name: "Mariama Traoré" },
  { id:  6, name: "Abdou Diop" },
  { id:  7, name: "Aissatou Fall" },
  { id:  8, name: "Cheikh Kane" },
  { id:  9, name: "Rokhaya Mbaye" },
  { id: 10, name: "Omar Sarr" },
  { id: 11, name: "Ndèye Thiam" },
  { id: 12, name: "Mamadou Konaté" },
  { id: 13, name: "Awa Cissé" },
  { id: 14, name: "Aliou Faye" },
  { id: 15, name: "Bineta Touré" },
  { id: 16, name: "Souleymane Diallo" },
  { id: 17, name: "Coumba Badji" },
  { id: 18, name: "Abdoulaye Niang" },
  { id: 19, name: "Mame Diarra Fall" },
  { id: 20, name: "Pape Diouf" },
  { id: 21, name: "Yacine Barry" },
  { id: 22, name: "Lamine Gueye" },
  { id: 23, name: "Oumou Keita" },
  { id: 24, name: "Thierno Baldé" },
  { id: 25, name: "Khady Dieng" },
];

// ─── Domain / OS catalog for evaluation grid ─────────────────────────────────

interface EvalOS { label: string; color: string }
interface EvalDomain { label: string; color: string; osList: EvalOS[] }

const EVAL_DOMAINS: EvalDomain[] = [
  {
    label: "Mathématiques", color: "var(--primary)",
    osList: [
      { label: "OS1.1 · Lire et écrire les nombres de 0 à 100",         color: "var(--secondary)" },
      { label: "OS1.2 · Décomposer les nombres (C, D, U)",               color: "var(--secondary)" },
      { label: "OS2.1 · Calculer des additions avec retenue",            color: "var(--secondary)" },
      { label: "OS1.1 · Identifier le carré et le rectangle",            color: "var(--primary)" },
      { label: "OS1.1 · Mesurer un segment avec la règle",               color: "var(--accent-foreground)" },
      { label: "OS1.1 · Identifier les données d'un problème",           color: "var(--destructive)" },
    ],
  },
  {
    label: "Langue & Communication", color: "var(--secondary)",
    osList: [
      { label: "OS1.2 · Lire à voix haute avec intonation",              color: "var(--destructive)" },
      { label: "OS1.3 · Répondre à des questions de compréhension",      color: "var(--destructive)" },
      { label: "OS1.1 · Reconnaître noms communs et propres",            color: "var(--primary)" },
      { label: "OS1.1 · Conjuguer au présent de l'indicatif",            color: "var(--accent-foreground)" },
      { label: "OS1.1 · Appliquer les règles d'accord",                  color: "var(--secondary)" },
      { label: "OS1.1 · Se présenter et décrire oralement",              color: "var(--accent-foreground)" },
    ],
  },
  {
    label: "ESVS", color: "var(--accent-foreground)",
    osList: [
      { label: "OS1.1 · Nommer des événements clés (Histoire)",          color: "var(--primary)" },
      { label: "OS1.1 · Nommer les fleuves principaux",                  color: "var(--secondary)" },
      { label: "OS1.1 · Formuler une hypothèse (IST)",                   color: "var(--accent-foreground)" },
      { label: "OS1.1 · Identifier sources de pollution",                color: "var(--secondary)" },
      { label: "OS1.1 · Identifier les valeurs civiques",                color: "var(--primary)" },
    ],
  },
  {
    label: "EPSA", color: "var(--destructive)",
    osList: [
      { label: "OS1.1 · Pratiquer des jeux collectifs (EPS)",            color: "var(--destructive)" },
      { label: "OS1.1 · Chanter en groupe avec justesse",                color: "var(--accent-foreground)" },
      { label: "OS1.1 · Réaliser une production plastique",              color: "var(--secondary)" },
    ],
  },
];

// ─── Helper: compute mastery rate ────────────────────────────────────────────

function computeMastery(marks: Record<number, EvalMark>): number {
  const vals = Object.values(marks).filter(Boolean);
  if (vals.length === 0) return 0;
  const mastered = vals.filter(v => v === "M").length;
  return Math.round((mastered / vals.length) * 100);
}

function masteryMessage(rate: number): string {
  if (rate >= 80) return "Excellent — objectif atteint";
  if (rate >= 60) return "Satisfaisant — renforcement ciblé";
  if (rate >= 40) return "En progression — remédiation nécessaire";
  return "Insuffisant — révision urgente";
}

// ─── Status pill button ───────────────────────────────────────────────────────

function StatusPill({
  label, color, active, onClick,
}: {
  label: string; color: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        minHeight: "44px",
        padding: "0 12px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 700,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        backgroundColor: active ? color : "transparent",
        color: active ? "#fff" : color,
        border: `1.5px solid ${color}`,
        cursor: "pointer",
        transition: "all 180ms ease",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}

// ─── Activity timeline card ───────────────────────────────────────────────────

function ActivityCard({
  slot, state, onChange,
}: {
  slot: SlotDef;
  state: ActivityState;
  onChange: (next: Partial<ActivityState>) => void;
}) {
  const color = getColor(slot.activity);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "var(--card)",
        borderTop:    `1px solid ${tint(color, 28)}`,
        borderRight:  `1px solid ${tint(color, 28)}`,
        borderBottom: `1px solid ${tint(color, 28)}`,
        borderLeft:   `5px solid ${color}`,
        boxShadow: `0 2px 10px ${tint(color, 14)}`,
      }}
    >
      {/* Card header row */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 flex-wrap"
        style={{ backgroundColor: tint(color, 6, "var(--background)"), borderBottom: `1px solid ${tint(color, 18)}` }}
      >
        {/* Time badge */}
        <span
          style={{
            fontSize: "11px", fontWeight: 800,
            padding: "3px 10px", borderRadius: "999px",
            backgroundColor: tint(color, 16, "var(--background)"), color,
            flexShrink: 0,
          }}
        >
          {slot.time}
        </span>

        {/* Fiche number badge */}
        <span
          style={{
            fontSize: "9px", fontWeight: 900,
            padding: "2px 8px", borderRadius: "6px",
            backgroundColor: color, color: "var(--primary-foreground)",
            flexShrink: 0, letterSpacing: "0.04em",
          }}
        >
          #{slot.ficheNum}
        </span>

        {/* Activity name */}
        <span
          style={{
            fontSize: "12px", fontWeight: 700,
            color: "var(--primary)", flex: 1, minWidth: 0,
          }}
        >
          {slot.activity}
        </span>
      </div>

      {/* OA/OS subtitle */}
      <div className="px-3 pt-2 pb-1">
        <p style={{ fontSize: "11px", color: "var(--muted-foreground)", lineHeight: 1.5 }}>
          {slot.oaOs}
        </p>
      </div>

      {/* Status selectors */}
      <div className="px-3 pb-2 flex gap-2 flex-wrap">
        <StatusPill
          label="✓ Fait"
          color="var(--secondary)"
          active={state.status === "fait"}
          onClick={() => onChange({ status: state.status === "fait" ? null : "fait" })}
        />
        <StatusPill
          label="⏳ En cours"
          color="var(--accent-foreground)"
          active={state.status === "en-cours"}
          onClick={() => onChange({ status: state.status === "en-cours" ? null : "en-cours" })}
        />
        <StatusPill
          label="↩ À reporter"
          color="var(--destructive)"
          active={state.status === "a-reporter"}
          onClick={() => onChange({ status: state.status === "a-reporter" ? null : "a-reporter" })}
        />

        {/* Toggle observations */}
        <button
          onClick={() => onChange({ obsOpen: !state.obsOpen })}
          style={{
            minHeight: "44px",
            padding: "0 12px",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: 700,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            backgroundColor: "transparent",
            color: "var(--muted-foreground)",
            border: "1.5px solid var(--border)",
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: "4px",
            flexShrink: 0,
          }}
        >
          <FileText style={{ width: "13px", height: "13px" }} />
          Obs.
          {state.obsOpen
            ? <ChevronUp style={{ width: "12px", height: "12px" }} />
            : <ChevronDown style={{ width: "12px", height: "12px" }} />}
        </button>
      </div>

      {/* Collapsible observations textarea */}
      <div style={{
        maxHeight: state.obsOpen ? "160px" : "0px",
        overflow: "hidden",
        transition: "max-height 300ms cubic-bezier(0.4,0,0.2,1)",
      }}>
        <div className="px-3 pb-3">
          <textarea
            value={state.observation}
            onChange={e => onChange({ observation: e.target.value })}
            placeholder="Observations, remarques, points à retravailler…"
            rows={3}
            style={{
              width: "100%",
              resize: "vertical",
              borderRadius: "10px",
              padding: "10px 12px",
              fontSize: "12px",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: "var(--foreground)",
              backgroundColor: "var(--muted)",
              border: `1.5px solid ${tint(color, 30)}`,
              outline: "none",
              lineHeight: 1.5,
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Evaluation mark pastille ─────────────────────────────────────────────────

function MarkPastille({
  mark, value, color, onClick,
}: {
  mark: EvalMark; value: EvalMark; color: string; onClick: () => void;
}) {
  const LABELS: Record<NonNullable<EvalMark>, string> = { NM: "NM", A: "A", M: "M" };
  const COLORS: Record<NonNullable<EvalMark>, string> = { NM: "var(--destructive)", A: "var(--accent-foreground)", M: "var(--secondary)" };
  const active = mark === value;
  const c = COLORS[value!];

  return (
    <button
      onClick={onClick}
      style={{
        width: "38px", height: "38px",
        borderRadius: "50%",
        fontSize: "11px", fontWeight: 800,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        backgroundColor: active ? c : tint(c, 18, "var(--background)"),
        color: active ? "var(--primary-foreground)" : c,
        border: `2px solid ${active ? c : tint(c, 40, "var(--background)")}`,
        cursor: "pointer",
        transition: "all 180ms ease",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {LABELS[value!]}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CahierRoulementScreen() {
  const navigate = useNavigate();

  // ── Shared view toggle ──
  const [view, setView] = useState<"cahier" | "evaluations">("cahier");

  // ── View 1: Cahier de Roulement ──
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayKey>("Lundi");

  // Activity states: key = `${day}-${index}`
  const [activityStates, setActivityStates] = useState<Record<string, ActivityState>>({});

  function getActState(day: DayKey, idx: number): ActivityState {
    const key = `${day}-${idx}`;
    return activityStates[key] ?? { status: null, observation: "", obsOpen: false };
  }
  function setActState(day: DayKey, idx: number, patch: Partial<ActivityState>) {
    const key = `${day}-${idx}`;
    setActivityStates(prev => ({
      ...prev,
      [key]: { ...getActState(day, idx), ...patch },
    }));
  }

  // Compute day completion stats
  const slots = TIMETABLE[selectedDay];
  const doneCount = slots.filter((_, i) => getActState(selectedDay, i).status === "fait").length;
  const inProgressCount = slots.filter((_, i) => getActState(selectedDay, i).status === "en-cours").length;

  // ── View 2: Evaluations ──
  const [evalHeaderCollapsed, setEvalHeaderCollapsed] = useState(false);
  const [selectedDomainIdx, setSelectedDomainIdx] = useState(0);
  const [selectedOSIdx, setSelectedOSIdx] = useState(0);

  const evalDomain = EVAL_DOMAINS[selectedDomainIdx];
  const evalOS = evalDomain.osList[selectedOSIdx];

  // Marks: key = `${domainIdx}-${osIdx}-${studentId}`
  const [marks, setMarks] = useState<Record<string, EvalMark>>({});

  function markKey(di: number, oi: number, sid: number) {
    return `${di}-${oi}-${sid}`;
  }
  function getMark(di: number, oi: number, sid: number): EvalMark {
    return marks[markKey(di, oi, sid)] ?? null;
  }
  function setMark(di: number, oi: number, sid: number, value: EvalMark) {
    const k = markKey(di, oi, sid);
    const current = marks[k];
    setMarks(prev => ({ ...prev, [k]: current === value ? null : value }));
  }

  // Compute mastery for current OS
  const currentMarks: Record<number, EvalMark> = {};
  STUDENTS.forEach(s => {
    currentMarks[s.id] = getMark(selectedDomainIdx, selectedOSIdx, s.id);
  });
  const masteryRate = computeMastery(currentMarks);
  const masteryMsg = masteryMessage(masteryRate);
  const masteryColor = masteryRate >= 80 ? "#059669" : masteryRate >= 60 ? "#d97706" : "#dc2626";

  // Desktop detection — for adaptive week-view layout
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function handlePrint() {
    window.print();
  }

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height:"calc(100vh - 36px)", fontFamily: "'Plus Jakarta Sans', sans-serif", backgroundColor: "var(--background)" }}
    >
      {/* ── Print CSS ── */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm 12mm; }
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .print-root { height: auto !important; overflow: visible !important; }
          .print-scroll { overflow: visible !important; height: auto !important; }
        }
      `}</style>

      {/* ══ COLLAPSIBLE HEADER ══════════════════════════════════════════════════ */}
      <div
        className="bg-card flex-shrink-0"
        style={{
          boxShadow: "0 1px 0 var(--border), 0 2px 10px rgba(0,0,0,0.06)",
          zIndex: 50, position: "relative",
        }}
      >
        <div style={{ maxWidth: isDesktop ? "1100px" : "680px", margin: "0 auto", padding: "0 16px" }}>

          {/* Nav row — always visible */}
          <div
            className="flex items-center gap-3"
            style={{ paddingTop: "14px", paddingBottom: "8px", borderBottom: "1px solid var(--border)" }}
          >
            <button
              onClick={() => navigate("/")}
              className="no-print inline-flex items-center gap-1.5 font-semibold"
              style={{
                minHeight: "44px", fontSize: "13px",
                color: "var(--primary)", background: "none", border: "none", cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <ArrowLeft style={{ width: "16px", height: "16px" }} />
              <span>Accueil</span>
            </button>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--primary)", flex: 1, margin: 0 }}>
              Cahier de Roulement
            </p>
            <button
              onClick={handlePrint}
              className="no-print"
              style={{
                minHeight: "44px", minWidth: "44px",
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: "10px", backgroundColor: "var(--muted)",
                border: "none", cursor: "pointer", color: "var(--muted-foreground)",
              }}
              title="Imprimer / PDF"
            >
              <Printer style={{ width: "18px", height: "18px" }} />
            </button>
          </div>

          {/* Collapsible controls */}
          <div style={{
            maxHeight: headerCollapsed ? "0px" : "220px",
            overflow: "hidden",
            transition: "max-height 360ms cubic-bezier(0.4,0,0.2,1)",
          }}>
            {/* Day selector tabs (View 1 only) */}
            {view === "cahier" && (
              <div style={{ paddingTop: "10px", paddingBottom: "6px" }}>
                <div
                  style={{
                    display: "flex", gap: "4px",
                    backgroundColor: "var(--muted)",
                    borderRadius: "14px", padding: "3px",
                  }}
                >
                  {DAYS.map(day => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      style={{
                        flex: 1, minHeight: "40px",
                        borderRadius: "11px", border: "none",
                        fontSize: "11px", fontWeight: 700,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        cursor: "pointer",
                        backgroundColor: selectedDay === day ? "var(--primary)" : "transparent",
                        color: selectedDay === day ? "var(--primary-foreground)" : "var(--muted-foreground)",
                        boxShadow: selectedDay === day ? "0 2px 8px rgba(26,54,93,0.22)" : "none",
                        transition: "all 180ms ease",
                      }}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Date + class stats */}
            <div
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                paddingTop: "6px", paddingBottom: "10px",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "12px", color: "var(--muted-foreground)", margin: 0 }}>
                  <span style={{ fontWeight: 700, color: "var(--primary)", fontSize: "14px" }}>
                    {view === "cahier" ? selectedDay : "Grille d'évaluations"}
                  </span>
                  {view === "cahier" && (
                    <span style={{ marginLeft: "8px" }}>
                      — CE2 · Trimestre 1
                    </span>
                  )}
                </p>
              </div>
              {view === "cahier" && (
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "4px",
                    backgroundColor: "#dcfce7", borderRadius: "999px",
                    padding: "4px 10px",
                  }}>
                    <Check style={{ width: "12px", height: "12px", color: "#059669" }} />
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#059669" }}>
                      {doneCount} fait{doneCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "4px",
                    backgroundColor: "#fef3c7", borderRadius: "999px",
                    padding: "4px 10px",
                  }}>
                    <Clock style={{ width: "12px", height: "12px", color: "#d97706" }} />
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#d97706" }}>
                      {inProgressCount}
                    </span>
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "4px",
                    backgroundColor: "var(--muted)", borderRadius: "999px",
                    padding: "4px 10px",
                  }}>
                    <Users style={{ width: "12px", height: "12px", color: "var(--muted-foreground)" }} />
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted-foreground)" }}>25 élèves</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Toggle tab */}
          <div
            className="no-print flex justify-center"
            style={{ paddingBottom: "4px", paddingTop: "2px", borderTop: "1px solid var(--border)" }}
          >
            <button
              onClick={() => setHeaderCollapsed(o => !o)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                fontSize: "11px", color: "var(--muted-foreground)", fontWeight: 600,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                padding: "4px 14px", minHeight: "28px",
                borderRadius: "999px", border: "none",
                backgroundColor: "transparent", cursor: "pointer",
              }}
            >
              {headerCollapsed
                ? <><ChevronDown style={{ width: "14px", height: "14px" }} />Afficher les filtres</>
                : <><ChevronUp style={{ width: "14px", height: "14px" }} />Masquer les filtres</>}
            </button>
          </div>
        </div>
      </div>

      {/* ══ SEGMENTED PILL CONTROL ══════════════════════════════════════════════ */}
      <div
        className="no-print bg-card flex-shrink-0"
        style={{
          borderBottom: "1px solid var(--border)",
          boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
          zIndex: 40, position: "relative",
        }}
      >
        <div style={{ maxWidth: isDesktop ? "1100px" : "680px", margin: "0 auto", padding: "8px 16px" }}>
          <div style={{
            display: "flex",
            backgroundColor: "var(--muted)",
            borderRadius: "999px",
            padding: "3px",
            position: "relative",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08)",
          }}>
            {/* Sliding capsule */}
            <div style={{
              position: "absolute",
              top: "3px", bottom: "3px",
              left: view === "cahier" ? "3px" : "calc(50% + 1px)",
              width: "calc(50% - 4px)",
              backgroundColor: "var(--primary)",
              borderRadius: "999px",
              transition: "left 220ms cubic-bezier(0.4,0,0.2,1)",
              boxShadow: "0 2px 8px rgba(30,41,59,0.25)",
            }} />

            {/* Segment 1 */}
            <button
              onClick={() => setView("cahier")}
              style={{
                flex: 1, position: "relative", zIndex: 1,
                minHeight: "40px", fontSize: "12px", fontWeight: 700,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                borderRadius: "999px", border: "none",
                color: view === "cahier" ? "#fff" : "#64748b",
                background: "transparent", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              }}
            >
              <BookOpen style={{ width: "14px", height: "14px" }} />
              Cahier de Roulement
            </button>

            {/* Segment 2 */}
            <button
              onClick={() => setView("evaluations")}
              style={{
                flex: 1, position: "relative", zIndex: 1,
                minHeight: "40px", fontSize: "12px", fontWeight: 700,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                borderRadius: "999px", border: "none",
                color: view === "evaluations" ? "#fff" : "#64748b",
                background: "transparent", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              }}
            >
              <TrendingUp style={{ width: "14px", height: "14px" }} />
              Grille d'Évaluations
            </button>
          </div>
        </div>
      </div>

      {/* ══ SCROLLABLE CONTENT AREA ═════════════════════════════════════════════ */}
      <div
        className="flex-1 overflow-y-auto print-root"
        style={{ position: "relative" }}
      >
        <div
          style={{ maxWidth: isDesktop ? "1100px" : "680px", margin: "0 auto", padding: "0 16px" }}
          className="print-scroll"
        >

          {/* ── VIEW 1: Cahier de Roulement ── */}
          {view === "cahier" && (
            <div style={{ paddingTop: "16px", paddingBottom: "32px" }}>

              {isDesktop ? (
                /* ── Desktop: 5-column week grid — all days side-by-side ── */
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
                  {DAYS.map(day => {
                    const daySlots = TIMETABLE[day];
                    const dayDone = daySlots.filter((_, i) => getActState(day, i).status === "fait").length;
                    const dayPct  = Math.round((dayDone / daySlots.length) * 100);
                    return (
                      <div key={day}>
                        {/* Day header */}
                        <div style={{
                          marginBottom: "8px",
                          padding: "8px 10px",
                          borderRadius: "10px",
                          backgroundColor: "var(--primary)",
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}>
                          <span style={{ fontSize: "12px", fontWeight: 800, color: "#fff" }}>{day}</span>
                          <span style={{
                            fontSize: "10px", fontWeight: 700,
                            padding: "2px 8px", borderRadius: "999px",
                            backgroundColor: dayPct === 100 ? "#059669" : dayPct > 0 ? "#d97706" : "rgba(255,255,255,0.15)",
                            color: dayPct === 100 ? "#fff" : dayPct > 0 ? "#fff" : "rgba(255,255,255,0.6)",
                          }}>
                            {dayPct}%
                          </span>
                        </div>

                        {/* Slots — compact vertical stack */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {daySlots.map((slot, idx) => {
                            const state   = getActState(day, idx);
                            const color   = getColor(slot.activity);
                            const isDone  = state.status === "fait";
                            const isCours = state.status === "en-cours";
                            return (
                              <div
                                key={idx}
                                style={{
                                  borderRadius: "10px",
                                  overflow: "hidden",
                                  backgroundColor: "var(--card)",
                                  borderLeft:   `4px solid ${color}`,
                                  borderTop:    `1px solid ${color}22`,
                                  borderRight:  `1px solid ${color}22`,
                                  borderBottom: `1px solid ${color}22`,
                                  boxShadow: `0 1px 6px ${color}12`,
                                  opacity: isDone ? 0.75 : 1,
                                }}
                              >
                                {/* Compact header */}
                                <div style={{
                                  padding: "6px 10px",
                                  backgroundColor: `${color}0e`,
                                  borderBottom: `1px solid ${color}18`,
                                  display: "flex", alignItems: "center", gap: "6px",
                                }}>
                                  <span style={{ fontSize: "10px", fontWeight: 800,
                                                 color, flexShrink: 0 }}>{slot.time}</span>
                                  <span style={{ fontSize: "11px", fontWeight: 700,
                                                 color: "var(--primary)", flex: 1, minWidth: 0,
                                                 overflow: "hidden", textOverflow: "ellipsis",
                                                 whiteSpace: "nowrap" }}>
                                    {slot.activity}
                                  </span>
                                </div>

                                {/* Status pills — compact */}
                                <div style={{ padding: "6px 8px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                  {(["fait", "en-cours", "a-reporter"] as const).map(s => {
                                    const cfg = { fait: { label:"✓ Fait", c:"#059669" }, "en-cours": { label:"⏳", c:"#d97706" }, "a-reporter": { label:"↩", c:"#dc2626" } }[s];
                                    const active = state.status === s;
                                    return (
                                      <button
                                        key={s}
                                        onClick={() => setActState(day, idx, { status: active ? null : s })}
                                        style={{
                                          minHeight: "28px", padding: "0 8px",
                                          borderRadius: "999px", border: `1px solid ${cfg.c}`,
                                          fontSize: "10px", fontWeight: 700,
                                          backgroundColor: active ? cfg.c : "transparent",
                                          color: active ? "#fff" : cfg.c,
                                          cursor: "pointer", flexShrink: 0,
                                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                                          transition: "all 150ms ease",
                                        }}
                                      >
                                        {cfg.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ── Mobile: single-day timeline (original behavior) ── */
                <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
                  {slots.map((slot, idx) => {
                    const state = getActState(selectedDay, idx);
                    const isLast = idx === slots.length - 1;
                    return (
                      <div key={idx} style={{ display: "flex", gap: "12px" }}>
                        {/* Timeline line + dot */}
                        <div style={{
                          display: "flex", flexDirection: "column",
                          alignItems: "center", flexShrink: 0, width: "20px",
                          paddingTop: "16px",
                        }}>
                          <div style={{
                            width: "10px", height: "10px", borderRadius: "50%",
                            backgroundColor: getColor(slot.activity), flexShrink: 0,
                            boxShadow: `0 0 0 3px ${getColor(slot.activity)}28`,
                          }} />
                          {!isLast && (
                            <div style={{
                              flex: 1, width: "2px", backgroundColor: "var(--border)",
                              marginTop: "4px", marginBottom: "4px", minHeight: "24px",
                            }} />
                          )}
                        </div>
                        {/* Card */}
                        <div style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? "0" : "12px" }}>
                          <ActivityCard
                            slot={slot} state={state}
                            onChange={patch => setActState(selectedDay, idx, patch)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── VIEW 2: Grille d'Évaluations ── */}
          {view === "evaluations" && (
            <div style={{ paddingBottom: "120px" }}>

              {/* Sticky sub-header: domain + OS selectors */}
              <div
                style={{
                  position: "sticky", top: 0, zIndex: 30,
                  backgroundColor: "var(--background)",
                  paddingTop: "12px", paddingBottom: "10px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {/* Domain collapse toggle */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted-foreground)", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Filtres
                  </p>
                  <button
                    onClick={() => setEvalHeaderCollapsed(o => !o)}
                    className="no-print"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "4px",
                      fontSize: "11px", color: "var(--muted-foreground)", fontWeight: 600,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      padding: "4px 10px", minHeight: "28px",
                      borderRadius: "999px", border: "1px solid var(--border)",
                      backgroundColor: "var(--card)", cursor: "pointer",
                    }}
                  >
                    {evalHeaderCollapsed
                      ? <><ChevronDown style={{ width: "12px", height: "12px" }} />Afficher</>
                      : <><ChevronUp style={{ width: "12px", height: "12px" }} />Masquer</>}
                  </button>
                </div>

                <div style={{
                  maxHeight: evalHeaderCollapsed ? "0px" : "300px",
                  overflow: "hidden",
                  transition: "max-height 320ms cubic-bezier(0.4,0,0.2,1)",
                }}>
                  {/* Domain selector */}
                  <div style={{ marginBottom: "8px" }}>
                    <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted-foreground)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Domaine
                    </p>
                    <div style={{ display: "flex", gap: "6px", overflowX: "auto", scrollbarWidth: "none", paddingBottom: "2px" }}>
                      {EVAL_DOMAINS.map((d, di) => (
                        <button
                          key={di}
                          onClick={() => { setSelectedDomainIdx(di); setSelectedOSIdx(0); }}
                          style={{
                            minHeight: "36px", padding: "0 14px",
                            borderRadius: "999px", border: "none",
                            fontSize: "11px", fontWeight: 700,
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            cursor: "pointer", flexShrink: 0,
                            backgroundColor: selectedDomainIdx === di ? d.color : `${d.color}18`,
                            color: selectedDomainIdx === di ? "#fff" : d.color,
                            boxShadow: selectedDomainIdx === di ? `0 3px 10px ${d.color}44` : "none",
                            transition: "all 180ms ease",
                          }}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* OS selector */}
                  <div>
                    <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted-foreground)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Objectif Spécifique
                    </p>
                    <div style={{ position: "relative" }}>
                      <select
                        value={selectedOSIdx}
                        onChange={e => setSelectedOSIdx(Number(e.target.value))}
                        style={{
                          width: "100%",
                          minHeight: "44px",
                          padding: "0 36px 0 12px",
                          borderRadius: "12px",
                          border: `1.5px solid ${evalDomain.color}50`,
                          backgroundColor: "var(--card)",
                          fontSize: "12px",
                          fontWeight: 600,
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          color: "#374151",
                          appearance: "none",
                          cursor: "pointer",
                          outline: "none",
                        }}
                      >
                        {evalDomain.osList.map((os, oi) => (
                          <option key={oi} value={oi}>{os.label}</option>
                        ))}
                      </select>
                      <ChevronDown
                        style={{
                          position: "absolute", right: "12px", top: "50%",
                          transform: "translateY(-50%)",
                          width: "14px", height: "14px",
                          color: "#9ca3af", pointerEvents: "none",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* OS context badge */}
              <div style={{
                marginTop: "10px", marginBottom: "6px",
                padding: "8px 12px",
                borderRadius: "10px",
                backgroundColor: `${evalOS.color}14`,
                borderLeft: `4px solid ${evalOS.color}`,
                borderTop: `1px solid ${evalOS.color}28`,
                borderRight: `1px solid ${evalOS.color}28`,
                borderBottom: `1px solid ${evalOS.color}28`,
              }}>
                <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: evalOS.color }}>
                  {evalOS.label}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "10px", color: "var(--muted-foreground)" }}>
                  {STUDENTS.length} élèves · NM = Non Maîtrisé · A = En Acquisition · M = Maîtrisé
                </p>
              </div>

              {/* Student list — single col mobile, 2-col desktop */}
              <div style={{
                display: "grid",
                gridTemplateColumns: isDesktop ? "repeat(2, 1fr)" : "1fr",
                gap: "4px",
                marginTop: "8px",
              }}>
                {STUDENTS.map(student => {
                  const mark = getMark(selectedDomainIdx, selectedOSIdx, student.id);
                  return (
                    <div
                      key={student.id}
                      style={{
                        display: "flex", alignItems: "center",
                        backgroundColor: "var(--card)",
                        borderRadius: "12px",
                        padding: isDesktop ? "10px 16px" : "8px 14px",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        gap: "12px",
                        minHeight: isDesktop ? "60px" : "56px",
                      }}
                    >
                      {/* Student number */}
                      <span style={{
                        fontSize: "10px", fontWeight: 800, color: "#cbd5e1",
                        minWidth: "20px", flexShrink: 0, textAlign: "right",
                      }}>
                        {student.id}
                      </span>

                      {/* Student name */}
                      <span style={{
                        flex: 1, minWidth: 0,
                        fontSize: isDesktop ? "13.5px" : "13px",
                        fontWeight: 600, color: "var(--primary)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {student.name}
                      </span>

                      {/* Mark pastilles — larger on desktop */}
                      <div style={{ display: "flex", gap: isDesktop ? "8px" : "6px", flexShrink: 0 }}>
                        {(["NM", "A", "M"] as EvalMark[]).map(val => {
                          const COLORS: Record<NonNullable<EvalMark>, string> = { NM: "#dc2626", A: "#d97706", M: "#059669" };
                          const active = mark === val;
                          const c = COLORS[val!];
                          return (
                            <button
                              key={val}
                              onClick={() => setMark(selectedDomainIdx, selectedOSIdx, student.id, val)}
                              style={{
                                width:           isDesktop ? "44px" : "38px",
                                height:          isDesktop ? "44px" : "38px",
                                borderRadius:    "50%",
                                fontSize:        isDesktop ? "12px" : "11px",
                                fontWeight:      800,
                                fontFamily:      "'Plus Jakarta Sans', sans-serif",
                                backgroundColor: active ? c : `${c}18`,
                                color:           active ? "#fff" : c,
                                border:          `2px solid ${active ? c : `${c}40`}`,
                                cursor:          "pointer",
                                transition:      "all 180ms ease",
                                flexShrink:      0,
                                display:         "flex", alignItems: "center", justifyContent: "center",
                              }}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ FLOATING MASTERY BANNER (Evaluations view only) ════════════════════ */}
      {view === "evaluations" && (
        <div
          className="no-print"
          style={{
            position: "fixed",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 32px)",
            maxWidth: "608px",
            zIndex: 60,
          }}
        >
          <div style={{
            backgroundColor: "#1e293b",
            borderRadius: "16px",
            padding: "14px 20px",
            boxShadow: "0 8px 32px rgba(30,41,59,0.35)",
            display: "flex", alignItems: "center", gap: "16px",
          }}>
            {/* Rate */}
            <div style={{ flexShrink: 0 }}>
              <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
                Taux de Maîtrise
              </p>
              <p style={{ margin: 0, fontSize: "26px", fontWeight: 900, color: masteryColor, lineHeight: 1.1 }}>
                {masteryRate}%
              </p>
            </div>

            {/* Divider */}
            <div style={{ width: "1px", height: "40px", backgroundColor: "rgba(255,255,255,0.12)", flexShrink: 0 }} />

            {/* Progress bar + message */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                height: "6px", borderRadius: "999px",
                backgroundColor: "rgba(255,255,255,0.12)",
                marginBottom: "6px", overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", borderRadius: "999px",
                  backgroundColor: masteryColor,
                  width: `${masteryRate}%`,
                  transition: "width 400ms ease",
                }} />
              </div>
              <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.7)", fontWeight: 600, lineHeight: 1.4 }}>
                {masteryMsg}
              </p>
            </div>

            {/* Students evaluated count */}
            <div style={{ flexShrink: 0, textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>
                Élèves notés
              </p>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#fff" }}>
                {Object.values(currentMarks).filter(Boolean).length}/{STUDENTS.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
