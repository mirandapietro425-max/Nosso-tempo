import assert from 'node:assert/strict';
import { classifyWakeUtterance, isLikelySpeechEcho, SPEECH_ECHO_GRACE_MS } from '../js/companion/voice-session.js';
import { classifyMusicIntent } from '../js/companion/music-intents.js';
import { readFileSync } from 'node:fs';

assert.deepEqual(classifyWakeUtterance('Pestinha'), { type: 'wake', text: '' });
assert.deepEqual(classifyWakeUtterance('Pestinha, pode tocar Photograph'), { type: 'wake', text: 'pode tocar Photograph' });
assert.deepEqual(classifyWakeUtterance('continua a conversa', true), { type: 'continue', text: 'continua a conversa' });
assert.equal(classifyWakeUtterance('continua a conversa', false).type, 'ignore');
assert.equal(classifyWakeUtterance('Pestinha, fica quietinho').type, 'stop');
assert.equal(classifyWakeUtterance('agora não', true).type, 'stop');
assert.equal(classifyWakeUtterance('Pestinha, para', true).type, 'stop');
assert.equal(classifyWakeUtterance('Para, Pestinha', true).type, 'stop');
assert.equal(classifyWakeUtterance('Pestinha, pode parar', true).type, 'stop');
assert.equal(classifyWakeUtterance('fica quietinha', true).type, 'stop');
assert.equal(classifyWakeUtterance('desliga o microfone', true).type, 'stop');
assert.equal(classifyWakeUtterance('para a música', true).type, 'continue', 'parar a música não deve desligar a conversa por voz');
const spoken = 'Essa é uma resposta completa do Pestinha com detalhes importantes sobre o projeto e a explicação.';
assert.equal(isLikelySpeechEcho('detalhes importantes sobre o projeto e a explicação', spoken, 1000, false, 4000), true, 'eco entregue logo após onend deve ser filtrado');
assert.equal(isLikelySpeechEcho('detalhes importantes sobre o projeto e a explicação', spoken, 1000, false, 6000), false, 'fala antiga não pode bloquear a conversa indefinidamente');
assert.equal(isLikelySpeechEcho('qual é o próximo assunto que podemos conversar', spoken, 1000, false, 4000), false, 'fala diferente não pode ser descartada');
assert.equal(isLikelySpeechEcho('resposta completa do Pestinha com detalhes', spoken, 0, true, 9000), true, 'eco durante a síntese deve ser filtrado');
assert.equal(SPEECH_ECHO_GRACE_MS, 4500);


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
assert.equal(classifyMusicIntent('Pestinha, me diz como adicionar Photograph'), null);
assert.equal(classifyMusicIntent('Pestinha, explica como toca Photograph'), null);
assert.equal(classifyMusicIntent('Pestinha, me conta como pesquisar Photograph'), null);
assert.equal(classifyMusicIntent('Pestinha, me ajuda a adicionar Photograph'), null);
assert.equal(classifyMusicIntent('Pestinha, pode tocar Photograph?'), null);


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
