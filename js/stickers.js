/* ═══════════════════════════════════════════════════════════════
   PIETRO & EMILLY — stickers.js
   Sistema de Figurinhas por Categoria
   · Tabs de filtro com animação
   · Busca em tempo real
   · Favoritos (localStorage)
   · Copiar / enviar ao mural
   · Lazy loading
   ═══════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════
   BANCO DE DADOS DE FIGURINHAS
   ════════════════════════════════════════════ */
const BASE = 'emojis';

export const STICKER_CATEGORIES = [
  {
    id: 'todos',
    label: 'Todos',
    icon: '✨',
  },
  {
    id: 'crepusculo',
    label: 'Crepúsculo',
    icon: '🌙',
  },
  {
    id: 'princesas',
    label: 'Princesas',
    icon: '👸',
  },
  {
    id: 'princes',
    label: 'Príncipes',
    icon: '🤴',
  },
  {
    id: 'marvel',
    label: 'Marvel',
    icon: '🕷️',
  },
  {
    id: 'favoritos',
    label: 'Favoritos',
    icon: '❤️',
  },
];

export const STICKERS = {
  crepusculo: [
    { id: 'cr_alice_happy',   file: `${BASE}/Crepusculo/Alice_Happy.png`,   name: 'Alice',    emotion: 'happy',  label: 'Alice Feliz' },
    { id: 'cr_bella_happy',   file: `${BASE}/Crepusculo/Bella_Happy.png`,   name: 'Bella',    emotion: 'happy',  label: 'Bella Feliz' },
    { id: 'cr_bella_sad',     file: `${BASE}/Crepusculo/Bella_Sad.png`,     name: 'Bella',    emotion: 'sad',    label: 'Bella Triste' },
    { id: 'cr_bella_angry',   file: `${BASE}/Crepusculo/Bella_Angry.png`,   name: 'Bella',    emotion: 'angry',  label: 'Bella Brava' },
    { id: 'cr_edward_happy',  file: `${BASE}/Crepusculo/Edward_Happy.png`,  name: 'Edward',   emotion: 'happy',  label: 'Edward Feliz' },
    { id: 'cr_edward_sad',    file: `${BASE}/Crepusculo/Edward_Sad.png`,    name: 'Edward',   emotion: 'sad',    label: 'Edward Triste' },
    { id: 'cr_edward_angry',  file: `${BASE}/Crepusculo/Edward_Angry.png`,  name: 'Edward',   emotion: 'angry',  label: 'Edward Bravo' },
    { id: 'cr_emmett_happy',  file: `${BASE}/Crepusculo/Emmett_Happy.png`,  name: 'Emmett',   emotion: 'happy',  label: 'Emmett Feliz' },
    { id: 'cr_jacob_happy',   file: `${BASE}/Crepusculo/Jacob_Happy.png`,   name: 'Jacob',    emotion: 'happy',  label: 'Jacob Feliz' },
    { id: 'cr_jacob_sad',     file: `${BASE}/Crepusculo/Jacob_Sad.png`,     name: 'Jacob',    emotion: 'sad',    label: 'Jacob Triste' },
    { id: 'cr_jacob_angry',   file: `${BASE}/Crepusculo/Jacob_Angry.png`,   name: 'Jacob',    emotion: 'angry',  label: 'Jacob Bravo' },
    { id: 'cr_rosalie_angry', file: `${BASE}/Crepusculo/Rosalie_Angry.png`, name: 'Rosalie',  emotion: 'angry',  label: 'Rosalie Brava' },
  ],
  princesas: [
    { id: 'pr_anna_happy',    file: `${BASE}/Princesas/Anna_Happy.png`,      name: 'Anna',     emotion: 'happy',  label: 'Anna Feliz' },
    { id: 'pr_anna_sad',      file: `${BASE}/Princesas/Anna_Sad.png`,        name: 'Anna',     emotion: 'sad',    label: 'Anna Triste' },
    { id: 'pr_anna_angry',    file: `${BASE}/Princesas/Anna_Angry.png`,      name: 'Anna',     emotion: 'angry',  label: 'Anna Brava' },
    { id: 'pr_elsa_happy',    file: `${BASE}/Princesas/Elsa_Happy.png`,      name: 'Elsa',     emotion: 'happy',  label: 'Elsa Feliz' },
    { id: 'pr_elsa_sad',      file: `${BASE}/Princesas/Elsa_Sad.png`,        name: 'Elsa',     emotion: 'sad',    label: 'Elsa Triste' },
    { id: 'pr_elsa_angry',    file: `${BASE}/Princesas/Elsa_Angry.png`,      name: 'Elsa',     emotion: 'angry',  label: 'Elsa Brava' },
    { id: 'pr_merida_happy',  file: `${BASE}/Princesas/Merida_Happy.png`,    name: 'Mérida',   emotion: 'happy',  label: 'Mérida Feliz' },
    { id: 'pr_merida_sad',    file: `${BASE}/Princesas/Merida_Sad.png`,      name: 'Mérida',   emotion: 'sad',    label: 'Mérida Triste' },
    { id: 'pr_moana_happy',   file: `${BASE}/Princesas/Moana_Happy.png`,     name: 'Moana',    emotion: 'happy',  label: 'Moana Feliz' },
    { id: 'pr_moana_sad',     file: `${BASE}/Princesas/Moana_Sad.png`,       name: 'Moana',    emotion: 'sad',    label: 'Moana Triste' },
    { id: 'pr_moana_angry',   file: `${BASE}/Princesas/Moana_Angry.png`,     name: 'Moana',    emotion: 'angry',  label: 'Moana Brava' },
    { id: 'pr_rapunzel_happy',file: `${BASE}/Princesas/Rapunzel_Happy.png`,  name: 'Rapunzel', emotion: 'happy',  label: 'Rapunzel Feliz' },
    { id: 'pr_rapunzel_sad',  file: `${BASE}/Princesas/Rapunzel_Sad.png`,    name: 'Rapunzel', emotion: 'sad',    label: 'Rapunzel Triste' },
    { id: 'pr_rapunzel_angry',file: `${BASE}/Princesas/Rapunzel_Angry.png`,  name: 'Rapunzel', emotion: 'angry',  label: 'Rapunzel Brava' },
    { id: 'pr_raya_happy',    file: `${BASE}/Princesas/Raya_Happy.png`,      name: 'Raya',     emotion: 'happy',  label: 'Raya Feliz' },
    { id: 'pr_raya_sad',      file: `${BASE}/Princesas/Raya_Sad.png`,        name: 'Raya',     emotion: 'sad',    label: 'Raya Triste' },
    { id: 'pr_raya_angry',    file: `${BASE}/Princesas/Raya_Angry.png`,      name: 'Raya',     emotion: 'angry',  label: 'Raya Brava' },
    { id: 'pr_tiana_happy',   file: `${BASE}/Princesas/Tiana_Happy.png`,     name: 'Tiana',    emotion: 'happy',  label: 'Tiana Feliz' },
    { id: 'pr_tiana_happy2',  file: `${BASE}/Princesas/Tiana_Happy_2.png`,   name: 'Tiana',    emotion: 'happy',  label: 'Tiana Radiante' },
    { id: 'pr_tiana_sad',     file: `${BASE}/Princesas/Tiana_Sad.png`,       name: 'Tiana',    emotion: 'sad',    label: 'Tiana Triste' },
    // Pastas individuais também são princesas
    { id: 'pr_ariel_happy',   file: `${BASE}/Ariel/Ariel_Happy.png`,         name: 'Ariel',    emotion: 'happy',  label: 'Ariel Feliz' },
    { id: 'pr_ariel_sad',     file: `${BASE}/Ariel/Ariel_Sad.png`,           name: 'Ariel',    emotion: 'sad',    label: 'Ariel Triste' },
    { id: 'pr_ariel_scared',  file: `${BASE}/Ariel/Ariel_Scared.png`,        name: 'Ariel',    emotion: 'scared', label: 'Ariel Assustada' },
    { id: 'pr_bela_happy',    file: `${BASE}/Bela/Bela_Happy.png`,           name: 'Bela',     emotion: 'happy',  label: 'Bela Feliz' },
    { id: 'pr_bela_sad',      file: `${BASE}/Bela/Bela_Sad.png`,             name: 'Bela',     emotion: 'sad',    label: 'Bela Triste' },
    { id: 'pr_bela_angry',    file: `${BASE}/Bela/Bela_Angry.png`,           name: 'Bela',     emotion: 'angry',  label: 'Bela Brava' },
    { id: 'pr_cinderela_happy', file: `${BASE}/Cinderela/Cinderela_Happy.png`, name: 'Cinderela', emotion: 'happy', label: 'Cinderela Feliz' },
    { id: 'pr_cinderela_sad',   file: `${BASE}/Cinderela/Cinderela_Sad.png`,   name: 'Cinderela', emotion: 'sad',   label: 'Cinderela Triste' },
    { id: 'pr_cinderela_scared',file: `${BASE}/Cinderela/Cinderela_Scared.png`,name: 'Cinderela', emotion: 'scared',label: 'Cinderela Assustada' },
    { id: 'pr_merida2_happy', file: `${BASE}/Merida/Merida_Happy.png`,       name: 'Mérida',   emotion: 'happy',  label: 'Mérida Feliz' },
    { id: 'pr_merida2_angry', file: `${BASE}/Merida/Merida_Angry.png`,       name: 'Mérida',   emotion: 'angry',  label: 'Mérida Brava' },
    { id: 'pr_merida2_scared',file: `${BASE}/Merida/Merida_Scared.png`,      name: 'Mérida',   emotion: 'scared', label: 'Mérida Assustada' },
    { id: 'pr_rapunzel2_happy', file: `${BASE}/Rapunzel/Rapunzel_Happy.png`, name: 'Rapunzel', emotion: 'happy',  label: 'Rapunzel Brilhante' },
    { id: 'pr_rapunzel2_angry', file: `${BASE}/Rapunzel/Rapunzel_Angry.png`, name: 'Rapunzel', emotion: 'angry',  label: 'Rapunzel Irritada' },
    { id: 'pr_rapunzel2_scared',file: `${BASE}/Rapunzel/Rapunzel_Scared.png`,name: 'Rapunzel', emotion: 'scared', label: 'Rapunzel Surpresa' },
  ],
  princes: [
    { id: 'pn_hercules_happy', file: `${BASE}/Princes/Hercules_Happy.png`, name: 'Hércules', emotion: 'happy', label: 'Hércules Feliz' },
    { id: 'pn_hercules_sad',   file: `${BASE}/Princes/Hercules_Sad.png`,   name: 'Hércules', emotion: 'sad',   label: 'Hércules Triste' },
    { id: 'pn_hercules_angry', file: `${BASE}/Princes/Hercules_Angry.png`, name: 'Hércules', emotion: 'angry', label: 'Hércules Bravo' },
    { id: 'pn_jim_happy',      file: `${BASE}/Princes/Jim_Happy.png`,      name: 'Jim',      emotion: 'happy', label: 'Jim Feliz' },
    { id: 'pn_jim_sad',        file: `${BASE}/Princes/Jim_Sad.png`,        name: 'Jim',      emotion: 'sad',   label: 'Jim Triste' },
    { id: 'pn_jim_angry',      file: `${BASE}/Princes/Jim_Angry.png`,      name: 'Jim',      emotion: 'angry', label: 'Jim Bravo' },
    { id: 'pn_milo_happy',     file: `${BASE}/Princes/Milo_Happy.png`,     name: 'Milo',     emotion: 'happy', label: 'Milo Feliz' },
    { id: 'pn_milo_angry',     file: `${BASE}/Princes/Milo_Angry.png`,     name: 'Milo',     emotion: 'angry', label: 'Milo Bravo' },
    { id: 'pn_quasi_happy',    file: `${BASE}/Princes/Quasimodo_Happy.png`,name: 'Quasimodo',emotion: 'happy', label: 'Quasimodo Feliz' },
    { id: 'pn_quasi_sad',      file: `${BASE}/Princes/Quasimodo_Sad.png`,  name: 'Quasimodo',emotion: 'sad',   label: 'Quasimodo Triste' },
    { id: 'pn_quasi_angry',    file: `${BASE}/Princes/Quasimodo_Angry.png`,name: 'Quasimodo',emotion: 'angry', label: 'Quasimodo Bravo' },
    { id: 'pn_tarzan_happy',   file: `${BASE}/Princes/Tarzan_Happy.png`,   name: 'Tarzan',   emotion: 'happy', label: 'Tarzan Feliz' },
    { id: 'pn_tarzan_sad',     file: `${BASE}/Princes/Tarzan_Sad.png`,     name: 'Tarzan',   emotion: 'sad',   label: 'Tarzan Triste' },
    { id: 'pn_tarzan_angry',   file: `${BASE}/Princes/Tarzan_Angry.png`,   name: 'Tarzan',   emotion: 'angry', label: 'Tarzan Bravo' },
  ],
  marvel: [
    { id: 'mv_spider_happy', file: `${BASE}/Marvel/Spider-Man_Happy.png`, name: 'Spider-Man', emotion: 'happy', label: 'Spider-Man Feliz' },
    { id: 'mv_spider_sad',   file: `${BASE}/Marvel/Spider-Man_Sad.png`,   name: 'Spider-Man', emotion: 'sad',   label: 'Spider-Man Triste' },
    { id: 'mv_spider_angry', file: `${BASE}/Marvel/Spider-Man_Angry.png`, name: 'Spider-Man', emotion: 'angry', label: 'Spider-Man Bravo' },
  ],
};

