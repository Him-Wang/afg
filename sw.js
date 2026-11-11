/* ADV 静态资源缓存：二次打开秒开（stale-while-revalidate）
   部署更新后，缓存会在下一次访问后台刷新；如需强制刷新，改 VERSION 即可。 */
const VERSION = 'adv-2026-11-11-b';
const PRECACHE = ['./', './index.html', './css/style.css', './js/app.js'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(req, { ignoreSearch: false });
    const network = fetch(req).then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => cached);
    /* 有缓存先给缓存（秒开），同时后台更新 */
    return cached || network;
  })());
});
