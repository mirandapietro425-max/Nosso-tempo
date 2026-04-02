/* ═══════════════════════════════════════════════
   cinema-tmdb.js — Integração TMDB
   Pietro & Emilly · v56
   ═══════════════════════════════════════════════ */

import { TMDB_KEY } from '../config.js';

const TMDB_BASE = 'https://api.themoviedb.org/3';

// Caches em memória (vivem durante a sessão — evitam refetch desnecessário)
const _episodeCache = {};
const _metaCache    = {};

/** Sanitiza texto vindo do TMDB antes de inserir no DOM */
export function sanitizeTmdb(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Busca todos os episódios de uma série no TMDB em PT-BR.
 * @param {object} item         — item do catálogo (precisa de tmdbId)
 * @param {AbortSignal} [externalSignal] — signal externo para cancelamento imediato
 * @returns {Array|null}
 */
export async function fetchAllEpisodes(item, externalSignal = null) {
  const id = item.tmdbId;
  if (!id) return null;
  if (_episodeCache[id]) return _episodeCache[id];
  if (externalSignal?.aborted) return null;

  const ctrl      = new AbortController();
  const timeoutId = setTimeout(() => ctrl.abort(), 12_000);
  const forward   = () => ctrl.abort();
  externalSignal?.addEventListener('abort', forward);
  const signal = ctrl.signal;

  try {
    const detailRes = await fetch(
      `${TMDB_BASE}/tv/${id}?api_key=${TMDB_KEY}&language=pt-BR`,
      { signal }
    );
    if (!detailRes.ok) return null;

    const detail  = await detailRes.json();
    const seasons = (detail.seasons || []).filter(s => s.season_number > 0);

    const seasonData = await Promise.all(
      seasons.map(s =>
        fetch(
          `${TMDB_BASE}/tv/${id}/season/${s.season_number}?api_key=${TMDB_KEY}&language=pt-BR`,
          { signal }
        )
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    );

    const episodes = [];
    for (const sd of seasonData) {
      if (!sd?.episodes) continue;
      for (const ep of sd.episodes) {
        const name = ep.name?.trim() || `Episódio ${ep.episode_number}`;
        episodes.push({
          title   : `T${ep.season_number}E${ep.episode_number} — ${sanitizeTmdb(name)}`,
          season  : ep.season_number,
          episode : ep.episode_number,
          overview: ep.overview || '',
          still   : ep.still_path
            ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
            : null,
        });
      }
    }

    _episodeCache[id] = episodes.length > 0 ? episodes : null;
    return _episodeCache[id];
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', forward);
  }
}

/**
 * Busca metadados de um item (filme ou série) no TMDB em PT-BR.
 * @param {object} item
 * @param {AbortSignal} [externalSignal]
 * @returns {object|null}
 */
export async function fetchTmdbMeta(item, externalSignal = null) {
  const id = item.tmdbId;
  if (!id) return null;
  if (_metaCache[id]) return _metaCache[id];
  if (externalSignal?.aborted) return null;

  const ctrl      = new AbortController();
  const timeoutId = setTimeout(() => ctrl.abort(), 10_000);
  const forward   = () => ctrl.abort();
  externalSignal?.addEventListener('abort', forward);
  const signal = ctrl.signal;

  try {
    const isMovie  = item.type === 'movie';
    const endpoint = isMovie ? 'movie' : 'tv';

    const [detailRes, creditsRes] = await Promise.all([
      fetch(`${TMDB_BASE}/${endpoint}/${id}?api_key=${TMDB_KEY}&language=pt-BR`, { signal }),
      fetch(`${TMDB_BASE}/${endpoint}/${id}/credits?api_key=${TMDB_KEY}&language=pt-BR`, { signal }),
    ]);

    const detail  = detailRes.ok  ? await detailRes.json()  : null;
    const credits = creditsRes.ok ? await creditsRes.json() : null;
    if (!detail) return null;

    const runtime = isMovie
      ? (detail.runtime ? `${detail.runtime} min` : null)
      : (detail.episode_run_time?.[0] ? `~${detail.episode_run_time[0]} min/ep` : null);

    const cast     = (credits?.cast || []).slice(0, 5).map(a => sanitizeTmdb(a.name)).join(', ');
    const genres   = (detail.genres || []).map(g => sanitizeTmdb(g.name)).join(', ');
    const overview = sanitizeTmdb(detail.overview?.trim()) || null;
    const tagline  = sanitizeTmdb(detail.tagline?.trim())  || null;
    const vote     = detail.vote_average
      ? Math.round(detail.vote_average * 10) / 10
      : null;

    const meta = { runtime, cast, genres, overview, tagline, vote, isMovie };
    _metaCache[id] = meta;
    return meta;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', forward);
  }
}

/** Expõe cache de episódios para _renderCatalog poder contar sem fetch */
export function getEpisodeCacheFor(tmdbId) {
  return _episodeCache[tmdbId] ?? null;
}
