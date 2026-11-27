/* Interpreta turnos de voz e comandos de parada do Pestinha. */
export const VOICE_CONVERSATION_IDLE_MS = 45_000;
export const SPEECH_ECHO_GRACE_MS = 4_500;

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function classifyWakeUtterance(input, conversationActive = false) {
  const original = String(input || '').trim();
  const normalized = normalize(original);
  if (!normalized) return { type: 'ignore', text: '' };

  const withoutWake = normalized.replace(/^(?:ei\s+)?pestinha\b\s*/, '').trim();
  const stopText = withoutWake.replace(/\s+pestinha$/, '').trim();
  const stopCommand = /^(?:agora nao|fica quiet(?:o|a|inho|inha)|pode parar(?: de ouvir)?|para(?: de ouvir)?|pare(?: de ouvir)?|silencio|chega|desliga (?:o )?microfone|nao escuta mais|nao me ouca mais)$/;
  if (stopCommand.test(stopText)) return { type: 'stop', text: '' };

  const wakeMatch = normalized.match(/^(?:ei\s+)?pestinha\b/);
  if (wakeMatch) {
    const text = original.replace(/^\s*(?:ei\s+)?pestinha\b[\s,:;.-]*/i, '').trim();
    return { type: 'wake', text };
  }

  if (conversationActive) return { type: 'continue', text: original };
  return { type: 'ignore', text: '' };
}

/**
 * Filtra transcrições que se parecem com a última fala sintetizada.
 * Continua válido por uma pequena janela após o evento onend, pois a API de
 * reconhecimento pode entregar o resultado só depois de a síntese terminar.
 */
export function isLikelySpeechEcho(transcript, spokenText, spokenAt = 0, isSpeaking = false, now = Date.now()) {
  const heard = normalize(transcript);
  const spoken = normalize(spokenText);
  if (!heard || !spoken || heard.length < 14) return false;
  if (!isSpeaking && (!Number.isFinite(spokenAt) || now - spokenAt < 0 || now - spokenAt > SPEECH_ECHO_GRACE_MS)) return false;
  if (spoken.includes(heard)) return true;
  const heardWords = heard.split(/\s+/).filter(word => word.length > 2);
  if (heardWords.length < 4) return false;
  const spokenWords = new Set(spoken.split(/\s+/));
  const matches = heardWords.filter(word => spokenWords.has(word)).length;
  return matches / heardWords.length >= 0.88;
}
