import { useEffect, useState } from 'react'
import type { GameDef } from '../engine/types'
import { normalizeWord, online, pick } from '../engine/helpers'
import { Btn, Sheet } from '../ui/kit'
import { Answered, PhoneTimer, RoundBar, TimerBox, Waiting, sec } from './common'

const T = sec(45)

interface S {
  prompts: number[]
  i: number
  stage: 'write' | 'reveal'
  start: number
  end: number
  entries: Record<string, string[]>
  gold: string[]
  xp: Record<string, number>
  gain: Record<string, number>
  over: boolean
}

function cloud(s: S, ctx: any) {
  const p = ctx.pack.cloudPrompts[s.prompts[s.i]]
  const map = new Map<string, { count: number; forms: Record<string, number> }>()
  for (const words of Object.values(s.entries)) {
    const seen = new Set<string>()
    for (const raw of words) {
      const k = normalizeWord(raw, p.synonyms)
      if (!k || seen.has(k)) continue
      seen.add(k)
      const e = map.get(k) ?? { count: 0, forms: {} }
      e.count++
      const f = raw.trim().toLowerCase()
      e.forms[f] = (e.forms[f] ?? 0) + 1
      map.set(k, e)
    }
  }
  return [...map.entries()]
    .map(([key, e]) => ({ key, word: Object.entries(e.forms).sort((a, b) => b[1] - a[1])[0][0], count: e.count }))
    .sort((a, b) => b.count - a.count)
}

function score(s: S, ctx: any) {
  const p = ctx.pack.cloudPrompts[s.prompts[s.i]]
  const n = Math.max(2, Object.keys(s.entries).length)
  const counts = Object.fromEntries(cloud(s, ctx).map((c) => [c.key, c.count]))
  s.gain = {}
  for (const [pid, words] of Object.entries(s.entries)) {
    const keys = [...new Set(words.map((w) => normalizeWord(w, p.synonyms)).filter(Boolean))]
    let g = p.scored ? keys.reduce((a, k) => a + Math.round((333 * ((counts[k] ?? 1) - 1)) / (n - 1)), 0) : 100
    g += keys.filter((k) => s.gold.includes(k)).length * 200
    s.gain[pid] = g
  }
}

