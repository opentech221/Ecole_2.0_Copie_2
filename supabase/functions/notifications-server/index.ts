import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import webpush from "npm:web-push@3.6.7";
import { z } from "npm:zod";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();
app.use("*", logger(console.log));

const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:3000",
  "*.github.dev",
  "*.vercel.app",
  "https://ecole-2-0-copie-2-opentechsn.vercel.app",
];

const rawOrigins = Deno.env.get("ALLOWED_ORIGINS") ?? defaultOrigins.join(",");
const allowedOriginPatterns = rawOrigins.split(",").map((o) => o.trim()).filter(Boolean);

function isOriginAllowed(origin: string): boolean {
  if (!origin) return true;

  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return false;
  }

  return allowedOriginPatterns.some((pattern) => {
    if (pattern === "*" || pattern === origin) return true;
    const trimmed = pattern.trim();

    const schemeWildcardMatch = trimmed.match(/^(https?):\/\/\*\.(.+)$/i);
    if (schemeWildcardMatch) {
      const scheme = `${schemeWildcardMatch[1].toLowerCase()}:`;
      const suffix = schemeWildcardMatch[2].toLowerCase();
      const hostname = parsedOrigin.hostname.toLowerCase();
      return parsedOrigin.protocol === scheme && (hostname === suffix || hostname.endsWith(`.${suffix}`));
    }

    if (!trimmed.startsWith("*.")) return false;

    const hostname = parsedOrigin.hostname.toLowerCase();
    const suffix = trimmed.slice(2).toLowerCase();
    return hostname === suffix || hostname.endsWith(`.${suffix}`);
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
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? Deno.env.get("VITE_VAPID_PUBLIC_KEY") ?? "";
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@ecole20.app";

const pushConfigured = Boolean(vapidPublicKey && vapidPrivateKey && vapidSubject);

if (pushConfigured) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

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

const pushSubscriptionSchema = z.object({
  endpoint: z.string().trim().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().trim().min(1),
    auth: z.string().trim().min(1),
  }),
  deviceLabel: z.string().trim().max(120).nullable().optional(),
});

const unsubscribePushSchema = z.object({
  endpoint: z.string().trim().url(),
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

function resolveTenantRole(guard: Extract<AccessGuard, { ok: true }>, tenantId: string, needsWrite = false) {
  const role = guard.roleByTenant[tenantId];
  if (!tenantId || !role) {
    return { ok: false as const, status: 403, message: "Accès tenant refusé" };
  }
  if (needsWrite && !canWrite(role)) {
    return { ok: false as const, status: 403, message: "Droits insuffisants" };
  }
  return { ok: true as const, role };
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

async function getPushStatusPayload(service: ReturnType<typeof createClient>, tenantId: string, userId: string) {
  const [{ data: subscription }, { data: preference }] = await Promise.all([
    service
      .from("notification_push_subscriptions")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .eq("enabled", true)
      .limit(1)
      .maybeSingle(),
    service
      .from("notification_preferences")
      .select("push_enabled")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  return {
    pushConfigured,
    vapidPublicKey: pushConfigured ? vapidPublicKey : null,
    subscriptionEnabled: Boolean(preference?.push_enabled && subscription),
    hasSubscription: Boolean(subscription),
    syncSupported: true,
  };
}

async function sendPushToUserSubscriptions(
  service: ReturnType<typeof createClient>,
  payload: {
    tenantId: string;
    userId: string;
    notificationId: string;
    title: string;
    message: string;
    actionUrl: string | null;
    priority: string;
    type: string;
  },
) {
  if (!pushConfigured) return;

  const [{ data: preference }, { data: subscriptions }] = await Promise.all([
    service
      .from("notification_preferences")
      .select("push_enabled")
      .eq("tenant_id", payload.tenantId)
      .eq("user_id", payload.userId)
      .maybeSingle(),
    service
      .from("notification_push_subscriptions")
      .select("id, endpoint, p256dh, auth, content_encoding")
      .eq("tenant_id", payload.tenantId)
      .eq("user_id", payload.userId)
      .eq("enabled", true),
  ]);

  if (!preference?.push_enabled || !subscriptions?.length) return;

  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          expirationTime: null,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        JSON.stringify({
          title: payload.title,
          body: payload.message,
          tag: payload.notificationId,
          data: {
            notificationId: payload.notificationId,
            tenantId: payload.tenantId,
            type: payload.type,
            actionUrl: payload.actionUrl ?? "/notifications",
          },
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          requireInteraction: payload.priority === "critique",
        }),
      );

      await service.from("notification_delivery_logs").insert({
        notification_id: payload.notificationId,
        tenant_id: payload.tenantId,
        channel: "in_app",
        status: "sent",
        provider: "webpush",
        provider_message_id: subscription.id,
        sent_at: new Date().toISOString(),
      });
    } catch (error) {
      const statusCode = typeof error === "object" && error && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) : null;
      if (statusCode === 404 || statusCode === 410) {
        await service.from("notification_push_subscriptions").update({ enabled: false }).eq("id", subscription.id);
      }

      await service.from("notification_delivery_logs").insert({
        notification_id: payload.notificationId,
        tenant_id: payload.tenantId,
        channel: "in_app",
        status: "failed",
        provider: "webpush",
        provider_message_id: subscription.id,
        error_message: error instanceof Error ? error.message : "push_failed",
      });
    }
  }));
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

