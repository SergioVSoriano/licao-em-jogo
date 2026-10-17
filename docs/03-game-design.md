# 03 · Game Design Document — "Átrio: a lição em jogo" (nome provisório)

> Planejamento completo, de ponta a ponta. **Nada aqui está implementado ainda.** Este é o documento que guia a construção no próximo passo.

---

## 0. Análise do brainstorming

### O que já está muito bom
- **O formato Kahoot (telão + celular via QR)** é o certo para uma classe presencial: atrito zero e atenção coletiva no mesmo lugar.
- **O mapa do santuário** é a melhor ideia do brainstorm. É temático, ensina por si só (cada móvel tem significado) e funciona como barra de progresso da aula inteira.
- **Variedade de minijogos** (quiz, social, times, criatividade) atende perfis diferentes: tímidos, competitivos, criativos.
- **O planejador por tempo** resolve o problema real da Escola Sabatina: o tempo é fixo e o número de pessoas varia.
- **O "1º lugar escolhe o próximo jogo"** dá agência e gera conversa.

### Riscos encontrados e como o design resolve
| Risco | Por que importa | Solução no design |
|---|---|---|
| **Jogos "holofote"** (Roleta, Duelo, Tapple) deixam 13 de 15 pessoas paradas | Celular na mão sem nada para fazer vira Instagram | **Modo plateia em todos**: quem não está na vez responde em silêncio e ganha meio ponto, aposta ou valida. Pilar "ninguém fica parado" |
| **Exposição e pontos negativos** em sorteio público | Tímidos ou visitantes podem se sentir humilhados e não voltar | Toggle **"Não me sortear"** no perfil, que vira plateia e não perde pontos. O negativo só vale no jogo de risco. Mensagens sempre encorajadoras |
| **Nome "Roleta Russa"** | Referência violenta, destoa do ambiente | Renomeado para **Lançar Sortes** (Pv 16:33; At 1:26) |
| **Jogo vira só competição** e o conteúdo se perde | O objetivo é aprender e debater | **Momento Revelação** obrigatório depois de cada jogo (verso + insight + pergunta), com duração ajustável |
| **Teologia do "ganhar o Santíssimo"** | Sugere que se chega à presença de Deus por mérito | No final o **véu se rasga** (Mt 27:51) e **todos entram**, com o vencedor à frente. Mensagem: "o caminho foi aberto para todos" (Hb 10:19-20) |
| **Funcionar com 3 ou com 30** | Times, papéis e rodadas mudam com N | Pontos **normalizados** por jogo, regras por faixa de N e jogos que se escondem quando N não permite |
| **Jogos orais precisam de juiz** (Tapple, Taboo, mímica) | O sistema não "ouve" | **Controle do facilitador** no celular do professor (✓ / ✗ / pular) ou **voto relâmpago** da plateia |
| **Escopo grande** (11 jogos + mapa + avatares) | Risco de não ficar pronto para o sábado | **Roadmap em fases**: a plataforma e 5 jogos primeiro (ver §13) |
| **Marcas de terceiros** (Kahoot, Tapple, When I Dream, Duolingo) | Direito autoral e marca | Mecânicas não têm dono, nomes sim. Todos os jogos ganham **nome próprio bíblico** |
| **Internet da igreja** | Wi-Fi ruim ou 4G instável | Payloads mínimos, reconexão automática que recupera o estado e telão retomável |

### Decisões de design tomadas
1. O nome do jogo genérico e a "skin" da lição são separados: **mecânicas reutilizáveis + pacote de conteúdo semanal (JSON)**. Isso prepara a expansão para outros temas.
2. **Dois "placares"**: XP dentro de cada jogo (sensação Kahoot) e **Passos** no mapa (progressão justa e normalizada).
3. **Arco pedagógico** em toda sessão: *Aquecer → Explorar a história → Debater → Aplicar*.

---

## 1. Visão e pilares

**Visão:** transformar os 30-40 minutos da lição jovem num jogo presencial em que todos participam pelo celular, riem, discutem e saem sabendo a história, o contexto e a mensagem da semana.

**Pilares (critérios para qualquer decisão futura):**
1. **Aprender jogando.** Todo ponto ganho está ligado a um fato ou a uma verdade da lição. Toda resposta revela o "porquê" e a referência.
2. **Ninguém fica parado.** Em qualquer momento, cada celular tem algo para fazer.
3. **O debate faz parte do jogo.** O Momento Revelação é uma fase do jogo, não uma pausa dele.
4. **Leve e reverente.** O humor fica na situação ("Modo depressivo ativado", como a própria tirinha da lição faz), nunca em Deus ou no sagrado.
5. **Funciona com 3 ou 30.**
6. **Atrito zero.** QR → nome → avatar → jogando em menos de 30 segundos. Sem conta e sem app.

**Público:** 15-30 anos (média 20), ~15 pessoas (de 3 a 30), presencial, celular próprio, um telão/TV e um professor ou facilitador.

---

## 2. Nome e identidade

| Opção | Por quê |
|---|---|
| **Átrio** ⭐ | O lugar onde o povo se reunia no santuário. Curto, genérico para futuros temas e lembra "átrio" = "sala de encontro" |
| Rumo ao Santo | Descreve o mapa |
| Lição em Jogo | Literal, bom para SEO |
| Santuário Quest | Tom gamer |

**Tagline:** "A lição em jogo." · **Mascote proposto: "Lume"**, uma lamparina de azeite com olhinhos (Sl 119:105, "lâmpada para os meus pés"). Ele liga ao candelabro do santuário e ao "GPS espiritual" desta semana, e é genérico para qualquer tema. Nesta semana, faz participação especial do **corvo** que traz o pão (1Rs 17:6), na mecânica de recuperação "Pão e Água".

---

## 3. Papéis e dispositivos

| Papel | Dispositivo | O que faz |
|---|---|---|
| **Telão (Host)** | Notebook ligado à TV ou projetor | "Palco": QR, perguntas, mapa, placar e animações. É o **cérebro do jogo** (veja §11) |
| **Facilitador / Observador** (professor) | Celular (controle remoto) **e/ou** teclado do notebook | Avança, pausa, julga ✓/✗, estende o debate, expulsa ou renomeia jogador. **Não pontua** por padrão (toggle "professor também joga") |
| **Jogador** | Celular | Entra pelo QR, escolhe avatar e responde. Recebe informações secretas (papéis, cartas) |
| **Dupla** | 1 celular para 2 pessoas | Para quem está sem celular: entra como "Ana & Léo" |
| **Plateia (v2)** | Celular | Quem chega atrasado ou não quer competir: vota e reage sem pontuar |

**Atalhos de teclado do telão:** `Espaço` avança · `P` pausa · `→` pula · `1` acerto · `2` erro · `+` mais 30 s de debate · `M` mudo.

---

## 4. Jornada de ponta a ponta

### 4.1 Antes da aula (facilitador, ~1 min)
1. Abre `atrio.vercel.app` no notebook e clica em **"Criar sala"**.
2. Escolhe o **pacote de conteúdo** (MVP: "Lição 3 — Profetas do AT · 10-16 out").
3. Entra no **Planejador** (§8): define a duração (ex.: 35 min), a profundidade do debate e os jogos (sugestão automática ou manual). A estimativa de N começa em 15 e se ajusta sozinha conforme o pessoal entra no lobby.
4. Abre o **Lobby**.

