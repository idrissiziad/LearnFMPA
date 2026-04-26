const CACHE_NAME = "learnfmpa-v5";
const STATIC_CACHE = "learnfmpa-static-v5";
const API_CACHE = "learnfmpa-api-v5";
const PAGE_CACHE = "learnfmpa-pages-v5";

const API_CACHE_TTL = 300000;
const PAGE_CACHE_TTL = 600000;

function isNavigationRequest(request) {
  return (
    request.mode === "navigate" ||
    (request.method === "GET" &&
      request.headers.get("accept")?.includes("text/html"))
  );
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/favicon/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".ttf") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".webp")
  );
}

function isCacheableApi(url) {
  return (
    url.pathname === "/api/progress" ||
    url.pathname === "/api/statistics"
  );
}

async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames
      .filter(
        (name) =>
          name !== CACHE_NAME &&
          name !== STATIC_CACHE &&
          name !== API_CACHE &&
          name !== PAGE_CACHE
      )
      .map((name) => caches.delete(name))
  );
}

function lazyPrecachePages() {
  const pagesToCache = ["/", "/dashboard", "/modules", "/login"];
  caches.open(PAGE_CACHE).then((cache) => {
    for (const url of pagesToCache) {
      cache.match(url).then((cached) => {
        if (!cached) {
          fetch(url, { mode: "navigate" })
            .then((response) => {
              if (response.ok) {
                cache.put(url, response);
              }
            })
            .catch(() => {});
        }
      });
    }
  });
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      cleanupOldCaches(),
      caches.open(STATIC_CACHE),
      caches.open(API_CACHE),
      caches.open(PAGE_CACHE),
    ])
  );
  self.clients.claim();
  self.clients.matchAll().then((clients) => {
    if (clients.length > 0) {
      setTimeout(lazyPrecachePages, 30000);
    }
  });
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  if (url.origin !== self.location.origin) return;

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  if (isNavigationRequest(request)) {
    event.respondWith(
      (async () => {
        const pageCache = await caches.open(PAGE_CACHE);
        const cached = await pageCache.match(request);

        if (cached) {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                pageCache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => null);

          return cached;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            pageCache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          const fallback = await caches.match(request);
          if (fallback) return fallback;
          return caches.match("/");
        }
      })()
    );
    return;
  }

  if (isCacheableApi(url)) {
    event.respondWith(
      (async () => {
        const apiCache = await caches.open(API_CACHE);
        const cached = await apiCache.match(request);

        if (cached) {
          const timestamp = cached.headers.get("sw-cache-timestamp");
          const age = timestamp ? Date.now() - parseInt(timestamp) : Infinity;

          if (age < API_CACHE_TTL) {
            return cached;
          }
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            const headers = new Headers(networkResponse.headers);
            headers.set("sw-cache-timestamp", Date.now().toString());
            const body = await networkResponse.clone().text();
            const cachedResponse = new Response(body, {
              status: networkResponse.status,
              statusText: networkResponse.statusText,
              headers,
            });
            apiCache.put(request, cachedResponse);
          }
          return networkResponse;
        } catch (error) {
          if (cached) return cached;
          throw error;
        }
      })()
    );
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match("/"));
    })
  );
});