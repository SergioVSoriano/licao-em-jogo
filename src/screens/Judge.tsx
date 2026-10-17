import { getPack } from '../content'
import { GAME_BY_ID } from '../games'
import { Btn, Lume } from '../ui/kit'
import { usePlayer, useWakeLock } from './usePlayer'

const PHASE_LABEL: Record<string, string> = {
  lobby: '🚪 Sala de espera',
  opening: '🎬 Abertura',
  intro: '📋 Regras do jogo',
  play: '🎮 Jogando',
  results: '🏆 Placar',
  reveal: '💬 Momento Revelação',
  map: '🕍 Mapa',
  reward: '🃏 Recompensa',
  veil: '🟪 Véu',
  podium: '✨ Pódio',
  end: '📜 Fim',
}

/** Controle remoto do facilitador (celular). */
export function Judge({ pin, judgeKey }: { pin: string; judgeKey: string }) {
  const { pub, status, send } = usePlayer(pin)
  useWakeLock(true)
  const fire = (id: string, data?: any) => send('host', { key: judgeKey, id, data })

  if (status !== 'ok' || !pub)
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <Lume size={90} className="anim-bob" />
        <div className="font-display text-xl font-black">{status === 'notfound' ? 'Sala não encontrada' : 'Conectando ao telão…'}</div>
      </div>
    )

  const pack = getPack(pub.packId)
  const game = pub.game ? GAME_BY_ID[pub.game.id] : pub.phase === 'intro' ? GAME_BY_ID[pub.plan[pub.gameIdx].gameId] : null
  const main = pub.controls.filter((c) => !c.small)
  const small = pub.controls.filter((c) => c.small)
  const rev = pub.phase === 'reveal' ? (pack.revelations.find((r) => r.game === pub.results?.gameId) ?? pack.revelations[0]) : null
  const online = Object.values(pub.players).filter((p) => p.online && !pub.kicked.includes(p.id)).length

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <Lume size={44} />
        <div className="flex-1">
          <div className="text-xs font-bold text-[var(--muted)]">CONTROLE DO FACILITADOR · PIN {pin}</div>
          <div className="font-display text-xl font-black">{PHASE_LABEL[pub.phase]}</div>
        </div>
        <div className="rounded-full bg-[var(--card)] px-3 py-1 font-bold">👥 {online}</div>
      </div>
      {game && (
        <div className="card flex items-center gap-3 p-3">
          <span className="text-3xl">{game.icon}</span>
          <div>
            <div className="font-display font-black">{game.name}</div>
            <div className="text-xs text-[var(--muted)]">
              Jogo {pub.gameIdx + 1} de {pub.plan.length}
            </div>
          </div>
        </div>
      )}
      {rev && (
        <div className="card flex flex-col gap-1 p-3 text-sm">
          <div className="font-bold text-[var(--purpura)]">📜 {rev.verse}</div>
          <div>💡 {rev.insight}</div>
          <div className="font-bold">🗣️ {rev.question}</div>
          {rev.note && <div className="rounded-xl bg-[var(--linho-2)] p-2 text-[var(--tinta)]">🧭 Nota de condução: {rev.note}</div>}
          {pub.hands.length > 0 && <div>✋ Querem falar: {pub.hands.map((h) => pub.players[h]?.name).join(', ')}</div>}
        </div>
      )}
      <div className="flex flex-1 flex-col justify-end gap-3">
        {small.length > 0 && (
          <div>
            <div className="mb-1 text-xs font-bold text-[var(--muted)]">⭐ Toque para dar Palavra de Ouro (+200)</div>
            <div className="flex flex-wrap gap-2">
              {small.map((c) => (
                <button key={c.id + JSON.stringify(c.data)} className="rounded-full border-2 border-[var(--line)] bg-[var(--card)] px-3 py-1 font-bold" onClick={() => fire(c.id, c.data)}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {main.map((c) => (
          <Btn
            key={c.id + JSON.stringify(c.data ?? '')}
            tone={c.tone === 'ok' || c.tone === 'primary' ? 'primary' : c.tone === 'bad' ? 'bad' : c.tone === 'gold' ? 'gold' : 'blue'}
            className={c.tone === 'neutral' ? '!py-3 !text-base opacity-80' : '!py-6 !text-2xl'}
            onClick={() => {
              if ((c.id === 'endGame' || c.id === 'skipGame') && !confirm('Tem certeza?')) return
              fire(c.id, c.data)
            }}
          >
            {c.label}
          </Btn>
        ))}
        {main.length === 0 && <div className="text-center text-[var(--muted)]">Nada para fazer agora: acompanhe pelo telão.</div>}
      </div>
    </div>
  )
}
