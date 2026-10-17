/**
 * Lê conteudo/ (YAML), valida e gera public/conteudo/ (JSON que o app baixa).
 * Sem IA: só regras fixas. Usado pela CLI (npm run conteudo:validar / conteudo:construir)
 * e pelo plugin do Vite (roda sozinho no npm run dev e no npm run build).
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parse } from 'yaml'
import type { z } from 'zod'
import type { Catalog, CatalogItem, ContentPack } from '../../src/content/types'
import { Catalogo, Estacoes, Jogos, LivrosBiblicos, PacoteBase, Personagens, Reflexoes, type TCatalogo, type TJogos, type TPacoteBase, type TReflexoes } from './esquema'

export interface Resultado {
  erros: string[]
  avisos: string[]
  pacotes: ContentPack[]
  catalogo: Catalog | null
}

type Estacao = { id: string; nome: string; emoji: string; significado: string; ref: string }
type Registro = { id: string; nome: string; emoji: string }

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[.\s]/g, '')
    .toLowerCase()

function lerYaml<T extends z.ZodType>(arquivo: string, esquema: T, erros: string[], raiz: string): z.infer<T> | null {
  const nome = relative(raiz, arquivo).replaceAll('\\', '/')
  let dados: unknown
  try {
    dados = parse(readFileSync(arquivo, 'utf8'))
  } catch (e) {
    erros.push(`${nome}: YAML inválido: ${(e as Error).message.split('\n')[0]}`)
    return null
  }
  const r = esquema.safeParse(dados ?? {})
  if (!r.success) {
    for (const i of r.error.issues) erros.push(`${nome}: ${i.path.join('.') || '(raiz)'}: ${i.message}`)
    return null
  }
  return r.data
}

function pastasDePacote(dir: string): string[] {
  if (!existsSync(dir)) return []
  const out: string[] = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue
    const p = join(dir, e.name)
    if (existsSync(join(p, 'pacote.yaml'))) out.push(p)
    else out.push(...pastasDePacote(p))
  }
  return out
}

/** Confere se cada parte de uma referência começa com um livro da Bíblia. Devolve as partes que não são bíblicas. */
function refsNaoBiblicas(ref: string, livros: Set<string>): string[] {
  const fora: string[] = []
  for (const parte of ref.split(/;/).map((s) => s.trim()).filter(Boolean)) {
    if (/^[\d\s:–-]+$/.test(parte)) continue // continuação: "8", "10:1", "11-12"
    const m = parte.match(/^([1-3]?\s*[^\d\s:–-]+)/)
    if (!m || !livros.has(norm(m[1]))) fora.push(parte)
  }
  return fora
}

export function lerConteudo(raiz = 'conteudo'): Resultado {
  const erros: string[] = []
  const avisos: string[] = []
  const pacotes: ContentPack[] = []

  const estacoes = lerYaml(join(raiz, 'comum/estacoes-santuario.yaml'), Estacoes, erros, raiz)
  const registro = lerYaml(join(raiz, 'comum/personagens.yaml'), Personagens, erros, raiz)
  const biblia = lerYaml(join(raiz, 'comum/livros-biblicos.yaml'), LivrosBiblicos, erros, raiz)
  const catalogo = lerYaml(join(raiz, 'catalogo.yaml'), Catalogo, erros, raiz)
  if (!estacoes || !registro || !biblia) return { erros, avisos, pacotes, catalogo: null }

  const livros = new Set(biblia.livros.flatMap((l) => [l.nome, ...l.abrev].map(norm)))
  const porPersonagem = new Map(registro.personagens.map((p) => [p.id, p]))
  const idsEstacoes = new Set(estacoes.estacoes.map((e) => e.id))

  for (const pasta of pastasDePacote(join(raiz, 'pacotes'))) {
    const nome = relative(raiz, pasta).replaceAll('\\', '/')
    const base = lerYaml(join(pasta, 'pacote.yaml'), PacoteBase, erros, raiz)
    const jogos = existsSync(join(pasta, 'jogos.yaml')) ? lerYaml(join(pasta, 'jogos.yaml'), Jogos, erros, raiz) : Jogos.parse({})
    if (!existsSync(join(pasta, 'reflexoes.yaml'))) erros.push(`${nome}: falta reflexoes.yaml (ao menos uma revelação)`)
    const reflexoes = existsSync(join(pasta, 'reflexoes.yaml')) ? lerYaml(join(pasta, 'reflexoes.yaml'), Reflexoes, erros, raiz) : null
    if (!base || !jogos || !reflexoes) continue
    const antes = erros.length
    conferir(nome, base, jogos, reflexoes, { porPersonagem, idsEstacoes, livros }, erros, avisos)
    if (erros.length > antes) continue
    pacotes.push(paraApp(base, jogos, reflexoes, estacoes.estacoes, porPersonagem))
  }

  const ids = new Set<string>()
  for (const p of pacotes) {
    if (ids.has(p.id)) erros.push(`pacote repetido: ${p.id}`)
    ids.add(p.id)
  }

  const cat = catalogo ? montarCatalogo(catalogo, pacotes, erros, avisos) : null
  return { erros, avisos, pacotes, catalogo: cat }
}

