import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminConsoleClient } from "../api/adminConsoleClient";
import type { AdminUserFilters, PaymentFilters, SummaryFilters } from "../types";

const adminKeys = {
  tenants: ["admin-console", "tenants"] as const,
  summary: (tenantId: string) => ["admin-console", tenantId, "summary"] as const,
  summaryScoped: (tenantId: string, filters: SummaryFilters) => ["admin-console", tenantId, "summary", filters] as const,
  payments: (tenantId: string, filters: PaymentFilters) => ["admin-console", tenantId, "payments", filters] as const,
  billing: (tenantId: string) => ["admin-console", tenantId, "billing"] as const,
  audit: (tenantId: string) => ["admin-console", tenantId, "audit"] as const,
  users: (tenantId: string, filters: AdminUserFilters) => ["admin-console", tenantId, "users", filters] as const,
  userDetail: (tenantId: string, userId: string | null) => ["admin-console", tenantId, "user-detail", userId] as const,
  paymentDetail: (tenantId: string, paymentId: string | null) => ["admin-console", tenantId, "payment", paymentId] as const,
};

export function useAdminTenants() {
  return useQuery({
    queryKey: adminKeys.tenants,
    queryFn: async () => {
      const result = await adminConsoleClient.getTenants();
      return result.data;
    },
  });
}

