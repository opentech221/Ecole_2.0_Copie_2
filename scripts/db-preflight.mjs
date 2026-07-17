#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const isDryRun = process.argv.includes("--dry-run");

function runCommand(command, args, label, options = {}) {
  console.log(`[preflight] ${label}...`);

  if (isDryRun) {
    console.log(`[preflight][dry-run] ${command} ${args.join(" ")}`);
    return;
  }

  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function checkDockerEngine() {
  console.log("[preflight] Checking Docker engine availability...");

  if (isDryRun) {
    console.log("[preflight][dry-run] docker info --format {{.ServerVersion}}");
    return;
  }

  const check = spawnSync("docker", ["info", "--format", "{{.ServerVersion}}"], {
    stdio: "pipe",
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  if (check.status !== 0) {
    const stderr = (check.stderr || "").trim();
    const stdout = (check.stdout || "").trim();
    const detail = stderr || stdout || "Docker engine unavailable.";
    console.error("[preflight] ERROR: Docker Desktop engine is not available.");
    console.error(`[preflight] Detail: ${detail}`);
    console.error("[preflight] Action: start Docker Desktop, wait for engine ready, then rerun.");
    process.exit(1);
  }

  console.log(`[preflight] Docker engine OK: ${String(check.stdout || "").trim()}`);
}

checkDockerEngine();

runCommand("npm", ["run", "db:local:start"], "Starting local Supabase DB");
runCommand("npm", ["run", "db:local:reset"], "Resetting local DB and reapplying migrations");
runCommand(
  "npx",
  ["-y", "supabase", "db", "query", "select version, name from supabase_migrations.schema_migrations order by version;"],
  "Checking applied migration versions",
);
runCommand("npm", ["run", "db:integrity:local"], "Running DB integrity checklist");
runCommand("npm", ["run", "build"], "Building frontend");

console.log("[preflight] SUCCESS: local migrations, integrity, and build are green.");
