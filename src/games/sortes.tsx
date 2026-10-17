import type { GameDef, PlayerId } from '../engine/types'
import { addXp, draft, shuffle } from '../engine/helpers'
import { Btn, Sheet } from '../ui/kit'
import { Explain, MCPad, OptionsGrid, PhoneTimer, RoundBar, Spotlight, TimerBox, Waiting, pct, sec } from './common'

const DRAW = sec(3.5)
const ANS = sec(15)
const X = 100

type Res = { opt: number | null; result: 'ok' | 'wrong' | 'pass' }
interface S {
  qs: number[]
  i: number
  stage: 'draw' | 'answer' | 'draw2' | 'answer2' | 'reveal'
  t0: number
  t1: number
  chosen: PlayerId | null
  chosen2: PlayerId | null
  first: Res | null
  second: Res | null
  aud: Record<PlayerId, number>
  help: boolean
  helpUsed: PlayerId[]
  recent: PlayerId[]
  xp: Record<PlayerId, number>
  note: Record<PlayerId, string>
  hide: Record<PlayerId, number[]>
  over: boolean
}

function q(s: S, ctx: any) {
  return ctx.pack.questions[s.qs[s.i]]
}

function setStage(s: S, stage: S['stage'], ctx: any, dur: number) {
  s.stage = stage
  s.t0 = ctx.now
  s.t1 = ctx.now + dur
}

function newQuestion(s: S, ctx: any) {
  s.first = null
  s.second = null
  s.chosen2 = null
  s.aud = {}
  s.help = false
  s.note = {}
  s.chosen = draft(ctx, [], s.recent.slice(-2))
  if (s.chosen) s.recent.push(s.chosen)
  const qq = q(s, ctx)
  s.hide = {}
  for (const p of ctx.players) {
    if (ctx.effects[p.id]?.lamp) s.hide[p.id] = shuffle([0, 1, 2, 3].filter((k) => k !== qq.answer), ctx.rng).slice(0, 2)
  }
  setStage(s, 'draw', ctx, DRAW)
}

function resolve(s: S, which: 1 | 2, opt: number | null, ctx: any) {
  const qq = q(s, ctx)
  const pid = which === 1 ? s.chosen! : s.chosen2!
  const result: Res['result'] = opt === null ? 'pass' : opt === qq.answer ? 'ok' : 'wrong'
  let g = 0
  if (which === 1) {
    g = result === 'ok' ? (s.help ? 1.5 : 2) * X : result === 'wrong' ? -2 * X : -1 * X
    s.first = { opt, result }
  } else {
    g = result === 'ok' ? 3 * X : result === 'wrong' ? -1 * X : 0
    s.second = { opt, result }
  }
  addXp(s.xp, pid, g)
  s.note[pid] = `${g >= 0 ? '+' : ''}${g}`
  if (which === 1 && result !== 'ok') {
    const next = draft({ ...ctx, forcedSpotlight: undefined }, [s.chosen!])
    if (next) {
      s.chosen2 = next
      delete s.aud[next]
      setStage(s, 'draw2', ctx, DRAW)
      return
    }
  }
  finish(s, ctx)
}

function finish(s: S, ctx: any) {
  const qq = q(s, ctx)
  for (const [pid, opt] of Object.entries(s.aud)) {
    if (pid === s.chosen || pid === s.chosen2) continue
    if (opt === qq.answer) {
      addXp(s.xp, pid, s.chosen ? 50 : 100)
      s.note[pid] = `+${s.chosen ? 50 : 100}`
    } else s.note[pid] = '+0'
  }
  setStage(s, 'reveal', ctx, 0)
}

