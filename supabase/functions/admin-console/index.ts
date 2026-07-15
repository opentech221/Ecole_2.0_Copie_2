import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { z } from "npm:zod";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

app.use("*", logger(console.log));

const defaultOrigins = [
  "*.github.dev",
  "*.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://ecole-2-0-copie-2-opentechsn.vercel.app",
];

const envOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const allowedOriginPatterns = Array.from(new Set([...defaultOrigins, ...envOrigins]));

function isOriginAllowed(origin: string) {
  if (!origin) return true;

  return allowedOriginPatterns.some((pattern) => {
    if (pattern === "*" || pattern === origin) return true;
    if (!pattern.startsWith("*.")) return false;
    try {
      const hostname = new URL(origin).hostname;
      const suffix = pattern.slice(2);
      return hostname === suffix || hostname.endsWith(`.${suffix}`);
    } catch {
      return false;
    }
  });
}

app.use(
  "/*",
  cors({
    origin: (origin) => (isOriginAllowed(origin) ? origin : false),
    allowHeaders: ["Content-Type", "Authorization", "apikey"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length", "Content-Disposition"],
    maxAge: 600,
  }),
);

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function getClients(authHeader: string | undefined) {
  const caller = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader ?? "" } },
  });
  const service = createClient(supabaseUrl, supabaseServiceRoleKey);
  return { caller, service };
}

function registerGet(path: string, handler: Parameters<typeof app.get>[1]) {
  app.get(path, handler);
  app.get(`/admin-console${path}`, handler);
}

function registerPost(path: string, handler: Parameters<typeof app.post>[1]) {
  app.post(path, handler);
  app.post(`/admin-console${path}`, handler);
}

function registerPatch(path: string, handler: Parameters<typeof app.patch>[1]) {
  app.patch(path, handler);
  app.patch(`/admin-console${path}`, handler);
}

function registerDelete(path: string, handler: Parameters<typeof app.delete>[1]) {
  app.delete(path, handler);
  app.delete(`/admin-console${path}`, handler);
}

type ConsoleRole = "super_admin" | "admin_finance" | "support" | "owner" | "director";

type GuardResult =
  | { ok: false; status: number; message: string }
  | {
      ok: true;
      userId: string;
      tenantId: string;
      role: ConsoleRole;
      service: ReturnType<typeof createClient>;
      caller: ReturnType<typeof createClient>;
      accessibleTenantIds: string[];
    };

const tenantQuerySchema = z.object({
  tenantId: z.string().uuid(),
});

const paymentFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().default(""),
  status: z.enum(["all", "pending", "paid", "failed", "refunded", "partially_refunded", "disputed"]).default("all"),
  paymentMethod: z.string().trim().default("all"),
  reconciliationStatus: z.enum(["all", "matched", "unmatched", "manual_review"]).default("all"),
});

const summaryFiltersSchema = z.object({
  period: z.enum(["7d", "30d", "90d", "12m"]).default("30d"),
  planId: z.string().uuid().optional(),
  country: z.string().trim().min(2).max(3).optional(),
  channel: z.string().trim().min(2).max(80).optional(),
});

const userListFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().default(""),
  status: z.enum(["all", "active", "suspended", "pending_invite", "deleted"]).default("all"),
  role: z.enum(["all", "owner", "super_admin", "admin_finance", "support", "director"]).default("all"),
  sortBy: z.enum(["created_at", "last_seen_at", "full_name", "email", "status"]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const userCreateSchema = z.object({
  email: z.string().trim().email(),
  fullName: z.string().trim().min(2).max(160),
  roleCode: z.enum(["owner", "super_admin", "admin_finance", "support", "director"]).default("support"),
  status: z.enum(["active", "suspended", "pending_invite"]).default("active"),
  countryCode: z.string().trim().min(2).max(3).default("SN"),
  acquisitionChannel: z.string().trim().min(2).max(80).default("direct"),
  password: z.string().min(8).optional(),
  sendInvite: z.boolean().default(true),
});

const userUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(160).optional(),
  roleCode: z.enum(["owner", "super_admin", "admin_finance", "support", "director"]).optional(),
  status: z.enum(["active", "suspended", "pending_invite", "deleted"]).optional(),
  countryCode: z.string().trim().min(2).max(3).optional(),
  acquisitionChannel: z.string().trim().min(2).max(80).optional(),
  suspendedReason: z.string().trim().min(3).max(240).optional(),
});

const suspendUserSchema = z.object({
  reason: z.string().trim().min(3).max(240),
});

const reactivateUserSchema = z.object({
  reason: z.string().trim().min(3).max(240).optional(),
});

const resetPasswordSchema = z.object({
  redirectTo: z.string().trim().url().optional(),
});

const deleteUserSchema = z.object({
  hardDelete: z.boolean().default(false),
  reason: z.string().trim().min(3).max(240).optional(),
});

const refundSchema = z.object({
  amountCents: z.number().int().positive(),
  reason: z.string().trim().min(3).max(240),
});

const reminderSchema = z.object({
  channel: z.enum(["email", "in_app", "sms"]).default("email"),
  message: z.string().trim().min(5).max(500).optional(),
});

const markOfflineSchema = z.object({
  amountCents: z.number().int().positive().optional(),
  note: z.string().trim().min(3).max(240),
});

const noteSchema = z.object({
  note: z.string().trim().min(2).max(1000),
});

const planUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(2).max(80),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).nullable().default(null),
  billingInterval: z.enum(["monthly", "annual"]),
  amountCents: z.number().int().min(0),
  currency: z.string().trim().length(3).default("XOF"),
  trialDays: z.number().int().min(0).max(365).default(0),
  taxRateBasisPoints: z.number().int().min(0).max(10000).default(0),
  studentLimit: z.number().int().positive().nullable().default(null),
  active: z.boolean().default(true),
  features: z.array(z.string().trim().min(1)).default([]),
});

function logStructured(message: string, context: Record<string, unknown>) {
  console.log(JSON.stringify({ message, ...context }));
}

function chooseRole(roles: string[], profileRole: string | null | undefined): ConsoleRole | null {
  const priority: ConsoleRole[] = ["owner", "super_admin", "admin_finance", "support", "director"];
  for (const role of priority) {
    if (roles.includes(role)) return role;
  }
  if (profileRole === "director") return "director";
  return null;
}

function canManageUsers(role: ConsoleRole) {
  return ["owner", "super_admin", "director"].includes(role);
}

function canSeeRawPii(role: ConsoleRole) {
  return role !== "support";
}

