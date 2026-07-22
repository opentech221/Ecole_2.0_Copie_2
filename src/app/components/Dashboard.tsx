import { useNavigate } from "react-router";
import {
  Plus, Eye, Bell, WifiOff, Download,
  Calendar, BookMarked, ChevronRight, Users, ShieldCheck,
} from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { useAuthContext } from "../contexts/AuthContext";

// ─── WhatsApp icon ────────────────────────────────────────────────────────────

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// ─── Domain colour map ────────────────────────────────────────────────────────

const DOMAINE_COLOR: Record<string, { bar:string; bg:string; text:string }> = {
  "Mathématiques":           { bar:"#2563eb", bg:"#eff6ff", text:"#1d4ed8" },
  "Langue et Communication": { bar:"#7c3aed", bg:"#f5f3ff", text:"#6d28d9" },
  "ESVS":                    { bar:"#059669", bg:"#ecfdf5", text:"#065f46" },
  "EPSA":                    { bar:"#ea580c", bg:"#fff7ed", text:"#9a3412" },
};
const DEFAULT_COLOR = { bar:"#64748b", bg:"#f8fafc", text:"#334155" };

const NIVEAU_COLOR: Record<string, { bg:string; text:string }> = {
  CI:  { bg:"#f97316", text:"#fff" },
  CP:  { bg:"#d97706", text:"#fff" },
  CE1: { bg:"#2563eb", text:"#fff" },
  CE2: { bg:"#4f46e5", text:"#fff" },
  CM1: { bg:"#7c3aed", text:"#fff" },
  CM2: { bg:"#9333ea", text:"#fff" },
};
const DEFAULT_NIVEAU = { bg:"#64748b", text:"#fff" };

// ─── Mock lesson plan cards ───────────────────────────────────────────────────

interface FicheCard {
  id: string; domaine: string; discipline: string;
  niveau: string; objet: string; date: string;
}

const mockFiches: FicheCard[] = [
  { id:"1", domaine:"Mathématiques",           discipline:"Activités numériques",
    niveau:"CE2", objet:"La composition du nombre 4 et ses différentes décompositions additives",
    date:"20/06/2026 à 14:30" },
  { id:"2", domaine:"Langue et Communication", discipline:"Grammaire",
    niveau:"CE1", objet:"L'accord du participe passé avec l'auxiliaire avoir",
    date:"19/06/2026 à 11:15" },
  { id:"3", domaine:"ESVS",                   discipline:"Histoire-Géographie",
    niveau:"CE2", objet:"Le Fleuve Sénégal — source, embouchure et rôle économique",
    date:"18/06/2026 à 09:45" },
  { id:"4", domaine:"Langue et Communication", discipline:"Lecture",
    niveau:"CI", objet:"La lettre « b » en cursive — identification et écriture",
    date:"17/06/2026 à 14:00" },
];

// ─── Progress ring ────────────────────────────────────────────────────────────

function ProgressRing({ value, color, size = 52 }: { value:number; color:string; size?:number }) {
  const r     = size / 2 - 5;
  const circ  = 2 * Math.PI * r;
  const offset = circ * (1 - value / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size/2} cy={size/2} r={r}
              fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4.5"/>
      <circle cx={size/2} cy={size/2} r={r}
              fill="none" stroke={color} strokeWidth="4.5"
              strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={offset}
              transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2+4} textAnchor="middle"
            fontSize="11" fontWeight="800" fill="#fff"
            style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
        {value}%
      </text>
    </svg>
  );
}

// ─── GrandirMark ─────────────────────────────────────────────────────────────

const GrandirMark = () => (
  <div style={{ display:"flex", alignItems:"center", gap:"5px", opacity:0.75 }}>
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1C4 1 1 4.5 1 8C1 11 3.5 13 7 13C7 13 7 8.5 12 6C11.5 3 9.5 1 7 1Z" fill="white"/>
      <path d="M7 13C7 13 7 8 4.5 5.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    </svg>
    <span style={{ fontSize:"10px", fontWeight:800, color:"white", letterSpacing:"0.06em", textTransform:"uppercase" }}>
      Grandir
    </span>
  </div>
);

// ─── ModuleCard ───────────────────────────────────────────────────────────────

