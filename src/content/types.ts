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

export interface Truth { id: string; day: Day; title: string; text: string; refs: string[] }

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
export interface ThreeSigns { answer: string; clues: [string, string, string]; options: string[]; ref: string }
export interface TabooCard { word: string; forbidden: string[] }
export interface Mime { text: string; hard: boolean }
export interface CloudPrompt { text: string; synonyms?: Record<string, string>; scored: boolean; truth: string }
export interface PitchCase { text: string; ref: string }

export interface Revelation {
  game: string
  truth: string
  verse: string
  verseText: string
  insight: string
  question: string
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
