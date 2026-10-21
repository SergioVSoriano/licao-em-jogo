import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePack } from '../content'
import type { DetalhePacote, ItemGerado, ItemOrigem } from '../content/curadoria'
import { hasContent, maxRounds } from '../engine/planner'
import { GAMES } from '../games'
import { Link, navigate } from '../router'
import { Btn, Logo, Lume } from '../ui/kit'

type Estado = { erros: string[]; avisos: string[]; detalhes: DetalhePacote[] }
type Autoria = Record<'pacote' | 'jogos' | 'reflexoes', Record<string, unknown> | null>

const API = '/__curadoria'

async function api<T>(caminho: string, corpo?: unknown): Promise<T> {
  const r = await fetch(API + caminho, corpo ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) } : undefined)
  const tipo = r.headers.get('content-type') ?? ''
  if (!tipo.includes('json')) throw new Error('fora-do-dev')
  const j = await r.json()
  if (!r.ok) throw new Error(j.erro ?? `erro ${r.status}`)
  return j as T
}

/** Página do curador: revisar o que a IA organizou, aprovar e publicar. Só funciona no `npm run dev`. */
export function Curadoria({ id }: { id?: string }) {
  const [estado, setEstado] = useState<Estado | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const carregar = useCallback(() => {
    api<Estado>('/estado').then(
      (e) => (setEstado(e), setErro(null)),
      (e) => setErro(String(e.message)),
    )
  }, [])
  useEffect(() => {
    carregar()
    window.addEventListener('focus', carregar)
    return () => window.removeEventListener('focus', carregar)
  }, [carregar])

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-5 px-4 py-6">
      <header className="flex items-center justify-between gap-3">
        <Link to="/">
          <Logo size="1.2rem" />
        </Link>
        <Link to="/curadoria" className="font-display font-extrabold text-[var(--azul)]">
          📝 Curadoria
        </Link>
      </header>
      {erro === 'fora-do-dev' ? (
        <ForaDoDev />
      ) : erro ? (
        <div className="card p-5 text-[var(--carmesim)]">❌ {erro}</div>
      ) : !estado ? (
        <div className="grid place-items-center py-20">
          <Lume size={100} className="anim-bob" />
        </div>
      ) : id ? (
        <Detalhe estado={estado} id={id} recarregar={carregar} />
      ) : (
        <Lista estado={estado} />
      )}
    </div>
  )
}

function ForaDoDev() {
  return (
    <div className="card flex flex-col items-center gap-3 p-8 text-center">
      <Lume size={90} mood="wow" />
      <div className="font-display text-2xl font-black">A curadoria funciona no computador do curador</div>
      <p className="max-w-lg text-[var(--muted)]">
        Abra o projeto e rode <code className="rounded bg-[var(--line)] px-1">npm run dev</code>. Depois acesse <b>http://localhost:5173/curadoria</b>. Aprovar e publicar mexem nos arquivos do conteúdo, por isso não ficam no site público.
      </p>
    </div>
  )
}

const STATUS: Record<string, { t: string; bg: string; fg: string }> = {
  publicado: { t: 'Publicado', bg: '#e6fbd8', fg: 'var(--oliveira-s)' },
  rascunho: { t: 'Rascunho', bg: '#fff3cf', fg: '#8a6100' },
  desconhecido: { t: 'Com erro', bg: '#ffe1e1', fg: 'var(--carmesim-s)' },
}

function Chip({ children, bg, fg }: { children: React.ReactNode; bg: string; fg: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-black whitespace-nowrap" style={{ background: bg, color: fg }}>
      {children}
    </span>
  )
}

