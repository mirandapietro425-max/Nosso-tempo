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
  TMDB_KEY, SENHA_MURAL, GALLERY_SLOTS, LS_DAILY_POPUP,
  PLAYLIST, RECADINHOS, MOOD_OPTIONS, EVENTOS,
  START_DATE, ANNIVERSARY_DAY, BDAY_MONTH, BDAY_DAY, EMILLY_BDAY_MONTH, EMILLY_BDAY_DAY,
} from './config.js';

// Escapa caracteres HTML para evitar XSS ao inserir texto do usuário via innerHTML
function sanitizeHTML(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── UI utilities ──
import {
  showToast, initGreeting, initCounter, initAnniversary,
  initSurprise, initDaily, openDailyPopup, closeDailyPopup,
  initTimeline, initScrollReveal,
} from './ui.js';
// FIX: expõe showToast globalmente para módulos como library.js
window.showToast = showToast;

// ── Music ──
import {
  loadYTApi, renderPlaylist, renderMiniPlayerList,
  playTrack, playNext, playPrev, togglePlayPause, playCustomYT,
  toggleMiniPlayer, initMiniPlayerClickOutside, exposeGlobals as exposeMusicGlobals,
  setEventPlaylist,
} from './music.js';

// ── Experience (novo módulo) ──
import { initExperience } from './experience.js';

// ── Stickers (figurinhas) ──
import { STICKERS as _STICKERS_DATA } from './stickers.js';
window._STICKERS = _STICKERS_DATA;
// ── Pré-carrega imagens das figurinhas em background após o load ──
// Garante que o mood picker abre instantaneamente, sem esperar rede
window.addEventListener('load', () => {
  // Pequeno delay para não competir com recursos críticos da página
  setTimeout(() => {
    const allStickers = Object.values(window._STICKERS || {}).flat();
    allStickers.forEach(s => {
      if (s.file) {
        const img = new Image();
        img.src = s.file; // navegador cacheia silenciosamente
      }
    });
  }, 2000);
});


// ── Home (casinha + pet + quiz) ──
import { initHome, awardCoins as _awardCoins } from './home.js';

// ── Biblioteca ──
import { initLibrary } from './library.js';

// ── Cinema ──
import { initCinema } from './cinema.js';
import { initWatchParty } from './watchparty.js';

// ── Jogos / Arcade ──
import { initGames } from './games.js';

// ── Love City Core ──
import { initLoveCity } from './love-city-core.js';

// ── Museu de Memórias ──
import { initMuseum } from './museum.js';

// ── Memória do Dia ──
import { initMemoryOfDay } from './memory-of-day.js';
import { initEventUnlock } from './event-unlock.js';
import { initEmotionalState } from './emotional-state.js';
import { initLivingMoments } from './living-moments.js';
import { initMemoryAnniversaries } from './memory-anniversaries.js';
window.awardCoins = _awardCoins;

/* ════════════════════════════════════════════
   FIREBASE INIT
   ════════════════════════════════════════════ */
let app, db = null;
try {
  app = initializeApp(FIREBASE_CONFIG);
  db  = getFirestore(app);
} catch (e) {
  console.error('[Firebase] Falha ao inicializar:', e);
  db = null; // explícito — garante que todos os módulos recebem null e caem no caminho offline
  const warn = document.createElement('div');
  warn.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#c0392b;color:#fff;font-size:12px;padding:6px 12px;z-index:99999;text-align:center;';
  warn.textContent = '⚠️ Erro de conexão com o banco de dados. Algumas funções podem não funcionar.';
  document.body?.appendChild(warn);
}

/* ── Document refs (só criados se db foi inicializado com sucesso) ── */
const GALLERY_DOC      = db ? doc(db, 'gallery',       'shared') : null;
const MOVIES_DOC       = db ? doc(db, 'movies',        'shared') : null;
const DREAMS_DOC       = db ? doc(db, 'dreams',        'shared') : null;
const MURAL_DOC        = db ? doc(db, 'mural',         'shared') : null;
const MOOD_DOC         = db ? doc(db, 'mood',          'shared') : null;
const LOC_DOC          = db ? doc(db, 'location',      'shared') : null;
const SPECIAL_BDAY_DOC       = db ? doc(db, 'special_bday',       'shared') : null;
const SPECIAL_EMILLY_BDAY_DOC = db ? doc(db, 'special_bday_emilly', 'shared') : null;
const SPECIAL_MESV_DOC       = db ? doc(db, 'special_mesv',       'shared') : null;
const STICKERS_DOC     = db ? doc(db, 'stickers',      'shared') : null;

/* ════════════════════════════════════════════
   UI INIT
   ════════════════════════════════════════════ */
// Captura erros globais e mostra no topo da tela para debug
window.addEventListener('error', e => {
  // FIX: só exibe 1 overlay de erro — evita cascata de divs vermelhos
  if (document.getElementById('_js-error-overlay')) return;
  const d = document.createElement('div');
  d.id = '_js-error-overlay';
  d.style.cssText = 'position:fixed;top:0;left:0;right:0;background:red;color:#fff;font-size:12px;padding:8px;z-index:99999;cursor:pointer;';
  d.textContent = '❌ JS ERROR: ' + e.message + ' (' + e.filename?.split('/').pop() + ':' + e.lineno + ') — toque para fechar';
  d.onclick = () => d.remove();
  document.body?.appendChild(d);
});

try { initGreeting(); } catch(e) { console.error('initGreeting:', e); }
try { initCounter(); } catch(e) { console.error('initCounter:', e); }
try { initAnniversary(); } catch(e) { console.error('initAnniversary:', e); }
try { initSurprise(); } catch(e) { console.error('initSurprise:', e); }
try { initDaily(); } catch(e) { console.error('initDaily:', e); }
try { initTimeline(); } catch(e) { console.error('initTimeline:', e); }
try { initScrollReveal(); } catch(e) { console.error('initScrollReveal:', e); }

/* ════════════════════════════════════════════
   EXPERIENCE SYSTEM
   ════════════════════════════════════════════ */
// FIX: usa EVENTOS.find() — mesma lógica do initEventos para garantir que o experience module
// (partículas, easter eggs, mensagens) receba o MESMO evento que o visual do banner/fundo.
// Antes, detectAndInitExperience tinha sua própria lista de if/else que omitia 9 eventos
// (ano-novo, reveillon, dia-maes, dia-pais, finados, independencia, tiradentes, republica,
// aparecida), fazendo com que as partículas ficassem no estilo padrão enquanto o banner
// mostrava o evento correto.
// FIX Bug 2: funções de datas móveis declaradas UMA vez no módulo — usadas por ambos os IIFEs
function _calcPascoa(y) {
  const a=y%19,b=Math.floor(y/100),c=y%100,d2=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3);
  const h=(19*a+b-d2-g+15)%30,i2=Math.floor(c/4),k=c%4,l=(32+2*e+2*i2-h-k)%7,m2=Math.floor((a+11*h+22*l)/451);
  return new Date(y,Math.floor((h+l-7*m2+114)/31)-1,((h+l-7*m2+114)%31)+1);
}
function _isPascoa(d)   { const p=_calcPascoa(d.getFullYear()); return d.getMonth()===p.getMonth()&&d.getDate()===p.getDate(); }
function _isCarnaval(d) { const p=_calcPascoa(d.getFullYear()),t=new Date(p);t.setDate(p.getDate()-47);const s=new Date(t);s.setDate(t.getDate()-1); return (d.getMonth()===t.getMonth()&&d.getDate()===t.getDate())||(d.getMonth()===s.getMonth()&&d.getDate()===s.getDate()); }
function _nthWeekday(y,m,wd,n){ let d=new Date(y,m,1),count=0; while(true){if(d.getDay()===wd){count++;if(count===n)return d;} d.setDate(d.getDate()+1); } }
function _isDiaDasMaes(d){ const s=_nthWeekday(d.getFullYear(),4,0,2); return d.getMonth()===s.getMonth()&&d.getDate()===s.getDate(); }
function _isDiaDossPais(d){ const s=_nthWeekday(d.getFullYear(),7,0,2); return d.getMonth()===s.getMonth()&&d.getDate()===s.getDate(); }

(function detectAndInitExperience() {
  const now   = new Date();
  const day   = now.getDate();
  const month = now.getMonth();

  // FIX Bug 2: usa as funções compartilhadas do módulo (sem duplicar aqui)
  const dynamicChecks = {
    'pascoa':   () => _isPascoa(now),
    'carnaval': () => _isCarnaval(now),
    'dia-maes': () => _isDiaDasMaes(now),
    'dia-pais': () => _isDiaDossPais(now),
  };
  const found = EVENTOS.find(e => {
    if (e.check) return e.check(day, month);
    return dynamicChecks[e.id] ? dynamicChecks[e.id]() : false;
  });
  const activeEventId = found ? found.id : null;

  // C-02: initExperience já chama initAdaptiveParticles internamente.
  // Remover initParticles() aqui evita dois sistemas de partículas simultâneos (canvas + adaptive).
  try { initExperience(activeEventId); } catch(e) { console.error('initExperience:', e); }
})();

// ── Casinha + Pet + Quiz ──
try { initHome(db); } catch(e) { console.error('initHome:', e); }
try { initGames(db); } catch(e) { console.error('initGames:', e); }
try { initLoveCity(); } catch(e) { console.error('initLoveCity:', e); }
try { initMuseum(); } catch(e) { console.error('initMuseum:', e); }
try { initMemoryOfDay(); } catch(e) { console.error('initMemoryOfDay:', e); }
try { initEventUnlock(); } catch(e) { console.error('initEventUnlock:', e); }
try { initEmotionalState(); } catch(e) { console.error('initEmotionalState:', e); }
try { initLivingMoments(); } catch(e) { console.error('initLivingMoments:', e); }
try { initMemoryAnniversaries(); } catch(e) { console.error('initMemoryAnniversaries:', e); }
try { initLibrary(db, () => { try { return localStorage.getItem('pe_active_player'); } catch { return null; } }); } catch(e) { console.error('initLibrary:', e); }
try { initCinema(db); } catch(e) { console.error('initCinema:', e); }
try {
  // Detecta jogador ativo para o watch party (usa localStorage da casinha)
  const _wpPlayer = (() => { try { return localStorage.getItem('pe_active_player') || null; } catch { return null; } })();
  initWatchParty(db, _wpPlayer);
} catch(e) { console.error('initWatchParty:', e); }

