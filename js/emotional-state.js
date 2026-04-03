/* ═══════════════════════════════════════════════════════════════
   PIETRO & EMILLY — emotional-state.js  v1
   Progressão Emocional Invisível

   Lê o estado real do relacionamento e adapta o app
   silenciosamente. O casal nunca vê o sistema —
   só sente que "o app entende a nossa história".

   Fases do relacionamento:
     inicio     → estão descobrindo o app juntos
     conexao    → usando com frequência, criando memórias
     rotina     → uso estável, vínculo estabelecido
     nostalgia  → voltam depois de um tempo, relembram

   Dependências (todas opcionais / com fallback):
     window._loveCity    — love-city-core.js
     window.showToast    — ui.js
     loveCity.unlock.daysUsed — event-unlock.js (leitura apenas)
   ═══════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════
   CONSTANTES
   ════════════════════════════════════════════ */

const LS_DAYS_USED    = 'loveCity.unlock.daysUsed';   // compartilhado com event-unlock
const LS_ES_CACHE     = 'loveCity.emotionalState.v1'; // cache deste módulo
const LS_ES_TOASTS    = 'loveCity.es.toasts';         // registro de toasts já exibidos
const LS_ES_APP_OPEN  = 'loveCity.es.appOpenDate';    // BUG-4: guard 1x/dia no open

/* Intervalo mínimo entre análises — 60 segundos */
const ANALYSIS_THROTTLE_MS = 60_000;

/* ════════════════════════════════════════════
   MICRO-REAÇÕES POR FASE
   Textos sutis que aparecem como toast leve.
   Cada texto é usado no máximo 1x por dia.
   ════════════════════════════════════════════ */

const PHASE_REACTIONS = {
  inicio: [
    'que bom que vocês estão aqui 💛',
    'cada momento guardado conta',
    'isso é só o começo de vocês ✨',
  ],
  conexao: [
    'vocês estão construindo algo bonito',
    'a história de vocês está crescendo 💕',
    'cada memória é um pedaço real',
  ],
  rotina: [
    'esse momento ainda é especial',
    'a rotina de vocês é bonita assim',
    'alguns dias são exatamente como deveriam ser',
  ],
  nostalgia: [
    'faz tempo que isso aconteceu… 💭',
    'bom ter vocês de volta',
    'algumas histórias pedem pra ser relembradas',
  ],
};

/* Reações para tipos específicos de memória */
const MEMORY_TYPE_REACTIONS = {
  achievement : 'uma conquista que não se esquece 🏆',
  milestone   : 'esse momento mudou alguma coisa 💫',
  movie       : 'assistir junto é diferente 🎬',
  music       : 'tem uma trilha sonora pra isso 🎵',
  special     : 'esse é especial. mesmo. ⭐',
};

/* ════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════ */

function _todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function _getDaysUsed() {
  try {
    const raw  = localStorage.getItem(LS_DAYS_USED);
    const days = raw ? JSON.parse(raw) : [];
    return Array.isArray(days) ? days.length : 1;
  } catch (_) { return 1; }
}

function _loadCache() {
  try {
    const raw = localStorage.getItem(LS_ES_CACHE);
    return raw ? JSON.parse(raw) : {};
  } catch (_) { return {}; }
}

function _saveCache(data) {
  try { localStorage.setItem(LS_ES_CACHE, JSON.stringify(data)); } catch (_) {}
}

/* Controle de toasts por dia — não repetir o mesmo texto no mesmo dia */
function _canShowToast(text) {
  try {
    const today = _todayStr();
    const raw   = localStorage.getItem(LS_ES_TOASTS);
    const data  = raw ? JSON.parse(raw) : {};
    if (data.date !== today) {
      localStorage.setItem(LS_ES_TOASTS, JSON.stringify({ date: today, shown: [] }));
      return true;
    }
    if (data.shown.includes(text)) return false;
    data.shown.push(text);
    localStorage.setItem(LS_ES_TOASTS, JSON.stringify(data));
    return true;
  } catch (_) { return false; }
}

function _toast(msg, delay = 0) {
  if (!msg) return;
  setTimeout(() => {
    try {
      if (!_canShowToast(msg)) return; // BUG-2: verifica na hora de exibir
      if (typeof window.showToast === 'function') {
        window.showToast(msg, 3200);
      }
    } catch (_) {}
  }, delay);
}

/* ════════════════════════════════════════════
   analyzeRelationshipState
   Lê o estado real e retorna a fase emocional.
   Resultado cacheado por 60s para não recalcular
   em eventos rápidos consecutivos.
   ════════════════════════════════════════════ */

/**
 * @returns {{
 *   phase: "inicio"|"conexao"|"rotina"|"nostalgia",
 *   intensity: number,   // 0–1
 *   recencyScore: number // 0–1, quão recente é a última memória
 * }}
 */