function Lista({ estado }: { estado: Estado }) {
  const ordem = [...estado.detalhes].sort((a, b) => Number(a.status === 'publicado') - Number(b.status === 'publicado') || a.pasta.localeCompare(b.pasta))
  return (
    <>
      <div>
        <h1 className="font-display text-3xl font-black">Curadoria do conteúdo</h1>
        <p className="text-[var(--muted)]">Revise o que a IA organizou a partir do seu caderno, aprove e publique. Nada vai para o jogo sem passar por aqui.</p>
      </div>
      <div className="card flex flex-col gap-2 p-4 text-sm">
        <div className="font-display text-lg font-black">Como preparar um conteúdo novo</div>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Numa conversa com o Claude neste projeto, digite <b>/montar-pacote</b> e diga o que quer preparar (ex.: “Lição 4 do 4º trimestre”, “tema Noé”).
          </li>
          <li>Anexe ou cole o seu material: anotações, PDFs, transcrições, versículos. Sem formato fixo.</li>
          <li>O Claude guarda tudo no seu caderno, organiza nos campos do jogo e marca o que ele mesmo escreveu.</li>
          <li>Volte aqui, revise cada item, aprove e clique em Publicar. Depois é só pedir o commit e o deploy.</li>
        </ol>
      </div>
      {estado.erros.length > 0 && <Mensagens titulo="Erros que travam o site" itens={estado.erros} cor="var(--carmesim)" />}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ordem.map((d) => {
          const st = STATUS[d.status]
          return (
            <button key={d.pasta} onClick={() => d.id && navigate(`/curadoria/${d.id}`)} className="card flex flex-col gap-2 p-4 text-left transition hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-display text-lg font-black leading-tight">{d.titulo ?? d.pasta}</div>
                  <div className="truncate text-xs text-[var(--muted)]">{d.id ?? d.pasta}</div>
                </div>
                <Chip bg={st.bg} fg={st.fg}>
                  {st.t}
                </Chip>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {d.erros.length > 0 && (
                  <Chip bg="#ffe1e1" fg="var(--carmesim-s)">
                    ❌ {d.erros.length} erro(s)
                  </Chip>
                )}
                {d.pendentes > 0 && (
                  <Chip bg="#efe7ff" fg="var(--purpura-s)">
                    👀 {d.pendentes} para revisar
                  </Chip>
                )}
                <Chip bg="var(--line)" fg="var(--muted)">
                  📓 {d.temCaderno ? `caderno: ${d.arquivosCaderno.length} arquivo(s)` : 'sem caderno'}
                </Chip>
                {d.podePublicar && d.status !== 'publicado' && (
                  <Chip bg="#e6fbd8" fg="var(--oliveira-s)">
                    ✅ pronto para publicar
                  </Chip>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}

function Mensagens({ titulo, itens, cor }: { titulo: string; itens: string[]; cor: string }) {
  if (!itens.length) return null
  return (
    <div className="card flex flex-col gap-1 p-4 text-sm" style={{ borderColor: cor }}>
      <div className="font-display font-black" style={{ color: cor }}>
        {titulo}
      </div>
      <ul className="list-disc space-y-1 pl-5">
        {itens.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
    </div>
  )
}

/** Pega um item do YAML de autoria pelo caminho. */
function pegar(autoria: Autoria | null, arquivo: string, caminho: (string | number)[]): unknown {
  if (!autoria) return undefined
  let x: unknown = autoria[arquivo.replace('.yaml', '') as keyof Autoria]
  for (const k of caminho) x = x && typeof x === 'object' ? (x as Record<string | number, unknown>)[k] : undefined
  return x
}

const ESCONDER = new Set(['origem', 'base'])

/** Mostra os campos de um item do YAML de forma legível. */
function Campos({ valor }: { valor: unknown }) {
  if (valor == null) return null
  if (typeof valor !== 'object') return <div className="text-sm">{String(valor)}</div>
  if (Array.isArray(valor)) return <div className="text-sm">{valor.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(' · ')}</div>
  return (
    <dl className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-sm">
      {Object.entries(valor as Record<string, unknown>)
        .filter(([k]) => !ESCONDER.has(k))
        .map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="truncate font-bold text-[var(--muted)]">{k}</dt>
            <dd className="min-w-0 break-words">
              {Array.isArray(v) ? v.map((x) => (typeof x === 'object' ? Object.values(x as object).join(': ') : String(x))).join(' · ') : typeof v === 'object' && v ? Object.entries(v).map(([a, b]) => `${a}: ${typeof b === 'object' ? JSON.stringify(b) : String(b)}`).join(' · ') : String(v)}
            </dd>
          </div>
        ))}
    </dl>
  )
}

function Detalhe({ estado, id, recarregar }: { estado: Estado; id: string; recarregar: () => void }) {
  const d = estado.detalhes.find((x) => x.id === id)
  const [autoria, setAutoria] = useState<Autoria | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const { pack } = usePack(d && d.erros.length === 0 ? id : null)
  const versaoEstado = JSON.stringify(d?.gerados.length) + JSON.stringify(d?.origem.length)

  useEffect(() => {
    api<Autoria>(`/autoria?id=${encodeURIComponent(id)}`).then(setAutoria, () => setAutoria(null))
  }, [id, versaoEstado])

  const acao = async (corpo: Record<string, unknown>, pergunta?: string) => {
    if (pergunta && !confirm(pergunta)) return
    setOcupado(true)
    setMsg(null)
    try {
      const r = await api<{ n: number }>('/acao', { id, ...corpo })
      if (corpo.acao === 'publicar') setMsg('✅ Publicado! Agora peça o commit e o deploy para liberar no site.')
      else if (corpo.acao === 'aprovar-todos') setMsg(`✅ ${r.n} item(ns) aprovado(s).`)
      recarregar()
      api<Autoria>(`/autoria?id=${encodeURIComponent(id)}`).then(setAutoria, () => {})
    } catch (e) {
      setMsg(`❌ ${(e as Error).message}`)
    } finally {
      setOcupado(false)
    }
  }

  const jogos = useMemo(() => (pack ? GAMES.map((g) => ({ g, ok: hasContent(g, pack), n: maxRounds(g, pack) })) : null), [pack])
  const grupos = useMemo(() => {
    const m = new Map<string, ItemGerado[]>()
    for (const g of d?.gerados ?? []) m.set(g.tipo, [...(m.get(g.tipo) ?? []), g])
    return [...m.entries()]
  }, [d])

  if (!d) return <div className="card p-5">Pacote “{id}” não encontrado. <Link to="/curadoria">Voltar</Link></div>
  const st = STATUS[d.status]
  const cont = (s: string) => d.origem.filter((o) => o.status === s).length
  const sinteses = d.origem.filter((o) => o.pendente).length

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to="/curadoria" className="text-sm font-bold text-[var(--azul)]">
            ← Todos os pacotes
          </Link>
          <h1 className="font-display text-3xl font-black leading-tight">{d.titulo ?? d.pasta}</h1>
          <div className="text-sm text-[var(--muted)]">
            {d.id} · {d.pasta}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip bg={st.bg} fg={st.fg}>
            {st.t}
          </Chip>
          {pack && (
            <Btn ghost className="!px-3 !py-1.5 !text-sm" onClick={() => navigate(`/criar/${id}`)}>
              🎮 Testar no planejador
            </Btn>
          )}
          {d.status !== 'publicado' && (
            <Btn
              className="!px-4 !py-1.5 !text-sm"
              disabled={!d.podePublicar || ocupado}
              title={d.podePublicar ? 'Publicar para todos' : 'Resolva os erros e revise todos os itens antes'}
              onClick={() => acao({ acao: 'publicar' }, `Publicar “${d.titulo}”? Ele fica disponível para todos depois do deploy.`)}
            >
              🚀 Publicar
            </Btn>
          )}
        </div>
      </div>

      {msg && <div className="card p-3 font-bold">{msg}</div>}

      <div className="flex flex-wrap gap-2">
        {d.temCaderno ? (
          <>
            <Chip bg="#e6fbd8" fg="var(--oliveira-s)">✅ {cont('literal')} do caderno</Chip>
            <Chip bg="#fff3cf" fg="#8a6100">🟡 {cont('base')} síntese(s){sinteses ? `, ${sinteses} a aprovar` : ''}</Chip>
            <Chip bg="#ffe1e1" fg="var(--carmesim-s)">🔴 {cont('sem-origem')} sem origem</Chip>
          </>
        ) : (
          <Chip bg="#ffe1e1" fg="var(--carmesim-s)">📓 sem caderno: a origem não pode ser conferida</Chip>
        )}
        <Chip bg="#efe7ff" fg="var(--purpura-s)">🤖 {d.gerados.length} item(ns) criado(s) pela IA</Chip>
      </div>

      <Mensagens titulo={`Erros (${d.erros.length})`} itens={d.erros} cor="var(--carmesim)" />
      <Mensagens titulo={`Avisos (${d.avisos.length})`} itens={d.avisos} cor="var(--ouro-s)" />

      {d.temCaderno && (
        <div className="card p-4 text-sm">
          <div className="font-display font-black">📓 Caderno do curador ({d.arquivosCaderno.length})</div>
          <div className="text-[var(--muted)]">conteudo/fontes/{d.id}/: {d.arquivosCaderno.join(' · ') || 'vazio'}</div>
        </div>
      )}

      {jogos && (
        <div className="card p-4">
          <div className="mb-2 font-display font-black">🎮 Jogos com material neste pacote</div>
          <div className="flex flex-wrap gap-1.5">
            {jogos.map(({ g, ok, n }) => (
              <Chip key={g.id} bg={ok ? '#e6fbd8' : 'var(--line)'} fg={ok ? 'var(--oliveira-s)' : 'var(--muted)'}>
                {g.icon} {g.name} {ok ? `· até ${n} ${g.rounds.label}` : '🔒'}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {d.origem.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-xl font-black">💬 Interpretação: de onde veio cada texto</h2>
          <p className="text-sm text-[var(--muted)]">✅ está no seu caderno · 🟡 é um resumo do Claude, com os trechos do caderno que o sustentam: confira e aprove · 🔴 não tem origem no caderno.</p>
          {d.origem.map((o) => (
            <CartaoOrigem key={o.arquivo + o.caminho.join('.')} o={o} ocupado={ocupado} aprovar={() => acao({ acao: 'aprovar', arquivo: o.arquivo, caminho: o.caminho })} />
          ))}
        </section>
      )}

      {grupos.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-black">🤖 Criado pela IA: revise antes de publicar</h2>
          <p className="text-sm text-[var(--muted)]">Perguntas, alternativas, cartas e mímicas que o Claude montou a partir dos fatos do seu material. Aprove o que estiver certo e remova o resto.</p>
          {grupos.map(([tipo, itens]) => (
            <div key={tipo} className="card flex flex-col gap-2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-display text-lg font-black">
                  {tipo} <span className="text-sm text-[var(--muted)]">({itens.length})</span>
                </div>
                <Btn tone="blue" className="!px-3 !py-1 !text-sm" disabled={ocupado} onClick={() => acao({ acao: 'aprovar-todos', tipo }, `Aprovar os ${itens.length} itens de “${tipo}”? Confirme que você leu todos.`)}>
                  ✓ Aprovar todos
                </Btn>
              </div>
              {itens.map((g) => (
                <div key={g.arquivo + g.caminho.join('.')} className="flex flex-col gap-2 rounded-xl border-2 border-[var(--line)] p-3 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    {g.lista ? <div className="text-sm">{g.rotulo}</div> : <Campos valor={pegar(autoria, g.arquivo, g.caminho)} />}
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Btn className="!px-3 !py-1 !text-sm" disabled={ocupado} onClick={() => acao({ acao: 'aprovar', arquivo: g.arquivo, caminho: g.caminho })}>
                      ✓ Aprovar
                    </Btn>
                    <Btn tone="bad" className="!px-3 !py-1 !text-sm" disabled={ocupado} onClick={() => acao({ acao: 'remover', arquivo: g.arquivo, caminho: g.caminho }, 'Remover este item do pacote?')}>
                      ✕
                    </Btn>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </section>
      )}

      {d.pendentes === 0 && d.erros.length === 0 && d.status !== 'publicado' && (
        <div className="card p-4 font-bold text-[var(--oliveira-s)]">✅ Tudo revisado. Teste no planejador e, se estiver bom, clique em Publicar.</div>
      )}
    </>
  )
}

const ICONE: Record<string, string> = { literal: '✅', base: '🟡', 'sem-origem': '🔴' }

function CartaoOrigem({ o, ocupado, aprovar }: { o: ItemOrigem; ocupado: boolean; aprovar: () => void }) {
  const cor = o.status === 'literal' ? 'var(--line)' : o.status === 'base' ? (o.pendente ? 'var(--ouro)' : 'var(--line)') : 'var(--carmesim)'
  return (
    <div className="card flex flex-col gap-2 p-3" style={{ borderColor: cor }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-display font-black">
          {ICONE[o.status]} {o.rotulo}
        </div>
        {o.pendente && (
          <Btn className="!px-3 !py-1 !text-sm" disabled={ocupado} onClick={aprovar}>
            ✓ {o.status === 'base' ? 'Aprovar síntese' : 'Aprovar'}
          </Btn>
        )}
        {o.status === 'base' && !o.pendente && <span className="text-xs font-bold text-[var(--oliveira-s)]">aprovada pelo curador</span>}
      </div>
      <dl className="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
        {o.campos.map((c) => (
          <div key={c.campo} className="contents">
            <dt className="font-bold text-[var(--muted)]">{c.campo}</dt>
            <dd className="min-w-0 break-words">
              {c.literal ? '✅ ' : ''}
              {c.texto}
            </dd>
          </div>
        ))}
      </dl>
      {o.base.length > 0 && (
        <div className="rounded-xl bg-[var(--bg)] p-2 text-sm">
          <div className="text-xs font-black tracking-wide text-[var(--muted)] uppercase">Trechos do caderno que sustentam</div>
          {o.base.map((b, i) => (
            <div key={i} className="mt-1">
              {b.achado ? '📓' : '❌'} “{b.trecho}” <span className="text-xs text-[var(--muted)]">{b.achado ? b.arquivo : 'não encontrado no caderno'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
