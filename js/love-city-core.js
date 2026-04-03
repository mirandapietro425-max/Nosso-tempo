/* ═══════════════════════════════════════════════════════════════
   PIETRO & EMILLY — love-city-core.js  v1
   Love City: Sistema Central de Jogo

   Sistemas implementados:
     [CORE]   getLoveCore / updateLoveCore — estado imutável
     [CITY]   enterDistrict — distritos interativos
     [INTER]  addInteraction — interações geram pontos
     [PROG]   applyProgression — pontos evoluem cidade
     [MEM]    addMemory — memórias do casal
     [ACH]    checkAchievements — conquistas silenciosas
     [EVT]    emitLoveEvent / onLoveEvent — event bus
     [FX]     feedback visual leve (toast + pop flutuante)

   Filosofia: cada linha responde
     "isso melhora a experiência emocional do casal?"
   ═══════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════
   [EVT] EVENT BUS
   Sistema de eventos desacoplado.
   Nenhum módulo chama outro diretamente.
   ════════════════════════════════════════════ */

const _handlers = {};

/** Emite um evento Love City para todos os handlers registrados */
export function emitLoveEvent(type, data = {}) {
  if (!type) return;
  const list = _handlers[type];
  if (!list) return;
  for (const fn of list) {
    try { fn(data); } catch (e) {
      console.warn(`[LoveCity] handler error (${type}):`, e?.message || e);
    }
  }
}

/** Registra um handler para um evento. Retorna função de cancelamento. */
export function onLoveEvent(type, handler) {
  if (!type || typeof handler !== 'function') return () => {};
  if (!_handlers[type]) _handlers[type] = [];
  _handlers[type].push(handler);
  return () => {
    _handlers[type] = (_handlers[type] || []).filter(h => h !== handler);
  };
}

/* ════════════════════════════════════════════
   [CORE] GAME CORE STATE
   Estado central do Love City.
   Persiste em localStorage para sobreviver reloads.
   ════════════════════════════════════════════ */

const LS_KEY = 'love_city_core_v1';

const DEFAULT_CORE = {
  // Progressão
  totalPoints       : 0,
  relationshipLevel : 1,
  cityLevel         : 1,

  // Histórico
  interactions      : [],   // últimas 50 interações
  memories          : [],   // memórias emocionais
  achievements      : {},   // id → true

  // Sessão
  lastActive        : null,
};

let _core = null;

/** Carrega o estado do localStorage (ou padrão se não existir) */
function _loadCore() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge com default para suportar novas chaves em versões futuras
      _core = { ...DEFAULT_CORE, ...parsed };
      return;
    }
  } catch (_) { /* localStorage indisponível ou JSON corrompido */ }
  _core = JSON.parse(JSON.stringify(DEFAULT_CORE));
}

/** Persiste o estado atual no localStorage (com debounce) */
let _saveDebounce = null;
function _scheduleCoreSave() {
  clearTimeout(_saveDebounce);
  _saveDebounce = setTimeout(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(_core)); }
    catch (_) { /* storage cheio — silencia */ }
  }, 300);
}

/**
 * Retorna uma cópia imutável do estado do Love City.
 * Nunca expõe a referência interna.
 */
export function getLoveCore() {
  if (!_core) _loadCore();
  return Object.freeze({ ..._core });
}

/**
 * Atualiza o estado via função pura.
 * @param {function} updaterFn — recebe o estado atual e retorna as alterações
 * @example updateLoveCore(s => ({ totalPoints: s.totalPoints + 10 }))
 */
export function updateLoveCore(updaterFn) {
  if (!_core) _loadCore();
  if (typeof updaterFn !== 'function') return;
  try {
    const patch = updaterFn({ ..._core });
    if (!patch || typeof patch !== 'object') return;
    _core = { ..._core, ...patch, lastActive: Date.now() };
    _scheduleCoreSave();
  } catch (e) {
    console.warn('[LoveCity] updateLoveCore error:', e?.message || e);
  }
}

/* ════════════════════════════════════════════
   [CITY] DISTRICT SYSTEM
   Cada distrito é um portal para uma feature.
   Entrar num distrito gera uma interação leve.
   ════════════════════════════════════════════ */