### 4.2 Entrada dos jogadores (o lobby fica aberto enquanto a turma chega; não conta no tempo)
**Telão:** QR grande, PIN de 6 dígitos e URL curta. Os avatares "caem" na tela com um pulinho e um som ao entrar, e um contador mostra "14 jogadores". Música ambiente.
**Celular:**
1. Lê o QR → `atrio.vercel.app/j/482913`. O PIN já vem preenchido.
2. **Seu nome** (filtro de palavrões, máx. 14 caracteres).
3. **Escolha seu personagem**: carrossel com 24 personagens bíblicos (§10.6). Repetir é permitido, porque o nome aparece embaixo. Dá para mudar a cor da roupa.
4. Toggle discreto: "🙈 Prefiro não ser sorteado para falar" (pode mudar depois).
5. Tela de espera: o avatar animado e "**Você sabia?**" com curiosidades da lição ("Elias significa 'Meu Deus é o Senhor'").
- Um token fica salvo no `localStorage`: se a página recarregar, a pessoa volta para o mesmo jogador.

### 4.3 Abertura (1,5 min)
- A tirinha da lição é animada em 3 quadros ("Tira a minha vida!" → "Modo depressivo ativado" → "Ainda há trabalho!").
- Verso de abertura (Am 3:7) e **mapa do santuário** com todos os avatares na **Porta do átrio**.
- O Lume explica em 3 frases: "Cada jogo faz você andar no santuário. No fim, o véu se abre. Bora?"

### 4.4 Ciclo de cada minijogo (repete N vezes)
```
[Card de regras 15-30s] → [Rodadas] → [Placar do jogo] → [Momento Revelação] → [Mapa: avatares andam] → [Recompensa do 1º lugar]
```
1. **Card de regras:** 3 tópicos com ícone e um exemplo animado. O celular mostra o mesmo resumo e um botão "Entendi" (o telão mostra 12/15 ✓).
2. **Rodadas** (veja cada jogo em §7).
3. **Placar do jogo:** top 5 no telão (barras animadas, estilo Kahoot). No celular: "Você foi 4º neste jogo · +3 passos".
4. **Momento Revelação** (§9): verso, insight e pergunta para debate. O facilitador controla o tempo.
5. **Mapa:** os avatares andam os passos ganhos. Ao passar por uma **estação**, aparece um card de 5 s com o significado.
6. **"Pão e Água"** para quem ficou por último, e **recompensa** para o 1º lugar (§6.4).

### 4.5 Final (2,5 min)
1. **Véu:** suspense e placar final por passos.
2. **O véu se rasga**: o vencedor entra no **Santíssimo** primeiro (coroa e confete), e em seguida **todos os avatares entram juntos**. Texto: "Pelo sangue de Jesus, o caminho está aberto para todos" (Hb 10:19-20).
3. **Pódio** com top 3 e prêmios divertidos ("🔥 Mais rápido no gatilho", "🕊️ Voz Mansa: mais palavras de ouro", "🧭 GPS: mais acertos seguidos").
4. **Rolo da Lição:** o celular de cada jogador abre automaticamente o **resumo da lição** (as 7 verdades, versos-chave e a pergunta da semana). Há também um **QR no telão** para quem quiser abrir depois.
5. **Card compartilhável** (imagem 9:16 para story): avatar, posição, "Lição 3: Profetas do AT", verso. É o crescimento orgânico, como o 7 a 0.

---

## 5. O mapa: o santuário terrestre

### 5.1 Layout
Planta vista de cima, estilo ilustração flat (Duolingo), orientada **da esquerda (leste, entrada) para a direita (oeste, Santíssimo)** para caber em 16:9. Uma trilha de **nós circulares** (como a trilha do Duolingo) serpenteia pelo átrio e entra na tenda.

```
 LESTE (entrada)                                                  OESTE
 ┌──────────────────────── ÁTRIO (bronze/areia) ───────────┬──── TENDA ────────────────┐
 │ [PORTA]→ ○ ○ [ALTAR] ○ ○ [PIA] ○ ○ →│ LUGAR SANTO (ouro/púrpura)  │ SANTÍSSIMO │
 │                                     │ [MESA]○○[CANDELABRO]○○[INCENSO]○ ║VÉU║ [ARCA] │
 └─────────────────────────────────────┴─────────────────────────────┴────────────┘
```

### 5.2 As 7 estações + o Santíssimo (cada uma é um "card de saber" quando alcançada)
| # | Estação | Posição na trilha | Significado (Cristo no santuário) | Ponte com a lição desta semana |
|---|---|---|---|---|
| 0 | **Porta** | 0% | Só há uma entrada: "Eu sou a porta" (Jo 10:9) | O chamado começa com um "sim" |
| 1 | **Altar do holocausto** | 15% | O sacrifício de Cristo (Jo 1:29) | O altar de 12 pedras no Carmelo |
| 2 | **Pia de bronze** | 30% | Purificação (Tt 3:5) | O descanso e o recomeço de Elias |
| 3 | **Mesa dos pães** | 50% | O Pão da Vida e a Palavra (Jo 6:35) | O pão que o anjo trouxe e a Palavra que os profetas traziam |
| 4 | **Candelabro** | 67% | A Luz do mundo e o Espírito (Jo 8:12) | GPS espiritual: profetas como luz |
| 5 | **Altar de incenso** | 84% | Oração e intercessão (Ap 8:3,4) | Profetas eram pessoas de oração (Jr 42:4) |
| 6 | **Véu** | 100% | Separação entre o Santo e o Santíssimo | Último passo antes do final |
| ★ | **Santíssimo (Arca)** | Final | Lei, propiciatório e presença de Deus | Todos entram no fim |

O texto do "card de saber" fica no pacote de conteúdo, então cada semana pode criar uma ponte diferente.

### 5.3 Tamanho da trilha (adaptativo)
- Número de nós até o Véu: **`L = 3 × K + 2`**, onde *K* = número de jogos planejados.
- Cada jogo dá de 1 a 5 passos (média ~2,8 e líder ~4,5), então o líder **chega ao Véu perto do último jogo** e a maioria fica entre o Candelabro e o Incenso. Ninguém fica "lá atrás demais".
- Se alguém passar do Véu antes do fim, fica parado no Véu com um selo "+2". Os passos extras contam no desempate.
- Muitos avatares no mesmo nó viram um **cacho** de até 4 avatares e uma bolha "+6". Ao passar o mouse ou tocar, a lista aparece.
- No celular: um **minimapa** com "Você está no Candelabro · 3 passos atrás do líder".

---

## 6. Sistema de pontuação e progressão

### 6.1 Duas moedas
| Moeda | Onde aparece | Para que serve |
|---|---|---|
| **XP** | Dentro de cada jogo (escala tipo Kahoot, ~0-1000 por ação) | Emoção imediata e placar do jogo |
| **Passos** | Mapa do santuário | Progressão na sessão. **Define o vencedor** |

