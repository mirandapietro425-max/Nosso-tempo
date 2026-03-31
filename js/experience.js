/* ═══════════════════════════════════════════════════════════════
   PIETRO & EMILLY — experience.js
   Sistema de Experiências:
     · Modo Dinâmico Manhã/Tarde/Noite
     · Partículas Adaptativas
     · Easter Eggs por evento
     · Mini-jogos temáticos
     · Mensagens Românticas Dinâmicas
   ═══════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════
   1. SISTEMA DE PERÍODO DO DIA
   ════════════════════════════════════════════════════════ */

const PERIODS = {
  madrugada: {
    id: 'madrugada',
    range: [0, 5],
    label: 'Madrugada',
    bg: 'radial-gradient(ellipse at 50% 60%, #0d0d2b 0%, #1a0533 55%, #0d0a1a 100%)',
    accent: '#7c5cbf',
    particles: ['⭐', '✨', '💫', '🌙', '💜'],
    particleColor: 'rgba(180,140,255,',
    greeting: '🌙 Que madrugada especial, meu amor',
    cssClass: 'period-madrugada',
  },
  manha: {
    id: 'manha',
    range: [6, 11],
    label: 'Manhã',
    bg: 'radial-gradient(ellipse at 50% 40%, #fff8e7 0%, #ffe0e8 50%, #fce4ec 100%)',
    accent: '#f4879c',
    particles: ['🌸', '✨', '🌺', '💕', '🌷'],
    particleColor: 'rgba(244,135,156,',
    greeting: '☀️ Bom dia, minha princesa',
    cssClass: 'period-manha',
  },
  tarde: {
    id: 'tarde',
    range: [12, 17],
    label: 'Tarde',
    bg: 'radial-gradient(ellipse at 50% 60%, #fff3e0 0%, #ffe0e8 45%, #fce4ec 100%)',
    accent: '#e8536f',
    particles: ['💕', '🌹', '💗', '🌸', '❤️'],
    particleColor: 'rgba(232,83,111,',
    greeting: '🌤 Boa tarde, meu bem',
    cssClass: 'period-tarde',
  },
  noite: {
    id: 'noite',
    range: [18, 23],
    label: 'Noite',
    bg: 'radial-gradient(ellipse at 50% 60%, #1a0533 0%, #2d0a4e 45%, #0d0d2b 100%)',
    accent: '#c44dff',
    particles: ['⭐', '💜', '🌟', '💫', '✨'],
    particleColor: 'rgba(196,77,255,',
    greeting: '🌙 Boa noite, meu amor',
    cssClass: 'period-noite',
  },
};

export function getCurrentPeriod() {
  const h = new Date().getHours();
  for (const [, p] of Object.entries(PERIODS)) {
    if (h >= p.range[0] && h <= p.range[1]) return p;
  }
  return PERIODS.tarde;
}

let _activePeriodId = null;

export function initDynamicMode(activeEventId = null) {
  // Não aplica modo dinâmico se há evento ativo (evento tem prioridade visual)
  if (activeEventId) return;

  const period = getCurrentPeriod();
  if (_activePeriodId === period.id) return;
  _activePeriodId = period.id;

  // Remove classes antigas
  Object.values(PERIODS).forEach(p => document.body.classList.remove(p.cssClass));
  document.body.classList.add(period.cssClass);

  // Aplica background no hero
  const style = document.getElementById('pe-period-style') || (() => {
    const s = document.createElement('style');
    s.id = 'pe-period-style';
    document.head.appendChild(s);
    return s;
  })();

  const isDark = period.id === 'noite' || period.id === 'madrugada';

  style.textContent = `
    .period-${period.id} .hero {
      background: ${period.bg} !important;
      transition: background 2s ease;
    }
    .period-${period.id} .hero-title,
    .period-${period.id} .hero-subtitle,
    .period-${period.id} .counter-num,
    .period-${period.id} .counter-label {
      color: ${isDark ? '#fff' : 'inherit'} !important;
      transition: color 1s ease;
    }
    .period-${period.id} .greeting-pill {
      color: ${isDark ? '#d4aaff' : period.accent};
      border-color: ${isDark ? 'rgba(212,170,255,0.3)' : 'rgba(232,83,111,0.25)'};
      background: ${isDark ? 'rgba(124,92,191,0.15)' : ''};
    }
    .period-${period.id} .hero-ampersand { color: ${isDark ? '#c4a0ff' : '#c9a96e'}; }
  `;

  // Atualiza saudação
  const greetEl = document.getElementById('greeting');
  if (greetEl) {
    greetEl.style.opacity = '0';
    greetEl.style.transition = 'opacity 0.6s ease';
    setTimeout(() => {
      greetEl.textContent = period.greeting;
      greetEl.style.opacity = '1';
    }, 600);
  }

  // Reagenda para a próxima mudança de hora
  const now = new Date();
  const msToNextHour = (60 - now.getMinutes()) * 60000 - now.getSeconds() * 1000;
  setTimeout(() => initDynamicMode(activeEventId), msToNextHour + 1000);
}


/* ════════════════════════════════════════════════════════
   2. SISTEMA DE PARTÍCULAS ADAPTATIVO
   ════════════════════════════════════════════════════════ */

let _particleInterval = null;
let _particleConfig = null;

const EVENT_PARTICLES = {
  natal: {
    elements: ['❄️', '🎄', '⛄', '✨', '🎁', '❤️', '⭐'],
    rate: 600,
    size: [14, 22],
    speed: [6, 10],
    canvas: { color: 'rgba(200,230,255,', shape: 'snowflake' },
  },
  'vespera-natal': {
    elements: ['❄️', '🎄', '⛄', '✨', '🎁', '❤️', '⭐'],
    rate: 600,
    size: [14, 22],
    speed: [6, 10],
    canvas: { color: 'rgba(200,230,255,', shape: 'snowflake' },
  },
  'namorados': {
    elements: ['💕', '❤️', '💗', '💝', '🌹', '💌', '✨'],
    rate: 400,
    size: [12, 24],
    speed: [5, 9],
    canvas: { color: 'rgba(232,83,111,', shape: 'heart' },
  },
  pascoa: {
    elements: ['🌸', '🥚', '🐣', '🌷', '✝️', '🕊️', '🌺'],
    rate: 700,
    size: [12, 20],
    speed: [7, 12],
    canvas: { color: 'rgba(244,135,156,', shape: 'heart' },
  },
  carnaval: {
    elements: ['🎊', '🎉', '🎭', '🎶', '✨', '🌈', '💃'],
    rate: 300,
    size: [14, 22],
    speed: [4, 8],
    canvas: { color: 'rgba(255,200,0,', shape: 'star' },
  },
  'sao-joao': {
    elements: ['🌽', '🎆', '🔥', '🎶', '⭐', '💛', '🎠'],
    rate: 600,
    size: [14, 22],
    speed: [5, 10],
    canvas: { color: 'rgba(255,165,0,', shape: 'star' },
  },
  halloween: {
    elements: ['🎃', '👻', '🕸️', '🦇', '⭐', '🌙', '🖤'],
    rate: 700,
    size: [14, 22],
    speed: [6, 11],
    canvas: { color: 'rgba(180,60,200,', shape: 'star' },
  },
  mesversario: {
    elements: ['💕', '🥂', '🌹', '💍', '✨', '🌸', '💌'],
    rate: 500,
    size: [12, 22],
    speed: [5, 9],
    canvas: { color: 'rgba(232,83,111,', shape: 'heart' },
  },
  'aniv-pietro': {
    elements: ['🎂', '🎈', '🎁', '🎊', '💙', '⭐', '✨'],
    rate: 350,
    size: [14, 24],
    speed: [4, 8],
    canvas: { color: 'rgba(74,144,217,', shape: 'star' },
  },
  'aniv-emilly': {
    elements: ['🎂', '🎀', '🎁', '🎊', '💗', '🌸', '✨'],
    rate: 350,
    size: [14, 24],
    speed: [4, 8],
    canvas: { color: 'rgba(232,83,111,', shape: 'star' },
  },
};

