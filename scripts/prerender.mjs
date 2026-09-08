/**
 * Injects a build-time render of the app into dist/index.html.
 *
 * Why this exists: the site is a client-rendered SPA, so the HTML served to a
 * crawler contained 91 words while a visitor saw about 1,500. Googlebot renders
 * JavaScript on a delayed second pass, and the AI crawlers this site wants to
 * be cited by (GPTBot, ClaudeBot, PerplexityBot) do not render it at all.
 *
 * The render runs through Vite's SSR pipeline rather than a headless browser,
 * so it needs no extra binaries and works unchanged in Vercel's build image.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const HTML = path.join(ROOT, 'dist', 'index.html')
const BUNDLE = path.join(ROOT, '.ssr', 'entry-server.js')

const { render } = await import(BUNDLE)
let markup = render()

// The canvas is created by the renderer at runtime and carries no content, so
// it only adds bytes to every crawl.
markup = markup.replace(/<canvas\b[^>]*>[\s\S]*?<\/canvas>/g, '')

const html = await readFile(HTML, 'utf8')

if (!html.includes('<div id="root"></div>')) {
  throw new Error('prerender: could not find the empty root element in dist/index.html')
}

const out = html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`)
await writeFile(HTML, out)

const words = markup
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .split(' ')
  .filter(Boolean).length

console.log(`prerender: injected ${(markup.length / 1024).toFixed(1)} KB, ~${words} words`)
