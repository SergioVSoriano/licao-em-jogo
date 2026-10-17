import { useEffect, useRef, useState } from 'react'
import type { GameCtx, GameDef, PlayerId } from '../engine/types'
import { addXp, cleanGuess, matchAnswer, online, shuffle } from '../engine/helpers'
import { Avatar } from '../ui/avatars'
import { Btn, Sheet } from '../ui/kit'
import { PhoneTimer, RoundBar, TimerBox, Waiting, sec } from './common'

/**
 * Três Sinais, no estilo do jogo do Silvio Santos: cada um vê a dica 1 e DIGITA o palpite.
 * Errou ou não sabe? Abre a próxima dica, só para você, valendo menos.
 */
const T = sec(50)
const PTS = [1000, 600, 300]

interface Prog {
  level: number
  done: boolean
  ok: boolean
  wrong: string[]
  at?: number
}

interface S {
  cards: number[]
  i: number
  stage: 'play' | 'reveal'
  start: number
  end: number
  prog: Record<PlayerId, Prog>
  solved: { pid: PlayerId; level: number }[]
  xp: Record<PlayerId, number>
  gain: Record<PlayerId, number>
  over: boolean
}

function setup(s: S, ctx: GameCtx) {
  s.prog = {}
  s.solved = []
  s.gain = {}
  s.stage = 'play'
  s.start = ctx.now
  s.end = ctx.now + T
}

function card(s: S, ctx: GameCtx) {
  return ctx.pack.threeSigns[s.cards[s.i]]
}

function me(s: S, pid: PlayerId): Prog {
  return (s.prog[pid] ??= { level: 1, done: false, ok: false, wrong: [] })
}

function reveal(s: S, ctx: GameCtx) {
  for (const p of ctx.players) s.gain[p.id] = s.gain[p.id] ?? 0
  s.stage = 'reveal'
}

