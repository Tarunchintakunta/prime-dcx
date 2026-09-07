import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { MODEL_BY_KEY } from '../data/assetManifest'
import { captureScales, collectByPrefix, damp, easeInOut, makeSpinner, mapRange } from '../utils/animation'
import type { SceneProps } from './types'

/** Chapter 07 — account security.
 *  Protection layers counter-rotate, bolts seat as the chapter advances, and
 *  the verification lattice lights cell by cell. */
export function SecurityVaultScene({ progress, tier, reduced }: SceneProps) {
  const { scene } = useGLTF(MODEL_BY_KEY.vault)
  const model = useMemo(() => scene.clone(true), [scene])
  const root = useRef<THREE.Group>(null)

  const parts = useMemo(() => {
    // `hide_render` keeps the housing out of the Blender still but the glTF
    // exporter still writes it, and from behind it occludes the whole door.
    for (const o of collectByPrefix(model, 'Chamber').Chamber) o.visible = false
    return (
      collectByPrefix(
        model,
        'Layer_Encryption',
        'Layer_AccountShield',
        'Layer_Withdrawal',
        'Plate_Encryption',
        'Plate_AccountShield',
        'Plate_Withdrawal',
        'Bolt_',
        'Verify_',
        'SealHub',
        'Spoke_',
        'VaultDisc_',
      )
    )
  }, [model])

  const boltRest = useMemo(
    () => parts.Bolt_.map((o) => o.position.clone()),
    [parts],
  )

  const verifyHome = useMemo(() => captureScales(parts.Verify_), [parts])

  // The door lies in the XY plane after conversion, so every shell turns
  // about Z — and each part keeps the tilt it was exported with.
  const spinEnc = useMemo(
    () => makeSpinner([...parts.Layer_Encryption, ...parts.Plate_Encryption]),
    [parts],
  )
  const spinAcc = useMemo(
    () => makeSpinner([...parts.Layer_AccountShield, ...parts.Plate_AccountShield]),
    [parts],
  )
  const spinWit = useMemo(
    () => makeSpinner([...parts.Layer_Withdrawal, ...parts.Plate_Withdrawal]),
    [parts],
  )
  const spinSeal = useMemo(() => makeSpinner([...parts.SealHub, ...parts.Spoke_]), [parts])

  const clock = useRef(0)

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05)
    if (!reduced) clock.current += d
    const t = clock.current
    const p = easeInOut(progress)

    // Counter-rotating shells: each protection layer turns the other way.
    spinEnc('z', t * 0.16)
    spinAcc('z', -t * 0.11)
    spinWit('z', t * 0.07)
    spinSeal('z', t * 0.4)

    // Bolts drive home as the chapter seals.
    const seat = THREE.MathUtils.clamp((p - 0.25) / 0.4, 0, 1)
    parts.Bolt_.forEach((o, i) => {
      const rest = boltRest[i]
      const out = 1 - seat
      // Bolts radiate in the XY plane once the door is converted to Y-up.
      o.position.set(rest.x * (1 + out * 0.22), rest.y * (1 + out * 0.22), rest.z)
    })

    parts.Verify_.forEach((o, i) => {
      const on = THREE.MathUtils.clamp((p * 1.6 - i * 0.055) / 0.2, 0, 1)
      const k = on * (1 + Math.sin(t * 2.2 + i) * 0.06)
      o.scale.set(verifyHome[i].x * k, verifyHome[i].y * k, verifyHome[i].z * k)
    })

    if (root.current) root.current.rotation.y = damp(root.current.rotation.y, -0.22 + p * 0.4, 2.4, d)

    const cam = state.camera
    cam.position.x = damp(cam.position.x, mapRange(p, 0, 1, 3.0, -1.8), 2, d)
    cam.position.y = damp(cam.position.y, mapRange(p, 0, 1, 1.5, 0.3), 2, d)
    cam.position.z = damp(cam.position.z, mapRange(p, 0, 1, 13.0, 10.4), 2, d)
    cam.lookAt(0, 0, 0)
  })

  return (
    <group ref={root} scale={tier === 'mobile' ? 0.72 : 0.92}>
      <primitive object={model} />
      <pointLight position={[0, 0, -2.2]} color="#35c8e8" intensity={5} distance={7} />
    </group>
  )
}

useGLTF.preload(MODEL_BY_KEY.vault)
