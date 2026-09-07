import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { MODEL_BY_KEY } from '../data/assetManifest'
import { captureScales, collectByPrefix, damp, easeInOut, mapRange } from '../utils/animation'
import type { SceneProps } from './types'

/** Chapter 08 — funding and withdrawals.
 *  Value packets run both ways along the rails; the hub rings turn; the camera
 *  drops from a wide plan view toward the settlement hub. */
export function PaymentRailsScene({ progress, tier, reduced }: SceneProps) {
  const { scene } = useGLTF(MODEL_BY_KEY.rails)
  const model = useMemo(() => scene.clone(true), [scene])
  const root = useRef<THREE.Group>(null)

  const parts = useMemo(
    () => collectByPrefix(model, 'Packet_', 'HubRing_', 'PadRing_', 'Rail_', 'HubPylon_'),
    [model],
  )

  const packetHome = useMemo(
    () => parts.Packet_.map((o) => o.position.clone()),
    [parts],
  )

  const packetHomeScale = useMemo(() => captureScales(parts.Packet_), [parts])

  const clock = useRef(0)

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05)
    if (!reduced) clock.current += d
    const t = clock.current
    const p = easeInOut(progress)

    // Packets travel the rail; odd lanes run the other way, so deposits and
    // withdrawals read as two directions on the same network.
    parts.Packet_.forEach((o, i) => {
      const home = packetHome[i]
      const dir = i % 2 === 0 ? 1 : -1
      const speed = 2.2 + (i % 4) * 0.5
      const span = 16
      const x = (((home.x + dir * t * speed + span * 0.5) % span) + span) % span - span * 0.5
      o.position.x = x
      // Lanes converge toward the hub. After the Y-up conversion the lane
      // offset lives on Z and the lift on Y.
      const near = Math.max(0, 1 - Math.abs(x) / 4.2)
      o.position.z = home.z * (1 - near * 0.55)
      o.position.y = home.y + near * 0.24
      const k = 0.75 + p * 0.45
      o.scale.set(packetHomeScale[i].x * k, packetHomeScale[i].y * k, packetHomeScale[i].z * k)
    })

    // Rings lie flat on the deck, so they turn about Y.
    parts.HubRing_.forEach((o, i) => {
      o.rotation.y = t * (0.35 - i * 0.09) * (i % 2 ? -1 : 1)
    })

    parts.PadRing_.forEach((o, i) => {
      const s = 1 + Math.sin(t * 1.8 + i * 0.7) * 0.05
      o.scale.set(s, 1, s)
    })

    for (const o of parts.HubPylon_) o.rotation.y = t * 0.12

    if (root.current) root.current.rotation.y = damp(root.current.rotation.y, -0.14 + p * 0.28, 2.2, d)

    const cam = state.camera
    cam.position.x = damp(cam.position.x, mapRange(p, 0, 1, -5.2, 2.6), 2, d)
    cam.position.y = damp(cam.position.y, mapRange(p, 0, 1, 6.4, 2.2), 2, d)
    cam.position.z = damp(cam.position.z, mapRange(p, 0, 1, 9.8, 6.2), 2, d)
    cam.lookAt(0, 0.2, 0)
  })

  return (
    <group ref={root} scale={tier === 'mobile' ? 0.6 : 0.84} position={[0, -0.9, 0]}>
      <primitive object={model} />
      <pointLight position={[0, 1.4, 0]} color="#35c8e8" intensity={4} distance={9} />
    </group>
  )
}

useGLTF.preload(MODEL_BY_KEY.rails)