export const sinais: GameDef<S> = {
  id: 'sinais',
  name: 'Três Sinais',
  icon: '🔦',
  origin: 'Era "Jogo das 3 pistas" (Silvio Santos)',
  tagline: 'Adivinhe com o mínimo de dicas. Errou? Ganha mais uma dica, valendo menos.',
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
      { icon: '1️⃣', text: 'Todo mundo recebe a dica 1 (a mais difícil) no celular.' },
      { icon: '⌨️', text: 'Digite o seu palpite. Pode errar a acentuação, tudo bem!' },
      { icon: '🔓', text: 'Errou ou tocou em "Não sei"? Abre a próxima dica, só para você.' },
      { icon: '🏁', text: 'No telão, os avatares aparecem conforme cada um acerta: é uma corrida!' },
    ],
    scoring: ['Acertou na dica 1: 1000', 'Na dica 2: 600', 'Na dica 3: 300', 'Errar não tira pontos: só faz você perder a dica'],
    phone: 'As dicas que você já abriu, um campo para digitar e os botões "Chutar" e "Não sei".',
    tip: 'Na revelação aparecem os palpites errados mais comuns (sempre rende risada e conversa).',
  },
  rounds: { min: 3, max: 10, label: 'cartas', default: () => 5 },
  perRound: () => 1,
  maxRoundsFor: (pack) => pack.threeSigns.length,

  init(ctx, rounds) {
    const s: S = { cards: shuffle(ctx.pack.threeSigns.map((_, i) => i), ctx.rng).slice(0, rounds), i: 0, stage: 'play', start: 0, end: 0, prog: {}, solved: [], xp: {}, gain: {}, over: false }
    setup(s, ctx)
    return s
  },
  input(s, msg, ctx) {
    if (s.stage !== 'play') return s
    const p = me(s, msg.pid)
    if (p.done) return s
    const c = card(s, ctx)
    if (msg.type === 'guess') {
      const text = String(msg.data?.text ?? '').slice(0, 40)
      if (!cleanGuess(text)) return s
      if (matchAnswer(text, [c.answer, ...c.accept])) {
        p.ok = true
        p.done = true
        p.at = msg.at
        const g = PTS[p.level - 1]
        s.gain[msg.pid] = g
        addXp(s.xp, msg.pid, g)
        s.solved.push({ pid: msg.pid, level: p.level })
        return s
      }
      p.wrong.push(text.trim())
    }
    if (msg.type === 'guess' || msg.type === 'pass') {
      if (p.level < 3) p.level++
      else p.done = true
    }
    return s
  },
  action(s, a, _d, ctx) {
    if (a !== 'next') return s
    if (s.stage === 'play') reveal(s, ctx)
    else if (s.i + 1 < s.cards.length) {
      s.i++
      setup(s, ctx)
    } else s.over = true
    return s
  },
  tick(s, ctx) {
    if (s.stage !== 'play') return s
    const on = online(ctx)
    if (ctx.now >= s.end || (on.length > 0 && on.every((p) => s.prog[p.id]?.done))) reveal(s, ctx)
    return s
  },
  done: (s) => s.over,
  scores: (s) => s.xp,
  publicView(s, ctx) {
    const c = card(s, ctx)
    const ch = ctx.pack.characters.find((x) => x.name === c.answer)
    const progs = Object.values(s.prog)
    const atLevel = [1, 2, 3].map((l) => ctx.players.filter((p) => !s.prog[p.id]?.done && (s.prog[p.id]?.level ?? 1) === l).length)
    let wrongTop: { word: string; n: number }[] = []
    if (s.stage === 'reveal') {
      const counts = new Map<string, { word: string; n: number }>()
      for (const p of progs)
        for (const w of p.wrong) {
          const k = cleanGuess(w)
          if (!k) continue
          const e = counts.get(k) ?? { word: w, n: 0 }
          e.n++
          counts.set(k, e)
        }
      wrongTop = [...counts.values()].sort((a, b) => b.n - a.n).slice(0, 6)
    }
    return {
      i: s.i,
      total: s.cards.length,
      stage: s.stage,
      ask: c.ask,
      clue1: c.clues[0],
      start: s.start,
      end: s.end,
      solved: s.solved,
      atLevel,
      n: ctx.players.length,
      reveal: s.stage === 'reveal' ? { answer: c.answer, clues: c.clues, ref: c.ref, bio: ch?.bio, byLevel: [1, 2, 3].map((l) => s.solved.filter((x) => x.level === l).length), wrongTop, missed: ctx.players.length - s.solved.length } : null,
    }
  },
  privateView(s, pid, ctx) {
    const c = card(s, ctx)
    const p = s.prog[pid] ?? { level: 1, done: false, ok: false, wrong: [] }
    return {
      level: p.level,
      clues: c.clues.slice(0, p.level),
      done: p.done,
      ok: p.ok,
      lastWrong: p.wrong[p.wrong.length - 1] ?? null,
      wrongCount: p.wrong.length,
      gain: s.gain[pid] ?? 0,
      hint: ctx.effects[pid]?.lamp ? `${c.answer[0].toUpperCase()}… (${c.answer.replace(/[^ ]/g, '_').length} letras)` : null,
    }
  },
  controls(s) {
    if (s.stage === 'play') return [{ id: 'next', label: 'Revelar', key: ' ', tone: 'neutral' }]
    return [{ id: 'next', label: s.i + 1 >= s.cards.length ? 'Ver resultado ▶' : 'Próxima carta ▶', key: ' ', tone: 'primary' }]
  },
  bot(s, pid, ctx) {
    if (s.stage !== 'play' || s.prog[pid]?.done || ctx.now - s.start < 3000 || ctx.rng() > 0.35) return null
    const c = card(s, ctx)
    const level = s.prog[pid]?.level ?? 1
    if (ctx.rng() < 0.15 + level * 0.22) return { type: 'guess', data: { text: c.answer.toLowerCase() } }
    if (ctx.rng() < 0.3) return { type: 'pass' }
    const wrong = c.options.filter((o) => o !== c.answer)
    return { type: 'guess', data: { text: wrong[Math.floor(ctx.rng() * wrong.length)] } }
  },

  HostView({ view: v, players, now }) {
    const r = v.reveal
    const cols = [0, 1, 2].map((k) => v.solved.filter((x: any) => x.level === k + 1))
    return (
      <div className="flex h-full flex-col gap-[0.9em]">
        <RoundBar label={`Carta ${v.i + 1} de ${v.total} · ${v.ask}`} right={!r ? <TimerBox start={v.start} end={v.end} now={now} /> : null} />
        {!r ? (
          <>
            <div className="anim-pop rounded-[1.2em] bg-white px-[1.2em] py-[0.8em] text-center text-[var(--noite)] shadow-[0_0.25em_0_rgba(0,0,0,.25)]">
              <div className="font-display text-[1em] font-black text-[var(--purpura)]">🔦 DICA 1 · vale 1000</div>
              <div className="font-display text-[2.4em] font-black leading-tight">{v.clue1}</div>
            </div>
            <div className="text-center text-[1.05em] opacity-80">As outras dicas só abrem no celular de quem errou ou disse "não sei" 🤫</div>
            <div className="grid min-h-0 flex-1 grid-cols-3 gap-[0.8em]">
              {[0, 1, 2].map((k) => (
                <div key={k} className="flex min-h-0 flex-col rounded-[1em] bg-white/10 p-[0.7em]">
                  <div className="flex items-center justify-between font-display font-black">
                    <span>✅ Acertou na dica {k + 1}</span>
                    <span className="rounded-full bg-[var(--ouro)] px-[0.6em] text-[#2a1d00]">{PTS[k]}</span>
                  </div>
                  <div className="mt-[0.5em] flex flex-wrap content-start gap-[0.4em] overflow-hidden">
                    {cols[k].map((x: any) => {
                      const p = players[x.pid]
                      return p ? (
                        <div key={x.pid} className="anim-pop flex flex-col items-center">
                          <Avatar id={p.avatar} color={p.color} size="3em" showItem={false} mood="wow" />
                          <span className="max-w-[5em] truncate text-[0.8em] font-bold">{p.name}</span>
                        </div>
                      ) : null
                    })}
                  </div>
                  <div className="mt-auto pt-[0.4em] text-[0.9em] opacity-70">🤔 {v.atLevel[k]} tentando com {k + 1} dica{k ? 's' : ''}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col justify-center gap-[1em]">
            <div className="grid grid-cols-3 gap-[0.8em]">
              {r.clues.map((c: string, k: number) => (
                <div key={k} className="anim-pop rounded-[1em] bg-white p-[0.7em] text-[var(--noite)]" style={{ animationDelay: `${k * 0.2}s` }}>
                  <div className="font-display text-[0.9em] font-black opacity-60">
                    DICA {k + 1} · {r.byLevel[k]} acertaram
                  </div>
                  <div className="font-display text-[1.7em] font-extrabold leading-tight">{c}</div>
                </div>
              ))}
            </div>
            <div className="anim-pop flex items-center gap-[1em] rounded-[1.2em] bg-[var(--ouro)] p-[0.9em] text-[#2a1d00]" style={{ animationDelay: '.6s' }}>
              <div className="font-display text-[3.6em] font-black leading-none">{r.answer}</div>
              <div className="flex-1 text-[1.35em] font-semibold">
                {r.bio ?? ''} <b>({r.ref})</b>
              </div>
            </div>
            {r.wrongTop.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-[0.5em] text-[1.3em]">
                <span className="font-display font-black opacity-80">😅 Palpites que não foram:</span>
                {r.wrongTop.map((w: any) => (
                  <span key={w.word} className="rounded-full bg-white/15 px-[0.8em] py-[0.1em] font-display font-bold">
                    {w.word}
                    {w.n > 1 && <sup className="ml-[0.2em]">{w.n}</sup>}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  },

  PlayerView({ view: v, priv, send, now, participant }) {
    const [text, setText] = useState('')
    const [shake, setShake] = useState(0)
    const prevWrong = useRef(0)
    useEffect(() => {
      setText('')
      prevWrong.current = 0
    }, [v.i])
    useEffect(() => {
      if ((priv?.wrongCount ?? 0) > prevWrong.current) setShake((x) => x + 1)
      prevWrong.current = priv?.wrongCount ?? 0
    }, [priv?.wrongCount])
    if (!participant) return <Waiting title="Assistindo esta rodada" />
    if (v.stage === 'play') {
      if (priv?.done && priv.ok) return <Waiting title={`Acertou na dica ${priv.level}! 🎯`} mood="wow">+{priv.gain} pontos. Não conte para ninguém 🤫</Waiting>
      if (priv?.done) return <Waiting title="Acabaram as dicas 😅" mood="sad">A resposta aparece no telão já já.</Waiting>
      const level = priv?.level ?? 1
      return (
        <form
          className="flex flex-1 flex-col gap-3 p-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!text.trim()) return
            send('guess', { text })
            setText('')
          }}
        >
          <div className="flex items-center justify-between">
            <span className="font-display font-black">
              {v.ask} · vale {PTS[level - 1]}
            </span>
            <PhoneTimer end={v.end} now={now} />
          </div>
          {(priv?.clues ?? [v.clue1]).map((c: string, k: number) => (
            <div key={k} className={`card p-3 ${k === level - 1 ? 'anim-pop' : 'opacity-70'}`}>
              <div className="text-xs font-black text-[var(--purpura)]">DICA {k + 1}</div>
              <div className="font-display text-lg font-black leading-tight">{c}</div>
            </div>
          ))}
          {priv?.lastWrong && (
            <div key={shake} className="anim-shake rounded-xl bg-[#ffe1e1] px-3 py-2 text-sm font-bold text-[var(--carmesim-s)]">
              ❌ Não é "{priv.lastWrong}". {level <= 3 ? 'Olha a nova dica!' : ''}
            </div>
          )}
          {priv?.hint && <div className="rounded-xl bg-[#fff3cf] px-3 py-2 text-sm font-bold text-[#7a5600]">🕯️ Lâmpada: começa com {priv.hint}</div>}
          <input className="field !text-xl font-display font-black" placeholder="Seu palpite…" value={text} maxLength={40} onChange={(e) => setText(e.target.value)} autoFocus enterKeyHint="send" autoComplete="off" autoCorrect="off" />
          <div className="mt-auto grid grid-cols-3 gap-2">
            <Btn ghost type="button" onClick={() => send('pass')}>
              {level < 3 ? 'Não sei 🔓' : 'Desisto'}
            </Btn>
            <Btn className="col-span-2 !text-xl" type="submit" disabled={!text.trim()}>
              Chutar 🎯
            </Btn>
          </div>
        </form>
      )
    }
    const ok = priv?.ok
    return (
      <div className="flex flex-1 flex-col justify-end gap-3 p-4">
        <Waiting title={ok ? 'Na mosca! 🎯' : 'Era essa!'} mood={ok ? 'wow' : 'sad'} />
        <Sheet tone={ok ? 'ok' : 'info'} title={ok ? `+${priv.gain}` : v.reveal.answer}>
          {ok ? `Você acertou na dica ${priv.level}.` : 'Confira as três dicas no telão.'} <b>({v.reveal.ref})</b>
        </Sheet>
      </div>
    )
  },
}
