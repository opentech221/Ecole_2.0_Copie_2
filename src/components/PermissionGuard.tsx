/**
 * PermissionGuard — Role-based UI wrapper.
 *
 * Renders `children` only when the current user has the required permission.
 * Falls back to `fallback` (default: "Lecture seule" badge) otherwise.
 *
 * Permission model:
 *  - Directors    → always allowed
 *  - Teachers     → allowed only when `ownerClassId === profile.classId`
 *                   (i.e. the data belongs to their class)
 *
 * Usage:
 *   <PermissionGuard ownerClassId={student.classId}>
 *     <EditButton />
 *     <DeleteButton />
 *   </PermissionGuard>
 *
 *   // Require director explicitly:
 *   <PermissionGuard requireRole="director">
 *     <ClassSelector />
 *   </PermissionGuard>
 */

import React, { type ReactNode } from "react";
import { Lock } from "lucide-react";
import { useAuthContext }          from "../app/contexts/AuthContext";
import type { UserRole }          from "../hooks/useAuth";

// ─── Hook version — useful for conditional logic inside components ─────────────

interface PermissionOptions {
  /** Class that owns the data. Omit if ownership is not class-based. */
  ownerClassId?: string;
  /** Require a specific role. If omitted, both roles are considered. */
  requireRole?:  UserRole;
}

export function usePermission(opts: PermissionOptions = {}): boolean {
  const { profile } = useAuthContext();
  if (!profile) return false;                          // not authenticated → no access

  // Directors always have full access
  if (profile.role === "director") return true;

  // A specific role is required and the user doesn't have it
  if (opts.requireRole && profile.role !== opts.requireRole) return false;

  // Teachers can only act on their own class
  if (opts.ownerClassId && profile.classId !== opts.ownerClassId) return false;

  return true;
}

// ─── Component version ────────────────────────────────────────────────────────

interface PermissionGuardProps extends PermissionOptions {
  children:   ReactNode;
  /** Rendered when access is denied. Defaults to a "Lecture seule" badge. */
  fallback?:  ReactNode;
  /** When true, renders nothing instead of the fallback on deny. */
  silent?:    boolean;
}

export function PermissionGuard({
  children,
  fallback,
  silent = false,
  ...opts
}: PermissionGuardProps) {
  const allowed = usePermission(opts);

  if (allowed) return <>{children}</>;

  if (silent) return null;

  return (
    <>
      {fallback ?? <ReadOnlyBadge />}
    </>
  );
}

// ─── Default fallback badge ───────────────────────────────────────────────────

export function ReadOnlyBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
      style={{
        fontSize:        "9px",
        fontWeight:      600,
        color:           "#94a3b8",
        backgroundColor: "#f1f5f9",
        border:          "1px solid #e2e8f0",
        whiteSpace:      "nowrap",
      }}
    >
      <Lock style={{ width: 9, height: 9 }} />
      Lecture seule
    </span>
  );
}

// ─── Director-only guard shorthand ────────────────────────────────────────────

export function DirectorOnly({
  children,
  silent = false,
}: { children: ReactNode; silent?: boolean }) {
  return (
    <PermissionGuard requireRole="director" silent={silent}>
      {children}
    </PermissionGuard>
  );
}
