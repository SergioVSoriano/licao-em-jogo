# Lição em Jogo

A lição da Escola Sabatina jovem como um jogo presencial: o **telão** (TV, projetor ou só o notebook) mostra perguntas, mapa e placar, e o **celular de cada um** vira o controle, no estilo Kahoot. São 12 minijogos, o mapa do santuário, o Momento Revelação depois de cada jogo e um planejador que encaixa tudo no tempo da lição.

> Documentação de design: [docs/](docs/) (conteúdo da lição, referências, game design e banco de conteúdo).

## Rodar no computador

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`.

Sem Firebase configurado, o jogo roda em **modo demonstração**:
- o telão fica numa aba e os jogadores em outras abas **do mesmo navegador**;
- na sala de espera, o botão **🤖 +3 robôs** adiciona jogadores automáticos para testar sozinho.

## Jogar com os celulares da turma (Firebase, grátis)

1. Crie um projeto em <https://console.firebase.google.com> (plano Spark, gratuito).
2. **Build → Authentication → Sign-in method:** ative **Anônimo**.
3. **Build → Realtime Database:** crie o banco (região `us-central1` ou a mais próxima). Na aba **Regras**, cole o conteúdo de [`database.rules.json`](database.rules.json) e publique.
4. **Configurações do projeto → Seus apps → Web (</>):** registre um app e copie a configuração.
5. Copie `.env.example` para `.env.local` e preencha:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_DATABASE_URL=https://SEU-PROJETO-default-rtdb.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
6. Rode de novo `npm run dev`. O aviso de "modo demonstração" some.

> A `apiKey` do Firebase Web não é segredo: quem protege os dados são as regras do `database.rules.json` (só o telão escreve o estado do jogo e cada jogador só lê o próprio papel secreto).

## Publicar na Vercel (grátis)

1. Suba esta pasta para um repositório no GitHub (o PDF da lição fica fora por causa do `.gitignore`).
2. Em <https://vercel.com/new>, importe o repositório. O framework **Vite** é detectado sozinho.
3. Em **Settings → Environment Variables**, cadastre as 5 variáveis `VITE_FIREBASE_*`.
4. Faça o deploy. O QR Code do telão aponta automaticamente para `https://seu-projeto.vercel.app/j/PIN`.
5. No Firebase, em **Authentication → Settings → Authorized domains**, adicione `seu-projeto.vercel.app`.

O `vercel.json` já redireciona todas as rotas para o app (`/host/...`, `/j/...`, `/f/...`).

## Como usar na classe

1. **Antes da aula:** abra o site no notebook → **Criar sala** → escolha o tempo (ex.: 35 min) e os jogos → **Abrir sala**. A turma entra pelo QR enquanto chega.
2. **Controle no celular (opcional):** no telão, clique em 📲 e leia o QR com o seu celular para avançar, julgar ✓/✗ e ver as notas de condução.
3. **Atalhos:** `Espaço` avança · `1`/`2` acerto/erro nos jogos falados · `F` tela cheia · `M` som.
4. Se a internet cair, basta abrir o mesmo link de novo: o telão retoma de onde parou e cada jogador volta para o próprio personagem.

## Estrutura

```
src/
  content/      pacote da lição (perguntas, cartas, verdades, estações…)
  engine/       regras da sessão, pontuação → passos, planejador de tempo
  games/        os 12 minijogos (lógica + tela do telão + tela do celular)
  net/          tempo real: Firebase ou modo demonstração (BroadcastChannel)
  screens/      Início, Como funciona, Planejador, Telão, Jogador, Controle, Rolo
  ui/           design system: botões 3D, avatares SVG, mascote Lume, mapa do santuário
```

### Nova lição, novo pacote
Copie `src/content/l03-profetas.ts`, troque o conteúdo e registre o novo pacote em `src/content/index.ts`. Os jogos leem tudo do pacote.

## Teste visual automático (simulação de uma partida)

Com o servidor rodando (`npm run dev`), em outro terminal:

```bash
npm run simular
```

O script abre o Microsoft Edge em modo invisível com 6 abas: 1 telão, 4 celulares (Ana, Bruno, Carla e Davi) e o controle do facilitador, mais 3 robôs. Ele joga os 12 jogos agindo em cada papel e gera [docs/testes/RELATORIO.md](docs/testes/RELATORIO.md) com os prints em `docs/testes/prints/`. Leva cerca de 20 minutos. Para usar outro endereço: `BASE=http://localhost:5174 npm run simular`; para ver o navegador: `HEADED=1 npm run simular`.

## No ar (produção)

- Site: https://licao-em-jogo.vercel.app (Vercel, projeto `licao-em-jogo`)
- Firebase: projeto `licao-em-jogo` (Realtime Database `licao-em-jogo-default-rtdb` + login anônimo). As regras ficam em `database.rules.json`.
- Variáveis `VITE_FIREBASE_*` estão no painel da Vercel (Production) e em `.env.local` para desenvolvimento.
- Atualizar o site: `npx vercel@latest deploy --prod`. Atualizar as regras: `npx firebase-tools@latest deploy --only database`.
- Teste online (telão + 3 celulares em contextos isolados): `BASE=https://licao-em-jogo.vercel.app npm run testar:online`.
