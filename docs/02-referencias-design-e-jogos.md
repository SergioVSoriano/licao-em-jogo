# 02 · Referências: jogos, mecânicas e design

> O que copiar (mecânica e sensação) e o que **não** copiar (marcas, nomes, assets) de cada referência.

---

## 1. Kahoot! — o modelo de "telão + celular"

### Como funciona
1. **Host** (professor) abre o jogo num computador ligado ao **telão**. Aparecem um **PIN** e um **QR Code**.
2. Os **jogadores** entram pelo celular (kahoot.it) digitando PIN + apelido. **Não precisa de conta.**
3. **Lobby:** os nomes vão surgindo no telão, com música animada. O host clica em "Iniciar".
4. **Ciclo da pergunta:**
   - O telão mostra a pergunta e o timer.
   - Os celulares mostram **apenas 4 botões coloridos com formas** (o conteúdo fica no telão). Isso obriga todo mundo a olhar para o mesmo lugar e gera o momento coletivo.
   - Depois: distribuição das respostas (gráfico de barras), a resposta certa e o **placar com o top 5**.
   - O celular de cada um mostra feedback pessoal ("Correto! +874", sequência, posição).
5. **Pódio** final animado com os 3 primeiros.

### Pontuação (documentação oficial)
- Até **1.000 pontos** por pergunta, decrescendo com o tempo de resposta:
  **`pontos = round(1000 × (1 − (t_resposta / t_total) / 2))`**
  Responder instantaneamente vale ~1000 e responder no último segundo vale ~500. Errar vale 0.
- Exemplo oficial: 2 s num timer de 30 s = 967 pontos.
- Existe o modo **"precisão"**, em que só o acerto conta.
- **Bônus de sequência** (*answer streak*): existe para desestimular o chute. A fórmula exata não é pública. Referências de terceiros usam **+100 por acerto seguido, até +500**.

### Linguagem visual
- 4 respostas = **cor + forma**: ▲ vermelho · ◆ azul · ● amarelo · ■ verde. A forma redundante ajuda daltônicos e permite que o celular mostre só a forma.
- Cores aproximadas, citadas por terceiros e não verificadas no guia oficial: vermelho `#E21B3C`, azul `#1368CE`, amarelo `#D89E00`, verde `#26890C`. Fundo do host em roxo (`#46178F`) com padrões geométricos.
- Tipografia pesada, bold, sempre em caixa grande e legível à distância.
- Música de lobby e de contagem que aumenta a tensão, efeitos sonoros de acerto e erro e suspense antes do placar.

### O que levar para o nosso jogo
✅ PIN + QR, sem login · ✅ conteúdo no telão e controle no celular · ✅ fórmula de velocidade · ✅ sequência · ✅ placar a cada rodada · ✅ pódio · ✅ cor + forma nas alternativas.
❌ Não usar nome, logo, roxo exato nem a música do Kahoot.

---

## 2. Duolingo — o modelo de "aprendizado gostoso"

### Design system (referências de terceiros; o guia oficial não é público)
| Token | Cor | Uso |
|---|---|---|
| Feather Green | `#58CC02` (sombra `#58A700`) | Ação primária e acerto |
| Macaw (azul) | `#1CB0F6` | Links e destaques |
| Cardinal (vermelho) | `#FF4B4B` | Erro |
| Bee (amarelo) | `#FFC800` | Conquistas e XP |
| Fox (laranja) | `#FF9600` | Sequência (streak) |
| Beetle (roxo) | `#CE82FF` | Premium e destaque |
| Eel | `#4B4B4B` | Texto |
| Wolf / Hare / Swan | `#777` / `#AFAFAF` / `#E5E5E5` | Texto secundário, desabilitado, bordas |

- **Tipografia:** *Feather Bold* (proprietária) nos títulos e *DIN Next Rounded* no texto. Alternativa gratuita com sensação parecida: **Nunito 800/900**.
- **Botões "3D":** cantos bem arredondados (12-16 px) e uma **borda inferior sólida mais escura** (`box-shadow: 0 4px 0 <cor-sombra>`). No clique, o botão "afunda" (`translateY(4px)` e a sombra zera). Isso dá a sensação tátil, de brinquedo.
- **Feedback em "bottom sheet":** depois de responder, sobe uma faixa **verde ("Mandou bem!")** ou **vermelha ("Resposta correta: …")**, com som e um botão "Continuar".
- **Trilha de aprendizado (path):** nós circulares ligados por um caminho sinuoso, com o nó atual pulsando. 👉 Serve de modelo direto para o **mapa do santuário**.
- **Mascote (Duo)** com personalidade e reações.
- **Microgamificação:** XP, ofensiva (streak), ligas semanais, baús, corações e animações de comemoração (confete, personagem pulando).
- **Tom de voz:** bem-humorado, encorajador e nunca humilhante. O erro vira aprendizado.

