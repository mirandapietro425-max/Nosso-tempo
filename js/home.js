/* ═══════════════════════════════════════════════
   PIETRO & EMILLY — home.js
   Nossa Casinha + Pet Virtual + Quiz Diário
   ═══════════════════════════════════════════════ */

import { getFirestore, doc, getDoc, setDoc, onSnapshot }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ════════════════════════════════════════════
   QUIZ QUESTIONS BANK
   ════════════════════════════════════════════ */
const QUIZ_QUESTIONS = [
  // Programação
  { cat: 'Dev', q: 'O que significa "HTML"?', opts: ['HyperText Markup Language','High Text Making Language','Hyper Transfer Markup Link','HyperText Modern Language'], ans: 0 },
  { cat: 'Dev', q: 'Qual símbolo inicia um comentário em JavaScript?', opts: ['#','//','--','**'], ans: 1 },
  { cat: 'Dev', q: 'O que é CSS?', opts: ['Linguagem de programação','Banco de dados','Linguagem de estilo visual','Sistema operacional'], ans: 2 },
  { cat: 'Dev', q: 'O que faz o comando "console.log()"?', opts: ['Salva um arquivo','Exibe mensagem no console','Cria um loop','Conecta ao servidor'], ans: 1 },
  { cat: 'Dev', q: 'Em que ano o JavaScript foi criado?', opts: ['1989','1995','2001','2008'], ans: 1 },
  { cat: 'Dev', q: 'Qual desses é um framework JavaScript?', opts: ['Django','Laravel','React','Flask'], ans: 2 },
  { cat: 'Dev', q: 'O que é um "bug" em programação?', opts: ['Um inseto no computador','Um erro no código','Um tipo de vírus','Uma linguagem nova'], ans: 1 },
  { cat: 'Dev', q: 'O que significa "API"?', opts: ['Application Programming Interface','Advanced Program Integration','Automated Process Interaction','Application Protocol Index'], ans: 0 },
  // Matemática
  { cat: 'Math', q: 'Quanto é 7 × 8?', opts: ['54','56','58','62'], ans: 1 },
  { cat: 'Math', q: 'Qual é a raiz quadrada de 144?', opts: ['11','12','13','14'], ans: 1 },
  { cat: 'Math', q: 'Quanto é 15% de 200?', opts: ['20','25','30','35'], ans: 2 },
  { cat: 'Math', q: 'Qual é o número pi aproximado?', opts: ['2,71','3,14','3,41','2,14'], ans: 1 },
  { cat: 'Math', q: 'Se um triângulo tem ângulos de 90° e 45°, qual é o terceiro?', opts: ['30°','45°','60°','75°'], ans: 1 },
  { cat: 'Math', q: 'Quanto é 2 elevado a 10?', opts: ['512','1024','2048','256'], ans: 1 },
  { cat: 'Math', q: 'Qual é o resultado de 3/4 + 1/4?', opts: ['4/8','1','3/8','2/4'], ans: 1 },
  { cat: 'Math', q: 'Quantos lados tem um hexágono?', opts: ['5','6','7','8'], ans: 1 },
  // Português
  { cat: 'Português', q: 'Qual é o plural de "pão"?', opts: ['Pãos','Pões','Pães','Pãoes'], ans: 2 },
  { cat: 'Português', q: 'O que é um substantivo?', opts: ['Palavra que indica ação','Palavra que nomeia seres e coisas','Palavra que qualifica','Palavra que liga orações'], ans: 1 },
  { cat: 'Português', q: 'Qual é o antônimo de "generoso"?', opts: ['Humilde','Sovina','Orgulhoso','Fiel'], ans: 1 },
  { cat: 'Português', q: '"Mal" ou "mau"? — "Ele é um ___ elemento."', opts: ['mal','mau'], ans: 1 },
  { cat: 'Português', q: 'Qual figura de linguagem é "O mar de gente na festa"?', opts: ['Metáfora','Metonímia','Hipérbole','Personificação'], ans: 0 },
  { cat: 'Português', q: 'O que é um haiku?', opts: ['Poema japonês de 3 versos','Romance medieval','Fábula africana','Soneto italiano'], ans: 0 },
  { cat: 'Português', q: 'Qual palavra está escrita corretamente?', opts: ['Excessão','Exceção','Exeção','Excecão'], ans: 1 },
  { cat: 'Português', q: 'Quem escreveu "Dom Casmurro"?', opts: ['José de Alencar','Machado de Assis','Clarice Lispector','Carlos Drummond'], ans: 1 },
  // Religião / Cultura
  { cat: 'Cultura', q: 'Qual é o livro sagrado do Islamismo?', opts: ['Torá','Bíblia','Alcorão','Vedas'], ans: 2 },
  { cat: 'Cultura', q: 'Quantos apóstolos Jesus escolheu?', opts: ['10','12','7','14'], ans: 1 },
  { cat: 'Cultura', q: 'Em qual cidade Jesus nasceu?', opts: ['Jerusalém','Nazaré','Belém','Cafarnaum'], ans: 2 },
  { cat: 'Cultura', q: 'Qual é o animal símbolo do Budismo?', opts: ['Leão','Tigre','Elefante','Serpente'], ans: 2 },
  { cat: 'Cultura', q: 'Quantos dias durou a criação segundo a Bíblia?', opts: ['5','6','7','8'], ans: 1 },
  { cat: 'Cultura', q: 'Qual religião acredita no karma e reencarnação?', opts: ['Judaísmo','Budismo','Islamismo','Protestantismo'], ans: 1 },
  // Curiosidades Gerais
  { cat: 'Geral', q: 'Qual é o maior planeta do Sistema Solar?', opts: ['Saturno','Netuno','Júpiter','Urano'], ans: 2 },
  { cat: 'Geral', q: 'Em que país fica a Torre Eiffel?', opts: ['Itália','Espanha','França','Portugal'], ans: 2 },
  { cat: 'Geral', q: 'Quantos ossos tem o corpo humano adulto?', opts: ['186','206','226','246'], ans: 1 },
  { cat: 'Geral', q: 'Qual é o menor país do mundo?', opts: ['San Marino','Mônaco','Vaticano','Liechtenstein'], ans: 2 },
  { cat: 'Geral', q: 'Qual é a capital do Japão?', opts: ['Osaka','Tóquio','Kyoto','Hiroshima'], ans: 1 },
  { cat: 'Geral', q: 'Qual animal tem o coração maior do mundo?', opts: ['Elefante','Baleia azul','Girafa','Rinoceronte'], ans: 1 },
  { cat: 'Geral', q: 'Quantos continentes tem a Terra?', opts: ['5','6','7','8'], ans: 2 },
  { cat: 'Geral', q: 'Qual é o rio mais longo do mundo?', opts: ['Amazonas','Nilo','Yangtzé','Mississippi'], ans: 1 },
  // Sobre eles (especial)
  { cat: '💕 Especial', q: 'Em que mês Pietro faz aniversário?', opts: ['Dezembro','Janeiro','Fevereiro','Março'], ans: 1 },
  { cat: '💕 Especial', q: 'Em que mês Emilly faz aniversário?', opts: ['Março','Maio','Abril','Junho'], ans: 2 },
  { cat: '💕 Especial', q: 'Em que dia Pietro e Emilly começaram a namorar?', opts: ['10 de outubro','11 de outubro','12 de outubro','13 de outubro'], ans: 1 },
  { cat: '💕 Especial', q: 'Qual destas músicas está na playlist do app?', opts: ['Perfect - Ed Sheeran','Skyfall - Adele','Shape of You - Ed Sheeran','Blinding Lights'], ans: 1 },
];

