import { getPack } from '../content'
import { GAME_BY_ID } from '../games'
import { estimateGame, estimatePlan } from './planner'
import { pick, shuffle, uid } from './helpers'
import type {
  Control,
  GameCtx,
  GameResult,
  InputMsg,
  Player,
  PlayerId,
  PlanItem,
  PublicState,
  RewardId,
  SessionState,
  Settings,
} from './types'
import { AVATARS } from '../ui/avatars'

export type SessionAction =
  | { type: 'tick' }
  | { type: 'input'; msg: InputMsg }
  | { type: 'presence'; pid: PlayerId; online: boolean }
  | { type: 'control'; id: string; data?: any }
  | { type: 'addBots'; n: number }
  | { type: 'kick'; pid: PlayerId }

export function createSession(pin: string, packId: string, settings: Settings, plan: PlanItem[], now: number): SessionState {
  return {
    v: 1,
    pin,
    packId,
    createdAt: now,
    judgeKey: uid(10),
    settings,
    plan,
    phase: 'lobby',
    phaseAt: now,
    gameIdx: 0,
    game: null,
    players: {},
    kicked: [],
    ack: [],
    results: null,
    history: [],
    stepsBefore: {},
    bread: [],
    reward: null,
    effects: {},
    reactions: [],
    hands: [],
    poll: {},
    revealQ: 0,
    revealExtra: 0,
    trackLength: 3 * plan.length + 2,
  }
}

export const REWARDS: Record<RewardId, { name: string; emoji: string; text: string; ref: string }> = {
  voz: { name: 'Voz de Comando', emoji: '🗳️', text: 'Escolha o próximo jogo', ref: '' },
  dobro: { name: 'Porção Dobrada', emoji: '🔥', text: 'Seus passos dobram no próximo jogo', ref: '2Rs 2:9' },
  escudo: { name: 'Escudo da Fé', emoji: '🛡️', text: 'Você não perde pontos no próximo jogo', ref: 'Ef 6:16' },
  sorte: { name: 'Lançar a Sorte', emoji: '🎲', text: 'Escolha quem será sorteado primeiro no próximo jogo', ref: 'Pv 16:33' },
  lampada: { name: 'Lâmpada', emoji: '🕯️', text: 'Uma ajuda extra no próximo jogo (alternativas apagadas ou a letra inicial)', ref: 'Sl 119:105' },
}

const BOT_NAMES = ['Tito', 'Lia', 'Davi', 'Bia', 'Caleb', 'Mel', 'Noemi', 'Gabi', 'Rafa', 'Duda', 'Enzo', 'Sofia', 'Léo', 'Clara', 'Theo', 'Ana', 'Benja', 'Isa', 'Joca', 'Malu']

export function participants(s: SessionState): Player[] {
  if (!s.game) return []
  return s.game.participants.map((id) => s.players[id]).filter(Boolean)
}

export function makeCtx(s: SessionState, now: number): GameCtx {
  return {
    pack: getPack(s.packId),
    players: s.game ? participants(s) : activePlayers(s),
    all: s.players,
    now,
    rng: Math.random,
    effects: s.effects,
    forcedSpotlight: s.forcedSpotlight,
  }
}

export function activePlayers(s: SessionState): Player[] {
  return Object.values(s.players).filter((p) => !s.kicked.includes(p.id))
}

function setPhase(s: SessionState, phase: SessionState['phase'], now: number) {
  s.phase = phase
  s.phaseAt = now
  s.hands = []
  s.ack = []
  s.poll = {}
  s.revealQ = 0
}

function startIntro(s: SessionState, idx: number, now: number) {
  s.gameIdx = idx
  s.game = null
  s.results = null
  s.revealExtra = 0
  setPhase(s, 'intro', now)
}

function startGame(s: SessionState, now: number) {
  const item = s.plan[s.gameIdx]
  const def = GAME_BY_ID[item.gameId]
  const parts = activePlayers(s).filter((p) => p.online).map((p) => p.id)
  s.game = { id: def.id, state: null, participants: parts, startedAt: now }
  const ctx = makeCtx(s, now)
  s.game.state = def.init(ctx, item.rounds)
  setPhase(s, 'play', now)
}

