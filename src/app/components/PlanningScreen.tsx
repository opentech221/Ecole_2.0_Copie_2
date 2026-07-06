import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, ChevronLeft, ChevronRight, FilePlus2,
  ChevronDown, ChevronUp, Printer,
} from "lucide-react";

// ─── Calendar ─────────────────────────────────────────────────────────────────

const MONTHS_BY_TERM = [
  [{ n:1, label:"Octobre"  }, { n:2, label:"Novembre"  }, { n:3, label:"Décembre"  }],
  [{ n:4, label:"Janvier"  }, { n:5, label:"Février"   }, { n:6, label:"Mars"      }],
  [{ n:7, label:"Avril"    }, { n:8, label:"Mai"        }, { n:9, label:"Juin"      }],
];
const TERM_COVERAGE = [28, 55, 82];

// ─── Cascade data: OA → OS → Contenu ─────────────────────────────────────────

interface OsItem { os: string; contenus: string[] }
interface OaItem { oa: string; osItems: OsItem[] }

const OA_CATALOG: Record<string, OaItem[]> = {
  "Activités Numériques": [
    { oa: "OA1 · Reconnaître et lire les nombres jusqu'à 1 000",
      osItems: [
        { os: "OS1.1 · Lire et écrire les nombres de 0 à 100",
          contenus: ["Lecture des nombres de 0 à 20", "Lecture des nombres de 21 à 69", "Lecture des nombres de 70 à 100"] },
        { os: "OS1.2 · Décomposer les nombres en centaines, dizaines, unités",
          contenus: ["Décomposition additive — 2 chiffres", "Tableau de numération : C, D, U"] },
        { os: "OS1.3 · Comparer et ordonner des nombres",
          contenus: ["Comparaison : <, >, =", "Rangement croissant", "Rangement décroissant"] },
      ] },
    { oa: "OA2 · Effectuer des opérations arithmétiques sur les entiers",
      osItems: [
        { os: "OS2.1 · Calculer des additions avec retenue",
          contenus: ["Addition sans retenue — révision", "Addition avec retenue sur les unités", "Addition avec retenue sur les dizaines"] },
        { os: "OS2.2 · Effectuer des soustractions avec emprunt",
          contenus: ["Soustraction sans emprunt — révision", "Soustraction avec emprunt sur les unités", "Soustraction avec emprunt sur les dizaines"] },
        { os: "OS2.3 · Résoudre des problèmes de monnaie CFA",
          contenus: ["Les pièces de 50 F, 100 F et 250 F CFA", "Les billets de 500 F et 1 000 F CFA", "Opérations de rendu de monnaie"] },
      ] },
  ],
  "Activités Géométriques": [
    { oa: "OA1 · Identifier et décrire les figures planes",
      osItems: [
        { os: "OS1.1 · Reconnaître et nommer le carré, le rectangle et le triangle",
          contenus: ["Le carré : 4 côtés égaux et 4 angles droits", "Le rectangle : côtés opposés égaux", "Le triangle : définition et formes"] },
        { os: "OS1.2 · Identifier les côtés et les angles d'une figure",
          contenus: ["L'angle droit : identification", "Utilisation de l'équerre", "Identifier les angles droits"] },
        { os: "OS1.3 · Tracer une figure plane à la règle et à l'équerre",
          contenus: ["Tracer un carré de dimensions données", "Tracer un rectangle", "Vérification des angles droits"] },
      ] },
  ],
  "Activités de Mesure": [
    { oa: "OA1 · Mesurer des longueurs avec les unités appropriées",
      osItems: [
        { os: "OS1.1 · Utiliser la règle graduée pour mesurer un segment",
          contenus: ["Lecture de la règle en cm et mm", "Mesure d'un segment", "Comparaison de longueurs"] },
        { os: "OS1.2 · Convertir des longueurs : m, dm, cm et mm",
          contenus: ["Relations m, dm, cm, mm", "Conversion de mètres en cm", "Conversion de cm en mm"] },
      ] },
  ],
  "Résolution de Problèmes": [
    { oa: "OA1 · Résoudre un problème à une étape",
      osItems: [
        { os: "OS1.1 · Identifier les données utiles d'un problème",
          contenus: ["Lecture et compréhension d'un problème", "Données connues et inconnues", "Données utiles vs données parasites"] },
        { os: "OS1.2 · Choisir l'opération appropriée",
          contenus: ["Problèmes additifs", "Problèmes soustractifs", "Problèmes multiplicatifs"] },
        { os: "OS1.3 · Rédiger la réponse en phrase complète",
          contenus: ["Démarche de résolution", "Réponse en phrase complète", "Vérification de la vraisemblance"] },
      ] },
  ],
  "Lecture": [
    { oa: "OA1 · Lire un texte court avec fluidité et compréhension",
      osItems: [
        { os: "OS1.1 · Lire les syllabes et les mots avec exactitude",
          contenus: ["Syllabes simples (CV, CVC)", "Mots bisyllabiques", "Mots avec consonnes groupées"] },
        { os: "OS1.2 · Lire à voix haute avec la bonne intonation",
          contenus: ["Intonation déclarative", "Intonation interrogative", "Lecture expressive"] },
        { os: "OS1.3 · Répondre à des questions de compréhension",
          contenus: ["Identifier les personnages", "Repérer le lieu et le temps", "Informations explicites"] },
      ] },
  ],
  "Grammaire": [
    { oa: "OA1 · Identifier et classer les classes de mots",
      osItems: [
        { os: "OS1.1 · Reconnaître les noms communs et noms propres",
          contenus: ["Noms communs : définition", "Noms propres : personnes, lieux, pays", "Distinction nom commun / propre"] },
        { os: "OS1.2 · Identifier les déterminants articles",
          contenus: ["Articles définis : le, la, les", "Articles indéfinis : un, une, des", "Contraction de l'article"] },
      ] },
  ],
  "Expression orale": [
    { oa: "OA1 · S'exprimer oralement de façon claire",
      osItems: [
        { os: "OS1.1 · Se présenter oralement",
          contenus: ["Présentation personnelle", "Vocabulaire de la famille", "Description physique"] },
        { os: "OS1.2 · Décrire une scène",
          contenus: ["Vocabulaire descriptif", "Description d'une image", "Scène de vie quotidienne"] },
      ] },
  ],
  "Histoire": [
    { oa: "OA1 · Situer des faits historiques sur une frise",
      osItems: [
        { os: "OS1.1 · Nommer des événements clés",
          contenus: ["L'indépendance : 4 avril 1960", "Le Royaume du Cayor", "L'Empire du Mali"] },
        { os: "OS1.2 · Placer un événement avant ou après",
          contenus: ["La frise chronologique", "De la colonisation à l'indépendance", "Avant et après l'indépendance"] },
      ] },
  ],
  "Géographie": [
    { oa: "OA1 · Localiser les repères géographiques",
      osItems: [
        { os: "OS1.1 · Nommer les fleuves principaux",
          contenus: ["Le Fleuve Sénégal", "Le Fleuve Gambie", "La Casamance"] },
        { os: "OS1.2 · Identifier les régions administratives",
          contenus: ["Les 14 régions administratives", "Carte administrative", "Les chefs-lieux des régions"] },
      ] },
  ],
  "Sciences (IST)": [
    { oa: "OA1 · Observer et décrire un phénomène naturel",
      osItems: [
        { os: "OS1.1 · Formuler une hypothèse",
          contenus: ["L'observation scientifique", "Formulation d'une hypothèse", "La démarche expérimentale"] },
        { os: "OS1.2 · Réaliser une expérience simple",
          contenus: ["États de la matière : s, l, g", "Germination d'une graine", "Le cycle de l'eau"] },
      ] },
  ],
  "EPS": [
    { oa: "OA1 · Développer ses capacités motrices et sportives",
      osItems: [
        { os: "OS1.1 · Pratiquer des activités physiques",
          contenus: ["Jeux collectifs : football", "Athlétisme : course de vitesse", "Jeux traditionnels sénégalais"] },
      ] },
  ],
  "Arts plastiques": [
    { oa: "OA1 · Créer des productions plastiques",
      osItems: [
        { os: "OS1.1 · Réaliser des productions variées",
          contenus: ["Dessin d'observation", "Peinture : couleurs primaires", "Motif décoratif sénégalais"] },
      ] },
  ],
  // ── New ESVS activities ────────────────────────────────────────────────────
  "IST (Initiation Scientifique et Technologique)": [
    { oa: "OA1 · Observer, investiguer et expliquer des phénomènes naturels",
      osItems: [
        { os: "OS1.1 · Formuler une hypothèse à partir d'une observation",
          contenus: ["L'observation scientifique : les 5 sens", "La formulation d'une hypothèse simple", "La démarche expérimentale : observer → formuler → tester"] },
        { os: "OS1.2 · Réaliser une expérience simple et noter les résultats",
          contenus: ["Les états de la matière : solide, liquide, gazeux", "La germination d'une graine : protocole et observations", "Le cycle de l'eau : évaporation et condensation"] },
        { os: "OS1.3 · Conclure à partir des résultats obtenus",
          contenus: ["La rédaction d'une conclusion scientifique simple", "Vérification de l'hypothèse : confirmée ou infirmée", "Présentation orale des résultats d'une expérience"] },
      ] },
  ],
  "Vivre dans son milieu": [
    { oa: "OA1 · Agir de façon responsable sur son environnement naturel et social",
      osItems: [
        { os: "OS1.1 · Identifier les sources de pollution dans son quartier",
          contenus: ["Les déchets ménagers et leur impact sur l'environnement", "La pollution de l'air : fumées, poussières et brûlures", "La pollution de l'eau : canalisations et déversements"] },
        { os: "OS1.2 · Proposer des gestes éco-responsables au quotidien",
          contenus: ["Le tri sélectif des déchets : recyclage et compostage", "Les économies d'eau et d'énergie à la maison", "La plantation d'arbres et le reboisement"] },
        { os: "OS1.3 · Expliquer l'importance de la préservation des arbres",
          contenus: ["Le rôle des arbres dans l'écosystème", "La déforestation au Sénégal : causes et conséquences", "La Grande Muraille Verte : reboisement africain"] },
      ] },
  ],
  // ── New EPSA activities ────────────────────────────────────────────────────
  "Éducation Musicale": [
    { oa: "OA1 · Développer ses capacités musicales en pratiquant le chant et le rythme",
      osItems: [
        { os: "OS1.1 · Chanter en groupe avec justesse",
          contenus: ["Le chant choral : une chanson en wolof ou français", "Les percussions corporelles et le rythme", "Écoute musicale : instruments traditionnels sénégalais"] },
      ] },
  ],
};

