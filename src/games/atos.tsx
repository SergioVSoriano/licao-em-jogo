import type { Control, GameCtx, GameDef, PlayerId } from '../engine/types'
import { TEAM_META, makeTeams, shuffle, teamCount } from '../engine/helpers'
import { Avatar } from '../ui/avatars'
import { Btn } from '../ui/kit'
import { PhoneTimer, RoundBar, TimerBox, Waiting, sec } from './common'

const ACT = sec(60)

interface S {
  teams: PlayerId[][]
  turns: number
  turn: number
  stage: 'choose' | 'act' | 'steal' | 'turnEnd'
  t0: number
  t1: number
  actor: PlayerId | null
  choices: [number, number]
  chosen: number | null
  teamScore: number[]
  result: { kind: 'ok' | 'steal' | 'none'; team?: number; pts: number } | null
  used: number[]
  over: boolean
}

function startTurn(s: S, ctx: GameCtx) {
  const t = s.turn % s.teams.length
  const lap = Math.floor(s.turn / s.teams.length)
  const team = s.teams[t]
  let actor = team[lap % team.length]
  for (let j = 0; j < team.length; j++) {
    const cand = team[(lap + j) % team.length]
    if (ctx.all[cand]?.online) {
      actor = cand
      break
    }
  }
  s.actor = actor
  const all = ctx.pack.mimes.map((m, i) => ({ m, i }))
  const easy = shuffle(all.filter((x) => !x.m.hard && !s.used.includes(x.i)), ctx.rng)[0]?.i ?? 0
  const hard = shuffle(all.filter((x) => x.m.hard && !s.used.includes(x.i)), ctx.rng)[0]?.i ?? 1
  s.choices = [easy, hard]
  s.chosen = null
  s.result = null
  s.stage = 'choose'
}

function pts(s: S, ctx: any) {
  return s.chosen != null && ctx.pack.mimes[s.chosen].hard ? 200 : 100
}

