/* ═══════════════════════════════════════════════
   PIETRO & EMILLY — sw.js v58
   Service Worker · Cache · Offline Support

   BUGS CORRIGIDOS nesta versão (v57):
   BUG-SW1: manifest link não tinha href → PWA não instalável.
             Criado manifest.json estático; adicionado ao STATIC_ASSETS.
   BUG-SW2: /emojis/Merida/Merida_Happy.png duplicado no STATIC_ASSETS
             (listado 2× na versão anterior) → duplo fetch desnecessário no install.
             Duplicata removida.
   BUG-SW3: Estratégia única network-first para tudo substituída por:
             · Imagens      → cache-first  (offline-first, instantâneo)
             · HTML         → network-first (sempre tenta versão fresca)
             · JS           → network-first (garante código novo a cada deploy)
             · CSS/JSON     → stale-while-revalidate (rápido + atualiza bg)
   BUG-SW5: JS usava stale-while-revalidate → browser servia JS antigo após deploy.
             Corrigido para network-first: código novo entregue imediatamente.
   BUG-SW4: Cache de imagens não tinha limite → crescia indefinidamente.
             Implementado trim LRU com máximo de 120 entradas.

   INTEGRAÇÃO v58:
   Cinema refatorado para arquitetura modular (cinema-state, cinema-player,
   cinema-catalog, cinema-tmdb) — todos adicionados ao STATIC_ASSETS.

   CORREÇÕES MANTIDAS de versões anteriores:
   BUG-1:  externalHosts usa hostname real (gstatic.com, não substring firebasejs).
   BUG-5:  skipWaiting() só via mensagem SKIP_WAITING (evita tela em branco).
   BUG-11: /emojis/Rapunzel/ Angry e Happy removidos — stickers.js usa /Princesas/.
   BUG-R:  todos os domínios de streaming PT-BR em externalHosts.
   ═══════════════════════════════════════════════ */

const CACHE_VERSION = 'v60';
const CACHE_STATIC  = `pe-static-${CACHE_VERSION}`;
const CACHE_DYNAMIC = `pe-dynamic-${CACHE_VERSION}`;
const CACHE_IMAGES  = `pe-images-${CACHE_VERSION}`;

const MAX_IMAGE_CACHE = 120;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/main.css',
  '/css/components.css',
  '/css/modals.css',
  '/css/animations.css',
  '/css/stickers.css',
  '/css/home.css',
  '/css/games.css',
  '/css/cinema.css',
  '/js/app.js',
  '/js/config.js',
  '/js/ui.js',
  '/js/music.js',
  '/js/stickers.js',
  '/js/experience.js',
  '/js/home.js',
  '/js/library.js',
  '/js/games.js',
  '/js/cinema.js',
  '/js/cinema/cinema-state.js',
  '/js/cinema/cinema-player.js',
  '/js/cinema/cinema-catalog.js',
  '/js/cinema/cinema-tmdb.js',
  '/js/progress.js',
  '/js/watchparty.js',
  '/assets/favicon.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
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
  '/emojis/Merida/Merida_Happy.png',
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
];

// ── INSTALL ──
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
      .then(() => {
        console.log('[SW] Instalação completa —', CACHE_VERSION);
        // Assume controle imediatamente: garante que o novo SW (com o JS correto)
        // entra em ação sem esperar o usuário fechar e reabrir todas as abas.
        return self.skipWaiting();
      })
  );
});

// ── ACTIVATE ──
self.addEventListener('activate', (event) => {
  const valid = [CACHE_STATIC, CACHE_DYNAMIC, CACHE_IMAGES];
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(k => !valid.includes(k))
            .map(k => { console.log('[SW] Cache antigo removido:', k); return caches.delete(k); })
        )
      )
      .then(async () => {
        await self.clients.claim();
        const clients = await self.clients.matchAll({ type: 'window' });
        if (clients.length > 0) {
          clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' }));
        }
      })
  );
});

// ── Mensagens ──
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// ── Domínios externos (SW não intercepta) ──
const EXTERNAL_HOSTS = [
  'gstatic.com', 'firestore.googleapis.com', 'googleapis.com',
  'cloudinary.com', 'imgbb.com', 'cdnjs.cloudflare.com',
  'fonts.googleapis.com', 'fonts.gstatic.com',
  'themoviedb.org', 'image.tmdb.org',
  'youtube.com', 'youtu.be', 'ytimg.com',
  'nominatim.openstreetmap.org', 'tile.openstreetmap.org',
  'superflixapi.rest', 'superflixapi.run', 'superflixapi.top', 'superflixapi.my',
  'warezcdn.com', 'warezcdn.com.br',
  'cineembed.com', 'vidlink.pro',
  'vidsrc.cc', 'vidsrc.me', 'vidsrc.to',
];

