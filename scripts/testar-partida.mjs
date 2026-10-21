// Teste rápido de uma partida (npm run testar:partida): telão + 3 celulares em navegadores isolados.
// Abre Início, Como funciona e Rolo; cria a sala, os 3 entram e o telão avança até o Momento Revelação e o mapa.
// Uso: BASE=http://localhost:5173 (padrão) ou BASE=https://licao-em-jogo.vercel.app; OUT=<pasta> salva capturas.
// Funciona com Firebase (contextos isolados) e precisa do Microsoft Edge.
import { chromium } from 'playwright-core'

const BASE = process.env.BASE ?? 'http://localhost:5173'
const OUT = process.env.OUT
const b = await chromium.launch({ channel: 'msedge', headless: true })
const errors = []
const mk = async (mobile) => {
  const c = await b.newContext(mobile ? { viewport: { width: 390, height: 780 }, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 810 } })
  const p = await c.newPage()
  p.on('pageerror', (e) => errors.push(String(e)))
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  return p
}
const shot = (p, name) => OUT && p.screenshot({ path: `${OUT}/${name}.png` })

const host = await mk(false)
for (const path of ['/', '/como-funciona', '/rolo', '/escolher/licao']) {
  await host.goto(BASE + path)
  await host.waitForTimeout(1500)
  console.log(path, '→', (await host.locator('body').innerText()).slice(0, 70).replace(/\n/g, ' | '))
}
await host.goto(BASE + '/criar')
await host.getByText('Cobertura do conteúdo').waitFor({ timeout: 15000 })
await host.getByRole('button', { name: /Abrir sala/ }).click()
await host.waitForURL(/\/host\/\d+/)
const PIN = host.url().split('/').pop()
console.log('sala', PIN)
for (const name of ['Ana', 'Bruno', 'Carla']) {
  const p = await mk(true)
  await p.goto(`${BASE}/j/${PIN}`)
  await p.getByPlaceholder('Seu nome').fill(name)
  await p.getByPlaceholder('Seu nome').press('Enter')
  await p.getByRole('button', { name: /Entrar!/ }).click({ timeout: 15000 })
  await p.getByText(/Você está dentro/).waitFor({ timeout: 15000 })
}
const fases = []
for (let i = 0; i < 16; i++) {
  await host.keyboard.press('Space')
  await host.waitForTimeout(1800)
  const t = (await host.locator('body').innerText()).replace(/\s+/g, ' ')
  const fase = /NA LIÇÃO|Na lição/i.test(t) ? 'REVELAÇÃO' : /caminho no santuário/i.test(t) ? 'MAPA' : /Como jogar|Entendi/i.test(t) ? 'REGRAS' : 'jogo/placar'
  if (fases.at(-1) !== fase) fases.push(fase)
  if (fase === 'REVELAÇÃO') await shot(host, 'revelacao')
  if (fase === 'MAPA') {
    await shot(host, 'mapa')
    break
  }
}
console.log('fases:', fases.join(' → '))
console.log('erros de JavaScript:', errors.length, errors.slice(0, 4))
await b.close()
const ok = fases.includes('REVELAÇÃO') && fases.includes('MAPA') && errors.length === 0
console.log(ok ? '✅ partida ok' : '❌ partida com problema')
process.exit(ok ? 0 : 1)