/* ════════════════════════════════════════════
   ESTADO
   ════════════════════════════════════════════ */
const LS_FAVORITES = 'pe_sticker_favorites';
const LS_RECENT    = 'pe_sticker_recent';

let _activeCategory = 'todos';
let _searchQuery    = '';
let _favorites      = new Set(JSON.parse(localStorage.getItem(LS_FAVORITES) || '[]'));
let _recent         = JSON.parse(localStorage.getItem(LS_RECENT) || '[]');

/* ════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════ */
function getAllStickers() {
  return Object.values(STICKERS).flat();
}

function getFilteredStickers() {
  let list;

  if (_activeCategory === 'favoritos') {
    list = getAllStickers().filter(s => _favorites.has(s.id));
  } else if (_activeCategory === 'todos') {
    list = getAllStickers();
  } else {
    list = STICKERS[_activeCategory] || [];
  }

  if (_searchQuery.trim()) {
    const q = _searchQuery.toLowerCase();
    list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.label.toLowerCase().includes(q) ||
      s.emotion.toLowerCase().includes(q)
    );
  }

  return list;
}

function saveFavorites() {
  localStorage.setItem(LS_FAVORITES, JSON.stringify([..._favorites]));
}

function saveRecent(stickerId) {
  _recent = [stickerId, ..._recent.filter(id => id !== stickerId)].slice(0, 20);
  localStorage.setItem(LS_RECENT, JSON.stringify(_recent));
}

