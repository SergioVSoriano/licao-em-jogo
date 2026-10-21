/**
 * Checagem de origem: todo texto interpretativo do pacote precisa vir do caderno do curador
 * (conteudo/fontes/<id>/). Ou o texto está literalmente lá, ou o item traz em "base" trechos
 * literais do caderno que o sustentam (síntese, que o curador aprova). Sem IA: só comparação de texto.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import type { ItemGerado, ItemOrigem } from '../../src/content/curadoria'
import type { TJogos, TPacoteBase, TReflexoes } from './esquema'

/** Arquivos do caderno que NÃO contam como fonte (escritos pela ferramenta, não pelo curador). */
const IGNORAR = new Set(['revisao.md', 'leia-me.md'])

export interface Caderno {
  pasta: string
  arquivos: { nome: string; norm: string }[]
}

/** Minúsculas, sem acento, sem pontuação, espaços simples: "Levanta-te e come!" → "levanta te e come". */
export function normTexto(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function lerCaderno(raiz: string, id: string): Caderno | null {
  const pasta = join(raiz, 'fontes', id)
  if (!existsSync(pasta)) return null
  const arquivos: Caderno['arquivos'] = []
  const andar = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name)
      if (e.isDirectory()) andar(p)
      else if (/\.(md|txt)$/i.test(e.name) && !IGNORAR.has(e.name.toLowerCase()) && !e.name.startsWith('_'))
        arquivos.push({ nome: relative(pasta, p).replaceAll('\\', '/'), norm: normTexto(readFileSync(p, 'utf8')) })
    }
  }
  andar(pasta)
  return { pasta, arquivos }
}

function acharNoCaderno(c: Caderno, texto: string): string | undefined {
  const n = normTexto(texto)
  if (!n) return undefined
  return c.arquivos.find((a) => a.norm.includes(n))?.nome
}

type ComOrigem = { origem?: 'curador' | 'gerado'; base?: string[] }

function item(c: Caderno, arquivo: string, caminho: (string | number)[], rotulo: string, x: ComOrigem, campos: [string, string][]): ItemOrigem {
  const cs = campos.filter(([, t]) => t?.trim()).map(([campo, texto]) => ({ campo, texto, literal: !!acharNoCaderno(c, texto) }))
  const base = (x.base ?? []).map((trecho) => {
    const arq = acharNoCaderno(c, trecho)
    return { trecho, achado: !!arq, ...(arq ? { arquivo: arq } : {}) }
  })
  const literal = cs.every((f) => f.literal)
  const status = literal ? 'literal' : base.length && base.every((b) => b.achado) ? 'base' : 'sem-origem'
  return { arquivo, caminho, rotulo, campos: cs, base, status, ...(x.origem ? { origem: x.origem } : {}), pendente: x.origem === 'gerado' || (status === 'base' && x.origem !== 'curador') }
}

/** Todos os itens interpretativos do pacote, com a ligação de cada um ao caderno. */
export function checarOrigem(c: Caderno, b: TPacoteBase, j: TJogos, r: TReflexoes): ItemOrigem[] {
  const out: ItemOrigem[] = []
  out.push(item(c, 'pacote.yaml', ['abertura'], 'Ideia central', b.abertura, [['ideiaCentral', b.abertura.ideiaCentral]]))
  b.verdades.forEach((v, i) =>
    out.push(item(c, 'pacote.yaml', ['verdades', i], `Verdade ${v.id}: ${v.titulo}`, v, [['texto', v.texto], ['naLicao', v.naLicao], ['pergunta', v.pergunta]])),
  )
  r.revelacoes.forEach((v, i) =>
    out.push(
      item(c, 'reflexoes.yaml', ['revelacoes', i], `Momento Revelação${v.jogo ? ` (${v.jogo})` : ''}: ${v.versiculo.ref}`, v, [
        ['naLicao', v.naLicao],
        ['ideia', v.ideia],
        ['pergunta', v.pergunta],
        ['enquete.pergunta', v.enquete.pergunta],
        ...v.outrasPerguntas.map((q, k): [string, string] => [`outrasPerguntas.${k}`, q]),
      ]),
    ),
  )
  j.nuvem.forEach((v, i) => out.push(item(c, 'jogos.yaml', ['nuvem', i], `Nuvem: ${v.pergunta}`, v, [['pergunta', v.pergunta]])))
  j.vozProfetica.forEach((v, i) => out.push(item(c, 'jogos.yaml', ['vozProfetica', i], `Voz Profética: ${v.caso}`, v, [['caso', v.caso]])))
  if (r.resumo.perguntas.length)
    out.push(item(c, 'reflexoes.yaml', ['resumo'], 'Perguntas do resumo', r.resumo, r.resumo.perguntas.map((q, k): [string, string] => [`perguntas.${k}`, q])))
  for (const [id, v] of Object.entries(r.pontesDoSantuario)) {
    const x = typeof v === 'string' ? { texto: v } : v
    out.push(item(c, 'reflexoes.yaml', ['pontesDoSantuario', id], `Ponte do santuário: ${id}`, x, [['texto', x.texto]]))
  }
  return out
}

