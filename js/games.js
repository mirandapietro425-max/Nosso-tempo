/* ═══════════════════════════════════════════════
   PIETRO & EMILLY — games.js v37
   Arcade do Casal 🎮
   4 jogos: Taekwondo · Quiz · Memória · Snake · Tiro ao Alvo
   ═══════════════════════════════════════════════ */

import { doc, getDoc, setDoc, onSnapshot }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

let _db = null;
let _GAMES_DOC = null;

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
export function initGames(db) {
  _db = db;
  if (db) _GAMES_DOC = doc(db, 'games', 'shared');
  _renderGameCards();
}

/* ══════════════════════════════════════════════
   CATÁLOGO DE JOGOS
══════════════════════════════════════════════ */
const CATALOG = [
  { id:'taekwondo', icon:'🥋', title:'Taekwondo',      desc:'Lutem em combate 1v1!',         mode:'duo',  fn: openTaekwondo },
  { id:'quiz',      icon:'💘', title:'Quiz do Casal',  desc:'Quanto vocês se conhecem?',     mode:'both', fn: openQuiz      },
  { id:'memoria',   icon:'🃏', title:'Jogo da Memória',desc:'Encontre os pares!',             mode:'solo', fn: openMemoria   },
  { id:'snake',     icon:'🐍', title:'Snake do Amor',  desc:'Colete corações sem bater!',    mode:'solo', fn: openSnake     },
  { id:'alvo',      icon:'🎯', title:'Tiro ao Alvo',   desc:'Clique nos alvos mais rápido!', mode:'both', fn: openAlvo      },
];

function _renderGameCards() {
  const grid = document.getElementById('games-grid');
  if (!grid) return;
  grid.innerHTML = CATALOG.map(g => `
    <div class="game-card" onclick="window._openGame('${g.id}')">
      <span class="game-badge ${g.mode === 'duo' ? 'duo' : g.mode === 'solo' ? 'solo' : 'duo'}">
        ${g.mode === 'duo' ? '👥 Dupla' : g.mode === 'solo' ? '🎮 Solo' : '🎮 Solo / 👥 Dupla'}
      </span>
      <span class="game-card-icon">${g.icon}</span>
      <div class="game-card-title">${g.title}</div>
      <div class="game-card-desc">${g.desc}</div>
    </div>`).join('');
}

window._openGame = function(id) {
  const g = CATALOG.find(x => x.id === id);
  if (g) g.fn();
};

/* ══════════════════════════════════════════════
   OVERLAY HELPER
══════════════════════════════════════════════ */
let _activeCleanup = null;

