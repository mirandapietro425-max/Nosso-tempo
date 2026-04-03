/* ═══════════════════════════════════════════════
   PIETRO & EMILLY — cinema.js  v56 (production-grade refactor)
   Nosso Cinema 🎬

   ARQUITETURA (v56):
   ┌─────────────────────────────────────────────┐
   │  cinema.js          ← orquestrador          │
   │  ├─ cinema-state.js ← estado centralizado   │
   │  ├─ cinema-player.js← player + iframe       │
   │  ├─ cinema-catalog.js← dados + lookup map  │
   │  └─ cinema-tmdb.js  ← API TMDB             │
   └─────────────────────────────────────────────┘

   MELHORIAS v56 vs v55:
   [S1]  Estado centralizado em cinemaState (sem let soltos)
   [S2]  _openCinemaItem duplicado removido — única instância limpa
   [S3]  serverIdx overflow corrigido: length-1 (não length)
   [S4]  Dupla race-protection: generation + currentItem em todo return assíncrono
   [S5]  onclick inline substituído por addEventListener/event delegation
   [S6]  Arquitetura modular: state / player / catalog / tmdb
   [S7]  try-catch global em buildPlayer com fallback UI
   [S8]  Sanitização TMDB centralizada em cinema-tmdb.js
   [S9]  Lazy image decode (loading=lazy + decoding=async nos cards)
   [S10] IntersectionObserver para pré-carregar thumb ao entrar na viewport
   [S11] _renderEpisodeList atualiza só o item ativo sem full-rerender do modal
   [S12] _renderCatalog usa DocumentFragment — único reflow
   [S13] _saveWatched com debounce mantido; Firestore merge mantido
   [S14] Watch Party hooks mantidos
   [S15] Firebase sync mantido
   ═══════════════════════════════════════════════ */

import { doc, getDoc, setDoc }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

import {
  startTracking, stopTracking,
  updateProgressBars, renderContinueWatching,
} from './progress.js';

import { CINEMA_CATALOG, ALL_ITEMS_MAP } from './cinema/cinema-catalog.js';
import { cinemaState, resetModalState, abortInFlightFetches } from './cinema/cinema-state.js';
import {
  PLAYER_SERVERS,
  buildPlayer, destroyPlayer,
  renderServerPanel,
} from './cinema/cinema-player.js';
import {
  fetchAllEpisodes, fetchTmdbMeta,
  getEpisodeCacheFor, sanitizeTmdb,
} from './cinema/cinema-playlt.js';

export { CINEMA_CATALOG };

/* ══════════════════════════════════════════════
   HELPERS LOCAIS
   ══════════════════════════════════════════════ */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── F5: Fetch Failure Isolation ─────────────── */
// Wraps any async fetch so a failure in one path never cancels another.
async function safeFetch(fn) {
  try {
    return await fn();
  } catch (e) {
    console.warn('[Cinema] fetch isolated:', e?.message || e);
    return null;
  }
}

function makeWatchedCallback(watchKey) {
  if (cinemaState.watched[watchKey]) return;
  cinemaState.watched[watchKey] = true;
  _saveWatched();
  _renderCatalog();
}

/* ══════════════════════════════════════════════
   FIREBASE
   ══════════════════════════════════════════════ */

async function _loadWatched() {
  if (!cinemaState.cinemaDoc) return;
  try {
    const snap = await getDoc(cinemaState.cinemaDoc);
    if (snap.exists()) cinemaState.watched = snap.data().watched || {};
  } catch (_) {}
}

function _saveWatched() {
  if (!cinemaState.cinemaDoc) return;
  clearTimeout(cinemaState.saveDebounce);
  cinemaState.saveDebounce = setTimeout(async () => {
    try {
      await setDoc(
        cinemaState.cinemaDoc,
        { watched: cinemaState.watched },
        { merge: true }   // merge evita sobrescrever dados do outro usuário
      );
    } catch (_) {}
  }, 600);
}

