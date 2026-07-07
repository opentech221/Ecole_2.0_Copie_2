import { supabase } from "@/lib/supabase";
import { projectId } from "../../../../utils/supabase/info";
import {
  markOfflineSchema,
  noteSchema,
  paymentFiltersSchema,
  planUpsertSchema,
  refundSchema,
  reminderSchema,
  type MarkOfflineInput,
  type NoteInput,
  type PaymentFiltersInput,
  type PlanUpsertInput,
  type RefundInput,
  type ReminderInput,
} from "../schemas";
import type {
  AdminDashboardSummary,
  AdminTenantSummary,
  AuditResult,
  BillingSnapshot,
  PaymentDetail,
  PaymentsPageResult,
} from "../types";

const EDGE_BASE = `https://${projectId}.supabase.co/functions/v1/admin-console`;

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function withTenant(path: string, tenantId: string) {
  const url = new URL(`${EDGE_BASE}${path}`);
  url.searchParams.set("tenantId", tenantId);
  return url;
}

async function edgeRequest<T>(input: URL, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new Error("Session expirée, reconnectez-vous.");

  const headers = new Headers(init?.headers ?? {});
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(input, { ...init, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Erreur API admin console");
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/csv")) {
    return (await response.text()) as T;
  }

  return response.json() as Promise<T>;
}

export const adminConsoleClient = {
  async getTenants() {
    const url = new URL(`${EDGE_BASE}/tenants`);
    return edgeRequest<{ data: AdminTenantSummary[] }>(url);
  },

  async getSummary(tenantId: string) {
    return edgeRequest<AdminDashboardSummary>(withTenant("/summary", tenantId));
  },

  async getPayments(tenantId: string, filters: Partial<PaymentFiltersInput>) {
    const parsed = paymentFiltersSchema.partial().parse(filters);
    const url = withTenant("/payments", tenantId);
    Object.entries(parsed).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
    return edgeRequest<PaymentsPageResult>(url);
  },

  async exportPaymentsCsv(tenantId: string, filters: Partial<PaymentFiltersInput>) {
    const parsed = paymentFiltersSchema.partial().parse(filters);
    const url = withTenant("/payments/export", tenantId);
    Object.entries(parsed).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
    return edgeRequest<string>(url);
  },

  async getPaymentDetail(tenantId: string, paymentId: string) {
    return edgeRequest<PaymentDetail>(withTenant(`/payments/${paymentId}`, tenantId));
  },

  async refundPayment(tenantId: string, paymentId: string, payload: RefundInput) {
    const body = refundSchema.parse(payload);
    return edgeRequest<{ ok: true }>(withTenant(`/payments/${paymentId}/refund`, tenantId), {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async sendPaymentReminder(tenantId: string, paymentId: string, payload: ReminderInput) {
    const body = reminderSchema.parse(payload);
    return edgeRequest<{ ok: true }>(withTenant(`/payments/${paymentId}/remind`, tenantId), {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async markPaymentOffline(tenantId: string, paymentId: string, payload: MarkOfflineInput) {
    const body = markOfflineSchema.parse(payload);
    return edgeRequest<{ ok: true }>(withTenant(`/payments/${paymentId}/mark-offline`, tenantId), {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async cancelPayment(tenantId: string, paymentId: string) {
    return edgeRequest<{ ok: true }>(withTenant(`/payments/${paymentId}/cancel`, tenantId), {
      method: "POST",
    });
  },

  async savePaymentNote(tenantId: string, paymentId: string, payload: NoteInput) {
    const body = noteSchema.parse(payload);
    return edgeRequest<{ ok: true }>(withTenant(`/payments/${paymentId}/note`, tenantId), {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async getBilling(tenantId: string) {
    return edgeRequest<BillingSnapshot>(withTenant("/billing", tenantId));
  },

  async getAudit(tenantId: string) {
    return edgeRequest<AuditResult>(withTenant("/audit", tenantId));
  },

  async getPlans(tenantId: string) {
    return edgeRequest<BillingSnapshot>(withTenant("/billing", tenantId));
  },

  async upsertPlan(tenantId: string, payload: PlanUpsertInput) {
    const body = planUpsertSchema.parse(payload);
    return edgeRequest<{ ok: true }>(withTenant("/plans", tenantId), {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};