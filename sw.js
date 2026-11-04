// L&L Fashion — funciona sin internet.
// Cuando cambies index.html, sube el número de versión para que los teléfonos se actualicen.
const VERSION = "llf-v16";
const ARCHIVOS = ["./", "index.html", "manifest.json", "favicon.ico", "icons/favicon-16.png", "icons/favicon-32.png", "icons/icon-96.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-192.png", "icons/maskable-512.png", "icons/apple-touch-icon.png", "icons/atajo-venta.png", "icons/atajo-clientes.png", "icons/atajo-inventario.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Letras de Google y la librería de PDF: se guardan la primera vez para usarlas sin internet
  if (url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com") || url.hostname === "cdnjs.cloudflare.com") {
    e.respondWith(caches.open(VERSION).then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      try { const r = await fetch(req); if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; } catch (err) { return new Response("", { status: 504 }); }
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // La app: primero intenta internet (para recibir mejoras), si no hay, usa la copia guardada
  e.respondWith(
    fetch(req).then(r => { if (r.ok) { const copia = r.clone(); caches.open(VERSION).then(c => c.put(req, copia)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || (req.mode === "navigate" ? caches.match("index.html") : new Response("", { status: 504 }))))
  );
});
