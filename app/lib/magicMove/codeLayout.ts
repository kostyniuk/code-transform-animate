import type { TokenLine } from "./shikiHighlighter";

export type RenderTheme = "light" | "dark";

export type CanvasLayoutConfig = {
  canvasWidth: number;
  canvasHeight: number;
  paddingX: number;
  paddingY: number;
  lineHeight: number;
  fontSize: number;
  fontFamily: string;
  showLineNumbers: boolean;
  startLine: number;
};

export type LaidToken = {
  key: string;
  content: string;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type LayoutResult = {
  tokens: LaidToken[];
  bg: string;
  fg: string;
  gutter: {
    enabled: boolean;
    width: number;
    color: string;
    dividerColor: string;
    textColor: string;
  };
};

export function makeDefaultLayoutConfig(): CanvasLayoutConfig {
  return {
    canvasWidth: 1920,
    canvasHeight: 1080, // Will be overridden by calculateCanvasHeight when needed
    paddingX: 64,
    paddingY: 64,
    lineHeight: 40,
    fontSize: 26,
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    showLineNumbers: false,
    startLine: 1,
  };
}

/**
 * Calculate the minimum canvas height needed to display all lines.
 * Ensures all content is visible without clipping.
 * Adds one extra line height at the bottom for visual spacing.
 */
export function calculateCanvasHeight(opts: {
  lineCount: number;
  lineHeight: number;
  paddingY: number;
  minHeight?: number;
}): number {
  const { lineCount, lineHeight, paddingY, minHeight = 1080 } = opts;
  const contentHeight = lineCount * lineHeight;
  const extraBottomSpace = lineHeight; // One empty line at bottom
  const totalHeight = contentHeight + paddingY * 2 + extraBottomSpace;
  return Math.max(minHeight, totalHeight);
}

function measureCharWidth(ctx: CanvasRenderingContext2D): number {
  // For monospace fonts, a single representative glyph is enough.
  return ctx.measureText("M").width;
}

//Layouts the token lines to the canvas.
//Paints the tokens to the canvas.
export function layoutTokenLinesToCanvas(opts: {
  ctx: CanvasRenderingContext2D;
  tokenLines: TokenLine[];
  bg: string;
  theme: RenderTheme;
  config: CanvasLayoutConfig;
}): LayoutResult {
  const { ctx, tokenLines, config, theme } = opts;

  ctx.font = `${config.fontSize}px ${config.fontFamily}`;
  ctx.textBaseline = "top";

  const charW = measureCharWidth(ctx);

  const lineCount = tokenLines.length;
  const lastLineNumber = config.startLine + Math.max(0, lineCount - 1);
  const digits = String(lastLineNumber).length;

  const gutterEnabled = config.showLineNumbers;
  const gutterPadding = gutterEnabled ? 16 : 0;
  const gutterWidth = gutterEnabled ? Math.ceil(digits * charW + gutterPadding * 2) : 0;

  const fg = theme === "dark" ? "#e5e7eb" : "#111827";
  const lineNoColor = theme === "dark" ? "#94a3b8" : "#6b7280";
  const dividerColor = theme === "dark" ? "rgba(148,163,184,0.35)" : "rgba(107,114,128,0.35)";

  const tokens: LaidToken[] = [];
  let globalIndex = 0;

  for (let i = 0; i < tokenLines.length; i++) {
    const line = tokenLines[i]!;
    let col = 0;

    const y = config.paddingY + i * config.lineHeight;
    const x0 = config.paddingX + gutterWidth + (gutterEnabled ? 12 : 0);

    for (const t of line.tokens) {
      const content = t.content.replace(/\t/g, "  ");
      const w = content.length * charW;
      tokens.push({
        key: `${content}#${globalIndex++}`,
        content,
        color: t.color,
        x: x0 + col * charW,
        y,
        w,
        h: config.lineHeight,
      });
      col += content.length;
    }
  }

  return {
    tokens,
    bg: opts.bg,
    fg,
    gutter: {
      enabled: gutterEnabled,
      width: gutterWidth,
      color: "transparent",
      dividerColor,
      textColor: lineNoColor,
    },
  };
}
