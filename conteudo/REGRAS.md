# Regras de curadoria do conteúdo

Este arquivo vale para **pessoas e para o Claude**. Ele decide o que pode entrar num pacote e quem pode escrever cada coisa. Só o curador muda estas regras.

## Princípio

**Pessoas interpretam a Bíblia; a IA só formata.** Toda reflexão, aplicação, ênfase, ideia, pergunta de discussão e enquete nasce de um curador humano. O jogo em si não usa IA nenhuma.

## Onde as coisas ficam

```
conteudo/
  REGRAS.md            este arquivo
  catalogo.yaml        o menu: lição (trimestres e semanas), temas e livros. Sem "pacote" = travado
  comum/               listas compartilhadas: livros da Bíblia, personagens, estações do santuário
  modelos/             modelos comentados para um pacote novo (npm run conteudo:novo)
  pacotes/<tipo>/…/    um pacote = uma pasta com pacote.yaml, jogos.yaml e reflexoes.yaml
  fontes/<id>/         caderno do curador (PRIVADO, fora do Git público): tudo o que ele mandou, como veio
```

O app nunca lê os YAML direto. `npm run conteudo:construir` (e o `npm run dev`/`build`, sozinhos) validam e geram `public/conteudo/`. **Não edite `public/conteudo/` à mão.**

## Os três arquivos de um pacote

| Arquivo | O que tem |
| --- | --- |
| `pacote.yaml` | id, tipo (`licao`, `tema`, `livro`), títulos, público, `status`, `curadoria`, `fontes`, abertura (versículo, tirinha, ideia central), `secoes`, `verdades`, `personagens`, `coberturaDosJogos` |
| `jogos.yaml` | conteúdo de cada minijogo. **Tudo opcional**: jogo sem material aparece travado no planejador |
| `reflexoes.yaml` | Momento Revelação (`revelacoes`), `pontesDoSantuario`, `resumo` |

O formato exato (campos, tipos, tamanhos) está em `scripts/conteudo/esquema.ts`. O validador explica cada erro com o arquivo e o campo.

## Três tipos de campo

| Tipo | Campos | Quem escreve |
| --- | --- | --- |
| **Interpretativo** | `ideiaCentral`, `verdades` (texto, `naLicao`, `pergunta`), tudo de `reflexoes.yaml` (ideia, perguntas, enquete, `naLicao`), `vozProfetica`, `nuvem` (perguntas), `pontesDoSantuario`, `resumo.perguntas`, significado das estações | **Só o curador.** O texto tem de vir do caderno dele |
| **Factual** | perguntas, afirmações de V/F, eventos da linha do tempo, dicas dos Três Sinais, pistas, bios, curiosidades | O curador, ou a IA a partir de um fato que está no caderno, sempre com `ref` |
| **Mecânico** | alternativas erradas, palavras proibidas, palavras do Sonho, temas do acróstico, mímicas, respostas aceitas, palpites errados | A IA pode criar, marcando `origem: gerado` |

## Como o curador entrega o material

Sem formato fixo. Numa conversa com o Claude neste projeto, digite **/montar-pacote**, diga o que quer preparar e anexe ou cole o que tiver: anotações, PDFs, transcrições de vídeo, lista de versículos, trechos da lição ou de livros. A skill (`.claude/skills/montar-pacote/SKILL.md`):

1. guarda tudo, **sem alterar**, no caderno `conteudo/fontes/<id>/` (PDFs viram .txt com `scripts/conteudo/extrair-texto.py`);
2. organiza nos campos do pacote, seguindo as regras abaixo;
3. valida e escreve `revisao.md` no caderno com o que precisa da sua atenção.

Depois o curador revisa e publica na página **/curadoria** (só no computador dele, com `npm run dev`).

## Origem: como o validador sabe que a interpretação é do curador

Cada campo interpretativo precisa estar ligado ao caderno de um destes jeitos:

