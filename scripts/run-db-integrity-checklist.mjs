#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { basename } from "node:path";

const mode = process.argv[2] ?? "local";

if (!new Set(["local", "linked"]).has(mode)) {
  console.error("Usage: node scripts/run-db-integrity-checklist.mjs [local|linked]");
  process.exit(1);
}

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sqlFile = path.join(rootDir, "scripts", "db-integrity-checklist.sql");
const targetFlag = mode === "local" ? "--local" : "--linked";

console.log(`[db-integrity] Running checklist in ${mode} mode...`);

let combinedStdout = "";
if (mode === "local") {
  const listResult = spawnSync("docker", ["ps", "--format", "{{.Names}}"], {
    cwd: rootDir,
    stdio: "pipe",
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  if (listResult.status !== 0) {
    process.stderr.write(listResult.stderr ?? "");
    console.error("[db-integrity] Unable to list Docker containers.");
    process.exit(listResult.status ?? 1);
  }

  const names = (listResult.stdout ?? "")
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);
  const projectName = basename(rootDir);
  const candidate =
    names.find((name) => name.startsWith("supabase_db_") && name.includes(projectName)) ??
    names.find((name) => name.startsWith("supabase_db_"));

  if (!candidate) {
    console.error("[db-integrity] No local Supabase DB container found.");
    process.exit(1);
  }

  const localCommand =
    process.platform === "win32"
      ? `type \"${sqlFile}\" | docker exec -i ${candidate} psql -U postgres -d postgres`
      : `cat \"${sqlFile}\" | docker exec -i ${candidate} psql -U postgres -d postgres`;

  const result = spawnSync(localCommand, {
    cwd: rootDir,
    stdio: "pipe",
    encoding: "utf8",
    shell: true,
  });

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  combinedStdout = stdout;

  if (stdout) {
    process.stdout.write(stdout);
  }
  if (stderr) {
    process.stderr.write(stderr);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
} else {
  const result = spawnSync(
    "npx",
    ["-y", "supabase", "db", "query", targetFlag, "--file", sqlFile],
    {
      cwd: rootDir,
      stdio: "pipe",
      encoding: "utf8",
      shell: process.platform === "win32",
    },
  );

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  combinedStdout = stdout;

  if (stdout) {
    process.stdout.write(stdout);
  }
  if (stderr) {
    process.stderr.write(stderr);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const failurePattern = /\b(MISSING|MISMATCH|DISABLED|ENABLED_BUT_NO_POLICY)\b/;
if (failurePattern.test(combinedStdout)) {
  console.error("[db-integrity] FAILED: anomalies detected in integrity checklist.");
  process.exit(2);
}

console.log("[db-integrity] SUCCESS: all checks returned OK.");
