'use client';

import { useState } from 'react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { ItemRow } from '@terrafirmagreg-team/ui/components/blocks/list/row';
import { EmptyState } from '@terrafirmagreg-team/ui/components/blocks/page/empty-state';
import { RecipeItemHeader } from '@terrafirmagreg-team/recipe/components/views/browser/recipe-item-header';
import { RecipeFrame } from '@terrafirmagreg-team/recipe/components/views/browser/frame';
import { useToolRecipes } from '@terrafirmagreg-team/recipe/hooks/use-tool-recipes';
import { toAlloyRecipe } from '@terrafirmagreg-team/recipe/lib/alloy/parse';
import { RecipeCard } from '@terrafirmagreg-team/recipe/components/cards/card';
import { FitBox } from '@terrafirmagreg-team/ui/components/blocks/fit-box';
import {
  recipeCardImageUrl,
  recipeImageUrl,
} from '@terrafirmagreg-team/recipe/lib/links';
import { AlloyList } from './list';
import { AlloyMix } from './mix';
import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';
import type { RecipeSession } from '@terrafirmagreg-team/recipe/types';

function AlloyRecipeCard({
  recipe,
  session,
}: {
  recipe: Recipe;
  session: RecipeSession;
}) {
  const [failed, setFailed] = useState(false);
  const src =
    recipeImageUrl(session.dataset, recipe) ??
    recipeCardImageUrl(session.dataset, recipe.id);
  if (!src || failed) return null;
  return (
    <RecipeCard
      recipe={recipe}
      dataset={session.dataset}
      lang={session.lang}
      langMap={session.langMap}
      title={recipe.id}
      src={src}
      onFail={() => setFailed(true)}
      interactive
    />
  );
}

export function AlloyCalculator({ session }: { session: RecipeSession }) {
  const t = useTranslations();
  const { value, pending } = useToolRecipes(
    session,
    'tfc:alloying',
    toAlloyRecipe,
  );
  const activeId = session.recipeId;
  const active =
    value?.find(({ recipe }) => recipe.id === activeId) ??
    (!activeId ? value?.[0] : undefined);
  const loading = session.indexLoading || pending;

  return (
    <>
      <AlloyList session={session} />
      <RecipeFrame
        session={session}
        header={
          active ? (
            <RecipeItemHeader recipe={active.recipe} session={session} />
          ) : (
            <ItemRow layout="header" title={t('Alloys', { note: 'recipe.alloy.title' })} />
          )
        }
      >
        <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto p-2 sm:p-4">
          {loading ? (
            <EmptyState variant="loading" />
          ) : value === undefined ? (
            <EmptyState variant="missing">
              {t('Could not load recipes. Reload the page to retry.', { note: 'recipe.alloy.load_error' })}
            </EmptyState>
          ) : active ? (
            <>
              <AlloyMix
                key={active.recipe.id}
                recipe={active}
                session={session}
              />
              <FitBox w={active.recipe.w ?? 0}>
                <AlloyRecipeCard
                  key={active.recipe.id}
                  recipe={active.recipe}
                  session={session}
                />
              </FitBox>
            </>
          ) : (
            <EmptyState>
              {activeId
                ? t('Recipe not found in this dump. Select another alloy.', {
                    note: 'recipe.alloy.missing',
                  })
                : t('No matching recipes in this dump.', {
                    note: 'recipe.alloy.empty',
                  })}
            </EmptyState>
          )}
        </div>
      </RecipeFrame>
    </>
  );
}

