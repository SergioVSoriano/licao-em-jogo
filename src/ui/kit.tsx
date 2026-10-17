import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Avatar } from './avatars'
import type { Player } from '../engine/types'

/* ───────── Mascote: Lume, a lamparina (Sl 119:105) ───────── */
export function Lume({ size = 80, mood = 'happy', className = '' }: { size?: number | string; mood?: 'happy' | 'wow' | 'sleep' | 'wink'; className?: string }) {
  return (
    <svg viewBox="0 0 120 110" width={size} className={className} aria-label="Lume, a lamparina">
      <defs>
        <radialGradient id="lume-flame" cx="50%" cy="70%" r="60%">
          <stop offset="0%" stopColor="#fff6c2" />
          <stop offset="45%" stopColor="#ffc83d" />
          <stop offset="100%" stopColor="#ff6b1a" />
        </radialGradient>
      </defs>
      <ellipse cx="58" cy="104" rx="38" ry="5" fill="rgba(0,0,0,.18)" />
      <g className="anim-glow">
        <path d="M92 10 C 82 24, 104 30, 96 46 C 92 52, 82 52, 80 44 C 76 34, 90 30, 92 10 Z" fill="url(#lume-flame)" />
      </g>
      <path d="M8 66 Q8 46 44 44 L84 42 Q98 42 98 50 Q98 58 86 60 Q100 64 100 76 Q100 98 56 98 Q8 98 8 66 Z" fill="#d9773b" />
      <path d="M14 70 Q16 92 56 92 Q92 92 94 76" fill="none" stroke="#b85d26" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="46" cy="52" rx="14" ry="4" fill="#8a4518" />
      <path d="M8 66 Q2 66 2 60 Q4 54 12 56" fill="none" stroke="#d9773b" strokeWidth="6" strokeLinecap="round" />
      {mood === 'sleep' ? (
        <g stroke="#3a1d0b" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M38 70 Q43 74 48 70" />
          <path d="M60 70 Q65 74 70 70" />
        </g>
      ) : (
        <g>
          <ellipse cx="43" cy="70" rx="4.5" ry={mood === 'wow' ? 6 : 5.4} fill="#3a1d0b" />
          {mood === 'wink' ? (
            <path d="M60 71 Q65 66 70 71" stroke="#3a1d0b" strokeWidth="3" fill="none" strokeLinecap="round" />
          ) : (
            <ellipse cx="65" cy="70" rx="4.5" ry={mood === 'wow' ? 6 : 5.4} fill="#3a1d0b" />
          )}
          <circle cx="44.6" cy="68" r="1.6" fill="#fff" />
          {mood !== 'wink' && <circle cx="66.6" cy="68" r="1.6" fill="#fff" />}
        </g>
      )}
      <circle cx="35" cy="80" r="4" fill="#ff8a5c" opacity=".55" />
      <circle cx="74" cy="80" r="4" fill="#ff8a5c" opacity=".55" />
      {mood === 'wow' ? <ellipse cx="54" cy="83" rx="4" ry="5" fill="#3a1d0b" /> : <path d="M47 80 Q54 88 61 80" stroke="#3a1d0b" strokeWidth="3" fill="none" strokeLinecap="round" />}
    </svg>
  )
}

/* ───────── Formas de resposta (cor + forma = acessível) ───────── */
export const ANSWER = [
  { name: 'triangulo', color: 'var(--carmesim)', shadow: 'var(--carmesim-s)', letter: 'A' },
  { name: 'losango', color: 'var(--azul)', shadow: 'var(--azul-s)', letter: 'B' },
  { name: 'circulo', color: 'var(--ouro)', shadow: 'var(--ouro-s)', letter: 'C' },
  { name: 'quadrado', color: 'var(--oliveira)', shadow: 'var(--oliveira-s)', letter: 'D' },
]