function maskEmail(value: string | null | undefined) {
  if (!value) return null;
  const [local, domain] = value.split("@");
  if (!local || !domain) return "***";
  if (local.length <= 2) return `**@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

function daysFromPeriod(period: "7d" | "30d" | "90d" | "12m") {
  switch (period) {
    case "7d":
      return 7;
    case "90d":
      return 90;
    case "12m":
      return 365;
    default:
      return 30;
  }
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return [] as Array<Record<string, string>>;
  const headers = lines[0].split(",").map((item) => item.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((item) => item.trim());
    return headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = values[index] ?? "";
      return acc;
    }, {});
  });
}

async function requireConsoleAccess(request: Request): Promise<GuardResult> {
  const authHeader = request.headers.get("Authorization") ?? undefined;
  const { caller, service } = getClients(authHeader);
  const { data: authData, error: authError } = await caller.auth.getUser();

  if (authError || !authData.user) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  const tenantParsed = tenantQuerySchema.safeParse({ tenantId: new URL(request.url).searchParams.get("tenantId") });
  if (!tenantParsed.success) {
    return { ok: false, status: 400, message: "tenantId requis" };
  }

  const userId = authData.user.id;

  const [{ data: roleRows, error: rolesError }, { data: profile, error: profileError }] = await Promise.all([
    service
      .from("user_roles")
      .select("tenant_id, role_code")
      .eq("user_id", userId),
    service
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  if (rolesError || profileError) {
    return { ok: false, status: 500, message: "Impossible de résoudre les permissions" };
  }

  const accessibleTenantIds = Array.from(new Set((roleRows ?? []).map((row) => row.tenant_id)));
  const scopedRoles = (roleRows ?? []).filter((row) => row.tenant_id === tenantParsed.data.tenantId).map((row) => row.role_code);
  let role = chooseRole(scopedRoles, profile?.role);

  if (!role && profile?.role === "director") {
    const { data: firstTenant } = await service.from("tenants").select("id").limit(1).maybeSingle();
    if (firstTenant?.id === tenantParsed.data.tenantId) {
      role = "director";
    }
  }

  if (!role) {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  return {
    ok: true,
    userId,
    tenantId: tenantParsed.data.tenantId,
    role,
    service,
    caller,
    accessibleTenantIds,
  };
}

async function listAccessibleTenants(authHeader: string | undefined) {
  const { caller, service } = getClients(authHeader);
  const { data: authData } = await caller.auth.getUser();
  if (!authData.user) return [];

  const [{ data: roles }, { data: profile }] = await Promise.all([
    service.from("user_roles").select("tenant_id").eq("user_id", authData.user.id),
    service.from("profiles").select("role").eq("id", authData.user.id).maybeSingle(),
  ]);

  const tenantIds = Array.from(new Set((roles ?? []).map((row) => row.tenant_id)));
  if (tenantIds.length > 0) {
    const { data } = await service.from("tenants").select("id, name, slug, status, currency").in("id", tenantIds);
    return data ?? [];
  }

  if (profile?.role === "director") {
    const { data } = await service.from("tenants").select("id, name, slug, status, currency").limit(10);
    return data ?? [];
  }

  return [];
}

async function appendAuditLog(
  service: ReturnType<typeof createClient>,
  input: {
    tenantId: string;
    actorUserId: string;
    actorRole: ConsoleRole;
    action: string;
    entityType: string;
    entityId?: string | null;
    severity?: "info" | "warn" | "critical";
    metadata?: Record<string, unknown>;
    ipAddress?: string | null;
    userAgent?: string | null;
  },
) {
  await service.from("audit_logs").insert({
    tenant_id: input.tenantId,
    actor_user_id: input.actorUserId,
    actor_role: input.actorRole,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    severity: input.severity ?? "info",
    metadata: input.metadata ?? {},
    ip_address: input.ipAddress ?? null,
    user_agent: input.userAgent ?? null,
  });
}

function cents(value: number | null | undefined) {
  return Number(value ?? 0);
}

async function refreshInvoiceBalance(service: ReturnType<typeof createClient>, invoiceId: string | null) {
  if (!invoiceId) return;

  const [{ data: invoice }, { data: payments }] = await Promise.all([
    service.from("invoices").select("total_cents").eq("id", invoiceId).maybeSingle(),
    service
      .from("payments")
      .select("id, amount_cents, status")
      .eq("invoice_id", invoiceId)
      .in("status", ["paid", "refunded", "partially_refunded"]),
  ]);

  const paymentIds = (payments ?? []).map((row) => row.id);
  const { data: refunds } = paymentIds.length > 0
    ? await service
        .from("refunds")
        .select("payment_id, amount_cents, status")
        .in("payment_id", paymentIds)
    : { data: [] as Array<{ payment_id: string; amount_cents: number; status: string }> };

  const paidCents = (payments ?? []).reduce((sum, row) => {
    const paymentAmount = cents(row.amount_cents);
    if (row.status === "refunded") return sum;
    return sum + paymentAmount;
  }, 0);

  const refundedCents = (refunds ?? []).reduce((sum, row) => sum + (row.status === "succeeded" ? cents(row.amount_cents) : 0), 0);
  const netPaidCents = Math.max(0, paidCents - refundedCents);
  const totalCents = cents(invoice?.total_cents);
  const balanceCents = Math.max(0, totalCents - netPaidCents);
  const status = balanceCents === 0 ? "paid" : netPaidCents > 0 ? "open" : "open";

  await service.from("invoices").update({ paid_cents: netPaidCents, balance_cents: balanceCents, status }).eq("id", invoiceId);
}

async function getRevenueSeries(service: ReturnType<typeof createClient>, tenantIds: string[], tenantId: string, days: number) {
  const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await service
    .from("payments")
    .select("tenant_id, amount_cents, status, created_at")
    .in("tenant_id", tenantIds.length > 0 ? tenantIds : [tenantId])
    .gte("created_at", threshold)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  const buckets = new Map<string, { paidAmountCents: number; failedAmountCents: number }>();
  for (const row of data ?? []) {
    const label = new Date(row.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: days > 40 ? "short" : "2-digit" });
    const current = buckets.get(label) ?? { paidAmountCents: 0, failedAmountCents: 0 };
    if (row.status === "paid") current.paidAmountCents += cents(row.amount_cents);
    if (row.status === "failed") current.failedAmountCents += cents(row.amount_cents);
    buckets.set(label, current);
  }

  return Array.from(buckets.entries()).map(([label, values]) => ({ label, ...values }));
}

async function getMonthlySeries(service: ReturnType<typeof createClient>, tenantIds: string[], tenantId: string) {
  const threshold = new Date();
  threshold.setMonth(threshold.getMonth() - 11);
  const { data } = await service
    .from("payments")
    .select("tenant_id, amount_cents, status, created_at")
    .in("tenant_id", tenantIds.length > 0 ? tenantIds : [tenantId])
    .gte("created_at", threshold.toISOString())
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  const buckets = new Map<string, { paidAmountCents: number; failedAmountCents: number }>();
  for (const row of data ?? []) {
    const date = new Date(row.created_at);
    const label = date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    const current = buckets.get(label) ?? { paidAmountCents: 0, failedAmountCents: 0 };
    if (row.status === "paid") current.paidAmountCents += cents(row.amount_cents);
    if (row.status === "failed") current.failedAmountCents += cents(row.amount_cents);
    buckets.set(label, current);
  }

  return Array.from(buckets.entries()).map(([label, values]) => ({ label, ...values }));
}

async function getSummaryPayload(guard: Extract<GuardResult, { ok: true }>, params: URLSearchParams) {
  const { service, tenantId, accessibleTenantIds, role } = guard;
  const tenantScope = accessibleTenantIds.length > 0 ? accessibleTenantIds : [tenantId];
  const filters = summaryFiltersSchema.parse({
    period: params.get("period") ?? undefined,
    planId: params.get("planId") ?? undefined,
    country: params.get("country") ?? undefined,
    channel: params.get("channel") ?? undefined,
  });
  const periodDays = daysFromPeriod(filters.period);
  const periodThreshold = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

  const [
    { data: tenant },
    { data: payments },
    { data: subscriptions },
    { data: invoices },
    { data: classes },
    { data: webhooks },
    { data: refunds },
    { data: tenantUsers },
    { data: kpiEvents },
  ] = await Promise.all([
    service.from("tenants").select("id, name, slug, status, currency").eq("id", tenantId).single(),
    service
      .from("payments")
      .select("id, tenant_id, plan_id, amount_cents, status, payment_method, class_id, created_at")
      .in("tenant_id", tenantScope)
      .is("deleted_at", null),
    service
      .from("subscriptions")
      .select("id, tenant_id, plan_id, amount_cents, billing_cycle, status, current_period_end, created_at")
      .in("tenant_id", tenantScope)
      .is("deleted_at", null),
    service
      .from("invoices")
      .select("id, tenant_id, total_cents, paid_cents, balance_cents, status, due_date")
      .in("tenant_id", tenantScope)
      .is("deleted_at", null),
    service
      .from("students")
      .select("tenant_id, class_id")
      .in("tenant_id", tenantScope)
      .is("deleted_at", null),
    service
      .from("webhook_events")
      .select("id, event_type, processing_status, error_message, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(4),
    service
      .from("refunds")
      .select("tenant_id, amount_cents, status, created_at")
      .in("tenant_id", tenantScope),
    service
      .from("tenant_user_accounts")
      .select("tenant_id, user_id, status, country_code, acquisition_channel, created_at, last_seen_at, deleted_at")
      .in("tenant_id", tenantScope),
    service
      .from("kpi_events")
      .select("tenant_id, user_id, event_name, amount_cents, occurred_at")
      .in("tenant_id", tenantScope)
      .gte("occurred_at", new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const scopedUsers = (tenantUsers ?? []).filter((row) => {
    if (filters.country && row.country_code?.toUpperCase() !== filters.country.toUpperCase()) return false;
    if (filters.channel && row.acquisition_channel?.toLowerCase() !== filters.channel.toLowerCase()) return false;
    return true;
  });
  const scopedUserIds = new Set(scopedUsers.map((row) => row.user_id));

  const paymentRows = (payments ?? []).filter((row) => {
    if (filters.planId && row.plan_id !== filters.planId) return false;
    return true;
  });
  const subscriptionRows = (subscriptions ?? []).filter((row) => {
    if (filters.planId && row.plan_id !== filters.planId) return false;
    return true;
  });

  const currentMonthPayments = paymentRows.filter((payment) => {
    const createdAt = new Date(payment.created_at);
    return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
  });
  const previousMonthPayments = paymentRows.filter((payment) => {
    const createdAt = new Date(payment.created_at);
    return createdAt.getMonth() === previousMonthDate.getMonth() && createdAt.getFullYear() === previousMonthDate.getFullYear();
  });

  const paidAmountMonth = currentMonthPayments.reduce((sum, payment) => sum + (payment.status === "paid" ? cents(payment.amount_cents) : 0), 0);
  const paidAmountPreviousMonth = previousMonthPayments.reduce((sum, payment) => sum + (payment.status === "paid" ? cents(payment.amount_cents) : 0), 0);
  const failedAmountMonth = currentMonthPayments.reduce((sum, payment) => sum + (payment.status === "failed" ? cents(payment.amount_cents) : 0), 0);
  const unpaidAmount = (invoices ?? []).reduce((sum, invoice) => sum + cents(invoice.balance_cents), 0);
  const totalInvoiced = (invoices ?? []).reduce((sum, invoice) => sum + cents(invoice.total_cents), 0);
  const totalCollected = (invoices ?? []).reduce((sum, invoice) => sum + cents(invoice.paid_cents), 0);
  const refundedAmountMonth = (refunds ?? []).reduce((sum, refund) => {
    if (refund.status !== "succeeded") return sum;
    const createdAt = new Date(refund.created_at);
    if (createdAt.getMonth() !== currentMonth || createdAt.getFullYear() !== currentYear) return sum;
    return sum + cents(refund.amount_cents);
  }, 0);
  const netRevenueMonth = Math.max(0, paidAmountMonth - refundedAmountMonth);

  const activeSubs = subscriptionRows.filter((sub) => ["trialing", "active", "past_due"].includes(sub.status));
  const churnedSubs = subscriptionRows.filter((sub) => ["canceled", "expired"].includes(sub.status));
  const mrr = activeSubs.reduce((sum, sub) => sum + (sub.billing_cycle === "monthly" ? cents(sub.amount_cents) : Math.round(cents(sub.amount_cents) / 12)), 0);
  const arr = mrr * 12;
  const churnRate = activeSubs.length + churnedSubs.length === 0 ? 0 : (churnedSubs.length / (activeSubs.length + churnedSubs.length)) * 100;
  const estimatedLtv = churnRate === 0 ? mrr * 18 : Math.round(mrr / Math.max(churnRate / 100, 0.01));
  const recoveryRate = totalInvoiced === 0 ? 0 : (totalCollected / totalInvoiced) * 100;
  const successPaymentsCount = currentMonthPayments.filter((payment) => payment.status === "paid").length;
  const failedPaymentsCount = currentMonthPayments.filter((payment) => payment.status === "failed").length;
  const momGrowth = paidAmountPreviousMonth === 0 ? 0 : ((paidAmountMonth - paidAmountPreviousMonth) / paidAmountPreviousMonth) * 100;

  const activeUsers = scopedUsers.filter((row) => row.status === "active" && !row.deleted_at).length;
  const newSignups = scopedUsers.filter((row) => new Date(row.created_at) >= periodThreshold).length;

  const filteredEvents = (kpiEvents ?? []).filter((event) => {
    if (new Date(event.occurred_at) < periodThreshold) return false;
    if (event.user_id && scopedUserIds.size > 0 && !scopedUserIds.has(event.user_id)) return false;
    return true;
  });
  const signupStarted = filteredEvents.filter((event) => event.event_name === "signup_started").length;
  const signupCompleted = filteredEvents.filter((event) => event.event_name === "signup_completed").length;
  const trialStarted = filteredEvents.filter((event) => event.event_name === "trial_started").length;
  const subscriptionsActivated = filteredEvents.filter((event) => event.event_name === "subscription_activated").length;
  const paymentsSuccess = filteredEvents.filter((event) => event.event_name === "payment_success").length;
  const churnEvents = filteredEvents.filter((event) => ["subscription_canceled", "churned"].includes(event.event_name)).length;
  const conversionRate = signupStarted === 0 ? 0 : (signupCompleted / signupStarted) * 100;
  const arpu = activeUsers === 0 ? 0 : Math.round(netRevenueMonth / activeUsers);
  const aov = successPaymentsCount === 0 ? 0 : Math.round(paidAmountMonth / successPaymentsCount);

  const revenue7d = await getRevenueSeries(service, tenantScope, tenantId, 7);
  const revenue30d = await getRevenueSeries(service, tenantScope, tenantId, 30);
  const revenue12m = await getMonthlySeries(service, tenantScope, tenantId);

  const monthlyPaidValues = revenue12m.map((item) => item.paidAmountCents).filter((value) => value > 0);
  const recentAverage = monthlyPaidValues.length === 0
    ? 0
    : Math.round(monthlyPaidValues.slice(-3).reduce((sum, value) => sum + value, 0) / Math.min(3, monthlyPaidValues.length));
  const forecast = [3, 6, 12].map((horizon) => ({
    horizonMonths: horizon,
    projectedRevenueCents: recentAverage * horizon,
  }));

  const byTenantMap = new Map<string, number>();
  for (const payment of paymentRows) {
    byTenantMap.set(payment.tenant_id, (byTenantMap.get(payment.tenant_id) ?? 0) + cents(payment.amount_cents));
  }
  const { data: tenantNames } = await service.from("tenants").select("id, name").in("id", tenantScope);
  const tenantNameMap = new Map((tenantNames ?? []).map((item) => [item.id, item.name]));

  const byLevelMap = new Map<string, number>();
  for (const student of classes ?? []) {
    const key = student.class_id ?? "Non classé";
    byLevelMap.set(key, (byLevelMap.get(key) ?? 0) + 1);
  }

  const byMethodMap = new Map<string, number>();
  for (const payment of paymentRows) {
    byMethodMap.set(payment.payment_method, (byMethodMap.get(payment.payment_method) ?? 0) + cents(payment.amount_cents));
  }

  const acquisitionMap = new Map<string, number>();
  for (const user of scopedUsers) {
    const channel = user.acquisition_channel || "direct";
    acquisitionMap.set(channel, (acquisitionMap.get(channel) ?? 0) + 1);
  }

  const cohortByUser = new Map<string, { cohortMonth: string; activity: Set<string> }>();
  for (const event of kpiEvents ?? []) {
    if (!event.user_id) continue;
    if (scopedUserIds.size > 0 && !scopedUserIds.has(event.user_id)) continue;
    const activityMonth = new Date(event.occurred_at).toISOString().slice(0, 7);
    const current = cohortByUser.get(event.user_id) ?? { cohortMonth: "", activity: new Set<string>() };
    if ((event.event_name === "signup_completed" || event.event_name === "subscription_activated") && (!current.cohortMonth || activityMonth < current.cohortMonth)) {
      current.cohortMonth = activityMonth;
    }
    current.activity.add(activityMonth);
    cohortByUser.set(event.user_id, current);
  }

  const cohortsMap = new Map<string, Map<string, number>>();
  cohortByUser.forEach(({ cohortMonth, activity }) => {
    if (!cohortMonth) return;
    const bucket = cohortsMap.get(cohortMonth) ?? new Map<string, number>();
    activity.forEach((month) => {
      bucket.set(month, (bucket.get(month) ?? 0) + 1);
    });
    cohortsMap.set(cohortMonth, bucket);
  });

  const cohorts = Array.from(cohortsMap.entries()).flatMap(([cohortMonth, activityMap]) => {
    const base = activityMap.get(cohortMonth) ?? 1;
    return Array.from(activityMap.entries()).map(([activityMonth, users]) => ({
      cohortMonth,
      activityMonth,
      activeUsers: users,
      retentionPct: Math.round((users / base) * 100),
    }));
  });

  const expiringSubscriptions = subscriptionRows.filter((sub) => {
    if (!sub.current_period_end) return false;
    const end = new Date(sub.current_period_end).getTime();
    return end > Date.now() && end <= Date.now() + 1000 * 60 * 60 * 24 * 30;
  });

  const alerts = [
    ...(failedPaymentsCount >= 3
      ? [{ id: crypto.randomUUID(), title: "Pic d’échecs paiements", description: `${failedPaymentsCount} échecs ce mois-ci sur le tenant sélectionné.`, severity: "critical" as const, category: "payments" as const, createdAt: now.toISOString() }]
      : []),
    ...(momGrowth < -15
      ? [{ id: crypto.randomUUID(), title: "Décroissance mensuelle", description: `La croissance MoM est en baisse (${momGrowth.toFixed(1)}%).`, severity: "warn" as const, category: "payments" as const, createdAt: now.toISOString() }]
      : []),
    ...(churnEvents > 0
      ? [{ id: crypto.randomUUID(), title: "Hausse churn détectée", description: `${churnEvents} événement(s) de churn sur la période ${filters.period}.`, severity: "warn" as const, category: "subscriptions" as const, createdAt: now.toISOString() }]
      : []),
    ...(expiringSubscriptions.length > 0
      ? [{ id: crypto.randomUUID(), title: "Abonnements expirants", description: `${expiringSubscriptions.length} abonnement(s) arrivent à échéance sous 30 jours.`, severity: "warn" as const, category: "subscriptions" as const, createdAt: now.toISOString() }]
      : []),
    ...(webhooks ?? []).filter((item) => item.processing_status === "failed").map((item) => ({
      id: item.id,
      title: "Webhook en erreur",
      description: item.error_message ?? item.event_type,
      severity: "warn" as const,
      category: "webhooks" as const,
      createdAt: item.created_at,
    })),
  ];

  return {
    tenant,
    userRole: role,
    filtersApplied: {
      period: filters.period,
      planId: filters.planId ?? null,
      country: filters.country ?? null,
      channel: filters.channel ?? null,
    },
    kpis: {
      mrr: { label: "MRR", value: mrr, currency: tenant.currency, tone: "good" as const },
      arr: { label: "ARR", value: arr, currency: tenant.currency, tone: "neutral" as const },
      monthRevenue: { label: "Revenus du mois", value: paidAmountMonth, currency: tenant.currency, tone: "good" as const },
      successPayments: { label: "Paiements réussis", value: successPaymentsCount, tone: "good" as const },
      failedPayments: { label: "Paiements échoués", value: failedPaymentsCount, tone: failedPaymentsCount > 0 ? "warn" : "neutral" as const },
      unpaid: { label: "Impayés", value: unpaidAmount, currency: tenant.currency, tone: unpaidAmount > 0 ? "warn" : "good" as const },
      recoveryRate: { label: "Taux recouvrement", value: recoveryRate, tone: recoveryRate < 70 ? "warn" : "good" as const },
      churnRate: { label: "Churn", value: churnRate, tone: churnRate > 8 ? "warn" : "neutral" as const },
      estimatedLtv: { label: "LTV estimée", value: estimatedLtv, currency: tenant.currency, tone: "neutral" as const },
    },
    charts: {
      revenue7d,
      revenue30d,
      revenue12m,
      byTenant: Array.from(byTenantMap.entries()).map(([key, value]) => ({ key, label: tenantNameMap.get(key) ?? key, value })),
      byLevel: Array.from(byLevelMap.entries()).map(([key, value]) => ({ key, label: key, value })),
      byPaymentMethod: Array.from(byMethodMap.entries()).map(([key, value]) => ({ key, label: key, value })),
    },
    business: {
      kpis: {
        activeUsers,
        newSignups,
        grossRevenue: paidAmountMonth,
        netRevenue: netRevenueMonth,
        conversionRate,
        momGrowth,
        arpu,
        aov,
      },
      funnel: [
        { stage: "signup_started", value: signupStarted },
        { stage: "signup_completed", value: signupCompleted },
        { stage: "trial_started", value: trialStarted },
        { stage: "subscription_activated", value: subscriptionsActivated },
        { stage: "payment_success", value: paymentsSuccess },
      ],
      cohorts,
      forecast,
      acquisition: Array.from(acquisitionMap.entries()).map(([channel, users]) => ({ channel, users })),
    },
    alerts,
  };
}

registerGet("/health", (c) => c.json({ status: "ok" }));

registerGet("/tenants", async (c) => {
  const data = await listAccessibleTenants(c.req.header("Authorization"));
  return c.json({ data });
});

registerGet("/summary", async (c) => {
  const guard = await requireConsoleAccess(c.req.raw);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);
  const payload = await getSummaryPayload(guard, new URL(c.req.url).searchParams);
  return c.json(payload);
});

registerGet("/payments", async (c) => {
  const guard = await requireConsoleAccess(c.req.raw);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);

  const filters = paymentFiltersSchema.parse(Object.fromEntries(new URL(c.req.url).searchParams.entries()));
  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  let query = guard.service
    .from("payments")
    .select("id, tenant_id, student_id, invoice_id, subscription_id, amount_cents, currency, status, payment_method, provider, reconciliation_status, created_at, paid_at, failure_reason, parent_name, parent_email, class_id", { count: "exact" })
    .eq("tenant_id", guard.tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.paymentMethod !== "all") query = query.eq("payment_method", filters.paymentMethod);
  if (filters.reconciliationStatus !== "all") query = query.eq("reconciliation_status", filters.reconciliationStatus);
  if (filters.search) {
    query = query.or(`parent_name.ilike.%${filters.search}%,parent_email.ilike.%${filters.search}%`);
  }

  const { data: payments, count, error } = await query;
  if (error) return c.json({ error: error.message }, 400);

  const studentIds = Array.from(new Set((payments ?? []).map((item) => item.student_id).filter(Boolean)));
  const invoiceIds = Array.from(new Set((payments ?? []).map((item) => item.invoice_id).filter(Boolean)));

  const [{ data: students }, { data: invoices }, { data: tenant }] = await Promise.all([
    studentIds.length > 0
      ? guard.service.from("students").select("id, nom, prenom").in("id", studentIds)
      : Promise.resolve({ data: [] as Array<{ id: string; nom: string; prenom: string }> }),
    invoiceIds.length > 0
      ? guard.service.from("invoices").select("id, invoice_number").in("id", invoiceIds)
      : Promise.resolve({ data: [] as Array<{ id: string; invoice_number: string }> }),
    guard.service.from("tenants").select("name").eq("id", guard.tenantId).single(),
  ]);

  const studentMap = new Map((students ?? []).map((student) => [student.id, `${student.prenom} ${student.nom}`.trim()]));
  const invoiceMap = new Map((invoices ?? []).map((invoice) => [invoice.id, invoice.invoice_number]));

  return c.json({
    rows: (payments ?? []).map((payment) => ({
      id: payment.id,
      tenantId: payment.tenant_id,
      tenantName: tenant?.name ?? "",
      studentId: payment.student_id,
      studentName: studentMap.get(payment.student_id ?? "") ?? "Élève non lié",
      parentName: payment.parent_name,
      parentEmail: payment.parent_email,
      classId: payment.class_id,
      invoiceId: payment.invoice_id,
      invoiceNumber: invoiceMap.get(payment.invoice_id ?? "") ?? null,
      subscriptionId: payment.subscription_id,
      amountCents: payment.amount_cents,
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.payment_method,
      provider: payment.provider,
      reconciliationStatus: payment.reconciliation_status,
      createdAt: payment.created_at,
      paidAt: payment.paid_at,
      failureReason: payment.failure_reason,
    })),
    page: filters.page,
    pageSize: filters.pageSize,
    total: count ?? 0,
  });
});

registerGet("/payments/export", async (c) => {
  const guard = await requireConsoleAccess(c.req.raw);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);
  const filters = paymentFiltersSchema.parse(Object.fromEntries(new URL(c.req.url).searchParams.entries()));

  let query = guard.service
    .from("payments")
    .select("id, amount_cents, currency, status, payment_method, provider, reconciliation_status, parent_name, parent_email, class_id, created_at")
    .eq("tenant_id", guard.tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.paymentMethod !== "all") query = query.eq("payment_method", filters.paymentMethod);
  if (filters.reconciliationStatus !== "all") query = query.eq("reconciliation_status", filters.reconciliationStatus);
  if (filters.search) query = query.or(`parent_name.ilike.%${filters.search}%,parent_email.ilike.%${filters.search}%`);

  const { data, error } = await query.limit(500);
  if (error) return c.json({ error: error.message }, 400);

  const rows = [
    ["id", "montant_cents", "devise", "statut", "methode", "provider", "reconciliation", "parent", "email", "classe", "created_at"],
    ...(data ?? []).map((row) => [
      row.id,
      String(row.amount_cents),
      row.currency,
      row.status,
      row.payment_method,
      row.provider,
      row.reconciliation_status,
      row.parent_name ?? "",
      row.parent_email ?? "",
      row.class_id ?? "",
      row.created_at,
    ]),
  ];

  const csv = rows.map((row) => row.map((item) => `"${String(item).replaceAll('"', '""')}"`).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=payments-export.csv",
    },
  });
});

