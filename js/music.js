/* ═══════════════════════════════════════════════
   PIETRO & EMILLY — music.js
   Player YouTube · Playlist · Mini Player
   ═══════════════════════════════════════════════ */

import { PLAYLIST } from './config.js';
import { showToast } from './ui.js';

// ── Estado do player ──
let ytPlayer       = null;
let ytReady        = false;
let currentIdx     = -1;
let isPlaying      = false;
let pendingIdx     = null;
let miniPlayerOpen = false;

// ── Playlist ativa (pode ser trocada por evento) ──
let activePlaylist = PLAYLIST;

const ADDED_TRACKS_KEY = 'nt_music_added_tracks_v1';
const REMOVED_TRACKS_KEY = 'nt_music_removed_tracks_v1';
let pendingExternalTrack = null;
let usingEventPlaylist = false;

function readSavedArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch (_) { return []; }
}
function restoreUserPlaylist() {
  const removed = new Set(readSavedArray(REMOVED_TRACKS_KEY).filter(value => typeof value === 'string'));
  const added = readSavedArray(ADDED_TRACKS_KEY)
    .filter(track => track && /^[a-zA-Z0-9_-]{11}$/.test(String(track.ytId || '')))
    .map(track => ({ name: String(track.name || 'Música').slice(0, 120), artist: String(track.artist || 'Artista não informado').slice(0, 80), ytId: String(track.ytId) }));
  return [...PLAYLIST.filter(track => !removed.has(track.ytId)), ...added.filter(track => !PLAYLIST.some(base => base.ytId === track.ytId))];
}
function persistUserPlaylist() {
  if (usingEventPlaylist) return;
  const baseIds = new Set(PLAYLIST.map(track => track.ytId));
  const currentIds = new Set(activePlaylist.map(track => track.ytId));
  const added = activePlaylist.filter(track => !baseIds.has(track.ytId));
  const removed = PLAYLIST.filter(track => !currentIds.has(track.ytId)).map(track => track.ytId);
  try {
    localStorage.setItem(ADDED_TRACKS_KEY, JSON.stringify(added));
    localStorage.setItem(REMOVED_TRACKS_KEY, JSON.stringify(removed));
  } catch (_) {}
}
activePlaylist = restoreUserPlaylist();


export function setEventPlaylist(playlist) {
  usingEventPlaylist = Boolean(playlist && playlist.length);
  activePlaylist = usingEventPlaylist ? playlist.slice() : restoreUserPlaylist();
  renderPlaylist();
  renderMiniPlayerList();
}

// ── Carrega a YouTube IFrame API ──
export function loadYTApi() {
  if (document.getElementById('yt-api-script')) return;
  const s   = document.createElement('script');
  s.id      = 'yt-api-script';
  s.src     = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(s);
}

// Callback global chamado pela API do YouTube
window.onYouTubeIframeAPIReady = function () {
  ytPlayer = new YT.Player('yt-player-div', {
    height: '220',
    width:  '100%',
    playerVars: { rel: 0, modestbranding: 1, playsinline: 1, controls: 1 },
    events: {
      onReady: () => {
        ytReady = true;
        if (pendingExternalTrack) {
          const track = pendingExternalTrack;
          pendingExternalTrack = null;
          _doPlayExternal(track);
        } else if (pendingIdx !== null) {
          const idx = pendingIdx;
          pendingIdx = null;
          _doPlay(idx);
        }
      },
      onStateChange: (e) => {
        const icon = document.getElementById('mini-play-icon');
        // FIX Bug B: também sincroniza o ícone da barra de evento sazonal
        const eventIcon = document.getElementById('event-music-toggle');
        if (e.data === YT.PlayerState.PLAYING) {
          isPlaying = true;
          if (icon) icon.textContent = '⏸';
          if (eventIcon) eventIcon.textContent = '⏸';
        } else if ([YT.PlayerState.PAUSED, YT.PlayerState.ENDED, YT.PlayerState.CUED].includes(e.data)) {
          isPlaying = false;
          if (icon) icon.textContent = '▶';
          if (eventIcon) eventIcon.textContent = '▶';
        }
        if (e.data === YT.PlayerState.ENDED) playNext();
      },
      onError: () => {
        showToast('⚠️ Não foi possível reproduzir. Tente outra música.');
        isPlaying = false;
        const icon = document.getElementById('mini-play-icon');
        if (icon) icon.textContent = '▶';
        // Bug I fix: avança para próxima e garante que a classe ativa fica correta
        const nextIdx = (currentIdx + 1) % activePlaylist.length;
        if (activePlaylist.length > 1) {
          playTrack(nextIdx);
        } else {
          _updateActiveClass(currentIdx);
        }
      }
    }
  });
};

