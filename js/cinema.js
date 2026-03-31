/* ═══════════════════════════════════════════════
   PIETRO & EMILLY — cinema.js
   Nosso Cinema 🎬
   · Catálogo de séries e filmes com YouTube
   · Player embutido com episódios
   · Filtro por categoria
   · Histórico do que assistiram
   ═══════════════════════════════════════════════ */

import { doc, getDoc, setDoc, onSnapshot }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

/* ══════════════════════════════════════════════
   CATÁLOGO
   ytId = ID do YouTube (playlist ou vídeo)
   type = 'series' | 'movie'
   episodes = array de episódios (só séries)
   ══════════════════════════════════════════════ */
export const CINEMA_CATALOG = {
  series: [
    {
      id: 'friends',
      title: 'Friends',
      genre: 'Comédia',
      year: '1994–2004',
      desc: 'Seis amigos vivendo em Nova York — amor, amizade e muitas risadas.',
      thumb: 'https://img.youtube.com/vi/hDNNmeeJs1Q/hqdefault.jpg',
      emoji: '☕',
      color: '#f4a94e',
      episodes: [
        { title: 'T1E1 — O Pilot', ytId: 'hDNNmeeJs1Q' },
        { title: 'T1E2 — A Sondagem', ytId: 'T7aSBSoPpnI' },
        { title: 'T1E3 — O Encontro às Cegas', ytId: 'CheY6EGovDk' },
        { title: 'T1E4 — O George Stephanopoulos', ytId: 'b_bHRK4PCTI' },
        { title: 'T1E5 — O East German Laundry', ytId: 'HtZbmxNEJPY' },
      ],
    },
    {
      id: 'black_mirror',
      title: 'Black Mirror',
      genre: 'Ficção Científica',
      year: '2011–presente',
      desc: 'Episódios independentes sobre o lado sombrio da tecnologia.',
      thumb: 'https://img.youtube.com/vi/HoHFGEr3gkA/hqdefault.jpg',
      emoji: '📱',
      color: '#1a1a2e',
      episodes: [
        { title: 'T1E1 — The National Anthem', ytId: 'HoHFGEr3gkA' },
        { title: 'T1E2 — Fifteen Million Merits', ytId: '-UNgFQFxClk' },
        { title: 'T1E3 — The Entire History of You', ytId: 'WEtDeVFmEjo' },
        { title: 'T2E1 — Be Right Back', ytId: 'mwQD7Glkjcw' },
        { title: 'T2E2 — White Bear', ytId: 'U5k_PgPMENo' },
      ],
    },
    {
      id: 'the_office',
      title: 'The Office',
      genre: 'Comédia',
      year: '2005–2013',
      desc: 'O cotidiano hilário de uma empresa de papel em Scranton, Pennsylvania.',
      thumb: 'https://img.youtube.com/vi/LHOtME2DL4g/hqdefault.jpg',
      emoji: '📋',
      color: '#5b8dd9',
      episodes: [
        { title: 'T1E1 — Pilot', ytId: 'LHOtME2DL4g' },
        { title: 'T1E2 — Diversity Day', ytId: 'ywUoIgHBHFU' },
        { title: 'T1E3 — Health Care', ytId: 'V9mE41bMYBQ' },
        { title: 'T1E4 — The Alliance', ytId: 'w5RBFMQLroE' },
        { title: 'T1E5 — Basketball', ytId: '5W5oQQGSoL4' },
      ],
    },
    {
      id: 'breaking_bad',
      title: 'Breaking Bad',
      genre: 'Drama / Suspense',
      year: '2008–2013',
      desc: 'Um professor de química transforma-se no maior fabricante de metanfetamina.',
      thumb: 'https://img.youtube.com/vi/HhesaQXLuRY/hqdefault.jpg',
      emoji: '🧪',
      color: '#2d5a27',
      episodes: [
        { title: 'T1E1 — Pilot', ytId: 'HhesaQXLuRY' },
        { title: 'T1E2 — Cat\'s in the Bag', ytId: 'JFDVm0LbdEs' },
        { title: 'T1E3 — And the Bag\'s in the River', ytId: 'J5HX-l9oXXc' },
        { title: 'T1E4 — Cancer Man', ytId: 'tNLTkPMOqjc' },
        { title: 'T1E5 — Gray Matter', ytId: 'JFk2yCnJsS0' },
      ],
    },
    {
      id: 'stranger_things_br',
      title: 'Stranger Things',
      genre: 'Ficção / Terror',
      year: '2016–presente',
      desc: 'Crianças enfrentam forças sobrenaturais numa cidade americana dos anos 80.',
      thumb: 'https://img.youtube.com/vi/sj9J2ecsSpo/hqdefault.jpg',
      emoji: '🌀',
      color: '#c0392b',
      episodes: [
        { title: 'T1E1 — The Vanishing of Will Byers', ytId: 'sj9J2ecsSpo' },
        { title: 'T1E2 — The Weirdo on Maple Street', ytId: '0O4aBkE2CXk' },
        { title: 'T1E3 — Holly, Jolly', ytId: 'V7XRFyMqS6k' },
        { title: 'T1E4 — The Body', ytId: 'BqiD6xuNtTA' },
        { title: 'T1E5 — The Flea and the Acrobat', ytId: 'HMFxSx68hE8' },
      ],
    },
    {
      id: 'dark',
      title: 'Dark',
      genre: 'Ficção Científica',
      year: '2017–2020',
      desc: 'Viagem no tempo, paradoxos e segredos de família numa cidade alemã.',
      thumb: 'https://img.youtube.com/vi/rrwycJ08PSQ/hqdefault.jpg',
      emoji: '🌑',
      color: '#0d0d1a',
      episodes: [
        { title: 'T1E1 — Secrets', ytId: 'rrwycJ08PSQ' },
        { title: 'T1E2 — Lies', ytId: 'Fp2bG0VcCBI' },
        { title: 'T1E3 — Past and Present', ytId: 'bpJoZcmECVE' },
        { title: 'T1E4 — Double Lives', ytId: 'X6sJRVCh9W8' },
        { title: 'T1E5 — Truths', ytId: 'SYyRKSvTLpA' },
      ],
    },
    {
      id: 'wednesday',
      title: 'Wednesday',
      genre: 'Comédia / Terror',
      year: '2022–presente',
      desc: 'Wednesday Addams investiga crimes sobrenaturais na Academia Nevermore.',
      thumb: 'https://img.youtube.com/vi/Di310WS8zLk/hqdefault.jpg',
      emoji: '🖤',
      color: '#1a0a1a',
      episodes: [
        { title: 'T1E1 — Wednesday\'s Child Is Full of Woe', ytId: 'Di310WS8zLk' },
        { title: 'T1E2 — Woe Is the Loneliest Number', ytId: 'qwlTjEr16Mg' },
        { title: 'T1E3 — Friend or Woe', ytId: 'RlpRpSl_OaQ' },
        { title: 'T1E4 — Woe What a Night', ytId: 'j4GNfQdNgKI' },
        { title: 'T1E5 — You Reap What You Woe', ytId: 'QJdS8rXrFSI' },
      ],
    },
    {
      id: 'squid_game',
      title: 'Round 6',
      genre: 'Drama / Suspense',
      year: '2021–presente',
      desc: 'Pessoas endividadas competem em jogos infantis mortais por um prêmio enorme.',
      thumb: 'https://img.youtube.com/vi/oqxAJKy0ii4/hqdefault.jpg',
      emoji: '🦑',
      color: '#e8536f',
      episodes: [
        { title: 'T1E1 — Red Light, Green Light', ytId: 'oqxAJKy0ii4' },
        { title: 'T1E2 — Hell', ytId: 'tBFOosxAlcU' },
        { title: 'T1E3 — The Man with the Umbrella', ytId: 'yTqrBCBGmBA' },
        { title: 'T1E4 — Stick to the Team', ytId: 'fSEHGM7Wdoo' },
        { title: 'T1E5 — A Fair World', ytId: '5dpFM1SWGgU' },
      ],
    },
  ],

  filmes: [
    {
      id: 'titanic',
      title: 'Titanic',
      genre: 'Romance / Drama',
      year: '1997',
      desc: 'Um amor impossível entre Jack e Rose no naufrágio do Titanic.',
      thumb: 'https://img.youtube.com/vi/2e-eXJ6HgkQ/hqdefault.jpg',
      emoji: '🚢',
      color: '#1a3a5c',
      ytId: '2e-eXJ6HgkQ',
    },
    {
      id: 'la_la_land',
      title: 'La La Land',
      genre: 'Romance / Musical',
      year: '2016',
      desc: 'Mia e Sebastian sonham com seus futuros enquanto se apaixonam em Los Angeles.',
      thumb: 'https://img.youtube.com/vi/0pdqf4P9MB8/hqdefault.jpg',
      emoji: '🌟',
      color: '#590d22',
      ytId: '0pdqf4P9MB8',
    },
    {
      id: 'diario_paixao',
      title: 'Diário de uma Paixão',
      genre: 'Romance / Drama',
      year: '2004',
      desc: 'Noah e Allie vivem um amor que resiste ao tempo e às diferenças sociais.',
      thumb: 'https://img.youtube.com/vi/lo7tpYBp_Fk/hqdefault.jpg',
      emoji: '📖',
      color: '#7a3045',
      ytId: 'lo7tpYBp_Fk',
    },
    {
      id: 'interstellar',
      title: 'Interestelar',
      genre: 'Ficção Científica / Drama',
      year: '2014',
      desc: 'Um ex-piloto viaja além da galáxia para salvar a humanidade.',
      thumb: 'https://img.youtube.com/vi/zSWdZVtXT7E/hqdefault.jpg',
      emoji: '🪐',
      color: '#0a0a2e',
      ytId: 'zSWdZVtXT7E',
    },
    {
      id: 'inception',
      title: 'A Origem',
      genre: 'Ficção Científica / Ação',
      year: '2010',
      desc: 'Um ladrão especializado em roubar segredos dos sonhos recebe uma missão impossível.',
      thumb: 'https://img.youtube.com/vi/YoHD9XEInc0/hqdefault.jpg',
      emoji: '🌀',
      color: '#1a2a4a',
      ytId: 'YoHD9XEInc0',
    },
    {
      id: 'forrest_gump',
      title: 'Forrest Gump',
      genre: 'Drama / Comédia',
      year: '1994',
      desc: 'A vida extraordinária de um homem simples que cruza momentos históricos dos EUA.',
      thumb: 'https://img.youtube.com/vi/bLvqoHBptjg/hqdefault.jpg',
      emoji: '🏃',
      color: '#4a6741',
      ytId: 'bLvqoHBptjg',
    },
    {
      id: 'frozen',
      title: 'Frozen',
      genre: 'Animação / Fantasia',
      year: '2013',
      desc: 'Anna embarca numa jornada épica para encontrar sua irmã Elsa e descongelar o reino.',
      thumb: 'https://img.youtube.com/vi/TbQm5doF_Uc/hqdefault.jpg',
      emoji: '❄️',
      color: '#2980b9',
      ytId: 'TbQm5doF_Uc',
    },
    {
      id: 'top_gun',
      title: 'Top Gun: Maverick',
      genre: 'Ação / Drama',
      year: '2022',
      desc: 'Maverick retorna para treinar uma nova geração de pilotos de elite da Marinha.',
      thumb: 'https://img.youtube.com/vi/qSqVVswa420/hqdefault.jpg',
      emoji: '✈️',
      color: '#1c3a5e',
      ytId: 'qSqVVswa420',
    },
  ],
};

