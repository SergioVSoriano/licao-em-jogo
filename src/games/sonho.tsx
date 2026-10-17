import type { GameDef, PlayerId } from '../engine/types'
import { addXp, draft, online, shuffle } from '../engine/helpers'
import { Avatar } from '../ui/avatars'
import { Btn, Pill } from '../ui/kit'
import { PhoneTimer, RoundBar, TimerBox, Waiting, sec } from './common'

const NIGHT = sec(90)
const INTERP = sec(45)
const DISCERN = sec(20)

type Role = 'anjo' | 'falso' | 'mago'
export const ROLE_META: Record<Role, { name: string; emoji: string; color: string; goal: string }> = {
  anjo: { name: 'Anjo', emoji: '😇', color: 'var(--azul)', goal: 'Ajude o Rei a acertar! Dê pistas verdadeiras.' },
  falso: { name: 'Falso Profeta', emoji: '🎭', color: 'var(--carmesim)', goal: 'Atrapalhe! Dê pistas que parecem boas, mas enganam.' },
  mago: { name: 'Mago da Corte', emoji: '🔮', color: 'var(--purpura)', goal: 'Equilíbrio: você ganha se acertos e erros ficarem empatados.' },
}

interface S {
  rounds: number
  r: number
  stage: 'roles' | 'night' | 'interp' | 'discern' | 'score'
  t0: number
  t1: number
  king: PlayerId | null
  kings: PlayerId[]
  council: PlayerId[]
  roles: Record<PlayerId, Role>
  deck: number[]
  w: number
  results: { word: string; ok: boolean }[]
  interpOk: boolean | null
  pick: PlayerId | null
  xp: Record<PlayerId, number>
  gain: Record<PlayerId, number>
  over: boolean
}

function newRound(s: S, ctx: any) {
  const king = draft(ctx, s.kings)
  if (!king) {
    s.over = true
    return
  }
  s.king = king
  s.kings.push(king)
  const others = shuffle(online(ctx).filter((p) => p.id !== king).map((p) => p.id), ctx.rng).slice(0, 10)
  s.council = others
  const n = others.length
  const nf = Math.max(1, Math.round(n * 0.3))
  const nm = n >= 5 ? Math.max(1, Math.round(n * 0.2)) : 0
  const roles: Role[] = [...Array(nf).fill('falso'), ...Array(nm).fill('mago')]
  while (roles.length < n) roles.push('anjo')
  const sh = shuffle(roles, ctx.rng)
  s.roles = Object.fromEntries(others.map((p, i) => [p, sh[i]]))
  s.results = []
  s.interpOk = null
  s.pick = null
  s.gain = {}
  s.stage = 'roles'
  s.t0 = ctx.now
  s.t1 = 0
}

function word(s: S, ctx: any) {
  return ctx.pack.dreamWords[s.deck[s.w % s.deck.length]]
}

function mark(s: S, ok: boolean, ctx: any) {
  s.results.push({ word: word(s, ctx), ok })
  s.w++
}

function score(s: S) {
  const ok = s.results.filter((r) => r.ok).length
  const bad = s.results.length - ok
  const diff = Math.abs(ok - bad)
  s.gain = {}
  const give = (pid: PlayerId, n: number) => {
    s.gain[pid] = (s.gain[pid] ?? 0) + n * 100
    addXp(s.xp, pid, n * 100)
  }
  for (const [pid, role] of Object.entries(s.roles)) {
    if (role === 'anjo') give(pid, ok)
    if (role === 'falso') give(pid, bad)
    if (role === 'mago') give(pid, diff === 0 ? ok + 2 : diff === 1 ? Math.max(ok, bad) : Math.min(ok, bad))
  }
  if (s.king) {
    let k = ok
    if (s.interpOk) k += 2
    if (s.pick && s.roles[s.pick] === 'falso') k += 2
    give(s.king, k)
  }
  s.stage = 'score'
}

