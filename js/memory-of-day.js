/* ═══════════════════════════════════════════════
   PIETRO & EMILLY — memory-of-day.js  v2
   Memória do Dia 💛

   Escolhe 1 memória por dia de forma inteligente
   e renderiza um card emocional, simples, íntimo.

   Melhorias v2:
     - Memórias pré-semeadas do casal (sempre tem conteúdo)
     - Render imediato ao init (não depende só de IntersectionObserver)
     - loveCore API corrigida (window._loveCity.getLoveCore())
     - Weighted random mais orgânico
     - Modal com transição CSS limpa

   Dependências:
     window._loveCity  — love-city-core.js (opcional mas ideal)
     window.triggerTaekwondoEvent — home.js (opcional)
   ═══════════════════════════════════════════════ */

const LS_KEY_MOD = 'lc_memory_of_day_v2';

/* ── Memórias pré-semeadas — momentos reais do casal ──
   Usadas quando o loveCore ainda não tem memórias salvas.
   Dão vida ao app desde a primeira abertura.             */
export const SEEDED_MEMORIES = [ // RISCO-4: exportado para evitar duplicação
  {
    id      : 'seed_xadrez',
    type    : 'achievement',
    summary : 'Ela fingia gostar de xadrez só pra ficar pertinho. E deu muito certo. 😂',
    ts      : new Date('2024-08-01').getTime(),
  },
  {
    id      : 'seed_pedido',
    type    : 'milestone',
    summary : 'Ela perguntou: "não vai me pedir em namoro?" — e tudo começou. Bridgerton ao fundo.',
    ts      : new Date('2024-10-11').getTime(),
  },
  {
    id      : 'seed_taekwondo',
    type    : 'achievement',
    summary : 'Campeonato da prof. Rejane. Os dois cansados. Pietro feliz de ver ela tão forte.',
    ts      : new Date('2025-01-15').getTime(),
  },
  {
    id      : 'seed_mac',
    type    : 'event',
    summary : 'Sorvete do Mac + shopping do centro. Ela rindo o tempo todo. O melhor passeio.',
    ts      : new Date('2025-02-01').getTime(),
  },
  {
    id      : 'seed_piano',
    type    : 'special',
    summary : 'Mimi aprendendo Hometown da Adele no piano. Pietro ouvindo do outro lado.',
    ts      : new Date('2025-03-01').getTime(),
  },
  {
    id      : 'seed_academia',
    type    : 'event',
    summary : 'Treino na Academia Dinâmica Fit lado a lado. Ao lado da catedral, como sempre.',
    ts      : new Date('2025-03-15').getTime(),
  },
  {
    id      : 'seed_escola',
    type    : 'milestone',
    summary : 'Escola Maria Rocha. Mesma turma de informática. O começo de tudo.',
    ts      : new Date('2024-07-01').getTime(),
  },
  {
    id      : 'seed_bridgerton',
    type    : 'event',
    summary : 'Noites vendo Bridgerton. A amizade virando amor sem que nenhum dos dois percebesse.',
    ts      : new Date('2024-09-15').getTime(),
  },
];

/* ── Mapeamento memória → evento (substring match) ── */
const MEMORY_EVENT_MAP = {
  'taekwondo'    : () => window.triggerTaekwondoEvent?.(),
  'prof. Rejane' : () => window.triggerTaekwondoEvent?.(),
  'Campeonato'   : () => window.triggerTaekwondoEvent?.(),
};

/* ── Helpers ───────────────────────────────── */
function _todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function _formatDate(ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch (_) { return ''; }
}

function _typeIcon(type) {
  return {
    achievement : '🏆',
    event       : '🎉',
    milestone   : '💫',
    movie       : '🎬',
    quiz        : '💘',
    music       : '🎵',
    memory      : '💭',
    special     : '⭐',
  }[type] || '💛';
}

