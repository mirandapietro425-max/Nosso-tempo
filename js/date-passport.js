import { doc, getDoc, setDoc } from './local-db.js';

const PASSPORT_DOCUMENT = 'date_passport';
const MAX_ENTRIES = 160;

const DATE_IDEAS = [
  {
    id: 'cinema-de-cobertor',
    title: 'Cinema de cobertor',
    description: 'Escolham um filme que nenhum dos dois viu, preparem uma coisa gostosa e deixem o celular de lado.',
    category: 'home',
    categoryLabel: 'Em casa',
    duration: 'Uma noite',
    cost: 'Baixo custo',
  },
  {
    id: 'passeio-sem-roteiro',
    title: 'Passeio sem roteiro',
    description: 'Escolham uma rua ou bairro e caminhem até encontrar um lugar que dê vontade de conhecer.',
    category: 'outside',
    categoryLabel: 'Lá fora',
    duration: '1–2 horas',
    cost: 'Grátis',
  },
  {
    id: 'jantar-de-uma-cor',
    title: 'Jantar de uma cor',
    description: 'Montem juntos um jantar em que cada prato tenha uma cor escolhida por vocês.',
    category: 'home',
    categoryLabel: 'Em casa',
    duration: 'Até 1 hora',
    cost: 'Baixo custo',
  },
  {
    id: 'por-do-sol-e-playlist',
    title: 'Pôr do sol e playlist',
    description: 'Cada um escolhe três músicas. Depois, é só encontrar um cantinho tranquilo e ouvir juntos.',
    category: 'outside',
    categoryLabel: 'Lá fora',
    duration: 'Uma hora',
    cost: 'Grátis',
  },
  {
    id: 'doce-feito-a-dois',
    title: 'Um doce feito a dois',
    description: 'Escolham uma receita simples, dividam as tarefas e não se preocupem se ficar meio torto.',
    category: 'home',
    categoryLabel: 'Em casa',
    duration: 'Até 1 hora',
    cost: 'Baixo custo',
  },
  {
    id: 'caminhada-de-fotos',
    title: 'Caça a três detalhes',
    description: 'Saiam para fotografar três coisas bonitas que normalmente passariam despercebidas.',
    category: 'outside',
    categoryLabel: 'Lá fora',
    duration: 'Uma hora',
    cost: 'Grátis',
  },
];

const IDEA_BY_ID = new Map(DATE_IDEAS.map(idea => [idea.id, idea]));

