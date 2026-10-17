/** npm run conteudo:validar  ·  npm run conteudo:construir */
import { construirConteudo, lerConteudo } from './construir'

const cmd = process.argv[2] ?? 'validar'
const r = cmd === 'construir' ? construirConteudo() : lerConteudo()

for (const a of r.avisos) console.log(`⚠️  ${a}`)
for (const e of r.erros) console.log(`❌ ${e}`)
if (r.erros.length) {
  console.log(`\n${r.erros.length} erro(s). Nada foi gerado.`)
  process.exit(1)
}
const pub = r.pacotes.filter((p) => p.status === 'publicado').length
console.log(`✅ ${r.pacotes.length} pacote(s) válido(s), ${pub} publicado(s), ${r.avisos.length} aviso(s).${cmd === 'construir' ? ' Gerado em public/conteudo/.' : ''}`)