/* ── Score de relevância ───────────────────── */
function _score(mem, lastId, seenIds) {
  if (!mem) return 0.1;
  const ageMs         = Date.now() - (mem.ts || 0);
  const daysOld       = ageMs / 86_400_000;
  const isRecent      = daysOld <= 7 ? 3 : daysOld <= 30 ? 1 : 0;
  const isAchievement = mem.type === 'achievement' ? 2 : 0;
  const isMilestone   = mem.type === 'milestone' ? 1 : 0;
  const neverSeen     = !seenIds.includes(mem.id) ? 3 : 0;
  const isLast        = mem.id === lastId ? -5 : 0;
  return Math.max(isRecent + isAchievement + isMilestone + neverSeen + isLast + 1, 0.1);
}

/* ── Weighted random pick ──────────────────── */
function _weightedPick(memories, scores) {
  const total = scores.reduce((s, v) => s + v, 0);
  if (total <= 0) return memories[Math.floor(Math.random() * memories.length)];
  let r = Math.random() * total;
  for (let i = 0; i < memories.length; i++) {
    r -= scores[i];
    if (r <= 0) return memories[i];
  }
  return memories[memories.length - 1];
}

/* ── Cache localStorage ────────────────────── */
function _loadCache() {
  try {
    const raw = localStorage.getItem(LS_KEY_MOD);
    return raw ? JSON.parse(raw) : {};
  } catch (_) { return {}; }
}

function _saveCache(data) {
  try { localStorage.setItem(LS_KEY_MOD, JSON.stringify(data)); } catch (_) {}
}

/* ── Obtém todas as memórias disponíveis ───── */
function _getAllMemories() {
  let coreMemories = [];
  try {
    const core = window._loveCity?.getLoveCore?.();
    if (Array.isArray(core?.memories) && core.memories.length > 0) {
      coreMemories = core.memories;
    }
  } catch (_) {}

  // Seeds completam o pool — core tem prioridade
  const coreIds = new Set(coreMemories.map(m => m.id));
  const seeded  = SEEDED_MEMORIES.filter(m => !coreIds.has(m.id));
  return [...coreMemories, ...seeded];
}

/* ══════════════════════════════════════════════
   getMemoryOfDay — função principal exportada
   Retorna { memory, isNew } ou null
   ══════════════════════════════════════════════ */
export function getMemoryOfDay() {
  const today    = _todayStr();
  const memories = _getAllMemories();
  if (memories.length === 0) return null;

  const cache = _loadCache();

  // Já calculou hoje → retorna o mesmo
  if (cache.lastDate === today && cache.lastMemoryId) {
    const mem = memories.find(m => m.id === cache.lastMemoryId);
    if (mem) return { memory: mem, isNew: false };
  }

  // Calcula nova memória do dia
  const lastId  = cache.lastMemoryId || '';
  const seenIds = Array.isArray(cache.seenIds) ? cache.seenIds : [];
  const scores  = memories.map(m => _score(m, lastId, seenIds));
  const chosen  = _weightedPick(memories, scores);

  const newSeen = [...new Set([...seenIds, chosen.id])].slice(-50);
  _saveCache({ lastDate: today, lastMemoryId: chosen.id, seenIds: newSeen });

  return { memory: chosen, isNew: true };
}

/* ══════════════════════════════════════════════
   Ação ao clicar — dispara evento ou abre modal
   ══════════════════════════════════════════════ */
function _onMemoryClick(memory) {
  if (!memory) return;
  const summary = memory.summary || '';
  for (const [key, fn] of Object.entries(MEMORY_EVENT_MAP)) {
    if (summary.includes(key)) {
      try { fn(); return; } catch (_) {}
    }
  }
  _showSimpleModal(memory);
}