function finishGame(s: SessionState, now: number) {
  if (!s.game) return
  const def = GAME_BY_ID[s.game.id]
  const raw = def.scores(s.game.state)
  const parts = s.game.participants.filter((id) => s.players[id])
  const xp: Record<PlayerId, number> = {}
  for (const id of parts) {
    let v = Math.round(raw[id] ?? 0)
    if (v < 0 && s.effects[id]?.shield) v = 0
    xp[id] = v
  }
  const nonNeg = parts.map((id) => xp[id]).filter((v) => v >= 0)
  const max = parts.length ? Math.max(...parts.map((id) => xp[id])) : 0
  const min = nonNeg.length ? Math.min(...nonNeg) : 0
  const allMin = parts.length ? Math.min(...parts.map((id) => xp[id])) : 0

  s.stepsBefore = Object.fromEntries(Object.values(s.players).map((p) => [p.id, p.steps]))
  const ranking: GameResult['ranking'] = []
  for (const id of parts) {
    const p = s.players[id]
    const v = xp[id]
    const tags: string[] = []
    let steps: number
    let norm = 0.5
    if (max <= 0 && allMin < max) {
      // todos ficaram negativos (ex.: Lançar Sortes com poucas pessoas): compara entre eles
      norm = (v - allMin) / (max - allMin)
      steps = 1 + Math.round(3 * norm)
    } else if (v < 0) {
      steps = 0
      norm = 0
    } else if (max === min) steps = 2
    else {
      norm = (v - min) / (max - min)
      steps = 1 + Math.round(3 * norm)
    }
    const first = v === max && max > 0
    if (first) {
      steps += 1
      p.firsts += 1
      tags.push('🥇 1º lugar')
    }
    if (s.effects[id]?.double) {
      steps = Math.min(steps * 2, steps + 4)
      tags.push('🔥 Porção dobrada')
    }
    if (s.effects[id]?.shield && (raw[id] ?? 0) < 0) tags.push('🛡️ Escudo salvou')
    p.steps += steps
    p.normSum += norm
    p.xpTotal += v
    ranking.push({ pid: id, xp: v, steps, first, tags })
  }
  ranking.sort((a, b) => b.xp - a.xp)

  // Pão e Água — quem ficou por último ganha +1 passo (1Rs 19:5-7)
  s.bread = []
  const pool = activePlayers(s).filter((p) => p.online && p.breadAt !== s.gameIdx - 1)
  if (pool.length >= 2) {
    const minSteps = Math.min(...pool.map((p) => p.steps))
    const lowest = shuffle(pool.filter((p) => p.steps === minSteps))
    const count = pool.length >= 20 ? Math.max(1, Math.floor(pool.length * 0.1)) : 1
    for (const p of lowest.slice(0, count)) {
      p.steps += 1
      p.breadAt = s.gameIdx
      s.bread.push(p.id)
      const r = ranking.find((x) => x.pid === p.id)
      if (r) r.tags.push('🍞 Pão e Água +1')
    }
  }

  const result: GameResult = { gameId: def.id, ranking, facts: [] }
  s.results = result
  s.history.push(result)
  s.effects = {}
  s.forcedSpotlight = undefined
  s.game = null
  setPhase(s, 'results', now)
}

function elapsedMinutes(s: SessionState, now: number) {
  return s.sessionStartedAt ? (now - s.sessionStartedAt) / 60000 : 0
}

export function nPlayers(s: SessionState) {
  return Math.max(2, activePlayers(s).filter((p) => p.online).length)
}

