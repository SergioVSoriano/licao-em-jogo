// Teste do fluxo de curadoria (npm run conteudo:testar): roda numa CÓPIA de conteudo/ numa pasta temporária.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { lerConteudo } from './construir'
import { aprovar, aprovarTodos, novoPacote, publicar, remover } from './editar'

const R = join(tmpdir(), 'licao-em-jogo-teste-curadoria')
rmSync(R, { recursive: true, force: true })
// o caderno real (privado) não entra na cópia
cpSync('conteudo', R, { recursive: true, filter: (f) => !f.replaceAll('\\', '/').includes('conteudo/fontes/') })
let falhas = 0
const ok = (c: boolean, m: string) => {
  if (!c) falhas++
  console.log(`${c ? '✅' : '❌'} ${m}`)
}

// catálogo: tema de teste
const cat = readFileSync(join(R, 'catalogo.yaml'), 'utf8').replace('      - { id: tema-noe,', '      - { id: tema-teste, emoji: 🧪, titulo: Tema de teste }\n      - { id: tema-noe,')
writeFileSync(join(R, 'catalogo.yaml'), cat)

const n = novoPacote(R, 'tema-teste', 'Tema de teste')
ok(n.ligado, 'novo pacote criado e ligado ao catálogo')
let d = lerConteudo(R).detalhes.find((x) => x.id === 'tema-teste')!
ok(d.status === 'rascunho' && d.erros.length > 0, `modelo vazio é rascunho com ${d.erros.length} pendência(s) que não travam o build`)
ok(lerConteudo(R).erros.length === 0, 'rascunho incompleto não gera erro global')

// caderno fictício do curador
mkdirSync(join(R, 'fontes', 'tema-teste'), { recursive: true })
writeFileSync(
  join(R, 'fontes', 'tema-teste', 'notas-do-curador.md'),
  `Fonte: colado na conversa em 17/10/2026

Frase de teste A, escrita pelo curador para a ideia central do pacote.
Frase de teste B: o curador quer destacar este ponto na verdade um.
Frase de teste C sobre a conversa em grupo depois do jogo.
Pergunta de teste do curador para a turma conversar?
Versículos citados: Gênesis 6:9 e Gênesis 7:1.
`,
)

