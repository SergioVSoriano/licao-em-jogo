/** Efeitos sonoros sintetizados (sem arquivos, sem direitos autorais). Só toca no telão. */
let ctx: AudioContext | null = null
let muted = false
try {
  muted = localStorage.getItem('lej:muted') === '1'
} catch {
  /* ignore */
}

export function isMuted() {
  return muted
}
export function setMuted(m: boolean) {
  muted = m
  try {
    localStorage.setItem('lej:muted', m ? '1' : '0')
  } catch {
    /* ignore */
  }
}

function ac() {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.12, delay = 0, slide?: number) {
  if (muted) return
  try {
    const a = ac()
    const t = a.currentTime + delay
    const o = a.createOscillator()
    const g = a.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t)
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(gain, t + 0.015)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g).connect(a.destination)
    o.start(t)
    o.stop(t + dur + 0.05)
  } catch {
    /* audio not available */
  }
}

export const sfx = {
  pop: () => tone(660, 0.12, 'triangle', 0.12, 0, 990),
  tick: () => tone(1200, 0.05, 'square', 0.04),
  correct: () => {
    tone(660, 0.12, 'triangle', 0.14)
    tone(990, 0.22, 'triangle', 0.14, 0.1)
  },
  wrong: () => tone(220, 0.35, 'sawtooth', 0.07, 0, 140),
  whoosh: () => tone(300, 0.35, 'sine', 0.08, 0, 900),
  step: () => tone(520 + Math.random() * 80, 0.07, 'triangle', 0.06),
  fanfare: () => {
    ;[523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, 'triangle', 0.13, i * 0.13))
    tone(1047, 0.7, 'triangle', 0.12, 0.6)
  },
  drum: () => {
    for (let i = 0; i < 10; i++) tone(90 + i * 6, 0.09, 'square', 0.05, i * 0.09)
  },
  buzz: () => tone(140, 0.5, 'square', 0.1),
  bread: () => {
    tone(784, 0.15, 'sine', 0.1)
    tone(1175, 0.3, 'sine', 0.1, 0.12)
  },
}

export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* ignore */
  }
}
