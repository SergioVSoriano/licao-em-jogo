import type { GameDef, PlayerId } from '../engine/types'
import { addXp, draft, shuffle } from '../engine/helpers'
import { Avatar } from '../ui/avatars'
import { Btn, Sheet } from '../ui/kit'
import { Explain, MCPad, OptionsGrid, PhoneTimer, RoundBar, TimerBox, Waiting, sec } from './common'

const DRAW = sec(3.5)
const ANS = sec(15)

interface S {
  qs: number[]
  i: number
  rounds: number
  stage: 'draw' | 'q' | 'reveal'
  t0: number
  t1: number
  a: PlayerId | null
  b: PlayerId | null
  king: PlayerId | null
  streak: number
  duel: Record<PlayerId, number>
  winner: PlayerId | null
  aud: Record<PlayerId, number>
  bets: Record<PlayerId, PlayerId>
  xp: Record<PlayerId, number>
  note: Record<PlayerId, string>
  hide: Record<PlayerId, number[]>
  over: boolean
}

function newDuel(s: S, ctx: any) {
  s.duel = {}
  s.winner = null
  s.aud = {}
  s.bets = {}
  s.note = {}
  if (s.king && ctx.all[s.king]?.online) {
    s.a = s.king
    s.b = draft({ ...ctx, forcedSpotlight: ctx.forcedSpotlight === s.king ? undefined : ctx.forcedSpotlight }, [s.king])
  } else {
    s.king = null
    s.streak = 0
    s.a = draft(ctx)
    s.b = s.a ? draft({ ...ctx, forcedSpotlight: undefined }, [s.a]) : null
  }
  if (!s.a || !s.b) {
    s.over = true
    return
  }
  const qq = ctx.pack.questions[s.qs[s.i]]
  s.hide = {}
  for (const p of ctx.players) if (ctx.effects[p.id]?.lamp) s.hide[p.id] = shuffle([0, 1, 2, 3].filter((k) => k !== qq.answer), ctx.rng).slice(0, 2)
  s.stage = 'draw'
  s.t0 = ctx.now
  s.t1 = ctx.now + DRAW
}

function reveal(s: S, ctx: any) {
  const qq = ctx.pack.questions[s.qs[s.i]]
  if (s.winner) {
    if (s.winner === s.king) s.streak++
    else {
      s.king = s.winner
      s.streak = 1
    }
    const g = Math.round(300 * (1 + 0.5 * (s.streak - 1)))
    addXp(s.xp, s.winner, g)
    s.note[s.winner] = `+${g}`
  } else {
    s.king = null
    s.streak = 0
  }
  for (const p of ctx.players) {
    if (p.id === s.a || p.id === s.b) continue
    let g = 0
    if (s.aud[p.id] === qq.answer) g += 50
    if (s.winner && s.bets[p.id] === s.winner) g += 50
    if (g) addXp(s.xp, p.id, g)
    s.note[p.id] = `+${g}`
  }
  s.stage = 'reveal'
}