function makeId() {
  return globalThis.crypto?.randomUUID?.()
    || `encontro-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function localDateValue() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return 'Data não informada';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 'Data não informada';
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function normalizeEntries(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(entry => entry && IDEA_BY_ID.has(entry.ideaId) && ['saved', 'done'].includes(entry.status))
    .slice(0, MAX_ENTRIES)
    .map(entry => ({
      id: String(entry.id || makeId()).slice(0, 90),
      ideaId: entry.ideaId,
      status: entry.status,
      date: /^\d{4}-\d{2}-\d{2}$/.test(String(entry.date || '')) ? entry.date : '',
      memory: String(entry.memory || '').slice(0, 280),
      createdAt: Number(entry.createdAt) || Date.now(),
    }));
}

function makeButton(label, action, ideaId, className = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.dataset.passportAction = action;
  if (ideaId) button.dataset.ideaId = ideaId;
  button.textContent = label;
  return button;
}

function makeEmptyState(title, message) {
  const wrapper = document.createElement('div');
  wrapper.className = 'passport-empty-state';
  const heading = document.createElement('strong');
  heading.textContent = title;
  const text = document.createElement('p');
  text.textContent = message;
  wrapper.append(heading, text);
  return wrapper;
}

export function initDatePassport(db) {
  const root = document.getElementById('sec-encontros');
  if (!root || !db) return;

  const reference = doc(db, PASSPORT_DOCUMENT, 'shared');
  const ideasContainer = root.querySelector('#passport-ideas');
  const savedContainer = root.querySelector('#passport-saved-list');
  const completedContainer = root.querySelector('#passport-completed-list');
  const form = root.querySelector('#passport-note-form');
  const dateInput = root.querySelector('#passport-date');
  const memoryInput = root.querySelector('#passport-memory');
  const formIdea = root.querySelector('#passport-form-idea');
  const feedback = root.querySelector('#passport-feedback');
  const savedCount = root.querySelector('#passport-saved-count');
  const completedCount = root.querySelector('#passport-completed-count');
  const savedTotal = root.querySelector('#passport-saved-total');
  const completedTotal = root.querySelector('#passport-completed-total');

  if (!ideasContainer || !savedContainer || !completedContainer || !form) return;

  let entries = [];
  let activeFilter = 'all';
  let selectedIdeaId = null;
  let draftIdeaId = null;

  function announce(message) {
    if (feedback) feedback.textContent = message;
  }

  function renderIdea(idea) {
    const isSaved = entries.some(entry => entry.ideaId === idea.id && entry.status === 'saved');
    const card = document.createElement('article');
    card.className = `passport-idea-card${selectedIdeaId === idea.id ? ' is-selected' : ''}`;
    card.dataset.ideaCard = idea.id;

    const top = document.createElement('div');
    top.className = 'passport-idea-top';
    const category = document.createElement('span');
    category.className = 'passport-category';
    category.textContent = idea.categoryLabel;
    const mark = document.createElement('span');
    mark.className = 'passport-idea-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = selectedIdeaId === idea.id ? '✦' : '♡';
    top.append(category, mark);

    const title = document.createElement('h3');
    title.textContent = idea.title;
    const description = document.createElement('p');
    description.className = 'passport-idea-description';
    description.textContent = idea.description;

    const details = document.createElement('div');
    details.className = 'passport-idea-details';
    for (const label of [idea.duration, idea.cost]) {
      const chip = document.createElement('span');
      chip.textContent = label;
      details.append(chip);
    }

    const actions = document.createElement('div');
    actions.className = 'passport-idea-actions';
    const save = makeButton(isSaved ? 'Já está guardada' : 'Guardar ideia', 'save', idea.id, 'passport-button passport-button-soft');
    save.disabled = isSaved;
    const complete = makeButton('Viver e registrar', 'complete', idea.id, 'passport-button passport-button-primary');
    actions.append(save, complete);
    card.append(top, title, description, details, actions);
    return card;
  }

  function renderEntry(entry, completed = false) {
    const idea = IDEA_BY_ID.get(entry.ideaId);
    if (!idea) return null;

    const card = document.createElement('article');
    card.className = `passport-entry${completed ? ' is-completed' : ''}`;
    const textBlock = document.createElement('div');
    const title = document.createElement('h4');
    title.textContent = idea.title;
    const meta = document.createElement('p');
    meta.className = 'passport-entry-meta';
    meta.textContent = completed ? formatDate(entry.date) : 'Quando der vontade, esse encontro está esperando.';
    textBlock.append(title, meta);
    if (completed && entry.memory) {
      const memory = document.createElement('p');
      memory.className = 'passport-entry-memory';
      memory.textContent = entry.memory;
      textBlock.append(memory);
    }
    card.append(textBlock);
    if (!completed) {
      const record = makeButton('Registrar', 'complete', idea.id, 'passport-button passport-button-primary passport-entry-action');
      const remove = makeButton('×', 'remove', entry.id, 'passport-entry-remove');
      remove.setAttribute('aria-label', `Remover ${idea.title} das ideias guardadas`);
      card.append(record, remove);
    } else {
      const stamp = document.createElement('span');
      stamp.className = 'passport-entry-stamp';
      stamp.setAttribute('aria-label', 'Encontro registrado');
      stamp.textContent = 'Vivido';
      card.append(stamp);
    }
    return card;
  }

  function renderList(container, list, completed, emptyTitle, emptyMessage) {
    container.replaceChildren();
    if (!list.length) {
      container.append(makeEmptyState(emptyTitle, emptyMessage));
      return;
    }
    for (const entry of list) {
      const card = renderEntry(entry, completed);
      if (card) container.append(card);
    }
  }

  function render() {
    const filteredIdeas = DATE_IDEAS.filter(idea => activeFilter === 'all' || idea.category === activeFilter);
    ideasContainer.replaceChildren(...filteredIdeas.map(renderIdea));

    const saved = entries.filter(entry => entry.status === 'saved');
    const completed = entries
      .filter(entry => entry.status === 'done')
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    for (const element of [savedCount, savedTotal]) if (element) element.textContent = String(saved.length);
    for (const element of [completedCount, completedTotal]) if (element) element.textContent = String(completed.length);

    renderList(savedContainer, saved, false, 'Seu passaporte começa aqui', 'Guarde uma ideia que combine com o próximo tempo livre de vocês.');
    renderList(completedContainer, completed.slice(0, 6), true, 'Ainda tem páginas em branco', 'Quando um encontro virar lembrança, ele aparece aqui.');

    root.querySelectorAll('[data-passport-filter]').forEach(button => {
      const selected = button.dataset.passportFilter === activeFilter;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  async function persist(message) {
    try {
      await setDoc(reference, { entries });
      render();
      if (message) announce(message);
    } catch (error) {
      console.error('[Passaporte dos Encontros]', error);
      announce('Não foi possível salvar agora. Tentem novamente.');
    }
  }

  function openForm(ideaId) {
    const idea = IDEA_BY_ID.get(ideaId);
    if (!idea) return;
    draftIdeaId = ideaId;
    formIdea.textContent = idea.title;
    dateInput.value = localDateValue();
    memoryInput.value = '';
    form.hidden = false;
    memoryInput.focus();
  }

  root.addEventListener('click', async event => {
    const filterButton = event.target.closest('[data-passport-filter]');
    if (filterButton) {
      activeFilter = filterButton.dataset.passportFilter;
      render();
      return;
    }

    const button = event.target.closest('[data-passport-action]');
    if (!button || !root.contains(button)) return;

    const { passportAction: action, ideaId } = button.dataset;
    if (action === 'surprise') {
      const options = DATE_IDEAS.filter(idea => activeFilter === 'all' || idea.category === activeFilter);
      const alternatives = options.filter(idea => idea.id !== selectedIdeaId);
      const pool = alternatives.length ? alternatives : options;
      selectedIdeaId = pool[Math.floor(Math.random() * pool.length)]?.id || null;
      render();
      root.querySelector(`[data-idea-card="${selectedIdeaId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      announce('Ideia sorteada — quem sabe vira a próxima lembrança?');
      return;
    }

    if (action === 'save') {
      if (entries.some(entry => entry.ideaId === ideaId && entry.status === 'saved')) {
        announce('Essa ideia já está no passaporte.');
        return;
      }
      entries.unshift({ id: makeId(), ideaId, status: 'saved', date: '', memory: '', createdAt: Date.now() });
      await persist('Ideia guardada neste aparelho.');
      return;
    }

    if (action === 'complete') {
      openForm(ideaId);
      return;
    }

    if (action === 'close-form') {
      form.hidden = true;
      draftIdeaId = null;
      return;
    }

    if (action === 'remove') {
      const entry = entries.find(item => item.id === ideaId && item.status === 'saved');
      if (!entry) return;
      entries = entries.filter(item => item.id !== entry.id);
      await persist('Ideia removida do passaporte.');
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!draftIdeaId || !IDEA_BY_ID.has(draftIdeaId)) return;

    const saved = entries.find(entry => entry.ideaId === draftIdeaId && entry.status === 'saved');
    const completedEntry = {
      ...(saved || {}),
      id: saved?.id || makeId(),
      ideaId: draftIdeaId,
      status: 'done',
      date: dateInput.value || localDateValue(),
      memory: memoryInput.value.trim().slice(0, 280),
      createdAt: Date.now(),
    };
    entries = [completedEntry, ...entries.filter(entry => entry.id !== completedEntry.id)].slice(0, MAX_ENTRIES);
    form.hidden = true;
    draftIdeaId = null;
    await persist('Encontro registrado. Essa página já é de vocês.');
  });

  render();
  getDoc(reference)
    .then(snapshot => {
      if (snapshot.exists()) entries = normalizeEntries(snapshot.data()?.entries);
      render();
    })
    .catch(error => {
      console.error('[Passaporte dos Encontros]', error);
      announce('O passaporte ainda não carregou. Atualizem a página para tentar novamente.');
    });
}
