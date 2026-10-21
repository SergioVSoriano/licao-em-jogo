/**
 * Tipos do relatório de curadoria (gerado por scripts/conteudo/ e exibido em /curadoria).
 * Só tipos: nada daqui vai para o jogo.
 */

/** Como um texto interpretativo se liga ao caderno do curador. */
export type StatusOrigem = 'literal' | 'base' | 'sem-origem'

export interface ItemOrigem {
  arquivo: string
  /** caminho do item dentro do YAML, ex.: ['revelacoes', 2] */
  caminho: (string | number)[]
  rotulo: string
  campos: { campo: string; texto: string; literal: boolean }[]
  base: { trecho: string; achado: boolean; arquivo?: string }[]
  status: StatusOrigem
  origem?: 'curador' | 'gerado'
  /** criado ou resumido pela IA e ainda não aprovado pelo curador */
  pendente: boolean
}

export interface ItemGerado {
  arquivo: string
  caminho: (string | number)[]
  tipo: string
  rotulo: string
  /** lista de palavras/temas inteira marcada como gerada (em listasGeradas) */
  lista?: string
}

export interface DetalhePacote {
  id: string | null
  pasta: string
  titulo?: string
  tipo?: string
  status: 'rascunho' | 'publicado' | 'desconhecido'
  erros: string[]
  avisos: string[]
  temCaderno: boolean
  arquivosCaderno: string[]
  origem: ItemOrigem[]
  gerados: ItemGerado[]
  /** itens que o curador ainda precisa revisar antes de publicar */
  pendentes: number
  podePublicar: boolean
}
