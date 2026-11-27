import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const companion = readFileSync(new URL('../js/companion/companion.js', import.meta.url), 'utf8');
const chat = readFileSync(new URL('../api/pestinha/chat.mjs', import.meta.url), 'utf8');
const music = readFileSync(new URL('../api/pestinha/music-search.mjs', import.meta.url), 'utf8');

assert.match(companion, /let replyGeneration = 0/);
assert.match(companion, /function cancelActiveReply\(\)/);
assert.match(companion, /cancelActiveReply\(\);\n  if \(isSpeaking\)/);
assert.match(companion, /generation !== replyGeneration/);
assert.match(companion, /Resposta interrompida\./);
assert.match(companion, /stopListening\(\); stopWakeListening\(\)/);

for (const source of [chat, music]) {
  assert.match(source, /if \(!origin\) return false|if\(!origin\)return false/);
  assert.match(source, /AbortController/);
  assert.match(source, /setTimeout/);
  assert.match(source, /activeRequests/);
  assert.match(source, /content-length/);
}

assert.match(chat, /MAX_CONCURRENT_REQUESTS = 3/);
assert.match(music, /MAX_CONCURRENT_REQUESTS=2/);
console.log('OK — respostas antigas são invalidadas e os endpoints têm origem, corpo, concorrência e timeout protegidos.');
