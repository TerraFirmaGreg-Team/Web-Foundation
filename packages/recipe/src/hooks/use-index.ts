'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

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
  const key = `${dataset ? `${dataset.id}/${dataset.version ?? ''}` : ''} ${lang}`;

  useAsyncEffect(async (isCancelled) => {
    if (!dataset) return;
    const skeleton = await loadRecipeSkeletonIndex(dataset);
    if (isCancelled()) return;
    setLoaded({ key, index: skeleton });
    publishRecipeIndex(dataset, lang, skeleton);
    const chrome = await loadRecipeChromeClient(dataset, lang);
    const index = await loadRecipeCompactIndex(dataset, chrome);
    if (isCancelled()) return;
    startTransition(() => {
      setLoaded({ key, index });
      setComplete(key);
      setLastFull(index);
    });
    publishRecipeIndex(dataset, lang, index);
    const entityNames = await loadRecipeEntityNames(dataset, chrome, lang);
    if (isCancelled()) return;
    publishRecipeIndex(dataset, lang, {
      ...index,
      names: {
        ...index.names,
        [lang]: { ...entityNames, ...index.names[lang] },
      },
    });
    setWarmKey(key);
  }, [dataset, lang, nonce, key]);

  useAsyncEffect(async (isCancelled) => {
    if (!dataset || warmKey !== key) return;
    for (const entry of locales.filter((item) => item !== lang)) {
      await idle();
      if (isCancelled()) return;
      const other = await loadRecipeChromeClient(dataset, entry);
      if (isCancelled()) return;
      await loadRecipeCompactIndex(dataset, other);
    }
  }, [dataset, lang, locales, warmKey, key]);

  const active = loaded?.key === key ? loaded.index : null;
  const index = active?.items.length ? active : (lastFull ?? active);
  return { index, indexLoading: complete !== key };
}

