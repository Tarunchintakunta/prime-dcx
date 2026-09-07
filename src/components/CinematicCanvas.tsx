import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AdaptiveDpr, Environment, Lightformer, Preload } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useScrollStore } from '../hooks/useScrollProgress'
import { CHAPTERS } from '../data/chapters'
import { useReducedMotion, useTier } from '../hooks/useReducedMotion'
import { damp } from '../utils/animation'
import type { Align, SceneKey } from '../data/chapters'
import { MarketEngineScene } from '../scenes/MarketEngineScene'
import { GlobalLiquidityScene } from '../scenes/GlobalLiquidityScene'
import { MarketPulseScene } from '../scenes/MarketPulseScene'
import { TradingTerminalScene } from '../scenes/TradingTerminalScene'
import { SecurityVaultScene } from '../scenes/SecurityVaultScene'
import { PaymentRailsScene } from '../scenes/PaymentRailsScene'
import { MobileTradingScene } from '../scenes/MobileTradingScene'
import type { SceneProps } from '../scenes/types'
import { Boundary, StaticBackdrop, hasWebGL } from './CanvasFallback'

const ALIGN_BY_ID: Record<string, Align> = Object.fromEntries(
  CHAPTERS.map((c) => [c.id, c.align]),
)

/** How far the subject slides away from the copy column, per quality tier.
 *  Mobile keeps it centred because the copy sits over the whole frame there. */
const OFFSET: Record<string, number> = { desktop: 1.9, tablet: 0.9, mobile: 0 }

/** Per-scene share of that offset. The phone is small and shot close, so the
 *  full desktop offset would push it out of frame; the tunnel is an interior
 *  set whose camera must stay on its axis, so it takes none. */
const OFFSET_SCALE: Record<SceneKey, number> = {
  engine: 1,
  globe: 1,
  tunnel: 0,
  terminal: 0.85,
  vault: 0.95,
  rails: 1.05,
  mobile: 0.3,
}

const SCENES: Record<SceneKey, (p: SceneProps) => JSX.Element> = {
  engine: MarketEngineScene,
  globe: GlobalLiquidityScene,
  tunnel: MarketPulseScene,
  terminal: TradingTerminalScene,
  vault: SecurityVaultScene,
  rails: PaymentRailsScene,
  mobile: MobileTradingScene,
}

/** Renders the active scene only. Scene groups swap while the dissolve holds
 *  the frame down, so there is never a hard cut and never two cameras fighting. */
function ActiveScene() {
  const activeScene = useScrollStore((s) => s.activeScene)
  const activeId = useScrollStore((s) => s.activeId)
  const sceneProgress = useScrollStore((s) => s.sceneProgress)
  const sceneAlpha = useScrollStore((s) => s.sceneAlpha)
  const tier = useTier()
  const reduced = useReducedMotion()
  const holder = useRef<THREE.Group>(null)

  const Scene = SCENES[activeScene] ?? MarketEngineScene
  const align = ALIGN_BY_ID[activeId] ?? 'left'

  useFrame((_, dt) => {
    const g = holder.current
    if (!g) return
    const d = Math.min(dt, 0.05)

    // A touch of scale on the dissolve gives the transition depth.
    const target = 0.955 + sceneAlpha * 0.045
    g.scale.setScalar(damp(g.scale.x, target, 6, d))

    // Copy on the left puts the subject on the right, and vice versa, so text
    // and geometry never compete for the same part of the frame.
    const k = (OFFSET[tier] ?? 0) * (OFFSET_SCALE[activeScene] ?? 1)
    const x = align === 'left' ? k : align === 'right' ? -k : 0
    g.position.x = damp(g.position.x, x, 2.4, d)
  })

  return (
    <group ref={holder}>
      <Scene progress={sceneProgress} tier={tier} reduced={reduced} align={align} />
    </group>
  )
}

/** Keeps the renderer idle when the page is scrolled past the canvas or the
 *  tab is hidden — this is a fixed background, not a game loop. */
function FrameGovernor() {
  const { invalidate } = useThree()
  useFrame(() => invalidate())
  return null
}

/** Studio environment built from light shapes in the scene itself.
 *
 *  drei's `preset` environments download an HDRI from an external CDN, which
 *  makes first paint depend on a third-party network request and takes the
 *  whole canvas down when that request is blocked or fails. These lightformers
 *  give the metals something to reflect with no network at all, and `frames={1}`
 *  bakes the probe once instead of every frame. */
function StudioEnvironment() {
  return (
    <Environment resolution={128} frames={1} background={false} environmentIntensity={0.34}>
      <Lightformer intensity={2.2} color="#dce8f5" position={[0, 5, -9]} scale={[14, 8, 1]} />
      <Lightformer
        intensity={1.5}
        color="#35c8e8"
        position={[-9, 2, 2]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[11, 6, 1]}
      />
      <Lightformer
        intensity={0.9}
        color="#8b95a5"
        position={[9, 3, 1]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[11, 6, 1]}
      />
      <Lightformer
        intensity={0.4}
        color="#0d1117"
        position={[0, -7, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[22, 22, 1]}
      />
    </Environment>
  )
}

export function CinematicCanvas() {
  const tier = useTier()
  const reduced = useReducedMotion()
  const sceneAlpha = useScrollStore((s) => s.sceneAlpha)
  const [webgl] = useState(hasWebGL)

  const dpr = useMemo<[number, number]>(
    () => (tier === 'mobile' ? [1, 1.5] : tier === 'tablet' ? [1, 1.75] : [1, 2]),
    [tier],
  )

  const usePost = tier === 'desktop' && !reduced

  // No WebGL context means no 3D layer. Render the stills rather than letting
  // the renderer throw. Placed after the hooks so the hook order never varies.
  if (!webgl) return <StaticBackdrop />

  return (
    <div className="canvas-layer" aria-hidden="true">
      <Canvas
        dpr={dpr}
        gl={{
          antialias: tier !== 'mobile',
          powerPreference: 'high-performance',
          alpha: true,
          stencil: false,
          depth: true,
        }}
        camera={{ fov: tier === 'mobile' ? 42 : 34, near: 0.1, far: 120, position: [0, 1.5, 9.4] }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.06
        }}
      >
        <color attach="background" args={['#05070a']} />
        <ambientLight intensity={0.16} />
        <directionalLight position={[5, 6, 4]} intensity={1.5} color="#dce8f5" />
        <directionalLight position={[-6, 2, -3]} intensity={0.85} color="#35c8e8" />

        <Suspense fallback={null}>
          <StudioEnvironment />
          <ActiveScene />
          <Preload all />
        </Suspense>

        {/* Post-processing is the most driver-sensitive part of the pipeline,
            so it degrades on its own: if it throws, the scene keeps rendering
            without bloom rather than dropping to stills. */}
        {usePost && (
          <Boundary label="post-processing" fallback={null}>
            <EffectComposer enableNormalPass={false}>
              <Bloom
                intensity={0.62}
                luminanceThreshold={0.62}
                luminanceSmoothing={0.24}
                mipmapBlur
              />
              <Vignette offset={0.22} darkness={0.72} />
            </EffectComposer>
          </Boundary>
        )}

        <AdaptiveDpr pixelated={false} />
        <FrameGovernor />
      </Canvas>

      {/* Dissolve scrim, never fully opaque so the page keeps its depth. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#05070a',
          opacity: (1 - sceneAlpha) * 0.88,
          transition: 'opacity 90ms linear',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
