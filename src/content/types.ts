export type Day = 'sab' | 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex'
export const DAYS: { id: Day; short: string; label: string }[] = [
  { id: 'sab', short: 'S', label: 'Sábado' },
  { id: 'dom', short: 'D', label: 'Domingo' },
  { id: 'seg', short: 'S', label: 'Segunda' },
  { id: 'ter', short: 'T', label: 'Terça' },
  { id: 'qua', short: 'Q', label: 'Quarta' },
  { id: 'qui', short: 'Q', label: 'Quinta' },
  { id: 'sex', short: 'S', label: 'Sexta' },
]

export interface Truth {
  id: string
  day: Day
  title: string
  text: string
  refs: string[]
  /** como aparece na lição, bem resumido */
  lesson: string
  /** exemplos e trechos bíblicos */
  examples: BibleBit[]
  /** pergunta para discutir o tópico */
  question: string
  emoji: string
}

export interface Character {
  id: string
  name: string
  emoji: string
  bio: string
  refs: string
  clues: [string, string, string]
  inDisguise?: boolean
}

export interface MCQuestion {
  q: string
  options: [string, string, string, string]
  answer: number
  explain: string
  ref: string
  truth: string
}

export interface TFStatement { text: string; isTrue: boolean; explain: string; ref: string; truth: string }
export interface Timeline { id: string; title: string; ref: string; events: string[] }
export interface ThreeSigns {
  answer: string
  /** "Quem é?", "Onde é?", "O que é?" */
  ask: string
  clues: [string, string, string]
  /** respostas aceitas (sem acento/maiúsculas; erros de digitação leves também valem) */
  accept: string[]
  /** palpites errados plausíveis (usados pelos robôs) */
  options: string[]
  ref: string
}
export interface TabooCard { word: string; forbidden: string[] }
export interface Mime { text: string; hard: boolean }
export interface CloudPrompt { text: string; synonyms?: Record<string, string>; scored: boolean; truth: string }
export interface PitchCase { text: string; ref: string }

export interface BibleBit { ref: string; text: string }

export interface Revelation {
  game: string
  truth: string
  verse: string
  verseText: string
  /** como a lição apresenta o tema (dia + resumo) */
  lesson: string
  /** exemplos/trechos bíblicos curtos */
  bible: BibleBit[]
  insight: string
  /** pergunta principal: pessoal, leve e que dá vontade de responder */
  question: string
  /** enquete rápida no celular: todos votam e o telão mostra o resultado */
  poll: { q: string; options: string[] }
  /** perguntas extras para aprofundar ("Outra pergunta") */
  followUps: string[]
  note?: string
}

export interface Station { id: string; name: string; emoji: string; meaning: string; bridge: string; ref: string }

export interface ContentPack {
  id: string
  title: string
  subtitle: string
  dates: string
  keyText: string
  openingVerse: { ref: string; text: string }
  comic: [string, string, string]
  bigIdea: string
  truths: Truth[]
  characters: Character[]
  questions: MCQuestion[]
  trueFalse: TFStatement[]
  timelines: Timeline[]
  threeSigns: ThreeSigns[]
  taboo: TabooCard[]
  dreamWords: string[]
  acrosticThemes: string[]
  mimes: Mime[]
  cloudPrompts: CloudPrompt[]
  pitchCases: PitchCase[]
  revelations: Revelation[]
  stations: Station[]
  funFacts: string[]
  disguiseClues: Record<string, string[]>
  summary: { questions: string[]; verses: { ref: string; text: string }[] }
}
