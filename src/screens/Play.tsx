import { useEffect, useMemo, useRef, useState } from 'react'
import { getPack, usePack } from '../content'
import { currentRevelation, finalRanking, REWARDS } from '../engine/session'
import type { Player, PublicState } from '../engine/types'
import { GAME_BY_ID } from '../games'
import { navigate } from '../router'
import { AVATARS, Avatar, ROBES } from '../ui/avatars'
import { HowToCard } from '../ui/HowToCard'
import { Btn, Lume, Sheet, useNow } from '../ui/kit'
import { SanctuaryMap } from '../ui/SanctuaryMap'
import { vibrate } from '../ui/sound'
import { RoloContent } from './Rolo'
import { usePlayer, useWakeLock } from './usePlayer'

const BAD = ['merda', 'porra', 'caralho', 'puta', 'buceta', 'cu ', 'fdp', 'viado', 'bosta', 'pinto', 'piroca']
const cleanName = (s: string) => {
  const low = ` ${s.toLowerCase()} `
  return BAD.some((b) => low.includes(b)) ? '' : s
}

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem('lej:profile') ?? 'null') as { name: string; avatar: string; color: number; noSpotlight: boolean } | null
  } catch {
    return null
  }
}

export function Play({ pin }: { pin: string }) {
  const [pinInput, setPinInput] = useState('')
  const { pub, priv, status, pid, send, clock } = usePlayer(pin)
  const now = useNow(clock, 250)
  const me = pub && pid ? pub.players[pid] : undefined
  const kicked = pub?.kicked.includes(pid)
  const { pack, error: packError } = usePack(pub?.packId)
  useWakeLock(!!me)

  if (!pin || status === 'notfound')
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <Lume size={100} mood={pin ? 'wow' : 'happy'} />
          <div className="font-display text-2xl font-black">{pin ? 'Sala não encontrada 🤔' : 'Entrar numa sala'}</div>
          <div className="text-[var(--muted)]">{pin ? `Confira o PIN no telão. (${pin})` : 'Digite o PIN que aparece no telão.'}</div>
          <form
            className="flex w-full max-w-xs flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (pinInput.length === 6) navigate(`/j/${pinInput}`)
            }}
          >
            <input className="field text-center font-display !text-3xl font-black tracking-[0.3em]" inputMode="numeric" maxLength={6} placeholder="PIN" value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))} />
            <Btn tone="blue" disabled={pinInput.length !== 6} type="submit">
              Entrar
            </Btn>
          </form>
        </div>
      </Shell>
    )
  if (status !== 'ok' || !pub || !pack)
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <Lume size={100} mood={packError ? 'wow' : 'happy'} className={packError ? '' : 'anim-bob'} />
          {packError && <div className="font-display text-xl font-black">Não consegui carregar o conteúdo da sala. Atualize a página.</div>}
        </div>
      </Shell>
    )
  if (kicked)
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <Lume size={90} mood="wow" />
          <div className="font-display text-2xl font-black">Você foi removido desta sala.</div>
        </div>
      </Shell>
    )
  if (!me) return <JoinForm onJoin={(d) => send('join', d)} pack={getPack(pub.packId)} />
  return <Playing pub={pub} priv={priv} me={me} send={send} now={now} />
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex min-h-dvh max-w-md flex-col">{children}</div>
}

