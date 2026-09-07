import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { MODEL_BY_KEY } from '../data/assetManifest'
import { captureScales, collectByPrefix, damp, easeOut, mapRange, window01 } from '../utils/animation'
import type { SceneProps } from './types'

/** Chapters 03–06 — the cockpit.
 *  One long move covering the terminal reveal, the multi-asset switch,
 *  execution (order particles firing into the book) and risk controls. */
export function TradingTerminalScene({ progress, tier, reduced }: SceneProps) {
  const { scene } = useGLTF(MODEL_BY_KEY.terminal)
  const model = useMemo(() => scene.clone(true), [scene])
  const root = useRef<THREE.Group>(null)

  const parts = useMemo(
    () =>
      collectByPrefix(
        model,
        'MainCandle_',
        'WatchRow_',
        'DepthRow_',
        'OrderBtn_',
        'MA_Line',
        'DeskLip',
      ),
    [model],
  )

  // Authored sizes, so the animation scales them rather than replacing them.
  const home = useMemo(
    () => ({
      candle: captureScales(parts.MainCandle_),
      watch: captureScales(parts.WatchRow_),
      depth: captureScales(parts.DepthRow_),
    }),
    [parts],
  )

  const orderCount = tier === 'mobile' ? 8 : tier === 'tablet' ? 14 : 22
  const orders = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const clock = useRef(0)

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05)
    if (!reduced) clock.current += d
    const t = clock.current
    const p = progress

    // Screens wake in the first quarter of the run.
    const wake = easeOut(THREE.MathUtils.clamp(p / 0.22, 0, 1))

    parts.MainCandle_.forEach((o, i) => {
      const order = i / Math.max(1, parts.MainCandle_.length)
      const on = THREE.MathUtils.clamp((wake * 1.4 - order * 0.5) / 0.3, 0, 1)
      o.visible = on > 0.02
      // Blender's vertical (Y) becomes Z once the model is exported Y-up.
      o.scale.z = home.candle[i].z * on * (0.9 + Math.sin(t * 1.4 + i) * 0.06)
    })

    parts.WatchRow_.forEach((o, i) => {
      const on = THREE.MathUtils.clamp((wake * 1.5 - i * 0.06) / 0.3, 0, 1)
      o.scale.x = home.watch[i].x * on
    })

    // The depth ladder breathes continuously, standing in for a live book.
    parts.DepthRow_.forEach((o, i) => {
      const base = 0.35 + Math.abs(Math.sin(i * 0.8 + t * 0.9)) * 0.65
      o.scale.x = home.depth[i].x * wake * base
    })

    // Execution beat: order particles fire from the pad toward the book.
    const exec = window01(p, 0.62, 0.30)
    const mesh = orders.current
    if (mesh) {
      for (let i = 0; i < orderCount; i += 1) {
        const u = ((i / orderCount) + t * 0.34) % 1
        dummy.position.set(
          THREE.MathUtils.lerp(1.75, 2.42, u),
          THREE.MathUtils.lerp(0.06, -0.55, u * 0.4),
          THREE.MathUtils.lerp(0.2, 1.2, u),
        )
        const fade = Math.sin(u * Math.PI) * exec
        dummy.scale.setScalar(0.026 * fade)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
      mesh.visible = exec > 0.01
    }

    for (const o of parts.DeskLip) {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial
      if (m) m.emissiveIntensity = 0.6 + wake * 1.4
    }

    if (root.current) root.current.position.y = damp(root.current.position.y, -0.75, 3, d)

    // Slow dolly: wide reveal, then in toward the main screen, then a drift
    // right for the risk chapter.
    const cam = state.camera
    const x = mapRange(p, 0, 1, -1.3, 1.5)
    const y = mapRange(p, 0, 1, 1.45, 1.05)
    const z = mapRange(p, 0, 1, 6.4, 4.6)
    cam.position.x = damp(cam.position.x, x, 2, d)
    cam.position.y = damp(cam.position.y, y, 2, d)
    cam.position.z = damp(cam.position.z, z, 2, d)
    cam.lookAt(mapRange(p, 0, 1, 0, 0.9), 0.55, 0)
  })

  return (
    <group ref={root} scale={tier === 'mobile' ? 0.78 : 1}>
      <primitive object={model} />
      <instancedMesh ref={orders} args={[undefined, undefined, orderCount]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#7ce4ff" toneMapped={false} />
      </instancedMesh>
      <pointLight position={[0, 1.3, 0.6]} color="#2aa8c4" intensity={3.5} distance={6} />
    </group>
  )
}

useGLTF.preload(MODEL_BY_KEY.terminal)