function _showSimpleModal(memory) {
  document.getElementById('mod-memory-day-overlay')?.remove();

  const icon = _typeIcon(memory.type);
  const date = _formatDate(memory.ts);

  const overlay = document.createElement('div');
  overlay.id        = 'mod-memory-day-overlay';
  overlay.className = 'mod-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Memória');

  overlay.innerHTML = `
    <div class="mod-sheet">
      <button class="mod-sheet-close" id="mod-mem-close" aria-label="Fechar">✕</button>
      <div class="mod-sheet-icon" aria-hidden="true">${icon}</div>
      <div class="mod-sheet-label">Uma memória nossa</div>
      <p class="mod-sheet-summary">${memory.summary || ''}</p>
      ${date ? `<div class="mod-sheet-date">${date}</div>` : ''}
    </div>`;

  document.body.appendChild(overlay);
  // Força reflow para transição funcionar
  overlay.getBoundingClientRect();
  overlay.classList.add('mod-overlay--visible');

  const close = () => {
    overlay.classList.remove('mod-overlay--visible');
    setTimeout(() => overlay.remove(), 320);
  };

  overlay.querySelector('#mod-mem-close')?.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  const onKey = e => {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); }
  };
  document.addEventListener('keydown', onKey);
}

/* ══════════════════════════════════════════════
   renderMemoryOfDay — monta o card na UI
   ══════════════════════════════════════════════ */
export function renderMemoryOfDay() {
  const wrap = document.getElementById('memory-of-day');
  if (!wrap) return;

  let result = null;
  try { result = getMemoryOfDay(); } catch (_) {}

  if (!result) {
    wrap.innerHTML = `
      <div class="mod-empty">
        <div class="mod-empty-icon">💛</div>
        <p class="mod-empty-text">As memórias de vocês começam a aparecer aqui 💛</p>
        <button class="mod-see-all"
          onclick="document.getElementById('sec-museu')?.scrollIntoView({behavior:'smooth'})">
          Ver todas as memórias →
        </button>
      </div>`;
    return;
  }

  const { memory, isNew } = result;
  const icon     = _typeIcon(memory.type);
  const date     = _formatDate(memory.ts);
  const hasEvent = Object.keys(MEMORY_EVENT_MAP).some(k => (memory.summary || '').includes(k));

  wrap.innerHTML = `
    <div class="mod-card${isNew ? ' mod-card--new' : ''}" id="mod-card-inner"
         tabindex="0" role="button"
         aria-label="Memória do dia: ${memory.summary || ''}">
      <div class="mod-card-top">
        <span class="mod-card-icon" aria-hidden="true">${icon}</span>
        ${isNew ? '<span class="mod-card-badge">✨ hoje</span>' : ''}
      </div>
      <p class="mod-card-summary">${memory.summary || ''}</p>
      ${date ? `<div class="mod-card-date">${date}</div>` : ''}
      <div class="mod-card-actions">
        <button class="mod-btn mod-btn--primary" id="mod-btn-revive">
          ${hasEvent ? '▶ Reviver esse momento' : '💭 Ver memória'}
        </button>
        <button class="mod-btn mod-btn--ghost"
          onclick="document.getElementById('sec-museu')?.scrollIntoView({behavior:'smooth'})">
          Ver todas →
        </button>
      </div>
    </div>`;

  const btnRevive = wrap.querySelector('#mod-btn-revive');
  const card      = wrap.querySelector('#mod-card-inner');

  const handleClick = e => { e.stopPropagation(); _onMemoryClick(memory); };
  btnRevive?.addEventListener('click', handleClick);
  card?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); _onMemoryClick(memory); }
  });
}

/* ══════════════════════════════════════════════
   initMemoryOfDay — ponto de entrada

   Estratégia dupla:
   1. Render imediato no init
   2. Re-render automático via event bus quando
      nova memória é adicionada ao loveCore
   ══════════════════════════════════════════════ */
/* RISCO-2: unsub para evitar acumulação em hot reload */
let _modUnsub = null;

export function initMemoryOfDay() {
  if (!document.getElementById('sec-memory-day')) return;

  // Render imediato — sem depender de scroll
  try { renderMemoryOfDay(); } catch (_) {}

  // RISCO-2: cancela listener anterior e registra novo
  try {
    _modUnsub?.();
    _modUnsub = window._loveCity?.onLoveEvent?.('memory:added', () => {
      try { renderMemoryOfDay(); } catch (_) {}
    });
  } catch (_) {}
}