function getEmotionEmoji(emotion) {
  return { happy: '😊', sad: '😢', angry: '😤', scared: '😱' }[emotion] || '✨';
}

/* ════════════════════════════════════════════
   RENDER PRINCIPAL
   ════════════════════════════════════════════ */
function renderStickerGrid() {
  const grid = document.getElementById('sticker-grid');
  const empty = document.getElementById('sticker-empty');
  if (!grid) return;

  const list = getFilteredStickers();

  if (!list.length) {
    grid.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  // Animação de saída
  grid.style.opacity = '0';
  grid.style.transform = 'translateY(8px)';

  setTimeout(() => {
    grid.innerHTML = '';

    list.forEach(sticker => {
      const card = document.createElement('div');
      card.className = 'sticker-card';
      card.dataset.id = sticker.id;
      if (_favorites.has(sticker.id)) card.classList.add('favorited');

      card.innerHTML = `
        <button class="sticker-fav-btn" data-id="${sticker.id}" aria-label="Favoritar">
          ${_favorites.has(sticker.id) ? '❤️' : '🤍'}
        </button>
        <div class="sticker-img-wrap">
          <img
            src="${sticker.file}"
            alt="${sticker.label}"
            loading="lazy"
            draggable="false"
            class="sticker-img"
          >
          <div class="sticker-click-feedback">✓ Copiado!</div>
        </div>
        <div class="sticker-label">${sticker.name}</div>
        <div class="sticker-emotion">${getEmotionEmoji(sticker.emotion)}</div>
      `;

      // Clique na imagem — copia o nome / mostra feedback
      card.querySelector('.sticker-img-wrap').addEventListener('click', () => {
        _handleStickerClick(sticker, card);
      });

      // Botão de favorito
      card.querySelector('.sticker-fav-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        _toggleFavorite(sticker.id, card);
      });

      grid.appendChild(card);
    });

    // Animação de entrada
    grid.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    grid.style.opacity = '1';
    grid.style.transform = 'translateY(0)';
  }, 150);
}

