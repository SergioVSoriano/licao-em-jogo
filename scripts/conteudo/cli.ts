/**
 * npm run conteudo:validar [id]          confere tudo (ou só um pacote, com detalhes)
 * npm run conteudo:construir             valida e gera public/conteudo/
 * npm run conteudo:novo <id> "<título>"  cria um pacote rascunho + o caderno do curador
 * npm run conteudo:publicar <id>         publica (só no terminal do curador, com confirmação)
 */
import { createInterface } from 'node:readline/promises'
import { construirConteudo, lerConteudo } from './construir'
import { novoPacote, publicar } from './editar'

const [cmd = 'validar', ...args] = process.argv.slice(2)
const RAIZ = 'conteudo'

function relatorio(r: ReturnType<typeof lerConteudo>, gerou: boolean) {
  for (const a of r.avisos) console.log(`⚠️  ${a}`)
  for (const e of r.erros) console.log(`❌ ${e}`)
  if (r.erros.length) {
    console.log(`\n${r.erros.length} erro(s).${gerou ? ' Nada foi gerado.' : ''}`)
    process.exit(1)
  }
  const pub = r.pacotes.filter((p) => p.status === 'publicado').length
  console.log(`✅ ${r.pacotes.length} pacote(s) válido(s), ${pub} publicado(s), ${r.avisos.length} aviso(s).${gerou ? ' Gerado em public/conteudo/.' : ''}`)
}

if (cmd === 'construir') relatorio(construirConteudo(), true)
else if (cmd === 'validar' && args[0]) {
  const r = lerConteudo(RAIZ)
  const d = r.detalhes.find((x) => x.id === args[0])
  if (!d) {
    console.log(`❌ pacote "${args[0]}" não encontrado`)
    process.exit(1)
  }
  console.log(`📦 ${d.id} · ${d.titulo ?? ''} · ${d.status}${d.temCaderno ? ` · caderno: ${d.arquivosCaderno.length} arquivo(s)` : ' · SEM caderno'}`)
  const cont = (s: string) => d.origem.filter((o) => o.status === s).length
  if (d.temCaderno) console.log(`   origem: ${cont('literal')} do caderno, ${cont('base')} síntese(s) com base, ${cont('sem-origem')} sem origem`)
  console.log(`   para o curador revisar: ${d.pendentes}  (${d.gerados.length} gerado(s), ${d.origem.filter((o) => o.pendente).length} síntese(s))`)
  for (const a of d.avisos) console.log(`⚠️  ${a}`)
  for (const e of d.erros) console.log(`❌ ${e}`)
  console.log(d.erros.length ? `\n${d.erros.length} erro(s).` : d.podePublicar ? '\n✅ Pronto para o curador publicar.' : `\n✅ Sem erros. Falta a revisão do curador em /curadoria/${d.id}.`)
  process.exit(d.erros.length ? 1 : 0)
} else if (cmd === 'validar') relatorio(lerConteudo(RAIZ), false)
else if (cmd === 'novo') {
  const [id, ...titulo] = args
  if (!id || !titulo.length) {
    console.log('Uso: npm run conteudo:novo -- <id> "<título>"   (id: licao-2026-t4-jovens-s04, tema-noe, livro-egw-profetas-e-reis-c14)')
    process.exit(1)
  }
  const r = novoPacote(RAIZ, id, titulo.join(' '))
  console.log(`✅ Pacote rascunho criado em ${r.pasta}\n📓 Caderno do curador: ${r.fontes}`)
  console.log(r.ligado ? '🔗 Ligado ao item do catalogo.yaml (fica travado até publicar).' : '⚠️  Não achei o item no catalogo.yaml: adicione a entrada com "pacote: ' + id + '".')
} else if (cmd === 'publicar') {
  const id = args[0]
  if (!id) {
    console.log('Uso: npm run conteudo:publicar -- <id>')
    process.exit(1)
  }
  // publicar é decisão do curador: exige uma pessoa no terminal
  if (!process.stdin.isTTY) {
    console.log('❌ Publicar exige confirmação de uma pessoa: rode este comando no seu terminal (ou use o botão Publicar em /curadoria).')
    process.exit(1)
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const resp = await rl.question(`Você revisou o pacote "${id}" e quer publicá-lo para todos? Digite o id para confirmar: `)
  rl.close()
  if (resp.trim() !== id) {
    console.log('Cancelado.')
    process.exit(1)
  }
  publicar(RAIZ, id)
  console.log(`✅ ${id} publicado. Faça o commit e o deploy para liberar no site.`)
} else {
  console.log(`Comando desconhecido: ${cmd}`)
  process.exit(1)
}
