import assert from 'node:assert/strict';
import { classifyMusicIntent, parseMusicChoice } from '../js/companion/music-intents.js';

assert.equal(classifyMusicIntent('Como adicionar música Photograph?'), null);
assert.equal(classifyMusicIntent('Qual a diferença entre adicionar e tocar música?'), null);
assert.equal(classifyMusicIntent('Uma pergunta sobre adicionar música'), null);
assert.equal(classifyMusicIntent('Adicionar música sem tocar é diferente de tocar música?'), null);
assert.equal(classifyMusicIntent('Adicionar Photograph?'), null);
assert.deepEqual(classifyMusicIntent('adiciona Photograph'), { type: 'track', actions: ['add'], query: 'Photograph' });
assert.deepEqual(classifyMusicIntent('toca Photograph'), { type: 'track', actions: ['play'], query: 'Photograph' });
assert.deepEqual(classifyMusicIntent('adiciona e toca Photograph'), { type: 'track', actions: ['add', 'play'], query: 'Photograph' });
assert.deepEqual(classifyMusicIntent('Pestinha, pausa a música'), { type: 'pause' });
assert.deepEqual(classifyMusicIntent('pesquisa Photograph'), { type: 'search', query: 'Photograph' });
assert.equal(parseMusicChoice('a segunda opção', 5), 1);
assert.equal(parseMusicChoice('última', 3), 2);
assert.equal(parseMusicChoice('quarta', 3), null);
console.log('OK — intents musicais: perguntas não executam, adicionar/tocar separados e escolhas numeradas.');