/* ════════════════════════════════════════════
   MUSIC
   ════════════════════════════════════════════ */
loadYTApi();
exposeMusicGlobals();
renderPlaylist();
renderMiniPlayerList();

// Controla o botão de play/pause da barra de música dos eventos sazonais
window.toggleEventMusic = function() {
  togglePlayPause();
  // FIX Bug B: lê o estado real do player após a ação em vez de simplesmente inverter o ícone
  // (evita dessincronização quando o player ainda não está pronto)
  const btn = document.getElementById('event-music-toggle');
  if (!btn) return;
  setTimeout(() => {
    try {
      const state = window._ytPlayerState?.();
      // YT.PlayerState.PLAYING = 1
      btn.textContent = (state === 1) ? '⏸' : '▶';
    } catch(e) {
      // fallback: simplesmente inverte
      btn.textContent = btn.textContent === '⏸' ? '▶' : '⏸';
    }
  }, 150); // aguarda o player processar a ação
};
initMiniPlayerClickOutside();

/* ════════════════════════════════════════════
   FIGURINHAS
   ════════════════════════════════════════════ */
// initStickers e initMoodStickers removidos — seção de figurinhas integrada ao mural de humor

/* ════════════════════════════════════════════
   GALERIA
   ════════════════════════════════════════════ */
let uploadSlot = null;

async function getPhotos() {
  if (!GALLERY_DOC) return Array(GALLERY_SLOTS).fill(null); // APP-11
  try {
    const snap = await getDoc(GALLERY_DOC);
    if (snap.exists()) return snap.data().photos || Array(GALLERY_SLOTS).fill(null);
  } catch (e) {}
  return Array(GALLERY_SLOTS).fill(null);
}

async function setPhotos(p) {
  if (!GALLERY_DOC) { showToast('❌ Banco de dados indisponível.'); return; }
  try {
    await setDoc(GALLERY_DOC, { photos: p });
  } catch (err) {
    showToast('❌ Erro ao salvar a galeria. Tente novamente.', 4000);
    throw err;
  }
}

// FIX Bug renderGallery: guard contra execuções paralelas (duplo clique no upload)
let _renderingGallery = false;
async function renderGallery() {
  if (_renderingGallery) return;
  _renderingGallery = true;
  try {
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
        <img src="${url}" alt="Memória ${i+1}" loading="lazy" onerror="this.src='';this.parentElement.querySelector('.slot-empty-icon')||this.insertAdjacentHTML('afterend','<div class=\\'slot-empty-icon\\'>📷</div><div class=\\'slot-empty-text\\'>Erro ao carregar</div>');this.remove()">
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
  } finally {
    _renderingGallery = false;
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
  try {
    const p = await getPhotos();
    p[i] = null;
    await setPhotos(p);
    renderGallery();
    showToast('🗑 Foto removida!');
  } catch (err) {
    showToast('❌ Erro ao remover foto. Tente novamente.', 4000);
  }
}

// ── Compressão de imagem para upload mobile ──
// Reduz fotos de câmera (até 12MP) para no máximo 1200px — evita erro de memória no celular
async function compressImage(file, maxSize = 1200, quality = 0.82) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= maxSize && height <= maxSize) { resolve(file); return; }
      if (width > height) { height = Math.round(height * maxSize / width); width = maxSize; }
      else                { width  = Math.round(width  * maxSize / height); height = maxSize; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => resolve(blob || file), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

document.getElementById('file-input')?.addEventListener('change', async function () {
  const file = this.files[0];
  if (!file || uploadSlot === null) return;
  this.value = '';

  // FIX: captura o slot localmente — evita race condition se startUpload for chamado
  // novamente enquanto este upload ainda está em andamento (await compressImage / fetch)
  const localSlot = uploadSlot;
  uploadSlot = null;

  // Mostra spinner no slot correto
  const grid   = document.getElementById('gallery-grid');
  const slotEl = grid?.children[localSlot];
  if (slotEl) {
    const sp = document.createElement('div');
    sp.className = 'upload-spinner';
    sp.textContent = '⏳';
    slotEl.appendChild(sp);
  }

  try {
    const compressed = await compressImage(file);
    const form = new FormData();
    form.append('image', compressed);
    form.append('key', IMGBB_KEY);
    const res  = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: form });
    const data = await res.json();

    if (data.success) {
      const p = await getPhotos();
      p[localSlot] = data.data.url;
      await setPhotos(p);
      showToast('📸 Foto adicionada! 🥰');
    } else {
      if (slotEl) slotEl.querySelector('.upload-spinner')?.remove();
      showToast('❌ Erro ao fazer upload.', 4000);
    }
  } catch (err) {
    if (slotEl) slotEl.querySelector('.upload-spinner')?.remove();
    showToast('❌ Erro de rede. Tente novamente.', 4000);
  }

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
  if (!MOVIES_DOC) return INITIAL_MOVIES; // APP-12
  try {
    const snap = await getDoc(MOVIES_DOC);
    if (snap.exists()) return snap.data().movies || INITIAL_MOVIES;
  } catch (e) {}
  return INITIAL_MOVIES;
}