registerGet("/payments/:paymentId", async (c) => {
  const guard = await requireConsoleAccess(c.req.raw);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);
  const paymentId = c.req.param("paymentId");

  const { data: payment, error } = await guard.service
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .eq("tenant_id", guard.tenantId)
    .maybeSingle();

  if (error || !payment) return c.json({ error: "Paiement introuvable" }, 404);

  const [{ data: student }, { data: invoice }, { data: subscription }, { data: attempts }, { data: refunds }, { data: tenant }] = await Promise.all([
    payment.student_id ? guard.service.from("students").select("nom, prenom").eq("id", payment.student_id).maybeSingle() : Promise.resolve({ data: null }),
    payment.invoice_id ? guard.service.from("invoices").select("invoice_number, status").eq("id", payment.invoice_id).maybeSingle() : Promise.resolve({ data: null }),
    payment.subscription_id ? guard.service.from("subscriptions").select("status").eq("id", payment.subscription_id).maybeSingle() : Promise.resolve({ data: null }),
    guard.service.from("payment_attempts").select("id, attempt_number, provider, status, response_code, response_message, attempted_at").eq("payment_id", paymentId).order("attempted_at", { ascending: false }),
    guard.service.from("refunds").select("id, amount_cents, status, reason, created_at").eq("payment_id", paymentId).order("created_at", { ascending: false }),
    guard.service.from("tenants").select("name").eq("id", guard.tenantId).single(),
  ]);

  return c.json({
    id: payment.id,
    tenantId: payment.tenant_id,
    tenantName: tenant?.name ?? "",
    studentId: payment.student_id,
    studentName: student ? `${student.prenom} ${student.nom}`.trim() : "Élève non lié",
    parentName: payment.parent_name,
    parentEmail: payment.parent_email,
    classId: payment.class_id,
    invoiceId: payment.invoice_id,
    invoiceNumber: invoice?.invoice_number ?? null,
    subscriptionId: payment.subscription_id,
    amountCents: payment.amount_cents,
    currency: payment.currency,
    status: payment.status,
    paymentMethod: payment.payment_method,
    provider: payment.provider,
    reconciliationStatus: payment.reconciliation_status,
    createdAt: payment.created_at,
    paidAt: payment.paid_at,
    failureReason: payment.failure_reason,
    subscriptionStatus: subscription?.status ?? null,
    invoiceStatus: invoice?.status ?? null,
    internalNotes: payment.internal_notes,
    attempts: (attempts ?? []).map((item) => ({
      id: item.id,
      attemptNumber: item.attempt_number,
      provider: item.provider,
      status: item.status,
      responseCode: item.response_code,
      responseMessage: item.response_message,
      attemptedAt: item.attempted_at,
    })),
    refunds: refunds ?? [],
  });
});