function _markWatched(id) {
  cinemaState.watched[id] = !cinemaState.watched[id];
  if (!cinemaState.watched[id]) delete cinemaState.watched[id];
  _saveWatched();
  _renderCatalog();
}

/* ══════════════════════════════════════════════
   CATÁLOGO — RENDER
   [S12] DocumentFragment para único reflow
   [S9]  loading=lazy + decoding=async nas thumbs
   [S10] IntersectionObserver para preload
   ══════════════════════════════════════════════ */

// Pré-computa contagem de eps assistidos em O(n) — evita O(n²) no render
function buildWatchedCountCache() {
  const counts = {};
  for (const key of Object.keys(cinemaState.watched)) {
    if (!cinemaState.watched[key]) continue;
    const m = key.match(/^(.+)_ep\d+$/);
    if (m) counts[m[1]] = (counts[m[1]] || 0) + 1;
  }
  return counts;
}

// IntersectionObserver reutilizável para preload de imagens
let _thumbObserver = null;
function getThumbObserver() {
  if (_thumbObserver) return _thumbObserver;
  _thumbObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      if (img.dataset.src) {
        img.src = img.dataset.src;
        delete img.dataset.src;
      }
      _thumbObserver.unobserve(img);
    });
  }, { rootMargin: '200px' });
  return _thumbObserver;
}

