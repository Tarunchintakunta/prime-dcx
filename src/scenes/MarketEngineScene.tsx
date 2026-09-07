import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { MODEL_BY_KEY } from '../data/assetManifest'
import { collectByPrefix, damp, easeInOut, makeSpinner, mapRange } from '../utils/animation'
import type { SceneProps } from './types'

/** Chapter 00 / 10 / 11 — the Prime Core.
 *  Rings spin on their own axes, the core breathes, and the camera pushes in
 *  then pulls back for the closing frames. */
export function MarketEngineScene({ progress, tier, reduced }: SceneProps) {
  const { scene } = useGLTF(MODEL_BY_KEY.engine)
  const root = useRef<THREE.Group>(null)
  const model = useMemo(() => scene.clone(true), [scene])

  const parts = useMemo(() => {
    // The base plate and column exist in the GLB for renders that need a
    // ground; on the site the engine reads better floating in the void.
    for (const name of ['BasePlate', 'BaseRing', 'Hub']) {
      for (const o of collectByPrefix(model, name)[name]) o.visible = false
    }
    // Bloom lifts the core well past the authored level, so pull the emissive
    // back to keep it reading as lit glass rather than a flat light source.
    model.traverse((child) => {
      const mesh = child as THREE.Mesh
      const mat = mesh.material as THREE.MeshStandardMaterial | undefined
      if (mat && 'emissiveIntensity' in mat && mat.name?.includes('CoreGlow')) {
        mesh.material = mat.clone()
        ;(mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.55
      }
    })
    return collectByPrefix(model, 'RingA', 'RingB', 'RingC', 'Core', 'Blade', 'Channel')
  }, [model])

  // Rings B and C are exported with their own tilt quaternions; spinning them
  // has to compose onto that, not overwrite it.
  const spinA = useMemo(() => makeSpinner(parts.RingA), [parts])
  const spinB = useMemo(() => makeSpinner(parts.RingB), [parts])
  const spinC = useMemo(() => makeSpinner(parts.RingC), [parts])

  const spin = useRef(0)

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05)
    if (!reduced) spin.current += d

    const t = spin.current
    const p = easeInOut(progress)

    // Each ring runs on its own axis and rate so the assembly never reads as
    // one rigid object rotating.
    spinA('z', t * 0.22)
    spinB('y', -t * 0.16)
    spinC('x', t * 0.13)

    for (const o of parts.Core) {
      const pulse = 1 + Math.sin(t * 0.9) * 0.012
      o.scale.setScalar(pulse)
    }

    if (root.current) {
      root.current.rotation.y = damp(root.current.rotation.y, -0.35 + p * 0.7, 3, d)
      root.current.position.y = damp(root.current.position.y, -0.15 + p * 0.2, 3, d)
    }

    // Push in through the first half, ease back out for the closing chapters.
    const dist = mapRange(p, 0, 1, 9.4, 7.2)
    const height = mapRange(p, 0, 1, 1.5, 2.6)
    const cam = state.camera
    cam.position.x = damp(cam.position.x, Math.sin(p * 0.5) * 1.6, 2.4, d)
    cam.position.y = damp(cam.position.y, height, 2.4, d)
    cam.position.z = damp(cam.position.z, dist, 2.4, d)
    cam.lookAt(0, 0.1, 0)
  })

  return (
    <group ref={root} scale={tier === 'mobile' ? 0.82 : 1}>
      <primitive object={model} />
      <pointLight position={[0, 0, 0]} color="#35c8e8" intensity={tier === 'mobile' ? 5 : 9} distance={7} />
    </group>
  )
}

useGLTF.preload(MODEL_BY_KEY.engine)
