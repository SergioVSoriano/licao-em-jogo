import { DEFAULT_PACK } from '../content'
import type { ContentPack } from '../content/types'
import { DAYS } from '../content/types'
import { Link } from '../router'
import { Logo } from '../ui/kit'

export function RoloContent({ pack }: { pack: ContentPack }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl p-5 text-white" style={{ background: 'linear-gradient(135deg,#2b2263,#7b3fe4)' }}>
        <div className="text-xs font-bold tracking-widest uppercase opacity-80">📜 Rolo da Lição · {pack.dates}</div>
        <div className="font-display text-3xl font-black">{pack.title}</div>
        <div className="mt-1 text-sm opacity-90">Texto da semana: {pack.keyText}</div>
        <div className="mt-3 font-semibold">{pack.bigIdea}</div>
      </div>
      <div>
        <div className="mb-2 font-display text-xl font-black">As 7 verdades da semana</div>
        <div className="flex flex-col gap-2">
          {pack.truths.map((t) => (
            <div key={t.id} className="card flex gap-3 p-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--ouro)] font-display font-black text-[#2a1d00]">{DAYS.find((d) => d.id === t.day)?.label.slice(0, 3)}</div>
              <div>
                <div className="font-display font-black">{t.title}</div>
                <div className="text-sm">{t.text}</div>
                <div className="text-xs font-bold text-[var(--purpura)]">{t.refs.join(' · ')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 font-display text-xl font-black">Versos para guardar</div>
        <div className="grid gap-2">
          {pack.summary.verses.map((v) => (
            <div key={v.ref} className="card p-3">
              <div className="font-display font-black text-[var(--purpura)]">{v.ref}</div>
              <div className="text-sm">{v.text}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 font-display text-xl font-black">Para pensar nesta semana</div>
        <div className="flex flex-col gap-2">
          {pack.summary.questions.map((q) => (
            <div key={q} className="rounded-2xl border-2 border-dashed border-[var(--ouro)] p-3 font-semibold">
              🗣️ {q}
            </div>
          ))}
        </div>
      </div>
      <div className="text-center text-xs text-[var(--muted)]">Leitura extra: Ellen G. White, Profetas e Reis, cap. 14, "No espírito e virtude de Elias".</div>
    </div>
  )
}

export function Rolo() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6">
      <Link to="/">
        <Logo size="1.2rem" />
      </Link>
      <RoloContent pack={DEFAULT_PACK} />
    </div>
  )
}
