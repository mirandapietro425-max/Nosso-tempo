/* ═══════════════════════════════════════════════════════════
   PIETRO & EMILLY — watchparty.js
   Cinema em Dupla 🎬💕
   · Convite com notificação em tempo real (Firebase)
   · Chat com emojis, fotos e reações
   · Vídeo/áudio via WebRTC (câmera/mic opcionais)
   · Painel flutuante sobre o player existente
   · Zero impacto no cinema.js original
   ═══════════════════════════════════════════════════════════ */

import {
  doc, setDoc, getDoc, onSnapshot, updateDoc, deleteDoc, arrayUnion,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

import { IMGBB_KEY } from './config.js';

/* ────────────────────────────────────────────
   ESTADO GLOBAL
──────────────────────────────────────────── */
let _db          = null;
let _wpDoc       = null;       // doc('watchparty', 'session')
let _notifDoc    = null;       // doc('watchparty', 'invite')
let _unsub       = null;       // onSnapshot da sessão
let _unsubNotif  = null;       // onSnapshot do convite
let _listenForInvitePending = false; // BUG-H6: evita dois setTimeout em paralelo
let _myName      = null;       // 'pietro' | 'emilly'
let _rtcPeer     = null;       // RTCPeerConnection
let _localStream = null;       // getUserMedia stream
let _chatInput   = null;       // ref ao input
let _emojiOpen          = false;
let _camOn              = false;
let _micOn              = false;
let _isHost             = false;
let _sessionId          = null;
let _inviteDismissTimer = null;  // FIX BUG-5: timer como variável de módulo (não como prop de função)
let _lastKnownStatus   = null;  // BUG-W1/W3 FIX: rastreia transição de status (evita msg "entrou" repetida)
let _lastReactionTs    = 0;     // BUG-W2 FIX: rastreia timestamp da última reação (evita floating loop)
let _lastSyncTs        = 0;     // rastreia timestamp do último videoSync processado

const EMOJIS_CINEMA = [
  '😂','😭','😱','🥹','❤️','💙','💗','🔥','👏','😍',
  '🤣','😤','😮','🥰','💀','✨','👀','🎬','🍿','💕',
  '😴','🤩','😢','🤔','👌','💯','🫶','❗','🎭','🌟',
];

/* ────────────────────────────────────────────
   INIT — chamado em app.js passando db e nome
──────────────────────────────────────────── */
export function initWatchParty(db, myName) {
  _db       = db;
  _myName   = myName;        // 'pietro' ou 'emilly'

  // FIX WP2: injeta HTML/CSS sempre — o botão "Duo" deve aparecer mesmo se Firebase estiver lento
  _injectStyles();
  _injectHTML();

  // FIX Bug C5: guard — se Firebase falhou, db é null; não cria refs nem listeners de Firebase
  if (!db) {
    console.warn('[WatchParty] Firebase indisponível — Watch Party desativado.');
    // Mesmo sem Firebase, expõe globais para que os botões injetados não quebrem
    window._wpOpen = () => window.showToast?.('❌ Cinema em Dupla requer conexão com o banco.');
    window._wpClose = () => {};
    window._wpInvite = window._wpAccept = window._wpDecline = window._wpOpen;
    window._wpSendMsg = window._wpSendReaction = window._wpToggleCam = window._wpOpen;
    window._wpToggleMic = window._wpToggleEmoji = window._wpSendPhoto = window._wpOpen;
    window._wpEndSession = window._wpOpen;
    window._wpIsInSession = () => false;  // sem Firebase, nunca em sessão
    return;
  }

  _wpDoc    = doc(db, 'watchparty', 'session');
  _notifDoc = doc(db, 'watchparty', 'invite');

  _listenForInvite();

  // Expõe globais para onclick no HTML
  window._wpOpen     = _openPanel;
  window._wpClose    = _closePanel;
  window._wpInvite   = _sendInvite;
  window._wpAccept   = _acceptInvite;
  window._wpDecline  = _declineInvite;
  window._wpSendMsg  = _sendMessage;
  window._wpSendReaction = _sendReaction;
  window._wpToggleCam = _toggleCam;
  window._wpToggleMic = _toggleMic;
  window._wpToggleEmoji = _toggleEmojiPicker;
  window._wpSendPhoto = _triggerPhotoUpload;
  window._wpEndSession = _endSession;

  // Expõe estado da sessão para uso em cinema-player.js
  window._wpIsInSession = () => !!_sessionId;

  // FIX BUG-8: para câmera/mic ao fechar a aba (sem isso a câmera fica ligada indefinidamente)
  window.addEventListener('beforeunload', () => {
    _localStream?.getTracks().forEach(t => t.stop());
  });

  // ── HOOKS DE SINCRONIZAÇÃO DE VÍDEO ──────────────────────────────────────
  // Recebe evento do cinema.js quando o host abre/troca conteúdo.
  // cinema.js chama estes hooks após _renderModal() / _buildPlayer().
  window._wpOnCinemaOpen = async function (itemId, epIdx, serverIdx) {
    if (!_db || !_isHost || !_sessionId) return;
    try {
      await setDoc(_wpDoc, {
        videoSync: { action: 'open', itemId, epIdx, serverIdx, updatedAt: Date.now() },
      }, { merge: true });
    } catch(e) {}
  };

  window._wpOnCinemaEpSwitch = async function (epIdx) {
    if (!_db || !_isHost || !_sessionId) return;
    try {
      await setDoc(_wpDoc, {
        videoSync: { action: 'ep', epIdx, updatedAt: Date.now() },
      }, { merge: true });
    } catch(e) {}
  };

  window._wpOnServerChange = async function (serverIdx) {
    if (!_db || !_isHost || !_sessionId) return;
    try {
      await setDoc(_wpDoc, {
        videoSync: { action: 'server', serverIdx, updatedAt: Date.now() },
      }, { merge: true });
    } catch(e) {}
  };
}

/* ────────────────────────────────────────────
   HTML / CSS INJECTION
──────────────────────────────────────────── */
function _injectHTML() {
  // Botão "Duo" injetado no header do cinema modal — aparece só quando o modal está aberto
  // Remove o botão quando o modal fecha via _closeCinemaModal
  const observer = new MutationObserver(() => {
    const overlay = document.getElementById('cinema-modal-overlay');
    const header  = document.querySelector('.cinema-modal-header');
    const btn     = document.getElementById('wp-invite-btn');
    const isOpen  = overlay?.classList.contains('show');

    if (isOpen && header && !btn) {
      // Modal abriu — injeta o botão
      const newBtn = document.createElement('button');
      newBtn.id        = 'wp-invite-btn';
      newBtn.className = 'wp-invite-btn';
      newBtn.title     = 'Assistir juntos 🎬';
      newBtn.innerHTML = `<span>🎬</span><span class="wp-invite-label">Duo</span>`;
      newBtn.onclick   = () => _openPanel();
      header.appendChild(newBtn);
    } else if (!isOpen && btn) {
      // Modal fechou — remove o botão e fecha o painel
      btn.remove();
      _closePanel();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

  // Notificação de convite (aparece para quem NÃO iniciou)
  const notif = document.createElement('div');
  notif.id = 'wp-notif';
  notif.className = 'wp-notif';
  notif.innerHTML = `
    <div class="wp-notif-inner">
      <div class="wp-notif-icon">🎬</div>
      <div class="wp-notif-text">
        <div class="wp-notif-title" id="wp-notif-title">Convite de Cinema</div>
        <div class="wp-notif-sub" id="wp-notif-sub">quer assistir juntos!</div>
      </div>
      <div class="wp-notif-actions">
        <button class="wp-btn wp-btn--accept" onclick="window._wpAccept()">Entrar 💕</button>
        <button class="wp-btn wp-btn--decline" onclick="window._wpDecline()">Agora não</button>
      </div>
    </div>
  `;
  document.body.appendChild(notif);

  // Painel principal do watch party
  const panel = document.createElement('div');
  panel.id = 'wp-panel';
  panel.className = 'wp-panel';
  panel.innerHTML = `
    <div class="wp-panel-header">
      <div class="wp-panel-title">
        <span class="wp-panel-icon">🎬</span>
        <span>Cinema em Dupla</span>
        <span class="wp-status-dot" id="wp-status-dot"></span>
      </div>
      <div class="wp-panel-actions">
        <button class="wp-icon-btn" id="wp-cam-btn" onclick="window._wpToggleCam()" title="Câmera">📷</button>
        <button class="wp-icon-btn" id="wp-mic-btn" onclick="window._wpToggleMic()" title="Microfone">🎙️</button>
        <button class="wp-icon-btn wp-icon-btn--danger" onclick="window._wpEndSession()" title="Encerrar sessão">🗑️</button>
        <button class="wp-icon-btn wp-icon-btn--close" onclick="window._wpClose()" title="Minimizar">✕</button>
      </div>
    </div>

    <!-- Vídeos -->
    <div class="wp-videos" id="wp-videos">
      <div class="wp-video-wrap wp-video-mine" id="wp-video-mine-wrap">
        <video id="wp-video-mine" autoplay muted playsinline></video>
        <div class="wp-video-label" id="wp-video-mine-label">Você</div>
      </div>
      <div class="wp-video-wrap wp-video-other" id="wp-video-other-wrap">
        <video id="wp-video-other" autoplay playsinline></video>
        <div class="wp-video-label" id="wp-video-other-label">Parceiro(a)</div>
      </div>
    </div>

    <!-- Reações flutuantes (renderizadas acima do player) -->
    <div class="wp-reactions-bar" id="wp-reactions-bar">
      ${EMOJIS_CINEMA.slice(0,8).map(e =>
        `<button class="wp-reaction-quick" onclick="window._wpSendReaction('${e}')">${e}</button>`
      ).join('')}
    </div>

    <!-- Chat -->
    <div class="wp-chat" id="wp-chat"></div>

    <!-- Input area -->
    <div class="wp-input-area">
      <div class="wp-emoji-picker" id="wp-emoji-picker">
        ${EMOJIS_CINEMA.map(e =>
          `<button class="wp-emoji-opt" onclick="window._wpInsertEmoji('${e}')">${e}</button>`
        ).join('')}
      </div>
      <div class="wp-input-row">
        <button class="wp-icon-btn wp-icon-btn--sm" onclick="window._wpToggleEmoji()" id="wp-emoji-btn">😊</button>
        <input
          type="text"
          id="wp-chat-input"
          class="wp-chat-input"
          placeholder="Escreva algo… 💬"
          maxlength="300"
          onkeydown="if(event.key==='Enter'){event.preventDefault();window._wpSendMsg();}"
        >
        <button class="wp-icon-btn wp-icon-btn--sm" onclick="window._wpSendPhoto()">📸</button>
        <button class="wp-send-btn" onclick="window._wpSendMsg()">▶</button>
      </div>
    </div>

    <!-- Input de foto oculto -->
    <input type="file" id="wp-photo-input" accept="image/*" style="display:none"
      onchange="window._wpHandlePhoto(this)">

    <!-- Convite inicial (quando não há parceiro) -->
    <div class="wp-waiting" id="wp-waiting">
      <div class="wp-waiting-icon">💌</div>
      <div class="wp-waiting-title">Chamar a Emilly?</div>
      <div class="wp-waiting-sub" id="wp-waiting-sub">Manda um convite para assistir juntos!</div>
      <button class="wp-btn wp-btn--primary wp-btn--lg" id="wp-invite-action-btn" onclick="window._wpInvite()">
        Convidar agora 💕
      </button>
      <div class="wp-waiting-hint" id="wp-waiting-hint"></div>
    </div>
  `;
  document.body.appendChild(panel);

  _chatInput = document.getElementById('wp-chat-input');

  // Handler de foto
  window._wpHandlePhoto = _handlePhotoUpload;
  window._wpInsertEmoji = (e) => {
    if (_chatInput) { _chatInput.value += e; _chatInput.focus(); }
  };
}

function _injectStyles() {
  const s = document.createElement('style');
  s.id = 'wp-styles';
  s.textContent = `
/* ══ BOTÃO NO HEADER DO CINEMA ══ */
.wp-invite-btn {
  display: flex; align-items: center; gap: 4px;
  background: linear-gradient(135deg, #e8536f, #590d22);
  color: white; border: none; border-radius: 20px;
  padding: 5px 12px; font-family: 'DM Sans', sans-serif;
  font-size: 0.72rem; font-weight: 700; cursor: pointer;
  letter-spacing: 0.03em; transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 2px 12px rgba(232,83,111,0.4);
  margin-left: auto; flex-shrink: 0;
}
.wp-invite-btn:active { transform: scale(0.95); }
.wp-invite-label { display: inline; }

/* ══ NOTIFICAÇÃO DE CONVITE ══ */
.wp-notif {
  position: fixed; bottom: -200px; left: 50%; transform: translateX(-50%);
  width: min(420px, 92vw); z-index: 10500;
  transition: bottom 0.45s cubic-bezier(0.32, 1.2, 0.5, 1);
  pointer-events: none;
}
.wp-notif.show { bottom: 90px; pointer-events: all; }
.wp-notif-inner {
  background: linear-gradient(135deg, #1a0510, #2d0a1a);
  border: 1px solid rgba(232,83,111,0.35);
  border-radius: 20px; padding: 14px 16px;
  display: flex; align-items: center; gap: 12px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(232,83,111,0.15);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
}
.wp-notif-icon { font-size: 2rem; flex-shrink: 0; animation: wpPulse 1.5s infinite; }
@keyframes wpPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
.wp-notif-text { flex: 1; min-width: 0; }
.wp-notif-title { color: white; font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 0.88rem; }
.wp-notif-sub { color: rgba(255,255,255,0.6); font-size: 0.75rem; margin-top: 1px; }
.wp-notif-actions { display: flex; gap: 6px; flex-shrink: 0; }

/* ══ BOTÕES GERAIS ══ */
.wp-btn {
  border: none; border-radius: 20px; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-weight: 700;
  font-size: 0.78rem; padding: 7px 14px; transition: all 0.15s;
  white-space: nowrap;
}
.wp-btn:active { transform: scale(0.95); }
.wp-btn--accept { background: linear-gradient(135deg, #e8536f, #c73a57); color: white; box-shadow: 0 3px 12px rgba(232,83,111,0.4); }
.wp-btn--decline { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
.wp-btn--primary { background: linear-gradient(135deg, #e8536f, #590d22); color: white; box-shadow: 0 4px 20px rgba(232,83,111,0.4); }
.wp-btn--lg { padding: 12px 28px; font-size: 0.9rem; border-radius: 50px; }

/* ══ PAINEL PRINCIPAL ══ */
.wp-panel {
  position: fixed;
  bottom: 0; right: 0;
  width: min(360px, 100vw);
  height: min(580px, 85vh);
  background: linear-gradient(180deg, #120408 0%, #1c0810 40%, #120408 100%);
  border: 1px solid rgba(232,83,111,0.2);
  border-radius: 24px 24px 0 0;
  display: flex; flex-direction: column;
  z-index: 10400;
  transform: translateY(110%);
  visibility: hidden;
  pointer-events: none;
  transition: transform 0.4s cubic-bezier(0.32, 1.2, 0.5, 1), visibility 0s linear 0.4s;
  box-shadow: -8px -8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(232,83,111,0.1);
  overflow: hidden;
}
@media (min-width: 600px) {
  .wp-panel {
    right: 16px; bottom: 16px;
    border-radius: 24px;
    height: min(560px, 85vh);
  }
}
.wp-panel.open { transform: translateY(0); visibility: visible; pointer-events: all; transition: transform 0.4s cubic-bezier(0.32, 1.2, 0.5, 1), visibility 0s linear 0s; }

/* ── Header ── */
.wp-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px 10px;
  border-bottom: 1px solid rgba(232,83,111,0.12);
  background: rgba(0,0,0,0.3); flex-shrink: 0;
}
.wp-panel-title {
  display: flex; align-items: center; gap: 7px;
  font-family: 'DM Sans', sans-serif; font-weight: 700;
  color: white; font-size: 0.88rem; letter-spacing: 0.02em;
}
.wp-panel-icon { font-size: 1rem; }
.wp-status-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: rgba(255,255,255,0.2);
  transition: background 0.3s;
}
.wp-status-dot.connected { background: #4ade80; box-shadow: 0 0 8px rgba(74,222,128,0.6); animation: wpBlink 2s infinite; }
.wp-status-dot.waiting   { background: #fbbf24; box-shadow: 0 0 8px rgba(251,191,36,0.6); animation: wpBlink 1s infinite; }
@keyframes wpBlink { 0%,100%{opacity:1} 50%{opacity:0.4} }
.wp-panel-actions { display: flex; gap: 6px; }
.wp-icon-btn {
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1);
  color: white; border-radius: 10px; width: 32px; height: 32px;
  cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; flex-shrink: 0;
}
.wp-icon-btn:active { transform: scale(0.9); }
.wp-icon-btn.active { background: rgba(232,83,111,0.3); border-color: rgba(232,83,111,0.5); }
.wp-icon-btn.muted  { background: rgba(255,100,100,0.2); border-color: rgba(255,100,100,0.4); }
.wp-icon-btn--danger { background: rgba(220,38,38,0.15); border-color: rgba(220,38,38,0.3); }
.wp-icon-btn--danger:hover { background: rgba(220,38,38,0.35); }
.wp-icon-btn--close { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); }
.wp-icon-btn--close:hover { background: rgba(255,255,255,0.2); }
.wp-icon-btn--sm { width: 30px; height: 30px; font-size: 0.8rem; }

/* ── Vídeos ── */
.wp-videos {
  display: flex; gap: 6px; padding: 8px 12px;
  flex-shrink: 0; background: rgba(0,0,0,0.2);
}
.wp-videos.hidden { display: none; }
.wp-video-wrap {
  flex: 1; border-radius: 12px; overflow: hidden;
  background: #0a020a; position: relative;
  aspect-ratio: 4/3;
  border: 1px solid rgba(255,255,255,0.08);
}
.wp-video-wrap video { width: 100%; height: 100%; object-fit: cover; display: block; }
.wp-video-label {
  position: absolute; bottom: 4px; left: 6px;
  font-size: 0.6rem; color: rgba(255,255,255,0.7);
  font-family: 'DM Sans', sans-serif; font-weight: 600;
  background: rgba(0,0,0,0.5); border-radius: 6px; padding: 2px 5px;
}
.wp-video-mine .wp-video-label  { color: #7ab8f5; }
.wp-video-other .wp-video-label { color: #f5a0b0; }
.wp-video-placeholder {
  width: 100%; height: 100%; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 4px;
  color: rgba(255,255,255,0.25); font-size: 0.65rem;
  font-family: 'DM Sans', sans-serif;
}
.wp-video-placeholder-icon { font-size: 1.5rem; opacity: 0.4; }

/* ── Barra de reações ── */
.wp-reactions-bar {
  display: flex; gap: 4px; padding: 6px 12px;
  overflow-x: auto; flex-shrink: 0;
  scrollbar-width: none; border-bottom: 1px solid rgba(255,255,255,0.05);
}
.wp-reactions-bar::-webkit-scrollbar { display: none; }
.wp-reaction-quick {
  background: rgba(255,255,255,0.06); border: none; border-radius: 8px;
  font-size: 1.1rem; padding: 4px 7px; cursor: pointer;
  transition: transform 0.1s, background 0.1s; flex-shrink: 0;
}
.wp-reaction-quick:active { transform: scale(1.3); background: rgba(232,83,111,0.2); }

/* ── Chat ── */
.wp-chat {
  flex: 1; overflow-y: auto; padding: 10px 12px;
  display: flex; flex-direction: column; gap: 6px;
  scrollbar-width: thin; scrollbar-color: rgba(232,83,111,0.3) transparent;
}
.wp-chat::-webkit-scrollbar { width: 3px; }
.wp-chat::-webkit-scrollbar-thumb { background: rgba(232,83,111,0.3); border-radius: 3px; }

.wp-msg {
  display: flex; flex-direction: column; max-width: 82%; animation: wpMsgIn 0.25s ease;
}
@keyframes wpMsgIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
.wp-msg--mine  { align-self: flex-end; align-items: flex-end; }
.wp-msg--other { align-self: flex-start; align-items: flex-start; }

.wp-msg-bubble {
  padding: 7px 11px; border-radius: 16px; max-width: 100%;
  font-family: 'DM Sans', sans-serif; font-size: 0.82rem; line-height: 1.45;
  word-break: break-word;
}
.wp-msg--mine  .wp-msg-bubble { background: linear-gradient(135deg, #e8536f, #c73a57); color: white; border-bottom-right-radius: 4px; }
.wp-msg--other .wp-msg-bubble { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.9); border-bottom-left-radius: 4px; border: 1px solid rgba(255,255,255,0.1); }

.wp-msg-photo { width: 100%; max-width: 200px; border-radius: 12px; margin-top: 3px; display: block; cursor: pointer; }
.wp-msg-photo:active { opacity: 0.8; }

.wp-msg-author {
  font-size: 0.6rem; font-family: 'DM Sans', sans-serif;
  margin-bottom: 2px; font-weight: 600; letter-spacing: 0.04em;
}
.wp-msg--mine  .wp-msg-author { color: rgba(232,83,111,0.7); }
.wp-msg--other .wp-msg-author { color: rgba(74,144,217,0.8); }

.wp-msg-time { font-size: 0.58rem; color: rgba(255,255,255,0.25); margin-top: 3px; font-family: 'DM Sans', sans-serif; }

/* Reação flutuante sobre o player */
.wp-float-reaction {
  position: fixed; pointer-events: none; z-index: 10450;
  font-size: 2.2rem; animation: wpReactionFloat 2.2s ease-out forwards;
  text-shadow: 0 2px 12px rgba(0,0,0,0.4);
}
@keyframes wpReactionFloat {
  0%   { transform: translateY(0) scale(0.5);   opacity: 0; }
  15%  { transform: translateY(-20px) scale(1.3); opacity: 1; }
  70%  { transform: translateY(-90px) scale(1);  opacity: 1; }
  100% { transform: translateY(-160px) scale(0.7); opacity: 0; }
}

/* Reação no chat (mensagem especial) */
.wp-msg--reaction .wp-msg-bubble {
  background: transparent; border: none; font-size: 2rem;
  padding: 2px 6px; line-height: 1;
}

/* Sistema de mensagem de status */
.wp-status-msg {
  text-align: center; font-size: 0.7rem; color: rgba(255,255,255,0.3);
  font-family: 'DM Sans', sans-serif; font-style: italic; padding: 4px 0;
}

/* ── Input ── */
.wp-input-area {
  padding: 8px 10px 12px; flex-shrink: 0;
  border-top: 1px solid rgba(255,255,255,0.07);
  position: relative;
}
.wp-emoji-picker {
  position: absolute; bottom: 100%; left: 10px; right: 10px;
  background: #1a0510; border: 1px solid rgba(232,83,111,0.25);
  border-radius: 16px; padding: 10px;
  display: none; grid-template-columns: repeat(10, 1fr); gap: 4px;
  box-shadow: 0 -8px 32px rgba(0,0,0,0.4);
  max-height: 160px; overflow-y: auto;
}
.wp-emoji-picker.open { display: grid; animation: wpMsgIn 0.2s ease; }
.wp-emoji-opt {
  background: none; border: none; font-size: 1.3rem; cursor: pointer;
  border-radius: 8px; padding: 4px; transition: background 0.1s;
  display: flex; align-items: center; justify-content: center;
}
.wp-emoji-opt:hover { background: rgba(255,255,255,0.1); }
.wp-input-row {
  display: flex; gap: 6px; align-items: center;
}
.wp-chat-input {
  flex: 1; background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12); border-radius: 20px;
  color: white; padding: 7px 13px; font-size: 0.82rem;
  font-family: 'DM Sans', sans-serif; outline: none;
  transition: border-color 0.2s;
}
.wp-chat-input:focus { border-color: rgba(232,83,111,0.5); }
.wp-chat-input::placeholder { color: rgba(255,255,255,0.3); }
.wp-send-btn {
  background: linear-gradient(135deg, #e8536f, #c73a57);
  color: white; border: none; border-radius: 50%; width: 32px; height: 32px;
  cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 3px 10px rgba(232,83,111,0.4);
}
.wp-send-btn:active { transform: scale(0.9); }

/* ── Tela de espera/convite ── */
.wp-waiting {
  position: absolute; inset: 60px 0 0 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 20px; text-align: center;
  background: linear-gradient(180deg, #120408 0%, #1c0810 100%);
  z-index: 2;
}
.wp-waiting.hidden { display: none; }
.wp-waiting-icon { font-size: 3rem; animation: wpPulse 2s infinite; }
.wp-waiting-title { font-family: 'Playfair Display', serif; font-size: 1.2rem; color: white; font-weight: 700; }
.wp-waiting-sub { font-family: 'DM Sans', sans-serif; font-size: 0.8rem; color: rgba(255,255,255,0.5); }
.wp-waiting-hint { font-size: 0.72rem; color: rgba(255,255,255,0.3); font-family: 'DM Sans', sans-serif; min-height: 1.2em; }

/* ── Upload loading ── */
.wp-uploading {
  font-size: 0.72rem; color: rgba(232,83,111,0.7);
  font-family: 'DM Sans', sans-serif; text-align: center; padding: 4px 0;
}
  `;
  document.head.appendChild(s);
}

/* ────────────────────────────────────────────
   PAINEL — ABRIR / FECHAR
──────────────────────────────────────────── */
function _openPanel() {
  const panel = document.getElementById('wp-panel');
  if (!panel) return;
  panel.classList.add('open');

  // Detecta nome automaticamente via localStorage (casinha ativa)
  if (!_myName) {
    try { _myName = localStorage.getItem('pe_active_player') || 'pietro'; } catch { _myName = 'pietro'; }
  }

  // Atualiza label de "chamar quem"
  const other = _myName === 'pietro' ? 'Emilly' : 'Pietro';
  const waitTitle = panel.querySelector('.wp-waiting-title');
  if (waitTitle) waitTitle.textContent = `Chamar a ${other}?`;
  const invBtn = document.getElementById('wp-invite-action-btn');
  if (invBtn) invBtn.textContent = `Convidar ${other} 💕`;

  // Se já há sessão ativa, reconecta
  _checkExistingSession();
}

function _closePanel() {
  document.getElementById('wp-panel')?.classList.remove('open');
}

/* ────────────────────────────────────────────
   VERIFICAR SESSÃO EXISTENTE
──────────────────────────────────────────── */
async function _checkExistingSession() {
  if (!_db) return;
  try {
    const snap = await getDoc(_wpDoc);
    if (snap.exists() && snap.data().status === 'active') {
      const data = snap.data();
      _sessionId = data.sessionId;
      _isHost    = data.host === _myName;
      // FIX: pré-popula _lastKnownStatus para evitar mensagem "entrou!" espúria ao reconectar
      _lastKnownStatus = 'active';
      _showChatUI();
      _subscribeSession();
      _renderMessages(data.messages || []);
    }
  } catch (e) {}
}

/* ────────────────────────────────────────────
   CONVITE
──────────────────────────────────────────── */
async function _sendInvite() {
  if (!_db || !_myName) return;
  const btn = document.getElementById('wp-invite-action-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Enviando…'; }

  const hint = document.getElementById('wp-waiting-hint');
  if (hint) hint.textContent = '';

  // Descobre qual item está aberto no cinema
  const titleEl = document.getElementById('cinema-modal-title');
  const title   = titleEl ? titleEl.textContent.trim() : 'um conteúdo';

  _sessionId = Date.now().toString(36);
  _isHost    = true;

  try {
    // Cria sessão no Firebase
    await setDoc(_wpDoc, {
      status     : 'waiting',
      host       : _myName,
      sessionId  : _sessionId,
      content    : title,
      messages   : [],
      reactions  : [],
      createdAt  : Date.now(),
    });

    // Escreve convite separado (o outro escuta isto)
    await setDoc(_notifDoc, {
      from      : _myName,
      content   : title,
      sessionId : _sessionId,
      ts        : Date.now(),
      status    : 'pending',
    });

    if (hint) hint.textContent = '⏳ Aguardando ela entrar…';
    const dot = document.getElementById('wp-status-dot');
    if (dot) { dot.className = 'wp-status-dot waiting'; }

    // Escuta quando aceitar
    _subscribeSession();

    if (btn) { btn.textContent = '⏳ Aguardando…'; }
  } catch(e) {
    if (btn) { btn.disabled = false; btn.textContent = 'Tentar novamente'; }
    if (hint) hint.textContent = '❌ Erro ao enviar. Tente de novo.';
  }
}

/* ────────────────────────────────────────────
   ESCUTAR CONVITE (para o outro lado)
──────────────────────────────────────────── */
function _listenForInvite() {
  if (!_db) return;

  if (_unsubNotif) { _unsubNotif(); _unsubNotif = null; }

  _unsubNotif = onSnapshot(_notifDoc, snap => {
    if (!snap.exists()) return;
    const data = snap.data();
    // Só exibe se for para MIM (i.e. eu NÃO sou quem enviou)
    if (data.status !== 'pending') return;
    // FIX BUG-1: _myName pode ser null se pe_active_player não estava no localStorage no boot.
    // Tenta resolver aqui antes de descartar — o usuário pode ter feito login depois do init.
    if (!_myName) {
      try { _myName = localStorage.getItem('pe_active_player') || null; } catch {}
    }
    if (!_myName) return;               // ainda null → não sabemos quem somos, ignora
    if (data.from === _myName) return;  // não notifica quem convidou

    const notif = document.getElementById('wp-notif');
    if (!notif) return;

    const other = data.from === 'pietro' ? 'Pietro 💙' : 'Emilly 💗';
    const titleEl = document.getElementById('wp-notif-title');
    const subEl   = document.getElementById('wp-notif-sub');
    if (titleEl) titleEl.textContent = `${other} te convidou!`;
    if (subEl)   subEl.textContent   = `🎬 ${data.content}`;

    notif.classList.add('show');

    // FIX BUG-5: usa variável de módulo _inviteDismissTimer (não prop de função)
    clearTimeout(_inviteDismissTimer);
    _inviteDismissTimer = setTimeout(() => notif.classList.remove('show'), 30000);
  }, () => {});
}

async function _acceptInvite() {
  const notif = document.getElementById('wp-notif');
  notif?.classList.remove('show');
  clearTimeout(_inviteDismissTimer);   // FIX BUG-5
  _inviteDismissTimer = null;

  _isHost = false;
  try {
    const snap = await getDoc(_notifDoc);
    if (!snap.exists()) return;
    _sessionId = snap.data().sessionId;

    // Atualiza status
    await setDoc(_wpDoc, { status: 'active', guest: _myName }, { merge: true });
    await setDoc(_notifDoc, { status: 'accepted' }, { merge: true });

    // FIX: pré-popula _lastKnownStatus — o guest mesmo acaba de entrar, não precisa de notificação de transição
    _lastKnownStatus = 'active';
    _openPanel();
    _showChatUI();
    _subscribeSession();
    _appendStatusMsg(`Você entrou! 💕 Curtam o filme juntos 🎬`);
  } catch(e) {
    window.showToast?.('❌ Erro ao entrar na sessão.');
  }
}

async function _declineInvite() {
  document.getElementById('wp-notif')?.classList.remove('show');
  clearTimeout(_inviteDismissTimer);   // FIX BUG-5
  _inviteDismissTimer = null;
  try {
    await setDoc(_notifDoc, { status: 'declined' }, { merge: true });
  } catch(e) {}
}

/* ────────────────────────────────────────────
   SUBSCRIBE — Escuta mudanças na sessão
──────────────────────────────────────────── */
function _subscribeSession() {
  if (_unsub) { _unsub(); _unsub = null; }
  if (!_wpDoc) return;

  _unsub = onSnapshot(_wpDoc, snap => {
    if (!snap.exists()) return;
    const data = snap.data();

    // BUG-W1/W3 FIX: só executa ações de transição quando o status MUDA, não a cada snapshot.
    // Sem isso: toda mensagem do chat dispara "entrou!" de novo e chama _showChatUI repetidamente.
    const prevStatus = _lastKnownStatus;
    _lastKnownStatus = data.status;

    if (data.status === 'active' && _isHost && prevStatus !== 'active') {
      // Transição waiting → active: parceiro acabou de entrar
      _showChatUI();
      const dot = document.getElementById('wp-status-dot');
      if (dot) dot.className = 'wp-status-dot connected';
      const other = _myName === 'pietro' ? 'Emilly 💗' : 'Pietro 💙';
      _appendStatusMsg(`${other} entrou! Vamos assistir juntos 🎬`);
    }

    _renderMessages(data.messages || []);

    // BUG-W2 FIX: usa timestamp da reação para evitar re-flutuar a mesma em cada snapshot.
    // Sem isso: cada nova mensagem do chat re-dispara a última reação do parceiro.
    if (data.lastReaction && data.lastReaction.from !== _myName) {
      const reactionTs = data.lastReaction.ts || 0;
      if (reactionTs > _lastReactionTs) {
        _lastReactionTs = reactionTs;
        _spawnFloatingReaction(data.lastReaction.emoji);
      }
    }

    // ── SINCRONIZAÇÃO DE VÍDEO (para o guest) ────────────────────────────
    if (!_isHost && data.videoSync) {
      const vs = data.videoSync;
      const lastSyncTs = _lastSyncTs;
      // Evita processar o mesmo evento duas vezes
      if (vs.updatedAt && vs.updatedAt > lastSyncTs) {
        _lastSyncTs = vs.updatedAt;
        _handleVideoSync(vs);
      }
    }

    // Sessão encerrada pelo outro
    if (data.status === 'ended') {
      _onSessionEnded(false);
    }
  }, () => {});
}

/* ────────────────────────────────────────────
   SINCRONIZAÇÃO DE VÍDEO (guest recebe, host envia via cinema.js hooks)
──────────────────────────────────────────── */
function _handleVideoSync(vs) {
  if (vs.action === 'open' && vs.itemId) {
    // Mostra notificação no chat + toast com botão de sincronizar
    _appendStatusMsg(`🎬 ${_myName === 'pietro' ? 'Emilly' : 'Pietro'} abriu um conteúdo novo`);
    _showSyncToast(vs);
  } else if (vs.action === 'ep' && vs.epIdx != null) {
    _appendStatusMsg(`▶ Episódio ${vs.epIdx + 1} selecionado pelo host`);
    _showSyncToast(vs);
  } else if (vs.action === 'server') {
    // Troca de servidor é silenciosa — aplica direto se o modal estiver aberto
    if (typeof window._cinemaSelectServer === 'function' && vs.serverIdx != null) {
      window._cinemaSelectServer(vs.serverIdx);
    }
  }
}

function _showSyncToast(vs) {
  // Remove toast anterior se existir
  document.getElementById('wp-sync-toast')?.remove();

  const toast = document.createElement('div');
  toast.id = 'wp-sync-toast';
  toast.style.cssText = `
    position:fixed; bottom:90px; left:50%; transform:translateX(-50%);
    background:linear-gradient(135deg,#1a0510,#2d0a1a);
    border:1px solid rgba(232,83,111,0.4); border-radius:16px;
    padding:10px 16px; display:flex; align-items:center; gap:10px;
    z-index:10600; font-family:'DM Sans',sans-serif; font-size:0.8rem;
    color:white; box-shadow:0 8px 32px rgba(0,0,0,0.5);
    animation:wpMsgIn 0.3s ease;
  `;
  toast.innerHTML = `
    <span>🎬 Sincronizar com o host?</span>
    <button style="background:linear-gradient(135deg,#e8536f,#c73a57);color:white;border:none;
      border-radius:12px;padding:5px 12px;font-size:0.75rem;font-weight:700;cursor:pointer;"
      id="wp-sync-btn">Sincronizar</button>
    <button style="background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);border:none;
      border-radius:12px;padding:5px 10px;font-size:0.75rem;cursor:pointer;"
      id="wp-sync-dismiss">✕</button>
  `;
  document.body.appendChild(toast);

  document.getElementById('wp-sync-btn').addEventListener('click', () => {
    toast.remove();
    if (vs.action === 'open' && vs.itemId && typeof window._openCinemaItem === 'function') {
      window._openCinemaItem(vs.itemId);
    } else if (vs.action === 'ep' && vs.epIdx != null && typeof window._cinemaSwitchEp === 'function') {
      window._cinemaSwitchEp(vs.epIdx);
    }
  });
  document.getElementById('wp-sync-dismiss').addEventListener('click', () => toast.remove());

  // Auto-remove após 20s
  setTimeout(() => toast.remove(), 20000);
}

/* ────────────────────────────────────────────
   CHAT — MENSAGENS
──────────────────────────────────────────── */
async function _sendMessage() {
  if (!_chatInput || !_db) return;
  const text = _chatInput.value.trim();
  if (!text) return;

  _chatInput.value = '';
  _closeEmojiPicker();

  const msg = {
    id     : Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    from   : _myName,
    text   : text,
    type   : 'text',
    ts     : Date.now(),
  };

  try {
    await updateDoc(_wpDoc, { messages: arrayUnion(msg) });
  } catch(e) {
    // Se updateDoc falhar (doc não existe), usa setDoc merge
    try { await setDoc(_wpDoc, { messages: [msg] }, { merge: true }); } catch {}
  }
}

async function _sendReaction(emoji) {
  if (!_db) return;

  // Adiciona como mensagem no chat
  const msg = {
    id   : Date.now().toString(36),
    from : _myName,
    text : emoji,
    type : 'reaction',
    ts   : Date.now(),
  };

  // Floata na própria tela imediatamente
  _spawnFloatingReaction(emoji);

  try {
    await updateDoc(_wpDoc, {
      messages     : arrayUnion(msg),
      lastReaction : { emoji, from: _myName, ts: Date.now() },
    });
  } catch(e) {
    try { await setDoc(_wpDoc, { messages: [msg], lastReaction: { emoji, from: _myName, ts: Date.now() } }, { merge: true }); } catch {}
  }
}

/* ────────────────────────────────────────────
   UPLOAD DE FOTO
──────────────────────────────────────────── */
function _triggerPhotoUpload() {
  document.getElementById('wp-photo-input')?.click();
}

async function _handlePhotoUpload(input) {
  const file = input.files?.[0];
  if (!file) return;
  input.value = '';

  const chat = document.getElementById('wp-chat');
  const loading = document.createElement('div');
  loading.className = 'wp-uploading';
  loading.textContent = '📸 Enviando foto…';
  chat?.appendChild(loading);
  chat?.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });

  try {
    const form = new FormData();
    form.append('image', file);
    form.append('key', IMGBB_KEY);
    const res  = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: form });
    const data = await res.json();
    loading.remove(); // BUG-WP-1 FIX: removido ANTES do if/else — sem isso, loading ficava
                      // visível para sempre quando data.success === false (sem throw de rede)

    if (data.success) {
      const msg = {
        id   : Date.now().toString(36),
        from : _myName,
        text : data.data.url,
        type : 'photo',
        ts   : Date.now(),
      };
      await updateDoc(_wpDoc, { messages: arrayUnion(msg) }).catch(() =>
        setDoc(_wpDoc, { messages: [msg] }, { merge: true })
      );
    } else {
      window.showToast?.('❌ Erro ao enviar foto.');
    }
  } catch(e) {
    loading.remove();
    window.showToast?.('❌ Erro de rede.');
  }
}

