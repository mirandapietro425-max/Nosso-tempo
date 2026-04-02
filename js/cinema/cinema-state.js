/* ═══════════════════════════════════════════════
   cinema-state.js — Estado centralizado do Cinema
   Pietro & Emilly · v56
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
  badgeTimeout     : null,   // timer do badge PT-BR — deve ser cancelado no destroyPlayer

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
};

/** Reseta tudo que pertence ao modal sem tocar em db/watched/activeTab */
export function resetModalState() {
  // BUG-6 FIX: cancela o timeout do player antes de zerar o estado
  // Sem isso, o timeout podia disparar após o fechamento do modal e tentar
  // usar cinemaState.currentItem === null, causando erros silenciosos.
  if (cinemaState.playerTimeout) {
    clearTimeout(cinemaState.playerTimeout);
    cinemaState.playerTimeout = null;
  }
  cinemaState.currentItem     = null;
  cinemaState.episodeIdx      = 0;
  cinemaState.serverIdx       = 0;
  cinemaState.dynamicEpisodes = null;
  cinemaState.loadingEpisodes = false;
  cinemaState.isModalOpen     = false;
}

/** Aborta fetches TMDB in-flight e avança geração */
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
}
