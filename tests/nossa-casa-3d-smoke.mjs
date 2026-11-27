import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const index = read('../index.html');
const home = read('../js/home.js');
const homeCss = read('../css/home.css');
const serviceWorker = read('../sw.js');
const gamePath = new URL('../games/nossa-casa-3d/index.html', import.meta.url);
const game = readFileSync(gamePath, 'utf8');

const panelStart = index.indexOf('<div class="home-panel active" id="home-panel-rpg">');
const petStart = index.indexOf('<!-- PANEL: PET -->', panelStart);
assert.ok(panelStart >= 0 && petStart > panelStart, 'O painel Nossa Casa deve permanecer antes do painel Pet.');
const housePanel = index.slice(panelStart, petStart);
assert.match(housePanel, /id="home-rpg-wrap"[\s\S]*?class="nct3d-embed"[\s\S]*?<iframe/);
assert.match(housePanel, /src="\/games\/nossa-casa-3d\/index\.html\?v=1"/);
assert.match(housePanel, /class="nct3d-embed__frame"[\s\S]*?title="Nossa Casa 3D/);
assert.match(index, /id="home-panel-pet"/);
assert.match(index, /id="home-panel-quiz"/);
assert.match(index, /id="sec-jogos"[\s\S]*?id="games-grid"/);

assert.match(home, /const embeddedHouseFrame=wrap\.querySelector\("\.nct3d-embed__frame"\);\s*if\(embeddedHouseFrame\)return;/,
  'renderRPG deve preservar o iframe contra rerenderizações do jogo antigo.');
assert.match(homeCss, /\.nct3d-embed__frame\s*\{[^}]*width:\s*100%[^}]*height:\s*clamp\(/);
assert.match(homeCss, /@media\s*\(max-width:\s*640px\)[\s\S]*?\.nct3d-embed__frame/);
assert.match(serviceWorker, /CACHE_VERSION\s*=\s*'v95'/);
assert.match(serviceWorker, /'\/games\/nossa-casa-3d\/index\.html'/);
assert.match(game, /nossotempo3d:v1/, 'O save da casa deve usar a chave local própria.');
assert.doesNotMatch(home, /nossotempo3d:v1/, 'O RPG antigo não deve ser misturado com a chave do save novo.');
assert(existsSync(gamePath), 'A página autocontida da Casa 3D deve estar no projeto.');

console.log('OK — Casa 3D isolada na aba Nossa Casa, rerender protegido, Pet/Quiz/Arcade preservados e save próprio pré-cacheado.');