registerPost("/payments/:paymentId/refund", async (c) => {
  const guard = await requireConsoleAccess(c.req.raw);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);
  if (!["owner", "super_admin", "admin_finance", "director"].includes(guard.role)) {
    return c.json({ error: "Action non autorisée" }, 403);
  }

  const paymentId = c.req.param("paymentId");
  const body = refundSchema.parse(await c.req.json().catch(() => ({})));
  const { data: payment } = await guard.service.from("payments").select("id, amount_cents, invoice_id").eq("id", paymentId).eq("tenant_id", guard.tenantId).maybeSingle();
  if (!payment) return c.json({ error: "Paiement introuvable" }, 404);
  if (body.amountCents > payment.amount_cents) return c.json({ error: "Montant de remboursement invalide" }, 400);

  await guard.service.from("refunds").insert({
    payment_id: paymentId,
    tenant_id: guard.tenantId,
    amount_cents: body.amountCents,
    reason: body.reason,
    status: "succeeded",
    requested_by: guard.userId,
  });

  await guard.service.from("payments").update({
    status: body.amountCents === payment.amount_cents ? "refunded" : "partially_refunded",
    internal_notes: `Remboursement: ${body.reason}`,
  }).eq("id", paymentId);

  await appendAuditLog(guard.service, {
    tenantId: guard.tenantId,
    actorUserId: guard.userId,
    actorRole: guard.role,
    action: "payment.refund.created",
    entityType: "payment",
    entityId: paymentId,
    severity: "warn",
    metadata: body,
    ipAddress: c.req.header("x-forwarded-for") ?? null,
    userAgent: c.req.header("user-agent") ?? null,
  });

  await refreshInvoiceBalance(guard.service, payment.invoice_id);
  return c.json({ ok: true });
});