### O que levar para o nosso jogo
✅ Botões 3D · ✅ feedback com explicação curta (cada resposta revela o "porquê" e a referência bíblica) · ✅ trilha de nós como mapa · ✅ mascote · ✅ tom encorajador · ✅ cores vivas e chapadas, ilustração flat arredondada.
❌ Não usar a coruja, a fonte Feather nem o verde exato como cor de marca.

---

## 3. Jackbox Party Pack — o modelo de "celular como controle social"
- O celular é um **controle privado**: cada um recebe informação secreta (papel, palavra, desenho). É ideal para *Sonho do Rei*, *Fruto Proibido* e *Disfarçados*.
- **Modo plateia:** quem não está jogando a vez ainda vota e influencia. 👉 Princípio "**ninguém fica parado**".
- Partidas curtas (15-20 min), regras explicadas pelo próprio jogo em 20-30 s, filtro de conteúdo e opção de "família".

## 4. "7 a 0" (jogo viral da Copa 2026)
- Roda **no navegador, sem download, sem cadastro e sem pagamento**. Basta abrir o link.
- É um *draft* de 11 rodadas para montar o time e simular 7 jogos. Partidas rápidas, que dão vontade de jogar de novo e são compartilháveis.
- 👉 O que levar: **atrito zero** (link → jogar), rodadas curtas e um **resultado compartilhável** (card para story com avatar e resultado).
- Observação: o 7 a 0 é single-player. A parte multiplayer vem do modelo Kahoot.

## 5. Jogos de mesa que inspiram os minijogos

| Jogo | Mecânica essencial | Como adaptamos |
|---|---|---|
| **Tapple** | Roda de letras e tema. Na sua vez, aperte uma letra, diga uma palavra do tema que comece com ela e trave a letra, tudo em 10 s. Quem não consegue é eliminado da rodada | **Acróstico 119**: letra escolhida no celular, roda no telão, validação pelo facilitador ou pela plateia |
| **Taboo / Imagem & Ação (palavras)** | Explicar uma palavra sem dizer as proibidas. O adversário tem um **buzzer** | **Fruto Proibido**: a carta aparece só no celular de quem explica, e um "fiscal" do time adversário tem o buzzer no celular |
| **When I Dream** | O **Sonhador** fica de olhos fechados. Os espíritos dão pistas de uma palavra: **Fadas** ajudam, **Bichos-papões** atrapalham e **Homens de Areia** buscam o equilíbrio. Depois o sonhador **reconta o sonho** (bônus se lembrar de tudo) | **O Sonho do Rei**: Rei, Anjos, Falsos Profetas e Magos da Corte, com papéis secretos no celular. O reconto vira "Interpretação", e o bônus de "Discernimento" vale para quem identificar um falso profeta |
| **Insuspeitos / Cara a Cara** | Grade de rostos e dedução por pistas | **Disfarçados**: grade de personagens bíblicos no telão, um informante dá pistas e cada um vota no celular |
| **"Qual é a palavra?" / 3 pistas (Silvio Santos)** | Pistas da mais difícil para a mais fácil; quanto antes acertar, mais pontos | **Três Sinais** |
| **Show do Milhão** | Pergunta individual com risco e "ajudas" | **Lançar Sortes**, com a ajuda "Pergunte à plateia" |
| **Mímica / Imagem & Ação** | Encenar para o time adivinhar | **Atos Proféticos** (os profetas também encenavam mensagens: o jugo de Jeremias, Ez 4) |

---

## 6. Identidade visual adventista — como se alinhar sem copiar
- Em 2017 a Associação Geral adotou um **sistema global de identidade**:
  - Tipografia **Advent Sans**, adaptada da **Noto Sans**. 👉 Usaremos **Noto Sans** no texto corrido, como um aceno direto à identidade da igreja.
  - **Creation Grid**: grade de **7 colunas**, sendo a 7ª a "coluna do sábado", reservada ao símbolo. 👉 Usaremos o "7" como motivo: 7 dias da lição no **medidor de cobertura** e 7 estações no mapa.
  - **Cores por princípio**, não uma paleta fixa: cada região escolhe cores culturalmente adequadas.
