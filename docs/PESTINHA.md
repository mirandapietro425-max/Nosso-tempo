# Pestinha — voz, música e conhecimento de projetos

Esta alteração conecta o Pestinha à base local de conhecimento e ao player que já existe no Nosso-tempo. Não substitui a interface do mascote, o cérebro LIF, o caderno de memórias nem a opção de IA natural do backend.

## Chamada por palavra-chave

1. Abra o painel do Pestinha e escolha **Chamar “Pestinha”**. O navegador pedirá permissão para o microfone.
2. Com o modo ativo, diga “Pestinha” antes do pedido: “Pestinha, toca Photograph”, “Pestinha, adiciona Photograph” ou “Pestinha, pesquisa Photograph”.
3. Diga “agora não”, “fica quietinho”, “pode parar” ou “para, Pestinha” para desligar o microfone.
4. O modo também é desligado quando a aba fica oculta ou a página é fechada.

**Limitação do navegador:** o microfone não pode ser habilitado silenciosamente por um site. É necessário um gesto explícito e consentimento do usuário pelo navegador. Por isso, a primeira ativação exige o botão no painel. Enquanto a chamada estiver ligada, a API de reconhecimento pode processar áudio por um serviço do navegador; não é garantido que o processamento seja local ou offline. O reconhecimento contínuo também varia entre navegadores e pode ser interrompido pelo sistema. A opção de digitar continua disponível.

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

## IA natural e memórias

O endpoint de conversa existente continua usando `OPENAI_API_KEY` server-side. O modo de IA natural continua sendo opcional e inicia desligado, conforme os controles existentes. A autorização para usar IA externa e a autorização para enviar lembranças continuam separadas. A base de projetos é uma coleção local pesquisada por termos; ela não é um modelo de linguagem e não aprende automaticamente fatos novos.

## Validação

Rode os testes em ambiente Node com suporte a módulos ES:

```sh
node --experimental-default-type=module tests.mjs
node --experimental-default-type=module tests/pestinha-music-intents.mjs
node --experimental-default-type=module tests/pestinha-project-knowledge-smoke.mjs
node tests/companion-neural-smoke.mjs
node tests/memory-search-smoke.mjs
node tests/ui-wiring-smoke.mjs
```

Os testes automatizados não substituem testes reais em Chrome/Edge/Firefox, HTTPS, celular, permissões do microfone, YouTube IFrame API, cotas da API e comportamento das bolhas. A busca do YouTube só pode ser validada end-to-end depois de configurar a chave no ambiente de teste.
