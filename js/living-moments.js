/* ═══════════════════════════════════════════════════════════════
   PIETRO & EMILLY — living-moments.js  v1
   Momentos Vivos

   Pequenos acontecimentos espontâneos que fazem o app
   parecer vivo. Aparecem uma vez por sessão, escolhidos
   pelo estado emocional do relacionamento.

   O usuário nunca vê o sistema —
   só pensa: "isso foi... muito a gente."

   Dependências (todas opcionais / com fallback):
     window._emotionalState  — emotional-state.js
     window._loveCity        — love-city-core.js
     window.showToast        — ui.js
   ═══════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════
   POOL DE MOMENTOS
   Cada momento tem:
     text      — o que aparece (voz íntima, não técnica)
     phase     — fase emocional que o gera
     weight    — probabilidade relativa (1 = base)
     asMemory  — true = pode virar memória leve (baixa freq.)
     icon      — emoji suave para o mini-card
   ════════════════════════════════════════════ */

const MOMENTS = [

  /* ── NOSTALGIA ──────────────────────────── */
  {
    id      : 'nos_shopping',
    phase   : 'nostalgia',
    icon    : '🍦',
    text    : 'Lembrei daquele dia no shopping… o sorvete do Mac, ela rindo à toa.',
    weight  : 2,
    asMemory: false,
  },
  {
    id      : 'nos_xadrez',
    phase   : 'nostalgia',
    icon    : '♟️',
    text    : 'Aquele xadrez foi a melhor desculpa do mundo.',
    weight  : 2,
    asMemory: false,
  },
  {
    id      : 'nos_bridgerton',
    phase   : 'nostalgia',
    icon    : '🌙',
    text    : 'Tem noites que eu ainda lembro do Bridgerton passando de fundo.',
    weight  : 1,
    asMemory: false,
  },
  {
    id      : 'nos_escola',
    phase   : 'nostalgia',
    icon    : '🏫',
    text    : 'A Maria Rocha não sabia que tava fazendo parte de uma história.',
    weight  : 1,
    asMemory: false,
  },
  {
    id      : 'nos_pedido',
    phase   : 'nostalgia',
    icon    : '💫',
    text    : 'Aquela noite ela perguntou. E tudo mudou.',
    weight  : 3,
    asMemory: false,
  },

  /* ── CONEXÃO ────────────────────────────── */
  {
    id      : 'con_conversa',
    phase   : 'conexao',
    icon    : '💬',
    text    : 'Gosto quando a gente só fica conversando sem precisar de nada.',
    weight  : 2,
    asMemory: false,
  },
  {
    id      : 'con_mimi',
    phase   : 'conexao',
    icon    : '💕',
    text    : 'Mimi. É só chamar assim que já fica tudo mais leve.',
    weight  : 2,
    asMemory: false,
  },
  {
    id      : 'con_piano',
    phase   : 'conexao',
    icon    : '🎹',
    text    : 'Aquela melodia que ela toca… fica na cabeça o dia inteiro.',
    weight  : 1,
    asMemory: false,
  },
  {
    id      : 'con_academia',
    phase   : 'conexao',
    icon    : '🏋️',
    text    : 'Treinar do lado dela é diferente. Tudo fica mais fácil.',
    weight  : 1,
    asMemory: false,
  },
  {
    id      : 'con_taekwondo',
    phase   : 'conexao',
    icon    : '🥋',
    text    : 'Ver ela no tatame foi uma das melhores coisas.',
    weight  : 2,
    asMemory: false,
  },

  /* ── ROTINA ─────────────────────────────── */
  {
    id      : 'rot_dia_normal',
    phase   : 'rotina',
    icon    : '☀️',
    text    : 'Hoje foi um dia normal… mas com ela fica diferente.',
    weight  : 3,
    asMemory: false,
  },
  {
    id      : 'rot_simples',
    phase   : 'rotina',
    icon    : '🌿',
    text    : 'As coisas simples são as que a gente mais vai lembrar.',
    weight  : 2,
    asMemory: false,
  },
  {
    id      : 'rot_presenca',
    phase   : 'rotina',
    icon    : '💛',
    text    : 'Não precisa acontecer nada. Só estar juntos já tá bom.',
    weight  : 3,
    asMemory: false,
  },
  {
    id      : 'rot_lar',
    phase   : 'rotina',
    icon    : '🏡',
    text    : 'Ela é o lugar onde eu me sinto em casa.',
    weight  : 2,
    asMemory: true,   // esse pode virar memória leve
  },

  /* ── INÍCIO ─────────────────────────────── */
  {
    id      : 'ini_começo',
    phase   : 'inicio',
    icon    : '✨',
    text    : 'Essa história tá só começando. E já tá bonita.',
    weight  : 3,
    asMemory: false,
  },
  {
    id      : 'ini_descoberta',
    phase   : 'inicio',
    icon    : '💭',
    text    : 'Cada coisa guardada aqui vai fazer sentido um dia.',
    weight  : 2,
    asMemory: false,
  },
  {
    id      : 'ini_primeiro',
    phase   : 'inicio',
    icon    : '🌱',
    text    : 'Os primeiros momentos são os que a gente nunca esquece.',
    weight  : 2,
    asMemory: false,
  },

  /* ── GENÉRICOS (qualquer fase) ──────────── */
  {
    id      : 'gen_guardar',
    phase   : null,   // aparece em qualquer fase
    icon    : '📖',
    text    : 'Esse app guarda o que a memória às vezes esquece.',
    weight  : 1,
    asMemory: false,
  },
  {
    id      : 'gen_historia',
    phase   : null,
    icon    : '💕',
    text    : 'Vocês têm uma história bonita. E ela cresce todo dia.',
    weight  : 1,
    asMemory: false,
  },
  {
    id      : 'gen_detalhe',
    phase   : null,
    icon    : '🌸',
    text    : 'São os detalhes que fazem a diferença. Sempre foram.',
    weight  : 1,
    asMemory: false,
  },
];