/* ────────────────────────────────────────────
   RENDER MENSAGENS
──────────────────────────────────────────── */
function _renderMessages(messages) {
  const chat = document.getElementById('wp-chat');
  if (!chat) return;

  // Preserva scroll se já está no fundo
  const atBottom = chat.scrollHeight - chat.clientHeight - chat.scrollTop < 60;

  // Renderiza apenas mensagens novas (evita re-render total)
  const rendered = new Set(Array.from(chat.querySelectorAll('[data-msg-id]')).map(el => el.dataset.msgId));

  // FIX BUG-6: ordena por timestamp antes de renderizar (evita mensagens fora de ordem por race condition)
  const sorted = [...messages].sort((a, b) => (a.ts || 0) - (b.ts || 0));

  sorted.forEach(msg => {
    if (rendered.has(msg.id)) return;
    const isMine = msg.from === _myName;
    const div = document.createElement('div');
    div.dataset.msgId = msg.id;

    if (msg.type === 'reaction') {
      div.className = `wp-msg wp-msg--reaction wp-msg--${isMine ? 'mine' : 'other'}`;
      div.innerHTML = `<div class="wp-msg-bubble">${msg.text}</div>`;
    } else if (msg.type === 'photo') {
      div.className = `wp-msg wp-msg--${isMine ? 'mine' : 'other'}`;
      // FIX BUG-7: URL do usuário não pode ser interpolada em atributos HTML (XSS).
      // Usa setAttribute + addEventListener para isolar o valor da URL.
      const safeUrl = _escapeHtml(msg.text);
      div.innerHTML = `
        <div class="wp-msg-author">${isMine ? 'Você' : (msg.from === 'pietro' ? 'Pietro 💙' : 'Emilly 💗')}</div>
        <img src="${safeUrl}" class="wp-msg-photo" loading="lazy">
        <div class="wp-msg-time">${_formatTime(msg.ts)}</div>
      `;
      div.querySelector('img').addEventListener('click', function () {
        window.open(msg.text, '_blank', 'noopener,noreferrer');
      });
    } else {
      div.className = `wp-msg wp-msg--${isMine ? 'mine' : 'other'}`;
      div.innerHTML = `
        <div class="wp-msg-author">${isMine ? 'Você' : (msg.from === 'pietro' ? 'Pietro 💙' : 'Emilly 💗')}</div>
        <div class="wp-msg-bubble">${_escapeHtml(msg.text)}</div>
        <div class="wp-msg-time">${_formatTime(msg.ts)}</div>
      `;
    }
    chat.appendChild(div);
  });

  if (atBottom) chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
}

