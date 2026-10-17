import { useState } from 'react'
import type { GameDef, PlayerId } from '../engine/types'
import { TEAM_META, addXp, makeTeams, shuffle, teamCount } from '../engine/helpers'
import { Avatar } from '../ui/avatars'
import { Btn } from '../ui/kit'
import { PhoneTimer, RoundBar, TimerBox, Waiting, sec } from './common'

const TURN = sec(60)

interface S {
  mode: 'team' | 'solo'
  teams: PlayerId[][]
  turns: number
  turn: number
  stage: 'ready' | 'play' | 'turnEnd'
  t0: number
  t1: number
  explainer: PlayerId | null
  fiscal: PlayerId | null
  deck: number[]
  card: number
  skips: number
  teamScore: number[]
  personal: Record<PlayerId, number>
  log: { word: string; res: 'ok' | 'buzz' | 'skip'; by?: PlayerId }[]
  over: boolean
}

function memberAt(team: PlayerId[], k: number, ctx: any): PlayerId | null {
  for (let j = 0; j < team.length; j++) {
    const pid = team[(k + j) % team.length]
    if (ctx.all[pid]?.online) return pid
  }
  return team[0] ?? null
}

function startTurn(s: S, ctx: any) {
  const n = s.teams.length
  const t = s.turn % n
  const lap = Math.floor(s.turn / n)
  s.explainer = memberAt(s.teams[t], lap, ctx)
  s.fiscal = n > 1 ? memberAt(s.teams[(t + 1) % n], lap, ctx) : null
  s.stage = 'ready'
  s.skips = 1
  s.log = []
}

function nextCard(s: S, res: 'ok' | 'buzz' | 'skip', ctx: any, by?: PlayerId) {
  const c = ctx.pack.taboo[s.deck[s.card % s.deck.length]]
  s.log.push({ word: c.word, res, by })
  s.card++
}

