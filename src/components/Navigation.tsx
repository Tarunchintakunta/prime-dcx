import { useEffect, useRef, useState } from 'react'
import { NAV_CHAPTERS } from '../data/chapters'
import { useScrollStore } from '../hooks/useScrollProgress'

interface Props {
  onJump: (id: string) => void
}

export function Navigation({ onJump }: Props) {
  const activeId = useScrollStore((s) => s.activeId)
  const [solid, setSolid] = useState(false)
  const bar = useRef<HTMLSpanElement>(null)

  useEffect(() =>
    useScrollStore.subscribe((s) => {
      setSolid(s.scrollY > 40)
      if (bar.current) bar.current.style.transform = `scaleX(${s.progress})`
    }),
  [])

  return (
    <header className="nav" data-solid={solid}>
      <div className="nav__inner">
        <a
          className="nav__mark"
          href="#engine"
          onClick={(e) => {
            e.preventDefault()
            onJump('engine')
          }}
        >
          <b>PRIME DCX</b>
          <span>Market Engine</span>
        </a>

        <nav className="nav__links" aria-label="Sections">
          {NAV_CHAPTERS.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              data-current={activeId === c.id}
              onClick={(e) => {
                e.preventDefault()
                onJump(c.id)
              }}
            >
              {c.nav}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className="btn btn--sm btn--primary"
          onClick={() => onJump('start')}
        >
          Open account
        </button>
      </div>
      <span
        ref={bar}
        className="nav__progress"
        style={{ width: '100%', transform: 'scaleX(0)' }}
      />
    </header>
  )
}
