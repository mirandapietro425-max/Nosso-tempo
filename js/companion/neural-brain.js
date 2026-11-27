/*
 * Pestinha do Nosso-tempo — pequeno cérebro neural local.
 * Implementação original em JavaScript inspirada no conceito de redes LIF
 * (leaky integrate-and-fire). Não é código portado do projeto Pestinha.
 *
 * Arquitetura: 470 neurônios, conexões recorrentes esparsas e plasticidade
 * sináptica modulada por recompensa. Só os pesos aprendidos são persistidos.
 */

export const NEURON_COUNT = 470;
export const SYNAPSES_PER_NEURON = 12;
export const SYNAPSE_COUNT = NEURON_COUNT * SYNAPSES_PER_NEURON;

export const BRAIN_INPUTS = Object.freeze([
  'carinho', 'brincadeira', 'conversa', 'historia', 'elogio',
  'frustracao', 'quietude', 'curiosidade', 'descanso', 'voz',
]);

export const BRAIN_OUTPUTS = Object.freeze([
  'observar', 'alegria', 'aproximar', 'brincar', 'descansar', 'escutar',
  'conversar', 'lembrar', 'dancar', 'acalmar', 'surpresa', 'concentrar',
]);

const SENSORY_COUNT = 30;
const EXCITATORY_START = SENSORY_COUNT;
const EXCITATORY_END = 350;
const INHIBITORY_START = EXCITATORY_END;
const INHIBITORY_END = 430;
const OUTPUT_START = INHIBITORY_END;
const OUTPUT_GROUP_SIZE = 3;
const AUXILIARY_START = OUTPUT_START + (BRAIN_OUTPUTS.length * OUTPUT_GROUP_SIZE);
const RESTING_POTENTIAL = -65;
const FIRING_THRESHOLD = -50;
const RESET_POTENTIAL = -68;
const MEMBRANE_TAU = 18;
const REFRACTORY_STEPS = 2;
const TRACE_DECAY = 0.93;
const WEIGHT_MIN = 0.15;
const WEIGHT_MAX = 22.0;