function _appendStatusMsg(text) {
  const chat = document.getElementById('wp-chat');
  if (!chat) return;
  const div = document.createElement('div');
  div.className = 'wp-status-msg';
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
}

/* ────────────────────────────────────────────
   REAÇÃO FLUTUANTE
──────────────────────────────────────────── */
function _spawnFloatingReaction(emoji) {
  const el = document.createElement('div');
  el.className = 'wp-float-reaction';
  el.textContent = emoji;
  // Posição aleatória na parte inferior da tela
  el.style.left  = (10 + Math.random() * 80) + 'vw';
  el.style.bottom = 'calc(120px + env(safe-area-inset-bottom, 0px))';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}

/* ────────────────────────────────────────────
   CÂMERA / MICROFONE (WebRTC)
──────────────────────────────────────────── */
async function _toggleCam() {
  const btn = document.getElementById('wp-cam-btn');

  if (_camOn) {
    // FIX BUG-13/14: para tracks de vídeo com .stop() (libera hardware), não só .enabled=false
    _localStream?.getVideoTracks().forEach(t => { t.stop(); _localStream.removeTrack(t); });
    _camOn = false;
    if (btn) { btn.classList.remove('active'); btn.textContent = '📷'; }
    const vid = document.getElementById('wp-video-mine');
    if (vid) vid.srcObject = null;
    _hideVideoIfBothOff();
    return;
  }

  try {
    // FIX BUG-13: para stream anterior completo antes de criar novo
    if (_localStream) {
      _localStream.getTracks().forEach(t => t.stop());
      _localStream = null;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: _micOn });
    _localStream = stream;
    _camOn = true;
    if (btn) { btn.classList.add('active'); btn.textContent = '📹'; }
    const vid = document.getElementById('wp-video-mine');
    if (vid) vid.srcObject = stream;
    document.getElementById('wp-videos')?.classList.remove('hidden');
    _updateVideoLabels();
  } catch(e) {
    window.showToast?.('❌ Câmera não disponível ou sem permissão.');
  }
}

