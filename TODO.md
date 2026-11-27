# TODO — Nosso Tempo

## Entrada sem excesso visual
- [x] Ao abrir o site, não exibir popup diário automaticamente depois da carta de boas-vindas.
- [x] Exibir a carta de boas-vindas no máximo uma vez por dispositivo e manter o fechamento por toque.
- [x] Não iniciar música ou mensagem romântica sem uma ação explícita da pessoa.

## Casa 3D, piano e Pestinha — etapa atual
- [x] Colocar a casa 3D enviada no lugar do conteúdo antigo da aba “Nossa Casa”, dentro do painel existente, preservando a estrutura externa, as abas Pet e Quiz, o Arcade e os dados antigos; manter o save do jogo novo separado na chave `nossotempo3d:v1`. Smoke test confirma iframe, rerender, abas e chave própria.
- [x] Perguntar ao Agent do Replit como deixar mais bonito o piano WebGL e aplicar refinamentos visuais de baixo risco sem remover seus controles, modos, áudio ou recursos existentes; preservar foco visível, movimento reduzido e a análise local do afinador. Aplicados contraste/estados CSS, alvos táteis e brilho estelar reduzido sem pós-processamento.
- [x] Consultar Claude e GPT pelo My Browser sobre melhorias revisáveis da Pestinha e do site, sem misturar o projeto NeonPlay com Nosso-tempo. Consultas consultivas feitas em chats separados; o Replit também foi consultado no chat próprio do piano.
- [x] Melhorar a Pestinha com conhecimento local curado e testado, sem afirmar treinamento permanente dos pesos de um modelo GPT; feedback continua sendo mecanismo separado. Novos fatos têm projeto, status, fonte e data; testes cobrem separação, abstenção e feedback.
- [x] Se o Replit solicitar uma arte específica para a melhoria, criar essa arte e integrá-la somente ao Nosso-tempo. O Replit não solicitou arte nesta rodada.
- [x] Usar o GitHub conectado para concluir o código; confirmar o novo deploy Vercel antes de dizer que a produção foi atualizada. Evidência: `7d37a3f` em `origin/main`; deployment `dpl_J51x8Hm7iP3vCKoZFKTt8CnsKapE` ficou `READY` em produção no SHA `7d37a3fc2ece7a880473acd164c28052cf12cf27`. O alias público [nosso-tempo-one.vercel.app](https://nosso-tempo-one.vercel.app) passou por HTTP 200 em `/`, `/games/nossa-casa-3d/`, `/piano-3d.html` e `/sw.js`; marcadores da integração da casa e do cache `v95` foram conferidos.

## Navegação clara
- [x] Manter apenas os atalhos mais importantes visíveis no primeiro viewport.
- [x] Disponibilizar as demais áreas em um agrupador acessível e responsivo.

## Responsividade e acabamento
- [x] Melhorar leitura, espaçamento e alvos de toque em celular.
- [x] Preservar uma composição equilibrada em desktop e respeitar movimento reduzido.
- [x] Rodar os testes existentes e verificar o build/servidor estático antes do commit.
