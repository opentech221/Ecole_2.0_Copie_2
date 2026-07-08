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
const allowedOriginPatterns = rawOrigins.split(",").map((o) => o.trim()).filter(Boolean);

function isOriginAllowed(origin: string): boolean {
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
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
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

type AccessRole = "owner" | "super_admin" | "admin_finance" | "support" | "director";

type AccessGuard =
  | { ok: false; status: number; message: string }
  | {
      ok: true;
      userId: string;
      roleByTenant: Record<string, AccessRole>;
      accessibleTenantIds: string[];
      service: ReturnType<typeof createClient>;
      caller: ReturnType<typeof createClient>;
    };

const listFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  scope: z.enum(["toutes", "non_lues", "archivees", "critiques"]).default("toutes"),
});

const createNotificationSchema = z.object({
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum([
    "paiement_reussi",
    "paiement_echoue",
    "facture_generee",
    "abonnement_expire_bientot",
    "abonnement_suspendu",
    "nouvel_utilisateur",
    "rappel_impaye",
    "systeme",
  ]),
  title: z.string().trim().min(2).max(140),
  message: z.string().trim().min(2).max(1500),
  priority: z.enum(["faible", "normale", "haute", "critique"]).default("normale"),
  channel: z.enum(["in_app", "email"]).default("in_app"),
  actionUrl: z.string().trim().url().nullable().optional(),
  data: z.record(z.unknown()).default({}),
});

function chooseRole(roles: string[], profileRole: string | null | undefined): AccessRole | null {
  const priority: AccessRole[] = ["owner", "super_admin", "admin_finance", "support", "director"];
  for (const role of priority) {
    if (roles.includes(role)) return role;
  }
  if (profileRole === "director") return "director";
  return null;
}

function canWrite(role: AccessRole) {
  return role !== "support";
}

function registerGet(path: string, handler: Parameters<typeof app.get>[1]) {
  app.get(path, handler);
  app.get(`/notifications-server${path}`, handler);
}

function registerPatch(path: string, handler: Parameters<typeof app.patch>[1]) {
  app.patch(path, handler);
  app.patch(`/notifications-server${path}`, handler);
}

function registerPost(path: string, handler: Parameters<typeof app.post>[1]) {
  app.post(path, handler);
  app.post(`/notifications-server${path}`, handler);
}

async function getAccessGuard(c: Parameters<typeof app.get>[1] extends (ctx: infer T) => unknown ? T : never): Promise<AccessGuard> {
  const authHeader = c.req.header("Authorization");
  const { caller, service } = getClients(authHeader);
  const { data: authData, error: authError } = await caller.auth.getUser();

  if (authError || !authData.user) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  const userId = authData.user.id;
  const [{ data: roleRows, error: rolesError }, { data: profile, error: profileError }] = await Promise.all([
    service.from("user_roles").select("tenant_id, role_code").eq("user_id", userId),
    service.from("profiles").select("role").eq("id", userId).maybeSingle(),
  ]);

  if (rolesError || profileError) {
    return { ok: false, status: 500, message: "Impossible de résoudre les permissions" };
  }

  const roleByTenant: Record<string, AccessRole> = {};
  for (const row of roleRows ?? []) {
    const current = roleByTenant[row.tenant_id];
    const next = chooseRole(current ? [current, row.role_code] : [row.role_code], profile?.role);
    if (next) roleByTenant[row.tenant_id] = next;
  }

  if (profile?.role === "director") {
    const { data: tenantRows } = await service.from("tenants").select("id").limit(200);
    for (const row of tenantRows ?? []) {
      roleByTenant[row.id] = roleByTenant[row.id] ?? "director";
    }
  }

  const accessibleTenantIds = Object.keys(roleByTenant);

  return {
    ok: true,
    userId,
    roleByTenant,
    accessibleTenantIds,
    service,
    caller,
  };
}

async function dispatchNotification(
  service: ReturnType<typeof createClient>,
  payload: {
    tenantId: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    priority: string;
    channel: string;
    actionUrl: string | null;
    data: Record<string, unknown>;
    createdBy: string;
  },
) {
  const { data, error } = await service.rpc("dispatch_notification", {
    p_tenant_id: payload.tenantId,
    p_user_id: payload.userId,
    p_type: payload.type,
    p_title: payload.title,
    p_message: payload.message,
    p_data: payload.data,
    p_priority: payload.priority,
    p_action_url: payload.actionUrl,
    p_channel: payload.channel,
    p_created_by: payload.createdBy,
  });

  if (error) throw error;
  return data as string;
}

registerGet("/api/tenants", async (c) => {
  const guard = await getAccessGuard(c);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);

  const { data, error } = await guard.service
    .from("tenants")
    .select("id, name, slug, status")
    .in("id", guard.accessibleTenantIds.length > 0 ? guard.accessibleTenantIds : ["00000000-0000-0000-0000-000000000000"])
    .order("name", { ascending: true });

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ data: data ?? [] });
});