/* ════════════════════════════════════════════
   INTERAÇÕES
   ════════════════════════════════════════════ */
function _handleStickerClick(sticker, card) {
  saveRecent(sticker.id);

  // Animação de clique
  card.classList.add('sticker-bounce');
  setTimeout(() => card.classList.remove('sticker-bounce'), 400);

  // Feedback visual "Copiado!"
  const feedback = card.querySelector('.sticker-click-feedback');
  feedback.classList.add('show');
  setTimeout(() => feedback.classList.remove('show'), 1500);

  // Tenta copiar o nome para o clipboard
  const text = sticker.label;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  // Se tem campo de input do mural ativo, insere lá
  const muralInput = document.getElementById('mural-input');
  if (muralInput && document.getElementById('mural-conteudo')?.style.display !== 'none') {
    const pos = muralInput.selectionStart || muralInput.value.length;
    muralInput.value =
      muralInput.value.slice(0, pos) + ` [${sticker.label}] ` + muralInput.value.slice(pos);
    muralInput.focus();
    return;
  }

  // Toast global
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = `${getEmotionEmoji(sticker.emotion)} ${sticker.label} — copiado!`;
    toast.classList.add('show');
    clearTimeout(toast._sticker_timer);
    toast._sticker_timer = setTimeout(() => toast.classList.remove('show'), 2500);
  }
}