async function _toggleMic() {
  const btn = document.getElementById('wp-mic-btn');

  if (_micOn) {
    // FIX BUG-14: track.stop() libera o hardware; track.enabled=false apenas silencia mas mantém a câmera acesa
    _localStream?.getAudioTracks().forEach(t => { t.stop(); _localStream?.removeTrack(t); });
    _micOn = false;
    if (btn) { btn.classList.remove('active'); btn.classList.add('muted'); btn.textContent = '🔇'; }
    return;
  }

  try {
    if (_localStream) {
      // Adiciona audio ao stream existente
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStream.getAudioTracks().forEach(t => _localStream.addTrack(t));
    } else {
      _localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    }
    _micOn = true;
    if (btn) { btn.classList.add('active'); btn.classList.remove('muted'); btn.textContent = '🎙️'; }
    window.showToast?.('🎙️ Microfone ativado! O audio é compartilhado apenas localmente por ora.');
  } catch(e) {
    window.showToast?.('❌ Microfone não disponível.');
  }
}

function _hideVideoIfBothOff() {
  if (!_camOn) {
    const vid = document.getElementById('wp-video-mine');
    if (vid) vid.srcObject = null;
    // Mostra placeholder se sem câmera
    const wrap = document.getElementById('wp-video-mine-wrap');
    if (wrap && !wrap.querySelector('.wp-video-placeholder')) {
      const ph = document.createElement('div');
      ph.className = 'wp-video-placeholder';
      ph.innerHTML = `<div class="wp-video-placeholder-icon">📷</div><div>Câmera desligada</div>`;
      wrap.insertBefore(ph, wrap.firstChild);
    }
  }
}

