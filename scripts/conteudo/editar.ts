/**
 * Operações de curadoria que alteram os YAML (preservando comentários):
 * criar pacote, aprovar/remover itens gerados e publicar.
 * Aprovar e publicar são decisões do CURADOR: a CLI exige terminal interativo e a página /curadoria
 * só funciona no computador dele (npm run dev).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { isScalar, isSeq, parse, parseDocument, type Document } from 'yaml'
import { lerConteudo } from './construir'

export interface Alvo {
  id: string
  arquivo: 'pacote.yaml' | 'jogos.yaml' | 'reflexoes.yaml'
  caminho: (string | number)[]
}

/** Onde mora (ou vai morar) a pasta de um pacote, a partir do id. */
export function pastaPeloId(raiz: string, id: string): { tipo: 'licao' | 'tema' | 'livro'; pasta: string } {
  let m = id.match(/^licao-(\d{4}-t\d)-([a-z]+)-s(\d+)$/)
  if (m) return { tipo: 'licao', pasta: join(raiz, 'pacotes', 'licao', `${m[1]}-${m[2]}`, `s${m[3].padStart(2, '0')}`) }
  m = id.match(/^tema-([a-z0-9-]+)$/)
  if (m) return { tipo: 'tema', pasta: join(raiz, 'pacotes', 'temas', m[1]) }
  m = id.match(/^livro-([a-z0-9-]+)-c(\d+)$/)
  if (m) return { tipo: 'livro', pasta: join(raiz, 'pacotes', 'livros', m[1], `c${m[2]}`) }
  throw new Error(`id inválido: "${id}". Use licao-AAAA-tN-publico-sNN, tema-nome ou livro-nome-cNN.`)
}

/** Pasta de um pacote que já existe (procura pelo id dentro de pacote.yaml). */
export function acharPasta(raiz: string, id: string): string {
  const r = lerConteudo(raiz)
  const d = r.detalhes.find((x) => x.id === id)
  if (d) return join(raiz, d.pasta)
  const { pasta } = pastaPeloId(raiz, id)
  if (existsSync(join(pasta, 'pacote.yaml'))) return pasta
  throw new Error(`pacote "${id}" não encontrado em ${raiz}/pacotes`)
}

function abrir(arquivo: string): Document {
  return parseDocument(readFileSync(arquivo, 'utf8'))
}
function salvar(arquivo: string, doc: Document) {
  writeFileSync(arquivo, doc.toString({ lineWidth: 0 }))
}

/** O curador aprova um item gerado (ou uma síntese): origem passa a "curador". */
export function aprovar(raiz: string, a: Alvo) {
  const arq = join(acharPasta(raiz, a.id), a.arquivo)
  const doc = abrir(arq)
  if (a.caminho[0] === 'listasGeradas') {
    const lista = String(a.caminho[1])
    const seq = doc.get('listasGeradas')
    if (isSeq(seq)) seq.items = seq.items.filter((it) => !(isScalar(it) && it.value === lista))
  } else {
    if (!doc.hasIn(a.caminho)) throw new Error(`item não encontrado: ${a.arquivo} ${a.caminho.join('.')}`)
    doc.setIn([...a.caminho, 'origem'], 'curador')
  }
  salvar(arq, doc)
}

/** O curador descarta um item gerado. */
export function remover(raiz: string, a: Alvo) {
  const arq = join(acharPasta(raiz, a.id), a.arquivo)
  const doc = abrir(arq)
  if (a.caminho[0] === 'listasGeradas') {
    const lista = String(a.caminho[1])
    doc.set(lista, lista === 'disfarcados' ? doc.createNode({}) : doc.createNode([]))
    const seq = doc.get('listasGeradas')
    if (isSeq(seq)) seq.items = seq.items.filter((it) => !(isScalar(it) && it.value === lista))
  } else {
    if (!doc.hasIn(a.caminho)) throw new Error(`item não encontrado: ${a.arquivo} ${a.caminho.join('.')}`)
    doc.deleteIn(a.caminho)
  }
  salvar(arq, doc)
}

/** Aprova de uma vez todos os itens gerados (opcionalmente só de um tipo). Sínteses interpretativas incluídas. */
export function aprovarTodos(raiz: string, id: string, tipo?: string) {
  const d = lerConteudo(raiz).detalhes.find((x) => x.id === id)
  if (!d) throw new Error(`pacote "${id}" não encontrado`)
  const alvos: Alvo[] = [
    ...d.gerados.filter((g) => !tipo || g.tipo === tipo).map((g) => ({ id, arquivo: g.arquivo as Alvo['arquivo'], caminho: g.caminho })),
    ...(tipo ? [] : d.origem.filter((o) => o.pendente).map((o) => ({ id, arquivo: o.arquivo as Alvo['arquivo'], caminho: o.caminho }))),
  ]
  // do fim para o começo não importa aqui (setIn não muda índices), mas evita repetir o mesmo item
  const vistos = new Set<string>()
  for (const a of alvos) {
    const k = `${a.arquivo}:${a.caminho.join('.')}`
    if (vistos.has(k)) continue
    vistos.add(k)
    aprovar(raiz, a)
  }
  return vistos.size
}