const PERIOD_PARTICLES = {
  madrugada: { elements: ['⭐', '✨', '💫', '🌙', '💜'], rate: 1000, size: [10, 18], speed: [8, 14] },
  manha:     { elements: ['🌸', '✨', '🌺', '💕', '🌷'], rate: 900, size: [10, 18], speed: [6, 12] },
  tarde:     { elements: ['💕', '🌹', '💗', '🌸', '❤️'], rate: 800, size: [10, 20], speed: [5, 10] },
  noite:     { elements: ['⭐', '💜', '🌟', '💫', '✨'], rate: 1000, size: [10, 18], speed: [7, 13] },
};

export function initAdaptiveParticles(activeEventId = null) {
  // Para o sistema anterior
  if (_particleInterval) clearInterval(_particleInterval);

  const config = activeEventId && EVENT_PARTICLES[activeEventId]
    ? EVENT_PARTICLES[activeEventId]
    : PERIOD_PARTICLES[getCurrentPeriod().id] || PERIOD_PARTICLES.tarde;

  _particleConfig = config;

  // Spawn inicial
  for (let i = 0; i < 10; i++) setTimeout(() => _spawnParticle(config), i * 200);

  // Spawn contínuo
  _particleInterval = setInterval(() => { if (!document.hidden) _spawnParticle(config); }, config.rate);

  // Atualiza canvas de corações/flocos
  _updateCanvasStyle(activeEventId);
}

function _spawnParticle(config) {
  const el = document.createElement('div');
  const emoji = config.elements[Math.floor(Math.random() * config.elements.length)];
  const size = config.size[0] + Math.random() * (config.size[1] - config.size[0]);
  const speed = config.speed[0] + Math.random() * (config.speed[1] - config.speed[0]);
  const drift = (Math.random() - 0.5) * 60;

  el.textContent = emoji;
  el.style.cssText = `
    position:fixed;
    left:${Math.random() * 100}vw;
    top:-60px;
    font-size:${size}px;
    z-index:1;
    pointer-events:none;
    opacity:${0.5 + Math.random() * 0.5};
    animation: petalFall ${speed}s linear forwards;
    filter: drop-shadow(0 0 6px rgba(255,255,255,0.3));
  `;
  // Drift horizontal via CSS custom property não disponível em keyframe,
  // então usamos uma animação inline
  el.style.setProperty('--drift', `${drift}px`);
  document.body.appendChild(el);
  setTimeout(() => el.remove(), speed * 1000 + 500);
}

function _updateCanvasStyle(eventId) {
  // O canvas já existe em ui.js — aqui apenas sinaliza qual cor usar
  // via data attribute, que o canvas loop lê
  const canvas = document.getElementById('particles');
  if (canvas) {
    canvas.dataset.eventId = eventId || '';
    canvas.dataset.periodId = getCurrentPeriod().id;
  }
}


/* ════════════════════════════════════════════════════════
   3. EASTER EGGS SYSTEM
   ════════════════════════════════════════════════════════ */

const EASTER_EGGS = {
  default: [
    {
      selector: '.hero-ampersand',
      message: '💕 Você encontrou nosso segredinho! O "&" representa a união entre nós — duas almas que se encontraram. Pietro te ama infinitamente, Emilly. 🌹',
      animation: 'heartburst',
    },
    {
      selector: '.footer-heart',
      message: '❤️ Esse coração pulsa por você, Emilly. Cada batimento é um "eu te amo" que o Pietro nunca cansa de sentir. Você é o lar dele. 🏡',
      animation: 'glow',
    },
    {
      selector: '.section-label',
      nthChild: 3,
      message: '✨ Você está explorando nosso cantinho especial! O Pietro adoraria saber que você descobriu esse segredo. Te amo, meu amor! 💌',
      animation: 'sparkle',
    },
    {
      selector: '.hero-subtitle',
      message: '🌟 "Uma história de amor que cresce a cada segundo" — não é só uma frase bonita. É a mais pura verdade. Cada segundo contigo vale uma eternidade. 💕',
      animation: 'float',
    },
    {
      selector: '.anniv-card',
      longPress: true,
      message: '🥂 Pressão longa detectada! Curiosidade: o Pietro passa os dias contando os segundos até o próximo mesversário, só para ter mais um motivo de te dizer o quanto te ama. 💕',
      animation: 'pulse',
    },
  ],
  natal: [
    {
      selector: '.letter-card',
      message: '🎄 Natal é sobre amor, e o maior presente que o Pietro já recebeu foi você, Emilly. Que cada Natal seja ao seu lado, repleto de carinho e cumplicidade. ❄️',
      animation: 'snowfall',
    },
    {
      selector: '.hero-title',
      tripleClick: true,
      message: '⭐ Você descobriu o segredo de Natal! "A estrela no topo da árvore sempre me lembra dos seus olhos, Emilly. Brilhantes, lindos e cheios de vida." — Pietro 🌟',
      animation: 'starburst',
    },
  ],
  'vespera-natal': [
    {
      selector: '.letter-card',
      message: '🎄 A véspera de Natal chegou! Esta noite é mágica — e mais mágica ainda por poder vivê-la ao teu lado. Feliz Natal, Emilly! ❄️',
      animation: 'snowfall',
    },
    {
      selector: '.hero-title',
      tripleClick: true,
      message: '⭐ Segredo da véspera: o Pietro já está ansioso pelo Natal amanhã, mas a melhor parte não é o presente — é acordar do seu lado. 🎁',
      animation: 'starburst',
    },
  ],
  pascoa: [
    {
      selector: '.timeline',
      message: '✝️ Na Páscoa, celebramos renovação e esperança. Nossa história também tem isso: depois de uma pausa, voltamos mais fortes e apaixonados do que nunca. Ressurreição do amor. 🕊️',
      animation: 'bloom',
    },
    {
      selector: '.dream-item',
      nthChild: 1,
      message: '🌷 Encontraste o ovo de Páscoa! "Assim como a primavera que floresce após o inverno, nosso amor renova-se todos os dias com nova vida e beleza." — Pietro 🥚',
      animation: 'bloom',
    },
  ],
  'namorados': [
    {
      selector: '.letter-card',
      message: '💌 No Dia dos Namorados, cada palavra desta carta foi escrita com o coração cheio. "Se eu pudesse reescrever o tempo, te escolheria em cada versão da minha vida." — Pietro 💕',
      animation: 'heartrain',
    },
    {
      selector: '.music-featured',
      message: '🎵 A música tocando agora foi escolhida especialmente para você, Emilly. Cada nota é um sussurro de amor que o Pietro te dedica. 🌹',
      animation: 'musical',
    },
  ],
  'sao-joao': [
    {
      selector: '.anniv-card',
      message: '🎆 Arraste! Você encontrou o segredo junino! "Nossas vidas são como as fogueiras de São João — iluminam tudo ao redor e aquecem a alma." — Pietro 🌽',
      animation: 'firework',
    },
  ],
  halloween: [
    {
      selector: '.mural-lock-card',
      message: '👻 Boo! Você descobriu o segredo do Halloween! "A única coisa assustadora na minha vida seria um mundo sem você, Emilly. Feliz Halloween, meu amor." 🎃',
      animation: 'spooky',
    },
  ],
  carnaval: [
    {
      selector: '.mood-card',
      message: '🎊 Encontraste o confete! No Carnaval, a alegria é coletiva. Mas a minha alegria mais verdadeira é reservada só para você, Emilly. Feliz Carnaval! 🎭',
      animation: 'confetti',
    },
  ],
  'aniv-pietro': [
    {
      selector: '.letter-card',
      message: '🎂 No seu aniversário, Pietro, a Emilly separou um segredo especial aqui. Que este dia seja tão incrível quanto você é. Feliz aniversário, meu amor! 💙',
      animation: 'heartburst',
    },
    {
      selector: '.hero-title',
      tripleClick: true,
      message: '🎈 Segredo de aniversário desbloqueado! \"Cada ano que passa só aumenta a certeza de que você é a pessoa certa. Parabéns, Pietro — você merece todo o amor do mundo.\" — Emilly 💙',
      animation: 'starburst',
    },
  ],
  'aniv-emilly': [
    {
      selector: '.letter-card',
      message: '🎀 Hoje é o seu dia, Emilly! O Pietro escondeu um segredo aqui só para você. Você é a pessoa mais especial que ele já encontrou. Feliz aniversário, minha princesa! 💗',
      animation: 'heartburst',
    },
    {
      selector: '.hero-title',
      tripleClick: true,
      message: '🎈 Segredo de aniversário desbloqueado! \"Você chegou ao mundo em 24 de abril e desde então o Pietro acredita que existem dias abençoados. Feliz aniversário, minha vida!\" — Pietro 💗',
      animation: 'starburst',
    },
  ],
};

