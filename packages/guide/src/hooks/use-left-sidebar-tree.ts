'use client';
import type * as PageTree from 'fumadocs-core/page-tree';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { useLocationSearchParams } from '@terrafirmagreg-team/ui/hooks/page/use-location-search';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { useLastValue } from '@terrafirmagreg-team/ui/hooks/use-last-value';
import { skeletonTree } from '@terrafirmagreg-team/ui/lib/tree';
import { useGuideTree } from '@terrafirmagreg-team/guide/hooks/use-tree';
import { guideQueryFromParams } from '@terrafirmagreg-team/guide/lib/nav/query';

export function useGuideLeftSidebarTree(
  tree: PageTree.Root,
  dataset?: DatasetRef,
): PageTree.Root {
  const lang = useResolvedLang();
  const { bookId } = guideQueryFromParams(useLocationSearchParams());
  const result = useGuideTree(dataset, lang, bookId);
  const runtime = useLastValue(result.value, dataset?.id ?? '');
  if (!runtime && result.pending) return skeletonTree();
  return runtime ?? tree;
}
