// Bloquevilla: guarda el juego en el celular para jugar sin internet.
// Con internet siempre baja la versión nueva; sin internet usa la guardada.
// También guarda la letra (Google Fonts) para que se vea igual sin conexión.
const CACHE = 'bloquevilla-v1';
const FILES = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];
const FONTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const own = url.origin === location.origin;
  const font = FONTS.includes(url.hostname);
  if (!own && !font) return;               // Supabase (ranking, estadísticas) va directo a la red
  if (own && url.pathname.startsWith('/devlog/')) return;
  const isPage = req.mode === 'navigate';
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (font) {                              // la letra casi no cambia: primero la guardada
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
      return res;
    }
    try {
      const res = await fetch(req);
      if (res.ok) cache.put(isPage ? '/' : req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(isPage ? '/' : req, { ignoreSearch: true });
      if (hit) return hit;
      throw err;
    }
  })());
});
