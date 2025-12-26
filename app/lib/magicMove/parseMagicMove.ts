import type { MagicMoveBlock, MagicMoveParseResult, MagicMoveStep } from "./types"
import { parseLineMetaDetailed } from "./parseLineMeta"

type Fence = {
  fence: string
  info: string
  body: string
}

function parseFencedBlocks(input: string): Fence[] {
  const lines = input.replace(/\r\n/g, "\n").split("\n")
  const blocks: Fence[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i] ?? ""
    const open = line.match(/^(`{3,})(.*)$/)
    if (!open) {
      i++
      continue
    }

    const fence = open[1]!
    const info = (open[2] ?? "").trim()
    i++

    const bodyLines: string[] = []
    let closed = false
    while (i < lines.length) {
      const l = lines[i] ?? ""
      if (l.startsWith(fence)) {
        closed = true
        i++
        break
      }
      bodyLines.push(l)
      i++
    }

    blocks.push({ fence, info, body: bodyLines.join("\n") })
    if (!closed) break
  }

  return blocks
}

function stripFirstWord(info: string): { first: string; rest: string } {
  const m = info.match(/^(\S+)(?:\s+(.*))?$/)
  if (!m) return { first: "", rest: "" }
  return { first: m[1] ?? "", rest: (m[2] ?? "").trim() }
}

export function parseMagicMove(input: string): MagicMoveParseResult {
  const docErrors: string[] = []
  const blocks: MagicMoveBlock[] = []

  // Support both:
  // - ````md magic-move
  // - ````shiki-magic-move
  //
  // We intentionally ignore other Markdown (frontmatter, slide separators, etc).
  const re =
    /(^|\n)````\s*(md\s+magic-move|shiki-magic-move)\s*([^\n]*)\n([\s\S]*?)\n````(?=\n|$)/g

  for (const m of input.matchAll(re)) {
    const kind = (m[2] ?? "").trim() as MagicMoveBlock["kind"]
    const outerInfo = (m[3] ?? "").trim()
    const inner = m[4] ?? ""

    const outerMeta = parseLineMetaDetailed(outerInfo).meta
    const fences = parseFencedBlocks(inner)

    const steps: MagicMoveStep[] = []
    const errors: string[] = []

    for (const f of fences) {
      // Slidev ignores non-code blocks between steps; we only treat triple-backtick blocks as steps.
      if (f.fence !== "```") continue

      const { first: lang, rest } = stripFirstWord(f.info)
      const parsed = parseLineMetaDetailed(rest)
      const meta = {
        lines: parsed.specified.lines ? parsed.meta.lines : outerMeta.lines,
        startLine: parsed.specified.startLine ? parsed.meta.startLine : outerMeta.startLine,
      }
      steps.push({ lang: lang || "text", code: f.body, meta })
    }

    if (steps.length === 0) errors.push("No code steps found inside this magic-move block.")
    for (const [idx, s] of steps.entries()) {
      if (s.meta.startLine < 1) errors.push(`Step ${idx + 1}: startLine must be >= 1`)
    }

    blocks.push({ kind, outerMeta, steps, errors })
  }

  if (blocks.length === 0) {
    docErrors.push(
      "No magic-move blocks found.\n\nSupported formats:\n- ````md magic-move ... ```` (4 backticks)\n- ````shiki-magic-move {lines:true} ... ```` (4 backticks)\n\nInside, include multiple triple-backtick code fences (```lang ... ```).",
    )
  }

  return { blocks, errors: docErrors }
}


