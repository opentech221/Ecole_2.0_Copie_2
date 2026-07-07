import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal }                          from "react-dom";
import { useLocation, useNavigate }              from "react-router";
import { useProfileGuard }                       from "../../hooks/useProfileGuard";
import { ProfileGuardLoader }                    from "./ProfileGuardLoader";
import {
  ArrowLeft, Save, FileDown, Check, Sparkles, Loader2,
  ChevronDown, ChevronUp, BookOpen, Clock, Target,
  School, CalendarDays, X, Plus, GraduationCap, RefreshCw,
  Layers, RotateCcw, Eye, AlertCircle,
} from "lucide-react";

const LILIA = {
  primary: "#6d28d9", mid: "#7c3aed",
  light: "#f5f3ff", border: "#ddd6fe", glow: "rgba(109,40,217,0.17)",
};

// ─── Chip colours ─────────────────────────────────────────────────────────────

const CHIP_COLORS = [
  { on:"#e11d48", bg:"#fff1f2", shadow:"rgba(225,29,72,0.22)"  },
  { on:"#d97706", bg:"#fffbeb", shadow:"rgba(217,119,6,0.22)"  },
  { on:"#0d9488", bg:"#f0fdfa", shadow:"rgba(13,148,136,0.22)" },
  { on:"#7c3aed", bg:"#f5f3ff", shadow:"rgba(124,58,237,0.22)" },
  { on:"#2563eb", bg:"#eff6ff", shadow:"rgba(37,99,235,0.22)"  },
  { on:"#059669", bg:"#ecfdf5", shadow:"rgba(5,150,105,0.22)"  },
  { on:"#ea580c", bg:"#fff7ed", shadow:"rgba(234,88,12,0.22)"  },
  { on:"#a21caf", bg:"#fdf4ff", shadow:"rgba(162,28,175,0.22)" },
];

// ─── Resources ────────────────────────────────────────────────────────────────

const MATERIEL_OPTIONS = [
  "Tableau noir","Ardoise individuelle","Craie blanche et de couleur",
  "Cahier d'exercices","Cahier de leçons","Règle graduée","Équerre",
  "Compas","Rapporteur","Carte murale du Sénégal","Affiche illustrée",
  "Fiche de travail individuelle","Images documentaires","Abaque","Boulier",
];
const PEDAGOGIQUE_OPTIONS = [
  "Livret CEB","Guide du maître","Manuel de l'élève",
  "Programme officiel DEMSG","Livre de lecture CE",
  "Fiches pédagogiques APC","Cahier d'activités",
  "Référentiel de compétences","Grille d'évaluation formative",
  "Support numérique (tablette)","Affiche murale pédagogique",
];

// ─── OO variant templates per discipline ──────────────────────────────────────

const OO_TEMPLATES: Record<string, string[]> = {
  "Histoire": [
    "À la fin de la séance, l'élève devra être capable de situer sur une frise chronologique au moins 3 événements historiques clés de la leçon, en les nommant correctement.",
    "Au terme de la séance, l'élève devra pouvoir identifier et décrire les principaux acteurs et faits historiques étudiés, avec au moins 2 exemples pertinents.",
    "À l'issue de la séance, l'élève sera en mesure de produire un court récit structuré (3 phrases minimum) relatant les faits historiques de la leçon avec exactitude.",
  ],
  "Géographie": [
    "À la fin de la séance, l'élève devra être capable de localiser sur une carte muette au moins 5 éléments géographiques étudiés, sans aide.",
    "Au terme de la séance, l'élève devra pouvoir décrire oralement les caractéristiques principales du milieu géographique en utilisant le vocabulaire de la leçon.",
    "À l'issue de la séance, l'élève sera en mesure de compléter correctement une carte muette du Sénégal en y plaçant les éléments géographiques de la leçon.",
  ],
  "Grammaire": [
    "À la fin de la séance, l'élève devra être capable d'identifier correctement les éléments grammaticaux étudiés dans un texte de 5 phrases avec au moins 80% de réussite.",
    "Au terme de la séance, l'élève devra pouvoir rédiger 3 phrases grammaticalement correctes en appliquant la règle de la leçon sans aide.",
    "À l'issue de la séance, l'élève sera en mesure de corriger 5 erreurs grammaticales dans un texte donné en expliquant chaque correction.",
  ],
  "Conjugaison": [
    "À la fin de la séance, l'élève devra être capable de conjuguer correctement 5 verbes au temps de référence de la leçon, sans erreur.",
    "Au terme de la séance, l'élève devra pouvoir identifier le temps et la personne de 5 formes verbales données dans un texte court.",
    "À l'issue de la séance, l'élève sera en mesure de produire 3 phrases complètes utilisant correctement le temps verbal de la leçon.",
  ],
  "Activités numériques": [
    "À la fin de la séance, l'élève devra être capable de résoudre correctement au moins 3 exercices en appliquant la technique opératoire étudiée.",
    "Au terme de la séance, l'élève devra pouvoir effectuer sans erreur un calcul impliquant les notions de la leçon en moins de 10 minutes.",
    "À l'issue de la séance, l'élève sera en mesure de résoudre un problème de monnaie CFA utilisant les opérations étudiées, en montrant sa démarche complète.",
  ],
  "Activités géométriques": [
    "À la fin de la séance, l'élève devra être capable de tracer correctement la figure géométrique étudiée à la règle et à l'équerre.",
    "Au terme de la séance, l'élève devra pouvoir identifier et nommer toutes les propriétés de la figure de la leçon avec exactitude.",
    "À l'issue de la séance, l'élève sera en mesure de reconnaître et classer 5 figures géométriques selon leurs propriétés.",
  ],
  "Sciences de la Vie": [
    "À la fin de la séance, l'élève devra être capable de formuler une hypothèse, réaliser une observation et décrire les résultats avec exactitude.",
    "Au terme de la séance, l'élève devra pouvoir expliquer le phénomène scientifique étudié en citant au moins 2 causes et 2 effets observés.",
    "À l'issue de la séance, l'élève sera en mesure de réaliser le protocole expérimental et de rédiger une conclusion en 2 phrases.",
  ],
  "Vivre ensemble": [
    "À la fin de la séance, l'élève devra être capable de citer au moins 3 règles de vie collective et d'expliquer leur importance pour la communauté.",
    "Au terme de la séance, l'élève devra pouvoir décrire 2 comportements citoyens concrets qu'il peut adopter dans son école et son quartier.",
    "À l'issue de la séance, l'élève sera en mesure de rédiger un court texte (3 phrases) sur un comportement solidaire qu'il s'engage à pratiquer.",
  ],
  "Lecture": [
    "À la fin de la séance, l'élève devra être capable de lire à voix haute un texte de 5 phrases avec une intonation correcte et sans erreur de décodage.",
    "Au terme de la séance, l'élève devra pouvoir répondre correctement à au moins 4 questions de compréhension sur le texte étudié.",
    "À l'issue de la séance, l'élève sera en mesure de résumer le texte lu en 2 phrases en identifiant les personnages principaux et l'action centrale.",
  ],
};

function getOOVariants(discipline: string, content: string): string[] {
  return OO_TEMPLATES[discipline] ?? [
    `À la fin de la séance, l'élève devra être capable de restituer les éléments essentiels liés à « ${content} » avec au moins 80% de réussite lors de l'évaluation formative.`,
    `Au terme de la séance, l'élève devra pouvoir expliquer la notion de « ${content} » en citant au moins 2 exemples concrets tirés de sa vie quotidienne.`,
    `À l'issue de la séance, l'élève sera en mesure d'appliquer les connaissances acquises sur « ${content} » lors d'un exercice individuel de 5 questions.`,
  ];
}

// ─── Phases ───────────────────────────────────────────────────────────────────

const PHASES = [
  "Imprégnation / Mise en situation",
  "Phase Concrète",
  "Phase Semi-concrète",
  "Phase Abstraite / Fixation",
  "Évaluation formative",
] as const;
type Phase = typeof PHASES[number];
const EVAL_PHASE: Phase = "Évaluation formative";

const PHASE_AI: Record<Phase, { maitre: string; eleves: string }> = {
  "Imprégnation / Mise en situation": {
    maitre:  "Poser la question de départ. Présenter une illustration ou un objet en lien avec le contenu. Recueillir les représentations initiales au tableau.",
    eleves:  "Exprimer oralement leurs connaissances antérieures. Formuler des hypothèses. Écouter les réponses des camarades.",
  },
  "Phase Concrète": {
    maitre:  "Distribuer le matériel didactique. Donner les consignes d'observation et de manipulation. Poser des questions ciblées.",
    eleves:  "Observer et manipuler le matériel proposé. Décrire ce qu'ils voient. Identifier les éléments importants.",
  },
  "Phase Semi-concrète": {
    maitre:  "Inviter les élèves à schématiser ou représenter le concept graphiquement. Guider la structuration du savoir.",
    eleves:  "Réaliser un schéma, un dessin ou un tableau récapitulatif. Identifier les liens entre les éléments observés.",
  },
  "Phase Abstraite / Fixation": {
    maitre:  "Formuler la règle ou la trace écrite avec les élèves. Écrire la leçon au tableau. Faire reformuler par plusieurs élèves.",
    eleves:  "Copier la trace écrite dans le cahier de leçons. Mémoriser les définitions et règles. Reformuler la leçon.",
  },
  "Évaluation formative": {
    maitre:  "Proposer un exercice d'application individuel mesurant l'atteinte de l'OO. Circuler et corriger. Procéder à la correction collective.",
    eleves:  "Réaliser l'exercice de manière autonome. Démontrer leur acquisition. Vérifier leurs réponses et corriger leurs erreurs.",
  },
};

