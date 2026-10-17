import { motion } from 'motion/react'
import { useMemo } from 'react'
import type { Player } from '../engine/types'
import { Avatar } from './avatars'

/** Santuário visto de cima: leste (entrada) à esquerda → oeste (Santíssimo) à direita. */
const W = 1600
const H = 700
export const STATION_FRACS = [0, 0.15, 0.3, 0.5, 0.67, 0.84, 1]
export const STATION_IDS = ['porta', 'altar', 'pia', 'mesa', 'candelabro', 'incenso', 'veu']
const WAY: [number, number][] = [
  [140, 350],
  [390, 450],
  [610, 320],
  [930, 360],
  [1065, 365],
  [1190, 375],
  [1272, 350],
]

export function nodePositions(L: number): [number, number][] {
  const out: [number, number][] = []
  for (let i = 0; i <= L; i++) {
    const f = i / L
    let seg = 0
    while (seg < STATION_FRACS.length - 2 && f > STATION_FRACS[seg + 1]) seg++
    const f0 = STATION_FRACS[seg]
    const f1 = STATION_FRACS[seg + 1]
    const t = (f - f0) / (f1 - f0)
    const [x0, y0] = WAY[seg]
    const [x1, y1] = WAY[seg + 1]
    const dx = x1 - x0
    const dy = y1 - y0
    const len = Math.hypot(dx, dy) || 1
    const bulge = Math.sin(Math.PI * t) * (seg % 2 === 0 ? 34 : -34) * (seg >= 3 ? 0.5 : 1)
    out.push([x0 + dx * t + (-dy / len) * bulge, y0 + dy * t + (dx / len) * bulge])
  }
  return out
}

/** Which station index a node belongs to (or -1). */
export function stationAtNode(i: number, L: number): number {
  const f = i / L
  return STATION_FRACS.findIndex((sf, k) => Math.abs(sf - f) < 0.5 / L + 1e-9 && (k === 0 || Math.round(sf * L) === i))
}

export function stationsReached(stepsBefore: number, stepsAfter: number, L: number): number[] {
  const out: number[] = []
  STATION_FRACS.forEach((f, k) => {
    const node = Math.round(f * L)
    if (k > 0 && stepsBefore < node && Math.min(stepsAfter, L) >= node) out.push(k)
  })
  return out
}

