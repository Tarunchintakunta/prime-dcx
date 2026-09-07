import { useEffect, useMemo, useRef, useState } from 'react'
import { TICKER_INSTRUMENTS } from '../data/markets'
import { useReducedMotion } from '../hooks/useReducedMotion'

interface Row {
  symbol: string
  price: string
  change: string
  dir: 'up' | 'down'
}

/** Horizontal instrument strip.
 *
 *  The numbers are a deterministic simulation for interface demonstration —
 *  Prime DCX publishes no live feed here, and the strip says so on screen. */
export function MarketTicker() {
  const reduced = useReducedMotion()
  const track = useRef<HTMLDivElement>(null)
  const [rows, setRows] = useState<Row[]>(() => build(0))

  useEffect(() => {
    const id = window.setInterval(() => setRows(build(Date.now() / 1000)), 1600)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (reduced) return
    const el = track.current
    if (!el) return
    let raf = 0
    let x = 0
    let last = performance.now()
    const half = () => el.scrollWidth / 2

    const step = (now: number) => {
      const dt = Math.min(now - last, 60)
      last = now
      x -= dt * 0.022
      const w = half()
      if (w > 0 && -x >= w) x += w
      el.style.transform = `translate3d(${x}px,0,0)`
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  // Duplicated so the marquee wraps without a visible seam.
  const doubled = useMemo(() => [...rows, ...rows], [rows])

  return (
    <div className="ticker" role="region" aria-label="Illustrative instrument prices">
      <div className="ticker__track" ref={track}>
        {doubled.map((r, i) => (
          <div className="ticker__item" key={`${r.symbol}-${i}`}>
            <span className="ticker__sym">{r.symbol}</span>
            <span className="ticker__px">{r.price}</span>
            <span className="ticker__chg" data-dir={r.dir}>
              {r.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Smooth pseudo-random walk seeded per instrument, so the strip is stable
 *  across renders and identical in screenshots. */
function build(t: number): Row[] {
  return TICKER_INSTRUMENTS.map((ins, i) => {
    const wave =
      Math.sin(t * 0.11 + i * 1.7) * 0.6 + Math.sin(t * 0.043 + i * 0.9) * 0.4
    const pct = wave * 0.42
    const price = ins.seed * (1 + pct / 100)
    return {
      symbol: ins.symbol,
      price: price.toLocaleString('en-US', {
        minimumFractionDigits: ins.decimals,
        maximumFractionDigits: ins.decimals,
      }),
      change: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
      dir: pct >= 0 ? 'up' : 'down',
    }
  })
}
