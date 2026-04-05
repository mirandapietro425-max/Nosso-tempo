/* ═══════════════════════════════════════════════
   PIETRO & EMILLY — games.js v43
   Arcade do Casal 🎮
   ✦ Modo Online  — Firebase, jogar com Emilly de longe
   ✦ Modo Tela Dividida — Emilly em cima, Pietro em baixo
   ✦ Bug fixes: Velha turnos, cleanup de animações, Quiz turnos
   ═══════════════════════════════════════════════ */

import { doc, setDoc, onSnapshot, deleteDoc }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

let _db = null;
export function initGames(db) {
  _db = db;
  _renderGameCards();
  _injectGameStyles();
}

/* ══════════════════════════════════════════
   CATÁLOGO
══════════════════════════════════════════ */
const CATALOG = [
  { id:'taekwondo', icon:'🥋', title:'Taekwondo',           desc:'Combate 1v1 — derrube o rival!',       fn: openTaekwondo },
  { id:'quiz',      icon:'💘', title:'Quiz do Casal',       desc:'Competição de perguntas em dupla!',    fn: openQuiz      },
  { id:'memoria',   icon:'🃏', title:'Jogo da Memória',     desc:'Turnos alternados — quem acha mais?',  fn: openMemoria   },
  { id:'alvo',      icon:'🎯', title:'Tiro ao Alvo',        desc:'Clique nos alvos — pontos separados!', fn: openAlvo      },
  { id:'snake',     icon:'🐍', title:'Snake Dupla',         desc:'Duas cobras — não se esbarrem!',       fn: openSnake     },
  { id:'corrida',   icon:'🏃', title:'Corrida de Corações', desc:'Corra até o coração do outro!',        fn: openCorrida   },
  { id:'velha',     icon:'❌', title:'Jogo da Velha',       desc:'Clássico X e O em dupla!',             fn: openVelha     },
  { id:'caraacara', icon:'🤔', title:'Cara a Cara',         desc:'Adivinhe o personagem do outro!',      fn: openCaraACara },
  { id:'desenho',   icon:'🎨', title:'Adivinhe o Desenho',  desc:'Desenhe e o outro tenta adivinhar!',   fn: openDesenho   },
  { id:'uno',       icon:'🃏', title:'Uno do Casal',        desc:'Cartas especiais de amor — só online!', fn: openUno       },
  { id:'vdd',       icon:'🔥', title:'Verdade ou Desafio',  desc:'Revelações e desafios a dois!',         fn: openVDD       },
  { id:'roleta',    icon:'🎲', title:'Roleta do Casal',     desc:'Gire e cumpra o destino juntos!',       fn: openRoleta    },
  { id:'musica',    icon:'🎵', title:'Adivinhe a Música',   desc:'Ouça o trecho e adivinhe a música!',    fn: openMusica    },
  { id:'quemsoueu', icon:'⚡', title:'Quem Sou Eu?',        desc:'Post-it na testa — descubra quem é!',   fn: openQuemSouEu },
  { id:'cacanivel', icon:'🎰', title:'Caça-Níquel do Amor', desc:'Gire e ganhe recompensas românticas!',   fn: openCacaNivel },
];

function _renderGameCards() {
  const grid = document.getElementById('games-grid');
  if (!grid) return;
  grid.innerHTML = CATALOG.map(g => `
    <div class="game-card" data-game-id="${g.id}" onclick="window._openGame(this.dataset.gameId)">
      <span class="game-badge duo">👥 Dupla</span>
      <span class="game-card-icon">${g.icon}</span>
      <div class="game-card-title">${g.title}</div>
      <div class="game-card-desc">${g.desc}</div>
    </div>`).join('');
}

window._openGame = function(id) {
  const g = CATALOG.find(x => x.id === id);
  if (g) _showModeSelector(g);
};

/* ══════════════════════════════════════════
   SELETOR DE MODO
══════════════════════════════════════════ */
function _showModeSelector(game) {
  _closeModeOverlay();
  const mo = document.createElement('div');
  mo.id = 'game-mode-overlay';
  mo.innerHTML = `
    <div class="gm-modal">
      <button class="gm-x" onclick="window._closeModeOverlay()">✕</button>
      <div class="gm-icon-big">${game.icon}</div>
      <div class="gm-modal-title">${game.title}</div>
      <button class="gm-choice-btn" id="gmo-online">
        <span class="gm-choice-icon">🌐</span>
        <div>
          <div class="gm-choice-label">Online</div>
          <div class="gm-choice-sub">Jogar com a Emilly de longe</div>
        </div>
      </button>
      <button class="gm-choice-btn" id="gmo-split">
        <span class="gm-choice-icon">📱</span>
        <div>
          <div class="gm-choice-label">Presencial — Tela Dividida</div>
          <div class="gm-choice-sub">Emilly em cima · você em baixo</div>
        </div>
      </button>
    </div>`;
  document.body.appendChild(mo);
  requestAnimationFrame(() => mo.classList.add('show'));

  document.getElementById('gmo-online').addEventListener('click', () => {
    _closeModeOverlay();
    if (!_db) {
      _showGmInfo('😕', 'Firebase desconectado',
        'O modo online precisa do Firebase. Verifique a conexão.');
      return;
    }
    _showOnlineLobby(game);
  });
  document.getElementById('gmo-split').addEventListener('click', () => {
    _closeModeOverlay();
    game.fn('split', null);
  });
}

window._closeModeOverlay = function() {
  const el = document.getElementById('game-mode-overlay');
  if (!el) return;
  el.classList.remove('show');
  setTimeout(() => el.remove(), 280);
};

function _showGmInfo(icon, title, sub) {
  _closeModeOverlay();
  const mo = document.createElement('div');
  mo.id = 'game-mode-overlay';
  mo.innerHTML = `
    <div class="gm-modal" style="text-align:center">
      <div style="font-size:2.2rem;margin-bottom:.4rem">${icon}</div>
      <div class="gm-modal-title">${title}</div>
      <p style="color:rgba(255,255,255,.55);font-size:.8rem;margin:.4rem 0 1rem">${sub}</p>
      <button class="gm-choice-btn" onclick="window._closeModeOverlay()">
        <span class="gm-choice-icon">←</span>
        <div><div class="gm-choice-label">Voltar</div></div>
      </button>
    </div>`;
  document.body.appendChild(mo);
  requestAnimationFrame(() => mo.classList.add('show'));
}

/* ══════════════════════════════════════════
   SISTEMA DE SALAS — FIREBASE
══════════════════════════════════════════ */
let _roomUnsub     = null;
let _roomCode      = null;
let _syncInterval  = null;

async function _createRoom(gameId, initData = {}) {
  const code = String(Math.floor(1000 + Math.random() * 9000));
  _roomCode = code;
  await setDoc(doc(_db, 'game_rooms', code), {
    gameId,
    state: 'waiting',
    data: initData,
    p2input: {},
    ts: Date.now(),
  });
  return code;
}

async function _writeRoom(updates) {
  if (!_roomCode || !_db) return;
  try {
    await setDoc(
      doc(_db, 'game_rooms', _roomCode),
      { ...updates, ts: Date.now() },
      { merge: true }
    );
  } catch (e) { /* ignore transient errors */ }
}

function _listenRoom(code, cb) {
  if (_roomUnsub) { _roomUnsub(); _roomUnsub = null; }
  _roomCode = code;
  _roomUnsub = onSnapshot(doc(_db, 'game_rooms', code), snap => {
    if (snap.exists()) cb(snap.data());
  });
}

function _cleanupRoom() {
  if (_syncInterval)  { clearInterval(_syncInterval);  _syncInterval  = null; }
  if (_roomUnsub)     { _roomUnsub();                  _roomUnsub     = null; }
  if (_roomCode && _db) {
    try { deleteDoc(doc(_db, 'game_rooms', _roomCode)); } catch(e) {}
    _roomCode = null;
  }
}

/* ══════════════════════════════════════════
   LOBBY ONLINE
══════════════════════════════════════════ */
function _showOnlineLobby(game) {
  _closeModeOverlay();
  const mo = document.createElement('div');
  mo.id = 'game-mode-overlay';
  mo.innerHTML = `
    <div class="gm-modal">
      <button class="gm-x" onclick="window._closeModeOverlay()">✕</button>
      <div class="gm-icon-big">${game.icon} Online</div>
      <button class="gm-choice-btn" id="gmo-create">
        <span class="gm-choice-icon">➕</span>
        <div>
          <div class="gm-choice-label">Criar Sala</div>
          <div class="gm-choice-sub">Você cria e espera a Emilly entrar</div>
        </div>
      </button>
      <button class="gm-choice-btn" id="gmo-join">
        <span class="gm-choice-icon">🔑</span>
        <div>
          <div class="gm-choice-label">Entrar na Sala</div>
          <div class="gm-choice-sub">Insira o código de 4 dígitos</div>
        </div>
      </button>
    </div>`;
  document.body.appendChild(mo);
  requestAnimationFrame(() => mo.classList.add('show'));

  document.getElementById('gmo-create').addEventListener('click', async () => {
    const modal = mo.querySelector('.gm-modal');
    modal.innerHTML = `<div class="gm-loading">Criando sala…</div>`;
    const initData = _getInitData(game.id);
    const code = await _createRoom(game.id, initData);
    _renderWaiting(modal, game, code);
  });

  document.getElementById('gmo-join').addEventListener('click', () => {
    const modal = mo.querySelector('.gm-modal');
    modal.innerHTML = `
      <button class="gm-x" id="gm-back">✕</button>
      <div class="gm-icon-big">🔑</div>
      <div class="gm-modal-title">Entrar na Sala</div>
      <p style="color:rgba(255,255,255,.55);font-size:.78rem;text-align:center;margin:.2rem 0 .9rem">
        Peça o código de 4 dígitos para o Pietro 💙
      </p>
      <input id="gm-code-inp" type="tel" inputmode="numeric" maxlength="4" placeholder="0000"
        style="width:100%;padding:.7rem;font-size:2rem;text-align:center;letter-spacing:.5rem;
               border:2px solid rgba(255,255,255,.2);border-radius:14px;
               background:rgba(255,255,255,.08);color:white;outline:none;
               box-sizing:border-box;font-family:monospace">
      <button class="gm-choice-btn" id="gm-join-ok" style="margin-top:.8rem">
        <span class="gm-choice-icon">▶</span>
        <div><div class="gm-choice-label">Entrar</div></div>
      </button>
      <div id="gm-join-err" style="color:#e8536f;font-size:.75rem;text-align:center;min-height:1.1rem;margin-top:.3rem"></div>`;

    document.getElementById('gm-back').addEventListener('click', () => {
      _closeModeOverlay(); _showOnlineLobby(game);
    });
    document.getElementById('gm-join-ok').addEventListener('click', async () => {
      const code = (document.getElementById('gm-code-inp')?.value || '').trim();
      const err  = document.getElementById('gm-join-err');
      if (code.length !== 4) { if (err) err.textContent = 'Digite 4 dígitos'; return; }
      _roomCode = code;
      try {
        await _writeRoom({ state: 'playing' });
        mo.remove();
        game.fn('online', { code, role: 'guest' });
      } catch (e) {
        if (err) err.textContent = 'Sala não encontrada. Verifique o código.';
      }
    });
  });
}

function _renderWaiting(modal, game, code) {
  modal.innerHTML = `
    <button class="gm-x" id="gm-cancel">✕</button>
    <div style="text-align:center">
      <div style="font-size:1.8rem;margin-bottom:.3rem">💌</div>
      <div class="gm-modal-title">Sala criada!</div>
      <p style="color:rgba(255,255,255,.5);font-size:.78rem;margin:.3rem 0 .8rem">
        Manda esse código para a Emilly 💗
      </p>
      <div class="gm-room-code">${code}</div>
      <div class="gm-waiting-msg">
        Aguardando Emilly<span class="gm-dots"></span>
      </div>
    </div>`;
  document.getElementById('gm-cancel').addEventListener('click', async () => {
    _cleanupRoom(); _closeModeOverlay();
  });
  _listenRoom(code, data => {
    if (data.state === 'playing') {
      document.getElementById('game-mode-overlay')?.remove();
      game.fn('online', { code, role: 'host', roomData: data });
    }
  });
}

function _getInitData(gameId) {
  if (gameId === 'quiz') {
    const qs = [...QUIZ_QUESTIONS].sort(() => Math.random() - .5).slice(0, 8);
    return { qs, qi: 0, s1: 0, s2: 0, turn: 0 };
  }
  if (gameId === 'velha') {
    return { board: Array(9).fill(null), turn: 0, s1: 0, s2: 0 };
  }
  if (gameId === 'memoria') {
    const EMOJIS = ['💕','🌹','💙','🌸','🥰','✨','💫','🎵','🏡','📚','🌙','💎'];
    const order = [...EMOJIS, ...EMOJIS].sort(() => Math.random() - .5);
    return { order, states: Array(24).fill(0), flipped: [], turn: 0, s1: 0, s2: 0, locked: false };
  }
  if (gameId === 'caraacara') {
    return { phase: 'choose1', c1Idx: -1, c2Idx: -1, log: [], turn: 0 };
  }
  if (gameId === 'desenho') {
    const palavras = DESENHO_PALAVRAS.sort(() => Math.random() - .5).slice(0, 6);
    return { phase: 'choose', palavra: '', turn: 0, s1: 0, s2: 0, round: 1, totalRounds: 6, strokes: [], guess: '', guessed: false, palavras };
  }
  if (gameId === 'uno') {
    return _unoInitState();
  }
  if (gameId === 'vdd') {
    return { phase: 'spin', turn: 0, s1: 0, s2: 0, card: null, answered: false };
  }
  if (gameId === 'roleta') {
    return { phase: 'spin', turn: 0, s1: 0, s2: 0, sector: null, done: false, spinning: false };
  }
  if (gameId === 'quemsoueu') {
    const deck = [...QSE_CARDS].sort(() => Math.random() - .5);
    return { phase: 'pick', turn: 0, s1: 0, s2: 0, round: 1, totalRounds: 6, deck, cardIdx: 0, card: null, timeLeft: 60, asking: false };
  }
  if (gameId === 'cacanivel') {
    return { phase: 'idle', turn: 0, s1: 0, s2: 0, reels: ['💕','💕','💕'], spinning: false, reward: null, round: 0 };
  }
  if (gameId === 'musica') {
    const order = [...MUSICA_TRACKS].sort(() => Math.random() - .5).slice(0, 8);
    return { phase: 'listen', qi: 0, tracks: order, turn: 0, s1: 0, s2: 0, answered: false, guess: '', result: null };
  }
  // Real-time games: empty initial state (host sets up on start)
  return {};
}

/* ══════════════════════════════════════════
   OVERLAY & HELPERS
══════════════════════════════════════════ */
let _activeCleanup = null;

function _createOverlay(title) {
  document.getElementById('game-overlay')?.remove();
  if (_activeCleanup) { try { _activeCleanup(); } catch(e){} _activeCleanup = null; }
  const ov = document.createElement('div');
  ov.className = 'game-overlay'; ov.id = 'game-overlay';
  ov.innerHTML = `
    <div class="game-header">
      <div class="game-title-bar">${title}</div>
      <button class="game-close-btn" onclick="window._closeGame()">✕</button>
    </div>
    <div class="game-body" id="game-body"></div>`;
  document.body.appendChild(ov);
  requestAnimationFrame(() => ov.classList.add('show'));
  return document.getElementById('game-body');
}

window._closeGame = function() {
  if (_activeCleanup) { try { _activeCleanup(); } catch(e){} _activeCleanup = null; }
  _cleanupRoom();
  const ov = document.getElementById('game-overlay');
  if (!ov) return;
  ov.classList.remove('show');
  setTimeout(() => ov.remove(), 320);
};

function _showResult(body, emoji, title, sub, onRestart) {
  body.innerHTML = `
    <div class="game-result">
      <div class="game-result-emoji">${emoji}</div>
      <div class="game-result-title">${title}</div>
      <div class="game-result-sub">${sub}</div>
      <div class="game-btn-row">
        <button class="game-restart-btn" id="g-exit-btn">Sair 👋</button>
        <button class="game-restart-btn" id="g-restart-btn">Jogar de novo 🔄</button>
      </div>
    </div>`;
  document.getElementById('g-exit-btn')?.addEventListener('click', window._closeGame);
  document.getElementById('g-restart-btn')?.addEventListener('click', onRestart);
}

/* Dpad genérico para jogos canvas */
function _mkDpad(p, colorBg, colorBtn, label, actions) {
  // actions: {up, down, left, right, extra?}
  return `
    <div class="split-ctrl-panel" style="border-color:${colorBg}20;background:${colorBg}12">
      <div class="split-ctrl-label" style="color:${colorBg}">${label}</div>
      <div style="display:grid;grid-template-columns:repeat(3,44px);gap:4px;justify-content:center">
        <div></div>
        <button class="tkd-btn" data-p="${p}" data-a="${actions.up}"    style="background:${colorBtn}">⬆️</button>
        <div></div>
        <button class="tkd-btn" data-p="${p}" data-a="${actions.left}"  style="background:${colorBg}99">⬅️</button>
        ${actions.extra
          ? `<button class="tkd-btn" data-p="${p}" data-a="${actions.extra}" style="background:#e8a020">${actions.extraIcon||'⚡'}</button>`
          : `<div></div>`}
        <button class="tkd-btn" data-p="${p}" data-a="${actions.right}" style="background:${colorBg}99">➡️</button>
        ${actions.block
          ? `<div></div><button class="tkd-btn" data-p="${p}" data-a="${actions.block}" style="background:#1a5a8a;grid-column:2">🛡️</button><div></div>`
          : `<div></div><div></div><div></div>`}
      </div>
    </div>`;
}

const TOUCH_BTN_STYLE = `
  .tkd-btn{touch-action:none;user-select:none;-webkit-user-select:none;border:none;
  border-radius:8px;padding:9px 3px;font-size:.95rem;cursor:pointer;color:white;
  min-height:40px;-webkit-tap-highlight-color:transparent;transition:opacity .1s,transform .1s}
  .tkd-btn:active{opacity:.7;transform:scale(.93)}`;

