# Estado do projeto

> Memória versionada do projeto. Lida em toda sessão do Claude (importada pelo `CLAUDE.md`).
> **Atualize ao fim de cada tarefa**: o que mudou, o que ficou pendente, decisões novas. Mantenha curto (até ~80 linhas); detalhes vão para `docs/`.

Última atualização: 24/10/2026 (Momento Revelação segue a ordem da semana; Sortes 30 s; Duelo 40 s + 12 s em que o outro duelista ainda responde por +100)

## No ar

- Site: https://licao-em-jogo.vercel.app (deploy manual: `npx vercel@latest deploy --prod`)
- Firebase `licao-em-jogo`: Realtime Database + login anônimo. Regras: `npx firebase-tools@latest deploy --only database`
- GitHub: https://github.com/SergioVSoriano/licao-em-jogo (branch `main`)

## Roteiro (ver `docs/05-arquitetura-base-de-conhecimento.md`)

- [x] **Fase 0, fundação** (17/10/2026): conteúdo em `conteudo/` (YAML) → validador + construtor (`scripts/conteudo/`) → `public/conteudo/` (JSON); carregamento sob demanda (`src/content/index.ts`); cada jogo declara `maxRoundsFor` e o planejador trava jogos sem material; seções no lugar dos dias; cobertura dos jogos no pacote; revelações gerais em rodízio; catálogo com o 4º trimestre (semana 3 aberta), 5 temas e 1 livro travados.
- [x] **Fase 1, menu de modos** (17/10/2026): Início com os modos e o atalho da lição da semana (`currentWeek`, a partir de `inicio` do trimestre no catálogo); tela `/escolher/:modo` com itens travados; planejador por pacote (`/criar/:id`, botão Trocar); perfis de grupo (`PROFILES` em `planner.ts`); opção sem pontos negativos (`settings.noNegative`, perfil Família); Rolo por pacote (`/rolo/:id`).
- [x] **Fase 2, curadoria** (17/10/2026): skill `/montar-pacote` (guarda o material do curador no caderno, organiza, marca o que é da IA); checagem de origem (`scripts/conteudo/origem.ts`: literal ✅, síntese com `base` 🟡, sem origem 🔴 = erro); `listasGeradas`; rascunhos não travam o build; página `/curadoria` (aprovar, remover, aprovar em grupo, publicar; API só em localhost no dev); CLI `conteudo:novo`, `conteudo:publicar` (exige terminal interativo), `conteudo:testar`; modelos comentados em `conteudo/modelos/`; extrator de PDF.
- [ ] **Fase 3, conteúdo**: preparar as próximas semanas, temas e capítulos com `/montar-pacote`.
  - Lição 4 (`licao-2026-t4-jovens-s04`, pasta `s04/`): **publicada em 24/10/2026**. Caderno com lição p. 30–38, vídeos do Pr. Dudu e anotações do curador; 8 verdades (dom–sex). 7 jogos com material, de propósito: Nuvem, Fruto Proibido (fácil, 3 proibidas), Verdade ou Falsificação, Três Sinais, perguntas (Sortes/Duelo), Sonho do Rei, Voz Profética. Preferências do curador para os próximos pacotes: perguntas sem "segundo o versículo X", ganchos de fora da lição só no Momento Revelação, Linha do Tempo só em semana narrativa.
- [ ] Fase 4, extras (combinar pacotes / livro todo, mapas temáticos, modo só telão, limpeza de salas) · Fase 5, se precisar (Blaze, contas de curadores).

Último deploy: 24/10/2026, commit "Lição 4: Profetas do NT…" (Lição 4 publicada). Contas, fluxo de deploy e testes: `docs/OPERACAO.md`.

## Pendências conhecidas

- **Decidir sobre `Lição Sabatina - resumo.txt`**: transcrições de vídeos de terceiros (canal Pr. Dudu Batista) estão no repositório **público** desde o 1º commit. As regras pedem fontes de terceiros fora do Git público: mover para `conteudo/fontes/` (privado) e tirar do Git, e decidir se limpa o histórico. Aguardando o usuário.
- **Backup do caderno**: `conteudo/fontes/` só existe neste PC. Criar um repositório privado para as fontes quando houver material.
- **Token do GitHub** (`SergioVSoriano`, criado em 17/10/2026, 7 dias) vence por volta de 24/10/2026: depois disso o push pede um novo (ver `docs/OPERACAO.md`).

- **Revisar o pacote da Lição 3**: ele é anterior às regras de curadoria (textos redigidos com IA a partir da lição e das anotações) e não tem caderno, então a checagem de origem não roda nele. O curador precisa revisar e preencher `curadoria.revisadoEm`. Se ganhar um caderno, muitos textos vão aparecer como 🔴 até serem reescritos a partir do material do curador.
- Avisos do validador na Lição 3: referências não bíblicas ("Testemunhos v.1", "Lição, sexta"…). São fontes válidas; decidir se viram um tipo de fonte próprio.
- A sala ainda não fixa a versão do pacote: se o conteúdo for atualizado no meio de uma partida, quem entrar depois recebe a versão nova.
- "Como funciona" e `/criar`, `/rolo` sem id usam o pacote padrão do catálogo (`padrao`).
- "O livro todo" aparece travado: juntar capítulos depende de combinar pacotes (fase 4).
- Itens com etiqueta de público (crianças, jovens…) ainda não existem; o perfil Família só evita os jogos mais complexos e os pontos negativos.
- A checagem de origem compara texto: não detecta se alguém (pessoa ou IA) gravar no caderno texto que não veio do curador. A skill proíbe; a garantia final é a revisão do curador na `/curadoria`.
- Citações de Ellen G. White/lição ainda não são conferidas palavra por palavra (só as referências bíblicas, como aviso).
- Firebase Spark: 100 conexões simultâneas (~6 salas de 15 pessoas). Salas antigas não são apagadas ainda.

## Decisões em vigor

- **Momento Revelação** (24/10/2026): o telão escolhe a revelação ao fim de cada jogo (`pickRevelation` em `session.ts`), seguindo a ordem das seções ao longo da partida (1º jogo = começo da semana, último = sexta) e, perto disso, uma verdade que o jogo trabalhou (`coberturaDosJogos`); o campo `jogo` da revelação virou só preferência. Notas de revelação não devem citar um jogo específico.

- Respostas às decisões em aberto do doc 05 (17/10/2026, sugestões adotadas): começar só com **Jovens** (o catálogo já aceita outros públicos); `conteudo/fontes/` fica **fora do Git público** (repositório privado separado quando houver fontes); versículos: o curador digita trechos curtos com referência; temas iniciais travados: Criação, Noé, Santuário, Elias, Daniel; livro: Profetas e Reis; a IA **pode** redigir itens factuais e mecânicos marcados `origem: gerado`, nunca interpretativos.
- Registro completo: `docs/decisoes/`.