registerPost("/payments/:paymentId/remind", async (c) => {
  const guard = await requireConsoleAccess(c.req.raw);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);
  const paymentId = c.req.param("paymentId");
  const body = reminderSchema.parse(await c.req.json().catch(() => ({})));

  await appendAuditLog(guard.service, {
    tenantId: guard.tenantId,
    actorUserId: guard.userId,
    actorRole: guard.role,
    action: "payment.reminder.sent",
    entityType: "payment",
    entityId: paymentId,
    metadata: body,
    ipAddress: c.req.header("x-forwarded-for") ?? null,
    userAgent: c.req.header("user-agent") ?? null,
  });

  return c.json({ ok: true });
});

registerPost("/payments/:paymentId/mark-offline", async (c) => {
  const guard = await requireConsoleAccess(c.req.raw);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);
  if (!["owner", "super_admin", "admin_finance", "director"].includes(guard.role)) {
    return c.json({ error: "Action non autorisée" }, 403);
  }

  const paymentId = c.req.param("paymentId");
  const body = markOfflineSchema.parse(await c.req.json().catch(() => ({})));
  const { data: payment } = await guard.service.from("payments").select("id, amount_cents, invoice_id").eq("id", paymentId).eq("tenant_id", guard.tenantId).maybeSingle();
  if (!payment) return c.json({ error: "Paiement introuvable" }, 404);

  const amount = body.amountCents ?? payment.amount_cents;
  await guard.service.from("payments").update({
    amount_cents: amount,
    status: "paid",
    provider: "manual",
    payment_method: "offline",
    paid_at: new Date().toISOString(),
    offline_marked_at: new Date().toISOString(),
    internal_notes: body.note,
  }).eq("id", paymentId);

  await appendAuditLog(guard.service, {
    tenantId: guard.tenantId,
    actorUserId: guard.userId,
    actorRole: guard.role,
    action: "payment.marked_offline",
    entityType: "payment",
    entityId: paymentId,
    metadata: body,
    ipAddress: c.req.header("x-forwarded-for") ?? null,
    userAgent: c.req.header("user-agent") ?? null,
  });

  await refreshInvoiceBalance(guard.service, payment.invoice_id);
  return c.json({ ok: true });
});

