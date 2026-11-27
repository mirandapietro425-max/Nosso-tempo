# Plano — Nosso Tempo

## Objetivo
Preservar as experiências do casal e a navegação atual, integrar a casa 3D enviada apenas na aba Nossa Casa, refinar o piano WebGL com foco em acessibilidade e atualizar o conhecimento local revisável da Pestinha.

## Implementação
- Tornar a entrada silenciosa: a carta de boas-vindas aparece somente uma vez por dispositivo e o recadinho diário deixa de abrir automaticamente; ambos continuam acessíveis por interação.
- Reduzir interrupções: mensagens românticas flutuantes deixam de surgir sozinhas e partículas decorativas ficam mais leves, especialmente no celular e com movimento reduzido.
- Simplificar a navegação inicial: manter cinco atalhos primários visíveis e agrupar os demais em “Explorar todas as áreas”.
- Melhorar responsividade: ajustar hero, grade de atalhos, espaçamento, alvos de toque e largura de conteúdo em telas pequenas e grandes.
- Preservar as seções e dados existentes; as mudanças serão apenas de apresentação e comportamento de entrada.
- Substituir somente o conteúdo de `#home-rpg-wrap` pelo iframe do jogo fornecido em `/games/nossa-casa-3d/index.html`; manter o contêiner externo, as abas Pet/Quiz e o Arcade intactos.
- Proteger o iframe de rerenderizações do `renderRPG()`, acrescentar o CSS isolado do embed e pré-cachear o novo HTML com uma versão nova do Service Worker.
- Manter o save novo na chave `nossotempo3d:v1`; não apagar nem migrar automaticamente dados antigos da casa.
- Refinar a apresentação do piano WebGL sem alterar mecânica, controles, áudio local, gravação/importação MIDI ou privacidade do afinador; reduzir brilho decorativo, clarificar contraste/estados e manter alvos táteis, foco visível e movimento reduzido, sem dependências ou pós-processamento.
- Acrescentar à Pestinha fatos revisados da casa integrada e do piano com ID, projeto, status, fonte e data; filtrar pelo projeto antes do ranking, pedir distinção para saves ambíguos e testar abstenção; feedback continua alterando associações, não fatos nem pesos de GPT.

## Estrutura relevante
- `index.html`: composição da entrada, hero e navegação.
- `js/ui.js`: recadinho diário, contador e efeitos de UI.
- `js/app.js`: carta de boas-vindas e orquestração dos módulos.
- `js/experience.js`: partículas e mensagens românticas automáticas.
- `css/main.css`, `css/mobile.css`, `css/redesign.css`: layout e responsividade.
- `index.html`, `js/home.js`, `css/home.css`: painel da aba Nossa Casa e incorporação isolada do jogo.
- `games/nossa-casa-3d/index.html`, `sw.js`: jogo fornecido e funcionamento offline.
- `piano-3d.html`, `css/piano-3d-touch.css`: cena WebGL, acessibilidade e teclado tátil.
- `js/companion/project-knowledge.js` e `tests/`: conhecimento local da Pestinha e verificações smoke.
