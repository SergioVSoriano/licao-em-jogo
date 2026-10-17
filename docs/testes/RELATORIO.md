# Simulação visual de uma partida completa

> Gerado automaticamente por `npm run simular` em 16/10/2026, 14:50:30.
> Navegador: Microsoft Edge (Playwright). Telão em 1366×768; celulares em 390×844.

## Como foi a simulação

- **Telão (professor):** uma aba de computador conduzindo a partida (barra de espaço, teclas 1/2/Q).
- **Celulares:** Ana, Bruno, Carla e Davi, cada um numa aba com o próprio jogador. O Davi marcou **"Não me sortear"**.
- **Robôs:** 3, para completar os times.
- **Controle do facilitador:** uma aba de celular aberta pelo QR 📲.
- **Roteiro:** os 12 jogos em 60 minutos, com o Momento Revelação "Leve". O planejador reduziu as rodadas para caber.

## Resultado

- Jogos jogados até o fim: **12 de 12**
- Prints: **172**
- Erros de JavaScript nas páginas: **0**
- Prints que falharam por lentidão da máquina (não são erros do app): **3** — regras do Duelo no celular, Rolo no celular (capturado à parte, abaixo) e controle do facilitador no final

## Problemas encontrados pela simulação (e já corrigidos)

| # | Onde | Problema | Correção |
|---|---|---|---|
| 1 | Lançar Sortes · celular | Quando o 1º sorteado errava, a plateia via só "Lançando a sorte…" e não conseguia responder | A plateia pode responder durante a 2ª sorte, já que a pergunta está no telão |
| 2 | Linha do Tempo · telão | Se todos enviavam rápido, a revelação podia ser pulada | O facilitador só avança quando a etapa ainda não mudou sozinha (e o telão mostra a ordem certa) |
| 3 | Duelo / Sortes / Disfarçados · telão | O brilho atrás do avatar em destaque ficava por cima dele, deixando-o apagado | O avatar agora fica à frente do brilho |
| 4 | Duelo · telão | A explicação da resposta invadia a barra de botões numa tela 1366×768 | Pergunta e avatares mais compactos |
| 5 | Duelo / Sortes · robôs | Os robôs respondiam em ~1 s e a plateia não tinha tempo de apostar | Os robôs esperam alguns segundos (só afeta os testes e demonstrações) |
| 6 | Momento Revelação · telão | Sobrava um vão entre "Na Bíblia" e o insight | O insight vem logo abaixo, em destaque |

## Placar final da simulação

| Posição | Jogador | Passos | Vitórias |
|---|---|---|---|
| 1º | Ana | 51 | 7 |
| 2º | Davi | 35 | 3 |
| 3º | Carla | 34 | 3 |
| 4º | Bruno | 31 | 3 |
| 5º | Tito (robô) | 31 | 2 |
| 6º | Isa (robô) | 31 | 2 |
| 7º | Lia (robô) | 28 | 1 |


## 1. Início e planejador

**Telão (professor):** Página inicial (computador).

<img src="prints/001-inicio.jpg" width="760">

**Celular de Ana:** Página inicial no celular.

<img src="prints/002-inicio-celular.jpg" width="260">

**Telão (professor):** Página "Como funciona": passo a passo, mapa, pontos e os 12 jogos.

<img src="prints/003-como-funciona.jpg" width="760">

**Telão (professor):** Planejador com os 12 jogos em 60 min: as rodadas foram reduzidas sozinhas para caber (lista ✂️ à direita).

<img src="prints/004-planejador.jpg" width="760">


## 2. Entrada dos jogadores

**Telão (professor):** Sala de espera no telão: QR Code, PIN 606366 e roteiro.

<img src="prints/005-lobby-vazio.jpg" width="760">

**Celular de Ana:** Celular: passo 1, o nome.

<img src="prints/006-entrada-nome.jpg" width="260">

**Celular de Ana:** Celular: passo 2, escolher o personagem bíblico (e a cor da roupa).

<img src="prints/007-entrada-personagem.jpg" width="260">

**Celular de Davi:** Davi marcou "Prefiro não ser sorteado": joga como plateia nos jogos de holofote.

