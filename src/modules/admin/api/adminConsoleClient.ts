import { supabase } from "@/lib/supabase";
import { projectId } from "../../../../utils/supabase/info";
import {
  markOfflineSchema,
  noteSchema,
  paymentFiltersSchema,
  planUpsertSchema,
  summaryFiltersSchema,
  refundSchema,
  reminderSchema,
  adminUserFiltersSchema,
  adminUserCreateSchema,
  adminUserUpdateSchema,
  suspendUserSchema,
  reactivateUserSchema,
  resetPasswordSchema,
  deleteUserSchema,
  importUsersCsvSchema,
  type MarkOfflineInput,
  type NoteInput,
  type PaymentFiltersInput,
  type PlanUpsertInput,
  type SummaryFiltersInput,
  type AdminUserFiltersInput,
  type AdminUserCreateInput,
  type AdminUserUpdateInput,
  type SuspendUserInput,
  type ReactivateUserInput,
  type ResetPasswordInput,
  type DeleteUserInput,
  type ImportUsersCsvInput,
  type RefundInput,
  type ReminderInput,
} from "../schemas";
import type {
  AdminDashboardSummary,
  AdminAuthUsersResult,
  AdminTenantSummary,
  AdminUserDetail,
  AdminUsersPageResult,
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

  async getSummary(tenantId: string, filters?: Partial<SummaryFiltersInput>) {
    const parsed = summaryFiltersSchema.partial().parse(filters ?? {});
    const url = withTenant("/summary", tenantId);
    Object.entries(parsed).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
    return edgeRequest<AdminDashboardSummary>(url);
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

  async getUsers(tenantId: string, filters: Partial<AdminUserFiltersInput>) {
    const parsed = adminUserFiltersSchema.partial().parse(filters);
    const url = withTenant("/users", tenantId);
    Object.entries(parsed).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
    return edgeRequest<AdminUsersPageResult>(url);
  },

  async getUnlinkedAuthUsers(tenantId: string) {
    return edgeRequest<AdminAuthUsersResult>(withTenant("/users/unlinked-auth", tenantId));
  },

  async getUserDetail(tenantId: string, userId: string) {
    return edgeRequest<AdminUserDetail>(withTenant(`/users/${userId}`, tenantId));
  },

  async createUser(tenantId: string, payload: AdminUserCreateInput) {
    const body = adminUserCreateSchema.parse(payload);
    return edgeRequest<{ ok: true; userId: string }>(withTenant("/users", tenantId), {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async updateUser(tenantId: string, userId: string, payload: AdminUserUpdateInput) {
    const body = adminUserUpdateSchema.parse(payload);
    return edgeRequest<{ ok: true }>(withTenant(`/users/${userId}`, tenantId), {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  async suspendUser(tenantId: string, userId: string, payload: SuspendUserInput) {
    const body = suspendUserSchema.parse(payload);
    return edgeRequest<{ ok: true }>(withTenant(`/users/${userId}/suspend`, tenantId), {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async reactivateUser(tenantId: string, userId: string, payload: ReactivateUserInput = {}) {
    const body = reactivateUserSchema.parse(payload);
    return edgeRequest<{ ok: true }>(withTenant(`/users/${userId}/reactivate`, tenantId), {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async resetPassword(tenantId: string, userId: string, payload: ResetPasswordInput = {}) {
    const body = resetPasswordSchema.parse(payload);
    return edgeRequest<{ ok: true }>(withTenant(`/users/${userId}/reset-password`, tenantId), {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async deleteUser(tenantId: string, userId: string, payload: DeleteUserInput = { hardDelete: false }) {
    const body = deleteUserSchema.parse(payload);
    return edgeRequest<{ ok: true }>(withTenant(`/users/${userId}`, tenantId), {
      method: "DELETE",
      body: JSON.stringify(body),
    });
  },

  async importUsersCsv(tenantId: string, payload: ImportUsersCsvInput) {
    const body = importUsersCsvSchema.parse(payload);
    return edgeRequest<{ ok: true; imported: number; failed: number; errors: string[] }>(withTenant("/users/import", tenantId), {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async exportUsersCsv(tenantId: string) {
    return edgeRequest<string>(withTenant("/users/export", tenantId));
  },
};