/**
 * Formato de AUTORIA do conteúdo (os YAML de conteudo/). O validador usa este esquema;
 * o app recebe o JSON gerado em public/conteudo/ (tipos em src/content/types.ts).
 * Regras de curadoria: conteudo/REGRAS.md.
 */
import { z } from 'zod'

export const JOGOS = ['nuvem', 'linha', 'verdade', 'sinais', 'sortes', 'duelo', 'acrostico', 'fruto', 'sonho', 'disfarcados', 'atos', 'voz'] as const

const texto = z.string().trim().min(1)
/** quem escreveu o item: o curador (padrão) ou a IA (precisa de revisão antes de publicar) */
const origem = z.enum(['curador', 'gerado']).optional()
const trecho = z.object({ ref: texto, texto: texto }).strict()
/**
 * Trechos LITERAIS do caderno do curador (conteudo/fontes/<id>/) que sustentam um texto interpretativo
 * resumido ou reorganizado. O validador confere que cada trecho existe no caderno.
 */
const base = z.array(z.string().trim().min(12, 'trecho de base muito curto (use ao menos uma frase do caderno)')).optional()

/* ───────── pacote.yaml ───────── */
export const Verdade = z
  .object({
    id: texto,
    secao: texto,
    emoji: texto,
    titulo: texto,
    texto: texto,
    refs: z.array(texto),
    naLicao: texto,
    exemplos: z.array(trecho),
    pergunta: texto,
    origem,
    base,
  })
  .strict()

export const PersonagemDoPacote = z
  .object({
    id: texto,
    bio: texto,
    refs: texto,
    pistas: z.tuple([texto, texto, texto]),
    disfarcado: z.boolean().default(false),
    origem,
  })
  .strict()

export const PacoteBase = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'use só letras minúsculas, números e hífens'),
    tipo: z.enum(['licao', 'tema', 'livro']),
    titulo: texto,
    subtitulo: texto,
    datas: z.string().default(''),
    textoBase: texto,
    publico: z.array(z.enum(['criancas', 'jovens', 'adultos', 'todos'])).min(1),
    status: z.enum(['rascunho', 'publicado']),
    curadoria: z
      .object({ curador: texto, revisadoEm: z.string().nullable().default(null), observacao: z.string().optional() })
      .strict(),
    fontes: z.array(z.object({ tipo: texto, descricao: texto, url: z.string().url().optional() }).strict()).min(1),
    abertura: z.object({ versiculo: trecho, tirinha: z.tuple([texto, texto, texto]), ideiaCentral: texto, origem, base }).strict(),
    secoes: z.array(z.object({ id: texto, titulo: texto }).strict()).min(1),
    verdades: z.array(Verdade).min(1),
    personagens: z.array(PersonagemDoPacote).default([]),
    coberturaDosJogos: z.partialRecord(z.enum(JOGOS), z.array(texto)).default({}),
  })
  .strict()

/* ───────── jogos.yaml (tudo opcional) ───────── */
export const Jogos = z
  .object({
    perguntas: z
      .array(
        z
          .object({
            pergunta: texto,
            opcoes: z.tuple([texto, texto, texto, texto]),
            correta: texto,
            explicacao: texto,
            ref: texto,
            verdade: texto,
            origem,
          })
          .strict()
          .refine((q) => q.opcoes.includes(q.correta), { message: '"correta" precisa ser igual a uma das opções' }),
      )
      .default([]),
    verdadeiroOuFalso: z
      .array(z.object({ afirmacao: texto, verdadeira: z.boolean(), explicacao: texto, ref: texto, verdade: texto, origem }).strict())
      .default([]),
    linhasDoTempo: z
      .array(z.object({ id: texto, titulo: texto, ref: texto, eventos: z.array(texto).min(3), origem }).strict())
      .default([]),
    tresSinais: z
      .array(
        z
          .object({
            resposta: texto,
            tipo: z.enum(['Quem é?', 'Onde é?', 'O que é?']),
            dicas: z.tuple([texto, texto, texto]),
            aceitas: z.array(texto).min(1),
            palpitesErrados: z.array(texto).min(1),
            ref: texto,
            origem,
          })
          .strict(),
      )
      .default([]),
    frutoProibido: z.array(z.object({ palavra: texto, proibidas: z.array(texto).min(3), origem }).strict()).default([]),
    palavrasDoSonho: z.array(texto).default([]),
    temasAcrostico: z.array(texto).default([]),
    mimicas: z.array(z.object({ cena: texto, dificil: z.boolean(), origem }).strict()).default([]),
    nuvem: z
      .array(z.object({ pergunta: texto, pontua: z.boolean(), verdade: texto, sinonimos: z.record(z.string(), z.string()).optional(), origem, base }).strict())
      .default([]),
    vozProfetica: z.array(z.object({ caso: texto, ref: texto, origem, base }).strict()).default([]),
    disfarcados: z.record(z.string(), z.array(texto).min(1)).default({}),
    curiosidades: z.array(texto).default([]),
    /** listas de texto simples criadas pela IA (não dá para marcar item a item); o curador aprova a lista inteira */
    listasGeradas: z.array(z.enum(['palavrasDoSonho', 'temasAcrostico', 'curiosidades', 'disfarcados'])).default([]),
  })
  .strict()

