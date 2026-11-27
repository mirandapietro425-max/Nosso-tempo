# Auditoria da IA do Nosso Tempo — 27/11/2026

## Estado confirmado

- Repositório: `mirandapietro425-max/Nosso-tempo`.
- Projeto Vercel: `nosso-tempo`, ligado à branch `main`.
- Deploy de produção observado: READY, commit `dab4de6`, domínio `nosso-tempo-one.vercel.app`.
- Variáveis de ambiente Vercel observadas: nenhuma; portanto `OPENAI_API_KEY` e `YOUTUBE_API_KEY` não estão configuradas neste projeto.
- O site é um frontend estático com IndexedDB/local-db, módulos ES, service worker e funções server-side em `api/` que ficam indisponíveis sem configuração/servidor.

## Requisitos confirmados no chat “Boas-vindas ao ChatGPT”

- O Pestinha deve conversar de forma contínua, acompanhar perguntas de continuação e não agir apenas por comandos.
- Voz deve exigir ativação/consentimento claro; navegadores não permitem palavra-chave totalmente autônoma sem uma ativação prévia do usuário.
- Comandos musicais precisam distinguir pergunta de ação: adicionar sem tocar, tocar sem adicionar, adicionar e tocar, pesquisar com opções, pausar, continuar, próxima/anterior e remoção com confirmação.
- Consentimento para IA externa e para enviar memórias pessoais deve ser separado.
- Aprendizado deve ser verificável; não afirmar treinamento permanente quando só houve feedback local.
- A publicação em produção deve ser feita somente após testar e confirmar o resultado.

## Lacunas encontradas nesta rodada

1. `companion.js` tinha um listener global de `pointerdown` e uma tentativa de auto-início se a permissão do microfone já estivesse concedida. Isso contradiz a ativação explícita e pode iniciar escuta em qualquer primeiro toque.
2. O fallback local `localUnknownReply()` ainda dizia que conversa livre exigia “Respostas naturais com IA”, embora o modo local devesse continuar utilizável.
3. O endpoint de chat aceitava memórias no payload sem exigir explicitamente o sinal de consentimento enviado pela interface.
4. Sem `YOUTUBE_API_KEY`, a busca só devolvia URL de busca direta, apesar de o player e a playlist local continuarem funcionais.

## Estratégia aplicada

- Manter o modo local como caminho durável e offline-first; a IA externa continua opcional.
- Exigir clique no botão “Chamar Pestinha” para habilitar microfone; depois da ativação, a sessão de voz pode continuar sem repetir o nome por 45 segundos.
- Tornar o fallback local conversacional e honesto, sem prometer conhecimento que não existe.
- Reforçar no backend que memórias só entram no contexto quando `aiMemoryConsent === true`.
- Usar resultados da playlist local para buscas musicais quando disponíveis e manter busca direta do YouTube como fallback honesto quando não há chave.
