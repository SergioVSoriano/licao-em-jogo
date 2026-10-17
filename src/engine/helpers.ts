import type { GameCtx, Player, PlayerId } from './types'

export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function pick<T>(arr: T[], rng: () => number = Math.random): T {
  return arr[Math.floor(rng() * arr.length)]
}

/** Kahoot formula: 1000 → 500 over the timer; wrong = 0. */
export function speedPoints(elapsedMs: number, totalMs: number, base = 1000): number {
  const r = Math.min(1, Math.max(0, elapsedMs / totalMs))
  return Math.round(base * (1 - r / 2))
}

/** Longest increasing subsequence length (for timeline scoring). */
export function lis(arr: number[]): number {
  const tails: number[] = []
  for (const x of arr) {
    let lo = 0
    let hi = tails.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (tails[mid] < x) lo = mid + 1
      else hi = mid
    }
    tails[lo] = x
  }
  return tails.length
}

export function online(ctx: GameCtx): Player[] {
  return ctx.players.filter((p) => ctx.all[p.id]?.online !== false)
}

/** Players that may be drafted for spotlight turns. */
export function eligible(ctx: GameCtx, exclude: PlayerId[] = []): Player[] {
  const list = online(ctx).filter((p) => !ctx.all[p.id]?.noSpotlight && !exclude.includes(p.id))
  return list
}

export function draft(ctx: GameCtx, exclude: PlayerId[] = [], avoid: PlayerId[] = []): PlayerId | null {
  if (ctx.forcedSpotlight && !exclude.includes(ctx.forcedSpotlight) && ctx.all[ctx.forcedSpotlight]?.online) {
    return ctx.forcedSpotlight
  }
  let list = eligible(ctx, exclude)
  if (list.length === 0) return null
  const preferred = list.filter((p) => !avoid.includes(p.id))
  if (preferred.length) list = preferred
  return pick(list, ctx.rng).id
}

/** Balanced teams (snake draft by current steps). */
export function makeTeams(ctx: GameCtx, count: number): PlayerId[][] {
  const sorted = shuffle(ctx.players, ctx.rng).sort((a, b) => (ctx.all[b.id]?.steps ?? 0) - (ctx.all[a.id]?.steps ?? 0))
  const teams: PlayerId[][] = Array.from({ length: count }, () => [])
  sorted.forEach((p, i) => {
    const round = Math.floor(i / count)
    const idx = round % 2 === 0 ? i % count : count - 1 - (i % count)
    teams[idx].push(p.id)
  })
  return teams
}

export function teamCount(n: number, max = 3): number {
  if (n >= 16 && max >= 3) return 3
  return 2
}

export const TEAM_META = [
  { name: 'Azul', color: 'var(--azul)', shadow: 'var(--azul-s)', emoji: '🔷' },
  { name: 'Púrpura', color: 'var(--purpura)', shadow: 'var(--purpura-s)', emoji: '🟣' },
  { name: 'Carmesim', color: 'var(--carmesim)', shadow: 'var(--carmesim-s)', emoji: '🔺' },
]

export function normalizeWord(raw: string, synonyms?: Record<string, string>): string {
  let w = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!w) return ''
  if (synonyms && synonyms[w]) return synonyms[w]
  if (w.length > 4 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1)
  if (synonyms && synonyms[w]) return synonyms[w]
  return w
}

export function countBy<T>(list: T[], key: (t: T) => string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const x of list) {
    const k = key(x)
    out[k] = (out[k] ?? 0) + 1
  }
  return out
}

export function addXp(xp: Record<PlayerId, number>, pid: PlayerId, n: number) {
  xp[pid] = (xp[pid] ?? 0) + n
}

export function uid(n = 8): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789'
  let s = ''
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

function lev(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return dp[b.length]
}

export function cleanGuess(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\b(o|a|os|as|um|uma|e|eh|acho que|sera|seria)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Resposta digitada: aceita sem acento, com artigo, frase ("acho que é hulda") e erro leve de digitação. */
export function matchAnswer(guess: string, accept: string[]): boolean {
  const g = cleanGuess(guess)
  if (!g) return false
  for (const raw of accept) {
    const a = cleanGuess(raw)
    if (!a) continue
    if (g === a) return true
    const tol = a.length >= 9 ? 2 : a.length >= 5 ? 1 : 0
    if (lev(g, a) <= tol) return true
    if (a.length >= 4 && ` ${g} `.includes(` ${a} `)) return true
    // cada palavra do palpite contra a resposta (ex.: "hulda profetisa")
    if (a.length >= 5 && !a.includes(' ') && g.split(' ').some((w) => lev(w, a) <= tol)) return true
  }
  return false
}
