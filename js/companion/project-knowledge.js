/* Conhecimento prático do Pestinha sobre os projetos do site.
 * Conteúdo local e revisável; não substitui documentação atualizada.
 */
const ITEMS = [
["arquitetura do nosso tempo","nosso tempo site projeto estrutura javascript html css modulos","O Nosso-tempo usa HTML, CSS e JavaScript em módulos. A ideia é preservar a arquitetura atual e integrar recursos sem migrar tudo para React ou outro framework. Antes de alterar algo, confira quem importa o módulo, quais funções são chamadas e se o service worker precisa receber o novo arquivo."],
["pestinha e conversa direta","pestinha companheiro chat bolha interface flutuante conversar falar oi","O Pestinha já tem uma interface flutuante, uma bolha de resposta e um painel com conversa, memórias e cérebro. A conversa direta pode usar a bolha sem obrigar a abrir o painel. O site tenta iniciar a conversa por voz ao entrar depois da permissão do navegador; o botão e a frase “agora não” podem desligá-la."],
["fala para texto","microfone reconhecimento voz palavra ativacao palavra chave wake word escuta continua speech recognition web speech api fala texto transcricao navegador","O navegador pode transformar fala em texto com SpeechRecognition ou webkitSpeechRecognition. O site recebe a transcrição e a envia para a mesma função que recebe mensagens digitadas, sem exigir palavra-chave enquanto a conversa está ativa. O suporte varia entre navegadores; se não houver suporte, o campo de texto continua funcionando."],
["privacidade do microfone","microfone privacidade audio permissao ouvir navegador","O Pestinha mostra um indicador enquanto está ouvindo e oferece “agora não” e o botão para desligar. A primeira visita ainda depende da permissão nativa do navegador. Em alguns navegadores o áudio é processado por um serviço remoto; reconhecimento local não está disponível em todos os aparelhos."],
["respostas em texto","resposta texto voz fala sintetizada text to speech","A resposta principal do Pestinha pode aparecer escrita na conversa e na bolha flutuante. A leitura em voz alta é uma opção separada; reconhecimento de fala e síntese de voz são recursos diferentes."],
["base de conhecimento local","conhecimento local biblioteca conceitos perguntas respostas offline","A base local do Pestinha é uma coleção de conceitos, sinônimos, exemplos e explicações. Ela não é um modelo de linguagem completo: combina assuntos, contexto curto, memória e respostas preparadas. Quando não encontra uma resposta confiável, deve admitir que não sabe."],
["aprendizado por feedback","feedback cerebro neural aprender corrigir resposta pesos","O Pestinha tem feedback positivo e negativo. Esse retorno pode ajustar associações do cérebro neural local, mas não transforma automaticamente uma resposta errada em conhecimento factual. Para ensinar um fato novo, é melhor acrescentar uma entrada revisada à base de conhecimento."],
["memorias privadas","memorias caderno importar historias privacidade consentimento","As memórias do Pestinha ficam no banco local do site e podem ser consultadas normalmente. Elas permanecem no aparelho e entram automaticamente como contexto quando a pergunta parece pessoal. O Pestinha não deve inventar datas, histórias ou detalhes pessoais que não estejam registrados."],
["banco de dados local","indexeddb local db firestore local persistencia dados","O módulo local-db.js oferece uma interface parecida com Firestore, mas usa armazenamento local no navegador. Isso não significa sincronização entre aparelhos. Para levar dados a outro aparelho, é necessário usar o recurso de backup e importação."],
["backup do pestinha","backup exportar importar json lembrancas","O backup do Pestinha exporta lembranças e dados selecionados para um arquivo JSON. Como pode conter histórias pessoais, deve ser guardado com cuidado. Importar em outro navegador não cria sincronização automática."],
["service worker","service worker sw cache pwa arquivos estaticos atualizar","O service worker controla cache e funcionamento offline do PWA. Quando um novo módulo JavaScript ou CSS é criado, confira a lista STATIC_ASSETS e atualize a versão do cache para evitar que o navegador continue servindo arquivos antigos."],
["pwa e instalacao","pwa manifest aplicativo instalavel site","Um PWA usa manifest, ícones e service worker para oferecer instalação e recursos offline. O site precisa ser servido por HTTPS ou localhost. Uma atualização do service worker pode levar um momento para assumir o controle das abas abertas."],
["modulos javascript","javascript es modules import export app js","Em módulos ES, export define o que um arquivo oferece e import traz essas funções para outro arquivo. Evite depender de variáveis privadas de outro módulo; exponha funções públicas pequenas e bem definidas."],
["eventos do navegador","javascript addEventListener click submit evento interface","addEventListener registra uma função para responder a eventos como click, submit e change. Em formulários, chame preventDefault quando o envio não deve recarregar a página. Para botões criados dinamicamente, delegação de eventos pode simplificar a integração."],
["seguranca javascript","javascript xss sanitizar innerhtml textcontent seguranca","Ao mostrar texto digitado por usuários, prefira textContent. Inserir texto diretamente em innerHTML pode abrir espaço para XSS. Se HTML for indispensável, escape os caracteres especiais e valide a origem dos dados."],
["player de musica do site","music js youtube player playlist playtrack playnext","O player atual está em js/music.js e usa a YouTube IFrame API. playTrack toca uma faixa da playlist, playNext avança, togglePlayPause pausa ou retoma e playCustomYT carrega um link do YouTube. O Pestinha deve chamar funções públicas, sem tentar alterar variáveis internas do módulo de música."],
["adicionar musica","adicionar musica playlist adicionar faixa sem tocar","“Adicionar música” deve incluir a faixa na playlist sem iniciar a reprodução. É uma ação diferente de tocar. Depois de adicionar, o Pestinha deve confirmar o que fez e deixar a escolha de reprodução para a pessoa."],
["tocar musica","tocar musica reproduzir play playlist","“Tocar música” deve reproduzir a faixa escolhida sem adicioná-la automaticamente à playlist. Se houver várias correspondências, o Pestinha deve mostrar opções em vez de escolher uma faixa incerta."],
["pesquisar musica","pesquisar procurar musica youtube resultados opcoes","“Pesquisar música” deve procurar e apresentar opções. Pesquisar não significa adicionar nem tocar. Para resultados confiáveis, use a API oficial do YouTube com uma chave mantida no servidor; sem isso, ofereça uma busca comum do YouTube."],
["youtube iframe api","youtube iframe api videoid loadvideobyid player","A YouTube IFrame API permite controlar um player incorporado, por exemplo carregar um vídeo por ID. O site deve validar o ID e usar as funções públicas do módulo de música. A disponibilidade do vídeo e as regras do YouTube ainda se aplicam."],
["neonplay zapgame","neonplay zapgame portal jogos html5 gamepix","NeonPlay/ZapGame é o portal de jogos HTML5. A prioridade é preservar a estrutura clássica do site, a compatibilidade dos jogos existentes e a estabilidade. Novos jogos precisam de ficha, categoria, imagem e teste de abertura, não apenas de um link jogado numa lista."],
["catalogo de jogos","gamepix catalogo jogos providerid slug categorias auditoria links","O catálogo do portal deve evitar IDs duplicados, links quebrados e jogos sem imagem ou ficha editorial. Uma auditoria útil conta os jogos recebidos e selecionados, verifica links e imagens e aponta categorias ou descrições ausentes."],
["jogos html5","html5 jogos iframe canvas navegador compatibilidade","Jogos HTML5 podem usar Canvas, WebGL ou elementos DOM. Antes de incorporar um jogo, confira se o fornecedor permite embed, se a página funciona em HTTPS, se os controles funcionam no celular e se o carregamento não bloqueia o restante do portal."],
["vercel deploy","vercel deploy producao git push build","O fluxo comum do projeto é revisar as mudanças, executar verificações, fazer commit e push para o GitHub e então acompanhar o deploy da Vercel. Um arquivo criado localmente ou um commit no GitHub não significa, por si só, que a produção já foi atualizada."],
["git commit","git github commit push branch repositorio","Git registra alterações em commits. Antes de enviar, confira git status, revise o diff e rode os testes relevantes. Depois do commit, push envia a branch ao remoto. Não diga que algo foi publicado sem confirmar o deploy."],
["mit app inventor","app inventor aia blocos tinydb clock canvas telas","MIT App Inventor cria aplicativos com componentes visuais e blocos. TinyDB guarda dados no aparelho, Clock executa ações periódicas e Canvas/Sprite podem ser usados em jogos. Um arquivo AIA precisa manter a estrutura interna correta para importar."],
["subway pipi","subway pipi jogo endless runner pistas obstaculos tinydb","Subway Pipi é um jogo de corrida infinita com três pistas, obstáculos e telas de menu, jogo e Game Over. A lógica precisa impedir colisões enquanto o personagem estiver pulando ou deslizando e deve reiniciar corretamente os obstáculos."],
["cybershield","cybershield seguranca internet phishing lgpd","CyberShield é o projeto de segurança na internet. Seus temas centrais incluem a tríade confidencialidade, integridade e disponibilidade, prevenção contra phishing, privacidade, LGPD e um ciclo de governança, proteção, detecção e recuperação."],
["teste de software","teste javascript syntax mock integracao navegador","Um teste de sintaxe verifica se o JavaScript pode ser interpretado, mas não prova que a interface funciona. Testes com mocks verificam contratos isolados; o teste real no navegador ainda precisa conferir layout, eventos, permissões e integração com os serviços."],
["api e chave secreta","api endpoint backend chave api segredo frontend","Chaves secretas não devem ficar no JavaScript entregue ao navegador nem no repositório. Guarde-as em variáveis de ambiente do servidor e faça o navegador chamar um endpoint próprio que valida a entrada e limita o uso."],
["acessibilidade interface","acessibilidade aria label teclado foco botao","Uma interface acessível precisa de rótulos claros, foco visível, navegação por teclado, estados anunciados por leitores de tela e botões com ações compreensíveis. O indicador do microfone deve comunicar claramente se está ouvindo ou desligado."],
["treinamento verificavel","treinar treinamento aprender feedback ia modelo neural conhecimento","O Pestinha não recebe treinamento permanente de um GPT nem depende de API paga. Ele melhora de forma verificável em três camadas: o cérebro neural local ajusta pesos com feedback positivo ou negativo, os assuntos recebem pontuação persistente e a base de conhecimento pode ser revisada com fatos novos. Isso não autoriza inventar conhecimento nem dizer que houve treinamento externo."],
["casa 3d integrada","casa 3d casinha nossa casa jogo comodos iframe save salvar progresso localstorage nossotempo3d v1 pet quiz arcade","A casa 3D enviada fica dentro da aba “Nossa Casa”, no painel existente. O jogo abre em /games/nossa-casa-3d/index.html e usa a chave local nossotempo3d:v1 para seu save. Esse save não é migrado automaticamente do formato antigo; as áreas Pet, Quiz e Arcade permanecem separadas."],
["piano das estrelas","piano piano 3d webgl modos livre aprender ouvir desafios melodias teclas midi audio web audio","O Piano das Estrelas é uma página independente em piano-3d.html. A cena 3D é renderizada com WebGL próprio e o som usa Web Audio. Os modos Livre, Aprender, Ouvir e Desafios, o teclado tátil e os recursos MIDI fazem parte da mesma página."],
["afinador local do piano","afinador piano microfone privacidade audio local gravar enviar dispositivo","O afinador do Piano das Estrelas é opcional. O microfone só é solicitado quando a pessoa ativa o controle; enquanto ligado, o sinal é analisado localmente para estimar a nota. O afinador não grava nem envia áudio, e o controle permite desligá-lo." ]
];
const ITEM_PROJECT = Object.freeze({
  'arquitetura do nosso tempo':'nosso-tempo','pestinha e conversa direta':'pestinha','fala para texto':'pestinha','privacidade do microfone':'pestinha','respostas em texto':'pestinha','base de conhecimento local':'pestinha','aprendizado por feedback':'pestinha','memorias privadas':'pestinha','banco de dados local':'pestinha','backup do pestinha':'pestinha',
  'service worker':'nosso-tempo','pwa e instalacao':'nosso-tempo','modulos javascript':'nosso-tempo','eventos do navegador':'geral','seguranca javascript':'geral','player de musica do site':'nosso-tempo','adicionar musica':'nosso-tempo','tocar musica':'nosso-tempo','pesquisar musica':'nosso-tempo','youtube iframe api':'nosso-tempo',
  'neonplay zapgame':'neonplay','catalogo de jogos':'neonplay','jogos html5':'neonplay','vercel deploy':'nosso-tempo','git commit':'geral','mit app inventor':'mit-app-inventor','subway pipi':'subway-pipi','cybershield':'cybershield','teste de software':'geral','api e chave secreta':'geral','acessibilidade interface':'geral','treinamento verificavel':'pestinha'
});
const CURATED_METADATA = Object.freeze({
  'casa 3d integrada':{id:'casa-3d-integrada-v1',project:'casa-3d',status:'confirmed',source:'index.html; js/home.js; games/nossa-casa-3d/index.html; sw.js',reviewedAt:'2026-11-27'},
  'piano das estrelas':{id:'piano-das-estrelas-v1',project:'piano',status:'confirmed',source:'piano-3d.html; tests/piano3d-smoke.mjs',reviewedAt:'2026-11-27'},
  'afinador local do piano':{id:'afinador-local-piano-v1',project:'piano',status:'confirmed',source:'piano-3d.html; tests/piano3d-smoke.mjs',reviewedAt:'2026-11-27'}
});
function projectOf(item) { return CURATED_METADATA[item[0]]?.project || ITEM_PROJECT[item[0]] || null; }
function detectProject(q) {
  const mentionsHouse=/\b(casa 3d|casinha 3d|nossa casa|casa da aba|casa do jogo)\b/.test(q)||(/\b(casa|casinha)\b/.test(q)&&/\b(progresso|save|salv\w*|jogo|comodo|movel|iframe)\b/.test(q));
  const mentionsPiano=/\b(piano|afinador|midi)\b/.test(q);
  if(mentionsHouse&&mentionsPiano)return 'mixed-casa-piano';
  if(mentionsPiano)return 'piano';
  if(mentionsHouse)return 'casa-3d';
  if(/\b(neonplay|zapgame)\b/.test(q))return 'neonplay';
  if(/\b(mit app inventor|app inventor)\b/.test(q))return 'mit-app-inventor';
  if(/\b(subway pipi)\b/.test(q))return 'subway-pipi';
  if(/\b(cybershield)\b/.test(q))return 'cybershield';
  if(/\bpestinha\b/.test(q)||/\b(memoria pessoal|feedback local|rede neural)\b/.test(q))return 'pestinha';
  if(/\bnosso tempo\b/.test(q))return 'nosso-tempo';
  return null;
}
export function getProjectKnowledgeDiagnostics() {
  const curated=Object.entries(CURATED_METADATA),ids=curated.map(([,meta])=>meta.id);
  return {
    topics:ITEMS.length,
    unclassified:ITEMS.filter(item=>!projectOf(item)).map(item=>item[0]),
    invalidCuratedMetadata:curated.filter(([title,meta])=>!ITEMS.some(item=>item[0]===title)||!meta.id||!meta.project||!meta.status||!meta.source||!meta.reviewedAt).map(([title])=>title),
    duplicateIds:ids.filter((id,index)=>ids.indexOf(id)!==index)
  };
}
function norm(value) {
 return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
}
function tokens(value) {
 return norm(value).split(' ').filter(word => word.length > 2 && !['para','com','que','uma','dos','das','por','como','isso','esse','essa','site'].includes(word));
}
let lastEntry = null;
let lastEntryProject = null;
export function answerFromProjectKnowledge(question) {
 const q = norm(question);
 if (!q) return null;
 const targetProject = detectProject(q);
 if (targetProject && targetProject !== 'mixed-casa-piano' && lastEntryProject && targetProject !== lastEntryProject) { lastEntry = null; lastEntryProject = null; }
 if (targetProject === 'mixed-casa-piano') {
  lastEntry = null; lastEntryProject = null;
  if (/\b(progresso|save|salv\w*|localstorage)\b/.test(q)) return 'Não: são áreas separadas. A Casa 3D usa o save local nossotempo3d:v1; o Piano guarda o progresso dos desafios em piano3d:challenges. Um não fica dentro do save do outro.';
  return 'Você mencionou a Casa 3D e o Piano, que são projetos separados. Quer saber de qual deles ou comparar um aspecto específico?';
 }
 if (!targetProject && /\b(progresso|save|salv\w*)\b/.test(q)) return 'Você quer dizer o save da Casa 3D (nossotempo3d:v1) ou o progresso dos desafios do Piano (piano3d:challenges)? São chaves locais separadas.';
 // Prioridade semântica explícita: explicar "adicionar" nunca deve confundir-se
 // com "tocar". Esta função apenas responde; não executa comandos no player.
 const asksAdd = /\b(adicion\w*|inclu\w*|coloc\w*)\b/.test(q) && /\b(musica|faixa|playlist)\b/.test(q);
 const asksPlay = /\b(toc\w*|reproduz\w*)\b/.test(q) && /\b(musica|faixa|playlist)\b/.test(q);
 const asksDifference = /\b(diferenca|diferente|compar\w*)\b/.test(q);
  if (/\b(proteg\w*|segur\w*|guardar|protecao)\b/.test(q) && /\b(chave|api|segredo|credencial)\b/.test(q)) {
    return ITEMS.find(item => item[0] === 'api e chave secreta')[2];
  }
 if (asksAdd && asksPlay && asksDifference) {
  return '“Adicionar” coloca a faixa na playlist sem iniciar a reprodução. “Tocar” reproduz a música sem adicioná-la à playlist. “Adicionar e tocar” faz as duas coisas. São ações diferentes, e uma pergunta sobre elas não executa nenhuma ação no player.';
 }
 if (asksAdd && /\b(como|sem tocar|so|apenas|significa|quer dizer)\b/.test(q)) {
  return ITEMS.find(item => item[0] === 'adicionar musica')[2];
 }
 if (asksPlay && /\b(como|significa|quer dizer|o que acontece|quando eu digo|qual comando)\b/.test(q)) {
  return ITEMS.find(item => item[0] === 'tocar musica')[2];
 }
 if (/\b(exemplo|explica melhor|mais detalhes|aprofund|nao entendi|resumo|resume)\b/.test(q) && lastEntry) {
  if (/\b(exemplo)\b/.test(q)) return `Um exemplo: ${lastEntry[0]} aparece quando vocês estão trabalhando nessa parte do site. ${lastEntry[2]}`;
  if (/\b(resumo|resume)\b/.test(q)) return `${lastEntry[0]}: ${lastEntry[2].split('.').slice(0,2).join('.') }.`;
  return `Vamos por partes. ${lastEntry[2]}`;
 }
 const queryTokens = new Set(tokens(q));
 let best = null;
 const candidates = targetProject ? ITEMS.filter(item => projectOf(item) === targetProject) : ITEMS;
 for (const item of candidates) {
  const hay = new Set(tokens(item[0] + ' ' + item[1]));
  let overlap = 0;
  for (const token of queryTokens) if (hay.has(token)) overlap++;
  const title = norm(item[0]);
  const titleHit = q.includes(title) || (title.split(' ').length > 1 && title.split(' ').every(part => q.includes(part)));
  const score = overlap / Math.max(2, Math.min(queryTokens.size, 5)) + (titleHit ? 0.9 : 0);
  if (!best || score > best.score) best = { item, score, overlap, titleHit };
 }
 if (!best || (!best.titleHit && best.overlap < 2) || best.score < 0.38) {
  if (targetProject) { lastEntry = null; lastEntryProject = null; }
  return null;
 }
 lastEntry = best.item;
 lastEntryProject = projectOf(best.item);
 return best.item[2];
}
export function getProjectKnowledgeStats() { return { topics: ITEMS.length }; }
