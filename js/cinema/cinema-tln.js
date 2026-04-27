/* ═══════════════════════════════════════════════════════════════
   cinema-tln.js — Integração TLN API v1
   Pietro & Emilly

   Ponto único de contato com a TLN API.
   Para trocar de provider no futuro, edite apenas este arquivo.

   Bases com fallback automático:
     1. https://app.tln.plus/api  (primário)
     2. https://app.tln.plus      (fallback)

   Endpoints:
     GET /watch/{contentId}/providers
     GET /watch/{contentId}/source?provider={providerId}
     POST /watch/progress
     GET /watch/continue
   ═══════════════════════════════════════════════════════════════ */

/* ── Configuração ─────────────────────────────── */

const TLN_BASES = [
  'https://app.tln.plus/api',
  'https://app.tln.plus',
];

const TLN_TIMEOUT    = 15_000; // ms por request
const TLN_RETRY      = 2;      // tentativas extras por base
const PROGRESS_INTERVAL_MS = 15_000; // salvar progresso a cada 15s

/* ── Flag de ativação ─────────────────────────── */

/**
 * TLN sempre habilitado — não depende de config.js.
 * O fallback para servidores iframe ocorre automaticamente se todos os
 * providers TLN falharem.
 */
export const TLN_ENABLED = true;

/* ── Cache em memória com TTL ─────────────────── */

const TTL_PROVIDERS = 5  * 60 * 1000;  //  5 min
const TTL_SOURCE    = 3  * 60 * 1000;  //  3 min
const TTL_CONTINUE  = 2  * 60 * 1000;  //  2 min

const _cache = {
  providers: {},  // contentId  → { value, expiresAt }
  sources:   {},  // `${contentId}_${providerId}` → { value, expiresAt }
  continue:  null, // { value, expiresAt }
};

function _cacheGet(bucket, key) {
  const store = _cache[bucket];
  const entry = (typeof store === 'object' && store !== null && !Array.isArray(store))
    ? store[key]
    : store;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    if (typeof store === 'object' && key) delete store[key];
    else _cache[bucket] = null;
    return null;
  }
  return entry.value;
}

function _cacheSet(bucket, key, value, ttl) {
  const entry = { value, expiresAt: Date.now() + ttl };
  if (key !== null) {
    _cache[bucket][key] = entry;
  } else {
    _cache[bucket] = entry;
  }
}

/* ── HTTP helper com multi-base + retry + timeout ── */

const _defaultHeaders = {
  'Accept':       'application/json',
  'Content-Type': 'application/json',
};

/**
 * Tenta o request em cada base TLN em ordem.
 * Primeiro base que responder com sucesso vence.
 * @param {string} path   — ex: '/watch/597/providers'
 * @param {object} [opts] — fetch options adicionais (method, body, signal)
 * @returns {Promise<object|null>}
 */
async function _tlnFetch(path, opts = {}) {
  const { signal: externalSignal, ...restOpts } = opts;

  for (const base of TLN_BASES) {
    const url = `${base}${path}`;

    for (let attempt = 0; attempt <= TLN_RETRY; attempt++) {
      if (externalSignal?.aborted) return null;

      const ctrl      = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), TLN_TIMEOUT);

      // Encadeia o signal externo
      const onAbort = () => ctrl.abort();
      externalSignal?.addEventListener('abort', onAbort, { once: true });

      try {
        const res = await fetch(url, {
          ...restOpts,
          headers: { ..._defaultHeaders, ...(restOpts.headers || {}) },
          signal: ctrl.signal,
        });

        clearTimeout(timeoutId);
        externalSignal?.removeEventListener('abort', onAbort);

        if (!res.ok) {
          // 4xx → não tenta retry nesta base, avança para a próxima
          if (res.status >= 400 && res.status < 500) break;
          // 5xx → retry
          if (attempt < TLN_RETRY) continue;
          break; // esgotou retries → próxima base
        }

        const data = await res.json();
        return data;

      } catch (err) {
        clearTimeout(timeoutId);
        externalSignal?.removeEventListener('abort', onAbort);

        if (externalSignal?.aborted) return null;
        if (ctrl.signal.aborted && err.name !== 'AbortError') {
          // timeout próprio
          if (attempt < TLN_RETRY) {
            await new Promise(r => setTimeout(r, 400 * Math.pow(2, attempt)));
            continue;
          }
          break; // próxima base
        }
        if (attempt < TLN_RETRY) {
          await new Promise(r => setTimeout(r, 400 * Math.pow(2, attempt)));
          continue;
        }
        break; // erro de rede → próxima base
      }
    }
    // Se chegou aqui, esta base falhou — tenta a próxima
  }

  return null; // todas as bases falharam
}

/* ── Providers ────────────────────────────────── */

/**
 * Busca a lista de providers disponíveis para um conteúdo.
 * Retorna array de providers ou null se a API não responder.
 *
 * Estrutura esperada de cada provider:
 *   { id: string, name: string, preferred?: boolean, ...qualquer extra }
 *
 * @param {string|number} contentId
 * @param {AbortSignal}   [signal]
 * @returns {Promise<Array|null>}
 */
export async function getProviders(contentId, signal) {
  if (!contentId) return null;
  const key = String(contentId);

  const cached = _cacheGet('providers', key);
  if (cached) return cached;

  const data = await _tlnFetch(`/watch/${encodeURIComponent(key)}/providers`, { signal });
  if (!data) return null;

  // Normaliza — API pode retornar array direto ou { providers: [...] }
  const list = Array.isArray(data)
    ? data
    : (Array.isArray(data.providers) ? data.providers : null);

  if (!list || list.length === 0) return null;

  _cacheSet('providers', key, list, TTL_PROVIDERS);
  return list;
}