function _createOverlay(title) {
  // Remove overlay anterior se existir
  document.getElementById('game-overlay')?.remove();
  if (_activeCleanup) { try { _activeCleanup(); } catch(e){} _activeCleanup = null; }

  const ov = document.createElement('div');
  ov.className = 'game-overlay';
  ov.id = 'game-overlay';
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
        <button class="game-restart-btn" onclick="window._closeGame()">Sair 👋</button>
        <button class="game-restart-btn" onclick="(${onRestart.toString()})()">Jogar de novo 🔄</button>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════════
   🥋 TAEKWONDO
══════════════════════════════════════════════ */
function openTaekwondo() {
  const body = _createOverlay('🥋 Taekwondo');

  const CANVAS_W = 480, CANVAS_H = 220;
  const GROUND   = CANVAS_H - 40;
  const P_W = 32, P_H = 50;
  const HP_MAX = 100;

  // Estado
  let animId = null, lastTime = 0;
  const keys = {};

  const p1 = { x:60,  y:GROUND-P_H, vx:0, vy:0, hp:HP_MAX, dir:1,  onGround:true,
                color:'#4a90d9', name:'Pietro 💙', kick:0, block:0, hitFlash:0, wins:0 };
  const p2 = { x:380, y:GROUND-P_H, vx:0, vy:0, hp:HP_MAX, dir:-1, onGround:true,
                color:'#e8536f', name:'Emilly 💗', kick:0, block:0, hitFlash:0, wins:0 };

  let roundOver = false, roundMsg = '', roundTimer = 0;

  body.innerHTML = `
    <div class="tkd-health-bars">
      <div class="tkd-hp-wrap">
        <div class="tkd-hp-label" style="color:#4a90d9">Pietro 💙</div>
        <div class="tkd-hp-track"><div class="tkd-hp-bar p1" id="hp1" style="width:100%"></div></div>
      </div>
      <div class="tkd-vs">VS</div>
      <div class="tkd-hp-wrap">
        <div class="tkd-hp-label" style="color:#e8536f;text-align:right">Emilly 💗</div>
        <div class="tkd-hp-track"><div class="tkd-hp-bar p2" id="hp2" style="width:100%"></div></div>
      </div>
    </div>
    <div class="game-score-bar">
      <div class="game-score-box"><div class="game-score-label">Pietro</div><div class="game-score-num" id="wins1">0</div></div>
      <div class="game-score-box" style="min-width:60px"><div class="game-score-label">Rounds</div><div class="game-score-num">💪</div></div>
      <div class="game-score-box"><div class="game-score-label">Emilly</div><div class="game-score-num" id="wins2">0</div></div>
    </div>
    <canvas id="tkd-canvas" width="${CANVAS_W}" height="${CANVAS_H}"></canvas>
    <div class="tkd-controls">
      <div class="tkd-player-ctrl">
        <div class="tkd-ctrl-label">Pietro (P1)</div>
        <div class="tkd-btns">
          <div></div>
          <button class="tkd-btn" data-key="w">⬆️</button>
          <div></div>
          <button class="tkd-btn" data-key="a">⬅️</button>
          <button class="tkd-btn" data-key="f">🥋</button>
          <button class="tkd-btn" data-key="d">➡️</button>
          <button class="tkd-btn wide" data-key="s">🛡️ Bloquear</button>
        </div>
      </div>
      <div class="tkd-player-ctrl">
        <div class="tkd-ctrl-label">Emilly (P2)</div>
        <div class="tkd-btns">
          <div></div>
          <button class="tkd-btn" data-key="ArrowUp">⬆️</button>
          <div></div>
          <button class="tkd-btn" data-key="ArrowLeft">⬅️</button>
          <button class="tkd-btn" data-key="l">🥋</button>
          <button class="tkd-btn" data-key="ArrowRight">➡️</button>
          <button class="tkd-btn wide" data-key="ArrowDown">🛡️ Bloquear</button>
        </div>
      </div>
    </div>`;

  const canvas = document.getElementById('tkd-canvas');
  const ctx    = canvas.getContext('2d');

  // Teclado
  const onKey = e => { keys[e.key] = e.type === 'keydown'; e.preventDefault(); };
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup',   onKey);

  // Botões touch
  body.querySelectorAll('.tkd-btn[data-key]').forEach(btn => {
    const k = btn.dataset.key;
    btn.addEventListener('pointerdown', e => { e.preventDefault(); keys[k] = true; });
    btn.addEventListener('pointerup',   e => { e.preventDefault(); keys[k] = false; });
    btn.addEventListener('pointerleave',e => { keys[k] = false; });
  });

  function resetRound() {
    p1.x=60; p1.y=GROUND-P_H; p1.vx=0; p1.vy=0; p1.hp=HP_MAX; p1.dir=1;  p1.kick=0; p1.block=0; p1.hitFlash=0; p1.onGround=true;
    p2.x=380;p2.y=GROUND-P_H; p2.vx=0; p2.vy=0; p2.hp=HP_MAX; p2.dir=-1; p2.kick=0; p2.block=0; p2.hitFlash=0; p2.onGround=true;
    roundOver=false; roundMsg='';
  }

  function applyPhysics(p, left, right, jump, kick, block, opponent, dt) {
    if (roundOver) return;
    const SPEED=3.5, JUMP=-9, GRAVITY=0.45, KICK_DMG=12, KICK_RANGE=50;

    // Movimento
    if (left)  { p.vx = -SPEED; p.dir = -1; }
    else if (right) { p.vx = SPEED; p.dir = 1; }
    else p.vx *= 0.7;

    // Pulo
    if (jump && p.onGround) { p.vy = JUMP; p.onGround = false; }

    // Gravidade
    p.vy += GRAVITY;
    p.x += p.vx;
    p.y += p.vy;

    // Chão
    if (p.y >= GROUND - P_H) { p.y = GROUND - P_H; p.vy = 0; p.onGround = true; }

    // Limites do canvas
    p.x = Math.max(5, Math.min(CANVAS_W - P_W - 5, p.x));

    // Bloqueio
    p.block = block ? 1 : 0;

    // Chute
    if (kick && p.kick <= 0) {
      p.kick = 18;
      const dist = Math.abs((p.x + P_W/2) - (opponent.x + P_W/2));
      if (dist < KICK_RANGE) {
        const dmg = opponent.block ? KICK_DMG * 0.2 : KICK_DMG;
        opponent.hp = Math.max(0, opponent.hp - dmg);
        opponent.hitFlash = 8;
        opponent.vx += p.dir * 4;
      }
    }
    if (p.kick > 0) p.kick--;
    if (p.hitFlash > 0) p.hitFlash--;
  }

  function drawPlayer(p, label) {
    const x = p.x, y = p.y;
    const isKicking  = p.kick > 10;
    const isBlocking = p.block > 0;
    const flash = p.hitFlash > 0;

    ctx.save();
    if (flash) { ctx.globalAlpha = 0.5; }

    // Corpo
    ctx.fillStyle = isBlocking ? '#aaa' : p.color;
    ctx.fillRect(x + 8, y + 18, 16, 24);

    // Cabeça
    ctx.fillStyle = '#ffd6b0';
    ctx.beginPath();
    ctx.arc(x + P_W/2, y + 12, 10, 0, Math.PI*2);
    ctx.fill();

    // Olhos
    ctx.fillStyle = '#333';
    const ex = p.dir === 1 ? x + 20 : x + 10;
    ctx.fillRect(ex, y + 10, 3, 3);

    // Perna
    ctx.fillStyle = p.color;
    ctx.fillRect(x + 8, y + 42, 6, 10);
    ctx.fillRect(x + 18, y + 42, 6, 10);

    // Chute
    if (isKicking) {
      ctx.fillStyle = '#ffcc00';
      const kx = p.dir === 1 ? x + 24 : x - 12;
      ctx.fillRect(kx, y + 35, 18, 8);
    }

    // Escudo de bloqueio
    if (isBlocking) {
      ctx.fillStyle = 'rgba(100,180,255,0.5)';
      const sx = p.dir === 1 ? x + 20 : x - 10;
      ctx.fillRect(sx, y + 10, 10, 30);
    }

    ctx.restore();
  }

  function drawBg() {
    // Fundo
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, '#1a0a1a');
    grad.addColorStop(1, '#3a1a2a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Chão
    ctx.fillStyle = '#590d22';
    ctx.fillRect(0, GROUND, CANVAS_W, CANVAS_H - GROUND);
    ctx.fillStyle = '#e8536f';
    ctx.fillRect(0, GROUND, CANVAS_W, 3);

    // Luzes de fundo
    ctx.fillStyle = 'rgba(232,83,111,0.08)';
    ctx.beginPath(); ctx.arc(CANVAS_W/2, CANVAS_H/2, 120, 0, Math.PI*2); ctx.fill();
  }

  function updateHP() {
    const h1 = document.getElementById('hp1');
    const h2 = document.getElementById('hp2');
    if (h1) h1.style.width = (p1.hp / HP_MAX * 100) + '%';
    if (h2) h2.style.width = (p2.hp / HP_MAX * 100) + '%';
  }

  function loop(ts) {
    const dt = Math.min(ts - lastTime, 32); lastTime = ts;

    applyPhysics(p1, keys['a'],      keys['d'],          keys['w'],        keys['f'],        keys['s'],        p2, dt);
    applyPhysics(p2, keys['ArrowLeft'],keys['ArrowRight'],keys['ArrowUp'],  keys['l'],        keys['ArrowDown'],p1, dt);

    // Checa KO
    if (!roundOver) {
      if (p1.hp <= 0) { roundOver = true; roundMsg = 'Emilly venceu! 💗'; p2.wins++; roundTimer = 120; document.getElementById('wins2').textContent = p2.wins; }
      if (p2.hp <= 0) { roundOver = true; roundMsg = 'Pietro venceu! 💙'; p1.wins++; roundTimer = 120; document.getElementById('wins1').textContent = p1.wins; }
    }

    if (roundOver && roundTimer > 0) {
      roundTimer--;
      if (roundTimer === 0) {
        if (p1.wins >= 3 || p2.wins >= 3) {
          // Fim de jogo
          const winner = p1.wins >= 3 ? 'Pietro 💙' : 'Emilly 💗';
          if (animId) cancelAnimationFrame(animId);
          _showResult(body, '🥋', `${winner} é campeão!`, `Placar: Pietro ${p1.wins} × ${p2.wins} Emilly`, openTaekwondo);
          return;
        }
        resetRound();
      }
    }

    updateHP();
    drawBg();
    drawPlayer(p1, 'P1');
    drawPlayer(p2, 'P2');

    // Placar no canvas
    if (roundOver && roundMsg) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(CANVAS_W/2-100, CANVAS_H/2-24, 200, 48);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 18px "Playfair Display", serif';
      ctx.textAlign = 'center';
      ctx.fillText(roundMsg, CANVAS_W/2, CANVAS_H/2+6);
      ctx.textAlign = 'left';
    }

    animId = requestAnimationFrame(loop);
  }
  animId = requestAnimationFrame(loop);

  _activeCleanup = () => {
    if (animId) cancelAnimationFrame(animId);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keyup',   onKey);
    Object.keys(keys).forEach(k => delete keys[k]);
  };
}