// ── Funções internas ──
function _doPlay(idx) {
  currentIdx = idx;
  const track = activePlaylist[idx];
  if (!track) return;

  // Mostra área do player
  const area = document.getElementById('yt-embed-area');
  if (area) {
    area.style.display = 'block';
    if (!('ontouchstart' in window)) {
      setTimeout(() => area.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }
  }

  ytPlayer.loadVideoById({ videoId: track.ytId });
  _updateBarUI(track);
  _updateActiveClass(idx);
  showToast(`🎵 ${track.name} — ${track.artist}`);
}

function _updateBarUI(track) {
  const nameEl   = document.getElementById('mini-track-name');
  const artistEl = document.getElementById('mini-track-artist');
  const barEl    = document.getElementById('mini-player-bar');
  const iconEl   = document.getElementById('mini-play-icon');

  if (nameEl)   nameEl.textContent   = track.name;
  if (artistEl) artistEl.textContent = track.artist;
  if (barEl)    barEl.style.display  = 'flex';
  if (iconEl)   iconEl.textContent   = '▶';
  // FIX Bug C: empurra o conteúdo para não ficar atrás da barra
  document.getElementById('page-wrap')?.classList.add('music-bar-open');
}

function _updateActiveClass(idx) {
  document.querySelectorAll('.playlist-item').forEach((el, i) =>
    el.classList.toggle('active', i === idx));
  document.querySelectorAll('.mini-player-item').forEach((el, i) =>
    el.classList.toggle('active', i === idx));
}

function _doPlayExternal(track) {
  if (!track || !/^[a-zA-Z0-9_-]{11}$/.test(String(track.ytId || ''))) return false;
  currentIdx = -1;
  const area = document.getElementById('yt-embed-area');
  if (area) {
    area.style.display = 'block';
    if (!('ontouchstart' in window)) setTimeout(() => area.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
  }
  ytPlayer.loadVideoById({ videoId: track.ytId });
  _updateBarUI(track);
  document.querySelectorAll('.playlist-item,.mini-player-item').forEach(el => el.classList.remove('active'));
  showToast(`🎵 ${track.name} — ${track.artist}`);
  return true;
}

// ── API pública ──
export function getMusicPlaylist() {
  return activePlaylist.map(track => ({ ...track }));
}

export function addTrackToPlaylist(track) {
  const ytId = String(track?.ytId || '');
  if (!/^[a-zA-Z0-9_-]{11}$/.test(ytId)) throw new Error('ID de vídeo do YouTube inválido.');
  const existing = activePlaylist.findIndex(item => item.ytId === ytId);
  if (existing >= 0) return { added: false, index: existing, track: activePlaylist[existing] };
  const normalized = {
    name: String(track.name || 'Música').slice(0, 120),
    artist: String(track.artist || 'Artista não informado').slice(0, 80),
    ytId,
  };
  activePlaylist.push(normalized);
  persistUserPlaylist();
  renderPlaylist();
  renderMiniPlayerList();
  return { added: true, index: activePlaylist.length - 1, track: normalized };
}

export function removeTrackFromPlaylist(index) {
  if (!Number.isInteger(index) || index < 0 || index >= activePlaylist.length) return null;
  const [removed] = activePlaylist.splice(index, 1);
  if (currentIdx === index) currentIdx = -1;
  else if (currentIdx > index) currentIdx -= 1;
  if (pendingIdx === index) pendingIdx = null;
  persistUserPlaylist();
  renderPlaylist();
  renderMiniPlayerList();
  return removed;
}

export function playExternalTrack(track) {
  if (!track || !/^[a-zA-Z0-9_-]{11}$/.test(String(track.ytId || ''))) return false;
  const normalized = { name: String(track.name || 'Música').slice(0, 120), artist: String(track.artist || 'YouTube').slice(0, 80), ytId: String(track.ytId) };
  if (!ytReady || !ytPlayer) {
    pendingExternalTrack = normalized;
    loadYTApi();
    showToast('⏳ Carregando o player para reproduzir a faixa escolhida...');
    return true;
  }
  return _doPlayExternal(normalized);
}

export function pauseMusic() {
  if (!ytPlayer || !ytReady) return false;
  try { ytPlayer.pauseVideo(); return true; } catch (_) { return false; }
}

export function resumeMusic() {
  if (!ytPlayer || !ytReady) return false;
  try {
    if (currentIdx >= 0) ytPlayer.playVideo();
    else if (pendingExternalTrack) _doPlayExternal(pendingExternalTrack);
    else return false;
    return true;
  } catch (_) { return false; }
}

export function playTrack(idx) {
  if (!ytReady || !ytPlayer) {
    pendingIdx = idx;
    const track = activePlaylist[idx];
    if (track) _updateBarUI(track);
    showToast('⏳ Carregando player...');
    return;
  }
  _doPlay(idx);
}

export function playNext() {
  if (!activePlaylist.length) return;
  playTrack((currentIdx + 1) % activePlaylist.length);
}

export function playPrev() {
  if (!activePlaylist.length) return;
  playTrack((currentIdx - 1 + activePlaylist.length) % activePlaylist.length);
}

export function togglePlayPause() {
  if (!ytPlayer || !ytReady) return;
  try {
    const state = ytPlayer.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
      ytPlayer.pauseVideo();
    } else if ([YT.PlayerState.PAUSED, YT.PlayerState.CUED].includes(state)) {
      ytPlayer.playVideo();
    } else if (currentIdx >= 0) {
      _doPlay(currentIdx);
    } else {
      playTrack(0);
    }
  } catch (e) {
    if (currentIdx >= 0) _doPlay(currentIdx); else playTrack(0);
  }
}

export function playCustomYT() {
  const link = document.getElementById('music-link-input')?.value.trim();
  if (!link) return;
  const id = _getYtId(link);
  if (!id)          { showToast('⚠️ Link inválido! Cole um link do YouTube.', 3500); return; }
  if (!ytReady || !ytPlayer) { showToast('⏳ Aguarda um segundo...'); return; }

  const area = document.getElementById('yt-embed-area');
  if (area) {
    area.style.display = 'block';
    if (!('ontouchstart' in window)) area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  ytPlayer.loadVideoById(id);
  // Bug H fix: não setar isPlaying=true prematuramente — o onStateChange cuida disso
  currentIdx = -1;

  const nameEl   = document.getElementById('mini-track-name');
  const artistEl = document.getElementById('mini-track-artist');
  const barEl    = document.getElementById('mini-player-bar');
  const iconEl   = document.getElementById('mini-play-icon');

  if (nameEl)   nameEl.textContent   = 'Música personalizada';
  if (artistEl) artistEl.textContent = '';
  if (barEl)    barEl.style.display  = 'flex';
  if (iconEl)   iconEl.textContent   = '▶'; // neutro até onStateChange confirmar PLAYING

  document.querySelectorAll('.playlist-item').forEach(el => el.classList.remove('active'));
  showToast('🎵 Música carregada!');
}

function _getYtId(link) {
  const m = link.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ── Render Playlist ──
export function renderPlaylist() {
  const list = document.getElementById('music-playlist');
  if (!list) return;
  list.innerHTML = '';
  activePlaylist.forEach((track, i) => {
    const item = document.createElement('div');
    item.className = 'playlist-item';
    item.innerHTML = `
      <div class="pl-icon">🎵</div>
      <div class="pl-info">
        <div class="pl-name">${track.name}</div>
        <div class="pl-artist">${track.artist}</div>
      </div>
      <div class="pl-arrow">▶</div>`;
    item.addEventListener('click', () => playTrack(i));
    list.appendChild(item);
  });
}

// ── Mini Player (botão flutuante) ──
export function renderMiniPlayerList() {
  const list = document.getElementById('mini-player-list');
  if (!list) return;
  list.innerHTML = activePlaylist.map((t, i) => `
    <div class="mini-player-item" data-idx="${i}">
      <div class="mini-player-item-icon">🎵</div>
      <div class="mini-player-item-info">
        <div class="mini-player-item-name">${t.name}</div>
        <div class="mini-player-item-artist">${t.artist}</div>
      </div>
    </div>`).join('');

  list.querySelectorAll('.mini-player-item').forEach(el => {
    el.addEventListener('click', () => {
      playTrack(Number(el.dataset.idx));
      toggleMiniPlayer();
    });
  });
}

export function closeMusicBar() {
  const bar = document.getElementById('mini-player-bar');
  if (bar) bar.style.display = 'none';
  // FIX Bug C: remove padding quando barra fecha
  document.getElementById('page-wrap')?.classList.remove('music-bar-open');
  // Pausa a música ao fechar
  if (ytPlayer && ytReady) {
    try { ytPlayer.pauseVideo(); } catch(e) {}
  }
}

export function toggleMiniPlayer() {
  miniPlayerOpen = !miniPlayerOpen;
  document.getElementById('mini-player-panel')?.classList.toggle('open', miniPlayerOpen);
}

// Fecha mini player ao clicar fora
export function initMiniPlayerClickOutside() {
  document.addEventListener('click', e => {
    const mp = document.getElementById('mini-player');
    if (mp && miniPlayerOpen && !mp.contains(e.target)) {
      miniPlayerOpen = false;
      document.getElementById('mini-player-panel')?.classList.remove('open');
    }
  });
}

// Expõe para chamadas via onclick no HTML
export function exposeGlobals() {
  window.playTrack       = playTrack;
  window.playNext        = playNext;
  window.playPrev        = playPrev;
  window.togglePlayPause = togglePlayPause;
  window.playCustomYT    = playCustomYT;
  window.toggleMiniPlayer = toggleMiniPlayer;
  window.closeMusicBar   = closeMusicBar;
  // FIX Bug B: expõe getter do estado real do player para toggleEventMusic
  window._ytPlayerState  = () => ytPlayer?.getPlayerState?.() ?? -1;
}
