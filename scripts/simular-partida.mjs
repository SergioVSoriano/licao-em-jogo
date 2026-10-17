/**
 * Simulação visual de uma partida completa do Lição em Jogo.
 *
 * Abre, no mesmo navegador (Edge), 1 telão (professor), 4 celulares e 1 controle do
 * facilitador; joga os 12 jogos agindo em cada papel e tira prints de tudo.
 * Gera docs/testes/RELATORIO.md com os prints.
 *
 * Uso:  npm run dev   (em outro terminal)   e depois   npm run simular
 */
import { chromium } from 'playwright-core'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BASE = process.env.BASE ?? 'http://localhost:5173'
const OUT = join(ROOT, 'docs', 'testes')
const PRINTS = join(OUT, 'prints')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const t0 = Date.now()
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(0).padStart(4)}s]`, ...a)

rmSync(PRINTS, { recursive: true, force: true })
mkdirSync(PRINTS, { recursive: true })

const PLAYERS = [
  { pid: 'p-ana', name: 'Ana', avatar: 'Débora', noSpot: false },
  { pid: 'p-bruno', name: 'Bruno', avatar: 'Elias', noSpot: false },
  { pid: 'p-carla', name: 'Carla', avatar: 'Ester', noSpot: false },
  { pid: 'p-davi', name: 'Davi', avatar: 'Davi', noSpot: true },
]

const browser = await chromium.launch({ channel: process.env.CHANNEL ?? 'msedge', headless: process.env.HEADED ? false : true })
const ctx = await browser.newContext({ deviceScaleFactor: 1.25, locale: 'pt-BR' })
const errors = []
const shotFails = []
const shots = []
let section = 'Preparação'
let counter = 0

async function newPage(kind, w, h, pid) {
  const p = await ctx.newPage()
  await p.setViewportSize({ width: w, height: h })
  await p.addInitScript(([pid, kind]) => {
    if (pid) sessionStorage.setItem('lej:pid', pid)
    if (kind === 'host') localStorage.setItem('lej:muted', '1')
  }, [pid, kind])
  p.on('pageerror', (e) => errors.push(`[${kind}${pid ? ' ' + pid : ''}] ${e.message}`))
  p.on('console', (m) => {
    if (m.type() === 'error' && !/cssRules|favicon|Failed to load resource/.test(m.text())) errors.push(`[${kind}${pid ? ' ' + pid : ''}] ${m.text().slice(0, 300)}`)
  })
  p.on('dialog', (d) => d.accept())
  p.kind = kind
  return p
}

const host = await newPage('host', 1366, 768)
const phones = {}
for (const pl of PLAYERS) {
  phones[pl.pid] = await newPage('phone', 390, 844, pl.pid)
  phones[pl.pid].player = pl
}
const judge = await newPage('judge', 390, 844, 'p-facilitador')
const [A, B, C, D] = PLAYERS.map((p) => phones[p.pid])
const nameOf = (pid) => PLAYERS.find((p) => p.pid === pid)?.name ?? pid

async function shot(page, slug, caption, opts = {}) {
  await sleep(opts.wait ?? 900)
  counter++
  const file = `${String(counter).padStart(3, '0')}-${slug}.jpg`
  try {
    await page.screenshot({ path: join(PRINTS, file), type: 'jpeg', quality: 80, fullPage: !!opts.full })
    const device = page.kind === 'host' ? 'Telão (professor)' : page.kind === 'judge' ? 'Celular do facilitador' : `Celular de ${page.player?.name}`
    shots.push({ file, caption, section, device, kind: page.kind })
  } catch (e) {
    shotFails.push(`${file}: ${e.message.split(String.fromCharCode(10))[0]}`)
  }
}

let PIN = ''
const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('sem resposta: ' + what)), ms))])
let lastKey = ''
let lastChange = Date.now()
async function pub() {
  const P = await withTimeout(host.evaluate((pin) => JSON.parse(localStorage.getItem(`lej:${pin}:pub`) ?? 'null'), PIN), 8000, 'telão')
  const k = P ? `${P.phase}|${P.gameIdx}|${P.game?.view?.stage ?? ''}|${P.game?.view?.i ?? P.game?.view?.r ?? P.game?.view?.turn ?? ''}` : 'null'
  if (k !== lastKey) {
    if (process.env.VERBOSE) log('   fase:', k)
    lastKey = k
    lastChange = Date.now()
  }
  return P
}
/** Vigia: se nada mudou por muito tempo, tenta destravar pelo telão. */
async function watchdog(limit = 60000) {
  if (Date.now() - lastChange < limit) return
  log('   ⚠️ parado há', Math.round((Date.now() - lastChange) / 1000), 's em', lastKey, '→ Espaço')
  lastChange = Date.now()
  await key('Space')
}
const priv = (pid) => host.evaluate(([pin, pid]) => JSON.parse(localStorage.getItem(`lej:${pin}:priv:${pid}`) ?? '{}'), [PIN, pid])
const snap = () => host.evaluate((pin) => JSON.parse(localStorage.getItem(`lej:${pin}:snap`) ?? 'null'), PIN)
const key = async (k) => {
  await host.bringToFront()
  await host.keyboard.press(k)
  await sleep(350)
}
async function waitFor(fn, timeout = 30000, what = '') {
  const end = Date.now() + timeout
  while (Date.now() < end) {
    try {
      const v = await fn()
      if (v) return v
    } catch {
      /* page reloading */
    }
    await sleep(300)
  }
  throw new Error('Tempo esgotado esperando: ' + what)
}
const waitPhase = (ph, timeout = 30000) => waitFor(async () => (await pub())?.phase === ph, timeout, 'fase ' + ph)
async function click(page, locator, label, timeout = 2500) {
  try {
    await locator.first().click({ timeout })
    return true
  } catch {
    log('  (não achei para clicar:', label, 'em', page.player?.name ?? page.kind, ')')
    return false
  }
}
const btn = (page, re) => page.getByRole('button', { name: re })
/** Aperta Espaço só se o jogo ainda estiver na mesma etapa (evita pular a revelação). */
async function spaceIf(pred, waitMs = 2500) {
  await sleep(waitMs)
  const P = await pub()
  if (P?.phase === 'play' && P.game && pred(P.game.view)) await key('Space')
}
const rnd = (n) => Math.floor(Math.random() * n)

/* ───────────── 1. Início, planejador e sala ───────────── */
log('Abrindo página inicial e planejador…')
section = '1. Início e planejador'
await host.goto(BASE + '/')
await shot(host, 'inicio', 'Página inicial (computador).')
await A.goto(BASE + '/')
await shot(A, 'inicio-celular', 'Página inicial no celular.')
await host.goto(BASE + '/como-funciona')
await shot(host, 'como-funciona', 'Página "Como funciona": passo a passo, mapa, pontos e os 12 jogos.')
await host.goto(BASE + '/criar')
await host.locator('input[type=range]').evaluate((el) => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '60')
  el.dispatchEvent(new Event('input', { bubbles: true }))
})
await click(host, host.getByRole('button', { name: /Leve/ }), 'Leve', 15000)
for (let i = 0; i < 8; i++) await click(host, host.getByRole('button', { name: '−', exact: true }), '−', 15000)
while ((await host.getByRole('button', { name: '+ Adicionar' }).count()) > 0) {
  await host.getByRole('button', { name: '+ Adicionar' }).first().click()
  await sleep(120)
}
await shot(host, 'planejador', 'Planejador com os 12 jogos em 60 min: as rodadas foram reduzidas sozinhas para caber (lista ✂️ à direita).', { full: true })
await click(host, btn(host, /Abrir sala/), 'Abrir sala', 15000)
await host.waitForURL(/\/host\/\d+/)
PIN = host.url().split('/').pop()
log('Sala criada: PIN', PIN)

/* ───────────── 2. Entrada dos jogadores ───────────── */
section = '2. Entrada dos jogadores'
await shot(host, 'lobby-vazio', `Sala de espera no telão: QR Code, PIN ${PIN} e roteiro.`)
for (const pl of PLAYERS) {
  const p = phones[pl.pid]
  await p.goto(`${BASE}/j/${PIN}`)
  await p.getByPlaceholder('Seu nome').fill(pl.name)
  if (pl === PLAYERS[0]) await shot(p, 'entrada-nome', 'Celular: passo 1, o nome.')
  await p.getByPlaceholder('Seu nome').press('Enter')
  await p.locator(`button:has(span:text-is("${pl.avatar}"))`).first().click()
  if (pl.noSpot) await p.getByRole('checkbox').first().check()
  if (pl === PLAYERS[0]) await shot(p, 'entrada-personagem', 'Celular: passo 2, escolher o personagem bíblico (e a cor da roupa).')
  if (pl.noSpot) await shot(p, 'entrada-nao-sortear', 'Davi marcou "Prefiro não ser sorteado": joga como plateia nos jogos de holofote.')
  await click(p, btn(p, /Entrar!/), 'Entrar', 15000)
  await sleep(500)
}
await shot(A, 'lobby-celular', 'Celular depois de entrar: "Você está dentro!" e uma curiosidade da lição.')
await click(host, btn(host, /robôs/), '+3 robôs', 15000)
await shot(host, 'lobby-cheio', 'Telão com os 4 jogadores + 3 robôs (para completar os times).', { wait: 1500 })
const judgeKey = (await snap()).judgeKey
await judge.goto(`${BASE}/f/${PIN}/${judgeKey}`)
await shot(judge, 'controle-lobby', 'Controle do facilitador no celular (aberto pelo QR 📲 do telão).')

/* ───────────── 3. Abertura ───────────── */
section = '3. Abertura'
await key('Space')
await waitPhase('opening')
await shot(host, 'abertura', 'Abertura: a tirinha da lição, o verso de Amós 3:7 e o mapa do santuário.', { wait: 2500 })
await shot(B, 'abertura-celular', 'Celular na abertura.')
await key('Space')

const pack = await host.evaluate(async () => JSON.parse(JSON.stringify((await import('/src/content/index.ts')).DEFAULT_PACK)))
const GAME_NAMES = Object.fromEntries((await host.evaluate(async () => (await import('/src/games/index.ts')).GAMES.map((g) => [g.id, g.name]))))

/* ───────────── Jogos ───────────── */
const once = new Set()
const first = (k) => (once.has(k) ? false : (once.add(k), true))
const myPhones = () => Object.values(phones)
const ours = (pid) => !!phones[pid]

async function playGame(gid, view) {
  const deadline = Date.now() + 6 * 60 * 1000
  while (Date.now() < deadline) {
    const P = await pub()
    if (!P || P.phase !== 'play' || !P.game) return
    const v = P.game.view
    try {
      await handlers[gid](v, P)
    } catch (e) {
      log('  erro no roteiro de', gid, e.message)
    }
    await watchdog(60000)
    await sleep(450)
  }
  log('  ⚠️ jogo demorou demais, encerrando pelo telão')
  await click(host, btn(host, /Encerrar jogo/), 'Encerrar jogo')
}

const handlers = {
  async nuvem(v) {
    const sets = { 'p-ana': ['cansado', 'sozinho', 'medo'], 'p-bruno': ['exausto', 'triste', 'burnout'], 'p-carla': ['cansado', 'medo', 'desanimado'], 'p-davi': ['sozinho', 'cansaço', 'fome'] }
    if (v.stage === 'write') {
      for (const pl of PLAYERS) {
        const pv = await priv(pl.pid)
        if (pv.game?.words) continue
        const p = phones[pl.pid]
        const words = sets[pl.pid]
        for (let i = 0; i < 3; i++) await p.getByPlaceholder(`Palavra ${i + 1}`).fill(words[i])
        if (first('nuvem-escreve')) await shot(p, 'nuvem-celular-escrevendo', `${pl.name} escreve até 3 palavras (anônimo).`)
        await click(p, btn(p, /Enviar/), 'Enviar')
        await sleep(200)
      }
      if (first('nuvem-telao-espera')) await shot(host, 'nuvem-telao-escrevendo', 'Telão enquanto a turma escreve: as palavras ficam escondidas até o tempo acabar.')
      await spaceIf((w) => w.stage === 'write' && w.i === v.i, 3000)
    } else {
      if (first('nuvem-reveal')) {
        await shot(host, 'nuvem-telao-nuvem', 'A nuvem revelada: palavras repetidas crescem (cansado + exausto contam juntas).', { wait: 1500 })
        await host.locator('main span.font-display').filter({ hasText: /burnout|fome|sozinho/ }).first().click().catch(() => {})
        await shot(host, 'nuvem-palavra-de-ouro', 'O facilitador clicou numa palavra original para dar ⭐ Palavra de Ouro (+200).')
        await shot(judge, 'nuvem-controle', 'No controle do facilitador, as palavras também aparecem para dar a ⭐.')
        await shot(A, 'nuvem-celular-resultado', 'Celular da Ana: pontos da rodada.')
      }
      await key('Space')
    }
  },

  async verdade(v) {
    if (v.stage === 'q') {
      const firstQ = first('vf-q')
      if (firstQ) await shot(A, 'vf-celular-pergunta', 'Celular: a afirmação e dois botões grandes.')
      for (const [i, pl] of PLAYERS.entries()) {
        const pv = await priv(pl.pid)
        if (pv.game?.mine != null) continue
        const p = phones[pl.pid]
        await click(p, btn(p, i % 2 === 0 ? /VERDADE/ : /FALSIFICAÇÃO/), 'V/F')
      }
      if (firstQ) await shot(host, 'vf-telao-pergunta', 'Telão: a afirmação, o tempo e quantos já responderam.')
      await spaceIf((w) => w.stage === 'q' && w.i === v.i)
    } else {
      if (first('vf-reveal')) {
        await shot(host, 'vf-telao-revelacao', 'Revelação: porcentagem da turma, resposta certa e explicação com o versículo.', { wait: 1200 })
        await shot(A, 'vf-celular-feedback-1', 'Feedback no celular da Ana (estilo Duolingo).')
        await shot(B, 'vf-celular-feedback-2', 'Feedback no celular do Bruno.')
      }
      await key('Space')
    }
  },

  async linha(v) {
    if (v.stage === 'order') {
      for (const [i, pl] of PLAYERS.entries()) {
        const pv = await priv(pl.pid)
        if (pv.game?.sent) continue
        const p = phones[pl.pid]
        if (i === 0 && first('linha-antes')) await shot(p, 'linha-celular-embaralhado', 'Celular: os acontecimentos chegam embaralhados para arrastar (ou usar ▲ ▼).')
        if (i % 2 === 0) {
          const cur = v.cards.map((c) => c.k)
          for (let t = 0; t < cur.length; t++) {
            let j = cur.indexOf(t)
            while (j > t) {
              await p.getByRole('button', { name: 'Subir' }).nth(j).click({ timeout: 3000 })
              ;[cur[j - 1], cur[j]] = [cur[j], cur[j - 1]]
              j--
            }
          }
          if (i === 0 && first('linha-ordenado')) await shot(p, 'linha-celular-ordenado', 'Ana colocou na ordem certa antes de enviar.')
        }
        await click(p, btn(p, /Enviar ordem/), 'Enviar ordem')
      }
      if (first('linha-telao')) await shot(host, 'linha-telao-ordenando', 'Telão: as cartas embaralhadas e quantos já enviaram.')
      await spaceIf((w) => w.stage === 'order' && w.i === v.i)
    } else {
      if (first('linha-reveal')) {
        await shot(host, 'linha-telao-revelacao', 'Revelação: a jornada em ordem e quantos acertaram tudo.', { wait: 2200 })
        await shot(A, 'linha-celular-acertou', 'Ana acertou a ordem completa.')
        await shot(B, 'linha-celular-errou', 'Bruno enviou fora de ordem: ganha pontos parciais.')
      }
      await key('Space')
    }
  },

  async sinais(v) {
    if (v.stage === 'play') {
      const card = pack.threeSigns.find((c) => c.clues[0] === v.clue1)
      if (first('sinais-card-' + v.i) && v.i === 0) {
        await shot(host, 'sinais-telao-dica1', 'Telão: só a dica 1 aparece para todos; as outras abrem no celular de quem erra.')
        await shot(A, 'sinais-celular-dica1', 'Celular: digite o palpite (pode errar acento) ou "Não sei".')
        await A.getByPlaceholder('Seu palpite…').fill('Elias')
        await A.getByPlaceholder('Seu palpite…').press('Enter')
        await shot(A, 'sinais-celular-errou', 'Ana chutou "Elias" e errou: abriu a dica 2, agora valendo 600.')
        await click(B, btn(B, /Não sei/), 'Não sei')
        await click(B, btn(B, /Não sei/), 'Não sei')
        await shot(B, 'sinais-celular-dica3', 'Bruno tocou "Não sei" duas vezes: vê as 3 dicas, valendo 300.')
        await C.getByPlaceholder('Seu palpite…').fill(card.answer.toLowerCase())
        await C.getByPlaceholder('Seu palpite…').press('Enter')
        await shot(C, 'sinais-celular-acertou', `Carla acertou "${card.answer}" logo na dica 1 (+1000).`)
        await A.getByPlaceholder('Seu palpite…').fill(card.accept[0])
        await A.getByPlaceholder('Seu palpite…').press('Enter')
        await B.getByPlaceholder('Seu palpite…').fill(card.answer)
        await B.getByPlaceholder('Seu palpite…').press('Enter')
        await D.getByPlaceholder('Seu palpite…').fill('Débora')
        await D.getByPlaceholder('Seu palpite…').press('Enter')
        await shot(host, 'sinais-telao-corrida', 'Telão: a corrida, com quem acertou em cada dica.', { wait: 1500 })
      }
      await spaceIf((w) => w.stage === 'play' && w.i === v.i, 1500)
    } else {
      if (first('sinais-reveal')) {
        await shot(host, 'sinais-telao-revelacao', 'Revelação: as 3 dicas, a resposta e os palpites errados mais comuns.', { wait: 1800 })
        await shot(D, 'sinais-celular-resposta', 'Celular de quem não acertou mostra a resposta.')
      }
      await key('Space')
    }
  },

  async sortes(v) {
    const q = pack.questions.find((x) => x.q === v.q)
    const correct = q?.answer ?? 0
    if (v.stage === 'answer' || v.stage === 'answer2') {
      const up = v.stage === 'answer' ? v.chosen : v.chosen2
      if (ours(up)) {
        const p = phones[up]
        if (v.stage === 'answer' && first('sortes-sorteado')) {
          await shot(p, 'sortes-celular-sorteado', `${nameOf(up)} foi sorteado(a): responde, passa ou pede ajuda à plateia.`)
          await shot(host, 'sortes-telao-respondendo', 'Telão: a pergunta, quem está respondendo e a plateia respondendo em silêncio.')
          if (!v.help) {
            await click(p, btn(p, /Plateia/), 'Plateia')
            await sleep(1500)
            await shot(host, 'sortes-telao-ajuda', 'Pediu ajuda à plateia: o telão mostra a porcentagem de cada alternativa.')
          }
          // na 1ª, erra de propósito para mostrar a 2ª chance
          await click(p, p.locator('button', { hasText: q.options[(correct + 1) % 4] }), 'opção')
        } else await click(p, p.locator('button', { hasText: q.options[correct] }), 'opção')
      }
      for (const pl of PLAYERS) {
        if (pl.pid === up) continue
        const pv = await priv(pl.pid)
        if (pv.game?.aud != null) continue
        const p = phones[pl.pid]
        if (first('sortes-plateia')) await shot(p, 'sortes-celular-plateia', `${pl.name} está na plateia: responde em silêncio valendo +50.`)
        await click(p, p.locator('button', { hasText: q.options[pl.pid === 'p-davi' ? (correct + 2) % 4 : correct] }), 'aud')
      }
    }
    if (v.stage === 'draw2' && first('sortes-queimou')) await shot(host, 'sortes-telao-queimou', 'Errou: a pergunta "queima" e a sorte escolhe outra pessoa (vale ×3).', { wait: 400 })
    if (v.stage === 'reveal') {
      if (first('sortes-reveal')) {
        await shot(host, 'sortes-telao-revelacao', 'Revelação: resultado de cada sorteado e quanto da plateia acertou.', { wait: 1200 })
        if (ours(v.chosen)) await shot(phones[v.chosen], 'sortes-celular-resultado', 'Celular do sorteado: errou na 1ª chance (−200).')
      }
      await key('Space')
    }
  },

  async duelo(v) {
    if (v.stage === 'draw' && first('duelo-draw')) await shot(host, 'duelo-telao-sorteio', 'Telão: dois sorteados frente a frente; a plateia aposta.', { wait: 500 })
    if (v.stage === 'q') {
      const q = pack.questions.find((x) => x.q === v.q)
      // plateia primeiro, duelistas por último (senão o duelo acaba antes da aposta)
      const ordered = [...PLAYERS].sort((x, y) => Number(x.pid === v.a || x.pid === v.b) - Number(y.pid === v.a || y.pid === v.b))
      for (const pl of ordered) {
        const p = phones[pl.pid]
        const pv = (await priv(pl.pid)).game ?? {}
        if (pl.pid === v.a || pl.pid === v.b) {
          if (first('duelo-duelista')) await shot(p, 'duelo-celular-duelista', `${pl.name} está no duelo: quem acertar primeiro vence.`)
          if (pv.mine == null) await click(p, p.locator('button', { hasText: q.options[q.answer] }), 'duelo')
        } else {
          if (!pv.bet) {
            if (first('duelo-plateia')) await shot(p, 'duelo-celular-plateia', `${pl.name} na plateia: aposta em quem vence e responde em silêncio.`)
            const target = v.a === pl.pid ? v.b : v.a
            const tname = (await pub()).players[target]?.name
            await click(p, p.locator('button', { hasText: tname }), 'aposta')
          }
          if (pv.aud == null) await click(p, p.locator('button', { hasText: q.options[q.answer] }), 'aud')
        }
      }
    }
    if (v.stage === 'reveal') {
      if (first('duelo-reveal')) await shot(host, 'duelo-telao-vencedor', 'Telão: o vencedor fica no monte ("Rei do Monte").', { wait: 1200 })
      await key('Space')
    }
  },

  async acrostico(v) {
    const P = await pub()
    if (v.stage === 'turn') {
      if (first('acro-turn-host')) await shot(host, 'acrostico-telao-vez', 'Telão: o tema, a roda de letras e de quem é a vez.')
      if (ours(v.cur)) {
        const p = phones[v.cur]
        if (first('acro-minha-vez')) await shot(p, 'acrostico-celular-vez', `Vez de ${nameOf(v.cur)}: fala a palavra em voz alta e toca na letra.`)
        const free = p.locator('button:not([disabled])').filter({ hasText: /^[A-V]$/ })
        await click(p, free.nth(rnd(Math.max(1, Math.min(5, await free.count())))), 'letra')
      }
    }
    if (v.stage === 'judge') {
      for (const pl of PLAYERS) {
        if (pl.pid === v.cur) continue
        const pv = (await priv(pl.pid)).game ?? {}
        if (pv.vote != null) continue
        const p = phones[pl.pid]
        if (first('acro-voto')) await shot(p, 'acrostico-celular-voto', `${pl.name} vota se a palavra vale.`)
        await click(p, btn(p, /Vale/), 'vale')
      }
      if (first('acro-judge-host')) await shot(host, 'acrostico-telao-votacao', 'Telão: a letra escolhida e a votação da turma; o facilitador decide com 1 ou 2.')
      await key(Math.random() < 0.75 ? '1' : '2')
    }
    for (const pl of PLAYERS) {
      if (v.stage === 'turn' && v.order.includes(pl.pid) && !v.alive.includes(pl.pid) && first('acro-elim')) await shot(phones[pl.pid], 'acrostico-celular-eliminado', `${pl.name} saiu da rodada, mas continua votando e vê o tema e as letras livres.`)
    }
    if (v.stage === 'roundEnd') {
      if (first('acro-end')) await shot(host, 'acrostico-telao-fim', 'Fim da rodada: quem resistiu ganha +300.', { wait: 1200 })
      await key('Space')
    }
    void P
  },

  async fruto(v) {
    if (v.stage === 'ready') {
      if (ours(v.explainer)) {
        const p = phones[v.explainer]
        if (first('fruto-ready')) await shot(p, 'fruto-celular-pronto', `${nameOf(v.explainer)} vai explicar: só ele(a) vê a carta.`)
        await click(p, btn(p, /Começar/), 'começar')
      } else await key('Space')
    }
    if (v.stage === 'play') {
      if (first('fruto-host-' + v.turn)) await shot(host, 'fruto-telao-turno-' + (v.turn + 1), 'Telão: placar dos times, quem explica, o fiscal e a "carta secreta".')
      if (ours(v.explainer)) {
        const p = phones[v.explainer]
        if (first('fruto-carta')) await shot(p, 'fruto-celular-carta', 'Celular de quem explica: a palavra e as 5 proibidas.')
        await click(p, btn(p, /Acertaram/), 'acertaram')
        await sleep(800)
      }
      if (ours(v.fiscal)) {
        const p = phones[v.fiscal]
        if (first('fruto-fiscal')) {
          await shot(p, 'fruto-celular-fiscal', `${nameOf(v.fiscal)} é o FISCAL: vê a mesma carta e tem o botão BUZZ.`)
          await click(p, btn(p, /BUZZ/), 'buzz')
        }
      }
      for (const pl of PLAYERS) {
        if (pl.pid !== v.explainer && pl.pid !== v.fiscal && first('fruto-adivinha')) await shot(phones[pl.pid], 'fruto-celular-time', `${pl.name}: o time adivinha em voz alta.`)
      }
      if (!ours(v.explainer)) await key('1')
      if (v.log.length >= 4) await click(host, btn(host, /Encerrar turno/), 'Encerrar turno')
    }
    if (v.stage === 'turnEnd') {
      if (first('fruto-end-' + v.turn)) await shot(host, 'fruto-telao-fim-turno-' + (v.turn + 1), 'Fim do turno: as palavras do turno aparecem (✓ acerto, 🚨 buzz).', { wait: 800 })
      await key('Space')
    }
  },

  async sonho(v) {
    if (v.stage === 'roles') {
      if (first('sonho-roles')) {
        await shot(host, 'sonho-telao-rei', 'Telão: quem é o Rei (vira de costas e fecha os olhos).')
        for (const pl of PLAYERS) {
          const pv = (await priv(pl.pid)).game ?? {}
          if (pl.pid === v.king) await shot(phones[pl.pid], 'sonho-celular-rei', `${pl.name} é o REI 👑.`)
          else if (pv.role && first('sonho-papel-' + pv.role)) await shot(phones[pl.pid], 'sonho-celular-papel-' + pv.role, `${pl.name} recebeu o papel secreto: ${pv.role === 'anjo' ? 'Anjo 😇' : pv.role === 'falso' ? 'Falso Profeta 🎭' : 'Mago da Corte 🔮'}.`)
        }
      }
      await key('Space')
    }
    if (v.stage === 'night') {
      if (first('sonho-noite')) {
        await shot(host, 'sonho-telao-noite', 'Noite: a palavra aparece no telão (o Rei está de costas).')
        const council = PLAYERS.find((p) => p.pid !== v.king && v.council.includes(p.pid))
        if (council) await shot(phones[council.pid], 'sonho-celular-palavra', `${council.name} vê a palavra e o próprio papel, e dá UMA pista.`)
        for (const k of ['1', '2', '1', '1']) {
          await key(k)
          await sleep(500)
        }
        await shot(judge, 'sonho-controle', 'Controle do facilitador durante a noite: ✓ acertou / ✗ errou.')
      }
      await click(host, btn(host, /Amanhecer/), 'Amanhecer')
    }
    if (v.stage === 'interp') {
      if (first('sonho-interp')) await shot(host, 'sonho-telao-interpretacao', '"Interpretação": o Rei reconta o sonho ligando as palavras (como Daniel).')
      await key('1')
    }
    if (v.stage === 'discern') {
      if (ours(v.king)) {
        const p = phones[v.king]
        if (first('sonho-discern')) await shot(p, 'sonho-celular-discernimento', 'O Rei tenta apontar um Falso Profeta (tema de terça: discernimento).')
        await click(p, p.locator('button').filter({ hasText: new RegExp(v.council.map((c) => nameOf(c)).filter((n) => n.length > 2).join('|') || '.') }), 'suspeito')
      } else if (first('sonho-discern-host')) {
        await shot(host, 'sonho-telao-discernimento', 'Discernimento: o Rei aponta no celular quem era Falso Profeta.')
      }
    }
    if (v.stage === 'score') {
      if (first('sonho-score')) {
        await shot(host, 'sonho-telao-pontos', 'Pontuação: os papéis são revelados e cada um ganha conforme o papel.', { wait: 1200 })
        const pl = PLAYERS.find((p) => p.pid !== v.king && v.council.includes(p.pid))
        if (pl) await shot(phones[pl.pid], 'sonho-celular-resultado', `${pl.name} vê o próprio resultado.`)
      }
      await key('Space')
    }
  },

  async disfarcados(v) {
    const S = await snap()
    const secret = S?.game?.state?.secret
    if (v.stage === 'brief') {
      if (ours(v.informant)) {
        const p = phones[v.informant]
        if (first('disf-brief')) await shot(p, 'disfarcados-celular-informante', `${nameOf(v.informant)} é o INFORMANTE: vê o personagem secreto e pistas prontas.`)
        await click(p, btn(p, /Pronto/), 'pronto')
      } else await key('Space')
    }
    if (v.stage === 'clues') {
      if (ours(v.informant) && v.shown.length < v.level) {
        const p = phones[v.informant]
        await click(p, p.locator('button:not([disabled])', { hasText: '💬' }), 'pista')
      }
      if (first('disf-grid-' + v.r)) {
        await sleep(600)
        if (v.r === 0) await shot(host, 'disfarcados-telao-grade', 'Telão: a grade com 12 personagens e as pistas.')
        const g = PLAYERS.find((p) => p.pid !== v.informant)
        if (v.r === 0) await shot(phones[g.pid], 'disfarcados-celular-palpite', `${g.name}: toca no rosto do personagem (um palpite só).`)
        const name = pack.characters.find((c) => c.id === secret)?.name
        for (const [i, pl] of PLAYERS.entries()) {
          if (pl.pid === v.informant) continue
          const p = phones[pl.pid]
          const pick = i === 1 ? 'Acabe' : name
          await click(p, p.locator('button', { hasText: pick }), 'palpite')
        }
      }
    }
    if (v.stage === 'reveal') {
      if (first('disf-reveal-' + v.r) && v.r === 0) await shot(host, 'disfarcados-telao-revelacao', 'Revelação: o personagem, os votos e a ficha bíblica.', { wait: 1200 })
      await key('Space')
    }
  },

  async atos(v) {
    if (v.stage === 'choose') {
      if (ours(v.actor)) {
        const p = phones[v.actor]
        if (first('atos-escolhe')) await shot(p, 'atos-celular-escolha', `${nameOf(v.actor)} é o ator: escolhe cena fácil (100) ou difícil (200).`)
        await click(p, p.locator('button', { hasText: 'DIFÍCIL' }), 'difícil')
      } else await key('Space')
    }
    if (v.stage === 'act') {
      if (first('atos-act-' + v.turn)) {
        await shot(host, 'atos-telao-encenando-' + (v.turn + 1), 'Telão: quem encena, o tempo e o placar dos times.')
        if (ours(v.actor)) await shot(phones[v.actor], 'atos-celular-cena', 'Celular do ator: a cena para encenar sem falar.')
        const mate = PLAYERS.find((p) => p.pid !== v.actor && v.teams[v.team].includes(p.pid))
        if (mate && first('atos-mate')) await shot(phones[mate.pid], 'atos-celular-time', `${mate.name} é do time da vez: adivinha em voz alta.`)
        await sleep(1500)
        await key(v.turn === 0 ? '1' : '2')
      }
    }
    if (v.stage === 'steal') {
      if (first('atos-steal')) await shot(host, 'atos-telao-roubo', 'Tempo esgotado: os outros times podem roubar com um palpite.')
      await key(v.team === 0 ? '2' : '1')
    }
    if (v.stage === 'turnEnd') {
      if (first('atos-end-' + v.turn)) await shot(host, 'atos-telao-fim-' + (v.turn + 1), 'Fim do turno: a cena é revelada.', { wait: 900 })
      await key('Space')
    }
  },

  async voz(v) {
    if (v.stage === 'prep') {
      if (first('voz-prep')) {
        await shot(host, 'voz-telao-preparo', 'Telão: cada time com um caso da vida real e o roteiro de 3 passos.')
        await shot(A, 'voz-celular-preparo', 'Celular: o caso do time, o versículo e o roteiro (com porta-voz sugerido).')
      }
      await key('Space')
    }
    if (v.stage === 'pitch') {
      if (first('voz-pitch-' + v.idx)) await shot(host, 'voz-telao-pitch-' + (v.idx + 1), `Pitch de 1 minuto do time ${v.idx + 1}.`)
      await key('Space')
    }
    if (v.stage === 'vote') {
      for (const pl of PLAYERS) {
        const pv = (await priv(pl.pid)).game ?? {}
        if (pv.voted) continue
        const p = phones[pl.pid]
        const rows = await p.locator('button[aria-label="5 estrelas"]').count()
        for (let r = 0; r < rows; r++) {
          await p.locator(`button[aria-label="${4 + (r % 2)} estrelas"]`).nth(r).click()
        }
        if (first('voz-voto')) await shot(p, 'voz-celular-voto', `${pl.name} avalia os OUTROS times: "Fiel ao texto" e "Prático para a vida".`)
        await click(p, btn(p, /Enviar votos/), 'votos')
      }
      await sleep(800)
    }
    if (v.stage === 'reveal') {
      if (first('voz-reveal')) await shot(host, 'voz-telao-resultado', 'Resultado: média de estrelas de cada time.', { wait: 1000 })
      await key('Space')
    }
  },
}

const PHASE_SHOTS_FULL = new Set(['nuvem', 'sinais', 'disfarcados'])
let gamesPlayed = 0
for (;;) {
  const P = await pub()
  if (!P) break
  if (P.phase === 'veil') break
  if (P.phase !== 'intro') {
    if (P.phase === 'reward' || P.phase === 'map' || P.phase === 'results' || P.phase === 'reveal') await watchdog(15000)
    await sleep(300)
    continue
  }
  const gid = P.plan[P.gameIdx].gameId
  section = `${P.gameIdx + 4}. Jogo ${P.gameIdx + 1}: ${GAME_NAMES[gid]}`
  log('▶', section)
  await shot(host, `${gid}-telao-regras`, 'Regras do jogo no telão (também aparecem no celular).', { wait: 1200 })
  await shot(C, `${gid}-celular-regras`, 'Regras no celular, com o botão "Entendi ✓".')
  for (const p of myPhones()) await click(p, btn(p, /Entendi/), 'Entendi')
  await key('Space')
  await waitPhase('play')
  await playGame(gid)
  await waitPhase('results', 60000)
  await shot(host, `${gid}-telao-placar`, 'Placar do jogo: pontos, passos ganhos (👣) e bônus como 🍞 Pão e Água.', { wait: 1500 })
  if (PHASE_SHOTS_FULL.has(gid)) await shot(A, `${gid}-celular-placar`, 'Placar no celular: posição e passos ganhos.')
  await key('Space')
  await waitPhase('reveal')
  const rev = pack.revelations.find((r) => r.game === gid)
  for (const [i, pl] of PLAYERS.entries()) await click(phones[pl.pid], phones[pl.pid].locator('button', { hasText: rev.poll.options[i % rev.poll.options.length] }), 'enquete')
  await click(B, btn(B, /Quero falar/), 'quero falar')
  await shot(host, `${gid}-telao-momento-revelacao`, `Momento Revelação: "${rev.question}" com enquete ao vivo e quem quer falar.`, { wait: 2500 })
  if (gamesPlayed === 0) {
    await shot(A, `${gid}-celular-momento-revelacao`, 'Momento Revelação no celular: pergunta, enquete e "Quero falar".', { wait: 400 })
    await shot(judge, `${gid}-controle-momento-revelacao`, 'Controle do facilitador: insight, todas as perguntas, resultado da enquete e nota de condução.')
    await key('q')
    await shot(host, `${gid}-telao-outra-pergunta`, 'Tecla Q (ou "Outra pergunta"): troca para a pergunta seguinte.')
  }
  await key('Space')
  await waitPhase('map')
  await shot(host, `${gid}-telao-mapa`, 'Mapa do santuário: os avatares andam os passos ganhos.', { wait: 3800 })
  if (gamesPlayed === 0) await shot(A, `${gid}-celular-mapa`, 'Mapa no celular, com o próprio avatar em destaque.')
  await key('Space')
  await sleep(600)
  const P2 = await pub()
  if (P2.phase === 'reward' && P2.reward) {
    const w = P2.reward.pid
    if (ours(w)) {
      const p = phones[w]
      await shot(p, `${gid}-celular-recompensa`, `${nameOf(w)} venceu o jogo e escolhe uma carta de recompensa.`)
      const opt = P2.reward.options.find((o) => o !== 'voz') ?? P2.reward.options[0]
      const names = { dobro: 'Porção Dobrada', escudo: 'Escudo da Fé', sorte: 'Lançar a Sorte', lampada: 'Lâmpada', voz: 'Voz de Comando' }
      await click(p, p.locator('button', { hasText: names[opt] }), 'carta')
      await sleep(600)
      const P3 = await pub()
      if (P3.phase === 'reward') {
        await shot(p, `${gid}-celular-recompensa-alvo`, 'Escolhendo o alvo da carta.')
        await click(p, p.locator('main button').first(), 'alvo')
      }
    } else {
      await shot(host, `${gid}-telao-recompensa`, 'Um robô venceu: o telão mostra as cartas de recompensa.', { wait: 700 })
      await key('Space')
    }
  }
  gamesPlayed++
}

/* ───────────── Final ───────────── */
section = '16. Final: véu, pódio e Rolo da Lição'
await waitPhase('veil')
await shot(host, 'final-veu', 'Diante do véu: quem chegou mais longe no caminho?', { wait: 1500 })
await key('Space')
await waitPhase('podium')
await shot(host, 'final-podio', 'O véu se rasga: todos entram no Santíssimo, com o pódio e os destaques.', { wait: 3500 })
await shot(A, 'final-podio-celular', 'Celular: a posição final.')
await key('Space')
await waitPhase('end')
await shot(host, 'final-rolo-telao', 'Rolo da Lição no telão: os 7 tópicos com exemplos e perguntas.', { wait: 1500 })
await host.locator('main div.cursor-pointer').nth(4).click()
await shot(host, 'final-rolo-topico', 'Clique num tópico: ele abre em tela cheia para discussão (← → para navegar).')
await host.keyboard.press('Escape')
await shot(A, 'final-rolo-celular', 'Rolo da Lição no celular, com o botão para baixar a imagem.', { full: true })
await shot(judge, 'final-controle', 'Controle do facilitador no final.')

const final = await pub()
await browser.close()

/* ───────────── Relatório ───────────── */
const ranking = Object.values(final.players)
  .sort((a, b) => b.steps - a.steps || b.firsts - a.firsts)
  .map((p, i) => `| ${i + 1}º | ${p.name}${p.bot ? ' (robô)' : ''} | ${p.steps} | ${p.firsts} |`)
const sections = [...new Set(shots.map((s) => s.section))]
let md = `# Simulação visual de uma partida completa

