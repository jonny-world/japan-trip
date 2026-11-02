/* Offline service worker. Everything the app needs is cached at install, so it runs in airplane mode. */
const VERSION = 'd7ea48218e1b';
const CACHE = `japan-${VERSION}`;
const FONT_CACHE = 'japan-fonts';
const ASSETS = [
  "index.html",
  "app.css?v=d7ea48218e1b",
  "app.js?v=d7ea48218e1b",
  "data.bin?v=d7ea48218e1b",
  "manifest.webmanifest",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/icon.svg"
];
const FONT_CSS = [
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@400;500;700&display=swap",
  "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&display=swap&text=%E5%8F%B7%E6%97%A5%E6%9C%AC%E7%95%AA%E8%A9%B1%E9%9B%BB"
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Bypass the HTTP cache so a fresh build never mixes with stale files.
    await cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' })));
    try { await cacheFonts(); } catch (e) { /* fonts fall back to system faces offline */ }
    await self.skipWaiting();
  })());
});

async function cacheFonts() {
  const cache = await caches.open(FONT_CACHE);
  for (const href of FONT_CSS) {
    let res = await cache.match(href);
    if (!res) {
      res = await fetch(href, { mode: 'cors', cache: 'reload' });
      if (!res.ok) continue;
      await cache.put(href, res.clone());
    }
    const css = await res.text();
    const files = [...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]);
    await Promise.all(files.map(async (url) => {
      if (await cache.match(url)) return;
      const r = await fetch(url, { mode: 'cors' });
      if (r.ok) await cache.put(url, r);
    }));
  }
}

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('japan-') && key !== CACHE && key !== FONT_CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      if (req.mode === 'navigate') {
        return (await cache.match('index.html', { ignoreSearch: true })) || fetch(req);
      }
      return (await cache.match(req, { ignoreSearch: true })) || fetch(req);
    })());
    return;
  }

  if (url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com') {
    event.respondWith((async () => {
      const cache = await caches.open(FONT_CACHE);
      const hit = await cache.match(req.url);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') cache.put(req.url, res.clone());
      return res;
    })());
  }
});