function makeRandom(seed = 0x51a7e) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class SpikingBrain {
  constructor(savedWeights = null, savedTrainingEvents = 0, seed = 0x51a7e) {
    this.targets = new Uint16Array(SYNAPSE_COUNT);
    this.weights = new Float32Array(SYNAPSE_COUNT);
    this.potential = new Float32Array(NEURON_COUNT);
    this.refractory = new Uint8Array(NEURON_COUNT);
    this.previousSpikes = new Uint8Array(NEURON_COUNT);
    this.spikes = new Uint8Array(NEURON_COUNT);
    this.synapticCurrent = new Float32Array(NEURON_COUNT);
    this.preTrace = new Float32Array(NEURON_COUNT);
    this.postTrace = new Float32Array(NEURON_COUNT);
    this.activity = new Float32Array(BRAIN_OUTPUTS.length);
    this.trainingEvents = Math.max(0, Math.floor(Number(savedTrainingEvents) || 0));
    this.totalSpikes = 0;
    this.seed = (Number(seed) >>> 0) || 0x51a7e;
    this.random = makeRandom(this.seed);

    this.potential.fill(RESTING_POTENTIAL);
    this.#buildConnections();

    if (Array.isArray(savedWeights) && savedWeights.length === SYNAPSE_COUNT) {
      for (let i = 0; i < SYNAPSE_COUNT; i++) {
        const value = Number(savedWeights[i]);
        if (Number.isFinite(value)) this.weights[i] = clamp(value, WEIGHT_MIN, WEIGHT_MAX);
      }
    }
  }

  #buildConnections() {
    const random = this.random;
    for (let source = 0; source < NEURON_COUNT; source++) {
      const inhibitory = source >= INHIBITORY_START && source < INHIBITORY_END;
      const offset = source * SYNAPSES_PER_NEURON;
      for (let slot = 0; slot < SYNAPSES_PER_NEURON; slot++) {
        let target = 0;
        let initialWeight = 0;
        if (source < SENSORY_COUNT && slot < 4) {
          // Projeções sensório-motoras: cada trio de sensores possui alvos
          // diretos num pequeno conjunto de neurônios de saída. Os demais
          // caminhos continuam recorrentes e não são regras de diálogo.
          const channel = Math.floor(source / 3);
          const outputForInput = [2, 3, 6, 7, 1, 9, 0, 10, 4, 5];
          const outputGroup = outputForInput[channel];
          target = OUTPUT_START + outputGroup * OUTPUT_GROUP_SIZE + ((slot + source % 3) % OUTPUT_GROUP_SIZE);
          initialWeight = 15.5 + random() * 3.5;
        } else {
          do {
            // Neurônios sensoriais são entradas; a recorrência começa no bloco E.
            target = EXCITATORY_START + Math.floor(random() * (NEURON_COUNT - EXCITATORY_START));
          } while (target === source);
          initialWeight = inhibitory ? 4.5 + random() * 3.0 : 4.0 + random() * 3.8;
        }
        this.targets[offset + slot] = target;
        this.weights[offset + slot] = initialWeight;
      }
    }
  }

  #step(inputVector, reward) {
    // Corrente pós-sináptica decai gradualmente: um disparo pode influenciar
    // os próximos passos em vez de desaparecer no mesmo ciclo.
    for (let neuron = 0; neuron < NEURON_COUNT; neuron++) this.synapticCurrent[neuron] *= 0.76;

    // Propagação dos disparos da etapa anterior e plasticidade STDP simples.
    for (let source = 0; source < NEURON_COUNT; source++) {
      if (!this.previousSpikes[source]) continue;
      const inhibitory = source >= INHIBITORY_START && source < INHIBITORY_END;
      const offset = source * SYNAPSES_PER_NEURON;
      for (let slot = 0; slot < SYNAPSES_PER_NEURON; slot++) {
        const edge = offset + slot;
        const target = this.targets[edge];
        const sign = inhibitory ? -1 : 1;
        this.synapticCurrent[target] += sign * this.weights[edge];

        // Um disparo pré-sináptico seguido de atividade pós-sináptica fortalece
        // a conexão; o sinal de recompensa decide se essa associação é reforçada.
        if (reward !== 0 && this.postTrace[target] > 0.015) {
          this.weights[edge] = clamp(
            this.weights[edge] + reward * 0.010 * this.postTrace[target],
            WEIGHT_MIN,
            WEIGHT_MAX,
          );
        }
      }
    }

    this.spikes.fill(0);
    for (let neuron = 0; neuron < NEURON_COUNT; neuron++) {
      let inputCurrent = this.synapticCurrent[neuron];

      // Cada um dos dez canais sensoriais ativa três neurônios dedicados.
      if (neuron < SENSORY_COUNT) {
        const channel = Math.floor(neuron / 3);
        inputCurrent += 46 * inputVector[channel];
      }

      if (this.refractory[neuron] > 0) {
        this.refractory[neuron]--;
        this.potential[neuron] = RESET_POTENTIAL;
        continue;
      }

      const voltage = this.potential[neuron];
      const nextVoltage = voltage + ((RESTING_POTENTIAL - voltage + inputCurrent) / MEMBRANE_TAU);
      this.potential[neuron] = nextVoltage;

      if (nextVoltage >= FIRING_THRESHOLD) {
        this.spikes[neuron] = 1;
        this.potential[neuron] = RESET_POTENTIAL;
        this.refractory[neuron] = REFRACTORY_STEPS;
        this.totalSpikes++;
      }
    }

    // Depressão quando a atividade pós ocorre antes de uma nova chegada pré.
    if (reward !== 0) {
      for (let source = 0; source < NEURON_COUNT; source++) {
        if (!this.previousSpikes[source]) continue;
        const offset = source * SYNAPSES_PER_NEURON;
        for (let slot = 0; slot < SYNAPSES_PER_NEURON; slot++) {
          const edge = offset + slot;
          if (this.spikes[this.targets[edge]]) {
            this.weights[edge] = clamp(
              this.weights[edge] - reward * 0.004 * this.preTrace[source],
              WEIGHT_MIN,
              WEIGHT_MAX,
            );
          }
        }
      }
    }

    for (let neuron = 0; neuron < NEURON_COUNT; neuron++) {
      this.preTrace[neuron] *= TRACE_DECAY;
      this.postTrace[neuron] *= TRACE_DECAY;
      if (this.previousSpikes[neuron]) this.preTrace[neuron] += 1;
      if (this.spikes[neuron]) this.postTrace[neuron] += 1;
    }

    this.previousSpikes.set(this.spikes);
  }

  stimulate(input = {}, { reward = 0, steps = 64 } = {}) {
    const vector = new Float32Array(BRAIN_INPUTS.length);
    for (let i = 0; i < BRAIN_INPUTS.length; i++) {
      vector[i] = clamp(Number(input[BRAIN_INPUTS[i]] ?? 0), 0, 1);
    }

    this.activity.fill(0);
    const count = Math.max(1, Math.min(120, Math.floor(steps)));
    for (let step = 0; step < count; step++) {
      this.#step(vector, clamp(Number(reward) || 0, -1, 1));
      for (let output = 0; output < BRAIN_OUTPUTS.length; output++) {
        const start = OUTPUT_START + output * OUTPUT_GROUP_SIZE;
        for (let cell = 0; cell < OUTPUT_GROUP_SIZE; cell++) {
          this.activity[output] += this.spikes[start + cell];
        }
      }
    }

    const totalOutput = this.activity.reduce((sum, value) => sum + value, 0);
    let strongest = -1;
    let strongestValue = 0;
    for (let i = 0; i < this.activity.length; i++) {
      if (this.activity[i] > strongestValue) {
        strongest = i;
        strongestValue = this.activity[i];
      }
    }

    if (reward !== 0) this.trainingEvents++;
    return Object.freeze({
      output: strongest < 0 ? 'observar' : BRAIN_OUTPUTS[strongest],
      outputIndex: strongest,
      activity: Array.from(this.activity, value => totalOutput ? value / totalOutput : 0),
      spikes: this.totalSpikes,
      neurons: NEURON_COUNT,
      synapses: SYNAPSE_COUNT,
    });
  }

  reward(input, value) {
    return this.stimulate(input, { reward: clamp(Number(value) || 0, -1, 1), steps: 72 });
  }

  exportWeights() {
    return Array.from(this.weights);
  }

  getStats() {
    return Object.freeze({
      neurons: NEURON_COUNT,
      synapses: SYNAPSE_COUNT,
      sensoryNeurons: SENSORY_COUNT,
      excitatoryNeurons: EXCITATORY_END - EXCITATORY_START,
      inhibitoryNeurons: INHIBITORY_END - INHIBITORY_START,
      outputNeurons: NEURON_COUNT - OUTPUT_START,
      outputUnits: BRAIN_OUTPUTS.length * OUTPUT_GROUP_SIZE,
      auxiliaryOutputNeurons: NEURON_COUNT - AUXILIARY_START,
      trainingEvents: this.trainingEvents,
      spikes: this.totalSpikes,
    });
  }
}
