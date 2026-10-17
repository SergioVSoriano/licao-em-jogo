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
  pacotes/<tipo>/…/    um pacote = uma pasta com pacote.yaml, jogos.yaml e reflexoes.yaml
  fontes/<id>/         caderno do curador (PRIVADO, fora do Git público): notas, destaques, versículos, transcrições
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

## O que a IA (Claude) pode e não pode fazer

**Pode:**
- copiar texto do caderno do curador para o campo certo, sem mudar o sentido;
- dividir um texto do curador em itens;
- redigir perguntas e afirmações **factuais** sobre o que o texto bíblico narra, usando só referências que o curador listou;
- criar itens **mecânicos**;
- apontar lacunas ("faltam 3 afirmações para habilitar Verdade ou Falsificação").

**Não pode:**
- escrever reflexão, aplicação, moral da história, ideia central, insight, oração, enquete ou pergunta de discussão;
- explicar profecia, doutrina ou o "significado" de um texto;
- citar versículo, livro ou autor que não esteja no caderno do curador;
- citar Ellen G. White, a lição ou outra fonte que não esteja literalmente nos destaques do curador;
- reescrever a interpretação do curador "para ficar melhor". Se não couber no campo, avisa em vez de encurtar;
- mudar `status` para `publicado` ou preencher `curadoria.revisadoEm`.

Tudo o que a IA criar leva `origem: gerado`. Sugestões de reflexão ou de pergunta, se houver, vão para um arquivo de revisão **fora do pacote**; só entram se o curador as copiar para o próprio caderno.

## O que o validador garante hoje

- formato de cada campo e tamanhos;
- `secao`, `verdade`, personagem e estação referenciados existem;
- a opção `correta` de cada pergunta é uma das `opcoes`;
- pacote `publicado` não pode ter item `origem: gerado`;
- referências que não começam com um livro da Bíblia viram aviso (para conferir a fonte);
- o catálogo só destrava pacotes `publicado`.

Previsto para a fase de curadoria: conferir que os campos interpretativos e as citações existem literalmente no caderno do curador.

## Para publicar um pacote

1. Revise cada item com `origem: gerado` e troque para `origem: curador` (ou apague a linha).
2. Rode `npm run conteudo:validar` até não haver erros. Leia os avisos.
3. Abra o jogo (`npm run dev`) e confira o pacote no planejador e numa partida com robôs.
4. Mude `status: publicado` e preencha `curadoria.revisadoEm` com a data.
5. Escreva o id do pacote em `pacote:` no `catalogo.yaml` e faça o deploy.

## Direitos autorais e privacidade

- Use as **suas palavras** e **trechos curtos com referência**. Não copie páginas da lição, de traduções bíblicas ou de livros.
- Transcrições de vídeos e anotações ficam em `conteudo/fontes/`, que não vai para o repositório público. No pacote, registre só a fonte (`fontes:` com descrição e URL).
