import type { Tier } from '../hooks/useReducedMotion'
import type { Align } from '../data/chapters'

export interface SceneProps {
  /** Which side the copy occupies, so the subject can take the other one. */
  align: Align
  /** 0..1 across the run of chapters that share this scene. */
  progress: number
  tier: Tier
  reduced: boolean
}
