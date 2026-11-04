'use client';

import { AlloyStackBar } from '@terrafirmagreg-team/recipe/components/views/alloy/stack-bar';
import { useMixState } from '@terrafirmagreg-team/recipe/hooks/alloy/use-mix-state';
import { MixTotal } from './total';
import { RatioPanel } from './ratio';
import { MixRows } from './rows';
import { MixStatus } from './status';
import type { AlloyRecipe } from '@terrafirmagreg-team/recipe/types/alloy';
import type { RecipeSession } from '@terrafirmagreg-team/recipe/types';

export function AlloyMix({
  recipe,
  session,
}: {
  recipe: AlloyRecipe;
  session: RecipeSession;
}) {
  const state = useMixState(recipe, session);

  return (
    <div className="space-y-4">
      <MixTotal state={state} components={recipe.components} />
      <RatioPanel state={state} components={recipe.components} />
      <AlloyStackBar
        rows={state.mix.rows}
        colors={state.colors}
        label={state.mixLabel}
      />
      <MixRows state={state} components={recipe.components} />
      <MixStatus state={state} />
    </div>
  );
}

