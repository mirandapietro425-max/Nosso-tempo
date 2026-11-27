# Piano das Estrelas 3D

Minijogo solo do **Nosso Arcade**, aberto pelo cartão “Piano das Estrelas 3D” em `piano-3d.html`. Os demais jogos, incluindo Tiles Piano, continuam disponíveis.

## Recursos

- Piano renderizado em WebGL nativo, sem Three.js ou dependência essencial de CDN.
- Cena 3D ampliada e teclado tátil separado com teclas grandes, suporte a multitoque e troca de oitava.
- Controles por toque, mouse e teclado físico (`A W S E D F T G Y H U J K`; `Z`/`X` muda a oitava).
- Áudio sintetizado localmente com Web Audio API, ativado depois da primeira interação.
- Modos Livre, Aprender, Ouvir e Desafios. Quatro desafios progressivos foram cocriados com apoio do GPT-6 Luna e o progresso fica salvo localmente no navegador.
- Três melodias originais e trechos iniciais de “Für Elise” e “Ode à Alegria”, obras de Beethoven em domínio público, para escutar e praticar.
- Player oficial do YouTube carregado sob demanda, com “You Stole The Show” da Sienna Spiro e acesso aos links oficiais de “MAYBE.” e “Die On This Hill”. O jogo não reproduz nem transcreve as melodias protegidas da artista.
- Afinador opcional: só pede microfone após toque explícito, estima a nota localmente e encerra as faixas ao desligar; nenhum áudio é gravado, enviado ou armazenado.
- Importação local de arquivos `.mid`/`.midi`, gravação e exportação MIDI; arquivos importados não são enviados.
- Arte PNG transparente dos dois gatinhos em `assets/piano-kittens.png`.
- Página, arte e folha de estilos tátil incluídas no pré-cache do Service Worker (`v93`).

## Uso e compatibilidade

Abra o Nosso Tempo, entre em **Nosso Arcade** e selecione o cartão do Piano. Em um celular, toque nas teclas grandes abaixo da cena; mantenha uma tecla pressionada ou use vários dedos para acordes. Em **Aprender**, selecione uma melodia e toque as notas indicadas. Em **Desafios**, escolha um exercício, toque **Começar desafio** e siga as teclas douradas.

O navegador precisa oferecer WebGL e Web Audio. O som começa somente depois de uma interação, conforme a política de autoplay do navegador. Para validar localmente, sirva a pasta do projeto por HTTP e abra `/index.html`; a página usa caminhos relativos e pode ser aberta diretamente em `/piano-3d.html`.

As gravações de estudo são sintetizadas no próprio navegador. O player usa somente incorporação oficial do YouTube e só carrega depois de uma ação da pessoa; a reprodução depende de conexão à internet. O afinador usa Web Audio localmente e funciona apenas enquanto o botão estiver ligado.