function Scene({ L, open }: { L: number; open?: boolean }) {
  const nodes = nodePositions(L)
  const stationNodes = new Set(STATION_FRACS.map((f) => Math.round(f * L)))
  const d = nodes.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-label="Mapa do santuário">
      <defs>
        <radialGradient id="holy" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#fff4c2" />
          <stop offset="60%" stopColor="#ffcf4d" />
          <stop offset="100%" stopColor="#d48f00" />
        </radialGradient>
        <linearGradient id="sand" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f6e6c6" />
          <stop offset="1" stopColor="#ecd3a6" />
        </linearGradient>
        <pattern id="posts" width="56" height="56" patternUnits="userSpaceOnUse">
          <circle cx="28" cy="28" r="7" fill="#c67b3c" />
        </pattern>
      </defs>
      {/* átrio */}
      <rect x="40" y="70" width="1520" height="560" rx="34" fill="url(#sand)" />
      <rect x="40" y="70" width="1520" height="560" rx="34" fill="none" stroke="#fffaf0" strokeWidth="22" />
      <rect x="40" y="70" width="1520" height="560" rx="34" fill="none" stroke="#e6d8c2" strokeWidth="3" strokeDasharray="2 54" strokeLinecap="round" />
      {/* porta (leste) */}
      {['#1c7ed6', '#7b3fe4', '#e5383b', '#fffaf0'].map((c, i) => (
        <rect key={c} x={30 + i * 9} y="268" width="9" height="164" fill={c} />
      ))}
      {/* altar do holocausto */}
      <g transform="translate(390 285)">
        <rect x="-62" y="-62" width="124" height="124" rx="12" fill="#c67b3c" stroke="#9a5c28" strokeWidth="6" />
        <rect x="-40" y="-40" width="80" height="80" rx="6" fill="#9a5c28" />
        {[[-62, -62], [44, -62], [-62, 44], [44, 44]].map(([x, y]) => (
          <rect key={`${x}${y}`} x={x} y={y} width="18" height="18" rx="4" fill="#e0a06a" />
        ))}
        <text y="18" fontSize="52" textAnchor="middle">🔥</text>
      </g>
      {/* pia de bronze */}
      <g transform="translate(610 470)">
        <ellipse rx="70" ry="44" fill="#c67b3c" stroke="#9a5c28" strokeWidth="6" />
        <ellipse rx="52" ry="30" fill="#7cc7ff" />
        <ellipse cx="-14" cy="-8" rx="16" ry="6" fill="#fff" opacity=".6" />
      </g>
      {/* tenda */}
      <rect x="820" y="160" width="700" height="380" rx="10" fill="#3b2a6e" />
      <rect x="820" y="160" width="700" height="380" rx="10" fill="none" stroke="#e9b949" strokeWidth="18" />
      <rect x="811" y="300" width="20" height="110" fill="#3b2a6e" />
      {['#1c7ed6', '#7b3fe4', '#e5383b'].map((c, i) => (
        <rect key={c} x={812 + i * 6} y="300" width="6" height="110" fill={c} opacity=".9" />
      ))}
      {/* mesa dos pães */}
      <g transform="translate(940 245)">
        <rect x="-70" y="-34" width="140" height="68" rx="8" fill="#e9b949" stroke="#c4922a" strokeWidth="5" />
        {Array.from({ length: 12 }).map((_, i) => (
          <ellipse key={i} cx={-50 + (i % 6) * 20} cy={i < 6 ? -12 : 12} rx="8" ry="7" fill="#f6d39a" stroke="#b9853d" strokeWidth="2" />
        ))}
      </g>
      {/* candelabro */}
      <g transform="translate(1065 470)" stroke="#e9b949" strokeWidth="7" fill="none" strokeLinecap="round">
        <path d="M0 40 L0 -30" />
        <path d="M-20 -30 Q-20 10 0 10 Q20 10 20 -30" />
        <path d="M-40 -30 Q-40 25 0 25 Q40 25 40 -30" />
        <path d="M-60 -30 Q-60 40 0 40 Q60 40 60 -30" />
        <path d="M-24 46 L24 46" strokeWidth="9" />
        {[-60, -40, -20, 0, 20, 40, 60].map((x) => (
          <ellipse key={x} cx={x} cy="-42" rx="6" ry="10" fill="#ffc83d" stroke="none" className="anim-glow" />
        ))}
      </g>
      {/* altar de incenso */}
      <g transform="translate(1192 270)">
        <rect x="-30" y="-30" width="60" height="60" rx="6" fill="#e9b949" stroke="#c4922a" strokeWidth="5" />
        <path d="M-6 -36 Q-18 -60 0 -74 Q16 -90 4 -110" stroke="#d9d2ff" strokeWidth="6" fill="none" opacity=".7" strokeLinecap="round" />
      </g>
      {/* véu */}
      <g opacity={open ? 0.15 : 1} style={{ transition: 'opacity 1.5s' }}>
        {['#1c7ed6', '#7b3fe4', '#e5383b', '#1c7ed6', '#7b3fe4', '#e5383b'].map((c, i) => (
          <rect key={i} x={1262 + (i % 3) * 6} y={170 + Math.floor(i / 3) * 180} width="6" height="180" fill={c} />
        ))}
      </g>
      {/* santíssimo */}
      <rect x="1290" y="170" width="222" height="360" fill="url(#holy)" opacity={open ? 0.95 : 0.55} style={{ transition: 'opacity 1.5s' }} />
      <g transform="translate(1400 350)" className="anim-glow">
        <rect x="-64" y="-30" width="128" height="60" rx="8" fill="#ffc83d" stroke="#c4922a" strokeWidth="5" />
        <path d="M-56 -32 Q-30 -82 -4 -38 M56 -32 Q30 -82 4 -38" stroke="#fff3c4" strokeWidth="8" fill="none" strokeLinecap="round" />
      </g>
      {/* trilha */}
      <path d={d} fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 22" opacity=".95" />
      {nodes.map(([x, y], i) =>
        stationNodes.has(i) ? (
          <circle key={i} cx={x} cy={y} r="20" fill="#ffb703" stroke="#fff" strokeWidth="6" />
        ) : (
          <circle key={i} cx={x} cy={y} r="11" fill="#fff" stroke="rgba(0,0,0,.12)" strokeWidth="3" />
        ),
      )}
      <text x="1400" y="470" textAnchor="middle" fontSize="30" fontWeight="900" fill="#7a4a00" fontFamily="Nunito">SANTÍSSIMO</text>
      <text x="1050" y="205" textAnchor="middle" fontSize="26" fontWeight="900" fill="#e9b949" opacity=".85" fontFamily="Nunito">LUGAR SANTO</text>
      <text x="420" y="610" textAnchor="middle" fontSize="28" fontWeight="900" fill="#a7743d" opacity=".8" fontFamily="Nunito">ÁTRIO</text>
    </svg>
  )
}

