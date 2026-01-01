export type MagicMoveStepMeta = {
  lines: boolean;
  startLine: number;
};

export type MagicMoveStep = {
  lang: string;
  code: string;
  meta: MagicMoveStepMeta;
};

export type SimpleStep = {
  code: string;
};
