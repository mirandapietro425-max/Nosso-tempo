# Auditoria da IA do Nosso Tempo — 27/11/2026

## Estado confirmado

- Repositório: `mirandapietro425-max/Nosso-tempo`.
- Projeto Vercel: `nosso-tempo`, ligado à branch `main`.
- Deploy de produção observado antes desta rodada: READY, commit `beaab96`, domínio `nosso-tempo-one.vercel.app`.
- O Pestinha não usa mais `OPENAI_API_KEY` nem expõe endpoint de conversa externa.
- A busca musical continua usando `YOUTUBE_API_KEY` server-side quando disponível e fallback direto para o YouTube.
- O site é um frontend estático com IndexedDB/local-db, módulos ES, service worker e uma função server-side apenas para pesquisa musical.

## Requisitos confirmados no chat “Boas-vindas ao ChatGPT”

- O Pestinha deve conversar de forma contínua, acompanhar perguntas de continuação e não agir apenas por comandos.
- Voz deve exigir ativação/consentimento claro; navegadores não permitem palavra-chave totalmente autônoma sem uma ativação prévia do usuário.
- Comandos musicais precisam distinguir pergunta de ação: adicionar sem tocar, tocar sem adicionar, adicionar e tocar, pesquisar com opções, pausar, continuar, próxima/anterior e remoção com confirmação.
- O modo local deve ser o caminho principal; não deve depender de IA externa paga.
- Aprendizado deve ser verificável; não afirmar treinamento permanente quando só houve feedback local.
- A publicação em produção deve ser feita somente após testar e confirmar o resultado.

## Lacunas encontradas nesta rodada

1. `companion.js` tinha um listener global de `pointerdown` e uma tentativa de auto-início se a permissão do microfone já estivesse concedida. Isso contradiz a ativação explícita e pode iniciar escuta em qualquer primeiro toque.
2. O fallback local `localUnknownReply()` ainda dizia que conversa livre exigia “Respostas naturais com IA”, embora o modo local devesse continuar utilizável.
3. O endpoint de chat aceitava memórias no payload sem exigir explicitamente o sinal de consentimento enviado pela interface.
4. Sem `YOUTUBE_API_KEY`, a busca só devolvia URL de busca direta, apesar de o player e a playlist local continuarem funcionais.

## Estratégia aplicada

- Tornar o modo local o único caminho de conversa, durável e offline-first; remover a dependência de OpenAI.
- Exigir clique no botão “Chamar Pestinha” para habilitar microfone; depois da ativação, a sessão de voz pode continuar sem repetir o nome por 45 segundos.
- Tornar o fallback local conversacional e honesto, sem prometer conhecimento que não existe.
- Consultar memórias relevantes diretamente no navegador, sem enviá-las para serviço externo.
- Usar resultados da playlist local para buscas musicais quando disponíveis e manter busca direta do YouTube como fallback honesto quando não há chave.

## Preferência atualizada pelo responsável

O responsável decidiu não pagar créditos nem depender de APIs de IA gigantes. O Pestinha agora conversa pelo caminho local, consulta normalmente as memórias no aparelho e mantém voz opt-in e música do YouTube. O aprendizado continua descrito com honestidade: feedback ajusta pesos e pontuações locais persistentes; não equivale a treinar permanentemente um modelo GPT.