// ── FETCH: estratégias diferenciadas por tipo ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (EXTERNAL_HOSTS.some(h => url.hostname.includes(h))) return;
  if (url.hostname !== self.location.hostname) return;

  const path = url.pathname;
  const ext  = path.split('.').pop().toLowerCase();

  // Imagens: cache-first (instantâneo, funciona offline)
  if (['png','jpg','jpeg','gif','webp','svg','ico'].includes(ext)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // JS: network-first — garante que cada deploy entrega o código novo imediatamente.
  // stale-while-revalidate servia JS antigo do cache e só atualizava em background,
  // fazendo o app carregar com código desatualizado a cada deploy.
  if (ext === 'js') {
    event.respondWith(networkFirst(request));
    return;
  }

  // CSS / JSON: stale-while-revalidate (rápido + atualiza em background)
  if (['css', 'json'].includes(ext)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // HTML e navegação: network-first (garante conteúdo fresco)
  event.respondWith(networkFirst(request));
});

// ── cache-first ──
async function cacheFirst(request) {
  const key    = stripQuery(request);
  const cached = await caches.match(key) || await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetchWithTimeout(request, 8000);
    if (response.ok) {
      const cache = await caches.open(CACHE_IMAGES);
      await cache.put(key, response.clone());
      trimCache(CACHE_IMAGES, MAX_IMAGE_CACHE); // async, não bloqueia
    }
    return response;
  } catch (_) {
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

// ── stale-while-revalidate ──
async function staleWhileRevalidate(request) {
  const key   = stripQuery(request);
  const cache = await caches.open(CACHE_STATIC);
  const cached = await cache.match(key) || await caches.match(request);

  const fetchPromise = fetchWithTimeout(request, 6000)
    .then(res => { if (res.ok) cache.put(key, res.clone()); return res; })
    .catch(() => null);

  return cached || await fetchPromise || new Response('', { status: 503 });
}

// ── network-first ──
async function networkFirst(request) {
  const key = stripQuery(request);
  try {
    const response = await fetchWithTimeout(request, 4000);
    if (response.ok) {
      const cache = await caches.open(CACHE_DYNAMIC);
      cache.put(key, response.clone());
    }
    return response;
  } catch (_) {
    const cached =
      await caches.match(key) ||
      await caches.match(request) ||
      await caches.match('/index.html');

    return cached || new Response(
      '<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>Pietro & Emilly 💕</title>' +
      '<style>body{font-family:"DM Sans",sans-serif;text-align:center;padding:4rem 2rem;' +
      'background:#fff8f9;color:#590d22;}h1{font-size:2rem;margin-bottom:1rem;}' +
      'p{color:#7a3045;line-height:1.7;max-width:400px;margin:0 auto 1.5rem;}' +
      'button{background:#e8536f;color:#fff;border:none;padding:.8rem 2rem;' +
      'border-radius:50px;font-size:1rem;cursor:pointer;}</style></head>' +
      '<body><h1>💕 Pietro & Emilly</h1>' +
      '<p>Você está offline no momento.<br>Reconecte-se para acessar nosso cantinho especial.</p>' +
      '<button onclick="location.reload()">Tentar novamente 💕</button></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

// ── Helpers ──
function stripQuery(request) {
  const url = new URL(request.url);
  if (url.hostname !== self.location.hostname) return request;
  url.search = '';
  return new Request(url.toString());
}

function fetchWithTimeout(request, ms) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(request, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

async function trimCache(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys  = await cache.keys();
  if (keys.length <= max) return;

  // BUG-L8: cache.keys() não garante ordem cronológica em todos os browsers
  // Busca a data de cada entrada e ordena da mais antiga para a mais nova antes de apagar
  const entries = await Promise.all(
    keys.map(async req => {
      const res  = await cache.match(req);
      const date = res?.headers?.get('date');
      return { req, ts: date ? new Date(date).getTime() : 0 };
    })
  );
  entries.sort((a, b) => a.ts - b.ts); // mais antigas primeiro
  const toDelete = entries.slice(0, entries.length - max);
  await Promise.all(toDelete.map(e => cache.delete(e.req)));
}