export function Shape({ i, size = '1.6em', color = '#fff' }: { i: number; size?: string | number; color?: string }) {
  const k = i % 4
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
      {k === 0 && <path d="M20 5 L36 34 L4 34 Z" fill={color} strokeLinejoin="round" />}
      {k === 1 && <path d="M20 3 L37 20 L20 37 L3 20 Z" fill={color} />}
      {k === 2 && <circle cx="20" cy="20" r="16" fill={color} />}
      {k === 3 && <rect x="5" y="5" width="30" height="30" rx="3" fill={color} />}
    </svg>
  )
}

export function AnswerTile({
  i,
  text,
  onClick,
  disabled,
  state,
  big,
  count,
  style,
}: {
  i: number
  text?: ReactNode
  onClick?: () => void
  disabled?: boolean
  state?: 'correct' | 'wrong' | 'dim' | 'picked'
  big?: boolean
  count?: number
  style?: CSSProperties
}) {
  const a = ANSWER[i % 4]
  const dim = state === 'dim' || state === 'wrong'
  return (
    <button
      className="btn3d w-full !justify-start text-left"
      onClick={onClick}
      disabled={disabled && !state}
      style={{
        ['--c' as any]: a.color,
        ['--s' as any]: a.shadow,
        opacity: dim ? 0.35 : 1,
        outline: state === 'correct' ? '0.25em solid #fff' : state === 'picked' ? '0.2em dashed #fff' : undefined,
        outlineOffset: '-0.45em',
        minHeight: big ? '3.6em' : '3.2em',
        cursor: onClick && !disabled ? 'pointer' : 'default',
        ...style,
      }}
    >
      <Shape i={i} size={big ? '1.8em' : '1.4em'} />
      {text !== undefined && <span className="flex-1 leading-tight">{text}</span>}
      {state === 'correct' && <span className="text-[1.3em]">✓</span>}
      {count !== undefined && <span className="tabular rounded-full bg-black/20 px-[0.6em] py-[0.1em] text-[0.85em]">{count}</span>}
    </button>
  )
}

/* ───────── Botão 3D ───────── */
const TONES: Record<string, [string, string, string?]> = {
  primary: ['var(--oliveira)', 'var(--oliveira-s)'],
  ok: ['var(--oliveira)', 'var(--oliveira-s)'],
  bad: ['var(--carmesim)', 'var(--carmesim-s)'],
  blue: ['var(--azul)', 'var(--azul-s)'],
  purple: ['var(--purpura)', 'var(--purpura-s)'],
  gold: ['var(--ouro)', 'var(--ouro-s)', '#3a2600'],
  fire: ['var(--fogo)', 'var(--fogo-s)'],
  neutral: ['rgba(255,255,255,.14)', 'rgba(0,0,0,.25)'],
}
export function Btn({
  tone = 'primary',
  children,
  className = '',
  ghost,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: keyof typeof TONES | string; ghost?: boolean }) {
  const t = TONES[tone] ?? TONES.primary
  return (
    <button
      {...rest}
      className={`btn3d ${ghost ? 'ghost' : ''} ${className}`}
      style={ghost ? rest.style : { ['--c' as any]: t[0], ['--s' as any]: t[1], ['--fg' as any]: t[2] ?? '#fff', ...rest.style }}
    >
      {children}
    </button>
  )
}

/* ───────── Relógio sincronizado ───────── */
export function useNow(clock: () => number, ms = 200) {
  const [now, setNow] = useState(clock())
  useEffect(() => {
    const t = setInterval(() => setNow(clock()), ms)
    return () => clearInterval(t)
  }, [clock, ms])
  return now
}