registerGet("/api/notifications", async (c) => {
  const guard = await getAccessGuard(c);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);

  const tenantId = c.req.query("tenantId") ?? "";
  const role = guard.roleByTenant[tenantId];
  if (!tenantId || !role) return c.json({ error: "Accès tenant refusé" }, 403);

  const parsed = listFiltersSchema.safeParse({
    page: c.req.query("page"),
    pageSize: c.req.query("pageSize"),
    scope: c.req.query("scope") ?? "toutes",
  });
  if (!parsed.success) return c.json({ error: "Filtres invalides" }, 400);

  const { page, pageSize, scope } = parsed.data;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = guard.service
    .from("notifications")
    .select("id, tenant_id, user_id, type, title, message, data, priority, status, channel, action_url, created_at, read_at, archived_at", { count: "exact" })
    .eq("tenant_id", tenantId)
    .eq("user_id", guard.userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (scope === "non_lues") query = query.eq("status", "non_lue");
  if (scope === "archivees") query = query.eq("status", "archivee");
  if (scope === "critiques") query = query.eq("priority", "critique");

  const { data, error, count } = await query;
  if (error) return c.json({ error: error.message }, 400);

  return c.json({
    rows: data ?? [],
    page,
    pageSize,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  });
});

registerGet("/api/notifications/unread-count", async (c) => {
  const guard = await getAccessGuard(c);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);

  const tenantId = c.req.query("tenantId");
  const tenantScope = tenantId ? [tenantId] : guard.accessibleTenantIds;

  if (tenantId && !guard.roleByTenant[tenantId]) {
    return c.json({ error: "Accès tenant refusé" }, 403);
  }

  if (tenantScope.length === 0) {
    return c.json({ unreadCount: 0 });
  }

  const { count, error } = await guard.service
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", guard.userId)
    .eq("status", "non_lue")
    .in("tenant_id", tenantScope);

  if (error) return c.json({ error: error.message }, 400);

  return c.json({ unreadCount: count ?? 0 });
});

registerPatch("/api/notifications/:id/read", async (c) => {
  const guard = await getAccessGuard(c);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);

  const tenantId = c.req.query("tenantId") ?? "";
  if (!guard.roleByTenant[tenantId]) return c.json({ error: "Accès tenant refusé" }, 403);

  const notificationId = c.req.param("id");

  const { error } = await guard.service
    .from("notifications")
    .update({ status: "lue", read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("tenant_id", tenantId)
    .eq("user_id", guard.userId);

  if (error) return c.json({ error: error.message }, 400);

  return c.json({ ok: true });
});

registerPatch("/api/notifications/read-all", async (c) => {
  const guard = await getAccessGuard(c);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);

  const tenantId = c.req.query("tenantId") ?? "";
  if (!guard.roleByTenant[tenantId]) return c.json({ error: "Accès tenant refusé" }, 403);

  const { data, error } = await guard.service
    .from("notifications")
    .update({ status: "lue", read_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("user_id", guard.userId)
    .eq("status", "non_lue")
    .select("id");

  if (error) return c.json({ error: error.message }, 400);

  return c.json({ ok: true, updated: data?.length ?? 0 });
});

registerPatch("/api/notifications/:id/archive", async (c) => {
  const guard = await getAccessGuard(c);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);

  const tenantId = c.req.query("tenantId") ?? "";
  if (!guard.roleByTenant[tenantId]) return c.json({ error: "Accès tenant refusé" }, 403);

  const notificationId = c.req.param("id");

  const { error } = await guard.service
    .from("notifications")
    .update({ status: "archivee", archived_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("tenant_id", tenantId)
    .eq("user_id", guard.userId);

  if (error) return c.json({ error: error.message }, 400);

  return c.json({ ok: true });
});

registerPost("/api/notifications", async (c) => {
  const guard = await getAccessGuard(c);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);

  const body = await c.req.json().catch(() => ({}));
  const parsed = createNotificationSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Payload notification invalide" }, 400);

  const payload = parsed.data;
  const role = guard.roleByTenant[payload.tenantId];
  if (!role || !canWrite(role)) {
    return c.json({ error: "Droits insuffisants pour créer une notification" }, 403);
  }

  try {
    const id = await dispatchNotification(guard.service, {
      tenantId: payload.tenantId,
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      priority: payload.priority,
      channel: payload.channel,
      actionUrl: payload.actionUrl ?? null,
      data: payload.data,
      createdBy: guard.userId,
    });

    return c.json({ ok: true, id }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur création notification";
    return c.json({ error: message }, 400);
  }
});

Deno.serve(app.fetch);