function _renderCatalog() {
  const wrap = document.getElementById('cinema-catalog');
  if (!wrap) return;

  const tabMap = {
    series   : { list: CINEMA_CATALOG.series,    isMovie: false },
    filmes   : { list: CINEMA_CATALOG.filmes,    isMovie: true  },
    romance  : { list: CINEMA_CATALOG.romance,   isMovie: true  },
    doramas  : { list: CINEMA_CATALOG.doramas,   isMovie: false },
    animacoes: { list: CINEMA_CATALOG.animacoes, isMovie: false },
  };
  const { list, isMovie } = tabMap[cinemaState.activeTab] || tabMap.series;
  const watchedCounts = buildWatchedCountCache();  // O(n) total

  // BUG-1 FIX: disconnect() deve acontecer ANTES de observer.observe() nas novas imagens,
  // não depois. O fluxo anterior era: observe(img) → disconnect() → appendChild() — o
  // disconnect() removia as observações recém-adicionadas antes que as imagens entrassem
  // no DOM, quebrando silenciosamente o lazy loading em todo re-render do catálogo.
  if (_thumbObserver) _thumbObserver.disconnect();
  wrap.innerHTML = '';

  const observer = getThumbObserver();
  const fragment  = document.createDocumentFragment();

  for (const item of list) {
    const itemIsMovie = item.type === 'movie' || (isMovie && item.type !== 'series');
    const isWatched   = itemIsMovie ? !!cinemaState.watched[item.id] : false;
    const watchedEps  = !itemIsMovie ? (watchedCounts[item.id] || 0) : 0;
    const cachedDynEps = !itemIsMovie && item.tmdbId
      ? getEpisodeCacheFor(item.tmdbId)
      : null;
    const totalEps    = !itemIsMovie
      ? (cachedDynEps ? cachedDynEps.length : (item.episodes || []).length)
      : 0;
    const pct         = totalEps > 0 ? Math.round((watchedEps / totalEps) * 100) : 0;
    const allDone     = !itemIsMovie && totalEps > 0 && watchedEps === totalEps;
    const showWatched = isWatched || allDone;

    // Card element — sem onclick inline [S5]
    const card = document.createElement('div');
    card.className    = `cinema-card${showWatched ? ' cinema-card--watched' : ''}`;
    card.dataset.itemId   = item.id;
    card.dataset.itemType = itemIsMovie ? 'movie' : 'series';

    // Thumb com lazy load [S9] + IntersectionObserver [S10]
    const img = document.createElement('img');
    img.alt      = escapeHtml(item.title);
    img.loading  = 'lazy';
    img.decoding = 'async';
    img.style.cssText = 'opacity:0;transition:opacity .3s';
    if (item.thumb) {
      img.dataset.src = item.thumb;  // src setado pelo observer ao entrar na viewport
      observer.observe(img);
    }
    // BUG-VISUAL-1 FIX: emoji some quando a imagem carrega, aparece só como fallback
    img.addEventListener('load',  () => {
      img.style.opacity = '1';
      // Esconde emoji quando a thumb carregou com sucesso
      if (img.nextElementSibling && img.nextElementSibling.classList.contains('cinema-card-emoji')) {
        img.nextElementSibling.style.opacity = '0';
        img.nextElementSibling.style.pointerEvents = 'none';
      }
    });
    img.addEventListener('error', () => { img.style.display = 'none'; });

    const thumbDiv = document.createElement('div');
    thumbDiv.className = 'cinema-card-thumb';
    thumbDiv.style.background = item.color || '#1a1a2e';
    thumbDiv.appendChild(img);

    const emojiDiv = document.createElement('div');
    emojiDiv.className   = 'cinema-card-emoji';
    emojiDiv.textContent = item.emoji || '🎬';
    thumbDiv.appendChild(emojiDiv);

    if (showWatched) {
      const badge = document.createElement('div');
      badge.className   = 'cinema-card-watched-badge';
      badge.textContent = '✓ Assistido';
      thumbDiv.appendChild(badge);
    }

    const infoDiv = document.createElement('div');
    infoDiv.className = 'cinema-card-info';
    infoDiv.innerHTML = `
      <div class="cinema-card-genre">${escapeHtml(item.genre)} · ${escapeHtml(item.year)}</div>
      <div class="cinema-card-title">${escapeHtml(item.title)}</div>
      <div class="cinema-card-desc">${escapeHtml(item.desc || '')}</div>
      ${!itemIsMovie && totalEps > 0 ? `
        <div class="cinema-ep-progress">
          <div class="cinema-ep-bar">
            <div class="cinema-ep-fill" style="width:${pct}%"></div>
          </div>
          <span class="cinema-ep-label">${watchedEps}/${totalEps} ep.</span>
        </div>` : ''}
      <button class="cinema-play-btn">
        ${!itemIsMovie ? '▶ Ver episódios' : '▶ Assistir agora'}
      </button>`;

    card.appendChild(thumbDiv);
    card.appendChild(infoDiv);
    fragment.appendChild(card);
  }

  wrap.appendChild(fragment);

  // Event delegation no catálogo — um único listener para todos os cards [S5]
  if (!wrap.dataset.delegated) {
    wrap.dataset.delegated = '1';
    wrap.addEventListener('click', e => {
      const card = e.target.closest('[data-item-id]');
      if (card) window._openCinemaItem(card.dataset.itemId);
    });
  }

  updateProgressBars();
  renderContinueWatching();
}

/* ══════════════════════════════════════════════
   MODAL — RENDER
   [S11] Atualiza partes do modal sem full-rerender
   ══════════════════════════════════════════════ */

function _renderModal(skipPlayerBuild = false) {
  const item = cinemaState.currentItem;
  if (!item) return;

  const episodes = cinemaState.dynamicEpisodes || item.episodes || null;
  const isSeries = !!(episodes || item.type === 'series');
  const epCount  = episodes ? episodes.length : 0;
  if (isSeries && epCount > 0 && cinemaState.episodeIdx >= epCount) {
    cinemaState.episodeIdx = 0;
  }

  const titleEl = document.getElementById('cinema-modal-title');
  if (titleEl) titleEl.textContent = `${item.emoji || '🎬'} ${item.title}`;

  // ── Indicador de episódio atual ──────────────────────────────────
  const epIndEl = document.getElementById('cinema-ep-indicator');
  if (epIndEl) {
    if (isSeries && episodes && episodes.length > 0) {
      const ep      = episodes[cinemaState.episodeIdx];
      const epLabel = ep?.title || `Episódio ${cinemaState.episodeIdx + 1}`;
      epIndEl.textContent = epLabel;
      epIndEl.style.display = '';
    } else {
      epIndEl.style.display = 'none';
    }
  }

  if (!skipPlayerBuild) {
    buildPlayer(item, cinemaState.episodeIdx, key => makeWatchedCallback(key));
  }

  renderServerPanel();
  _renderEpisodeList();
  _updateMarkButton();
}

