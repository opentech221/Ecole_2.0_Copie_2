import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ShieldCheck,
  Users,
  Activity,
  SlidersHorizontal,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  School,
  ShieldAlert,
  Database,
  KeyRound,
  Save,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../contexts/AuthContext";

type AdminTab = "overview" | "users" | "security" | "settings";
type RoleFilter = "all" | "teacher" | "director";

interface AdminProfileRow {
  id: string;
  role: "teacher" | "director";
  full_name: string | null;
  ecole_nom: string | null;
  classe_active: string | null;
  telephone: string | null;
}

interface Kpi {
  label: string;
  value: string;
  hint: string;
  tone: "neutral" | "good" | "warn";
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const TABS: Array<{ id: AdminTab; label: string; Icon: Kpi["Icon"] }> = [
  { id: "overview", label: "Vue globale", Icon: Activity },
  { id: "users", label: "Utilisateurs", Icon: Users },
  { id: "security", label: "Securite", Icon: ShieldCheck },
  { id: "settings", label: "Parametres SaaS", Icon: SlidersHorizontal },
];

export function AdminScreen() {
  const { profile, loading } = useAuthContext();
  const navigate = useNavigate();

  const [tab, setTab] = useState<AdminTab>("overview");
  const [busy, setBusy] = useState(false);
  const [profiles, setProfiles] = useState<AdminProfileRow[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const [tenantName, setTenantName] = useState("Ecole 2.0");
  const [tenantDomain, setTenantDomain] = useState("app.ecole20.local");
  const [retentionDays, setRetentionDays] = useState("365");
  const [securityEmail, setSecurityEmail] = useState("security@ecole20.com");
  const [savingSettings, setSavingSettings] = useState(false);

  const [securityFlags, setSecurityFlags] = useState({
    forceStrongPasswords: true,
    enforceSessionTimeout: true,
    requireMfaForDirectors: false,
    ipAllowListEnabled: false,
  });

  const [counts, setCounts] = useState({
    users: "-",
    teachers: "-",
    directors: "-",
    documents: "-",
    students: "-",
  });

  async function safeCount(table: string): Promise<number | null> {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    if (error) return null;
    return count ?? null;
  }

  async function loadAdminData() {
    setBusy(true);

    const [{ data: pData }, usersCount, docsCount, studentsCount] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, role, full_name, ecole_nom, classe_active, telephone")
        .order("full_name", { ascending: true }),
      safeCount("profiles"),
      safeCount("documents"),
      safeCount("students"),
    ]);

    const rows = (pData ?? []) as AdminProfileRow[];
    setProfiles(rows);

    const teacherCount = rows.filter((x) => x.role === "teacher").length;
    const directorCount = rows.filter((x) => x.role === "director").length;

    setCounts({
      users: usersCount === null ? "-" : String(usersCount),
      teachers: String(teacherCount),
      directors: String(directorCount),
      documents: docsCount === null ? "-" : String(docsCount),
      students: studentsCount === null ? "-" : String(studentsCount),
    });

    setBusy(false);
  }