export function vozOptions(s: SessionState, now: number): string[] {
  const n = nPlayers(s)
  const next = s.plan[s.gameIdx + 1]
  if (!next) return []
  const after = s.plan.slice(s.gameIdx + 2)
  const afterMin = estimatePlan(after, GAME_BY_ID, n, s.settings.depth).total - 4
  const budget = s.settings.minutes - elapsedMinutes(s, now) - 2.5 - afterMin
  const played = new Set(s.history.map((h) => h.gameId))
  const options = Object.values(GAME_BY_ID)
    .filter((g) => n >= g.minPlayers && !played.has(g.id) && !after.some((a) => a.gameId === g.id))
    .filter((g) => g.id === next.gameId || estimateGame(g, n, g.rounds.default(n), s.settings.depth) <= Math.max(budget, estimateGame(GAME_BY_ID[next.gameId], n, next.rounds, s.settings.depth)) + 0.5)
    .map((g) => g.id)
  const others = shuffle(options.filter((id) => id !== next.gameId)).slice(0, 3)
  return [next.gameId, ...others]
}

function afterMap(s: SessionState, now: number) {
  const hasNext = s.gameIdx + 1 < s.plan.length
  if (!hasNext) {
    setPhase(s, 'veil', now)
    return
  }
  const last = s.history[s.history.length - 1]
  const winners = last ? last.ranking.filter((r) => r.first && s.players[r.pid]?.online) : []
  if (s.settings.rewards && winners.length) {
    const w = pick(winners).pid
    let pool: RewardId[] = ['dobro', 'escudo', 'sorte', 'lampada', 'voz']
    if (vozOptions(s, now).length < 2) pool = pool.filter((r) => r !== 'voz')
    const nextDef = GAME_BY_ID[s.plan[s.gameIdx + 1].gameId]
    if (nextDef.kind !== 'spotlight') pool = pool.filter((r) => r !== 'sorte')
    if (!['sortes', 'duelo', 'sinais', 'disfarcados'].includes(nextDef.id)) pool = pool.filter((r) => r !== 'lampada')
    const options = shuffle(pool).slice(0, 2)
    s.reward = { pid: w, options, deadline: now + 15000 }
    setPhase(s, 'reward', now)
    return
  }
  startIntro(s, s.gameIdx + 1, now)
}

function applyReward(s: SessionState, now: number) {
  const r = s.reward
  if (r?.chosen) {
    if (r.chosen === 'dobro') s.effects[r.pid] = { ...s.effects[r.pid], double: true }
    if (r.chosen === 'escudo') s.effects[r.pid] = { ...s.effects[r.pid], shield: true }
    if (r.chosen === 'lampada') s.effects[r.pid] = { ...s.effects[r.pid], lamp: true }
    if (r.chosen === 'sorte' && typeof r.target === 'string') s.forcedSpotlight = r.target
    if (r.chosen === 'voz' && typeof r.target === 'string' && GAME_BY_ID[r.target]) {
      const n = nPlayers(s)
      s.plan[s.gameIdx + 1] = { gameId: r.target, rounds: GAME_BY_ID[r.target].rounds.default(n) }
    }
  }
  startIntro(s, s.gameIdx + 1, now)
  s.reward = r ? { ...r } : null
}

function rewardNeedsTarget(id: RewardId) {
  return id === 'voz' || id === 'sorte'
}

function autoReward(s: SessionState, now: number) {
  const r = s.reward
  if (!r) return
  if (!r.chosen) r.chosen = pick(r.options)
  if (rewardNeedsTarget(r.chosen) && !r.target) {
    if (r.chosen === 'voz') r.target = s.plan[s.gameIdx + 1]?.gameId
    if (r.chosen === 'sorte') {
      const cands = activePlayers(s).filter((p) => p.online && !p.noSpotlight && p.id !== r.pid)
      r.target = cands.length ? pick(cands).id : undefined
    }
  }
  applyReward(s, now)
}

