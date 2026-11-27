import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { answerFromProjectKnowledge, getProjectKnowledgeDiagnostics } from '../js/companion/project-knowledge.js';

const diagnostics = getProjectKnowledgeDiagnostics();
assert.deepEqual(diagnostics.unclassified, [], 'cada fato da base revisável deve pertencer a um projeto explícito');
assert.deepEqual(diagnostics.invalidCuratedMetadata, [], 'cada fato novo deve ter ID, projeto, status, fonte e data de revisão');
assert.deepEqual(diagnostics.duplicateIds, [], 'IDs dos fatos curados não devem se repetir');

const house = answerFromProjectKnowledge('Como a casa 3D salva o progresso?');
assert.ok(house, 'a integração da casa deve ser recuperável');
assert.match(house, /nossotempo3d:v1/, 'a resposta deve indicar a chave verificada da casa');
assert.doesNotMatch(house, /piano3d:challenges|afinador/i, 'a resposta da casa não deve misturar o piano');

const tuner = answerFromProjectKnowledge('Como funciona o afinador do piano?');
assert.ok(tuner, 'o afinador deve ter um fato local recuperável');
assert.match(tuner, /analisado localmente/i, 'a resposta deve explicar o processamento local');
assert.match(tuner, /não grava nem envia áudio/i, 'a resposta deve descrever a privacidade observada');
assert.doesNotMatch(tuner, /nossotempo3d:v1/i, 'a resposta do afinador não deve misturar a casa');

const piano = answerFromProjectKnowledge('Quais modos existem no Piano das Estrelas?');
assert.match(piano, /WebGL/);
assert.match(piano, /Livre, Aprender, Ouvir e Desafios/);

const ambiguousSave = answerFromProjectKnowledge('Onde fica salvo o progresso?');
assert.match(ambiguousSave, /Casa 3D.*Piano/s, 'uma pergunta ambígua deve pedir a distinção em vez de escolher um projeto');
assert.match(ambiguousSave, /nossotempo3d:v1/);
assert.match(ambiguousSave, /piano3d:challenges/);

const crossProjectSave = answerFromProjectKnowledge('O piano salva dentro da casa 3D?');
assert.match(crossProjectSave, /são áreas separadas/i);
assert.match(crossProjectSave, /nossotempo3d:v1/);
assert.match(crossProjectSave, /piano3d:challenges/);

answerFromProjectKnowledge('Como a casa 3D salva o progresso?');
assert.equal(answerFromProjectKnowledge('Qual é a assinatura premium do piano?'), null, 'a base deve se abster quando não há evidência no projeto');
assert.equal(answerFromProjectKnowledge('Me dá um exemplo'), null, 'uma consulta sem evidência em outro projeto não deve reutilizar o último fato');

const projectSource = readFileSync(new URL('../js/companion/project-knowledge.js', import.meta.url), 'utf8');
const companionSource = readFileSync(new URL('../js/companion/companion.js', import.meta.url), 'utf8');
const feedbackBody = companionSource.match(/function handleFeedback\(button\)\s*\{([\s\S]*?)\n\}/)?.[1] || '';
assert.match(feedbackBody, /brain\.reward\(/, 'feedback deve ajustar o cérebro associativo local');
assert.doesNotMatch(feedbackBody, /answerFromProjectKnowledge|CURATED_METADATA|ITEMS/, 'feedback não deve editar os fatos revisados');
assert.doesNotMatch(projectSource, /localStorage\.(?:getItem|setItem|removeItem)\s*\(/, 'a camada factual não deve ler nem escrever saves ou memórias pessoais');
assert.match(companionSource, /const projectAnswer = answerFromProjectKnowledge\(question\);\s*if \(projectAnswer\) return projectAnswer;/, 'uma resposta técnica curada deve retornar antes da busca de memórias pessoais');

console.log('OK — fatos curados por projeto, abstenção, continuidade sem vazamento, feedback isolado e chave da casa verificados.');
