import { AlertTriangle, ArrowUpRight, CircleDollarSign, CreditCard, Landmark, ShieldAlert, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { formatCompactMoney, formatMoney, formatPercent, toneClass } from "../utils";
import type { AdminDashboardSummary } from "../types";

interface ExecutiveOverviewProps {
  summary: AdminDashboardSummary;
}

const palette = ["#0f766e", "#0891b2", "#ca8a04", "#dc2626", "#7c3aed", "#475569"];

export function ExecutiveOverview({ summary }: ExecutiveOverviewProps) {
  const kpiCards = [
    { title: "MRR", icon: CircleDollarSign, value: formatMoney(summary.kpis.mrr.value, summary.kpis.mrr.currency), tone: summary.kpis.mrr.tone, detail: "Revenu récurrent mensuel" },
    { title: "ARR", icon: Landmark, value: formatCompactMoney(summary.kpis.arr.value, summary.kpis.arr.currency), tone: summary.kpis.arr.tone, detail: "Projection annuelle" },
    { title: "Revenus du mois", icon: Wallet, value: formatMoney(summary.kpis.monthRevenue.value, summary.kpis.monthRevenue.currency), tone: summary.kpis.monthRevenue.tone, detail: `${summary.kpis.successPayments.value} paiements réussis` },
    { title: "Impayés", icon: ShieldAlert, value: formatMoney(summary.kpis.unpaid.value, summary.kpis.unpaid.currency), tone: summary.kpis.unpaid.tone, detail: `${summary.kpis.failedPayments.value} paiements en échec` },
    { title: "Recouvrement", icon: CreditCard, value: formatPercent(summary.kpis.recoveryRate.value), tone: summary.kpis.recoveryRate.tone, detail: `Churn ${formatPercent(summary.kpis.churnRate.value)}` },
    { title: "LTV estimée", icon: ArrowUpRight, value: formatMoney(summary.kpis.estimatedLtv.value, summary.kpis.estimatedLtv.currency), tone: summary.kpis.estimatedLtv.tone, detail: "Valeur vie client estimée" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kpiCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription>{item.title}</CardDescription>
                  <div className="rounded-full bg-slate-100 p-2 text-slate-600 dark:bg-slate-900 dark:text-slate-200">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className={`text-2xl font-semibold ${toneClass(item.tone)}`}>{item.value}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">{item.detail}</CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <CardHeader>
            <CardTitle>Trajectoire revenus 30 jours</CardTitle>
            <CardDescription>Pilotage journalier paid vs failed</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.charts.revenue30d}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => formatCompactMoney(value)} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatMoney(value)} />
                <Bar dataKey="paidAmountCents" name="Payé" fill="#0f766e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="failedAmountCents" name="Échec" fill="#dc2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <CardHeader>
            <CardTitle>Centre d’alertes</CardTitle>
            <CardDescription>Priorités business et conformité</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.alerts.length === 0 && (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                Aucune alerte critique pour le moment.
              </div>
            )}
            {summary.alerts.map((alert) => (
              <div key={alert.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${alert.severity === "critical" ? "text-rose-500" : alert.severity === "warn" ? "text-amber-500" : "text-sky-500"}`} />
                    <p className="font-medium">{alert.title}</p>
                  </div>
                  <Badge variant={alert.severity === "critical" ? "destructive" : "outline"}>{alert.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{alert.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <CardHeader>
            <CardTitle>Répartition établissements</CardTitle>
            <CardDescription>Part du revenu par tenant</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={summary.charts.byTenant} dataKey="value" nameKey="label" innerRadius={54} outerRadius={88} paddingAngle={3}>
                  {summary.charts.byTenant.map((entry, index) => (
                    <Cell key={entry.key} fill={palette[index % palette.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatMoney(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <CardHeader>
            <CardTitle>Répartition niveaux</CardTitle>
            <CardDescription>Volume d’élèves suivis par classe</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.charts.byLevel} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" hide />
                <YAxis dataKey="label" type="category" tick={{ fontSize: 12 }} width={56} />
                <Tooltip />
                <Bar dataKey="value" fill="#0891b2" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <CardHeader>
            <CardTitle>Modes de paiement</CardTitle>
            <CardDescription>Volume financier par canal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.charts.byPaymentMethod.map((item, index) => (
              <div key={item.key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize">{item.label.replaceAll("_", " ")}</span>
                  <span className="text-muted-foreground">{formatMoney(item.value)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-900">
                  <div className="h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(8, item.value / Math.max(summary.kpis.monthRevenue.value, 1) * 100))}%`, backgroundColor: palette[index % palette.length] }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}