function _toggleFavorite(id, card) {
  if (_favorites.has(id)) {
    _favorites.delete(id);
    card.classList.remove('favorited');
    card.querySelector('.sticker-fav-btn').textContent = '🤍';
  } else {
    _favorites.add(id);
    card.classList.add('favorited');
    card.querySelector('.sticker-fav-btn').textContent = '❤️';
    // Micro animação no botão
    const btn = card.querySelector('.sticker-fav-btn');
    btn.style.transform = 'scale(1.5)';
    setTimeout(() => { btn.style.transform = ''; }, 300);
  }
  saveFavorites();

  // Atualiza contador da aba Favoritos
  _updateFavCount();

  // Se estamos na aba favoritos, re-renderiza
  if (_activeCategory === 'favoritos') {
    setTimeout(renderStickerGrid, 350);
  }
}

function _updateFavCount() {
  const badge = document.getElementById('sticker-fav-count');
  if (badge) {
    const count = _favorites.size;
    badge.textContent = count > 0 ? count : '';
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  }
}

/* ════════════════════════════════════════════
   TABS
   ════════════════════════════════════════════ */
function _setActiveTab(catId) {
  _activeCategory = catId;

  document.querySelectorAll('.sticker-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === catId);
  });

  // Atualiza título da seção
  const titleEl = document.getElementById('sticker-section-title');
  const cat = STICKER_CATEGORIES.find(c => c.id === catId);
  if (titleEl && cat) {
    titleEl.innerHTML = `${cat.icon} ${cat.label}`;
  }

  renderStickerGrid();
}

/* ════════════════════════════════════════════
   BUSCA
   ════════════════════════════════════════════ */
function _handleSearch(value) {
  _searchQuery = value;
  renderStickerGrid();
}

/* ════════════════════════════════════════════
   INJEÇÃO DO HTML DA SEÇÃO
   ════════════════════════════════════════════ */
