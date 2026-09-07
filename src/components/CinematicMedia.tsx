import { useEffect, useRef, useState } from 'react'
import { MEDIA_BY_KEY } from '../data/assetManifest'
import { useReducedMotion } from '../hooks/useReducedMotion'

interface Props {
  mediaKey: string
  caption: string
}

/** A framed cinematic frame or clip used as chapter support.
 *
 *  The clip only starts once it is on screen, is muted and loops, and is
 *  replaced by its still when the visitor prefers reduced motion or when the
 *  clip is not present in the build. */
export function CinematicMedia({ mediaKey, caption }: Props) {
  const asset = MEDIA_BY_KEY[mediaKey]
  const reduced = useReducedMotion()
  const host = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const [canPlay, setCanPlay] = useState(false)

  useEffect(() => {
    if (reduced || !asset?.clip) return
    const el = host.current
    const v = video.current
    if (!el || !v) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void v.play().catch(() => undefined)
        else if (!v.paused) v.pause()
      },
      { rootMargin: '120px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced, asset])

  if (!asset) return null

  const showVideo = !reduced && !!asset.clip

  return (
    <figure className="panel" style={{ margin: 0, overflow: 'hidden' }} ref={host}>
      <div style={{ position: 'relative', aspectRatio: '16 / 9', background: '#05070a' }}>
        {showVideo && (
          <video
            ref={video}
            muted
            loop
            playsInline
            preload="none"
            poster={asset.poster}
            onCanPlay={() => setCanPlay(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: canPlay ? 1 : 0,
              transition: 'opacity 600ms ease',
            }}
          >
            <source src={asset.clip} type="video/mp4" />
          </video>
        )}
        {(!showVideo || !canPlay) && asset.poster && (
          <img
            src={asset.poster}
            alt={asset.label}
            loading="lazy"
            decoding="async"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>
      <figcaption
        style={{
          padding: '11px 14px',
          borderTop: '1px solid var(--line)',
          fontSize: 11.5,
          color: 'var(--text-3)',
          fontFamily: 'var(--mono)',
          letterSpacing: '0.05em',
        }}
      >
        {caption}
      </figcaption>
    </figure>
  )
}
