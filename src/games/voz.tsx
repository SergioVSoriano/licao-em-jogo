import { useState } from 'react'
import type { GameDef, PlayerId } from '../engine/types'
import { TEAM_META, makeTeams, online, pick, shuffle } from '../engine/helpers'
import { Avatar } from '../ui/avatars'
import { Btn } from '../ui/kit'
import { PhoneTimer, RoundBar, TimerBox, Waiting, sec } from './common'

const PREP = sec(180)
const PITCH = sec(60)
const VOTE = sec(50)

interface S {
  teams: PlayerId[][]
  cases: number[]
  speakers: PlayerId[]
  stage: 'prep' | 'pitch' | 'vote' | 'reveal'
  t0: number
  t1: number
  idx: number
  votes: Record<PlayerId, Record<number, { f: number; p: number }>>
  avg: number[]
  xp: Record<PlayerId, number>
  over: boolean
}

function computeAvg(s: S) {
  s.avg = s.teams.map((_, t) => {
    const vs = Object.values(s.votes)
      .map((v) => v[t])
      .filter(Boolean)
    if (!vs.length) return 0
    return vs.reduce((a, v) => a + (v.f + v.p) / 2, 0) / vs.length
  })
  s.xp = {}
  s.teams.forEach((team, t) => team.forEach((pid) => (s.xp[pid] = Math.round(s.avg[t] * 200))))
  s.stage = 'reveal'
}

function Stars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" className="text-3xl leading-none" onClick={() => onChange(n)} aria-label={`${n} estrelas`}>
          {n <= value ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  )
}

