import { Reorder } from 'motion/react'
import { useEffect, useState } from 'react'
import type { GameCtx, GameDef } from '../engine/types'
import { lis, online, shuffle } from '../engine/helpers'
import { Btn, Sheet } from '../ui/kit'
import { Answered, PhoneTimer, RoundBar, TimerBox, Waiting, sec } from './common'

/** 30 s de leitura + 15 s por cartão (6 cartões = 2 min), no mínimo 90 s. */
const timeFor = (cards: number) => Math.max(sec(90), sec(30 + 15 * cards))

interface S {
  tls: number[]
  i: number
  stage: 'order' | 'reveal'
  start: number
  end: number
  shuffled: number[]
  subs: Record<string, { order: number[]; at: number }>
  xp: Record<string, number>
  gain: Record<string, number>
  perfect: number
  over: boolean
}

function scoreRound(s: S, ctx: any) {
  const n = s.shuffled.length
  s.gain = {}
  s.perfect = 0
  for (const p of ctx.players) {
    const sub = s.subs[p.id]
    if (!sub) {
      s.gain[p.id] = 0
      continue
    }
    const l = lis(sub.order)
    const frac = l / n
    if (l === n) s.perfect++
    const speed = Math.max(0, 1 - (sub.at - s.start) / (s.end - s.start))
    const g = Math.round(800 * frac + 200 * speed * frac)
    s.gain[p.id] = g
    s.xp[p.id] = (s.xp[p.id] ?? 0) + g
  }
  s.stage = 'reveal'
}

function newRound(s: S, ctx: GameCtx) {
  const tl = ctx.pack.timelines[s.tls[s.i]]
  let sh = shuffle(tl.events.map((_, i) => i), ctx.rng)
  if (sh.every((x, i) => x === i)) sh = sh.reverse()
  s.shuffled = sh
  s.subs = {}
  s.stage = 'order'
  s.start = ctx.now
  s.end = ctx.now + timeFor(sh.length)
}

