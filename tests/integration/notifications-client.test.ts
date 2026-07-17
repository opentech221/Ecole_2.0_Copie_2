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
    expect(new Headers(init?.headers).get("apikey")).toBeTruthy();
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

  it("récupère le statut push", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({
        pushConfigured: true,
        vapidPublicKey: "public-key",
        subscriptionEnabled: true,
        hasSubscription: true,
        syncSupported: true,
      }), {
        headers: { "content-type": "application/json" },
      }),
    );

    const { notificationsClient } = await import("@/modules/notifications/api/notificationsClient");
    const result = await notificationsClient.getPushStatus("11111111-1111-4111-8111-111111111111");

    expect(result.pushConfigured).toBe(true);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/api/push/status");
  });

  it("échoue proprement si la session est absente", async () => {
    getSession.mockResolvedValue({ data: { session: null } });

    const { notificationsClient } = await import("@/modules/notifications/api/notificationsClient");

    await expect(
      notificationsClient.getUnreadCount(),
    ).rejects.toThrow("Session expirée, reconnectez-vous.");

    expect(fetch).not.toHaveBeenCalled();
  });

  it("propage le message d'erreur API quand fourni", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "tenantId requis" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      }),
    );

    const { notificationsClient } = await import("@/modules/notifications/api/notificationsClient");

    await expect(
      notificationsClient.getPushStatus("11111111-1111-4111-8111-111111111111"),
    ).rejects.toThrow("tenantId requis");
  });

  it("falls back to generic error message when backend payload is not JSON", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response("gateway timeout", {
        status: 504,
        headers: { "content-type": "text/plain" },
      }),
    );

    const { notificationsClient } = await import("@/modules/notifications/api/notificationsClient");

    await expect(
      notificationsClient.getTenants(),
    ).rejects.toThrow("Erreur API notifications");
  });
});
