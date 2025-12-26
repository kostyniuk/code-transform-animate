export type MagicMoveStepMeta = {
  lines: boolean
  startLine: number
}

export type MagicMoveStep = {
  lang: string
  code: string
  meta: MagicMoveStepMeta
}

export type MagicMoveBlock = {
  /** Either Slidev-style `shiki-magic-move` or `md magic-move` */
  kind: "md magic-move" | "shiki-magic-move"
  outerMeta: MagicMoveStepMeta
  steps: MagicMoveStep[]
  errors: string[]
}

export type MagicMoveParseResult = {
  blocks: MagicMoveBlock[]
  /** Document-level errors (e.g., no blocks found) */
  errors: string[]
}