<img src="prints/008-entrada-nao-sortear.jpg" width="260">

**Celular de Ana:** Celular depois de entrar: "Você está dentro!" e uma curiosidade da lição.

<img src="prints/009-lobby-celular.jpg" width="260">

**Telão (professor):** Telão com os 4 jogadores + 3 robôs (para completar os times).

<img src="prints/010-lobby-cheio.jpg" width="760">

**Celular do facilitador:** Controle do facilitador no celular (aberto pelo QR 📲 do telão).

<img src="prints/011-controle-lobby.jpg" width="260">


## 3. Abertura

**Telão (professor):** Abertura: a tirinha da lição, o verso de Amós 3:7 e o mapa do santuário.

<img src="prints/012-abertura.jpg" width="760">

**Celular de Bruno:** Celular na abertura.

<img src="prints/013-abertura-celular.jpg" width="260">


## 4. Jogo 1: Nuvem de Testemunhas

**Telão (professor):** Regras do jogo no telão (também aparecem no celular).

<img src="prints/014-nuvem-telao-regras.jpg" width="760">

**Celular de Carla:** Regras no celular, com o botão "Entendi ✓".

<img src="prints/015-nuvem-celular-regras.jpg" width="260">

**Celular de Ana:** Ana escreve até 3 palavras (anônimo).

<img src="prints/016-nuvem-celular-escrevendo.jpg" width="260">

**Telão (professor):** Telão enquanto a turma escreve: as palavras ficam escondidas até o tempo acabar.

<img src="prints/017-nuvem-telao-escrevendo.jpg" width="760">

**Telão (professor):** A nuvem revelada: palavras repetidas crescem (cansado + exausto contam juntas).

<img src="prints/018-nuvem-telao-nuvem.jpg" width="760">

**Telão (professor):** O facilitador clicou numa palavra original para dar ⭐ Palavra de Ouro (+200).

<img src="prints/019-nuvem-palavra-de-ouro.jpg" width="760">

**Celular do facilitador:** No controle do facilitador, as palavras também aparecem para dar a ⭐.

<img src="prints/020-nuvem-controle.jpg" width="260">

**Celular de Ana:** Celular da Ana: pontos da rodada.

<img src="prints/021-nuvem-celular-resultado.jpg" width="260">

**Telão (professor):** Placar do jogo: pontos, passos ganhos (👣) e bônus como 🍞 Pão e Água.

<img src="prints/022-nuvem-telao-placar.jpg" width="760">

**Celular de Ana:** Placar no celular: posição e passos ganhos.

<img src="prints/023-nuvem-celular-placar.jpg" width="260">

**Telão (professor):** Momento Revelação: "Qual é o seu "zimbro"? Onde você se esconde quando chega no limite?" com enquete ao vivo e quem quer falar.

<img src="prints/024-nuvem-telao-momento-revelacao.jpg" width="760">

**Celular de Ana:** Momento Revelação no celular: pergunta, enquete e "Quero falar".

<img src="prints/025-nuvem-celular-momento-revelacao.jpg" width="260">

**Celular do facilitador:** Controle do facilitador: insight, todas as perguntas, resultado da enquete e nota de condução.

<img src="prints/026-nuvem-controle-momento-revelacao.jpg" width="260">

**Telão (professor):** Tecla Q (ou "Outra pergunta"): troca para a pergunta seguinte.

<img src="prints/027-nuvem-telao-outra-pergunta.jpg" width="760">

**Telão (professor):** Mapa do santuário: os avatares andam os passos ganhos.

<img src="prints/028-nuvem-telao-mapa.jpg" width="760">

**Celular de Ana:** Mapa no celular, com o próprio avatar em destaque.

<img src="prints/029-nuvem-celular-mapa.jpg" width="260">

**Celular de Ana:** Ana venceu o jogo e escolhe uma carta de recompensa.

<img src="prints/030-nuvem-celular-recompensa.jpg" width="260">


## 5. Jogo 2: Linha do Tempo

**Telão (professor):** Regras do jogo no telão (também aparecem no celular).

<img src="prints/031-linha-telao-regras.jpg" width="760">