/* ══════════════════════════════════════════════
   💘 QUIZ DO CASAL
══════════════════════════════════════════════ */
const QUIZ_QUESTIONS = [
  { q:'Quando Pietro e Emilly começaram a namorar?', opts:['11 de setembro','11 de outubro','11 de novembro','11 de dezembro'], correct:1 },
  { q:'Qual é a cor dos olhos da Emilly?', opts:['Azuis','Castanhos','Verdes','Pretos'], correct:2 },
  { q:'Qual é a música favorita do casal na playlist?', opts:['Skyfall','Mania de Você','Sailor Song','Home'], correct:1 },
  { q:'Em qual cidade o casal mora?', opts:['Porto Alegre','Florianópolis','Santa Maria','Caxias do Sul'], correct:2 },
  { q:'Qual é o dia do mesversário deles?', opts:['Dia 5','Dia 9','Dia 11','Dia 24'], correct:2 },
  { q:'Qual é o aniversário do Pietro?', opts:['9 de janeiro','24 de abril','11 de outubro','25 de dezembro'], correct:0 },
  { q:'Qual é o aniversário da Emilly?', opts:['9 de janeiro','24 de abril','11 de outubro','25 de dezembro'], correct:1 },
  { q:'Qual personagem Disney a Emilly mais gosta entre as opções?', opts:['Cinderela','Mulan','Ariel','Branca de Neve'], correct:2 },
  { q:'Qual música de Adele está na playlist deles?', opts:['Hello','Skyfall','Someone Like You','Rolling in the Deep'], correct:1 },
  { q:'Quantos slots de fotos tem a galeria do site?', opts:['4','6','8','10'], correct:1 },
];

