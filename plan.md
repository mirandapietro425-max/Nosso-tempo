# Plano — Nosso Tempo

## Objetivo
Reduzir a sensação de spam na entrada e melhorar a leitura em celular e computador sem remover as experiências do casal.

## Implementação
- Tornar a entrada silenciosa: a carta de boas-vindas aparece somente uma vez por dispositivo e o recadinho diário deixa de abrir automaticamente; ambos continuam acessíveis por interação.
- Reduzir interrupções: mensagens românticas flutuantes deixam de surgir sozinhas e partículas decorativas ficam mais leves, especialmente no celular e com movimento reduzido.
- Simplificar a navegação inicial: manter cinco atalhos primários visíveis e agrupar os demais em “Explorar todas as áreas”.
- Melhorar responsividade: ajustar hero, grade de atalhos, espaçamento, alvos de toque e largura de conteúdo em telas pequenas e grandes.
- Preservar as seções e dados existentes; as mudanças serão apenas de apresentação e comportamento de entrada.

## Estrutura relevante
- `index.html`: composição da entrada, hero e navegação.
- `js/ui.js`: recadinho diário, contador e efeitos de UI.
- `js/app.js`: carta de boas-vindas e orquestração dos módulos.
- `js/experience.js`: partículas e mensagens românticas automáticas.
- `css/main.css`, `css/mobile.css`, `css/redesign.css`: layout e responsividade.
