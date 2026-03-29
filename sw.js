/* ═══════════════════════════════════════════════
   PIETRO & EMILLY — sw.js v25
   Service Worker · Cache · Offline Support
   ═══════════════════════════════════════════════ */

// Versão do cache — altere este valor ao fazer deploy para invalidar o cache antigo
const CACHE_VERSION  = 'v37';
const CACHE_STATIC   = `pe-static-${CACHE_VERSION}`;
const CACHE_DYNAMIC  = `pe-dynamic-${CACHE_VERSION}`;

// Assets estáticos — SEM query strings (?v=)
// O próprio CACHE_VERSION garante atualização quando há novo deploy
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/components.css',
  '/css/modals.css',
  '/css/animations.css',
  '/css/stickers.css',
  '/css/home.css',
  '/js/app.js',
  '/js/config.js',
  '/js/ui.js',
  '/js/music.js',
  '/js/stickers.js',
  '/js/experience.js',
  '/js/home.js',
  '/assets/favicon.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  // Não pré-cacheia emojis individuais (muitos arquivos) — carregados sob demanda
];

// ── INSTALL: pré-cacheia assets estáticos ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then((cache) =>
        Promise.allSettled(
          STATIC_ASSETS.map(url =>
            cache.add(url).catch(() => console.warn('[SW] Falha ao cachear:', url))
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: remove caches de versões anteriores ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(k => k !== CACHE_STATIC && k !== CACHE_DYNAMIC)
            .map(k => {
              console.log('[SW] Removendo cache antigo:', k);
              return caches.delete(k);
            })
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── FETCH: ignora requisições externas, usa network-first para locais ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Deixa o browser lidar diretamente com APIs externas
  const externalHosts = [
    'firebasejs', 'firestore.googleapis.com', 'googleapis.com',
    'cloudinary.com', 'imgbb.com', 'themoviedb.org',
    'youtube.com', 'youtu.be', 'nominatim.openstreetmap.org',
    'tile.openstreetmap.org', 'cdnjs.cloudflare.com',
    'fonts.googleapis.com', 'fonts.gstatic.com',
  ];
  if (externalHosts.some(h => url.hostname.includes(h))) return;

  event.respondWith(networkFirstWithTimeout(request));
});

// ── Network-first com timeout de 4s ──
// Se a rede responder em tempo: usa e atualiza o cache
// Se timeout ou offline: serve do cache
async function networkFirstWithTimeout(request) {
  // Normaliza a URL removendo query strings dos assets locais
  // para evitar mismatch entre ?v=22 no HTML e URLs sem query no cache
  const cacheKey = stripQueryString(request);

  try {
    const networkResponse = await fetchWithTimeout(request, 4000);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_DYNAMIC);
      cache.put(cacheKey, networkResponse.clone());
    }
    return networkResponse;

  } catch (_) {
    // Tenta cache com URL normalizada primeiro, depois original
    const cached =
      await caches.match(cacheKey) ||
      await caches.match(request)  ||
      await caches.match('/index.html');

    return cached || new Response('Offline — sem conexão', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

// Remove query string de URLs locais para unificar chaves de cache
// FIX: não passa mode:'navigate' para new Request — é inválido e derruba o SW inteiro
function stripQueryString(request) {
  const url = new URL(request.url);
  if (url.hostname !== self.location.hostname) return request;
  url.search = '';
  return new Request(url.toString());
}

// fetch com timeout via AbortController
function fetchWithTimeout(request, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(request, { signal: controller.signal })
    .finally(() => clearTimeout(timer));
}
