---
name: montar-pacote
description: Monta ou atualiza um pacote de conteúdo do Lição em Jogo (uma semana da Lição da Escola Sabatina, um tema bíblico ou um capítulo de livro) a partir do material do curador — anotações, PDFs, transcrições de vídeo, versículos, textos colados na conversa — guardando tudo no caderno do curador e organizando nos campos dos jogos, SEM interpretar a Bíblia. Use quando o usuário pedir para preparar, montar, criar, completar ou atualizar conteúdo, uma lição, uma semana, um tema ou um capítulo, ou digitar /montar-pacote.
---

# /montar-pacote

Você transforma o material do **curador** (a pessoa que interpreta) em um pacote do jogo. Você **organiza, copia, resume com prova e formata**. Você **não interpreta**: toda reflexão, aplicação, ênfase, ideia, pergunta de discussão e enquete precisa estar no material do curador. O validador confere isso por código (checagem de origem) e a página `/curadoria` mostra ao curador de onde veio cada texto.

Leia antes: `conteudo/REGRAS.md` (regras completas) e, como exemplo de pacote pronto, `conteudo/pacotes/licao/2026-t4-jovens/s03-profetas-do-at/`.

## 1. Descubra qual conteúdo é

- Pergunte só o que faltar: qual lição (trimestre, público, semana), qual tema ou qual livro/capítulo, e o nome do curador.
- Monte o **id**: `licao-AAAA-tN-publico-sNN` (ex.: `licao-2026-t4-jovens-s04`), `tema-nome` (ex.: `tema-noe`), `livro-nome-cNN` (ex.: `livro-egw-profetas-e-reis-c14`).
- Veja `conteudo/catalogo.yaml`. Se o tema, o livro ou o capítulo ainda não estiver lá, **acrescente a entrada** (título, emoji, textoBase) na categoria certa, sem `pacote`.
- Se o pacote não existe: `npm run conteudo:novo -- <id> "<título>"`. Isso cria a pasta do pacote (rascunho, a partir de `conteudo/modelos/`), o caderno `conteudo/fontes/<id>/` e liga o item do catálogo.
- Se o pacote já existe, você está **atualizando**: não reescreva itens com `origem: curador` (já aprovados) sem o curador pedir.

## 2. Guarde o material no caderno, sem mudar nada

Tudo o que o curador mandar vai para `conteudo/fontes/<id>/`, **exatamente como veio**. É a partir desses arquivos que a origem é conferida.

| O curador mandou | Você faz |
| --- | --- |
| Texto colado na conversa | Grave em `AAAA-MM-DD-assunto.md`, com a 1ª linha `Fonte: colado na conversa em DD/MM/AAAA` e depois o texto integral |
| Arquivo .txt/.md anexado (com caminho) | Copie para o caderno com um nome descritivo |
| PDF anexado (com caminho) | Copie o PDF para o caderno e extraia o texto: `python scripts/conteudo/extrair-texto.py <pdf> conteudo/fontes/<id>/<nome>.txt [páginas]`. Sem Python/PyMuPDF, leia o PDF com a ferramenta de leitura e grave o texto integral num .txt |
| Anexo que chegou só como conteúdo (sem caminho) | Grave o conteúdo integral num .md |
| Link de vídeo/transcrição | Grave a transcrição com URL, autor e data no topo |

Proibido no caderno: resumir, corrigir, completar ou escrever texto seu. As únicas exceções são `LEIA-ME.md` e `revisao.md`, que o validador ignora. Material grande não é problema: guarde inteiro e leia em partes.

## 3. Leia e mapeie

Leia o caderno inteiro e separe, para você:
- **Interpretação do curador**: ênfases, mensagens, reflexões, aplicações, perguntas, ideias de enquete, insights.
- **Versículos e citações** que ele usou (só estes podem aparecer no pacote).
- **Fatos** (narrativa bíblica, nomes, lugares, números, datas) para os jogos.
- **Estrutura**: dias da lição, partes da história ou blocos do capítulo → `secoes`.

## 4. Preencha o pacote

Arquivos: `pacote.yaml`, `jogos.yaml`, `reflexoes.yaml` na pasta do pacote. O formato exato está em `scripts/conteudo/esquema.ts`; os modelos comentados em `conteudo/modelos/`.

### Campos interpretativos (os mais importantes)

`abertura.ideiaCentral`, `verdades` (`texto`, `naLicao`, `pergunta`), tudo de `revelacoes` (`naLicao`, `ideia`, `pergunta`, `enquete.pergunta`, `outrasPerguntas`), `nuvem[].pergunta`, `vozProfetica[].caso`, `resumo.perguntas`, `pontesDoSantuario`.

