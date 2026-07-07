import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { useGradesMutation } from "../../hooks/useGradesMutation";
import { PermissionGuard, ReadOnlyBadge } from "../../components/PermissionGuard";
import { studentsApi } from "../../services/apiService";
import { useAppContext } from "../contexts/AppContext";
import {
  ArrowLeft, Users, UserCheck, UserX,
  Plus, Upload, Printer, ChevronDown, ChevronUp,
  Search, FileText, Loader2, X, Settings, Check, AlertTriangle,
  Pencil, Trash2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

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

type AttendanceStatus = "P" | "ANJ" | "AJ" | "R"; // Present, Absent NJ, Absent J, Retard

interface GradeSet {
  t1: number; t2: number; t3: number;
}

// ─── Mock students (25 Senegalese names) ─────────────────────────────────────

const STUDENTS: Student[] = [
  { id:"1",  matricule:"CE2-001", nom:"DIALLO",   prenom:"Aminata",  genre:"F", dateNaissance:"12/03/2016", lieuNaissance:"Kolda",    tuteurNom:"Ibrahima Diallo",   tuteurPhone:"77 123 45 67" },
  { id:"2",  matricule:"CE2-002", nom:"SOW",      prenom:"Moussa",   genre:"M", dateNaissance:"05/07/2015", lieuNaissance:"Ziguinchor",tuteurNom:"Boubacar Sow",      tuteurPhone:"76 234 56 78" },
  { id:"3",  matricule:"CE2-003", nom:"NDIAYE",   prenom:"Fatou",    genre:"F", dateNaissance:"22/11/2015", lieuNaissance:"Kolda",    tuteurNom:"Oumar Ndiaye",      tuteurPhone:"70 345 67 89" },
  { id:"4",  matricule:"CE2-004", nom:"BA",       prenom:"Ibrahima", genre:"M", dateNaissance:"08/01/2016", lieuNaissance:"Sédhiou",  tuteurNom:"Mamadou Ba",        tuteurPhone:"77 456 78 90" },
  { id:"5",  matricule:"CE2-005", nom:"TRAORÉ",   prenom:"Mariama",  genre:"F", dateNaissance:"30/04/2016", lieuNaissance:"Kolda",    tuteurNom:"Djiby Traoré",      tuteurPhone:"76 567 89 01" },
  { id:"6",  matricule:"CE2-006", nom:"DIOP",     prenom:"Abdou",    genre:"M", dateNaissance:"17/09/2015", lieuNaissance:"Velingara",tuteurNom:"Alassane Diop",     tuteurPhone:"70 678 90 12" },
  { id:"7",  matricule:"CE2-007", nom:"FALL",     prenom:"Aissatou", genre:"F", dateNaissance:"03/06/2016", lieuNaissance:"Kolda",    tuteurNom:"Seydou Fall",       tuteurPhone:"77 789 01 23" },
  { id:"8",  matricule:"CE2-008", nom:"KANE",     prenom:"Cheikh",   genre:"M", dateNaissance:"25/12/2015", lieuNaissance:"Kolda",    tuteurNom:"Modou Kane",        tuteurPhone:"76 890 12 34" },
  { id:"9",  matricule:"CE2-009", nom:"MBAYE",    prenom:"Rokhaya",  genre:"F", dateNaissance:"14/02/2016", lieuNaissance:"Diaobé",   tuteurNom:"Lamine Mbaye",      tuteurPhone:"70 901 23 45" },
  { id:"10", matricule:"CE2-010", nom:"SARR",     prenom:"Omar",     genre:"M", dateNaissance:"09/08/2015", lieuNaissance:"Kolda",    tuteurNom:"Pape Sarr",         tuteurPhone:"77 012 34 56" },
  { id:"11", matricule:"CE2-011", nom:"THIAM",    prenom:"Ndèye",    genre:"F", dateNaissance:"20/05/2016", lieuNaissance:"Kolda",    tuteurNom:"Saliou Thiam",      tuteurPhone:"76 123 45 67" },
  { id:"12", matricule:"CE2-012", nom:"KONATÉ",   prenom:"Mamadou",  genre:"M", dateNaissance:"11/10/2015", lieuNaissance:"Médina Y.", tuteurNom:"Yaya Konaté",       tuteurPhone:"70 234 56 78" },
  { id:"13", matricule:"CE2-013", nom:"CISSÉ",    prenom:"Awa",      genre:"F", dateNaissance:"28/07/2016", lieuNaissance:"Kolda",    tuteurNom:"Bakary Cissé",      tuteurPhone:"77 345 67 89" },
  { id:"14", matricule:"CE2-014", nom:"FAYE",     prenom:"Aliou",    genre:"M", dateNaissance:"06/03/2015", lieuNaissance:"Kolda",    tuteurNom:"Gora Faye",         tuteurPhone:"76 456 78 90" },
  { id:"15", matricule:"CE2-015", nom:"TOURÉ",    prenom:"Bineta",   genre:"F", dateNaissance:"19/11/2015", lieuNaissance:"Sédhiou",  tuteurNom:"Alpha Touré",       tuteurPhone:"70 567 89 01" },
  { id:"16", matricule:"CE2-016", nom:"DIALLO",   prenom:"Souleymane",genre:"M",dateNaissance:"01/06/2016", lieuNaissance:"Kolda",    tuteurNom:"Mamadou Diallo",    tuteurPhone:"77 678 90 12" },
  { id:"17", matricule:"CE2-017", nom:"BADJI",    prenom:"Coumba",   genre:"F", dateNaissance:"13/08/2015", lieuNaissance:"Ziguinchor",tuteurNom:"François Badji",    tuteurPhone:"76 789 01 23" },
  { id:"18", matricule:"CE2-018", nom:"NIANG",    prenom:"Abdoulaye",genre:"M", dateNaissance:"24/01/2016", lieuNaissance:"Kolda",    tuteurNom:"Habib Niang",       tuteurPhone:"70 890 12 34" },
  { id:"19", matricule:"CE2-019", nom:"FALL",     prenom:"Mame Diarra",genre:"F",dateNaissance:"07/04/2016",lieuNaissance:"Velingara",tuteurNom:"Cheikh Fall",        tuteurPhone:"77 901 23 45" },
  { id:"20", matricule:"CE2-020", nom:"DIOUF",    prenom:"Pape",     genre:"M", dateNaissance:"16/09/2015", lieuNaissance:"Kolda",    tuteurNom:"Assane Diouf",      tuteurPhone:"76 012 34 56" },
  { id:"21", matricule:"CE2-021", nom:"BARRY",    prenom:"Yacine",   genre:"F", dateNaissance:"29/12/2015", lieuNaissance:"Kolda",    tuteurNom:"Boubacar Barry",    tuteurPhone:"70 123 45 67" },
  { id:"22", matricule:"CE2-022", nom:"GUEYE",    prenom:"Lamine",   genre:"M", dateNaissance:"10/05/2016", lieuNaissance:"Médina Y.", tuteurNom:"Papa Gueye",        tuteurPhone:"77 234 56 78" },
  { id:"23", matricule:"CE2-023", nom:"KEITA",    prenom:"Oumou",    genre:"F", dateNaissance:"23/02/2015", lieuNaissance:"Kolda",    tuteurNom:"Tierno Keita",      tuteurPhone:"76 345 67 89" },
  { id:"24", matricule:"CE2-024", nom:"BALDÉ",    prenom:"Thierno",  genre:"M", dateNaissance:"04/07/2015", lieuNaissance:"Kolda",    tuteurNom:"Elhadj Baldé",      tuteurPhone:"70 456 78 90" },
  { id:"25", matricule:"CE2-025", nom:"DIENG",    prenom:"Khady",    genre:"F", dateNaissance:"15/10/2016", lieuNaissance:"Sédhiou",  tuteurNom:"Sidy Dieng",        tuteurPhone:"77 567 89 01" },
];

// ─── Mock grades (out of 10 per discipline) ───────────────────────────────────

const BASE_GRADES: Record<string, GradeSet> = {
  "Compréhension":        { t1:7.5,  t2:7.0,  t3:8.0  },
  "Vocabulaire":          { t1:6.5,  t2:7.5,  t3:7.0  },
  "Grammaire":            { t1:6.0,  t2:6.5,  t3:7.0  },
  "Orthographe":          { t1:5.5,  t2:6.0,  t3:6.5  },
  "Production d'écrit":   { t1:6.0,  t2:6.5,  t3:7.0  },
  "Act. Numériques":      { t1:7.0,  t2:7.5,  t3:8.0  },
  "Act. de Mesure":       { t1:6.5,  t2:7.0,  t3:7.5  },
  "Act. Géométriques":    { t1:7.0,  t2:6.5,  t3:7.0  },
  "Résol. de Problèmes":  { t1:6.0,  t2:6.5,  t3:7.0  },
  "Histoire":             { t1:7.5,  t2:8.0,  t3:8.0  },
  "Géographie":           { t1:7.0,  t2:7.5,  t3:7.5  },
  "IST":                  { t1:7.0,  t2:7.0,  t3:7.5  },
  "Vivre dans son milieu":{ t1:8.0,  t2:8.0,  t3:8.5  },
  "Vivre ensemble":       { t1:8.5,  t2:8.0,  t3:9.0  },
  "Éducation Musicale":   { t1:8.0,  t2:8.5,  t3:9.0  },
  "Arts Plastiques":      { t1:9.0,  t2:8.5,  t3:9.0  },
  "EPS":                  { t1:9.5,  t2:9.0,  t3:9.5  },
};

function getStudentGrades(id: string): Record<string, GradeSet> {
  const seed = parseInt(id);
  const result: Record<string, GradeSet> = {};
  Object.entries(BASE_GRADES).forEach(([k, v]) => {
    const delta = ((seed * 3 + k.length) % 5 - 2) * 0.25;
    result[k] = {
      t1: Math.min(10, Math.max(0, +(v.t1 + delta).toFixed(2))),
      t2: Math.min(10, Math.max(0, +(v.t2 + delta * 0.8).toFixed(2))),
      t3: Math.min(10, Math.max(0, +(v.t3 + delta * 0.6).toFixed(2))),
    };
  });
  return result;
}

// ─── School months with realistic day labels ──────────────────────────────────

const SCHOOL_MONTHS = [
  { label:"Octobre",   short:"Oct", days:["01/10","02/10","03/10","04/10","07/10","08/10","09/10","10/10","11/10","14/10","15/10","16/10","17/10","18/10","21/10","22/10","23/10","24/10","25/10","28/10"] },
  { label:"Novembre",  short:"Nov", days:["04/11","05/11","06/11","07/11","08/11","12/11","13/11","14/11","15/11","18/11","19/11","20/11","21/11","22/11","25/11","26/11","27/11","28/11","29/11"] },
  { label:"Décembre",  short:"Déc", days:["02/12","03/12","04/12","05/12","06/12","09/12","10/12","11/12","12/12","13/12","16/12","17/12","18/12","19/12","20/12"] },
  { label:"Janvier",   short:"Jan", days:["06/01","07/01","08/01","09/01","10/01","13/01","14/01","15/01","16/01","17/01","20/01","21/01","22/01","23/01","24/01","27/01","28/01","29/01","30/01","31/01"] },
  { label:"Février",   short:"Fév", days:["03/02","04/02","05/02","06/02","07/02","10/02","11/02","12/02","13/02","14/02","17/02","18/02","19/02","20/02","21/02","24/02","25/02","26/02","27/02","28/02"] },
  { label:"Mars",      short:"Mar", days:["03/03","04/03","05/03","06/03","07/03","10/03","11/03","12/03","13/03","14/03","17/03","18/03","19/03","20/03","21/03","24/03","25/03","26/03","27/03","28/03"] },
  { label:"Avril",     short:"Avr", days:["01/04","02/04","03/04","04/04","07/04","08/04","09/04","10/04","11/04","14/04","15/04","16/04","17/04","22/04","23/04","24/04","25/04","28/04","29/04","30/04"] },
  { label:"Mai",       short:"Mai", days:["05/05","06/05","07/05","08/05","09/05","12/05","13/05","14/05","15/05","16/05","19/05","20/05","21/05","22/05","23/05","26/05","27/05","28/05","29/05","30/05"] },
  { label:"Juin",      short:"Jun", days:["02/06","03/06","04/06","05/06","06/06","09/06","10/06","11/06","12/06","13/06","16/06","17/06","18/06","19/06","20/06"] },
];

function getAttendance(studentId: string, count: number): AttendanceStatus[] {
  const seed = parseInt(studentId);
  return Array.from({ length: count }, (_, i) => {
    const r = ((seed * 7 + i * 13) % 20);
    if (r < 15) return "P" as AttendanceStatus;
    if (r < 17) return "ANJ" as AttendanceStatus;
    if (r < 19) return "AJ" as AttendanceStatus;
    return "R" as AttendanceStatus;
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avg(grades: Record<string, GradeSet>, trimestre: 1|2|3): number {
  const vals = Object.values(grades).map(g =>
    trimestre === 1 ? g.t1 : trimestre === 2 ? g.t2 : g.t3
  );
  return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
}

// Normalized average: each included discipline score is divided by its max_score
// then scaled to /10, ensuring consistent ranking across mixed scales.
// disciplineConfig: if provided, disciplines with value === false are excluded.
function computeWeightedAvg(
  grades: Record<string, GradeSet>,
  trimestre: 1|2|3,
  schema: Record<string, number>,
  disciplineConfig?: Record<string, boolean>,
): number {
  const entries = Object.entries(grades).filter(([disc]) =>
    !disciplineConfig || disciplineConfig[disc] !== false
  );
  if (!entries.length) return 0;
  const normalized = entries.map(([disc, g]) => {
    const raw = trimestre === 1 ? g.t1 : trimestre === 2 ? g.t2 : g.t3;
    const max = schema[disc] ?? 10;
    return max > 0 ? (raw / max) * 10 : 0;
  });
  return +(normalized.reduce((a, b) => a + b, 0) / normalized.length).toFixed(2);
}

// Default max score for every discipline (10-point scale).
// Teachers can override per-discipline via the grade schema config panel.
const DEFAULT_GRADE_SCHEMA: Record<string, number> =
  Object.fromEntries(Object.keys(BASE_GRADES).map(k => [k, 10]));

// ─── useBulletinValidation — checks completeness before enabling calculation ──
// A grade is "missing" when its trimestre slot is null/undefined/NaN.
// With seeded mock data every slot is filled; in Supabase, unsynced grades are null.
function useBulletinValidation(
  grades: Record<string, GradeSet>,
  disciplineConfig: Record<string, boolean>,
  trimestre: 1|2|3,
) {
  return useMemo(() => {
    const tKey: keyof GradeSet = trimestre === 1 ? "t1" : trimestre === 2 ? "t2" : "t3";
    const included = ALL_DISCIPLINES.filter(d => disciplineConfig[d] !== false);
    const missing  = included.filter(d => {
      const val = grades[d]?.[tKey];
      return val === null || val === undefined || (typeof val === "number" && isNaN(val));
    });
    return {
      isComplete:   missing.length === 0,
      missing,
      includedCount: included.length,
      excludedCount: ALL_DISCIPLINES.length - included.length,
    };
  }, [grades, disciplineConfig, trimestre]);
}

function totalAbsencesNJ(att: AttendanceStatus[]): number {
  return att.filter(a => a === "ANJ").length;
}

const DOMAINS = [
  {
    label: "FRANÇAIS / LANGUE & COMMUNICATION",
    color: "#7c3aed",
    disciplines: ["Compréhension","Vocabulaire","Grammaire","Orthographe","Production d'écrit"],
  },
  {
    label: "MATHÉMATIQUES",
    color: "#2563eb",
    disciplines: ["Act. Numériques","Act. de Mesure","Act. Géométriques","Résol. de Problèmes"],
  },
  {
    label: "DÉCOUVERTE DU MONDE",
    color: "#059669",
    disciplines: ["Histoire","Géographie","IST"],
  },
  {
    label: "ÉDUCATION AU DÉVELOPPEMENT DURABLE",
    color: "#166534",
    disciplines: ["Vivre dans son milieu","Vivre ensemble"],
  },
  {
    label: "ARTS & SPORT",
    color: "#ea580c",
    disciplines: ["Éducation Musicale","Arts Plastiques","EPS"],
  },
];

// All discipline keys in DOMAINS order — used for validation and config.
const ALL_DISCIPLINES = DOMAINS.flatMap(d => d.disciplines);

const STATUS_CFG = {
  P:   { label:"P",   color:"#059669", bg:"#dcfce7", title:"Présent" },
  ANJ: { label:"ANJ", color:"#dc2626", bg:"#fee2e2", title:"Absent Non Justifié" },
  AJ:  { label:"AJ",  color:"#d97706", bg:"#fef3c7", title:"Absent Justifié" },
  R:   { label:"R",   color:"#2563eb", bg:"#dbeafe", title:"Retard" },
};

// ─── BulletinBody — reusable bulletin (screen: compressed | print: authoritative) ──

interface BulletinBodyProps {
  student:        Student;
  grades:         Record<string, GradeSet>;
  trimestre:      1|2|3;
  moyT3:          number;
  absNJ:          number;
  decision:       { label: string; color: string; bg: string };
  // Interactive grading props (optional — omit in print/batch mode)
  onGradeChange?:    (discipline: string, t: 1|2|3, value: number) => void;
  gradeSchema?:      Record<string, number>;
  rank?:             number;
  disciplineConfig?: Record<string, boolean>; // global inclusion toggles
  onToggle?:         (discipline: string) => void;
}

function BulletinBody({
  student, grades, trimestre, moyT3, absNJ, decision,
  onGradeChange, gradeSchema, rank: rankProp,
  disciplineConfig, onToggle,
}: BulletinBodyProps) {
  const moyTrim = moyT3;

  // ── Quarterly column logic ──────────────────────────────────────────────────
  const scoreCols: Array<1|2|3> = trimestre === 3 ? [1, 2, 3] : [trimestre as 1|2];
  const hasToggle  = !!onToggle;
  // colCount: checkbox? + discipline + score cols. Used for domain row colSpan.
  const colCount   = (hasToggle ? 1 : 0) + 1 + scoreCols.length;
  const scoreOf    = (g: GradeSet | undefined, t: 1|2|3): number | undefined =>
    t === 1 ? g?.t1 : t === 2 ? g?.t2 : g?.t3;

  // ── Dynamic rank (from parent) or estimate ─────────────────────────────────
  const rank = rankProp ?? Math.ceil(parseInt(student.id) / 2);
  const statsRows =
    trimestre === 1 ? [
      { label:"Moy. T1",   value:`${moyTrim.toFixed(2)}/10`,                                     color: moyTrim>=5?"#059669":"#dc2626" },
      { label:"Rang",      value:`${rank}e / 25`,                                                  color:"#475569" },
      { label:"Abs. NJ",   value:`${absNJ} j`,                                                    color: absNJ>3?"#dc2626":"#059669" },
    ] : trimestre === 2 ? [
      { label:"Moy. T1",   value:`${avg(grades,1).toFixed(2)}/10`,                               color:"#94a3b8" },
      { label:"Moy. T2",   value:`${moyTrim.toFixed(2)}/10`,                                     color: moyTrim>=5?"#059669":"#dc2626" },
      { label:"Rang",      value:`${rank}e / 25`,                                                  color:"#475569" },
      { label:"Abs. NJ",   value:`${absNJ} j`,                                                    color: absNJ>3?"#dc2626":"#059669" },
    ] : [
      { label:"Moy. T1",   value:`${avg(grades,1).toFixed(2)}/10`,                               color:"#94a3b8" },
      { label:"Moy. T2",   value:`${avg(grades,2).toFixed(2)}/10`,                               color:"#94a3b8" },
      { label:"Moy. T3",   value:`${moyTrim.toFixed(2)}/10`,                                     color: moyTrim>=5?"#059669":"#dc2626" },
      { label:"Moy. Gén.", value:`${((avg(grades,1)+avg(grades,2)+moyTrim)/3).toFixed(2)}/10`,   color:"#1a365d" },
      { label:"Rang",      value:`${rank}e / 25`,                                                  color:"#475569" },
      { label:"Abs. NJ",   value:`${absNJ} j`,                                                    color: absNJ>3?"#dc2626":"#059669" },
    ];
  const statsGridCols = trimestre === 2 ? "repeat(4, 1fr)" : "repeat(3, 1fr)";
  const trimLabel = trimestre === 1 ? "1er" : trimestre === 2 ? "2ème" : "3ème";

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>

      {/* ══ TITLE — zero gap above; this is literally the first element ══════ */}
      <div style={{ textAlign:"center", borderBottom:"2px solid #1a365d",
                    paddingTop:0, paddingBottom:"5px", marginBottom:"4px" }}>
        <p className="bi-title"
           style={{ fontSize:"14px", fontWeight:900, color:"#1a365d",
                    textTransform:"uppercase", letterSpacing:"0.10em", margin:0 }}>
          Bulletin de Notes Trimestrielles
        </p>
        <p style={{ fontSize:"9px", color:"#64748b", margin:"1px 0 0", letterSpacing:"0.04em" }}>
          {trimLabel} Trimestre &nbsp;·&nbsp; Année Scolaire 2025–2026
        </p>
      </div>

      {/* ══ IDENTIFICATION GRID ═══════════════════════════════════════════════
          Left col:  ÉLÈVE, CLASSE, IEF, DATE DE NAISS., TUTEUR/PARENT
          Right col: MATRICULE, TRIMESTRE, ÉCOLE, LIEU DE NAISS., ANNÉE
          Light-blue tint, minimal internal padding, unified typography.   */}
      <div style={{
        backgroundColor: "#eff6ff",          /* subtle blue tint */
        borderRadius:    "5px",
        border:          "1px solid #bfdbfe", /* soft blue border */
        padding:         "4px 8px",
        marginBottom:    "4px",
      }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2px 12px" }}>
          {([
            ["Élève",           `${student.nom} ${student.prenom}`],
            ["Matricule",       student.matricule],
            ["Classe",          activeClass],
            ["Trimestre",       `${trimLabel} Trimestre`],
            ["IEF",             "Inspection de Kolda"],
            ["École",           "Ilyaou Mamadou SEYDI"],
            ["Date de naiss.",  student.dateNaissance],
            ["Lieu de naiss.",  student.lieuNaissance],
            ["Tuteur / Parent", student.tuteurNom],
            ["Année scolaire",  "2025–2026"],
          ] as [string, string][]).map(([l, v]) => (
            <div key={l} style={{ lineHeight:1.35, wordBreak:"break-word" }}>
              <span className="bi-student-label"
                    style={{ fontSize:"8px", fontWeight:700, color:"#64748b",
                             textTransform:"uppercase", letterSpacing:"0.04em" }}>
                {l}:&nbsp;
              </span>
              <span className="bi-student-val"
                    style={{ fontSize:"9px", fontWeight:700, color:"#1a365d" }}>
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ GRADE TABLE — quarterly columns ══════════════════════════════════
          T1 & T2: single score column (current term only).
          T3:      three columns + cumulative stats below.                  */}
      <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:"4px" }}>
        <thead>
          <tr style={{ backgroundColor:"#1a365d" }}>
            {/* Checkbox column — screen only, hidden in print */}
            {hasToggle && (
              <th className="no-print"
                  style={{ padding:"3px 6px", width:"28px", textAlign:"center",
                           color:"rgba(255,255,255,0.7)", fontSize:"9px" }}
                  title="Inclure / Exclure">
                ✓
              </th>
            )}
            <th className="bi-th"
                style={{ padding:"3px 8px", textAlign:"left", color:"#fff",
                         fontWeight:800, fontSize:"10px", letterSpacing:"0.04em" }}>
              DISCIPLINE / ACTIVITÉ
            </th>
            {scoreCols.map(t => (
              <th key={t} className="bi-th"
                  style={{ padding:"3px 8px", textAlign:"center", color:"#fff",
                           fontWeight:800, fontSize:"10px",
                           width: trimestre === 3 ? "60px" : "100px" }}>
                T{t} /10
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DOMAINS.map((dom, di) => (
            <React.Fragment key={`dom-${di}`}>
              {/* Domain header — bold, color-coded */}
              <tr>
                <td className="bi-domain-td" colSpan={colCount} style={{
                  padding:"2px 8px",
                  backgroundColor:`${dom.color}18`,
                  fontWeight:900, fontSize:"10px", color:dom.color,
                  textTransform:"uppercase", letterSpacing:"0.05em",
                  borderLeft:`4px solid ${dom.color}`,
                  borderTop:"1px solid #e2e8f0",
                }}>
                  {dom.label}
                </td>
              </tr>
              {/* Discipline rows */}
              {dom.disciplines.map((disc, ri) => {
                const g       = grades[disc];
                const enabled = !disciplineConfig || disciplineConfig[disc] !== false;
                return (
                  <tr key={disc} style={{
                    backgroundColor: !enabled
                      ? "#f9fafb"
                      : ri%2===0 ? "#fff" : "#f9fafb",
                    opacity: enabled ? 1 : 0.45,
                  }}>
                    {/* Inclusion toggle checkbox */}
                    {hasToggle && (
                      <td className="no-print"
                          style={{ padding:"2px 6px", textAlign:"center",
                                   borderBottom:"1px solid #e5e7eb" }}>
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() => onToggle?.(disc)}
                          title={enabled ? "Exclure de l'évaluation" : "Inclure dans l'évaluation"}
                          style={{ cursor:"pointer", width:"14px", height:"14px",
                                   accentColor:"#1a365d" }}
                        />
                      </td>
                    )}
                    <td className="bi-disc-name"
                        style={{ padding:"2px 8px 2px 13px", fontSize:"10.5px",
                                 color: enabled ? "#1e293b" : "#94a3b8",
                                 fontWeight:600,
                                 textDecoration: enabled ? "none" : "line-through",
                                 borderBottom:"1px solid #e5e7eb" }}>
                      {disc}
                    </td>
                    {scoreCols.map(t => {
                      const score  = scoreOf(g, t);
                      const maxS   = gradeSchema?.[disc] ?? 10;
                      const half   = maxS / 2;
                      const isPass = (score ?? 0) >= half;
                      const scoreColor = isPass ? "#059669" : "#dc2626";
                      return (
                        <td key={t} className="bi-score"
                            style={{
                              padding:"2px 4px", textAlign:"center",
                              fontWeight:800, fontSize:"12px",
                              borderBottom:"1px solid #e5e7eb",
                              borderLeft:"1px solid #f1f5f9",
                              color: scoreColor,
                              /* Give the cell a visible background when editable */
                              backgroundColor: onGradeChange
                                ? (isPass ? "#f0fdf4" : "#fef2f2")
                                : "transparent",
                            }}>
                          {onGradeChange ? (
                            /* ── Live-grading input — clearly visible field ── */
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.25"
                              min={0}
                              max={maxS}
                              value={score ?? 0}
                              onChange={e => {
                                const v = Math.min(maxS, Math.max(0,
                                  parseFloat(e.target.value) || 0));
                                onGradeChange(disc, t, v);
                              }}
                              style={{
                                width:"100%", minWidth:"56px",
                                border:`1.5px solid ${isPass ? "#86efac" : "#fca5a5"}`,
                                borderRadius:"5px",
                                background: isPass ? "#f0fdf4" : "#fef2f2",
                                textAlign:"center", fontWeight:800,
                                fontSize:"12px", color: scoreColor,
                                outline:"none",
                                padding:"3px 4px",
                                cursor:"text", fontFamily:"inherit",
                                WebkitAppearance:"none",
                                MozAppearance:"textfield" as React.CSSProperties["MozAppearance"],
                                boxShadow:`0 0 0 2px ${isPass ? "#bbf7d020" : "#fecaca20"}`,
                                transition:"border-color 150ms, box-shadow 150ms",
                              }}
                              onFocus={e => {
                                e.currentTarget.style.border = `1.5px solid ${isPass ? "#22c55e" : "#ef4444"}`;
                                e.currentTarget.style.boxShadow = `0 0 0 3px ${isPass ? "#bbf7d060" : "#fecaca60"}`;
                              }}
                              onBlur={e => {
                                e.currentTarget.style.border = `1.5px solid ${isPass ? "#86efac" : "#fca5a5"}`;
                                e.currentTarget.style.boxShadow = `0 0 0 2px ${isPass ? "#bbf7d020" : "#fecaca20"}`;
                              }}
                            />
                          ) : (
                            score !== undefined ? score.toFixed(2) : "—"
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* ══ STATISTICS — scoped to active trimestre ═══════════════════════════
          T1: 3 cells   T2: 4 cells   T3: 6 cells (3×2 grid)               */}
      <div style={{ display:"grid", gridTemplateColumns:statsGridCols,
                    gap:"3px", marginBottom:"4px" }}>
        {statsRows.map(m => (
          <div key={m.label} className="bi-stat-cell"
               style={{ padding:"3px 6px", borderRadius:"4px",
                        backgroundColor:"var(--muted)", border:"1px solid var(--border)" }}>
            <p className="bi-stat-label"
               style={{ fontSize:"6.5px", color:"#64748b", fontWeight:700,
                        textTransform:"uppercase", letterSpacing:"0.05em", margin:0 }}>
              {m.label}
            </p>
            <p className="bi-stat-value"
               style={{ fontSize:"11px", fontWeight:800, color:m.color, margin:0 }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Decision badge — T3 only */}
      {trimestre === 3 && (
        <div className="bi-decision"
             style={{ padding:"4px 10px", borderRadius:"5px", marginBottom:"4px",
                      backgroundColor:decision.bg, border:`2px solid ${decision.color}` }}>
          <p style={{ fontSize:"7px", fontWeight:800, color:decision.color,
                      textTransform:"uppercase", letterSpacing:"0.06em", margin:0 }}>
            DÉCISION DU CONSEIL DE CLASSE
          </p>
          <p style={{ fontSize:"11px", fontWeight:800, color:decision.color, margin:0 }}>
            {decision.label}
          </p>
          <p style={{ fontSize:"7px", color:`${decision.color}99`, margin:0 }}>
            Moy. du trimestre : {moyTrim.toFixed(2)}/10
          </p>
        </div>
      )}

      {/* ══ SIGNATURE BLOCK ═══════════════════════════════════════════════════
          margin-top: auto = CSS push-to-bottom inside a flex column.
          All freed vertical space (removed institutional header) pools here.
          120px minimum guarantees room for stamps and handwritten signatures.
          Two columns: Le Maître (left) · Le Directeur (right).            */}
      <div className="bi-signature-block"
           style={{ marginTop:"auto",
                    paddingTop:"8px",
                    borderTop:"2px solid #1a365d",
                    display:"grid",
                    gridTemplateColumns:"1fr 1fr",
                    gap:"40px",
                    minHeight:"120px",
                    flexShrink:0 }}>
        {[
          { label:"Le Maître",    sub:"Nom & Signature — Cachet" },
          { label:"Le Directeur", sub:"Cachet officiel — Signature" },
        ].map(({ label, sub }) => (
          <div key={label}
               style={{ textAlign:"center",
                        display:"flex", flexDirection:"column",
                        justifyContent:"flex-end",
                        minHeight:"110px" }}>
            <p className="bi-sig-name"
               style={{ fontSize:"9px", fontWeight:700, color:"#1a365d",
                        textTransform:"uppercase", letterSpacing:"0.04em",
                        margin:"0 0 28px" }}>
              {label}
            </p>
            <div>
              <div className="bi-sig-line"
                   style={{ borderBottom:"1px solid #94a3b8" }} />
              <p className="bi-sig-caption"
                 style={{ fontSize:"6.5px", color:"#94a3b8", margin:"3px 0 0" }}>
                {sub}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sorting types & options (module-level — shared by modal and parent) ─────

type SortKey = "alpha" | "merit-best" | "merit-worst";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "alpha",       label: "A–Z Nom" },
  { key: "merit-best",  label: "Meilleur en premier" },
  { key: "merit-worst", label: "Plus faible en premier" },
];

// ─── Batch print CSS (injected via the isolation style element) ──────────────
const BATCH_PRINT_CSS = `
  /* ── Global setup (applies inside the isolated print document) ── */
  *, *::before, *::after { box-sizing: border-box; }
  body { margin:0; font-family:Arial,Helvetica,sans-serif; background:#fff;
         -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  @page { size:A4 portrait; margin:0; }
  .no-print { display:none !important; }

  /* ── bi-* print typography (global so they apply to all inner content) ── */
  .bi-title         { font-size:16pt !important; font-weight:900 !important; letter-spacing:0.09em !important; }
  .bi-student-label { font-size:8pt  !important; font-weight:700 !important; text-transform:uppercase !important; }
  .bi-student-val   { font-size:10pt !important; font-weight:700 !important; }
  .bi-th            { padding:3pt 7pt !important; font-size:9pt   !important; }
  .bi-domain-td     { padding:2pt 8pt !important; font-size:9.5pt !important; font-weight:900 !important; }
  .bi-disc-name     { padding:2pt 7pt 2pt 12pt !important; font-size:9pt !important; font-weight:600 !important; }
  .bi-score         { padding:2pt 7pt !important; font-size:11pt !important; font-weight:800 !important; }
  .bi-stat-cell     { padding:2pt 5pt !important; }
  .bi-stat-label    { font-size:6.5pt !important; margin:0 !important; }
  .bi-stat-value    { font-size:10pt  !important; font-weight:800 !important; margin:0 !important; }
  .bi-signature-block { min-height:80px !important; margin-top:auto !important;
                         border-top:2pt solid #1a365d !important; padding-top:8px !important; }
  .bi-sig-name    { font-size:9pt   !important; font-weight:700 !important; margin:0 0 20px !important; }
  .bi-sig-line    { border-bottom:1pt solid #94a3b8 !important; }
  .bi-sig-caption { font-size:7.5pt !important; color:#6b7280 !important; }

  /* ═══════════════════════════════════════════════════════════════════════════
     A4 PAGE ENFORCEMENT — strictement dans @media print
     ═══════════════════════════════════════════════════════════════════════════ */
  @media print {

    /* 1. Nettoyage total du flux d'impression.
          contain:none — désactive l'optimisation de "containment" que les
          navigateurs mobiles appliquent pour isoler les blocs, ce qui fusionne
          tous les bulletins dans le même espace de rendu → superposition.    */
    body, #root, #ecole-print-portal {
      margin:   0 !important;
      padding:  0 !important;
      height:   auto !important;
      overflow: visible !important;
      contain:  none !important;
    }
    #ecole-print-portal {
      display: block !important;
      width:   100% !important;
      contain: none !important;
    }

    /* 2. Chaque bulletin = une page A4 complète en flex-column.
          justify-content:space-between pousse .footer-signatures tout en bas
          et laisse .bulletin-content-body occuper le reste (flex-grow:1).
          height:290mm = A4 avec marges mobiles intégrées dans le padding.
          Pas de page-break-before : provoquerait une page blanche initiale. */
    .bulletin-page {
      display:            flex !important;
      flex-direction:     column !important;
      justify-content:    space-between !important;
      width:              100% !important;
      height:             290mm !important;
      padding:            10mm !important;
      box-sizing:         border-box !important;
      page-break-after:   always !important;
      break-after:        page !important;
      page-break-before:  auto !important;
      break-before:       auto !important;
      page-break-inside:  avoid !important;
      break-inside:       avoid !important;
      margin:             0 !important;
      background:         #fff !important;
      contain:            none !important;
    }
    .bulletin-page:last-child {
      page-break-after: auto !important;
      break-after:      auto !important;
    }

    /* 3. Corps du bulletin : occupe tout l'espace vertical disponible
          entre le haut de la page et le bloc signatures.                   */
    .bulletin-content-body {
      flex-grow:      1 !important;
      display:        flex !important;
      flex-direction: column !important;
    }

    /* 4. Bloc signatures : ancré en bas, jamais coupé par une fin de page. */
    .footer-signatures {
      width:              100% !important;
      break-inside:       avoid !important;
      page-break-inside:  avoid !important;
      margin-top:         auto !important;
      padding-top:        20px !important;
      flex-shrink:        0 !important;
    }

    /* 5. Anti-superposition mobile : tout positionnement absolu/fixe renvoyé
          au flux normal (spécificité 0,0,0 → surchargé par les règles ci-dessus). */
    .bulletin-page * {
      position: static !important;
    }

    /* 6. Réglage fin : line-height légèrement étendu sur les cellules du
          tableau pour que les notes remplissent naturellement l'espace vertical
          sans être ni trop serrées ni trop aérées.                           */
    .bulletin-page td, .bulletin-page th {
      line-height: 1.55 !important;
    }
  }
`;

// ─── buildOneBulletinHtml ─────────────────────────────────────────────────────
// Generates the HTML for a single student's bulletin as a pure template string.
// Zero React / Zero DOM — no components rendered, no nodes created or cloned.
// This is the only approach that is guaranteed crash-free on mobile browsers.
function buildOneBulletinHtml(
  student:     Student,
  grades:      Record<string, GradeSet>,
  trimestre:   1|2|3,
  schema:      Record<string, number>,
  rank:        number,
  absNJ:       number,
): string {
  const trimLabel  = trimestre === 1 ? "1er" : trimestre === 2 ? "2ème" : "3ème";
  const moy        = computeWeightedAvg(grades, trimestre, schema);
  const scoreCols: Array<1|2|3> = trimestre === 3 ? [1, 2, 3] : [trimestre as 1|2];
  const scoreOf    = (g: GradeSet | undefined, t: 1|2|3) =>
    t === 1 ? g?.t1 : t === 2 ? g?.t2 : g?.t3;

  // ── Grade table rows ──────────────────────────────────────────────────────
  const tableHead = scoreCols.map(t =>
    `<th style="padding:3px 8px;text-align:center;color:#fff;font-weight:800;font-size:9pt;width:${trimestre===3?"60px":"100px"}">T${t} /10</th>`
  ).join("");

  const tableBody = DOMAINS.map(dom => {
    const domRow = `<tr><td colspan="${1+scoreCols.length}" style="padding:2px 8px;background:${dom.color}18;font-weight:900;font-size:9pt;color:${dom.color};text-transform:uppercase;letter-spacing:.05em;border-left:4px solid ${dom.color};border-top:1px solid #e2e8f0">${dom.label}</td></tr>`;
    const discRows = dom.disciplines.map((disc, ri) => {
      const g   = grades[disc];
      const max = schema[disc] ?? 10;
      const cells = scoreCols.map(t => {
        const sc   = scoreOf(g, t);
        const pass = (sc ?? 0) >= max / 2;
        return `<td style="padding:2px 7px;text-align:center;font-weight:800;font-size:11pt;color:${pass?"#059669":"#dc2626"};border-bottom:1px solid #e5e7eb;border-left:1px solid #f1f5f9">${sc !== undefined ? sc.toFixed(2) : "—"}</td>`;
      }).join("");
      return `<tr style="background:${ri%2===0?"#fff":"#f9fafb"}"><td style="padding:2px 7px 2px 13px;font-size:9pt;color:#1e293b;font-weight:600;border-bottom:1px solid #e5e7eb">${disc}</td>${cells}</tr>`;
    }).join("");
    return domRow + discRows;
  }).join("");

  // ── Statistics ────────────────────────────────────────────────────────────
  const a1 = avg(grades, 1), a2 = avg(grades, 2);
  const statCells = (trimestre === 1
    ? [["Moy. T1", `${moy.toFixed(2)}/10`, moy>=5?"#059669":"#dc2626"],["Rang",`${rank}e/25`,"#475569"],["Abs. NJ",`${absNJ} j`,absNJ>3?"#dc2626":"#059669"]]
    : trimestre === 2
    ? [["Moy. T1",`${a1.toFixed(2)}/10`,"#94a3b8"],["Moy. T2",`${moy.toFixed(2)}/10`,moy>=5?"#059669":"#dc2626"],["Rang",`${rank}e/25`,"#475569"],["Abs. NJ",`${absNJ} j`,absNJ>3?"#dc2626":"#059669"]]
    : [["Moy. T1",`${a1.toFixed(2)}/10`,"#94a3b8"],["Moy. T2",`${a2.toFixed(2)}/10`,"#94a3b8"],["Moy. T3",`${moy.toFixed(2)}/10`,moy>=5?"#059669":"#dc2626"],["Moy. Gén.",`${((a1+a2+moy)/3).toFixed(2)}/10`,"#1a365d"],["Rang",`${rank}e/25`,"#475569"],["Abs. NJ",`${absNJ} j`,absNJ>3?"#dc2626":"#059669"]]
  ).map(([l, v, c]) => `<div style="padding:3px 6px;border-radius:4px;background:#f8fafc;border:1px solid #e2e8f0"><p style="font-size:6.5pt;color:#64748b;font-weight:700;text-transform:uppercase;margin:0">${l}</p><p style="font-size:10pt;font-weight:800;color:${c};margin:0">${v}</p></div>`).join("");
  const statCols = trimestre === 2 ? "repeat(4,1fr)" : "repeat(3,1fr)";

  // ── Decision badge (T3 only) ──────────────────────────────────────────────
  const dec = moy>=5
    ? {label:"Admis(e) en classe supérieure (CM1)",color:"#059669",bg:"#dcfce7"}
    : moy>=4.5
      ? {label:"Autorisé(e) à passer le test de passage",color:"#d97706",bg:"#fef3c7"}
      : {label:"Redoublement proposé",color:"#dc2626",bg:"#fee2e2"};
  const decHtml = trimestre===3
    ? `<div style="padding:4px 10px;border-radius:5px;margin-bottom:4px;background:${dec.bg};border:2px solid ${dec.color}"><p style="font-size:7pt;font-weight:800;color:${dec.color};text-transform:uppercase;margin:0">DÉCISION DU CONSEIL DE CLASSE</p><p style="font-size:11pt;font-weight:800;color:${dec.color};margin:0">${dec.label}</p></div>`
    : "";

  // ── Student identification rows ───────────────────────────────────────────
  const idRows = [
    ["Élève",           `${student.nom} ${student.prenom}`],
    ["Matricule",       student.matricule],
    ["Classe",          activeClass],
    ["Trimestre",       `${trimLabel} Trimestre`],
    ["IEF",             "Inspection de Kolda"],
    ["École",           "Ilyaou Mamadou SEYDI"],
    ["Date de naiss.",  student.dateNaissance],
    ["Lieu de naiss.",  student.lieuNaissance],
    ["Tuteur / Parent", student.tuteurNom],
    ["Année scolaire",  "2025–2026"],
  ].map(([l, v]) =>
    `<div style="line-height:1.35;word-break:break-word"><span style="font-size:8pt;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em">${l}: </span><span style="font-size:10pt;font-weight:700;color:#1a365d">${v}</span></div>`
  ).join("");

  // Layout: .bulletin-page is display:flex flex-column justify-content:space-between.
  // .bulletin-content-body  → flex-grow:1, fills all space above signatures.
  // .footer-signatures      → anchored to bottom, break-inside:avoid.
  return `<div class="bulletin-page">

  <div class="bulletin-content-body">
    <div style="text-align:center;border-bottom:2.5px solid #1a365d;padding-bottom:5px;margin-bottom:5px">
      <p style="font-size:16pt;font-weight:900;color:#1a365d;text-transform:uppercase;letter-spacing:.10em;margin:0 0 2px">Bulletin de Notes Trimestrielles</p>
      <p style="font-size:9pt;color:#475569;margin:0">${trimLabel} Trimestre · Année Scolaire 2025–2026</p>
    </div>
    <div style="background:#eff6ff;border-radius:5px;border:1px solid #bfdbfe;padding:5px 10px;margin-bottom:6px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 16px">${idRows}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:5px">
      <thead><tr style="background:#1a365d"><th style="padding:4px 8px;text-align:left;color:#fff;font-weight:800;font-size:9pt;letter-spacing:.04em">DISCIPLINE / ACTIVITÉ</th>${tableHead}</tr></thead>
      <tbody>${tableBody}</tbody>
    </table>
    <div style="display:grid;grid-template-columns:${statCols};gap:4px;margin-bottom:5px">${statCells}</div>
    ${decHtml}
  </div>

  <div class="footer-signatures">
    <div style="border-top:2px solid #1a365d;padding-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:40px">
      ${["Le Maître|Nom &amp; Signature — Cachet","Le Directeur|Cachet officiel — Signature"].map(s=>{const[l,sub]=s.split("|");return`<div style="text-align:center;display:flex;flex-direction:column;justify-content:flex-end;min-height:60px"><p style="font-size:9pt;font-weight:700;color:#1a365d;margin:0 0 16px">${l}</p><div><div style="border-bottom:1px solid #94a3b8"></div><p style="font-size:7.5pt;color:#94a3b8;margin:3px 0 0">${sub}</p></div></div>`;}).join("")}
    </div>
  </div>

</div>`;
}

// ─── buildBatchPrintHtml ──────────────────────────────────────────────────────
// Combines all student pages into a self-contained HTML document.
// Pure string concatenation — zero DOM, zero React fiber operations.
function buildBatchPrintHtml(
  students:      Student[],
  trimestre:     1|2|3,
  gradesMap:     Record<string, Record<string, GradeSet>>,
  gradeSchema:   Record<string, number>,
  computedRanks: Record<string, number>,
): string {
  const trimLabel = trimestre === 1 ? "1er" : trimestre === 2 ? "2ème" : "3ème";
  const pages = students.map(s => {
    const g    = gradesMap[s.id] ?? getStudentGrades(s.id);
    const nj3  = totalAbsencesNJ(getAttendance(s.id, 20));
    return buildOneBulletinHtml(s, g, trimestre, gradeSchema, computedRanks[s.id] ?? 0, nj3);
  });
  return [
    "<!DOCTYPE html><html lang='fr'>",
    "<head><meta charset='utf-8'>",
    `<title>Bulletins CE2 · ${trimLabel} Trimestre</title>`,
    `<style>${BATCH_PRINT_CSS}</style>`,
    "</head><body>",
    pages.join(""),
    "</body></html>",
  ].join("");
}

// ─── BatchPreviewModal — full-screen mobile preview before batch print ────────

interface BatchPreviewModalProps {
  open:         boolean;
  trimestre:    1|2|3;
  onClose:      () => void;
  sortKey:      SortKey;
  onSortChange: (k: SortKey) => void;
  students:     Student[];   // pre-sorted by parent
  gradesMap:    Record<string, Record<string, GradeSet>>;
  gradeSchema:  Record<string, number>;
  computedRanks: Record<string, number>;
}

function BatchPreviewModal({
  open, trimestre, onClose, sortKey, onSortChange, students,
  gradesMap, gradeSchema, computedRanks,
}: BatchPreviewModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  // ── PRINT PORTAL ──────────────────────────────────────────────────────────
  // Architecture (obligatoire pour mobile) :
  //
  //  1. Les bulletins sont générés en HTML pur (template strings) — zéro
  //     rendu React, zéro nœud DOM créé dans l'arbre géré par React.
  //
  //  2. Un div#ecole-print-portal est créé avec document.createElement et
  //     rattaché directement à document.body, HORS de la hiérarchie React.
  //     React ne voit jamais ce nœud → aucun risque d'insertBefore.
  //
  //  3. Un <style> d'isolation est injecté en dernier dans <head> pour que
  //     ses règles aient la priorité. Il masque #root (display:none) et
  //     rend le portal visible grâce à une spécificité d'ID supérieure.
  //
  //  4. window.print() est appelé sur la fenêtre principale (universellement
  //     supporté sur iOS/Android). Seul le portal est imprimé.
  //
  //  5. Tout est supprimé dans afterprint ou après un timeout de sécurité.
  // ── BLOB PDF PRINT — document statique, aucun conflit DOM ─────────────────
  // Stratégie : générer un document HTML complet → Blob → nouvel onglet propre.
  // Pourquoi pas window.print() sur la page courante :
  //   Sur mobile, le moteur d'impression "optimise" en fusionnant les conteneurs
  //   malgré le CSS → superposition/compression. Un document Blob ouvert dans
  //   un onglet neuf = contexte vierge = rendu linéaire correct.
  const handlePrint = () => {
    if (isPrinting) return;
    setIsPrinting(true);

    // ── 1. Filtrer les élèves valides (anti-pages fantômes) ─────────────────
    // Les entrées sans notes génèrent des .bulletin-page vides → pages blanches.
    const validStudents = students.filter(s => {
      const g = gradesMap[s.id];
      return g !== undefined && Object.keys(g).length > 0;
    });

    if (validStudents.length === 0) {
      setIsPrinting(false);
      return;
    }

    // ── 2. Générer le document HTML complet (pure string, zero DOM React) ───
    const html = buildBatchPrintHtml(
      validStudents, trimestre, gradesMap, gradeSchema, computedRanks
    );

    // ── 3. Créer le Blob et ouvrir dans un nouvel onglet ────────────────────
    // window.open() DOIT être appelé de façon synchrone ici (contexte du clic
    // utilisateur) — sinon le popup blocker mobile le bloquera.
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, "_blank");

    if (win) {
      // Onglet ouvert : déclencher l'impression une fois le document chargé
      win.addEventListener("load", () => {
        setTimeout(() => {
          win.print();
          // Libérer le Blob après que l'impression ait démarré
          setTimeout(() => URL.revokeObjectURL(url), 30_000);
        }, 400); // 400ms : laisse les styles se calculer dans l'onglet neuf
      });
    } else {
      // Popup bloqué → téléchargement HTML comme fallback
      const a = Object.assign(document.createElement("a"), {
        href:     url,
        download: `bulletins-CE2-T${trimestre}.html`,
      });
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 15_000);
    }

    // Déverrouiller le bouton après l'ouverture de l'onglet/dialog
    setTimeout(() => setIsPrinting(false), 1500);
  };

  if (!open) return null;

  const trimLabel = trimestre === 1 ? "1er" : trimestre === 2 ? "2ème" : "3ème";

  // ── Blob / HTML fallback ───────────────────────────────────────────────────
  // Reads #print-batch-root (the off-screen print-ready DOM) and wraps it in a
  // standalone HTML document with embedded print CSS for download.
  // Sorting is already baked into the DOM — no extra work needed.
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
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), {
      href:     url,
      download: `bulletins-ce2-t${trimestre}-${sortKey}.html`,
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 15_000);
  };

  // ── Style helpers ─────────────────────────────────────────────────────────
  const primaryBtn = (bg: string, shadow: string): React.CSSProperties => ({
    minHeight:       "40px",
    padding:         "0 16px",
    fontSize:        "12px",
    backgroundColor: isPrinting ? "#475569" : bg,
    color:           "#fff",
    opacity:         isPrinting ? 0.75 : 1,
    cursor:          isPrinting ? "not-allowed" : "pointer",
    boxShadow:       isPrinting ? "none" : shadow,
    transition:      "all 200ms ease",
    border:          "none",
    fontFamily:      "'Plus Jakarta Sans', sans-serif",
  });

  return (
    <div
      className="fixed inset-0 z-[500] flex flex-col"
      style={{ backgroundColor:"#f4f6f9", fontFamily:"'Plus Jakarta Sans', sans-serif" }}
    >
      {/* ── Header ── */}
      <div className="bg-primary shrink-0"
           style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.22)" }}>

        {/* Row 1: back, title, print CTA */}
        <div className="flex items-center gap-3 px-4" style={{ minHeight:"56px" }}>
          <button onClick={onClose} disabled={isPrinting}
                  className="p-2 rounded-xl bg-white/10 active:scale-95 transition-all"
                  aria-label="Retour">
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
          <button onClick={handlePrint} disabled={isPrinting}
                  className="inline-flex items-center gap-1.5 rounded-xl font-bold transition-all shrink-0"
                  style={primaryBtn("#10b981", "0 4px 14px rgba(16,185,129,0.35)")}>
            {isPrinting
              ? <><Loader2 className="w-4 h-4 shrink-0 animate-spin" />Préparation…</>
              : <><Printer className="w-4 h-4 shrink-0" />Imprimer</>}
          </button>
        </div>

        {/* Row 2: sort selector
            Changing this calls onSortChange → parent updates batchSortKey
            → sortedBatchStudents recomputes → #print-batch-root re-renders
            → this modal's visual preview also re-renders (students prop updates)
            Sort order is identical in both the preview and the print target. */}
        <div className="flex items-center gap-3 px-4 pb-3">
          <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest shrink-0">
            Trier :
          </span>
          <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth:"none" }}>
            {SORT_OPTIONS.map(opt => {
              const active = sortKey === opt.key;
              return (
                <button key={opt.key} onClick={() => onSortChange(opt.key)}
                        disabled={isPrinting}
                        className="shrink-0 rounded-full font-semibold transition-all active:scale-95"
                        style={{
                          fontSize:        "10px",
                          padding:         "4px 12px",
                          minHeight:       "28px",
                          backgroundColor: active ? "#fff" : "rgba(255,255,255,0.10)",
                          color:           active ? "#1a365d" : "rgba(255,255,255,0.65)",
                          border:          "none",
                          cursor:          isPrinting ? "not-allowed" : "pointer",
                          fontFamily:      "'Plus Jakarta Sans', sans-serif",
                          fontWeight:      active ? 700 : 500,
                          boxShadow:       active ? "0 1px 6px rgba(0,0,0,0.15)" : "none",
                        }}>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══ VISUAL PREVIEW / PRINT TARGET ═══════════════════════════════════
          id="print-batch-root": this scrollable container serves dual-purpose.
          Screen: the user previews all bulletins in a scrollable column.
          Print:  @media print makes it the sole visible element on the page.
          No separate off-screen root needed — one source of truth.          */}
      <div id="print-batch-root"
           className="flex-1 overflow-auto px-3 py-4"
           style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
        {students.map((s, idx) => {
          const g   = gradesMap[s.id] ?? getStudentGrades(s.id);
          const m3  = computeWeightedAvg(g, trimestre, gradeSchema);
          const nj3 = totalAbsencesNJ(getAttendance(s.id, 20));
          const dec = m3 >= 5
            ? { label:"Admis(e) en classe supérieure (CM1)",      color:"#059669", bg:"#dcfce7" }
            : m3 >= 4.5
              ? { label:"Autorisé(e) à passer le test de passage", color:"#d97706", bg:"#fef3c7" }
              : { label:"Redoublement proposé",                    color:"#dc2626", bg:"#fee2e2" };
          return (
            <div key={s.id} style={{ maxWidth:"794px", width:"100%", margin:"0 auto" }}>
              {/* Screen-only rank indicator */}
              <div className="no-print flex items-center gap-2 mb-1.5 px-1">
                <span style={{ fontSize:"10px", fontWeight:800, color:"#94a3b8",
                               fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {String(idx + 1).padStart(2,"0")}/{students.length}
                </span>
                <span style={{ fontSize:"11px", fontWeight:700, color:"#1a365d",
                               fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {s.nom} {s.prenom}
                </span>
                <span style={{ fontSize:"10px", fontWeight:700,
                               color: m3 >= 5 ? "#059669" : "#dc2626",
                               fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  · Moy. {m3.toFixed(2)}/10
                </span>
              </div>
              {/* Visual bulletin card */}
              <div style={{
                backgroundColor: "var(--card)",
                borderRadius:    "6px",
                padding:         "0 10px 10px",
                boxShadow:       "0 2px 14px rgba(0,0,0,0.10)",
                border:          "1px solid var(--border)",
                width:           "100%",
                fontFamily:      "Arial, Helvetica, sans-serif",
              }}>
                <BulletinBody student={s} grades={g} trimestre={trimestre}
                              moyT3={m3} absNJ={nj3} decision={dec}
                              gradeSchema={gradeSchema} rank={computedRanks[s.id]} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bottom action bar ── */}
       <div className="bg-card shrink-0 flex items-center justify-between gap-3 px-4 py-3"
         style={{ borderTop:"1px solid var(--border)", boxShadow:"0 -2px 10px rgba(0,0,0,0.07)" }}>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold truncate" style={{ color:"#1a365d" }}>
            {students.length} bulletins
            · {SORT_OPTIONS.find(o => o.key === sortKey)?.label}
          </p>
          <button onClick={handleBlobFallback} disabled={isPrinting}
                  style={{ fontSize:"10px", fontWeight:600, color:"#64748b",
                           cursor: isPrinting ? "not-allowed" : "pointer",
                           background:"none", border:"none", padding:0,
                           textDecoration:"underline",
                           fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
            Télécharger en HTML (mobile)
          </button>
        </div>
        <button onClick={handlePrint} disabled={isPrinting}
                className="inline-flex items-center gap-2 rounded-xl font-bold transition-all shrink-0"
                style={{ ...primaryBtn("#1a365d","0 4px 14px rgba(26,54,93,0.30)"),
                         minHeight:"44px", padding:"0 20px", fontSize:"13px" }}>
          {isPrinting
            ? <><Loader2 className="w-4 h-4 shrink-0 animate-spin" />Préparation des bulletins…</>
            : <><Printer className="w-4 h-4 shrink-0" />Confirmer l'impression</>}
        </button>
      </div>

      {/* No hidden print DOM — buildBatchPrintHtml is pure template strings */}
    </div>
  );
}

// ─── AddStudentModal ──────────────────────────────────────────────────────────
// Slide-up bottom sheet for adding a new student to the class roster.
// Fields: matricule, nom, prénom, genre, date + lieu de naissance, tuteur.

interface NewStudentForm {
  matricule: string; nom: string; prenom: string;
  genre: "F" | "M"; dateNaissance: string; lieuNaissance: string;
  tuteurNom: string; tuteurPhone: string;
}

const EMPTY_FORM: NewStudentForm = {
  matricule:"", nom:"", prenom:"", genre:"M",
  dateNaissance:"", lieuNaissance:"", tuteurNom:"", tuteurPhone:"",
};

function AddStudentModal({
  open, onClose, onSave,
}: { open: boolean; onClose: () => void; onSave: (f: NewStudentForm) => Promise<void> }) {
  const [form,    setForm]    = useState<NewStudentForm>(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);

  const field = (k: keyof NewStudentForm, v: string) =>
    setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim() || !form.prenom.trim()) return;
    setSaving(true);
    try { await onSave(form); setForm(EMPTY_FORM); onClose(); }
    finally { setSaving(false); }
  };

  if (!open) return null;

  const inputStyle: React.CSSProperties = {
    width:"100%", padding:"8px 12px", borderRadius:"10px",
    border:"1.5px solid var(--border)", fontSize:"13px",
    fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none",
    backgroundColor:"var(--card)", color:"var(--foreground)",
  };
  const labelStyle: React.CSSProperties = {
    fontSize:"10px", fontWeight:700, color:"var(--muted-foreground)",
    textTransform:"uppercase", letterSpacing:"0.06em",
    display:"block", marginBottom:"4px",
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[450]"
           style={{ backgroundColor:"rgba(0,0,0,0.45)" }}
           onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[460] bg-card"
           style={{ borderRadius:"20px 20px 0 0", maxHeight:"90vh",
                    display:"flex", flexDirection:"column",
                    boxShadow:"0 -8px 40px rgba(0,0,0,0.18)",
                    fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px" }}>
          <div style={{ width:36, height:4, borderRadius:999, backgroundColor:"var(--border)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3"
             style={{ borderBottom:"1px solid var(--border)" }}>
          <div>
            <p style={{ fontSize:"17px", fontWeight:800, color:"var(--foreground)", margin:0 }}>
              Ajouter un élève
            </p>
            <p style={{ fontSize:"11px", color:"var(--muted-foreground)", margin:0 }}>
              Les champs Nom et Prénom sont obligatoires.
            </p>
          </div>
          <button onClick={onClose}
                  style={{ width:32, height:32, borderRadius:"50%", backgroundColor:"var(--muted)",
                           display:"flex", alignItems:"center", justifyContent:"center",
                           border:"none", cursor:"pointer" }}>
            <X style={{ width:16, height:16, color:"var(--muted-foreground)" }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}
              style={{ overflowY:"auto", flex:1, padding:"16px 20px 24px",
                       display:"flex", flexDirection:"column", gap:"14px" }}>
          {/* Nom / Prénom */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <div>
              <label style={labelStyle}>Nom *</label>
              <input style={inputStyle} value={form.nom}
                     onChange={e => field("nom", e.target.value.toUpperCase())}
                     placeholder="DIALLO" required />
            </div>
            <div>
              <label style={labelStyle}>Prénom *</label>
              <input style={inputStyle} value={form.prenom}
                     onChange={e => field("prenom", e.target.value)}
                     placeholder="Aminata" required />
            </div>
          </div>

          {/* Matricule + Genre */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:"12px", alignItems:"end" }}>
            <div>
              <label style={labelStyle}>Matricule</label>
              <input style={inputStyle} value={form.matricule}
                     onChange={e => field("matricule", e.target.value)}
                     placeholder="CE2-026" />
            </div>
            <div>
              <label style={labelStyle}>Genre</label>
              <div style={{ display:"flex", gap:"6px" }}>
                {(["M","F"] as const).map(g => (
                  <button key={g} type="button"
                          onClick={() => field("genre", g)}
                          style={{
                            padding:"7px 16px", borderRadius:"10px", fontWeight:700,
                            fontSize:"13px", cursor:"pointer", border:"1.5px solid",
                            backgroundColor: form.genre===g ? "#1a365d" : "var(--muted)",
                            color: form.genre===g ? "#fff" : "#475569",
                            borderColor: form.genre===g ? "#1a365d" : "var(--border)",
                          }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Date + Lieu naissance */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <div>
              <label style={labelStyle}>Date de naissance</label>
              <input style={inputStyle} type="date" value={form.dateNaissance}
                     onChange={e => field("dateNaissance", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Lieu de naissance</label>
              <input style={inputStyle} value={form.lieuNaissance}
                     onChange={e => field("lieuNaissance", e.target.value)}
                     placeholder="Kolda" />
            </div>
          </div>

          {/* Tuteur */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <div>
              <label style={labelStyle}>Tuteur / Parent</label>
              <input style={inputStyle} value={form.tuteurNom}
                     onChange={e => field("tuteurNom", e.target.value)}
                     placeholder="Nom du tuteur" />
            </div>
            <div>
              <label style={labelStyle}>Téléphone</label>
              <input style={inputStyle} type="tel" inputMode="tel"
                     value={form.tuteurPhone}
                     onChange={e => field("tuteurPhone", e.target.value)}
                     placeholder="+221 77 000 0000" />
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={saving || !form.nom.trim() || !form.prenom.trim()}
                  style={{
                    minHeight:"48px", borderRadius:"14px", fontWeight:800,
                    fontSize:"14px", cursor: saving ? "not-allowed" : "pointer",
                    backgroundColor: form.nom && form.prenom ? "#1a365d" : "#94a3b8",
                    color:"#fff", border:"none",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
                    boxShadow: form.nom && form.prenom ? "0 4px 14px rgba(26,54,93,0.28)" : "none",
                  }}>
            {saving
              ? <><Loader2 style={{ width:16, height:16 }} className="animate-spin" />Enregistrement…</>
              : <><Users style={{ width:16, height:16 }} />Ajouter à la classe</>}
          </button>
        </form>
      </div>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type View = "liste" | "registre" | "bulletin";

export function ElevesScreen() {
  const navigate = useNavigate();
  const { activeClass } = useAppContext();
  const [view,           setView]          = useState<View>("liste");
  const [selectedId,     setSelectedId]    = useState("1");
  const [showAddStudent, setShowAddStudent] = useState(false);

  // ── Inline name editing ────────────────────────────────────────────────────
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [editingNom, setEditingNom] = useState("");

  const startEdit = useCallback((id: string, currentNom: string) => {
    setEditingId(id);
    setEditingNom(currentNom);
  }, []);

  const saveEdit = useCallback(async (id: string) => {
    if (editingNom.trim()) {
      await studentsApi.update(id, { nom: editingNom.trim() });
    }
    setEditingId(null);
  }, [editingNom]);

  // ── Delete-with-Undo pattern (5-second window) ─────────────────────────────
  // Pending set keeps the row visually present until the timer fires or is cancelled.
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());

  const handleDeleteWithUndo = useCallback((s: { id: string; nom: string; prenom: string }) => {
    const label = `${s.nom} ${s.prenom}`;

    // Optimistic: visually hide the row immediately
    setPendingDeleteIds(prev => new Set(prev).add(s.id));

    let undone = false;
    const timer = setTimeout(async () => {
      if (undone) return;
      await studentsApi.delete(s.id, label);
    }, 5000);

    import("sonner").then(({ toast }) => {
      toast.success(`${label} supprimé(e).`, {
        duration:    5000,
        action: {
          label:   "ANNULER",
          onClick: () => {
            undone = true;
            clearTimeout(timer);
            setPendingDeleteIds(prev => { const n = new Set(prev); n.delete(s.id); return n; });
            toast("Suppression annulée ✓", { duration: 2000 });
          },
        },
      });
    });
  }, []);
  const [trimestre,     setTrimestre]    = useState<1|2|3>(3);
  const [search,        setSearch]       = useState("");
  const [selectedMonth, setSelectedMonth]= useState(5); // default: Mars (index 5)
  const [printAllMode,     setPrintAllMode]     = useState(false);
  const [batchPreviewOpen, setBatchPreviewOpen] = useState(false);
  const [batchSortKey,     setBatchSortKey]     = useState<SortKey>("alpha");

  // ── Live Grade State ───────────────────────────────────────────────────────
  // Mutable map: studentId → discipline → { t1, t2, t3 }
  // Seeded from getStudentGrades() so the UI starts with realistic data.
  const [gradesMap, setGradesMap] = useState<Record<string, Record<string, GradeSet>>>(
    () => Object.fromEntries(STUDENTS.map(s => [s.id, getStudentGrades(s.id)]))
  );

  // ── Grade Schema (Global Grading Policy) ──────────────────────────────────
  // max_score per discipline — applies to all students of the class.
  // Propagated to every BulletinBody so inputs enforce the correct max.
  const [gradeSchema, setGradeSchema] = useState<Record<string, number>>(
    () => ({ ...DEFAULT_GRADE_SCHEMA })
  );

  // ── Discipline Inclusion Config (Global Grading Policy) ──────────────────
  // True = included in evaluation, False = excluded (strikethrough in UI).
  // Applies to the entire class; persists to Supabase discipline_config table.
  const [disciplineConfig, setDisciplineConfig] = useState<Record<string, boolean>>(
    () => Object.fromEntries(ALL_DISCIPLINES.map(d => [d, true]))
  );

  const handleToggleDiscipline = useCallback((disc: string) => {
    setDisciplineConfig(prev => {
      const next = { ...prev, [disc]: prev[disc] === false };
      // Supabase integration point:
      // supabase.from("discipline_config").upsert({
      //   class_id: "CE2", trimestre, discipline: disc,
      //   is_included: next[disc], updated_at: new Date().toISOString(),
      // }, { onConflict: "class_id,trimestre,discipline" });
      return next;
    });
  }, []);

  // ── Config panel visibility ───────────────────────────────────────────────
  const [configMode, setConfigMode] = useState(false);

  // ── Optimistic UI + Undo (via useGradesMutation) ─────────────────────────
  // Each grade change:
  //   1. Updates gradesMap immediately (optimistic UI)
  //   2. Shows a toast with "Annuler" (5-second Undo window)
  //   3. Debounces the actual DB write by 1.5 s
  //   4. On "Annuler": cancels the pending save and restores the old value
  //   5. On success: invalidates React Query cache → all components refresh
  const [saveStatus, setSaveStatus] = useState<"idle"|"saving"|"saved"|"error">("idle");

  const { handleGradeChange } = useGradesMutation({
    gradesMap,
    setGradesMap,
    activeClass,               // from useAppContext() (P1.5)
    trimestre,
    gradeSchema,
    onSaveStatus: setSaveStatus,
  });

  // ── Computed Ranks (instant, reactive) ───────────────────────────────────
  const computedRanks = useMemo<Record<string, number>>(() => {
    const withAvg = STUDENTS.map(s => ({
      id:  s.id,
      moy: computeWeightedAvg(gradesMap[s.id] ?? {}, trimestre, gradeSchema, disciplineConfig),
    }));
    // Stable sort: highest avg first; ties broken by student id
    withAvg.sort((a, b) => b.moy - a.moy || parseInt(a.id) - parseInt(b.id));
    const ranks: Record<string, number> = {};
    withAvg.forEach((x, i) => { ranks[x.id] = i + 1; });
    return ranks;
  }, [gradesMap, trimestre, gradeSchema, disciplineConfig]);

  // ── Sorted batch student list — drives both #print-batch-root AND modal preview ──
  const sortedBatchStudents = useMemo(() => {
    if (batchSortKey === "alpha") {
      return [...STUDENTS].sort((a, b) => {
        const bySurname = a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" });
        return bySurname !== 0
          ? bySurname
          : a.prenom.localeCompare(b.prenom, "fr", { sensitivity: "base" });
      });
    }
    // Use live gradesMap + gradeSchema for merit sorting
    const withMoy = STUDENTS.map(s => ({
      s,
      moy: computeWeightedAvg(gradesMap[s.id] ?? {}, trimestre, gradeSchema, disciplineConfig),
    }));
    return (batchSortKey === "merit-best"
      ? withMoy.sort((a, b) => b.moy - a.moy)
      : withMoy.sort((a, b) => a.moy - b.moy)
    ).map(x => x.s);
  }, [batchSortKey, trimestre, gradesMap, gradeSchema, disciplineConfig]);

  // ── afterprint cleanup — resets single-student print state ────────────────
  useEffect(() => {
    const cleanup = () => setPrintAllMode(false);
    window.addEventListener("afterprint", cleanup);
    return () => window.removeEventListener("afterprint", cleanup);
  }, []);

  // ── Batch modal opener — the ONLY thing "Tous les bulletins" does ─────────
  // window.print() and Blob logic live exclusively inside BatchPreviewModal.
  const handleBatchPrint = useCallback(() => {
    setBatchPreviewOpen(true);
  }, []);

  // Editable attendance state: key = `${studentId}-${monthIdx}`
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus[]>>({});

  function getStudentAtt(id: string): AttendanceStatus[] {
    const key = `${id}-${selectedMonth}`;
    return attendanceMap[key] ?? getAttendance(id, currentMonthData.days.length);
  }

  function setStudentStatus(studentId: string, dayIdx: number, status: AttendanceStatus) {
    const key = `${studentId}-${selectedMonth}`;
    setAttendanceMap(prev => {
      const current = prev[key] ?? getAttendance(studentId, currentMonthData.days.length);
      const updated = [...current];
      updated[dayIdx] = status as AttendanceStatus;
      return { ...prev, [key]: updated };
    });
  }

  const currentMonthData = SCHOOL_MONTHS[selectedMonth];
  const DAYS_LABELS      = currentMonthData.days;

  const student   = STUDENTS.find(s => s.id === selectedId)!;
  const grades    = useMemo(() => gradesMap[selectedId] ?? getStudentGrades(selectedId), [gradesMap, selectedId]);
  const attendance= useMemo(() => getAttendance(selectedId, DAYS_LABELS.length), [selectedId, DAYS_LABELS.length]);
  const moyT3     = useMemo(
    () => computeWeightedAvg(grades, trimestre, gradeSchema, disciplineConfig),
    [grades, trimestre, gradeSchema, disciplineConfig]
  );
  const absNJ = useMemo(() => totalAbsencesNJ(attendance), [attendance]);

  // ── Validation engine ─────────────────────────────────────────────────────
  const validation = useBulletinValidation(grades, disciplineConfig, trimestre);

  const filles = STUDENTS.filter(s => s.genre === "F").length;
  const garcons= STUDENTS.filter(s => s.genre === "M").length;
  const tauxParite = +((filles / STUDENTS.length) * 100).toFixed(1);

  const filtered = STUDENTS.filter(s =>
    s.nom.toLowerCase().includes(search.toLowerCase()) ||
    s.prenom.toLowerCase().includes(search.toLowerCase()) ||
    s.matricule.toLowerCase().includes(search.toLowerCase())
  );

  // Decision badge
  const decision = moyT3 >= 5
    ? { label:"Admis(e) en classe supérieure (CM1)", color:"#059669", bg:"#dcfce7" }
    : moyT3 >= 4.5
      ? { label:"Autorisé(e) à passer le test de passage", color:"#d97706", bg:"#fef3c7" }
      : { label:"Redoublement proposé", color:"#dc2626", bg:"#fee2e2" };

  const tabs: { key: View; label: string; icon: React.ReactNode }[] = [
    { key:"liste",    label:"Liste Nominative",  icon:<Users className="w-4 h-4"/>     },
    { key:"registre", label:"Cahier de Registre", icon:<UserCheck className="w-4 h-4"/> },
    { key:"bulletin", label:"Bulletins de Notes", icon:<FileText className="w-4 h-4"/>  },
  ];

  const handleAddStudent = async (form: NewStudentForm) => {
    await studentsApi.create({
      class_id:       activeClass,
      matricule:      form.matricule,
      nom:            form.nom,
      prenom:         form.prenom,
      genre:          form.genre as "F" | "M",
      date_naissance: form.dateNaissance,
      lieu_naissance: form.lieuNaissance,
      tuteur_nom:     form.tuteurNom,
      tuteur_phone:   form.tuteurPhone,
    });
  };

  return (
    <>
    {/* ── Add Student Modal ── */}
    <AddStudentModal
      open={showAddStudent}
      onClose={() => setShowAddStudent(false)}
      onSave={handleAddStudent}
    />

    {/* ── Batch Print Modal — visual preview + print controls ── */}
    <BatchPreviewModal
      open={batchPreviewOpen}
      trimestre={trimestre}
      onClose={() => setBatchPreviewOpen(false)}
      sortKey={batchSortKey}
      onSortChange={setBatchSortKey}
      students={sortedBatchStudents}
      gradesMap={gradesMap}
      gradeSchema={gradeSchema}
      computedRanks={computedRanks}
    />

    <div className="bg-background flex flex-col overflow-hidden"
         style={{ height:"calc(100vh - 36px)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>

      {/* ══ PRINT CSS — one bulletin per A4 portrait page ═══════════════════
          The user may select "2 pages per sheet" in the browser/OS print
          dialog to place two bulletins on one physical sheet (landscape).
          We keep the CSS model clean — no layout tricks needed here.        */}
      <style>{`
        /* ── Zero page margins so the bulletin uses the full A4 sheet.
           All internal spacing is managed by .bulletin-print-item padding. */
        @page { size: A4 portrait; margin: 0; }

        @media print {
          /* ── UNIFIED PRINT ISOLATION ─────────────────────────────────────────
             Only one of #bulletin-print-root / #print-batch-root is in the DOM
             at any time (controlled by React state), so both can be listed here
             without conflict. No body-class manipulation needed.              */
          .no-print, .no-print-stats { display: none !important; }
          .print-only                { display: block !important; }
          body *                     { visibility: hidden !important; }

          /* Single-student root (always in DOM, off-screen) */
          #bulletin-print-root,
          #bulletin-print-root *     { visibility: visible !important; }
          #bulletin-print-root {
            position: static !important;
            left: auto !important; top: auto !important;
            width: 100% !important;
          }

          /* Batch root (the modal's scrollable container, only in DOM when modal is open).
             Reset overflow so the print engine can paginate all children.    */
          #print-batch-root,
          #print-batch-root *        { visibility: visible !important; }
          #print-batch-root {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            display: block !important;
            padding: 0 !important;
            background: #fff !important;
          }

          /* .bulletin-page — each sorted bulletin = one A4 page */
          .bulletin-page {
            page-break-after: always !important;
            break-after: page !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            overflow: hidden !important;
            padding: 0 11mm 11mm !important;
            background: #fff !important;
            display: flex !important;
            flex-direction: column !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .bulletin-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }

          html, body {
            margin: 0 !important; padding: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            height: auto !important; overflow: visible !important;
          }

          /* Root: simple block flow */
          #bulletin-print-root {
            position: static !important;
            display: block !important;
            width: 100% !important;
            padding: 0 !important; margin: 0 !important;
          }

          /* ── ONE A4 PAGE PER BULLETIN ──────────────────────────────────
             padding: 0 top — title starts at the absolute top of the
             print area (zero-top-gap).  Sides and bottom get 11mm.
             Full A4 height (297mm) because @page margin is 0.
             page-break-after: always is the key rule for the batch
             collection loop — every .bulletin-print-item in the
             #bulletin-print-root gets its own physical page.             */
          .bulletin-print-item {
            width: 100% !important;
            padding: 0 11mm 11mm !important;
            background: #fff !important;
            box-shadow: none !important;
            border: none !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            overflow: hidden !important;
            /* Explicit break AFTER each bulletin (batch collection) */
            page-break-after: always !important;
            break-after: page !important;
          }

          /* Last bulletin: remove trailing break → no blank final page */
          .bulletin-print-item:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }

          /* ════════════════════════════════════════════════════════════════
             DOCUMENT TITLE — must be the first visible element on the page
             ════════════════════════════════════════════════════════════════ */
          .bi-title {
            font-size: 16pt !important;
            font-weight: 900 !important;
            letter-spacing: 0.09em !important;
            margin: 0 !important;
            padding-top: 10pt !important;   /* internal breathing, not gap */
          }

          /* ════════════════════════════════════════════════════════════════
             UNIFIED METADATA SCALE — 11pt / 700 for ALL labels AND values
             Both .bi-student-label and .bi-student-val share the exact
             same font-size so the identification block is a single unit.
             ════════════════════════════════════════════════════════════════ */
          .bi-student-label {
            font-size: 8pt !important;
            font-weight: 700 !important;
            color: #475569 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
          }
          .bi-student-val {
            font-size: 10pt !important;
            font-weight: 700 !important;
            color: #1a365d !important;
            word-break: break-word !important;
          }

          /* ════════════════════════════════════════════════════════════════
             GRADE TABLE — high-density rows (py-1 equivalent), legible marks
             ════════════════════════════════════════════════════════════════ */
          .bi-th {
            padding: 3pt 7pt !important;
            font-size: 8.5pt !important;
          }
          .bi-domain-td {
            padding: 2pt 8pt !important;
            font-size: 9.5pt !important;
            font-weight: 900 !important;
          }
          .bi-disc-name {
            padding: 2pt 7pt 2pt 12pt !important;
            font-size: 9pt !important;
            font-weight: 600 !important;
          }
          /* Marks — always bold 11pt, never compromise legibility */
          .bi-score {
            padding: 2pt 7pt !important;
            font-size: 11pt !important;
            font-weight: 800 !important;
          }

          /* Stats row */
          .bi-stat-cell  { padding: 2pt 5pt !important; }
          .bi-stat-label { font-size: 6.5pt !important; margin: 0 !important; }
          .bi-stat-value { font-size: 10pt !important; font-weight: 800 !important; margin: 0 !important; }

          /* Decision badge */
          .bi-decision { padding: 3pt 9pt !important; margin-bottom: 3pt !important; }

          /* ════════════════════════════════════════════════════════════════
             SIGNATURE BLOCK — 120px minimum, always at absolute page bottom
             margin-top: auto distributes all unused vertical space above,
             pushing the block to the bottom of the 297mm flex column.
             Le Maître (left) · Le Directeur (right) — two columns only.
             ════════════════════════════════════════════════════════════════ */
          .bi-signature-block {
            min-height: 120px !important;
            margin-top: auto !important;
            flex-shrink: 0 !important;
            padding-top: 10pt !important;
            border-top: 2pt solid #1a365d !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 40pt !important;
          }
          .bi-sig-name {
            font-size: 9pt !important;
            font-weight: 700 !important;
            color: #1a365d !important;
            margin: 0 0 38pt !important;
          }
          .bi-sig-line    { border-bottom: 1pt solid #94a3b8 !important; }
          .bi-sig-caption { font-size: 7pt !important; color: #6b7280 !important; margin: 2pt 0 0 !important; }
        }

        .print-only { display: none; }
      `}</style>

      {/* ── STICKY HEADER ──────────────────────────────────────────────────── */}
       <div className="no-print bg-card flex-shrink-0"
         style={{ boxShadow:"0 1px 0 var(--border), 0 2px 8px rgba(0,0,0,0.06)", zIndex:50 }}>
        <div className="max-w-6xl mx-auto px-4">

          {/* Nav row */}
          <div className="flex items-center gap-3 pt-3 pb-2">
            <button onClick={() => navigate("/")}
              className="inline-flex items-center gap-1.5 font-semibold text-primary
                         hover:text-secondary transition-colors shrink-0"
              style={{ fontSize:"13px", minHeight:"40px" }}>
              <ArrowLeft className="w-4 h-4"/>
              <span className="hidden sm:inline">Accueil</span>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-primary truncate" style={{ fontSize:"15px" }}>
                Gestion des Élèves — CE2
              </h1>
              <p className="text-[var(--muted-foreground)] mt-0.5 hidden sm:block" style={{ fontSize:"10px" }}>
                École Ilyaou Mamadou SEYDI · IEF Kolda · CE2
              </p>
            </div>
            {/* Trimestre selector */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg shrink-0"
                 style={{ backgroundColor:"var(--muted)" }}>
              {([1,2,3] as (1|2|3)[]).map(t => (
                <button key={t} onClick={() => setTrimestre(t)}
                  className="rounded-md font-bold transition-all"
                  style={{
                    minHeight:"32px", padding:"0 10px", fontSize:"11px",
                    backgroundColor: trimestre===t ? "var(--primary)" : "transparent",
                    color:           trimestre===t ? "#fff" : "var(--muted-foreground)",
                  }}>
                  T{t}
                </button>
              ))}
            </div>

            {/* ── FAB "Ajouter un élève" ── */}
            <button
              onClick={() => setShowAddStudent(true)}
              className="inline-flex items-center gap-1.5 rounded-xl font-bold transition-all active:scale-95 shrink-0"
              title="Ajouter un élève"
              style={{ minHeight:"36px", padding:"0 12px", fontSize:"12px",
                       backgroundColor:"var(--secondary)", color:"#fff",
                       boxShadow:"0 2px 8px rgba(49,130,206,0.30)" }}>
              <Plus className="w-4 h-4 shrink-0"/>
              <span className="hidden sm:inline">Ajouter</span>
            </button>

            {/* Desktop primary action — "Imprimer la Classe" visible in header */}
            <button
              className="hidden lg:inline-flex items-center gap-2 rounded-xl font-bold transition-all active:scale-95 shrink-0"
              onClick={() => { setView("bulletin"); setBatchPreviewOpen(true); }}
              style={{ minHeight:"36px", padding:"0 14px", fontSize:"12px",
                       backgroundColor:"#0f766e", color:"#fff",
                       boxShadow:"0 2px 10px rgba(15,118,110,0.28)" }}>
              <Printer className="w-3.5 h-3.5 shrink-0"/>
              Imprimer la classe
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 pb-0 overflow-x-auto" style={{ scrollbarWidth:"none" }}>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setView(tab.key)}
                className="inline-flex items-center gap-1.5 shrink-0 font-semibold transition-all"
                style={{
                  minHeight:"40px", padding:"0 14px", fontSize:"12px",
                  borderBottom: `2px solid ${view===tab.key ? "var(--primary)" : "transparent"}`,
                  color: view===tab.key ? "var(--foreground)" : "var(--muted-foreground)",
                  backgroundColor:"transparent",
                }}>
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-4 py-4">

          {/* ════════════════════════════════════════════════════════════════
              VIEW 1: LISTE NOMINATIVE
             ════════════════════════════════════════════════════════════════ */}
          {view === "liste" && (
            <div>
              {/* Metrics bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label:"Total Élèves",     value:STUDENTS.length, color:"#1a365d", icon:"👨‍🎓" },
                  { label:"Nombre de Filles", value:filles,          color:"#be185d", icon:"👩" },
                  { label:"Nombre de Garçons",value:garcons,         color:"#2563eb", icon:"👦" },
                  { label:"Taux de Parité",   value:`${tauxParite}%`,color:"#059669", icon:"⚖️" },
                ].map(m => (
                     <div key={m.label} className="bg-card rounded-2xl p-4"
                       style={{ boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize:"18px" }}>{m.icon}</span>
                      <span className="text-gray-400 font-medium" style={{ fontSize:"10px" }}>
                        {m.label}
                      </span>
                    </div>
                    <p className="font-black" style={{ fontSize:"24px", color:m.color }}>
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <div className="flex-1 relative" style={{ minWidth:"200px" }}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                  <input value={search} onChange={e=>setSearch(e.target.value)}
                    placeholder="Rechercher un élève…"
                    className="w-full rounded-xl outline-none font-medium"
                    style={{ minHeight:"40px", padding:"0 12px 0 36px",
                             fontSize:"13px", border:"1.5px solid var(--border)",
                             backgroundColor:"var(--card)", color:"var(--foreground)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}/>
                </div>
                {[
                  { icon:<Plus className="w-4 h-4"/>,   label:"Ajouter",   bg:"#1a365d", fg:"#fff" },
                  { icon:<Upload className="w-4 h-4"/>, label:"Import CSV", bg:"var(--muted)", fg:"var(--muted-foreground)" },
                  { icon:<Printer className="w-4 h-4"/>,label:"Export PDF", bg:"var(--muted)", fg:"var(--muted-foreground)" },
                ].map(a => (
                  <button key={a.label}
                    className="inline-flex items-center gap-1.5 rounded-xl font-semibold transition-all active:scale-95"
                    style={{ minHeight:"40px", padding:"0 14px", fontSize:"12px",
                             backgroundColor:a.bg, color:a.fg }}>
                    {a.icon}{a.label}
                  </button>
                ))}
              </div>

              {/* Table — full columns on desktop, scrollable on mobile */}
              <div style={{ borderRadius:"16px", boxShadow:"0 2px 12px rgba(0,0,0,0.07)", background:"var(--card)" }}>
                <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" as "touch" }}>
                  <table style={{ borderCollapse:"separate", borderSpacing:0, width:"100%",
                                  /* On desktop, no fixed min-width forces scroll; on mobile we keep it */
                                  minWidth:"680px", tableLayout:"auto" }}>
                    <thead>
                      <tr style={{ backgroundColor:"var(--muted)" }}>
                        {[
                          { h:"#",                  w:"40px"  },
                          { h:"Matricule",          w:"100px" },
                          { h:"Nom & Prénom",       w:"auto"  },
                          { h:"G",                  w:"36px"  },
                          { h:"Date / Lieu Naiss.", w:"160px" },
                          { h:"Tuteur",             w:"140px" },
                          { h:"Contact",            w:"120px" },
                          { h:"Action",             w:"90px"  },
                        ].map(({ h, w }) => (
                          <th key={h} style={{
                            width: w, padding:"10px 8px", textAlign:"left",
                            fontSize:"10px", fontWeight:800, color:"var(--muted-foreground)",
                            textTransform:"uppercase", letterSpacing:"0.06em",
                            borderBottom:"1px solid var(--border)",
                            whiteSpace:"nowrap",
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered
                        .filter(s => !pendingDeleteIds.has(s.id))   /* hide rows pending deletion */
                        .map((s, i) => {
                        const isEditing = editingId === s.id;
                        return (
                        <tr key={s.id}
                          onClick={() => { if (!isEditing) { setSelectedId(s.id); setView("bulletin"); } }}
                          style={{
                            backgroundColor: selectedId===s.id ? "var(--accent)" : i%2===0 ? "var(--card)" : "var(--muted)",
                            cursor: isEditing ? "default" : "pointer",
                            transition:"background 150ms",
                          }}
                          onMouseEnter={e=>{ if (!isEditing) (e.currentTarget as HTMLElement).style.backgroundColor="var(--muted)"; }}
                          onMouseLeave={e=>{ if (!isEditing) (e.currentTarget as HTMLElement).style.backgroundColor=selectedId===s.id?"var(--accent)":i%2===0?"var(--card)":"var(--muted)"; }}>
                          <td style={{ padding:"10px 8px", fontSize:"11px", color:"#94a3b8", fontWeight:600 }}>{i+1}</td>
                          <td style={{ padding:"10px 8px", fontSize:"11px", color:"var(--muted-foreground)", fontWeight:700, fontFamily:"monospace", whiteSpace:"nowrap" }}>{s.matricule}</td>
                          {/* ── Name cell — switches to input when editing ── */}
                          <td style={{ padding:"6px 8px" }}>
                            {isEditing ? (
                              <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                <input
                                  autoFocus
                                  type="text"
                                  value={editingNom}
                                  onChange={e => setEditingNom(e.target.value)}
                                  onBlur={() => saveEdit(s.id)}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") saveEdit(s.id);
                                    if (e.key === "Escape") setEditingId(null);
                                  }}
                                  style={{
                                    padding:"4px 8px", borderRadius:"8px", fontSize:"12px",
                                    fontWeight:700, color:"var(--foreground)", border:"1.5px solid var(--secondary)",
                                    outline:"none", width:"140px",
                                    fontFamily:"'Plus Jakarta Sans',sans-serif",
                                  }}
                                />
                                {/* Green check to confirm */}
                                <button
                                  onClick={e => { e.stopPropagation(); saveEdit(s.id); }}
                                  title="Valider"
                                  style={{ border:"none", background:"none", cursor:"pointer",
                                           color:"#059669", padding:"2px" }}>
                                  <Check style={{ width:16, height:16 }} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                                     style={{ fontSize:"10px", backgroundColor:s.genre==="F"?"#be185d":"#2563eb" }}>
                                  {s.prenom[0]}{s.nom[0]}
                                </div>
                                <p style={{ fontSize:"12px", fontWeight:700, color:"var(--foreground)", whiteSpace:"nowrap" }}>{s.nom} {s.prenom}</p>
                              </div>
                            )}
                          </td>
                          <td style={{ padding:"10px 8px" }}>
                            <span style={{
                              fontSize:"10px", fontWeight:800, padding:"2px 7px", borderRadius:"999px",
                              backgroundColor:s.genre==="F"?"#fce7f3":"#dbeafe",
                              color:s.genre==="F"?"#be185d":"#1d4ed8",
                            }}>{s.genre}</span>
                          </td>
                          <td style={{ padding:"10px 8px", fontSize:"11px", color:"var(--muted-foreground)", whiteSpace:"nowrap" }}>
                            {s.dateNaissance} · <span style={{ color:"#94a3b8" }}>{s.lieuNaissance}</span>
                          </td>
                          <td style={{ padding:"10px 8px", fontSize:"11px", color:"var(--muted-foreground)", whiteSpace:"nowrap" }}>{s.tuteurNom}</td>
                          <td style={{ padding:"10px 8px", fontSize:"11px", color:"var(--muted-foreground)", fontFamily:"monospace", whiteSpace:"nowrap" }}>{s.tuteurPhone}</td>
                          <td style={{ padding:"6px 8px" }}>
                            <div className="flex items-center gap-1.5">
                              {/* Bulletin button */}
                              <button onClick={e=>{e.stopPropagation();setSelectedId(s.id);setView("bulletin");}}
                                style={{ fontSize:"10px", padding:"5px 10px", borderRadius:"8px",
                                         backgroundColor:"#1a365d", color:"#fff", fontWeight:700,
                                         border:"none", cursor:"pointer", whiteSpace:"nowrap" }}>
                                Bulletin
                              </button>
                              {/*
                                PermissionGuard: Edit + Delete are only rendered
                                for the teacher who owns this class (or a director).
                                Others see the "Lecture seule" badge instead.
                              */}
                              <PermissionGuard ownerClassId={activeClass} fallback={<ReadOnlyBadge />}>
                                {/* Edit icon — blue pencil */}
                                <button
                                  onClick={e=>{ e.stopPropagation(); startEdit(s.id, s.nom); }}
                                  title="Modifier le nom"
                                  style={{ border:"none", background:"none", cursor:"pointer",
                                           padding:"5px", borderRadius:"6px", color:"#3182ce",
                                           transition:"background 150ms" }}
                                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.backgroundColor="#dbeafe"}
                                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.backgroundColor="transparent"}>
                                  <Pencil style={{ width:14, height:14 }} />
                                </button>
                                {/* Delete icon — red trash */}
                                <button
                                  onClick={e=>{ e.stopPropagation(); handleDeleteWithUndo(s); }}
                                  title="Supprimer l'élève"
                                  style={{ border:"none", background:"none", cursor:"pointer",
                                           padding:"5px", borderRadius:"6px", color:"#dc2626",
                                           transition:"background 150ms" }}
                                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.backgroundColor="#fee2e2"}
                                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.backgroundColor="transparent"}>
                                  <Trash2 style={{ width:14, height:14 }} />
                                </button>
                              </PermissionGuard>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding:"10px 16px", borderTop:"1px solid var(--border)",
                              fontSize:"10px", color:"#94a3b8" }}>
                  {filtered.length} élève{filtered.length>1?"s":""} affiché{filtered.length>1?"s":""}
                  {search ? ` sur ${STUDENTS.length} total` : ""}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              VIEW 2: CAHIER DE REGISTRE
             ════════════════════════════════════════════════════════════════ */}
          {view === "registre" && (
            <div>
              {/* Header: title + month picker + legend */}
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <p className="font-bold shrink-0" style={{ fontSize:"13px", color: "var(--foreground)" }}>
                  Registre de présences — {trimestre === 1 ? "1er" : trimestre === 2 ? "2ème" : "3ème"} Trimestre
                </p>
                {/* Month selector */}
                <div className="flex items-center gap-1 flex-wrap">
                  {SCHOOL_MONTHS.map((m, idx) => (
                    <button key={m.short} onClick={() => setSelectedMonth(idx)}
                      style={{
                        minHeight:"30px", padding:"0 10px", borderRadius:"8px",
                        fontSize:"11px", fontWeight:700, border:"1.5px solid",
                        borderColor: selectedMonth===idx ? "var(--primary)" : "var(--border)",
                        backgroundColor: selectedMonth===idx ? "var(--primary)" : "var(--card)",
                        color: selectedMonth===idx ? "var(--primary-foreground)" : "var(--muted-foreground)",
                        cursor:"pointer",
                      }}>
                      {m.short}
                    </button>
                  ))}
                </div>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                {Object.values(STATUS_CFG).map(s => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span style={{ width:"22px", height:"22px", borderRadius:"6px", display:"inline-flex",
                                   alignItems:"center", justifyContent:"center", fontSize:"8px",
                                   fontWeight:800, backgroundColor:s.bg, color:s.color,
                                   border:`1.5px solid ${s.color}` }}>
                      {s.label}
                    </span>
                    <span style={{ fontSize:"10px", color:"var(--muted-foreground)" }}>{s.title}</span>
                  </div>
                ))}
                <span style={{ fontSize:"10px", color:"#94a3b8", marginLeft:"auto" }}>
                  {DAYS_LABELS.length} jours — {currentMonthData.label} 2025–2026
                </span>
              </div>

                  <div className="bg-card rounded-2xl overflow-hidden"
                   style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.07)", overflowX:"auto" }}>
                <table style={{ borderCollapse:"collapse", minWidth:"900px", width:"100%" }}>
                  <thead>
                    <tr style={{ backgroundColor:"#1a365d" }}>
                      <th style={{
                        padding:"8px 10px", textAlign:"left", fontSize:"10px",
                        fontWeight:800, color:"#fff",
                        borderRight:"2px solid #2d4a6e", borderBottom:"2px solid #2d4a6e",
                        position:"sticky", left:0, backgroundColor:"#1a365d", zIndex:10,
                        minWidth:"130px", width:"130px",
                      }}>
                        Nom &amp; Prénom
                      </th>
                      {DAYS_LABELS.map((d, i) => (
                        <th key={d} style={{
                          padding:"8px 3px", textAlign:"center", fontSize:"8.5px",
                          fontWeight:700, color:"#fff",
                          borderRight:`1px solid ${i % 5 === 4 ? "#2d4a6e" : "#2d3e5a"}`,
                          borderBottom:"2px solid #2d4a6e",
                          minWidth:"34px", lineHeight:"1.2",
                        }}>
                          {d.split("/")[0]}<br/>
                          <span style={{ opacity:0.7, fontSize:"7.5px" }}>/{d.split("/")[1]}</span>
                        </th>
                      ))}
                      <th style={{
                        padding:"10px 8px", textAlign:"center", fontSize:"9px",
                        fontWeight:800, color:"#fca5a5", borderBottom:"2px solid #2d4a6e",
                        minWidth:"44px",
                      }}>
                        Abs NJ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {STUDENTS.map((s, ri) => {
                      const att = getStudentAtt(s.id);
                      const nj  = att.filter(a=>a==="ANJ").length;
                      const rowBg = ri%2===0 ? "var(--card)" : "var(--muted)";
                      return (
                        <tr key={s.id} style={{ backgroundColor:rowBg }}>
                          <td style={{
                            padding:"6px 8px", fontSize:"10.5px", fontWeight:700, color:"var(--foreground)",
                            position:"sticky", left:0, backgroundColor:rowBg,
                            borderBottom:"1.5px solid #cbd5e1",
                            borderRight:"2px solid #cbd5e1", zIndex:5,
                            whiteSpace:"nowrap", minWidth:"130px", width:"130px",
                          }}>
                            {s.nom} {s.prenom}
                          </td>
                          {getStudentAtt(s.id).map((a, di) => {
                            const cfg = STATUS_CFG[a];
                            const weekBorder = di % 5 === 4 ? "1.5px solid #94a3b8" : "1px solid #e2e8f0";
                            return (
                              <td key={di} style={{
                                textAlign:"center", padding:"3px 2px",
                                borderBottom:"1.5px solid #cbd5e1",
                                borderRight:weekBorder,
                                position:"relative",
                              }}>
                                {/* Visible styled chip */}
                                <div style={{
                                  display:"inline-flex", alignItems:"center", justifyContent:"center", gap:"1px",
                                  width:"34px", height:"28px", borderRadius:"6px",
                                  fontSize:"7.5px", fontWeight:800,
                                  backgroundColor: a==="P" ? "#f0fdf4" : cfg.bg,
                                  color: a==="P" ? "#86efac" : cfg.color,
                                  border: `1px solid ${a==="P" ? "#bbf7d0" : cfg.color + "40"}`,
                                  cursor:"pointer", userSelect:"none",
                                }}>
                                  {a==="P" ? "✓" : cfg.label}
                                  <ChevronDown style={{ width:"7px", height:"7px", opacity:0.7, flexShrink:0 }}/>
                                </div>
                                {/* Native select overlay — invisible but clickable */}
                                <select
                                  value={a}
                                  onChange={e => setStudentStatus(s.id, di, e.target.value as AttendanceStatus)}
                                  style={{
                                    position:"absolute", inset:0, opacity:0,
                                    cursor:"pointer", width:"100%", height:"100%",
                                  }}
                                >
                                  <option value="P">P — Présent</option>
                                  <option value="R">R — En Retard</option>
                                  <option value="ANJ">ANJ — Absent Non Justifié</option>
                                  <option value="AJ">AJ — Absent Justifié</option>
                                </select>
                              </td>
                            );
                          })}
                          <td style={{
                            textAlign:"center", padding:"7px 8px",
                            borderBottom:"1.5px solid #cbd5e1",
                            borderLeft:"2px solid #94a3b8",
                          }}>
                            <span style={{
                              fontSize:"12px", fontWeight:800,
                              color: nj>3 ? "#dc2626" : nj>0 ? "#d97706" : "#059669",
                            }}>{nj}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              VIEW 3: BULLETIN DE NOTES
             ════════════════════════════════════════════════════════════════ */}
          {view === "bulletin" && (
            <div>
              {/* Student selector + print controls */}
              <div className="no-print flex items-center gap-3 mb-4 flex-wrap">
                <label style={{ fontSize:"12px", fontWeight:700, color:"#475569" }}>Élève :</label>
                <div className="relative">
                  <select value={selectedId} onChange={e=>setSelectedId(e.target.value)}
                    style={{ minHeight:"40px", padding:"0 32px 0 12px", fontSize:"13px",
                             fontWeight:600, fontFamily:"'Plus Jakarta Sans',sans-serif",
                             borderRadius:"10px", border:"1.5px solid var(--border)",
                             backgroundColor:"var(--card)", color:"var(--foreground)", appearance:"none", cursor:"pointer" }}>
                    {STUDENTS.map(s => (
                      <option key={s.id} value={s.id}>{s.nom} {s.prenom} ({s.matricule})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-gray-400"/>
                </div>

                {/* Print current student — gated by validation.isComplete
                    (all included disciplines must have a grade entered).   */}
                <button
                  onClick={() => {
                    if (!validation.isComplete) return;
                    setPrintAllMode(false);
                    setTimeout(() => window.print(), 80);
                  }}
                  disabled={!validation.isComplete}
                  title={
                    validation.isComplete
                      ? "Imprimer le bulletin de cet élève"
                      : `Notes manquantes : ${validation.missing.join(", ")}`
                  }
                  className="inline-flex items-center gap-2 rounded-xl font-bold transition-all active:scale-95"
                  style={{
                    minHeight:       "40px",
                    padding:         "0 16px",
                    fontSize:        "12px",
                    backgroundColor: validation.isComplete ? "#1a365d" : "#94a3b8",
                    color:           "#fff",
                    cursor:          validation.isComplete ? "pointer" : "not-allowed",
                    opacity:         validation.isComplete ? 1 : 0.65,
                    transition:      "all 200ms ease",
                  }}>
                  <Printer className="w-4 h-4 shrink-0"/>
                  {validation.isComplete ? "Imprimer le Bulletin" : "Notes incomplètes"}
                </button>

                {/* Opens BatchPreviewModal — no window.print() here */}
                <button
                  onClick={handleBatchPrint}
                  className="inline-flex items-center gap-2 rounded-xl font-bold transition-all active:scale-95"
                  style={{ minHeight:"40px", padding:"0 16px", fontSize:"12px",
                           backgroundColor:"#0f766e", color:"#fff" }}
                >
                  <Printer className="w-4 h-4 shrink-0"/>
                  Tous les bulletins (PDF)
                </button>

                {/* ── Grade schema config toggle ── */}
                <button
                  onClick={() => setConfigMode(o => !o)}
                  className="inline-flex items-center gap-1.5 rounded-xl font-bold transition-all active:scale-95"
                  style={{ minHeight:"40px", padding:"0 14px", fontSize:"12px",
                           backgroundColor: configMode ? "#f59e0b" : "var(--muted)",
                           color: configMode ? "#fff" : "var(--muted-foreground)" }}
                >
                  <Settings className="w-3.5 h-3.5 shrink-0"/>
                  Barème
                </button>

                {/* ── Save status badge — reflects optimistic mutation state ── */}
                {saveStatus !== "idle" && (
                  <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
                       style={{
                         fontSize:"11px", fontWeight:700,
                         backgroundColor:
                           saveStatus === "saved"  ? "#f0fdf4" :
                           saveStatus === "error"  ? "#fef2f2" : "var(--muted)",
                         color:
                           saveStatus === "saved"  ? "#059669" :
                           saveStatus === "error"  ? "#dc2626" : "#94a3b8",
                       }}>
                    {saveStatus === "saving" && <Loader2 className="w-3 h-3 animate-spin"/>}
                    {saveStatus === "saved"  && <Check className="w-3 h-3"/>}
                    {saveStatus === "error"  && <AlertTriangle className="w-3 h-3"/>}
                    {saveStatus === "saving" ? "Enregistrement…"
                      : saveStatus === "saved" ? "Enregistré ✓"
                      : "Erreur — réessayez"}
                  </div>
                )}
              </div>

              {/* ── Grade Schema Config Panel ─────────────────────────────────
                  Defines max_score per discipline, propagated globally.        */}
              {configMode && (
                <div className="no-print rounded-2xl border-2 border-amber-200 mb-4"
                     style={{ backgroundColor:"#fffbeb", padding:"14px 16px" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="w-4 h-4 text-amber-600"/>
                    <p className="font-bold text-amber-800" style={{ fontSize:"12px" }}>
                      Barème des notes — appliqué à tous les élèves de la classe
                    </p>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                    {Object.keys(BASE_GRADES).map(disc => (
                      <div key={disc} className="flex items-center gap-2">
                        <span className="flex-1 truncate"
                              style={{ fontSize:"11px", color:"#78716c" }}>
                          {disc}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span style={{ fontSize:"10px", color:"#a8a29e" }}>/</span>
                          <input
                            type="number"
                            min={1} max={100} step={5}
                            value={gradeSchema[disc] ?? 10}
                            onChange={e => {
                              const v = Math.max(1, parseInt(e.target.value) || 10);
                              setGradeSchema(prev => ({ ...prev, [disc]: v }));
                            }}
                            style={{
                              width:"52px", textAlign:"center",
                              borderRadius:"6px", border:"1.5px solid #d97706",
                              padding:"2px 4px", fontSize:"12px", fontWeight:700,
                              color:"#92400e", background:"#fef9c3",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3" style={{ fontSize:"10px", color:"#a8a29e" }}>
                    Modifier le barème recalcule instantanément toutes les moyennes et le classement.
                  </p>
                </div>
              )}

              {/* ── Validation banner ─────────────────────────────────────── */}
              {!validation.isComplete && (
                <div className="no-print flex items-start gap-3 rounded-xl mb-3"
                     style={{ padding:"10px 14px",
                              backgroundColor:"#fffbeb",
                              border:"1.5px solid #f59e0b" }}>
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-bold text-amber-800" style={{ fontSize:"12px" }}>
                      Notes manquantes — calcul de la moyenne impossible
                    </p>
                    <p className="text-amber-700 mt-0.5 break-words" style={{ fontSize:"11px" }}>
                      {validation.missing.join(" · ")}
                    </p>
                  </div>
                </div>
              )}

              {/* ── "Calculer" status strip ─────────────────────────────────── */}
              {validation.isComplete && validation.includedCount > 0 && (
                <div className="no-print flex items-center gap-3 rounded-xl mb-3"
                     style={{ padding:"8px 14px",
                              backgroundColor:"#f0fdf4",
                              border:"1.5px solid #86efac" }}>
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="font-semibold text-emerald-700" style={{ fontSize:"12px" }}>
                    {validation.includedCount} matière{validation.includedCount > 1 ? "s" : ""} évaluée{validation.includedCount > 1 ? "s" : ""}
                    {validation.excludedCount > 0 && (
                      <span className="font-normal text-emerald-600/70 ml-1">
                        · {validation.excludedCount} exclue{validation.excludedCount > 1 ? "s" : ""}
                      </span>
                    )}
                    <span className="font-bold text-emerald-800 ml-2">
                      → Moy. {moyT3.toFixed(2)} / 10
                    </span>
                  </p>
                </div>
              )}

              {/* ── A4 Bulletin Preview — interactive grade inputs ── */}
                  <div className="no-print bg-card mx-auto"
                   style={{ maxWidth:"794px", padding:"0 10px 10px",
                            boxShadow:"0 4px 24px rgba(0,0,0,0.12)",
                            fontFamily:"Arial, Helvetica, sans-serif",
                       border:"1px solid var(--border)" }}>
                <BulletinBody
                  student={student} grades={grades} trimestre={trimestre}
                  moyT3={moyT3} absNJ={absNJ} decision={decision}
                  onGradeChange={(disc, t, v) => handleGradeChange(student.id, disc, t, v)}
                  gradeSchema={gradeSchema}
                  rank={computedRanks[student.id]}
                  disciplineConfig={disciplineConfig}
                  onToggle={handleToggleDiscipline}
                />
              </div>

              {/* ══ SINGLE-STUDENT PRINT ROOT ════════════════════════════════
                  Always present (no conditional mount/unmount to avoid
                  fiber tree instability). In @media print it is the target
                  for single-student printing.                              */}
              <div
                id="bulletin-print-root"
                style={{ position:"absolute", left:"-9999px", top:0,
                         width:"794px", pointerEvents:"none", userSelect:"none",
                         fontFamily:"Arial, Helvetica, sans-serif" }}
              >
                {printAllMode ? (
                  /* All students — each on its own page */
                  STUDENTS.map(s => {
                    const g   = getStudentGrades(s.id);
                    const m3  = avg(g, trimestre);
                    const nj3 = totalAbsencesNJ(getAttendance(s.id, 20));
                    const dec = m3 >= 5
                      ? { label:"Admis(e) en classe supérieure (CM1)",      color:"#059669", bg:"#dcfce7" }
                      : m3 >= 4.5
                        ? { label:"Autorisé(e) à passer le test de passage", color:"#d97706", bg:"#fef3c7" }
                        : { label:"Redoublement proposé",                    color:"#dc2626", bg:"#fee2e2" };
                    return (
                      <div key={s.id} className="bulletin-print-item">
                        <BulletinBody student={s} grades={g} trimestre={trimestre}
                                      moyT3={m3} absNJ={nj3} decision={dec} />
                      </div>
                    );
                  })
                ) : (
                  /* Single student */
                  <div className="bulletin-print-item">
                    <BulletinBody student={student} grades={grades} trimestre={trimestre}
                                  moyT3={moyT3} absNJ={absNJ} decision={decision} />
                  </div>
                )}
              </div>

              {/* ── Statistiques & Performances (merged from stats view) ── */}
              <div className="no-print no-print-stats mt-6">
                <h2 className="font-bold text-[#1a365d] mb-4" style={{ fontSize:"15px" }}>
                  Statistiques &amp; Performances
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Average distribution bar chart */}
                     <div className="bg-card rounded-2xl p-5"
                       style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.07)" }}>
                    <h3 className="font-bold text-[#1a365d] mb-4" style={{ fontSize:"13px" }}>
                      Distribution des moyennes — T{trimestre}
                    </h3>
                    {STUDENTS.map(s => {
                      const g   = getStudentGrades(s.id);
                      const m   = avg(g, trimestre);
                      const pct = (m / 10) * 100;
                      const col = m>=7?"#059669":m>=5?"#d97706":"#dc2626";
                      return (
                        <div key={s.id} className="flex items-center gap-2 mb-1.5">
                          <span style={{ fontSize:"10px", color:"#475569", minWidth:"100px", fontWeight:600 }}>
                            {s.nom} {s.prenom.charAt(0)}.
                          </span>
                          <div style={{ flex:1, height:"8px", backgroundColor:"var(--muted)", borderRadius:"999px", overflow:"hidden" }}>
                            <div style={{ width:`${pct}%`, height:"100%", backgroundColor:col,
                                          borderRadius:"999px", transition:"width 500ms ease" }}/>
                          </div>
                          <span style={{ fontSize:"10px", fontWeight:800, color:col, minWidth:"36px", textAlign:"right" }}>
                            {m.toFixed(1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Class overview */}
                  <div className="space-y-3">
                    {/* Global metrics */}
                    {(() => {
                      const avgs = STUDENTS.map(s => avg(getStudentGrades(s.id), trimestre));
                      const classMoy = +(avgs.reduce((a,b)=>a+b,0)/avgs.length).toFixed(2);
                      const best     = Math.max(...avgs);
                      const admis    = avgs.filter(m => m >= 5).length;
                      return (
                            <div className="bg-card rounded-2xl p-5"
                             style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.07)" }}>
                          <h3 className="font-bold text-[#1a365d] mb-4" style={{ fontSize:"13px" }}>
                            Vue d'ensemble — Trimestre {trimestre}
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { label:"Moyenne de la classe",  value:`${classMoy}/10`,         color:"#1a365d" },
                              { label:"Plus forte moyenne",    value:`${best.toFixed(2)}/10`,   color:"#059669" },
                              { label:"Élèves admissibles",   value:`${admis} / ${STUDENTS.length}`, color:"#7c3aed" },
                              { label:"Taux de réussite",     value:`${((admis/STUDENTS.length)*100).toFixed(0)}%`, color:admis/STUDENTS.length>=0.7?"#059669":"#d97706" },
                            ].map(m => (
                              <div key={m.label} style={{ padding:"10px 12px", borderRadius:"10px",
                                                           backgroundColor:"var(--muted)", border:"1px solid var(--border)" }}>
                                <p style={{ fontSize:"9px", color:"#64748b", fontWeight:700,
                                            textTransform:"uppercase", margin:"0 0 4px" }}>{m.label}</p>
                                <p style={{ fontSize:"20px", fontWeight:900, color:m.color, margin:0 }}>{m.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Domain breakdown */}
                    <div className="bg-card rounded-2xl p-5"
                         style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.07)" }}>
                      <h3 className="font-bold text-[#1a365d] mb-3" style={{ fontSize:"13px" }}>
                        Moyenne par domaine
                      </h3>
                      {DOMAINS.map(dom => {
                        const domAvg = STUDENTS.reduce((acc, s) => {
                          const g = getStudentGrades(s.id);
                          const vals = dom.disciplines.map(d => {
                            const gs = g[d]; return trimestre===1?gs.t1:trimestre===2?gs.t2:gs.t3;
                          });
                          return acc + vals.reduce((a,b)=>a+b,0)/vals.length;
                        }, 0) / STUDENTS.length;
                        const pct = (domAvg/10)*100;
                        return (
                          <div key={dom.label} className="mb-2">
                            <div className="flex items-center justify-between mb-1">
                              <span style={{ fontSize:"10px", fontWeight:700, color:dom.color }}>
                                {dom.label.split("/")[0].trim()}
                              </span>
                              <span style={{ fontSize:"11px", fontWeight:800, color:dom.color }}>
                                {domAvg.toFixed(2)}/10
                              </span>
                            </div>
                            <div style={{ height:"6px", backgroundColor:"var(--muted)", borderRadius:"999px", overflow:"hidden" }}>
                              <div style={{ width:`${pct}%`, height:"100%", backgroundColor:dom.color,
                                            borderRadius:"999px" }}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
    </>
  );
}