async function saveMovies(m) {
  if (!MOVIES_DOC) { showToast('❌ Banco de dados indisponível.'); return; }
  try {
    await setDoc(MOVIES_DOC, { movies: m });
  } catch (err) {
    showToast('❌ Erro ao salvar filmes. Tente novamente.', 4000);
    throw err;
  }
}

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
      <div class="movie-name" onclick="openMovieModal(${i})">${sanitizeHTML(m.name)}</div>
      <button class="movie-check" onclick="toggleMovie(${i})">${m.watched ? '✓' : ''}</button>
      <button class="movie-del" onclick="deleteMovie(${i})">✕</button>`;
    list.appendChild(item);
  });
}

let _addingMovie = false;
async function addMovie() {
  if (_addingMovie) return;
  const input = document.getElementById('movie-input');
  const name  = input?.value.trim();
  if (!name) { showToast('✏️ Escreve o nome do filme!'); return; }
  _addingMovie = true;
  try {
    const movies = await getMovies();
    movies.push({ name, watched: false, comments: [] });
    await saveMovies(movies);
    if (input) input.value = '';
    renderMovies();
    showToast('🎬 Filme adicionado!');
  } finally {
    _addingMovie = false;
  }
}

async function toggleMovie(i) {
  try {
    const movies = await getMovies();
    movies[i].watched = !movies[i].watched;
    await saveMovies(movies);
    renderMovies();
    if (movies[i].watched) showToast('✅ Assistido! 🥰');
  } catch (err) {
    showToast('❌ Erro ao salvar. Tente novamente.', 4000);
  }
}

let _deletingMovie = false;
async function deleteMovie(i) {
  if (_deletingMovie) return;
  if (!confirm('Remover este filme?')) return;
  _deletingMovie = true;
  try {
    const movies = await getMovies();
    movies.splice(i, 1);
    await saveMovies(movies);
    renderMovies();
  } finally { _deletingMovie = false; }
}

// ── Movie Modal ──
let movieModalIndex  = null;
let movieModalAuthor = 'Pietro';
let _movieFetchId    = 0; // incrementado a cada abertura para cancelar fetches anteriores
let _movieAbortCtrl  = null; // BUG-M2: AbortController para abortar fetches anteriores em voo

async function openMovieModal(i) {
  movieModalIndex  = i;
  const fetchId    = ++_movieFetchId; // APP-8: ID único para este fetch
  // BUG-M2: aborta fetches anteriores que ainda estão em voo
  if (_movieAbortCtrl) { _movieAbortCtrl.abort(); }
  _movieAbortCtrl = new AbortController();
  const signal = _movieAbortCtrl.signal;
  // Reset author para Pietro a cada abertura
  movieModalAuthor = 'Pietro';
  document.getElementById('movie-btn-pietro')?.classList.add('active');
  document.getElementById('movie-btn-emilly')?.classList.remove('active');
  const movies = await getMovies();
  const m = movies[i];
  document.getElementById('movie-modal-title').textContent = m.name;
  document.getElementById('movie-modal-trailer').innerHTML = '<p style="text-align:center;color:#c9a9b0;font-size:0.85rem;">⏳ Buscando trailer...</p>';
  document.getElementById('movie-modal-poster-area').innerHTML = '<div class="movie-modal-poster-placeholder">🎬</div>';
  document.getElementById('movie-modal-overlay').classList.add('show');
  renderMovieComments(m.comments || []);

  try {
    const search  = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(m.name)}&language=pt-BR`, { signal });
    const sData   = await search.json();
    const movie   = sData.results?.[0];

    if (movie) {
      if (fetchId !== _movieFetchId) return; // APP-8: modal fechado ou outro filme aberto
      if (movie.poster_path) {
        document.getElementById('movie-modal-poster-area').innerHTML =
          `<img class="movie-modal-poster" src="https://image.tmdb.org/t/p/w780${movie.poster_path}" alt="${m.name}">`;
      }
      const videos  = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${TMDB_KEY}&language=pt-BR`, { signal });
      if (fetchId !== _movieFetchId) return; // APP-8: guard após fetch de vídeos PT-BR
      const vData   = await videos.json();
      let trailer   = vData.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');

      if (!trailer) {
        const vEn     = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${TMDB_KEY}`, { signal });
        if (fetchId !== _movieFetchId) return; // APP-8: guard após fetch de vídeos EN
        const vEnData = await vEn.json();
        trailer       = vEnData.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
      }

      document.getElementById('movie-modal-trailer').innerHTML = trailer
        ? `<iframe width="100%" height="220" src="https://www.youtube.com/embed/${trailer.key}?autoplay=0&rel=0" frameborder="0" sandbox="allow-scripts allow-same-origin allow-presentation" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius:16px;display:block;"></iframe>`
        : '<p style="text-align:center;color:#c9a9b0;font-size:0.85rem;font-style:italic;">Trailer não encontrado 😕</p>';
    } else {
      document.getElementById('movie-modal-trailer').innerHTML =
        '<p style="text-align:center;color:#c9a9b0;font-size:0.85rem;font-style:italic;">Filme não encontrado 😕</p>';
    }
  } catch (e) {
    if (e.name === 'AbortError') return; // BUG-M2: fetch abortado intencionalmente — não mostrar erro
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
      <div class="movie-modal-comment-author">${sanitizeHTML(c.author)} ${c.author === 'Pietro' ? '💙' : '💗'}</div>
      <div class="movie-modal-comment-text">${sanitizeHTML(c.text)}</div>`;
    list.appendChild(div);
  });
}

let _addingMovieComment = false;
async function addMovieComment() {
  if (_addingMovieComment) return;
  const input = document.getElementById('movie-modal-comment-input');
  const text  = input?.value.trim();
  if (!text || movieModalIndex === null) return;
  _addingMovieComment = true;
  try {
    const movies = await getMovies();
    if (!movies[movieModalIndex].comments) movies[movieModalIndex].comments = [];
    movies[movieModalIndex].comments.push({ author: movieModalAuthor, text });
    await saveMovies(movies);
    if (input) input.value = '';
    renderMovieComments(movies[movieModalIndex].comments);
    showToast('💬 Comentário adicionado!');
  } finally {
    _addingMovieComment = false;
  }
}

let _deletingMovieComment = false;
async function deleteMovieComment(i) {
  if (movieModalIndex === null) return;
  if (_deletingMovieComment) return;
  if (!confirm('Remover este comentário?')) return;
  _deletingMovieComment = true;
  try {
    const movies = await getMovies();
    if (!movies[movieModalIndex]) return;
    if (!movies[movieModalIndex].comments) movies[movieModalIndex].comments = [];
    movies[movieModalIndex].comments.splice(i, 1);
    await saveMovies(movies);
    renderMovieComments(movies[movieModalIndex].comments);
  } finally {
    _deletingMovieComment = false;
  }
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

// FIX Bug Enter: movie-input e movie-modal-comment-input respondem à tecla Enter
document.getElementById('movie-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addMovie(); } });
document.getElementById('movie-modal-comment-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addMovieComment(); } });

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
    // Reset author para Pietro ao desbloquear
    muralAuthor = 'Pietro';
    document.getElementById('btn-pietro')?.classList.add('active');
    document.getElementById('btn-emilly')?.classList.remove('active');
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
let _muralPhotoUrl = null;
let _uploadingMuralPhoto = false;

async function getMural() {
  if (!MURAL_DOC) return { msgs: [], lastClean: null }; // db null guard
  try {
    const snap = await getDoc(MURAL_DOC);
    if (snap.exists()) return { msgs: snap.data().msgs || [], lastClean: snap.data().lastClean || null };
  } catch (e) {}
  return { msgs: [], lastClean: null };
}

async function saveMural(msgs, lastClean) {
  if (!MURAL_DOC) return; // db null guard
  // FIX: não faz segundo getDoc — recebe lastClean como parâmetro explícito
  // Quando lastClean é undefined (ex: addMural não quer mudar), lê do estado em cache
  const payload = {
    msgs,
    lastClean: lastClean !== undefined ? lastClean : (_muralLastCleanCache || null),
  };
  await setDoc(MURAL_DOC, payload);
}

// Cache do lastClean para evitar race condition entre addMural e renderMural
let _muralLastCleanCache = null;

function _muralTodayStr() {
  // Sempre usa horário LOCAL do dispositivo (não UTC) — importante para Brasil UTC-3
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// FIX Bug 10: flag que indica se renderMural já rodou ao menos uma vez e populou _muralLastCleanCache
let _muralInitialized = false;

// APP-2: limpeza diária integrada ao render — uma única chamada getMural()
async function renderMural() {
  const list = document.getElementById('mural-list');
  if (!list) return;

  let { msgs, lastClean } = await getMural();
  _muralLastCleanCache = lastClean; // atualiza cache
  _muralInitialized = true; // FIX Bug 10: agora é seguro chamar saveMural(msgs) sem lastClean explícito

  const today = _muralTodayStr();
  // FIX: só limpa se lastClean for de um dia ANTERIOR (não apenas diferente de today)
  // Isso evita limpar quando lastClean é null (primeiro acesso) mas há mensagens novas
  // O mural só deve ser limpo na virada real do dia
  if (lastClean !== null && lastClean !== today) {
    // Virada real do dia: limpa mensagens
    _muralLastCleanCache = today;
    await saveMural([], today);
    if (msgs.length > 0) showToast('🧹 Mural limpo! Novo dia, novos recados 💕');
    msgs = [];
  } else if (lastClean === null) {
    // Primeiro acesso ou deploy sem lastClean: registra hoje como data base
    // sem apagar as mensagens existentes — elas serão limpas na próxima virada do dia
    _muralLastCleanCache = today;
    // M-04: só escreve se houver mensagens; evita write desnecessário (e possível race)
    // quando é o primeiro acesso e o mural ainda está vazio
    if (msgs.length > 0) await saveMural(msgs, today);
    else _muralLastCleanCache = today; // atualiza cache local sem tocar o Firebase
  }
  // Se lastClean === today: mural já está atualizado, sem escrita desnecessária no Firebase
  list.innerHTML = '';

  if (msgs.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:#c9a9b0;font-style:italic;">Nenhum recado ainda... Seja o primeiro! 💌</p>';
    return;
  }

  msgs.forEach((m, i) => {
    const div = document.createElement('div');
    div.className = 'mural-msg ' + m.author.toLowerCase();
    let mediaHTML = '';
    if (m.photo) {
      // BUG-H1: sanitizeHTML escapa & em URLs → window.open receberia &amp; literal
      // Usar sanitizeHTML só no atributo src (contexto HTML); onclick usa a URL bruta via dataset
      const safePhotoSrc = sanitizeHTML(m.photo);
      mediaHTML = `<img src="${safePhotoSrc}" alt="foto" data-photourl="${safePhotoSrc}" style="width:100%;max-height:220px;object-fit:cover;border-radius:12px;margin:0.6rem 0;cursor:pointer;" onclick="window.open(this.dataset.photourl,'_blank')" onerror="this.style.display='none'">`;
    }
    div.innerHTML = `
      <button class="mural-msg-del" onclick="deleteMural('${m.id || String(i)}')">✕</button>
      <div class="mural-msg-author">${sanitizeHTML(m.author)} ${m.author === 'Pietro' ? '💙' : '💗'}</div>
      ${mediaHTML}
      <div class="mural-msg-text">${sanitizeHTML(m.text)}</div>
      <div class="mural-msg-date">${m.date || ''}</div>`;
    list.appendChild(div);
  });
}

// Upload de foto para o mural via ImgBB
async function uploadMuralPhoto(file) {
  if (_uploadingMuralPhoto) return;
  _uploadingMuralPhoto = true;
  const statusEl = document.getElementById('mural-photo-status');
  const previewEl = document.getElementById('mural-photo-preview');
  if (statusEl) statusEl.textContent = '⏳ Enviando foto...';
  try {
    const compressed = await compressImage(file);
    const form = new FormData();
    form.append('image', compressed);
    form.append('key', IMGBB_KEY);
    const res  = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: form });
    const data = await res.json();
    if (data.success) {
      _muralPhotoUrl = data.data.url;
      if (statusEl) statusEl.textContent = '✅ Foto pronta!';
      if (previewEl) {
        previewEl.innerHTML = `<img src="${_muralPhotoUrl}" style="width:100%;max-height:160px;object-fit:cover;border-radius:12px;margin-top:0.5rem;">
          <button onclick="removeMuralPhoto()" style="background:none;border:none;color:#e8536f;cursor:pointer;font-size:0.8rem;margin-top:0.3rem;">✕ Remover foto</button>`;
      }
    } else {
      _muralPhotoUrl = null; // BUG-L1: limpa URL antiga para não enviar foto de tentativa anterior
      if (statusEl) statusEl.textContent = '❌ Erro no upload';
    }
  } catch(e) {
    _muralPhotoUrl = null; // BUG-L1: limpa na exceção de rede também
    if (statusEl) statusEl.textContent = '❌ Erro no upload';
  } finally {
    _uploadingMuralPhoto = false;
  }
}

window.removeMuralPhoto = function() {
  _muralPhotoUrl = null;
  const statusEl = document.getElementById('mural-photo-status');
  const previewEl = document.getElementById('mural-photo-preview');
  if (statusEl) statusEl.textContent = '';
  if (previewEl) previewEl.innerHTML = '';
};

let _addingMural = false;
async function addMural() {
  if (_addingMural) return;
  // FIX Bug 10: se renderMural ainda não rodou, o _muralLastCleanCache é null e saveMural
  // salvaria lastClean: null no Firebase, perdendo a data de controle de limpeza diária
  if (!_muralInitialized) { showToast('⏳ Aguarda o mural carregar...'); return; }
  const input = document.getElementById('mural-input');
  const text  = input?.value.trim();
  if (!text && !_muralPhotoUrl) { showToast('✏️ Escreve um recado ou adiciona uma foto!'); return; }
  _addingMural = true;
  try {
    const { msgs } = await getMural();
    const date = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    // FIX: id estável (timestamp+random) para deletar pela mensagem certa mesmo se outra for adicionada/removida em paralelo
    const msgId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const msg = { id: msgId, author: muralAuthor, text: text || '', date };
    if (_muralPhotoUrl) msg.photo = _muralPhotoUrl;
    msgs.push(msg);
    // FIX: limita a 50 mensagens por dia para não estourar o Firestore
    if (msgs.length > 50) msgs.splice(0, msgs.length - 50);
    await saveMural(msgs);
    if (input) input.value = '';
    _muralPhotoUrl = null;
    window.removeMuralPhoto();
    renderMural();
    showToast('💌 Recado enviado com amor!');
    try { window.awardCoins('mural', 15, muralAuthor); } catch(e) {}
  } finally {
    _addingMural = false;
  }
}

let _deletingMural = false;
async function deleteMural(idOrIndex) {
  if (_deletingMural) return;
  if (!confirm('Remover este recado?')) return;
  _deletingMural = true;
  try {
    const { msgs } = await getMural();
    // FIX: busca por id estável — se não encontrar (msgs antigas sem id), cai no índice numérico
    const byId = msgs.findIndex(m => m.id === idOrIndex);
    const idx  = byId !== -1 ? byId : Number(idOrIndex);
    // BUG-M3: Number() de um id alfanumérico retorna NaN → guard explícito
    if (Number.isNaN(idx) || idx < 0 || idx >= msgs.length) return;
    msgs.splice(idx, 1);
    await saveMural(msgs);
    renderMural();
  } finally { _deletingMural = false; }
}

function selectAuthor(name) {
  muralAuthor = name;
  document.getElementById('btn-pietro')?.classList.toggle('active', name === 'Pietro');
  document.getElementById('btn-emilly')?.classList.toggle('active', name === 'Emilly');
}

// Input de foto do mural
document.getElementById('mural-photo-input')?.addEventListener('change', function() {
  if (this.files?.[0]) uploadMuralPhoto(this.files[0]);
});

window.addMural     = addMural;
window.deleteMural  = deleteMural;
window.selectAuthor = selectAuthor;

// FIX Bug Enter: mural-input responde à tecla Enter (Ctrl+Enter para não conflitar com quebras de linha)
document.getElementById('mural-input')?.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); addMural(); } });

/* ════════════════════════════════════════════
   SONHOS
   ════════════════════════════════════════════ */
const INITIAL_DREAMS = [
  { text: "Ter uma vida sem fingimentos, onde possamos nos amar de verdade", done: false },
  { text: "Que Deus abençoe nosso namoro e nos dê uma união linda e verdadeira", done: false },
  { text: "Ter uma felicidade genuína juntos, como a que sinto quando estou ao teu lado", done: false },
];

async function getDreams() {
  if (!DREAMS_DOC) return INITIAL_DREAMS; // APP-13
  try {
    const snap = await getDoc(DREAMS_DOC);
    if (snap.exists()) return snap.data().dreams || INITIAL_DREAMS;
  } catch (e) {}
  return INITIAL_DREAMS;
}

async function saveDreams(d) {
  if (!DREAMS_DOC) { showToast('❌ Banco de dados indisponível.'); return; }
  try {
    await setDoc(DREAMS_DOC, { dreams: d });
  } catch (err) {
    showToast('❌ Erro ao salvar sonhos. Tente novamente.', 4000);
    throw err;
  }
}

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
      <div class="dream-text">${sanitizeHTML(dream.text)}</div>
      <button class="dream-del" onclick="deleteDream(${i})">✕</button>`;
    list.appendChild(item);
  });
}