export const fruto: GameDef<S> = {
  id: 'fruto',
  name: 'Fruto Proibido',
  icon: '🍎',
  origin: 'Era "Jogo Não Pode" (Taboo)',
  tagline: 'Explique a palavra sem falar as proibidas!',
  kind: 'teams',
  needsJudge: false,
  minPlayers: 3,
  idealRange: [6, 30],
  truths: ['V2', 'V3', 'V4', 'V5'],
  energy: 3,
  depth: 2,
  accent: 'var(--carmesim)',
  howTo: {
    steps: [
      { icon: '🛡️', text: 'A turma vira 2 ou 3 times (com menos de 6 pessoas, cada um joga por si).' },
      { icon: '🤫', text: 'Quem explica vê a palavra e 5 palavras PROIBIDAS só no próprio celular.' },
      { icon: '🗣️', text: 'Explique para o seu time em 60 s. Acertaram? Toque ✓ e vem a próxima.' },
      { icon: '🚨', text: 'Um fiscal do outro time vê a mesma carta e aperta BUZZ se você falar uma proibida.' },
    ],
    scoring: ['Acerto: +100 para o time', 'Buzz: −50 para o time da vez e +50 para o fiscal', '1 pulo grátis por turno'],
    phone: 'Quem explica: carta + ✓ Acertaram + Pular. Fiscal: carta + 🚨 BUZZ. Time: adivinha em voz alta.',
  },
  rounds: { min: 2, max: 8, label: 'turnos', default: (n) => (n >= 6 ? 2 * teamCount(n) : Math.max(2, Math.min(n, 4))) },
  perRound: () => 1.25,

  init(ctx, rounds) {
    const n = ctx.players.length
    const mode = n >= 6 ? 'team' : 'solo'
    const teams = mode === 'team' ? makeTeams(ctx, teamCount(n)) : shuffle(ctx.players.map((p) => [p.id]), ctx.rng)
    const s: S = { mode, teams, turns: rounds, turn: 0, stage: 'ready', t0: 0, t1: 0, explainer: null, fiscal: null, deck: shuffle(ctx.pack.taboo.map((_, i) => i), ctx.rng), card: 0, skips: 1, teamScore: teams.map(() => 0), personal: {}, log: [], over: false }
    startTurn(s, ctx)
    return s
  },
  input(s, msg, ctx) {
    const { pid, type, data } = msg
    if (s.stage === 'ready' && pid === s.explainer && type === 'start') {
      s.stage = 'play'
      s.t0 = ctx.now
      s.t1 = ctx.now + TURN
      return s
    }
    if (s.stage !== 'play') return s
    const t = s.turn % s.teams.length
    if (pid === s.explainer && type === 'ok') {
      if (s.mode === 'team') s.teamScore[t] += 100
      else {
        if (data?.by && data.by !== pid) addXp(s.personal, data.by, 100)
        addXp(s.personal, pid, 50)
      }
      nextCard(s, 'ok', ctx, data?.by)
    }
    if (pid === s.explainer && type === 'skip' && s.skips > 0) {
      s.skips--
      nextCard(s, 'skip', ctx)
    }
    if (pid === s.fiscal && type === 'buzz') {
      if (s.mode === 'team') s.teamScore[t] -= 50
      else addXp(s.personal, s.explainer!, -50)
      addXp(s.personal, pid, 50)
      nextCard(s, 'buzz', ctx)
    }
    return s
  },
  action(s, a, _d, ctx) {
    const t = s.turn % s.teams.length
    if (a === 'next') {
      if (s.stage === 'ready') {
        s.stage = 'play'
        s.t0 = ctx.now
        s.t1 = ctx.now + TURN
      } else if (s.stage === 'play') s.stage = 'turnEnd'
      else if (s.turn + 1 < s.turns) {
        s.turn++
        startTurn(s, ctx)
      } else s.over = true
    }
    if (s.stage !== 'play') return s
    if (a === 'ok') {
      if (s.mode === 'team') s.teamScore[t] += 100
      else addXp(s.personal, s.explainer!, 50)
      nextCard(s, 'ok', ctx)
    }
    if (a === 'buzz') {
      if (s.mode === 'team') s.teamScore[t] -= 50
      else addXp(s.personal, s.explainer!, -50)
      if (s.fiscal) addXp(s.personal, s.fiscal, 50)
      nextCard(s, 'buzz', ctx)
    }
    if (a === 'skip') nextCard(s, 'skip', ctx)
    return s
  },
  tick(s, ctx) {
    if (s.stage === 'play' && ctx.now >= s.t1) s.stage = 'turnEnd'
    return s
  },
  done: (s) => s.over,
  scores(s) {
    const out: Record<string, number> = { ...s.personal }
    if (s.mode === 'team') s.teams.forEach((team, t) => team.forEach((pid) => (out[pid] = (out[pid] ?? 0) + s.teamScore[t])))
    return out
  },
  publicView(s) {
    return {
      mode: s.mode,
      teams: s.teams,
      teamScore: s.teamScore,
      stage: s.stage,
      t0: s.t0,
      t1: s.t1,
      explainer: s.explainer,
      fiscal: s.fiscal,
      turn: s.turn,
      turns: s.turns,
      team: s.turn % s.teams.length,
      log: s.log,
      personal: s.personal,
    }
  },
  privateView(s, pid, ctx) {
    const c = ctx.pack.taboo[s.deck[s.card % s.deck.length]]
    const sees = s.stage === 'play' && (pid === s.explainer || pid === s.fiscal)
    return { card: sees ? c : null, skips: s.skips }
  },
  controls(s) {
    if (s.stage === 'ready') return [{ id: 'next', label: '▶ Começar turno', key: ' ', tone: 'primary' }]
    if (s.stage === 'play')
      return [
        { id: 'ok', label: '✓ Acertaram', key: '1', tone: 'ok' },
        { id: 'buzz', label: '🚨 Buzz', key: '2', tone: 'bad' },
        { id: 'skip', label: '⏭ Pular carta', key: '3', tone: 'neutral' },
        { id: 'next', label: 'Encerrar turno', tone: 'neutral' },
      ]
    return [{ id: 'next', label: s.turn + 1 >= s.turns ? 'Ver resultado ▶' : 'Próximo turno ▶', key: ' ', tone: 'primary' }]
  },
  bot(s, pid, ctx) {
    if (s.stage === 'ready' && pid === s.explainer && ctx.rng() < 0.3) return { type: 'start' }
    if (s.stage === 'play' && pid === s.explainer && ctx.rng() < 0.25) {
      const others = ctx.players.filter((p) => p.id !== pid)
      return ctx.rng() < 0.85 ? { type: 'ok', data: { by: s.mode === 'solo' && others.length ? others[Math.floor(ctx.rng() * others.length)].id : undefined } } : { type: 'skip' }
    }
    if (s.stage === 'play' && pid === s.fiscal && ctx.rng() < 0.03) return { type: 'buzz' }
    return null
  },

  HostView({ view: v, players, now }) {
    const ex = v.explainer ? players[v.explainer] : undefined
    const fi = v.fiscal ? players[v.fiscal] : undefined
    const meta = v.mode === 'team' ? TEAM_META[v.team] : null
    const okCount = v.log.filter((l: any) => l.res === 'ok').length
    return (
      <div className="flex h-full flex-col gap-[1em]">
        <RoundBar label={`Turno ${v.turn + 1} de ${v.turns}${meta ? ` · vez do time ${meta.name}` : ''}`} right={v.stage === 'play' ? <TimerBox start={v.t0} end={v.t1} now={now} /> : null} />
        {v.mode === 'team' && (
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
        )}
        <div className="flex flex-1 items-center justify-center gap-[3em]">
          {ex && (
            <div className="flex flex-col items-center">
              <Avatar id={ex.avatar} color={ex.color} size="9em" mood={v.stage === 'play' ? 'wow' : 'happy'} />
              <div className="rounded-full bg-[var(--ouro)] px-[0.8em] font-display text-[1.4em] font-black text-[#2a1d00]">🗣️ {ex.name} explica</div>
            </div>
          )}
          <div className="flex flex-col items-center gap-[0.6em]">
            {v.stage === 'ready' && <div className="text-center font-display text-[2em] font-black">{ex?.name}, toque em "Começar" no celular!</div>}
            {v.stage === 'play' && (
              <>
                <div className="rounded-[1em] bg-white px-[1.4em] py-[0.8em] font-display text-[2.4em] font-black text-[var(--noite)]">🤫 Carta secreta</div>
                <div className="font-display text-[1.6em] font-black">✓ {okCount} acertos</div>
              </>
            )}
            {v.stage === 'turnEnd' && <div className="font-display text-[2.2em] font-black">⏰ Fim do turno! {okCount} acertos</div>}
            {fi && <div className="rounded-full bg-[var(--carmesim)] px-[0.8em] py-[0.1em] font-display font-black">🚨 Fiscal: {fi.name}</div>}
          </div>
        </div>
        <div className="flex min-h-[2.4em] flex-wrap justify-center gap-[0.5em]">
          {v.log.map((l: any, i: number) => (
            <span key={i} className="anim-pop rounded-full px-[0.8em] py-[0.15em] font-display font-black" style={{ background: l.res === 'ok' ? 'var(--oliveira)' : l.res === 'buzz' ? 'var(--carmesim)' : 'rgba(255,255,255,.2)' }}>
              {l.res === 'ok' ? '✓' : l.res === 'buzz' ? '🚨' : '⏭'} {l.word}
            </span>
          ))}
        </div>
      </div>
    )
  },

  PlayerView({ view: v, priv, send, me, now, players }) {
    const [askWho, setAskWho] = useState(false)
    const meId = me?.id
    const ex = v.explainer ? players[v.explainer] : undefined
    const myTeam = v.teams.findIndex((t: string[]) => t.includes(meId ?? ''))
    if (meId === v.explainer) {
      if (v.stage === 'ready')
        return (
          <Waiting title="Você vai explicar! 🗣️" me={me} mood="wow">
            <div className="mb-4">Ninguém mais vê a carta. Não fale as palavras proibidas!</div>
            <Btn className="!text-2xl" onClick={() => send('start')}>
              ▶ Começar (60s)
            </Btn>
          </Waiting>
        )
      if (v.stage === 'play' && priv?.card) {
        if (askWho)
          return (
            <div className="flex flex-1 flex-col gap-2 p-4">
              <div className="text-center font-display text-xl font-black">Quem acertou?</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(players)
                  .filter((p) => p.id !== meId && p.online)
                  .map((p) => (
                    <Btn
                      key={p.id}
                      ghost
                      onClick={() => {
                        send('ok', { by: p.id })
                        setAskWho(false)
                      }}
                    >
                      {p.name}
                    </Btn>
                  ))}
              </div>
            </div>
          )
        return (
          <div className="flex flex-1 flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <span className="font-display font-black">Explique sem dizer…</span>
              <PhoneTimer end={v.t1} now={now} />
            </div>
            <div className="overflow-hidden rounded-3xl border-4 border-[var(--carmesim)] bg-white text-center text-[var(--noite)]">
              <div className="bg-[var(--oliveira)] py-4 font-display text-4xl font-black text-white">{priv.card.word}</div>
              <div className="flex flex-col gap-1 py-3">
                {priv.card.forbidden.map((f: string) => (
                  <div key={f} className="font-display text-xl font-extrabold text-[var(--carmesim)]">
                    🚫 {f}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-auto grid grid-cols-3 gap-2">
              <Btn tone="neutral" ghost disabled={priv.skips <= 0} onClick={() => send('skip')}>
                ⏭ Pular
              </Btn>
              <Btn className="col-span-2 !text-2xl" onClick={() => (v.mode === 'solo' ? setAskWho(true) : send('ok'))}>
                ✓ Acertaram!
              </Btn>
            </div>
          </div>
        )
      }
      return <Waiting title="Fim do seu turno! ⏰" me={me} />
    }
    if (meId === v.fiscal && v.stage === 'play' && priv?.card)
      return (
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="font-display font-black text-[var(--carmesim)]">🚨 Você é o FISCAL</span>
            <PhoneTimer end={v.t1} now={now} />
          </div>
          <div className="text-center text-sm">Se {ex?.name} falar uma palavra proibida, aperte BUZZ!</div>
          <div className="rounded-2xl bg-white p-3 text-center text-[var(--noite)]">
            <div className="font-display text-2xl font-black">{priv.card.word}</div>
            <div className="mt-1 font-semibold text-[var(--carmesim)]">{priv.card.forbidden.join(' · ')}</div>
          </div>
          <Btn tone="bad" className="flex-1 !text-4xl" onClick={() => send('buzz')}>
            🚨 BUZZ
          </Btn>
        </div>
      )
    const guessing = v.stage === 'play' && (v.mode === 'solo' || myTeam === v.team)
    return (
      <Waiting title={guessing ? 'Adivinhe em voz alta! 🗣️' : v.stage === 'play' ? `Time ${TEAM_META[v.team]?.name ?? ''} jogando…` : `Vez de ${ex?.name ?? ''}`} me={me} mood={guessing ? 'wow' : 'happy'}>
        {v.mode === 'team' && myTeam >= 0 && (
          <span>
            Seu time: <b>{TEAM_META[myTeam].emoji} {TEAM_META[myTeam].name}</b> · {v.teamScore[myTeam]} pts
          </span>
        )}
      </Waiting>
    )
  },
}