export const atos: GameDef<S> = {
  id: 'atos',
  name: 'Atos Proféticos',
  icon: '🎬',
  origin: 'Era "Mímica" · profetas encenavam mensagens (Jr 27; Ez 4)',
  tagline: 'Encene a cena bíblica sem falar. Seu time adivinha!',
  kind: 'teams',
  needsJudge: true,
  minPlayers: 4,
  idealRange: [6, 30],
  truths: ['V3', 'V5', 'V6'],
  energy: 3,
  depth: 1,
  accent: 'var(--oliveira)',
  howTo: {
    steps: [
      { icon: '🛡️', text: 'A turma vira times. Em cada turno, um ATOR do time da vez vai à frente.' },
      { icon: '🃏', text: 'O ator escolhe no celular: cena fácil (100) ou difícil (200).' },
      { icon: '🤐', text: 'Ele tem 60 s para encenar SEM FALAR. O time adivinha em voz alta.' },
      { icon: '🦊', text: 'Se o tempo acabar, os outros times podem roubar com um palpite.' },
    ],
    scoring: ['Fácil: +100 para o time · Difícil: +200', 'Roubo: +100 para o time que acertar'],
    phone: 'Ator: duas cartas e depois a cena escolhida. Demais: o time da vez adivinha falando.',
    tip: 'Os profetas também usavam encenações: Jeremias andou com um jugo no pescoço!',
  },
  rounds: { min: 2, max: 8, label: 'turnos', default: (n) => 2 * teamCount(n) },
  perRound: () => 1.2,

  init(ctx, rounds) {
    const s: S = { teams: makeTeams(ctx, teamCount(ctx.players.length)), turns: rounds, turn: 0, stage: 'choose', t0: 0, t1: 0, actor: null, choices: [0, 1], chosen: null, teamScore: [], result: null, used: [], over: false }
    s.teamScore = s.teams.map(() => 0)
    startTurn(s, ctx)
    return s
  },
  input(s, msg, ctx) {
    if (msg.pid !== s.actor) return s
    if (msg.type === 'choose' && s.stage === 'choose') {
      const k = Number(msg.data?.k)
      if (k !== 0 && k !== 1) return s
      s.chosen = s.choices[k]
      s.used.push(s.chosen)
      s.stage = 'act'
      s.t0 = ctx.now
      s.t1 = ctx.now + ACT
    }
    if (msg.type === 'ok' && s.stage === 'act') {
      const p = pts(s, ctx)
      s.teamScore[s.turn % s.teams.length] += p
      s.result = { kind: 'ok', team: s.turn % s.teams.length, pts: p }
      s.stage = 'turnEnd'
    }
    return s
  },
  action(s, a, data, ctx) {
    const t = s.turn % s.teams.length
    if (s.stage === 'choose' && a === 'next') {
      s.chosen = s.choices[0]
      s.used.push(s.chosen)
      s.stage = 'act'
      s.t0 = ctx.now
      s.t1 = ctx.now + ACT
    } else if (s.stage === 'act') {
      if (a === 'ok') {
        const p = pts(s, ctx)
        s.teamScore[t] += p
        s.result = { kind: 'ok', team: t, pts: p }
        s.stage = 'turnEnd'
      }
      if (a === 'fail') s.stage = 'steal'
    } else if (s.stage === 'steal') {
      if (a === 'steal' && typeof data?.team === 'number') {
        s.teamScore[data.team] += 100
        s.result = { kind: 'steal', team: data.team, pts: 100 }
        s.stage = 'turnEnd'
      }
      if (a === 'none') {
        s.result = { kind: 'none', pts: 0 }
        s.stage = 'turnEnd'
      }
    } else if (s.stage === 'turnEnd' && a === 'next') {
      if (s.turn + 1 < s.turns) {
        s.turn++
        startTurn(s, ctx)
      } else s.over = true
    }
    return s
  },
  tick(s, ctx) {
    if (s.stage === 'act' && ctx.now >= s.t1) s.stage = 'steal'
    return s
  },
  done: (s) => s.over,
  scores(s) {
    const out: Record<string, number> = {}
    s.teams.forEach((team, t) => team.forEach((pid) => (out[pid] = s.teamScore[t])))
    return out
  },
  publicView(s, ctx) {
    return {
      teams: s.teams,
      teamScore: s.teamScore,
      turn: s.turn,
      turns: s.turns,
      team: s.turn % s.teams.length,
      stage: s.stage,
      t0: s.t0,
      t1: s.t1,
      actor: s.actor,
      hard: s.chosen != null ? ctx.pack.mimes[s.chosen].hard : null,
      answer: s.stage === 'turnEnd' && s.chosen != null ? ctx.pack.mimes[s.chosen].text : null,
      result: s.result,
    }
  },
  privateView(s, pid, ctx) {
    if (pid !== s.actor) return {}
    return { choices: s.choices.map((i) => ctx.pack.mimes[i]), mime: s.chosen != null ? ctx.pack.mimes[s.chosen] : null }
  },
  controls(s) {
    if (s.stage === 'choose') return [{ id: 'next', label: 'Escolher fácil por ele', tone: 'neutral' }]
    if (s.stage === 'act')
      return [
        { id: 'ok', label: '✓ Acertaram', key: '1', tone: 'ok' },
        { id: 'fail', label: '⏰ Ninguém acertou', key: '2', tone: 'bad' },
      ]
    if (s.stage === 'steal') {
      const t = s.turn % s.teams.length
      const c: Control[] = s.teams.map((_, i) => i).filter((i) => i !== t).map((i) => ({ id: 'steal', label: `${TEAM_META[i].emoji} ${TEAM_META[i].name} roubou`, data: { team: i }, tone: 'gold' as const, key: String(i + 1) }))
      return [...c, { id: 'none', label: 'Ninguém', key: '0', tone: 'neutral' }]
    }
    return [{ id: 'next', label: s.turn + 1 >= s.turns ? 'Ver resultado ▶' : 'Próximo ator 🎬', key: ' ', tone: 'primary' }]
  },
  bot(s, pid, ctx) {
    if (pid !== s.actor) return null
    if (s.stage === 'choose' && ctx.rng() < 0.3) return { type: 'choose', data: { k: ctx.rng() < 0.6 ? 0 : 1 } }
    if (s.stage === 'act' && ctx.now - s.t0 > 6000 && ctx.rng() < 0.08) return { type: 'ok' }
    return null
  },

  HostView({ view: v, players, now }) {
    const actor = v.actor ? players[v.actor] : undefined
    const meta = TEAM_META[v.team]
    return (
      <div className="flex h-full flex-col gap-[1em]">
        <RoundBar label={`Turno ${v.turn + 1} de ${v.turns} · vez do time ${meta.name}`} right={v.stage === 'act' ? <TimerBox start={v.t0} end={v.t1} now={now} /> : null} />
        <div className="grid gap-[0.8em]" style={{ gridTemplateColumns: `repeat(${v.teams.length}, 1fr)` }}>
          {v.teams.map((team: string[], t: number) => (
            <div key={t} className="rounded-[1em] p-[0.6em]" style={{ background: TEAM_META[t].color, boxShadow: `0 0.25em 0 ${TEAM_META[t].shadow}`, outline: t === v.team ? '0.2em solid #fff' : undefined }}>
              <div className="flex items-center justify-between font-display font-black">
                <span className="text-[1.3em]">
                  {TEAM_META[t].emoji} {TEAM_META[t].name}
                </span>
                <span className="tabular text-[2em]">{v.teamScore[t]}</span>
              </div>
              <div className="mt-[0.2em] flex flex-wrap gap-[0.2em]">
                {team.map((pid) => players[pid] && <Avatar key={pid} id={players[pid].avatar} color={players[pid].color} size="2em" showItem={false} />)}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-[0.8em] text-center">
          {actor && <Avatar id={actor.avatar} color={actor.color} size="9em" mood={v.stage === 'act' ? 'wow' : 'happy'} />}
          {v.stage === 'choose' && <div className="font-display text-[2em] font-black">🎬 {actor?.name} está escolhendo a cena…</div>}
          {v.stage === 'act' && (
            <>
              <div className="font-display text-[2.4em] font-black">🤐 {actor?.name} encena SEM FALAR!</div>
              <div className="text-[1.4em]">
                Time {meta.name}, adivinhe em voz alta · cena {v.hard ? 'difícil (200)' : 'fácil (100)'}
              </div>
            </>
          )}
          {v.stage === 'steal' && <div className="font-display text-[2.4em] font-black">🦊 Tempo! Outros times podem roubar com UM palpite</div>}
          {v.stage === 'turnEnd' && (
            <div className="anim-pop flex flex-col items-center gap-[0.4em]">
              <div className="rounded-[0.8em] bg-white px-[1em] py-[0.4em] font-display text-[2.2em] font-black text-[var(--noite)]">🎬 {v.answer}</div>
              <div className="font-display text-[1.5em] font-black">
                {v.result?.kind === 'ok' ? `✓ Time ${TEAM_META[v.result.team].name} +${v.result.pts}` : v.result?.kind === 'steal' ? `🦊 Time ${TEAM_META[v.result.team].name} roubou! +100` : 'Ninguém acertou'}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  },

  PlayerView({ view: v, priv, send, me, now }) {
    const meId = me?.id
    const myTeam = v.teams.findIndex((t: string[]) => t.includes(meId ?? ''))
    if (meId === v.actor) {
      if (v.stage === 'choose')
        return (
          <div className="flex flex-1 flex-col gap-3 p-4">
            <div className="text-center font-display text-2xl font-black">🎬 Você é o ator! Escolha a cena:</div>
            {priv?.choices?.map((m: any, k: number) => (
              <Btn key={k} tone={m.hard ? 'purple' : 'blue'} className="!flex-col !py-6" onClick={() => send('choose', { k })}>
                <span className="text-sm opacity-85">{m.hard ? 'DIFÍCIL · 200' : 'FÁCIL · 100'}</span>
                <span className="text-xl">{m.text}</span>
              </Btn>
            ))}
          </div>
        )
      if (v.stage === 'act')
        return (
          <div className="flex flex-1 flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <span className="font-display font-black">🤐 Encene sem falar!</span>
              <PhoneTimer end={v.t1} now={now} />
            </div>
            <div className="card flex flex-1 items-center justify-center p-4 text-center font-display text-3xl font-black">{priv?.mime?.text}</div>
            <Btn className="!py-5 !text-2xl" onClick={() => send('ok')}>
              ✓ Acertaram!
            </Btn>
          </div>
        )
      return <Waiting title="Bravo! 👏" me={me} mood="wow" />
    }
    const meta = myTeam >= 0 ? TEAM_META[myTeam] : null
    const guessing = v.stage === 'act' && myTeam === v.team
    return (
      <Waiting title={guessing ? 'Adivinhe em voz alta! 🗣️' : v.stage === 'steal' && myTeam !== v.team ? 'Roube! Um palpite em voz alta 🦊' : v.stage === 'turnEnd' ? `Era: ${v.answer}` : 'Assista à encenação 🎬'} me={me} mood={guessing ? 'wow' : 'happy'}>
        {meta && (
          <span>
            Seu time: <b>{meta.emoji} {meta.name}</b> · {v.teamScore[myTeam]} pts
          </span>
        )}
      </Waiting>
    )
  },
}
