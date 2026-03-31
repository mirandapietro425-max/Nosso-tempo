/* ═══════════════════════════════════════════════
   PIETRO & EMILLY — games.js v40
   Arcade do Casal 🎮
   8 jogos todos em modo dupla:
   Taekwondo · Quiz · Memória · Alvo · Snake
   Corrida de Corações · Jogo da Velha · Cara a Cara
   ═══════════════════════════════════════════════ */

import { doc, getDoc, setDoc }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

let _db = null;
let _GAMES_DOC = null;

export function initGames(db) {
  _db = db;
  if (db) _GAMES_DOC = doc(db, 'games', 'shared');
  _renderGameCards();
}

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
    <div class="game-card" onclick="window._openGame('${g.id}')">
      <span class="game-badge duo">👥 Dupla</span>
      <span class="game-card-icon">${g.icon}</span>
      <div class="game-card-title">${g.title}</div>
      <div class="game-card-desc">${g.desc}</div>
    </div>`).join('');
}

window._openGame = function(id) {
  const g = CATALOG.find(x => x.id === id);
  if (g) g.fn();
};

/* ── Overlay helper ── */
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
  const ov = document.getElementById('game-overlay');
  if (!ov) return;
  ov.classList.remove('show');
  setTimeout(() => ov.remove(), 320);
};

/* BUG FIX: _showResult usa addEventListener em vez de toString() para evitar
   escaping de closures com variáveis externas */
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

/* ── CSS dos botões touch compartilhado ── */
const TOUCH_BTN_STYLE = `
  .tkd-btn {
    touch-action:none; user-select:none; -webkit-user-select:none;
    border:none; border-radius:8px; padding:10px 4px; font-size:1rem;
    cursor:pointer; color:white; min-height:42px;
    -webkit-tap-highlight-color:transparent;
    transition:opacity .1s, transform .1s;
  }
  .tkd-btn:active { opacity:.7; transform:scale(.93); }
