/* ═══════════════════════════════════════════════════════════════
   cinema-playlt.js — Integração PlayLT API v5
   Pietro & Emilly · v64

   Substitui cinema-tmdb.js.
   Ponto único de contato com a API externa — para trocar de
   provider no futuro, basta editar ESTE arquivo e config.js.

   Endpoints usados:
     GET /movie?id={tmdbId}
     GET /series?id={tmdbId}
     GET /season?id={tmdbId}&season={n}
     GET /episode?id={tmdbId}&season={n}&episode={n}
     GET /sources?id={contentId}

   v64 fixes:
     [BUG-PROMISE-ALL]  Promise.allSettled em todas as buscas paralelas de seasons
     [BUG-CACHE-STALE]  Cache com TTL (30min meta, 10min episódios, 5min sources)
     [BUG-TMDB-FALLBACK] Fallback direto para TMDB API quando PlayLT offline
   ═══════════════════════════════════════════════════════════════ */

import { PLAYLT_API_BASE, PLAYLT_API_KEY } from '../config.js';

/* ── Configuração ─────────────────────────────── */

const BASE      = PLAYLT_API_BASE.replace(/\/$/, ''); // remove trailing slash
const TIMEOUT   = 14_000; // ms por request
const MAX_RETRY = 2;      // tentativas extras em caso de falha de rede

// TMDB fallback — usado quando PlayLT está offline
const TMDB_BASE    = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = '8265bd1679663a7ea12ac168da84d2e8'; // chave pública de leitura

/* ── Sanitização ──────────────────────────────── */

/** Escapa HTML para uso seguro no DOM */
export function sanitizeTmdb(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/* ── Cache em memória com TTL ─────────────────── */

// BUG-CACHE-STALE FIX: cache com TTL para evitar dados eternamente stale
const TTL_META     = 30 * 60 * 1000;  // 30 min
const TTL_EPISODES = 10 * 60 * 1000;  // 10 min
const TTL_SOURCES  =  5 * 60 * 1000;  //  5 min

const _cache = {
  meta    : {}, // tmdbId → { value, expiresAt }
  episodes: {}, // tmdbId → { value, expiresAt }
  sources : {}, // contentId → { value, expiresAt }
};

function _makeCacheEntry(value, ttl) {
  return { value, expiresAt: Date.now() + ttl };
}

function _cacheGet(bucket, key) {
  const entry = _cache[bucket][key];
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    delete _cache[bucket][key];
    return null;
  }
  return entry.value;
}

/* ── HTTP helper com retry e timeout ──────────── */

/**
 * Faz GET para a API PlayLT com timeout, retry e auth header opcional.
 * @param {string} path   — ex: '/movie?id=597'
 * @param {AbortSignal} [signal]
 * @returns {Promise<object|null>}
 */
