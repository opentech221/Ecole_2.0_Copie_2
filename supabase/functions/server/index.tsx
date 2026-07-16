import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// CORS — restrict to an explicit allowlist instead of wildcard.
// Set ALLOWED_ORIGINS in Supabase Function env vars (comma-separated URLs).
const rawOrigins = Deno.env.get("ALLOWED_ORIGINS") ?? "*.github.dev,*.vercel.app,https://ecole-2-0-copie-2-opentechsn.vercel.app";
const ALLOWED_ORIGINS = rawOrigins.split(",").map((o) => o.trim()).filter(Boolean);

function isOriginAllowed(origin: string): boolean {
  if (!origin) return true;

  return ALLOWED_ORIGINS.some((pattern) => {
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
    allowHeaders:  ["Content-Type", "Authorization"],
    allowMethods:  ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge:        600,
  }),
);

// Health check endpoint
app.get("/make-server-48b2f2dd/health", (c) => {
  return c.json({ status: "ok" });
});

Deno.serve(app.fetch);