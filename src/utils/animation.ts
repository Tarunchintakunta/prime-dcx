import { Quaternion, Vector3 } from 'three'
import type { Object3D } from 'three'

export const clamp = (v: number, min = 0, max = 1) => (v < min ? min : v > max ? max : v)

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Frame-rate independent smoothing. `lambda` is the decay rate per second. */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt))

/** Remap `v` from [inMin,inMax] to [outMin,outMax], clamped at both ends. */
export function mapRange(
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) {
  const t = clamp((v - inMin) / (inMax - inMin || 1))
  return outMin + (outMax - outMin) * t
}

export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/** A 0→1→0 pulse peaking at `centre`, used to bring elements in and out
 *  as a scene's progress passes them. */
export function window01(t: number, centre: number, width: number) {
  const d = Math.abs(t - centre) / (width || 1)
  return d >= 1 ? 0 : 1 - d * d * (3 - 2 * d)
}

/** Collect a model's children by name prefix so scenes can animate the parts
 *  that Blender named, without hard-coding indices. */
export function collectByPrefix(root: Object3D, ...prefixes: string[]) {
  const out: Record<string, Object3D[]> = {}
  for (const p of prefixes) out[p] = []
  root.traverse((child) => {
    for (const p of prefixes) {
      if (child.name.startsWith(p)) out[p].push(child)
    }
  })
  return out
}

/** Snapshot the scales authored in Blender.
 *
 *  Scene animation must multiply these, never assign. The GLB parts are sized
 *  in real units (a chart candle is ~0.1 units tall); assigning a 0..1 factor
 *  straight onto `scale` silently rescales them to a unit cube and floods the
 *  frame. */
export function captureScales(objects: Object3D[]): Vector3[] {
  return objects.map((o) => o.scale.clone())
}

const AXES = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, 1),
} as const

export type Axis = keyof typeof AXES

/** Spin objects about a parent axis while keeping the orientation Blender
 *  authored.
 *
 *  Assigning `object.rotation.y` replaces the node's quaternion outright,
 *  which silently flattened every part that was exported with a tilt (the
 *  engine's gimbal rings, the vault's protection shells). Composing onto a
 *  captured base quaternion animates them without losing that tilt. */
export function makeSpinner(objects: Object3D[]) {
  const base = objects.map((o) => o.quaternion.clone())
  const q = new Quaternion()
  return (axis: Axis, angle: number) => {
    q.setFromAxisAngle(AXES[axis], angle)
    for (let i = 0; i < objects.length; i += 1) {
      objects[i].quaternion.copy(base[i]).premultiply(q)
    }
  }
}

export function findByName(root: Object3D, name: string): Object3D | null {
  let found: Object3D | null = null
  root.traverse((child) => {
    if (!found && child.name === name) found = child
  })
  return found
}