export function useAdminConsole(activeTab: string) {
  const queryClient = useQueryClient();
  const tenantsQuery = useAdminTenants();
  const [tenantId, setTenantId] = useState<string>("");
  const [filters, setFilters] = useState<PaymentFilters>({
    page: 1,
    pageSize: 10,
    search: "",
    status: "all",
    paymentMethod: "all",
    reconciliationStatus: "all",
  });
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [summaryFilters, setSummaryFilters] = useState<SummaryFilters>({ period: "30d" });
  const [userFilters, setUserFilters] = useState<AdminUserFilters>({
    page: 1,
    pageSize: 20,
    search: "",
    status: "all",
    role: "all",
    sortBy: "created_at",
    sortOrder: "desc",
  });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const resolvedTenantId = tenantId || tenantsQuery.data?.[0]?.id || "";
  const isOverviewTab = activeTab === "overview";
  const isUsersTab = activeTab === "users";
  const isPaymentsTab = activeTab === "payments";
  const isBillingTab = activeTab === "billing";
  const isAuditTab = activeTab === "audit";

  const summaryQuery = useQuery({
    queryKey: adminKeys.summaryScoped(resolvedTenantId, summaryFilters),
    enabled: Boolean(resolvedTenantId && isOverviewTab),
    queryFn: () => adminConsoleClient.getSummary(resolvedTenantId, summaryFilters),
  });

  const paymentsQuery = useQuery({
    queryKey: adminKeys.payments(resolvedTenantId, filters),
    enabled: Boolean(resolvedTenantId && isPaymentsTab),
    queryFn: () => adminConsoleClient.getPayments(resolvedTenantId, filters),
  });

  const billingQuery = useQuery({
    queryKey: adminKeys.billing(resolvedTenantId),
    enabled: Boolean(resolvedTenantId && isBillingTab),
    queryFn: () => adminConsoleClient.getBilling(resolvedTenantId),
  });

  const auditQuery = useQuery({
    queryKey: adminKeys.audit(resolvedTenantId),
    enabled: Boolean(resolvedTenantId && isAuditTab),
    queryFn: () => adminConsoleClient.getAudit(resolvedTenantId),
  });

  const usersQuery = useQuery({
    queryKey: adminKeys.users(resolvedTenantId, userFilters),
    enabled: Boolean(resolvedTenantId && isUsersTab),
    queryFn: () => adminConsoleClient.getUsers(resolvedTenantId, userFilters),
  });

  const unlinkedAuthUsersQuery = useQuery({
    queryKey: ["admin-console", resolvedTenantId, "unlinked-auth-users"] as const,
    enabled: Boolean(resolvedTenantId && isUsersTab),
    queryFn: () => adminConsoleClient.getUnlinkedAuthUsers(resolvedTenantId),
  });

  const userDetailQuery = useQuery({
    queryKey: adminKeys.userDetail(resolvedTenantId, selectedUserId),
    enabled: Boolean(resolvedTenantId && isUsersTab && selectedUserId),
    queryFn: () => adminConsoleClient.getUserDetail(resolvedTenantId, selectedUserId as string),
  });

  const paymentDetailQuery = useQuery({
    queryKey: adminKeys.paymentDetail(resolvedTenantId, selectedPaymentId),
    enabled: Boolean(resolvedTenantId && isPaymentsTab && selectedPaymentId),
    queryFn: () => adminConsoleClient.getPaymentDetail(resolvedTenantId, selectedPaymentId as string),
  });

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: adminKeys.summary(resolvedTenantId) }),
      queryClient.invalidateQueries({ queryKey: adminKeys.summaryScoped(resolvedTenantId, summaryFilters) }),
      queryClient.invalidateQueries({ queryKey: adminKeys.payments(resolvedTenantId, filters) }),
      queryClient.invalidateQueries({ queryKey: adminKeys.billing(resolvedTenantId) }),
      queryClient.invalidateQueries({ queryKey: adminKeys.audit(resolvedTenantId) }),
      queryClient.invalidateQueries({ queryKey: adminKeys.users(resolvedTenantId, userFilters) }),
      queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(resolvedTenantId, selectedUserId) }),
    ]);
  };

  function success(message: string) {
    toast.success(message);
    void refreshAll();
  }

  function failure(error: unknown, fallback: string) {
    toast.error(error instanceof Error ? error.message : fallback);
  }

  const refundMutation = useMutation({
    mutationFn: (input: { paymentId: string; amountCents: number; reason: string }) =>
      adminConsoleClient.refundPayment(resolvedTenantId, input.paymentId, {
        amountCents: input.amountCents,
        reason: input.reason,
      }),
    onSuccess: () => success("Remboursement enregistré."),
    onError: (error) => failure(error, "Erreur remboursement"),
  });

  const reminderMutation = useMutation({
    mutationFn: (input: { paymentId: string; channel: "email" | "in_app" | "sms"; message?: string }) =>
      adminConsoleClient.sendPaymentReminder(resolvedTenantId, input.paymentId, input),
    onSuccess: () => success("Relance envoyée."),
    onError: (error) => failure(error, "Erreur relance"),
  });

  const markOfflineMutation = useMutation({
    mutationFn: (input: { paymentId: string; note: string; amountCents?: number }) =>
      adminConsoleClient.markPaymentOffline(resolvedTenantId, input.paymentId, input),
    onSuccess: () => success("Paiement marqué hors-ligne."),
    onError: (error) => failure(error, "Erreur mise à jour hors-ligne"),
  });

  const cancelMutation = useMutation({
    mutationFn: (paymentId: string) => adminConsoleClient.cancelPayment(resolvedTenantId, paymentId),
    onSuccess: () => success("Transaction annulée."),
    onError: (error) => failure(error, "Erreur annulation"),
  });

  const noteMutation = useMutation({
    mutationFn: (input: { paymentId: string; note: string }) =>
      adminConsoleClient.savePaymentNote(resolvedTenantId, input.paymentId, { note: input.note }),
    onSuccess: () => success("Note interne enregistrée."),
    onError: (error) => failure(error, "Erreur note interne"),
  });

  const planMutation = useMutation({
    mutationFn: adminConsoleClient.upsertPlan.bind(null, resolvedTenantId),
    onSuccess: () => success("Plan sauvegardé."),
    onError: (error) => failure(error, "Erreur sauvegarde plan"),
  });

  const createUserMutation = useMutation({
    mutationFn: adminConsoleClient.createUser.bind(null, resolvedTenantId),
    onSuccess: () => success("Utilisateur créé."),
    onError: (error) => failure(error, "Erreur création utilisateur"),
  });

  const updateUserMutation = useMutation({
    mutationFn: (input: { userId: string; payload: Parameters<typeof adminConsoleClient.updateUser>[2] }) =>
      adminConsoleClient.updateUser(resolvedTenantId, input.userId, input.payload),
    onSuccess: () => success("Utilisateur mis à jour."),
    onError: (error) => failure(error, "Erreur mise à jour utilisateur"),
  });

  const suspendUserMutation = useMutation({
    mutationFn: (input: { userId: string; reason: string }) =>
      adminConsoleClient.suspendUser(resolvedTenantId, input.userId, { reason: input.reason }),
    onSuccess: () => success("Utilisateur suspendu."),
    onError: (error) => failure(error, "Erreur suspension utilisateur"),
  });

  const reactivateUserMutation = useMutation({
    mutationFn: (input: { userId: string; reason?: string }) =>
      adminConsoleClient.reactivateUser(resolvedTenantId, input.userId, { reason: input.reason }),
    onSuccess: () => success("Utilisateur réactivé."),
    onError: (error) => failure(error, "Erreur réactivation utilisateur"),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (input: { userId: string; redirectTo?: string }) =>
      adminConsoleClient.resetPassword(resolvedTenantId, input.userId, { redirectTo: input.redirectTo }),
    onSuccess: () => success("Réinitialisation mot de passe envoyée."),
    onError: (error) => failure(error, "Erreur réinitialisation mot de passe"),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (input: { userId: string; hardDelete?: boolean; reason?: string }) =>
      adminConsoleClient.deleteUser(resolvedTenantId, input.userId, { hardDelete: Boolean(input.hardDelete), reason: input.reason }),
    onSuccess: () => success("Utilisateur supprimé."),
    onError: (error) => failure(error, "Erreur suppression utilisateur"),
  });

  const importUsersMutation = useMutation({
    mutationFn: (input: { csv: string }) => adminConsoleClient.importUsersCsv(resolvedTenantId, { csv: input.csv }),
    onSuccess: (result) => success(`Import terminé: ${result.imported} succès, ${result.failed} échec(s).`),
    onError: (error) => failure(error, "Erreur import CSV"),
  });

  const statusCounts = useMemo(() => {
    const rows = paymentsQuery.data?.rows ?? [];
    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    }, {});
  }, [paymentsQuery.data?.rows]);

  return {
    tenantId: resolvedTenantId,
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
    unlinkedAuthUsersQuery,
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
  };
}