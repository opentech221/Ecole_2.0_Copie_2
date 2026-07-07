import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { z } from "npm:zod";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

app.use("*", logger(console.log));

const defaultOrigins = [
  "http://localhost:5173",
  "https://ecole-2-0-copie-2-opentechsn.vercel.app",
];

const rawOrigins = Deno.env.get("ALLOWED_ORIGINS") ?? defaultOrigins.join(",");
const allowedOriginPatterns = rawOrigins.split(",").map((item) => item.trim()).filter(Boolean);

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
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "OPTIONS"],
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

async function getSummaryPayload(guard: Extract<GuardResult, { ok: true }>) {
  const { service, tenantId, accessibleTenantIds, role } = guard;
  const tenantScope = accessibleTenantIds.length > 0 ? accessibleTenantIds : [tenantId];

  const [
    { data: tenant },
    { data: payments },
    { data: subscriptions },
    { data: invoices },
    { data: classes },
    { data: webhooks },
  ] = await Promise.all([
    service.from("tenants").select("id, name, slug, status, currency").eq("id", tenantId).single(),
    service
      .from("payments")
      .select("id, tenant_id, amount_cents, status, payment_method, class_id, created_at")
      .in("tenant_id", tenantScope)
      .is("deleted_at", null),
    service
      .from("subscriptions")
      .select("id, tenant_id, amount_cents, billing_cycle, status, current_period_end")
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
  ]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthPayments = (payments ?? []).filter((payment) => {
    const createdAt = new Date(payment.created_at);
    return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
  });

  const paidAmountMonth = currentMonthPayments.reduce((sum, payment) => sum + (payment.status === "paid" ? cents(payment.amount_cents) : 0), 0);
  const failedAmountMonth = currentMonthPayments.reduce((sum, payment) => sum + (payment.status === "failed" ? cents(payment.amount_cents) : 0), 0);
  const unpaidAmount = (invoices ?? []).reduce((sum, invoice) => sum + cents(invoice.balance_cents), 0);
  const totalInvoiced = (invoices ?? []).reduce((sum, invoice) => sum + cents(invoice.total_cents), 0);
  const totalCollected = (invoices ?? []).reduce((sum, invoice) => sum + cents(invoice.paid_cents), 0);
  const activeSubs = (subscriptions ?? []).filter((sub) => ["trialing", "active", "past_due"].includes(sub.status));
  const churnedSubs = (subscriptions ?? []).filter((sub) => ["canceled", "expired"].includes(sub.status));
  const mrr = activeSubs.reduce((sum, sub) => sum + (sub.billing_cycle === "monthly" ? cents(sub.amount_cents) : Math.round(cents(sub.amount_cents) / 12)), 0);
  const arr = mrr * 12;
  const churnRate = activeSubs.length + churnedSubs.length === 0 ? 0 : (churnedSubs.length / (activeSubs.length + churnedSubs.length)) * 100;
  const estimatedLtv = churnRate === 0 ? mrr * 18 : Math.round(mrr / Math.max(churnRate / 100, 0.01));
  const recoveryRate = totalInvoiced === 0 ? 0 : (totalCollected / totalInvoiced) * 100;
  const successPaymentsCount = currentMonthPayments.filter((payment) => payment.status === "paid").length;
  const failedPaymentsCount = currentMonthPayments.filter((payment) => payment.status === "failed").length;
  const revenue7d = await getRevenueSeries(service, tenantScope, tenantId, 7);
  const revenue30d = await getRevenueSeries(service, tenantScope, tenantId, 30);
  const revenue12m = await getMonthlySeries(service, tenantScope, tenantId);

  const byTenantMap = new Map<string, number>();
  for (const payment of payments ?? []) {
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
  for (const payment of payments ?? []) {
    byMethodMap.set(payment.payment_method, (byMethodMap.get(payment.payment_method) ?? 0) + cents(payment.amount_cents));
  }

  const expiringSubscriptions = (subscriptions ?? []).filter((sub) => {
    if (!sub.current_period_end) return false;
    const end = new Date(sub.current_period_end).getTime();
    return end > Date.now() && end <= Date.now() + 1000 * 60 * 60 * 24 * 30;
  });

  const alerts = [
    ...(failedPaymentsCount >= 3
      ? [{ id: crypto.randomUUID(), title: "Pic d’échecs paiements", description: `${failedPaymentsCount} échecs ce mois-ci sur le tenant sélectionné.`, severity: "critical" as const, category: "payments" as const, createdAt: now.toISOString() }]
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
    alerts,
  };
}

app.get("/health", (c) => c.json({ status: "ok" }));

app.get("/tenants", async (c) => {
  const data = await listAccessibleTenants(c.req.header("Authorization"));
  return c.json({ data });
});

app.get("/summary", async (c) => {
  const guard = await requireConsoleAccess(c.req.raw);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);
  const payload = await getSummaryPayload(guard);
  return c.json(payload);
});

app.get("/payments", async (c) => {
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

app.get("/payments/export", async (c) => {
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

app.get("/payments/:paymentId", async (c) => {
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

app.post("/payments/:paymentId/refund", async (c) => {
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

app.post("/payments/:paymentId/remind", async (c) => {
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

app.post("/payments/:paymentId/mark-offline", async (c) => {
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

app.post("/payments/:paymentId/cancel", async (c) => {
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

app.post("/payments/:paymentId/note", async (c) => {
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

app.get("/billing", async (c) => {
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

app.post("/plans", async (c) => {
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

app.get("/audit", async (c) => {
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