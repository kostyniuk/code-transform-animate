import type { BundledLanguage, Highlighter, SpecialLanguage, ThemedToken } from "shiki"

export type ShikiThemeChoice = "light" | "dark"

export type TokenLine = {
  tokens: { content: string; color: string }[]
}

let highlighterPromise: Promise<Highlighter> | null = null

async function getHighlighterOnce() {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      const shiki = await import("shiki")
      return await shiki.createHighlighter({
        themes: ["github-light", "github-dark"],
        langs: [
          "javascript",
          "typescript",
          "tsx",
          "jsx",
          "json",
          "sql",
          "css",
          "html",
          "markdown",
          "bash",
          "shell",
        ],
      })
    })()
  }
  return await highlighterPromise
}

function normalizeLang(lang: string): string {
  const l = (lang || "").toLowerCase()
  if (l === "js") return "javascript"
  if (l === "ts") return "typescript"
  if (l === "sh") return "shell"
  if (l === "md") return "markdown"
  return l || "text"
}

export async function shikiTokenizeToLines(opts: {
  code: string
  lang: string
  theme: ShikiThemeChoice
}): Promise<{ lines: TokenLine[]; bg: string }> {
  const highlighter = await getHighlighterOnce()

  const themeName = opts.theme === "dark" ? "github-dark" : "github-light"
  const lang = normalizeLang(opts.lang)

  const langToken =
    lang === "text" ? ("text" as SpecialLanguage) : (lang as BundledLanguage)

  let themed: ReturnType<typeof highlighter.codeToTokens>
  try {
    themed = highlighter.codeToTokens(opts.code, { lang: langToken, theme: themeName })
  } catch {
    themed = highlighter.codeToTokens(opts.code, { lang: "text" as SpecialLanguage, theme: themeName })
  }
  const lines: TokenLine[] = themed.tokens.map((line: ThemedToken[]) => ({
    tokens: line.map((t) => ({
      content: t.content,
      color: t.color || (opts.theme === "dark" ? "#e5e7eb" : "#111827"),
    })),
  }))

  const bg = themed.bg || (opts.theme === "dark" ? "#0b1021" : "#ffffff")
  return { lines, bg }
}


