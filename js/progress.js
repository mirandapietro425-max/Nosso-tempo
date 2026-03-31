/* ═══════════════════════════════════════════════════════════
   PIETRO & EMILLY — progress.js
   Continue Watching System 🎬
   ·  Rastreia progresso por cronômetro de sessão
   ·  Salva no localStorage (instantâneo + offline)
   ·  Resume: passa ?t= na URL do player
   ·  Seção "Continue Assistindo" estilo Netflix
   ·  Auto-marca assistido em ≥90%
   ═══════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────
   CONSTANTES
───────────────────────────────────────────── */
const LS_KEY        = 'cinema_progress_v1'; // chave no localStorage
const SAVE_INTERVAL = 10_000;               // salva a cada 10s
const WATCHED_PCT   = 0.90;                 // 90% = assistido
const RESUME_MIN_S  = 30;                   // só resume se assistiu >30s
const MAX_ENTRIES   = 20;                   // máx itens no "Continue Assistindo"

/* ─────────────────────────────────────────────
   ESTADO INTERNO
───────────────────────────────────────────── */
let _progressTimer  = null;   // setInterval do cronômetro
let _sessionStart   = null;   // Date.now() quando o player abriu
let _sessionKey     = null;   // chave do item atual ex: "breaking_bad_ep2"
let _sessionItem    = null;   // referência ao item do catálogo
let _sessionEpIdx   = 0;      // índice do episódio atual
let _onWatchedCb    = null;   // callback quando item marcado assistido

/* ─────────────────────────────────────────────
   STORAGE HELPERS
───────────────────────────────────────────── */

/** Lê todos os registros de progresso do localStorage */
function _readAll() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
}

/** Salva todos os registros no localStorage */
function _writeAll(data) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    // localStorage cheio ou bloqueado — ignora silenciosamente
  }
}

/* ─────────────────────────────────────────────
   CHAVE DO ITEM
   filmes:    "tmdbId_movie"   ex: "597_movie"
   séries ep: "tmdbId_s1e3"   ex: "1396_s1e3"
───────────────────────────────────────────── */
function _makeKey(item, epIdx) {
  if (!item) return null;
  if (!item.episodes) return `${item.tmdbId || item.id}_movie`;
  const ep = item.episodes[epIdx];
  if (!ep) return `${item.tmdbId || item.id}_s1e1`;
  const m = ep.title.match(/T(\d+)E(\d+)/i);
  if (m) return `${item.tmdbId || item.id}_s${m[1]}e${m[2]}`;
  return `${item.tmdbId || item.id}_ep${epIdx}`;
}

/* ─────────────────────────────────────────────
   API PÚBLICA
───────────────────────────────────────────── */

/**
 * Inicia o rastreamento de progresso para um item/episódio.
 * Chamado quando o player abre.
 */
export function startTracking(item, epIdx = 0, onWatchedCallback = null) {
  stopTracking(); // para qualquer timer anterior

  _sessionItem  = item;
  _sessionEpIdx = epIdx;
  _sessionKey   = _makeKey(item, epIdx);
  _sessionStart = Date.now();
  _onWatchedCb  = onWatchedCallback;

  if (!_sessionKey) return;

  // Salva a cada 10 segundos
  _progressTimer = setInterval(() => {
    _tickSave();
  }, SAVE_INTERVAL);
}

/**
 * Para o rastreamento e faz um save final.
 * Chamado ao fechar modal, trocar episódio, etc.
 */
export function stopTracking() {
  if (_progressTimer) {
    clearInterval(_progressTimer);
    _progressTimer = null;
  }
  if (_sessionKey && _sessionStart) {
    _tickSave(); // save final
  }
  _sessionKey   = null;
  _sessionItem  = null;
  _sessionStart = null;
}

/**
 * Calcula e persiste o progresso atual baseado no tempo de sessão.
 */
