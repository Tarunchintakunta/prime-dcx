import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { MODEL_BY_KEY } from '../data/assetManifest'
import { captureScales, collectByPrefix, damp, easeInOut, mapRange } from '../utils/animation'
import type { SceneProps } from './types'

const MARKETS = ['NewYork', 'London', 'Dubai', 'Mumbai', 'Singapore', 'Tokyo']

/** Chapter 01 — global liquidity.
 *  The globe turns slowly; route arcs light up in sequence as the chapter
 *  advances, and packets run along them. */
export function GlobalLiquidityScene({ progress, tier, reduced }: SceneProps) {
  const { scene } = useGLTF(MODEL_BY_KEY.globe)
  const model = useMemo(() => scene.clone(true), [scene])
  const root = useRef<THREE.Group>(null)
  const globe = useRef<THREE.Group>(null)

  const parts = useMemo(
    () => collectByPrefix(model, 'Route_', 'Node_', 'NodePin_', 'OrbitRing'),
    [model],
  )

  // Route materials are cloned so opacity can be driven per arc.
  const routes = useMemo(
    () =>
      parts.Route_.map((o, i) => {
        const mesh = o as THREE.Mesh
        if (mesh.material) {
          const mat = (mesh.material as THREE.MeshStandardMaterial).clone()
          mat.transparent = true
          mesh.material = mat
        }
        return { object: mesh, order: i / Math.max(1, parts.Route_.length - 1) }
      }),
    [parts],
  )

  const packets = useMemo(() => {
    const count = tier === 'mobile' ? 10 : tier === 'tablet' ? 16 : 24
    return Array.from({ length: count }, (_, i) => ({
      route: i % Math.max(1, routes.length),
      offset: (i * 0.37) % 1,
      speed: 0.16 + (i % 5) * 0.03,
    }))
  }, [tier, routes.length])

  const pinHome = useMemo(() => captureScales(parts.NodePin_), [parts])

  const packetRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const clock = useRef(0)

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05)
    if (!reduced) clock.current += d
    const t = clock.current
    const p = easeInOut(progress)

    if (globe.current) globe.current.rotation.y = -0.6 + t * 0.055 + p * 1.1

    // Arcs light in sequence rather than all at once.
    for (const { object, order } of routes) {
      const mat = object.material as THREE.MeshStandardMaterial
      if (!mat) continue
      const reveal = THREE.MathUtils.clamp((p - order * 0.55) / 0.3, 0, 1)
      mat.opacity = 0.1 + reveal * 0.9
      mat.emissiveIntensity = 0.4 + reveal * 1.8
    }

    for (let i = 0; i < parts.NodePin_.length; i += 1) {
      const pin = parts.NodePin_[i]
      const on = THREE.MathUtils.clamp((p - (i / MARKETS.length) * 0.5) / 0.2, 0, 1)
      const k = 0.4 + on * 0.6 + Math.sin(t * 1.6 + i) * 0.03
      pin.scale.set(pinHome[i].x * k, pinHome[i].y * k, pinHome[i].z * k)
    }

    // Packets ride their arc by sampling the route geometry's bounding sphere
    // path — cheap, and reads correctly at this scale.
    const mesh = packetRef.current
    if (mesh) {
      packets.forEach((pk, i) => {
        const route = routes[pk.route]?.object
        if (!route) return
        const geo = route.geometry
        if (!geo.boundingSphere) geo.computeBoundingSphere()
        const positions = geo.attributes.position
        const span = positions.count
        const u = (pk.offset + t * pk.speed) % 1
        const idx = Math.floor(u * (span - 1))
        dummy.position.set(positions.getX(idx), positions.getY(idx), positions.getZ(idx))
        route.localToWorld(dummy.position)
        globe.current?.worldToLocal(dummy.position)
        const fade = Math.sin(u * Math.PI)
        dummy.scale.setScalar(0.035 * fade * (0.4 + p * 0.6))
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
    }

    if (root.current) root.current.position.y = damp(root.current.position.y, -0.1, 3, d)

    const cam = state.camera
    cam.position.x = damp(cam.position.x, mapRange(p, 0, 1, 3.8, -2.6), 2.2, d)
    cam.position.y = damp(cam.position.y, mapRange(p, 0, 1, 2.2, 3.4), 2.2, d)
    cam.position.z = damp(cam.position.z, mapRange(p, 0, 1, 11.2, 9.0), 2.2, d)
    cam.lookAt(0, 0, 0)
  })

  return (
    <group ref={root} scale={tier === 'mobile' ? 0.86 : 1}>
      <group ref={globe}>
        <primitive object={model} />
        <instancedMesh ref={packetRef} args={[undefined, undefined, packets.length]}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color="#7ce4ff" toneMapped={false} />
        </instancedMesh>
      </group>
    </group>
  )
}

useGLTF.preload(MODEL_BY_KEY.globe)