1. **Prefira copiar** do caderno (uma frase inteira ou um trecho). Texto literal passa sozinho: não precisa de `origem` nem `base`.
2. Se precisar **resumir ou juntar** trechos: escreva usando **só** ideias dos trechos, ponha `origem: gerado` e `base:` com 1 a 3 trechos **copiados literalmente** do caderno (12 caracteres ou mais) que sustentam o texto. Nenhuma ideia nova.
3. Se o caderno **não tem** material para um campo obrigatório: **não invente**. Deixe `PREENCHER` e anote em `revisao.md` o que o curador precisa escrever. O pacote continua rascunho até ele completar.
4. Sugestões suas de pergunta ou reflexão: só em `revisao.md`, na seção "Sugestões (só entram se você copiar para o seu caderno)".

### Campos factuais e mecânicos (você pode criar, marcados)

| Campo | Regra |
| --- | --- |
| `perguntas`, `verdadeiroOuFalso`, `linhasDoTempo`, `tresSinais`, `personagens` (bio, pistas) | Fatos do caderno ou do texto bíblico que o curador citou; `ref` obrigatória e só com referências do caderno; `origem: gerado` |
| alternativas erradas, `frutoProibido`, `mimicas`, `aceitas`, `palpitesErrados` | `origem: gerado` no item |
| `palavrasDoSonho`, `temasAcrostico`, `curiosidades`, `disfarcados` | São listas simples: ponha o nome da lista em `listasGeradas` |
| citações de Ellen G. White, da lição ou de livros | Só se estiverem literalmente no caderno |

Personagens: use os ids de `conteudo/comum/personagens.yaml`; um personagem novo entra lá (id, nome, emoji).

### Quanto criar (mínimos para destravar cada jogo, e o ideal)

| Jogo | Mínimo | Ideal |
| --- | --- | --- |
| Lançar Sortes / Duelo (`perguntas`) | 3 | 15 a 24 |
| Verdade ou Falsificação | 5 | 10 a 14 |
| Linha do Tempo | 1 | 2 a 4 |
| Três Sinais | 3 | 6 a 10 |
| Nuvem (interpretativo) | 1 | 3 a 5 |
| Fruto Proibido | 6 | 12 a 16 |
| O Sonho do Rei | 6 palavras | 20 a 30 |
| Acróstico | 1 tema | 3 a 4 |
| Atos Proféticos | 2 fáceis + 2 difíceis | 6 + 6 |
| Voz Profética (interpretativo) | 2 casos | 3 a 4 |
| Disfarçados | 4 personagens com pistas | 8 a 12 |
| Momento Revelação | 1 | uma por jogo provável, ou 4 a 7 gerais |

Textos curtos (tela de celular): pergunta até ~120 caracteres, alternativas até ~40. `secoes`: lição = `sab, dom, seg, ter, qua, qui, sex`; tema = partes da história; capítulo = blocos. Preencha `coberturaDosJogos` ligando cada jogo às verdades que ele trabalha.

## 5. Valide até zerar os erros

```bash
npm run conteudo:validar -- <id>
```

- "sem origem no caderno" = você escreveu interpretação que não está no caderno: troque por texto literal, dê `base` correta ou volte para `PREENCHER`.
- "trecho de base não encontrado" = o trecho não é cópia exata: copie de novo do arquivo.
- Avisos de referência fora do caderno: remova a referência ou confira com o curador.

## 6. Escreva `conteudo/fontes/<id>/revisao.md`

Para o curador: o que você usou de cada arquivo; quantos itens criou por tipo; as sínteses que pedem aprovação; o que ficou `PREENCHER` e por quê; e as sugestões separadas.

## 7. Entregue ao curador

Diga, em poucas linhas, o que foi montado e peça para ele:
1. rodar `npm run dev` e abrir **http://localhost:5173/curadoria/<id>**;
2. conferir cada texto (✅ do caderno, 🟡 síntese, 🔴 sem origem) e cada item criado por você, aprovando ou removendo;
3. testar no planejador e clicar em **Publicar**;
4. pedir o commit e o deploy.

## Nunca

- Interpretar a Bíblia, explicar profecia ou doutrina, criar moral da história, aplicação, oração, reflexão, enquete ou pergunta de discussão.
- Citar versículo, livro ou autor que não esteja no caderno.
- Escrever no caderno texto que não veio do curador, ou alterar o material dele.
- Pôr `origem: curador`, mudar `status` para `publicado`, preencher `curadoria.revisadoEm`, chamar a API `/__curadoria` ou rodar `conteudo:publicar`: aprovar e publicar são do curador.
- Fazer commit ou deploy sem o usuário pedir.
