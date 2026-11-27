/*
 * Pestinha do Nosso-tempo — companheiro virtual local.
 * O cérebro LIF e o modo local são originais. A conversa por IA é opcional;
 * só envia mensagens da sessão atual e memórias relacionadas com autorização.
 */
import { getFirestore, doc, getDoc, setDoc } from '../local-db.js';
import { DIALOGOS } from '../home.js';
import { SEEDED_MEMORIES } from '../memory-of-day.js';
import { SpikingBrain, NEURON_COUNT, SYNAPSE_COUNT } from './neural-brain.js';
import { searchMemories, normalizeMemoryText, selectMemoriesForSpeaker } from './memory-search.js';
import { answerFromKnowledge, getKnowledgeStats } from './knowledge-base.js';
import { answerFromProjectKnowledge } from './project-knowledge.js';
import { handleMusicCommand } from './music-assistant.js';
import { classifyWakeUtterance, VOICE_CONVERSATION_IDLE_MS } from './voice-session.js';

const STORAGE_REF = doc(getFirestore(), 'companion', 'pestinha-v1');
const MAX_MEMORIES = 240;
const MAX_SAVED_MESSAGES = 70;
const SAVE_DELAY = 450;

const DEFAULT_STATE = Object.freeze({
  version: 2,
  name: 'Pestinha',
  activeSpeaker: 'Pietro',
  energy: 78,
  joy: 66,
  bond: 42,
  curiosity: 62,
  interactions: 0,
  learnedTopics: {},
  memories: [],
  messages: [],
  rememberConversation: false,
  speakResponses: true,
  aiEnabled: false,
  aiMemoryConsent: false,
  brainWeights: null,
  brainTrainingEvents: 0,
  brainSeed: null,
  lastNeedsAt: Date.now(),
  importedSources: [],
  createdAt: Date.now(),
});

const TOPIC_RULES = Object.freeze({
  namoro: /namor|pedido|relacionamento|casal|amor|carinho|aniversario|mesversario/,
  filmes: /filme|cinema|serie|s[eé]rie|bridgerton|assistir|epis[oó]dio/,
  musica: /m[uú]sica|can[cç][aã]o|cant|playlist|piano/,
  jogos: /jogo|xadrez|game|videogame|arcade/,
  passeios: /passeio|viagem|sorvete|praia|parque|sa[ií]da/,
  conquistas: /campeonato|taekwondo|treino|conquista|vit[oó]ria/,
  rotina: /rotina|domingo|casa|caf[eé]|dia|conversa/,
});

const STOP_WORDS = new Set([
  'a','o','as','os','um','uma','uns','umas','de','do','da','dos','das','em','no','na','nos','nas',
  'e','ou','mas','que','qual','quais','quem','como','quando','onde','por','para','com','sem','sobre',
  'me','te','se','eu','voce','voces','ele','ela','nos','isso','essa','esse','aquele','aquela','foi',
  'era','ser','estar','tem','tinha','sao','sendo','mais','muito','muita','pouco','pouca','foi','dois',
  'duas','tambem','ja','ainda','nao','sim','aqui','ali','la','pra','pro','porque','pq','ne','ta','to',
]);

let state = { ...DEFAULT_STATE, memories: [], messages: [], learnedTopics: {}, importedSources: [] };
let brain = new SpikingBrain();
let chatMessages = [];
let aiSessionMessageIds = new Set();
let activeReplyController = null;
let saveTimer = null;
let saveQueue = Promise.resolve();
let recognition = null;
let isListening = false;
let wakeRecognition = null;
let wakeListeningEnabled = false;
let wakeStartInFlight = false;
let wakeRestartTimer = null;
let wakeConversationActive = false;
let wakeConversationTimer = null;
let isSpeaking = false;
let lastSpokenText = '';
let speechSequence = 0;
let isOpen = false;
let currentMood = 'curioso';
let lastQuestionSignals = null;
let sessionReady = false;
let petSvgSequence = 0;
let petOffset = { x: 0, y: 0 };
let wanderTimer = null;
let needsTimer = null;
let lastRetrievedMemoryIds = [];
let lastRetrievedMemoryIndex = 0;
let memorySearchQuery = '';
let memoryAuthorFilter = 'todos';
let memorySortMode = 'recentes';

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function classifyTopics(value) {
  const text = normalizeText(value);
  return Object.entries(TOPIC_RULES).filter(([, rule]) => rule.test(text)).map(([topic]) => topic);
}

function defaultWelcome() {
  return {
    role: 'assistant',
    text: 'Oi! Eu sou o Pestinha. 🐾 Posso conversar com vocês e procurar nas lembranças que vocês escolherem guardar aqui. Ainda estou aprendendo; quando eu não souber, vou dizer.',
    time: Date.now(),
    welcome: true,
  };
}

function createBrainSeed() {
  try {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] || 0x51a7e;
  } catch (_) {
    return (Math.floor(Math.random() * 0xffffffff) >>> 0) || 0x51a7e;
  }
}

function applyElapsedNeeds() {
  const now = Date.now();
  const previous = Number(state.lastNeedsAt) || now;
  const hours = Math.max(0, Math.min(24 * 14, (now - previous) / 3600000));
  if (hours > 0) {
    state.energy = Math.max(24, Number(state.energy) - hours * 0.65);
    state.joy = Math.max(30, Number(state.joy) - hours * 0.18);
  }
  state.lastNeedsAt = now;
}

async function loadState() {
  try {
    const snapshot = await getDoc(STORAGE_REF);
    if (snapshot.exists()) {
      const loaded = snapshot.data() || {};
      const compatibleBrain = Number(loaded.version) === 2;
      const seed = compatibleBrain
        ? ((Number(loaded.brainSeed) >>> 0) || createBrainSeed())
        : createBrainSeed();
      state = {
        ...DEFAULT_STATE,
        ...loaded,
        version: 2,
        activeSpeaker: ['Pietro', 'Emilly', 'Pietro e Emilly'].includes(loaded.activeSpeaker) ? loaded.activeSpeaker : 'Pietro',
        // Falar é o comportamento padrão solicitado para o Pestinha; uma
        // preferência explicitamente salva como false continua respeitada.
        speakResponses: loaded.speakResponses === undefined ? true : Boolean(loaded.speakResponses),
        // Cada carregamento exige uma nova ativação antes de enviar mensagens ao serviço externo.
        aiEnabled: false,
        aiMemoryConsent: false,
        rememberConversation: Boolean(loaded.rememberConversation),
        energy: clampNumber(loaded.energy ?? DEFAULT_STATE.energy, 24, 100),
        joy: clampNumber(loaded.joy ?? DEFAULT_STATE.joy, 30, 100),
        bond: clampNumber(loaded.bond ?? DEFAULT_STATE.bond, 0, 100),
        curiosity: clampNumber(loaded.curiosity ?? DEFAULT_STATE.curiosity, 0, 100),
        interactions: Math.max(0, Math.floor(Number(loaded.interactions) || 0)),
        brainSeed: seed,
        memories: Array.isArray(loaded.memories) ? loaded.memories.slice(-MAX_MEMORIES) : [],
        messages: loaded.rememberConversation && Array.isArray(loaded.messages) ? loaded.messages.slice(-MAX_SAVED_MESSAGES) : [],
        learnedTopics: loaded.learnedTopics && typeof loaded.learnedTopics === 'object' && !Array.isArray(loaded.learnedTopics) ? loaded.learnedTopics : {},
        importedSources: Array.isArray(loaded.importedSources) ? loaded.importedSources : [],
        brainTrainingEvents: compatibleBrain ? Math.max(0, Math.floor(Number(loaded.brainTrainingEvents) || 0)) : 0,
      };
      brain = new SpikingBrain(compatibleBrain ? loaded.brainWeights : null, state.brainTrainingEvents, seed);
    } else {
      state.brainSeed = createBrainSeed();
      brain = new SpikingBrain(null, 0, state.brainSeed);
    }
  } catch (error) {
    console.warn('[Pestinha] Não foi possível carregar o estado local:', error);
    state.brainSeed = createBrainSeed();
    brain = new SpikingBrain(null, 0, state.brainSeed);
  }
  applyElapsedNeeds();

  chatMessages = state.rememberConversation && state.messages.length
    ? state.messages.slice(-40)
    : [defaultWelcome()];
  sessionReady = true;
}

function serializableState() {
  return {
    ...state,
    memories: state.memories.slice(-MAX_MEMORIES),
    messages: state.messages.slice(-MAX_SAVED_MESSAGES),
    brainWeights: brain.exportWeights(),
    brainTrainingEvents: brain.getStats().trainingEvents,
    brainSeed: brain.seed,
    updatedAt: Date.now(),
  };
}

function saveStateNow() {
  if (!sessionReady) return Promise.resolve();
  const payload = serializableState();
  saveQueue = saveQueue
    .catch(() => {})
    .then(() => setDoc(STORAGE_REF, payload))
    .catch(error => console.warn('[Pestinha] Falha ao salvar no banco local:', error));
  return saveQueue;
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { saveStateNow(); }, SAVE_DELAY);
}

function setMood(mood, bubbleText = '') {
  currentMood = mood || 'curioso';
  const pet = document.getElementById('nt-companion-pet');
  if (pet) pet.dataset.mood = currentMood;
  const bubble = document.getElementById('nt-companion-bubble');
  if (bubble && bubbleText) {
    clearTimeout(showReplyBubble.timer);
    bubble.classList.remove('is-reply', 'is-thinking');
    bubble.textContent = bubbleText;
    bubble.classList.add('is-visible');
    clearTimeout(setMood.bubbleTimer);
    setMood.bubbleTimer = setTimeout(() => bubble.classList.remove('is-visible'), 3600);
  }
  const launcher = document.getElementById('nt-companion-launcher');
  if (launcher) launcher.dataset.mood = currentMood;
}

function buildSensoryInput({ action = '', text = '', voice = false } = {}) {
  const normalized = normalizeText(text);
  const topics = classifyTopics(normalized);
  const signals = {
    carinho: action === 'carinho' ? 1 : /amor|carinho|abraco|abr[aç]o|fofo|querido/.test(normalized) ? 0.65 : 0,
    brincadeira: action === 'brincar' ? 1 : /brincar|bola|jogar|risada|engracad/.test(normalized) ? 0.55 : 0,
    conversa: action === 'conversa' || Boolean(text) ? 0.8 : 0,
    historia: action === 'historia' || topics.length ? 0.7 : 0,
    elogio: action === 'elogio' ? 1 : /bom|boa|gostei|parabens|obrigad|acertou/.test(normalized) ? 0.55 : 0,
    frustracao: action === 'frustracao' ? 0.7 : /nao gostei|errou|errado|confuso/.test(normalized) ? 0.55 : 0,
    quietude: action === 'quietude' ? 0.5 : 0,
    curiosidade: action === 'curiosidade' || /[?¿]/.test(String(text)) ? 0.8 : 0.25,
    descanso: action === 'descansar' ? 1 : 0,
    voz: voice ? 1 : 0,
  };
  return { signals, topics };
}

