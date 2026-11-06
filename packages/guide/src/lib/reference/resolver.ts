import { sectionEmbeds } from '@terrafirmagreg-team/kit/lib/embeds';
import {
  bareId,
  guideBookHref,
} from '@terrafirmagreg-team/guide/lib/nav/paths';
import type {
  GuideReference,
  GuideReferenceContext,
  ResolvedGuideReference,
} from '@terrafirmagreg-team/guide/types';

export function parseGuideReference(target: string): GuideReference {
  const [rawId, anchor] = target.replace(/\.json$/i, '').split('#', 2);
  const [prefix, ...rest] = rawId.split(':');
  if ((prefix === 'recipe' || prefix === 'quest') && rest.length) {
    return { kind: prefix, id: rest.join(':'), anchor };
  }
  return { kind: 'guide', id: rawId.replace(/^guide:/, ''), anchor };
}

export function matchGuideEntryKey(
  ids: Iterable<string>,
  query: string,
): string | undefined {
  const keys = ids instanceof Set ? ids : new Set(ids);
  if (keys.has(query)) return query;
  const bare = bareId(query);
  for (const key of keys) {
    if (bareId(key) === bare) return key;
  }
  return undefined;
}

export function resolveGuideReference(
  reference: GuideReference,
  context: GuideReferenceContext,
): ResolvedGuideReference {
  switch (reference.kind) {
    case 'guide': {
      const entryId = matchGuideEntryKey(
        context.categoryByEntry.keys(),
        reference.id,
      );
      return {
        ...reference,
        href: entryId
          ? guideBookHref(
              context.dataset,
              undefined,
              context.modId,
              context.bookPath,
              entryId,
              reference.anchor,
            )
          : guideBookHref(
              context.dataset,
              undefined,
              context.modId,
              context.bookPath,
              bareId(reference.id),
              reference.anchor,
            ),
        available: Boolean(entryId ?? reference.id),
      };
    }
    case 'recipe': {
      const href =
        context.targets?.recipe?.(reference.id) ??
        sectionEmbeds().recipe?.href(context.dataset, undefined, { id: reference.id });
      return { ...reference, href, available: Boolean(href) };
    }
    case 'quest': {
      const hit = context.questLinks?.[reference.id];
      const href = hit
        ? sectionEmbeds().quest?.href(context.dataset, undefined, {
            category: hit.filename,
            id: hit.questId,
          })
        : context.targets?.quest?.(reference.id);
      return { ...reference, href, available: Boolean(href) };
    }
    default: {
      const _exhaustive: never = reference.kind;
      return _exhaustive;
    }
  }
}