export const sonho: GameDef<S> = {
  id: 'sonho',
  name: 'O Sonho do Rei',
  icon: '👑',
  origin: 'Era "When I Dream" · Daniel 2',
  tagline: 'O Rei sonha de olhos fechados. Anjos ajudam, falsos profetas enganam.',
  kind: 'spotlight',
  needsJudge: true,
  minPlayers: 4,
  idealRange: [5, 12],
  energy: 3,
  depth: 3,
  accent: 'var(--purpura)',
  howTo: {
    steps: [
      { icon: '👑', text: 'Uma pessoa é o REI: fica de costas para o telão e de olhos fechados.' },
      { icon: '🤫', text: 'Os outros recebem um papel secreto no celular: Anjo, Falso Profeta ou Mago da Corte.' },
      { icon: '🗣️', text: 'Todos veem a palavra. Cada um, na vez, diz UMA palavra de pista. O Rei tenta adivinhar.' },
      { icon: '📖', text: 'No fim, o Rei conta o "sonho" ligando as palavras que acertou e tenta apontar um falso profeta.' },
    ],
    scoring: [
      'Anjos: +100 por acerto do Rei · Falsos Profetas: +100 por erro',
      'Magos: ganham mais se acertos e erros empatarem',
      'Rei: +100 por acerto, +200 se contar o sonho com todas as palavras e +200 se descobrir um falso profeta',
    ],
    phone: 'Seu papel secreto e a palavra atual. O Rei vê só "olhos fechados" e depois escolhe o suspeito.',
    tip: 'Nada de ler o celular do vizinho! 😄 O facilitador marca ✓/✗ a cada palpite do Rei.',
  },
  rounds: { min: 1, max: 4, label: 'reis', default: () => 2 },
  // as palavras giram em ciclo: com 6 ou mais, qualquer número de reis funciona
  maxRoundsFor: (pack) => (pack.dreamWords.length >= 6 ? 99 : 0),
  perRound: () => 2.5,
  setup: 0.5,

  init(ctx, rounds) {
    const s: S = { rounds, r: 0, stage: 'roles', t0: 0, t1: 0, king: null, kings: [], council: [], roles: {}, deck: shuffle(ctx.pack.dreamWords.map((_, i) => i), ctx.rng), w: 0, results: [], interpOk: null, pick: null, xp: {}, gain: {}, over: false }
    newRound(s, ctx)
    return s
  },
  input(s, msg, ctx) {
    if (msg.type === 'pick' && s.stage === 'discern' && msg.pid === s.king && s.council.includes(msg.data?.pid)) {
      s.pick = msg.data.pid
      score(s)
    }
    if (msg.type === 'ready' && s.stage === 'roles' && msg.pid === s.king) {
      s.stage = 'night'
      s.t0 = ctx.now
      s.t1 = ctx.now + NIGHT
    }
    return s
  },
  action(s, a, _d, ctx) {
    if (s.stage === 'roles' && a === 'next') {
      s.stage = 'night'
      s.t0 = ctx.now
      s.t1 = ctx.now + NIGHT
    } else if (s.stage === 'night') {
      if (a === 'ok') mark(s, true, ctx)
      if (a === 'fail') mark(s, false, ctx)
      if (a === 'next') {
        s.stage = 'interp'
        s.t0 = ctx.now
        s.t1 = ctx.now + INTERP
      }
    } else if (s.stage === 'interp' && (a === 'ok' || a === 'fail')) {
      s.interpOk = a === 'ok'
      s.stage = 'discern'
      s.t0 = ctx.now
      s.t1 = ctx.now + DISCERN
    } else if (s.stage === 'discern' && a === 'next') score(s)
    else if (s.stage === 'score' && a === 'next') {
      if (s.r + 1 < s.rounds) {
        s.r++
        newRound(s, ctx)
      } else s.over = true
    }
    return s
  },
  tick(s, ctx) {
    if (s.stage === 'night' && ctx.now >= s.t1) {
      s.stage = 'interp'
      s.t0 = ctx.now
      s.t1 = ctx.now + INTERP
    }
    if (s.stage === 'discern' && ctx.now >= s.t1) score(s)
    return s
  },
  done: (s) => s.over,
  scores: (s) => s.xp,
  publicView(s, ctx) {
    const ok = s.results.filter((r) => r.ok).length
    return {
      r: s.r,
      rounds: s.rounds,
      stage: s.stage,
      t0: s.t0,
      t1: s.t1,
      king: s.king,
      council: s.council,
      word: s.stage === 'night' ? word(s, ctx) : null,
      count: s.results.length,
      ok,
      results: s.stage === 'score' ? s.results : null,
      interpOk: s.interpOk,
      pick: s.pick,
      roles: s.stage === 'score' ? s.roles : null,
      gain: s.stage === 'score' ? s.gain : null,
    }
  },
  privateView(s, pid, ctx) {
    return { role: s.roles[pid] ?? null, word: s.stage === 'night' && pid !== s.king ? word(s, ctx) : null, gain: s.gain[pid] ?? 0 }
  },
  controls(s) {
    if (s.stage === 'roles') return [{ id: 'next', label: '🌙 Começar a noite', key: ' ', tone: 'primary' }]
    if (s.stage === 'night')
      return [
        { id: 'ok', label: '✓ Rei acertou', key: '1', tone: 'ok' },
        { id: 'fail', label: '✗ Errou / pular', key: '2', tone: 'bad' },
        { id: 'next', label: '☀️ Amanhecer', tone: 'neutral' },
      ]
    if (s.stage === 'interp')
      return [
        { id: 'ok', label: '✓ Contou o sonho completo', key: '1', tone: 'ok' },
        { id: 'fail', label: '✗ Esqueceu alguma', key: '2', tone: 'bad' },
      ]
    if (s.stage === 'discern') return [{ id: 'next', label: 'Pular escolha', tone: 'neutral' }]
    return [{ id: 'next', label: s.r + 1 >= s.rounds ? 'Ver resultado ▶' : 'Próximo Rei 👑', key: ' ', tone: 'primary' }]
  },
  bot(s, pid, ctx) {
    if (s.stage === 'roles' && pid === s.king && ctx.rng() < 0.2) return { type: 'ready' }
    if (s.stage === 'discern' && pid === s.king && ctx.rng() < 0.3) return { type: 'pick', data: { pid: s.council[Math.floor(ctx.rng() * s.council.length)] } }
    return null
  },

  HostView({ view: v, players, now }) {
    const king = v.king ? players[v.king] : undefined
    return (
      <div className="flex h-full flex-col gap-[1em]">
        <RoundBar label={`Rei ${v.r + 1} de ${v.rounds}`} right={['night', 'interp', 'discern'].includes(v.stage) ? <TimerBox start={v.t0} end={v.t1} now={now} /> : null} />
        {v.stage === 'roles' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-[1em] text-center">
            {king && <Avatar id={king.avatar} color={king.color} size="10em" mood="sleep" />}
            <div className="font-display text-[2.6em] font-black">👑 {king?.name} é o Rei!</div>
            <div className="text-[1.5em]">Vire de COSTAS para o telão e feche os olhos 😴</div>
            <div className="text-[1.2em] opacity-80">Conselheiros: olhem o papel secreto no celular (sem mostrar a ninguém!)</div>
          </div>
        )}
        {v.stage === 'night' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-[1em] text-center">
            <div className="text-[1.3em] opacity-80">🌙 Noite · Rei de olhos fechados · cada um diz UMA palavra de pista</div>
            <div className="anim-pop rounded-[0.6em] bg-white px-[1.2em] py-[0.4em] font-display text-[5em] font-black text-[var(--noite)]" key={v.word}>
              {v.word}
            </div>
            <div className="font-display text-[1.5em] font-black">
              ✓ {v.ok} · ✗ {v.count - v.ok}
            </div>
          </div>
        )}
        {v.stage === 'interp' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-[1em] text-center">
            <div className="font-display text-[2.6em] font-black">☀️ Amanheceu! Rei, pode abrir os olhos.</div>
            <div className="text-[1.6em]">
              📖 <b>Interpretação:</b> conte o sonho ligando as <b>{v.ok}</b> palavras que você acertou!
            </div>
            <div className="text-[1.1em] opacity-75">Como Daniel diante do rei (Dn 2): quem lembra de tudo ganha +200</div>
          </div>
        )}
        {v.stage === 'discern' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-[1em] text-center">
            <div className="font-display text-[2.4em] font-black">🔍 Discernimento</div>
            <div className="text-[1.5em]">{king?.name}, quem você acha que era um Falso Profeta? Escolha no celular.</div>
            <div className="text-[1.1em] opacity-75">"Discirna antes de acreditar" (tema de terça)</div>
          </div>
        )}
        {v.stage === 'score' && (
          <div className="flex flex-1 flex-col gap-[0.8em]">
            <div className="flex flex-wrap justify-center gap-[0.4em]">
              {v.results.map((r: any, i: number) => (
                <span key={i} className="rounded-full px-[0.8em] py-[0.1em] font-display font-black" style={{ background: r.ok ? 'var(--oliveira)' : 'var(--carmesim)' }}>
                  {r.ok ? '✓' : '✗'} {r.word}
                </span>
              ))}
            </div>
            <div className="text-center font-display text-[1.3em] font-black">
              {v.interpOk ? '📖 Sonho contado por completo (+200)' : '📖 Faltou alguma palavra'} · {v.pick ? (v.roles[v.pick] === 'falso' ? `🔍 Acertou: ${players[v.pick]?.name} era Falso Profeta! (+200)` : `🔍 ${players[v.pick]?.name} não era falso…`) : '🔍 Não apontou ninguém'}
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-6 content-start gap-[0.6em]">
              {[v.king, ...v.council].map((pid: string) => {
                const p = players[pid]
                if (!p) return null
                const role = pid === v.king ? null : (v.roles[pid] as Role)
                const meta = role ? ROLE_META[role] : { name: 'Rei', emoji: '👑', color: 'var(--ouro)' }
                return (
                  <div key={pid} className="anim-pop flex flex-col items-center rounded-[1em] p-[0.4em]" style={{ background: meta.color }}>
                    <Avatar id={p.avatar} color={p.color} size="3.2em" showItem={false} />
                    <div className="w-full truncate text-center font-display font-black">{p.name}</div>
                    <div className="text-[0.85em]">
                      {meta.emoji} {meta.name}
                    </div>
                    <div className="font-display font-black">+{v.gain[pid] ?? 0}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  },

  PlayerView({ view: v, priv, send, me, now, players }) {
    const meId = me?.id
    if (meId === v.king) {
      if (v.stage === 'roles')
        return (
          <Waiting title="Você é o REI 👑" me={me} mood="wow">
            <div className="mb-3">Vire de costas para o telão e feche os olhos. Os conselheiros vão te dar pistas!</div>
            <Btn onClick={() => send('ready')}>😴 Estou de olhos fechados</Btn>
          </Waiting>
        )
      if (v.stage === 'night') return <Waiting title="Olhos fechados! 😴" me={me} mood="sleep">Ouça as pistas e diga seu palpite em voz alta.</Waiting>
      if (v.stage === 'interp') return <Waiting title="Conte o seu sonho! 📖" me={me} mood="wow">Ligue as {v.ok} palavras que você acertou numa história.</Waiting>
      if (v.stage === 'discern')
        return (
          <div className="flex flex-1 flex-col gap-3 p-4">
            <div className="text-center font-display text-xl font-black">🔍 Quem era Falso Profeta?</div>
            <PhoneTimer end={v.t1} now={now} />
            <div className="grid grid-cols-2 gap-2">
              {v.council.map((pid: string) =>
                players[pid] ? (
                  <Btn key={pid} ghost onClick={() => send('pick', { pid })} className="!flex-col !py-2">
                    <Avatar id={players[pid].avatar} color={players[pid].color} size={48} showItem={false} />
                    {players[pid].name}
                  </Btn>
                ) : null,
              )}
            </div>
          </div>
        )
    }
    const role = priv?.role as Role | null
    if (!role) {
      if (v.stage === 'score') return <Waiting title="Veja os papéis no telão!" me={me} />
      return <Waiting title="Plateia do sonho 🌙" me={me}>Nesta rodada você assiste. Sem soprar a palavra!</Waiting>
    }
    const meta = ROLE_META[role]
    if (v.stage === 'score') return <Waiting title={`Você era ${meta.emoji} ${meta.name}`} me={me} mood="wow">+{priv?.gain ?? 0} pontos</Waiting>
    return (
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="rounded-3xl p-4 text-center text-white" style={{ background: meta.color }}>
          <div className="text-xs font-bold tracking-widest uppercase opacity-80">Seu papel secreto</div>
          <div className="font-display text-3xl font-black">
            {meta.emoji} {meta.name}
          </div>
          <div className="mt-1 font-semibold">{meta.goal}</div>
        </div>
        {v.stage === 'night' && priv?.word ? (
          <div className="card flex flex-1 flex-col items-center justify-center p-4 text-center">
            <div className="text-sm text-[var(--muted)]">Palavra do sonho</div>
            <div className="font-display text-4xl font-black">{priv.word}</div>
            <div className="mt-2">
              <Pill>Diga UMA palavra de pista na sua vez</Pill>
            </div>
          </div>
        ) : (
          <Waiting title={v.stage === 'roles' ? 'Não mostre seu papel a ninguém 🤫' : v.stage === 'interp' ? 'O Rei está contando o sonho…' : 'O Rei está escolhendo…'} />
        )}
      </div>
    )
  },
}
