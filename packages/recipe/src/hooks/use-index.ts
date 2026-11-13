'use client';
import { datasetCacheKey, type DatasetRef } from '@terrafirmagreg-team/sites/location';

import { startTransition, useMemo, useState } from 'react';
import { useLang } from '@terrafirmagreg-team/translate/provider';
import { useAsyncEffect } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { useDumpRetryNonce } from '@terrafirmagreg-team/kit/hooks/use-dump-status';
import {
  loadRecipeChromeClient,
  loadRecipeCompactIndex,
  loadRecipeEntityNames,
  loadRecipeSkeletonIndex,
} from '@terrafirmagreg-team/recipe/lib/client-index';
import { publishRecipeIndex } from '@terrafirmagreg-team/recipe/lib/client-index/store';
import type { RecipeCompactIndex } from '@terrafirmagreg-team/recipe/types';

type LoadedIndex = { key: string; index: RecipeCompactIndex };

function idle(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => resolve(), { timeout: 4000 });
    } else {
      setTimeout(resolve, 1500);
    }
  });
}

export function useRecipeIndex(dataset: DatasetRef | undefined, lang: string) {
  const [loaded, setLoaded] = useState<LoadedIndex | null>(null);
  const [complete, setComplete] = useState<string | null>(null);
  const [lastFull, setLastFull] = useState<RecipeCompactIndex | null>(null);
  const [warmKey, setWarmKey] = useState<string | null>(null);
  const nonce = useDumpRetryNonce();
  const { locales: items } = useLang();
  const locales = useMemo(
    () => items?.map((item) => item.locale) ?? [lang],
    [items, lang],
  );
  const key = dataset ? datasetCacheKey(dataset, lang) : '';

  useAsyncEffect(async (isCancelled) => {
    if (!dataset) return;
    const skeleton = await loadRecipeSkeletonIndex(dataset).catch(
      () => undefined,
    );
    if (!skeleton || isCancelled()) {
      if (!isCancelled()) setComplete(key);
      return;
    }
    setLoaded({ key, index: skeleton });
    publishRecipeIndex(dataset, lang, skeleton);
    const chrome = await loadRecipeChromeClient(dataset, lang).catch(
      () => undefined,
    );
    const index = chrome
      ? await loadRecipeCompactIndex(dataset, chrome).catch(() => undefined)
      : undefined;
    if (!chrome || !index || isCancelled()) {
      if (!isCancelled()) setComplete(key);
      return;
    }
    startTransition(() => {
      setLoaded({ key, index });
      setComplete(key);
      setLastFull(index);
    });
    publishRecipeIndex(dataset, lang, index);
    const entityNames = await loadRecipeEntityNames(
      dataset,
      chrome,
      lang,
    ).catch(() => null);
    if (isCancelled()) return;
    if (entityNames) {
      publishRecipeIndex(dataset, lang, {
        ...index,
        names: {
          ...index.names,
          [lang]: { ...entityNames, ...index.names[lang] },
        },
      });
    }
    setWarmKey(key);
  }, [dataset, lang, nonce, key]);

  useAsyncEffect(async (isCancelled) => {
    if (!dataset || warmKey !== key) return;
    const conn = (
      navigator as Navigator & {
        connection?: { effectiveType?: string; saveData?: boolean };
      }
    ).connection;
    if (
      conn?.saveData ||
      (conn?.effectiveType && conn.effectiveType !== '4g')
    )
      return;
    for (const entry of locales.filter((item) => item !== lang)) {
      await idle();
      if (isCancelled()) return;
      const other = await loadRecipeChromeClient(dataset, entry).catch(
        () => null,
      );
      if (isCancelled()) return;
      if (!other) continue;
      await loadRecipeCompactIndex(dataset, other).catch(() => null);
    }
  }, [dataset, lang, locales, warmKey, key]);

  const active = loaded?.key === key ? loaded.index : null;
  const index = active?.items.length ? active : (lastFull ?? active);
  return { index, indexLoading: complete !== key };
}
