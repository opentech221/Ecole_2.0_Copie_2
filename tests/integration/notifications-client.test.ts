import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession,
    },
  },
}));

describe("notificationsClient", () => {
  beforeEach(() => {
    vi.resetModules();
    getSession.mockResolvedValue({ data: { session: { access_token: "token-abc" } } });
    vi.stubGlobal("fetch", vi.fn());
  });

  it("récupère le compteur non lu", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ unreadCount: 7 }), {
        headers: { "content-type": "application/json" },
      }),
    );

    const { notificationsClient } = await import("@/modules/notifications/api/notificationsClient");
    const result = await notificationsClient.getUnreadCount();

    expect(result.unreadCount).toBe(7);
    const init = fetchMock.mock.calls[0]?.[1];
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer token-abc");
  });

  it("marque tout comme lu", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true, updated: 2 }), {
        headers: { "content-type": "application/json" },
      }),
    );

    const { notificationsClient } = await import("@/modules/notifications/api/notificationsClient");
    const result = await notificationsClient.markAllAsRead("11111111-1111-4111-8111-111111111111");

    expect(result.ok).toBe(true);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("read-all");
  });
});
