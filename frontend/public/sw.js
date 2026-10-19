// ORCA Custom Service Worker
const CACHE_NAME_STATIC = "orca-static-v1.0.0";
const CACHE_NAME_API = "orca-api-v1.0.0";
const OFFLINE_URL = "/offline.html";

const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/icon.svg",
  "/manifest.webmanifest",
  "/robots.txt",
];

// Install: precache critical assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME_STATIC).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: purge stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME_STATIC && key !== CACHE_NAME_API) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: attach custom headers to cached Response clone
async function createCachedApiResponse(response) {
  const blob = await response.blob();
  const headers = new Headers(response.headers);
  headers.set("x-orca-cached", "true");
  headers.set("x-orca-cached-at", new Date().toISOString());

  return new Response(blob, {
    status: response.status,
    statusText: response.statusText,
    headers: headers,
  });
}

// Fetch handler
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Navigation requests: Network-first with 3s timeout -> cache -> offline.html
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Navigation timeout")), 3000)
          );
          const networkPromise = fetch(request);
          return await Promise.race([networkPromise, timeoutPromise]);
        } catch (err) {
          const cachedShell = await caches.match("/index.html");
          if (cachedShell) return cachedShell;
          const offlinePage = await caches.match(OFFLINE_URL);
          if (offlinePage) return offlinePage;
          return new Response("Offline - ORCA Marine Assistant", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          });
        }
      })()
    );
    return;
  }

  // 2. Network-only: POST, PUT, DELETE, chat streaming, auth endpoints
  if (
    request.method !== "GET" ||
    url.pathname.includes("/chat/") ||
    url.pathname.includes("/auth/") ||
    url.pathname.includes("/admin/")
  ) {
    return; // Pass through to default network
  }

  // 3. API caching for select read-only endpoints
  const isCacheableApi =
    url.pathname.startsWith("/api/v1/risk/") ||
    url.pathname.startsWith("/api/v1/advisories/") ||
    url.pathname.startsWith("/api/v1/dashboard/overview/") ||
    url.pathname.startsWith("/api/v1/locations/");

  if (isCacheableApi) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME_API);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return await createCachedApiResponse(cachedResponse);
          }
          return new Response(
            JSON.stringify({
              detail: "You are currently offline. Telemetry is unavailable.",
              code: "offline",
            }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      })()
    );
    return;
  }

  // 4. Static assets (JS, CSS, images, fonts): Cache-first with stale-while-revalidate
  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse.ok) {
            caches.open(CACHE_NAME_STATIC).then((cache) => {
              cache.put(request, networkResponse);
            });
          }
          return networkResponse;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
  }
});

// Message listener: clear caches on logout or skip waiting
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_API_CACHE") {
    caches.delete(CACHE_NAME_API);
  } else if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