### 6.2 Conversão XP → Passos (a chave para funcionar com 3 ou 30)
Ao fim de cada jogo, para cada jogador *i* que participou:
```
se XP_i < 0                → passos = 0
senão se max == min         → passos = 2            (todos empataram)
senão  norm = (XP_i − min⁺) / (max − min⁺)          (min⁺ = menor XP ≥ 0)
       passos = 1 + round(3 × norm)                 → de 1 a 4
1º lugar do jogo (empates incluídos)                → +1 passo   (máx. 5)
```
- **Por que normalizar:** um jogo de 8 perguntas e um de 2 rodadas valem o mesmo no mapa, e a quantidade de jogadores não distorce nada.
- **Por que mínimo de 1:** participar sempre faz andar (Duolingo-like), exceto quem ficou negativo no jogo de risco.

### 6.3 Pontuação base reutilizável
- **Resposta com tempo (Kahoot):** `XP = round(1000 × (1 − t / (2T)))`, e o erro vale 0.
- **Sequência ("Fiel"):** +100 por acerto consecutivo a partir do 2º, até +500. Zera ao errar.
- **Plateia** (quem não está na vez nos jogos holofote): acerto = 50% do valor base. Nunca negativo.
- O tempo é medido pelo **relógio do servidor** (timestamp de início e de resposta), então 4G e Wi-Fi ficam justos.

### 6.4 Especiais
**"Pão e Água" (recuperação, 1Rs 19:5-7):** depois de cada jogo, quem ficou em **último no mapa** (ou os 10% de baixo, se N ≥ 20) ganha **+1 passo**. A animação mostra o corvo trazendo pão: "Levanta-te e come, porque o caminho é longo". A mesma pessoa não ganha duas vezes seguidas. *É a própria lição virando mecânica: Deus cuida antes de cobrar.*

**Cartas de recompensa do 1º lugar** (o celular do vencedor mostra 2 cartas sorteadas; 10 s para escolher, senão uma é escolhida ao acaso):
| Carta | Efeito | Referência |
|---|---|---|
| 🗳️ **Voz de Comando** | Escolhe o próximo jogo entre os que **cabem no tempo restante** | — |
| 🔥 **Porção Dobrada** | Dobra os passos do próximo jogo (máx. +4) | 2Rs 2:9 |
| 🛡️ **Escudo da Fé** | Ignora pontos negativos no próximo jogo | Ef 6:16 |
| 🎲 **Lançar a Sorte** | Escolhe quem será sorteado na próxima rodada holofote (respeita o "não me sortear") | Pv 16:33 |
| 🕯️ **Lâmpada** | Elimina 2 alternativas erradas numa pergunta do próximo jogo | Sl 119:105 |

O facilitador pode desligar cartas específicas.

### 6.5 Vencedor e desempate
1. Mais **passos** totais (incluindo os excedentes no Véu).
2. Mais **1º lugares** em jogos.
3. Maior soma de **XP normalizado** (soma de `norm` de todos os jogos).
4. Empate total: os dois entram juntos (coroa dupla).

**Opcional: "Desafio do Véu"** (+2 min). Se o 1º e o 2º estiverem a até 2 passos de distância, há um duelo de pergunta única entre eles antes do final.

---

## 7. Catálogo de minijogos

Legenda: 👥 todos jogam ao mesmo tempo · 🎯 holofote (1-2 na vez + plateia) · 🛡️ times · 🗣️ precisa de juiz oral · Tempo = núcleo do jogo para N=15, **sem** a sobrecarga fixa (§8).

### 7.1 Nuvem de Testemunhas ☁️ (era "Nuvem de Palavras")
- **Nome:** Hb 12:1, "tão grande nuvem de testemunhas". · 👥 · N 3-30 · ~1,75 min por pergunta · padrão 2 perguntas.
- **Como funciona:** o telão mostra a pergunta. Cada um digita **até 3 palavras** em 40 s, de forma anônima, e a nuvem cresce ao vivo (sem mostrar autores). Na revelação, as palavras repetidas crescem e pulsam.
- **Pontuação:** cada palavra sua vale `round(333 × (k − 1) / (N − 1))`, onde *k* é quantas pessoas escreveram a mesma palavra. Ou seja, vale mais **pensar como a turma**. As palavras são normalizadas (minúsculas, sem acento, singular, e sinônimos do pacote como "triste/tristeza" contam juntos). O **facilitador** pode tocar numa palavra e dar ⭐ **Palavra de Ouro** (+200), premiando um insight original. É assim que o debate começa: "Quem escreveu 'burnout'? Por quê?"
- **Variante "rede semântica"** (Quarta): a palavra central é "PROFETISA". É literalmente a atividade da lição.
- **Pergunta final de aplicação** sem pontos ("Uma atitude que você leva desta lição"). Vale só +passo de participação, porque competir em compromisso pessoal seria estranho.
- **Exemplos:** "Uma palavra para como Elias se sentia debaixo do zimbro" · "O que faz alguém 'coxear entre dois pensamentos' hoje?" · "PROFETISA →".
- **Verdades:** V3, V5, V7.

### 7.2 Verdade ou Falsificação ⚖️ (novo)
- 👥 · N 3-30 · ~25 s por afirmação · padrão 8.
- **Como funciona:** uma afirmação no telão. No celular, dois botões grandes (**VERDADE ✓** azul e **FALSIFICAÇÃO ✗** carmesim), ou deslizar para a direita ou esquerda. 15 s. Na revelação aparecem a **explicação curta + referência** e a porcentagem da turma.
- **Pontuação:** fórmula Kahoot + sequência.
- **Por que existe:** é o tema de terça (discernir o verdadeiro do falso) virando mecânica, e é ótimo para aquecer.
- **Verdades:** V4 e todas (factual).

### 7.3 Linha do Tempo 🧭 (novo)
- 👥 · N 3-30 · ~1,75 min por sequência · padrão 2.
- **Como funciona:** 5-7 cartas de eventos embaralhadas no celular. O jogador **arrasta para ordenar** em 60 s. O telão mostra quantos já enviaram e, na revelação, a ordem certa é animada como uma "jornada" (com mini-ilustrações: zimbro, pão, caverna, vento…).
- **Pontuação:** `XP = 800 × (maior subsequência em ordem ÷ total)` + até 200 de velocidade. A maior subsequência crescente é justa: um único erro não zera tudo.
- **Exemplos:** "Do Carmelo ao Horebe" (1Rs 18-19) · "Josias e o Livro da Lei".
- **Verdades:** V2, V3, V6 (contexto narrativo).

### 7.4 Três Sinais 🔦 (era "Jogo das 3 palavras")
- 👥 · N 3-30 · ~45 s por carta · padrão 5.
- **Como funciona:** o telão revela a **Dica 1 (difícil)**. A cada 10 s abre a próxima: **Dica 2 (média)** e **Dica 3 (fácil)**. No celular há uma grade com 8 opções (personagens, lugares ou objetos da mesma categoria). **Um palpite só**, que pode ser dado a qualquer momento.
- **Pontuação:** acertar na Dica 1 vale 1000, na Dica 2 vale 600 e na Dica 3 vale 300. **Errar vale −100** e trava o jogador, o que desestimula o chute. O ranking mostra "quem matou na 1ª dica" 🧠.
- **Na revelação:** a **ficha do personagem** (quem é, versículo, papel na lição).
- **Verdades:** V5, V6, V7.

