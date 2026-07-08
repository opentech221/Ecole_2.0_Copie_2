const CACHE_VERSION = "ecole2-pwa-v1";
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;

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
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![APP_SHELL_CACHE, STATIC_CACHE, API_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

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
  if (request.method !== "GET") return;

  const url = new URL(request.url);

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
    event.respondWith(fetch(request));
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
