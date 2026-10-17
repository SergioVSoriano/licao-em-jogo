import type { GameDef } from '../engine/types'
import { online, shuffle } from '../engine/helpers'
import { AnswerTile, Sheet } from '../ui/kit'
import { Answered, PhoneTimer, RoundBar, Waiting, sec } from './common'

const STEP = sec(10)
const T = sec(36)
const PTS = [1000, 600, 300]

interface S {
  cards: number[]
  i: number
  stage: 'q' | 'reveal'
  start: number
  level: number
  opts: string[]
  answers: Record<string, { opt: number; level: number }>
  xp: Record<string, number>
  gain: Record<string, number>
  hide: Record<string, number[]>
  over: boolean
}

function setup(s: S, ctx: any) {
  const card = ctx.pack.threeSigns[s.cards[s.i]]
  s.opts = shuffle(card.options, ctx.rng)
  s.answers = {}
  s.level = 1
  s.start = ctx.now
  s.stage = 'q'
  s.hide = {}
  for (const p of ctx.players) {
    if (ctx.effects[p.id]?.lamp) {
      const wrong = s.opts.map((o, i) => ({ o, i })).filter((x) => x.o !== card.answer)
      s.hide[p.id] = shuffle(wrong, ctx.rng).slice(0, 4).map((x) => x.i)
    }
  }
}

function reveal(s: S, ctx: any) {
  const card = ctx.pack.threeSigns[s.cards[s.i]]
  const ok = s.opts.indexOf(card.answer)
  s.gain = {}
  for (const p of ctx.players) {
    const a = s.answers[p.id]
    let g = 0
    if (a) g = a.opt === ok ? PTS[a.level - 1] : -100
    s.gain[p.id] = g
    s.xp[p.id] = (s.xp[p.id] ?? 0) + g
  }
  s.stage = 'reveal'
}

