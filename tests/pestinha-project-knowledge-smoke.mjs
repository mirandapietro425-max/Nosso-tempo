import assert from 'node:assert/strict';
import { answerFromProjectKnowledge, getProjectKnowledgeStats } from '../js/companion/project-knowledge.js';

const cases = [
  ['Como funciona a palavra Pestinha e a conversa direta?', 'bolha'],
  ['Como o reconhecimento de fala funciona?', 'SpeechRecognition'],
  ['Como funciona o player de música?', 'YouTube IFrame API'],
  ['Qual a diferença entre adicionar música e tocar música?', 'playlist sem iniciar'],
  ['Como proteger a chave de uma API?', 'variáveis de ambiente'],
  ['Como o service worker atualiza os módulos?', 'cache'],
  ['O que é o Subway Pipi?', 'três pistas'],
];
for (const [question, expected] of cases) {
  const answer = answerFromProjectKnowledge(question);
  assert.ok(answer, `Sem resposta para: ${question}`);
  assert.ok(answer.toLowerCase().includes(expected.toLowerCase()), `Resposta inesperada para: ${question}\n${answer}`);
}
assert.ok(getProjectKnowledgeStats().topics >= 30, 'A base deve conter ao menos 30 tópicos');
console.log(`OK — ${cases.length} consultas da base local; ${getProjectKnowledgeStats().topics} tópicos.`);
