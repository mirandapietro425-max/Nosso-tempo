/* ═══════════════════════════════════════════════
   PIETRO & EMILLY — cinema.js  v39
   Nosso Cinema 🎬
   · 5 abas: Séries · Filmes · Romance · Doramas · Animação
   · Player multi-servidor com fallback automático
   · Sandbox iframe — bloqueia redirect de ads e popups
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
   PLAYER — SERVIDORES MULTI-FONTE
   Ordem: vidsrc → vidlink → 2embed → YouTube (fallback)
   ══════════════════════════════════════════════ */
const PLAYER_SERVERS = [
  {
    name: 'Servidor 1',
    movie : (id)       => `https://vidsrc.to/embed/movie/${id}`,
    tv    : (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
    hasParams: false,  // URL limpa — usar ? para adicionar parâmetros
  },
  {
    name: 'Servidor 2',
    movie : (id)       => `https://vidlink.pro/movie/${id}?autoplay=true&primaryColor=e8536f`,
    tv    : (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?autoplay=true&primaryColor=e8536f`,
    hasParams: true,   // já tem query string — usar & para adicionar mais parâmetros
  },
  {
    name: 'Servidor 3',
    movie : (id)       => `https://www.2embed.cc/embed/${id}`,
    tv    : (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
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
      id: 'friends', title: 'Friends', genre: 'Comédia', year: '1994–2004',
      desc: 'Seis amigos em Nova York — amor, amizade e muitas risadas.',
      thumb: 'https://img.youtube.com/vi/hDNNmeeJs1Q/hqdefault.jpg',
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
      thumb: 'https://img.youtube.com/vi/HoHFGEr3gkA/hqdefault.jpg',
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
      thumb: 'https://img.youtube.com/vi/LHOtME2DL4g/hqdefault.jpg',
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
      thumb: 'https://img.youtube.com/vi/HhesaQXLuRY/hqdefault.jpg',
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
      thumb: 'https://img.youtube.com/vi/sj9J2ecsSpo/hqdefault.jpg',
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
      thumb: 'https://img.youtube.com/vi/rrwycJ08PSQ/hqdefault.jpg',
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
      thumb: 'https://img.youtube.com/vi/Di310WS8zLk/hqdefault.jpg',
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
      thumb: 'https://img.youtube.com/vi/oqxAJKy0ii4/hqdefault.jpg',
      emoji: '🦑', color: '#e8536f', tmdbId: 93405,
      episodes: [
        { title: 'T1E1 — Luz Vermelha, Luz Verde',        ytId: 'oqxAJKy0ii4' },
        { title: 'T1E2 — Inferno',                        ytId: 'tBFOosxAlcU' },
        { title: 'T1E3 — O Homem com o Guarda-Chuva',    ytId: 'yTqrBCBGmBA' },
        { title: 'T1E4 — Mantenha-se no Time',            ytId: 'fSEHGM7Wdoo' },
        { title: 'T1E5 — Um Mundo Justo',                 ytId: '5dpFM1SWGgU' },
      ],
    },
  ],

  /* ─── FILMES ─── */
  filmes: [
    {
      id: 'titanic', title: 'Titanic', genre: 'Romance / Drama', year: '1997',
      desc: 'Um amor impossível entre Jack e Rose no naufrágio do Titanic.',
      thumb: 'https://img.youtube.com/vi/2e-eXJ6HgkQ/hqdefault.jpg',
      emoji: '🚢', color: '#1a3a5c', tmdbId: 597, type: 'movie', ytId: '2e-eXJ6HgkQ',
    },
    {
      id: 'la_la_land', title: 'La La Land: Cantando Estações', genre: 'Romance / Musical', year: '2016',
      desc: 'Mia e Sebastian sonham com seus futuros enquanto se apaixonam em Los Angeles.',
      thumb: 'https://img.youtube.com/vi/0pdqf4P9MB8/hqdefault.jpg',
      emoji: '🌟', color: '#590d22', tmdbId: 313369, type: 'movie', ytId: '0pdqf4P9MB8',
    },
    {
      id: 'diario_paixao', title: 'Diário de uma Paixão', genre: 'Romance / Drama', year: '2004',
      desc: 'Noah e Allie vivem um amor que resiste ao tempo e às diferenças sociais.',
      thumb: 'https://img.youtube.com/vi/lo7tpYBp_Fk/hqdefault.jpg',
      emoji: '📖', color: '#7a3045', tmdbId: 11036, type: 'movie', ytId: 'lo7tpYBp_Fk',
    },
    {
      id: 'interstellar', title: 'Interestelar', genre: 'Ficção Científica / Drama', year: '2014',
      desc: 'Um ex-piloto viaja além da galáxia para salvar a humanidade.',
      thumb: 'https://img.youtube.com/vi/zSWdZVtXT7E/hqdefault.jpg',
      emoji: '🪐', color: '#0a0a2e', tmdbId: 157336, type: 'movie', ytId: 'zSWdZVtXT7E',
    },
    {
      id: 'inception', title: 'A Origem', genre: 'Ficção Científica / Ação', year: '2010',
      desc: 'Um ladrão especializado em roubar segredos dos sonhos recebe uma missão impossível.',
      thumb: 'https://img.youtube.com/vi/YoHD9XEInc0/hqdefault.jpg',
      emoji: '🌀', color: '#1a2a4a', tmdbId: 27205, type: 'movie', ytId: 'YoHD9XEInc0',
    },
    {
      id: 'forrest_gump', title: 'Forrest Gump', genre: 'Drama / Comédia', year: '1994',
      desc: 'A vida extraordinária de um homem simples que cruza momentos históricos dos EUA.',
      thumb: 'https://img.youtube.com/vi/bLvqoHBptjg/hqdefault.jpg',
      emoji: '🏃', color: '#4a6741', tmdbId: 13, type: 'movie', ytId: 'bLvqoHBptjg',
    },
    {
      id: 'frozen', title: 'Frozen: Uma Aventura Congelante', genre: 'Animação / Fantasia', year: '2013',
      desc: 'Anna embarca numa jornada épica para encontrar sua irmã Elsa e descongelar o reino.',
      thumb: 'https://img.youtube.com/vi/TbQm5doF_Uc/hqdefault.jpg',
      emoji: '❄️', color: '#2980b9', tmdbId: 109445, type: 'movie', ytId: 'TbQm5doF_Uc',
    },
    {
      id: 'top_gun', title: 'Top Gun: Maverick', genre: 'Ação / Drama', year: '2022',
      desc: 'Maverick retorna para treinar uma nova geração de pilotos de elite da Marinha.',
      thumb: 'https://img.youtube.com/vi/qSqVVswa420/hqdefault.jpg',
      emoji: '✈️', color: '#1c3a5e', tmdbId: 361743, type: 'movie', ytId: 'qSqVVswa420',
    },
  ],

  /* ─── ROMANCE (30) ─── */
  romance: [
    { id:'r_orgulho',      title:'Orgulho e Preconceito',                  genre:'Romance / Drama',    year:'2005', desc:'Elizabeth Bennet e o orgulhoso Sr. Darcy num clássico do amor de época.',                           emoji:'🌹', color:'#5c3d2e', tmdbId:4348,   type:'movie' },
    { id:'r_culpa',        title:'A Culpa é das Estrelas',                  genre:'Romance / Drama',    year:'2014', desc:'Dois jovens com câncer se apaixonam e embarcam numa jornada especial.',                             emoji:'⭐', color:'#2a5a7c', tmdbId:222935, type:'movie' },
    { id:'r_era_antes',    title:'Como Eu Era Antes de Você',               genre:'Romance / Drama',    year:'2016', desc:'Louisa Clark e Will Traynor: um amor que muda tudo e deixa marcas para sempre.',                   emoji:'💛', color:'#e8a020', tmdbId:296096, type:'movie' },
    { id:'r_simon',        title:'Com Amor, Simon',                         genre:'Romance / Comédia',  year:'2018', desc:'Simon guarda um segredo enorme e se apaixona por alguém que não conhece.',                         emoji:'💌', color:'#e8536f', tmdbId:449176, type:'movie' },
    { id:'r_garotos',      title:'Para Todos os Garotos que Já Amei',       genre:'Romance',            year:'2018', desc:'Lara Jean vê suas cartas secretas serem enviadas para todos os seus amores.',                     emoji:'💝', color:'#c0392b', tmdbId:466282, type:'movie' },
    { id:'r_500dias',      title:'500 Dias com Ela',                        genre:'Romance / Comédia',  year:'2009', desc:'Tom narra os 500 dias do seu relacionamento com a imprevisível Summer.',                          emoji:'📅', color:'#4a6fa5', tmdbId:19913,  type:'movie' },
    { id:'r_antes_aman',   title:'Antes do Amanhecer',                      genre:'Romance',            year:'1995', desc:'Jesse e Céline se conhecem num trem e passam uma noite inesquecível em Viena.',                   emoji:'🌅', color:'#e8a060', tmdbId:76,     type:'movie' },
    { id:'r_antes_sol',    title:'Antes do Pôr do Sol',                     genre:'Romance',            year:'2004', desc:'Jesse e Céline se reencontram em Paris nove anos depois de sua noite em Viena.',                 emoji:'🌇', color:'#b05a20', tmdbId:80,     type:'movie' },
    { id:'r_antes_meia',   title:'Antes da Meia-Noite',                     genre:'Romance / Drama',    year:'2013', desc:'Jesse e Céline, agora juntos, enfrentam a realidade de um amor maduro.',                         emoji:'🌙', color:'#1a3a5c', tmdbId:132344, type:'movie' },
    { id:'r_questao',      title:'Questão de Tempo',                        genre:'Romance / Fantasia', year:'2013', desc:'Tim descobre que pode viajar no tempo e decide usar o poder para encontrar o amor.',              emoji:'⏰', color:'#2a7a5c', tmdbId:122906, type:'movie' },
    { id:'r_amor_rec',     title:'Um Amor para Recordar',                   genre:'Romance / Drama',    year:'2002', desc:'Landon, um rebelde, muda de vida ao se apaixonar pela filha do pastor.',                         emoji:'🕊️', color:'#5c4a2e', tmdbId:10229,  type:'movie' },
    { id:'r_10coisas',     title:'10 Coisas que Odeio em Você',             genre:'Romance / Comédia',  year:'1999', desc:'Patrick precisa conquistar a antipática Kat para que o irmão possa namorar.',                    emoji:'😤', color:'#7a5c2e', tmdbId:4951,   type:'movie' },
    { id:'r_brilho',       title:'Brilho Eterno de uma Mente sem Lembranças', genre:'Romance / Drama',  year:'2004', desc:'Joel e Clementine apagam as memórias um do outro — mas o coração não esquece.',                  emoji:'🧠', color:'#1a3a6e', tmdbId:38,     type:'movie' },
    { id:'r_lado_bom',     title:'O Lado Bom da Vida',                      genre:'Romance / Comédia',  year:'2012', desc:'Pat e Tiffany encontram um ao outro enquanto lidam com seus problemas.',                         emoji:'☀️', color:'#c07820', tmdbId:82693,  type:'movie' },
    { id:'r_ela',          title:'Ela',                                     genre:'Romance / Drama',    year:'2013', desc:'Theodore se apaixona por Samantha, uma inteligência artificial com voz sedutora.',               emoji:'🤖', color:'#c04a20', tmdbId:152601, type:'movie' },
    { id:'r_teoria',       title:'A Teoria de Tudo',                        genre:'Biografia / Romance', year:'2014', desc:'A história de amor entre Stephen Hawking e Jane Wilde contra todas as adversidades.',            emoji:'🌌', color:'#0a2a5c', tmdbId:266856, type:'movie' },
    { id:'r_sol_meia',     title:'Sol da Meia-Noite',                       genre:'Romance / Drama',    year:'2018', desc:'Katie tem uma doença rara que a impede de sair ao sol — até conhecer Charlie.',                  emoji:'🌞', color:'#e8a820', tmdbId:400650, type:'movie' },
    { id:'r_se_ficar',     title:'Se Eu Ficar',                             genre:'Romance / Drama',    year:'2014', desc:'Mia tem uma escolha impossível: partir ou ficar por tudo que ama.',                             emoji:'🎻', color:'#3a5a6e', tmdbId:102651, type:'movie' },
    { id:'r_5passos',      title:'A Cinco Passos de Você',                  genre:'Romance / Drama',    year:'2019', desc:'Stella e Will se apaixonam no hospital, mas a regra dos 5 passos os separa.',                   emoji:'👣', color:'#5c7a8e', tmdbId:527641, type:'movie' },
    { id:'r_viajante',     title:'A Mulher do Viajante do Tempo',           genre:'Romance / Ficção',   year:'2009', desc:'Henry viaja no tempo involuntariamente — mas seu amor por Clare é constante.',                  emoji:'⏳', color:'#4a2a6e', tmdbId:2493,   type:'movie' },
    { id:'r_amor_prova',   title:'Amor a Toda Prova',                       genre:'Romance / Comédia',  year:'2011', desc:'Cal aprende a conquistar mulheres, mas o amor verdadeiro está mais perto do que imagina.',      emoji:'😎', color:'#2a4a5c', tmdbId:50646,  type:'movie' },
    { id:'r_ferias',       title:'O Amor Não Tira Férias',                  genre:'Romance / Comédia',  year:'2006', desc:'Duas mulheres trocam de casa e encontram o amor inesperadamente.',                              emoji:'🏠', color:'#7a5c3e', tmdbId:1581,   type:'movie' },
    { id:'r_notting',      title:'Um Lugar Chamado Notting Hill',           genre:'Romance / Comédia',  year:'1999', desc:'Um livreiro comum se apaixona pela maior estrela de Hollywood.',                                emoji:'🎭', color:'#4a3a2e', tmdbId:509,    type:'movie' },
    { id:'r_linda',        title:'Uma Linda Mulher',                        genre:'Romance / Comédia',  year:'1990', desc:'Um milionário contrata uma garota de programa e acaba se apaixonando por ela.',                 emoji:'💎', color:'#8e2a5c', tmdbId:114,    type:'movie' },
    { id:'r_simplesmente', title:'Simplesmente Amor',                       genre:'Romance / Comédia',  year:'2003', desc:'Dez histórias de amor entrelaçadas em Londres nas vésperas do Natal.',                          emoji:'❤️', color:'#c0392b', tmdbId:508,    type:'movie' },
    { id:'r_bridget',      title:'O Diário de Bridget Jones',               genre:'Romance / Comédia',  year:'2001', desc:'Bridget Jones documenta sua vida amorosa e suas tentativas de encontrar o homem certo.',       emoji:'📓', color:'#7a3a5c', tmdbId:19585,  type:'movie' },
    { id:'r_para_sempre',  title:'Para Sempre',                             genre:'Romance / Fantasia', year:'1998', desc:'Uma jovem se comunica com a alma de um policial morto e se apaixona por ele.',                 emoji:'👻', color:'#5c3d7a', tmdbId:80278,  type:'movie' },
    { id:'r_chame_nome',   title:'Me Chame pelo Seu Nome',                  genre:'Romance / Drama',    year:'2017', desc:'No verão de 1983 na Itália, Elio e Oliver vivem um amor intenso e inesquecível.',              emoji:'☀️', color:'#c07820', tmdbId:398818, type:'movie' },
    { id:'r_val_dia',      title:'Dia dos Namorados',                       genre:'Romance / Comédia',  year:'2010', desc:'Muitas histórias de amor que se cruzam em Los Angeles no Dia dos Namorados.',                 emoji:'💖', color:'#c06080', tmdbId:32657,  type:'movie' },
    { id:'r_padrao',       title:'O Destino de Uma Nação',                  genre:'Romance / Fantasia', year:'2004', desc:'Tristan viaja ao passado e tudo o que ele encontra é Anna, um amor impossível.',              emoji:'🌿', color:'#2a5c3a', tmdbId:11252,  type:'movie' },
  ],

  /* ─── DORAMAS (20) ─── */
  doramas: [
    { id:'d_pousando',   title:'Pousando no Amor',                  genre:'Romance / Drama',   year:'2019–2020', desc:'Uma herdeira sul-coreana pousa de paraquedas na Coreia do Norte e se apaixona por um oficial.',  emoji:'🪂', color:'#2a5c8e', tmdbId:94796,  type:'series' },
    { id:'d_pretendente', title:'Pretendente Surpresa',              genre:'Romance / Comédia', year:'2023',      desc:'Uma CEO exigente aceita participar de um reality de casamento por acidente.',                    emoji:'💍', color:'#8e4a5c', tmdbId:154825, type:'series' },
    { id:'d_beleza',     title:'Beleza Verdadeira',                  genre:'Romance / Comédia', year:'2020–2021', desc:'Jugyeong usa maquiagem para esconder inseguranças e vive um triângulo amoroso.',               emoji:'💄', color:'#c06080', tmdbId:112470, type:'series' },
    { id:'d_goblin',     title:'Goblin: O Solitário e Grande Deus',  genre:'Romance / Fantasia', year:'2016–2017', desc:'Um goblin imortal busca uma noiva que ponha fim à sua vida e encontra o amor.',               emoji:'🕯️', color:'#3a2a5c', tmdbId:67915,  type:'series' },
    { id:'d_mesmo',      title:'Mesmo Assim',                        genre:'Romance / Drama',   year:'2021',      desc:'Yoo Na-bi e Park Jae-eon vivem uma atração complicada entre amizade e amor.',                 emoji:'🌸', color:'#c07890', tmdbId:125910, type:'series' },
    { id:'d_descendentes', title:'Descendentes do Sol',              genre:'Romance / Ação',    year:'2016',      desc:'Um capitão do exército se apaixona por uma médica no meio de uma zona de conflito.',           emoji:'🪖', color:'#4a6a3a', tmdbId:66330,  type:'series' },
    { id:'d_estrelas',   title:'Meu Amor das Estrelas',              genre:'Romance / Ficção',  year:'2013–2014', desc:'Um alienígena que viveu na Terra por 400 anos se apaixona por uma atriz famosa.',             emoji:'🌠', color:'#1a2a4e', tmdbId:60783,  type:'series' },
    { id:'d_vinte',      title:'Vinte e Cinco Vinte e Um',           genre:'Romance / Drama',   year:'2022',      desc:'Uma esgrimista e um jornalista se encontram em momentos diferentes de suas vidas.',           emoji:'🤺', color:'#2a5a7c', tmdbId:156933, type:'series' },
    { id:'d_verao',      title:'Nosso Eterno Verão',                 genre:'Romance',           year:'2021',      desc:'Dois jovens se reconectam após anos e redescobrem os sentimentos que tinham.',               emoji:'🌻', color:'#e8a020', tmdbId:135655, type:'series' },
    { id:'d_hometown',   title:'Hometown Cha-Cha-Cha',               genre:'Romance / Comédia', year:'2021',      desc:'Uma dentista se muda para uma cidade litorânea e se apaixona pelo faz-tudo da vila.',          emoji:'🌊', color:'#2a7a8e', tmdbId:130392, type:'series' },
    { id:'d_startup',    title:'Start-Up',                           genre:'Romance / Drama',   year:'2020',      desc:'Jovens perseguem seus sonhos no Vale do Silício coreano e se apaixonam.',                      emoji:'💻', color:'#4a3a7a', tmdbId:111453, type:'series' },
    { id:'d_hotel',      title:'Hotel Del Luna',                     genre:'Romance / Fantasia', year:'2019',     desc:'Um hotel para espíritos é gerenciado por uma mulher presa lá por séculos.',                   emoji:'🌙', color:'#3a1a5c', tmdbId:90447,  type:'series' },
    { id:'d_vincenzo',   title:'Vincenzo',                           genre:'Comédia / Ação',    year:'2021',      desc:'Um advogado mafioso coreano-italiano retorna ao país natal e encontra amor e caos.',           emoji:'🎩', color:'#2a2a2a', tmdbId:120168, type:'series' },
    { id:'d_okay',       title:'Tudo Bem Não Ser Normal',            genre:'Romance / Drama',   year:'2020',      desc:'Um cuidador de saúde mental e uma escritora excêntrica se encontram e se curam.',             emoji:'📚', color:'#5c2a3a', tmdbId:96162,  type:'series' },
    { id:'d_advogada',   title:'Uma Advogada Extraordinária',        genre:'Drama / Comédia',   year:'2022',      desc:'Woo Young-woo, autista e brilhante, enfrenta o mundo jurídico com seu jeito único.',           emoji:'🐋', color:'#1a5c7a', tmdbId:197067, type:'series' },
    { id:'d_bong',       title:'Mulher Forte Do Bong-soon',          genre:'Romance / Comédia', year:'2017',      desc:'Bong-soon tem força sobre-humana e é contratada como guarda-costas de um CEO.',               emoji:'💪', color:'#c04a7a', tmdbId:70593,  type:'series' },
    { id:'d_levant',     title:'A Fada do Levantamento de Peso',     genre:'Romance / Esporte', year:'2016',      desc:'Uma atleta de levantamento de peso luta por seus sonhos e encontra o amor.',                  emoji:'🏋️', color:'#7a5c3e', tmdbId:68330,  type:'series' },
    { id:'d_lua',        title:'Amantes da Lua',                     genre:'Romance / Histórico', year:'2016',    desc:'Uma garota moderna cai no tempo e se envolve com os filhos do rei Goryeo.',                  emoji:'🌕', color:'#5c3a1a', tmdbId:67089,  type:'series' },
    { id:'d_herdeiros',  title:'Os Herdeiros',                       genre:'Romance / Drama',   year:'2013',      desc:'Jovens de famílias ricas vivem rivalidades e amores num colégio de elite.',                   emoji:'👑', color:'#1a3a5c', tmdbId:60572,  type:'series' },
    { id:'d_bof',        title:'Meninos Antes de Flores',            genre:'Romance / Drama',   year:'2009',      desc:'Jan-di enfrenta os poderosos F4 num colégio de elite e se apaixona por Gu Jun-pyo.',         emoji:'🌺', color:'#8e5c3a', tmdbId:35942,  type:'series' },
  ],

  /* ─── ANIMAÇÕES (20) ─── */
  animacoes: [
    { id:'a_hora',       title:'Hora de Aventura',                   genre:'Animação / Fantasia', year:'2010–2018', desc:'Finn e Jake exploram a Terra de Ooo em aventuras mágicas e emocionantes.',                    emoji:'⚔️', color:'#5c8e3a', tmdbId:15260,  type:'series' },
    { id:'a_show',       title:'Apenas um Show',                     genre:'Animação / Comédia',  year:'2010–2017', desc:'Mordecai e Rigby são preguiçosos e cometem desastres no parque onde trabalham.',              emoji:'🐦', color:'#4a7a2a', tmdbId:31132,  type:'series' },
    { id:'a_steven',     title:'Steven Universo',                    genre:'Animação / Aventura', year:'2013–2019', desc:'Steven, meio humano meio Gema, aprende a usar poderes e protege a Terra com amor.',           emoji:'💎', color:'#e8536f', tmdbId:61175,  type:'series' },
    { id:'a_gumball',    title:'O Incrível Mundo de Gumball',        genre:'Animação / Comédia',  year:'2011–2019', desc:'Gumball e Darwin se metem em confusões absurdas e hilárias em Elmore.',                      emoji:'🐱', color:'#2a8ec0', tmdbId:37606,  type:'series' },
    { id:'a_ben10',      title:'Ben 10',                             genre:'Animação / Ação',     year:'2005–2008', desc:'Ben encontra o Omnitrix e pode se transformar em 10 alienígenas diferentes.',                emoji:'👽', color:'#4a7a2a', tmdbId:4686,   type:'series' },
    { id:'a_ppg',        title:'As Meninas Superpoderosas',          genre:'Animação / Ação',     year:'1998–2005', desc:'Florzinha, Lindinha e Docinho protegem Townsville de vilões com seus superpoderes.',          emoji:'👧', color:'#c04a7a', tmdbId:607,    type:'series' },
    { id:'a_dexter',     title:'O Laboratório de Dexter',            genre:'Animação / Comédia',  year:'1996–2003', desc:'Dexter é um gênio científico cuja irmã Dee Dee sempre atrapalha seus planos.',               emoji:'🔬', color:'#4a2a7a', tmdbId:2024,   type:'series' },
    { id:'a_johnny',     title:'Johnny Bravo',                       genre:'Animação / Comédia',  year:'1997–2004', desc:'Johnny, vaidoso e musculoso, tenta conquistar as mulheres com péssimo sucesso.',             emoji:'💪', color:'#e8a020', tmdbId:1705,   type:'series' },
    { id:'a_coragem',    title:'Coragem o Cão Covarde',              genre:'Animação / Terror',   year:'1999–2002', desc:'Coragem vive no meio do nada com seus donos e enfrenta monstros horríveis.',                 emoji:'👻', color:'#5c2a7a', tmdbId:954,    type:'series' },
    { id:'a_samurai',    title:'Samurai Jack',                       genre:'Animação / Ação',     year:'2001–2017', desc:'Um samurai viaja no tempo e luta contra o demônio Aku para voltar ao passado.',              emoji:'⚔️', color:'#2a2a3a', tmdbId:30984,  type:'series' },
    { id:'a_trem',       title:'Trem Infinito',                      genre:'Animação / Aventura', year:'2019–2021', desc:'Passageiros embarcam num trem misterioso e precisam resolver seus problemas internos.',       emoji:'🚂', color:'#1a3a5c', tmdbId:93134,  type:'series' },
    { id:'a_greg',       title:'O Mundo de Greg',                   genre:'Animação / Comédia',  year:'2018–presente', desc:'Greg e seu amigo Wirt vivem aventuras hilárias numa cidade pequena.',                    emoji:'🦎', color:'#4a7a2a', tmdbId:79008,  type:'series' },
    { id:'a_ursos',      title:'Ursos sem Curso',                    genre:'Animação / Comédia',  year:'2015–2019', desc:'Três irmãos ursos tentam se encaixar no mundo humano com resultados caóticos.',              emoji:'🐻', color:'#5c4a3a', tmdbId:62643,  type:'series' },
    { id:'a_titãs',      title:'Jovens Titãs',                       genre:'Animação / Ação',     year:'2003–2006', desc:'Robin, Estelar, Aresta, Cyborg e Mutante formam um time de heróis jovens.',                 emoji:'🦸', color:'#3a2a5c', tmdbId:604,    type:'series' },
    { id:'a_titãs_ac',   title:'Jovens Titãs em Ação!',              genre:'Animação / Comédia',  year:'2013–presente', desc:'A versão cômica dos Jovens Titãs, com aventuras leves e muito humor nonsense.',          emoji:'😂', color:'#c04a2a', tmdbId:45140,  type:'series' },
    { id:'a_batman',     title:'Batman: A Série Animada',            genre:'Animação / Ação',     year:'1992–1995', desc:'A versão mais aclamada do Batman em animação — sombria, épica e inesquecível.',              emoji:'🦇', color:'#1a1a2e', tmdbId:2098,   type:'series' },
    { id:'a_liga',       title:'Liga da Justiça Sem Limites',        genre:'Animação / Ação',     year:'2004–2006', desc:'Os maiores heróis do DC se unem para defender a Terra de ameaças colossais.',               emoji:'🌟', color:'#2a3a6e', tmdbId:1639,   type:'series' },
    { id:'a_jjovem',     title:'Justiça Jovem',                      genre:'Animação / Ação',     year:'2010–presente', desc:'A equipe de sidekicks dos grandes heróis opera missões secretas para a Liga.',           emoji:'⚡', color:'#3a5c7a', tmdbId:33217,  type:'series' },
    { id:'a_harley',     title:'Harley Quinn',                       genre:'Animação / Comédia',  year:'2019–presente', desc:'Harley Quinn deixa o Coringa e tenta se tornar uma vilã por conta própria.',            emoji:'🃏', color:'#c0207a', tmdbId:74440,  type:'series' },
    { id:'a_rick',       title:'Rick e Morty',                       genre:'Animação / Ficção',   year:'2013–presente', desc:'Um cientista bêbado e genial viaja pelo cosmos com seu neto inseguro.',                 emoji:'🧪', color:'#2a8e3a', tmdbId:60625,  type:'series' },
  ],
};

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

/* ══════════════════════════════════════════════
   HELPERS — PLAYER
   ══════════════════════════════════════════════ */

function _destroyPlayer() {
  if (_playerTimeout) { clearTimeout(_playerTimeout); _playerTimeout = null; }
  const p = document.getElementById('cinema-modal-player');
  if (p) p.innerHTML = '';
}

function _parseSeasonEpisode(title) {
  if (!title) return [1, 1];
  const m = title.match(/T(\d+)E(\d+)/i);
  return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : [1, 1];
}

function _buildPlayerSrc(item, epIdx, serverIdx) {
  const isSeries = !!(item.episodes || item.type === 'series');
  const server   = PLAYER_SERVERS[serverIdx];

  if (server && item.tmdbId) {
    // FIX Bug 2: o Servidor 2 (vidlink) já tem query params — usar & em vez de ?
    const sep = server.hasParams ? '&' : '?';

    if (isSeries) {
      const ep     = item.episodes ? item.episodes[epIdx] : null;
      const [s, e] = _parseSeasonEpisode(ep?.title);
      const rt     = getResumeTime(item, epIdx);
      return server.tv(item.tmdbId, s, e) + (rt > 0 ? `${sep}t=${rt}` : '');
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
  // SANDBOX: bloqueia redirect de ads e abertura de popups
  iframe.sandbox         = 'allow-scripts allow-same-origin allow-presentation allow-forms';
  iframe.referrerPolicy  = 'no-referrer';
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
  iframe.style.cssText   = 'width:100%;aspect-ratio:16/9;display:block;';
  return iframe;
}

function _buildPlayer(item, epIdx) {
  const playerEl = document.getElementById('cinema-modal-player');
  if (!playerEl) return;
  _destroyPlayer();

  const src = _buildPlayerSrc(item, epIdx, _serverIdx);
  if (!src) { _showPlayerError(playerEl, item); return; }

  // Loading skeleton
  const skeleton = document.createElement('div');
  skeleton.id        = 'cinema-player-skeleton';
  skeleton.className = 'cinema-player-skeleton';
  skeleton.innerHTML = `
    <div class="cinema-player-loading">
      <div class="cinema-player-spinner"></div>
      <span class="cinema-player-loading-text">Carregando ${PLAYER_SERVERS[_serverIdx]?.name || ''}…</span>
    </div>`;
  playerEl.appendChild(skeleton);

  const iframe = _createIframe(src, item.title);
  iframe.onload = () => {
    const sk = document.getElementById('cinema-player-skeleton');
    if (sk) sk.remove();
    if (_playerTimeout) { clearTimeout(_playerTimeout); _playerTimeout = null; }
  };

  // Timeout de 12s → botão trocar servidor
  _playerTimeout = setTimeout(() => {
    const sk = document.getElementById('cinema-player-skeleton');
    if (sk) sk.remove();
    _showServerRetryButton(playerEl, item, epIdx);
  }, PLAYER_TIMEOUT_MS);

  playerEl.appendChild(iframe);

  // Rastreia progresso
  startTracking(item, epIdx, (key, watchedItem, eIdx) => {
    const watchKey = watchedItem.episodes
      ? `${watchedItem.id}_ep${eIdx}`
      : watchedItem.id;
    if (!_watched[watchKey]) {
      _watched[watchKey] = true;
      _saveWatched();
      _renderCatalog();
    }
  });
}

function _showServerRetryButton(container, item, epIdx) {
  const nextIdx  = _serverIdx + 1;
  const hasNext  = nextIdx < PLAYER_SERVERS.length;
  const nextName = hasNext ? PLAYER_SERVERS[nextIdx].name : 'YouTube';
  container.innerHTML = `
    <div class="cinema-server-overlay">
      <div class="cinema-server-msg">
        <div class="cinema-server-icon">⚡</div>
        <div class="cinema-server-title">${PLAYER_SERVERS[_serverIdx]?.name || 'Servidor'} demorou para responder</div>
        <div class="cinema-server-sub">Tente outro servidor ou aguarde</div>
        <div class="cinema-server-btns">
          <button class="cinema-server-btn cinema-server-btn--primary" onclick="window._cinemaNextServer()">
            Trocar para ${nextName}
          </button>
          <button class="cinema-server-btn cinema-server-btn--secondary" onclick="window._cinemaRetryServer()">
            Tentar novamente
          </button>
        </div>
      </div>
    </div>`;
}

function _showPlayerError(container) {
  container.innerHTML = `
    <div class="cinema-server-overlay">
      <div class="cinema-server-msg">
        <div class="cinema-server-icon">🎬</div>
        <div class="cinema-server-title">Conteúdo indisponível no momento</div>
        <div class="cinema-server-sub">Tente novamente mais tarde</div>
      </div>
    </div>`;
}

// FIX Bug 3: usa PLAYER_SERVERS.length (não .length - 1) para que índice >= length
// caia no YouTube fallback dentro de _buildPlayerSrc
window._cinemaNextServer = function () {
  _serverIdx = Math.min(_serverIdx + 1, PLAYER_SERVERS.length); // permite idx = 3 → YouTube fallback
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

async function _saveWatched() {
  if (!_cinemaDoc) return;
  clearTimeout(_saveDebounce);
  _saveDebounce = setTimeout(async () => {
    try { await setDoc(_cinemaDoc, { watched: _watched }); } catch (e) {}
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
    const itemIsMovie = isMovie || item.type === 'movie' || !item.episodes;
    const isWatched   = itemIsMovie ? !!_watched[item.id] : false;
    const watchedEps  = !itemIsMovie
      ? (item.episodes || []).filter((_, i) => !!_watched[`${item.id}_ep${i}`]).length : 0;
    const totalEps    = !itemIsMovie ? (item.episodes || []).length : 0;
    const pct         = totalEps > 0 ? Math.round((watchedEps / totalEps) * 100) : 0;

    // FIX Bug 4: séries com todos os episódios assistidos também recebem o badge
    const allEpsDone  = !itemIsMovie && totalEps > 0 && watchedEps === totalEps;
    const showWatched = isWatched || allEpsDone;

    const thumb = item.thumb ||
      (item.tmdbId ? `https://image.tmdb.org/t/p/w500/` : '');

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
// FIX Bug 1: assinatura corrigida — aceita o 2º argumento (tab) que vinha sendo passado
// em todas as chamadas mas ignorado. O tab não é necessário para abrir o item
// (o item é buscado em todas as listas), mas aceitamos para compatibilidade.
window._openCinemaItem = function (id /*, _tabIgnored */) {
  if (_isModalOpen) _destroyPlayer();

  const allLists = [
    ...CINEMA_CATALOG.series,
    ...CINEMA_CATALOG.filmes,
    ...CINEMA_CATALOG.romance,
    ...CINEMA_CATALOG.doramas,
    ...CINEMA_CATALOG.animacoes,
  ];
  const item = allLists.find(x => x.id === id);
  if (!item) return;

  _currentItem = item;
  _serverIdx   = 0;

  if (item.episodes) {
    try {
      const all     = JSON.parse(localStorage.getItem('cinema_progress_v1') || '{}');
      const entries = Object.values(all).filter(e => e.itemId === id && e.type === 'series');
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
  _renderModal();
};

function _renderModal() {
  const item = _currentItem;
  if (!item) return;

  const isSeries = !!(item.episodes);
  const epCount  = isSeries ? item.episodes.length : 0;
  if (isSeries && _currentEpIdx >= epCount) _currentEpIdx = 0;

  const titleEl  = document.getElementById('cinema-modal-title');
  const epListEl = document.getElementById('cinema-modal-eplist');
  const markBtn  = document.getElementById('cinema-modal-markbtn');

  if (titleEl) titleEl.textContent = `${item.emoji || '🎬'} ${item.title}`;

  _buildPlayer(item, _currentEpIdx);

  if (isSeries && epListEl) {
    epListEl.innerHTML = item.episodes.map((ep, i) => {
      const done = !!_watched[`${item.id}_ep${i}`];
      return `
        <div class="cinema-ep-item ${i === _currentEpIdx ? 'active' : ''} ${done ? 'ep-done' : ''}"
             onclick="window._cinemaSwitchEp(${i})">
          <span class="cinema-ep-check">${done ? '✓' : (i + 1)}</span>
          <span class="cinema-ep-name">${ep.title}</span>
        </div>`;
    }).join('');
    epListEl.style.display = 'flex';
  } else if (epListEl) {
    epListEl.style.display = 'none';
  }

  if (markBtn) {
    const key  = isSeries ? `${item.id}_ep${_currentEpIdx}` : item.id;
    const done = !!_watched[key];
    markBtn.textContent = done ? '✓ Marcado como assistido' : '☑ Marcar como assistido';
    markBtn.classList.toggle('done', done);
    markBtn.onclick = () => { _markWatched(key); _renderModal(); };
  }
}

window._cinemaSwitchEp = function (idx) {
  if (idx === _currentEpIdx) return;
  stopTracking();
  _serverIdx    = 0;
  _currentEpIdx = idx;
  _renderModal();
};

window._closeCinemaModal = function () {
  const overlay = document.getElementById('cinema-modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  stopTracking();
  _destroyPlayer();
  _isModalOpen  = false;
  _currentItem  = null;
  _currentEpIdx = 0;
  _serverIdx    = 0;
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
