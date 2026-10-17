import confetti from 'canvas-confetti'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getPack } from '../content'
import { DAYS } from '../content/types'
import { REVEAL_SECONDS } from '../engine/planner'
import { REWARDS, currentRevelation, finalRanking } from '../engine/session'
import type { Control, Player, PublicState } from '../engine/types'
import { GAME_BY_ID } from '../games'
import { isDemo } from '../net'
import { joinUrl, navigate } from '../router'
import { Avatar } from '../ui/avatars'
import { HowToCard } from '../ui/HowToCard'
import { Btn, Kbd, Logo, Lume, Pill, Timer, useNow } from '../ui/kit'
import { FitMap, stationsReached } from '../ui/SanctuaryMap'
import { isMuted, setMuted, sfx } from '../ui/sound'
import { useHost } from './useHost'
import { TruthCard } from '../ui/RoloPoster'

export function Host({ pin }: { pin: string }) {
  const { pub, dispatch, error, clock, judgeKey } = useHost(pin)
  const now = useNow(clock, 200)
  const [muted, setMute] = useState(isMuted())
  const [showJudgeQR, setShowJudgeQR] = useState(false)

  const control = (id: string, data?: any) => dispatch({ type: 'control', id, data })

  // teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!pub || (e.target as HTMLElement)?.tagName === 'INPUT') return
      if (e.key === 'f' || e.key === 'F') {
        if (document.fullscreenElement) document.exitFullscreen()
        else document.documentElement.requestFullscreen?.()
        return
      }
      if (e.key === 'm' || e.key === 'M') {
        setMuted(!isMuted())
        setMute(isMuted())
        return
      }
      const c = pub.controls.find((c) => c.key && !c.small && c.key === e.key)
      if (c) {
        e.preventDefault()
        control(c.id, c.data)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  usePhaseSounds(pub)

  if (error)
    return (
      <div className="stage grid place-items-center p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <Lume size={120} mood="wow" />
          <div className="font-display text-3xl font-black">{error}</div>
          <Btn onClick={() => navigate('/criar')}>Criar nova sala</Btn>
        </div>
      </div>
    )
  if (!pub)
    return (
      <div className="stage grid place-items-center">
        <Lume size={120} className="anim-bob" />
      </div>
    )

  const pack = getPack(pub.packId)
  const players = Object.fromEntries(Object.entries(pub.players).filter(([id]) => !pub.kicked.includes(id)))
  const list = Object.values(players)
  const judgeUrl = `${location.origin}/f/${pin}/${judgeKey}`
  const elapsed = pub.sessionStartedAt ? (now - pub.sessionStartedAt) / 60000 : 0

  return (
    <div className="stage flex h-dvh flex-col">
      <div className="stage-pattern" />
      {/* topo */}
      <div className="relative z-10 flex items-center gap-[1em] px-[1.4em] pt-[0.8em]">
        <Logo size="0.9em" light />
        <div className="flex-1" />
        {pub.phase !== 'lobby' && (
          <div className="flex items-center gap-[0.35em]">
            {pub.plan.map((p, i) => (
              <div
                key={i}
                title={GAME_BY_ID[p.gameId].name}
                className="grid h-[1.9em] w-[1.9em] place-items-center rounded-full text-[0.95em]"
                style={{ background: i < pub.gameIdx || (i === pub.gameIdx && ['results', 'reveal', 'map', 'reward'].includes(pub.phase)) ? 'var(--ouro)' : i === pub.gameIdx ? '#fff' : 'rgba(255,255,255,.15)' }}
              >
                {GAME_BY_ID[p.gameId].icon}
              </div>
            ))}
          </div>
        )}
        {pub.sessionStartedAt && pub.phase !== 'end' && (
          <div className="rounded-full bg-white/10 px-[0.8em] py-[0.15em] font-display tabular font-extrabold" title="Tempo de jogo / tempo planejado">
            ⏱ {Math.floor(elapsed)}:{String(Math.floor((elapsed % 1) * 60)).padStart(2, '0')} / {pub.settings.minutes}:00
          </div>
        )}
        <div className="rounded-full bg-white/10 px-[0.8em] py-[0.15em] font-display font-extrabold">👥 {list.filter((p) => p.online).length}</div>
        <button className="rounded-full bg-white/10 px-[0.6em] py-[0.15em]" onClick={() => (setMuted(!muted), setMute(!muted))} title="Som (M)">
          {muted ? '🔇' : '🔊'}
        </button>
        <button className="rounded-full bg-white/10 px-[0.6em] py-[0.15em]" onClick={() => setShowJudgeQR(true)} title="Controle no celular">
          📲
        </button>
        <button className="rounded-full bg-white/10 px-[0.6em] py-[0.15em]" onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())} title="Tela cheia (F)">
          ⛶
        </button>
      </div>

      {/* palco */}
      <main className="relative z-10 flex min-h-0 flex-1 flex-col px-[1.6em] py-[0.9em]">
        <Phase pub={pub} players={players} list={list} now={now} pin={pin} control={control} dispatch={dispatch} judgeUrl={judgeUrl} pack={pack} />
      </main>

      {/* controles do facilitador */}
      <ControlBar controls={pub.controls} onControl={control} />

      <Reactions pub={pub} players={players} now={now} />

      {showJudgeQR && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60" onClick={() => setShowJudgeQR(false)}>
          <div className="flex flex-col items-center gap-[0.6em] rounded-[1.4em] bg-white p-[1.4em] text-center text-[var(--noite)]" onClick={(e) => e.stopPropagation()}>
            <div className="font-display text-[1.6em] font-black">📲 Controle do facilitador</div>
            <div className="max-w-[22em]">Leia com o SEU celular para avançar, julgar ✓/✗ e ver as notas de condução. Não mostre para a turma!</div>
            <QRCodeSVG value={judgeUrl} size={240} />
            <a className="break-all text-[0.8em] text-[var(--azul)] underline" href={judgeUrl} target="_blank" rel="noreferrer">
              abrir em outra aba
            </a>
            <Btn onClick={() => setShowJudgeQR(false)}>Fechar</Btn>
          </div>
        </div>
      )}
    </div>
  )
}

