import assert from 'node:assert/strict';
import { searchMemories, selectMemoriesForSpeaker } from '../js/companion/memory-search.js';

const memories = [
  { id: 'escola', title: 'O começo na escola', text: 'A amizade cresceu entre jogos e xadrez. Emilly pediu para Pietro ensinar xadrez na escola.' },
  { id: 'namoro', title: 'O pedido de namoro', text: 'Em 11 de outubro de 2024, eles decidiram namorar depois de conversas e de assistir Bridgerton.', ts: new Date('2024-10-11').getTime() },
  { id: 'piano', title: 'A música ao piano', text: 'Uma canção ao piano e alguém por perto ouvindo com carinho.' },
  { id: 'taekwondo', title: 'Campeonato de taekwondo', text: 'Nos treinos e campeonatos, aprenderam a torcer um pelo outro.' },
  { id: 'pietro-note', title: 'Relato de Pietro', text: 'Pietro contou que gosta de programar e criar jogos.', author: 'Pietro' },
  { id: 'emilly-note', title: 'Relato de Emilly', text: 'Emilly contou que gosta de desenhar e ouvir música.', author: 'Emilly' },
  { id: 'shared-note', title: 'Lembrança compartilhada', text: 'Os dois gostam de guardar fotos e passeios.', author: 'Pietro e Emilly' },
];

for (const [question, expected] of [
  ['Como conheci a Emilly?', 'escola'],
  ['Quando começamos a namorar?', 'namoro'],
  ['Qual música tocamos?', 'piano'],
  ['O que aconteceu no campeonato?', 'taekwondo'],
]) {
  const results = searchMemories(memories, question, 4);
  assert.equal(results[0]?.memory.id, expected, `A busca deve priorizar a memória correta para: ${question}`);
  assert(results[0].confidence > 0.14, 'A busca deve indicar confiança suficiente para uma resposta baseada na lembrança.');
}

assert.deepEqual(searchMemories(memories, 'qzxvbn 0000', 3), [], 'A busca não deve inventar correspondências para perguntas sem termos relacionados.');
const pietroView = selectMemoriesForSpeaker(memories, 'O que eu contei?', 'Pietro');
assert(pietroView.some(memory => memory.id === 'pietro-note'));
assert(!pietroView.some(memory => memory.id === 'emilly-note'));
assert(pietroView.some(memory => memory.id === 'shared-note'));
const emillyView = selectMemoriesForSpeaker(memories, 'O que eu contei?', 'Emilly');
assert(emillyView.some(memory => memory.id === 'emilly-note'));
assert(!emillyView.some(memory => memory.id === 'pietro-note'));
const explicitEmilly = selectMemoriesForSpeaker(memories, 'O que a Emilly contou?', 'Pietro');
assert(explicitEmilly.some(memory => memory.id === 'emilly-note'));
assert(!explicitEmilly.some(memory => memory.id === 'pietro-note')); 
assert.deepEqual(searchMemories([], 'quando foi?', 3), [], 'A busca vazia deve retornar uma lista vazia.');
console.log('OK — busca de lembranças, expansão semântica, privacidade por perfil e rejeição de perguntas sem correspondência verificadas.');
