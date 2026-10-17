/**
 * Carrega o catálogo e os pacotes de conteúdo sob demanda (public/conteudo/, gerado a partir de conteudo/).
 * O motor do jogo usa getPack() de forma síncrona: as telas garantem antes, com usePack(), que o pacote já chegou.
 */
import { useEffect, useState } from 'react'
import type { Catalog, ContentPack } from './types'

const BASE = '/conteudo'
let catalogPromise: Promise<Catalog> | null = null
const packs = new Map<string, ContentPack>()
const pending = new Map<string, Promise<ContentPack>>()

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Não foi possível carregar ${url} (${r.status})`)
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

/** O pacote padrão do catálogo (enquanto o menu de modos não existe). */
export function useDefaultPack() {
  const { catalog, error } = useCatalog()
  const r = usePack(catalog?.defaultPack)
  return { pack: r.pack, error: error ?? r.error }
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
