import { useEffect, useMemo, useState, type ComponentType, type CSSProperties } from "react";
import {
  ShieldCheck,
  Users,
  Activity,
  SlidersHorizontal,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock3,
  School,
  ShieldAlert,
  Database,
  KeyRound,
  Save,
  Eye,
  MailPlus,
  Ban,
  UserCog,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../contexts/AuthContext";
import { ALL_CLASSES } from "../contexts/AppContext";
import { projectId } from "../../../utils/supabase/info";

type AdminTab = "overview" | "users" | "invitations" | "security" | "settings";
type RoleFilter = "all" | "teacher" | "director";
type RowRole = "teacher" | "director";

interface AdminProfileRow {
  id: string;
  role: RowRole;
  full_name: string | null;
  ecole_nom: string | null;
  classe_active: string | null;
  telephone: string | null;
}

interface AdminInvitationRow {
  id: string;
  email: string;
  role: RowRole;
  full_name: string | null;
  class_id: string | null;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  created_at: string;
}

interface AdminAuditRow {
  id: string;
  actor_user_id: string;
  action: string;
  target_user_id: string | null;
  target_type: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

interface Kpi {
  label: string;
  value: string;
  hint: string;
  tone: "neutral" | "good" | "warn";
  Icon: ComponentType<{ className?: string; style?: CSSProperties }>;
}

type CriticalAction =
  | { type: "promote-director"; userId: string; role: RowRole }
  | { type: "revoke-invitation"; invitationId: string };

const TABS: Array<{ id: AdminTab; label: string; Icon: Kpi["Icon"] }> = [
  { id: "overview", label: "Vue globale", Icon: Activity },
  { id: "users", label: "Utilisateurs", Icon: Users },
  { id: "invitations", label: "Invitations", Icon: MailPlus },
  { id: "security", label: "Securite", Icon: ShieldCheck },
  { id: "settings", label: "Parametres SaaS", Icon: SlidersHorizontal },
];

const EDGE_BASE = `https://${projectId}.supabase.co/functions/v1/admin-server`;

export function AdminScreen() {
  const { profile, loading } = useAuthContext();
  const isDirector = profile?.role === "director";
  const isTeacherReadOnly = profile?.role === "teacher";

  const [tab, setTab] = useState<AdminTab>("overview");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [profiles, setProfiles] = useState<AdminProfileRow[]>([]);
  const [invitations, setInvitations] = useState<AdminInvitationRow[]>([]);
  const [auditRows, setAuditRows] = useState<AdminAuditRow[]>([]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [classEdits, setClassEdits] = useState<Record<string, string>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<RowRole>("teacher");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteClass, setInviteClass] = useState("CE2");
  const [inviteHours, setInviteHours] = useState("168");
  const [creatingInvite, setCreatingInvite] = useState(false);

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

  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [auditActorFilter, setAuditActorFilter] = useState("all");
  const [auditPeriodFilter, setAuditPeriodFilter] = useState<"all" | "24h" | "7d" | "30d">("30d");

  const [criticalAction, setCriticalAction] = useState<CriticalAction | null>(null);
  const [criticalActionLabel, setCriticalActionLabel] = useState("");
  const [criticalActionConfirmation, setCriticalActionConfirmation] = useState("");
  const [criticalActionBusy, setCriticalActionBusy] = useState(false);

  async function safeCount(table: string): Promise<number | null> {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    if (error) return null;
    return count ?? null;
  }

  async function getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function edgeRequest<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await getAccessToken();
    if (!token) throw new Error("Session expiree, reconnectez-vous.");

    const headers = new Headers(init?.headers ?? {});
    headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Content-Type") && init?.body) {
      headers.set("Content-Type", "application/json");
    }

    const res = await fetch(`${EDGE_BASE}${path}`, { ...init, headers });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error((body as { error?: string }).error ?? "Erreur API admin");
    }

    return body as T;
  }

  async function loadAdminData() {
    setBusy(true);
    setNotice(null);

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
    setClassEdits(Object.fromEntries(rows.map((r) => [r.id, r.classe_active ?? "CE2"])));

    const teacherCount = rows.filter((x) => x.role === "teacher").length;
    const directorCount = rows.filter((x) => x.role === "director").length;

    setCounts({
      users: usersCount === null ? "-" : String(usersCount),
      teachers: String(teacherCount),
      directors: String(directorCount),
      documents: docsCount === null ? "-" : String(docsCount),
      students: studentsCount === null ? "-" : String(studentsCount),
    });

    if (isDirector) {
      try {
        const [invRaw, auditRaw] = await Promise.all([
          edgeRequest<{ data: AdminInvitationRow[] }>("/invitations"),
          edgeRequest<{ data: AdminAuditRow[] }>("/audit?limit=120"),
        ]);
        setInvitations(invRaw.data ?? []);
        setAuditRows(auditRaw.data ?? []);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur chargement admin";
        setNotice(msg);
      }
    }

    setBusy(false);
  }

  useEffect(() => {
    if (!loading && profile) {
      void loadAdminData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, profile?.id]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const roleOk = roleFilter === "all" ? true : p.role === roleFilter;
      const hay = `${p.full_name ?? ""} ${p.ecole_nom ?? ""} ${p.classe_active ?? ""}`.toLowerCase();
      const searchOk = hay.includes(search.toLowerCase().trim());
      return roleOk && searchOk;
    });
  }, [profiles, roleFilter, search]);

  const actorNameById = useMemo(() => {
    return Object.fromEntries(
      profiles.map((p) => [p.id, p.full_name ?? p.ecole_nom ?? `Utilisateur ${p.id.slice(0, 8)}`])
    );
  }, [profiles]);

  const auditActionOptions = useMemo(() => {
    return Array.from(new Set(auditRows.map((row) => row.action))).sort();
  }, [auditRows]);

  const auditActorOptions = useMemo(() => {
    return Array.from(new Set(auditRows.map((row) => row.actor_user_id))).sort();
  }, [auditRows]);

  const filteredAuditRows = useMemo(() => {
    const nowMs = Date.now();
    return auditRows.filter((row) => {
      const actionOk = auditActionFilter === "all" ? true : row.action === auditActionFilter;
      const actorOk = auditActorFilter === "all" ? true : row.actor_user_id === auditActorFilter;

      let periodOk = true;
      if (auditPeriodFilter !== "all") {
        const createdAtMs = new Date(row.created_at).getTime();
        const ageMs = nowMs - createdAtMs;
        const maxAgeMs =
          auditPeriodFilter === "24h"
            ? 24 * 60 * 60 * 1000
            : auditPeriodFilter === "7d"
              ? 7 * 24 * 60 * 60 * 1000
              : 30 * 24 * 60 * 60 * 1000;
        periodOk = Number.isFinite(createdAtMs) && ageMs <= maxAgeMs;
      }

      return actionOk && actorOk && periodOk;
    });
  }, [auditRows, auditActionFilter, auditActorFilter, auditPeriodFilter]);

  const kpis: Kpi[] = [
    { label: "Utilisateurs actifs", value: counts.users, hint: "Comptes professeurs et directions", tone: "neutral", Icon: Users },
    { label: "Enseignants", value: counts.teachers, hint: "Population pedagogique", tone: "good", Icon: School },
    { label: "Directions", value: counts.directors, hint: "Comptes d'administration", tone: "neutral", Icon: ShieldCheck },
    { label: "Eleves (suivi)", value: counts.students, hint: "Depuis le module eleves", tone: "neutral", Icon: Activity },
    { label: "Documents", value: counts.documents, hint: "Base documentaire de l'etablissement", tone: "neutral", Icon: Database },
    {
      label: "Niveau de securite",
      value: securityFlags.forceStrongPasswords && securityFlags.enforceSessionTimeout ? "Eleve" : "Moyen",
      hint: "Politique actuelle de la plateforme",
      tone: securityFlags.forceStrongPasswords && securityFlags.enforceSessionTimeout ? "good" : "warn",
      Icon: ShieldAlert,
    },
  ];

  async function handleSaveSettings() {
    if (!isDirector) return;
    setSavingSettings(true);
    localStorage.setItem(
      "ecole2_admin_settings",
      JSON.stringify({ tenantName, tenantDomain, retentionDays, securityEmail, securityFlags })
    );
    setTimeout(() => setSavingSettings(false), 550);
    setNotice("Configuration sauvegardee.");
  }

  async function handleCreateInvitation() {
    if (!isDirector) return;
    if (!inviteEmail.trim()) {
      setNotice("Email requis pour creer une invitation.");
      return;
    }

    setCreatingInvite(true);
    setNotice(null);

    try {
      await edgeRequest<{ data: unknown }>("/invitations", {
        method: "POST",
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          fullName: inviteFullName.trim() || null,
          classId: inviteRole === "teacher" ? inviteClass : null,
          expiresHours: Number(inviteHours) || 168,
          note: "Invitation creee depuis le centre admin",
        }),
      });

      setInviteEmail("");
      setInviteFullName("");
      await loadAdminData();
      setNotice("Invitation creee avec succes.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Erreur creation invitation");
    } finally {
      setCreatingInvite(false);
    }
  }

  async function handleRevokeInvitation(invitationId: string, invitationEmail: string) {
    if (!isDirector) return;

    setCriticalAction({ type: "revoke-invitation", invitationId });
    setCriticalActionLabel(`Revocation de l'invitation pour ${invitationEmail}`);
    setCriticalActionConfirmation("");
    return;
  }

  async function revokeInvitation(invitationId: string) {
    if (!isDirector) return;

    try {
      await edgeRequest<{ ok: boolean }>("/invitations/revoke", {
        method: "POST",
        body: JSON.stringify({ invitationId, reason: "Revocation administrative" }),
      });
      await loadAdminData();
      setNotice("Invitation revoquee.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Erreur revocation invitation");
    }
  }

  async function handleAssignRole(userId: string, role: RowRole, currentRole: RowRole) {
    if (!isDirector) return;

    if (role === "director" && currentRole !== "director") {
      setCriticalAction({ type: "promote-director", userId, role });
      setCriticalActionLabel("Promotion en directeur avec acces administratif complet");
      setCriticalActionConfirmation("");
      return;
    }

    await assignRole(userId, role);
  }

  async function assignRole(userId: string, role: RowRole) {
    if (!isDirector) return;

    try {
      await edgeRequest<{ ok: boolean }>("/roles/assign", {
        method: "POST",
        body: JSON.stringify({ userId, role, reason: "Mise a jour hierarchique depuis le module admin" }),
      });
      await loadAdminData();
      setNotice("Role mis a jour.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Erreur attribution role");
    }
  }

  async function confirmCriticalAction() {
    if (!criticalAction || criticalActionBusy) return;
    if (criticalActionConfirmation.trim().toUpperCase() !== "CONFIRMER") {
      setNotice("Tapez CONFIRMER pour valider cette action sensible.");
      return;
    }

    setCriticalActionBusy(true);
    setNotice(null);

    try {
      if (criticalAction.type === "revoke-invitation") {
        await revokeInvitation(criticalAction.invitationId);
      }

      if (criticalAction.type === "promote-director") {
        await assignRole(criticalAction.userId, criticalAction.role);
      }
    } finally {
      setCriticalActionBusy(false);
      setCriticalAction(null);
      setCriticalActionLabel("");
      setCriticalActionConfirmation("");
    }
  }

  function cancelCriticalAction() {
    if (criticalActionBusy) return;
    setCriticalAction(null);
    setCriticalActionLabel("");
    setCriticalActionConfirmation("");
  }

  async function handleAssignClass(userId: string) {
    if (!isDirector) return;
    const nextClass = classEdits[userId];
    if (!nextClass) return;

    setSavingUserId(userId);
    setNotice(null);

    const { error } = await supabase
      .from("profiles")
      .update({ classe_active: nextClass, class_id: nextClass })
      .eq("id", userId);

    setSavingUserId(null);

    if (error) {
      setNotice(error.message);
      return;
    }

    await loadAdminData();
    setNotice("Classe active mise a jour.");
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

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        <section className="rounded-2xl md:rounded-3xl p-4 md:p-6" style={{ background: "radial-gradient(130% 150% at 0% 0%, color-mix(in srgb, var(--primary) 24%, var(--card)) 0%, color-mix(in srgb, var(--secondary) 18%, var(--card)) 38%, var(--card) 100%)", border: "1px solid var(--border)", boxShadow: "0 10px 30px color-mix(in srgb, var(--foreground) 8%, transparent)" }}>
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
              {isTeacherReadOnly && (
                <p className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: "color-mix(in srgb, #f59e0b 16%, var(--card))", color: "#b45309", fontSize: "12px", fontWeight: 700 }}>
                  <Eye className="w-4 h-4" />
                  Acces enseignant : lecture seule
                </p>
              )}
            </div>

            <button onClick={() => void loadAdminData()} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2" style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontWeight: 700, minHeight: "42px" }}>
              <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
              Actualiser
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
            {TABS.map(({ id, label, Icon }) => {
              const blockedForTeacher = isTeacherReadOnly && (id === "invitations" || id === "security" || id === "settings");
              const active = tab === id;
              return (
                <button key={id} onClick={() => !blockedForTeacher && setTab(id)} className="rounded-xl px-3 py-2 flex items-center justify-center gap-2" style={{ backgroundColor: active ? "var(--primary)" : "var(--card)", color: blockedForTeacher ? "var(--muted-foreground)" : active ? "var(--primary-foreground)" : "var(--foreground)", border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`, fontWeight: 700, fontSize: "12px", minHeight: "40px", opacity: blockedForTeacher ? 0.6 : 1, cursor: blockedForTeacher ? "not-allowed" : "pointer" }}>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {notice && (
          <div className="mt-4 rounded-xl px-4 py-3" style={{ backgroundColor: "color-mix(in srgb, var(--primary) 10%, var(--card))", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "13px", fontWeight: 600 }}>
            {notice}
          </div>
        )}

        {tab === "overview" && (
          <section className="mt-4 md:mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {kpis.map(({ label, value, hint, tone, Icon }) => (
              <article key={label} className="rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: `1px solid ${tone === "warn" ? "#f59e0b" : "var(--border)"}`, boxShadow: "0 6px 18px color-mix(in srgb, var(--foreground) 6%, transparent)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                    <p className="mt-1" style={{ fontSize: "28px", fontWeight: 900, color: "var(--foreground)", lineHeight: 1 }}>{value}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: tone === "good" ? "color-mix(in srgb, #22c55e 16%, var(--card))" : tone === "warn" ? "color-mix(in srgb, #f59e0b 16%, var(--card))" : "color-mix(in srgb, var(--primary) 14%, var(--card))" }}>
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
                  <input id="admin_search" name="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un utilisateur..." className="w-full rounded-xl pl-9 pr-3 py-2 outline-none" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "13px" }} />
                </div>
                <div className="relative">
                  <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
                  <select id="admin_roleFilter" name="roleFilter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as RoleFilter)} className="rounded-xl pl-9 pr-8 py-2 outline-none appearance-none" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "13px", minHeight: "40px" }}>
                    <option value="all">Tous les roles</option>
                    <option value="teacher">Enseignant</option>
                    <option value="director">Directeur</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {filteredProfiles.map((u) => (
                <article key={u.id} className="rounded-xl p-3" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)" }}>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--foreground)" }}>{u.full_name || "Sans nom"}</p>
                      <p style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>{u.ecole_nom || "Ecole non renseignee"}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full" style={{ fontSize: "11px", fontWeight: 700, backgroundColor: u.role === "director" ? "color-mix(in srgb, var(--primary) 18%, var(--card))" : "color-mix(in srgb, #0ea5e9 16%, var(--card))", color: u.role === "director" ? "var(--primary)" : "#0284c7" }}>
                        {u.role === "director" ? "Directeur" : "Enseignant"}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--foreground)", fontWeight: 600 }}>Classe: {u.classe_active || "-"}</span>
                      <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{u.telephone || "Non renseigne"}</span>
                    </div>
                  </div>

                  {isDirector && (
                    <div className="mt-3 flex flex-col md:flex-row md:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <UserCog className="w-4 h-4" style={{ color: "var(--primary)" }} />
                        <button onClick={() => void handleAssignRole(u.id, "teacher", u.role)} className="rounded-lg px-3 py-1.5" style={{ fontSize: "12px", fontWeight: 700, border: "1px solid var(--border)", backgroundColor: "var(--card)", color: "var(--foreground)" }}>
                          Enseignant
                        </button>
                        <button onClick={() => void handleAssignRole(u.id, "director", u.role)} className="rounded-lg px-3 py-1.5" style={{ fontSize: "12px", fontWeight: 700, border: "1px solid var(--primary)", backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}>
                          Directeur
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <select id={`admin_classEdit_${u.id}`} name="classEdit" value={classEdits[u.id] ?? "CE2"} onChange={(e) => setClassEdits((prev) => ({ ...prev, [u.id]: e.target.value }))} className="rounded-lg px-2 py-1.5" style={{ fontSize: "12px", fontWeight: 700, border: "1px solid var(--border)", backgroundColor: "var(--card)", color: "var(--foreground)" }}>
                          {ALL_CLASSES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <button onClick={() => void handleAssignClass(u.id)} className="rounded-lg px-3 py-1.5" style={{ fontSize: "12px", fontWeight: 700, border: "1px solid var(--border)", backgroundColor: "var(--muted)", color: "var(--foreground)", opacity: savingUserId === u.id ? 0.7 : 1 }}>
                          {savingUserId === u.id ? "Mise a jour..." : "Affecter classe"}
                        </button>
                      </div>
                    </div>
                  )}
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

        {tab === "invitations" && (
          <section className="mt-4 md:mt-6 grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4">
            <article className="rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--foreground)" }}>Creer une invitation</h3>
              <p className="mt-1" style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
                Invitez un collegue enseignant ou directeur via un flux serveur securise.
              </p>

              {isTeacherReadOnly ? (
                <div className="mt-3 rounded-xl px-3 py-2" style={{ backgroundColor: "color-mix(in srgb, #f59e0b 12%, var(--card))", border: "1px solid var(--border)", color: "#b45309", fontSize: "12px", fontWeight: 700 }}>
                  Lecture seule: creation d'invitation reservee aux directeurs.
                </div>
              ) : (
                <>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input id="admin_inviteEmail" name="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Email" className="rounded-xl px-3 py-2 outline-none" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "13px" }} />
                    <input id="admin_inviteFullName" name="fullName" value={inviteFullName} onChange={(e) => setInviteFullName(e.target.value)} placeholder="Nom complet (optionnel)" className="rounded-xl px-3 py-2 outline-none" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "13px" }} />
                    <select id="admin_inviteRole" name="role" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as RowRole)} className="rounded-xl px-3 py-2 outline-none" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "13px" }}>
                      <option value="teacher">Enseignant</option>
                      <option value="director">Directeur</option>
                    </select>
                    <select id="admin_inviteClass" name="class" value={inviteClass} onChange={(e) => setInviteClass(e.target.value)} disabled={inviteRole !== "teacher"} className="rounded-xl px-3 py-2 outline-none" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "13px", opacity: inviteRole !== "teacher" ? 0.6 : 1 }}>
                      {ALL_CLASSES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <input id="admin_inviteHours" name="hours" value={inviteHours} onChange={(e) => setInviteHours(e.target.value)} placeholder="Expiration (heures)" className="rounded-xl px-3 py-2 outline-none" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "13px" }} />
                  </div>

                  <button onClick={() => void handleCreateInvitation()} className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2" style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontWeight: 800, opacity: creatingInvite ? 0.8 : 1 }}>
                    <MailPlus className="w-4 h-4" />
                    {creatingInvite ? "Creation..." : "Creer invitation"}
                  </button>
                </>
              )}
            </article>

            <article className="rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--foreground)" }}>Invitations en cours</h3>
              <div className="mt-3 space-y-2 max-h-[420px] overflow-auto pr-1">
                {invitations.map((inv) => (
                  <div key={inv.id} className="rounded-xl px-3 py-2" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between gap-2">
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--foreground)" }}>{inv.email}</p>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: inv.status === "pending" ? "#d97706" : "var(--muted-foreground)" }}>{inv.status}</span>
                    </div>
                    <p style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                      {inv.role} · classe {inv.class_id || "-"} · exp {new Date(inv.expires_at).toLocaleDateString("fr-FR")}
                    </p>
                    {isDirector && inv.status === "pending" && (
                      <button onClick={() => void handleRevokeInvitation(inv.id, inv.email)} className="mt-2 inline-flex items-center gap-1 rounded-lg px-2.5 py-1" style={{ fontSize: "11px", fontWeight: 700, border: "1px solid #fca5a5", color: "#b91c1c", backgroundColor: "color-mix(in srgb, #ef4444 10%, var(--card))" }}>
                        <Ban className="w-3 h-3" />
                        Revoquer
                      </button>
                    )}
                  </div>
                ))}
                {invitations.length === 0 && (
                  <p style={{ color: "var(--muted-foreground)", fontSize: "12px", fontWeight: 600 }}>Aucune invitation pour le moment.</p>
                )}
              </div>
            </article>
          </section>
        )}

        {tab === "security" && (
          <section className="mt-4 md:mt-6 grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            <article className="rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--foreground)" }}>Posture securite</h3>
              <p className="mt-1" style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>Controles defense-in-depth adaptes a votre contexte scolaire.</p>
              <div className="mt-4 space-y-2">
                {[
                  { key: "forceStrongPasswords", label: "Mots de passe forts obligatoires", Icon: KeyRound },
                  { key: "enforceSessionTimeout", label: "Expiration de session automatique", Icon: Clock3 },
                  { key: "requireMfaForDirectors", label: "MFA obligatoire pour directeurs", Icon: ShieldCheck },
                  { key: "ipAllowListEnabled", label: "Restriction IP (allow-list)", Icon: ShieldAlert },
                ].map((row) => {
                  const enabled = securityFlags[row.key as keyof typeof securityFlags];
                  return (
                    <label key={row.key} htmlFor={`admin_${row.key}`} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", cursor: isDirector ? "pointer" : "not-allowed", opacity: isDirector ? 1 : 0.7 }}>
                      <span className="inline-flex items-center gap-2" style={{ color: "var(--foreground)", fontSize: "13px", fontWeight: 600 }}>
                        <row.Icon className="w-4 h-4" style={{ color: enabled ? "var(--primary)" : "var(--muted-foreground)" }} />
                        {row.label}
                      </span>
                      <input id={`admin_${row.key}`} name={row.key} type="checkbox" checked={enabled} disabled={!isDirector} onChange={(e) => setSecurityFlags((prev) => ({ ...prev, [row.key]: e.target.checked }))} style={{ width: "16px", height: "16px" }} />
                    </label>
                  );
                })}
              </div>
            </article>

            <article className="rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--foreground)" }}>Journal d'audit persistant</h3>
              <p className="mt-1" style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>Actions sensibles recensees cote serveur.</p>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                <select
                  id="admin_auditActionFilter"
                  name="auditActionFilter"
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="rounded-xl px-3 py-2 outline-none"
                  style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "12px", fontWeight: 600 }}
                >
                  <option value="all">Toutes les actions</option>
                  {auditActionOptions.map((action) => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>

                <select
                  id="admin_auditPeriodFilter"
                  name="auditPeriodFilter"
                  value={auditPeriodFilter}
                  onChange={(e) => setAuditPeriodFilter(e.target.value as "all" | "24h" | "7d" | "30d")}
                  className="rounded-xl px-3 py-2 outline-none"
                  style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "12px", fontWeight: 600 }}
                >
                  <option value="all">Toute periode</option>
                  <option value="24h">Dernieres 24h</option>
                  <option value="7d">Derniers 7 jours</option>
                  <option value="30d">Derniers 30 jours</option>
                </select>

                <select
                  value={auditActorFilter}
                  onChange={(e) => setAuditActorFilter(e.target.value)}
                  className="rounded-xl px-3 py-2 outline-none"
                  style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "12px", fontWeight: 600 }}
                >
                  <option value="all">Tous les acteurs</option>
                  {auditActorOptions.map((actorId) => (
                    <option key={actorId} value={actorId}>{actorNameById[actorId] ?? actorId.slice(0, 8)}</option>
                  ))}
                </select>
              </div>

              <div className="mt-3 space-y-2 max-h-[420px] overflow-auto pr-1">
                {filteredAuditRows.map((row) => (
                  <div key={row.id} className="rounded-xl px-3 py-2" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" style={{ color: "#16a34a" }} />
                      <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--foreground)" }}>{row.action}</p>
                    </div>
                    <p style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                      {new Date(row.created_at).toLocaleString("fr-FR")} · cible: {row.target_type}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                      acteur: {actorNameById[row.actor_user_id] ?? row.actor_user_id.slice(0, 8)}
                    </p>
                  </div>
                ))}
                {filteredAuditRows.length === 0 && (
                  <p style={{ color: "var(--muted-foreground)", fontSize: "12px", fontWeight: 600 }}>Aucune entree d'audit pour ce filtre.</p>
                )}
              </div>
            </article>
          </section>
        )}

        {tab === "settings" && (
          <section className="mt-4 md:mt-6 rounded-2xl p-4 md:p-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--foreground)" }}>Parametrage SaaS</h2>
            <p className="mt-1" style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>Gouvernance technique et metier de l'instance.</p>
            {!isDirector && (
              <div className="mt-3 rounded-xl px-3 py-2" style={{ backgroundColor: "color-mix(in srgb, #f59e0b 12%, var(--card))", border: "1px solid var(--border)", color: "#b45309", fontSize: "12px", fontWeight: 700 }}>
                Lecture seule: modification reservee aux directeurs.
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <label htmlFor="admin_tenantName" className="flex flex-col gap-1">
                <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Nom du tenant</span>
                <input id="admin_tenantName" name="tenantName" value={tenantName} onChange={(e) => setTenantName(e.target.value)} disabled={!isDirector} className="rounded-xl px-3 py-2 outline-none" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "13px", opacity: isDirector ? 1 : 0.7 }} />
              </label>
              <label htmlFor="admin_tenantDomain" className="flex flex-col gap-1">
                <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Domaine applicatif</span>
                <input id="admin_tenantDomain" name="tenantDomain" value={tenantDomain} onChange={(e) => setTenantDomain(e.target.value)} disabled={!isDirector} className="rounded-xl px-3 py-2 outline-none" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "13px", opacity: isDirector ? 1 : 0.7 }} />
              </label>
              <label htmlFor="admin_retentionDays" className="flex flex-col gap-1">
                <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Retention des donnees (jours)</span>
                <input id="admin_retentionDays" name="retentionDays" value={retentionDays} onChange={(e) => setRetentionDays(e.target.value)} disabled={!isDirector} className="rounded-xl px-3 py-2 outline-none" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "13px", opacity: isDirector ? 1 : 0.7 }} />
              </label>
              <label htmlFor="admin_securityEmail" className="flex flex-col gap-1">
                <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted-foreground)", textTransform: "uppercase" }}>Contact securite</span>
                <input id="admin_securityEmail" name="securityEmail" value={securityEmail} onChange={(e) => setSecurityEmail(e.target.value)} disabled={!isDirector} className="rounded-xl px-3 py-2 outline-none" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "13px", opacity: isDirector ? 1 : 0.7 }} />
              </label>
            </div>

            <div className="mt-5">
              <button onClick={() => void handleSaveSettings()} disabled={!isDirector} className="inline-flex items-center gap-2 rounded-xl px-4 py-2" style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontWeight: 800, minHeight: "42px", opacity: !isDirector || savingSettings ? 0.75 : 1, cursor: !isDirector ? "not-allowed" : "pointer" }}>
                <Save className="w-4 h-4" />
                {savingSettings ? "Sauvegarde..." : "Sauvegarder la configuration"}
              </button>
            </div>
          </section>
        )}
      </div>

      {criticalAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "color-mix(in srgb, black 45%, transparent)" }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-5"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 20px 60px color-mix(in srgb, var(--foreground) 20%, transparent)" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: "color-mix(in srgb, #f59e0b 16%, var(--card))", color: "#b45309" }}>
              <AlertTriangle className="w-4 h-4" />
              <span style={{ fontSize: "12px", fontWeight: 800 }}>Confirmation obligatoire</span>
            </div>

            <h3 className="mt-3" style={{ fontSize: "18px", fontWeight: 900, color: "var(--foreground)" }}>
              Action administrative sensible
            </h3>

            <p className="mt-2" style={{ color: "var(--muted-foreground)", fontSize: "13px", lineHeight: 1.5 }}>
              {criticalActionLabel}. Cette operation est irreversible a court terme et sera auditee cote serveur.
            </p>

            <label className="mt-4 block">
              <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted-foreground)", textTransform: "uppercase" }}>
                Tapez CONFIRMER pour continuer
              </span>
              <input
                value={criticalActionConfirmation}
                onChange={(e) => setCriticalActionConfirmation(e.target.value)}
                className="mt-1 w-full rounded-xl px-3 py-2 outline-none"
                style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "13px" }}
                placeholder="CONFIRMER"
                autoFocus
              />
            </label>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={cancelCriticalAction}
                disabled={criticalActionBusy}
                className="rounded-xl px-4 py-2"
                style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontWeight: 700, opacity: criticalActionBusy ? 0.7 : 1 }}
              >
                Annuler
              </button>
              <button
                onClick={() => void confirmCriticalAction()}
                disabled={criticalActionBusy}
                className="rounded-xl px-4 py-2"
                style={{ backgroundColor: "#b91c1c", color: "#fff", fontWeight: 800, opacity: criticalActionBusy ? 0.7 : 1 }}
              >
                {criticalActionBusy ? "Validation..." : "Confirmer l'action"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
