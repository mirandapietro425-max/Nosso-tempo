/* ═══════════════════════════════════════════════
   PIETRO & EMILLY — app.js
   Módulo principal: orquestra todos os módulos
   ═══════════════════════════════════════════════ */

// ── Firebase SDK ──
import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Config ──
import {
  FIREBASE_CONFIG, CLOUDINARY_CLOUD, CLOUDINARY_PRESET, IMGBB_KEY,
  TMDB_KEY, SENHA_MURAL, GALLERY_SLOTS, LS_DAILY_POPUP, LS_GMAPS_KEY,
  PLAYLIST, RECADINHOS, MOOD_OPTIONS, DISNEY_EMILLY, DISNEY_PIETRO, EVENTOS,
  START_DATE, ANNIVERSARY_DAY, BDAY_MONTH, BDAY_DAY, EMILLY_BDAY_MONTH, EMILLY_BDAY_DAY,
} from './config.js';

// ── UI utilities ──
import {
  showToast, initGreeting, initCounter, initAnniversary,
  initSurprise, initDaily, openDailyPopup, closeDailyPopup,
  initParticles, initTimeline,
} from './ui.js';

// ── Music ──
import {
  loadYTApi, renderPlaylist, renderMiniPlayerList,
  playTrack, playNext, playPrev, togglePlayPause, playCustomYT,
  toggleMiniPlayer, initMiniPlayerClickOutside, exposeGlobals as exposeMusicGlobals,
} from './music.js';

/* ════════════════════════════════════════════
   FIREBASE INIT
   ════════════════════════════════════════════ */
const app = initializeApp(FIREBASE_CONFIG);
const db  = getFirestore(app);

/* ── Document refs ── */
const GALLERY_DOC      = doc(db, 'gallery',       'shared');
const MOVIES_DOC       = doc(db, 'movies',        'shared');
const DREAMS_DOC       = doc(db, 'dreams',        'shared');
const MURAL_DOC        = doc(db, 'mural',         'shared');
const MOOD_DOC         = doc(db, 'mood',          'shared');
const LOC_DOC          = doc(db, 'location',      'shared');
const SPECIAL_BDAY_DOC = doc(db, 'special_bday',  'shared');
const SPECIAL_MESV_DOC = doc(db, 'special_mesv',  'shared');

/* ════════════════════════════════════════════
   UI INIT
   ════════════════════════════════════════════ */
initGreeting();
initCounter();
initAnniversary();
initSurprise();
initDaily();
initParticles();
initTimeline();

/* ════════════════════════════════════════════
   MUSIC
   ════════════════════════════════════════════ */
loadYTApi();
renderPlaylist();
renderMiniPlayerList();
exposeMusicGlobals();
initMiniPlayerClickOutside();

/* ════════════════════════════════════════════
   GALERIA
   ════════════════════════════════════════════ */
let uploadSlot = null;

async function getPhotos() {
  try {
    const snap = await getDoc(GALLERY_DOC);
    if (snap.exists()) return snap.data().photos || Array(GALLERY_SLOTS).fill(null);
  } catch (e) {}
  return Array(GALLERY_SLOTS).fill(null);
}

async function setPhotos(p) { await setDoc(GALLERY_DOC, { photos: p }); }

async function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  grid.innerHTML = '<div style="text-align:center;padding:2rem;color:#b06070;">⏳ Carregando fotos...</div>';
  const photos = await getPhotos();
  grid.innerHTML = '';

  const banner = document.getElementById('setup-banner');
  if (banner) banner.style.display = 'none';

  for (let i = 0; i < GALLERY_SLOTS; i++) {
    const url  = photos[i];
    const slot = document.createElement('div');
    slot.className = 'gallery-slot';

    if (url) {
      slot.innerHTML = `
        <img src="${url}" alt="Memória ${i+1}" loading="lazy">
        <div class="slot-overlay">
          <button class="slot-btn" onclick="startUpload(${i},event)">🔄 Trocar</button>
          <button class="slot-btn del" onclick="deletePhoto(${i},event)">🗑 Remover</button>
        </div>`;
    } else {
      slot.innerHTML = `
        <div class="slot-empty-icon">📷</div>
        <div class="slot-empty-text">Adicionar foto</div>
        <div class="slot-overlay">
          <button class="slot-btn" onclick="startUpload(${i},event)">📷 Adicionar</button>
        </div>`;
      slot.addEventListener('click', () => startUpload(i));
    }
    grid.appendChild(slot);
  }
}

function startUpload(i, e) {
  if (e) e.stopPropagation();
  uploadSlot = i;
  document.getElementById('file-input')?.click();
}

async function deletePhoto(i, e) {
  if (e) e.stopPropagation();
  if (!confirm('Remover esta foto?')) return;
  const p = await getPhotos();
  p[i] = null;
  await setPhotos(p);
  renderGallery();
  showToast('🗑 Foto removida!');
}

document.getElementById('file-input')?.addEventListener('change', async function () {
  const file = this.files[0];
  if (!file || uploadSlot === null) return;
  this.value = '';

  const slots  = document.querySelectorAll('.gallery-slot');
  const slot   = slots[uploadSlot];
  if (slot) slot.innerHTML = '<div class="upload-spinner">⏳</div>';

  try {
    const form = new FormData();
    form.append('image', file);
    form.append('key', IMGBB_KEY);
    const res  = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: form });
    const data = await res.json();

    if (data.success) {
      const p = await getPhotos();
      p[uploadSlot] = data.data.url;
      await setPhotos(p);
      showToast('📸 Foto salva!');
    } else {
      showToast('❌ Erro no upload da foto.', 4000);
    }
  } catch (err) {
    showToast('❌ Erro de rede.', 3000);
  }

  uploadSlot = null;
  renderGallery();
});

window.startUpload  = startUpload;
window.deletePhoto  = deletePhoto;
renderGallery();