/* ════════════════════════════════════════════
   SHOP ITEMS
   ════════════════════════════════════════════ */
export const SHOP_ITEMS = [
  // Móveis
  { id: 'sofa',      icon: '🛋️', name: 'Sofazinho',    desc: 'Cantinho pra relaxar juntos', price: 40,  cat: 'furniture', layer: 'furniture1' },
  { id: 'bed',       icon: '🛏️', name: 'Caminha',      desc: 'Pra descansar bem',           price: 60,  cat: 'furniture', layer: 'furniture2' },
  { id: 'table',     icon: '🪑', name: 'Mesinha',      desc: 'Café da manhã juntos',        price: 35,  cat: 'furniture', layer: 'furniture3' },
  { id: 'lamp',      icon: '🪔', name: 'Luminária',    desc: 'Luz aconchegante',            price: 25,  cat: 'furniture', layer: 'furniture4' },
  // Jardim
  { id: 'rose',      icon: '🌹', name: 'Roseiras',     desc: 'Jardim romântico',            price: 30,  cat: 'garden',    layer: 'garden1' },
  { id: 'tree',      icon: '🌳', name: 'Arvorezinha',  desc: 'Sombra pra vocês dois',       price: 45,  cat: 'garden',    layer: 'garden2' },
  { id: 'sunflower', icon: '🌻', name: 'Girassóis',    desc: 'Alegria no jardim',           price: 20,  cat: 'garden',    layer: 'garden3' },
  { id: 'mushroom',  icon: '🍄', name: 'Cogumelos',    desc: 'Toque mágico',                price: 15,  cat: 'garden',    layer: 'garden4' },
  // Paredes
  { id: 'wallpink',  icon: '🎀', name: 'Parede Rosa',  desc: 'Tom suave e romântico',       price: 50,  cat: 'wall',      layer: 'wall' },
  { id: 'wallblue',  icon: '💙', name: 'Parede Azul',  desc: 'Calmo como o céu',            price: 50,  cat: 'wall',      layer: 'wall' },
  { id: 'wallwood',  icon: '🪵', name: 'Madeira',      desc: 'Rústico e aconchegante',      price: 65,  cat: 'wall',      layer: 'wall' },
  // Janelas / Portas
  { id: 'window2',   icon: '🪟', name: 'Janela Dupla', desc: 'Mais luz na casinha',         price: 40,  cat: 'window',    layer: 'window' },
  { id: 'door2',     icon: '🚪', name: 'Porta Arco',   desc: 'Entrada encantada',           price: 55,  cat: 'door',      layer: 'door' },
  // Especiais
  { id: 'star',      icon: '⭐', name: 'Estrelinhas',  desc: 'Teto estrelado',              price: 80,  cat: 'special',   layer: 'special1' },
  { id: 'heart',     icon: '💖', name: 'Corações',     desc: 'Amor em todo lugar',          price: 90,  cat: 'special',   layer: 'special2' },
  { id: 'rainbow',   icon: '🌈', name: 'Arco-íris',    desc: 'Pra sempre colorido',         price: 120, cat: 'special',   layer: 'special3' },
];

/* ════════════════════════════════════════════
   CAT SVG STATES (pixel art inline SVG)
   ════════════════════════════════════════════ */