export function Timer({ start, end, now, size = '4em', label }: { start: number; end: number; now: number; size?: string; label?: string }) {
  const total = Math.max(1, end - start)
  const left = Math.max(0, end - now)
  const frac = left / total
  const secs = Math.ceil(left / 1000)
  const urgent = secs <= 5 && left > 0
  const r = 44
  const c = 2 * Math.PI * r
  return (
    <div className={`relative grid place-items-center ${urgent ? 'anim-shake' : ''}`} style={{ width: size, height: size }} key={urgent ? secs : 'calm'}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="rgba(0,0,0,.25)" stroke="rgba(255,255,255,.15)" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={urgent ? 'var(--fogo)' : 'var(--ouro)'}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          style={{ transition: 'stroke-dashoffset .2s linear' }}
        />
      </svg>
      <div className="relative text-center leading-none">
        <div className="font-display tabular font-black" style={{ fontSize: `calc(${size} * 0.36)` }}>
          {secs}
        </div>
        {label && <div className="text-[0.7em] opacity-70">{label}</div>}
      </div>
    </div>
  )
}

export function Bar({ frac, color = 'var(--oliveira)', h = '0.9em' }: { frac: number; color?: string; h?: string }) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-black/15" style={{ height: h }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(1, frac)) * 100}%`, background: color, boxShadow: 'inset 0 -0.2em 0 rgba(0,0,0,.15), inset 0 0.15em 0 rgba(255,255,255,.35)' }} />
    </div>
  )
}

export function PlayerChip({ p, size = '2.6em', sub, mood, dark = true }: { p: Player; size?: string; sub?: ReactNode; mood?: 'happy' | 'sad' | 'wow'; dark?: boolean }) {
  return (
    <div className={`flex items-center gap-[0.5em] rounded-full py-[0.2em] pl-[0.2em] pr-[0.9em] ${dark ? 'bg-white/10' : 'bg-black/5'} ${p.online === false ? 'opacity-40' : ''}`}>
      <Avatar id={p.avatar} color={p.color} size={size} mood={mood} showItem={false} />
      <div className="min-w-0 leading-tight">
        <div className="truncate font-display font-extrabold">{p.name}</div>
        {sub && <div className="text-[0.8em] opacity-75">{sub}</div>}
      </div>
    </div>
  )
}

export function Logo({ size = '1em', light }: { size?: string; light?: boolean }) {
  return (
    <div className="flex items-center gap-[0.4em] font-display font-black leading-none" style={{ fontSize: size }}>
      <Lume size="2.2em" />
      <div>
        <div style={{ color: light ? '#fff' : 'var(--text)' }}>
          Lição <span style={{ color: 'var(--ouro)' }}>em</span> Jogo
        </div>
        <div className="mt-[0.15em] text-[0.42em] font-bold tracking-[0.2em] uppercase opacity-70" style={{ color: light ? '#fff' : 'var(--muted)' }}>
          a lição que se joga junto
        </div>
      </div>
    </div>
  )
}

export function Pill({ children, color = 'var(--ouro)', fg = '#2a1d00', className = '' }: { children: ReactNode; color?: string; fg?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[0.3em] rounded-full px-[0.7em] py-[0.15em] font-display font-extrabold ${className}`} style={{ background: color, color: fg }}>
      {children}
    </span>
  )
}

/** Feedback "Duolingo" do celular */
export function Sheet({ tone, title, children }: { tone: 'ok' | 'bad' | 'info'; title: ReactNode; children?: ReactNode }) {
  const c = tone === 'ok' ? ['#d7ffb8', 'var(--oliveira-s)'] : tone === 'bad' ? ['#ffdfe0', 'var(--carmesim-s)'] : ['#dbeeff', 'var(--azul-s)']
  return (
    <div className="anim-pop rounded-2xl p-4" style={{ background: c[0], color: c[1] }}>
      <div className="font-display text-2xl font-black">{title}</div>
      {children && <div className="mt-1 font-semibold text-[#3b3557]">{children}</div>}
    </div>
  )
}

export function Center({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-1 flex-col items-center justify-center text-center ${className}`}>{children}</div>
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded-md border border-white/30 bg-white/10 px-[0.4em] py-[0.05em] font-sans text-[0.75em]">{children}</kbd>
}
