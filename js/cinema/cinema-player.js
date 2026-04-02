/* ═══════════════════════════════════════════════
   cinema-player.js — Player, iframe, fallback
   Pietro & Emilly · v56
   ═══════════════════════════════════════════════ */

import { startTracking, stopTracking, getResumeTime } from '../progress.js';
import { cinemaState }  from './cinema-state.js';
import { sanitizeTmdb } from './cinema-tmdb.js';

export const PLAYER_SERVERS = [
  {
    name: '🇧🇷 Dub 1', label: 'SuperFlixAPI — Dublado PT-BR', type: 'dub',
    movie : (id)       => `https://superflixapi.rest/filme/${id}/`,
    tv    : (id, s, e) => `https://superflixapi.rest/serie/${id}/${s}/${e}/`,
    hasParams: false,
  },
  {
    name: '🇧🇷 Dub 2', label: 'SuperFlixAPI .run — Dublado PT-BR', type: 'dub',
    movie : (id)       => `https://superflixapi.run/filme/${id}/`,
    tv    : (id, s, e) => `https://superflixapi.run/serie/${id}/${s}/${e}/`,
    hasParams: false,
  },
  {
    name: '🇧🇷 Dub 3', label: 'SuperFlixAPI .top — Dublado PT-BR', type: 'dub',
    movie : (id)       => `https://superflixapi.top/filme/${id}/`,
    tv    : (id, s, e) => `https://superflixapi.top/serie/${id}/${s}/${e}/`,
    hasParams: false,
  },
  {
    name: '🇧🇷 Dub 4', label: 'SuperFlixAPI .my — Dublado PT-BR', type: 'dub',
    movie : (id)       => `https://superflixapi.my/filme/${id}/`,
    tv    : (id, s, e) => `https://superflixapi.my/serie/${id}/${s}/${e}/`,
    hasParams: false,
  },
  {
    name: '🇧🇷 Dub 5', label: 'WarezCDN — Dublado PT-BR', type: 'dub',
    movie : (id)       => `https://warezcdn.com.br/filme/${id}/`,
    tv    : (id, s, e) => `https://warezcdn.com.br/serie/${id}/${s}/${e}/`,
    hasParams: false,
  },
  {
    name: '🇧🇷 Dub 6', label: 'CineEmbed — Dublado PT-BR', type: 'dub',
    movie : (id)       => `https://cineembed.com/embed/${id}`,
    tv    : (id, s, e) => `https://cineembed.com/embed/${id}/${s}/${e}`,
    hasParams: false,
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

const TIMEOUT_DUB_MS = 8_000;
const TIMEOUT_SUB_MS = 15_000;

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
  iframe.title          = escapeHtml(title) || 'Player';
  iframe.frameBorder    = '0';
  iframe.allowFullscreen = true;
  iframe.setAttribute('sandbox',
    'allow-scripts allow-same-origin allow-forms allow-presentation'
  );
  iframe.referrerPolicy = 'no-referrer';
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media');
  iframe.style.cssText  = 'width:100%;aspect-ratio:16/9;display:block;';
  // NOTA: NÃO usar loading='lazy' em iframes de player — o modal já está na viewport
  // e o lazy loading atrasaria o início do vídeo em alguns browsers mobile.
  return iframe;
}

/* ── Destroy ─────────────────────────────────── */

export function destroyPlayer() {
  if (cinemaState.playerTimeout) {
    clearTimeout(cinemaState.playerTimeout);
    cinemaState.playerTimeout = null;
  }
  // BUG-13 FIX: cancela o timer do badge PT-BR para evitar que tente
  // remover um elemento já destruído pelo innerHTML = ''
  if (cinemaState.badgeTimeout) {
    clearTimeout(cinemaState.badgeTimeout);
    cinemaState.badgeTimeout = null;
  }
  const p = document.getElementById('cinema-modal-player');
  if (!p) return;
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

/* ── buildPlayer ─────────────────────────────── */

export function buildPlayer(item, epIdx, onWatched) {
  const playerEl = document.getElementById('cinema-modal-player');
  if (!playerEl) return;

  // Sempre para tracking antes de destruir (BUG-P fix)
  stopTracking();
  destroyPlayer();

  let src;
  try {
    src = buildPlayerSrc(item, epIdx, cinemaState.serverIdx);
  } catch (err) {
    console.warn('[Cinema] buildPlayerSrc error:', err);
    showPlayerError(playerEl);
    return;
  }

  if (!src) { showPlayerError(playerEl); return; }

  const server      = PLAYER_SERVERS[cinemaState.serverIdx];
  const isDub       = server?.type === 'dub';
  const serverName  = server?.name || 'YouTube';
  // BUG FIX (item 2): <= length-1 para não overflow além do último servidor
  const isLastServer = cinemaState.serverIdx >= PLAYER_SERVERS.length - 1;

  // Loading skeleton
  const skeleton = document.createElement('div');
  skeleton.id        = 'cinema-player-skeleton';
  skeleton.className = 'cinema-player-skeleton';
  skeleton.innerHTML = `
    <div class="cinema-player-loading">
      <div class="cinema-player-spinner"></div>
      <span class="cinema-player-loading-text">
        ${isDub ? '🇧🇷 Carregando dublagem PT-BR…' : `Carregando ${escapeHtml(serverName)}…`}
      </span>
    </div>`;
  playerEl.appendChild(skeleton);

  const iframe = createIframe(src, item.title);

  iframe.onload = () => {
    document.getElementById('cinema-player-skeleton')?.remove();
    if (isDub) {
      const badge = document.createElement('div');
      badge.className   = 'cinema-ptbr-badge';
      badge.textContent = '🇧🇷 Dublado PT-BR';
      playerEl.appendChild(badge);
      // BUG-13 FIX: guarda o timer no state para poder cancelá-lo em destroyPlayer()
      // Sem isso, se o player for destruído antes dos 3600ms, o timer continua vivo
      // apontando para um badge já removido do DOM.
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
      // BUG FIX (item 2): clamp correto — nunca ultrapassa o último índice válido
      cinemaState.serverIdx = Math.min(
        cinemaState.serverIdx + 1,
        PLAYER_SERVERS.length - 1
      );
      renderServerPanel();
      buildPlayer(item, epIdx, onWatched);
    } else {
      showRetryOverlay(playerEl, item, epIdx, onWatched);  // BUG-7 FIX: passa onWatched
    }
  }, isDub ? TIMEOUT_DUB_MS : TIMEOUT_SUB_MS);

  playerEl.appendChild(iframe);

  // Rastreia progresso
  const episodes = cinemaState.dynamicEpisodes || item.episodes;
  const ep       = episodes?.[epIdx] ?? null;
  const dynEp    = (ep?.season != null && ep?.episode != null)
    ? { season: ep.season, episode: ep.episode }
    : null;

  startTracking(item, epIdx, (key, watchedItem, eIdx) => {
    const watchKey = (watchedItem.episodes || dynEp)
      ? `${watchedItem.id}_ep${eIdx}`
      : watchedItem.id;
    if (typeof onWatched === 'function') onWatched(watchKey);
  }, dynEp);
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
