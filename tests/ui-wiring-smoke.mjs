import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../js/companion/companion.js', import.meta.url), 'utf8');
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
assert.match(source, /answerFromProjectKnowledge/, 'a base de projetos deve ser consultada');
assert.match(source, /handleMusicCommand/, 'a conversa deve encaminhar comandos musicais');
assert.match(source, /toggleWakeListening/, 'a chamada pela palavra-chave deve ser controlável');
assert.match(source, /stopWakeListening/, 'a escuta por palavra-chave deve poder ser desligada');
assert.match(source, /SpeechRecognition/, 'o modo de chamada deve usar a API de fala do navegador');
assert.match(source, /classifyWakeUtterance/, 'o microfone deve encaminhar turnos sem repetir a palavra-chave');
assert.match(source, /VOICE_CONVERSATION_IDLE_MS/, 'a conversa por voz deve ter tempo de inatividade definido');
assert.match(source, /isLikelySpeechEcho/, 'a fala do Pestinha não deve virar uma nova mensagem por eco');
assert.match(source, /if \(isSpeaking\)[\s\S]*speechSynthesis\?\.cancel/, 'uma nova fala da pessoa deve interromper a resposta atual');
assert.match(source, /data-action="toggle-wake-listening"/, 'o controle de chamada por voz deve estar na interface');
assert.match(appSource, /initCompanion/, 'o módulo do Pestinha deve continuar inicializado pelo app');

assert.match(source, /lastSpokenAt = Date\.now\(\)/, 'o filtro de eco deve manter uma janela após a síntese');
assert.match(source, /lastSpokenText = '';[\s\S]*lastSpokenAt = 0/, 'a janela de eco deve ser limpa ao parar ou iniciar outro turno');

assert.match(source, /aiEnabled: false/, 'o estado antigo de compatibilidade deve permanecer desligado');
assert.match(source, /function localConversationalReply\(question\)/, 'a conversa local deve ter continuidade e respostas sociais');
assert.doesNotMatch(source, /nt-companion-ai-enabled/, 'não deve existir controle de API externa na interface');
assert.match(appSource, /sessionStorage\.getItem\('pe_welcome_shown'\)/, 'a cartinha deve ser preservada por sessão');
assert.doesNotMatch(appSource, /localStorage\.setItem\('pe_welcome_dismissed'/, 'a cartinha não deve ser escondida permanentemente');
assert.doesNotMatch(indexSource, /id="sw-update-bar"|Atualizar<\/button>/, 'o aviso técnico de atualização não deve aparecer na entrada');
assert.match(unlockSource, /autoUnlockEvents\(\{ silent: true \}\)/, 'desbloqueios automáticos devem ser silenciosos na entrada');
console.log('OK — Pestinha, cartinha por sessão e entrada sem spam verificados.');
