/**
 * Gera public/conteudo/ a partir de conteudo/ no início do `vite` (dev) e do `vite build`,
 * e regera quando um YAML muda durante o dev (recarregando a página).
 */
import { relative, resolve } from 'node:path'
import type { Plugin } from 'vite'
import { construirConteudo } from './construir'

export function conteudo(): Plugin {
  let dev = false
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
      server.watcher.on('all', (_ev, arquivo) => {
        // o caminho pode vir relativo ou absoluto, com \ no Windows
        const root = server.config.root
        const f = relative(root, resolve(root, arquivo)).replaceAll('\\', '/')
        if (!f.startsWith('conteudo/') || !/\.ya?ml$/.test(f)) return
        if (rodar((m) => server.config.logger.warn(m))) {
          server.config.logger.info('conteúdo regerado', { timestamp: true })
          server.ws.send({ type: 'full-reload' })
        }
      })
    },
  }
}
