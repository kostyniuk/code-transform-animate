import type { CanvasLayoutConfig, LayoutResult, RenderTheme } from "./codeLayout"

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function clearAndPaintBackground(opts: {
  ctx: CanvasRenderingContext2D
  config: CanvasLayoutConfig
  bg: string
}) {
  const { ctx, bg } = opts
  const w = ctx.canvas.width
  const h = ctx.canvas.height
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
}

export function drawCodeFrame(opts: {
  ctx: CanvasRenderingContext2D
  config: CanvasLayoutConfig
  layout: LayoutResult
  theme: RenderTheme
  // Optional override tokens list (for animation)
  tokens?: { content: string; color: string; x: number; y: number; opacity: number }[]
  // Optional gutter override (for animation)
  showLineNumbers?: boolean
  startLine?: number
  lineCount?: number
}) {
  const { ctx, config, layout } = opts

  clearAndPaintBackground({ ctx, config, bg: layout.bg })

  // Card background
  const cardX = 32
  const cardY = 32
  const cardW = ctx.canvas.width - 64
  const cardH = ctx.canvas.height - 64
  const cardBg = opts.theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(17,24,39,0.03)"
  const cardBorder = opts.theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(17,24,39,0.10)"

  roundedRectPath(ctx, cardX, cardY, cardW, cardH, 18)
  ctx.fillStyle = cardBg
  ctx.fill()
  ctx.strokeStyle = cardBorder
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.save()
  ctx.beginPath()
  roundedRectPath(ctx, cardX, cardY, cardW, cardH, 18)
  ctx.clip()

  // Gutter (line numbers)
  const gutterEnabled = opts.showLineNumbers ?? layout.gutter.enabled
  const gutterWidth = gutterEnabled ? layout.gutter.width : 0

  if (gutterEnabled && gutterWidth > 0) {
    const x0 = config.paddingX
    const y0 = config.paddingY
    const h = cardH - (config.paddingY - (cardY + 0))

    ctx.fillStyle = opts.theme === "dark" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.40)"
    ctx.fillRect(x0, y0 - 8, gutterWidth + 12, h)

    ctx.strokeStyle = layout.gutter.dividerColor
    ctx.beginPath()
    ctx.moveTo(x0 + gutterWidth + 8, y0 - 8)
    ctx.lineTo(x0 + gutterWidth + 8, y0 - 8 + h)
    ctx.stroke()

    const startLine = opts.startLine ?? config.startLine
    const lineCount = opts.lineCount ?? Math.round((cardH - config.paddingY * 2) / config.lineHeight)
    ctx.font = `${config.fontSize}px ${config.fontFamily}`
    ctx.textBaseline = "top"
    ctx.fillStyle = layout.gutter.textColor
    for (let i = 0; i < lineCount; i++) {
      const n = startLine + i
      const label = String(n)
      const y = config.paddingY + i * config.lineHeight
      const w = ctx.measureText(label).width
      ctx.globalAlpha = 0.9
      ctx.fillText(label, config.paddingX + gutterWidth - 16 - w, y)
    }
  }

  ctx.font = `${config.fontSize}px ${config.fontFamily}`
  ctx.textBaseline = "top"

  const tokensToDraw =
    opts.tokens ??
    layout.tokens.map((t) => ({
      content: t.content,
      color: t.color,
      x: t.x,
      y: t.y,
      opacity: 1,
    }))

  for (const t of tokensToDraw) {
    if (!t.content) continue
    ctx.globalAlpha = Math.max(0, Math.min(1, t.opacity))
    ctx.fillStyle = t.color
    ctx.fillText(t.content, t.x, t.y)
  }

  ctx.restore()
  ctx.globalAlpha = 1
}