// ─── Domain / Taxonomy structure ──────────────────────────────────────────────

// days = unique session days after deduplication (2 slots on same day = 1 session).
// deferredDays = days that had 2 slots → the 2nd slot is a deferred evaluation block.
interface Activity  { name: string; days: string[]; deferredDays?: string[] }
interface SousGroup { sous: string | null; activities: Activity[] }
interface Domain    {
  key: string; label: string; abbr: string;
  color: string; bg: string; dark: string; light: string;
  sousGroups: SousGroup[];
}

const DOMAINS: Domain[] = [
  // Mathématiques — Case B: no sous-domaine → "Pas de sous-domaine"
  {
    key: "maths", label: "Mathématiques", abbr: "MATH",
    color: "#2563eb", bg: "#dbeafe", dark: "#1e40af", light: "#eff6ff",
    sousGroups: [{ sous: null, activities: [
      // Lundi: 8h + 11h (2 slots → 1 session + deferred eval). Mercredi: 1 slot. = 2 sessions.
      { name: "Activités Numériques",    days: ["Lundi", "Mercredi"],   deferredDays: ["Lundi"] },
      // Mercredi: 1 slot. Jeudi: 1 slot. = 2 sessions.
      // CE2 official timetable: Géométrie = Jeudi only (1 session/week)
      { name: "Activités Géométriques",  days: ["Jeudi"] },
      // Lundi: 1 slot. Vendredi: 1 slot. = 2 sessions.
      // CE2 official timetable: Mesure = Mardi only (1 session/week)
      { name: "Activités de Mesure",     days: ["Mardi"] },
      // Mardi: 1 slot. Jeudi: 1 slot. = 2 sessions.
      // CE2 official timetable: Résolution de Problèmes = Vendredi only (1 session/week)
      { name: "Résolution de Problèmes", days: ["Vendredi"] },
    ] }],
  },
  // Langue et Communication — Case A: has sous-domaines
  {
    key: "langue", label: "Langue & Communication", abbr: "LANGUE",
    color: "#7c3aed", bg: "#ede9fe", dark: "#5b21b6", light: "#f5f3ff",
    sousGroups: [
      { sous: "Communication Écrite", activities: [
        // Lundi 8h + 9h (2 slots → 1 session + deferred eval). Mardi, Jeudi 1 slot each. = 3 sessions.
        { name: "Lecture",         days: ["Lundi", "Mardi", "Jeudi"],       deferredDays: ["Lundi"] },
        // Mardi 1 slot. Vendredi 1 slot. = 2 sessions.
        { name: "Grammaire",       days: ["Mardi", "Vendredi"] },
        // Mercredi 1 slot. Vendredi 1 slot. = 2 sessions.
        { name: "Conjugaison",     days: ["Mercredi", "Vendredi"] },
        // Jeudi 1 slot. Vendredi: 2 slots → 1 session + deferred eval. = 2 sessions.
        { name: "Orthographe",     days: ["Jeudi", "Vendredi"],              deferredDays: ["Vendredi"] },
      ] },
      { sous: "Communication Orale", activities: [
        { name: "Expression orale", days: ["Lundi", "Mercredi"] },
        { name: "Récitation",       days: ["Vendredi"] },
      ] },
    ],
  },
  // ESVS — Case A: has sous-domaines
  {
    key: "esvs", label: "ESVS", abbr: "ESVS",
    color: "#059669", bg: "#d1fae5", dark: "#065f46", light: "#ecfdf5",
    sousGroups: [
      { sous: "Découverte du monde", activities: [
        // Lundi: Histoire (row 1) + IST appear on Lundi → 2 distinct cards on Mon.
        { name: "Histoire",                                        days: ["Lundi"] },
        // IST appears on Lundi (shared with Histoire) AND Vendredi → 2 weekly sessions.
        { name: "IST (Initiation Scientifique et Technologique)", days: ["Lundi", "Vendredi"] },
        // Mercredi: Géographie only.
        { name: "Géographie",                                      days: ["Mercredi"] },
      ] },
      { sous: "Vie sociale", activities: [
        // Mardi: Vivre dans son milieu only.
        { name: "Vivre dans son milieu", days: ["Mardi"] },
        // Jeudi: Vivre ensemble only.
        { name: "Vivre ensemble",        days: ["Jeudi"] },
      ] },
    ],
  },
  // EPSA — strict CE2 timetable: 1 session per discipline, day-specific.
  {
    key: "epsa", label: "EPSA", abbr: "EPSA",
    color: "#ea580c", bg: "#ffedd5", dark: "#9a3412", light: "#fff7ed",
    sousGroups: [
      { sous: "Éducation Physique", activities: [
        // Jeudi only.
        { name: "EPS", days: ["Jeudi"] },
      ] },
      { sous: "Éducation Artistique", activities: [
        // Mardi: Éducation Musicale only.
        { name: "Éducation Musicale", days: ["Mardi"] },
        // Mercredi: Arts Plastiques only.
        { name: "Arts plastiques",    days: ["Mercredi"] },
      ] },
    ],
  },
];