function conferir(
  nome: string,
  base: TPacoteBase,
  jogos: TJogos,
  reflexoes: TReflexoes,
  comum: { porPersonagem: Map<string, Registro>; idsEstacoes: Set<string>; livros: Set<string> },
  erros: string[],
  avisos: string[],
) {
  const e = (m: string) => erros.push(`${nome}: ${m}`)
  const secoes = new Set(base.secoes.map((s) => s.id))
  const verdades = new Set<string>()
  for (const v of base.verdades) {
    if (verdades.has(v.id)) e(`verdade repetida: ${v.id}`)
    verdades.add(v.id)
    if (!secoes.has(v.secao)) e(`verdade ${v.id}: a seção "${v.secao}" não existe em "secoes"`)
  }
  const temVerdade = (onde: string, id: string) => {
    if (!verdades.has(id)) e(`${onde}: a verdade "${id}" não existe`)
  }
  jogos.perguntas.forEach((q, i) => temVerdade(`perguntas[${i}]`, q.verdade))
  jogos.verdadeiroOuFalso.forEach((q, i) => temVerdade(`verdadeiroOuFalso[${i}]`, q.verdade))
  jogos.nuvem.forEach((q, i) => temVerdade(`nuvem[${i}]`, q.verdade))
  reflexoes.revelacoes.forEach((r, i) => temVerdade(`revelacoes[${i}]`, r.verdade))
  for (const [jogo, vs] of Object.entries(base.coberturaDosJogos)) (vs ?? []).forEach((v) => temVerdade(`coberturaDosJogos.${jogo}`, v))

  const personagens = new Set(base.personagens.map((p) => p.id))
  for (const p of base.personagens) if (!comum.porPersonagem.has(p.id)) e(`o personagem "${p.id}" não está em comum/personagens.yaml`)
  for (const id of Object.keys(jogos.disfarcados)) if (!personagens.has(id)) e(`disfarcados: o personagem "${id}" não está em "personagens" do pacote`)
  for (const id of Object.keys(reflexoes.pontesDoSantuario)) if (!comum.idsEstacoes.has(id)) e(`pontesDoSantuario: a estação "${id}" não existe`)

  if (base.status === 'publicado') {
    const itens: { origem?: string }[] = [
      ...base.verdades,
      ...base.personagens,
      ...jogos.perguntas,
      ...jogos.verdadeiroOuFalso,
      ...jogos.linhasDoTempo,
      ...jogos.tresSinais,
      ...jogos.frutoProibido,
      ...jogos.mimicas,
      ...jogos.nuvem,
      ...jogos.vozProfetica,
    ]
    const gerados = itens.filter((x) => x.origem === 'gerado').length
    if (gerados) e(`está "publicado" com ${gerados} item(ns) "origem: gerado". Revise cada um e troque para "origem: curador" (ou apague a linha) antes de publicar.`)
  }

  const refs = [
    base.abertura.versiculo.ref,
    ...base.verdades.flatMap((v) => [...v.refs, ...v.exemplos.map((x) => x.ref)]),
    ...jogos.perguntas.map((q) => q.ref),
    ...jogos.verdadeiroOuFalso.map((q) => q.ref),
    ...jogos.linhasDoTempo.map((q) => q.ref),
    ...jogos.tresSinais.map((q) => q.ref),
    ...jogos.vozProfetica.map((q) => q.ref),
    ...reflexoes.revelacoes.flatMap((r) => [r.versiculo.ref, ...r.naBiblia.map((x) => x.ref)]),
    ...reflexoes.resumo.versiculos.map((v) => v.ref),
  ]
  const fora = [...new Set(refs.flatMap((r) => refsNaoBiblicas(r, comum.livros)))]
  if (fora.length) avisos.push(`${nome}: referências que não são da Bíblia (confira se a fonte está certa): ${fora.join(' · ')}`)
}