`;

/* ══════════════════════════════════════════════
   🥋 TAEKWONDO
══════════════════════════════════════════════ */
function openTaekwondo() {
  const body = _createOverlay('🥋 Taekwondo');
  const CW=360, CH=180, GND=CH-35, PW=28, PH=44, HP_MAX=100;
  let animId=null, lastTime=0;
  const k1={left:false,right:false,jump:false,kick:false,block:false};
  const k2={left:false,right:false,jump:false,kick:false,block:false};
  const p1={x:50, y:GND-PH,vx:0,vy:0,hp:HP_MAX,dir:1, onGround:true,color:'#4a90d9',kick:0,block:0,hitFlash:0,wins:0};
  const p2={x:280,y:GND-PH,vx:0,vy:0,hp:HP_MAX,dir:-1,onGround:true,color:'#e8536f',kick:0,block:0,hitFlash:0,wins:0};
  let rOver=false, rMsg='', rTimer=0;

  body.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:rgba(0,0,0,.4);border-radius:8px;margin-bottom:6px">
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1">
        <span style="font-size:.7rem;color:#4a90d9;font-weight:700">Pietro 💙</span>
        <div style="width:100%;height:10px;background:#222;border-radius:5px;overflow:hidden"><div id="hp1" style="height:100%;width:100%;background:linear-gradient(90deg,#4a90d9,#7ab8f5);transition:width .15s"></div></div>
        <span id="wins1" style="font-size:.75rem;color:#4a90d9">🏆 0</span>
      </div>
      <div style="padding:0 10px;font-size:.8rem;font-weight:700;color:#fff">VS</div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1">
        <span style="font-size:.7rem;color:#e8536f;font-weight:700">Emilly 💗</span>
        <div style="width:100%;height:10px;background:#222;border-radius:5px;overflow:hidden"><div id="hp2" style="height:100%;width:100%;background:linear-gradient(90deg,#e8536f,#f5a0b0);transition:width .15s"></div></div>
        <span id="wins2" style="font-size:.75rem;color:#e8536f">🏆 0</span>
      </div>
    </div>
    <canvas id="tkd-canvas" width="${CW}" height="${CH}" style="width:100%;max-width:400px;display:block;margin:0 auto;border-radius:8px;touch-action:none"></canvas>
    <div style="display:flex;gap:8px;margin-top:6px">
      <div style="flex:1;background:rgba(74,144,217,.12);border:1px solid rgba(74,144,217,.3);border-radius:12px;padding:8px;user-select:none">
        <div style="text-align:center;font-size:.6rem;color:#4a90d9;font-weight:700;margin-bottom:5px">PIETRO (P1)</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px">
          <div></div><button class="tkd-btn" data-p="1" data-a="jump" style="background:#4a90d9">⬆️</button><div></div>
          <button class="tkd-btn" data-p="1" data-a="left" style="background:#2a6a9a">⬅️</button>
          <button class="tkd-btn" data-p="1" data-a="kick" style="background:#e8a020">🥋</button>
          <button class="tkd-btn" data-p="1" data-a="right" style="background:#2a6a9a">➡️</button>
          <div></div><button class="tkd-btn" data-p="1" data-a="block" style="background:#1a5a8a;grid-column:2">🛡️</button><div></div>
        </div>
      </div>
      <div style="flex:1;background:rgba(232,83,111,.12);border:1px solid rgba(232,83,111,.3);border-radius:12px;padding:8px;user-select:none">
        <div style="text-align:center;font-size:.6rem;color:#e8536f;font-weight:700;margin-bottom:5px">EMILLY (P2)</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px">
          <div></div><button class="tkd-btn" data-p="2" data-a="jump" style="background:#e8536f">⬆️</button><div></div>
          <button class="tkd-btn" data-p="2" data-a="left" style="background:#b02a50">⬅️</button>
          <button class="tkd-btn" data-p="2" data-a="kick" style="background:#e8a020">🥋</button>
          <button class="tkd-btn" data-p="2" data-a="right" style="background:#b02a50">➡️</button>
          <div></div><button class="tkd-btn" data-p="2" data-a="block" style="background:#8a1a30;grid-column:2">🛡️</button><div></div>
        </div>
      </div>
    </div>
    <style>${TOUCH_BTN_STYLE}</style>`;

  const canvas=document.getElementById('tkd-canvas'), ctx=canvas.getContext('2d');
  body.querySelectorAll('.tkd-btn[data-p][data-a]').forEach(btn=>{
    const k=btn.dataset.p==='1'?k1:k2, a=btn.dataset.a;
    btn.addEventListener('pointerdown',e=>{e.preventDefault();btn.setPointerCapture(e.pointerId);k[a]=true;});
    btn.addEventListener('pointerup',  e=>{e.preventDefault();k[a]=false;});
    btn.addEventListener('pointercancel',()=>k[a]=false);
    btn.addEventListener('pointerleave', ()=>k[a]=false);
  });
  const onKey=e=>{
    const d=e.type==='keydown';
    const m={'a':'left','d':'right','w':'jump','f':'kick','s':'block'};
    if(m[e.key.toLowerCase()]&&e.key.length===1) k1[m[e.key.toLowerCase()]]=d;
    if(e.key==='ArrowLeft')k2.left=d; if(e.key==='ArrowRight')k2.right=d;
    if(e.key==='ArrowUp')k2.jump=d; if(e.key==='l'||e.key==='L')k2.kick=d;
    if(e.key==='ArrowDown')k2.block=d;
    e.preventDefault();
  };
  window.addEventListener('keydown',onKey); window.addEventListener('keyup',onKey);

  function resetRound(){
    p1.x=50;p1.y=GND-PH;p1.vx=0;p1.vy=0;p1.hp=HP_MAX;p1.dir=1; p1.kick=0;p1.block=0;p1.hitFlash=0;p1.onGround=true;
    p2.x=280;p2.y=GND-PH;p2.vx=0;p2.vy=0;p2.hp=HP_MAX;p2.dir=-1;p2.kick=0;p2.block=0;p2.hitFlash=0;p2.onGround=true;
    rOver=false;rMsg='';
  }
  function physics(p,k,o){
    if(rOver)return;
    if(k.left){p.vx=-3;p.dir=-1;}else if(k.right){p.vx=3;p.dir=1;}else p.vx*=0.65;
    if(k.jump&&p.onGround){p.vy=-8;p.onGround=false;}
    p.vy+=0.4;p.x+=p.vx;p.y+=p.vy;
    if(p.y>=GND-PH){p.y=GND-PH;p.vy=0;p.onGround=true;}
    p.x=Math.max(4,Math.min(CW-PW-4,p.x));
    p.block=k.block?1:0;
    if(k.kick&&p.kick<=0){
      p.kick=16;
      if(Math.abs((p.x+PW/2)-(o.x+PW/2))<52){const dmg=o.block?2:12;o.hp=Math.max(0,o.hp-dmg);o.hitFlash=10;o.vx+=p.dir*3.5;}
    }
    if(p.kick>0)p.kick--;if(p.hitFlash>0)p.hitFlash--;
  }
  function drawP(p){
    ctx.save();if(p.hitFlash>0)ctx.globalAlpha=0.45;
    ctx.fillStyle=p.block?'#aaa':p.color;ctx.fillRect(p.x+7,p.y+15,14,20);
    ctx.fillStyle='#ffd6b0';ctx.beginPath();ctx.arc(p.x+PW/2,p.y+10,9,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#333';ctx.fillRect(p.dir===1?p.x+17:p.x+9,p.y+8,3,3);
    ctx.fillStyle=p.color;ctx.fillRect(p.x+7,p.y+35,5,9);ctx.fillRect(p.x+16,p.y+35,5,9);
    if(p.kick>8){ctx.fillStyle='#ffcc00';ctx.fillRect(p.dir===1?p.x+20:p.x-10,p.y+28,16,7);}
    if(p.block){ctx.fillStyle='rgba(100,180,255,.45)';ctx.fillRect(p.dir===1?p.x+18:p.x-8,p.y+8,9,28);}
    ctx.restore();
  }
  function loop(ts){
    lastTime=ts;
    physics(p1,k1,p2);physics(p2,k2,p1);
    if(!rOver){
      if(p1.hp<=0){rOver=true;rMsg='Emilly venceu! 💗';p2.wins++;rTimer=110;document.getElementById('wins2').textContent='🏆 '+p2.wins;}
      if(p2.hp<=0){rOver=true;rMsg='Pietro venceu! 💙';p1.wins++;rTimer=110;document.getElementById('wins1').textContent='🏆 '+p1.wins;}
    }
    if(rOver&&rTimer>0){rTimer--;if(rTimer===0){if(p1.wins>=3||p2.wins>=3){cancelAnimationFrame(animId);animId=null;_showResult(body,'🥋',`${p1.wins>=3?'Pietro 💙':'Emilly 💗'} é campeão!`,`Pietro ${p1.wins} × ${p2.wins} Emilly`,openTaekwondo);return;}resetRound();}}
    const h1=document.getElementById('hp1'),h2=document.getElementById('hp2');
    if(h1)h1.style.width=(p1.hp/HP_MAX*100)+'%';if(h2)h2.style.width=(p2.hp/HP_MAX*100)+'%';
    const g=ctx.createLinearGradient(0,0,0,CH);g.addColorStop(0,'#1a0a1a');g.addColorStop(1,'#3a1a2a');
    ctx.fillStyle=g;ctx.fillRect(0,0,CW,CH);ctx.fillStyle='#590d22';ctx.fillRect(0,GND,CW,CH-GND);ctx.fillStyle='#e8536f';ctx.fillRect(0,GND,CW,3);
    drawP(p1);drawP(p2);
    if(rOver&&rMsg){ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(CW/2-85,CH/2-18,170,36);ctx.fillStyle='white';ctx.font='bold 15px "Playfair Display",serif';ctx.textAlign='center';ctx.fillText(rMsg,CW/2,CH/2+5);ctx.textAlign='left';}
    animId=requestAnimationFrame(loop);
  }
  animId=requestAnimationFrame(loop);
  _activeCleanup=()=>{cancelAnimationFrame(animId);window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKey);Object.keys(k1).forEach(k=>k1[k]=false);Object.keys(k2).forEach(k=>k2[k]=false);};
}

