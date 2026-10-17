# Estado do projeto

> Memória versionada do projeto. Lida em toda sessão do Claude (importada pelo `CLAUDE.md`).
> **Atualize ao fim de cada tarefa**: o que mudou, o que ficou pendente, decisões novas. Mantenha curto (até ~80 linhas); detalhes vão para `docs/`.

Última atualização: 17/10/2026

## No ar

- Site: https://licao-em-jogo.vercel.app (deploy manual: `npx vercel@latest deploy --prod`)
- Firebase `licao-em-jogo`: Realtime Database + login anônimo. Regras: `npx firebase-tools@latest deploy --only database`
- GitHub: https://github.com/SergioVSoriano/licao-em-jogo (branch `main`)

## Roteiro (ver `docs/05-arquitetura-base-de-conhecimento.md`)

- [x] **Fase 0, fundação** (17/10/2026): conteúdo em `conteudo/` (YAML) → validador + construtor (`scripts/conteudo/`) → `public/conteudo/` (JSON); carregamento sob demanda (`src/content/index.ts`); cada jogo declara `maxRoundsFor` e o planejador trava jogos sem material; seções no lugar dos dias; cobertura dos jogos no pacote; revelações gerais em rodízio; catálogo com o 4º trimestre (semana 3 aberta), 5 temas e 1 livro travados.
- [x] **Fase 1, menu de modos** (17/10/2026): Início com os modos e o atalho da lição da semana (`currentWeek`, a partir de `inicio` do trimestre no catálogo); tela `/escolher/:modo` com itens travados; planejador por pacote (`/criar/:id`, botão Trocar); perfis de grupo (`PROFILES` em `planner.ts`); opção sem pontos negativos (`settings.noNegative`, perfil Família); Rolo por pacote (`/rolo/:id`).
- [ ] **Fase 2, curadoria**: skill `/montar-pacote`, checagem de origem contra `conteudo/fontes/`, página `/curadoria/:id`, `novo-pacote`.
- [ ] Fase 3, conteúdo · Fase 4, extras · Fase 5, se precisar.

## Pendências conhecidas

- **Revisar o pacote da Lição 3**: ele é anterior às regras de curadoria (textos redigidos com IA a partir da lição e das anotações). O curador precisa revisar e preencher `curadoria.revisadoEm`.
- Avisos do validador na Lição 3: referências não bíblicas ("Testemunhos v.1", "Lição, sexta"…). São fontes válidas; decidir se viram um tipo de fonte próprio.
- A sala ainda não fixa a versão do pacote: se o conteúdo for atualizado no meio de uma partida, quem entrar depois recebe a versão nova.
- "Como funciona" e `/criar`, `/rolo` sem id usam o pacote padrão do catálogo (`padrao`).
- "O livro todo" aparece travado: juntar capítulos depende de combinar pacotes (fase 4).
- Itens com etiqueta de público (crianças, jovens…) ainda não existem; o perfil Família só evita os jogos mais complexos e os pontos negativos.
- Firebase Spark: 100 conexões simultâneas (~6 salas de 15 pessoas). Salas antigas não são apagadas ainda.

## Decisões em vigor

- Respostas às decisões em aberto do doc 05 (17/10/2026, sugestões adotadas): começar só com **Jovens** (o catálogo já aceita outros públicos); `conteudo/fontes/` fica **fora do Git público** (repositório privado separado quando houver fontes); versículos: o curador digita trechos curtos com referência; temas iniciais travados: Criação, Noé, Santuário, Elias, Daniel; livro: Profetas e Reis; a IA **pode** redigir itens factuais e mecânicos marcados `origem: gerado`, nunca interpretativos.
- Registro completo: `docs/decisoes/`.