function paraApp(b: TPacoteBase, j: TJogos, r: TReflexoes, estacoes: Estacao[], porPersonagem: Map<string, Registro>): ContentPack {
  const bb = (x: { ref: string; texto: string }) => ({ ref: x.ref, text: x.texto })
  const semVersao: Omit<ContentPack, 'version'> = {
    id: b.id,
    kind: b.tipo,
    status: b.status,
    audience: b.publico,
    curation: { curator: b.curadoria.curador, reviewedAt: b.curadoria.revisadoEm, ...(b.curadoria.observacao ? { note: b.curadoria.observacao } : {}) },
    sources: b.fontes.map((f) => ({ type: f.tipo, label: f.descricao, ...(f.url ? { url: f.url } : {}) })),
    sections: b.secoes.map((s) => ({ id: s.id, label: s.titulo })),
    gameTruths: b.coberturaDosJogos as Record<string, string[]>,
    title: b.titulo,
    subtitle: b.subtitulo,
    dates: b.datas,
    keyText: b.textoBase,
    openingVerse: bb(b.abertura.versiculo),
    comic: b.abertura.tirinha,
    bigIdea: b.abertura.ideiaCentral,
    truths: b.verdades.map((v) => ({ id: v.id, section: v.secao, emoji: v.emoji, title: v.titulo, text: v.texto, refs: v.refs, lesson: v.naLicao, examples: v.exemplos.map(bb), question: v.pergunta })),
    characters: b.personagens.map((p) => {
      const c = porPersonagem.get(p.id)!
      return { id: p.id, name: c.nome, emoji: c.emoji, bio: p.bio, refs: p.refs, clues: p.pistas, ...(p.disfarcado ? { inDisguise: true } : {}) }
    }),
    questions: j.perguntas.map((q) => ({ q: q.pergunta, options: q.opcoes, answer: q.opcoes.indexOf(q.correta), explain: q.explicacao, ref: q.ref, truth: q.verdade })),
    trueFalse: j.verdadeiroOuFalso.map((s) => ({ text: s.afirmacao, isTrue: s.verdadeira, explain: s.explicacao, ref: s.ref, truth: s.verdade })),
    timelines: j.linhasDoTempo.map((t) => ({ id: t.id, title: t.titulo, ref: t.ref, events: t.eventos })),
    threeSigns: j.tresSinais.map((t) => ({ answer: t.resposta, ask: t.tipo, clues: t.dicas, accept: t.aceitas, options: t.palpitesErrados, ref: t.ref })),
    taboo: j.frutoProibido.map((t) => ({ word: t.palavra, forbidden: t.proibidas })),
    dreamWords: j.palavrasDoSonho,
    acrosticThemes: j.temasAcrostico,
    mimes: j.mimicas.map((m) => ({ text: m.cena, hard: m.dificil })),
    cloudPrompts: j.nuvem.map((c) => ({ text: c.pergunta, scored: c.pontua, truth: c.verdade, ...(c.sinonimos ? { synonyms: c.sinonimos } : {}) })),
    pitchCases: j.vozProfetica.map((p) => ({ text: p.caso, ref: p.ref })),
    revelations: r.revelacoes.map((x) => ({
      game: x.jogo ?? '',
      truth: x.verdade,
      verse: x.versiculo.ref,
      verseText: x.versiculo.texto,
      lesson: x.naLicao,
      bible: x.naBiblia.map(bb),
      insight: x.ideia,
      question: x.pergunta,
      poll: { q: x.enquete.pergunta, options: x.enquete.opcoes },
      followUps: x.outrasPerguntas,
      ...(x.nota ? { note: x.nota } : {}),
    })),
    stations: estacoes.map((s) => ({ id: s.id, name: s.nome, emoji: s.emoji, meaning: s.significado, bridge: r.pontesDoSantuario[s.id] ?? '', ref: s.ref })),
    funFacts: j.curiosidades,
    disguiseClues: j.disfarcados,
    summary: { questions: r.resumo.perguntas, verses: r.resumo.versiculos.map(bb) },
  }
  const version = createHash('sha256').update(JSON.stringify(semVersao)).digest('hex').slice(0, 10)
  return { ...semVersao, version }
}

