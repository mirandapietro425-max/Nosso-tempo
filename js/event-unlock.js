/* ═══════════════════════════════════════════════
   PIETRO & EMILLY — event-unlock.js  v1
   Sistema de Desbloqueio Automático de Eventos

   Roda silenciosamente em background.
   Observa o comportamento real do casal e
   desbloqueia eventos no momento certo.

   O jogador não vê o sistema — só sente que
   "o jogo está acompanhando a nossa história".

   Dependências (todas opcionais / com fallback):
     window._loveCity    — love-city-core.js
     window.showToast    — ui.js (via app.js)
     localStorage
   ═══════════════════════════════════════════════ */

/* ════════════════════════════════════════════════
   DEFINIÇÃO DOS EVENTOS DESBLOQUEÁVEIS
   Cada evento tem:
     key        — chave no localStorage
     label      — texto do toast (emocional, não técnico)
     icon       — emoji do toast
     check(ctx) — função pura: retorna true quando deve desbloquear
   ════════════════════════════════════════════════ */
const UNLOCK_EVENTS = [

  /* 🍦 Shopping + Sorvete do Mac
     Desbloqueia quando o casal já tem pelo menos 3 memórias
     OU já usou o app por 2 dias ou mais.               */
  {
    key   : 'loveCity.macShopping.unlocked',
    label : 'Um passeio especial está disponível',
    icon  : '🍦',
    check : ctx => ctx.memoriesCount >= 3 || ctx.daysUsed >= 2,
  },

  /* 🥋 Campeonato de Taekwondo
     Sempre disponível — é o evento de entrada.
     Desbloqueia imediatamente no primeiro uso.         */
  {
    key   : 'loveCity.taekwondo.unlocked',
    label : 'Um momento de orgulho está disponível',
    icon  : '🥋',
    check : ctx => ctx.daysUsed >= 1 || ctx.memoriesCount >= 1,
  },

  /* 🎬 Cinema (future-ready)
     Desbloqueia após o casal interagir com filmes.     */
  {
    key   : 'loveCity.cinema_event.unlocked',
    label : 'Uma noite de cinema está disponível',
    icon  : '🎬',
    check : ctx => ctx.hasMovieInteraction || ctx.memoriesCount >= 5,
  },

  /* 🎹 Piano — Hometown da Adele
     Desbloqueia após alguns dias de uso.               */
  {
    key   : 'loveCity.piano_event.unlocked',
    label : 'Uma melodia especial está disponível',
    icon  : '🎹',
    check : ctx => ctx.daysUsed >= 3 || ctx.memoriesCount >= 4,
  },

  /* 🏫 Escola Maria Rocha
     Desbloqueia após o casal ter pelo menos 6 memórias.*/
  {
    key   : 'loveCity.escola_event.unlocked',
    label : 'Uma lembrança da escola está disponível',
    icon  : '🏫',
    check : ctx => ctx.memoriesCount >= 6 || ctx.totalPoints >= 200,
  },

];

/* ════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════ */

const LS_FIRST_USE  = 'loveCity.unlock.firstUse';
const LS_NOTIFIED   = 'loveCity.unlock.notified';   // set de chaves já notificadas
const LS_DAYS_USED  = 'loveCity.unlock.daysUsed';   // array de datas YYYY-MM-DD

function _todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/* Carrega / atualiza contagem de dias de uso */
function _getDaysUsed() {
  try {
    const today = _todayStr();
    const raw   = localStorage.getItem(LS_DAYS_USED);
    const days  = raw ? JSON.parse(raw) : [];
    if (!days.includes(today)) {
      days.push(today);
      // mantém os últimos 365 dias
      const trimmed = days.slice(-365);
      localStorage.setItem(LS_DAYS_USED, JSON.stringify(trimmed));
      return trimmed.length;
    }
    return days.length;
  } catch (_) { return 1; }
}

