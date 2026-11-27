import assert from 'node:assert/strict';
import { answerFromKnowledge, getKnowledgeStats } from '../js/companion/knowledge-base.js';

const cases = [
  ['o que é ansiedade antes de uma prova?', /Antes de uma prova/],
  ['como eu estudo sem me distrair?', /atenção|estudo/i],
  ['como saber se um link é golpe?', /Desconfia|endereço/i],
  ['me explica mitocôndria', /Mitocôndrias/],
  ['me dá um exemplo', /energia|ATP|célula/i],
  ['o que é ligação covalente?', /compartilham/],
  ['como pedir desculpas?', /Reconhece|desculpas/i],
  ['como organizar uma tarefa grande?', /Divide|etapas/i],
  ['o que é criatividade?', /Criatividade/],
  ['o que é fato e opinião?', /Fato|opinião/i],
];

assert.ok(getKnowledgeStats().topics >= 324, 'a base expandida deve permanecer carregada');
for (const [question, expected] of cases) {
  const answer = answerFromKnowledge(question);
  assert.ok(answer, `sem resposta para: ${question}`);
  assert.match(answer, expected, `resposta inadequada para: ${question}\n${answer}`);
}

console.log(`OK — ${cases.length} perguntas naturais e continuações respondidas pela base local.`);