/* ══════════════════════════════════════════
   🥋 TAEKWONDO
══════════════════════════════════════════ */
function openTaekwondo(mode = 'split', ctx = null) {
  const body = _createOverlay('🥋 Taekwondo');
  const CW=340, CH=170, GND=CH-32, PW=26, PH=42, HP_MAX=100;
  let animId=null;
  const k1={left:false,right:false,jump:false,kick:false,block:false};
  const k2={left:false,right:false,jump:false,kick:false,block:false};
  function mkP(x,color,dir){return{x,y:GND-PH,vx:0,vy:0,hp:HP_MAX,dir,onGround:true,color,kick:0,block:0,hitFlash:0,wins:0};}
  let p1=mkP(50,'#4a90d9',1), p2=mkP(260,'#e8536f',-1);
  let rOver=false, rMsg='', rTimer=0;

  const isOnline = mode === 'online';
  const isHost   = ctx?.role === 'host';

  /* ── HTML ── */
  const dpadP1 = _mkDpad('1','#4a90d9','#2a6a9a','Pietro 💙',
    {up:'jump', left:'left', right:'right', extra:'kick', extraIcon:'🥋', block:'block'});
  const dpadP2 = _mkDpad('2','#e8536f','#b02a50','Emilly 💗',
    {up:'jump', left:'left', right:'right', extra:'kick', extraIcon:'🥋', block:'block'});

  body.innerHTML = `
    ${mode === 'split' ? `<div class="split-top">${dpadP2}</div>` : ''}
    <div id="tkd-bars" style="display:flex;justify-content:space-between;align-items:center;
      padding:3px 6px;background:rgba(0,0,0,.4);border-radius:8px;width:100%;box-sizing:border-box">
      <div style="flex:1;text-align:center">
        <div style="font-size:.6rem;color:#4a90d9;font-weight:700">Pietro 💙</div>
        <div style="height:8px;background:#222;border-radius:4px;overflow:hidden;margin:2px 0">
          <div id="hp1" style="height:100%;width:100%;background:linear-gradient(90deg,#4a90d9,#7ab8f5);transition:width .15s"></div></div>
        <span id="wins1" style="font-size:.7rem;color:#4a90d9">🏆 0</span>
      </div>
      <div style="padding:0 8px;font-size:.75rem;font-weight:700;color:#fff">VS</div>
      <div style="flex:1;text-align:center">
        <div style="font-size:.6rem;color:#e8536f;font-weight:700">Emilly 💗</div>
        <div style="height:8px;background:#222;border-radius:4px;overflow:hidden;margin:2px 0">
          <div id="hp2" style="height:100%;width:100%;background:linear-gradient(90deg,#e8536f,#f5a0b0);transition:width .15s"></div></div>
        <span id="wins2" style="font-size:.7rem;color:#e8536f">🏆 0</span>
      </div>
    </div>
    <canvas id="tkd-canvas" width="${CW}" height="${CH}"
      style="width:100%;max-width:380px;display:block;margin:0 auto;border-radius:8px;touch-action:none"></canvas>
    ${mode === 'split'
      ? `<div class="split-bot">${dpadP1}</div>`
      : `<div style="display:flex;gap:6px;width:100%">${dpadP1}${dpadP2}</div>`}
    <style>${TOUCH_BTN_STYLE}</style>`;

  const canvas = document.getElementById('tkd-canvas');
  const ctx2   = canvas.getContext('2d');

  /* bind buttons */
  const kMap = {'1':k1,'2':k2};
  body.querySelectorAll('.tkd-btn[data-p][data-a]').forEach(btn => {
    const k = kMap[btn.dataset.p], a = btn.dataset.a;
    btn.addEventListener('pointerdown', e => { e.preventDefault(); btn.setPointerCapture(e.pointerId); k[a]=true; }, {passive:false});
    btn.addEventListener('pointerup',      () => k[a]=false);
    btn.addEventListener('pointercancel',  () => k[a]=false);
    btn.addEventListener('pointerleave',   () => k[a]=false);
  });

  const onKey = e => {
    const d = e.type === 'keydown';
    const kA = {a:['left'],d:['right'],w:['jump'],f:['kick'],s:['block']};
    const kB = {ArrowLeft:['left'],ArrowRight:['right'],ArrowUp:['jump'],Enter:['kick'],ArrowDown:['block']};
    if (kA[e.key]) k1[kA[e.key][0]] = d;
    if (kB[e.key]) k2[kB[e.key][0]] = d;
  };
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup',   onKey);

  /* online: guest sends inputs, host syncs state */
  if (isOnline && !isHost) {
    /* guest: read state from Firebase, send input */
    _listenRoom(ctx.code, data => {
      if (!data.data || !data.data.p1) return;
      const d = data.data;
      p1 = {...p1, ...d.p1}; p2 = {...p2, ...d.p2};
      rOver = d.rOver; rMsg = d.rMsg||'';
      _tkdUpdateUI();
      if (rOver && rMsg) _showResult(body,'🥋',rMsg,`Pietro ${p1.wins} × ${p2.wins} Emilly`,()=>openTaekwondo(mode,ctx));
    });
    /* guest sends k2 to firebase */
    _syncInterval = setInterval(async () => {
      await _writeRoom({ p2input: {...k2} });
    }, 120);
    _activeCleanup = () => {
      cancelAnimationFrame(animId);
      clearInterval(_syncInterval); _syncInterval = null;
      if (_roomUnsub) { _roomUnsub(); _roomUnsub = null; }
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup',   onKey);
    };
    return; /* guest does not run game loop */
  }

  /* host / local: run full game loop */
  if (isOnline && isHost) {
    /* host reads guest input */
    _listenRoom(ctx.code, data => {
      if (data.p2input) Object.assign(k2, data.p2input);
    });
    /* host syncs state */
    _syncInterval = setInterval(async () => {
      await _writeRoom({ data: { p1:{x:p1.x,y:p1.y,hp:p1.hp,dir:p1.dir,kick:p1.kick,block:p1.block,wins:p1.wins},
        p2:{x:p2.x,y:p2.y,hp:p2.hp,dir:p2.dir,kick:p2.kick,block:p2.block,wins:p2.wins},
        rOver, rMsg } });
    }, 150);
    // BUG-H3: _activeCleanup definido imediatamente após o interval do host
    // para que qualquer chamada de cleanup entre aqui e o _activeCleanup final (linha ~551) não vaze o interval
    _activeCleanup = () => { if(_syncInterval){clearInterval(_syncInterval);_syncInterval=null;} if(_roomUnsub){_roomUnsub();_roomUnsub=null;} };
  }

  function _tkdUpdateUI() {
    const h1=document.getElementById('hp1'); if(h1) h1.style.width=Math.max(0,p1.hp)+'%';
    const h2=document.getElementById('hp2'); if(h2) h2.style.width=Math.max(0,p2.hp)+'%';
    const w1=document.getElementById('wins1'); if(w1) w1.textContent='🏆 '+p1.wins;
    const w2=document.getElementById('wins2'); if(w2) w2.textContent='🏆 '+p2.wins;
  }

  function moveP(p, k) {
    if(rOver) return;
    if(k.left){p.vx=-3.2;p.dir=-1;}else if(k.right){p.vx=3.2;p.dir=1;}else p.vx*=0.65;
    if(k.jump&&p.onGround){p.vy=-8;p.onGround=false;}
    p.block = k.block ? 8 : Math.max(0,p.block-1);
    if(p.kick>0) p.kick--; else if(k.kick) p.kick=10;
    p.vy+=0.42; p.x+=p.vx; p.y+=p.vy;
    if(p.y>=GND-PH){p.y=GND-PH;p.vy=0;p.onGround=true;}
    p.x=Math.max(4,Math.min(CW-PW-4,p.x));
    if(p.hitFlash>0) p.hitFlash--;
  }

  function checkHit(att, def) {
    if(att.kick<8&&att.kick>2){
      const kx = att.x+(att.dir===1?PW+6:-10);
      if(Math.abs(kx-def.x-PW/2)<18&&Math.abs(att.y-def.y)<PH){
        if(def.block>0){def.hp-=3;}else{def.hp-=12;def.hitFlash=8;}
      }
    }
  }

  function drawP(p) {
    ctx2.fillStyle = p.hitFlash>0 ? '#fff' : p.color;
    ctx2.fillRect(p.x+4,p.y+12,18,20); /* body */
    ctx2.fillStyle='#ffd6b0'; ctx2.beginPath(); ctx2.arc(p.x+PW/2,p.y+7,7,0,Math.PI*2); ctx2.fill(); /* head */
    if(p.kick>2&&p.kick<10){ /* kick leg */
      ctx2.fillStyle=p.color; const kx=p.x+(p.dir===1?PW:0);
      ctx2.fillRect(kx,p.y+22,12,5);
    }
    if(p.block>0){ ctx2.strokeStyle='rgba(255,255,255,.6)'; ctx2.lineWidth=3;
      const sx=p.dir===1?p.x-4:p.x+PW+4;
      ctx2.beginPath(); ctx2.moveTo(sx,p.y); ctx2.lineTo(sx,p.y+PH); ctx2.stroke();}
  }

  function loop(ts) {
    if(!animId&&animId!==0) return;
    moveP(p1,k1); moveP(p2,k2);
    checkHit(p1,p2); checkHit(p2,p1);
    p1.hp=Math.max(0,p1.hp); p2.hp=Math.max(0,p2.hp);

    if(!rOver&&(p1.hp<=0||p2.hp<=0)){
      rOver=true;
      if(p1.hp<=0&&p2.hp<=0){rMsg='Empate 💥';}
      else if(p1.hp<=0){p2.wins++;rMsg='Emilly venceu! 💗';}
      else{p1.wins++;rMsg='Pietro venceu! 💙';}
      rTimer=120;
      _tkdUpdateUI();
    }
    if(rOver&&rTimer>0){rTimer--;
      if(rTimer===0){
        if(p1.wins>=3||p2.wins>=3){
          cancelAnimationFrame(animId); animId=null;
          _showResult(body,'🥋',`${p1.wins>=3?'Pietro 💙':'Emilly 💗'} venceu o combate!`,
            `Pietro ${p1.wins} × ${p2.wins} Emilly`,()=>openTaekwondo(mode,ctx));
          return;
        }
        const _w1=p1.wins, _w2=p2.wins;
        p1=mkP(50,'#4a90d9',1); p1.wins=_w1; p2=mkP(260,'#e8536f',-1); p2.wins=_w2;
        rOver=false; rMsg=''; _tkdUpdateUI();
      }
    }

    ctx2.fillStyle='#0f0f1a'; ctx2.fillRect(0,0,CW,CH);
    ctx2.fillStyle='#1a1a3a'; ctx2.fillRect(0,GND,CW,CH-GND);
    ctx2.fillStyle='rgba(74,144,217,.4)'; ctx2.fillRect(0,GND,CW,2);
    drawP(p1); drawP(p2);
    _tkdUpdateUI();
    if(rOver&&rMsg){ctx2.fillStyle='rgba(0,0,0,.65)';ctx2.fillRect(CW/2-70,CH/2-14,140,28);
      ctx2.fillStyle='white';ctx2.font='bold 12px "DM Sans",sans-serif';
      ctx2.textAlign='center';ctx2.fillText(rMsg,CW/2,CH/2+4);ctx2.textAlign='left';}
    animId = requestAnimationFrame(loop);
  }
  animId = requestAnimationFrame(loop);
  _activeCleanup = () => {
    cancelAnimationFrame(animId); animId=null;
    if(_syncInterval){clearInterval(_syncInterval);_syncInterval=null;}
    if(_roomUnsub){_roomUnsub();_roomUnsub=null;}
    window.removeEventListener('keydown',onKey); window.removeEventListener('keyup',onKey);
  };
}

/* ══════════════════════════════════════════
   💘 QUIZ
   BUG FIX: turn alterna a cada pergunta (não a cada 2)
══════════════════════════════════════════ */
const QUIZ_QUESTIONS = [
  {q:'Quando Pietro e Emilly começaram a namorar?',opts:['11 de setembro','11 de outubro','11 de novembro','11 de dezembro'],correct:1},
  {q:'Qual é a cor dos olhos da Emilly?',opts:['Azuis','Castanhos','Verdes','Pretos'],correct:2},
  {q:'Qual é a música favorita do casal na playlist?',opts:['Skyfall','Mania de Você','Sailor Song','Home'],correct:1},
  {q:'Em qual cidade o casal mora?',opts:['Porto Alegre','Florianópolis','Santa Maria','Caxias do Sul'],correct:2},
  {q:'Qual é o dia do mesversário deles?',opts:['Dia 5','Dia 9','Dia 11','Dia 24'],correct:2},
  {q:'Qual é o aniversário do Pietro?',opts:['9 de janeiro','24 de abril','11 de outubro','25 de dezembro'],correct:0},
  {q:'Qual é o aniversário da Emilly?',opts:['9 de janeiro','24 de abril','11 de outubro','25 de dezembro'],correct:1},
  {q:'Qual personagem Disney a Emilly mais gosta?',opts:['Cinderela','Mulan','Ariel','Branca de Neve'],correct:2},
  {q:'Qual música de Adele está na playlist deles?',opts:['Hello','Skyfall','Someone Like You','Rolling in the Deep'],correct:1},
  {q:'Qual é a cor favorita da Emilly?',opts:['Azul','Rosa','Roxo','Verde'],correct:1},
  {q:'Qual é o signo do Pietro?',opts:['Capricórnio','Touro','Aquário','Áries'],correct:0},
  {q:'Qual é o signo da Emilly?',opts:['Touro','Gêmeos','Áries','Câncer'],correct:0},
  {q:'Qual série o casal mais assiste?',opts:['Friends','Stranger Things','Dark','Wednesday'],correct:1},
  {q:'Quantos slots de fotos tem a galeria do site?',opts:['4','6','8','10'],correct:1},
];

function openQuiz(mode = 'split', ctx = null) {
  const body = _createOverlay('💘 Quiz do Casal');
  const isOnline = mode === 'online';
  const isHost   = ctx?.role === 'host';

  let qs, qi, s1, s2, turn;
  let _feedbackLock = false; // prevents Firebase listener from cutting feedback short

  function init(data) {
    qs   = data.qs   || [...QUIZ_QUESTIONS].sort(() => Math.random()-.5).slice(0,8);
    qi   = data.qi   ?? 0;
    s1   = data.s1   ?? 0;
    s2   = data.s2   ?? 0;
    turn = data.turn ?? 0;
  }

  function render(showFeedback = null) {
    if (qi >= qs.length) {
      const emoji = s1===s2?'🤝':s1>s2?'💙':'💗';
      const w = s1===s2?'Empate!':s1>s2?'Pietro venceu!':'Emilly venceu!';
      _showResult(body, emoji, w, `Pietro ${s1} × ${s2} Emilly`, () => openQuiz(mode, ctx));
      return;
    }
    const q    = qs[qi];
    const isP1 = turn === 0;
    const pc   = isP1 ? '#4a90d9' : '#e8536f';
    const pn   = isP1 ? '💙 Pietro' : '💗 Emilly';

    /* In online mode: only the active player can answer */
    const myTurn = !isOnline ||
      (isHost && turn === 0) || (!isHost && turn === 1);

    body.innerHTML = `
      <div class="game-score-bar">
        <div class="game-score-box" style="border:1px solid ${isP1?'#4a90d9':'transparent'}">
          <div class="game-score-label">Pietro 💙</div>
          <div class="game-score-num" style="color:#4a90d9">${s1}</div>
        </div>
        <div class="game-score-box">
          <div class="game-score-label">Perg. ${qi+1}/${qs.length}</div>
          <div class="game-score-num" style="font-size:.9rem">🎯</div>
        </div>
        <div class="game-score-box" style="border:1px solid ${!isP1?'#e8536f':'transparent'}">
          <div class="game-score-label">Emilly 💗</div>
          <div class="game-score-num" style="color:#e8536f">${s2}</div>
        </div>
      </div>
      <div style="text-align:center;font-size:.75rem;color:${pc};font-weight:700;margin:.3rem 0">
        ${myTurn ? `Vez de ${pn}` : `Aguardando ${pn}…`}
      </div>
      <div class="quiz-question">
        <div class="quiz-q-num">Pergunta ${qi+1}</div>
        <div class="quiz-q-text">${q.q}</div>
        <div class="quiz-options">
          ${q.opts.map((o,i)=>`<button class="quiz-opt${showFeedback&&showFeedback.correct===i?' correct':showFeedback&&showFeedback.chosen===i&&showFeedback.chosen!==q.correct?' wrong':''}"
            data-i="${i}" ${(!myTurn||showFeedback)?'disabled':''}>${o}</button>`).join('')}
        </div>
      </div>
      <div class="quiz-feedback" id="quiz-fb">
        ${showFeedback ? (showFeedback.chosen===q.correct ? '✅ Correto! 🎉' : `❌ Era: ${q.opts[q.correct]}`) : ''}
      </div>`;

    if (!myTurn || showFeedback) return;

    body.querySelectorAll('.quiz-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        body.querySelectorAll('.quiz-opt').forEach(b => b.disabled = true);
        const chosen = Number(btn.dataset.i);
        const correct = chosen === q.correct;
        if (correct) { if(turn===0) s1++; else s2++; }
        const feedback = { chosen, correct: q.correct };

        /* show feedback briefly, then advance */
        _feedbackLock = true;
        render(feedback);
        setTimeout(async () => {
          qi++;
          turn = turn === 0 ? 1 : 0; /* BUG FIX: alterna a cada pergunta */
          if (isOnline) {
            _feedbackLock = false;
            await _writeRoom({ data: { qs, qi, s1, s2, turn } });
          } else {
            _feedbackLock = false;
            render();
          }
        }, 1300);
      });
    });
  }

  if (isOnline) {
    _listenRoom(ctx.code, data => {
      if (!data.data || data.data.qs === undefined) return;
      if (_feedbackLock) return; // don't interrupt feedback display
      init(data.data);
      render();
    });
    if (isHost) {
      /* host initializes */
      const initData = _getInitData('quiz');
      init(initData);
      _writeRoom({ data: initData });
    }
    _activeCleanup = () => { if(_roomUnsub){_roomUnsub();_roomUnsub=null;} };
    return;
  }

  /* local */
  init(_getInitData('quiz'));
  render();
}

/* ══════════════════════════════════════════
   🃏 MEMÓRIA
══════════════════════════════════════════ */
function openMemoria(mode = 'split', ctx = null) {
  const body     = _createOverlay('🃏 Memória Dupla');
  const isOnline = mode === 'online';
  const isHost   = ctx?.role === 'host';
  const EMOJIS   = ['💕','🌹','💙','🌸','🥰','✨','💫','🎵','🏡','📚','🌙','💎'];

  let turn, s1, s2, flipped, locked, cards;

  function init(data) {
    turn    = data.turn ?? 0;
    s1      = data.s1   ?? 0;
    s2      = data.s2   ?? 0;
    flipped = data.flipped ? [...data.flipped] : [];
    locked  = data.locked ?? false;
    const order = data.order || [...EMOJIS,...EMOJIS].sort(()=>Math.random()-.5);
    if (data.states) {
      cards = order.map((e,i) => ({
        id:i, emoji:e,
        flipped: data.states[i]===1||data.states[i]===2||data.states[i]===3,
        matched: data.states[i]===2||data.states[i]===3,
        owner:   data.states[i]===2?0:data.states[i]===3?1:null,
      }));
    } else {
      cards = order.map((e,i)=>({id:i,emoji:e,flipped:false,matched:false,owner:null}));
    }
  }

  function getStates() {
    return cards.map(c => c.matched ? (c.owner===0?2:3) : c.flipped?1:0);
  }

  function render() {
    const pn = turn===0?'💙 Pietro':'💗 Emilly';
    const pc = turn===0?'#4a90d9':'#e8536f';
    const myTurn = !isOnline || (isHost && turn===0) || (!isHost && turn===1);

    body.innerHTML = `
      <div class="game-score-bar">
        <div class="game-score-box" style="border:1px solid ${turn===0?'#4a90d9':'transparent'}">
          <div class="game-score-label">Pietro 💙</div><div class="game-score-num" style="color:#4a90d9">${s1}</div>
        </div>
        <div class="game-score-box">
          <div class="game-score-label" style="font-size:.55rem">Vez de</div>
          <div class="game-score-num" style="font-size:.8rem;color:${pc}">${pn}</div>
        </div>
        <div class="game-score-box" style="border:1px solid ${turn===1?'#e8536f':'transparent'}">
          <div class="game-score-label">Emilly 💗</div><div class="game-score-num" style="color:#e8536f">${s2}</div>
        </div>
      </div>
      <div class="memory-grid cols-4" id="mem-grid"></div>
      ${!myTurn ? `<div style="text-align:center;font-size:.75rem;color:${pc};opacity:.7">Aguardando ${pn}…</div>` : ''}`;

    const grid = document.getElementById('mem-grid');
    cards.forEach((c,i) => {
      const el = document.createElement('div');
      el.className = 'mem-card'+(c.flipped?' flipped':'')+(c.matched?' matched':'');
      if(c.matched) el.style.background = c.owner===0?'rgba(74,144,217,.3)':'rgba(232,83,111,.3)';
      el.innerHTML = `<div class="mem-card-inner"><div class="mem-front">💕</div><div class="mem-back">${c.emoji}</div></div>`;
      if (!c.matched && !locked && myTurn)
        el.addEventListener('click', () => flip(i));
      grid.appendChild(el);
    });
  }

  async function flip(i) {
    if (locked || cards[i].flipped || cards[i].matched) return;
    cards[i].flipped = true; flipped.push(i); render();
    if (flipped.length === 2) {
      locked = true;
      const [a,b] = flipped;
      if (cards[a].emoji === cards[b].emoji) {
        cards[a].matched = cards[b].matched = true;
        cards[a].owner   = cards[b].owner   = turn;
        if (turn===0) s1++; else s2++;
        flipped=[]; locked=false; render();
        if (s1+s2===EMOJIS.length) {
          const emoji=s1===s2?'🤝':s1>s2?'💙':'💗';
          const w=s1===s2?'Empate!':s1>s2?'Pietro venceu!':'Emilly venceu!';
          setTimeout(()=>_showResult(body,emoji,w,`Pietro ${s1} × ${s2} Emilly`,()=>openMemoria(mode,ctx)),500);
        }
        if (isOnline) await _writeRoom({ data:{order:cards.map(c=>c.emoji),states:getStates(),flipped:[],turn,s1,s2,locked:false} });
      } else {
        setTimeout(async () => {
          cards[a].flipped=cards[b].flipped=false; flipped=[]; locked=false;
          turn=turn===0?1:0; render();
          if (isOnline) await _writeRoom({ data:{order:cards.map(c=>c.emoji),states:getStates(),flipped:[],turn,s1,s2,locked:false} });
        }, 900);
      }
    }
  }

  if (isOnline) {
    _listenRoom(ctx.code, data => {
      if (!data.data || data.data.states === undefined) return;
      init(data.data); render();
    });
    if (isHost) { const d=_getInitData('memoria'); init(d); _writeRoom({data:d}); }
    _activeCleanup = () => { if(_roomUnsub){_roomUnsub();_roomUnsub=null;} };
    return;
  }
  init(_getInitData('memoria')); render();
}

