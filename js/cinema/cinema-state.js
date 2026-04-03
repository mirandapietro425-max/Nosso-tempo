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

  /* ── v79 mobile fixes ── */
  failedServers    : new Set(),   // M1: era _failedThisSession no módulo — movido para state para reset correto entre modais
  lastAutoSwitchTs : 0,           // M1: era _lastAutoSwitchTs no módulo — não resetava entre modais

  /* ── v81 UX premium ── */
  liveIframe       : null,        // X1: iframe ativo atual (crossfade — mantém visível durante troca)
  preloadedIframe  : null,        // D1: iframe pré-carregado em background (dual-iframe)
  preloadedIdx     : -1,          // D1: serverIdx do iframe pré-carregado
  preloadedReady   : false,       // D1: true somente após onload + 300ms warm-up
  preloadAbortCtrl : null,        // D1: AbortController para cancelar preload em andamento
  fakeLoadTimer    : null,        // X3: timeout pós-onload para detectar player falso
  badConnectionMode: false,       // X4: modo conexão ruim — timeouts reduzidos, pula servidores lentos
  nextEpTimer      : null,        // X6: countdown "próximo episódio em 5s"
  nextEpOverlay    : null,        // X6: referência ao overlay de next-ep
  watchPartyToastShown: false,    // X7: toast "assistindo juntos" já foi exibido nesta sessão
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
  // M1: reset mobile-fix state (eram vars de módulo — agora aqui para garantir reset entre modais)
  cinemaState.failedServers.clear();
  cinemaState.lastAutoSwitchTs = 0;
  // v81: reset UX premium fields
  cinemaState.liveIframe        = null;  // modal fechou — próxima abertura começa limpa
  // D1: aborta e limpa dual-iframe ao fechar modal
  if (cinemaState.preloadAbortCtrl) { try { cinemaState.preloadAbortCtrl.abort(); } catch(_) {} cinemaState.preloadAbortCtrl = null; }
  if (cinemaState.preloadedIframe && cinemaState.preloadedIframe.isConnected) {
    try { cinemaState.preloadedIframe.src = 'about:blank'; cinemaState.preloadedIframe.remove(); } catch(_) {}
  }
  cinemaState.preloadedIframe  = null;
  cinemaState.preloadedIdx     = -1;
  cinemaState.preloadedReady   = false;
  if (cinemaState.fakeLoadTimer)  { clearTimeout(cinemaState.fakeLoadTimer);  cinemaState.fakeLoadTimer = null; }
  cinemaState.badConnectionMode = false;
  if (cinemaState.nextEpTimer)    { clearTimeout(cinemaState.nextEpTimer);    cinemaState.nextEpTimer = null; }
  cinemaState.nextEpOverlay?.remove();
  cinemaState.nextEpOverlay     = null;
  cinemaState.watchPartyToastShown = false;
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
  // M1: novo item → limpa blacklist e debounce
  cinemaState.failedServers.clear();
  cinemaState.lastAutoSwitchTs = 0;
  // X4: novo item → sai do modo conexão ruim
  cinemaState.badConnectionMode = false;
  // D1: novo item → descarta preload anterior
  if (cinemaState.preloadAbortCtrl) { try { cinemaState.preloadAbortCtrl.abort(); } catch(_) {} cinemaState.preloadAbortCtrl = null; }
  if (cinemaState.preloadedIframe && cinemaState.preloadedIframe.isConnected) {
    try { cinemaState.preloadedIframe.src = 'about:blank'; cinemaState.preloadedIframe.remove(); } catch(_) {}
  }
  cinemaState.preloadedIframe = null;
  cinemaState.preloadedIdx    = -1;
  cinemaState.preloadedReady  = false;
  return cinemaState.generation;
}
