/* ═══════════════════════════════════════════════
   cinema-state.js — Estado centralizado do Cinema
   Pietro & Emilly · v64
   ═══════════════════════════════════════════════ */

/**
 * Estado mutable centralizado do módulo Cinema.
 * Todas as funções leem/escrevem aqui — sem variáveis globais soltas.
 * Nunca importe diretamente de fora; use os accessors de cinema.js.
 */
export const cinemaState = {
  /* ── player ── */
  currentItem      : null,
  episodeIdx       : 0,
  serverIdx        : 0,
  playerTimeout    : null,
  badgeTimeout     : null,   // timer do badge PT-BR — cancelado em destroyPlayer e resetModalState

  /* ── watchdog ── */
  watchdogTimer    : null,   // setInterval do watchdog de iframe
  watchdogStart    : 0,      // Date.now() quando watchdog iniciou

  /* ── modal ── */
  isModalOpen      : false,
  dynamicEpisodes  : null,
  loadingEpisodes  : false,

  /* ── race-condition guards ── */
  generation       : 0,          // incrementado a cada _openCinemaItem
  episodeFetchCtrl : null,        // AbortController do fetch de episódios
  metaFetchCtrl    : null,        // AbortController do fetch de metadados

  /* ── firebase / persistência ── */
  db               : null,
  cinemaDoc        : null,
  watched          : {},
  saveDebounce     : null,

  /* ── UI ── */
  activeTab        : 'series',

  /* ── HARDENING v64+ ── */
  playerDestroyed  : false,       // F6: idempotent destroy guard
  activeTimers     : [],          // F7: timer registry for full cleanup
  freezeTimer      : null,        // F2: freeze detection timer
  silentSwitching  : false,       // F3: silent server switch in progress

  /* ── v78 smart player (P1-P8) ── */
  earlyExitTimer   : null,        // P2: 6s early exit se skeleton ainda presente
  slowNetworkTimer : null,        // P7: 4s UX "conexão lenta"
  preloadCtrl      : null,        // P5: AbortController do ping de preload
  autoSwitchCount  : 0,           // P9: quantas trocas automáticas já ocorreram neste item
  earlyExitFired   : false,       // P9: early exit já disparou — não repetir automaticamente
};

/** Reseta tudo que pertence ao modal sem tocar em db/watched/activeTab */
export function resetModalState() {
  // Cancela todos os timers pendentes antes de zerar o estado
  if (cinemaState.playerTimeout) {
    clearTimeout(cinemaState.playerTimeout);
    cinemaState.playerTimeout = null;
  }
  // BUG-RESETSTATE-BADGE FIX: cancela badge para não disparar em elemento já removido do DOM
  if (cinemaState.badgeTimeout) {
    clearTimeout(cinemaState.badgeTimeout);
    cinemaState.badgeTimeout = null;
  }
  // BUG-WATCHDOG FIX: para o watchdog se modal fechar durante o intervalo
  if (cinemaState.watchdogTimer) {
    clearInterval(cinemaState.watchdogTimer);
    cinemaState.watchdogTimer = null;
  }
  cinemaState.currentItem     = null;
  cinemaState.episodeIdx      = 0;
  cinemaState.serverIdx       = 0;
  cinemaState.dynamicEpisodes = null;
  cinemaState.loadingEpisodes = false;
  cinemaState.isModalOpen     = false;
  cinemaState.watchdogStart   = 0;
  // F6/F7: reset hardening fields
  cinemaState.playerDestroyed = false;
  cinemaState.silentSwitching = false;
  if (cinemaState.freezeTimer) { clearTimeout(cinemaState.freezeTimer); cinemaState.freezeTimer = null; }
  cinemaState.activeTimers.forEach(t => clearTimeout(t));
  cinemaState.activeTimers = [];
  // P2/P5/P7: reset smart player fields
  if (cinemaState.earlyExitTimer)   { clearTimeout(cinemaState.earlyExitTimer);   cinemaState.earlyExitTimer = null; }
  if (cinemaState.slowNetworkTimer) { clearTimeout(cinemaState.slowNetworkTimer); cinemaState.slowNetworkTimer = null; }
  if (cinemaState.preloadCtrl)      { try { cinemaState.preloadCtrl.abort(); } catch(_) {} cinemaState.preloadCtrl = null; }
  // P9: reset auto-switch counters
  cinemaState.autoSwitchCount = 0;
  cinemaState.earlyExitFired  = false;
}

/**
 * Aborta fetches TMDB in-flight, avança geração e retorna o novo valor.
 * BUG-GENERATION FIX: retornar o valor pós-incremento elimina a fragilidade
 * de capturar cinemaState.generation na linha seguinte à chamada.
 * @returns {number} nova geração
 */
export function abortInFlightFetches() {
  if (cinemaState.episodeFetchCtrl) {
    cinemaState.episodeFetchCtrl.abort();
    cinemaState.episodeFetchCtrl = null;
  }
  if (cinemaState.metaFetchCtrl) {
    cinemaState.metaFetchCtrl.abort();
    cinemaState.metaFetchCtrl = null;
  }
  cinemaState.generation += 1;
  // P9: novo item → zera contadores de auto-troca
  cinemaState.autoSwitchCount = 0;
  cinemaState.earlyExitFired  = false;
  return cinemaState.generation;
}