const TAB_LABELS = ["Étapes de la leçon","Activités du Maître","Activités des Élèves"] as const;
type ColTab = 0 | 1 | 2;

const pad = (n: number) => String(n + 1).padStart(2, "0");
const fck = (pi: number, col: "m"|"e") => `${pi}-${col}`;

// ─── Per-fiche state ──────────────────────────────────────────────────────────

interface FicheState {
  cells:     Record<string, string>;
  oo:        string;
  ooVariant: number;   // cycles through getOOVariants() on each generation
  matSel:    string[];
  pedSel:    string[];
  duree:     string;
}

function initFiche(defaultDuree = "45 min"): FicheState {
  return { cells:{}, oo:"", ooVariant:0, matSel:[], pedSel:[], duree:defaultDuree };
}

// ─── Auto-fill helpers ────────────────────────────────────────────────────────

function getNow() {
  const now = new Date();
  const d   = now.toLocaleDateString("fr-FR",{ day:"2-digit", month:"long", year:"numeric" });
  const t   = now.toLocaleTimeString("fr-FR",{ hour:"2-digit", minute:"2-digit" });
  return `${d} · ${t}`;
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function SeqChip({ label, index }: { label: string; index: number }) {
  const c = CHIP_COLORS[index % CHIP_COLORS.length];
  return (
    <span className="inline-flex items-center gap-1 rounded-full whitespace-nowrap shrink-0"
          style={{ fontSize:"11px", fontWeight:600, padding:"5px 11px",
                   backgroundColor:c.on, color:"#fff",
                   border:`1.5px solid ${c.on}`, boxShadow:`0 2px 6px ${c.shadow}` }}>
      <svg viewBox="0 0 10 8" style={{ width:10, height:10, flexShrink:0 }} fill="none">
        <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{ opacity:0.55, fontWeight:700, marginRight:"2px" }}>{pad(index)}.</span>
      {label}
    </span>
  );
}

function ReadField({ label, value, icon }: { label:string; value:string; icon?:React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {icon && <span className="text-gray-400 shrink-0 text-[13px]">{icon}</span>}
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-[13px] font-semibold text-[#1a365d] px-3 py-2.5 rounded-xl flex items-center"
           style={{ backgroundColor:"#f1f5f9", border:"1.5px solid #e2e8f0", minHeight:"44px" }}>
        {value || <span className="text-gray-300 italic text-[12px] font-normal">—</span>}
      </div>
    </div>
  );
}

function AutoField({ label, value, icon }: { label:string; value:string; icon?:React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {icon && <span className="text-gray-400 shrink-0 text-[13px]">{icon}</span>}
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
        <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor:"#e0f2fe", color:"#0369a1" }}>Auto</span>
      </div>
      <div className="text-[13px] font-semibold text-[#1a365d] px-3 py-2.5 rounded-xl flex items-center"
           style={{ backgroundColor:"#f0f9ff", border:"1.5px solid #bae6fd", minHeight:"44px" }}>
        {value}
      </div>
    </div>
  );
}

function EditField({ label, value, onChange, type="text", placeholder="", icon }: {
  label:string; value:string; onChange:(v:string)=>void;
  type?:string; placeholder?:string; icon?:React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {icon && <span className="text-gray-400 shrink-0 text-[13px]">{icon}</span>}
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
         <input type={type} value={value} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
           className="text-[13px] font-semibold text-primary px-3 py-2.5 rounded-xl outline-none w-full"
           style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", minHeight:"44px",
                    backgroundColor:"var(--card)", border:`1.5px solid ${focused?"var(--primary)":"var(--border)"}`,
                 transition:"border-color 150ms" }}
        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}/>
    </div>
  );
}

type Tone = "blue"|"amber"|"slate";
const TONE: Record<Tone,{bg:string;border:string;text:string;dot:string}> = {
  blue:  { bg:"var(--accent)", border:"var(--border)", text:"var(--primary)", dot:"var(--secondary)" },
  amber: { bg:"var(--muted)", border:"var(--border)", text:"var(--foreground)", dot:"var(--secondary)" },
  slate: { bg:"var(--card)", border:"var(--border)", text:"var(--primary)", dot:"var(--muted-foreground)" },
};

function HighlightField({ label, value, tone, icon }: {
  label:string; value:string; tone:Tone; icon?:React.ReactNode;
}) {
  const s = TONE[tone];
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {icon && <span style={{ color:s.dot }} className="shrink-0 text-[13px]">{icon}</span>}
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color:s.dot }}>{label}</span>
      </div>
      <div className="text-[12px] font-medium leading-relaxed px-3 py-2.5 rounded-xl flex items-start"
           style={{ backgroundColor:s.bg, border:`1.5px solid ${s.border}`, color:s.text, minHeight:"44px" }}>
        {value || <span className="italic opacity-40 text-[12px]">Non renseigné</span>}
      </div>
    </div>
  );
}
// ─── OO callout — mini sparkle button in header, textarea always editable ─────

function OOCallout({ value, onChange, onGenerate, generating, genCount }: {
  value:string; onChange:(v:string)=>void;
  onGenerate:()=>void; generating:boolean; genCount:number;
}) {
  const [focused, setFocused] = useState(false);
  const hasValue = value.trim().length > 0;

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-150"
         style={{ border:`2px solid ${focused?"#16a34a":"#86efac"}`,
                  boxShadow:focused?"0 0 0 3px rgba(22,163,74,0.12)":"0 2px 8px rgba(22,163,74,0.08)" }}>

      {/* ── Green header strip + mini Lilia sparkle button ── */}
      <div className="flex items-center gap-2.5 px-4 py-2.5" style={{ backgroundColor:"#16a34a" }}>
        <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
          <GraduationCap className="w-3.5 h-3.5 text-white"/>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-[12px] leading-none">Objectif Opérationnel (OO)</p>
          <p className="text-white/65 text-[10px] mt-0.5">Critère terminal d'évaluation de la séance</p>
        </div>

        {/* ✦ Mini Lilia sparkle — same footprint as AiCell inline buttons */}
        <button
          onClick={onGenerate}
          disabled={generating}
          title={genCount === 0 ? "Générer l'OO avec Lilia" : "Régénérer une alternative avec Lilia"}
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all active:scale-90"
          style={{ backgroundColor:"rgba(255,255,255,0.18)", color:"#fff" }}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.backgroundColor="rgba(255,255,255,0.30)";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.backgroundColor="rgba(255,255,255,0.18)";}}
        >
          {generating
            ? <Loader2 className="w-3.5 h-3.5 animate-spin"/>
            : genCount > 0
              ? <RefreshCw className="w-3.5 h-3.5"/>
              : <Sparkles className="w-3.5 h-3.5"/>}
        </button>

        {/* Status badge — visible once defined */}
        {hasValue && !generating && (
          <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest bg-white/15 px-2 py-1 rounded-full shrink-0">
            ✓ Défini
          </span>
        )}
        {generating && (
          <span className="text-[9px] font-semibold text-white/60 shrink-0">Génère…</span>
        )}
      </div>

      {/* ── Body — textarea always present, hint shown when empty ── */}
      <div className="relative" style={{ backgroundColor:"#f0fdf4" }}>
        {/* Version badge when re-generating */}
        {genCount > 0 && hasValue && (
          <div className="absolute top-2 right-3 flex items-center gap-1"
               style={{ pointerEvents:"none" }}>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor:"rgba(22,163,74,0.15)", color:"#15803d" }}>
              v{genCount}
            </span>
          </div>
        )}

        <textarea
          value={value}
          onChange={e=>onChange(e.target.value)}
          onFocus={()=>setFocused(true)}
          onBlur={()=>setFocused(false)}
          rows={3}
          placeholder={
            generating
              ? "Lilia génère l'objectif opérationnel…"
              : "À la fin de la séance, l'élève devra être capable de… (cliquez ✦ pour générer avec Lilia, ou rédigez directement)"
          }
          className="w-full resize-none outline-none text-[13px] leading-relaxed bg-transparent px-4 pt-3"
          style={{
            fontFamily:"'Plus Jakarta Sans',sans-serif",
            minHeight:"80px",
            color: generating ? "#86efac" : "#14532d",
            paddingBottom: hasValue ? "8px" : "12px",
            paddingRight: genCount > 0 && hasValue ? "48px" : "16px", // room for version badge
          }}
        />

        {/* Confirmation hint — only when value is set */}
        {hasValue && (
          <div className="flex items-center gap-1.5 px-4 pb-3">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor:"#16a34a" }}/>
            <span className="text-[10px] font-semibold" style={{ color:"#15803d" }}>
              Ce critère sera repris dans la phase « Évaluation formative » ci-dessous.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Chip-select dropdown — floating portal overlay ───────────────────────────
// The option list is rendered via createPortal into document.body with
// position:fixed, so it escapes any parent overflow:hidden clipping.

interface MenuPos { top:number; left:number; width:number; openUp:boolean }

