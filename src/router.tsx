import { useEffect, useState } from 'react'

export function navigate(to: string, replace = false) {
  if (replace) history.replaceState(null, '', to)
  else history.pushState(null, '', to)
  window.dispatchEvent(new Event('lej:nav'))
  window.scrollTo(0, 0)
}

export function usePath() {
  const [path, setPath] = useState(location.pathname)
  useEffect(() => {
    const on = () => setPath(location.pathname)
    window.addEventListener('popstate', on)
    window.addEventListener('lej:nav', on)
    return () => {
      window.removeEventListener('popstate', on)
      window.removeEventListener('lej:nav', on)
    }
  }, [])
  return path
}

export function Link({ to, children, className = '' }: { to: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey) return
        e.preventDefault()
        navigate(to)
      }}
    >
      {children}
    </a>
  )
}

export function joinUrl(pin: string) {
  return `${location.origin}/j/${pin}`
}