/* ══════════════════════════════════════════
   🐍 SNAKE DUPLA
══════════════════════════════════════════ */
function openSnake(mode = 'split', ctx = null) {
  const body     = _createOverlay('🐍 Snake Dupla');
  const CELL=13, COLS=24, ROWS=18, W=COLS*CELL, H=ROWS*CELL;
  const isOnline = mode === 'online';
  const isHost   = ctx?.role === 'host';
  let s1,d1,nd1,s2,d2,nd2,food,sc1=0,sc2=0,running,animId2,_snakeDead=null;

  function reset(){
    s1=[{x:5,y:9},{x:4,y:9},{x:3,y:9}]; d1={x:1,y:0}; nd1={x:1,y:0};
    s2=[{x:19,y:9},{x:20,y:9},{x:21,y:9}]; d2={x:-1,y:0}; nd2={x:-1,y:0};
    sc1=0; sc2=0; running=true; _snakeDead=null; placeFood();
    const e1=document.getElementById('sc1'),e2=document.getElementById('sc2');
    if(e1)e1.textContent=0; if(e2)e2.textContent=0;
  }
  function placeFood(){do{food={x:Math.floor(Math.random()*COLS),y:Math.floor(Math.random()*ROWS)};}while([...s1,...s2].some(s=>s.x===food.x&&s.y===food.y));}

  const setD1=(x,y)=>{if(x!==(-d1.x)||y!==(-d1.y))nd1={x,y};};
  const setD2=(x,y)=>{if(x!==(-d2.x)||y!==(-d2.y))nd2={x,y};};

  function buildDpad(pNum, color1, color2, label, upFn, downFn, leftFn, rightFn) {
    return `
      <div class="split-ctrl-panel" style="background:${color1}12;border-color:${color1}20">
        <div class="split-ctrl-label" style="color:${color1}">${label}</div>
        <div style="display:grid;grid-template-columns:repeat(3,44px);gap:4px;justify-content:center">
          <div></div><button class="dpad-btn" id="s${pNum}u">⬆️</button><div></div>
          <button class="dpad-btn" id="s${pNum}l">⬅️</button>
          <div class="dpad-center dpad-btn" style="font-size:.9rem">${pNum===1?'💙':'💗'}</div>
          <button class="dpad-btn" id="s${pNum}r">➡️</button>
          <div></div><button class="dpad-btn" id="s${pNum}d">⬇️</button><div></div>
        </div>
      </div>`;
  }

  const dpadP1 = buildDpad(1,'#4a90d9','#2a6a9a','Pietro 💙');
  const dpadP2 = buildDpad(2,'#e8536f','#b02a50','Emilly 💗');

  body.innerHTML = `
    ${mode==='split' ? `<div class="split-top">${dpadP2}</div>` : ''}
    <div class="game-score-bar">
      <div class="game-score-box"><div class="game-score-label">Pietro 💙</div><div class="game-score-num" id="sc1" style="color:#4a90d9">0</div></div>
      <div class="game-score-box"><div class="game-score-label">Emilly 💗</div><div class="game-score-num" id="sc2" style="color:#e8536f">0</div></div>
    </div>
    <canvas id="snake-canvas" width="${W}" height="${H}"
      style="width:100%;max-width:320px;border-radius:10px;display:block;touch-action:none;border:2px solid rgba(255,255,255,.1)"></canvas>
    ${mode==='split'
      ? `<div class="split-bot">${dpadP1}</div>`
      : `<div style="display:flex;gap:6px;width:100%">${dpadP1}${dpadP2}</div>`}`;

  function bindDpad(pNum, setFn) {
    [['s'+pNum+'u',()=>setFn(0,-1)],['s'+pNum+'d',()=>setFn(0,1)],
     ['s'+pNum+'l',()=>setFn(-1,0)],['s'+pNum+'r',()=>setFn(1,0)]].forEach(([id,fn])=>{
      const el=document.getElementById(id);
      if(el)el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture(e.pointerId);fn();},{passive:false});
    });
  }
  bindDpad(1, setD1); bindDpad(2, setD2);

  const onKeySnake = e => {
    if(e.key==='w'||e.key==='W')setD1(0,-1); if(e.key==='s'||e.key==='S')setD1(0,1);
    if(e.key==='a'||e.key==='A')setD1(-1,0); if(e.key==='d'||e.key==='D')setD1(1,0);
    if(e.key==='ArrowUp')setD2(0,-1); if(e.key==='ArrowDown')setD2(0,1);
    if(e.key==='ArrowLeft')setD2(-1,0); if(e.key==='ArrowRight')setD2(1,0);
    e.preventDefault();
  };
  window.addEventListener('keydown', onKeySnake);

  /* canvas e ctx3 declarados aqui para ficarem disponíveis tanto no path guest quanto host */
  const canvas=document.getElementById('snake-canvas'), ctx3=canvas.getContext('2d');

  /* Online guest: just send input + render received state */
  if (isOnline && !isHost) {
    _listenRoom(ctx.code, data => {
      if (!data.data || !data.data.s1) return;
      const d=data.data; s1=d.s1; s2=d.s2; food=d.food; sc1=d.sc1; sc2=d.sc2;
      const e1=document.getElementById('sc1'),e2=document.getElementById('sc2');
      if(e1)e1.textContent=sc1; if(e2)e2.textContent=sc2;
      _drawSnake();
      if(d.dead){
        const w=d.dead==='both'?'Empate 💥':d.dead==='p1'?'Emilly venceu 💗':'Pietro venceu 💙';
        _showResult(body,'🐍',w,`Pietro ${sc1} × ${sc2} Emilly`,()=>openSnake(mode,ctx));
      }
    });
    _syncInterval = setInterval(()=>{ _writeRoom({p2input:{x:nd2.x,y:nd2.y}}); },120);
    _activeCleanup=()=>{ clearInterval(_syncInterval);_syncInterval=null;if(_roomUnsub){_roomUnsub();_roomUnsub=null;}window.removeEventListener('keydown',onKeySnake); };
    return;
  }

  if (isOnline && isHost) {
    _listenRoom(ctx.code, data => { if(data.p2input&&(data.p2input.x||data.p2input.y)) setD2(data.p2input.x,data.p2input.y); });
    _syncInterval = setInterval(()=>{
      _writeRoom({data:{s1,s2,food,sc1,sc2,dead:running?null:_snakeDead}});
    },150);
  }

  function _drawSnake(){
    ctx3.fillStyle='#0f0f1a'; ctx3.fillRect(0,0,W,H);
    ctx3.strokeStyle='rgba(255,255,255,.03)';
    for(let i=0;i<COLS;i++){ctx3.beginPath();ctx3.moveTo(i*CELL,0);ctx3.lineTo(i*CELL,H);ctx3.stroke();}
    for(let i=0;i<ROWS;i++){ctx3.beginPath();ctx3.moveTo(0,i*CELL);ctx3.lineTo(W,i*CELL);ctx3.stroke();}
    if(food){ctx3.font=`${CELL}px serif`;ctx3.fillText('💕',food.x*CELL,food.y*CELL+CELL-1);}
    if(s1)s1.forEach((s,i)=>{ctx3.fillStyle=i===0?'#4a90d9':`hsl(210,70%,${55-i/s1.length*15}%)`;ctx3.beginPath();ctx3.roundRect(s.x*CELL+1,s.y*CELL+1,CELL-2,CELL-2,3);ctx3.fill();});
    if(s2)s2.forEach((s,i)=>{ctx3.fillStyle=i===0?'#e8536f':`hsl(340,70%,${55-i/s2.length*15}%)`;ctx3.beginPath();ctx3.roundRect(s.x*CELL+1,s.y*CELL+1,CELL-2,CELL-2,3);ctx3.fill();});
  }

  let lastT=0;
  function loop2(ts){
    if(!running)return;
    if(ts-lastT>135){
      lastT=ts;
      d1={...nd1};d2={...nd2};
      const h1={x:(s1[0].x+d1.x+COLS)%COLS,y:(s1[0].y+d1.y+ROWS)%ROWS};
      const h2={x:(s2[0].x+d2.x+COLS)%COLS,y:(s2[0].y+d2.y+ROWS)%ROWS};
      const dead1=s1.slice(1).some(s=>s.x===h1.x&&s.y===h1.y)||s2.some(s=>s.x===h1.x&&s.y===h1.y);
      const dead2=s2.slice(1).some(s=>s.x===h2.x&&s.y===h2.y)||s1.some(s=>s.x===h2.x&&s.y===h2.y);
      if(dead1||dead2){
        running=false;
        _snakeDead = dead1&&dead2?'both':dead1?'p1':'p2';
        const w=dead1&&dead2?'Empate 💥':dead1?'Emilly venceu 💗':'Pietro venceu 💙';
        _showResult(body,'🐍',w,`Pietro ${sc1} × ${sc2} Emilly`,()=>openSnake(mode,ctx)); return;
      }
      s1.unshift(h1); s2.unshift(h2);
      let ate=false;
      if(h1.x===food.x&&h1.y===food.y){sc1++;ate=true;const el=document.getElementById('sc1');if(el)el.textContent=sc1;}else s1.pop();
      if(h2.x===food.x&&h2.y===food.y){sc2++;ate=true;const el=document.getElementById('sc2');if(el)el.textContent=sc2;}else s2.pop();
      if(ate)placeFood();
    }
    _drawSnake(ctx3);
    animId2=requestAnimationFrame(loop2);
  }
  reset(); animId2=requestAnimationFrame(loop2);
  _activeCleanup=()=>{
    running=false; cancelAnimationFrame(animId2);
    if(_syncInterval){clearInterval(_syncInterval);_syncInterval=null;}
    if(_roomUnsub){_roomUnsub();_roomUnsub=null;}
    window.removeEventListener('keydown',onKeySnake);
  };
}

/* ══════════════════════════════════════════
   🎯 TIRO AO ALVO
══════════════════════════════════════════ */
function openAlvo(mode = 'split', ctx = null) {
  const body     = _createOverlay('🎯 Tiro ao Alvo');
  const isOnline = mode === 'online';
  const isHost   = ctx?.role === 'host';
  const DUR=30; let timeLeft=DUR, animId3, running3, targets=[], s1=0, s2=0;
  const ET=['💕','🌹','💙','🌸','✨','💫','🎵','🥰'];

  body.innerHTML = `
    <div class="game-score-bar">
      <div class="game-score-box"><div class="game-score-label">Pietro 💙</div><div class="game-score-num" id="alvo-s1" style="color:#4a90d9">0</div></div>
      <div class="game-score-box"><div class="game-score-label">Tempo</div><div class="game-score-num game-timer" id="alvo-timer">${DUR}</div></div>
      <div class="game-score-box"><div class="game-score-label">Emilly 💗</div><div class="game-score-num" id="alvo-s2" style="color:#e8536f">0</div></div>
    </div>
    <div style="position:relative;width:100%;max-width:480px">
      <canvas id="target-canvas" width="480" height="260"
        style="width:100%;border-radius:12px;display:block;cursor:crosshair;touch-action:none;border:2px solid rgba(255,255,255,.1)"></canvas>
      <div style="position:absolute;top:4px;left:6px;font-size:.6rem;color:rgba(74,144,217,.9)">💙 Pietro</div>
      <div style="position:absolute;top:4px;right:6px;font-size:.6rem;color:rgba(232,83,111,.9)">Emilly 💗</div>
    </div>
    <div style="font-size:.6rem;color:rgba(255,255,255,.35);text-align:center">
      💙 metade esquerda · Emilly 💗 metade direita
    </div>`;

  const canvas=document.getElementById('target-canvas'), ctx3=canvas.getContext('2d');
  const getRect=()=>canvas.getBoundingClientRect();

  function spawn(){
    const r=22+Math.random()*18;
    targets.push({id:Date.now()+Math.random(),x:r+Math.random()*(canvas.width-r*2),
      y:r+Math.random()*(canvas.height-r*2),r,life:1.8+Math.random(),
      born:Date.now(),emoji:ET[Math.floor(Math.random()*ET.length)],
      pts:Math.round(30/r*10)});
  }

  function hit(cx,cy,player){
    for(let i=targets.length-1;i>=0;i--){
      const t=targets[i];
      if(Math.hypot(cx-t.x,cy-t.y)<=t.r){
        targets.splice(i,1);
        if(player===1){s1+=t.pts;const el=document.getElementById('alvo-s1');if(el)el.textContent=s1;}
        else{s2+=t.pts;const el=document.getElementById('alvo-s2');if(el)el.textContent=s2;}
        const fx=document.createElement('div');fx.className='target-hit-fx';fx.textContent=`+${t.pts}`;
        const br=getRect();fx.style.left=(br.left+t.x*br.width/canvas.width)+'px';
        fx.style.top=(br.top+t.y*br.height/canvas.height)+'px';
        document.body.appendChild(fx);setTimeout(()=>fx.remove(),700);
        /* online: sync hit */
        if(isOnline) _writeRoom({data:{s1,s2,timeLeft,targets:targets.map(t=>({...t,born:t.born}))}});
        return;
      }
    }
  }

  function getPlayer(clientX){return(clientX-getRect().left)<getRect().width/2?1:2;}
  const onClick=e=>{if(!running3)return;const br=getRect();hit((e.clientX-br.left)*canvas.width/br.width,(e.clientY-br.top)*canvas.height/br.height,getPlayer(e.clientX));};
  const onTouch=e=>{e.preventDefault();const br=getRect();Array.from(e.changedTouches).forEach(t=>{hit((t.clientX-br.left)*canvas.width/br.width,(t.clientY-br.top)*canvas.height/br.height,getPlayer(t.clientX));});};
  canvas.addEventListener('click',onClick);
  canvas.addEventListener('touchend',onTouch,{passive:false});

  /* online guest: render received state */
  if(isOnline&&!isHost){
    _listenRoom(ctx.code, data=>{
      if(!data.data) return;
      const d=data.data; s1=d.s1||0; s2=d.s2||0; timeLeft=d.timeLeft||0;
      if(d.targets) targets=d.targets;
      const e1=document.getElementById('alvo-s1'),e2=document.getElementById('alvo-s2'),et=document.getElementById('alvo-timer');
      if(e1)e1.textContent=s1; if(e2)e2.textContent=s2;
      if(et){et.textContent=timeLeft;et.classList.toggle('urgent',timeLeft<=10);}
      if(d.done){_showResult(body,s1===s2?'🤝':s1>s2?'💙':'💗',s1===s2?'Empate!':s1>s2?'Pietro venceu!':'Emilly venceu!',`Pietro ${s1} × ${s2} Emilly`,()=>openAlvo(mode,ctx));running3=false;}
    });
    _activeCleanup=()=>{running3=false;cancelAnimationFrame(animId3);if(_roomUnsub){_roomUnsub();_roomUnsub=null;}canvas.removeEventListener('click',onClick);canvas.removeEventListener('touchend',onTouch);};
    running3=true; animId3=requestAnimationFrame(drawOnly);
    function drawOnly(){if(!running3)return;drawTargets();animId3=requestAnimationFrame(drawOnly);}
    return;
  }

  let lastSpawn=0,lastSec=Date.now();
  function drawTargets(){
    const now=Date.now();
    ctx3.fillStyle='#0f0f1a';ctx3.fillRect(0,0,canvas.width,canvas.height);
    ctx3.fillStyle='rgba(74,144,217,.04)';ctx3.fillRect(0,0,canvas.width/2,canvas.height);
    ctx3.fillStyle='rgba(232,83,111,.04)';ctx3.fillRect(canvas.width/2,0,canvas.width/2,canvas.height);
    ctx3.strokeStyle='rgba(255,255,255,.08)';ctx3.lineWidth=1;ctx3.beginPath();ctx3.moveTo(canvas.width/2,0);ctx3.lineTo(canvas.width/2,canvas.height);ctx3.stroke();
    targets.forEach(t=>{
      const age=(now-t.born)/1000,fade=age>t.life*.7?1-(age-t.life*.7)/(t.life*.3):1;
      ctx3.globalAlpha=fade;ctx3.strokeStyle='#e8536f';ctx3.lineWidth=3;
      ctx3.beginPath();ctx3.arc(t.x,t.y,t.r,0,Math.PI*2);ctx3.stroke();
      ctx3.fillStyle=`rgba(232,83,111,${.15*fade})`;ctx3.fill();
      ctx3.font=`${t.r*.9}px serif`;ctx3.textAlign='center';ctx3.textBaseline='middle';
      ctx3.fillText(t.emoji,t.x,t.y);ctx3.textAlign='left';ctx3.textBaseline='alphabetic';
    });ctx3.globalAlpha=1;
  }

  function loop3(ts){
    if(!running3)return;
    const now=Date.now();
    if(now-lastSec>=1000){
      timeLeft--;lastSec=now;
      const tm=document.getElementById('alvo-timer');
      if(tm){tm.textContent=timeLeft;tm.classList.toggle('urgent',timeLeft<=10);}
      if(timeLeft<=0){
        running3=false;
        const emoji=s1===s2?'🤝':s1>s2?'💙':'💗',w=s1===s2?'Empate!':s1>s2?'Pietro venceu!':'Emilly venceu!';
        if(isOnline)_writeRoom({data:{s1,s2,timeLeft:0,done:true,targets:[]}});
        _showResult(body,emoji,w,`Pietro ${s1} × ${s2} Emilly`,()=>openAlvo(mode,ctx)); return;
      }
      if(isOnline)_writeRoom({data:{s1,s2,timeLeft,targets:targets.map(t=>({...t}))}});
    }
    if(now-lastSpawn>750&&targets.length<7){spawn();lastSpawn=now;}
    targets=targets.filter(t=>(now-t.born)/1000<t.life);
    drawTargets();
    animId3=requestAnimationFrame(loop3);
  }
  running3=true; for(let i=0;i<3;i++)spawn(); animId3=requestAnimationFrame(loop3);
  _activeCleanup=()=>{running3=false;cancelAnimationFrame(animId3);canvas.removeEventListener('click',onClick);canvas.removeEventListener('touchend',onTouch);document.querySelectorAll('.target-hit-fx').forEach(el=>el.remove());};
}