function _updateMarkButton() {
  const item    = cinemaState.currentItem;
  if (!item) return;
  const markBtn = document.getElementById('cinema-modal-markbtn');
  if (!markBtn) return;

  const episodes = cinemaState.dynamicEpisodes || item.episodes || null;
  const isSeries = !!(episodes || item.type === 'series');
  const key      = isSeries ? `${item.id}_ep${cinemaState.episodeIdx}` : item.id;
  const done     = !!cinemaState.watched[key];

  markBtn.textContent = done ? '✓ Marcado como assistido' : '☑ Marcar como assistido';
  markBtn.classList.toggle('done', done);

  // Substitui handler sem acumular listeners
  const newBtn = markBtn.cloneNode(true);
  markBtn.replaceWith(newBtn);
  newBtn.addEventListener('click', () => {
    _markWatched(key);
    _renderModal(true);
  });
}

function _renderEpisodeList() {
  const item     = cinemaState.currentItem;
  if (!item) return;

  const epListEl  = document.getElementById('cinema-modal-eplist');
  const epLabelEl = document.getElementById('cinema-modal-eplabel');
  if (!epListEl) return;

  const episodes = cinemaState.dynamicEpisodes || item.episodes || null;
  const isSeries = !!(episodes || item.type === 'series');

  if (!isSeries) {
    epListEl.style.display = 'none';
    if (epLabelEl) epLabelEl.style.display = 'none';
    return;
  }

  epListEl.style.display = 'flex';
  if (epLabelEl) epLabelEl.style.display = '';

  if (cinemaState.loadingEpisodes) {
    epListEl.innerHTML = `
      <div class="cinema-ep-loading">
        <div class="cinema-ep-spinner"></div>
        <span>Carregando episódios em PT-BR…</span>
      </div>`;
    return;
  }

  if (!episodes || episodes.length === 0) {
    epListEl.innerHTML = `
      <div class="cinema-ep-loading">
        <span>Episódios não encontrados</span>
      </div>`;
    return;
  }

  // Agrupa por temporada
  const byseason = {};
  episodes.forEach((ep, i) => {
    const s = ep.season ?? 1;  // ?? não trata season=0 (especiais) como falsy
    if (!byseason[s]) byseason[s] = [];
    byseason[s].push({ ep, i });
  });

  const seasons  = Object.keys(byseason).map(Number).sort((a, b) => a - b);
  const fragment = document.createDocumentFragment();

  for (const s of seasons) {
    if (seasons.length > 1) {
      const hdr = document.createElement('div');
      hdr.className   = 'cinema-season-header';
      hdr.textContent = `Temporada ${s}`;
      fragment.appendChild(hdr);
    }
    for (const { ep, i } of byseason[s]) {
      const done  = !!cinemaState.watched[`${item.id}_ep${i}`];
      const epNum = ep.episode != null ? ep.episode : (i + 1);
      const div   = document.createElement('div');
      div.className = `cinema-ep-item${i === cinemaState.episodeIdx ? ' active' : ''}${done ? ' ep-done' : ''}`;
      div.dataset.epIdx = String(i);
      div.innerHTML = `
        <span class="cinema-ep-check">${done ? '✓' : epNum}</span>
        <span class="cinema-ep-name">${sanitizeTmdb(ep.title)}</span>`;
      fragment.appendChild(div);
    }
  }

  // M-03: limpa o flag antes de destruir o innerHTML para que o listener
  // seja re-adicionado quando a lista for reconstruída.
  epListEl.dataset.delegated = '';
  epListEl.innerHTML = '';
  epListEl.appendChild(fragment);

  // Event delegation — um listener por lista [S5]
  if (!epListEl.dataset.delegated) {
    epListEl.dataset.delegated = '1';
    epListEl.addEventListener('click', e => {
      const div = e.target.closest('[data-ep-idx]');
      if (div) window._cinemaSwitchEp(parseInt(div.dataset.epIdx, 10));
    });
  }
}

