/* ═══════════════════════════════════════════════════════════════
   PIETRO & EMILLY — memory-anniversaries.js  v1
   Aniversários de Memórias

   Detecta quando uma memória completa marcos de tempo
   e traz ela de volta de forma nostálgica e inesperada.

   O usuário não vê o sistema —
   só sente: "caramba… já faz tudo isso?"

   Fecha o loop emocional:
     memória do dia  = presente
     momentos vivos  = espontâneo
     aniversários    = passado ←

   Dependências (todas opcionais / com fallback):
     window._loveCity         — love-city-core.js
     window._emotionalState   — emotional-state.js
   ═══════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════
   MARCOS DE TEMPO
   Dias desde a memória que geram uma reação.
   Cada marco tem:
     days    — dias exatos (com tolerância ±1)
     label   — como falar o tempo (voz íntima)
     weight  — relevância emocional
   ════════════════════════════════════════════ */

const MILESTONES = [
  { days:   1, label: 'ontem',          weight: 1 },
  { days:   7, label: 'uma semana',     weight: 2 },
  { days:  30, label: 'um mês',         weight: 3 },
  { days:  90, label: 'três meses',     weight: 3 },
  { days: 180, label: 'seis meses',     weight: 4 },
  { days: 365, label: 'um ano',         weight: 5 },
];

/* Tolerância: detecta o marco dentro de ±1 dia */
const TOLERANCE_DAYS = 1;

/* ════════════════════════════════════════════
   FRASES NOSTÁLGICAS
   Por tipo de memória — voz do Pietro,
   íntima e específica ao casal.
   ════════════════════════════════════════════ */

const PHRASES = {
  /* Por tipo de memória */
  achievement : (label, summary) =>
    `faz ${label} desde aquela conquista… "${_short(summary)}" 🏆`,
  milestone   : (label, summary) =>
    `faz ${label} desde esse momento. ainda fica. 💫`,
  event       : (label, summary) =>
    `faz ${label} desde aquele dia… "${_short(summary)}" 💛`,
  movie       : (label, summary) =>
    `faz ${label} desde aquela sessão juntos 🎬`,
  music       : (label, summary) =>
    `faz ${label} desde aquela música. ainda toca por aqui. 🎵`,
  special     : (label, summary) =>
    `faz ${label} desde esse momento especial ⭐`,
  moment      : (label, summary) =>
    `faz ${label} desde aquele pensamento… "${_short(summary)}" 💭`,

  /* Fallback genérico */
  _default    : (label, summary) =>
    `faz ${label} desde aquele momento. parece ontem. 💛`,
};

/* Frases específicas para seeds conhecidas — mais pessoais */
const SEED_PHRASES = {
  seed_xadrez    : (label) => `faz ${label} desde aquele xadrez que foi só desculpa. ♟️`,
  seed_pedido    : (label) => `faz ${label} desde aquela noite do Bridgerton. desde aquela pergunta. 💫`,
  seed_mac       : (label) => `faz ${label} desde o sorvete do Mac. ela rindo à toa. 🍦`,
  seed_taekwondo : (label) => `faz ${label} desde o campeonato da prof. Rejane. 🥋`,
  seed_piano     : (label) => `faz ${label} desde aquela melodia do piano. ainda fica na cabeça. 🎹`,
  seed_academia  : (label) => `faz ${label} desde aquele treino lado a lado. 🏋️`,
  seed_escola    : (label) => `faz ${label} desde a Maria Rocha. o começo de tudo. 🏫`,
  seed_bridgerton: (label) => `faz ${label} desde as noites de Bridgerton. desde quando a amizade virou amor. 🌙`,
};

/* ════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════ */

function _short(text) {
  if (!text) return '';
  const trimmed = String(text).trim();
  return trimmed.length > 42 ? trimmed.slice(0, 40) + '…' : trimmed;
}

function _daysAgo(ts) {
  if (!ts) return 0;
  return Math.floor((Date.now() - ts) / 86_400_000);
}

function _matchMilestone(days) {
  for (const m of MILESTONES) {
    if (Math.abs(days - m.days) <= TOLERANCE_DAYS) return m;
  }
  return null;
}

function _buildPhrase(memory, milestoneLabel) {
  // Seed conhecida → frase específica
  const seedFn = SEED_PHRASES[memory.id];
  if (seedFn) return seedFn(milestoneLabel);

  // Por tipo
  const fn = PHRASES[memory.type] || PHRASES._default;
  return fn(milestoneLabel, memory.summary);
}

