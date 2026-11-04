'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PagedCard } from '@terrafirmagreg-team/recipe/components/cards/paged-card';
import { FitBox } from '@terrafirmagreg-team/ui/components/blocks/fit-box';
import { EmptyState } from '@terrafirmagreg-team/ui/components/blocks/page/empty-state';
import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';
import { useAsyncResult } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { useSectionCatalog } from '@terrafirmagreg-team/kit/hooks/use-catalog';
import { useCurrentDataset } from '@terrafirmagreg-team/kit/hooks/use-current-dataset';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { useRecipeIndex } from '@terrafirmagreg-team/recipe/hooks/use-index';
import {
  loadRecipeChromeClient,
  recipeItemName,
  resolveRecipeRows,
} from '@terrafirmagreg-team/recipe/lib/client-index';
import { loadClientRecipe } from '@terrafirmagreg-team/recipe/lib/client/recipe';
import { clientDumpLang } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { recipeTitle } from '@terrafirmagreg-team/recipe/lib/data/parse';
import { recipeImageUrl } from '@terrafirmagreg-team/dump/lib/dump/assets/urls';
import { recipeCardImageUrl, recipeHref } from '@terrafirmagreg-team/recipe/lib/links';

export type RecipeProps = {
  id?: string;
  dataset?: DatasetRef;
  maxH?: number;
};

export function Recipe({
  id,
  dataset: datasetProp,
  maxH = 360,
}: RecipeProps) {
  const catalog = useSectionCatalog();
  const current = useCurrentDataset(catalog.recipe);
  const dataset =
    datasetProp ??
    current ??
    (catalog.recipe[0] ? { id: catalog.recipe[0].id } : undefined);
  const lang = useResolvedLang();
  const router = useRouter();
  const { index, indexLoading } = useRecipeIndex(dataset, lang);
  const [failed, setFailed] = useState(false);

  const { value, pending } = useAsyncResult(
    index && dataset && id
      ? async () => {
          const [row] = await resolveRecipeRows(dataset, index, [id]);
          if (!row) return { missing: true as const };
          const [recipe, chrome, langMap] = await Promise.all([
            loadClientRecipe(dataset, row.id, row.bucket),
            loadRecipeChromeClient(dataset, lang),
            clientDumpLang(dataset, lang),
          ]);
          const title = recipe
            ? recipeTitle(recipe, langMap)
            : recipeItemName(chrome.names, lang, row.out[0] ?? row.id);
          const src =
            (recipe ? recipeImageUrl(dataset, recipe) : undefined) ??
            (row.image
              ? recipeImageUrl(dataset, {
                  modId: row.id.split(':', 1)[0],
                  image: row.image,
                })
              : undefined) ??
            recipeCardImageUrl(dataset, row.id);
          return { row, recipe, langMap, title, src };
        }
      : undefined,
    [dataset, index, id, lang],
  );

  if (!dataset || !id) return null;
  const resolvedRow = value && 'row' in value ? value.row : undefined;
  const type = resolvedRow ? index?.types[resolvedRow.type] : undefined;
  const href = recipeHref(dataset, lang, { id, type });
  if (!value && (pending || indexLoading)) {
    return <Skeleton className="not-prose h-40 w-full max-w-112 rounded-md" />;
  }
  if (!value || 'missing' in value || !value.recipe) {
    return (
      <Link href={href} className="not-prose text-primary underline">
        {id}
      </Link>
    );
  }
  const { row, recipe, langMap, title, src } = value;
  return (
    <div
      role="link"
      tabIndex={0}
      title={title}
      className="not-prose mb-4 block w-fit max-w-full cursor-pointer rounded-md"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('a,button')) return;
        router.push(href);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && event.target === event.currentTarget)
          router.push(href);
      }}
    >
      {src && !failed ? (
        <FitBox w={recipe.w ?? row.d?.w ?? 0}>
          <PagedCard
            recipe={recipe}
            dataset={dataset}
            lang={lang}
            langMap={langMap}
            title={title}
            src={src}
            onFail={() => setFailed(true)}
            naturalW={row.d?.w}
            naturalH={row.d?.h}
            maxH={Number(maxH) || 360}
            interactive
          />
        </FitBox>
      ) : (
        <EmptyState variant="missing">{title}</EmptyState>
      )}
    </div>
  );
}