function openQuiz() {
  _activeCleanup = null;
  const body = _createOverlay('💘 Quiz do Casal');
  let qi = 0, score = 0;
  const questions = [...QUIZ_QUESTIONS].sort(() => Math.random() - .5).slice(0, 7);

  function showQ() {
    if (qi >= questions.length) {
      const pct = Math.round(score / questions.length * 100);
      const emoji = pct >= 80 ? '🥰' : pct >= 50 ? '😊' : '😅';
      const msg   = pct >= 80 ? 'Vocês se conhecem de cor e salteado!' : pct >= 50 ? 'Bom! Ainda têm muito para descobrir.' : 'Que tal conversar mais? 💬';
      _showResult(body, emoji, `${score}/${questions.length} acertos (${pct}%)`, msg, openQuiz);
      return;
    }
    const q = questions[qi];
    body.innerHTML = `
      <div class="game-score-bar">
        <div class="game-score-box"><div class="game-score-label">Acertos</div><div class="game-score-num">${score}</div></div>
        <div class="game-score-box"><div class="game-score-label">Pergunta</div><div class="game-score-num">${qi+1}/${questions.length}</div></div>
      </div>
      <div class="quiz-question">
        <div class="quiz-q-num">Pergunta ${qi+1} de ${questions.length}</div>
        <div class="quiz-q-text">${q.q}</div>
        <div class="quiz-options">
          ${q.opts.map((o,i) => `<button class="quiz-opt" data-i="${i}">${o}</button>`).join('')}
        </div>
      </div>
      <div class="quiz-feedback" id="quiz-fb"></div>`;

    body.querySelectorAll('.quiz-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        body.querySelectorAll('.quiz-opt').forEach(b => b.disabled = true);
        const chosen  = Number(btn.dataset.i);
        const correct = q.correct;
        body.querySelectorAll('.quiz-opt').forEach((b, i) => {
          if (i === correct) b.classList.add('correct');
          else if (i === chosen) b.classList.add('wrong');
        });
        const fb = document.getElementById('quiz-fb');
        if (chosen === correct) { score++; if(fb) fb.textContent = '✅ Correto! 🎉'; }
        else { if(fb) fb.textContent = `❌ Era: ${q.opts[correct]}`; }
        qi++;
        setTimeout(showQ, 1400);
      });
    });
  }
  showQ();
}

