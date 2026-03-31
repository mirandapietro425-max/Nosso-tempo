/* ═══════════════════════════════════════════════
   PIETRO & EMILLY — config.js
   Configurações centralizadas do projeto
   ═══════════════════════════════════════════════ */

// ── Firebase ──
export const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyB-XzRDCilsgzGrVz8RDYvSsNvKgxQROUs",
  authDomain:        "nosso-tempo-71252.firebaseapp.com",
  projectId:         "nosso-tempo-71252",
  storageBucket:     "nosso-tempo-71252.firebasestorage.app",
  messagingSenderId: "963553550690",
  appId:             "1:963553550690:web:5680d9317172289f988c3b"
};

// ── Cloudinary ──
export const CLOUDINARY_CLOUD  = 'dqy0l7fh6';
export const CLOUDINARY_PRESET = 'nosso_tempo_cal';

// ── ImgBB ──
export const IMGBB_KEY = 'fd49cf34ebd541510c6f4b64abc3f4f8';

// ── TMDB ──
export const TMDB_KEY = '8265bd1679663a7ea12ac168da84d2e8';

// ── Datas especiais ──
export const START_DATE       = new Date('2024-10-11T03:00:00Z'); // início — meia-noite horário de Brasília (UTC-3)
export const ANNIVERSARY_DAY  = 11;                    // dia do mesversário
export const BDAY_MONTH       = 0;  // Janeiro (0-indexed) — aniversário Pietro: 9 jan
export const BDAY_DAY         = 9;
export const EMILLY_BDAY_MONTH = 3;  // Abril (0-indexed) — aniversário Emilly: 24 abr
export const EMILLY_BDAY_DAY   = 24;

// ── Senha do Mural ──
export const SENHA_MURAL = 'Sody6';

// ── Galeria ──
export const GALLERY_SLOTS = 6;

// ── Local Storage Keys ──
export const LS_DAILY_POPUP  = 'pe_daily_seen';

// ── Playlist ──
export const PLAYLIST = [
  { name: "Mania de Você",   artist: "Raça Negra",   ytId: "OKw0iTXb0ZI" },
  { name: "Lança Perfume",   artist: "Rita Lee",      ytId: "zFIqVUrh3zw" },
  { name: "Skyfall",         artist: "Adele",         ytId: "DeumyOzKqgI" },
  { name: "Os Anjos Cantam", artist: "Zé Ramalho",   ytId: "ICS6uKC93w0" },
  { name: "Home",            artist: "Michael Bublé", ytId: "MCFIEkz9nNQ" },
  { name: "Sailor Song",     artist: "Gigi Perez",    ytId: "1lrFsXkT_rM" },
];

