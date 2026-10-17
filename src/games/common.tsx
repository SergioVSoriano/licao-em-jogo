import type { ReactNode } from 'react'
import { Avatar } from '../ui/avatars'
import { AnswerTile, Lume, Timer } from '../ui/kit'
import type { Player } from '../engine/types'

export const sec = (s: number) => s * 1000

/** Cabeçalho de rodada dentro do telão */
export function RoundBar({ label, right }: { label: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="rounded-full bg-white/10 px-[0.9em] py-[0.25em] font-display font-extrabold opacity-90">{label}</div>
      {right}
    </div>
  )
}

export function Answered({ n, total }: { n: number; total: number }) {
  return (
    <div className="text-center leading-none">
      <div className="font-display tabular text-[2.4em] font-black">{n}</div>
      <div className="text-[0.85em] opacity-70">de {total} responderam</div>
    </div>
  )
}

export function BigQuestion({ children }: { children: ReactNode }) {
  return (
    <div className="anim-pop rounded-[1.2em] bg-white px-[1.2em] py-[0.9em] text-center font-display text-[2.3em] font-black leading-tight text-[var(--noite)] shadow-[0_0.25em_0_rgba(0,0,0,.25)]">
      {children}
    </div>
  )
}

export function Explain({ ok, children, refText }: { ok?: boolean; children: ReactNode; refText?: string }) {
  return (
    <div className="anim-pop flex items-start gap-[0.8em] rounded-[1em] bg-white/95 px-[1em] py-[0.7em] text-[1.25em] text-[var(--noite)]">
      <span className="text-[1.6em]">{ok === false ? '💡' : '📖'}</span>
      <div>
        <div className="font-semibold">{children}</div>
        {refText && <div className="mt-[0.2em] font-display text-[0.85em] font-black text-[var(--purpura)]">{refText}</div>}
      </div>
    </div>
  )
}

export function OptionsGrid({
  options,
  correct,
  counts,
  reveal,
}: {
  options: string[]
  correct?: number
  counts?: number[]
  reveal?: boolean
}) {
  return (
    <div className="grid grid-cols-2 gap-[0.8em] text-[1.45em]">
      {options.map((o, i) => (
        <AnswerTile key={i} i={i} text={o} big state={reveal ? (i === correct ? 'correct' : 'dim') : undefined} count={reveal && counts ? counts[i] : undefined} />
      ))}
    </div>
  )
}

export function TimerBox({ start, end, now }: { start: number; end: number; now: number }) {
  return <Timer start={start} end={end} now={now} size="5.2em" />
}

/* ───────── Celular ───────── */
export function Waiting({ title, children, me, mood = 'happy' }: { title: ReactNode; children?: ReactNode; me?: Player; mood?: 'happy' | 'wow' | 'sleep' | 'sad' }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      {me ? <Avatar id={me.avatar} color={me.color} size={110} mood={mood === 'sleep' ? 'sleep' : mood} className="anim-bob" /> : <Lume size={100} mood={mood === 'sad' ? 'happy' : mood} className="anim-bob" />}
      <div className="font-display text-2xl font-black">{title}</div>
      {children && <div className="max-w-sm text-[var(--muted)]">{children}</div>}
    </div>
  )
}

export function LookUp({ text = 'Olhe para o telão 👀' }: { text?: string }) {
  return <div className="mb-3 rounded-full bg-[var(--purpura)] px-4 py-1 text-center font-display text-sm font-extrabold text-white">{text}</div>
}

export function PhoneTimer({ end, now }: { end: number; now: number }) {
  const s = Math.max(0, Math.ceil((end - now) / 1000))
  return <div className={`font-display tabular text-xl font-black ${s <= 5 ? 'text-[var(--fogo)]' : 'text-[var(--muted)]'}`}>⏱ {s}s</div>
}

export function MCPad({ n = 4, onPick, picked, hide = [], disabled, labels }: { n?: number; onPick: (i: number) => void; picked?: number | null; hide?: number[]; disabled?: boolean; labels?: string[] }) {
  return (
    <div className="grid flex-1 grid-cols-2 gap-3 text-lg">
      {Array.from({ length: n }).map((_, i) => (
        <AnswerTile
          key={i}
          i={i}
          text={labels?.[i]}
          onClick={() => onPick(i)}
          disabled={disabled || picked != null || hide.includes(i)}
          state={picked === i ? 'picked' : picked != null || hide.includes(i) ? 'dim' : undefined}
          style={{ minHeight: labels ? '5.2em' : '8em', justifyContent: labels ? 'flex-start' : 'center' }}
        />
      ))}
    </div>
  )
}

export function Spotlight({ p, label, size = '9em' }: { p?: Player; label?: ReactNode; size?: string }) {
  if (!p) return null
  return (
    <div className="anim-pop flex flex-col items-center">
      <div className="relative">
        <div className="absolute inset-[-12%] rounded-full bg-[radial-gradient(circle,rgba(255,200,80,.55),transparent_65%)]" />
        <Avatar id={p.avatar} color={p.color} size={size} />
      </div>
      <div className="-mt-[0.4em] rounded-full bg-[var(--ouro)] px-[0.9em] py-[0.1em] font-display text-[1.5em] font-black text-[#2a1d00]">{p.name}</div>
      {label && <div className="mt-[0.3em] text-[1.1em] opacity-80">{label}</div>}
    </div>
  )
}

export function pct(n: number, total: number) {
  return total ? Math.round((n / total) * 100) : 0
}