**Celular de Carla:** Regras no celular, com o botão "Entendi ✓".

<img src="prints/032-linha-celular-regras.jpg" width="260">

**Celular de Ana:** Celular: os acontecimentos chegam embaralhados para arrastar (ou usar ▲ ▼).

<img src="prints/033-linha-celular-embaralhado.jpg" width="260">

**Celular de Ana:** Ana colocou na ordem certa antes de enviar.

<img src="prints/034-linha-celular-ordenado.jpg" width="260">

**Telão (professor):** Telão: as cartas embaralhadas e quantos já enviaram.

<img src="prints/035-linha-telao-ordenando.jpg" width="760">

**Telão (professor):** Placar do jogo: pontos, passos ganhos (👣) e bônus como 🍞 Pão e Água.

<img src="prints/036-linha-telao-placar.jpg" width="760">

**Telão (professor):** Momento Revelação: "Se a sua semana fosse a história de Elias, você estaria em qual parte?" com enquete ao vivo e quem quer falar.

<img src="prints/037-linha-telao-momento-revelacao.jpg" width="760">

**Telão (professor):** Mapa do santuário: os avatares andam os passos ganhos.

<img src="prints/038-linha-telao-mapa.jpg" width="760">

**Telão (professor):** Um robô venceu: o telão mostra as cartas de recompensa.

<img src="prints/039-linha-telao-recompensa.jpg" width="760">


## 6. Jogo 3: Verdade ou Falsificação

**Telão (professor):** Regras do jogo no telão (também aparecem no celular).

<img src="prints/040-verdade-telao-regras.jpg" width="760">

**Celular de Carla:** Regras no celular, com o botão "Entendi ✓".

<img src="prints/041-verdade-celular-regras.jpg" width="260">

**Celular de Ana:** Celular: a afirmação e dois botões grandes.

<img src="prints/042-vf-celular-pergunta.jpg" width="260">

**Telão (professor):** Telão: a afirmação, o tempo e quantos já responderam.

<img src="prints/043-vf-telao-pergunta.jpg" width="760">

**Telão (professor):** Revelação: porcentagem da turma, resposta certa e explicação com o versículo.

<img src="prints/044-vf-telao-revelacao.jpg" width="760">

**Celular de Ana:** Feedback no celular da Ana (estilo Duolingo).

<img src="prints/045-vf-celular-feedback-1.jpg" width="260">

**Celular de Bruno:** Feedback no celular do Bruno.

<img src="prints/046-vf-celular-feedback-2.jpg" width="260">

**Telão (professor):** Placar do jogo: pontos, passos ganhos (👣) e bônus como 🍞 Pão e Água.

<img src="prints/047-verdade-telao-placar.jpg" width="760">

**Telão (professor):** Momento Revelação: "Qual "verdade popular" da internet você já acreditou e depois descobriu que era falsificação?" com enquete ao vivo e quem quer falar.

<img src="prints/048-verdade-telao-momento-revelacao.jpg" width="760">

**Telão (professor):** Mapa do santuário: os avatares andam os passos ganhos.

<img src="prints/049-verdade-telao-mapa.jpg" width="760">

**Telão (professor):** Um robô venceu: o telão mostra as cartas de recompensa.

<img src="prints/050-verdade-telao-recompensa.jpg" width="760">


## 7. Jogo 4: Três Sinais

**Telão (professor):** Regras do jogo no telão (também aparecem no celular).

<img src="prints/051-sinais-telao-regras.jpg" width="760">

**Celular de Carla:** Regras no celular, com o botão "Entendi ✓".

<img src="prints/052-sinais-celular-regras.jpg" width="260">

**Telão (professor):** Telão: só a dica 1 aparece para todos; as outras abrem no celular de quem erra.

<img src="prints/053-sinais-telao-dica1.jpg" width="760">

**Celular de Ana:** Celular: digite o palpite (pode errar acento) ou "Não sei".

<img src="prints/054-sinais-celular-dica1.jpg" width="260">

**Celular de Ana:** Ana chutou "Elias" e errou: abriu a dica 2, agora valendo 600.