/* ══════════════════════════════════════════
   🏃 CORRIDA DE CORAÇÕES
══════════════════════════════════════════ */
function openCorrida(mode = 'split', ctx = null) {
  const body     = _createOverlay('🏃 Corrida de Corações');
  const CW=340, CH=155, GND=CH-28, PW=22, PH=34;
  const isOnline = mode==='online', isHost = ctx?.role==='host';
  let animId4=null;
  const k1={left:false,right:false,jump:false};
  const k2={left:false,right:false,jump:false};
  let w1=0, w2=0, round=1;

  function makeP(x,color,dir,goalX){return{x,y:GND-PH,vx:0,vy:0,onGround:true,color,dir,goalX,won:false,anim:0};}
  let p1=makeP(28,'#4a90d9',1,CW-36), p2=makeP(CW-50,'#e8536f',-1,38);
  let raceOver=false, raceMsg='', raceTimer=0;

  const dpadP1 = _mkDpad('1','#4a90d9','#2a6a9a','Pietro 💙',{up:'jump',left:'left',right:'right'});
  const dpadP2 = _mkDpad('2','#e8536f','#b02a50','Emilly 💗',{up:'jump',left:'left',right:'right'});

  body.innerHTML = `
    ${mode==='split' ? `<div class="split-top">${dpadP2}</div>` : ''}
    <div style="display:flex;justify-content:space-between;align-items:center;
      padding:3px 8px;background:rgba(0,0,0,.4);border-radius:8px;width:100%;box-sizing:border-box">
      <div style="text-align:center;flex:1">
        <div style="font-size:.65rem;color:#4a90d9;font-weight:700">Pietro 💙</div>
        <div id="cr-w1" style="font-size:.7rem;color:#4a90d9">🏆 0</div>
      </div>
      <div style="font-size:.65rem;color:rgba(255,255,255,.5);font-weight:700" id="cr-round">Round ${round}</div>
      <div style="text-align:center;flex:1">
        <div style="font-size:.65rem;color:#e8536f;font-weight:700">Emilly 💗</div>
        <div id="cr-w2" style="font-size:.7rem;color:#e8536f">🏆 0</div>
      </div>
    </div>
    <canvas id="cr-canvas" width="${CW}" height="${CH}"
      style="width:100%;max-width:380px;display:block;margin:0 auto;border-radius:8px;touch-action:none"></canvas>
    ${mode==='split'
      ? `<div class="split-bot">${dpadP1}</div>`
      : `<div style="display:flex;gap:6px;width:100%">${dpadP1}${dpadP2}</div>`}
    <style>${TOUCH_BTN_STYLE}</style>`;

  const kMap={'1':k1,'2':k2};
  body.querySelectorAll('.tkd-btn[data-p][data-a]').forEach(btn=>{
    const k=kMap[btn.dataset.p],a=btn.dataset.a;
    btn.addEventListener('pointerdown',e=>{e.preventDefault();btn.setPointerCapture(e.pointerId);k[a]=true;},{passive:false});
    btn.addEventListener('pointerup',()=>k[a]=false);
    btn.addEventListener('pointercancel',()=>k[a]=false);
    btn.addEventListener('pointerleave',()=>k[a]=false);
  });
  const onKey4=e=>{const d=e.type==='keydown';
    if(e.key==='a'||e.key==='A')k1.left=d;if(e.key==='d'||e.key==='D')k1.right=d;if(e.key==='w'||e.key==='W')k1.jump=d;
    if(e.key==='ArrowLeft')k2.left=d;if(e.key==='ArrowRight')k2.right=d;if(e.key==='ArrowUp')k2.jump=d;
  };
  window.addEventListener('keydown',onKey4); window.addEventListener('keyup',onKey4);

  if(isOnline&&!isHost){
    const canvas=document.getElementById('cr-canvas'),ctx4=canvas.getContext('2d');
    _listenRoom(ctx.code,data=>{
      if(!data.data||!data.data.p1)return;
      const d=data.data; p1={...p1,...d.p1};p2={...p2,...d.p2};
      w1=d.w1||0;w2=d.w2||0;raceOver=d.raceOver;raceMsg=d.raceMsg||'';
      document.getElementById('cr-w1').textContent='🏆 '+w1;
      document.getElementById('cr-w2').textContent='🏆 '+w2;
      _drawCorrida(ctx4,canvas,CW,CH,GND,PW,PH);
      if(d.done)_showResult(body,'🏃',`${w1>=3?'Pietro 💙':'Emilly 💗'} venceu!`,`Pietro ${w1} × ${w2} Emilly`,()=>openCorrida(mode,ctx));
    });
    _syncInterval=setInterval(()=>_writeRoom({p2input:{...k2}}),120);
    _activeCleanup=()=>{cancelAnimationFrame(animId4);clearInterval(_syncInterval);_syncInterval=null;if(_roomUnsub){_roomUnsub();_roomUnsub=null;}window.removeEventListener('keydown',onKey4);window.removeEventListener('keyup',onKey4);};
    return;
  }

  if(isOnline&&isHost){
    _listenRoom(ctx.code,data=>{if(data.p2input)Object.assign(k2,data.p2input);});
    _syncInterval=setInterval(()=>{
      _writeRoom({data:{p1:{x:p1.x,y:p1.y,vx:p1.vx,vy:p1.vy,onGround:p1.onGround,dir:p1.dir,anim:p1.anim,won:p1.won},
        p2:{x:p2.x,y:p2.y,vx:p2.vx,vy:p2.vy,onGround:p2.onGround,dir:p2.dir,anim:p2.anim,won:p2.won},
        w1,w2,raceOver,raceMsg,done:(w1>=3||w2>=3)}});
    },150);
  }

  const canvas=document.getElementById('cr-canvas'),ctx4=canvas.getContext('2d');

  function _drawCorrida(c,cv,CW,CH,GND,PW,PH){
    const bg=c.createLinearGradient(0,0,0,CH);bg.addColorStop(0,'#0a1520');bg.addColorStop(1,'#1a2a3a');
    c.fillStyle=bg;c.fillRect(0,0,CW,CH);
    c.fillStyle='#1a3a5c';c.fillRect(0,GND,CW,CH-GND);
    c.fillStyle='#4a90d9';c.fillRect(0,GND,CW,2);
    c.font='16px serif';c.textAlign='center';c.textBaseline='middle';
    c.fillText('💗',CW-36,GND-14);c.fillText('💙',38,GND-14);
    c.textAlign='left';c.textBaseline='alphabetic';
    // p1
    c.fillStyle=p1.color;c.fillRect(p1.x+4,p1.y+11,14,18);
    c.fillStyle='#ffd6b0';c.beginPath();c.arc(p1.x+PW/2,p1.y+7,6,0,Math.PI*2);c.fill();
    // p2
    c.fillStyle=p2.color;c.fillRect(p2.x+4,p2.y+11,14,18);
    c.fillStyle='#ffd6b0';c.beginPath();c.arc(p2.x+PW/2,p2.y+7,6,0,Math.PI*2);c.fill();
    if(raceOver&&raceMsg){c.fillStyle='rgba(0,0,0,.65)';c.fillRect(CW/2-70,CH/2-14,140,28);
      c.fillStyle='white';c.font='bold 12px "DM Sans",sans-serif';c.textAlign='center';c.fillText(raceMsg,CW/2,CH/2+4);c.textAlign='left';}
  }

  function moveRunner(r,k){
    if(raceOver||r.won)return;
    if(k.left){r.vx=-3.2;r.dir=-1;}else if(k.right){r.vx=3.2;r.dir=1;}else r.vx*=0.7;
    if(k.jump&&r.onGround){r.vy=-7.5;r.onGround=false;}
    r.vy+=0.38;r.x+=r.vx;r.y+=r.vy;
    if(r.y>=GND-PH){r.y=GND-PH;r.vy=0;r.onGround=true;}
    r.x=Math.max(2,Math.min(CW-PW-2,r.x));
    if(r.dir===1&&r.x+PW>=r.goalX)r.won=true;
    if(r.dir===-1&&r.x<=r.goalX)r.won=true;
  }

  function loop4(){
    moveRunner(p1,k1);moveRunner(p2,k2);
    if(!raceOver&&(p1.won||p2.won)){
      raceOver=true;
      if(p1.won&&!p2.won){w1++;raceMsg='Pietro chegou! 💙';}
      else if(p2.won&&!p1.won){w2++;raceMsg='Emilly chegou! 💗';}
      else raceMsg='Empate! 🤝';
      raceTimer=120;round++;
      document.getElementById('cr-w1').textContent='🏆 '+w1;
      document.getElementById('cr-w2').textContent='🏆 '+w2;
      document.getElementById('cr-round').textContent='Round '+round;
    }
    if(raceOver&&raceTimer>0){raceTimer--;
      if(raceTimer===0){
        if(w1>=3||w2>=3){cancelAnimationFrame(animId4);animId4=null;
          _showResult(body,'🏃',`${w1>=3?'Pietro 💙':'Emilly 💗'} venceu a corrida!`,`Pietro ${w1} × ${w2} Emilly`,()=>openCorrida(mode,ctx));return;}
        const _w1=w1,_w2=w2;
        p1=makeP(28,'#4a90d9',1,CW-36);p1.won=false;
        p2=makeP(CW-50,'#e8536f',-1,38);p2.won=false;
        w1=_w1;w2=_w2;raceOver=false;raceMsg='';
      }
    }
    _drawCorrida(ctx4,canvas,CW,CH,GND,PW,PH);
    animId4=requestAnimationFrame(loop4);
  }
  animId4=requestAnimationFrame(loop4);
  _activeCleanup=()=>{cancelAnimationFrame(animId4);animId4=null;if(_syncInterval){clearInterval(_syncInterval);_syncInterval=null;}if(_roomUnsub){_roomUnsub();_roomUnsub=null;}window.removeEventListener('keydown',onKey4);window.removeEventListener('keyup',onKey4);Object.keys(k1).forEach(k=>k1[k]=false);Object.keys(k2).forEach(k=>k2[k]=false);};
}

/* ══════════════════════════════════════════
   ❌ JOGO DA VELHA
   BUG FIX: turn agora alterna a cada jogada
══════════════════════════════════════════ */
function openVelha(mode = 'split', ctx = null) {
  const body     = _createOverlay('❌ Jogo da Velha');
  const isOnline = mode === 'online';
  const isHost   = ctx?.role === 'host';
  const WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

  let board, turn, s1, s2;

  function init(data) {
    board = data.board ? [...data.board] : Array(9).fill(null);
    turn  = data.turn ?? 0;
    s1    = data.s1   ?? 0;
    s2    = data.s2   ?? 0;
  }

  function checkWin(sym){ return WINS.find(w => w.every(i => board[i]===sym)) || null; }

  function render(wl=null, isDraw=false) {
    const myTurn = !isOnline || (isHost && turn===0) || (!isHost && turn===1);
    const pc=turn===0?'#4a90d9':'#e8536f', pn=turn===0?'💙 Pietro':'💗 Emilly';
    body.innerHTML = `
      <div class="game-score-bar">
        <div class="game-score-box" style="border:1px solid ${turn===0?'#4a90d9':'transparent'}">
          <div class="game-score-label">Pietro ❌</div><div class="game-score-num" style="color:#4a90d9">${s1}</div>
        </div>
        <div class="game-score-box">
          <div class="game-score-label">Vitórias</div><div class="game-score-num" style="font-size:.8rem">🎯</div>
        </div>
        <div class="game-score-box" style="border:1px solid ${turn===1?'#e8536f':'transparent'}">
          <div class="game-score-label">Emilly ⭕</div><div class="game-score-num" style="color:#e8536f">${s2}</div>
        </div>
      </div>
      ${!wl&&!isDraw ? `<div style="text-align:center;font-size:.75rem;color:${pc};font-weight:700;margin:.3rem 0">
        ${myTurn ? `Vez de ${pn}` : `Aguardando ${pn}…`}
      </div>` : ''}
      <div id="velha-board" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:240px;margin:0 auto"></div>
      ${wl||isDraw ? `
        <div style="text-align:center;margin:.8rem 0">
          <div style="font-size:1.1rem;color:white;font-weight:700;margin-bottom:.5rem">
            ${isDraw ? 'Empate! 🤝' : pn+' venceu!'}
          </div>
          <button class="game-restart-btn" id="velha-next">Próximo round ▶</button>
        </div>` : ''}`;

    const grid = document.getElementById('velha-board');
    board.forEach((cell, i) => {
      const btn = document.createElement('button');
      btn.style.cssText = `width:72px;height:72px;border-radius:16px;border:2px solid rgba(255,255,255,.15);background:${cell?'rgba(255,255,255,.1)':'rgba(255,255,255,.07)'};font-size:2rem;cursor:${cell||wl||isDraw||!myTurn?'default':'pointer'};color:${cell==='X'?'#4a90d9':'#e8536f'};transition:background .15s;`;
      if(wl&&wl.includes(i)) btn.style.background='rgba(255,255,255,.25)';
      btn.textContent = cell || '';
      if(!cell&&!wl&&!isDraw&&myTurn) btn.addEventListener('click',()=>play(i));
      grid.appendChild(btn);
    });

    document.getElementById('velha-next')?.addEventListener('click', async () => {
      board = Array(9).fill(null);
      turn  = turn===0?1:0;
      if (isOnline) await _writeRoom({ data: {board, turn, s1, s2, wl: null, isDraw: false} });
      else render();
    });
  }

  async function play(i) {
    if(board[i]) return;
    board[i] = turn===0?'X':'O';
    const wl     = checkWin(board[i]);
    const isDraw = !wl && board.every(c=>c!==null);
    if(wl) { if(turn===0)s1++; else s2++; }
    else if(!isDraw) turn = turn===0?1:0; /* BUG FIX: alterna o turno a cada jogada */

    if (isOnline) {
      await _writeRoom({ data: {board, turn, s1, s2, wl: wl||null, isDraw} });
    } else {
      render(wl||null, isDraw);
    }
  }

  if (isOnline) {
    _listenRoom(ctx.code, data => {
      if (!data.data || data.data.board === undefined) return;
      init(data.data);
      const wl = data.data.wl ? data.data.wl : null;
      const isDraw = data.data.isDraw || false;
      render(wl, isDraw);
    });
    if (isHost) { const d=_getInitData('velha'); init(d); _writeRoom({data:d}); }
    _activeCleanup = () => { if(_roomUnsub){_roomUnsub();_roomUnsub=null;} };
    return;
  }
  init(_getInitData('velha')); render();
}

/* ══════════════════════════════════════════
   🤔 CARA A CARA
══════════════════════════════════════════ */
const CHARS = [
  {name:'Elsa ❄️',    f:true, princess:true,  magic:true,  blonde:true },
  {name:'Moana 🌊',   f:true, princess:true,  magic:false, blonde:false},
  {name:'Rapunzel 🌸',f:true, princess:true,  magic:true,  blonde:true },
  {name:'Mulan 🗡️',   f:true, princess:false, magic:false, blonde:false},
  {name:'Ariel 🧜',   f:true, princess:true,  magic:false, blonde:false},
  {name:'Simba 🦁',   f:false,princess:false, magic:false, blonde:false},
  {name:'Aladdin 🧞', f:false,princess:false, magic:true,  blonde:false},
  {name:'Hércules 💪',f:false,princess:false, magic:false, blonde:true },
  {name:'Tarzan 🌿',  f:false,princess:false, magic:false, blonde:false},
  {name:'Bella 📚',   f:true, princess:true,  magic:false, blonde:false},
  {name:'Cinderela 👠',f:true,princess:true,  magic:true,  blonde:false},
  {name:'Pocahontas 🌿',f:true,princess:false,magic:false, blonde:false},
];
const CARAQS = [
  {q:'É uma personagem feminina?',       key:'f'},
  {q:'É uma princesa Disney?',           key:'princess'},
  {q:'Tem poderes mágicos?',             key:'magic'},
  {q:'Tem cabelo loiro?',                key:'blonde'},
  {q:'É um animal ou criatura?',         key:null},
  {q:'Vive em região tropical?',         key:null},
  {q:'Tem um par romântico?',            key:null},
  {q:'Aparece em musical?',              key:null},
  {q:'Já foi vilã ou rival?',            key:null},
  {q:'Tem família presente na história?',key:null},
];

function openCaraACara(mode = 'split', ctx = null) {
  const body     = _createOverlay('🤔 Cara a Cara');
  const isOnline = mode === 'online';
  const isHost   = ctx?.role === 'host';

  let state; // {phase, c1Idx, c2Idx, log, turn}

  function sync(updates) {
    Object.assign(state, updates);
    if (isOnline) _writeRoom({ data: { ...state } });
    else render();
  }

  function render() {
    if (!state) return;
    const {phase, c1Idx, c2Idx, log, turn} = state;

    if (phase === 'choose1') { renderChoose(1); return; }
    if (phase === 'choose2') { renderChoose(2); return; }
    if (phase === 'play')    { renderPlay();    return; }
    if (phase === 'guess')   { renderGuess();   return; }
    if (phase === 'done')    { renderDone();    return; }
  }

  function renderDone() {
    const {winner, c1Idx, c2Idx} = state;
    const correct = winner===0 ? CHARS[c2Idx] : CHARS[c1Idx];
    const right = winner === (isHost ? 0 : 1);
    const pn = winner===0 ? 'Pietro acertou! 💙' : 'Emilly acertou! 💗';
    _showResult(body, right?'🎉':'💔', pn, `Era ${correct?.name||'?'}`, ()=>openCaraACara(mode,ctx));
  }

  function renderChoose(pNum) {
    const isMyTurn = !isOnline || (pNum===1&&isHost) || (pNum===2&&!isHost);
    const pn = pNum===1?'💙 Pietro':'💗 Emilly';
    const pc = pNum===1?'#4a90d9':'#e8536f';
    if (!isMyTurn) {
      body.innerHTML=`<div style="text-align:center;padding:2rem;color:rgba(255,255,255,.6)">
        Aguardando ${pn} escolher em segredo 🤫</div>`;
      return;
    }
    body.innerHTML = `
      <div style="text-align:center;padding:.3rem">
        <div style="font-size:.85rem;color:${pc};font-weight:700;margin-bottom:.2rem">${pn}, escolha um personagem em segredo!</div>
        <div style="font-size:.65rem;color:rgba(255,255,255,.4);margin-bottom:.7rem">O outro não pode olhar 👀</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:300px;margin:0 auto">
          ${CHARS.map((c,i)=>`<button class="game-restart-btn" data-ci="${i}" style="padding:.4rem .2rem;font-size:.78rem">${c.name}</button>`).join('')}
        </div>
      </div>`;
    body.querySelectorAll('[data-ci]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.ci);
        if (pNum===1) sync({ c1Idx: idx, phase: 'choose2' });
        else          sync({ c2Idx: idx, phase: 'play' });
      });
    });
  }

  function renderPlay() {
    const {log, turn} = state;
    const myTurn = !isOnline || (turn===0&&isHost) || (turn===1&&!isHost);
    const pn = turn===0?'💙 Pietro':'💗 Emilly';
    const pc = turn===0?'#4a90d9':'#e8536f';
    const opp = turn===0 ? CHARS[state.c2Idx] : CHARS[state.c1Idx];

    body.innerHTML = `
      <div style="text-align:center;font-size:.72rem;color:${pc};font-weight:700;margin-bottom:.3rem">
        ${myTurn ? `Vez de ${pn} perguntar` : `Aguardando ${pn}…`}
      </div>
      <div style="background:rgba(255,255,255,.08);border-radius:10px;padding:6px;margin-bottom:.5rem;max-height:90px;overflow-y:auto;font-size:.68rem">
        ${log?.length ? log.map(l=>`<div style="color:rgba(255,255,255,.7);margin-bottom:2px">${l}</div>`).join('') : '<div style="color:rgba(255,255,255,.3);text-align:center">Nenhuma pergunta ainda</div>'}
      </div>
      ${myTurn ? `
        <div style="display:flex;flex-direction:column;gap:4px">
          ${CARAQS.map((q,i)=>`<button class="quiz-opt" data-qi="${i}" style="font-size:.78rem;padding:.4rem .7rem;text-align:left">${q.q}</button>`).join('')}
        </div>
        <button class="game-restart-btn" id="cara-guess" style="margin-top:.7rem;width:100%;background:linear-gradient(135deg,#e8536f,#590d22)">
          🎯 Tentar adivinhar!
        </button>` : ''}`;

    body.querySelectorAll('[data-qi]').forEach(btn => {
      btn.addEventListener('click', () => {
        const qi  = Number(btn.dataset.qi), q = CARAQS[qi];
        const ans = q.key ? opp[q.key] : (Math.random() > .5);
        const newLog = [...(log||[]), `${pn}: "${q.q}" → ${ans?'✅ Sim':'❌ Não'}`];
        sync({ log: newLog, turn: turn===0?1:0 });
      });
    });
    document.getElementById('cara-guess')?.addEventListener('click', () => sync({ phase: 'guess' }));
  }

  function renderGuess() {
    const {turn} = state;
    const myTurn = !isOnline || (turn===0&&isHost) || (turn===1&&!isHost);
    const pn = turn===0?'💙 Pietro':'💗 Emilly';
    const correct = turn===0 ? CHARS[state.c2Idx] : CHARS[state.c1Idx];
    if (!myTurn) {
      body.innerHTML=`<div style="text-align:center;padding:2rem;color:rgba(255,255,255,.6)">
        ${pn} está tentando adivinhar… 🤔</div>`;
      return;
    }
    body.innerHTML = `
      <div style="text-align:center;font-size:.78rem;color:rgba(255,255,255,.85);font-weight:700;margin-bottom:.5rem">
        ${pn}, qual é o personagem do outro?
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:300px;margin:0 auto">
        ${CHARS.map((c,i)=>`<button class="game-restart-btn" data-ci="${i}" style="padding:.4rem .2rem;font-size:.78rem">${c.name}</button>`).join('')}
      </div>`;
    body.querySelectorAll('[data-ci]').forEach(btn => {
      btn.addEventListener('click', () => {
        const chosen = CHARS[Number(btn.dataset.ci)];
        const right  = chosen.name === correct.name;
        if (isOnline) {
          _writeRoom({ data: { ...state, phase: 'done', winner: right ? turn : (turn===0?1:0) } });
        }
        _showResult(body, right?'🎉':'💔',
          right?(turn===0?'Pietro acertou! 💙':'Emilly acertou! 💗'):'Errou! 😅',
          `Era ${correct.name}`, ()=>openCaraACara(mode,ctx));
      });
    });
  }

  if (isOnline) {
    _listenRoom(ctx.code, data => {
      if (!data.data) return;
      state = { phase:'choose1', c1Idx:-1, c2Idx:-1, log:[], turn:0, ...data.data };
      render();
    });
    if (isHost) {
      state = _getInitData('caraacara');
      _writeRoom({ data: state });
    } else {
      state = { phase:'choose1', c1Idx:-1, c2Idx:-1, log:[], turn:0 };
    }
    _activeCleanup = () => { if(_roomUnsub){_roomUnsub();_roomUnsub=null;} };
    return;
  }
  state = _getInitData('caraacara');
  render();
}

/* ══════════════════════════════════════════
   🎨 ADIVINHE O DESENHO
══════════════════════════════════════════ */
const DESENHO_PALAVRAS = [
  'coração','beijo','abraço','estrela','arco-íris','borboleta',
  'castelo','dragão','sereia','unicórnio','lua','sol',
  'flor','árvore','nuvem','chuva','neve','fogo',
  'gato','cachorro','peixe','pássaro','urso','coelho',
  'pizza','sorvete','bolo','chocolate','café','maçã',
  'bicicleta','carro','barco','avião','foguete','trem',
  'livro','música','cinema','teatro','pintura','dança',
  'praia','montanha','floresta','ilha','rio','cachoeira',
  'anel','coroa','espelho','vela','relógio','mapa',
];

