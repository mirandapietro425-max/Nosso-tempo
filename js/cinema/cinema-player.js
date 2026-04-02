/* ═══════════════════════════════════════════════
   cinema-player.js — Player, iframe, fallback
   Pietro & Emilly · v56
   ═══════════════════════════════════════════════ */

import { startTracking, stopTracking, getResumeTime } from '../progress.js';
import { cinemaState }  from './cinema-state.js';
import { sanitizeTmdb, fetchSources } from './cinema-playlt.js';

export const PLAYER_SERVERS = [
  {
    name: '🇧🇷 Dub 1', label: 'SuperFlixAPI — Dublado PT-BR', type: 'dub',
    movie : (id)       => `https://superflixapi.rest/filme/${id}/`,
    tv    : (id, s, e) => `https://superflixapi.rest/serie/${id}/${s}/${e}/`,
    hasParams: false,
  },
  {
    name: '🇧🇷 Dub 2', label: 'SuperFlixAPI .help — Dublado PT-BR', type: 'dub',
    movie : (id)       => `https://superflixapi.help/filme/${id}/`,
    tv    : (id, s, e) => `https://superflixapi.help/serie/${id}/${s}/${e}/`,
    hasParams: false,
  },
  {
    name: '🇧🇷 Dub 3', label: 'CineEmbed — Dublado PT-BR', type: 'dub',
    movie : (id)       => `https://cineembed.com/embed/${id}`,
    tv    : (id, s, e) => `https://cineembed.com/embed/${id}/${s}/${e}`,
    hasParams: false,
  },
  {
    name: '🌐 Multi 1', label: 'AutoEmbed — Multi idioma', type: 'dub',
    movie : (id)       => `https://player.autoembed.cc/embed/movie/${id}?autoplay=true`,
    tv    : (id, s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}?autoplay=true`,
    hasParams: true,
  },
  {
    name: '🌐 Multi 2', label: '2Embed — Multi idioma', type: 'dub',
    movie : (id)       => `https://www.2embed.stream/embed/movie/${id}`,
    tv    : (id, s, e) => `https://www.2embed.stream/embed/tv/${id}/${s}/${e}`,
    hasParams: false,
  },
  {
    name: '🌐 Multi 3', label: 'MultiEmbed — Multi idioma', type: 'dub',
    movie : (id)       => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tv    : (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
    hasParams: true,
  },
  {
    name: '🔤 Leg 1', label: 'VidLink — Legendado PT-BR', type: 'sub',
    movie : (id)       => `https://vidlink.pro/movie/${id}?autoplay=true&lang=pt-BR&primaryColor=e8536f`,
    tv    : (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?autoplay=true&lang=pt-BR&primaryColor=e8536f`,
    hasParams: true,
  },
  {
    name: '🔤 Leg 2', label: 'VidSrc — Legendado', type: 'sub',
    movie : (id)       => `https://vidsrc.cc/v2/embed/movie/${id}`,
    tv    : (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
    hasParams: false,
  },
];

const TIMEOUT_DUB_MS = 18_000;
const TIMEOUT_SUB_MS = 22_000;

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
      const ep       = episodes?.[epIdx] ?? null;
      const s        = ep?.season  ?? null;
      const e        = ep?.episode ?? null;
      const [sf, ef] = (s != null && e != null) ? [s, e] : parseSeasonEpisode(ep?.title);
      const dynEp    = (ep?.season != null && ep?.episode != null)
        ? { season: ep.season, episode: ep.episode }
        : null;
      const rt = getResumeTime(item, epIdx, dynEp);
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
  iframe.src            = src;
  iframe.title          = title || 'Player';
  iframe.frameBorder    = '0';
  iframe.allowFullscreen = true;
  iframe.setAttribute('sandbox',
    'allow-scripts allow-same-origin allow-forms allow-presentation allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation'
  );
  iframe.referrerPolicy = 'no-referrer';
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media');
  iframe.style.cssText  = 'width:100%;aspect-ratio:16/9;display:block;';
  // NOTA: NÃO usar loading='lazy' em iframes de player — o modal já está na viewport
  // e o lazy loading atrasaria o início do vídeo em alguns browsers mobile.
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

/* ── Destroy ─────────────────────────────────── */

export function destroyPlayer() {
  if (cinemaState.playerTimeout) {
    clearTimeout(cinemaState.playerTimeout);
    cinemaState.playerTimeout = null;
  }
  if (cinemaState.badgeTimeout) {
    clearTimeout(cinemaState.badgeTimeout);
    cinemaState.badgeTimeout = null;
  }
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

  stopTracking();
  destroyPlayer();

  // Resolve o episódio atual (para séries)
  const dynEps   = cinemaState.dynamicEpisodes;
  const episodes = dynEps || item.episodes;
  const ep       = episodes?.[epIdx] ?? null;

  // ID para a PlayLT: usa contentId do episódio se disponível, senão tmdbId
  const playltId = ep?.contentId ?? item.tmdbId ?? null;

  if (playltId) {
    _buildFromPlayLT(playerEl, item, epIdx, ep, playltId, onWatched);
  } else {
    _buildFromServer(playerEl, item, epIdx, ep, onWatched);
  }
}

/* ── PlayLT: busca /sources e renderiza ────────── */

async function _buildFromPlayLT(playerEl, item, epIdx, ep, playltId, onWatched) {
  playerEl.appendChild(_makeSkeleton('🎬 Carregando…'));

  const source = await fetchSources(playltId);

  // Guard: modal ainda aberto com o mesmo item?
  if (!cinemaState.isModalOpen || cinemaState.currentItem !== item) return;
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
  console.warn('[Cinema] PlayLT sem source para id=' + playltId + ' — usando fallback');
  _buildFromServer(playerEl, item, epIdx, ep, onWatched);
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
  const isLastServer = cinemaState.serverIdx >= PLAYER_SERVERS.length - 1;

  playerEl.appendChild(_makeSkeleton(isDub ? '🇧🇷 Carregando dublagem PT-BR…' : `Carregando ${escapeHtml(serverName)}…`));

  const iframe = createIframe(src, item.title);

  iframe.onload = () => {
    document.getElementById('cinema-player-skeleton')?.remove();
    if (isDub) {
      const badge = document.createElement('div');
      badge.className   = 'cinema-ptbr-badge';
      badge.textContent = '🇧🇷 Dublado PT-BR';
      playerEl.appendChild(badge);
      cinemaState.badgeTimeout = setTimeout(() => {
        cinemaState.badgeTimeout = null;
        badge.style.opacity = '0';
        setTimeout(() => badge.remove(), 400);
      }, 3600);
    }
  };

  // Auto-fallback timeout
  cinemaState.playerTimeout = setTimeout(() => {
    if (!cinemaState.isModalOpen || cinemaState.currentItem !== item) return;
    document.getElementById('cinema-player-skeleton')?.remove();
    if (!isLastServer) {
      cinemaState.serverIdx = Math.min(cinemaState.serverIdx + 1, PLAYER_SERVERS.length - 1);
      renderServerPanel();
      buildPlayer(item, epIdx, onWatched);
    } else {
      showRetryOverlay(playerEl, item, epIdx, onWatched);
    }
  }, isDub ? TIMEOUT_DUB_MS : TIMEOUT_SUB_MS);

  playerEl.appendChild(iframe);
  _startTrackingAfterBuild(item, epIdx, ep, onWatched);
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

  // Limpa e reconstrói com addEventListener (sem onclick inline)
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
