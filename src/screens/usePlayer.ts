import { useCallback, useEffect, useRef, useState } from 'react'
import { net, type PlayerTransport } from '../net'
import type { PublicState } from '../engine/types'

export function usePlayer(pin: string) {
  const tRef = useRef<PlayerTransport | null>(null)
  const [pub, setPub] = useState<PublicState | null>(null)
  const [priv, setPriv] = useState<any>({})
  const [status, setStatus] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading')
  const [pid, setPid] = useState('')

  useEffect(() => {
    if (!pin) {
      setStatus('notfound')
      return
    }
    let alive = true
    const unsubs: (() => void)[] = []
    net
      .join(pin)
      .then((t) => {
        if (!alive) return t?.close()
        if (!t) return setStatus('notfound')
        tRef.current = t
        setPid(t.pid)
        unsubs.push(t.onPublic((j) => j && setPub(JSON.parse(j))))
        unsubs.push(t.onPrivate((j) => setPriv(j ? JSON.parse(j) : {})))
        setStatus('ok')
      })
      .catch(() => alive && setStatus('error'))
    return () => {
      alive = false
      unsubs.forEach((u) => u())
      tRef.current?.close()
      tRef.current = null
    }
  }, [pin])

  const send = useCallback((type: string, data?: any) => tRef.current?.send(type, data), [])
  const clock = useCallback(() => tRef.current?.serverNow() ?? Date.now(), [])
  return { pub, priv, status, pid, send, clock }
}

/** Mantém a tela do celular acesa durante o jogo. */
export function useWakeLock(on: boolean) {
  useEffect(() => {
    if (!on || !('wakeLock' in navigator)) return
    let lock: any = null
    const req = () =>
      (navigator as any).wakeLock
        .request('screen')
        .then((l: any) => (lock = l))
        .catch(() => {})
    req()
    const vis = () => document.visibilityState === 'visible' && req()
    document.addEventListener('visibilitychange', vis)
    return () => {
      document.removeEventListener('visibilitychange', vis)
      lock?.release?.()
    }
  }, [on])
}
