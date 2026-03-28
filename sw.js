/* ═══════════════════════════════════════════════
   PIETRO & EMILLY — sw.js
   Service Worker · Cache · Offline Support
   ═══════════════════════════════════════════════ */

const CACHE_NAME    = 'pe-cache-v10';
const CACHE_STATIC  = 'pe-static-v2';
const CACHE_DYNAMIC = 'pe-dynamic-v2';

// Recursos que sempre ficam em cache (shell da app)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/components.css',
  '/css/modals.css',
  '/css/animations.css',
  '/js/config.js',
  '/js/ui.js',
  '/js/music.js',
  '/js/app.js',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=DM+Sans:wght@300;400&display=swap',
];

// ── INSTALL ──────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      // Tenta cachear cada recurso individualmente — ignora falhas
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(() => console.warn('[SW] Falha ao cachear:', url))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ─────────────────────────────────────
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

// ── FETCH ────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições não-GET e APIs externas (Firebase, Cloudinary, ImgBB, etc.)
  if (request.method !== 'GET') return;
  if (url.hostname.includes('firebasejs') ||
      url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('cloudinary.com') ||
      url.hostname.includes('imgbb.com') ||
      url.hostname.includes('themoviedb.org') ||
      url.hostname.includes('youtube.com') ||
      url.hostname.includes('nominatim.openstreetmap.org')) {
    return; // Deixa passar direto — sem interceptar
  }

  // Estratégia: Cache First para assets estáticos
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Estratégia: Network First para navegação (HTML)
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Estratégia: Stale While Revalidate para o resto
  event.respondWith(staleWhileRevalidate(request));
});

// ── Helpers de estratégia ──────────────────────

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/css/') ||
    url.pathname.startsWith('/js/')  ||
    url.pathname.startsWith('/assets/') ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  );
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_STATIC);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    return new Response('Recurso não disponível offline.', { status: 503 });
  }
}

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
    // Fallback para o index.html em modo offline
    const fallback = await caches.match('/index.html');
    return fallback || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache  = await caches.open(CACHE_DYNAMIC);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached || (await fetchPromise) || new Response('Offline', { status: 503 });
}