<img src="prints/055-sinais-celular-errou.jpg" width="260">

**Celular de Bruno:** Bruno tocou "Não sei" duas vezes: vê as 3 dicas, valendo 300.

<img src="prints/056-sinais-celular-dica3.jpg" width="260">

**Celular de Carla:** Carla acertou "Débora" logo na dica 1 (+1000).

<img src="prints/057-sinais-celular-acertou.jpg" width="260">

**Telão (professor):** Telão: a corrida, com quem acertou em cada dica.

<img src="prints/058-sinais-telao-corrida.jpg" width="760">

**Telão (professor):** Revelação: as 3 dicas, a resposta e os palpites errados mais comuns.

<img src="prints/059-sinais-telao-revelacao.jpg" width="760">

**Celular de Davi:** Celular de quem não acertou mostra a resposta.

<img src="prints/060-sinais-celular-resposta.jpg" width="260">

**Telão (professor):** Placar do jogo: pontos, passos ganhos (👣) e bônus como 🍞 Pão e Água.

<img src="prints/061-sinais-telao-placar.jpg" width="760">

**Celular de Ana:** Placar no celular: posição e passos ganhos.

<img src="prints/062-sinais-celular-placar.jpg" width="260">

**Telão (professor):** Momento Revelação: "Se você pudesse tomar um café com Miriã, Débora ou Hulda, quem escolheria e o que perguntaria?" com enquete ao vivo e quem quer falar.

<img src="prints/063-sinais-telao-momento-revelacao.jpg" width="760">

**Telão (professor):** Mapa do santuário: os avatares andam os passos ganhos.

<img src="prints/064-sinais-telao-mapa.jpg" width="760">

**Celular de Davi:** Davi venceu o jogo e escolhe uma carta de recompensa.

<img src="prints/065-sinais-celular-recompensa.jpg" width="260">

**Celular de Davi:** Escolhendo o alvo da carta.

<img src="prints/066-sinais-celular-recompensa-alvo.jpg" width="260">


## 8. Jogo 5: Lançar Sortes

**Telão (professor):** Regras do jogo no telão (também aparecem no celular).

<img src="prints/067-sortes-telao-regras.jpg" width="760">

**Celular de Carla:** Regras no celular, com o botão "Entendi ✓".

<img src="prints/068-sortes-celular-regras.jpg" width="260">

**Celular de Ana:** Ana foi sorteado(a): responde, passa ou pede ajuda à plateia.

<img src="prints/069-sortes-celular-sorteado.jpg" width="260">

**Telão (professor):** Telão: a pergunta, quem está respondendo e a plateia respondendo em silêncio.

<img src="prints/070-sortes-telao-respondendo.jpg" width="760">

**Telão (professor):** Pediu ajuda à plateia: o telão mostra a porcentagem de cada alternativa.

<img src="prints/071-sortes-telao-ajuda.jpg" width="760">

**Celular de Bruno:** Bruno está na plateia: responde em silêncio valendo +50.

<img src="prints/072-sortes-celular-plateia.jpg" width="260">

**Telão (professor):** Revelação: resultado de cada sorteado e quanto da plateia acertou.

<img src="prints/073-sortes-telao-revelacao.jpg" width="760">

**Celular de Ana:** Celular do sorteado: errou na 1ª chance (−200).

<img src="prints/074-sortes-celular-resultado.jpg" width="260">

**Telão (professor):** Placar do jogo: pontos, passos ganhos (👣) e bônus como 🍞 Pão e Água.

<img src="prints/075-sortes-telao-placar.jpg" width="760">

**Telão (professor):** Momento Revelação: "Se um profeta mandasse uma mensagem direta para a sua geração, sobre o que ela seria?" com enquete ao vivo e quem quer falar.

<img src="prints/076-sortes-telao-momento-revelacao.jpg" width="760">

**Telão (professor):** Mapa do santuário: os avatares andam os passos ganhos.

<img src="prints/077-sortes-telao-mapa.jpg" width="760">

**Celular de Ana:** Ana venceu o jogo e escolhe uma carta de recompensa.

<img src="prints/078-sortes-celular-recompensa.jpg" width="260">