interface ModuleCardProps {
  badge: string;
  badgeIcon: React.ReactNode;
  gradient: string;
  shadowColor: string;
  accent: string;
  title: string;
  description: string;
  ctaLabel: string;
  onClick: () => void;
}

function ModuleCard({ badge, badgeIcon, gradient, shadowColor, accent, title, description, ctaLabel, onClick }: ModuleCardProps) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: gradient,
      boxShadow: `0 4px 20px ${shadowColor}, 0 1px 4px rgba(0,0,0,0.10)`,
    }}>
      <div style={{ position:"relative", overflow:"hidden", padding:"16px 18px 16px" }}>
        {/* Decorative circles */}
        <div style={{ position:"absolute", top:"-20px", right:"-20px", width:"100px", height:"100px", borderRadius:"50%", backgroundColor:"rgba(255,255,255,0.05)" }}/>
        <div style={{ position:"absolute", bottom:"-10px", right:"30px", width:"60px", height:"60px", borderRadius:"50%", backgroundColor:"rgba(255,255,255,0.04)" }}/>

        {/* Top row */}
        <div className="flex items-center justify-between gap-3 relative mb-3">
          <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
               style={{ backgroundColor:"rgba(255,255,255,0.15)" }}>
            {badgeIcon}
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-wide">{badge}</span>
          </div>
          <GrandirMark/>
        </div>

        {/* Title */}
        <h2 className="text-white font-extrabold leading-snug mb-3 relative" style={{ fontSize:"15px" }}>
          {title}
        </h2>

        {/* Description */}
        <p className="relative mb-4" style={{ fontSize:"12px", color:"rgba(255,255,255,0.70)", lineHeight:"1.6" }}>
          {description}
        </p>

        {/* CTA row */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={onClick}
            aria-label={title}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all active:scale-[0.97]"
            style={{ minHeight:"44px", fontSize:"13px", backgroundColor:accent, color:"#fff", boxShadow:`0 2px 10px ${accent}60`, fontWeight: 700, textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
          >
            {ctaLabel}
          </button>
          <button
            onClick={onClick}
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-95"
            style={{ backgroundColor:"rgba(255,255,255,0.12)" }}
            aria-label={ctaLabel}
          >
            <ChevronRight className="w-5 h-5 text-white"/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Fiche card ───────────────────────────────────────────────────────────────

function FicheTicket({ fiche }: { fiche: FicheCard }) {
  const dc = DOMAINE_COLOR[fiche.domaine] ?? DEFAULT_COLOR;
  const nc = NIVEAU_COLOR[fiche.niveau]   ?? DEFAULT_NIVEAU;

  return (
    <div className="bg-card rounded-2xl overflow-hidden"
         style={{ boxShadow:"0 2px 12px rgba(26,54,93,0.08), 0 1px 3px rgba(26,54,93,0.05)" }}>
      <div className="flex">
        <div className="w-[5px] shrink-0" style={{ backgroundColor:dc.bar }}/>
        <div className="flex-1 min-w-0 p-4">

          {/* Header */}
          <div className="flex items-start gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                 style={{ backgroundColor:dc.bg }}>
              <BookMarked className="w-3.5 h-3.5" style={{ color:dc.bar }}/>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold leading-snug text-[var(--foreground)] break-words text-[13px]">
                {fiche.domaine}
                <span className="mx-1.5 font-normal opacity-40">·</span>
                {fiche.discipline}
              </h3>
            </div>
            <span className="shrink-0 inline-flex items-center rounded-full text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5"
                  style={{ backgroundColor:nc.bg, color:nc.text, letterSpacing:"0.06em" }}>
              {fiche.niveau}
            </span>
          </div>

          {/* Body */}
          <div className="ml-9 mb-4">
            <div className="flex items-start gap-1.5 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest shrink-0 mt-0.5"
                    style={{ color:dc.bar, opacity:0.75 }}>Objet</span>
              <span className="text-[10px] font-bold shrink-0 mt-0.5" style={{ color:"var(--muted-foreground)" }}>:</span>
              <p className="text-[12px] leading-snug text-[var(--foreground)] font-medium break-words">
                {fiche.objet}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 shrink-0" style={{ color:"var(--muted-foreground)" }}/>
              <span className="text-[11px] text-[var(--muted-foreground)]">
                Généré le : <span className="font-semibold text-[var(--foreground)]">{fiche.date}</span>
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="ml-9 flex gap-2">
            <button
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-semibold border-2 transition-all active:scale-95"
              style={{ borderColor:"var(--primary)", color:"var(--primary)", backgroundColor:"transparent" }}
              onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.backgroundColor="var(--primary)"; (e.currentTarget as HTMLElement).style.color="#fff"; }}
              onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.backgroundColor="transparent"; (e.currentTarget as HTMLElement).style.color="var(--primary)"; }}
            >
              <Eye className="w-3.5 h-3.5 shrink-0"/>Modifier
            </button>
            <button
              className="flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[12px] font-semibold text-white transition-all active:scale-95"
              style={{ backgroundColor:"var(--primary)", boxShadow:"0 2px 8px color-mix(in srgb, var(--primary) 25%, transparent)" }}
            >
              <Download className="w-3.5 h-3.5 shrink-0"/>PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// BottomNav removed — AppLayout owns mobile navigation.

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const navigate   = useNavigate();
  const { activeClass, role, userName, schoolName } = useAppContext();
  const { profile } = useAuthContext();

  return (
    <div className="min-h-screen bg-background lg:bg-background" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      {/* Mobile: centered card. Desktop: full-width, no card shadow */}
      <div className="max-w-md lg:max-w-none mx-auto bg-card min-h-screen shadow-2xl lg:shadow-none flex flex-col relative">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="px-4 lg:px-8 pt-5 pb-3" style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--secondary)] flex items-center justify-center text-white font-extrabold text-[10px] shrink-0 overflow-hidden">
                {profile?.logoUrl
                  ? <img src={profile.logoUrl} alt="Profil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : userName.replace(/\./g,"").split(" ").map((w:string)=>w[0]).join("").slice(0,2).toUpperCase()}
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-widest leading-none" style={{ color: "var(--muted-foreground)" }}>
                  {role === "director" ? "Direction — Vue Globale" : "Bonjour"}
                </p>
                <h1 className="text-[13px] font-bold leading-tight" style={{ color: "var(--foreground)" }}>
                  {userName}{" "}
                  <span className="font-normal" style={{ color: "var(--muted-foreground)" }}>
                    · {activeClass} · {schoolName.split(" ").slice(-2).join(" ")}
                  </span>
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                     style={{ backgroundColor:"var(--muted)", border: "1px solid var(--border)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--secondary)] animate-pulse shrink-0"/>
                  <span className="text-[9px] font-semibold" style={{ color: "var(--foreground)" }}>Hors ligne</span>
              </div>
              <button className="relative p-1.5 rounded-lg active:scale-95" style={{ backgroundColor: "var(--muted)" }}
                      aria-label="Notifications">
                <Bell className="w-4 h-4" style={{ color: "var(--muted-foreground)" }}/>
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[var(--secondary)] rounded-full"/>
              </button>
            </div>
          </div>
        </div>

        {/* Wave */}
          <div className="h-3" style={{ backgroundColor: "var(--card)" }}>
            <div className="h-full bg-card rounded-t-[14px]"/>
        </div>

        {/* ── Content ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-28 lg:pb-10 space-y-5 mt-1">

          {/* Section label */}
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">
              Accès rapide
            </p>
            {/* Desktop quick-stat bar */}
            <div className="hidden lg:flex items-center gap-4">
              {[
                { label:"Classe active", value:activeClass, color:"var(--primary)" },
                { label:"Trimestre",     value:"T3 · 2026", color:"var(--secondary)" },
                { label:"Mode",          value:role === "director" ? "Direction" : "Enseignant", color:"var(--accent-foreground)" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span style={{ fontSize:"9px", color:"var(--muted-foreground)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>{s.label}</span>
                  <span style={{ fontSize:"12px", fontWeight:800, color:s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Module cards:
              Mobile: single column.  Desktop: 2×2 grid. */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-5">

            {/* Module 1: Planification */}
            <ModuleCard
              badge="Module 1"
              badgeIcon={<Calendar className="w-3.5 h-3.5 text-white/80"/>}
              gradient="linear-gradient(135deg, #0b3a67 0%, #125a93 52%, #1b79b8 100%)"
              shadowColor="rgba(11,58,103,0.34)"
              accent="#2ea3e6"
              title="Planification"
              description="Planifiez vos semaines, suivez le taux de couverture du programme et accédez au référentiel officiel du CEB."
              ctaLabel="Préparer ma semaine"
              onClick={() => navigate("/planning")}
            />

            {/* Module 2: Performances & Administration */}
            <ModuleCard
              badge="Module 2"
              badgeIcon={<Users className="w-3.5 h-3.5 text-white/80"/>}
              gradient="linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)"
              shadowColor="rgba(15,118,110,0.30)"
              accent="#0891b2"
              title="Gestion administrative et suivi des performances"
              description="Gérez la liste des élèves, suivez les présences au quotidien et générez les bulletins de notes trimestriels."
              ctaLabel="Piloter ma classe"
              onClick={() => navigate("/eleves")}
            />

            {/* Module 3: Cahier Journal & Registre d'Appel */}
            <ModuleCard
              badge="Module 3"
              badgeIcon={<BookMarked className="w-3.5 h-3.5 text-white/80"/>}
              gradient="linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)"
              shadowColor="rgba(30,41,59,0.32)"
              accent="#64748b"
              title="Cahier Journal et Registre d'Appel"
              description="Renseignez votre journal de classe quotidien et évaluez vos élèves avec la grille de maîtrise intégrée."
              ctaLabel="Tenir mon journal"
              onClick={() => navigate("/cahier")}
            />

            {/* Module 4: Documents Générés */}
            <ModuleCard
              badge="Module 4"
              badgeIcon={<Eye className="w-3.5 h-3.5 text-white/80"/>}
              gradient="linear-gradient(135deg, #7c2d12 0%, #9a3412 50%, #c2410c 100%)"
              shadowColor="rgba(124,45,18,0.30)"
              accent="#ea580c"
              title="Documents générés"
              description="Consultez, imprimez et partagez vos fiches de préparation, bulletins et rapports trimestriels générés."
              ctaLabel="Consulter mes archives"
              onClick={() => navigate("/documents")}
            />

            {/* Module 5: Admin SaaS */}
            <ModuleCard
              badge="Module 5"
              badgeIcon={<ShieldCheck className="w-3.5 h-3.5 text-white/80"/>}
              gradient="linear-gradient(135deg, #111827 0%, #1f2937 50%, #374151 100%)"
              shadowColor="rgba(17,24,39,0.32)"
              accent="#0f766e"
              title="Admin SaaS"
              description="Centre d'administration pour le pilotage global : utilisateurs actifs, population pédagogique, sécurité et gouvernance de la plateforme."
              ctaLabel="Ouvrir le centre"
              onClick={() => navigate("/admin/saas")}
            />

            {/* Module 6: Programme Officiel */}
            <ModuleCard
              badge="Module 6"
              badgeIcon={<BookMarked className="w-3.5 h-3.5 text-white/80"/>}
              gradient="linear-gradient(135deg, #065f46 0%, #047857 50%, #0f766e 100%)"
              shadowColor="rgba(6,95,70,0.30)"
              accent="#0d9488"
              title="Programme officiel"
              description="Naviguez le référentiel réel DEMSG (niveau, domaine, sous-domaine, activité) et connectez la préparation pédagogique aux données officielles." 
              ctaLabel="Ouvrir le module"
              onClick={() => navigate("/programme")}
            />

          </div>
        </div>

        {/* ── FAB "Nouvelle Fiche" — mobile only, floats above AppLayout's 64px bottom nav ── */}
        <button
          onClick={() => navigate("/new-fiche")}
          className="lg:hidden"
          style={{
            position:  "fixed",
            bottom:    "76px",          /* 64px nav + 12px gap */
            right:     "20px",
            zIndex:    300,
            display:   "flex",
            alignItems:      "center",
            gap:             "7px",
            padding:         "12px 18px",
            borderRadius:    "50px",
            background:      "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
            color:           "#fff",
            fontWeight:      700,
            fontSize:        "13px",
            border:          "none",
            cursor:          "pointer",
            boxShadow:       "0 6px 24px rgba(5,150,105,0.40)",
            fontFamily:      "'Plus Jakarta Sans', sans-serif",
          }}
          aria-label="Préparer une nouvelle fiche"
        >
          <Plus style={{ width: 16, height: 16, strokeWidth: 2.5 }} />
          Nouvelle Fiche
        </button>

      </div>
    </div>
  );
}
