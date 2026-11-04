'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { Pin, PinOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ContextMenuItem } from '@terrafirmagreg-team/ui/components/ui/context-menu';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import {
  readRecipeDefaults,
  subscribeRecipeDefaults,
  writeRecipeDefault,
} from '@terrafirmagreg-team/recipe/lib/calc/defaults';
export function RecipeDefaultMenuItem({
  dataset,
  materialId,
  recipeId,
}: {
  dataset: DatasetRef;
  materialId?: string;
  recipeId: string;
}) {
  const t = useTranslations();
  const [pinned, setPinned] = useState(
    () => materialId != null && readRecipeDefaults(dataset)[materialId] === recipeId,
  );
  useEffect(
    () =>
      subscribeRecipeDefaults(() => {
        if (materialId != null) {
          setPinned(readRecipeDefaults(dataset)[materialId] === recipeId);
        }
      }),
    [dataset, materialId, recipeId],
  );
  if (!materialId) return null;
  return (
    <ContextMenuItem
      onClick={() => writeRecipeDefault(dataset, materialId, pinned ? null : recipeId)}
    >
      {pinned ? <PinOff /> : <Pin />}
      {pinned
        ? t('Unpin default recipe', { note: 'recipe.calc.clear.default' })
        : t('Pin as default recipe', { note: 'recipe.calc.set_default' })}
    </ContextMenuItem>
  );
}