/* ══════════════════════════════════════════════
   💘 QUIZ — turno alternado P1/P2, placar separado
══════════════════════════════════════════════ */
const QUIZ_QUESTIONS=[
  {q:'Quando Pietro e Emilly começaram a namorar?',opts:['11 de setembro','11 de outubro','11 de novembro','11 de dezembro'],correct:1},
  {q:'Qual é a cor dos olhos da Emilly?',opts:['Azuis','Castanhos','Verdes','Pretos'],correct:2},
  {q:'Qual é a música favorita do casal na playlist?',opts:['Skyfall','Mania de Você','Sailor Song','Home'],correct:1},
  {q:'Em qual cidade o casal mora?',opts:['Porto Alegre','Florianópolis','Santa Maria','Caxias do Sul'],correct:2},
  {q:'Qual é o dia do mesversário deles?',opts:['Dia 5','Dia 9','Dia 11','Dia 24'],correct:2},
  {q:'Qual é o aniversário do Pietro?',opts:['9 de janeiro','24 de abril','11 de outubro','25 de dezembro'],correct:0},
  {q:'Qual é o aniversário da Emilly?',opts:['9 de janeiro','24 de abril','11 de outubro','25 de dezembro'],correct:1},
  {q:'Qual personagem Disney a Emilly mais gosta?',opts:['Cinderela','Mulan','Ariel','Branca de Neve'],correct:2},
  {q:'Qual música de Adele está na playlist deles?',opts:['Hello','Skyfall','Someone Like You','Rolling in the Deep'],correct:1},
  {q:'Quantos slots de fotos tem a galeria do site?',opts:['4','6','8','10'],correct:1},
  {q:'Qual é a cor favorita da Emilly?',opts:['Azul','Rosa','Roxo','Verde'],correct:1},
  {q:'Qual é o signo do Pietro?',opts:['Capricórnio','Touro','Aquário','Áries'],correct:0},
  {q:'Qual é o signo da Emilly?',opts:['Touro','Gêmeos','Áries','Câncer'],correct:0},
  {q:'Qual série o casal mais assiste?',opts:['Friends','Stranger Things','Dark','Wednesday'],correct:1},
];

function openQuiz(){
  _activeCleanup=null;
  const body=_createOverlay('💘 Quiz do Casal');
  const qs=[...QUIZ_QUESTIONS].sort(()=>Math.random()-.5).slice(0,8);
  let qi=0,s1=0,s2=0,turn=0;

  function showQ(){
    if(qi>=qs.length){
      const emoji=s1===s2?'🤝':s1>s2?'💙':'💗';
      const w=s1===s2?'Empate!':s1>s2?'Pietro venceu!':'Emilly venceu!';
      _showResult(body,emoji,w,`Pietro ${s1} × ${s2} Emilly`,openQuiz);return;
    }
    const q=qs[qi],isP1=turn===0,pc=isP1?'#4a90d9':'#e8536f',pn=isP1?'💙 Pietro':'💗 Emilly';
    body.innerHTML=`
      <div class="game-score-bar">
        <div class="game-score-box" style="border:1px solid ${isP1?'#4a90d9':'transparent'}"><div class="game-score-label">Pietro 💙</div><div class="game-score-num" style="color:#4a90d9">${s1}</div></div>
        <div class="game-score-box"><div class="game-score-label">Perg. ${qi+1}/${qs.length}</div><div class="game-score-num" style="font-size:.9rem">🎯</div></div>
        <div class="game-score-box" style="border:1px solid ${!isP1?'#e8536f':'transparent'}"><div class="game-score-label">Emilly 💗</div><div class="game-score-num" style="color:#e8536f">${s2}</div></div>
      </div>
      <div style="text-align:center;font-size:.75rem;color:${pc};font-weight:700;margin:.4rem 0">Vez de ${pn}</div>
      <div class="quiz-question">
        <div class="quiz-q-text">${q.q}</div>
        <div class="quiz-options">${q.opts.map((o,i)=>`<button class="quiz-opt" data-i="${i}">${o}</button>`).join('')}</div>
      </div>
      <div class="quiz-feedback" id="quiz-fb"></div>`;
    body.querySelectorAll('.quiz-opt').forEach(btn=>{
      btn.addEventListener('click',()=>{
        body.querySelectorAll('.quiz-opt').forEach(b=>b.disabled=true);
        const chosen=Number(btn.dataset.i);
        body.querySelectorAll('.quiz-opt').forEach((b,i)=>{if(i===q.correct)b.classList.add('correct');else if(i===chosen)b.classList.add('wrong');});
        const fb=document.getElementById('quiz-fb');
        if(chosen===q.correct){if(turn===0)s1++;else s2++;if(fb)fb.textContent='✅ Correto! 🎉';}
        else{if(fb)fb.textContent=`❌ Era: ${q.opts[q.correct]}`;}
        qi++;if(qi%2===0)turn=turn===0?1:0;
        setTimeout(showQ,1400);
      });
    });
  }
  showQ();
}

/* ══════════════════════════════════════════════
   🃏 MEMÓRIA — turnos alternados, acerto = continua
══════════════════════════════════════════════ */
function openMemoria(){
  _activeCleanup=null;
  const body=_createOverlay('🃏 Memória Dupla');
  const EMOJIS=['💕','🌹','💙','🌸','🥰','✨','💫','🎵','🏡','📚','🌙','💎'];
  let turn=0,s1=0,s2=0,flipped=[],locked=false;
  const pairs=[...EMOJIS,...EMOJIS].sort(()=>Math.random()-.5);
  const cards=pairs.map((e,i)=>({id:i,emoji:e,flipped:false,matched:false,owner:null}));

  function render(){
    const pn=turn===0?'💙 Pietro':'💗 Emilly',pc=turn===0?'#4a90d9':'#e8536f';
    body.innerHTML=`
      <div class="game-score-bar">
        <div class="game-score-box" style="border:1px solid ${turn===0?'#4a90d9':'transparent'}"><div class="game-score-label">Pietro 💙</div><div class="game-score-num" style="color:#4a90d9">${s1}</div></div>
        <div class="game-score-box"><div class="game-score-label" style="font-size:.55rem">Vez de</div><div class="game-score-num" style="font-size:.8rem;color:${pc}">${pn}</div></div>
        <div class="game-score-box" style="border:1px solid ${turn===1?'#e8536f':'transparent'}"><div class="game-score-label">Emilly 💗</div><div class="game-score-num" style="color:#e8536f">${s2}</div></div>
      </div>
      <div class="memory-grid cols-4" id="mem-grid"></div>`;
    const grid=document.getElementById('mem-grid');
    cards.forEach((c,i)=>{
      const el=document.createElement('div');
      el.className='mem-card'+(c.flipped?' flipped':'')+(c.matched?' matched':'');
      if(c.matched)el.style.background=c.owner===0?'rgba(74,144,217,.3)':'rgba(232,83,111,.3)';
      el.innerHTML=`<div class="mem-card-inner"><div class="mem-front">💕</div><div class="mem-back">${c.emoji}</div></div>`;
      if(!c.matched&&!locked)el.addEventListener('click',()=>flip(i));
      grid.appendChild(el);
    });
  }

  function flip(i){
    if(locked||cards[i].flipped||cards[i].matched)return;
    cards[i].flipped=true;flipped.push(i);render();
    if(flipped.length===2){
      locked=true;const[a,b]=flipped;
      if(cards[a].emoji===cards[b].emoji){
        cards[a].matched=cards[b].matched=true;cards[a].owner=cards[b].owner=turn;
        if(turn===0)s1++;else s2++;
        flipped=[];locked=false;render();
        if(s1+s2===EMOJIS.length){const emoji=s1===s2?'🤝':s1>s2?'💙':'💗';const w=s1===s2?'Empate!':s1>s2?'Pietro venceu!':'Emilly venceu!';setTimeout(()=>_showResult(body,emoji,w,`Pietro ${s1} × ${s2} Emilly`,openMemoria),500);}
        // Acertou: continua no mesmo turno
      }else{
        setTimeout(()=>{cards[a].flipped=cards[b].flipped=false;flipped=[];locked=false;turn=turn===0?1:0;render();},900);
      }
    }
  }
  render();
}

