import type { GameDef } from '../engine/types'
import { KIND_LABEL } from '../games'

export function Dots({ n, of = 3, color = 'var(--ouro)' }: { n: number; of?: number; color?: string }) {
  return (
    <span className="inline-flex gap-[0.15em]">
      {Array.from({ length: of }).map((_, i) => (
        <span key={i} className="inline-block h-[0.55em] w-[0.55em] rounded-full" style={{ background: i < n ? color : 'currentColor', opacity: i < n ? 1 : 0.2 }} />
      ))}
    </span>
  )
}

/** Explicação de um minijogo (usada no catálogo, no planejador, no telão e no celular). */
export function HowToCard({ g, compact, dark }: { g: GameDef; compact?: boolean; dark?: boolean }) {
  const k = KIND_LABEL[g.kind]
  return (
    <div className={`flex flex-col gap-3 ${dark ? 'text-white' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl" style={{ background: g.accent, boxShadow: '0 0.25rem 0 rgba(0,0,0,.2)' }}>
          {g.icon}
        </div>
        <div className="min-w-0">
          <div className="font-display text-xl font-black leading-tight">{g.name}</div>
          <div className={`text-sm ${dark ? 'opacity-75' : 'text-[var(--muted)]'}`}>{g.origin}</div>
        </div>
      </div>
      <div className="font-semibold">{g.tagline}</div>
      <ol className="flex flex-col gap-2">
        {g.howTo.steps.map((s, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-xl leading-6">{s.icon}</span>
            <span>{s.text}</span>
          </li>
        ))}
      </ol>
      {!compact && (
        <>
          <div className={`rounded-xl p-3 text-sm ${dark ? 'bg-white/10' : 'bg-[var(--linho-2)] text-[var(--tinta)]'}`}>
            <div className="mb-1 font-display font-black">🏅 Pontos</div>
            <ul className="list-disc pl-5">
              {g.howTo.scoring.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div className="text-sm">
            <b>📱 No celular:</b> {g.howTo.phone}
          </div>
          {g.howTo.tip && <div className="text-sm italic opacity-80">💡 {g.howTo.tip}</div>}
          <div className={`flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold ${dark ? 'opacity-80' : 'text-[var(--muted)]'}`}>
            <span>
              {k.emoji} {k.label}
            </span>
            <span>👤 mín. {g.minPlayers} · ideal {g.idealRange[0]}–{g.idealRange[1]}</span>
            <span>
              ⚡ energia <Dots n={g.energy} />
            </span>
            <span>
              📖 profundidade <Dots n={g.depth} color="var(--azul)" />
            </span>
            {g.needsJudge && <span>🧑‍⚖️ facilitador julga</span>}
          </div>
        </>
      )}
    </div>
  )
}