let _easterEggCount = 0;
const _discoveredEggs = new Set();

let _easterEggsInited = false;
export function initEasterEggs(activeEventId = null) {
  if (_easterEggsInited) return; // EXP-4: evita duplicar listeners
  _easterEggsInited = true;
  const eggs = [
    ...(EASTER_EGGS.default || []),
    ...(activeEventId && EASTER_EGGS[activeEventId] ? EASTER_EGGS[activeEventId] : []),
  ];

  eggs.forEach((egg, i) => {
    const elements = document.querySelectorAll(egg.selector);
    if (!elements.length) return;

    const target = egg.nthChild
      ? elements[egg.nthChild - 1]
      : elements[Math.floor(Math.random() * elements.length)];

    if (!target) return;

    // Marca visual sutil (cursor especial)
    target.style.cursor = egg.longPress || egg.tripleClick ? 'help' : 'pointer';
    target.dataset.eggId = i;

    if (egg.longPress) {
      let pressTimer;
      target.addEventListener('mousedown', () => {
        pressTimer = setTimeout(() => _triggerEgg(i, egg, target), 800);
      });
      target.addEventListener('mouseup', () => clearTimeout(pressTimer));
      target.addEventListener('touchstart', () => {
        pressTimer = setTimeout(() => _triggerEgg(i, egg, target), 800);
      }, { passive: true });
      target.addEventListener('touchend', () => clearTimeout(pressTimer));
    } else if (egg.tripleClick) {
      let clickCount = 0, clickTimer;
      target.addEventListener('click', () => {
        clickCount++;
        clearTimeout(clickTimer);
        clickTimer = setTimeout(() => { clickCount = 0; }, 600);
        if (clickCount >= 3) _triggerEgg(i, egg, target);
      });
    } else {
      target.addEventListener('click', (e) => {
        // Só dispara se o clique foi direto (não em botões filhos)
        if (e.target === target || target.contains(e.target)) {
          _triggerEgg(i, egg, target);
        }
      });
    }
  });
}

function _triggerEgg(id, egg, target) {
  if (_discoveredEggs.has(id)) return;
  _discoveredEggs.add(id);
  _easterEggCount++;

  // Visual burst no elemento
  _doEggAnimation(egg.animation, target);

  // Popup da mensagem
  setTimeout(() => _showEggPopup(egg.message, _easterEggCount), 400);
}

function _doEggAnimation(type, el) {
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const burstEmojis = {
    heartburst: ['💕', '❤️', '💗', '💖', '💝'],
    snowfall:   ['❄️', '⭐', '✨', '❄️', '⭐'],
    bloom:      ['🌸', '🌺', '🌷', '🌼', '🌻'],
    heartrain:  ['💌', '💕', '❤️', '💗', '💖'],
    confetti:   ['🎊', '🎉', '✨', '🌈', '💫'],
    starburst:  ['⭐', '✨', '💫', '🌟', '⭐'],
    firework:   ['🎆', '🎇', '✨', '💫', '⭐'],
    sparkle:    ['✨', '💫', '⭐', '🌟', '💕'],
    default:    ['💕', '✨', '💫', '❤️', '🌸'],
  };

  const emojis = burstEmojis[type] || burstEmojis.default;

  for (let i = 0; i < 12; i++) {
    const particle = document.createElement('div');
    particle.textContent = emojis[i % emojis.length];
    const angle = (i / 12) * Math.PI * 2;
    const dist = 60 + Math.random() * 80;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    particle.style.cssText = `
      position:fixed;
      left:${cx}px; top:${cy}px;
      font-size:${16 + Math.random() * 12}px;
      pointer-events:none;
      z-index:99990;
      transition: transform 0.8s cubic-bezier(.17,.67,.42,1.2), opacity 0.8s ease;
    `;
    document.body.appendChild(particle);
    requestAnimationFrame(() => {
      particle.style.transform = `translate(${dx}px, ${dy}px) scale(1.5)`;
      particle.style.opacity = '0';
    });
    setTimeout(() => particle.remove(), 900);
  }

  // Ring flash no elemento
  el.style.transition = 'box-shadow 0.3s ease, transform 0.3s ease';
  el.style.boxShadow = '0 0 0 4px rgba(232,83,111,0.5), 0 0 30px rgba(232,83,111,0.3)';
  el.style.transform = 'scale(1.03)';
  setTimeout(() => {
    el.style.boxShadow = '';
    el.style.transform = '';
  }, 600);
}

function _showEggPopup(message, count) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed; inset:0;
    background:rgba(89,13,34,0.6);
    backdrop-filter:blur(8px);
    z-index:99999;
    display:flex; align-items:center; justify-content:center;
    padding:1.5rem;
    animation:fadeIn 0.3s ease;
  `;

  const medal = count === 1 ? '🥇' : count === 2 ? '🥈' : count >= 3 ? '🏆' : '💌';

  overlay.innerHTML = `
    <div style="
      background:linear-gradient(145deg,#fff8f9,#fff0f3);
      border-radius:28px; padding:2rem 1.8rem;
      max-width:400px; width:100%;
      text-align:center;
      box-shadow:0 40px 100px rgba(89,13,34,0.4);
      animation:popIn 0.4s cubic-bezier(.32,1.2,.5,1);
      position:relative;
    ">
      <div style="font-size:2.2rem;margin-bottom:0.5rem;">${medal}</div>
      <div style="
        font-family:'Playfair Display',serif;
        font-size:0.75rem; letter-spacing:0.2em;
        text-transform:uppercase; color:#b06070;
        margin-bottom:0.8rem;
      ">✨ Segredo descoberto! (${count}/${_totalEggCount()}) ✨</div>
      <p style="
        font-family:'Cormorant Garamond',serif;
        font-style:italic; font-size:1.1rem;
        color:#590d22; line-height:1.8;
        margin-bottom:1.5rem;
      ">${message}</p>
      <button style="
        background:linear-gradient(135deg,#e8536f,#c44dff);
        color:white; border:none;
        padding:0.7rem 1.8rem;
        border-radius:50px;
        font-family:'DM Sans',sans-serif;
        font-size:0.9rem; font-weight:600;
        cursor:pointer;
        box-shadow:0 4px 20px rgba(232,83,111,0.4);
      ">Que lindo! 💕</button>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('button').addEventListener('click', () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';
    setTimeout(() => overlay.remove(), 300);
  });
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s ease';
      setTimeout(() => overlay.remove(), 300);
    }
  });
}

function _totalEggCount() {
  // Retorna uma estimativa do total de eggs disponíveis
  return Math.max(5, EASTER_EGGS.default.length + 2);
}


/* ════════════════════════════════════════════════════════
   4. MENSAGENS ROMÂNTICAS DINÂMICAS
   ════════════════════════════════════════════════════════ */

