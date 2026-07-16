import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession,
    },
  },
}));

describe("adminConsoleClient", () => {
  beforeEach(() => {
    vi.resetModules();
    getSession.mockResolvedValue({ data: { session: { access_token: "token-123" } } });
    vi.stubGlobal("fetch", vi.fn());
  });

  it("calls summary endpoint with bearer token", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ tenant: { id: "t1", name: "Tenant", slug: "tenant", status: "active", currency: "XOF" }, userRole: "owner", kpis: { mrr: { label: "MRR", value: 1, tone: "good" }, arr: { label: "ARR", value: 1, tone: "neutral" }, monthRevenue: { label: "M", value: 1, tone: "good" }, successPayments: { label: "S", value: 1, tone: "good" }, failedPayments: { label: "F", value: 1, tone: "warn" }, unpaid: { label: "U", value: 1, tone: "warn" }, recoveryRate: { label: "R", value: 80, tone: "good" }, churnRate: { label: "C", value: 4, tone: "neutral" }, estimatedLtv: { label: "L", value: 1, tone: "neutral" } }, charts: { revenue7d: [], revenue30d: [], revenue12m: [], byTenant: [], byLevel: [], byPaymentMethod: [] }, alerts: [] }), { headers: { "content-type": "application/json" } }));

    const { adminConsoleClient } = await import("@/modules/admin/api/adminConsoleClient");
    const result = await adminConsoleClient.getSummary("11111111-1111-4111-8111-111111111111");

    expect(result.tenant.name).toBe("Tenant");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0]?.[1];
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer token-123");
  });

  it("requests CSV exports", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(new Response("id\n1", { headers: { "content-type": "text/csv" } }));

    const { adminConsoleClient } = await import("@/modules/admin/api/adminConsoleClient");
    const result = await adminConsoleClient.exportPaymentsCsv("11111111-1111-4111-8111-111111111111", { status: "paid" });

    expect(result).toContain("id");
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("payments/export");
  });
});