// ─── Drop state per session ───────────────────────────────────────────────────

interface DS { oa: string; os: string; contenu: string }
const mkDS = (): DS => ({ oa: "", os: "", contenu: "" });

// ─── Layout constants ─────────────────────────────────────────────────────────

const SD_FULL   = 35;   // ultra-narrow (max 35px): rotated text, frees max horizontal space
const ACT_FULL  = 100;  // activité column — strict minimum for activity name
const HANDLE_W  = 24;   // width of the [>] retracted micro-handle
const WEEK_W    = 230;  // week columns — maximised for planning cell readability

// ─── Cascade select ───────────────────────────────────────────────────────────

// ─── Monochromatic per-activity colour system ─────────────────────────────────
// Each activity gets its OWN unique semantic colour.
// This colour completely dominates its row: header bg, cell borders, badges,
// dropdown accents, value cards, action button — total monochromatic immersion.
// WCAG-AA compliant (all colours pass 4.5:1 on white for text, 3:1 for UI).

const ACTIVITY_COLORS: Record<string, string> = {
  // ── Mathématiques ────────────────────────────────────────────────────────
  "Activités Numériques":    "#059669",  // Emerald green  — quantity/count
  "Activités Géométriques":  "#1d4ed8",  // Royal blue     — space/shape
  "Activités de Mesure":     "#0891b2",  // Cyan           — measurement
  "Résolution de Problèmes": "#7c3aed",  // Violet         — reasoning
  // ── Langue & Communication ───────────────────────────────────────────────
  "Lecture":                 "#dc2626",  // Crimson red    — reading aloud
  "Grammaire":               "#2563eb",  // Indigo blue    — structure/rules
  "Conjugaison":             "#9333ea",  // Deep purple    — verb forms
  "Orthographe":             "#be185d",  // Rose pink      — writing correct
  "Expression orale":        "#ea580c",  // Burnt orange   — speaking
  "Récitation":              "#c026d3",  // Fuchsia        — memorisation
  // ── ESVS ─────────────────────────────────────────────────────────────────
  "Histoire":                "#b45309",  // Warm amber     — past / heritage
  "Géographie":              "#15803d",  // Forest green   — land / maps
  "Sciences (IST)":          "#0e7490",  // Teal           — discovery
  "Vivre ensemble":          "#4338ca",  // Deep indigo    — society / values
  "Vivre dans son milieu":   "#166534",  // Deep forest    — ecology / environment
  "IST (Initiation Scientifique et Technologique)": "#0e7490",  // Teal — discovery (same family as Sciences)
  // ── EPSA ─────────────────────────────────────────────────────────────────
  "EPS":                     "#ef4444",  // Bright red     — physical energy
  "Arts plastiques":         "#f97316",  // Vivid orange   — visual arts
  "Éd. musicale":            "#8b5cf6",  // Medium violet  — sound / rhythm
  "Éducation Musicale":      "#8b5cf6",  // Same violet (full-name variant)
};

function getActivityColor(actName: string): string {
  // Direct per-activity lookup first
  if (ACTIVITY_COLORS[actName]) return ACTIVITY_COLORS[actName];
  // Fuzzy fallback — match partial names
  const n = actName.toLowerCase();
  if (/numérique|calcul|math/.test(n))          return "#059669";
  if (/géométr|espace|figure/.test(n))          return "#1d4ed8";
  if (/mesure|grandeur/.test(n))                return "#0891b2";
  if (/résolution|problème/.test(n))            return "#7c3aed";
  if (/lecture|lire/.test(n))                   return "#dc2626";
  if (/grammaire|syntaxe/.test(n))              return "#2563eb";
  if (/conjugaison|verbe/.test(n))              return "#9333ea";
  if (/orthographe|écriture/.test(n))           return "#be185d";
  if (/oral|expression|parole/.test(n))         return "#ea580c";
  if (/récitation|mémoris/.test(n))             return "#c026d3";
  if (/histoire/.test(n))                       return "#b45309";
  if (/géographie|carte/.test(n))               return "#15803d";
  if (/sciences|ist|initiation/.test(n))        return "#0e7490";
  if (/milieu|environnement|écolo/.test(n))     return "#166534";  // Vivre dans son milieu
  if (/vie|ensemble|social|citoyen/.test(n))    return "#4338ca";
  if (/eps|sport|physique/.test(n))             return "#ef4444";
  if (/arts|plastique|dessin/.test(n))          return "#f97316";
  if (/musical|chant|rythme|musique/.test(n))   return "#8b5cf6";
  return "#6366f1"; // neutral indigo fallback
}

function CascadeSelect({
  level, value, options, onChange, disabled, color,
}: {
  level: "oa" | "os" | "contenu";
  value: string; options: string[];
  onChange: (v: string) => void;
  disabled?: boolean; color: string;
}) {
  const LABELS = {
    oa:      "OA — Objectif d'Apprentissage",
    os:      "OS — Objectif Spécifique",
    contenu: "Contenu de la séance",
  };
  const PLACEHOLDERS = {
    oa:      "Sélectionner l'OA…",
    os:      "Sélectionner l'OS…",
    contenu: "Sélectionner le contenu…",
  };
  const filled = !!value && !disabled;

  return (
    <div>
      {/* Structural label — normal 8.5px bold caps so eye finds OA/OS/Contenu fast */}
      <p className="text-[8.5px] font-bold uppercase tracking-widest mb-1"
         style={{ color: disabled ? "#d1d5db" : filled ? color : "#94a3b8" }}>
        {LABELS[level]}
      </p>

      {/* When filled: show value in a compact #f8fafc card at 11px, keep select for edit */}
      {filled && (
        <div style={{
          fontSize: "11px", fontWeight: 600, lineHeight: 1.4,
          color: "#374151",
          backgroundColor: "var(--muted)",
          border: "1px solid var(--border)",
          borderLeft: `3px solid ${color}`,
          borderRadius: "8px",
          padding: "6px 10px",
          marginBottom: "4px",
          wordBreak: "break-word",
        }}>
          {value}
        </div>
      )}

      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none outline-none transition-all"
          style={{
            minHeight: filled ? "34px" : "44px",
            padding: "0 32px 0 10px",
            fontSize: "11px",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            cursor: disabled ? "not-allowed" : "pointer",
            borderRadius: "8px",
            backgroundColor: disabled ? "#f8fafc" : "#ffffff",
            color: disabled ? "#d1d5db" : filled ? "#6b7280" : "#374151",
            border: `1.5px solid ${disabled ? "#f1f5f9" : filled ? "#e2e8f0" : "#d1d5db"}`,
            fontWeight: filled ? 400 : 500,
          }}
        >
          <option value="">{disabled ? "— étape précédente requise" : PLACEHOLDERS[level]}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none w-3.5 h-3.5"
                     style={{ color: disabled ? "#e2e8f0" : "#9ca3af" }} />
      </div>
    </div>
  );
}

// ─── Session block ────────────────────────────────────────────────────────────

