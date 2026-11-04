import {
  parseGuideReference,
  resolveGuideReference,
} from '@terrafirmagreg-team/guide/lib/reference/resolver';
import type {
  GuideReferenceContext,
  PageRendererProps,
} from '@terrafirmagreg-team/guide/types';

export function referenceHref(
  props: PageRendererProps,
  target: string,
): { href: string; external: boolean } | null {
  if (/^https?:\/\//i.test(target)) return { href: target, external: true };
  const reference = resolveGuideReference(parseGuideReference(target), {
    dataset: props.dataset,
    lang: props.lang,
    modId: props.bookModId,
    bookPath: props.bookPath,
    categoryByEntry: props.categoryByEntry,
    questLinks: props.questLinks,
  });
  return reference.href && reference.available
    ? { href: reference.href, external: false }
    : null;
}

export function guideLink(
  node: { link?: string },
  ctx: GuideReferenceContext,
): { href: string | undefined; external: boolean } {
  const target = node.link;
  if (!target) return { href: undefined, external: false };
  if (/^https?:\/\//i.test(target)) return { href: target, external: true };
  const resolved = resolveGuideReference(parseGuideReference(target), ctx);
  return {
    href: resolved.available ? resolved.href : undefined,
    external: false,
  };
}