function openDesenho(mode = 'split', ctx = null) {
  const body     = _createOverlay('🎨 Adivinhe o Desenho');
  const isOnline = mode === 'online';
  const isHost   = ctx?.role === 'host';

  /* estado local */
  let state = {};
  /* canvas temporário para tela dividida (desenhista) */
  let _canvas = null, _ctx2d = null, _drawing = false, _lastX = 0, _lastY = 0;
  let _penColor = '#ffffff', _penSize = 6;
  /* fila de strokes a enviar (online) */
  let _strokeBuf = [];
  let _syncTick  = null;

  /* ── helpers de canvas ── */
  function _getCanvasPos(e, canvas) {
    const r = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return [(touch.clientX - r.left) * (canvas.width / r.width),
            (touch.clientY - r.top)  * (canvas.height / r.height)];
  }

  function _bindCanvas(canvas, isDrawer) {
    _canvas = canvas;
    _ctx2d  = canvas.getContext('2d');
    _ctx2d.fillStyle = '#1a1a2e';
    _ctx2d.fillRect(0, 0, canvas.width, canvas.height);
    if (!isDrawer) return;

    function start(e) {
      e.preventDefault();
      _drawing = true;
      [_lastX, _lastY] = _getCanvasPos(e, canvas);
    }
    function move(e) {
      e.preventDefault();
      if (!_drawing) return;
      const [cx, cy] = _getCanvasPos(e, canvas);
      _ctx2d.strokeStyle = _penColor;
      _ctx2d.lineWidth   = _penSize;
      _ctx2d.lineCap     = 'round';
      _ctx2d.lineJoin    = 'round';
      _ctx2d.beginPath();
      _ctx2d.moveTo(_lastX, _lastY);
      _ctx2d.lineTo(cx, cy);
      _ctx2d.stroke();
      if (isOnline) _strokeBuf.push({ x0:_lastX, y0:_lastY, x1:cx, y1:cy, c:_penColor, s:_penSize });
      [_lastX, _lastY] = [cx, cy];
    }
    function end(e) { e.preventDefault(); _drawing = false; }

    canvas.addEventListener('mousedown',  start);
    canvas.addEventListener('mousemove',  move);
    canvas.addEventListener('mouseup',    end);
    canvas.addEventListener('mouseleave', end);
    canvas.addEventListener('touchstart', start, { passive:false });
    canvas.addEventListener('touchmove',  move,  { passive:false });
    canvas.addEventListener('touchend',   end,   { passive:false });
  }

  function _replayStrokes(canvas, strokes) {
    if (!strokes || !strokes.length) return;
    const c = canvas.getContext('2d');
    strokes.forEach(({ x0,y0,x1,y1,c:col,s }) => {
      c.strokeStyle = col; c.lineWidth = s; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(x0,y0); c.lineTo(x1,y1); c.stroke();
    });
  }

  /* ── start online sync (desenhista envia strokes) ── */
  function _startSync() {
    _syncTick = setInterval(async () => {
      if (!_strokeBuf.length || !isOnline) return;
      const toSend = _strokeBuf.splice(0);
      const merged = [...(state.strokes||[]), ...toSend];
      state.strokes = merged;
      await _writeRoom({ data: { ...state, strokes: merged } });
    }, 180);
  }

  /* ── Fase: escolher palavra (apenas desenhista vê) ── */
  function renderChoose() {
    const isDrawer = !isOnline || (isHost && state.turn===0) || (!isHost && state.turn===1);
    const drawerName = state.turn===0 ? 'Pietro 💙' : 'Emilly 💗';
    if (!isDrawer) {
      body.innerHTML = `
        <div class="desenho-wait-box">
          <div style="font-size:2.4rem">✏️</div>
          <div class="desenho-wait-title">${drawerName} está escolhendo a palavra…</div>
          <div class="desenho-wait-sub">Aguarde e prepare-se para adivinhar! 👀</div>
        </div>`;
      return;
    }
    body.innerHTML = `
      <div class="game-score-bar">
        <div class="game-score-box"><div class="game-score-label">Pietro 💙</div><div class="game-score-num" style="color:#4a90d9">${state.s1||0}</div></div>
        <div class="game-score-box"><div class="game-score-label">Round</div><div class="game-score-num" style="font-size:.95rem">${state.round||1}/${state.totalRounds||6}</div></div>
        <div class="game-score-box"><div class="game-score-label">Emilly 💗</div><div class="game-score-num" style="color:#e8536f">${state.s2||0}</div></div>
      </div>
      <div style="text-align:center;color:rgba(255,255,255,.7);font-size:.8rem;margin-bottom:.3rem">
        ${drawerName}, escolha a palavra para desenhar:
      </div>
      <div class="desenho-word-choices">
        ${(state.palavras||[]).map(p => `<button class="desenho-word-btn" data-w="${p}">${p}</button>`).join('')}
      </div>`;
    body.querySelectorAll('[data-w]').forEach(btn => {
      btn.addEventListener('click', async () => {
        state.palavra   = btn.dataset.w;
        state.phase     = 'draw';
        state.strokes   = [];
        state.guess     = '';
        state.guessed   = false;
        if (isOnline) { await _writeRoom({ data: state }); }
        else           { renderDraw(); }
      });
    });
  }

  /* ── Fase: desenhar / adivinhar ── */
  function renderDraw() {
    const isDrawer = !isOnline || (isHost && state.turn===0) || (!isHost && state.turn===1);
    const drawerName = state.turn===0 ? 'Pietro 💙' : 'Emilly 💗';
    const guesserName= state.turn===0 ? 'Emilly 💗' : 'Pietro 💙';

    if (state.guessed) { renderGuessed(); return; }

    body.innerHTML = `
      <div class="game-score-bar">
        <div class="game-score-box"><div class="game-score-label">Pietro 💙</div><div class="game-score-num" style="color:#4a90d9">${state.s1||0}</div></div>
        <div class="game-score-box"><div class="game-score-label">Round</div><div class="game-score-num" style="font-size:.95rem">${state.round||1}/${state.totalRounds||6}</div></div>
        <div class="game-score-box"><div class="game-score-label">Emilly 💗</div><div class="game-score-num" style="color:#e8536f">${state.s2||0}</div></div>
      </div>
      ${isDrawer
        ? `<div class="desenho-palavra-tag">Desenhe: <strong>${state.palavra}</strong></div>`
        : `<div class="desenho-adivinhe-tag">🔍 ${drawerName} está desenhando — Adivinhe!</div>`
      }
      <canvas id="draw-canvas" class="desenho-canvas" width="400" height="300"></canvas>
      ${isDrawer ? `
        <div class="desenho-tools">
          <div class="desenho-colors">
            ${['#ffffff','#ff6b6b','#4a90d9','#6bcb77','#ffd166','#e8536f','#a78bfa','#fb923c'].map(c =>
              `<button class="desenho-color-btn ${c===_penColor?'active':''}" data-c="${c}" style="background:${c}"></button>`
            ).join('')}
          </div>
          <div class="desenho-sizes">
            <button class="desenho-size-btn ${_penSize===3?'active':''}"  data-s="3"  style="width:14px;height:14px">●</button>
            <button class="desenho-size-btn ${_penSize===6?'active':''}"  data-s="6"  style="width:20px;height:20px">●</button>
            <button class="desenho-size-btn ${_penSize===12?'active':''}" data-s="12" style="width:28px;height:28px">●</button>
            <button class="desenho-size-btn" data-s="erase" style="font-size:.9rem">⬛</button>
          </div>
          <button class="desenho-clear-btn" id="draw-clear">🗑️ Limpar</button>
        </div>` : `
        <div class="desenho-guess-area">
          <input id="draw-guess" class="desenho-guess-input" type="text" placeholder="Digite sua resposta…" autocomplete="off" autocorrect="off">
          <button class="desenho-guess-btn" id="draw-guess-btn">Enviar ✓</button>
        </div>
        <div id="draw-guess-feedback" style="min-height:1.2rem;text-align:center;font-size:.8rem;color:rgba(255,255,255,.55)"></div>`
      }`;

    const canvas = document.getElementById('draw-canvas');
    _bindCanvas(canvas, isDrawer);

    /* replay strokes vindos do Firebase */
    if (!isDrawer && state.strokes && state.strokes.length) {
      _replayStrokes(canvas, state.strokes);
    }

    /* ferramentas (apenas desenhista) */
    if (isDrawer) {
      body.querySelectorAll('[data-c]').forEach(b => {
        b.addEventListener('click', () => {
          _penColor = b.dataset.c;
          body.querySelectorAll('[data-c]').forEach(x => x.classList.remove('active'));
          b.classList.add('active');
        });
      });
      body.querySelectorAll('[data-s]').forEach(b => {
        b.addEventListener('click', () => {
          if (b.dataset.s === 'erase') { _penColor = '#1a1a2e'; return; }
          _penSize = Number(b.dataset.s);
          body.querySelectorAll('[data-s]').forEach(x => x.classList.remove('active'));
          b.classList.add('active');
        });
      });
      document.getElementById('draw-clear')?.addEventListener('click', async () => {
        const c2 = canvas.getContext('2d');
        c2.fillStyle = '#1a1a2e'; c2.fillRect(0, 0, canvas.width, canvas.height);
        state.strokes = [];
        if (isOnline) await _writeRoom({ data: { ...state, strokes: [] } });
      });
      if (isOnline) _startSync();
    }

    /* adivinhar (apenas adivinhador) */
    if (!isDrawer) {
      function tryGuess() {
        const val = (document.getElementById('draw-guess')?.value || '').trim().toLowerCase();
        const fb  = document.getElementById('draw-guess-feedback');
        if (!val) return;
        if (val === state.palavra?.toLowerCase()) {
          /* acertou */
          const winner = state.turn===0 ? 1 : 0; /* adivinhador pontua */
          if (winner === 0) state.s1 = (state.s1||0) + 1;
          else              state.s2 = (state.s2||0) + 1;
          state.guessed = true;
          state.lastGuesser = guesserName;
          if (isOnline) _writeRoom({ data: state });
          else renderGuessed();
        } else {
          if (fb) { fb.textContent = `"${val}" não é isso… tente de novo!`; fb.style.color='#ff6b6b'; }
          if (document.getElementById('draw-guess')) document.getElementById('draw-guess').value = '';
        }
      }
      document.getElementById('draw-guess-btn')?.addEventListener('click', tryGuess);
      document.getElementById('draw-guess')?.addEventListener('keydown', e => { if(e.key==='Enter') tryGuess(); });
    }
  }

  /* ── Fase: acertou! ── */
  function renderGuessed() {
    const guesserName = state.lastGuesser || (state.turn===0 ? 'Emilly 💗' : 'Pietro 💙');
    const isLast      = (state.round||1) >= (state.totalRounds||6);
    body.innerHTML = `
      <div class="game-score-bar">
        <div class="game-score-box"><div class="game-score-label">Pietro 💙</div><div class="game-score-num" style="color:#4a90d9">${state.s1||0}</div></div>
        <div class="game-score-box"><div class="game-score-label">Round</div><div class="game-score-num" style="font-size:.95rem">${state.round||1}/${state.totalRounds||6}</div></div>
        <div class="game-score-box"><div class="game-score-label">Emilly 💗</div><div class="game-score-num" style="color:#e8536f">${state.s2||0}</div></div>
      </div>
      <div class="desenho-acertou">
        <div style="font-size:2.4rem">🎉</div>
        <div class="desenho-acertou-title">${guesserName} acertou!</div>
        <div class="desenho-acertou-palavra">A palavra era: <strong>${state.palavra}</strong></div>
        ${!isLast
          ? `<button class="game-restart-btn" id="draw-next">Próximo round ▶</button>`
          : `<button class="game-restart-btn" id="draw-finish">Ver resultado final 🏆</button>`}
      </div>`;

    const isDrawer = !isOnline || (isHost && state.turn===0) || (!isHost && state.turn===1);
    if (!isDrawer && !isLast) return; /* só o desenhista avança */

    document.getElementById('draw-next')?.addEventListener('click', async () => {
      const nextRound   = (state.round||1) + 1;
      const nextTurn    = state.turn===0 ? 1 : 0;
      const newPalavras = DESENHO_PALAVRAS.sort(() => Math.random() - .5).slice(0, 6);
      const nextState   = { ...state, phase:'choose', palavra:'', round:nextRound, turn:nextTurn, strokes:[], guess:'', guessed:false, palavras:newPalavras };
      state = nextState;
      if (isOnline) await _writeRoom({ data: state });
      else renderChoose();
    });
    document.getElementById('draw-finish')?.addEventListener('click', () => {
      const s1=state.s1||0, s2=state.s2||0;
      const emoji = s1===s2?'🤝':s1>s2?'💙':'💗';
      const winner= s1===s2?'Empate!':s1>s2?'Pietro venceu!':'Emilly venceu!';
      _showResult(body, emoji, winner, `Pietro ${s1} × ${s2} Emilly`, ()=>openDesenho(mode,ctx));
    });
  }

  /* ── render principal ── */
  function render() {
    if (_syncTick) { clearInterval(_syncTick); _syncTick = null; }
    if      (state.phase === 'choose')   renderChoose();
    else if (state.phase === 'draw')     renderDraw();
    else if (state.phase === 'guessed')  renderGuessed();
  }

  /* ── modo tela dividida ── */
  if (mode === 'split') {
    state = _getInitData('desenho');
    render();
    return;
  }

  /* ── modo online ── */
  _listenRoom(ctx.code, data => {
    if (!data.data || data.data.phase === undefined) return;
    const prevStrokes = state.strokes?.length || 0;
    const isDrawer    = (isHost && state.turn===0) || (!isHost && state.turn===1);
    state = { ...data.data };
    /* se desenhista: não sobrescreve canvas local com dados remotos (evita flicker) */
    if (state.phase === 'draw' && isDrawer) { /* mantém canvas, só atualiza estado */ }
    else render();
    if (state.phase === 'draw' && !isDrawer) {
      /* atualiza canvas do adivinhador com novos strokes */
      const canvas = document.getElementById('draw-canvas');
      if (canvas) {
        const c2 = canvas.getContext('2d');
        c2.fillStyle = '#1a1a2e'; c2.fillRect(0, 0, canvas.width, canvas.height);
        _replayStrokes(canvas, state.strokes || []);
      }
    }
    if (state.phase !== 'draw') render();
  });
  if (isHost) {
    state = _getInitData('desenho');
    _writeRoom({ data: state });
  } else {
    state = { phase:'choose', palavra:'', turn:0, s1:0, s2:0, round:1, totalRounds:6, strokes:[], guess:'', guessed:false, palavras:[] };
  }
  _activeCleanup = () => {
    if (_syncTick) { clearInterval(_syncTick); _syncTick = null; }
    if (_roomUnsub) { _roomUnsub(); _roomUnsub = null; }
  };
}

/* ══════════════════════════════════════════
   🃏 UNO DO CASAL
══════════════════════════════════════════ */

/* ── baralho ── */
const UNO_COLORS = ['vermelho','azul','verde','amarelo'];
const UNO_VALUES = ['0','1','2','3','4','5','6','7','8','9','bloqueio','inverter','+2'];
const UNO_SPECIALS = [
  { color:'preto', value:'curinga',    label:'🌈' },
  { color:'preto', value:'curinga+4',  label:'+4' },
  { color:'preto', value:'beijo',      label:'💋' }, /* carta especial casal */
  { color:'preto', value:'abraco',     label:'🤗' }, /* carta especial casal */
];
const UNO_COUPLE_EFFECTS = {
  'beijo':  'Mandar um beijo! 💋 (perde a vez)',
  'abraco': 'Mandar um abraço! 🤗 (compra 1 carta)',
};

function _unoBuildDeck() {
  const deck = [];
  let id = 0;
  UNO_COLORS.forEach(color => {
    UNO_VALUES.forEach(value => {
      const copies = value === '0' ? 1 : 2;
      for (let i = 0; i < copies; i++) deck.push({ id: id++, color, value });
    });
  });
  /* curingas: 4 de cada tipo */
  UNO_SPECIALS.forEach(s => {
    const n = s.value === 'beijo' || s.value === 'abraco' ? 2 : 4;
    for (let i = 0; i < n; i++) deck.push({ id: id++, ...s });
  });
  return deck.sort(() => Math.random() - .5);
}

function _unoInitState() {
  const deck = _unoBuildDeck();
  const hand0 = deck.splice(0, 7);
  const hand1 = deck.splice(0, 7);
  /* garante que a carta do topo não seja especial preta */
  let topIdx = deck.findIndex(c => c.color !== 'preto');
  const [top] = deck.splice(topIdx, 1);
  return {
    phase: 'play',
    deck,
    discard: [top],
    hands: [hand0.map(c=>c.id), hand1.map(c=>c.id)],
    allCards: [...hand0, ...hand1, ...deck, top],
    turn: 0,
    dir: 1,
    chosenColor: null,   /* cor escolhida após curinga */
    pendingDraw: 0,      /* acúmulo de +2/+4 */
    lastEffect: '',
    winner: null,
  };
}

function _unoGetCard(state, id) {
  return state.allCards.find(c => c.id === id);
}

function _unoCardColor(c, chosenColor) {
  return c.color === 'preto' ? (chosenColor || 'preto') : c.color;
}

function _unoCanPlay(card, top, chosenColor, pendingDraw) {
  const topColor = _unoCardColor(top, chosenColor);
  if (pendingDraw > 0) {
    /* só pode jogar +2 sobre +2, ou +4 sobre +4/+2 */
    if (top.value === '+2' && card.value === '+2') return true;
    if ((top.value === '+2' || top.value === 'curinga+4') && card.value === 'curinga+4') return true;
    return false;
  }
  if (card.color === 'preto') return true;
  return card.color === topColor || card.value === top.value;
}