export const sinais: GameDef<S> = {
  id: 'sinais',
  name: 'Três Sinais',
  icon: '🔦',
  origin: 'Era "Jogo das 3 palavras" (Silvio Santos)',
  tagline: 'Três dicas, do difícil ao fácil. Quanto antes acertar, mais vale.',
  kind: 'all',
  needsJudge: false,
  minPlayers: 1,
  idealRange: [3, 30],
  truths: ['V5', 'V6', 'V7', 'V3'],
  energy: 2,
  depth: 2,
  accent: 'var(--ouro)',
  howTo: {
    steps: [
      { icon: '1️⃣', text: 'A dica 1 (difícil) aparece no telão.' },
      { icon: '⏱️', text: 'A cada 10 segundos abre uma dica mais fácil.' },
      { icon: '🎯', text: 'Escolha a resposta no celular quando tiver certeza: só vale um palpite!' },
    ],
    scoring: ['Acertou na dica 1: 1000', 'Na dica 2: 600 · Na dica 3: 300', 'Errou: −100 (chutar custa!)'],
    phone: 'Uma grade com 8 opções. Toque na sua resposta.',
    tip: 'Na revelação aparece a ficha do personagem com o versículo.',
  },
  rounds: { min: 3, max: 10, label: 'cartas', default: () => 5 },
  perRound: () => 0.75,
  maxRoundsFor: (pack) => pack.threeSigns.length,

  init(ctx, rounds) {
    const s: S = { cards: shuffle(ctx.pack.threeSigns.map((_, i) => i), ctx.rng).slice(0, rounds), i: 0, stage: 'q', start: 0, level: 1, opts: [], answers: {}, xp: {}, gain: {}, hide: {}, over: false }
    setup(s, ctx)
    return s
  },
  input(s, msg) {
    if (msg.type !== 'answer' || s.stage !== 'q' || s.answers[msg.pid]) return s
    const opt = Number(msg.data?.opt)
    if (!(opt >= 0 && opt < s.opts.length) || s.hide[msg.pid]?.includes(opt)) return s
    s.answers[msg.pid] = { opt, level: s.level }
    return s
  },
  action(s, a, _d, ctx) {
    if (a === 'clue' && s.stage === 'q' && s.level < 3) {
      s.level++
      s.start = ctx.now - (s.level - 1) * STEP
      return s
    }
    if (a !== 'next') return s
    if (s.stage === 'q') reveal(s, ctx)
    else if (s.i + 1 < s.cards.length) {
      s.i++
      setup(s, ctx)
    } else s.over = true
    return s
  },
  tick(s, ctx) {
    if (s.stage !== 'q') return s
    const lvl = Math.min(3, 1 + Math.floor((ctx.now - s.start) / STEP))
    if (lvl > s.level) s.level = lvl
    const on = online(ctx)
    if (ctx.now >= s.start + T || (on.length > 0 && on.every((p) => s.answers[p.id]))) reveal(s, ctx)
    return s
  },
  done: (s) => s.over,
  scores: (s) => s.xp,
  publicView(s, ctx) {
    const card = ctx.pack.threeSigns[s.cards[s.i]]
    const ch = ctx.pack.characters.find((c) => c.name === card.answer)
    const counts = s.opts.map((_, i) => Object.values(s.answers).filter((a) => a.opt === i).length)
    return {
      i: s.i,
      total: s.cards.length,
      stage: s.stage,
      level: s.level,
      clues: card.clues.slice(0, s.stage === 'reveal' ? 3 : s.level),
      opts: s.opts,
      start: s.start,
      answered: Object.keys(s.answers).length,
      n: ctx.players.length,
      reveal: s.stage === 'reveal' ? { answer: card.answer, ref: card.ref, ok: s.opts.indexOf(card.answer), counts, bio: ch?.bio, byLevel: [1, 2, 3].map((l) => Object.values(s.answers).filter((a) => a.level === l && s.opts[a.opt] === card.answer).length) } : null,
    }
  },
  privateView(s, pid) {
    return { mine: s.answers[pid] ?? null, gain: s.gain[pid] ?? 0, hide: s.hide[pid] ?? [] }
  },
  controls(s) {
    if (s.stage === 'q') return [...(s.level < 3 ? [{ id: 'clue', label: 'Próxima dica', key: 'd', tone: 'neutral' as const }] : []), { id: 'next', label: 'Revelar', key: ' ', tone: 'neutral' }]
    return [{ id: 'next', label: s.i + 1 >= s.cards.length ? 'Ver resultado ▶' : 'Próxima carta ▶', key: ' ', tone: 'primary' }]
  },
  bot(s, pid, ctx) {
    if (s.stage !== 'q' || s.answers[pid]) return null
    if (ctx.rng() > 0.2 + s.level * 0.25) return null
    const card = ctx.pack.threeSigns[s.cards[s.i]]
    const right = s.opts.indexOf(card.answer)
    const opt = ctx.rng() < 0.4 + s.level * 0.18 ? right : Math.floor(ctx.rng() * s.opts.length)
    return { type: 'answer', data: { opt } }
  },

  HostView({ view: v, now }) {
    const r = v.reveal
    const nextAt = v.start + v.level * STEP
    return (
      <div className="flex h-full flex-col gap-[1em]">
        <RoundBar label={`Carta ${v.i + 1} de ${v.total}`} right={!r ? <Answered n={v.answered} total={v.n} /> : null} />
        <div className="grid grid-cols-3 gap-[0.8em]">
          {[0, 1, 2].map((k) => {
            const open = k < v.clues.length
            const pts = PTS[k]
            return (
              <div
                key={k}
                className={`relative flex min-h-[7em] flex-col justify-center rounded-[1em] p-[0.9em] text-center ${open ? 'anim-pop bg-white text-[var(--noite)]' : 'bg-white/10'}`}
                style={{ boxShadow: open ? '0 0.25em 0 rgba(0,0,0,.25)' : undefined }}
              >
                <div className="absolute left-[0.6em] top-[0.4em] font-display text-[0.9em] font-black opacity-60">
                  DICA {k + 1} · {pts}
                </div>
                {open ? (
                  <div className="mt-[0.6em] font-display text-[1.45em] font-extrabold leading-tight">{v.clues[k]}</div>
                ) : (
                  <div className="font-display text-[1.2em] opacity-70">🔒 {k === v.level && !r ? `abre em ${Math.max(0, Math.ceil((nextAt - now) / 1000))}s` : ''}</div>
                )}
              </div>
            )
          })}
        </div>
        <div className="grid flex-1 grid-cols-4 content-center gap-[0.7em] text-[1.2em]">
          {v.opts.map((o: string, i: number) => (
            <AnswerTile key={o} i={i} text={o} state={r ? (i === r.ok ? 'correct' : 'dim') : undefined} count={r ? r.counts[i] : undefined} />
          ))}
        </div>
        {r && (
          <div className="anim-pop flex items-center gap-[1em] rounded-[1em] bg-white/95 p-[0.8em] text-[var(--noite)]">
            <div className="font-display text-[2em] font-black text-[var(--purpura)]">{r.answer}</div>
            <div className="flex-1 text-[1.1em]">
              {r.bio ?? ''} <b className="text-[var(--purpura)]">{r.ref}</b>
            </div>
            <div className="text-right text-[0.95em] font-semibold">
              🧠 {r.byLevel[0]} na 1ª · {r.byLevel[1]} na 2ª · {r.byLevel[2]} na 3ª
            </div>
          </div>
        )}
      </div>
    )
  },

  PlayerView({ view: v, priv, send, now, participant }) {
    if (!participant) return <Waiting title="Assistindo esta rodada" />
    if (v.stage === 'q') {
      if (priv?.mine) return <Waiting title={`Palpite na dica ${priv.mine.level} 🔒`} mood="wow">Vale até {PTS[priv.mine.level - 1]} pontos se estiver certo!</Waiting>
      return (
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="font-display font-black">
              Dica {v.level} · vale {PTS[v.level - 1]}
            </span>
            <PhoneTimer end={v.start + T} now={now} />
          </div>
          <div className="card p-3 text-center font-display font-extrabold">{v.clues[v.clues.length - 1]}</div>
          <div className="grid flex-1 grid-cols-2 gap-2">
            {v.opts.map((o: string, i: number) => (
              <AnswerTile key={o} i={i} text={o} onClick={() => send('answer', { opt: i })} disabled={priv?.hide?.includes(i)} state={priv?.hide?.includes(i) ? 'dim' : undefined} style={{ fontSize: '0.95rem' }} />
            ))}
          </div>
          {priv?.hide?.length > 0 && <div className="text-center text-sm">🕯️ Lâmpada: 4 opções erradas apagadas</div>}
        </div>
      )
    }
    const ok = priv?.mine && v.opts[priv.mine.opt] === v.reveal.answer
    return (
      <div className="flex flex-1 flex-col justify-end gap-3 p-4">
        <Waiting title={ok ? 'Na mosca! 🎯' : priv?.mine ? 'Não foi dessa vez' : 'Sem palpite'} mood={ok ? 'wow' : 'sad'} />
        <Sheet tone={ok ? 'ok' : 'bad'} title={`${priv.gain >= 0 ? '+' : ''}${priv.gain}`}>
          Resposta: <b>{v.reveal.answer}</b> ({v.reveal.ref})
        </Sheet>
      </div>
    )
  },
}