let _addingDream = false;
async function addDream() {
  if (_addingDream) return;
  const input = document.getElementById('dream-input');
  const text  = input?.value.trim();
  if (!text) { showToast('✏️ Escreve um sonho!'); return; }
  _addingDream = true;
  try {
    const dreams = await getDreams();
    dreams.push({ text, done: false });
    await saveDreams(dreams);
    if (input) input.value = '';
    renderDreams();
    showToast('🌟 Sonho adicionado!');
  } finally {
    _addingDream = false;
  }
}

async function toggleDream(i) {
  try {
    const dreams = await getDreams();
    dreams[i].done = !dreams[i].done;
    await saveDreams(dreams);
    renderDreams();
    if (dreams[i].done) showToast('✨ Sonho realizado!');
  } catch (err) {
    showToast('❌ Erro ao salvar. Tente novamente.', 4000);
  }
}

let _deletingDream = false;
async function deleteDream(i) {
  if (_deletingDream) return;
  if (!confirm('Remover este sonho?')) return;
  _deletingDream = true;
  try {
    const dreams = await getDreams();
    dreams.splice(i, 1);
    await saveDreams(dreams);
    renderDreams();
  } finally { _deletingDream = false; }
}

window.addDream    = addDream;
window.toggleDream = toggleDream;
window.deleteDream = deleteDream;
renderDreams();

// FIX Bug Enter: dream-input responde à tecla Enter
document.getElementById('dream-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addDream(); } });

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

const STICKER_CATS = ['princesas','princes','crepusculo','marvel'];

function renderMoodGrid() {
  const grid = document.getElementById('mood-grid');
  if (!grid) return;

  if (moodActiveTab === 'emojis') {
    grid.classList.remove('mood-grid--sticker');
    grid.innerHTML = MOOD_OPTIONS.map((m, i) => `
      <div class="mood-option" onclick="selectMoodOption(${i})" id="mood-opt-${i}">
        <span class="mood-option-emoji">${m.emoji}</span>
        <span class="mood-option-label">${m.label}</span>
      </div>`).join('');
    return;
  }

  if (STICKER_CATS.includes(moodActiveTab)) {
    const list = (window._STICKERS?.[moodActiveTab]) || [];
    grid.classList.add('mood-grid--sticker');
    grid.innerHTML = `<div class="mood-sticker-grid-inner">${list.map((s) => `
      <div class="mood-sticker-pick" data-sid="${sanitizeHTML(String(s.id))}" data-cat="${sanitizeHTML(moodActiveTab)}" onclick="selectStickerOption(this)">
        <img src="${sanitizeHTML(s.file)}" alt="${sanitizeHTML(s.label)}" class="mood-sticker-pick-img" onerror="this.style.opacity='0.3';this.title='Imagem não encontrada'">
        <div class="mood-sticker-pick-label">${sanitizeHTML(s.name)}</div>
      </div>`).join('')}
    </div>`;
    return;
  }
}

function openMoodPicker(person) {
  moodPickerTarget   = person;
  moodPickerSelected = null;
  moodActiveTab      = 'emojis';

  document.getElementById('mood-picker-title').textContent = `${person}, como você está hoje?`;
  document.querySelectorAll('.mood-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('mood-tab-emojis')?.classList.add('active');
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
  document.querySelectorAll('.mood-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(`mood-tab-${tab}`)?.classList.add('active');
  renderMoodGrid();
  // BUG-6 FIX: reset scroll ao trocar de aba
  const grid = document.getElementById('mood-sticker-grid-inner');
  if (grid) grid.scrollTop = 0;
}

function selectMoodOption(i) {
  document.querySelectorAll('.mood-option').forEach(el => el.classList.remove('selected'));
  document.getElementById(`mood-opt-${i}`)?.classList.add('selected');
  moodPickerSelected = MOOD_OPTIONS[i];
}

function selectStickerOption(el) {
  document.querySelectorAll('.mood-sticker-pick').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  const sid = el.dataset.sid;
  const cat = el.dataset.cat;
  const s = (window._STICKERS?.[cat] || []).find(x => x.id === sid);
  if (s) moodPickerSelected = { emoji: '🎭', label: s.label, file: s.file, isSticker: true };
}

let _savingMood = false;
async function confirmMood() {
  if (!moodPickerSelected || !moodPickerTarget) {
    showToast('😊 Escolhe uma opção primeiro!'); return;
  }
  if (_savingMood) return;
  if (!MOOD_DOC) { showToast('❌ Banco de dados indisponível.'); return; } // guard db null
  _savingMood = true;
  try {
  // BUG-3 FIX: captura todos os valores de moodPickerSelected ANTES do primeiro
  // await. O usuário pode fechar o picker (closeMoodPicker zerando moodPickerSelected
  // para null) enquanto getDoc aguarda, causando "Cannot read properties of null".
  const person      = moodPickerTarget.toLowerCase();
  const _selEmoji   = moodPickerSelected.emoji;
  const _selLabel   = moodPickerSelected.label;
  const _selFile    = moodPickerSelected.file    || null;
  const _selSticker = moodPickerSelected.isSticker || false;
  const now    = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const snap   = await getDoc(MOOD_DOC).catch(() => null);
  const current = (snap?.exists() ? snap.data() : {});
  current[person] = {
    emoji: _selEmoji,
    label: _selLabel,
    file:  _selFile,
    isSticker: _selSticker,
    time: now
  };

  // Adiciona ao histórico (máximo 7 entradas)
  // FIX: usar ISO YYYY-MM-DD como key para evitar duplicatas por diferença de locale entre dispositivos
  const _nd = new Date();
  const today = `${_nd.getFullYear()}-${String(_nd.getMonth()+1).padStart(2,'0')}-${String(_nd.getDate()).padStart(2,'0')}`;
  // label legível separado, só para exibição
  const todayLabel = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  if (!current.history) current.history = [];
  // Remove entrada do dia de hoje se já existe (compara pela key ISO ou pelo label legível)
  // FIX Bug D: também checa h._dateKey para entradas antigas que tinham ISO em h.date
  current.history = current.history.filter(h =>
    h._dateKey !== today && h.date !== today && h.date !== todayLabel
  );
  current.history.unshift({
    date: todayLabel, // mantém label legível para display, mas key de dedup agora é ISO
    _dateKey: today,  // key ISO para comparação futura
    pietro: current.pietro ? { emoji: current.pietro.emoji, label: current.pietro.label, file: current.pietro.file || null, isSticker: current.pietro.isSticker || false } : null,
    emilly: current.emilly ? { emoji: current.emilly.emoji, label: current.emilly.label, file: current.emilly.file || null, isSticker: current.emilly.isSticker || false } : null,
  });
  current.history = current.history.slice(0, 7);

  await setDoc(MOOD_DOC, current);
  // BUG-3 FIX: usa os valores já capturados antes do primeiro await
  // (moodPickerSelected/moodPickerTarget podem ter sido zerados pelo usuário)
  const _toastPerson = moodPickerTarget || person;  // person já capturado antes do await
  closeMoodPicker();
  showToast(`${_selEmoji} Humor de ${_toastPerson} atualizado!`);

  // FIX Bug 1: atualiza UI imediatamente com os dados locais — sem esperar novo getDoc
  const _p = person; // já é lowercase
  const _d = current[_p];
  if (_d) {
    const box      = document.getElementById(`mood-box-${_p}`);
    const emojiEl  = document.getElementById(`mood-emoji-${_p}`);
    const labelEl  = document.getElementById(`mood-label-${_p}`);
    const timeEl   = document.getElementById(`mood-time-${_p}`);
    if (box)     box.classList.add('active-mood');
    if (emojiEl) {
      if (_d.isSticker && _d.file) {
        // BUG-4 FIX: sanitiza _d.file/_d.label antes de inserir no innerHTML (XSS)
        emojiEl.innerHTML = `<img src="${sanitizeHTML(_d.file)}" alt="${sanitizeHTML(_d.label)}" style="width:52px;height:52px;object-fit:contain;">`;
      } else {
        emojiEl.textContent = _d.emoji;
      }
    }
    if (labelEl) labelEl.textContent = _d.label;
    if (timeEl)  timeEl.textContent  = _d.time ? `às ${_d.time}` : '';
  }
  // Atualiza histórico em background (não bloqueia a UI)
  initMoodDisplay();

  // Moedas pela casinha — usa `person` (já é lowercase) em vez de moodPickerTarget
  // (closeMoodPicker() zeraria moodPickerTarget antes desta linha)
  try { window.awardCoins('mood', 15, person); } catch(e) {}
  } finally {
    _savingMood = false;
  }
}

async function initMoodDisplay() {
  if (!MOOD_DOC) return;
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
        if (emojiEl) {
          if (d.isSticker && d.file) {
            emojiEl.innerHTML = `<img src="${sanitizeHTML(d.file)}" alt="${sanitizeHTML(d.label)}" style="width:52px;height:52px;object-fit:contain;">`;
          } else {
            emojiEl.textContent = d.emoji;
          }
        }
        if (labelEl) labelEl.textContent = d.label;
        if (timeEl)  timeEl.textContent  = d.time ? `às ${d.time}` : '';
      }
    });
    // Renderiza histórico
    const histList = document.getElementById('mood-history-list');
    if (histList && data.history && data.history.length) {
      histList.innerHTML = data.history.map(h => {
        const pEmoji = h.pietro ? (h.pietro.isSticker && h.pietro.file ? `<img src="${sanitizeHTML(h.pietro.file)}" style="width:28px;height:28px;object-fit:contain;vertical-align:middle;">` : h.pietro.emoji) : '—';
        const eEmoji = h.emilly ? (h.emilly.isSticker && h.emilly.file ? `<img src="${sanitizeHTML(h.emilly.file)}" style="width:28px;height:28px;object-fit:contain;vertical-align:middle;">` : h.emilly.emoji) : '—';
        const pLabel = h.pietro?.label || '';
        const eLabel = h.emilly?.label || '';
        return `<div class="mood-history-item">
          <div class="mood-history-date">${sanitizeHTML(h.date)}</div>
          <div class="mood-history-emojis">
            <div class="mood-history-pair"><div class="mood-history-pair-name">Pietro</div><span title="${sanitizeHTML(pLabel)}">${pEmoji}</span></div>
            <div class="mood-history-pair"><div class="mood-history-pair-name">Emilly</div><span title="${sanitizeHTML(eLabel)}">${eEmoji}</span></div>
          </div>
        </div>`;
      }).join('');
    }
  } catch (e) {}
}

