import { useMemo, useState } from 'react'
import { DAYS } from '../content/types'
import { DEFAULT_PACK } from '../content'
import { createSession } from '../engine/session'
import { PRESETS, coverage, estimateGame, estimatePlan, fillPlan, fitPlan, maxRounds, suggestPlan, FIXED_MINUTES } from '../engine/planner'
import type { Depth, PlanItem } from '../engine/types'
import { GAMES, GAME_BY_ID, KIND_LABEL } from '../games'
import { net } from '../net'
import { hostCache } from '../net/hostCache'
import { Link, navigate } from '../router'
import { Dots, HowToCard } from '../ui/HowToCard'
import { Btn, Logo } from '../ui/kit'
import { DemoBanner } from './Home'

const DEPTHS: { id: Depth; label: string; text: string }[] = [
  { id: 'leve', label: 'Leve', text: '~30 s de conversa por jogo' },
  { id: 'equilibrado', label: 'Equilibrado', text: '~1 min de conversa por jogo' },
  { id: 'profundo', label: 'Profundo', text: '~2,5 min de conversa por jogo' },
]

const fmt = (m: number) => {
  const mm = Math.floor(m)
  const ss = Math.round((m - mm) * 60)
  return ss ? `${mm}min${String(ss).padStart(2, '0')}` : `${mm} min`
}