/* ════════════════════════════════════════════
   FILMES
   ════════════════════════════════════════════ */
const INITIAL_MOVIES = [
  { name: "La La Land",                watched: false },
  { name: "Diário de uma Paixão",      watched: false },
  { name: "Como Eu Era Antes de Você", watched: false },
];

async function getMovies() {
  try {
    const snap = await getDoc(MOVIES_DOC);
    if (snap.exists()) return snap.data().movies || INITIAL_MOVIES;
  } catch (e) {}
  return INITIAL_MOVIES;
}

async function saveMovies(m) { await setDoc(MOVIES_DOC, { movies: m }); }

async function renderMovies() {
  const list   = document.getElementById('movies-list');
  if (!list) return;
  const movies = await getMovies();
  list.innerHTML = '';

  if (movies.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:#c9a9b0;font-style:italic;">Nenhum filme ainda... Adicione o primeiro! 🎬</p>';
    return;
  }

  movies.forEach((m, i) => {
    const item = document.createElement('div');
    item.className = 'movie-item' + (m.watched ? ' watched' : '');
    item.innerHTML = `
      <div class="movie-icon">${m.watched ? '✅' : '🎬'}</div>
      <div class="movie-name" onclick="openMovieModal(${i})">${m.name}</div>
      <button class="movie-check" onclick="toggleMovie(${i})">${m.watched ? '✓' : ''}</button>
      <button class="movie-del" onclick="deleteMovie(${i})">✕</button>`;
    list.appendChild(item);
  });
}

async function addMovie() {
  const input = document.getElementById('movie-input');
  const name  = input?.value.trim();
  if (!name) { showToast('✏️ Escreve o nome do filme!'); return; }
  const movies = await getMovies();
  movies.push({ name, watched: false, comments: [] });
  await saveMovies(movies);
  if (input) input.value = '';
  renderMovies();
  showToast('🎬 Filme adicionado!');
}

async function toggleMovie(i) {
  const movies = await getMovies();
  movies[i].watched = !movies[i].watched;
  await saveMovies(movies);
  renderMovies();
  if (movies[i].watched) showToast('✅ Assistido! 🥰');
}

async function deleteMovie(i) {
  if (!confirm('Remover este filme?')) return;
  const movies = await getMovies();
  movies.splice(i, 1);
  await saveMovies(movies);
  renderMovies();
}

// ── Movie Modal ──
let movieModalIndex  = null;
let movieModalAuthor = 'Pietro';