/* ───────── reflexoes.yaml (campos interpretativos: só o curador) ───────── */
export const Reflexoes = z
  .object({
    revelacoes: z
      .array(
        z
          .object({
            jogo: z.enum(JOGOS).optional(),
            verdade: texto,
            versiculo: trecho,
            naLicao: texto,
            naBiblia: z.array(trecho),
            ideia: texto,
            pergunta: texto,
            enquete: z.object({ pergunta: texto, opcoes: z.array(texto).min(2).max(6) }).strict(),
            outrasPerguntas: z.array(texto).default([]),
            nota: z.string().optional(),
            origem,
            base,
          })
          .strict(),
      )
      .min(1),
    /** frase que liga cada estação do mapa ao conteúdo: texto simples ou { texto, origem, base } */
    pontesDoSantuario: z.record(z.string(), z.union([texto, z.object({ texto: texto, origem, base }).strict()])).default({}),
    resumo: z.object({ perguntas: z.array(texto), versiculos: z.array(trecho), origem, base }).strict(),
  })
  .strict()

/* ───────── comum/ ───────── */
export const Estacoes = z
  .object({ estacoes: z.array(z.object({ id: texto, nome: texto, emoji: texto, significado: texto, ref: texto }).strict()).length(8) })
  .strict()
export const Personagens = z.object({ personagens: z.array(z.object({ id: texto, nome: texto, emoji: texto }).strict()) }).strict()
export const LivrosBiblicos = z.object({ livros: z.array(z.object({ nome: texto, abrev: z.array(texto) }).strict()).length(66) }).strict()

/* ───────── catalogo.yaml ───────── */
const ItemCatalogo = { titulo: texto, emoji: z.string().optional(), datas: z.string().optional(), textoBase: z.string().optional(), pacote: z.string().optional() }
export const Catalogo = z
  .object({
    padrao: texto,
    licao: z.array(
      z
        .object({
          publico: texto,
          titulo: texto,
          trimestres: z.array(
            z
              .object({
                id: texto,
                titulo: texto,
                /** sábado da semana 1 (AAAA-MM-DD): o app calcula as datas e destaca a semana atual */
                inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'use AAAA-MM-DD').optional(),
                semanas: z.array(z.object({ n: z.number().int().positive(), ...ItemCatalogo }).strict()),
              })
              .strict(),
          ),
        })
        .strict(),
    ),
    temas: z.array(z.object({ categoria: texto, itens: z.array(z.object({ id: texto, ...ItemCatalogo }).strict()) }).strict()),
    livros: z.array(
      z
        .object({
          id: texto,
          titulo: texto,
          emoji: z.string().optional(),
          autor: texto,
          capitulos: z.array(z.object({ n: z.number().int().positive(), ...ItemCatalogo }).strict()),
        })
        .strict(),
    ),
  })
  .strict()

/** Campos interpretativos: só podem vir do caderno do curador (literal ou com "base"). Ver conteudo/REGRAS.md. */
export const CAMPOS_INTERPRETATIVOS = {
  abertura: ['ideiaCentral'],
  verdades: ['texto', 'naLicao', 'pergunta'],
  revelacoes: ['naLicao', 'ideia', 'pergunta', 'enquete.pergunta', 'outrasPerguntas'],
  nuvem: ['pergunta'],
  vozProfetica: ['caso'],
  resumo: ['perguntas'],
} as const

export type TPacoteBase = z.infer<typeof PacoteBase>
export type TJogos = z.infer<typeof Jogos>
export type TReflexoes = z.infer<typeof Reflexoes>
export type TCatalogo = z.infer<typeof Catalogo>
