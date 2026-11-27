/* Interpreta turnos de voz do Pestinha sem exigir a palavra-chave a cada frase. */
export const VOICE_CONVERSATION_IDLE_MS = 45_000;

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function classifyWakeUtterance(input, conversationActive = false) {
  const original = String(input || '').trim();
  const normalized = normalize(original);
  if (!normalized) return { type: 'ignore', text: '' };

  const withoutWake = normalized.replace(/^(?:ei\s+)?pestinha\b\s*/, '').trim();
  const stopPatterns = /\b(?:agora nao|fica quietinho|fica quieto|pode parar|para pestinha|pare pestinha|silencio|nao quero mais ouvir)\b/;
  if (stopPatterns.test(withoutWake) || /^(?:ei )?pestinha (?:agora nao|fica quietinho|fica quieto|pode parar|silencio)$/.test(normalized)) {
    return { type: 'stop', text: '' };
  }

  const wakeMatch = normalized.match(/^(?:ei\s+)?pestinha\b/);
  if (wakeMatch) {
    const text = original.replace(/^\s*(?:ei\s+)?pestinha\b[\s,:;.-]*/i, '').trim();
    return { type: 'wake', text };
  }

  if (conversationActive) return { type: 'continue', text: original };
  return { type: 'ignore', text: '' };
}
