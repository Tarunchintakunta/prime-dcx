/** Generated assets used by the site.
 *
 *  models  — authored in Blender (blender/scripts), exported as optimised GLB.
 *  stills  — Higgsfield frames generated from the Blender reference renders.
 *  clips   — Higgsfield motion generated from those stills.
 *
 *  `poster` entries are used as the immediate paint while a clip loads, and as
 *  the permanent visual when the visitor prefers reduced motion. */

export interface ModelAsset {
  key: string
  src: string
  label: string
  source: string
}

export interface MediaAsset {
  key: string
  poster?: string
  clip?: string
  label: string
}

export const MODELS: ModelAsset[] = [
  { key: 'engine', src: '/assets/models/prime_core.glb', label: 'Prime Core / Market Engine', source: 'blender/scripts/01_prime_core.py' },
  { key: 'globe', src: '/assets/models/liquidity_globe.glb', label: 'Global liquidity globe', source: 'blender/scripts/02_liquidity_globe.py' },
  { key: 'tunnel', src: '/assets/models/market_tunnel.glb', label: 'Market data tunnel', source: 'blender/scripts/03_market_tunnel.py' },
  { key: 'terminal', src: '/assets/models/trading_cockpit.glb', label: 'Trading cockpit', source: 'blender/scripts/04_trading_cockpit.py' },
  { key: 'vault', src: '/assets/models/security_vault.glb', label: 'Security vault', source: 'blender/scripts/05_security_vault.py' },
  { key: 'rails', src: '/assets/models/payment_rails.glb', label: 'Payment rails', source: 'blender/scripts/06_payment_rails.py' },
  { key: 'mobile', src: '/assets/models/mobile_device.glb', label: 'Mobile trading device', source: 'blender/scripts/07_mobile_device.py' },
]

export const MODEL_BY_KEY: Record<string, string> = Object.fromEntries(
  MODELS.map((m) => [m.key, m.src]),
)

/** All eight beats have a clip. `CinematicMedia` still falls back to the 4K
 *  still whenever `clip` is absent or the visitor prefers reduced motion. */
export const MEDIA: MediaAsset[] = [
  { key: 'engine', poster: '/assets/images/01-prime-core.jpg', clip: '/assets/videos/01-prime-core.mp4', label: 'Prime Core waking up' },
  { key: 'globe', poster: '/assets/images/02-liquidity-globe.jpg', clip: '/assets/videos/02-liquidity-globe.mp4', label: 'Globe liquidity network opening' },
  { key: 'tunnel', poster: '/assets/images/03-market-tunnel.jpg', clip: '/assets/videos/03-market-tunnel.mp4', label: 'Market data tunnel fly-through' },
  { key: 'terminal', poster: '/assets/images/04-trading-cockpit.jpg', clip: '/assets/videos/04-trading-cockpit.mp4', label: 'Trading cockpit reveal' },
  { key: 'vault', poster: '/assets/images/05-security-vault.jpg', clip: '/assets/videos/05-security-vault.mp4', label: 'Security vault transition' },
  { key: 'rails', poster: '/assets/images/06-payment-rails.jpg', clip: '/assets/videos/06-payment-rails.mp4', label: 'Payment rails animation' },
  { key: 'mobile', poster: '/assets/images/07-mobile-trading.jpg', clip: '/assets/videos/07-mobile-trading.mp4', label: 'Mobile trading reveal' },
  { key: 'brand', poster: '/assets/images/08-brand-pullback.jpg', clip: '/assets/videos/08-brand-pullback.mp4', label: 'Final brand pullback' },
]

export const MEDIA_BY_KEY: Record<string, MediaAsset> = Object.fromEntries(
  MEDIA.map((m) => [m.key, m]),
)
