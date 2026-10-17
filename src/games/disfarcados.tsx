import type { GameDef, PlayerId } from '../engine/types'
import { addXp, draft, online, shuffle } from '../engine/helpers'
import { Btn, Sheet } from '../ui/kit'
import { Answered, PhoneTimer, RoundBar, Spotlight, TimerBox, Waiting, sec } from './common'

const CLUE = sec(15)
const PTS = [1000, 700, 400, 200]

interface S {
  rounds: number
  r: number
  stage: 'brief' | 'clues' | 'reveal'
  informant: PlayerId | null
  secret: string
  grid: string[]
  used: string[]
  level: number
  levelAt: number
  shown: string[]
  answers: Record<PlayerId, { c: string; level: number }>
  xp: Record<PlayerId, number>
  gain: Record<PlayerId, number>
  over: boolean
}

function newRound(s: S, ctx: any) {
  const pool = s.grid.filter((c) => !s.used.includes(c) && ctx.pack.disguiseClues[c])
  s.secret = shuffle(pool.length ? pool : s.grid, ctx.rng)[0]
  s.used.push(s.secret)
  s.informant = draft(ctx, [], [])
  s.level = 1
  s.shown = []
  s.answers = {}
  s.gain = {}
  s.stage = 'brief'
  s.levelAt = ctx.now
  if (!s.informant) startClues(s, ctx)
}

function startClues(s: S, ctx: any) {
  s.stage = 'clues'
  s.level = 1
  s.levelAt = ctx.now
  if (!s.informant) s.shown = [ctx.pack.disguiseClues[s.secret][0]]
}

function bump(s: S, ctx: any) {
  if (s.level >= 4) return reveal(s, ctx)
  s.level++
  s.levelAt = ctx.now
  if (!s.informant) s.shown.push(ctx.pack.disguiseClues[s.secret][s.level - 1] ?? '')
}

function reveal(s: S, ctx: any) {
  const guessers = ctx.players.filter((p: any) => p.id !== s.informant)
  let right = 0
  s.gain = {}
  for (const p of guessers) {
    const a = s.answers[p.id]
    const g = a && a.c === s.secret ? PTS[a.level - 1] : 0
    if (g) right++
    s.gain[p.id] = g
    addXp(s.xp, p.id, g)
  }
  if (s.informant) {
    const g = Math.round(600 * (guessers.length ? right / guessers.length : 0))
    s.gain[s.informant] = g
    addXp(s.xp, s.informant, g)
  }
  s.stage = 'reveal'
}

