const SHELL_CACHE = "fit-shell-v2";
const STATIC_CACHE = "fit-static-v2";
const OFFLINE_FALLBACK_URL = "/offline.html";
const PRECACHE_URLS = [OFFLINE_FALLBACK_URL, "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => ![SHELL_CACHE, STATIC_CACHE].includes(cacheName))
          .map((cacheName) => caches.delete(cacheName)),
      );

      if ("navigationPreload" in self.registration) {
        await self.registration.navigationPreload.enable();
      }

      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(event));
    return;
  }

  if (shouldCacheStaticAsset(request, url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function handleNavigationRequest(event) {
  try {
    const preloadResponse = await event.preloadResponse;

    if (preloadResponse) {
      return preloadResponse;
    }

    return await fetch(event.request);
  } catch {
    const cachedResponse = await caches.match(OFFLINE_FALLBACK_URL);

    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response("Offline", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}

function shouldCacheStaticAsset(request, url) {
  if (url.pathname.startsWith("/api/")) {
    return false;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    return true;
  }

  if (url.pathname === "/manifest.webmanifest" || url.pathname === "/icon.svg") {
    return true;
  }

  return ["style", "script", "font", "image"].includes(request.destination);
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }

      return response;
    })
    .catch(() => undefined);

  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await networkPromise;

  if (networkResponse) {
    return networkResponse;
  }

  return Response.error();
}