/* ══════════════════════════════════════════════
   🃏 JOGO DA MEMÓRIA
══════════════════════════════════════════════ */
function openMemoria() {
  _activeCleanup = null;
  const body = _createOverlay('🃏 Jogo da Memória');
  const EMOJIS = ['💕','🌹','💙','🌸','🥰','✨','💫','🎵','🏡','📚','🌙','💎'];
  let moves = 0, matches = 0, flipped = [], locked = false, startTime = Date.now();

  const pairs = [...EMOJIS, ...EMOJIS].sort(() => Math.random() - .5);
  const cards = pairs.map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false }));

  function render() {
    body.innerHTML = `
      <div class="game-score-bar">
        <div class="game-score-box"><div class="game-score-label">Movimentos</div><div class="game-score-num" id="g-moves">${moves}</div></div>
        <div class="game-score-box"><div class="game-score-label">Pares</div><div class="game-score-num">${matches}/${EMOJIS.length}</div></div>
      </div>
      <div class="memory-grid cols-4" id="mem-grid"></div>`;

    const grid = document.getElementById('mem-grid');
    cards.forEach((c, i) => {
      const el = document.createElement('div');
      el.className = 'mem-card' + (c.flipped ? ' flipped' : '') + (c.matched ? ' matched' : '');
      el.innerHTML = `<div class="mem-card-inner"><div class="mem-front">💕</div><div class="mem-back">${c.emoji}</div></div>`;
      if (!c.matched) el.addEventListener('click', () => flip(i));
      grid.appendChild(el);
    });
  }

  function flip(i) {
    if (locked || cards[i].flipped || cards[i].matched) return;
    cards[i].flipped = true;
    flipped.push(i);
    render();
    if (flipped.length === 2) {
      locked = true; moves++;
      const [a, b] = flipped;
      if (cards[a].emoji === cards[b].emoji) {
        cards[a].matched = cards[b].matched = true;
        matches++;
        flipped = []; locked = false;
        render();
        if (matches === EMOJIS.length) {
          const secs = Math.round((Date.now() - startTime) / 1000);
          setTimeout(() => _showResult(body, '🥰', 'Parabéns!', `${moves} movimentos em ${secs}s 💕`, openMemoria), 500);
        }
      } else {
        setTimeout(() => {
          cards[a].flipped = cards[b].flipped = false;
          flipped = []; locked = false;
          render();
        }, 900);
      }
    }
  }
  render();
}

