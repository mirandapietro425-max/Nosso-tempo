/* ═══════════════════════════════════════════════
   PIETRO & EMILLY — sw.js v38
   Service Worker · Cache · Offline Support
   ═══════════════════════════════════════════════ */

// Versão do cache — altere este valor ao fazer deploy para invalidar o cache antigo
const CACHE_VERSION  = 'v38';
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
  '/js/library.js',
  '/js/games.js',
  '/css/games.css',
  '/assets/favicon.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  // Emojis das figurinhas — pré-cacheados para abertura instantânea do mood picker
  '/emojis/Ariel/Ariel_Happy.png',
  '/emojis/Ariel/Ariel_Sad.png',
  '/emojis/Ariel/Ariel_Scared.png',
  '/emojis/Bela/Bela_Angry.png',
  '/emojis/Bela/Bela_Happy.png',
  '/emojis/Bela/Bela_Sad.png',
  '/emojis/Cinderela/Cinderela_Happy.png',
  '/emojis/Cinderela/Cinderela_Sad.png',
  '/emojis/Cinderela/Cinderela_Scared.png',
  '/emojis/Crepusculo/Alice_Happy.png',
  '/emojis/Crepusculo/Bella_Angry.png',
  '/emojis/Crepusculo/Bella_Happy.png',
  '/emojis/Crepusculo/Bella_Sad.png',
  '/emojis/Crepusculo/Edward_Angry.png',
  '/emojis/Crepusculo/Edward_Happy.png',
  '/emojis/Crepusculo/Edward_Sad.png',
  '/emojis/Crepusculo/Emmett_Happy.png',
  '/emojis/Crepusculo/Jacob_Angry.png',
  '/emojis/Crepusculo/Jacob_Happy.png',
  '/emojis/Crepusculo/Jacob_Sad.png',
  '/emojis/Crepusculo/Rosalie_Angry.png',
  '/emojis/Marvel/Spider-Man_Angry.png',
  '/emojis/Marvel/Spider-Man_Happy.png',
  '/emojis/Marvel/Spider-Man_Sad.png',
  '/emojis/Merida/Merida_Angry.png',
  '/emojis/Merida/Merida_Scared.png',
  '/emojis/Princes/Hercules_Angry.png',
  '/emojis/Princes/Hercules_Happy.png',
  '/emojis/Princes/Hercules_Sad.png',
  '/emojis/Princes/Jim_Angry.png',
  '/emojis/Princes/Jim_Happy.png',
  '/emojis/Princes/Jim_Sad.png',
  '/emojis/Princes/Milo_Angry.png',
  '/emojis/Princes/Milo_Happy.png',
  '/emojis/Princes/Quasimodo_Angry.png',
  '/emojis/Princes/Quasimodo_Happy.png',
  '/emojis/Princes/Quasimodo_Sad.png',
  '/emojis/Princes/Tarzan_Angry.png',
  '/emojis/Princes/Tarzan_Happy.png',
  '/emojis/Princes/Tarzan_Sad.png',
  '/emojis/Princesas/Anna_Angry.png',
  '/emojis/Princesas/Anna_Happy.png',
  '/emojis/Princesas/Anna_Sad.png',
  '/emojis/Princesas/Elsa_Angry.png',
  '/emojis/Princesas/Elsa_Happy.png',
  '/emojis/Princesas/Elsa_Sad.png',
  '/emojis/Princesas/Merida_Happy.png',
  '/emojis/Princesas/Merida_Sad.png',
  '/emojis/Princesas/Moana_Angry.png',
  '/emojis/Princesas/Moana_Happy.png',
  '/emojis/Princesas/Moana_Sad.png',
  '/emojis/Princesas/Rapunzel_Angry.png',
  '/emojis/Princesas/Rapunzel_Happy.png',
  '/emojis/Princesas/Rapunzel_Sad.png',
  '/emojis/Princesas/Raya_Angry.png',
  '/emojis/Princesas/Raya_Happy.png',
  '/emojis/Princesas/Raya_Sad.png',
  '/emojis/Princesas/Tiana_Happy.png',
  '/emojis/Princesas/Tiana_Happy_2.png',
  '/emojis/Princesas/Tiana_Sad.png',
  '/emojis/Rapunzel/Rapunzel_Scared.png',
  '/emojis/Merida/Merida_Happy.png',
  '/emojis/Rapunzel/Rapunzel_Angry.png',
  '/emojis/Rapunzel/Rapunzel_Happy.png',
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
      // Assume controle imediatamente após instalar — garante que novos deploys
      // sempre sirvam os arquivos atualizados, sem ficar preso no SW antigo.
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
      .then(async () => {
        // Assume controle de todas as abas imediatamente
        await self.clients.claim();
        // Notifica as abas que há atualização — elas recarregam suavemente
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
      })
  );
});

// ── FETCH: ignora requisições externas, usa network-first para locais ──

// ── Aceita SKIP_WAITING sob demanda (botão "Atualizar" na página) ──
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
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
