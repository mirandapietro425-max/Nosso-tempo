/* ═══════════════════════════════════════════════════════════════
   cinema-playlt.js — Integração PlayLT API v5
   Pietro & Emilly · v62

   Substitui cinema-tmdb.js.
   Ponto único de contato com a API externa — para trocar de
   provider no futuro, basta editar ESTE arquivo e config.js.

   Endpoints usados:
     GET /movie?id={tmdbId}
     GET /series?id={tmdbId}
     GET /season?id={tmdbId}&season={n}
     GET /episode?id={tmdbId}&season={n}&episode={n}
     GET /sources?id={contentId}
   ═══════════════════════════════════════════════════════════════ */

import { PLAYLT_API_BASE, PLAYLT_API_KEY } from '../config.js';

/* ── Configuração ─────────────────────────────── */

const BASE      = PLAYLT_API_BASE.replace(/\/$/, ''); // remove trailing slash
const TIMEOUT   = 14_000; // ms por request
const MAX_RETRY = 2;      // tentativas extras em caso de falha de rede

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

/* ── Cache em memória (por sessão) ────────────── */

const _cache = {
  meta    : {}, // tmdbId → meta object
  episodes: {}, // tmdbId → Episode[]
  sources : {}, // contentId → Source
};

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
        // Backoff exponencial: 400ms, 800ms
        await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      return null;
    }
  }
  return null;
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

/* ── API pública ──────────────────────────────── */

/**
 * Busca metadados de um filme pelo TMDB ID.
 * Equivale ao fetchTmdbMeta(item) anterior para filmes.
 */
export async function fetchMovieMeta(item, signal = null) {
  const id = item.tmdbId;
  if (!id) return null;
  if (_cache.meta[`movie_${id}`]) return _cache.meta[`movie_${id}`];

  const data = await _apiFetch(`/movie?id=${id}`, signal);
  const meta = _normalizeMeta(data, true);
  if (meta) _cache.meta[`movie_${id}`] = meta;
  return meta;
}

/**
 * Busca metadados de uma série pelo TMDB ID.
 */
export async function fetchSeriesMeta(item, signal = null) {
  const id = item.tmdbId;
  if (!id) return null;
  if (_cache.meta[`series_${id}`]) return _cache.meta[`series_${id}`];

  const data = await _apiFetch(`/series?id=${id}`, signal);
  const meta = _normalizeMeta(data, false);
  if (meta) _cache.meta[`series_${id}`] = meta;
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
 * Chama /season para cada temporada listada em /series.
 */
export async function fetchAllEpisodes(item, signal = null) {
  const id = item.tmdbId;
  if (!id) return null;
  if (_cache.episodes[id]) return _cache.episodes[id];
  if (signal?.aborted) return null;

  // Primeiro pega os dados gerais da série para saber quantas temporadas tem
  const seriesData = await _apiFetch(`/series?id=${id}`, signal);
  if (!seriesData || signal?.aborted) return null;

  // A API pode retornar seasons como array de números ou de objetos
  // M-06: se seasons é array vazio, cai no fallback de inferência (não retorna null prematuramente)
  let seasons;
  if (Array.isArray(seriesData.seasons) && seriesData.seasons.length > 0) {
    seasons = seriesData.seasons
      .map(s => (typeof s === 'object' ? s.season_number ?? s.number : s))
      .filter(n => n > 0);
  } else {
    seasons = await _inferSeasonNumbers(seriesData);
  }

  if (!seasons.length) return null;

  // Busca cada temporada em paralelo
  const seasonResponses = await Promise.all(
    seasons.map(n =>
      _apiFetch(`/season?id=${id}&season=${n}`, signal).catch(() => null)
    )
  );

  const episodes = [];
  for (const sd of seasonResponses) {
    if (!sd) continue;
    const eps = sd.episodes || sd.data || (Array.isArray(sd) ? sd : []);
    for (const ep of eps) {
      episodes.push(_normalizeEpisode(ep, id));
    }
  }

  if (episodes.length === 0) return null;
  _cache.episodes[id] = episodes;
  return episodes;
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
  if (_cache.sources[key]) return _cache.sources[key];

  const data = await _apiFetch(`/sources?id=${key}`, signal);
  if (!data) return null;

  // Normaliza — API pode retornar array ou objeto único
  const source = Array.isArray(data) ? data[0] : data;
  if (!source?.url) return null;

  const normalized = {
    type: source.type || (source.url.includes('.m3u8') || source.url.includes('.mp4') ? 'stream' : 'iframe'),
    url : source.url,
  };
  _cache.sources[key] = normalized;
  return normalized;
}

/**
 * Expõe o cache de episódios para _renderCatalog poder contar sem fetch.
 * Mantém compatibilidade com cinema.js.
 */
export function getEpisodeCacheFor(tmdbId) {
  return _cache.episodes[tmdbId] ?? null;
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
