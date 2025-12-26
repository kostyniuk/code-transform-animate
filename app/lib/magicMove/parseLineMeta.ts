import type { MagicMoveStepMeta } from "./types"

/**
 * Parse Slidev-like meta blocks from a code fence info string.
 *
 * Examples we support (order-insensitive; unknown keys ignored):
 * - "ts {lines:true,startLine:5}"
 * - "js {startLine:10}{lines:true}"
 */
type LineMetaParseResult = {
  meta: MagicMoveStepMeta
  specified: { lines: boolean; startLine: boolean }
}

export function parseLineMetaDetailed(info: string | undefined): LineMetaParseResult {
  const meta: MagicMoveStepMeta = { lines: false, startLine: 1 }
  const specified = { lines: false, startLine: false }
  if (!info) return { meta, specified }

  const blocks = [...info.matchAll(/\{([^}]*)\}/g)].map((m) => m[1])
  for (const block of blocks) {
    for (const rawPart of block.split(",")) {
      const part = rawPart.trim()
      if (!part) continue

      const [rawKey, rawValue] = part.split(":").map((s) => s?.trim())
      if (!rawKey) continue

      if (rawKey === "lines") {
        meta.lines = rawValue === "true"
        specified.lines = true
        continue
      }

      if (rawKey === "startLine") {
        const n = Number(rawValue)
        if (Number.isFinite(n) && n >= 1) {
          meta.startLine = Math.floor(n)
          specified.startLine = true
        }
        continue
      }
    }
  }

  return { meta, specified }
}

