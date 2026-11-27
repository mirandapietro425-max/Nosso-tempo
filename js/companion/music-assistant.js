import { classifyMusicIntent, parseMusicChoice } from './music-intents.js';
import {
  getMusicPlaylist, addTrackToPlaylist, removeTrackFromPlaylist,
  playTrack, playExternalTrack, playNext, playPrev, pauseMusic, resumeMusic,
} from '../music.js';

const defaultPlayer = {
  getPlaylist: getMusicPlaylist,
  addToPlaylist: addTrackToPlaylist,
  removeFromPlaylist: removeTrackFromPlaylist,
  playIndex: playTrack,
  playExternal: playExternalTrack,
  next: playNext,
  previous: playPrev,
  pause: pauseMusic,
  resume: resumeMusic,
};

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
function scoreTrack(track, query) {
  const words = normalize(query).split(/\s+/).filter(word => word.length > 1);
  const hay = normalize(`${track.name || ''} ${track.artist || ''}`);
  if (!words.length) return 0;
  return words.reduce((score, word) => score + (hay.includes(word) ? 1 : 0), 0) / words.length;
}
function findLocal(player, query) {
  return player.getPlaylist().map((track, index) => ({ track, index, score: scoreTrack(track, query) }))
    .filter(item => item.score >= 0.5).sort((a, b) => b.score - a.score).slice(0, 5);
}
async function searchYouTubeOnServer(query) {
  const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  try {
    const response = await fetch('/api/pestinha/music-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { items: [], fallbackUrl: data.fallbackUrl || fallbackUrl, error: data.error || 'A busca do YouTube não está configurada.' };
    return { items: Array.isArray(data.items) ? data.items : [], fallbackUrl: data.fallbackUrl || fallbackUrl };
  } catch (_) {
    return { items: [], fallbackUrl, error: 'Não consegui acessar a busca do YouTube agora.' };
  }
}
function confirmInBrowser(track) {
  return typeof window !== 'undefined'
    && typeof window.confirm === 'function'
    && window.confirm(`Remover “${track.name}” da playlist?`);
}
function listReply(items, prefix) {
  return `${prefix}\n${items.map((item, index) => `${index + 1}. ${item.name} — ${item.artist || 'YouTube'}`).join('\n')}\nResponde com o número da opção para escolher.`;
}
function executeTrack(player, track, actions) {
  const messages = [];
  if (actions.includes('add')) {
    const result = player.addToPlaylist(track);
    messages.push(result.added
      ? `Adicionei “${track.name}” à playlist sem começar a tocar.`
      : `“${track.name}” já estava na playlist; não criei uma cópia.`);
  }
  if (actions.includes('play')) {
    const index = player.getPlaylist().findIndex(item => item.ytId === track.ytId);
    if (index >= 0) player.playIndex(index);
    else player.playExternal(track);
    messages.push(`Reproduzindo “${track.name}”.`);
  }
  return messages.join(' ');
}

/**
 * Cria o orquestrador de música com dependências explícitas.
 * Em produção, o adaptador padrão chama as funções públicas de js/music.js.
 * A injeção permite testar cada fluxo sem tocar áudio ou alterar o player real.
 */
export function createMusicAssistant({
  player: suppliedPlayer = {},
  searchYouTube = searchYouTubeOnServer,
  confirmRemoval = confirmInBrowser,
} = {}) {
  const player = { ...defaultPlayer, ...suppliedPlayer };
  let pendingSelection = null;

  function removeWithConfirmation(track) {
    if (!confirmRemoval(track)) return 'Tudo bem, não removi nada.';
    const index = player.getPlaylist().findIndex(item => item.ytId === track.ytId);
    if (index < 0) return 'Essa faixa não está mais na playlist.';
    const removed = player.removeFromPlaylist(index);
    return removed ? `Removi “${track.name}” da playlist.` : 'Não consegui remover essa faixa da playlist.';
  }

  async function handleMusicCommand(input) {
    const text = normalize(input);
    // A correção vale como regra explícita do fluxo: adicionar não inicia reprodução.
    // Não alegamos aprendizado permanente, pois o feedback atual não atualiza o modelo.
    if (/\b(nao|não)\b.*\b(pedi|quis|era)\b.*\b(adicionar|adiciona|playlist)\b.*\b(nao|não)\b.*\b(tocar|toca|reproduzir)\b/.test(text)) {
      pendingSelection = null;
      return { handled: true, reply: 'Entendi a correção: “adicionar” só coloca na playlist e não toca. “Tocar” é outra ação. Vou aplicar essa distinção aqui.' };
    }

    if (pendingSelection) {
      const choice = parseMusicChoice(input, pendingSelection.items.length);
      if (choice !== null) {
        const pending = pendingSelection;
        pendingSelection = null;
        const selected = pending.items[choice];
        if (pending.actions.includes('remove')) {
          return { handled: true, reply: removeWithConfirmation(selected) };
        }
        if (pending.actions.includes('search')) {
          return { handled: true, reply: `A opção escolhida foi “${selected.name}” — ${selected.artist || 'YouTube'}. Link: ${selected.url || `https://www.youtube.com/watch?v=${selected.ytId}`}` };
        }
        return { handled: true, reply: executeTrack(player, selected, pending.actions) };
      }
      pendingSelection = null;
    }

    const intent = classifyMusicIntent(input);
    if (!intent) return { handled: false };
    if (intent.type === 'pause') { player.pause(); return { handled: true, reply: 'Música pausada. 🎵' }; }
    if (intent.type === 'resume') { player.resume(); return { handled: true, reply: 'Continuando a reprodução. 🎶' }; }
    if (intent.type === 'next') { player.next(); return { handled: true, reply: 'Pulando para a próxima faixa. 🎵' }; }
    if (intent.type === 'previous') { player.previous(); return { handled: true, reply: 'Voltando para a faixa anterior. 🎵' }; }
    if (!intent.query) return { handled: true, reply: 'Qual é o nome da música ou do artista? Por exemplo: “adiciona Photograph”.' };

    const local = findLocal(player, intent.query);
    if (intent.type === 'remove') {
      if (!local.length) return { handled: true, reply: `Não encontrei “${intent.query}” na playlist atual.` };
      if (local.length > 1) {
        pendingSelection = { items: local.map(item => item.track), actions: ['remove'] };
        return { handled: true, reply: listReply(pendingSelection.items, 'Encontrei mais de uma faixa parecida. Qual tu quer remover?') };
      }
      return { handled: true, reply: removeWithConfirmation(local[0].track) };
    }

    if (intent.type === 'track' && local.length === 1 && local[0].score >= 0.8) {
      return { handled: true, reply: executeTrack(player, local[0].track, intent.actions) };
    }
    if (intent.type === 'track' && local.length > 1 && local[0].score - local[1].score >= 0.35) {
      return { handled: true, reply: executeTrack(player, local[0].track, intent.actions) };
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
      if (local.length) {
        pendingSelection = { items: local.map(item => item.track), actions: ['search'] };
        return { handled: true, reply: `${result.error ? `${result.error}\n` : ''}Na playlist local do site, encontrei:\n${listReply(pendingSelection.items, '').trim()}\nSe quiser ampliar a busca, abre: ${result.fallbackUrl}` };
      }
      return { handled: true, reply: `${result.error || 'Não consegui consultar o YouTube agora.'}\nBusca direta: ${result.fallbackUrl}` };
    }
    if (!result.items.length) {
      return { handled: true, reply: `${result.error || 'Não encontrei uma correspondência segura.'}\nBusca do YouTube: ${result.fallbackUrl}\nPara resultados integrados, configure YOUTUBE_API_KEY no servidor. Não vou escolher nem tocar uma faixa incerta.` };
    }
    if (result.items.length === 1) return { handled: true, reply: executeTrack(player, result.items[0], intent.actions) };
    pendingSelection = { items: result.items, actions: intent.actions };
    return { handled: true, reply: listReply(result.items, 'Encontrei estas músicas no YouTube. Escolhe uma:') };
  }

  return {
    handleMusicCommand,
    clearPendingMusicSelection() { pendingSelection = null; },
  };
}

const productionAssistant = createMusicAssistant();
export const handleMusicCommand = input => productionAssistant.handleMusicCommand(input);
export const clearPendingMusicSelection = () => productionAssistant.clearPendingMusicSelection();
