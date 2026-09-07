import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { MODEL_BY_KEY } from '../data/assetManifest'
import { captureScales, collectByPrefix, damp, easeOut, mapRange } from '../utils/animation'
import type { SceneProps } from './types'

/** Chapter 09 — mobile trading.
 *  The device rotates into view and its interface populates row by row. */
export function MobileTradingScene({ progress, tier, reduced }: SceneProps) {
  const { scene } = useGLTF(MODEL_BY_KEY.mobile)
  const model = useMemo(() => scene.clone(true), [scene])
  const root = useRef<THREE.Group>(null)

  const parts = useMemo(
    () =>
      collectByPrefix(
        model,
        'PhoneCandle_',
        'PhoneDepth_',
        'PhoneTab_',
        'PhoneNav_',
        'PhoneBuy',
        'PhoneSell',
        'PhoneTrendLine',
      ),
    [model],
  )

  const home = useMemo(
    () => ({
      candle: captureScales(parts.PhoneCandle_),
      depth: captureScales(parts.PhoneDepth_),
      tab: captureScales(parts.PhoneTab_),
      nav: captureScales(parts.PhoneNav_),
      buy: captureScales(parts.PhoneBuy),
      sell: captureScales(parts.PhoneSell),
    }),
    [parts],
  )

  const clock = useRef(0)

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05)
    if (!reduced) clock.current += d
    const t = clock.current
    const p = progress
    const wake = easeOut(THREE.MathUtils.clamp(p / 0.35, 0, 1))

    parts.PhoneCandle_.forEach((o, i) => {
      const order = i / Math.max(1, parts.PhoneCandle_.length)
      const on = THREE.MathUtils.clamp((wake * 1.5 - order * 0.6) / 0.25, 0, 1)
      // Screen-vertical is Y in the exported model, not Blender's Z.
      o.scale.y = home.candle[i].y * on
      o.visible = on > 0.02
    })

    parts.PhoneDepth_.forEach((o, i) => {
      const on = THREE.MathUtils.clamp((wake * 1.6 - i * 0.07) / 0.25, 0, 1)
      o.scale.x = home.depth[i].x * on * (0.7 + Math.abs(Math.sin(t * 1.1 + i)) * 0.3)
    })

    parts.PhoneTab_.forEach((o, i) => (o.scale.x = home.tab[i].x * wake))
    parts.PhoneNav_.forEach((o, i) => (o.scale.x = home.nav[i].x * wake))

    const press = 1 + Math.sin(t * 1.5) * 0.02
    parts.PhoneBuy.forEach((o, i) => (o.scale.z = home.buy[i].z * wake * press))
    parts.PhoneSell.forEach((o, i) => (o.scale.z = home.sell[i].z * wake * press))

    if (root.current) {
      // Turn the device toward the reader as the chapter lands.
      root.current.rotation.y = damp(root.current.rotation.y, mapRange(p, 0, 1, 0.55, -0.18), 2.2, d)
      root.current.rotation.x = damp(root.current.rotation.x, mapRange(p, 0, 1, 0.12, -0.02), 2.2, d)
      root.current.position.y = damp(root.current.position.y, Math.sin(t * 0.6) * 0.03, 2.2, d)
    }

    const cam = state.camera
    cam.position.x = damp(cam.position.x, mapRange(p, 0, 1, 1.15, -0.25), 2, d)
    cam.position.y = damp(cam.position.y, mapRange(p, 0, 1, 0.50, 0.10), 2, d)
    cam.position.z = damp(cam.position.z, mapRange(p, 0, 1, 4.8, 3.7), 2, d)
    cam.lookAt(0, 0, 0)
  })

  return (
    <group ref={root} scale={tier === 'mobile' ? 1.12 : 1.35}>
      <primitive object={model} />
      <pointLight position={[0, 0, 1.2]} color="#2aa8c4" intensity={2.4} distance={4} />
    </group>
  )
}

useGLTF.preload(MODEL_BY_KEY.mobile)
