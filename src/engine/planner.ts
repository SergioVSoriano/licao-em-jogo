import type { ContentPack } from '../content/types'
import { gameTruths, truthSection } from '../content'
import type { Depth, GameDef, PlanItem } from './types'

export const OVERHEAD: Record<Depth, number> = { leve: 1.75, equilibrado: 2.5, profundo: 3.75 }
export const REVEAL_SECONDS: Record<Depth, number> = { leve: 30, equilibrado: 75, profundo: 150 }
export const FIXED_MINUTES = 4 // abertura 1,5 + final 2,5
export const TOLERANCE = 1.05

export function maxRounds(def: GameDef, pack: ContentPack): number {
  return Math.min(def.rounds.max, def.maxRoundsFor ? def.maxRoundsFor(pack) : def.rounds.max)
}

/** O pacote tem conteúdo suficiente para ao menos o mínimo de rodadas deste jogo? */
export function hasContent(def: GameDef, pack: ContentPack): boolean {
  return maxRounds(def, pack) >= def.rounds.min
}

/** Rodadas sugeridas, limitadas ao conteúdo que o pacote tem. */
export function defaultRounds(def: GameDef, pack: ContentPack, n: number): number {
  return Math.max(def.rounds.min, Math.min(def.rounds.default(n), maxRounds(def, pack)))
}

export function estimateGame(def: GameDef, n: number, rounds: number, depth: Depth): number {
  return def.perRound(n) * rounds + (def.setup ?? 0) + OVERHEAD[depth]
}

export function estimatePlan(plan: PlanItem[], games: Record<string, GameDef>, n: number, depth: Depth) {
  const items = plan.map((p) => ({ ...p, minutes: estimateGame(games[p.gameId], n, p.rounds, depth) }))
  const total = FIXED_MINUTES + items.reduce((a, b) => a + b.minutes, 0)
  return { items, total }
}

/** Seções do pacote (dias da lição, partes da história…) que o plano cobre. */
export function coverage(plan: PlanItem[], pack: ContentPack): Set<string> {
  const sections = new Set<string>()
  for (const p of plan) {
    for (const t of gameTruths(pack, p.gameId)) {
      const d = truthSection(pack, t)
      if (d) sections.add(d)
    }
  }
  return sections
}

export interface FitResult {
  plan: PlanItem[]
  total: number
  status: 'ok' | 'warn' | 'over'
  changes: string[]
}

/** Reduce rounds (non-favourites first) until the plan fits the time budget. */
export function fitPlan(plan: PlanItem[], games: Record<string, GameDef>, n: number, depth: Depth, minutes: number, protect?: string): FitResult {
  const out = plan.map((p) => ({ ...p }))
  const changes: string[] = []
  const before = out.map((p) => p.rounds)
  let { total } = estimatePlan(out, games, n, depth)
  let guard = 200
  while (total > minutes && guard-- > 0) {
    const candidates = out
      .map((p, i) => ({ p, i, def: games[p.gameId] }))
      .filter(({ p, def }) => p.rounds > def.rounds.min)
      .sort((a, b) => Number(a.p.gameId === protect) - Number(b.p.gameId === protect) || Number(!!a.p.fav) - Number(!!b.p.fav) || b.def.perRound(n) * (b.p.rounds - b.def.rounds.min) - a.def.perRound(n) * (a.p.rounds - a.def.rounds.min))
    if (!candidates.length) break
    candidates[0].p.rounds -= 1
    total = estimatePlan(out, games, n, depth).total
  }
  out.forEach((p, i) => {
    if (p.rounds !== before[i]) changes.push(`${games[p.gameId].name}: ${before[i]} → ${p.rounds} ${games[p.gameId].rounds.label}`)
  })
  const status = total <= minutes ? 'ok' : total <= minutes * TOLERANCE ? 'warn' : 'over'
  return { plan: out, total, status, changes }
}

