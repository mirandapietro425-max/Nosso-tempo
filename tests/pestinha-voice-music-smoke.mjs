import assert from 'node:assert/strict';
import { classifyWakeUtterance } from '../js/companion/voice-session.js';
import { classifyMusicIntent } from '../js/companion/music-intents.js';
import { readFileSync } from 'node:fs';

assert.deepEqual(classifyWakeUtterance('Pestinha'), { type: 'wake', text: '' });
assert.deepEqual(classifyWakeUtterance('Pestinha, pode tocar Photograph'), { type: 'wake', text: 'pode tocar Photograph' });
assert.deepEqual(classifyWakeUtterance('continua a conversa', true), { type: 'continue', text: 'continua a conversa' });
assert.equal(classifyWakeUtterance('continua a conversa', false).type, 'ignore');
assert.equal(classifyWakeUtterance('Pestinha, fica quietinho').type, 'stop');
assert.equal(classifyWakeUtterance('agora não', true).type, 'stop');

assert.deepEqual(classifyMusicIntent('adiciona Photograph'), { type: 'track', actions: ['add'], query: 'Photograph' });
assert.deepEqual(classifyMusicIntent('toca Photograph'), { type: 'track', actions: ['play'], query: 'Photograph' });
assert.deepEqual(classifyMusicIntent('adiciona e toca Photograph'), { type: 'track', actions: ['add', 'play'], query: 'Photograph' });
assert.deepEqual(classifyMusicIntent('pesquisa Photograph'), { type: 'search', query: 'Photograph' });
assert.deepEqual(classifyMusicIntent('pausa a música'), { type: 'pause' });
assert.deepEqual(classifyMusicIntent('continua a música'), { type: 'resume' });
assert.deepEqual(classifyMusicIntent('próxima música'), { type: 'next' });
assert.deepEqual(classifyMusicIntent('volta a música'), { type: 'previous' });
assert.deepEqual(classifyMusicIntent('remove Photograph'), { type: 'remove', query: 'Photograph' });
assert.equal(classifyMusicIntent('Como adiciono Photograph?'), null);
assert.equal(classifyMusicIntent('Pestinha, o que significa adicionar uma música?'), null);
assert.equal(classifyMusicIntent('Quero saber como tocar música'), null);

const companion = readFileSync(new URL('../js/companion/companion.js', import.meta.url), 'utf8');
const music = readFileSync(new URL('../js/music.js', import.meta.url), 'utf8');
assert.match(companion, /speakResponses: true/);
assert.match(companion, /loaded\.speakResponses === undefined \? true/);
assert.match(companion, /if \(isSpeaking\)[\s\S]*speechSynthesis\?\.cancel/);
assert.match(companion, /handleMusicCommand\(question\)/);
assert.match(companion, /aiMemoryConsent/);
assert.match(music, /export function addTrackToPlaylist/);
assert.match(music, /export function playExternalTrack/);
assert.match(music, /export function pauseMusic/);
assert.match(music, /export function resumeMusic/);
assert.match(music, /export function removeTrackFromPlaylist/);
console.log('OK — voz contínua, silêncio, perguntas sem execução e comandos musicais verificados.');
