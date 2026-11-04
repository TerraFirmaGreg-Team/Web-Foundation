'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import Link from 'next/link';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { EntryTooltip } from '@terrafirmagreg-team/game/components/entry/tooltip';
import { tooltipLoadKind } from '@terrafirmagreg-team/game/lib/entry/entry';
import { recipeItemName } from '@terrafirmagreg-team/recipe/lib/client-index';
import {
  recipeCardImageUrl,
  recipeHref,
} from '@terrafirmagreg-team/recipe/lib/links';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@terrafirmagreg-team/ui/components/ui/tooltip';
import { Badge } from '@terrafirmagreg-team/ui/components/ui/badge';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { ReferenceKind } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { RecipeFavorite, RecipeHrefOpts } from '@terrafirmagreg-team/recipe/types';

const TAG_SEGMENT_KIND: Record<string, ReferenceKind> = {
  item: 'itemTag',
  block: 'blockTag',
  fluid: 'fluidTag',
  entity_type: 'entityTag',
};

function favoriteIconKind(fav: RecipeFavorite): ReferenceKind {
  if (fav.icon?.startsWith('#')) {
    return TAG_SEGMENT_KIND[fav.id.split('/')[1] ?? ''] ?? 'itemTag';
  }
  return 'item';
}

export function RecipeFavoriteCell({
  dataset,
  lang,
  names,
  nav,
  fav,
}: {
  dataset: DatasetRef;
  lang: Lang;
  names: Record<string, Record<string, string>>;
  nav: RecipeHrefOpts;
  fav: RecipeFavorite;
}) {
  const src = recipeCardImageUrl(dataset, fav.id);
  const iconKind = favoriteIconKind(fav);
  const itemName = fav.icon ? recipeItemName(names, lang, fav.icon) : fav.id;
  const href = recipeHref(dataset, lang, {
    ...nav,
    type: fav.type,
    id: fav.id,
    item: undefined,
    fluid: undefined,
    relation: undefined,
    rpage: undefined,
  });
  const cardImg = src ? (
    // eslint-disable-next-line @next/next/no-img-element -- dump asset
    <img
      src={src}
      alt={fav.id}
      loading="lazy"
      decoding="async"
      className="max-h-24 rounded-sm"
    />
  ) : null;
  const link = (
    <Link href={href} aria-label={itemName} className="block rounded-sm">
      {fav.icon ? (
        <Entry
          id={fav.icon}
          kind={iconKind}
          name={itemName}
          size="lg"
          variant="chip"
          href={false}
          tooltip={false}
          badge={
            <Badge className="h-auto rounded-sm px-0.5 py-0 text-3xs leading-tight">
              R
            </Badge>
          }
        />
      ) : src ? (
        // eslint-disable-next-line @next/next/no-img-element -- dump asset
        <img
          src={src}
          alt={fav.id}
          className="h-9 rounded-sm"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className="block max-w-9 truncate rounded-sm bg-muted px-1 text-2xs">
          {fav.id}
        </span>
      )}
    </Link>
  );
  if (fav.icon) {
    return (
      <EntryTooltip
        dataset={dataset}
        id={fav.icon.replace(/^#+/, '')}
        name={itemName}
        kind={tooltipLoadKind(iconKind)}
        lang={lang}
        footer={cardImg}
      >
        {link}
      </EntryTooltip>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger render={link} delay={150} closeDelay={100} />
      <TooltipContent className="flex-col items-start gap-1.5 p-2.5">
        <p className="text-sm font-medium">{itemName}</p>
        {cardImg}
      </TooltipContent>
    </Tooltip>
  );
}