function updateLearnedTopics(topics, amount = 1) {
  const next = { ...(state.learnedTopics || {}) };
  for (const topic of topics) next[topic] = Math.max(0, Number(next[topic] || 0) + amount);
  state.learnedTopics = next;
}

function recordInteraction(action, text = '', voice = false) {
  applyElapsedNeeds();
  const { signals, topics } = buildSensoryInput({ action, text, voice });
  lastQuestionSignals = signals;
  // A conversa é uma observação, não um elogio automático. O cérebro só
  // recebe recompensa quando alguém avalia a resposta ou interage com o pet.
  const result = brain.stimulate(signals, { reward: 0, steps: 48 });
  state.interactions++;
  updateLearnedTopics(topics, 0.35);

  let fallbackMood = 'observando';
  let bubble = '';
  if (action === 'carinho') {
    state.bond = Math.min(100, state.bond + 4);
    state.joy = Math.min(100, state.joy + 3);
    fallbackMood = 'feliz';
    bubble = 'Hmmm… carinho! 💗';
  } else if (action === 'brincar') {
    state.joy = Math.min(100, state.joy + 7);
    state.energy = Math.max(10, state.energy - 5);
    fallbackMood = 'brincando';
    bubble = 'Essa foi divertida! 🎾';
  } else if (action === 'descansar') {
    state.energy = Math.min(100, state.energy + 12);
    fallbackMood = 'sonolento';
    bubble = 'Vou descansar um pouquinho. 💤';
  } else if (action === 'conversa') {
    state.bond = Math.min(100, state.bond + 1);
    state.curiosity = Math.min(100, state.curiosity + 2);
    fallbackMood = 'curioso';
    bubble = 'Conta mais… 💭';
  } else if (action === 'historia') {
    state.curiosity = Math.min(100, state.curiosity + 4);
    fallbackMood = 'curioso';
    bubble = 'Uma história nova para guardar! 📖';
  }

  // A saída mais ativa da rede escolhe a expressão do pet; as estatísticas de
  // cuidado continuam explícitas e compreensíveis para quem usa o site.
  const neuralMood = {
    alegria: 'feliz', aproximar: 'feliz', brincar: 'brincando', descansar: 'sonolento',
    escutar: 'escutando', conversar: 'curioso', lembrar: 'curioso', dancar: 'brincando',
    acalmar: 'observando', surpresa: 'surpreso', concentrar: 'pensando', observar: 'observando',
  }[result.output] || fallbackMood;
  setMood(neuralMood, bubble);
  renderStatus();
  scheduleSave();
  return result;
}

function retrieveMemories(question, limit = 3) {
  const selected = selectMemoriesForSpeaker(state.memories, question, state.activeSpeaker);
  return searchMemories(selected, question, limit);
}