**Celular de Ana:** Escolhendo o alvo da carta.

<img src="prints/079-sortes-celular-recompensa-alvo.jpg" width="260">


## 9. Jogo 6: Duelo no Carmelo

**Telão (professor):** Regras do jogo no telão (também aparecem no celular).

<img src="prints/080-duelo-telao-regras.jpg" width="760">

**Telão (professor):** Telão: dois sorteados frente a frente; a plateia aposta.

<img src="prints/082-duelo-telao-sorteio.jpg" width="760">

**Celular de Ana:** Ana está no duelo: quem acertar primeiro vence.

<img src="prints/083-duelo-celular-duelista.jpg" width="260">

**Celular de Carla:** Plateia depois do duelo: o celular mostra quanto ganhou com a aposta e a resposta certa.

<img src="prints/084-duelo-celular-plateia.jpg" width="260">

**Telão (professor):** Telão: o vencedor fica no monte ("Rei do Monte").

<img src="prints/085-duelo-telao-vencedor.jpg" width="760">

**Telão (professor):** Placar do jogo: pontos, passos ganhos (👣) e bônus como 🍞 Pão e Água.

<img src="prints/086-duelo-telao-placar.jpg" width="760">

**Telão (professor):** Momento Revelação: "Em que área da vida é mais fácil ficar "coxeando entre dois pensamentos"?" com enquete ao vivo e quem quer falar.

<img src="prints/087-duelo-telao-momento-revelacao.jpg" width="760">

**Telão (professor):** Mapa do santuário: os avatares andam os passos ganhos.

<img src="prints/088-duelo-telao-mapa.jpg" width="760">

**Celular de Ana:** Ana venceu o jogo e escolhe uma carta de recompensa.

<img src="prints/089-duelo-celular-recompensa.jpg" width="260">


## 10. Jogo 7: Acróstico 119

**Telão (professor):** Regras do jogo no telão (também aparecem no celular).

<img src="prints/090-acrostico-telao-regras.jpg" width="760">

**Celular de Carla:** Regras no celular, com o botão "Entendi ✓".

<img src="prints/091-acrostico-celular-regras.jpg" width="260">

**Telão (professor):** Telão: o tema, a roda de letras e de quem é a vez.

<img src="prints/092-acrostico-telao-vez.jpg" width="760">

**Celular de Ana:** Ana vota se a palavra vale.

<img src="prints/093-acrostico-celular-voto.jpg" width="260">

**Telão (professor):** Telão: a letra escolhida e a votação da turma; o facilitador decide com 1 ou 2.

<img src="prints/094-acrostico-telao-votacao.jpg" width="760">

**Celular de Bruno:** Vez de Bruno: fala a palavra em voz alta e toca na letra.

<img src="prints/095-acrostico-celular-vez.jpg" width="260">

**Celular de Carla:** Carla saiu da rodada, mas continua votando e vê o tema e as letras livres.

<img src="prints/096-acrostico-celular-eliminado.jpg" width="260">

**Telão (professor):** Fim da rodada: quem resistiu ganha +300.

<img src="prints/097-acrostico-telao-fim.jpg" width="760">

**Telão (professor):** Placar do jogo: pontos, passos ganhos (👣) e bônus como 🍞 Pão e Água.

<img src="prints/098-acrostico-telao-placar.jpg" width="760">

**Telão (professor):** Momento Revelação: "Se a sua família avaliasse a sua fé com estrelas esta semana, quantas você levaria? 😅" com enquete ao vivo e quem quer falar.

<img src="prints/099-acrostico-telao-momento-revelacao.jpg" width="760">

**Telão (professor):** Mapa do santuário: os avatares andam os passos ganhos.

<img src="prints/100-acrostico-telao-mapa.jpg" width="760">

**Celular de Bruno:** Bruno venceu o jogo e escolhe uma carta de recompensa.

<img src="prints/101-acrostico-celular-recompensa.jpg" width="260">


## 11. Jogo 8: Fruto Proibido

**Telão (professor):** Regras do jogo no telão (também aparecem no celular).

<img src="prints/102-fruto-telao-regras.jpg" width="760">