const ROMANTIC_MESSAGES = {
  default: [
    { text: 'Você sabia que o Pietro pensa em você exatamente agora? 💕', from: 'Pietro' },
    { text: 'Cada vez que você abre este site, meu coração sente que você veio me visitar. 🌹', from: 'Pietro' },
    { text: 'Os seus olhos verdes são a coisa mais bonita que eu já vi. 💚', from: 'Pietro' },
    { text: 'Você faz até os dias mais cinzas parecerem coloridos. ✨', from: 'Pietro' },
    { text: 'Obrigado por existir e por deixar eu te amar. 💌', from: 'Pietro' },
    { text: 'Sua risada é o som mais bonito que existe. 🎵', from: 'Pietro' },
    { text: 'Estou tão orgulhoso de ser o namorado da mulher mais linda do mundo. 💕', from: 'Pietro' },
    { text: 'Quando estou com você, o tempo para. Quando não estou, o tempo corre demais. 🕰️', from: 'Pietro' },
  ],
  natal: [
    { text: 'Neste Natal, meu maior desejo foi realizado: ter você do meu lado. 🎄', from: 'Pietro' },
    { text: 'Cada estrela da nossa árvore de Natal brilha por amor a você. ⭐', from: 'Pietro' },
    { text: 'Feliz Natal, meu amor! Você é o melhor presente que a vida já me deu. 🎁', from: 'Pietro' },
  ],
  'vespera-natal': [
    { text: 'A véspera chegou! Esta noite é mágica — e você a torna ainda mais especial. 🎄', from: 'Pietro' },
    { text: 'Amanhã é Natal, mas já me sinto o homem mais presenteado do mundo por te ter. ⭐', from: 'Pietro' },
    { text: 'Feliz véspera, meu amor! O melhor presente debaixo da árvore é o seu sorriso. 🎁', from: 'Pietro' },
  ],
  pascoa: [
    { text: 'Na Páscoa, celebro a renovação. E o nosso amor se renova a cada amanhecer. 🕊️', from: 'Pietro' },
    { text: 'Você é a minha esperança mais bonita, minha Emilly. Feliz Páscoa! 🌷', from: 'Pietro' },
    { text: '"Porque assim amou Deus ao mundo..." — e assim eu te amo, completamente. ✝️', from: 'Pietro' },
  ],
  'namorados': [
    { text: 'Hoje é o Dia dos Namorados, mas eu te amo todos os dias do ano. 💕', from: 'Pietro' },
    { text: 'Você é a razão pela qual o Dia dos Namorados é meu feriado favorito. 🌹', from: 'Pietro' },
    { text: 'Não preciso de uma data especial para te dizer que você é especial. Mas gosto de te lembrar! 💌', from: 'Pietro' },
  ],
  carnaval: [
    { text: 'No Carnaval, todo mundo se fantasia. Mas com você, posso ser exatamente quem sou. 🎭', from: 'Pietro' },
    { text: 'Nossa história é mais colorida do que qualquer bloco de Carnaval! 🎊', from: 'Pietro' },
  ],
  halloween: [
    { text: 'Halloween! A única coisa que me assusta é imaginar a vida sem você. 👻', from: 'Pietro' },
    { text: 'Você me enfeitiçou completamente, Emilly. E não quero o antídoto. 🎃', from: 'Pietro' },
  ],
  'sao-joao': [
    { text: 'Você é o fogueiro mais quente que já aqueceu meu coração. 🔥', from: 'Pietro' },
    { text: 'Se São João é a festa do interior, então meu interior é todo dedicado a você. 🎆', from: 'Pietro' },
  ],
  mesversario: [
    { text: 'Mais um mês e ainda não me canso de te amar. Impossível! 🥂', from: 'Pietro' },
    { text: 'Mesversário! Cada mês é uma nova razão para ser grato por te ter. 💕', from: 'Pietro' },
    { text: 'Todo dia 11 é meu dia favorito. Porque é o nosso dia. 🌹', from: 'Pietro' },
  ],
  'aniv-pietro': [
    { text: 'Hoje é seu dia, Pietro! Que este aniversário seja cheio de amor e alegria. 🎂', from: 'Emilly' },
    { text: 'Parabéns, meu amor! Fico feliz em poder comemorar mais um ano ao seu lado. 🎈', from: 'Emilly' },
    { text: 'Você merece todo o bem deste mundo. Feliz aniversário, Pietro! 💙🎁', from: 'Emilly' },
  ],
  'aniv-emilly': [
    { text: 'Feliz aniversário, Emilly! Você é a melhor coisa que já aconteceu comigo. 🎂', from: 'Pietro' },
    { text: 'Hoje o mundo ganhou a pessoa mais linda e especial. Parabéns, minha princesa! 🎀', from: 'Pietro' },
    { text: 'Que este aniversário seja tão incrível quanto você é todos os dias. 💗🎈', from: 'Pietro' },
  ],
};

let _msgInterval = null;

export function initRomanticMessages(activeEventId = null) {
  if (_msgInterval) clearInterval(_msgInterval);

  const msgs = [
    ...(ROMANTIC_MESSAGES.default),
    ...(activeEventId && ROMANTIC_MESSAGES[activeEventId] ? ROMANTIC_MESSAGES[activeEventId] : []),
  ];

  // Primeira mensagem: após 45 segundos
  setTimeout(() => _showRomanticMessage(msgs), 45000);

  // Depois, a cada 4-6 minutos
  _msgInterval = setInterval(() => {
    _showRomanticMessage(msgs);
  }, (4 + Math.random() * 2) * 60000);
}

let _lastMsgIdx = -1;

function _showRomanticMessage(msgs) {
  // Evita repetir a última mensagem
  let idx;
  do { idx = Math.floor(Math.random() * msgs.length); } while (idx === _lastMsgIdx && msgs.length > 1);
  _lastMsgIdx = idx;

  const msg = msgs[idx];
  const toast = document.createElement('div');
  // FIX: bottom:88px para ficar acima da mini-player-bar (60px) + margem (8px)
  // e não colidir com o botão de mini-jogo nem ser cortado pela barra de música
  const _bar = document.getElementById('mini-player-bar');
  const _barH = (_bar && _bar.style.display === 'flex') ? 68 : 8;
  toast.style.cssText = `
    position:fixed;
    bottom:${_barH + 20}px; right:1rem;
    background:linear-gradient(145deg,#fff0f3,#fff8f9);
    border:1px solid rgba(232,83,111,0.2);
    border-radius:20px;
    padding:1rem 1.2rem;
    max-width:280px;
    z-index:9995;
    box-shadow:0 8px 32px rgba(89,13,34,0.2);
    animation:slideInRight 0.5s cubic-bezier(.32,1.2,.5,1) both;
    cursor:pointer;
  `;
  toast.innerHTML = `
    <div style="display:flex;gap:0.6rem;align-items:flex-start;">
      <span style="font-size:1.3rem;flex-shrink:0;">💌</span>
      <div>
        <div style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:0.95rem;color:#590d22;line-height:1.5;">${msg.text}</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:0.7rem;color:#b06070;margin-top:0.3rem;">— ${msg.from} 💕</div>
      </div>
    </div>
  `;
  document.body.appendChild(toast);
  toast.addEventListener('click', () => {
    toast.style.animation = 'slideOutRight 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  });
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = 'slideOutRight 0.5s ease forwards';
      setTimeout(() => toast.remove(), 500);
    }
  }, 8000);
}


/* ════════════════════════════════════════════════════════
   5. MINI-JOGOS TEMÁTICOS
   ════════════════════════════════════════════════════════ */

export function openEventGame(eventId) {
  const games = {
    pascoa:          () => _gamePascoaHunt(),
    natal:           () => _gameNatalQuiz(),
    'vespera-natal': () => _gameNatalQuiz(),
    'namorados': () => _gameLoveQuiz(),
    carnaval:        () => _gameCarnavalMatch(),
    mesversario:     () => _gameMesversarioMemory(),
    halloween:       () => _gameHalloweenHunt(),
    'sao-joao':      () => _gameSaoJoaoMatch(),
  };

  const fn = games[eventId];
  if (fn) fn();
  else _gameDefaultQuiz();
}

