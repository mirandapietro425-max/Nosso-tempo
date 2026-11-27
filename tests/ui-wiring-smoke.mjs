import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../js/companion/companion.js', import.meta.url), 'utf8');
const requiredActions = [
  'close', 'save-message-memory', 'export-backup', 'pick-backup',
  'quick-question', 'pet', 'play', 'nap', 'import-memories', 'save-memory',
  'remove-memory', 'feedback', 'clear-chat', 'reset-brain',
];
for (const action of requiredActions) {
  assert.ok(source.includes(`action === '${action}'`), `ação sem manipulador: ${action}`);
}
for (const id of [
  'nt-companion-speak-enabled', 'nt-companion-backup-file',
  'nt-companion-remember', 'nt-companion-speaker', 'nt-companion-messages',
]) {
  assert.ok(source.includes(id), `controle ausente: ${id}`);
}
assert.match(source, /if \(state\.speakResponses\) speak\(reply\)/, 'preferência de voz não é aplicada às respostas');
assert.match(source, /saveMessageAsMemory\(button\.dataset\.message\)/, 'ação de guardar mensagem não está ligada');
assert.match(source, /exportCompanionBackup\(\)/, 'ação de exportar backup não está ligada');
assert.match(source, /getElementById\('nt-companion-backup-file'\)\?\.click\(\)/, 'ação de escolher backup não está ligada');
assert.doesNotMatch(source, /\bfetch\s*\(/, 'o módulo não deve enviar memórias via fetch');
console.log('OK — botões, preferências, salvamento individual de memórias e ausência de envio HTTP próprio verificados.');