function _iconForType(type, id) {
  // Seeds têm ícones fixos via SEED_PHRASES (embutido no texto)
  // Para outros, ícone por tipo
  return {
    achievement : '🏆',
    milestone   : '💫',
    event       : '💛',
    movie       : '🎬',
    music       : '🎵',
    special     : '⭐',
    moment      : '💭',
  }[type] || '🕰️';
}

/* ════════════════════════════════════════════
   PERSISTÊNCIA
   ════════════════════════════════════════════ */

const LS_KEY = 'loveCity.anniversaries.v1';

function _loadShown() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) { return {}; }
}

function _markShown(memoryId, days) {
  try {
    const data = _loadShown();
    if (!data[memoryId]) data[memoryId] = [];
    // guarda o marco real (não os dias exatos, para tolerar ±1)
    const milestone = _matchMilestone(days);
    if (milestone && !data[memoryId].includes(milestone.days)) {
      data[memoryId].push(milestone.days);
    }
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch (_) {}
}

function _alreadyShown(memoryId, days) {
  try {
    const data     = _loadShown();
    const shown    = data[memoryId] || [];
    const milestone = _matchMilestone(days);
    return milestone ? shown.includes(milestone.days) : true;
  } catch (_) { return true; }
}

/* ════════════════════════════════════════════
   OBTER MEMÓRIAS — loveCore + seeds
   Seeds importadas de memory-of-day.js (RISCO-4)
   ════════════════════════════════════════════ */

import { SEEDED_MEMORIES as _SEEDS } from './memory-of-day.js'; // RISCO-4: fonte única

function _getAllMemories() {
  let core = [];
  try {
    const c = window._loveCity?.getLoveCore?.();
    if (Array.isArray(c?.memories) && c.memories.length > 0) core = c.memories;
  } catch (_) {}
  const coreIds = new Set(core.map(m => m.id));
  return [...core, ..._SEEDS.filter(s => !coreIds.has(s.id))];
}

/* ════════════════════════════════════════════
   UI — mini-card próprio (#ma-card)
   Posicionado acima do #lm-card (bottom: 152px)
   para coexistir sem colisão.
   ════════════════════════════════════════════ */

function _injectStyles() {
  if (document.getElementById('ma-styles')) return;
  const style = document.createElement('style');
  style.id = 'ma-styles';
  style.textContent = `
    #ma-card {
      position: fixed;
      bottom: 152px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      z-index: 9997;
      background: rgba(60, 8, 22, 0.97);
      color: #f5d0d8;
      padding: 13px 18px;
      border-radius: 18px;
      max-width: min(88vw, 340px);
      width: max-content;
      box-shadow: 0 8px 32px rgba(0,0,0,.4), 0 0 0 1px rgba(232,83,111,.15);
      display: flex;
      align-items: flex-start;
      gap: 10px;
      opacity: 0;
      transition: opacity .42s ease, transform .42s ease;
      pointer-events: auto;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    #ma-card.ma-visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    #ma-card.ma-hiding {
      opacity: 0;
      transform: translateX(-50%) translateY(14px);
    }
    #ma-card-icon {
      font-size: 1.2rem;
      line-height: 1.35;
      flex-shrink: 0;
      margin-top: 2px;
    }
    #ma-card-body { flex: 1; }
    #ma-card-label {
      font-size: .67rem;
      letter-spacing: .07em;
      text-transform: uppercase;
      opacity: .5;
      margin-bottom: 3px;
      font-family: var(--font-body, sans-serif);
    }
    #ma-card-text {
      font-size: .86rem;
      line-height: 1.48;
      font-style: italic;
      font-family: var(--font-body, sans-serif);
      opacity: .9;
    }
    #ma-card-close {
      background: none;
      border: none;
      color: rgba(245,208,216,.35);
      font-size: .82rem;
      cursor: pointer;
      padding: 0 0 0 6px;
      line-height: 1;
      flex-shrink: 0;
      align-self: flex-start;
      margin-top: 2px;
    }
    @media (prefers-reduced-motion: reduce) {
      #ma-card { transition: opacity .15s ease; }
    }
  `;
  document.head.appendChild(style);
}

function _showAnniversaryCard(text, icon, duration = 7000) {
  _injectStyles();
  document.getElementById('ma-card')?.remove();

  const card = document.createElement('div');
  card.id = 'ma-card';
  card.setAttribute('role', 'status');
  card.setAttribute('aria-live', 'polite');
  card.setAttribute('aria-label', text);

  card.innerHTML = `
    <div id="ma-card-icon" aria-hidden="true">${icon}</div>
    <div id="ma-card-body">
      <div id="ma-card-label">memória</div>
      <div id="ma-card-text">${text}</div>
    </div>
    <button id="ma-card-close" aria-label="Fechar">✕</button>
  `;

  document.body.appendChild(card);
  card.getBoundingClientRect(); // reflow para transição
  card.classList.add('ma-visible');

  let gone = false;
  const dismiss = () => {
    if (gone) return;
    gone = true;
    card.classList.add('ma-hiding');
    setTimeout(() => card.remove(), 440);
  };

  const t = setTimeout(dismiss, duration);
  card.addEventListener('click', () => { clearTimeout(t); dismiss(); });
  card.querySelector('#ma-card-close')
    ?.addEventListener('click', e => { e.stopPropagation(); clearTimeout(t); dismiss(); });
}

/* ════════════════════════════════════════════
   checkMemoryAnniversaries — função principal
   ════════════════════════════════════════════ */

/* Flag de sessão — máximo 1 aniversário por abertura */
let _shownThisSession = false;
let _maVisHandler     = null; // MELHORIA-5: referência para limpar listener
let _maUnsub          = null; // RISCO-2: unsub para memory:added

/**
 * Varre as memórias em busca de marcos de tempo.
 * Para no primeiro match. Máximo 1 por sessão.
 * Retorna true se encontrou e exibiu um aniversário.
 */
export function checkMemoryAnniversaries() {
  if (_shownThisSession) return false;

  try {
    const memories = _getAllMemories();
    if (!memories.length) return false;

    /* Fator emocional: fase nostalgia → peso +1 em todos os marcos */
    let phaseBoost = 0;
    try {
      const es = window._emotionalState?.analyzeRelationshipState?.();
      if (es?.phase === 'nostalgia') phaseBoost = 1;
      if (es?.phase === 'conexao')  phaseBoost = 0;  // foco em memórias recentes → marcos pequenos
    } catch (_) {}

    /* Candidatos: memórias com marco pendente */
    const candidates = [];

    for (const mem of memories) {
      if (!mem.ts) continue;
      const days      = _daysAgo(mem.ts);
      const milestone = _matchMilestone(days);
      if (!milestone)                    continue;
      if (_alreadyShown(mem.id, days))   continue;

      candidates.push({
        memory    : mem,
        milestone,
        days,
        /* score: peso do marco + boost de fase + peso do tipo */
        score : milestone.weight
               + phaseBoost
               + (mem.type === 'milestone' ? 2 : 0)
               + (mem.type === 'achievement' ? 1 : 0),
      });
    }

    if (!candidates.length) return false;

    /* Escolhe o candidato de maior score (desempate: mais antigo) */
    candidates.sort((a, b) =>
      b.score - a.score || a.memory.ts - b.memory.ts
    );
    const winner = candidates[0];

    /* Monta texto e exibe */
    const text = _buildPhrase(winner.memory, winner.milestone.label);
    const icon = _iconForType(winner.memory.type, winner.memory.id);

    /* MELHORIA-2: delay mínimo 8s — garante que living-moments (2.5–5s)
       e emotional-state (4.5s) já terminaram antes de aparecer */
    const delay = 8000 + Math.floor(Math.random() * 3000);

    setTimeout(() => {
      try { _showAnniversaryCard(text, icon); } catch (_) {}
    }, delay);

    /* Marca como exibido */
    _markShown(winner.memory.id, winner.days);
    _shownThisSession = true;

    return true;

  } catch (_) {
    return false;
  }
}

/* ════════════════════════════════════════════
   initMemoryAnniversaries — ponto de entrada
   ════════════════════════════════════════════ */

export function initMemoryAnniversaries() {
  /* 1. Verifica ao abrir */
  checkMemoryAnniversaries();

  /* 2. MELHORIA-5: limpa listener anterior antes de registrar novo */
  try {
    if (_maVisHandler) document.removeEventListener('visibilitychange', _maVisHandler);
    _maVisHandler = () => {
      if (document.visibilityState === 'visible') {
        _shownThisSession = false;
        /* Pequeno delay para não competir com outros sistemas ao retornar */
        setTimeout(checkMemoryAnniversaries, 1200);
      }
    };
    document.addEventListener('visibilitychange', _maVisHandler, { passive: true });
  } catch (_) {}

  /* 3. RISCO-2: unsub pattern para memory:added */
  try {
    _maUnsub?.();
    _maUnsub = window._loveCity?.onLoveEvent?.('memory:added', () => {
      /* Nova memória adicionada: reseta sessão e tenta
         (raramente vai disparar — nova memória tem 0 dias) */
      _shownThisSession = false;
      checkMemoryAnniversaries();
    });
  } catch (_) {}
}