function getCatSVG(mood, name) {
  // Pixel art cat — different expressions per mood
  const moods = {
    happy:   { eyes: '◕◕', mouth: '▽', color: '#ffb3c1', ear: '#ff85a1', detail: '♡' },
    hungry:  { eyes: '◔◔', mouth: '△', color: '#ffd4a0', ear: '#ffb870', detail: '!' },
    sleepy:  { eyes: '－－', mouth: '‥', color: '#c9b8d4', ear: '#a990c0', detail: 'z' },
    idle:    { eyes: '◡◡', mouth: '‿', color: '#ffb3c1', ear: '#ff85a1', detail: '♪' },
    playing: { eyes: '★★', mouth: '∪', color: '#ffcc99', ear: '#ffaa66', detail: '♫' },
    loved:   { eyes: '♡♡', mouth: '▽', color: '#ffb3c1', ear: '#ff85a1', detail: '❤' },
  };
  const m = moods[mood] || moods.idle;

  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;image-rendering:pixelated">
    <!-- Shadow -->
    <ellipse cx="32" cy="60" rx="14" ry="3" fill="rgba(0,0,0,0.2)"/>
    <!-- Tail -->
    <path d="M44 50 Q58 44 56 36 Q54 28 50 32 Q54 36 52 42 Q50 48 44 50Z" fill="${m.color}" stroke="${m.ear}" stroke-width="1"/>
    <!-- Body -->
    <rect x="18" y="38" width="28" height="20" rx="8" fill="${m.color}"/>
    <!-- Stripes on body -->
    <line x1="26" y1="42" x2="24" y2="54" stroke="${m.ear}" stroke-width="1.5" opacity="0.5"/>
    <line x1="32" y1="41" x2="32" y2="55" stroke="${m.ear}" stroke-width="1.5" opacity="0.5"/>
    <line x1="38" y1="42" x2="40" y2="54" stroke="${m.ear}" stroke-width="1.5" opacity="0.5"/>
    <!-- Paws -->
    <ellipse cx="22" cy="57" rx="5" ry="3" fill="${m.color}"/>
    <ellipse cx="42" cy="57" rx="5" ry="3" fill="${m.color}"/>
    <!-- Paw toes -->
    <circle cx="20" cy="58" r="1.2" fill="${m.ear}"/><circle cx="22" cy="59" r="1.2" fill="${m.ear}"/><circle cx="24" cy="58" r="1.2" fill="${m.ear}"/>
    <circle cx="40" cy="58" r="1.2" fill="${m.ear}"/><circle cx="42" cy="59" r="1.2" fill="${m.ear}"/><circle cx="44" cy="58" r="1.2" fill="${m.ear}"/>
    <!-- Head -->
    <ellipse cx="32" cy="28" rx="16" ry="15" fill="${m.color}"/>
    <!-- Ears -->
    <polygon points="16,18 12,6 22,14" fill="${m.ear}"/>
    <polygon points="48,18 52,6 42,14" fill="${m.ear}"/>
    <polygon points="17,17 14,9 21,14" fill="#ffe0ea"/>
    <polygon points="47,17 50,9 43,14" fill="#ffe0ea"/>
    <!-- Face stripes -->
    <line x1="20" y1="20" x2="16" y2="22" stroke="${m.ear}" stroke-width="1.5"/>
    <line x1="20" y1="23" x2="15" y2="24" stroke="${m.ear}" stroke-width="1.5"/>
    <line x1="44" y1="20" x2="48" y2="22" stroke="${m.ear}" stroke-width="1.5"/>
    <line x1="44" y1="23" x2="49" y2="24" stroke="${m.ear}" stroke-width="1.5"/>
    <!-- Eyes -->
    <text x="32" y="27" text-anchor="middle" font-size="9" fill="#590d22" font-family="serif">${m.eyes}</text>
    <!-- Nose -->
    <ellipse cx="32" cy="31" rx="2.5" ry="2" fill="#ff85a1"/>
    <!-- Mouth -->
    <text x="32" y="37" text-anchor="middle" font-size="7" fill="#590d22" font-family="serif">${m.mouth}</text>
    <!-- Whiskers -->
    <line x1="24" y1="31" x2="10" y2="28" stroke="#a06070" stroke-width="1" opacity="0.7"/>
    <line x1="24" y1="33" x2="10" y2="33" stroke="#a06070" stroke-width="1" opacity="0.7"/>
    <line x1="40" y1="31" x2="54" y2="28" stroke="#a06070" stroke-width="1" opacity="0.7"/>
    <line x1="40" y1="33" x2="54" y2="33" stroke="#a06070" stroke-width="1" opacity="0.7"/>
    <!-- Collar -->
    <rect x="22" y="40" width="20" height="4" rx="2" fill="#e8536f"/>
    <circle cx="32" cy="42" r="2" fill="#ffd700"/>
    <!-- Detail -->
    <text x="32" y="12" text-anchor="middle" font-size="7" fill="${m.ear}" opacity="0.8">${m.detail}</text>
    <!-- Name tag on collar -->
  </svg>`;
}

/* ════════════════════════════════════════════
   HOUSE SVG RENDERER
   ════════════════════════════════════════════ */
function getHouseSVG(items) {
  const owned = new Set(items || []);

  // Wall color
  let wallFill = '#8B6060';
  if (owned.has('wallpink')) wallFill = '#f4879c';
  else if (owned.has('wallblue')) wallFill = '#6eb5ff';
  else if (owned.has('wallwood')) wallFill = '#c8966e';

  // Window style
  const hasWindow2 = owned.has('window2');
  // Door style
  const hasDoor2 = owned.has('door2');
  // Special decorations
  const hasStars   = owned.has('star');
  const hasHearts  = owned.has('heart');
  const hasRainbow = owned.has('rainbow');

  return `<svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;image-rendering:pixelated">

    <!-- Sky gradient -->
    <defs>
      <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#0d1b2a"/>
        <stop offset="100%" style="stop-color:#1a2a3a"/>
      </linearGradient>
      <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#2d4a1e"/>
        <stop offset="100%" style="stop-color:#1a2e10"/>
      </linearGradient>
    </defs>

    <!-- Sky -->
    <rect width="280" height="180" fill="url(#skyGrad)"/>

    <!-- Moon -->
    <circle cx="230" cy="25" r="14" fill="#fff9c4" opacity="0.9"/>
    <circle cx="236" cy="21" r="11" fill="#0d1b2a" opacity="0.9"/>

    <!-- Stars -->
    <rect x="20" y="10" width="3" height="3" fill="#fff" opacity="0.8"/>
    <rect x="60" y="6"  width="2" height="2" fill="#fff" opacity="0.6"/>
    <rect x="100" y="15" width="3" height="3" fill="#ffd700" opacity="0.7"/>
    <rect x="150" y="8" width="2" height="2" fill="#fff" opacity="0.5"/>
    <rect x="190" y="18" width="3" height="3" fill="#fff" opacity="0.8"/>
    ${hasStars ? `
    <rect x="40" y="20"  width="2" height="2" fill="#ffd700" opacity="0.9"/>
    <rect x="80" y="12"  width="2" height="2" fill="#ffd700" opacity="0.9"/>
    <rect x="120" y="5"  width="3" height="3" fill="#ffd700" opacity="0.9"/>
    <rect x="170" y="22" width="2" height="2" fill="#ffd700" opacity="0.9"/>
    <text x="140" y="18" text-anchor="middle" font-size="10" fill="#ffd700" opacity="0.7">✦✦✦</text>
    ` : ''}

    ${hasRainbow ? `
    <!-- Rainbow arc -->
    <path d="M 20 100 Q 140 20 260 100" stroke="#ff6b6b" stroke-width="3" fill="none" opacity="0.5"/>
    <path d="M 20 100 Q 140 30 260 100" stroke="#ffd700" stroke-width="3" fill="none" opacity="0.5"/>
    <path d="M 20 100 Q 140 40 260 100" stroke="#7ac44a" stroke-width="3" fill="none" opacity="0.5"/>
    <path d="M 20 100 Q 140 48 260 100" stroke="#6eb5ff" stroke-width="3" fill="none" opacity="0.5"/>
    ` : ''}

    <!-- Ground -->
    <rect x="0" y="140" width="280" height="40" fill="url(#groundGrad)"/>
    <!-- Grass pixels -->
    <rect x="0" y="140" width="280" height="4" fill="#4a7a2a"/>
    ${Array.from({length: 40}, (_,i) => `<rect x="${i*7}" y="${136 + (i%3)*2}" width="4" height="${4 + i%3}" fill="#5a9a3a"/>`).join('')}

    <!-- Path to door -->
    <rect x="120" y="140" width="40" height="40" fill="#8B7355" opacity="0.6"/>
    <rect x="126" y="140" width="12" height="40" fill="#a08060" opacity="0.4"/>
    <rect x="142" y="140" width="12" height="40" fill="#a08060" opacity="0.4"/>

    <!-- House foundation -->
    <rect x="50" y="130" width="180" height="14" rx="2" fill="#5a4040"/>

    <!-- House walls -->
    <rect x="55" y="90" width="170" height="50" fill="${wallFill}"/>

    <!-- Wall texture (pixel bricks) -->
    ${Array.from({length: 5}, (_,row) =>
      Array.from({length: 9}, (_,col) =>
        `<rect x="${55 + col*19 + (row%2)*9}" y="${90 + row*10}" width="17" height="8" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="1" rx="0"/>`
      ).join('')
    ).join('')}

    <!-- Roof -->
    <polygon points="40,92 140,45 240,92" fill="#8B2020"/>
    <polygon points="40,92 140,45 240,92" fill="none" stroke="#6B1010" stroke-width="2"/>
    <!-- Roof shingles -->
    ${Array.from({length:6},(_,i)=>`<line x1="${40+i*20}" y1="${92-i*7.8}" x2="${240-i*20}" y2="${92-i*7.8}" stroke="#6B1010" stroke-width="1.5" opacity="0.5"/>`).join('')}
    <!-- Chimney -->
    <rect x="175" y="55" width="20" height="30" fill="#7a3030"/>
    <rect x="172" y="52" width="26" height="6" fill="#5a2020"/>
    <!-- Smoke -->
    <circle cx="185" cy="44" r="5" fill="#888" opacity="0.3"/>
    <circle cx="188" cy="36" r="6" fill="#999" opacity="0.25"/>
    <circle cx="183" cy="28" r="7" fill="#aaa" opacity="0.2"/>

    <!-- Roof peak decoration -->
    ${hasHearts ? `<text x="140" y="58" text-anchor="middle" font-size="10" fill="#ff85a1">♥</text>` : `<circle cx="140" cy="50" r="4" fill="#ffd700"/>`}

    <!-- Windows -->
    ${hasWindow2 ? `
    <!-- Double windows -->
    <rect x="68" y="98" width="28" height="24" rx="2" fill="#87CEEB" opacity="0.8"/>
    <rect x="68" y="98" width="28" height="24" rx="2" fill="none" stroke="#fff" stroke-width="2"/>
    <line x1="82" y1="98" x2="82" y2="122" stroke="#fff" stroke-width="1.5"/>
    <line x1="68" y1="110" x2="96" y2="110" stroke="#fff" stroke-width="1.5"/>
    <!-- Window glow -->
    <rect x="70" y="100" width="10" height="10" fill="#fff9c4" opacity="0.4"/>
    <rect x="84" y="100" width="10" height="10" fill="#fff9c4" opacity="0.4"/>

    <rect x="184" y="98" width="28" height="24" rx="2" fill="#87CEEB" opacity="0.8"/>
    <rect x="184" y="98" width="28" height="24" rx="2" fill="none" stroke="#fff" stroke-width="2"/>
    <line x1="198" y1="98" x2="198" y2="122" stroke="#fff" stroke-width="1.5"/>
    <line x1="184" y1="110" x2="212" y2="110" stroke="#fff" stroke-width="1.5"/>
    <rect x="186" y="100" width="10" height="10" fill="#fff9c4" opacity="0.4"/>
    <rect x="200" y="100" width="10" height="10" fill="#fff9c4" opacity="0.4"/>
    ` : `
    <!-- Single windows -->
    <rect x="70" y="100" width="26" height="22" rx="2" fill="#87CEEB" opacity="0.8"/>
    <rect x="70" y="100" width="26" height="22" rx="2" fill="none" stroke="#fff" stroke-width="2"/>
    <line x1="83" y1="100" x2="83" y2="122" stroke="#fff" stroke-width="1.5"/>
    <line x1="70" y1="111" x2="96" y2="111" stroke="#fff" stroke-width="1.5"/>
    <rect x="72" y="102" width="9" height="8" fill="#fff9c4" opacity="0.4"/>

    <rect x="184" y="100" width="26" height="22" rx="2" fill="#87CEEB" opacity="0.8"/>
    <rect x="184" y="100" width="26" height="22" rx="2" fill="none" stroke="#fff" stroke-width="2"/>
    <line x1="197" y1="100" x2="197" y2="122" stroke="#fff" stroke-width="1.5"/>
    <line x1="184" y1="111" x2="210" y2="111" stroke="#fff" stroke-width="1.5"/>
    <rect x="186" y="102" width="9" height="8" fill="#fff9c4" opacity="0.4"/>
    `}

    <!-- Curtains (if heart special) -->
    ${hasHearts ? `
    <path d="M70 100 Q76 110 70 122" fill="#ffb3c1" opacity="0.6"/>
    <path d="M96 100 Q90 110 96 122" fill="#ffb3c1" opacity="0.6"/>
    <path d="M184 100 Q190 110 184 122" fill="#ffb3c1" opacity="0.6"/>
    <path d="M210 100 Q204 110 210 122" fill="#ffb3c1" opacity="0.6"/>
    ` : ''}

    <!-- Door -->
    ${hasDoor2 ? `
    <!-- Arch door -->
    <rect x="122" y="110" width="36" height="30" fill="#5a3010"/>
    <ellipse cx="140" cy="110" rx="18" ry="10" fill="#5a3010"/>
    <rect x="122" y="110" width="36" height="30" fill="none" stroke="#8B5030" stroke-width="2"/>
    <ellipse cx="140" cy="110" rx="18" ry="10" fill="none" stroke="#8B5030" stroke-width="2"/>
    <line x1="140" y1="100" x2="140" y2="140" stroke="#8B5030" stroke-width="1.5" opacity="0.5"/>
    <circle cx="148" cy="125" r="2.5" fill="#ffd700"/>
    <!-- Arch window -->
    <ellipse cx="140" cy="108" rx="10" ry="6" fill="#87CEEB" opacity="0.5"/>
    ` : `
    <!-- Simple door -->
    <rect x="122" y="112" width="36" height="28" rx="3" fill="#6B4020"/>
    <rect x="122" y="112" width="36" height="28" rx="3" fill="none" stroke="#8B5030" stroke-width="2"/>
    <line x1="140" y1="112" x2="140" y2="140" stroke="#8B5030" stroke-width="1.5" opacity="0.5"/>
    <circle cx="147" cy="126" r="2.5" fill="#ffd700"/>
    <!-- Door top window -->
    <rect x="128" y="115" width="10" height="8" rx="1" fill="#87CEEB" opacity="0.5"/>
    <rect x="142" y="115" width="10" height="8" rx="1" fill="#87CEEB" opacity="0.5"/>
    `}

    <!-- Furniture hints through windows -->
    ${owned.has('sofa') ? `<rect x="72" y="113" width="18" height="6" rx="2" fill="#e8536f" opacity="0.4"/>` : ''}
    ${owned.has('lamp') ? `<line x1="190" y1="102" x2="190" y2="116" stroke="#ffd700" stroke-width="1.5" opacity="0.5"/>` : ''}

    <!-- Mailbox -->
    <rect x="220" y="128" width="14" height="10" rx="2" fill="#e8536f"/>
    <rect x="220" y="128" width="14" height="5" rx="1" fill="#c0392b"/>
    <rect x="226" y="124" width="2" height="14" fill="#888"/>
    <rect x="219" y="133" width="6" height="1.5" fill="#fff" opacity="0.5"/>

    <!-- Heart floating above house (if heart special) -->
    ${hasHearts ? `
    <text x="90" y="82" font-size="8" fill="#ff85a1" opacity="0.8">♥</text>
    <text x="190" y="80" font-size="8" fill="#ff85a1" opacity="0.8">♥</text>
    <text x="140" y="38" font-size="10" fill="#ff85a1" opacity="0.7">♥</text>
    ` : ''}
  </svg>`;
}

/* ════════════════════════════════════════════
   GARDEN RENDERER
   ════════════════════════════════════════════ */
function getGardenItems(items) {
  const owned = new Set(items || []);
  const parts = [];
  if (owned.has('rose'))      parts.push('<span class="garden-item" style="font-size:clamp(1rem,4vw,1.5rem)">🌹</span><span class="garden-item" style="font-size:clamp(0.8rem,3vw,1.2rem)">🌹</span>');
  if (owned.has('sunflower')) parts.push('<span class="garden-item">🌻</span>');
  if (owned.has('mushroom'))  parts.push('<span class="garden-item" style="font-size:clamp(0.7rem,2.5vw,1rem)">🍄</span><span class="garden-item" style="font-size:clamp(0.6rem,2vw,0.9rem)">🍄</span>');
  if (owned.has('tree'))      parts.push('<span class="garden-item" style="font-size:clamp(1.2rem,5vw,2rem)">🌳</span>');
  if (parts.length === 0) parts.push('<span class="garden-item" style="font-size:clamp(0.7rem,2.5vw,1rem);opacity:0.4">🌿</span><span class="garden-item" style="font-size:clamp(0.7rem,2.5vw,1rem);opacity:0.4">🌿</span>');
  return parts.join('');
}

/* ════════════════════════════════════════════
   DEFAULT STATE
   ════════════════════════════════════════════ */
const DEFAULT_HOME = {
  coins: 0,
  items: [],
  pet: {
    name: 'Bolinha',
    hunger: 80,   // 0–100
    energy: 80,
    happy:  80,
    love:   80,
    lastFed:    null,
    lastPet:    null,
    lastPlayed: null,
    lastSlept:  null,
  },
  quiz: {
    pietro: { lastDate: null, done: false },
    emilly: { lastDate: null, done: false },
  },
  earnedToday: {
    date: null,
    mood: false,
    location: false,
    mural: false,
  },
};

/* ════════════════════════════════════════════
   MODULE STATE
   ════════════════════════════════════════════ */
let _db    = null;
let _doc   = null;
let _state = JSON.parse(JSON.stringify(DEFAULT_HOME));
let _quizPerson = 'pietro';
let _currentQ   = null;
let _answered   = false;

/* ════════════════════════════════════════════
   FIREBASE HELPERS
   ════════════════════════════════════════════ */
async function saveState() {
  if (!_doc) return;
  try { await setDoc(_doc, _state); } catch(e) { console.warn('home save:', e); }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/* ════════════════════════════════════════════
   COIN ANIMATIONS
   ════════════════════════════════════════════ */
function spawnCoinPop(amount, x, y) {
  const el = document.createElement('div');
  el.className = 'coin-pop';
  el.textContent = `+${amount} 🪙`;
  el.style.left = (x || window.innerWidth/2 - 20) + 'px';
  el.style.top  = (y || window.innerHeight/2) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 950);
}

function spawnHearts(x, y, count) {
  for (let i = 0; i < (count || 3); i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'heart-pop';
      el.textContent = ['💗','💕','❤️','💖'][Math.floor(Math.random()*4)];
      el.style.left = (x + (Math.random()-0.5)*40) + 'px';
      el.style.top  = y + 'px';
      el.style.animationDuration = (0.8 + Math.random()*0.6) + 's';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1400);
    }, i * 120);
  }
}

/* ════════════════════════════════════════════
   ADD COINS (called from app.js hooks)
   ════════════════════════════════════════════ */
export function awardCoins(reason, amount) {
  const today = todayStr();
  if (_state.earnedToday.date !== today) {
    _state.earnedToday = { date: today, mood: false, location: false, mural: false };
  }
  if (_state.earnedToday[reason]) return; // já ganhou hoje
  _state.earnedToday[reason] = true;
  _state.coins += amount;
  saveState();
  renderCoins();
  renderEarnList();
  // pop no meio da tela
  spawnCoinPop(amount, window.innerWidth/2 - 30, window.innerHeight/2);
  import('./ui.js').then(m => m.showToast(`🪙 +${amount} moedas! (${reason})`));
}

/* ════════════════════════════════════════════
   RENDER COINS
   ════════════════════════════════════════════ */
function renderCoins() {
  document.querySelectorAll('.home-coin-amount').forEach(el => {
    el.textContent = _state.coins;
  });
}

/* ════════════════════════════════════════════
   RENDER EARN LIST
   ════════════════════════════════════════════ */
function renderEarnList() {
  const today = todayStr();
  const earned = _state.earnedToday?.date === today ? _state.earnedToday : {};
  const list = [
    { key: 'quiz',     label: '📝 Quiz diário (Pietro)',   amt: 15 },
    { key: 'quiz2',    label: '📝 Quiz diário (Emilly)',   amt: 15 },
    { key: 'mood',     label: '😊 Registrar humor',        amt: 5  },
    { key: 'location', label: '📍 Compartilhar localização', amt: 8 },
    { key: 'mural',    label: '💌 Mensagem no mural',      amt: 5  },
  ];

  const quizDone = {
    quiz:  _state.quiz?.pietro?.lastDate === today,
    quiz2: _state.quiz?.emilly?.lastDate === today,
  };

  const wrap = document.getElementById('home-earn-list');
  if (!wrap) return;
  wrap.innerHTML = list.map(item => {
    const done = item.key.startsWith('quiz') ? quizDone[item.key] : earned[item.key];
    return `<div class="earn-row">
      <span class="earn-row-left">${item.label}</span>
      <span class="earn-row-right">
        ${done ? '<span class="done-check">✓ Feito</span>' : `+${item.amt} 🪙`}
      </span>
    </div>`;
  }).join('');
}

/* ════════════════════════════════════════════
   PET LOGIC
   ════════════════════════════════════════════ */
function getPetMood() {
  const { hunger, energy, happy, love } = _state.pet;
  if (happy > 80 && hunger > 60)  return 'happy';
  if (hunger < 30)                return 'hungry';
  if (energy < 30)                return 'sleepy';
  if (love > 85)                  return 'loved';
  return 'idle';
}

const PET_MESSAGES = {
  happy:   ['Miau! Estou feliz! 😸', 'Que dia lindo! 🌟', 'Amo vocês dois! 💕'],
  hungry:  ['Miaaaau! Tô com fome! 🍖', 'Me alimenta, por favor! 😿', 'Barriga vazia... 🥺'],
  sleepy:  ['Zzz... com soninho... 😴', 'Deixa eu dormir 5 minutos... 💤', 'Boceja* 🥱'],
  idle:    ['Miau! O que vamos fazer? 🐾', 'Quero brincar! 🎾', 'Me faz carinho? 🥺'],
  playing: ['Wheee! 🎉', 'Isso sim é diversão! ✨', 'Mais! Mais! 🎊'],
  loved:   ['Purrrr... 💖', 'Sou o gatinho mais amado! 🥰', 'Coração quentinho 💗'],
};

function showPetBubble(msg) {
  const bubble = document.getElementById('pet-bubble');
  if (!bubble) return;
  bubble.textContent = msg;
  bubble.classList.add('show');
  clearTimeout(bubble._timer);
  bubble._timer = setTimeout(() => bubble.classList.remove('show'), 2800);
}

function renderPet() {
  const catEl = document.getElementById('pet-svg-container');
  if (!catEl) return;
  const mood = getPetMood();
  catEl.innerHTML = getCatSVG(mood, _state.pet.name);
  catEl.className = `pet-pixel-cat state-${mood}`;

  // Stats
  const setBar = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.style.width = Math.max(0, Math.min(100, val)) + '%';
    const valEl = document.getElementById(id + '-val');
    if (valEl) valEl.textContent = Math.round(val) + '%';
  };
  setBar('pet-bar-hunger', _state.pet.hunger);
  setBar('pet-bar-energy', _state.pet.energy);
  setBar('pet-bar-happy',  _state.pet.happy);
  setBar('pet-bar-love',   _state.pet.love);

  // Mood badge
  const moodLabels = {
    happy: '😸 Feliz e satisfeito', hungry: '😿 Com fome', sleepy: '😴 Com soninho',
    idle: '🐾 Querendo atenção', playing: '🎉 Brincando', loved: '💖 Cheio de amor',
  };
  const badge = document.getElementById('pet-mood-badge');
  if (badge) badge.textContent = moodLabels[mood] || '';
}

function petDecay() {
  // Natural decay over time (called on init)
  const last = _state.pet.lastFed ? new Date(_state.pet.lastFed) : null;
  if (last) {
    const hours = (Date.now() - last.getTime()) / 3600000;
    _state.pet.hunger = Math.max(0, _state.pet.hunger - Math.min(hours * 8, 40));
    _state.pet.energy = Math.max(0, _state.pet.energy - Math.min(hours * 5, 30));
  }
}

function feedPet(e) {
  if (_state.pet.hunger >= 95) { showPetBubble('Estou cheio! Obrigado! 😸'); return; }
  _state.pet.hunger  = Math.min(100, _state.pet.hunger + 25);
  _state.pet.happy   = Math.min(100, _state.pet.happy  + 10);
  _state.pet.lastFed = new Date().toISOString();
  saveState(); renderPet();
  showPetBubble(PET_MESSAGES.happy[Math.floor(Math.random()*PET_MESSAGES.happy.length)]);
  spawnHearts(e.clientX, e.clientY, 4);
  spawnCoinPop(0); // visual only for feeding
}
function petPet(e) {
  _state.pet.love  = Math.min(100, _state.pet.love  + 15);
  _state.pet.happy = Math.min(100, _state.pet.happy + 12);
  _state.pet.lastPet = new Date().toISOString();
  const catEl = document.getElementById('pet-svg-container');
  if (catEl) { catEl.className = 'pet-pixel-cat state-loved'; setTimeout(() => renderPet(), 1200); }
  saveState(); renderPet();
  showPetBubble(PET_MESSAGES.loved[Math.floor(Math.random()*PET_MESSAGES.loved.length)]);
  spawnHearts(e.clientX, e.clientY, 6);
}
function playWithPet(e) {
  if (_state.pet.energy < 15) { showPetBubble('Tô cansado demais pra brincar... 😴'); return; }
  _state.pet.happy   = Math.min(100, _state.pet.happy  + 20);
  _state.pet.energy  = Math.max(0,   _state.pet.energy - 15);
  _state.pet.love    = Math.min(100, _state.pet.love   + 8);
  _state.pet.lastPlayed = new Date().toISOString();
  const catEl = document.getElementById('pet-svg-container');
  if (catEl) { catEl.className = 'pet-pixel-cat state-playing'; setTimeout(() => renderPet(), 1500); }
  saveState(); renderPet();
  showPetBubble(PET_MESSAGES.playing[Math.floor(Math.random()*PET_MESSAGES.playing.length)]);
  spawnHearts(e.clientX, e.clientY, 3);
}
function sleepPet() {
  _state.pet.energy = Math.min(100, _state.pet.energy + 30);
  _state.pet.lastSlept = new Date().toISOString();
  const catEl = document.getElementById('pet-svg-container');
  if (catEl) { catEl.className = 'pet-pixel-cat state-sleepy'; setTimeout(() => renderPet(), 2000); }
  saveState(); renderPet();
  showPetBubble('Zzz... dormindo... 💤');
}

/* ════════════════════════════════════════════
   HOUSE RENDER
   ════════════════════════════════════════════ */
function renderHouse() {
  const svgWrap = document.getElementById('house-svg-wrap');
  if (svgWrap) svgWrap.innerHTML = getHouseSVG(_state.items);
  const gardenWrap = document.getElementById('house-garden-wrap');
  if (gardenWrap) gardenWrap.innerHTML = getGardenItems(_state.items);
  renderShop();
}

function renderShop() {
  const grid = document.getElementById('home-shop-grid');
  if (!grid) return;
  const owned = new Set(_state.items || []);
  grid.innerHTML = SHOP_ITEMS.map(item => {
    const isOwned = owned.has(item.id);
    // Check if same-category item is owned (for walls/windows/doors — mutually exclusive)
    const exclusiveCats = ['wall','window','door'];
    const catOwned = exclusiveCats.includes(item.cat)
      ? SHOP_ITEMS.filter(i => i.cat === item.cat && owned.has(i.id)).length > 0 && !isOwned
      : false;

    return `<div class="shop-item ${isOwned ? 'owned' : ''}" onclick="window._homeShopBuy('${item.id}')">
      ${isOwned ? '<span class="shop-owned-badge">✓ Comprado</span>' : ''}
      <span class="shop-item-icon">${item.icon}</span>
      <div class="shop-item-name">${item.name}</div>
      <div class="shop-item-desc">${item.desc}</div>
      <span class="shop-item-price">
        ${isOwned ? '✓ Na casinha' : `🪙 ${item.price}`}
      </span>
    </div>`;
  }).join('');
}

/* ════════════════════════════════════════════
   SHOP BUY
   ════════════════════════════════════════════ */
window._homeShopBuy = function(itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return;
  if (_state.items.includes(itemId)) {
    import('./ui.js').then(m => m.showToast('Você já tem esse item! 🏠'));
    return;
  }
  if (_state.coins < item.price) {
    import('./ui.js').then(m => m.showToast(`Precisa de mais ${item.price - _state.coins} 🪙`));
    return;
  }
  _state.coins -= item.price;
  _state.items.push(itemId);
  saveState();
  renderCoins();
  renderHouse();
  import('./ui.js').then(m => m.showToast(`${item.icon} ${item.name} adicionado à casinha!`));
  // celebrate
  spawnHearts(window.innerWidth/2, window.innerHeight/2, 8);
};

/* ════════════════════════════════════════════
   QUIZ SYSTEM
   ════════════════════════════════════════════ */
function getQuizQuestion() {
  const today = todayStr();
  // Seed by date so both people get same question set each day
  const seed = today.replace(/-/g,'');
  const idx  = parseInt(seed) % QUIZ_QUESTIONS.length;
  // Different question for each person
  const personOffset = _quizPerson === 'emilly' ? Math.floor(QUIZ_QUESTIONS.length / 2) : 0;
  return QUIZ_QUESTIONS[(idx + personOffset) % QUIZ_QUESTIONS.length];
}

function renderQuiz() {
  const today = todayStr();
  const wrap  = document.getElementById('quiz-content');
  if (!wrap) return;

  const personState = _state.quiz?.[_quizPerson] || { lastDate: null };
  const done = personState.lastDate === today;

  if (done) {
    wrap.innerHTML = `<div class="quiz-done-msg">
      <span class="quiz-done-icon">🎉</span>
      <div class="quiz-done-title">Quiz de hoje concluído!</div>
      <div class="quiz-done-sub">Volte amanhã para uma nova pergunta.<br>As moedas já estão na conta! 🪙</div>
    </div>`;
    return;
  }

  _currentQ = getQuizQuestion();
  _answered  = false;
  const letters = ['A','B','C','D'];

  wrap.innerHTML = `
    <div class="quiz-who-row">
      <button class="quiz-who-btn ${_quizPerson==='pietro'?'active':''}" onclick="window._homeSetQuizPerson('pietro')">💙 Pietro</button>
      <button class="quiz-who-btn ${_quizPerson==='emilly'?'active':''}" onclick="window._homeSetQuizPerson('emilly')">💗 Emilly</button>
    </div>
    <div class="quiz-header">
      <span class="quiz-title">Pergunta do Dia</span>
      <span class="quiz-category-badge">${_currentQ.cat}</span>
    </div>
    <div class="quiz-question-text">${_currentQ.q}</div>
    <div class="quiz-options">
      ${_currentQ.opts.map((opt,i) => `
        <button class="quiz-option" onclick="window._homeAnswerQuiz(${i}, this)">
          <span class="quiz-option-letter">${letters[i]}</span>
          ${opt}
        </button>
      `).join('')}
    </div>
    <div class="quiz-feedback" id="quiz-feedback"></div>
  `;
}

window._homeSetQuizPerson = function(person) {
  _quizPerson = person;
  renderQuiz();
};

window._homeAnswerQuiz = function(idx, btn) {
  if (_answered || !_currentQ) return;
  _answered = true;
  const correct = idx === _currentQ.ans;
  const today   = todayStr();

  // Disable all buttons
  document.querySelectorAll('.quiz-option').forEach(b => b.disabled = true);

  // Mark correct/wrong
  const btns = document.querySelectorAll('.quiz-option');
  btns[_currentQ.ans].classList.add('correct');
  if (!correct) btn.classList.add('wrong');

  // Feedback
  const fb = document.getElementById('quiz-feedback');
  if (fb) {
    fb.className = `quiz-feedback show ${correct ? 'correct' : 'wrong'}`;
    fb.textContent = correct
      ? `✓ Correto! +15 🪙 para a casinha!`
      : `✗ Era "${_currentQ.opts[_currentQ.ans]}" — mas tudo bem, amanhã tem mais!`;
  }

  // Mark as done and award coins
  if (!_state.quiz) _state.quiz = {};
  if (!_state.quiz[_quizPerson]) _state.quiz[_quizPerson] = {};
  _state.quiz[_quizPerson].lastDate = today;
  _state.quiz[_quizPerson].correct  = correct;

  if (correct) {
    _state.coins += 15;
    saveState();
    renderCoins();
    spawnCoinPop(15, window.innerWidth/2 - 30, window.innerHeight/3);
    _state.pet.happy = Math.min(100, _state.pet.happy + 10);
    renderPet();
  } else {
    saveState();
  }

  renderEarnList();

  // Animate pet reaction
  const catEl = document.getElementById('pet-svg-container');
  if (catEl) {
    catEl.className = correct ? 'pet-pixel-cat state-happy' : 'pet-pixel-cat state-idle';
    setTimeout(() => renderPet(), 1500);
  }
  showPetBubble(correct ? 'Acertou! Sou muito orgulhoso! 🎉' : 'Quase! Você consegue! 💪');

  setTimeout(() => renderQuiz(), 2500);
};

/* ════════════════════════════════════════════
   TABS
   ════════════════════════════════════════════ */
window._homeTab = function(tab) {
  document.querySelectorAll('.home-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.home-panel').forEach(p => p.classList.toggle('active', p.id === `home-panel-${tab}`));
  if (tab === 'quiz') renderQuiz();
  if (tab === 'casa') renderHouse();
  if (tab === 'pet')  renderPet();
};

/* ════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════ */
export function initHome(db) {
  _db  = db;
  _doc = doc(db, 'home', 'shared');

  // Listen to Firebase
  onSnapshot(_doc, snap => {
    if (snap.exists()) {
      const data = snap.data();
      // Merge carefully preserving defaults
      _state = { ...JSON.parse(JSON.stringify(DEFAULT_HOME)), ...data };
      if (!_state.pet)  _state.pet  = DEFAULT_HOME.pet;
      if (!_state.quiz) _state.quiz = DEFAULT_HOME.quiz;
    }
    petDecay();
    renderCoins();
    renderPet();
    renderHouse();
    renderQuiz();
    renderEarnList();
  });

  // Pet sprite click = pet it
  document.getElementById('pet-sprite-btn')?.addEventListener('click', (e) => {
    petPet(e);
  });

  // Expose pet actions globally
  window._homeFeedPet   = (e) => feedPet(e);
  window._homePetPet    = (e) => petPet(e);
  window._homePlayPet   = (e) => playWithPet(e);
  window._homeSleepPet  = ()  => sleepPet();

  // Gera estrelinhas no céu da casinha
  const starsContainer = document.getElementById('house-stars-container');
  if (starsContainer && !starsContainer.children.length) {
    for (let i = 0; i < 18; i++) {
      const star = document.createElement('div');
      star.className = 'house-star';
      star.style.left = Math.random() * 100 + '%';
      star.style.top  = Math.random() * 55 + '%';
      star.style.animationDelay = (Math.random() * 2.5) + 's';
      starsContainer.appendChild(star);
    }
  }

  // Default tab
  window._homeTab('pet');
}
