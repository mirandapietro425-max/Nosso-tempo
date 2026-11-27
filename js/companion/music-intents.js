/* Classificador conservador de comandos musicais do Pestinha.
 * Perguntas e frases explicativas não executam ações no player.
 */
function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
const QUESTION_START = /^(como|qual|quais|o que|oq|por que|porque|quando|onde|me explica|explique|pode explicar|uma pergunta|pergunta sobre|quero saber|gostaria de saber)\b/;
const VERBS = /^(adiciona|adicionar|coloca|colocar|bota|botar|inclui|incluir|toca|tocar|reproduz|reproduzir|pesquisa|pesquisar|procura|procurar|busca|buscar|remove|remover|exclui|excluir|pausa|pausar|continua|continuar|retoma|retomar|proxima|proximo|avanca|volta|anterior)\b/;
function extractQuery(raw) {
  let query = String(raw || '').trim().replace(/^(?:ei\s+)?pestinha\b[,: ]*/i, '');
  query = query.replace(/^(?:por favor[, ]*)?/i, '');
  query = query.replace(/^(?:adiciona|adicionar|coloca|colocar|bota|botar|inclui|incluir|toca|tocar|reproduz|reproduzir|pesquisa|pesquisar|procura|procurar|busca|buscar|remove|remover|exclui|excluir)\b/i, '');
  query = query.replace(/^\s*(?:e\s+)?(?:adiciona|adicionar|coloca|colocar|bota|botar|inclui|incluir|toca|tocar|reproduz|reproduzir)\b/i, '');
  query = query.replace(/^\s*(?:(?:a|o|uma|um)\s+)?(?:m[uú]sica|faixa|can[cç][aã]o)\s+/i, '');
  query = query.replace(/\b(?:na playlist|no playlist|a playlist|à playlist|para a playlist|na fila|sem tocar|e tocar|e reproduzir|e adicionar|por favor|pra mim|para mim)\b/gi, ' ');
  return query.replace(/^[\s,:-]+|[\s,?!.-]+$/g, '').replace(/\s+/g, ' ').trim();
}
export function classifyMusicIntent(input) {
  const original = String(input || '').trim();
  const text = normalize(original);
  const commandText = original.replace(/^\s*(?:ei\s+)?pestinha\b[,: ]*/i, '');
  const normalizedCommand = normalize(commandText);
  const questionPunctuation = /[?？]/.test(original);
  if (!text || questionPunctuation || QUESTION_START.test(normalizedCommand) || (!VERBS.test(text) && !/^(?:ei )?pestinha\b/.test(text))) return null;
  const command = text.replace(/^(?:ei )?pestinha\s*/, '');
  if (/^(pausa|pausar)( a)?( musica)?$/.test(command)) return { type: 'pause' };
  if (/^(continua|continuar|retoma|retomar)( a)?( musica)?$/.test(command)) return { type: 'resume' };
  if (/^(proxima|proximo|avanca)( musica)?$/.test(command)) return { type: 'next' };
  if (/^(anterior|volta)( a)?( musica)?$/.test(command)) return { type: 'previous' };
  const hasAdd = /\b(adiciona|adicionar|coloca|colocar|bota|botar|inclui|incluir)\b/.test(text);
  const hasPlay = /\b(toca|tocar|reproduz|reproduzir)\b/.test(text);
  const hasSearch = /\b(pesquisa|pesquisar|procura|procurar|busca|buscar)\b/.test(text);
  const hasRemove = /\b(remove|remover|exclui|excluir)\b/.test(text);
  if (hasRemove) return { type: 'remove', query: extractQuery(original) };
  if (hasSearch) return { type: 'search', query: extractQuery(original) };
  if (hasAdd || hasPlay) return { type: 'track', actions: [...(hasAdd ? ['add'] : []), ...(hasPlay ? ['play'] : [])], query: extractQuery(original) };
  return null;
}
export function parseMusicChoice(input, total) {
  const text = normalize(input);
  const match = text.match(/^(?:a\s+)?(primeira|primeiro|segunda|segundo|terceira|terceiro|quarta|quarto|quinta|quinto|ultima|ultimo|[1-5])(?:\s+(?:musica|opcao|resultado))?$/);
  if (!match) return null;
  const words = { primeira: 1, primeiro: 1, segunda: 2, segundo: 2, terceira: 3, terceiro: 3, quarta: 4, quarto: 4, quinta: 5, quinto: 5, ultima: total, ultimo: total };
  const index = Number(match[1]) || words[match[1]];
  return Number.isInteger(index) && index >= 1 && index <= total ? index - 1 : null;
}