const DISTRICTS = {
  home  : { icon: '🏡', label: 'Nossa Casinha', sectionId: 'sec-casinha', points: 5  },
  cinema: { icon: '🎬', label: 'Cinema',         sectionId: 'sec-cinema',  points: 10 },
  games : { icon: '🎮', label: 'Arcade',         sectionId: 'sec-jogos',   points: 8  },
  music : { icon: '🎵', label: 'Músicas',        sectionId: 'sec-musica',  points: 5  },
  galeria:{ icon: '📸', label: 'Galeria',        sectionId: 'sec-galeria', points: 7  },
};

/**
 * Entra num distrito: scroll suave + gera interação + emite evento.
 * @param {string} districtId — 'home' | 'cinema' | 'games' | 'music' | 'galeria'
 */
export function enterDistrict(districtId) {
  if (!districtId) return;
  const d = DISTRICTS[districtId];
  if (!d) {
    console.warn(`[LoveCity] Distrito desconhecido: ${districtId}`);
    return;
  }

  // Scroll suave para a seção
  const section = document.getElementById(d.sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Registra visita como interação leve (sem duplicar pontos por sessão)
  addInteraction('district_visit', {
    district : districtId,
    label    : d.label,
    points   : d.points,
    _silent  : true, // sem toast — visita é gesto pequeno
  });

  emitLoveEvent('city:district_entered', { districtId, label: d.label });
}

/* ════════════════════════════════════════════
   [INTER] INTERACTION SYSTEM
   Toda ação do casal passa por aqui.
   Gera pontos, emite evento, pode virar memória.
   ════════════════════════════════════════════ */

const INTERACTION_POINTS = {
  message       : 10,
  movie         : 25,
  music         : 15,
  quiz          : 20,
  memory        : 30,
  district_visit: 5,
  game          : 20,
  mood          : 15,
  mural         : 15,
  location      : 20,
};

/**
 * Registra uma interação do casal.
 * @param {string} type — tipo da interação (message, movie, quiz, …)
 * @param {object} payload — dados extras; use points para sobrescrever padrão
 */
export function addInteraction(type, payload = {}) {
  if (!type) return;

  const points  = payload.points ?? INTERACTION_POINTS[type] ?? 5;
  const silent  = payload._silent === true;
  const ts      = Date.now();

  const interaction = {
    type,
    points,
    ts,
    summary: payload.summary || payload.label || type,
  };

  // Mantém janela deslizante de 50 interações
  updateLoveCore(s => {
    const interactions = [interaction, ...s.interactions].slice(0, 50);
    return { interactions };
  });

  // Progressão
  if (points > 0) {
    applyProgression(points, type, silent);
  }

  // Interações significativas viram memórias automáticas
  if (['movie', 'memory', 'quiz'].includes(type) && payload.summary) {
    addMemory({ type, summary: payload.summary });
  }

  emitLoveEvent('interaction:added', { type, points, payload });
}

/* ════════════════════════════════════════════
   [PROG] PROGRESSION SYSTEM
   Pontos → levels → cidade evolui.
   Fórmula simples para que qualquer ação importe.
   ════════════════════════════════════════════ */

const POINTS_PER_LEVEL      = 100;  // a cada 100 pts sobe de level
const CITY_LEVEL_BREAKPOINTS = [0, 200, 500, 1000, 1800, 3000, 5000]; // totalPoints para cada cityLevel

/**
 * Aplica progressão ao core.
 * @param {number} points  — pontos a adicionar
 * @param {string} reason  — motivo (para log)
 * @param {boolean} silent — se true, sem feedback visual
 */
export function applyProgression(points, reason = '', silent = false) {
  if (!points || points <= 0) return;

  let didLevelUp = false;
  let newRelLevel = 1;
  let newCityLevel = 1;

  updateLoveCore(s => {
    const prevRelLevel  = s.relationshipLevel;
    const prevCityLevel = s.cityLevel;

    const totalPoints      = s.totalPoints + points;
    const relationshipLevel = Math.max(1, Math.floor(totalPoints / POINTS_PER_LEVEL) + 1);

    // cityLevel baseado em breakpoints
    let cl = 1;
    for (let i = CITY_LEVEL_BREAKPOINTS.length - 1; i >= 0; i--) {
      if (totalPoints >= CITY_LEVEL_BREAKPOINTS[i]) { cl = i + 1; break; }
    }
    const cityLevel = cl;

    if (relationshipLevel > prevRelLevel || cityLevel > prevCityLevel) {
      didLevelUp = true;
      newRelLevel  = relationshipLevel;
      newCityLevel = cityLevel;
    }

    return { totalPoints, relationshipLevel, cityLevel };
  });

  if (!silent) {
    _showPointsPop(`+${points} 💕`);
  }

  if (didLevelUp) {
    _onLevelUp(newRelLevel, newCityLevel);
  }

  emitLoveEvent('progression:updated', { points, reason, didLevelUp });
}

/** Chamado quando ocorre um level up */
function _onLevelUp(relLevel, cityLevel) {
  emitLoveEvent('progression:levelup', { relLevel, cityLevel });

  // Feedback visual
  _showToast(`✨ Level ${relLevel}! A cidade cresceu! 🏙️`);

  // Conquistas relacionadas a level
  checkAchievements();
}

/* ════════════════════════════════════════════
   [MEM] MEMORY SYSTEM
   Momentos especiais viram memórias permanentes.
   Guardadas em ordem cronológica no core.
   ════════════════════════════════════════════ */

/**
 * Adiciona uma memória ao Love City.
 * @param {object} opts
 * @param {string} opts.type    — category (movie, quiz, special, …)
 * @param {string} opts.summary — texto curto descritivo (max 120 chars)
 */
export function addMemory({ type, summary } = {}) {
  if (!summary || !type) return;

  const safeSummary = String(summary).slice(0, 120);

  const memory = {
    id      : `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    summary : safeSummary,
    ts      : Date.now(),
  };

  updateLoveCore(s => {
    const memories = [...s.memories, memory].slice(-200); // RISCO-1: cap 200
    return { memories };
  });

  emitLoveEvent('memory:added', { memory });

  // Feedback suave
  _showToast('💭 Nova memória criada');
  checkAchievements();
}

/* ════════════════════════════════════════════
   [ACH] ACHIEVEMENT SYSTEM
   Conquistas silenciosas — desbloqueiam sem interromper.
   Verificação leve: O(1) por conquista.
   ════════════════════════════════════════════ */

const ACHIEVEMENTS = [
  {
    id      : 'first_steps',
    check   : s => s.totalPoints >= 10,
    label   : '💕 Primeiros passos juntos',
  },
  {
    id      : 'century',
    check   : s => s.totalPoints >= 100,
    label   : '💯 100 pontos de amor',
  },
  {
    id      : 'five_hundred',
    check   : s => s.totalPoints >= 500,
    label   : '🌟 500 pontos — amor inabalável',
  },
  {
    id      : 'first_memory',
    check   : s => s.memories.length >= 1,
    label   : '📖 Primeira memória guardada',
  },
  {
    id      : 'memory_keeper',
    check   : s => s.memories.length >= 10,
    label   : '📚 10 memórias — guardiões da história',
  },
  {
    id      : 'seven_interactions',
    check   : s => s.interactions.length >= 7,
    label   : '🎯 7 interações — rotina do amor',
  },
  {
    id      : 'city_grows',
    check   : s => s.cityLevel >= 2,
    label   : '🏙️ A cidade está crescendo!',
  },
  {
    id      : 'relationship_level_5',
    check   : s => s.relationshipLevel >= 5,
    label   : '❤️ Nível 5 — laço cada vez mais forte',
  },
  {
    id      : 'xadrez_era_desculpa',
    check   : s => s.interactions.some(i => i.type === 'game' || i.summary?.includes('xadrez')),
    label   : '♟️ O xadrez foi só uma desculpa — e deu muito certo',
  },
];

/**
 * Verifica e desbloqueia conquistas silenciosamente.
 * Chamado após cada interação e memory.
 */
export function checkAchievements() {
  if (!_core) _loadCore();

  const remaining = ACHIEVEMENTS.filter(a => !_core.achievements[a.id]);
  if (remaining.length === 0) return; // MELHORIA-4: tudo conquistado

  for (const ach of remaining) {
    try {
      if (ach.check(_core)) {
        updateLoveCore(s => ({
          achievements: { ...s.achievements, [ach.id]: true },
        }));
        emitLoveEvent('achievement:unlocked', { id: ach.id, label: ach.label });
        // Notificação suave — aparece e desaparece
        setTimeout(() => _showToast(`🏆 ${ach.label}`), 400);
      }
    } catch (_) { /* check nunca deve quebrar o jogo */ }
  }
}

/* ════════════════════════════════════════════
   [FX] FEEDBACK VISUAL
   Toasts e pops leves — aparecem e somem.
   Reutiliza o showToast global se disponível.
   ════════════════════════════════════════════ */

function _showToast(msg) {
  if (!msg) return;
  try {
    if (typeof window.showToast === 'function') {
      window.showToast(msg);
      return;
    }
  } catch (_) {}
  // Fallback minimalista próprio
  const el = document.createElement('div');
  el.style.cssText = [
    'position:fixed', 'bottom:80px', 'left:50%', 'transform:translateX(-50%)',
    'background:rgba(89,13,34,.92)', 'color:#fff', 'padding:.55rem 1.2rem',
    'border-radius:50px', 'font-size:.82rem', 'font-family:var(--font-body,sans-serif)',
    'pointer-events:none', 'z-index:99999', 'transition:opacity .4s',
    'box-shadow:0 4px 16px rgba(0,0,0,.3)',
  ].join(';');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 420); }, 2400);
}

function _showPointsPop(text) {
  if (!text) return;
  const el = document.createElement('div');
  el.style.cssText = [
    'position:fixed', 'bottom:140px', 'right:20px', 'z-index:99998',
    'background:linear-gradient(135deg,#590d22,#e8536f)', 'color:#fff',
    'padding:.4rem .9rem', 'border-radius:50px', 'font-size:.8rem',
    'font-weight:700', 'pointer-events:none',
    'animation:lc-pop-up .9s ease-out forwards',
  ].join(';');
  el.textContent = text;
  _injectPopStyles();
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

let _popStylesInjected = false;
function _injectPopStyles() {
  if (_popStylesInjected) return;
  _popStylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes lc-pop-up {
      0%   { opacity:1; transform:translateY(0)   scale(1); }
      60%  { opacity:1; transform:translateY(-28px) scale(1.1); }
      100% { opacity:0; transform:translateY(-50px) scale(.9); }
    }
  `;
  document.head.appendChild(style);
}

/* ════════════════════════════════════════════
   INIT — conecta o Love City ao resto do app
   ════════════════════════════════════════════ */

/**
 * Inicializa o Love City Core.
 * Deve ser chamado uma vez no app.js após o DOM estar pronto.
 */
export function initLoveCity() {
  _loadCore();

  // Escuta conquistas para logar (sem efeito colateral)
  onLoveEvent('achievement:unlocked', ({ label }) => {
    console.info(`[LoveCity] 🏆 Conquista desbloqueada: ${label}`);
  });

  // Conecta awardCoins do home.js ao sistema de progressão Love City
  // Sem modificar home.js — usa o evento global window.awardCoins existente
  _patchAwardCoins();

  // Checa conquistas iniciais (ex: usuário já tem pontos de sessão anterior)
  checkAchievements();

  console.info(`[LoveCity] ✅ Core iniciado — Nível ${_core.relationshipLevel} · ${_core.totalPoints} pts`);
}

/**
 * Intercepta window.awardCoins para espelhar as recompensas no Love City Core.
 * Não substitui a função original — apenas adiciona um observador em cima.
 */
function _patchAwardCoins() {
  const original = window.awardCoins;
  if (typeof original !== 'function') return;
  if (original.__lcPatched) return; // BUG-1: evitar dupla aplicação

  window.awardCoins = function(reason, amount, playerName) {
    // Chama a função original intacta
    original.call(this, reason, amount, playerName);

    // Espelha no Love City Core (sem duplicar se já foi chamado)
    try {
      addInteraction(reason, {
        points  : amount,
        summary : reason,
        _silent : true, // home.js já tem seu próprio feedback visual
      });
    } catch (_) {}
  };
  window.awardCoins.__lcPatched = true; // BUG-1: marca para não reaplicar
}

/* ════════════════════════════════════════════
   API PÚBLICA — exposta via window para acesso
   de outros módulos sem necessidade de import
   ════════════════════════════════════════════ */

window._loveCity = {
  getLoveCore,
  updateLoveCore,
  enterDistrict,
  addInteraction,
  applyProgression,
  addMemory,
  checkAchievements,
  emitLoveEvent,
  onLoveEvent,
  todayStr: () => new Date().toISOString().slice(0, 10), // MELHORIA-1: shared util
};
