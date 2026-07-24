import { startTransition, useEffect, useMemo, useState } from "react";
import { BarChart3, PanelLeft, RefreshCw, ShieldCheck, Sparkles, Users, CreditCard, FileCheck2, Workflow, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Input } from "@/app/components/ui/input";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { adminConsoleClient } from "../api/adminConsoleClient";
import { AuditWorkspace } from "../components/AuditWorkspace";
import { BillingWorkspace } from "../components/BillingWorkspace";
import { ExecutiveOverview } from "../components/ExecutiveOverview";
import { PaymentDetailDialog } from "../components/PaymentDetailDialog";
import { PaymentsWorkspace } from "../components/PaymentsWorkspace";
import { PlanEditorDialog } from "../components/PlanEditorDialog";
import { UsersWorkspace } from "../components/UsersWorkspace";
import { useAdminConsole } from "../hooks/useAdminConsole";

const FILTER_STORAGE_KEY = "ecole2.admin-console.filters";

export function AdminConsolePage() {
  const { profile, loading } = useAuthContext();
  const [tab, setTab] = useState("overview");
  const [dashboardPanel, setDashboardPanel] = useState("contexte");
  const {
    tenantId,
    setTenantId,
    filters,
    setFilters,
    summaryFilters,
    setSummaryFilters,
    userFilters,
    setUserFilters,
    tenantsQuery,
    summaryQuery,
    paymentsQuery,
    billingQuery,
    auditQuery,
    usersQuery,
    selectedUserId,
    setSelectedUserId,
    userDetailQuery,
    selectedPaymentId,
    setSelectedPaymentId,
    paymentDetailQuery,
    statusCounts,
    refundMutation,
    reminderMutation,
    markOfflineMutation,
    cancelMutation,
    noteMutation,
    planMutation,
    createUserMutation,
    updateUserMutation,
    suspendUserMutation,
    reactivateUserMutation,
    resetPasswordMutation,
    deleteUserMutation,
    importUsersMutation,
    refreshAll,
  } = useAdminConsole(tab);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  function goToTab(nextTab: string) {
    startTransition(() => setTab(nextTab));
  }

  useEffect(() => {
    const raw = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as typeof filters;
      setFilters(parsed);
    } catch {
      localStorage.removeItem(FILTER_STORAGE_KEY);
    }
  }, [setFilters]);

  useEffect(() => {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const editingPlan = useMemo(() => billingQuery.data?.plans.find((plan) => plan.id === editingPlanId) ?? null, [billingQuery.data?.plans, editingPlanId]);

  const isAllowed = profile?.role === "director";
  const busyAction = refundMutation.isPending
    || reminderMutation.isPending
    || markOfflineMutation.isPending
    || cancelMutation.isPending
    || noteMutation.isPending
    || createUserMutation.isPending
    || updateUserMutation.isPending
    || suspendUserMutation.isPending
    || reactivateUserMutation.isPending
    || resetPasswordMutation.isPending
    || deleteUserMutation.isPending
    || importUsersMutation.isPending;

  async function handleExport() {
    const csv = await adminConsoleClient.exportPaymentsCsv(tenantId, filters);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payments-${tenantId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleExportUsers() {
    const csv = await adminConsoleClient.exportUsersCsv(tenantId);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `users-${tenantId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <div className="space-y-4 p-6"><Skeleton className="h-20 w-full" /><Skeleton className="h-[420px] w-full" /></div>;
  }

  if (!isAllowed) {
    return (
      <div className="p-6">
        <Card className="mx-auto max-w-2xl border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <CardContent className="space-y-4 p-8 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-slate-500" />
            <div>
              <h1 className="text-2xl font-semibold">Accès restreint</h1>
              <p className="text-muted-foreground">Le cockpit business est réservé aux profils direction/finance.</p>
            </div>
            <Link to="/admin/legacy" className="text-primary underline-offset-4 hover:underline">Ouvrir l’interface d’administration héritée</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.12),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(8,145,178,0.10),_transparent_28%),linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,1))] p-4 md:p-6 dark:bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(8,145,178,0.14),_transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(2,6,23,1))]">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[28px] border border-slate-200/70 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PanelLeft className="h-4 w-4" /> Pilotage global du business
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Console d'administration 2026</h1>
                <p className="text-muted-foreground">Paiements, facturation, abonnements, audit et alertes centralisés.</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div>
                <label htmlFor="admin_tenantSelect" className="sr-only">Sélectionner un établissement</label>
                <Select value={tenantId} onValueChange={setTenantId}>
                  <SelectTrigger id="admin_tenantSelect" name="tenantSelect" className="min-w-[260px]">
                    <SelectValue placeholder="Sélectionner un établissement" />
                  </SelectTrigger>
                <SelectContent>
                  {(tenantsQuery.data ?? []).map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{summaryQuery.data?.userRole ?? profile?.role}</Badge>
                <Button variant="outline" onClick={() => void refreshAll()}>
                  <RefreshCw className="h-4 w-4" /> Rafraîchir
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Filtres de pilotage</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
              <Select value={summaryFilters.period} onValueChange={(value) => setSummaryFilters((prev) => ({ ...prev, period: value as "7d" | "30d" | "90d" | "12m" }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 jours</SelectItem>
                  <SelectItem value="30d">30 jours</SelectItem>
                  <SelectItem value="90d">90 jours</SelectItem>
                  <SelectItem value="12m">12 mois</SelectItem>
                </SelectContent>
              </Select>
                <Input
                placeholder="Pays (ex. SN)"
                value={summaryFilters.country ?? ""}
                onChange={(event) => setSummaryFilters((prev) => ({ ...prev, country: event.target.value || undefined }))}
              />
                <Input
                placeholder="Canal d'acquisition"
                value={summaryFilters.channel ?? ""}
                onChange={(event) => setSummaryFilters((prev) => ({ ...prev, channel: event.target.value || undefined }))}
              />
                <Input
                placeholder="UUID du plan (facultatif)"
                value={summaryFilters.planId ?? ""}
                onChange={(event) => setSummaryFilters((prev) => ({ ...prev, planId: event.target.value || undefined }))}
              />
            </div>
          </div>
        </div>

        <Card className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <CardContent className="space-y-6 p-5">
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
              <Workflow className="h-4 w-4 text-sky-600" /> Tableau de bord opérationnel
            </div>

            <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="grid gap-3">
                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sélection active</p>
                      <p className="mt-1 text-lg font-semibold">{summaryQuery.data?.tenant.name ?? tenantsQuery.data?.find((tenant) => tenant.id === tenantId)?.name ?? "—"}</p>
                    </div>
                    <Badge variant="outline">{summaryQuery.data?.userRole ?? profile?.role ?? "—"}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">Période actuelle: {summaryFilters.period}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 p-3 dark:border-emerald-800/70 dark:bg-emerald-950/40">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">API</p>
                    </div>
                    <p className="mt-2 text-lg font-semibold">98%</p>
                    <p className="text-xs text-muted-foreground">Disponibilité</p>
                  </div>
                  <div className="rounded-2xl border border-sky-200/70 bg-sky-50/80 p-3 dark:border-sky-800/70 dark:bg-sky-950/40">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-sky-600" />
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Sécurité</p>
                    </div>
                    <p className="mt-2 text-lg font-semibold">Stable</p>
                    <p className="text-xs text-muted-foreground">MFA & accès</p>
                  </div>
                  <div className="rounded-2xl border border-amber-200/70 bg-amber-50/80 p-3 dark:border-amber-800/70 dark:bg-amber-950/40">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Stockage</p>
                    </div>
                    <p className="mt-2 text-lg font-semibold">82%</p>
                    <p className="text-xs text-muted-foreground">Capacité restante</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Utilisateurs actifs</span>
                    <span className="text-sm font-semibold text-emerald-600">{summaryQuery.data?.business?.kpis.activeUsers ?? "—"}</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Paiements réussis</span>
                    <span className="text-sm font-semibold text-sky-600">{summaryQuery.data?.kpis.successPayments.value ?? "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={(value) => startTransition(() => setTab(value))} className="space-y-4">
          <TabsList className="w-full justify-start overflow-auto rounded-2xl border border-slate-200/70 bg-white/90 p-1 dark:border-slate-800 dark:bg-slate-950/80">
            <TabsTrigger value="overview"><BarChart3 className="h-4 w-4" /> Vue exécutive</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="payments">Paiements</TabsTrigger>
            <TabsTrigger value="billing">Facturation & abonnements</TabsTrigger>
            <TabsTrigger value="audit">Audit & conformité</TabsTrigger>
            <TabsTrigger value="legacy">Administration héritée</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {summaryQuery.isLoading || !summaryQuery.data ? <Skeleton className="h-[620px] w-full" /> : <ExecutiveOverview summary={summaryQuery.data} />}
          </TabsContent>

          <TabsContent value="users">
            <UsersWorkspace
              filters={userFilters}
              setFilters={setUserFilters}
              data={usersQuery.data}
              loading={usersQuery.isLoading}
              selectedUserId={selectedUserId}
              onSelectUser={setSelectedUserId}
              selectedUser={userDetailQuery.data}
              detailLoading={userDetailQuery.isLoading}
              busy={busyAction}
              onCreateUser={(payload) => createUserMutation.mutate(payload)}
              onUpdateUser={(payload) => updateUserMutation.mutate({ userId: payload.userId, payload })}
              onSuspendUser={(payload) => suspendUserMutation.mutate(payload)}
              onReactivateUser={(payload) => reactivateUserMutation.mutate(payload)}
              onResetPassword={(payload) => resetPasswordMutation.mutate(payload)}
              onDeleteUser={(payload) => deleteUserMutation.mutate(payload)}
              onImportCsv={(payload) => importUsersMutation.mutate(payload)}
              onExportCsv={() => void handleExportUsers()}
            />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentsWorkspace
              filters={filters}
              setFilters={setFilters}
              data={paymentsQuery.data}
              loading={paymentsQuery.isLoading}
              statusCounts={statusCounts}
              onOpenPayment={setSelectedPaymentId}
              onExport={() => void handleExport()}
            />
          </TabsContent>

          <TabsContent value="billing">
            <BillingWorkspace
              data={billingQuery.data}
              onCreatePlan={() => {
                startTransition(() => {
                  setEditingPlanId(null);
                  setPlanDialogOpen(true);
                });
              }}
              onEditPlan={(plan) => {
                startTransition(() => {
                  setEditingPlanId(plan.id);
                  setPlanDialogOpen(true);
                });
              }}
            />
          </TabsContent>

          <TabsContent value="audit">
            <AuditWorkspace data={auditQuery.data} />
          </TabsContent>

          <TabsContent value="legacy">
            <Card className="border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
              <CardContent className="flex flex-col items-start gap-3 p-6">
                <h2 className="text-xl font-semibold">Compatibilité héritée</h2>
                <p className="text-muted-foreground">L’ancien écran d’administration reste disponible pour les workflows historiques.</p>
                <Link to="/admin/legacy" className="text-primary underline-offset-4 hover:underline">Ouvrir l’écran d’administration hérité</Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <PaymentDetailDialog
        open={Boolean(selectedPaymentId)}
        onOpenChange={(open) => {
          if (!open) setSelectedPaymentId(null);
        }}
        payment={paymentDetailQuery.data}
        busy={busyAction}
        onRefund={(amountCents, reason) => {
          if (!selectedPaymentId) return;
          refundMutation.mutate({ paymentId: selectedPaymentId, amountCents, reason });
        }}
        onReminder={(message) => {
          if (!selectedPaymentId) return;
          reminderMutation.mutate({ paymentId: selectedPaymentId, channel: "email", message });
        }}
        onOffline={(note) => {
          if (!selectedPaymentId) return;
          markOfflineMutation.mutate({ paymentId: selectedPaymentId, note });
        }}
        onCancel={() => {
          if (!selectedPaymentId) return;
          cancelMutation.mutate(selectedPaymentId);
        }}
        onSaveNote={(note) => {
          if (!selectedPaymentId) return;
          noteMutation.mutate({ paymentId: selectedPaymentId, note });
        }}
      />

      <PlanEditorDialog
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
        plan={editingPlan}
        onSubmit={(payload) => {
          planMutation.mutate(payload);
          setPlanDialogOpen(false);
        }}
      />
    </div>
  );
}