/* ══════════════════════════════════════════════
   🐍 SNAKE DO AMOR
══════════════════════════════════════════════ */
function openSnake() {
  const body = _createOverlay('🐍 Snake do Amor');
  const CELL = 15, COLS = 20, ROWS = 20;
  const W = COLS * CELL, H = ROWS * CELL;

  let snake, dir, nextDir, food, score, animId2, running;

  function reset() {
    snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
    dir = {x:1,y:0}; nextDir = {x:1,y:0};
    placeFood(); score = 0; running = true;
  }

  function placeFood() {
    do { food = {x:Math.floor(Math.random()*COLS), y:Math.floor(Math.random()*ROWS)}; }
    while (snake.some(s => s.x===food.x && s.y===food.y));
  }

  body.innerHTML = `
    <div class="game-score-bar">
      <div class="game-score-box"><div class="game-score-label">Pontos</div><div class="game-score-num" id="snake-score">0</div></div>
    </div>
    <canvas id="snake-canvas" width="${W}" height="${H}"></canvas>
    <div class="snake-dpad">
      <div></div>
      <button class="dpad-btn" id="dp-up">⬆️</button>
      <div></div>
      <button class="dpad-btn" id="dp-left">⬅️</button>
      <div class="dpad-btn dpad-center">🐍</div>
      <button class="dpad-btn" id="dp-right">➡️</button>
      <div></div>
      <button class="dpad-btn" id="dp-down">⬇️</button>
      <div></div>
    </div>`;

  const canvas = document.getElementById('snake-canvas');
  const ctx2   = canvas.getContext('2d');

  const setDir = (x,y) => { if (x !== -dir.x || y !== -dir.y) nextDir={x,y}; };
  document.getElementById('dp-up').addEventListener('click',    () => setDir(0,-1));
  document.getElementById('dp-down').addEventListener('click',  () => setDir(0,1));
  document.getElementById('dp-left').addEventListener('click',  () => setDir(-1,0));
  document.getElementById('dp-right').addEventListener('click', () => setDir(1,0));

  const onKeySnake = e => {
    if(e.key==='ArrowUp')    setDir(0,-1);
    if(e.key==='ArrowDown')  setDir(0,1);
    if(e.key==='ArrowLeft')  setDir(-1,0);
    if(e.key==='ArrowRight') setDir(1,0);
  };
  window.addEventListener('keydown', onKeySnake);

  // Swipe
  let tx=0,ty=0;
  const onTouchStart = e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY;};
  const onTouchEnd = e=>{
    const dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty;
    if(Math.abs(dx)>Math.abs(dy)) setDir(dx>0?1:-1,0);
    else setDir(0,dy>0?1:-1);
  };
  canvas.addEventListener('touchstart', onTouchStart, {passive:true});
  canvas.addEventListener('touchend', onTouchEnd, {passive:true});

  function draw() {
    ctx2.fillStyle = '#0f0f1a'; ctx2.fillRect(0,0,W,H);
    // Grade
    ctx2.strokeStyle = 'rgba(255,255,255,0.03)';
    for(let i=0;i<COLS;i++){ctx2.beginPath();ctx2.moveTo(i*CELL,0);ctx2.lineTo(i*CELL,H);ctx2.stroke();}
    for(let i=0;i<ROWS;i++){ctx2.beginPath();ctx2.moveTo(0,i*CELL);ctx2.lineTo(W,i*CELL);ctx2.stroke();}
    // Comida
    ctx2.font = `${CELL}px serif`;
    ctx2.fillText('💕', food.x*CELL, food.y*CELL+CELL-1);
    // Snake
    snake.forEach((s,i) => {
      const pct = i/snake.length;
      ctx2.fillStyle = i===0 ? '#e8536f' : `hsl(${340-pct*40},70%,${55-pct*15}%)`;
      ctx2.beginPath();
      ctx2.roundRect(s.x*CELL+1, s.y*CELL+1, CELL-2, CELL-2, 4);
      ctx2.fill();
    });
  }

  let lastSnake = 0;
  function loop2(ts) {
    if (!running) return;
    if (ts - lastSnake > 140) {
      lastSnake = ts;
      dir = {...nextDir};
      const head = {x:(snake[0].x+dir.x+COLS)%COLS, y:(snake[0].y+dir.y+ROWS)%ROWS};
      if (snake.slice(1).some(s=>s.x===head.x&&s.y===head.y)) {
        running = false;
        _showResult(body, '💔', `Game Over!`, `Você coletou ${score} corações 💕`, openSnake);
        return;
      }
      snake.unshift(head);
      if (head.x===food.x && head.y===food.y) {
        score++; placeFood();
        const sc = document.getElementById('snake-score');
        if(sc) sc.textContent = score;
      } else { snake.pop(); }
    }
    draw();
    animId2 = requestAnimationFrame(loop2);
  }

  reset(); animId2 = requestAnimationFrame(loop2);
  _activeCleanup = () => {
    running = false;
    if(animId2) cancelAnimationFrame(animId2);
    window.removeEventListener('keydown', onKeySnake);
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchend', onTouchEnd);
  };
}