**Celular de Carla:** Regras no celular, com o botão "Entendi ✓".

<img src="prints/103-fruto-celular-regras.jpg" width="260">

**Celular de Ana:** Ana vai explicar: só ele(a) vê a carta.

<img src="prints/104-fruto-celular-pronto.jpg" width="260">

**Telão (professor):** Telão: placar dos times, quem explica, o fiscal e a "carta secreta".

<img src="prints/105-fruto-telao-turno-1.jpg" width="760">

**Celular de Ana:** Celular de quem explica: a palavra e as 5 proibidas.

<img src="prints/106-fruto-celular-carta.jpg" width="260">

**Celular de Bruno:** Bruno: o time adivinha em voz alta.

<img src="prints/107-fruto-celular-time.jpg" width="260">

**Telão (professor):** Fim do turno: as palavras do turno aparecem (✓ acerto, 🚨 buzz).

<img src="prints/108-fruto-telao-fim-turno-1.jpg" width="760">

**Telão (professor):** Telão: placar dos times, quem explica, o fiscal e a "carta secreta".

<img src="prints/109-fruto-telao-turno-2.jpg" width="760">

**Celular de Ana:** Ana é o FISCAL: vê a mesma carta e tem o botão BUZZ.

<img src="prints/110-fruto-celular-fiscal.jpg" width="260">

**Telão (professor):** Fim do turno: as palavras do turno aparecem (✓ acerto, 🚨 buzz).

<img src="prints/111-fruto-telao-fim-turno-2.jpg" width="760">

**Telão (professor):** Placar do jogo: pontos, passos ganhos (👣) e bônus como 🍞 Pão e Água.

<img src="prints/112-fruto-telao-placar.jpg" width="760">

**Telão (professor):** Momento Revelação: "Qual verdade desta lição é mais difícil de explicar sem cair no clichê?" com enquete ao vivo e quem quer falar.

<img src="prints/113-fruto-telao-momento-revelacao.jpg" width="760">

**Telão (professor):** Mapa do santuário: os avatares andam os passos ganhos.

<img src="prints/114-fruto-telao-mapa.jpg" width="760">

**Celular de Ana:** Ana venceu o jogo e escolhe uma carta de recompensa.

<img src="prints/115-fruto-celular-recompensa.jpg" width="260">


## 12. Jogo 9: O Sonho do Rei

**Telão (professor):** Regras do jogo no telão (também aparecem no celular).

<img src="prints/116-sonho-telao-regras.jpg" width="760">

**Celular de Carla:** Regras no celular, com o botão "Entendi ✓".

<img src="prints/117-sonho-celular-regras.jpg" width="260">

**Telão (professor):** Telão: quem é o Rei (vira de costas e fecha os olhos).

<img src="prints/118-sonho-telao-rei.jpg" width="760">

**Celular de Ana:** Ana recebeu o papel secreto: Mago da Corte 🔮.

<img src="prints/119-sonho-celular-papel-mago.jpg" width="260">

**Celular de Bruno:** Bruno é o REI 👑.

<img src="prints/120-sonho-celular-rei.jpg" width="260">

**Celular de Carla:** Carla recebeu o papel secreto: Anjo 😇.

<img src="prints/121-sonho-celular-papel-anjo.jpg" width="260">

**Telão (professor):** Noite: a palavra aparece no telão (o Rei está de costas).

<img src="prints/122-sonho-telao-noite.jpg" width="760">

**Celular de Ana:** Ana vê a palavra e o próprio papel, e dá UMA pista.

<img src="prints/123-sonho-celular-palavra.jpg" width="260">

**Celular do facilitador:** Controle do facilitador durante a noite: ✓ acertou / ✗ errou.

<img src="prints/124-sonho-controle.jpg" width="260">

**Telão (professor):** "Interpretação": o Rei reconta o sonho ligando as palavras (como Daniel).

<img src="prints/125-sonho-telao-interpretacao.jpg" width="760">

**Celular de Bruno:** O Rei tenta apontar um Falso Profeta (tema de terça: discernimento).

<img src="prints/126-sonho-celular-discernimento.jpg" width="260">

