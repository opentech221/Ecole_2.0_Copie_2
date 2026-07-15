import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  ArrowLeft, ChevronDown, ChevronUp, Printer,
  Check, Clock, BookOpen, Users, TrendingUp, FileText, CalendarDays, Plus,
  BellRing, X,
} from "lucide-react";
import { DOMAINS as PLANNING_DOMAINS, OA_CATALOG } from "./PlanningScreen";
import { programmeNavFunctionApi } from "../../services/programmeNavFunctionApi";
import { useAppContext } from "../contexts/AppContext";
import { supabase, TABLES } from "../../lib/supabase";

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

type DayKey = "Lundi" | "Mardi" | "Mercredi" | "Jeudi" | "Vendredi" | "Samedi";

const DAYS: DayKey[] = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

interface JournalDomain {
  id: string;
  label: string;
}

const JOURNAL_DOMAIN_KEYS = ["maths", "langue", "esvs", "epsa"] as const;

const JOURNAL_DOMAINS: JournalDomain[] = PLANNING_DOMAINS
  .filter(domain => JOURNAL_DOMAIN_KEYS.includes(domain.key as (typeof JOURNAL_DOMAIN_KEYS)[number]))
  .map(domain => ({ id: domain.key, label: domain.label }));

type VisaStatus = "idle" | "pending" | "approved";

interface JournalActivity {
  id: string;
  label: string;
  domainId: string;
  contents: string[];
}

interface JournalCellValue {
  activityIds: string[];
  contentsByActivity: Record<string, string[]>;
  observation: string;
}

interface JournalEntry {
  cells: Record<string, JournalCellValue>;
  observations: string;
  visaStatus: VisaStatus;
}

interface ActivityOption extends JournalActivity {}

interface ActivityColorPreset {
  badge: string;
  content: string;
  dot: string;
  panel: string;
  action: string;
}

const ACTIVITY_COLOR_PRESETS: ActivityColorPreset[] = [
  {
    badge: "bg-blue-500/10 text-blue-600 border-blue-500/40 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-700",
    content: "text-blue-700 marker:text-blue-500 dark:text-blue-100 dark:marker:text-blue-300",
    dot: "bg-blue-500 dark:bg-blue-300",
    panel: "border-blue-500/35 dark:border-blue-700/90",
    action: "border-blue-400/60 text-blue-600 hover:bg-blue-500/10 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-500/20",
  },
  {
    badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-700",
    content: "text-emerald-700 marker:text-emerald-500 dark:text-emerald-100 dark:marker:text-emerald-300",
    dot: "bg-emerald-500 dark:bg-emerald-300",
    panel: "border-emerald-500/35 dark:border-emerald-700/90",
    action: "border-emerald-400/60 text-emerald-600 hover:bg-emerald-500/10 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-500/20",
  },
  {
    badge: "bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/40 dark:bg-fuchsia-500/20 dark:text-fuchsia-300 dark:border-fuchsia-700",
    content: "text-fuchsia-700 marker:text-fuchsia-500 dark:text-fuchsia-100 dark:marker:text-fuchsia-300",
    dot: "bg-fuchsia-500 dark:bg-fuchsia-300",
    panel: "border-fuchsia-500/35 dark:border-fuchsia-700/90",
    action: "border-fuchsia-400/60 text-fuchsia-600 hover:bg-fuchsia-500/10 dark:border-fuchsia-700 dark:text-fuchsia-300 dark:hover:bg-fuchsia-500/20",
  },
  {
    badge: "bg-amber-500/10 text-amber-700 border-amber-500/45 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-700",
    content: "text-amber-700 marker:text-amber-500 dark:text-amber-100 dark:marker:text-amber-300",
    dot: "bg-amber-500 dark:bg-amber-300",
    panel: "border-amber-500/35 dark:border-amber-700/90",
    action: "border-amber-400/60 text-amber-700 hover:bg-amber-500/10 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-500/20",
  },
  {
    badge: "bg-cyan-500/10 text-cyan-700 border-cyan-500/45 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-700",
    content: "text-cyan-700 marker:text-cyan-500 dark:text-cyan-100 dark:marker:text-cyan-300",
    dot: "bg-cyan-500 dark:bg-cyan-300",
    panel: "border-cyan-500/35 dark:border-cyan-700/90",
    action: "border-cyan-400/60 text-cyan-700 hover:bg-cyan-500/10 dark:border-cyan-700 dark:text-cyan-300 dark:hover:bg-cyan-500/20",
  },
  {
    badge: "bg-rose-500/10 text-rose-600 border-rose-500/45 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-700",
    content: "text-rose-700 marker:text-rose-500 dark:text-rose-100 dark:marker:text-rose-300",
    dot: "bg-rose-500 dark:bg-rose-300",
    panel: "border-rose-500/35 dark:border-rose-700/90",
    action: "border-rose-400/60 text-rose-600 hover:bg-rose-500/10 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-500/20",
  },
];