- ⚠️ **Não usar o logotipo oficial da IASD nem a marca Feliz7Play** sem autorização. O jogo deve parecer "da família", mas com marca própria.
- 💡 **Paleta temática bíblica:** as cortinas do tabernáculo eram de **azul, púrpura, carmesim e linho fino** (Êx 26:1), com **ouro** no interior, **bronze** no átrio e **madeira de acácia**. Isso nos dá uma paleta original, reverente e vibrante, que se encaixa por acaso nas 4 cores do Kahoot (veja o design system no doc 03).

---

## 7. Tecnologia (pesquisa de hospedagem e tempo real)
- **Vercel:** hospedagem estática gratuita (plano Hobby). WebSockets nas Functions estão só em *beta pública* (jun/2026) e as conexões caem em ~5 min. **Não serve como servidor de jogo.** Para tempo real, a própria Vercel recomenda um provedor externo.
- **Supabase Realtime (grátis):** 200 conexões simultâneas, 100 mensagens/s e payload de 256 KB. ⚠️ No plano gratuito, o projeto **pausa após inatividade** (cerca de 1 semana), o que é arriscado num uso semanal. Dá para contornar com um "ping" agendado.
- **Firebase Realtime Database (plano Spark, grátis):** ~100 conexões simultâneas, 1 GB armazenado, ~10 GB/mês de download, `onDisconnect` para presença, *server timestamp* para cronometrar com justiça e Anonymous Auth com regras de segurança por usuário. Não pausa. **(Confirmar os limites atuais no console antes de produção.)**
- **GitHub Pages:** grátis, mas sem rewrite de SPA (exige HashRouter ou o truque do 404). Funciona como alternativa.

---

## Fontes
- [Kahoot — How points work (fórmula oficial)](https://support.kahoot.com/hc/articles/115002303908)
- [Kahoot Brand Guide (PDF)](https://kahoot.com/files/2017/08/Kahoot-BrandGuide-July2019.pdf)
- [Kahoot — Comunidade: streak bonus](https://support.kahoot.com/hc/en-us/community/posts/360033686653/comments/360012411393)
- [UC Davis — regras de trivia com streak (referência de terceiros)](https://campusrecreation.ucdavis.edu/sites/g/files/dgvnsk6556/files/files/event/Aggies%20at%20Home%20Trivia%20Rules.pdf)
- [Duolingo: A Brand Breakdown (Canny Creative)](https://www.canny-creative.com/brand-breakdown/brand/duolingo/)
- [Design system Duolingo (open-design)](https://open-design.ai/plugins/design-system-duolingo/)
- [Duolingo design system (opendesigner.io)](https://opendesigner.io/design-systems/duolingo)
- [Como jogar o 7 a 0 (NSC Total)](https://www.nsctotal.com.br/noticias/como-jogar-o-7-a-0-jogo-que-viralizou-na-internet)
- [Jogo 7 a 0 viraliza (Diário de Pernambuco)](https://www.diariodepernambuco.com.br/esportes-dp/copa-do-mundo/2026/06/11715924-jogo-7-a-0-viraliza-com-a-chance-de-escalar-jogadores-historicos-da-copa-do-mundo-confira.html)
- [When I Dream — regras (gamerules.com)](https://gamerules.com/rules/when-i-dream/)
- [When I Dream — rulebook (rulespal)](https://rulespal.com/when-i-dream/rulebook)
- [Adventist Church adopts new global visual identity system (Adventist Review)](https://adventistreview.org/news/adventist-church-adopts-new-global-visual-identity-system/)
- [Advent Sans](https://info.adventist.ua/advent_sans/?print=pdf)
- [Supabase Realtime Limits](https://supabase.com/docs/guides/realtime/limits)
- [Vercel — WebSocket support (public beta)](https://vercel.com/changelog/websocket-support-is-now-in-public-beta)
- [Vercel — Do Serverless Functions support WebSockets?](https://vercel.com/guides/do-vercel-serverless-functions-support-websocket-connections)
- [Teste das WebSockets na Vercel (Classmethod)](https://dev.classmethod.jp/en/articles/vercel-functions-websocket-public-beta-verification/)