async function openMovieModal(i) {
  movieModalIndex = i;
  const movies = await getMovies();
  const m = movies[i];
  document.getElementById('movie-modal-title').textContent = m.name;
  document.getElementById('movie-modal-trailer').innerHTML = '<p style="text-align:center;color:#c9a9b0;font-size:0.85rem;">⏳ Buscando trailer...</p>';
  document.getElementById('movie-modal-poster-area').innerHTML = '<div class="movie-modal-poster-placeholder">🎬</div>';
  document.getElementById('movie-modal-overlay').classList.add('show');
  renderMovieComments(m.comments || []);

  try {
    const search  = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(m.name)}&language=pt-BR`);
    const sData   = await search.json();
    const movie   = sData.results?.[0];

    if (movie) {
      if (movie.poster_path) {
        document.getElementById('movie-modal-poster-area').innerHTML =
          `<img class="movie-modal-poster" src="https://image.tmdb.org/t/p/w780${movie.poster_path}" alt="${m.name}">`;
      }
      const videos  = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${TMDB_KEY}&language=pt-BR`);
      const vData   = await videos.json();
      let trailer   = vData.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');

      if (!trailer) {
        const vEn     = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${TMDB_KEY}`);
        const vEnData = await vEn.json();
        trailer       = vEnData.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
      }

      document.getElementById('movie-modal-trailer').innerHTML = trailer
        ? `<iframe width="100%" height="220" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen style="border-radius:16px;display:block;"></iframe>`
        : '<p style="text-align:center;color:#c9a9b0;font-size:0.85rem;font-style:italic;">Trailer não encontrado 😕</p>';
    } else {
      document.getElementById('movie-modal-trailer').innerHTML =
        '<p style="text-align:center;color:#c9a9b0;font-size:0.85rem;font-style:italic;">Filme não encontrado 😕</p>';
    }
  } catch (e) {
    document.getElementById('movie-modal-trailer').innerHTML =
      '<p style="text-align:center;color:#c9a9b0;font-size:0.85rem;font-style:italic;">Erro ao buscar trailer 😕</p>';
  }
}

function closeMovieModal() {
  document.getElementById('movie-modal-overlay').classList.remove('show');
  document.getElementById('movie-modal-trailer').innerHTML = '';
  movieModalIndex = null;
}

function selectMovieAuthor(name) {
  movieModalAuthor = name;
  document.getElementById('movie-btn-pietro')?.classList.toggle('active', name === 'Pietro');
  document.getElementById('movie-btn-emilly')?.classList.toggle('active', name === 'Emilly');
}

function renderMovieComments(comments) {
  const list = document.getElementById('movie-modal-comments');
  if (!list) return;
  if (!comments?.length) {
    list.innerHTML = '<p style="text-align:center;color:#c9a9b0;font-size:0.85rem;font-style:italic;">Nenhum comentário ainda 💬</p>';
    return;
  }
  list.innerHTML = '';
  comments.forEach((c, i) => {
    const div = document.createElement('div');
    div.className = 'movie-modal-comment ' + c.author.toLowerCase();
    div.innerHTML = `
      <button class="movie-modal-comment-del" onclick="deleteMovieComment(${i})">✕</button>
      <div class="movie-modal-comment-author">${c.author} ${c.author === 'Pietro' ? '💙' : '💗'}</div>
      <div class="movie-modal-comment-text">${c.text}</div>`;
    list.appendChild(div);
  });
}

async function addMovieComment() {
  const input = document.getElementById('movie-modal-comment-input');
  const text  = input?.value.trim();
  if (!text || movieModalIndex === null) return;
  const movies = await getMovies();
  if (!movies[movieModalIndex].comments) movies[movieModalIndex].comments = [];
  movies[movieModalIndex].comments.push({ author: movieModalAuthor, text });
  await saveMovies(movies);
  if (input) input.value = '';
  renderMovieComments(movies[movieModalIndex].comments);
  showToast('💬 Comentário adicionado!');
}

async function deleteMovieComment(i) {
  const movies = await getMovies();
  movies[movieModalIndex].comments.splice(i, 1);
  await saveMovies(movies);
  renderMovieComments(movies[movieModalIndex].comments);
}

window.addMovie          = addMovie;
window.toggleMovie       = toggleMovie;
window.deleteMovie       = deleteMovie;
window.openMovieModal    = openMovieModal;
window.closeMovieModal   = closeMovieModal;
window.selectMovieAuthor = selectMovieAuthor;
window.addMovieComment   = addMovieComment;
window.deleteMovieComment = deleteMovieComment;
renderMovies();

/* ════════════════════════════════════════════
   SENHA MURAL
   ════════════════════════════════════════════ */
let muralDesbloqueado = false;

function abrirSenhaMural() {
  document.getElementById('senha-overlay').classList.add('show');
  setTimeout(() => document.getElementById('senha-input')?.focus(), 350);
}

function fecharSenhaMural(e) {
  if (e && e.target !== document.getElementById('senha-overlay')) return;
  document.getElementById('senha-overlay').classList.remove('show');
  const inp = document.getElementById('senha-input');
  if (inp) inp.value = '';
  inp?.classList.remove('errado');
  document.getElementById('senha-erro')?.classList.remove('show');
}

function verificarSenha() {
  const val   = document.getElementById('senha-input').value;
  const modal = document.getElementById('senha-modal');
  const input = document.getElementById('senha-input');
  const erro  = document.getElementById('senha-erro');

  if (val === SENHA_MURAL) {
    fecharSenhaMural(null);
    document.getElementById('mural-locked').style.display   = 'none';
    document.getElementById('mural-conteudo').style.display = 'block';
    muralDesbloqueado = true;
    renderMural();
    showToast('🔓 Recados desbloqueados! 💕');
  } else {
    input?.classList.add('errado');
    erro?.classList.add('show');
    modal?.classList.add('shake');
    setTimeout(() => { modal?.classList.remove('shake'); }, 500);
  }
}

function bloquearMural() {
  document.getElementById('mural-locked').style.display   = 'block';
  document.getElementById('mural-conteudo').style.display = 'none';
  muralDesbloqueado = false;
  showToast('🔒 Mural bloqueado novamente.');
}

window.abrirSenhaMural  = abrirSenhaMural;
window.fecharSenhaMural = fecharSenhaMural;
window.verificarSenha   = verificarSenha;
window.bloquearMural    = bloquearMural;

/* ════════════════════════════════════════════
   MURAL
   ════════════════════════════════════════════ */
let muralAuthor = 'Pietro';

async function getMural() {
  try {
    const snap = await getDoc(MURAL_DOC);
    if (snap.exists()) return snap.data().msgs || [];
  } catch (e) {}
  return [];
}

async function saveMural(msgs) { await setDoc(MURAL_DOC, { msgs }); }

async function renderMural() {
  const list = document.getElementById('mural-list');
  if (!list) return;
  const msgs = await getMural();
  list.innerHTML = '';

  if (msgs.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:#c9a9b0;font-style:italic;">Nenhum recado ainda... Seja o primeiro! 💌</p>';
    return;
  }

  msgs.forEach((m, i) => {
    const div = document.createElement('div');
    div.className = 'mural-msg ' + m.author.toLowerCase();
    div.innerHTML = `
      <button class="mural-msg-del" onclick="deleteMural(${i})">✕</button>
      <div class="mural-msg-author">${m.author} ${m.author === 'Pietro' ? '💙' : '💗'}</div>
      <div class="mural-msg-text">${m.text}</div>
      <div class="mural-msg-date">${m.date || ''}</div>`;
    list.appendChild(div);
  });
}

async function addMural() {
  const input = document.getElementById('mural-input');
  const text  = input?.value.trim();
  if (!text) { showToast('✏️ Escreve um recado!'); return; }
  const msgs = await getMural();
  const date = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  msgs.push({ author: muralAuthor, text, date });
  await saveMural(msgs);
  if (input) input.value = '';
  renderMural();
  showToast('💌 Recado enviado com amor!');
}

async function deleteMural(i) {
  const msgs = await getMural();
  msgs.splice(i, 1);
  await saveMural(msgs);
  renderMural();
}

function selectAuthor(name) {
  muralAuthor = name;
  document.getElementById('btn-pietro')?.classList.toggle('active', name === 'Pietro');
  document.getElementById('btn-emilly')?.classList.toggle('active', name === 'Emilly');
}

window.addMural    = addMural;
window.deleteMural = deleteMural;
window.selectAuthor = selectAuthor;

/* ════════════════════════════════════════════
   SONHOS
   ════════════════════════════════════════════ */
const INITIAL_DREAMS = [
  { text: "Ter uma vida sem fingimentos, onde possamos nos amar de verdade", done: false },
  { text: "Que Deus abençoe nosso namoro e nos dê uma união linda e verdadeira", done: false },
  { text: "Ter uma felicidade genuína juntos, como a que sinto quando estou ao teu lado", done: false },
];

async function getDreams() {
  try {
    const snap = await getDoc(DREAMS_DOC);
    if (snap.exists()) return snap.data().dreams || INITIAL_DREAMS;
  } catch (e) {}
  return INITIAL_DREAMS;
}

async function saveDreams(d) { await setDoc(DREAMS_DOC, { dreams: d }); }

async function renderDreams() {
  const list   = document.getElementById('dreams-list');
  if (!list) return;
  const dreams = await getDreams();
  list.innerHTML = '';

  if (!dreams.length) {
    list.innerHTML = '<p style="text-align:center;color:#c9a9b0;font-style:italic;">Nenhum sonho ainda... Adicione o primeiro! 🌟</p>';
    return;
  }

  dreams.forEach((dream, i) => {
    const item = document.createElement('div');
    item.className = 'dream-item' + (dream.done ? ' done' : '');
    item.innerHTML = `
      <div class="dream-check" onclick="toggleDream(${i})">${dream.done ? '✓' : ''}</div>
      <div class="dream-text">${dream.text}</div>
      <button class="dream-del" onclick="deleteDream(${i})">✕</button>`;
    list.appendChild(item);
  });
}

async function addDream() {
  const input = document.getElementById('dream-input');
  const text  = input?.value.trim();
  if (!text) { showToast('✏️ Escreve um sonho!'); return; }
  const dreams = await getDreams();
  dreams.push({ text, done: false });
  await saveDreams(dreams);
  if (input) input.value = '';
  renderDreams();
  showToast('🌟 Sonho adicionado!');
}

async function toggleDream(i) {
  const dreams = await getDreams();
  dreams[i].done = !dreams[i].done;
  await saveDreams(dreams);
  renderDreams();
  if (dreams[i].done) showToast('✨ Sonho realizado!');
}

async function deleteDream(i) {
  const dreams = await getDreams();
  dreams.splice(i, 1);
  await saveDreams(dreams);
  renderDreams();
}

window.addDream    = addDream;
window.toggleDream = toggleDream;
window.deleteDream = deleteDream;
renderDreams();

/* ════════════════════════════════════════════
   DAILY POPUP
   ════════════════════════════════════════════ */
window.openDailyPopup  = openDailyPopup;
window.closeDailyPopup = closeDailyPopup;

/* ════════════════════════════════════════════
   MURAL DE HUMOR
   ════════════════════════════════════════════ */
let moodPickerTarget   = null;
let moodPickerSelected = null;
let moodActiveTab      = 'emojis';

function renderMoodGrid() {
  const grid = document.getElementById('mood-grid');
  if (!grid) return;
  const options = moodActiveTab === 'emojis'
    ? MOOD_OPTIONS
    : (moodPickerTarget === 'Emilly' ? DISNEY_EMILLY : DISNEY_PIETRO);

  grid.innerHTML = options.map((m, i) => `
    <div class="mood-option" onclick="selectMoodOption(${i})" id="mood-opt-${i}">
      <span class="mood-option-emoji">${m.emoji}</span>
      <span class="mood-option-label">${m.label}</span>
    </div>`).join('');
}

function openMoodPicker(person) {
  moodPickerTarget   = person;
  moodPickerSelected = null;
  moodActiveTab      = 'emojis';

  document.getElementById('mood-picker-title').textContent = `${person}, como você está hoje?`;
  document.getElementById('mood-tab-emojis')?.classList.add('active');
  document.getElementById('mood-tab-disney')?.classList.remove('active');

  const disneyTab = document.getElementById('mood-tab-disney');
  if (disneyTab) disneyTab.textContent = person === 'Emilly' ? '👸 Princesas' : '🤴 Príncipes';

  renderMoodGrid();
  document.getElementById('mood-picker-overlay')?.classList.add('show');
}

function closeMoodPicker() {
  document.getElementById('mood-picker-overlay')?.classList.remove('show');
  moodPickerTarget = moodPickerSelected = null;
}

function switchMoodTab(tab) {
  moodActiveTab      = tab;
  moodPickerSelected = null;
  document.getElementById('mood-tab-emojis')?.classList.toggle('active', tab === 'emojis');
  document.getElementById('mood-tab-disney')?.classList.toggle('active', tab === 'disney');
  renderMoodGrid();
}

function selectMoodOption(i) {
  document.querySelectorAll('.mood-option').forEach(el => el.classList.remove('selected'));
  document.getElementById(`mood-opt-${i}`)?.classList.add('selected');
  const options = moodActiveTab === 'emojis'
    ? MOOD_OPTIONS
    : (moodPickerTarget === 'Emilly' ? DISNEY_EMILLY : DISNEY_PIETRO);
  moodPickerSelected = options[i];
}

async function confirmMood() {
  if (!moodPickerSelected || !moodPickerTarget) {
    showToast('😊 Escolhe uma opção primeiro!'); return;
  }
  const person = moodPickerTarget.toLowerCase();
  const now    = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const snap   = await getDoc(MOOD_DOC).catch(() => null);
  const current = (snap?.exists() ? snap.data() : {});
  current[person] = { emoji: moodPickerSelected.emoji, label: moodPickerSelected.label, time: now };

  await setDoc(MOOD_DOC, current);
  closeMoodPicker();
  showToast(`${moodPickerSelected.emoji} Humor de ${moodPickerTarget} atualizado!`);
  initMoodDisplay();
}

async function initMoodDisplay() {
  try {
    const snap = await getDoc(MOOD_DOC);
    if (!snap.exists()) return;
    const data = snap.data();
    ['pietro', 'emilly'].forEach(p => {
      const d = data[p];
      if (d) {
        const box = document.getElementById(`mood-box-${p}`);
        if (box) box.classList.add('active-mood');
        const emojiEl = document.getElementById(`mood-emoji-${p}`);
        const labelEl = document.getElementById(`mood-label-${p}`);
        const timeEl  = document.getElementById(`mood-time-${p}`);
        if (emojiEl) emojiEl.textContent = d.emoji;
        if (labelEl) labelEl.textContent = d.label;
        if (timeEl)  timeEl.textContent  = d.time ? `às ${d.time}` : '';
      }
    });
  } catch (e) {}
}

window.openMoodPicker   = openMoodPicker;
window.closeMoodPicker  = closeMoodPicker;
window.switchMoodTab    = switchMoodTab;
window.selectMoodOption = selectMoodOption;
window.confirmMood      = confirmMood;
initMoodDisplay();

/* ════════════════════════════════════════════
   MENSAGENS ESPECIAIS
   ════════════════════════════════════════════ */
const specialFiles = { bday: { photo: null, audio: null }, mesv: { photo: null, audio: null } };

function isBdayToday()  { const n = new Date(); return n.getMonth() === BDAY_MONTH  && n.getDate() === BDAY_DAY; }
function isMesvToday()  { return new Date().getDate() === ANNIVERSARY_DAY; }

function getCurrentCycleKey(type) {
  const n = new Date();
  if (type === 'bday') return `bday_${n.getFullYear()}`;
  return `mesv_${n.getFullYear()}_${String(n.getMonth() + 1).padStart(2, '0')}`;
}

async function initSpecial(type) {
  const isOpen   = type === 'bday' ? isBdayToday() : isMesvToday();
  const ref      = type === 'bday' ? SPECIAL_BDAY_DOC : SPECIAL_MESV_DOC;
  const cycleKey = getCurrentCycleKey(type);
  const snap     = await getDoc(ref).catch(() => null);
  const data     = snap?.exists() ? snap.data() : null;
  const isCurrent = data && data.cycleKey === cycleKey;
  const hasData   = isCurrent && (data.text || data.photoUrl || data.audioUrl);

  if (!isCurrent) {
    const textEl = document.getElementById(`special-${type}-text`);
    if (textEl) textEl.value = '';
    specialFiles[type] = { photo: null, audio: null };
    const prevEl = document.getElementById(`special-${type}-preview`);
    if (prevEl) prevEl.innerHTML = '';
  }

  document.getElementById(`special-${type}-locked`).style.display = (!isOpen && !hasData) ? 'block' : 'none';
  document.getElementById(`special-${type}-open`).style.display   = (isOpen && hasData)  ? 'block' : 'none';

  if (isOpen && hasData) {
    const content = document.getElementById(`special-${type}-content`);
    if (content) {
      content.innerHTML = '';
      if (data.text)     content.innerHTML += `<div class="special-content-text">${data.text}</div>`;
      if (data.photoUrl) content.innerHTML += `<img src="${data.photoUrl}" alt="Foto especial">`;
      if (data.audioUrl) content.innerHTML += `<audio controls src="${data.audioUrl}"></audio>`;
    }
  }

  if (!isOpen && isCurrent && data?.text) {
    const textEl = document.getElementById(`special-${type}-text`);
    if (textEl) textEl.value = data.text;
  }
}

function toggleSpecialSend(type) {
  const sendEl  = document.getElementById(`special-${type}-send`);
  const arrow   = document.getElementById(`special-${type}-arrow`);
  if (!sendEl) return;
  const isOpen = sendEl.style.display !== 'none';
  sendEl.style.display = isOpen ? 'none' : 'block';
  arrow?.classList.toggle('open', !isOpen);
}

async function uploadSpecialFile(file, type) {
  const status = document.getElementById(`special-${type}-status`);
  if (status) status.textContent = '⏳ Enviando...';
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', CLOUDINARY_PRESET);
  const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`, { method: 'POST', body: form });
  const data = await res.json();
  if (status) {
    status.textContent = data.secure_url ? '✅ Enviado!' : '❌ Erro no upload';
    setTimeout(() => { status.textContent = ''; }, 2500);
  }
  return data.secure_url || null;
}