// ── Jogo: Caça aos Ovos de Páscoa ──
function _gamePascoaHunt() {
  const eggs = [
    { emoji: '🥚', color: '#ff6b9d', message: 'Ovo Rosa! "O amor é como a Páscoa: renasce e floresce." 🌸' },
    { emoji: '🥚', color: '#4dc8ff', message: 'Ovo Azul! "Cada novo começo é uma bênção de Deus." 🕊️' },
    { emoji: '🥚', color: '#ffd93d', message: 'Ovo Dourado! "Nossa história brilha como o ouro do sol." ✨' },
    { emoji: '🐣', color: '#6bcb77', message: 'Pintinho! "Assim como a vida emerge do ovo, nosso amor emerge do coração." 💕' },
    { emoji: '🐇', color: '#c44dff', message: 'Coelhinho! "Rápido como o coelho, meu coração acelera quando penso em você." 💜' },
  ];

  let found = 0;
  const overlay = _createGameOverlay();
  const total = eggs.length;

  overlay.querySelector('.game-content').innerHTML = `
    <div style="font-size:2rem;margin-bottom:0.5rem;">🥚</div>
    <h3 style="font-family:'Playfair Display',serif;font-size:1.3rem;color:#590d22;margin-bottom:0.5rem;">Caça aos Ovos de Páscoa</h3>
    <p style="font-family:'Cormorant Garamond',serif;font-style:italic;color:#7a3045;font-size:1rem;margin-bottom:1.5rem;">Encontre todos os ${total} ovos escondidos!</p>
    <div id="egg-hunt-grid" style="display:grid;grid-template-columns:repeat(5,1fr);gap:0.8rem;margin-bottom:1rem;"></div>
    <div id="egg-hunt-msg" style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:0.95rem;color:#590d22;min-height:2rem;text-align:center;margin-bottom:1rem;"></div>
    <div style="font-size:0.85rem;color:#b06070;">Encontrados: <span id="egg-count">0</span>/${total}</div>
  `;

  // Cria grid com ovos escondidos (shuffled)
  const grid = overlay.querySelector('#egg-hunt-grid');
  const positions = Array.from({ length: 15 }, (_, i) => i);
  const eggPositions = positions.sort(() => Math.random() - 0.5).slice(0, total);

  for (let i = 0; i < 15; i++) {
    const cell = document.createElement('div');
    const eggIdx = eggPositions.indexOf(i);
    cell.style.cssText = `
      width:52px;height:52px;
      background:${eggIdx >= 0 ? '#fff0f3' : '#f5f5f5'};
      border:2px solid ${eggIdx >= 0 ? 'rgba(232,83,111,0.2)' : '#eee'};
      border-radius:12px;
      display:flex;align-items:center;justify-content:center;
      font-size:1.4rem;cursor:${eggIdx >= 0 ? 'pointer' : 'default'};
      transition:all 0.2s ease;
    `;
    cell.textContent = eggIdx >= 0 ? '❓' : '';

    if (eggIdx >= 0) {
      const egg = eggs[eggIdx];
      cell.addEventListener('click', () => {
        if (cell.dataset.found) return;
        cell.dataset.found = '1';
        cell.textContent = egg.emoji;
        cell.style.background = egg.color + '33';
        cell.style.borderColor = egg.color;
        cell.style.transform = 'scale(1.2)';
        found++;
        document.getElementById('egg-count').textContent = found;
        document.getElementById('egg-hunt-msg').textContent = egg.message;
        if (found === total) {
          setTimeout(() => {
            document.getElementById('egg-hunt-msg').innerHTML = `🎉 <strong>Parabéns!</strong> Você encontrou todos os ovos! "Assim como você encontrou cada ovinho, o Pietro te encontrou a você — a maior e mais linda surpresa da vida." 💕`;
          }, 800);
        }
      });
      cell.addEventListener('mouseenter', () => { if (!cell.dataset.found) cell.style.background = '#ffe0e8'; });
      cell.addEventListener('mouseleave', () => { if (!cell.dataset.found) cell.style.background = '#fff0f3'; });
    }
    grid.appendChild(cell);
  }

  document.body.appendChild(overlay);
  _setupGameClose(overlay);
}

// ── Jogo: Quiz de Natal ──
function _gameNatalQuiz() {
  const questions = [
    {
      q: 'Qual é a data em que Pietro e Emilly começaram a namorar oficialmente?',
      opts: ['11 de agosto de 2024', '11 de outubro de 2024', '11 de setembro de 2024', '06 de agosto de 2024'],
      a: 1,
      msg: '🎄 Correto! 11/10/2024 — o dia mais especial do ano!',
    },
    {
      q: 'Qual é o dia do mesversário do casal?',
      opts: ['Todo dia 1', 'Todo dia 11', 'Todo dia 14', 'Todo dia 25'],
      a: 1,
      msg: '⭐ Exato! Todo dia 11 é um dia para celebrar!',
    },
    {
      q: 'Qual foi a primeira música que tocou aqui no site?',
      opts: ['Evidências', 'Mania de Você', 'Lá em Maceió', 'Te Amo Demais'],
      a: 1,
      msg: '🎵 Mania de Você — Raça Negra! Uma escolha perfeita!',
    },
    {
      q: 'Segundo o Pietro, o que mais chama atenção na Emilly?',
      opts: ['Seu sorriso', 'Seus olhos verdes', 'Sua voz', 'Sua coragem'],
      a: 1,
      msg: '💚 Os olhos verdes da Emilly são os mais lindos do mundo!',
    },
  ];

  _runQuiz(questions, '🎄 Quiz de Natal', 'Quantas perguntas sobre nosso relacionamento você consegue acertar?', '❄️', '#c44dff');
}

// ── Jogo: Quiz do Amor ──
function _gameLoveQuiz() {
  const questions = [
    {
      q: 'Qual a frase que descreve melhor o que Pietro sente por Emilly?',
      opts: ['"Você é legal"', '"Você é meu lar"', '"Você é minha amiga"', '"Você é interessante"'],
      a: 1,
      msg: '💕 "Você é meu lar" — as palavras mais verdadeiras que o Pietro já disse!',
    },
    {
      q: 'Qual é o significado do "&" entre Pietro & Emilly?',
      opts: ['É só estético', 'Representa união de duas almas', 'Foi escolhido ao acaso', 'Representa amizade'],
      a: 1,
      msg: '🌹 O & une duas histórias em uma só — mais bonito que qualquer símbolo!',
    },
    {
      q: 'O que o Pietro guarda de mais precioso sobre a Emilly?',
      opts: ['Fotos', 'Cartas digitais', 'Cada momento, abraço e risada compartilhados', 'Presentes'],
      a: 2,
      msg: '✨ Cada momento é insubstituível! O Pietro guarda tudo no coração.',
    },
  ];

  _runQuiz(questions, '💌 Quiz do Amor', 'Você conhece nossa história? Descubra!', '❤️', '#e8536f');
}