function _buildSectionHTML() {
  const tabsHTML = STICKER_CATEGORIES.map(cat => `
    <button
      class="sticker-tab${cat.id === 'todos' ? ' active' : ''}"
      data-cat="${cat.id}"
      aria-label="${cat.label}"
    >
      <span class="sticker-tab-icon">${cat.icon}</span>
      <span class="sticker-tab-label">${cat.label}</span>
      ${cat.id === 'favoritos' ? '<span class="sticker-fav-badge" id="sticker-fav-count" style="display:none"></span>' : ''}
    </button>
  `).join('');

  return `
    <!-- ── BUSCA ── -->
    <div class="sticker-search-wrap">
      <span class="sticker-search-icon">🔍</span>
      <input
        class="sticker-search"
        id="sticker-search"
        type="text"
        placeholder="Buscar figurinha..."
        autocomplete="off"
      >
      <button class="sticker-search-clear" id="sticker-search-clear" aria-label="Limpar">✕</button>
    </div>

    <!-- ── TABS ── -->
    <div class="sticker-tabs" role="tablist" aria-label="Categorias de figurinhas">
      ${tabsHTML}
    </div>

    <!-- ── TÍTULO DA CATEGORIA ── -->
    <div class="sticker-cat-title" id="sticker-section-title">✨ Todos</div>

    <!-- ── GRID ── -->
    <div class="sticker-grid" id="sticker-grid"></div>

    <!-- ── EMPTY STATE ── -->
    <div class="sticker-empty" id="sticker-empty" style="display:none">
      <div class="sticker-empty-icon">🔍</div>
      <div class="sticker-empty-text">Nenhuma figurinha encontrada</div>
      <div class="sticker-empty-sub">Tente outra busca ou categoria 💕</div>
    </div>

    <!-- ── DICA ── -->
    <p class="sticker-tip">
      💡 Clique em uma figurinha para copiar • Toque em 🤍 para favoritar
    </p>
  `;
}

/* ════════════════════════════════════════════
   MOOD STICKERS — integração com #sec-humor
   ════════════════════════════════════════════ */

const LS_MOOD_STICKER_PIETRO = 'pe_mood_sticker_pietro';
const LS_MOOD_STICKER_EMILLY = 'pe_mood_sticker_emilly';

let _moodStickerAuthor = 'Pietro';

// Categorias exibidas no mural de humor
const MOOD_CAT_ORDER = [
  { id: 'princesas',  label: 'Princesas',  icon: '👑' },
  { id: 'princes',    label: 'Príncipes',  icon: '🤴' },
  { id: 'crepusculo', label: 'Crepúsculo', icon: '🌙' },
  { id: 'marvel',     label: 'Marvel',     icon: '🕷️' },
];

function _getMoodStickerKey(author) {
  return author === 'Emilly' ? LS_MOOD_STICKER_EMILLY : LS_MOOD_STICKER_PIETRO;
}

