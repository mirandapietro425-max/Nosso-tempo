/* ═══════════════════════════════════════════════
   cinema-player.js — Player, iframe, fallback
   Pietro & Emilly · v65
   ═══════════════════════════════════════════════ */

import { startTracking, stopTracking, getResumeTime } from '../progress.js';
import { cinemaState }  from './cinema-state.js';
import { sanitizeTmdb, fetchSources, PLAYLT_ENABLED } from './cinema-playlt.js';

export const PLAYER_SERVERS = [
  /* ══════════════════════════════════════════════════════════════
     GRUPO 1 — PT-BR Dublado (prioridade máxima)
     SuperFlixAPI: maior CDN BR, banco de dados com filmes, séries,
     animes, doramas. Múltiplos domínios espelho para resiliência.
     URL: /filme/{tmdbId}/ e /serie/{tmdbId}/{season}/{episode}/
     Atualizado: abril 2026 — domínios ativos verificados.
  ══════════════════════════════════════════════════════════════ */
  {
    name: '🇧🇷 Dub 1', label: 'SuperFlixAPI .rest — Dublado PT-BR', type: 'dub',
    movie : (id)       => `https://superflixapi.rest/filme/${id}/`,
    tv    : (id, s, e) => `https://superflixapi.rest/serie/${id}/${s}/${e}/`,
    hasParams: false,
  },
  {
    name: '🇧🇷 Dub 2', label: 'SuperFlixAPI .top — Dublado PT-BR', type: 'dub',
    movie : (id)       => `https://superflixapi.top/filme/${id}/`,
    tv    : (id, s, e) => `https://superflixapi.top/serie/${id}/${s}/${e}/`,
    hasParams: false,
  },
  {
    name: '🇧🇷 Dub 3', label: 'SuperFlixAPI .dev — Dublado PT-BR', type: 'dub',
    movie : (id)       => `https://superflixapi.dev/filme/${id}/`,
    tv    : (id, s, e) => `https://superflixapi.dev/serie/${id}/${s}/${e}/`,
    hasParams: false,
  },
  {
    name: '🇧🇷 Dub 4', label: 'SuperFlixAPI .help — Dublado PT-BR', type: 'dub',
    movie : (id)       => `https://superflixapi.help/filme/${id}/`,
    tv    : (id, s, e) => `https://superflixapi.help/serie/${id}/${s}/${e}/`,
    hasParams: false,
  },
  {
    name: '🇧🇷 Dub 5', label: 'SuperFlixAPI .life — Dublado PT-BR (novo)', type: 'dub',
    movie : (id)       => `https://superflixapi.life/filme/${id}/`,
    tv    : (id, s, e) => `https://superflixapi.life/serie/${id}/${s}/${e}/`,
    hasParams: false,
  },
  {
    name: '🇧🇷 Dub 6', label: 'SuperFlixAPI .link — Dublado PT-BR (novo)', type: 'dub',
    movie : (id)       => `https://superflixapi.link/filme/${id}/`,
    tv    : (id, s, e) => `https://superflixapi.link/serie/${id}/${s}/${e}/`,
    hasParams: false,
  },
  {
    name: '🇧🇷 Dub 7', label: 'SuperFlixAPI .buzz — Dublado PT-BR (novo)', type: 'dub',
    movie : (id)       => `https://superflixapi.buzz/filme/${id}/`,
    tv    : (id, s, e) => `https://superflixapi.buzz/serie/${id}/${s}/${e}/`,
    hasParams: false,
  },
  /* ══════════════════════════════════════════════════════════════
     GRUPO 2 — Multi-idioma (auto dub/leg, multi-servidor interno)
     Servidores internacionais que agregam múltiplas fontes.
     Geralmente oferecem opção de troca de fonte internamente.
  ══════════════════════════════════════════════════════════════ */
  {
    name: '🌐 Multi 1', label: 'VidSrc.mov — Multi servidor 1080p', type: 'dub',
    movie : (id)       => `https://vidsrc.mov/embed/movie/${id}`,
    tv    : (id, s, e) => `https://vidsrc.mov/embed/tv/${id}/${s}/${e}`,
    hasParams: false,
  },
  {
    name: '🌐 Multi 2', label: 'VidSrc.cc — Legendas PT-BR via API', type: 'dub',
    movie : (id)       => `https://vidsrc.cc/v2/embed/movie/${id}`,
    tv    : (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
    hasParams: false,
  },
  {
    name: '🌐 Multi 3', label: 'VidSrc.icu — Multi servidor estável', type: 'dub',
    movie : (id)       => `https://vidsrc.icu/embed/movie/${id}`,
    tv    : (id, s, e) => `https://vidsrc.icu/embed/tv/${id}/${s}/${e}`,
    hasParams: false,
  },
  {
    name: '🌐 Multi 4', label: 'VidSrc.store — Multi servidor (novo 2026)', type: 'dub',
    movie : (id)       => `https://vidsrc.store/embed/movie/${id}`,
    tv    : (id, s, e) => `https://vidsrc.store/embed/tv/${id}/${s}/${e}`,
    hasParams: false,
  },
  {
    name: '🌐 Multi 5', label: 'VidSrc.online — Multi servidor (novo 2026)', type: 'dub',
    movie : (id)       => `https://vidsrc.online/embed/movie/${id}`,
    tv    : (id, s, e) => `https://vidsrc.online/embed/tv/${id}/${s}/${e}`,
    hasParams: false,
  },
  {
    name: '🌐 Multi 6', label: 'MultiEmbed/SuperEmbed — Multi idioma', type: 'dub',
    movie : (id)       => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tv    : (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
    hasParams: true,
  },
  {
    name: '🌐 Multi 7', label: 'Videasy — 4K multi idioma', type: 'dub',
    movie : (id)       => `https://player.videasy.net/movie/${id}`,
    tv    : (id, s, e) => `https://player.videasy.net/tv/${id}/${s}/${e}`,
    hasParams: false,
  },
  {
    name: '🌐 Multi 8', label: 'AutoEmbed — Multi idioma autoplay', type: 'dub',
    movie : (id)       => `https://player.autoembed.cc/embed/movie/${id}?autoplay=true`,
    tv    : (id, s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}?autoplay=true`,
    hasParams: true,
  },
  /* ══════════════════════════════════════════════════════════════
     GRUPO 3 — Legendado PT-BR / multi-fonte
     Players focados em legendas, com mais opções de idioma.
  ══════════════════════════════════════════════════════════════ */
  {
    name: '🔤 Leg 1', label: 'VidLink — Legendado PT-BR', type: 'sub',
    movie : (id)       => `https://vidlink.pro/movie/${id}?autoplay=true&lang=pt-BR&primaryColor=e8536f`,
    tv    : (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?autoplay=true&lang=pt-BR&primaryColor=e8536f`,
    hasParams: true,
  },
  {
    name: '🔤 Leg 2', label: 'VidSrc.me — Legendado clássico', type: 'sub',
    movie : (id)       => `https://vidsrc.me/embed/movie?tmdb=${id}`,
    tv    : (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
    hasParams: true,
  },
  {
    name: '🔤 Leg 3', label: 'VidSrc.xyz — Legendado TMDB', type: 'sub',
    movie : (id)       => `https://vidsrc.xyz/embed/movie?tmdb=${id}`,
    tv    : (id, s, e) => `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
    hasParams: true,
  },
  {
    name: '🔤 Leg 4', label: 'Embed.su — Multi-servidor legendado', type: 'sub',
    movie : (id)       => `https://embed.su/embed/movie/${id}`,
    tv    : (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
    hasParams: false,
  },
  {
    name: '🔤 Leg 5', label: 'VidSrc.rip — Legendado', type: 'sub',
    movie : (id)       => `https://vidsrc.rip/embed/movie/${id}`,
    tv    : (id, s, e) => `https://vidsrc.rip/embed/tv/${id}/${s}/${e}`,
    hasParams: false,
  },
  {
    name: '🔤 Leg 6', label: 'VidBinge (MoviesAPI) — Multi-fonte (novo 2026)', type: 'sub',
    movie : (id)       => `https://www.vidbinge.to/embed/movie/${id}`,
    tv    : (id, s, e) => `https://www.vidbinge.to/embed/tv/${id}/${s}/${e}`,
    hasParams: false,
  },
  {
    name: '🔤 Leg 7', label: '2Embed — Multi-fonte legendado', type: 'sub',
    movie : (id)       => `https://www.2embed.stream/embed/movie/${id}`,
    tv    : (id, s, e) => `https://www.2embed.stream/embed/tv/${id}/${s}/${e}`,
    hasParams: false,
  },
  {
    name: '🔤 Leg 8', label: 'SuperEmbed — Multi idioma', type: 'sub',
    movie : (id)       => `https://www.superembed.stream/embed/movie/${id}`,
    tv    : (id, s, e) => `https://www.superembed.stream/embed/tv/${id}/${s}/${e}`,
    hasParams: false,
  },
];
const TIMEOUT_DUB_MS   = 28_000;  // SuperFlixAPI pode demorar 20-25s na 1ª carga — 7 espelhos
const TIMEOUT_SUB_MS   = 32_000;  // Players internacionais multi-fonte — 8 opções legendadas
const WATCHDOG_TICK_MS = 3_000;   // intervalo do watchdog (P6: reduzido de 5s → 3s)
const WATCHDOG_MAX_MS  = 18_000;  // P6: reduzido de 40s → 18s — early-exit cobre os primeiros 6s

/* ── P9: Anti-spam / auto-switch cap ─────────── */
const AUTO_SWITCH_DEBOUNCE_MS = 3_000;  // mínimo 3s entre trocas automáticas
const MAX_AUTO_SWITCHES       = 4;      // máximo 4 trocas automáticas por item
let   _lastAutoSwitchTs       = 0;      // timestamp da última troca automática (módulo-level)

/* ── P10: Session Failed Servers Blacklist ────── */
// Servidores que falharam nesta sessão de item — não re-tentar automaticamente.
// Resetado ao abrir novo item (serverIdx=0) ou ao clicar "Tentar do início".
const _failedThisSession = new Set();

/* ── F4: Adaptive Watchdog Timeout Map ───────── */
// Per-server adaptive timeout overrides. Faster servers get shorter timeouts.
// Values never go below the existing TIMEOUT_DUB_MS/TIMEOUT_SUB_MS defaults.
const SERVER_TIMEOUT_MAP = {
  // Fast mirrors (superflixapi variants already proven fast)
  'superflixapi.rest' : 22_000,
  'superflixapi.top'  : 22_000,
  // Standard international multi-servers
  'vidsrc.mov'        : 28_000,
  'vidsrc.cc'         : 30_000,
  'vidsrc.icu'        : 30_000,
  // Slower aggregators
  'multiembed.mov'    : 35_000,
  'player.videasy.net': 35_000,
};

function _getAdaptiveTimeout(serverIdx) {
  const server = PLAYER_SERVERS[serverIdx];
  if (!server) return TIMEOUT_SUB_MS;
  // Extract hostname from a sample URL to look up the map
  try {
    const sampleUrl = server.movie ? server.movie('1') : null;
    if (sampleUrl) {
      const host = new URL(sampleUrl).hostname;
      const override = SERVER_TIMEOUT_MAP[host];
      if (override) return override;
    }
  } catch (_) { /* ignore parse errors */ }
  return server.type === 'dub' ? TIMEOUT_DUB_MS : TIMEOUT_SUB_MS;
}

/* ── F7: Timer Registry helper ───────────────── */
function _registerTimer(timerId) {
  if (timerId == null) return timerId;
  cinemaState.activeTimers.push(timerId);
  return timerId;
}

/* ══════════════════════════════════════════════════════════════
   P4 — MEMÓRIA DE SERVIDOR BOM
   Persiste { tmdbId: { idx, ts } } no localStorage.
   TTL de 7 dias, máximo 50 entradas.
══════════════════════════════════════════════════════════════ */
const LS_LAST_GOOD_SRV  = 'cinema_last_good_srv_v1';
const LAST_GOOD_TTL_MS  = 7 * 24 * 60 * 60 * 1000;
const LAST_GOOD_MAX     = 50;

function getLastGoodServer(tmdbId) {
  if (!tmdbId) return null;
  try {
    const raw = localStorage.getItem(LS_LAST_GOOD_SRV);
    if (!raw) return null;
    const map   = JSON.parse(raw);
    const entry = map[String(tmdbId)];
    if (!entry) return null;
    if (Date.now() - entry.ts > LAST_GOOD_TTL_MS) return null;
    if (entry.idx >= PLAYER_SERVERS.length)        return null;
    return entry.idx;
  } catch (_) { return null; }
}

function saveLastGoodServer(tmdbId, serverIdx) {
  if (!tmdbId) return;
  try {
    const raw  = localStorage.getItem(LS_LAST_GOOD_SRV);
    const map  = raw ? JSON.parse(raw) : {};
    map[String(tmdbId)] = { idx: serverIdx, ts: Date.now() };
    const entries = Object.entries(map);
    if (entries.length > LAST_GOOD_MAX) {
      // Descarta os mais antigos
      entries.sort((a, b) => a[1].ts - b[1].ts);
      const trimmed = Object.fromEntries(entries.slice(-LAST_GOOD_MAX));
      localStorage.setItem(LS_LAST_GOOD_SRV, JSON.stringify(trimmed));
    } else {
      localStorage.setItem(LS_LAST_GOOD_SRV, JSON.stringify(map));
    }
  } catch (_) {}
}

function _invalidateLastGoodServer(tmdbId) {
  if (!tmdbId) return;
  try {
    const raw = localStorage.getItem(LS_LAST_GOOD_SRV);
    if (!raw) return;
    const map = JSON.parse(raw);
    delete map[String(tmdbId)];
    localStorage.setItem(LS_LAST_GOOD_SRV, JSON.stringify(map));
  } catch (_) {}
}

/* ══════════════════════════════════════════════════════════════
   P1 — SMART SERVER SELECTION
   Pinga os 3 primeiros candidatos via fetch no-cors (cross-origin safe).
   Retorna o índice do mais rápido. Nunca trava a UI — sempre resolve.
   Prioridade: lastGoodServer > ping race > 0.
══════════════════════════════════════════════════════════════ */
const PING_TIMEOUT_MS   = 1200;
const PING_CANDIDATES   = 3;

async function selectBestServer(tmdbId) {
  // P4: servidor lembrado tem prioridade — mas só se não falhou nesta sessão
  const remembered = getLastGoodServer(tmdbId);
  if (remembered !== null && !_failedThisSession.has(remembered)) return remembered;

  // P10: candidatos excluem servidores que já falharam nesta sessão
  const candidates = PLAYER_SERVERS
    .map((server, idx) => ({ server, idx }))
    .filter(({ idx }) => !_failedThisSession.has(idx))
    .slice(0, PING_CANDIDATES);

  if (candidates.length === 0) return 0; // todos falharam → tenta do 0 mesmo

  const ctrls = [];

  const pings = candidates.map(({ idx }) =>
    new Promise(resolve => {
      const ctrl  = new AbortController();
      ctrls.push(ctrl);
      const timer = setTimeout(() => { ctrl.abort(); resolve(null); }, PING_TIMEOUT_MS);
      const server  = PLAYER_SERVERS[idx];
      const testUrl = server?.movie ? server.movie('1') : null;
      if (!testUrl) { clearTimeout(timer); resolve(null); return; }
      fetch(testUrl, { mode: 'no-cors', signal: ctrl.signal, cache: 'no-store' })
        .then(() => { clearTimeout(timer); resolve(idx); })
        .catch(() => { clearTimeout(timer); resolve(null); });
    })
  );

  return new Promise(resolve => {
    let settled = false;
    let pending = pings.length;
    pings.forEach(p => p.then(idx => {
      pending--;
      if (!settled && idx !== null) {
        settled = true;
        resolve(idx);
        ctrls.forEach(c => { try { c.abort(); } catch (_) {} });
      } else if (!settled && pending === 0) {
        // Todos falharam ou foram filtrados — pega o primeiro não-bloqueado
        const fallback = PLAYER_SERVERS.findIndex((_, i) => !_failedThisSession.has(i));
        resolve(fallback >= 0 ? fallback : 0);
      }
    }));
  });
}

/* ══════════════════════════════════════════════════════════════
   P2 — EARLY EXIT TIMER (6s)
   Se o skeleton ainda estiver presente após 6s → troca servidor.
   Cancela automaticamente no onload do iframe.
══════════════════════════════════════════════════════════════ */
function _startEarlyExit(playerEl, item, epIdx, onWatched) {
  // P9: se já disparou automaticamente neste item → não repetir
  // (O watchdog cobre os servidores seguintes com WATCHDOG_MAX_MS)
  if (cinemaState.earlyExitFired) return;

  _clearEarlyExit();
  cinemaState.earlyExitTimer = _registerTimer(setTimeout(() => {
    cinemaState.earlyExitTimer = null;
    if (!cinemaState.isModalOpen || cinemaState.currentItem !== item) return;
    const skeleton = document.getElementById('cinema-player-skeleton');
    if (!skeleton) return; // carregou — tudo certo

    // Marca como disparado — próximos servidores não terão early-exit automático
    cinemaState.earlyExitFired = true;

    // Mostra mensagem antes de trocar (300ms para o usuário ver)
    const txt = skeleton.querySelector('.cinema-player-loading-text');
    if (txt) txt.textContent = '⚡ tentando outro servidor…';
    _registerTimer(setTimeout(() => {
      if (!cinemaState.isModalOpen || cinemaState.currentItem !== item) return;
      _advanceOrShowRetry(playerEl, item, epIdx, onWatched);
    }, 300));
  }, 6_000));
}

function _clearEarlyExit() {
  if (cinemaState.earlyExitTimer) {
    clearTimeout(cinemaState.earlyExitTimer);
    cinemaState.earlyExitTimer = null;
  }
}

/* ══════════════════════════════════════════════════════════════
   P7 — SLOW NETWORK UX (4s)
   Muda texto do skeleton para "📶 conexão lenta" se ainda carregando.
══════════════════════════════════════════════════════════════ */
function _startSlowNetworkTimer() {
  _clearSlowNetworkTimer();
  cinemaState.slowNetworkTimer = _registerTimer(setTimeout(() => {
    cinemaState.slowNetworkTimer = null;
    const skeleton = document.getElementById('cinema-player-skeleton');
    if (!skeleton) return;
    const txt = skeleton.querySelector('.cinema-player-loading-text');
    // Não sobrescreve se early-exit já mudou o texto
    if (txt && !txt.textContent.includes('⚡')) {
      txt.textContent = '📶 conexão lenta — aguarde…';
    }
  }, 4_000));
}

function _clearSlowNetworkTimer() {
  if (cinemaState.slowNetworkTimer) {
    clearTimeout(cinemaState.slowNetworkTimer);
    cinemaState.slowNetworkTimer = null;
  }
}


/* ── Helpers ─────────────────────────────────── */

function parseSeasonEpisode(title) {
  if (!title) return [1, 1];
  const m = title.match(/T(\d+)E(\d+)/i);
  return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : [1, 1];
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Construção da URL do player ─────────────── */

export function buildPlayerSrc(item, epIdx, serverIdx) {
  const server    = PLAYER_SERVERS[serverIdx];
  const dynEps    = cinemaState.dynamicEpisodes;
  const isSeries  = !!(item.episodes || item.type === 'series' || dynEps);

  if (server && item.tmdbId) {
    const sep = server.hasParams ? '&' : '?';

    if (isSeries) {
      const episodes = dynEps || item.episodes;
      // BUG-EPCLAMP: clamp defensivo para index fora do array
      const safeIdx  = (episodes && episodes.length > 0)
        ? Math.min(epIdx, episodes.length - 1)
        : 0;
      const ep       = episodes?.[safeIdx] ?? null;
      const s        = ep?.season  ?? null;
      const e        = ep?.episode ?? null;
      const [sf, ef] = (s != null && e != null) ? [s, e] : parseSeasonEpisode(ep?.title);
      const dynEp    = (ep?.season != null && ep?.episode != null)
        ? { season: ep.season, episode: ep.episode }
        : null;
      const rt = getResumeTime(item, safeIdx, dynEp);
      return server.tv(item.tmdbId, sf, ef) + (rt > 0 ? `${sep}t=${rt}` : '');
    }

    const rt = getResumeTime(item, 0);
    return server.movie(item.tmdbId) + (rt > 0 ? `${sep}t=${rt}` : '');
  }

  // YouTube fallback
  const ytId = item.episodes ? item.episodes[epIdx]?.ytId : item.ytId;
  if (!ytId) return null;
  const rt = getResumeTime(item, epIdx);
  return `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&playsinline=1` +
    (rt > 0 ? `&start=${rt}` : '');
}

/* ── Iframe ──────────────────────────────────── */

function createIframe(src, title) {
  const iframe = document.createElement('iframe');
  iframe.src             = src;
  iframe.title           = title || 'Player';
  iframe.frameBorder     = '0';
  iframe.allowFullscreen = true;
  iframe.setAttribute('sandbox',
    'allow-scripts allow-same-origin allow-forms allow-presentation allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-downloads'
  );
  // BUG-1 FIX: NÃO definir referrerPolicy como 'no-referrer'.
  // SuperFlixAPI e outros players BR verificam o Referer — sem ele exibem
  // "ACESSO NÃO AUTORIZADO". O padrão do browser (origin-when-cross-origin)
  // envia a origem corretamente sem expor a URL completa.
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media');
  iframe.style.cssText   = 'width:100%;aspect-ratio:16/9;display:block;';
  return iframe;
}

/* ── Stream nativo (m3u8 / mp4) ──────────────── */

function createStreamPlayer(url, title) {
  const wrap  = document.createElement('div');
  wrap.style.cssText = 'width:100%;aspect-ratio:16/9;background:#000;position:relative;';

  const video = document.createElement('video');
  video.controls    = true;
  video.autoplay    = true;
  video.playsInline = true;
  video.title       = title || 'Player';
  video.style.cssText = 'width:100%;height:100%;display:block;';

  const isHLS = url.includes('.m3u8');
  if (isHLS && !video.canPlayType('application/vnd.apple.mpegurl')) {
    // Carrega hls.js da CDN para browsers sem suporte nativo
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.4.12/hls.min.js';
    script.onload = () => {
      if (window.Hls?.isSupported()) {
        const hls = new window.Hls({ maxBufferLength: 30 });
        hls.loadSource(url);
        hls.attachMedia(video);
        video._hls = hls; // referência para destruição
      } else {
        video.src = url;
      }
    };
    script.onerror = () => {
      // CDN bloqueada (firewall/CSP/offline) — usa src direto como fallback
      console.warn('[Cinema] HLS.js CDN blocked — falling back to direct src');
      video.src = url;
    };
    document.head.appendChild(script);
  } else {
    video.src = url;
  }

  wrap.appendChild(video);
  return wrap;
}

/* ── Watchdog ────────────────────────────────── */

/**
 * BUG-WATCHDOG FIX: inicia um setInterval que verifica a cada 5s se o skeleton
 * ainda está presente. Após WATCHDOG_MAX_MS avança servidor ou exibe retry.
 * Isso cobre o caso de X-Frame-Options/CSP que impede o iframe.onload de disparar.
 */
function _startWatchdog(playerEl, item, epIdx, onWatched) {
  _stopWatchdog();
  cinemaState.watchdogStart = Date.now();
  cinemaState.watchdogTimer = setInterval(() => {
    if (!cinemaState.isModalOpen || cinemaState.currentItem !== item) {
      _stopWatchdog();
      return;
    }
    const skeleton = document.getElementById('cinema-player-skeleton');
    if (!skeleton) {
      // Skeleton foi removido — player carregou normalmente
      _stopWatchdog();
      return;
    }
    const elapsed = Date.now() - cinemaState.watchdogStart;
    if (elapsed >= WATCHDOG_MAX_MS) {
      _stopWatchdog();
      _advanceOrShowRetry(playerEl, item, epIdx, onWatched);
    }
  }, WATCHDOG_TICK_MS);
}

function _stopWatchdog() {
  if (cinemaState.watchdogTimer) {
    clearInterval(cinemaState.watchdogTimer);
    cinemaState.watchdogTimer = null;
  }
  cinemaState.watchdogStart = 0;
}

function _advanceOrShowRetry(playerEl, item, epIdx, onWatched) {
  if (!cinemaState.isModalOpen || cinemaState.currentItem !== item) return;

  // P9 — Debounce: evita spam de troca automática (mín. 3s entre switches)
  const now = Date.now();
  if (now - _lastAutoSwitchTs < AUTO_SWITCH_DEBOUNCE_MS) return;

  // P9 — Cap: após MAX_AUTO_SWITCHES trocas, mostra overlay manual em vez de continuar
  if (cinemaState.autoSwitchCount >= MAX_AUTO_SWITCHES) {
    document.getElementById('cinema-player-skeleton')?.remove();
    showRetryOverlay(playerEl, item, epIdx, onWatched);
    return;
  }

  document.getElementById('cinema-player-skeleton')?.remove();
  // P4: servidor falhou — invalida memória para não tentar de novo na próxima
  _invalidateLastGoodServer(item?.tmdbId);
  // P10: registra falha na blacklist de sessão
  _failedThisSession.add(cinemaState.serverIdx);

  // Avança para o próximo servidor NÃO-falhado
  let nextIdx = cinemaState.serverIdx + 1;
  while (nextIdx < PLAYER_SERVERS.length && _failedThisSession.has(nextIdx)) {
    nextIdx++; // pula servidores que já falharam nesta sessão
  }

  if (nextIdx < PLAYER_SERVERS.length) {
    _lastAutoSwitchTs = now;
    cinemaState.autoSwitchCount += 1;
    cinemaState.serverIdx = nextIdx;
    renderServerPanel();
    buildPlayer(item, epIdx, onWatched);
  } else {
    showRetryOverlay(playerEl, item, epIdx, onWatched);
  }
}

/* ── Destroy ─────────────────────────────────── */

export function destroyPlayer() {
  // F6: idempotent guard — prevent double-destroy
  if (cinemaState.playerDestroyed) return;
  cinemaState.playerDestroyed = true;

  // F7: clear ALL registered timers
  cinemaState.activeTimers.forEach(t => { try { clearTimeout(t); } catch (_) {} });
  cinemaState.activeTimers = [];

  // F2: clear freeze timer
  if (cinemaState.freezeTimer) {
    clearTimeout(cinemaState.freezeTimer);
    cinemaState.freezeTimer = null;
  }

  // P2/P7: clear smart player timers
  _clearEarlyExit();
  _clearSlowNetworkTimer();

  // P5: abort preload ping
  if (cinemaState.preloadCtrl) {
    try { cinemaState.preloadCtrl.abort(); } catch (_) {}
    cinemaState.preloadCtrl = null;
  }

  if (cinemaState.playerTimeout) {
    clearTimeout(cinemaState.playerTimeout);
    cinemaState.playerTimeout = null;
  }
  // BUG-DESTROYPLAYER-BADGE FIX: cancela o badge para não disparar após destroyPlayer
  if (cinemaState.badgeTimeout) {
    clearTimeout(cinemaState.badgeTimeout);
    cinemaState.badgeTimeout = null;
  }
  // Para o watchdog ao destruir o player
  _stopWatchdog();

  const p = document.getElementById('cinema-modal-player');
  if (!p) return;
  // Destrói instância HLS se existir (evita leak de memória)
  p.querySelectorAll('video').forEach(v => {
    if (v._hls) { try { v._hls.destroy(); } catch (_) {} v._hls = null; }
    v.pause();
    v.src = '';
  });
  // Para stream cross-origin antes de limpar o DOM (fix áudio Safari/mobile)
  p.querySelectorAll('iframe').forEach(f => {
    try { f.src = 'about:blank'; } catch (_) {}
  });
  p.innerHTML = '';
}

/* ── UI de erro / retry ──────────────────────── */

// BUG-7 FIX: recebe onWatched como parâmetro para não perder o callback de progresso
function showRetryOverlay(container, item, epIdx, onWatched) {
  const currentName = PLAYER_SERVERS[cinemaState.serverIdx]?.name || 'YouTube';
  container.innerHTML = `
    <div class="cinema-server-overlay">
      <div class="cinema-server-msg">
        <div class="cinema-server-icon">⚡</div>
        <div class="cinema-server-title">Nenhum servidor respondeu</div>
        <div class="cinema-server-sub">Todos os servidores foram testados automaticamente</div>
        <div class="cinema-server-btns">
          <button class="cinema-server-btn cinema-server-btn--primary"
                  id="cinema-reset-btn">🔄 Tentar do início</button>
          <button class="cinema-server-btn cinema-server-btn--secondary"
                  id="cinema-retry-btn">Tentar novamente (${escapeHtml(currentName)})</button>
        </div>
      </div>
    </div>`;
  container.querySelector('#cinema-reset-btn')?.addEventListener('click', () => {
    cinemaState.serverIdx = 0;
    // P10: fresh start — limpa blacklist de sessão e contadores
    _failedThisSession.clear();
    cinemaState.autoSwitchCount = 0;
    cinemaState.earlyExitFired  = false;
    buildPlayer(item, epIdx, onWatched);
  });
  container.querySelector('#cinema-retry-btn')?.addEventListener('click', () => {
    buildPlayer(item, epIdx, onWatched);  // BUG-7 FIX: passa onWatched
  });
}

function showPlayerError(container) {
  container.innerHTML = `
    <div class="cinema-server-overlay">
      <div class="cinema-server-msg">
        <div class="cinema-server-icon">🎬</div>
        <div class="cinema-server-title">Conteúdo indisponível no momento</div>
        <div class="cinema-server-sub">Tente novamente mais tarde</div>
      </div>
    </div>`;
}

/* ── Helper: skeleton de loading ──────────────── */

function _makeSkeleton(text) {
  const skeleton = document.createElement('div');
  skeleton.id        = 'cinema-player-skeleton';
  skeleton.className = 'cinema-player-skeleton';
  skeleton.innerHTML = `
    <div class="cinema-player-loading">
      <div class="cinema-player-spinner"></div>
      <span class="cinema-player-loading-text">${escapeHtml(text)}</span>
    </div>`;
  return skeleton;
}

/* ── Helper: inicia tracking após montar player ── */

function _startTrackingAfterBuild(item, epIdx, ep, onWatched) {
  const dynEp = (ep?.season != null && ep?.episode != null)
    ? { season: ep.season, episode: ep.episode }
    : null;
  startTracking(item, epIdx, (key, watchedItem, eIdx) => {
    const watchKey = (watchedItem.episodes || dynEp)
      ? `${watchedItem.id}_ep${eIdx}`
      : watchedItem.id;
    if (typeof onWatched === 'function') onWatched(watchKey);
  }, dynEp);
}

/* ── buildPlayer — ponto de entrada principal ─── */

export async function buildPlayer(item, epIdx, onWatched) {
  if (!item) return;
  const playerEl = document.getElementById('cinema-modal-player');
  if (!playerEl) return;

  // F1: capture generation snapshot before any async work
  const myGeneration = cinemaState.generation;

  stopTracking();
  destroyPlayer();

  // F6: reset destroyed flag for new build cycle
  cinemaState.playerDestroyed = false;

  // F1: bail if generation changed while we were setting up
  if (myGeneration !== cinemaState.generation) return;

  // Resolve o episódio atual (para séries)
  const dynEps   = cinemaState.dynamicEpisodes;
  const episodes = dynEps || item.episodes;
  const ep       = episodes?.[epIdx] ?? null;

  // ID para a PlayLT: usa contentId do episódio se disponível, senão tmdbId
  const playltId = ep?.contentId ?? item.tmdbId ?? null;

  if (playltId && PLAYLT_ENABLED) {
    _buildFromPlayLT(playerEl, item, epIdx, ep, playltId, onWatched);
    return;
  }

  // P1: Smart Server Selection — mostra skeleton de "preparando" enquanto pinga
  if (item.tmdbId && cinemaState.serverIdx === 0) {
    // Reset debounce timestamp e blacklist — novo item, novas tentativas livres
    _lastAutoSwitchTs = 0;
    _failedThisSession.clear();
    // Só pré-seleciona na primeira tentativa (serverIdx=0), não durante fallback
    playerEl.appendChild(_makeSkeleton('🎬 Preparando player…'));
    let bestIdx = 0;
    try {
      bestIdx = await selectBestServer(item.tmdbId);
    } catch (_) { bestIdx = 0; }
    // F1: bail se geração mudou durante o ping async
    if (myGeneration !== cinemaState.generation) return;
    if (!cinemaState.isModalOpen || cinemaState.currentItem !== item) return;
    // Limpa skeleton de "preparando" antes de montar o real
    document.getElementById('cinema-player-skeleton')?.remove();
    cinemaState.serverIdx = bestIdx;
    renderServerPanel();
  }

  _buildFromServer(playerEl, item, epIdx, ep, onWatched);
}

/* ── PlayLT: busca /sources e renderiza ────────── */

async function _buildFromPlayLT(playerEl, item, epIdx, ep, playltId, onWatched) {
  // F1: snapshot generation at start of async path
  const myGeneration = cinemaState.generation;

  playerEl.appendChild(_makeSkeleton('🎬 Carregando…'));

  // Inicia watchdog também no caminho PlayLT
  _startWatchdog(playerEl, item, epIdx, onWatched);

  let source = null;
  try {
    source = await fetchSources(playltId);
  } catch (err) {
    console.warn('[Cinema] fetchSources threw:', err?.message || err);
  }

  // F1: generation guard — bail if a newer buildPlayer was triggered
  if (myGeneration !== cinemaState.generation) { _stopWatchdog(); return; }

  // Guard: modal ainda aberto com o mesmo item?
  if (!cinemaState.isModalOpen || cinemaState.currentItem !== item) { _stopWatchdog(); return; }
  _stopWatchdog();
  document.getElementById('cinema-player-skeleton')?.remove();

  if (source?.url) {
    if (source.type === 'stream') {
      // Stream direto (m3u8 / mp4) — player nativo
      playerEl.appendChild(createStreamPlayer(source.url, item.title));
    } else {
      // iframe embed
      const iframe = createIframe(source.url, item.title);
      iframe.onload = () => document.getElementById('cinema-player-skeleton')?.remove();
      playerEl.appendChild(iframe);
    }
    _startTrackingAfterBuild(item, epIdx, ep, onWatched);
    return;
  }

  // PlayLT sem source → fallback para embed servers
  // BUG-2 FIX: limpa o container antes de chamar _buildFromServer
  // sem isso ficam dois skeletons sobrepostos no player
  console.warn('[Cinema] PlayLT sem source para id=' + playltId + ' — usando fallback');
  playerEl.innerHTML = '';
  _buildFromServer(playerEl, item, epIdx, ep, onWatched);
}

/* ── F2: Freeze Detection ────────────────────── */
// After iframe.onload fires, starts a timer. If no load confirmation in time,
// triggers a single silent rebuild of the same server.
function _startFreezeDetector(playerEl, item, epIdx, onWatched) {
  if (cinemaState.freezeTimer) { clearTimeout(cinemaState.freezeTimer); cinemaState.freezeTimer = null; }
  let attempts = 0;
  cinemaState.freezeTimer = _registerTimer(setTimeout(() => {
    cinemaState.freezeTimer = null;
    if (!cinemaState.isModalOpen || cinemaState.currentItem !== item) return;
    if (attempts >= 1) return;
    attempts++;
    // Only retry if skeleton is gone (load fired) but player seems stuck
    const skeleton = document.getElementById('cinema-player-skeleton');
    if (skeleton) return; // still loading — watchdog handles it
    console.warn('[Cinema] Freeze detected — rebuilding same server');
    buildPlayer(item, epIdx, onWatched);
  }, 11_000)); // 11s after onload — freeze window
}

/* ── F3: Silent Server Switch Badge ─────────── */
function _showSilentSwitchBadge() {
  const existing = document.getElementById('cinema-silent-switch-badge');
  if (existing) return;
  const playerEl = document.getElementById('cinema-modal-player');
  if (!playerEl) return;
  const badge = document.createElement('div');
  badge.id = 'cinema-silent-switch-badge';
  badge.style.cssText = [
    'position:absolute', 'top:8px', 'right:8px', 'z-index:9999',
    'background:rgba(0,0,0,.72)', 'color:#fff', 'font-size:12px',
    'padding:4px 10px', 'border-radius:20px', 'pointer-events:none',
    'transition:opacity .4s',
  ].join(';');
  badge.textContent = '🔄 trocando servidor…';
  playerEl.style.position = playerEl.style.position || 'relative';
  playerEl.appendChild(badge);
  _registerTimer(setTimeout(() => { badge.style.opacity = '0'; setTimeout(() => badge.remove(), 420); }, 2800));
}

/* ── Fallback: embed servers (SuperFlixAPI, VidLink…) ── */

function _buildFromServer(playerEl, item, epIdx, ep, onWatched) {
  let src;
  try { src = buildPlayerSrc(item, epIdx, cinemaState.serverIdx); }
  catch (err) { console.warn('[Cinema] buildPlayerSrc error:', err); showPlayerError(playerEl); return; }

  if (!src) { showPlayerError(playerEl); return; }

  const server       = PLAYER_SERVERS[cinemaState.serverIdx];
  const isDub        = server?.type === 'dub';
  const serverName   = server?.name || 'Externo';

  // F3: show silent switch badge if auto-switching (not the first server)
  if (cinemaState.serverIdx > 0 && cinemaState.silentSwitching) {
    _showSilentSwitchBadge();
  }
  cinemaState.silentSwitching = false; // reset flag after badge

  playerEl.appendChild(_makeSkeleton(isDub ? '🇧🇷 Carregando dublagem PT-BR…' : `Carregando ${escapeHtml(serverName)}…`));

  // P2: early exit 6s — troca servidor se skeleton persistir
  _startEarlyExit(playerEl, item, epIdx, onWatched);
  // P7: slow network UX — muda texto após 4s
  _startSlowNetworkTimer();

  const iframe = createIframe(src, item.title);

  iframe.onload = () => {
    _stopWatchdog();
    _clearEarlyExit();
    _clearSlowNetworkTimer();
    document.getElementById('cinema-player-skeleton')?.remove();
    // P4: servidor funcionou — salva para próxima vez
    saveLastGoodServer(item?.tmdbId, cinemaState.serverIdx);
    // A-05: só inicia tracking após confirmar que o iframe carregou com sucesso
    _startTrackingAfterBuild(item, epIdx, ep, onWatched);
    // F2: start freeze detector after iframe confirms load
    _startFreezeDetector(playerEl, item, epIdx, onWatched);

    // ── Botão "Trocar servidor" rápido ──────────────────────────────
    // Remove botão antigo se existir (rebuild sem criar duplicata)
    document.getElementById('cinema-quick-switch')?.remove();
    const quickBtn = document.createElement('button');
    quickBtn.id        = 'cinema-quick-switch';
    quickBtn.className = 'cinema-quick-switch-btn';
    quickBtn.innerHTML = '⚡ Trocar servidor';
    quickBtn.setAttribute('title', 'Tentar o próximo servidor');
    quickBtn.onclick = () => {
      quickBtn.remove();
      // Dispara via evento para manter o fluxo do cinema.js
      const nextIdx = Math.min(cinemaState.serverIdx + 1, PLAYER_SERVERS.length - 1);
      document.dispatchEvent(new CustomEvent('cinema:server-select', { detail: { idx: nextIdx } }));
    };
    playerEl.style.position = playerEl.style.position || 'relative';
    playerEl.appendChild(quickBtn);
    // Auto-esconde após 8s para não poluir o player
    _registerTimer(setTimeout(() => {
      quickBtn.style.opacity = '0';
      _registerTimer(setTimeout(() => quickBtn.remove(), 400));
    }, 8_000));

    // ── Toast "assistindo juntos" se watch party ativa ──────────────
    if (typeof window._wpIsInSession === 'function' && window._wpIsInSession()) {
      _registerTimer(setTimeout(() => {
        window.showToast?.('💛 assistindo juntos agora');
      }, 600));
    }

    if (isDub) {
      const badge = document.createElement('div');
      badge.className   = 'cinema-ptbr-badge';
      badge.textContent = '🇧🇷 Dublado PT-BR';
      playerEl.appendChild(badge);
      cinemaState.badgeTimeout = _registerTimer(setTimeout(() => {
        cinemaState.badgeTimeout = null;
        badge.style.opacity = '0';
        _registerTimer(setTimeout(() => badge.remove(), 400));
      }, 3600));
    }
  };

  // F4: use adaptive timeout per server instead of fixed value
  const adaptiveTimeout = _getAdaptiveTimeout(cinemaState.serverIdx);

  // Auto-fallback timeout
  // BUG-3 FIX: isLastServer calculado DENTRO do timeout, não antes —
  // evita valor stale se o usuário trocou de servidor manualmente entre o início e o disparo
  cinemaState.playerTimeout = _registerTimer(setTimeout(() => {
    if (!cinemaState.isModalOpen || cinemaState.currentItem !== item) return;
    _stopWatchdog();
    document.getElementById('cinema-player-skeleton')?.remove();
    const isLastServer = cinemaState.serverIdx >= PLAYER_SERVERS.length - 1;
    if (!isLastServer) {
      cinemaState.serverIdx = Math.min(cinemaState.serverIdx + 1, PLAYER_SERVERS.length - 1);
      cinemaState.silentSwitching = true; // F3: flag silent switch
      renderServerPanel();
      buildPlayer(item, epIdx, onWatched);
    } else {
      showRetryOverlay(playerEl, item, epIdx, onWatched);
    }
  }, adaptiveTimeout)); // F4: adaptive instead of fixed isDub ? TIMEOUT_DUB_MS : TIMEOUT_SUB_MS

  // BUG-WATCHDOG FIX: inicia watchdog para detectar bloqueio por X-Frame-Options/CSP
  _startWatchdog(playerEl, item, epIdx, onWatched);

  playerEl.appendChild(iframe);
  // A-05: tracking movido para dentro de iframe.onload — não registrar progresso se o iframe falhou
}

/* ── Render do painel de servidores ──────────── */

export function renderServerPanel() {
  const dubEl = document.getElementById('cinema-srv-dub');
  const subEl = document.getElementById('cinema-srv-sub');
  if (!dubEl || !subEl) return;

  const dubServers = PLAYER_SERVERS.map((s, i) => ({ s, i })).filter(({ s }) => s.type === 'dub');
  const subServers = PLAYER_SERVERS.map((s, i) => ({ s, i })).filter(({ s }) => s.type === 'sub');

  const makeBtn = ({ s, i }) => {
    const isActive = i === cinemaState.serverIdx;
    const group    = s.type === 'dub' ? dubServers : subServers;
    const num      = group.findIndex(x => x.i === i) + 1;
    const btn      = document.createElement('button');
    btn.className  = `cinema-srv-btn${isActive ? ' active' : ''} cinema-srv-btn--${s.type}`;
    btn.title      = s.label;
    btn.textContent = String(num);
    btn.dataset.serverIdx = String(i);
    return btn;
  };

  // M-02: limpa o flag de delegation antes de destruir o innerHTML,
  // garantindo que o listener seja re-adicionado nos botões novos.
  dubEl.dataset.delegated = '';
  subEl.dataset.delegated = '';
  dubEl.innerHTML = '';
  subEl.innerHTML = '';
  dubServers.forEach(entry => {
    const btn = makeBtn(entry);
    dubEl.appendChild(btn);
  });
  subServers.forEach(entry => {
    const btn = makeBtn(entry);
    subEl.appendChild(btn);
  });

  // Delegar cliques uma única vez usando event delegation no pai
  [dubEl, subEl].forEach(panel => {
    if (panel.dataset.delegated) return;
    panel.dataset.delegated = '1';
    panel.addEventListener('click', e => {
      const btn = e.target.closest('[data-server-idx]');
      if (!btn) return;
      const idx = parseInt(btn.dataset.serverIdx, 10);
      cinemaState.serverIdx = idx;
      // Notifica o orquestrador via evento customizado
      panel.dispatchEvent(new CustomEvent('cinema:server-select', {
        bubbles: true, detail: { idx }
      }));
    });
  });
}