function SessionBlock({
  day, actName, domain, drop, onDrop, onFiche, isDeferred, ficheNum,
}: {
  day: string; actName: string; domain: Domain;
  drop: DS; onDrop: (k: keyof DS, v: string) => void;
  onFiche: () => void;
  isDeferred?: boolean;  // true = this day had 2 timetable slots → deferred evaluation
  ficheNum: number;      // global sequential number for this session within its activity row
}) {
  const oaList   = OA_CATALOG[actName] ?? [];
  const selOa    = oaList.find(o => o.oa === drop.oa);
  const osList   = selOa?.osItems ?? [];
  const selOs    = osList.find(o => o.os === drop.os);
  const cList    = selOs?.contenus ?? [];
  const canGo    = !!(drop.oa && drop.os && drop.contenu);
  // Discipline-driven accent colour for this session block
  const actColor = getActivityColor(actName);

  return (
    <div className="rounded-2xl overflow-hidden"
         style={{
           borderTop:    `1px solid ${actColor}30`,
           borderRight:  `1px solid ${actColor}30`,
           borderBottom: `1px solid ${actColor}30`,
           borderLeft:   `4px solid ${actColor}`,
           background: "#fff",
           boxShadow: `0 1px 6px ${actColor}14`,
         }}>

      {/* Card header: [Fiche #N] [Day pill] [Activity name badge] */}
      <div className="flex items-center gap-1.5 px-3 py-2 flex-wrap"
           style={{ backgroundColor: `${actColor}0d`,
                    borderBottom: `1px solid ${actColor}18` }}>
        {/* Sequential fiche number badge — chronological within the activity row */}
        <span className="inline-flex items-center rounded-md font-black shrink-0"
              style={{ fontSize: "8.5px", padding: "2px 6px",
                       backgroundColor: actColor, color: "#fff",
                       letterSpacing: "0.04em" }}>
          #{ficheNum}
        </span>
        {/* Day pill */}
        <span className="inline-flex items-center rounded-full font-bold text-white shrink-0"
              style={{ fontSize: "10px", padding: "3px 10px",
                       backgroundColor: actColor, letterSpacing: "0.02em" }}>
          {day}
        </span>
        {/* Activity name badge — tinted */}
        <span className="inline-flex items-center rounded-full font-bold truncate"
              style={{ fontSize: "9px", padding: "2px 8px",
                       backgroundColor: `${actColor}20`,
                       color: actColor,
                       border: `1px solid ${actColor}35`,
                       maxWidth: "calc(100% - 100px)" }}>
          {actName}
        </span>
      </div>

      {/* Cascade selects */}
      <div className="px-3 pt-3 pb-2.5 space-y-2.5">
        <CascadeSelect level="oa" value={drop.oa}
          options={oaList.map(o => o.oa)} color={actColor}
          onChange={v => { onDrop("oa", v); onDrop("os", ""); onDrop("contenu", ""); }} />
        <CascadeSelect level="os" value={drop.os}
          options={osList.map(o => o.os)} color={actColor}
          disabled={!drop.oa}
          onChange={v => { onDrop("os", v); onDrop("contenu", ""); }} />
        <CascadeSelect level="contenu" value={drop.contenu}
          options={cList} color={actColor}
          disabled={!drop.os}
          onChange={v => onDrop("contenu", v)} />
      </div>

      {/* ── Data transmission preview — only shown when all 3 dropdowns are filled ──
           Visually confirms every value that will be pre-injected into the
           Lesson Plan Editor when the teacher clicks "Préparer la fiche".        */}
      {canGo && (
        <div className="mx-3 mb-2 rounded-xl overflow-hidden"
             style={{ border: `1px solid ${actColor}30` }}>
          {/* Section header */}
          <div className="flex items-center gap-1.5 px-3 py-1.5"
               style={{ backgroundColor: `${actColor}14` }}>
            <FilePlus2 style={{ width:"11px", height:"11px", color:actColor, flexShrink:0 }}/>
            <span style={{ fontSize:"8.5px", fontWeight:800, color:actColor,
                           textTransform:"uppercase", letterSpacing:"0.06em" }}>
              Données pré-remplies pour la fiche
            </span>
          </div>
          {/* Payload rows */}
          <div style={{ backgroundColor:"#fafbfc", padding:"6px 10px",
                        display:"flex", flexDirection:"column", gap:"3px" }}>
            {[
              { label:"OA",      val:drop.oa      },
              { label:"OS",      val:drop.os      },
              { label:"Contenu", val:drop.contenu },
            ].map(row=>(
              <div key={row.label} style={{ display:"flex", gap:"6px", alignItems:"flex-start" }}>
                <span style={{ fontSize:"8px", fontWeight:800, color:actColor,
                               minWidth:"44px", flexShrink:0, paddingTop:"1px",
                               textTransform:"uppercase", letterSpacing:"0.05em" }}>
                  {row.label}
                </span>
                <span style={{ fontSize:"9px", color:"#374151", fontWeight:500,
                               lineHeight:1.4, wordBreak:"break-word" }}>
                  {row.val.length > 55 ? row.val.slice(0,55)+"…" : row.val}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── "Préparer la fiche" CTA ── */}
      {/* On click → navigates to LessonEditor with ALL metadata pre-loaded:
          domain, sous-domaine, discipline, OA, OS, contenu, jour, semaine.
          The LessonEditor reads this state and pre-populates its Cadre Administratif. */}
      <div className="px-3 pb-3">
        <button onClick={onFiche} disabled={!canGo}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl font-bold
                     text-white transition-all active:scale-[0.97]"
          style={{
            minHeight: "48px", fontSize: "13px",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            backgroundColor: canGo ? actColor : "#e5e7eb",
            color:           canGo ? "#fff"    : "#9ca3af",
            boxShadow:       canGo ? `0 4px 14px ${actColor}44` : "none",
            cursor: canGo ? "pointer" : "not-allowed",
          }}>
          <FilePlus2 className="w-4 h-4 shrink-0" />
          {canGo ? "Préparer la fiche →" : "Préparer la fiche"}
        </button>
        {!canGo && (
          <p style={{ fontSize:"9px", color:"#94a3b8", textAlign:"center",
                      marginTop:"5px", lineHeight:1.4 }}>
            Sélectionnez OA · OS · Contenu pour activer
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Week cell ────────────────────────────────────────────────────────────────

function WeekCell({
  cellId, actRow, domain, weekIdx,
  expanded, onToggle, drops, onDrop, onFiche,
}: {
  cellId: string; actRow: Activity; domain: Domain; weekIdx: number;
  expanded: boolean; onToggle: () => void;
  drops: DS[]; onDrop: (si: number, k: keyof DS, v: string) => void;
  onFiche: (si: number) => void;
}) {
  const n        = actRow.days.length;
  // Discipline-specific accent for this cell
  const actColor = getActivityColor(actRow.name);

  return (
    <div className="rounded-xl overflow-hidden transition-all duration-200"
         style={{
           borderTop:    `1px solid ${expanded ? actColor : "#e2e8f0"}`,
           borderRight:  `1px solid ${expanded ? actColor : "#e2e8f0"}`,
           borderBottom: `1px solid ${expanded ? actColor : "#e2e8f0"}`,
           borderLeft:   `4px solid ${actColor}`,
           backgroundColor: expanded ? `${actColor}06` : "#fff",
           boxShadow:       expanded ? `0 0 0 2px ${actColor}22`
                                     : "0 1px 3px rgba(0,0,0,0.04)",
         }}>

      {/* ── COLLAPSED ── */}
      {!expanded && (
        <button onClick={onToggle}
          className="w-full flex flex-col items-start gap-1.5 p-2.5
                     hover:bg-gray-50/50 transition-colors"
          style={{ minHeight: "60px" }}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-gray-500" style={{ fontSize: "10px" }}>
              {n} séance{n > 1 ? "s" : ""}
            </span>
            {actRow.days.map((d, i) => (
              <span key={i} className="font-bold rounded-full"
                    style={{ fontSize: "9px", padding: "2px 8px",
                             backgroundColor: `${actColor}18`,
                             color: actColor }}>
                {d}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1" style={{ color: actColor }}>
            <span className="font-semibold" style={{ fontSize: "9.5px" }}>
              Configurer OA · OS · Contenu
            </span>
            <ChevronDown className="w-3 h-3" />
          </div>
        </button>
      )}

      {/* ── EXPANDED ── */}
      {expanded && (
        <div>
          <button onClick={onToggle}
            className="w-full flex items-center justify-between px-3 py-2"
            style={{ backgroundColor: `${domain.color}12`,
                     borderBottom: `1px solid ${domain.color}20` }}>
            <span className="font-bold" style={{ fontSize: "10px", color: domain.dark }}>
              Semaine {weekIdx + 1} — {n} séance{n > 1 ? "s" : ""}
            </span>
            <ChevronUp className="w-3.5 h-3.5" style={{ color: domain.color }} />
          </button>
          <div className="p-2.5 space-y-3">
            {actRow.days.map((day, si) => {
              // Sequential fiche number within this activity row across all weeks:
              // Fiche 1 = Week1/Day0, Fiche 2 = Week1/Day1, Fiche 3 = Week2/Day0 …
              const ficheNum = weekIdx * actRow.days.length + si + 1;
              return (
                <SessionBlock key={si}
                  day={day} actName={actRow.name} domain={domain}
                  drop={drops[si] ?? mkDS()}
                  onDrop={(k, v) => onDrop(si, k, v)}
                  onFiche={() => onFiche(si)}
                  isDeferred={actRow.deferredDays?.includes(day)}
                  ficheNum={ficheNum} />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function PlanningScreen() {
  const navigate = useNavigate();

  const [term,         setTerm]         = useState(0);
  const [monthIdx,     setMonthIdx]     = useState(0);
  const [domainIdx,    setDomainIdx]    = useState(0);
  // Individual expanded cells (Set of cell IDs)
  const [expandedCells,    setExpandedCells]    = useState<Set<string>>(new Set());
  // Global "Vue 360°" toggle — expands EVERY cell simultaneously
  const [allExpanded,      setAllExpanded]      = useState(false);
  const [taxRetracted,     setTaxRetracted]      = useState(false);
  // Collapsible header accordion — hides all controls to maximise table space
  const [headerCollapsed,  setHeaderCollapsed]  = useState(false);
  const [drops,         setDrops]         = useState<Record<string, DS>>({});

  const scrollRef = useRef<HTMLDivElement>(null);

  // Helper: is a specific cell currently expanded?
  const isCellExpanded = useCallback((cid: string) =>
    allExpanded || expandedCells.has(cid), [allExpanded, expandedCells]);

  // Toggle a single cell; auto-retracts left columns
  function toggleCell(cid: string) {
    setExpandedCells(prev => {
      const next = new Set(prev);
      if (allExpanded) {
        // Coming from "all expanded" — build the full set from domain structure,
        // then remove just the tapped cell to collapse it individually
        domain.sousGroups.forEach((sg, sdi) => {
          sg.activities.forEach((_, ai) => {
            [0,1,2,3].forEach(wi => {
              next.add(`${domain.key}-${sdi}-${ai}-${wi}`);
            });
          });
        });
        next.delete(cid);
        setAllExpanded(false);
      } else {
        next.has(cid) ? next.delete(cid) : next.add(cid);
      }
      return next;
    });
    setTaxRetracted(true);
  }

  // Global 360° toggle
  function toggleAllExpanded() {
    if (allExpanded) {
      setAllExpanded(false);
      setExpandedCells(new Set());
    } else {
      setAllExpanded(true);
      setExpandedCells(new Set());
      setTaxRetracted(true);
    }
  }

  // Auto-retract when any cell is open
  useEffect(() => {
    if (expandedCells.size > 0 || allExpanded) setTaxRetracted(true);
  }, [expandedCells.size, allExpanded]);

  // Auto-retract on horizontal swipe
  const handleScroll = useCallback(() => {
    if (scrollRef.current && scrollRef.current.scrollLeft > 20) {
      setTaxRetracted(true);
    }
  }, []);

  const expandTaxonomy = useCallback(() => {
    setTaxRetracted(false);
    setExpandedCells(new Set());
    setAllExpanded(false);
    scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, []);

  const month    = MONTHS_BY_TERM[term][monthIdx];
  const domain   = DOMAINS[domainIdx];
  const coverage = TERM_COVERAGE[term];
  const coverageColor = coverage < 40 ? "#3182ce"
                      : coverage < 70 ? "#d97706"
                      :                 "#059669";

  function changeTerm(t: number) {
    setTerm(t); setMonthIdx(0);
    setExpandedCells(new Set()); setAllExpanded(false); setTaxRetracted(false);
    scrollRef.current && (scrollRef.current.scrollLeft = 0);
  }

  function switchDomain(i: number) {
    setDomainIdx(i);
    setExpandedCells(new Set()); setAllExpanded(false); setTaxRetracted(false);
    scrollRef.current && (scrollRef.current.scrollLeft = 0);
  }

  // Column widths driven by retraction state
  const sdW  = taxRetracted ? 0       : SD_FULL;
  const actW = taxRetracted ? 0       : ACT_FULL;
  const hndW = taxRetracted ? HANDLE_W : 0;

  // Whether this domain has real sous-domaines (used for print label logic)
  const hasSous = domain.sousGroups.some(sg => sg.sous !== null);

  // Build flat rows with rowspan metadata
  type RowData = {
    sous: string;          // display label for sous-domaine cell
    sousLabel: string;     // the sous-group label used for print headers
    rowspan: number;       // >0 only on first row of a group
    isLastInGroup: boolean;// true on the last activity of a sous-group → thick separator
    activity: Activity;
    sdi: number; ai: number;
  };
  const rows: RowData[] = [];
  let totalRows = 0;
  domain.sousGroups.forEach((sg, sdi) => {
    sg.activities.forEach((act, ai) => {
      rows.push({
        sous:          ai === 0 ? (sg.sous ?? "Pas de sous-domaine") : "",
        sousLabel:     sg.sous ?? "Pas de sous-domaine",
        rowspan:       ai === 0 ? sg.activities.length : 0,
        isLastInGroup: ai === sg.activities.length - 1,
        activity: act,
        sdi, ai,
      });
      totalRows++;
    });
  });

  const dropKey = (cid: string, si: number) => `${cid}_${si}`;
  const getDrop = (cid: string, si: number): DS => drops[dropKey(cid, si)] ?? mkDS();
  function setDrop(cid: string, si: number, k: keyof DS, v: string) {
    const key = dropKey(cid, si);
    setDrops(p => ({ ...p, [key]: { ...p[key] ?? mkDS(), [k]: v } }));
  }
  // ficheNum for a given (week, session) pair within one activity row
  function computeFicheNum(wi: number, si: number, totalDaysPerWeek: number) {
    return wi * totalDaysPerWeek + si + 1;
  }

  function handleFiche(cid: string, si: number, act: Activity, sous: string) {
    const d       = getDrop(cid, si);
    const jour    = act.days[si] ?? act.days[0];
    const sem     = Number(cid.split("-").pop() || 0) + 1;
    // Reconstruct the week index from cid (format: key-sdi-ai-wi)
    const wi      = Number(cid.split("-").pop() || 0);
    const ficheNum = computeFicheNum(wi, si, act.days.length);

    // ── Navigate directly to the LessonEditor (/select-lesson) with the full
    //    pedagogical payload so every field is 100% pre-populated on arrival.
    //    The LessonEditor's Cadre Administratif reads these state values and
    //    displays them without any manual configuration by the teacher.
    navigate("/select-lesson", {
      state: {
        // ── Metadata flags ──
        prefilled:   true,
        fromPlanning: true,          // signals LessonEditor this is a planning push

        // ── Curriculum taxonomy ──
        domaine:    domain.label,    // e.g. "Mathématiques"
        sousDomaine: sous,           // e.g. "Activités Numériques" or "Pas de sous-domaine"
        discipline: act.name,        // e.g. "Activités Numériques"

        // ── Pedagogical objectives (from the dropdown selections) ──
        oa:        d.oa,             // full OA text
        os:        d.os,             // full OS text
        competence: "",              // CB — filled later in editor
        palier:    "",               // Palier — filled later in editor

        // ── Content ──
        contenus:  d.contenu ? [d.contenu] : [],   // selected contenu as array

        // ── Planning context ──
        ficheNum:  ficheNum,         // sequential fiche number within this activity row
        jour:      jour,             // specific day from timetable
        semaine:   sem,              // week number within the month
        mois:      month.label,      // e.g. "Octobre"
        trimestre: term + 1,         // 1 | 2 | 3

        // ── Merge mode: one content = one fiche, no merging ──
        merged:    false,
      },
    });
  }

  // ── Print / PDF export ────────────────────────────────────────────────────
  // Conditional label: "par Sous-domaine" when the domain has sous-domaines,
  // "par Domaine" when it doesn't (e.g. Mathématiques).
  const printGroupLabel = hasSous ? "par Sous-domaine" : "par Domaine";

  function handlePrint() {
    window.print();
  }

  // Total min-width of the horizontal scroll content
  const minWidth = hndW + sdW + actW + WEEK_W * 4;

  return (
    <div className="bg-background flex flex-col overflow-hidden"
         style={{ height:"calc(100vh - 36px)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ══ PRINT CSS ════════════════════════════════════════════════════════
           Injected via a <style> tag so it applies to window.print() output.
           Targets: landscape A4, clean borders, hides web-only UI chrome.
         ═══════════════════════════════════════════════════════════════════ */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm 12mm; }

          /* Hide all UI chrome — buttons, nav bar, scroll controls */
          .no-print { display: none !important; }

          /* Full-page table container */
          body { background: #fff !important; }
          .print-root { height: auto !important; overflow: visible !important; }
          .print-scroll { overflow: visible !important; height: auto !important; }
          .print-inner  { min-width: unset !important; }

          /* Reset sticky positioning for table cells */
          td, th { position: static !important; }

          /* Clean structured borders */
          table { border-collapse: collapse !important; width: 100% !important; }
          td, th {
            border: 1px solid #d1d5db !important;
            padding: 5px 7px !important;
            vertical-align: top !important;
            font-size: 10px !important;
          }

          /* Print page header with domain/sous-domain */
          .print-page-header {
            display: block !important;
            font-size: 13px !important;
            font-weight: 800 !important;
            margin-bottom: 8px !important;
            color: #1a365d !important;
            border-bottom: 2px solid currentColor !important;
            padding-bottom: 4px !important;
          }

          /* Compact cells for physical display board */
          .session-block { page-break-inside: avoid; }
          .select-value-print { font-size: 10px; color: #374151; }

          /* Strong row separators — important for classroom readability */
          .activity-row-last td { border-bottom: 3px solid #6b7280 !important; }
        }
      `}</style>

      {/* Hidden print header — revealed only in @media print */}
      <div className="print-page-header" style={{ display: "none" }}>
        🏫 Tableau de Planification — {domain.label}
        {hasSous
          ? ` (par Sous-domaine · ${month.label} T${term + 1})`
          : ` · ${month.label} · Trimestre ${term + 1}`}
      </div>

      {/* ══ STICKY TOP CONTROLS (frozen during vertical scroll) ════════════════
           Position: this div is flex-shrink-0 at the top of the flex column,
           so it never moves. The scroll container below it takes the rest.
         ═══════════════════════════════════════════════════════════════════════ */}
      {/* ══ COLLAPSIBLE HEADER ACCORDION ════════════════════════════════════════
           The outer wrapper is always sticky. Inside it:
           • Nav bar — always visible (back button + title).
           • Controls block — collapses via max-height transition.
           • Toggle tab — always visible between controls and the table.
         ═══════════════════════════════════════════════════════════════════════ */}
       <div className="bg-card flex-shrink-0"
         style={{ boxShadow: "0 1px 0 var(--border), 0 2px 10px rgba(0,0,0,0.06)",
                    zIndex: 50, position: "relative" }}>
        <div className="max-w-4xl mx-auto px-4">

          {/* Nav */}
          <div className="flex items-center gap-3 pt-3.5 pb-2 border-b border-border">
            <button onClick={() => navigate("/")}
              className="no-print inline-flex items-center gap-1.5 font-semibold text-primary
                         hover:text-secondary transition-colors shrink-0"
              style={{ minHeight: "40px", fontSize: "13px" }}>
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Accueil</span>
            </button>
            <p className="font-bold text-primary flex-1 truncate" style={{ fontSize: "14px" }}>
              Planification Trimestrielle
            </p>
          </div>

          {/* ── COLLAPSIBLE CONTROLS BLOCK ────────────────────────────────────
               max-height transitions from ~320px (all rows visible) to 0 (hidden).
               overflow:hidden clips content during animation.
               The toggle tab below is always visible regardless of state.
             ─────────────────────────────────────────────────────────────── */}
          <div style={{
            maxHeight: headerCollapsed ? "0px" : "400px",
            overflow: "hidden",
            transition: "max-height 380ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}>

          {/* ROW 1 — Trimestre */}
          <div className="py-1.5">
            <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ backgroundColor: "var(--muted)" }}>
              {["Trimestre 1", "Trimestre 2", "Trimestre 3"].map((t, i) => (
                <button key={t} onClick={() => changeTerm(i)}
                  className="flex-1 rounded-md font-bold transition-all"
                  style={{
                    minHeight: "30px", fontSize: "10.5px",
                    backgroundColor: term === i ? "#1a365d" : "transparent",
                    color:           term === i ? "#fff" : "#64748b",
                    boxShadow:       term === i ? "0 1px 6px rgba(26,54,93,0.20)" : "none",
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* ROW 2 — Month carousel + Coverage */}
          <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100">
            <div className="flex items-center flex-1 min-w-0">
              <button onClick={() => setMonthIdx(m => Math.max(0, m - 1))}
                disabled={monthIdx === 0}
                style={{ minWidth: "36px", minHeight: "36px" }}
                className="flex items-center justify-center rounded-lg transition-colors">
                <ChevronLeft className="w-4 h-4"
                             style={{ color: monthIdx === 0 ? "#e2e8f0" : "#1a365d" }} />
              </button>
              <div className="flex-1 text-center min-w-0 px-1">
                <p className="font-bold text-[#1a365d] truncate leading-none"
                   style={{ fontSize: "12px" }}>
                  {month.label}
                </p>
                <p className="text-gray-400" style={{ fontSize: "8.5px" }}>
                  {["Trim. 1", "Trim. 2", "Trim. 3"][term]}
                </p>
              </div>
              <button onClick={() => setMonthIdx(m => Math.min(2, m + 1))}
                disabled={monthIdx === 2}
                style={{ minWidth: "36px", minHeight: "36px" }}
                className="flex items-center justify-center rounded-lg transition-colors">
                <ChevronRight className="w-4 h-4"
                              style={{ color: monthIdx === 2 ? "#e2e8f0" : "#1a365d" }} />
              </button>
            </div>
            <div className="w-px h-6 bg-gray-200 shrink-0" />
            <div className="shrink-0" style={{ minWidth: "76px" }}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-semibold text-gray-400 uppercase tracking-wide"
                      style={{ fontSize: "7.5px" }}>Couverture</span>
                <span className="font-bold" style={{ fontSize: "11px", color: coverageColor }}>
                  {coverage}%
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#e5e7eb" }}>
                <div className="h-full rounded-full transition-all duration-700"
                     style={{ width: `${coverage}%`, backgroundColor: coverageColor }} />
              </div>
            </div>
          </div>

          {/* ROW 3 — Domain tabs */}
          <div className="flex gap-1.5 overflow-x-auto py-1.5" style={{ scrollbarWidth: "none" }}>
            {DOMAINS.map((d, i) => (
              <button key={d.key} onClick={() => switchDomain(i)}
                className="inline-flex items-center gap-1 rounded-full font-bold
                           shrink-0 transition-all active:scale-95"
                style={{
                  minHeight: "28px", padding: "0 10px", fontSize: "10.5px",
                  backgroundColor: domainIdx === i ? d.color : d.bg,
                  color:           domainIdx === i ? "#fff"  : d.dark,
                  border:          domainIdx === i ? "none"  : `1.5px solid ${d.color}25`,
                  boxShadow:       domainIdx === i ? `0 2px 8px ${d.color}44` : "none",
                }}>
                <span style={{ fontSize: "7px", fontWeight: 900, letterSpacing: "0.07em",
                               opacity: domainIdx === i ? 0.8 : 0.55 }}>
                  {d.abbr}
                </span>
                {d.label}
              </button>
            ))}
          </div>

          {/* ── ROW 4 — Print/PDF export ── */}
          <div className="no-print pb-1.5">
            <button
              onClick={handlePrint}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl font-bold
                         transition-all active:scale-95 hover:opacity-90"
              style={{
                minHeight: "36px", fontSize: "11px",
                backgroundColor: "#0f172a", color: "#fff",
                boxShadow: "0 2px 8px rgba(15,23,42,0.20)",
              }}
              title={`Imprimer le tableau ${printGroupLabel}`}
            >
              <Printer className="w-3.5 h-3.5 shrink-0"/>
              Imprimer / PDF réglementaire
              <span style={{ opacity: 0.55, fontSize: "9.5px", fontWeight: 400 }}>
                ({printGroupLabel})
              </span>
            </button>
          </div>
          </div>{/* ── end collapsible controls block ── */}

          {/* ── ACCORDION TOGGLE TAB ── */}
          <div className="no-print flex justify-center pb-0.5"
               style={{ borderTop: "1px solid #f1f5f9" }}>
            <button
              onClick={() => setHeaderCollapsed(o => !o)}
              className="inline-flex items-center gap-1 rounded-full font-semibold
                         transition-all active:scale-95 hover:bg-gray-50"
              style={{
                fontSize: "10px", color: "var(--muted-foreground)",
                padding: "3px 12px", minHeight: "24px",
              }}
            >
              {headerCollapsed
                ? <><ChevronDown className="w-3 h-3"/>Filtres</>
                : <><ChevronUp   className="w-3 h-3"/>Masquer</>}
            </button>
          </div>

        </div>
      </div>

      {/* ══ FIXED VIEW CONTROLS — Segmented pill, always anchored above the table ══
           Sits OUTSIDE the collapsible header so it is NEVER hidden.
           A single pill-shaped toggle bar replaces the old separate buttons.
           The active capsule slides smoothly between 360° and Compact segments.
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="no-print bg-white"
           style={{ borderBottom: "1px solid #e5e7eb",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                    zIndex: 40, position: "relative" }}>
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div style={{
            display: "flex",
            backgroundColor: "var(--muted)",
            borderRadius: "999px",
            padding: "3px",
            position: "relative",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08)",
          }}>
            {/* ── Sliding active capsule ── */}
            {/* Moves left (360°) or right (Compact) via CSS left transition */}
            <div style={{
              position: "absolute",
              top: "3px", bottom: "3px",
              left: allExpanded ? "3px" : "calc(50% + 1px)",
              width: "calc(50% - 4px)",
              backgroundColor: "#1e293b",
              borderRadius: "999px",
              transition: "left 220ms cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 2px 8px rgba(30,41,59,0.25)",
            }}/>

            {/* Segment 1 — Vue 360° */}
            <button
              onClick={() => {
                setAllExpanded(true);
                setExpandedCells(new Set());
                setTaxRetracted(true);
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 font-bold
                         transition-colors duration-150 active:scale-[0.97]"
              style={{
                position: "relative", zIndex: 1,
                minHeight: "40px", fontSize: "12px",
                borderRadius: "999px",
                color: allExpanded ? "#fff" : "#64748b",
                background: "transparent", border: "none", cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "14px" }}>👁️</span>
              Vue 360°
            </button>

            {/* Segment 2 — Vue Compacte */}
            <button
              onClick={() => {
                setAllExpanded(false);
                setExpandedCells(new Set());
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 font-bold
                         transition-colors duration-150 active:scale-[0.97]"
              style={{
                position: "relative", zIndex: 1,
                minHeight: "40px", fontSize: "12px",
                borderRadius: "999px",
                color: !allExpanded ? "#fff" : "#64748b",
                background: "transparent", border: "none", cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "14px" }}>🔍</span>
              Vue Compacte
            </button>
          </div>
        </div>
      </div>

      {/* ══ TWO-WAY SCROLL CONTAINER ════════════════════════════════════════════
           flex-1 → takes all remaining height below the sticky top controls.
           overflow-x-auto + overflow-y-auto → both axes scroll smoothly.
           The column-header row inside is sticky top-0 within THIS container.
           Left cells use position:sticky left:N within the table.
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-hidden print-root">
        <div ref={scrollRef} onScroll={handleScroll}
             className="h-full overflow-x-auto overflow-y-auto print-scroll"
             style={{ scrollBehavior: "smooth" }}>

          {/* Min-width wrapper — triggers horizontal scroll when needed */}
          <div className="print-inner" style={{ minWidth: `${minWidth}px` }}>

            {/* ── FROZEN COLUMN HEADERS (sticky top-0 within this scroll area) ── */}
            <div className="flex bg-white"
                 style={{
                   position: "sticky", top: 0, zIndex: 30,
                   boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
                   borderBottom: "1px solid #e5e7eb",
                 }}>

              {/* Micro-handle [>] when retracted */}
              {taxRetracted && (
                <div style={{
                  width: `${HANDLE_W}px`, minWidth: `${HANDLE_W}px`,
                  position: "sticky", left: 0, zIndex: 40,
                  backgroundColor: "var(--card)",
                  borderRight: `2px solid ${domain.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <button onClick={expandTaxonomy}
                    className="w-full h-full flex items-center justify-center
                               hover:bg-gray-50 transition-colors"
                    style={{ minHeight: "52px" }}
                    title="Afficher Sous-domaine et Activité">
                    <ChevronRight className="w-3.5 h-3.5" style={{ color: domain.color }} />
                  </button>
                </div>
              )}

              {/* Sous-domaine header — ultra-narrow, vertical rotated label */}
              {!taxRetracted && (
                <div style={{
                  width: `${SD_FULL}px`, minWidth: `${SD_FULL}px`,
                  position: "sticky", left: 0, zIndex: 40,
                  backgroundColor: "var(--muted)",
                  borderRight: "1px solid #e5e7eb",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden",
                  padding: "12px 0",
                }}>
                  <span style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",  // reads bottom → top
                    fontSize: "10px", fontWeight: 900, color: "var(--muted-foreground)",
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    userSelect: "none", whiteSpace: "nowrap",
                  }}>
                    Sous-domaine
                  </span>
                </div>
              )}

              {/* Activité header + [<] collapse button */}
              {!taxRetracted && (
                <div style={{
                  width: `${ACT_FULL}px`, minWidth: `${ACT_FULL}px`,
                  position: "sticky", left: `${SD_FULL}px`, zIndex: 40,
                  backgroundColor: "var(--muted)",
                  borderRight: "1px solid #e5e7eb",
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 10px", overflow: "hidden",
                }}>
                  <span style={{ fontSize: "8px", fontWeight: 800,
                                 color: "var(--muted-foreground)", textTransform: "uppercase",
                                 letterSpacing: "0.08em" }}>
                    Activité
                  </span>
                  <button onClick={() => setTaxRetracted(true)}
                    className="flex items-center justify-center rounded-lg
                               hover:bg-gray-200 transition-colors"
                    style={{ width: "26px", height: "26px",
                             border: "1.5px solid var(--border)", backgroundColor: "var(--card)" }}
                    title="Réduire">
                    <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              )}

              {/* Week column headers */}
              {[0, 1, 2, 3].map(w => (
                <div key={w} style={{
                  width: `${WEEK_W}px`, minWidth: `${WEEK_W}px`,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  padding: "12px 8px",
                  borderRight: "1px solid var(--border)",
                  backgroundColor: "var(--card)",
                }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--foreground)" }}>
                    Semaine {w + 1}
                  </span>
                  <span style={{ fontSize: "9px", color: "var(--muted-foreground)", marginTop: "2px" }}>
                    {month.label} · S{w + 1}
                  </span>
                </div>
              ))}
            </div>

            {/* ── DATA TABLE WITH REAL ROWSPAN ── */}
            {/* border-collapse: separate is REQUIRED for position:sticky on <td> to work */}
            <table style={{
              width: "100%",
              tableLayout: "fixed",
              borderCollapse: "separate",
              borderSpacing: 0,
            }}>
              <colgroup>
                {/* Handle col */}
                <col style={{ width: `${hndW}px` }} />
                {/* Sous-domaine col */}
                <col style={{
                  width: `${sdW}px`,
                  transition: "width 250ms cubic-bezier(.4,0,.2,1)",
                }} />
                {/* Activité col */}
                <col style={{
                  width: `${actW}px`,
                  transition: "width 250ms cubic-bezier(.4,0,.2,1)",
                }} />
                {/* Week cols */}
                {[0, 1, 2, 3].map(w => (
                  <col key={w} style={{ width: `${WEEK_W}px` }} />
                ))}
              </colgroup>

              <tbody>
                {rows.map((row, ri) => {
                  // ── Monochromatic zone: activity's unique colour dominates its row ──
                  // Every cell in this row (header, week cells, selects, badges) inherits
                  // actRowColor — the colour shifts completely when moving to the next activity.
                  const actRowColor   = getActivityColor(row.activity.name);
                  const rowBg         = `${actRowColor}08`;  // ~3% tint, WCAG AA safe
                  const isLastInGroup = row.isLastInGroup;

                  return (
                    <tr key={ri}
                        className={isLastInGroup ? "activity-row-last" : ""}
                        style={{
                          backgroundColor: rowBg,
                          // Group-end separator uses the activity's own colour
                          borderBottom: isLastInGroup
                            ? `4px solid ${actRowColor}50`
                            : `1px solid ${actRowColor}18`,
                        }}>

                      {/* ── Handle column (always rendered; width=0 when not retracted) ── */}
                      {ri === 0 && (
                        <td rowSpan={totalRows}
                          style={{
                            width: `${hndW}px`,
                            position: "sticky", left: 0, zIndex: 20,
                            padding: 0, backgroundColor: "var(--card)",
                            borderRight: taxRetracted ? `2px solid ${domain.color}` : "none",
                            transition: "width 250ms cubic-bezier(.4,0,.2,1), border 250ms",
                            overflow: "hidden", verticalAlign: "top",
                          }}
                        />
                      )}

                      {/* ── COLUMN 1: Sous-domaine (rowSpan per group) ── */}
                      {/* Case A: sous !== null → group label.
                           Case B: sous === null → "Pas de sous-domaine" across ALL rows. */}
                      {row.rowspan > 0 && (
                        <td rowSpan={row.rowspan}
                          style={{
                            width: `${sdW}px`,
                            /* "sticky" keeps column frozen during H-scroll;
                               the accent dot child uses position:absolute relative to this. */
                            position: "sticky",
                            left: taxRetracted ? `${HANDLE_W}px` : 0,
                            zIndex: 20,
                            padding: sdW === 0 ? 0 : "12px 8px 12px 14px",
                            backgroundColor: `${domain.color}06`,
                            borderRight: `1px solid ${domain.color}18`,
                            borderTop: ri > 0 ? `2px solid ${domain.color}20` : "none",
                            verticalAlign: "middle",
                            overflow: "hidden",
                            transition: "width 250ms cubic-bezier(.4,0,.2,1), padding 250ms",
                          }}
                        >
                          {sdW > 0 && (
                            <>
                              {/* Vertical rotated text — ultra-narrow, reads bottom → top */}
                              <span style={{
                                writingMode: "vertical-rl",
                                transform: "rotate(180deg)",
                                fontSize: "11px",
                                fontWeight: 800,
                                color: domain.dark,
                                letterSpacing: "0.05em",
                                userSelect: "none",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxHeight: "120px",
                                display: "block",
                                opacity: 0.9,
                              }}>
                                {row.sous}
                              </span>
                              {/* Top accent dot */}
                              <div style={{
                                position: "absolute", left: "50%", top: 0,
                                transform: "translateX(-50%)",
                                width: "3px", height: "3px", borderRadius: "50%",
                                backgroundColor: domain.color,
                                marginTop: "4px",
                              }} />
                            </>
                          )}
                        </td>
                      )}

                      {/* ── COLUMN 2: Activité — sticky both axes, monochromatic zone header ── */}
                      {/* actRowColor from row scope is the single colour for this row ecosystem */}
                      <td style={{
                        width: `${actW}px`,
                        position: "sticky",
                        top: "52px",   // pins below column-header row during vertical scroll
                        left: taxRetracted ? `${HANDLE_W}px` : `${SD_FULL}px`,
                        zIndex: 21,
                        padding: actW === 0 ? 0 : "10px 10px",
                        // Slightly more saturated version of the row tint so it reads as "header"
                        backgroundColor: `${actRowColor}14`,
                        // 5px left bar = strong visual anchor for the row's colour zone
                        borderLeft: `5px solid ${actRowColor}`,
                        borderRight: `2px solid ${actRowColor}25`,
                        borderTop: `2px solid ${actRowColor}30`,
                        verticalAlign: "top",
                        overflow: "hidden",
                        transition: "width 250ms cubic-bezier(.4,0,.2,1), padding 250ms",
                      }}>
                        {actW > 0 && (
                          <div style={{ paddingTop: "2px" }}>
                            {/* Activity colour badge — distinct from domain abbr */}
                            <span style={{
                              display: "inline-block",
                              fontSize: "7px", fontWeight: 900,
                              textTransform: "uppercase", letterSpacing: "0.08em",
                              padding: "2px 6px", borderRadius: "999px",
                              backgroundColor: actRowColor, color: "#fff",
                              marginBottom: "5px",
                            }}>
                              {domain.abbr}
                            </span>
                            <p style={{
                              fontSize: "11px", fontWeight: 800,
                              color: actRowColor, lineHeight: 1.35,
                              wordBreak: "break-word",
                            }}>
                              {row.activity.name}
                            </p>
                          </div>
                        )}
                      </td>

                      {/* ── WEEK CELLS (columns 3-6) ── */}
                      {[0, 1, 2, 3].map(wi => {
                        const cid = `${domain.key}-${row.sdi}-${row.ai}-${wi}`;
                        const isExp = isCellExpanded(cid);
                        return (
                          <td key={wi}
                            style={{
                              width: `${WEEK_W}px`,
                              padding: "6px",
                              borderRight: "1px solid #f0f0f0",
                              verticalAlign: "top",
                              backgroundColor: rowBg,
                            }}>
                            <WeekCell
                              cellId={cid}
                              actRow={row.activity}
                              domain={domain}
                              weekIdx={wi}
                              expanded={isExp}
                              onToggle={() => toggleCell(cid)}
                              drops={row.activity.days.map((_, si) => getDrop(cid, si))}
                              onDrop={(si, k, v) => setDrop(cid, si, k, v)}
                              onFiche={si => handleFiche(cid, si, row.activity, row.sous)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ height: "48px" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
