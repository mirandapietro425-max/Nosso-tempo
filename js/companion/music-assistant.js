import { classifyMusicIntent, parseMusicChoice } from './music-intents.js';
import {
  getMusicPlaylist, addTrackToPlaylist, removeTrackFromPlaylist,
  playTrack, playExternalTrack, playNext, playPrev, pauseMusic, resumeMusic,
} from '../music.js';

let pendingSelection = null;
function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
function scoreTrack(track, query) {
  const words = normalize(query).split(/\s+/).filter(word => word.length > 1);
  const hay = normalize(`${track.name || ''} ${track.artist || ''}`);
  if (!words.length) return 0;
  return words.reduce((score, word) => score + (hay.includes(word) ? 1 : 0), 0) / words.length;
}
function findLocal(query) {
  return getMusicPlaylist().map((track, index) => ({ track, index, score: scoreTrack(track, query) }))
    .filter(item => item.score >= 0.5).sort((a, b) => b.score - a.score).slice(0, 5);
}
async function searchYouTube(query) {
  const response = await fetch('/api/pestinha/music-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return { items: [], fallbackUrl: data.fallbackUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, error: data.error || 'A busca do YouTube não está configurada.' };
  return { items: Array.isArray(data.items) ? data.items : [], fallbackUrl: data.fallbackUrl || '' };
}
function listReply(items, prefix) {
  return `${prefix}\n${items.map((item, index) => `${index + 1}. ${item.name} — ${item.artist || 'YouTube'}`).join('\n')}\nResponde com o número da opção para escolher.`;
}
function executeTrack(track, actions) {
  const messages = [];
  let result = null;
  if (actions.includes('add')) {
    result = addTrackToPlaylist(track);
    messages.push(result.added ? `Adicionei “${track.name}” à playlist sem começar a tocar.` : `“${track.name}” já estava na playlist; não criei uma cópia.`);
  }
  if (actions.includes('play')) {
    const index = getMusicPlaylist().findIndex(item => item.ytId === track.ytId);
    if (index >= 0) playTrack(index);
    else playExternalTrack(track);
    messages.push(`Reproduzindo “${track.name}”.`);
  }
  return messages.join(' ');
}
function confirmRemoval(item) {
  const accepted = typeof window !== 'undefined' && window.confirm(`Remover “${item.track.name}” da playlist?`);
  if (!accepted) return 'Tudo bem, não removi nada.';
  removeTrackFromPlaylist(item.index);
  return `Removi “${item.track.name}” da playlist.`;
}

export async function handleMusicCommand(input) {
  const text = normalize(input);
  // Correção explícita: registrar o sentido pedido, sem executar nenhuma ação.
  if (/\b(nao|não)\b.*\b(pedi|quis|era)\b.*\b(adicionar|adiciona|playlist)\b.*\b(nao|não)\b.*\b(tocar|toca|reproduzir)\b/.test(text)) {
    try { localStorage.setItem('nt_pestinha_music_correction', 'add-does-not-play'); } catch (_) {}
    pendingSelection = null;
    return { handled: true, reply: 'Entendi! “Adicionar” significa só colocar na playlist, sem tocar. Só vou reproduzir quando tu pedir “toca” ou “adiciona e toca”. Obrigado por corrigir! 💛' };
  }

  if (pendingSelection) {
    const choice = parseMusicChoice(input, pendingSelection.items.length);
    if (choice !== null) {
      const pending = pendingSelection;
      pendingSelection = null;
      const selected = pending.items[choice];
      if (pending.actions.includes('remove')) {
        const playlist = getMusicPlaylist();
        const index = playlist.findIndex(track => track.ytId === selected.ytId);
        return { handled: true, reply: index < 0 ? 'Essa faixa não está mais na playlist.' : confirmRemoval({ track: selected, index }) };
      }
      if (pending.actions.includes('search')) {
        return { handled: true, reply: `A opção escolhida foi “${selected.name}” — ${selected.artist || 'YouTube'}. Link: ${selected.url || `https://www.youtube.com/watch?v=${selected.ytId}`}` };
      }
      return { handled: true, reply: executeTrack(selected, pending.actions) };
    }
    // Um novo comando ou uma nova pergunta encerra a seleção anterior.
    if (classifyMusicIntent(input)) pendingSelection = null;
  }

  const intent = classifyMusicIntent(input);
  if (!intent) return { handled: false };
  if (intent.type === 'pause') { pauseMusic(); return { handled: true, reply: 'Música pausada. 🎵' }; }
  if (intent.type === 'resume') { resumeMusic(); return { handled: true, reply: 'Continuando a reprodução. 🎶' }; }
  if (intent.type === 'next') { playNext(); return { handled: true, reply: 'Pulando para a próxima faixa. 🎵' }; }
  if (intent.type === 'previous') { playPrev(); return { handled: true, reply: 'Voltando para a faixa anterior. 🎵' }; }
  if (!intent.query) return { handled: true, reply: 'Qual é o nome da música ou do artista? Por exemplo: “adiciona Photograph”.' };

  const local = findLocal(intent.query);
  if (intent.type === 'remove') {
    if (!local.length) return { handled: true, reply: `Não encontrei “${intent.query}” na playlist atual.` };
    if (local.length > 1) {
      pendingSelection = { items: local.map(item => item.track), actions: ['remove'] };
      return { handled: true, reply: listReply(pendingSelection.items, 'Encontrei mais de uma faixa parecida. Qual tu quer remover?') };
    }
    return { handled: true, reply: confirmRemoval(local[0]) };
  }
  if (intent.type === 'search' && local.length) {
    pendingSelection = { items: local.map(item => item.track), actions: ['search'] };
    return { handled: true, reply: listReply(pendingSelection.items, 'Encontrei estas faixas na playlist do site:') };
  }
  if (intent.type === 'track' && local.length === 1 && local[0].score >= 0.8) {
    return { handled: true, reply: executeTrack(local[0].track, intent.actions) };
  }
  if (intent.type === 'track' && local.length > 1 && local[0].score - local[1].score >= 0.35) {
    return { handled: true, reply: executeTrack(local[0].track, intent.actions) };
  }
  if (intent.type === 'track' && local.length > 1) {
    pendingSelection = { items: local.map(item => item.track), actions: intent.actions };
    return { handled: true, reply: listReply(pendingSelection.items, 'Encontrei mais de uma faixa parecida na playlist. Qual delas?') };
  }

  const result = await searchYouTube(intent.query);
  if (intent.type === 'search') {
    if (result.items.length) {
      pendingSelection = { items: result.items, actions: ['search'] };
      return { handled: true, reply: listReply(result.items, 'Resultados do YouTube:') };
    }
    return { handled: true, reply: `${result.error || 'Não consegui consultar o YouTube agora.'}\nBusca direta: ${result.fallbackUrl}` };
  }
  if (!result.items.length) {
    return { handled: true, reply: `${result.error || 'Não encontrei uma correspondência segura.'}\nBusca do YouTube: ${result.fallbackUrl}\nPara resultados integrados, configure YOUTUBE_API_KEY no servidor. Não vou escolher nem tocar uma faixa incerta.` };
  }
  if (result.items.length === 1) return { handled: true, reply: executeTrack(result.items[0], intent.actions) };
  pendingSelection = { items: result.items, actions: intent.actions };
  return { handled: true, reply: listReply(result.items, 'Encontrei estas músicas no YouTube. Escolhe uma:') };
}
export function clearPendingMusicSelection() { pendingSelection = null; }
