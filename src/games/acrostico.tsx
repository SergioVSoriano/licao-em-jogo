import type { GameDef, PlayerId } from '../engine/types'
import { addXp, eligible, shuffle } from '../engine/helpers'
import { Avatar } from '../ui/avatars'
import { Btn } from '../ui/kit'
import { PhoneTimer, RoundBar, TimerBox, Waiting, sec } from './common'

const LETTERS = 'ABCDEFGHIJLMNOPRSTUV'.split('')
const TURN = sec(10)
const JUDGE = sec(6)

interface S {
  rounds: number
  r: number
  theme: number
  stage: 'turn' | 'judge' | 'roundEnd'
  order: PlayerId[]
  alive: PlayerId[]
  cur: PlayerId | null
  used: string[]
  letter: string | null
  t0: number
  t1: number
  votes: Record<PlayerId, boolean>
  xp: Record<PlayerId, number>
  log: { pid: PlayerId; letter: string | null; ok: boolean }[]
  survivors: PlayerId[]
  over: boolean
}

function newRound(s: S, ctx: any) {
  let order = shuffle(eligible(ctx).map((p) => p.id), ctx.rng)
  if (ctx.forcedSpotlight && order.includes(ctx.forcedSpotlight)) order = [ctx.forcedSpotlight, ...order.filter((x) => x !== ctx.forcedSpotlight)]
  if (!order.length) {
    s.over = true
    return
  }
  s.theme = (s.theme + 1) % ctx.pack.acrosticThemes.length
  s.order = order
  s.alive = order.slice()
  s.used = []
  s.log = []
  s.survivors = []
  startTurn(s, order[0], ctx)
}

function startTurn(s: S, pid: PlayerId, ctx: any) {
  s.cur = pid
  s.letter = null
  s.votes = {}
  s.stage = 'turn'
  s.t0 = ctx.now
  s.t1 = ctx.now + TURN
}

function advance(s: S, ctx: any) {
  const multi = s.order.length > 1
  if ((multi && s.alive.length <= 1) || s.alive.length === 0 || s.used.length >= LETTERS.length) {
    s.survivors = s.alive.slice()
    for (const p of s.survivors) addXp(s.xp, p, 300)
    s.stage = 'roundEnd'
    s.cur = null
    return
  }
  const idx = s.order.indexOf(s.cur!)
  for (let k = 1; k <= s.order.length; k++) {
    const cand = s.order[(idx + k) % s.order.length]
    if (s.alive.includes(cand) && (ctx.all[cand]?.online || cand === s.cur)) return startTurn(s, cand, ctx)
  }
  s.survivors = s.alive.slice()
  s.stage = 'roundEnd'
}

function resolve(s: S, ok: boolean, ctx: any) {
  const pid = s.cur!
  if (ok && s.letter) {
    s.used.push(s.letter)
    addXp(s.xp, pid, 100)
    const yes = Object.values(s.votes).filter(Boolean).length
    const no = Object.values(s.votes).length - yes
    const majority = yes >= no
    for (const [v, val] of Object.entries(s.votes)) if (val === majority) addXp(s.xp, v, 20)
  } else {
    s.alive = s.alive.filter((p) => p !== pid)
  }
  s.log.push({ pid, letter: s.letter, ok })
  advance(s, ctx)
}