async function saveSpecial(type) {
  const ref      = type === 'bday' ? SPECIAL_BDAY_DOC : SPECIAL_MESV_DOC;
  const text     = document.getElementById(`special-${type}-text`)?.value.trim();
  const status   = document.getElementById(`special-${type}-status`);
  const cycleKey = getCurrentCycleKey(type);
  if (status) status.textContent = '⏳ Salvando...';

  let photoUrl = null, audioUrl = null;
  const snap = await getDoc(ref).catch(() => null);
  if (snap?.exists() && snap.data().cycleKey === cycleKey) {
    photoUrl = snap.data().photoUrl || null;
    audioUrl = snap.data().audioUrl || null;
  }

  if (specialFiles[type].photo) photoUrl = await uploadSpecialFile(specialFiles[type].photo, type);
  if (specialFiles[type].audio) audioUrl = await uploadSpecialFile(specialFiles[type].audio, type);

  await setDoc(ref, { text, photoUrl, audioUrl, cycleKey });
  showToast('💕 Mensagem guardada com amor!');
  if (status) status.textContent = '';
  initSpecial(type);
}

['bday', 'mesv'].forEach(type => {
  document.getElementById(`special-${type}-photo`)?.addEventListener('change', function () {
    const file = this.files[0]; if (!file) return;
    specialFiles[type].photo = file;
    const prevEl = document.getElementById(`special-${type}-preview`);
    if (prevEl) prevEl.innerHTML = `<img src="${URL.createObjectURL(file)}">`;
  });
  document.getElementById(`special-${type}-audio`)?.addEventListener('change', function () {
    const file = this.files[0]; if (!file) return;
    specialFiles[type].audio = file;
    const prevEl = document.getElementById(`special-${type}-preview`);
    if (prevEl) prevEl.innerHTML += `<audio controls src="${URL.createObjectURL(file)}"></audio>`;
  });
});

