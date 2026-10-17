import { useState } from 'react'
import { useDefaultPack } from '../content'
import type { ContentPack } from '../content/types'
import { isDemo } from '../net'
import { Link, navigate } from '../router'
import { Avatar } from '../ui/avatars'
import { Btn, Logo, Lume, PackLoading } from '../ui/kit'

export function DemoBanner() {
  if (!isDemo) return null
  return (
    <div className="rounded-2xl border-2 border-dashed border-[var(--ouro)] bg-[#fff6dc] p-3 text-sm text-[#5c4300]">
      <b>🧪 Modo demonstração:</b> sem o Firebase configurado, o jogo funciona entre <b>abas deste mesmo navegador</b> (telão numa aba, jogadores em outras) e com <b>jogadores-robô</b>. Para jogar com os celulares da turma, configure o Firebase (veja o README).
    </div>
  )
}

export function Home() {
  const { pack, error } = useDefaultPack()
  if (!pack) return <PackLoading error={error} />
  return <HomeView pack={pack} />
}

function HomeView({ pack }: { pack: ContentPack }) {
  const [pin, setPin] = useState('')
  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-4 py-6 sm:py-10">
      <header className="flex items-center justify-between">
        <Logo size="1.5rem" />
        <Link to="/como-funciona" className="font-display font-extrabold text-[var(--azul)] hover:underline">
          Como funciona?
        </Link>
      </header>

      <section className="relative overflow-hidden rounded-[2rem] px-6 py-8 text-white sm:px-10 sm:py-12" style={{ background: 'radial-gradient(120% 120% at 20% 0%, #3a2f80 0%, #2b2263 45%, #1b1840 100%)' }}>
        <div className="stage-pattern" />
        <div className="relative grid items-center gap-6 sm:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-sm font-bold">
              📖 {pack.subtitle} · {pack.dates}
            </div>
            <h1 className="font-display text-4xl font-black leading-[1.05] sm:text-6xl">
              A lição que se <span className="text-[var(--ouro)]">joga junto</span>.
            </h1>
            <p className="mt-4 max-w-md text-lg opacity-90">
              Minijogos rápidos, cada um com o celular na mão, e um caminho pelo santuário até o véu se abrir. Para aprender, rir e conversar sobre a Palavra.
            </p>
          </div>
          <div className="relative flex items-end justify-center gap-2">
            <Avatar id="elias" size={110} className="anim-bob" />
            <Lume size={120} className="anim-bob" />
            <Avatar id="debora" size={110} className="anim-bob" style={{ animationDelay: '.4s' }} />
          </div>
        </div>
      </section>

      <DemoBanner />

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="card flex flex-col gap-3 p-5">
          <div className="text-4xl">🧑‍🏫</div>
          <div className="font-display text-2xl font-black">Sou o facilitador</div>
          <p className="text-[var(--muted)]">Escolha quanto tempo vocês têm, quais jogos jogar e abra a sala no notebook, TV ou projetor.</p>
          <Btn className="mt-auto !text-xl" onClick={() => navigate('/criar')}>
            Criar sala ▶
          </Btn>
        </div>
        <form
          className="card flex flex-col gap-3 p-5"
          onSubmit={(e) => {
            e.preventDefault()
            if (pin.trim().length >= 4) navigate(`/j/${pin.trim()}`)
          }}
        >
          <div className="text-4xl">📱</div>
          <div className="font-display text-2xl font-black">Sou jogador</div>
          <p className="text-[var(--muted)]">Leia o QR Code do telão, ou digite o PIN da sala:</p>
          <input className="field text-center font-display !text-3xl font-black tracking-[0.3em]" inputMode="numeric" placeholder="PIN" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
          <Btn tone="blue" className="!text-xl" disabled={pin.length < 6} type="submit">
            Entrar ▶
          </Btn>
        </form>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { e: '📷', t: 'Entra pelo QR', d: 'Sem conta, sem app. Nome, personagem e pronto.' },
          { e: '🎮', t: '12 minijogos', d: 'Quiz, nuvem de palavras, mímica, duelos, times…' },
          { e: '🗣️', t: 'Debate de verdade', d: 'Depois de cada jogo, o Momento Revelação puxa a conversa.' },
        ].map((x) => (
          <div key={x.t} className="card p-4">
            <div className="text-3xl">{x.e}</div>
            <div className="font-display text-lg font-black">{x.t}</div>
            <div className="text-sm text-[var(--muted)]">{x.d}</div>
          </div>
        ))}
      </section>

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4 text-sm text-[var(--muted)]">
        <span>
          Lição desta semana: <b>{pack.title}</b> · {pack.keyText}
        </span>
        <span className="flex gap-4">
          <Link to="/rolo" className="hover:underline">
            📜 Resumo da lição
          </Link>
          <Link to="/como-funciona" className="hover:underline">
            ❓ Como funciona
          </Link>
        </span>
      </footer>
    </div>
  )
}
