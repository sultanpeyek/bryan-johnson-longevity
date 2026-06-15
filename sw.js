// ponytail: cache-first SW — opens instantly & offline. HTML is network-first (auto-updates); bump CACHE only to flush old static assets.
const CACHE = 'bj-longevity-v10';
const ASSETS = [
  './', './index.html', './avatar.jpg',
  './manifest.webmanifest', './icon-192.png', './icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const req = e.request;
  // network-first for the page itself: a fresh deploy lands without bumping CACHE.
  // offline / network fail → fall back to the cached page.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }
  // cache-first for static assets (icons, avatar, manifest) — fast & offline.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
