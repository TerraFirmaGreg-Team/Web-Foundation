'use client';
import { useEffect, useState } from 'react';
import type * as PageTree from 'fumadocs-core/page-tree';
import { layoutDeps } from '@terrafirmagreg-team/kit/lib/config';

const cache = new Map<string, Promise<PageTree.Root | null>>();

export function useSectionTree(
  section: string,
  datasetId: string | undefined,
  lang: string,
  required: boolean,
): PageTree.Root | undefined {
  const key = datasetId ? `${section}/${datasetId}/${lang}` : undefined;
  const [state, setState] = useState<{
    key?: string;
    tree?: PageTree.Root;
  }>({});
  useEffect(() => {
    if (!key || !datasetId || !required) return;
    let promise = cache.get(key);
    if (!promise) {
      promise =
        layoutDeps()
          .loadSectionTree?.(section, datasetId, lang)
          .catch(() => null) ?? Promise.resolve(null);
      cache.set(key, promise);
    }
    let alive = true;
    promise.then((root) => {
      if (alive && root) setState({ key, tree: root });
    });
    return () => {
      alive = false;
    };
  }, [key, section, datasetId, lang, required]);
  return state.key === key ? state.tree : undefined;
}