export const acrostico: GameDef<S> = {
  id: 'acrostico',
  name: 'Acróstico 119',
  icon: '🔤',
  origin: 'Era "Tapple/Stop" · Salmo 119 é um acróstico',
  tagline: 'Uma letra, uma palavra, 10 segundos. Letra usada fica travada!',
  kind: 'spotlight',
  needsJudge: true,
  minPlayers: 2,
  idealRange: [4, 20],
  energy: 3,
  depth: 1,
  accent: 'var(--ouro)',
  howTo: {
    steps: [
      { icon: '🎯', text: 'Um tema aparece no telão (ex.: "personagens da história de Elias").' },
      { icon: '🗣️', text: 'Na sua vez: FALE uma palavra do tema em voz alta e toque na letra inicial dela.' },
      { icon: '🔒', text: 'A letra fica travada até o fim da rodada. Você tem 10 segundos!' },
      { icon: '👍', text: 'A turma vota se vale (o facilitador pode decidir). Quem falhar sai da rodada.' },
    ],
    scoring: ['Palavra válida: +100', 'Último sobrevivente (ou quem resistir até acabarem as letras): +300', 'Votou com a maioria: +20'],
    phone: 'Na sua vez: teclado de letras. Na vez dos outros: 👍 Vale / 👎 Não vale.',
    tip: 'Palavras discutíveis viram mini-debate: "Zimbro vale como objeto?"',
  },
  rounds: { min: 1, max: 3, label: 'rodadas', default: (n) => (n >= 10 ? 1 : 2) },
  maxRoundsFor: (pack) => pack.acrosticThemes.length,
  perRound: (n) => 0.2 * Math.min(20, n + 5),

  init(ctx, rounds) {
    const s: S = { rounds, r: 0, theme: -1, stage: 'turn', order: [], alive: [], cur: null, used: [], letter: null, t0: 0, t1: 0, votes: {}, xp: {}, log: [], survivors: [], over: false }
    newRound(s, ctx)
    return s
  },
  input(s, msg, ctx) {
    if (msg.type === 'letter' && s.stage === 'turn' && msg.pid === s.cur) {
      const l = String(msg.data?.l ?? '').toUpperCase()
      if (!LETTERS.includes(l) || s.used.includes(l)) return s
      s.letter = l
      s.stage = 'judge'
      s.t0 = ctx.now
      s.t1 = ctx.now + JUDGE
      return s
    }
    if (msg.type === 'vote' && s.stage === 'judge' && msg.pid !== s.cur && s.votes[msg.pid] === undefined) s.votes[msg.pid] = !!msg.data?.ok
    return s
  },
  action(s, a, _d, ctx) {
    if (a === 'ok' && s.stage === 'judge') resolve(s, true, ctx)
    else if (a === 'fail' && (s.stage === 'judge' || s.stage === 'turn')) resolve(s, false, ctx)
    else if (a === 'next' && s.stage === 'roundEnd') {
      if (s.r + 1 < s.rounds) {
        s.r++
        newRound(s, ctx)
      } else s.over = true
    }
    return s
  },
  tick(s, ctx) {
    if (s.stage === 'turn' && ctx.now >= s.t1) resolve(s, false, ctx)
    else if (s.stage === 'judge' && ctx.now >= s.t1) {
      const yes = Object.values(s.votes).filter(Boolean).length
      const no = Object.values(s.votes).length - yes
      resolve(s, yes >= no, ctx)
    }
    return s
  },
  done: (s) => s.over,
  scores: (s) => s.xp,
  publicView(s, ctx) {
    const yes = Object.values(s.votes).filter(Boolean).length
    return {
      r: s.r,
      rounds: s.rounds,
      theme: ctx.pack.acrosticThemes[Math.max(0, s.theme)],
      stage: s.stage,
      cur: s.cur,
      used: s.used,
      letter: s.letter,
      t0: s.t0,
      t1: s.t1,
      alive: s.alive,
      order: s.order,
      votes: [yes, Object.values(s.votes).length - yes],
      log: s.log.slice(-6),
      survivors: s.survivors,
    }
  },
  privateView(s, pid) {
    return { vote: s.votes[pid] ?? null }
  },
  controls(s) {
    if (s.stage === 'judge')
      return [
        { id: 'ok', label: '✓ Vale', key: '1', tone: 'ok' },
        { id: 'fail', label: '✗ Não vale', key: '2', tone: 'bad' },
      ]
    if (s.stage === 'turn') return [{ id: 'fail', label: '✗ Não conseguiu', key: '2', tone: 'bad' }]
    return [{ id: 'next', label: s.r + 1 >= s.rounds ? 'Ver resultado ▶' : 'Próxima rodada ▶', key: ' ', tone: 'primary' }]
  },
  bot(s, pid, ctx) {
    if (s.stage === 'turn' && pid === s.cur && ctx.now - s.t0 > 2500) {
      if (ctx.rng() < 0.12) return null
      const free = LETTERS.filter((l) => !s.used.includes(l))
      return { type: 'letter', data: { l: free[Math.floor(ctx.rng() * free.length)] } }
    }
    if (s.stage === 'judge' && pid !== s.cur && s.votes[pid] === undefined) return { type: 'vote', data: { ok: ctx.rng() < 0.85 } }
    return null
  },

  HostView({ view: v, players, now }) {
    const cur = v.cur ? players[v.cur] : undefined
    return (
      <div className="flex h-full flex-col gap-[0.8em]">
        <RoundBar label={`Rodada ${v.r + 1} de ${v.rounds} · ${v.alive.length} na disputa`} right={v.stage !== 'roundEnd' ? <TimerBox start={v.t0} end={v.t1} now={now} /> : null} />
        <div className="text-center font-display text-[2.1em] font-black leading-tight">🎯 {v.theme}</div>
        <div className="flex flex-1 items-center justify-center gap-[3em]">
          <div className="relative aspect-square h-full max-h-[24em]">
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V'].map((l, i) => {
              const ang = (i / 20) * Math.PI * 2 - Math.PI / 2
              const used = v.used.includes(l)
              const pending = v.letter === l && v.stage === 'judge'
              return (
                <div
                  key={l}
                  className={`absolute grid h-[14%] w-[14%] place-items-center rounded-full font-display text-[1.6em] font-black transition-all ${pending ? 'anim-pulse' : ''}`}
                  style={{
                    left: `${50 + 42 * Math.cos(ang) - 7}%`,
                    top: `${50 + 42 * Math.sin(ang) - 7}%`,
                    background: pending ? 'var(--ouro)' : used ? 'rgba(255,255,255,.12)' : '#fff',
                    color: pending ? '#2a1d00' : used ? 'rgba(255,255,255,.35)' : 'var(--noite)',
                    boxShadow: used ? 'none' : '0 0.15em 0 rgba(0,0,0,.3)',
                    textDecoration: used ? 'line-through' : 'none',
                  }}
                >
                  {l}
                </div>
              )
            })}
            <div className="absolute inset-[22%] grid place-items-center">
              {cur && v.stage !== 'roundEnd' ? (
                <div className="flex flex-col items-center">
                  <Avatar id={cur.avatar} color={cur.color} size="6.5em" mood={v.stage === 'judge' ? 'wow' : 'happy'} />
                  <div className="rounded-full bg-[var(--ouro)] px-[0.7em] font-display text-[1.2em] font-black text-[#2a1d00]">{cur.name}</div>
                </div>
              ) : (
                <div className="text-center font-display text-[1.3em] font-black">🏁 Fim da rodada!</div>
              )}
            </div>
          </div>
          <div className="flex w-[18em] flex-col gap-[0.5em]">
            {v.stage === 'judge' && (
              <div className="anim-pop rounded-[1em] bg-white p-[0.8em] text-center text-[var(--noite)]">
                <div className="font-display text-[1.1em] font-black">Letra {v.letter}: vale?</div>
                <div className="mt-[0.3em] font-display text-[1.6em] font-black">
                  👍 {v.votes[0]} · 👎 {v.votes[1]}
                </div>
                <div className="text-[0.85em] opacity-70">Facilitador decide com 1 ou 2</div>
              </div>
            )}
            {v.stage === 'roundEnd' && (
              <div className="anim-pop rounded-[1em] bg-[var(--ouro)] p-[0.8em] text-center font-display font-black text-[#2a1d00]">
                🏆 Resistiram: {v.survivors.map((p: string) => players[p]?.name).join(', ') || 'ninguém'} (+300)
              </div>
            )}
            {v.log
              .slice()
              .reverse()
              .map((l: any, i: number) => (
                <div key={i} className="flex items-center gap-[0.5em] rounded-full bg-white/10 px-[0.7em] py-[0.15em]">
                  <span>{l.ok ? '✅' : '❌'}</span>
                  <span className="font-display font-black">{l.letter ?? '—'}</span>
                  <span className="truncate opacity-85">{players[l.pid]?.name}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    )
  },

  PlayerView({ view: v, priv, send, me, now, players }) {
    const meId = me?.id
    const cur = v.cur ? players[v.cur] : undefined
    if (v.stage === 'roundEnd') return <Waiting title={v.survivors.includes(meId) ? 'Você resistiu! +300 🏆' : 'Fim da rodada!'} me={me} mood="wow" />
    if (v.cur === meId && v.stage === 'turn')
      return (
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-black text-[var(--fogo)]">SUA VEZ! 🗣️</span>
            <PhoneTimer end={v.t1} now={now} />
          </div>
          <div className="card p-3 text-center font-display font-black">{v.theme}</div>
          <div className="text-center text-sm font-semibold text-[var(--muted)]">Fale a palavra em voz alta e toque na letra inicial</div>
          <div className="grid flex-1 grid-cols-4 gap-2">
            {LETTERS.map((l) => (
              <Btn key={l} tone="blue" disabled={v.used.includes(l)} onClick={() => send('letter', { l })} className="!p-0 !text-2xl">
                {l}
              </Btn>
            ))}
          </div>
        </div>
      )
    if (v.cur === meId) return <Waiting title={`Letra ${v.letter}: a turma está votando…`} me={me} mood="wow" />
    if (v.stage === 'judge')
      return (
        <div className="flex flex-1 flex-col gap-3 p-4">
          <Waiting title={`${cur?.name} falou uma palavra com ${v.letter}`} me={cur}>
            Vale para o tema "{v.theme}"?
          </Waiting>
          {priv?.vote == null ? (
            <div className="grid grid-cols-2 gap-3">
              <Btn tone="ok" className="!py-6 !text-2xl" onClick={() => send('vote', { ok: true })}>
                👍 Vale
              </Btn>
              <Btn tone="bad" className="!py-6 !text-2xl" onClick={() => send('vote', { ok: false })}>
                👎 Não
              </Btn>
            </div>
          ) : (
            <div className="text-center font-display font-black">Voto registrado {priv.vote ? '👍' : '👎'}</div>
          )}
        </div>
      )
    const out = !v.alive.includes(meId) && v.order.includes(meId)
    return (
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Waiting title={out ? 'Você saiu desta rodada' : `Vez de ${cur?.name ?? '…'}`} me={out ? me : cur} mood={out ? 'sad' : 'happy'}>
          {out ? 'Mas ainda dá pontos: quando alguém falar, vote 👍/👎 (+20 se votar com a maioria).' : v.order.includes(meId) ? 'Prepare uma palavra… as letras estão acabando!' : 'Você está como plateia: vote quando alguém falar.'}
        </Waiting>
        <div className="card p-3 text-center">
          <div className="text-xs font-bold text-[var(--muted)]">TEMA</div>
          <div className="font-display font-black">{v.theme}</div>
          <div className="mt-2 flex flex-wrap justify-center gap-1">
            {LETTERS.map((l) => (
              <span key={l} className="grid h-7 w-7 place-items-center rounded-full font-display text-sm font-black" style={{ background: v.used.includes(l) ? 'var(--line)' : 'var(--azul)', color: v.used.includes(l) ? 'var(--muted)' : '#fff', textDecoration: v.used.includes(l) ? 'line-through' : undefined }}>
                {l}
              </span>
            ))}
          </div>
          <div className="mt-2 text-xs text-[var(--muted)]">Pense numa palavra para cada letra livre: ajuda a fixar a lição!</div>
        </div>
      </div>
    )
  },
}
