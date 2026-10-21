import type { GameDef } from '../engine/types'
import { online, shuffle, speedPoints } from '../engine/helpers'
import { Btn, Sheet } from '../ui/kit'
import { Answered, BigQuestion, Explain, PhoneTimer, RoundBar, TimerBox, Waiting, pct, sec } from './common'

const T = sec(20)

interface S {
  items: number[]
  i: number
  stage: 'q' | 'reveal'
  start: number
  end: number
  answers: Record<string, { v: boolean; at: number }>
  xp: Record<string, number>
  streak: Record<string, number>
  gain: Record<string, number>
  over: boolean
}

function reveal(s: S, ctx: any) {
  const item = ctx.pack.trueFalse[s.items[s.i]]
  s.gain = {}
  for (const p of ctx.players) {
    const a = s.answers[p.id]
    if (a && a.v === item.isTrue) {
      const streak = s.streak[p.id] ?? 0
      const g = speedPoints(a.at - s.start, T) + Math.min(streak, 5) * 100
      s.gain[p.id] = g
      s.xp[p.id] = (s.xp[p.id] ?? 0) + g
      s.streak[p.id] = streak + 1
    } else {
      s.gain[p.id] = 0
      s.streak[p.id] = 0
    }
  }
  s.stage = 'reveal'
}

