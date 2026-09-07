# Prime DCX — The Market Engine

A cinematic, real-time 3D marketing site for **Prime DCX**, a trading access
platform. The visual identity is not stock footage: every set is modelled in
Blender, exported as GLB, and rendered live in WebGL, with Higgsfield frames and
clips generated **from those same Blender renders** as the supporting media
layer.

```bash
npm install
npm run dev      # http://localhost:4310
npm run build    # type-check + production bundle into dist/
npm run preview  # serve the build
npm run qa       # Playwright visual + compliance QA → qa/report.md
```

## What it is

Twelve chapters scroll over a fixed WebGL canvas. Chapters that share a set feed
one continuous camera move rather than a cut, and the swap between sets happens
behind a dissolve. There is **no pinning and no sticky scroll**: the document
scrolls normally, Lenis smooths the wheel, and GSAP ScrollTrigger only fires
one-shot reveals as sections enter.

| # | Chapter | Set |
| --- | --- | --- |
| 00 | Hero — the Market Engine | Prime Core |
| 01 | Global access | Liquidity globe |
| 02 | Market pulse | Market data tunnel |
| 03 | Trading cockpit | Cockpit |
| 04 | Multi-asset access | Cockpit |
| 05 | Execution | Cockpit |
| 06 | Risk controls | Cockpit |
| 07 | Account security | Security vault |
| 08 | Funding & withdrawals | Payment rails |
| 09 | Mobile trading | Mobile device |
| 10 | Trading risk disclosure | Prime Core |
| 11 | Get started | Prime Core |

## Asset pipeline

**Blender → GLB → WebGL.** Seven scenes are authored as Python scripts and built
headlessly, so the models are reproducible rather than hand-saved:

```bash
for f in blender/scripts/0*.py; do
  /Applications/Blender.app/Contents/MacOS/Blender --background --python "$f"
done
```

Each script writes three things: an optimised GLB into
`public/assets/models/`, a `.blend` into `blender/scenes/`, and a 2560×1440
reference render into `blender/exports/refs/`. `blender/scripts/dcx_common.py`
holds the shared palette, lighting rig, exporter and an exact camera-framing
solver (it projects every visible bounding-box corner onto the camera axes and
solves for the closest distance that still contains them, so shots are tight
without cropping).

**Blender reference → Higgsfield.** The reference renders were uploaded as
image references, one still generated per story beat, and each still then used
as the start frame for its clip. All eight beats have both. Stills live in
`public/assets/images/` (2560px web JPEGs; 5504×3072 masters in
`blender/exports/`), clips in `public/assets/videos/`, all transcoded to H.264
— Seedance returns HEVC, which Chrome and Firefox will not play from a `<video>`
tag. `src/data/assetManifest.ts` is the single source of truth for what exists;
`CinematicMedia` falls back to the still whenever a clip is absent or the
visitor prefers reduced motion.

Beats 1–4 were generated with Seedance 2.5 at 1080p; beats 5–8 with Kling 3.0
(`mode: std`, `sound: off`), which produced comparable quality at a small
fraction of the credit cost. **Generated footage is vetted frame by frame for
hallucinated text before it ships** — models like to engrave plaques onto
machined metal. The security-vault clip is trimmed to 3.17s because lettering
appeared on the outer ring from frame ~79 onward; sample any regenerated clip at
full resolution and check the metal surfaces before wiring it into the
manifest.

### Axis note

The glTF exporter converts Blender's Z-up to Y-up, which permutes both axes and
scale components: Blender `(sx, sy, sz)` arrives as `(sx, sz, sy)`. Scene code
must animate the converted axis — a candle's height is `scale.z` in the cockpit
and `scale.y` on the phone. Two related rules the scenes follow:

- **Scale is multiplied, never assigned.** Parts are sized in real units; a
  0..1 factor written straight onto `scale` rescales them to a unit cube.
  `captureScales()` snapshots the authored values to multiply against.
- **Rotation composes onto the exported quaternion.** Assigning
  `object.rotation.y` replaces the node's quaternion and flattens any authored
  tilt. `makeSpinner()` premultiplies instead.

## Compliance

The site states no regulation, licence, spread, leverage, award, user count or
performance claim, because none was supplied. Where a commercial value would
normally sit, the data files carry an explicit placeholder:

- `src/data/paymentMethods.ts` — every processing time, fee, currency and
  region is `To be confirmed` / `Region dependent`. Replace with published
  values before launch; **do not substitute a guess.**
- `src/data/markets.ts` — instrument names only, no counts or terms.
- The terminal and ticker render a deterministic simulation and label
  themselves *Simulated data* / *Interface preview* on screen.

`src/components/RiskDisclosure.tsx` carries the required notice, and the QA run
fails the build if any prohibited phrase appears or a required disclosure goes
missing.

## Performance & accessibility

- Quality tiers (`useTier`) drive DPR, particle counts and post-processing;
  bloom and vignette are desktop-only.
- `useReducedMotion` swaps Lenis for native scroll, freezes scene animation and
  shows stills instead of clips.
- Clips are muted, looped, `playsinline`, and only load once on screen.
- Skip link, focus-visible outlines, labelled regions, and a nav that collapses
  rather than wrapping.

## QA

`npm run qa` serves the production build and drives Chromium at 1920×1080,
1440×900 and 390×844. It captures a screenshot per chapter per viewport into
`qa/screenshots/` and asserts: the animation loop runs, the WebGL canvas is
actually painting (measured from the composited screenshot, since the drawing
buffer is not preserved), the page scrolls, every chapter renders, there is no
horizontal overflow, no type under 10px, no prohibited claims, the required
disclosures are present, and no console errors or failed requests. Results are
written to `qa/report.md`.

## Stack

React 18 · Vite 5 · TypeScript · Three.js · React Three Fiber · Drei ·
postprocessing · GSAP ScrollTrigger · Lenis · Zustand · Playwright.
Vercel-ready — `npm run build` emits a static `dist/`.
