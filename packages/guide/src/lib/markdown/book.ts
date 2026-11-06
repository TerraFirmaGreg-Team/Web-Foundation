import type {
  GuideIndex,
  GuidePage,
  GuidePagePayload,
} from '@terrafirmagreg-team/guide/types';
import { guideBookHref } from '@terrafirmagreg-team/guide/lib/nav/paths';
import type { GuideMarkdownCtx } from './ctx';
import { guidePageMarkdown } from './page';
import { guideTextMarkdown } from './text';

export function guideEntryMarkdown(
  entry: { name?: string; pages?: GuidePage[] },
  ctx: GuideMarkdownCtx,
  payload?: Pick<GuidePagePayload, 'extras'>,
): string {
  const body = (entry.pages ?? [])
    .map((page) => guidePageMarkdown(page, ctx, payload))
    .filter(Boolean)
    .join('\n\n');
  return `# ${entry.name ?? 'Guide Entry'}\n\n${body}\n`;
}

export function guideOverviewMarkdown(
  overview: GuideIndex,
  ctx: GuideMarkdownCtx,
): string {
  const parts: string[] = [`# ${overview.book?.name ?? overview.bookId ?? 'Guide'}`];
  if (overview.book?.landingText) {
    const md = guideTextMarkdown(overview.book.landingText, ctx);
    if (md) parts.push(md);
  }
  for (const cat of overview.categories) {
    parts.push(`## ${cat.name}`);
    const items = cat.entries.map((ref) => {
      const href = guideBookHref(
        ctx.dataset,
        undefined,
        overview.modId,
        overview.bookPath ?? '',
        ref.id,
      );
      return `- [${ref.name}](${href})`;
    });
    if (items.length) parts.push(items.join('\n'));
  }
  return `${parts.filter(Boolean).join('\\')}\n`;
}

export function guideCategoryMarkdown(
  overview: GuideIndex,
  categoryId: string,
  ctx: GuideMarkdownCtx,
): string {
  const cat = overview.categories.find((item) => item.id === categoryId);
  if (!cat) return '';
  const parts: string[] = [`# ${cat.name}`];
  if (cat.description) {
    const md = guideTextMarkdown(cat.description, ctx);
    if (md) parts.push(md);
  }
  const items = cat.entries.map((ref) => {
    const href = guideBookHref(
      ctx.dataset,
      undefined,
      overview.modId,
      overview.bookPath ?? '',
      ref.id,
    );
    return `- [${ref.name}](${href})`;
  });
  if (items.length) parts.push(items.join('\n'));
  return `${parts.filter(Boolean).join('\\')}\n`;
}