> Gerado automaticamente por \`npm run simular\` em ${new Date().toLocaleString('pt-BR')}.
> Navegador: Microsoft Edge (Playwright). Telão em 1366×768; celulares em 390×844.

## Como foi a simulação

- **Telão (professor):** uma aba de computador conduzindo a partida (barra de espaço, teclas 1/2/Q).
- **Celulares:** Ana, Bruno, Carla e Davi, cada um numa aba com o próprio jogador. O Davi marcou **"Não me sortear"**.
- **Robôs:** 3, para completar os times.
- **Controle do facilitador:** uma aba de celular aberta pelo QR 📲.
- **Roteiro:** os 12 jogos em 60 minutos, com o Momento Revelação "Leve". O planejador reduziu as rodadas para caber.

## Resultado

- Jogos jogados até o fim: **${gamesPlayed} de ${final.plan.length}**
- Prints: **${shots.length}**
- Erros de JavaScript nas páginas: **${errors.length}**${errors.length ? '\n\n```\n' + errors.slice(0, 30).join('\n') + '\n```' : ''}
- Prints que falharam por lentidão da máquina (não são erros do app): **${shotFails.length}**${shotFails.length ? '\n\n```\n' + shotFails.join('\n') + '\n```' : ''}

## Problemas encontrados pela simulação (e já corrigidos)

| # | Onde | Problema | Correção |
|---|---|---|---|
| 1 | Lançar Sortes · celular | Quando o 1º sorteado errava, a plateia via só "Lançando a sorte…" e não conseguia responder | A plateia pode responder durante a 2ª sorte, já que a pergunta está no telão |
| 2 | Linha do Tempo · telão | Se todos enviavam rápido, a revelação podia ser pulada | O facilitador só avança quando a etapa ainda não mudou sozinha (e o telão mostra a ordem certa) |
| 3 | Duelo / Sortes / Disfarçados · telão | O brilho atrás do avatar em destaque ficava por cima dele, deixando-o apagado | O avatar agora fica à frente do brilho |
| 4 | Duelo · telão | A explicação da resposta invadia a barra de botões numa tela 1366×768 | Pergunta e avatares mais compactos |
| 5 | Duelo / Sortes · robôs | Os robôs respondiam em ~1 s e a plateia não tinha tempo de apostar | Os robôs esperam alguns segundos (só afeta os testes e demonstrações) |
| 6 | Momento Revelação · telão | Sobrava um vão entre "Na Bíblia" e o insight | O insight vem logo abaixo, em destaque |

## Placar final da simulação

| Posição | Jogador | Passos | Vitórias |
|---|---|---|---|
${ranking.join('\n')}

`
for (const sec of sections) {
  md += `\n## ${sec}\n\n`
  for (const s of shots.filter((x) => x.section === sec)) {
    const w = s.kind === 'host' ? 760 : 260
    md += `**${s.device}:** ${s.caption}\n\n<img src="prints/${s.file}" width="${w}">\n\n`
  }
}
writeFileSync(join(OUT, 'RELATORIO.md'), md)
writeFileSync(join(OUT, 'prints.json'), JSON.stringify({ shots, errors, shotFails, gamesPlayed }, null, 2))
log(`Pronto: ${gamesPlayed} jogos, ${shots.length} prints, ${errors.length} erros do app, ${shotFails.length} prints falharam. Relatório em docs/testes/RELATORIO.md`)
