import { sectionLabel, usePackOrDefault } from '../content'
import type { ContentPack } from '../content/types'
import { Link } from '../router'
import { Logo, PackLoading } from '../ui/kit'
import { DownloadRolo, TruthCard } from '../ui/RoloPoster'

export function RoloContent({ pack }: { pack: ContentPack }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl p-5 text-white" style={{ background: 'linear-gradient(135deg,#2b2263,#7b3fe4)' }}>
        <div className="text-xs font-bold tracking-widest uppercase opacity-80">📜 Rolo da Lição · {pack.dates}</div>
        <div className="font-display text-3xl font-black">{pack.title}</div>
        <div className="mt-1 text-sm opacity-90">Texto da semana: {pack.keyText}</div>
        <div className="mt-3 font-semibold">{pack.bigIdea}</div>
      </div>
      <DownloadRolo pack={pack} />
      <div>
        <div className="mb-2 font-display text-xl font-black">As 7 verdades da semana</div>
        <div className="flex flex-col gap-3">
          {pack.truths.map((t) => (
            <TruthCard key={t.id} t={t} label={sectionLabel(pack, t.section)} />
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

export function Rolo({ packId }: { packId?: string }) {
  const { pack, error } = usePackOrDefault(packId)
  if (!pack) return <PackLoading error={error} />
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6">
      <Link to="/">
        <Logo size="1.2rem" />
      </Link>
      <RoloContent pack={pack} />
    </div>
  )
}