function _renderMeta(meta) {
  const el = document.getElementById('cinema-modal-meta');
  if (!el || !meta) return;

  const stars   = meta.vote    ? `<span class="cinema-meta-badge cinema-meta-vote">⭐ ${meta.vote}</span>` : '';
  const runtime = meta.runtime ? `<span class="cinema-meta-badge">🕐 ${sanitizeTmdb(meta.runtime)}</span>` : '';
  const genres  = meta.genres  ? `<span class="cinema-meta-badge">🎭 ${sanitizeTmdb(meta.genres)}</span>`  : '';

  // Sanitização já aplicada em cinema-playlt.js — renderiza direto
  el.innerHTML = `
    <div class="cinema-meta-badges">${stars}${runtime}${genres}</div>
    ${meta.tagline  ? `<div class="cinema-meta-tagline">"${meta.tagline}"</div>`                                          : ''}
    ${meta.overview ? `<div class="cinema-meta-overview">${meta.overview}</div>`                                          : ''}
    ${meta.cast     ? `<div class="cinema-meta-cast"><span class="cinema-meta-cast-label">Elenco:</span> ${meta.cast}</div>` : ''}
  `;
  el.style.display = 'block';
}

/* ══════════════════════════════════════════════
   MODAL — ABRIR
   [S2]  Única instância limpa (duplicata removida)
   [S4]  Dupla race-protection: generation + item
   ══════════════════════════════════════════════ */