// ── Recadinhos diários ──
export const RECADINHOS = [
  "Minha Emilly linda, acordei pensando em você e no quanto a minha vida ficou mais bonita depois que você entrou nela.",
  "Cada mensagem tua faz o meu dia ficar melhor. Você não imagina o quanto.",
  "Você tem o sorriso mais lindo que já vi. E os olhos mais verdes do mundo.",
  "Hoje, e sempre, quero que saibas que és a coisa mais especial que já aconteceu comigo.",
  "Saudade tua é constante — não importa se faz horas ou minutos desde a última vez que conversamos.",
  "Você é minha pessoa favorita neste mundo. Ponto.",
  "Obrigado por ser tão você. Por ser gentil, cuidadosa, engraçada e linda ao mesmo tempo.",
  "Fico pensando em como seria contar a minha história sem você. E fico feliz que nunca vá precisar.",
  "Teu jeito de ser me encanta todo dia. Cada detalhe.",
  "Você é do tipo de pessoa que muda a vida de quem tem a sorte de te conhecer. E eu sou o mais sortudo de todos.",
  "Minha Emilly, que hoje seja um dia digno de você — cheio de leveza, sorrisos e coisas bonitas, igual a você.",
  "Tem algo nos teus olhos verdes que me faz querer ser uma versão melhor de mim. Obrigado por isso.",
  "Você não precisa fazer nada de especial para ser especial. Você já é, só por ser você.",
  "Cada risada tua é minha música favorita. Pode tocar sempre.",
  "Às vezes fico pensando como seria minha vida sem ter te encontrado. Fico feliz que eu nunca vá descobrir.",
  "Tu és aquela pessoa que aparece nas histórias bonitas. E essa é a nossa.",
  "Que o teu dia seja tão gentil contigo quanto você é comigo.",
  "Você tem aquele jeito raro de fazer as pessoas ao redor se sentirem bem. Isso é um dom, e você usa ele com tanta delicadeza.",
  "Eu te escolho hoje, amanhã e em todos os dias que ainda vierem. Sempre.",
  "Meu amor, você é minha calmaria favorita num mundo cheio de barulho.",
  "Que a vida te devolva toda a ternura que você semeia por onde passa.",
  "Você é meu lar. E não preciso de mais nenhum.",
  "Obrigado por cada abraço que parece dizer tudo sem usar nenhuma palavra.",
  "Você é o melhor capítulo da minha história, e ainda nem chegou na melhor parte.",
  "Minha princesa, que o teu coração nunca perca essa pureza que te faz tão você.",
  "Eu te amo do jeito que você é — com todas as suas espertezas, delicadezas e aqueles olhos que não me largam.",
  "Que hoje você sinta, de algum jeito, o quanto é amada.",
  "Você veio pra ficar. E eu fico feliz todo dia com isso.",
  "Meu amor eterno, que o nosso amor seja sempre verdadeiro e livre — como você merece.",
];

// ── Mood options ──
export const MOOD_OPTIONS = [
  { emoji: '😍', label: 'Apaixonado' },
  { emoji: '😊', label: 'Feliz' },
  { emoji: '🥰', label: 'Carinhoso' },
  { emoji: '😄', label: 'Animado' },
  { emoji: '🤩', label: 'Radiante' },
  { emoji: '😌', label: 'Tranquilo' },
  { emoji: '🥺', label: 'Com saudade' },
  { emoji: '😴', label: 'Sonolento' },
  { emoji: '🤔', label: 'Pensativo' },
  { emoji: '😎', label: 'Confiante' },
  { emoji: '💪', label: 'Determinado' },
  { emoji: '🤗', label: 'Acolhedor' },
  { emoji: '😅', label: 'Aliviado' },
  { emoji: '😢', label: 'Triste' },
  { emoji: '😤', label: 'Frustrado' },
  { emoji: '🥵', label: 'Estressado' },
  { emoji: '🤒', label: 'Indisposto' },
  { emoji: '🥱', label: 'Cansado' },
  { emoji: '😇', label: 'Gratidão' },
  { emoji: '🌟', label: 'Inspirado' },
];

export const DISNEY_EMILLY = [
  { emoji: '👸', label: 'Cinderela' },
  { emoji: '🌹', label: 'Bela' },
  { emoji: '🧜‍♀️', label: 'Ariel' },
  { emoji: '🌺', label: 'Moana' },
  { emoji: '❄️', label: 'Elsa' },
  { emoji: '🌸', label: 'Anna' },
  { emoji: '🐉', label: 'Mulan' },
  { emoji: '🌙', label: 'Jasmine' },
  { emoji: '🐸', label: 'Tiana' },
  { emoji: '🌿', label: 'Pocahontas' },
  { emoji: '🌼', label: 'Rapunzel' },
  { emoji: '🍎', label: 'Branca de Neve' },
  { emoji: '🌊', label: 'Vaiana' },
  { emoji: '🦁', label: 'Nala' },
  { emoji: '💜', label: 'Raya' },
];

