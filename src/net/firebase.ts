import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth'
import {
  getDatabase,
  ref,
  set,
  get,
  push,
  remove,
  onValue,
  onChildAdded,
  onDisconnect,
  serverTimestamp,
  type Database,
} from 'firebase/database'
import type { InputMsg } from '../engine/types'
import type { HostTransport, Net, PlayerTransport } from './types'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigured = !!(config.apiKey && config.databaseURL)

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Database | null = null
let offset = 0
let ready: Promise<string> | null = null

function boot(): Promise<string> {
  if (ready) return ready
  ready = (async () => {
    app = initializeApp(config)
    auth = getAuth(app)
    db = getDatabase(app)
    onValue(ref(db, '.info/serverTimeOffset'), (snap) => {
      offset = Number(snap.val() ?? 0)
    })
    const cred = await signInAnonymously(auth)
    return cred.user.uid
  })()
  return ready
}

const now = () => Date.now() + offset
const path = (pin: string, p: string) => `rooms/${pin}/${p}`

function hostTransport(pin: string): HostTransport {
  const d = db!
  const unsubs: (() => void)[] = []
  return {
    mode: 'firebase',
    publishPublic(json) {
      set(ref(d, path(pin, 'public')), json)
    },
    publishPrivate(pid, json) {
      set(ref(d, path(pin, `private/${pid}`)), json)
    },
    saveSnapshot(json) {
      set(ref(d, path(pin, 'snapshot')), json)
    },
    onInput(cb) {
      const u = onChildAdded(ref(d, path(pin, 'inputs')), (snap) => {
        const v = snap.val() as InputMsg | null
        if (v) cb(v)
        remove(snap.ref)
      })
      unsubs.push(u)
      return u
    },
    onPresence(cb) {
      const known = new Map<string, boolean>()
      const u = onValue(ref(d, path(pin, 'presence')), (snap) => {
        const v = (snap.val() ?? {}) as Record<string, boolean>
        for (const [pid, on] of Object.entries(v)) {
          if (known.get(pid) !== on) {
            known.set(pid, on)
            cb(pid, on)
          }
        }
      })
      unsubs.push(u)
      return u
    },
    serverNow: now,
    close() {
      unsubs.forEach((u) => u())
    },
  }
}

function playerTransport(pin: string, uid: string): PlayerTransport {
  const d = db!
  const unsubs: (() => void)[] = []
  const presRef = ref(d, path(pin, `presence/${uid}`))
  const connUnsub = onValue(ref(d, '.info/connected'), (snap) => {
    if (snap.val() === true) {
      onDisconnect(presRef).set(false)
      set(presRef, true)
    }
  })
  unsubs.push(connUnsub)
  return {
    mode: 'firebase',
    pid: uid,
    onPublic(cb) {
      const u = onValue(ref(d, path(pin, 'public')), (snap) => cb(snap.val()))
      unsubs.push(u)
      return u
    },
    onPrivate(cb) {
      const u = onValue(ref(d, path(pin, `private/${uid}`)), (snap) => cb(snap.val()))
      unsubs.push(u)
      return u
    },
    send(type, data) {
      push(ref(d, path(pin, 'inputs')), JSON.parse(JSON.stringify({ pid: uid, type, data: data ?? null, at: now() })))
    },
    serverNow: now,
    close() {
      set(presRef, false)
      unsubs.forEach((u) => u())
    },
  }
}

export const firebaseNet: Net = {
  mode: 'firebase',
  async createRoom() {
    const uid = await boot()
    let pin = ''
    for (let i = 0; i < 20; i++) {
      pin = String(Math.floor(100000 + Math.random() * 900000))
      const snap = await get(ref(db!, path(pin, 'meta')))
      if (!snap.exists()) break
    }
    await set(ref(db!, path(pin, 'meta')), { hostUid: uid, createdAt: serverTimestamp() })
    return { pin, host: hostTransport(pin) }
  },
  async openHost(pin) {
    const uid = await boot()
    const meta = await get(ref(db!, path(pin, 'meta')))
    if (!meta.exists() || meta.val().hostUid !== uid) return null
    const snap = await get(ref(db!, path(pin, 'snapshot')))
    return { host: hostTransport(pin), snapshot: snap.exists() ? (snap.val() as string) : null }
  },
  async join(pin) {
    const uid = await boot()
    const meta = await get(ref(db!, path(pin, 'meta')))
    if (!meta.exists()) return null
    return playerTransport(pin, uid)
  },
  async roomExists(pin) {
    await boot()
    const meta = await get(ref(db!, path(pin, 'meta')))
    return meta.exists()
  },
}