function montarCatalogo(c: TCatalogo, pacotes: ContentPack[], erros: string[], avisos: string[]): Catalog {
  const publicados = new Map(pacotes.filter((p) => p.status === 'publicado').map((p) => [p.id, p]))
  const todos = new Map(pacotes.map((p) => [p.id, p]))
  const usados = new Set<string>()
  const item = (id: string, x: { titulo: string; datas?: string; textoBase?: string; pacote?: string }): CatalogItem => {
    let pack: string | null = null
    if (x.pacote) {
      usados.add(x.pacote)
      if (publicados.has(x.pacote)) pack = x.pacote
      else if (todos.has(x.pacote)) avisos.push(`catalogo.yaml: "${x.titulo}" aponta para ${x.pacote}, que ainda é rascunho (fica travado)`)
      else erros.push(`catalogo.yaml: "${x.titulo}" aponta para o pacote "${x.pacote}", que não existe ou está com erro`)
    }
    return { id, title: x.titulo, ...(x.datas ? { dates: x.datas } : {}), ...(x.textoBase ? { keyText: x.textoBase } : {}), pack }
  }
  const cat: Catalog = {
    defaultPack: c.padrao,
    lessons: c.licao.map((l) => ({
      audience: l.publico,
      label: l.titulo,
      quarters: l.trimestres.map((t) => ({ id: t.id, label: t.titulo, weeks: t.semanas.map((s) => ({ n: s.n, ...item(`${t.id}-${l.publico}-s${s.n}`, s) })) })),
    })),
    themes: c.temas.map((t) => ({ category: t.categoria, items: t.itens.map((i) => item(i.id, i)) })),
    books: c.livros.map((b) => ({ id: b.id, title: b.titulo, author: b.autor, chapters: b.capitulos.map((ch) => ({ n: ch.n, ...item(`${b.id}-c${ch.n}`, ch) })) })),
    packs: Object.fromEntries([...publicados.values()].map((p) => [p.id, { version: p.version, title: p.title, kind: p.kind }])),
  }
  if (!publicados.has(c.padrao)) erros.push(`catalogo.yaml: "padrao" (${c.padrao}) precisa ser um pacote publicado`)
  for (const p of pacotes) if (!usados.has(p.id)) avisos.push(`o pacote ${p.id} não aparece no catalogo.yaml (ninguém consegue escolhê-lo)`)
  return cat
}

/** Escreve public/conteudo/ do zero. Rascunhos também são gerados (para a prévia), mas ficam travados no catálogo. */
export function escreverSaida(r: Resultado, saida = 'public/conteudo') {
  rmSync(saida, { recursive: true, force: true })
  mkdirSync(join(saida, 'pacotes'), { recursive: true })
  writeFileSync(join(saida, 'catalogo.json'), JSON.stringify(r.catalogo))
  for (const p of r.pacotes) writeFileSync(join(saida, 'pacotes', `${p.id}.json`), JSON.stringify(p))
}

export function construirConteudo(raiz = 'conteudo', saida = 'public/conteudo'): Resultado {
  const r = lerConteudo(raiz)
  if (!r.erros.length) escreverSaida(r, saida)
  return r
}