// ── Jogo: Jogo da Memória de Carnaval ──
function _gameCarnavalMatch() {
  const pairs = ['💃', '🎊', '🎭', '🎶', '🌈', '🎉'];
  const cards = [...pairs, ...pairs].sort(() => Math.random() - 0.5);

  let flipped = [], matched = 0, locked = false;

  const overlay = _createGameOverlay();
  overlay.querySelector('.game-content').innerHTML = `
    <div style="font-size:2rem;margin-bottom:0.5rem;">🎊</div>
    <h3 style="font-family:'Playfair Display',serif;font-size:1.3rem;color:#590d22;margin-bottom:0.5rem;">Jogo da Memória</h3>
    <p style="font-family:'Cormorant Garamond',serif;font-style:italic;color:#7a3045;font-size:1rem;margin-bottom:1.2rem;">Encontre os pares do Carnaval!</p>
    <div id="memory-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.6rem;max-width:280px;margin:0 auto 1rem;"></div>
    <div id="memory-msg" style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:0.9rem;color:#590d22;min-height:1.5rem;text-align:center;"></div>
  `;

  const grid = overlay.querySelector('#memory-grid');

  cards.forEach((emoji, i) => {
    const card = document.createElement('div');
    card.dataset.emoji = emoji;
    card.dataset.idx = i;
    card.style.cssText = `
      width:56px;height:56px;
      background:linear-gradient(135deg,#ff6b9d,#ffd700);
      border-radius:12px;
      display:flex;align-items:center;justify-content:center;
      font-size:1.5rem;cursor:pointer;
      transition:all 0.3s ease;
      user-select:none;
    `;
    card.textContent = '🃏';

    card.addEventListener('click', () => {
      if (locked || card.dataset.revealed || flipped.length >= 2) return;
      card.textContent = emoji;
      card.style.background = 'white';
      card.style.border = '2px solid #ffd700';
      card.dataset.revealed = '1';
      flipped.push(card);

      if (flipped.length === 2) {
        locked = true;
        // EXP-6+7: verifica que são cartas DOM diferentes E têm mesmo emoji
        if (flipped[0] !== flipped[1] && flipped[0].dataset.emoji === flipped[1].dataset.emoji) {
          matched++;
          flipped.forEach(c => { c.style.border = '2px solid #6bcb77'; c.style.background = '#f0fff4'; });
          flipped = [];
          locked = false;
          if (matched === pairs.length) {
            setTimeout(() => {
              overlay.querySelector('#memory-msg').innerHTML = '🎉 <strong>Você completou!</strong> "Assim como você encontrou cada par, nós dois nos encontramos — e foi a combinação mais perfeita do universo." 💕';
            }, 400);
          }
        } else {
          setTimeout(() => {
            flipped.forEach(c => { c.textContent = '🃏'; c.style.background = 'linear-gradient(135deg,#ff6b9d,#ffd700)'; c.style.border = 'none'; delete c.dataset.revealed; });
            flipped = [];
            locked = false;
          }, 1000);
        }
      }
    });
    grid.appendChild(card);
  });

  document.body.appendChild(overlay);
  _setupGameClose(overlay);
}

// ── Jogo: Memória do Mesversário ──
function _gameMesversarioMemory() {
  const pairs = ['💕', '🌹', '💌', '🥂', '💍', '🌸'];
  const cards = [...pairs, ...pairs].sort(() => Math.random() - 0.5);

  let flipped = [], matched = 0, locked = false;

  const overlay = _createGameOverlay();
  overlay.querySelector('.game-content').innerHTML = `
    <div style="font-size:2rem;margin-bottom:0.5rem;">💕</div>
    <h3 style="font-family:'Playfair Display',serif;font-size:1.3rem;color:#590d22;margin-bottom:0.5rem;">Memória do Mesversário</h3>
    <p style="font-family:'Cormorant Garamond',serif;font-style:italic;color:#7a3045;font-size:1rem;margin-bottom:1.2rem;">Encontre os pares do nosso amor!</p>
    <div id="memory-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.6rem;max-width:280px;margin:0 auto 1rem;"></div>
    <div id="memory-msg" style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:0.9rem;color:#590d22;min-height:1.5rem;text-align:center;"></div>
  `;

  const grid = overlay.querySelector('#memory-grid');

  cards.forEach((emoji) => {
    const card = document.createElement('div');
    card.dataset.emoji = emoji;
    card.style.cssText = `
      width:56px;height:56px;
      background:linear-gradient(135deg,#e8536f,#ff9ab5);
      border-radius:12px;
      display:flex;align-items:center;justify-content:center;
      font-size:1.5rem;cursor:pointer;
      transition:all 0.3s ease;
      user-select:none;
    `;
    card.textContent = '💗';

    card.addEventListener('click', () => {
      if (locked || card.dataset.revealed || flipped.length >= 2) return;
      card.textContent = emoji;
      card.style.background = 'white';
      card.style.border = '2px solid #e8536f';
      card.dataset.revealed = '1';
      flipped.push(card);

      if (flipped.length === 2) {
        locked = true;
        if (flipped[0] !== flipped[1] && flipped[0].dataset.emoji === flipped[1].dataset.emoji) {
          matched++;
          flipped.forEach(c => { c.style.border = '2px solid #e8536f'; c.style.background = '#fff0f3'; });
          flipped = [];
          locked = false;
          if (matched === pairs.length) {
            setTimeout(() => {
              overlay.querySelector('#memory-msg').innerHTML = '🎉 <strong>Você completou!</strong> \"Assim como você encontrou cada par, nós dois nos encontramos — e foi a combinação mais perfeita do universo.\" 💕';
            }, 400);
          }
        } else {
          setTimeout(() => {
            flipped.forEach(c => { c.textContent = '💗'; c.style.background = 'linear-gradient(135deg,#e8536f,#ff9ab5)'; c.style.border = 'none'; delete c.dataset.revealed; });
            flipped = [];
            locked = false;
          }, 1000);
        }
      }
    });
    grid.appendChild(card);
  });

  document.body.appendChild(overlay);
  _setupGameClose(overlay);
}

// ── Jogo: Memória de São João ──
function _gameSaoJoaoMatch() {
  const pairs = ['🎆', '🌽', '🎉', '🌸', '🏮', '🎶'];
  const cards = [...pairs, ...pairs].sort(() => Math.random() - 0.5);

  let flipped = [], matched = 0, locked = false;

  const overlay = _createGameOverlay();
  overlay.querySelector('.game-content').innerHTML = `
    <div style="font-size:2rem;margin-bottom:0.5rem;">🎆</div>
    <h3 style="font-family:'Playfair Display',serif;font-size:1.3rem;color:#590d22;margin-bottom:0.5rem;">Memória do Arraiá</h3>
    <p style="font-family:'Cormorant Garamond',serif;font-style:italic;color:#7a3045;font-size:1rem;margin-bottom:1.2rem;">Encontre os pares da festa junina!</p>
    <div id="memory-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.6rem;max-width:280px;margin:0 auto 1rem;"></div>
    <div id="memory-msg" style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:0.9rem;color:#590d22;min-height:1.5rem;text-align:center;"></div>
  `;

  const grid = overlay.querySelector('#memory-grid');

  cards.forEach((emoji) => {
    const card = document.createElement('div');
    card.dataset.emoji = emoji;
    card.style.cssText = `
      width:56px;height:56px;
      background:linear-gradient(135deg,#f57f17,#ffd54f);
      border-radius:12px;
      display:flex;align-items:center;justify-content:center;
      font-size:1.5rem;cursor:pointer;
      transition:all 0.3s ease;
      user-select:none;
    `;
    card.textContent = '🎪';

    card.addEventListener('click', () => {
      if (locked || card.dataset.revealed || flipped.length >= 2) return;
      card.textContent = emoji;
      card.style.background = 'white';
      card.style.border = '2px solid #f57f17';
      card.dataset.revealed = '1';
      flipped.push(card);

      if (flipped.length === 2) {
        locked = true;
        if (flipped[0] !== flipped[1] && flipped[0].dataset.emoji === flipped[1].dataset.emoji) {
          matched++;
          flipped.forEach(c => { c.style.border = '2px solid #f57f17'; c.style.background = '#fff9c4'; });
          flipped = [];
          locked = false;
          if (matched === pairs.length) {
            setTimeout(() => {
              overlay.querySelector('#memory-msg').innerHTML = '🎉 <strong>Arraiá completo!</strong> \"Nossa história é mais colorida que qualquer festa junina!\" 💕';
            }, 400);
          }
        } else {
          setTimeout(() => {
            flipped.forEach(c => { c.textContent = '🎪'; c.style.background = 'linear-gradient(135deg,#f57f17,#ffd54f)'; c.style.border = 'none'; delete c.dataset.revealed; });
            flipped = [];
            locked = false;
          }, 1000);
        }
      }
    });
    grid.appendChild(card);
  });

  document.body.appendChild(overlay);
  _setupGameClose(overlay);
}

