/*
 * Acceptify AI service worker — what makes the site an installable app.
 *
 * Rule: the app must never show an old version. So:
 * - Pages always come from the network. They are never cached (they carry a
 *   student's own data, and a stale page is exactly the "old version" we
 *   promised won't happen). Offline, a small "no connection" page is shown.
 * - /_next/static files are cached forever: their names contain a content
 *   hash, so a new deploy uses new names and old files are simply unused.
 * - API calls, auth and everything else are not touched at all.
 *
 * Bump VERSION to drop every cache on the next launch.
 */
const VERSION = "v1";
const STATIC_CACHE = `acceptify-static-${VERSION}`;
const OFFLINE_CACHE = `acceptify-offline-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const STATIC_LIMIT = 300;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, "/icons/icon-192.png"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("acceptify-") && key !== STATIC_CACHE && key !== OFFLINE_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL, { cacheName: OFFLINE_CACHE }).then((res) => res || Response.error()),
      ),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
    trim(cache);
  }
  return response;
}

// Old deploys' files pile up otherwise; drop the oldest beyond the limit.
async function trim(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - STATIC_LIMIT; i++) await cache.delete(keys[i]);
}
