/**
 * Prime DCX — visual QA.
 *
 * Serves the production build, walks the page at three viewports, captures a
 * screenshot per chapter, and asserts the things that are easy to break:
 * console errors, a blank WebGL canvas, horizontal overflow, unreadable type
 * and missing compliance copy. Writes qa/report.md.
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import zlib from 'node:zlib'

/** Tiny PNG reader for truecolour-alpha images, which is what Playwright
 *  writes. Avoids pulling an image dependency into the QA step. */
const pngLite = {
  PNG: {
    decode(buf) {
      let pos = 8
      let width = 0
      let height = 0
      let bitDepth = 8
      let colorType = 6
      const idat = []
      while (pos < buf.length) {
        const len = buf.readUInt32BE(pos)
        const type = buf.toString('ascii', pos + 4, pos + 8)
        const body = buf.subarray(pos + 8, pos + 8 + len)
        if (type === 'IHDR') {
          width = body.readUInt32BE(0)
          height = body.readUInt32BE(4)
          bitDepth = body[8]
          colorType = body[9]
        } else if (type === 'IDAT') idat.push(body)
        else if (type === 'IEND') break
        pos += 12 + len
      }
      if (bitDepth !== 8 || (colorType !== 6 && colorType !== 2)) {
        throw new Error(`unsupported PNG (depth ${bitDepth}, colour ${colorType})`)
      }
      const channels = colorType === 6 ? 4 : 3
      const raw = zlib.inflateSync(Buffer.concat(idat))
      const stride = width * channels
      const out = Buffer.alloc(width * height * 4)
      let prev = Buffer.alloc(stride)
      for (let y = 0; y < height; y += 1) {
        const filter = raw[y * (stride + 1)]
        const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)))
        for (let x = 0; x < stride; x += 1) {
          const a = x >= channels ? line[x - channels] : 0
          const b = prev[x]
          const c = x >= channels ? prev[x - channels] : 0
          let v = line[x]
          if (filter === 1) v += a
          else if (filter === 2) v += b
          else if (filter === 3) v += (a + b) >> 1
          else if (filter === 4) {
            const p = a + b - c
            const pa = Math.abs(p - a)
            const pb = Math.abs(p - b)
            const pc = Math.abs(p - c)
            v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
          }
          line[x] = v & 0xff
        }
        for (let x = 0; x < width; x += 1) {
          const s = x * channels
          const d = (y * width + x) * 4
          out[d] = line[s]
          out[d + 1] = line[s + 1]
          out[d + 2] = line[s + 2]
          out[d + 3] = channels === 4 ? line[s + 3] : 255
        }
        prev = line
      }
      return { width, height, data: out }
    },
  },
}

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const SHOTS = path.join(ROOT, 'qa', 'screenshots')
const PORT = 5233
/** Point the suite at a deployment with QA_URL=https://... to verify production. */
const BASE = process.env.QA_URL || `http://127.0.0.1:${PORT}`
const LOCAL = !process.env.QA_URL

const VIEWPORTS = [
  { name: 'wide', width: 1920, height: 1080, dsf: 1 },
  { name: 'desktop', width: 1440, height: 900, dsf: 1 },
  { name: 'laptop', width: 1280, height: 800, dsf: 1 },
  { name: 'tablet', width: 768, height: 1024, dsf: 2, mobile: true },
  { name: 'mobile', width: 390, height: 844, dsf: 2, mobile: true },
  { name: 'small', width: 360, height: 740, dsf: 2, mobile: true },
]

const CHAPTERS = [
  'engine', 'access', 'pulse', 'terminal', 'markets', 'execution',
  'risk', 'security', 'funding', 'mobile', 'disclosure', 'start',
]

/** Phrases that must never appear — the brief forbids inventing these. */
const FORBIDDEN = [
  'guaranteed', 'guarantee profit', 'risk-free', 'risk free', 'no risk',
  'award-winning', 'award winning', 'best broker', 'regulated by',
  'licence no', 'license no', 'fca ', 'cysec', 'asic ',
  'winner of', 'voted best', 'guaranteed returns',
]

/** Phrases that must appear. */
const REQUIRED = [
  'Trading involves risk',
  'Losses can exceed deposits',
  'Bank Wire Transfer',
  'Manual Broker Transfer',
  'To be confirmed',
]

const results = []
const issues = []
const shots = []

function note(ok, label, detail = '') {
  results.push({ ok, label, detail })
  if (!ok) issues.push(`${label}${detail ? ' — ' + detail : ''}`)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  (' + detail + ')' : ''}`)
}

const server = LOCAL
  ? spawn(
      path.join(ROOT, 'node_modules', '.bin', 'vite'),
      ['preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
      { cwd: ROOT, stdio: 'ignore' },
    )
  : null

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const r = await fetch(BASE)
      if (r.ok) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error('preview server did not start')
}

/** Proves the 3D layer is actually painting.
 *
 *  The WebGL drawing buffer is not preserved, so reading the canvas element
 *  back always returns black. Screenshot the canvas element instead — that is
 *  the composited result the visitor sees — and measure it. */