function _tickSave() {
  if (!_sessionKey || !_sessionStart || !_sessionItem) return;

  const elapsed = Math.floor((Date.now() - _sessionStart) / 1000); // segundos
  if (elapsed < 5) return; // ignora sessões muito curtas

  const all  = _readAll();
  const prev = all[_sessionKey] || {};

  // Soma o tempo já acumulado com o da sessão atual
  const accumulated = (prev.watched || 0) + elapsed;

  // Duração estimada: usa a guardada ou estima pelo tipo
  const duration = prev.duration || _estimateDuration(_sessionItem);

  const pct = duration > 0 ? Math.min(accumulated / duration, 1) : 0;

  all[_sessionKey] = {
    itemId    : _sessionItem.id,
    tmdbId    : _sessionItem.tmdbId || null,
    title     : _sessionItem.title,
    thumb     : _sessionItem.thumb,
    color     : _sessionItem.color,
    emoji     : _sessionItem.emoji,
    type      : _sessionItem.episodes ? 'series' : 'movie',
    epIdx     : _sessionEpIdx,
    epTitle   : _sessionItem.episodes ? (_sessionItem.episodes[_sessionEpIdx]?.title ?? '') : '',
    watched   : accumulated,
    duration  : duration,
    pct       : pct,
    updated   : Date.now(),
    done      : pct >= WATCHED_PCT,
  };

  // Limita o histórico a MAX_ENTRIES entradas
  _pruneOldEntries(all);
  _writeAll(all);

  // Atualiza barra de progresso nos cards do catálogo
  updateProgressBars();

  // Auto-marca assistido se ≥ 90%
  if (pct >= WATCHED_PCT && typeof _onWatchedCb === 'function') {
    _onWatchedCb(_sessionKey, _sessionItem, _sessionEpIdx);
  }

  // Reseta o start para não acumular em duplicata
  _sessionStart = Date.now();
}

/**
 * Estima duração em segundos. Usado quando não há duração real salva.
 * filmes: ~110 min. séries: ~45 min por episódio.
 */
function _estimateDuration(item) {
  return item.episodes ? 45 * 60 : 110 * 60;
}

/**
 * Remove entradas mais antigas quando passa MAX_ENTRIES.
 */
function _pruneOldEntries(all) {
  const keys = Object.keys(all);
  if (keys.length <= MAX_ENTRIES) return;
  // Ordena por updated asc e remove os mais velhos
  keys.sort((a, b) => (all[a].updated || 0) - (all[b].updated || 0));
  const toRemove = keys.slice(0, keys.length - MAX_ENTRIES);
  toRemove.forEach(k => delete all[k]);
}

/**
 * Retorna o progresso salvo de um item/episódio.
 * { watched, duration, pct, updated, done } ou null
 */
export function loadProgress(item, epIdx = 0) {
  const key = _makeKey(item, epIdx);
  if (!key) return null;
  const all = _readAll();
  return all[key] || null;
}

/**
 * Retorna o tempo de resume em segundos para um item.
 * Retorna 0 se não deve resumir (muito pouco visto ou já terminado).
 */
export function getResumeTime(item, epIdx = 0) {
  const p = loadProgress(item, epIdx);
  if (!p) return 0;
  if (p.done) return 0;              // já terminou — recomeça do início
  if (p.watched < RESUME_MIN_S) return 0; // menos de 30s — não vale retomar
  return p.watched;
}

/**
 * Retorna todos os itens em progresso, ordenados por último assistido.
 * Filtra itens com menos de 30s e já terminados.
 */
export function getContinueWatching() {
  const all = _readAll();
  return Object.values(all)
    .filter(e => e.watched >= RESUME_MIN_S && !e.done)
    .sort((a, b) => (b.updated || 0) - (a.updated || 0))
    .slice(0, 6); // máx 6 cards na seção
}

/**
 * Remove o progresso de um item específico (ex: ao marcar como assistido).
 */
export function clearProgress(item, epIdx = 0) {
  const key = _makeKey(item, epIdx);
  if (!key) return;
  const all = _readAll();
  delete all[key];
  _writeAll(all);
  renderContinueWatching();
}

/* ─────────────────────────────────────────────
   UI — BARRAS DE PROGRESSO NOS CARDS
───────────────────────────────────────────── */