**Telão (professor):** Pontuação: os papéis são revelados e cada um ganha conforme o papel.

<img src="prints/127-sonho-telao-pontos.jpg" width="760">

**Celular de Ana:** Ana vê o próprio resultado.

<img src="prints/128-sonho-celular-resultado.jpg" width="260">

**Telão (professor):** Placar do jogo: pontos, passos ganhos (👣) e bônus como 🍞 Pão e Água.

<img src="prints/129-sonho-telao-placar.jpg" width="760">

**Telão (professor):** Momento Revelação: "Quem são os "anjos" e os "falsos profetas" (as vozes que te ajudam e as que te confundem) na sua rotina?" com enquete ao vivo e quem quer falar.

<img src="prints/130-sonho-telao-momento-revelacao.jpg" width="760">

**Telão (professor):** Mapa do santuário: os avatares andam os passos ganhos.

<img src="prints/131-sonho-telao-mapa.jpg" width="760">

**Celular de Bruno:** Bruno venceu o jogo e escolhe uma carta de recompensa.

<img src="prints/132-sonho-celular-recompensa.jpg" width="260">


## 13. Jogo 10: Disfarçados

**Telão (professor):** Regras do jogo no telão (também aparecem no celular).

<img src="prints/133-disfarcados-telao-regras.jpg" width="760">

**Celular de Carla:** Regras no celular, com o botão "Entendi ✓".

<img src="prints/134-disfarcados-celular-regras.jpg" width="260">

**Telão (professor):** Telão: a grade com 12 personagens e as pistas.

<img src="prints/135-disfarcados-telao-grade.jpg" width="760">

**Celular de Ana:** Ana: toca no rosto do personagem (um palpite só).

<img src="prints/136-disfarcados-celular-palpite.jpg" width="260">

**Telão (professor):** Revelação: o personagem, os votos e a ficha bíblica.

<img src="prints/137-disfarcados-telao-revelacao.jpg" width="760">

**Celular de Carla:** Carla é o INFORMANTE: vê o personagem secreto e pistas prontas.

<img src="prints/138-disfarcados-celular-informante.jpg" width="260">

**Telão (professor):** Placar do jogo: pontos, passos ganhos (👣) e bônus como 🍞 Pão e Água.

<img src="prints/139-disfarcados-telao-placar.jpg" width="760">

**Celular de Ana:** Placar no celular: posição e passos ganhos.

<img src="prints/140-disfarcados-celular-placar.jpg" width="260">

**Telão (professor):** Momento Revelação: "Com qual personagem desta semana você mais se identifica? Por quê?" com enquete ao vivo e quem quer falar.

<img src="prints/141-disfarcados-telao-momento-revelacao.jpg" width="760">

**Telão (professor):** Mapa do santuário: os avatares andam os passos ganhos.

<img src="prints/142-disfarcados-telao-mapa.jpg" width="760">

**Celular de Ana:** Ana venceu o jogo e escolhe uma carta de recompensa.

<img src="prints/143-disfarcados-celular-recompensa.jpg" width="260">


## 14. Jogo 11: Atos Proféticos

**Telão (professor):** Regras do jogo no telão (também aparecem no celular).

<img src="prints/144-atos-telao-regras.jpg" width="760">

**Celular de Carla:** Regras no celular, com o botão "Entendi ✓".

<img src="prints/145-atos-celular-regras.jpg" width="260">

**Celular de Ana:** Ana é o ator: escolhe cena fácil (100) ou difícil (200).

<img src="prints/146-atos-celular-escolha.jpg" width="260">

**Telão (professor):** Telão: quem encena, o tempo e o placar dos times.

<img src="prints/147-atos-telao-encenando-1.jpg" width="760">

**Celular de Ana:** Celular do ator: a cena para encenar sem falar.

<img src="prints/148-atos-celular-cena.jpg" width="260">

**Celular de Carla:** Carla é do time da vez: adivinha em voz alta.

<img src="prints/149-atos-celular-time.jpg" width="260">

**Telão (professor):** Fim do turno: a cena é revelada.

<img src="prints/150-atos-telao-fim-1.jpg" width="760">

