import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { MODEL_BY_KEY } from '../data/assetManifest'
import { collectByPrefix, damp, mapRange } from '../utils/animation'
import type { SceneProps } from './types'

/** Chapter 02 — market pulse.
 *  The camera flies down the data tunnel while candles settle into place and
 *  order-flow particles stream past. */
export function MarketPulseScene({ progress, tier, reduced }: SceneProps) {
  const { scene } = useGLTF(MODEL_BY_KEY.tunnel)
  const model = useMemo(() => scene.clone(true), [scene])
  const root = useRef<THREE.Group>(null)

  const parts = useMemo(
    () => collectByPrefix(model, 'Candle_', 'Flow_', 'Rib_', 'VolWave_'),
    [model],
  )

  // glTF's Y-up conversion puts the tunnel's length on Z and a candle's
  // height on Y, so both differ from the Blender authoring axes.
  const candleScale = useMemo(() => parts.Candle_.map((o) => o.scale.y), [parts])

  /** Near mouth of the tunnel in three-space (Blender y=8). */
  const MOUTH_Z = -8

  const clock = useRef(0)

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05)
    if (!reduced) clock.current += d
    const t = clock.current
    const p = progress

    parts.Candle_.forEach((o, i) => {
      const order = i / Math.max(1, parts.Candle_.length)
      const grow = THREE.MathUtils.clamp((p * 1.5 - order * 0.7) / 0.25, 0, 1)
      o.scale.y = candleScale[i] * (0.05 + grow * 0.95)
    })

    parts.Flow_.forEach((o, i) => {
      // Particles run back down the tunnel and wrap to the far end.
      const speed = 2.6 + (i % 6) * 0.4
      const span = 30
      o.position.z = ((o.position.z + t * speed - MOUTH_Z) % span) + MOUTH_Z
      o.scale.setScalar(0.6 + Math.sin(t * 3 + i) * 0.25)
    })

    parts.VolWave_.forEach((o, i) => {
      o.position.y = 1.55 + Math.sin(t * 0.8 + i) * 0.12
    })

    if (root.current) root.current.rotation.y = Math.sin(t * 0.14) * 0.010

    // Approach: the camera closes on the tunnel mouth along its axis, so the
    // perspective deepens without the lens ever passing a wall.
    const cam = state.camera
    // Hold the camera outside the mouth on the tunnel's axis and close in.
    // The candle series occupies the centre line, so travelling *through* the
    // set would drive the lens straight into it.
    cam.position.x = damp(cam.position.x, Math.sin(t * 0.2) * 0.18, 2, d)
    cam.position.y = damp(cam.position.y, mapRange(p, 0, 1, 1.5, 0.9), 2, d)
    cam.position.z = damp(cam.position.z, mapRange(p, 0, 1, MOUTH_Z - 15, MOUTH_Z - 8), 2.4, d)
    cam.lookAt(0, 0.15, 1.5)
  })

  return (
    <group ref={root} scale={tier === 'mobile' ? 0.92 : 1}>
      <primitive object={model} />
      <fog attach="fog" args={['#05070a', 7, tier === 'mobile' ? 22 : 30]} />
    </group>
  )
}

useGLTF.preload(MODEL_BY_KEY.tunnel)