function dateLabel(timestamp) {
  if (!timestamp) return '';
  const date = new Date(Number(timestamp));
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function answerFromMemories(question) {
  const q = normalizeText(question);
  const found = retrieveMemories(question, 4);
  if (!found.length || found[0].confidence < 0.14) {
    if (!state.memories.length) {
      return 'Ainda não tenho histórias importadas. Na aba “Memórias”, vocês podem trazer os diálogos da Casinha e as lembranças já registradas no site, ou escrever a primeira história aqui. 💛';
    }
    return 'Procurei no meu caderno, mas não encontrei uma lembrança que responda isso com segurança. Não quero inventar detalhes sobre vocês. Podem me contar essa parte ou guardar a história na aba “Memórias”. 💗';
  }

  const best = found[0].memory;
  lastRetrievedMemoryIds = found.map(item => item.memory.id).filter(Boolean);
  lastRetrievedMemoryIndex = 0;
  const title = best.title || best.sourceLabel || 'uma lembrança';
  const excerpt = String(best.text || best.summary || '').replace(/\s+/g, ' ').trim();
  const asksDate = /quando|data|dia|mes|ano|aniversario|comec|inicio|pedido/.test(q);
  const date = dateLabel(best.ts);
  const dateHint = asksDate
    ? (date ? ` A data registrada nessa lembrança é ${date}.` : ' Essa lembrança não tem uma data específica registrada.')
    : '';
  const authorHint = best.author && best.author !== 'Pietro e Emilly'
    ? ` Ela foi registrada por ${best.author}.`
    : '';
  const prefix = /quem|como|historia|comec|conheci|primeir/.test(q)
    ? 'Encontrei uma parte da história de vocês.'
    : 'Encontrei uma lembrança relacionada à sua pergunta.';
  const other = found.length > 1 && found[1].confidence > 0.18
    ? ` Também encontrei “${found[1].memory.title || found[1].memory.sourceLabel || 'outra lembrança'}”.`
    : '';
  return `${prefix} Em “${title}”, vocês registraram: ${excerpt.slice(0, 380)}${excerpt.length > 380 ? '…' : ''}${dateHint}${authorHint}${other}`;
}

function isPersonalMemoryQuestion(question) {
  const q = normalizeText(question);
  return /\b(nossa historia|nossas memorias|nossas lembrancas|minha historia|meu namoro|minha namorada|meu namorado|nosso namoro|pedido de namoro|primeiro encontro|primeiro passeio|pietro|emilly|o que aconteceu comigo|o que eu contei|o que voce sabe de mim|o que voce lembra|lembra quando|me lembra quando|memoria|lembranca)\b/.test(q);
}

function localUnknownReply(question) {
  const clean = String(question || '').replace(/\s+/g, ' ').trim();
  const short = clean.length > 100 ? `“${clean.slice(0, 96)}…”` : `“${clean}”`;
  return `Entendi o que tu está perguntando: ${short}. No meu modo local ainda não tenho informação suficiente para responder isso com segurança, e prefiro não inventar. Se tu me der um pouco mais de contexto, tento organizar a ideia contigo. Para conversar livremente sobre assuntos gerais, a opção “Respostas naturais com IA” precisa estar ativada e configurada no servidor. 💛`;
}

function responseFor(question) {
  const q = normalizeText(question);
  if (/^(oi|ola|e ai|bom dia|boa tarde|boa noite|oi pestinha)/.test(q)) {
    const who = state.activeSpeaker === 'Pietro e Emilly' ? 'vocês dois' : state.activeSpeaker;
    return `Oiii, ${who}! 🐾 Que bom ter vocês por aqui. Quer conversar sobre alguma lembrança ou me contar uma história nova?`;
  }
  if (/^(quem esta falando|quem sou eu|qual perfil)/.test(q)) {
    return `Agora estou conversando com ${state.activeSpeaker}. Se a outra pessoa pegar o aparelho, é só trocar o perfil ali em cima para eu separar melhor as histórias. 💛`;
  }
  if (/como voce (esta|ta)|tudo bem/.test(q)) {
    return 'Estou bem e curioso! Minha energia é ' + Math.round(state.energy) + '% e já aprendi com ' + state.interactions + ' interações de vocês. Quer brincar ou conversar?';
  }
  if (/^(e depois|e antes|continua|mais sobre isso|me conta mais)/.test(q) && lastRetrievedMemoryIds.length) {
    const direction = q.startsWith('e antes') ? -1 : 1;
    const nextIndex = lastRetrievedMemoryIndex + direction;
    const nextId = lastRetrievedMemoryIds[nextIndex];
    const next = state.memories.find(memory => memory.id === nextId);
    if (next) {
      lastRetrievedMemoryIndex = nextIndex;
      return `Outra lembrança relacionada: “${next.title || next.sourceLabel || 'Lembrança'}”. ${String(next.text || next.summary || '').slice(0, 360)}`;
    }
  }
  if (/quantas memorias|quantas lembrancas|numero de memorias/.test(q)) {
    return `Tenho ${state.memories.length} lembranças no meu caderno. Cada uma foi importada ou guardada com a permissão de vocês. 📚`;
  }
  if (/o que voce sabe|o que lembra|me conta|nossas memorias|nossa historia/.test(q)) {
    const top = [...state.memories].sort((a, b) => (Number(b.ts || b.createdAt || 0) - Number(a.ts || a.createdAt || 0))).slice(0, 3);
    if (!top.length) return answerFromMemories(question);
    const titles = top.map(memory => `“${memory.title || memory.sourceLabel || 'uma lembrança'}”`).join(', ');
    return `Tenho ${state.memories.length} lembranças guardadas. Entre as histórias do meu caderno estão ${titles}. Perguntem por uma delas que eu procuro os detalhes. 📚`;
  }
  const projectAnswer = answerFromProjectKnowledge(question);
  if (projectAnswer) return projectAnswer;
  const generalAnswer = answerFromKnowledge(question);
  if (generalAnswer) return generalAnswer;
  if (isPersonalMemoryQuestion(question)) return answerFromMemories(question);
  return localUnknownReply(question);
}

function createMessage(role, text, options = {}) {
  const message = { role, text: String(text), time: Date.now(), id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...options };
  chatMessages.push(message);
  if (state.aiEnabled && !message.welcome && ['user', 'assistant'].includes(role)) aiSessionMessageIds.add(message.id);
  chatMessages = chatMessages.slice(-60);
  if (state.rememberConversation) {
    state.messages = chatMessages.filter(item => !item.welcome && !item.pending).slice(-MAX_SAVED_MESSAGES);
  }
  renderChat();
  scheduleSave();
  return message;
}

function renderChat() {
  const list = document.getElementById('nt-companion-messages');
  if (!list) return;
  list.replaceChildren();
  for (const message of chatMessages) {
    const item = document.createElement('article');
    item.className = `nt-chat-message is-${message.role}`;
    item.dataset.messageId = message.id;
    if (message.role === 'user' && message.author) {
      const author = document.createElement('small');
      author.className = 'nt-chat-author';
      author.textContent = message.author;
      item.appendChild(author);
    }
    const content = document.createElement('p');
    content.textContent = message.text;
    item.appendChild(content);
    if (message.pending && !message.text) {
      const typing = document.createElement('span');
      typing.className = 'nt-chat-typing';
      typing.textContent = 'Pestinha está pensando';
      typing.setAttribute('aria-label', 'Pestinha está escrevendo uma resposta');
      item.appendChild(typing);
    }
    if (message.role === 'user' && !message.savedMemoryId && message.text.trim().length >= 12) {
      const saveButton = document.createElement('button');
      saveButton.type = 'button';
      saveButton.className = 'nt-chat-save-memory';
      saveButton.dataset.action = 'save-message-memory';
      saveButton.dataset.message = message.id;
      saveButton.textContent = 'Guardar como lembrança';
      item.appendChild(saveButton);
    }
    if (message.role === 'assistant' && !message.welcome && !message.pending && message.questionSignals) {
      const feedback = document.createElement('div');
      feedback.className = 'nt-chat-feedback';
      if (message.feedbackGiven) {
        const note = document.createElement('small');
        note.className = 'nt-feedback-note';
        note.textContent = 'Obrigado pelo feedback. Já ajustei meu aprendizado. 💛';
        feedback.appendChild(note);
      } else {
        feedback.innerHTML = `<span>Minha resposta ajudou?</span><button type="button" data-action="feedback" data-value="good" data-message="${escapeHTML(message.id)}">Sim 💛</button><button type="button" data-action="feedback" data-value="bad" data-message="${escapeHTML(message.id)}">Ainda não</button>`;
      }
      item.appendChild(feedback);
    }
    const time = document.createElement('time');
    time.dateTime = new Date(message.time || Date.now()).toISOString();
    time.textContent = new Date(message.time || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    item.appendChild(time);
    list.appendChild(item);
  }
  list.scrollTop = list.scrollHeight;
}

function renderMemories() {
  const list = document.getElementById('nt-companion-memory-list');
  const count = document.getElementById('nt-companion-memory-count');
  if (!list || !count) return;
  const query = normalizeText(memorySearchQuery);
  const visible = state.memories.filter(memory => {
    const authorOK = memoryAuthorFilter === 'todos' || memory.author === memoryAuthorFilter;
    const haystack = normalizeText(`${memory.title || ''} ${memory.text || memory.summary || ''} ${(memory.tags || []).join(' ')} ${memory.sourceLabel || ''}`);
    return authorOK && (!query || haystack.includes(query));
  });
  visible.sort((a, b) => {
    if (memorySortMode === 'titulo') return String(a.title || '').localeCompare(String(b.title || ''), 'pt-BR');
    const aDate = Number(a.ts || a.createdAt || 0), bDate = Number(b.ts || b.createdAt || 0);
    return memorySortMode === 'antigas' ? aDate - bDate : bDate - aDate;
  });
  count.textContent = `${visible.length} de ${state.memories.length}`;
  list.replaceChildren();
  if (!visible.length) {
    const empty = document.createElement('p');
    empty.className = 'nt-memory-empty';
    empty.textContent = state.memories.length
      ? 'Nenhuma lembrança corresponde a essa busca ou filtro.'
      : 'Ainda não guardamos histórias. Vocês podem importar as memórias do site ou escrever a primeira aqui.';
    list.appendChild(empty);
    return;
  }

  visible.forEach(memory => {
    const card = document.createElement('article');
    card.className = 'nt-memory-card';
    const title = document.createElement('h4');
    title.textContent = memory.title || memory.sourceLabel || 'Lembrança';
    const body = document.createElement('p');
    body.textContent = String(memory.text || memory.summary || '').slice(0, 620);
    const meta = document.createElement('small');
    meta.textContent = [memory.author, memory.sourceLabel, dateLabel(memory.ts || memory.createdAt)].filter(Boolean).join(' · ');
    const actions = document.createElement('div');
    actions.className = 'nt-memory-card-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'nt-memory-edit';
    edit.dataset.action = 'edit-memory';
    edit.dataset.memory = memory.id;
    edit.textContent = 'Editar';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'nt-memory-remove';
    remove.dataset.action = 'remove-memory';
    remove.dataset.memory = memory.id;
    remove.textContent = 'Remover';
    actions.append(edit, remove);
    card.append(title, body, meta, actions);
    list.appendChild(card);
  });
}

function editMemory(id) {
  const memory = state.memories.find(item => item.id === id);
  if (!memory) return;
  const title = window.prompt('Título da lembrança:', memory.title || '');
  if (title === null) return;
  const text = window.prompt('Texto da lembrança:', memory.text || memory.summary || '');
  if (text === null) return;
  const cleanTitle = title.trim().slice(0, 100);
  const cleanText = text.trim().slice(0, 1800);
  if (cleanText.length < 3) {
    createMessage('assistant', 'A lembrança precisa ter pelo menos três caracteres. Não alterei o registro.');
    return;
  }
  const duplicate = state.memories.some(item => item.id !== id &&
    normalizeText(`${item.title || ''} ${item.text || item.summary || ''}`) === normalizeText(`${cleanTitle} ${cleanText}`));
  if (duplicate) {
    createMessage('assistant', 'Já existe uma lembrança com esse mesmo conteúdo. Não salvei uma cópia.');
    return;
  }
  memory.title = cleanTitle || 'Lembrança';
  memory.text = cleanText;
  memory.tags = classifyTopics(`${cleanTitle} ${cleanText}`);
  memory.editedAt = Date.now();
  renderMemories();
  scheduleSave();
  createMessage('assistant', 'Atualizei essa lembrança no caderno. 📖');
}

function exportReadableMemories() {
  const lines = [
    'PESTINHA — CADERNO DE MEMÓRIAS',
    `Exportado em ${new Date().toLocaleString('pt-BR')}`,
    `Total: ${state.memories.length} lembranças`,
    '',
  ];
  for (const [index, memory] of state.memories.entries()) {
    lines.push(`${index + 1}. ${memory.title || memory.sourceLabel || 'Lembrança'}`);
    lines.push(`Autor: ${memory.author || 'Não informado'} | Data: ${dateLabel(memory.ts || memory.createdAt) || 'Não informada'}`);
    lines.push(`Origem: ${memory.sourceLabel || 'Registro local'}`);
    lines.push(String(memory.text || memory.summary || '').trim());
    lines.push('');
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `pestinha-caderno-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  createMessage('assistant', 'Preparei uma versão em texto do caderno, fácil de ler e imprimir. Lembrem-se de que ela contém histórias pessoais.');
}

function clearAllMemories() {
  if (!state.memories.length) {
    createMessage('assistant', 'Meu caderno já está vazio.');
    return;
  }
  if (!window.confirm(`Apagar definitivamente as ${state.memories.length} lembranças guardadas pelo Pestinha neste aparelho? Essa ação não pode ser desfeita sem um backup.`)) return;
  state.memories = [];
  state.importedSources = [];
  lastRetrievedMemoryIds = [];
  lastRetrievedMemoryIndex = 0;
  renderMemories();
  scheduleSave();
  createMessage('assistant', 'O caderno do Pestinha foi esvaziado neste aparelho. Isso não apaga as memórias originais da Casinha, do Love City ou de outras áreas do site.');
}

function renderBrainStats() {
  const stats = brain.getStats();
  const neurons = document.getElementById('nt-companion-neurons');
  const synapses = document.getElementById('nt-companion-synapses');
  const learned = document.getElementById('nt-companion-learned');
  const topics = document.getElementById('nt-companion-topics');
  if (neurons) neurons.textContent = String(stats.neurons);
  if (synapses) synapses.textContent = stats.synapses.toLocaleString('pt-BR');
  if (learned) learned.textContent = String(stats.trainingEvents);
  if (topics) {
    const sorted = Object.entries(state.learnedTopics || {}).filter(([, value]) => value > 0.5).sort((a, b) => b[1] - a[1]).slice(0, 5);
    topics.textContent = sorted.length ? sorted.map(([key]) => key[0].toUpperCase() + key.slice(1)).join(' · ') : 'Ainda estou conhecendo os assuntos de vocês.';
  }
}

function setTab(tab) {
  document.querySelectorAll('#nt-companion-widget [data-companion-tab]').forEach(button => {
    button.classList.toggle('is-active', button.dataset.companionTab === tab);
  });
  document.querySelectorAll('#nt-companion-widget [data-companion-view]').forEach(view => {
    view.hidden = view.dataset.companionView !== tab;
  });
  if (tab === 'memorias') renderMemories();
  if (tab === 'cerebro') renderBrainStats();
}

function openPanel(open = true) {
  isOpen = Boolean(open);
  const panel = document.getElementById('nt-companion-panel');
  if (panel) panel.setAttribute('role', 'dialog');
  const launcher = document.getElementById('nt-companion-launcher');
  if (panel) panel.hidden = !isOpen;
  if (!isOpen) { stopListening(); try { window.speechSynthesis?.cancel(); } catch (_) {} }
  if (launcher) {
    launcher.setAttribute('aria-expanded', String(isOpen));
    launcher.classList.toggle('is-open', isOpen);
  }
  if (isOpen) {
    setTab('conversa');
    renderChat();
    document.getElementById('nt-companion-input')?.focus({ preventScroll: true });
  }
}

function speak(text) {
  if (!('speechSynthesis' in window) || !text) return false;
  const sequence = ++speechSequence;
  window.speechSynthesis.cancel();
  const spoken = String(text).slice(0, 900);
  lastSpokenText = normalizeText(spoken);
  isSpeaking = true;
  const finishSpeaking = () => {
    if (sequence !== speechSequence) return;
    isSpeaking = false;
    lastSpokenText = '';
  };
  const utterance = new SpeechSynthesisUtterance(spoken);
  utterance.lang = 'pt-BR';
  utterance.rate = 0.96;
  utterance.pitch = 1.08;
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = voices.find(voice => /^pt-BR/i.test(voice.lang)) || voices.find(voice => /^pt/i.test(voice.lang)) || null;
  utterance.onend = finishSpeaking;
  utterance.onerror = finishSpeaking;
  window.speechSynthesis.speak(utterance);
  return true;
}

function isLikelySpeechEcho(transcript) {
  if (!isSpeaking || !lastSpokenText) return false;
  const heard = normalizeText(transcript);
  if (heard.length < 14) return false;
  if (lastSpokenText.includes(heard)) return true;
  const heardWords = heard.split(/\s+/).filter(word => word.length > 2);
  if (heardWords.length < 4) return false;
  const spokenWords = new Set(lastSpokenText.split(/\s+/));
  const matches = heardWords.filter(word => spokenWords.has(word)).length;
  return matches / heardWords.length >= 0.88;
}

function stopListening() {
  try { recognition?.stop(); } catch (_) {}
  recognition = null;
  isListening = false;
  const button = document.getElementById('nt-companion-mic');
  if (button) {
    button.classList.remove('is-listening');
    button.setAttribute('aria-label', 'Falar com o Pestinha');
  }
}

function startListening() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    createMessage('assistant', 'Este navegador não oferece reconhecimento de voz. Você ainda pode digitar e usar o botão para ouvir minhas respostas.');
    return;
  }
  if (isListening) { stopListening(); return; }

  recognition = new Recognition();
  recognition.lang = 'pt-BR';
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.onstart = () => {
    isListening = true;
    const button = document.getElementById('nt-companion-mic');
    button?.classList.add('is-listening');
    button?.setAttribute('aria-label', 'Parar de ouvir');
    setMood('escutando', 'Estou ouvindo… 🎙️');
  };
  recognition.onresult = event => {
    const transcript = event.results?.[0]?.[0]?.transcript || '';
    const input = document.getElementById('nt-companion-input');
    if (input) input.value = transcript;
    submitQuestion(transcript, true);
  };
  recognition.onerror = event => {
    if (event.error !== 'no-speech' && event.error !== 'aborted') {
      createMessage('assistant', 'Não consegui captar o áudio desta vez. Podemos tentar de novo ou você pode escrever.');
    }
  };
  recognition.onend = stopListening;
  try { recognition.start(); }
  catch (_) { stopListening(); }
}


function updateWakeButton() {
  const button = document.querySelector('#nt-companion-widget [data-action="toggle-wake-listening"]');
  const status = document.getElementById('nt-companion-wake-status');
  if (button) {
    button.classList.toggle('is-listening', wakeListeningEnabled);
    button.classList.toggle('is-conversation-active', wakeConversationActive);
    button.setAttribute('aria-pressed', String(wakeListeningEnabled));
    button.textContent = wakeListeningEnabled ? '🔴 Desligar chamada por voz' : '🎧 Chamar “Pestinha”';
  }
  if (status) {
    if (!wakeListeningEnabled) status.textContent = 'Chamada por voz desligada. Ative aqui e depois diga “Pestinha” para começar.';
    else if (wakeConversationActive) status.textContent = 'Conversa ativa: pode falar normalmente, sem repetir “Pestinha”. Se ficarmos 45 segundos sem conversar, volto a aguardar a chamada. “Agora não” ou “fica quietinho” desliga o microfone.';
    else status.textContent = 'Estou aguardando “Pestinha”. Depois da chamada, podemos conversar sem repetir o nome em cada frase.';
  }
}

function keepWakeConversationAlive() {
  wakeConversationActive = true;
  if (wakeConversationTimer) window.clearTimeout(wakeConversationTimer);
  wakeConversationTimer = window.setTimeout(() => {
    wakeConversationActive = false;
    wakeConversationTimer = null;
    updateWakeButton();
  }, VOICE_CONVERSATION_IDLE_MS);
  updateWakeButton();
}

function endWakeConversation() {
  wakeConversationActive = false;
  if (wakeConversationTimer) window.clearTimeout(wakeConversationTimer);
  wakeConversationTimer = null;
}

function stopWakeListening({ announce = false } = {}) {
  wakeListeningEnabled = false;
  if (isSpeaking) {
    speechSequence++;
    isSpeaking = false;
    lastSpokenText = '';
    try { window.speechSynthesis?.cancel(); } catch (_) {}
  }
  endWakeConversation();
  if (wakeRestartTimer) window.clearTimeout(wakeRestartTimer);
  wakeRestartTimer = null;
  const current = wakeRecognition;
  wakeRecognition = null;
  try { current?.abort(); } catch (_) {}
  updateWakeButton();
  if (announce) {
    const reply = 'Combinado. Desliguei o microfone e vou ficar quietinho. 🐾';
    createMessage('assistant', reply);
    showReplyBubble(reply);
  }
}

function startWakeRecognition() {
  if (!wakeListeningEnabled) return;
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    stopWakeListening();
    createMessage('assistant', 'Este navegador não oferece reconhecimento de fala. Podes continuar digitando normalmente.');
    return;
  }
  const instance = new Recognition();
  wakeRecognition = instance;
  instance.lang = 'pt-BR';
  instance.continuous = true;
  instance.interimResults = false;
  instance.maxAlternatives = 1;
  instance.onresult = event => {
    for (let index = event.resultIndex; index < event.results.length; index++) {
      const result = event.results[index];
      if (!result.isFinal) continue;
      const transcript = String(result[0]?.transcript || '').trim();
      if (!transcript) continue;
      if (isLikelySpeechEcho(transcript)) continue;
      const turn = classifyWakeUtterance(transcript, wakeConversationActive);
      if (turn.type === 'stop') {
        stopWakeListening({ announce: true });
        return;
      }
      if (turn.type === 'ignore') continue;

      // A primeira chamada abre uma sessão conversacional. As próximas frases
      // são tratadas como turnos normais até 45 s de silêncio, sem repetir o nome.
      keepWakeConversationAlive();
      if (turn.text) {
        submitQuestion(turn.text, true);
      } else if (turn.type === 'wake') {
        const reply = 'Oi! Estou aqui. Pode falar normalmente, não precisa repetir meu nome a cada frase. 🐾';
        createMessage('assistant', reply);
        showReplyBubble(reply);
        if (state.speakResponses) speak(reply);
      }
    }
  };
  instance.onerror = event => {
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      stopWakeListening();
      createMessage('assistant', 'O navegador bloqueou o microfone. Confere a permissão do site e ativa a chamada por voz novamente quando quiser.');
    } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
      stopWakeListening();
      createMessage('assistant', 'A chamada por voz foi interrompida pelo navegador. Podes ativá-la novamente ou digitar.');
    }
  };
  instance.onend = () => {
    if (wakeRecognition === instance) wakeRecognition = null;
    if (wakeListeningEnabled && !document.hidden) {
      wakeRestartTimer = window.setTimeout(startWakeRecognition, 550);
    }
  };
  try {
    instance.start();
  } catch (_) {
    if (wakeRecognition === instance) wakeRecognition = null;
    stopWakeListening();
    createMessage('assistant', 'Não consegui iniciar o reconhecimento de fala. Tenta novamente pelo botão de chamada por voz.');
  }
}

function toggleWakeListening() {
  if (wakeListeningEnabled) {
    stopWakeListening();
    createMessage('assistant', 'Chamada por voz desligada. Não vou captar áudio até tu ativares de novo. 🐾');
    return;
  }
  enableWakeListening();
}

async function enableWakeListening() {
  if (wakeListeningEnabled || wakeStartInFlight) return;
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    showReplyBubble('Para falar comigo, este navegador precisa oferecer reconhecimento de voz. Enquanto isso, podes escrever no painel.');
    return;
  }
  if (!window.isSecureContext) {
    showReplyBubble('A chamada por voz precisa de HTTPS para pedir permissão ao microfone.');
    return;
  }
  wakeStartInFlight = true;
  if (navigator.mediaDevices?.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (_) {
      wakeStartInFlight = false;
      showReplyBubble('Para eu ouvir “Pestinha”, permita o microfone neste site. Depois disso, a escuta inicia sozinha quando você entrar.');
      return;
    }
  }
  wakeListeningEnabled = true;
  wakeStartInFlight = false;
  endWakeConversation();
  updateWakeButton();
  setMood('escutando', 'Estou aguardando a chamada. Depois podemos conversar normalmente, sem repetir meu nome. 🎙️');
  startWakeRecognition();
}

async function autoStartWakeListening() {
  if (wakeListeningEnabled || wakeStartInFlight || document.hidden) return;
  // Não abre um prompt durante o carregamento, pois alguns navegadores
  // deixam a página parecendo travada enquanto o pedido está pendente.
  try {
    if (!navigator.permissions?.query) return;
    const permission = await navigator.permissions.query({ name: 'microphone' });
    if (permission.state === 'granted') enableWakeListening();
  } catch (_) {
    // Se o navegador não expõe o estado, o site continua funcionando sem voz.
  }
}

function showReplyBubble(text, thinking = false) {
  const bubble = document.getElementById('nt-companion-bubble');
  if (!bubble) return;
  bubble.textContent = String(text || '');
  bubble.scrollTop = bubble.scrollHeight;
  bubble.classList.toggle('is-thinking', Boolean(thinking));
  bubble.classList.add('is-visible', 'is-reply');
  clearTimeout(showReplyBubble.timer);
  clearTimeout(setMood.bubbleTimer);
  if (!thinking) showReplyBubble.timer = window.setTimeout(() => {
    bubble.classList.remove('is-visible', 'is-reply', 'is-thinking');
  }, 12000);
}

function updatePendingReply(message, text, pending = false) {
  message.text = String(text || '');
  message.pending = Boolean(pending);
  if (state.rememberConversation) state.messages = chatMessages.filter(item => !item.welcome && !item.pending).slice(-MAX_SAVED_MESSAGES);
  const list = document.getElementById('nt-companion-messages');
  if (!message.pending) {
    renderChat();
  }
  const item = list ? Array.from(list.children).find(node => node.dataset.messageId === message.id) : null;
  if (message.pending && item) {
    let paragraph = item.querySelector('p');
    if (!paragraph) { paragraph = document.createElement('p'); item.appendChild(paragraph); }
    paragraph.textContent = message.text;
    const typing = item.querySelector('.nt-chat-typing');
    if (message.pending && !message.text && !typing) {
      const indicator = document.createElement('span');
      indicator.className = 'nt-chat-typing';
      indicator.textContent = 'Pestinha está pensando';
      item.appendChild(indicator);
    } else if ((!message.pending || message.text) && typing) typing.remove();
    list.scrollTop = list.scrollHeight;
  } else if (!item) renderChat();
  if (message.text) showReplyBubble(message.text, pending);
  scheduleSave();
}

async function requestNaturalReply(messages, memoryContext = [], answerMessage = null, signal = undefined, projectContext = '') {
  const response = await fetch('/api/pestinha/chat', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
    body: JSON.stringify({
      profile: state.activeSpeaker,
      projectContext: String(projectContext || '').slice(0, 4000),
      messages: messages.map(item => ({ role: item.role, content: item.text })).slice(-12),
      memories: memoryContext.map(item => ({
        title: String(item.memory.title || item.memory.sourceLabel || 'Lembrança').slice(0, 100),
        text: String(item.memory.text || item.memory.summary || '').slice(0, 1000),
        author: String(item.memory.author || 'Não informado').slice(0, 60),
        date: dateLabel(item.memory.ts || item.memory.createdAt),
      })),
    }),
  });
  if (!response.ok) {
    let detail = 'Não consegui acessar a IA agora.';
    try { detail = (await response.json()).error || detail; } catch (_) {}
    throw new Error(detail);
  }
  if (!response.body?.getReader) throw new Error('Este navegador não oferece resposta em transmissão.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let answer = '';
  const consume = block => {
    const data = block.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trim()).join('\n');
    if (!data || data === '[DONE]') return;
    let event;
    try { event = JSON.parse(data); } catch (_) { return; }
    if (event.error) throw new Error(event.error);
    if (typeof event.delta === 'string' && event.delta) {
      answer += event.delta;

    }
  };
  let carry = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    carry += decoder.decode(value, { stream: true });
    const blocks = carry.split(/\r?\n\r?\n/);
    carry = blocks.pop() || '';
    for (const block of blocks) {
      const previousLength = answer.length;
      consume(block);
      if (answer.length !== previousLength) {
        if (answerMessage) answerMessage.text = answer;
        const list = document.getElementById('nt-companion-messages');
        const pending = list ? Array.from(list.children).find(node => node.dataset.messageId === answerMessage?.id) : null;
        if (pending) {
          const paragraph = pending.querySelector('p');
          if (paragraph) paragraph.textContent = answer;
          else { const p = document.createElement('p'); p.textContent = answer; pending.appendChild(p); }
          pending.querySelector('.nt-chat-typing')?.remove();
          list.scrollTop = list.scrollHeight;
        }
        showReplyBubble(answer, true);
      }
    }
  }
  carry += decoder.decode();
  if (carry.trim()) consume(carry);
  if (!answer.trim()) throw new Error('A IA não retornou uma resposta. Tente novamente.');
  return answer.trim();
}

async function submitQuestion(rawText, fromVoice = false) {
  const question = String(rawText || '').trim();
  if (!question) return;
  // Uma fala nova interrompe a resposta de voz em andamento; ecos da própria fala
  // já são filtrados no reconhecimento antes de chegar a esta função.
  if (isSpeaking) {
    speechSequence++;
    isSpeaking = false;
    lastSpokenText = '';
    try { window.speechSynthesis?.cancel(); } catch (_) {}
  }
  const signals = buildSensoryInput({ action: 'conversa', text: question, voice: fromVoice }).signals;
  recordInteraction('conversa', question, fromVoice);
  createMessage('user', question, { author: state.activeSpeaker });
  const input = document.getElementById('nt-companion-input');
  if (input) input.value = '';

  try {
    const musicResult = await handleMusicCommand(question);
    if (musicResult?.handled) {
      createMessage('assistant', musicResult.reply, { questionSignals: signals, questionText: question });
      showReplyBubble(musicResult.reply);
      if (state.speakResponses) speak(musicResult.reply);
      renderBrainStats();
      renderStatus();
      return;
    }
  } catch (error) {
    console.warn('[Pestinha] Falha no comando musical:', error);
  }

  if (state.aiEnabled) {
    const answerMessage = createMessage('assistant', '', { questionSignals: signals, questionText: question, pending: true });
    showReplyBubble('Estou pensando…', true);
    const history = chatMessages
      .filter(item => aiSessionMessageIds.has(item.id) && !item.welcome && !item.pending && ['user', 'assistant'].includes(item.role))
      .slice(-12);
    const memories = state.aiMemoryConsent
      ? retrieveMemories(question, 5).filter(item => item.confidence >= 0.12)
      : [];
    const controller = new AbortController();
    activeReplyController = controller;
    try {
      const projectContext = answerFromProjectKnowledge(question) || '';
      const reply = await requestNaturalReply(history, memories, answerMessage, controller.signal, projectContext);
      updatePendingReply(answerMessage, reply, false);
      if (state.speakResponses) speak(reply);
    } catch (error) {
      if (controller.signal.aborted) return;
      const local = responseFor(question);
      const fallback = `Não consegui conectar minha IA natural (${error.message}). Por enquanto, estou respondendo pelo meu modo local: ${local}`;
      updatePendingReply(answerMessage, fallback, false);
      if (state.speakResponses) speak(fallback);
    } finally {
      if (activeReplyController === controller) activeReplyController = null;
    }
  } else {
    const reply = responseFor(question);
    createMessage('assistant', reply, { questionSignals: signals, questionText: question });
    showReplyBubble(reply);
    if (state.speakResponses) speak(reply);
  }
  renderBrainStats();
  renderStatus();
}

function petAction(action) {
  if (action === 'carinho') recordInteraction('carinho');
  else if (action === 'brincar') recordInteraction('brincar');
  else if (action === 'descansar') recordInteraction('descansar');
  if (lastQuestionSignals) brain.reward(lastQuestionSignals, 0.12);
  renderBrainStats();
  renderStatus();
}

function renderStatus() {
  const energy = document.getElementById('nt-companion-energy');
  const bond = document.getElementById('nt-companion-bond');
  const joy = document.getElementById('nt-companion-joy');
  if (energy) energy.style.width = `${Math.round(state.energy)}%`;
  if (bond) bond.style.width = `${Math.round(state.bond)}%`;
  if (joy) joy.style.width = `${Math.round(state.joy)}%`;
  const energyValue = document.getElementById('nt-companion-energy-value');
  const bondValue = document.getElementById('nt-companion-bond-value');
  const joyValue = document.getElementById('nt-companion-joy-value');
  if (energyValue) energyValue.textContent = `${Math.round(state.energy)}%`;
  if (bondValue) bondValue.textContent = `${Math.round(state.bond)}%`;
  if (joyValue) joyValue.textContent = `${Math.round(state.joy)}%`;
}

function memoriesFromSite() {
  const imported = [];

  // Diálogos narrativos já escritos na Casinha. A importação só acontece após
  // a pessoa clicar no botão e confirmar no próprio painel do companheiro.
  for (const [key, lines] of Object.entries(DIALOGOS || {})) {
    if (!Array.isArray(lines) || !lines.length) continue;
    const text = lines.map(line => `${line.quem === 'emilly' ? 'Emilly' : 'Pietro'}: ${line.texto}`).join('\n');
    imported.push({
      id: `dialogo-${key}`,
      title: key.replace(/[_-]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()),
      text,
      source: 'casinha-dialogos',
      sourceLabel: 'Diálogos da Casinha',
      createdAt: Date.now(),
      author: 'Pietro e Emilly',
      tags: classifyTopics(text),
    });
  }

  for (const memory of SEEDED_MEMORIES || []) {
    imported.push({
      id: `memoria-dia-${memory.id}`,
      title: memory.type ? `Memória · ${memory.type}` : 'Memória do Dia',
      text: memory.summary || '',
      source: 'memoria-do-dia',
      sourceLabel: 'Memória do Dia',
      ts: memory.ts || null,
      author: 'Pietro e Emilly',
      tags: classifyTopics(memory.summary || ''),
    });
  }

  try {
    const core = window._loveCity?.getLoveCore?.();
    for (const memory of Array.isArray(core?.memories) ? core.memories : []) {
      imported.push({
        id: `love-city-${memory.id || `${memory.type || 'memoria'}-${memory.ts || imported.length}`}`,
        title: memory.type ? `Love City · ${memory.type}` : 'Lembrança do Love City',
        text: memory.summary || memory.text || '',
        source: 'love-city',
        sourceLabel: 'Love City',
        ts: memory.ts || null,
        author: 'Pietro e Emilly',
        tags: classifyTopics(memory.summary || memory.text || ''),
      });
    }
  } catch (error) {
    console.info('[Pestinha] Love City ainda não disponibilizou as memórias:', error);
  }

  return imported.filter(memory => String(memory.text || '').trim());
}

function importSiteMemories() {
  const known = new Set(state.memories.map(memory => memory.id));
  const knownContent = new Set(state.memories.map(memory => normalizeMemoryText(`${memory.title || ''} ${memory.text || memory.summary || ''}`)));
  const incoming = memoriesFromSite().filter(memory => {
    const fingerprint = normalizeMemoryText(`${memory.title || ''} ${memory.text || memory.summary || ''}`);
    if (known.has(memory.id) || knownContent.has(fingerprint)) return false;
    known.add(memory.id);
    knownContent.add(fingerprint);
    return true;
  });
  if (!incoming.length) {
    createMessage('assistant', 'Não encontrei lembranças novas para importar. As histórias disponíveis já estão aqui ou ainda não foram registradas nas fontes que consigo consultar.');
    return;
  }
  state.memories = [...state.memories, ...incoming].slice(-MAX_MEMORIES);
  state.importedSources = [...new Set([...(state.importedSources || []), 'Casinha', 'Memória do Dia', 'Love City'])];
  recordInteraction('historia', incoming.map(item => item.title).join(' '));
  scheduleSave();
  renderMemories();
  createMessage('assistant', `Prontinho! Importei ${incoming.length} registros da Casinha, da Memória do Dia e do Love City. Agora posso procurar nessas histórias quando vocês me perguntarem. 📚`);
}

function addManualMemory() {
  const titleInput = document.getElementById('nt-companion-story-title');
  const textInput = document.getElementById('nt-companion-story-text');
  const authorInput = document.getElementById('nt-companion-story-author');
  const title = titleInput?.value.trim() || 'Uma lembrança nossa';
  const text = textInput?.value.trim() || '';
  if (text.length < 8) {
    textInput?.focus();
    return;
  }
  const fingerprint = normalizeMemoryText(`${title} ${text}`);
  if (state.memories.some(memory => normalizeMemoryText(`${memory.title || ''} ${memory.text || memory.summary || ''}`) === fingerprint)) {
    createMessage('assistant', 'Essa história já parece estar no meu caderno. Não vou criar uma cópia dela. 📚');
    return;
  }
  if (state.memories.length >= MAX_MEMORIES) {
    createMessage('assistant', `Meu caderno já chegou ao limite de ${MAX_MEMORIES} lembranças. Removam uma antiga antes de guardar outra.`);
    return;
  }
  state.memories.push({
    id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    text,
    source: 'manual',
    sourceLabel: 'Escrita por vocês',
    author: authorInput?.value || 'Pietro e Emilly',
    createdAt: Date.now(),
    tags: classifyTopics(`${title} ${text}`),
  });
  if (titleInput) titleInput.value = '';
  if (textInput) textInput.value = '';
  recordInteraction('historia', `${title} ${text}`);
  renderMemories();
  renderBrainStats();
  scheduleSave();
}

function saveMessageAsMemory(messageId) {
  const message = chatMessages.find(item => item.id === messageId && item.role === 'user');
  if (!message || message.savedMemoryId) return;
  const text = String(message.text || '').trim();
  if (text.length < 12) return;
  if (state.memories.length >= MAX_MEMORIES) {
    createMessage('assistant', `Meu caderno já chegou ao limite de ${MAX_MEMORIES} lembranças. Removam uma antiga antes de guardar outra.`);
    return;
  }
  const title = text.replace(/\s+/g, ' ').slice(0, 64).replace(/[.!?…]+$/, '') || 'Relato da conversa';
  const memoryId = `chat-${message.id}`;
  state.memories.push({
    id: memoryId,
    title,
    text,
    source: 'conversation-opt-in',
    sourceLabel: 'Relato guardado na conversa',
    author: message.author || state.activeSpeaker,
    createdAt: Date.now(),
    tags: classifyTopics(text),
  });
  message.savedMemoryId = memoryId;
  recordInteraction('historia', text);
  renderMemories();
  renderChat();
  renderBrainStats();
  scheduleSave();
  createMessage('assistant', 'Guardei esse relato no meu caderno. Assim posso encontrá-lo quando vocês perguntarem sobre ele. 📖');
}

function removeMemory(id) {
  state.memories = state.memories.filter(memory => memory.id !== id);
  renderMemories();
  scheduleSave();
}

function handleFeedback(button) {
  const id = button.dataset.message;
  const message = chatMessages.find(item => item.id === id);
  if (!message?.questionSignals || message.feedbackGiven) return;
  message.feedbackGiven = true;
  const good = button.dataset.value === 'good';
  brain.reward(message.questionSignals, good ? 0.85 : -0.55);
  state.bond = clampNumber(state.bond + (good ? 1 : 0), 0, 100);
  state.interactions++;
  button.parentElement.querySelectorAll('button').forEach(item => { item.disabled = true; });
  const feedbackText = good ? 'Obrigado por me ensinar! Vou reforçar esse caminho. 💛' : 'Obrigado por avisar. Vou ajustar essa associação e continuar aprendendo.';
  const note = document.createElement('small');
  note.className = 'nt-feedback-note';
  note.textContent = feedbackText;
  button.parentElement.appendChild(note);
  renderBrainStats();
  scheduleSave();
}

function exportCompanionBackup() {
  const payload = {
    format: 'nosso-tempo-companion-backup-v2',
    exportedAt: new Date().toISOString(),
    name: state.name,
    activeSpeaker: state.activeSpeaker,
    memories: state.memories.slice(-MAX_MEMORIES),
    learnedTopics: state.learnedTopics,
    interactions: state.interactions,
    speakResponses: state.speakResponses,
    brainWeights: brain.exportWeights(),
    brainTrainingEvents: brain.getStats().trainingEvents,
    brainSeed: brain.seed,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `pestinha-memorias-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  createMessage('assistant', 'Preparei um backup do meu caderno e do aprendizado neural. O arquivo contém histórias pessoais; guardem-no com cuidado. 💛');
}

async function importCompanionBackup(file) {
  if (!file) return;
  if (file.size > 1_500_000) throw new Error('Esse arquivo é grande demais para um backup do Pestinha.');
  const backup = JSON.parse(await file.text());
  if (!['nosso-tempo-companion-backup-v1', 'nosso-tempo-companion-backup-v2'].includes(backup?.format) || !Array.isArray(backup.memories)) {
    throw new Error('O arquivo não parece ser um backup válido do Pestinha.');
  }
  const imported = backup.memories.slice(-MAX_MEMORIES).map(memory => ({
    id: String(memory?.id || `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`).slice(0, 140),
    title: String(memory?.title || 'Lembrança importada').slice(0, 100),
    text: String(memory?.text || memory?.summary || '').slice(0, 1800),
    source: 'backup-import',
    sourceLabel: String(memory?.sourceLabel || 'Backup importado').slice(0, 80),
    author: String(memory?.author || 'Pietro e Emilly').slice(0, 50),
    createdAt: Number(memory?.createdAt) || Date.now(),
    ts: memory?.ts != null && Number.isFinite(Number(memory.ts)) ? Number(memory.ts) : null,
    tags: Array.isArray(memory?.tags) ? memory.tags.slice(0, 12).map(tag => String(tag).slice(0, 32)) : [],
  })).filter(memory => memory.text.trim().length >= 3);
  const existingIds = new Set(state.memories.map(memory => memory.id));
  const existingContent = new Set(state.memories.map(memory => normalizeMemoryText(`${memory.title} ${memory.text}`)));
  const fresh = [];
  for (const memory of imported) {
    const fingerprint = normalizeMemoryText(`${memory.title} ${memory.text}`);
    if (existingIds.has(memory.id) || existingContent.has(fingerprint)) continue;
    fresh.push(memory);
    existingIds.add(memory.id);
    existingContent.add(fingerprint);
  }
  state.memories = [...state.memories, ...fresh].slice(-MAX_MEMORIES);
  if (backup.learnedTopics && typeof backup.learnedTopics === 'object' && !Array.isArray(backup.learnedTopics)) {
    state.learnedTopics = { ...state.learnedTopics, ...Object.fromEntries(Object.entries(backup.learnedTopics).slice(0, 40).map(([key, value]) => [String(key).slice(0, 40), Math.max(0, Math.min(10000, Number(value) || 0))])) };
  }
  if (backup.format === 'nosso-tempo-companion-backup-v2' && Array.isArray(backup.brainWeights) && backup.brainWeights.length === SYNAPSE_COUNT && backup.brainWeights.every(value => Number.isFinite(Number(value)))) {
    const seed = Number(backup.brainSeed) >>> 0 || createBrainSeed();
    const trainingEvents = Math.max(0, Math.min(1_000_000, Math.floor(Number(backup.brainTrainingEvents) || 0)));
    brain = new SpikingBrain(backup.brainWeights, trainingEvents, seed);
    state.brainSeed = seed;
    state.brainTrainingEvents = trainingEvents;
  }
  state.interactions = Math.max(state.interactions, Math.min(1_000_000, Number(backup.interactions) || 0));
  if (['Pietro', 'Emilly', 'Pietro e Emilly'].includes(backup.activeSpeaker)) {
    state.activeSpeaker = backup.activeSpeaker;
    document.getElementById('nt-companion-memory-search')?.addEventListener('input', event => {
    memorySearchQuery = event.target.value.slice(0, 100);
    renderMemories();
  });
  document.getElementById('nt-companion-memory-filter')?.addEventListener('change', event => {
    memoryAuthorFilter = event.target.value;
    renderMemories();
  });
  document.getElementById('nt-companion-memory-sort')?.addEventListener('change', event => {
    memorySortMode = event.target.value;
    renderMemories();
  });
  const speakerSelect = document.getElementById('nt-companion-speaker');
    if (speakerSelect) speakerSelect.value = state.activeSpeaker;
  }
  renderMemories();
  renderBrainStats();
  scheduleSave();
  createMessage('assistant', `Backup importado. Acrescentei ${fresh.length} lembranças novas; os registros repetidos foram ignorados. 📚`);
}

function createWidget() {
  if (document.getElementById('nt-companion-widget')) return;
  const widget = document.createElement('div');
  widget.id = 'nt-companion-widget';
  widget.innerHTML = `
    <div class="nt-companion-bubble" id="nt-companion-bubble" role="status" aria-live="polite"></div>
    <button class="nt-companion-launcher" id="nt-companion-launcher" type="button" aria-label="Abrir o Pestinha" aria-expanded="false">
      <span class="nt-companion-launcher-pet" aria-hidden="true">${petSVG()}</span>
      <span class="nt-companion-launcher-dot" aria-hidden="true"></span>
    </button>
    <section class="nt-companion-panel" id="nt-companion-panel" aria-label="Pestinha, companheiro virtual" hidden>
      <header class="nt-companion-header">
        <div class="nt-companion-avatar" aria-hidden="true">${petSVG()}</div>
        <div class="nt-companion-heading">
          <strong>Pestinha <span>✦</span></strong>
          <small>companheiro das memórias</small>
          <div class="nt-companion-presence"><i></i> conhecimento local · ${getKnowledgeStats().topics} temas · ${NEURON_COUNT} neurônios</div>
        </div>
        <button class="nt-companion-close" type="button" data-action="close" aria-label="Fechar">×</button>
      </header>
      <nav class="nt-companion-tabs" aria-label="Seções do companheiro">
        <button type="button" data-companion-tab="conversa" class="is-active">💬 Conversa</button>
        <button type="button" data-companion-tab="memorias">📖 Memórias</button>
        <button type="button" data-companion-tab="cerebro">🧠 Cérebro</button>
      </nav>
      <div class="nt-companion-view" data-companion-view="conversa">
        <div class="nt-companion-chat-toolbar">
          <label class="nt-companion-speaker-label">Falando como <select id="nt-companion-speaker"><option value="Pietro">Pietro</option><option value="Emilly">Emilly</option><option value="Pietro e Emilly">Nós dois</option></select></label>
          <label><input type="checkbox" id="nt-companion-speak-enabled"> 🔊 Voz</label>
          <button type="button" data-action="clear-chat">Apagar conversa</button>
          <button type="button" class="nt-companion-wake-toggle" data-action="toggle-wake-listening" aria-pressed="false">🎧 Chamar “Pestinha”</button>
        </div>
        <small class="nt-companion-wake-status" id="nt-companion-wake-status">Chamada por voz desligada. Ative aqui e depois diga “Pestinha” para chamar.</small>
        <div class="nt-companion-ai-controls">
          <label><input type="checkbox" id="nt-companion-ai-enabled"> ✨ Respostas naturais com IA</label>
          <label><input type="checkbox" id="nt-companion-ai-memories"> Usar lembranças selecionadas</label>
          <small id="nt-companion-ai-note">Modo local: tenho conhecimentos básicos de vários assuntos e posso consultar as lembranças autorizadas. Minhas respostas são limitadas, mas não preciso de chave para funcionar.</small>
        </div>
        <div class="nt-companion-messages" id="nt-companion-messages" aria-live="polite" aria-relevant="additions"></div>
        <form class="nt-companion-composer" id="nt-companion-form">
          <label class="nt-sr-only" for="nt-companion-input">Escreva para o Pestinha</label>
          <input id="nt-companion-input" name="message" maxlength="500" placeholder="Converse comigo sobre qualquer assunto…" autocomplete="off">
          <button type="button" id="nt-companion-mic" aria-label="Falar com o Pestinha" title="Falar">🎙️</button>
          <button type="submit" aria-label="Enviar mensagem">➤</button>
        </form>
        <div class="nt-companion-prompts" aria-label="Perguntas sugeridas">
          <button type="button" data-action="quick-question" data-question="Como começou nossa história?">Como tudo começou?</button>
          <button type="button" data-action="quick-question" data-question="O que temos guardado sobre música e piano?">Música e piano</button>
          <button type="button" data-action="quick-question" data-question="O que está registrado sobre taekwondo e campeonatos?">Taekwondo</button>
        </div>
        <p class="nt-companion-privacy-note">A IA usa um serviço externo e pode errar. Não envie senhas, endereços ou dados sensíveis. Peça a um responsável para configurar e revisar a ferramenta. As lembranças só são enviadas com autorização separada.</p>
      </div>
      <div class="nt-companion-view" data-companion-view="memorias" hidden>
        <div class="nt-memory-intro">
          <strong>O caderno de vocês</strong>
          <p>Escolham o que o Pestinha pode guardar. Nada é importado sem vocês pedirem.</p>
          <button class="nt-companion-primary" type="button" data-action="import-memories">Importar histórias já escritas no site</button>
          <small>Inclui diálogos da Casinha, Memória do Dia e registros do Love City. Não importa fotos, mural privado nem conversas do navegador.</small>
        </div>
        <div class="nt-memory-backup">
          <strong>Levar as lembranças para outro aparelho</strong>
          <p>Exporte um arquivo privado e importe-o no outro navegador. O site não sincroniza esses dados automaticamente.</p>
          <div><button type="button" data-action="export-backup">Exportar backup completo</button><button type="button" data-action="export-readable">Exportar histórias em texto</button><button type="button" data-action="pick-backup">Importar backup</button></div>
          <button class="nt-memory-danger" type="button" data-action="clear-memories">Apagar todas as memórias do Pestinha</button>
          <input type="file" id="nt-companion-backup-file" accept="application/json,.json" hidden>
        </div>
        <div class="nt-memory-create">
          <label for="nt-companion-story-title">Título da lembrança</label>
          <input id="nt-companion-story-title" maxlength="80" placeholder="Ex.: Nosso primeiro passeio">
          <label for="nt-companion-story-text">O que aconteceu?</label>
          <textarea id="nt-companion-story-text" maxlength="1800" rows="4" placeholder="Contem a história com as palavras de vocês…"></textarea>
          <label for="nt-companion-story-author">Quem está contando?</label>
          <select id="nt-companion-story-author"><option>Pietro e Emilly</option><option>Pietro</option><option>Emilly</option></select>
          <button class="nt-companion-primary" type="button" data-action="save-memory">Guardar lembrança</button>
        </div>
        <div class="nt-memory-tools">
          <label class="nt-sr-only" for="nt-companion-memory-search">Buscar nas memórias</label>
          <input id="nt-companion-memory-search" type="search" maxlength="100" placeholder="Buscar por palavra, história ou assunto…">
          <label class="nt-sr-only" for="nt-companion-memory-filter">Filtrar por autor</label>
          <select id="nt-companion-memory-filter"><option value="todos">Todos</option><option value="Pietro">Pietro</option><option value="Emilly">Emilly</option><option value="Pietro e Emilly">Nós dois</option></select>
          <label class="nt-sr-only" for="nt-companion-memory-sort">Ordenar memórias</label>
          <select id="nt-companion-memory-sort"><option value="recentes">Mais recentes</option><option value="antigas">Mais antigas</option><option value="titulo">Título (A–Z)</option></select>
        </div>
        <div class="nt-memory-list-heading"><strong>Memórias guardadas</strong><span id="nt-companion-memory-count">0</span></div>
        <div class="nt-companion-memory-list" id="nt-companion-memory-list"></div>
        <div class="nt-memory-consent">
          <label><input type="checkbox" id="nt-companion-remember"> Guardar as próximas mensagens desta conversa neste aparelho</label>
          <small>Desativado por padrão. Isso não envia o conteúdo para a internet. Desmarcar interrompe novos registros; use “Apagar conversa” para excluir o histórico salvo.</small>
        </div>
      </div>
      <div class="nt-companion-view" data-companion-view="cerebro" hidden>
        <div class="nt-brain-card">
          <div class="nt-brain-orbit" aria-hidden="true"><span>🧠</span><i></i><i></i><i></i></div>
          <strong>Rede neural pulsada local</strong>
          <p>Neurônios LIF com conexões recorrentes e pesos que se ajustam com as interações e avaliações de vocês.</p>
        </div>
        <div class="nt-brain-stats">
          <div><strong id="nt-companion-neurons">470</strong><small>neurônios</small></div>
          <div><strong id="nt-companion-synapses">5.640</strong><small>sinapses</small></div>
          <div><strong id="nt-companion-learned">0</strong><small>reforços neurais</small></div>
        </div>
        <div class="nt-brain-topics"><span>Assuntos reconhecidos</span><p id="nt-companion-topics">Ainda estou conhecendo os assuntos de vocês.</p></div>
        <p class="nt-brain-explanation">A rede neural controla tendências de reação. A conversa não é premiada automaticamente: os pesos mudam com avaliações de vocês e interações de cuidado. As respostas em português, por enquanto, são construídas consultando as histórias guardadas; este módulo não é um modelo de linguagem generativo como o ChatGPT.</p>
        <button class="nt-companion-secondary" type="button" data-action="reset-brain">Reiniciar aprendizado neural</button>
      </div>
      <footer class="nt-companion-footer">
        <div class="nt-companion-bars">
          <label>Energia <span id="nt-companion-energy-value">78%</span><i><b id="nt-companion-energy"></b></i></label>
          <label>Alegria <span id="nt-companion-joy-value">66%</span><i><b id="nt-companion-joy"></b></i></label>
          <label>Vínculo <span id="nt-companion-bond-value">42%</span><i><b id="nt-companion-bond"></b></i></label>
        </div>
        <div class="nt-companion-actions">
          <button type="button" data-action="pet">🤗 Carinho</button>
          <button type="button" data-action="play">🎾 Brincar</button>
          <button type="button" data-action="nap">💤 Descansar</button>
        </div>
      </footer>
    </section>`;
  document.body.appendChild(widget);
}

function petSVG() {
  const prefix = `nt-pet-${++petSvgSequence}`;
  return `<svg viewBox="0 0 120 120" class="nt-pet-svg" role="img" aria-label="Pestinha, uma criaturinha virtual rosa e azul">
    <defs>
      <linearGradient id="${prefix}-body" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd9e3"/><stop offset="1" stop-color="#ef82a4"/></linearGradient>
      <linearGradient id="${prefix}-belly" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff8fa"/><stop offset="1" stop-color="#ffe6ee"/></linearGradient>
      <linearGradient id="${prefix}-ear" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8acc2"/><stop offset="1" stop-color="#c9b9fa"/></linearGradient>
    </defs>
    <ellipse cx="60" cy="108" rx="31" ry="6" fill="#7c3654" opacity=".12"/>
    <path d="M26 40 Q12 4 40 20 Q50 25 51 37 M94 40 Q108 4 80 20 Q70 25 69 37" fill="url(#${prefix}-ear)" stroke="#d86e93" stroke-width="2.5"/>
    <path d="M31 49 C24 24 43 12 60 17 C79 10 99 28 91 53 C108 72 93 105 61 105 C28 108 13 78 31 49Z" fill="url(#${prefix}-body)" stroke="#d76d91" stroke-width="2.5"/>
    <path d="M37 31 C30 17 44 7 54 20 C56 7 71 7 74 22 C84 12 94 22 84 35 C70 29 51 29 37 31Z" fill="#a85d82" stroke="#884566" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M44 22 Q48 16 52 23 M63 17 Q69 13 70 22 M80 24 Q85 20 86 27" fill="none" stroke="#f5c3d5" stroke-width="2" stroke-linecap="round" opacity=".85"/>
    <path d="M38 75 C43 65 76 64 83 77 C87 92 72 100 59 99 C43 99 33 89 38 75Z" fill="url(#${prefix}-belly)" opacity=".92"/>
    <ellipse cx="45" cy="57" rx="5.5" ry="7" fill="#493044" class="nt-pet-eye"/><ellipse cx="75" cy="57" rx="5.5" ry="7" fill="#493044" class="nt-pet-eye"/>
    <circle cx="47" cy="54" r="1.8" fill="white"/><circle cx="77" cy="54" r="1.8" fill="white"/>
    <ellipse cx="31" cy="69" rx="7" ry="4" fill="#ed8aa7" opacity=".65"/><ellipse cx="89" cy="69" rx="7" ry="4" fill="#ed8aa7" opacity=".65"/>
    <path d="M54 69 Q60 76 67 69" fill="none" stroke="#9d4d70" stroke-width="2.5" stroke-linecap="round" class="nt-pet-mouth"/>
    <path d="M51 24 Q60 17 69 24" fill="none" stroke="#fff" stroke-width="3" opacity=".65" stroke-linecap="round"/>
    <path d="M87 85 Q99 78 103 89" fill="none" stroke="#e5b4cb" stroke-width="5" stroke-linecap="round"/>
    <path d="M60 83 C55 77 47 84 60 93 C73 84 65 77 60 83Z" fill="#e96f98" opacity=".85"/>
    <path d="M37 96 Q60 108 83 96" fill="none" stroke="#7c9acb" stroke-width="4" stroke-linecap="round" opacity=".85"/>
    <circle cx="60" cy="99" r="3.2" fill="#fff3fb" stroke="#d76d91" stroke-width="1"/>
  </svg>`;
}

function bindEvents() {
  const widget = document.getElementById('nt-companion-widget');
  widget.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;

    if (button.dataset.companionTab) {
      setTab(button.dataset.companionTab);
      return;
    }

    const action = button.dataset.action;
    if (action === 'quick-question') {
      setTab('conversa');
      submitQuestion(button.dataset.question || '');
    }
    else if (action === 'toggle-wake-listening') toggleWakeListening();
    else if (action === 'close') openPanel(false);
    else if (action === 'save-message-memory') saveMessageAsMemory(button.dataset.message);
    else if (action === 'export-backup') exportCompanionBackup();
    else if (action === 'export-readable') exportReadableMemories();
    else if (action === 'clear-memories') clearAllMemories();
    else if (action === 'edit-memory') editMemory(button.dataset.memory);
    else if (action === 'pick-backup') document.getElementById('nt-companion-backup-file')?.click();
    else if (action === 'pet') petAction('carinho');
    else if (action === 'play') petAction('brincar');
    else if (action === 'nap') petAction('descansar');
    else if (action === 'import-memories') {
      if (window.confirm('Importar os diálogos narrativos da Casinha, as memórias do dia e os registros do Love City para o Pestinha?')) importSiteMemories();
    } else if (action === 'save-memory') addManualMemory();
    else if (action === 'remove-memory') {
      const id = button.dataset.memory;
      if (window.confirm('Remover esta lembrança do Pestinha?')) removeMemory(id);
    } else if (action === 'feedback') handleFeedback(button);
    else if (action === 'clear-chat') {
      if (window.confirm('Apagar o histórico de conversa salvo neste aparelho?')) {
        activeReplyController?.abort();
        activeReplyController = null;
        aiSessionMessageIds.clear();
        const bubble = document.getElementById('nt-companion-bubble');
        bubble?.classList.remove('is-visible', 'is-reply', 'is-thinking');
        chatMessages = [defaultWelcome()];
        state.messages = [];
        renderChat();
        scheduleSave();
      }
    } else if (action === 'reset-brain') {
      if (window.confirm('Reiniciar os pesos aprendidos? As histórias e lembranças não serão apagadas.')) {
        state.brainSeed = createBrainSeed();
        brain = new SpikingBrain(null, 0, state.brainSeed);
        state.brainWeights = null;
        state.interactions = 0;
        state.brainTrainingEvents = 0;
        state.learnedTopics = {};
        renderBrainStats();
        scheduleSave();
        createMessage('assistant', 'Reiniciei os pesos do meu cérebro. As lembranças continuam guardadas; vou aprender novas associações a partir de agora.');
      }
    }
  });

  const launcher = document.getElementById('nt-companion-launcher');
  let dragStart = null;
  launcher.addEventListener('pointerdown', event => {
    if (isOpen || event.button !== 0) return;
    dragStart = { x: event.clientX, y: event.clientY, offsetX: petOffset.x, offsetY: petOffset.y, moved: false };
    try { launcher.setPointerCapture(event.pointerId); } catch (_) {}
  });
  launcher.addEventListener('pointermove', event => {
    if (!dragStart) return;
    const dx = event.clientX - dragStart.x;
    const dy = event.clientY - dragStart.y;
    if (Math.abs(dx) + Math.abs(dy) > 7) dragStart.moved = true;
    if (!dragStart.moved) return;
    const rect = launcher.getBoundingClientRect();
    const baseLeft = rect.left - petOffset.x;
    const baseTop = rect.top - petOffset.y;
    const minX = 8 - baseLeft;
    const maxX = window.innerWidth - rect.width - 8 - baseLeft;
    const minY = 8 - baseTop;
    const maxY = window.innerHeight - rect.height - 8 - baseTop;
    const x = clampNumber(dragStart.offsetX + dx, minX, maxX);
    const y = clampNumber(dragStart.offsetY + dy, minY, maxY);
    petOffset = { x, y };
    launcher.classList.add('is-dragging');
    launcher.style.translate = `${x}px ${y}px`;
    event.preventDefault();
  });
  const finishDrag = () => {
    if (dragStart?.moved) {
      launcher.dataset.dragged = 'true';
      window.setTimeout(() => { delete launcher.dataset.dragged; }, 260);
    }
    dragStart = null;
    launcher.classList.remove('is-dragging');
  };
  launcher.addEventListener('pointerup', finishDrag);
  launcher.addEventListener('pointercancel', finishDrag);
  launcher.addEventListener('click', () => {
    if (launcher.dataset.dragged === 'true') return;
    openPanel(!isOpen);
  });
  widget.addEventListener('keydown', event => {
    if (event.key === 'Escape' && isOpen) { event.preventDefault(); openPanel(false); launcher.focus(); }
  });
  document.getElementById('nt-companion-form').addEventListener('submit', event => {
    event.preventDefault();
    submitQuestion(document.getElementById('nt-companion-input')?.value || '');
  });
  document.getElementById('nt-companion-mic').addEventListener('click', startListening);
  document.getElementById('nt-companion-memory-search')?.addEventListener('input', event => {
    memorySearchQuery = event.target.value.slice(0, 100);
    renderMemories();
  });
  document.getElementById('nt-companion-memory-filter')?.addEventListener('change', event => {
    memoryAuthorFilter = event.target.value;
    renderMemories();
  });
  document.getElementById('nt-companion-memory-sort')?.addEventListener('change', event => {
    memorySortMode = event.target.value;
    renderMemories();
  });
  const speakerSelect = document.getElementById('nt-companion-speaker');
  speakerSelect.value = state.activeSpeaker;
  speakerSelect.addEventListener('change', event => {
    state.activeSpeaker = ['Pietro', 'Emilly', 'Pietro e Emilly'].includes(event.target.value) ? event.target.value : 'Pietro';
    const authorSelect = document.getElementById('nt-companion-story-author');
    if (authorSelect && state.activeSpeaker !== 'Pietro e Emilly') authorSelect.value = state.activeSpeaker;
    scheduleSave();
  });
  document.getElementById('nt-companion-backup-file').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (!window.confirm('Importar as lembranças deste arquivo? Elas serão mescladas ao caderno atual.')) return;
      await importCompanionBackup(file);
    } catch (error) {
      createMessage('assistant', error?.message || 'Não consegui importar esse backup.');
    } finally { event.target.value = ''; }
  });
  document.getElementById('nt-companion-remember').addEventListener('change', event => {
    state.rememberConversation = Boolean(event.target.checked);
    if (state.rememberConversation) state.messages = chatMessages.filter(message => !message.welcome && !message.pending).slice(-MAX_SAVED_MESSAGES);
    else state.messages = [];
    scheduleSave();
  });
  document.getElementById('nt-companion-speak-enabled').addEventListener('change', event => {
    state.speakResponses = Boolean(event.target.checked);
    if (!state.speakResponses) {
      try { window.speechSynthesis?.cancel(); } catch (_) {}
    }
    scheduleSave();
  });
  const aiEnabled = document.getElementById('nt-companion-ai-enabled');
  const aiMemories = document.getElementById('nt-companion-ai-memories');
  const aiNote = document.getElementById('nt-companion-ai-note');
  const refreshAIControls = () => {
    if (aiEnabled) aiEnabled.checked = state.aiEnabled;
    if (aiMemories) { aiMemories.checked = state.aiMemoryConsent; aiMemories.disabled = !state.aiEnabled; }
    if (aiNote) aiNote.textContent = state.aiEnabled
      ? (state.aiMemoryConsent
        ? 'IA ativada: mensagens recentes e até cinco lembranças relacionadas podem ser enviadas ao serviço externo. Use somente com autorização do responsável.'
        : 'IA ativada: mensagens recentes vão ao serviço externo; o caderno continua privado. Não envie senhas ou dados sensíveis.')
      : 'Modo local: mensagens e lembranças não são enviadas para uma IA externa.';
  };
  aiEnabled?.addEventListener('change', event => {
    state.aiEnabled = Boolean(event.target.checked);
    aiSessionMessageIds.clear();
    if (!state.aiEnabled) state.aiMemoryConsent = false;
    refreshAIControls();
    scheduleSave();
    if (state.aiEnabled) showReplyBubble('Agora posso tentar conversar com uma IA mais natural. ✨');
  });
  aiMemories?.addEventListener('change', event => {
    state.aiMemoryConsent = Boolean(event.target.checked);
    refreshAIControls();
    scheduleSave();
  });
  refreshAIControls();
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function startNeedsClock() {
  clearInterval(needsTimer);
  needsTimer = window.setInterval(() => {
    const previousEnergy = state.energy;
    const previousJoy = state.joy;
    applyElapsedNeeds();
    if (previousEnergy !== state.energy || previousJoy !== state.joy) {
      renderStatus();
      scheduleSave();
    }
  }, 60_000);
}