| Na página /curadoria | Significa | Precisa de aprovação? |
| --- | --- | --- |
| ✅ do caderno | o texto está **literalmente** no caderno (ignorando maiúsculas, acentos e pontuação) | não |
| 🟡 síntese | a IA resumiu ou juntou trechos; o item traz `base:` com trechos **literais** do caderno que o sustentam, e `origem: gerado` | sim: o curador confere e aprova |
| 🔴 sem origem | o texto não está no caderno e não tem base encontrada | é **erro**: não dá para publicar |

Exemplo de síntese com base:

```yaml
verdades:
  - id: V2
    texto: Deus cuida antes de cobrar.
    origem: gerado
    base:
      - "o anjo trouxe pão e água antes de qualquer sermão"
      - "Deus primeiro cuidou do corpo de Elias"
```

Pacote **sem caderno** (escrito à mão direto no YAML, ou anterior a estas regras): a checagem de origem não é feita e o validador avisa.

## O que a IA (Claude) pode e não pode fazer

**Pode:**
- guardar o material do curador no caderno, exatamente como veio;
- copiar texto do caderno para o campo certo;
- resumir ou juntar trechos do curador **com `base`** e `origem: gerado`, sem acrescentar nenhuma ideia;
- redigir perguntas e afirmações **factuais** sobre o que o texto bíblico narra, usando só referências que o curador citou;
- criar itens **mecânicos** (alternativas, palavras proibidas, mímicas, palavras do Sonho…);
- apontar lacunas e deixar `PREENCHER` onde falta material do curador.

**Não pode:**
- escrever reflexão, aplicação, moral da história, ideia central, insight, oração, enquete ou pergunta de discussão que não esteja no caderno;
- explicar profecia, doutrina ou o "significado" de um texto;
- citar versículo, livro ou autor que não esteja no caderno;
- citar Ellen G. White, a lição ou outra fonte que não esteja literalmente no caderno;
- escrever no caderno texto que não veio do curador, ou alterar o material dele;
- pôr `origem: curador`, mudar `status` para `publicado`, preencher `curadoria.revisadoEm`, chamar a API da curadoria ou rodar `conteudo:publicar`.

Tudo o que a IA criar leva `origem: gerado` (ou, nas listas simples, o nome da lista em `listasGeradas`). Sugestões de reflexão ou de pergunta vão para `revisao.md`, **fora do pacote**; só entram se o curador as copiar para o próprio caderno.

## O que o validador garante

- formato de cada campo e tamanhos;
- `secao`, `verdade`, personagem e estação referenciados existem; a `correta` é uma das `opcoes`;
- **origem**: cada texto interpretativo está no caderno ou tem `base` encontrada no caderno (senão, erro);
- referências bíblicas que não aparecem no caderno viram aviso; referências não bíblicas também (para conferir a fonte);
- pacote `publicado` não pode ter nada pendente (item `gerado`, síntese não aprovada, lista em `listasGeradas`);
- **rascunho** com problema não trava o site: vira aviso, e o pacote só é gerado quando ficar válido;
- o catálogo só destrava pacotes `publicado`.

No caderno, `revisao.md` e `LEIA-ME.md` não contam como fonte (são escritos pela ferramenta).

## Para publicar um pacote

1. `npm run dev` e abra **http://localhost:5173/curadoria/<id>**.
2. Confira cada texto (✅ 🟡 🔴) e cada item criado pela IA: **Aprovar** ou **✕ remover**. Para corrigir um texto, edite o YAML ou peça ao Claude, e volte à página.
3. **Testar no planejador** e jogar uma partida com robôs.
4. **Publicar** (o botão só libera sem erros e sem pendências). No terminal, o equivalente é `npm run conteudo:publicar -- <id>`, que pede confirmação.
5. Peça o commit e o deploy.

Para começar um pacote à mão: `npm run conteudo:novo -- <id> "<título>"` cria a pasta a partir de `conteudo/modelos/` (com comentários em cada campo), o caderno e liga o item do catálogo.

## Direitos autorais e privacidade

- Use as **suas palavras** e **trechos curtos com referência**. Não copie páginas da lição, de traduções bíblicas ou de livros.
- Transcrições de vídeos e anotações ficam em `conteudo/fontes/`, que não vai para o repositório público. No pacote, registre só a fonte (`fontes:` com descrição e URL).