/* ───────── Entrada ───────── */
function JoinForm({ onJoin, pack }: { onJoin: (d: any) => void; pack: ReturnType<typeof getPack> }) {
  const saved = loadProfile()
  const [name, setName] = useState(saved?.name ?? '')
  const [avatar, setAvatar] = useState(saved?.avatar ?? AVATARS[Math.floor(Math.random() * AVATARS.length)].id)
  const [color, setColor] = useState(saved?.color ?? 0)
  const [noSpot, setNoSpot] = useState(saved?.noSpotlight ?? false)
  const [step, setStep] = useState<1 | 2>(1)
  const [sending, setSending] = useState(false)
  const nameOk = cleanName(name.trim()).length >= 2

  function submit() {
    const d = { name: name.trim(), avatar, color, noSpotlight: noSpot }
    try {
      localStorage.setItem('lej:profile', JSON.stringify(d))
    } catch {
      /* ignore */
    }
    setSending(true)
    onJoin(d)
    setTimeout(() => setSending(false), 4000)
  }

  return (
    <Shell>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          <Lume size={56} />
          <div>
            <div className="text-xs font-bold text-[var(--muted)]">
              {pack.subtitle} · {pack.title}
            </div>
            <div className="font-display text-2xl font-black">{step === 1 ? 'Como te chamam?' : 'Escolha seu personagem'}</div>
          </div>
        </div>
        <div className="flex gap-1">
          <div className="h-2 flex-1 rounded-full bg-[var(--oliveira)]" />
          <div className="h-2 flex-1 rounded-full" style={{ background: step === 2 ? 'var(--oliveira)' : 'var(--line)' }} />
        </div>

        {step === 1 ? (
          <form
            className="flex flex-1 flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (nameOk) setStep(2)
            }}
          >
            <input className="field !text-2xl font-display font-black" placeholder="Seu nome" maxLength={14} value={name} onChange={(e) => setName(e.target.value)} autoFocus enterKeyHint="next" />
            {name.trim().length >= 2 && !nameOk && <div className="text-sm text-[var(--carmesim)]">Escolha outro nome 🙂</div>}
            <div className="text-sm text-[var(--muted)]">Dica: sem celular? Entre em dupla, ex.: "Ana & Léo".</div>
            <Btn className="mt-auto !text-xl" disabled={!nameOk} type="submit">
              Continuar ▶
            </Btn>
          </form>
        ) : (
          <div className="flex flex-1 flex-col gap-3">
            <div className="card flex items-center gap-3 p-3">
              <Avatar id={avatar} color={color} size={88} className="anim-bob" />
              <div className="min-w-0">
                <div className="truncate font-display text-2xl font-black">{name}</div>
                <div className="text-sm text-[var(--muted)]">como {AVATARS.find((a) => a.id === avatar)?.name}</div>
                <div className="mt-2 flex gap-1">
                  {ROBES.map((c, i) => (
                    <button key={c} aria-label={`cor ${i + 1}`} onClick={() => setColor(i)} className="h-7 w-7 rounded-full border-4" style={{ background: c, borderColor: color === i ? 'var(--text)' : 'transparent' }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="grid max-h-[42dvh] grid-cols-4 gap-2 overflow-auto rounded-2xl p-1">
              {AVATARS.map((a) => (
                <button key={a.id} onClick={() => setAvatar(a.id)} className="flex flex-col items-center rounded-2xl border-2 p-1 transition" style={{ borderColor: avatar === a.id ? 'var(--azul)' : 'var(--line)', background: avatar === a.id ? 'rgba(28,126,214,.1)' : 'var(--card)' }}>
                  <Avatar id={a.id} color={avatar === a.id ? color : undefined} size={54} />
                  <span className="text-[11px] font-bold leading-tight">{a.name}</span>
                </button>
              ))}
            </div>
            <label className="card flex items-center gap-3 p-3 text-sm">
              <input type="checkbox" className="h-5 w-5" checked={noSpot} onChange={(e) => setNoSpot(e.target.checked)} />
              <span>
                <b>🙈 Prefiro não ser sorteado</b> para responder sozinho ou falar (continuo jogando como plateia)
              </span>
            </label>
            <div className="mt-auto grid grid-cols-3 gap-2">
              <Btn ghost onClick={() => setStep(1)}>
                ◀
              </Btn>
              <Btn className="col-span-2 !text-xl" disabled={sending} onClick={submit}>
                {sending ? 'Entrando…' : 'Entrar! 🎉'}
              </Btn>
            </div>
          </div>
        )}
      </div>
    </Shell>
  )
}

/* ───────── Em jogo ───────── */
function Playing({ pub, priv, me, send, now }: { pub: PublicState; priv: any; me: Player; send: (t: string, d?: any) => void; now: number }) {
  const pack = getPack(pub.packId)
  const [menu, setMenu] = useState(false)
  const players = pub.players
  const ranking = useMemo(() => finalRanking(Object.values(players).filter((p) => !pub.kicked.includes(p.id))), [pub])
  const pos = ranking.findIndex((p) => p.id === me.id) + 1

  // vibração ao ser chamado
  const prevPhase = useRef(pub.phase)
  useEffect(() => {
    if (prevPhase.current !== pub.phase) vibrate(40)
    prevPhase.current = pub.phase
  }, [pub.phase])

  const reactable = !['play', 'intro'].includes(pub.phase)

  return (
    <Shell>
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b-2 border-[var(--line)] bg-[var(--bg)] px-3 py-2">
        <Avatar id={me.avatar} color={me.color} size={40} showItem={false} />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate font-display font-black">{me.name}</div>
          <div className="text-xs font-bold text-[var(--muted)]">
            {pub.phase === 'lobby' ? 'na sala de espera' : pub.history.length === 0 ? `${me.steps} 👣 · boa sorte!` : `${pos}º lugar · ${me.steps} 👣`}
          </div>
        </div>
        {pub.game && pub.phase === 'play' && (
          <div className="rounded-full px-2 py-0.5 text-sm font-bold text-white" style={{ background: GAME_BY_ID[pub.game.id].accent }}>
            {GAME_BY_ID[pub.game.id].icon} {GAME_BY_ID[pub.game.id].name}
          </div>
        )}
        <button className="rounded-full px-2 text-xl" onClick={() => setMenu(!menu)} aria-label="Menu">
          ⚙️
        </button>
      </header>
      {menu && (
        <div className="card m-3 flex flex-col gap-3 p-4 text-sm">
          <label className="flex items-center gap-3">
            <input type="checkbox" className="h-5 w-5" checked={me.noSpotlight} onChange={(e) => send('profile', { noSpotlight: e.target.checked })} />
            <span>
              <b>🙈 Não me sortear</b> para responder sozinho ou falar
            </span>
          </label>
          <div className="text-[var(--muted)]">PIN da sala: {pub.pin}</div>
          <Btn ghost onClick={() => setMenu(false)}>
            Fechar
          </Btn>
        </div>
      )}
      <main className="flex flex-1 flex-col">
        <PlayerPhase pub={pub} priv={priv} me={me} send={send} now={now} pack={pack} pos={pos} />
      </main>
      {reactable && (
        <div className="sticky bottom-0 flex justify-center gap-2 border-t-2 border-[var(--line)] bg-[var(--bg)] p-2">
          {['🙌', '😂', '🔥', '😮', '🙏', '❤️'].map((e) => (
            <button key={e} className="rounded-full bg-[var(--card)] px-2 py-1 text-2xl active:scale-90" onClick={() => send('react', { emoji: e })}>
              {e}
            </button>
          ))}
        </div>
      )}
    </Shell>
  )
}

function PlayerPhase({ pub, priv, me, send, now, pack, pos }: { pub: PublicState; priv: any; me: Player; send: (t: string, d?: any) => void; now: number; pack: ReturnType<typeof getPack>; pos: number }) {
  const players = pub.players
  const fact = pack.funFacts[Math.floor(now / 9000) % pack.funFacts.length]
  switch (pub.phase) {
    case 'lobby':
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <Avatar id={me.avatar} color={me.color} size={140} className="anim-bob" />
          <div className="font-display text-3xl font-black">Você está dentro! 🎉</div>
          <div className="text-[var(--muted)]">Procure seu nome no telão. Já já começa!</div>
          <div className="card w-full p-4 text-left">
            <div className="font-display text-sm font-black text-[var(--purpura)]">💡 VOCÊ SABIA?</div>
            <div className="font-semibold">{fact}</div>
          </div>
        </div>
      )
    case 'opening':
      return (
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="text-center font-display text-2xl font-black">Olhe para o telão 👀</div>
          <div className="card p-4">
            <div className="font-display font-black">"{pack.openingVerse.text}"</div>
            <div className="font-bold text-[var(--purpura)]">{pack.openingVerse.ref}</div>
          </div>
          <div className="card flex flex-col gap-2 p-4 text-sm">
            <div>👣 Cada jogo faz você andar no santuário.</div>
            <div>💬 Depois de cada jogo: o Momento Revelação.</div>
            <div>✨ No fim, o véu se abre para todos.</div>
          </div>
        </div>
      )
    case 'intro': {
      const g = GAME_BY_ID[pub.plan[pub.gameIdx].gameId]
      const acked = pub.ack.includes(me.id)
      return (
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="text-xs font-bold text-[var(--muted)]">
            JOGO {pub.gameIdx + 1} DE {pub.plan.length}
          </div>
          <div className="card p-4">
            <HowToCard g={g} />
          </div>
          <Btn className="sticky bottom-3 !text-xl" disabled={acked} onClick={() => send('ack')}>
            {acked ? 'Pronto! Aguardando… ✓' : 'Entendi ✓'}
          </Btn>
        </div>
      )
    }
    case 'play': {
      if (!pub.game) return null
      const g = GAME_BY_ID[pub.game.id]
      const View = g.PlayerView
      const participant = pub.game.participants.includes(me.id)
      if (!participant)
        return (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <Avatar id={me.avatar} color={me.color} size={110} />
            <div className="font-display text-2xl font-black">Você entra no próximo jogo! ⏭️</div>
            <div className="text-[var(--muted)]">Este jogo já tinha começado. Acompanhe pelo telão.</div>
          </div>
        )
      return <View view={pub.game.view} priv={priv?.game} me={me} players={players} now={now} pack={pack} send={send} participant={participant} />
    }
    case 'results': {
      const r = pub.results
      const mine = r?.ranking.find((x) => x.pid === me.id)
      const idx = r ? r.ranking.findIndex((x) => x.pid === me.id) : -1
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <Avatar id={me.avatar} color={me.color} size={120} mood={idx === 0 ? 'wow' : 'happy'} />
          {mine ? (
            <>
              <div className="font-display text-4xl font-black">{idx + 1}º neste jogo</div>
              <div className="text-lg">
                {mine.xp} pontos · <b className="text-[var(--oliveira-s)]">+{mine.steps} passos 👣</b>
              </div>
              {mine.tags.length > 0 && <div className="flex flex-wrap justify-center gap-2">{mine.tags.map((t) => <span key={t} className="rounded-full bg-[var(--card)] px-3 py-1 text-sm font-bold">{t}</span>)}</div>}
            </>
          ) : (
            <div className="font-display text-2xl font-black">Placar no telão!</div>
          )}
        </div>
      )
    }
    case 'reveal': {
      const rev = currentRevelation(pub)
      const questions = [rev.question, ...rev.followUps]
      const q = questions[(pub.revealQ ?? 0) % questions.length]
      const mine = pub.poll?.[me.id]
      const raised = pub.hands.includes(me.id)
      return (
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="font-display text-sm font-black text-[var(--purpura)]">💬 MOMENTO REVELAÇÃO</div>
          <div key={q} className="anim-pop rounded-2xl border-2 border-dashed border-[var(--ouro)] p-3 font-display text-xl font-black leading-snug">
            🗣️ {q}
          </div>
          <div className="card flex flex-col gap-2 p-3">
            <div className="font-display font-black">📱 {rev.poll.q}</div>
            {rev.poll.options.map((o, i) => (
              <button
                key={o}
                onClick={() => send('poll', { opt: i })}
                className="rounded-xl border-2 px-3 py-2 text-left font-display font-extrabold transition active:scale-[.98]"
                style={{ borderColor: mine === i ? 'var(--purpura)' : 'var(--line)', background: mine === i ? 'var(--purpura)' : 'var(--card)', color: mine === i ? '#fff' : 'var(--text)' }}
              >
                {o} {mine === i && '✓'}
              </button>
            ))}
            {mine !== undefined && <div className="text-center text-xs text-[var(--muted)]">Voto anônimo · pode trocar · resultado no telão</div>}
          </div>
          <div className="card p-3">
            <div className="text-sm font-bold text-[var(--purpura)]">📜 {rev.verse}</div>
            <div className="font-display text-lg font-black">{rev.verseText}</div>
          </div>
          <details className="card p-3 text-sm">
            <summary className="cursor-pointer font-display font-black">📖 Na lição e na Bíblia</summary>
            <p className="mt-2">{rev.lesson}</p>
            <ul className="mt-2 flex flex-col gap-1">
              {rev.bible.map((b) => (
                <li key={b.ref}>
                  <b className="text-[var(--purpura)]">{b.ref}</b> {b.text}
                </li>
              ))}
            </ul>
            <p className="mt-2 font-semibold">💡 {rev.insight}</p>
          </details>
          <Btn tone={raised ? 'gold' : 'blue'} className="sticky bottom-16 mt-auto !text-xl" onClick={() => send('hand')}>
            {raised ? '✋ Na fila para falar (tocar para sair)' : '✋ Quero falar'}
          </Btn>
        </div>
      )
    }
    case 'map': {
      const list = Object.values(players).filter((p) => !pub.kicked.includes(p.id))
      const gotBread = pub.bread.includes(me.id)
      return (
        <div className="flex flex-1 flex-col gap-3 p-3">
          <div className="text-center font-display text-xl font-black">Você está em {pos}º · {me.steps} 👣</div>
          <div className="overflow-hidden rounded-2xl" style={{ background: '#2b2263' }}>
            <SanctuaryMap players={list} L={pub.trackLength} from={pub.stepsBefore} highlight={me.id} showNames={false} />
          </div>
          {gotBread && (
            <Sheet tone="info" title="🍞 Pão e Água: +1 passo!">
              "Levanta-te e come, porque o caminho é longo" (1Rs 19:7). Deus cuida antes de cobrar.
            </Sheet>
          )}
        </div>
      )
    }
    case 'reward': {
      const r = pub.reward
      if (!r) return null
      if (r.pid !== me.id) return <div className="flex flex-1 flex-col items-center justify-center p-6 text-center font-display text-2xl font-black">🥇 {players[r.pid]?.name} está escolhendo uma recompensa…</div>
      if (!r.chosen)
        return (
          <div className="flex flex-1 flex-col gap-3 p-4">
            <div className="text-center font-display text-2xl font-black">🥇 Você venceu! Escolha:</div>
            {r.options.map((o) => (
              <Btn key={o} tone="gold" className="!flex-col !py-5" onClick={() => send('reward', { id: o })}>
                <span className="text-4xl">{REWARDS[o].emoji}</span>
                <span className="text-xl">{REWARDS[o].name}</span>
                <span className="text-sm font-semibold">{REWARDS[o].text}</span>
              </Btn>
            ))}
          </div>
        )
      return (
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="text-center font-display text-xl font-black">{r.chosen === 'voz' ? '🗳️ Qual será o próximo jogo?' : '🎲 Quem a sorte vai chamar primeiro?'}</div>
          {(r.targets ?? []).map((t) =>
            r.chosen === 'voz' ? (
              <Btn key={t} ghost className="!justify-start" onClick={() => send('reward', { target: t })}>
                <span className="text-2xl">{GAME_BY_ID[t]?.icon}</span> {GAME_BY_ID[t]?.name}
              </Btn>
            ) : (
              <Btn key={t} ghost className="!justify-start" onClick={() => send('reward', { target: t })}>
                <Avatar id={players[t]?.avatar} color={players[t]?.color} size={36} showItem={false} /> {players[t]?.name}
              </Btn>
            ),
          )}
        </div>
      )
    }
    case 'veil':
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="text-6xl">🥁</div>
          <div className="font-display text-2xl font-black">Diante do véu…</div>
          <div className="text-[var(--muted)]">Olhe para o telão!</div>
        </div>
      )
    case 'podium':
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <Avatar id={me.avatar} color={me.color} size={130} mood="wow" className="anim-bob" />
          <div className="font-display text-4xl font-black">{pos}º lugar</div>
          <div className="text-lg">{me.steps} passos · {me.firsts} vitórias</div>
          <div className="card p-3 text-sm">✨ O véu se rasgou e todos entraram. "Pelo novo e vivo caminho" (Hb 10:20)</div>
        </div>
      )
    default:
      return (
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="card flex items-center gap-3 p-3">
            <Avatar id={me.avatar} color={me.color} size={64} mood="wow" />
            <div>
              <div className="font-display text-2xl font-black">{pos}º lugar 🎉</div>
              <div className="text-sm text-[var(--muted)]">Obrigado por jogar!</div>
            </div>
            <Btn
              ghost
              className="ml-auto !px-3 !py-2 !text-sm"
              onClick={() => {
                const text = `Joguei a Lição em Jogo: "${pack.title}" e fiquei em ${pos}º lugar! 🕍✨`
                if (navigator.share) navigator.share({ text, url: `${location.origin}/rolo` }).catch(() => {})
                else navigator.clipboard?.writeText(`${text} ${location.origin}/rolo`)
              }}
            >
              Compartilhar
            </Btn>
          </div>
          <RoloContent pack={pack} />
        </div>
      )
  }
}
