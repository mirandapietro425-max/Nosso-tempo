/* ═══════════════════════════════════════════════
   PIETRO & EMILLY — cinema.js  v48
   Nosso Cinema 🎬
   · 5 abas: Séries · Filmes · Romance · Doramas · Animação
   · Player multi-servidor com fallback automático — áudio/legenda PT-BR
   · 6 servidores (prioridade PT-BR dublado)
   · iframe sem sandbox (compatível com todos os servidores)
   · Timeout 12s + botão trocar servidor
   · Continue Assistindo (progress.js)
   · Firebase sync de assistidos
   ═══════════════════════════════════════════════ */

import { doc, getDoc, setDoc }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

import {
  startTracking, stopTracking,
  getResumeTime,
  updateProgressBars, renderContinueWatching,
} from './progress.js';

/* ══════════════════════════════════════════════
   PLAYER — SERVIDORES COM DUBLAGEM E LEGENDA PT-BR
   Ordem: prioridade máxima para dublagem brasileira
   ══════════════════════════════════════════════ */
const PLAYER_SERVERS = [
  {
    name: '🇧🇷 Dub 1', label: 'Dublado PT-BR', type: 'dub',
    movie : (id)       => `https://vidlink.pro/movie/${id}?autoplay=true&lang=pt-BR&primaryColor=e8536f&secondaryColor=c0392b`,
    tv    : (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?autoplay=true&lang=pt-BR&primaryColor=e8536f&secondaryColor=c0392b`,
    hasParams: true,
  },
  {
    name: '🇧🇷 Dub 2', label: 'Dublado PT-BR', type: 'dub',
    movie : (id)       => `https://embed.su/embed/movie/${id}`,
    tv    : (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
    hasParams: false,
  },
  {
    name: '🇧🇷 Dub 3', label: 'Dublado PT-BR', type: 'dub',
    movie : (id)       => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tv    : (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
    hasParams: true,
  },
  {
    name: '🔤 Leg 1', label: 'Legenda PT-BR', type: 'sub',
    movie : (id)       => `https://vidsrc.me/embed/movie/${id}`,
    tv    : (id, s, e) => `https://vidsrc.me/embed/tv/${id}/${s}/${e}`,
    hasParams: false,
  },
  {
    name: '🔤 Leg 2', label: 'Legenda PT-BR', type: 'sub',
    movie : (id)       => `https://autoembed.cc/movie/tmdb-${id}`,
    tv    : (id, s, e) => `https://autoembed.cc/tv/tmdb-${id}-${s}-${e}`,
    hasParams: false,
  },
  {
    name: '🔤 Leg 3', label: 'Legenda PT-BR', type: 'sub',
    movie : (id)       => `https://vidsrc.cc/v2/embed/movie/${id}`,
    tv    : (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
    hasParams: false,
  },
];
const PLAYER_TIMEOUT_MS = 12000;

/* ══════════════════════════════════════════════
   CATÁLOGO
   ══════════════════════════════════════════════ */
export const CINEMA_CATALOG = {

  /* ─── SÉRIES ─── */
  series: [
    {
      id: 'game_of_thrones', title: 'Game of Thrones', genre: 'Fantasia / Drama', year: '2011–2019',
      desc: 'Famílias nobres lutam pelo Trono de Ferro em Westeros enquanto uma ameaça gelada avança.',
      thumb: 'https://image.tmdb.org/t/p/w500/7WUHnWGx5OrhZUsD6eABpciTp3C.jpg',
      emoji: '👑', color: '#1a1a2e', tmdbId: 1399,
      episodes: [
        { title: 'T1E1 — O Inverno se Aproxima',  ytId: 'bjqUM5SLGzc' },
        { title: 'T1E2 — A Coroa Real',            ytId: 'GgvQLbAMDjE' },
        { title: 'T1E3 — O Caminho Real',          ytId: 'GgvQLbAMDjE' },
        { title: 'T1E4 — A Mão do Rei',            ytId: 'GgvQLbAMDjE' },
        { title: 'T1E5 — O Lobo e o Leão',         ytId: 'GgvQLbAMDjE' },
      ],
    },
    {
      id: 'house_dragon', title: 'A Casa do Dragão', genre: 'Fantasia / Drama', year: '2022–presente',
      desc: 'A prequel de Game of Thrones conta a história da Casa Targaryen e a guerra civil que rasgou Westeros.',
      thumb: 'https://image.tmdb.org/t/p/w500/z2yahl2uefxDCl0nogcRBstwruJ.jpg',
      emoji: '🐉', color: '#8b1a1a', tmdbId: 94997,
      episodes: [
        { title: 'T1E1 — Herdeiros do Dragão',       ytId: 'DotnJ7tTA34' },
        { title: 'T1E2 — O Príncipe Vadio',          ytId: 'DotnJ7tTA34' },
        { title: 'T1E3 — Segundo de Seu Nome',       ytId: 'DotnJ7tTA34' },
        { title: 'T1E4 — O Rei do Estreito e o Mar' ,ytId: 'DotnJ7tTA34' },
        { title: 'T1E5 — Casamos em Segredo',        ytId: 'DotnJ7tTA34' },
      ],
    },
    {
      id: 'arcane', title: 'Arcane', genre: 'Animação / Ação', year: '2021–2024',
      desc: 'As irmãs Vi e Jinx lutam em lados opostos de um conflito que divide a cidade utópica de Piltover.',
      thumb: 'https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg',
      emoji: '⚡', color: '#4a2a7a', tmdbId: 94605,
      episodes: [
        { title: 'T1E1 — Bem-vindo a Piltover',         ytId: 'zrPnBG33nvY' },
        { title: 'T1E2 — Algum Mistério',               ytId: 'zrPnBG33nvY' },
        { title: 'T1E3 — The Base Violence Necessary',  ytId: 'zrPnBG33nvY' },
        { title: 'T1E4 — Adie o Inevitável',            ytId: 'zrPnBG33nvY' },
        { title: 'T1E5 — Problemas Cada Vez Maiores',   ytId: 'zrPnBG33nvY' },
      ],
    },
    {
      id: 'last_of_us', title: 'The Last of Us', genre: 'Drama / Pós-Apocalíptico', year: '2023–presente',
      desc: 'Joel escolta Ellie por uma América devastada por uma infecção fúngica que transformou humanos em monstros.',
      thumb: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
      emoji: '🍄', color: '#2a3a1a', tmdbId: 100088,
      episodes: [
        { title: 'T1E1 — Quando Estamos em Necessidade',  ytId: 'uLtkt8BonwM' },
        { title: 'T1E2 — Infectados',                     ytId: 'uLtkt8BonwM' },
        { title: 'T1E3 — Há Muito Tempo',                 ytId: 'uLtkt8BonwM' },
        { title: 'T1E4 — Por Favor, Segure a Minha Mão', ytId: 'uLtkt8BonwM' },
        { title: 'T1E5 — Resistir e Sobreviver',          ytId: 'uLtkt8BonwM' },
      ],
    },
    {
      id: 'peaky_blinders', title: 'Peaky Blinders', genre: 'Drama / Crime', year: '2013–2022',
      desc: 'A saga da família Shelby, liderada por Tommy Shelby, no submundo criminal da Birmingham pós-Primeira Guerra.',
      thumb: 'https://image.tmdb.org/t/p/w500/vUUqzWa2LnHIVqkaKVn3nyfVpqT.jpg',
      emoji: '🎩', color: '#0a0a14', tmdbId: 60574,
      episodes: [
        { title: 'T1E1 — Episódio 1', ytId: 'oVzOlOekRhI' },
        { title: 'T1E2 — Episódio 2', ytId: 'oVzOlOekRhI' },
        { title: 'T1E3 — Episódio 3', ytId: 'oVzOlOekRhI' },
        { title: 'T1E4 — Episódio 4', ytId: 'oVzOlOekRhI' },
        { title: 'T1E5 — Episódio 5', ytId: 'oVzOlOekRhI' },
      ],
    },
    {
      id: 'severance', title: 'Ruptura', genre: 'Ficção Científica / Suspense', year: '2022–presente',
      desc: 'Funcionários de uma empresa submetem-se a um procedimento que separa completamente as memórias do trabalho das da vida pessoal.',
      thumb: 'https://image.tmdb.org/t/p/w500/sJvZE7OhEYPCQVWA7mKDCnLdcD5.jpg',
      emoji: '🧠', color: '#1a2a3a', tmdbId: 95396,
      episodes: [
        { title: 'T1E1 — Boas-Vindas, Sra. Cobel', ytId: 'xEQP4VVuyrY' },
        { title: 'T1E2 — O Grande Problema',        ytId: 'xEQP4VVuyrY' },
        { title: 'T1E3 — Em Cada Pessoa, um Deus',  ytId: 'xEQP4VVuyrY' },
        { title: 'T1E4 — O Senhor Terrível',         ytId: 'xEQP4VVuyrY' },
        { title: 'T1E5 — Os Caprichos de Cobel',     ytId: 'xEQP4VVuyrY' },
      ],
    },
    {
      id: 'friends', title: 'Friends', genre: 'Comédia', year: '1994–2004',
      desc: 'Seis amigos em Nova York — amor, amizade e muitas risadas.',
      thumb: 'https://image.tmdb.org/t/p/w500/f496cm9enuEsZkSPzCwnTESEK5s.jpg',
      emoji: '☕', color: '#f4a94e', tmdbId: 1668,
      episodes: [
        { title: 'T1E1 — O Pilot',                 ytId: 'hDNNmeeJs1Q' },
        { title: 'T1E2 — A Sondagem',              ytId: 'T7aSBSoPpnI' },
        { title: 'T1E3 — O Encontro às Cegas',     ytId: 'CheY6EGovDk' },
        { title: 'T1E4 — O George Stephanopoulos', ytId: 'b_bHRK4PCTI' },
        { title: 'T1E5 — O East German Laundry',   ytId: 'HtZbmxNEJPY' },
      ],
    },
    {
      id: 'black_mirror', title: 'Black Mirror', genre: 'Ficção Científica', year: '2011–presente',
      desc: 'Episódios independentes sobre o lado sombrio da tecnologia.',
      thumb: 'https://image.tmdb.org/t/p/w500/7PRddO7z7mcPi21nZTCMGShAyy1.jpg',
      emoji: '📱', color: '#1a1a2e', tmdbId: 42009,
      episodes: [
        { title: 'T1E1 — Hino Nacional',              ytId: 'HoHFGEr3gkA' },
        { title: 'T1E2 — Quinze Milhões de Méritos',  ytId: '-UNgFQFxClk' },
        { title: 'T1E3 — Toda a Sua História',        ytId: 'WEtDeVFmEjo' },
        { title: 'T2E1 — Já Volto',                   ytId: 'mwQD7Glkjcw' },
        { title: 'T2E2 — Urso Branco',                ytId: 'U5k_PgPMENo' },
      ],
    },
    {
      id: 'the_office', title: 'The Office', genre: 'Comédia', year: '2005–2013',
      desc: 'O cotidiano hilário de uma empresa de papel em Scranton, Pennsylvania.',
      thumb: 'https://image.tmdb.org/t/p/w500/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg',
      emoji: '📋', color: '#5b8dd9', tmdbId: 2316,
      episodes: [
        { title: 'T1E1 — Piloto',                ytId: 'LHOtME2DL4g' },
        { title: 'T1E2 — Dia da Diversidade',    ytId: 'ywUoIgHBHFU' },
        { title: 'T1E3 — Saúde',                 ytId: 'V9mE41bMYBQ' },
        { title: 'T1E4 — A Aliança',             ytId: 'w5RBFMQLroE' },
        { title: 'T1E5 — Basquete',              ytId: '5W5oQQGSoL4' },
      ],
    },
    {
      id: 'breaking_bad', title: 'Breaking Bad', genre: 'Drama / Suspense', year: '2008–2013',
      desc: 'Um professor de química transforma-se no maior fabricante de metanfetamina.',
      thumb: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      emoji: '🧪', color: '#2d5a27', tmdbId: 1396,
      episodes: [
        { title: 'T1E1 — Piloto',                     ytId: 'HhesaQXLuRY' },
        { title: 'T1E2 — O Gato está no Saco',        ytId: 'JFDVm0LbdEs' },
        { title: 'T1E3 — E o Saco está no Rio',       ytId: 'J5HX-l9oXXc' },
        { title: 'T1E4 — O Homem do Câncer',          ytId: 'tNLTkPMOqjc' },
        { title: 'T1E5 — Matéria Cinza',              ytId: 'JFk2yCnJsS0' },
      ],
    },
    {
      id: 'stranger_things_br', title: 'Stranger Things', genre: 'Ficção / Terror', year: '2016–presente',
      desc: 'Crianças enfrentam forças sobrenaturais numa cidade americana dos anos 80.',
      thumb: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
      emoji: '🌀', color: '#c0392b', tmdbId: 66732,
      episodes: [
        { title: 'T1E1 — O Desaparecimento de Will Byers', ytId: 'sj9J2ecsSpo' },
        { title: 'T1E2 — O Estranho da Maple Street',      ytId: '0O4aBkE2CXk' },
        { title: 'T1E3 — Holly, Jolly',                    ytId: 'V7XRFyMqS6k' },
        { title: 'T1E4 — O Corpo',                         ytId: 'BqiD6xuNtTA' },
        { title: 'T1E5 — A Pulga e o Acrobata',            ytId: 'HMFxSx68hE8' },
      ],
    },
    {
      id: 'dark', title: 'Dark', genre: 'Ficção Científica', year: '2017–2020',
      desc: 'Viagem no tempo, paradoxos e segredos de família numa cidade alemã.',
      thumb: 'https://image.tmdb.org/t/p/w500/apbrbWs5wheR0KSh60WPee3DoMB.jpg',
      emoji: '🌑', color: '#0d0d1a', tmdbId: 70523,
      episodes: [
        { title: 'T1E1 — Segredos',           ytId: 'rrwycJ08PSQ' },
        { title: 'T1E2 — Mentiras',           ytId: 'Fp2bG0VcCBI' },
        { title: 'T1E3 — Passado e Presente', ytId: 'bpJoZcmECVE' },
        { title: 'T1E4 — Dupla Vida',         ytId: 'X6sJRVCh9W8' },
        { title: 'T1E5 — Verdades',           ytId: 'SYyRKSvTLpA' },
      ],
    },
    {
      id: 'wednesday', title: 'Wednesday', genre: 'Comédia / Terror', year: '2022–presente',
      desc: 'Wednesday Addams investiga crimes sobrenaturais na Academia Nevermore.',
      thumb: 'https://image.tmdb.org/t/p/w500/9PFonBhy4cQy7Q51uActe8M0aR7.jpg',
      emoji: '🖤', color: '#1a0a1a', tmdbId: 119051,
      episodes: [
        { title: 'T1E1 — Filho de Quarta-Feira',              ytId: 'Di310WS8zLk' },
        { title: 'T1E2 — Ai de Mim, o Número Mais Solitário', ytId: 'qwlTjEr16Mg' },
        { title: 'T1E3 — Amigo ou Inimigo',                   ytId: 'RlpRpSl_OaQ' },
        { title: 'T1E4 — Ai de Mim, Que Noite',              ytId: 'j4GNfQdNgKI' },
        { title: 'T1E5 — Colhe-se o Que se Planta',          ytId: 'QJdS8rXrFSI' },
      ],
    },
    {
      id: 'squid_game', title: 'Round 6', genre: 'Drama / Suspense', year: '2021–presente',
      desc: 'Pessoas endividadas competem em jogos infantis mortais por um prêmio enorme.',
      thumb: 'https://image.tmdb.org/t/p/w500/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg',
      emoji: '🦑', color: '#e8536f', tmdbId: 93405,
      episodes: [
        { title: 'T1E1 — Luz Vermelha, Luz Verde',        ytId: 'oqxAJKy0ii4' },
        { title: 'T1E2 — Inferno',                        ytId: 'tBFOosxAlcU' },
        { title: 'T1E3 — O Homem com o Guarda-Chuva',    ytId: 'yTqrBCBGmBA' },
        { title: 'T1E4 — Mantenha-se no Time',            ytId: 'fSEHGM7Wdoo' },
        { title: 'T1E5 — Um Mundo Justo',                 ytId: '5dpFM1SWGgU' },
      ],
    },
    {
      id: 'euphoria', title: 'Euphoria', genre: 'Drama', year: '2019–presente',
      desc: 'A vida turbulenta de um grupo de adolescentes lidando com drogas, relacionamentos e identidade.',
      thumb: 'https://image.tmdb.org/t/p/w500/jtnfNzqZwN4E32FYePieblpg2bk.jpg',
      emoji: '💊', color: '#4a1a6e', tmdbId: 85552,
      episodes: [
        { title: 'T1E1 — Piloto', ytId: '4GOKKRxKlqo' },
        { title: 'T1E2 — Stuntin\' Like My Daddy', ytId: '4GOKKRxKlqo' },
        { title: 'T1E3 — Made You Look', ytId: '4GOKKRxKlqo' },
        { title: 'T1E4 — Shook Ones Pt. II', ytId: '4GOKKRxKlqo' },
        { title: 'T1E5 — \'03 Bonnie & Clyde', ytId: '4GOKKRxKlqo' },
      ],
    },
    {
      id: 'succession', title: 'Succession', genre: 'Drama / Comédia', year: '2018–2023',
      desc: 'A família Roy batalha pelo controle do maior conglomerado de mídia do mundo.',
      thumb: 'https://image.tmdb.org/t/p/w500/7HW47XbkNQ5fiwQFYGWdw9gs144.jpg',
      emoji: '💼', color: '#1a1a14', tmdbId: 76331,
      episodes: [
        { title: 'T1E1 — Piloto', ytId: 'OqPBz6GIJAM' },
        { title: 'T1E2 — Masculinidade Frágil', ytId: 'OqPBz6GIJAM' },
        { title: 'T1E3 — Lifeboats', ytId: 'OqPBz6GIJAM' },
        { title: 'T1E4 — Qual é a Situação?', ytId: 'OqPBz6GIJAM' },
        { title: 'T1E5 — I Went to Market', ytId: 'OqPBz6GIJAM' },
      ],
    },
  ],

  /* ─── FILMES ─── */
  filmes: [
    /* — Lançamentos 2025 — */
    { id:'f_capitao5',      title:'Capitão América: Admirável Mundo Novo', genre:'Ação / Ficção Científica', year:'2025', desc:'Sam Wilson assume o escudo e enfrenta ameaças globais como o novo Capitão América.',                    emoji:'🛡️', color:'#1a3a6e', tmdbId:822119,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/pzIddUEMWhWzfvLI3TwxUG2wGoi.jpg` },
    { id:'f_quarteto',      title:'Quarteto Fantástico: Primeiros Passos', genre:'Ação / Ficção Científica', year:'2025', desc:'Os Quatro Fantásticos surgem como os maiores heróis do planeta.',                                    emoji:'🔥', color:'#1a3a6e', tmdbId:1411196, type:'movie', thumb:`https://image.tmdb.org/t/p/w500/ngl2FKBlU4fhbdsrtdom9LVLBXw.jpg` },
    { id:'f_jwrecomecos',    title:'Jurassic World: Recomeço',              genre:'Aventura / Ficção',        year:'2025', desc:'Uma nova era de dinossauros começa quando a humanidade tenta recolonizar seu território.',             emoji:'🦕', color:'#1a4a1a', tmdbId:1157750, type:'movie', thumb:`https://image.tmdb.org/t/p/w500/oAiL7XpMTHiKdSBqR9HMWUQ8jJD.jpg` },
    { id:'f_bailarina',     title:'Bailarina',                             genre:'Ação / Thriller',          year:'2025', desc:'Uma assassina do universo de John Wick busca vingança por sua família.',                             emoji:'💃', color:'#1a1a2e', tmdbId:573435,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/lgqSZCUYkiDSLVJcqWdPQHQgDjn.jpg` },
    { id:'f_mi_final',      title:'Missão: Impossível – O Acerto Final',   genre:'Ação / Espionagem',        year:'2025', desc:'Ethan Hunt enfrenta sua missão mais perigosa e pessoal de toda a carreira.',                         emoji:'💣', color:'#0a0a1a', tmdbId:575265,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/z53D72EAOxGRqdr7KXXWp9dJiDe.jpg` },
    { id:'f_panico7',       title:'Pânico 7',                              genre:'Terror / Suspense',        year:'2025', desc:'O legado de Ghostface retorna com novos sustos e reviravoltas inesperadas.',                         emoji:'👻', color:'#8b0000', tmdbId:1100782, type:'movie', thumb:`https://image.tmdb.org/t/p/w500/2zmTngn1tYC1AvfnrFLhxeD82hz.jpg` },
    { id:'f_branca_neve',   title:'Branca de Neve',                        genre:'Fantasia / Aventura',      year:'2025', desc:'A clássica princesa Disney em uma aventura live-action mágica e cheia de cor.',                     emoji:'🍎', color:'#8b0000', tmdbId:698687,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/okBrIDMkEXjQ9xK4pLfm3cHkXXr.jpg` },
    { id:'f_comotreinar',   title:'Como Treinar o Seu Dragão',             genre:'Aventura / Fantasia',      year:'2025', desc:'A história épica de Soluço e Banguela reimaginada em live-action deslumbrante.',                  emoji:'🐉', color:'#2a3a5c', tmdbId:1184918, type:'movie', thumb:`https://image.tmdb.org/t/p/w500/q8eejQcg1bAqImEV8jh2RtFF3sT.jpg` },
    /* — Lançamentos 2024 — */
    { id:'f_wicked',        title:'Wicked',                                genre:'Musical / Fantasia',       year:'2024', desc:'Elphaba e Glinda se encontram na Universidade de Shiz e vivem uma amizade improvável.',              emoji:'🧹', color:'#2a0a3a', tmdbId:402431,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/xszTbOuTKhVm3Lm0sQjMbPpMjOR.jpg` },
    { id:'f_moana2',        title:'Moana 2',                               genre:'Animação / Aventura',      year:'2024', desc:'Moana parte em uma nova jornada oceânica para encontrar um reino perdido de Maui.',                emoji:'🌊', color:'#1a4a6e', tmdbId:1241982, type:'movie', thumb:`https://image.tmdb.org/t/p/w500/aLVkiINlIeCkcZIzb7XHzPYgO6L.jpg` },
    { id:'f_gladiador2',    title:'Gladiador II',                          genre:'Ação / Drama',             year:'2024', desc:'Lúcio luta para sobreviver em Roma enquanto dois tiranos controlam o Império.',                    emoji:'⚔️', color:'#6e3a1a', tmdbId:558449,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/2cxhvwyE0RYfnm5YXH8YPUXM2AC.jpg` },
    { id:'f_sonic3',        title:'Sonic 3: O Filme',                      genre:'Ação / Aventura',          year:'2024', desc:'Sonic, Tails e Knuckles enfrentam Shadow, um adversário misterioso e poderoso.',                   emoji:'💨', color:'#1a3a7a', tmdbId:939243,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/d8Ryb8AunYAuycVKDp5HpdWPKgC.jpg` },
    { id:'f_mufasa',        title:'Mufasa: O Rei Leão',                    genre:'Animação / Aventura',      year:'2024', desc:'A história de origem de Mufasa, pai de Simba, revelada em uma saga épica.',                       emoji:'🦁', color:'#8b6914', tmdbId:762441,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/lurEK87kukWNaHd0zYnsi3yzJrs.jpg` },
    { id:'f_robo_selvagem', title:'O Robô Selvagem',                       genre:'Animação / Drama',         year:'2024', desc:'Um robô náufrago aprende a sobreviver na natureza selvagem e cria um filhote de ganso.',          emoji:'🤖', color:'#2a4a2a', tmdbId:1091273, type:'movie', thumb:`https://image.tmdb.org/t/p/w500/wTnV3PCVW5O92JMrFvvrRcV39RU.jpg` },
    { id:'f_alien_romulus', title:'Alien: Romulus',                        genre:'Terror / Ficção',          year:'2024', desc:'Jovens colonizadores exploram uma estação espacial abandonada e encontram um horror antigo.',      emoji:'👾', color:'#0a1a0a', tmdbId:945961,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/b33nnKl1GSFbao4l3fZDDqsMx0F.jpg` },
    { id:'f_beetlejuice2',  title:'Beetlejuice Beetlejuice',               genre:'Comédia / Terror',         year:'2024', desc:'A família Deetz retorna à casa assombrada e acidentalmente invoca Beetlejuice novamente.',          emoji:'🕷️', color:'#1a3a1a', tmdbId:917496,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/bAg8AnPQFBGAhWGZDJnV9B5CJKN.jpg` },
    { id:'f_venom3',        title:'Venom: A Última Rodada',                genre:'Ação / Ficção Científica', year:'2024', desc:'Eddie Brock e Venom enfrentam sua batalha final contra forças além da compreensão.',                emoji:'🕷️', color:'#1a1a1a', tmdbId:912649,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/aosm8NMQ3UyoBVpSxyimorCQykC.jpg` },
    { id:'f_substancia',    title:'A Substância',                          genre:'Terror / Drama',           year:'2024', desc:'Uma mulher usa uma substância misteriosa para criar uma versão mais jovem de si mesma.',            emoji:'💉', color:'#8b0000', tmdbId:933260,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/lqoMzCcZYEFK729d6qzt349fB4o.jpg` },
    { id:'f_deadpool3',     title:'Deadpool & Wolverine',                  genre:'Ação / Comédia',           year:'2024', desc:'Deadpool recruta Wolverine para uma missão multiversal caótica e hilarante.',                       emoji:'⚔️', color:'#8b0000', tmdbId:533535,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg` },
    { id:'f_malvado4',      title:'Meu Malvado Favorito 4',                genre:'Animação / Comédia',       year:'2024', desc:'Gru enfrenta um novo vilão enquanto tenta equilibrar sua vida de pai e espião.',                   emoji:'🍌', color:'#f4c430', tmdbId:969492,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/wWba3TaojhK7NdycyUk1i5CaxEg.jpg` },
    { id:'f_divertida2',    title:'Divertida Mente 2',                     genre:'Animação / Drama',         year:'2024', desc:'Riley cresce e novas emoções chegam para complicar tudo na Sala de Controle.',                    emoji:'😊', color:'#ff6b35', tmdbId:1022789, type:'movie', thumb:`https://image.tmdb.org/t/p/w500/oxxniUBjOOPBTVJMJVXHSFGCmwr.jpg` },
    { id:'f_badboys4',      title:'Bad Boys: Até o Fim',                   genre:'Ação / Comédia',           year:'2024', desc:'Mike e Marcus voltam para mais uma missão cheia de adrenalina e humor.',                         emoji:'🚔', color:'#1a1a3a', tmdbId:615656,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/oGythE98MYleE6mZlTs5NeF9So3.jpg` },
    { id:'f_furiosa',       title:'Furiosa: Uma Saga Mad Max',             genre:'Ação / Aventura',          year:'2024', desc:'A origem da guerreira Furiosa em um mundo pós-apocalíptico implacável.',                          emoji:'🏜️', color:'#8b4513', tmdbId:786892,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/iADOJ8Zymht2JPMoy3R7xceZprc.jpg` },
    { id:'f_planetamac',    title:'Planeta dos Macacos: O Reinado',        genre:'Ficção Científica / Ação', year:'2024', desc:'Uma nova geração de macacos constrói sua civilização enquanto humanos sobrevivem na sombra.',      emoji:'🦍', color:'#2a4a2a', tmdbId:653346,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/gKkl37BQuKTanygYQG1pyYgLVgf.jpg` },
    { id:'f_godzilla',      title:'Godzilla e Kong: O Novo Império',       genre:'Ação / Ficção Científica', year:'2024', desc:'Dois titãs se unem para enfrentar uma ameaça colossal que surge das profundezas da Terra.',        emoji:'🦖', color:'#1a3a1a', tmdbId:823464,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg` },
    { id:'f_kungfu4',       title:'Kung Fu Panda 4',                       genre:'Animação / Aventura',      year:'2024', desc:'Po precisa encontrar um novo Guerreiro Dragão enquanto enfrenta uma vilã chamada Camaleoa.',      emoji:'🐼', color:'#2a2a1a', tmdbId:1011985, type:'movie', thumb:`https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg` },
    { id:'f_duna2',         title:'Duna: Parte Dois',                      genre:'Ficção Científica / Épico',year:'2024', desc:'Paul Atreides une-se aos Fremen para vingar sua família e garantir o futuro de Arrakis.',          emoji:'🏜️', color:'#8b6914', tmdbId:693134,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg` },
    { id:'f_ghostbusters',  title:'Ghostbusters: Apocalipse de Gelo',      genre:'Comédia / Aventura',       year:'2024', desc:'Os Caça-Fantasmas enfrentam uma ameaça gelada que pode congelar o mundo.',                       emoji:'👻', color:'#2a5c8e', tmdbId:967847,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/sg4xJaufDiQl7caFEskBtQXfD4x.jpg` },
    /* — Clássicos — */
    { id:'f_coringa2',      title:'Coringa: Delírio a Dois',               genre:'Drama / Musical',          year:'2024', desc:'Arthur Fleck encontra o amor e sua própria loucura em Arkham Asylum.',                             emoji:'🃏', color:'#1a1a2e', tmdbId:1058694, type:'movie', thumb:`https://image.tmdb.org/t/p/w500/wqnLdwVXoBjKibFRR5U3y0aDUhs.jpg` },
    { id:'titanic',         title:'Titanic',                               genre:'Romance / Drama',          year:'1997', desc:'Um amor impossível entre Jack e Rose no naufrágio do Titanic.',                                 emoji:'🚢', color:'#1a3a5c', tmdbId:597,     type:'movie', thumb:`https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg` },
    { id:'interstellar',    title:'Interestelar',                          genre:'Ficção Científica / Drama', year:'2014', desc:'Um ex-piloto viaja além da galáxia para salvar a humanidade.',                                emoji:'🪐', color:'#0a0a2e', tmdbId:157336,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg` },
    { id:'inception',       title:'A Origem',                              genre:'Ficção Científica / Ação', year:'2010', desc:'Um ladrão especializado em roubar segredos dos sonhos recebe uma missão impossível.',           emoji:'🌀', color:'#1a2a4a', tmdbId:27205,   type:'movie', thumb:`https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg` },
    { id:'forrest_gump',    title:'Forrest Gump',                          genre:'Drama / Comédia',          year:'1994', desc:'A vida extraordinária de um homem simples que cruza momentos históricos dos EUA.',             emoji:'🏃', color:'#4a6741', tmdbId:13,      type:'movie', thumb:`https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg` },
    { id:'top_gun',         title:'Top Gun: Maverick',                     genre:'Ação / Drama',             year:'2022', desc:'Maverick retorna para treinar uma nova geração de pilotos de elite da Marinha.',               emoji:'✈️', color:'#1c3a5e', tmdbId:361743,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg` },
    { id:'la_la_land',      title:'La La Land: Cantando Estações',         genre:'Romance / Musical',        year:'2016', desc:'Mia e Sebastian sonham com seus futuros enquanto se apaixonam em Los Angeles.',                 emoji:'🌟', color:'#590d22', tmdbId:313369,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg` },
    { id:'frozen',          title:'Frozen: Uma Aventura Congelante',       genre:'Animação / Fantasia',      year:'2013', desc:'Anna embarca numa jornada épica para encontrar sua irmã Elsa e descongelar o reino.',           emoji:'❄️', color:'#2980b9', tmdbId:109445,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/kgwjIb2JDHRhNk13lmSxiClFjVk.jpg` },
    { id:'f_poor_things',   title:'Pobres Criaturas',                      genre:'Drama / Fantasia',         year:'2023', desc:'Bella Baxter é ressuscitada com o cérebro de sua filha e explora o mundo sem inibições.',         emoji:'⚗️', color:'#5c2a4a', tmdbId:792307,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/kCGlIMHnOm8JPXIf6bRg5tFiQSx.jpg` },
    { id:'f_oppenheimer',   title:'Oppenheimer',                           genre:'Drama / Biografia',        year:'2023', desc:'A história do físico que liderou o projeto que criou a primeira bomba atômica.',                   emoji:'☢️', color:'#1a1a0a', tmdbId:872585,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg` },
    { id:'f_barbie',        title:'Barbie',                                genre:'Comédia / Fantasia',       year:'2023', desc:'Barbie parte para o mundo real após existencial crise no mundo perfeito de Barbieland.',          emoji:'💗', color:'#ff69b4', tmdbId:346698,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/iuFNMS8vlzsOrz4G1uNoia5YXIW.jpg` },
    { id:'f_guardioes3',    title:'Guardiões da Galáxia Vol. 3',           genre:'Ação / Ficção',            year:'2023', desc:'Peter Quill e os Guardiões partem para proteger Rocket e enfrentar seu passado.',                 emoji:'🦝', color:'#2a1a5c', tmdbId:447277,  type:'movie', thumb:`https://image.tmdb.org/t/p/w500/r2J02Z6HecO8mLxbOMVbIBKHMdR.jpg` },
  ],

  /* ─── ROMANCE (30) ─── */
  romance: [
    { id:'r_orgulho',      title:'Orgulho e Preconceito',                    genre:'Romance / Drama',     year:'2005', desc:'Elizabeth Bennet e o orgulhoso Sr. Darcy num clássico do amor de época.',                        emoji:'🌹', color:'#5c3d2e', tmdbId:4348,   type:'movie', thumb:'https://image.tmdb.org/t/p/w500/hQ4pYsIbP22TMXOUdSfC2mjWrO0.jpg' },
    { id:'r_culpa',        title:'A Culpa é das Estrelas',                   genre:'Romance / Drama',     year:'2014', desc:'Dois jovens com câncer se apaixonam e embarcam numa jornada especial.',                          emoji:'⭐', color:'#2a5a7c', tmdbId:222935, type:'movie', thumb:'https://image.tmdb.org/t/p/w500/gGmNQJeHZQsQvHBmtYBPO4GQD1v.jpg' },
    { id:'r_era_antes',    title:'Como Eu Era Antes de Você',                genre:'Romance / Drama',     year:'2016', desc:'Louisa Clark e Will Traynor: um amor que muda tudo e deixa marcas para sempre.',                 emoji:'💛', color:'#e8a020', tmdbId:296096, type:'movie', thumb:'https://image.tmdb.org/t/p/w500/8vSGCvJ7ByT8AG5YDFAurm5XAOL.jpg' },
    { id:'r_simon',        title:'Com Amor, Simon',                          genre:'Romance / Comédia',   year:'2018', desc:'Simon guarda um segredo enorme e se apaixona por alguém que não conhece.',                       emoji:'💌', color:'#e8536f', tmdbId:449176, type:'movie', thumb:'https://image.tmdb.org/t/p/w500/n5JoCHmiuGnbHWbm56hB4nLHSSA.jpg' },
    { id:'r_garotos',      title:'Para Todos os Garotos que Já Amei',        genre:'Romance',             year:'2018', desc:'Lara Jean vê suas cartas secretas serem enviadas para todos os seus amores.',                   emoji:'💝', color:'#c0392b', tmdbId:466282, type:'movie', thumb:'https://image.tmdb.org/t/p/w500/vfLkSEHjJ4eGpXGZFGAqrLGJBqb.jpg' },
    { id:'r_500dias',      title:'500 Dias com Ela',                         genre:'Romance / Comédia',   year:'2009', desc:'Tom narra os 500 dias do seu relacionamento com a imprevisível Summer.',                        emoji:'📅', color:'#4a6fa5', tmdbId:19913,  type:'movie', thumb:'https://image.tmdb.org/t/p/w500/5WJnpYDsM5fgbepSh4CfLqSjmLJ.jpg' },
    { id:'r_antes_aman',   title:'Antes do Amanhecer',                       genre:'Romance',             year:'1995', desc:'Jesse e Céline se conhecem num trem e passam uma noite inesquecível em Viena.',                 emoji:'🌅', color:'#e8a060', tmdbId:76,     type:'movie', thumb:'https://image.tmdb.org/t/p/w500/aUXM7WoRimFrCmurZvnV2T7xOXM.jpg' },
    { id:'r_antes_sol',    title:'Antes do Pôr do Sol',                      genre:'Romance',             year:'2004', desc:'Jesse e Céline se reencontram em Paris nove anos depois de sua noite em Viena.',               emoji:'🌇', color:'#b05a20', tmdbId:80,     type:'movie', thumb:'https://image.tmdb.org/t/p/w500/hhSTwq8CpecshJnBnMzCoRWKG0C.jpg' },
    { id:'r_antes_meia',   title:'Antes da Meia-Noite',                      genre:'Romance / Drama',     year:'2013', desc:'Jesse e Céline, agora juntos, enfrentam a realidade de um amor maduro.',                       emoji:'🌙', color:'#1a3a5c', tmdbId:132344, type:'movie', thumb:'https://image.tmdb.org/t/p/w500/r9UpQtFCiMnxfhJDlhFLKh0nAfP.jpg' },
    { id:'r_questao',      title:'Questão de Tempo',                         genre:'Romance / Fantasia',  year:'2013', desc:'Tim descobre que pode viajar no tempo e decide usar o poder para encontrar o amor.',            emoji:'⏰', color:'#2a7a5c', tmdbId:122906, type:'movie', thumb:'https://image.tmdb.org/t/p/w500/1ziDBVBthJkMOXXNmCJVlsRkxR8.jpg' },
    { id:'r_amor_rec',     title:'Um Amor para Recordar',                    genre:'Romance / Drama',     year:'2002', desc:'Landon, um rebelde, muda de vida ao se apaixonar pela filha do pastor.',                       emoji:'🕊️', color:'#5c4a2e', tmdbId:10229,  type:'movie', thumb:'https://image.tmdb.org/t/p/w500/75KHQeHcRDEFjLVMWBWzFRyI8IE.jpg' },
    { id:'r_10coisas',     title:'10 Coisas que Odeio em Você',              genre:'Romance / Comédia',   year:'1999', desc:'Patrick precisa conquistar a antipática Kat para que o irmão possa namorar.',                  emoji:'😤', color:'#7a5c2e', tmdbId:4951,   type:'movie', thumb:'https://image.tmdb.org/t/p/w500/xnGWFbJQXnDSaDCRNriDxJN6Dfl.jpg' },
    { id:'r_brilho',       title:'Brilho Eterno de uma Mente sem Lembranças',genre:'Romance / Drama',     year:'2004', desc:'Joel e Clementine apagam as memórias um do outro — mas o coração não esquece.',                emoji:'🧠', color:'#1a3a6e', tmdbId:38,     type:'movie', thumb:'https://image.tmdb.org/t/p/w500/5MwkWH9tYHv3oWtXOX7mHQD5lsV.jpg' },
    { id:'r_lado_bom',     title:'O Lado Bom da Vida',                       genre:'Romance / Comédia',   year:'2012', desc:'Pat e Tiffany encontram um ao outro enquanto lidam com seus problemas.',                       emoji:'☀️', color:'#c07820', tmdbId:82693,  type:'movie', thumb:'https://image.tmdb.org/t/p/w500/lMkKHB0MVHB2hBHhJjDhpwYvG2p.jpg' },
    { id:'r_ela',          title:'Ela',                                      genre:'Romance / Drama',     year:'2013', desc:'Theodore se apaixona por Samantha, uma inteligência artificial com voz sedutora.',             emoji:'🤖', color:'#c04a20', tmdbId:152601, type:'movie', thumb:'https://image.tmdb.org/t/p/w500/eCOtqtfvn7mxGaoDfGZLBBgkczg.jpg' },
    { id:'r_teoria',       title:'A Teoria de Tudo',                         genre:'Biografia / Romance', year:'2014', desc:'A história de amor entre Stephen Hawking e Jane Wilde contra todas as adversidades.',          emoji:'🌌', color:'#0a2a5c', tmdbId:266856, type:'movie', thumb:'https://image.tmdb.org/t/p/w500/6mFpPVBHJCZBBv1O6OmGLEi4WBv.jpg' },
    { id:'r_sol_meia',     title:'Sol da Meia-Noite',                        genre:'Romance / Drama',     year:'2018', desc:'Katie tem uma doença rara que a impede de sair ao sol — até conhecer Charlie.',                emoji:'🌞', color:'#e8a820', tmdbId:400650, type:'movie', thumb:'https://image.tmdb.org/t/p/w500/hU0QnMRVoJXlVEBBnFHPe9ykZaD.jpg' },
    { id:'r_se_ficar',     title:'Se Eu Ficar',                              genre:'Romance / Drama',     year:'2014', desc:'Mia tem uma escolha impossível: partir ou ficar por tudo que ama.',                           emoji:'🎻', color:'#3a5a6e', tmdbId:102651, type:'movie', thumb:'https://image.tmdb.org/t/p/w500/1Sqw7WDEBzUBZKJWvnMsKPMN2jx.jpg' },
    { id:'r_5passos',      title:'A Cinco Passos de Você',                   genre:'Romance / Drama',     year:'2019', desc:'Stella e Will se apaixonam no hospital, mas a regra dos 5 passos os separa.',                 emoji:'👣', color:'#5c7a8e', tmdbId:527641, type:'movie', thumb:'https://image.tmdb.org/t/p/w500/5WxSCFCMqGMoAMPzHtWFqAkS3HM.jpg' },
    { id:'r_viajante',     title:'A Mulher do Viajante do Tempo',            genre:'Romance / Ficção',    year:'2009', desc:'Henry viaja no tempo involuntariamente — mas seu amor por Clare é constante.',                emoji:'⏳', color:'#4a2a6e', tmdbId:2493,   type:'movie', thumb:'https://image.tmdb.org/t/p/w500/ytf0uJKOsoOXAGOqU0MpFvEEtmB.jpg' },
    { id:'r_amor_prova',   title:'Amor a Toda Prova',                        genre:'Romance / Comédia',   year:'2011', desc:'Cal aprende a conquistar mulheres, mas o amor verdadeiro está mais perto do que imagina.',    emoji:'😎', color:'#2a4a5c', tmdbId:50646,  type:'movie', thumb:'https://image.tmdb.org/t/p/w500/1qB4qiAONIImikTTbIZHJvT3qVi.jpg' },
    { id:'r_ferias',       title:'O Amor Não Tira Férias',                   genre:'Romance / Comédia',   year:'2006', desc:'Duas mulheres trocam de casa e encontram o amor inesperadamente.',                            emoji:'🏠', color:'#7a5c3e', tmdbId:1581,   type:'movie', thumb:'https://image.tmdb.org/t/p/w500/rFoJeWNLCMzFbzUIWVBXkFMzNlF.jpg' },
    { id:'r_notting',      title:'Um Lugar Chamado Notting Hill',            genre:'Romance / Comédia',   year:'1999', desc:'Um livreiro comum se apaixona pela maior estrela de Hollywood.',                              emoji:'🎭', color:'#4a3a2e', tmdbId:509,    type:'movie', thumb:'https://image.tmdb.org/t/p/w500/aGCqDCgmBNEoP0g9dlyLarxSJd1.jpg' },
    { id:'r_linda',        title:'Uma Linda Mulher',                         genre:'Romance / Comédia',   year:'1990', desc:'Um milionário contrata uma garota de programa e acaba se apaixonando por ela.',               emoji:'💎', color:'#8e2a5c', tmdbId:114,    type:'movie', thumb:'https://image.tmdb.org/t/p/w500/ggAtGQwDIjzKFgKQkKxDnlMlOiH.jpg' },
    { id:'r_simplesmente', title:'Simplesmente Amor',                        genre:'Romance / Comédia',   year:'2003', desc:'Dez histórias de amor entrelaçadas em Londres nas vésperas do Natal.',                        emoji:'❤️', color:'#c0392b', tmdbId:508,    type:'movie', thumb:'https://image.tmdb.org/t/p/w500/w0nBMoXnWGnMTGaqiVTVGmiMbAv.jpg' },
    { id:'r_bridget',      title:'O Diário de Bridget Jones',                genre:'Romance / Comédia',   year:'2001', desc:'Bridget Jones documenta sua vida amorosa e suas tentativas de encontrar o homem certo.',     emoji:'📓', color:'#7a3a5c', tmdbId:19585,  type:'movie', thumb:'https://image.tmdb.org/t/p/w500/5KPQUqEa3fZkLpAh2FVivNQUaGX.jpg' },
    { id:'r_chame_nome',   title:'Me Chame pelo Seu Nome',                   genre:'Romance / Drama',     year:'2017', desc:'No verão de 1983 na Itália, Elio e Oliver vivem um amor intenso e inesquecível.',            emoji:'☀️', color:'#c07820', tmdbId:398818, type:'movie', thumb:'https://image.tmdb.org/t/p/w500/4dKF0xRYaZSmWC45BCJ3aFXP8tX.jpg' },
    { id:'r_diario',       title:'Diário de uma Paixão',                     genre:'Romance / Drama',     year:'2004', desc:'Noah e Allie vivem um amor que resiste ao tempo e às diferenças sociais.',                   emoji:'📖', color:'#7a3045', tmdbId:11036,  type:'movie', thumb:'https://image.tmdb.org/t/p/w500/qom1SZSENdmHFNZBXbtLqUFbn3s.jpg' },
    { id:'r_val_dia',      title:'Dia dos Namorados',                        genre:'Romance / Comédia',   year:'2010', desc:'Muitas histórias de amor que se cruzam em Los Angeles no Dia dos Namorados.',               emoji:'💖', color:'#c06080', tmdbId:32657,  type:'movie', thumb:'https://image.tmdb.org/t/p/w500/vEfAxRYgOC0KLFkXHJLBPHqFB22.jpg' },
    { id:'r_para_sempre',  title:'Para Sempre',                              genre:'Romance / Fantasia',  year:'2010', desc:'Um casal separado pela morte encontra uma forma de reencontro além do mundo físico.',         emoji:'👻', color:'#5c3d7a', tmdbId:80278,  type:'movie', thumb:'https://image.tmdb.org/t/p/w500/wJJkmbRPXQcYiVf8JJuGiHQPEUG.jpg' },
    { id:'r_padrao',       title:'A Lenda de Tristão e Isolda',              genre:'Romance / Aventura',  year:'2006', desc:'Um cavaleiro e uma princesa vivem um amor proibido na Inglaterra medieval.',                  emoji:'🌿', color:'#2a5c3a', tmdbId:8265,   type:'movie', thumb:'https://image.tmdb.org/t/p/w500/tvDRr2fywOvpH2QGsHXHvI39OEXI.jpg' },
  ],

  /* ─── DORAMAS (25) ─── */
  doramas: [
    { id:'d_pousando',    title:'Pousando no Amor',                   genre:'Romance / Drama',    year:'2019–2020', desc:'Uma herdeira sul-coreana pousa de paraquedas na Coreia do Norte e se apaixona por um oficial.',  emoji:'🪂', color:'#2a5c8e', tmdbId:94796,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/0JiVFF6EXDntTdGiCMv2WHaHMOY.jpg' },
    { id:'d_pretendente', title:'Pretendente Surpresa',               genre:'Romance / Comédia',  year:'2023',      desc:'Uma CEO exigente aceita participar de um reality de casamento por acidente.',                    emoji:'💍', color:'#8e4a5c', tmdbId:154825, type:'series', thumb:'https://image.tmdb.org/t/p/w500/mVn7WiLo2VXIniKMlGRvLEPDxjt.jpg' },
    { id:'d_my_demon',    title:'Meu Demônio',                        genre:'Romance / Fantasia', year:'2023',      desc:'Uma mulher poderosa estabelece um contrato com um demônio e os dois descobrem algo inesperado.',  emoji:'😈', color:'#2a0a3a', tmdbId:225796, type:'series', thumb:'https://image.tmdb.org/t/p/w500/9vLiOJBHdX4K8r4Lc2H1wOH4JDo.jpg' },
    { id:'d_beleza',      title:'Beleza Verdadeira',                  genre:'Romance / Comédia',  year:'2020–2021', desc:'Jugyeong usa maquiagem para esconder inseguranças e vive um triângulo amoroso.',               emoji:'💄', color:'#c06080', tmdbId:112470, type:'series', thumb:'https://image.tmdb.org/t/p/w500/hA6KH04pZKiEfOkMqRGVSJhIVW2.jpg' },
    { id:'d_goblin',      title:'Goblin: O Solitário e Grande Deus',  genre:'Romance / Fantasia', year:'2016–2017', desc:'Um goblin imortal busca uma noiva que ponha fim à sua vida e encontra o amor.',               emoji:'🕯️', color:'#3a2a5c', tmdbId:67915,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/mYsOdnCONHHUGgBDrGADwJhKV6c.jpg' },
    { id:'d_mesmo',       title:'Mesmo Assim',                        genre:'Romance / Drama',    year:'2021',      desc:'Yoo Na-bi e Park Jae-eon vivem uma atração complicada entre amizade e amor.',                 emoji:'🌸', color:'#c07890', tmdbId:125910, type:'series', thumb:'https://image.tmdb.org/t/p/w500/8xQs6LhYP56pPFKBYKZQ6VpHqVb.jpg' },
    { id:'d_descendentes',title:'Descendentes do Sol',                genre:'Romance / Ação',     year:'2016',      desc:'Um capitão do exército se apaixona por uma médica no meio de uma zona de conflito.',           emoji:'🪖', color:'#4a6a3a', tmdbId:66330,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/3FxKOxzG6JeHAJm5x4EMZN7LgvO.jpg' },
    { id:'d_estrelas',    title:'Meu Amor das Estrelas',              genre:'Romance / Ficção',   year:'2013–2014', desc:'Um alienígena que viveu na Terra por 400 anos se apaixona por uma atriz famosa.',             emoji:'🌠', color:'#1a2a4e', tmdbId:60783,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/tBIiJ0G0xkuqMpNMKKxq8I1C7IW.jpg' },
    { id:'d_vinte',       title:'Vinte e Cinco Vinte e Um',           genre:'Romance / Drama',    year:'2022',      desc:'Uma esgrimista e um jornalista se encontram em momentos diferentes de suas vidas.',           emoji:'🤺', color:'#2a5a7c', tmdbId:156933, type:'series', thumb:'https://image.tmdb.org/t/p/w500/8pOK63vGIL3pjVQVuTVmEPqgbf9.jpg' },
    { id:'d_verao',       title:'Nosso Eterno Verão',                 genre:'Romance',            year:'2021',      desc:'Dois jovens se reconectam após anos e redescobrem os sentimentos que tinham.',               emoji:'🌻', color:'#e8a020', tmdbId:135655, type:'series', thumb:'https://image.tmdb.org/t/p/w500/oSTnQG95M4NJDwKCfOhAJFMsKUi.jpg' },
    { id:'d_hometown',    title:'Hometown Cha-Cha-Cha',               genre:'Romance / Comédia',  year:'2021',      desc:'Uma dentista se muda para uma cidade litorânea e se apaixona pelo faz-tudo da vila.',          emoji:'🌊', color:'#2a7a8e', tmdbId:130392, type:'series', thumb:'https://image.tmdb.org/t/p/w500/mMKCIGFoJRpSFOWMDMWJBpJQ7UF.jpg' },
    { id:'d_startup',     title:'Start-Up',                           genre:'Romance / Drama',    year:'2020',      desc:'Jovens perseguem seus sonhos no Vale do Silício coreano e se apaixonam.',                      emoji:'💻', color:'#4a3a7a', tmdbId:111453, type:'series', thumb:'https://image.tmdb.org/t/p/w500/m1cJNqxOhxLtlzaVIXB3TMHzHQ.jpg' },
    { id:'d_hotel',       title:'Hotel Del Luna',                     genre:'Romance / Fantasia', year:'2019',      desc:'Um hotel para espíritos é gerenciado por uma mulher presa lá por séculos.',                   emoji:'🌙', color:'#3a1a5c', tmdbId:90447,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/3rkFmF0qjUv2MiZFt8jP5rCHqpL.jpg' },
    { id:'d_vincenzo',    title:'Vincenzo',                           genre:'Comédia / Ação',     year:'2021',      desc:'Um advogado mafioso coreano-italiano retorna ao país natal e encontra amor e caos.',           emoji:'🎩', color:'#2a2a2a', tmdbId:120168, type:'series', thumb:'https://image.tmdb.org/t/p/w500/aSXRO4bOcGjSfFqVRFPaEt8qL18.jpg' },
    { id:'d_okay',        title:'Tudo Bem Não Ser Normal',            genre:'Romance / Drama',    year:'2020',      desc:'Um cuidador de saúde mental e uma escritora excêntrica se encontram e se curam.',             emoji:'📚', color:'#5c2a3a', tmdbId:96162,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/3RIV4yCEbmxe2y1pn5FGGZJnBWd.jpg' },
    { id:'d_advogada',    title:'Uma Advogada Extraordinária',        genre:'Drama / Comédia',    year:'2022',      desc:'Woo Young-woo, autista e brilhante, enfrenta o mundo jurídico com seu jeito único.',           emoji:'🐋', color:'#1a5c7a', tmdbId:197067, type:'series', thumb:'https://image.tmdb.org/t/p/w500/r9SAy3ZSTtXVJPCpzCOGmf5P9E5.jpg' },
    { id:'d_bong',        title:'Mulher Forte Do Bong-soon',          genre:'Romance / Comédia',  year:'2017',      desc:'Bong-soon tem força sobre-humana e é contratada como guarda-costas de um CEO.',               emoji:'💪', color:'#c04a7a', tmdbId:70593,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/sMivNiLJhxnU9r0lQyXzVUjLaDt.jpg' },
    { id:'d_levant',      title:'A Fada do Levantamento de Peso',     genre:'Romance / Esporte',  year:'2016',      desc:'Uma atleta de levantamento de peso luta por seus sonhos e encontra o amor.',                  emoji:'🏋️', color:'#7a5c3e', tmdbId:68330,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/vRXeAJ6USj4PnkHhHJeHDWW1QGc.jpg' },
    { id:'d_lua',         title:'Amantes da Lua',                     genre:'Romance / Histórico',year:'2016',      desc:'Uma garota moderna cai no tempo e se envolve com os filhos do rei Goryeo.',                  emoji:'🌕', color:'#5c3a1a', tmdbId:67089,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/7CbkBlUzW82sEpLFEhFqPiPpRYL.jpg' },
    { id:'d_herdeiros',   title:'Os Herdeiros',                       genre:'Romance / Drama',    year:'2013',      desc:'Jovens de famílias ricas vivem rivalidades e amores num colégio de elite.',                   emoji:'👑', color:'#1a3a5c', tmdbId:60572,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/ue0vK6lSYGrJNzMYQBWCBiFJpLg.jpg' },
    { id:'d_bof',         title:'Meninos Antes de Flores',            genre:'Romance / Drama',    year:'2009',      desc:'Jan-di enfrenta os poderosos F4 num colégio de elite e se apaixona por Gu Jun-pyo.',         emoji:'🌺', color:'#8e5c3a', tmdbId:35942,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/e8hO4MnCU3aDJRniKUYKi9oV7Yj.jpg' },
    { id:'d_business',    title:'Business Proposal',                  genre:'Romance / Comédia',  year:'2022',      desc:'Uma mulher vai a um encontro com nome falso e descobre que ele é seu chefe.',                  emoji:'🍵', color:'#2a4a6e', tmdbId:150117, type:'series', thumb:'https://image.tmdb.org/t/p/w500/tGFOBObVGLiE0UlMF6c5Nh5Lciy.jpg' },
    { id:'d_reencarnacao',title:'Recordações de uma Assassina',        genre:'Suspense / Drama',   year:'2022',      desc:'Um policial investiga assassinatos e descobre que a principal suspeita tem amnésia.',          emoji:'🔍', color:'#1a0a2a', tmdbId:130396, type:'series', thumb:'https://image.tmdb.org/t/p/w500/4Dpo8suxVvgM4gQxgcWJFHbfqAh.jpg' },
    { id:'d_doona',       title:'Doona!',                             genre:'Romance / Drama',    year:'2023',      desc:'Um universitário começa a morar com uma ex-idol e os dois se aproximam lentamente.',          emoji:'🎤', color:'#3a2a5c', tmdbId:222326, type:'series', thumb:'https://image.tmdb.org/t/p/w500/nk1kYqCHjE9fIAmfVrxrAblXGZL.jpg' },
    { id:'d_crash',       title:'Crash',                              genre:'Romance / Ação',     year:'2024',      desc:'Uma policial de trânsito e um policial secreto se envolvem em crimes e em um romance inesperado.',emoji:'🚗', color:'#1a3a5c', tmdbId:246628, type:'series', thumb:'https://image.tmdb.org/t/p/w500/7LMEFEGOFHKnMI5s7ECLgVGVStF.jpg' },
  ],

  /* ─── ANIMAÇÕES ─── */
  animacoes: [
    /* — Cartoons clássicos e modernos — */
    { id:'a_hora',        title:'Hora de Aventura',               genre:'Animação / Fantasia', year:'2010–2018', desc:'Finn e Jake exploram a Terra de Ooo em aventuras mágicas e emocionantes.',             emoji:'⚔️', color:'#5c8e3a', tmdbId:15260,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/casOSrXJAkJ4AHpqpzZ9WKZM8Y9.jpg' },
    { id:'a_show',        title:'Apenas um Show',                 genre:'Animação / Comédia',  year:'2010–2017', desc:'Mordecai e Rigby são preguiçosos e cometem desastres no parque onde trabalham.',      emoji:'🐦', color:'#4a7a2a', tmdbId:31132,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/h4JMCMEGQxJe7OQTOpWaLQRVvVW.jpg' },
    { id:'a_steven',      title:'Steven Universo',               genre:'Animação / Aventura', year:'2013–2019', desc:'Steven, meio humano meio Gema, aprende a usar poderes e protege a Terra com amor.',   emoji:'💎', color:'#e8536f', tmdbId:61175,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/oW4jxPGu96TJpRCgGLW58hUP0Cf.jpg' },
    { id:'a_gumball',     title:'O Incrível Mundo de Gumball',   genre:'Animação / Comédia',  year:'2011–2019', desc:'Gumball e Darwin se metem em confusões absurdas e hilárias em Elmore.',              emoji:'🐱', color:'#2a8ec0', tmdbId:37606,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/jGNBFqkAoJaTlnFnvB21GSGQ4c3.jpg' },
    { id:'a_ben10',       title:'Ben 10',                         genre:'Animação / Ação',     year:'2005–2008', desc:'Ben encontra o Omnitrix e pode se transformar em 10 alienígenas diferentes.',        emoji:'👽', color:'#4a7a2a', tmdbId:4686,   type:'series', thumb:'https://image.tmdb.org/t/p/w500/xyuiZsqKNLFX7tPCT5iqwrXEEv2.jpg' },
    { id:'a_ppg',         title:'As Meninas Superpoderosas',      genre:'Animação / Ação',     year:'1998–2005', desc:'Florzinha, Lindinha e Docinho protegem Townsville de vilões com seus superpoderes.', emoji:'👧', color:'#c04a7a', tmdbId:607,    type:'series', thumb:'https://image.tmdb.org/t/p/w500/z1G9m0Cq3qT1lz9I6cIRQzfXC9g.jpg' },
    { id:'a_dexter',      title:'O Laboratório de Dexter',        genre:'Animação / Comédia',  year:'1996–2003', desc:'Dexter é um gênio científico cuja irmã Dee Dee sempre atrapalha seus planos.',       emoji:'🔬', color:'#4a2a7a', tmdbId:2024,   type:'series', thumb:'https://image.tmdb.org/t/p/w500/vC1LPBpPOlN3JmOVGgzL7tHZKHr.jpg' },
    { id:'a_johnny',      title:'Johnny Bravo',                   genre:'Animação / Comédia',  year:'1997–2004', desc:'Johnny, vaidoso e musculoso, tenta conquistar as mulheres com péssimo sucesso.',   emoji:'💪', color:'#e8a020', tmdbId:1705,   type:'series', thumb:'https://image.tmdb.org/t/p/w500/x7fXlHFTLHlAK6XJBQ6Xn4yY0v1.jpg' },
    { id:'a_coragem',     title:'Coragem o Cão Covarde',          genre:'Animação / Terror',   year:'1999–2002', desc:'Coragem vive no meio do nada com seus donos e enfrenta monstros horríveis.',        emoji:'👻', color:'#5c2a7a', tmdbId:954,    type:'series', thumb:'https://image.tmdb.org/t/p/w500/rXcNkjbIvFwHmWvbxRvDxI1J9GG.jpg' },
    { id:'a_samurai',     title:'Samurai Jack',                   genre:'Animação / Ação',     year:'2001–2017', desc:'Um samurai viaja no tempo e luta contra o demônio Aku para voltar ao passado.',    emoji:'⚔️', color:'#2a2a3a', tmdbId:30984,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/3bhkxtNPHLe8pqPFZ3bepCr6gkQ.jpg' },
    { id:'a_trem',        title:'Trem Infinito',                  genre:'Animação / Aventura', year:'2019–2021', desc:'Passageiros embarcam num trem misterioso e precisam resolver seus problemas.',       emoji:'🚂', color:'#1a3a5c', tmdbId:93134,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/gKXkMUmPMHkNS1pJP0MNdqYjq2K.jpg' },
    { id:'a_greg',        title:'O Mundo de Greg',                genre:'Animação / Comédia',  year:'2018–presente', desc:'Greg e seu amigo Wirt vivem aventuras hilárias numa cidade pequena.',          emoji:'🦎', color:'#4a7a2a', tmdbId:79008,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/6sMNzMdq5OjDcKJzJMBMsBmRFZm.jpg' },
    { id:'a_ursos',       title:'Ursos sem Curso',                genre:'Animação / Comédia',  year:'2015–2019', desc:'Três irmãos ursos tentam se encaixar no mundo humano com resultados caóticos.',    emoji:'🐻', color:'#5c4a3a', tmdbId:62643,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/p9EqoFcXTNFt4fBq1bFHh77e11f.jpg' },
    { id:'a_titas',       title:'Jovens Titãs',                   genre:'Animação / Ação',     year:'2003–2006', desc:'Robin, Estelar, Aresta, Cyborg e Mutante formam um time de heróis jovens.',       emoji:'🦸', color:'#3a2a5c', tmdbId:604,    type:'series', thumb:'https://image.tmdb.org/t/p/w500/j2SbbFP1qBzeBKIuPGOkQ5Ywi9F.jpg' },
    { id:'a_titas_ac',    title:'Jovens Titãs em Ação!',          genre:'Animação / Comédia',  year:'2013–presente', desc:'A versão cômica dos Jovens Titãs, com aventuras leves e muito humor nonsense.',  emoji:'😂', color:'#c04a2a', tmdbId:45140,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/bnvSwAJJrj2xGivLvFLBNqFB3bK.jpg' },
    { id:'a_batman',      title:'Batman: A Série Animada',        genre:'Animação / Ação',     year:'1992–1995', desc:'A versão mais aclamada do Batman em animação — sombria, épica e inesquecível.',  emoji:'🦇', color:'#1a1a2e', tmdbId:2098,   type:'series', thumb:'https://image.tmdb.org/t/p/w500/lSu7JIu0XAp9MxVdRr4jUAygILc.jpg' },
    { id:'a_liga',        title:'Liga da Justiça Sem Limites',    genre:'Animação / Ação',     year:'2004–2006', desc:'Os maiores heróis do DC se unem para defender a Terra de ameaças colossais.',     emoji:'🌟', color:'#2a3a6e', tmdbId:1639,   type:'series', thumb:'https://image.tmdb.org/t/p/w500/4F6v4QXs8yfq2LOjU8lkpwBM3Jy.jpg' },
    { id:'a_jjovem',      title:'Justiça Jovem',                  genre:'Animação / Ação',     year:'2010–presente', desc:'A equipe de sidekicks dos grandes heróis opera missões secretas para a Liga.',  emoji:'⚡', color:'#3a5c7a', tmdbId:33217,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/cEGXLLGWCXkgD1nwLxKDfYjufeU.jpg' },
    { id:'a_harley',      title:'Harley Quinn',                   genre:'Animação / Comédia',  year:'2019–presente', desc:'Harley Quinn deixa o Coringa e tenta se tornar uma vilã por conta própria.',  emoji:'🃏', color:'#c0207a', tmdbId:74440,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/h8PFAB6MIBZ0qVR3RLXVbU4fZPb.jpg' },
    { id:'a_rick',        title:'Rick e Morty',                   genre:'Animação / Ficção',   year:'2013–presente', desc:'Um cientista bêbado e genial viaja pelo cosmos com seu neto inseguro.',        emoji:'🧪', color:'#2a8e3a', tmdbId:60625,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/cvhNj9eoJ0oH9StjDn3zESWQRyP.jpg' },
    /* ─── HBO Max / MAX ─── */
    { id:'a_close_enough',title:'Quase Lá',                       genre:'Animação / Comédia',  year:'2020–2022', desc:'Um casal de 30 anos vive situações bizarras e hilárias no subúrbio de Los Angeles.', emoji:'🏠', color:'#e85c1a', tmdbId:88236,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/ggkfvYCeZTN8T7MJ7r8aUQPo7hE.jpg' },
    { id:'a_final_space', title:'Final Space',                    genre:'Animação / Ficção',   year:'2018–2021', desc:'Gary Goodspeed e um alienígena adorável tentam salvar o universo de dentro de uma prisão.', emoji:'🚀', color:'#1a1a3a', tmdbId:71763,  type:'series', thumb:'https://image.tmdb.org/t/p/w500/lXZyS8gFUGOPlVoQUpiZGfOgwCr.jpg' },
    { id:'a_velma',       title:'Velma',                          genre:'Animação / Mistério', year:'2023–presente', desc:'A origem sombria e irreverente de Velma, do universo Scooby-Doo, no Max.',     emoji:'🔍', color:'#e85c00', tmdbId:195616, type:'series', thumb:'https://image.tmdb.org/t/p/w500/3O31U3cLNXgUpMIL2sQGMgRgTwC.jpg' },
    { id:'a_stevenu_f',   title:'Steven Universo: O Filme',      genre:'Animação / Musical',  year:'2019',      desc:'Steven enfrenta uma nova ameaça que quer apagar as memórias das Gemas para sempre.',  emoji:'🌟', color:'#e8536f', tmdbId:609728, type:'movie',  thumb:'https://image.tmdb.org/t/p/w500/4I5nQfFGVPMa2VRuO7nJBTLUEKo.jpg' },
  ],
};

/* ══════════════════════════════════════════════
   TMDB — BUSCA DINÂMICA DE EPISÓDIOS PT-BR
   ══════════════════════════════════════════════ */
const TMDB_KEY = '8265bd1679663a7ea12ac168da84d2e8';
const TMDB_BASE = 'https://api.themoviedb.org/3';

// Cache em memória: tmdbId → { seasons, episodes[] }
const _episodeCache = {};

async function _fetchAllEpisodes(item) {
  const id = item.tmdbId;
  if (!id) return null;
  if (_episodeCache[id]) return _episodeCache[id];

  try {
    // 1. Busca detalhes da série em PT-BR para obter lista de temporadas
    const detailRes = await fetch(
      `${TMDB_BASE}/tv/${id}?api_key=${TMDB_KEY}&language=pt-BR`
    );
    if (!detailRes.ok) return null;
    const detail = await detailRes.json();

    // Temporadas válidas (excluir "Especiais" — season_number 0)
    const seasons = (detail.seasons || []).filter(s => s.season_number > 0);

    // 2. Busca episódios de cada temporada em paralelo
    const seasonData = await Promise.all(
      seasons.map(s =>
        fetch(`${TMDB_BASE}/tv/${id}/season/${s.season_number}?api_key=${TMDB_KEY}&language=pt-BR`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    );

    // 3. Monta lista flat de episódios
    const episodes = [];
    for (const sd of seasonData) {
      if (!sd || !sd.episodes) continue;
      for (const ep of sd.episodes) {
        const epName = ep.name && ep.name.trim()
          ? ep.name
          : `Episódio ${ep.episode_number}`;
        episodes.push({
          title: `T${ep.season_number}E${ep.episode_number} — ${epName}`,
          season: ep.season_number,
          episode: ep.episode_number,
          overview: ep.overview || '',
          still: ep.still_path
            ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
            : null,
        });
      }
    }

    _episodeCache[id] = episodes.length > 0 ? episodes : null;
    return _episodeCache[id];
  } catch (e) {
    return null;
  }
}

// Cache de metadados de filmes/séries
const _metaCache = {};

async function _fetchTmdbMeta(item) {
  const id = item.tmdbId;
  if (!id) return null;
  if (_metaCache[id]) return _metaCache[id];

  try {
    const isMovie = item.type === 'movie';
    const endpoint = isMovie ? 'movie' : 'tv';

    const [detailRes, creditsRes] = await Promise.all([
      fetch(`${TMDB_BASE}/${endpoint}/${id}?api_key=${TMDB_KEY}&language=pt-BR`),
      fetch(`${TMDB_BASE}/${endpoint}/${id}/credits?api_key=${TMDB_KEY}&language=pt-BR`),
    ]);

    const detail  = detailRes.ok  ? await detailRes.json()  : null;
    const credits = creditsRes.ok ? await creditsRes.json() : null;

    if (!detail) return null;

    const runtime = isMovie
      ? (detail.runtime ? `${detail.runtime} min` : null)
      : (detail.episode_run_time?.[0] ? `~${detail.episode_run_time[0]} min/ep` : null);

    const cast = (credits?.cast || [])
      .slice(0, 5)
      .map(a => a.name)
      .join(', ');

    const genres = (detail.genres || []).map(g => g.name).join(', ');

    const overview = detail.overview && detail.overview.trim()
      ? detail.overview
      : null;

    const tagline = detail.tagline && detail.tagline.trim()
      ? detail.tagline
      : null;

    const vote = detail.vote_average
      ? Math.round(detail.vote_average * 10) / 10
      : null;

    const meta = { runtime, cast, genres, overview, tagline, vote, isMovie };
    _metaCache[id] = meta;
    return meta;
  } catch (e) {
    return null;
  }
}

/* ══════════════════════════════════════════════
   ESTADO INTERNO
   ══════════════════════════════════════════════ */
let _db          = null;
let _cinemaDoc   = null;
let _watched     = {};
let _activeTab   = 'series';
let _currentItem = null;
let _currentEpIdx   = 0;
let _isModalOpen    = false;
let _saveDebounce   = null;
let _serverIdx      = 0;
let _playerTimeout  = null;
let _dynamicEpisodes = null;   // episódios carregados dinamicamente do TMDB
let _loadingEpisodes = false;  // flag de loading

/* ══════════════════════════════════════════════
   HELPERS — PLAYER
   ══════════════════════════════════════════════ */

function _destroyPlayer() {
  if (_playerTimeout) { clearTimeout(_playerTimeout); _playerTimeout = null; }
  const p = document.getElementById('cinema-modal-player');
  if (p) p.innerHTML = '';
}

function _escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function _parseSeasonEpisode(title) {
  if (!title) return [1, 1];
  const m = title.match(/T(\d+)E(\d+)/i);
  return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : [1, 1];
}

function _buildPlayerSrc(item, epIdx, serverIdx) {
  const isSeries = !!(item.episodes || item.type === 'series' || _dynamicEpisodes);
  const server   = PLAYER_SERVERS[serverIdx];

  if (server && item.tmdbId) {
    // Servidores com hasParams:true já têm query string — usar & em vez de ?
    const sep = server.hasParams ? '&' : '?';

    if (isSeries) {
      // Usa episódios dinâmicos do TMDB se disponíveis, senão cai no estático
      const episodes = _dynamicEpisodes || item.episodes;
      const ep       = episodes ? episodes[epIdx] : null;
      const s        = ep?.season   || null;
      const e        = ep?.episode  || null;
      const [sf, ef] = (s && e) ? [s, e] : _parseSeasonEpisode(ep?.title);
      // BUG FIX: passa dynEp para getResumeTime para doramas/animações sem episodes[]
      const dynEp = (ep?.season != null && ep?.episode != null) ? { season: ep.season, episode: ep.episode } : null;
      const rt    = getResumeTime(item, epIdx, dynEp);
      return server.tv(item.tmdbId, sf, ef) + (rt > 0 ? `${sep}t=${rt}` : '');
    } else {
      const rt = getResumeTime(item, 0);
      return server.movie(item.tmdbId) + (rt > 0 ? `${sep}t=${rt}` : '');
    }
  }

  // YouTube fallback
  const ytId = item.episodes ? item.episodes[epIdx]?.ytId : item.ytId;
  if (!ytId) return null;
  const rt = getResumeTime(item, epIdx);
  return `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&playsinline=1` +
    (rt > 0 ? `&start=${rt}` : '');
}

function _createIframe(src, title) {
  const iframe = document.createElement('iframe');
  iframe.src             = src;
  iframe.title           = title || 'Player';
  iframe.frameBorder     = '0';
  iframe.allowFullscreen  = true;
  // Sem sandbox — os servidores de embed precisam de allow-top-navigation e
  // allow-popups para funcionar corretamente.
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media');
  iframe.style.cssText   = 'width:100%;aspect-ratio:16/9;display:block;';
  return iframe;
}

function _buildPlayer(item, epIdx) {
  const playerEl = document.getElementById('cinema-modal-player');
  if (!playerEl) return;
  _destroyPlayer();

  const src = _buildPlayerSrc(item, epIdx, _serverIdx);
  if (!src) { _showPlayerError(playerEl, item); return; }

  const isDubServer = _serverIdx < 3; // primeiros 3 são PT-BR
  const serverName  = PLAYER_SERVERS[_serverIdx]?.name || 'YouTube';

  // Loading skeleton
  const skeleton = document.createElement('div');
  skeleton.id        = 'cinema-player-skeleton';
  skeleton.className = 'cinema-player-skeleton';
  skeleton.innerHTML = `
    <div class="cinema-player-loading">
      <div class="cinema-player-spinner"></div>
      <span class="cinema-player-loading-text">
        ${isDubServer ? '🇧🇷 Carregando dublagem PT-BR…' : `Carregando ${serverName}…`}
      </span>
    </div>`;
  playerEl.appendChild(skeleton);

  const iframe = _createIframe(src, item.title);
  iframe.onload = () => {
    const sk = document.getElementById('cinema-player-skeleton');
    if (sk) sk.remove();
    if (_playerTimeout) { clearTimeout(_playerTimeout); _playerTimeout = null; }

    // Badge PT-BR aparece por 4s após carregar
    if (isDubServer) {
      const badge = document.createElement('div');
      badge.className = 'cinema-ptbr-badge';
      badge.textContent = '🇧🇷 Dublado PT-BR';
      playerEl.appendChild(badge);
      setTimeout(() => { badge.style.opacity = '0'; setTimeout(() => badge.remove(), 400); }, 3600);
    }
  };

  // Timeout de 12s → botão trocar servidor
  _playerTimeout = setTimeout(() => {
    const sk = document.getElementById('cinema-player-skeleton');
    if (sk) sk.remove();
    _showServerRetryButton(playerEl, item, epIdx);
  }, PLAYER_TIMEOUT_MS);

  playerEl.appendChild(iframe);

  // Rastreia progresso
  // BUG FIX: passa dynEp para startTracking — garante chave e type corretos para episódios dinâmicos
  const episodes = _dynamicEpisodes || item.episodes;
  const ep       = episodes ? episodes[epIdx] : null;
  const dynEp    = (ep?.season != null && ep?.episode != null)
    ? { season: ep.season, episode: ep.episode }
    : null;

  startTracking(item, epIdx, (key, watchedItem, eIdx) => {
    const watchKey = (watchedItem.episodes || dynEp)
      ? `${watchedItem.id}_ep${eIdx}`
      : watchedItem.id;
    if (!_watched[watchKey]) {
      _watched[watchKey] = true;
      _saveWatched();
      _renderCatalog();
    }
  }, dynEp);
}

function _showServerRetryButton(container, item, epIdx) {
  const nextIdx = _serverIdx + 1;
  // FIX: corrigido — inclui YouTube como fallback final após todos os servidores
  const hasNext    = nextIdx <= PLAYER_SERVERS.length; // <= length permite YouTube como próximo
  const nextName   = nextIdx < PLAYER_SERVERS.length
    ? PLAYER_SERVERS[nextIdx].name
    : nextIdx === PLAYER_SERVERS.length ? 'YouTube' : null;
  const currentName = PLAYER_SERVERS[_serverIdx]?.name || 'YouTube';

  // Não mostra botão se já está no YouTube (fallback final)
  const isAtLastServer = _serverIdx >= PLAYER_SERVERS.length;

  container.innerHTML = `
    <div class="cinema-server-overlay">
      <div class="cinema-server-msg">
        <div class="cinema-server-icon">⚡</div>
        <div class="cinema-server-title">${currentName} demorou para responder</div>
        <div class="cinema-server-sub">Tente outro servidor ou aguarde</div>
        <div class="cinema-server-btns">
        ${!isAtLastServer && hasNext && nextName ? `<button class="cinema-server-btn cinema-server-btn--primary" onclick="window._cinemaNextServer()">
            Trocar para ${nextName}
          </button>` : ''}
          <button class="cinema-server-btn cinema-server-btn--secondary" onclick="window._cinemaRetryServer()">
            Tentar novamente
          </button>
        </div>
      </div>
    </div>`;
}

function _showPlayerError(container, item) {
  container.innerHTML = `
    <div class="cinema-server-overlay">
      <div class="cinema-server-msg">
        <div class="cinema-server-icon">🎬</div>
        <div class="cinema-server-title">Conteúdo indisponível no momento</div>
        <div class="cinema-server-sub">Tente novamente mais tarde</div>
      </div>
    </div>`;
}

// índice >= PLAYER_SERVERS.length cai no YouTube fallback dentro de _buildPlayerSrc
window._cinemaNextServer = function () {
  _serverIdx = Math.min(_serverIdx + 1, PLAYER_SERVERS.length);
  if (_currentItem) _buildPlayer(_currentItem, _currentEpIdx);
};

window._cinemaRetryServer = function () {
  if (_currentItem) _buildPlayer(_currentItem, _currentEpIdx);
};

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

function _saveWatched() {
  if (!_cinemaDoc) return;
  clearTimeout(_saveDebounce);
  _saveDebounce = setTimeout(async () => {
    try { await setDoc(_cinemaDoc, { watched: _watched }, { merge: true }); } catch (e) {} // BUG FIX: merge evita sobrescrever dados do outro usuário
  }, 600);
}

function _markWatched(id) {
  _watched[id] = !_watched[id];
  if (!_watched[id]) delete _watched[id];
  _saveWatched();
  _renderCatalog();
}

/* ══════════════════════════════════════════════
   CATÁLOGO — DADOS E RENDER
   ══════════════════════════════════════════════ */
function _getTabData() {
  const map = {
    series   : { list: CINEMA_CATALOG.series,    isMovie: false },
    filmes   : { list: CINEMA_CATALOG.filmes,    isMovie: true  },
    romance  : { list: CINEMA_CATALOG.romance,   isMovie: true  },
    doramas  : { list: CINEMA_CATALOG.doramas,   isMovie: false },
    animacoes: { list: CINEMA_CATALOG.animacoes, isMovie: false },
  };
  return map[_activeTab] || map.series;
}

function _renderCatalog() {
  const wrap = document.getElementById('cinema-catalog');
  if (!wrap) return;

  const { list, isMovie } = _getTabData();

  wrap.innerHTML = list.map(item => {
    // É filme se: aba é filmes/romance E item não tem type:'series', OU se explicitamente type:'movie'
    const itemIsMovie = item.type === 'movie'
      || (isMovie && item.type !== 'series');
    const isWatched   = itemIsMovie ? !!_watched[item.id] : false;
    // Conta episódios assistidos pelo prefixo do ID (funciona com episódios dinâmicos e estáticos)
    const watchedEps  = !itemIsMovie
      ? Object.keys(_watched).filter(k => k.startsWith(`${item.id}_ep`) && _watched[k]).length
      : 0;
    const totalEps    = !itemIsMovie ? (item.episodes || []).length : 0;
    const pct         = totalEps > 0 ? Math.round((watchedEps / totalEps) * 100) : 0;

    // séries com todos os episódios assistidos também recebem o badge
    const allEpsDone  = !itemIsMovie && totalEps > 0 && watchedEps === totalEps;
    const showWatched = isWatched || allEpsDone;

    const thumb = item.thumb || '';

    return `
    <div class="cinema-card ${showWatched ? 'cinema-card--watched' : ''}"
         data-item-id="${item.id}"
         data-item-type="${itemIsMovie ? 'movie' : 'series'}"
         onclick="window._openCinemaItem('${item.id}')">
      <div class="cinema-card-thumb" style="background:${item.color || '#1a1a2e'}">
        <img src="${thumb}" alt="${item.title}" loading="lazy"
             onerror="this.style.display='none'">
        <div class="cinema-card-emoji">${item.emoji || '🎬'}</div>
        ${showWatched ? '<div class="cinema-card-watched-badge">✓ Assistido</div>' : ''}
      </div>
      <div class="cinema-card-info">
        <div class="cinema-card-genre">${item.genre} · ${item.year}</div>
        <div class="cinema-card-title">${item.title}</div>
        <div class="cinema-card-desc">${item.desc || ''}</div>
        ${!itemIsMovie && totalEps > 0 ? `
          <div class="cinema-ep-progress">
            <div class="cinema-ep-bar">
              <div class="cinema-ep-fill" style="width:${pct}%"></div>
            </div>
            <span class="cinema-ep-label">${watchedEps}/${totalEps} ep.</span>
          </div>` : ''}
        <button class="cinema-play-btn">
          ${!itemIsMovie ? '▶ Ver episódios' : '▶ Assistir agora'}
        </button>
      </div>
    </div>`;
  }).join('');

  updateProgressBars();
  renderContinueWatching();
}

/* ══════════════════════════════════════════════
   MODAL — ABRIR / RENDER / FECHAR
   ══════════════════════════════════════════════ */
// Aceita o 2º argumento (tab) para compatibilidade retroativa, mas não é necessário
window._openCinemaItem = async function (id /*, _tabIgnored */) {
  if (_isModalOpen) { stopTracking(); _destroyPlayer(); }

  const allLists = [
    ...CINEMA_CATALOG.series,
    ...CINEMA_CATALOG.filmes,
    ...CINEMA_CATALOG.romance,
    ...CINEMA_CATALOG.doramas,
    ...CINEMA_CATALOG.animacoes,
  ];
  const item = allLists.find(x => x.id === id);
  if (!item) return;

  _currentItem     = item;
  _serverIdx       = 0;
  _dynamicEpisodes = null;
  _loadingEpisodes = false;

  const isMovie = item.type === 'movie';
  // É série se não for filme explícito
  const isTVItem = !isMovie;

  // Restaura último episódio assistido
  // BUG FIX: restaura para TODOS os itens TV (inclui doramas/animações sem episodes[] estáticos)
  // Aceita type='series' e type='movie' (compatibilidade com dados salvos antes da correção)
  if (isTVItem) {
    try {
      const all     = JSON.parse(localStorage.getItem('cinema_progress_v1') || '{}');
      const entries = Object.values(all).filter(e => e.itemId === id);
      if (entries.length) {
        const latest  = entries.sort((a, b) => (b.updated || 0) - (a.updated || 0))[0];
        _currentEpIdx = (latest.epIdx != null && !latest.done) ? latest.epIdx : 0;
      } else {
        _currentEpIdx = 0;
      }
    } catch { _currentEpIdx = 0; }
  } else {
    _currentEpIdx = 0;
  }

  const overlay = document.getElementById('cinema-modal-overlay');
  if (!overlay) return;
  _isModalOpen = true;
  overlay.classList.add('show');

  // Abre modal imediatamente
  _renderModal();

  // Busca metadados TMDB em paralelo para todos (filmes e séries)
  if (item.tmdbId) {
    // Snapshot do item para detectar race condition (usuário abriu outro título durante o fetch)
    const fetchedForItem = item;

    // Metadados (sinopse PT-BR, elenco, duração, nota)
    _fetchTmdbMeta(item).then(meta => {
      if (_currentItem !== fetchedForItem) return; // race condition: outro item foi aberto
      if (meta) _renderMeta(meta);
    });

    // Episódios (só para séries/doramas/animações)
    if (isTVItem) {
      _loadingEpisodes = true;
      _renderEpisodeList();
      const fetched = await _fetchAllEpisodes(item);
      // BUG FIX: race condition — verifica se o item ainda é o mesmo após o await
      if (_currentItem !== fetchedForItem) return;
      _loadingEpisodes = false;
      if (fetched && fetched.length > 0) {
        _dynamicEpisodes = fetched;
        const prevIdx = _currentEpIdx;
        if (_currentEpIdx >= fetched.length) _currentEpIdx = 0;
        _renderEpisodeList();
        // Se o índice mudou, reconstrói o player com o ep correto
        if (_currentEpIdx !== prevIdx) {
          _buildPlayer(item, _currentEpIdx);
          _renderServerPanel();
        }
      } else {
        _renderEpisodeList();
      }
    }
  }
};

function _renderModal(skipPlayerBuild = false) {
  const item = _currentItem;
  if (!item) return;

  // Usa episódios dinâmicos (TMDB) se disponíveis, senão os estáticos
  const episodes = _dynamicEpisodes || item.episodes || null;
  const isSeries = !!(episodes || item.type === 'series');
  const epCount  = episodes ? episodes.length : 0;
  if (isSeries && epCount > 0 && _currentEpIdx >= epCount) _currentEpIdx = 0;

  const titleEl   = document.getElementById('cinema-modal-title');
  const markBtn   = document.getElementById('cinema-modal-markbtn');

  if (titleEl) titleEl.textContent = `${item.emoji || '🎬'} ${item.title}`;

  if (!skipPlayerBuild) _buildPlayer(item, _currentEpIdx);

  _renderServerPanel();
  _renderEpisodeList();

  if (markBtn) {
    const key  = isSeries ? `${item.id}_ep${_currentEpIdx}` : item.id;
    const done = !!_watched[key];
    markBtn.textContent = done ? '✓ Marcado como assistido' : '☑ Marcar como assistido';
    markBtn.classList.toggle('done', done);
    markBtn.onclick = () => { _markWatched(key); _renderModal(true); };
  }
}

function _renderServerPanel() {
  const dubEl = document.getElementById('cinema-srv-dub');
  const subEl = document.getElementById('cinema-srv-sub');
  if (!dubEl || !subEl) return;

  const dubServers = PLAYER_SERVERS.map((s, i) => ({ s, i })).filter(({ s }) => s.type === 'dub');
  const subServers = PLAYER_SERVERS.map((s, i) => ({ s, i })).filter(({ s }) => s.type === 'sub');

  const makeBtn = ({ s, i }) => {
    const isActive = i === _serverIdx;
    const num = s.type === 'dub'
      ? dubServers.findIndex(x => x.i === i) + 1
      : subServers.findIndex(x => x.i === i) + 1;
    return `<button
      class="cinema-srv-btn ${isActive ? 'active' : ''} cinema-srv-btn--${s.type}"
      onclick="window._cinemaSelectServer(${i})"
      title="${s.label}"
    >${num}</button>`;
  };

  dubEl.innerHTML = dubServers.map(makeBtn).join('');
  subEl.innerHTML = subServers.map(makeBtn).join('');
}

window._cinemaSelectServer = function (idx) {
  _serverIdx = idx;
  if (_currentItem) {
    _buildPlayer(_currentItem, _currentEpIdx);
    _renderServerPanel();
    // BUG FIX: se ainda carregando episódios, mantém o spinner visível
    if (_loadingEpisodes) _renderEpisodeList();
  }
};

function _renderEpisodeList() {
  const item     = _currentItem;
  if (!item) return;

  const epListEl  = document.getElementById('cinema-modal-eplist');
  const epLabelEl = document.getElementById('cinema-modal-eplabel');
  if (!epListEl) return;

  // Usa dinâmicos se disponíveis, senão estáticos
  const episodes = _dynamicEpisodes || item.episodes || null;
  const isSeries = !!(episodes || item.type === 'series');

  if (isSeries) {
    epListEl.style.display = 'flex';
    if (epLabelEl) epLabelEl.style.display = '';

    if (_loadingEpisodes) {
      epListEl.innerHTML = `
        <div class="cinema-ep-loading">
          <div class="cinema-ep-spinner"></div>
          <span>Carregando episódios em PT-BR…</span>
        </div>`;
      return;
    }

    if (!episodes || episodes.length === 0) {
      epListEl.innerHTML = `
        <div class="cinema-ep-loading">
          <span>Episódios não encontrados</span>
        </div>`;
      return;
    }

    // Agrupa por temporada
    const byseason = {};
    episodes.forEach((ep, i) => {
      const s = ep.season || 1;
      if (!byseason[s]) byseason[s] = [];
      byseason[s].push({ ep, i });
    });

    const seasons = Object.keys(byseason).map(Number).sort((a, b) => a - b);

    epListEl.innerHTML = seasons.map(s => {
      const header = seasons.length > 1
        ? `<div class="cinema-season-header">Temporada ${s}</div>`
        : '';
      const items = byseason[s].map(({ ep, i }) => {
        const done = !!_watched[`${item.id}_ep${i}`];
        const epNum = ep.episode != null ? ep.episode : (i + 1); // BUG FIX: ep.episode=0 é válido
        return `
          <div class="cinema-ep-item ${i === _currentEpIdx ? 'active' : ''} ${done ? 'ep-done' : ''}"
               onclick="window._cinemaSwitchEp(${i})">
            <span class="cinema-ep-check">${done ? '✓' : epNum}</span>
            <span class="cinema-ep-name">${_escapeHtml(ep.title)}</span>
          </div>`;
      }).join('');
      return header + items;
    }).join('');

  } else {
    epListEl.style.display = 'none';
    if (epLabelEl) epLabelEl.style.display = 'none';
  }
}

function _renderMeta(meta) {
  const el = document.getElementById('cinema-modal-meta');
  if (!el || !meta) return;

  const stars = meta.vote
    ? `<span class="cinema-meta-badge cinema-meta-vote">⭐ ${meta.vote}</span>`
    : '';
  const runtime = meta.runtime
    ? `<span class="cinema-meta-badge">🕐 ${meta.runtime}</span>`
    : '';
  const genres = meta.genres
    ? `<span class="cinema-meta-badge">🎭 ${meta.genres}</span>`
    : '';

  el.innerHTML = `
    <div class="cinema-meta-badges">${stars}${runtime}${genres}</div>
    ${meta.tagline ? `<div class="cinema-meta-tagline">"${_escapeHtml(meta.tagline)}"</div>` : ''}
    ${meta.overview ? `<div class="cinema-meta-overview">${_escapeHtml(meta.overview)}</div>` : ''}
    ${meta.cast ? `<div class="cinema-meta-cast"><span class="cinema-meta-cast-label">Elenco:</span> ${_escapeHtml(meta.cast)}</div>` : ''}
  `;
  el.style.display = 'block';
}

window._cinemaSwitchEp = function (idx) {
  if (idx === _currentEpIdx) return;
  stopTracking();
  _serverIdx    = 0;
  _currentEpIdx = idx;
  _renderModal(); // _renderModal já chama _renderServerPanel internamente
};

window._closeCinemaModal = function () {
  const overlay = document.getElementById('cinema-modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  stopTracking();
  _destroyPlayer();
  _isModalOpen     = false;
  _currentItem     = null;
  _currentEpIdx    = 0;
  _serverIdx       = 0;
  _dynamicEpisodes = null;
  _loadingEpisodes = false;
  const metaEl = document.getElementById('cinema-modal-meta');
  if (metaEl) { metaEl.innerHTML = ''; metaEl.style.display = 'none'; }
  renderContinueWatching();
};

window._cinemaSwitchTab = function (tab) {
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

  const overlay = document.getElementById('cinema-modal-overlay');
  if (overlay && !overlay.dataset.listenerAttached) {
    overlay.dataset.listenerAttached = '1';
    overlay.addEventListener('click', e => {
      if (e.target === overlay) window._closeCinemaModal();
    });
  }
}