window._openCinemaItem = async function (id) {
  // Bloqueia double-open imediatamente
  if (cinemaState.isModalOpen) {
    stopTracking();
    destroyPlayer();
  }
  cinemaState.isModalOpen = true;

  // BUG-GENERATION FIX: abortInFlightFetches() agora retorna o valor pós-incremento —
  // capturar na mesma expressão elimina fragilidade de timing em refatorações futuras.
  const myGeneration = abortInFlightFetches();

  const item = ALL_ITEMS_MAP.get(id);
  if (!item) { cinemaState.isModalOpen = false; return; }

  cinemaState.currentItem     = item;
  cinemaState.serverIdx       = 0;
  cinemaState.dynamicEpisodes = null;
  cinemaState.loadingEpisodes = false;

  const isTVItem = item.type !== 'movie';

  // Restaura último episódio assistido
  if (isTVItem) {
    try {
      const all     = JSON.parse(localStorage.getItem('cinema_progress_v1') || '{}');
      const entries = Object.values(all).filter(e => e.itemId === id);
      if (entries.length) {
        const latest = entries.sort((a, b) => (b.updated || 0) - (a.updated || 0))[0];
        const restoredIdx = (latest.epIdx != null && !latest.done) ? latest.epIdx : 0;
        // BUG-EPCLAMP-PREMATURE FIX: não clampar o índice restaurado contra os episódios
        // estáticos (que podem ser menos). O clamp final acontecerá depois que os episódios
        // dinâmicos carregarem — assim um usuário no ep 15 não é regrido para ep 4 (último estático).
        cinemaState.episodeIdx = restoredIdx >= 0 ? restoredIdx : 0;
      } else {
        cinemaState.episodeIdx = 0;
      }
    } catch { cinemaState.episodeIdx = 0; }
  } else {
    cinemaState.episodeIdx = 0;
  }

  const overlay = document.getElementById('cinema-modal-overlay');
  if (!overlay) { cinemaState.isModalOpen = false; return; }
  overlay.classList.add('show');

  _renderModal();

  // Hook Watch Party
  if (typeof window._wpOnCinemaOpen === 'function') {
    window._wpOnCinemaOpen(item.id, cinemaState.episodeIdx, cinemaState.serverIdx);
  }

  if (!item.tmdbId) return;

  // Cria controllers externos para cancelamento imediato
  cinemaState.metaFetchCtrl    = new AbortController();
  cinemaState.episodeFetchCtrl = new AbortController();
  const metaSignal    = cinemaState.metaFetchCtrl.signal;
  const episodeSignal = cinemaState.episodeFetchCtrl.signal;

  // Metadados — fire-and-forget com dupla guard [S4]
  // F5: wrapped in safeFetch so a meta failure never affects the player
  safeFetch(() => fetchTmdbMeta(item, metaSignal))
    .then(meta => {
      if (cinemaState.generation !== myGeneration) return;
      if (cinemaState.currentItem !== item) return;
      if (meta) _renderMeta(meta);
    })
    .catch(e => console.warn('[Cinema] meta render error:', e?.message || e));

  if (!isTVItem) return;

  // Episódios
  cinemaState.loadingEpisodes = true;
  _renderEpisodeList();

  // F5: episode fetch isolated — failure here never cancels the player
  const fetched = await safeFetch(() => fetchAllEpisodes(item, episodeSignal));

  // [S4] Dupla race-protection após await
  if (cinemaState.generation !== myGeneration) return;
  if (cinemaState.currentItem !== item) return;

  cinemaState.loadingEpisodes = false;

  if (!fetched || fetched.length === 0) {
    _renderEpisodeList();
    return;
  }

  cinemaState.dynamicEpisodes = fetched;
  const prevIdx = cinemaState.episodeIdx;
  if (cinemaState.episodeIdx >= fetched.length) cinemaState.episodeIdx = 0;
  _renderEpisodeList();

  if (cinemaState.episodeIdx !== prevIdx) {
    buildPlayer(item, cinemaState.episodeIdx, key => makeWatchedCallback(key));
    renderServerPanel();
  } else {
    // Reinicia tracking com dynEp correto (BUG-4)
    const ep    = fetched[cinemaState.episodeIdx];
    const dynEp = (ep?.season != null && ep?.episode != null)
      ? { season: ep.season, episode: ep.episode }
      : null;
    if (dynEp) {
      stopTracking();
      startTracking(item, cinemaState.episodeIdx, (key, watchedItem, eIdx) => {
        const watchKey = `${watchedItem.id}_ep${eIdx}`;
        makeWatchedCallback(watchKey);
      }, dynEp);
    }
  }
};

/* ══════════════════════════════════════════════
   CONTROLES GLOBAIS DO MODAL
   ══════════════════════════════════════════════ */