### 7.5 Lançar Sortes 🎲 (era "Roleta Russa")
- 🎯 · N 3-30 · ~40 s por pergunta · padrão 6.
- **Nome:** Pv 16:33 ("a sorte se lança no regaço, mas do Senhor procede toda decisão") e At 1:26.
- **Como funciona:** uma animação de sorteio de "pedrinhas" (Urim/Tumim estilizado) escolhe **um jogador**. A pergunta aparece no telão. O sorteado responde no celular (4 alternativas, 15 s) **ou** aperta "Passar".
  - **Acertou:** +2× · **Errou:** −2× · **Passou ou não respondeu:** −1×. *(x = 100 XP)*
  - Se errou ou passou, **a mesma pergunta "queima"** e vai para um **2º sorteado**: acertar vale **+3×**, errar vale −1× e passar vale 0.
  - **Ajuda "Pergunte à plateia"** (1 por jogador, estilo Show do Milhão): mostra a porcentagem da plateia, mas o acerto passa a valer só 1,5×.
- **Plateia:** todos os outros respondem em silêncio ao mesmo tempo (+50 se acertarem). O telão mostra "**68% da plateia acha que é B**" depois da resposta do sorteado, o que dá risada e debate.
- **Respeita** o "não me sortear" e evita sortear a mesma pessoa duas vezes seguidas.
- **Verdades:** todas (banco de perguntas).

### 7.6 Duelo no Carmelo 🔥 (era "Duelo")
- 🎯 · N 2-30 · ~35 s por duelo · padrão 6 duelos.
- **Como funciona:** **dois** jogadores são sorteados e aparecem frente a frente no telão (como Elias × profetas de Baal). Pergunta única, 4 alternativas. **Quem acertar primeiro vence.** Errar trava a pessoa. Se os dois errarem, ninguém vence.
- **Formato "Rei do Monte":** o vencedor **permanece** no monte e enfrenta um novo desafiante sorteado. Cada vitória seguida vale +50% (sequência). É divertido e dramático: "Lucas está há 3 duelos no Carmelo!"
- **Pontuação:** vencedor +300 (+ sequência). Plateia: aposta em quem vai ganhar (+50) **e** responde em silêncio (+50).
- **Verdades:** todas.

### 7.7 Acróstico 119 🔤 (era "Tapple/Stop")
- **Nome:** o Salmo 119 é um acróstico (22 estrofes, uma para cada letra hebraica). · 🎯🗣️ · N 3-30 · rodada ≈ min(20 letras, turnos) × 12 s ≈ 3,5-4 min.
- **Como funciona:** o telão mostra o **tema** ("Personagens, lugares ou objetos da história de Elias") e uma **roda de 20 letras** (sem K, Q, W, X, Y, Z). Na sua vez, o jogador **toca uma letra no celular**, **fala** uma palavra válida em voz alta e tem **10 s**. A letra usada **fica travada na rodada** (regra do Tapple, mais estratégica que travar só a última). Depois passa para o próximo, em ordem sorteada.
- **Validação:** o facilitador aperta ✓ ou ✗, **ou** (modo divertido) a plateia dá 👍/👎 em 3 s. A maioria decide, e os casos discutíveis viram mini-debate ("Zimbro vale como objeto?").
- **Quem errou ou estourou o tempo sai da rodada.** A rodada acaba quando sobra 1 jogador ou quando as letras acabam.
- **Pontuação:** palavra válida +100 · sobrevivente final +300 · plateia que votou com a maioria +20.
- **Temas de exemplo:** "Personagens da lição" · "O que um profeta FAZ (verbos)" · "Ídolos modernos que competem com Deus" (bom para debate).
- **Para N > 20:** 2 "tribos" alternam turnos na mesma rodada.
- **Verdades:** V2, V6.

### 7.8 Fruto Proibido 🍎 (era "Jogo Não Pode")
- 🛡️🗣️ · N 4-30 (com N < 6 vira o modo individual) · turno = 60 s + 15 s · padrão 4 turnos.
- **Como funciona:** 2-3 times (Azul, Púrpura, Carmesim; equilibrados por posição no mapa). O **explicador** vê a carta **só no celular** (palavra + 5 proibidas) e explica para o próprio time, que adivinha em voz alta. O telão mostra o timer, o placar e "🤫 carta secreta".
- **Buzzer:** um **fiscal** do time adversário vê a mesma carta no celular e tem um botão **🚨 BUZZ**. Se o explicador falar uma palavra proibida, a carta é perdida.
- **Pontuação:** acerto +100 para o time · buzz correto −50 para o time da vez e +50 para o fiscal · pular: 1 por turno, sem custo. A XP do time é dividida igualmente entre os membros.
- **Modo individual (N < 6):** um explica e quem acertar primeiro (o facilitador marca) ganha +100. O explicador ganha +50 por acerto.
- **Exemplo:** **ZIMBRO** — não pode: *árvore, sombra, Elias, deserto, dormir*.
- **Verdades:** todas (vocabulário).

### 7.9 O Sonho do Rei 👑 (era "When I Dream")
- 🎯🗣️ · N 4-12 por rodada (com N > 12, os papéis vão para 8 "conselheiros" sorteados e o resto é plateia) · ~2,5 min por Rei · padrão 2 Reis.
- **Papéis secretos no celular:** o **Rei** (quem sonha) · **Anjos** (~50%) ajudam · **Falsos Profetas** (~30%) atrapalham com pistas plausíveis, mas enganosas · **Magos da Corte** (~20%) querem equilíbrio.
- **Noite (90 s):** o Rei fica **de costas para o telão e de olhos fechados**. O telão e os celulares dos conselheiros mostram a palavra (ex.: "CARRO DE FOGO"). Cada conselheiro, na vez, diz **uma palavra de pista**. O Rei chuta em voz alta e o facilitador marca ✓/✗, o que puxa a próxima palavra.
- **Manhã, a "Interpretação" (45 s):** o Rei **reconta o sonho** ligando todas as palavras que acertou numa história (*"Eu sonhei que Elias fugiu para o deserto, dormiu debaixo de um zimbro…"*). **É o melhor momento de aprendizagem do jogo inteiro**, porque obriga a conectar os conceitos.
- **Pontuação (×100 XP):** Anjos +1 por acerto · Falsos Profetas +1 por erro ou pulo · Magos: se a diferença entre acertos e erros for 0, ganham o número de acertos +2; se for 1, o número do lado maior; se for 2 ou mais, o do lado menor · Rei +1 por acerto, **+2 "Interpretação"** se recontar todas as palavras acertadas e **+2 "Discernimento"** se apontar corretamente um Falso Profeta (tema de terça!).
- **Verdades:** V4 e todas (conexão de conceitos).

### 7.10 Disfarçados 🎭 (era "Insuspeitos")
- **Nome:** Acabe foi à batalha **disfarçado** (1Rs 22:30). · 👥 + 1 informante · N 3-30 · ~1 min por personagem · padrão 4.
- **Como funciona:** o telão mostra uma **grade de 12 personagens** da lição (ilustrações + nomes). Um **informante** sorteado recebe no celular o personagem secreto e dá pistas orais criativas, uma a cada ~15 s (ex.: "Esse personagem, hoje, seria preso", "Hoje seria assunto no TikTok"). Todos votam num rosto no celular (palpite único).
- **Modo automático** (para tímidos ou turmas pequenas): as pistas vêm do banco de conteúdo.
- **Pontuação:** palpite durante a pista 1 vale 1000, na 2 vale 700, na 3 vale 400 e na 4 vale 200. Errar vale 0. Informante: `600 × fração de acertos`.
- **Na revelação:** a ficha do personagem (veja doc 01 §6).
- **Grade da semana:** Elias, Eliseu, Acabe, Jezabel, Obadias, Micaías, Josafá, Miriã, Débora, Hulda, Josias, Samuel.
- **Verdades:** V3-V6.