/* ══════════════════════════════════════════════
   🐍 SNAKE DUPLA — 2 cobras, colisão mútua
══════════════════════════════════════════════ */
function openSnake(){
  const body=_createOverlay('🐍 Snake Dupla');
  const CELL=13,COLS=24,ROWS=18,W=COLS*CELL,H=ROWS*CELL;
  let s1,d1,nd1,s2,d2,nd2,food,sc1=0,sc2=0,animId2,running;

  function reset(){
    s1=[{x:5,y:9},{x:4,y:9},{x:3,y:9}];d1={x:1,y:0};nd1={x:1,y:0};
    s2=[{x:19,y:9},{x:20,y:9},{x:21,y:9}];d2={x:-1,y:0};nd2={x:-1,y:0};
    sc1=0;sc2=0;running=true;placeFood();
    const e1=document.getElementById('sc1'),e2=document.getElementById('sc2');
    if(e1)e1.textContent=0;if(e2)e2.textContent=0;
  }
  function placeFood(){do{food={x:Math.floor(Math.random()*COLS),y:Math.floor(Math.random()*ROWS)};}while([...s1,...s2].some(s=>s.x===food.x&&s.y===food.y));}
  const setD1=(x,y)=>{if(x!==(-d1.x)||y!==(-d1.y))nd1={x,y};};
  const setD2=(x,y)=>{if(x!==(-d2.x)||y!==(-d2.y))nd2={x,y};};

  body.innerHTML=`
    <div class="game-score-bar">
      <div class="game-score-box"><div class="game-score-label">Pietro 💙</div><div class="game-score-num" id="sc1" style="color:#4a90d9">0</div></div>
      <div class="game-score-box"><div class="game-score-label">Emilly 💗</div><div class="game-score-num" id="sc2" style="color:#e8536f">0</div></div>
    </div>
    <canvas id="snake-canvas" width="${W}" height="${H}" style="width:100%;max-width:340px;border-radius:10px;display:block;touch-action:none;border:2px solid rgba(255,255,255,.1)"></canvas>
    <div style="display:flex;gap:8px;margin-top:6px;width:100%">
      <div style="flex:1;background:rgba(74,144,217,.1);border:1px solid rgba(74,144,217,.3);border-radius:12px;padding:6px;text-align:center">
        <div style="font-size:.6rem;color:#4a90d9;font-weight:700;margin-bottom:4px">PIETRO (WASD)</div>
        <div style="display:grid;grid-template-columns:repeat(3,38px);gap:4px;justify-content:center">
          <div></div><button class="dpad-btn" id="p1u">⬆️</button><div></div>
          <button class="dpad-btn" id="p1l">⬅️</button><div style="display:flex;align-items:center;justify-content:center;font-size:.9rem">💙</div><button class="dpad-btn" id="p1r">➡️</button>
          <div></div><button class="dpad-btn" id="p1d">⬇️</button><div></div>
        </div>
      </div>
      <div style="flex:1;background:rgba(232,83,111,.1);border:1px solid rgba(232,83,111,.3);border-radius:12px;padding:6px;text-align:center">
        <div style="font-size:.6rem;color:#e8536f;font-weight:700;margin-bottom:4px">EMILLY (SETAS)</div>
        <div style="display:grid;grid-template-columns:repeat(3,38px);gap:4px;justify-content:center">
          <div></div><button class="dpad-btn" id="p2u">⬆️</button><div></div>
          <button class="dpad-btn" id="p2l">⬅️</button><div style="display:flex;align-items:center;justify-content:center;font-size:.9rem">💗</div><button class="dpad-btn" id="p2r">➡️</button>
          <div></div><button class="dpad-btn" id="p2d">⬇️</button><div></div>
        </div>
      </div>
    </div>`;

  // BUG FIX: pointer capture nos d-pads para multi-toque
  [['p1u',()=>setD1(0,-1)],['p1d',()=>setD1(0,1)],['p1l',()=>setD1(-1,0)],['p1r',()=>setD1(1,0)],
   ['p2u',()=>setD2(0,-1)],['p2d',()=>setD2(0,1)],['p2l',()=>setD2(-1,0)],['p2r',()=>setD2(1,0)]].forEach(([id,fn])=>{
    const el=document.getElementById(id);
    if(el)el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture(e.pointerId);fn();},{passive:false});
  });

  const canvas=document.getElementById('snake-canvas'),ctx2=canvas.getContext('2d');
  const onKeySnake=e=>{
    if(e.key==='w'||e.key==='W')setD1(0,-1);if(e.key==='s'||e.key==='S')setD1(0,1);
    if(e.key==='a'||e.key==='A')setD1(-1,0);if(e.key==='d'||e.key==='D')setD1(1,0);
    if(e.key==='ArrowUp')setD2(0,-1);if(e.key==='ArrowDown')setD2(0,1);
    if(e.key==='ArrowLeft')setD2(-1,0);if(e.key==='ArrowRight')setD2(1,0);
  };
  window.addEventListener('keydown',onKeySnake);

  let lastT=0;
  function draw(){
    ctx2.fillStyle='#0f0f1a';ctx2.fillRect(0,0,W,H);
    ctx2.strokeStyle='rgba(255,255,255,.03)';
    for(let i=0;i<COLS;i++){ctx2.beginPath();ctx2.moveTo(i*CELL,0);ctx2.lineTo(i*CELL,H);ctx2.stroke();}
    for(let i=0;i<ROWS;i++){ctx2.beginPath();ctx2.moveTo(0,i*CELL);ctx2.lineTo(W,i*CELL);ctx2.stroke();}
    ctx2.font=`${CELL}px serif`;ctx2.fillText('💕',food.x*CELL,food.y*CELL+CELL-1);
    s1.forEach((s,i)=>{ctx2.fillStyle=i===0?'#4a90d9':`hsl(210,70%,${55-i/s1.length*15}%)`;ctx2.beginPath();ctx2.roundRect(s.x*CELL+1,s.y*CELL+1,CELL-2,CELL-2,3);ctx2.fill();});
    s2.forEach((s,i)=>{ctx2.fillStyle=i===0?'#e8536f':`hsl(340,70%,${55-i/s2.length*15}%)`;ctx2.beginPath();ctx2.roundRect(s.x*CELL+1,s.y*CELL+1,CELL-2,CELL-2,3);ctx2.fill();});
  }
  function step(){
    d1={...nd1};d2={...nd2};
    const h1={x:(s1[0].x+d1.x+COLS)%COLS,y:(s1[0].y+d1.y+ROWS)%ROWS};
    const h2={x:(s2[0].x+d2.x+COLS)%COLS,y:(s2[0].y+d2.y+ROWS)%ROWS};
    const dead1=s1.slice(1).some(s=>s.x===h1.x&&s.y===h1.y)||s2.some(s=>s.x===h1.x&&s.y===h1.y);
    const dead2=s2.slice(1).some(s=>s.x===h2.x&&s.y===h2.y)||s1.some(s=>s.x===h2.x&&s.y===h2.y);
    if(dead1||dead2){running=false;const w=dead1&&dead2?'Empate 💥':dead1?'Emilly venceu 💗':'Pietro venceu 💙';_showResult(body,'🐍',w,`Pietro ${sc1} × ${sc2} Emilly`,openSnake);return;}
    s1.unshift(h1);s2.unshift(h2);
    let ate=false;
    if(h1.x===food.x&&h1.y===food.y){sc1++;ate=true;const el=document.getElementById('sc1');if(el)el.textContent=sc1;}else s1.pop();
    if(h2.x===food.x&&h2.y===food.y){sc2++;ate=true;const el=document.getElementById('sc2');if(el)el.textContent=sc2;}else s2.pop();
    if(ate)placeFood();
  }
  function loop2(ts){if(!running)return;if(ts-lastT>135){lastT=ts;step();}draw();animId2=requestAnimationFrame(loop2);}
  reset();animId2=requestAnimationFrame(loop2);
  _activeCleanup=()=>{running=false;cancelAnimationFrame(animId2);window.removeEventListener('keydown',onKeySnake);};
}