export const nuvem: GameDef<S> = {
  id: 'nuvem',
  name: 'Nuvem de Testemunhas',
  icon: '☁️',
  origin: 'Era "Nuvem de Palavras" · Hebreus 12:1',
  tagline: 'Pense como a turma: palavras repetidas valem mais.',
  kind: 'all',
  needsJudge: false,
  minPlayers: 2,
  idealRange: [5, 30],
  energy: 2,
  depth: 3,
  accent: 'var(--azul)',
  howTo: {
    steps: [
      { icon: '❓', text: 'Uma pergunta aparece no telão.' },
      { icon: '✍️', text: 'Escreva até 3 palavras no celular. É anônimo!' },
      { icon: '☁️', text: 'A nuvem se forma: palavras repetidas crescem.' },
      { icon: '🗣️', text: 'O facilitador puxa a conversa a partir das palavras.' },
    ],
    scoring: [
      'Cada palavra vale mais quanto mais gente escreveu a mesma',
      '⭐ Palavra de Ouro: o facilitador toca numa ideia original e ela vale +200',
      'A última pergunta (atitude pessoal) não vale pontos',
    ],
    phone: 'Três campos de texto e um botão Enviar. Dá para editar até o tempo acabar.',
    tip: 'Na quarta, a lição pede uma rede semântica: é exatamente isto!',
  },
  rounds: { min: 1, max: 5, label: 'perguntas', default: () => 2 },
  perRound: () => 1.75,
  maxRoundsFor: (pack) => pack.cloudPrompts.length,

  init(ctx, rounds) {
    const scored = ctx.pack.cloudPrompts.map((_, i) => i)
    return { prompts: scored.slice(0, rounds), i: 0, stage: 'write', start: ctx.now, end: ctx.now + T, entries: {}, gold: [], xp: {}, gain: {}, over: false }
  },
  input(s, msg) {
    if (msg.type !== 'words' || s.stage !== 'write') return s
    const words = (Array.isArray(msg.data?.words) ? msg.data.words : [])
      .map((w: unknown) => String(w ?? '').slice(0, 24).trim())
      .filter(Boolean)
      .slice(0, 3)
    if (words.length) s.entries[msg.pid] = words
    return s
  },
  action(s, a, data, ctx) {
    if (a === 'gold' && s.stage === 'reveal' && data?.key) {
      if (s.gold.includes(data.key)) s.gold = s.gold.filter((k) => k !== data.key)
      else s.gold.push(data.key)
      score(s, ctx)
      return s
    }
    if (a !== 'next') return s
    if (s.stage === 'write') {
      s.stage = 'reveal'
      score(s, ctx)
    } else {
      for (const [pid, g] of Object.entries(s.gain)) s.xp[pid] = (s.xp[pid] ?? 0) + g
      if (s.i + 1 < s.prompts.length) {
        s.i++
        s.stage = 'write'
        s.entries = {}
        s.gold = []
        s.gain = {}
        s.start = ctx.now
        s.end = ctx.now + T
      } else s.over = true
    }
    return s
  },
  tick(s, ctx) {
    if (s.stage === 'write') {
      const on = online(ctx)
      if (ctx.now >= s.end || (on.length > 1 && on.every((p) => s.entries[p.id]) && ctx.now > s.start + 8000)) {
        s.stage = 'reveal'
        score(s, ctx)
      }
    }
    return s
  },
  done: (s) => s.over,
  scores: (s) => s.xp,
  publicView(s, ctx) {
    const p = ctx.pack.cloudPrompts[s.prompts[s.i]]
    return {
      i: s.i,
      total: s.prompts.length,
      stage: s.stage,
      prompt: p.text,
      scored: p.scored,
      start: s.start,
      end: s.end,
      answered: Object.keys(s.entries).length,
      n: ctx.players.length,
      cloud: s.stage === 'reveal' ? cloud(s, ctx).slice(0, 40).map((c) => ({ ...c, gold: s.gold.includes(c.key) })) : null,
      last: s.i + 1 >= s.prompts.length,
    }
  },
  privateView(s, pid) {
    return { words: s.entries[pid] ?? null, gain: s.gain[pid] ?? 0 }
  },
  controls(s, ctx) {
    if (s.stage === 'write') return [{ id: 'next', label: 'Mostrar a nuvem', key: ' ', tone: 'neutral' }]
    const words = cloud(s, ctx)
      .slice(0, 16)
      .map((c) => ({ id: 'gold', label: (s.gold.includes(c.key) ? '⭐ ' : '☆ ') + c.word, data: { key: c.key }, small: true, tone: 'gold' as const }))
    return [{ id: 'next', label: s.i + 1 >= s.prompts.length ? 'Ver resultado ▶' : 'Próxima pergunta ▶', key: ' ', tone: 'primary' }, ...words]
  },
  bot(s, pid, ctx) {
    if (s.stage !== 'write' || s.entries[pid]) return null
    const bank: Record<number, string[]> = {
      0: ['cansado', 'triste', 'sozinho', 'medo', 'exausto', 'desanimado', 'frustrado', 'derrotado'],
      1: ['dinheiro', 'redes sociais', 'medo', 'popularidade', 'cultura', 'amigos', 'orgulho'],
      2: ['coragem', 'Débora', 'Hulda', 'Miriã', 'fidelidade', 'liderança', 'voz'],
      3: ['coragem', 'fidelidade', 'obediência', 'verdade', 'oração', 'coerência'],
      4: ['descansar', 'obedecer', 'orar', 'coragem', 'disponível'],
    }
    const pool = bank[s.prompts[s.i]] ?? bank[0]
    return { type: 'words', data: { words: [pick(pool, ctx.rng), pick(pool, ctx.rng), pick(pool, ctx.rng)] } }
  },

  HostView({ view: v, now, control }) {
    const max = v.cloud?.[0]?.count ?? 1
    return (
      <div className="flex h-full flex-col gap-[1em]">
        <RoundBar label={`Pergunta ${v.i + 1} de ${v.total}${v.scored ? '' : ' · sem pontos 🙏'}`} right={v.stage === 'write' ? <TimerBox start={v.start} end={v.end} now={now} /> : null} />
        <div className="text-center font-display text-[2.4em] font-black leading-tight">☁️ {v.prompt}</div>
        {v.stage === 'write' ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-[1em]">
            <div className="flex flex-wrap justify-center gap-[0.6em]">
              {Array.from({ length: v.answered }).map((_, i) => (
                <div key={i} className="anim-pop h-[2.6em] w-[5.5em] rounded-full bg-white/20 blur-[1px]" style={{ animationDelay: `${(i % 6) * 0.05}s` }} />
              ))}
            </div>
            <Answered n={v.answered} total={v.n} />
            <div className="opacity-70">As palavras aparecem quando o tempo acabar 🤫</div>
          </div>
        ) : (
          <div className="flex flex-1 flex-wrap content-center items-center justify-center gap-x-[1.1em] gap-y-[0.4em] px-[2em]">
            {v.cloud.length === 0 && <div className="opacity-70">Ninguém escreveu nada desta vez.</div>}
            {v.cloud.map((c: any, idx: number) => {
              const size = 1.1 + (c.count / max) * 3.2
              const colors = ['#ffb703', '#7cc7ff', '#ff8a8c', '#b9f27c', '#d8b4ff', '#ffd6a5']
              return (
                <span
                  key={c.key}
                  onClick={() => control?.('gold', { key: c.key })}
                  className="anim-pop cursor-pointer font-display font-black leading-none hover:underline"
                  style={{ fontSize: `${size}em`, color: c.gold ? '#ffd23f' : colors[idx % colors.length], animationDelay: `${idx * 0.04}s`, textShadow: c.gold ? '0 0 0.4em rgba(255,210,63,.8)' : undefined }}
                  title={`${c.count} pessoa(s)`}
                >
                  {c.gold && '⭐'}
                  {c.word}
                  {c.count > 1 && <sup className="ml-[0.1em] text-[0.35em] opacity-80">{c.count}</sup>}
                </span>
              )
            })}
          </div>
        )}
        {v.stage === 'reveal' && <div className="text-center text-[0.95em] opacity-75">Facilitador: clique numa palavra (ou use o celular de controle) para dar ⭐ Palavra de Ouro e pergunte: "quem escreveu isso? por quê?"</div>}
      </div>
    )
  },

  PlayerView({ view: v, priv, send, now, participant }) {
    const [w, setW] = useState<string[]>(['', '', ''])
    const [editing, setEditing] = useState(false)
    // cada pergunta começa com os campos vazios
    useEffect(() => {
      setW(['', '', ''])
      setEditing(false)
    }, [v.i])
    if (!participant) return <Waiting title="Assistindo esta rodada" />
    if (v.stage === 'write') {
      const sent = priv?.words && !editing
      if (sent)
        return (
          <Waiting title="Enviado! ☁️" mood="wow">
            <div className="mb-3">{priv.words.join(' · ')}</div>
            <Btn ghost onClick={() => setEditing(true)}>
              ✏️ Editar
            </Btn>
          </Waiting>
        )
      return (
        <form
          className="flex flex-1 flex-col gap-3 p-4"
          onSubmit={(e) => {
            e.preventDefault()
            send('words', { words: w })
            setEditing(false)
          }}
        >
          <div className="flex items-center justify-between">
            <span className="font-display font-black text-[var(--muted)]">Até 3 palavras · anônimo</span>
            <PhoneTimer end={v.end} now={now} />
          </div>
          <div className="card p-4 text-center font-display text-xl font-black">{v.prompt}</div>
          {[0, 1, 2].map((i) => (
            <input key={i} className="field" placeholder={`Palavra ${i + 1}`} value={w[i]} maxLength={24} onChange={(e) => setW(w.map((x, j) => (j === i ? e.target.value : x)))} autoFocus={i === 0} enterKeyHint={i < 2 ? 'next' : 'send'} />
          ))}
          <Btn className="mt-auto !text-xl" type="submit" disabled={!w.some((x) => x.trim())}>
            Enviar ☁️
          </Btn>
        </form>
      )
    }
    return (
      <div className="flex flex-1 flex-col justify-end gap-3 p-4">
        <Waiting title="Olhe a nuvem no telão ☁️" mood="wow" />
        {priv?.words ? (
          <Sheet tone={priv.gain > 0 ? 'ok' : 'info'} title={v.scored ? `+${priv.gain}` : 'Obrigado por compartilhar 🙏'}>
            Suas palavras: {priv.words.join(' · ')}
          </Sheet>
        ) : (
          <Sheet tone="info" title="Você não enviou palavras desta vez" />
        )}
      </div>
    )
  },
}