### 7.11 Atos Proféticos 🎬 (era "Mímica")
- **Nome:** os profetas encenavam mensagens (Jeremias com o jugo, Jr 27; Ezequiel deitado de lado, Ez 4). · 🛡️🗣️ · N 4-30 · ~70 s por turno · padrão 4 turnos.
- **Como funciona:** o ator do time recebe no celular **2 cartas** e escolhe uma: **fácil (1×)** ou **difícil (2×)**. Tem 60 s para encenar sem falar, e o time adivinha em voz alta. Se o tempo acabar, os outros times podem **"roubar"** com 1 palpite.
- **Exemplos fáceis:** "Elias dormindo debaixo do zimbro" · "Corvos trazendo pão" · "Fogo descendo do céu" · "Miriã tocando tamborim". **Difíceis:** "Josias rasgando as vestes" · "Eliseu arando com 12 juntas de bois" · "Elias correndo à frente do carro do rei".
- **Pontuação:** +100 ou +200 por carta para o time · roubo +100.

### 7.12 Voz Profética 📣 (era "Pitch")
- 🛡️ · N 4-30 · ~7,5 min (3 times) · **ideal como último jogo** (aplicação).
- **Como funciona:** 2-3 times sorteados. Cada time recebe no celular um **caso da vida real** e um roteiro de 3 blocos: **Situação hoje → O que a Palavra diz (verso) → Atitude prática**. São 3 min de preparo, **1 min de pitch** por time e voto.
- **Votação:** cada jogador avalia **os outros times** (não o próprio) de 1 a 5 ⭐ em dois critérios: *Fiel ao texto* e *Prático para a vida*.
- **Pontuação:** média × 200 para cada membro, +1 passo extra para o time vencedor.
- **Casos de exemplo:** "Um amigo está em burnout como Elias: o que Deus faria por ele (1Rs 19:5-15)?" · "Como ser GPS numa cultura de influencers?" · "Como o reavivamento começa na sua casa esta semana (Ml 4:6)?" · "Você recebeu um chamado e se sente como Ellen aos 17. E agora?"
- **Verdades:** V2, V3, V4, V7.

### 7.13 Resumo do catálogo
| Jogo | Tipo | N mín. | N ideal | Núcleo (N=15) | Escala com N? | Energia | Profundidade |
|---|---|---|---|---|---|---|---|
| Nuvem de Testemunhas | 👥 | 3 | 6-30 | 3,5 min | Não | ●●○ | ●●● |
| Verdade ou Falsificação | 👥 | 3 | qualquer | 3,3 min | Não | ●●○ | ●●○ |
| Linha do Tempo | 👥 | 3 | qualquer | 3,5 min | Não | ●○○ | ●●● |
| Três Sinais | 👥 | 3 | qualquer | 3,75 min | Não | ●●○ | ●●○ |
| Lançar Sortes | 🎯 | 3 | 6-30 | 4 min | Não (rodadas fixas) | ●●● | ●●○ |
| Duelo no Carmelo | 🎯 | 2 | 4-30 | 3,6 min | Não (duelos fixos) | ●●● | ●○○ |
| Acróstico 119 | 🎯🗣️ | 3 | 5-20 | 4 min | Sim, até o teto de 20 letras | ●●● | ●○○ |
| Fruto Proibido | 🛡️🗣️ | 4 | 6-30 | 5 min | Pouco | ●●● | ●●○ |
| O Sonho do Rei | 🎯🗣️ | 4 | 5-12 | 5,5 min | Sim, com teto | ●●● | ●●● |
| Disfarçados | 👥 | 3 | qualquer | 4 min | Não | ●●○ | ●●○ |
| Atos Proféticos | 🛡️🗣️ | 4 | 6-30 | 5 min | Pouco | ●●● | ●○○ |
| Voz Profética | 🛡️ | 4 | 6-24 | 7,5 min | Sim (nº de times) | ●●○ | ●●● |

---

## 8. Planejador de tempo

### 8.1 Modelo de estimativa
```
T_sessão  = Abertura (1,5) + Σ T_jogo + Final (2,5)          [lobby fora da conta]
T_jogo    = Regras (0,5) + Núcleo(N, rodadas) + Placar+Mapa (0,75) + Revelação (D)
D         = Leve 0,5 · Equilibrado 1,25 · Profundo 2,5  (min)
Núcleo    = rodadas × tempo_por_rodada(N)    (+ setup do jogo, ex.: preparo do pitch)
```
Sobrecarga por jogo: **Leve 1,75 · Equilibrado 2,5 · Profundo 3,75 min.**

**Funções de rodada (minutos):**
| Jogo | tempo_por_rodada(N) | Rodadas padrão(N) | mín.-máx. |
|---|---|---|---|
| Nuvem | 1,75 | 2 | 1-4 |
| V ou F | 0,42 | 8 | 5-15 |
| Linha do Tempo | 1,75 | 2 | 1-3 |
| Três Sinais | 0,75 | 5 | 3-8 |
| Lançar Sortes | 0,67 | 6 | 4-10 |
| Duelo | 0,6 | min(⌈N/2⌉, 6) | 3-10 |
| Acróstico | 0,2 × min(20, N + 5) | 1 (N ≥ 10) · 2 (N < 10) | 1-3 |
| Fruto Proibido | 1,25 | 2 × nº de times | 2-6 |
| Sonho do Rei | 2,5 (+0,5 setup) | 2 | 1-4 |
| Disfarçados | 1,0 | 4 | 2-6 |
| Atos Proféticos | 1,2 | 2 × nº de times | 2-6 |
| Voz Profética | 1,25 por time (+3 preparo +0,75 voto) | nº de times (2-3) | 2-3 |

### 8.2 Tempo total estimado por jogo (rodadas padrão, profundidade *Equilibrado*)
| Jogo | N = 6 | N = 15 | N = 30 |
|---|---|---|---|
| Nuvem de Testemunhas | 6,0 | 6,0 | 6,0 |
| Verdade ou Falsificação | 5,9 | 5,9 | 5,9 |
| Linha do Tempo | 6,0 | 6,0 | 6,0 |
| Três Sinais | 6,3 | 6,3 | 6,3 |
| Lançar Sortes | 6,5 | 6,5 | 6,5 |
| Duelo no Carmelo | 4,3 (3 duelos) | 6,1 (6) | 6,1 (6) |
| Acróstico 119 | 7,0 (2 rod.) | 6,5 | 6,5 (teto) |
| Fruto Proibido | 5,0 (individual) | 7,5 | 10,0 (3 times) |
| O Sonho do Rei | 8,0 | 8,0 | 8,0 (conselheiros) |
| Disfarçados | 6,5 | 6,5 | 6,5 |
| Atos Proféticos | 7,3 | 7,3 | 9,7 (3 times) |
| Voz Profética | 8,8 (2 times) | 10,0 (3) | 10,0 (3) |

