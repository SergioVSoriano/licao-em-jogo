# Lição em Jogo

Jogo presencial estilo Kahoot para a Escola Sabatina, PGs e famílias: o **telão** (notebook/TV) conduz e cada **celular** joga. 12 minijogos, mapa do santuário, Momento Revelação, planejador de tempo. Público inicial: jovens de 15 a 30 anos.

@docs/ESTADO.md

## Regras invioláveis

1. **A IA não interpreta a Bíblia.** Reflexões, aplicações, ideias, perguntas de discussão e enquetes vêm só do caderno do curador (`conteudo/fontes/<id>/`). Para montar conteúdo, use a skill **/montar-pacote** e siga `conteudo/REGRAS.md` à risca. O que a IA escreve leva `origem: gerado` (sínteses também levam `base` com trechos literais do caderno). Nunca: `origem: curador`, `status: publicado`, `curadoria.revisadoEm`, chamar `/__curadoria` ou rodar `conteudo:publicar`. Aprovar e publicar são do curador, na página `/curadoria`.
2. **Nenhuma IA dentro do jogo.** O app é determinístico e não chama APIs de IA. Não proponha "IA que lê PDF e monta o jogo".
3. **Gratuito primeiro.** Vercel (Hobby), Firebase (Spark), GitHub. Não adicione serviço pago sem pedido explícito.
4. Commit, push e deploy só quando o usuário pedir.

## Comandos

```bash
npm run dev                 # localhost:5173 (gera public/conteudo/ e recarrega ao editar conteudo/*.yaml)
npm run typecheck           # tsc -b (app + scripts de Node)
npm run build               # typecheck + vite build
npm run conteudo:validar    # valida conteudo/ sem gerar nada
npm run conteudo:construir  # valida e gera public/conteudo/
npm run conteudo:validar -- <id>   # relatório de um pacote (origem, pendências)
npm run conteudo:novo -- <id> "<título>"   # pacote rascunho + caderno, a partir de conteudo/modelos/
npm run conteudo:testar     # teste do fluxo de curadoria numa cópia temporária
npm run testar:online       # telão + 3 celulares isolados (BASE=http://localhost:5173 ou a URL do site)
npm run simular             # 12 jogos com prints (~20 min). Precisa de servidor em MODO DEMONSTRAÇÃO:
                            #   VITE_FIREBASE_API_KEY= VITE_FIREBASE_DATABASE_URL= npx vite --port 5174
                            #   BASE=http://localhost:5174 OUT=<pasta> npm run simular  (OUT evita sobrescrever docs/testes)
```

No Windows/PowerShell use `npx.cmd`/`npm.cmd` se a política de scripts bloquear `npx`.

## Mapa

```
conteudo/          AUTORIA (YAML, chaves em pt-BR): catalogo.yaml, comum/, modelos/, pacotes/<tipo>/…/{pacote,jogos,reflexoes}.yaml
                   fontes/<id>/ = caderno do curador (o material dele, como veio), privado, fora do Git
scripts/conteudo/  esquema.ts (Zod), construir.ts (valida + converte), origem.ts (checagem de origem), editar.ts (novo/aprovar/publicar),
                   cli.ts, vite-plugin.ts (gera no dev/build + API /__curadoria só em localhost), extrair-texto.py (PDF → txt)
.claude/skills/montar-pacote/  a skill que transforma o material do curador em pacote
public/conteudo/   GERADO: catalogo.json + pacotes/<id>.json. Nunca edite à mão
src/content/       types.ts (formato do app, chaves em inglês) + index.ts (loadPack/usePack/getPack)
src/engine/        session.ts (reduce: máquina de estados do telão), planner.ts (tempo, capacidade), types.ts (GameDef)
src/games/         12 plugins GameDef: lógica + HostView + PlayerView + bot + maxRoundsFor
src/net/           Firebase (produção) ou modo demonstração (BroadcastChannel entre abas)
src/screens/       Home, Choose, HowItWorks, Planner, Host (telão), Play (celular), Judge (controle), Rolo, Curadoria
src/ui/            design system "Tabernáculo", avatares SVG, mascote Lume, mapa do santuário
docs/              01–05 planejamento; ESTADO.md; decisoes/; testes/ (relatório com prints)
```

- **Telão é a autoridade** (host-authoritative): só ele roda `reduce`; celulares enviam inputs. Estado público/privado/snapshot no Realtime DB (`database.rules.json`).
- O motor usa `getPack()` **síncrono**: toda tela que usa o motor espera `usePack()`/`loadPack()` antes.
- Novo campo de conteúdo: `scripts/conteudo/esquema.ts` + `paraApp()` em `construir.ts` + `src/content/types.ts`.
- Novo jogo: arquivo em `src/games/`, registrar em `src/games/index.ts`, declarar `maxRoundsFor`, `howTo`, `bot`.

## Convenções

- Interface, conteúdo, docs, mensagens de commit e respostas ao usuário em **português do Brasil**. Código do app em inglês (como já está); scripts de conteúdo em português.
- TypeScript estrito. Siga o estilo do arquivo vizinho (sem ponto e vírgula, aspas simples, 2 espaços, linhas longas aceitas).
- Cores e tipografia pelos tokens CSS do design system (`src/styles.css`); telão escala com `em` dentro de `.stage`.
- Dependências com versão exata e publicada há pelo menos duas semanas.
- Antes de dizer que terminou: `npm run typecheck`, `npm run conteudo:validar` e, se mexeu em tela, abrir no navegador (ou `npm run testar:online`).

## Memória e contexto

- `docs/ESTADO.md` é a memória do projeto: **atualize ao fim de cada tarefa** (feito, pendente, decisões). Decisão de arquitetura nova vira nota em `docs/decisoes/NNNN-titulo.md`.
- Uma sessão por tarefa; para mudar de assunto, `/clear`. Se a conversa ficar longa, `/compact` com foco (ex.: "manter arquivos alterados e decisões"). Este arquivo e o ESTADO voltam sempre depois de compactar.