function ChipSelect({ label, icon, options, selected, onAdd, onRemove, chipBg }: {
  label:string; icon:React.ReactNode; options:string[]; selected:string[];
  onAdd:(v:string)=>void; onRemove:(v:string)=>void; chipBg:string;
}) {
  const [open,    setOpen]    = useState(false);
  const [pos,     setPos]     = useState<MenuPos>({ top:0, left:0, width:0, openUp:false });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef    = useRef<HTMLDivElement>(null);

  const avail = options.filter(o=>!selected.includes(o));
  const MENU_HEIGHT = Math.min(220, avail.length * 44 + 8);

  // Compute fixed viewport position from trigger rect
  function openMenu() {
    if (!triggerRef.current || avail.length === 0) return;
    const r = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < MENU_HEIGHT && r.top > MENU_HEIGHT;
    setPos({
      top:    openUp ? r.top - MENU_HEIGHT - 4 : r.bottom + 4,
      left:   r.left,
      width:  r.width,
      openUp,
    });
    setOpen(true);
  }

  function closeMenu() { setOpen(false); }

  // Click-outside: checks both the trigger button and the portal menu div
  useEffect(()=>{
    if (!open) return;
    function handler(e:MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) return;
      closeMenu();
    }
    document.addEventListener("mousedown", handler);
    return ()=>document.removeEventListener("mousedown", handler);
  }, [open]);

  // Reposition on scroll while open (prevents drift)
  useEffect(()=>{
    if (!open) return;
    function onScroll() {
      if (!triggerRef.current) return;
      const r = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom;
      const openUp = spaceBelow < MENU_HEIGHT && r.top > MENU_HEIGHT;
      setPos(p=>({...p, top: openUp ? r.top - MENU_HEIGHT - 4 : r.bottom + 4, openUp }));
    }
    window.addEventListener("scroll", onScroll, { passive:true });
    return ()=>window.removeEventListener("scroll", onScroll);
  }, [open, MENU_HEIGHT]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <span className="text-gray-400 shrink-0">{icon}</span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      </div>

      {/* Selected chips */}
      {selected.length>0&&(
        <div className="flex flex-wrap gap-1.5">
          {selected.map(s=>(
            <span key={s} className="inline-flex items-center gap-1 rounded-full text-[11px] font-semibold"
                  style={{ padding:"5px 10px 5px 12px", backgroundColor:chipBg, color:"#fff", border:`1.5px solid ${chipBg}` }}>
              {s}
              <button onClick={()=>onRemove(s)}
                      className="w-4 h-4 rounded-full flex items-center justify-center active:scale-90 shrink-0"
                      style={{ backgroundColor:"rgba(0,0,0,0.2)", marginLeft:"2px" }}
                      aria-label={`Supprimer ${s}`}>
                <X className="w-2.5 h-2.5 text-white"/>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Trigger button */}
      <button
        ref={triggerRef}
        onClick={()=> open ? closeMenu() : openMenu()}
        disabled={avail.length===0}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all"
        style={{ minHeight:"44px", backgroundColor:open?"#f0f4ff":"#fff",
                 border:`1.5px solid ${open?"#3182ce":"#e2e8f0"}`,
                 color:avail.length===0?"#9ca3af":"#2d3748" }}
      >
        <div className="flex items-center gap-2">
          <Plus className="w-3.5 h-3.5" style={{ color:"#3182ce" }}/>
          <span>{avail.length===0?"Tous les éléments ajoutés":"Ajouter un élément…"}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${open?"rotate-180":""}`}/>
      </button>

      {/* ── Floating portal overlay — escapes all parent overflow clipping ── */}
      {open && avail.length>0 && createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top:    pos.top,
            left:   pos.left,
            width:  pos.width,
            zIndex: 99999,
            maxHeight: `${MENU_HEIGHT}px`,
            overflowY: "auto",
            borderRadius: "12px",
            backgroundColor: "var(--card)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)",
            border: "1.5px solid var(--border)",
            scrollbarWidth: "none",
          }}
        >
          {avail.map((opt,i)=>(
            <button
              key={opt}
              onClick={()=>{ onAdd(opt); closeMenu(); }}
              className="w-full text-left px-4 py-3 text-[13px] font-medium text-[#2d3748] hover:bg-[#f0f4ff] transition-colors flex items-center gap-2.5"
              style={{ borderBottom:i<avail.length-1?"1px solid #f1f5f9":"none", minHeight:"44px" }}
            >
              <span className="w-4 h-4 rounded-md border-2 border-gray-200 shrink-0 flex items-center justify-center">
                {/* Empty checkbox visual */}
              </span>
              {opt}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── AI cell textarea ─────────────────────────────────────────────────────────

function AiCell({ value, placeholder, onChange, generating, onGenerate }: {
  value:string; placeholder:string; onChange:(v:string)=>void;
  generating:boolean; onGenerate:()=>void;
}) {
  return (
    <div className="relative group">
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3}
        className="w-full resize-none outline-none text-[13px] leading-relaxed text-[#2d3748] placeholder-gray-300 bg-transparent pr-8"
        style={{ minHeight:"72px", fontFamily:"'Plus Jakarta Sans',sans-serif" }}/>
      <button onClick={onGenerate} disabled={generating} title="Générer avec Lilia"
        className="absolute bottom-2 right-1 w-7 h-7 rounded-lg flex items-center justify-center transition-all opacity-20 group-hover:opacity-100 active:scale-90"
        style={{ color:LILIA.primary }}
        onMouseEnter={e=>{ const el=e.currentTarget as HTMLElement;
          el.style.backgroundColor=LILIA.light; el.style.outline=`1.5px solid ${LILIA.border}`; }}
        onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement;
          el.style.backgroundColor="transparent"; el.style.outline="none"; }}>
        {generating?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Sparkles className="w-3.5 h-3.5"/>}
      </button>
    </div>
  );
}

function SectionCard({ icon, title, subtitle, open, onToggle, children, error, errorMsg }: {
  icon:React.ReactNode; title:string; subtitle?:string;
  open:boolean; onToggle:()=>void; children:React.ReactNode;
  error?:boolean; errorMsg?:string;
}) {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        boxShadow: error
          ? "0 0 0 2px #fca5a5, 0 2px 12px rgba(220,38,38,0.10)"
          : "0 2px 12px rgba(26,54,93,0.07), 0 1px 3px rgba(26,54,93,0.04)",
      }}
    >
      <button onClick={onToggle}
              className="w-full flex items-center justify-between px-5 py-4 gap-3 text-left"
              style={{ minHeight:"56px" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
               style={{ backgroundColor: error ? "#ef4444" : "#1a365d" }}>
            <span className="text-white">{error ? <AlertCircle className="w-4 h-4"/> : icon}</span>
          </div>
          <div>
            <p className="text-[13px] font-bold leading-tight" style={{ color: error?"#b91c1c":"var(--primary)" }}>
              {title}
            </p>
            {error && errorMsg
              ? <p className="text-[10px] font-semibold text-red-500 mt-0.5">{errorMsg}</p>
              : subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {open?<ChevronUp className="w-4 h-4 text-gray-400 shrink-0"/>
             :<ChevronDown className="w-4 h-4 text-gray-400 shrink-0"/>}
      </button>
      {open&&<div className="px-5 pb-5 border-t border-gray-100">{children}</div>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LessonEditor() {
  const navigate               = useNavigate();
  const { state }              = useLocation() as { state:Record<string,unknown>|null };
  const { loading, blocked, skip } = useProfileGuard();

  // From Screen 2
  const contenus:   string[] = (state?.contenus   as string[]|undefined) ?? ["Les sources de l'histoire locale","Le rôle des anciens et des récits oraux","Les vestiges et monuments du milieu proche"];
  const discipline  = (state?.discipline  as string|undefined) ?? "Histoire";
  const niveau      = (state?.niveau      as string|undefined) ?? "CE2";
  const domaine     = (state?.domaine     as string|undefined) ?? "ESVS";
  const sousDomaine = (state?.sousDomaine as string|undefined) ?? "Découverte du monde";
  // ── Triangulation table: discipline → { palier, competence (CB) } ──────────
  // When the fiche is created from the planning grid (fromPlanning === true), the
  // system deterministically maps the selected discipline to the official Palier
  // and CB from the Senegalese CEB programme. These two fields are then locked
  // as read-only so the teacher cannot accidentally alter curriculum anchors.
  const CONTENT_TRIANGULATION: Record<string, { palier: string; competence: string }> = {
    "Activités Numériques": {
      palier: "Palier 2",
      competence: "CB1 · L'élève résout des situations-problèmes numériques liées à la vie courante en mobilisant des compétences en numération, calcul et logique dans le système décimal.",
    },
    "Activités Géométriques": {
      palier: "Palier 2",
      competence: "CB2 · L'élève résout des problèmes géométriques en identifiant, décrivant et construisant des figures planes et des solides de l'espace.",
    },
    "Activités de Mesure": {
      palier: "Palier 2",
      competence: "CB3 · L'élève résout des situations de mesure en choisissant et utilisant les unités et instruments adaptés.",
    },
    "Résolution de Problèmes": {
      palier: "Palier 2",
      competence: "CB4 · L'élève résout des problèmes de la vie courante en mobilisant des compétences mathématiques dans une démarche de raisonnement structurée.",
    },
    "Lecture": {
      palier: "Palier 2",
      competence: "CB1 · L'élève lit des textes variés avec fluidité et en comprend le sens global en mobilisant des stratégies de lecture efficaces.",
    },
    "Grammaire": {
      palier: "Palier 2",
      competence: "CB1 · L'élève traite des situations de communication en utilisant les structures grammaticales de la langue française dans le respect des normes syntaxiques.",
    },
    "Conjugaison": {
      palier: "Palier 2",
      competence: "CB1 · L'élève produit des énoncés corrects en conjuguant les verbes aux temps et modes adaptés à la situation de communication.",
    },
    "Orthographe": {
      palier: "Palier 2",
      competence: "CB1 · L'élève écrit correctement les mots en appliquant les règles orthographiques d'usage et grammaticales de la langue française.",
    },
    "Expression orale": {
      palier: "Palier 2",
      competence: "CB1 · L'élève s'exprime oralement de façon claire et structurée dans des situations de communication variées de la vie scolaire et sociale.",
    },
    "Récitation": {
      palier: "Palier 2",
      competence: "CB1 · L'élève mémorise et restitue des textes poétiques ou littéraires en respectant le rythme, l'intonation et l'expressivité.",
    },
    "Histoire": {
      palier: "Palier 2",
      competence: "CB1 · L'élève situe dans le temps des faits et événements historiques majeurs liés au Sénégal et à l'Afrique de l'Ouest en utilisant des repères chronologiques.",
    },
    "Géographie": {
      palier: "Palier 2",
      competence: "CB1 · L'élève situe dans l'espace des réalités géographiques locales, nationales et régionales en utilisant des représentations cartographiques adaptées.",
    },
    "Sciences (IST)": {
      palier: "Palier 2",
      competence: "CB2 · L'élève explique des phénomènes naturels et des faits scientifiques en mobilisant une démarche d'observation, d'investigation et d'expérimentation.",
    },
    "Vivre ensemble": {
      palier: "Palier 2",
      competence: "CB3 · L'élève adopte des comportements citoyens et solidaires en comprenant ses droits, devoirs et responsabilités au sein de la communauté.",
    },
    "EPS": {
      palier: "Palier 2",
      competence: "CB1 · L'élève développe ses capacités motrices et sportives en pratiquant des activités physiques dans le respect des règles et des valeurs du sport.",
    },
    "Arts plastiques": {
      palier: "Palier 2",
      competence: "CB1 · L'élève exprime sa sensibilité et sa créativité à travers des productions plastiques en utilisant des techniques, des matériaux et des outils variés.",
    },
    "Éd. musicale": {
      palier: "Palier 2",
      competence: "CB1 · L'élève développe ses capacités musicales en pratiquant le chant choral, l'écoute musicale et les activités rythmiques dans des contextes culturels variés.",
    },
    // ── New ESVS activities ──────────────────────────────────────────────────
    "IST (Initiation Scientifique et Technologique)": {
      palier: "Palier 2",
      competence: "CB2 · L'élève explique des phénomènes naturels et des faits scientifiques en mobilisant une démarche d'observation, d'investigation et d'expérimentation.",
    },
    "Vivre dans son milieu": {
      palier: "Palier 2",
      competence: "CB3 · L'élève agit de façon responsable sur son environnement naturel et social en développant des attitudes favorables au développement durable.",
    },
    // ── New EPSA activity (full-name variant) ─────────────────────────────────
    "Éducation Musicale": {
      palier: "Palier 2",
      competence: "CB1 · L'élève développe ses capacités musicales en pratiquant le chant choral, l'écoute musicale et les activités rythmiques dans des contextes culturels variés.",
    },
  };

  // When arriving from the planning grid, discipline is known → triangulate Palier + CB.
  const fromPlanning  = !!(state?.fromPlanning);
  const triangulated  = fromPlanning ? (CONTENT_TRIANGULATION[discipline] ?? null) : null;
  // isTriangulated = we have deterministic values → lock Palier + CB as read-only
  const isTriangulated = fromPlanning && !!triangulated;

  // ── Curriculum fields ─────────────────────────────────────────────────────
  // Palier + CB: auto-set from triangulation (locked read-only when isTriangulated).
  // OA + OS: editable by the teacher — not deterministically fixed by curriculum.
  const [palier,     setPalier]     = useState(
    triangulated?.palier     || (state?.palier     as string|undefined) || ""
  );
  const [oa,         setOa]         = useState((state?.oa         as string|undefined) ?? "");
  const [os,         setOs]         = useState((state?.os         as string|undefined) ?? "");
  const [competence, setCompetence] = useState(
    triangulated?.competence || (state?.competence as string|undefined) || ""
  );
  // ── Merge flag from Screen 2 checkbox ──────────────────────────────────────
  const merged      = (state?.merged      as boolean|undefined) ?? false;

  // sessionStorage key — unique per content set
  const SESSION_KEY = `ecole2-ws-${contenus.join("|")}`;

  // Auto-filled session-level fields
  const ecoleAuto    = "École Liberté 6";
  const dateHeureAuto = useMemo(()=>getNow(),[]);

  // ── Per-fiche state (tab mode) ─────────────────────────────────────────────
  const [fiches,      setFiches]      = useState<FicheState[]>(()=>contenus.map(()=>initFiche("45 min")));
  // ── Merged state (single continuous fiche) ────────────────────────────────
  const [mergedFiche, setMergedFiche] = useState<FicheState>(()=>initFiche("45 min"));

  // UI state
  const [activeFiche,  setActiveFiche]  = useState(0);
  const [headerOpen,   setHeaderOpen]   = useState(false);
  const [cadreOpen,    setCadreOpen]    = useState(false);
  const [moyensOpen,   setMoyensOpen]   = useState(false);
  const [activeColTab, setActiveColTab] = useState<ColTab>(1);
  const [saved,        setSaved]        = useState(false);
  const [stateRestored,setStateRestored]= useState(false);
  const [genAll,       setGenAll]       = useState(false);
  const [genCell,      setGenCell]      = useState<string|null>(null);
  const [ooGenerating, setOoGenerating] = useState(false);

  // ── Validation state ─────────────────────────────────────────────────────
  interface ToastInfo { message: string; details: string[] }
  const [toast,          setToast]          = useState<ToastInfo|null>(null);
  const [invalidSections,setInvalidSections]= useState<Set<string>>(new Set());
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);

  // ── Session storage ─────────────────────────────────────────────────────
  useEffect(()=>{
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.fiches && Array.isArray(saved.fiches) && saved.fiches.length===contenus.length) {
          setFiches(saved.fiches);
        }
        if (saved.mergedFiche) {
          setMergedFiche(saved.mergedFiche);
        }
        setStateRestored(true);
      }
    } catch (e) { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(()=>{
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ fiches, mergedFiche })); }
    catch(e){}
  }, [fiches, mergedFiche, SESSION_KEY]);

  useEffect(()=>{
    if (!stateRestored) return;
    const t = setTimeout(()=>setStateRestored(false), 4000);
    return ()=>clearTimeout(t);
  }, [stateRestored]);

  // ── Derived — conditional on mode ────────────────────────────────────────
  // Tab mode: single-sequence counts
  const tabFiche        = fiches[activeFiche];
  const tabChip         = CHIP_COLORS[activeFiche % CHIP_COLORS.length];
  const tabTotalCells   = PHASES.length * 2;
  const tabFilledCells  = Object.values(tabFiche.cells).filter(Boolean).length;
  // Merged mode: all-sequences counts
  const mrgTotalCells   = contenus.length * PHASES.length * 2;
  const mrgFilledCells  = Object.values(mergedFiche.cells).filter(Boolean).length;
  // Active values
  const activeFicheData = merged ? mergedFiche   : tabFiche;
  const activeOO        = activeFicheData.oo;
  const totalCells      = merged ? mrgTotalCells  : tabTotalCells;
  const filledCells     = merged ? mrgFilledCells : tabFilledCells;
  const pct             = Math.round((filledCells / totalCells) * 100);

  // ── Updaters ─────────────────────────────────────────────────────────────
  function updTabFiche<K extends keyof FicheState>(key: K, val: FicheState[K]) {
    setFiches(prev=>prev.map((f,i)=>i===activeFiche?{...f,[key]:val}:f));
  }
  function updMrgFiche<K extends keyof FicheState>(key: K, val: FicheState[K]) {
    setMergedFiche(prev=>({...prev,[key]:val}));
  }
  // Generic updater — routes to the right store
  function updFiche<K extends keyof FicheState>(key: K, val: FicheState[K]) {
    merged ? updMrgFiche(key,val) : updTabFiche(key,val);
  }

  // Tab-mode cell update: key = `${pi}-${col}`
  function updTabCell(pi:number, col:"m"|"e", val:string) {
    setFiches(prev=>prev.map((f,i)=>{
      if(i!==activeFiche) return f;
      return {...f, cells:{...f.cells,[fck(pi,col)]:val}};
    }));
  }
  // Merged-mode cell update: key = `${ci}-${pi}-${col}`
  function updMrgCell(ci:number, pi:number, col:"m"|"e", val:string) {
    const key=`${ci}-${pi}-${col}`;
    setMergedFiche(prev=>({...prev, cells:{...prev.cells,[key]:val}}));
  }

  function ficheCompletion(f:FicheState) {
    const n = Object.values(f.cells).filter(Boolean).length;
    return n>0 ? Math.round((n/tabTotalCells)*100) : 0;
  }

  // ── Back ──────────────────────────────────────────────────────────────────
  function handleBack() {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ fiches, mergedFiche })); }
    catch(e){}
    navigate("/new-fiche");
  }

  // ── OO generation ─────────────────────────────────────────────────────────
  function handleGenOO() {
    if (ooGenerating) return;
    setOoGenerating(true);
    const content = merged ? contenus[0] : contenus[activeFiche];  // representative content
    const currentVariant = activeFicheData.ooVariant;
    setTimeout(()=>{
      const variants = getOOVariants(discipline, content);
      const idx     = currentVariant % variants.length;
      const nextIdx = (idx+1) % variants.length;
      updFiche("oo", variants[idx]);
      updFiche("ooVariant", nextIdx);
      setOoGenerating(false);
    }, 800+Math.random()*500);
  }

  // ── Eval text helpers ──────────────────────────────────────────────────────
  function evalTxt(oo:string, col:"m"|"e") {
    return col==="m"
      ? `Proposer un exercice mesurant l'OO : « ${oo.slice(0,80)}${oo.length>80?"…":""}». Circuler et corriger. Correction collective.`
      : `Démontrer l'acquisition : « ${oo.slice(0,80)}${oo.length>80?"…":""}». Vérifier ses réponses. Corriger ses erreurs.`;
  }

  // ── Cell generation ───────────────────────────────────────────────────────
  // cellId: for tab mode `${pi}-${col}`, for merged mode `${ci}-${pi}-${col}`
  function generateCell(ci:number, pi:number, col:"m"|"e") {
    const cellId = merged ? `${ci}-${pi}-${col}` : fck(pi,col);
    if (genCell||genAll) return;
    setGenCell(cellId);
    const isEval = PHASES[pi]===EVAL_PHASE;
    setTimeout(()=>{
      const oo = activeFicheData.oo;
      const val = isEval&&oo ? evalTxt(oo,col) : (col==="m"?PHASE_AI[PHASES[pi]].maitre:PHASE_AI[PHASES[pi]].eleves);
      if (merged) updMrgCell(ci,pi,col,val);
      else        updTabCell(pi,col,val);
      setGenCell(null);
    }, 650+Math.random()*400);
  }

  // ── Generate all ──────────────────────────────────────────────────────────
  function generateAll() {
    if(genAll) return;
    setGenAll(true);
    const oo = activeFicheData.oo;
    if (merged) {
      // Fill ALL sequences for the merged workspace
      const q:{key:string;val:string}[]=[];
      contenus.forEach((_,ci)=>PHASES.forEach((ph,pi)=>{
        const isEval=ph===EVAL_PHASE;
        q.push({key:`${ci}-${pi}-m`, val:isEval&&oo?evalTxt(oo,"m"):PHASE_AI[ph].maitre});
        q.push({key:`${ci}-${pi}-e`, val:isEval&&oo?evalTxt(oo,"e"):PHASE_AI[ph].eleves});
      }));
      q.forEach(({key,val},i)=>setTimeout(()=>{
        setMergedFiche(p=>({...p,cells:{...p.cells,[key]:val}}));
        if(i===q.length-1) setGenAll(false);
      },75*(i+1)));
    } else {
      // Fill active fiche only
      const q:{pi:number;col:"m"|"e";val:string}[]=[];
      PHASES.forEach((ph,pi)=>{
        const isEval=ph===EVAL_PHASE;
        q.push({pi,col:"m",val:isEval&&oo?evalTxt(oo,"m"):PHASE_AI[ph].maitre});
        q.push({pi,col:"e",val:isEval&&oo?evalTxt(oo,"e"):PHASE_AI[ph].eleves});
      });
      q.forEach(({pi,col,val},i)=>setTimeout(()=>{
        updTabCell(pi,col,val);
        if(i===q.length-1) setGenAll(false);
      },75*(i+1)));
    }
  }

  function handleSave() { setSaved(true); setTimeout(()=>setSaved(false),2500); }

  // ── Validation ────────────────────────────────────────────────────────────

  interface MissingField { label: string; section: "cadre"|"moyens"|"workspace" }

  function validateFiche(): MissingField[] {
    const missing: MissingField[] = [];
    const fd = activeFicheData;

    if (!domaine)     missing.push({ label:"Domaine",                    section:"cadre" });
    if (!discipline)  missing.push({ label:"Discipline",                 section:"cadre" });
    if (!competence)  missing.push({ label:"Compétence de Base (CB)",    section:"cadre" });
    if (!palier)      missing.push({ label:"Palier",                     section:"cadre" });
    if (!os)          missing.push({ label:"Objectif Spécifique (OS)",   section:"cadre" });
    if (!contenus.length) missing.push({ label:"Contenu / Objet de la leçon", section:"cadre" });
    if (!fd.oo)       missing.push({ label:"Objectif Opérationnel (OO)", section:"cadre" });
    if (!fd.matSel.length && !fd.pedSel.length)
      missing.push({ label:"Moyens Matériels ou Pédagogiques",           section:"moyens" });
    if (filledCells === 0)
      missing.push({ label:"Démarche (au moins une activité renseignée)",section:"workspace" });

    return missing;
  }

  function showValidationError(missing: MissingField[]) {
    const sections = new Set(missing.map(m => m.section));
    setInvalidSections(sections);

    // Open sections that need attention so the teacher sees the error highlights
    if (sections.has("cadre"))   setCadreOpen(true);
    if (sections.has("moyens"))  setMoyensOpen(true);

    // Toast
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message:"Action impossible : Votre fiche est incomplète.",
               details: missing.map(m=>m.label) });
    toastTimerRef.current = setTimeout(()=>setToast(null), 6000);

    // Scroll to first flagged section (cadre > moyens > workspace)
    setTimeout(()=>{
      const target = sections.has("cadre")   ? "[data-section='cadre']"
                   : sections.has("moyens")  ? "[data-section='moyens']"
                   : "[data-section='workspace']";
      document.querySelector(target)?.scrollIntoView({ behavior:"smooth", block:"center" });
    }, 120);
  }

  // Clears validation state when the teacher starts correcting fields
  function clearInvalid(section: string) {
    if (invalidSections.has(section as "cadre"|"moyens"|"workspace")) {
      setInvalidSections(prev => { const n=new Set(prev); n.delete(section as "cadre"); return n; });
    }
  }

  // ── Validated navigate to preview ────────────────────────────────────────
  function buildPreviewState(generatePDF = false) {
    return {
      fiches, mergedFiche, merged, contenus,
      discipline, niveau, domaine, sousDomaine, palier, os, oa, competence,
      ecole: ecoleAuto, dateHeure: dateHeureAuto,
      // Resource data — bound per active fiche
      matSel: activeFicheData.matSel,
      pedSel: activeFicheData.pedSel,
      ...(generatePDF ? { generatePDF: true } : {}),
    };
  }

  function handleGoToPreview(generatePDF = false) {
    const missing = validateFiche();
    if (missing.length) { showValidationError(missing); return; }
    setInvalidSections(new Set());
    navigate("/preview", { state: buildPreviewState(generatePDF) });
  }

  // ── Cell render helper ────────────────────────────────────────────────────
  function renderAiCell(ci:number, pi:number, col:"m"|"e", phase:Phase) {
    const cellId  = merged ? `${ci}-${pi}-${col}` : fck(pi,col);
    const cellVal = merged ? (mergedFiche.cells[cellId]??"") : (tabFiche.cells[cellId]??"");
    const isEval  = phase===EVAL_PHASE;
    const ph      = PHASE_AI[phase];
    const oo      = activeFicheData.oo;
    const placeholder = isEval&&oo
      ? (col==="m" ? `Exercice lié à l'OO : « ${oo.slice(0,55)}${oo.length>55?"…":""}»` : `Réponse attendue prouvant l'acquisition de l'OO`)
      : (col==="m" ? ph.maitre : ph.eleves);
    return (
      <AiCell value={cellVal} placeholder={placeholder}
              onChange={v=>{ merged?updMrgCell(ci,pi,col,v):updTabCell(pi,col,v); }}
              generating={genCell===cellId}
              onGenerate={()=>generateCell(ci,pi,col)}/>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) return <ProfileGuardLoader loading />;
  if (blocked) return <ProfileGuardLoader blocked onSkip={skip} />;

  return (
    <div className="min-h-screen bg-background flex flex-col"
         style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>

      {/* ══ VALIDATION TOAST ════════════════════════════════════════════════ */}
      {toast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-auto"
          style={{ animation:"slideDown 250ms ease" }}
        >
          <style>{`@keyframes slideDown{from{opacity:0;transform:translate(-50%,-12px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
          <div className="bg-white rounded-2xl overflow-hidden"
               style={{ boxShadow:"0 8px 32px rgba(220,38,38,0.18), 0 2px 8px rgba(0,0,0,0.08)",
                        border:"1.5px solid #fca5a5" }}>
            {/* Red accent bar */}
            <div className="h-1 bg-gradient-to-r from-red-400 to-red-500"/>
            <div className="flex items-start gap-3 px-4 py-3.5">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-4.5 h-4.5 text-red-500"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-red-700 leading-tight">{toast.message}</p>
                <ul className="mt-2 space-y-1">
                  {toast.details.map((d,i)=>(
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-red-500">
                      <span className="shrink-0 mt-0.5">·</span>
                      <span><strong>{d}</strong> — Ce champ est obligatoire pour l'homologation.</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button onClick={()=>setToast(null)}
                      className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4"/>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ STICKY HEADER ════════════════════════════════════════════════════ */}
       <div className="sticky top-0 z-30 bg-card"
         style={{ boxShadow:"0 1px 0 var(--border), 0 2px 10px rgba(0,0,0,0.04)" }}>

        {/* Nav */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-3 pb-2 flex items-center gap-3">
          <button onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:text-secondary transition-colors shrink-0"
            style={{ minHeight:"44px" }}>
            <ArrowLeft className="w-4 h-4"/>
            <span className="hidden sm:inline">Retour aux contenus</span>
            <span className="sm:hidden">Retour</span>
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-[14px] md:text-[16px] font-bold text-primary truncate">
              Édition de la démarche pédagogique
            </h1>
          </div>
          <div className="shrink-0 flex items-center gap-1.5">
            <div className="w-14 md:w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                   style={{ width:`${pct}%`, backgroundColor:pct===100?"#059669":tabChip.on }}/>
            </div>
            <span className="text-[10px] text-gray-400 font-bold hidden md:block">{pct}%</span>
          </div>
        </div>

        {/* ── State restored banner ── */}
        {stateRestored && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 pb-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                 style={{ backgroundColor:"#f0fdf4", border:"1px solid #bbf7d0" }}>
              <RotateCcw className="w-3.5 h-3.5 shrink-0" style={{ color:"#16a34a" }}/>
              <span className="text-[11px] font-semibold" style={{ color:"#15803d" }}>
                Données de travail restaurées automatiquement — votre progression est préservée.
              </span>
            </div>
          </div>
        )}

        {/* Contenus accordion */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-2">
          <button onClick={()=>setHeaderOpen(o=>!o)}
                  className="w-full flex items-center justify-between gap-3 rounded-xl px-3.5 py-2 transition-all"
                  style={{ backgroundColor:headerOpen?"var(--accent)":"var(--muted)",
                           border:`1.5px solid ${headerOpen?"var(--secondary)":"var(--border)"}` }}>
            <div className="flex items-center gap-2 min-w-0">
              <Check className="w-3.5 h-3.5 shrink-0" style={{ color:"#3182ce" }}/>
                <span className="text-[12px] font-semibold text-primary truncate">Contenus sélectionnés</span>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor:"#3182ce" }}>{contenus.length}</span>
            </div>
            {headerOpen?<ChevronUp className="w-4 h-4 text-gray-400 shrink-0"/>
                       :<ChevronDown className="w-4 h-4 text-gray-400 shrink-0"/>}
          </button>
          {headerOpen&&(
            <div className="flex flex-wrap gap-1.5 mt-2 px-0.5">
              {contenus.map((c,i)=><SeqChip key={c} label={c} index={i}/>)}
            </div>
          )}
        </div>

        {/* ── Multi-fiche tab bar — tab mode only ── */}
        {!merged && contenus.length>1&&(
          <div className="max-w-7xl mx-auto border-t border-gray-100">
            <div className="flex overflow-x-auto px-4 md:px-6"
                 style={{ scrollbarWidth:"none" }}>
              {contenus.map((contenu,i)=>{
                const c=CHIP_COLORS[i%CHIP_COLORS.length];
                const cmp=ficheCompletion(fiches[i]);
                const isActive=activeFiche===i;
                return (
                  <button key={i}
                    onClick={()=>{ setActiveFiche(i); setActiveColTab(1); }}
                    className="flex flex-col items-start shrink-0 px-4 py-3 transition-all"
                    style={{ minWidth:"160px", maxWidth:"220px",
                             borderBottom:`3px solid ${isActive?c.on:"transparent"}`,
                             backgroundColor:isActive?c.bg:"transparent", minHeight:"56px" }}>
                    <div className="flex items-center gap-1.5 w-full">
                      <span className="text-[10px] font-bold uppercase tracking-widest"
                            style={{ color:isActive?c.on:"#94a3b8" }}>
                        Fiche {i+1}
                      </span>
                      {cmp>0&&(
                        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                              style={{ backgroundColor:isActive?c.on:"#e2e8f0",
                                       color:isActive?"#fff":"#64748b" }}>
                          {cmp}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 w-full min-w-0">
                      <span style={{ opacity:0.55, fontWeight:700, fontSize:"10px",
                                     color:isActive?c.on:"#94a3b8", flexShrink:0 }}>
                        {pad(i)}.
                      </span>
                      <span className="text-[11px] font-semibold truncate"
                            style={{ color:isActive?c.on:"#64748b" }}>
                        {contenu}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Merged mode banner ── */}
        {merged && contenus.length>1 && (
          <div className="max-w-7xl mx-auto border-t border-gray-100">
            <div className="px-4 md:px-6 py-2.5 flex items-center gap-2">
              <div className="flex gap-1 flex-wrap">
                {contenus.map((c,i)=>(
                  <span key={i} className="inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-1"
                        style={{ backgroundColor:CHIP_COLORS[i%CHIP_COLORS.length].bg,
                                 color:CHIP_COLORS[i%CHIP_COLORS.length].on }}>
                    <span style={{ opacity:0.55 }}>{pad(i)}.</span>
                    <span className="truncate max-w-[120px]">{c}</span>
                  </span>
                ))}
              </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0"
                  style={{ backgroundColor:"var(--accent)", color:"var(--primary)" }}>
                Fiche unifiée
              </span>
            </div>
          </div>
        )}

        <div className="h-0.5" style={{ background: "linear-gradient(to right, var(--primary), var(--secondary), transparent)" }}/>
      </div>

      {/* ══ BODY ════════════════════════════════════════════════════════════ */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-4 space-y-3 pb-28">

        {/* ── CADRE ADMINISTRATIF ─────────────────────────────────────────── */}
        <div data-section="cadre">
        <SectionCard
          icon={<BookOpen className="w-4 h-4"/>}
          title="Cadre Administratif"
          subtitle={merged
            ? `Fiche unifiée · ${contenus.length} séquences fusionnées`
            : `Fiche ${activeFiche+1} · ${contenus[activeFiche]}`}
          open={cadreOpen}
          onToggle={()=>{ setCadreOpen(o=>!o); clearInvalid("cadre"); }}
          error={invalidSections.has("cadre")}
          errorMsg="Certains champs obligatoires sont incomplets — cliquez pour les remplir">

          {/* Bilateral header */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="space-y-3">
              <AutoField icon={<School className="w-3.5 h-3.5"/>} label="École" value={ecoleAuto}/>
              <ReadField icon={<Layers className="w-3.5 h-3.5"/>}
                         label="Niveau / Étape"
                         value={[niveau,palier].filter(Boolean).join(" · ")}/>
            </div>
            <div className="space-y-3">
              <AutoField icon={<CalendarDays className="w-3.5 h-3.5"/>} label="Date & Heure" value={dateHeureAuto}/>
              <EditField icon={<Clock className="w-3.5 h-3.5"/>} label="Durée"
                         value={activeFicheData.duree}
                         onChange={v=>updFiche("duree",v)} placeholder="45 min"/>
            </div>
          </div>

          {/* Pedagogical hierarchy */}
          <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
            <ReadField label="Domaine" value={domaine}/>
            <ReadField label="Sous-domaine · Discipline"
                       value={[sousDomaine,discipline].filter(Boolean).join(" · ")}/>
            {/* CB — editable so teacher can correct/complete if not pre-filled */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 shrink-0" style={{ color:"#2563eb" }}/>
                <span className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color:"#2563eb" }}>
                  Compétence de Base (CB)
                </span>
                {/* Lock badge — only shown when triangulated from planning */}
                {isTriangulated && (
                  <span className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ backgroundColor:"#dbeafe", color:"#1e40af" }}>
                    🔒 Auto
                  </span>
                )}
              </div>
              {isTriangulated ? (
                /* Locked read-only display — triangulated from curriculum */
                <div className="rounded-xl px-3 py-2.5"
                     style={{ backgroundColor:"#f1f5f9",
                              border:"1.5px solid #cbd5e1",
                              color:"#475569", fontSize:"12px",
                              fontWeight:500, lineHeight:1.55,
                              userSelect:"none", cursor:"not-allowed" }}>
                  {competence}
                </div>
              ) : (
                <textarea
                  value={competence} onChange={e=>setCompetence(e.target.value)}
                  placeholder="Saisissez ou complétez la Compétence de Base officielle…"
                  rows={2}
                  className="rounded-xl resize-none outline-none font-medium text-[12px] leading-relaxed"
                  style={{ padding:"10px 12px", minHeight:"44px",
                           backgroundColor: competence?"#eff6ff":"#fff",
                           border:`1.5px solid ${competence?"#bfdbfe":"#e2e8f0"}`,
                           color: competence?"#1e3a8a":"#6b7280",
                           fontFamily:"'Plus Jakarta Sans',sans-serif",
                           transition:"border-color 150ms" }}/>
              )}
            </div>

            {/* Palier — locked when triangulated, editable otherwise */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Palier
                </span>
                {isTriangulated && (
                  <span className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ backgroundColor:"#dbeafe", color:"#1e40af" }}>
                    🔒 Auto
                  </span>
                )}
              </div>
              {isTriangulated ? (
                /* Locked read-only pill */
                <div className="rounded-xl px-3 flex items-center"
                     style={{ minHeight:"44px", backgroundColor:"#f1f5f9",
                              border:"1.5px solid #cbd5e1",
                              color:"#475569", fontSize:"13px",
                              fontWeight:600, cursor:"not-allowed",
                              userSelect:"none" }}>
                  {palier}
                </div>
              ) : (
                <div className="relative">
                  <select value={palier} onChange={e=>setPalier(e.target.value)}
                    className="w-full appearance-none rounded-xl outline-none font-semibold"
                    style={{ minHeight:"44px", padding:"0 36px 0 12px", fontSize:"13px",
                             fontFamily:"'Plus Jakarta Sans',sans-serif",
                             backgroundColor: palier?"#f8fafc":"#fff",
                             border:"1.5px solid #e2e8f0",
                             color:"#1a365d", cursor:"pointer" }}>
                    <option value="">Sélectionner le Palier…</option>
                    {["Palier 1","Palier 2","Palier 3"].map(p=>(
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-gray-400"
                       viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                  </svg>
                </div>
              )}
            </div>

            {/* OA — editable text field */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 shrink-0" style={{ color:"#64748b" }}/>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Objectif d'Apprentissage (OA)
                </span>
              </div>
              <textarea
                value={oa} onChange={e=>setOa(e.target.value)}
                placeholder="Saisissez ou complétez l'Objectif d'Apprentissage…"
                rows={2}
                className="rounded-xl resize-none outline-none font-medium text-[12px] leading-relaxed"
                style={{ padding:"10px 12px", minHeight:"44px",
                         backgroundColor: oa?"#f8fafc":"#fff",
                         border:`1.5px solid ${oa?"#e2e8f0":"#e2e8f0"}`,
                         color:"#1a365d",
                         fontFamily:"'Plus Jakarta Sans',sans-serif",
                         transition:"border-color 150ms" }}/>
            </div>

            {/* OS — editable text field, amber highlight when filled */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 shrink-0" style={{ color:"#d97706" }}/>
                <span className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color:"#d97706" }}>
                  Objectif Spécifique (OS)
                </span>
              </div>
              <textarea
                value={os} onChange={e=>setOs(e.target.value)}
                placeholder="Saisissez ou complétez l'Objectif Spécifique…"
                rows={2}
                className="rounded-xl resize-none outline-none font-medium text-[12px] leading-relaxed"
                style={{ padding:"10px 12px", minHeight:"44px",
                         backgroundColor: os?"#fffbeb":"#fff",
                         border:`1.5px solid ${os?"#fde68a":"#e2e8f0"}`,
                         color: os?"#78350f":"#6b7280",
                         fontFamily:"'Plus Jakarta Sans',sans-serif",
                         transition:"border-color 150ms" }}/>
            </div>

            {/* Contenu — merged shows ALL, tab shows active */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Contenu / Objet de la leçon
              </span>
              {merged ? (
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl"
                     style={{ backgroundColor:"#f8fafc", border:"1.5px solid #e2e8f0" }}>
                  {contenus.map((c,i)=>{
                    const col=CHIP_COLORS[i%CHIP_COLORS.length];
                    return (
                      <span key={i} className="inline-flex items-center gap-1 rounded-full text-[11px] font-semibold"
                            style={{ padding:"3px 10px", backgroundColor:col.on+"18",
                                     color:col.on, border:`1px solid ${col.on}40` }}>
                        <span style={{ opacity:0.55, fontWeight:700 }}>{pad(i)}.</span>
                        {c}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl"
                     style={{ backgroundColor:tabChip.bg, border:`1.5px solid ${tabChip.on}30` }}>
                  <span style={{ opacity:0.55, fontWeight:700, fontSize:"12px", color:tabChip.on }}>{pad(activeFiche)}.</span>
                  <span className="text-[13px] font-semibold" style={{ color:tabChip.on }}>
                    {contenus[activeFiche]}
                  </span>
                </div>
              )}
            </div>

            {/* OO — mini Lilia button, shared in merged / per-fiche in tab */}
            <OOCallout
              value={activeFicheData.oo}
              onChange={v=>updFiche("oo",v)}
              onGenerate={handleGenOO}
              generating={ooGenerating}
              genCount={activeFicheData.ooVariant}
            />
          </div>
        </SectionCard>
        </div>{/* end data-section="cadre" */}

        {/* ── MOYENS ───────────────────────────────────────────────────────── */}
        <div data-section="moyens">
        <SectionCard
          icon={<span className="text-sm leading-none">🎒</span>}
          title="Moyens Matériels et Pédagogiques"
          subtitle={merged
            ? "Ressources pour la fiche unifiée"
            : `Fiche ${activeFiche+1} — ressources spécifiques à ce contenu`}
          open={moyensOpen}
          onToggle={()=>{ setMoyensOpen(o=>!o); clearInvalid("moyens"); }}
          error={invalidSections.has("moyens")}
          errorMsg="Sélectionnez au moins un moyen matériel ou pédagogique">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
            <ChipSelect label="Moyens Matériels" icon={<span className="text-xs">🔧</span>}
              options={MATERIEL_OPTIONS} selected={activeFicheData.matSel}
              onAdd={v=>updFiche("matSel",[...activeFicheData.matSel,v])}
              onRemove={v=>updFiche("matSel",activeFicheData.matSel.filter(x=>x!==v))}
              chipBg="#0d9488"/>
            <ChipSelect label="Moyens Pédagogiques" icon={<span className="text-xs">📚</span>}
              options={PEDAGOGIQUE_OPTIONS} selected={activeFicheData.pedSel}
              onAdd={v=>updFiche("pedSel",[...activeFicheData.pedSel,v])}
              onRemove={v=>updFiche("pedSel",activeFicheData.pedSel.filter(x=>x!==v))}
              chipBg="#2563eb"/>
          </div>
        </SectionCard>
        </div>{/* end data-section="moyens" */}

        {/* ── LILIA GLOBAL ─────────────────────────────────────────────────── */}
        {activeOO&&(
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
               style={{ backgroundColor:"#f0fdf4", border:"1px solid #bbf7d0" }}>
            <GraduationCap className="w-3.5 h-3.5 shrink-0" style={{ color:"#16a34a" }}/>
            <span className="text-[11px] font-semibold" style={{ color:"#15803d" }}>
              OO défini · Lilia intègrera le critère terminal dans {merged?"toutes les séquences":"la phase d'évaluation"}.
            </span>
          </div>
        )}

        <button onClick={generateAll} disabled={genAll}
          className="w-full flex items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left transition-all active:scale-[0.99]"
          style={{ background:`linear-gradient(135deg, ${LILIA.primary} 0%, ${LILIA.mid} 60%, #9333ea 100%)`,
                   boxShadow:`0 4px 20px ${LILIA.glow}`, opacity:genAll?0.88:1 }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                 style={{ backgroundColor:"rgba(255,255,255,0.18)" }}>
              {genAll?<Loader2 className="w-5 h-5 text-white animate-spin"/>
                     :<Sparkles className="w-5 h-5 text-white"/>}
            </div>
            <div>
              <p className="text-white font-bold text-[14px] leading-tight">
                {genAll?"Lilia génère votre démarche…":"Générer toute la démarche avec Lilia"}
              </p>
              <p className="text-white/60 text-[11px] mt-0.5">
                {genAll
                  ? `Remplissage de ${totalCells} cellules…`
                  : merged
                    ? `IA · Fiche unifiée · ${contenus.length} séquences · ${PHASES.length} phases${activeOO?" · OO intégré":""}`
                    : `IA · Fiche ${activeFiche+1} · ${PHASES.length} phases${activeOO?" · OO intégré":""}`}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0"
                style={{ backgroundColor:"rgba(255,255,255,0.18)", color:"#fff" }}>Bêta</span>
        </button>

        {/* ── MOBILE COLUMN TABS ───────────────────────────────────────────── */}
        <div className="md:hidden sticky z-20 bg-card rounded-xl overflow-hidden flex"
             style={{ top:"0", boxShadow:"0 2px 8px rgba(26,54,93,0.08)" }}>
          {TAB_LABELS.map((label,i)=>(
            <button key={label} onClick={()=>setActiveColTab(i as ColTab)}
              className="flex-1 flex flex-col items-center justify-center py-3 transition-all"
              style={{ minHeight:"48px",
                       color:activeColTab===i?"var(--foreground)":"var(--muted-foreground)",
                       borderBottom:`3px solid ${activeColTab===i?"var(--primary)":"transparent"}`,
                       backgroundColor:activeColTab===i?"var(--accent)":"var(--card)" }}>
              <span className="text-[11px] font-bold leading-tight px-1">
                {label.split(" ").slice(0,2).join(" ")}
              </span>
              {activeColTab===i&&<span className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor:"#3182ce" }}/>}
            </button>
          ))}
        </div>

        {/* ── DESKTOP COLUMN HEADERS ───────────────────────────────────────── */}
        <div className="hidden md:grid sticky z-20 rounded-t-xl overflow-hidden"
             style={{ top:"0", gridTemplateColumns:"200px 1fr 1fr" }}>
          {TAB_LABELS.map((col,i)=>(
            <div key={col} className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-white"
                 style={{ backgroundColor:i===0?"#1a365d":i===1?"#1e4976":"#234f7e",
                          borderRight:i<2?"1px solid rgba(255,255,255,0.12)":"none" }}>
              {col}
            </div>
          ))}
        </div>

        {/* ── WORKSPACE ────────────────────────────────────────────────────── */}
        <div data-section="workspace"
             style={ invalidSections.has("workspace")
               ? { outline:"2px solid #fca5a5", borderRadius:"16px", padding:"2px" }
               : {} }>
        {/* Shared phase-row renderer — used by both merged and tab modes */}
        {(()=>{
          const seqsToRender = merged
            ? contenus.map((c,i)=>({ contenu:c, ci:i, chip:CHIP_COLORS[i%CHIP_COLORS.length] }))
            : [{ contenu:contenus[activeFiche], ci:activeFiche, chip:tabChip }];

          return (
            <div className={merged?"space-y-5":""}>
              {seqsToRender.map(({ contenu, ci, chip })=>(
                <div key={`seq-${ci}`}
                     className="rounded-xl md:rounded-none overflow-hidden"
                     style={{ boxShadow:"0 2px 12px rgba(26,54,93,0.08), 0 1px 3px rgba(26,54,93,0.05)" }}>
                  {/* Sequence header */}
                  <div className="flex items-center gap-3 px-4 md:px-5 py-3"
                       style={{ backgroundColor:chip.on }}>
                    <Check className="w-3.5 h-3.5 text-white shrink-0" strokeWidth={3}/>
                    <span style={{ opacity:0.65, fontWeight:800, fontSize:"11px", color:"#fff", letterSpacing:"0.05em" }}>
                      SÉQUENCE {pad(ci)}
                    </span>
                    <span className="text-white font-bold text-[13px] truncate">{contenu}</span>
                  </div>

                  <div className="bg-card divide-y divide-gray-100">
                    {PHASES.map((phase,pi)=>{
                      const rowBg=pi%2===0?"#fff":"#fdfdfe";
                      const lblBg=pi%2===0?"#fafbfc":"#f7f8fa";
                      const isEval=phase===EVAL_PHASE;
                      return (
                        <div key={`ph-${pi}`}>
                          {/* Desktop 3-col grid */}
                          <div className="hidden md:grid" style={{ gridTemplateColumns:"200px 1fr 1fr" }}>
                            <div className="px-4 py-3.5 border-r border-gray-100 flex flex-col gap-1.5"
                                 style={{ backgroundColor:lblBg }}>
                              <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                                     style={{ backgroundColor:isEval?"#16a34a":chip.on, opacity:0.7 }}/>
                                <span className="text-[12px] font-semibold text-[#2d3748] leading-snug">{phase}</span>
                              </div>
                              {isEval&&activeOO&&(
                                <div className="flex items-center gap-1 ml-3.5">
                                  <GraduationCap className="w-3 h-3 shrink-0" style={{ color:"#16a34a" }}/>
                                  <span className="text-[9px] font-bold uppercase tracking-wider"
                                        style={{ color:"#16a34a" }}>OO · Critère terminal</span>
                                </div>
                              )}
                            </div>
                            <div className="px-4 py-3 border-r border-gray-100"
                                 style={{ backgroundColor:isEval?"#f0fdf4":rowBg }}>
                              {renderAiCell(ci,pi,"m",phase)}
                            </div>
                            <div className="px-4 py-3" style={{ backgroundColor:isEval?"#f0fdf4":rowBg }}>
                              {renderAiCell(ci,pi,"e",phase)}
                            </div>
                          </div>

                          {/* Mobile single-column tabs */}
                          <div className="md:hidden" style={{ backgroundColor:isEval?"#f0fdf4":rowBg }}>
                            {activeColTab===0&&(
                              <div className="px-4 py-3.5 flex flex-col gap-1.5" style={{ backgroundColor:lblBg }}>
                                <div className="flex items-start gap-2.5">
                                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                                       style={{ backgroundColor:isEval?"#16a34a":chip.on, opacity:0.7 }}/>
                                  <span className="text-[13px] font-semibold text-[#2d3748] leading-snug">{phase}</span>
                                </div>
                                {isEval&&activeOO&&(
                                  <div className="flex items-center gap-1 ml-4">
                                    <GraduationCap className="w-3 h-3 shrink-0" style={{ color:"#16a34a" }}/>
                                    <span className="text-[9px] font-bold uppercase tracking-wider"
                                          style={{ color:"#16a34a" }}>OO · Critère terminal</span>
                                  </div>
                                )}
                              </div>
                            )}
                            {activeColTab===1&&(
                              <div className="px-4 py-3">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{phase}</span>
                                  {isEval&&activeOO&&(
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                          style={{ backgroundColor:"#dcfce7", color:"#16a34a" }}>OO</span>
                                  )}
                                </div>
                                {renderAiCell(ci,pi,"m",phase)}
                              </div>
                            )}
                            {activeColTab===2&&(
                              <div className="px-4 py-3">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{phase}</span>
                                  {isEval&&activeOO&&(
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                          style={{ backgroundColor:"#dcfce7", color:"#16a34a" }}>OO</span>
                                  )}
                                </div>
                                {renderAiCell(ci,pi,"e",phase)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        <div className="flex items-center justify-center gap-1.5 pt-2">
          <Sparkles className="w-3 h-3" style={{ color:LILIA.primary, opacity:0.4 }}/>
          <span className="text-[10px] text-gray-400">Suggestions générées par IA · Vérifiez avant de générer.</span>
          {invalidSections.has("workspace") && (
            <p className="text-[11px] font-semibold text-red-500 text-center mt-1">
              <AlertCircle className="inline w-3 h-3 mr-1"/>
              Renseignez au moins une cellule dans la démarche — champ obligatoire.
            </p>
          )}
        </div>{/* end disclaimer row */}
        </div>{/* end data-section="workspace" */}
      </div>

      {/* ══ STICKY FOOTER ════════════════════════════════════════════════════ */}
      {/*
        Mobile  : two rows — [Sauvegarder | Prévisualiser] then [Générer PDF]
        Desktop : one row  — [Sauvegarder  Prévisualiser] ··· [Générer PDF]
      */}
       <div className="fixed bottom-0 left-0 right-0 z-30 bg-card"
         style={{ boxShadow:"0 -1px 0 var(--border), 0 -4px 20px rgba(0,0,0,0.07)" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">

          {/* ── MOBILE: two-row stacked layout ── */}
          <div className="flex flex-col gap-2 py-3 md:hidden">

            {/* Row 1 — two equal secondary buttons */}
            <div className="flex gap-2">
              {/* Save */}
              <button
                onClick={handleSave}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold transition-all active:scale-95"
                style={{
                  minHeight:"44px",
                  color: saved ? "#059669" : "#1a365d",
                  backgroundColor: saved ? "#f0fdf4" : "#f1f5f9",
                  border: `1.5px solid ${saved ? "#86efac" : "#e2e8f0"}`,
                }}
              >
                {saved ? <Check className="w-4 h-4 shrink-0"/> : <Save className="w-4 h-4 shrink-0"/>}
                <span>{saved ? "Sauvegardé !" : "Sauvegarder"}</span>
              </button>

              {/* Preview */}
              <button
                onClick={()=>handleGoToPreview(false)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold transition-all active:scale-95"
                style={{
                  minHeight:"44px",
                  color: "var(--primary)",
                  backgroundColor: "var(--muted)",
                  border: "1.5px solid var(--border)",
                }}
              >
                <Eye className="w-4 h-4 shrink-0"/>
                <span>Prévisualiser</span>
              </button>
            </div>

            {/* Row 2 — full-width primary CTA */}
            <button
              onClick={()=>handleGoToPreview(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl text-[14px] font-bold text-white transition-all active:scale-[0.98]"
              style={{
                minHeight:"48px",
                backgroundColor: "var(--primary)",
                boxShadow: "0 4px 16px rgba(26,54,93,0.30)",
              }}
            >
              <FileDown className="w-4 h-4 shrink-0"/>
              Générer la fiche finale (PDF)
            </button>
          </div>

          {/* ── DESKTOP: single-row layout ── */}
          <div className="hidden md:flex items-center justify-between gap-4 py-3">

            {/* Left — secondary actions */}
            <div className="flex items-center gap-2">
              {/* Save */}
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-xl px-4 text-[13px] font-semibold transition-all active:scale-95"
                style={{
                  minHeight:"44px",
                  color: saved ? "#059669" : "#1a365d",
                  backgroundColor: saved ? "#f0fdf4" : "#f8fafc",
                  border: `1.5px solid ${saved ? "#86efac" : "#e2e8f0"}`,
                }}
              >
                {saved ? <Check className="w-4 h-4 shrink-0"/> : <Save className="w-4 h-4 shrink-0"/>}
                {saved ? "Brouillon sauvegardé !" : "Sauvegarder le brouillon"}
              </button>

              {/* Separator */}
              <div className="w-px h-5 bg-gray-200"/>

              {/* Preview */}
              <button
                onClick={()=>handleGoToPreview(false)}
                className="inline-flex items-center gap-2 rounded-xl px-4 text-[13px] font-semibold transition-all active:scale-95"
                style={{
                  minHeight:"44px",
                  color: "var(--primary)",
                  backgroundColor: "var(--muted)",
                  border: "1.5px solid var(--border)",
                }}
                onMouseEnter={e=>{
                  (e.currentTarget as HTMLElement).style.backgroundColor="#eef4ff";
                  (e.currentTarget as HTMLElement).style.borderColor="#bfdbfe";
                }}
                onMouseLeave={e=>{
                  (e.currentTarget as HTMLElement).style.backgroundColor="#f8fafc";
                  (e.currentTarget as HTMLElement).style.borderColor="#e2e8f0";
                }}
              >
                <Eye className="w-4 h-4 shrink-0" style={{ color:"#3182ce" }}/>
                Prévisualiser la fiche
              </button>

              {/* Fiche pills — tab mode only, desktop */}
              {!merged && contenus.length>1&&(
                <div className="flex items-center gap-1.5 ml-1">
                  <div className="w-px h-5 bg-gray-200"/>
                  {fiches.map((f,i)=>{
                    const cmp=ficheCompletion(f);
                    const c=CHIP_COLORS[i%CHIP_COLORS.length];
                    return (
                      <button key={i} onClick={()=>setActiveFiche(i)}
                        className="text-[10px] font-bold px-2 py-1 rounded-full transition-all"
                        style={{ backgroundColor:activeFiche===i?c.on:cmp>0?c.bg:"#f1f5f9",
                                 color:activeFiche===i?"#fff":cmp>0?c.on:"#94a3b8",
                                 border:`1px solid ${activeFiche===i?c.on:cmp>0?c.on+"40":"#e2e8f0"}` }}>
                        F{i+1}{cmp>0?` · ${cmp}%`:""}
                      </button>
                    );
                  })}
                </div>
              )}
              {merged && (
                <div className="flex items-center gap-1.5 ml-1">
                  <div className="w-px h-5 bg-gray-200"/>
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold"
                        style={{ color:"#3182ce" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3182ce]"/>
                    Fiche unifiée · {contenus.length} séquences
                  </span>
                </div>
              )}
            </div>

            {/* Right — primary CTA */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-gray-400">
                {filledCells===0
                  ? "Renseignez au moins une cellule."
                  : `${filledCells} / ${totalCells} cellules`}
              </span>
              <button
                onClick={()=>handleGoToPreview(true)}
                className="inline-flex items-center gap-2 text-[13px] font-bold text-white rounded-xl px-5 active:scale-[0.97] transition-all"
                style={{
                  minHeight:"44px",
                  backgroundColor: "var(--primary)",
                  boxShadow: "0 4px 16px rgba(26,54,93,0.30)",
                }}
              >
                <FileDown className="w-4 h-4 shrink-0"/>
                Générer la fiche finale (PDF)
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
