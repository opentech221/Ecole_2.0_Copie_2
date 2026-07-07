import { supabase } from "@/lib/supabase";
import { projectId } from "../../../../utils/supabase/info";
import { createNotificationSchema, notificationListFilterSchema } from "../schemas";
import type { NotificationCreateInput, NotificationListResult, NotificationTenant, NotificationUnreadCountResult } from "../types";

const EDGE_BASE = `https://${projectId}.supabase.co/functions/v1/notifications-server`;

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function edgeRequest<T>(url: URL, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new Error("Session expirée, reconnectez-vous.");

  const headers = new Headers(init?.headers ?? {});
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...init, headers });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error((body as { error?: string }).error ?? "Erreur API notifications");
  }

  return body as T;
}

function withTenant(path: string, tenantId?: string) {
  const url = new URL(`${EDGE_BASE}${path}`);
  if (tenantId) {
    url.searchParams.set("tenantId", tenantId);
  }
  return url;
}

export const notificationsClient = {
  async getTenants() {
    const url = new URL(`${EDGE_BASE}/api/tenants`);
    return edgeRequest<{ data: NotificationTenant[] }>(url);
  },

  async getNotifications(tenantId: string, filters: { page: number; pageSize: number; scope: "toutes" | "non_lues" | "archivees" | "critiques" }) {
    const parsed = notificationListFilterSchema.parse(filters);
    const url = withTenant("/api/notifications", tenantId);
    url.searchParams.set("page", String(parsed.page));
    url.searchParams.set("pageSize", String(parsed.pageSize));
    url.searchParams.set("scope", parsed.scope);
    return edgeRequest<NotificationListResult>(url);
  },

  async getUnreadCount(tenantId?: string) {
    const url = withTenant("/api/notifications/unread-count", tenantId);
    return edgeRequest<NotificationUnreadCountResult>(url);
  },

  async markAsRead(tenantId: string, notificationId: string) {
    const url = withTenant(`/api/notifications/${notificationId}/read`, tenantId);
    return edgeRequest<{ ok: true }>(url, { method: "PATCH" });
  },

  async markAllAsRead(tenantId: string) {
    const url = withTenant("/api/notifications/read-all", tenantId);
    return edgeRequest<{ ok: true; updated: number }>(url, { method: "PATCH" });
  },

  async archive(tenantId: string, notificationId: string) {
    const url = withTenant(`/api/notifications/${notificationId}/archive`, tenantId);
    return edgeRequest<{ ok: true }>(url, { method: "PATCH" });
  },

  async create(input: NotificationCreateInput) {
    const payload = createNotificationSchema.parse(input);
    const url = withTenant("/api/notifications", payload.tenantId);
    return edgeRequest<{ ok: true; id: string }>(url, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