// ── Jogo: Caça ao Tesouro Halloween ──
function _gameHalloweenHunt() {
  const items = [
    { emoji: '🎃', name: 'Abóbora', msg: '"Esculpi um coração em cada abóbora — todas por você." 🖤' },
    { emoji: '👻', name: 'Fantasma', msg: '"Mesmo como fantasma, ainda te assombraria de amor." 👻' },
    { emoji: '🦇', name: 'Morcego', msg: '"Voei até você na escuridão e encontrei a luz." 🌙' },
    { emoji: '🕷️', name: 'Aranha', msg: '"Fiquei preso na sua teia de amor — sem querer sair." 💜' },
    { emoji: '🌙', name: 'Lua', msg: '"A lua de Halloween brilha, mas seus olhos brilham mais." ⭐' },
  ];

  let found = 0;
  const overlay = _createGameOverlay('dark');
  overlay.querySelector('.game-content').innerHTML = `
    <div style="font-size:2rem;margin-bottom:0.5rem;">🎃</div>
    <h3 style="font-family:'Playfair Display',serif;font-size:1.3rem;color:#fff;margin-bottom:0.5rem;">Caça ao Tesouro</h3>
    <p style="font-family:'Cormorant Garamond',serif;font-style:italic;color:#c9a9b0;font-size:1rem;margin-bottom:1.5rem;">Toque nos elementos escondidos no escuro...</p>
    <div style="display:flex;flex-wrap:wrap;gap:0.8rem;justify-content:center;margin-bottom:1rem;" id="hw-grid"></div>
    <div id="hw-msg" style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:0.95rem;color:#e0c0ff;min-height:2rem;text-align:center;margin-bottom:1rem;"></div>
    <div style="font-size:0.85rem;color:#c9a9b0;">Encontrados: <span id="hw-count">0</span>/${items.length}</div>
  `;

  const grid = overlay.querySelector('#hw-grid');
  // Mistura items com "vazios" escondidos
  const slots = Array.from({ length: 12 }, (_, i) => i);
  const itemPositions = slots.sort(() => Math.random() - 0.5).slice(0, items.length);

  for (let i = 0; i < 12; i++) {
    const idx = itemPositions.indexOf(i);
    const cell = document.createElement('div');
    cell.style.cssText = `
      width:54px;height:54px;
      background:${idx >= 0 ? 'rgba(196,77,255,0.15)' : 'rgba(255,255,255,0.05)'};
      border:1px solid ${idx >= 0 ? 'rgba(196,77,255,0.3)' : 'rgba(255,255,255,0.1)'};
      border-radius:12px;
      display:flex;align-items:center;justify-content:center;
      font-size:1.3rem;
      cursor:${idx >= 0 ? 'pointer' : 'default'};
      transition:all 0.2s ease;
    `;
    cell.textContent = idx >= 0 ? '🕸️' : '';

    if (idx >= 0) {
      const item = items[idx];
      cell.addEventListener('click', () => {
        if (cell.dataset.found) return;
        cell.dataset.found = '1';
        cell.textContent = item.emoji;
        cell.style.background = 'rgba(196,77,255,0.3)';
        cell.style.transform = 'scale(1.2)';
        found++;
        document.getElementById('hw-count').textContent = found;
        document.getElementById('hw-msg').textContent = item.msg;
        if (found === items.length) {
          setTimeout(() => {
            document.getElementById('hw-msg').innerHTML = `🏆 <strong style="color:#ffd700">Todos encontrados!</strong><br><span style="color:#e0c0ff">"Você encontrou cada segredo — assim como encontrou o caminho para o meu coração." 💜</span>`;
          }, 600);
        }
      });
    }
    grid.appendChild(cell);
  }

  document.body.appendChild(overlay);
  _setupGameClose(overlay);
}

function _gameDefaultQuiz() {
  const questions = [
    {
      q: 'Há quanto tempo Pietro e Emilly estão juntos (desde 11/10/2024)?',
      opts: ['Menos de 3 meses', 'Entre 3 e 6 meses', 'Mais de 6 meses', 'Mais de 1 ano'],
      a: (() => {
        const ms = Date.now() - new Date('2024-10-11').getTime();
        const days = Math.floor(ms / 86400000);
        if (days < 90) return 0;
        if (days < 180) return 1;
        if (days < 365) return 2;
        return 3;
      })(),
      msg: '💕 Cada dia conta — e todos são especiais!',
    },
    {
      q: 'Qual o dia do mesversário do casal?',
      opts: ['Todo dia 6', 'Todo dia 11', 'Todo dia 14', 'Todo dia 20'],
      a: 1,
      msg: '🥂 Todo dia 11, uma nova razão para celebrar!',
    },
  ];
  _runQuiz(questions, '💌 Curiosidades do Casal', 'Você conhece nossa história?', '💕', '#e8536f');
}

// ── Helper: executa um quiz genérico ──
function _runQuiz(questions, title, subtitle, icon, color) {
  let current = 0, score = 0;

  const overlay = _createGameOverlay();
  const content = overlay.querySelector('.game-content');

  function render() {
    if (current >= questions.length) {
      content.innerHTML = `
        <div style="font-size:3rem;margin-bottom:0.8rem;">${score === questions.length ? '🏆' : score >= questions.length / 2 ? '🥈' : '💌'}</div>
        <h3 style="font-family:'Playfair Display',serif;font-size:1.3rem;color:#590d22;margin-bottom:0.8rem;">
          ${score === questions.length ? 'Perfeito!' : 'Muito bem!'}
        </h3>
        <p style="font-family:'Cormorant Garamond',serif;font-style:italic;color:#7a3045;font-size:1.05rem;margin-bottom:0.5rem;">
          Você acertou ${score} de ${questions.length}!
        </p>
        <p style="font-family:'Cormorant Garamond',serif;font-style:italic;color:#590d22;font-size:1.05rem;line-height:1.7;margin-bottom:1.5rem;">
          ${score === questions.length
            ? '"Você me conhece melhor do que eu mesmo. Isso é amor de verdade." — Pietro 💕'
            : '"Cada tentativa é um gesto de carinho. Obrigado por querer saber mais sobre nós." — Pietro 🌹'}
        </p>
        <button id="quiz-close" style="background:linear-gradient(135deg,${color},#c44dff);color:white;border:none;padding:0.7rem 1.8rem;border-radius:50px;font-family:'DM Sans',sans-serif;font-size:0.9rem;cursor:pointer;">Fechar 💕</button>
      `;
      overlay.querySelector('#quiz-close')?.addEventListener('click', () => overlay.remove());
      return;
    }

    const q = questions[current];
    content.innerHTML = `
      <div style="font-size:1.5rem;margin-bottom:0.5rem;">${icon}</div>
      <h3 style="font-family:'Playfair Display',serif;font-size:1.1rem;color:#590d22;margin-bottom:1rem;">${title}</h3>
      <div style="font-size:0.7rem;color:#b06070;margin-bottom:1rem;letter-spacing:0.1em;">PERGUNTA ${current + 1} DE ${questions.length}</div>
      <p style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1.05rem;color:#590d22;margin-bottom:1.2rem;line-height:1.5;">${q.q}</p>
      <div style="display:flex;flex-direction:column;gap:0.5rem;" id="quiz-opts"></div>
      <div id="quiz-feedback" style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:0.9rem;color:#590d22;min-height:2rem;margin-top:0.8rem;text-align:center;"></div>
    `;

    const optsDiv = content.querySelector('#quiz-opts');
    q.opts.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.style.cssText = `
        padding:0.65rem 1rem;
        background:${color}15;
        border:1px solid ${color}33;
        border-radius:12px;
        font-family:'DM Sans',sans-serif;
        font-size:0.9rem;color:#590d22;
        cursor:pointer;text-align:left;
        transition:all 0.2s ease;
      `;
      btn.textContent = opt;
      btn.addEventListener('mouseenter', () => { btn.style.background = color + '25'; });
      btn.addEventListener('mouseleave', () => { if (!btn.dataset.answered) btn.style.background = color + '15'; });
      btn.addEventListener('click', () => {
        if (btn.dataset.answered) return;
        btn.dataset.answered = '1'; // EXP-9: marca imediatamente para bloquear duplo clique
        content.querySelectorAll('#quiz-opts button').forEach(b => b.dataset.answered = '1');
        const isCorrect = i === q.a;
        if (isCorrect) { score++; btn.style.background = '#6bcb7733'; btn.style.border = '1px solid #6bcb77'; }
        else { btn.style.background = '#ff6b6b22'; btn.style.border = '1px solid #ff6b6b';
          content.querySelectorAll('#quiz-opts button')[q.a].style.background = '#6bcb7733';
          content.querySelectorAll('#quiz-opts button')[q.a].style.border = '1px solid #6bcb77';
        }
        content.querySelector('#quiz-feedback').textContent = isCorrect ? `✅ ${q.msg}` : `💕 ${q.msg}`;
        setTimeout(() => { current++; render(); }, 2000);
      });
      optsDiv.appendChild(btn);
    });
  }

  render();
  document.body.appendChild(overlay);
  _setupGameClose(overlay);
}

