/* MileVault service worker — app shell caching + offline fallback.
   Balances and transactions are never served from cache as "live" data:
   the mock/live data layer reads them fresh; only static assets are cached. */
const VERSION = "mv-v1";
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;
const OFFLINE = "/app/offline";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(PAGES).then((c) => c.addAll([OFFLINE, "/app/icon.svg"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith("/app/")) return;

  // Pages: network first, fall back to cache, then the offline screen
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(PAGES).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then((r) => r || caches.match(OFFLINE))),
    );
    return;
  }
  // Static assets: cache first (they are content-hashed)
  if (url.pathname.startsWith("/app/_next/static/") || /\.(webp|png|svg|woff2|jpg)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => { const copy = res.clone(); caches.open(STATIC).then((c) => c.put(req, copy)); return res; })),
    );
  }
});