/* ══════════════════════════════════════════════
   🎯 TIRO AO ALVO — tela dividida P1/P2
      BUG FIX: multi-touch separado por área
══════════════════════════════════════════════ */
function openAlvo(){
  const body=_createOverlay('🎯 Tiro ao Alvo');
  const DUR=30;let timeLeft=DUR,animId3,running3,targets=[],s1=0,s2=0;
  const ET=['💕','🌹','💙','🌸','✨','💫','🎵','🥰'];

  body.innerHTML=`
    <div class="game-score-bar">
      <div class="game-score-box"><div class="game-score-label">Pietro 💙</div><div class="game-score-num" id="alvo-s1" style="color:#4a90d9">0</div></div>
      <div class="game-score-box"><div class="game-score-label">Tempo</div><div class="game-score-num game-timer" id="alvo-timer">${DUR}</div></div>
      <div class="game-score-box"><div class="game-score-label">Emilly 💗</div><div class="game-score-num" id="alvo-s2" style="color:#e8536f">0</div></div>
    </div>
    <div style="position:relative;width:100%;max-width:480px">
      <canvas id="target-canvas" width="480" height="300" style="width:100%;border-radius:12px;display:block;cursor:crosshair;touch-action:none;border:2px solid rgba(255,255,255,.1)"></canvas>
      <div style="position:absolute;top:4px;left:0;font-size:.6rem;color:rgba(74,144,217,.8);padding:2px 6px;pointer-events:none">💙 Pietro</div>
      <div style="position:absolute;top:4px;right:0;font-size:.6rem;color:rgba(232,83,111,.8);padding:2px 6px;pointer-events:none">Emilly 💗</div>
    </div>
    <div style="font-size:.6rem;color:rgba(255,255,255,.35);text-align:center;margin-top:3px">💙 metade esquerda · Emilly 💗 metade direita</div>`;

  const canvas=document.getElementById('target-canvas'),ctx3=canvas.getContext('2d');
  const rect=()=>canvas.getBoundingClientRect();

  function spawn(){const r=24+Math.random()*20;targets.push({x:r+Math.random()*(canvas.width-r*2),y:r+Math.random()*(canvas.height-r*2),r,life:1.8+Math.random(),born:Date.now(),emoji:ET[Math.floor(Math.random()*ET.length)],pts:Math.round(30/r*10)});}

  function hit(cx,cy,player){
    for(let i=targets.length-1;i>=0;i--){
      const t=targets[i];
      if(Math.hypot(cx-t.x,cy-t.y)<=t.r){
        targets.splice(i,1);
        if(player===1){s1+=t.pts;document.getElementById('alvo-s1').textContent=s1;}
        else{s2+=t.pts;document.getElementById('alvo-s2').textContent=s2;}
        const fx=document.createElement('div');fx.className='target-hit-fx';fx.textContent=`+${t.pts}`;
        const br=rect();fx.style.left=(br.left+t.x*br.width/canvas.width)+'px';fx.style.top=(br.top+t.y*br.height/canvas.height)+'px';
        document.body.appendChild(fx);setTimeout(()=>fx.remove(),700);return;
      }
    }
  }

  function getPlayer(clientX){return(clientX-rect().left)<rect().width/2?1:2;}

  const onClick=e=>{if(!running3)return;const br=rect();hit((e.clientX-br.left)*canvas.width/br.width,(e.clientY-br.top)*canvas.height/br.height,getPlayer(e.clientX));};
  canvas.addEventListener('click',onClick);
  const onTouch=e=>{e.preventDefault();const br=rect();Array.from(e.changedTouches).forEach(t=>{hit((t.clientX-br.left)*canvas.width/br.width,(t.clientY-br.top)*canvas.height/br.height,getPlayer(t.clientX));});};
  canvas.addEventListener('touchend',onTouch,{passive:false});

  let lastSpawn=0,lastSec=Date.now();
  function loop3(ts){
    if(!running3)return;const now=Date.now();
    if(now-lastSec>=1000){timeLeft--;lastSec=now;const tm=document.getElementById('alvo-timer');if(tm){tm.textContent=timeLeft;tm.classList.toggle('urgent',timeLeft<=10);}if(timeLeft<=0){running3=false;const emoji=s1===s2?'🤝':s1>s2?'💙':'💗';const w=s1===s2?'Empate!':s1>s2?'Pietro venceu!':'Emilly venceu!';_showResult(body,emoji,w,`Pietro ${s1} × ${s2} Emilly`,openAlvo);return;}}
    if(now-lastSpawn>750&&targets.length<7){spawn();lastSpawn=now;}
    targets=targets.filter(t=>(now-t.born)/1000<t.life);
    ctx3.fillStyle='#0f0f1a';ctx3.fillRect(0,0,canvas.width,canvas.height);
    ctx3.fillStyle='rgba(74,144,217,.04)';ctx3.fillRect(0,0,canvas.width/2,canvas.height);
    ctx3.fillStyle='rgba(232,83,111,.04)';ctx3.fillRect(canvas.width/2,0,canvas.width/2,canvas.height);
    ctx3.strokeStyle='rgba(255,255,255,.08)';ctx3.lineWidth=1;ctx3.beginPath();ctx3.moveTo(canvas.width/2,0);ctx3.lineTo(canvas.width/2,canvas.height);ctx3.stroke();
    targets.forEach(t=>{const age=(now-t.born)/1000,fade=age>t.life*.7?1-(age-t.life*.7)/(t.life*.3):1;ctx3.globalAlpha=fade;ctx3.strokeStyle='#e8536f';ctx3.lineWidth=3;ctx3.beginPath();ctx3.arc(t.x,t.y,t.r,0,Math.PI*2);ctx3.stroke();ctx3.fillStyle=`rgba(232,83,111,${.15*fade})`;ctx3.fill();ctx3.font=`${t.r*.9}px serif`;ctx3.textAlign='center';ctx3.textBaseline='middle';ctx3.fillText(t.emoji,t.x,t.y);ctx3.textAlign='left';ctx3.textBaseline='alphabetic';});ctx3.globalAlpha=1;
    animId3=requestAnimationFrame(loop3);
  }
  running3=true;for(let i=0;i<3;i++)spawn();animId3=requestAnimationFrame(loop3);
  _activeCleanup=()=>{running3=false;cancelAnimationFrame(animId3);canvas.removeEventListener('click',onClick);canvas.removeEventListener('touchend',onTouch);document.querySelectorAll('.target-hit-fx').forEach(el=>el.remove());};
}