function _updateVideoLabels() {
  const lm = document.getElementById('wp-video-mine-label');
  const lo = document.getElementById('wp-video-other-label');
  if (lm) lm.textContent = _myName === 'pietro' ? 'Pietro 💙' : 'Emilly 💗';
  if (lo) lo.textContent = _myName === 'pietro' ? 'Emilly 💗' : 'Pietro 💙';
}

/* ────────────────────────────────────────────
   MOSTRAR UI DE CHAT (esconde tela de espera)
──────────────────────────────────────────── */
function _showChatUI() {
  document.getElementById('wp-waiting')?.classList.add('hidden');
  const dot = document.getElementById('wp-status-dot');
  if (dot) dot.className = 'wp-status-dot connected';
  _updateVideoLabels();
}

/* ────────────────────────────────────────────
   EMOJI PICKER
──────────────────────────────────────────── */
function _toggleEmojiPicker() {
  const picker = document.getElementById('wp-emoji-picker');
  if (!picker) return;
  _emojiOpen = !_emojiOpen;
  picker.classList.toggle('open', _emojiOpen);
  document.getElementById('wp-emoji-btn')?.classList.toggle('active', _emojiOpen);
}

function _closeEmojiPicker() {
  _emojiOpen = false;
  document.getElementById('wp-emoji-picker')?.classList.remove('open');
  document.getElementById('wp-emoji-btn')?.classList.remove('active');
}