function hashToHue(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = input.charCodeAt(index) + ((hash << 5) - hash);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

function getActivityColor(activityId: string): ActivityColorPreset {
  const colorIndex = hashToHue(activityId) % ACTIVITY_COLOR_PRESETS.length;
  return ACTIVITY_COLOR_PRESETS[colorIndex];
}

const SCHOOL_MONTHS = [
  { label: "Octobre", monthIndex: 9 },
  { label: "Novembre", monthIndex: 10 },
  { label: "Décembre", monthIndex: 11 },
  { label: "Janvier", monthIndex: 0 },
  { label: "Février", monthIndex: 1 },
  { label: "Mars", monthIndex: 2 },
  { label: "Avril", monthIndex: 3 },
  { label: "Mai", monthIndex: 4 },
  { label: "Juin", monthIndex: 5 },
] as const;

type WeekDayEntry = { dayKey: DayKey; date: Date };

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekKey(week: WeekDayEntry[]): string {
  if (!week.length) return "no-week";
  return formatDateKey(week[0].date);
}

function getSchoolYearStartYear(reference: Date): number {
  const month = reference.getMonth();
  if (month >= 9) return reference.getFullYear();
  if (month <= 5) return reference.getFullYear() - 1;
  return reference.getFullYear();
}

function getInitialSchoolMonth(): Date {
  const today = new Date();
  const month = today.getMonth();
  if (month <= 5 || month >= 9) return new Date(today.getFullYear(), month, 1);
  return new Date(today.getFullYear(), 9, 1);
}

function getSchoolMonthOptions(reference: Date) {
  const startYear = getSchoolYearStartYear(reference);
  return SCHOOL_MONTHS.map(item => {
    const year = item.monthIndex >= 9 ? startYear : startYear + 1;
    return {
      ...item,
      year,
      key: `${year}-${item.monthIndex}`,
    };
  });
}

function getMonthWeeks(reference: Date) {
  const weeks: WeekDayEntry[][] = [];
  const firstDay = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const lastDay = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  let cursor = new Date(firstDay);
  const startOffset = (cursor.getDay() + 6) % 7;
  cursor.setDate(cursor.getDate() - startOffset);

  while (cursor <= lastDay) {
    const week: WeekDayEntry[] = [];
    for (let i = 0; i < 6; i += 1) {
      const dayDate = new Date(cursor);
      dayDate.setDate(cursor.getDate() + i);
      const dayKey = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"][i] as DayKey;
      week.push({ dayKey, date: dayDate });
    }
    weeks.push(week);
    cursor.setDate(cursor.getDate() + 6);
  }

  return weeks;
}

function formatWeekLabel(week: WeekDayEntry[]) {
  if (!week.length) return "Semaine";
  const start = week[0].date;
  const end = week[week.length - 1].date;
  return `Semaine du ${start.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} au ${end.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}`;
}

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
  Samedi: [],
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

function ActivityModal({
  isOpen,
  domain,
  activityOptions,
  emptyActivityOptions,
  selectedIds,
  onToggle,
  onClose,
}: {
  isOpen: boolean;
  domain: JournalDomain | null;
  activityOptions: ActivityOption[];
  emptyActivityOptions: ActivityOption[];
  selectedIds: string[];
  onToggle: (activityId: string) => void;
  onClose: () => void;
}) {
  if (!isOpen || !domain) return null;
  const options = activityOptions.filter(option => option.domainId === domain.id);
  const emptyOptions = emptyActivityOptions.filter(option => option.domainId === domain.id);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-[560px] rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between">
          <p className="m-0 text-sm font-extrabold text-gray-900 dark:text-gray-100">Sélection des activités · {domain.label}</p>
          <button className="text-xs font-bold text-gray-600 dark:text-gray-300" onClick={onClose}>Fermer</button>
        </div>
        {emptyOptions.length > 0 && (
          <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
            {emptyOptions.length} activité(s) masquée(s) car aucun contenu n'est défini dans la planification.
          </div>
        )}
        <div className="max-h-[340px] space-y-2 overflow-y-auto">
          {options.length === 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">Aucune activité disponible avec contenus pour ce domaine.</p>
          )}
          {options.map(option => {
            const tone = getActivityColor(option.id);
            const checked = selectedIds.includes(option.id);
            return (
              <label key={option.id} className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-50/40 px-2 py-2 dark:border-blue-700 dark:bg-slate-950">
                <input type="checkbox" checked={checked} onChange={() => onToggle(option.id)} />
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${tone.badge}`}
                >
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ContentModal({
  isOpen,
  activity,
  selectedContents,
  filteredContents,
  onToggle,
  onClose,
}: {
  isOpen: boolean;
  activity: ActivityOption | null;
  selectedContents: string[];
  filteredContents: string[];
  onToggle: (content: string) => void;
  onClose: () => void;
}) {
  if (!isOpen || !activity) return null;
  const tone = getActivityColor(activity.id);

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-[620px] rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between">
          <p className="m-0 text-sm font-extrabold text-gray-900 dark:text-gray-100">Contenus pédagogiques · {activity.label}</p>
          <button className="text-xs font-bold text-gray-600 dark:text-gray-300" onClick={onClose}>Fermer</button>
        </div>
        <div className="max-h-[360px] space-y-2 overflow-y-auto">
          {filteredContents.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">Tous les contenus disponibles sont déjà utilisés dans l'historique.</p>
          ) : filteredContents.map(content => (
            <label key={content} className="flex items-start gap-2 rounded-lg border border-blue-500/30 bg-blue-50/40 px-2 py-2 dark:border-blue-700 dark:bg-slate-950">
              <input type="checkbox" checked={selectedContents.includes(content)} onChange={() => onToggle(content)} className="mt-0.5" />
              <span className={`text-xs ${tone.content}`}>{content}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function JournalCell({
  day,
  domain,
  activityOptions,
  value,
  disabled,
  onChange,
  onOpenActivityModal,
  onOpenContentModal,
  onRemoveActivity,
}: {
  day: DayKey;
  domain: JournalDomain;
  activityOptions: ActivityOption[];
  value: JournalCellValue;
  disabled: boolean;
  onChange: (updates: Partial<JournalCellValue>) => void;
  onOpenActivityModal: () => void;
  onOpenContentModal: (activityId: string) => void;
  onRemoveActivity: (activityId: string) => void;
}) {
  const selectedActivities = activityOptions.filter(option => value.activityIds.includes(option.id));

  return (
    <div className="group flex min-h-[140px] flex-col gap-2 rounded-xl border border-blue-500/40 bg-white p-2.5 transition-all duration-200 hover:border-indigo-500 hover:bg-blue-50/30 dark:border-blue-700 dark:bg-slate-950 dark:hover:border-emerald-700 dark:hover:bg-slate-900">
      <button
        onClick={onOpenActivityModal}
        disabled={disabled}
        className="inline-flex min-h-[36px] items-center gap-2 self-start rounded-full border border-indigo-700/50 bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500 dark:border-indigo-500/40 dark:bg-indigo-600 dark:text-white"
        style={{ cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.65 : 1 }}
      >
        <Plus size={14} />
        Ajouter activité
      </button>

      <div className="space-y-2">
        {selectedActivities.map(activity => {
          const tone = getActivityColor(activity.id);
          const selectedContents = value.contentsByActivity?.[activity.id] ?? [];
          return (
            <div key={activity.id} className={`rounded-lg border bg-blue-50/30 p-2 transition-colors duration-200 dark:bg-slate-900 ${tone.panel}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${tone.badge}`}>
                  {activity.label}
                </span>
                <div className="inline-flex items-center gap-1">
                  <button
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-indigo-700/50 bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition-all duration-150 hover:bg-indigo-500"
                    onClick={() => onOpenContentModal(activity.id)}
                    disabled={disabled}
                    title="Ajouter / modifier contenus"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-red-400/70 bg-red-500/10 text-red-600 transition-colors duration-150 hover:bg-red-500/20 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300"
                    onClick={() => onRemoveActivity(activity.id)}
                    disabled={disabled}
                    title="Supprimer l'activité"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
              {selectedContents.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  {selectedContents.map(content => (
                    <div key={content} className={`flex items-start gap-1.5 text-[11px] ${tone.content}`}>
                      <span className={`mt-[5px] h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                      <span>{content}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <textarea
        aria-label={`${domain.label} - ${day}`}
        value={value.observation}
        onChange={e => onChange({ observation: e.target.value })}
        disabled={disabled}
        rows={2}
        placeholder="Observation rapide"
        className="w-full resize-y rounded-[10px] border border-blue-500/40 bg-white px-2.5 py-2 text-xs text-gray-900 dark:border-blue-700 dark:bg-slate-900 dark:text-gray-100"
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CahierRoulementScreen() {
  const navigate = useNavigate();
  const { activeClass } = useAppContext();

  const allProgrammeActivities = useMemo(
    () => Array.from(new Set(PLANNING_DOMAINS.flatMap((d) => d.sousGroups.flatMap((sg) => sg.activities.map((a) => a.name))))),
    [],
  );

  const officialCatalogQuery = useQuery({
    queryKey: ["programme-nav", "cahier-activity-content"],
    queryFn: async () => {
      const entries = await Promise.all(
        allProgrammeActivities.map(async (activity) => {
          const res = await programmeNavFunctionApi.getCurriculum({ activite: activity });
          const contents = (res.data.detail?.paliers ?? [])
            .flatMap((p) => p.oas)
            .flatMap((oa) => oa.os)
            .flatMap((os) => os.contenus);
          return [activity, Array.from(new Set(contents))] as const;
        }),
      );

      const out: Record<string, string[]> = {};
      for (const [activity, contents] of entries) out[activity] = contents;
      return out;
    },
  });

  const allActivityOptions = useMemo(() => {
    const official = officialCatalogQuery.data;
    return PLANNING_DOMAINS
      .filter(domain => JOURNAL_DOMAIN_KEYS.includes(domain.key as (typeof JOURNAL_DOMAIN_KEYS)[number]))
      .flatMap(domain =>
        domain.sousGroups.flatMap(group =>
          group.activities.map(activity => {
            const fallback = (OA_CATALOG[activity.name] ?? [])
              .flatMap(oa => oa.osItems.flatMap(os => os.contenus));
            const contents = official?.[activity.name]?.length
              ? official[activity.name]
              : Array.from(new Set(fallback));
            return {
              id: activity.name,
              label: activity.name,
              domainId: domain.key,
              contents,
            };
          }),
        ),
      );
  }, [officialCatalogQuery.data]);

  const activityOptions = useMemo(
    () => allActivityOptions.filter(activity => activity.contents.length > 0),
    [allActivityOptions],
  );

  const emptyActivityOptions = useMemo(
    () => allActivityOptions.filter(activity => activity.contents.length === 0),
    [allActivityOptions],
  );

  // ── Shared view toggle ──
  const [view, setView] = useState<"cahier" | "evaluations">("cahier");

  // ── View 1: Cahier de Roulement ──
  const [selectedDay, setSelectedDay] = useState<DayKey>("Lundi");
  const [selectedMonth, setSelectedMonth] = useState(() => getInitialSchoolMonth());
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [weekSaturdayPrefs, setWeekSaturdayPrefs] = useState<Record<string, boolean>>({});
  const [directorNotice, setDirectorNotice] = useState<string>("");
  const [activityModalTarget, setActivityModalTarget] = useState<{ day: DayKey; domainId: string } | null>(null);
  const [contentModalTarget, setContentModalTarget] = useState<{ day: DayKey; domainId: string; activityId: string } | null>(null);
  const [dbUsedContents, setDbUsedContents] = useState<string[]>([]);

  const schoolMonthOptions = useMemo(() => getSchoolMonthOptions(selectedMonth), [selectedMonth]);
  const monthWeeks = useMemo(() => getMonthWeeks(selectedMonth), [selectedMonth]);
  const selectedWeek = monthWeeks[selectedWeekIndex] ?? [];
  const selectedWeekKey = useMemo(() => getWeekKey(selectedWeek), [selectedWeek]);
  const selectedWeekIncludesSaturday = weekSaturdayPrefs[selectedWeekKey] ?? false;
  const selectedWeekDays = useMemo(
    () => (selectedWeekIncludesSaturday ? selectedWeek : selectedWeek.filter(day => day.dayKey !== "Samedi")),
    [selectedWeek, selectedWeekIncludesSaturday],
  );
  const selectedWeekLabel = useMemo(() => formatWeekLabel(selectedWeekDays), [selectedWeekDays]);

  useEffect(() => {
    if (selectedWeekIndex >= monthWeeks.length) {
      setSelectedWeekIndex(0);
    }
  }, [monthWeeks.length, selectedWeekIndex]);

  useEffect(() => {
    if (!selectedWeekDays.some(item => item.dayKey === selectedDay)) {
      setSelectedDay(selectedWeekDays[0]?.dayKey ?? "Lundi");
    }
  }, [selectedDay, selectedWeekDays]);

  const defaultJournalEntry = (): JournalEntry => ({
    cells: {},
    observations: "",
    visaStatus: "idle",
  });

  useEffect(() => {
    let mounted = true;
    async function loadDbUsedContents() {
      const { data, error } = await supabase
        .from(TABLES.documents)
        .select("title")
        .eq("class_id", activeClass)
        .eq("type", "planning")
        .ilike("title", "JOURNAL_CONTENT|%");

      if (error || !mounted) return;
      const fromDb = new Set<string>();
      (data ?? []).forEach(row => {
        const parts = row.title.split("|");
        const encoded = parts[parts.length - 1] ?? "";
        if (encoded) fromDb.add(decodeURIComponent(encoded));
      });
      setDbUsedContents(Array.from(fromDb));
    }

    loadDbUsedContents();
    return () => {
      mounted = false;
    };
  }, [activeClass]);

  const [journalEntries, setJournalEntries] = useState<Record<DayKey, JournalEntry>>(() => {
    const initial: Record<DayKey, JournalEntry> = {} as Record<DayKey, JournalEntry>;
    DAYS.forEach(day => {
      initial[day] = defaultJournalEntry();
    });
    return initial;
  });

  const updateJournalEntry = (day: DayKey, patch: Partial<JournalEntry>) => {
    setJournalEntries(prev => ({
      ...prev,
      [day]: { ...(prev[day] ?? defaultJournalEntry()), ...patch },
    }));
  };

  const updateCellValue = (day: DayKey, domainId: string, patch: Partial<JournalCellValue>) => {
    const currentEntry = journalEntries[day] ?? defaultJournalEntry();
    setJournalEntries(prev => ({
      ...prev,
      [day]: {
        ...currentEntry,
        cells: {
          ...(currentEntry.cells ?? {}),
          [domainId]: {
            ...(currentEntry.cells?.[domainId] ?? { activityIds: [], contentsByActivity: {}, observation: "" }),
            ...patch,
          },
        },
      },
    }));
  };

  const toggleActivityInCell = (day: DayKey, domainId: string, activityId: string) => {
    const currentEntry = journalEntries[day] ?? defaultJournalEntry();
    const currentValue = currentEntry.cells?.[domainId] ?? { activityIds: [], contentsByActivity: {}, observation: "" };
    const nextIds = currentValue.activityIds.includes(activityId)
      ? currentValue.activityIds.filter(id => id !== activityId)
      : [...currentValue.activityIds, activityId];

    const nextContentsByActivity = { ...(currentValue.contentsByActivity ?? {}) };
    if (!nextIds.includes(activityId)) {
      delete nextContentsByActivity[activityId];
    }

    updateCellValue(day, domainId, { activityIds: nextIds, contentsByActivity: nextContentsByActivity });
  };

  const removeActivityInCell = (day: DayKey, domainId: string, activityId: string) => {
    const activity = activityOptions.find(option => option.id === activityId);
    const ok = window.confirm(`Supprimer l'activite "${activity?.label ?? activityId}" et tous ses contenus associes ?`);
    if (!ok) return;

    const currentEntry = journalEntries[day] ?? defaultJournalEntry();
    const currentValue = currentEntry.cells?.[domainId] ?? { activityIds: [], contentsByActivity: {}, observation: "" };
    const nextIds = currentValue.activityIds.filter(id => id !== activityId);
    const nextContentsByActivity = { ...(currentValue.contentsByActivity ?? {}) };
    delete nextContentsByActivity[activityId];

    updateCellValue(day, domainId, { activityIds: nextIds, contentsByActivity: nextContentsByActivity });
  };

  const persistContentSelection = async (payload: { day: DayKey; domainId: string; activityId: string; content: string }) => {
    const { day, domainId, activityId, content } = payload;
    await supabase.from(TABLES.documents).insert({
      class_id: activeClass,
      type: "planning",
      title: `JOURNAL_CONTENT|${selectedWeekLabel}|${day}|${domainId}|${encodeURIComponent(activityId)}|${encodeURIComponent(content)}`,
      subtitle: `Journal ${day}`,
      meta: "journal-content-selection",
    });
  };

  const toggleContentInCell = (day: DayKey, domainId: string, activityId: string, content: string) => {
    const currentEntry = journalEntries[day] ?? defaultJournalEntry();
    const currentValue = currentEntry.cells?.[domainId] ?? { activityIds: [], contentsByActivity: {}, observation: "" };
    const currentContents = currentValue.contentsByActivity?.[activityId] ?? [];
    const alreadySelected = currentContents.includes(content);

    const nextContents = alreadySelected
      ? currentContents.filter(item => item !== content)
      : [...currentContents, content];

    updateCellValue(day, domainId, {
      contentsByActivity: {
        ...(currentValue.contentsByActivity ?? {}),
        [activityId]: nextContents,
      },
    });

    if (!alreadySelected) {
      setDbUsedContents(prev => Array.from(new Set([...prev, content])));
      void persistContentSelection({ day, domainId, activityId, content });
    }
  };

  const usedContentForCell = (day: DayKey, domainId: string) => {
    const dayIndex = selectedWeekDays.findIndex(item => item.dayKey === day);
    if (dayIndex < 0) return [];

    const usedContents = new Set<string>(dbUsedContents);

    selectedWeekDays.forEach((weekDay, index) => {
      if (index > dayIndex) return;

      const entry = journalEntries[weekDay.dayKey];
      if (!entry) return;

      Object.entries(entry.cells ?? {}).forEach(([currentDomainId, cell]) => {
        // Exclure uniquement la cellule courante, mais inclure les autres colonnes du meme jour.
        if (index === dayIndex && currentDomainId === domainId) return;

        Object.values(cell.contentsByActivity ?? {}).forEach(contents => {
          contents.forEach(content => usedContents.add(content));
        });
      });
    });

    return Array.from(usedContents);
  };

  const handleDirectorVisa = (day: DayKey) => {
    const entry = journalEntries[day] ?? defaultJournalEntry();
    const nextStatus: VisaStatus = entry.visaStatus === "idle" ? "pending" : entry.visaStatus === "pending" ? "approved" : "approved";
    updateJournalEntry(day, { visaStatus: nextStatus });
    const message = nextStatus === "pending"
      ? `Demande de visa envoyée au directeur pour ${day} • résumé de la journée prêt.`
      : `Visa approuvé pour ${day} • le directeur a validé la saisie.`;
    setDirectorNotice(message);
  };

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

  const activityModalDomain = activityModalTarget
    ? JOURNAL_DOMAINS.find(domain => domain.id === activityModalTarget.domainId) ?? null
    : null;

  const activityModalEntry = activityModalTarget
    ? (journalEntries[activityModalTarget.day]?.cells?.[activityModalTarget.domainId] ?? { activityIds: [], contentsByActivity: {}, observation: "" })
    : null;

  const contentModalActivity = contentModalTarget
    ? activityOptions.find(option => option.id === contentModalTarget.activityId) ?? null
    : null;

  const contentModalCell = contentModalTarget
    ? (journalEntries[contentModalTarget.day]?.cells?.[contentModalTarget.domainId] ?? { activityIds: [], contentsByActivity: {}, observation: "" })
    : null;

  const contentModalSelected = contentModalTarget
    ? (contentModalCell?.contentsByActivity?.[contentModalTarget.activityId] ?? [])
    : [];

  const contentModalFiltered = contentModalTarget && contentModalActivity
    ? contentModalActivity.contents.filter(content => {
      const used = usedContentForCell(contentModalTarget.day, contentModalTarget.domainId);
      return !used.includes(content) || contentModalSelected.includes(content);
    })
    : [];

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height:"calc(100vh - 36px)", fontFamily: "'Plus Jakarta Sans', sans-serif", backgroundColor: "var(--background)" }}
    >
      {/* ── Print CSS ── */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm 10mm; }
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
          boxShadow: "0 1px 0 var(--border), 0 2px 10px rgba(0,0,0,0.08)",
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
              Cahier de journal
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

          {view === "cahier" && (
            <div className="no-print border-t border-gray-200 pt-3 pb-3 dark:border-gray-700">
              <div className="mb-2 flex items-center gap-2">
                <CalendarDays className="h-[18px] w-[18px] text-gray-700 dark:text-gray-200" />
                <p className="m-0 text-[13px] font-extrabold text-gray-900 dark:text-gray-100">{selectedWeekLabel}</p>
              </div>
              <div className="mb-2 flex flex-wrap gap-2">
                {schoolMonthOptions.map(option => (
                  <button
                    key={option.key}
                    onClick={() => {
                      setSelectedMonth(new Date(option.year, option.monthIndex, 1));
                      setSelectedWeekIndex(0);
                    }}
                    className={`rounded-full border px-3 py-2 text-xs font-bold ${selectedMonth.getMonth() === option.monthIndex ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-slate-800 dark:text-blue-300" : "border-indigo-400/40 bg-white text-gray-700 dark:border-blue-700 dark:bg-slate-900 dark:text-gray-200"}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {monthWeeks.map((week, index) => (
                  <div
                    key={`${week[0].date.toISOString()}-${index}`}
                    className={`group relative rounded-full border pr-7 ${index === selectedWeekIndex ? "border-blue-500 bg-blue-50 dark:border-blue-700 dark:bg-slate-800" : "border-indigo-400/40 bg-white dark:border-blue-700 dark:bg-slate-900"}`}
                  >
                    <button
                      onClick={() => setSelectedWeekIndex(index)}
                      className={`rounded-full px-3 py-2 text-xs font-bold ${index === selectedWeekIndex ? "text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-200"}`}
                    >
                      {formatWeekLabel((weekSaturdayPrefs[getWeekKey(week)] ?? false) ? week : week.filter(day => day.dayKey !== "Samedi"))}
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        const weekKey = getWeekKey(week);
                        setWeekSaturdayPrefs(prev => ({
                          ...prev,
                          [weekKey]: !(prev[weekKey] ?? false),
                        }));
                        setSelectedWeekIndex(index);
                      }}
                      title={(weekSaturdayPrefs[getWeekKey(week)] ?? false) ? "Retirer le samedi" : "Ajouter le samedi"}
                      className={`absolute right-1 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border text-[10px] transition-colors ${weekSaturdayPrefs[getWeekKey(week)] ?? false ? "border-emerald-500/70 bg-emerald-500/20 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "border-blue-500/40 bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:border-blue-700 dark:bg-slate-950 dark:text-blue-300"}`}
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ SEGMENTED PILL CONTROL ══════════════════════════════════════════════ */}
      <div
        className="no-print bg-card flex-shrink-0"
        style={{
          borderBottom: "1px solid var(--border)",
          boxShadow: "0 1px 6px rgba(0,0,0,0.15)",
          zIndex: 40, position: "relative",
        }}
      >
        <div style={{ maxWidth: isDesktop ? "1100px" : "680px", margin: "0 auto", padding: "8px 16px" }}>
          <div style={{
            display: "flex",
            backgroundColor: "var(--muted)",
            border: "1px solid var(--border)",
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
                color: view === "cahier" ? "var(--primary-foreground)" : "var(--muted-foreground)",
                backgroundColor: view === "cahier" ? "transparent" : "var(--card)",
                cursor: "pointer",
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
                color: view === "evaluations" ? "var(--primary-foreground)" : "var(--muted-foreground)",
                backgroundColor: view === "evaluations" ? "transparent" : "var(--card)",
                cursor: "pointer",
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

          {/* ── VIEW 1: Cahier de journal ── */}
          {view === "cahier" && (
            <div className="rounded-2xl bg-white/80 px-2 pb-8 pt-4 dark:bg-slate-900" style={{ paddingTop: "16px", paddingBottom: "32px" }}>
              {directorNotice && <div className="mb-3 rounded-xl border border-gray-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-700 dark:border-gray-700 dark:bg-blue-900/20 dark:text-blue-200"><BellRing size={14} style={{ display: "inline-block", marginRight: "6px" }} />{directorNotice}</div>}

              {isDesktop ? (
                <div style={{ overflowX: "auto" }}>
                  <table className="min-w-[1000px] w-full border-collapse border-2 border-blue-500/50 dark:border-emerald-700">
                    <thead>
                      <tr>
                        <th className="border border-blue-500/40 bg-blue-50 px-2.5 py-2.5 text-left text-[11px] uppercase text-blue-700 dark:border-blue-700 dark:bg-slate-800 dark:text-blue-300">Jour</th>
                        {JOURNAL_DOMAINS.map(domain => (
                          <th key={domain.id} className="border-2 border-indigo-400/50 bg-blue-50 px-2.5 py-2.5 text-left text-[11px] uppercase text-blue-700 dark:border-blue-700 dark:bg-slate-800 dark:text-blue-300">{domain.label}</th>
                        ))}
                        <th className="border border-blue-500/40 bg-blue-50 px-2.5 py-2.5 text-left text-[11px] uppercase text-blue-700 dark:border-blue-700 dark:bg-slate-800 dark:text-blue-300">Observations</th>
                        <th className="border border-blue-500/40 bg-blue-50 px-2.5 py-2.5 text-left text-[11px] uppercase text-blue-700 dark:border-blue-700 dark:bg-slate-800 dark:text-blue-300">Visa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedWeekDays.map(({ dayKey, date }) => {
                        const entry = journalEntries[dayKey] ?? defaultJournalEntry();
                        const dayLabel = date.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
                        return (
                          <tr key={dayKey} className="border border-blue-300/40 dark:border-slate-700">
                            <td className="min-w-[110px] border border-blue-300/40 bg-white p-2.5 align-top dark:border-slate-700 dark:bg-slate-950">
                              <div className="font-extrabold text-gray-900 dark:text-gray-100">{dayKey}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{dayLabel}</div>
                            </td>
                            {JOURNAL_DOMAINS.map(domain => (
                              <td key={domain.id} className="border-[1.5px] border-indigo-400/50 bg-white p-2 align-top dark:border-blue-700 dark:bg-slate-950">
                                <JournalCell
                                  day={dayKey}
                                  domain={domain}
                                  activityOptions={activityOptions}
                                  value={entry.cells?.[domain.id] ?? { activityIds: [], contentsByActivity: {}, observation: "" }}
                                  disabled={entry.visaStatus === "approved"}
                                  onChange={patch => updateCellValue(dayKey, domain.id, patch)}
                                  onOpenActivityModal={() => setActivityModalTarget({ day: dayKey, domainId: domain.id })}
                                  onOpenContentModal={(activityId) => setContentModalTarget({ day: dayKey, domainId: domain.id, activityId })}
                                  onRemoveActivity={(activityId) => removeActivityInCell(dayKey, domain.id, activityId)}
                                />
                              </td>
                            ))}
                            <td className="border border-blue-300/40 bg-white p-2 align-top dark:border-slate-700 dark:bg-slate-950">
                              <textarea aria-label={`Observations - ${dayKey}`} value={entry.observations} onChange={e => updateJournalEntry(dayKey, { observations: e.target.value })} disabled={entry.visaStatus === "approved"} rows={4} placeholder="Observations, incidents, points de vigilance…" className="min-h-[92px] w-full resize-y rounded-[10px] border border-blue-500/40 bg-white px-2.5 py-2 text-xs text-gray-900 dark:border-blue-700 dark:bg-slate-900 dark:text-gray-100" />
                            </td>
                            <td className="border border-blue-300/40 bg-white p-2 align-top dark:border-slate-700 dark:bg-slate-950">
                              <button onClick={() => handleDirectorVisa(dayKey)} className="min-h-[42px] rounded-full border border-blue-500/40 px-3 font-bold text-gray-900 dark:border-blue-700 dark:text-gray-100" style={{ backgroundColor: entry.visaStatus === "approved" ? "#dcfce7" : entry.visaStatus === "pending" ? "#e5e7eb" : "transparent", cursor: "pointer" }}>
                                {entry.visaStatus === "approved" ? "Approuvé" : entry.visaStatus === "pending" ? "En attente" : "Demander un visa"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {selectedWeekDays.map(({ dayKey }) => {
                    const entry = journalEntries[dayKey] ?? defaultJournalEntry();
                    const isActive = selectedDay === dayKey;
                    return (
                      <div key={dayKey} className={`overflow-hidden rounded-[14px] border-2 ${isActive ? "border-blue-500 dark:border-emerald-700" : "border-indigo-400/50 dark:border-blue-700"} bg-white dark:bg-slate-900`}>
                        <button onClick={() => setSelectedDay(dayKey)} className={`w-full border-none px-3.5 py-3 text-left font-extrabold ${isActive ? "bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-blue-300" : "bg-transparent text-gray-900 dark:text-gray-100"}`} style={{ cursor: "pointer" }}>{dayKey}</button>
                        {selectedDay === dayKey && (
                          <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                            {JOURNAL_DOMAINS.map(domain => (
                              <div key={domain.id}>
                                <p className="m-0 mb-1.5 text-xs font-bold text-gray-900 dark:text-gray-100">{domain.label}</p>
                                <JournalCell
                                  day={dayKey}
                                  domain={domain}
                                  activityOptions={activityOptions}
                                  value={entry.cells?.[domain.id] ?? { activityIds: [], contentsByActivity: {}, observation: "" }}
                                  disabled={entry.visaStatus === "approved"}
                                  onChange={patch => updateCellValue(dayKey, domain.id, patch)}
                                  onOpenActivityModal={() => setActivityModalTarget({ day: dayKey, domainId: domain.id })}
                                  onOpenContentModal={(activityId) => setContentModalTarget({ day: dayKey, domainId: domain.id, activityId })}
                                  onRemoveActivity={(activityId) => removeActivityInCell(dayKey, domain.id, activityId)}
                                />
                              </div>
                            ))}
                            <div>
                              <p className="m-0 mb-1.5 text-xs font-bold text-gray-900 dark:text-gray-100">Observations</p>
                              <textarea aria-label={`Observations - ${dayKey}`} value={entry.observations} onChange={e => updateJournalEntry(dayKey, { observations: e.target.value })} disabled={entry.visaStatus === "approved"} rows={3} placeholder="Observations du jour" className="w-full resize-y rounded-[10px] border border-blue-500/40 bg-white px-2.5 py-2 text-xs text-gray-900 dark:border-blue-700 dark:bg-slate-950 dark:text-gray-100" />
                            </div>
                            <button onClick={() => handleDirectorVisa(dayKey)} className="min-h-[42px] rounded-full border border-blue-500/40 px-3 font-bold text-gray-900 dark:border-blue-700 dark:text-gray-100" style={{ backgroundColor: entry.visaStatus === "approved" ? "#dcfce7" : entry.visaStatus === "pending" ? "#e5e7eb" : "transparent" }}>
                              {entry.visaStatus === "approved" ? "Visa approuvé" : entry.visaStatus === "pending" ? "Visa en attente" : "Demander un visa"}
                            </button>
                          </div>
                        )}
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

      <ActivityModal
        isOpen={Boolean(activityModalTarget)}
        domain={activityModalDomain}
        activityOptions={activityOptions}
        emptyActivityOptions={emptyActivityOptions}
        selectedIds={activityModalEntry?.activityIds ?? []}
        onToggle={(activityId) => {
          if (!activityModalTarget) return;
          const selected = activityModalEntry?.activityIds?.includes(activityId) ?? false;
          if (selected) {
            const activity = activityOptions.find(option => option.id === activityId);
            const ok = window.confirm(`Retirer l'activite "${activity?.label ?? activityId}" ? Les contenus lies seront supprimes.`);
            if (!ok) return;
          }
          toggleActivityInCell(activityModalTarget.day, activityModalTarget.domainId, activityId);
        }}
        onClose={() => setActivityModalTarget(null)}
      />

      <ContentModal
        isOpen={Boolean(contentModalTarget)}
        activity={contentModalActivity}
        selectedContents={contentModalSelected}
        filteredContents={contentModalFiltered}
        onToggle={(content) => {
          if (!contentModalTarget) return;
          toggleContentInCell(contentModalTarget.day, contentModalTarget.domainId, contentModalTarget.activityId, content);
        }}
        onClose={() => setContentModalTarget(null)}
      />

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