export const verdade: GameDef<S> = {
  id: 'verdade',
  name: 'Verdade ou Falsificação',
  icon: '⚖️',
  origin: 'Novo · inspirado em 1 Reis 22',
  tagline: 'Discirna: é verdade ou é falsificação?',
  kind: 'all',
  needsJudge: false,
  minPlayers: 1,
  idealRange: [3, 30],
  energy: 2,
  depth: 2,
  accent: 'var(--azul)',
  howTo: {
    steps: [
      { icon: '📺', text: 'Uma afirmação sobre a lição aparece no telão.' },
      { icon: '📱', text: 'No celular, toque em VERDADE ou FALSIFICAÇÃO.' },
      { icon: '📖', text: 'Depois de cada uma, aparece a explicação com o versículo.' },
    ],
    scoring: ['Acertou: até 1000 pontos (quanto mais rápido, mais pontos)', 'Acertos seguidos: +100 por sequência (até +500)', 'Errou: 0'],
    phone: 'Dois botões grandes: azul (Verdade) e vermelho (Falsificação).',
    tip: 'Tema de terça: nem tudo que é popular é verdadeiro.',
  },
  rounds: { min: 5, max: 14, label: 'afirmações', default: () => 8 },
  perRound: () => 0.5,
  maxRoundsFor: (pack) => pack.trueFalse.length,

  init(ctx, rounds) {
    const items = shuffle(ctx.pack.trueFalse.map((_, i) => i), ctx.rng).slice(0, rounds)
    return { items, i: 0, stage: 'q', start: ctx.now + 600, end: ctx.now + 600 + T, answers: {}, xp: {}, streak: {}, gain: {}, over: false }
  },
  input(s, msg) {
    if (msg.type !== 'answer' || s.stage !== 'q' || s.answers[msg.pid]) return s
    s.answers[msg.pid] = { v: !!msg.data?.v, at: Math.min(Math.max(msg.at, s.start), s.end) }
    return s
  },
  action(s, a, _d, ctx) {
    if (a !== 'next') return s
    if (s.stage === 'q') reveal(s, ctx)
    else if (s.i + 1 < s.items.length) {
      s.i++
      s.stage = 'q'
      s.answers = {}
      s.start = ctx.now
      s.end = ctx.now + T
    } else s.over = true
    return s
  },
  tick(s, ctx) {
    if (s.stage === 'q') {
      const on = online(ctx)
      if (ctx.now >= s.end || (on.length > 0 && on.every((p) => s.answers[p.id]))) reveal(s, ctx)
    }
    return s
  },
  done: (s) => s.over,
  scores: (s) => s.xp,
  publicView(s, ctx) {
    const item = ctx.pack.trueFalse[s.items[s.i]]
    const vals = Object.values(s.answers)
    return {
      i: s.i,
      total: s.items.length,
      stage: s.stage,
      text: item.text,
      start: s.start,
      end: s.end,
      answered: vals.length,
      n: ctx.players.length,
      reveal: s.stage === 'reveal' ? { isTrue: item.isTrue, explain: item.explain, ref: item.ref, t: vals.filter((v) => v.v).length, f: vals.filter((v) => !v.v).length } : null,
      last: s.i + 1 >= s.items.length,
    }
  },
  privateView(s, pid) {
    return { mine: s.answers[pid]?.v ?? null, gain: s.gain[pid] ?? 0, streak: s.streak[pid] ?? 0, total: s.xp[pid] ?? 0 }
  },
  controls(s) {
    if (s.stage === 'q') return [{ id: 'next', label: 'Revelar agora', key: ' ', tone: 'neutral' }]
    return [{ id: 'next', label: s.i + 1 >= s.items.length ? 'Ver resultado ▶' : 'Próxima ▶', key: ' ', tone: 'primary' }]
  },
  bot(s, pid, ctx) {
    if (s.stage !== 'q' || s.answers[pid] || ctx.now < s.start) return null
    const item = ctx.pack.trueFalse[s.items[s.i]]
    return { type: 'answer', data: { v: ctx.rng() < 0.72 ? item.isTrue : !item.isTrue } }
  },

  HostView({ view: v, now }) {
    const r = v.reveal
    const total = r ? r.t + r.f : 0
    return (
      <div className="flex h-full flex-col gap-[1.2em]">
        <RoundBar label={`Afirmação ${v.i + 1} de ${v.total}`} right={!r ? <TimerBox start={v.start} end={v.end} now={now} /> : null} />
        <BigQuestion>{v.text}</BigQuestion>
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-[1.2em]">
          {[true, false].map((val) => {
            const right = r && r.isTrue === val
            const count = r ? (val ? r.t : r.f) : 0
            return (
              <div
                key={String(val)}
                className="flex min-h-0 flex-col items-center justify-center rounded-[1.2em] p-[0.6em] text-center transition-all"
                style={{
                  background: val ? 'var(--azul)' : 'var(--carmesim)',
                  boxShadow: `0 0.35em 0 ${val ? 'var(--azul-s)' : 'var(--carmesim-s)'}`,
                  opacity: r && !right ? 0.35 : 1,
                  transform: right ? 'scale(1.03)' : undefined,
                  outline: right ? '0.25em solid #fff' : undefined,
                }}
              >
                <div className="text-[2.6em] leading-none">{val ? '✓' : '✗'}</div>
                <div className="font-display text-[2.2em] font-black">{val ? 'VERDADE' : 'FALSIFICAÇÃO'}</div>
                {r && <div className="mt-[0.2em] font-display text-[1.4em] font-extrabold opacity-90">{pct(count, total)}% da turma</div>}
              </div>
            )
          })}
        </div>
        {r ? <Explain refText={r.ref}>{r.explain}</Explain> : <Answered n={v.answered} total={v.n} />}
      </div>
    )
  },

  PlayerView({ view: v, priv, send, now, participant }) {
    if (!participant) return <Waiting title="Assistindo esta rodada" />
    if (v.stage === 'q') {
      if (priv?.mine != null) return <Waiting title="Resposta enviada! 🔒" mood="wow">Aguarde a revelação no telão.</Waiting>
      return (
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="font-display font-black text-[var(--muted)]">
              {v.i + 1}/{v.total}
            </span>
            <PhoneTimer end={v.end} now={now} />
          </div>
          <div className="card p-4 text-center font-display text-xl font-black">{v.text}</div>
          <Btn tone="blue" className="flex-1 !text-3xl" onClick={() => send('answer', { v: true })}>
            ✓ VERDADE
          </Btn>
          <Btn tone="bad" className="flex-1 !text-3xl" onClick={() => send('answer', { v: false })}>
            ✗ FALSIFICAÇÃO
          </Btn>
        </div>
      )
    }
    const ok = priv?.mine === v.reveal?.isTrue
    return (
      <div className="flex flex-1 flex-col justify-end gap-3 p-4">
        <Waiting title={ok ? 'Discernimento afiado!' : priv?.mine == null ? 'Não deu tempo!' : 'Quase!'} mood={ok ? 'wow' : 'sad'} />
        <Sheet tone={ok ? 'ok' : 'bad'} title={ok ? `+${priv.gain} 🔥${priv.streak > 1 ? ` ×${priv.streak}` : ''}` : `Era ${v.reveal.isTrue ? 'VERDADE' : 'FALSIFICAÇÃO'}`}>
          {v.reveal.explain} <b>({v.reveal.ref})</b>
        </Sheet>
      </div>
    )
  },
}