/* ════════════════════════════════════════════
   CONTROLE DE SESSÃO E REPETIÇÃO
   ════════════════════════════════════════════ */

const LS_MOMENTS     = 'loveCity.moments.v1';
const COOLDOWN_MS    = 12 * 60 * 60 * 1000;   // 12 horas entre momentos
const TRIGGER_CHANCE = 0.28;                    // 28% de chance por chamada
const LS_SAVED_IDS   = 'loveCity.moments.savedIds'; // RISCO-3: chave unificada

/* Flag de sessão em memória — nunca mais de 1 por abertura de app */
let _firedThisSession = false;
let _visHandler = null; // MELHORIA-5: referência para limpar listener

function _loadState() {
  try {
    const raw = localStorage.getItem(LS_MOMENTS);
    return raw ? JSON.parse(raw) : { lastShown: 0, seen: [] };
  } catch (_) { return { lastShown: 0, seen: [] }; }
}

function _saveState(s) {
  try { localStorage.setItem(LS_MOMENTS, JSON.stringify(s)); } catch (_) {}
}

/* Reseta flag de sessão quando o app é reaberto
   (detectado via visibilitychange — sem overhead) */
function _watchSession() {
  try {
    if (_visHandler) document.removeEventListener('visibilitychange', _visHandler); // MELHORIA-5
    _visHandler = () => {
      if (document.visibilityState === 'visible') {
        _firedThisSession = false; // Nova visita = nova sessão potencial
      }
    };
    document.addEventListener('visibilitychange', _visHandler, { passive: true });
  } catch (_) {}
}

/* ════════════════════════════════════════════
   SELEÇÃO DO MOMENTO
   Weighted random dentro da fase correta.
   Nunca repete textos recentes.
   ════════════════════════════════════════════ */

