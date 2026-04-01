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
   CSS — estilos injetados em runtime
══════════════════════════════════════════ */
function _injectGameStyles() {
  // Estilos movidos para games.css
}