window.openMoodPicker   = openMoodPicker;
window.closeMoodPicker  = closeMoodPicker;
window.switchMoodTab    = switchMoodTab;
window.selectMoodOption = selectMoodOption;
window.selectStickerOption = selectStickerOption;
window.confirmMood      = confirmMood;
initMoodDisplay();

/* ════════════════════════════════════════════
   MENSAGENS ESPECIAIS
   ════════════════════════════════════════════ */
const specialFiles = { bday: { photo: null, audio: null }, 'bday-emilly': { photo: null, audio: null }, mesv: { photo: null, audio: null } };

function isBdayToday()       { const n = new Date(); return n.getMonth() === BDAY_MONTH        && n.getDate() === BDAY_DAY; }
function isEmillyBdayToday() { const n = new Date(); return n.getMonth() === EMILLY_BDAY_MONTH && n.getDate() === EMILLY_BDAY_DAY; }
function isMesvToday()       { return new Date().getDate() === ANNIVERSARY_DAY; }

function getCurrentCycleKey(type) {
  const n = new Date();
  if (type === 'bday')       return `bday_${n.getFullYear()}`;
  if (type === 'bday-emilly') return `bday_emilly_${n.getFullYear()}`;
  return `mesv_${n.getFullYear()}_${String(n.getMonth() + 1).padStart(2, '0')}`;
}

async function initSpecial(type) {
  const isOpen = type === 'bday' ? isBdayToday() : type === 'bday-emilly' ? isEmillyBdayToday() : isMesvToday();
  const ref      = type === 'bday' ? SPECIAL_BDAY_DOC : type === 'bday-emilly' ? SPECIAL_EMILLY_BDAY_DOC : SPECIAL_MESV_DOC;
  if (!ref) { // APP-9: Firebase falhou, mostra estado padrão
    const lockedEl = document.getElementById(`special-${type}-locked`);
    const openEl   = document.getElementById(`special-${type}-open`);
    if (openEl) openEl.style.display = 'none';
    if (lockedEl) lockedEl.style.display = 'block';
    return;
  }
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
    if (prevEl) {
      // M-05: revogar todos os blob URLs antes de limpar o preview (evita memory leak)
      prevEl.querySelectorAll('img[src^="blob:"], audio[src^="blob:"]').forEach(el => {
        URL.revokeObjectURL(el.src);
      });
      prevEl.innerHTML = '';
    }
  }

  // 4 estados possíveis:
  // !isOpen && !hasData → mostra cadeado normal (ainda não é o dia, carta não escrita)
  // !isOpen &&  hasData → mostra cadeado "carta guardada" (carta escrita, aguardando o dia)
  //  isOpen && !hasData → mostra cadeado "aguardando" (é o dia, mas Emilly ainda não escreveu)
  //  isOpen &&  hasData → mostra o conteúdo aberto
  const lockedEl = document.getElementById(`special-${type}-locked`);
  const openEl   = document.getElementById(`special-${type}-open`);

  openEl.style.display = (isOpen && hasData) ? 'block' : 'none';

  if (!isOpen && hasData) {
    // Carta guardada, aguardando o dia certo
    lockedEl.style.display = 'block';
    const hintEl = lockedEl.querySelector('.special-lock-hint');
    if (hintEl) hintEl.textContent = '💌 Mensagem guardada com carinho — abre no dia certo 🔒';
  } else if (isOpen && !hasData) {
    // É o dia, mas ainda sem carta
    lockedEl.style.display = 'block';
    const hintEl = lockedEl.querySelector('.special-lock-hint');
    if (hintEl) hintEl.textContent = '⏳ Ainda não tem mensagem guardada aqui...';
  } else if (!isOpen && !hasData) {
    lockedEl.style.display = 'block';
    const hintEl = lockedEl.querySelector('.special-lock-hint');
    // Restaura o texto original conforme o tipo
    if (hintEl) hintEl.textContent = type === 'bday' ? 'Abre no dia 9 de janeiro 🎁' : type === 'bday-emilly' ? 'Abre no dia 24 de abril 🎁' : 'Abre todo dia 11 🥂';
  } else {
    lockedEl.style.display = 'none';
  }

  if (isOpen && hasData) {
    const content = document.getElementById(`special-${type}-content`);
    if (content) {
      content.innerHTML = '';
      if (data.text)     content.innerHTML += `<div class="special-content-text">${sanitizeHTML(data.text)}</div>`;
      if (data.photoUrl) content.innerHTML += `<img src="${data.photoUrl}" alt="Foto especial" onerror="this.style.display='none'" style="max-width:100%;border-radius:12px;">`;
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
  try {
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', CLOUDINARY_PRESET);
    const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (status) {
      status.textContent = data.secure_url ? '✅ Enviado!' : '❌ Erro no upload';
      setTimeout(() => { status.textContent = ''; }, 2500);
    }
    return data.secure_url || null;
  } catch (err) {
    console.warn('[uploadSpecialFile] Erro:', err.message);
    if (status) {
      status.textContent = '❌ Falha no envio. Tente novamente.';
      setTimeout(() => { status.textContent = ''; }, 3000);
    }
    return null;
  }
}

const _savingSpecial = { bday: false, 'bday-emilly': false, mesv: false };
async function saveSpecial(type) {
  if (_savingSpecial[type]) return;
  _savingSpecial[type] = true;
  try {
  const ref      = type === 'bday' ? SPECIAL_BDAY_DOC : type === 'bday-emilly' ? SPECIAL_EMILLY_BDAY_DOC : SPECIAL_MESV_DOC;
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
  // M-05: revogar blob URLs do preview antes do reset do formulário
  const prevElSave = document.getElementById(`special-${type}-preview`);
  if (prevElSave) {
    prevElSave.querySelectorAll('img[src^="blob:"], audio[src^="blob:"]').forEach(el => URL.revokeObjectURL(el.src));
  }
  initSpecial(type);
  } finally {
    _savingSpecial[type] = false;
  }
}

['bday', 'bday-emilly', 'mesv'].forEach(type => {
  document.getElementById(`special-${type}-photo`)?.addEventListener('change', function () {
    const file = this.files[0]; if (!file) return;
    specialFiles[type].photo = file;
    const prevEl = document.getElementById(`special-${type}-preview`);
    if (prevEl) {
      // FIX: revogar URL anterior antes de criar nova (evita memory leak)
      const oldImg = prevEl.querySelector('img');
      if (oldImg?.src?.startsWith('blob:')) URL.revokeObjectURL(oldImg.src);
      const url = URL.createObjectURL(file);
      prevEl.innerHTML = `<img src="${url}">`;
    }
  });
  document.getElementById(`special-${type}-audio`)?.addEventListener('change', function () {
    const file = this.files[0]; if (!file) return;
    specialFiles[type].audio = file;
    const prevEl = document.getElementById(`special-${type}-preview`);
    if (prevEl) {
      // FIX: revogar URL anterior antes de criar nova (evita memory leak)
      const oldAudio = prevEl.querySelector('audio');
      if (oldAudio?.src?.startsWith('blob:')) URL.revokeObjectURL(oldAudio.src);
      const url = URL.createObjectURL(file);
      prevEl.innerHTML += `<audio controls src="${url}"></audio>`;
    }
  });
});

window.saveSpecial       = saveSpecial;
window.toggleSpecialSend = toggleSpecialSend;
initSpecial('bday');
initSpecial('bday-emilly');
initSpecial('mesv');

/* ════════════════════════════════════════════
   CALENDÁRIO
   ════════════════════════════════════════════ */
let calYear, calMonth, calCurrentKey, calAuthor = 'Pietro';
let calDayData   = {};
let calModalData = { text: '', media: [], comments: [] };

function calKey(y, m, d) { return `cal_${y}_${String(m + 1).padStart(2, '0')}_${String(d).padStart(2, '0')}`; }
function isBirthday(y, m, d) {
  return (m === EMILLY_BDAY_MONTH && d === EMILLY_BDAY_DAY) ||
         (m === BDAY_MONTH        && d === BDAY_DAY);
}

async function getCalDay(key) {
  if (!db) return { text: '', media: [], comments: [] };
  try {
    const ref  = doc(db, 'calendar', key);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data();
  } catch (e) {}
  return { text: '', media: [], comments: [] };
}

async function saveCalDayData(key, data) {
  if (!db) { showToast('❌ Banco de dados indisponível.'); return; }
  try {
    await setDoc(doc(db, 'calendar', key), data);
  } catch (err) {
    showToast('❌ Erro ao salvar o dia. Tente novamente.', 4000);
    throw err; // repropaga para saveCalDay liberar _savingCalDay
  }
}

async function renderCal() {
  const now   = new Date();
  const label = new Date(calYear, calMonth, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const labelEl = document.getElementById('cal-month-label');
  if (labelEl) labelEl.textContent = label.charAt(0).toUpperCase() + label.slice(1);

  const grid     = document.getElementById('cal-grid');
  if (!grid) return;
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const firstDay    = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  // FIX Bug renderCal: acumula TODO o HTML (incluindo cabeçalhos) num único string
  // e faz uma única atribuição ao DOM — sem grid.innerHTML += que força duplo re-parse.
  let html = dayNames.map(d => `<div class="cal-day-name">${d}</div>`).join('');
  for (let i = 0; i < firstDay; i++) html += `<div class="cal-day empty"></div>`;

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

    html += `<div class="${cls}" onclick="openCalModal(${d})">
      <div class="cal-day-num">${d}</div>${dot}${bIcon}
    </div>`;
  }
  grid.innerHTML = html;
}

async function loadCalMonth() {
  if (!db) { renderCal(); return; } // APP-6: guard db null
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
  // BUG-2 FIX: captura a key localmente para evitar race condition.
  // Se o usuário abre dois dias rapidamente, a segunda chamada sobrescrevia
  // calCurrentKey antes do await da primeira resolver, fazendo calModalData
  // conter dados do dia A enquanto calCurrentKey já apontava para o dia B.
  const thisKey = calKey(calYear, calMonth, d);
  calCurrentKey = thisKey;

  // Reset autor para Pietro a cada abertura
  calAuthor = 'Pietro';
  document.getElementById('cal-btn-pietro')?.classList.add('active');
  document.getElementById('cal-btn-emilly')?.classList.remove('active');
  const dateStr = new Date(calYear, calMonth, d).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const dateEl  = document.getElementById('cal-modal-date');
  if (dateEl) {
    dateEl.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    if (isBirthday(calYear, calMonth, d)) {
      const _isPietro = calMonth === BDAY_MONTH && d === BDAY_DAY;
      const _bdayName = _isPietro ? 'Pietro 💙' : 'Emilly 💗';
      dateEl.innerHTML += ' 🎂<br><span style=\'font-size:0.9rem;color:#856404;font-style:italic;\'>Feliz aniversário, ' + _bdayName + '! 💕</span>';
    }
  }

  // BUG-2 FIX: try-catch garante que calModalData nunca fique com dados
  // obsoletos se o Firebase lançar (ex: offline) — fallback para objeto vazio.
  try {
    calModalData = await getCalDay(thisKey);
  } catch (_) {
    calModalData = { text: '', media: [], comments: [] };
  }

  // Guard: se outra chamada abriu um dia diferente enquanto aguardávamos, descarta.
  if (calCurrentKey !== thisKey) return;

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
    // BUG-5 FIX: sanitiza m.url antes de inserir no src (XSS via URL maliciosa)
    const safeUrl = sanitizeHTML(m.url || '');
    div.innerHTML = m.type === 'video'
      ? `<video src="${safeUrl}" controls playsinline style="max-width:100%;border-radius:8px;"></video>`
      : `<img src="${safeUrl}" loading="lazy" style="max-width:100%;border-radius:8px;">`;
    div.innerHTML += `<button class="cal-media-del" onclick="removeCalMedia(${i})">✕</button>`;
    grid.appendChild(div);
  });
}

