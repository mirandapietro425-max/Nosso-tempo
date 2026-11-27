/*
 * Busca local de memórias do Pestinha.
 * Recuperação lexical ponderada (BM25 simplificado) + expansões semânticas
 * explícitas em português. Não usa rede, embeddings remotos ou serviço externo.
 */

const STOP_WORDS = new Set([
  'a','o','as','os','um','uma','uns','umas','de','do','da','dos','das','em','no','na','nos','nas',
  'e','ou','mas','que','qual','quais','quem','como','quando','onde','por','para','com','sem','sobre',
  'me','te','se','eu','voce','voces','ele','ela','nos','isso','essa','esse','aquele','aquela','foi',
  'era','ser','estar','tem','tinha','sao','sendo','mais','muito','muita','pouco','pouca','tambem','ja',
  'ainda','nao','sim','aqui','ali','la','pra','pro','porque','pq','ne','ta','to','dos','das','junto',
  'juntos','juntas','comigo','contigo','dele','dela','deles','delas','meu','minha','seu','sua','seus','suas',
]);

const EXPANSIONS = [
  { pattern: /conhec|primeir[oa].*vez|inicio|comeco/, terms: ['escola','amizade','xadrez','primeiro','começo'] },
  { pattern: /namor|pedido|relacionamento/, terms: ['pedido','namoro','outubro','onze','bridgerton'] },
  { pattern: /serie|episodio|temporada|assist/, terms: ['bridgerton','série','episódio'] },
  { pattern: /filme|cinema|sessao/, terms: ['fantastica','chocolate','filme','cinema'] },
  { pattern: /musica|cancao|piano|playlist/, terms: ['piano','canção','música','playlist'] },
  { pattern: /passeio|sa[ií]da|viaj|sorvete/, terms: ['sorvete','passeio','parque','dia'] },
  { pattern: /campeonato|treino|esporte|taekwondo/, terms: ['taekwondo','campeonato','treino','orgulho'] },
  { pattern: /casa|morar|moradia|casinha/, terms: ['casinha','santa','maria','lar','casa'] },
];

export function normalizeMemoryText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stemPortuguese(token) {
  if (token.length > 5 && token.endsWith('mente')) return token.slice(0, -5);
  if (token.length > 5 && /(coes|sões)$/.test(token)) return token.slice(0, -4);
  if (token.length > 4 && /(es|ns)$/.test(token)) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s')) return token.slice(0, -1);
  return token;
}

function tokenize(value) {
  return normalizeMemoryText(value)
    .split(' ')
    .filter(token => token.length > 2 && !STOP_WORDS.has(token))
    .map(stemPortuguese);
}

function contentOf(memory) {
  return [
    memory?.title,
    memory?.text,
    memory?.summary,
    memory?.sourceLabel,
    ...(Array.isArray(memory?.tags) ? memory.tags : []),
  ].filter(Boolean).join(' ');
}

export function selectMemoriesForSpeaker(memories, question, activeSpeaker = 'Pietro') {
  const source = Array.isArray(memories) ? memories : [];
  const q = normalizeMemoryText(question);
  let author = null;
  if (/(emilly.*(contou|escreveu|falou)|(contou|escreveu|falou).*emilly)/.test(q)) author = 'Emilly';
  else if (/(pietro.*(contou|escreveu|falou)|(contou|escreveu|falou).*pietro)/.test(q)) author = 'Pietro';
  else if (/(eu contei|eu falei|minhas historias|minha historia|meu relato|o que eu disse|o que eu lembro|o que eu lembrei)/.test(q) && activeSpeaker !== 'Pietro e Emilly') author = activeSpeaker;
  if (!author) return source;
  return source.filter(memory => memory?.author === author || memory?.author === 'Pietro e Emilly');
}

export function searchMemories(memories, question, limit = 3) {
  const source = Array.isArray(memories) ? memories : [];
  const normalizedQuestion = normalizeMemoryText(question);
  const originalTokens = tokenize(question);
  if (!source.length || !originalTokens.length) return [];

  const queryWeights = new Map();
  for (const token of originalTokens) queryWeights.set(token, Math.max(queryWeights.get(token) || 0, 1));
  for (const group of EXPANSIONS) {
    if (!group.pattern.test(normalizedQuestion)) continue;
    for (const raw of group.terms) {
      const token = stemPortuguese(tokenize(raw)[0] || '');
      if (token && !queryWeights.has(token)) queryWeights.set(token, 0.34);
    }
  }

  const documents = source.map(memory => {
    const terms = tokenize(contentOf(memory));
    const titleTerms = new Set(tokenize(memory?.title || ''));
    const frequencies = new Map();
    for (const term of terms) frequencies.set(term, (frequencies.get(term) || 0) + 1);
    return { memory, terms, titleTerms, frequencies, length: terms.length || 1 };
  });
  const averageLength = documents.reduce((sum, doc) => sum + doc.length, 0) / Math.max(1, documents.length);
  const documentFrequency = new Map();
  for (const term of queryWeights.keys()) {
    documentFrequency.set(term, documents.reduce((count, doc) => count + (doc.frequencies.has(term) ? 1 : 0), 0));
  }

  const phrase = normalizedQuestion;
  const results = documents.map(doc => {
    let score = 0;
    const matchedTerms = [];
    for (const [term, queryWeight] of queryWeights) {
      const frequency = doc.frequencies.get(term) || 0;
      if (!frequency) continue;
      matchedTerms.push(term);
      const df = documentFrequency.get(term) || 0;
      const idf = Math.log(1 + (documents.length - df + 0.5) / (df + 0.5));
      const k1 = 1.2;
      const b = 0.72;
      const denominator = frequency + k1 * (1 - b + b * (doc.length / Math.max(1, averageLength)));
      score += queryWeight * idf * ((frequency * (k1 + 1)) / denominator);
      if (doc.titleTerms.has(term)) score += idf * queryWeight * 0.85;
    }

    const title = normalizeMemoryText(doc.memory?.title || '');
    if (title && phrase.length >= 5 && (title.includes(phrase) || phrase.includes(title))) score += 2.1;
    const queryCoverage = matchedTerms.filter(term => queryWeights.get(term) === 1).length / Math.max(1, originalTokens.length);
    if (/quando|data|dia|mes|ano|aniversario/.test(phrase) && Number.isFinite(Number(doc.memory?.ts))) score += 0.28;
    const timestamp = Number(doc.memory?.ts || 0);
    return {
      memory: doc.memory,
      score,
      confidence: score > 0 ? score / (score + 4.2) : 0,
      queryCoverage,
      matchedTerms,
      timestamp,
    };
  });

  return results
    .filter(result => result.score >= 0.48)
    .sort((a, b) => b.score - a.score || b.timestamp - a.timestamp)
    .slice(0, Math.max(1, Math.min(8, Number(limit) || 3)));
}
