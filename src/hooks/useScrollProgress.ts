import { useEffect } from 'react'
import { create } from 'zustand'
import type { SceneKey } from '../data/chapters'
import { CHAPTERS } from '../data/chapters'

export interface ChapterSpan {
  id: string
  scene: SceneKey
  /** Document offsets, refreshed on resize. */
  top: number
  bottom: number
}

interface ScrollState {
  /** 0..1 across the whole document. */
  progress: number
  /** Pixels scrolled, smoothed by Lenis. */
  scrollY: number
  /** Chapter currently occupying the viewport centre. */
  activeId: string
  activeScene: SceneKey
  /** 0..1 within the run of consecutive chapters sharing the active scene. */
  sceneProgress: number
  /** 1 in the body of a scene, dipping toward 0 at its boundaries so the swap
   *  to the next set happens behind a dissolve instead of a hard cut. */
  sceneAlpha: number
  spans: ChapterSpan[]
  setSpans: (spans: ChapterSpan[]) => void
  update: (scrollY: number, viewportH: number, docH: number) => void
}

const FIRST = CHAPTERS[0]

export const useScrollStore = create<ScrollState>((set, get) => ({
  progress: 0,
  scrollY: 0,
  activeId: FIRST.id,
  activeScene: FIRST.scene,
  sceneProgress: 0,
  sceneAlpha: 1,
  spans: [],
  setSpans: (spans) => set({ spans }),
  update: (scrollY, viewportH, docH) => {
    const state = get()
    const max = Math.max(1, docH - viewportH)
    const progress = clamp01(scrollY / max)
    const focus = scrollY + viewportH * 0.5

    const spans = state.spans
    if (!spans.length) {
      set({ progress, scrollY })
      return
    }

    let index = 0
    for (let i = 0; i < spans.length; i += 1) {
      if (focus >= spans[i].top) index = i
    }
    const active = spans[index]

    // Group the consecutive chapters that share this scene so the camera makes
    // one long move instead of restarting at every chapter boundary.
    let start = index
    while (start > 0 && spans[start - 1].scene === active.scene) start -= 1
    let end = index
    while (end < spans.length - 1 && spans[end + 1].scene === active.scene) end += 1

    const groupTop = spans[start].top
    const groupBottom = spans[end].bottom
    const sceneProgress = clamp01((focus - groupTop) / Math.max(1, groupBottom - groupTop))

    // Dissolve length. The first and last groups hold full opacity at the
    // document edges so the page never opens or closes on a dark frame.
    const fade = Math.max(1, viewportH * 0.45)
    const fadeIn = start === 0 ? 1 : clamp01((focus - groupTop) / fade)
    const fadeOut = end === spans.length - 1 ? 1 : clamp01((groupBottom - focus) / fade)
    const sceneAlpha = smoothstep(Math.min(fadeIn, fadeOut))

    set({
      progress,
      scrollY,
      activeId: active.id,
      activeScene: active.scene,
      sceneProgress,
      sceneAlpha,
    })
  },
}))

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

function smoothstep(t: number) {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}

/** Measures each chapter section and keeps the spans current across resizes. */
export function useChapterSpans() {
  const setSpans = useScrollStore((s) => s.setSpans)

  useEffect(() => {
    const measure = () => {
      const spans: ChapterSpan[] = []
      for (const chapter of CHAPTERS) {
        const el = document.getElementById(chapter.id)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        const top = rect.top + window.scrollY
        spans.push({ id: chapter.id, scene: chapter.scene, top, bottom: top + rect.height })
      }
      setSpans(spans)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(document.body)
    window.addEventListener('load', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('load', measure)
    }
  }, [setSpans])
}

export const useProgress = () => useScrollStore((s) => s.progress)
export const useActiveId = () => useScrollStore((s) => s.activeId)
