# Pestinha — voz, música e conhecimento de projetos

O Pestinha conversa localmente no navegador, usando a base de conhecimento, o cérebro LIF, o contexto curto, o caderno de memórias e o player que já existe no Nosso-tempo. A base combina conteúdo curado do projeto com 69 tópicos em português gerados com GPT no Sandbox e incorporados como JavaScript estático. O site publicado não depende de chave, crédito ou serviço de IA pago para responder.

## Chamada por palavra-chave

1. Ao entrar no site, o Pestinha fica pronto para conversar por texto. No primeiro toque/clique explícito em qualquer parte da página, o navegador pode pedir permissão para o microfone e, se for concedida, a escuta é ativada automaticamente. Também é possível abrir o painel e escolher **Chamar “Pestinha”**.
2. Com o modo ativo, diga “Pestinha” antes do pedido: “Pestinha, toca Photograph”, “Pestinha, adiciona Photograph” ou “Pestinha, pesquisa Photograph”.
3. Depois da primeira chamada, a conversa permanece ativa por até 45 segundos após cada fala. Durante esse período, pode continuar falando normalmente, sem repetir “Pestinha” a cada frase. Após 45 segundos de silêncio, o Pestinha volta a aguardar a palavra-chave.
4. Enquanto o Pestinha fala, o reconhecimento continua preparado para uma interrupção: trechos semelhantes à resposta dele são filtrados como possível eco durante a fala e por até 4,5 segundos depois dela; uma nova fala da pessoa pode interromper o áudio atual.
5. Diga “agora não”, “fica quietinho/quietinha”, “Pestinha, para”, “para, Pestinha”, “pode parar”, “desliga o microfone”, “chega” ou “silêncio” para desligar o microfone. “Para a música” continua sendo uma frase da conversa, não um comando para desligar a escuta.
6. O modo também é desligado quando a aba fica oculta ou a página é fechada.

**Limitação do navegador:** o microfone não pode ser habilitado silenciosamente por um site. É necessário um gesto explícito e consentimento do usuário pelo navegador. O primeiro gesto oferece essa ativação sem obrigar a pessoa a procurar um controle escondido no painel; negar a permissão não bloqueia a conversa digitada. Enquanto a chamada estiver ligada, a API de reconhecimento pode processar áudio por um serviço do navegador; não é garantido que o processamento seja local ou offline. A palavra-chave inicia uma sessão conversacional; os turnos seguintes são aceitos sem repetir o nome por até 45 segundos após a última fala. O reconhecimento contínuo também varia entre navegadores e pode ser interrompido pelo sistema. A opção de digitar continua disponível.

## Comandos musicais

- “Adiciona X” — adiciona à playlist e não toca.
- “Toca X” — reproduz sem adicionar à playlist.
- “Adiciona e toca X” — realiza as duas ações.
- “Pesquisa X” — mostra resultados e links; não toca.
- “Pausa”, “continua”, “próxima” e “anterior” controlam o player.
- “Remove X” pede confirmação antes de alterar a playlist.

Perguntas explicativas, por exemplo “Como adicionar música?” e “Qual a diferença entre adicionar e tocar?”, não são comandos e não devem executar ações. Quando houver opções parecidas, o Pestinha pede que a pessoa escolha pelo número.

As faixas adicionadas e removidas pelo usuário ficam salvas no armazenamento local do navegador. Isso não sincroniza automaticamente com outros aparelhos. As playlists sazonais/eventuais existentes não são gravadas como alterações permanentes do usuário.

## Busca real no YouTube

O endpoint `/api/pestinha/music-search` usa a YouTube Data API v3. Configure `YOUTUBE_API_KEY` nas variáveis de ambiente do serviço que hospeda as funções server-side (por exemplo, Vercel). **Nunca coloque essa chave no JavaScript do navegador nem a grave neste repositório.** Sem essa variável, o Pestinha informa a limitação e fornece um link para abrir a busca pública do YouTube; não inventa resultados.

A chave precisa ter acesso à YouTube Data API v3 e o projeto Google Cloud pode aplicar cotas. A disponibilidade dos vídeos e as restrições do YouTube continuam valendo.

## Proteções dos endpoints

A busca musical server-side exige uma requisição POST com `Origin` correspondente ao host servido pelo site, corpo limitado, frequência limitada e timeout. A conversa não cria requisição externa: respostas antigas são invalidadas localmente quando uma nova pergunta chega.

## Conversa local e memórias

A conversa usa somente JavaScript local. O Pestinha combina respostas sociais, contexto curto da conversa, conhecimento geral, conhecimento do projeto e busca automática nas memórias relevantes. O recuperador aceita variações naturais, sinônimos, perguntas sem acento e continuações como “me dá um exemplo”, “explica mais simples”, “resume” e “aprofund[a]”. Quando não sabe, admite a limitação em vez de inventar. As memórias ficam no armazenamento local do navegador e podem ser consultadas normalmente; não são enviadas para uma IA externa.

## Validação

Rode os testes em ambiente Node com suporte a módulos ES:

```sh
node --experimental-default-type=module tests.mjs
node --experimental-default-type=module tests/pestinha-music-intents.mjs
node --experimental-default-type=module tests/pestinha-project-knowledge-smoke.mjs
node tests/companion-neural-smoke.mjs
node tests/memory-search-smoke.mjs
node tests/ui-wiring-smoke.mjs
node tests/pestinha-safety-smoke.mjs
node tests/pestinha-knowledge-smoke.mjs
```

Os testes automatizados não substituem testes reais em Chrome/Edge/Firefox, HTTPS, celular, permissões do microfone, YouTube IFrame API, cotas da API e comportamento das bolhas. A busca do YouTube só pode ser validada end-to-end depois de configurar a chave no ambiente de teste.

## Conversa natural em vários turnos

A conversa local acompanha até os últimos turnos salvos quando a pessoa ativa a opção de lembrar conversa. Perguntas como “por quê?”, “explica melhor”, confirmações, correções e mudanças de assunto recebem tratamento conversacional; assuntos pessoais consultam o caderno local. A voz continua opt-in e a música continua podendo usar a busca oficial do YouTube.

O aprendizado continua verificável: feedback ajusta pesos e pontuações locais persistentes, e a base de conhecimento pode ser revisada com fatos novos. Isso melhora o comportamento local, mas não é treinamento permanente de um modelo GPT.
