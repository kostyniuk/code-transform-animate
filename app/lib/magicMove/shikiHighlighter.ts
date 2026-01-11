import type { BundledLanguage, Highlighter, SpecialLanguage, ThemedToken } from "shiki";

export type ShikiThemeChoice =
  | "github-light"
  | "github-dark"
  | "nord"
  | "one-dark-pro"
  | "vitesse-dark"
  | "vitesse-light"
  | "vesper";

export const AVAILABLE_THEMES: readonly ShikiThemeChoice[] = [
  "github-light",
  "github-dark",
  "nord",
  "one-dark-pro",
  "vitesse-dark",
  "vitesse-light",
  "vesper",
] as const;

export const AVAILABLE_LANGUAGES = [
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
  "rust",
] as const;

/**
 * Determine if a Shiki theme is light or dark for rendering purposes.
 */
export function getThemeVariant(theme: ShikiThemeChoice): "light" | "dark" {
  const lightThemes: ShikiThemeChoice[] = ["github-light", "vitesse-light"];
  return lightThemes.includes(theme) ? "light" : "dark";
}

export type TokenLine = {
  tokens: { content: string; color: string }[];
};

let highlighterPromise: Promise<Highlighter> | null = null;

async function getHighlighterOnce() {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      const shiki = await import("shiki");
      return await shiki.createHighlighter({
        themes: [
          "github-light",
          "github-dark",
          "nord",
          "one-dark-pro",
          "vitesse-dark",
          "vitesse-light",
          "vesper",
        ],
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
          "rust",
        ],
      });
    })();
  }
  return await highlighterPromise;
}

function normalizeLang(lang: string): string {
  const l = (lang || "").toLowerCase();
  if (l === "js") return "javascript";
  if (l === "ts") return "typescript";
  if (l === "sh") return "shell";
  if (l === "md") return "markdown";
  if (l === "rs") return "rust";
  return l || "text";
}

export async function shikiTokenizeToLines(opts: {
  code: string;
  lang: string;
  theme: ShikiThemeChoice;
}): Promise<{ lines: TokenLine[]; bg: string }> {
  const highlighter = await getHighlighterOnce();

  const themeName = opts.theme;
  const lang = normalizeLang(opts.lang);
  const variant = getThemeVariant(opts.theme);

  const langToken = lang === "text" ? ("text" as SpecialLanguage) : (lang as BundledLanguage);

  let themed: ReturnType<typeof highlighter.codeToTokens>;
  try {
    themed = highlighter.codeToTokens(opts.code, { lang: langToken, theme: themeName });
  } catch {
    themed = highlighter.codeToTokens(opts.code, {
      lang: "text" as SpecialLanguage,
      theme: themeName,
    });
  }
  const lines: TokenLine[] = themed.tokens.map((line: ThemedToken[]) => ({
    tokens: line.map((t) => ({
      content: t.content,
      color: t.color || (variant === "dark" ? "#e5e7eb" : "#111827"),
    })),
  }));

  const bg = themed.bg || (variant === "dark" ? "#0b1021" : "#ffffff");
  return { lines, bg };
}