async function _apiFetch(path, signal = null) {
  const url     = `${BASE}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (PLAYLT_API_KEY) headers['Authorization'] = `Bearer ${PLAYLT_API_KEY}`;

  for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
    if (signal?.aborted) return null;

    const ctrl      = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), TIMEOUT);

    // Encadeia o signal externo
    const onAbort = () => ctrl.abort();
    signal?.addEventListener('abort', onAbort, { once: true });

    try {
      const res = await fetch(url, { headers, signal: ctrl.signal });
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', onAbort);

      if (!res.ok) {
        // 4xx → não adianta fazer retry
        if (res.status >= 400 && res.status < 500) return null;
        // 5xx → retry
        if (attempt < MAX_RETRY) continue;
        return null;
      }

      return await res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', onAbort);
      if (signal?.aborted || ctrl.signal.aborted) return null;
      if (attempt < MAX_RETRY) {
        // BUG-CACHE-STALE: backoff exponencial mais agressivo: 400ms → 800ms → 1600ms
        await new Promise(r => setTimeout(r, 400 * Math.pow(2, attempt)));
        continue;
      }
      return null;
    }
  }
  return null;
}

/* ── TMDB fallback fetch ──────────────────────── */

async function _tmdbFetch(path, signal = null) {
  const sep = path.includes('?') ? '&' : '?';
  const url = `${TMDB_BASE}${path}${sep}api_key=${TMDB_API_KEY}&language=pt-BR`;
  try {
    const ctrl      = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 10_000);
    const onAbort   = () => ctrl.abort();
    signal?.addEventListener('abort', onAbort, { once: true });
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onAbort);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/* ── Normalização de dados ────────────────────── */

/**
 * Normaliza a resposta da API para o formato interno usado pelo cinema.js.
 * Se a PlayLT mudar o schema, só este bloco precisa ser atualizado.
 */
function _normalizeMeta(data, isMovie) {
  if (!data) return null;
  return {
    isMovie,
    overview : sanitizeTmdb(data.overview  || data.synopsis || ''),
    tagline  : sanitizeTmdb(data.tagline   || ''),
    genres   : Array.isArray(data.genres)
                 ? data.genres.map(g => sanitizeTmdb(typeof g === 'string' ? g : g.name)).join(', ')
                 : sanitizeTmdb(data.genres || ''),
    runtime  : isMovie
                 ? (data.runtime   ? `${data.runtime} min`        : null)
                 : (data.episodeRuntime ? `~${data.episodeRuntime} min/ep` : null),
    vote     : data.rating ?? data.vote_average ?? null,
    cast     : Array.isArray(data.cast)
                 ? data.cast.slice(0, 5).map(a => sanitizeTmdb(a.name || a)).join(', ')
                 : sanitizeTmdb(data.cast || ''),
    poster   : data.poster   || data.poster_path   || null,
    backdrop : data.backdrop || data.backdrop_path || null,
    year     : data.year     || data.release_year  || null,
  };
}

function _normalizeEpisode(ep, seriesId) {
  const s = ep.season   ?? ep.season_number   ?? 1;
  const e = ep.episode  ?? ep.episode_number  ?? 1;
  const name = sanitizeTmdb(ep.title || ep.name || `Episódio ${e}`);
  return {
    title  : `T${s}E${e} — ${name}`,
    season : s,
    episode: e,
    overview: sanitizeTmdb(ep.overview || ''),
    still  : ep.still || ep.still_path
               ? (ep.still || ep.still_path)
               : null,
    // ID para busca de sources — prefere o id do episódio, senão monta string
    contentId: ep.id ?? ep.contentId ?? `${seriesId}_s${s}e${e}`,
  };
}

/* ── TMDB fallback: meta ──────────────────────── */

async function _fetchMovieMetaFromTMDB(id, signal) {
  const data = await _tmdbFetch(`/movie/${id}`, signal);
  if (!data) return null;
  // Adapta schema TMDB para _normalizeMeta
  data.rating = data.vote_average;
  data.genres = data.genres?.map(g => g.name) || [];
  data.year   = data.release_date?.slice(0, 4) || null;
  return _normalizeMeta(data, true);
}

async function _fetchSeriesMetaFromTMDB(id, signal) {
  const data = await _tmdbFetch(`/tv/${id}`, signal);
  if (!data) return null;
  data.rating          = data.vote_average;
  data.genres          = data.genres?.map(g => g.name) || [];
  data.year            = data.first_air_date?.slice(0, 4) || null;
  data.episodeRuntime  = data.episode_run_time?.[0] || null;
  return _normalizeMeta(data, false);
}

/* ── TMDB fallback: episodes ──────────────────── */

async function _fetchEpisodesFromTMDB(id, signal) {
  // Busca informações da série para saber quantas temporadas tem
  const seriesData = await _tmdbFetch(`/tv/${id}`, signal);
  if (!seriesData || signal?.aborted) return null;

  const numSeasons = seriesData.number_of_seasons || 1;
  const seasons    = Array.from({ length: numSeasons }, (_, i) => i + 1);

  // BUG-PROMISE-ALL FIX: allSettled para não abortar se uma season retornar 404
  const results = await Promise.allSettled(
    seasons.map(n => _tmdbFetch(`/tv/${id}/season/${n}`, signal))
  );

  const episodes = [];
  for (const result of results) {
    if (result.status !== 'fulfilled' || !result.value) continue;
    const sd  = result.value;
    const eps = sd.episodes || [];
    for (const ep of eps) {
      episodes.push(_normalizeEpisode(ep, id));
    }
  }
  return episodes.length > 0 ? episodes : null;
}

/* ── API pública ──────────────────────────────── */

/**
 * Busca metadados de um filme pelo TMDB ID.
 * Equivale ao fetchTmdbMeta(item) anterior para filmes.
 * BUG-TMDB-FALLBACK FIX: cai para TMDB oficial quando PlayLT offline.
 */
export async function fetchMovieMeta(item, signal = null) {
  const id = item.tmdbId;
  if (!id) return null;

  const cached = _cacheGet('meta', `movie_${id}`);
  if (cached) return cached;

  let meta = null;

  if (PLAYLT_ENABLED) {
    const data = await _apiFetch(`/movie?id=${id}`, signal);
    meta = _normalizeMeta(data, true);
  }

  // BUG-TMDB-FALLBACK FIX: fallback direto para TMDB se PlayLT offline ou sem dados
  if (!meta) {
    meta = await _fetchMovieMetaFromTMDB(id, signal);
  }

  if (meta) _cache.meta[`movie_${id}`] = _makeCacheEntry(meta, TTL_META);
  return meta;
}

/**
 * Busca metadados de uma série pelo TMDB ID.
 * BUG-TMDB-FALLBACK FIX: cai para TMDB oficial quando PlayLT offline.
 */
export async function fetchSeriesMeta(item, signal = null) {
  const id = item.tmdbId;
  if (!id) return null;

  const cached = _cacheGet('meta', `series_${id}`);
  if (cached) return cached;

  let meta = null;

  if (PLAYLT_ENABLED) {
    const data = await _apiFetch(`/series?id=${id}`, signal);
    meta = _normalizeMeta(data, false);
  }

  // BUG-TMDB-FALLBACK FIX: fallback para TMDB se PlayLT offline
  if (!meta) {
    meta = await _fetchSeriesMetaFromTMDB(id, signal);
  }

  if (meta) _cache.meta[`series_${id}`] = _makeCacheEntry(meta, TTL_META);
  return meta;
}

/**
 * Wrapper unificado — substitui fetchTmdbMeta.
 * Detecta tipo automaticamente pelo item.type.
 */
export async function fetchTmdbMeta(item, signal = null) {
  const isMovie = item.type === 'movie';
  return isMovie
    ? fetchMovieMeta(item, signal)
    : fetchSeriesMeta(item, signal);
}

/**
 * Busca todos os episódios de uma série — substitui fetchAllEpisodes.
 * BUG-PROMISE-ALL FIX: Promise.allSettled para não abortar se uma season falhar.
 * BUG-TMDB-FALLBACK FIX: fallback para TMDB quando PlayLT offline.
 */
export async function fetchAllEpisodes(item, signal = null) {
  const id = item.tmdbId;
  if (!id) return null;

  const cached = _cacheGet('episodes', id);
  if (cached) return cached;
  if (signal?.aborted) return null;

  let episodes = null;

  if (PLAYLT_ENABLED) {
    // Primeiro pega os dados gerais da série para saber quantas temporadas tem
    const seriesData = await _apiFetch(`/series?id=${id}`, signal);
    if (seriesData && !signal?.aborted) {
      let seasons;
      if (Array.isArray(seriesData.seasons) && seriesData.seasons.length > 0) {
        seasons = seriesData.seasons
          .map(s => (typeof s === 'object' ? s.season_number ?? s.number : s))
          .filter(n => n > 0);
      } else {
        seasons = await _inferSeasonNumbers(seriesData);
      }

      if (seasons.length > 0) {
        // BUG-PROMISE-ALL FIX: allSettled para não abortar se uma season retornar 404
        const results = await Promise.allSettled(
          seasons.map(n =>
            _apiFetch(`/season?id=${id}&season=${n}`, signal)
          )
        );

        const eps = [];
        for (const result of results) {
          if (result.status !== 'fulfilled' || !result.value) continue;
          const sd = result.value;
          const seasonEps = sd.episodes || sd.data || (Array.isArray(sd) ? sd : []);
          for (const ep of seasonEps) {
            eps.push(_normalizeEpisode(ep, id));
          }
        }
        if (eps.length > 0) episodes = eps;
      }
    }
  }

  // BUG-TMDB-FALLBACK FIX: fallback para TMDB se PlayLT offline ou sem episódios
  if (!episodes) {
    episodes = await _fetchEpisodesFromTMDB(id, signal);
  }

  if (episodes && episodes.length > 0) {
    _cache.episodes[id] = _makeCacheEntry(episodes, TTL_EPISODES);
    return episodes;
  }
  return null;
}

/**
 * Fallback: se /series não retornar seasons, tenta de 1 a N até 404.
 */
async function _inferSeasonNumbers(seriesData) {
  // Usa total_seasons ou numberOfSeasons se disponível
  const total = seriesData.total_seasons
    ?? seriesData.numberOfSeasons
    ?? seriesData.seasons_count
    ?? 1;
  return Array.from({ length: total }, (_, i) => i + 1);
}

/**
 * Busca as fontes de reprodução de um conteúdo.
 * Retorna um objeto { type, url } ou null.
 * type pode ser 'iframe' ou 'stream' (m3u8/mp4).
 */
export async function fetchSources(contentId, signal = null) {
  if (!contentId) return null;
  const key = String(contentId);

  const cached = _cacheGet('sources', key);
  if (cached) return cached;

  const data = await _apiFetch(`/sources?id=${key}`, signal);
  if (!data) return null;

  // Normaliza — API pode retornar array ou objeto único
  const source = Array.isArray(data) ? data[0] : data;
  if (!source?.url) return null;

  const normalized = {
    type: source.type || (source.url.includes('.m3u8') || source.url.includes('.mp4') ? 'stream' : 'iframe'),
    url : source.url,
  };
  _cache.sources[key] = _makeCacheEntry(normalized, TTL_SOURCES);
  return normalized;
}

/**
 * Expõe o cache de episódios para _renderCatalog poder contar sem fetch.
 * Mantém compatibilidade com cinema.js.
 */
export function getEpisodeCacheFor(tmdbId) {
  return _cacheGet('episodes', tmdbId);
}

/**
 * Flag: true se a API PlayLT está configurada (BASE não vazio).
 * Usado em cinema-player.js para pular a chamada PlayLT quando não configurada,
 * evitando 14s de timeout antes do fallback em cada reprodução.
 */
export const PLAYLT_ENABLED = typeof PLAYLT_API_BASE === 'string' && PLAYLT_API_BASE.length > 0;

/**
 * Limpa todo o cache (útil após logout ou troca de usuário).
 */
export function clearPlayltCache() {
  Object.keys(_cache.meta).forEach(k => delete _cache.meta[k]);
  Object.keys(_cache.episodes).forEach(k => delete _cache.episodes[k]);
  Object.keys(_cache.sources).forEach(k => delete _cache.sources[k]);
}
