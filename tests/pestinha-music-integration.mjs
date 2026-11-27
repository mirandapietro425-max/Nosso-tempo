import assert from 'node:assert/strict';

const storage = new Map();
globalThis.localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); },
};
const playerCalls = { loaded: [], paused: 0, resumed: 0 };
let allowRemoval = false;
const browserWindow = {
  confirm() { return allowRemoval; },
};
globalThis.window = browserWindow;
globalThis.document = {
  getElementById() { return null; },
  querySelectorAll() { return []; },
  createElement() { return { style: {}, classList: { add() {}, remove() {} }, addEventListener() {} }; },
  head: { appendChild() {} },
};

const photo = { ytId: 'Photo123456', name: 'Photograph', artist: 'Ed Sheeran', url: 'https://www.youtube.com/watch?v=Photo123456' };
const yellowOne = { ytId: 'Yellow12345', name: 'Yellow', artist: 'Coldplay', url: 'https://www.youtube.com/watch?v=Yellow12345' };
const yellowTwo = { ytId: 'Yellow67890', name: 'Yellow (Live)', artist: 'Coldplay', url: 'https://www.youtube.com/watch?v=Yellow67890' };
const coldplayOne = { ytId: 'Coldplay111', name: 'Viva la Vida', artist: 'Coldplay', url: 'https://www.youtube.com/watch?v=Coldplay111' };
const coldplayTwo = { ytId: 'Coldplay222', name: 'Fix You', artist: 'Coldplay', url: 'https://www.youtube.com/watch?v=Coldplay222' };

globalThis.fetch = async (_url, options = {}) => {
  const query = JSON.parse(options.body || '{}').query || '';
  let items = [];
  if (/Photograph/i.test(query)) items = [photo];
  else if (/Yellow/i.test(query)) items = [yellowOne, yellowTwo];
  else if (/Coldplay/i.test(query)) items = [coldplayOne, coldplayTwo];
  return { ok: true, async json() { return { items }; } };
};

class MockYouTubePlayer {
  constructor(_elementId, config) {
    this.config = config;
    this.state = 2;
    config.events.onReady();
  }
  loadVideoById(value) { playerCalls.loaded.push(typeof value === 'string' ? value : value.videoId); this.state = 1; }
  pauseVideo() { playerCalls.paused++; this.state = 2; }
  playVideo() { playerCalls.resumed++; this.state = 1; }
  getPlayerState() { return this.state; }
}
globalThis.YT = {
  Player: MockYouTubePlayer,
  PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0, CUED: 5 },
};

const music = await import('../js/music.js');
const assistant = await import('../js/companion/music-assistant.js');
browserWindow.onYouTubeIframeAPIReady();
const nextTurn = () => Promise.resolve();

await nextTurn();
const playlistStart = music.getMusicPlaylist().length;

// Perguntas, mesmo dirigidas ao Pestinha, nunca devem executar comandos.
for (const question of [
  'Como adiciono Photograph?',
  'Pestinha, como adiciona Photograph?',
  'Pestinha, adiciona Photograph?',
  'Qual a diferença entre adicionar e tocar música?',
]) {
  const result = await assistant.handleMusicCommand(question);
  assert.equal(result.handled, false, `Pergunta interceptada como comando: ${question}`);
}
assert.equal(playerCalls.loaded.length, 0, 'perguntas não podem tocar faixas');
assert.equal(music.getMusicPlaylist().length, playlistStart, 'perguntas não podem alterar a playlist');

// Adicionar: altera playlist e persistência, sem chamar o player.
const added = await assistant.handleMusicCommand('Pestinha, adiciona Photograph');
assert.equal(added.handled, true);
assert.match(added.reply, /sem começar a tocar/);
assert.equal(music.getMusicPlaylist().length, playlistStart + 1);
assert.equal(playerCalls.loaded.length, 0, 'adicionar não pode chamar loadVideoById');
assert.ok(storage.has('nt_music_added_tracks_v1'), 'a playlist adicionada deve persistir no localStorage');