export const disfarcados: GameDef<S> = {
  id: 'disfarcados',
  name: 'Disfarçados',
  icon: '🎭',
  origin: 'Era "Insuspeitos" · Acabe foi disfarçado (1Rs 22:30)',
  tagline: 'Quem é o personagem disfarçado? Descubra pelas pistas.',
  kind: 'all',
  needsJudge: false,
  minPlayers: 2,
  idealRange: [3, 30],
  energy: 2,
  depth: 2,
  accent: 'var(--fogo)',
  howTo: {
    steps: [
      { icon: '🕵️', text: 'Um INFORMANTE sorteado recebe um personagem secreto no celular.' },
      { icon: '💬', text: 'Ele dá pistas criativas em voz alta ("Hoje seria preso…") ou mostra pistas prontas no telão.' },
      { icon: '🖼️', text: 'Todos veem 12 personagens no telão e votam no celular (um palpite só).' },
    ],
    scoring: ['Acertou na pista 1: 1000 · pista 2: 700 · pista 3: 400 · pista 4: 200', 'Informante: até 600, conforme quantos acertaram'],
    phone: 'Informante: personagem secreto + pistas prontas. Demais: grade de personagens.',
    tip: 'Tímido? O informante pode só tocar nas pistas prontas, sem precisar falar.',
  },
  rounds: { min: 2, max: 6, label: 'personagens', default: () => 4 },
  // a grade mostra até 12 personagens; cada rodada usa um que tenha pistas
  maxRoundsFor: (pack) => {
    const grid = pack.characters.filter((c) => c.inDisguise).slice(0, 12)
    return grid.length >= 4 ? grid.filter((c) => pack.disguiseClues[c.id]?.length).length : 0
  },
  perRound: () => 1,

  init(ctx, rounds) {
    const grid = ctx.pack.characters.filter((c) => c.inDisguise).map((c) => c.id).slice(0, 12)
    const s: S = { rounds, r: 0, stage: 'brief', informant: null, secret: grid[0], grid, used: [], level: 1, levelAt: 0, shown: [], answers: {}, xp: {}, gain: {}, over: false }
    newRound(s, ctx)
    return s
  },
  input(s, msg, ctx) {
    const { pid, type, data } = msg
    if (pid === s.informant) {
      if (type === 'ready' && s.stage === 'brief') startClues(s, ctx)
      if (type === 'show' && s.stage === 'clues') {
        const c = ctx.pack.disguiseClues[s.secret]?.[Number(data?.i)]
        if (c && !s.shown.includes(c)) {
          s.shown.push(c)
          if (s.shown.length > 1) bump(s, ctx)
        }
      }
      if (type === 'said' && s.stage === 'clues') bump(s, ctx)
      return s
    }
    if (type === 'guess' && s.stage === 'clues' && !s.answers[pid] && s.grid.includes(data?.c)) s.answers[pid] = { c: data.c, level: s.level }
    return s
  },
  action(s, a, _d, ctx) {
    if (a !== 'next' && a !== 'clue') return s
    if (s.stage === 'brief') startClues(s, ctx)
    else if (s.stage === 'clues') {
      if (a === 'clue') bump(s, ctx)
      else reveal(s, ctx)
    } else if (s.r + 1 < s.rounds) {
      s.r++
      newRound(s, ctx)
    } else s.over = true
    return s
  },
  tick(s, ctx) {
    if (s.stage !== 'clues') return s
    if (ctx.now >= s.levelAt + CLUE) bump(s, ctx)
    const guessers = online(ctx).filter((p) => p.id !== s.informant)
    if (s.stage === 'clues' && guessers.length && guessers.every((p) => s.answers[p.id])) reveal(s, ctx)
    return s
  },
  done: (s) => s.over,
  scores: (s) => s.xp,
  publicView(s, ctx) {
    const ch = ctx.pack.characters.find((c) => c.id === s.secret)
    const counts = Object.fromEntries(s.grid.map((g) => [g, Object.values(s.answers).filter((a) => a.c === g).length]))
    return {
      r: s.r,
      rounds: s.rounds,
      stage: s.stage,
      informant: s.informant,
      grid: s.grid.map((id) => {
        const c = ctx.pack.characters.find((x) => x.id === id)!
        return { id, name: c.name, emoji: c.emoji }
      }),
      level: s.level,
      levelAt: s.levelAt,
      shown: s.shown,
      answered: Object.keys(s.answers).length,
      n: ctx.players.length - (s.informant ? 1 : 0),
      reveal: s.stage === 'reveal' && ch ? { id: ch.id, name: ch.name, emoji: ch.emoji, bio: ch.bio, refs: ch.refs, counts } : null,
    }
  },
  privateView(s, pid, ctx) {
    if (pid === s.informant) {
      const ch = ctx.pack.characters.find((c) => c.id === s.secret)
      return { secret: ch ? { name: ch.name, emoji: ch.emoji, bio: ch.bio } : null, bank: ctx.pack.disguiseClues[s.secret] ?? [], gain: s.gain[pid] ?? 0 }
    }
    return { mine: s.answers[pid] ?? null, gain: s.gain[pid] ?? 0 }
  },
  controls(s) {
    if (s.stage === 'brief') return [{ id: 'next', label: '▶ Começar pistas', key: ' ', tone: 'primary' }]
    if (s.stage === 'clues')
      return [
        { id: 'clue', label: 'Próxima pista', key: 'd', tone: 'neutral' },
        { id: 'next', label: 'Revelar', key: ' ', tone: 'neutral' },
      ]
    return [{ id: 'next', label: s.r + 1 >= s.rounds ? 'Ver resultado ▶' : 'Próximo disfarce 🎭', key: ' ', tone: 'primary' }]
  },
  bot(s, pid, ctx) {
    if (pid === s.informant) {
      if (s.stage === 'brief' && ctx.rng() < 0.25) return { type: 'ready' }
      if (s.stage === 'clues' && s.shown.length < s.level && ctx.rng() < 0.3) return { type: 'show', data: { i: s.level - 1 } }
      return null
    }
    if (s.stage !== 'clues' || s.answers[pid] || ctx.rng() > 0.15 + s.level * 0.15) return null
    const c = ctx.rng() < 0.3 + s.level * 0.15 ? s.secret : s.grid[Math.floor(ctx.rng() * s.grid.length)]
    return { type: 'guess', data: { c } }
  },

  HostView({ view: v, players, now }) {
    const inf = v.informant ? players[v.informant] : undefined
    const r = v.reveal
    return (
      <div className="flex h-full flex-col gap-[0.8em]">
        <RoundBar label={`Disfarce ${v.r + 1} de ${v.rounds}${v.stage === 'clues' ? ` · pista ${v.level} vale ${PTS[v.level - 1]}` : ''}`} right={v.stage === 'clues' ? <TimerBox start={v.levelAt} end={v.levelAt + CLUE} now={now} /> : null} />
        <div className="flex flex-1 gap-[1.4em]">
          <div className="flex w-[15em] shrink-0 flex-col items-center justify-center gap-[0.8em]">
            {inf ? <Spotlight p={inf} size="7em" label="🕵️ informante" /> : <div className="font-display text-[1.3em] font-black">🕵️ Pistas automáticas</div>}
            {v.stage === 'brief' && <div className="text-center text-[1.1em]">{inf?.name} está vendo quem é o personagem secreto…</div>}
            {v.stage === 'clues' && (
              <>
                <div className="flex flex-col gap-[0.4em] self-stretch">
                  {v.shown.map((c: string, i: number) => (
                    <div key={i} className="anim-pop rounded-[0.8em] bg-white px-[0.7em] py-[0.4em] font-display font-extrabold text-[var(--noite)]">
                      💬 {c}
                    </div>
                  ))}
                  {inf && v.shown.length < v.level && <div className="text-center italic opacity-80">ouça a pista {v.level}…</div>}
                </div>
                <Answered n={v.answered} total={v.n} />
              </>
            )}
          </div>
          <div className="grid flex-1 grid-cols-4 grid-rows-3 gap-[0.6em]">
            {v.grid.map((c: any) => {
              const hit = r && r.id === c.id
              return (
                <div
                  key={c.id}
                  className="flex flex-col items-center justify-center rounded-[1em] p-[0.4em] text-center transition-all"
                  style={{ background: hit ? 'var(--ouro)' : 'rgba(255,255,255,.1)', color: hit ? '#2a1d00' : '#fff', opacity: r && !hit ? 0.35 : 1, transform: hit ? 'scale(1.08)' : undefined }}
                >
                  <div className="text-[2.4em] leading-none">{c.emoji}</div>
                  <div className="font-display text-[1.15em] font-black">{c.name}</div>
                  {r && <div className="text-[0.85em] font-bold">{r.counts[c.id]} votos</div>}
                </div>
              )
            })}
          </div>
        </div>
        {r && (
          <div className="anim-pop rounded-[1em] bg-white/95 p-[0.8em] text-[1.15em] text-[var(--noite)]">
            🎭 Era <b className="text-[var(--purpura)]">{r.name}</b>: {r.bio} <b className="text-[var(--purpura)]">({r.refs})</b>
          </div>
        )}
      </div>
    )
  },

  PlayerView({ view: v, priv, send, me, now }) {
    const meId = me?.id
    if (meId === v.informant) {
      if (v.stage === 'reveal') return <Waiting title={`Informante: +${priv?.gain ?? 0}`} me={me} mood="wow" />
      return (
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="rounded-3xl bg-[var(--noite)] p-4 text-center text-white">
            <div className="text-xs font-bold tracking-widest uppercase opacity-70">🤫 Personagem secreto</div>
            <div className="font-display text-3xl font-black">
              {priv?.secret?.emoji} {priv?.secret?.name}
            </div>
            <div className="mt-1 text-sm opacity-85">{priv?.secret?.bio}</div>
          </div>
          {v.stage === 'brief' ? (
            <Btn className="!text-xl" onClick={() => send('ready')}>
              Pronto, vamos às pistas ▶
            </Btn>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="font-display font-black">
                  Pista {v.level} de 4
                </span>
                <PhoneTimer end={v.levelAt + CLUE} now={now} />
              </div>
              <div className="text-sm text-[var(--muted)]">Fale uma pista criativa e toque "Já falei", ou toque numa pista pronta para mostrar no telão:</div>
              {(priv?.bank ?? []).map((c: string, i: number) => (
                <Btn key={i} ghost disabled={v.shown.includes(c)} onClick={() => send('show', { i })} className="!justify-start !text-left !text-base">
                  💬 {c}
                </Btn>
              ))}
              <Btn tone="blue" className="mt-auto" onClick={() => send('said')}>
                🗣️ Já falei, próxima pista
              </Btn>
            </>
          )}
        </div>
      )
    }
    if (v.stage === 'brief') return <Waiting title="O informante está se preparando 🕵️" me={me} />
    if (v.stage === 'clues') {
      if (priv?.mine) return <Waiting title="Palpite registrado 🔒" me={me} mood="wow">Vale até {PTS[priv.mine.level - 1]} se estiver certo.</Waiting>
      return (
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="font-display font-black">Quem é? · vale {PTS[v.level - 1]}</span>
            <PhoneTimer end={v.levelAt + CLUE} now={now} />
          </div>
          {v.shown.length > 0 && <div className="card p-2 text-center text-sm font-semibold">💬 {v.shown[v.shown.length - 1]}</div>}
          <div className="grid flex-1 grid-cols-3 gap-2">
            {v.grid.map((c: any) => (
              <Btn key={c.id} ghost onClick={() => send('guess', { c: c.id })} className="!flex-col !gap-0 !px-1 !py-2 !text-sm">
                <span className="text-2xl">{c.emoji}</span>
                {c.name}
              </Btn>
            ))}
          </div>
        </div>
      )
    }
    const ok = priv?.mine?.c === v.reveal?.id
    return (
      <div className="flex flex-1 flex-col justify-end gap-3 p-4">
        <Waiting title={ok ? 'Desmascarado! 🎭' : 'Não foi dessa vez'} me={me} mood={ok ? 'wow' : 'sad'} />
        <Sheet tone={ok ? 'ok' : 'bad'} title={`+${priv?.gain ?? 0}`}>
          Era <b>{v.reveal?.name}</b> ({v.reveal?.refs})
        </Sheet>
      </div>
    )
  },
}
