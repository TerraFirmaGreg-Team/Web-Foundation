import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { GuideReferenceContext } from '@terrafirmagreg-team/guide/types';

export type GuideMarkdownCtx = {
  dataset: DatasetRef;
  lang: Lang;
  langMap: Record<string, string>;
  keybinds?: Record<string, string>;
  macros?: Record<string, string>;
  questLinks?: Record<string, { filename: string; questId: string }>;
  categoryByEntry: Map<string, string>;
  entryNames?: Map<string, string>;
  modId: string;
  bookPath: string;
};

export function refCtx(ctx: GuideMarkdownCtx): GuideReferenceContext {
  return {
    dataset: ctx.dataset,
    lang: ctx.lang,
    modId: ctx.modId,
    bookPath: ctx.bookPath,
    categoryByEntry: ctx.categoryByEntry,
    questLinks: ctx.questLinks,
  };
}