/* ══════════════════════════════════════════════
   🏃 CORRIDA DE CORAÇÕES — novo jogo
   Cada jogador corre até o coração do outro lado
══════════════════════════════════════════════ */
function openCorrida(){
  const body=_createOverlay('🏃 Corrida de Corações');
  const CW=360,CH=160,GND=CH-30,PW=22,PH=36;
  let animId4=null,lastT4=0;
  const k1={left:false,right:false,jump:false};
  const k2={left:false,right:false,jump:false};
  let w1=0,w2=0,round=0;

  function makeP(x,color,dir,goalX){return{x,y:GND-PH,vx:0,vy:0,onGround:true,color,dir,goalX,won:false,anim:0};}
  let p1=makeP(30,'#4a90d9',1,CW-40),p2=makeP(CW-52,'#e8536f',-1,40);
  let raceOver=false,raceMsg='',raceTimer=0;

  body.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:rgba(0,0,0,.4);border-radius:8px;margin-bottom:6px">
      <div style="text-align:center;flex:1"><div style="font-size:.7rem;color:#4a90d9;font-weight:700">Pietro 💙</div><div id="cr-w1" style="font-size:.75rem;color:#4a90d9">🏆 0</div></div>
      <div style="font-size:.7rem;color:rgba(255,255,255,.5);font-weight:700" id="cr-round">Round 1</div>
      <div style="text-align:center;flex:1"><div style="font-size:.7rem;color:#e8536f;font-weight:700">Emilly 💗</div><div id="cr-w2" style="font-size:.75rem;color:#e8536f">🏆 0</div></div>
    </div>
    <canvas id="cr-canvas" width="${CW}" height="${CH}" style="width:100%;max-width:400px;display:block;margin:0 auto;border-radius:8px;touch-action:none"></canvas>
    <div style="display:flex;gap:8px;margin-top:6px">
      <div style="flex:1;background:rgba(74,144,217,.12);border:1px solid rgba(74,144,217,.3);border-radius:12px;padding:8px;user-select:none">
        <div style="text-align:center;font-size:.6rem;color:#4a90d9;font-weight:700;margin-bottom:5px">PIETRO</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px">
          <div></div><button class="tkd-btn" data-p="1" data-a="jump" style="background:#4a90d9">⬆️</button><div></div>
          <button class="tkd-btn" data-p="1" data-a="left" style="background:#2a6a9a">⬅️</button>
          <div style="background:rgba(255,255,255,.06);border-radius:8px;display:flex;align-items:center;justify-content:center">💙</div>
          <button class="tkd-btn" data-p="1" data-a="right" style="background:#2a6a9a">➡️</button>
        </div>
      </div>
      <div style="flex:1;background:rgba(232,83,111,.12);border:1px solid rgba(232,83,111,.3);border-radius:12px;padding:8px;user-select:none">
        <div style="text-align:center;font-size:.6rem;color:#e8536f;font-weight:700;margin-bottom:5px">EMILLY</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px">
          <div></div><button class="tkd-btn" data-p="2" data-a="jump" style="background:#e8536f">⬆️</button><div></div>
          <button class="tkd-btn" data-p="2" data-a="left" style="background:#b02a50">⬅️</button>
          <div style="background:rgba(255,255,255,.06);border-radius:8px;display:flex;align-items:center;justify-content:center">💗</div>
          <button class="tkd-btn" data-p="2" data-a="right" style="background:#b02a50">➡️</button>
        </div>
      </div>
    </div>
    <style>${TOUCH_BTN_STYLE}</style>`;

  const canvas=document.getElementById('cr-canvas'),ctx4=canvas.getContext('2d');
  body.querySelectorAll('.tkd-btn[data-p][data-a]').forEach(btn=>{
    const k=btn.dataset.p==='1'?k1:k2,a=btn.dataset.a;
    btn.addEventListener('pointerdown',e=>{e.preventDefault();btn.setPointerCapture(e.pointerId);k[a]=true;});
    btn.addEventListener('pointerup',e=>{e.preventDefault();k[a]=false;});
    btn.addEventListener('pointercancel',()=>k[a]=false);btn.addEventListener('pointerleave',()=>k[a]=false);
  });
  const onKey4=e=>{const d=e.type==='keydown';if(e.key==='a'||e.key==='A')k1.left=d;if(e.key==='d'||e.key==='D')k1.right=d;if(e.key==='w'||e.key==='W')k1.jump=d;if(e.key==='ArrowLeft')k2.left=d;if(e.key==='ArrowRight')k2.right=d;if(e.key==='ArrowUp')k2.jump=d;e.preventDefault();};
  window.addEventListener('keydown',onKey4);window.addEventListener('keyup',onKey4);

  function resetRace(){
    const _w1=w1,_w2=w2;
    p1=makeP(30,'#4a90d9',1,CW-40);p2=makeP(CW-52,'#e8536f',-1,40);
    w1=_w1;w2=_w2;raceOver=false;raceMsg='';
  }

  function moveRunner(r,k){
    if(raceOver||r.won)return;
    if(k.left){r.vx=-3.5;r.dir=-1;}else if(k.right){r.vx=3.5;r.dir=1;}else r.vx*=0.7;
    if(k.jump&&r.onGround){r.vy=-7.5;r.onGround=false;}
    r.vy+=0.38;r.x+=r.vx;r.y+=r.vy;
    if(r.y>=GND-PH){r.y=GND-PH;r.vy=0;r.onGround=true;}
    r.x=Math.max(2,Math.min(CW-PW-2,r.x));
    r.anim=(r.anim+Math.abs(r.vx)*.5)%6;
    if(r.dir===1&&r.x+PW>=r.goalX)r.won=true;
    if(r.dir===-1&&r.x<=r.goalX)r.won=true;
  }

  function drawRunner(r){
    ctx4.fillStyle=r.color;ctx4.fillRect(r.x+5,r.y+13,12,18);
    ctx4.fillStyle='#ffd6b0';ctx4.beginPath();ctx4.arc(r.x+PW/2,r.y+8,7,0,Math.PI*2);ctx4.fill();
    ctx4.fillStyle='#333';ctx4.fillRect(r.dir===1?r.x+13:r.x+7,r.y+6,2,2);
    const lg=Math.sin(r.anim)*4;ctx4.fillStyle=r.color;ctx4.fillRect(r.x+5,r.y+31+lg,4,7);ctx4.fillRect(r.x+13,r.y+31-lg,4,7);
  }

  function loop4(ts){
    lastT4=ts;moveRunner(p1,k1);moveRunner(p2,k2);
    if(!raceOver&&(p1.won||p2.won)){
      raceOver=true;
      if(p1.won&&!p2.won){w1++;raceMsg='Pietro chegou! 💙';}
      else if(p2.won&&!p1.won){w2++;raceMsg='Emilly chegou! 💗';}
      else{raceMsg='Empate! 🤝';}
      raceTimer=120;round++;
      document.getElementById('cr-w1').textContent='🏆 '+w1;
      document.getElementById('cr-w2').textContent='🏆 '+w2;
      document.getElementById('cr-round').textContent='Round '+round;
    }
    if(raceOver&&raceTimer>0){raceTimer--;if(raceTimer===0){if(w1>=3||w2>=3){cancelAnimationFrame(animId4);animId4=null;_showResult(body,'🏃',`${w1>=3?'Pietro 💙':'Emilly 💗'} venceu a corrida!`,`Pietro ${w1} × ${w2} Emilly`,openCorrida);return;}resetRace();}}
    const bg=ctx4.createLinearGradient(0,0,0,CH);bg.addColorStop(0,'#0a1520');bg.addColorStop(1,'#1a2a3a');
    ctx4.fillStyle=bg;ctx4.fillRect(0,0,CW,CH);
    ctx4.fillStyle='#1a3a5c';ctx4.fillRect(0,GND,CW,CH-GND);ctx4.fillStyle='#4a90d9';ctx4.fillRect(0,GND,CW,2);
    ctx4.font='18px serif';ctx4.textAlign='center';ctx4.textBaseline='middle';
    ctx4.fillText('💗',CW-40,GND-16);ctx4.fillText('💙',40,GND-16);
    ctx4.textAlign='left';ctx4.textBaseline='alphabetic';
    drawRunner(p1);drawRunner(p2);
    if(raceOver&&raceMsg){ctx4.fillStyle='rgba(0,0,0,.6)';ctx4.fillRect(CW/2-80,CH/2-16,160,32);ctx4.fillStyle='white';ctx4.font='bold 13px "Playfair Display",serif';ctx4.textAlign='center';ctx4.fillText(raceMsg,CW/2,CH/2+4);ctx4.textAlign='left';}
    animId4=requestAnimationFrame(loop4);
  }
  animId4=requestAnimationFrame(loop4);
  _activeCleanup=()=>{cancelAnimationFrame(animId4);window.removeEventListener('keydown',onKey4);window.removeEventListener('keyup',onKey4);Object.keys(k1).forEach(k=>k1[k]=false);Object.keys(k2).forEach(k=>k2[k]=false);};
}

/* ══════════════════════════════════════════════
   ❌ JOGO DA VELHA
══════════════════════════════════════════════ */
function openVelha(){
  _activeCleanup=null;
  const body=_createOverlay('❌ Jogo da Velha');
  let board=Array(9).fill(null),turn=0,s1=0,s2=0;
  const WINS=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

  function checkWin(sym){return WINS.find(w=>w.every(i=>board[i]===sym))||null;}

  function render(wl=null,isDraw=false){
    const pc=turn===0?'#4a90d9':'#e8536f',pn=turn===0?'💙 Pietro':'💗 Emilly';
    body.innerHTML=`
      <div class="game-score-bar">
        <div class="game-score-box" style="border:1px solid ${turn===0?'#4a90d9':'transparent'}"><div class="game-score-label">Pietro ❌</div><div class="game-score-num" style="color:#4a90d9">${s1}</div></div>
        <div class="game-score-box"><div class="game-score-label">Vitórias</div><div class="game-score-num" style="font-size:.8rem">🎯</div></div>
        <div class="game-score-box" style="border:1px solid ${turn===1?'#e8536f':'transparent'}"><div class="game-score-label">Emilly ⭕</div><div class="game-score-num" style="color:#e8536f">${s2}</div></div>
      </div>
      ${!wl&&!isDraw?`<div style="text-align:center;font-size:.75rem;color:${pc};font-weight:700;margin:.4rem 0">Vez de ${pn}</div>`:''}
      <div id="velha-board" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:240px;margin:0 auto"></div>
      ${wl||isDraw?`<div style="text-align:center;margin:.8rem 0"><div style="font-size:1.1rem;color:white;font-weight:700;margin-bottom:.5rem">${isDraw?'Empate! 🤝':pn+' venceu!'}</div><button class="game-restart-btn" id="velha-next">Próximo round ▶</button></div>`:''}`;
    const grid=document.getElementById('velha-board');
    board.forEach((cell,i)=>{
      const btn=document.createElement('button');
      btn.style.cssText=`width:72px;height:72px;border-radius:16px;border:2px solid rgba(255,255,255,.15);background:${cell?'rgba(255,255,255,.1)':'rgba(255,255,255,.07)'};font-size:2rem;cursor:${cell||wl||isDraw?'default':'pointer'};color:${cell==='X'?'#4a90d9':'#e8536f'};transition:background .15s;`;
      if(wl&&wl.includes(i))btn.style.background='rgba(255,255,255,.25)';
      btn.textContent=cell||'';
      if(!cell&&!wl&&!isDraw)btn.addEventListener('click',()=>play(i));
      grid.appendChild(btn);
    });
    document.getElementById('velha-next')?.addEventListener('click',()=>{board=Array(9).fill(null);turn=turn===0?1:0;render();});
  }

  function play(i){
    if(board[i])return;
    board[i]=turn===0?'X':'O';
    const wl=checkWin(board[i]),isDraw=!wl&&board.every(c=>c!==null);
    if(wl){if(turn===0)s1++;else s2++;}
    render(wl||null,isDraw);
  }
  render();
}

/* ══════════════════════════════════════════════
   🤔 CARA A CARA
   Cada jogador escolhe um personagem; outro tenta
   adivinhar fazendo perguntas de sim/não
══════════════════════════════════════════════ */
const CHARS=[
  {name:'Elsa ❄️',   f:true, princess:true,  magic:true,  blonde:true},
  {name:'Moana 🌊',  f:true, princess:true,  magic:false, blonde:false},
  {name:'Rapunzel 🌸',f:true, princess:true,  magic:true,  blonde:true},
  {name:'Mulan 🗡️',  f:true, princess:false, magic:false, blonde:false},
  {name:'Ariel 🧜',  f:true, princess:true,  magic:false, blonde:false},
  {name:'Simba 🦁',  f:false,princess:false, magic:false, blonde:false},
  {name:'Aladdin 🧞',f:false,princess:false, magic:true,  blonde:false},
  {name:'Hércules 💪',f:false,princess:false, magic:false, blonde:true},
  {name:'Tarzan 🌿', f:false,princess:false, magic:false, blonde:false},
  {name:'Bella 📚',  f:true, princess:true,  magic:false, blonde:false},
  {name:'Cinderela 👠',f:true,princess:true, magic:true,  blonde:false},
  {name:'Pocahontas 🌿',f:true,princess:false,magic:false,blonde:false},
];
const CARAQS=[
  {q:'É uma personagem feminina?',  key:'f'},
  {q:'É uma princesa Disney?',      key:'princess'},
  {q:'Tem poderes mágicos?',        key:'magic'},
  {q:'Tem cabelo loiro?',           key:'blonde'},
  {q:'É um animal ou criatura?',    key:null},
  {q:'Vive em região tropical?',    key:null},
  {q:'Tem um par romântico?',       key:null},
  {q:'Aparece em musical?',         key:null},
  {q:'Já foi villã ou rival?',      key:null},
  {q:'Tem família presente na história?', key:null},
];

function openCaraACara(){
  _activeCleanup=null;
  const body=_createOverlay('🤔 Cara a Cara');
  let c1=null,c2=null,phase='choose1',turn=0,log=[];

  function choosePhase(pNum){
    const pn=pNum===1?'💙 Pietro':'💗 Emilly',pc=pNum===1?'#4a90d9':'#e8536f';
    body.innerHTML=`
      <div style="text-align:center;padding:.4rem">
        <div style="font-size:.8rem;color:${pc};font-weight:700;margin-bottom:.3rem">${pn}, escolha um personagem em segredo!</div>
        <div style="font-size:.6rem;color:rgba(255,255,255,.4);margin-bottom:.7rem">O outro não pode olhar 👀</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:300px;margin:0 auto">
          ${CHARS.map((c,i)=>`<button class="game-restart-btn" data-ci="${i}" style="padding:.45rem .3rem;font-size:.78rem">${c.name}</button>`).join('')}
        </div>
      </div>`;
    body.querySelectorAll('[data-ci]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        if(pNum===1){c1=CHARS[Number(btn.dataset.ci)];phase='choose2';choosePhase(2);}
        else{c2=CHARS[Number(btn.dataset.ci)];phase='play';playPhase();}
      });
    });
  }

  function playPhase(){
    const pn=turn===0?'💙 Pietro':'💗 Emilly',pc=turn===0?'#4a90d9':'#e8536f';
    const opp=turn===0?c2:c1; // o personagem que ele está tentando adivinhar
    body.innerHTML=`
      <div style="text-align:center;font-size:.7rem;color:${pc};font-weight:700;margin-bottom:.4rem">Vez de ${pn} perguntar</div>
      <div style="background:rgba(255,255,255,.08);border-radius:10px;padding:7px;margin-bottom:.5rem;max-height:80px;overflow-y:auto;font-size:.68rem">
        ${log.length?log.map(l=>`<div style="color:rgba(255,255,255,.7);margin-bottom:2px">${l}</div>`).join(''):'<div style="color:rgba(255,255,255,.3);text-align:center">Nenhuma pergunta ainda</div>'}
      </div>
      <div style="display:flex;flex-direction:column;gap:5px">
        ${CARAQS.map((q,i)=>`<button class="quiz-opt" data-qi="${i}" style="font-size:.78rem;padding:.45rem .7rem;text-align:left">${q.q}</button>`).join('')}
      </div>
      <button class="game-restart-btn" id="cara-guess" style="margin-top:.7rem;width:100%;background:linear-gradient(135deg,#e8536f,#590d22)">🎯 Tentar adivinhar!</button>`;

    body.querySelectorAll('[data-qi]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const qi=Number(btn.dataset.qi),q=CARAQS[qi];
        // Resposta baseada no trait se existir, senão aleatório 50/50
        const ans=q.key?opp[q.key]:(Math.random()>.5);
        log.push(`${pn}: "${q.q}" → ${ans?'✅ Sim':'❌ Não'}`);
        turn=turn===0?1:0; playPhase();
      });
    });
    document.getElementById('cara-guess')?.addEventListener('click',()=>guessPhase());
  }

  function guessPhase(){
    const pn=turn===0?'💙 Pietro':'💗 Emilly',correct=turn===0?c2:c1;
    body.innerHTML=`
      <div style="text-align:center;font-size:.75rem;color:rgba(255,255,255,.8);font-weight:700;margin-bottom:.5rem">${pn}, qual é o personagem do outro?</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:300px;margin:0 auto">
        ${CHARS.map((c,i)=>`<button class="game-restart-btn" data-ci="${i}" style="padding:.45rem .3rem;font-size:.78rem">${c.name}</button>`).join('')}
      </div>`;
    body.querySelectorAll('[data-ci]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const chosen=CHARS[Number(btn.dataset.ci)],right=chosen.name===correct.name;
        _showResult(body,right?'🎉':'💔',right?(turn===0?'Pietro acertou! 💙':'Emilly acertou! 💗'):'Errou! 😅',`Era ${correct.name}`,openCaraACara);
      });
    });
  }

  choosePhase(1);
}