function handleInput(s: SessionState, msg: InputMsg, now: number) {
  const { pid, type, data } = msg
  if (type === 'host') {
    if (data?.key === s.judgeKey) reduce(s, { type: 'control', id: data.id, data: data.data }, now)
    return
  }
  if (s.kicked.includes(pid)) return
  if (type === 'join') {
    const name = String(data?.name ?? '').slice(0, 16).trim() || 'Jogador'
    const existing = s.players[pid]
    if (existing) {
      existing.name = name
      existing.avatar = data?.avatar ?? existing.avatar
      existing.color = data?.color ?? existing.color
      existing.noSpotlight = !!data?.noSpotlight
      existing.online = true
      return
    }
    const others = activePlayers(s)
    const startSteps = s.phase === 'lobby' || !others.length ? 0 : Math.min(...others.map((p) => p.steps))
    s.players[pid] = {
      id: pid,
      name,
      avatar: data?.avatar ?? AVATARS[0].id,
      color: data?.color ?? 0,
      noSpotlight: !!data?.noSpotlight,
      online: true,
      joinedAt: now,
      steps: startSteps,
      firsts: 0,
      normSum: 0,
      xpTotal: 0,
    }
    return
  }
  const me = s.players[pid]
  if (!me) return
  me.online = true
  if (type === 'profile') {
    if (typeof data?.noSpotlight === 'boolean') me.noSpotlight = data.noSpotlight
    return
  }
  if (type === 'react') {
    const lastMine = s.reactions.filter((r) => r.pid === pid).pop()
    if (lastMine && now - lastMine.at < 1200) return
    const emoji = String(data?.emoji ?? '🙌').slice(0, 4)
    s.reactions.push({ id: uid(6), pid, emoji, at: now })
    return
  }
  if (type === 'ack') {
    if (!s.ack.includes(pid)) s.ack.push(pid)
    return
  }
  if (type === 'poll' && s.phase === 'reveal') {
    const opt = Number(data?.opt)
    if (opt >= 0 && opt < 8) (s.poll ??= {})[pid] = opt
    return
  }
  if (type === 'hand') {
    if (s.hands.includes(pid)) s.hands = s.hands.filter((h) => h !== pid)
    else s.hands.push(pid)
    return
  }
  if (type === 'reward' && s.phase === 'reward' && s.reward && s.reward.pid === pid) {
    const r = s.reward
    if (!r.chosen && r.options.includes(data?.id)) {
      r.chosen = data.id
      r.deadline = now + 15000
      if (!rewardNeedsTarget(r.chosen!)) applyReward(s, now)
      else if (r.chosen === 'voz') r.targets = vozOptions(s, now)
      else r.targets = activePlayers(s).filter((p) => p.online && !p.noSpotlight && p.id !== r.pid).map((p) => p.id)
      return
    }
    if (r.chosen && rewardNeedsTarget(r.chosen) && data?.target && (!r.targets || r.targets.includes(data.target))) {
      r.target = data.target
      applyReward(s, now)
    }
    return
  }
  if (s.phase === 'play' && s.game && s.game.participants.includes(pid)) {
    const def = GAME_BY_ID[s.game.id]
    def.input(s.game.state, msg, makeCtx(s, now))
    if (def.done(s.game.state)) finishGame(s, now)
  }
}

function botStep(s: SessionState, now: number) {
  const bots = activePlayers(s).filter((p) => p.bot && p.online)
  if (!bots.length) return
  for (const b of bots) {
    if (s.phase === 'intro' && !s.ack.includes(b.id) && Math.random() < 0.1) s.ack.push(b.id)
    if (s.phase === 'reveal' && Math.random() < 0.004 && !s.hands.includes(b.id)) s.hands.push(b.id)
    if (s.phase === 'reveal' && (s.poll ??= {})[b.id] === undefined && Math.random() < 0.08) {
      const rev = currentRevelation(s)
      if (rev) s.poll[b.id] = Math.floor(Math.random() * rev.poll.options.length)
    }
    if (s.phase === 'reward' && s.reward?.pid === b.id && now - s.phaseAt > 2500) {
      autoReward(s, now)
      return
    }
    if (s.phase === 'play' && s.game && s.game.participants.includes(b.id) && Math.random() < 0.12) {
      const def = GAME_BY_ID[s.game.id]
      const ctx = makeCtx(s, now)
      const inp = def.bot?.(s.game.state, b.id, ctx)
      if (inp) {
        def.input(s.game.state, { pid: b.id, type: inp.type, data: inp.data, at: now }, ctx)
        if (def.done(s.game.state)) {
          finishGame(s, now)
          return
        }
      }
    }
    if (Math.random() < 0.003) s.reactions.push({ id: uid(6), pid: b.id, emoji: pick(['🙌', '😂', '🔥', '😮', '🙏']), at: now })
  }
}