function openUno(mode = 'online', ctx = null) {
  /* Uno só tem modo online — tela dividida não faz sentido (mãos secretas) */
  if (mode === 'split') {
    _showGmInfo('🃏', 'Uno — Apenas Online',
      'O Uno precisa de mãos secretas!\nJogue no modo Online com a Emilly. 💙💗');
    return;
  }

  const body     = _createOverlay('🃏 Uno do Casal');
  const isHost   = ctx?.role === 'host';
  const myIdx    = isHost ? 0 : 1;
  const oppIdx   = isHost ? 1 : 0;
  const myName   = isHost ? 'Pietro 💙' : 'Emilly 💗';
  const oppName  = isHost ? 'Emilly 💗' : 'Pietro 💙';

  let state = null;
  let choosingColor = false;

  /* ── helpers visuais ── */
  const COLOR_MAP = {
    vermelho: '#e74c3c', azul: '#3498db',
    verde: '#27ae60',    amarelo: '#f1c40f', preto: '#2c2c3e',
  };
  const COLOR_LABEL = { vermelho:'🔴', azul:'🔵', verde:'🟢', amarelo:'🟡' };

  function _cardBg(card, chosenColor) {
    const col = card.color === 'preto' ? (chosenColor || 'preto') : card.color;
    return COLOR_MAP[col] || '#444';
  }

  function _cardLabel(card) {
    if (card.value === 'bloqueio')   return '🚫';
    if (card.value === 'inverter')   return '🔄';
    if (card.value === '+2')         return '+2';
    if (card.value === 'curinga')    return '🌈';
    if (card.value === 'curinga+4')  return '+4';
    if (card.value === 'beijo')      return '💋';
    if (card.value === 'abraco')     return '🤗';
    return card.value;
  }

  function _cardHTML(card, playable, chosenColor, small=false) {
    const bg = _cardBg(card, chosenColor);
    const lbl = _cardLabel(card);
    const size = small ? 'width:36px;height:52px;font-size:.75rem' : 'width:48px;height:68px;font-size:1rem';
    const cursor = playable ? 'cursor:pointer' : 'cursor:default';
    const opacity = playable ? '1' : '0.45';
    const ring = playable ? `box-shadow:0 0 0 2px white,0 0 12px rgba(255,255,255,.4)` : '';
    return `<div class="uno-card ${playable?'uno-playable':''}" data-id="${card.id}"
      style="background:${bg};${size};opacity:${opacity};${cursor};${ring};
             border-radius:10px;display:inline-flex;align-items:center;justify-content:center;
             color:white;font-weight:900;border:2px solid rgba(255,255,255,.25);
             flex-shrink:0;transition:transform .15s,box-shadow .15s;user-select:none;
             text-shadow:0 1px 3px rgba(0,0,0,.5);">${lbl}</div>`;
  }

  /* ── render principal ── */
  function render() {
    if (!state) return;
    const { hands, discard, turn, chosenColor, pendingDraw, lastEffect, winner, deck } = state;
    const top = _unoGetCard(state, discard[discard.length - 1]);
    const myHand    = (hands[myIdx]  || []).map(id => _unoGetCard(state, id)).filter(Boolean);
    const oppCount  = (hands[oppIdx] || []).length;
    const myTurn    = turn === myIdx;

    if (winner !== null) {
      const won = winner === myIdx;
      _showResult(body, won?'🏆':'💔', won?`${myName} venceu!`:`${oppName} venceu!`,
        `Fim de jogo!`, () => {
          const init = _unoInitState();
          state = init;
          _writeRoom({ data: _unoSerialize(state) });
        });
      return;
    }

    const playable = myTurn ? myHand.filter(c => _unoCanPlay(c, top, chosenColor, pendingDraw)) : [];
    const playableIds = new Set(playable.map(c => c.id));

    body.innerHTML = `
      <div class="game-score-bar" style="margin-bottom:.4rem">
        <div class="game-score-box" style="border:1px solid ${!myTurn?'rgba(255,255,255,.35)':'transparent'}">
          <div class="game-score-label">${oppName}</div>
          <div class="game-score-num" style="font-size:1rem">${oppCount} cartas</div>
        </div>
        <div class="game-score-box">
          <div class="game-score-label">Baralho</div>
          <div class="game-score-num" style="font-size:.9rem">${deck.length}</div>
        </div>
        <div class="game-score-box" style="border:1px solid ${myTurn?'rgba(255,255,255,.35)':'transparent'}">
          <div class="game-score-label">${myName}</div>
          <div class="game-score-num" style="font-size:1rem">${myHand.length} cartas</div>
        </div>
      </div>

      ${lastEffect ? `<div class="uno-effect-tag">${lastEffect}</div>` : ''}

      <div style="display:flex;align-items:center;gap:1rem;justify-content:center;margin:.4rem 0">
        <!-- Baralho (comprar) -->
        <div id="uno-draw" style="width:48px;height:68px;border-radius:10px;
          background:linear-gradient(135deg,#590d22,#800020);border:2px solid rgba(255,255,255,.3);
          display:flex;align-items:center;justify-content:center;font-size:1.3rem;
          ${myTurn?'cursor:pointer':'cursor:default;opacity:.5'}">🃏</div>
        <!-- Topo da pilha de descarte -->
        ${_cardHTML(top, false, chosenColor)}
        ${chosenColor && top.color==='preto' ? `<div style="font-size:1.4rem">${COLOR_LABEL[chosenColor]}</div>` : ''}
      </div>

      ${pendingDraw > 0 ? `<div class="uno-pending-tag">⚡ Pilha de +${pendingDraw} — jogue um +2/+4 ou compre!</div>` : ''}

      <div style="text-align:center;font-size:.72rem;font-weight:700;
        color:${myTurn?'rgba(255,255,255,.85)':'rgba(255,255,255,.38)'};margin-bottom:.3rem">
        ${myTurn ? '✨ Sua vez!' : `⌛ Vez de ${oppName}…`}
      </div>

      <!-- Mão do jogador -->
      <div id="uno-hand" style="display:flex;flex-wrap:wrap;gap:.35rem;justify-content:center;
        padding:.4rem;max-height:220px;overflow-y:auto;width:100%">
        ${myHand.map(c => _cardHTML(c, myTurn && playableIds.has(c.id), chosenColor)).join('')}
      </div>

      ${myHand.length === 1 && myTurn ? `<div class="uno-uno-badge">🎉 UNO!</div>` : ''}
    `;

    /* eventos de clique nas cartas */
    body.querySelectorAll('.uno-playable').forEach(el => {
      el.addEventListener('click', () => {
        const card = _unoGetCard(state, Number(el.dataset.id));
        if (card) playCard(card);
      });
    });

    /* comprar carta */
    if (myTurn) {
      document.getElementById('uno-draw')?.addEventListener('click', drawCard);
    }
  }

  /* ── serialização (Firebase não aceita objetos profundos facilmente) ── */
  function _unoSerialize(s) {
    return {
      phase:       s.phase,
      deck:        s.deck.map(c=>c.id),
      discard:     s.discard.map(c=>c.id),
      hands:       s.hands,
      allCardIds:  s.allCards.map(c=>c.id),
      allCardData: s.allCards,
      turn:        s.turn,
      dir:         s.dir,
      chosenColor: s.chosenColor,
      pendingDraw: s.pendingDraw,
      lastEffect:  s.lastEffect,
      winner:      s.winner,
    };
  }

  function _unoDeserialize(d) {
    const allCards = d.allCardData || [];
    return {
      phase:       d.phase,
      deck:        (d.deck     || []).map(id => allCards.find(c=>c.id===id)).filter(Boolean),
      discard:     (d.discard  || []).map(id => allCards.find(c=>c.id===id)).filter(Boolean),
      hands:       d.hands || [[],[]],
      allCards,
      turn:        d.turn     ?? 0,
      dir:         d.dir      ?? 1,
      chosenColor: d.chosenColor || null,
      pendingDraw: d.pendingDraw || 0,
      lastEffect:  d.lastEffect || '',
      winner:      d.winner     ?? null,
    };
  }

  /* ── lógica de jogar carta ── */
  function playCard(card) {
    if (state.turn !== myIdx) return;
    const top = _unoGetCard(state, state.discard[state.discard.length-1]);
    if (!_unoCanPlay(card, top, state.chosenColor, state.pendingDraw)) return;

    /* remove da mão */
    state.hands[myIdx] = state.hands[myIdx].filter(id => id !== card.id);
    state.discard.push(card);
    state.deck = state.deck.filter(c => c.id !== card.id);
    state.lastEffect = '';
    state.chosenColor = null;

    /* efeitos */
    let skipOpp = false;

    if (card.value === '+2') {
      state.pendingDraw += 2;
      state.lastEffect = `+2 acumulado! Total: +${state.pendingDraw} 💢`;
      skipOpp = false;
    } else if (card.value === 'curinga+4') {
      state.pendingDraw += 4;
      state.lastEffect = `+4 acumulado! Total: +${state.pendingDraw} 💢`;
      _pickColor(); return;
    } else if (card.value === 'bloqueio') {
      skipOpp = true;
      state.lastEffect = `${oppName} bloqueado! 🚫`;
    } else if (card.value === 'inverter') {
      state.dir *= -1;
      skipOpp = true; /* com 2 jogadores, inverter = pular */
      state.lastEffect = `Sentido invertido! 🔄`;
    } else if (card.value === 'curinga') {
      _pickColor(); return;
    } else if (card.value === 'beijo') {
      skipOpp = true;
      state.lastEffect = `${oppName} manda um beijo! 💋`;
    } else if (card.value === 'abraco') {
      /* adversário compra 1 */
      _giveCards(oppIdx, 1);
      state.lastEffect = `${oppName} ganhou 1 carta e um abraço! 🤗`;
    } else {
      state.pendingDraw = 0;
    }

    /* verificar vitória */
    if (state.hands[myIdx].length === 0) {
      state.winner = myIdx;
      _writeRoom({ data: _unoSerialize(state) });
      render(); return;
    }

    state.turn = skipOpp ? myIdx : oppIdx;
    _writeRoom({ data: _unoSerialize(state) });
    render();
  }

  /* ── comprar carta ── */
  function drawCard() {
    if (state.turn !== myIdx) return;
    const n = state.pendingDraw > 0 ? state.pendingDraw : 1;
    _giveCards(myIdx, n);
    state.pendingDraw = 0;
    state.lastEffect = n > 1 ? `${myName} comprou ${n} cartas! 😬` : '';
    state.turn = oppIdx;
    _writeRoom({ data: _unoSerialize(state) });
    render();
  }

  function _giveCards(playerIdx, n) {
    for (let i = 0; i < n; i++) {
      if (state.deck.length === 0) {
        /* recicla descarte */
        const top = state.discard.pop();
        state.deck = state.discard.sort(() => Math.random()-.5);
        state.discard = [top];
      }
      if (state.deck.length === 0) break;
      const card = state.deck.shift();
      state.hands[playerIdx].push(card.id);
    }
  }

  /* ── escolher cor após curinga ── */
  function _pickColor() {
    choosingColor = true;
    body.innerHTML += `
      <div id="uno-color-picker" style="position:fixed;inset:0;background:rgba(0,0,0,.7);
        z-index:10300;display:flex;align-items:center;justify-content:center">
        <div style="background:#1a1a2e;border-radius:20px;padding:1.4rem;text-align:center;
          border:1px solid rgba(255,255,255,.15);width:min(280px,85vw)">
          <div style="font-size:1.1rem;color:white;font-weight:700;margin-bottom:1rem">Escolha a cor 🎨</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">
            ${UNO_COLORS.map(c => `
              <button data-col="${c}" style="background:${COLOR_MAP[c]};border:none;border-radius:12px;
                padding:.8rem;font-size:1.4rem;cursor:pointer;color:white;font-weight:900;
                transition:transform .15s" onmouseover="this.style.transform='scale(1.07)'"
                onmouseout="this.style.transform=''">
                ${COLOR_LABEL[c]}
              </button>`).join('')}
          </div>
        </div>
      </div>`;

    document.querySelectorAll('[data-col]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.chosenColor = btn.dataset.col;
        state.lastEffect  = `Cor escolhida: ${COLOR_LABEL[state.chosenColor]}`;
        choosingColor     = false;
        state.turn        = oppIdx;
        document.getElementById('uno-color-picker')?.remove();
        _writeRoom({ data: _unoSerialize(state) });
        render();
      });
    });
  }

  /* ── modo online: escutar Firebase ── */
  _listenRoom(ctx.code, data => {
    if (!data.data || data.data.turn === undefined) return;
    state = _unoDeserialize(data.data);
    render();
  });

  if (isHost) {
    state = _unoInitState();
    _writeRoom({ data: _unoSerialize(state) });
  } else {
    /* guest aguarda host inicializar */
    body.innerHTML = `<div class="desenho-wait-box">
      <div style="font-size:2rem">🃏</div>
      <div class="desenho-wait-title">Aguardando Pietro embaralhar…</div>
    </div>`;
  }

  _activeCleanup = () => { if(_roomUnsub){_roomUnsub();_roomUnsub=null;} };
}

/* ══════════════════════════════════════════
   🔥 VERDADE OU DESAFIO
══════════════════════════════════════════ */

const VDD_CARDS = {
  verdade: [
    'Qual foi o primeiro pensamento que teve sobre mim quando nos conhecemos?',
    'Qual é a coisa que mais admira em mim?',
    'Qual foi o momento mais feliz que vivemos juntos?',
    'Se pudesse mudar uma coisa em você mesmo, o que seria?',
    'Qual é o seu maior sonho que ainda não contou pra mim?',
    'Qual é a coisa mais estranha que já fez por amor?',
    'Em que momento percebeu que me amava de verdade?',
    'Qual é o ciúme mais bobo que já sentiu de mim?',
    'Qual música te lembra de nós quando a ouve sozinho?',
    'Qual é o defeito meu que você nunca comentou mas percebeu?',
    'Se nossa relação fosse um filme, qual seria o título?',
    'Qual foi a última vez que chorou pensando em nós?',
    'O que faria se eu fosse embora por um mês sem dar notícias?',
    'Qual é a coisa mais romântica que já quis fazer por mim mas teve vergonha?',
    'O que mais sente saudade em mim quando estamos longe?',
    'Qual é o apelido secreto que criou pra mim na cabeça?',
    'Qual foi o dia em que mais precisou de mim?',
    'Se pudesse reviver um dia nosso, qual escolheria?',
    'Qual é a maior loucura que faria por mim?',
    'O que pensa quando me olha dormindo?',
  ],
  desafio: [
    'Escreva uma mensagem de voz dizendo 3 coisas que ama no outro.',
    'Mande um print do seu papel de parede agora.',
    'Fale por 1 minuto sem parar por que gosta de mim.',
    'Imite minha expressão favorita.',
    'Cante 30 segundos da nossa música favorita.',
    'Mande um selfie com a carinha mais feia que conseguir.',
    'Escreva um haiku (3 linhas: 5-7-5 sílabas) sobre nós.',
    'Descreva nosso primeiro encontro com apenas 3 emojis.',
    'Mande uma foto de onde está agora sem arrumar nada.',
    'Diga "eu te amo" de 5 formas diferentes em 30 segundos.',
    'Invente um apelido novo pra mim agora.',
    'Faça uma declaração de amor no estilo de novela.',
    'Mande uma mensagem para o grupo da família dizendo que está apaixonado(a).',
    'Escreva um poema de 4 linhas sobre o meu sorriso.',
    'Fique em silêncio absoluto por 1 minuto inteiro.',
    'Mande o último meme que salvou no celular.',
    'Imite como eu falo quando estou com sono.',
    'Descreva o nosso futuro em 3 palavras.',
    'Mande um áudio falando o que mais gosta no físico do outro.',
    'Faça uma pose de modelo e mande a foto.',
  ],
  quente: [
    'Qual é o seu lugar favorito para me abraçar?',
    'Descreva o beijo perfeito pra você.',
    'Qual parte do meu corpo você mais adora?',
    'Qual é a sua lembrança mais íntima favorita nossa?',
    'O que sente quando me seguro pela mão?',
    'Qual é o toque seu que me deixaria sem fôlego?',
    'Qual é o lugar mais inusitado onde gostaria de me beijar?',
    'Descreva com detalhes o abraço perfeito.',
    'O que mais te atrai em mim fisicamente?',
    'Qual sensação que só eu consigo te dar?',
  ],
};

function openVDD(mode = 'split', ctx = null) {
  const body     = _createOverlay('🔥 Verdade ou Desafio');
  const isOnline = mode === 'online';
  const isHost   = ctx?.role === 'host';

  let state = {};

  const CAT_CONFIG = {
    verdade: { label: 'Verdade',  emoji: '💬', color: '#4a90d9', bg: 'rgba(74,144,217,.2)',  border: 'rgba(74,144,217,.4)'  },
    desafio: { label: 'Desafio',  emoji: '🎯', color: '#e8536f', bg: 'rgba(232,83,111,.2)', border: 'rgba(232,83,111,.4)'  },
    quente:  { label: '🔞 Quente', emoji: '🔥', color: '#ff9500', bg: 'rgba(255,149,0,.2)',  border: 'rgba(255,149,0,.4)'   },
  };

  /* ── roleta animada ── */
  function renderSpin() {
    const myTurn   = !isOnline || (isHost && state.turn===0) || (!isHost && state.turn===1);
    const turnName = state.turn===0 ? 'Pietro 💙' : 'Emilly 💗';

    body.innerHTML = `
      <div class="game-score-bar">
        <div class="game-score-box" style="border:1px solid ${state.turn===0?'#4a90d9':'transparent'}">
          <div class="game-score-label">Pietro 💙</div>
          <div class="game-score-num" style="color:#4a90d9">${state.s1||0}</div>
        </div>
        <div class="game-score-box">
          <div class="game-score-label">Pontos</div>
          <div class="game-score-num" style="font-size:.75rem">✨</div>
        </div>
        <div class="game-score-box" style="border:1px solid ${state.turn===1?'#e8536f':'transparent'}">
          <div class="game-score-label">Emilly 💗</div>
          <div class="game-score-num" style="color:#e8536f">${state.s2||0}</div>
        </div>
      </div>

      <div style="text-align:center;font-size:.78rem;color:rgba(255,255,255,.6);margin:.2rem 0">
        ${myTurn ? `<span style="color:white;font-weight:700">Sua vez!</span> Escolha a categoria:` : `Vez de ${turnName} escolher…`}
      </div>

      <div class="vdd-categories">
        ${Object.entries(CAT_CONFIG).map(([cat, cfg]) => `
          <button class="vdd-cat-btn ${myTurn?'':'vdd-disabled'}" data-cat="${cat}"
            style="border-color:${cfg.border};background:${cfg.bg}">
            <span style="font-size:1.8rem">${cfg.emoji}</span>
            <span style="font-weight:700;color:${cfg.color};font-size:.9rem">${cfg.label}</span>
            <span style="font-size:.7rem;color:rgba(255,255,255,.45)">${VDD_CARDS[cat].length} cartas</span>
          </button>`).join('')}
      </div>

      ${!myTurn ? `<div class="vdd-wait-msg">Aguardando ${turnName} escolher… 👀</div>` : ''}
    `;

    if (myTurn) {
      body.querySelectorAll('[data-cat]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const cat   = btn.dataset.cat;
          const pool  = VDD_CARDS[cat];
          const card  = pool[Math.floor(Math.random() * pool.length)];
          state.card     = { cat, text: card };
          state.phase    = 'card';
          state.answered = false;
          if (isOnline) await _writeRoom({ data: state });
          else render();
        });
      });
    }
  }

  /* ── mostrar carta ── */
  function renderCard() {
    if (!state.card) { renderSpin(); return; }
    const { cat, text } = state.card;
    const cfg      = CAT_CONFIG[cat];
    const myTurn   = !isOnline || (isHost && state.turn===0) || (!isHost && state.turn===1);
    const turnName = state.turn===0 ? 'Pietro 💙' : 'Emilly 💗';

    body.innerHTML = `
      <div class="game-score-bar">
        <div class="game-score-box"><div class="game-score-label">Pietro 💙</div><div class="game-score-num" style="color:#4a90d9">${state.s1||0}</div></div>
        <div class="game-score-box"><div class="game-score-label">Pontos</div><div class="game-score-num" style="font-size:.75rem">✨</div></div>
        <div class="game-score-box"><div class="game-score-label">Emilly 💗</div><div class="game-score-num" style="color:#e8536f">${state.s2||0}</div></div>
      </div>

      <div class="vdd-card-display" style="border-color:${cfg.border};background:${cfg.bg}">
        <div class="vdd-card-cat" style="color:${cfg.color}">${cfg.emoji} ${cfg.label}</div>
        <div class="vdd-card-text">${text}</div>
        <div class="vdd-card-for">Para: <strong style="color:${cfg.color}">${turnName}</strong></div>
      </div>

      ${!state.answered ? `
        <div class="vdd-action-row">
          <button class="vdd-action-btn vdd-btn-done"  id="vdd-done"  >✅ Cumpriu! +1 ponto</button>
          <button class="vdd-action-btn vdd-btn-skip"  id="vdd-skip"  >⏭️ Pulou</button>
        </div>` : `
        <div class="vdd-answered-tag">✅ Respondido!</div>
      `}
    `;

    /* só quem está jogando pode confirmar */
    if (!state.answered) {
      document.getElementById('vdd-done')?.addEventListener('click', async () => {
        if (state.turn===0) state.s1 = (state.s1||0)+1;
        else                state.s2 = (state.s2||0)+1;
        state.answered = true;
        state.phase    = 'answered';
        if (isOnline) await _writeRoom({ data: state });
        else render();
      });
      document.getElementById('vdd-skip')?.addEventListener('click', async () => {
        state.answered = true;
        state.phase    = 'answered';
        if (isOnline) await _writeRoom({ data: state });
        else render();
      });
    }
  }

  /* ── após responder ── */
  function renderAnswered() {
    const myTurn   = !isOnline || (isHost && state.turn===0) || (!isHost && state.turn===1);
    const turnName = state.turn===0 ? 'Pietro 💙' : 'Emilly 💗';
    const cfg      = state.card ? CAT_CONFIG[state.card.cat] : CAT_CONFIG.verdade;

    body.innerHTML = `
      <div class="game-score-bar">
        <div class="game-score-box"><div class="game-score-label">Pietro 💙</div><div class="game-score-num" style="color:#4a90d9">${state.s1||0}</div></div>
        <div class="game-score-box"><div class="game-score-label">Pontos</div><div class="game-score-num" style="font-size:.75rem">✨</div></div>
        <div class="game-score-box"><div class="game-score-label">Emilly 💗</div><div class="game-score-num" style="color:#e8536f">${state.s2||0}</div></div>
      </div>

      <div class="vdd-card-display" style="border-color:${cfg.border};background:${cfg.bg};opacity:.6">
        <div class="vdd-card-cat" style="color:${cfg.color}">${cfg.emoji} ${cfg.label}</div>
        <div class="vdd-card-text" style="font-size:.82rem">${state.card?.text||''}</div>
      </div>

      <div style="text-align:center;font-size:.78rem;color:rgba(255,255,255,.55)">
        ${myTurn ? 'Pressione próximo para passar a vez 👇' : `Aguardando ${turnName} avançar…`}
      </div>

      ${myTurn ? `<button class="game-restart-btn" id="vdd-next" style="margin-top:.5rem">Próxima vez ▶</button>` : ''}
    `;

    document.getElementById('vdd-next')?.addEventListener('click', async () => {
      state.turn  = state.turn===0 ? 1 : 0;
      state.phase = 'spin';
      state.card  = null;
      if (isOnline) await _writeRoom({ data: state });
      else render();
    });
  }

  function render() {
    if      (state.phase === 'spin')     renderSpin();
    else if (state.phase === 'card')     renderCard();
    else if (state.phase === 'answered') renderAnswered();
  }

  if (isOnline) {
    _listenRoom(ctx.code, data => {
      if (!data.data || data.data.phase === undefined) return;
      state = { phase:'spin', turn:0, s1:0, s2:0, card:null, answered:false, ...data.data };
      render();
    });
    if (isHost) {
      state = _getInitData('vdd');
      _writeRoom({ data: state });
    } else {
      state = { phase:'spin', turn:0, s1:0, s2:0, card:null, answered:false };
      body.innerHTML = `<div class="desenho-wait-box">
        <div style="font-size:2rem">🔥</div>
        <div class="desenho-wait-title">Aguardando Pietro iniciar…</div>
      </div>`;
    }
    _activeCleanup = () => { if(_roomUnsub){_roomUnsub();_roomUnsub=null;} };
    return;
  }

  state = _getInitData('vdd');
  render();
}

/* ══════════════════════════════════════════
   🎲 ROLETA DO CASAL
══════════════════════════════════════════ */

const ROLETA_SECTORS = [
  { id:0,  label:'💋 Beijo',          color:'#e8536f', task:'Dar um beijo demorado!' },
  { id:1,  label:'💌 Mensagem',       color:'#9b59b6', task:'Escrever uma mensagem carinhosa agora.' },
  { id:2,  label:'🎵 Serenata',       color:'#3498db', task:'Cantar 30s de uma música que lembre o outro.' },
  { id:3,  label:'💆 Massagem',       color:'#27ae60', task:'Dar 2 minutos de massagem nos ombros.' },
  { id:4,  label:'🤗 Abraço',         color:'#e67e22', task:'Abraço apertado por pelo menos 20 segundos.' },
  { id:5,  label:'📸 Selfie',         color:'#1abc9c', task:'Tirar uma selfie juntos agora e guardar!' },
  { id:6,  label:'🍫 Mimar',          color:'#c0392b', task:'Buscar algo gostoso pro outro comer.' },
  { id:7,  label:'💬 Elogio',         color:'#f39c12', task:'Falar 3 elogios sinceros sobre o outro.' },
  { id:8,  label:'🕹️ Escolha',        color:'#8e44ad', task:'O outro escolhe qualquer atividade pra fazer juntos.' },
  { id:9,  label:'✍️ Carta',          color:'#2980b9', task:'Escrever uma carta de amor de 5 linhas.' },
  { id:10, label:'🌹 Surpresa',       color:'#e91e63', task:'Preparar uma micro-surpresa em 5 minutos!' },
  { id:11, label:'🎯 Desafio',        color:'#ff5722', task:'O outro inventa um desafio pra você cumprir.' },
];

