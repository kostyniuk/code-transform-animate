import type { LaidToken, LayoutResult } from "./codeLayout"

type AnimatedToken = {
  content: string
  color: string
  x: number
  y: number
  opacity: number
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}

function buildOccurrenceKey(tokens: LaidToken[]) {
  const counts = new Map<string, number>()
  const keyed: { occKey: string; t: LaidToken }[] = []
  for (const t of tokens) {
    const base = t.content
    const n = (counts.get(base) ?? 0) + 1
    counts.set(base, n)
    keyed.push({ occKey: `${base}#${n}`, t })
  }
  return keyed
}

export function animateLayouts(opts: {
  from: LayoutResult
  to: LayoutResult
  progress: number // 0..1
}): { content: string; color: string; x: number; y: number; opacity: number }[] {
  const p = easeInOutCubic(clamp01(opts.progress))

  const fromKeyed = buildOccurrenceKey(opts.from.tokens)
  const toKeyed = buildOccurrenceKey(opts.to.tokens)

  const toMap = new Map<string, LaidToken>()
  for (const { occKey, t } of toKeyed) toMap.set(occKey, t)

  const usedTo = new Set<string>()
  const animated: AnimatedToken[] = []

  for (const { occKey, t: a } of fromKeyed) {
    const b = toMap.get(occKey)
    if (b) {
      usedTo.add(occKey)
      animated.push({
        content: b.content,
        color: b.color,
        x: a.x + (b.x - a.x) * p,
        y: a.y + (b.y - a.y) * p,
        opacity: 1,
      })
    } else {
      animated.push({
        content: a.content,
        color: a.color,
        x: a.x,
        y: a.y,
        opacity: 1 - p,
      })
    }
  }

  // Fade in new tokens
  for (const { occKey, t: b } of toKeyed) {
    if (usedTo.has(occKey)) continue
    animated.push({
      content: b.content,
      color: b.color,
      x: b.x,
      y: b.y,
      opacity: p,
    })
  }

  return animated
}