// ── Helpers de overlay ──
function _createGameOverlay(theme = 'light') {
  const overlay = document.createElement('div');
  const isDark = theme === 'dark';
  overlay.style.cssText = `
    position:fixed; inset:0;
    background:${isDark ? 'rgba(10,0,20,0.85)' : 'rgba(89,13,34,0.65)'};
    backdrop-filter:blur(12px);
    z-index:99998;
    display:flex; align-items:center; justify-content:center;
    padding:1.5rem;
    animation:fadeIn 0.3s ease;
  `;
  overlay.innerHTML = `
    <div class="game-content" style="
      background:${isDark ? 'linear-gradient(145deg,#1a0533,#0d0d2b)' : 'linear-gradient(145deg,#fff8f9,#fff0f3)'};
      border-radius:28px; padding:2rem 1.8rem;
      max-width:420px; width:100%;
      text-align:center;
      box-shadow:0 40px 100px rgba(0,0,0,0.5);
      animation:popIn 0.4s cubic-bezier(.32,1.2,.5,1);
      position:relative;
      max-height:80vh;
      overflow-y:auto;
    ">
      <button id="game-close" style="
        position:absolute; top:1rem; right:1rem;
        background:rgba(89,13,34,0.1); border:none;
        width:32px; height:32px; border-radius:50%;
        cursor:pointer; font-size:0.9rem;
        color:${isDark ? '#e0c0ff' : '#590d22'};
        display:flex;align-items:center;justify-content:center;
      ">✕</button>
    </div>
  `;
  return overlay;
}

function _setupGameClose(overlay) {
  overlay.querySelector('#game-close')?.addEventListener('click', () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';
    setTimeout(() => overlay.remove(), 300);
  });
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s ease';
      setTimeout(() => overlay.remove(), 300);
    }
  });
}


/* ════════════════════════════════════════════════════════
   6. BOTÃO DE MINI-JOGO NO BANNER DE EVENTO
   ════════════════════════════════════════════════════════ */

export function injectGameButton(eventId) {
  if (!eventId) return;

  const gameEvents = ['pascoa', 'natal', 'vespera-natal', 'namorados', 'carnaval', 'mesversario', 'halloween', 'sao-joao'];
  if (!gameEvents.includes(eventId)) return;

  // Evita duplicar
  if (document.getElementById('pe-game-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'pe-game-btn';
  btn.innerHTML = '🎮 Mini-Jogo';

  // FIX: posiciona o botão acima da mini-player-bar (60px) + margem (8px) + espaço extra (70px)
  // para não colidir com a mensagem romântica que aparece em bottom:80px
  // Se a mini-player-bar estiver visível, o botão já está acima dela (bottom:148px)
  // Se não estiver, fica em bottom:88px — ainda acima das mensagens românticas (bottom:80px)
  const barEl = document.getElementById('mini-player-bar');
  const barVisible = barEl && barEl.style.display === 'flex';
  const bottomPos = barVisible ? '148px' : '88px';

  btn.style.cssText = `
    position:fixed;
    bottom:${bottomPos}; right:1rem;
    background:linear-gradient(135deg,#c44dff,#e8536f);
    color:white; border:none;
    padding:0.6rem 1.1rem;
    border-radius:50px;
    font-family:'DM Sans',sans-serif;
    font-size:0.85rem; font-weight:600;
    cursor:pointer;
    box-shadow:0 4px 20px rgba(196,77,255,0.4);
    z-index:9990;
    animation:popIn 0.5s 2s cubic-bezier(.32,1.2,.5,1) both;
    transition:transform 0.2s ease, bottom 0.3s ease;
  `;
  btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.05)'; });
  btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  btn.addEventListener('click', () => openEventGame(eventId));

  // Ajusta posição dinamicamente quando a barra de música aparece/some
  const _observer = new MutationObserver(() => {
    // FIX: desconecta se o botão saiu do DOM (evita memory leak)
    if (!document.body.contains(btn)) { _observer.disconnect(); return; }
    const visible = barEl && barEl.style.display === 'flex';
    btn.style.bottom = visible ? '148px' : '88px';
  });
  if (barEl) _observer.observe(barEl, { attributes: true, attributeFilter: ['style'] });

  document.body.appendChild(btn);
}


/* ════════════════════════════════════════════════════════
   7. TOOLTIP ROMÂNTICO EM ELEMENTOS ESPECIAIS
   ════════════════════════════════════════════════════════ */

const TOOLTIPS = [
  { selector: '.stat-card:nth-child(1)', text: 'Cada sol que nasce, nasce com o Pietro pensando em você 🌅' },
  { selector: '.stat-card:nth-child(2)', text: 'Todo sonho que a Emilly tem, o Pietro quer ser parte 🌠' },
  { selector: '.stat-card:nth-child(3)', text: '7 dias, 7 razões novas para te amar a cada semana 🌹' },
  { selector: '.stat-card:nth-child(4)', text: 'O amor entre vocês dois é literalmente infinito ∞ 💕' },
  { selector: '.timeline-item:nth-child(1) .timeline-event', text: '06/08/2024 — o dia em que tudo começou a fazer sentido ✨' },
  { selector: '.timeline-item:nth-child(2) .timeline-event', text: '11/10/2024 — o dia que o Pietro escolheu para sempre 💍' },
];

export function initTooltips() {
  TOOLTIPS.forEach(({ selector, text }) => {
    const el = document.querySelector(selector);
    if (!el) return;
    if (el.dataset.tipInited) return; // EXP-10: evita duplicar tooltip
    el.dataset.tipInited = '1';
    el.style.position = 'relative';
    el.style.cursor = 'help';

    const tip = document.createElement('div');
    tip.style.cssText = `
      position:absolute;
      bottom:calc(100% + 8px);
      left:50%;
      transform:translateX(-50%);
      background:linear-gradient(135deg,#590d22,#800020);
      color:white;
      padding:0.6rem 0.9rem;
      border-radius:12px;
      font-family:'Cormorant Garamond',serif;
      font-style:italic;
      font-size:0.85rem;
      line-height:1.4;
      white-space:nowrap;
      max-width:240px;
      white-space:normal;
      text-align:center;
      z-index:1000;
      pointer-events:none;
      opacity:0;
      transition:opacity 0.2s ease, transform 0.2s ease;
      transform:translateX(-50%) translateY(4px);
      box-shadow:0 8px 24px rgba(89,13,34,0.3);
    `;
    tip.textContent = text;

    // Ponteiro
    const arrow = document.createElement('div');
    arrow.style.cssText = `
      position:absolute; top:100%; left:50%;
      transform:translateX(-50%);
      border:5px solid transparent;
      border-top-color:#590d22;
    `;
    tip.appendChild(arrow);
    el.appendChild(tip);

    el.addEventListener('mouseenter', () => {
      tip.style.opacity = '1';
      tip.style.transform = 'translateX(-50%) translateY(0)';
    });
    el.addEventListener('mouseleave', () => {
      tip.style.opacity = '0';
      tip.style.transform = 'translateX(-50%) translateY(4px)';
    });
  });
}


/* ════════════════════════════════════════════════════════
   8. INIT PRINCIPAL — chama tudo
   ════════════════════════════════════════════════════════ */

export function initExperience(activeEventId = null) {
  initDynamicMode(activeEventId);
  initAdaptiveParticles(activeEventId);
  initEasterEggs(activeEventId);
  initRomanticMessages(activeEventId);
  injectGameButton(activeEventId);
  setTimeout(initTooltips, 2000);
}