/** Publica: só se não houver erro nem item pendente. Marca status, data de revisão e liga no catálogo. */
export function publicar(raiz: string, id: string, hoje = new Date().toISOString().slice(0, 10)) {
  const d = lerConteudo(raiz).detalhes.find((x) => x.id === id)
  if (!d) throw new Error(`pacote "${id}" não encontrado`)
  if (d.erros.length) throw new Error(`o pacote tem ${d.erros.length} erro(s): ${d.erros[0]}`)
  if (d.pendentes) throw new Error(`ainda há ${d.pendentes} item(ns) para revisar`)
  const arq = join(raiz, d.pasta, 'pacote.yaml')
  const doc = abrir(arq)
  doc.set('status', 'publicado')
  doc.setIn(['curadoria', 'revisadoEm'], hoje)
  salvar(arq, doc)
  ligarNoCatalogo(raiz, id)
}

/** Escreve "pacote: <id>" no item do catálogo correspondente (semana, tema ou capítulo). Devolve se achou. */
export function ligarNoCatalogo(raiz: string, id: string): boolean {
  const arq = join(raiz, 'catalogo.yaml')
  const doc = abrir(arq)
  const { tipo } = pastaPeloId(raiz, id)
  let caminho: (string | number)[] | null = null
  const cat = parse(readFileSync(arq, 'utf8')) as {
    licao: { publico: string; trimestres: { id: string; semanas: { n: number }[] }[] }[]
    temas: { itens: { id: string }[] }[]
    livros: { id: string; capitulos: { n: number }[] }[]
  }
  if (tipo === 'licao') {
    const [, tri, pub, n] = id.match(/^licao-(\d{4}-t\d)-([a-z]+)-s(\d+)$/)!
    cat.licao.forEach((l, i) =>
      l.trimestres.forEach((t, j) =>
        t.semanas.forEach((s, k) => {
          if (l.publico === pub && t.id === tri && s.n === Number(n)) caminho = ['licao', i, 'trimestres', j, 'semanas', k]
        }),
      ),
    )
  } else if (tipo === 'tema') {
    cat.temas.forEach((t, i) => t.itens.forEach((it, k) => it.id === id && (caminho = ['temas', i, 'itens', k])))
  } else {
    const [, livro, n] = id.match(/^livro-([a-z0-9-]+)-c(\d+)$/)!
    cat.livros.forEach((b, i) => b.id === livro && b.capitulos.forEach((c, k) => c.n === Number(n) && (caminho = ['livros', i, 'capitulos', k])))
  }
  if (!caminho) return false
  doc.setIn([...(caminho as (string | number)[]), 'pacote'], id)
  salvar(arq, doc)
  return true
}

/** Cria a pasta de um pacote novo (rascunho) e o caderno do curador, a partir dos modelos. */
export function novoPacote(raiz: string, id: string, titulo: string) {
  const { tipo, pasta } = pastaPeloId(raiz, id)
  if (existsSync(join(pasta, 'pacote.yaml'))) throw new Error(`já existe um pacote em ${pasta}`)
  mkdirSync(pasta, { recursive: true })
  const modelos = join(raiz, 'modelos')
  for (const f of ['pacote.yaml', 'jogos.yaml', 'reflexoes.yaml']) {
    const txt = readFileSync(join(modelos, f), 'utf8').replaceAll('{{id}}', id).replaceAll('{{tipo}}', tipo).replaceAll('{{titulo}}', titulo)
    writeFileSync(join(pasta, f), txt)
  }
  const fontes = join(raiz, 'fontes', id)
  mkdirSync(fontes, { recursive: true })
  if (!existsSync(join(fontes, 'LEIA-ME.md'))) writeFileSync(join(fontes, 'LEIA-ME.md'), readFileSync(join(modelos, 'LEIA-ME-caderno.md'), 'utf8').replaceAll('{{id}}', id))
  const ligado = ligarNoCatalogo(raiz, id)
  return { pasta, fontes, ligado }
}

/** Para a página de curadoria: o YAML de autoria cru de um pacote (para mostrar os itens). */
export function lerAutoria(raiz: string, id: string) {
  const pasta = acharPasta(raiz, id)
  const ler = (f: string) => (existsSync(join(pasta, f)) ? parse(readFileSync(join(pasta, f), 'utf8')) : null)
  return { pacote: ler('pacote.yaml'), jogos: ler('jogos.yaml'), reflexoes: ler('reflexoes.yaml') }
}