function _pick(phase, seen) {
  // Pool: momentos da fase + genéricos
  const pool = MOMENTS.filter(m => m.phase === phase || m.phase === null);
  if (pool.length === 0) return null;

  // Penaliza vistos recentemente (últimos 10)
  const recentSeen = seen.slice(-10);
  const weights = pool.map(m => {
    if (recentSeen.includes(m.id)) return 0.05;  // quase nunca
    return m.weight || 1;
  });

  const total = weights.reduce((s, w) => s + w, 0);
  if (total <= 0) return pool[Math.floor(Math.random() * pool.length)];

  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/* ════════════════════════════════════════════
   UI DO MOMENTO — mini-card flutuante
   Emerge de baixo, fica 6s, some sozinho.
   UI própria para não colidir com #toast.
   ════════════════════════════════════════════ */

function _injectStyles() {
  if (document.getElementById('lm-styles')) return;
  const style = document.createElement('style');
  style.id = 'lm-styles';
  style.textContent = `
    #lm-card {
      position: fixed;
      bottom: 88px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      z-index: 9998;
      background: rgba(89, 13, 34, 0.96);
      color: #fff;
      padding: 13px 18px;
      border-radius: 18px;
      max-width: min(88vw, 340px);
      width: max-content;
      box-shadow: 0 8px 28px rgba(0,0,0,.35);
      display: flex;
      align-items: flex-start;
      gap: 10px;
      opacity: 0;
      transition: opacity .38s ease, transform .38s ease;
      pointer-events: auto;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    #lm-card.lm-visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    #lm-card.lm-hiding {
      opacity: 0;
      transform: translateX(-50%) translateY(12px);
    }
    #lm-card-icon {
      font-size: 1.25rem;
      line-height: 1.3;
      flex-shrink: 0;
      margin-top: 1px;
    }
    #lm-card-body {
      flex: 1;
    }
    #lm-card-label {
      font-size: .68rem;
      letter-spacing: .06em;
      text-transform: uppercase;
      opacity: .55;
      margin-bottom: 3px;
      font-family: var(--font-body, sans-serif);
    }
    #lm-card-text {
      font-size: .88rem;
      line-height: 1.45;
      font-style: italic;
      font-family: var(--font-body, sans-serif);
      opacity: .93;
    }
    #lm-card-close {
      background: none;
      border: none;
      color: rgba(255,255,255,.45);
      font-size: .85rem;
      cursor: pointer;
      padding: 0 0 0 6px;
      line-height: 1;
      flex-shrink: 0;
      align-self: flex-start;
      margin-top: 2px;
    }
    @media (prefers-reduced-motion: reduce) {
      #lm-card { transition: opacity .15s ease; }
    }
  `;
  document.head.appendChild(style);
}

function _showCard(moment, onDismiss) {
  _injectStyles();

  // Remove card anterior se existir
  document.getElementById('lm-card')?.remove();

  const card = document.createElement('div');
  card.id   = 'lm-card';
  card.setAttribute('role', 'status');
  card.setAttribute('aria-live', 'polite');
  card.setAttribute('aria-label', moment.text);

  card.innerHTML = `
    <div id="lm-card-icon" aria-hidden="true">${moment.icon || '💛'}</div>
    <div id="lm-card-body">
      <div id="lm-card-label">um momento</div>
      <div id="lm-card-text">${moment.text}</div>
    </div>
    <button id="lm-card-close" aria-label="Fechar">✕</button>
  `;

  document.body.appendChild(card);

  // Força reflow para transição CSS
  card.getBoundingClientRect();
  card.classList.add('lm-visible');

  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    card.classList.add('lm-hiding');
    setTimeout(() => { card.remove(); onDismiss?.(); }, 400);
  };

  // Auto-dismiss depois de 6s
  const autoTimer = setTimeout(dismiss, 6000);

  // Toque/clique dispensa o card
  card.addEventListener('click', () => { clearTimeout(autoTimer); dismiss(); });
  card.querySelector('#lm-card-close')
    ?.addEventListener('click', (e) => { e.stopPropagation(); clearTimeout(autoTimer); dismiss(); });

  return dismiss;
}

