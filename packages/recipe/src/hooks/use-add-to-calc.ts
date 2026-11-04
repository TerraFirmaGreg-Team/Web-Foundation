'use client';

import { useCallback } from 'react';
import {
  decodeCalcState,
  encodeCalcState,
} from '@terrafirmagreg-team/recipe/lib/calc/tree';
import { recipeCalcHref } from '@terrafirmagreg-team/recipe/lib/links';
import { replaceUrlState } from '@terrafirmagreg-team/ui/lib/utils/history';
import type { RecipeSession } from '@terrafirmagreg-team/recipe/types';

export function useAddToCalc(session: RecipeSession) {
  const { dataset, lang, tree } = session;
  return useCallback(
    (item: string, kind: 'item' | 'fluid') => {
      const state = decodeCalcState(tree ?? '') ?? {
        cards: [],
        wires: [],
        tagSelections: {},
      };
      const existing = state.cards.find(
        (card) => card.materialId === item && card.kind === kind,
      );
      const cards = existing
        ? state.cards.map((card) =>
            card === existing
              ? { ...card, crafts: card.crafts + 1 }
              : card,
          )
        : [
            ...state.cards,
            {
              id: `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
              materialId: item,
              kind,
              recipeId: null,
              crafts: 1,
            },
          ];
      replaceUrlState(
        recipeCalcHref(
          dataset,
          lang,
          encodeCalcState({ ...state, cards }),
        ),
      );
    },
    [tree, dataset, lang],
  );
}

