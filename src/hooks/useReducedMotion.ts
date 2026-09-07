import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/** Tracks the visitor's motion preference and keeps it live if they change it. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(QUERY).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    document.documentElement.classList.toggle('no-motion', mq.matches)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('no-motion', reduced)
  }, [reduced])

  return reduced
}

export type Tier = 'mobile' | 'tablet' | 'desktop'

/** Quality tier. Drives particle counts, DPR and post-processing so mobile gets
 *  a designed experience rather than a throttled desktop one. */
export function useTier(): Tier {
  const [tier, setTier] = useState<Tier>(() => resolveTier())

  useEffect(() => {
    let frame = 0
    const onResize = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setTier(resolveTier()))
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return tier
}

function resolveTier(): Tier {
  if (typeof window === 'undefined') return 'desktop'
  const w = window.innerWidth
  if (w < 760) return 'mobile'
  if (w < 1180) return 'tablet'
  return 'desktop'
}