export function SanctuaryMap({
  players,
  L,
  from,
  highlight,
  open,
  showNames = true,
  className = '',
  enteredIds,
}: {
  players: Player[]
  L: number
  from?: Record<string, number>
  highlight?: string
  open?: boolean
  showNames?: boolean
  className?: string
  enteredIds?: string[]
}) {
  const nodes = useMemo(() => nodePositions(L), [L])
  const ARK: [number, number] = [1400, 350]
  const groups = useMemo(() => {
    const g = new Map<number, Player[]>()
    for (const p of players) {
      const n = Math.min(p.steps, L)
      g.set(n, [...(g.get(n) ?? []), p])
    }
    return g
  }, [players, L])

  const slot = (k: number): [number, number] => {
    const offs: [number, number][] = [
      [0, -38],
      [-38, -22],
      [38, -22],
      [0, 4],
    ]
    return offs[k] ?? [0, 0]
  }

  return (
    <div className={`relative w-full ${className}`} style={{ aspectRatio: `${W} / ${H}` }}>
      <Scene L={L} open={open} />
      {players.map((p, idx) => {
        const node = Math.min(p.steps, L)
        const group = groups.get(node) ?? []
        const k = group.findIndex((g) => g.id === p.id)
        const hidden = k >= 4 && p.id !== highlight
        const [ox, oy] = slot(Math.min(k, 3))
        const inArk = enteredIds?.includes(p.id)
        const target: [number, number] = inArk ? [ARK[0] + ((idx % 5) - 2) * 36, ARK[1] - 40 + Math.floor(idx / 5) * 26] : [nodes[node][0] + ox, nodes[node][1] + oy]
        const start = from?.[p.id]
        let xs: number[] = [target[0]]
        let ys: number[] = [target[1]]
        if (start !== undefined && start !== p.steps && !inArk) {
          const a = Math.min(start, L)
          xs = []
          ys = []
          for (let i = a; i <= node; i++) {
            xs.push(nodes[i][0] + (i === node ? ox : 0))
            ys.push(nodes[i][1] + (i === node ? oy : -10))
          }
          if (xs.length === 1) {
            xs = [target[0]]
            ys = [target[1]]
          }
        }
        const steps = Math.max(1, xs.length - 1)
        const extra = p.steps - L
        return (
          <motion.div
            key={p.id}
            className="absolute"
            style={{ width: '4.2%', marginLeft: '-2.1%', marginTop: '-4.6%', zIndex: p.id === highlight ? 50 : 10 + node, opacity: hidden ? 0 : 1 }}
            initial={false}
            animate={{ left: xs.map((x) => `${(x / W) * 100}%`), top: ys.map((y) => `${(y / H) * 100}%`) }}
            transition={{ duration: start !== undefined ? 0.32 * steps : inArk ? 1.2 : 0.6, delay: start !== undefined ? (idx % 12) * 0.08 : inArk ? idx * 0.12 : 0, ease: 'easeInOut' }}
          >
            <div className={p.id === highlight ? 'anim-bob' : ''}>
              <Avatar id={p.avatar} color={p.color} size="100%" showItem={false} />
            </div>
            {showNames && (
              <div
                className="absolute left-1/2 top-full -translate-x-1/2 whitespace-nowrap rounded-full px-[0.5em] text-[0.62em] font-display font-black"
                style={{ background: p.id === highlight ? 'var(--ouro)' : 'rgba(27,24,64,.82)', color: p.id === highlight ? '#2a1d00' : '#fff' }}
              >
                {p.name}
                {extra > 0 && !inArk && <span className="ml-1 text-[var(--ouro)]">+{extra}</span>}
              </div>
            )}
          </motion.div>
        )
      })}
      {[...groups.entries()].map(([node, g]) =>
        g.length > 4 ? (
          <div
            key={node}
            className="absolute -translate-x-1/2 rounded-full bg-white px-[0.5em] font-display text-[0.7em] font-black text-[var(--noite)] shadow"
            style={{ left: `${(nodes[node][0] / W) * 100 + 2.4}%`, top: `${(nodes[node][1] / H) * 100 - 9}%`, zIndex: 60 }}
          >
            +{g.length - 4}
          </div>
        ) : null,
      )}
    </div>
  )
}

/** Encaixa o mapa no espaço disponível (largura E altura), sem sobrepor nada. */
export function FitMap(props: React.ComponentProps<typeof SanctuaryMap>) {
  return (
    <div className="relative h-full min-h-0 w-full" style={{ containerType: 'size' }}>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: `min(100cqw, calc(100cqh * ${W} / ${H}))` }}>
        <SanctuaryMap {...props} />
      </div>
    </div>
  )
}
