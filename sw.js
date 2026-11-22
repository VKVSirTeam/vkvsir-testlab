/* VKV Sir Test Lab service worker: installable app, fast repeat visits, offline shell.
   Pages: network first (always fresh), cached copy when offline.
   Versioned files (app.js?v=, app.css?v=, fonts, icons, KaTeX): cache first.
   Database / API calls (supabase.co) are never cached: scores and answers must be live. */
const SHELL = 'vkv-shell-v1', ASSETS = 'vkv-assets-v1';
const START = ['/', '/manifest.webmanifest', '/icon-192.png', '/favicon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(START)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== SHELL && k !== ASSETS).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function trimAssets() {
  return caches.open(ASSETS).then((c) => c.keys().then((ks) => { if (ks.length > 80) return Promise.all(ks.slice(0, ks.length - 80).map((k) => c.delete(k))); }));
}

self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || /supabase\.co$/.test(u.hostname)) return;
  // pages: network first, fall back to the cached page or the cached home shell
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then((res) => {
      const copy = res.clone(); if (res.ok || res.status === 404) caches.open(SHELL).then((c) => c.put(r, copy));
      return res;
    }).catch(() => caches.match(r).then((m) => m || caches.match('/'))));
    return;
  }
  const versioned = u.search.includes('v=') || /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname) || /cdn\.jsdelivr\.net$/.test(u.hostname) || /\.(png|svg|webp|woff2?)$/.test(u.pathname);
  if (versioned) {
    e.respondWith(caches.match(r).then((m) => m || fetch(r).then((res) => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(ASSETS).then((c) => c.put(r, copy)).then(trimAssets); }
      return res;
    })));
  }
});