export function reduce(s: SessionState, a: SessionAction, now: number): SessionState {
  switch (a.type) {
    case 'tick': {
      s.reactions = s.reactions.filter((r) => now - r.at < 6000)
      if (s.phase === 'play' && s.game) {
        const def = GAME_BY_ID[s.game.id]
        def.tick(s.game.state, makeCtx(s, now))
        if (def.done(s.game.state)) finishGame(s, now)
      }
      if (s.phase === 'reward' && s.reward && now > s.reward.deadline) autoReward(s, now)
      botStep(s, now)
      return s
    }
    case 'presence': {
      const p = s.players[a.pid]
      if (p && !p.bot) p.online = a.online
      return s
    }
    case 'input':
      handleInput(s, a.msg, now)
      return s
    case 'addBots': {
      const used = new Set(Object.values(s.players).map((p) => p.name.toLowerCase()))
      const names = shuffle(BOT_NAMES).filter((n) => !used.has(n.toLowerCase()))
      for (let i = 0; i < a.n; i++) {
        const id = 'bot-' + uid(6)
        const others = activePlayers(s)
        s.players[id] = {
          id,
          name: names[i] ?? `Robô ${Object.keys(s.players).length + 1}`,
          avatar: pick(AVATARS).id,
          color: Math.floor(Math.random() * 6),
          noSpotlight: false,
          bot: true,
          online: true,
          joinedAt: now,
          steps: s.phase === 'lobby' || !others.length ? 0 : Math.min(...others.map((p) => p.steps)),
          firsts: 0,
          normSum: 0,
          xpTotal: 0,
        }
      }
      return s
    }
    case 'kick': {
      if (!s.kicked.includes(a.pid)) s.kicked.push(a.pid)
      if (s.players[a.pid]) s.players[a.pid].online = false
      return s
    }
    case 'control':
      control(s, a.id, a.data, now)
      return s
  }
}

function control(s: SessionState, id: string, data: any, now: number) {
  if (id.startsWith('g:')) {
    if (s.phase === 'play' && s.game) {
      const def = GAME_BY_ID[s.game.id]
      def.action(s.game.state, id.slice(2), data, makeCtx(s, now))
      if (def.done(s.game.state)) finishGame(s, now)
    }
    return
  }
  switch (id) {
    case 'start':
      if (s.phase !== 'lobby') return
      s.sessionStartedAt = now
      s.trackLength = 3 * s.plan.length + 2
      setPhase(s, 'opening', now)
      return
    case 'next':
      switch (s.phase) {
        case 'opening':
          return startIntro(s, 0, now)
        case 'intro': {
          const def = GAME_BY_ID[s.plan[s.gameIdx].gameId]
          const n = activePlayers(s).filter((p) => p.online).length
          if (n < def.minPlayers) return skipGame(s, now)
          return startGame(s, now)
        }
        case 'results':
          return setPhase(s, 'reveal', now)
        case 'reveal':
          return setPhase(s, 'map', now)
        case 'map':
          return afterMap(s, now)
        case 'reward':
          return autoReward(s, now)
        case 'veil':
          return setPhase(s, 'podium', now)
        case 'podium':
          return setPhase(s, 'end', now)
      }
      return
    case 'endGame':
      if (s.phase === 'play') finishGame(s, now)
      return
    case 'skipGame':
      return skipGame(s, now)
    case 'extend':
      s.revealExtra += 30
      return
    case 'nextQ': {
      const rev = currentRevelation(s)
      if (rev) s.revealQ = ((s.revealQ ?? 0) + 1) % (1 + rev.followUps.length)
      return
    }
  }
}