export const duelo: GameDef<S> = {
  id: 'duelo',
  name: 'Duelo no Carmelo',
  icon: '🔥',
  origin: 'Era "Duelo" · 1 Reis 18',
  tagline: 'Dois frente a frente. Quem acertar primeiro fica no monte.',
  kind: 'spotlight',
  needsJudge: false,
  minPlayers: 2,
  idealRange: [3, 30],
  truths: ['V1', 'V2', 'V3', 'V4', 'V6'],
  energy: 3,
  depth: 1,
  accent: 'var(--fogo)',
  howTo: {
    steps: [
      { icon: '⚔️', text: 'Duas pessoas são sorteadas para um duelo de uma pergunta.' },
      { icon: '⚡', text: 'Quem acertar PRIMEIRO vence. Errou? Fica travado.' },
      { icon: '⛰️', text: 'Rei do Monte: o vencedor fica e enfrenta um novo desafiante.' },
      { icon: '👥', text: 'A plateia aposta em quem vence e também responde.' },
    ],
    scoring: ['Vencedor: +300, e +50% a cada vitória seguida no monte', 'Plateia: acertou a pergunta +50 · acertou a aposta +50'],
    phone: 'Duelistas: 4 alternativas. Plateia: aposta (2 rostos) + alternativas.',
  },
  rounds: { min: 3, max: 10, label: 'duelos', default: (n) => Math.min(Math.ceil(n / 2), 6) },
  perRound: () => 0.6,
  maxRoundsFor: (pack) => pack.questions.length,

  init(ctx, rounds) {
    const s: S = { qs: shuffle(ctx.pack.questions.map((_, i) => i), ctx.rng), i: 0, rounds, stage: 'draw', t0: 0, t1: 0, a: null, b: null, king: null, streak: 0, duel: {}, winner: null, aud: {}, bets: {}, xp: {}, note: {}, hide: {}, over: false }
    newDuel(s, ctx)
    return s
  },
  input(s, msg, ctx) {
    const { pid, type, data } = msg
    const qq = ctx.pack.questions[s.qs[s.i]]
    if (s.stage === 'q' && (pid === s.a || pid === s.b) && type === 'answer' && s.duel[pid] === undefined) {
      const opt = Number(data?.opt)
      s.duel[pid] = opt
      if (opt === qq.answer) {
        s.winner = pid
        reveal(s, ctx)
      } else if (s.duel[s.a!] !== undefined && s.duel[s.b!] !== undefined) reveal(s, ctx)
      return s
    }
    if (pid === s.a || pid === s.b) return s
    if (type === 'bet' && s.stage !== 'reveal' && !s.bets[pid] && (data?.pid === s.a || data?.pid === s.b)) s.bets[pid] = data.pid
    if (type === 'aud' && s.stage === 'q' && s.aud[pid] === undefined) s.aud[pid] = Number(data?.opt)
    return s
  },
  action(s, a, _d, ctx) {
    if (a !== 'next') return s
    if (s.stage === 'draw') s.t1 = ctx.now
    else if (s.stage === 'q') reveal(s, ctx)
    else if (s.i + 1 < s.rounds) {
      s.i++
      newDuel(s, ctx)
    } else s.over = true
    return s
  },
  tick(s, ctx) {
    if (s.stage === 'draw' && ctx.now >= s.t1) {
      s.stage = 'q'
      s.t0 = ctx.now
      s.t1 = ctx.now + ANS
    } else if (s.stage === 'q' && ctx.now >= s.t1) reveal(s, ctx)
    return s
  },
  done: (s) => s.over,
  scores: (s) => s.xp,
  publicView(s, ctx) {
    const qq = ctx.pack.questions[s.qs[s.i]]
    const betA = Object.values(s.bets).filter((b) => b === s.a).length
    const betB = Object.values(s.bets).filter((b) => b === s.b).length
    return {
      i: s.i,
      total: s.rounds,
      stage: s.stage,
      t0: s.t0,
      t1: s.t1,
      a: s.a,
      b: s.b,
      king: s.king,
      streak: s.streak,
      q: s.stage === 'draw' ? null : qq.q,
      opts: s.stage === 'draw' ? null : qq.options,
      locked: Object.keys(s.duel),
      winner: s.winner,
      bets: [betA, betB],
      reveal: s.stage === 'reveal' ? { answer: qq.answer, explain: qq.explain, ref: qq.ref } : null,
    }
  },
  privateView(s, pid) {
    return { mine: s.duel[pid] ?? null, aud: s.aud[pid] ?? null, bet: s.bets[pid] ?? null, note: s.note[pid] ?? null, hide: s.hide[pid] ?? [] }
  },
  controls(s) {
    if (s.stage === 'reveal') return [{ id: 'next', label: s.i + 1 >= s.rounds ? 'Ver resultado ▶' : 'Próximo duelo ⚔️', key: ' ', tone: 'primary' }]
    if (s.stage === 'q') return [{ id: 'next', label: 'Encerrar duelo', tone: 'neutral' }]
    return []
  },
  bot(s, pid, ctx) {
    const qq = ctx.pack.questions[s.qs[s.i]]
    const guess = ctx.rng() < 0.6 ? qq.answer : Math.floor(ctx.rng() * 4)
    if (pid === s.a || pid === s.b) return s.stage === 'q' && s.duel[pid] === undefined && ctx.now - s.t0 > 1500 && ctx.rng() < 0.3 ? { type: 'answer', data: { opt: guess } } : null
    if (!s.bets[pid] && s.stage !== 'reveal') return { type: 'bet', data: { pid: ctx.rng() < 0.5 ? s.a : s.b } }
    if (s.stage === 'q' && s.aud[pid] === undefined) return { type: 'aud', data: { opt: guess } }
    return null
  },

  HostView({ view: v, players, now }) {
    const A = v.a ? players[v.a] : undefined
    const B = v.b ? players[v.b] : undefined
    const r = v.reveal
    const side = (p: typeof A, bets: number, isKing: boolean) =>
      p && (
        <div className={`flex flex-col items-center ${v.locked.includes(p.id) && v.winner !== p.id ? 'opacity-40' : ''}`}>
          {isKing && <div className="font-display text-[1.1em] font-black text-[var(--ouro)]">⛰️ Rei do Monte ×{v.streak}</div>}
          <div className={`relative ${v.winner === p.id ? 'anim-pop' : ''}`}>
            {v.winner === p.id && <div className="absolute inset-[-15%] rounded-full bg-[radial-gradient(circle,rgba(255,120,30,.75),transparent_65%)]" />}
            <Avatar id={p.avatar} color={p.color} size={v.stage === 'draw' ? '11em' : '5em'} mood={v.winner === p.id ? 'wow' : v.locked.includes(p.id) ? 'sad' : 'happy'} />
          </div>
          <div className="rounded-full bg-white px-[0.8em] font-display text-[1.4em] font-black text-[var(--noite)]">{p.name}</div>
          <div className="mt-[0.2em] text-[0.95em] opacity-80">👥 {bets} apostas</div>
          {v.locked.includes(p.id) && v.winner !== p.id && <div className="font-display font-black text-[var(--carmesim)]">❌ errou</div>}
          {v.winner === p.id && <div className="font-display text-[1.4em] font-black text-[var(--ouro)]">🔥 VENCEU!</div>}
        </div>
      )
    return (
      <div className="flex h-full flex-col gap-[1em]">
        <RoundBar label={`Duelo ${v.i + 1} de ${v.total}`} right={v.stage === 'q' ? <TimerBox start={v.t0} end={v.t1} now={now} /> : null} />
        <div className="flex items-center justify-center gap-[3em]">
          {side(A, v.bets[0], v.king === v.a && v.streak > 0)}
          <div className="font-display text-[3.5em] font-black text-[var(--fogo)]">VS</div>
          {side(B, v.bets[1], v.king === v.b && v.streak > 0)}
        </div>
        {v.stage === 'draw' ? (
          <div className="text-center font-display text-[1.6em] font-black opacity-90">Prepare-se… plateia, faça sua aposta! 👥</div>
        ) : (
          <>
            <div className="rounded-[1.2em] bg-white px-[1em] py-[0.7em] text-center font-display text-[2em] font-black leading-tight text-[var(--noite)]">{v.q}</div>
            <OptionsGrid options={v.opts} correct={r?.answer} reveal={!!r} />
            {r && <Explain refText={r.ref}>{r.explain}</Explain>}
          </>
        )}
      </div>
    )
  },

  PlayerView({ view: v, priv, send, me, now, players }) {
    const meId = me?.id
    const duelist = meId === v.a || meId === v.b
    if (v.stage === 'reveal') {
      const good = priv?.note && priv.note !== '+0'
      return (
        <div className="flex flex-1 flex-col justify-end gap-3 p-4">
          <Waiting title={v.winner === meId ? 'Você venceu o duelo! 🔥' : duelist ? 'Não foi dessa vez' : good ? 'Boa, plateia!' : 'Duelo encerrado'} me={me} mood={v.winner === meId ? 'wow' : 'happy'} />
          <Sheet tone={good ? 'ok' : 'info'} title={priv?.note ?? '+0'}>
            Resposta: <b>{v.opts?.[v.reveal.answer]}</b> ({v.reveal.ref})
          </Sheet>
        </div>
      )
    }
    if (duelist) {
      if (v.stage === 'draw') return <Waiting title="Você está no duelo! ⚔️" me={me} mood="wow">Olhe para o telão e prepare o dedo…</Waiting>
      if (priv?.mine != null) return <Waiting title="❌ Errou… travado" me={me} mood="sad">Torça pelo erro do adversário!</Waiting>
      return (
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="font-display font-black text-[var(--fogo)]">⚔️ Quem acertar primeiro vence!</span>
            <PhoneTimer end={v.t1} now={now} />
          </div>
          <div className="card p-3 text-center font-display text-lg font-black">{v.q}</div>
          <MCPad labels={v.opts} onPick={(i) => send('answer', { opt: i })} hide={priv?.hide} />
        </div>
      )
    }
    const A = players[v.a]
    const B = players[v.b]
    return (
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="text-center font-display font-black text-[var(--muted)]">👥 Plateia · aposte em quem vence (+50)</div>
        <div className="grid grid-cols-2 gap-2">
          {[A, B].map((p) =>
            p ? (
              <Btn key={p.id} ghost={priv?.bet !== p.id} tone="fire" disabled={!!priv?.bet} onClick={() => send('bet', { pid: p.id })} className="!flex-col !py-2">
                <Avatar id={p.avatar} color={p.color} size={56} showItem={false} />
                {p.name}
              </Btn>
            ) : null,
          )}
        </div>
        {v.stage === 'q' && (
          <>
            <div className="card p-3 text-center font-display font-black">{v.q}</div>
            {priv?.aud != null ? <Waiting title="Palpite registrado 🤫" /> : <MCPad labels={v.opts} onPick={(i) => send('aud', { opt: i })} hide={priv?.hide} />}
          </>
        )}
      </div>
    )
  },
}