### 8.3 Algoritmo do planejador
```
orçamento = duração − 4 min (abertura + final)

1) SUGESTÃO AUTOMÁTICA (botão "Montar para mim")
   escolha gulosa, até o orçamento acabar, maximizando:
     +3 por dia da lição ainda não coberto (Sáb..Sex)
     +2 por formato ainda não usado (👥 🎯 🛡️)
     +2 se o 1º jogo for 👥 (aquecer todos)  ·  +2 se o último for de aplicação
     −∞ se N < N_mín do jogo
   ordena pelo arco: Aquecer → História → Debate/Social → Aplicação

2) EDIÇÃO MANUAL (arrastar, adicionar, remover, mudar rodadas)
   recalcula ao vivo; se total > orçamento:
     a) reduz rodadas (até o mínimo) do jogo com mais folga e mostra "Fruto Proibido: 4 → 3 turnos"
     b) se ainda estourar → barra vermelha, botão INICIAR BLOQUEADO
        e sugestões: "Remova Duelo (−7 min)" | "Mude para Leve (−3 min)" | "Aumente para 40 min"
   se sobrar ≥ 1 rodada de algum jogo → oferece "Usar 3 min livres?"
        (adiciona rodadas ao jogo FAVORITO, marcado com ♥, ou aprofunda a Revelação)

3) MODO "FOCO" (quando querem muito um jogo específico)
   ♥ num jogo → ele recebe rodadas até o máximo, e os outros são reduzidos ou removidos para caber
```
**Tolerância:** pode passar até **+5%** com aviso amarelo. Acima disso, bloqueia (o facilitador pode forçar com "Sei o que estou fazendo").

### 8.4 Relógio ao vivo (replanejamento durante o jogo)
- O telão tem um chip discreto: **"⏱ 18:40 de 35:00 · +1:30 atrasado"**.
- Se o atraso passar de 2 min, o facilitador recebe a sugestão: "Cortar 2 perguntas de Lançar Sortes?" ou "Pular Revelação curta?".
- A carta **Voz de Comando** só oferece jogos que **cabem no tempo restante**.

### 8.5 Roteiros prontos (N ≈ 15)
| Roteiro | Duração | Profundidade | Sequência | Cobertura |
|---|---|---|---|---|
| ⚡ **Relâmpago** | 20 min | Leve | V ou F (5 afirm.) → Nuvem (2) → Duelo (5) | Sáb, Seg, Ter + quiz geral · ~18 min |
| ⭐ **Recomendado da semana** | 35 min | Equilibrado | Nuvem "zimbro" (Seg) → Linha do Tempo "Carmelo → Horebe" (Sáb/Dom) → V ou F "Verdade × Popularidade" (Ter) → Três Sinais "Profetisas e funções" (Qua/Qui) → Lançar Sortes com perguntas de Sexta e mix | **7/7 dias** · ~34,5 min |
| 🎉 **Festa** (os favoritos do brainstorm) | 30 min | Equilibrado | Nuvem → Acróstico 119 → Sonho do Rei → Lançar Sortes | Estimado em 31 min, **estourou**: o planejador cortou 2 perguntas de Lançar Sortes (6 → 4) e fechou em ~29,7 min. Alternativa oferecida: mudar para *Leve* (28 min, com todas as rodadas) |
| 🧠 **Debate profundo** | 40 min | Profundo | Linha do Tempo → Nuvem → Fruto Proibido → Voz Profética | ~38,5 min |

---

## 9. Momento Revelação (o coração pedagógico)

**Formato:** um card no telão, com o celular espelhando o verso.
```
┌──────────────────────────────────────────────┐
│ 📜  1 Reis 19:5 — "Levanta-te e come."        │  ← verso (curto)
│ 💡  Deus cuida antes de cobrar. A exaustão    │  ← insight (da lição, do pastor ou das anotações)
│     espiritual muitas vezes começa no físico.  │
│ 🗣️  Quando foi a última vez que você confundiu│  ← pergunta para debate (da própria lição)
│     cansaço com falta de fé?                   │
│                            [ +30s ]  [ Seguir ]│  ← controle do facilitador
└──────────────────────────────────────────────┘
```
- Cada jogo do pacote traz **1-2 revelações**, marcadas com a Verdade-âncora.
- **Dados do próprio jogo alimentam o debate:** "68% da turma achou que Deus estava no fogo"; "a palavra mais repetida foi CANSADO".
- **"Toque para comentar" (opcional):** quem quiser aperta ✋ no celular, e o telão mostra "3 querem falar". O facilitador chama, o que dá voz a quem é tímido demais para levantar a mão.
- O facilitador vê no celular a **nota de condução** (contexto extra) que não aparece no telão.

---

## 10. Design system — "Tabernáculo" (Duolingo × Kahoot × identidade adventista)

### 10.1 Princípios visuais
- **Chapado, arredondado e tátil** (Duolingo): formas simples, botões 3D, ilustrações flat com contorno suave.
- **Palco energético** (Kahoot): o telão tem fundo escuro e vibrante, tipografia enorme e contraste máximo.
- **Reverente e quente**: paleta tirada do próprio tabernáculo (Êx 26:1), ouro como luz e nunca neon agressivo.
- **Grade de 7** (aceno ao Creation Grid): medidor de cobertura com 7 dias, 7 estações no mapa e layouts de telão em 7 colunas.

### 10.2 Paleta (tokens)
| Token | Hex | Sombra 3D | Uso | Forma da alternativa |
|---|---|---|---|---|
| `--carmesim` | `#E5383B` | `#B3262A` | Alternativa A, erro, buzz | ▲ triângulo |
| `--azul` (tekhelet) | `#1C7ED6` | `#155FA3` | Alternativa B, links, "Verdade" | ◆ losango |
| `--ouro` | `#FFB703` | `#D48F00` | Alternativa C, XP, coroa, destaques | ● círculo |
| `--oliveira` | `#4CAF1A` | `#3A8A12` | Alternativa D, **acerto**, ação primária | ■ quadrado |
| `--purpura` | `#7B3FE4` | `#5A2BB0` | Marca, fundo do telão, Lugar Santo | — |
| `--bronze` | `#C67B3C` | `#9A5C28` | Átrio, altar e pia no mapa | — |
| `--acacia` | `#8A5A33` | — | Madeira e detalhes do mapa | — |
| `--fogo` | `#FF6B1A` | `#D9530C` | Sequência, Duelo no Carmelo, acento da semana (Elias) | — |
| `--linho` | `#FFF9EF` | — | Fundo do **celular** (claro) | — |
| `--linho-2` | `#F2E8D8` | — | Cards e bordas no claro | — |
| `--noite` | `#1B1840` | — | Texto principal / fundo do **telão** | — |
| `--noite-2` | `#2B2263` | — | Gradiente do telão (com `--purpura`) | — |
| `--cinza` | `#8A86A3` | — | Texto secundário | — |

- **Telão:** fundo em gradiente `--noite → --noite-2` com textura sutil de linhas do tabernáculo (5% de opacidade). Texto em linho.
- **Celular:** fundo `--linho` (claro, como o Duolingo) com tema escuro automático por `prefers-color-scheme`.
- **Contraste:** todo texto ≥ 4,5:1. Alternativas sempre com **cor + forma + letra** (acessível a daltônicos).

