# 0001 · Conteúdo em pacotes YAML, gerados para JSON no build

- **Data:** 17/10/2026
- **Status:** em vigor

## Contexto

O jogo nasceu com um único pacote (Lição 3) escrito em TypeScript dentro de `src/content/`. Para crescer (semanas do trimestre, temas bíblicos, livros) sem mexer em código e sem IA interpretando a Bíblia, o conteúdo precisa ser editável por um curador, validado por regras fixas e carregado só quando escolhido.

## Decisão

1. O conteúdo de autoria fica em `conteudo/` em **YAML com chaves em português** (`pacote.yaml`, `jogos.yaml`, `reflexoes.yaml` por pacote; `catalogo.yaml`; `comum/`).
2. `scripts/conteudo/esquema.ts` (Zod) define o formato de autoria; `construir.ts` valida, cruza referências e converte para o formato do app (`src/content/types.ts`, chaves em inglês, como os jogos já usavam).
3. O resultado vai para `public/conteudo/` (`catalogo.json` + `pacotes/<id>.json`), gerado pelo plugin do Vite no `dev` e no `build`. Não é versionado no Git.
4. O app baixa o catálogo e o pacote sob demanda (`src/content/index.ts`). O pacote leva `?v=<hash>` do catálogo para não usar cache velho.
5. Cada jogo declara `maxRoundsFor(pack)`; o planejador trava o jogo quando o pacote não tem material para o mínimo de rodadas.
6. A cobertura de verdades por jogo saiu dos arquivos de jogo e foi para o pacote (`coberturaDosJogos`), porque os ids das verdades são de cada pacote.
7. `Truth.day` virou `Truth.section` + `pack.sections`: os dias da lição, as partes de uma história ou os blocos de um capítulo.

## Consequências

- Curar uma semana nova não exige tocar em jogos nem em telas.
- Zod e YAML são dependências só de desenvolvimento; o app não cresce com o conteúdo.
- Há duas formas do mesmo dado (autoria e app). Mudar um campo exige ajustar `esquema.ts`, `construir.ts` (função `paraApp`) e `types.ts`.
- A checagem de origem contra o caderno do curador ainda não existe (fase 2).