registerPost("/payments/:paymentId/cancel", async (c) => {
  const guard = await requireConsoleAccess(c.req.raw);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);
  if (!["owner", "super_admin", "admin_finance", "director"].includes(guard.role)) {
    return c.json({ error: "Action non autorisée" }, 403);
  }

  const paymentId = c.req.param("paymentId");
  const { data: payment } = await guard.service.from("payments").select("invoice_id").eq("id", paymentId).eq("tenant_id", guard.tenantId).maybeSingle();
  if (!payment) return c.json({ error: "Paiement introuvable" }, 404);

  await guard.service.from("payments").update({
    status: "failed",
    failure_reason: "Annulé par un administrateur",
  }).eq("id", paymentId);

  await appendAuditLog(guard.service, {
    tenantId: guard.tenantId,
    actorUserId: guard.userId,
    actorRole: guard.role,
    action: "payment.canceled",
    entityType: "payment",
    entityId: paymentId,
    severity: "warn",
    ipAddress: c.req.header("x-forwarded-for") ?? null,
    userAgent: c.req.header("user-agent") ?? null,
  });

  await refreshInvoiceBalance(guard.service, payment.invoice_id);
  return c.json({ ok: true });
});

registerPost("/payments/:paymentId/note", async (c) => {
  const guard = await requireConsoleAccess(c.req.raw);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);
  const paymentId = c.req.param("paymentId");
  const body = noteSchema.parse(await c.req.json().catch(() => ({})));

  await guard.service.from("payments").update({ internal_notes: body.note }).eq("id", paymentId).eq("tenant_id", guard.tenantId);
  await appendAuditLog(guard.service, {
    tenantId: guard.tenantId,
    actorUserId: guard.userId,
    actorRole: guard.role,
    action: "payment.note.updated",
    entityType: "payment",
    entityId: paymentId,
    metadata: body,
  });
  return c.json({ ok: true });
});

registerGet("/billing", async (c) => {
  const guard = await requireConsoleAccess(c.req.raw);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);

  const [{ data: plans }, { data: invoices }, { data: subscriptions }, { data: students }] = await Promise.all([
    guard.service.from("plans").select("id, code, name, description, billing_interval, amount_cents, currency, trial_days, tax_rate_basis_points, student_limit, active, features").eq("tenant_id", guard.tenantId).is("deleted_at", null).order("display_order", { ascending: true }),
    guard.service.from("invoices").select("id, invoice_number, status, student_id, due_date, total_cents, balance_cents, paid_cents, currency").eq("tenant_id", guard.tenantId).is("deleted_at", null).order("issue_date", { ascending: false }).limit(8),
    guard.service.from("subscriptions").select("id, subscriber_name, subscriber_email, status, billing_cycle, current_period_end, amount_cents, currency, plan_id").eq("tenant_id", guard.tenantId).is("deleted_at", null).order("created_at", { ascending: false }).limit(8),
    guard.service.from("students").select("id, nom, prenom").eq("tenant_id", guard.tenantId),
  ]);

  const studentMap = new Map((students ?? []).map((student) => [student.id, `${student.prenom} ${student.nom}`.trim()]));
  const planIds = Array.from(new Set((subscriptions ?? []).map((item) => item.plan_id).filter(Boolean)));
  const { data: planNames } = planIds.length > 0
    ? await guard.service.from("plans").select("id, name").in("id", planIds)
    : { data: [] as Array<{ id: string; name: string }> };
  const planNameMap = new Map((planNames ?? []).map((plan) => [plan.id, plan.name]));

  return c.json({
    plans: (plans ?? []).map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      description: item.description,
      billingInterval: item.billing_interval,
      amountCents: item.amount_cents,
      currency: item.currency,
      trialDays: item.trial_days,
      taxRateBasisPoints: item.tax_rate_basis_points,
      studentLimit: item.student_limit,
      active: item.active,
      features: Array.isArray(item.features) ? item.features : [],
    })),
    invoices: (invoices ?? []).map((item) => ({
      id: item.id,
      invoiceNumber: item.invoice_number,
      status: item.status,
      studentName: studentMap.get(item.student_id ?? "") ?? "Élève non lié",
      dueDate: item.due_date,
      totalCents: item.total_cents,
      balanceCents: item.balance_cents,
      paidCents: item.paid_cents,
      currency: item.currency,
    })),
    subscriptions: (subscriptions ?? []).map((item) => ({
      id: item.id,
      subscriberName: item.subscriber_name,
      subscriberEmail: item.subscriber_email,
      status: item.status,
      billingCycle: item.billing_cycle,
      currentPeriodEnd: item.current_period_end,
      amountCents: item.amount_cents,
      currency: item.currency,
      planName: planNameMap.get(item.plan_id ?? "") ?? null,
    })),
  });
});

registerPost("/plans", async (c) => {
  const guard = await requireConsoleAccess(c.req.raw);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);
  if (!["owner", "super_admin", "admin_finance", "director"].includes(guard.role)) {
    return c.json({ error: "Action non autorisée" }, 403);
  }

  const body = planUpsertSchema.parse(await c.req.json().catch(() => ({})));
  const payload = {
    tenant_id: guard.tenantId,
    code: body.code,
    name: body.name,
    description: body.description,
    billing_interval: body.billingInterval,
    amount_cents: body.amountCents,
    currency: body.currency,
    trial_days: body.trialDays,
    tax_rate_basis_points: body.taxRateBasisPoints,
    student_limit: body.studentLimit,
    active: body.active,
    features: body.features,
  };

  if (body.id) {
    const { error } = await guard.service.from("plans").update(payload).eq("id", body.id).eq("tenant_id", guard.tenantId);
    if (error) return c.json({ error: error.message }, 400);
  } else {
    const { error } = await guard.service.from("plans").insert(payload);
    if (error) return c.json({ error: error.message }, 400);
  }

  await appendAuditLog(guard.service, {
    tenantId: guard.tenantId,
    actorUserId: guard.userId,
    actorRole: guard.role,
    action: body.id ? "plan.updated" : "plan.created",
    entityType: "plan",
    metadata: body,
  });

  return c.json({ ok: true });
});

registerGet("/audit", async (c) => {
  const guard = await requireConsoleAccess(c.req.raw);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);

  const { data, error } = await guard.service
    .from("audit_logs")
    .select("id, action, actor_role, entity_type, severity, metadata, created_at")
    .eq("tenant_id", guard.tenantId)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) return c.json({ error: error.message }, 400);

  return c.json({
    rows: (data ?? []).map((row) => ({
      id: row.id,
      action: row.action,
      actorRole: row.actor_role,
      entityType: row.entity_type,
      severity: row.severity,
      metadata: row.metadata ?? {},
      createdAt: row.created_at,
    })),
  });
});

