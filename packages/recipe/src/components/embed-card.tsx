'use client';
import { useState } from 'react';
import Link from 'next/link';
import { PagedCard } from '@terrafirmagreg-team/recipe/components/cards/paged-card';
import { FitBox } from '@terrafirmagreg-team/ui/components/blocks/fit-box';
import { recipeHref } from '@terrafirmagreg-team/recipe/lib/links';
import { recipeCardImageUrl } from '@terrafirmagreg-team/recipe/lib/links';
import { recipeImageUrl } from '@terrafirmagreg-team/dump/lib/dump/assets/urls';
import { recipeTitle } from '@terrafirmagreg-team/recipe/lib/data/parse';
import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';
import type { EmbedRecipeCardProps } from '@terrafirmagreg-team/kit/types/embeds';

export function RecipeEmbedCard({
  id,
  recipe,
  dataset,
  lang,
  langMap,
}: EmbedRecipeCardProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  const full = recipe as unknown as Recipe;
  const src = recipeImageUrl(dataset, full) ?? recipeCardImageUrl(dataset, id);
  if (!src) return null;
  const title = recipeTitle(full, langMap);
  return (
    <Link
      href={recipeHref(dataset, lang, { id })}
      className="not-prose block w-fit max-w-full"
    >
      <FitBox w={full.w ?? 0}>
        <PagedCard
          recipe={full}
          dataset={dataset}
          lang={lang}
          langMap={langMap}
          title={title}
          src={src}
          onFail={() => setFailed(true)}
        />
      </FitBox>
    </Link>
  );
}