registerGet("/api/push/status", async (c) => {
  const guard = await getAccessGuard(c);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);

  const tenantId = c.req.query("tenantId") ?? "";
  const tenantAccess = resolveTenantRole(guard, tenantId, false);
  if (!tenantAccess.ok) return c.json({ error: tenantAccess.message }, tenantAccess.status);

  return c.json(await getPushStatusPayload(guard.service, tenantId, guard.userId));
});

registerGet("/api/notifications", async (c) => {
  const guard = await getAccessGuard(c);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);

  const tenantId = c.req.query("tenantId") ?? "";
  const tenantAccess = resolveTenantRole(guard, tenantId, false);
  if (!tenantAccess.ok) return c.json({ error: tenantAccess.message }, tenantAccess.status);

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
  const tenantAccess = resolveTenantRole(guard, tenantId, false);
  if (!tenantAccess.ok) return c.json({ error: tenantAccess.message }, tenantAccess.status);

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
  const tenantAccess = resolveTenantRole(guard, tenantId, false);
  if (!tenantAccess.ok) return c.json({ error: tenantAccess.message }, tenantAccess.status);

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
  const tenantAccess = resolveTenantRole(guard, tenantId, false);
  if (!tenantAccess.ok) return c.json({ error: tenantAccess.message }, tenantAccess.status);

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
  const tenantAccess = resolveTenantRole(guard, payload.tenantId, true);
  if (!tenantAccess.ok) return c.json({ error: "Droits insuffisants pour créer une notification" }, tenantAccess.status);

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

    await sendPushToUserSubscriptions(guard.service, {
      tenantId: payload.tenantId,
      userId: payload.userId,
      notificationId: id,
      title: payload.title,
      message: payload.message,
      actionUrl: payload.actionUrl ?? null,
      priority: payload.priority,
      type: payload.type,
    });

    return c.json({ ok: true, id }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur création notification";
    return c.json({ error: message }, 400);
  }
});

registerPost("/api/push/subscribe", async (c) => {
  const guard = await getAccessGuard(c);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);

  const tenantId = c.req.query("tenantId") ?? "";
  const tenantAccess = resolveTenantRole(guard, tenantId, false);
  if (!tenantAccess.ok) return c.json({ error: tenantAccess.message }, tenantAccess.status);

  const body = await c.req.json().catch(() => ({}));
  const parsed = pushSubscriptionSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Abonnement push invalide" }, 400);

  const payload = parsed.data;
  const { error } = await guard.service.from("notification_push_subscriptions").upsert({
    tenant_id: tenantId,
    user_id: guard.userId,
    endpoint: payload.endpoint,
    p256dh: payload.keys.p256dh,
    auth: payload.keys.auth,
    content_encoding: payload.expirationTime ? String(payload.expirationTime) : null,
    user_agent: c.req.header("user-agent") ?? null,
    device_label: payload.deviceLabel ?? null,
    enabled: true,
    last_seen_at: new Date().toISOString(),
  }, { onConflict: "endpoint" });

  if (error) return c.json({ error: error.message }, 400);

  await guard.service.from("notification_preferences").upsert({
    tenant_id: tenantId,
    user_id: guard.userId,
    push_enabled: true,
  }, { onConflict: "tenant_id,user_id" });

  return c.json({ ok: true });
});

registerPost("/api/push/unsubscribe", async (c) => {
  const guard = await getAccessGuard(c);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);

  const tenantId = c.req.query("tenantId") ?? "";
  const tenantAccess = resolveTenantRole(guard, tenantId, false);
  if (!tenantAccess.ok) return c.json({ error: tenantAccess.message }, tenantAccess.status);

  const body = await c.req.json().catch(() => ({}));
  const parsed = unsubscribePushSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Endpoint push invalide" }, 400);

  const { error } = await guard.service
    .from("notification_push_subscriptions")
    .update({ enabled: false, last_seen_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("user_id", guard.userId)
    .eq("endpoint", parsed.data.endpoint);

  if (error) return c.json({ error: error.message }, 400);

  await guard.service.from("notification_preferences").upsert({
    tenant_id: tenantId,
    user_id: guard.userId,
    push_enabled: false,
  }, { onConflict: "tenant_id,user_id" });

  return c.json({ ok: true });
});

registerPost("/api/push/test", async (c) => {
  const guard = await getAccessGuard(c);
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);

  const tenantId = c.req.query("tenantId") ?? "";
  const tenantAccess = resolveTenantRole(guard, tenantId, false);
  if (!tenantAccess.ok) return c.json({ error: tenantAccess.message }, tenantAccess.status);

  const notificationId = crypto.randomUUID();
  await sendPushToUserSubscriptions(guard.service, {
    tenantId,
    userId: guard.userId,
    notificationId,
    title: "Test push Ecole 2.0",
    message: "Votre appareil reçoit correctement les notifications push.",
    actionUrl: "/notifications",
    priority: "normale",
    type: "systeme",
  });

  return c.json({ ok: true });
});

Deno.serve(app.fetch);