export const sortes: GameDef<S> = {
  id: 'sortes',
  name: 'Lançar Sortes',
  icon: '🎲',
  origin: 'Era "Roleta Russa" · Provérbios 16:33',
  tagline: 'A sorte escolhe quem responde. Arrisca ou passa?',
  kind: 'spotlight',
  needsJudge: false,
  minPlayers: 2,
  idealRange: [4, 30],
  truths: ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7'],
  energy: 3,
  depth: 2,
  accent: 'var(--purpura)',
  howTo: {
    steps: [
      { icon: '🎲', text: 'A sorte escolhe UMA pessoa para responder a pergunta.' },
      { icon: '🤔', text: 'Ela pode responder, passar ou pedir ajuda à plateia (1 vez).' },
      { icon: '🔥', text: 'Se errar ou passar, a pergunta "queima" e vai para outra pessoa sorteada.' },
      { icon: '👥', text: 'Todo o resto responde em silêncio como plateia.' },
    ],
    scoring: [
      '1º sorteado: acertou +200 · errou −200 · passou −100',
      'Com ajuda da plateia, o acerto vale +150',
      '2º sorteado: acertou +300 · errou −100 · passou 0',
      'Plateia: acerto +50 (nunca perde)',
    ],
    phone: 'Se você foi sorteado: 4 alternativas + Passar + Ajuda. Se não: 4 alternativas da plateia.',
    tip: 'Não quer ser sorteado? Ative "Não me sortear" no seu celular (menu ⚙️).',
  },
  rounds: { min: 3, max: 12, label: 'perguntas', default: () => 6 },
  perRound: () => 0.67,
  maxRoundsFor: (pack) => pack.questions.length,

  init(ctx, rounds) {
    const s: S = { qs: shuffle(ctx.pack.questions.map((_, i) => i), ctx.rng).slice(0, rounds), i: 0, stage: 'draw', t0: 0, t1: 0, chosen: null, chosen2: null, first: null, second: null, aud: {}, help: false, helpUsed: [], recent: [], xp: {}, note: {}, hide: {}, over: false }
    newQuestion(s, ctx)
    return s
  },
  input(s, msg, ctx) {
    const { pid, type, data } = msg
    if (s.stage === 'answer' && pid === s.chosen) {
      if (type === 'help' && !s.helpUsed.includes(pid) && !s.help) {
        s.help = true
        s.helpUsed.push(pid)
      }
      if (type === 'answer') resolve(s, 1, Number(data?.opt), ctx)
      if (type === 'pass') resolve(s, 1, null, ctx)
      return s
    }
    if (s.stage === 'answer2' && pid === s.chosen2) {
      if (type === 'answer') resolve(s, 2, Number(data?.opt), ctx)
      if (type === 'pass') resolve(s, 2, null, ctx)
      return s
    }
    if (type === 'aud' && ['draw', 'answer', 'draw2', 'answer2'].includes(s.stage) && pid !== s.chosen && pid !== s.chosen2 && s.aud[pid] === undefined) {
      s.aud[pid] = Number(data?.opt)
    }
    return s
  },
  action(s, a, _d, ctx) {
    if (a !== 'next') return s
    if (s.stage === 'draw' || s.stage === 'draw2') s.t1 = ctx.now
    else if (s.stage === 'answer') resolve(s, 1, null, ctx)
    else if (s.stage === 'answer2') resolve(s, 2, null, ctx)
    else if (s.stage === 'reveal') {
      if (s.i + 1 < s.qs.length) {
        s.i++
        newQuestion(s, ctx)
      } else s.over = true
    }
    return s
  },
  tick(s, ctx) {
    if (ctx.now < s.t1) return s
    if (s.stage === 'draw') {
      if (!s.chosen) setStage(s, 'answer', ctx, ANS)
      else setStage(s, 'answer', ctx, ANS)
    } else if (s.stage === 'draw2') setStage(s, 'answer2', ctx, ANS)
    else if (s.stage === 'answer') {
      if (!s.chosen) finish(s, ctx)
      else resolve(s, 1, null, ctx)
    } else if (s.stage === 'answer2') resolve(s, 2, null, ctx)
    return s
  },
  done: (s) => s.over,
  scores: (s) => s.xp,
  publicView(s, ctx) {
    const qq = q(s, ctx)
    const audCounts = [0, 1, 2, 3].map((k) => Object.values(s.aud).filter((o) => o === k).length)
    const audTotal = Object.keys(s.aud).length
    return {
      i: s.i,
      total: s.qs.length,
      stage: s.stage,
      t0: s.t0,
      t1: s.t1,
      q: qq.q,
      opts: qq.options,
      chosen: s.chosen,
      chosen2: s.chosen2,
      first: s.first,
      second: s.second,
      help: s.help,
      audCounts: s.help || s.stage === 'reveal' ? audCounts : null,
      audTotal,
      audN: ctx.players.length - (s.chosen ? 1 : 0),
      reveal: s.stage === 'reveal' ? { answer: qq.answer, explain: qq.explain, ref: qq.ref, audPct: pct(audCounts[qq.answer], audTotal) } : null,
      notes: s.stage === 'reveal' ? s.note : null,
    }
  },
  privateView(s, pid) {
    return { aud: s.aud[pid] ?? null, helpUsed: s.helpUsed.includes(pid), note: s.note[pid] ?? null, hide: s.hide[pid] ?? [] }
  },
  controls(s) {
    if (s.stage === 'reveal') return [{ id: 'next', label: s.i + 1 >= s.qs.length ? 'Ver resultado ▶' : 'Próxima sorte 🎲', key: ' ', tone: 'primary' }]
    if (s.stage === 'answer' || s.stage === 'answer2') return [{ id: 'next', label: 'Tempo esgotado (conta como passar)', tone: 'neutral' }]
    return []
  },
  bot(s, pid, ctx) {
    const qq = q(s, ctx)
    const guess = ctx.rng() < 0.65 ? qq.answer : Math.floor(ctx.rng() * 4)
    if (s.stage === 'answer' && pid === s.chosen && ctx.now - s.t0 > 2500) return ctx.rng() < 0.1 ? { type: 'pass' } : { type: 'answer', data: { opt: guess } }
    if (s.stage === 'answer2' && pid === s.chosen2 && ctx.now - s.t0 > 2500) return { type: 'answer', data: { opt: guess } }
    if (pid !== s.chosen && pid !== s.chosen2 && s.aud[pid] === undefined && (s.stage === 'answer' || s.stage === 'answer2')) return { type: 'aud', data: { opt: guess } }
    return null
  },

  HostView({ view: v, players, now }) {
    const chosen = v.chosen ? players[v.chosen] : undefined
    const chosen2 = v.chosen2 ? players[v.chosen2] : undefined
    const drawing = v.stage === 'draw' || v.stage === 'draw2'
    const who = v.stage === 'draw2' || v.stage === 'answer2' || (v.stage === 'reveal' && v.second) ? chosen2 : chosen
    if (drawing) {
      const pool = Object.values(players).filter((p) => p.online)
      const spin = pool[Math.floor(now / 110) % Math.max(1, pool.length)]
      const settled = now > v.t1 - 900
      const p = settled ? who : spin
      return (
        <div className="flex h-full flex-col items-center justify-center gap-[1em]">
          <div className="font-display text-[2.2em] font-black">{v.stage === 'draw' ? '🎲 Lançando a sorte…' : '🔥 A pergunta queimou! Nova sorte…'}</div>
          <div className="text-[1.1em] italic opacity-75">"A sorte se lança no regaço, mas do Senhor procede toda decisão." (Pv 16:33)</div>
          {p ? <Spotlight p={p} size="12em" key={settled ? 'settled' : p.id} /> : <div className="text-[1.5em]">Pergunta para todos!</div>}
        </div>
      )
    }
    const r = v.reveal
    return (
      <div className="flex h-full flex-col gap-[1em]">
        <RoundBar
          label={`Pergunta ${v.i + 1} de ${v.total}${v.stage === 'answer2' || v.second ? ' · 🔥 2ª chance (vale ×3)' : ' · vale ×2'}`}
          right={v.stage === 'answer' || v.stage === 'answer2' ? <TimerBox start={v.t0} end={v.t1} now={now} /> : null}
        />
        <div className="flex flex-1 gap-[1.5em]">
          <div className="flex w-[13em] shrink-0 flex-col items-center justify-center gap-[0.8em]">
            {who ? <Spotlight p={who} size="8em" label={v.stage === 'reveal' ? undefined : 'está respondendo…'} /> : <div className="text-center font-display text-[1.4em] font-black">Pergunta para todos 👥</div>}
            {v.first && chosen && (
              <div className="rounded-full bg-black/25 px-[0.8em] py-[0.2em] text-center text-[0.95em]">
                {chosen.name}: {v.first.result === 'ok' ? '✅ acertou' : v.first.result === 'wrong' ? '❌ errou' : '⏭ passou'}
              </div>
            )}
            {v.second && chosen2 && (
              <div className="rounded-full bg-black/25 px-[0.8em] py-[0.2em] text-center text-[0.95em]">
                {chosen2.name}: {v.second.result === 'ok' ? '✅ acertou' : v.second.result === 'wrong' ? '❌ errou' : '⏭ passou'}
              </div>
            )}
            {v.help && <div className="rounded-full bg-[var(--ouro)] px-[0.8em] font-display font-black text-[#2a1d00]">🙋 Pediu ajuda à plateia</div>}
          </div>
          <div className="flex flex-1 flex-col gap-[1em]">
            <div className="rounded-[1.2em] bg-white px-[1em] py-[0.8em] text-center font-display text-[2.1em] font-black leading-tight text-[var(--noite)]">{v.q}</div>
            <OptionsGrid options={v.opts} correct={r?.answer} reveal={!!r} counts={v.audCounts ?? undefined} />
            {v.help && !r && v.audCounts && (
              <div className="grid grid-cols-4 gap-[0.6em] text-center font-display font-black">
                {v.audCounts.map((c: number, i: number) => (
                  <div key={i} className="rounded-[0.6em] bg-white/15 py-[0.2em]">
                    {pct(c, v.audTotal)}%
                  </div>
                ))}
              </div>
            )}
            {r ? (
              <Explain refText={r.ref}>
                {r.explain} <span className="opacity-70">· Plateia: {r.audPct}% acertou</span>
              </Explain>
            ) : (
              <div className="text-center opacity-75">👥 Plateia respondendo em silêncio: {v.audTotal}/{v.audN}</div>
            )}
          </div>
        </div>
      </div>
    )
  },

  PlayerView({ view: v, priv, send, me, now, players }) {
    const meId = me?.id
    const iAmUp = (v.stage === 'answer' && meId === v.chosen) || (v.stage === 'answer2' && meId === v.chosen2)
    if (v.stage === 'draw' || v.stage === 'draw2') {
      const settled = now > v.t1 - 900
      const target = v.stage === 'draw' ? v.chosen : v.chosen2
      if (settled && target === meId) return <Waiting title="A sorte caiu em você! 🎲" me={me} mood="wow">Prepare-se…</Waiting>
      return <Waiting title="Lançando a sorte… 🎲" me={me} />
    }
    if (iAmUp) {
      return (
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="font-display font-black text-[var(--purpura)]">{v.stage === 'answer2' ? '🔥 Vale +300!' : v.help ? 'Vale +150' : 'Vale +200 / −200'}</span>
            <PhoneTimer end={v.t1} now={now} />
          </div>
          <div className="card p-3 text-center font-display text-lg font-black">{v.q}</div>
          <MCPad labels={v.opts} onPick={(i) => send('answer', { opt: i })} hide={priv?.hide} />
          {v.help && v.audCounts && <div className="text-center text-sm font-semibold">Plateia: {v.audCounts.map((c: number, i: number) => `${'ABCD'[i]} ${pct(c, v.audTotal)}%`).join(' · ')}</div>}
          <div className="grid grid-cols-2 gap-2">
            <Btn ghost onClick={() => send('pass')}>
              ⏭ Passar ({v.stage === 'answer2' ? '0' : '−100'})
            </Btn>
            <Btn tone="gold" disabled={v.stage !== 'answer' || priv?.helpUsed || v.help} onClick={() => send('help')}>
              🙋 Plateia
            </Btn>
          </div>
        </div>
      )
    }
    if (v.stage === 'reveal') {
      const note = priv?.note
      const wasUp = meId === v.chosen || meId === v.chosen2
      const good = note && !note.startsWith('-') && note !== '+0'
      return (
        <div className="flex flex-1 flex-col justify-end gap-3 p-4">
          <Waiting title={good ? 'Boa! 🎉' : wasUp ? 'Faz parte! Bora pra próxima' : 'Resposta no telão'} me={me} mood={good ? 'wow' : 'happy'} />
          <Sheet tone={good ? 'ok' : note && note.startsWith('-') ? 'bad' : 'info'} title={note ?? 'Sem resposta'}>
            Resposta: <b>{v.opts[v.reveal.answer]}</b> ({v.reveal.ref})
          </Sheet>
        </div>
      )
    }
    const up = v.stage === 'answer2' ? v.chosen2 : v.chosen
    return (
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="text-center font-display font-black text-[var(--muted)]">
          👥 Plateia · {up ? `${players[up]?.name} está respondendo` : 'todos respondem'} · acerto +{v.chosen ? 50 : 100}
        </div>
        <div className="card p-3 text-center font-display text-lg font-black">{v.q}</div>
        {priv?.aud != null ? <Waiting title="Palpite registrado 🤫" /> : <MCPad labels={v.opts} onPick={(i) => send('aud', { opt: i })} hide={priv?.hide} />}
      </div>
    )
  },
}
