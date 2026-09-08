import { renderToStaticMarkup } from 'react-dom/server'
import App from './App'

/** Build-time render of the page to static HTML.
 *
 *  This runs in Node with no DOM. Every browser-only path in the app is
 *  already guarded (`typeof window === 'undefined'`), so the 3D layer resolves
 *  to its static backdrop and effects never run. The output is the same markup
 *  React produces in the browser, which is what makes it a prerender rather
 *  than a separate crawler-only page. */
export function render(): string {
  return renderToStaticMarkup(<App />)
}
