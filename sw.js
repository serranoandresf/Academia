/* ACADEMIA — service worker: deja la app disponible sin conexión.
   Solo cachea los archivos de la app. Tus cursos y tu progreso NO pasan por aquí (viven en IndexedDB y localStorage). */
const V = "academia-app-v23"; // sube este número cuando publiques una versión nueva
const ARCHIVOS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("academia-app-") && k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Responde desde la caché al instante y actualiza en segundo plano; solo archivos de la propia app
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== self.location.origin) return;
  e.respondWith(
    caches.open(V).then((c) => c.match(e.request, { ignoreSearch: true }).then((guardado) => {
      const red = fetch(e.request).then((r) => { if (r && r.ok && r.status === 200) c.put(e.request, r.clone()).catch(() => {}); return r; })
        .catch(() => guardado || (e.request.mode === "navigate" ? c.match("./index.html") : Response.error()));
      return guardado || red;
    })),
  );
});
