/* ═══════════════════════════════════════════════
   PIETRO & EMILLY — sw.js
   Service Worker · Cache · Offline Support
   ═══════════════════════════════════════════════ */

const CACHE_NAME    = 'pe-cache-v20';
const CACHE_STATIC  = 'pe-static-v20';
const CACHE_DYNAMIC = 'pe-dynamic-v20';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css?v=20',
  '/css/components.css?v=20',
  '/css/modals.css?v=20',
  '/css/animations.css?v=20',
  '/css/stickers.css?v=20',
  '/js/config.js?v=20',
  '/js/ui.js?v=20',
  '/js/music.js?v=20',
  '/js/stickers.js?v=20',
  '/js/experience.js?v=20',
  '/js/app.js?v=20',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=DM+Sans:wght@300;400&display=swap',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(() => console.warn('[SW] Falha ao cachear:', url))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_STATIC && k !== CACHE_DYNAMIC)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.hostname.includes('firebasejs') ||
      url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('cloudinary.com') ||
      url.hostname.includes('imgbb.com') ||
      url.hostname.includes('themoviedb.org') ||
      url.hostname.includes('youtube.com') ||
      url.hostname.includes('nominatim.openstreetmap.org') ||
      url.hostname.includes('tile.openstreetmap.org') ||
      url.hostname.includes('cdnjs.cloudflare.com') ||
      url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    return;
  }

  // Network First — sempre busca versão nova
  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_DYNAMIC);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const fallback = await caches.match('/index.html');
    return fallback || new Response('Offline', { status: 503 });
  }
}
