'use client';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import type * as PageTree from 'fumadocs-core/page-tree';
import { useLocationSearchParams } from '@terrafirmagreg-team/ui/hooks/page/use-location-search';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { useLastValue } from '@terrafirmagreg-team/ui/hooks/use-last-value';
import { useGuideTree } from '@terrafirmagreg-team/guide/hooks/use-tree';
import { guideQueryFromParams } from '@terrafirmagreg-team/guide/lib/nav/query';
import { parseSectionLocation } from '@terrafirmagreg-team/sites/location';

export function useGuideLeftSidebarTree(tree: PageTree.Root): PageTree.Root {
  const { dataset: datasetId } = parseSectionLocation(usePathname());
  const lang = useResolvedLang();
  const params = useLocationSearchParams();
  const { bookId } = guideQueryFromParams(params);
  const version = params.get('version') ?? undefined;
  const dataset = useMemo(
    () => (datasetId ? { id: datasetId, version } : undefined),
    [datasetId, version],
  );
  const runtime = useLastValue(
    useGuideTree(dataset, lang, bookId),
    dataset?.id ?? '',
  );
  return runtime ?? tree;
}