function removeCalMedia(i) {
  if (!confirm('Remover esta mídia?')) return;
  calModalData.media.splice(i, 1);
  renderCalMedia();
  // FIX Bug 3/12: persiste no Firebase E atualiza dot local imediatamente
  if (calCurrentKey) {
    calDayData[calCurrentKey] = !!(calModalData.text || calModalData.media?.length || calModalData.comments?.length);
    saveCalDayData(calCurrentKey, calModalData).catch(() => showToast('❌ Erro ao salvar mídia.', 3000));
  }
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
      <div class="cal-comment-author">${sanitizeHTML(c.author)} ${c.author === 'Pietro' ? '💙' : '💗'}</div>
      <div class="cal-comment-text">${sanitizeHTML(c.text)}</div>`;
    list.appendChild(div);
  });
}

function removeCalComment(i) {
  if (!confirm('Remover este comentário?')) return;
  calModalData.comments.splice(i, 1);
  renderCalComments();
  // FIX Bug 3/12: persiste no Firebase E atualiza dot local imediatamente
  if (calCurrentKey) {
    calDayData[calCurrentKey] = !!(calModalData.text || calModalData.media?.length || calModalData.comments?.length);
    saveCalDayData(calCurrentKey, calModalData).catch(() => showToast('❌ Erro ao salvar comentário.', 3000));
  }
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
  // FIX Bug 4/12: persiste no Firebase E atualiza dot local imediatamente
  if (calCurrentKey) {
    calDayData[calCurrentKey] = !!(calModalData.text || calModalData.media?.length || calModalData.comments?.length);
    saveCalDayData(calCurrentKey, calModalData).catch(() => showToast('❌ Erro ao salvar comentário.', 3000));
  }
}

const _calFileInput = document.getElementById('cal-file-input');
if (_calFileInput && !_calFileInput.dataset.listenerAttached) {
  _calFileInput.dataset.listenerAttached = '1';
  _calFileInput.addEventListener('change', async function () {
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
}

let _savingCalDay = false;
async function saveCalDay() {
  if (!calCurrentKey || _savingCalDay) return;
  _savingCalDay = true;
  try {
  calModalData.text = document.getElementById('cal-text')?.value.trim() || '';
  await saveCalDayData(calCurrentKey, calModalData);
  calDayData[calCurrentKey] = !!(calModalData.text || calModalData.media?.length || calModalData.comments?.length);
  renderCal();
  closeCalModal();
  showToast('💕 Dia salvo com carinho!');
  } finally {
    _savingCalDay = false;
  }
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

// FIX Bug Enter: cal-comment-input responde à tecla Enter
document.getElementById('cal-comment-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addCalComment(); } });

const _now = new Date();
calYear    = _now.getFullYear();
calMonth   = _now.getMonth();
loadCalMonth();

/* ════════════════════════════════════════════
   LOCALIZAÇÃO
   ════════════════════════════════════════════ */
let locData  = { pietro: null, emilly: null };
let _leafletMap = null;
let _leafletMarkers = {};
let _mapTimers = []; // Fix: armazena IDs dos timers para limpar antes de criar novos

// ── Carrega Leaflet (OpenStreetMap) se ainda não carregou ──
function _loadLeaflet(cb) {
  if (window.L) { cb(); return; }
  const link = document.createElement('link');
  link.rel  = 'stylesheet';
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
  document.head.appendChild(link);
  const s  = document.createElement('script');
  s.src    = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
  s.onload = cb;
  document.head.appendChild(s);
}

// ── Renderiza mapa OpenStreetMap via Leaflet ──
function renderEmbedMap() {
  const { pietro, emilly } = locData;
  const mapWrap = document.getElementById('location-map-wrap');
  const mapDiv  = document.getElementById('location-map');
  const ph      = document.getElementById('location-map-placeholder');
  if (!mapDiv || !mapWrap) return;
  if (!pietro?.lat && !emilly?.lat) return;

  // Mostra o mapa — garantir que o wrap tem height definido antes do Leaflet iniciar
  mapWrap.style.height = '280px';
  mapDiv.style.opacity = '1';
  mapDiv.style.pointerEvents = 'auto';
  if (ph) ph.style.display = 'none';

  _loadLeaflet(() => {
    const L = window.L;

    // A-04: se o container foi removido/reinserido no DOM (ex: SPA nav),
    // o Leaflet lança "Map container is already initialized". Destruir e recriar.
    if (_leafletMap) {
      try {
        if (!mapDiv.contains(_leafletMap.getContainer())) {
          _leafletMap.remove();
          _leafletMap = null;
          _leafletMarkers = {};
        }
      } catch(e) {
        _leafletMap = null;
        _leafletMarkers = {};
      }
    }

    if (!_leafletMap) {
      _leafletMap = L.map(mapDiv, { zoomControl: true, scrollWheelZoom: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(_leafletMap);
    }

    function makeIcon(color, label) {
      return L.divIcon({
        html: `<div style="background:${color};color:white;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:14px;font-weight:700;">${label}</span></div>`,
        iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -38], className: '',
      });
    }

    const configs = {
      pietro: { color: '#4a90d9', label: 'P', name: 'Pietro 💙' },
      emilly: { color: '#e8536f', label: 'E', name: 'Emilly 💗' },
    };

    const positions = [];
    ['pietro', 'emilly'].forEach(person => {
      const d = locData[person];
      if (!d?.lat) {
        // Remove marker fantasma se localização foi apagada
        if (_leafletMarkers[person]) {
          _leafletMap?.removeLayer(_leafletMarkers[person]);
          delete _leafletMarkers[person];
        }
        return;
      }
      const pos = [d.lat, d.lng];
      positions.push(pos);
      const cfg = configs[person];
      if (_leafletMarkers[person]) {
        _leafletMarkers[person].setLatLng(pos);
        _leafletMarkers[person].getPopup()?.setContent(
          `<div style="font-family:'DM Sans',sans-serif;font-size:0.9rem;color:#590d22;"><strong>${cfg.name}</strong><br>${sanitizeHTML(d.city || '')}</div>`
        );
      } else {
        _leafletMarkers[person] = L.marker(pos, { icon: makeIcon(cfg.color, cfg.label) })
          .addTo(_leafletMap)
          .bindPopup(`<div style="font-family:'DM Sans',sans-serif;font-size:0.9rem;color:#590d22;"><strong>${cfg.name}</strong><br>${sanitizeHTML(d.city || '')}</div>`);
      }
    });

    function fitMap() {
      if (positions.length === 2) {
        _leafletMap.fitBounds(positions, { padding: [40, 40] });
      } else if (positions.length === 1) {
        _leafletMap.setView(positions[0], 13);
      }
    }

    // Força recálculo de tamanho — limpa timers anteriores para evitar acúmulo
    _mapTimers.forEach(id => clearTimeout(id));
    _mapTimers = [];
    fitMap();
    _mapTimers.push(setTimeout(() => { if(_leafletMap){ _leafletMap.invalidateSize(true); fitMap(); } }, 120));
    _mapTimers.push(setTimeout(() => { if(_leafletMap){ _leafletMap.invalidateSize(true); fitMap(); } }, 450));
    _mapTimers.push(setTimeout(() => { if(_leafletMap){ _leafletMap.invalidateSize(true); fitMap(); } }, 950));
  });
}






// ── Distância entre os dois ──
function calcDistance(lat1, lng1, lat2, lng2) {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a    = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ── Reverse geocode usando a chave já configurada ──
async function reverseGeocode(lat, lng) {
  // Tenta Nominatim (OpenStreetMap) — sem restricao de dominio
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-BR`,
      { headers: { 'Accept-Language': 'pt-BR' } }
    );
    const d = await r.json();
    if (d && d.address) {
      const city  = d.address.city || d.address.town || d.address.municipality || d.address.village || '';
      const state = d.address.state || '';
      if (city) return state ? `${city}, ${state}` : city;
    }
  } catch (e) {}


  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

