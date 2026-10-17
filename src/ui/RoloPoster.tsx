import { toPng } from 'html-to-image'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ContentPack, Truth } from '../content/types'
import { sectionLabel } from '../content'
import { Btn, Lume } from './kit'



/** Cartão de um tópico do Rolo (claro para celular/web, escuro para o telão). */
export function TruthCard({ t, label, dark, onClick, compact }: { t: Truth; label: string; dark?: boolean; onClick?: () => void; compact?: boolean }) {
  return (
    <div
      onClick={onClick}
      className={`flex flex-col gap-[0.45em] rounded-[1em] p-[0.8em] ${onClick ? 'cursor-pointer transition hover:scale-[1.01]' : ''} ${dark ? 'bg-white/10 text-white hover:bg-white/15' : 'card'}`}
    >
      <div className="flex items-center gap-[0.5em]">
        <span className="text-[1.4em] leading-none">{t.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className={`text-[0.7em] font-bold tracking-wide uppercase ${dark ? 'opacity-70' : 'text-[var(--muted)]'}`}>{label}</div>
          <div className="font-display text-[1.05em] font-black leading-tight" style={{ color: dark ? 'var(--ouro)' : undefined }}>
            {t.title}
          </div>
        </div>
      </div>
      <div className="font-semibold leading-snug">{t.text}</div>
      {!compact && <div className={`text-[0.9em] leading-snug ${dark ? 'opacity-85' : 'text-[var(--muted)]'}`}>📖 {t.lesson}</div>}
      <div className="flex flex-col gap-[0.25em]">
        {(compact ? t.examples.slice(0, 1) : t.examples).map((e) => (
          <div key={e.ref} className="text-[0.88em] leading-snug">
            <b style={{ color: dark ? 'var(--ouro)' : 'var(--purpura)' }}>{e.ref}</b> {e.text}
          </div>
        ))}
      </div>
      <div className={`mt-auto rounded-[0.7em] border-2 border-dashed px-[0.6em] py-[0.35em] text-[0.9em] font-bold ${dark ? 'border-[var(--ouro)]/70' : 'border-[var(--ouro)]'}`}>🗣️ {t.question}</div>
    </div>
  )
}

/** A imagem 1080×1920 (formato de story) com a lição inteira. */
export function Poster({ pack }: { pack: ContentPack }) {
  return (
    <div
      style={{
        width: 1080,
        minHeight: 1920,
        padding: 56,
        boxSizing: 'border-box',
        fontFamily: "'Noto Sans', sans-serif",
        color: '#fff',
        background: 'radial-gradient(120% 70% at 50% 0%, #4a3a9c 0%, #2b2263 45%, #1b1840 100%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <Lume size={110} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 4, opacity: 0.8 }}>📜 ROLO DA LIÇÃO · {pack.dates.toUpperCase()}</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 76, lineHeight: 1 }}>{pack.title}</div>
          <div style={{ fontSize: 26, opacity: 0.85 }}>
            {pack.subtitle} · {pack.keyText}
          </div>
        </div>
      </div>
      <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 34, lineHeight: 1.25, color: '#ffd166' }}>{pack.bigIdea}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        {pack.truths.map((t) => (
          <div key={t.id} style={{ display: 'flex', gap: 18, background: 'rgba(255,255,255,.09)', borderRadius: 26, padding: '16px 22px' }}>
            <div style={{ fontSize: 54, lineHeight: 1 }}>{t.emoji}</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 32, color: '#ffb703' }}>{t.title}</span>
                <span style={{ fontSize: 20, opacity: 0.65, fontWeight: 700 }}>{sectionLabel(pack, t.section).toUpperCase()}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.25 }}>{t.text}</div>
              <div style={{ fontSize: 22, lineHeight: 1.3, opacity: 0.9 }}>
                <b style={{ color: '#ffd166' }}>{t.examples[0].ref}</b> {t.examples[0].text}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3 }}>🗣️ {t.question}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, opacity: 0.7 }}>
        <span>Leitura extra: Profetas e Reis, cap. 14</span>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900 }}>Lição em Jogo</span>
      </div>
    </div>
  )
}

/** Botão que gera a imagem do Rolo e compartilha (celular) ou baixa (computador). */
export function DownloadRolo({ pack, dark, label = '🖼️ Baixar o Rolo como imagem' }: { pack: ContentPack; dark?: boolean; label?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)

  async function run() {
    setBusy(true)
    setShow(true)
    await new Promise((r) => setTimeout(r, 150))
    try {
      const node = ref.current!.firstElementChild as HTMLElement
      const withTimeout = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])
      let url: string
      try {
        url = await withTimeout(toPng(node, { pixelRatio: 1 }), 12000)
      } catch {
        // plano B: sem embutir as fontes da web (usa as fontes do aparelho)
        url = await withTimeout(toPng(node, { pixelRatio: 1, skipFonts: true }), 12000)
      }
      const name = `rolo-${pack.id}.png`
      const blob = await (await fetch(url)).blob()
      const file = new File([blob], name, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Rolo da Lição: ${pack.title}` }).catch(() => {})
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = name
        a.click()
      }
    } catch (e) {
      alert('Não foi possível gerar a imagem neste navegador.')
      console.error(e)
    } finally {
      setShow(false)
      setBusy(false)
    }
  }

  return (
    <>
      <Btn tone={dark ? 'neutral' : 'purple'} onClick={run} disabled={busy}>
        {busy ? 'Gerando…' : label}
      </Btn>
      {show &&
        createPortal(
          <div ref={ref} style={{ position: 'fixed', left: -12000, top: 0, pointerEvents: 'none' }} aria-hidden>
            <Poster pack={pack} />
          </div>,
          document.body,
        )}
    </>
  )
}