/* ────────────────────────────────────────────
   ENCERRAR SESSÃO
──────────────────────────────────────────── */
async function _endSession() {
  // Para listeners ANTES do setDoc para não receber o próprio evento de encerramento
  if (_unsub) { _unsub(); _unsub = null; }

  // Para streams
  _localStream?.getTracks().forEach(t => t.stop());
  _localStream = null;
  _camOn = false; _micOn = false;

  try {
    await setDoc(_wpDoc, { status: 'ended', endedBy: _myName, endedAt: Date.now() }, { merge: true });
  } catch(e) {}

  // FIX Bug C6: usa _onSessionEnded(true) para evitar toast "sessão encerrada" para quem encerrou
  _onSessionEnded(true);
}

function _onSessionEnded(byMe) {
  if (_unsub)      { _unsub();      _unsub      = null; }
  if (_unsubNotif) { _unsubNotif(); _unsubNotif = null; }  // FIX BUG-15: limpa listener de convite
  _lastSyncTs      = 0;  // reseta para não bloquear eventos da próxima sessão
  _lastKnownStatus = null;
  _lastReactionTs  = 0;

  _localStream?.getTracks().forEach(t => t.stop());
  _localStream = null;
  _camOn = false; _micOn = false;

  if (!byMe) {
    window.showToast?.('🎬 Sessão de cinema encerrada.');
  }
  _closePanel();
  _resetUI();

  // Reativa listener de convite para próxima sessão (com pequeno delay para evitar loop)
  // BUG-H6: flag previne dois setTimeout simultâneos agendarem dois _listenForInvite
  if (_db && !_listenForInvitePending) {
    _listenForInvitePending = true;
    setTimeout(() => { _listenForInvitePending = false; _listenForInvite(); }, 600);
  }
}

function _resetUI() {
  const chat = document.getElementById('wp-chat');
  if (chat) chat.innerHTML = '';
  document.getElementById('wp-waiting')?.classList.remove('hidden');
  document.getElementById('wp-videos')?.classList.add('hidden');
  const dot = document.getElementById('wp-status-dot');
  if (dot) dot.className = 'wp-status-dot';
  const hint = document.getElementById('wp-waiting-hint');
  if (hint) hint.textContent = '';
  const btn = document.getElementById('wp-invite-action-btn');
  if (btn) { btn.disabled = false; btn.textContent = 'Convidar agora 💕'; }
  const camBtn = document.getElementById('wp-cam-btn');
  if (camBtn) { camBtn.className = 'wp-icon-btn'; camBtn.textContent = '📷'; }
  const micBtn = document.getElementById('wp-mic-btn');
  if (micBtn) { micBtn.className = 'wp-icon-btn'; micBtn.textContent = '🎙️'; }
}

/* ────────────────────────────────────────────
   HELPERS
──────────────────────────────────────────── */
function _formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function _escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