### 10.3 Tipografia
| Papel | Fonte (Google Fonts, grátis) | Peso | Uso |
|---|---|---|---|
| Display / títulos / números | **Nunito** (arredondada, a sensação mais próxima do Feather do Duolingo) | 800-900 | Perguntas, timers, placares, botões |
| Texto | **Noto Sans** (base da Advent Sans, o aceno à identidade adventista) | 400-700 | Explicações, versos, regras |

- **Telão** (lido a 6 m ou mais): pergunta ≥ 56 px, alternativas ≥ 40 px, nunca texto menor que 28 px.
- **Celular:** botões de resposta ocupam a tela inteira (ao menos 64 px de altura), corpo de 17 px.
- Números com `font-variant-numeric: tabular-nums` (timer e placar não "tremem").

### 10.4 Componentes
- **Botão 3D:** `border-radius: 16px; box-shadow: 0 5px 0 var(--sombra)`. No `:active`, `translateY(5px)` e a sombra zera. Variantes primary (oliveira), secondary (contorno), danger (carmesim) e gold (ouro).
- **Card de alternativa** (telão e celular): cor sólida + forma branca + texto. No celular, só a forma e a letra, porque o conteúdo está no telão (como no Kahoot).
- **Timer circular:** anel que esvazia. Nos últimos 5 s fica `--fogo` e "pulsa".
- **Barra de progresso** (estilo Duolingo): grossa, arredondada, com brilho interno.
- **Bottom sheet de feedback** (celular): verde "Mandou bem! +874 🔥3" ou carmesim "Quase! Era: Hulda · 2Rs 22:14".
- **Pílula de XP / Passos:** ouro com ícone de pegada 👣.
- **Chip de avatar:** avatar circular, nome e posição.
- **Placar:** barras horizontais animadas com ultrapassagens (FLIP animation).
- **Pódio:** 3 degraus com avatares grandes e confete.
- **Card de Revelação** (§9) e **card de estação** do mapa.
- **Medidor de cobertura:** 7 bolinhas (S D S T Q Q S) que acendem.
- **Reações:** emojis 🙌 😂 🔥 😮 🙏 enviados do celular flutuam no telão (limite de 1 a cada 2 s por pessoa).

### 10.5 Movimento e som
- **Movimento** (Framer Motion): molas curtas (`stiffness 400, damping 25`). Acerto faz *bounce* + confete, erro faz *shake* horizontal de 300 ms, ultrapassagem no placar desliza e avatares andando no mapa dão pulinhos nó a nó.
- **Respeitar** `prefers-reduced-motion`.
- **Som** (só no telão; os celulares ficam em silêncio e usam vibração `navigator.vibrate` onde houver suporte): lobby, tique-taque nos últimos 5 s, acerto, erro, fanfarra do pódio e véu rasgando. Usar **trilhas royalty-free ou sons gerados** (jsfxr), com um botão de mudo sempre visível.
- **Wake Lock API** no celular para a tela não apagar durante o jogo.

### 10.6 Avatares — "bonequinhos" bíblicos
- **Técnica:** SVG **modular** (camadas: corpo, tom de pele, cabelo, barba, túnica, manto, **acessório icônico**). Isso garante estilo consistente, arquivos leves e animação fácil (piscar, pular, comemorar, ficar triste). Evitar imagens geradas por IA soltas, que saem inconsistentes.
- **Estilo:** chibi (cabeça grande), flat, contorno arredondado, olhos expressivos (como os personagens do Duolingo).
- **Representatividade:** tons de pele médios e oliva como padrão (povos do Oriente Médio), com variações.
- **24 personagens e o acessório que identifica cada um:**
  Noé (pomba com ramo) · Abraão (céu estrelado/cajado) · Sara (tenda) · Moisés (tábuas + cajado) · Miriã (tamborim) · Arão (peitoral) · Débora (palmeira) · Gideão (cântaro com tocha) · Rute (feixe de trigo) · Ana (lamparina) · Samuel (chifre de azeite) · Davi (funda/harpa) · Ester (coroa) · **Elias** (manto + chama) · Eliseu (manto duplo) · Daniel (leãozinho) · Jonas (peixe) · Isaías (brasa) · Jeremias (jugo) · Maria (jarro) · João Batista (cinto de couro + gafanhoto) · Pedro (rede) · Paulo (pergaminho) · Lídia (tecido púrpura).
- **Fora dos avatares:** Jesus, Deus, anjos e vilões (Jezabel e Acabe aparecem só como ilustração nos jogos).
- **Na tela:** avatar + **nome do jogador** em destaque e o nome do personagem pequeno.

### 10.7 Tom de voz (microcopy)
- Encorajador, brincalhão e jovem, sem gírias forçadas: "Mandou bem!", "Quase! Bora pra próxima", "Modo Elias ativado: descansa e volta 😴".
- O erro sempre vem com **aprendizado** (a resposta certa + referência).
- **Nunca** zoar a pessoa. A piada é com a situação.

---

## 11. Arquitetura técnica

### 11.1 Stack recomendada (100% gratuita)
| Camada | Escolha | Por quê |
|---|---|---|
| Front-end | **React + Vite + TypeScript** | Rápido, tipado, deploy estático |
| Estilo | **Tailwind CSS** com os tokens do §10 | Design system em variáveis |
| Animação | **Framer Motion** + canvas-confetti | Microinterações estilo Duolingo |
| Estado local | Zustand | Simples |
| Tempo real + persistência | **Firebase Realtime Database** (plano Spark) + Anonymous Auth | Grátis, **não pausa** por inatividade, presença com `onDisconnect`, timestamps de servidor (tempo justo) e regras de segurança por usuário (papéis secretos protegidos) |
| QR Code | `qrcode.react` | — |
| Hospedagem | **Vercel** (Hobby) | Deploy por push no GitHub, URL `.vercel.app`, rotas SPA sem gambiarra |
| Alternativa | GitHub Pages (com HashRouter) · Supabase Realtime no lugar do Firebase (atenção à pausa do plano gratuito) | — |

> **Por que não "só Vercel"?** Funções serverless não seguram conexões de jogo (o WebSocket da Vercel está em beta e cai em ~5 min). Por isso o tempo real fica num serviço gerenciado e o site é estático.

### 11.2 Modelo "host autoritativo" (sem servidor próprio)
- O **telão é o "servidor" do jogo**: roda a máquina de estados, calcula pontos e publica o estado.
- **Celulares só enviam inputs** (resposta, letra, buzz, voto) e **leem** o estado público mais o próprio estado privado.
- O estado completo é salvo no Firebase a cada mudança de fase. **Se o notebook travar, basta reabrir o link do host e o jogo continua de onde parou.**
- Jogadores que recarregam a página voltam pelo token salvo no `localStorage`.