export const voz: GameDef<S> = {
  id: 'voz',
  name: 'Voz Profética',
  icon: '📣',
  origin: 'Era "Pitch de 1 minuto"',
  tagline: 'Em times: 1 minuto para aplicar a lição à vida real.',
  kind: 'teams',
  needsJudge: false,
  minPlayers: 4,
  idealRange: [6, 24],
  energy: 2,
  depth: 3,
  accent: 'var(--oliveira)',
  howTo: {
    steps: [
      { icon: '🛡️', text: 'A turma vira 2 ou 3 times. Cada time recebe um caso da vida real.' },
      { icon: '🧩', text: '3 minutos de preparo: Situação hoje → O que a Palavra diz → Atitude prática.' },
      { icon: '📣', text: 'Cada time tem 1 minuto de "pitch" para apresentar.' },
      { icon: '⭐', text: 'Todos avaliam os OUTROS times: Fiel ao texto e Prático para a vida.' },
    ],
    scoring: ['Cada membro recebe a média de estrelas × 200', 'O time mais bem avaliado ganha +1 passo extra (1º lugar)'],
    phone: 'O caso e o roteiro de preparo. Depois, estrelas para os outros times.',
    tip: 'Ótimo para fechar a lição: aplicação prática com insights da turma.',
  },
  rounds: { min: 2, max: 3, label: 'times', default: (n) => (n >= 9 ? 3 : 2) },
  maxRoundsFor: (pack) => (pack.pitchCases.length >= 2 ? pack.pitchCases.length : 0),
  perRound: () => 1.25,
  setup: 3.75,

  init(ctx, rounds) {
    const k = Math.max(2, Math.min(3, rounds, Math.floor(ctx.players.length / 2)))
    const teams = makeTeams(ctx, k)
    const cases = shuffle(ctx.pack.pitchCases.map((_, i) => i), ctx.rng).slice(0, k)
    return { teams, cases, speakers: teams.map((t) => pick(t, ctx.rng)), stage: 'prep', t0: ctx.now, t1: ctx.now + PREP, idx: 0, votes: {}, avg: [], xp: {}, over: false }
  },
  input(s, msg) {
    if (msg.type !== 'vote' || s.stage !== 'vote') return s
    const mine = s.teams.findIndex((t) => t.includes(msg.pid))
    const out: Record<number, { f: number; p: number }> = {}
    for (const [k, v] of Object.entries(msg.data?.ratings ?? {})) {
      const t = Number(k)
      if (t === mine || !(t >= 0 && t < s.teams.length)) continue
      const r = v as any
      out[t] = { f: Math.max(1, Math.min(5, Number(r.f) || 3)), p: Math.max(1, Math.min(5, Number(r.p) || 3)) }
    }
    s.votes[msg.pid] = out
    return s
  },
  action(s, a, _d, ctx) {
    if (a !== 'next') return s
    if (s.stage === 'prep') {
      s.stage = 'pitch'
      s.idx = 0
      s.t0 = ctx.now
      s.t1 = ctx.now + PITCH
    } else if (s.stage === 'pitch') {
      if (s.idx + 1 < s.teams.length) {
        s.idx++
        s.t0 = ctx.now
        s.t1 = ctx.now + PITCH
      } else {
        s.stage = 'vote'
        s.t0 = ctx.now
        s.t1 = ctx.now + VOTE
      }
    } else if (s.stage === 'vote') computeAvg(s)
    else s.over = true
    return s
  },
  tick(s, ctx) {
    if (s.stage === 'prep' && ctx.now >= s.t1) {
      s.stage = 'pitch'
      s.idx = 0
      s.t0 = ctx.now
      s.t1 = ctx.now + PITCH
    }
    if (s.stage === 'vote') {
      const on = online(ctx)
      if (ctx.now >= s.t1 || (on.length && on.every((p) => s.votes[p.id]))) computeAvg(s)
    }
    return s
  },
  done: (s) => s.over,
  scores: (s) => s.xp,
  publicView(s, ctx) {
    return {
      teams: s.teams,
      cases: s.cases.map((i) => ctx.pack.pitchCases[i]),
      speakers: s.speakers,
      stage: s.stage,
      t0: s.t0,
      t1: s.t1,
      idx: s.idx,
      voted: Object.keys(s.votes).length,
      n: ctx.players.length,
      avg: s.stage === 'reveal' ? s.avg : null,
    }
  },
  privateView(s, pid) {
    return { team: s.teams.findIndex((t) => t.includes(pid)), voted: !!s.votes[pid] }
  },
  controls(s) {
    if (s.stage === 'prep') return [{ id: 'next', label: '📣 Começar os pitches', key: ' ', tone: 'primary' }]
    if (s.stage === 'pitch') return [{ id: 'next', label: s.idx + 1 < s.teams.length ? 'Próximo time ▶' : '⭐ Votação', key: ' ', tone: 'primary' }]
    if (s.stage === 'vote') return [{ id: 'next', label: 'Encerrar votação', key: ' ', tone: 'neutral' }]
    return [{ id: 'next', label: 'Ver resultado ▶', key: ' ', tone: 'primary' }]
  },
  bot(s, pid, ctx) {
    if (s.stage !== 'vote' || s.votes[pid]) return null
    const ratings: Record<number, { f: number; p: number }> = {}
    s.teams.forEach((_, t) => (ratings[t] = { f: 3 + Math.floor(ctx.rng() * 3), p: 3 + Math.floor(ctx.rng() * 3) }))
    return { type: 'vote', data: { ratings } }
  },

  HostView({ view: v, players, now }) {
    const timer = v.stage !== 'reveal' ? <TimerBox start={v.t0} end={v.t1} now={now} /> : null
    const teamCard = (t: number, big = false) => (
      <div key={t} className="flex flex-col gap-[0.4em] rounded-[1em] p-[0.8em]" style={{ background: TEAM_META[t].color, boxShadow: `0 0.25em 0 ${TEAM_META[t].shadow}`, fontSize: big ? '1.3em' : undefined }}>
        <div className="font-display text-[1.3em] font-black">
          {TEAM_META[t].emoji} Time {TEAM_META[t].name}
        </div>
        <div className="rounded-[0.7em] bg-white/90 p-[0.5em] font-semibold text-[var(--noite)]">
          {v.cases[t].text} <b className="text-[var(--purpura)]">({v.cases[t].ref})</b>
        </div>
        <div className="flex flex-wrap gap-[0.2em]">
          {v.teams[t].map((pid: string) => players[pid] && <Avatar key={pid} id={players[pid].avatar} color={players[pid].color} size="2.2em" showItem={false} />)}
        </div>
        {players[v.speakers[t]] && <div className="text-[0.9em]">🎤 Porta-voz sugerido: <b>{players[v.speakers[t]].name}</b></div>}
        {v.avg && <div className="font-display text-[2em] font-black">⭐ {v.avg[t].toFixed(1)} → +{Math.round(v.avg[t] * 200)}</div>}
      </div>
    )
    return (
      <div className="flex h-full flex-col gap-[1em]">
        <RoundBar label={v.stage === 'prep' ? '🧩 Preparo · Situação → Palavra → Atitude' : v.stage === 'pitch' ? `📣 Pitch ${v.idx + 1} de ${v.teams.length}` : v.stage === 'vote' ? `⭐ Votação · ${v.voted}/${v.n}` : '🏆 Resultado'} right={timer} />
        {v.stage === 'pitch' ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="w-[70%]">{teamCard(v.idx, true)}</div>
          </div>
        ) : (
          <div className="grid flex-1 content-center gap-[1em]" style={{ gridTemplateColumns: `repeat(${v.teams.length}, 1fr)` }}>
            {v.teams.map((_: unknown, t: number) => teamCard(t))}
          </div>
        )}
        {v.stage === 'prep' && (
          <div className="grid grid-cols-3 gap-[0.8em] text-center font-display text-[1.2em] font-black">
            <div className="rounded-[0.8em] bg-white/10 p-[0.5em]">1️⃣ Situação hoje</div>
            <div className="rounded-[0.8em] bg-white/10 p-[0.5em]">2️⃣ O que a Palavra diz</div>
            <div className="rounded-[0.8em] bg-white/10 p-[0.5em]">3️⃣ Atitude prática</div>
          </div>
        )}
      </div>
    )
  },

  PlayerView({ view: v, priv, send, me, now }) {
    const [ratings, setRatings] = useState<Record<number, { f: number; p: number }>>({})
    const myTeam = priv?.team ?? -1
    if (myTeam < 0) return <Waiting title="Assista aos pitches 📣" me={me} />
    const meta = TEAM_META[myTeam]
    if (v.stage === 'prep' || v.stage === 'pitch')
      return (
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="font-display font-black" style={{ color: meta.color }}>
              {meta.emoji} Time {meta.name}
            </span>
            <PhoneTimer end={v.t1} now={now} />
          </div>
          <div className="card p-3">
            <div className="font-display text-lg font-black">{v.cases[myTeam].text}</div>
            <div className="text-sm font-bold text-[var(--purpura)]">{v.cases[myTeam].ref}</div>
          </div>
          <div className="card p-3 text-sm">
            <b>1️⃣ Situação hoje:</b> como isso aparece na vida de um jovem?
            <br />
            <b>2️⃣ O que a Palavra diz:</b> use o versículo e a lição.
            <br />
            <b>3️⃣ Atitude prática:</b> o que fazer nesta semana?
          </div>
          {v.speakers[myTeam] === me?.id && <div className="rounded-full bg-[var(--ouro)] px-4 py-1 text-center font-display font-black text-[#2a1d00]">🎤 Você é o porta-voz sugerido</div>}
          {v.stage === 'pitch' && <div className="text-center font-display font-black">{v.idx === myTeam ? '📣 É a vez do seu time!' : 'Ouça o outro time 👂'}</div>}
        </div>
      )
    if (v.stage === 'vote') {
      if (priv?.voted) return <Waiting title="Votos enviados! ⭐" me={me} mood="wow" />
      const others = v.teams.map((_: unknown, t: number) => t).filter((t: number) => t !== myTeam)
      return (
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="font-display font-black">Avalie os outros times</span>
            <PhoneTimer end={v.t1} now={now} />
          </div>
          {others.map((t: number) => {
            const r = ratings[t] ?? { f: 0, p: 0 }
            return (
              <div key={t} className="card p-3">
                <div className="font-display font-black" style={{ color: TEAM_META[t].color }}>
                  {TEAM_META[t].emoji} Time {TEAM_META[t].name}
                </div>
                <div className="mt-1 text-sm font-semibold">Fiel ao texto</div>
                <Stars value={r.f} onChange={(n) => setRatings({ ...ratings, [t]: { ...r, f: n } })} />
                <div className="mt-1 text-sm font-semibold">Prático para a vida</div>
                <Stars value={r.p} onChange={(n) => setRatings({ ...ratings, [t]: { ...r, p: n } })} />
              </div>
            )
          })}
          <Btn className="mt-auto" disabled={others.some((t: number) => !ratings[t]?.f || !ratings[t]?.p)} onClick={() => send('vote', { ratings })}>
            Enviar votos ⭐
          </Btn>
        </div>
      )
    }
    return (
      <Waiting title={`Seu time: ⭐ ${v.avg?.[myTeam]?.toFixed(1) ?? '-'}`} me={me} mood="wow">
        +{Math.round((v.avg?.[myTeam] ?? 0) * 200)} pontos
      </Waiting>
    )
  },
}