/**
 * Atualiza as barras de progresso vermelhas em todos os cards visíveis.
 * Chamado após cada save e ao renderizar o catálogo.
 */
export function updateProgressBars() {
  const all = _readAll();

  document.querySelectorAll('.cinema-card[data-item-id]').forEach(card => {
    const itemId  = card.dataset.itemId;
    const itemType = card.dataset.itemType;

    // Para filmes: uma única barra
    if (itemType === 'movie') {
      // Pega qualquer entrada que corresponda ao itemId
      const entry = Object.values(all).find(e => e.itemId === itemId && e.type === 'movie');
      _setCardBar(card, entry?.pct || 0);
      return;
    }

    // Para séries: usa o episódio mais recente
    const seriesEntries = Object.values(all).filter(e => e.itemId === itemId && e.type === 'series');
    if (!seriesEntries.length) { _setCardBar(card, 0); return; }
    const latest = seriesEntries.sort((a, b) => (b.updated || 0) - (a.updated || 0))[0];
    _setCardBar(card, latest.pct || 0);
  });
}

function _setCardBar(card, pct) {
  let bar = card.querySelector('.cinema-progress-bar');
  if (pct <= 0) {
    if (bar) bar.remove();
    return;
  }
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'cinema-progress-bar';
    const fill = document.createElement('div');
    fill.className = 'cinema-progress-fill';
    bar.appendChild(fill);
    // Insere dentro do thumb (sobre a imagem, na base)
    const thumb = card.querySelector('.cinema-card-thumb');
    if (thumb) thumb.appendChild(bar);
  }
  const fill = bar.querySelector('.cinema-progress-fill');
  if (fill) fill.style.width = `${Math.round(pct * 100)}%`;
}

/* ─────────────────────────────────────────────
   UI — SEÇÃO CONTINUE ASSISTINDO
───────────────────────────────────────────── */

/**
 * Renderiza a seção "Continue Assistindo" acima do catálogo.
 * Cria o container se não existir. Remove se não há itens.
 */
export function renderContinueWatching() {
  const items = getContinueWatching();
  const section = document.getElementById('cinema-continue-section');

  if (!items.length) {
    if (section) section.remove();
    return;
  }

  // Cria seção se não existe
  let wrap = section;
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'cinema-continue-section';
    const catalog = document.getElementById('cinema-catalog');
    if (!catalog) return;
    catalog.parentElement.insertBefore(wrap, catalog);
  }

  wrap.innerHTML = `
    <div class="cinema-continue-header">
      <span class="cinema-continue-title">▶ Continue Assistindo</span>
    </div>
    <div class="cinema-continue-grid">
      ${items.map(entry => _buildContinueCard(entry)).join('')}
    </div>
  `;
}

function _buildContinueCard(entry) {
  const pct     = Math.round((entry.pct || 0) * 100);
  const timeStr = _formatTime(entry.watched || 0);
  const epLabel = entry.type === 'series' && entry.epTitle
    ? `<div class="cinema-cont-ep">${entry.epTitle}</div>`
    : '';

  return `
    <div class="cinema-cont-card"
         onclick="window._openCinemaItem('${entry.itemId}','${entry.type === 'series' ? 'series' : 'filmes'}')">
      <div class="cinema-cont-thumb" style="background:${entry.color || '#111'}">
        <img src="${entry.thumb || ''}" alt="${entry.title}" loading="lazy"
             onerror="this.style.display='none'">
        <div class="cinema-cont-emoji">${entry.emoji || '🎬'}</div>
        <div class="cinema-cont-bar">
          <div class="cinema-cont-fill" style="width:${pct}%"></div>
        </div>
      </div>
      <div class="cinema-cont-info">
        <div class="cinema-cont-title">${entry.title}</div>
        ${epLabel}
        <div class="cinema-cont-time">${timeStr} assistidos</div>
        <button class="cinema-cont-resume-btn">▶ Continuar</button>
      </div>
    </div>
  `;
}

function _formatTime(seconds) {
  if (!seconds || seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}