registerGet("/users", async (c) => {
  const guard = await requireConsoleAccess(c.req.raw);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);

  const filters = userListFiltersSchema.parse(Object.fromEntries(new URL(c.req.url).searchParams.entries()));

  const { data: baseUsers, error } = await guard.service
    .from("tenant_user_accounts")
    .select("user_id, status, country_code, acquisition_channel, suspended_reason, suspended_at, reactivated_at, last_seen_at, created_at")
    .eq("tenant_id", guard.tenantId)
    .is("deleted_at", null);

  if (error) return c.json({ error: error.message }, 400);
  const userIds = (baseUsers ?? []).map((row) => row.user_id);

  const [{ data: profiles }, { data: roles }, authUsersRes] = await Promise.all([
    userIds.length
      ? guard.service.from("profiles").select("id, full_name, telephone").in("id", userIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null; telephone: string | null }> }),
    userIds.length
      ? guard.service.from("user_roles").select("user_id, role_code").eq("tenant_id", guard.tenantId).in("user_id", userIds)
      : Promise.resolve({ data: [] as Array<{ user_id: string; role_code: string }> }),
    guard.service.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const emailMap = new Map<string, string>();
  for (const user of authUsersRes.data?.users ?? []) {
    emailMap.set(user.id, user.email ?? "");
  }

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const roleMap = new Map<string, string>();
  for (const row of roles ?? []) {
    if (!roleMap.has(row.user_id)) roleMap.set(row.user_id, row.role_code);
  }

  const allowRawPii = canSeeRawPii(guard.role);
  const normalized = (baseUsers ?? []).map((row) => {
    const profile = profileMap.get(row.user_id);
    const email = emailMap.get(row.user_id) ?? "";
    return {
      userId: row.user_id,
      fullName: profile?.full_name ?? "Utilisateur",
      email: allowRawPii ? email : (maskEmail(email) ?? ""),
      phone: allowRawPii ? profile?.telephone ?? null : null,
      roleCode: roleMap.get(row.user_id) ?? "support",
      status: row.status,
      countryCode: row.country_code,
      acquisitionChannel: row.acquisition_channel,
      lastSeenAt: row.last_seen_at,
      suspendedReason: row.suspended_reason,
      suspendedAt: row.suspended_at,
      reactivatedAt: row.reactivated_at,
      createdAt: row.created_at,
    };
  });

  const searched = normalized.filter((row) => {
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (filters.role !== "all" && row.roleCode !== filters.role) return false;
    if (!filters.search) return true;
    const haystack = `${row.fullName} ${row.email}`.toLowerCase();
    return haystack.includes(filters.search.toLowerCase());
  });

  const factor = filters.sortOrder === "asc" ? 1 : -1;
  searched.sort((a, b) => {
    const left = String((a as Record<string, unknown>)[filters.sortBy] ?? "").toLowerCase();
    const right = String((b as Record<string, unknown>)[filters.sortBy] ?? "").toLowerCase();
    return left.localeCompare(right) * factor;
  });

  const from = (filters.page - 1) * filters.pageSize;
  const paged = searched.slice(from, from + filters.pageSize);

  return c.json({
    rows: paged,
    page: filters.page,
    pageSize: filters.pageSize,
    total: searched.length,
  });
});

registerGet("/users/export", async (c) => {
  const guard = await requireConsoleAccess(c.req.raw);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);

  const { data: baseUsers, error } = await guard.service
    .from("tenant_user_accounts")
    .select("user_id, status, country_code, acquisition_channel, created_at")
    .eq("tenant_id", guard.tenantId)
    .is("deleted_at", null);
  if (error) return c.json({ error: error.message }, 400);

  const userIds = (baseUsers ?? []).map((row) => row.user_id);
  const [{ data: profiles }, { data: roles }, authUsersRes] = await Promise.all([
    userIds.length
      ? guard.service.from("profiles").select("id, full_name").in("id", userIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null }> }),
    userIds.length
      ? guard.service.from("user_roles").select("user_id, role_code").eq("tenant_id", guard.tenantId).in("user_id", userIds)
      : Promise.resolve({ data: [] as Array<{ user_id: string; role_code: string }> }),
    guard.service.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name ?? ""]));
  const roleMap = new Map((roles ?? []).map((row) => [row.user_id, row.role_code]));
  const emailMap = new Map<string, string>();
  for (const user of authUsersRes.data?.users ?? []) emailMap.set(user.id, user.email ?? "");

  const rows = [
    ["userId", "fullName", "email", "roleCode", "status", "countryCode", "acquisitionChannel", "createdAt"],
    ...(baseUsers ?? []).map((row) => [
      row.user_id,
      profileMap.get(row.user_id) ?? "",
      emailMap.get(row.user_id) ?? "",
      roleMap.get(row.user_id) ?? "support",
      row.status,
      row.country_code,
      row.acquisition_channel,
      row.created_at,
    ]),
  ];

  const csv = rows.map((row) => row.map((item) => `"${String(item).replaceAll('"', '""')}"`).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=admin-users.csv",
    },
  });
});

registerGet("/users/:userId", async (c) => {
  const guard = await requireConsoleAccess(c.req.raw);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);

  const userId = c.req.param("userId");
  const [{ data: account }, { data: profile }, { data: roles }, authUsersRes, { data: audits }] = await Promise.all([
    guard.service
      .from("tenant_user_accounts")
      .select("user_id, status, country_code, acquisition_channel, suspended_reason, suspended_at, reactivated_at, last_seen_at, created_at, metadata")
      .eq("tenant_id", guard.tenantId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .maybeSingle(),
    guard.service.from("profiles").select("id, full_name, telephone, role").eq("id", userId).maybeSingle(),
    guard.service.from("user_roles").select("role_code").eq("tenant_id", guard.tenantId).eq("user_id", userId),
    guard.service.auth.admin.getUserById(userId),
    guard.service
      .from("audit_logs")
      .select("id, action, severity, metadata, created_at")
      .eq("tenant_id", guard.tenantId)
      .eq("entity_id", userId)
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  if (!account) return c.json({ error: "Utilisateur introuvable" }, 404);

  const userEmail = authUsersRes.data.user?.email ?? "";
  const primaryRole = roles?.[0]?.role_code ?? "support";
  return c.json({
    userId,
    fullName: profile?.full_name ?? "Utilisateur",
    email: canSeeRawPii(guard.role) ? userEmail : maskEmail(userEmail),
    phone: canSeeRawPii(guard.role) ? profile?.telephone ?? null : null,
    roleCode: primaryRole,
    status: account.status,
    countryCode: account.country_code,
    acquisitionChannel: account.acquisition_channel,
    suspendedReason: account.suspended_reason,
    suspendedAt: account.suspended_at,
    reactivatedAt: account.reactivated_at,
    lastSeenAt: account.last_seen_at,
    createdAt: account.created_at,
    metadata: account.metadata ?? {},
    auditTrail: (audits ?? []).map((row) => ({
      id: row.id,
      action: row.action,
      severity: row.severity,
      metadata: row.metadata ?? {},
      createdAt: row.created_at,
    })),
  });
});

registerPost("/users", async (c) => {
  const guard = await requireConsoleAccess(c.req.raw);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);
  if (!canManageUsers(guard.role)) return c.json({ error: "Action non autorisée" }, 403);

  const body = userCreateSchema.parse(await c.req.json().catch(() => ({})));
  const tempPassword = body.password ?? `${crypto.randomUUID()}Aa1!`;
  const created = await guard.service.auth.admin.createUser({
    email: body.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: body.fullName },
  });
  if (created.error || !created.data.user) return c.json({ error: created.error?.message ?? "Création utilisateur impossible" }, 400);

  const userId = created.data.user.id;
  await Promise.all([
    guard.service.from("profiles").upsert({
      id: userId,
      role: "teacher",
      full_name: body.fullName,
    }),
    guard.service.from("user_roles").upsert({
      tenant_id: guard.tenantId,
      user_id: userId,
      role_code: body.roleCode,
      is_primary: true,
    }, { onConflict: "tenant_id,user_id,role_code" }),
    guard.service.from("tenant_user_accounts").upsert({
      tenant_id: guard.tenantId,
      user_id: userId,
      status: body.status,
      country_code: body.countryCode.toUpperCase(),
      acquisition_channel: body.acquisitionChannel,
      metadata: { invited_by: guard.userId },
    }, { onConflict: "tenant_id,user_id" }),
    guard.service.from("kpi_events").insert({
      tenant_id: guard.tenantId,
      user_id: userId,
      event_name: "signup_completed",
      properties: { source: "admin_console" },
    }),
  ]);

  if (body.sendInvite) {
    await guard.service.auth.admin.generateLink({
      email: body.email,
      type: "invite",
    });
  }

  await appendAuditLog(guard.service, {
    tenantId: guard.tenantId,
    actorUserId: guard.userId,
    actorRole: guard.role,
    action: "user.created",
    entityType: "user",
    entityId: userId,
    metadata: { roleCode: body.roleCode, status: body.status },
    ipAddress: c.req.header("x-forwarded-for") ?? null,
    userAgent: c.req.header("user-agent") ?? null,
  });

  return c.json({ ok: true, userId }, 201);
});