// ── Atualiza os cards de localização ──
function updateLocUI() {
  ['pietro', 'emilly'].forEach(person => {
    const d       = locData[person];
    // Overlay (sobre o mapa)
    const cityEl  = document.getElementById(`loc-city-${person}`);
    // Card detalhado abaixo do mapa
    const cityCard= document.getElementById(`loc-city-${person}-card`);
    const timeEl  = document.getElementById(`loc-time-${person}`);
    const cardEl  = document.getElementById(`loc-card-${person}`);
    const btnEl   = document.getElementById(`loc-btn-${person}`);

    if (d?.lat) {
      const rawCoords = /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(d.city || '');
      const cityText  = (!d.city || rawCoords) ? 'Identificando...' : d.city;
      if (cityEl)   cityEl.textContent  = cityText;
      if (cityCard) cityCard.textContent = (!d.city || rawCoords) ? 'Identificando cidade...' : d.city;
      if (timeEl)   timeEl.textContent  = d.updatedAt ? `Atualizado às ${d.updatedAt}` : '';
      cardEl?.classList.add('active-loc');
      if (btnEl) {
        const label = person === 'pietro' ? '👨 Pietro' : '👩 Emilly';
        btnEl.textContent = `📍 Atualizar ${person === 'pietro' ? 'Pietro' : 'Emilly'}`;
      }
      // Se cidade não identificada, busca com Nominatim agora
      // FIX Bug 8: debounce por pessoa evita setDoc duplo se dois snapshots chegarem quase simultâneos
      if (!d.city || rawCoords) {
        clearTimeout(updateLocUI._geoTimer?.[person]);
        if (!updateLocUI._geoTimer) updateLocUI._geoTimer = {};
        updateLocUI._geoTimer[person] = setTimeout(() => {
          reverseGeocode(d.lat, d.lng).then(async city => {
            if (cityEl)   cityEl.textContent  = city;
            if (cityCard) cityCard.textContent = city;
            if (!LOC_DOC) return; // guard db null
            const snap = await getDoc(LOC_DOC).catch(() => null);
            const curr = snap?.exists() ? snap.data() : {};
            if (curr[person]) { curr[person].city = city; await setDoc(LOC_DOC, curr); }
          }).catch(() => {});
        }, 400); // aguarda 400ms para descartar chamadas em rajada
      }
    } else {
      if (cityEl)   cityEl.textContent  = 'Sem localização';
      if (cityCard) cityCard.textContent = 'Sem localização ainda';
      if (timeEl)   timeEl.textContent  = '';
      cardEl?.classList.remove('active-loc');
      if (btnEl) btnEl.textContent = person === 'pietro' ? '📍 Atualizar Pietro' : '📍 Atualizar Emilly';
    }
  });

  // Distância — badge sobre o mapa
  const { pietro, emilly } = locData;
  const distDiv = document.getElementById('location-distance');
  const distNum = document.getElementById('loc-dist-num');
  if (pietro?.lat && emilly?.lat) {
    const km  = calcDistance(pietro.lat, pietro.lng, emilly.lat, emilly.lng);
    const str = km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
    if (distNum) distNum.textContent = str;
    distDiv?.classList.add('show');
  } else {
    distDiv?.classList.remove('show');
  }

  renderEmbedMap();
}

// ── Escuta Firebase em tempo real ──
if (LOC_DOC) onSnapshot(
  LOC_DOC,
  (snap) => {
    if (snap.exists()) {
      const data     = snap.data();
      locData.pietro = data.pietro || null;
      locData.emilly = data.emilly || null;
      updateLocUI();
    } else {
      // Documento não existe ainda — limpa UI
      locData = { pietro: null, emilly: null };
      updateLocUI();
    }
  },
  (err) => console.warn('[Firebase] onSnapshot localização:', err.message)
);

// ── Compartilhar localização ──
async function shareLocation(person) {
  const btn = document.getElementById(`loc-btn-${person}`);
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Obtendo localização...'; }

  if (!LOC_DOC) {
    showToast('❌ Banco de dados indisponível.');
    if (btn) { btn.disabled = false; btn.textContent = `📍 Atualizar ${person === 'pietro' ? 'Pietro' : 'Emilly'}`; }
    return;
  }

  if (!navigator.geolocation) {
    showToast('❌ Geolocalização não suportada neste navegador.');
    if (btn) { btn.disabled = false; btn.textContent = `📍 Atualizar ${person === 'pietro' ? 'Pietro' : 'Emilly'}`; }
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
      if (btn) { btn.disabled = false; btn.textContent = `📍 Atualizar ${person === 'pietro' ? 'Pietro' : 'Emilly'}`; }
      showToast(`📍 Localização de ${person === 'pietro' ? 'Pietro' : 'Emilly'} atualizada!`);
      try { window.awardCoins(`location_${person}`, 20, person); } catch(e) {}
    },
    (err) => {
      if (btn) { btn.disabled = false; btn.textContent = `📍 Atualizar ${person === 'pietro' ? 'Pietro' : 'Emilly'}`; }
      if (err.code === 1) showToast('❌ Permissão de localização negada.');
      else                showToast('❌ Não foi possível obter a localização.');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

window.shareLocation = shareLocation;

// ── FIX Bug Localização: IntersectionObserver para reforçar mapa quando section fica visível ──
// Problema: quando o onSnapshot dispara ao carregar a página, o #location-map-wrap
// ainda não está na viewport → Leaflet cria o mapa com tamanho 0 → pins não aparecem.
// Solução: re-renderizar e invalidar tamanho toda vez que a section entrar na tela.
(function initLocationObserver() {
  const wrap = document.getElementById('location-map-wrap');
  if (!wrap || typeof IntersectionObserver === 'undefined') return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && _leafletMap) {
        // Pequeno delay para garantir que a transição CSS terminou
        setTimeout(() => {
          _leafletMap.invalidateSize(true);
          const positions = [];
          ['pietro', 'emilly'].forEach(p => {
            if (locData[p]?.lat) positions.push([locData[p].lat, locData[p].lng]);
          });
          if (positions.length === 2) {
            _leafletMap.fitBounds(positions, { padding: [40, 40] });
          } else if (positions.length === 1) {
            _leafletMap.setView(positions[0], 13);
          }
        }, 150);
      } else if (entry.isIntersecting && !_leafletMap) {
        // Mapa ainda não inicializado mas há dados — tenta renderizar agora
        const { pietro, emilly } = locData;
        if (pietro?.lat || emilly?.lat) renderEmbedMap();
      }
    });
  }, { threshold: 0.1 });
  obs.observe(wrap);
})();

// Esconde o tip e carrega o mapa direto (chave já está no código)
// Mapa renderizado via Leaflet/OSM quando dados chegam do Firebase

/* ════════════════════════════════════════════
   EVENTOS SAZONAIS
   ════════════════════════════════════════════ */
