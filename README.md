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