function openRoleta(mode = 'split', ctx = null) {
  const body     = _createOverlay('🎲 Roleta do Casal');
  const isOnline = mode === 'online';
  const isHost   = ctx?.role === 'host';

  let state = {};
  let _animFrame = null;
  let _angle = 0;

  /* ── desenha a roleta num canvas ── */
  function _drawWheel(canvas, highlightId) {
    const W  = canvas.width;
    const cx = W / 2, cy = W / 2, r = W / 2 - 8;
    const n  = ROLETA_SECTORS.length;
    const slice = (2 * Math.PI) / n;
    const ctx2  = canvas.getContext('2d');
    ctx2.clearRect(0, 0, W, W);

    ROLETA_SECTORS.forEach((sec, i) => {
      const start = _angle + i * slice - Math.PI / 2;
      const end   = start + slice;

      /* fatia */
      ctx2.beginPath();
      ctx2.moveTo(cx, cy);
      ctx2.arc(cx, cy, r, start, end);
      ctx2.closePath();
      ctx2.fillStyle = highlightId === sec.id
        ? _lighten(sec.color, 40) : sec.color;
      ctx2.fill();
      ctx2.strokeStyle = 'rgba(255,255,255,.25)';
      ctx2.lineWidth = 1.5;
      ctx2.stroke();

      /* texto */
      ctx2.save();
      ctx2.translate(cx, cy);
      ctx2.rotate(start + slice / 2);
      ctx2.textAlign = 'right';
      ctx2.fillStyle = 'white';
      ctx2.font = `bold ${W < 300 ? 9 : 11}px DM Sans, sans-serif`;
      ctx2.shadowColor = 'rgba(0,0,0,.6)';
      ctx2.shadowBlur  = 3;
      ctx2.fillText(sec.label, r - 8, 4);
      ctx2.restore();
    });

    /* centro */
    ctx2.beginPath();
    ctx2.arc(cx, cy, 18, 0, 2 * Math.PI);
    ctx2.fillStyle = '#1a1a2e';
    ctx2.fill();
    ctx2.strokeStyle = 'rgba(255,255,255,.4)';
    ctx2.lineWidth = 2;
    ctx2.stroke();

    /* ponteiro (triângulo no topo) */
    ctx2.beginPath();
    ctx2.moveTo(cx - 10, 2);
    ctx2.lineTo(cx + 10, 2);
    ctx2.lineTo(cx, 22);
    ctx2.closePath();
    ctx2.fillStyle = 'white';
    ctx2.fill();
  }

  function _lighten(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, (n >> 16) + amt);
    const g = Math.min(255, ((n >> 8) & 0xff) + amt);
    const b = Math.min(255, (n & 0xff) + amt);
    return `rgb(${r},${g},${b})`;
  }

  /* ── anima a roleta e retorna o sector sorteado ── */
  function _spinAnimation(canvas, targetSectorId, onDone) {
    const n     = ROLETA_SECTORS.length;
    const slice = (2 * Math.PI) / n;
    /* ângulo final: ponteiro no topo aponta para o centro da fatia target */
    const targetAngle = -(targetSectorId * slice) + slice / 2 + Math.PI / 2;
    const totalSpin   = Math.PI * 2 * (6 + Math.random() * 4) + targetAngle - (_angle % (Math.PI * 2));
    const duration    = 3500;
    const start       = performance.now();

    function frame(now) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      /* easeOutQuart */
      const ease = 1 - Math.pow(1 - t, 4);
      _angle = ease * totalSpin;
      _drawWheel(canvas, t > 0.95 ? targetSectorId : null);
      if (t < 1) {
        _animFrame = requestAnimationFrame(frame);
      } else {
        _angle = targetAngle;
        _drawWheel(canvas, targetSectorId);
        onDone();
      }
    }
    _animFrame = requestAnimationFrame(frame);
  }

  /* ── render principal ── */
  function render() {
    if (!state || state.phase === undefined) return;
    const myTurn   = !isOnline || (isHost && state.turn===0) || (!isHost && state.turn===1);
    const turnName = state.turn===0 ? 'Pietro 💙' : 'Emilly 💗';
    const sec      = state.sector != null ? ROLETA_SECTORS[state.sector] : null;

    body.innerHTML = `
      <div class="game-score-bar">
        <div class="game-score-box" style="border:1px solid ${state.turn===0?'#4a90d9':'transparent'}">
          <div class="game-score-label">Pietro 💙</div>
          <div class="game-score-num" style="color:#4a90d9">${state.s1||0}</div>
        </div>
        <div class="game-score-box">
          <div class="game-score-label">Rodadas</div>
          <div class="game-score-num" style="font-size:.8rem">🎲</div>
        </div>
        <div class="game-score-box" style="border:1px solid ${state.turn===1?'#e8536f':'transparent'}">
          <div class="game-score-label">Emilly 💗</div>
          <div class="game-score-num" style="color:#e8536f">${state.s2||0}</div>
        </div>
      </div>

      <div style="position:relative;width:min(280px,88vw);margin:0 auto">
        <canvas id="roleta-canvas" width="280" height="280" style="width:100%;display:block"></canvas>
      </div>

      ${state.phase === 'spin' ? `
        <div style="text-align:center;font-size:.78rem;color:rgba(255,255,255,.55)">
          ${myTurn ? `<span style="color:white;font-weight:700">Sua vez!</span> Gire a roleta:` : `Vez de ${turnName} girar…`}
        </div>
        ${myTurn ? `<button class="roleta-spin-btn" id="roleta-spin">🎲 Girar!</button>` : ''}
      ` : state.phase === 'result' ? `
        <div class="roleta-result-box" style="border-color:${sec?.color||'#fff'}40;background:${sec?.color||'#fff'}18">
          <div class="roleta-result-label" style="color:${sec?.color||'white'}">${sec?.label||''}</div>
          <div class="roleta-result-task">${sec?.task||''}</div>
          <div style="font-size:.72rem;color:rgba(255,255,255,.45)">Para: <strong style="color:${sec?.color}">${turnName}</strong></div>
        </div>
        ${!state.done ? `
          <div class="vdd-action-row">
            <button class="vdd-action-btn vdd-btn-done" id="roleta-done">✅ Cumpriu! +1</button>
            <button class="vdd-action-btn vdd-btn-skip" id="roleta-skip">⏭️ Passou</button>
          </div>` : `
          <div class="vdd-answered-tag">✅ Cumprido!</div>
          ${myTurn ? `<button class="game-restart-btn" id="roleta-next">Próxima vez ▶</button>` : '<div class="vdd-wait-msg">Aguardando…</div>'}
        `}
      ` : ''}
    `;

    const canvas = document.getElementById('roleta-canvas');
    if (canvas) {
      if (state.phase === 'result' && sec) {
        _drawWheel(canvas, sec.id);
      } else {
        _drawWheel(canvas, null);
      }
    }

    /* spin button */
    document.getElementById('roleta-spin')?.addEventListener('click', async () => {
      if (!myTurn) return;
      const target = Math.floor(Math.random() * ROLETA_SECTORS.length);
      /* anima localmente */
      document.getElementById('roleta-spin').disabled = true;
      _spinAnimation(canvas, target, async () => {
        state.sector = target;
        state.phase  = 'result';
        state.done   = false;
        if (isOnline) await _writeRoom({ data: state });
        else render();
      });
    });

    /* cumpriu */
    document.getElementById('roleta-done')?.addEventListener('click', async () => {
      if (state.turn===0) state.s1=(state.s1||0)+1;
      else                state.s2=(state.s2||0)+1;
      state.done = true;
      if (isOnline) await _writeRoom({ data: state });
      else render();
    });

    /* passou */
    document.getElementById('roleta-skip')?.addEventListener('click', async () => {
      state.done = true;
      if (isOnline) await _writeRoom({ data: state });
      else render();
    });

    /* próxima vez */
    document.getElementById('roleta-next')?.addEventListener('click', async () => {
      state.turn   = state.turn===0 ? 1 : 0;
      state.phase  = 'spin';
      state.sector = null;
      state.done   = false;
      if (isOnline) await _writeRoom({ data: state });
      else render();
    });
  }

  if (isOnline) {
    _listenRoom(ctx.code, data => {
      if (!data.data || data.data.phase === undefined) return;
      /* não sobrescreve durante animação local */
      if (_animFrame) return;
      state = { phase:'spin', turn:0, s1:0, s2:0, sector:null, done:false, ...data.data };
      render();
    });
    if (isHost) {
      state = _getInitData('roleta');
      _writeRoom({ data: state });
    } else {
      state = { phase:'spin', turn:0, s1:0, s2:0, sector:null, done:false };
      body.innerHTML = `<div class="desenho-wait-box">
        <div style="font-size:2rem">🎲</div>
        <div class="desenho-wait-title">Aguardando Pietro iniciar…</div>
      </div>`;
    }
    _activeCleanup = () => {
      if (_animFrame) { cancelAnimationFrame(_animFrame); _animFrame = null; }
      if (_roomUnsub) { _roomUnsub(); _roomUnsub = null; }
    };
    return;
  }

  state = _getInitData('roleta');
  render();
}

/* ══════════════════════════════════════════
   CSS — estilos injetados em runtime
══════════════════════════════════════════ */
function _injectGameStyles() {
  // Estilos movidos para games.css
}

