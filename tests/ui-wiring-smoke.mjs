import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../js/companion/companion.js', import.meta.url), 'utf8');
const chatApiSource = readFileSync(new URL('../api/pestinha/chat.mjs', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const indexSource = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const unlockSource = readFileSync(new URL('../js/event-unlock.js', import.meta.url), 'utf8');
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
assert.match(source, /fetch\('\/api\/pestinha\/chat'/, 'a conversa natural deve usar o endpoint server-side');
assert.match(source, /answerFromProjectKnowledge/, 'a base de projetos deve ser consultada');
assert.match(source, /projectContext: String\(projectContext \|\| ''\)/, 'o contexto de projetos deve ser enviado com a IA natural');
assert.match(chatApiSource, /CONTEXTO LOCAL DOS PROJETOS/, 'o backend deve incluir o contexto de projetos sem misturá-lo com memórias pessoais');
assert.match(source, /handleMusicCommand/, 'a conversa deve encaminhar comandos musicais');
assert.match(source, /toggleWakeListening/, 'a chamada pela palavra-chave deve ser controlável');
assert.match(source, /stopWakeListening/, 'a escuta por palavra-chave deve poder ser desligada');
assert.match(source, /SpeechRecognition/, 'o modo de chamada deve usar a API de fala do navegador');
assert.match(source, /data-action="toggle-wake-listening"/, 'o controle de chamada por voz deve estar na interface');
assert.match(appSource, /initCompanion/, 'o módulo do Pestinha deve continuar inicializado pelo app');

assert.match(source, /const memories = state\.aiMemoryConsent/, 'memórias só podem seguir com consentimento explícito');
assert.match(source, /aiEnabled: false/, 'a IA deve iniciar desligada por padrão');
assert.match(appSource, /sessionStorage\.getItem\('pe_welcome_shown'\)/, 'a cartinha deve ser preservada por sessão');
assert.doesNotMatch(appSource, /localStorage\.setItem\('pe_welcome_dismissed'/, 'a cartinha não deve ser escondida permanentemente');
assert.doesNotMatch(indexSource, /id="sw-update-bar"|Atualizar<\/button>/, 'o aviso técnico de atualização não deve aparecer na entrada');
assert.match(unlockSource, /autoUnlockEvents\(\{ silent: true \}\)/, 'desbloqueios automáticos devem ser silenciosos na entrada');
console.log('OK — Pestinha, cartinha por sessão e entrada sem spam verificados.');