  useEffect(() => {
    if (!loading && profile?.role === "director") {
      void loadAdminData();
    }
  }, [loading, profile?.role]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const roleOk = roleFilter === "all" ? true : p.role === roleFilter;
      const hay = `${p.full_name ?? ""} ${p.ecole_nom ?? ""} ${p.classe_active ?? ""}`.toLowerCase();
      const searchOk = hay.includes(search.toLowerCase().trim());
      return roleOk && searchOk;
    });
  }, [profiles, roleFilter, search]);

  const kpis: Kpi[] = [
    {
      label: "Utilisateurs actifs",
      value: counts.users,
      hint: "Comptes professeurs et directions",
      tone: "neutral",
      Icon: Users,
    },
    {
      label: "Enseignants",
      value: counts.teachers,
      hint: "Population pedagogique",
      tone: "good",
      Icon: School,
    },
    {
      label: "Directions",
      value: counts.directors,
      hint: "Comptes d'administration",
      tone: "neutral",
      Icon: ShieldCheck,
    },
    {
      label: "Eleves (suivi)",
      value: counts.students,
      hint: "Depuis le module eleves",
      tone: "neutral",
      Icon: Activity,
    },
    {
      label: "Documents",
      value: counts.documents,
      hint: "Base documentaire de l'etablissement",
      tone: "neutral",
      Icon: Database,
    },
    {
      label: "Niveau de securite",
      value: securityFlags.forceStrongPasswords && securityFlags.enforceSessionTimeout ? "Eleve" : "Moyen",
      hint: "Politique actuelle de la plateforme",
      tone: securityFlags.forceStrongPasswords && securityFlags.enforceSessionTimeout ? "good" : "warn",
      Icon: ShieldAlert,
    },
  ];

  async function handleSaveSettings() {
    setSavingSettings(true);
    localStorage.setItem(
      "ecole2_admin_settings",
      JSON.stringify({ tenantName, tenantDomain, retentionDays, securityEmail, securityFlags })
    );
    setTimeout(() => setSavingSettings(false), 550);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <p style={{ color: "var(--muted-foreground)", fontSize: "14px", fontWeight: 600 }}>
          Chargement du module Admin...
        </p>
      </div>
    );
  }

  if (profile?.role !== "director") {
    return (
      <div className="min-h-screen px-4 py-8" style={{ backgroundColor: "var(--background)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="max-w-2xl mx-auto rounded-2xl p-6" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: "color-mix(in srgb, #ef4444 14%, var(--card))", color: "#ef4444" }}>
            <AlertTriangle className="w-4 h-4" />
            <span style={{ fontSize: "12px", fontWeight: 700 }}>Acces restreint</span>
          </div>
          <h1 className="mt-3" style={{ fontSize: "22px", fontWeight: 800, color: "var(--foreground)" }}>
            Module Administration
          </h1>
          <p className="mt-2" style={{ color: "var(--muted-foreground)", fontSize: "14px", lineHeight: 1.6 }}>
            Cette section est reservee aux directeurs pour proteger les operations sensibles (gestion globale, securite, gouvernance SaaS).
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2"
            style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontWeight: 700 }}
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        <section
          className="rounded-2xl md:rounded-3xl p-4 md:p-6"
          style={{
            background:
              "radial-gradient(130% 150% at 0% 0%, color-mix(in srgb, var(--primary) 24%, var(--card)) 0%, color-mix(in srgb, var(--secondary) 18%, var(--card)) 38%, var(--card) 100%)",
            border: "1px solid var(--border)",
            boxShadow: "0 10px 30px color-mix(in srgb, var(--foreground) 8%, transparent)",
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: "color-mix(in srgb, var(--primary) 14%, var(--card))", color: "var(--primary)" }}>
                <ShieldCheck className="w-4 h-4" />
                <span style={{ fontSize: "12px", fontWeight: 800 }}>Admin SaaS</span>
              </div>
              <h1 className="mt-2" style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--foreground)" }}>
                Centre d'administration
              </h1>
              <p className="mt-1" style={{ color: "var(--muted-foreground)", fontSize: "14px" }}>
                Gouvernance, securite et pilotage global de la plateforme.
              </p>
            </div>

            <button
              onClick={() => void loadAdminData()}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
                fontWeight: 700,
                minHeight: "42px",
              }}
            >
              <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
              Actualiser
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2">
            {TABS.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className="rounded-xl px-3 py-2 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: active ? "var(--primary)" : "var(--card)",
                    color: active ? "var(--primary-foreground)" : "var(--foreground)",
                    border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
                    fontWeight: 700,
                    fontSize: "12px",
                    minHeight: "40px",
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {tab === "overview" && (
          <section className="mt-4 md:mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {kpis.map(({ label, value, hint, tone, Icon }) => (
              <article
                key={label}
                className="rounded-2xl p-4"
                style={{
                  backgroundColor: "var(--card)",
                  border: `1px solid ${tone === "warn" ? "#f59e0b" : "var(--border)"}`,
                  boxShadow: "0 6px 18px color-mix(in srgb, var(--foreground) 6%, transparent)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {label}
                    </p>
                    <p className="mt-1" style={{ fontSize: "28px", fontWeight: 900, color: "var(--foreground)", lineHeight: 1 }}>
                      {value}
                    </p>
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: tone === "good" ? "color-mix(in srgb, #22c55e 16%, var(--card))" : tone === "warn" ? "color-mix(in srgb, #f59e0b 16%, var(--card))" : "color-mix(in srgb, var(--primary) 14%, var(--card))" }}
                  >
                    <Icon className="w-5 h-5" style={{ color: tone === "good" ? "#16a34a" : tone === "warn" ? "#d97706" : "var(--primary)" }} />
                  </div>
                </div>
                <p className="mt-2" style={{ color: "var(--muted-foreground)", fontSize: "12px" }}>{hint}</p>
              </article>
            ))}
          </section>
        )}

        {tab === "users" && (
          <section className="mt-4 md:mt-6 rounded-2xl p-4 md:p-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex flex-col md:flex-row gap-2 md:gap-3 md:items-center md:justify-between">
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--foreground)" }}>Gestion des utilisateurs</h2>
              <div className="flex gap-2">
                <div className="relative flex-1 md:w-[280px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un utilisateur..."
                    className="w-full rounded-xl pl-9 pr-3 py-2 outline-none"
                    style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "13px" }}
                  />
                </div>

                <div className="relative">
                  <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                    className="rounded-xl pl-9 pr-8 py-2 outline-none appearance-none"
                    style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "13px", minHeight: "40px" }}
                  >
                    <option value="all">Tous les roles</option>
                    <option value="teacher">Enseignant</option>
                    <option value="director">Directeur</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 md:space-y-0">
              <div className="hidden md:grid" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "12px", padding: "0 12px" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Nom</span>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Role</span>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Classe active</span>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Contact</span>
              </div>

              {filteredProfiles.map((u) => (
                <article
                  key={u.id}
                  className="rounded-xl p-3 md:grid md:items-center"
                  style={{
                    gridTemplateColumns: "2fr 1fr 1fr 1fr",
                    gap: "12px",
                    backgroundColor: "var(--muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--foreground)" }}>{u.full_name || "Sans nom"}</p>
                    <p style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>{u.ecole_nom || "Ecole non renseignee"}</p>
                  </div>

                  <div className="mt-2 md:mt-0">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full"
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        backgroundColor:
                          u.role === "director"
                            ? "color-mix(in srgb, var(--primary) 18%, var(--card))"
                            : "color-mix(in srgb, #0ea5e9 16%, var(--card))",
                        color: u.role === "director" ? "var(--primary)" : "#0284c7",
                      }}
                    >
                      {u.role === "director" ? "Directeur" : "Enseignant"}
                    </span>
                  </div>

                  <p className="mt-2 md:mt-0" style={{ fontSize: "12px", color: "var(--foreground)", fontWeight: 600 }}>
                    {u.classe_active || "-"}
                  </p>

                  <p className="mt-1 md:mt-0" style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                    {u.telephone || "Non renseigne"}
                  </p>
                </article>
              ))}

              {filteredProfiles.length === 0 && (
                <div className="rounded-xl p-6 text-center" style={{ backgroundColor: "var(--muted)", border: "1px dashed var(--border)" }}>
                  <p style={{ color: "var(--muted-foreground)", fontWeight: 600 }}>Aucun utilisateur pour ce filtre.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {tab === "security" && (
          <section className="mt-4 md:mt-6 grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            <article className="rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--foreground)" }}>Posture securite</h3>
              <p className="mt-1" style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
                Activez des controles defense-in-depth adaptes a votre contexte scolaire.
              </p>

              <div className="mt-4 space-y-2">
                {[
                  { key: "forceStrongPasswords", label: "Mots de passe forts obligatoires", Icon: KeyRound },
                  { key: "enforceSessionTimeout", label: "Expiration de session automatique", Icon: Clock3 },
                  { key: "requireMfaForDirectors", label: "MFA obligatoire pour directeurs", Icon: ShieldCheck },
                  { key: "ipAllowListEnabled", label: "Restriction IP (allow-list)", Icon: ShieldAlert },
                ].map((row) => {
                  const enabled = securityFlags[row.key as keyof typeof securityFlags];
                  return (
                    <label
                      key={row.key}
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2"
                      style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", cursor: "pointer" }}
                    >
                      <span className="inline-flex items-center gap-2" style={{ color: "var(--foreground)", fontSize: "13px", fontWeight: 600 }}>
                        <row.Icon className="w-4 h-4" style={{ color: enabled ? "var(--primary)" : "var(--muted-foreground)" }} />
                        {row.label}
                      </span>
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) =>
                          setSecurityFlags((prev) => ({
                            ...prev,
                            [row.key]: e.target.checked,
                          }))
                        }
                        style={{ width: "16px", height: "16px" }}
                      />
                    </label>
                  );
                })}
              </div>
            </article>

            <article className="rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--foreground)" }}>Journal d'audit</h3>
              <p className="mt-1" style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
                Evenements sensibles recents a surveiller.
              </p>

              <div className="mt-4 space-y-2">
                {[
                  { status: "ok", label: "Connexion directeur", detail: "Aujourd'hui, 08:42 - IP reconnue" },
                  { status: "warn", label: "Tentative mot de passe invalide", detail: "Hier, 22:17 - 3 tentatives" },
                  { status: "ok", label: "Mise a jour profil etablissement", detail: "Hier, 17:03 - changements valides" },
                ].map((e) => (
                  <div key={`${e.label}-${e.detail}`} className="rounded-xl px-3 py-2" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-2">
                      {e.status === "ok" ? (
                        <CheckCircle2 className="w-4 h-4" style={{ color: "#16a34a" }} />
                      ) : (
                        <ShieldAlert className="w-4 h-4" style={{ color: "#f59e0b" }} />
                      )}
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--foreground)" }}>{e.label}</p>
                    </div>
                    <p className="mt-1" style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{e.detail}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {tab === "settings" && (
          <section className="mt-4 md:mt-6 rounded-2xl p-4 md:p-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--foreground)" }}>Parametrage SaaS</h2>
            <p className="mt-1" style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
              Gouvernance technique et metier de l'instance.
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Nom du tenant</span>
                <input value={tenantName} onChange={(e) => setTenantName(e.target.value)} className="rounded-xl px-3 py-2 outline-none" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "13px" }} />
              </label>

              <label className="flex flex-col gap-1">
                <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Domaine applicatif</span>
                <input value={tenantDomain} onChange={(e) => setTenantDomain(e.target.value)} className="rounded-xl px-3 py-2 outline-none" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "13px" }} />
              </label>

              <label className="flex flex-col gap-1">
                <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Retention des donnees (jours)</span>
                <input value={retentionDays} onChange={(e) => setRetentionDays(e.target.value)} className="rounded-xl px-3 py-2 outline-none" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "13px" }} />
              </label>

              <label className="flex flex-col gap-1">
                <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Contact securite</span>
                <input value={securityEmail} onChange={(e) => setSecurityEmail(e.target.value)} className="rounded-xl px-3 py-2 outline-none" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "13px" }} />
              </label>
            </div>

            <div className="mt-5">
              <button
                onClick={() => void handleSaveSettings()}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                  fontWeight: 800,
                  minHeight: "42px",
                  opacity: savingSettings ? 0.85 : 1,
                }}
              >
                <Save className="w-4 h-4" />
                {savingSettings ? "Sauvegarde..." : "Sauvegarder la configuration"}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