export const DISNEY_PIETRO = [
  { emoji: '🤴', label: 'Príncipe' },
  { emoji: '🦁', label: 'Simba' },
  { emoji: '🧞', label: 'Aladdin' },
  { emoji: '🐾', label: 'Fera' },
  { emoji: '🧊', label: 'Kristoff' },
  { emoji: '🌊', label: 'Maui' },
  { emoji: '⚔️', label: 'Flynn Rider' },
  { emoji: '🎵', label: 'Eric' },
  { emoji: '🌙', label: 'Naveen' },
  { emoji: '🦅', label: 'John Smith' },
  { emoji: '🐲', label: 'Shang' },
  { emoji: '🌟', label: 'Hércules' },
  { emoji: '🗡️', label: 'Phillip' },
  { emoji: '🌿', label: 'Tarzan' },
  { emoji: '🚀', label: 'Buzz' },
];

// ── Eventos sazonais ──
// Eventos com check: null são resolvidos dinamicamente em app.js
export const EVENTOS = [
  {
    id: 'aniv-pietro', check: (d, m) => m === 0 && d === 9,
    banner: '🎂 Feliz aniversário, Pietro! Hoje é o seu dia especial 💙',
    popup: 'Feliz aniversário, Pietro! Que este dia seja tão lindo quanto você merece. A Emilly te deseja tudo de melhor 💙🎂',
    elements: ['🎂','🎈','🎊','✨','💙','🥳'],
    bg: 'radial-gradient(ellipse at 50% 60%, #ddeeff 0%, #eef6ff 55%, #f0f8ff 100%)',
    accent: '#4a90d9',
    playlist: [
      { name: 'Parabéns pra Você', artist: 'Tradicional', ytId: 'ZR3Tlu0G_zM' },
      { name: 'Skyfall', artist: 'Adele', ytId: 'DeumyOzKqgI' },
      { name: 'Home', artist: 'Michael Bublé', ytId: 'MCFIEkz9nNQ' },
      { name: 'Sailor Song', artist: 'Gigi Perez', ytId: '1lrFsXkT_rM' },
    ],
    musicIdx: 1, // Skyfall
  },
  {
    id: 'aniv-emilly', check: (d, m) => m === 3 && d === 24,
    banner: '🎂 Feliz aniversário, Emilly! Hoje é o seu dia especial 💗',
    popup: 'Feliz aniversário, Emilly! Você é a pessoa mais especial do mundo e merece todo o amor deste dia 💗🎂',
    elements: ['🎂','🎈','🎀','✨','💗','🥳'],
    bg: 'radial-gradient(ellipse at 50% 60%, #ffe0f0 0%, #fff0f8 55%, #fff8fc 100%)',
    accent: '#e8536f',
    playlist: [
      { name: 'Sailor Song', artist: 'Gigi Perez', ytId: '1lrFsXkT_rM' },
      { name: 'Skyfall', artist: 'Adele', ytId: 'DeumyOzKqgI' },
      { name: 'Mania de Você', artist: 'Raça Negra', ytId: 'OKw0iTXb0ZI' },
    ],
    musicIdx: 0, // Sailor Song
  },
  {
    id: 'mesversario', check: (d, m) => d === 11,
    banner: '🥂 Feliz mesversário, Pietro & Emilly! Mais um mês de amor 💕',
    popup: 'Feliz mesversário! Cada dia ao seu lado é um presente. Que este amor cresça sempre mais 🥂💕',
    elements: ['🌸','🌷','💕','✨','🥂','💝'],
    bg: 'radial-gradient(ellipse at 50% 60%, #ffe0e8 0%, #fff0f3 55%, #fce4ec 100%)',
    accent: '#e8536f',
    playlist: [
      { name: 'Mania de Você', artist: 'Raça Negra', ytId: 'OKw0iTXb0ZI' },
      { name: 'Sailor Song', artist: 'Gigi Perez', ytId: '1lrFsXkT_rM' },
      { name: 'Skyfall', artist: 'Adele', ytId: 'DeumyOzKqgI' },
    ],
    musicIdx: 0,
  },
  {
    id: 'natal', check: (d, m) => m === 11 && d === 25,
    banner: '🎄 Feliz Natal, Pietro & Emilly! Que este dia seja cheio de amor e magia ✨',
    popup: 'Feliz Natal! Que a magia deste dia envolva vocês dois com muito amor, alegria e cumplicidade 🎄🎁✨',
    elements: ['🎄','⭐','🎁','❄️','🦌','🔔','🧦','🕯️'],
    bg: 'radial-gradient(ellipse at 50% 60%, #d4edda 0%, #e8f5e9 55%, #f1f8e9 100%)',
    accent: '#2e7d32',
    playlist: [
      { name: 'All I Want for Christmas Is You', artist: 'Mariah Carey', ytId: 'aAkMkVFwAoo' },
      { name: 'Last Christmas', artist: 'Wham!', ytId: 'E8gmARGvPlI' },
      { name: 'Jingle Bell Rock', artist: 'Bobby Helms', ytId: 'Z0ajuTaHBtM' },
      { name: 'Noite Feliz', artist: 'Tradicional', ytId: 'PKkXmSMVKkI' },
      { name: 'Home', artist: 'Michael Bublé', ytId: 'MCFIEkz9nNQ' },
      { name: 'It\'s Beginning to Look a Lot Like Christmas', artist: 'Michael Bublé', ytId: 'fSwUPWTQBcg' },
    ],
    musicIdx: 0,
  },
  {
    id: 'vespera-natal', check: (d, m) => m === 11 && d === 24,
    banner: '🎄 Feliz Véspera de Natal! A magia começa hoje 🌟',
    popup: 'A noite mais mágica do ano chegou! Feliz Natal a vocês dois, Pietro & Emilly 🎄✨',
    elements: ['🎄','⭐','🎁','❄️','🔔','🕯️'],
    bg: 'radial-gradient(ellipse at 50% 60%, #d4edda 0%, #e8f5e9 55%, #f1f8e9 100%)',
    accent: '#2e7d32',
    playlist: [
      { name: 'All I Want for Christmas Is You', artist: 'Mariah Carey', ytId: 'aAkMkVFwAoo' },
      { name: 'Last Christmas', artist: 'Wham!', ytId: 'E8gmARGvPlI' },
      { name: 'Home', artist: 'Michael Bublé', ytId: 'MCFIEkz9nNQ' },
      { name: 'Noite Feliz', artist: 'Tradicional', ytId: 'PKkXmSMVKkI' },
    ],
    musicIdx: 0,
  },
  {
    id: 'ano-novo', check: (d, m) => m === 0 && d === 1,
    banner: '🎆 Feliz Ano Novo! Que 2026 seja incrível para vocês dois 🥂✨',
    popup: 'Feliz Ano Novo, Pietro & Emilly! Que este novo ano traga ainda mais amor, cumplicidade e momentos inesquecíveis juntos 🎆🥂💕',
    elements: ['🎆','🎇','✨','🥂','🎊','⭐','🌟'],
    bg: 'radial-gradient(ellipse at 50% 60%, #1a1a2e 0%, #16213e 55%, #0f3460 100%)',
    accent: '#f0c040', dark: true,
    playlist: [
      { name: 'Os Anjos Cantam', artist: 'Zé Ramalho', ytId: 'ICS6uKC93w0' },
      { name: 'Auld Lang Syne', artist: 'Traditional', ytId: 'DrMZGlQS3M4' },
      { name: 'New Year\'s Day', artist: 'U2', ytId: 'uUNqC9WMbco' },
      { name: 'Home', artist: 'Michael Bublé', ytId: 'MCFIEkz9nNQ' },
    ],
    musicIdx: 0,
  },
  {
    id: 'reveillon', check: (d, m) => m === 11 && d === 31,
    banner: '🎆 Feliz Réveillon! A contagem regressiva começa 🥂',
    popup: 'Última noite do ano! Que a virada seja especial para vocês dois 🎆💕',
    elements: ['🎆','🎇','✨','🥂','🎊'],
    bg: 'radial-gradient(ellipse at 50% 60%, #1a1a2e 0%, #16213e 55%, #0f3460 100%)',
    accent: '#f0c040', dark: true,
    playlist: [
      { name: 'Os Anjos Cantam', artist: 'Zé Ramalho', ytId: 'ICS6uKC93w0' },
      { name: 'Auld Lang Syne', artist: 'Traditional', ytId: 'DrMZGlQS3M4' },
      { name: 'Mania de Você', artist: 'Raça Negra', ytId: 'OKw0iTXb0ZI' },
    ],
    musicIdx: 0,
  },
  {
    id: 'pascoa', check: null,
    banner: '🐣 Feliz Páscoa, Pietro & Emilly! Que este dia seja doce como o chocolate 🍫',
    popup: 'Feliz Páscoa! Que este dia traga alegria, renovação e muito chocolate para vocês dois 🐣🌸🍫',
    elements: ['🐣','🐰','🥚','🌸','🍫','🌷','🌼'],
    bg: 'radial-gradient(ellipse at 50% 60%, #fff3e0 0%, #fffde7 55%, #f9fbe7 100%)',
    accent: '#f57f17',
    playlist: [
      { name: 'Aleluia', artist: 'Handel', ytId: 'IFPwm6g4pSU' },
      { name: 'Mania de Você', artist: 'Raça Negra', ytId: 'OKw0iTXb0ZI' },
      { name: 'Sailor Song', artist: 'Gigi Perez', ytId: '1lrFsXkT_rM' },
    ],
    musicIdx: 1,
  },
  {
    id: 'carnaval', check: null,
    banner: '🎭 Feliz Carnaval! Curta a folia com muito amor 🎊',
    popup: 'Feliz Carnaval, Pietro & Emilly! Que a festa seja cheia de alegria, cores e muito amor 🎭🎊💃',
    elements: ['🎭','🎊','🎉','🌈','🎶','💃','🕺'],
    bg: 'radial-gradient(ellipse at 50% 60%, #fff9c4 0%, #fff3e0 55%, #fce4ec 100%)',
    accent: '#e040fb',
    playlist: [
      { name: 'Lança Perfume', artist: 'Rita Lee', ytId: 'zFIqVUrh3zw' },
      { name: 'Mania de Você', artist: 'Raça Negra', ytId: 'OKw0iTXb0ZI' },
      { name: 'Aquele Abraço', artist: 'Gilberto Gil', ytId: 'kKjRSUmW_cg' },
      { name: 'Baile de Máscaras', artist: 'Alceu Valença', ytId: 'JHOCNzJqxS0' },
    ],
    musicIdx: 0,
  },
  {
    id: 'namorados', check: (d, m) => m === 5 && d === 12,
    banner: '💕 Feliz Dia dos Namorados, Pietro & Emilly! Amor eterno 💕',
    popup: 'Feliz Dia dos Namorados! Para o casal mais lindo: que este amor de vocês seja cada vez mais bonito, verdadeiro e eterno 💕🌹',
    elements: ['💕','❤️','🌹','💌','💝','💘','✨'],
    bg: 'radial-gradient(ellipse at 50% 60%, #fce4ec 0%, #fff0f3 55%, #fff8f9 100%)',
    accent: '#e8536f',
    playlist: [
      { name: 'Mania de Você', artist: 'Raça Negra', ytId: 'OKw0iTXb0ZI' },
      { name: 'Thinking Out Loud', artist: 'Ed Sheeran', ytId: 'lp-EO5I60KA' },
      { name: 'Can\'t Help Falling in Love', artist: 'Elvis Presley', ytId: 'vGJTaP6anOU' },
      { name: 'Sailor Song', artist: 'Gigi Perez', ytId: '1lrFsXkT_rM' },
      { name: 'Perfect', artist: 'Ed Sheeran', ytId: '2Vv-BfVoq4g' },
    ],
    musicIdx: 0,
  },
  {
    id: 'dia-maes', check: null,
    banner: '🌸 Feliz Dia das Mães! Celebrando todas as mães com amor 🌸',
    popup: 'Feliz Dia das Mães! Uma homenagem especial a todas as mães incríveis 🌸💐',
    elements: ['🌸','💐','🌷','🌺','💝','🌼'],
    bg: 'radial-gradient(ellipse at 50% 60%, #fce4ec 0%, #fff0f3 55%, #fff8f9 100%)',
    accent: '#e91e8c',
    playlist: [
      { name: 'Os Anjos Cantam', artist: 'Zé Ramalho', ytId: 'ICS6uKC93w0' },
      { name: 'Mania de Você', artist: 'Raça Negra', ytId: 'OKw0iTXb0ZI' },
      { name: 'Home', artist: 'Michael Bublé', ytId: 'MCFIEkz9nNQ' },
    ],
    musicIdx: 0,
  },
  {
    id: 'dia-pais', check: null,
    banner: '👨‍👧 Feliz Dia dos Pais! Uma homenagem a todos os pais 💙',
    popup: 'Feliz Dia dos Pais! Uma homenagem especial a todos os pais maravilhosos 👨‍👧💙',
    elements: ['👨‍👧','💙','⭐','🎊','🏆','🌟'],
    bg: 'radial-gradient(ellipse at 50% 60%, #e3f2fd 0%, #e8f5e9 55%, #f1f8e9 100%)',
    accent: '#1565c0',
    playlist: [
      { name: 'Home', artist: 'Michael Bublé', ytId: 'MCFIEkz9nNQ' },
      { name: 'Os Anjos Cantam', artist: 'Zé Ramalho', ytId: 'ICS6uKC93w0' },
      { name: 'Mania de Você', artist: 'Raça Negra', ytId: 'OKw0iTXb0ZI' },
    ],
    musicIdx: 0,
  },
  {
    id: 'finados', check: (d, m) => m === 10 && d === 2,
    banner: '🕯️ Dia de Finados — em memória de quem amamos 🙏',
    popup: 'Dia de Finados. Um momento de reflexão e carinho por quem partiu 🕯️🙏',
    elements: ['🕯️','🌷','🌸','🙏','⭐'],
    bg: 'radial-gradient(ellipse at 50% 60%, #f3e5f5 0%, #ede7f6 55%, #e8eaf6 100%)',
    accent: '#7b1fa2',
    playlist: [
      { name: 'Skyfall', artist: 'Adele', ytId: 'DeumyOzKqgI' },
      { name: 'Os Anjos Cantam', artist: 'Zé Ramalho', ytId: 'ICS6uKC93w0' },
    ],
    musicIdx: 0,
  },
  {
    id: 'independencia', check: (d, m) => m === 8 && d === 7,
    banner: '🇧🇷 Feliz Dia da Independência do Brasil! 7 de Setembro 🇧🇷',
    popup: 'Feliz 7 de Setembro! Viva o Brasil e viva o amor de vocês dois 🇧🇷💚💛',
    elements: ['🇧🇷','💚','💛','⭐','🎊','✨'],
    bg: 'radial-gradient(ellipse at 50% 60%, #e8f5e9 0%, #fffde7 55%, #f1f8e9 100%)',
    accent: '#2e7d32',
    playlist: [
      { name: 'Aquele Abraço', artist: 'Gilberto Gil', ytId: 'kKjRSUmW_cg' },
      { name: 'País Tropical', artist: 'Jorge Ben Jor', ytId: 'l3QLtEe-lKw' },
      { name: 'Mania de Você', artist: 'Raça Negra', ytId: 'OKw0iTXb0ZI' },
    ],
    musicIdx: 0,
  },
  {
    id: 'tiradentes', check: (d, m) => m === 3 && d === 21,
    banner: '🇧🇷 Feliz Tiradentes! Feriado Nacional 🎊',
    popup: 'Tiradentes — feriado nacional. Aproveitem o dia juntos com muito amor 💕',
    elements: ['🇧🇷','⭐','🌟','🎊'],
    bg: 'radial-gradient(ellipse at 50% 60%, #e8f5e9 0%, #fffde7 55%, #f1f8e9 100%)',
    accent: '#2e7d32',
    playlist: [
      { name: 'Mania de Você', artist: 'Raça Negra', ytId: 'OKw0iTXb0ZI' },
      { name: 'Sailor Song', artist: 'Gigi Perez', ytId: '1lrFsXkT_rM' },
    ],
    musicIdx: 0,
  },
  {
    id: 'republica', check: (d, m) => m === 10 && d === 15,
    banner: '🇧🇷 Feliz Proclamação da República! Feriado Nacional 🎊',
    popup: 'Proclamação da República — aproveitem o feriado juntos 💕🇧🇷',
    elements: ['🇧🇷','⭐','🌟','🎊'],
    bg: 'radial-gradient(ellipse at 50% 60%, #e8f5e9 0%, #fffde7 55%, #f1f8e9 100%)',
    accent: '#2e7d32',
    playlist: [
      { name: 'Mania de Você', artist: 'Raça Negra', ytId: 'OKw0iTXb0ZI' },
      { name: 'Sailor Song', artist: 'Gigi Perez', ytId: '1lrFsXkT_rM' },
    ],
    musicIdx: 0,
  },
  {
    id: 'aparecida', check: (d, m) => m === 9 && d === 12,
    banner: '🙏 Feliz Dia de Nossa Senhora Aparecida! Feriado Nacional 🌸',
    popup: 'Dia de Nossa Senhora Aparecida — que a fé e o amor iluminem o caminho de vocês dois 🙏🌸',
    elements: ['🌸','🙏','⭐','🕯️','🌷'],
    bg: 'radial-gradient(ellipse at 50% 60%, #fce4ec 0%, #fff0f3 55%, #fff8f9 100%)',
    accent: '#c2185b',
    playlist: [
      { name: 'Os Anjos Cantam', artist: 'Zé Ramalho', ytId: 'ICS6uKC93w0' },
      { name: 'Home', artist: 'Michael Bublé', ytId: 'MCFIEkz9nNQ' },
    ],
    musicIdx: 0,
  },
  {
    id: 'halloween', check: (d, m) => m === 9 && d === 31,
    banner: '🎃 Happy Halloween! Que o susto seja de amor 👻',
    popup: 'Halloween! A noite mais assustadora do ano — mas nada mais assustador do que o quanto vocês dois se amam 🎃👻💕',
    elements: ['🎃','👻','🦇','🕷️','🌙','⭐','🕸️'],
    bg: 'radial-gradient(ellipse at 50% 60%, #1a1a2e 0%, #16213e 55%, #2d1b2e 100%)',
    accent: '#ff6600', dark: true,
    playlist: [
      { name: 'Thriller', artist: 'Michael Jackson', ytId: 'sOnqjkJTMaA' },
      { name: 'This Is Halloween', artist: 'Danny Elfman', ytId: 'MJKdLPrBOAY' },
      { name: 'Somebody That I Used to Know', artist: 'Gotye', ytId: 'MK6TXMsvgQg' },
      { name: 'Skyfall', artist: 'Adele', ytId: 'DeumyOzKqgI' },
    ],
    musicIdx: 0,
  },
  {
    id: 'sao-joao', check: (d, m) => m === 5 && d >= 13 && d <= 24,
    banner: '🎉 Arraiá! Feliz Festa Junina, Pietro & Emilly! 🌽',
    popup: 'Arraiá! Festa Junina chegou — que vocês dois dancem forró juntos com muito amor e alegria 🎉🌽💃',
    elements: ['🎉','🌽','🎆','⭐','🌸','🎶','🏮'],
    bg: 'radial-gradient(ellipse at 50% 60%, #fff9c4 0%, #fff3e0 55%, #fbe9e7 100%)',
    accent: '#f57f17',
    playlist: [
      { name: 'Xote das Meninas', artist: 'Luiz Gonzaga', ytId: 'lfXPVMlOEjA' },
      { name: 'Asa Branca', artist: 'Luiz Gonzaga', ytId: 'gKVB_5fRkmo' },
      { name: 'Baião', artist: 'Luiz Gonzaga', ytId: 'i5FeKq1JM3g' },
      { name: 'Lança Perfume', artist: 'Rita Lee', ytId: 'zFIqVUrh3zw' },
    ],
    musicIdx: 0,
  },
];
