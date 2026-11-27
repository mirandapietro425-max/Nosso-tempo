# Piano das Estrelas 3D

Minijogo solo adicionado ao **Nosso Arcade**. O cartão “Piano das Estrelas 3D” abre `piano-3d.html`; os jogos existentes, incluindo Tiles Piano, permanecem disponíveis.

## Recursos

- Piano renderizado em WebGL nativo, sem Three.js ou dependência essencial de CDN.
- Teclas interativas por toque e mouse, rotação por arraste e zoom pela roda do mouse.
- Teclado físico (`A W S E D F T G Y H U J K`) e mudança de oitava com `Z`/`X`.
- Áudio sintetizado localmente com Web Audio API, ativado após a primeira interação.
- Modos Livre, Aprender e Ouvir, com três melodias originais.
- Importação local de arquivos `.mid`/`.midi`, gravação e exportação MIDI; arquivos importados não são enviados.
- Arte PNG transparente dos dois gatinhos em `assets/piano-kittens.png`.
- Página e arte incluídas no pré-cache do Service Worker (cache `v87`).

## Uso e compatibilidade

Abra o Nosso Tempo, entre em **Nosso Arcade** e selecione o cartão do Piano. O navegador precisa oferecer WebGL e Web Audio. O som começa somente depois de uma interação, por política de autoplay. Para validar localmente, sirva a pasta do projeto por HTTP e abra `/index.html`; a página usa caminhos relativos e pode ser aberta em `/piano-3d.html`.

As melodias incluídas são originais. O link para Sienna Spiro é apenas uma referência externa opcional e não é requisito para o funcionamento.