function startIdleBehavior() {
  const wander = () => {
    if (document.hidden || isOpen || isListening) return;
    const launcher = document.getElementById('nt-companion-launcher');
    if (!launcher) return;
    const rect = launcher.getBoundingClientRect();
    const baseLeft = rect.left - petOffset.x;
    const baseTop = rect.top - petOffset.y;
    const minX = 8 - baseLeft;
    const maxX = window.innerWidth - rect.width - 8 - baseLeft;
    const minY = 8 - baseTop;
    const maxY = window.innerHeight - rect.height - 8 - baseTop;
    petOffset = {
      x: clampNumber(petOffset.x + (Math.random() * 100 - 50), minX, maxX),
      y: clampNumber(petOffset.y + (Math.random() * 76 - 38), minY, maxY),
    };
    launcher.style.translate = `${petOffset.x}px ${petOffset.y}px`;
    const idleResult = brain.stimulate({
      quietude: 0.22,
      curiosidade: Math.max(0.12, Math.min(0.55, state.curiosity / 180)),
      descanso: state.energy < 32 ? 0.75 : 0,
    }, { reward: 0, steps: 20 });
    if (state.energy < 32 || idleResult.output === 'descansar') setMood('sonolento');
    else if (idleResult.output === 'surpresa' && state.curiosity > 55) setMood('surpreso');
    else if (Math.random() > 0.55 && state.energy > 25) setMood('curioso');
  };
  const scheduleWander = () => {
    clearTimeout(wanderTimer);
    wanderTimer = window.setTimeout(() => {
      wander();
      scheduleWander();
    }, 9000 + Math.random() * 9000);
  };
  scheduleWander();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(wanderTimer);
    else scheduleWander();
  });
  return () => clearTimeout(wanderTimer);
}

