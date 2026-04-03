/* ═══════════════════════════════════════════════
   PIETRO & EMILLY — museum.js  v1
   Museu de Memórias 🏛️

   Lê memórias do window._loveCity (love-city-core.js)
   e renderiza uma interface simples, emocional e estável.

   Não depende de Firebase, APIs externas nem outros módulos.
   Funciona mesmo se o loveCore ainda não tiver memórias.
   ═══════════════════════════════════════════════ */

/* ── Mapeamento de memórias para eventos ──────── */
// Ao clicar em uma memória, se existir uma função associada, ela é chamada.
// Fallback seguro: se não existir, abre o modal simples.
const MEMORY_EVENT_MAP = {
  'Campeonato de taekwondo juntos — prof. Rejane': () => {
    if (typeof window.triggerTaekwondoEvent === 'function') {
      window.triggerTaekwondoEvent();
    }
  },
  'Campeonato de taekwondo juntos': () => {
    if (typeof window.triggerTaekwondoEvent === 'function') {
      window.triggerTaekwondoEvent();
    }
  },
};

/* ── Ícones por tipo de memória ───────────────── */
const TYPE_ICON = {
  achievement : '🏆',
  event       : '🎉',
  milestone   : '💫',
  movie       : '🎬',
  quiz        : '💘',
  music       : '🎵',
  memory      : '💭',
  special     : '⭐',
};

const TYPE_LABEL = {
  achievement : 'Conquista',
  event       : 'Evento',
  milestone   : 'Marco',
  movie       : 'Cinema',
  quiz        : 'Quiz',
  music       : 'Música',
  memory      : 'Memória',
  special     : 'Especial',
};

/* ── Formata timestamp em DD/MM/YYYY ──────────── */
function _formatDate(ts) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    const day   = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year  = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (_) { return ''; }
}

/* ── Pega memórias do loveCore ────────────────── */
function _getMemories() {
  try {
    const core = window._loveCity?.getLoveCore?.();
    if (core?.memories && Array.isArray(core.memories)) {
      // Mais recentes primeiro
      return [...core.memories].sort((a, b) => (b.ts || 0) - (a.ts || 0));
    }
  } catch (_) {}
  return [];
}

/* ── Modal simples para memórias sem evento ────── */
function _showMemoryModal(memory) {
  // Remove modal existente se houver
  document.getElementById('museu-modal-overlay')?.remove();

  const icon  = TYPE_ICON[memory.type] || '💭';
  const label = TYPE_LABEL[memory.type] || 'Memória';
  const date  = _formatDate(memory.ts);

  const overlay = document.createElement('div');
  overlay.id = 'museu-modal-overlay';
  overlay.className = 'museu-modal-overlay';
  overlay.innerHTML = `
    <div class="museu-modal">
      <button class="museu-modal-close" id="museu-modal-close-btn" aria-label="Fechar">✕</button>
      <div class="museu-modal-icon">${icon}</div>
      <div class="museu-modal-type">${label}</div>
      <div class="museu-modal-summary">${memory.summary || ''}</div>
      ${date ? `<div class="museu-modal-date">${date}</div>` : ''}
    </div>`;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));

  const close = () => {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 300);
  };

  overlay.querySelector('#museu-modal-close-btn').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
}

/* ── Clique numa memória ──────────────────────── */
function _onMemoryClick(memory) {
  if (!memory) return;

  // Verifica se existe evento associado (matching parcial por substring)
  const summary = memory.summary || '';
  for (const [key, fn] of Object.entries(MEMORY_EVENT_MAP)) {
    if (summary.includes(key) || key.includes(summary)) {
      try { fn(); } catch (e) {
        console.warn('[Museu] erro ao acionar evento:', e?.message || e);
        _showMemoryModal(memory); // fallback para o modal
      }
      return;
    }
  }

  // Sem evento associado → modal simples
  _showMemoryModal(memory);
}

/* ── Render principal ─────────────────────────── */
export function renderMuseum() {
  const wrap = document.getElementById('museu-wrap');
  if (!wrap) return;

  const memories = _getMemories();

  if (memories.length === 0) {
    wrap.innerHTML = `
      <div class="museu-empty">
        <div class="museu-empty-icon">🏛️</div>
        <div class="museu-empty-title">O museu ainda está vazio</div>
        <div class="museu-empty-sub">
          As memórias aparecem aqui conforme vocês vivem momentos juntos no app.<br>
          Comece pelo campeonato de taekwondo na casinha! 🥋
        </div>
      </div>`;
    return;
  }

  const fragment = document.createDocumentFragment();

  // Cabeçalho com contagem
  const header = document.createElement('div');
  header.className = 'museu-header';
  header.innerHTML = `<span class="museu-count">${memories.length} ${memories.length === 1 ? 'memória' : 'memórias'} guardadas</span>`;
  fragment.appendChild(header);

  // Cards
  const list = document.createElement('div');
  list.className = 'museu-list';

  memories.forEach((mem, idx) => {
    const icon  = TYPE_ICON[mem.type]  || '💭';
    const label = TYPE_LABEL[mem.type] || 'Memória';
    const date  = _formatDate(mem.ts);
    const hasEvent = Object.keys(MEMORY_EVENT_MAP).some(
      k => (mem.summary || '').includes(k) || k.includes(mem.summary || '')
    );

    const card = document.createElement('div');
    card.className = 'museu-card';
    card.style.animationDelay = `${idx * 60}ms`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', mem.summary || 'Memória');

    card.innerHTML = `
      <div class="museu-card-icon">${icon}</div>
      <div class="museu-card-body">
        <div class="museu-card-summary">${mem.summary || ''}</div>
        <div class="museu-card-meta">
          <span class="museu-card-type">${label}</span>
          ${date ? `<span class="museu-card-date">${date}</span>` : ''}
        </div>
      </div>
      ${hasEvent ? '<div class="museu-card-replay">▶ Reviver</div>' : '<div class="museu-card-arrow">›</div>'}`;

    card.addEventListener('click', () => _onMemoryClick(mem));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); _onMemoryClick(mem); }
    });

    list.appendChild(card);
  });

  fragment.appendChild(list);
  wrap.innerHTML = '';
  wrap.appendChild(fragment);
}

/* ── Init: renderiza quando a seção entra na viewport ── */
/* RISCO-2: unsub para evitar acumulação em hot reload */
let _museumUnsub = null;

export function initMuseum() {
  const section = document.getElementById('sec-museu');
  if (!section) return;

  // Renderiza na primeira vez que a seção fica visível (IntersectionObserver)
  let rendered = false;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting && !rendered) {
        rendered = true;
        renderMuseum();
        observer.disconnect();
      }
    }
  }, { threshold: 0.05 });

  observer.observe(section);

  // RISCO-2: cancela listener anterior e registra novo
  try {
    if (typeof window._loveCity?.onLoveEvent === 'function') {
      _museumUnsub?.();
      _museumUnsub = window._loveCity.onLoveEvent('memory:added', () => {
        if (rendered) renderMuseum();
      });
    }
  } catch (_) {}
}
