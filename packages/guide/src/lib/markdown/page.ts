import type {
  GuidePage,
  GuidePagePayload,
} from '@terrafirmagreg-team/guide/types';
import { classify, isIndexPage, pageTexts } from '@terrafirmagreg-team/guide/lib/page-kind';
import { guideLink } from '@terrafirmagreg-team/guide/lib/reference';
import { bareId } from '@terrafirmagreg-team/guide/lib/paths';
import { guideEmbeds } from '@terrafirmagreg-team/guide/lib/embeds';
import { texturePublicUrl } from '@terrafirmagreg-team/dump/lib/dump/assets/urls';
import { collectItemIds } from '@terrafirmagreg-team/guide/lib/data/parse';
import { stackDisplayName } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { type GuideMarkdownCtx, refCtx } from './ctx';
import { guideTextMarkdown } from './text';
import { tableMarkdown } from './table';

function blockTitle(page: GuidePage): string {
  return typeof page.title === 'string' && page.title
    ? page.title
    : typeof page.name === 'string'
      ? page.name
      : '';
}

export function guidePageMarkdown(
  page: GuidePage,
  ctx: GuideMarkdownCtx,
  payload?: Pick<GuidePagePayload, 'extras'>,
): string {
  const kind = classify(page.type);
  const title = blockTitle(page);
  const parts: string[] = [];
  if (title && kind !== 'text') parts.push(`### ${title}`);

  switch (kind) {
    case 'empty':
      break;
    case 'text': {
      if (title) parts.push(`### ${title}`);
      if (isIndexPage(page, ctx.langMap)) {
        for (const raw of pageTexts(page)) {
          const lines = guideTextMarkdown(raw, ctx).split('\n').filter(Boolean);
          parts.push(lines.map((l) => (l.startsWith('- ') ? l : `- ${l}`)).join('\n'));
        }
      } else {
        for (const raw of pageTexts(page)) {
          const md = guideTextMarkdown(raw, ctx);
          if (md) parts.push(md);
        }
      }
      break;
    }
    case 'image': {
      const images = [
        ...(page.images ?? []),
        ...(typeof page.image === 'string' ? [page.image] : []),
      ];
      for (const id of images) {
        const url = texturePublicUrl(ctx.dataset, id);
        if (url) parts.push(`![${title || id}](${url})`);
      }
      for (const raw of pageTexts(page)) parts.push(guideTextMarkdown(raw, ctx));
      break;
    }
    case 'recipe': {
      const ids = [
        ...(page.recipes ?? []),
        ...(typeof page.recipe === 'string' ? [page.recipe] : []),
      ];
      for (const id of ids) {
        const recipe = payload?.extras?.recipes[id];
        const label = recipe ? guideEmbeds().recipe?.title(recipe, ctx.langMap) : id;
        parts.push(`- [${label}](${guideEmbeds().recipe?.href(ctx.dataset, undefined, { id })})`);
      }
      for (const raw of pageTexts(page)) parts.push(guideTextMarkdown(raw, ctx));
      break;
    }
    case 'spotlight': {
      const ids = collectItemIds(page.item);
      for (const id of ids) {
        const name = stackDisplayName(ctx.langMap, id, 'item');
        parts.push(`**${name}**`);
      }
      for (const raw of pageTexts(page)) parts.push(guideTextMarkdown(raw, ctx));
      break;
    }
    case 'entity': {
      const id = typeof page.entity === 'string' ? page.entity : '';
      const name =
        (id ? payload?.extras?.entityNames[id] : undefined) ??
        (id ? stackDisplayName(ctx.langMap, id, 'entity') : id);
      if (name) parts.push(`**${name}**`);
      for (const raw of pageTexts(page)) parts.push(guideTextMarkdown(raw, ctx));
      break;
    }
    case 'multiblock':
    case 'multimultiblock': {
      for (const raw of pageTexts(page)) parts.push(guideTextMarkdown(raw, ctx));
      break;
    }
    case 'link': {
      const target = page.url || page.link || page.entry;
      const label =
        (typeof page.link_text === 'string' && page.link_text) ||
        (typeof page.text === 'string' && page.text) ||
        target ||
        '';
      const { href } = guideLink(
        { link: typeof target === 'string' ? target : undefined },
        refCtx(ctx),
      );
      parts.push(href ? `[${label}](${href})` : label);
      break;
    }
    case 'relations': {
      for (const target of page.entries ?? []) {
        const { href } = guideLink({ link: target }, refCtx(ctx));
        const label =
          ctx.entryNames?.get(target) ??
          ctx.entryNames?.get(bareId(target)) ??
          target;
        parts.push(`- [${label}](${href ?? ''})`);
      }
      break;
    }
    case 'quest': {
      const id = page.trigger || page.quest || page.link || '';
      const { href } = guideLink({ link: id }, refCtx(ctx));
      const hit = id ? ctx.questLinks?.[id] : undefined;
      const url =
        href ??
        (hit
          ? guideEmbeds().quest?.href(ctx.dataset, undefined, {
              category: hit.filename,
              id: hit.questId,
            })
          : undefined);
      parts.push(url ? `- [${id}](${url})` : `- ${id}`);
      for (const raw of pageTexts(page)) parts.push(guideTextMarkdown(raw, ctx));
      break;
    }
    case 'table': {
      const md = tableMarkdown(page, ctx);
      if (md) parts.push(md);
      break;
    }
    default: {
      for (const raw of pageTexts(page)) parts.push(guideTextMarkdown(raw, ctx));
      break;
    }
  }
  return parts.filter(Boolean).join('\n\n');
}

