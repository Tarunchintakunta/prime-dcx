import { useCallback, useEffect, useRef } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { CHAPTERS } from './data/chapters'
import { MARKET_GROUPS } from './data/markets'
import { useChapterSpans, useScrollStore } from './hooks/useScrollProgress'
import { useReducedMotion } from './hooks/useReducedMotion'

import { Navigation } from './components/Navigation'
import { CinematicCanvas } from './components/CinematicCanvas'
import { CanvasBoundary } from './components/CanvasFallback'
import { ChapterBlock, ChapterCopy } from './components/ChapterCopy'
import { MarketTicker } from './components/MarketTicker'
import { TradingTerminal } from './components/TradingTerminal'
import { PaymentMethods } from './components/PaymentMethods'
import { RiskDisclosure } from './components/RiskDisclosure'
import { CTA } from './components/CTA'
import { CinematicMedia } from './components/CinematicMedia'

gsap.registerPlugin(ScrollTrigger)

const byId = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]))

export default function App() {
  const reduced = useReducedMotion()
  const lenis = useRef<Lenis | null>(null)
  useChapterSpans()

  useEffect(() => {
    const update = useScrollStore.getState().update
    const push = (y: number) =>
      update(y, window.innerHeight, document.documentElement.scrollHeight)

    // Reduced motion gets native scrolling — smoothing is itself motion.
    if (reduced) {
      const onScroll = () => push(window.scrollY)
      onScroll()
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onScroll)
      return () => {
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onScroll)
      }
    }

    const instance = new Lenis({
      duration: 1.05,
      // Long, gentle tail: momentum without the rubbery feel of a heavier ease.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.7,
      syncTouch: false,
    })
    lenis.current = instance

    instance.on('scroll', (e: { scroll: number }) => {
      push(e.scroll)
      ScrollTrigger.update()
    })

    // Lenis runs on its own rAF loop. GSAP's ticker parks itself once no
    // tweens are active, which starved Lenis after a few frames and left
    // scrolling on the native fallback.
    let frame = requestAnimationFrame(function tick(time: number) {
      instance.raf(time)
      frame = requestAnimationFrame(tick)
    })
    gsap.ticker.lagSmoothing(0)

    // No scrollerProxy: Lenis drives real window scroll, so ScrollTrigger's
    // default scroller is already correct. Registering a proxy made
    // ScrollTrigger reset the position on every refresh.
    push(window.scrollY)
    const onResize = () => {
      instance.resize()
      push(instance.scroll)
      ScrollTrigger.refresh()
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(frame)
      instance.destroy()
      lenis.current = null
    }
  }, [reduced])

  const jump = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    if (lenis.current) lenis.current.scrollTo(el, { offset: -72, duration: 1.4 })
    else el.scrollIntoView({ behavior: 'auto', block: 'start' })
  }, [])

  return (
    <>
      <a
        href="#engine"
        className="btn btn--sm"
        style={{ position: 'fixed', top: 10, left: 10, zIndex: 100, transform: 'translateY(-160%)' }}
        onFocus={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        onBlur={(e) => (e.currentTarget.style.transform = 'translateY(-160%)')}
      >
        Skip to content
      </a>

      <CanvasBoundary>
        <CinematicCanvas />
      </CanvasBoundary>
      <Navigation onJump={jump} />

      <main className="content">
        <ChapterCopy chapter={byId.engine}>
          <div className="cta__actions" data-reveal style={{ marginTop: 6 }}>
            <button type="button" className="btn btn--primary" onClick={() => jump('start')}>
              Open an account
            </button>
            <button type="button" className="btn" onClick={() => jump('terminal')}>
              See the terminal
            </button>
          </div>
          <p className="note" data-reveal style={{ marginTop: 4, maxWidth: '48ch' }}>
            Trading involves risk. Losses can exceed deposits depending on the product and
            leverage used.
          </p>
        </ChapterCopy>

        <MarketTicker />

        <ChapterCopy chapter={byId.access} />

        <ChapterCopy
          chapter={byId.pulse}
          aside={<CinematicMedia mediaKey="tunnel" caption="Market data tunnel / order flow and book depth" />}
        />

        <ChapterBlock chapter={byId.terminal}>
          <TradingTerminal />
        </ChapterBlock>

        <ChapterBlock chapter={byId.markets}>
          <div className="markets">
            {MARKET_GROUPS.map((g) => (
              <div className="market" key={g.id}>
                <span className="market__name">{g.name}</span>
                <p className="note" style={{ margin: 0 }}>
                  {g.blurb}
                </p>
                <ul className="market__list">
                  {g.examples.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="note" style={{ marginTop: 16, maxWidth: '80ch' }}>
            Instrument names are shown as examples of the asset classes covered. The instruments
            actually available to you, along with trading hours and account terms, depend on your
            region and account type and are confirmed at account opening.
          </p>
        </ChapterBlock>

        <ChapterCopy chapter={byId.execution} />

        <ChapterCopy
          chapter={byId.risk}
          aside={
            <div className="panel" style={{ padding: 20 }}>
              <span className="panel__title">Risk state / interface preview</span>
              <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                <Meter label="Margin level" value={0.72} tone="var(--green)" />
                <Meter label="Used margin" value={0.34} tone="var(--cyan)" />
                <Meter label="Instrument exposure" value={0.55} tone="var(--amber)" />
              </div>
              <p className="note" style={{ marginTop: 16 }}>
                Illustrative panel. Actual margin requirements and exposure limits are set on your
                account.
              </p>
            </div>
          }
        />

        <ChapterCopy
          chapter={byId.security}
          aside={<CinematicMedia mediaKey="vault" caption="Account protection / encryption and withdrawal verification" />}
        />

        <ChapterBlock chapter={byId.funding}>
          <PaymentMethods />
        </ChapterBlock>

        <ChapterCopy
          chapter={byId.mobile}
          aside={<CinematicMedia mediaKey="mobile" caption="Mobile terminal / positions, charting and order entry" />}
        />

        <section id="disclosure" className="chapter" data-align="centre" data-solid="true">
          <div className="chapter__grid">
            <div style={{ gridColumn: '2 / span 10' }}>
              <RiskDisclosure />
            </div>
          </div>
        </section>

        <ChapterCopy chapter={byId.start}>
          <div data-reveal>
            <CTA onJump={jump} />
          </div>
        </ChapterCopy>
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="nav__mark">
              <b>PRIME DCX</b>
              <span>Market Engine</span>
            </span>
            <small>
              Prime DCX provides trading tools and market access. It does not provide investment,
              tax or legal advice, and nothing on this site is a recommendation to trade.
            </small>
          </div>
          <small style={{ maxWidth: '46ch' }}>
            Trading involves risk. Losses can exceed deposits depending on the product and leverage
            used. Product availability, account terms and funding methods depend on your region and
            are confirmed at account opening. Market interfaces shown on this site use simulated
            data.
          </small>
        </div>
      </footer>
    </>
  )
}

function Meter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: 'var(--text-3)',
          marginBottom: 6,
        }}
      >
        <span>{label}</span>
        <span style={{ color: tone }}>{Math.round(value * 100)}%</span>
      </div>
      <div style={{ height: 3, background: 'rgba(226,236,248,0.08)', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${value * 100}%`, background: tone, borderRadius: 2 }} />
      </div>
    </div>
  )
}
