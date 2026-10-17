import type { ComponentType } from 'react'
import type { ContentPack } from '../content/types'

export type PlayerId = string

export interface Player {
  id: PlayerId
  name: string
  avatar: string
  color: number
  noSpotlight: boolean
  bot?: boolean
  online: boolean
  joinedAt: number
  steps: number
  firsts: number
  normSum: number
  xpTotal: number
  breadAt?: number
}

export interface InputMsg {
  pid: PlayerId
  type: string
  data?: any
  at: number
}

export type Depth = 'leve' | 'equilibrado' | 'profundo'

export interface Settings {
  minutes: number
  depth: Depth
  expectedPlayers: number
  rewards: boolean
  sound: boolean
  /** perfil do grupo escolhido no planejador (classe, pg, familia, evento) */
  profile?: string
  /** ninguém termina um jogo com pontos negativos (perfil Família) */
  noNegative?: boolean
}

export interface PlanItem {
  gameId: string
  rounds: number
  fav?: boolean
}

export interface Effects {
  double?: boolean
  shield?: boolean
  lamp?: boolean
}

export interface GameCtx {
  pack: ContentPack
  /** participants of the current game (online + offline) */
  players: Player[]
  all: Record<PlayerId, Player>
  now: number
  rng: () => number
  effects: Record<PlayerId, Effects>
  forcedSpotlight?: PlayerId
  /** a sessão não permite pontos negativos (perfil Família) */
  noNegative?: boolean
}

export interface Control {
  id: string
  label: string
  key?: string
  tone?: 'primary' | 'ok' | 'bad' | 'neutral' | 'gold'
  data?: any
  /** extra controls (shown inline / in the judge phone grid, not in the host bar) */
  small?: boolean
}

export interface ViewProps<V = any, P = any> {
  view: V
  priv?: P
  me?: Player
  players: Record<PlayerId, Player>
  now: number
  pack: ContentPack
  send: (type: string, data?: any) => void
  participant: boolean
  /** host-only: fire a game control (e.g. clicking a word on the telão) */
  control?: (id: string, data?: any) => void
}

export interface HowTo {
  steps: { icon: string; text: string }[]
  scoring: string[]
  phone: string
  tip?: string
}

export interface GameDef<S = any, V = any, P = any> {
  id: string
  name: string
  icon: string
  origin: string
  tagline: string
  kind: 'all' | 'spotlight' | 'teams'
  needsJudge: boolean
  minPlayers: number
  idealRange: [number, number]
  energy: 1 | 2 | 3
  depth: 1 | 2 | 3
  accent: string
  howTo: HowTo
  rounds: { min: number; max: number; label: string; default: (n: number) => number }
  /** minutes per round, given player count */
  perRound: (n: number) => number
  /** fixed extra minutes (setup) */
  setup?: number
  /** quantas rodadas o conteúdo do pacote permite (0 = o pacote não tem conteúdo para este jogo) */
  maxRoundsFor?: (pack: ContentPack) => number

  init: (ctx: GameCtx, rounds: number) => S
  input: (s: S, msg: InputMsg, ctx: GameCtx) => S
  action: (s: S, action: string, data: any, ctx: GameCtx) => S
  tick: (s: S, ctx: GameCtx) => S
  done: (s: S) => boolean
  scores: (s: S) => Record<PlayerId, number>
  publicView: (s: S, ctx: GameCtx) => V
  privateView: (s: S, pid: PlayerId, ctx: GameCtx) => P
  controls: (s: S, ctx: GameCtx) => Control[]
  bot?: (s: S, pid: PlayerId, ctx: GameCtx) => { type: string; data?: any } | null

  HostView: ComponentType<ViewProps<V>>
  PlayerView: ComponentType<ViewProps<V, P>>
}

export type Phase =
  | 'lobby'
  | 'opening'
  | 'intro'
  | 'play'
  | 'results'
  | 'reveal'
  | 'map'
  | 'reward'
  | 'veil'
  | 'podium'
  | 'end'

export type RewardId = 'voz' | 'dobro' | 'escudo' | 'sorte' | 'lampada'

export interface GameResult {
  gameId: string
  ranking: { pid: PlayerId; xp: number; steps: number; first: boolean; tags: string[] }[]
  facts: string[]
}

export interface SessionState {
  v: 1
  pin: string
  packId: string
  createdAt: number
  judgeKey: string
  settings: Settings
  plan: PlanItem[]
  phase: Phase
  phaseAt: number
  gameIdx: number
  game: { id: string; state: any; participants: PlayerId[]; startedAt: number } | null
  players: Record<PlayerId, Player>
  kicked: PlayerId[]
  ack: PlayerId[]
  results: GameResult | null
  history: GameResult[]
  stepsBefore: Record<PlayerId, number>
  bread: PlayerId[]
  reward: { pid: PlayerId; options: RewardId[]; deadline: number; chosen?: RewardId; target?: PlayerId | string; targets?: string[] } | null
  effects: Record<PlayerId, Effects>
  forcedSpotlight?: PlayerId
  reactions: { id: string; pid: PlayerId; emoji: string; at: number }[]
  hands: PlayerId[]
  /** enquete do Momento Revelação: voto de cada um */
  poll: Record<PlayerId, number>
  /** qual pergunta do Momento Revelação está no telão (0 = principal) */
  revealQ: number
  revealExtra: number
  sessionStartedAt?: number
  trackLength: number
  station?: string
}

/** What players (and the telão) receive. */
export interface PublicState extends Omit<SessionState, 'judgeKey' | 'game'> {
  game: { id: string; view: any; participants: PlayerId[] } | null
  controls: Control[]
  serverNow: number
}
