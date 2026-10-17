import { useState } from 'react'
import { MODES, currentWeek, modeCounts, useCatalog, type Mode } from '../content'
import type { Catalog, CatalogItem } from '../content/types'
import { Link, navigate } from '../router'
import { Btn, Logo, PackLoading } from '../ui/kit'

/** Escolha do conteúdo: Lição (trimestre → semana), Temas (categoria → tema) ou Livros (livro → capítulo). */
export function Choose({ mode }: { mode: string }) {
  const { catalog, error } = useCatalog()
  if (!catalog) return <PackLoading error={error} />
  const m: Mode = mode === 'temas' || mode === 'livros' ? mode : 'licao'
  return <ChooseView catalog={catalog} mode={m} />
}

function ChooseView({ catalog, mode }: { catalog: Catalog; mode: Mode }) {
  const counts = modeCounts(catalog)
  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-5 px-4 py-6">
      <header className="flex items-center justify-between">
        <Link to="/">
          <Logo size="1.2rem" />
        </Link>
        <Link to="/como-funciona" className="font-display font-extrabold text-[var(--azul)]">
          Como funciona?
        </Link>
      </header>
      <div>
        <h1 className="font-display text-3xl font-black">O que vamos jogar?</h1>
        <p className="text-[var(--muted)]">Escolha o conteúdo. O que ainda está 🔒 em preparo vai sendo liberado aos poucos.</p>
      </div>

      <nav className="grid grid-cols-3 gap-2" aria-label="Modos">
        {MODES.map((x) => {
          const on = x.id === mode
          return (
            <button
              key={x.id}
              onClick={() => navigate(`/escolher/${x.id}`, true)}
              aria-current={on ? 'page' : undefined}
              className="card flex flex-col items-center gap-1 p-3 text-center sm:flex-row sm:text-left"
              style={{ borderColor: on ? 'var(--purpura)' : undefined, background: on ? 'rgba(123,63,228,.08)' : undefined }}
            >
              <span className="text-3xl">{x.emoji}</span>
              <span className="min-w-0">
                <span className="block font-display font-black leading-tight">{x.title}</span>
                <span className="block text-xs font-bold text-[var(--muted)]">
                  {counts[x.id].ready} de {counts[x.id].total} prontos
                </span>
              </span>
            </button>
          )
        })}
      </nav>

      {mode === 'licao' && <Lessons catalog={catalog} />}
      {mode === 'temas' && <Themes catalog={catalog} />}
      {mode === 'livros' && <Books catalog={catalog} />}
    </div>
  )
}

const play = (pack: string) => navigate(`/criar/${pack}`)

/** Um item do catálogo: jogável (botão) ou travado (em preparo). */
function ItemCard({ item, badge, lead, highlight }: { item: CatalogItem; badge?: string; lead: React.ReactNode; highlight?: boolean }) {
  const ready = !!item.pack
  return (
    <div
      className="card flex items-center gap-3 p-3"
      style={{ opacity: ready ? 1 : 0.62, borderColor: highlight ? 'var(--ouro)' : undefined, boxShadow: highlight ? '0 0 0 3px rgba(255,183,3,.25)' : undefined }}
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl font-display text-xl font-black" style={{ background: ready ? 'var(--purpura)' : 'var(--line)', color: ready ? '#fff' : 'var(--muted)' }}>
        {lead}
      </div>
      <div className="min-w-0 flex-1">
        {badge && <div className="text-xs font-black tracking-wide text-[var(--ouro-s)] uppercase">{badge}</div>}
        <div className="font-display text-lg font-black leading-tight">{item.title}</div>
        <div className="truncate text-xs text-[var(--muted)]">{[item.dates, item.keyText].filter(Boolean).join(' · ')}</div>
      </div>
      {ready ? (
        <Btn className="!px-4 !py-2 !text-base" onClick={() => play(item.pack!)}>
          Jogar ▶
        </Btn>
      ) : (
        <span className="shrink-0 text-right text-xs font-bold text-[var(--muted)]">
          🔒
          <br />
          em preparo
        </span>
      )}
    </div>
  )
}

function Lessons({ catalog }: { catalog: Catalog }) {
  const [aud, setAud] = useState(catalog.lessons[0]?.audience)
  const now = currentWeek(catalog)
  const lesson = catalog.lessons.find((l) => l.audience === aud) ?? catalog.lessons[0]
  if (!lesson) return <Empty text="Nenhum trimestre cadastrado ainda." />
  return (
    <div className="flex flex-col gap-5">
      {catalog.lessons.length > 1 && (
        <div className="flex gap-2">
          {catalog.lessons.map((l) => (
            <button key={l.audience} onClick={() => setAud(l.audience)} className="rounded-full border-2 px-4 py-1 font-bold" style={{ borderColor: l.audience === lesson.audience ? 'var(--purpura)' : 'var(--line)' }}>
              {l.label}
            </button>
          ))}
        </div>
      )}
      {lesson.quarters.map((q) => (
        <section key={q.id} className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-black">
              {q.label} · {lesson.label}
            </h2>
            <span className="text-sm font-bold text-[var(--muted)]">
              {q.weeks.filter((w) => w.pack).length} de {q.weeks.length} semanas prontas
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {q.weeks.map((w) => {
              const isNow = now?.week.id === w.id
              return <ItemCard key={w.id} item={w} lead={w.n} highlight={isNow} badge={isNow ? 'Esta semana' : undefined} />
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

function Themes({ catalog }: { catalog: Catalog }) {
  if (!catalog.themes.length) return <Empty text="Nenhum tema cadastrado ainda." />
  return (
    <div className="flex flex-col gap-5">
      {catalog.themes.map((t) => (
        <section key={t.category} className="flex flex-col gap-2">
          <h2 className="font-display text-xl font-black">{t.category}</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {t.items.map((i) => (
              <ItemCard key={i.id} item={i} lead={i.emoji ?? '📖'} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function Books({ catalog }: { catalog: Catalog }) {
  if (!catalog.books.length) return <Empty text="Nenhum livro cadastrado ainda." />
  return (
    <div className="flex flex-col gap-5">
      {catalog.books.map((b) => {
        const ready = b.chapters.filter((c) => c.pack).length
        return (
          <section key={b.id} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-xl font-black">
                {b.emoji ?? '📚'} {b.title} <span className="text-base font-bold text-[var(--muted)]">· {b.author}</span>
              </h2>
              <span className="text-sm font-bold text-[var(--muted)]">
                {ready} de {b.chapters.length} {b.chapters.length === 1 ? 'capítulo pronto' : 'capítulos prontos'}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {b.chapters.map((c) => (
                <ItemCard key={c.id} item={{ ...c, title: `Cap. ${c.n} · ${c.title}` }} lead={c.n} />
              ))}
              <ItemCard item={{ id: `${b.id}-todo`, title: 'O livro todo', keyText: 'Junta os capítulos prontos numa partida só (em breve)', pack: null }} lead="📚" />
            </div>
          </section>
        )
      })}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="card p-6 text-center text-[var(--muted)]">{text}</div>
}