window.saveSpecial       = saveSpecial;
window.toggleSpecialSend = toggleSpecialSend;
initSpecial('bday');
initSpecial('mesv');

/* ════════════════════════════════════════════
   CALENDÁRIO
   ════════════════════════════════════════════ */
let calYear, calMonth, calCurrentKey, calAuthor = 'Pietro';
let calDayData   = {};
let calModalData = { text: '', media: [], comments: [] };

function calKey(y, m, d) { return `cal_${y}_${String(m + 1).padStart(2, '0')}_${String(d).padStart(2, '0')}`; }
function isBirthday(y, m, d) { return m === EMILLY_BDAY_MONTH && d === EMILLY_BDAY_DAY; }

async function getCalDay(key) {
  try {
    const ref  = doc(db, 'calendar', key);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data();
  } catch (e) {}
  return { text: '', media: [], comments: [] };
}

async function saveCalDayData(key, data) {
  await setDoc(doc(db, 'calendar', key), data);
}

async function renderCal() {
  const now   = new Date();
  const label = new Date(calYear, calMonth, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const labelEl = document.getElementById('cal-month-label');
  if (labelEl) labelEl.textContent = label.charAt(0).toUpperCase() + label.slice(1);

  const grid     = document.getElementById('cal-grid');
  if (!grid) return;
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  grid.innerHTML = dayNames.map(d => `<div class="cal-day-name">${d}</div>`).join('');

  const firstDay    = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) grid.innerHTML += `<div class="cal-day empty"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const key     = calKey(calYear, calMonth, d);
    const isToday = now.getDate() === d && now.getMonth() === calMonth && now.getFullYear() === calYear;
    const bday    = isBirthday(calYear, calMonth, d);
    const hasData = calDayData[key];

    let cls = 'cal-day';
    if (isToday)       cls += ' today';
    if (bday)          cls += ' birthday';
    else if (hasData)  cls += ' has-data';

    const dot   = hasData ? '<div class="cal-day-dot"></div>' : '';
    const bIcon = bday   ? '<div class="cal-day-bday">🎂</div>' : '';

    grid.innerHTML += `<div class="${cls}" onclick="openCalModal(${d})">
      <div class="cal-day-num">${d}</div>${dot}${bIcon}
    </div>`;
  }
}

async function loadCalMonth() {
  calDayData = {};
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const promises = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const key = calKey(calYear, calMonth, d);
    promises.push(
      getDoc(doc(db, 'calendar', key)).then(snap => {
        if (snap.exists() && (snap.data().text || snap.data().media?.length || snap.data().comments?.length)) {
          calDayData[key] = true;
        }
      }).catch(() => {})
    );
  }
  await Promise.all(promises);
  renderCal();
}

function calPrev() { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } loadCalMonth(); }
function calNext() { calMonth++; if (calMonth > 11) { calMonth = 0;  calYear++; } loadCalMonth(); }

async function openCalModal(d) {
  calCurrentKey = calKey(calYear, calMonth, d);
  const dateStr = new Date(calYear, calMonth, d).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const dateEl  = document.getElementById('cal-modal-date');
  if (dateEl) {
    dateEl.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    if (isBirthday(calYear, calMonth, d)) {
      dateEl.innerHTML += ' 🎂<br><span style="font-size:0.9rem;color:#856404;font-style:italic;">Feliz aniversário, Emilly! 💕</span>';
    }
  }

  calModalData = await getCalDay(calCurrentKey);
  const textEl = document.getElementById('cal-text');
  if (textEl) textEl.value = calModalData.text || '';
  renderCalMedia();
  renderCalComments();
  document.getElementById('cal-overlay')?.classList.add('show');
}

function closeCalModal() {
  document.getElementById('cal-overlay')?.classList.remove('show');
  calCurrentKey = null;
}

function renderCalMedia() {
  const grid = document.getElementById('cal-media-grid');
  if (!grid) return;
  grid.innerHTML = '';
  (calModalData.media || []).forEach((m, i) => {
    const div = document.createElement('div');
    div.className = 'cal-media-item';
    div.innerHTML = m.type === 'video'
      ? `<video src="${m.url}" controls></video>`
      : `<img src="${m.url}" loading="lazy">`;
    div.innerHTML += `<button class="cal-media-del" onclick="removeCalMedia(${i})">✕</button>`;
    grid.appendChild(div);
  });
}

function removeCalMedia(i) {
  calModalData.media.splice(i, 1);
  renderCalMedia();
}

function renderCalComments() {
  const list = document.getElementById('cal-comments');
  if (!list) return;
  list.innerHTML = '';
  (calModalData.comments || []).forEach((c, i) => {
    const div = document.createElement('div');
    div.className = 'cal-comment ' + c.author.toLowerCase();
    div.innerHTML = `
      <button class="cal-comment-del" onclick="removeCalComment(${i})">✕</button>
      <div class="cal-comment-author">${c.author} ${c.author === 'Pietro' ? '💙' : '💗'}</div>
      <div class="cal-comment-text">${c.text}</div>`;
    list.appendChild(div);
  });
}

function removeCalComment(i) {
  calModalData.comments.splice(i, 1);
  renderCalComments();
}

function selectCalAuthor(name) {
  calAuthor = name;
  document.getElementById('cal-btn-pietro')?.classList.toggle('active', name === 'Pietro');
  document.getElementById('cal-btn-emilly')?.classList.toggle('active', name === 'Emilly');
}

function addCalComment() {
  const input = document.getElementById('cal-comment-input');
  const text  = input?.value.trim();
  if (!text) { showToast('✏️ Escreve um comentário!'); return; }
  if (!calModalData.comments) calModalData.comments = [];
  calModalData.comments.push({ author: calAuthor, text });
  if (input) input.value = '';
  renderCalComments();
}

document.getElementById('cal-file-input')?.addEventListener('change', async function () {
  const files = Array.from(this.files);
  if (!files.length) return;
  this.value = '';
  const status = document.getElementById('cal-upload-status');
  if (status) status.textContent = '⏳ Enviando...';

  for (const file of files) {
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('upload_preset', CLOUDINARY_PRESET);
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`, { method: 'POST', body: form });
      const data = await res.json();
      if (data.secure_url) {
        if (!calModalData.media) calModalData.media = [];
        calModalData.media.push({ url: data.secure_url, type: file.type.startsWith('video') ? 'video' : 'image' });
        renderCalMedia();
      } else {
        showToast('❌ Erro no upload. Configure o preset no Cloudinary.', 4000);
      }
    } catch (e) {
      showToast('❌ Erro de rede.', 3000);
    }
  }
  if (status) {
    status.textContent = '✅ Enviado!';
    setTimeout(() => { status.textContent = ''; }, 2500);
  }
});

