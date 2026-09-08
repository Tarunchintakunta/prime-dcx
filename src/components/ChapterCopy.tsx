import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Chapter } from '../data/chapters'

gsap.registerPlugin(ScrollTrigger)

/** Belt and braces for headless renderers.
 *
 *  Reveals are driven by ScrollTrigger, so a crawler that renders the page but
 *  never scrolls would leave every below-the-fold section at opacity 0 and
 *  could treat that copy as hidden. After a short grace period, force
 *  everything visible. Real visitors have scrolled long before this fires. */
if (typeof window !== 'undefined') {
  window.setTimeout(() => document.documentElement.classList.add('reveal-all'), 2500)
}

interface Props {
  chapter: Chapter
  children?: ReactNode
  /** Rendered in the opposite column from the copy. */
  aside?: ReactNode
}

export function ChapterCopy({ chapter, children, aside }: Props) {
  const section = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = section.current
    if (!el) return
    const targets = el.querySelectorAll('[data-reveal]')
    if (!targets.length) return

    const ctx = gsap.context(() => {
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.075,
        scrollTrigger: {
          trigger: el,
          // Fires as the section enters — no pinning, so nothing ever sticks.
          start: 'top 82%',
          once: true,
        },
      })
    }, el)

    return () => ctx.revert()
  }, [])

  const copyClass =
    chapter.align === 'right'
      ? 'chapter__copy chapter__copy--right'
      : chapter.align === 'centre'
        ? 'chapter__copy chapter__copy--centre'
        : aside
          ? 'chapter__copy'
          : 'chapter__copy chapter__copy--wide'

  return (
    <section
      id={chapter.id}
      ref={section}
      className={`chapter${chapter.id === 'engine' ? ' chapter--hero' : ''}`}
      data-align={chapter.align}
      data-solid={chapter.solid ? 'true' : undefined}
      aria-labelledby={`${chapter.id}-title`}
    >
      <div className="chapter__grid">
        <div className={copyClass}>
          <p className="eyebrow" data-reveal>
            {chapter.eyebrow}
          </p>
          {chapter.id === 'engine' ? (
            <h1 id={`${chapter.id}-title`} data-reveal>
              {chapter.title}
            </h1>
          ) : (
            <h2 id={`${chapter.id}-title`} data-reveal>
              {chapter.title}
            </h2>
          )}
          {chapter.lede && (
            <p className="lede" data-reveal>
              {chapter.lede}
            </p>
          )}
          {chapter.points && (
            <ul
              data-reveal
              style={{
                margin: 0,
                padding: 0,
                listStyle: 'none',
                display: 'grid',
                gap: 10,
                borderTop: '1px solid var(--line)',
                paddingTop: 18,
              }}
            >
              {chapter.points.map((p) => (
                <li key={p} className="point">
                  {/* Drawn rule rather than a dash character, so the marker is
                      a design element and not punctuation. */}
                  <span className="point__rule" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
          )}
          {children}
        </div>

        {aside && (
          <div
            className={
              chapter.align === 'right' ? 'chapter__aside--left chapter__aside' : 'chapter__aside'
            }
            data-reveal
          >
            {aside}
          </div>
        )}
      </div>
    </section>
  )
}

/** A full-width block for sections whose content needs the whole grid. */
export function ChapterBlock({
  chapter,
  children,
}: {
  chapter: Chapter
  children: ReactNode
}) {
  const section = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = section.current
    if (!el) return
    const targets = el.querySelectorAll('[data-reveal]')
    if (!targets.length) return
    const ctx = gsap.context(() => {
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.07,
        scrollTrigger: { trigger: el, start: 'top 84%', once: true },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section
      id={chapter.id}
      ref={section}
      className="chapter"
      data-align={chapter.align}
      data-solid={chapter.solid ? 'true' : undefined}
      aria-labelledby={`${chapter.id}-title`}
    >
      <div className="chapter__grid">
        <div className="chapter__copy chapter__copy--wide">
          <p className="eyebrow" data-reveal>
            {chapter.eyebrow}
          </p>
          <h2 id={`${chapter.id}-title`} data-reveal>
            {chapter.title}
          </h2>
          {chapter.lede && (
            <p className="lede" data-reveal>
              {chapter.lede}
            </p>
          )}
        </div>
        <div style={{ gridColumn: '1 / -1', marginTop: 34 }} data-reveal>
          {children}
        </div>
      </div>
    </section>
  )
}