const P = join(R, 'pacotes', 'temas', 'teste')
writeFileSync(
  join(P, 'pacote.yaml'),
  `id: tema-teste
tipo: tema
titulo: Tema de teste
subtitulo: Tema bíblico
datas: ""
textoBase: Gênesis 6–9
publico: [jovens]
status: rascunho
curadoria: { curador: Teste, revisadoEm: null }
fontes: [{ tipo: anotacoes, descricao: Caderno do curador }]
abertura:
  versiculo: { ref: Gn 6:9, texto: "trecho curto" }
  tirinha: [um, dois, três]
  ideiaCentral: Frase de teste A, escrita pelo curador para a ideia central do pacote.
secoes: [{ id: s1, titulo: Parte 1 }]
verdades:
  - id: V1
    secao: s1
    emoji: "📖"
    titulo: Verdade de teste
    texto: Resumo da frase B sobre o ponto destacado.
    refs: [Gn 7:1]
    naLicao: Frase de teste C sobre a conversa em grupo depois do jogo.
    exemplos: []
    pergunta: Pergunta de teste do curador para a turma conversar?
    origem: gerado
    base: ["o curador quer destacar este ponto na verdade um"]
`,
)
writeFileSync(
  join(P, 'jogos.yaml'),
  `perguntas:
  - { pergunta: "Pergunta factual 1?", opcoes: [a, b, c, d], correta: b, explicacao: x, ref: Gn 6:9, verdade: V1, origem: gerado }
  - { pergunta: "Pergunta factual 2?", opcoes: [a, b, c, d], correta: c, explicacao: x, ref: Gn 7:1, verdade: V1, origem: gerado }
  - { pergunta: "Pergunta factual 3?", opcoes: [a, b, c, d], correta: a, explicacao: x, ref: Ex 3:1, verdade: V1, origem: gerado }
palavrasDoSonho: [um, dois, três, quatro, cinco, seis]
listasGeradas: [palavrasDoSonho]
`,
)
writeFileSync(
  join(P, 'reflexoes.yaml'),
  `revelacoes:
  - verdade: V1
    versiculo: { ref: Gn 6:9, texto: "trecho" }
    naLicao: Frase de teste C sobre a conversa em grupo depois do jogo.
    naBiblia: []
    ideia: Uma ideia que o curador nunca escreveu.
    pergunta: Pergunta de teste do curador para a turma conversar?
    enquete: { pergunta: Pergunta de teste do curador para a turma conversar?, opcoes: [sim, não] }
resumo: { perguntas: [], versiculos: [] }
`,
)
d = lerConteudo(R).detalhes.find((x) => x.id === 'tema-teste')!
const o = (r: string) => d.origem.find((x) => x.rotulo.startsWith(r))!
ok(o('Ideia central').status === 'literal', 'ideia central literal do caderno = ✅')
ok(o('Verdade V1').status === 'base' && o('Verdade V1').pendente, 'verdade resumida com base = 🟡 pendente')
ok(o('Momento Revelação').status === 'sem-origem', 'revelação com ideia inventada = 🔴')
ok(d.erros.some((e) => e.includes('não tem origem no caderno')), 'erro de origem aparece')
ok(d.avisos.some((a) => a.includes('Ex 3:1')), 'referência fora do caderno (Ex 3:1) vira aviso')
ok(d.gerados.length === 4, `itens gerados: ${d.gerados.length} (3 perguntas + lista do Sonho)`)

// corrige a revelação (texto literal) e revisa
writeFileSync(join(P, 'reflexoes.yaml'), readFileSync(join(P, 'reflexoes.yaml'), 'utf8').replace('Uma ideia que o curador nunca escreveu.', 'Frase de teste C sobre a conversa em grupo depois do jogo.'))
d = lerConteudo(R).detalhes.find((x) => x.id === 'tema-teste')!
ok(d.erros.length === 0, `sem erros depois de corrigir (${d.erros.join(' | ')})`)
let falhou = false
try {
  publicar(R, 'tema-teste')
} catch {
  falhou = true
}
ok(falhou, 'publicar é recusado com itens pendentes')
remover(R, { id: 'tema-teste', arquivo: 'jogos.yaml', caminho: ['perguntas', 2] })
aprovar(R, { id: 'tema-teste', arquivo: 'jogos.yaml', caminho: ['listasGeradas', 'palavrasDoSonho'] })
const nAprov = aprovarTodos(R, 'tema-teste')
ok(nAprov === 3, `aprovar todos: ${nAprov} (2 perguntas + 1 síntese)`)
d = lerConteudo(R).detalhes.find((x) => x.id === 'tema-teste')!
ok(d.pendentes === 0 && d.podePublicar, 'nada pendente: pode publicar')
ok(readFileSync(join(P, 'jogos.yaml'), 'utf8').includes('origem: curador') && !readFileSync(join(P, 'jogos.yaml'), 'utf8').includes('Pergunta factual 3'), 'YAML editado: aprovado e removido')
publicar(R, 'tema-teste')
const r = lerConteudo(R)
ok(r.erros.length === 0 && r.catalogo!.themes.some((t) => t.items.some((i) => i.id === 'tema-teste' && i.pack === 'tema-teste')), 'publicado e destravado no catálogo')
ok(readFileSync(join(P, 'pacote.yaml'), 'utf8').includes('revisadoEm: '), 'revisadoEm preenchido')

rmSync(R, { recursive: true, force: true })
console.log(falhas ? `\n${falhas} falha(s).` : '\nFluxo de curadoria ok.')
process.exit(falhas ? 1 : 0)
