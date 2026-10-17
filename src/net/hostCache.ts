import type { SessionState } from '../engine/types'
import type { HostTransport } from './types'

/** Passa a sala recém-criada do Planejador para o Telão sem recarregar. */
export const hostCache = new Map<string, { host: HostTransport; state: SessionState }>()