/* ══════════════════════════════════════════
   🎵 ADIVINHE A MÚSICA — dados
══════════════════════════════════════════ */
const MUSICA_TRACKS = [
  { id:'shape',    title:'Shape of You',        artist:'Ed Sheeran',       src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',  preview: 5 },
  { id:'blinding', title:'Blinding Lights',     artist:'The Weeknd',       src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',  preview: 5 },
  { id:'levitate', title:'Levitating',          artist:'Dua Lipa',         src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',  preview: 5 },
  { id:'stay',     title:'Stay',                artist:'Justin Bieber',    src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',  preview: 5 },
  { id:'sunflower',title:'Sunflower',           artist:'Post Malone',      src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',  preview: 5 },
  { id:'dancemon', title:'Dance Monkey',        artist:'Tones and I',      src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',  preview: 5 },
  { id:'peaches',  title:'Peaches',             artist:'Justin Bieber',    src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',  preview: 5 },
  { id:'asylum',   title:'Love Story',          artist:'Taylor Swift',     src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',  preview: 5 },
  { id:'drivers',  title:'Drivers License',     artist:'Olivia Rodrigo',   src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',  preview: 5 },
  { id:'perfect',  title:'Perfect',             artist:'Ed Sheeran',       src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', preview: 5 },
  { id:'someone',  title:'Someone Like You',    artist:'Adele',            src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', preview: 5 },
  { id:'thunder',  title:'Thunder',             artist:'Imagine Dragons',  src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', preview: 5 },
  { id:'counting', title:'Counting Stars',      artist:'OneRepublic',      src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', preview: 5 },
  { id:'rollingd', title:'Rolling in the Deep', artist:'Adele',            src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3', preview: 5 },
  { id:'badbloodnew', title:'Bad Blood',        artist:'Taylor Swift',     src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3', preview: 5 },
  { id:'astronaut',title:'Astronaut in the Ocean', artist:'Masked Wolf',   src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3', preview: 5 },
];

/* ══════════════════════════════════════════
   🎵 ADIVINHE A MÚSICA — jogo
══════════════════════════════════════════ */
function openMusica(mode = 'split', ctx = null) {
  const body = _createOverlay('🎵 Adivinhe a Música');
  const isOnline = mode === 'online';
  const isHost   = ctx?.role === 'host';

  let state = _getInitData('musica');
  let _roomUnsub = null;
  let _audio = null;
  let _timer = null;
  let _countdown = null;

  const PREVIEW_SEC = 7; // segundos que toca antes de parar
  const TOTAL_Q    = 8;

  /* nomes normalizados para comparação */
  function normalize(s) {
    return s.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9 ]/g,'').trim();
  }
  function checkAnswer(guess, track) {
    const g = normalize(guess);
    const t = normalize(track.title);
    const a = normalize(track.artist);
    // aceita título ou artista parcial (>= 3 chars em comum como substring)
    if (g.length < 2) return false;
    return t.includes(g) || g.includes(t.split(' ')[0]) ||
           a.includes(g) || g.includes(a.split(' ')[0]);
  }

  function stopAudio() {
    if (_audio) { try { _audio.pause(); } catch(e){} _audio = null; }
    if (_timer) { clearTimeout(_timer); _timer = null; }
  }

  function playTrack(src, onEnded) {
    stopAudio();
    _audio = new Audio(src);
    _audio.volume = 0.85;
    _audio.play().catch(() => {});
    _timer = setTimeout(() => { stopAudio(); if (onEnded) onEnded(); }, PREVIEW_SEC * 1000);
  }

  /* ─── render ─── */
  function render() {
    const s = state;
    const track = s.tracks[s.qi];
    const myTurn = isOnline ? (isHost ? s.turn === 0 : s.turn === 1) : true;
    const p1Name = 'Pietro'; const p2Name = 'Emilly';
    const turnName = s.turn === 0 ? p1Name : p2Name;
    const myName   = isOnline ? (isHost ? p1Name : p2Name) : turnName;

    if (s.phase === 'gameover') {
      stopAudio();
      const winner = s.s1 > s.s2 ? `${p1Name} 💙` : s.s2 > s.s1 ? `${p2Name} 💗` : 'Empate 💕';
      _showResult(body, '🎵', `${winner} venceu!`, `${p1Name} ${s.s1} × ${s.s2} ${p2Name}`, () => openMusica(mode, ctx));
      return;
    }

    /* monta as 4 opções (track correta + 3 aleatórias) */
    const allTitles = MUSICA_TRACKS.map(t => ({ title: t.title, artist: t.artist }));
    const wrong = allTitles.filter(t => t.title !== track.title).sort(() => Math.random() - .5).slice(0, 3);
    const options = [...wrong, { title: track.title, artist: track.artist }].sort(() => Math.random() - .5);

    const scoreBar = `
      <div class="musica-score-bar">
        <div class="musica-score-pill p1">💙 ${p1Name} <span>${s.s1}</span></div>
        <div class="musica-round-badge">🎵 ${s.qi + 1}/${TOTAL_Q}</div>
        <div class="musica-score-pill p2">💗 ${p2Name} <span>${s.s2}</span></div>
      </div>`;

    if (s.phase === 'listen') {
      body.innerHTML = scoreBar + `
        <div class="musica-card">
          <div class="musica-turn-label">vez de <strong>${turnName}</strong></div>
          <div class="musica-disc" id="m-disc">🎵</div>
          <div class="musica-status" id="m-status">Toque para ouvir o trecho!</div>
          <div class="musica-countdown" id="m-countdown"></div>
          <button class="musica-play-btn" id="m-play-btn">▶ Ouvir Música</button>
          <div class="musica-options" id="m-options" style="display:none">
            ${options.map((o, i) => `
              <button class="musica-option-btn" data-idx="${i}" data-title="${o.title}" data-artist="${o.artist}">
                🎵 ${o.title}<span class="musica-artist">— ${o.artist}</span>
              </button>`).join('')}
          </div>
          ${!myTurn && isOnline ? `<div class="musica-waiting">Aguardando ${turnName} responder…</div>` : ''}
        </div>`;

      let playing = false;
      let countdownInt = null;

      document.getElementById('m-play-btn')?.addEventListener('click', () => {
        if (playing) return;
        if (!myTurn && isOnline) return;
        playing = true;
        const btn = document.getElementById('m-play-btn');
        const disc = document.getElementById('m-disc');
        const status = document.getElementById('m-status');
        const opts = document.getElementById('m-options');
        const countdown = document.getElementById('m-countdown');

        btn.disabled = true;
        btn.textContent = '🎵 Tocando…';
        disc.classList.add('musica-disc-spin');
        status.textContent = `Ouvindo por ${PREVIEW_SEC}s…`;

        let sec = PREVIEW_SEC;
        countdown.textContent = sec + 's';
        countdownInt = setInterval(() => {
          sec--;
          countdown.textContent = sec > 0 ? sec + 's' : '';
          if (sec <= 0) clearInterval(countdownInt);
        }, 1000);

        playTrack(track.src, () => {
          clearInterval(countdownInt);
          disc.classList.remove('musica-disc-spin');
          status.textContent = 'Qual é essa música?';
          opts.style.display = '';
          btn.style.display = 'none';
        });
      });

      /* escolha de opção */
      document.getElementById('m-options')?.addEventListener('click', async e => {
        const btn = e.target.closest('.musica-option-btn');
        if (!btn) return;
        if (!myTurn && isOnline) return;

        stopAudio();
        const chosen = btn.dataset.title;
        const correct = chosen === track.title;

        /* feedback visual */
        document.querySelectorAll('.musica-option-btn').forEach(b => {
          b.disabled = true;
          if (b.dataset.title === track.title) b.classList.add('musica-correct');
          else if (b === btn && !correct) b.classList.add('musica-wrong');
        });

        const newS1 = s.s1 + (correct && s.turn === 0 ? 1 : 0);
        const newS2 = s.s2 + (correct && s.turn === 1 ? 1 : 0);
        const newQi = s.qi + 1;
        const nextTurn = (s.turn + 1) % 2;
        const gameover = newQi >= TOTAL_Q;

        const newState = {
          ...s,
          phase: gameover ? 'gameover' : 'listen',
          qi: newQi,
          s1: newS1,
          s2: newS2,
          turn: nextTurn,
          answered: false,
          result: null,
        };

        await new Promise(r => setTimeout(r, 1400));

        if (isOnline) {
          await _writeRoom({ data: newState });
        } else {
          state = newState;
          render();
        }
      });

      return;
    }
  }

  /* ─── online mode ─── */
  if (isOnline) {
    _roomUnsub = _listenRoom(ctx.code, data => {
      if (!data.data) return;
      state = { ...state, ...data.data };
      stopAudio();
      render();
    });
    if (isHost) {
      state = _getInitData('musica');
      _writeRoom({ data: state });
    } else {
      state = { phase: 'listen', qi: 0, tracks: [], turn: 0, s1: 0, s2: 0 };
      body.innerHTML = `<div class="desenho-wait-box">
        <div style="font-size:2.5rem">🎵</div>
        <div class="desenho-wait-title">Aguardando Pietro iniciar…</div>
      </div>`;
    }
    _activeCleanup = () => {
      stopAudio();
      if (_roomUnsub) { _roomUnsub(); _roomUnsub = null; }
    };
    return;
  }

  /* ─── split mode ─── */
  _activeCleanup = () => { stopAudio(); };
  state = _getInitData('musica');
  render();
}

/* ══════════════════════════════════════════
   ⚡ QUEM SOU EU? — cartas
══════════════════════════════════════════ */
const QSE_CARDS = [
  // Personagens de filmes / séries
  { name: 'Cinderela',       cat: '🎬 Filme',    hints: ['sou uma princesa','uso sapatinho de cristal','minha madrasta é malvada'] },
  { name: 'Simba',           cat: '🎬 Filme',    hints: ['sou um leão','meu pai se chama Mufasa','vivo no Rei Leão'] },
  { name: 'Elsa',            cat: '🎬 Filme',    hints: ['tenho poderes de gelo','sou irmã da Anna','canto Let It Go'] },
  { name: 'Jack Sparrow',    cat: '🎬 Filme',    hints: ['sou um pirata','adoro rum','sou do Caribe'] },
  { name: 'Homem-Aranha',    cat: '🎬 Filme',    hints: ['sou um super-herói','tenho teia','moro em Nova York'] },
  { name: 'Hermione Granger',cat: '🎬 Filme',    hints: ['sou bruxa','estudo em Hogwarts','sou amiga do Harry Potter'] },
  { name: 'Shrek',           cat: '🎬 Filme',    hints: ['sou ogro','moro num pântano','meu melhor amigo é um burro'] },
  { name: 'Woody',           cat: '🎬 Filme',    hints: ['sou um cowboy','sou brinquedo','sou amigo do Buzz'] },
  { name: 'Nemo',            cat: '🎬 Filme',    hints: ['sou um peixe laranja','moro no oceano','meu pai me procurou pelo mar'] },
  { name: 'Batman',          cat: '🎬 Filme',    hints: ['sou herói','uso capa preta','moro em Gotham'] },
  // Animais
  { name: 'Golfinho',        cat: '🐾 Animal',   hints: ['vivo no mar','sou muito inteligente','faço sons agudos'] },
  { name: 'Pinguim',         cat: '🐾 Animal',   hints: ['não consigo voar','vivo no frio','uso "smoking" natural'] },
  { name: 'Girafa',          cat: '🐾 Animal',   hints: ['tenho pescoço enorme','sou o animal mais alto','como folhas no topo das árvores'] },
  { name: 'Coala',           cat: '🐾 Animal',   hints: ['vivo na Austrália','durmo quase 20 horas por dia','como eucalipto'] },
  { name: 'Panda',           cat: '🐾 Animal',   hints: ['sou preto e branco','como bambu','sou da China'] },
  { name: 'Flamingo',        cat: '🐾 Animal',   hints: ['sou rosa','fico de pé numa perna só','sou uma ave'] },
  // Comidas
  { name: 'Pizza',           cat: '🍕 Comida',   hints: ['sou redonda','tenho queijo','fui inventada na Itália'] },
  { name: 'Sorvete',         cat: '🍕 Comida',   hints: ['sou gelada','tenho vários sabores','derreto no calor'] },
  { name: 'Sushi',           cat: '🍕 Comida',   hints: ['sou japonês','levo peixe cru','como com hashis'] },
  { name: 'Brigadeiro',      cat: '🍕 Comida',   hints: ['sou doce','sou feito de chocolate','sou tipicamente brasileiro'] },
  { name: 'Hambúrguer',      cat: '🍕 Comida',   hints: ['tenho dois pães','levo carne','o McDonald\'s me vende'] },
  { name: 'Pipoca',          cat: '🍕 Comida',   hints: ['sou feita de milho','estouro no calor','vou bem com filme'] },
  // Profissões
  { name: 'Astronauta',      cat: '💼 Profissão', hints: ['vou ao espaço','uso roupa especial','flutuo em gravidade zero'] },
  { name: 'Chef de Cozinha', cat: '💼 Profissão', hints: ['uso toque branco','cozinho para muitas pessoas','trabalho em restaurante'] },
  { name: 'Mergulhador',     cat: '💼 Profissão', hints: ['trabalho embaixo d\'água','uso cilindro de oxigênio','vejo corais e peixes'] },
  { name: 'Palhaço',         cat: '💼 Profissão', hints: ['uso nariz vermelho','faço as pessoas rirem','trabalho no circo'] },
  // Objetos / coisas
  { name: 'Arco-íris',       cat: '🌈 Coisa',    hints: ['apareço após a chuva','tenho 7 cores','estou no céu'] },
  { name: 'Tesouro',         cat: '🌈 Coisa',    hints: ['estou escondido','sou feito de ouro','piratas me procuram'] },
  { name: 'Bússola',         cat: '🌈 Coisa',    hints: ['aponto para o norte','ajudo a se orientar','sou usada em expedições'] },
  { name: 'Foguete',         cat: '🌈 Coisa',    hints: ['vou para o espaço','faço muito barulho','uso combustível'] },
  // Celebridades / músicos
  { name: 'Taylor Swift',    cat: '⭐ Famoso',    hints: ['sou cantora','tenho muitos álbuns','minhas fãs se chamam Swifties'] },
  { name: 'Cristiano Ronaldo',cat:'⭐ Famoso',    hints: ['sou jogador de futebol','fiz muito gol','digo "Siiiuu!"'] },
  { name: 'Beyoncé',         cat: '⭐ Famoso',    hints: ['sou cantora','fui do Destiny\'s Child','meu marido é o Jay-Z'] },
  { name: 'Elon Musk',       cat: '⭐ Famoso',    hints: ['sou bilionário','tenho uma empresa de foguetes','comprei uma rede social'] },
];

/* ══════════════════════════════════════════
   ⚡ QUEM SOU EU? — jogo
══════════════════════════════════════════ */
function openQuemSouEu(mode = 'split', ctx = null) {
  const body      = _createOverlay('⚡ Quem Sou Eu?');
  const isOnline  = mode === 'online';
  const isHost    = ctx?.role === 'host';
  const P1        = 'Pietro';
  const P2        = 'Emilly';

  let state       = _getInitData('quemsoueu');
  let _roomUnsub  = null;
  let _timerInt   = null;

  function stopTimer() { if (_timerInt) { clearInterval(_timerInt); _timerInt = null; } }

  /* ─── avança estado ─── */
  async function advance(won) {
    stopTimer();
    const ns = { ...state };
    if (won)  ns.turn === 0 ? ns.s1++ : ns.s2++;
    ns.round++;
    ns.turn     = (ns.turn + 1) % 2;
    ns.phase    = ns.round > ns.totalRounds ? 'gameover' : 'pick';
    ns.card     = null;
    ns.cardIdx  = (ns.cardIdx + 1) % ns.deck.length;
    ns.timeLeft = 60;
    ns.asking   = false;
    if (isOnline) await _writeRoom({ data: ns });
    else { state = ns; render(); }
  }

  /* ─── render ─── */
  function render() {
    stopTimer();
    const s = state;
    const turnName  = s.turn === 0 ? P1 : P2;
    const myTurn    = isOnline ? (isHost ? s.turn === 0 : s.turn === 1) : true;

    /* placar */
    const scoreBar = `
      <div class="qse-score-bar">
        <div class="qse-score-pill p1">💙 ${P1} <span>${s.s1}</span></div>
        <div class="qse-round-badge">⚡ ${Math.min(s.round, s.totalRounds)}/${s.totalRounds}</div>
        <div class="qse-score-pill p2">💗 ${P2} <span>${s.s2}</span></div>
      </div>`;

    /* ── fim de jogo ── */
    if (s.phase === 'gameover') {
      const winner = s.s1 > s.s2 ? `${P1} 💙` : s.s2 > s.s1 ? `${P2} 💗` : 'Empate 💕';
      _showResult(body, '⚡', `${winner} venceu!`, `${P1} ${s.s1} × ${s.s2} ${P2}`, () => openQuemSouEu(mode, ctx));
      return;
    }

    /* ── escolha de carta ── */
    if (s.phase === 'pick') {
      body.innerHTML = scoreBar + `
        <div class="qse-card-area">
          <div class="qse-turn-label">vez de <strong>${turnName}</strong></div>
          <div class="qse-postit qse-postit-blank">
            <div class="qse-postit-mark">?</div>
          </div>
          <div class="qse-instruction">
            ${myTurn
              ? `<p>Coloca o celular na sua testa sem olhar!</p>
                 <p class="qse-sub">O outro verá quem você é.</p>
                 <button class="qse-btn-primary" id="qse-ready-btn">Estou pronto! 🙆</button>`
              : `<p>Aguarde <strong>${turnName}</strong> colocar na testa…</p>`
            }
          </div>
        </div>`;

      document.getElementById('qse-ready-btn')?.addEventListener('click', async () => {
        const ns = { ...s, phase: 'asking', asking: true, card: s.deck[s.cardIdx] };
        if (isOnline) await _writeRoom({ data: ns });
        else { state = ns; render(); }
      });
      return;
    }

    /* ── fazendo perguntas ── */
    if (s.phase === 'asking') {
      const card  = s.card || s.deck[s.cardIdx];
      const iMe   = myTurn; // quem está com o celular na testa
      const iOther = !iMe;  // quem vê a resposta

      body.innerHTML = scoreBar + `
        <div class="qse-card-area">
          <div class="qse-turn-label">vez de <strong>${turnName}</strong></div>

          ${iOther
            ? `<div class="qse-postit qse-postit-visible">
                <div class="qse-postit-cat">${card.cat}</div>
                <div class="qse-postit-name">${card.name}</div>
                <div class="qse-hints">
                  ${card.hints.map(h => `<div class="qse-hint-pill">💡 ${h}</div>`).join('')}
                </div>
               </div>`
            : `<div class="qse-postit qse-postit-testa">
                <div class="qse-postit-mark">?</div>
                <div class="qse-testa-label">na sua testa! 🙆</div>
               </div>`
          }

          <div class="qse-timer-row">
            <div class="qse-timer-ring" id="qse-ring">
              <svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="4"/><circle id="qse-arc" cx="22" cy="22" r="18" fill="none" stroke="#f9a8d4" stroke-width="4" stroke-linecap="round" stroke-dasharray="113" stroke-dashoffset="0" style="transform:rotate(-90deg);transform-origin:50% 50%;transition:stroke-dashoffset .9s linear"/></svg>
              <span id="qse-timer-txt">${s.timeLeft}</span>
            </div>
            <span class="qse-timer-label">segundos</span>
          </div>

          ${myTurn
            ? `<div class="qse-btn-row">
                <button class="qse-btn-wrong"  id="qse-no-btn">❌ Não Acertei</button>
                <button class="qse-btn-correct" id="qse-yes-btn">✅ Acertei!</button>
               </div>`
            : `<div class="qse-waiting-txt">Responda Sim ou Não para as perguntas de ${turnName}!</div>`
          }
        </div>`;

      /* inicia timer */
      let t = s.timeLeft;
      const arc = document.getElementById('qse-arc');
      const txt = document.getElementById('qse-timer-txt');
      _timerInt = setInterval(async () => {
        t--;
        if (txt) txt.textContent = t;
        if (arc) arc.setAttribute('stroke-dashoffset', String(Math.round(113 * (1 - t / 60))));
        if (arc) arc.setAttribute('stroke', t > 20 ? '#f9a8d4' : t > 10 ? '#fb923c' : '#f87171');
        if (t <= 0) { stopTimer(); await advance(false); }

        if (isOnline && isHost) await _writeRoom({ data: { ...state, timeLeft: t } });
      }, 1000);

      document.getElementById('qse-yes-btn')?.addEventListener('click', () => advance(true));
      document.getElementById('qse-no-btn')?.addEventListener('click',  () => advance(false));
      return;
    }
  }

  /* ─── online ─── */
  if (isOnline) {
    _roomUnsub = _listenRoom(ctx.code, data => {
      if (!data.data) return;
      state = { ...state, ...data.data };
      render();
    });
    if (isHost) {
      state = _getInitData('quemsoueu');
      _writeRoom({ data: state });
    } else {
      body.innerHTML = `<div class="desenho-wait-box">
        <div style="font-size:2.5rem">⚡</div>
        <div class="desenho-wait-title">Aguardando Pietro iniciar…</div>
      </div>`;
    }
    _activeCleanup = () => {
      stopTimer();
      if (_roomUnsub) { _roomUnsub(); _roomUnsub = null; }
    };
    return;
  }

  /* ─── split ─── */
  _activeCleanup = () => stopTimer();
  state = _getInitData('quemsoueu');
  render();
}

/* ══════════════════════════════════════════
   🎰 CAÇA-NÍQUEL DO AMOR — dados
══════════════════════════════════════════ */
const CN_SYMBOLS = ['💕','🌹','💋','🌸','💎','⭐','🍫','🎵'];

const CN_REWARDS = {
  // Três iguais — jackpots
  '💕💕💕': { label: 'JACKPOT DO AMOR! 💕',      pts: 5, action: 'Os dois escolhem juntos um programa especial para fazer hoje!' },
  '🌹🌹🌹': { label: 'ROSAS TRIPLAS! 🌹',         pts: 4, action: 'Quem girou ganha um buquê de elogios — o outro fala 5 coisas lindas agora!' },
  '💋💋💋': { label: 'BEIJO TRIPLO! 💋',           pts: 4, action: 'Três beijos longos agora mesmo — sem escapatória!' },
  '🌸🌸🌸': { label: 'FLORZINHA TRIPLA! 🌸',      pts: 3, action: 'O outro te manda uma mensagem de voz fofa agora!' },
  '💎💎💎': { label: 'DIAMANTE! 💎',               pts: 5, action: 'Quem girou escolhe o próximo date — o outro banca tudo!' },
  '⭐⭐⭐': { label: 'ESTRELA TRIPLA! ⭐',          pts: 3, action: 'Selfie juntos agora com coração feito com as mãos 🤳' },
  '🍫🍫🍫': { label: 'CHOCOLATE TRIPLO! 🍫',      pts: 3, action: 'Quem girou merece um docinho — o outro resolve!' },
  '🎵🎵🎵': { label: 'SERENATA! 🎵',              pts: 4, action: 'O outro canta (ou toca) uma música para você agora!' },
  // Dois iguais — prêmios menores
  '💕💕': { label: 'Par de Corações 💕',           pts: 2, action: 'Abraço de 10 segundos — cronometrado!' },
  '🌹🌹': { label: 'Par de Rosas 🌹',             pts: 2, action: 'Manda um áudio fofo de 15 segundos!' },
  '💋💋': { label: 'Par de Beijos 💋',             pts: 2, action: 'Um beijo na bochecha e um no pescoço!' },
  '💎💎': { label: 'Par de Diamantes 💎',          pts: 2, action: 'Escolhe uma música e dança 30 segundos junto!' },
  '🌸🌸': { label: 'Par de Flores 🌸',            pts: 1, action: 'Troca uma mensagem carinhosa pelo chat!' },
  '⭐⭐': { label: 'Par de Estrelas ⭐',           pts: 1, action: 'Conta uma coisa que admira no outro!' },
  '🍫🍫': { label: 'Par de Chocolates 🍫',        pts: 1, action: 'Manda um meme fofo agora!' },
  '🎵🎵': { label: 'Par de Notas 🎵',             pts: 1, action: 'Manda a música que mais te lembra o outro!' },
  // Sem combinação
  'miss':   { label: 'Quase lá… 😅',              pts: 0, action: 'Sem sorte dessa vez — passa a vez!' },
};

function _cnGetReward(reels) {
  const [a, b, c] = reels;
  if (a === b && b === c) return CN_REWARDS[`${a}${b}${c}`] || CN_REWARDS['miss'];
  if (a === b) return CN_REWARDS[`${a}${b}`] || CN_REWARDS['miss'];
  if (b === c) return CN_REWARDS[`${b}${c}`] || CN_REWARDS['miss'];
  if (a === c) return CN_REWARDS[`${a}${c}`] || CN_REWARDS['miss'];
  return CN_REWARDS['miss'];
}

/* ══════════════════════════════════════════
   🎰 CAÇA-NÍQUEL DO AMOR — jogo
══════════════════════════════════════════ */
function openCacaNivel(mode = 'split', ctx = null) {
  const body     = _createOverlay('🎰 Caça-Níquel do Amor');
  const isOnline = mode === 'online';
  const isHost   = ctx?.role === 'host';
  const P1 = 'Pietro', P2 = 'Emilly';
  const TOTAL_ROUNDS = 10;

  let state     = _getInitData('cacanivel');
  let _roomUnsub = null;
  let _spinInt   = null;

  function stopSpin() { if (_spinInt) { clearInterval(_spinInt); _spinInt = null; } }

  /* ─── render ─── */
  function render() {
    stopSpin();
    const s = state;
    const turnName = s.turn === 0 ? P1 : P2;
    const myTurn   = isOnline ? (isHost ? s.turn === 0 : s.turn === 1) : true;

    const scoreBar = `
      <div class="cn-score-bar">
        <div class="cn-score-pill p1">💙 ${P1} <span>${s.s1}</span></div>
        <div class="cn-round-badge">🎰 ${Math.min(s.round + 1, TOTAL_ROUNDS)}/${TOTAL_ROUNDS}</div>
        <div class="cn-score-pill p2">💗 ${P2} <span>${s.s2}</span></div>
      </div>`;

    /* fim de jogo */
    if (s.phase === 'gameover') {
      const winner = s.s1 > s.s2 ? `${P1} 💙` : s.s2 > s.s1 ? `${P2} 💗` : 'Empate 💕';
      _showResult(body, '🎰', `${winner} venceu!`, `${P1} ${s.s1} × ${s.s2} ${P2}`, () => openCacaNivel(mode, ctx));
      return;
    }

    /* fase idle — aguardando girar */
    if (s.phase === 'idle' || s.phase === 'result') {
      const reward = s.reward;
      body.innerHTML = scoreBar + `
        <div class="cn-machine">
          <div class="cn-lights" id="cn-lights">${'<span></span>'.repeat(12)}</div>

          <div class="cn-screen">
            <div class="cn-reels" id="cn-reels">
              ${s.reels.map((sym, i) => `
                <div class="cn-reel-wrap">
                  <div class="cn-reel" id="cn-reel-${i}">${sym}</div>
                </div>`).join('')}
            </div>
            <div class="cn-payline"></div>
          </div>

          ${reward ? `
            <div class="cn-reward-box ${reward.pts >= 4 ? 'cn-jackpot' : reward.pts >= 2 ? 'cn-win' : 'cn-miss'}">
              <div class="cn-reward-label">${reward.label}</div>
              <div class="cn-reward-action">${reward.action}</div>
              ${reward.pts > 0 ? `<div class="cn-reward-pts">+${reward.pts} ${reward.pts === 1 ? 'ponto' : 'pontos'} para ${turnName}!</div>` : ''}
            </div>` : ''}

          <div class="cn-turn-row">
            ${myTurn
              ? `<button class="cn-spin-btn" id="cn-spin-btn" ${s.phase === 'spinning' ? 'disabled' : ''}>
                   🎰 ${s.round === 0 && !reward ? 'Girar!' : 'Girar de Novo!'}
                 </button>`
              : `<div class="cn-waiting">Vez de <strong>${turnName}</strong> girar…</div>`
            }
          </div>
        </div>`;

      /* luzes piscando no jackpot */
      if (reward?.pts >= 4) {
        let lit = false;
        _spinInt = setInterval(() => {
          lit = !lit;
          document.querySelectorAll('#cn-lights span').forEach((el, i) => {
            el.style.background = lit ? (i % 2 === 0 ? '#f9a8d4' : '#7ec8e3') : 'rgba(255,255,255,.15)';
          });
        }, 300);
      }

      document.getElementById('cn-spin-btn')?.addEventListener('click', async () => {
        if (!myTurn && isOnline) return;

        /* gera resultado final */
        const finalReels = Array.from({ length: 3 }, () =>
          CN_SYMBOLS[Math.floor(Math.random() * CN_SYMBOLS.length)]
        );
        /* leve bias para combinações — mais divertido */
        if (Math.random() < 0.30) finalReels[1] = finalReels[0]; // par centro-esq
        if (Math.random() < 0.12) finalReels[2] = finalReels[0]; // trio

        const newRound  = s.round + 1;
        const reward    = _cnGetReward(finalReels);
        const newS1     = s.s1 + (s.turn === 0 ? reward.pts : 0);
        const newS2     = s.s2 + (s.turn === 1 ? reward.pts : 0);
        const nextTurn  = (s.turn + 1) % 2;
        const gameover  = newRound >= TOTAL_ROUNDS;

        const newState = {
          phase: 'spinning',
          reels: finalReels,
          reward,
          turn: s.turn,
          s1: newS1, s2: newS2,
          round: newRound,
          spinning: true,
          _spinTarget: finalReels,
        };

        if (isOnline) await _writeRoom({ data: newState });
        else { state = newState; renderSpin(finalReels, reward, nextTurn, gameover, newS1, newS2, newRound); }
      });

      return;
    }

    /* fase spinning — animação */
    if (s.phase === 'spinning') {
      renderSpin(s.reels, s.reward, (s.turn + 1) % 2, s.round >= TOTAL_ROUNDS, s.s1, s.s2, s.round);
    }
  }

  function renderSpin(finalReels, reward, nextTurn, gameover, newS1, newS2, newRound) {
    stopSpin();
    const s = state;
    const turnName = s.turn === 0 ? P1 : P2;

    /* mostra rolos girando */
    const reelEls = [0, 1, 2].map(i => document.getElementById(`cn-reel-${i}`));
    if (!reelEls[0]) {
      /* DOM não existe ainda — re-render como idle com resultado */
      state = { ...s, phase: 'result', reels: finalReels, reward, turn: nextTurn, s1: newS1, s2: newS2, round: newRound };
      if (!gameover) { /* aguarda antes de virar */ }
      render();
      return;
    }

    let tick = 0;
    const SPIN_TICKS = 18;
    _spinInt = setInterval(async () => {
      tick++;
      reelEls.forEach((el, i) => {
        if (!el) return;
        const stopAt = i === 0 ? SPIN_TICKS - 6 : i === 1 ? SPIN_TICKS - 3 : SPIN_TICKS;
        if (tick >= stopAt) {
          el.textContent = finalReels[i];
          el.classList.add('cn-reel-stop');
        } else {
          el.textContent = CN_SYMBOLS[Math.floor(Math.random() * CN_SYMBOLS.length)];
          el.classList.remove('cn-reel-stop');
        }
      });

      if (tick >= SPIN_TICKS) {
        stopSpin();
        const newState = {
          phase: gameover ? 'gameover' : 'result',
          reels: finalReels,
          reward,
          turn: nextTurn,
          s1: newS1, s2: newS2,
          round: newRound,
          spinning: false,
        };
        if (isOnline) await _writeRoom({ data: newState });
        else { state = newState; render(); }
      }
    }, 80);
  }

  /* ─── online ─── */
  if (isOnline) {
    _roomUnsub = _listenRoom(ctx.code, data => {
      if (!data.data) return;
      const prev = state.phase;
      state = { ...state, ...data.data };
      if (state.phase === 'spinning' && prev !== 'spinning') {
        render(); // dispara animação
      } else if (state.phase !== 'spinning') {
        render();
      }
    });
    if (isHost) {
      state = _getInitData('cacanivel');
      _writeRoom({ data: state });
    } else {
      body.innerHTML = `<div class="desenho-wait-box">
        <div style="font-size:2.5rem">🎰</div>
        <div class="desenho-wait-title">Aguardando Pietro iniciar…</div>
      </div>`;
    }
    _activeCleanup = () => { stopSpin(); if (_roomUnsub) { _roomUnsub(); _roomUnsub = null; } };
    return;
  }

  /* ─── split ─── */
  _activeCleanup = () => stopSpin();
  state = _getInitData('cacanivel');
  render();
}
