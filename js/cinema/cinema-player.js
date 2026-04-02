/* ═══════════════════════════════════════════════
   cinema-player.js — Player, iframe, fallback
   Pietro & Emilly · v64
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
const WATCHDOG_TICK_MS = 5_000;   // intervalo do watchdog
const WATCHDOG_MAX_MS  = 40_000;  // tempo máximo de espera antes do avanço automático

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
  document.getElementById('cinema-player-skeleton')?.remove();
  const isLastServer = cinemaState.serverIdx >= PLAYER_SERVERS.length - 1;
  if (!isLastServer) {
    cinemaState.serverIdx = Math.min(cinemaState.serverIdx + 1, PLAYER_SERVERS.length - 1);
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
    buildPlayer(item, epIdx, onWatched);  // BUG-7 FIX: passa onWatched
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

export function buildPlayer(item, epIdx, onWatched) {
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
  } else {
    _buildFromServer(playerEl, item, epIdx, ep, onWatched);
  }
}

/* ── PlayLT: busca /sources e renderiza ────────── */

async function _buildFromPlayLT(playerEl, item, epIdx, ep, playltId, onWatched) {
  // F1: snapshot generation at start of async path
  const myGeneration = cinemaState.generation;

  playerEl.appendChild(_makeSkeleton('🎬 Carregando…'));

  // Inicia watchdog também no caminho PlayLT
  _startWatchdog(playerEl, item, epIdx, onWatched);

  const source = await fetchSources(playltId);

  // F1: generation guard — bail if a newer buildPlayer was triggered
  if (myGeneration !== cinemaState.generation) return;

  // Guard: modal ainda aberto com o mesmo item?
  if (!cinemaState.isModalOpen || cinemaState.currentItem !== item) return;
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

  const iframe = createIframe(src, item.title);

  iframe.onload = () => {
    _stopWatchdog();
    document.getElementById('cinema-player-skeleton')?.remove();
    // A-05: só inicia tracking após confirmar que o iframe carregou com sucesso
    _startTrackingAfterBuild(item, epIdx, ep, onWatched);
    // F2: start freeze detector after iframe confirms load
    _startFreezeDetector(playerEl, item, epIdx, onWatched);
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
