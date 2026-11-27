import assert from 'node:assert/strict';
import { SpikingBrain, NEURON_COUNT, SYNAPSE_COUNT } from '../js/companion/neural-brain.js';

assert.equal(NEURON_COUNT, 470, 'A arquitetura deve manter 470 neurônios.');
assert.equal(SYNAPSE_COUNT, 5640, 'A arquitetura deve criar 5.640 conexões esparsas.');

const architecture = new SpikingBrain().getStats();
assert.equal(architecture.sensoryNeurons, 30);
assert.equal(architecture.excitatoryNeurons, 320);
assert.equal(architecture.inhibitoryNeurons, 80);
assert.equal(architecture.outputNeurons, 40);
assert.equal(architecture.outputUnits, 36);
assert.equal(architecture.auxiliaryOutputNeurons, 4);
assert.equal(architecture.sensoryNeurons + architecture.excitatoryNeurons + architecture.inhibitoryNeurons + architecture.outputNeurons, 470);
const sameSeedA = new SpikingBrain(null, 0, 12345);
const sameSeedB = new SpikingBrain(null, 0, 12345);
const differentSeed = new SpikingBrain(null, 0, 54321);
assert.deepEqual(sameSeedA.exportWeights(), sameSeedB.exportWeights(), 'O mesmo seed deve restaurar a mesma arquitetura e personalidade inicial.');
assert.notDeepEqual(sameSeedA.exportWeights(), differentSeed.exportWeights(), 'Seeds diferentes devem criar redes iniciais distintas.');

for (const [input, expected] of [
  [{ carinho: 1 }, 'aproximar'],
  [{ brincadeira: 1 }, 'brincar'],
  [{ descanso: 1 }, 'descansar'],
  [{ voz: 1 }, 'escutar'],
  [{ curiosidade: 1 }, 'surpresa'],
  [{ conversa: 1 }, 'conversar'],
]) {
  const brain = new SpikingBrain();
  const before = brain.exportWeights();
  const unscored = brain.stimulate(input, { reward: 0, steps: 48 });
  assert.equal(unscored.output, expected, `O sinal ${Object.keys(input)[0]} deve ativar sua saída neural correspondente.`);
  assert.equal(brain.getStats().trainingEvents, 0, 'Uma interação sem avaliação não deve contar como aprendizado reforçado.');
  const result = brain.reward(input, 0.85);
  const after = brain.exportWeights();
  assert.equal(result.output, expected, `A recompensa deve manter a resposta principal para ${Object.keys(input)[0]}.`);
  assert(after.every(Number.isFinite), 'Os pesos precisam permanecer numéricos.');
  assert(after.every(weight => weight >= 0.15 && weight <= 22.0), 'Os pesos precisam respeitar os limites de estabilidade.');
  assert(after.some((weight, index) => weight !== before[index]), 'O feedback deve alterar pesos sinápticos.');
  assert.equal(brain.getStats().trainingEvents, 1);

  const restored = new SpikingBrain(after, brain.getStats().trainingEvents, brain.seed);
  assert.equal(restored.exportWeights().length, SYNAPSE_COUNT, 'Os pesos precisam ser restauráveis.');
  assert.equal(restored.getStats().trainingEvents, 1, 'A contagem de aprendizado deve sobreviver ao recarregamento.');
  assert.equal(restored.seed, brain.seed, 'A topologia neural deve ser reconstruída com o mesmo seed salvo.');
}

const allInputs = [
  [{ carinho: 1 }, 'aproximar'], [{ brincadeira: 1 }, 'brincar'],
  [{ conversa: 1 }, 'conversar'], [{ historia: 1 }, 'lembrar'],
  [{ elogio: 1 }, 'alegria'], [{ frustracao: 1 }, 'acalmar'],
  [{ quietude: 1 }, 'observar'], [{ curiosidade: 1 }, 'surpresa'],
  [{ descanso: 1 }, 'descansar'], [{ voz: 1 }, 'escutar'],
];
for (let seed = 1; seed <= 20; seed++) {
  for (const [input, expected] of allInputs) {
    const network = new SpikingBrain(null, 0, seed * 9137);
    assert.equal(network.stimulate(input, { steps: 64 }).output, expected, `Seed ${seed}: saída correta para ${Object.keys(input)[0]}.`);
  }
}

console.log('OK — arquitetura 470/5.640, divisão dos neurônios, estímulos, reforço e restauração verificados.');