export function analyzeRelationshipState() {
  // Verifica throttle
  const cache = _loadCache();
  const now   = Date.now();
  if (cache.ts && (now - cache.ts) < ANALYSIS_THROTTLE_MS && cache.state) {
    return cache.state;
  }

  const state = _computeState();
  _saveCache({ ts: now, state });
  return state;
}

function _computeState() {
  const fallback = { phase: 'inicio', intensity: 0.3, recencyScore: 0 };

  try {
    const core     = window._loveCity?.getLoveCore?.();
    const daysUsed = _getDaysUsed();

    const memories    = Array.isArray(core?.memories) ? core.memories : [];
    const totalPoints = core?.totalPoints || 0;

    /* ── Recência ──────────────────────────── */
    const now        = Date.now();
    const lastTs     = memories.length > 0
      ? Math.max(...memories.map(m => m.ts || 0))
      : 0;
    const daysSinceLast = lastTs > 0
      ? Math.floor((now - lastTs) / 86_400_000)
      : 999;
    const recencyScore  = daysSinceLast < 1  ? 1
      : daysSinceLast < 7  ? 0.7
      : daysSinceLast < 30 ? 0.3
      : 0;

    /* ── Intensidade ───────────────────────── */
    // Normaliza: máximo esperado ~20 memórias, 500 pts, 30 dias
    const memScore   = Math.min(memories.length / 20, 1);
    const ptScore    = Math.min(totalPoints   / 500,  1);
    const dayScore   = Math.min(daysUsed      / 30,   1);
    const intensity  = Math.round(((memScore + ptScore + dayScore) / 3) * 100) / 100;

    /* ── Fase ──────────────────────────────── */
    let phase;

    if (daysUsed <= 2 && memories.length <= 3) {
      // Novos no app — tudo é descoberta
      phase = 'inicio';

    } else if (daysSinceLast > 14) {
      // Voltaram depois de um tempo
      phase = 'nostalgia';

    } else if (daysUsed >= 7 && memories.length >= 5) {
      // Uso consistente, acúmulo de memórias
      phase = 'rotina';

    } else {
      // Crescendo — engajamento ativo
      phase = 'conexao';
    }

    return { phase, intensity, recencyScore };

  } catch (_) {
    return fallback;
  }
}

/* ════════════════════════════════════════════
   adaptExperience
   Aplica adaptações sutis baseadas no estado.
   Cada adaptação é declarativa — não altera
   estrutura, apenas influencia comportamento.
   ════════════════════════════════════════════ */

/**
 * @param {{ phase: string, intensity: number, recencyScore: number }} state
 */
export function adaptExperience(state) {
  if (!state) return;
  try {
    _applyPhaseSignal(state);
    _adjustMemoryWeights(state);
    _maybeTriggerEventUnlock(state);
  } catch (_) {}
}

/* Aplica sinal visual sutil baseado na fase */
function _applyPhaseSignal({ phase, recencyScore }) {
  try {
    // Marca no body para CSS hooks opcionais (sem alterar estilos existentes)
    document.body.dataset.esPhase = phase;
    document.body.dataset.esRecency = recencyScore >= 0.7 ? 'fresh'
      : recencyScore >= 0.3 ? 'warm'
      : 'distant';
  } catch (_) {}
}

/* Ajusta pesos do memory-of-day via sinal global */
function _adjustMemoryWeights({ phase }) {
  try {
    // Expõe sinal para memory-of-day.js ler sem acoplamento direto
    // memory-of-day lê window._esPhase para boostar ou penalizar tipos
    window._esPhase = phase;

    if (phase === 'nostalgia') {
      // Fase nostalgia: prioriza memórias antigas (ts baixo)
      window._esMemoryBoost = (mem) => {
        const ageMs   = Date.now() - (mem.ts || 0);
        const daysOld = ageMs / 86_400_000;
        return daysOld > 60 ? 2.5 : daysOld > 30 ? 1.5 : 1;
      };
    } else if (phase === 'inicio') {
      // Fase início: prioriza milestones e achievements (o que é nós)
      window._esMemoryBoost = (mem) =>
        (mem.type === 'milestone' || mem.type === 'achievement') ? 2 : 1;
    } else if (phase === 'rotina') {
      // Fase rotina: distribui igualmente — sem boost
      window._esMemoryBoost = () => 1;
    } else {
      // Fase conexao: prioriza eventos recentes
      window._esMemoryBoost = (mem) => {
        const ageMs   = Date.now() - (mem.ts || 0);
        const daysOld = ageMs / 86_400_000;
        return daysOld < 30 ? 1.5 : 1;
      };
    }
  } catch (_) {}
}

/* Pode sugerir ao event-unlock que acelere desbloqueios na fase início */
function _maybeTriggerEventUnlock({ phase }) {
  try {
    if (phase === 'inicio' && typeof window.autoUnlockEvents === 'function') {
      window.autoUnlockEvents();
    }
  } catch (_) {}
}

