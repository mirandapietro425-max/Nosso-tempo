import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const gameCatalog = read('../js/games.js');
const serviceWorker = read('../sw.js');
const page = read('../piano-3d.html');
const pngPath = new URL('../assets/piano-kittens.png', import.meta.url);

assert.match(gameCatalog, /id:'piano3d'[\s\S]*?title:'Piano das Estrelas 3D'[\s\S]*?solo:true[\s\S]*?href:'\.\/piano-3d\.html'/, 'O catálogo deve listar o piano como jogo solo com destino próprio.');
assert.match(gameCatalog, /g\.solo && g\.href[\s\S]*?window\.location\.href = g\.href/, 'O cartão solo deve abrir a página do jogo sem o seletor de dupla.');
assert.match(gameCatalog, /id:'tiles'[\s\S]*?fn: openTiles/, 'Tiles Piano deve continuar no catálogo.');
assert.match(gameCatalog, /const modeLabel = g\.solo \? '🎹 Solo' : '👥 Dupla'/, 'Os selos solo/dupla devem refletir o tipo do jogo.');

assert.match(page, /id="scene"/, 'A página deve manter o canvas WebGL.');
assert.match(page, /getContext\('webgl'/, 'A cena deve renderizar com WebGL.');
assert.match(page, /AudioContext|webkitAudioContext/, 'O áudio deve usar Web Audio local.');
assert.match(page, /data-mode="free"[\s\S]*data-mode="learn"[\s\S]*data-mode="listen"/, 'Os modos Livre, Aprender e Ouvir devem permanecer acessíveis.');
assert.match(page, /accept="\.mid,\.midi,audio\/midi"/, 'A importação MIDI deve permanecer local.');
assert.match(page, /assets\/piano-kittens\.png/, 'A arte dos gatinhos deve aparecer na interface do jogo.');
assert.doesNotMatch(page, /<script\b[^>]*\bsrc\s*=\s*["'][^"']*https?:/i, 'A página não deve depender de script externo.');

const inlineScripts = [...page.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
assert.equal(inlineScripts.length, 1, 'A página deve ter um script inline único.');
new vm.Script(inlineScripts[0][1], { filename: 'piano-3d.inline.js' });

assert.match(serviceWorker, /CACHE_VERSION\s*=\s*'v87'/, 'O cache precisa ser invalidado na versão nova.');
assert.match(serviceWorker, /'\/piano-3d\.html'/, 'A página do piano deve entrar no pré-cache offline.');
assert.match(serviceWorker, /'\/assets\/piano-kittens\.png'/, 'A arte deve entrar no pré-cache offline.');
assert(existsSync(pngPath), 'O PNG original deve existir no projeto.');
const png = readFileSync(pngPath);
assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'A arte precisa ser um PNG válido.');
assert.equal(png.readUInt32BE(16), 2048, 'A largura da arte deve ser 2048 px.');
assert.equal(png.readUInt32BE(20), 2048, 'A altura da arte deve ser 2048 px.');
assert.equal(png[25], 6, 'A arte deve conservar o canal RGBA.');

console.log('OK — cartão solo, navegação, página WebGL, áudio, modos, MIDI, arte RGBA e pré-cache offline.');