/* ══════════════════════════════════════════════
   ESTADO
   ══════════════════════════════════════════════ */
let _db = null;
let _cinemaDoc = null;
let _watched = {}; // { itemId: true }
let _activeTab = 'series';
let _currentItem = null;
let _currentEpIdx = 0;

/* ══════════════════════════════════════════════
   FIREBASE
   ══════════════════════════════════════════════ */
async function _loadWatched() {
  if (!_cinemaDoc) return;
  try {
    const snap = await getDoc(_cinemaDoc);
    if (snap.exists()) _watched = snap.data().watched || {};
  } catch (e) {}
}

async function _saveWatched() {
  if (!_cinemaDoc) return;
  try {
    await setDoc(_cinemaDoc, { watched: _watched });
  } catch (e) {}
}

function _markWatched(id) {
  _watched[id] = !_watched[id];
  if (!_watched[id]) delete _watched[id];
  _saveWatched();
  _renderCatalog();
}

/* ══════════════════════════════════════════════
   RENDER PRINCIPAL
   ══════════════════════════════════════════════ */
function _renderCatalog() {
  const wrap = document.getElementById('cinema-catalog');
  if (!wrap) return;

  const items = _activeTab === 'series'
    ? CINEMA_CATALOG.series
    : CINEMA_CATALOG.filmes;

  wrap.innerHTML = items.map(item => {
    const isWatched = _activeTab === 'filmes'
      ? !!_watched[item.id]
      : false; // séries: progresso por episódio

    const watchedEps = _activeTab === 'series'
      ? (item.episodes || []).filter((_, i) => !!_watched[`${item.id}_ep${i}`]).length
      : 0;

    const totalEps = _activeTab === 'series' ? (item.episodes || []).length : 0;
    const pct = totalEps > 0 ? Math.round((watchedEps / totalEps) * 100) : 0;

    return `
    <div class="cinema-card ${isWatched ? 'cinema-card--watched' : ''}"
         onclick="window._openCinemaItem('${item.id}','${_activeTab}')">
      <div class="cinema-card-thumb" style="background:${item.color}">
        <img src="${item.thumb}" alt="${item.title}" loading="lazy"
             onerror="this.style.display='none'">
        <div class="cinema-card-emoji">${item.emoji}</div>
        ${isWatched ? '<div class="cinema-card-watched-badge">✓ Assistido</div>' : ''}
      </div>
      <div class="cinema-card-info">
        <div class="cinema-card-genre">${item.genre} · ${item.year}</div>
        <div class="cinema-card-title">${item.title}</div>
        <div class="cinema-card-desc">${item.desc}</div>
        ${_activeTab === 'series' && totalEps > 0 ? `
          <div class="cinema-ep-progress">
            <div class="cinema-ep-bar">
              <div class="cinema-ep-fill" style="width:${pct}%"></div>
            </div>
            <span class="cinema-ep-label">${watchedEps}/${totalEps} ep.</span>
          </div>` : ''}
        <button class="cinema-play-btn">
          ${_activeTab === 'series' ? '▶ Ver episódios' : '▶ Assistir agora'}
        </button>
      </div>
    </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════
   MODAL DO ITEM
   ══════════════════════════════════════════════ */
window._openCinemaItem = function(id, type) {
  const list = type === 'series' ? CINEMA_CATALOG.series : CINEMA_CATALOG.filmes;
  const item = list.find(x => x.id === id);
  if (!item) return;
  _currentItem = item;
  _currentEpIdx = 0;

  const overlay = document.getElementById('cinema-modal-overlay');
  if (!overlay) return;

  overlay.classList.add('show');
  _renderModal();
};

function _renderModal() {
  const item = _currentItem;
  if (!item) return;

  const isSeries = !!item.episodes;
  const ytId = isSeries
    ? item.episodes[_currentEpIdx]?.ytId
    : item.ytId;

  const title = isSeries
    ? item.episodes[_currentEpIdx]?.title
    : item.title;

  const playerEl = document.getElementById('cinema-modal-player');
  const titleEl  = document.getElementById('cinema-modal-title');
  const epListEl = document.getElementById('cinema-modal-eplist');
  const markBtn  = document.getElementById('cinema-modal-markbtn');

  if (titleEl) titleEl.textContent = `${item.emoji} ${item.title}`;

  if (playerEl) {
    playerEl.innerHTML = `
      <iframe
        src="https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&playsinline=1"
        title="${title}"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        style="width:100%;aspect-ratio:16/9;border-radius:16px;display:block;">
      </iframe>`;
  }

  if (isSeries && epListEl) {
    epListEl.innerHTML = item.episodes.map((ep, i) => {
      const epWatched = !!_watched[`${item.id}_ep${i}`];
      return `
        <div class="cinema-ep-item ${i === _currentEpIdx ? 'active' : ''} ${epWatched ? 'ep-done' : ''}"
             onclick="window._cinemaSwitchEp(${i})">
          <span class="cinema-ep-check">${epWatched ? '✓' : (i + 1)}</span>
          <span class="cinema-ep-name">${ep.title}</span>
        </div>`;
    }).join('');
    epListEl.style.display = 'flex';
  } else if (epListEl) {
    epListEl.style.display = 'none';
  }

  if (markBtn) {
    const key = isSeries ? `${item.id}_ep${_currentEpIdx}` : item.id;
    const done = !!_watched[key];
    markBtn.textContent = done ? '✓ Marcado como assistido' : '☑ Marcar como assistido';
    markBtn.classList.toggle('done', done);
    markBtn.onclick = () => {
      _markWatched(key);
      _renderModal();
    };
  }
}

window._cinemaSwitchEp = function(idx) {
  _currentEpIdx = idx;
  _renderModal();
};

window._closeCinemaModal = function() {
  const overlay = document.getElementById('cinema-modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  // Para o vídeo ao fechar
  const player = document.getElementById('cinema-modal-player');
  if (player) player.innerHTML = '';
  _currentItem = null;
};

window._cinemaSwitchTab = function(tab) {
  _activeTab = tab;
  document.querySelectorAll('.cinema-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab));
  _renderCatalog();
};

/* ══════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════ */
export function initCinema(db) {
  _db = db;
  if (db) {
    _cinemaDoc = doc(db, 'cinema', 'shared');
    _loadWatched().then(() => _renderCatalog());
  } else {
    _renderCatalog();
  }

  // Fecha modal ao clicar fora
  document.getElementById('cinema-modal-overlay')
    ?.addEventListener('click', e => {
      if (e.target === document.getElementById('cinema-modal-overlay')) {
        window._closeCinemaModal();
      }
    });
}
