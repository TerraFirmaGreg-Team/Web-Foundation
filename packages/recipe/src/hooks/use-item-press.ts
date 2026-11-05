'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { startTransition, useCallback, useEffect, useRef } from 'react';
import {
  calcStorageKey,
  readCalcStorage,
  writeCalcStorage,
} from '@terrafirmagreg-team/recipe/lib/calc/storage';
import { requestCalcFocus } from '@terrafirmagreg-team/recipe/lib/calc/focus';
import { recipeHref } from '@terrafirmagreg-team/recipe/lib/links';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { replaceUrlState } from '@terrafirmagreg-team/ui/lib/utils/history';
import type { RecipeHrefOpts } from '@terrafirmagreg-team/recipe/types';

export function useItemPress({
  dataset,
  nav,
  isCalc,
}: {
  dataset: DatasetRef;
  nav: RecipeHrefOpts;
  isCalc: boolean;
}) {
  const resolved = useResolvedLang();
  const pressRef = useRef<(id: string, ref?: 'item' | 'fluid') => void>(
    () => {},
  );
  useEffect(() => {
    pressRef.current = (id: string, ref?: 'item' | 'fluid') => {
      startTransition(() => {
        if (isCalc) {
          const key = calcStorageKey('recipe', dataset);
          const parsed = readCalcStorage(key) ?? {
            cards: [],
            wires: [],
            tagSelections: {},
          };
          const kind = ref === 'fluid' ? ('fluid' as const) : ('item' as const);
          const same = parsed.cards.findIndex(
            (row) => row.materialId === id && row.kind === kind,
          );
          const cards =
            same >= 0
              ? parsed.cards.map((row, index) =>
                  index === same ? { ...row, crafts: row.crafts + 1 } : row,
                )
              : [
                  ...parsed.cards,
                  {
                    id: `c${Date.now().toString(36)}${Math.random()
                      .toString(36)
                      .slice(2, 4)}`,
                    materialId: id,
                    kind,
                    recipeId: null,
                    crafts: 1,
                  },
                ];
          writeCalcStorage(key, {
            cards,
            wires: parsed.wires,
            tagSelections: parsed.tagSelections,
          });
          requestCalcFocus(id);
          return;
        }
        replaceUrlState(
          recipeHref(dataset, resolved, {
            ...nav,
            type: undefined,
            tool: undefined,
            item: ref === 'fluid' ? undefined : id,
            fluid: ref === 'fluid' ? id : undefined,
            id: undefined,
            relation: undefined,
            rpage: undefined,
          }),
        );
      });
    };
  });
  return useCallback(
    (id: string, ref?: 'item' | 'fluid') => pressRef.current(id, ref),
    [],
  );
}