/* ───────── barra de controles ───────── */
function ControlBar({ controls, onControl }: { controls: Control[]; onControl: (id: string, data?: any) => void }) {
  const main = controls.filter((c) => !c.small)
  if (!main.length) return <div className="h-[1em]" />
  return (
    <div className="relative z-20 flex items-center justify-end gap-[0.6em] px-[1.4em] pb-[0.9em] text-[0.95em]">
      <div className="mr-auto text-[0.8em] opacity-60">
        <Kbd>Espaço</Kbd> avança · <Kbd>F</Kbd> tela cheia · <Kbd>M</Kbd> som
      </div>
      {main.map((c) => (
        <Btn
          key={c.id + JSON.stringify(c.data ?? '')}
          tone={c.tone === 'primary' ? 'primary' : c.tone === 'ok' ? 'ok' : c.tone === 'bad' ? 'bad' : c.tone === 'gold' ? 'gold' : 'neutral'}
          className="!px-[1.1em] !py-[0.55em]"
          onClick={() => {
            if (c.id === 'endGame' && !confirm('Encerrar este jogo agora e ir para o placar?')) return
            if (c.id === 'skipGame' && !confirm('Pular este jogo?')) return
            onControl(c.id, c.data)
          }}
        >
          {c.label}
          {c.key && c.key !== ' ' && <Kbd>{c.key}</Kbd>}
        </Btn>
      ))}
    </div>
  )
}

/* ───────── reações flutuantes ───────── */
function Reactions({ pub, players, now }: { pub: PublicState; players: Record<string, Player>; now: number }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {pub.reactions
        .filter((r) => now - r.at < 4500)
        .map((r) => (
          <div key={r.id} className="absolute bottom-[4em] flex flex-col items-center" style={{ left: `${8 + ((r.id.charCodeAt(0) * 7 + r.id.charCodeAt(1) * 3) % 84)}%`, animation: 'float-up 4.2s ease-out forwards' }}>
            <span className="text-[2.6em]">{r.emoji}</span>
            <span className="rounded-full bg-black/40 px-[0.5em] text-[0.7em]">{players[r.pid]?.name}</span>
          </div>
        ))}
    </div>
  )
}

/* ───────── sons por fase ───────── */
function usePhaseSounds(pub: PublicState | null) {
  const prev = useRef<{ phase?: string; n?: number }>({})
  useEffect(() => {
    if (!pub) return
    const n = Object.keys(pub.players).length
    if (prev.current.n !== undefined && n > prev.current.n) sfx.pop()
    if (prev.current.phase !== pub.phase) {
      if (pub.phase === 'results') sfx.fanfare()
      if (pub.phase === 'map') sfx.whoosh()
      if (pub.phase === 'veil') sfx.drum()
      if (pub.phase === 'podium') {
        sfx.fanfare()
        const end = Date.now() + 2500
        const frame = () => {
          confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0 }, colors: ['#ffb703', '#7b3fe4', '#1c7ed6', '#e5383b'] })
          confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1 }, colors: ['#ffb703', '#7b3fe4', '#1c7ed6', '#e5383b'] })
          if (Date.now() < end) requestAnimationFrame(frame)
        }
        frame()
      }
      if (pub.phase === 'intro') sfx.pop()
    }
    prev.current = { phase: pub.phase, n }
  }, [pub])
}

