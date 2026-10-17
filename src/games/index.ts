import type { GameDef } from '../engine/types'
import { acrostico } from './acrostico'
import { atos } from './atos'
import { disfarcados } from './disfarcados'
import { duelo } from './duelo'
import { fruto } from './fruto'
import { linha } from './linha'
import { nuvem } from './nuvem'
import { sinais } from './sinais'
import { sonho } from './sonho'
import { sortes } from './sortes'
import { verdade } from './verdade'
import { voz } from './voz'

/** Catálogo na ordem em que aparece para o facilitador. */
export const GAMES: GameDef[] = [nuvem, verdade, linha, sinais, sortes, duelo, acrostico, fruto, sonho, disfarcados, atos, voz]

export const GAME_BY_ID: Record<string, GameDef> = Object.fromEntries(GAMES.map((g) => [g.id, g]))

export const KIND_LABEL: Record<GameDef['kind'], { label: string; emoji: string; text: string }> = {
  all: { label: 'Todos jogam', emoji: '👥', text: 'Todos respondem ao mesmo tempo' },
  spotlight: { label: 'Holofote', emoji: '🎯', text: 'Alguém na vez + plateia ativa' },
  teams: { label: 'Times', emoji: '🛡️', text: 'Times jogando juntos' },
}
