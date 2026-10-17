/**
 * Carrega o catálogo e os pacotes de conteúdo sob demanda (public/conteudo/, gerado a partir de conteudo/).
 * O motor do jogo usa getPack() de forma síncrona: as telas garantem antes, com usePack(), que o pacote já chegou.
 */
import { useEffect, useState } from 'react'
import type { Catalog, CatalogItem, ContentPack } from './types'

const BASE = '/conteudo'
let catalogPromise: Promise<Catalog> | null = null
const packs = new Map<string, ContentPack>()
const pending = new Map<string, Promise<ContentPack>>()

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url)
  // um arquivo inexistente volta como a página do app (index.html), não como JSON
  if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) throw new Error(`Este conteúdo não existe ou ainda não foi publicado (${url.split('?')[0]}).`)
  return r.json() as Promise<T>
}

export function loadCatalog(): Promise<Catalog> {
  if (!catalogPromise) {
    catalogPromise = getJson<Catalog>(`${BASE}/catalogo.json`)
    catalogPromise.catch(() => (catalogPromise = null))
  }
  return catalogPromise
}

export function loadPack(id: string): Promise<ContentPack> {
  const cached = packs.get(id)
  if (cached) return Promise.resolve(cached)
  let p = pending.get(id)
  if (!p) {
    p = (async () => {
      const version = (await loadCatalog().catch(() => null))?.packs[id]?.version
      const pack = await getJson<ContentPack>(`${BASE}/pacotes/${id}.json${version ? `?v=${version}` : ''}`)
      packs.set(id, pack)
      return pack
    })()
    pending.set(id, p)
    p.catch(() => {}).finally(() => pending.delete(id))
  }
  return p
}

/** Síncrono: só depois de loadPack()/usePack() terem carregado o pacote. */
export function getPack(id: string): ContentPack {
  const p = packs.get(id)
  if (!p) throw new Error(`O pacote "${id}" ainda não foi carregado`)
  return p
}

type Loaded<T> = { data: T | null; error: string | null }

function useLoad<T>(key: string | null | undefined, load: (k: string) => Promise<T>, sync: (k: string) => T | undefined): Loaded<T> {
  const [state, setState] = useState<Loaded<T> & { key?: string }>(() => ({ data: key ? (sync(key) ?? null) : null, error: null, key: key ?? undefined }))
  useEffect(() => {
    if (!key) return
    let alive = true
    load(key).then(
      (data) => alive && setState({ data, error: null, key }),
      (e) => alive && setState({ data: null, error: String(e?.message ?? e), key }),
    )
    return () => {
      alive = false
    }
  }, [key, load])
  if (!key) return { data: null, error: null }
  if (state.key !== key) return { data: sync(key) ?? null, error: null }
  return state
}

export function usePack(id: string | null | undefined) {
  const { data, error } = useLoad(id, loadPack, (k) => packs.get(k))
  return { pack: data, error }
}

export function useCatalog() {
  const { data, error } = useLoad('catalogo', loadCatalog, () => undefined)
  return { catalog: data, error }
}

/** O pacote padrão do catálogo (usado onde ninguém escolheu um conteúdo, como "Como funciona"). */
export function useDefaultPack() {
  return usePackOrDefault(undefined)
}

/** O pacote pedido, ou o padrão do catálogo se nenhum foi pedido. */
export function usePackOrDefault(id: string | undefined) {
  const { catalog, error } = useCatalog()
  const r = usePack(id ?? catalog?.defaultPack)
  return { pack: r.pack, error: (id ? null : error) ?? r.error }
}

/* ───────── Catálogo: modos, semana atual, contagens ───────── */

export type Mode = 'licao' | 'temas' | 'livros'

export const MODES: { id: Mode; emoji: string; title: string; text: string }[] = [
  { id: 'licao', emoji: '📖', title: 'Lição da Escola Sabatina', text: 'A lição da semana, do trimestre todo' },
  { id: 'temas', emoji: '🌿', title: 'Temas bíblicos', text: 'As grandes histórias da Bíblia' },
  { id: 'livros', emoji: '📚', title: 'Livros', text: 'Livros e capítulos, como os de Ellen G. White' },
]

/** Data local de hoje como AAAA-MM-DD. */
export function todayIso(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** A semana da lição que inclui a data (a do primeiro público que tiver datas). */
export function currentWeek(catalog: Catalog, date = todayIso()) {
  for (const lesson of catalog.lessons)
    for (const quarter of lesson.quarters)
      for (const week of quarter.weeks) if (week.start && week.end && week.start <= date && date <= week.end) return { lesson, quarter, week }
  return null
}

/** A semana publicada mais recente até a data (para sugerir quando a desta semana ainda está em preparo). */
export function latestAvailableWeek(catalog: Catalog, date = todayIso()) {
  let best: { lesson: Catalog['lessons'][number]; quarter: Catalog['lessons'][number]['quarters'][number]; week: Catalog['lessons'][number]['quarters'][number]['weeks'][number] } | null = null
  for (const lesson of catalog.lessons)
    for (const quarter of lesson.quarters)
      for (const week of quarter.weeks) if (week.pack && (!week.start || week.start <= date) && (!best || (week.start ?? '') > (best.week.start ?? ''))) best = { lesson, quarter, week }
  return best
}

/** Quantos itens de cada modo já podem ser jogados, de quantos previstos. */
export function modeCounts(catalog: Catalog): Record<Mode, { ready: number; total: number }> {
  const count = (items: CatalogItem[]) => ({ ready: items.filter((i) => i.pack).length, total: items.length })
  return {
    licao: count(catalog.lessons.flatMap((l) => l.quarters.flatMap((q) => q.weeks))),
    temas: count(catalog.themes.flatMap((t) => t.items)),
    livros: count(catalog.books.flatMap((b) => b.chapters)),
  }
}

/** Em que modo do catálogo um pacote aparece (para o botão "trocar conteúdo"). */
export function modeOfPack(catalog: Catalog, packId: string): Mode | null {
  if (catalog.lessons.some((l) => l.quarters.some((q) => q.weeks.some((w) => w.pack === packId)))) return 'licao'
  if (catalog.themes.some((t) => t.items.some((i) => i.pack === packId))) return 'temas'
  if (catalog.books.some((b) => b.chapters.some((c) => c.pack === packId))) return 'livros'
  return null
}

export function truthSection(pack: ContentPack, truthId: string): string | undefined {
  return pack.truths.find((t) => t.id === truthId)?.section
}

export function sectionLabel(pack: ContentPack, sectionId: string | undefined): string {
  return pack.sections.find((s) => s.id === sectionId)?.label ?? ''
}

/** Verdades que um jogo trabalha neste pacote. */
export function gameTruths(pack: ContentPack, gameId: string): string[] {
  return pack.gameTruths[gameId] ?? []
}
