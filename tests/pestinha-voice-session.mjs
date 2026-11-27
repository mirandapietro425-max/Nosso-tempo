import assert from 'node:assert/strict';
import { classifyWakeUtterance, VOICE_CONVERSATION_IDLE_MS } from '../js/companion/voice-session.js';

assert.deepEqual(classifyWakeUtterance('Pestinha, oi', false), { type: 'wake', text: 'oi' });
assert.deepEqual(classifyWakeUtterance('Ei Pestinha: como funciona?', false), { type: 'wake', text: 'como funciona?' });
assert.deepEqual(classifyWakeUtterance('E como faço isso no celular?', true), { type: 'continue', text: 'E como faço isso no celular?' });
assert.deepEqual(classifyWakeUtterance('E como faço isso no celular?', false), { type: 'ignore', text: '' });
assert.equal(classifyWakeUtterance('Pestinha, agora não', true).type, 'stop');
assert.equal(classifyWakeUtterance('Agora não, fica quietinho', true).type, 'stop');
assert.equal(classifyWakeUtterance('Para, Pestinha', true).type, 'stop');
assert.equal(classifyWakeUtterance('Pode parar de ouvir', true).type, 'stop');
assert.equal(classifyWakeUtterance('Silêncio', true).type, 'stop');
assert.equal(VOICE_CONVERSATION_IDLE_MS, 45000);
console.log('OK — a palavra-chave inicia a conversa, os próximos turnos seguem sem repeti-la e comandos de parada encerram a escuta.');