/* Lê conjunto de chaves já notificadas */
function _getNotified() {
  try {
    const raw = localStorage.getItem(LS_NOTIFIED);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (_) { return new Set(); }
}

function _markNotified(key) {
  try {
    const set = _getNotified();
    set.add(key);
    localStorage.setItem(LS_NOTIFIED, JSON.stringify([...set]));
  } catch (_) {}
}

/* Verifica se evento já está desbloqueado */
function _isUnlocked(key) {
  try { return !!localStorage.getItem(key); } catch (_) { return false; }
}

function _unlock(key) {
  try { localStorage.setItem(key, '1'); } catch (_) {}
}

/* ════════════════════════════════════════════════
   notifyUnlock — feedback emocional leve
   Usa showToast existente com delay para não
   aparecer junto com outras notificações.
   ════════════════════════════════════════════════ */
export function notifyUnlock(message, delay = 600) {
  setTimeout(() => {
    try {
      if (typeof window.showToast === 'function') {
        window.showToast(message, 3500);
      }
    } catch (_) {}
  }, delay);
}

/* ════════════════════════════════════════════════
   _buildContext — monta snapshot do estado atual
   Tudo com fallback seguro.
   ════════════════════════════════════════════════ */
function _buildContext() {
  const ctx = {
    memoriesCount      : 0,
    totalPoints        : 0,
    relationshipLevel  : 1,
    daysUsed           : _getDaysUsed(),
    hasMovieInteraction: false,
    hasGameInteraction : false,
  };

  try {
    const core = window._loveCity?.getLoveCore?.();
    if (core) {
      ctx.memoriesCount     = Array.isArray(core.memories) ? core.memories.length : 0;
      ctx.totalPoints       = core.totalPoints || 0;
      ctx.relationshipLevel = core.relationshipLevel || 1;

      // Verifica se alguma interação foi com filmes
      if (Array.isArray(core.interactions)) {
        ctx.hasMovieInteraction = core.interactions.some(
          i => i.type === 'movie' || (i.summary || '').toLowerCase().includes('film')
            || (i.summary || '').toLowerCase().includes('cinema')
        );
        ctx.hasGameInteraction = core.interactions.some(
          i => i.type === 'game' || (i.summary || '').toLowerCase().includes('xadrez')
        );
      }
    }
  } catch (_) {}

  // Inclui seeds como memórias "virtuais" — se o app nunca foi aberto antes,
  // considera as 8 seeds do memory-of-day como presentes
  // (elas aparecem pro usuário mas não estão no loveCore ainda)
  // Isso garante que o Mac unlock não espera 3 interações reais.
  if (ctx.daysUsed >= 1 && ctx.memoriesCount === 0) {
    ctx.memoriesCount = 8; // seeds sempre presentes
  }

  return ctx;
}

/* ════════════════════════════════════════════════
   autoUnlockEvents — função principal
   Roda silenciosamente. Verifica cada evento,
   desbloqueia se a condição for satisfeita,
   notifica apenas uma vez por evento.
   ════════════════════════════════════════════════ */
export function autoUnlockEvents() {
  try {
    const ctx      = _buildContext();
    const notified = _getNotified();
    let   delay    = 400; // escalonamento para não spammar toasts

    for (const event of UNLOCK_EVENTS) {
      // Já desbloqueado — nada a fazer
      if (_isUnlocked(event.key)) continue;

      // Verifica condição
      if (!event.check(ctx)) continue;

      // Desbloqueia
      _unlock(event.key);

      // Notifica apenas se ainda não notificou para este evento
      if (!notified.has(event.key)) {
        _markNotified(event.key);
        notifyUnlock(`${event.icon} ${event.label}`, delay);
        delay += 1200; // próximo toast aparece 1.2s depois
      }
    }
  } catch (_) {
    // Falha silenciosa — nunca quebra a UI
  }
}

/* ════════════════════════════════════════════════
   initEventUnlock — ponto de entrada
   1. Roda autoUnlockEvents imediatamente
   2. Escuta memory:added via event bus
   3. Escuta interaction:added via event bus
   ════════════════════════════════════════════════ */
export function initEventUnlock() {
  // Registra primeiro uso
  try {
    if (!localStorage.getItem(LS_FIRST_USE)) {
      localStorage.setItem(LS_FIRST_USE, _todayStr());
    }
  } catch (_) {}

  // Roda imediatamente no init
  autoUnlockEvents();

  // Escuta eventos do loveCore via event bus
  try {
    const bus = window._loveCity;
    if (typeof bus?.onLoveEvent === 'function') {
      bus.onLoveEvent('memory:added',       () => autoUnlockEvents());
      bus.onLoveEvent('interaction:added',  () => autoUnlockEvents());
      bus.onLoveEvent('progression:levelup',() => autoUnlockEvents());
    }
  } catch (_) {}
}