registerPatch("/users/:userId", async (c) => {
  const guard = await requireConsoleAccess(c.req.raw);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);
  if (!canManageUsers(guard.role)) return c.json({ error: "Action non autorisée" }, 403);

  const userId = c.req.param("userId");
  const body = userUpdateSchema.parse(await c.req.json().catch(() => ({})));

  if (body.fullName) {
    const { error } = await guard.service.from("profiles").update({ full_name: body.fullName }).eq("id", userId);
    if (error) return c.json({ error: error.message }, 400);
  }

  if (body.roleCode) {
    await guard.service.from("user_roles").delete().eq("tenant_id", guard.tenantId).eq("user_id", userId);
    await guard.service.from("user_roles").insert({
      tenant_id: guard.tenantId,
      user_id: userId,
      role_code: body.roleCode,
      is_primary: true,
    });
  }

  const patch: Record<string, unknown> = {};
  if (body.status) patch.status = body.status;
  if (body.countryCode) patch.country_code = body.countryCode.toUpperCase();
  if (body.acquisitionChannel) patch.acquisition_channel = body.acquisitionChannel;
  if (body.suspendedReason) patch.suspended_reason = body.suspendedReason;
  if (body.status === "suspended") patch.suspended_at = new Date().toISOString();
  if (body.status === "active") patch.reactivated_at = new Date().toISOString();

  if (Object.keys(patch).length > 0) {
    const { error } = await guard.service.from("tenant_user_accounts").update(patch).eq("tenant_id", guard.tenantId).eq("user_id", userId);
    if (error) return c.json({ error: error.message }, 400);
  }

  await appendAuditLog(guard.service, {
    tenantId: guard.tenantId,
    actorUserId: guard.userId,
    actorRole: guard.role,
    action: "user.updated",
    entityType: "user",
    entityId: userId,
    metadata: body,
  });

  return c.json({ ok: true });
});

registerPost("/users/:userId/suspend", async (c) => {
  const guard = await requireConsoleAccess(c.req.raw);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);
  if (!canManageUsers(guard.role)) return c.json({ error: "Action non autorisée" }, 403);

  const userId = c.req.param("userId");
  const body = suspendUserSchema.parse(await c.req.json().catch(() => ({})));

  await guard.service.from("tenant_user_accounts").update({
    status: "suspended",
    suspended_reason: body.reason,
    suspended_at: new Date().toISOString(),
  }).eq("tenant_id", guard.tenantId).eq("user_id", userId);

  await appendAuditLog(guard.service, {
    tenantId: guard.tenantId,
    actorUserId: guard.userId,
    actorRole: guard.role,
    action: "user.suspended",
    entityType: "user",
    entityId: userId,
    severity: "warn",
    metadata: body,
  });

  return c.json({ ok: true });
});

registerPost("/users/:userId/reactivate", async (c) => {
  const guard = await requireConsoleAccess(c.req.raw);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);
  if (!canManageUsers(guard.role)) return c.json({ error: "Action non autorisée" }, 403);

  const userId = c.req.param("userId");
  const body = reactivateUserSchema.parse(await c.req.json().catch(() => ({})));

  await guard.service.from("tenant_user_accounts").update({
    status: "active",
    reactivated_at: new Date().toISOString(),
    suspended_reason: body.reason ?? null,
  }).eq("tenant_id", guard.tenantId).eq("user_id", userId);

  await appendAuditLog(guard.service, {
    tenantId: guard.tenantId,
    actorUserId: guard.userId,
    actorRole: guard.role,
    action: "user.reactivated",
    entityType: "user",
    entityId: userId,
    metadata: body,
  });

  return c.json({ ok: true });
});

registerPost("/users/:userId/reset-password", async (c) => {
  const guard = await requireConsoleAccess(c.req.raw);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);
  if (!canManageUsers(guard.role)) return c.json({ error: "Action non autorisée" }, 403);

  const userId = c.req.param("userId");
  const body = resetPasswordSchema.parse(await c.req.json().catch(() => ({})));
  const userResult = await guard.service.auth.admin.getUserById(userId);
  if (userResult.error || !userResult.data.user?.email) {
    return c.json({ error: "Utilisateur introuvable" }, 404);
  }

  const reset = await guard.service.auth.admin.generateLink({
    type: "recovery",
    email: userResult.data.user.email,
    options: body.redirectTo ? { redirectTo: body.redirectTo } : undefined,
  });
  if (reset.error) return c.json({ error: reset.error.message }, 400);

  await appendAuditLog(guard.service, {
    tenantId: guard.tenantId,
    actorUserId: guard.userId,
    actorRole: guard.role,
    action: "user.password_reset_requested",
    entityType: "user",
    entityId: userId,
    severity: "warn",
  });

  return c.json({ ok: true });
});

registerDelete("/users/:userId", async (c) => {
  const guard = await requireConsoleAccess(c.req.raw);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);
  if (!canManageUsers(guard.role)) return c.json({ error: "Action non autorisée" }, 403);

  const userId = c.req.param("userId");
  const body = deleteUserSchema.parse(await c.req.json().catch(() => ({})));

  await guard.service.from("tenant_user_accounts").update({
    status: "deleted",
    deleted_at: new Date().toISOString(),
  }).eq("tenant_id", guard.tenantId).eq("user_id", userId);

  await guard.service.from("user_roles").delete().eq("tenant_id", guard.tenantId).eq("user_id", userId);

  if (body.hardDelete) {
    await guard.service.auth.admin.deleteUser(userId, true);
  }

  await appendAuditLog(guard.service, {
    tenantId: guard.tenantId,
    actorUserId: guard.userId,
    actorRole: guard.role,
    action: body.hardDelete ? "user.hard_deleted" : "user.soft_deleted",
    entityType: "user",
    entityId: userId,
    severity: "critical",
    metadata: { reason: body.reason ?? null },
  });

  return c.json({ ok: true });
});

registerPost("/users/import", async (c) => {
  const guard = await requireConsoleAccess(c.req.raw);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);
  if (!canManageUsers(guard.role)) return c.json({ error: "Action non autorisée" }, 403);

  const body = await c.req.json().catch(() => ({}));
  const csvText = typeof body.csv === "string" ? body.csv : "";
  const rows = parseCsv(csvText);
  let imported = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const payload = userCreateSchema.parse({
        email: row.email,
        fullName: row.fullName,
        roleCode: row.roleCode || "support",
        status: row.status || "active",
        countryCode: row.countryCode || "SN",
        acquisitionChannel: row.acquisitionChannel || "import_csv",
        sendInvite: false,
      });

      const created = await guard.service.auth.admin.createUser({
        email: payload.email,
        password: `${crypto.randomUUID()}Aa1!`,
        email_confirm: true,
        user_metadata: { full_name: payload.fullName },
      });
      if (created.error || !created.data.user) throw new Error(created.error?.message ?? "create_user_failed");

      await Promise.all([
        guard.service.from("profiles").upsert({ id: created.data.user.id, role: "teacher", full_name: payload.fullName }),
        guard.service.from("user_roles").insert({ tenant_id: guard.tenantId, user_id: created.data.user.id, role_code: payload.roleCode, is_primary: true }),
        guard.service.from("tenant_user_accounts").upsert({
          tenant_id: guard.tenantId,
          user_id: created.data.user.id,
          status: payload.status,
          country_code: payload.countryCode,
          acquisition_channel: payload.acquisitionChannel,
          metadata: { source: "csv_import" },
        }, { onConflict: "tenant_id,user_id" }),
      ]);

      imported += 1;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "import_row_failed");
    }
  }

  await appendAuditLog(guard.service, {
    tenantId: guard.tenantId,
    actorUserId: guard.userId,
    actorRole: guard.role,
    action: "users.imported_csv",
    entityType: "user",
    metadata: { imported, failed: errors.length },
  });

  return c.json({ ok: true, imported, failed: errors.length, errors: errors.slice(0, 15) });
});

app.onError((error, c) => {
  logStructured("admin-console.error", {
    path: c.req.path,
    message: error.message,
  });
  if (error instanceof z.ZodError) {
    return c.json({ error: error.issues.map((issue) => issue.message).join(", ") }, 400);
  }
  return c.json({ error: error.message || "Erreur interne" }, 500);
});

Deno.serve(app.fetch);