export function Planner() {
  const pack = DEFAULT_PACK
  const preset = PRESETS[0]
  const [minutes, setMinutes] = useState(preset.minutes)
  const [n, setN] = useState(15)
  const [depth, setDepth] = useState<Depth>(preset.depth)
  const [rewards, setRewards] = useState(true)
  const [plan, setPlan] = useState<PlanItem[]>(() => preset.games.map((id) => ({ gameId: id, rounds: GAME_BY_ID[id].rounds.default(15) })))
  const [notice, setNotice] = useState<string[]>([])
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [force, setForce] = useState(false)

  const est = useMemo(() => estimatePlan(plan, GAME_BY_ID, n, depth), [plan, n, depth])
  const status = est.total <= minutes ? 'ok' : est.total <= minutes * 1.05 ? 'warn' : 'over'
  const cov = coverage(plan, GAME_BY_ID, pack)
  const spare = minutes - est.total

  function apply(next: PlanItem[], protect?: string, opts?: { mins?: number; players?: number; dep?: Depth }) {
    const r = fitPlan(next, GAME_BY_ID, opts?.players ?? n, opts?.dep ?? depth, opts?.mins ?? minutes, protect)
    setPlan(r.plan)
    setNotice(r.changes)
    setForce(false)
  }

  function usePreset(id: string) {
    const p = PRESETS.find((x) => x.id === id)!
    setMinutes(p.minutes)
    setDepth(p.depth)
    const items = p.games.filter((g) => n >= GAME_BY_ID[g].minPlayers).map((g) => ({ gameId: g, rounds: GAME_BY_ID[g].rounds.default(n) }))
    apply(items, undefined, { mins: p.minutes, dep: p.depth })
  }

  function auto() {
    const s = suggestPlan(GAMES, pack, n, depth, minutes)
    setPlan(fillPlan(s, GAME_BY_ID, pack, n, depth, minutes))
    setNotice(['✨ Montei um roteiro que cobre o máximo de dias da lição e cabe no tempo.'])
  }

  function toggle(id: string) {
    if (plan.some((p) => p.gameId === id)) apply(plan.filter((p) => p.gameId !== id))
    else apply([...plan, { gameId: id, rounds: GAME_BY_ID[id].rounds.default(n) }], id)
  }
  function setRounds(id: string, d: number) {
    const def = GAME_BY_ID[id]
    apply(
      plan.map((p) => (p.gameId === id ? { ...p, rounds: Math.max(def.rounds.min, Math.min(maxRounds(def, pack), p.rounds + d)) } : p)),
      id,
    )
  }
  function fav(id: string) {
    setPlan(plan.map((p) => (p.gameId === id ? { ...p, fav: !p.fav } : p)))
  }
  function move(i: number, d: number) {
    const j = i + d
    if (j < 0 || j >= plan.length) return
    const a = plan.slice()
    ;[a[i], a[j]] = [a[j], a[i]]
    setPlan(a)
  }

  async function open() {
    setBusy(true)
    try {
      const { pin, host } = await net.createRoom()
      const s = createSession(pin, pack.id, { minutes, depth, expectedPlayers: n, rewards, sound: true }, plan, host.serverNow())
      host.saveSnapshot(JSON.stringify(s))
      hostCache.set(pin, { host, state: s })
      navigate(`/host/${pin}`)
    } catch (e) {
      alert('Não foi possível criar a sala. Verifique a internet e a configuração do Firebase.\n\n' + String(e))
      setBusy(false)
    }
  }

  const statusBox =
    status === 'ok'
      ? { bg: '#e6fbd8', fg: 'var(--oliveira-s)', t: `✅ Cabe! Sobram ${fmt(Math.max(0, spare))}.` }
      : status === 'warn'
        ? { bg: '#fff3cf', fg: '#8a6100', t: `⚠️ Passa ${fmt(-spare)} do tempo (tolerável).` }
        : { bg: '#ffe1e1', fg: 'var(--carmesim-s)', t: `⛔ Passa ${fmt(-spare)} do tempo. Remova um jogo, diminua rodadas, mude a conversa para "Leve" ou aumente o tempo.` }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6">
      <header className="flex items-center justify-between">
        <Link to="/">
          <Logo size="1.2rem" />
        </Link>
        <Link to="/como-funciona" className="font-display font-extrabold text-[var(--azul)]">
          Como funciona?
        </Link>
      </header>
      <div>
        <h1 className="font-display text-3xl font-black">Montar a partida</h1>
        <p className="text-[var(--muted)]">Diga quanto tempo vocês têm. Eu calculo o que cabe, e você ajusta como quiser.</p>
      </div>
      <DemoBanner />

      <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
        <div className="flex flex-col gap-5">
          {/* Lição */}
          <div className="card flex items-center gap-4 p-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[var(--purpura)] text-3xl">📖</div>
            <div className="flex-1">
              <div className="text-sm font-bold text-[var(--muted)]">
                {pack.subtitle} · {pack.dates}
              </div>
              <div className="font-display text-2xl font-black">{pack.title}</div>
              <div className="text-sm">Texto da semana: {pack.keyText}</div>
            </div>
          </div>

          {/* Ajustes */}
          <div className="card grid gap-5 p-4 sm:grid-cols-3">
            <div>
              <div className="mb-1 font-display font-black">⏱️ Tempo de jogo</div>
              <div className="font-display text-4xl font-black text-[var(--purpura)]">{minutes} min</div>
              <input type="range" min={10} max={60} step={5} value={minutes} onChange={(e) => {
                  const m = Number(e.target.value)
                  setMinutes(m)
                  apply(plan, undefined, { mins: m })
                }} className="w-full accent-[var(--purpura)]" />
              <div className="text-xs text-[var(--muted)]">A entrada no lobby não conta: abra antes da aula.</div>
            </div>
            <div>
              <div className="mb-1 font-display font-black">👥 Pessoas (estimativa)</div>
              <div className="flex items-center gap-2">
                <Btn ghost className="!px-4 !py-2" onClick={() => (setN(Math.max(2, n - 1)), apply(plan, undefined, { players: Math.max(2, n - 1) }))}>
                  −
                </Btn>
                <div className="w-16 text-center font-display text-4xl font-black text-[var(--azul)]">{n}</div>
                <Btn ghost className="!px-4 !py-2" onClick={() => (setN(Math.min(40, n + 1)), apply(plan, undefined, { players: Math.min(40, n + 1) }))}>
                  +
                </Btn>
              </div>
              <div className="text-xs text-[var(--muted)]">Os tempos se ajustam ao número de pessoas.</div>
            </div>
            <div>
              <div className="mb-1 font-display font-black">💬 Momento Revelação</div>
              <div className="flex flex-col gap-1">
                {DEPTHS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => (setDepth(d.id), apply(plan, undefined, { dep: d.id }))}
                    className="rounded-xl border-2 px-3 py-1 text-left text-sm"
                    style={{ borderColor: depth === d.id ? 'var(--azul)' : 'var(--line)', background: depth === d.id ? 'rgba(28,126,214,.08)' : undefined }}
                  >
                    <b>{d.label}</b> · {d.text}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((p) => (
              <button key={p.id} onClick={() => usePreset(p.id)} className="rounded-full border-2 border-[var(--line)] bg-[var(--card)] px-3 py-1 text-sm font-bold hover:border-[var(--purpura)]">
                {p.emoji} {p.name} · {p.minutes} min
              </button>
            ))}
            <Btn tone="purple" className="!px-4 !py-2 !text-sm" onClick={auto}>
              ✨ Montar para mim
            </Btn>
          </div>

          {/* Catálogo */}
          <div>
            <div className="mb-2 font-display text-xl font-black">Catálogo de jogos</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {GAMES.map((g) => {
                const inPlan = plan.find((p) => p.gameId === g.id)
                const blocked = n < g.minPlayers
                const minutesG = estimateGame(g, n, inPlan?.rounds ?? g.rounds.default(n), depth)
                return (
                  <div key={g.id} className="card flex flex-col gap-2 p-3" style={{ borderColor: inPlan ? g.accent : undefined, opacity: blocked ? 0.55 : 1 }}>
                    <div className="flex items-start gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl" style={{ background: g.accent }}>
                        {g.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-lg font-black leading-tight">{g.name}</div>
                        <div className="text-xs text-[var(--muted)]">{g.tagline}</div>
                      </div>
                      <button className="text-xl" title="Como jogar" onClick={() => setInfo(g.id)}>
                        ❓
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-[var(--muted)]">
                      <span>
                        {KIND_LABEL[g.kind].emoji} {KIND_LABEL[g.kind].label}
                      </span>
                      <span>
                        ⚡ <Dots n={g.energy} />
                      </span>
                      <span>
                        📖 <Dots n={g.depth} color="var(--azul)" />
                      </span>
                      <span>⏱️ ~{fmt(minutesG)}</span>
                      {blocked && <span className="text-[var(--carmesim)]">precisa de {g.minPlayers}+ pessoas</span>}
                    </div>
                    <div className="mt-auto flex items-center gap-2">
                      {inPlan ? (
                        <>
                          <Btn ghost className="!px-3 !py-1" onClick={() => setRounds(g.id, -1)} disabled={inPlan.rounds <= g.rounds.min}>
                            −
                          </Btn>
                          <span className="min-w-[5.5rem] text-center text-sm font-bold">
                            {inPlan.rounds} {g.rounds.label}
                          </span>
                          <Btn ghost className="!px-3 !py-1" onClick={() => setRounds(g.id, +1)} disabled={inPlan.rounds >= maxRounds(g, pack)}>
                            +
                          </Btn>
                          <button title="Favorito: ganha rodadas extras e é o último a ser cortado" className="ml-auto text-2xl" onClick={() => fav(g.id)}>
                            {inPlan.fav ? '❤️' : '🤍'}
                          </button>
                          <Btn tone="bad" className="!px-3 !py-1 !text-sm" onClick={() => toggle(g.id)}>
                            Remover
                          </Btn>
                        </>
                      ) : (
                        <Btn className="ml-auto !px-4 !py-1 !text-sm" disabled={blocked} onClick={() => toggle(g.id)}>
                          + Adicionar
                        </Btn>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Roteiro */}
        <aside className="flex flex-col gap-3 lg:sticky lg:top-4 lg:self-start">
          <div className="card flex flex-col gap-3 p-4">
            <div className="flex items-baseline justify-between">
              <div className="font-display text-xl font-black">Roteiro</div>
              <div className="font-display text-lg font-black" style={{ color: statusBox.fg }}>
                {fmt(est.total)} / {minutes} min
              </div>
            </div>
            <div className="flex h-5 overflow-hidden rounded-full bg-[var(--linho-2)]">
              <div style={{ width: `${(1.5 / Math.max(minutes, est.total)) * 100}%` }} className="bg-[var(--cinza)]" title="Abertura" />
              {est.items.map((it) => (
                <div key={it.gameId} title={`${GAME_BY_ID[it.gameId].name}: ${fmt(it.minutes)}`} style={{ width: `${(it.minutes / Math.max(minutes, est.total)) * 100}%`, background: GAME_BY_ID[it.gameId].accent }} className="border-r-2 border-white" />
              ))}
              <div style={{ width: `${(2.5 / Math.max(minutes, est.total)) * 100}%` }} className="bg-[var(--cinza)]" title="Final" />
            </div>
            <div className="rounded-xl px-3 py-2 text-sm font-bold" style={{ background: statusBox.bg, color: statusBox.fg }}>
              {statusBox.t}
            </div>
            {notice.length > 0 && (
              <div className="rounded-xl bg-[var(--linho-2)] px-3 py-2 text-xs text-[var(--tinta)]">
                {notice.map((x) => (
                  <div key={x}>✂️ {x}</div>
                ))}
              </div>
            )}
            <ol className="flex flex-col gap-2">
              <li className="flex justify-between text-sm text-[var(--muted)]">
                <span>🎬 Abertura</span>
                <span>1min30</span>
              </li>
              {est.items.map((it, i) => {
                const g = GAME_BY_ID[it.gameId]
                return (
                  <li key={it.gameId} className="flex items-center gap-2 rounded-xl bg-[var(--linho-2)] px-2 py-1 text-[var(--tinta)]">
                    <span className="text-xl">{g.icon}</span>
                    <span className="flex-1 truncate text-sm font-bold">
                      {g.name} {it.fav && '❤️'}
                      <span className="block text-xs font-normal opacity-70">
                        {it.rounds} {g.rounds.label} · {fmt(it.minutes)}
                      </span>
                    </span>
                    <button onClick={() => move(i, -1)} className="px-1" aria-label="Subir">
                      ▲
                    </button>
                    <button onClick={() => move(i, 1)} className="px-1" aria-label="Descer">
                      ▼
                    </button>
                  </li>
                )
              })}
              <li className="flex justify-between text-sm text-[var(--muted)]">
                <span>✨ Véu, pódio e resumo</span>
                <span>2min30</span>
              </li>
            </ol>
            {plan.length === 0 && <div className="text-center text-sm text-[var(--muted)]">Adicione pelo menos 1 jogo.</div>}
            {status === 'ok' && spare >= 1 && plan.length > 0 && (
              <Btn ghost className="!py-2 !text-sm" onClick={() => setPlan(fillPlan(plan, GAME_BY_ID, pack, n, depth, minutes))}>
                ➕ Usar o tempo livre ({fmt(spare)}) em mais rodadas
              </Btn>
            )}
            <div>
              <div className="mb-1 text-xs font-bold text-[var(--muted)]">Cobertura da lição</div>
              <div className="flex gap-1">
                {DAYS.map((d) => (
                  <div key={d.id} title={d.label} className="grid h-8 flex-1 place-items-center rounded-lg font-display text-sm font-black" style={{ background: cov.has(d.id) ? 'var(--ouro)' : 'var(--linho-2)', color: cov.has(d.id) ? '#2a1d00' : 'var(--cinza)' }}>
                    {d.short}
                  </div>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={rewards} onChange={(e) => setRewards(e.target.checked)} />
              🃏 Cartas de recompensa para o 1º lugar
            </label>
            {status === 'over' && (
              <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
                Sei que vai passar do tempo, quero abrir mesmo assim
              </label>
            )}
            <Btn className="!py-4 !text-xl" disabled={busy || plan.length === 0 || (status === 'over' && !force)} onClick={open}>
              {busy ? 'Abrindo…' : 'Abrir sala ▶'}
            </Btn>
            <div className="text-center text-xs text-[var(--muted)]">
              {FIXED_MINUTES} min fixos (abertura + final) já incluídos
            </div>
          </div>
        </aside>
      </div>

      {info && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setInfo(null)}>
          <div className="card max-h-[90dvh] w-full max-w-lg overflow-auto p-5" onClick={(e) => e.stopPropagation()}>
            <HowToCard g={GAME_BY_ID[info]} />
            <Btn className="mt-4 w-full" onClick={() => setInfo(null)}>
              Entendi
            </Btn>
          </div>
        </div>
      )}
    </div>
  )
}
