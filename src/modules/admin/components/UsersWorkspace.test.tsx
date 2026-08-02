import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { UsersWorkspace } from "./UsersWorkspace";
import type {
  AdminPlatformProfilesResult,
  AdminUserDetail,
  AdminUserFilters,
  AdminUsersPageResult,
} from "../types";

const filters: AdminUserFilters = {
  page: 1,
  pageSize: 10,
  search: "",
  status: "all",
  role: "all",
  sortBy: "created_at",
  sortOrder: "desc",
};

const usersPage: AdminUsersPageResult = {
  page: 1,
  pageSize: 10,
  total: 1,
  rows: [
    {
      userId: "user_1",
      fullName: "Awa Diop",
      email: "awa@example.com",
      phone: null,
      roleCode: "director",
      status: "active",
      countryCode: "SN",
      acquisitionChannel: "direct",
      lastSeenAt: "2026-07-31T08:30:00.000Z",
      suspendedReason: null,
      suspendedAt: null,
      reactivatedAt: null,
      createdAt: "2026-07-01T08:00:00.000Z",
    },
  ],
};

const platformProfiles: AdminPlatformProfilesResult = {
  total: 1,
  rows: [
    {
      userId: "platform_1",
      email: "platform@example.com",
      fullName: "Compte plateforme",
      role: "teacher",
      status: "active",
      createdAt: "2026-07-02T09:00:00.000Z",
    },
  ],
};

const selectedUser: AdminUserDetail = {
  ...usersPage.rows[0],
  scope: "tenant",
  profileRole: "director",
  tenantAccount: {
    tenantId: "tenant_1",
    status: "active",
    countryCode: "SN",
    acquisitionChannel: "direct",
    suspendedReason: null,
    suspendedAt: null,
    reactivatedAt: null,
    lastSeenAt: "2026-07-31T08:30:00.000Z",
    createdAt: "2026-07-01T08:00:00.000Z",
  },
  metadata: {},
  auditTrail: [
    {
      id: "audit_1",
      action: "user.created",
      severity: "info",
      metadata: {},
      createdAt: "2026-07-01T08:00:00.000Z",
    },
  ],
};

function renderWorkspace(overrides: Partial<React.ComponentProps<typeof UsersWorkspace>> = {}) {
  const onSelectUser = vi.fn();
  const onCreateUser = vi.fn();
  const onUpdateUser = vi.fn();
  const onSuspendUser = vi.fn();
  const onReactivateUser = vi.fn();
  const onResetPassword = vi.fn();
  const onDeleteUser = vi.fn();
  const onImportCsv = vi.fn();
  const onExportCsv = vi.fn();

  const utils = render(
    <UsersWorkspace
      filters={filters}
      setFilters={vi.fn()}
      data={usersPage}
      loading={false}
      usersErrorMessage={null}
      platformProfiles={platformProfiles}
      platformProfilesLoading={false}
      platformProfilesErrorMessage={null}
      selectedUserId={selectedUser.userId}
      onSelectUser={onSelectUser}
      selectedUser={selectedUser}
      detailLoading={false}
      busy={false}
      onCreateUser={onCreateUser}
      onUpdateUser={onUpdateUser}
      onSuspendUser={onSuspendUser}
      onReactivateUser={onReactivateUser}
      onResetPassword={onResetPassword}
      onDeleteUser={onDeleteUser}
      onImportCsv={onImportCsv}
      onExportCsv={onExportCsv}
      {...overrides}
    />,
  );

  return {
    onSelectUser,
    onCreateUser,
    onUpdateUser,
    onSuspendUser,
    onReactivateUser,
    onResetPassword,
    onDeleteUser,
    onImportCsv,
    onExportCsv,
    ...utils,
  };
}

describe("UsersWorkspace", () => {
  it("affiche la table et sélectionne un utilisateur au clic", async () => {
    const user = userEvent.setup();
    const { onSelectUser } = renderWorkspace();

    expect(screen.getByText("Utilisateurs rattachés au tenant")).toBeInTheDocument();
    expect(screen.getAllByText("Awa Diop").length).toBeGreaterThan(0);
    expect(screen.getByText("Profils Supabase non rattachés")).toBeInTheDocument();

    const row = screen.getAllByRole("row").find((element) => element.textContent?.includes("Awa Diop"));
    expect(row).toBeDefined();
    await user.click(row!);

    expect(onSelectUser).toHaveBeenCalledWith("user_1");
  });

  it("déclenche la suspension depuis le panneau de détail", async () => {
    const user = userEvent.setup();
    const { onSuspendUser } = renderWorkspace();

    await user.click(screen.getByRole("button", { name: /suspendre/i }));

    expect(onSuspendUser).toHaveBeenCalledWith({
      userId: "user_1",
      reason: "Suspension administrative",
    });
  });
});