function skipGame(s: SessionState, now: number) {
  s.game = null
  if (s.gameIdx + 1 < s.plan.length) startIntro(s, s.gameIdx + 1, now)
  else setPhase(s, 'veil', now)
}

export function sessionControls(s: SessionState, now: number): Control[] {
  switch (s.phase) {
    case 'lobby':
      return [{ id: 'start', label: '▶ Começar', key: ' ', tone: 'primary' }]
    case 'opening':
      return [{ id: 'next', label: 'Primeiro jogo ▶', key: ' ', tone: 'primary' }]
    case 'intro': {
      const def = GAME_BY_ID[s.plan[s.gameIdx].gameId]
      const n = activePlayers(s).filter((p) => p.online).length
      if (n < def.minPlayers) return [{ id: 'next', label: `Pular (precisa de ${def.minPlayers}+) ⏭`, key: ' ', tone: 'neutral' }]
      return [
        { id: 'next', label: '▶ Jogar', key: ' ', tone: 'primary' },
        { id: 'skipGame', label: 'Pular jogo', tone: 'neutral' },
      ]
    }
    case 'play': {
      if (!s.game) return []
      const def = GAME_BY_ID[s.game.id]
      const gc = def.controls(s.game.state, makeCtx(s, now)).map((c) => ({ ...c, id: 'g:' + c.id }))
      return [...gc, { id: 'endGame', label: 'Encerrar jogo', tone: 'neutral' }]
    }
    case 'results':
      return [{ id: 'next', label: 'Momento Revelação ▶', key: ' ', tone: 'primary' }]
    case 'reveal':
      return [
        { id: 'next', label: 'Ver o mapa ▶', key: ' ', tone: 'primary' },
        { id: 'nextQ', label: '🔄 Outra pergunta', key: 'q', tone: 'neutral' },
        { id: 'extend', label: '+30s', key: '+', tone: 'neutral' },
      ]
    case 'map':
      return [{ id: 'next', label: s.gameIdx + 1 < s.plan.length ? 'Continuar ▶' : 'O Véu ▶', key: ' ', tone: 'primary' }]
    case 'reward':
      return [{ id: 'next', label: 'Escolher por ele ⏭', key: ' ', tone: 'neutral' }]
    case 'veil':
      return [{ id: 'next', label: 'Abrir o véu ✨', key: ' ', tone: 'gold' }]
    case 'podium':
      return [{ id: 'next', label: 'Rolo da Lição 📜', key: ' ', tone: 'primary' }]
    default:
      return []
  }
}

export function toPublic(s: SessionState, now: number): PublicState {
  const { judgeKey: _k, game, ...rest } = s
  let pubGame: PublicState['game'] = null
  if (game) {
    const def = GAME_BY_ID[game.id]
    pubGame = { id: game.id, view: def.publicView(game.state, makeCtx(s, now)), participants: game.participants }
  }
  return { ...rest, game: pubGame, controls: sessionControls(s, now) } as PublicState
}

export function privateFor(s: SessionState, pid: PlayerId, now: number): any {
  if (s.phase === 'play' && s.game && s.game.participants.includes(pid)) {
    const def = GAME_BY_ID[s.game.id]
    return { game: def.privateView(s.game.state, pid, makeCtx(s, now)) }
  }
  return {}
}

/** Final ranking: passos → 1º lugares → XP normalizado. */
export function finalRanking(players: Player[]): Player[] {
  return players.slice().sort((a, b) => b.steps - a.steps || b.firsts - a.firsts || b.normSum - a.normSum)
}

/** O Momento Revelação do jogo que acabou de terminar. */
export function currentRevelation(s: { packId: string; results: GameResult | null }) {
  const pack = getPack(s.packId)
  return pack.revelations.find((r) => r.game === s.results?.gameId) ?? pack.revelations[0]
}
