import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

app.use("*", logger(console.log));

const defaultOrigins = [
  "http://localhost:5173",
  "https://ecole-2-0-copie-2-opentechsn.vercel.app",
];

const rawOrigins = Deno.env.get("ALLOWED_ORIGINS") ?? defaultOrigins.join(",");
const ALLOWED_ORIGIN_PATTERNS = rawOrigins
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function isOriginAllowed(origin: string): boolean {
  if (!origin) return true;

  return ALLOWED_ORIGIN_PATTERNS.some((pattern) => {
    if (pattern === "*") return true;
    if (pattern === origin) return true;

    if (pattern.startsWith("*.")) {
      try {
        const hostname = new URL(origin).hostname;
        const suffix = pattern.slice(2);
        return hostname === suffix || hostname.endsWith(`.${suffix}`);
      } catch {
        return false;
      }
    }

    return false;
  });
}

app.use(
  "/*",
  cors({
    origin: (origin) => (isOriginAllowed(origin) ? origin : false),
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error("Missing required env vars for admin-server function");
}

function getClients(authHeader: string | undefined) {
  const caller = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader ?? "" } },
  });

  const service = createClient(supabaseUrl, supabaseServiceRoleKey);
  return { caller, service };
}

function registerGet(path: string, handler: Parameters<typeof app.get>[1]) {
  app.get(path, handler);
  app.get(`/admin-server${path}`, handler);
}

function registerPost(path: string, handler: Parameters<typeof app.post>[1]) {
  app.post(path, handler);
  app.post(`/admin-server${path}`, handler);
}

async function requireDirector(authHeader: string | undefined) {
  const { caller, service } = getClients(authHeader);
  const { data: userData, error: authError } = await caller.auth.getUser();

  if (authError || !userData.user) {
    return { ok: false as const, status: 401, message: "Unauthorized" };
  }

  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("id, role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "director") {
    return { ok: false as const, status: 403, message: "Forbidden" };
  }

  return {
    ok: true as const,
    userId: userData.user.id,
    caller,
    service,
  };
}

registerGet("/health", (c) => c.json({ status: "ok" }));

registerGet("/audit", async (c) => {
  const guard = await requireDirector(c.req.header("Authorization"));
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);

  const limit = Number(c.req.query("limit") ?? "100");

  const { data, error } = await guard.service
    .from("admin_audit_logs")
    .select("id, actor_user_id, action, target_user_id, target_type, metadata, ip_address, user_agent, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 500));

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ data });
});

registerGet("/invitations", async (c) => {
  const guard = await requireDirector(c.req.header("Authorization"));
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);

  const { data, error } = await guard.service
    .from("admin_invitations")
    .select("id, email, role, full_name, school_id, class_id, status, expires_at, created_at, invited_by")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ data });
});

registerPost("/invitations", async (c) => {
  const guard = await requireDirector(c.req.header("Authorization"));
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);

  const body = await c.req.json().catch(() => ({}));

  const payload = {
    p_email: body.email,
    p_role: body.role ?? "teacher",
    p_full_name: body.fullName ?? null,
    p_school_id: body.schoolId ?? null,
    p_class_id: body.classId ?? null,
    p_expires_hours: body.expiresHours ?? 168,
    p_note: body.note ?? null,
  };

  const { data, error } = await guard.service.rpc("admin_create_invitation", payload);
  if (error) return c.json({ error: error.message }, 400);

  await guard.service.rpc("admin_log_action", {
    p_action: "admin.edge.invitation.created",
    p_target_user_id: null,
    p_target_type: "invitation",
    p_metadata: {
      email: body.email ?? null,
      role: body.role ?? "teacher",
      source: "edge_function",
    },
    p_ip: c.req.header("x-forwarded-for") ?? null,
    p_user_agent: c.req.header("user-agent") ?? null,
  });

  return c.json({ data }, 201);
});

registerPost("/invitations/revoke", async (c) => {
  const guard = await requireDirector(c.req.header("Authorization"));
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);

  const body = await c.req.json().catch(() => ({}));
  if (!body.invitationId) return c.json({ error: "invitationId is required" }, 400);

  const { error } = await guard.service.rpc("admin_revoke_invitation", {
    p_invitation_id: body.invitationId,
    p_reason: body.reason ?? null,
  });

  if (error) return c.json({ error: error.message }, 400);

  return c.json({ ok: true });
});

registerPost("/roles/assign", async (c) => {
  const guard = await requireDirector(c.req.header("Authorization"));
  if (!guard.ok) return c.json({ error: guard.message }, guard.status);

  const body = await c.req.json().catch(() => ({}));
  if (!body.userId || !body.role) {
    return c.json({ error: "userId and role are required" }, 400);
  }

  const { error } = await guard.service.rpc("admin_assign_user_role", {
    p_user_id: body.userId,
    p_new_role: body.role,
    p_reason: body.reason ?? null,
  });

  if (error) return c.json({ error: error.message }, 400);

  await guard.service.rpc("admin_log_action", {
    p_action: "admin.edge.role.assigned",
    p_target_user_id: body.userId,
    p_target_type: "user",
    p_metadata: {
      new_role: body.role,
      reason: body.reason ?? null,
      source: "edge_function",
    },
    p_ip: c.req.header("x-forwarded-for") ?? null,
    p_user_agent: c.req.header("user-agent") ?? null,
  });

  return c.json({ ok: true });
});

Deno.serve(app.fetch);
