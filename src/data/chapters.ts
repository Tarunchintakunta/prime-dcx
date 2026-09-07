/** Scene keys map a chapter to the 3D set that renders behind it. Consecutive
 *  chapters sharing a key produce one continuous camera move rather than a cut. */
export type SceneKey =
  | 'engine'
  | 'globe'
  | 'tunnel'
  | 'terminal'
  | 'vault'
  | 'rails'
  | 'mobile'

export type Align = 'left' | 'right' | 'centre'

export interface Chapter {
  id: string
  nav?: string
  eyebrow: string
  title: string
  lede: string
  points?: string[]
  scene: SceneKey
  align: Align
  /** Extra scrim behind copy-dense chapters where legibility beats atmosphere. */
  solid?: boolean
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'engine',
    nav: 'Engine',
    eyebrow: 'Prime DCX',
    title: 'The Market Engine',
    lede:
      'One engine between you and the market. Prime DCX connects order entry, liquidity routing, risk control and settlement into a single system you can actually see working.',
    scene: 'engine',
    align: 'left',
  },
  {
    id: 'access',
    nav: 'Access',
    eyebrow: 'Chapter 01 / Global access',
    title: 'Connected to where the market trades',
    lede:
      'Sessions roll continuously across major financial centres. The engine stays connected as liquidity moves from one region to the next, so your access does not stop when one desk closes.',
    points: [
      'New York · London · Dubai · Mumbai · Singapore · Tokyo',
      'Continuous session coverage across regions',
      'Routing that follows available liquidity',
    ],
    scene: 'globe',
    align: 'left',
  },
  {
    id: 'pulse',
    nav: 'Market pulse',
    eyebrow: 'Chapter 02 / Market pulse',
    title: 'Price, depth and flow in one view',
    lede:
      'Every instrument is a stream: candles forming, depth building on both sides of the book, and order flow moving between them. Prime DCX renders that structure instead of hiding it behind a single number.',
    scene: 'tunnel',
    align: 'right',
  },
  {
    id: 'terminal',
    nav: 'Terminal',
    eyebrow: 'Chapter 03 / Trading cockpit',
    title: 'An institutional terminal, not a toy app',
    lede:
      'Chart, watchlist, order book and order pad on one surface. Layouts persist, keyboard flow is direct, and nothing important is more than one action away.',
    scene: 'terminal',
    align: 'left',
    solid: true,
  },
  {
    id: 'markets',
    nav: 'Markets',
    eyebrow: 'Chapter 04 / Multi-asset access',
    title: 'One account. Multiple asset classes.',
    lede:
      'Move between forex, crypto, indices, commodities, metals and share CFDs without leaving the terminal. Instrument availability depends on your account type and region.',
    scene: 'terminal',
    align: 'left',
    solid: true,
  },
  {
    id: 'execution',
    nav: 'Execution',
    eyebrow: 'Chapter 05 / Execution',
    title: 'From order pad to the book',
    lede:
      'An order leaves the pad, is checked against your margin and exposure limits, then routes to available liquidity. Each stage is visible in the ticket, including the reason an order is rejected.',
    points: [
      'Market, limit, stop and stop-limit order types',
      'Pre-trade margin and exposure checks',
      'Fill and rejection reasons surfaced on the ticket',
    ],
    scene: 'terminal',
    align: 'right',
    solid: true,
  },
  {
    id: 'risk',
    nav: 'Risk',
    eyebrow: 'Chapter 06 / Risk controls',
    title: 'Controls you set before the position moves',
    lede:
      'Stops, take-profits, position sizing and exposure caps are part of the order, not an afterthought. Margin state is shown continuously so a level is never a surprise.',
    points: [
      'Stop loss and take profit attached at order entry',
      'Live margin level and free-margin display',
      'Per-instrument and account-level exposure caps',
      'Volatility context alongside the position',
    ],
    scene: 'terminal',
    align: 'left',
    solid: true,
  },
  {
    id: 'security',
    nav: 'Security',
    eyebrow: 'Chapter 07 / Account security',
    title: 'Your account, sealed by default',
    lede:
      'Access control, encrypted data in transit and at rest, and verification on withdrawal. Security settings are visible in your account rather than buried in policy.',
    points: [
      'Two-factor authentication on login and withdrawal',
      'Encryption in transit and at rest',
      'Withdrawal verification and device review',
      'Session and login history you can audit',
    ],
    scene: 'vault',
    align: 'right',
  },
  {
    id: 'funding',
    nav: 'Funding',
    eyebrow: 'Chapter 08 / Funding & withdrawals',
    title: 'Rails in, rails out',
    lede:
      'Deposit and withdrawal options are listed with their support status, processing expectations and verification requirements. Availability varies by region and account.',
    scene: 'rails',
    align: 'left',
  },
  {
    id: 'mobile',
    nav: 'Mobile',
    eyebrow: 'Chapter 09 / Mobile trading',
    title: 'The engine, in your hand',
    lede:
      'The same account, positions and risk controls on mobile. Charting, the order book and the order pad are rebuilt for touch rather than shrunk to fit.',
    points: [
      'Full position and order management',
      'Charting with the same instrument set',
      'Biometric unlock and withdrawal verification',
    ],
    scene: 'mobile',
    align: 'right',
  },
  {
    id: 'disclosure',
    nav: 'Risk notice',
    eyebrow: 'Chapter 10 / Trading risk',
    title: 'Read this before you trade',
    lede: '',
    scene: 'engine',
    align: 'centre',
    solid: true,
  },
  {
    id: 'start',
    nav: 'Get started',
    eyebrow: 'Chapter 11 / Get started',
    title: 'Open an account, or talk to us first',
    lede:
      'Start with a demo to learn the terminal, open a live account when you are ready, or contact support with questions about markets, funding or verification.',
    scene: 'engine',
    align: 'centre',
  },
]

export const NAV_CHAPTERS = CHAPTERS.filter((c) => c.nav)