### 11.3 Estrutura de dados (Firebase RTDB)
```
rooms/{pin}/
  meta:        { hostUid, packId, createdAt, status, plan: [...], settings: {...} }
  public:      { phase, gameIndex, round, payload, startedAt(serverTs), deadline }
  players/{uid}: { name, avatar, color, noSpotlight, steps, xpTotal, firsts, connected }
  private/{uid}: { role, secretCard, options }     ← regra: só {uid} e o host leem
  inputs/{gameIndex}_{round}/{uid}: { value, at(serverTs) }  ← regra: cada um só escreve o seu
  reactions/{pushId}: { uid, emoji, at }
```
- **Regras de segurança:** jogador escreve só em `inputs/*/{seu uid}` e no próprio perfil. `private/{uid}` só pode ser lido pelo dono e pelo host. Apenas o host escreve em `public` e `players/*/steps`.
- **Limpeza:** salas expiram em 24 h (não guardamos dados pessoais além do apelido).
- **Capacidade:** 30 jogadores + telão + facilitador ≈ 32 conexões, bem abaixo do limite gratuito (~100). Tráfego por sessão ≈ poucos MB.

### 11.4 Arquitetura de jogos como plugins
Cada minijogo é um módulo com a mesma interface, o que facilita adicionar jogos novos:
```ts
interface MiniGame<Cfg, State, Input> {
  id: string; name: string; icon: string; kind: 'all'|'spotlight'|'teams';
  minPlayers: number; idealRange: [number, number];
  needsJudge: boolean;
  estimate(n: number, cfg: Cfg): { minutes: number; rounds: number };
  defaultConfig(n: number, pack: ContentPack): Cfg;
  init(players, cfg, pack): State;
  reduce(state: State, input: Input, now: number): State;      // roda no host
  score(state: State): Record<PlayerId, number>;               // XP bruto → normalizado depois
  HostView: Component; PlayerView: Component; JudgeView?: Component;
  revelations(pack): Revelation[];
}
```

### 11.5 Rotas
- `/` → home (criar sala / entrar)
- `/host/:pin` → telão
- `/j/:pin` → entrada do jogador (o QR aponta para cá)
- `/play/:pin` → controle do jogador
- `/judge/:pin` → controle do facilitador (QR separado, mostrado só no notebook)
- `/rolo/:packId` → resumo da lição (público, compartilhável)

### 11.6 Qualidade e resiliência
- O jogo continua se alguém cair. O jogador desconectado fica cinza e não trava a rodada (há timeout).
- Celular antigo e conexão 3G: bundle inicial < 250 KB, avatares em SVG e sem vídeo.
- Teste de carga simulado com 30 "bots" (script) antes do primeiro sábado.

---

## 12. Pacote de conteúdo (pronto para virar uma plataforma multitema)
Cada lição é um **JSON validado (Zod)** em `content/`, e os jogos leem só dele:
```jsonc
{
  "id": "2026-q4-l03", "title": "Profetas do AT", "dates": "10-16 out 2026",
  "keyText": "1Rs 19:1-16", "openingVerse": "Am 3:7",
  "truths": [{ "id": "V3", "day": "seg", "text": "...", "refs": ["1Rs 19:4"] }],
  "characters": [{ "id": "elias", "name": "Elias", "bio": "...", "refs": [], "clues": ["difícil","média","fácil"] }],
  "places": [], "objects": [], "concepts": [],
  "questions": [{ "q": "...", "options": ["","","",""], "answer": 1, "explain": "...", "ref": "", "truth": "V4", "difficulty": 2 }],
  "trueFalse": [], "timelines": [], "threeSigns": [], "tabooCards": [], "dreamWords": [],
  "acrosticThemes": [], "mimes": [], "cloudPrompts": [], "pitchCases": [],
  "revelations": [{ "game": "*", "truth": "V3", "verse": "", "insight": "", "question": "", "facilitatorNote": "" }],
  "stationBridges": { "altar": "...", "pia": "..." },
  "summary": { "bigIdea": "...", "truths": [], "questions": [] }
}
```
**Expansão futura:** (1) editor visual de pacotes; (2) importar de uma planilha Google; (3) **gerar um rascunho do pacote a partir do PDF da lição com IA** (Claude API), com revisão humana obrigatória; (4) temas além da lição (livros da Bíblia, Daniel e Apocalipse, gincanas de Desbravadores) reaproveitando os mesmos minijogos e o mesmo mapa ou outros mapas (Êxodo, Jerusalém…).

O banco inicial desta lição está em [04-banco-de-conteudo.md](04-banco-de-conteudo.md).

---

## 13. Roadmap

| Fase | Entrega | Critério de pronto |
|---|---|---|
| **F1 · Plataforma** | Criar sala, QR/PIN, lobby com avatares, controle do facilitador, reconexão, mapa com passos, placar, Momento Revelação, final com véu e pódio, Rolo da Lição | 1 sessão fictícia de ponta a ponta com 10 celulares |
| **F2 · Jogos 👥** (mais fáceis e escaláveis) | Nuvem de Testemunhas, Verdade ou Falsificação, Três Sinais, Linha do Tempo | Roteiro "Recomendado" jogável |
| **F3 · Jogos 🎯** | Lançar Sortes, Duelo no Carmelo, Acróstico 119 | Plateia funcionando em todos |
| **F4 · Jogos sociais** | O Sonho do Rei, Fruto Proibido, Disfarçados | Papéis secretos protegidos por regra |
| **F5 · Times e fechamento** | Atos Proféticos, Voz Profética, planejador completo com modo foco, card de story | Os 4 roteiros prontos jogáveis |
| **v2** | Ligas por trimestre, editor de pacotes, geração por IA, modo sem telão, modo remoto/online | — |

**Recomendação:** para estrear neste sábado com segurança, **F1 + F2 + Lançar Sortes** já entregam o roteiro "Recomendado da semana" completo.

**Checklist do ensaio antes da classe:** testar o QR na TV real a 5 m · checar o Wi-Fi e o 4G da sala · cabo HDMI e som · 2-3 celulares de amigos como bots · combinar com o professor os atalhos do controle.

---

## 14. Decisões tomadas (16/10/2026)
| # | Decisão |
|---|---|
| 1 | Nome: **Lição em Jogo** |
| 2 | Pontos negativos em Lançar Sortes **mantidos**, com a opção "não me sortear" |
| 3 | O professor **só facilita** (não pontua) |
| 4 | Tempo real com **Firebase** Realtime Database |
| 5 | Ellen White **pode aparecer** em Três Sinais e nas perguntas, mas fica fora de Disfarçados |
| 6 | Escopo: **construir todos os 12 jogos** |
| 7 | Funcionar com projetor ou TV **e também só com o notebook**: o telão precisa escalar bem em telas de 13" |
| + | Todo o funcionamento deve ser intuitivo pelo design. Haverá explicação de **como jogar cada jogo** e de **como funciona o Lição em Jogo** |

### Perguntas originais
1. **Nome:** Átrio, Rumo ao Santo ou outro?
2. **Pontos negativos** em Lançar Sortes: manter (com "não me sortear") ou trocar por "0" para iniciantes?
3. **Professor joga também** ou só facilita?
4. **Firebase** (recomendado) ou Supabase?
5. **Ellen White** como personagem em *Três Sinais*/perguntas (sugerido) e fora dos jogos de disfarce: ok?
6. **Escopo do primeiro sábado:** F1 + F2 + Lançar Sortes, ou tentar tudo?
7. **Há telão/TV** em todas as salas onde vai rodar? (Se não, priorizar o "modo sem telão" da v2.)