function _saveMoodStickerForPerson(sticker, author) {
  const data = {
    id: sticker.id, label: sticker.label,
    file: sticker.file, emotion: sticker.emotion,
    name: sticker.name,
    savedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
  localStorage.setItem(_getMoodStickerKey(author), JSON.stringify(data));
}

function _loadMoodStickerForPerson(author) {
  try { return JSON.parse(localStorage.getItem(_getMoodStickerKey(author)) || 'null'); } catch { return null; }
}

export function initMoodStickers(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Abas de universo
  const tabsHTML = MOOD_CAT_ORDER.map((cat, i) => `
    <button class="mood-univ-tab${i === 0 ? ' active' : ''}" data-cat="${cat.id}">
      ${cat.icon} ${cat.label}
    </button>
  `).join('');

  // Grid de figurinhas por categoria (todos os universos, mostrado/oculto via JS)
  let gridsHTML = '';
  MOOD_CAT_ORDER.forEach((cat, i) => {
    const stickers = STICKERS[cat.id] || [];
    gridsHTML += `
      <div class="mood-univ-grid" id="mood-univ-${cat.id}" style="${i > 0 ? 'display:none' : ''}">
        ${stickers.map(s => `
          <div class="mood-sticker-card" data-id="${s.id}" data-emotion="${s.emotion}" title="${s.label}">
            <img src="${s.file}" alt="${s.label}" loading="lazy" draggable="false" class="mood-sticker-img">
            <div class="mood-sticker-card-label">${s.name}</div>
          </div>`).join('')}
      </div>`;
  });

  container.innerHTML = `
    <div class="mood-univ-tabs">${tabsHTML}</div>
    <div class="mood-univ-grids">${gridsHTML}</div>
  `;

  // Restaura seleções salvas para cada pessoa
  ['Pietro', 'Emilly'].forEach(author => {
    const saved = _loadMoodStickerForPerson(author);
    if (saved) {
      const el = container.querySelector(`[data-id="${saved.id}"]`);
      if (el) el.classList.add(`selected-${author.toLowerCase()}`);
    }
  });

  // Eventos de tab
  container.querySelectorAll('.mood-univ-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.mood-univ-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      MOOD_CAT_ORDER.forEach(cat => {
        const grid = container.querySelector(`#mood-univ-${cat.id}`);
        if (grid) grid.style.display = cat.id === btn.dataset.cat ? '' : 'none';
      });
    });
  });

  // Eventos de clique nas figurinhas
  container.querySelectorAll('.mood-sticker-card').forEach(card => {
    card.addEventListener('click', () => {
      const author = _moodStickerAuthor;
      const authorLower = author.toLowerCase();

      // Remove seleção anterior desta pessoa
      container.querySelectorAll(`.mood-sticker-card.selected-${authorLower}`)
        .forEach(c => c.classList.remove(`selected-${authorLower}`));

      card.classList.add(`selected-${authorLower}`);

      // Animação
      card.classList.add('mood-sticker-bounce');
      setTimeout(() => card.classList.remove('mood-sticker-bounce'), 400);

      const id = card.dataset.id;
      const sticker = Object.values(STICKERS).flat().find(s => s.id === id);
      if (!sticker) return;

      _saveMoodStickerForPerson(sticker, author);

      // Atualiza o card de humor da pessoa no topo
      const emojiEl = document.getElementById(`mood-emoji-${authorLower}`);
      const labelEl = document.getElementById(`mood-label-${authorLower}`);
      const timeEl  = document.getElementById(`mood-time-${authorLower}`);
      const imgWrap = document.getElementById(`mood-box-${authorLower}`);

      if (emojiEl) {
        // Mostra imagem da figurinha no lugar do emoji
        emojiEl.innerHTML = `<img src="${sticker.file}" alt="${sticker.label}" style="width:56px;height:56px;object-fit:contain;">`;
      }
      if (labelEl) labelEl.textContent = sticker.label;
      if (timeEl)  timeEl.textContent  = `às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      if (imgWrap) imgWrap.classList.add('active-mood');

      // Toast
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = `🎭 ${sticker.label} — humor de ${author} salvo!`;
        toast.classList.add('show');
        clearTimeout(toast._mood_timer);
        toast._mood_timer = setTimeout(() => toast.classList.remove('show'), 2500);
      }
    });
  });

  // Restaura exibição no topo para ambos
  ['Pietro', 'Emilly'].forEach(author => {
    const saved = _loadMoodStickerForPerson(author);
    if (!saved) return;
    const authorLower = author.toLowerCase();
    const emojiEl = document.getElementById(`mood-emoji-${authorLower}`);
    const labelEl = document.getElementById(`mood-label-${authorLower}`);
    const timeEl  = document.getElementById(`mood-time-${authorLower}`);
    if (emojiEl) emojiEl.innerHTML = `<img src="${saved.file}" alt="${saved.label}" style="width:56px;height:56px;object-fit:contain;">`;
    if (labelEl) labelEl.textContent = saved.label;
    if (timeEl && saved.savedAt)  timeEl.textContent = `às ${saved.savedAt}`;
  });
}

/* ════════════════════════════════════════════
   INIT PRINCIPAL (seção figurinhas — galeria)
   ════════════════════════════════════════════ */
export function initStickers() {
  const section = document.getElementById('sticker-container');
  if (!section) return;

  // Injeta o HTML interno
  section.innerHTML = _buildSectionHTML();

  // ── Eventos: tabs ──
  section.querySelectorAll('.sticker-tab').forEach(btn => {
    btn.addEventListener('click', () => _setActiveTab(btn.dataset.cat));
  });

  // ── Eventos: busca ──
  const searchInput = section.querySelector('#sticker-search');
  const clearBtn    = section.querySelector('#sticker-search-clear');

  searchInput?.addEventListener('input', e => {
    _handleSearch(e.target.value);
    if (clearBtn) clearBtn.style.display = e.target.value ? 'flex' : 'none';
  });

  clearBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    clearBtn.style.display = 'none';
    _handleSearch('');
    searchInput?.focus();
  });

  // ── Render inicial ──
  _updateFavCount();
  renderStickerGrid();
}
