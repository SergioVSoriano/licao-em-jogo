import { pack as l03 } from './l03-profetas'
import type { ContentPack } from './types'

export const PACKS: ContentPack[] = [l03]
export const DEFAULT_PACK = l03

export function getPack(id: string): ContentPack {
  return PACKS.find((p) => p.id === id) ?? DEFAULT_PACK
}

export function truthDay(pack: ContentPack, truthId: string) {
  return pack.truths.find((t) => t.id === truthId)?.day
}