/* ════════════════════════════════════════════
   maybeTriggerMoment — função principal exportada
   ════════════════════════════════════════════ */

/**
 * Talvez dispare um momento vivo.
 * Retorna true se um momento foi mostrado.
 */
export function maybeTriggerMoment() {
  try {
    // Já disparou nessa sessão?
    if (_firedThisSession) return false;

    const state = _loadState();

    // BUG-5: cooldown primeiro — se bloqueado, não marca _firedThisSession
    if (Date.now() - state.lastShown < COOLDOWN_MS) return false;

    // Rolagem de dado — 28% de chance (após cooldown)
    if (Math.random() > TRIGGER_CHANCE) return false;

    // Obtém fase emocional
    const emotional = window._emotionalState?.analyzeRelationshipState?.() || { phase: 'rotina' };
    const phase     = emotional.phase || 'rotina';

    // Escolhe momento
    const moment = _pick(phase, state.seen);
    if (!moment) return false;

    // Delay orgânico: 2.5–5s após abertura (não compete com outros toasts)
    const delay = 2500 + Math.floor(Math.random() * 2500);

    setTimeout(() => {
      try {
        _showCard(moment, () => {
          // Callback após dismiss: pode virar memória leve
          _maybeSaveAsMemory(moment, phase);
        });
      } catch (_) {}
    }, delay);

    // Marca como disparado nesta sessão
    _firedThisSession = true;

    // Persiste estado
    const newSeen = [...new Set([...state.seen, moment.id])].slice(-30);
    _saveState({ lastShown: Date.now(), seen: newSeen });

    return true;

  } catch (_) {
    return false;
  }
}

/* ════════════════════════════════════════════
   MEMÓRIA LEVE — opcional, baixa frequência
   Só para momentos marcados asMemory: true
   E só 1x por momento (controle por id)
   ════════════════════════════════════════════ */

function _maybeSaveAsMemory(moment, phase) {
  try {
    if (!moment.asMemory) return;

    // RISCO-3: chave unificada em vez de uma chave por momento
    let savedIds;
    try {
      savedIds = new Set(JSON.parse(localStorage.getItem(LS_SAVED_IDS) || '[]'));
    } catch (_) { savedIds = new Set(); }

    if (savedIds.has(moment.id)) return; // já salvou antes

    // 40% de chance para não poluir o museu
    if (Math.random() > 0.40) return;

    window._loveCity?.addMemory?.({
      type   : 'moment',
      summary: moment.text,
    });

    savedIds.add(moment.id);
    try { localStorage.setItem(LS_SAVED_IDS, JSON.stringify([...savedIds])); } catch (_) {}
  } catch (_) {}
}

/* ════════════════════════════════════════════
   initLivingMoments — ponto de entrada
   ════════════════════════════════════════════ */

/* Unsub para evitar acumulação de listeners (RISCO-2) */
let _lmUnsub = null;

export function initLivingMoments() {
  // Observa reaberturas de aba (com limpeza de listener anterior)
  _watchSession();

  // Cancela listener anterior se existir (RISCO-2)
  _lmUnsub?.();
  _lmUnsub = null;

  // Tenta disparar no init (abertura do app)
  maybeTriggerMoment();

  // Escuta memory:added — novo momento pode surgir
  try {
    _lmUnsub = window._loveCity?.onLoveEvent?.('memory:added', () => {
      // Reseta flag de sessão para deixar um novo momento possível
      // (mas o cooldown de 12h ainda protege contra spam)
      _firedThisSession = false;
      maybeTriggerMoment();
    });
  } catch (_) {}
}
