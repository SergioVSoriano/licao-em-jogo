/**
 * Gera public/conteudo/ a partir de conteudo/ no início do `vite` (dev) e do `vite build`,
 * regera quando um YAML ou o caderno do curador muda durante o dev, e serve a API da página
 * /curadoria (só no dev e só para o próprio computador: aprovar e publicar são decisões do curador).
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { relative, resolve } from 'node:path'
import type { Plugin } from 'vite'
import { construirConteudo, lerConteudo } from './construir'
import { aprovar, aprovarTodos, lerAutoria, publicar, remover, type Alvo } from './editar'

const RAIZ = 'conteudo'
const LOCAL = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

async function corpo(req: IncomingMessage): Promise<Record<string, unknown>> {
  let s = ''
  for await (const c of req) s += c
  return s ? JSON.parse(s) : {}
}

export function conteudo(): Plugin {
  let dev = false
  /** escrita feita pela própria página de curadoria: regera, mas não recarrega a página */
  let silencioAte = 0
  const rodar = (log: (m: string) => void) => {
    const r = construirConteudo()
    for (const a of r.avisos) log(`⚠️  conteúdo: ${a}`)
    if (r.erros.length) {
      const msg = `Conteúdo com ${r.erros.length} erro(s):\n${r.erros.map((e) => `  ❌ ${e}`).join('\n')}`
      if (!dev) throw new Error(msg)
      log(msg + '\n  (o app continua com a última versão válida)')
    }
    return r.erros.length === 0
  }
  return {
    name: 'licao-em-jogo:conteudo',
    configResolved(c) {
      dev = c.command === 'serve'
    },
    buildStart() {
      rodar((m) => this.warn(m))
    },
    configureServer(server) {
      server.watcher.add('conteudo')
      // várias mudanças seguidas (ex.: a skill gravando 3 arquivos) viram UMA regeração
      let timer: ReturnType<typeof setTimeout> | undefined
      let recarregar = false
      const regerar = () => {
        try {
          const ok = rodar((m) => server.config.logger.warn(m))
          if (ok && recarregar && Date.now() > silencioAte) {
            server.config.logger.info('conteúdo regerado', { timestamp: true })
            server.ws.send({ type: 'full-reload' })
          }
        } catch (e) {
          server.config.logger.error(`conteúdo: falha ao regerar: ${(e as Error).message}`)
        }
        recarregar = false
      }
      server.watcher.on('all', (_ev, arquivo) => {
        // o caminho pode vir relativo ou absoluto, com \ no Windows
        const root = server.config.root
        const f = relative(root, resolve(root, arquivo)).replaceAll('\\', '/')
        if (!f.startsWith('conteudo/') || f.startsWith('conteudo/modelos/')) return
        const caderno = f.startsWith('conteudo/fontes/') && /\.(md|txt)$/i.test(f)
        if (!caderno && !/\.ya?ml$/.test(f)) return
        if (!caderno) recarregar = true
        clearTimeout(timer)
        timer = setTimeout(regerar, 300)
      })

      server.middlewares.use('/__curadoria', async (req, res) => {
        if (!LOCAL.has(req.socket.remoteAddress ?? '')) return json(res, 403, { erro: 'A curadoria só funciona no computador do curador (localhost).' })
        try {
          const url = new URL(req.url ?? '/', 'http://local')
          if (req.method === 'GET' && url.pathname === '/estado') {
            const r = lerConteudo(RAIZ)
            return json(res, 200, { erros: r.erros, avisos: r.avisos, detalhes: r.detalhes })
          }
          if (req.method === 'GET' && url.pathname === '/autoria') return json(res, 200, lerAutoria(RAIZ, url.searchParams.get('id') ?? ''))
          if (req.method === 'POST' && url.pathname === '/acao') {
            const b = (await corpo(req)) as { acao: string; id: string; arquivo?: Alvo['arquivo']; caminho?: Alvo['caminho']; tipo?: string }
            silencioAte = Date.now() + 2500
            let n = 1
            if (b.acao === 'aprovar') aprovar(RAIZ, { id: b.id, arquivo: b.arquivo!, caminho: b.caminho! })
            else if (b.acao === 'remover') remover(RAIZ, { id: b.id, arquivo: b.arquivo!, caminho: b.caminho! })
            else if (b.acao === 'aprovar-todos') n = aprovarTodos(RAIZ, b.id, b.tipo)
            else if (b.acao === 'publicar') publicar(RAIZ, b.id)
            else return json(res, 400, { erro: `ação desconhecida: ${b.acao}` })
            server.config.logger.info(`curadoria: ${b.acao} ${b.id}${b.caminho ? ' ' + b.caminho.join('.') : ''}${n > 1 ? ` (${n} itens)` : ''}`, { timestamp: true })
            return json(res, 200, { ok: true, n })
          }
          json(res, 404, { erro: 'rota desconhecida' })
        } catch (e) {
          json(res, 400, { erro: (e as Error).message })
        }
      })
    },
  }
}
