// Gym Coach service worker: makes the site installable and usable offline.
// Network-first for everything, so new routines are never hidden behind the cache; the cache is only the offline
// fallback. Bump CACHE when SHELL changes.
// GitHub Pages sends max-age=600, so fetches use cache: 'no-cache' (revalidate with the ETag; a 304 is cheap) and a
// new release shows on the next open instead of up to 10 minutes later.
const CACHE = 'gym-coach-v2';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'player.js', 'mascot.js', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/apple-touch-icon.png',
  'data/exercises.json', 'data/routines.json', 'data/lines.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (request.method !== 'GET' || (url.origin !== location.origin && !fonts)) return;
  e.respondWith(fetch(request, fonts ? {} : { cache: 'no-cache' })
    .then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(request, copy)); }
      return res;
    })
    .catch(() => caches.match(request, { ignoreSearch: true })
      .then((hit) => hit || (request.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