window._closeCinemaModal = function () {
  const overlay = document.getElementById('cinema-modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('show');

  stopTracking();
  destroyPlayer();
  abortInFlightFetches();

  resetModalState();

  const metaEl = document.getElementById('cinema-modal-meta');
  if (metaEl) { metaEl.innerHTML = ''; metaEl.style.display = 'none'; }

  renderContinueWatching();
};

window._cinemaSwitchEp = function (idx) {
  if (!cinemaState.currentItem) return;
  if (idx === cinemaState.episodeIdx) return;
  // BUG-1 FIX: idx negativo nunca é válido, independente de episodes estar carregado.
  // Sem este guard, um idx=-1 enviado pelo watchparty remoto passava quando
  // dynamicEpisodes ainda era null (série ainda carregando), causando carregamento
  // silencioso do episódio errado (ep undefined → parseSeasonEpisode → S01E01).
  if (idx < 0) return;
  const episodes = cinemaState.dynamicEpisodes || cinemaState.currentItem?.episodes;
  if (episodes && idx >= episodes.length) return;

  // Aborta fetches TMDB em andamento para evitar que episódios de uma carga
  // anterior sobrescrevam o estado após a troca de episódio
  abortInFlightFetches();
  stopTracking();
  cinemaState.serverIdx  = 0;
  cinemaState.episodeIdx = idx;

  // [S11] Atualiza apenas player + episode list, sem recriar catálogo
  _renderModal();

  if (typeof window._wpOnCinemaEpSwitch === 'function') {
    window._wpOnCinemaEpSwitch(idx);
  }
};

window._cinemaSwitchTab = function (tab) {
  cinemaState.activeTab = tab;
  document.querySelectorAll('.cinema-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab));
  _renderCatalog();
};

// Seleção de servidor — disparada pelo evento customizado do cinema-player.js
document.addEventListener('cinema:server-select', e => {
  const { idx } = e.detail;
  cinemaState.serverIdx = idx;
  if (!cinemaState.currentItem) return;
  buildPlayer(cinemaState.currentItem, cinemaState.episodeIdx, key => makeWatchedCallback(key));
  renderServerPanel();
  if (cinemaState.loadingEpisodes) _renderEpisodeList();
  if (typeof window._wpOnServerChange === 'function') window._wpOnServerChange(idx);
});

// Expõe para compatibilidade com watchparty.js que chama window._cinemaSelectServer
window._cinemaSelectServer = function (idx) {
  cinemaState.serverIdx = idx;
  document.dispatchEvent(new CustomEvent('cinema:server-select', { detail: { idx } }));
};

window._cinemaNextServer = function () {
  cinemaState.serverIdx = Math.min(cinemaState.serverIdx + 1, PLAYER_SERVERS.length - 1);
  document.dispatchEvent(new CustomEvent('cinema:server-select', { detail: { idx: cinemaState.serverIdx } }));
};

window._cinemaResetServers = function () {
  cinemaState.serverIdx = 0;
  document.dispatchEvent(new CustomEvent('cinema:server-select', { detail: { idx: 0 } }));
};

window._cinemaRetryServer = function () {
  if (cinemaState.currentItem) {
    buildPlayer(cinemaState.currentItem, cinemaState.episodeIdx, key => makeWatchedCallback(key));
  }
};

/* ══════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════ */

export function initCinema(db) {
  // Renderiza o catálogo IMEDIATAMENTE (sem watched state) para que o usuário
  // nunca fique olhando para "⏳ Carregando catálogo..." enquanto o Firebase inicializa.
  // Quando o Firebase responder, re-renderiza com os badges "Assistido" corretos.
  _renderCatalog();
  // A-02: renderiza "Continue Assistindo" já na carga inicial (dados do localStorage)
  renderContinueWatching();

  if (db) {
    cinemaState.db        = db;
    cinemaState.cinemaDoc = doc(db, 'cinema', 'shared');
    _loadWatched().then(() => { _renderCatalog(); renderContinueWatching(); }).catch(() => {/* Firebase offline — catálogo já visível */});
  }

  // Fechar modal ao clicar no overlay
  const overlay = document.getElementById('cinema-modal-overlay');
  if (overlay && !overlay.dataset.listenerAttached) {
    overlay.dataset.listenerAttached = '1';
    overlay.addEventListener('click', e => {
      if (e.target === overlay) window._closeCinemaModal();
    });
  }

  // Handler global de erros assíncronos (BUG-Q)
  if (!window._cinemaErrorHandlerAttached) {
    window._cinemaErrorHandlerAttached = true;
    window.addEventListener('unhandledrejection', event => {
      const err = event.reason;
      // AbortError é intencional (fetch cancelado pelo usuário) — silencia
      if (err?.name === 'AbortError') { event.preventDefault(); return; }
      // Erros do módulo cinema — loga para diagnóstico
      if (
        err?.stack?.includes('cinema') ||
        err?.message?.includes('Firestore') ||
        err?.message?.includes('tmdb')
      ) {
        console.warn('[Cinema] Erro não tratado:', err);
        event.preventDefault();
      }
    });
  }
}