/* ───────── fases ───────── */
interface PhaseProps {
  pub: PublicState
  players: Record<string, Player>
  list: Player[]
  now: number
  pin: string
  control: (id: string, data?: any) => void
  dispatch: (a: any) => void
  judgeUrl: string
  pack: ReturnType<typeof getPack>
}

function Phase(p: PhaseProps) {
  switch (p.pub.phase) {
    case 'lobby':
      return <Lobby {...p} />
    case 'opening':
      return <Opening {...p} />
    case 'intro':
      return <Intro {...p} />
    case 'play':
      return <Play {...p} />
    case 'results':
      return <Results {...p} />
    case 'reveal':
      return <Reveal {...p} />
    case 'map':
      return <MapPhase {...p} />
    case 'reward':
      return <Reward {...p} />
    case 'veil':
    case 'podium':
      return <Finale {...p} />
    default:
      return <End {...p} />
  }
}

function Lobby({ pub, list, pin, dispatch, pack }: PhaseProps) {
  const url = joinUrl(pin)
  const totalMin = pub.settings.minutes
  return (
    <div className="grid h-full grid-cols-[minmax(0,26em)_1fr] gap-[2em]">
      <div className="flex flex-col items-center justify-center gap-[0.9em] text-center">
        <div className="font-display text-[1.6em] font-black">Entre pelo celular 📱</div>
        <div className="rounded-[1.4em] bg-white p-[1em] shadow-[0_0.4em_0_rgba(0,0,0,.25)]">
          <QRCodeSVG value={url} size={512} style={{ width: '17em', height: '17em' }} />
        </div>
        <div className="text-[1.05em] opacity-85">ou acesse</div>
        <div className="font-display text-[1.25em] font-black">{url.replace(/^https?:\/\//, '').replace(/\/j\/.*/, '')}</div>
        <div className="rounded-[0.8em] bg-white/10 px-[1em] py-[0.3em]">
          PIN <span className="font-display text-[2.6em] font-black tracking-[0.15em] text-[var(--ouro)]">{pin}</span>
        </div>
        {isDemo && <div className="max-w-[24em] rounded-[0.8em] bg-[var(--ouro)]/20 p-[0.6em] text-[0.8em]">🧪 Modo demonstração: abra o link do jogador em outra aba deste navegador, ou adicione robôs.</div>}
      </div>
      <div className="flex min-h-0 flex-col gap-[1em]">
        <div className="flex items-end justify-between gap-[1em]">
          <div>
            <div className="text-[1em] opacity-75">
              {pack.subtitle} · {pack.dates}
            </div>
            <div className="font-display text-[2.6em] font-black leading-none">{pack.title}</div>
          </div>
          <div className="text-right">
            <div className="font-display text-[3em] font-black leading-none">{list.length}</div>
            <div className="opacity-75">{list.length === 1 ? 'jogador' : 'jogadores'}</div>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-wrap content-start gap-[0.8em] overflow-auto rounded-[1.4em] bg-black/15 p-[1em]">
          {list.length === 0 && (
            <div className="flex w-full flex-col items-center justify-center gap-[0.6em] py-[3em] text-center opacity-80">
              <Lume size="6em" className="anim-bob" />
              <div className="font-display text-[1.4em] font-black">Esperando a turma chegar…</div>
            </div>
          )}
          {list.map((pl) => (
            <button
              key={pl.id}
              className="anim-pop flex w-[7.5em] flex-col items-center"
              title="Clique para remover"
              onClick={() => confirm(`Remover ${pl.name} da sala?`) && dispatch({ type: 'kick', pid: pl.id })}
              style={{ opacity: pl.online ? 1 : 0.4 }}
            >
              <Avatar id={pl.avatar} color={pl.color} size="5em" />
              <span className="max-w-full truncate rounded-full bg-white px-[0.6em] font-display font-black text-[var(--noite)]">{pl.name}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-[0.8em]">
          <div className="flex flex-1 flex-wrap items-center gap-[0.4em] text-[0.95em]">
            <span className="opacity-75">Roteiro ({totalMin} min):</span>
            {pub.plan.map((it, i) => (
              <Pill key={i} color="rgba(255,255,255,.12)" fg="#fff">
                {GAME_BY_ID[it.gameId].icon} {GAME_BY_ID[it.gameId].name}
              </Pill>
            ))}
          </div>
          <Btn tone="neutral" className="!px-[0.9em] !py-[0.4em] !text-[0.85em]" onClick={() => dispatch({ type: 'addBots', n: 3 })} title="Jogadores-robô para testar">
            🤖 +3 robôs
          </Btn>
        </div>
      </div>
    </div>
  )
}

function Opening({ pub, list, pack }: PhaseProps) {
  const moods: ('sad' | 'sleep' | 'wow')[] = ['sad', 'sleep', 'wow']
  return (
    <div className="flex h-full flex-col gap-[1em]">
      <div className="grid grid-cols-3 gap-[1em]">
        {pack.comic.map((t, i) => (
          <div key={i} className="anim-pop flex flex-col items-center rounded-[1.2em] bg-white p-[0.8em] text-[var(--noite)]" style={{ animationDelay: `${i * 0.5}s` }}>
            <div className="relative">
              <Avatar id="elias" size="4.5em" mood={moods[i]} showItem={false} />
              <span className="absolute -right-[0.6em] -top-[0.2em] text-[1.8em]">{['💧', '💤', '💪'][i]}</span>
            </div>
            <div className="mt-[0.3em] font-display text-[1.4em] font-black">"{t}"</div>
          </div>
        ))}
      </div>
      <div className="anim-pop rounded-[1.2em] bg-white/10 p-[1em] text-center" style={{ animationDelay: '1.5s' }}>
        <div className="font-display text-[1.4em] font-black leading-snug">"{pack.openingVerse.text}"</div>
        <div className="mt-[0.2em] font-display font-black text-[var(--ouro)]">{pack.openingVerse.ref}</div>
      </div>
      <div className="flex min-h-0 flex-1 items-stretch gap-[1.5em]">
        <div className="min-h-0 min-w-0 flex-1">
          <FitMap players={list} L={pub.trackLength} />
        </div>
        <div className="flex w-[17em] flex-col gap-[0.6em] text-[1.05em]">
          <Lume size="5em" mood="wink" />
          <div>👣 Cada jogo faz você <b>andar</b> no santuário.</div>
          <div>💬 Depois de cada jogo, o <b>Momento Revelação</b>.</div>
          <div>✨ No fim, o <b>véu se abre</b>. Bora?</div>
        </div>
      </div>
    </div>
  )
}

function Intro({ pub, list, pack }: PhaseProps) {
  const g = GAME_BY_ID[pub.plan[pub.gameIdx].gameId]
  const rounds = pub.plan[pub.gameIdx].rounds
  const online = list.filter((p) => p.online)
  const lastReward = pub.reward?.chosen ? pub.reward : null
  return (
    <div className="grid h-full grid-cols-[1fr_20em] gap-[2em]">
      <div className="anim-pop flex flex-col justify-center gap-[1em]">
        <div className="font-display text-[1.2em] font-black text-[var(--ouro)]">
          JOGO {pub.gameIdx + 1} DE {pub.plan.length} · {rounds} {g.rounds.label}
        </div>
        <div className="text-[1.45em]">
          <HowToCard g={g} dark />
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-[1em] text-center">
        <div className="grid h-[7em] w-[7em] place-items-center rounded-[1.6em]" style={{ background: g.accent, boxShadow: '0 0.3em 0 rgba(0,0,0,.25)' }}>
          <span className="text-[4em] leading-none">{g.icon}</span>
        </div>
        <div className="font-display text-[1.4em] font-black">📱 Regras também no celular</div>
        <div className="font-display text-[3em] font-black leading-none">
          {pub.ack.length}/{online.length}
        </div>
        <div className="opacity-75">já tocaram em "Entendi ✓"</div>
        {lastReward && (
          <div className="rounded-[1em] bg-white/10 p-[0.6em] text-[0.95em]">
            {REWARDS[lastReward.chosen!].emoji} {pub.players[lastReward.pid]?.name} usou <b>{REWARDS[lastReward.chosen!].name}</b>
          </div>
        )}
        <div className="text-[0.9em] italic opacity-70">{pack.truths.filter((t) => g.truths.includes(t.id)).slice(0, 2).map((t) => t.title).join(' · ')}</div>
      </div>
    </div>
  )
}

function Play({ pub, players, now, pack, control }: PhaseProps) {
  if (!pub.game) return null
  const g = GAME_BY_ID[pub.game.id]
  const View = g.HostView
  return (
    <div className="flex h-full min-h-0 flex-col gap-[0.6em]">
      <div className="flex items-center gap-[0.5em] font-display text-[1.1em] font-black">
        <span className="grid h-[1.8em] w-[1.8em] place-items-center rounded-[0.5em]" style={{ background: g.accent }}>
          {g.icon}
        </span>
        {g.name}
      </div>
      <div className="min-h-0 flex-1">
        <View view={pub.game.view} players={players} now={now} pack={pack} send={() => {}} participant control={(id, data) => control('g:' + id, data)} />
      </div>
    </div>
  )
}

function Results({ pub, players }: PhaseProps) {
  const r = pub.results
  if (!r) return null
  const g = GAME_BY_ID[r.gameId]
  const top = r.ranking.slice(0, 8)
  const max = Math.max(1, ...top.map((x) => x.xp))
  return (
    <div className="flex h-full flex-col gap-[1em]">
      <div className="text-center font-display text-[2.4em] font-black">
        {g.icon} Placar · {g.name}
      </div>
      <div className="mx-auto flex w-full max-w-[60em] flex-1 flex-col justify-center gap-[0.5em]">
        {top.map((x, i) => {
          const p = players[x.pid] ?? pub.players[x.pid]
          if (!p) return null
          return (
            <div key={x.pid} className="anim-pop flex items-center gap-[0.8em]" style={{ animationDelay: `${(top.length - i) * 0.12}s` }}>
              <div className="w-[1.6em] text-right font-display text-[1.6em] font-black opacity-80">{i + 1}</div>
              <Avatar id={p.avatar} color={p.color} size="3em" showItem={false} mood={i === 0 ? 'wow' : 'happy'} />
              <div className="relative h-[2.6em] flex-1 overflow-hidden rounded-full bg-white/10">
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.max(8, (Math.max(0, x.xp) / max) * 100)}%`, background: i === 0 ? 'var(--ouro)' : 'var(--purpura)', transition: 'width 1s' }} />
                <div className="relative flex h-full items-center justify-between px-[1em] font-display font-black" style={{ color: i === 0 ? '#2a1d00' : '#fff' }}>
                  <span>{p.name}</span>
                  <span className="tabular">{x.xp}</span>
                </div>
              </div>
              <div className="w-[12em] text-[0.95em]">
                <span className="font-display font-black text-[var(--ouro)]">+{x.steps} 👣</span> <span className="opacity-80">{x.tags.join(' ')}</span>
              </div>
            </div>
          )
        })}
        {r.ranking.length > 8 && <div className="text-center opacity-70">+ {r.ranking.length - 8} jogadores · todos andam no mapa!</div>}
      </div>
    </div>
  )
}

function Reveal({ pub, pack, now, players, list }: PhaseProps) {
  const rev = currentRevelation(pub)
  const truth = pack.truths.find((t) => t.id === rev.truth)
  const day = DAYS.find((d) => d.id === truth?.day)?.label
  const secs = REVEAL_SECONDS[pub.settings.depth] + pub.revealExtra
  const questions = [rev.question, ...rev.followUps]
  const qi = (pub.revealQ ?? 0) % questions.length
  const votes = Object.values(pub.poll ?? {})
  const counts = rev.poll.options.map((_, i) => votes.filter((v) => v === i).length)
  const maxC = Math.max(1, ...counts)
  const voters = list.filter((p) => p.online).length
  return (
    <div className="grid h-full min-h-0 grid-cols-[1.2fr_1fr] gap-[1.4em]">
      <div className="flex min-h-0 flex-col gap-[0.7em]">
        <div className="font-display text-[1.15em] font-black text-[var(--ouro)]">
          💬 MOMENTO REVELAÇÃO {truth && `· ${truth.emoji} ${truth.title}`} {day && <span className="opacity-70">· {day}</span>}
        </div>
        <div className="anim-pop rounded-[1.2em] bg-white px-[1em] py-[0.7em] text-[var(--noite)] shadow-[0_0.25em_0_rgba(0,0,0,.25)]">
          <div className="font-display text-[0.95em] font-black text-[var(--purpura)]">📜 {rev.verse}</div>
          <div className="font-display text-[1.7em] font-black leading-snug">{rev.verseText}</div>
        </div>
        <div className="anim-pop rounded-[1em] bg-white/10 px-[0.9em] py-[0.6em] text-[1.1em]" style={{ animationDelay: '.2s' }}>
          <div className="font-display text-[0.85em] font-black text-[var(--ouro)]">📖 NA LIÇÃO</div>
          <div>{rev.lesson}</div>
        </div>
        <div className="anim-pop flex flex-col gap-[0.35em]" style={{ animationDelay: '.4s' }}>
          <div className="font-display text-[0.85em] font-black text-[var(--ouro)]">🔎 NA BÍBLIA</div>
          {rev.bible.map((b) => (
            <div key={b.ref} className="flex items-baseline gap-[0.6em] text-[1.05em]">
              <span className="shrink-0 rounded-full bg-[var(--ouro)] px-[0.6em] font-display text-[0.85em] font-black text-[#2a1d00]">{b.ref}</span>
              <span>{b.text}</span>
            </div>
          ))}
        </div>
        <div className="anim-pop mt-auto flex gap-[0.5em] text-[1.25em] font-semibold" style={{ animationDelay: '.6s' }}>
          <span>💡</span>
          <span>{rev.insight}</span>
        </div>
      </div>
      <div className="flex min-h-0 flex-col gap-[0.8em]">
        <div key={qi} className="anim-pop rounded-[1.2em] border-[0.15em] border-dashed border-[var(--ouro)] bg-black/15 p-[0.9em]">
          <div className="font-display text-[0.85em] font-black text-[var(--ouro)]">
            🗣️ PERGUNTA {qi + 1} DE {questions.length}
          </div>
          <div className="font-display text-[1.75em] font-black leading-snug">{questions[qi]}</div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-[0.4em] rounded-[1.2em] bg-white/10 p-[0.9em]">
          <div className="flex items-baseline justify-between gap-[0.6em]">
            <div className="font-display text-[1.1em] font-black">📱 {rev.poll.q}</div>
            <div className="shrink-0 text-[0.85em] opacity-75">
              {votes.length}/{voters} votaram
            </div>
          </div>
          {rev.poll.options.map((o, i) => (
            <div key={o} className="relative overflow-hidden rounded-[0.7em] bg-black/20">
              <div className="absolute inset-y-0 left-0 rounded-[0.7em] transition-all duration-500" style={{ width: `${(counts[i] / maxC) * 100}%`, background: counts[i] === maxC && counts[i] > 0 ? 'var(--ouro)' : 'var(--purpura)' }} />
              <div className="relative flex items-center justify-between px-[0.7em] py-[0.25em] font-display font-black" style={{ color: counts[i] === maxC && counts[i] > 0 ? '#2a1d00' : '#fff' }}>
                <span>{o}</span>
                <span className="tabular">{votes.length ? Math.round((counts[i] / votes.length) * 100) : 0}%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-[0.8em]">
          <Timer start={pub.phaseAt} end={pub.phaseAt + secs * 1000} now={now} size="4.2em" label="conversa" />
          <div className="min-w-0 flex-1 text-[0.95em]">
            {pub.hands.length > 0 ? (
              <>
                <b>✋ Querem falar:</b> {pub.hands.map((h) => players[h]?.name).join(', ')}
              </>
            ) : (
              <span className="opacity-70">Quem quiser falar toca em ✋ no celular. Tecla Q troca a pergunta.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MapPhase({ pub, list, pack }: PhaseProps) {
  const [showCard, setShowCard] = useState(false)
  const L = pub.trackLength
  const reached = useMemo(() => {
    let best: number[] = []
    for (const p of list) {
      const r = stationsReached(pub.stepsBefore[p.id] ?? p.steps, p.steps, L)
      if (r.length && (!best.length || r[r.length - 1] > best[best.length - 1])) best = r
    }
    return best
  }, [pub.phaseAt])
  useEffect(() => {
    const t = setTimeout(() => setShowCard(true), 2400)
    const steps = setInterval(() => sfx.step(), 320)
    const stop = setTimeout(() => clearInterval(steps), 2200)
    return () => {
      clearTimeout(t)
      clearTimeout(stop)
      clearInterval(steps)
    }
  }, [pub.phaseAt])
  useEffect(() => {
    if (showCard && pub.bread.length) sfx.bread()
  }, [showCard])
  const ranking = finalRanking(list)
  const station = reached.length ? pack.stations[reached[reached.length - 1]] : null
  return (
    <div className="flex h-full flex-col gap-[0.6em]">
      <div className="flex items-center justify-between">
        <div className="font-display text-[1.8em] font-black">🕍 O caminho no santuário</div>
        <div className="flex gap-[0.4em]">
          {ranking.slice(0, 5).map((p, i) => (
            <Pill key={p.id} color={i === 0 ? 'var(--ouro)' : 'rgba(255,255,255,.12)'} fg={i === 0 ? '#2a1d00' : '#fff'}>
              {i + 1}º {p.name} · {p.steps}👣
            </Pill>
          ))}
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        <FitMap players={list} L={L} from={pub.stepsBefore} />
        {showCard && (station || pub.bread.length > 0) && (
          <div className="absolute inset-x-0 top-0 flex justify-center gap-[1em]">
            {station && (
              <div className="anim-pop flex max-w-[30em] items-center gap-[0.8em] rounded-[1.2em] bg-white p-[0.8em] text-[var(--noite)] shadow-[0_0.3em_0_rgba(0,0,0,.25)]">
                <div className="text-[2.6em]">{station.emoji}</div>
                <div>
                  <div className="font-display text-[1.3em] font-black">Nova estação: {station.name}!</div>
                  <div className="text-[0.95em]">
                    {station.meaning} <i>({station.ref})</i>
                  </div>
                  <div className="text-[0.9em] font-semibold text-[var(--purpura)]">{station.bridge}</div>
                </div>
              </div>
            )}
            {pub.bread.length > 0 && (
              <div className="anim-pop flex max-w-[24em] items-center gap-[0.6em] rounded-[1.2em] bg-[#fff3d6] p-[0.8em] text-[#5c3a00] shadow-[0_0.3em_0_rgba(0,0,0,.25)]">
                <div className="text-[2.4em]">🐦‍⬛🍞</div>
                <div>
                  <div className="font-display font-black">Pão e Água para {pub.bread.map((b) => pub.players[b]?.name).join(', ')}! +1 👣</div>
                  <div className="text-[0.9em] italic">"Levanta-te e come, porque o caminho é longo" (1Rs 19:7)</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Reward({ pub, now }: PhaseProps) {
  const r = pub.reward
  if (!r) return null
  const p = pub.players[r.pid]
  return (
    <div className="flex h-full flex-col items-center justify-center gap-[1.2em] text-center">
      {p && <Avatar id={p.avatar} color={p.color} size="9em" mood="wow" />}
      <div className="font-display text-[2.4em] font-black">🥇 {p?.name} venceu e escolhe uma recompensa!</div>
      <div className="flex gap-[1em]">
        {r.options.map((o) => (
          <div key={o} className="flex w-[13em] flex-col items-center gap-[0.3em] rounded-[1.2em] p-[1em]" style={{ background: r.chosen === o ? 'var(--ouro)' : 'rgba(255,255,255,.1)', color: r.chosen === o ? '#2a1d00' : '#fff' }}>
            <div className="text-[3em]">{REWARDS[o].emoji}</div>
            <div className="font-display text-[1.3em] font-black">{REWARDS[o].name}</div>
            <div className="text-[0.95em]">{REWARDS[o].text}</div>
          </div>
        ))}
      </div>
      {r.chosen === 'voz' && <div className="text-[1.2em]">🗳️ Escolhendo o próximo jogo…</div>}
      {r.chosen === 'sorte' && <div className="text-[1.2em]">🎲 Escolhendo quem será sorteado…</div>}
      <div className="opacity-70">Escolha no celular · {Math.max(0, Math.ceil((r.deadline - now) / 1000))}s</div>
    </div>
  )
}

function Finale({ pub, list }: PhaseProps) {
  const ranking = finalRanking(list)
  const podium = pub.phase === 'podium'
  const top = ranking.slice(0, 3)
  const awards = useMemo(() => {
    const out: { e: string; t: string; who?: Player }[] = []
    const byFirsts = list.slice().sort((a, b) => b.firsts - a.firsts)[0]
    if (byFirsts?.firsts) out.push({ e: '🏅', t: `Mais vitórias (${byFirsts.firsts})`, who: byFirsts })
    const byXp = list.slice().sort((a, b) => b.xpTotal - a.xpTotal)[0]
    if (byXp) out.push({ e: '⚡', t: 'Mais pontos somados', who: byXp })
    const bread = list.filter((p) => p.breadAt !== undefined)
    if (bread.length) out.push({ e: '🍞', t: 'Levantou e comeu (nunca desistiu)', who: bread[bread.length - 1] })
    return out
  }, [pub.phase])
  return (
    <div className="flex h-full flex-col gap-[0.8em]">
      <div className="text-center font-display text-[2.4em] font-black">{podium ? '✨ O véu se rasgou!' : '🟪 Diante do véu…'}</div>
      <div className="flex min-h-0 flex-1 items-center gap-[1.5em]">
        <div className="h-full min-h-0 min-w-0 flex-1">
          <FitMap players={list} L={pub.trackLength} open={podium} enteredIds={podium ? ranking.map((p) => p.id) : undefined} highlight={podium ? top[0]?.id : undefined} />
        </div>
        {podium && (
          <div className="flex w-[22em] flex-col items-center gap-[0.8em]">
            <div className="flex items-end gap-[0.5em]">
              {[1, 0, 2].map((i) => {
                const p = top[i]
                if (!p) return null
                const h = ['9em', '6.5em', '5em'][i]
                return (
                  <div key={p.id} className="anim-pop flex w-[6.5em] flex-col items-center" style={{ animationDelay: `${(2 - i) * 0.4}s` }}>
                    {i === 0 && <div className="text-[2em]">👑</div>}
                    <Avatar id={p.avatar} color={p.color} size="5em" mood="wow" />
                    <div className="w-full truncate text-center font-display font-black">{p.name}</div>
                    <div className="flex w-full flex-col items-center justify-start rounded-t-[0.8em] pt-[0.3em] font-display text-[1.8em] font-black" style={{ height: h, background: ['var(--ouro)', '#cfd6e6', '#e0a06a'][i], color: '#2a1d00' }}>
                      {i + 1}º<span className="text-[0.5em]">{p.steps} 👣</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex w-full flex-col gap-[0.3em] text-[0.95em]">
              {awards.map((a) => (
                <div key={a.t} className="rounded-full bg-white/10 px-[0.8em] py-[0.15em]">
                  {a.e} {a.t}: <b>{a.who?.name}</b>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="text-center text-[1.3em]">
        {podium ? (
          <>
            🙏 Todos entram! <i>"Temos ousadia para entrar no Santíssimo pelo sangue de Jesus, pelo novo e vivo caminho"</i> <b>(Hb 10:19-20)</b>
          </>
        ) : (
          'Quem chegou mais longe no caminho? 🥁'
        )}
      </div>
    </div>
  )
}

function End({ pack, pub }: PhaseProps) {
  const url = `${location.origin}/rolo`
  const [open, setOpen] = useState<number | null>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') setOpen((o) => (o === null ? 0 : (o + 1) % pack.truths.length))
      if (e.key === 'ArrowLeft') setOpen((o) => (o === null ? pack.truths.length - 1 : (o + pack.truths.length - 1) % pack.truths.length))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pack.truths.length])
  const t = open !== null ? pack.truths[open] : null
  return (
    <div className="flex h-full min-h-0 flex-col gap-[0.7em]">
      <div>
        <div className="font-display text-[1.1em] font-black text-[var(--ouro)]">📜 ROLO DA LIÇÃO · {pack.title}</div>
        <div className="font-display text-[1.45em] font-black leading-snug">{pack.bigIdea}</div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-4 grid-rows-2 gap-[0.7em] text-[1em]">
        {pack.truths.map((tr, i) => (
          <TruthCard key={tr.id} t={tr} dark compact onClick={() => setOpen(i)} />
        ))}
        <div className="flex flex-col items-center justify-center gap-[0.4em] rounded-[1em] bg-white/5 p-[0.6em] text-center">
          <div className="rounded-[0.8em] bg-white p-[0.4em]">
            <QRCodeSVG value={url} size={300} style={{ width: '6.5em', height: '6.5em' }} />
          </div>
          <div className="text-[0.85em]">Resumo e imagem no celular 📱</div>
          <div className="text-[0.75em] opacity-60">
            {pub.plan.length} jogos · {Object.keys(pub.players).length} jogadores
          </div>
          <Btn tone="neutral" className="!px-[0.8em] !py-[0.3em] !text-[0.8em]" onClick={() => navigate('/criar')}>
            Nova partida
          </Btn>
        </div>
      </div>
      <div className="text-center text-[0.9em] opacity-70">👆 Clique num tópico (ou use ← →) para discutir a lição inteira a partir do Rolo</div>
      {t && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-[3em]" onClick={() => setOpen(null)}>
          <div className="anim-pop flex w-full max-w-[60em] flex-col gap-[0.8em] rounded-[1.6em] bg-white p-[1.6em] text-[var(--noite)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-[0.6em]">
              <span className="text-[3em] leading-none">{t.emoji}</span>
              <div className="flex-1">
                <div className="text-[0.9em] font-bold tracking-wide text-[var(--muted)] uppercase">{DAYS.find((d) => d.id === t.day)?.label}</div>
                <div className="font-display text-[2.4em] font-black leading-none text-[var(--purpura)]">{t.title}</div>
              </div>
              <div className="font-display font-black opacity-50">
                {open! + 1}/{pack.truths.length}
              </div>
            </div>
            <div className="font-display text-[1.6em] font-black leading-snug">{t.text}</div>
            <div className="rounded-[1em] bg-[var(--linho-2)] p-[0.8em] text-[1.2em]">📖 <b>Na lição:</b> {t.lesson}</div>
            <div className="flex flex-col gap-[0.4em] text-[1.2em]">
              {t.examples.map((e) => (
                <div key={e.ref}>
                  <span className="mr-[0.5em] rounded-full bg-[var(--ouro)] px-[0.6em] font-display text-[0.85em] font-black text-[#2a1d00]">{e.ref}</span>
                  {e.text}
                </div>
              ))}
            </div>
            <div className="rounded-[1em] border-[0.15em] border-dashed border-[var(--ouro)] p-[0.8em] font-display text-[1.6em] font-black">🗣️ {t.question}</div>
            <div className="text-center text-[0.9em] text-[var(--muted)]">← → para navegar · Esc para fechar</div>
          </div>
        </div>
      )}
    </div>
  )
}