/**
 * Seleciona automaticamente o melhor provider da lista:
 * 1. Primeiro com preferred=true
 * 2. Fallback: primeiro da lista
 *
 * @param {Array} providers
 * @returns {object|null}
 */
export function selectPreferredProvider(providers) {
  if (!Array.isArray(providers) || providers.length === 0) return null;
  return providers.find(p => p.preferred === true) ?? providers[0];
}

/* ── Source ───────────────────────────────────── */

/**
 * Resolve a source de um provider específico para um conteúdo.
 *
 * Resposta esperada da TLN:
 * {
 *   stream: "https://cdn.domain.com/master.m3u8",
 *   type: "hls",                    // "hls" | "mp4" | "iframe"
 *   subtitles: [{ label, file, default }],
 *   intro: { start, end },
 *   outro: { start, end },
 *   duration: 1420,
 *   nextEpisodeId: "..."
 * }
 *
 * @param {string|number} contentId
 * @param {string}        providerId
 * @param {AbortSignal}   [signal]
 * @returns {Promise<object|null>}
 */
export async function getSource(contentId, providerId, signal) {
  if (!contentId || !providerId) return null;
  const cacheKey = `${contentId}_${providerId}`;

  const cached = _cacheGet('sources', cacheKey);
  if (cached) return cached;

  const data = await _tlnFetch(
    `/watch/${encodeURIComponent(String(contentId))}/source?provider=${encodeURIComponent(String(providerId))}`,
    { signal }
  );

  if (!data) return null;

  // Garante que há uma URL válida de stream
  const streamUrl = data.stream || data.url || null;
  if (!streamUrl) return null;

  const normalized = {
    stream:        streamUrl,
    type:          data.type || (streamUrl.includes('.m3u8') ? 'hls' : 'mp4'),
    subtitles:     Array.isArray(data.subtitles) ? data.subtitles : [],
    intro:         data.intro  || null,
    outro:         data.outro  || null,
    duration:      data.duration || null,
    nextEpisodeId: data.nextEpisodeId || null,
  };

  _cacheSet('sources', cacheKey, normalized, TTL_SOURCE);
  return normalized;
}

/* ── Resolução automática: providers + source ── */

/**
 * Resolve automaticamente o melhor source disponível para um conteúdo:
 * 1. Busca providers
 * 2. Seleciona o preferred
 * 3. Busca source
 * 4. Se falhar, tenta o próximo provider
 *
 * @param {string|number} contentId
 * @param {AbortSignal}   [signal]
 * @returns {Promise<{ source: object, provider: object, providerIdx: number, providers: Array }|null>}
 */
export async function autoResolveSource(contentId, signal) {
  const providers = await getProviders(contentId, signal);
  if (!providers || signal?.aborted) return null;

  // Ordena: preferred primeiro, resto na ordem original
  const ordered = [
    ...providers.filter(p => p.preferred),
    ...providers.filter(p => !p.preferred),
  ];

  for (let i = 0; i < ordered.length; i++) {
    if (signal?.aborted) return null;
    const provider = ordered[i];
    const source   = await getSource(contentId, provider.id, signal);
    if (source) {
      return {
        source,
        provider,
        providerIdx: i,
        providers: ordered,
      };
    }
  }

  return null; // todos os providers falharam
}

/* ── Progresso ────────────────────────────────── */

let _progressTimer    = null;
let _progressPayload  = null;

/**
 * Salva o progresso de reprodução na TLN API.
 * Fire-and-forget — não bloqueia a UI.
 * @param {object} payload — { contentId, episodeId, position, duration }
 */
export function saveProgress(payload) {
  if (!payload?.contentId) return;
  _progressPayload = payload;
  _flushProgress();
}

function _flushProgress() {
  const p = _progressPayload;
  if (!p) return;
  _progressPayload = null;

  _tlnFetch('/watch/progress', {
    method: 'POST',
    body:   JSON.stringify(p),
  }).catch(() => {}); // sempre silencioso
}

/**
 * Inicia o timer de progresso automático (a cada 15s).
 * @param {Function} getPayload — () => { contentId, episodeId, position, duration }
 */
export function startProgressSync(getPayload) {
  stopProgressSync();
  _progressTimer = setInterval(() => {
    const payload = getPayload();
    if (payload) saveProgress(payload);
  }, PROGRESS_INTERVAL_MS);
}

/**
 * Para o timer de progresso automático.
 */
export function stopProgressSync() {
  if (_progressTimer) {
    clearInterval(_progressTimer);
    _progressTimer = null;
  }
}

/* ── Continue Watching ────────────────────────── */

/**
 * Busca a lista "continue assistindo" da TLN API.
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array|null>}
 */
export async function getContinueWatching(signal) {
  const cached = _cacheGet('continue', null);
  if (cached) return cached;

  const data = await _tlnFetch('/watch/continue', { signal });
  if (!data) return null;

  const list = Array.isArray(data) ? data : (data.items || data.list || null);
  if (!list) return null;

  _cacheSet('continue', null, list, TTL_CONTINUE);
  return list;
}

/* ── Cache management ─────────────────────────── */

/**
 * Limpa todo o cache TLN (útil em logout ou hard-refresh).
 */
export function clearTlnCache() {
  _cache.providers = {};
  _cache.sources   = {};
  _cache.continue  = null;
}