(function initEventos() {
  const now   = new Date();
  const day   = now.getDate();
  const month = now.getMonth();
  const year  = now.getFullYear();

  // FIX Bug 2: usa as funções compartilhadas do módulo (_calcPascoa, _isPascoa, etc.)
  // em vez de redefinir localmente — garante lógica idêntica entre os dois IIFEs
  const dynamicChecks = {
    'pascoa':   () => _isPascoa(now),
    'carnaval': () => _isCarnaval(now),
    'dia-maes': () => _isDiaDasMaes(now),
    'dia-pais': () => _isDiaDossPais(now),
  };

  const evento = EVENTOS.find(e => {
    if (e.check) return e.check(day, month);
    return dynamicChecks[e.id] ? dynamicChecks[e.id]() : false;
  });

  if (!evento) return;

  document.body.classList.add('event-mode');
  document.body.setAttribute('data-event', evento.id);
  if (evento.dark) document.body.classList.add('dark-event');

  // ── Ativa playlist temática do evento ──
  if (evento.playlist) setEventPlaylist(evento.playlist);

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

  // Popup do evento só aparece para eventos que a carta de boas-vindas não cobre.
  // Aniversários e mesversário já têm popup personalizado no showWelcomeLetter.
  const skipPopup = ['aniv-pietro', 'aniv-emilly', 'mesversario'].includes(evento.id);

  if (!skipPopup) {
    setTimeout(() => {
      const overlay = document.createElement('div');
      overlay.id = '_evento-popup-overlay'; // FIX: id fixo para o botão fechar corretamente
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:1.5rem;animation:fadeIn .4s ease;';
      const _bannerText = sanitizeHTML(evento.banner.replace(/^[^\s]+ /, ''));
      const _popupText  = sanitizeHTML(evento.popup);
      const _accentColor = sanitizeHTML(evento.accent);
      overlay.innerHTML = `
        <div style="background:#fff8f9;border-radius:28px;padding:2.2rem 2rem;max-width:420px;width:100%;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,0.25);position:relative;animation:popIn .4s cubic-bezier(.32,1.2,.5,1)">
          <div style="font-size:3rem;margin-bottom:0.8rem">${evento.elements[0]}</div>
          <div style="font-family:'Playfair Display',serif;font-size:1.4rem;color:#590d22;margin-bottom:1rem;line-height:1.3">${_bannerText}</div>
          <p style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1.05rem;color:#7a3045;line-height:1.7;margin-bottom:1.5rem">${_popupText}</p>
          <button onclick="document.getElementById('_evento-popup-overlay')?.remove()" style="background:${_accentColor};color:white;border:none;padding:0.75rem 2rem;border-radius:50px;font-family:'DM Sans',sans-serif;font-size:0.95rem;font-weight:600;cursor:pointer">Com amor 💕</button>
        </div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

      // ── Toca música temática do evento ──
      const trackIdx = evento.musicIdx ?? 0;
      setTimeout(() => { try { window.playTrack(trackIdx); } catch(e) {} }, 1800);

    }, 1200);
  } else {
    // Mesmo sem popup, toca a música temática após a carta de boas-vindas fechar (~2.5s)
    const trackIdx = evento.musicIdx ?? 0;
    setTimeout(() => { try { window.playTrack(trackIdx); } catch(e) {} }, 2500);
  }

  // ── Efeitos especiais por tipo de evento ──
  function spawnElement() {
    // FIX Bug 11: limita elementos simultâneos no DOM para evitar acúmulo em sessões longas
    const existing = document.querySelectorAll('._event-spawn-el').length;
    if (existing >= 18) return; // no máximo 18 elementos de evento no DOM (reduzido para performance)

    const el = document.createElement('div');
    el.className = '_event-spawn-el'; // classe para contar e limpar
    el.textContent = evento.elements[Math.floor(Math.random() * evento.elements.length)];

    // Aniversários: elementos maiores e mais rápidos
    const isAniv = evento.id.startsWith('aniv-');
    const isMesv = evento.id === 'mesversario';
    const size   = isAniv ? Math.random()*24+16 : Math.random()*18+12;
    const speed  = isAniv ? Math.random()*4+3   : Math.random()*6+5;

    el.style.cssText = `position:fixed;left:${Math.random()*100}vw;top:-60px;font-size:${size}px;z-index:9996;pointer-events:none;animation:petalFall ${speed}s linear forwards;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 12000);
  }

  // Aniversários: efeito mais intenso (fogos)
  const isAniv = evento.id.startsWith('aniv-');
  const qty    = isAniv ? 14 : 9; // reduzido: era 30/18
  const rate   = isAniv ? 550 : 1100; // reduzido: era 300/700ms
  for (let i = 0; i < qty; i++) setTimeout(spawnElement, i * 200);
  // FIX Bug 5: intervalo gerenciado via _spawnIntervalId abaixo (pausa/retoma)

  // Fogos para aniversários — bolhas coloridas subindo
  if (isAniv) {
    function spawnFirework() {
      const colors = ['#ff6b9d','#c44dff','#4dc8ff','#ffd93d','#ff6b6b','#6bcb77'];
      for (let i = 0; i < 4; i++) { // reduzido: era 8 pontos
        const dot = document.createElement('div');
        const angle = (i / 8) * Math.PI * 2;
        const dist  = Math.random() * 80 + 40;
        dot.style.cssText = `
          position:fixed;
          left:${Math.random()*80+10}vw;
          top:${Math.random()*60+10}vh;
          width:8px;height:8px;
          border-radius:50%;
          background:${colors[Math.floor(Math.random()*colors.length)]};
          z-index:9995;pointer-events:none;
          transform:translate(0,0);
          transition:transform ${Math.random()*0.8+0.4}s ease-out, opacity 0.8s ease-out;
          opacity:1;
        `;
        document.body.appendChild(dot);
        setTimeout(() => {
          dot.style.transform = `translate(${Math.cos(angle)*dist}px,${Math.sin(angle)*dist}px)`;
          dot.style.opacity   = '0';
        }, 50);
        setTimeout(() => dot.remove(), 1200);
      }
    }
    for (let i = 0; i < 3; i++) setTimeout(spawnFirework, i * 500); // reduzido: era 6 bursts
    // FIX Bug 5: usa intervalo mutável para poder pausar E retomar ao voltar para a aba
    let _fireworkIntervalId = setInterval(spawnFirework, 4500); // era 2500ms
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearInterval(_fireworkIntervalId);
        _fireworkIntervalId = null;
      } else {
        // Retoma ao voltar para a aba — { once:true } impedia isso
        if (!_fireworkIntervalId) _fireworkIntervalId = setInterval(spawnFirework, 4500);
      }
    });
  }

  // FIX Bug 5: pausa E retoma o spawn de elementos ao minimizar/restaurar aba
  let _spawnIntervalId = setInterval(spawnElement, rate); // rate já reduzido acima
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearInterval(_spawnIntervalId);
      _spawnIntervalId = null;
    } else {
      if (!_spawnIntervalId) _spawnIntervalId = setInterval(spawnElement, rate);
    }
  });
})();

/* ════════════════════════════════════════════
   CARTA DE BOAS-VINDAS (aparece sempre ao entrar)
   ════════════════════════════════════════════ */
(function showWelcomeLetter() {
  // Só mostra uma vez por sessão
  if (sessionStorage.getItem('pe_welcome_shown')) return;
  sessionStorage.setItem('pe_welcome_shown', '1');

  const now     = new Date();
  const day     = now.getDate();
  const month   = now.getMonth();
  // B-03: normaliza ambas as datas para meia-noite UTC antes de subtrair,
  // evitando que o fuso horário (ex: UTC-3) cause diferença de ±1 dia.
  const nowUtcMidnight   = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const startRaw         = new Date(START_DATE);
  const startUtcMidnight = Date.UTC(startRaw.getUTCFullYear(), startRaw.getUTCMonth(), startRaw.getUTCDate());
  const dias    = Math.floor((nowUtcMidnight - startUtcMidnight) / 86400000);

  // Mensagem muda dependendo do dia
  const isMesv  = day === 11;
  const isAnivP = month === BDAY_MONTH       && day === BDAY_DAY;
  const isAnivE = month === EMILLY_BDAY_MONTH && day === EMILLY_BDAY_DAY;

  let titulo, corpo, emoji, cor;

  if (isAnivP) {
    titulo = 'Feliz Aniversário, Pietro! 🎂';
    emoji  = '🎂💙🎈';
    cor    = '#4a90d9';
    corpo  = `Hoje é o seu dia especial, Pietro. Que este aniversário seja cheio de alegria, amor e tudo de mais lindo que você merece. A Emilly está aqui, te amando muito. Com todo o carinho do mundo — Happy Birthday! 💙`;
  } else if (isAnivE) {
    titulo = 'Feliz Aniversário, Emilly! 🎂';
    emoji  = '🎂💗🎀';
    cor    = '#e8536f';
    corpo  = `Hoje é o seu dia, Emilly. Você é a pessoa mais especial, mais linda, e mais incrível que o Pietro já encontrou. Que este dia seja tão maravilhoso quanto você é. Com todo o amor — Happy Birthday! 💗`;
  } else if (isMesv) {
    titulo = `${dias} dias juntos 🥂`;
    emoji  = '💕🥂🌸';
    cor    = '#e8536f';
    corpo  = `Mais um mesversário chegou. São ${dias} dias de uma história linda, de escolhas feitas todo dia, de amor que cresce sem parar. Pietro & Emilly — para sempre. 💕`;
  } else {
    titulo = 'Olá, meu amor 💕';
    emoji  = '🌸💕✨';
    cor    = '#e8536f';
    corpo  = `Bem-vindo ao nosso cantinho especial. Aqui guardo cada memória, cada sorriso, cada momento que passamos juntos. São já ${dias} dias de uma história que eu jamais vou esquecer.\n\nVocê é minha parte favorita de cada dia.\n\nCom todo o meu amor — Pietro 💕`;
  }

  setTimeout(() => {
    const overlay = document.createElement('div');
    overlay.id = 'welcome-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(89,13,34,0.7);backdrop-filter:blur(8px);z-index:99998;display:flex;align-items:center;justify-content:center;padding:1.5rem;animation:fadeIn .5s ease;';
    overlay.innerHTML = `
      <div style="background:linear-gradient(145deg,#fff8f9,#fff0f3);border-radius:32px;padding:2.5rem 2rem;max-width:440px;width:100%;text-align:center;box-shadow:0 40px 100px rgba(89,13,34,0.35);position:relative;animation:popIn .5s cubic-bezier(.32,1.2,.5,1)">
        <div style="font-size:2.5rem;margin-bottom:0.6rem;letter-spacing:4px">${emoji}</div>
        <div style="font-family:'Playfair Display',serif;font-size:1.5rem;color:#590d22;margin-bottom:1.2rem;line-height:1.3;font-weight:700">${titulo}</div>
        <div style="width:40px;height:2px;background:${cor};margin:0 auto 1.2rem;border-radius:2px"></div>
        <p style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1.08rem;color:#7a3045;line-height:1.85;margin-bottom:1.8rem;white-space:pre-line">${corpo}</p>
        <button id="welcome-close-btn" style="background:linear-gradient(135deg,${cor},${cor}cc);color:white;border:none;padding:0.8rem 2.2rem;border-radius:50px;font-family:'DM Sans',sans-serif;font-size:0.95rem;font-weight:600;cursor:pointer;box-shadow:0 4px 20px ${cor}55;transition:transform .2s">Entrar com amor 💕</button>
        <div style="margin-top:1rem;font-family:'DM Sans',sans-serif;font-size:0.75rem;color:#b06070;opacity:0.7">Pietro & Emilly · Juntos desde 11/10/2024</div>
      </div>`;
    document.body.appendChild(overlay);

    function closeWelcome() {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        overlay.remove();
        // Sinaliza que a carta foi dispensada — popup diário pode abrir agora
        // (cancela o timer de 8.5s e abre em 1s)
        window._welcomeClosed = true;
      }, 300);
    }
    document.getElementById('welcome-close-btn').addEventListener('click', closeWelcome);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeWelcome(); });

    // Toca música ao abrir a carta (se não tiver evento ativo)
    if (!document.body.classList.contains('event-mode')) {
      setTimeout(() => { try { window.playTrack(0); } catch(err) {} }, 1500);
    }
  }, 800);
})();

/* ════════════════════════════════════════════
   PWA MANIFEST
   BUG-SW1 FIX: manifest.json agora é um arquivo estático com href definido
   diretamente no HTML (<link rel="manifest" href="manifest.json">).
   A injeção via blob URL foi removida pois blob URLs:
     1. Não são cacheáveis pelo Service Worker
     2. Mudam a cada carregamento (URL diferente)
     3. Podem falhar em alguns browsers para manifests PWA
   ════════════════════════════════════════════ */