/* ══════════════════════════════════════════════
   🎯 TIRO AO ALVO
══════════════════════════════════════════════ */
function openAlvo() {
  const body = _createOverlay('🎯 Tiro ao Alvo');
  const DURATION = 30;
  let score = 0, timeLeft = DURATION, animId3, running3, targets = [];
  const EMOJIS_T = ['💕','🌹','💙','🌸','✨','💫','🎵','🥰'];

  body.innerHTML = `
    <div class="game-score-bar">
      <div class="game-score-box"><div class="game-score-label">Pontos</div><div class="game-score-num" id="alvo-score">0</div></div>
      <div class="game-score-box"><div class="game-score-label">Tempo</div><div class="game-score-num game-timer" id="alvo-timer">${DURATION}</div></div>
    </div>
    <canvas id="target-canvas" width="480" height="320"></canvas>`;

  const canvas = document.getElementById('target-canvas');
  const ctx3   = canvas.getContext('2d');
  const rect   = () => canvas.getBoundingClientRect();

  function spawnTarget() {
    const r = 28 + Math.random() * 22;
    targets.push({
      x: r + Math.random() * (canvas.width  - r*2),
      y: r + Math.random() * (canvas.height - r*2),
      r, life: 1.8 + Math.random(), born: Date.now(),
      emoji: EMOJIS_T[Math.floor(Math.random()*EMOJIS_T.length)],
      pts: Math.round(30 / r * 10),
    });
  }

  function hitTest(cx, cy) {
    for (let i = targets.length - 1; i >= 0; i--) {
      const t = targets[i];
      const d = Math.hypot(cx - t.x, cy - t.y);
      if (d <= t.r) {
        targets.splice(i, 1);
        score += t.pts;
        const sc = document.getElementById('alvo-score');
        if (sc) sc.textContent = score;
        // Efeito visual
        const fx = document.createElement('div');
        fx.className = 'target-hit-fx';
        fx.textContent = `+${t.pts}`;
        const br = rect();
        fx.style.left = (br.left + t.x * br.width  / canvas.width)  + 'px';
        fx.style.top  = (br.top  + t.y * br.height / canvas.height) + 'px';
        document.body.appendChild(fx);
        setTimeout(() => fx.remove(), 700);
        return;
      }
    }
  }

  const onClick = e => {
    if (!running3) return;
    const br = rect();
    const scaleX = canvas.width  / br.width;
    const scaleY = canvas.height / br.height;
    const x = (e.clientX - br.left) * scaleX;
    const y = (e.clientY - br.top)  * scaleY;
    hitTest(x, y);
  };
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    const br = rect();
    const t  = e.changedTouches[0];
    hitTest((t.clientX - br.left) * canvas.width / br.width,
            (t.clientY - br.top)  * canvas.height / br.height);
  });

  let lastSpawn = 0, lastSecond = Date.now();

  function loop3(ts) {
    if (!running3) return;
    const now = Date.now();

    // Conta regressiva
    if (now - lastSecond >= 1000) {
      timeLeft--;
      lastSecond = now;
      const tm = document.getElementById('alvo-timer');
      if (tm) { tm.textContent = timeLeft; tm.classList.toggle('urgent', timeLeft <= 10); }
      if (timeLeft <= 0) {
        running3 = false;
        const msg = score >= 200 ? '🏆 Atirador de elite!' : score >= 100 ? '🎯 Bom tiro!' : '😅 Continue treinando!';
        _showResult(body, '🎯', `${score} pontos!`, msg, openAlvo);
        return;
      }
    }

    // Spawn
    if (now - lastSpawn > 900 && targets.length < 6) { spawnTarget(); lastSpawn = now; }

    // Remove expirados
    targets = targets.filter(t => (now - t.born) / 1000 < t.life);

    // Draw
    ctx3.fillStyle = '#0f0f1a'; ctx3.fillRect(0, 0, canvas.width, canvas.height);

    targets.forEach(t => {
      const age  = (now - t.born) / 1000;
      const life = t.life;
      const fade = age > life * 0.7 ? 1 - (age - life*0.7)/(life*0.3) : 1;

      ctx3.globalAlpha = fade;
      // Círculo externo
      ctx3.strokeStyle = '#e8536f';
      ctx3.lineWidth   = 3;
      ctx3.beginPath(); ctx3.arc(t.x, t.y, t.r, 0, Math.PI*2); ctx3.stroke();
      // Círculo interno
      ctx3.fillStyle = `rgba(232,83,111,${0.15 * fade})`;
      ctx3.fill();
      // Emoji
      ctx3.globalAlpha = fade;
      ctx3.font = `${t.r * 0.9}px serif`;
      ctx3.textAlign = 'center';
      ctx3.textBaseline = 'middle';
      ctx3.fillText(t.emoji, t.x, t.y);
      ctx3.textAlign = 'left'; ctx3.textBaseline = 'alphabetic';
    });
    ctx3.globalAlpha = 1;

    animId3 = requestAnimationFrame(loop3);
  }

  running3 = true;
  for (let i = 0; i < 3; i++) spawnTarget();
  animId3 = requestAnimationFrame(loop3);

  _activeCleanup = () => {
    running3 = false;
    if (animId3) cancelAnimationFrame(animId3);
    canvas.removeEventListener('click', onClick);
    document.querySelectorAll('.target-hit-fx').forEach(el => el.remove());
  };
}
