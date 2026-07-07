import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminConsoleClient } from "../api/adminConsoleClient";
import type { PaymentFilters } from "../types";

const adminKeys = {
  tenants: ["admin-console", "tenants"] as const,
  summary: (tenantId: string) => ["admin-console", tenantId, "summary"] as const,
  payments: (tenantId: string, filters: PaymentFilters) => ["admin-console", tenantId, "payments", filters] as const,
  billing: (tenantId: string) => ["admin-console", tenantId, "billing"] as const,
  audit: (tenantId: string) => ["admin-console", tenantId, "audit"] as const,
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

export function useAdminConsole() {
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

  const resolvedTenantId = tenantId || tenantsQuery.data?.[0]?.id || "";

  const summaryQuery = useQuery({
    queryKey: adminKeys.summary(resolvedTenantId),
    enabled: Boolean(resolvedTenantId),
    queryFn: () => adminConsoleClient.getSummary(resolvedTenantId),
  });

  const paymentsQuery = useQuery({
    queryKey: adminKeys.payments(resolvedTenantId, filters),
    enabled: Boolean(resolvedTenantId),
    queryFn: () => adminConsoleClient.getPayments(resolvedTenantId, filters),
  });

  const billingQuery = useQuery({
    queryKey: adminKeys.billing(resolvedTenantId),
    enabled: Boolean(resolvedTenantId),
    queryFn: () => adminConsoleClient.getBilling(resolvedTenantId),
  });

  const auditQuery = useQuery({
    queryKey: adminKeys.audit(resolvedTenantId),
    enabled: Boolean(resolvedTenantId),
    queryFn: () => adminConsoleClient.getAudit(resolvedTenantId),
  });

  const paymentDetailQuery = useQuery({
    queryKey: adminKeys.paymentDetail(resolvedTenantId, selectedPaymentId),
    enabled: Boolean(resolvedTenantId && selectedPaymentId),
    queryFn: () => adminConsoleClient.getPaymentDetail(resolvedTenantId, selectedPaymentId as string),
  });

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: adminKeys.summary(resolvedTenantId) }),
      queryClient.invalidateQueries({ queryKey: adminKeys.payments(resolvedTenantId, filters) }),
      queryClient.invalidateQueries({ queryKey: adminKeys.billing(resolvedTenantId) }),
      queryClient.invalidateQueries({ queryKey: adminKeys.audit(resolvedTenantId) }),
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
    tenantsQuery,
    summaryQuery,
    paymentsQuery,
    billingQuery,
    auditQuery,
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
    refreshAll,
  };
}