'use client';

import { Calculator, Check, Copy } from 'lucide-react';
import { ItemRow } from '@terrafirmagreg-team/ui/components/blocks/list/row';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { CopyIdMenu } from '@terrafirmagreg-team/game/components/entry/copy-id-menu';
import { ButtonCopy } from '@terrafirmagreg-team/recipe/components/button-copy';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { recipeItemName } from '@terrafirmagreg-team/recipe/lib/client-index';
import { RECIPE_ALL_TYPE } from '@terrafirmagreg-team/recipe/lib/links';
import type { RecipeSession } from '@terrafirmagreg-team/recipe/types';

export function PlaceHeader({
  session,
  overline,
}: {
  session: RecipeSession;
  overline?: string;
}) {
  const t = useTranslations();
  const { lang, index, names, place, dataset } = session;
  const isCalc = place?.kind === 'calc';
  const placeId = place?.kind === 'type' ? place.id : undefined;
  const category = placeId
    ? index?.categories?.find((row) => row.id === placeId)
    : undefined;
  const title = isCalc
    ? t('Calculator', { note: 'recipe.calculator' })
    : placeId
      ? recipeItemName(names, lang, placeId)
      : '';
  return (
    <ItemRow
      layout="header"
      media={
        isCalc ? (
          <Calculator className="size-8 text-muted-foreground" />
        ) : category?.icon ? (
          <CopyIdMenu id={placeId ?? ''}>
            <Entry
              dataset={dataset}
              reference={category.icon}
              name={title}
              size="lg"
              href={false}
              tooltip={false}
              variant="chip"
            />
          </CopyIdMenu>
        ) : undefined
      }
      overline={overline}
      title={title}
      titleClassName="truncate"
      code={
        placeId && placeId !== RECIPE_ALL_TYPE ? (
          <span className="inline-flex max-w-full items-center gap-0.5">
            <span className="truncate">{placeId}</span>
            <ButtonCopy
              value={placeId}
              title={t('Copy id', { note: 'recipe.copy' })}
              aria-label={t('Copy id', { note: 'recipe.copy' })}
              copy={<Copy className="size-3" />}
              copied={<Check className="size-3" />}
            />
          </span>
        ) : undefined
      }
    />
  );
}

