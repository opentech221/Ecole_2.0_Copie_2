import { ShieldCheck, Users, GraduationCap, FileText, Lock, ArrowRight, RefreshCw, Activity, Clock3, BellRing, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { useAdminSaasMetrics } from "../hooks/useAdminSaasMetrics";
import { ProgrammeNavigationWorkspace } from "../components/ProgrammeNavigationWorkspace";

export function AdminSaasPage() {
  const metrics = useAdminSaasMetrics();

  const trendPoints = [36, 44, 41, 58, 62, 70];
  const healthItems = [
    { label: "API Supabase", state: "Opérationnel", detail: "Latence moyenne < 180 ms", tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" },
    { label: "Authentification", state: "Stable", detail: "Sessions valides et rafraichies", tone: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200" },
    { label: "Stockage documents", state: "Attention", detail: "Capacité disponible à 82%", tone: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" },
  ];
  const alerts = [
    { title: "Activation requise", text: "2 comptes enseignants n’ont pas encore complété leur profil de sécurité.", badge: "À traiter", tone: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" },
    { title: "Sécurité", text: "La politique MFA reste recommandée pour les profils direction.", badge: "Recommandé", tone: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200" },
  ];

  const cards = [
    {
      title: "Utilisateurs actifs",
      value: metrics.loading ? "—" : metrics.activeUsers,
      subtitle: "Comptes professeurs et directions",
      icon: Users,
      tone: "from-emerald-500 to-teal-600",
    },
    {
      title: "Enseignants",
      value: metrics.loading ? "—" : metrics.teacherCount,
      subtitle: "Population pédagogique",
      icon: GraduationCap,
      tone: "from-sky-500 to-cyan-600",
    },
    {
      title: "Directions",
      value: metrics.loading ? "—" : metrics.directorCount,
      subtitle: "Comptes d'administration",
      icon: ShieldCheck,
      tone: "from-violet-500 to-fuchsia-600",
    },
    {
      title: "Élèves (suivi)",
      value: metrics.loading ? "—" : metrics.studentCount,
      subtitle: "Depuis le module élèves",
      icon: Users,
      tone: "from-amber-500 to-orange-600",
    },
    {
      title: "Documents",
      value: metrics.loading ? "—" : metrics.documentCount,
      subtitle: "Base documentaire de l'établissement",
      icon: FileText,
      tone: "from-slate-500 to-slate-700",
    },
  ];

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(37,99,235,0.16),_transparent_28%),linear-gradient(135deg,#f8fafc_0%,#eef4ff_48%,#f8fafc_100%)] p-4 md:p-6 dark:bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.2),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(37,99,235,0.14),_transparent_28%),linear-gradient(135deg,#020617_0%,#0f172a_55%,#020617_100%)]">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="overflow-hidden border-slate-200/70 bg-white/90 shadow-[0_25px_80px_-30px_rgba(2,6,23,0.45)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <div className="border-b border-slate-200/70 bg-[linear-gradient(135deg,_rgba(15,118,110,0.16),_rgba(8,145,178,0.16),_rgba(37,99,235,0.14))] p-6 dark:border-slate-800">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4" /> Centre d'administration
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-semibold tracking-tight">Admin SaaS</CardTitle>
                  <p className="max-w-3xl text-sm text-muted-foreground">
                    Gouvernance, sécurité et pilotage global de la plateforme. Ce cockpit centralise les indicateurs clés de la vie scolaire et de la gouvernance du produit.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">Pilotage global</Badge>
                <Badge className="bg-sky-600 text-white hover:bg-sky-700">Sécurité</Badge>
                <Badge className="bg-violet-600 text-white hover:bg-violet-700">Gouvernance</Badge>
              </div>
            </div>
          </div>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Indicateurs de plateforme</p>
                <p className="text-sm text-muted-foreground">Données issues de Supabase et actualisées en temps réel.</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" /> Actualiser
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {cards.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70">
                    <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${item.tone} p-2 text-white shadow-lg`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight">{item.value}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{item.subtitle}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Évolution des métriques</p>
                    <p className="text-sm text-muted-foreground">Activité globale sur les 6 derniers points</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <Sparkles className="h-3.5 w-3.5" /> En hausse
                  </div>
                </div>
                <div className="flex h-32 items-end gap-2">
                  {trendPoints.map((point, index) => (
                    <div key={`${point}-${index}`} className="flex-1 rounded-t-xl bg-gradient-to-t from-emerald-600 to-cyan-500" style={{ height: `${point}%` }} />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                <div className="mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Statut système</p>
                </div>
                <div className="space-y-3">
                  {healthItems.map((item) => (
                    <div key={item.label} className="rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/70">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.tone}`}>{item.state}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BellRing className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Alertes sécurité & activation</p>
                </div>
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-900/55">En direct</Badge>
              </div>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.title} className="flex items-start gap-3 rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/70">
                    <div className="mt-0.5 rounded-full bg-slate-100 p-1.5 dark:bg-slate-800">
                      {alert.title.includes("Sécurité") ? <Lock className="h-4 w-4 text-sky-600" /> : <Clock3 className="h-4 w-4 text-amber-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{alert.title}</p>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${alert.tone}`}>{alert.badge}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{alert.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Lock className="h-4 w-4" /> Niveau de sécurité
              </div>
              <h2 className="text-xl font-semibold">Élève</h2>
              <p className="text-sm text-muted-foreground">Politique actuelle de la plateforme : accès restreint aux profils direction et administration.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
                <Link to="/admin" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800">
                Ouvrir la console d'administration
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/admin/legacy" className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700">
                Interface héritée
              </Link>
            </div>
          </CardContent>
        </Card>

        <ProgrammeNavigationWorkspace />
      </div>
    </div>
  );
}
