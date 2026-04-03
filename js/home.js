/* ═══════════════════════════════════════════════
   PIETRO & EMILLY — home.js v22
   Santa Maria Casinha RPG + Pet Virtual + Quiz
   ═══════════════════════════════════════════════ */

import { doc, setDoc, onSnapshot }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Escapa HTML para evitar XSS ao inserir dados do usuário/Firebase via innerHTML
function sanitizeHTML(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ════════════════════════════════════════════
   TERRENOS DE SANTA MARIA
   ════════════════════════════════════════════ */
const TERRENOS = [
  { id:"centro",   nome:"Centro",             desc:"Perto de tudo — UFSM, comércio, restaurantes. Charmoso e movimentado.", preco:420, area:"180 m²", emoji:"🏙️", distUFSM:"2 km da UFSM",    frase:"\"Acordar e já estar no coração da cidade.\"" },
  { id:"camobi",   nome:"Camobi",             desc:"Ao lado da UFSM. Bairro universitário cheio de vida, cafés e parques.", preco:310, area:"220 m²", emoji:"🎓", distUFSM:"500m da UFSM",   frase:"\"Nossa casinha pertinho da faculdade.\"" },
  { id:"fatima",   nome:"Nossa Sra. Fátima",  desc:"Bairro nobre e tranquilo. Ruas arborizadas, seguro e bem localizado.",  preco:380, area:"200 m²", emoji:"🌳", distUFSM:"3 km da UFSM",    frase:"\"Um bairro que parece feito pra família.\"" },
  { id:"urlandia", nome:"Urlândia",           desc:"Bairro residencial e aconchegante. Ótimo custo-benefício em SM.",       preco:240, area:"260 m²", emoji:"🏡", distUFSM:"5 km da UFSM",    frase:"\"Espaço de sobra pra gente crescer.\"" },
  { id:"platano",  nome:"Pé de Plátano",      desc:"Bairro arborizado e charmoso, com ruas sombreadas e muito verde.",      preco:290, area:"240 m²", emoji:"🍃", distUFSM:"4 km da UFSM",    frase:"\"Morar entre árvores e silêncio.\"" },
  { id:"medianeira",nome:"Medianeira",        desc:"Bairro tradicional e bem servido de comércio local.",                   preco:270, area:"250 m²", emoji:"🛍️", distUFSM:"4,5 km da UFSM",  frase:"\"Tudo que precisamos perto de casa.\"" },
];

const LOJA_EXTERIOR = [
  { id:"casa_branca",   cat:"cor",     icon:"🏠", nome:"Casa Branca",     desc:"Clássica e elegante",        preco:40,  xp:30, exclusivo:"cor" },
  { id:"casa_rosa",     cat:"cor",     icon:"🏠", nome:"Casa Rosa",       desc:"Romântica e delicada",       preco:40,  xp:30, exclusivo:"cor" },
  { id:"casa_azul",     cat:"cor",     icon:"🏠", nome:"Casa Azul",       desc:"Calma como o céu",           preco:40,  xp:30, exclusivo:"cor" },
  { id:"casa_amarela",  cat:"cor",     icon:"🏠", nome:"Casa Amarela",    desc:"Alegre e acolhedora",        preco:40,  xp:30, exclusivo:"cor" },
  { id:"casa_verde",    cat:"cor",     icon:"🏠", nome:"Casa Verde",      desc:"Harmonia com a natureza",    preco:40,  xp:30, exclusivo:"cor" },
  { id:"telhado_telha", cat:"telhado", icon:"🏘️", nome:"Telha Cerâmica",  desc:"Tradicional gaúcho",         preco:30,  xp:20, exclusivo:"telhado" },
  { id:"telhado_metal", cat:"telhado", icon:"🏚️", nome:"Telhado Metálico",desc:"Moderno e resistente",       preco:45,  xp:25, exclusivo:"telhado" },
  { id:"telhado_verde", cat:"telhado", icon:"🌱", nome:"Telhado Verde",   desc:"Ecológico e charmoso",       preco:65,  xp:40, exclusivo:"telhado" },
  { id:"janela_simples",cat:"janela",  icon:"🪟", nome:"Janela Simples",  desc:"Clean e funcional",          preco:20,  xp:15 },
  { id:"janela_arco",   cat:"janela",  icon:"🪟", nome:"Janela Arco",     desc:"Arquitetura clássica",       preco:35,  xp:20 },
  { id:"porta_madeira", cat:"porta",   icon:"🚪", nome:"Porta de Madeira",desc:"Calorosa e rústica",         preco:25,  xp:15, exclusivo:"porta" },
  { id:"porta_vidro",   cat:"porta",   icon:"🚪", nome:"Porta de Vidro",  desc:"Moderna e iluminada",        preco:45,  xp:25, exclusivo:"porta" },
  { id:"porta_arco",    cat:"porta",   icon:"🚪", nome:"Porta em Arco",   desc:"Romântica e encantada",      preco:55,  xp:35, exclusivo:"porta" },
  { id:"calcada_pedra", cat:"entrada", icon:"🪨", nome:"Calçada de Pedra",desc:"Charme natural",             preco:20,  xp:15, exclusivo:"entrada" },
  { id:"calcada_tijolo",cat:"entrada", icon:"🧱", nome:"Calçada de Tijolo",desc:"Estilo colonial gaúcho",    preco:25,  xp:18, exclusivo:"entrada" },
];

const LOJA_JARDIM = [
  { id:"cerca_madeira", cat:"cerca",  icon:"🪵", nome:"Cerca de Madeira",  desc:"Simples e charmosa",        preco:15, xp:12, exclusivo:"cerca" },
  { id:"cerca_ferro",   cat:"cerca",  icon:"⚙️", nome:"Cerca de Ferro",    desc:"Elegante e segura",         preco:30, xp:20, exclusivo:"cerca" },
  { id:"cerca_viva",    cat:"cerca",  icon:"🌿", nome:"Cerca Viva",        desc:"Verde e natural",           preco:25, xp:18, exclusivo:"cerca" },
  { id:"roseiras",      cat:"planta", icon:"🌹", nome:"Roseiras",          desc:"Jardim romântico",          preco:15, xp:10 },
  { id:"girassois",     cat:"planta", icon:"🌻", nome:"Girassóis",         desc:"Alegria e calor",           preco:10, xp:8  },
  { id:"lavanda",       cat:"planta", icon:"💜", nome:"Lavanda",           desc:"Cheiro maravilhoso",        preco:12, xp:9  },
  { id:"arvorezinha",   cat:"planta", icon:"🌳", nome:"Arvorezinha",       desc:"Sombra e frescor",          preco:25, xp:20 },
  { id:"fonte",         cat:"detalhe",icon:"⛲", nome:"Fontezinha",        desc:"Som da água no jardim",     preco:40, xp:28 },
  { id:"banco",         cat:"detalhe",icon:"🪑", nome:"Banco de Jardim",   desc:"Pra sentar juntos",         preco:20, xp:14 },
  { id:"iluminacao",    cat:"detalhe",icon:"🪔", nome:"Luminárias",        desc:"Casa iluminada à noite",    preco:20, xp:15 },
];

const LOJA_INTERIOR = [
  { id:"sofa",           cat:"sala",    icon:"🛋️", nome:"Sofá do Casal",      desc:"Pra ver séries juntos",    preco:45,  xp:30 },
  { id:"tv",             cat:"sala",    icon:"📺", nome:"TV na parede",        desc:"Filmes e maratonas",       preco:60,  xp:35 },
  { id:"tapete",         cat:"sala",    icon:"🟫", nome:"Tapete Persa",        desc:"Aconchego no chão",        preco:25,  xp:18 },
  { id:"quadros",        cat:"sala",    icon:"🖼️", nome:"Quadros de Arte",     desc:"Emilly escolheu cada um",  preco:30,  xp:20 },
  { id:"plantas_sala",   cat:"sala",    icon:"🪴", nome:"Plantas na Sala",     desc:"Verde dentro de casa",     preco:15,  xp:12 },
  { id:"cozinha_moveis", cat:"cozinha", icon:"🍳", nome:"Armários & Bancada",  desc:"Projeto de Emilly",        preco:100, xp:60 },
  { id:"mesa_jantar",    cat:"cozinha", icon:"🍽️", nome:"Mesa de Jantar",      desc:"Café da manhã todo dia",   preco:40,  xp:25 },
  { id:"cama_casal",     cat:"quarto",  icon:"🛏️", nome:"Cama de Casal",       desc:"O cantinho de vocês",      preco:75,  xp:45 },
  { id:"guarda_roupa",   cat:"quarto",  icon:"🪞", nome:"Guarda-Roupa",        desc:"Espaço pra tudo",          preco:50,  xp:30 },
  { id:"escrivaninha",   cat:"quarto",  icon:"💻", nome:"Escrivaninha",         desc:"Pietro programa daqui",    preco:35,  xp:22 },
  { id:"home_office",    cat:"especial",icon:"🖥️", nome:"Home Office",         desc:"Pietro trabalha de casa",  preco:90,  xp:55 },
  { id:"studio_emilly",  cat:"especial",icon:"📐", nome:"Studio de Design",    desc:"O ateliê da Emilly",       preco:90,  xp:55 },
  { id:"banheira",       cat:"especial",icon:"🛁", nome:"Banheira",            desc:"Fim de semana especial",   preco:80,  xp:48 },
];

const GATOS_ADOCAO = [
  { id:"laranja", nome:"Brigadeiro",  raca:"Vira-lata laranja",   emoji:"🐱",   cor:"#ff9800", personalidade:"Dengoso e come tudo que vê" },
  { id:"preto",   nome:"Merlot",      raca:"Gato preto",          emoji:"🐈‍⬛",  cor:"#212121", personalidade:"Misterioso, dorme onde quer" },
  { id:"cinza",   nome:"Névoa",       raca:"Azul russo",          emoji:"🐈",   cor:"#90a4ae", personalidade:"Elegante e introspectivo" },
  { id:"rajado",  nome:"Farofa",      raca:"Tigrado",             emoji:"🐱",   cor:"#795548", personalidade:"Brincalhão e irrequieto" },
  { id:"branco",  nome:"Marshmallow", raca:"Angora branco",       emoji:"🐱",   cor:"#eeeeee", personalidade:"Delicado, ama colo" },
];

const DIALOGOS = {
  introducao: [
    { quem:"pietro", texto:"Escola Maria Rocha. Técnico em Informática. Primeira semana de aula." },
    { quem:"pietro", texto:"Ela entrou na turma e eu nem imaginava que aquilo ia mudar tudo." },
    { quem:"emilly", texto:"Ei... você joga xadrez?" },
    { quem:"pietro", texto:"Jogo, sim. Por quê?" },
    { quem:"emilly", texto:"Me ensina? Quero aprender. 🙂" },
    { quem:"pietro", texto:"(ela nunca quis aprender xadrez. mas eu só fui descobrir isso depois.) 😂" },
    { quem:"pietro", texto:"Dois meses assim. Xadrez, músicas, conversas que não terminavam." },
    { quem:"emilly", texto:"Você conhece Bridgerton? Podia olhar comigo hoje à noite." },
    { quem:"pietro", texto:"Naquela noite, assistindo Bridgerton juntos, algo mudou. E os dois sabiam." },
    { quem:"emilly", texto:"Não vai me pedir em namoro? 💗" },
    { quem:"pietro", texto:"Não quer namorar comigo?" },
    { quem:"emilly", texto:"...Quero. 💗" },
    { quem:"pietro", texto:"11 de outubro de 2024. O melhor dia." },
    { quem:"pietro", texto:"E desde então, cada dia ao lado dela é o melhor momento." },
    { quem:"emilly", texto:"E se a gente tivesse um cantinho nosso aqui em Santa Maria? 🏡" },
    { quem:"pietro", texto:"Já tô pesquisando os terrenos, Mimi. Vamos escolher juntos?" },
  ],
  terreno_escolhido: [
    { quem:"emilly", texto:"Perfeito! Já dá pra imaginar como vai ficar!" },
    { quem:"pietro", texto:"É o começo de tudo. Da nossa história aqui." },
    { quem:"emilly", texto:"Vamos com tudo, amor. 🏡" },
  ],
  level3_jardim: [
    { quem:"pietro", texto:"Imagina tomar café no jardim todo domingo de manhã." },
    { quem:"emilly", texto:"Com as flores que eu escolhi ali na entrada... 🌹 Perfeito." },
    { quem:"pietro", texto:"A fachada ficou linda. Você tem um dom incrível, meu amor." },
    { quem:"emilly", texto:"Agora o jardim! 🌻 Pode deixar que cuido de tudo." },
  ],
  level4_sala: [
    { quem:"emilly", texto:"Que linda ficou nossa sala, Pietro!" },
    { quem:"pietro", texto:"Valeu cada centavo. E cada hora que você ficou planejando." },
    { quem:"emilly", texto:"É onde a gente vai maratonar série, receber a família..." },
    { quem:"pietro", texto:"É o coração da casa. Igualzinho você pra mim. 💕" },
  ],
  level6_completo: [
    { quem:"emilly", texto:"Que linda ficou nossa casa, meu amor..." },
    { quem:"pietro", texto:"Valeu a pena cada segundo gasto aqui. Cada escolha, cada moeda." },
    { quem:"emilly", texto:"Você programou, eu decorei, e juntos fizemos um lar de verdade." },
    { quem:"pietro", texto:"E isso é só o começo. Ainda temos toda uma vida pra preencher esse lugar." },
    { quem:"emilly", texto:"Com muito amor, muitas xícaras de café... e nossos gatinhos. 😻" },
    { quem:"pietro", texto:"Com você, sempre. 💙" },
  ],
  adocao_gato: [
    { quem:"emilly", texto:"PIETROOO olha esse gatinho... posso? Por favor? 🥺" },
    { quem:"pietro", texto:"...Como que eu falo não pra essa carinha?" },
    { quem:"emilly", texto:"Não consegue né? 😂 Então ele é nosso!" },
    { quem:"pietro", texto:"Bem-vindo à família, pequeno! 🐾" },
  ],
  evento_diario: [
    { quem:"pietro", texto:"Bom dia, meu amor! Mais um dia pra construir nosso sonho juntos. ☀️" },
    { quem:"emilly", texto:"Olhei pra casa de novo e me apaixonei de novo. Igual a você. 🥰" },
    { quem:"pietro", texto:"Cada cantinho aqui tem uma história nossa. Amo isso." },
    { quem:"emilly", texto:"Quando chego em casa e vejo tudo assim... não quero ir a lugar nenhum." },
    { quem:"pietro", texto:"Casa é onde você está. Sempre." },
    { quem:"emilly", texto:"Hoje acordei querendo passar o dia aqui com você. Fica?" },
    { quem:"pietro", texto:"Programei de casa hoje. Fica mais gostoso saber que você tá ao lado." },
    { quem:"emilly", texto:"Nossa casinha cheira a café e felicidade. Amo demais." },
    { quem:"pietro", texto:"Lembra quando você fingia gostar de xadrez? Eu sabia. E adorei. 😂" },
    { quem:"emilly", texto:"Não vai me pedir em namoro hoje também? 💗" },
    { quem:"pietro", texto:"Você já é minha, Mimi. Todo dia. 💙" },
    { quem:"emilly", texto:"Tô aprendendo Hometown no piano. É pra você saber que penso em você. 🎹" },
    { quem:"pietro", texto:"No campeonato da prof. Rejane, olhei pra você e pensei: ela é incrível." },
    { quem:"emilly", texto:"Sorvete do Mac + shopping + você = dia perfeito. Simples assim. 🍦" },
    { quem:"pietro", texto:"Cada dia na escola ao lado dela é o melhor momento. Sem exagero." },
    { quem:"emilly", texto:"A nossa casinha vai ter um piano um dia. Promessa. 🎹🏡" },
  ],

  campeonato_taekwondo: [
    { quem:"pietro", texto:"Ginásio da prof. Rejane. Dia de campeonato." },
    { quem:"pietro", texto:"Os dois estavam cansados. Treinos pesados na semana." },
    { quem:"emilly", texto:"Tô com as pernas travando. Mas vou. 🥋" },
    { quem:"pietro", texto:"Eu sabia que ela ia. Nunca vi ela desistir de nada." },
    { quem:"emilly", texto:"Você também vai competir, né? Não me deixa sozinha nisso. 😅" },
    { quem:"pietro", texto:"Claro que vou. A gente vai junto." },
    { quem:"pietro", texto:"Na hora dela entrar... o cansaço sumiu. Fiquei só olhando." },
    { quem:"pietro", texto:"Ela é forte. Concentrada. Boa em tudo que faz." },
    { quem:"emilly", texto:"Você ficou me olhando a competição toda. Percebi. 💗" },
    { quem:"pietro", texto:"É que você é incrível, Mimi. Não tem como não olhar." },
    { quem:"emilly", texto:"Para. Você me faz corar. 🥺" },
    { quem:"pietro", texto:"Saímos cansados. Mas eu tava feliz. Um dos meus dias favoritos." },
  ],
};

const QUIZ_QUESTIONS = [
  { cat:"Dev",      q:"O que significa \"HTML\"?",                   opts:["HyperText Markup Language","High Text Making Language","Hyper Transfer Markup Link","HyperText Modern Language"], ans:0 },
  { cat:"Dev",      q:"Qual símbolo inicia um comentário em JavaScript?", opts:["#","//","--","**"], ans:1 },
  { cat:"Dev",      q:"O que é CSS?",                                  opts:["Linguagem de programação","Banco de dados","Linguagem de estilo visual","Sistema operacional"], ans:2 },
  { cat:"Dev",      q:"O que faz o comando \"console.log()\"?",       opts:["Salva um arquivo","Exibe mensagem no console","Cria um loop","Conecta ao servidor"], ans:1 },
  { cat:"Dev",      q:"Em que ano o JavaScript foi criado?",           opts:["1989","1995","2001","2008"], ans:1 },
  { cat:"Dev",      q:"Qual desses é um framework JavaScript?",        opts:["Django","Laravel","React","Flask"], ans:2 },
  { cat:"Dev",      q:"O que é um \"bug\" em programação?",           opts:["Um inseto no computador","Um erro no código","Um tipo de vírus","Uma linguagem nova"], ans:1 },
  { cat:"Dev",      q:"O que significa \"API\"?",                     opts:["Application Programming Interface","Advanced Program Integration","Automated Process Interaction","Application Protocol Index"], ans:0 },
  { cat:"Math",     q:"Quanto é 7 × 8?",                              opts:["54","56","58","62"], ans:1 },
  { cat:"Math",     q:"Qual é a raiz quadrada de 144?",               opts:["11","12","13","14"], ans:1 },
  { cat:"Math",     q:"Quanto é 15% de 200?",                         opts:["20","25","30","35"], ans:2 },
  { cat:"Math",     q:"Qual é o número pi aproximado?",               opts:["2,71","3,14","3,41","2,14"], ans:1 },
  { cat:"Math",     q:"Quanto é 2 elevado a 10?",                     opts:["512","1024","2048","256"], ans:1 },
  { cat:"Math",     q:"Quantos lados tem um hexágono?",               opts:["5","6","7","8"], ans:1 },
  { cat:"Português",q:"Qual é o plural de \"pão\"?",                  opts:["Pãos","Pões","Pães","Pãoes"], ans:2 },
  { cat:"Português",q:"Qual é o antônimo de \"generoso\"?",           opts:["Humilde","Sovina","Orgulhoso","Fiel"], ans:1 },
  { cat:"Português",q:"\"Mal\" ou \"mau\"? — \"Ele é um ___ elemento.\"", opts:["mal","mau"], ans:1 },
  { cat:"Português",q:"Quem escreveu \"Dom Casmurro\"?",             opts:["José de Alencar","Machado de Assis","Clarice Lispector","Carlos Drummond"], ans:1 },
  { cat:"Cultura",  q:"Qual é o livro sagrado do Islamismo?",         opts:["Torá","Bíblia","Alcorão","Vedas"], ans:2 },
  { cat:"Cultura",  q:"Quantos apóstolos Jesus escolheu?",            opts:["10","12","7","14"], ans:1 },
  { cat:"Cultura",  q:"Em qual cidade Jesus nasceu?",                 opts:["Jerusalém","Nazaré","Belém","Cafarnaum"], ans:2 },
  { cat:"Geral",    q:"Qual é o maior planeta do Sistema Solar?",     opts:["Saturno","Netuno","Júpiter","Urano"], ans:2 },
  { cat:"Geral",    q:"Em que país fica a Torre Eiffel?",             opts:["Itália","Espanha","França","Portugal"], ans:2 },
  { cat:"Geral",    q:"Quantos continentes tem a Terra?",             opts:["5","6","7","8"], ans:2 },
  { cat:"Geral",    q:"Qual é o rio mais longo do mundo?",            opts:["Amazonas","Nilo","Yangtzé","Mississippi"], ans:1 },
  { cat:"💕 Especial", q:"Em que mês Pietro faz aniversário?",        opts:["Dezembro","Janeiro","Fevereiro","Março"], ans:1 },
  { cat:"💕 Especial", q:"Em que mês Emilly faz aniversário?",        opts:["Março","Maio","Abril","Junho"], ans:2 },
  { cat:"💕 Especial", q:"Em que dia Pietro e Emilly começaram a namorar?", opts:["10 de outubro","11 de outubro","12 de outubro","13 de outubro"], ans:1 },
  { cat:"🏙️ Santa Maria", q:"Qual universidade federal fica em Santa Maria?", opts:["UFRGS","UFSM","UFPEL","UNIPAMPA"], ans:1 },
  { cat:"🏙️ Santa Maria", q:"Santa Maria é conhecida como Cidade dos...?",   opts:["Gaúchos","Estudantes","Açorianos","Pinheiros"], ans:1 },
];

/* ════ STATE ════ */

// Template para os dados de cada jogador (separado por pessoa)
const DEFAULT_PLAYER = {
  gamePhase:"intro", currentSave:0, saves:[],
  coins:300, // 300 garante que dá pra comprar o terreno mais barato (240🪙) e ainda sobra pra começar
  pet:{ adopted:false, gatoId:null, nome:null, hunger:80, energy:80, happy:80, love:80, lastFed:null, lastPet:null, lastPlayed:null, lastSlept:null },
  quiz:{ lastDate:null },
  earnedToday:{ date:null, mood:false, location_pietro:false, location_emilly:false, mural:false, quiz:false },
  dialogoVisto:{}, eventoDiarioVisto:null,
};

// Estado global compartilhado
const DEFAULT_HOME = {
  selectedPlayer: null, // "pietro" | "emilly" | null
  pietro: null,
  emilly: null,
};

let _db=null,_doc=null,_state=JSON.parse(JSON.stringify(DEFAULT_HOME));
let _activePlayer=null; // "pietro" ou "emilly"
let _quizPerson="pietro",_currentQ=null,_answered=false;
let _dialogRunning=false,_dialogQueue=[];
let _selecting=false;     // trava: impede re-render durante seleção de jogador
let _renderPending=false; // debounce: agrupa múltiplos snapshots num único renderRPG
let _hasPendingSave=false; // FIX-BUG3: sinaliza que awardCoins foi chamado antes de _doc existir
let _quizLastDateLocal={}; // FIX-BUG2: cache local de lastDate por jogador, evita snapshot sobrescrever antes do debounce salvar

// Atalhos para o jogador ativo
function playerState(){ return _activePlayer?(_state[_activePlayer]||null):null; }

// saveState: debounce 400ms + promise compartilhada (não cria promises órfãs)
// Múltiplas chamadas dentro de 400ms reusam a mesma Promise — .finally() sempre dispara
let _saveTimer = null;
let _savePending = null;
let _saveResolve = null;
function saveState(){
  if(!_doc) return Promise.resolve();
  clearTimeout(_saveTimer);
  // HOME-4: captura resolve ANTES de zerar, evita Promise que nunca resolve
  if(!_savePending){
    _savePending = new Promise(res => { _saveResolve = res; });
  }
  const promiseToReturn = _savePending;
  _saveTimer = setTimeout(async ()=>{
    const resolve = _saveResolve; // captura referência local
    _saveTimer    = null;
    _savePending  = null;
    _saveResolve  = null;
    try{ await setDoc(_doc, _state); }
    catch(e){ console.warn("home save:", e); }
    resolve?.(); // HOME-4: uso de ?. por segurança extra
  }, 400);
  return promiseToReturn;
}
function todayStr(){
  // Usa data local (não UTC) para evitar bug das 21h-meia-noite no fuso UTC-3 (Brasil)
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function currentSave(){ const ps=playerState(); return ps?ps.saves[ps.currentSave]||null:null; }
function currentTerreno(){ const sv=currentSave(); return sv?TERRENOS.find(t=>t.id===sv.terrenoId)||null:null; }
function ownedItems(){ const sv=currentSave(); return new Set(sv?sv.items:[]); }
function getLoja(){ const sv=currentSave(); if(!sv)return LOJA_EXTERIOR; if(sv.fase==="interior")return LOJA_INTERIOR; if(sv.fase==="jardim")return LOJA_JARDIM; return LOJA_EXTERIOR; }

/* ════ ANIMATIONS ════ */
function spawnCoinPop(amount,x,y){ if(!amount)return; const el=document.createElement("div"); el.className="coin-pop"; el.textContent=`+${amount} 🪙`; el.style.left=(x||window.innerWidth/2-20)+"px"; el.style.top=(y||window.innerHeight/2)+"px"; document.body.appendChild(el); setTimeout(()=>el.remove(),950); }
function spawnXpPop(amount,x,y){ if(!amount)return; const el=document.createElement("div"); el.className="xp-pop"; el.textContent=`+${amount} XP ⭐`; el.style.left=(x||window.innerWidth/2-20)+"px"; el.style.top=((y||window.innerHeight/2)-40)+"px"; document.body.appendChild(el); setTimeout(()=>el.remove(),950); }
function spawnHearts(x,y,count){ for(let i=0;i<(count||3);i++){ setTimeout(()=>{ const el=document.createElement("div"); el.className="heart-pop"; el.textContent=["💗","💕","❤️","💖"][Math.floor(Math.random()*4)]; el.style.left=(x+(Math.random()-0.5)*40)+"px"; el.style.top=y+"px"; el.style.animationDuration=(0.8+Math.random()*0.6)+"s"; document.body.appendChild(el); setTimeout(()=>el.remove(),1400); },i*120); } }
function showToastNativo(msg){ import("./ui.js").then(m=>m.showToast(msg)); }

/* ════ COINS ════ */
export function awardCoins(reason,amount,playerName){
  // Se playerName fornecido, usa ele diretamente; senão usa o jogador ativo
  const resolvedName = playerName ? playerName.toLowerCase() : _activePlayer;
  if(!resolvedName || !['pietro','emilly'].includes(resolvedName)) return;
  // Inicializa jogador lazily se ainda não existir (ex: mood/mural chamados sem abrir a casinha)
  if(!_state[resolvedName]) _state[resolvedName]=JSON.parse(JSON.stringify(DEFAULT_PLAYER));
  const ps = _state[resolvedName];
  const today=todayStr();
  // BUG-M7: reset dinâmico — mantém todas as chaves conhecidas como false sem lista hardcoded
  // Qualquer nova reason adicionada no awardCoins funciona automaticamente
  if(ps.earnedToday.date!==today){
    const resetKeys={date:today};
    Object.keys(ps.earnedToday).forEach(k=>{ if(k!=='date') resetKeys[k]=false; });
    // Garante chaves base mesmo se earnedToday estava vazio
    ['mood','location_pietro','location_emilly','mural','quiz'].forEach(k=>{ if(!(k in resetKeys)) resetKeys[k]=false; });
    ps.earnedToday=resetKeys;
  }
  if(ps.earnedToday[reason])return;
  ps.earnedToday[reason]=true; ps.coins+=amount;
  if(!_doc) _hasPendingSave=true; // FIX-BUG3: _doc ainda null (casinha não aberta) — salva quando initHome conectar
  saveState();
  // Só re-renderiza a UI de moedas/ganhos se for o jogador ativo
  if(!_activePlayer || resolvedName===_activePlayer){
    renderCoins(); renderEarnList();
  }
  spawnCoinPop(amount,window.innerWidth/2-30,window.innerHeight/2);
  showToastNativo(`🪙 +${amount} moedas!`);
}

function addXp(amount){
  const sv=currentSave(); if(!sv)return;
  sv.xp=(sv.xp||0)+amount;
  spawnXpPop(amount,window.innerWidth/2+40,window.innerHeight/2);
  checkLevelUp();
}

let _levelUpShown = new Set(); // HOME-3: evita modal duplicado em chamadas rápidas
function checkLevelUp(){
  const sv=currentSave(); if(!sv)return;
  const LEVELS=[
    {level:1,nome:"Fundação",         xpNeeded:0},
    {level:2,nome:"Fachada",          xpNeeded:200, unlocks:["cat"]},
    {level:3,nome:"Jardim & Entrada", xpNeeded:500, unlocks:["interior_hint"]},
    {level:4,nome:"Interior — Sala",  xpNeeded:900},
    {level:5,nome:"Interior — Quarto",xpNeeded:1400},
    {level:6,nome:"Lar Completo 🏡",  xpNeeded:2000},
  ];
  sv.level=sv.level||1;
  let leveled=false;
  for(const lv of LEVELS){
    if(sv.xp>=lv.xpNeeded && sv.level<lv.level){
      sv.level=lv.level; leveled=true;
      renderLevel();
      const modalKey=`lv${lv.level}_${sv.id||0}`;
      if(!_levelUpShown.has(modalKey)){
        _levelUpShown.add(modalKey);
        showLevelUpModal(lv);
        setTimeout(()=>_levelUpShown.delete(modalKey), 5000); // limpa após 5s
      }
      if(lv.unlocks?.includes("cat")) showToastNativo("🐱 Adoção de gato desbloqueada! Aba Pet!");
      // Bug 1 fix: nivéis 3–5 avisam qual fase da casa está disponível
      if(lv.unlocks?.includes("interior_hint")) showToastNativo("🏠 Avance para o Interior quando o jardim estiver pronto!");
    }
  }
  if(leveled) saveState();
}

function renderCoins(){
  const ps=playerState();
  document.querySelectorAll(".home-coin-amount").forEach(el=>el.textContent=ps?ps.coins:0);
}

function renderLevel(){
  if(!_activePlayer){
    document.querySelectorAll(".home-level-label").forEach(el=>el.textContent="Selecione um jogador 👆");
    document.querySelectorAll(".home-xp-fill").forEach(el=>el.style.width="0%");
    document.querySelectorAll(".home-xp-label").forEach(el=>el.textContent="");
    return;
  }
  const sv=currentSave();
  const LEVEL_NAMES=["Início","Fundação","Fachada","Jardim & Entrada","Interior — Sala","Interior — Quarto","Lar Completo 🏡"];
  // XP total necessário para ESTAR em cada nível (índice = nível)
  const XP_THRESHOLD=[0,0,200,500,900,1400,2000];
  const lvl=sv?(sv.level||1):1;
  const xp=sv?(sv.xp||0):0;
  document.querySelectorAll(".home-level-label").forEach(el=>el.textContent=`Nível ${lvl} — ${LEVEL_NAMES[lvl]||""}`);
  if(lvl>=6){
    document.querySelectorAll(".home-xp-fill").forEach(el=>el.style.width="100%");
    document.querySelectorAll(".home-xp-label").forEach(el=>el.textContent="Nível máximo! 🏆");
  } else {
    // Bug 4 fix: clampeia xpAtual a 0 para evitar valor negativo se xp < threshold (ex: save antigo)
    const xpAtual=Math.max(0,xp-XP_THRESHOLD[lvl]);
    const xpNeeded=XP_THRESHOLD[lvl+1]-XP_THRESHOLD[lvl];
    const pct=Math.min(100,Math.round((xpAtual/xpNeeded)*100));
    document.querySelectorAll(".home-xp-fill").forEach(el=>el.style.width=pct+"%");
    document.querySelectorAll(".home-xp-label").forEach(el=>el.textContent=`${xpAtual} / ${xpNeeded} XP`);
  }
}

function showLevelUpModal(lv){
  const ex=document.getElementById("levelup-modal"); if(ex)ex.remove();
  const modal=document.createElement("div"); modal.id="levelup-modal"; modal.className="levelup-overlay";
  modal.innerHTML=`<div class="levelup-card"><div class="levelup-stars">⭐⭐⭐</div><div class="levelup-titulo">Nível ${lv.level}!</div><div class="levelup-nome">${lv.nome}</div><button class="levelup-btn" onclick="document.getElementById('levelup-modal').remove()">Continuar 🏡</button></div>`;
  document.body.appendChild(modal); spawnHearts(window.innerWidth/2,window.innerHeight/3,12);
}

function renderEarnList(){
  const ps=playerState(); if(!ps){
    const wrap=document.getElementById("home-earn-list"); if(wrap)wrap.innerHTML=""; return;
  }
  const today=todayStr(); const earned=ps.earnedToday?.date===today?ps.earnedToday:{};
  const quizDone=ps.quiz?.lastDate===today;
  const list=[
    {key:"quiz",label:"📝 Quiz diário",amt:30},
    {key:"mood",label:"😊 Registrar humor",amt:15},
    {key:"location",label:"📍 Compartilhar localização",amt:20},
    {key:"mural",label:"💌 Mensagem no mural",amt:15}
  ];
  const wrap=document.getElementById("home-earn-list"); if(!wrap)return;
  wrap.innerHTML=list.map(item=>{
    // FIX Bug H6: localização usa chaves separadas por pessoa (location_pietro / location_emilly)
    // Usa o resolvedName do jogador ativo (não sempre _activePlayer, que pode ser null)
    const locKey = `location_${_activePlayer}`;
    const done=item.key==="quiz"?quizDone
      :item.key==="location"?!!(earned[locKey])
      :earned[item.key];
    return `<div class="earn-row"><span class="earn-row-left">${item.label}</span><span class="earn-row-right">${done?'<span class="done-check">✓ Feito</span>':`+${item.amt} 🪙`}</span></div>`;
  }).join("");
}

/* ════ DIALOGOS ════ */
function triggerDialogo(chave,onDone){
  const ps=playerState(); if(!ps){ onDone?.(); return; }
  const msgs=DIALOGOS[chave];
  if(!msgs||ps.dialogoVisto?.[chave]){ onDone?.(); return; }
  ps.dialogoVisto=ps.dialogoVisto||{}; ps.dialogoVisto[chave]=true; saveState();
  showDialogoSequence(msgs,onDone);
}

function showDialogoSequence(msgs,onDone){
  if(_dialogRunning){ _dialogQueue.push({msgs,onDone}); return; }
  _dialogRunning=true;
  const overlay=document.createElement("div"); overlay.className="dialogo-overlay"; document.body.appendChild(overlay);
  let idx=0, _tapping=false;
  function showNext(fromUser=false){
    // Debounce só bloqueia cliques do usuário, nunca a chamada automática inicial
    if(fromUser){ if(_tapping)return; _tapping=true; setTimeout(()=>{ _tapping=false; },320); }
    overlay.innerHTML="";
    if(idx>=msgs.length){ overlay.remove(); _dialogRunning=false; onDone?.(); if(_dialogQueue.length){ const nx=_dialogQueue.shift(); showDialogoSequence(nx.msgs,nx.onDone); } return; }
    const m=msgs[idx]; const isPietro=m.quem==="pietro";
    overlay.innerHTML=`<div class="dialogo-box ${isPietro?"dialogo-pietro":"dialogo-emilly"}"><div class="dialogo-avatar">${isPietro?"💙":"💗"}</div><div class="dialogo-bubble"><div class="dialogo-nome">${isPietro?"Pietro":"Emilly"}</div><div class="dialogo-texto">${m.texto}</div></div></div><div class="dialogo-hint">toque para continuar</div>`;
    idx++;
  }
  overlay.addEventListener("click", () => showNext(true));
  showNext(false); // chamada automática inicial — sem debounce
}

/* ════ RENDER RPG ════ */
function renderRPG(){
  const wrap=document.getElementById("home-rpg-wrap"); if(!wrap)return;
  // Se nenhum jogador selecionado, mostra tela de seleção de personagem
  if(!_activePlayer){ renderPlayerSelect(wrap); return; }
  const ps=playerState();
  const phase=ps?.gamePhase||"intro";
  if(phase==="intro") renderIntro(wrap);
  else if(phase==="terreno") renderEscolhaTerreno(wrap);
  else renderCasinha(wrap);
}

/* ════ PLAYER SELECT ════ */
function renderPlayerSelect(wrap){
  wrap.innerHTML=`
    <div class="player-select-wrap">
      <div class="player-select-title">💕 Quem é você?</div>
      <div class="player-select-sub">Cada um tem sua própria casinha e progresso</div>
      <div class="player-select-grid">
        <button class="player-card player-card-pietro" onclick="window._homeSelectPlayer('pietro')" ontouchend="event.preventDefault();window._homeSelectPlayer('pietro')">
          <div class="player-card-emoji">💙</div>
          <div class="player-card-name">Pietro</div>
          <div class="player-card-desc">Programador & arquiteto da nossa história</div>
          <div class="player-card-btn">Sou eu!</div>
        </button>
        <button class="player-card player-card-emilly" onclick="window._homeSelectPlayer('emilly')" ontouchend="event.preventDefault();window._homeSelectPlayer('emilly')">
          <div class="player-card-emoji">💗</div>
          <div class="player-card-name">Emilly</div>
          <div class="player-card-desc">Designer & coração da nossa casinha</div>
          <div class="player-card-btn">Sou eu!</div>
        </button>
      </div>
      <div class="player-select-note">✨ Seus saves ficam guardados separadamente</div>
    </div>`;
}

window._homeSelectPlayer=function(player){
  // FIX: trava contra duplo clique ou re-render do onSnapshot durante a seleção
  if(_selecting) return;
  _selecting=true;

  _activePlayer=player;
  _state.selectedPlayer=player;
  try { localStorage.setItem('pe_active_player', player); } catch(e) {}

  // Garante estrutura do jogador antes de qualquer render
  if(!_state[player]){
    _state[player]=JSON.parse(JSON.stringify(DEFAULT_PLAYER));
  }

  // FIX: renderiza ANTES do saveState — feedback imediato, sem depender do Firebase
  renderCoins(); renderLevel(); renderEarnList(); renderRPG();
  // Se aba quiz estiver ativa, renderiza quiz também
  const quizPanel = document.getElementById('home-panel-quiz');
  if (quizPanel?.classList.contains('active')) renderQuiz();

  const nome=player==="pietro"?"Pietro 💙":"Emilly 💗";
  showToastNativo(`Olá, ${nome}! Bem-vind${player==="emilly"?"a":"o"} à sua casinha! 🏡`);

  // FIX: libera a trava ao fim do save (com ou sem erro)
  saveState().finally(()=>{ _selecting=false; });
};

function renderIntro(wrap){
  const isPietro=_activePlayer==="pietro";
  const emoji=isPietro?"💙":"💗";
  const nome=isPietro?"Pietro":"Emilly";
  const apelido=isPietro?"o dev que faz tudo funcionar 💻":"Mimi, a que finge gostar de xadrez 😂";
  wrap.innerHTML=`<div class="rpg-intro">
    <div class="player-active-badge">${emoji} Jogando como <strong>${nome}</strong></div>
    <div style="font-size:3.2rem;margin-bottom:.6rem">🏫💗🏡</div>
    <h3 class="rpg-intro-title">Pietro & Emilly</h3>
    <p class="rpg-intro-sub">Escola Maria Rocha · Santa Maria, RS · desde 11/10/2024</p>
    <p class="rpg-intro-texto">
      Tudo começou com uma partida de xadrez que ela nunca quis jogar de verdade.<br>
      Hoje você é ${apelido}.<br>
      E agora vão construir o primeiro lar juntos. 🏡
    </p>
    <button class="rpg-start-btn" onclick="window._homeStartGame()">💗 Começar nossa história</button>
    <button class="trocar-player-btn" onclick="window._homeTrocarPlayer()">🔄 Trocar de jogador</button>
  </div>`;
}

function renderEscolhaTerreno(wrap){
  const ps=playerState()||{}; const saves=ps.saves||[];
  const coins=ps.coins||0; const currentSaveIdx=ps.currentSave||0;
  const isPietro=_activePlayer==="pietro"; const emoji=isPietro?"💙":"💗";
  const savesHtml=saves.length>0?`<div class="saves-wrap">
    <div class="saves-titulo">📁 Saves de ${isPietro?"Pietro":"Emilly"}</div>
    ${saves.map((sv,i)=>{ const t=TERRENOS.find(t=>t.id===sv.terrenoId); return `<div class="save-card${i===currentSaveIdx?" active":""}" onclick="window._homeSwitchSave(${i})">${t?.emoji||"🏠"} ${sanitizeHTML(sv.nome)} <span class="save-bairro">${t?.nome||""}</span></div>`; }).join("")}
    ${saves.length<3?`<button class="save-novo-btn" onclick="window._homeNovoSave()">+ Novo terreno</button>`:""}
  </div>`:"";
  wrap.innerHTML=`
  <div class="player-active-badge">${emoji} ${isPietro?"Pietro":"Emilly"} — <button class="trocar-inline" onclick="window._homeTrocarPlayer()">trocar jogador</button></div>
  <div class="terreno-header"><div class="terreno-titulo">📍 Escolha o terreno em Santa Maria</div><div class="terreno-subtitulo">Você tem <strong>🪙 ${coins}</strong> para investir</div></div>
  ${savesHtml}
  <div class="terrenos-grid">
    ${TERRENOS.map(t=>`<div class="terreno-card" onclick="window._homeEscolherTerreno('${t.id}')">
      <div class="terreno-emoji">${t.emoji}</div>
      <div class="terreno-nome">${t.nome}</div>
      <div class="terreno-desc">${t.desc}</div>
      <div class="terreno-info"><span>📐 ${t.area}</span><span>🎓 ${t.distUFSM}</span></div>
      <div class="terreno-frase">${t.frase}</div>
      <div class="terreno-preco-wrap"><span class="terreno-preco">🪙 ${t.preco}</span></div>
      <button class="terreno-btn${coins<t.preco?" disabled":""}" ${coins<t.preco?"disabled":""}>${coins>=t.preco?"Escolher este terreno":`Precisa de mais 🪙 ${t.preco-coins}`}</button>
    </div>`).join("")}
  </div>`;
}

function renderCasinha(wrap){
  const ps=playerState();
  const sv=currentSave(); const terreno=currentTerreno();
  const owned=ownedItems(); const loja=getLoja();
  const today=todayStr();
  let eventoDiario="";
  if(ps?.eventoDiarioVisto!==today){
    const msgs=DIALOGOS.evento_diario; const msg=msgs[Math.floor(Math.random()*msgs.length)];
    const isPietro=msg.quem==="pietro";
    eventoDiario=`<div class="evento-diario" id="evento-diario-card"><button class="evento-close" onclick="window._homeFecharEvento()">✕</button><div class="dialogo-box ${isPietro?"dialogo-pietro":"dialogo-emilly"}" style="margin:0"><div class="dialogo-avatar">${isPietro?"💙":"💗"}</div><div class="dialogo-bubble"><div class="dialogo-nome">${isPietro?"Pietro":"Emilly"}</div><div class="dialogo-texto">${msg.texto}</div></div></div></div>`;
  }
  const totalItems=loja.length; const doneItems=loja.filter(i=>owned.has(i.id)).length;
  const fasePct=totalItems>0?Math.round((doneItems/totalItems)*100):0;
  let avancarBtn="";
  if(sv?.fase==="exterior" && doneItems>=4) avancarBtn=`<button class="avancar-btn" onclick="window._homeAvancarFase()">🌳 Avançar para o Jardim</button>`;
  else if(sv?.fase==="jardim" && doneItems>=4) avancarBtn=`<button class="avancar-btn" onclick="window._homeAvancarFase()">🏠 Avançar para o Interior</button>`;
  else if(sv?.fase==="interior" && doneItems>=6) avancarBtn=`<button class="avancar-btn" onclick="window._homeCompletarCasa()">🎉 Casa Completa!</button>`;
  else { const needed=sv?.fase==="interior"?6:4; avancarBtn=`<div class="avancar-hint">Compre mais itens para avançar de fase (${doneItems} de ${needed} necessários)</div>`; }

  const isPietro=_activePlayer==="pietro";
  wrap.innerHTML=`${eventoDiario}
  <div class="player-active-badge">${isPietro?"💙":"💗"} ${isPietro?"Pietro":"Emilly"} — <button class="trocar-inline" onclick="window._homeTrocarPlayer()">trocar jogador</button></div>
  <div class="casinha-header"><span class="casinha-bairro">${terreno?.emoji||"🏠"} ${terreno?.nome||""} — Santa Maria</span><span class="casinha-fase">${sv?.fase==="interior"?"🏠 Interior":sv?.fase==="jardim"?"🌳 Jardim":"🔨 Exterior"}</span></div>
  <div class="casa-visual-wrap">${getCasaSVG(owned,sv?.fase)}</div>
  <div class="fase-progress"><div class="fase-progress-label">Progresso: ${doneItems}/${totalItems} itens</div><div class="fase-progress-bar"><div class="fase-progress-fill" style="width:${fasePct}%"></div></div></div>
  <div class="tk-evento-card" onclick="window._homeTriggerTaekwondo()" title="Reviver o campeonato">
    <span class="tk-evento-icon">🥋</span>
    <div class="tk-evento-body">
      <div class="tk-evento-title">Campeonato da Prof. Rejane</div>
      <div class="tk-evento-sub">${ps?.dialogoVisto?.campeonato_taekwondo?"✓ Memória salva":"Toque para reviver esse momento"}</div>
    </div>
    <span class="tk-evento-arrow">›</span>
  </div>
  <div class="loja-wrap">
    <div class="loja-titulo">🛒 ${sv?.fase==="interior"?"Interior":sv?.fase==="jardim"?"Jardim & Entrada":"Fachada"}</div>
    <div class="loja-grid">${loja.map(item=>{ const isOwned=owned.has(item.id); const exclBlock=item.exclusivo?loja.some(i=>i.exclusivo===item.exclusivo&&owned.has(i.id)&&i.id!==item.id):false; return `<div class="loja-item${isOwned?" owned":""}${exclBlock?" exclbl":""}" onclick="${isOwned||exclBlock?"":` window._homeComprar('${item.id}')`}">
      ${isOwned?'<span class="loja-owned-badge">✓</span>':""}
      <div class="loja-item-icon">${item.icon}</div>
      <div class="loja-item-nome">${item.nome}</div>
      <div class="loja-item-desc">${item.desc}</div>
      <div class="loja-item-footer"><span class="loja-item-preco">${isOwned?"✓ Na casinha":`🪙 ${item.preco}`}</span><span class="loja-item-xp">+${item.xp} XP</span></div>
    </div>`; }).join("")}</div>
  </div>
  ${avancarBtn}
  <div style="text-align:center;margin-top:1.5rem"><button class="recomecar-btn" onclick="window._homeRecomecar()">🔄 Comprar novo terreno</button></div>`;
}

/* ════ CASA SVG ════ */
function getCasaSVG(owned,fase){
  let wall="#f5f5f5";
  if(owned.has("casa_rosa"))    wall="#f8bbd0";
  if(owned.has("casa_azul"))    wall="#bbdefb";
  if(owned.has("casa_amarela")) wall="#fff9c4";
  if(owned.has("casa_verde"))   wall="#c8e6c9";
  if(owned.has("casa_branca"))  wall="#ffffff";
  let roof="#c0392b";
  if(owned.has("telhado_metal")) roof="#607d8b";
  if(owned.has("telhado_verde")) roof="#388e3c";
  let portaFill="#795548"; let portaArco=owned.has("porta_arco");
  if(owned.has("porta_vidro")) portaFill="#90caf9";
  if(portaArco) portaFill="#a5745b";
  const janArco=owned.has("janela_arco"); const janSimples=owned.has("janela_simples");
  let calcada="#9e9e9e";
  if(owned.has("calcada_pedra")) calcada="#78909c";
  if(owned.has("calcada_tijolo")) calcada="#bf360c";
  const portaSVG=portaArco
    ?`<path d="M126 140 Q140 120 154 140 L154 165 L126 165 Z" fill="${portaFill}"/><rect x="126" y="145" width="28" height="20" fill="${portaFill}"/>`
    :`<rect x="126" y="128" width="28" height="37" rx="${owned.has("porta_vidro")?2:3}" fill="${portaFill}"/>`;
  const janSVG=(x,y)=>janSimples
    ?`<rect x="${x}" y="${y}" width="30" height="28" rx="3" fill="#e3f2fd" stroke="#90caf9" stroke-width="1.5"/><line x1="${x+15}" y1="${y}" x2="${x+15}" y2="${y+28}" stroke="#90caf9" stroke-width="1"/><line x1="${x}" y1="${y+14}" x2="${x+30}" y2="${y+14}" stroke="#90caf9" stroke-width="1"/>`
    :janArco
    ?`<path d="M${x} ${y+16} Q${x} ${y} ${x+15} ${y} Q${x+30} ${y} ${x+30} ${y+16} L${x+30} ${y+36} L${x} ${y+36} Z" fill="#e3f2fd" stroke="#90caf9" stroke-width="1.5"/>`
    :`<rect x="${x}" y="${y}" width="30" height="28" rx="3" fill="#e3f2fd" stroke="#90caf9" stroke-width="1.5"/><line x1="${x+15}" y1="${y}" x2="${x+15}" y2="${y+28}" stroke="#90caf9" stroke-width="1"/><line x1="${x}" y1="${y+14}" x2="${x+30}" y2="${y+14}" stroke="#90caf9" stroke-width="1"/>`;
  let cerca="";
  if(owned.has("cerca_madeira")) cerca=`<g fill="#8d6e63">${[0,18,36,54,72,90,108,126,144,162,180,198,216,234,252].map(x=>`<rect x="${x}" y="156" width="12" height="24" rx="2"/>`).join("")}<rect x="0" y="162" width="280" height="5" rx="2"/><rect x="0" y="172" width="280" height="5" rx="2"/></g>`;
  else if(owned.has("cerca_ferro")) cerca=`<g fill="#455a64">${[4,20,36,52,68,84,100,116,132,148,164,180,196,212,228,244,260].map(x=>`<rect x="${x}" y="154" width="6" height="26" rx="1"/><polygon points="${x+3},154 ${x},158 ${x+6},158"/>`).join("")}<rect x="0" y="165" width="280" height="3" rx="1"/><rect x="0" y="174" width="280" height="3" rx="1"/></g>`;
  else if(owned.has("cerca_viva")) cerca=`<ellipse cx="20" cy="162" rx="18" ry="12" fill="#388e3c"/><ellipse cx="50" cy="160" rx="16" ry="13" fill="#43a047"/><ellipse cx="80" cy="162" rx="18" ry="12" fill="#2e7d32"/><ellipse cx="110" cy="161" rx="17" ry="12" fill="#388e3c"/><ellipse cx="140" cy="162" rx="18" ry="12" fill="#43a047"/><ellipse cx="170" cy="161" rx="17" ry="12" fill="#2e7d32"/><ellipse cx="200" cy="162" rx="18" ry="12" fill="#388e3c"/><ellipse cx="230" cy="160" rx="16" ry="13" fill="#43a047"/><ellipse cx="260" cy="162" rx="18" ry="12" fill="#2e7d32"/>`;
  const ilum=owned.has("iluminacao")?`<circle cx="60" cy="126" r="4" fill="#fff9c4" opacity="0.9"/><circle cx="220" cy="126" r="4" fill="#fff9c4" opacity="0.9"/><line x1="60" y1="116" x2="60" y2="126" stroke="#9e9e9e" stroke-width="2"/><line x1="220" y1="116" x2="220" y2="126" stroke="#9e9e9e" stroke-width="2"/>` :"";
  const gL=[]; if(owned.has("roseiras"))gL.push("🌹"); if(owned.has("girassois"))gL.push("🌻"); if(owned.has("lavanda"))gL.push("💜"); if(owned.has("arvorezinha"))gL.push("🌳");
  const gR=[]; if(owned.has("fonte"))gR.push("⛲"); if(owned.has("banco"))gR.push("🪑");

  return `<div class="casa-svg-container"><svg viewBox="0 0 280 195" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:380px;display:block;margin:auto">
    <rect width="280" height="195" fill="#e8f4fd"/>
    <ellipse cx="40" cy="25" rx="20" ry="10" fill="white" opacity="0.8"/><ellipse cx="58" cy="22" rx="16" ry="10" fill="white" opacity="0.8"/>
    <ellipse cx="220" cy="30" rx="18" ry="9" fill="white" opacity="0.7"/><ellipse cx="238" cy="27" rx="14" ry="9" fill="white" opacity="0.7"/>
    <circle cx="250" cy="25" r="14" fill="#fff176"/>
    <rect x="0" y="175" width="280" height="20" fill="#81c784"/>
    <rect x="115" y="162" width="50" height="18" fill="${calcada}"/>
    ${cerca}
    <rect x="60" y="100" width="160" height="75" rx="4" fill="${wall}" stroke="#bdbdbd" stroke-width="1"/>
    <polygon points="50,105 140,45 230,105" fill="${roof}"/>
    <polygon points="50,105 55,108 230,108 235,105" fill="${roof}" opacity="0.7"/>
    <rect x="175" y="55" width="16" height="30" fill="#8d6e63"/>
    <rect x="172" y="52" width="22" height="7" rx="2" fill="#795548"/>
    <circle cx="183" cy="44" r="6" fill="white" opacity="0.5"/>
    <circle cx="186" cy="36" r="5" fill="white" opacity="0.35"/>
    ${janSVG(75,113)}${janSVG(175,113)}
    ${portaSVG}
    <circle cx="150" cy="150" r="2" fill="#ffd54f"/>
    ${ilum}
    ${playerState()?.pet?.adopted?`<text x="102" y="174" font-size="14" text-anchor="middle">🐱</text>`:""}
    <text x="14" y="190" font-size="13">${gL.join(" ")}</text>
    <text x="210" y="190" font-size="13">${gR.join(" ")}</text>
  </svg></div>`;
}

/* ════ GAME ACTIONS ════ */
window._homeStartGame=function(){
  if(!playerState())return;
  triggerDialogo("introducao",()=>{
    const ps=playerState(); if(!ps)return; // re-fetch após possível snapshot
    ps.gamePhase="terreno"; saveState(); renderRPG();
  });
};

window._homeEscolherTerreno=function(terrenoId){
  const ps=playerState(); if(!ps)return;
  const t=TERRENOS.find(t=>t.id===terrenoId); if(!t)return;
  if(ps.coins<t.preco){ showToastNativo(`Precisa de mais 🪙 ${t.preco-ps.coins}`); return; }
  ps.coins-=t.preco;
  const sv={ id:Date.now(), terrenoId, nome:`Casinha em ${t.nome}`, criadoEm:new Date().toISOString(), fase:"exterior", items:[], xp:0, level:1 };
  ps.saves=ps.saves||[]; ps.saves.push(sv);
  ps.currentSave=ps.saves.length-1; ps.gamePhase="building";
  saveState(); triggerDialogo("terreno_escolhido",()=>renderRPG());
};

window._homeNovoSave=function(){ const ps=playerState(); if(!ps||(ps.saves||[]).length>=3)return; ps.gamePhase="terreno"; saveState(); renderRPG(); };
window._homeSwitchSave=function(idx){ const ps=playerState(); if(!ps)return; ps.currentSave=idx; ps.gamePhase="building"; saveState(); renderRPG(); };
window._homeRecomecar=function(){ const ps=playerState(); if(!ps||!confirm("Quer comprar um novo terreno? Seu save atual continua salvo!"))return; ps.gamePhase="terreno"; saveState(); renderRPG(); };
window._homeFecharEvento=function(){ const ps=playerState(); if(ps)ps.eventoDiarioVisto=todayStr(); saveState(); document.getElementById("evento-diario-card")?.remove(); };
window._homeTrocarPlayer=function(){ _activePlayer=null; try{ localStorage.removeItem('pe_active_player'); }catch(e){} renderCoins(); renderLevel(); renderEarnList(); renderRPG(); };

window._homeComprar=function(itemId){
  const ps=playerState(); const sv=currentSave(); if(!sv||!ps)return;
  const loja=getLoja(); const item=loja.find(i=>i.id===itemId); if(!item)return;
  if(sv.items.includes(itemId)){ showToastNativo("Você já tem esse item!"); return; }
  if(ps.coins<item.preco){ showToastNativo(`Precisa de mais 🪙 ${item.preco-ps.coins}`); return; }
  // HOME-5: busca em TODAS as lojas para não remover itens de fases diferentes por engano
  if(item.exclusivo){ const allItems=[...LOJA_EXTERIOR,...LOJA_JARDIM,...LOJA_INTERIOR]; sv.items=sv.items.filter(id=>{ const o=allItems.find(i=>i.id===id); return !(o?.exclusivo===item.exclusivo); }); }
  ps.coins-=item.preco; sv.items.push(itemId); addXp(item.xp);
  saveState(); renderCoins(); renderRPG();
  spawnHearts(window.innerWidth/2,window.innerHeight/2,5);
  showToastNativo(`${item.icon} ${item.nome} adicionado! +${item.xp} XP`);
};

window._homeAvancarFase=function(){
  const ps=playerState(); const sv=currentSave(); if(!sv||!ps)return;
  if(sv.fase==="exterior"){ sv.fase="jardim"; saveState(); triggerDialogo("level3_jardim",()=>renderRPG()); }
  else if(sv.fase==="jardim"){ sv.fase="interior"; saveState(); triggerDialogo("level4_sala",()=>renderRPG()); }
};

window._homeCompletarCasa=function(){
  const sv=currentSave();
  if(sv) sv.completa=true;
  saveState();
  triggerDialogo("level6_completo",()=>{ showToastNativo("🏆 Parabéns! A casinha está completa!"); renderRPG(); });
};

/* ════ EVENTO TAEKWONDO ════ */
// Pode ser chamado de qualquer lugar do app via window._loveCity.enterDistrict ou direto
function triggerTaekwondoEvent() {
  const ps = playerState();
  if (!ps) return;
  // Usa o sistema de diálogo existente — não cria nova infraestrutura
  // dialogoVisto controla se já foi assistido, mas permite rever (não bloqueia como a intro)
  const msgs = DIALOGOS.campeonato_taekwondo;
  if (!msgs) return;
  showDialogoSequence(msgs, () => {
    // Marca como visto no save
    if (ps) {
      ps.dialogoVisto = ps.dialogoVisto || {};
      ps.dialogoVisto.campeonato_taekwondo = true;
    }
    // Recompensa: moedas + XP (apenas na primeira vez)
    const jaRecompensado = ps?.earnedToday?.taekwondo_evento;
    if (!jaRecompensado) {
      if (ps.earnedToday) ps.earnedToday.taekwondo_evento = true;
      // Moedas via sistema existente (bypassa o filtro earnedToday por ser evento especial)
      const today = todayStr();
      if (ps.earnedToday?.date !== today) {
        ps.earnedToday = { date: today };
      }
      ps.coins = (ps.coins || 0) + 50;
      addXp(40);
      spawnCoinPop(50, window.innerWidth / 2 - 30, window.innerHeight / 2);
      spawnHearts(window.innerWidth / 2, window.innerHeight / 3, 6);
      showToastNativo('🥋 +50 moedas · Momento especial vivido!');
    } else {
      showToastNativo('🥋 Uma memória incrível.');
    }
    // Memória no Love City Core (se disponível)
    try {
      if (typeof window._loveCity?.addMemory === 'function') {
        window._loveCity.addMemory({
          type: 'achievement',
          summary: 'Campeonato de taekwondo juntos — prof. Rejane',
        });
      }
      if (typeof window._loveCity?.addInteraction === 'function') {
        window._loveCity.addInteraction('memory', {
          points: 50,
          summary: 'Campeonato de taekwondo',
        });
      }
    } catch (_) { /* Love City Core opcional — não quebra se ausente */ }
    saveState();
    renderCoins();
    renderRPG();
  });
}

window._homeTriggerTaekwondo = function() {
  try { triggerTaekwondoEvent(); }
  catch(e) { console.warn('[Home] triggerTaekwondoEvent error:', e?.message || e); }
};

// Expõe para o calendário e outros módulos
window.triggerTaekwondoEvent = function() { window._homeTriggerTaekwondo(); };

/* ════ PET ════ */
function getCatSVG(mood){
  const moods={ happy:{eyes:"◕◕",mouth:"▽",color:"#ffb3c1",ear:"#ff85a1"},hungry:{eyes:"◔◔",mouth:"△",color:"#ffd4a0",ear:"#ffb870"},sleepy:{eyes:"－－",mouth:"‥",color:"#c9b8d4",ear:"#a990c0"},idle:{eyes:"◡◡",mouth:"‿",color:"#ffb3c1",ear:"#ff85a1"},playing:{eyes:"★★",mouth:"∪",color:"#ffcc99",ear:"#ffaa66"},loved:{eyes:"♡♡",mouth:"▽",color:"#ffb3c1",ear:"#ff85a1"} };
  let c=moods[mood]?.color||moods.idle.color, ear=moods[mood]?.ear||moods.idle.ear;
  const g=playerState()?.pet?.gatoId;
  if(g==="preto"){ c="#424242"; ear="#212121"; } if(g==="cinza"){ c="#b0bec5"; ear="#90a4ae"; }
  if(g==="rajado"){ c="#a1887f"; ear="#795548"; } if(g==="branco"){ c="#fafafa"; ear="#e0e0e0"; }
  const m={...moods[mood]||moods.idle,color:c,ear};
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;image-rendering:pixelated">
    <ellipse cx="32" cy="60" rx="14" ry="3" fill="rgba(0,0,0,0.2)"/>
    <path d="M44 50 Q58 44 56 36 Q54 28 50 32 Q54 36 52 42 Q50 48 44 50Z" fill="${m.color}"/>
    <rect x="18" y="38" width="28" height="20" rx="8" fill="${m.color}"/>
    <ellipse cx="22" cy="57" rx="5" ry="3" fill="${m.color}"/><ellipse cx="42" cy="57" rx="5" ry="3" fill="${m.color}"/>
    <polygon points="18,28 14,16 24,24" fill="${m.ear}"/><polygon points="46,28 50,16 40,24" fill="${m.ear}"/>
    <ellipse cx="32" cy="34" rx="14" ry="16" fill="${m.color}"/>
    <text x="24" y="31" font-size="9" fill="#333" font-family="monospace">${m.eyes}</text>
    <text x="29" y="40" font-size="7" fill="#e91e63" font-family="monospace">${m.mouth}</text>
    <ellipse cx="20" cy="36" rx="5" ry="2" fill="${m.ear}" opacity="0.5"/>
    <ellipse cx="44" cy="36" rx="5" ry="2" fill="${m.ear}" opacity="0.5"/>
  </svg>`;
}

function getPetMood(){ const ps=playerState(); const{hunger,energy,happy,love}=ps?.pet||{hunger:80,energy:80,happy:80,love:80}; if(happy>80&&hunger>60)return"happy"; if(hunger<30)return"hungry"; if(energy<25)return"sleepy"; if(love>75)return"loved"; return"idle"; }
const PET_MSG={ happy:["Miau! 😸 Tô tão feliz!","Purrrr... ♡"],hungry:["Miau! Comiiida! 😿","Cadê meu petisco?"],sleepy:["Zzzzz... 💤","Tô cansado..."],loved:["Purrrr ♡","*ronrona muito*"],playing:["Brinca mais!","*pula em tudo*"] };
function showPetBubble(text){ const el=document.getElementById("pet-bubble"); if(!el)return; el.textContent=text; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2500); }

function renderPet(){
  const petWrap=document.getElementById("pet-svg-container"); if(!petWrap)return;
  const ps=playerState();
  if(!ps||!_activePlayer){ petWrap.innerHTML=`<div class="pet-locked"><div style="font-size:2.5rem">🐱</div><div style="font-size:.9rem;margin-top:.5rem;color:#c9a9b0">Selecione um jogador primeiro!</div></div>`; document.querySelectorAll(".pet-stats,.pet-actions").forEach(el=>el.style.display="none"); return; }
  const adopted=ps?.pet?.adopted;
  document.querySelectorAll(".pet-stats,.pet-actions").forEach(el=>el.style.display=adopted?"":"none");
  if(!adopted){
    // Bug 2 fix: usa o maior nível entre TODOS os saves do jogador, não só o save atual
    // Evita bloquear/desbloquear pet errado ao trocar de save
    const ps2 = playerState();
    const maxLevel = ps2?.saves?.reduce((max, sv) => Math.max(max, sv.level || 1), 0) ?? 0;
    const saveLevel = maxLevel;
    if(saveLevel>=2){
      petWrap.innerHTML=`<div class="adocao-wrap"><div class="adocao-titulo">🐱 Escolha seu gatinho!</div><div class="adocao-subtitulo">Adoção gratuita 🏡</div><div class="adocao-grid">${GATOS_ADOCAO.map(g=>`<div class="adocao-card" onclick="window._homeAdotarGato('${g.id}')"><div class="adocao-emoji">${g.emoji}</div><div class="adocao-nome">${g.nome}</div><div class="adocao-raca">${g.raca}</div><div class="adocao-personalidade">${g.personalidade}</div><button class="adocao-btn">Adotar 🐾</button></div>`).join("")}</div></div>`;
    } else {
      const lvAtual = maxLevel || 0;
      petWrap.innerHTML=`<div class="pet-locked"><div style="font-size:3rem">🔒</div><div style="font-size:.9rem;margin-top:.5rem;color:#c9a9b0">${saveLevel===0?"Compre um terreno primeiro!":"Alcance o <strong>Nível 2</strong> (você está no "+(lvAtual||1)+") para adotar um gatinho!"}</div></div>`;
    }
    return;
  }
  document.querySelectorAll(".pet-stats,.pet-actions").forEach(el=>el.style.display="");
  const mood=getPetMood(); petWrap.className=`pet-pixel-cat state-${mood}`; petWrap.innerHTML=getCatSVG(mood);
  const nL=document.querySelector(".pet-name-label"); if(nL)nL.textContent=`✦ ${ps.pet.nome||"Bolinha"} ✦`;
  const badge=document.getElementById("pet-mood-badge");
  const bt={happy:"😸 Feliz e satisfeito!",hungry:"🍖 Com fominha!",sleepy:"💤 Com sono...",loved:"💕 Cheio de amor!",idle:"🐾 Querendo atenção"};
  if(badge)badge.textContent=bt[mood]||bt.idle;
  [["hunger",ps.pet.hunger],["energy",ps.pet.energy],["happy",ps.pet.happy],["love",ps.pet.love]].forEach(([k,v])=>{ const f=document.getElementById(`pet-bar-${k}`); const vl=document.getElementById(`pet-bar-${k}-val`); if(f)f.style.width=v+"%"; if(vl)vl.textContent=Math.round(v)+"%"; });
}

window._homeAdotarGato=function(gatoId){
  const ps=playerState(); if(!ps)return;
  const gato=GATOS_ADOCAO.find(g=>g.id===gatoId); if(!gato)return;
  triggerDialogo("adocao_gato",()=>{
    // Mostra mini-modal inline para nome em vez de prompt() (pode ser bloqueado)
    const overlay=document.createElement("div");
    overlay.style.cssText="position:fixed;inset:0;background:rgba(89,13,34,.7);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;";
    overlay.innerHTML=`<div style="background:white;border-radius:24px;padding:2rem 1.5rem;max-width:300px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(89,13,34,.3)">
      <div style="font-size:2.5rem;margin-bottom:.5rem">${gato.emoji}</div>
      <div style="font-family:'Playfair Display',serif;font-size:1.2rem;color:#590d22;margin-bottom:.3rem">Que nome pra ele?</div>
      <div style="font-size:.8rem;color:#c9a9b0;margin-bottom:1rem">${gato.raca}</div>
      <input id="_pet-nome-input" type="text" value="${gato.nome}" maxlength="20"
        style="width:100%;padding:.7rem 1rem;border:1.5px solid #ffd6de;border-radius:50px;font-size:1rem;text-align:center;outline:none;color:#590d22;box-sizing:border-box;margin-bottom:1rem"
        onfocus="this.select()"/>
      <button onclick="window._homeConfirmarAdocao('${gatoId}')" style="background:#e8536f;color:white;border:none;padding:.8rem 2rem;border-radius:50px;font-size:1rem;font-weight:700;cursor:pointer;width:100%">Adotar! 🐾</button>
    </div>`;
    document.body.appendChild(overlay);
    window._petAdocaoOverlay=overlay;
    setTimeout(()=>document.getElementById("_pet-nome-input")?.focus(),100);
  });
};

window._homeConfirmarAdocao=function(gatoId){
  const ps=playerState(); if(!ps)return;
  const gato=GATOS_ADOCAO.find(g=>g.id===gatoId); if(!gato)return;
  const input=document.getElementById("_pet-nome-input");
  const nome=(input?.value?.trim())||gato.nome;
  window._petAdocaoOverlay?.remove();
  ps.pet={...ps.pet,adopted:true,gatoId,nome,hunger:80,energy:80,happy:80,love:80,lastFed:new Date().toISOString()};
  saveState(); renderPet(); showToastNativo(`🐱 ${nome} foi adotado!`);
  spawnHearts(window.innerWidth/2,window.innerHeight/3,10);
};

function petDecay(){
  const ps=playerState(); if(!ps?.pet?.adopted)return;
  const last=ps.pet.lastDecay?new Date(ps.pet.lastDecay):(ps.pet.lastFed?new Date(ps.pet.lastFed):null);
  if(last){
    const h=Math.min((Date.now()-last.getTime())/3600000, 8); // máx 8h de decay acumulado
    // FIX: guard de 2 minutos — evita aplicar decay duplo em snapshots rápidos consecutivos
    if(h>0.033){ // 2 minutos mínimo entre decays (0.033h = 2min)
      ps.pet.hunger=Math.max(0,ps.pet.hunger-Math.round(h*8));
      ps.pet.energy=Math.max(0,ps.pet.energy-Math.round(h*5));
      ps.pet.happy=Math.max(0,ps.pet.happy-Math.round(h*4));
      // Atualiza lastDecay só se realmente aplicou decay — evita avançar o relógio sem mudança
      ps.pet.lastDecay=new Date().toISOString();
    }
  } else {
    // Primeira vez — registra agora como base
    ps.pet.lastDecay=new Date().toISOString();
  }
}
// FIX Bug H3: startPetDecayInterval só atualiza a UI (renderPet) a cada 5min,
// NÃO aplica mais decay numérico — o decay real é feito por petDecay() chamado no snapshot,
// que calcula pelo tempo real decorrido. Dois mecanismos de decay em paralelo causavam
// queda 2x mais rápida que o esperado.
let _petDecayStarted = false;
function startPetDecayInterval(){
  if(_petDecayStarted) return;
  _petDecayStarted = true;
  setInterval(()=>{
    if(document.hidden) return; // não roda enquanto aba está oculta
    const ps=playerState();
    if(!ps?.pet?.adopted) return;
    // Apenas re-renderiza a UI para refletir o estado atual — sem modificar valores
    renderPet();
  }, 5*60*1000);
}

function feedPet(e){ const ps=playerState(); if(!ps?.pet?.adopted)return; if(ps.pet.hunger>=95){ showPetBubble("Estou cheio! 😸"); return; } ps.pet.hunger=Math.min(100,ps.pet.hunger+25); ps.pet.happy=Math.min(100,ps.pet.happy+10); ps.pet.lastFed=new Date().toISOString(); saveState(); renderPet(); showPetBubble(PET_MSG.happy[Math.floor(Math.random()*PET_MSG.happy.length)]); spawnHearts(e.clientX,e.clientY,4); }
function petPet(e){ const ps=playerState(); if(!ps?.pet?.adopted)return; ps.pet.love=Math.min(100,ps.pet.love+15); ps.pet.happy=Math.min(100,ps.pet.happy+12); ps.pet.lastPet=new Date().toISOString(); const c=document.getElementById("pet-svg-container"); if(c){ c.className="pet-pixel-cat state-loved"; setTimeout(()=>renderPet(),1200); } saveState(); renderPet(); showPetBubble(PET_MSG.loved[Math.floor(Math.random()*PET_MSG.loved.length)]); spawnHearts(e.clientX,e.clientY,6); }
function playWithPet(e){ const ps=playerState(); if(!ps?.pet?.adopted)return; if(ps.pet.energy<15){ showPetBubble("Tô cansado demais... 😴"); return; } ps.pet.happy=Math.min(100,ps.pet.happy+20); ps.pet.energy=Math.max(0,ps.pet.energy-15); ps.pet.love=Math.min(100,ps.pet.love+8); ps.pet.lastPlayed=new Date().toISOString(); const c=document.getElementById("pet-svg-container"); if(c){ c.className="pet-pixel-cat state-playing"; setTimeout(()=>renderPet(),1500); } saveState(); renderPet(); showPetBubble(PET_MSG.playing[Math.floor(Math.random()*PET_MSG.playing.length)]); spawnHearts(e.clientX,e.clientY,3); }
function sleepPet(){ const ps=playerState(); if(!ps?.pet?.adopted)return; ps.pet.energy=Math.min(100,ps.pet.energy+30); ps.pet.lastSlept=new Date().toISOString(); const c=document.getElementById("pet-svg-container"); if(c){ c.className="pet-pixel-cat state-sleepy"; setTimeout(()=>renderPet(),2000); } saveState(); renderPet(); showPetBubble("Zzz... 💤"); }

/* ════ QUIZ ════ */
function renderQuiz(){
  const today=todayStr(); const wrap=document.getElementById("quiz-content"); if(!wrap)return;
  const ps=playerState();
  if(!ps||!_activePlayer){
    wrap.innerHTML=`
      <div class="quiz-done-msg">
        <span class="quiz-done-icon">🎮</span>
        <div class="quiz-done-title">Quem está jogando?</div>
        <div class="quiz-done-sub">Escolha seu personagem para começar o quiz!</div>
        <div style="display:flex;gap:.8rem;justify-content:center;margin-top:1.2rem;flex-wrap:wrap">
          <button class="quiz-option" style="background:linear-gradient(135deg,#4a90d9,#2171c7);color:white;border:none;min-width:120px"
            onclick="window._homeSelectPlayerFromQuiz('pietro')">💙 Pietro</button>
          <button class="quiz-option" style="background:linear-gradient(135deg,#e8536f,#c73a57);color:white;border:none;min-width:120px"
            onclick="window._homeSelectPlayerFromQuiz('emilly')">💗 Emilly</button>
        </div>
      </div>`;
    return;
  }
  // FIX-BUG2: usa _quizLastDateLocal como fonte de verdade durante a sessão,
  // evitando que o snapshot do Firebase (que chega antes do debounce salvar)
  // sobrescreva o lastDate e deixe o quiz em branco ou com botões desabilitados
  const localDone = _quizLastDateLocal[_activePlayer] === today;
  const done = localDone || ps.quiz?.lastDate===today;
  if(done){ wrap.innerHTML=`<div class="quiz-done-msg"><span class="quiz-done-icon">🎉</span><div class="quiz-done-title">Quiz de hoje concluído!</div><div class="quiz-done-sub">Volte amanhã para uma nova pergunta.<br>As moedas já estão na conta! 🪙</div></div>`; return; }
  try {
    const isPietro=_activePlayer==="pietro"; const seed=today.replace(/-/g,""); const off=isPietro?0:Math.floor(QUIZ_QUESTIONS.length/2);
    const qIdx=(parseInt(seed.slice(-4))+off)%QUIZ_QUESTIONS.length; _currentQ=QUIZ_QUESTIONS[qIdx]; _answered=false;
    _quizPerson=_activePlayer;
    wrap.innerHTML=`<div class="quiz-who-row"><div class="quiz-player-badge">${isPietro?"💙 Pietro":"💗 Emilly"} jogando</div></div><div class="quiz-category-badge">${_currentQ.cat}</div><div class="quiz-question-text">${_currentQ.q}</div><div class="quiz-options">${_currentQ.opts.map((opt,i)=>`<button class="quiz-option" onclick="window._homeAnswerQuiz(${i},this)"><span class="quiz-option-letter">${String.fromCharCode(65+i)}</span>${opt}</button>`).join("")}</div><div class="quiz-feedback" id="quiz-feedback"></div>`;
  } catch(e) {
    wrap.innerHTML=`<div class="quiz-done-msg"><span class="quiz-done-icon">😕</span><div class="quiz-done-title">Erro ao carregar o quiz</div><div class="quiz-done-sub">Recarregue a página para tentar novamente.</div></div>`;
    console.warn('[Quiz] renderQuiz error:', e);
  }
}

window._homeSetQuizPerson=function(p){ _quizPerson=p; renderQuiz(); };

// Seleciona jogador direto pela aba Quiz (sem precisar ir para Nossa Casa)
window._homeSelectPlayerFromQuiz=function(player){
  if(_selecting) return;
  _selecting=true;
  _activePlayer=player;
  _state.selectedPlayer=player;
  try { localStorage.setItem('pe_active_player', player); } catch(e) {}
  if(!_state[player]) _state[player]=JSON.parse(JSON.stringify(DEFAULT_PLAYER));
  renderCoins(); renderLevel(); renderEarnList(); renderRPG();
  renderQuiz(); // renderiza imediatamente, não espera o save
  const nome=player==="pietro"?"Pietro 💙":"Emilly 💗";
  showToastNativo(`Olá, ${nome}! Boa sorte no quiz! 🎮`);
  saveState().finally(()=>{ _selecting=false; });
};

window._homeAnswerQuiz=function(idx,btn){
  if(_answered||!_currentQ)return; _answered=true; const correct=idx===_currentQ.ans; const today=todayStr();
  const ps=playerState(); if(!ps)return;
  document.querySelectorAll(".quiz-option").forEach(b=>b.disabled=true);
  document.querySelectorAll(".quiz-option")[_currentQ.ans].classList.add("correct");
  if(!correct)btn.classList.add("wrong");
  const fb=document.getElementById("quiz-feedback"); if(fb){ fb.className=`quiz-feedback show ${correct?"correct":"wrong"}`; fb.textContent=correct?`✓ Correto! +30 🪙 para a casinha!`:`✗ Era "${_currentQ.opts[_currentQ.ans]}" — mas tudo bem!`; }
  if(!ps.quiz)ps.quiz={}; ps.quiz.lastDate=today;
  _quizLastDateLocal[_quizPerson]=today; // FIX-BUG2: cache local — sobrevive ao snapshot do Firebase
  // Marca quiz como feito hoje independente de acertar ou errar
  if(ps.earnedToday.date!==today){
    const resetKeys={date:today};
    Object.keys(ps.earnedToday).forEach(k=>{ if(k!=='date') resetKeys[k]=false; });
    ['mood','location_pietro','location_emilly','mural','quiz'].forEach(k=>{ if(!(k in resetKeys)) resetKeys[k]=false; });
    ps.earnedToday=resetKeys;
  }
  ps.earnedToday.quiz=true;
  if(correct){
    ps.coins+=30;
    spawnCoinPop(30,window.innerWidth/2-30,window.innerHeight/3);
    if(ps.pet?.adopted){ ps.pet.happy=Math.min(100,ps.pet.happy+10); renderPet(); }
  }
  saveState(); renderCoins(); renderEarnList();
  showPetBubble(correct?"Acertou! 🎉":"Quase! Você consegue! 💪");
  setTimeout(()=>renderQuiz(),2500);
};

/* ════ TABS ════ */
window._homeTab=function(tab){
  document.querySelectorAll(".home-tab").forEach(t=>t.classList.toggle("active",t.dataset.tab===tab));
  document.querySelectorAll(".home-panel").forEach(p=>p.classList.toggle("active",p.id===`home-panel-${tab}`));
  if(tab==="rpg") renderRPG();
  if(tab==="quiz") renderQuiz();
  if(tab==="pet") renderPet();
};

/* ════ INIT ════ */
let _unsubscribeHome = null;
export function initHome(db){
  _db=db;
  // Guard: cancela listener anterior para evitar múltiplos onSnapshot em paralelo
  if(_unsubscribeHome){ _unsubscribeHome(); _unsubscribeHome=null; }
  if(!db){ renderCoins(); renderLevel(); renderPet(); renderEarnList(); renderRPG(); return; }
  _doc=doc(db,"home","shared");

  // FIX-BUG3: se awardCoins foi chamado antes de _doc existir, salva o estado acumulado
  // ANTES do primeiro snapshot chegar — assim o merge inteligente preserva as moedas
  if(_hasPendingSave){
    _hasPendingSave=false;
    saveState(); // dispara imediatamente agora que _doc existe
  }

  _unsubscribeHome = onSnapshot(
    _doc,
    snap=>{
      if(snap.exists()){
        const data=snap.data();
        // Migração: se dados antigos (sem pietro/emilly), migra pra novo formato
        if(data.gamePhase!==undefined && !data.pietro && !data.emilly){
          // Dados legados: migra tudo pro Pietro por padrão
          const legacyPlayer={
            gamePhase:data.gamePhase||"intro", currentSave:data.currentSave||0,
            saves:(data.saves||[]).map(sv=>({xp:0,level:1,...sv})),
            coins:data.coins||300, // FIX: mínimo 300 para poder comprar terreno mais barato (240🪙)
            pet:data.pet||JSON.parse(JSON.stringify(DEFAULT_PLAYER.pet)),
            quiz:{ lastDate:data.quiz?.pietro?.lastDate||null },
            earnedToday:data.earnedToday||{date:null,mood:false,location_pietro:false,location_emilly:false,mural:false,quiz:false},
            dialogoVisto:data.dialogoVisto||{}, eventoDiarioVisto:data.eventoDiarioVisto||null,
          };
          _state={ selectedPlayer:null, pietro:legacyPlayer, emilly:null };
        } else {
          // FIX: merge inteligente — nunca sobrescreve o jogador ativo durante um save em andamento
          if(_activePlayer && _selecting){
            // Só atualiza o outro jogador; o ativo está com save pendente — ignore o eco local
            const other=_activePlayer==="pietro"?"emilly":"pietro";
            if(data[other]) _state[other]=data[other];
            _state.selectedPlayer=_activePlayer; // mantém consistência
          } else {
            // BUG7 fix: se há save pendente (_saveTimer), não sobrescreve o jogador ativo
            // para evitar perder compras feitas antes do Firebase confirmar
            const safeMerge = JSON.parse(JSON.stringify(DEFAULT_HOME));
            Object.assign(safeMerge, data);
            if(_activePlayer && _saveTimer){
              // Save pendente: preserva dados locais do jogador ativo, atualiza só o outro
              const other=_activePlayer==="pietro"?"emilly":"pietro";
              if(data[other]) safeMerge[other]=data[other];
              safeMerge[_activePlayer]=_state[_activePlayer];
            }
            _state=safeMerge;
            // Restaura jogador do localStorage se ainda não escolhido nesta sessão
            if(_activePlayer){
              _state.selectedPlayer=_activePlayer;
            } else {
              try {
                const saved = localStorage.getItem('pe_active_player');
                if(saved && ['pietro','emilly'].includes(saved)){
                  _activePlayer = saved;
                  _state.selectedPlayer = saved;
                }
              } catch(e) {}
            }
          }
          // Garante estrutura de cada jogador
          ["pietro","emilly"].forEach(p=>{
            if(_state[p]){
              if(!_state[p].pet) _state[p].pet=JSON.parse(JSON.stringify(DEFAULT_PLAYER.pet));
              if(!_state[p].quiz) _state[p].quiz={lastDate:null};
              if(!_state[p].saves) _state[p].saves=[];
              if(!_state[p].dialogoVisto) _state[p].dialogoVisto={};
              if(!_state[p].earnedToday) _state[p].earnedToday={date:null,mood:false,location_pietro:false,location_emilly:false,mural:false,quiz:false};
              else if(_state[p].earnedToday.quiz===undefined) _state[p].earnedToday.quiz=false;
              // Migração de saves antigos sem xp/level
              _state[p].saves=_state[p].saves.map(sv=>({xp:0,level:1,...sv}));
              // FIX-BUG2: sincroniza cache local com o Firebase — mas nunca desfaz o cache se já está feito
              if(_state[p].quiz?.lastDate) _quizLastDateLocal[p]=_quizLastDateLocal[p]||_state[p].quiz.lastDate;
            }
          });
        }
      }
      petDecay(); renderCoins(); renderLevel(); renderPet(); renderEarnList();
      // Atualiza quiz se aba estiver ativa (ex: snapshot chega enquanto quiz está aberto)
      if(!_selecting){ const qp=document.getElementById('home-panel-quiz'); if(qp?.classList.contains('active')) renderQuiz(); }
      // FIX: não re-renderiza o RPG se:
      //   1. um diálogo está em andamento (evita interromper a intro)
      //   2. o usuário está no meio de uma seleção (_selecting) — evita o botão morto
      //   3. debounce: múltiplos snapshots em sequência viram um único renderRPG
      if(!_dialogRunning && !_selecting){
        if(!_renderPending){
          _renderPending=true;
          setTimeout(()=>{ _renderPending=false; renderRPG(); }, 80);
        }
      }
    },
    err=>console.warn('[Firebase] onSnapshot home:', err.message)
  );
  document.getElementById("pet-sprite-btn")?.addEventListener("click",e=>petPet(e));
  window._homeFeedPet=e=>feedPet(e); window._homePetPet=e=>petPet(e);
  window._homePlayPet=e=>playWithPet(e); window._homeSleepPet=()=>sleepPet();
  const starsContainer=document.getElementById("house-stars-container");
  if(starsContainer){ starsContainer.style.pointerEvents="none"; }
  if(starsContainer&&!starsContainer.children.length){ for(let i=0;i<18;i++){ const star=document.createElement("div"); star.className="house-star"; star.style.left=Math.random()*100+"%"; star.style.top=Math.random()*55+"%"; star.style.animationDelay=(Math.random()*2.5)+"s"; starsContainer.appendChild(star); } }
  startPetDecayInterval();
  window._homeTab("rpg");
}
