import { useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'

const TIMEFRAMES = ['1M', '5M', '15M', '1H', '4H', '1D'] as const

interface Candle {
  o: number
  h: number
  l: number
  c: number
}

/** Interface preview of the Prime DCX terminal.
 *
 *  Chart, order book and order pad are drawn from a deterministic simulation.
 *  Nothing here is a live quote and the panel is labelled as a preview. */
export function TradingTerminal() {
  const reduced = useReducedMotion()
  const [tf, setTf] = useState<(typeof TIMEFRAMES)[number]>('15M')
  const canvas = useRef<HTMLCanvasElement>(null)
  const wrap = useRef<HTMLDivElement>(null)

  const candles = useMemo(() => series(tf), [tf])
  const last = candles[candles.length - 1]
  const first = candles[0]
  const pct = ((last.c - first.c) / first.c) * 100

  const book = useMemo(() => orderBook(last.c), [last.c])

  useEffect(() => {
    const cv = canvas.current
    const host = wrap.current
    if (!cv || !host) return

    let raf = 0
    let phase = 0

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = host.clientWidth
      const h = host.clientHeight
      if (cv.width !== w * dpr || cv.height !== h * dpr) {
        cv.width = w * dpr
        cv.height = h * dpr
      }
      const ctx = cv.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const padL = 12
      const padR = 62
      const padY = 18
      const plotW = w - padL - padR
      const plotH = h - padY * 2

      let lo = Infinity
      let hi = -Infinity
      for (const c of candles) {
        lo = Math.min(lo, c.l)
        hi = Math.max(hi, c.h)
      }
      const pad = (hi - lo) * 0.12
      lo -= pad
      hi += pad
      const y = (v: number) => padY + plotH - ((v - lo) / (hi - lo)) * plotH

      // grid
      ctx.strokeStyle = 'rgba(226,236,248,0.055)'
      ctx.lineWidth = 1
      ctx.font = '9.5px ui-monospace, monospace'
      ctx.fillStyle = 'rgba(111,122,137,0.9)'
      for (let i = 0; i <= 4; i += 1) {
        const gy = Math.round(padY + (plotH / 4) * i) + 0.5
        ctx.beginPath()
        ctx.moveTo(padL, gy)
        ctx.lineTo(w - padR, gy)
        ctx.stroke()
        const val = hi - ((hi - lo) / 4) * i
        ctx.fillText(val.toFixed(4), w - padR + 8, gy + 3)
      }

      // candles
      const step = plotW / candles.length
      const bw = Math.max(1.5, step * 0.56)
      candles.forEach((c, i) => {
        const cx = padL + step * (i + 0.5)
        const up = c.c >= c.o
        ctx.strokeStyle = up ? 'rgba(53,207,142,0.85)' : 'rgba(224,86,92,0.85)'
        ctx.fillStyle = up ? 'rgba(53,207,142,0.85)' : 'rgba(224,86,92,0.85)'
        ctx.beginPath()
        ctx.moveTo(Math.round(cx) + 0.5, y(c.h))
        ctx.lineTo(Math.round(cx) + 0.5, y(c.l))
        ctx.stroke()
        const top = y(Math.max(c.o, c.c))
        const bh = Math.max(1, Math.abs(y(c.o) - y(c.c)))
        ctx.fillRect(cx - bw / 2, top, bw, bh)
      })

      // moving average
      ctx.strokeStyle = 'rgba(53,200,232,0.9)'
      ctx.lineWidth = 1.25
      ctx.beginPath()
      const period = 9
      candles.forEach((_, i) => {
        if (i < period) return
        let sum = 0
        for (let k = i - period; k < i; k += 1) sum += candles[k].c
        const avg = sum / period
        const cx = padL + step * (i + 0.5)
        if (i === period) ctx.moveTo(cx, y(avg))
        else ctx.lineTo(cx, y(avg))
      })
      ctx.stroke()

      // last-price marker, with a slow pulse when motion is allowed
      const ly = y(last.c)
      const alpha = reduced ? 0.5 : 0.32 + Math.sin(phase) * 0.18
      ctx.strokeStyle = `rgba(53,200,232,${alpha})`
      ctx.setLineDash([3, 4])
      ctx.beginPath()
      ctx.moveTo(padL, ly)
      ctx.lineTo(w - padR, ly)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(53,200,232,0.92)'
      ctx.fillRect(w - padR + 2, ly - 8, padR - 6, 16)
      ctx.fillStyle = '#041016'
      ctx.fillText(last.c.toFixed(4), w - padR + 7, ly + 3)

      if (!reduced) {
        phase += 0.04
        raf = requestAnimationFrame(draw)
      }
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(host)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [candles, last.c, reduced])

  return (
    <div className="panel">
      <div className="panel__head">
        <span className="panel__title">Terminal / interface preview</span>
        <span className="tag tag--mute">Simulated data</span>
      </div>

      <div className="terminal">
        <div className="terminal__main">
          <div className="terminal__bar">
            <span className="terminal__sym">EUR/USD</span>
            <span className="terminal__px">{last.c.toFixed(4)}</span>
            <span className="terminal__chg" data-dir={pct >= 0 ? 'up' : 'down'}>
              {pct >= 0 ? '+' : ''}
              {pct.toFixed(2)}%
            </span>
            <div className="terminal__tabs" role="group" aria-label="Timeframe">
              {TIMEFRAMES.map((f) => (
                <button
                  key={f}
                  type="button"
                  className="terminal__tab"
                  aria-pressed={tf === f}
                  onClick={() => setTf(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="terminal__chart" ref={wrap}>
            <canvas ref={canvas} aria-label="Simulated price chart" role="img" />
          </div>
        </div>

        <div className="terminal__side">
          <div className="terminal__book">
            <div className="panel__title" style={{ marginBottom: 8 }}>
              Order book
            </div>
            {book.asks.map((r) => (
              <div className="book__row" data-side="ask" key={`a${r.px}`}>
                <span className="book__px">{r.px.toFixed(4)}</span>
                <span className="book__sz">{r.size}</span>
                <span className="book__depth" style={{ width: `${r.depth}%` }} />
              </div>
            ))}
            <div className="book__spread">
              <span>Spread</span>
              <span>{book.spread}</span>
            </div>
            {book.bids.map((r) => (
              <div className="book__row" data-side="bid" key={`b${r.px}`}>
                <span className="book__px">{r.px.toFixed(4)}</span>
                <span className="book__sz">{r.size}</span>
                <span className="book__depth" style={{ width: `${r.depth}%` }} />
              </div>
            ))}
          </div>

          <div className="terminal__pad">
            <div className="panel__title">Order pad</div>
            <div className="pad__field">
              <span>Type</span>
              <span>Limit</span>
            </div>
            <div className="pad__field">
              <span>Size</span>
              <span>Not set</span>
            </div>
            <div className="pad__field">
              <span>Stop loss</span>
              <span>Attach</span>
            </div>
            <div className="pad__row">
              <span className="pad__btn pad__btn--buy">Buy</span>
              <span className="pad__btn pad__btn--sell">Sell</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--line)' }}>
        <p className="note" style={{ margin: 0 }}>
          Interface preview only. Prices, depth and spread shown here are simulated for
          demonstration and are not live market data. Available instruments, order types and
          account terms are confirmed at account opening.
        </p>
      </div>
    </div>
  )
}

/** Deterministic OHLC series — same input, same chart, every render. */
function series(tf: string): Candle[] {
  const seedBase = tf.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  let price = 1.0842
  const out: Candle[] = []
  for (let i = 0; i < 64; i += 1) {
    const n =
      Math.sin(i * 0.37 + seedBase) * 0.5 +
      Math.sin(i * 0.11 + seedBase * 0.3) * 0.35 +
      Math.sin(i * 0.79 + seedBase * 0.7) * 0.15
    const o = price
    const c = o + n * 0.0011
    const h = Math.max(o, c) + Math.abs(n) * 0.0006
    const l = Math.min(o, c) - Math.abs(n) * 0.0006
    out.push({ o, h, l, c })
    price = c
  }
  return out
}

function orderBook(mid: number) {
  const asks = Array.from({ length: 6 }, (_, i) => ({
    px: mid + 0.0002 * (6 - i),
    size: (0.4 + ((i * 37) % 9) * 0.3).toFixed(1) + 'M',
    depth: 22 + ((i * 29) % 60),
  }))
  const bids = Array.from({ length: 6 }, (_, i) => ({
    px: mid - 0.0002 * (i + 1),
    size: (0.4 + ((i * 53) % 9) * 0.3).toFixed(1) + 'M',
    depth: 26 + ((i * 41) % 58),
  }))
  return { asks, bids, spread: '0.0002' }
}
