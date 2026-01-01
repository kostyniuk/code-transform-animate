import type { CanvasLayoutConfig, LayoutResult, RenderTheme } from "./codeLayout";

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function clearAndPaintBackground(opts: {
  ctx: CanvasRenderingContext2D;
  config: CanvasLayoutConfig;
  bg: string;
}) {
  const { ctx, bg } = opts;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
}

//Draws a code frame to the canvas.
//Paints the background, card background, gutter, and tokens.
export function drawCodeFrame(opts: {
  ctx: CanvasRenderingContext2D;
  config: CanvasLayoutConfig;
  layout: LayoutResult;
  theme: RenderTheme;
  // Optional override tokens list (for animation)
  tokens?: { content: string; color: string; x: number; y: number; opacity: number }[];
  // Optional gutter override (for animation)
  showLineNumbers?: boolean;
  startLine?: number;
  lineCount?: number;
  prevLineCount?: number;
  targetLineCount?: number;
  transitionProgress?: number;
}) {
  const { ctx, config, layout } = opts;

  clearAndPaintBackground({ ctx, config, bg: layout.bg });

  // Card background
  const cardX = 32;
  const cardY = 32;
  const cardW = ctx.canvas.width - 64;
  const cardH = ctx.canvas.height - 64;
  const cardBg = opts.theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(17,24,39,0.03)";
  const cardBorder = opts.theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(17,24,39,0.10)";

  roundedRectPath(ctx, cardX, cardY, cardW, cardH, 18);
  ctx.fillStyle = cardBg;
  ctx.fill();
  ctx.strokeStyle = cardBorder;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  roundedRectPath(ctx, cardX, cardY, cardW, cardH, 18);
  ctx.clip();

  // Gutter (line numbers)
  const gutterEnabled = opts.showLineNumbers ?? layout.gutter.enabled;
  const gutterWidth = gutterEnabled ? layout.gutter.width : 0;

  if (gutterEnabled && gutterWidth > 0) {
    const x0 = config.paddingX;
    const y0 = config.paddingY;
    const h = cardH - (config.paddingY - (cardY + 0));

    ctx.fillStyle = opts.theme === "dark" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.40)";
    ctx.fillRect(x0, y0 - 8, gutterWidth + 12, h);

    ctx.strokeStyle = layout.gutter.dividerColor;
    ctx.beginPath();
    ctx.moveTo(x0 + gutterWidth + 8, y0 - 8);
    ctx.lineTo(x0 + gutterWidth + 8, y0 - 8 + h);
    ctx.stroke();

    const startLine = opts.startLine ?? config.startLine;
    const lineCount =
      opts.lineCount ?? Math.round((cardH - config.paddingY * 2) / config.lineHeight);
    ctx.font = `${config.fontSize}px ${config.fontFamily}`;
    ctx.textBaseline = "top";
    ctx.fillStyle = layout.gutter.textColor;

    // Transition logic for line numbers
    const prevCount = opts.prevLineCount ?? lineCount;
    const targetCount = opts.targetLineCount ?? lineCount;
    const progress = opts.transitionProgress ?? 1;

    for (let i = 0; i < lineCount; i++) {
      let alpha = 0.9;

      // If we are in a transition
      if (opts.transitionProgress !== undefined) {
        const inPrev = i < prevCount;
        const inTarget = i < targetCount;

        if (inPrev && inTarget) {
          // Line exists in both source and target
          alpha = 0.9;
        } else if (!inPrev && inTarget) {
          // Line is appearing (fade in)
          // Use cubic easing for smoother appearance: t^3
          const t = Math.max(0, Math.min(1, progress));
          alpha = 0.9 * (t * t * t);
        } else if (inPrev && !inTarget) {
          // Line is disappearing (fade out)
          const t = Math.max(0, Math.min(1, 1 - progress));
          alpha = 0.9 * (t * t * t);
        } else {
          // Should not happen if loop bound is correct, but safe fallback
          alpha = 0;
        }
      }

      if (alpha < 0.01) continue;

      const n = startLine + i;
      const label = String(n);
      const y = config.paddingY + i * config.lineHeight;
      const w = ctx.measureText(label).width;
      ctx.globalAlpha = alpha;
      ctx.fillText(label, config.paddingX + gutterWidth - 16 - w, y);
    }
  }

  ctx.font = `${config.fontSize}px ${config.fontFamily}`;
  ctx.textBaseline = "top";

  const tokensToDraw =
    opts.tokens ??
    layout.tokens.map((t) => ({
      content: t.content,
      color: t.color,
      x: t.x,
      y: t.y,
      opacity: 1,
    }));

  for (const t of tokensToDraw) {
    if (!t.content) continue;
    ctx.globalAlpha = Math.max(0, Math.min(1, t.opacity));
    ctx.fillStyle = t.color;
    ctx.fillText(t.content, t.x, t.y);
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}
