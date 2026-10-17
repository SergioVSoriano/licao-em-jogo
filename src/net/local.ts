import type { InputMsg } from '../engine/types'
import { uid } from '../engine/helpers'
import type { HostTransport, Net, PlayerTransport } from './types'

/**
 * Modo demonstração: tudo acontece no mesmo navegador (abas diferentes),
 * via BroadcastChannel + localStorage. Ótimo para testar sem configurar o Firebase.
 */
const key = (pin: string, k: string) => `lej:${pin}:${k}`

function safeGet(k: string): string | null {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
function safeSet(k: string, v: string) {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* ignore quota / private mode */
  }
}

function pidForTab(): string {
  try {
    let id = sessionStorage.getItem('lej:pid')
    if (!id) {
      id = 'p-' + uid(10)
      sessionStorage.setItem('lej:pid', id)
    }
    return id
  } catch {
    return 'p-' + uid(10)
  }
}

type Msg =
  | { t: 'pub'; data: string }
  | { t: 'priv'; pid: string; data: string }
  | { t: 'in'; msg: InputMsg }
  | { t: 'hb'; pid: string; online: boolean }

function hostTransport(pin: string): HostTransport {
  const ch = new BroadcastChannel('lej-' + pin)
  const inputCbs = new Set<(m: InputMsg) => void>()
  const presenceCbs = new Set<(pid: string, online: boolean) => void>()
  const lastSeen = new Map<string, number>()
  const onlineSet = new Set<string>()
  ch.onmessage = (ev: MessageEvent<Msg>) => {
    const m = ev.data
    if (m.t === 'in') inputCbs.forEach((cb) => cb(m.msg))
    if (m.t === 'hb') {
      lastSeen.set(m.pid, m.online ? Date.now() : 0)
      if (m.online && !onlineSet.has(m.pid)) {
        onlineSet.add(m.pid)
        presenceCbs.forEach((cb) => cb(m.pid, true))
      }
      if (!m.online && onlineSet.has(m.pid)) {
        onlineSet.delete(m.pid)
        presenceCbs.forEach((cb) => cb(m.pid, false))
      }
    }
  }
  const timer = setInterval(() => {
    const now = Date.now()
    for (const [pid, t] of lastSeen) {
      if (onlineSet.has(pid) && now - t > 7000) {
        onlineSet.delete(pid)
        presenceCbs.forEach((cb) => cb(pid, false))
      }
    }
  }, 2000)
  safeSet(key(pin, 'meta'), JSON.stringify({ createdAt: Date.now() }))
  return {
    mode: 'local',
    publishPublic(json) {
      safeSet(key(pin, 'pub'), json)
      ch.postMessage({ t: 'pub', data: json } satisfies Msg)
    },
    publishPrivate(pid, json) {
      safeSet(key(pin, 'priv:' + pid), json)
      ch.postMessage({ t: 'priv', pid, data: json } satisfies Msg)
    },
    saveSnapshot(json) {
      safeSet(key(pin, 'snap'), json)
    },
    onInput(cb) {
      inputCbs.add(cb)
      return () => inputCbs.delete(cb)
    },
    onPresence(cb) {
      presenceCbs.add(cb)
      return () => presenceCbs.delete(cb)
    },
    serverNow: () => Date.now(),
    close() {
      clearInterval(timer)
      ch.close()
    },
  }
}

function playerTransport(pin: string): PlayerTransport {
  const ch = new BroadcastChannel('lej-' + pin)
  const pid = pidForTab()
  const pubCbs = new Set<(j: string | null) => void>()
  const privCbs = new Set<(j: string | null) => void>()
  ch.onmessage = (ev: MessageEvent<Msg>) => {
    const m = ev.data
    if (m.t === 'pub') pubCbs.forEach((cb) => cb(m.data))
    if (m.t === 'priv' && m.pid === pid) privCbs.forEach((cb) => cb(m.data))
  }
  const beat = () => ch.postMessage({ t: 'hb', pid, online: true } satisfies Msg)
  beat()
  const timer = setInterval(beat, 2500)
  const bye = () => ch.postMessage({ t: 'hb', pid, online: false } satisfies Msg)
  window.addEventListener('pagehide', bye)
  return {
    mode: 'local',
    pid,
    onPublic(cb) {
      pubCbs.add(cb)
      cb(safeGet(key(pin, 'pub')))
      return () => pubCbs.delete(cb)
    },
    onPrivate(cb) {
      privCbs.add(cb)
      cb(safeGet(key(pin, 'priv:' + pid)))
      return () => privCbs.delete(cb)
    },
    send(type, data) {
      ch.postMessage({ t: 'in', msg: { pid, type, data, at: Date.now() } } satisfies Msg)
    },
    serverNow: () => Date.now(),
    close() {
      clearInterval(timer)
      window.removeEventListener('pagehide', bye)
      bye()
      ch.close()
    },
  }
}

export const localNet: Net = {
  mode: 'local',
  async createRoom() {
    let pin = ''
    do pin = String(Math.floor(100000 + Math.random() * 900000))
    while (safeGet(key(pin, 'meta')))
    return { pin, host: hostTransport(pin) }
  },
  async openHost(pin) {
    const snap = safeGet(key(pin, 'snap'))
    if (!snap) return null
    return { host: hostTransport(pin), snapshot: snap }
  },
  async join(pin) {
    if (!safeGet(key(pin, 'meta'))) return null
    return playerTransport(pin)
  },
  async roomExists(pin) {
    return !!safeGet(key(pin, 'meta'))
  },
}
