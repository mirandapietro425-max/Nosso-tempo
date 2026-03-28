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
export const START_DATE       = new Date('2024-10-11'); // início do relacionamento
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
export const LS_GMAPS_KEY    = 'pe_gmaps_key';

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
  { emoji: '😴', label: 'Cansado' },
  { emoji: '😇', label: 'Gratitude' },
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
export const EVENTOS = [
  {
    id: 'natal', check: (d, m) => m === 11 && d === 25,
    banner: '🎄 Feliz Natal, meu amor! 🎄',
    bg: 'radial-gradient(ellipse at 50% 60%, #c8f5c8 0%, #e8f5e8 55%, #d4edda 100%)',
    accent: '#2e7d32', dark: false,
    elements: ['🎄','⭐','❄️','🎁','🔔'],
    popup: 'Que esse Natal seja iluminado pelo nosso amor. Te desejo tudo de mais lindo neste dia especial.'
  },
  {
    id: 'ano-novo', check: (d, m) => m === 0 && d === 1,
    banner: '🎆 Feliz Ano Novo! Que 2025 seja nosso! 🎆',
    bg: 'radial-gradient(ellipse at 50% 60%, #1a1a2e 0%, #16213e 55%, #0f3460 100%)',
    accent: '#e94560', dark: true,
    elements: ['🎆','✨','🥂','🎉','⭐'],
    popup: 'Um novo ano, uma nova página da nossa história. Que seja lindo, como você.'
  },
  {
    id: 'namorados', check: (d, m) => m === 5 && d === 12,
    banner: '💕 Feliz Dia dos Namorados! 💕',
    bg: 'radial-gradient(ellipse at 50% 60%, #ffe0e8 0%, #fff0f3 55%, #fce4ec 100%)',
    accent: '#e8536f', dark: false,
    elements: ['💕','🌹','💌','✨','🥰'],
    popup: 'Hoje é o dia de celebrar o que construímos juntos. Te amo mais do que consigo expressar.'
  },
  {
    id: 'aniv-pietro', check: (d, m) => m === 0 && d === 9,
    banner: '🎂 Feliz Aniversário, Pietro! 🎂',
    bg: 'radial-gradient(ellipse at 50% 60%, #e3f2fd 0%, #e8f5e9 55%, #fff9c4 100%)',
    accent: '#1565c0', dark: false,
    elements: ['🎂','🎉','🎁','✨','🥳'],
    popup: 'Hoje o mundo ganhou uma das melhores pessoas que já existiu. Feliz aniversário!'
  },
  {
    id: 'aniv-emilly', check: (d, m) => m === 3 && d === 24,
    banner: '🎂 Feliz Aniversário, Emilly! 🎂',
    bg: 'radial-gradient(ellipse at 50% 60%, #fce4ec 0%, #f8bbd0 30%, #fff9c4 100%)',
    accent: '#e8536f', dark: false,
    elements: ['🎂','🌸','💐','✨','🥳'],
    popup: 'Feliz aniversário para a pessoa mais especial da minha vida. Que seu dia seja tão lindo quanto você.'
  },
  {
    id: 'mesversario', check: (d, m) => d === 11,
    banner: '💕 Feliz Mesversário! Mais um mês juntos 🥂',
    bg: 'radial-gradient(ellipse at 50% 60%, #ffe0e8 0%, #fff0f3 55%, #fce4ec 100%)',
    accent: '#e8536f', dark: false,
    elements: ['💕','🥂','✨','💌','🌹'],
    popup: 'Mais um mês de amor, cumplicidade e histórias bonitas juntos. Te amo.'
  },
];