**Telão (professor):** Telão: quem encena, o tempo e o placar dos times.

<img src="prints/151-atos-telao-encenando-2.jpg" width="760">

**Telão (professor):** Tempo esgotado: os outros times podem roubar com um palpite.

<img src="prints/152-atos-telao-roubo.jpg" width="760">

**Telão (professor):** Fim do turno: a cena é revelada.

<img src="prints/153-atos-telao-fim-2.jpg" width="760">

**Telão (professor):** Placar do jogo: pontos, passos ganhos (👣) e bônus como 🍞 Pão e Água.

<img src="prints/154-atos-telao-placar.jpg" width="760">

**Telão (professor):** Momento Revelação: "Se a sua vida fosse uma "encenação profética" esta semana, o que as pessoas entenderiam sobre Deus só de te ver?" com enquete ao vivo e quem quer falar.

<img src="prints/155-atos-telao-momento-revelacao.jpg" width="760">

**Telão (professor):** Mapa do santuário: os avatares andam os passos ganhos.

<img src="prints/156-atos-telao-mapa.jpg" width="760">

**Celular de Carla:** Carla venceu o jogo e escolhe uma carta de recompensa.

<img src="prints/157-atos-celular-recompensa.jpg" width="260">


## 15. Jogo 12: Voz Profética

**Telão (professor):** Regras do jogo no telão (também aparecem no celular).

<img src="prints/158-voz-telao-regras.jpg" width="760">

**Celular de Carla:** Regras no celular, com o botão "Entendi ✓".

<img src="prints/159-voz-celular-regras.jpg" width="260">

**Telão (professor):** Telão: cada time com um caso da vida real e o roteiro de 3 passos.

<img src="prints/160-voz-telao-preparo.jpg" width="760">

**Celular de Ana:** Celular: o caso do time, o versículo e o roteiro (com porta-voz sugerido).

<img src="prints/161-voz-celular-preparo.jpg" width="260">

**Telão (professor):** Pitch de 1 minuto do time 1.

<img src="prints/162-voz-telao-pitch-1.jpg" width="760">

**Telão (professor):** Pitch de 1 minuto do time 2.

<img src="prints/163-voz-telao-pitch-2.jpg" width="760">

**Celular de Ana:** Ana avalia os OUTROS times: "Fiel ao texto" e "Prático para a vida".

<img src="prints/164-voz-celular-voto.jpg" width="260">

**Telão (professor):** Resultado: média de estrelas de cada time.

<img src="prints/165-voz-telao-resultado.jpg" width="760">

**Telão (professor):** Placar do jogo: pontos, passos ganhos (👣) e bônus como 🍞 Pão e Água.

<img src="prints/166-voz-telao-placar.jpg" width="760">

**Telão (professor):** Momento Revelação: "Se Deus te chamasse hoje para ser voz de esperança onde você vive, qual seria a sua primeira desculpa? 😅" com enquete ao vivo e quem quer falar.

<img src="prints/167-voz-telao-momento-revelacao.jpg" width="760">

**Telão (professor):** Mapa do santuário: os avatares andam os passos ganhos.

<img src="prints/168-voz-telao-mapa.jpg" width="760">


## 16. Final: véu, pódio e Rolo da Lição

**Telão (professor):** Diante do véu: quem chegou mais longe no caminho?

<img src="prints/169-final-veu.jpg" width="760">

**Telão (professor):** O véu se rasga: todos entram no Santíssimo, com o pódio e os destaques.

<img src="prints/170-final-podio.jpg" width="760">

**Celular de Ana:** Celular: a posição final.

<img src="prints/171-final-podio-celular.jpg" width="260">

**Telão (professor):** Rolo da Lição no telão: os 7 tópicos com exemplos e perguntas.

<img src="prints/172-final-rolo-telao.jpg" width="760">

**Telão (professor):** Clique num tópico: ele abre em tela cheia para discussão (← → para navegar).

<img src="prints/173-final-rolo-topico.jpg" width="760">


**Celular de Ana:** Rolo da Lição no celular, com o botão para baixar a imagem (capturado à parte).

<img src="prints/174-final-rolo-celular.jpg" width="260">