export async function initCompanion() {
  if (document.getElementById('nt-companion-widget')) return;
  await loadState();
  createWidget();
  bindEvents();
  renderChat();
  renderMemories();
  renderBrainStats();
  renderStatus();
  startNeedsClock();
  updateWakeButton();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopWakeListening(); stopListening(); }
  });
  window.addEventListener('pagehide', () => { stopWakeListening(); stopListening(); }, { once: true });
  document.getElementById('nt-companion-memory-search')?.addEventListener('input', event => {
    memorySearchQuery = event.target.value.slice(0, 100);
    renderMemories();
  });
  document.getElementById('nt-companion-memory-filter')?.addEventListener('change', event => {
    memoryAuthorFilter = event.target.value;
    renderMemories();
  });
  document.getElementById('nt-companion-memory-sort')?.addEventListener('change', event => {
    memorySortMode = event.target.value;
    renderMemories();
  });
  const speakerSelect = document.getElementById('nt-companion-speaker');
  if (speakerSelect) speakerSelect.value = state.activeSpeaker;
  const authorSelect = document.getElementById('nt-companion-story-author');
  if (authorSelect && state.activeSpeaker !== 'Pietro e Emilly') authorSelect.value = state.activeSpeaker;
  const remember = document.getElementById('nt-companion-remember');
  if (remember) remember.checked = state.rememberConversation;
  const speakEnabled = document.getElementById('nt-companion-speak-enabled');
  if (speakEnabled) speakEnabled.checked = state.speakResponses;
  const aiEnabled = document.getElementById('nt-companion-ai-enabled');
  const aiMemories = document.getElementById('nt-companion-ai-memories');
  if (aiEnabled) aiEnabled.checked = state.aiEnabled;
  if (aiMemories) { aiMemories.checked = state.aiMemoryConsent; aiMemories.disabled = !state.aiEnabled; }
  const aiNote = document.getElementById('nt-companion-ai-note');
  if (aiNote) aiNote.textContent = state.aiEnabled
    ? (state.aiMemoryConsent ? 'IA ativada: mensagens recentes e até cinco lembranças relacionadas podem ser enviadas ao serviço externo. Use somente com autorização do responsável.' : 'IA ativada: mensagens recentes vão ao serviço externo; o caderno continua privado. Não envie senhas ou dados sensíveis.')
    : 'Modo local: mensagens e lembranças não são enviadas para uma IA externa.';
  setMood('curioso', 'Oi! Sou o Pestinha. 🐾');
  startIdleBehavior();
  // Com permissão previamente concedida, começa sem abrir o painel nem clicar.
  // Sem permissão, não abre prompt no carregamento e não bloqueia o site.
  window.setTimeout(autoStartWakeListening, 900);
  console.info(`[Pestinha] ativo: ${NEURON_COUNT} neurônios, ${SYNAPSE_COUNT} conexões esparsas; IA natural opcional pelo backend`);
}
