// Teste online: telão + 3 celulares em contextos ISOLADOS (sem BroadcastChannel/localStorage compartilhados).
// Se os jogadores aparecem no telão, é o Firebase sincronizando de verdade.
// Uso: BASE=http://localhost:5173 node scripts/testar-firebase.mjs
import { chromium } from 'playwright-core'

const BASE = process.env.BASE ?? 'http://localhost:5173'
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const errors = []
const ctx = async (mobile) => {
  const c = await browser.newContext(mobile ? { viewport: { width: 390, height: 780 }, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 810 } })
  const p = await c.newPage()
  p.on('pageerror', (e) => errors.push(String(e)))
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  return p
}
const host = await ctx(false)
await host.goto(BASE + '/criar')
await host.getByRole('button', { name: /Abrir sala/ }).click({ timeout: 20000 })
await host.waitForURL(/\/host\/\d+/, { timeout: 20000 })
const PIN = host.url().split('/').pop()
console.log('PIN', PIN)

const names = ['Ana', 'Bruno', 'Carla']
const avatars = []
for (const [i, name] of names.entries()) {
  const p = await ctx(true)
  await p.goto(`${BASE}/j/${PIN}`)
  await p.getByPlaceholder('Seu nome').fill(name)
  await p.getByPlaceholder('Seu nome').press('Enter')
  await p.locator('button:has(span.text-\[2em\]), button:has(svg)').nth(i + 1).click().catch(() => {})
  await p.getByRole('button', { name: /Entrar!/ }).click({ timeout: 15000 })
  await p.getByText(/Você está dentro/).waitFor({ timeout: 15000 })
  avatars.push(p)
  console.log('entrou', name)
}
await host.waitForTimeout(2000)
const txt = await host.locator('body').innerText()
const ok = names.every((n) => txt.includes(n))
console.log('Jogadores visíveis no telão:', names.map((n) => `${n}=${txt.includes(n)}`).join(' '))
await host.screenshot({ path: process.env.TEMP + '/firebase-lobby.png' })
console.log('Erros JS:', errors.length, errors.slice(0, 3))
await browser.close()
process.exit(ok ? 0 : 1)