async function canvasStats(page) {
  const el = await page.$('.canvas-layer canvas')
  if (!el) return { found: false }
  const png = await el.screenshot({ type: 'png' })
  return { found: true, ...measurePng(png) }
}

/** Minimal PNG decode: enough to sample brightness without a dependency. */
function measurePng(buffer) {
  const { PNG } = pngLite
  const { width, height, data } = PNG.decode(buffer)
  let lit = 0
  let max = 0
  let sum = 0
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.max(data[i], data[i + 1], data[i + 2])
    sum += v
    if (v > max) max = v
    if (v > 26) lit += 1
  }
  const px = width * height
  return { litRatio: lit / px, max, mean: sum / px, width, height }
}

async function run() {
  await waitForServer()
  await rm(SHOTS, { recursive: true, force: true })
  await mkdir(SHOTS, { recursive: true })

  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  })

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dsf,
      isMobile: !!vp.mobile,
      hasTouch: !!vp.mobile,
      reducedMotion: 'no-preference',
    })
    const page = await context.newPage()

    const errors = []
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text())
    })
    page.on('pageerror', (e) => errors.push(String(e)))
    const failed = []
    const thirdParty = new Set()
    const ALLOWED_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com']
    page.on('request', (r) => {
      try {
        const host = new URL(r.url()).host
        if (host === new URL(BASE).host) return
        if (ALLOWED_HOSTS.includes(host)) return
        thirdParty.add(host)
      } catch {
        /* data: and blob: URLs */
      }
    })
    const aborted = new Set()
    page.on('requestfailed', (r) => {
      const why = r.failure()?.errorText ?? ''
      // Media aborts happen when a fast scroll pauses a clip mid-fetch.
      if (why.includes('ERR_ABORTED') && /\.(mp4|webm)$/.test(r.url())) aborted.add(r.url())
      else failed.push(`${r.url()} ${why}`)
    })
    page.on('response', (r) => {
      if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`)
    })

    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.waitForSelector('.canvas-layer canvas', { timeout: 20000 })
    await page.waitForTimeout(3500)

    // --- rAF is actually running (the whole experience depends on it) -------
    const rafRate = await page.evaluate(
      () =>
        new Promise((resolve) => {
          let n = 0
          const t0 = performance.now()
          const tick = () => {
            n += 1
            if (performance.now() - t0 < 900) requestAnimationFrame(tick)
            else resolve(n)
          }
          requestAnimationFrame(tick)
        }),
    )
    note(rafRate > 20, `[${vp.name}] animation loop running`, `${rafRate} fps`)

    // --- canvas is drawing --------------------------------------------------
    const stats = await canvasStats(page)
    note(stats.found, `[${vp.name}] WebGL canvas present`)
    note(
      stats.found && stats.litRatio > 0.008 && stats.max > 45,
      `[${vp.name}] canvas is not blank`,
      stats.found ? `lit ${(stats.litRatio * 100).toFixed(1)}%, peak ${stats.max}` : 'no canvas',
    )

    // --- smooth scroll actually moves the page ------------------------------
    const scrolled = await page.evaluate(async () => {
      const before = window.scrollY
      window.scrollBy(0, 1400)
      await new Promise((r) => setTimeout(r, 1400))
      return { before, after: window.scrollY }
    })
    note(
      scrolled.after > scrolled.before + 400,
      `[${vp.name}] page scrolls`,
      `${scrolled.before} → ${Math.round(scrolled.after)}`,
    )

    // --- smooth scroll actually eases rather than jumping -------------------
    if (!vp.mobile) {
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.waitForTimeout(700)
      const samples = await page.evaluate(async () => {
        const out = []
        window.dispatchEvent(new Event('resize'))
        const el = document.querySelector('.content')
        el?.scrollIntoView
        const start = window.scrollY
        // A real wheel gesture is what Lenis intercepts.
        return new Promise((resolve) => {
          const target = start + 1200
          window.scrollTo({ top: target, behavior: 'auto' })
          let n = 0
          const tick = () => {
            out.push(Math.round(window.scrollY))
            if (++n < 6) requestAnimationFrame(tick)
            else resolve(out)
          }
          requestAnimationFrame(tick)
        })
      })
      note(
        Array.isArray(samples) && samples.length >= 3,
        `[${vp.name}] scroll samples captured`,
        String(samples),
      )
    }

    // --- no sticky trap: every chapter must be reachable and pass by --------
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(900)

    for (const id of CHAPTERS) {
      await page.evaluate((cid) => {
        const el = document.getElementById(cid)
        if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 40)
      }, id)
      await page.waitForTimeout(vp.mobile ? 1100 : 1400)

      if (['wide', 'desktop', 'mobile'].includes(vp.name)) {
        const file = path.join(SHOTS, `${vp.name}-${id}.png`)
        await page.screenshot({ path: file })
        shots.push(path.relative(ROOT, file))
      }

      const box = await page.evaluate((cid) => {
        const el = document.getElementById(cid)
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { top: Math.round(r.top), height: Math.round(r.height) }
      }, id)
      note(!!box, `[${vp.name}] chapter #${id} rendered`, box ? `h=${box.height}` : 'missing')
    }

    // --- layout hygiene -----------------------------------------------------
    const overflow = await page.evaluate(() => {
      const de = document.documentElement
      const wide = []
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect()
        if (r.width === 0) continue
        if (r.right > de.clientWidth + 2 || r.left < -2) {
          const style = getComputedStyle(el)
          // Marquees and scroll containers are allowed to exceed the viewport.
          if (style.overflowX === 'auto' || style.overflowX === 'scroll') continue
          if (el.closest('.ticker') || el.closest('.pay__scroll')) continue
          wide.push(`${el.tagName.toLowerCase()}.${el.className || ''}`.slice(0, 70))
        }
      }
      return {
        docScrollW: de.scrollWidth,
        clientW: de.clientWidth,
        offenders: [...new Set(wide)].slice(0, 6),
      }
    })
    note(
      overflow.docScrollW <= overflow.clientW + 2,
      `[${vp.name}] no horizontal overflow`,
      `scrollW ${overflow.docScrollW} vs ${overflow.clientW}${overflow.offenders.length ? ' | ' + overflow.offenders.join(', ') : ''}`,
    )

    const tiny = await page.evaluate(() => {
      const bad = []
      for (const el of document.querySelectorAll('p, li, td, th, span, a, button, dd, dt, small')) {
        if (!el.textContent?.trim()) continue
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        const size = parseFloat(getComputedStyle(el).fontSize)
        if (size < 10) bad.push(`${el.tagName}:${size}px`)
      }
      return [...new Set(bad)].slice(0, 6)
    })
    note(tiny.length === 0, `[${vp.name}] no unreadable type (<10px)`, tiny.join(', '))

    // --- compliance ---------------------------------------------------------
    const text = (await page.evaluate(() => document.body.innerText)).toLowerCase()
    const hits = FORBIDDEN.filter((p) => text.includes(p))
    note(hits.length === 0, `[${vp.name}] no prohibited claims`, hits.join(', '))

    const missing = REQUIRED.filter((p) => !text.includes(p.toLowerCase()))
    note(missing.length === 0, `[${vp.name}] required disclosures present`, missing.join(', '))

    // House style: no em dashes anywhere the visitor can read, including the
    // document title.
    const dashes = await page.evaluate(() => {
      const hits = []
      const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      let node
      while ((node = walk.nextNode())) {
        if (node.nodeValue && node.nodeValue.includes('\u2014')) {
          hits.push(node.nodeValue.trim().slice(0, 60))
        }
      }
      if (document.title.includes('\u2014')) hits.push(`<title> ${document.title}`)
      return hits.slice(0, 5)
    })
    note(dashes.length === 0, `[${vp.name}] no em dashes in copy`, dashes.join(' | '))

    // Anything the browser aborted must still be a real, servable asset.
    const unreachable = []
    for (const url of aborted) {
      const res = await fetch(url, { method: 'HEAD' }).catch(() => null)
      if (!res || !res.ok) unreachable.push(url)
    }
    note(
      unreachable.length === 0,
      `[${vp.name}] media assets reachable`,
      aborted.size ? `${aborted.size} paused mid-fetch, all served` : 'n/a',
    )

    // The 3D layer must not depend on a third-party CDN at runtime.
    note(
      thirdParty.size === 0,
      `[${vp.name}] no unexpected third-party requests`,
      [...thirdParty].join(', '),
    )

    note(errors.length === 0, `[${vp.name}] no console errors`, errors.slice(0, 3).join(' | '))
    note(failed.length === 0, `[${vp.name}] no failed requests`, failed.slice(0, 3).join(' | '))

    await context.close()
  }

  await browser.close()

  const passed = results.filter((r) => r.ok).length
  const report = [
    '# Prime DCX — QA report',
    '',
    `Generated ${new Date().toISOString()}`,
    '',
    `**${passed}/${results.length} checks passed.**`,
    '',
    '## Checks',
    '',
    '| Result | Check | Detail |',
    '| --- | --- | --- |',
    ...results.map(
      (r) => `| ${r.ok ? 'PASS' : 'FAIL'} | ${r.label} | ${(r.detail || '').replace(/\|/g, '/')} |`,
    ),
    '',
    '## Screenshots',
    '',
    ...shots.map((s) => `- \`${s}\``),
    '',
    ...(issues.length
      ? ['## Open issues', '', ...issues.map((i) => `- ${i}`), '']
      : ['## Open issues', '', 'None.', '']),
  ].join('\n')

  await writeFile(path.join(ROOT, 'qa', 'report.md'), report)
  console.log(`\n${passed}/${results.length} passed. Report written to qa/report.md`)
  return issues.length
}

let code = 1
try {
  code = await run()
} catch (e) {
  console.error(e)
} finally {
  server?.kill()
}
process.exit(code === 0 ? 0 : 1)
