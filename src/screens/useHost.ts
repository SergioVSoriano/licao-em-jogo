import { useCallback, useEffect, useRef, useState } from 'react'
import { loadPack } from '../content'
import { net, type HostTransport } from '../net'
import { hostCache } from '../net/hostCache'
import { privateFor, reduce, toPublic, type SessionAction } from '../engine/session'
import type { PublicState, SessionState } from '../engine/types'

/** O telão é o "servidor" do jogo: guarda o estado, aplica as regras e publica para os celulares. */
export function useHost(pin: string) {
  const stateRef = useRef<SessionState | null>(null)
  const hostRef = useRef<HostTransport | null>(null)
  const lastPub = useRef('')
  const lastPriv = useRef(new Map<string, string>())
  const lastSnap = useRef(0)
  const [pub, setPub] = useState<PublicState | null>(null)
  const [error, setError] = useState<string | null>(null)

  const publish = useCallback(() => {
    const s = stateRef.current
    const h = hostRef.current
    if (!s || !h) return
    const now = h.serverNow()
    const p = toPublic(s, now)
    const json = JSON.stringify(p)
    if (json !== lastPub.current) {
      lastPub.current = json
      h.publishPublic(json)
      setPub(p)
    }
    for (const pid of Object.keys(s.players)) {
      if (s.players[pid].bot) continue
      const pj = JSON.stringify(privateFor(s, pid, now))
      if (lastPriv.current.get(pid) !== pj) {
        lastPriv.current.set(pid, pj)
        h.publishPrivate(pid, pj)
      }
    }
    if (Date.now() - lastSnap.current > 1500) {
      lastSnap.current = Date.now()
      h.saveSnapshot(JSON.stringify(s))
    }
  }, [])

  const dispatch = useCallback(
    (a: SessionAction) => {
      const s = stateRef.current
      const h = hostRef.current
      if (!s || !h) return
      try {
        reduce(s, a, h.serverNow())
      } catch (e) {
        console.error('Erro ao processar ação', a, e)
      }
      publish()
    },
    [publish],
  )

  useEffect(() => {
    let alive = true
    const unsubs: (() => void)[] = []
    let timer: ReturnType<typeof setInterval> | undefined
    ;(async () => {
      let entry = hostCache.get(pin)
      if (!entry) {
        const opened = await net.openHost(pin)
        if (!opened || !opened.snapshot) {
          if (alive) setError('Sala não encontrada neste dispositivo. Crie uma nova sala.')
          return
        }
        entry = { host: opened.host, state: JSON.parse(opened.snapshot) as SessionState }
      }
      // o motor lê o pacote de forma síncrona: ele precisa estar carregado antes do primeiro tick
      await loadPack(entry.state.packId)
      if (!alive) return
      hostRef.current = entry.host
      stateRef.current = entry.state
      unsubs.push(entry.host.onInput((msg) => dispatch({ type: 'input', msg })))
      unsubs.push(entry.host.onPresence((pid, online) => dispatch({ type: 'presence', pid, online })))
      timer = setInterval(() => dispatch({ type: 'tick' }), 250)
      publish()
    })().catch((e) => alive && setError(String(e)))
    return () => {
      alive = false
      if (timer) clearInterval(timer)
      unsubs.forEach((u) => u())
    }
  }, [pin, dispatch, publish])

  const clock = useCallback(() => hostRef.current?.serverNow() ?? Date.now(), [])
  return { pub, dispatch, error, clock, judgeKey: stateRef.current?.judgeKey ?? '', mode: hostRef.current?.mode }
}
