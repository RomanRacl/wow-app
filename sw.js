/* Průvodce Azerothem – service worker (offline režim) */
const VER = "azg-v3";
const CORE = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VER).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER && k !== "azg-icons").map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  // ikony z Wowheadu – uložit pro offline
  if (url.hostname === "wow.zamimg.com" && url.pathname.includes("/icons/")) {
    e.respondWith(caches.open("azg-icons").then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      try { const res = await fetch(req); if (res.ok || res.type === "opaque") c.put(req, res.clone()); return res; } catch (err) { return hit || Response.error(); }
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // stránka: nejdřív síť (aby se aktualizovala), offline z cache
  if (req.mode === "navigate" || url.pathname.endsWith(".html")) {
    e.respondWith(fetch(req).then(res => { const cp = res.clone(); caches.open(VER).then(c => c.put("./index.html", cp)); return res; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
