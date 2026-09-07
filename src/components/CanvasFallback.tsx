import { Component, type ErrorInfo, type ReactNode } from 'react'
import { MEDIA_BY_KEY } from '../data/assetManifest'
import { useScrollStore } from '../hooks/useScrollProgress'
import { CHAPTERS } from '../data/chapters'

const SCENE_MEDIA: Record<string, string> = Object.fromEntries(
  CHAPTERS.map((c) => [c.scene, c.scene]),
)

/** Shown instead of the 3D layer when WebGL is unavailable or the renderer
 *  throws. Uses the Higgsfield still for whichever chapter is in view, so the
 *  page still tells the same story. */
export function StaticBackdrop() {
  const activeScene = useScrollStore((s) => s.activeScene)
  const key = SCENE_MEDIA[activeScene] ?? 'engine'
  const asset = MEDIA_BY_KEY[key] ?? MEDIA_BY_KEY.engine

  return (
    <div className="canvas-layer" aria-hidden="true">
      {asset?.poster && (
        <img
          src={asset.poster}
          alt=""
          decoding="async"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.55,
            transition: 'opacity 700ms ease',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(120% 80% at 50% 0%, rgba(11,16,23,0.5) 0%, rgba(5,7,10,0.86) 62%)',
        }}
      />
    </div>
  )
}

/** True when the browser can actually give us a WebGL context.
 *
 *  Chrome refuses one when hardware acceleration is off or the GPU is
 *  blocklisted. Without this check the renderer throws during render and, with
 *  no boundary, React unmounts the whole tree and the page goes black. */
export function hasWebGL(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    return !!gl
  } catch {
    return false
  }
}

interface BoundaryProps {
  children: ReactNode
  fallback: ReactNode
  label: string
  onError?: () => void
}

interface State {
  failed: boolean
}

/** Catches render errors so one failing layer degrades instead of taking the
 *  whole page down. Used twice: around post-processing (falls back to no
 *  post-processing) and around the canvas itself (falls back to stills). */
export class Boundary extends Component<BoundaryProps, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[Prime DCX] ${this.props.label} failed:`, error, info.componentStack)
    this.props.onError?.()
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export function CanvasBoundary({ children }: { children: ReactNode }) {
  return (
    <Boundary label="3D layer" fallback={<StaticBackdrop />}>
      {children}
    </Boundary>
  )
}