export const linha: GameDef<S> = {
  id: 'linha',
  name: 'Linha do Tempo',
  icon: '🧭',
  origin: 'Novo · a história em ordem',
  tagline: 'Coloque os acontecimentos na ordem certa.',
  kind: 'all',
  needsJudge: false,
  minPlayers: 1,
  idealRange: [3, 30],
  energy: 1,
  depth: 3,
  accent: 'var(--bronze)',
  howTo: {
    steps: [
      { icon: '🃏', text: 'Os acontecimentos chegam embaralhados no seu celular.' },
      { icon: '☝️', text: 'Arraste os cartões (ou use as setas) para colocá-los em ordem.' },
      { icon: '✅', text: 'Toque em Enviar. No telão, a jornada é revelada passo a passo.' },
    ],
    scoring: ['Até 800 pontos pela ordem: um erro não zera tudo', 'Até +200 pela rapidez'],
    phone: 'Uma lista de cartões para arrastar, com setas ↑ ↓ e o botão Enviar.',
    tip: 'Este jogo ensina o CONTEXTO da história: ótimo para começar.',
  },
  rounds: { min: 1, max: 4, label: 'sequências', default: () => 2 },
  perRound: () => 2.25,
  maxRoundsFor: (pack) => pack.timelines.length,

  init(ctx, rounds) {
    const s: S = { tls: ctx.pack.timelines.map((_, i) => i).slice(0, rounds), i: 0, stage: 'order', start: 0, end: 0, shuffled: [], subs: {}, xp: {}, gain: {}, perfect: 0, over: false }
    newRound(s, ctx)
    return s
  },
  input(s, msg) {
    if (msg.type !== 'order' || s.stage !== 'order' || s.subs[msg.pid]) return s
    const order = (msg.data?.order ?? []).map(Number)
    if (order.length !== s.shuffled.length || new Set(order).size !== order.length) return s
    s.subs[msg.pid] = { order, at: Math.min(Math.max(msg.at, s.start), s.end) }
    return s
  },
  action(s, a, _d, ctx) {
    if (a !== 'next') return s
    if (s.stage === 'order') scoreRound(s, ctx)
    else if (s.i + 1 < s.tls.length) {
      s.i++
      newRound(s, ctx)
    } else s.over = true
    return s
  },
  tick(s, ctx) {
    if (s.stage === 'order') {
      const on = online(ctx)
      if (ctx.now >= s.end || (on.length > 0 && on.every((p) => s.subs[p.id]))) scoreRound(s, ctx)
    }
    return s
  },
  done: (s) => s.over,
  scores: (s) => s.xp,
  publicView(s, ctx) {
    const tl = ctx.pack.timelines[s.tls[s.i]]
    return {
      i: s.i,
      total: s.tls.length,
      stage: s.stage,
      title: tl.title,
      ref: tl.ref,
      start: s.start,
      end: s.end,
      cards: s.shuffled.map((k) => ({ k, text: tl.events[k] })),
      correct: s.stage === 'reveal' ? tl.events : null,
      answered: Object.keys(s.subs).length,
      n: ctx.players.length,
      perfect: s.perfect,
    }
  },
  privateView(s, pid) {
    return { sent: !!s.subs[pid], order: s.subs[pid]?.order ?? null, gain: s.gain[pid] ?? 0 }
  },
  controls(s) {
    if (s.stage === 'order') return [{ id: 'next', label: 'Revelar a ordem', key: ' ', tone: 'neutral' }]
    return [{ id: 'next', label: s.i + 1 >= s.tls.length ? 'Ver resultado ▶' : 'Próxima sequência ▶', key: ' ', tone: 'primary' }]
  },
  bot(s, pid, ctx) {
    if (s.stage !== 'order' || s.subs[pid] || ctx.now - s.start < 6000) return null
    const order = s.shuffled.slice().sort((a, b) => a - b)
    if (ctx.rng() < 0.6) {
      const i = Math.floor(ctx.rng() * (order.length - 1))
      ;[order[i], order[i + 1]] = [order[i + 1], order[i]]
    }
    return { type: 'order', data: { order } }
  },

  HostView({ view: v, now }) {
    return (
      <div className="flex h-full flex-col gap-[1em]">
        <RoundBar label={`Sequência ${v.i + 1} de ${v.total} · ${v.ref}`} right={v.stage === 'order' ? <TimerBox start={v.start} end={v.end} now={now} /> : null} />
        <div className="text-center font-display text-[2.6em] font-black">🧭 {v.title}</div>
        {v.stage === 'order' ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-[1.4em]">
            <div className="flex flex-wrap justify-center gap-[0.7em]">
              {v.cards.map((c: any, i: number) => (
                <div key={c.k} className="anim-pop rounded-[0.8em] bg-white px-[1em] py-[0.6em] font-display text-[1.25em] font-extrabold text-[var(--noite)] shadow-[0_0.2em_0_rgba(0,0,0,.25)]" style={{ transform: `rotate(${((i * 37) % 9) - 4}deg)`, animationDelay: `${i * 0.06}s` }}>
                  {c.text}
                </div>
              ))}
            </div>
            <div className="text-[1.2em] opacity-80">Ordene no celular ↕️</div>
            <Answered n={v.answered} total={v.n} />
          </div>
        ) : (
          <div className="flex flex-1 flex-col justify-center">
            <div className="relative mx-auto flex w-full max-w-[60em] flex-col gap-[0.45em]">
              <div className="absolute bottom-[1em] left-[1.6em] top-[1em] w-[0.3em] rounded-full bg-[var(--ouro)]/60" />
              {v.correct.map((e: string, i: number) => (
                <div key={i} className="anim-pop relative flex items-center gap-[0.8em]" style={{ animationDelay: `${i * 0.18}s` }}>
                  <div className="z-10 grid h-[2.2em] w-[2.2em] shrink-0 place-items-center rounded-full bg-[var(--ouro)] font-display font-black text-[#2a1d00]">{i + 1}</div>
                  <div className="flex-1 rounded-[0.7em] bg-white/95 px-[0.9em] py-[0.35em] font-display text-[1.3em] font-extrabold text-[var(--noite)]">{e}</div>
                </div>
              ))}
            </div>
            <div className="mt-[0.8em] text-center font-display text-[1.3em] font-extrabold">🎯 {v.perfect} acertaram a ordem completa</div>
          </div>
        )}
      </div>
    )
  },

  PlayerView({ view: v, priv, send, now, participant }) {
    const [items, setItems] = useState<number[]>(v.cards.map((c: any) => c.k))
    useEffect(() => {
      setItems(v.cards.map((c: any) => c.k))
    }, [v.i, v.cards.length])
    if (!participant) return <Waiting title="Assistindo esta rodada" />
    const text = (k: number) => v.cards.find((c: any) => c.k === k)?.text
    if (v.stage === 'order') {
      if (priv?.sent) return <Waiting title="Ordem enviada! 🧭" mood="wow">Aguarde a revelação.</Waiting>
      const move = (i: number, d: number) => {
        const j = i + d
        if (j < 0 || j >= items.length) return
        const a = items.slice()
        ;[a[i], a[j]] = [a[j], a[i]]
        setItems(a)
      }
      return (
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="font-display font-black">{v.title}</span>
            <PhoneTimer end={v.end} now={now} />
          </div>
          <div className="text-sm text-[var(--muted)]">⬆️ Primeiro acontecimento no topo. Arraste ou use as setas.</div>
          <Reorder.Group axis="y" values={items} onReorder={setItems} className="flex flex-col gap-2">
            {items.map((k, i) => (
              <Reorder.Item key={k} value={k} className="card flex cursor-grab touch-none items-center gap-2 p-2 active:cursor-grabbing">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--ouro)] font-display font-black text-[#2a1d00]">{i + 1}</span>
                <span className="flex-1 font-semibold leading-tight">{text(k)}</span>
                <span className="flex flex-col">
                  <button className="px-2 text-lg leading-none" onClick={() => move(i, -1)} aria-label="Subir">
                    ▲
                  </button>
                  <button className="px-2 text-lg leading-none" onClick={() => move(i, 1)} aria-label="Descer">
                    ▼
                  </button>
                </span>
              </Reorder.Item>
            ))}
          </Reorder.Group>
          <Btn className="mt-auto !text-xl" onClick={() => send('order', { order: items })}>
            Enviar ordem ✅
          </Btn>
        </div>
      )
    }
    return (
      <div className="flex flex-1 flex-col justify-end gap-3 p-4">
        <Waiting title="Veja a jornada no telão" mood="wow" />
        <Sheet tone={priv?.gain >= 800 ? 'ok' : priv?.sent ? 'info' : 'bad'} title={priv?.sent ? `+${priv.gain}` : 'Não deu tempo!'}>
          {priv?.gain >= 800 ? 'Ordem perfeita! 🎯' : 'Confira a ordem certa no telão.'}
        </Sheet>
      </div>
    )
  },
}