// Repetir adicionar não duplica a faixa nem começa a tocar.
const duplicate = await assistant.handleMusicCommand('adiciona Photograph');
assert.match(duplicate.reply, /já estava na playlist/);
assert.equal(music.getMusicPlaylist().length, playlistStart + 1);
assert.equal(playerCalls.loaded.length, 0);

// Tocar: reproduz faixa existente sem alterar a playlist.
const beforePlayLength = music.getMusicPlaylist().length;
const played = await assistant.handleMusicCommand('toca Skyfall');
assert.match(played.reply, /Reproduzindo/);
assert.equal(playerCalls.loaded.at(-1), 'DeumyOzKqgI');
assert.equal(music.getMusicPlaylist().length, beforePlayLength);

// Adicionar e tocar: resultados ambíguos pedem escolha; a segunda opção faz ambas ações.
const bothPrompt = await assistant.handleMusicCommand('adiciona e toca Yellow');
assert.match(bothPrompt.reply, /mais de uma faixa|Encontrei estas músicas/);
const loadedBeforeChoice = playerCalls.loaded.length;
const bothResult = await assistant.handleMusicCommand('segunda');
assert.match(bothResult.reply, /Adicionei/);
assert.match(bothResult.reply, /Reproduzindo/);
assert.equal(playerCalls.loaded.length, loadedBeforeChoice + 1);
assert.equal(playerCalls.loaded.at(-1), yellowTwo.ytId);
assert.ok(music.getMusicPlaylist().some(track => track.ytId === yellowTwo.ytId));

// Pesquisar: apresenta resultados e a seleção abre o link, sem tocar ou adicionar.
const beforeSearchLength = music.getMusicPlaylist().length;
const beforeSearchLoads = playerCalls.loaded.length;
const searchPrompt = await assistant.handleMusicCommand('pesquisa Coldplay');
assert.match(searchPrompt.reply, /Resultados do YouTube/);
assert.match(searchPrompt.reply, /1\. Viva la Vida/);
assert.match(searchPrompt.reply, /2\. Fix You/);
const chosenSearch = await assistant.handleMusicCommand('segunda opção');
assert.match(chosenSearch.reply, /Fix You/);
assert.match(chosenSearch.reply, /youtube\.com\/watch\?v=Coldplay222/);
assert.equal(playerCalls.loaded.length, beforeSearchLoads, 'pesquisa não pode tocar faixa');
assert.equal(music.getMusicPlaylist().length, beforeSearchLength, 'pesquisa não pode adicionar faixa');

// Controles de reprodução.
await assistant.handleMusicCommand('pausa');
assert.equal(playerCalls.paused, 1);
await assistant.handleMusicCommand('continua');
assert.equal(playerCalls.resumed, 1);
const beforeNext = playerCalls.loaded.length;
await assistant.handleMusicCommand('próxima');
await assistant.handleMusicCommand('anterior');
assert.equal(playerCalls.loaded.length, beforeNext + 2);

// Remoção pede confirmação e só altera playlist quando confirmada.
const beforeRemoval = music.getMusicPlaylist().length;
allowRemoval = false;
const refused = await assistant.handleMusicCommand('remove Photograph');
assert.match(refused.reply, /não removi/);
assert.equal(music.getMusicPlaylist().length, beforeRemoval);
allowRemoval = true;
const removed = await assistant.handleMusicCommand('remove Photograph');
assert.match(removed.reply, /Removi/);
assert.equal(music.getMusicPlaylist().length, beforeRemoval - 1);
assert.ok(!music.getMusicPlaylist().some(track => track.ytId === photo.ytId));

console.log('OK — integração real Pestinha ↔ music.js: perguntas sem ação, adicionar sem tocar, tocar sem adicionar, adicionar+tocar com escolha, pesquisa sem tocar, controles e remoção confirmada.');