/* ════════════════════════════════════════════
   MICRO-REAÇÕES
   Toasts sutis em momentos certos.
   Aparecem no máximo 1x por texto por dia.
   ════════════════════════════════════════════ */

/** Reage à abertura do app */
function _reactToAppOpen(state) {
  try { // BUG-4: apenas 1x por dia
    const today = _todayStr();
    if (localStorage.getItem(LS_ES_APP_OPEN) === today) return;
    localStorage.setItem(LS_ES_APP_OPEN, today);
  } catch (_) {}
  const reactions = PHASE_REACTIONS[state.phase];
  if (!reactions?.length) return;
  // Escolhe aleatório — nenhuma lógica visível para o usuário
  const text = reactions[Math.floor(Math.random() * reactions.length)];
  // Delay maior para não competir com outros toasts do init
  _toast(text, 4500);
}

/** Reage quando uma nova memória é adicionada */
function _reactToMemoryAdded({ memory }) {
  if (!memory) return;
  const reaction = MEMORY_TYPE_REACTIONS[memory.type];
  if (reaction) {
    _toast(reaction, 1800);
    return;
  }
  // Reação genérica baseada na fase atual
  const state     = analyzeRelationshipState();
  const reactions = PHASE_REACTIONS[state.phase];
  if (reactions?.length) {
    const text = reactions[Math.floor(Math.random() * reactions.length)];
    _toast(text, 1800);
  }
}

/** Reage quando um evento é concluído */
function _reactToEventCompleted({ eventId } = {}) {
  const msgs = [
    'esse momento vai ficar 💛',
    'uma história que vale guardar',
    'mais um pedaço real de vocês ✨',
  ];
  const text = msgs[Math.floor(Math.random() * msgs.length)];
  _toast(text, 2000);
}

/** Reage a level up — mais celebrativo mas ainda sutil */
function _reactToLevelUp({ relLevel } = {}) {
  if (!relLevel) return;
  const msgs = [
    `o amor de vocês não para de crescer 💕`,
    `nível ${relLevel} — e ainda é só o começo`,
    `cada momento conta. e vocês têm muitos. 💛`,
  ];
  const text = msgs[Math.floor(Math.random() * msgs.length)];
  _toast(text, 600);
}

/* ════════════════════════════════════════════
   LOOP PRINCIPAL
   Roda analyzeRelationshipState + adaptExperience
   de forma unificada.
   ════════════════════════════════════════════ */

function _runLoop() {
  try {
    const state = analyzeRelationshipState();
    adaptExperience(state);
  } catch (_) {}
}

/* ════════════════════════════════════════════
   initEmotionalState — ponto de entrada
   ════════════════════════════════════════════ */

/* Unsubs para evitar acumulação de listeners em hot reload / SW restart */
let _esUnsubs = [];

export function initEmotionalState() {
  // Cancela listeners anteriores se existirem (RISCO-2)
  _esUnsubs.forEach(fn => { try { fn(); } catch (_) {} });
  _esUnsubs = [];

  // 1. Análise inicial
  _runLoop();

  // 2. Reação à abertura (com delay para não spammar junto com outros inits)
  try {
    const state = analyzeRelationshipState();
    _reactToAppOpen(state);
  } catch (_) {}

  // 3. Event bus — escuta eventos do loveCore
  try {
    const bus = window._loveCity;
    if (typeof bus?.onLoveEvent !== 'function') return;

    // Nova memória — invalida cache + reage (RISCO-5)
    _esUnsubs.push(bus.onLoveEvent('memory:added', (data) => {
      try {
        _saveCache({}); // RISCO-5: invalida cache para recalcular fase
        _reactToMemoryAdded(data);
        _runLoop();
      } catch (_) {}
    }));

    // Interação qualquer
    _esUnsubs.push(bus.onLoveEvent('interaction:added', () => {
      try { _runLoop(); } catch (_) {}
    }));

    // Level up
    _esUnsubs.push(bus.onLoveEvent('progression:levelup', (data) => {
      try { _reactToLevelUp(data); _runLoop(); } catch (_) {}
    }));

    // Evento custom: event:completed — invalida cache (RISCO-5)
    _esUnsubs.push(bus.onLoveEvent('event:completed', (data) => {
      try {
        _saveCache({}); // RISCO-5: fase pode mudar após evento importante
        _reactToEventCompleted(data);
        _runLoop();
      } catch (_) {}
    }));

  } catch (_) {}
}

/* ════════════════════════════════════════════
   API PÚBLICA — exposta em window para
   módulos que não importam diretamente
   ════════════════════════════════════════════ */

window._emotionalState = {
  analyzeRelationshipState,
  adaptExperience,
};
