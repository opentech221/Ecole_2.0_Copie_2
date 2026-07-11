import { ShieldCheck, Users, GraduationCap, FileText, Lock, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

const metrics = [
  {
    title: "Utilisateurs actifs",
    value: "6",
    subtitle: "Comptes professeurs et directions",
    icon: Users,
    tone: "from-emerald-500 to-teal-600",
  },
  {
    title: "Enseignants",
    value: "3",
    subtitle: "Population pédagogique",
    icon: GraduationCap,
    tone: "from-sky-500 to-cyan-600",
  },
  {
    title: "Directions",
    value: "3",
    subtitle: "Comptes d'administration",
    icon: ShieldCheck,
    tone: "from-violet-500 to-fuchsia-600",
  },
  {
    title: "Élèves (suivi)",
    value: "0",
    subtitle: "Depuis le module élèves",
    icon: Users,
    tone: "from-amber-500 to-orange-600",
  },
  {
    title: "Documents",
    value: "0",
    subtitle: "Base documentaire de l'établissement",
    icon: FileText,
    tone: "from-slate-500 to-slate-700",
  },
];

export function AdminSaasPage() {
  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.12),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(8,145,178,0.10),_transparent_28%),linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,1))] p-4 md:p-6 dark:bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(8,145,178,0.14),_transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(2,6,23,1))]">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="border-slate-200/70 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4" /> Centre d'administration
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-semibold tracking-tight">Admin SaaS</CardTitle>
              <p className="max-w-3xl text-sm text-muted-foreground">
                Gouvernance, sécurité et pilotage global de la plateforme. Ce module centralise les indicateurs clés de la vie scolaire et de la gouvernance du produit.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Pilotage global</Badge>
              <Badge variant="outline">Sécurité</Badge>
              <Badge variant="outline">Gouvernance</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {metrics.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                    <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${item.tone} p-2 text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight">{item.value}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{item.subtitle}</p>
                  </div>
                );
              })}
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
              <Link to="/admin" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                Ouvrir Admin Console
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/admin/legacy" className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700">
                Interface legacy
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
