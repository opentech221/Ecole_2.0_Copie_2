import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, renderHook, screen } from "@testing-library/react";

import { PermissionGuard, usePermission } from "./PermissionGuard";
import { useAuthContext } from "../app/contexts/AuthContext";

vi.mock("../app/contexts/AuthContext", () => ({
  useAuthContext: vi.fn(),
}));

type MockProfile = {
  role: "teacher" | "director";
  classId?: string;
};

function setAuth(profile: MockProfile | null) {
  vi.mocked(useAuthContext).mockReturnValue({
    session: null,
    user: null,
    profile: profile as never,
    loading: false,
    error: null,
    refreshProfile: async () => {},
  });
}

describe("PermissionGuard access rules", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("denies access when profile is missing", () => {
    setAuth(null);

    const { result } = renderHook(() => usePermission());

    expect(result.current).toBe(false);
  });

  it("allows director access regardless of class ownership", () => {
    setAuth({ role: "director", classId: "CE1" });

    const { result } = renderHook(() => usePermission({ ownerClassId: "CM2" }));

    expect(result.current).toBe(true);
  });

  it("allows teacher access only for matching class", () => {
    setAuth({ role: "teacher", classId: "CE2" });

    const allowed = renderHook(() => usePermission({ ownerClassId: "CE2" }));
    const denied = renderHook(() => usePermission({ ownerClassId: "CM1" }));

    expect(allowed.result.current).toBe(true);
    expect(denied.result.current).toBe(false);
  });

  it("enforces director-only sections", () => {
    setAuth({ role: "teacher", classId: "CE2" });

    const { result } = renderHook(() => usePermission({ requireRole: "director" }));

    expect(result.current).toBe(false);
  });

  it("renders fallback on deny and children on allow", () => {
    setAuth({ role: "teacher", classId: "CE1" });

    const { rerender } = render(
      <PermissionGuard ownerClassId="CM2">
        <span>Secret action</span>
      </PermissionGuard>,
    );

    expect(screen.queryByText("Secret action")).toBeNull();
    expect(screen.getByText("Lecture seule")).toBeInTheDocument();

    rerender(
      <PermissionGuard ownerClassId="CE1">
        <span>Secret action</span>
      </PermissionGuard>,
    );

    expect(screen.getByText("Secret action")).toBeInTheDocument();
  });
});