const curto = (s: string, n = 90) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

/** Itens marcados "origem: gerado" (criados pela IA) e listas inteiras geradas. */
export function listarGerados(b: TPacoteBase, j: TJogos, r: TReflexoes): ItemGerado[] {
  const out: ItemGerado[] = []
  const add = <T extends { origem?: string }>(arquivo: string, chave: string, tipo: string, lista: T[], rotulo: (x: T) => string) =>
    lista.forEach((x, i) => x.origem === 'gerado' && out.push({ arquivo, caminho: [chave, i], tipo, rotulo: curto(rotulo(x)) }))
  if (b.abertura.origem === 'gerado') out.push({ arquivo: 'pacote.yaml', caminho: ['abertura'], tipo: 'Abertura', rotulo: curto(b.abertura.ideiaCentral) })
  add('pacote.yaml', 'verdades', 'Verdade', b.verdades, (x) => `${x.id}: ${x.titulo}`)
  add('pacote.yaml', 'personagens', 'Personagem', b.personagens, (x) => `${x.id}: ${x.bio}`)
  add('jogos.yaml', 'perguntas', 'Pergunta', j.perguntas, (x) => x.pergunta)
  add('jogos.yaml', 'verdadeiroOuFalso', 'Verdade ou Falsificação', j.verdadeiroOuFalso, (x) => x.afirmacao)
  add('jogos.yaml', 'linhasDoTempo', 'Linha do Tempo', j.linhasDoTempo, (x) => x.titulo)
  add('jogos.yaml', 'tresSinais', 'Três Sinais', j.tresSinais, (x) => `${x.resposta}: ${x.dicas.join(' / ')}`)
  add('jogos.yaml', 'frutoProibido', 'Fruto Proibido', j.frutoProibido, (x) => `${x.palavra} (${x.proibidas.join(', ')})`)
  add('jogos.yaml', 'mimicas', 'Mímica', j.mimicas, (x) => x.cena)
  add('jogos.yaml', 'nuvem', 'Nuvem', j.nuvem, (x) => x.pergunta)
  add('jogos.yaml', 'vozProfetica', 'Voz Profética', j.vozProfetica, (x) => x.caso)
  add('reflexoes.yaml', 'revelacoes', 'Momento Revelação', r.revelacoes, (x) => `${x.versiculo.ref}: ${x.ideia}`)
  if (r.resumo.origem === 'gerado') out.push({ arquivo: 'reflexoes.yaml', caminho: ['resumo'], tipo: 'Resumo', rotulo: curto(r.resumo.perguntas.join(' · ')) })
  for (const [id, v] of Object.entries(r.pontesDoSantuario))
    if (typeof v !== 'string' && v.origem === 'gerado') out.push({ arquivo: 'reflexoes.yaml', caminho: ['pontesDoSantuario', id], tipo: 'Ponte do santuário', rotulo: curto(v.texto) })
  const NOMES: Record<string, string> = { palavrasDoSonho: 'Palavras do Sonho', temasAcrostico: 'Temas do Acróstico', curiosidades: 'Curiosidades', disfarcados: 'Pistas dos Disfarçados' }
  for (const lista of j.listasGeradas) {
    const v = j[lista]
    const itens = Array.isArray(v) ? v : Object.entries(v).map(([k, xs]) => `${k}: ${xs.join(' / ')}`)
    out.push({ arquivo: 'jogos.yaml', caminho: ['listasGeradas', lista], tipo: NOMES[lista] ?? lista, rotulo: curto(itens.join(' · '), 160), lista })
  }
  return out
}

/**
 * Referências bíblicas do pacote cujo livro e capítulo não aparecem no caderno
 * (a IA não deve trazer versículos que o curador não citou). Devolve as que faltam.
 */
export function refsForaDoCaderno(c: Caderno, refs: string[], livros: { nome: string; abrev: string[] }[]): string[] {
  const texto = ' ' + c.arquivos.map((a) => a.norm).join(' ') + ' '
  const variantes = livros.map((l) => {
    const vs = new Set<string>()
    for (const v of [l.nome, ...l.abrev]) {
      const n = normTexto(v)
      vs.add(n)
      vs.add(n.replace(/^([1-3]) /, '$1'))
      vs.add(n.replace(/^([1-3])([a-z])/, '$1 $2'))
    }
    return [...vs]
  })
  const fora = new Set<string>()
  for (const ref of refs)
    for (const parte of ref.split(';').map((s) => s.trim())) {
      const n = normTexto(parte)
      const i = variantes.findIndex((vs) => vs.some((v) => n.startsWith(v + ' ')))
      if (i < 0) continue // não é bíblica (ou é continuação): o validador já avisa
      const v = variantes[i].find((x) => n.startsWith(x + ' '))!
      const cap = n.slice(v.length + 1).split(' ')[0]
      if (!/^\d+$/.test(cap)) continue
      if (!variantes[i].some((x) => new RegExp(` ${x.replace(/ /g, ' ?')} ?${cap}(?!\\d)`).test(texto))) fora.add(parte)
    }
  return [...fora]
}