async function saveCalDay() {
  if (!calCurrentKey) return;
  calModalData.text = document.getElementById('cal-text')?.value.trim() || '';
  await saveCalDayData(calCurrentKey, calModalData);
  calDayData[calCurrentKey] = !!(calModalData.text || calModalData.media?.length || calModalData.comments?.length);
  renderCal();
  closeCalModal();
  showToast('💕 Dia salvo com carinho!');
}

window.calPrev        = calPrev;
window.calNext        = calNext;
window.openCalModal   = openCalModal;
window.closeCalModal  = closeCalModal;
window.removeCalMedia = removeCalMedia;
window.removeCalComment = removeCalComment;
window.selectCalAuthor = selectCalAuthor;
window.addCalComment  = addCalComment;
window.saveCalDay     = saveCalDay;

const _now = new Date();
calYear    = _now.getFullYear();
calMonth   = _now.getMonth();
loadCalMonth();

/* ════════════════════════════════════════════
   LOCALIZAÇÃO
   ════════════════════════════════════════════ */
let locData = { pietro: null, emilly: null };

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function reverseGeocode(lat, lng) {
  const storedKey = localStorage.getItem(LS_GMAPS_KEY);
  if (storedKey) {
    try {
      const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${storedKey}&language=pt-BR`);
      const d = await r.json();
      const res = d.results?.[0];
      if (res) {
        const city = res.address_components?.find(c => c.types.includes('locality'))?.long_name || '';
        const state = res.address_components?.find(c => c.types.includes('administrative_area_level_1'))?.short_name || '';
        return city ? `${city}, ${state}` : res.formatted_address;
      }
    } catch (e) {}
  }
  // Fallback: Open-Meteo / nominatim
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
    const d = await r.json();
    return d.address?.city || d.address?.town || d.address?.county || 'Local desconhecido';
  } catch (e) {
    return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
  }
}

function renderMapPins() {
  const { pietro, emilly } = locData;
  const wrap = document.getElementById('location-map-wrap');
  const ph   = document.getElementById('location-map-placeholder');
  const map  = document.getElementById('location-map');
  if (!wrap || !ph || !map) return;

  if (!pietro && !emilly) { ph.style.display = 'block'; map.style.display = 'none'; return; }

  ph.style.display  = 'none';
  map.style.display = 'block';

  const lat = ((pietro?.lat || 0) + (emilly?.lat || 0)) / (pietro && emilly ? 2 : 1);
  const lng = ((pietro?.lng || 0) + (emilly?.lng || 0)) / (pietro && emilly ? 2 : 1);

  map.innerHTML = `
    <iframe
      width="100%" height="100%"
      style="border:0;border-radius:20px;"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      src="https://www.google.com/maps?q=${lat},${lng}&z=10&output=embed">
    </iframe>`;
}

function updateLocUI() {
  const { pietro, emilly } = locData;
  ['pietro', 'emilly'].forEach(p => {
    const d       = locData[p];
    const cityEl  = document.getElementById(`loc-city-${p}`);
    const timeEl  = document.getElementById(`loc-time-${p}`);
    const cardEl  = document.getElementById(`loc-card-${p}`);
    const btnEl   = document.getElementById(`loc-btn-${p}`);
    if (d) {
      if (cityEl)  cityEl.textContent = d.city || 'Local desconhecido';
      if (timeEl)  timeEl.textContent = d.updatedAt ? `Atualizado às ${d.updatedAt}` : '';
      if (cardEl)  cardEl.classList.add('active-loc');
      if (btnEl)   btnEl.textContent  = '📍 Atualizar localização';
    }
  });

  // Distância
  const distDiv = document.getElementById('location-distance');
  const distNum = document.getElementById('loc-dist-num');
  if (pietro && emilly) {
    const km  = haversineKm(pietro.lat, pietro.lng, emilly.lat, emilly.lng);
    const str = km < 1 ? `${Math.round(km * 1000)} metros` : `${km.toFixed(1)} km`;
    if (distNum) distNum.textContent = str;
    distDiv?.classList.add('show');
  } else {
    distDiv?.classList.remove('show');
  }
  renderMapPins();
}

// Escuta Firebase em tempo real
onSnapshot(LOC_DOC, (snap) => {
  if (snap.exists()) {
    const data   = snap.data();
    locData.pietro = data.pietro || null;
    locData.emilly = data.emilly || null;
    updateLocUI();
  }
});

async function shareLocation(person) {
  const btn = document.getElementById(`loc-btn-${person}`);
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Obtendo localização...'; }

  if (!navigator.geolocation) {
    showToast('❌ Geolocalização não suportada neste navegador.');
    if (btn) { btn.disabled = false; btn.textContent = '📍 Compartilhar minha localização'; }
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      if (btn) btn.textContent = '⏳ Identificando cidade...';
      const city  = await reverseGeocode(lat, lng);
      const now   = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const snap  = await getDoc(LOC_DOC).catch(() => null);
      const curr  = snap?.exists() ? snap.data() : {};
      curr[person] = { lat, lng, city, updatedAt: now };
      await setDoc(LOC_DOC, curr);
      if (btn) { btn.disabled = false; btn.textContent = '📍 Atualizar localização'; }
      showToast(`📍 Localização de ${person === 'pietro' ? 'Pietro' : 'Emilly'} atualizada!`);
    },
    (err) => {
      if (btn) { btn.disabled = false; btn.textContent = '📍 Compartilhar minha localização'; }
      if (err.code === 1) showToast('❌ Permissão de localização negada.');
      else                showToast('❌ Não foi possível obter a localização.');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

window.shareLocation = shareLocation;

function checkGmapsKeyTip() {
  const key = localStorage.getItem(LS_GMAPS_KEY);
  const tip = document.getElementById('location-key-tip');
  if (!tip) return;
  if (!key) {
    tip.style.display = 'block';
    tip.innerHTML = `
      <div class="location-key-tip">
        💡 <strong>Dica:</strong> Para ver o mapa com os pins de vocês,
        adicione uma <a href="https://developers.google.com/maps/documentation/javascript/get-api-key" target="_blank" rel="noopener">chave da API do Google Maps</a>:
        <div class="location-key-row">
          <input class="location-key-input" id="gmaps-key-input" placeholder="AIza..." type="text">
          <button class="location-key-btn" onclick="saveGmapsKey()">Salvar</button>
        </div>
      </div>`;
  }
}

window.saveGmapsKey = function () {
  const k = document.getElementById('gmaps-key-input')?.value.trim();
  if (k) {
    localStorage.setItem(LS_GMAPS_KEY, k);
    showToast('✅ Chave do mapa salva!');
    checkGmapsKeyTip();
  }
};

checkGmapsKeyTip();

/* ════════════════════════════════════════════
   EVENTOS SAZONAIS
   ════════════════════════════════════════════ */
(function initEventos() {
  const now   = new Date();
  const day   = now.getDate();
  const month = now.getMonth();

  function getPascoa(y) {
    const a = y % 19, b = Math.floor(y/100), c = y % 100;
    const d = Math.floor(b/4), e = b % 4, f = Math.floor((b+8)/25);
    const g = Math.floor((b-f+1)/3), h = (19*a+b-d-g+15) % 30;
    const i2 = Math.floor(c/4), k = c % 4;
    const l = (32 + 2*e + 2*i2 - h - k) % 7;
    const m2 = Math.floor((a + 11*h + 22*l) / 451);
    const mes = Math.floor((h + l - 7*m2 + 114) / 31) - 1;
    const dia = ((h + l - 7*m2 + 114) % 31) + 1;
    return new Date(y, mes, dia);
  }

  function isCarnaval(date) {
    const pascoa = getPascoa(date.getFullYear());
    const carnaval = new Date(pascoa); carnaval.setDate(pascoa.getDate() - 47);
    const seg = new Date(carnaval); seg.setDate(carnaval.getDate() - 1);
    return (date.getMonth() === carnaval.getMonth() && date.getDate() === carnaval.getDate()) ||
           (date.getMonth() === seg.getMonth() && date.getDate() === seg.getDate());
  }

  const evento = EVENTOS.find(e => e.check(day, month));
  if (!evento) return;

  document.body.classList.add('event-mode');
  document.body.setAttribute('data-event', evento.id);

  const heroStyle = document.createElement('style');
  heroStyle.textContent = `
    .hero { background: ${evento.bg} !important; }
    body.event-mode { --rose: ${evento.accent}; }
    ${evento.dark ? 'body.event-mode .hero-title, body.event-mode .hero-subtitle, body.event-mode .counter-num { color: #fff !important; }' : ''}
  `;
  document.head.appendChild(heroStyle);

  const banner = document.getElementById('event-banner');
  if (banner) {
    banner.textContent = evento.banner;
    banner.style.background = `linear-gradient(90deg, ${evento.accent}cc, ${evento.accent}, ${evento.accent}cc)`;
  }

  setTimeout(() => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:1.5rem;animation:fadeIn .4s ease;';
    overlay.innerHTML = `
      <div style="background:#fff8f9;border-radius:28px;padding:2.2rem 2rem;max-width:420px;width:100%;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,0.25);position:relative;animation:popIn .4s cubic-bezier(.32,1.2,.5,1)">
        <div style="font-size:3rem;margin-bottom:0.8rem">${evento.elements[0]}</div>
        <div style="font-family:'Playfair Display',serif;font-size:1.4rem;color:#590d22;margin-bottom:1rem;line-height:1.3">${evento.banner.replace(/^[^\s]+ /, '')}</div>
        <p style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1.05rem;color:#7a3045;line-height:1.7;margin-bottom:1.5rem">${evento.popup}</p>
        <button onclick="this.closest('div[style]').remove()" style="background:${evento.accent};color:white;border:none;padding:0.75rem 2rem;border-radius:50px;font-family:'DM Sans',sans-serif;font-size:0.95rem;font-weight:600;cursor:pointer">Com amor 💕</button>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }, 1200);

  function spawnElement() {
    const el = document.createElement('div');
    el.textContent = evento.elements[Math.floor(Math.random() * evento.elements.length)];
    el.style.cssText = `position:fixed;left:${Math.random()*100}vw;top:-60px;font-size:${Math.random()*18+12}px;z-index:9996;pointer-events:none;animation:petalFall ${Math.random()*6+5}s linear forwards;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 12000);
  }
  for (let i = 0; i < 18; i++) setTimeout(spawnElement, i * 300);
  setInterval(spawnElement, 700);
})();

/* ════════════════════════════════════════════
   PWA MANIFEST (inline)
   ════════════════════════════════════════════ */
(function injectManifest() {
  const manifest = {
    name: 'Pietro & Emilly',
    short_name: 'Pietro & Emilly',
    start_url: '/',
    display: 'standalone',
    background_color: '#fffaf9',
    theme_color: '#590d22',
    icons: [{ src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png' }]
  };
  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const link = document.getElementById('pwa-manifest');
  if (link) link.href = url;
})();
