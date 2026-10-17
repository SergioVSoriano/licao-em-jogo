import type { InputMsg } from '../engine/types'

export type Unsub = () => void

export interface HostTransport {
  mode: 'local' | 'firebase'
  publishPublic(json: string): void
  publishPrivate(pid: string, json: string): void
  saveSnapshot(json: string): void
  onInput(cb: (msg: InputMsg) => void): Unsub
  onPresence(cb: (pid: string, online: boolean) => void): Unsub
  serverNow(): number
  close(): void
}

export interface PlayerTransport {
  mode: 'local' | 'firebase'
  pid: string
  onPublic(cb: (json: string | null) => void): Unsub
  onPrivate(cb: (json: string | null) => void): Unsub
  send(type: string, data?: any): void
  serverNow(): number
  close(): void
}

export interface Net {
  mode: 'local' | 'firebase'
  createRoom(): Promise<{ pin: string; host: HostTransport }>
  openHost(pin: string): Promise<{ host: HostTransport; snapshot: string | null } | null>
  join(pin: string): Promise<PlayerTransport | null>
  roomExists(pin: string): Promise<boolean>
}
