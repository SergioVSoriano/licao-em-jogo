import { useState } from 'react'
import { useDefaultPack } from '../content'
import type { ContentPack } from '../content/types'
import { REWARDS } from '../engine/session'
import { GAMES, KIND_LABEL } from '../games'
import { Link, navigate } from '../router'
import { Avatar } from '../ui/avatars'
import { HowToCard } from '../ui/HowToCard'
import { Btn, Logo, Lume, PackLoading } from '../ui/kit'
import { SanctuaryMap } from '../ui/SanctuaryMap'
import type { Player } from '../engine/types'

const demoPlayers: Player[] = ['elias', 'debora', 'samuel', 'miria', 'davi', 'ester'].map((a, i) => ({
  id: a,
  name: ['Ana', 'Léo', 'Bia', 'Caio', 'Duda', 'Gabi'][i],
  avatar: a,
  color: i,
  noSpotlight: false,
  online: true,
  joinedAt: 0,
  steps: [2, 5, 8, 11, 13, 16][i],
  firsts: 0,
  normSum: 0,
  xpTotal: 0,
}))

function Section({ id, title, emoji, children }: { id: string; title: string; emoji: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-4">
      <h2 className="mb-3 flex items-center gap-2 font-display text-2xl font-black sm:text-3xl">
        <span>{emoji}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

export function HowItWorks() {
  const { pack, error } = useDefaultPack()
  if (!pack) return <PackLoading error={error} />
  return <HowItWorksView pack={pack} />
}

function HowItWorksView({ pack }: { pack: ContentPack }) {
  const [open, setOpen] = useState<string | null>(GAMES[0].id)
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-6">
      <header className="flex items-center justify-between">
        <Link to="/">
          <Logo size="1.3rem" />
        </Link>
        <Btn onClick={() => navigate('/criar')}>Criar sala ▶</Btn>
      </header>

      <div className="flex flex-col items-center gap-3 text-center">
        <Lume size={110} className="anim-bob" mood="wink" />
        <h1 className="font-display text-4xl font-black sm:text-5xl">Como funciona o Lição em Jogo</h1>
        <p className="max-w-2xl text-lg text-[var(--muted)]">Um jogo para jogar junto, na mesma sala. O telão mostra as perguntas e o mapa, e o celular de cada um vira o controle, como no Kahoot.</p>
        <nav className="mt-2 flex flex-wrap justify-center gap-2 text-sm font-bold">
          {[
            ['passo', '1 minuto'],
            ['precisa', 'Do que preciso'],
            ['mapa', 'O mapa'],
            ['pontos', 'Pontos'],
            ['jogos', 'Os 12 jogos'],
            ['facilitador', 'Facilitador'],
            ['faq', 'Dúvidas'],
          ].map(([id, t]) => (
            <a key={id} href={`#${id}`} className="rounded-full border-2 border-[var(--line)] bg-[var(--card)] px-3 py-1 hover:border-[var(--azul)]">
              {t}
            </a>
          ))}
        </nav>
      </div>

      <Section id="passo" title="Em 1 minuto" emoji="⏱️">
        <div className="grid gap-3 sm:grid-cols-5">
          {[
            { e: '🧑‍🏫', t: 'Crie a sala', d: 'O facilitador escolhe o tempo (ex.: 35 min) e os jogos. O planejador avisa o que cabe.' },
            { e: '📷', t: 'Todos entram', d: 'Cada um lê o QR do telão, digita o nome e escolhe um personagem bíblico.' },
            { e: '🎮', t: 'Joguem!', d: 'Minijogos curtos. As regras aparecem no telão e no celular antes de cada um.' },
            { e: '💬', t: 'Conversem', d: 'Depois de cada jogo vem o Momento Revelação: um versículo, uma ideia e uma pergunta.' },
            { e: '✨', t: 'O véu se abre', d: 'Os pontos viram passos no santuário. No fim, todos entram no Santíssimo.' },
          ].map((x, i) => (
            <div key={x.t} className="card relative p-4">
              <div className="absolute right-3 top-2 font-display text-3xl font-black text-[var(--line)]">{i + 1}</div>
              <div className="text-3xl">{x.e}</div>
              <div className="font-display text-lg font-black">{x.t}</div>
              <div className="text-sm text-[var(--muted)]">{x.d}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="precisa" title="Do que você precisa" emoji="🎒">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="card p-4">
            <div className="font-display text-lg font-black">💻 Uma tela para todos</div>
            <div className="text-sm text-[var(--muted)]">TV, projetor ou só o notebook virado para a turma. A tela se adapta: tudo cresce ou diminui junto.</div>
          </div>
          <div className="card p-4">
            <div className="font-display text-lg font-black">📱 Celulares</div>
            <div className="text-sm text-[var(--muted)]">Um por pessoa. Quem estiver sem celular entra em dupla (ex.: "Ana & Léo").</div>
          </div>
          <div className="card p-4">
            <div className="font-display text-lg font-black">📶 Internet</div>
            <div className="text-sm text-[var(--muted)]">Wi-Fi ou 4G. Usa poucos dados. Se alguém cair, é só abrir o link de novo: volta para o mesmo jogador.</div>
          </div>
        </div>
      </Section>

      <Section id="mapa" title="O mapa: o santuário" emoji="🕍">
        <p className="mb-3 text-[var(--muted)]">Cada jogo faz seu personagem andar pelo santuário: da Porta, passando pelo altar, pia, mesa dos pães, candelabro e altar de incenso, até o Véu. Ao passar por uma estação, o telão mostra o que ela significa.</p>
        <div className="overflow-hidden rounded-3xl" style={{ background: '#2b2263' }}>
          <SanctuaryMap players={demoPlayers} L={17} />
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          {pack.stations.map((s) => (
            <div key={s.id} className="card p-3 text-sm">
              <div className="font-display font-black">
                {s.emoji} {s.name}
              </div>
              <div className="text-[var(--muted)]">
                {s.meaning} <i>({s.ref})</i>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 rounded-2xl bg-[var(--linho-2)] p-3 text-sm text-[var(--tinta)]">
          🙏 <b>Ninguém "merece" o Santíssimo:</b> no final, o véu se rasga e <b>todos entram juntos</b>, com o vencedor à frente. "Temos ousadia para entrar no Santíssimo pelo sangue de Jesus" (Hb 10:19-20).
        </p>
      </Section>

      <Section id="pontos" title="Pontos e passos" emoji="👣">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="card p-4">
            <div className="font-display text-lg font-black">⭐ Pontos (dentro de cada jogo)</div>
            <div className="text-sm text-[var(--muted)]">Cada jogo tem os próprios pontos: acertos, rapidez, sequências, votos… O placar aparece ao fim de cada jogo.</div>
          </div>
          <div className="card p-4">
            <div className="font-display text-lg font-black">👣 Passos (no mapa)</div>
            <div className="text-sm text-[var(--muted)]">
              Ao fim de cada jogo, os pontos viram de <b>1 a 4 passos</b> (proporcional ao melhor do jogo), e o <b>1º lugar ganha +1</b>. Assim, funciona igual com 3 ou com 30 pessoas. Só fica parado quem terminou com pontos negativos.
            </div>
          </div>
          <div className="card p-4">
            <div className="font-display text-lg font-black">🍞 Pão e Água</div>
            <div className="text-sm text-[var(--muted)]">Quem está por último no mapa ganha +1 passo depois de cada jogo: "Levanta-te e come, porque o caminho é longo" (1Rs 19:7). Deus cuida antes de cobrar!</div>
          </div>
          <div className="card p-4">
            <div className="font-display text-lg font-black">🏆 Quem vence?</div>
            <div className="text-sm text-[var(--muted)]">Mais passos. Empate? Quem ganhou mais jogos e, depois, quem teve o melhor desempenho somado.</div>
          </div>
        </div>
        <div className="card mt-3 p-4">
          <div className="mb-2 font-display text-lg font-black">🃏 Cartas de recompensa (1º lugar de cada jogo escolhe uma)</div>
          <div className="grid gap-2 sm:grid-cols-5">
            {Object.values(REWARDS).map((r) => (
              <div key={r.name} className="rounded-xl bg-[var(--linho-2)] p-3 text-sm text-[var(--tinta)]">
                <div className="text-2xl">{r.emoji}</div>
                <div className="font-display font-black">{r.name}</div>
                <div>{r.text}</div>
                {r.ref && <i className="opacity-70">{r.ref}</i>}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section id="jogos" title="Os 12 jogos" emoji="🎮">
        <div className="mb-3 flex flex-wrap gap-2 text-sm">
          {Object.values(KIND_LABEL).map((k) => (
            <span key={k.label} className="rounded-full bg-[var(--card)] px-3 py-1 font-bold">
              {k.emoji} {k.label}: {k.text}
            </span>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-[18rem_1fr]">
          <div className="flex flex-row gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-visible">
            {GAMES.map((g) => (
              <button
                key={g.id}
                onClick={() => setOpen(g.id)}
                className="flex shrink-0 items-center gap-2 rounded-2xl border-2 px-3 py-2 text-left font-display font-extrabold transition"
                style={{ borderColor: open === g.id ? g.accent : 'var(--line)', background: open === g.id ? 'var(--card)' : 'transparent' }}
              >
                <span className="text-2xl">{g.icon}</span>
                <span>{g.name}</span>
              </button>
            ))}
          </div>
          <div className="card p-5">{open && <HowToCard g={GAMES.find((g) => g.id === open)!} />}</div>
        </div>
      </Section>

      <Section id="facilitador" title="Para o facilitador" emoji="🧑‍🏫">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="card p-4 text-sm">
            <div className="mb-2 font-display text-lg font-black">⌨️ Atalhos no notebook</div>
            <ul className="flex flex-col gap-1">
              <li>
                <kbd className="rounded border px-1">Espaço</kbd> avança / ação principal
              </li>
              <li>
                <kbd className="rounded border px-1">1</kbd> acerto · <kbd className="rounded border px-1">2</kbd> erro (jogos falados)
              </li>
              <li>
                <kbd className="rounded border px-1">F</kbd> tela cheia · <kbd className="rounded border px-1">M</kbd> som
              </li>
            </ul>
          </div>
          <div className="card p-4 text-sm">
            <div className="mb-2 font-display text-lg font-black">📲 Controle no celular</div>
            Na sala de espera há um QR Code de <b>Controle</b>. Com ele, o seu celular vira um controle remoto: avançar, ✓/✗, dar ⭐ Palavra de Ouro e ver a nota de condução de cada Momento Revelação, andando pela sala.
          </div>
          <div className="card p-4 text-sm">
            <div className="mb-2 font-display text-lg font-black">⏱️ O planejador de tempo</div>
            Diga quantos minutos vocês têm. Ele estima cada jogo pelo número de pessoas, corta rodadas quando passa do tempo e bloqueia o início se não couber. Marque ♥ no jogo favorito para ele ganhar mais rodadas.
          </div>
          <div className="card p-4 text-sm">
            <div className="mb-2 font-display text-lg font-black">💡 Dicas</div>
            Abra a sala antes da classe começar, para a turma entrar enquanto chega. No Momento Revelação, comece pela pergunta e deixe a turma falar. Quem é tímido pode ativar "Não me sortear".
          </div>
        </div>
      </Section>

      <Section id="faq" title="Dúvidas" emoji="❓">
        <div className="flex flex-col gap-2">
          {[
            ['Precisa instalar alguma coisa?', 'Não. É um site: abre no navegador do celular e do notebook.'],
            ['E se alguém chegar atrasado?', 'Entra pelo QR a qualquer momento e começa junto do último colocado.'],
            ['E se a internet cair?', 'Abra o mesmo link de novo. O telão retoma o jogo de onde parou e o jogador volta para o próprio personagem.'],
            ['Dá para jogar só um jogo?', 'Sim! Escolha 1 jogo e aumente as rodadas. O mapa se ajusta ao número de jogos.'],
            ['Não temos TV nem projetor.', 'Use o notebook virado para a turma. Todo o conteúdo também aparece no celular de cada um.'],
          ].map(([q, a]) => (
            <details key={q} className="card p-4">
              <summary className="cursor-pointer font-display font-black">{q}</summary>
              <p className="mt-2 text-[var(--muted)]">{a}</p>
            </details>
          ))}
        </div>
      </Section>

      <div className="flex flex-col items-center gap-3 pb-10 text-center">
        <div className="flex gap-2">
          <Avatar id="moises" size={70} />
          <Avatar id="ester" size={70} />
          <Avatar id="pedro" size={70} />
        </div>
        <Btn className="!text-xl" onClick={() => navigate('/criar')}>
          Bora jogar? Criar sala ▶
        </Btn>
      </div>
    </div>
  )
}
