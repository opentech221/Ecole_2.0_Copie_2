const CACHE_VERSION = "ecole2-pwa-v3";
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const SYNC_DB_NAME = "ecole2-sync-db";
const SYNC_STORE_NAME = "request-queue";
const NOTIFICATION_SYNC_TAG = "notifications-write-sync";

const APP_SHELL_URLS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-192-maskable.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![APP_SHELL_CACHE, STATIC_CACHE, API_CACHE].includes(key))
            .map((key) => caches.delete(key)),
        ),
      ),
      replayQueuedRequests(),
    ]),
  );
  self.clients.claim();
});

function openSyncDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SYNC_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
        db.createObjectStore(SYNC_STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function queueRequest(request) {
  const db = await openSyncDb();
  const bodyText = request.method === "GET" ? null : await request.clone().text();
  const headers = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  await new Promise((resolve, reject) => {
    const transaction = db.transaction(SYNC_STORE_NAME, "readwrite");
    const store = transaction.objectStore(SYNC_STORE_NAME);
    store.add({
      url: request.url,
      method: request.method,
      headers,
      bodyText,
      createdAt: Date.now(),
    });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  if (self.registration.sync) {
    try {
      await self.registration.sync.register(NOTIFICATION_SYNC_TAG);
    } catch {
      // Ignore unsupported sync registration errors.
    }
  }
}

async function readQueuedRequests() {
  const db = await openSyncDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SYNC_STORE_NAME, "readonly");
    const store = transaction.objectStore(SYNC_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function deleteQueuedRequest(id) {
  const db = await openSyncDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SYNC_STORE_NAME, "readwrite");
    transaction.objectStore(SYNC_STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function replayQueuedRequests() {
  const queued = await readQueuedRequests();
  for (const item of queued) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.bodyText,
      });

      if (response.ok) {
        await deleteQueuedRequest(item.id);
      }
    } catch {
      // Stop replay when still offline.
      break;
    }
  }
}

function isNavigationRequest(request) {
  return request.mode === "navigate";
}

function isStaticAssetRequest(request, url) {
  return (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font" ||
    url.pathname.startsWith("/assets/")
  );
}

function isSensitiveRequest(request, url) {
  if (request.headers.has("authorization")) return true;

  const path = url.pathname;
  if (path.includes("/auth/v1/")) return true;
  if (path.includes("/rest/v1/")) return true;
  if (path.includes("/storage/v1/object/sign/")) return true;

  return false;
}

function isApiRequest(request, url) {
  return request.method === "GET" && (url.pathname.includes("/api/") || url.pathname.includes("/functions/v1/"));
}

function isNotificationWriteRequest(request, url) {
  if (!["POST", "PATCH"].includes(request.method)) return false;
  return (
    url.pathname.includes("/functions/v1/notifications-server/api/notifications") ||
    url.pathname.includes("/functions/v1/notifications-server/api/push/") ||
    url.pathname.includes("/functions/v1/notifications-server/notifications-server/api/notifications") ||
    url.pathname.includes("/functions/v1/notifications-server/notifications-server/api/push/")
  );
}

self.addEventListener("sync", (event) => {
  if (event.tag === NOTIFICATION_SYNC_TAG) {
    event.waitUntil(replayQueuedRequests());
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "REPLAY_NOTIFICATION_QUEUE") {
    event.waitUntil(replayQueuedRequests());
  }
});

self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  const title = payload.title || "Ecole 2.0";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "Nouvelle activité disponible.",
      tag: payload.tag || "ecole2-notification",
      data: payload.data || { actionUrl: "/notifications" },
      icon: payload.icon || "/icons/icon-192.png",
      badge: payload.badge || "/icons/icon-192.png",
      requireInteraction: Boolean(payload.requireInteraction),
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const actionUrl = event.notification.data?.actionUrl || "/notifications";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(actionUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(actionUrl);
      }
      return undefined;
    }),
  );
});

async function networkFirst(request, fallbackResponse) {
  try {
    return await fetch(request);
  } catch {
    if (fallbackResponse) return fallbackResponse;
    throw new Error("Network unavailable");
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return;
  }

  if (isNotificationWriteRequest(request, url)) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request.clone());
        } catch {
          await queueRequest(request.clone());
          return new Response(JSON.stringify({ ok: true, queued: true, offline: true }), {
            status: 202,
            headers: { "Content-Type": "application/json" },
          });
        }
      })(),
    );
    return;
  }

  if (request.method !== "GET") return;

  if (isNavigationRequest(request)) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const shell = await caches.open(APP_SHELL_CACHE);
          shell.put("/index.html", fresh.clone());
          return fresh;
        } catch {
          const shell = await caches.match("/index.html");
          if (shell) return shell;
          return caches.match("/offline.html");
        }
      })(),
    );
    return;
  }

  if (isSensitiveRequest(request, url)) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          return new Response(JSON.stringify({ error: "Réseau indisponible" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        }
      })(),
    );
    return;
  }

  if (isStaticAssetRequest(request, url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);

        const networkPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => null);

        if (cached) {
          event.waitUntil(networkPromise);
          return cached;
        }

        const networkResponse = await networkPromise;
        if (networkResponse) return networkResponse;

        return caches.match("/offline.html");
      })(),
    );
    return;
  }

  if (isApiRequest(request, url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(API_CACHE);
        try {
          const fresh = await fetch(request);
          if (fresh.ok) {
            cache.put(request, fresh.clone());
          }
          return fresh;
        } catch {
          const cached = await cache.match(request);
          if (cached) return cached;
          return new Response(JSON.stringify({ error: "Hors ligne" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        }
      })(),
    );
  }
});
