# Operação: contas, deploy, testes e armadilhas do ambiente

> O que não está no código e seria perdido entre sessões. Atualize quando mudar uma conta, um comando ou descobrir uma armadilha nova.

## Contas e serviços

| Serviço | Conta / identificador | Observações |
| --- | --- | --- |
| GitHub | **SergioVSoriano** · repo `SergioVSoriano/licao-em-jogo` (público, branch `main`) | Commits com o e-mail **sergio.soriano@ufpe.br** (config local do repo). O `gh` deste PC tem 3 contas: `SergioVSoriano` (ativa, token pessoal de 7 dias criado em 17/10/2026, escopos `repo` e `read:org`), `sergiobisoriano` e `suportefh`. Antes de push: `gh api user --jq .login` deve dar `SergioVSoriano`; se não, `gh auth switch --user SergioVSoriano`. Token vencido: criar outro em github.com/settings/tokens (classic, `repo` + `read:org`) e rodar no terminal `gh auth login --hostname github.com --git-protocol https --with-token`, colar, Enter, Ctrl+Z, Enter |
| Firebase | conta Google **sergiosori12@gmail.com** · projeto `licao-em-jogo` | Realtime Database `licao-em-jogo-default-rtdb` (us-central1), login anônimo ativo, app web `1:373030793549:web:c83474f5457c396567c704`. Plano Spark (grátis). Regras em `database.rules.json` |
| Vercel | conta **sergiosoriano-8607** · projeto `licao-em-jogo` (`.vercel/project.json`) | Site https://licao-em-jogo.vercel.app. Plano Hobby (grátis, uso não comercial). Deploy **manual** (o projeto não está ligado ao GitHub) |

As 5 variáveis `VITE_FIREBASE_*` estão em `.env.local` (fora do Git) e na Vercel (Production, tipo **config**: a chave web do Firebase é pública por natureza; quem protege é `database.rules.json`). Se a CLI da Vercel recusar uma variável `VITE_` "parecida com credencial", use `--type config --value "<valor>" --yes`.

## Publicar uma mudança (o fluxo de sempre)

O usuário costuma pedir "commit, push e deploy" juntos. Só faça quando ele pedir.

```bash
npm run typecheck && npm run conteudo:validar     # antes de tudo
git add -A && git commit                          # mensagem em pt-BR + Co-Authored-By indicado pelo Claude Code
git push                                          # conferir antes a conta ativa do gh
npx vercel@latest deploy --prod --yes             # o build da Vercel gera public/conteudo/ pelo plugin do Vite
```

Depois do deploy, confira o site: `curl` nas rotas (`/`, `/escolher/licao`, `/conteudo/catalogo.json`) e uma partida curta (`npm run testar:partida`, abaixo).

- `.vercelignore` precisa **manter** `scripts/conteudo/` (o `vite.config.ts` importa o plugin de lá). Já excluiu a pasta `scripts/` inteira uma vez e isso quebraria o build.
- Regras do banco mudaram: `npx firebase-tools@latest deploy --only database` (login: `npx firebase-tools@latest login`, precisa de terminal interativo).

## Testes

| Comando | O que faz | Quando |
| --- | --- | --- |
| `npm run typecheck` | `tsc -b` (app + scripts de Node) | sempre |
| `npm run conteudo:validar [id]` | valida conteúdo; com id, relatório de origem e pendências | sempre que mexer em `conteudo/` |
| `npm run conteudo:testar` | fluxo de curadoria completo numa cópia temporária (16 verificações) | ao mexer em `scripts/conteudo/` |
| `npm run testar:online` | telão + 3 celulares em navegadores isolados entram na sala pelo Firebase | depois de deploy ou mudança de rede |
| `npm run testar:partida` | telão + 3 celulares jogam até Momento Revelação e mapa; olha Início, Como funciona e Rolo | depois de mexer no motor, nas telas ou no conteúdo |
| `npm run simular` | os 12 jogos com todos os papéis e ~170 prints (~20 min) | antes de mudanças grandes; precisa de servidor em **modo demonstração** |

Todos usam Playwright com o Microsoft Edge (`channel: 'msedge'`) e `BASE=<url>` (padrão `http://localhost:5173`). A simulação lê o estado no `localStorage`, por isso só funciona sem Firebase:

```bash
VITE_FIREBASE_API_KEY= VITE_FIREBASE_DATABASE_URL= npx vite --port 5174
BASE=http://localhost:5174 OUT=<pasta-temporária> npm run simular
```

Sem `OUT`, ela sobrescreve `docs/testes/` (relatório e prints versionados).

## Armadilhas do ambiente (Windows deste PC)

- **PowerShell bloqueia `npx.ps1`**: no terminal do usuário use `npx.cmd` / `npm.cmd`.
- Logins interativos (`firebase login`, `vercel login`, `gh auth login`) precisam do terminal do usuário (aba do Terminal do app), não do Bash do Claude. O fluxo `--web` do `gh` travou duas vezes em "Press Enter"; o token pessoal (`--with-token`) funcionou.
- **Heredocs grandes no Bash do Claude falham** ("unexpected EOF"): para arquivos grandes use a ferramenta de escrita; para edições em lote, grave um script Python num arquivo temporário e rode `python -I arquivo.py`.
- `python -I` ignora `PYTHONIOENCODING`: evite caracteres fora do cp1252 (ex.: `→`) em `print`.
- Caminhos com acento (`Sérgio`) quebram algumas ferramentas; o scratchpad usa `C:/Users/SRGIOS~1/...`.
- Scripts Node que usam `playwright-core` precisam ficar dentro do projeto (ex.: `scripts/_tmp.mjs`) para achar o pacote; apague depois.
- O servidor de dev (`npm run dev`) já roda **com Firebase** (por causa do `.env.local`). Para o modo demonstração, suba outro na porta 5174 como acima.
- O painel de navegador do app às vezes corta capturas e fica em segundo plano; para prints confiáveis use os scripts com Playwright.

## Material de origem

- `Lição Jovens 2026 4 Trimestre.pdf` (raiz, fora do Git por `*.pdf`): a lição do 4º trimestre de 2026 inteira. Títulos e datas das 13 semanas já estão no `catalogo.yaml`. Para extrair páginas: `python scripts/conteudo/extrair-texto.py "<pdf>" <saida.txt> 21-29` (a Lição 3 começa na página 21; cada lição tem ~9 páginas: 3, 12, 21, 30, 39, 48, 57, 66, 75, 84, 93, 102, 111).
- `Lição Sabatina - resumo.txt` (raiz): transcrições do canal do Pr. Dudu Batista sobre a Lição 3, usadas para montar o pacote da Lição 3. **Está versionado no repositório público** (desde o 1º commit); ver pendência no `ESTADO.md`.
- `conteudo/fontes/` (privado, fora do Git): cadernos dos curadores. Não tem backup automático.