/** Spend spare time on extra rounds — favourites first. */
export function fillPlan(plan: PlanItem[], games: Record<string, GameDef>, pack: ContentPack, n: number, depth: Depth, minutes: number): PlanItem[] {
  const out = plan.map((p) => ({ ...p }))
  let guard = 100
  while (guard-- > 0) {
    const { total } = estimatePlan(out, games, n, depth)
    const spare = minutes - total
    const cand = out
      .map((p) => ({ p, def: games[p.gameId] }))
      .filter(({ p, def }) => p.rounds < maxRounds(def, pack) && def.perRound(n) <= spare)
      .sort((a, b) => Number(!!b.p.fav) - Number(!!a.p.fav) || a.p.rounds / maxRounds(a.def, pack) - b.p.rounds / maxRounds(b.def, pack))
    if (!cand.length) break
    cand[0].p.rounds += 1
  }
  return out
}

/** Greedy suggestion: cover lesson days, vary formats, warm-up first, application last. */
export function suggestPlan(all: GameDef[], pack: ContentPack, n: number, depth: Depth, minutes: number): PlanItem[] {
  const chosen: GameDef[] = []
  const days = new Set<string>()
  const kinds = new Set<string>()
  let total = FIXED_MINUTES
  const available = all.filter((g) => n >= g.minPlayers && hasContent(g, pack))
  for (;;) {
    let best: GameDef | null = null
    let bestScore = -Infinity
    for (const g of available) {
      if (chosen.includes(g)) continue
      const est = estimateGame(g, n, defaultRounds(g, pack, n), depth)
      if (total + est > minutes) continue
      let score = 0
      for (const t of gameTruths(pack, g.id)) {
        const d = truthSection(pack, t)
        if (d && !days.has(d)) score += 3
      }
      if (!kinds.has(g.kind)) score += 2
      if (chosen.length === 0 && g.kind === 'all') score += 2
      score += g.depth * 0.6 + g.energy * 0.3 - est * 0.15
      if (score > bestScore) {
        bestScore = score
        best = g
      }
    }
    if (!best) break
    chosen.push(best)
    total += estimateGame(best, n, defaultRounds(best, pack, n), depth)
    gameTruths(pack, best.id).forEach((t) => {
      const d = truthSection(pack, t)
      if (d) days.add(d)
    })
    kinds.add(best.kind)
  }
  return orderArc(chosen).map((g) => ({ gameId: g.id, rounds: defaultRounds(g, pack, n) }))
}

/** Aquecer → História → Social → Aplicação */
export function orderArc(games: GameDef[]): GameDef[] {
  const rank = (g: GameDef) => {
    if (g.id === 'voz') return 9
    if (g.kind === 'all' && g.energy <= 2 && g.depth >= 2) return g.id === 'nuvem' ? 0 : 2
    if (g.kind === 'all') return 3
    if (g.kind === 'spotlight') return 5
    return 6
  }
  return games.slice().sort((a, b) => rank(a) - rank(b))
}

export interface Preset {
  id: string
  name: string
  emoji: string
  minutes: number
  depth: Depth
  description: string
  games: string[]
}

export const PRESETS: Preset[] = [
  { id: 'recomendado', name: 'Recomendado', emoji: '⭐', minutes: 35, depth: 'equilibrado', description: 'Cobre as partes do conteúdo', games: ['nuvem', 'linha', 'verdade', 'sinais', 'sortes'] },
  { id: 'relampago', name: 'Relâmpago', emoji: '⚡', minutes: 20, depth: 'leve', description: 'Rápido e animado', games: ['verdade', 'nuvem', 'duelo'] },
  { id: 'festa', name: 'Festa', emoji: '🎉', minutes: 30, depth: 'equilibrado', description: 'Os mais divertidos', games: ['nuvem', 'acrostico', 'sonho', 'sortes'] },
  { id: 'debate', name: 'Debate profundo', emoji: '🧠', minutes: 40, depth: 'profundo', description: 'Mais conversa e aplicação', games: ['linha', 'nuvem', 'fruto', 'voz'] },
]
